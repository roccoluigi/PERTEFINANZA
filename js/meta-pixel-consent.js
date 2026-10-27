(() => {
  'use strict';

  const pixelId = '28462444026770716';
  const storageKey = 'pertefinanza-cookie-consent';
  const consentLifetime = 180 * 24 * 60 * 60 * 1000;
  let pixelInitialized = false;
  let pixelAllowed = false;
  let banner;

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
  }

  function chooseConsent(marketing) {
    saveConsent(marketing);
    if (marketing) initializePixel();
    else revokePixel();
    closeBanner();
  }

  function showBanner(moveFocus = false) {
    if (banner) {
      if (moveFocus) banner.querySelector('[data-cookie-choice="reject"]')?.focus();
      return;
    }

    const inReviewFolder = window.location.pathname.includes('/recensioni/');
    const policyPath = `${inReviewFolder ? '../' : ''}disclaimer.html#cookie`;
    banner = document.createElement('section');
    banner.className = 'pf-cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-labelledby', 'pf-cookie-title');
    banner.innerHTML = `
      <div class="pf-cookie-copy">
        <h2 id="pf-cookie-title">Le tue preferenze cookie</h2>
        <p>
          Usiamo cookie tecnici necessari. Con il tuo consenso, Meta Pixel invia a Meta dati sulla visita
          per misurare il traffico e le campagne. Puoi modificare la scelta in qualsiasi momento da
          “Gestisci cookie” nel footer; la conserviamo per 6 mesi.
          <a href="${policyPath}">Leggi la Cookie Policy</a>.
        </p>
      </div>
      <div class="pf-cookie-actions">
        <button type="button" class="pf-cookie-button pf-cookie-button-secondary" data-cookie-choice="reject">Rifiuta</button>
        <button type="button" class="pf-cookie-button pf-cookie-button-primary" data-cookie-choice="accept">Accetta</button>
      </div>
    `;
    banner.querySelector('[data-cookie-choice="reject"]').addEventListener('click', () => chooseConsent(false));
    banner.querySelector('[data-cookie-choice="accept"]').addEventListener('click', () => chooseConsent(true));
    document.body.appendChild(banner);

    if (moveFocus) banner.querySelector('[data-cookie-choice="reject"]')?.focus();
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
      showBanner(true);
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
