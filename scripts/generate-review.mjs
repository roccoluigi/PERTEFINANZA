import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

// Generate a static review or refresh the static-review index.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const renderStop = Symbol('review markup captured');
const homeRenderStop = Symbol('home markup captured');

function parseArguments(args) {
  if (args.length === 1 && args[0] === '--sync') return { syncOnly: true, all: false, missing: false };
  if (args.length === 1 && args[0] === '--all') return { syncOnly: false, all: true, missing: false };
  if (args.length === 1 && args[0] === '--missing') return { syncOnly: false, all: false, missing: true };
  if (args.length !== 1) {
    throw new Error('Uso: node scripts/generate-review.mjs <ISIN|--all|--missing|--sync>');
  }
  const isin = args[0].toUpperCase();
  if (!/^[A-Z0-9]{12}$/.test(isin)) {
    throw new Error(`Formato ISIN non valido: ${isin}`);
  }

  return { isin, syncOnly: false, all: false, missing: false };
}

function decodeHtmlText(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function htmlText(value) {
  return decodeHtmlText(value.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtmlText(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseIssuers(html) {
  const cards = [...html.matchAll(/<article\b[^>]*class=["'][^"']*\bissuer-card\b[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)];
  if (cards.length === 0) throw new Error('Nessuna scheda emittente trovata in emittenti.html.');

  return cards.map(([, card]) => {
    const nameMatch = card.match(/<h3\b[^>]*class=["'][^"']*\bissuer-name\b[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i);
    const bodyMatch = card.match(/<div\b[^>]*class=["'][^"']*\bissuer-body\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (!nameMatch || !bodyMatch) throw new Error('Scheda emittente senza nome o descrizione in emittenti.html.');

    const ratings = {};
    for (const [, pill] of card.matchAll(/<div\b[^>]*class=["'][^"']*\brating-pill\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi)) {
      const agencyMatch = pill.match(/<span\b[^>]*class=["'][^"']*\brating-agency\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
      const ratingMatch = pill.match(/<span\b[^>]*class=["'][^"']*\brating-val\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
      if (!agencyMatch || !ratingMatch) continue;

      const agency = htmlText(agencyMatch[1]).replace(/:\s*$/, '');
      const rating = htmlText(ratingMatch[1]);
      if (agency && rating && rating.toLowerCase() !== 'n.d.') ratings[agency] = rating;
    }

    const fullDescription = htmlText(bodyMatch[1]);
    const description = fullDescription.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] || fullDescription;
    return {
      name: htmlText(nameMatch[1]),
      ratings,
      description: escapeHtmlText(description)
    };
  });
}

async function loadCertificates() {
  const source = await readFile(path.join(projectRoot, 'js', 'data-certificates.js'), 'utf8');
  return JSON.parse(vm.runInNewContext(`${source}\nJSON.stringify(CERTIFICATES_DATA);`, {}));
}

async function renderReviewMarkup(isin, issuerData) {
  let markup = '';
  const reviewContainer = {
    dataset: {},
    set innerHTML(value) {
      markup = value;
      // Stop after the existing page renderer writes markup, before it binds browser events.
      throw renderStop;
    }
  };
  const document = {
    addEventListener() {},
    getElementById(id) {
      return id === 'review-content-area' ? reviewContainer : null;
    }
  };
  const context = vm.createContext({
    document,
    ISSUERS_DATA: issuerData,
    window: {
      location: {
        href: 'https://roccoluigi.github.io/PERTEFINANZA/recensione.html',
        search: `?isin=${encodeURIComponent(isin)}`
      }
    },
    console,
    URL,
    URLSearchParams,
    Intl,
    setTimeout,
    clearTimeout
  });

  for (const fileName of [
    'js/data-certificates.js',
    'js/data-underlyings.js',
    'js/reviews.js',
    'js/app.js'
  ]) {
    const source = await readFile(path.join(projectRoot, fileName), 'utf8');
    vm.runInContext(source, context, { filename: fileName });
  }

  const certificate = JSON.parse(vm.runInContext(
    `JSON.stringify(CERTIFICATES_DATA.find(item => item.isin === ${JSON.stringify(isin)}) ?? null)`,
    context
  ));
  if (!certificate) throw new Error(`ISIN non presente in data-certificates.js: ${isin}`);
  const issuer = issuerData.find(item => item.name === certificate.issuer || item.name.startsWith(`${certificate.issuer} `));
  if (!issuer) throw new Error(`Emittente "${certificate.issuer}" non trovato in emittenti.html.`);

  try {
    context.initReviewPage();
  } catch (error) {
    if (error !== renderStop) throw error;
  }
  if (!markup) throw new Error(`Impossibile generare la recensione per ${isin}.`);

  return { certificate, markup };
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function readMetaContent(html, attribute, name) {
  const pattern = new RegExp(
    `<meta\\s+${attribute}=["']${name}["']\\s+content=["']([^"']*)["']`,
    'i'
  );
  return html.match(pattern)?.[1] || '';
}

function updateMetaContent(html, attribute, name, content) {
  const pattern = new RegExp(
    `(<meta\\s+${attribute}=["']${name}["']\\s+content=["'])[^"']*(["'][^>]*>)`,
    'i'
  );
  if (!pattern.test(html)) throw new Error(`Meta tag non trovato: ${name}`);
  return html.replace(pattern, (_, prefix, suffix) => `${prefix}${escapeHtmlAttribute(content)}${suffix}`);
}

function setCanonicalLink(html, canonicalUrl) {
  const canonicalTag = `<link rel="canonical" href="${escapeHtmlAttribute(canonicalUrl)}">`;
  const existingTag = /<link\s+rel=["']canonical["'][^>]*>/i;
  if (existingTag.test(html)) return html.replace(existingTag, canonicalTag);
  if (!html.includes('</head>')) throw new Error('Chiusura </head> non trovata in recensione.html.');
  return html.replace('</head>', `  ${canonicalTag}\n</head>`);
}

function buildPage(template, certificate, reviewMarkup) {
  const { isin, name, issuer } = certificate;
  const title = `${name} (${isin}) | PERTEFINANZA`;
  const description = `Analisi del certificato ${name} (ISIN ${isin}), emesso da ${issuer}: struttura, scenari, barriere e rischi.`;
  const originalUrl = readMetaContent(template, 'property', 'og:url');
  if (!originalUrl) throw new Error('URL Open Graph originale non trovato in recensione.html.');
  const canonicalUrl = new URL(`recensioni/recensione-${isin}.html`, originalUrl).href;
  const mainPattern = /(<main\b[^>]*\bid=["']review-content-area["'][^>]*>)[\s\S]*?(<\/main>)/i;
  const mainMatch = template.match(mainPattern);
  if (!mainMatch) throw new Error('Contenitore #review-content-area non trovato in recensione.html.');

  let html = template.replace(mainPattern, (_, openingTag, closingTag) => {
    const staticOpeningTag = openingTag.replace(/>$/, ` data-review-isin="${escapeHtmlAttribute(isin)}">`);
    return `${staticOpeningTag}\n${reviewMarkup}\n${closingTag}`;
  });
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtmlAttribute(title)}</title>`);
  html = updateMetaContent(html, 'name', 'description', description);
  html = updateMetaContent(html, 'property', 'og:title', title);
  html = updateMetaContent(html, 'property', 'og:description', description);
  html = updateMetaContent(html, 'property', 'og:url', canonicalUrl);
  html = updateMetaContent(html, 'name', 'twitter:title', title);
  html = updateMetaContent(html, 'name', 'twitter:description', description);
  html = setCanonicalLink(html, canonicalUrl);
  html = html.replace(/js\/app\.js\?v=20261007-10/g, 'js/app.js?v=20261007-11');
  html = html.replace(
    /^\s*<script\s+src=["']js\/(?:data-certificates|data-issuers|data-underlyings|reviews)\.js(?:\?[^"']*)?["']><\/script>\s*$/gim,
    ''
  );

  return html.replace(/\b(href|src)=(["'])(.*?)\2/gi, (attribute, name, quote, value) => {
    if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/|\/|#|\?|\.\.\/)/i.test(value)) return attribute;
    return `${name}=${quote}../${value}${quote}`;
  });
}

async function renderHomeFeaturedMarkup(issuerData) {
  let markup = '';
  const homeContainer = {
    querySelector() {
      return null;
    },
    set innerHTML(value) {
      markup = value;
      throw homeRenderStop;
    }
  };
  const context = vm.createContext({
    document: {
      addEventListener() {},
      getElementById(id) {
        return id === 'home-featured-certificates' ? homeContainer : null;
      }
    },
    ISSUERS_DATA: issuerData,
    window: {
      location: {
        href: 'https://roccoluigi.github.io/PERTEFINANZA/index.html',
        pathname: '/PERTEFINANZA/index.html'
      }
    },
    URL,
    URLSearchParams,
    Intl
  });

  for (const fileName of ['js/data-certificates.js', 'js/data-review-pages.js', 'js/app.js']) {
    const source = await readFile(path.join(projectRoot, fileName), 'utf8');
    vm.runInContext(source, context, { filename: fileName });
  }

  try {
    context.initHomeFeaturedCertificates();
  } catch (error) {
    if (error !== homeRenderStop) throw error;
  }
  if (!markup) throw new Error('Impossibile generare le schede statiche in evidenza.');
  return markup;
}

async function updateStaticHomeFeatured(issuerData) {
  const indexPath = path.join(projectRoot, 'index.html');
  const html = await readFile(indexPath, 'utf8');
  const startMarker = '<!-- STATIC-HOME-CERTIFICATES:START -->';
  const endMarker = '<!-- STATIC-HOME-CERTIFICATES:END -->';
  const startIndex = html.indexOf(startMarker);
  const endIndex = html.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error('Marcatori STATIC-HOME-CERTIFICATES non trovati in index.html.');
  }

  const markup = await renderHomeFeaturedMarkup(issuerData);
  const contentStart = startIndex + startMarker.length;
  const updatedHtml = `${html.slice(0, contentStart)}\n${markup}\n${html.slice(endIndex)}`;
  if (updatedHtml !== html) await writeFile(indexPath, updatedHtml, 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateManifestScript(html, scriptPath, version) {
  const escapedPath = escapeRegExp(scriptPath);
  const pattern = new RegExp(
    `(<script\\s+src=["'])${escapedPath}(?:\\?v=[^"']*)?(["'][^>]*>\\s*<\\/script>)`,
    'i'
  );
  if (!pattern.test(html)) throw new Error(`Include manifest non trovato: ${scriptPath}`);
  return html.replace(pattern, (_, prefix, suffix) => `${prefix}${scriptPath}?v=${version}${suffix}`);
}

async function syncStaticReviewIndex() {
  const reviewsDirectory = path.join(projectRoot, 'recensioni');
  await mkdir(reviewsDirectory, { recursive: true });
  const entries = await readdir(reviewsDirectory, { withFileTypes: true });
  const isins = entries
    .filter(entry => entry.isFile())
    .map(entry => entry.name.match(/^recensione-([A-Z0-9]{12})\.html$/i)?.[1]?.toUpperCase())
    .filter(Boolean)
    .sort();
  const manifest = `window.STATIC_REVIEW_ISINS = Object.freeze(${JSON.stringify(isins)});\n`;
  const version = createHash('sha256').update(manifest).digest('hex').slice(0, 12);
  const manifestPath = path.join(projectRoot, 'js', 'data-review-pages.js');
  await writeFile(manifestPath, manifest, 'utf8');

  const rootEntries = await readdir(projectRoot, { withFileTypes: true });
  const pages = rootEntries
    .filter(entry => entry.isFile() && /\.html$/i.test(entry.name))
    .map(entry => path.join(projectRoot, entry.name));
  for (const entry of entries.filter(item => item.isFile() && /\.html$/i.test(item.name))) {
    pages.push(path.join(reviewsDirectory, entry.name));
  }

  for (const pagePath of pages) {
    const relativeManifestPath = path.relative(path.dirname(pagePath), manifestPath).split(path.sep).join('/');
    const html = await readFile(pagePath, 'utf8');
    const updatedHtml = updateManifestScript(html, relativeManifestPath, version);
    if (updatedHtml !== html) await writeFile(pagePath, updatedHtml, 'utf8');
  }

  return { isins, version };
}

async function main() {
  const { isin, syncOnly, all, missing } = parseArguments(process.argv.slice(2));
  const issuerHtml = await readFile(path.join(projectRoot, 'emittenti.html'), 'utf8');
  const issuerData = parseIssuers(issuerHtml);
  if (!syncOnly) {
    let certificates = all || missing ? await loadCertificates() : [{ isin }];
    const outputDirectory = path.join(projectRoot, 'recensioni');
    await mkdir(outputDirectory, { recursive: true });

    if (missing) {
      const entries = await readdir(outputDirectory, { withFileTypes: true });
      const existingIsins = new Set(entries
        .filter(entry => entry.isFile())
        .map(entry => entry.name.match(/^recensione-([A-Z0-9]{12})\.html$/i)?.[1]?.toUpperCase())
        .filter(Boolean));
      certificates = certificates.filter(certificate => !existingIsins.has(certificate.isin.toUpperCase()));
      console.log(`Recensioni mancanti da generare: ${certificates.length}.`);
    }

    const template = await readFile(path.join(projectRoot, 'recensione.html'), 'utf8');
    for (const item of certificates) {
      const { certificate, markup } = await renderReviewMarkup(item.isin, issuerData);
      const page = buildPage(template, certificate, markup);
      const destination = path.join(outputDirectory, `recensione-${certificate.isin}.html`);
      await writeFile(destination, page, 'utf8');
      console.log(`Recensione generata per ${certificate.isin}: ${destination}`);
    }
  }

  const { isins } = await syncStaticReviewIndex();
  await updateStaticHomeFeatured(issuerData);
  console.log(`Indice recensioni statiche sincronizzato (${isins.length} ISIN).`);
}

main().catch(error => {
  console.error(`Generazione della recensione non riuscita: ${error.message}`);
  process.exitCode = 1;
});
