import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

// Run with `node scripts/render-static-content.mjs` after editing FAQ or glossary data.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function replaceContainerContent(html, tagName, containerPattern, startMarker, endMarker, content) {
  const container = containerPattern.exec(html);
  if (!container) return html;

  const tags = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
  tags.lastIndex = container.index;
  let depth = 0;
  let closingTagIndex = -1;
  let tag;

  while ((tag = tags.exec(html))) {
    if (tag[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) {
        closingTagIndex = tag.index;
        break;
      }
    } else {
      depth += 1;
    }
  }

  if (closingTagIndex === -1) throw new Error(`Closing ${tagName} tag not found for static content container.`);

  const openingTagEnd = container.index + container[0].length;
  const existingContent = html.slice(openingTagEnd, closingTagIndex);
  const startIndex = existingContent.indexOf(startMarker);
  const endIndex = existingContent.indexOf(endMarker);
  const replacement = startIndex !== -1 && endIndex !== -1 && endIndex > startIndex
    ? `${existingContent.slice(0, startIndex + startMarker.length)}\n${content}\n${existingContent.slice(endIndex)}`
    : `\n    ${startMarker}\n${content}\n    ${endMarker}\n    `;

  return `${html.slice(0, openingTagEnd)}${replacement}${html.slice(closingTagIndex)}`;
}

async function loadData(fileName, variableName) {
  const source = await readFile(path.join(projectRoot, 'js', fileName), 'utf8');
  return vm.runInNewContext(`${source}\nJSON.stringify(${variableName});`, {});
}

function contentAnchorId(prefix, title) {
  const slug = title.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${prefix}-${slug}`;
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function relatedLinksMarkup(links = []) {
  if (!Array.isArray(links) || links.length === 0) return '';
  const linksMarkup = links
    .map(({ href, label }) => `<a href="${escapeHtmlAttribute(href)}">${escapeHtmlAttribute(label)}</a>`)
    .join(' <span aria-hidden="true">·</span> ');
  return `<p class="related-content-links"><strong>Approfondimenti:</strong> ${linksMarkup}</p>`;
}

function formatFaqAnswer(answer) {
  const numberedParts = answer.split(/(?=\b\d+\)\s)/);
  if (numberedParts.length >= 3 && numberedParts.slice(1).every(part => /^\d+\)\s/.test(part))) {
    const introduction = numberedParts.shift().trim();
    const listItems = numberedParts.map(part => part.replace(/^\d+\)\s/, '').trim());
    return `${introduction ? `<p>${introduction}</p>` : ''}<ol>${listItems.map(item => `<li>${item}</li>`).join('')}</ol>`;
  }

  const bulletParts = answer.split(/(?=•\s)/);
  if (bulletParts.length >= 2 && bulletParts.slice(1).every(part => /^•\s/.test(part))) {
    const introduction = bulletParts.shift().trim();
    const listItems = bulletParts.map(part => part.replace(/^•\s/, '').trim());
    return `${introduction ? `<p>${introduction}</p>` : ''}<ul>${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
  }

  return `<p>${answer}</p>`;
}

function renderFaqs(faqs) {
  return faqs.map(item => {
    const itemId = contentAnchorId('faq', item.question);
    const questionId = `${itemId}-question`;
    const answerId = `${itemId}-answer`;
    return `
        <div class="faq-item active" id="${itemId}">
          <div class="faq-item-header">
            <button type="button" class="faq-question" id="${questionId}" aria-expanded="true" aria-controls="${answerId}">
              <span class="faq-question-content">
                <span class="badge badge-primary faq-item-category">${item.category}</span>
                <span class="faq-item-question-text">${item.question}</span>
              </span>
              <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
          <div class="faq-answer" id="${answerId}" role="region" aria-labelledby="${questionId}">
            ${formatFaqAnswer(item.answer)}
            ${relatedLinksMarkup(item.relatedLinks)}
          </div>
        </div>`;
  }).join('');
}

function renderGlossary(items) {
  return [...items].sort((a, b) => a.term.localeCompare(b.term)).map(item => {
    const itemId = contentAnchorId('glossary', item.term);
    const exampleBox = item.example ? `
        <div class="glossary-example">
          <strong class="glossary-example-label">💡 Esempio pratico / Focus operativo:</strong>
          ${item.example}
        </div>` : '';
    return `
        <div class="glossary-card" id="${itemId}">
          <div class="glossary-card-title">
            <span>${item.term}</span>
            <span class="badge badge-primary">${item.category}</span>
          </div>
          <div class="glossary-card-def">${item.definition}</div>
          ${exampleBox}
          ${relatedLinksMarkup(item.relatedLinks)}
        </div>`;
  }).join('');
}

const telegramCard = `
        <div class="telegram-header">
          <div class="telegram-icon-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.17 3.35-1.38 3.73-1.38.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
            </svg>
          </div>
          <div>
            <div class="telegram-title">Canale Telegram</div>
            <div class="telegram-handle">@pertefinanza</div>
          </div>
        </div>
        <p class="telegram-desc">
          Cedole, barriere profonde, quotazioni sotto la pari. Nel canale trovi alert e analisi sui certificati da tenere d'occhio.
        </p>
        <a href="https://t.me/pertefinanza" target="_blank" rel="noopener noreferrer" class="btn btn-telegram telegram-full-button">
          Segui il canale ↗
        </a>`;

const footer = `
    <div class="container footer-grid">
      <div class="footer-brand">
        <div class="footer-logo">PERTE<span>FINANZA</span></div>
        <p class="footer-desc">
          Portale editoriale specializzato di analisi tecnica, didattica e catalogazione di certificati di investimento.
        </p>
        <div class="footer-legal-box">
          <span class="piva-badge">Dati Fiscali &amp; P.IVA:</span>
          <div><strong>Titolare:</strong> Luigi Rocco</div>
          <div><strong>Partita IVA:</strong> 18669501001</div>
          <div><strong>Attività:</strong> Servizi di informazione e divulgazione finanziaria</div>
        </div>
      </div>
      <div>
        <h4 class="footer-heading">Navigazione</h4>
        <ul class="footer-links">
          <li><a href="index.html">Home</a></li>
          <li><a href="certificati.html">Catalogo Certificati</a></li>
          <li><a href="emittenti.html">Emittenti &amp; Rating</a></li>
          <li><a href="recensione.html">Schede di Analisi</a></li>
        </ul>
      </div>
      <div>
        <h4 class="footer-heading">Risorse</h4>
        <ul class="footer-links">
          <li><a href="formazione.html">Guida ai Certificati</a></li>
          <li><a href="glossario.html">Glossario Finanziario</a></li>
          <li><a href="faq.html">Domande Frequenti (FAQ)</a></li>
          <li><a href="contatti.html">Contatti &amp; Info</a></li>
        </ul>
      </div>
      <div>
        <h4 class="footer-heading">Trasparenza &amp; Rischi</h4>
        <p class="footer-disclaimer-text">
          I contenuti hanno finalità informativa e didattica e non costituiscono consulenza finanziaria, raccomandazione personalizzata o sollecitazione all'investimento. I certificati sono strumenti complessi: il capitale può subire perdite significative o totali e resta esposto al rischio di credito dell'emittente. Prima di investire, verifica le informazioni ufficiali, leggi il KID e le Condizioni Definitive e valuta la coerenza del prodotto con i tuoi obiettivi e il tuo profilo di rischio.
        </p>
        <a href="disclaimer.html" class="btn btn-sm btn-secondary footer-disclaimer-link">Disclaimer e Note Legali</a>
      </div>
    </div>
    <div class="container footer-bottom">
      <div>
        © 2026 PERTEFINANZA. Tutti i diritti riservati. Ideato e gestito da <strong>Luigi Rocco</strong> (P.IVA 18669501001).
      </div>
      <div class="footer-bottom-links">
        <a href="disclaimer.html">Disclaimer</a>
        <a href="disclaimer.html#privacy">Privacy Policy</a>
        <a href="disclaimer.html#cookie">Cookie Policy</a>
        <a href="contatti.html">Contatti</a>
      </div>
    </div>`;

const faqData = JSON.parse(await loadData('data-faqs.js', 'FAQS_DATA'));
const glossaryData = JSON.parse(await loadData('data-glossary.js', 'GLOSSARY_DATA'));
const htmlFiles = (await readdir(projectRoot)).filter(fileName => fileName.endsWith('.html'));

for (const fileName of htmlFiles) {
  const filePath = path.join(projectRoot, fileName);
  const originalHtml = await readFile(filePath, 'utf8');
  let html = originalHtml;
  html = html.replace(/(<span class="brand-tag">)[\s\S]*?(<\/span>)/, '$1CERTIFICATI: ANALISI E FORMAZIONE$2');
  html = html.replace(
    '<div class="sidebar-telegram-card"></div>',
    `<div class="sidebar-telegram-card">\n${telegramCard}\n      </div>`
  );
  html = html.replace(
    '<footer class="site-footer"></footer>',
    `<footer class="site-footer">\n${footer}\n  </footer>`
  );
  html = html.replace(/js\/app\.js\?v=20261007-5/g, 'js/app.js?v=20261007-6');

  if (fileName === 'faq.html') {
    html = replaceContainerContent(
      html,
      'div',
      /<div class="faq-list" id="faq-container">/,
      '<!-- STATIC-FAQ:START -->',
      '<!-- STATIC-FAQ:END -->',
      renderFaqs(faqData).replace(/[ \t]+$/gm, '')
    );
    html = html.replace('25 domande analizzate', `${faqData.length} domande disponibili`);
  }

  if (fileName === 'glossario.html') {
    html = replaceContainerContent(
      html,
      'div',
      /<div class="glossary-grid" id="glossary-container">/,
      '<!-- STATIC-GLOSSARY:START -->',
      '<!-- STATIC-GLOSSARY:END -->',
      renderGlossary(glossaryData).replace(/[ \t]+$/gm, '')
    );
    html = html.replace('Oltre 50 termini disponibili', `${glossaryData.length} termini disponibili`);
  }

  if (fileName === 'faq.html' || fileName === 'glossario.html') {
    html = html.replace(/[ \t]+$/gm, '');
  }

  if (html !== originalHtml) await writeFile(filePath, html, 'utf8');
}

console.log(`Markup statico aggiornato: ${htmlFiles.length} pagine, ${faqData.length} FAQ, ${glossaryData.length} termini.`);
