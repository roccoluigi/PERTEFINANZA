/**
 * PERTEFINANZA - Logica applicativa interattiva (Vanilla JS)
 * Gestione menu mobile, catalogo certificati con filtri, glossario A-Z e per categoria,
 * motore di ricerca FAQ con accordion interattivo e schede di recensione tecnica.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSiteNavigation();
  initFormationRelatedLinks();
  initThemeToggle();
  initMobileMenu();
  initSidebarFeatured();
  initHomeFeaturedCertificates();
  initShareButtons();
  initFormationShareButtons();
  initCertificatesCatalog();
  initGlossary();
  initFaqAccordion();
  initIssuersList();
  initReviewPage();
  initContactForm();
  window.addEventListener('resize', () => alignCertificateMetrics());
});

/* ===========================================================================
   Identita e navigazione condivise
   =========================================================================== */
function initSiteNavigation() {
  const pathnamePage = window.location.pathname.split('/').pop() || 'index.html';
  const isReviewPage = pathnamePage === 'recensione.html' || /^recensione-[A-Z0-9]{12}\.html$/i.test(pathnamePage);
  const currentPage = isReviewPage ? 'certificati.html' : pathnamePage;
  document.querySelectorAll('.main-nav, .mobile-nav').forEach(nav => {
    const linkClass = nav.classList.contains('mobile-nav') ? 'mobile-nav-link' : 'nav-link';
    nav.querySelectorAll(`a.${linkClass}`).forEach(link => {
      const linkPage = new URL(link.getAttribute('href'), window.location.href).pathname.split('/').pop();
      const isCurrentPage = linkPage === currentPage;
      link.classList.toggle('active', isCurrentPage);
      if (isCurrentPage) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (nav.classList.contains('mobile-nav') && !nav.querySelector('.theme-toggle')) {
      nav.insertAdjacentHTML('beforeend', themeToggleMarkup(linkClass));
    }
  });

  const headerActions = document.querySelector('.header-actions');
  if (headerActions && !headerActions.querySelector('.theme-toggle')) {
    headerActions.insertAdjacentHTML('afterbegin', themeToggleMarkup('header-theme-toggle'));
  }
}

function reviewTemplateUrl(isin) {
  const inReviewFolder = window.location.pathname.split('/').includes('recensioni');
  const encodedIsin = encodeURIComponent(isin);
  const hasStaticReview = Array.isArray(window.STATIC_REVIEW_ISINS)
    && window.STATIC_REVIEW_ISINS.includes(isin);

  if (hasStaticReview) {
    return inReviewFolder
      ? `recensione-${encodedIsin}.html`
      : `recensioni/recensione-${encodedIsin}.html`;
  }

  const templatePath = inReviewFolder ? '../recensione.html' : 'recensione.html';
  return `${templatePath}?isin=${encodedIsin}`;
}

function themeToggleMarkup(toggleClass) {
  return `
    <button type="button" class="${toggleClass} theme-toggle" aria-label="Attiva tema notte" aria-pressed="false">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/>
      </svg>
      <span class="theme-toggle-label">Notte</span>
    </button>
  `;
}

function initThemeToggle() {
  const toggles = document.querySelectorAll('.theme-toggle');
  if (toggles.length === 0) return;

  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem('pertefinanza-theme') || 'light';
  } catch (error) {
    console.warn('Impossibile leggere la preferenza del tema dal browser.', error);
  }

  const rootElement = document.documentElement;
  let transitionTimeoutId;

  const applyTheme = (isDark, animate = false) => {
    const shouldAnimate = animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (shouldAnimate) {
      window.clearTimeout(transitionTimeoutId);
      rootElement.classList.add('theme-transitioning');
    }

    rootElement.dataset.theme = isDark ? 'dark' : 'light';

    toggles.forEach(toggle => {
      toggle.setAttribute('aria-label', isDark ? 'Attiva tema giorno' : 'Attiva tema notte');
      toggle.setAttribute('aria-pressed', String(isDark));
      toggle.querySelector('.theme-toggle-label').textContent = isDark ? 'Giorno' : 'Notte';
      toggle.querySelector('svg').innerHTML = isDark
        ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>'
        : '<path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/>';
    });

    if (shouldAnimate) {
      transitionTimeoutId = window.setTimeout(() => {
        rootElement.classList.remove('theme-transitioning');
        transitionTimeoutId = undefined;
      }, 300);
    }
  };

  applyTheme(savedTheme === 'dark');

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const isDark = rootElement.dataset.theme !== 'dark';
      applyTheme(isDark, true);

      try {
        localStorage.setItem('pertefinanza-theme', isDark ? 'dark' : 'light');
      } catch (error) {
        console.warn('Impossibile salvare la preferenza del tema nel browser.', error);
      }
    });
  });
}



/* ==========================================================================
   1. Menu Mobile
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav-menu');

  if (toggleBtn && mobileNav) {
    toggleBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const isExpanded = mobileNav.classList.contains('open');
      toggleBtn.setAttribute('aria-expanded', isExpanded);
    });

    mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/* ==========================================================================
   2. Sidebar: Certificati in Evidenza
   ========================================================================== */
function initSidebarFeatured() {
  const containers = document.querySelectorAll('#sidebar-featured-certs');
  if (containers.length === 0 || typeof CERTIFICATES_DATA === 'undefined') return;

  const formazioneSidebar = document.querySelector('.formazione-sidebar');
  if (formazioneSidebar) {
    formazioneSidebar.querySelectorAll('.sidebar-widget').forEach(widget => {
      if (!widget.querySelector('#sidebar-featured-certs')) widget.remove();
    });
  }

  const topPicks = CERTIFICATES_DATA.filter(c => c.showTopPick);
  let html = '';

  topPicks.forEach(c => {
    const reviewUrl = reviewTemplateUrl(c.isin);
    html += `
      <div class="widget-cert-item">
        <div class="widget-cert-top">
          <button type="button" class="widget-cert-isin" data-copy-isin="${c.isin}" title="Copia ISIN">
            <span class="widget-cert-isin-label">ISIN:</span>${c.isin}
          </button>
          ${contentShareMenuMarkup('', c.name, certificateShareText(c), reviewUrl)}
        </div>
        <a href="${reviewUrl}" class="widget-cert-link">
        <div class="widget-cert-name">${c.name}</div>
        <div class="widget-cert-issuer">${c.issuer}</div>
        <div class="widget-cert-details">
          <div><span>REND. POT. ANNUO</span><strong class="widget-cert-coupon-value">${c.annualYield.toFixed(2)}%</strong></div>
          <div><span>Barriera capitale</span><strong>${c.barrierCapital}</strong></div>
          <div><span>Barriera coupon</span><strong>${c.barrierCoupon}</strong></div>
          <div><span>Step-down</span><strong>${c.stepDown}</strong></div>
          <div><span>Sottostanti</span><strong>${formatUnderlyingNames(c.underlyings)}</strong></div>
        </div>
        </a>
      </div>
    `;
  });

  containers.forEach(container => {
    const widget = container.closest('.sidebar-widget');
    if (widget) {
      widget.classList.add('sidebar-featured-widget');
      widget.innerHTML = `
        <div class="widget-title">
          <span>Ultimi Inserimenti</span>
        </div>
        <div id="sidebar-featured-certs">${html}</div>
      `;
      initCopyableIsins(widget);
    } else {
      container.innerHTML = html;
      initCopyableIsins(container);
    }
  });
}

function certificateCardMarkup(c) {
  return `
    <article class="card card-hover home-certificate-card">
      <div class="home-certificate-head">
        <div>
          <span class="badge badge-primary${c.type === 'Phoenix Memory Step Down' ? ' home-certificate-type-placeholder' : ''}">${c.type}</span>
          <h3>${c.name}</h3>
          <div class="home-certificate-isin">
            <button type="button" class="cert-isin-copy" data-copy-isin="${c.isin}" title="Copia ISIN">ISIN: <strong>${c.isin}</strong></button>
            <a href="${reviewTemplateUrl(c.isin)}" class="btn btn-sm btn-primary home-certificate-tech-button">SCHEDA TECNICA →</a>
          </div>
          <div class="home-certificate-summary">${reviewPreviewMarkup(c)}</div>
        </div>
        <div class="home-certificate-metrics">
          <div class="home-certificate-metric">
            <span>REND. POT. ANNUO</span>
            <strong>${c.annualYield.toFixed(2)}%</strong>
          </div>
          <div class="home-certificate-metric home-certificate-stepdown">
            <span>Step-down</span>
            <strong>${c.stepDown}</strong>
          </div>
          <div class="home-certificate-metric home-certificate-barrier">
            <span>Barriera capitale</span>
            <strong>${c.barrierCapital}</strong>
          </div>
          <div class="home-certificate-metric home-certificate-barrier">
            <span>Barriera coupon</span>
            <strong>${c.barrierCoupon}</strong>
          </div>
          <div class="home-certificate-metric home-certificate-date">
            <span>Emissione</span>
            <strong>${c.strikeDate}</strong>
          </div>
          <div class="home-certificate-metric home-certificate-date">
            <span>Scadenza</span>
            <strong>${c.expiryDate}</strong>
          </div>
          ${shareButtonsMarkup(c)}
        </div>
      </div>
    </article>
  `;
}

function alignCertificateMetrics(container = document) {
  // Le card hanno intestazioni di altezza variabile: allinea i metric box
  // al pulsante della scheda tecnica solo quando il layout e' orizzontale.
  container.querySelectorAll('.home-certificate-head').forEach(head => {
    const metrics = head.querySelector('.home-certificate-metrics');
    const techButton = head.querySelector('.home-certificate-tech-button');
    if (!metrics || !techButton) return;

    if (getComputedStyle(head).flexDirection === 'column') {
      metrics.style.marginTop = '0';
      return;
    }

    const headTop = head.getBoundingClientRect().top;
    const techButtonTop = techButton.getBoundingClientRect().top;
    metrics.style.marginTop = `${Math.max(0, techButtonTop - headTop)}px`;
  });
}

function initHomeFeaturedCertificates() {
  const container = document.getElementById('home-featured-certificates');
  if (!container) return;

  if (container.querySelector('.home-certificate-card')) {
    initCopyableIsins(container);
    alignCertificateMetrics(container);
    return;
  }
  if (typeof CERTIFICATES_DATA === 'undefined') return;

  container.innerHTML = CERTIFICATES_DATA.filter(c => c.showHome).map(certificateCardMarkup).join('');
  initCopyableIsins(container);
  alignCertificateMetrics(container);
}



function issuerDescriptionWithoutName(issuer, description) {
  const escapedIssuer = issuer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return description
    .replace(new RegExp(`^${escapedIssuer}\\s*`, 'i'), '')
    .replace(/^\([^)]*\)\s*/, '')
    .replace(/^,\s*/, '')
    .replace(/^è\s+/i, '')
    .replace(/^un['’]\s*/i, '')
    .trim();
}

function reviewPreviewMarkup(cert) {
  const monthlyYield = cert.annualYield / 12;
  const issuer = typeof ISSUERS_DATA !== 'undefined'
    ? ISSUERS_DATA.find(item => item.name === cert.issuer)
    : null;
  const issuerDescription = issuer
    ? issuerDescriptionWithoutName(cert.issuer, issuer.marketShare || issuer.description).replace(/[.!?]+$/, '')
    : 'emittente attivo nel mercato dei prodotti strutturati';
  const issuerDescriptionStart = issuerDescription.charAt(0).toLowerCase() + issuerDescription.slice(1);
  const ratingParts = issuer && issuer.ratings
    ? Object.entries(issuer.ratings)
      .map(([agency, rating]) => `${rating} da parte di ${agency}`)
    : '';
  const ratings = ratingParts.length > 1
    ? `${ratingParts.slice(0, -1).join(', ')} e ${ratingParts[ratingParts.length - 1]}`
    : '';
  const ratingSentence = ratingParts.length === 1
    ? ` ${issuer.ratings && Object.keys(issuer.ratings)[0]} assegna all'emittente un rating di credito pari ad ${issuer.ratings && Object.values(issuer.ratings)[0]}.`
    : ratings
      ? ` Le agenzie assegnano all'emittente i seguenti rating di credito: ${ratings}.`
      : '';
  const issuerLink = `<a href="emittenti.html#${issuerAnchorId(cert.issuer)}">${cert.issuer}</a>`;
  const underlyingList = `<span class="certificate-preview-underlyings" aria-label="Sottostanti">${cert.underlyings.map(name => `<span class="certificate-preview-underlying"><strong>${name}</strong></span>`).join(' <span class="certificate-preview-separator" aria-hidden="true">·</span> ')}</span>`;
  return `<div class="certificate-preview">Il presente certificato di investimento è emesso da <strong>${issuerLink}</strong>, ${issuerDescriptionStart}.${ratingSentence} La struttura investe su:${underlyingList} e prevede un rendimento potenziale mensile del <strong>${monthlyYield.toFixed(2)}%</strong> (con effetto memoria), con scadenza il ${cert.expiryDate}. La barriera capitale è posta al <strong>${cert.barrierCapital}</strong> (europea, con valutazione a scadenza).</div>`;
}

function issuerAnchorId(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatUnderlyingNames(underlyings) {
  return underlyings.map(name => `<strong>${name}</strong>`).join(', ');
}

function certificateShareText(c) {
  const annualYield = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(c.annualYield);
  return `${c.name}\nRendimento potenziale annuo ${annualYield}% · barriera capitale ${c.barrierCapital}`;
}

function shareButtonsMarkup(c) {
  const shareUrl = new URL(reviewTemplateUrl(c.isin), window.location.href).href;
  const shareText = encodeURIComponent(certificateShareText(c));
  const encodedUrl = encodeURIComponent(shareUrl);

  return `
    <div class="share-actions" aria-label="Condividi certificato">
      <span class="share-label">Condividi</span>
      <a class="share-button share-whatsapp" href="https://wa.me/?text=${shareText}%0A${encodedUrl}" target="_blank" rel="noopener noreferrer" title="Condividi su WhatsApp" aria-label="Condividi su WhatsApp">${shareIconMarkup('whatsapp')}</a>
      <a class="share-button share-telegram" href="https://t.me/share/url?url=${encodedUrl}&text=${shareText}" target="_blank" rel="noopener noreferrer" title="Condividi su Telegram" aria-label="Condividi su Telegram">${shareIconMarkup('telegram')}</a>
      <button type="button" class="share-button share-copy" data-copy-share-url="${shareUrl}" title="Copia link negli appunti" aria-label="Copia link negli appunti">${shareIconMarkup('copy')}</button>
    </div>
  `;
}

function contentShareMenuMarkup(anchorId, title, shareText = title, destinationUrl) {
  const shareUrl = destinationUrl
    ? new URL(destinationUrl, window.location.href)
    : new URL(window.location.href);
  if (!destinationUrl) shareUrl.hash = anchorId;
  const encodedUrl = encodeURIComponent(shareUrl.href);
  const encodedTitle = encodeURIComponent(shareText);

  return `
    <details class="content-share">
      <summary class="share-button share-trigger" title="Condividi: ${escapeHtmlAttribute(title)}" aria-label="Condividi: ${escapeHtmlAttribute(title)}">
        ${shareIconMarkup('share')}
      </summary>
      <div class="share-menu-options">
        <a class="share-menu-item share-whatsapp" href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" target="_blank" rel="noopener noreferrer">
          ${shareIconMarkup('whatsapp')}<span>WhatsApp</span>
        </a>
        <a class="share-menu-item share-telegram" href="https://t.me/share/url?url=${encodedUrl}&amp;text=${encodedTitle}" target="_blank" rel="noopener noreferrer">
          ${shareIconMarkup('telegram')}<span>Telegram</span>
        </a>
        <button type="button" class="share-menu-item share-copy" data-copy-share-url="${escapeHtmlAttribute(shareUrl.href)}">
          ${shareIconMarkup('copy')}<span>Copia link</span>
        </button>
      </div>
    </details>
  `;
}

function contentAnchorId(prefix, title) {
  const slug = title.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${prefix}-${slug}`;
}

function relatedLinksMarkup(links = []) {
  if (!Array.isArray(links) || links.length === 0) return '';

  const linksMarkup = links
    .map(({ href, label }) => `<a href="${escapeHtmlAttribute(href)}">${escapeHtmlAttribute(label)}</a>`)
    .join(' <span aria-hidden="true">·</span> ');

  return `<p class="related-content-links"><strong>Approfondimenti:</strong> ${linksMarkup}</p>`;
}

function initFormationRelatedLinks() {
  const moduleLinks = {
    mod3: [
      { href: 'glossario.html#glossary-valore-nominale', label: 'Glossario: valore nominale' },
      { href: 'formazione.html#mod32', label: 'Modulo 32: scomposizione del prezzo' }
    ],
    mod5: [
      { href: 'glossario.html#glossary-classificazione-acepi', label: 'Glossario: classificazione ACEPI' },
      { href: 'faq.html#faq-cosa-sono-esattamente-i-certificati-di-investimento-e-come-si-collocano-nella-classificazione-acepi', label: 'FAQ: classificazione dei certificati' }
    ],
    mod9: [
      { href: 'glossario.html#glossary-bonus-cap-certificato', label: 'Glossario: Bonus Cap' },
      { href: 'glossario.html#glossary-twin-win', label: 'Glossario: Twin Win' },
      { href: 'faq.html#faq-cosa-sono-esattamente-i-certificati-di-investimento-e-come-si-collocano-nella-classificazione-acepi', label: 'FAQ: famiglie di certificati' }
    ],
    mod10: [
      { href: 'glossario.html#glossary-rischio-emittente-e-bail-in', label: 'Glossario: rischio emittente' },
      { href: 'faq.html#faq-i-certificati-sono-protetti-dal-fondo-interbancario-di-tutela-dei-depositi-fitd', label: 'FAQ: tutela dei depositi e certificati' }
    ],
    mod13: [
      { href: 'glossario.html#glossary-dividend-risk-rischio-dividendi', label: 'Glossario: rischio dividendi' },
      { href: 'faq.html#faq-in-che-modo-dividendi-stimati-e-volatilita-vega-influenzano-il-prezzo-del-certificato-sul-mercato-secondario', label: 'FAQ: dividendi, volatilità e prezzo' }
    ],
    mod16: [
      { href: 'glossario.html#glossary-liquidity-provider-market-maker-specialist', label: 'Glossario: market maker' },
      { href: 'faq.html#faq-qual-e-la-differenza-tra-prezzo-teorico-e-prezzo-realmente-eseguibile', label: 'FAQ: prezzo eseguibile' }
    ],
    mod17: [
      { href: 'glossario.html#glossary-low-barrier-deep-barrier-barriera-profonda', label: 'Glossario: barriera profonda' },
      { href: 'faq.html#faq-come-posso-valutare-un-certificato-prima-di-acquistarlo', label: 'FAQ: valutare un certificato' }
    ],
    mod18: [
      { href: 'glossario.html#glossary-rischio-emittente-e-bail-in', label: 'Glossario: rischio emittente' },
      { href: 'faq.html#faq-che-cos-e-la-clausola-worst-of-e-perche-aumenta-sensibilmente-il-rischio-del-portafoglio', label: 'FAQ: rischio di concentrazione nel paniere' }
    ],
    mod21: [
      { href: 'glossario.html#glossary-ask-e-bid-lettera-e-denaro', label: 'Glossario: denaro e lettera' },
      { href: 'glossario.html#glossary-spread-denaro-lettera-bid-ask', label: 'Glossario: spread denaro-lettera' },
      { href: 'faq.html#faq-qual-e-la-differenza-tra-prezzo-teorico-e-prezzo-realmente-eseguibile', label: 'FAQ: prezzo realmente eseguibile' }
    ],
    mod23: [
      { href: 'glossario.html#glossary-trigger-cedolare', label: 'Glossario: trigger cedolare' },
      { href: 'glossario.html#glossary-fixing-e-data-di-valutazione', label: 'Glossario: fixing e valutazione' },
      { href: 'faq.html#faq-quali-sono-le-4-date-chiave-per-incassare-la-cedola-e-quando-conviene-comprare-il-certificato', label: 'FAQ: date della cedola' }
    ],
    mod24: [
      { href: 'glossario.html#glossary-kid-key-information-document-ex-regolamento-priips', label: 'Glossario: KID' },
      { href: 'glossario.html#glossary-final-terms-condizioni-definitive', label: 'Glossario: Final Terms' },
      { href: 'faq.html#faq-dove-trovo-le-informazioni-definitive-se-una-pagina-web-non-coincide-con-il-prodotto', label: 'FAQ: fonti definitive' }
    ],
    mod25: [
      { href: 'glossario.html#glossary-final-terms-condizioni-definitive', label: 'Glossario: Final Terms' },
      { href: 'faq.html#faq-cosa-accade-a-un-certificato-in-caso-di-operazioni-societarie-straordinarie-opa-aumenti-di-capitale-spin-off', label: 'FAQ: operazioni societarie' }
    ],
    mod26: [
      { href: 'glossario.html#glossary-rating-dell-emittente', label: 'Glossario: rating dell’emittente' },
      { href: 'glossario.html#glossary-rischio-emittente-e-bail-in', label: 'Glossario: rischio emittente' },
      { href: 'faq.html#faq-i-certificati-sono-protetti-dal-fondo-interbancario-di-tutela-dei-depositi-fitd', label: 'FAQ: rischio di credito' }
    ],
    mod27: [
      { href: 'glossario.html#glossary-worst-of-meccanismo-del-paniere', label: 'Glossario: Worst-Of' },
      { href: 'glossario.html#glossary-distanza-dalla-barriera', label: 'Glossario: distanza dalla barriera' },
      { href: 'faq.html#faq-che-cosa-significa-che-il-certificato-dipende-dal-worst-of', label: 'FAQ: monitorare il Worst-Of' }
    ],
    mod28: [
      { href: 'glossario.html#glossary-autocallability-rimborso-anticipato-automatico', label: 'Glossario: autocallability' },
      { href: 'faq.html#faq-qual-e-la-differenza-fondamentale-tra-certificati-autocallable-e-softcallable', label: 'FAQ: autocallable e softcallable' }
    ],
    mod29: [
      { href: 'glossario.html#glossary-fixing-e-data-di-valutazione', label: 'Glossario: fixing e data di valutazione' },
      { href: 'glossario.html#glossary-valore-nominale', label: 'Glossario: valore nominale' },
      { href: 'faq.html#faq-come-posso-valutare-un-certificato-prima-di-acquistarlo', label: 'FAQ: controlli prima dell’acquisto' }
    ],
    mod30: [
      { href: 'glossario.html#glossary-kid-key-information-document-ex-regolamento-priips', label: 'Glossario: KID' },
      { href: 'glossario.html#glossary-distanza-dalla-barriera', label: 'Glossario: distanza dalla barriera' },
      { href: 'faq.html#faq-come-posso-valutare-un-certificato-prima-di-acquistarlo', label: 'FAQ: valutazione completa' }
    ],
    mod31: [
      { href: 'glossario.html#glossary-rischio-emittente-e-bail-in', label: 'Glossario: rischio emittente' },
      { href: 'faq.html#faq-i-certificati-sono-protetti-dal-fondo-interbancario-di-tutela-dei-depositi-fitd', label: 'FAQ: tutela dei depositi e rischio emittente' }
    ],
    mod32: [
      { href: 'glossario.html#glossary-strike-price-prezzo-di-esercizio-iniziale', label: 'Glossario: Strike Price' },
      { href: 'faq.html#faq-come-si-legge-l-indicatore-sintetico-di-rischio-sri-da-1-a-7-nel-kid-e-dove-si-trovano-i-costi-impliciti', label: 'FAQ: rischio e costi impliciti' }
    ],
    mod33: [
      { href: 'glossario.html#glossary-trigger-autocall', label: 'Glossario: trigger di autocall' },
      { href: 'faq.html#faq-qual-e-la-differenza-fondamentale-tra-certificati-autocallable-e-softcallable', label: 'FAQ: rimborso automatico e facoltà dell’emittente' },
      { href: 'faq.html#faq-cos-e-il-meccanismo-step-down-e-perche-e-cosi-ricercato-dagli-investitori', label: 'FAQ: meccanismo Step-Down' }
    ]
  };

  Object.entries(moduleLinks).forEach(([moduleId, links]) => {
    const content = document.querySelector(`#${moduleId} .module-content`);
    if (!content || content.querySelector('.related-content-links')) return;

    content.insertAdjacentHTML('beforeend', relatedLinksMarkup(links));
  });
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function scrollToSharedContent(container) {
  const targetId = window.location.hash.slice(1);
  if (!targetId) return;

  requestAnimationFrame(() => {
    const target = document.getElementById(targetId);
    if (target && container.contains(target)) target.scrollIntoView({ block: 'start' });
  });
}

function initFormationShareButtons() {
  document.querySelectorAll('.module-card[id]').forEach(card => {
    const header = card.querySelector('.module-header');
    const title = card.querySelector('.module-title');
    if (!header || !title || header.querySelector('.content-share')) return;
    header.insertAdjacentHTML('beforeend', contentShareMenuMarkup(card.id, title.textContent.trim()));
  });
}

function shareIconMarkup(platform) {
  const icons = {
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"></path></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.6 4.1 1.6 5.8L.2 24l6.6-1.7a11.8 11.8 0 0 0 5.3 1.3h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.1-1.2-6.1-3.5-8.3ZM12.2 21.4h-.1c-1.7 0-3.4-.5-4.8-1.4l-.3-.2-3.9 1 1-3.8-.2-.3a9.6 9.6 0 1 1 8.3 4.7Zm5.3-7.2c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.4 4.7 2 .8 2.7.9 3.7.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22.5 2.2 19 21.1c-.3 1.3-1 1.6-2.1 1L11 17.7l-2.8 2.7c-.3.3-.5.5-1 .5l.4-6.1L18.7 5c.5-.4-.1-.7-.8-.3L4.2 13.5l-5.9-1.9c-1.3-.4-1.3-1.3.3-1.9L21.5 1c1.1-.4 2 .3 1 1.2Z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3"/></svg>'
  };
  return icons[platform];
}

function initShareButtons() {
  if (initShareButtons.initialized) return;
  initShareButtons.initialized = true;

  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-copy-share-url]');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    const originalMarkup = button.innerHTML;
    const label = button.querySelector('span');
    const shareMenu = button.closest('.content-share');
    try {
      await copyTextToClipboard(new URL(button.dataset.copyShareUrl, window.location.href).href);
      if (label) label.textContent = 'Link copiato';
      else button.textContent = 'OK';
      setTimeout(() => {
        button.innerHTML = originalMarkup;
        if (!shareMenu?.isConnected) return;
        shareMenu.open = false;
        shareMenu.querySelector('summary')?.focus();
      }, 1400);
    } catch {
      if (label) label.textContent = 'Copia non riuscita';
      else button.textContent = 'NO';
      setTimeout(() => { button.innerHTML = originalMarkup; }, 1600);
    }
  });

  document.addEventListener('click', event => {
    const currentMenu = event.target.closest('.content-share');
    if (currentMenu && event.target.closest('.share-menu-item[href]')) {
      currentMenu.open = false;
    }
    document.querySelectorAll('.content-share[open]').forEach(menu => {
      if (menu !== currentMenu) menu.open = false;
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const openMenu = document.querySelector('.content-share[open]');
    if (!openMenu) return;
    openMenu.open = false;
    openMenu.querySelector('summary').focus();
  });
}

function initCopyableIsins(container) {
  // Mantiene stabile la larghezza del controllo mentre il testo cambia in "ISIN COPIATO!".
  container.querySelectorAll('[data-copy-isin]').forEach(isinElement => {
    const isin = isinElement.dataset.copyIsin;
    const originalMarkup = isinElement.innerHTML;
    const originalWidth = isinElement.getBoundingClientRect().width;
    isinElement.style.width = `${originalWidth}px`;

    const copyIsin = async (event) => {
      event.preventDefault();
      event.stopPropagation();

      try {
        await copyTextToClipboard(isin);
        isinElement.classList.add('is-copied');
        isinElement.textContent = 'ISIN COPIATO!';
        setTimeout(() => {
          isinElement.classList.remove('is-copied');
          isinElement.innerHTML = originalMarkup;
        }, 1200);
      } catch {
        isinElement.classList.add('copy-failed');
        setTimeout(() => {
          isinElement.classList.remove('copy-failed');
        }, 1600);
      }
    };

    isinElement.addEventListener('click', copyIsin);
  });
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Prova il fallback se il browser nega l'accesso agli appunti.
    }
  }

  // Il fallback consente la copia anche aprendo le pagine da file:// o in browser meno recenti.
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();

  const copied = document.execCommand('copy');
  textArea.remove();

  if (!copied) throw new Error('Clipboard non disponibile');
}

/* ==========================================================================
   3. Catalogo Certificati (Filtri e Ricerca)
   ========================================================================== */
function initCertificatesCatalog() {
  const cardsContainer = document.getElementById('certificates-cards');
  const searchInput = document.getElementById('filter-search');
  const issuerSelect = document.getElementById('filter-issuer');
  const typeSelect = document.getElementById('filter-type');
  const countEl = document.getElementById('certificates-count');
  const pagination = document.getElementById('certificates-pagination');
  const pageSize = 12;
  let currentPage = 1;

  if (!cardsContainer || typeof CERTIFICATES_DATA === 'undefined') return;

  // Genera le opzioni emittente a partire dai dati, evitando duplicati.
  if (issuerSelect && issuerSelect.options.length <= 1) {
    const issuers = [...new Set(CERTIFICATES_DATA.map(c => c.issuer))].sort();
    issuers.forEach(iss => {
      const opt = document.createElement('option');
      opt.value = iss;
      opt.textContent = iss;
      issuerSelect.appendChild(opt);
    });
  }

  // Genera le opzioni per tipologia a partire dai certificati disponibili.
  if (typeSelect && typeSelect.options.length <= 1) {
    const types = [...new Set(CERTIFICATES_DATA.map(c => c.type))].sort();
    types.forEach(tp => {
      const opt = document.createElement('option');
      opt.value = tp;
      opt.textContent = tp;
      typeSelect.appendChild(opt);
    });
  }

  function renderCertificateCards(data) {
    if (data.length === 0) {
      cardsContainer.innerHTML = `
        <div class="card empty-state empty-state-catalog">
          Nessun certificato trovato con i filtri selezionati. Prova a reimpostare i parametri di ricerca.
        </div>
      `;
      if (countEl) countEl.textContent = '0 certificati trovati';
      if (pagination) pagination.innerHTML = '';
      return;
    }

    if (countEl) {
      countEl.textContent = `${data.length} ${data.length === 1 ? 'certificato trovato' : 'certificati trovati'}`;
    }

    const totalPages = Math.ceil(data.length / pageSize);
    currentPage = Math.min(currentPage, totalPages);
    const pageStart = (currentPage - 1) * pageSize;
    cardsContainer.innerHTML = data.slice(pageStart, pageStart + pageSize).map(certificateCardMarkup).join('');

    initCopyableIsins(cardsContainer);
    alignCertificateMetrics(cardsContainer);
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (!pagination) return;
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let pages = [];
    if (totalPages <= 7) {
      pages = Array.from({ length: totalPages }, (_, index) => index + 1);
    } else {
      pages = [1];
      if (currentPage > 3) pages.push('…');
      const startPage = currentPage <= 2 ? 2 : Math.max(2, currentPage - 1);
      const endPage = currentPage >= totalPages - 1 ? totalPages - 1 : Math.min(totalPages - 1, currentPage + 1);
      for (let page = startPage; page <= endPage; page += 1) pages.push(page);
      if (currentPage < totalPages - 2) pages.push('…');
      pages.push(totalPages);
    }

    const pageButtons = pages.map(page => page === '…'
      ? '<span class="pagination-ellipsis" aria-hidden="true">…</span>'
      : `<button type="button" class="pagination-button${page === currentPage ? ' is-active' : ''}" data-page="${page}"${page === currentPage ? ' aria-current="page"' : ''} aria-label="Pagina ${page}">${page}</button>`
    ).join('');

    pagination.innerHTML = `
      <button type="button" class="pagination-button pagination-direction" data-page="${currentPage - 1}"${currentPage === 1 ? ' disabled' : ''} aria-label="Pagina precedente">Precedente</button>
      ${pageButtons}
      <button type="button" class="pagination-button pagination-direction" data-page="${currentPage + 1}"${currentPage === totalPages ? ' disabled' : ''} aria-label="Pagina successiva">Successiva</button>
    `;
  }

  function filterData(resetPage = true) {
    // Applica tutti i filtri insieme e ridisegna anche il conteggio dei risultati.
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const selectedIssuer = issuerSelect ? issuerSelect.value : '';
    const selectedType = typeSelect ? typeSelect.value : '';
    if (resetPage) currentPage = 1;

    const filtered = CERTIFICATES_DATA.filter(c => {
      const matchQuery = !query || 
        c.isin.toLowerCase().includes(query) || 
        c.underlyings.join(', ').toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query);

      const matchIssuer = !selectedIssuer || c.issuer === selectedIssuer;
      const matchType = !selectedType || c.type === selectedType;

      return matchQuery && matchIssuer && matchType;
    });

    renderCertificateCards(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', filterData);
  if (issuerSelect) issuerSelect.addEventListener('change', filterData);
  if (typeSelect) typeSelect.addEventListener('change', filterData);
  if (pagination) {
    pagination.addEventListener('click', event => {
      const button = event.target.closest('[data-page]');
      if (!button || button.disabled) return;
      currentPage = Number(button.dataset.page);
      filterData(false);
    });
  }

  renderCertificateCards(CERTIFICATES_DATA);
}

/* ==========================================================================
   4. Glossario Interattivo Avanzato (Ricerca, A-Z e Filtri Categoria)
   ========================================================================== */
function initGlossary() {
  const container = document.getElementById('glossary-container');
  const searchInput = document.getElementById('glossary-search');
  const lettersContainer = document.getElementById('glossary-letters');
  const categoryContainer = document.getElementById('glossary-categories');
  const countDisplay = document.getElementById('glossary-count');
  if (!container) return;

  const cards = [...container.querySelectorAll('.glossary-card')];
  if (cards.length === 0) return;

  let currentLetter = 'ALL';
  let currentCategory = 'ALL';

  const entries = cards.map(card => {
    const title = card.querySelector('.glossary-card-title');
    const termElement = title?.querySelector(':scope > span:first-child');
    const categoryElement = title?.querySelector(':scope > .badge');
    const definitionElement = card.querySelector('.glossary-card-def');
    const exampleElement = card.querySelector('.glossary-example');
    const term = termElement?.textContent.trim() || '';

    if (title && term && !title.querySelector('.content-share')) {
      title.insertAdjacentHTML('beforeend', contentShareMenuMarkup(card.id, term));
    }

    return {
      card,
      term,
      category: categoryElement?.textContent.trim() || '',
      searchableText: [
        term,
        categoryElement?.textContent || '',
        definitionElement?.textContent || '',
        exampleElement?.textContent || ''
      ].join(' ').toLowerCase()
    };
  });

  const emptyState = document.createElement('div');
  emptyState.className = 'card empty-state';
  emptyState.style.display = 'none';
  const emptyTitle = document.createElement('p');
  emptyTitle.className = 'empty-state-title';
  emptyTitle.textContent = 'Nessun termine trovato';
  const emptyText = document.createElement('p');
  emptyText.className = 'empty-state-text';
  emptyText.textContent = 'Prova a modificare la ricerca testuale o reimposta i filtri alfabetici.';
  emptyState.append(emptyTitle, emptyText);
  container.append(emptyState);

  if (lettersContainer) {
    const availableLetters = ['ALL', ...[...new Set(entries.map(item => item.term.charAt(0).toUpperCase()))].sort()];
    availableLetters.forEach(letter => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `glossary-letter-btn${letter === 'ALL' ? ' active' : ''}`;
      button.dataset.letter = letter;
      button.setAttribute('aria-pressed', String(letter === 'ALL'));
      button.textContent = letter === 'ALL' ? 'Tutti' : letter;
      button.addEventListener('click', () => {
        lettersContainer.querySelectorAll('.glossary-letter-btn').forEach(other => {
          const isSelected = other === button;
          other.classList.toggle('active', isSelected);
          other.setAttribute('aria-pressed', String(isSelected));
        });
        currentLetter = letter;
        filterGlossary();
      });
      lettersContainer.append(button);
    });
  }

  if (categoryContainer) {
    const categories = ['ALL', ...new Set(entries.map(item => item.category))].sort();
    categories.forEach(category => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `badge filter-pill glossary-category-pill ${category === 'ALL' ? 'badge-primary' : 'badge-neutral'}`;
      button.dataset.category = category;
      button.setAttribute('aria-pressed', String(category === 'ALL'));
      button.textContent = category === 'ALL' ? 'Tutte le categorie' : category;
      button.addEventListener('click', () => {
        categoryContainer.querySelectorAll('button').forEach(other => {
          const isSelected = other === button;
          other.classList.toggle('badge-primary', isSelected);
          other.classList.toggle('badge-neutral', !isSelected);
          other.setAttribute('aria-pressed', String(isSelected));
        });
        currentCategory = category;
        filterGlossary();
      });
      categoryContainer.append(button);
    });
  }

  function filterGlossary() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    let visibleCount = 0;

    entries.forEach(item => {
      const matchesLetter = currentLetter === 'ALL' || item.term.charAt(0).toUpperCase() === currentLetter;
      const matchesCategory = currentCategory === 'ALL' || item.category === currentCategory;
      const matchesQuery = !query || item.searchableText.includes(query);
      const isVisible = matchesLetter && matchesCategory && matchesQuery;
      item.card.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount += 1;
    });

    emptyState.style.display = visibleCount === 0 ? '' : 'none';
    if (countDisplay) {
      countDisplay.textContent = `${visibleCount} ${visibleCount === 1 ? 'termine visualizzato' : 'termini visualizzati'}`;
    }
  }

  if (searchInput) searchInput.addEventListener('input', filterGlossary);

  filterGlossary();
  scrollToSharedContent(container);
}

/* ==========================================================================
   5. Accordion FAQ Dinamico con Ricerca Live e Filtro Categorie
   ========================================================================== */
function initFaqAccordion() {
  const container = document.getElementById('faq-container');
  const searchInput = document.getElementById('faq-search');
  const categoryPillsContainer = document.getElementById('faq-categories');
  const countEl = document.getElementById('faq-count');
  if (!container) return;

  const items = [...container.querySelectorAll('.faq-item')];
  if (items.length === 0) return;

  let currentCategory = 'ALL';
  let autoOpenAll = false;
  const requestedFaqId = window.location.hash.slice(1);
  const hasSharedQuestion = items.some(item => item.id === requestedFaqId);

  const entries = items.map(item => {
    const questionButton = item.querySelector('.faq-question');
    const header = item.querySelector('.faq-item-header');
    const questionElement = item.querySelector('.faq-item-question-text');
    const categoryElement = item.querySelector('.faq-item-category');
    const answerElement = item.querySelector('.faq-answer');
    const answerText = answerElement?.cloneNode(true);
    answerText?.querySelectorAll('.related-content-links').forEach(link => link.remove());
    const question = questionElement?.textContent.trim() || '';

    if (header && question && !header.querySelector('.content-share')) {
      header.insertAdjacentHTML('beforeend', contentShareMenuMarkup(item.id, question));
    }

    return {
      item,
      questionButton,
      question,
      category: categoryElement?.textContent.trim() || '',
      searchableText: [
        question,
        categoryElement?.textContent || '',
        answerText?.textContent || ''
      ].join(' ').toLowerCase()
    };
  });

  const emptyState = document.createElement('div');
  emptyState.className = 'card empty-state';
  emptyState.style.display = 'none';
  const emptyTitle = document.createElement('p');
  emptyTitle.className = 'empty-state-title';
  emptyTitle.textContent = 'Nessuna risposta trovata';
  const emptyText = document.createElement('p');
  emptyText.className = 'empty-state-text';
  emptyText.textContent = 'Prova ad utilizzare parole chiave differenti (es. minusvalenze, barriera, airbag, market maker).';
  emptyState.append(emptyTitle, emptyText);
  container.append(emptyState);

  function preserveFaqControlPosition(control, initialTop) {
    requestAnimationFrame(() => {
      const verticalShift = control.getBoundingClientRect().top - initialTop;
      if (Math.abs(verticalShift) > 1) {
        window.scrollBy({ top: verticalShift, behavior: 'instant' });
      }
    });
  }

  function setItemExpanded(entry, isExpanded) {
    entry.item.classList.toggle('active', isExpanded);
    entry.questionButton?.setAttribute('aria-expanded', String(isExpanded));
  }

  if (categoryPillsContainer) {
    const categories = ['ALL', ...new Set(entries.map(entry => entry.category))];
    categories.forEach(category => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `badge filter-pill faq-category-pill ${category === 'ALL' ? 'badge-primary' : 'badge-neutral'}`;
      button.dataset.cat = category;
      button.setAttribute('aria-pressed', String(category === 'ALL'));
      button.textContent = category === 'ALL' ? 'Tutte le domande' : category;
      button.addEventListener('click', () => {
        categoryPillsContainer.querySelectorAll('button').forEach(other => {
          const isSelected = other === button;
          other.classList.toggle('badge-primary', isSelected);
          other.classList.toggle('badge-neutral', !isSelected);
          other.setAttribute('aria-pressed', String(isSelected));
        });
        currentCategory = category;
        filterFaqs();
      });
      categoryPillsContainer.append(button);
    });
  }

  function filterFaqs() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    autoOpenAll = query.length > 0;
    const visibleEntries = [];

    entries.forEach(entry => {
      const matchesCategory = currentCategory === 'ALL' || entry.category === currentCategory;
      const matchesQuery = !query || entry.searchableText.includes(query);
      const isVisible = matchesCategory && matchesQuery;
      entry.item.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleEntries.push(entry);
    });

    const sharedEntry = hasSharedQuestion
      ? visibleEntries.find(entry => entry.item.id === requestedFaqId)
      : null;
    const firstVisibleEntry = visibleEntries[0];
    visibleEntries.forEach(entry => {
      const shouldExpand = autoOpenAll || entry === sharedEntry || (!sharedEntry && entry === firstVisibleEntry);
      setItemExpanded(entry, shouldExpand);
    });
    entries.filter(entry => !visibleEntries.includes(entry)).forEach(entry => setItemExpanded(entry, false));

    emptyState.style.display = visibleEntries.length === 0 ? '' : 'none';
    if (countEl) {
      countEl.textContent = `${visibleEntries.length} ${visibleEntries.length === 1 ? 'domanda trovata' : 'domande trovate'}`;
    }
  }

  entries.forEach(entry => {
    const { item, questionButton } = entry;
    const shareMenu = item.querySelector('.content-share');
    questionButton?.addEventListener('click', () => {
      const isCurrentlyActive = item.classList.contains('active');
      const initialTop = questionButton.getBoundingClientRect().top;
      if (!autoOpenAll) {
        entries.forEach(other => {
          if (other !== entry && other.item.style.display !== 'none') setItemExpanded(other, false);
        });
      }
      setItemExpanded(entry, !isCurrentlyActive);
      if (!isCurrentlyActive) preserveFaqControlPosition(questionButton, initialTop);
    });

    if (shareMenu && questionButton) {
      shareMenu.addEventListener('toggle', () => {
        if (!shareMenu.open || item.classList.contains('active')) return;

        const summary = shareMenu.querySelector('summary');
        const initialTop = summary.getBoundingClientRect().top;
        if (!autoOpenAll) {
          entries.forEach(other => {
            if (other !== entry && other.item.style.display !== 'none') setItemExpanded(other, false);
          });
        }
        setItemExpanded(entry, true);
        preserveFaqControlPosition(summary, initialTop);
      });
    }
  });

  if (searchInput) searchInput.addEventListener('input', filterFaqs);

  filterFaqs();
  scrollToSharedContent(container);
}

/* ==========================================================================
   6. Emittenti Grid
   ========================================================================== */
function issuerShareText(name, profileDetail = '') {
  const heading = profileDetail ? `${name} • ${profileDetail}` : name;
  return `${heading}\nScopri il profilo dell’emittente, il suo rating e le informazioni utili per valutare i certificati di investimento.`;
}

function initIssuersList() {
  document.querySelectorAll('#issuers-list .issuer-card').forEach(card => {
    const header = card.querySelector('.issuer-header');
    const issuerName = card.querySelector('.issuer-name')?.textContent.trim();
    if (!header || !issuerName || !card.id || header.querySelector('.content-share')) return;

    const issuerDescriptor = card.querySelector('.issuer-country')?.textContent.trim().split(' • ').slice(1).join(' • ');
    const issuerUrl = new URL(window.location.href);
    issuerUrl.hash = card.id;
    header.insertAdjacentHTML('beforeend', contentShareMenuMarkup(card.id, `Emittente ${issuerName}`, issuerShareText(issuerName, issuerDescriptor), issuerUrl.href));
  });

  const container = document.getElementById('issuers-grid');
  if (!container || typeof ISSUERS_DATA === 'undefined') return;

  let html = '';
  ISSUERS_DATA.forEach(iss => {
    const issuerId = issuerAnchorId(iss.name);
    const issuerUrl = new URL('emittenti.html', window.location.href);
    issuerUrl.hash = issuerId;
    const issuerRatings = [
      ['S&P', iss.ratingSP],
      ["Moody's", iss.ratingMoodys],
      ['Fitch', iss.ratingFitch]
    ].map(([agency, rating]) => [
      agency,
      rating && rating.toLowerCase() !== 'non rated' ? rating : 'N.D.'
    ]);
    const ratingBadges = issuerRatings
      .map(([agency, rating]) => `<span class="issuer-rating-badge">${agency}: ${rating}</span>`)
      .join('');

    html += `
      <div class="issuer-card" id="${issuerId}">
        <div>
          <div class="issuer-rating">
            <span class="badge badge-neutral">${iss.country}</span>
            ${ratingBadges}
          </div>
          <div class="issuer-card-heading">
            <h3 class="issuer-name issuer-card-name">${iss.name}</h3>
            ${contentShareMenuMarkup(issuerId, `Emittente ${iss.name}`, issuerShareText(iss.name), issuerUrl.href)}
          </div>
          <p class="issuer-market-share">
            ${iss.marketShare}
          </p>
          <p class="issuer-description">
            ${iss.description}
          </p>
        </div>
        <div class="issuer-card-footer">
          <a href="${iss.website}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary">
            Sito Ufficiale ↗
          </a>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/* ==========================================================================
   7. Scheda Recensione / Dettaglio Certificato
   ========================================================================== */
function initReviewPage() {
  const reviewContainer = document.getElementById('review-content-area');
  if (!reviewContainer) return;

  if (reviewContainer.dataset.reviewIsin) {
    initCopyableIsins(reviewContainer);
    const isinPicker = document.getElementById('review-isin-picker');
    if (isinPicker) {
      isinPicker.addEventListener('change', (event) => {
        window.location.href = reviewTemplateUrl(event.target.value);
      });
    }
    return;
  }
  if (typeof CERTIFICATES_DATA === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const requestedIsin = params.get('isin') || CERTIFICATES_DATA[0]?.isin;
  if (
    requestedIsin
    && Array.isArray(window.STATIC_REVIEW_ISINS)
    && window.STATIC_REVIEW_ISINS.includes(requestedIsin)
  ) {
    window.location.replace(reviewTemplateUrl(requestedIsin));
    return;
  }
  let isin = params.get('isin') || reviewContainer.dataset.reviewIsin || "NLBNPIT239B1";

  let cert = CERTIFICATES_DATA.find(c => c.isin === isin);
  if (!cert) {
    cert = CERTIFICATES_DATA[0];
    isin = cert.isin;
  }

  const issuer = typeof ISSUERS_DATA !== 'undefined'
    ? ISSUERS_DATA.find(item => item.name === cert.issuer || item.name.startsWith(`${cert.issuer} `))
    : null;
  const capitalBarrier = parseFloat(cert.barrierCapital) || 0;
  const couponBarrier = Number.parseFloat(cert.barrierCoupon) || capitalBarrier;
  const annualYield = Number(cert.annualYield) || 0;
  const monthlyYield = annualYield / 12;
  const formattedAnnualYield = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(annualYield);
  const reviewShareText = `${cert.name}\nRendimento potenziale annuo ${formattedAnnualYield}% · barriera capitale ${cert.barrierCapital}`;
  const ratingEntries = issuer && issuer.ratings
    ? Object.entries(issuer.ratings).filter(([, rating]) => rating && rating.toLowerCase() !== 'non rated')
    : issuer
      ? [
          ['S&P', issuer.ratingSP],
          ["Moody's", issuer.ratingMoodys],
          ['Fitch', issuer.ratingFitch]
        ].filter(([, rating]) => rating && rating.toLowerCase() !== 'non rated')
      : [];
  const ratingText = ratingEntries.length > 0
    ? ratingEntries.map(([agency, rating]) => `${agency}: ${rating}`).join(' · ')
    : 'Rating non disponibile nel database';

  const generatedReview = buildGeneratedReviewContent(cert);
  const generatedScenarios = generatedReview.scenarios;
  const generatedPros = generatedReview.pros;
  const generatedCons = generatedReview.cons;

  const reviewDisclaimer = `<div class="review-disclaimer"><p><strong>Avvertenza importante:</strong> le informazioni riportate hanno finalità esclusivamente informative e non costituiscono consulenza finanziaria, raccomandazione personalizzata o invito all'investimento. I certificati sono strumenti complessi e comportano rischi, inclusa la possibile perdita del capitale e il rischio emittente. Prima di assumere qualsiasi decisione, leggi il KID e la documentazione ufficiale del prodotto e valuta attentamente la tua situazione finanziaria.</p><a href="disclaimer.html" class="btn btn-secondary btn-sm">Disclaimer e Note Legali</a></div>`;
  const review = {
    summary: generatedReview.paragraphs.map(paragraph => `<p>${paragraph}</p>`).join(''),
    scenarios: generatedScenarios,
    pros: generatedPros,
    cons: generatedCons
  };

  let scenariosHtml = '';
  review.scenarios.forEach((sc, index) => {
    scenariosHtml += `
      <tr class="scenario-row scenario-row-${index + 1}">
        <td data-label="Scenario"><strong>${sc.scenario}</strong></td>
        <td data-label="Sottostanti">${sc.sottostante}</td>
        <td data-label="Cedole">${sc.cedole}</td>
        <td data-label="Rimborso capitale">${sc.capitale}</td>
        <td data-label="Esito finanziario"><strong class="scenario-result">${sc.rendimentoNetto}</strong></td>
      </tr>
    `;
  });

  let prosHtml = review.pros.map(p => `<li>${p}</li>`).join('');
  let consHtml = review.cons.map(c => `<li>${c}</li>`).join('');

  let certOptions = CERTIFICATES_DATA.map(c => {
    return `<option value="${c.isin}" ${c.isin === isin ? 'selected' : ''}>${c.isin} - ${c.name}</option>`;
  }).join('');

  reviewContainer.innerHTML = `
    <div class="review-toolbar">
      <div class="review-toolbar-group">
        <select id="review-isin-picker" class="form-control review-isin-picker" aria-label="Cambia Certificato">
          ${certOptions}
        </select>
      </div>
      <a href="certificati.html" class="btn btn-sm btn-secondary">
        ← Torna al Catalogo
      </a>
    </div>

    <div class="review-sticky-header">
      <div class="review-isin-row">
        <button type="button" class="review-isin-copy" data-copy-isin="${cert.isin}" title="Copia ISIN">
          <span class="cert-isin-copy-label">ISIN</span>
          <span>${cert.isin}</span>
        </button>
        <nav class="review-section-links" aria-label="Sezioni della scheda tecnica">
          <a href="#review-overview">Riepilogo<br>certificato</a>
          <a href="#review-scenarios">Matrice<br>scenari</a>
          <a href="#review-pros-cons">Punti di forza<br>e criticità</a>
        </nav>
        ${contentShareMenuMarkup('review-overview', cert.name, reviewShareText)}
      </div>
    </div>

    <div class="review-hero">
      <h1 class="review-title">
        Analisi del certificato ${cert.name}
      </h1>
      <p class="review-title-isin">ISIN: <strong>${cert.isin}</strong></p>

      <div class="review-summary-text">
        ${review.summary}
      </div>

      <div class="review-overview" id="review-overview">
        <div class="review-overview-heading">
          <h2>Riepilogo certificato</h2>
        </div>

        <div class="review-overview-grid">
          <div class="meta-box review-overview-item review-overview-item-wide">
            <span class="meta-box-label">Emittente e rating</span>
            <span class="meta-box-value meta-box-value-small review-issuer-value">${cert.issuer}</span>
            <small class="meta-box-detail">${ratingText}</small>
          </div>
          <div class="meta-box review-overview-item review-overview-item-wide">
            <span class="meta-box-label">Basket</span>
            <span class="meta-box-value meta-box-value-small review-underlyings-value">${cert.underlyings.join(', ')}</span>
          </div>
          <div class="meta-box review-overview-item review-overview-highlight">
            <span class="meta-box-label">Rend. pot. annuo</span>
            <span class="meta-box-value">${annualYield.toFixed(2)}%</span>
          </div>
          <div class="meta-box review-overview-item review-overview-highlight">
            <span class="meta-box-label">Rend. pot. mensile</span>
            <span class="meta-box-value review-monthly-yield-value">${monthlyYield.toFixed(2)}%</span>
          </div>
          <div class="meta-box review-overview-item">
            <span class="meta-box-label">Barriera capitale</span>
            <span class="meta-box-value review-capital-barrier-value">${cert.barrierCapital} · Europea</span>
            <small class="meta-box-detail">Osservazione a scadenza</small>
          </div>
          <div class="meta-box review-overview-item">
            <span class="meta-box-label">Barriera coupon</span>
            <span class="meta-box-value">${cert.barrierCoupon}</span>
            <small class="meta-box-detail">Effetto memoria: presente</small>
          </div>
          <div class="meta-box review-overview-item">
            <span class="meta-box-label">Rischio cambio</span>
            <span class="meta-box-value">Assente</span>
            <small class="meta-box-detail">Struttura Quanto</small>
          </div>
          <div class="meta-box review-overview-item">
            <span class="meta-box-label">Step-down</span>
            <span class="meta-box-value meta-box-value-small">${cert.stepDown}${formatStepDownStartMonth(cert.stepDownStartMonth) ? `<br><small>${formatStepDownStartMonth(cert.stepDownStartMonth)}</small>` : ''}</span>
          </div>
          <div class="meta-box review-overview-item">
            <span class="meta-box-label">Emissione</span>
            <span class="meta-box-value meta-box-value-small review-date-value">${cert.strikeDate}</span>
          </div>
          <div class="meta-box review-overview-item">
            <span class="meta-box-label">Scadenza</span>
            <span class="meta-box-value meta-box-value-small review-date-value">${cert.expiryDate}</span>
          </div>
        </div>
      </div>

    <!-- Scenari a Scadenza -->
    <div class="card scenario-card review-scenarios-card" id="review-scenarios">
      <div class="scenario-card-heading">
        <h2>Matrice Scenari di Rimborso a Scadenza</h2>
      </div>
      <p class="scenario-description">
        Simulazione teorica del pay-off a scadenza, con i livelli espressi in rapporto agli strike iniziali dei sottostanti, fissati al momento del fixing del prodotto.
      </p>
      <div class="table-responsive scenario-table-wrap">
        <table class="scenario-table">
          <thead>
            <tr>
              <th>Scenario di Mercato</th>
              <th>Stato Sottostanti</th>
              <th>Cedole Spettanti</th>
              <th>Rimborso Capitale</th>
              <th>Esito Finanziario</th>
            </tr>
          </thead>
          <tbody>
            ${scenariosHtml}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pro & Contro -->
    <div class="pros-cons-grid" id="review-pros-cons">
      <div class="pros-box">
        <h3 class="pros-title">Punti di Forza</h3>
        <ul>
          ${prosHtml}
        </ul>
      </div>
      <div class="cons-box">
        <h3 class="cons-title">Criticità e Rischi</h3>
        <ul>
          ${consHtml}
        </ul>
      </div>
    </div>

    ${reviewDisclaimer}
  `;

  initCopyableIsins(reviewContainer);

  const isinPicker = document.getElementById('review-isin-picker');
  if (isinPicker) {
    isinPicker.addEventListener('change', (e) => {
      window.location.href = reviewTemplateUrl(e.target.value);
    });
  }
}

/* ==========================================================================
   8. Contact Form Handler
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const responseMsg = document.getElementById('contact-response-msg');

  if (form && responseMsg) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const subject = formData.get('subject');
      const body = [
        `Nome e Cognome: ${formData.get('name')}`,
        `Email: ${formData.get('email')}`,
        `Oggetto: ${subject}`,
        '',
        String(formData.get('message'))
      ].join('\n');
      const mailtoUrl = `mailto:info@pertefinanza.it?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
      }

      window.location.href = mailtoUrl;
      responseMsg.style.display = 'block';
      if (submitBtn) submitBtn.disabled = false;
    });
  }
}
