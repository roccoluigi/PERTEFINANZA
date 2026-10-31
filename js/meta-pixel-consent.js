(() => {
  'use strict';

  const pixelId = '28462444026770716';
  const storageKey = 'pertefinanza-cookie-consent';
  const consentLifetime = 180 * 24 * 60 * 60 * 1000;
  let pixelInitialized = false;
  let pixelAllowed = false;
  let banner;
  let previousFocus;

  window.trackMetaCustomEvent = (eventName, parameters = {}) => {
    if (!pixelAllowed || typeof window.fbq !== 'function') return false;
    window.fbq('trackCustom', eventName, parameters);
    return true;
  };

  function readConsent() {
    try {
      const rawConsent = localStorage.getItem(storageKey);
      if (!rawConsent) return null;

      const consent = JSON.parse(rawConsent);
      if (
        consent?.version !== 1
        || typeof consent.marketing !== 'boolean'
        || typeof consent.updatedAt !== 'number'
      ) {
        localStorage.removeItem(storageKey);
        return null;
      }

      if (Date.now() - consent.updatedAt >= consentLifetime) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return consent;
    } catch (error) {
      console.warn('Impossibile leggere la preferenza cookie salvata.', error);
      return null;
    }
  }

  function saveConsent(marketing) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        version: 1,
        marketing,
        updatedAt: Date.now(),
      }));
    } catch (error) {
      console.warn('Impossibile salvare la preferenza cookie nel browser.', error);
    }
  }

  function initializePixel() {
    if (typeof window.fbq !== 'function') {
      window.fbq = function () {
        if (window.fbq.callMethod) {
          window.fbq.callMethod.apply(window.fbq, arguments);
        } else {
          window.fbq.queue.push(arguments);
        }
      };
      window._fbq = window.fbq;
      window.fbq.push = window.fbq;
      window.fbq.loaded = true;
      window.fbq.version = '2.0';
      window.fbq.queue = [];

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      script.onerror = () => console.warn('Impossibile caricare Meta Pixel.');
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }

      window.fbq('consent', 'grant');
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
      pixelInitialized = true;
      pixelAllowed = true;
      return;
    }

    window.fbq('consent', 'grant');
    if (!pixelAllowed) window.fbq('track', 'PageView');
    pixelInitialized = true;
    pixelAllowed = true;
  }

  function clearMetaCookies() {
    const cookieNames = ['_fbp', '_fbc'];
    const domains = [null];
    const hostname = window.location.hostname.toLowerCase();
    if (hostname === 'pertefinanza.it' || hostname.endsWith('.pertefinanza.it')) {
      domains.push('.pertefinanza.it');
    }

    cookieNames.forEach(name => {
      domains.forEach(domain => {
        const domainAttribute = domain ? `; domain=${domain}` : '';
        document.cookie = `${name}=; Max-Age=0; path=/${domainAttribute}; SameSite=Lax`;
      });
    });
  }

  function revokePixel() {
    if (pixelInitialized && typeof window.fbq === 'function') {
      window.fbq('consent', 'revoke');
    }
    pixelAllowed = false;
    clearMetaCookies();
  }

  function closeBanner() {
    banner?.remove();
    banner = null;
    document.documentElement.classList.remove('pf-cookie-open');
    if (previousFocus instanceof HTMLElement && previousFocus !== document.body && previousFocus.isConnected) {
      previousFocus.focus();
    }
    previousFocus = null;
  }

  function chooseConsent(marketing) {
    saveConsent(marketing);
    if (marketing) initializePixel();
    else revokePixel();
    closeBanner();
  }

  function showBanner() {
    if (banner) {
      banner.classList.add('pf-cookie-initial-focus');
      banner.querySelector('[data-cookie-choice="accept"]')?.focus();
      return;
    }

    const inReviewFolder = window.location.pathname.includes('/recensioni/');
    const policyPath = `${inReviewFolder ? '../' : ''}disclaimer.html#cookie`;
    const logoPath = `${inReviewFolder ? '../' : ''}assets/pertefinanza-logo-giorno.svg`;
    previousFocus = document.activeElement;
    banner = document.createElement('section');
    banner.className = 'pf-cookie-overlay';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-labelledby', 'pf-cookie-title');
    banner.innerHTML = `
      <div class="pf-cookie-dialog">
        <img class="pf-cookie-logo" src="${logoPath}" alt="Pertefinanza">
        <h2 id="pf-cookie-title">La tua privacy è la nostra priorità</h2>
        <button type="button" class="pf-cookie-decline" data-cookie-choice="reject">Continua senza accettare</button>
        <p class="pf-cookie-copy" id="pf-cookie-description">
          Per mostrarti contenuti e annunci più in linea con i tuoi interessi e aiutarci a capire quali
          iniziative funzionano meglio, con il tuo consenso condividiamo con Meta alcuni dati sulla tua
          visita. Puoi cambiare idea in qualsiasi momento da “Gestisci cookie” nel footer. Per saperne
          di più, <a href="${policyPath}">consulta la Cookie Policy</a>.
        </p>
        <button type="button" class="pf-cookie-button pf-cookie-button-primary" data-cookie-choice="accept">Accetta</button>
      </div>
    `;
    banner.setAttribute('aria-describedby', 'pf-cookie-description');
    banner.querySelector('[data-cookie-choice="reject"]').addEventListener('click', () => chooseConsent(false));
    banner.querySelector('[data-cookie-choice="accept"]').addEventListener('click', () => chooseConsent(true));
    banner.addEventListener('keydown', event => {
      if (event.key === 'Tab') banner.classList.remove('pf-cookie-initial-focus');
      if (event.key !== 'Tab') return;
      const focusable = [...banner.querySelectorAll('button:not([disabled]), a[href]')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    document.body.appendChild(banner);
    document.documentElement.classList.add('pf-cookie-open');
    banner.classList.add('pf-cookie-initial-focus');
    banner.querySelector('[data-cookie-choice="accept"]')?.focus();
  }

  function addPreferencesLink() {
    const footerLinks = document.querySelector('.footer-bottom-links');
    if (!footerLinks || footerLinks.querySelector('[data-open-cookie-preferences]')) return;

    const link = document.createElement('a');
    link.href = '#cookie-preferences';
    link.dataset.openCookiePreferences = '';
    link.textContent = 'Gestisci cookie';
    link.addEventListener('click', event => {
      event.preventDefault();
      showBanner();
    });
    footerLinks.appendChild(link);
  }

  function initializeConsent() {
    addPreferencesLink();
    const consent = readConsent();
    if (consent?.marketing) {
      initializePixel();
    } else if (!consent) {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeConsent, { once: true });
  } else {
    initializeConsent();
  }
})();
