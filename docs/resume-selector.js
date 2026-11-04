(() => {
  'use strict';
  const dialog = document.getElementById('resume-picker');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const triggers = [...document.querySelectorAll('[data-resume-picker]')];
  const tabs = [...dialog.querySelectorAll('[data-resume-career]')];
  const panels = [...dialog.querySelectorAll('[data-resume-panel]')];
  const closeButton = dialog.querySelector('[data-resume-close]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let opener = null;
  let closeTimer = null;
  let previousOverflow = '';
  let outsidePointerDown = false;
  function selectCareer(tab, focus = false) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    if (focus) tab.focus();
  }
  function openPicker(trigger) {
    if (dialog.open) return;
    clearTimeout(closeTimer);
    dialog.classList.remove('is-closing');
    opener = trigger;
    previousOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    triggers.forEach(item => item.setAttribute('aria-expanded', 'true'));
    tabs.find(item => item.getAttribute('aria-selected') === 'true')?.focus({ preventScroll: true });
  }
  function closePicker() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (reducedMotion.matches) { dialog.close(); return; }
    dialog.classList.add('is-closing');
    closeTimer = window.setTimeout(() => { if (dialog.open) dialog.close(); }, 180);
  }
  triggers.forEach(trigger => {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', dialog.id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openPicker(trigger);
    });
  });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectCareer(tab));
    tab.addEventListener('keydown', event => {
      let next = null;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      selectCareer(tabs[next], true);
    });
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      .filter(item => item.tabIndex >= 0 && item.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  closeButton.addEventListener('click', closePicker);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closePicker(); });
  const isOutside = event => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener('pointerdown', event => { outsidePointerDown = event.target === dialog && isOutside(event); });
  dialog.addEventListener('click', event => {
    if (outsidePointerDown && event.target === dialog && isOutside(event)) closePicker();
    outsidePointerDown = false;
  });
  dialog.addEventListener('close', () => {
    clearTimeout(closeTimer);
    dialog.classList.remove('is-closing');
    document.documentElement.style.overflow = previousOverflow;
    triggers.forEach(item => item.setAttribute('aria-expanded', 'false'));
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
  window.addEventListener('pagehide', () => { if (dialog.open) dialog.close(); });
})();
