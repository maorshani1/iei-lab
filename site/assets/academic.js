/* Navigation uses native disclosure controls and ordinary links. */
'use strict';
(() => {
  const header = document.querySelector('.academic-header');
  if (!header) return;
  const nav = header.querySelector('#main-nav');
  const toggle = header.querySelector('.academic-menu-toggle');
  const menus = [...nav.querySelectorAll('.academic-menu')];
  const mobile = matchMedia('(max-width: 1000px)');
  const hoverNavigation = matchMedia('(min-width: 1001px) and (hover: hover) and (pointer: fine)');
  let hoverOpenTimer, hoverCloseTimer;
  function cancelHover() {
    clearTimeout(hoverOpenTimer);
    clearTimeout(hoverCloseTimer);
  }
  const closeGroups = except => menus.forEach(menu => { if (menu !== except) menu.open = false; });
  function closeMenu() {
    cancelHover();
    closeGroups();
    nav.classList.remove('academic-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('span').textContent = 'Menu';
  }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    if (!open) { closeMenu(); return; }
    toggle.setAttribute('aria-expanded', 'true');
    toggle.querySelector('span').textContent = 'Close';
    nav.classList.add('academic-open');
    nav.querySelector('summary, a').focus();
  });
  menus.forEach(menu => {
    menu.addEventListener('pointerenter', event => {
      if (!hoverNavigation.matches || event.pointerType !== 'mouse') return;
      cancelHover();
      hoverOpenTimer = setTimeout(() => {
        // Pointer navigation must not hide a link being used with the keyboard.
        const focused = menus.find(group => group.contains(document.activeElement));
        if (focused && focused !== menu && document.activeElement.matches(':focus-visible')) return;
        closeGroups(menu);
        menu.open = true;
      }, 120);
    });
    menu.addEventListener('pointerleave', event => {
      if (!hoverNavigation.matches || event.pointerType !== 'mouse') return;
      cancelHover();
      // Keep a short grace period when moving into the submenu, and retain
      // disclosures whose links or summary still have keyboard/click focus.
      hoverCloseTimer = setTimeout(() => {
        if (!menu.contains(document.activeElement)) menu.open = false;
      }, 220);
    });
    menu.addEventListener('toggle', () => { if (menu.open) closeGroups(menu); });
    menu.querySelector('summary').addEventListener('click', cancelHover);
    menu.querySelector('summary').addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        cancelHover();
        event.preventDefault(); menu.open = true; closeGroups(menu); menu.querySelector('a').focus();
      }
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    cancelHover();
    const open = menus.find(menu => menu.open);
    if (open) { open.open = false; open.querySelector('summary').focus(); }
    else if (nav.classList.contains('academic-open')) { closeMenu(); toggle.focus(); }
    else return;
    event.preventDefault(); event.stopImmediatePropagation();
  }, true);
  document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
  document.addEventListener('focusin', event => {
    cancelHover();
    if (!header.contains(event.target)) closeMenu();
    else closeGroups(event.target.closest('.academic-menu'));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  header.querySelector('[data-open-search]').addEventListener('click', closeMenu);
  mobile.addEventListener('change', () => {
    const focused = nav.contains(document.activeElement);
    closeMenu();
    if (focused) (mobile.matches ? toggle : nav.querySelector('summary, a')).focus();
  });
  hoverNavigation.addEventListener('change', cancelHover);
  const sectionToggle = document.querySelector('.academic-section-toggle');
  const sectionLinks = document.querySelector('#academic-section-links');
  if (sectionToggle && sectionLinks) {
    function sectionState(open) { sectionToggle.setAttribute('aria-expanded', String(open)); sectionLinks.hidden = !open; }
    sectionState(!mobile.matches);
    sectionToggle.addEventListener('click', () => sectionState(sectionToggle.getAttribute('aria-expanded') !== 'true'));
    mobile.addEventListener('change', () => {
      if (mobile.matches && sectionLinks.contains(document.activeElement)) sectionToggle.focus();
      sectionState(!mobile.matches);
    });
  }
})();
