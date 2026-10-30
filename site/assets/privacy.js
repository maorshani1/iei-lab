/* Essential, local preferences. Optional analytics is off until a valid choice exists. */
(() => {
  'use strict';
  const KEY = 'seri-privacy-v1', AGE = 180 * 24 * 60 * 60 * 1000;
  const signal = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  const parse = raw => { try { const v = JSON.parse(raw); return v?.version === 1 && typeof v.analytics === 'boolean' && Number.isFinite(v.at) && v.at <= Date.now() && Date.now() - v.at < AGE ? v : null; } catch { return null; } };
  let choice; try { choice = parse(localStorage.getItem(KEY)); } catch { choice = null; }
  let panel, opener;
  const allowed = () => !signal() && !!choice?.analytics && Date.now() - choice.at < AGE;
  window.SERIPrivacy = { allowsAnalytics: allowed };
  function close() { if (panel) panel.hidden = true; if (opener?.isConnected) opener.focus(); opener = null; }
  function choose(analytics) {
    choice = { version: 1, analytics: analytics && !signal(), at: Date.now() };
    let saved = true; try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch { saved = false; }
    // Set the decision before notifying the analytics loader, including on withdrawal.
    window.dispatchEvent(new CustomEvent('seri:privacy-choice'));
    close();
    const status = document.getElementById('privacy-status');
    if (status) status.textContent = (choice.analytics ? 'Optional analytics allowed.' : 'Optional analytics off.') + (saved ? ' You can change this using Privacy choices.' : ' Your browser could not save the choice; it applies to this page only.');
  }
  function show(manual = false) {
    if (!panel) {
      panel = document.createElement('section'); panel.className = 'privacy-panel'; panel.setAttribute('aria-labelledby', 'privacy-heading'); panel.setAttribute('role', 'region');
      const base = document.body.dataset.base || './';
      panel.innerHTML = `<div class="privacy-panel-inner"><div><h2 id="privacy-heading" tabindex="-1">Your privacy choices</h2><p>May we use optional, cookie-free analytics to understand which public pages are useful? The website and newsletter work with either choice.</p><p class="small">We save your choice on this device for six months. <a href="${base}privacy.html">Privacy information</a></p><p data-browser-privacy hidden>Your browser requests no tracking, so optional analytics stays off.</p></div><div class="privacy-actions"><button type="button" class="privacy-choice" data-consent="yes">Allow analytics</button><button type="button" class="privacy-choice" data-consent="no">Reject optional analytics</button><button type="button" class="privacy-close" data-consent="close" hidden>Close</button></div></div>`;
      panel.querySelector('[data-consent="yes"]').addEventListener('click', () => choose(true));
      panel.querySelector('[data-consent="no"]').addEventListener('click', () => choose(false));
      panel.querySelector('[data-consent="close"]').addEventListener('click', close);
      document.body.append(panel);
    }
    panel.hidden = false;
    panel.querySelector('[data-browser-privacy]').hidden = !signal();
    panel.querySelector('[data-consent="yes"]').disabled = signal();
    panel.querySelector('[data-consent="close"]').hidden = !choice && !signal();
    if (manual) panel.querySelector('h2').focus();
  }
  document.querySelectorAll('[data-privacy-choices]').forEach(button => { button.hidden = false; button.addEventListener('click', () => { opener = button; show(true); }); });
  window.addEventListener('storage', event => { if (event.key === KEY || event.key === null) { choice = parse(event.newValue); window.dispatchEvent(new CustomEvent('seri:privacy-choice')); if (choice) close(); } });
  const privatePage = /^\/(?:teaching\/submissions|submissions-info|submissions-privacy|newsletter\/confirmed|404)(?:[/.]|$)/.test(location.pathname);
  if (!choice && !signal() && !privatePage) show();

  // Reading preferences are functional settings stored only on this device.
  const readingKey = 'seri-reading-v1'; let reading = {};
  try { reading = JSON.parse(localStorage.getItem(readingKey)) || {}; } catch {}
  function applyReading() { for (const key of ['large', 'links', 'motion']) document.body.classList.toggle('reading-' + key, reading[key] === true); }
  applyReading();
  for (const input of document.querySelectorAll('[data-reading]')) { input.checked = reading[input.dataset.reading] === true; input.addEventListener('change', () => { reading[input.dataset.reading] = input.checked; applyReading(); try { localStorage.setItem(readingKey, JSON.stringify(reading)); } catch {} }); }
  document.querySelector('[data-reading-reset]')?.addEventListener('click', () => { reading = {}; applyReading(); for (const input of document.querySelectorAll('[data-reading]')) input.checked = false; try { localStorage.removeItem(readingKey); } catch {} });
})();
