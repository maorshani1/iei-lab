/* Public-page analytics. Keep private teaching services and review builds out. */
(() => {
  'use strict';
  const hosts = new Set(['www.maorshani.com', 'maorshani.com']);
  if (location.protocol !== 'https:' || !hosts.has(location.hostname)) return;
  if (document.body.dataset.mode !== 'production') return;
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  if (document.querySelector('script[data-seri-analytics-provider]')) return;

  const normalize = pathname => pathname.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/\/$/, '') || '/';
  const excluded = pathname => /^\/(?:teaching\/submissions|submissions-info|submissions-privacy|api|admin|404)(?:\/|$)/.test(normalize(pathname));
  let canonical;
  try {
    canonical = new URL(document.querySelector('link[rel="canonical"]').href);
    if (canonical.protocol !== 'https:' || !hosts.has(canonical.hostname)) return;
    if (excluded(location.pathname) || excluded(canonical.pathname)) return;
    if (normalize(location.pathname) !== normalize(canonical.pathname)) return;
    canonical.hostname = 'www.maorshani.com';
    canonical.search = '';
    canonical.hash = '';
  } catch {
    return;
  }

  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };
  window.va('beforeSend', event => {
    // Only page views are needed. Drop custom events and identity commands.
    if (event.type !== 'pageview') return null;
    try {
      const url = new URL(event.url);
      if (url.protocol !== 'https:' || !hosts.has(url.hostname)) return null;
      if (excluded(url.pathname) || normalize(url.pathname) !== normalize(canonical.pathname)) return null;
      // Report the public canonical URL, without query values or fragments.
      return { ...event, url: canonical.href };
    } catch {
      return null;
    }
  });

  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  script.referrerPolicy = 'no-referrer';
  script.setAttribute('data-seri-analytics-provider', '');
  document.head.appendChild(script);
})();
