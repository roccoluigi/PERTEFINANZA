/**
 * PERTEFINANZA - Logica applicativa interattiva (Vanilla JS)
 * Gestione menu mobile, catalogo certificati con filtri, glossario A-Z e per categoria,
 * motore di ricerca FAQ con accordion interattivo e schede di recensione tecnica.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSiteNavigation();
  initFooter();
  initTelegramCards();
  initRiskWarnings();
  initMobileMenu();
  initSidebarFeatured();
  initHomeFeaturedCertificates();
  initShareButtons();
  initCertificatesCatalog();
  initGlossary();
  initFaqAccordion();
  initIssuersList();
  initReviewPage();
  initContactForm();
});

/* ===========================================================================
   Identita e navigazione condivise
   =========================================================================== */
function initSiteNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navigationItems = [
    { href: 'index.html', label: 'Home', mobileLabel: 'Home' },
    { href: 'certificati.html', label: 'Certificati', mobileLabel: 'Catalogo Certificati' },
    { href: 'emittenti.html', label: 'Emittenti', mobileLabel: 'Emittenti Bancari' },
    { href: 'formazione.html', label: 'Formazione', mobileLabel: 'Guida & Formazione' },
    { href: 'glossario.html', label: 'Glossario', mobileLabel: 'Glossario Finanziario' },
    { href: 'faq.html', label: 'FAQ', mobileLabel: 'Domande Frequenti (FAQ)' },
    { href: 'contatti.html', label: 'Contatti', mobileLabel: 'Contatti & Supporto' },
    { href: 'disclaimer.html', label: 'Disclaimer', mobileLabel: 'Note Legali & Disclaimer' }
  ];

  document.querySelectorAll('.brand-tag').forEach(tag => {
    tag.textContent = 'CERTIFICATI & STRATEGIE DI INVESTIMENTO';
  });

  document.querySelectorAll('.main-nav').forEach(nav => {
    nav.innerHTML = navigationItems.slice(0, 7).map(item => `
      <a href="${item.href}" class="nav-link${currentPage === item.href ? ' active' : ''}">${item.label}</a>
    `).join('');
  });

  document.querySelectorAll('.mobile-nav').forEach(nav => {
    nav.innerHTML = navigationItems.map(item => `
      <a href="${item.href}" class="mobile-nav-link${currentPage === item.href ? ' active' : ''}">${item.mobileLabel}</a>
    `).join('');
  });
}

/* ===========================================================================
   Banner Telegram condiviso
   =========================================================================== */
function initTelegramCards() {
  const cards = document.querySelectorAll('.sidebar-telegram-card');
  if (cards.length === 0) return;

  cards.forEach(card => {
    card.innerHTML = `
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
        Cedole, barriere profonde, occasioni sotto la pari. Nel canale trovi alert e analisi sui certificati da tenere d'occhio.
      </p>
      <a href="https://t.me/pertefinanza" target="_blank" rel="noopener noreferrer" class="btn btn-telegram" style="width: 100%;">
        Segui il canale ↗
      </a>
    `;
  });
}

/* ===========================================================================
  Avvertenze rischio rimosse dalla sidebar
  =========================================================================== */
function initRiskWarnings() {
  document.querySelectorAll('.sidebar-risk-card').forEach(card => card.remove());
}

/* ===========================================================================
   Footer condiviso
   =========================================================================== */
function initFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="container footer-grid">
      <div class="footer-brand">
        <div class="footer-logo">PERTE<span>FINANZA</span></div>
        <p class="footer-desc">
          Portale editoriale specializzato di analisi tecnica, didattica e catalogazione di certificati di investimento.
        </p>
        <div class="footer-legal-box">
          <span class="piva-badge">Dati Fiscali & P.IVA:</span>
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
          <li><a href="emittenti.html">Emittenti & Rating</a></li>
          <li><a href="recensione.html">Schede di Analisi</a></li>
        </ul>
      </div>

      <div>
        <h4 class="footer-heading">Risorse</h4>
        <ul class="footer-links">
          <li><a href="formazione.html">Guida ai Certificati</a></li>
          <li><a href="glossario.html">Glossario Finanziario</a></li>
          <li><a href="faq.html">Domande Frequenti (FAQ)</a></li>
          <li><a href="contatti.html">Contatti & Info</a></li>
        </ul>
      </div>

      <div>
        <h4 class="footer-heading">Trasparenza & Rischi</h4>
        <p style="font-size: 0.8125rem; line-height: 1.6; color: #94a3b8; margin-bottom: 0.75rem;">
          I contenuti hanno finalità informativa e didattica e non costituiscono consulenza finanziaria, raccomandazione personalizzata o sollecitazione all'investimento. I certificati sono strumenti complessi: il capitale può subire perdite significative o totali e resta esposto al rischio di credito dell'emittente. Prima di investire, verifica le informazioni ufficiali, leggi il KID e le Condizioni Definitive e valuta la coerenza del prodotto con i tuoi obiettivi e il tuo profilo di rischio.
        </p>
        <a href="disclaimer.html" class="btn btn-sm btn-secondary" style="font-size: 0.75rem;">
          Disclaimer e Note Legali
        </a>
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
    </div>
  `;
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
    html += `
      <div class="widget-cert-item">
        <a href="recensione.html?isin=${encodeURIComponent(c.isin)}" class="widget-cert-link">
        <div class="widget-cert-top">
          <span class="widget-cert-isin" data-copy-isin="${c.isin}" role="button" tabindex="0" title="Copia ISIN">
            <span class="widget-cert-isin-label">ISIN</span>${c.isin}
          </span>
          <span class="widget-cert-yield">${c.annualYield.toFixed(1)}% p.a.</span>
        </div>
        <div class="widget-cert-name">${c.name}</div>
        <div class="widget-cert-issuer">${c.issuer}</div>
        <div class="widget-cert-details">
          <div><span>Cedola potenziale</span><strong>${c.annualYield.toFixed(2)}% annua</strong></div>
          <div><span>Barriera capitale</span><strong>${c.barrierCapital}</strong></div>
          <div><span>Barriera coupon</span><strong>${c.barrierCoupon}</strong></div>
          <div><span>Step-down</span><strong>${c.stepDown}</strong></div>
          <div><span>Sottostanti</span><strong>${c.underlyings.join(', ')}</strong></div>
        </div>
        </a>
        ${shareButtonsMarkup(c)}
      </div>
    `;
  });

  containers.forEach(container => {
    const widget = container.closest('.sidebar-widget');
    if (widget) {
      widget.classList.add('sidebar-featured-widget');
      widget.innerHTML = `
        <div class="widget-title">
          <span>In Evidenza</span>
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
            <span class="cert-isin-copy" data-copy-isin="${c.isin}" role="button" tabindex="0" title="Copia ISIN">ISIN: <strong>${c.isin}</strong></span>
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

function initHomeFeaturedCertificates() {
  const container = document.getElementById('home-featured-certificates');
  if (!container || typeof CERTIFICATES_DATA === 'undefined') return;

  container.innerHTML = CERTIFICATES_DATA.filter(c => c.showHome).map(certificateCardMarkup).join('');
  initCopyableIsins(container);
}



function reviewPreviewMarkup(cert) {
  const issuer = typeof ISSUERS_DATA !== 'undefined'
    ? ISSUERS_DATA.find(item => item.name === cert.issuer)
    : null;
  const issuerDescription = issuer
    ? issuer.description.toLowerCase().replace(/[.!?]+$/, '')
    : `emittente attivo nel mercato dei prodotti strutturati`;
  const ratings = issuer && issuer.ratings
    ? Object.entries(issuer.ratings)
      .map(([agency, rating]) => `un rating ${rating} da parte di ${agency}`)
      .join(' e ')
    : '';
  const ratingSentence = ratings ? ` ${cert.issuer} vanta ${ratings}.` : '';
  const issuerLink = `<a href="emittenti.html#${issuerAnchorId(cert.issuer)}">${cert.issuer}</a>`;
  const previewText = `Il certificato in oggetto è emesso da <strong>${issuerLink}</strong>, ${issuerDescription}.${ratingSentence}<br>La struttura investe su <strong>${cert.underlyings.join(', ')}</strong> e prevede un rendimento potenziale annuo del ${cert.annualYield.toFixed(2)}%, con scadenza il ${cert.expiryDate}.`;
  return `<p>${previewText}</p>`;
}

function issuerAnchorId(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function shareButtonsMarkup(c) {
  const shareUrl = `recensione.html?isin=${encodeURIComponent(c.isin)}`;
  const shareTitle = encodeURIComponent(`${c.name} | PERTEFINANZA`);
  const encodedUrl = encodeURIComponent(shareUrl);

  return `
    <div class="share-actions" aria-label="Condividi certificato">
      <span class="share-label">Condividi</span>
      <a class="share-button share-whatsapp" href="https://wa.me/?text=${shareTitle}%20${encodedUrl}" target="_blank" rel="noopener noreferrer" title="Condividi su WhatsApp" aria-label="Condividi su WhatsApp">${shareIconMarkup('whatsapp')}</a>
      <a class="share-button share-telegram" href="https://t.me/share/url?url=${encodedUrl}&text=${shareTitle}" target="_blank" rel="noopener noreferrer" title="Condividi su Telegram" aria-label="Condividi su Telegram">${shareIconMarkup('telegram')}</a>
      <a class="share-button share-facebook" href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer" title="Condividi su Facebook" aria-label="Condividi su Facebook">${shareIconMarkup('facebook')}</a>
      <button type="button" class="share-button share-instagram" data-copy-share-url="${shareUrl}" title="Copia link per Instagram" aria-label="Copia link per Instagram">${shareIconMarkup('instagram')}</button>
    </div>
  `;
}

function shareIconMarkup(platform) {
  const icons = {
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.6 4.1 1.6 5.8L.2 24l6.6-1.7a11.8 11.8 0 0 0 5.3 1.3h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.1-1.2-6.1-3.5-8.3ZM12.2 21.4h-.1c-1.7 0-3.4-.5-4.8-1.4l-.3-.2-3.9 1 1-3.8-.2-.3a9.6 9.6 0 1 1 8.3 4.7Zm5.3-7.2c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.4 4.7 2 .8 2.7.9 3.7.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22.5 2.2 19 21.1c-.3 1.3-1 1.6-2.1 1L11 17.7l-2.8 2.7c-.3.3-.5.5-1 .5l.4-6.1L18.7 5c.5-.4-.1-.7-.8-.3L4.2 13.5l-5.9-1.9c-1.3-.4-1.3-1.3.3-1.9L21.5 1c1.1-.4 2 .3 1 1.2Z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 23v-9h3l.5-3.5h-3.5V8.3c0-1 .3-1.7 1.8-1.7h1.9V3.5c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.5v2.6H7.2V14h3v9h3.5Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="share-icon-cutout"/></svg>'
  };
  return icons[platform];
}

function initShareButtons() {
  document.querySelectorAll('[data-copy-share-url]').forEach(button => {
    button.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      const originalLabel = button.textContent;
      try {
        await copyTextToClipboard(new URL(button.dataset.copyShareUrl, window.location.href).href);
        button.textContent = 'OK';
        setTimeout(() => { button.textContent = originalLabel; }, 1200);
      } catch {
        button.textContent = 'NO';
        setTimeout(() => { button.textContent = originalLabel; }, 1600);
      }
    });
  });
}

function initCopyableIsins(container) {
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
    isinElement.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') copyIsin(event);
    });
  });
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

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

  if (!cardsContainer || typeof CERTIFICATES_DATA === 'undefined') return;

  // Popola emittenti nella select
  if (issuerSelect && issuerSelect.options.length <= 1) {
    const issuers = [...new Set(CERTIFICATES_DATA.map(c => c.issuer))].sort();
    issuers.forEach(iss => {
      const opt = document.createElement('option');
      opt.value = iss;
      opt.textContent = iss;
      issuerSelect.appendChild(opt);
    });
  }

  // Popola tipologie nella select
  if (typeSelect && typeSelect.options.length <= 1) {
    const types = [...new Set(CERTIFICATES_DATA.map(c => c.type))].sort();
    types.forEach(tp => {
      const opt = document.createElement('option');
      opt.value = tp;
      opt.textContent = tp;
      typeSelect.appendChild(opt);
    });
  }

  function renderTable(data) {
    if (data.length === 0) {
      cardsContainer.innerHTML = `
        <div class="card" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
          Nessun certificato trovato con i filtri selezionati. Prova a reimpostare i parametri di ricerca.
        </div>
      `;
      if (countEl) countEl.textContent = '0 certificati trovati';
      return;
    }

    if (countEl) {
      countEl.textContent = `${data.length} ${data.length === 1 ? 'certificato trovato' : 'certificati trovati'}`;
    }

    cardsContainer.innerHTML = data.map(certificateCardMarkup).join('');

    initCopyableIsins(cardsContainer);
    initShareButtons();
  }

  function filterData() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const selectedIssuer = issuerSelect ? issuerSelect.value : '';
    const selectedType = typeSelect ? typeSelect.value : '';

    const filtered = CERTIFICATES_DATA.filter(c => {
      const matchQuery = !query || 
        c.isin.toLowerCase().includes(query) || 
        c.underlyings.join(', ').toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query);

      const matchIssuer = !selectedIssuer || c.issuer === selectedIssuer;
      const matchType = !selectedType || c.type === selectedType;

      return matchQuery && matchIssuer && matchType;
    });

    renderTable(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', filterData);
  if (issuerSelect) issuerSelect.addEventListener('change', filterData);
  if (typeSelect) typeSelect.addEventListener('change', filterData);

  renderTable(CERTIFICATES_DATA);
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

  // Costruisci bottoni A-Z
  if (lettersContainer) {
    const availableLetters = ['ALL', ...[...new Set(sortedGlossary.map(item => item.term.charAt(0).toUpperCase()))].sort()];
    let lettersHtml = '';
    availableLetters.forEach(l => {
      const label = l === 'ALL' ? 'Tutti' : l;
      const activeClass = l === 'ALL' ? 'active' : '';
      lettersHtml += `<button type="button" class="glossary-letter-btn ${activeClass}" data-letter="${l}">${label}</button>`;
    });
    lettersContainer.innerHTML = lettersHtml;

    lettersContainer.querySelectorAll('.glossary-letter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        lettersContainer.querySelectorAll('.glossary-letter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentLetter = e.target.getAttribute('data-letter');
        filterGlossary();
      });
    });
  }

  // Costruisci selettore di Categorie
  if (categoryContainer) {
    const categories = ['ALL', ...new Set(sortedGlossary.map(item => item.category))].sort();
    let catHtml = '';
    categories.forEach(cat => {
      const label = cat === 'ALL' ? 'Tutte le categorie' : cat;
      const activeClass = cat === 'ALL' ? 'active' : '';
      catHtml += `<button type="button" class="badge ${activeClass ? 'badge-primary' : 'badge-neutral'}" data-category="${cat}" style="cursor: pointer; padding: 0.4rem 0.85rem; font-size: 0.8125rem;">${label}</button>`;
    });
    categoryContainer.innerHTML = catHtml;

    categoryContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        categoryContainer.querySelectorAll('button').forEach(b => {
          b.classList.remove('badge-primary');
          b.classList.add('badge-neutral');
        });
        e.target.classList.remove('badge-neutral');
        e.target.classList.add('badge-primary');
        currentCategory = e.target.getAttribute('data-category');
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
        <div class="card" style="text-align: center; color: var(--text-muted); padding: 3rem;">
          <p style="font-size: 1.1rem; font-weight: 700; color: var(--secondary);">Nessun termine trovato</p>
          <p style="font-size: 0.875rem; margin-top: 0.5rem;">Prova a modificare la ricerca testuale o reimposta i filtri alfabetici.</p>
        </div>
      `;
      return;
    }

    let html = '';
    items.forEach(item => {
      const exampleBox = item.example ? `
        <div style="margin-top: 0.85rem; padding: 0.75rem 1rem; background: var(--bg-body); border-left: 3px solid var(--primary); border-radius: var(--radius-sm); font-size: 0.84rem; line-height: 1.55; color: var(--text-body);">
          <strong style="color: var(--secondary); display: block; margin-bottom: 0.2rem;">💡 Esempio pratico / Focus operativo:</strong>
          ${item.example}
        </div>
      ` : '';

      html += `
        <div class="glossary-card">
          <div class="glossary-card-title">
            <span>${item.term}</span>
            <span class="badge badge-primary">${item.category}</span>
          </div>
          <div class="glossary-card-def">
            ${item.definition}
          </div>
          ${exampleBox}
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
    // Fallback su elementi statici se non esiste il container dinamico
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

  function formatFaqAnswer(answer) {
    const highlightTerms = text => text;
    const numberedParts = answer.split(/(?=\b\d+\)\s)/);

    if (numberedParts.length >= 3 && numberedParts.slice(1).every(part => /^\d+\)\s/.test(part))) {
      const introduction = numberedParts.shift().trim();
      const listItems = numberedParts.map(part => part.replace(/^\d+\)\s/, '').trim());
      return `${introduction ? `<p>${highlightTerms(introduction)}</p>` : ''}<ol>${listItems.map(item => `<li>${highlightTerms(item)}</li>`).join('')}</ol>`;
    }

    const bulletParts = answer.split(/(?=•\s)/);
    if (bulletParts.length >= 2 && bulletParts.slice(1).every(part => /^•\s/.test(part))) {
      const introduction = bulletParts.shift().trim();
      const listItems = bulletParts.map(part => part.replace(/^•\s/, '').trim());
      return `${introduction ? `<p>${highlightTerms(introduction)}</p>` : ''}<ul>${listItems.map(item => `<li>${highlightTerms(item)}</li>`).join('')}</ul>`;
    }

    return `<p>${highlightTerms(answer)}</p>`;
  }

  // Costruisci bottoni categoria FAQ
  if (categoryPillsContainer) {
    const categories = ['ALL', ...new Set(FAQS_DATA.map(f => f.category))];
    let catHtml = '';
    categories.forEach(cat => {
      const label = cat === 'ALL' ? 'Tutte le domande' : cat;
      const activeClass = cat === 'ALL' ? 'badge-primary' : 'badge-neutral';
      catHtml += `<button type="button" class="badge ${activeClass}" data-cat="${cat}" style="cursor: pointer; padding: 0.45rem 0.95rem; font-size: 0.8125rem;">${label}</button>`;
    });
    categoryPillsContainer.innerHTML = catHtml;

    categoryPillsContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        categoryPillsContainer.querySelectorAll('button').forEach(b => {
          b.classList.remove('badge-primary');
          b.classList.add('badge-neutral');
        });
        e.target.classList.remove('badge-neutral');
        e.target.classList.add('badge-primary');
        currentCategory = e.target.getAttribute('data-cat');
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
        <div class="card" style="text-align: center; color: var(--text-muted); padding: 3rem;">
          <p style="font-size: 1.1rem; font-weight: 700; color: var(--secondary);">Nessuna risposta trovata</p>
          <p style="font-size: 0.875rem; margin-top: 0.5rem;">Prova ad utilizzare parole chiave differenti (es. minusvalenze, barriera, airbag, market maker).</p>
        </div>
      `;
      return;
    }

    let html = '';
    items.forEach((item, index) => {
      // Apri il primo elemento di default, oppure tutti se c'è una ricerca attiva
      const isActive = autoOpenAll || index === 0;

      html += `
        <div class="faq-item ${isActive ? 'active' : ''}">
          <button type="button" class="faq-question">
            <div>
              <span class="badge badge-primary" style="font-size: 0.7rem; margin-bottom: 0.35rem; display: inline-block;">
                ${item.category}
              </span>
              <div style="font-size: 1.05rem; font-weight: 700; color: var(--secondary);">${item.question}</div>
            </div>
            <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="faq-answer">
            ${formatFaqAnswer(item.answer)}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Aggiungi click listener a ciascuna domanda
    container.querySelectorAll('.faq-item').forEach(item => {
      const questionBtn = item.querySelector('.faq-question');
      if (questionBtn) {
        questionBtn.addEventListener('click', () => {
          const isCurrentlyActive = item.classList.contains('active');
          if (!autoOpenAll) {
            container.querySelectorAll('.faq-item').forEach(other => {
              if (other !== item) other.classList.remove('active');
            });
          }
          item.classList.toggle('active', !isCurrentlyActive);
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

    // Se l'utente sta cercando testo, apri automaticamente le risposte per favorire la lettura
    renderFaqs(filtered, query.length > 0);
  }

  if (searchInput) searchInput.addEventListener('input', filterFaqs);

  renderFaqs(FAQS_DATA);
}

/* ==========================================================================
   6. Emittenti Grid
   ========================================================================== */
function initIssuersList() {
  const container = document.getElementById('issuers-grid');
  if (!container || typeof ISSUERS_DATA === 'undefined') return;

  let html = '';
  ISSUERS_DATA.forEach(iss => {
    const issuerRatings = [
      ['S&P', iss.ratingSP],
      ["Moody's", iss.ratingMoodys],
      ['Fitch', iss.ratingFitch]
    ].filter(([, rating]) => rating && rating.toLowerCase() !== 'non rated');
    const ratingBadges = issuerRatings
      .map(([agency, rating]) => `<span class="issuer-rating-badge">${agency}: ${rating}</span>`)
      .join('');

    html += `
      <div class="issuer-card" id="${issuerAnchorId(iss.name)}">
        <div>
          <div class="issuer-rating">
            <span class="badge badge-neutral">${iss.country}</span>
            ${ratingBadges}
          </div>
          <h3 class="issuer-name" style="margin-top: 0.5rem;">${iss.name}</h3>
          <p style="font-size: 0.8125rem; font-weight: 600; color: var(--primary); margin: 0.25rem 0 0.75rem;">
            ${iss.marketShare}
          </p>
          <p style="font-size: 0.875rem; color: var(--text-body); line-height: 1.5;">
            ${iss.description}
          </p>
        </div>
        <div style="padding-top: 1rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
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
        <td data-label="Esito finanziario"><strong style="color:var(--primary);">${sc.rendimentoNetto}</strong></td>
      </tr>
    `;
  });

  let prosHtml = review.pros.map(p => `<li>${p}</li>`).join('');
  let consHtml = review.cons.map(c => `<li>${c}</li>`).join('');

  let certOptions = CERTIFICATES_DATA.map(c => {
    const shortName = c.name.split(/\s+su\s+/i).pop();
    return `<option value="${c.isin}" ${c.isin === isin ? 'selected' : ''}>${c.isin} - ${shortName}</option>`;
  }).join('');

  reviewContainer.innerHTML = `
    <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <label for="review-isin-picker" style="font-size: 0.8125rem; font-weight: 700; color: var(--text-muted);">
          Cambia Certificato:
        </label>
        <select id="review-isin-picker" class="form-control review-isin-picker">
          ${certOptions}
        </select>
      </div>
      <a href="certificati.html" class="btn btn-sm btn-secondary">
        ← Torna al Catalogo
      </a>
    </div>

    <div class="review-sticky-header">
      <div class="review-isin-row">
        <span class="review-isin-copy" data-copy-isin="${cert.isin}" role="button" tabindex="0" title="Copia ISIN">
          <span class="cert-isin-copy-label">ISIN</span>
          <span>${cert.isin}</span>
        </span>
        <nav class="review-section-links" aria-label="Sezioni della scheda tecnica">
          <a href="#review-overview">Riepilogo<br>certificato</a>
          <a href="#review-scenarios">Matrice<br>scenari</a>
          <a href="#review-pros-cons">Punti di forza<br>e criticità</a>
        </nav>
      </div>
    </div>

    <div class="review-hero">
      <h1 class="review-title">
        Analisi ${cert.type} su paniere: ${cert.underlyings.join(', ')}
      </h1>

      <div class="review-summary-text" style="font-size: 1.05rem; color: var(--text-body); line-height: 1.6; margin-top: 1.25rem;">
        ${review.summary}
      </div>

      <div class="review-overview" id="review-overview">
        <div class="review-overview-heading">
          <h2>Riepilogo certificato</h2>
        </div>

        <div class="review-overview-grid">
          <div class="meta-box review-overview-item review-overview-item-wide">
            <span class="meta-box-label">Emittente e rating</span>
            <span class="meta-box-value meta-box-value-small">${cert.issuer}</span>
            <small class="meta-box-detail">${ratingText}</small>
          </div>
          <div class="meta-box review-overview-item review-overview-item-wide">
            <span class="meta-box-label">Basket</span>
            <span class="meta-box-value meta-box-value-small">${cert.underlyings.join(', ')}</span>
          </div>
          <div class="meta-box review-overview-item review-overview-highlight">
            <span class="meta-box-label">Rend. pot. annuo</span>
            <span class="meta-box-value">${annualYield.toFixed(2)}%</span>
          </div>
          <div class="meta-box review-overview-item review-overview-highlight">
            <span class="meta-box-label">Rend. pot. mensile</span>
            <span class="meta-box-value">${monthlyYield.toFixed(2)}%</span>
          </div>
          <div class="meta-box review-overview-item">
            <span class="meta-box-label">Barriera capitale</span>
            <span class="meta-box-value">${cert.barrierCapital} · Europea</span>
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
    <div class="card scenario-card" id="review-scenarios" style="margin-bottom: 2rem;">
      <div class="scenario-card-heading">
        <h2>Matrice Scenari di Rimborso a Scadenza</h2>
      </div>
      <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; margin-bottom: 0.75rem;">
        Simulazione teorica del pay-off a scadenza, con i livelli espressi in rapporto agli strike iniziali dei sottostanti, fissati al momento del fixing del prodotto.
      </p>
      <div class="table-responsive" style="margin-top: 0;">
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
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #065f46;">Punti di Forza</h3>
        <ul>
          ${prosHtml}
        </ul>
      </div>
      <div class="cons-box">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #991b1b;">Criticità e Rischi</h3>
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
      
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Invio in corso...';
      }

      setTimeout(() => {
        form.reset();
        responseMsg.style.display = 'block';
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Invia Messaggio';
        }
      }, 800);
    });
  }
}
