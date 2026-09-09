'use strict';
/** Existing mail-service integrations with progressive enhancement.
 * Production only. No messages or addresses are logged or stored in browser storage.
 * Native POST remains available without JavaScript. Never auto-retry failed requests:
 * an interrupted response can still mean that the provider received the submission.
 */
(() => {
  for (const form of document.querySelectorAll('form.inquiry-form')) {
    const status = form.querySelector('[data-form-status]');
    const button = form.querySelector('button[type="submit"]');
    const fields = form.querySelector('fieldset');
    const provider = form.dataset.provider;
    const originalLabel = button.textContent;
    const isOffline = location.protocol === 'file:' || location.href === 'about:srcdoc' || document.body.dataset.offline === 'true';
    const enabled = form.dataset.enabled === 'true' && !isOffline;
    let pending = false;
    function announce(text, state = '', focus = false) {
      status.textContent = text;
      status.dataset.state = state;
      if (focus) status.focus({preventScroll: true});
    }
    if (!enabled) {
      fields.disabled = true;
      form.addEventListener('submit', event => event.preventDefault());
      announce('Review only. No inquiry is sent from this preview. The production build restores the existing mail-service connection.');
      continue;
    }
    // A manually entered return URL is not evidence of successful delivery.
    if (new URLSearchParams(location.search).get('sent') === '1') {
      announce('Return from the mail service. This page alone cannot verify acceptance or inbox delivery. Please rely on the confirmation shown by the service, or contact the lab directly if there was an error.');
    }
    form.addEventListener('input', event => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        event.target.setCustomValidity('');
      }
    });
    form.addEventListener('submit', async event => {
      if (pending) {event.preventDefault(); return;}
      for (const input of form.querySelectorAll('input[required],textarea[required]')) {
        input.setCustomValidity(input.value.trim() ? '' : 'Please complete this field.');
      }
      if (!form.reportValidity()) {event.preventDefault(); return;}
      const honeypot = form.elements.namedItem(provider === 'Web3Forms' ? 'botcheck' : '_honey');
      if (honeypot && (honeypot.type === 'checkbox' ? honeypot.checked : honeypot.value.trim())) {
        event.preventDefault(); announce('The form could not be submitted. Please reload the page and try again.', 'error', true); return;
      }
      // Retain the original HTML action as a native fallback, including redirect and routing fields.
      if (!window.fetch || !window.AbortController) return;
      event.preventDefault();
      pending = true; button.disabled = true; button.textContent = 'Sending…';
      announce('Sending your inquiry to the mail service…', 'pending');
      const data = Object.fromEntries(new FormData(form).entries());
      // Redirect fields belong to native POST; AJAX handles the response in this page.
      delete data.redirect; delete data._next;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(form.dataset.ajaxAction, {
          method: 'POST', headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
          body: JSON.stringify(data), credentials: 'omit', signal: controller.signal
        });
        const result = await response.json();
        const accepted = provider === 'Web3Forms' ? result.success === true : (result.success === true || result.success === 'true');
        if (!response.ok || !accepted) {
          announce('The mail service did not confirm submission. Your message is still in the form. You may try again or use the direct email address. No success confirmation has been received.', 'error', true);
          return;
        }
        form.reset();
        announce('The mail service accepted your inquiry. Thank you. This confirms acceptance by the service, not delivery to the lab’s inbox.', 'success', true);
      } catch (error) {
        announce(error.name === 'AbortError'
          ? 'The request timed out before confirmation arrived. Your message remains in the form. It may have reached the service, so please avoid repeated submissions and use the direct email address if needed.'
          : 'A confirmation could not be read from the mail service. Your message remains in the form. It may have reached the service; please check before submitting it again, or use the direct email address.', 'error', true);
      } finally {
        clearTimeout(timeout); pending = false; button.disabled = false; button.textContent = originalLabel;
      }
    });
  }
})();
