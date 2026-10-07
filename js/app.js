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
  const currentPage = pathnamePage === 'recensione.html' ? 'certificati.html' : pathnamePage;
  document.querySelectorAll('.main-nav, .mobile-nav').forEach(nav => {
    const linkClass = nav.classList.contains('mobile-nav') ? 'mobile-nav-link' : 'nav-link';
    nav.querySelectorAll(`a.${linkClass}`).forEach(link => {
      const linkPage = new URL(link.getAttribute('href'), window.location.href).pathname.split('/').pop();
      const isCurrentPage = linkPage === currentPage;
      link.classList.toggle('active', isCurrentPage);
      if (isCurrentPage) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (!nav.querySelector('.theme-toggle')) {
      nav.insertAdjacentHTML('beforeend', themeToggleMarkup(linkClass));
    }
  });
}

function themeToggleMarkup(navClass) {
  return `
    <button type="button" class="${navClass} theme-toggle" aria-label="Attiva tema notte" aria-pressed="false">
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

  const topPicks = CERTIFICATES_DATA.filter(c => c.showTopPick).slice(0, 2);
  let html = '';

  topPicks.forEach(c => {
    const reviewUrl = `recensione.html?isin=${encodeURIComponent(c.isin)}`;
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
            <a href="recensione.html?isin=${encodeURIComponent(c.isin)}" class="btn btn-sm btn-primary home-certificate-tech-button">SCHEDA TECNICA →</a>
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
  if (!container || typeof CERTIFICATES_DATA === 'undefined') return;

  container.innerHTML = CERTIFICATES_DATA.filter(c => c.showHome).map(certificateCardMarkup).join('');
  initCopyableIsins(container);
  alignCertificateMetrics(container);
}



function reviewPreviewMarkup(cert) {
  const monthlyYield = cert.annualYield / 12;
  const issuer = typeof ISSUERS_DATA !== 'undefined'
    ? ISSUERS_DATA.find(item => item.name === cert.issuer)
    : null;
  const issuerDescription = issuer
    ? (issuer.marketShare || issuer.description).toLowerCase().replace(/[.!?]+$/, '')
    : 'emittente attivo nel mercato dei prodotti strutturati';
  const ratingParts = issuer && issuer.ratings
    ? Object.entries(issuer.ratings)
      .map(([agency, rating]) => `${rating} da parte di ${agency}`)
    : '';
  const ratings = ratingParts.length > 1
    ? `${ratingParts.slice(0, -1).join(', ')} e ${ratingParts[ratingParts.length - 1]}`
    : ratingParts[0] || '';
  const ratingSentence = ratings ? ` ${cert.issuer} vanta un rating ${ratings}.` : '';
  const issuerLink = `<a href="emittenti.html#${issuerAnchorId(cert.issuer)}">${cert.issuer}</a>`;
  const underlyingList = `<span class="certificate-preview-underlyings" aria-label="Sottostanti">${cert.underlyings.map(name => `<span class="certificate-preview-underlying"><strong>${name}</strong></span>`).join(' <span class="certificate-preview-separator" aria-hidden="true">·</span> ')}</span>`;
  return `<div class="certificate-preview">Il certificato in oggetto è emesso da <strong>${issuerLink}</strong>, ${issuerDescription}.${ratingSentence} La struttura investe su:${underlyingList} e prevede un rendimento potenziale mensile del <strong>${monthlyYield.toFixed(2)}%</strong> (con effetto memoria), con scadenza il ${cert.expiryDate}. La barriera capitale è posta al <strong>${cert.barrierCapital}</strong> (europea, con valutazione a scadenza).</div>`;
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
  const shareUrl = new URL(`recensione.html?isin=${encodeURIComponent(c.isin)}`, window.location.href).href;
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

  if (!container || typeof GLOSSARY_DATA === 'undefined') return;

  const sortedGlossary = [...GLOSSARY_DATA].sort((a, b) => a.term.localeCompare(b.term));

  let currentLetter = 'ALL';
  let currentCategory = 'ALL';

  // Genera il filtro alfabetico usando solo le iniziali realmente presenti nei dati.
  if (lettersContainer) {
    const availableLetters = ['ALL', ...[...new Set(sortedGlossary.map(item => item.term.charAt(0).toUpperCase()))].sort()];
    let lettersHtml = '';
    availableLetters.forEach(l => {
      const label = l === 'ALL' ? 'Tutti' : l;
      const activeClass = l === 'ALL' ? 'active' : '';
      lettersHtml += `<button type="button" class="glossary-letter-btn ${activeClass}" data-letter="${l}" aria-pressed="${l === 'ALL'}">${label}</button>`;
    });
    lettersContainer.innerHTML = lettersHtml;

    lettersContainer.querySelectorAll('.glossary-letter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        lettersContainer.querySelectorAll('.glossary-letter-btn').forEach(button => {
          button.classList.remove('active');
          button.setAttribute('aria-pressed', 'false');
        });
        const selectedButton = e.currentTarget;
        selectedButton.classList.add('active');
        selectedButton.setAttribute('aria-pressed', 'true');
        currentLetter = selectedButton.getAttribute('data-letter');
        filterGlossary();
      });
    });
  }

  // Genera le categorie e mantiene una sola categoria visivamente attiva.
  if (categoryContainer) {
    const categories = ['ALL', ...new Set(sortedGlossary.map(item => item.category))].sort();
    let catHtml = '';
    categories.forEach(cat => {
      const label = cat === 'ALL' ? 'Tutte le categorie' : cat;
      const activeClass = cat === 'ALL' ? 'active' : '';
      catHtml += `<button type="button" class="badge filter-pill glossary-category-pill ${activeClass ? 'badge-primary' : 'badge-neutral'}" data-category="${cat}" aria-pressed="${cat === 'ALL'}">${label}</button>`;
    });
    categoryContainer.innerHTML = catHtml;

    categoryContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        categoryContainer.querySelectorAll('button').forEach(button => {
          button.classList.remove('badge-primary');
          button.classList.add('badge-neutral');
          button.setAttribute('aria-pressed', 'false');
        });
        const selectedButton = e.currentTarget;
        selectedButton.classList.remove('badge-neutral');
        selectedButton.classList.add('badge-primary');
        selectedButton.setAttribute('aria-pressed', 'true');
        currentCategory = selectedButton.getAttribute('data-category');
        filterGlossary();
      });
    });
  }

  function renderGlossary(items) {
    if (countDisplay) {
      countDisplay.textContent = `${items.length} ${items.length === 1 ? 'termine visualizzato' : 'termini visualizzati'}`;
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div class="card empty-state">
          <p class="empty-state-title">Nessun termine trovato</p>
          <p class="empty-state-text">Prova a modificare la ricerca testuale o reimposta i filtri alfabetici.</p>
        </div>
      `;
      return;
    }

    let html = '';
    items.forEach(item => {
      const itemId = contentAnchorId('glossary', item.term);
      const exampleBox = item.example ? `
        <div class="glossary-example">
          <strong class="glossary-example-label">💡 Esempio pratico / Focus operativo:</strong>
          ${item.example}
        </div>
      ` : '';

      html += `
        <div class="glossary-card" id="${itemId}">
          <div class="glossary-card-title">
            <span>${item.term}</span>
            <span class="badge badge-primary">${item.category}</span>
            ${contentShareMenuMarkup(itemId, item.term)}
          </div>
          <div class="glossary-card-def">
            ${item.definition}
          </div>
          ${exampleBox}
          ${relatedLinksMarkup(item.relatedLinks)}
        </div>
      `;
    });
    container.innerHTML = html;
  }

  function filterGlossary() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const filtered = sortedGlossary.filter(item => {
      const matchesLetter = currentLetter === 'ALL' || item.term.charAt(0).toUpperCase() === currentLetter;
      const matchesCategory = currentCategory === 'ALL' || item.category === currentCategory;
      const matchesQuery = !query || 
        item.term.toLowerCase().includes(query) || 
        item.definition.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.example && item.example.toLowerCase().includes(query));

      return matchesLetter && matchesCategory && matchesQuery;
    });

    renderGlossary(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', filterGlossary);

  renderGlossary(sortedGlossary);
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

  if (!container || typeof FAQS_DATA === 'undefined') {
    // Supporta eventuali FAQ statiche anche senza il dataset dinamico.
    const staticItems = document.querySelectorAll('.faq-item');
    if (staticItems.length > 0) {
      staticItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        if (questionBtn) {
          questionBtn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            staticItems.forEach(other => {
              if (other !== item) other.classList.remove('active');
            });
            item.classList.toggle('active', !isActive);
          });
        }
      });
    }
    return;
  }

  let currentCategory = 'ALL';

  function preserveFaqControlPosition(control, initialTop) {
    requestAnimationFrame(() => {
      const verticalShift = control.getBoundingClientRect().top - initialTop;
      if (Math.abs(verticalShift) > 1) {
        window.scrollBy({ top: verticalShift, behavior: 'instant' });
      }
    });
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

  // Genera i filtri categoria e collega ciascun pulsante alla nuova ricerca.
  if (categoryPillsContainer) {
    const categories = ['ALL', ...new Set(FAQS_DATA.map(f => f.category))];
    let catHtml = '';
    categories.forEach(cat => {
      const label = cat === 'ALL' ? 'Tutte le domande' : cat;
      const activeClass = cat === 'ALL' ? 'badge-primary' : 'badge-neutral';
      catHtml += `<button type="button" class="badge filter-pill faq-category-pill ${activeClass}" data-cat="${cat}" aria-pressed="${cat === 'ALL'}">${label}</button>`;
    });
    categoryPillsContainer.innerHTML = catHtml;

    categoryPillsContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        categoryPillsContainer.querySelectorAll('button').forEach(button => {
          button.classList.remove('badge-primary');
          button.classList.add('badge-neutral');
          button.setAttribute('aria-pressed', 'false');
        });
        const selectedButton = e.currentTarget;
        selectedButton.classList.remove('badge-neutral');
        selectedButton.classList.add('badge-primary');
        selectedButton.setAttribute('aria-pressed', 'true');
        currentCategory = selectedButton.getAttribute('data-cat');
        filterFaqs();
      });
    });
  }

  function renderFaqs(items, autoOpenAll = false) {
    if (countEl) {
      countEl.textContent = `${items.length} ${items.length === 1 ? 'domanda trovata' : 'domande trovate'}`;
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div class="card empty-state">
          <p class="empty-state-title">Nessuna risposta trovata</p>
          <p class="empty-state-text">Prova ad utilizzare parole chiave differenti (es. minusvalenze, barriera, airbag, market maker).</p>
        </div>
      `;
      return;
    }

    let html = '';
    const requestedFaqId = window.location.hash.slice(1);
    const hasSharedQuestion = FAQS_DATA.some(faq => contentAnchorId('faq', faq.question) === requestedFaqId);
    items.forEach((item, index) => {
      // Mostra il primo risultato; durante una ricerca apre tutte le risposte trovate.
      const itemId = contentAnchorId('faq', item.question);
      const questionId = `${itemId}-question`;
      const answerId = `${itemId}-answer`;
      const isActive = autoOpenAll || (hasSharedQuestion ? itemId === requestedFaqId : index === 0);

      html += `
        <div class="faq-item ${isActive ? 'active' : ''}" id="${itemId}">
          <div class="faq-item-header">
            <button type="button" class="faq-question" id="${questionId}" aria-expanded="${isActive}" aria-controls="${answerId}">
              <span class="faq-question-content">
                <span class="badge badge-primary faq-item-category">
                  ${item.category}
                </span>
                <span class="faq-item-question-text">${item.question}</span>
              </span>
              <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            ${contentShareMenuMarkup(itemId, item.question)}
          </div>
          <div class="faq-answer" id="${answerId}" role="region" aria-labelledby="${questionId}">
            ${formatFaqAnswer(item.answer)}
            ${relatedLinksMarkup(item.relatedLinks)}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Collega l'accordion e sincronizza lo stato ARIA con la classe visuale.
    container.querySelectorAll('.faq-item').forEach(item => {
      const questionBtn = item.querySelector('.faq-question');
      const shareMenu = item.querySelector('.content-share');
      if (questionBtn) {
        questionBtn.addEventListener('click', () => {
          const isCurrentlyActive = item.classList.contains('active');
          const initialTop = questionBtn.getBoundingClientRect().top;
          if (!autoOpenAll) {
            container.querySelectorAll('.faq-item').forEach(other => {
              if (other !== item) {
                other.classList.remove('active');
                const otherButton = other.querySelector('.faq-question');
                if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
              }
            });
          }
          const nextIsActive = !isCurrentlyActive;
          item.classList.toggle('active', nextIsActive);
          questionBtn.setAttribute('aria-expanded', String(nextIsActive));
          if (nextIsActive) preserveFaqControlPosition(questionBtn, initialTop);
        });
      }

      if (shareMenu && questionBtn) {
        shareMenu.addEventListener('toggle', () => {
          if (!shareMenu.open || item.classList.contains('active')) return;

          const summary = shareMenu.querySelector('summary');
          const initialTop = summary.getBoundingClientRect().top;
          if (!autoOpenAll) {
            container.querySelectorAll('.faq-item').forEach(other => {
              if (other !== item) {
                other.classList.remove('active');
                other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
              }
            });
          }

          item.classList.add('active');
          questionBtn.setAttribute('aria-expanded', 'true');
          preserveFaqControlPosition(summary, initialTop);
        });
      }
    });
  }

  function filterFaqs() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const filtered = FAQS_DATA.filter(item => {
      const matchCat = currentCategory === 'ALL' || item.category === currentCategory;
      const matchQuery = !query || 
        item.question.toLowerCase().includes(query) || 
        item.answer.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      return matchCat && matchQuery;
    });

    // Durante la ricerca mostra tutte le risposte per rendere visibili i match testuali.
    renderFaqs(filtered, query.length > 0);
  }

  if (searchInput) searchInput.addEventListener('input', filterFaqs);

  renderFaqs(FAQS_DATA);
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
  if (!reviewContainer || typeof CERTIFICATES_DATA === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  let isin = params.get('isin') || "NLBNPIT239B1";

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
        Analisi ${cert.type} su paniere: ${cert.underlyings.join(', ')}
      </h1>

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
      window.location.href = `recensione.html?isin=${encodeURIComponent(e.target.value)}`;
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
