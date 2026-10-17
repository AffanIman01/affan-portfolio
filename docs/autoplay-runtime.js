/* Shared lifecycle and media policy; each carousel retains its own controls. */
(() => {
  'use strict';
  const callbacks = new Set(), pending = new WeakSet(), desired = new WeakMap();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active = true, queued = false, failed = new WeakSet();
  function notify() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; callbacks.forEach(fn => fn()); });
  }
  function canRun(root) {
    if (!active || document.hidden || root.closest('[hidden]')) return false;
    const modal = document.querySelector('dialog[open]');
    return !modal || modal.contains(root);
  }
  function mediaAllowed(root) {
    return canRun(root) && !reduced.matches && window.portfolioMotionEnabled !== false && !navigator.connection?.saveData;
  }
  function media(video, allow) {
    allow = !!allow && mediaAllowed(video);
    desired.set(video, allow);
    if (!allow) { if (!video.paused) video.pause(); return; }
    if (!video.paused || pending.has(video) || failed.has(video)) return;
    pending.add(video);
    Promise.resolve(video.play()).then(() => {
      if (!desired.get(video) || !mediaAllowed(video)) video.pause();
    }).catch(() => { failed.add(video); video.controls = true; }).finally(() => pending.delete(video));
  }
  function paused(key) {
    try { return sessionStorage.getItem('portfolio:pause:' + key) === 'yes'; } catch { return false; }
  }
  function remember(key, value) {
    try {
      const name = 'portfolio:pause:' + key, next = value ? 'yes' : 'no';
      if (sessionStorage.getItem(name) !== next) sessionStorage.setItem(name, next);
    } catch { /* Optional storage. */ }
  }
  window.PortfolioAutoplay = {
    canRun, media, paused, remember,
    watch(fn) { callbacks.add(fn); },
    videoDelay(video, fallback = 6000) {
      return video && Number.isFinite(video.duration) ? Math.max(fallback, Math.min(30000, video.duration * 1000 + 500)) : fallback;
    }
  };
  const observer = new MutationObserver(records => {
    if (records.some(r => r.attributeName === 'open' || r.target.matches('[data-area-content]'))) notify();
  });
  observer.observe(document.body, {subtree:true, attributes:true, attributeFilter:['hidden','open']});
  document.addEventListener('visibilitychange', notify);
  window.addEventListener('pagehide', () => { active = false; callbacks.forEach(fn => fn()); });
  window.addEventListener('pageshow', () => { active = true; notify(); });
  window.addEventListener('portfolio-motion', notify);
  reduced.addEventListener('change', notify);
  navigator.connection?.addEventListener('change', notify);
  document.addEventListener('pointerdown', () => { failed = new WeakSet(); }, {passive:true});
})();
