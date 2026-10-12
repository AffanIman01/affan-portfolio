/* Small, progressive motion enhancements. All page content works without them. */
(() => {
  'use strict';

  const INTRO_SEEN_KEY = 'affan-portfolio:intro-seen:v1';
  const MOTION_KEY = 'affan-portfolio:motion:v1';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const storage = {
    get(type, key) {
      try { return window[type].getItem(key); } catch (_) { return null; }
    },
    set(type, key, value) {
      try { window[type].setItem(key, value); } catch (_) { /* Storage is optional. */ }
    }
  };

  let userMotionEnabled = storage.get('localStorage', MOTION_KEY) !== 'off';
  let closeIntro = null;
  let revealObserver = null;
  const revealed = new WeakSet();
  const revealGroups = [
    { kind: 'heading', selector: '.profile-section-heading, .ic-section-heading, .profile-subheading, .values-heading, .guide-intro, .life-intro > h2' },
    { kind: 'card', selector: '.experience-feature, .skill-columns article, .robotics-records > article, .credential-records article, .education-record, .leadership-grid article, .about-skill-list' },
    { kind: 'gallery', selector: '.ic-card, .career-card' },
    { kind: 'timeline', selector: '.career-timeline > article' },
    { kind: 'media', selector: '.about-portrait, .robotics-intro > img' },
    { kind: 'text', selector: '.about-copy, .robotics-intro > div, .life-intro > p, .training-list > div, .credential-notice' },
    { kind: 'value', selector: '.values-track > .value-panel' }
  ];

  function finishReveal(element) {
    element.classList.remove('motion-entering');
    element.style.removeProperty('--reveal-delay');
  }

  function configureReveals(enabled) {
    if (revealObserver) revealObserver.disconnect();
    document.querySelectorAll('.motion-entering').forEach(finishReveal);
    if (!enabled || !('IntersectionObserver' in window)) return;

    try {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || !window.portfolioMotionEnabled) return;
          const element = entry.target;
          revealed.add(element);
          revealObserver.unobserve(element);
          // Content is never hidden while waiting for the observer.
          element.classList.add('motion-entering');
          // Allow the longer image/line animation to finish after its parent.
          setTimeout(() => finishReveal(element), 1500);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

      revealGroups.forEach(({ kind, selector }) => {
        const siblingOrder = new Map();
        document.querySelectorAll(selector).forEach(element => {
          if (revealed.has(element)) return;
          // Stagger adjacent peers, independent of the order of other sections.
          const parent = element.parentElement;
          const index = siblingOrder.get(parent) || 0;
          siblingOrder.set(parent, index + 1);
          element.dataset.revealKind = kind;
          element.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 65}ms`);
          revealObserver.observe(element);
        });
      });
    } catch (_) {
      if (revealObserver) revealObserver.disconnect();
      document.querySelectorAll('.motion-entering').forEach(finishReveal);
    }
  }

  function syncMotion() {
    const enabled = userMotionEnabled && !reducedMotion.matches;
    window.portfolioMotionEnabled = enabled;
    document.documentElement.dataset.portfolioMotion = enabled ? 'on' : 'off';
    const toggle = document.getElementById('motion-toggle');
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(enabled));
      toggle.disabled = reducedMotion.matches;
      toggle.textContent = reducedMotion.matches ? 'Reduced motion' : `Motion ${enabled ? 'on' : 'off'}`;
      toggle.setAttribute('aria-label', reducedMotion.matches
        ? 'Motion disabled by your device preference'
        : `Animated motion ${enabled ? 'on' : 'off'}`);
      toggle.title = reducedMotion.matches
        ? 'Your device’s reduced-motion preference is respected.'
        : 'Turn animated motion on or off';
    }
    const replay = document.getElementById('replay-intro');
    if (replay) {
      replay.disabled = !enabled;
      replay.title = enabled ? 'Replay the introduction' : 'Enable motion to replay the introduction';
    }
    if (!enabled && closeIntro) closeIntro(true);
    configureReveals(enabled);
    window.dispatchEvent(new CustomEvent('portfolio-motion', { detail: { enabled } }));
  }

  function runIntro(replay = false) {
    if (!window.portfolioMotionEnabled || closeIntro) return;
    const homeHash = ['', '#', '#home', '#ic-design'].includes(window.location.hash);
    if (!replay && (!homeHash || storage.get('sessionStorage', INTRO_SEEN_KEY) === 'yes')) return;
    if (!('HTMLDialogElement' in window) || typeof HTMLDialogElement.prototype.showModal !== 'function') return;

    const previouslyFocused = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.className = 'silicon-intro';
    dialog.setAttribute('aria-labelledby', 'silicon-intro-title');
    dialog.setAttribute('aria-describedby', 'silicon-intro-phase');
    dialog.innerHTML = `
      <div class="silicon-intro-grid" aria-hidden="true"></div>
      <div class="silicon-intro-content">
        <span class="silicon-intro-eyebrow">A PORTFOLIO BY</span>
        <div class="silicon-intro-chip" aria-hidden="true">
          <img src="gallery/hero-wafer.svg" alt="" width="260" height="217">
          <span class="silicon-intro-halo"></span>
        </div>
        <h2 id="silicon-intro-title">Affan Iman<span>.</span></h2>
        <p class="silicon-intro-discipline">Silicon design. Systems thinking.</p>
        <div class="silicon-intro-readiness">
          <div class="silicon-intro-status"><span id="silicon-intro-phase" role="status" aria-live="polite">Preparing the interface</span><span class="silicon-intro-count" aria-hidden="true">0 / 3</span></div>
          <progress max="3" value="0" aria-label="Portfolio readiness"></progress>
        </div>
        <button type="button" class="silicon-intro-skip" autofocus>Skip intro <span aria-hidden="true">↗</span></button>
      </div>
      <span class="silicon-intro-footer" aria-hidden="true">CUSTOM LAYOUT &nbsp; / &nbsp; ROBOTICS &nbsp; / &nbsp; ENGINEERING</span>`;

    let finished = false;
    let closing = false;
    let minimumTimer;
    let deadlineTimer;
    let exitTimer;
    const started = performance.now();
    const readiness = {
      document: document.readyState !== 'loading',
      fonts: !document.fonts || document.fonts.status === 'loaded',
      silicon: typeof window.__siliconReady === 'boolean'
    };

    function forceClose() {
      if (finished) return;
      finished = true;
      clearTimeout(minimumTimer);
      clearTimeout(deadlineTimer);
      clearTimeout(exitTimer);
      window.removeEventListener('silicon-ready', onSiliconReady);
      document.removeEventListener('DOMContentLoaded', onDocumentReady);
      document.body.classList.remove('portfolio-intro-open');
      if (dialog.open) dialog.close();
      dialog.remove();
      closeIntro = null;
      storage.set('sessionStorage', INTRO_SEEN_KEY, 'yes');
      if (previouslyFocused && previouslyFocused.isConnected && previouslyFocused !== document.body) {
        previouslyFocused.focus({ preventScroll: true });
      }
    }

    function finish(immediate = false) {
      if (finished || closing) return;
      closing = true;
      if (immediate || !window.portfolioMotionEnabled) return forceClose();
      dialog.classList.add('is-leaving');
      exitTimer = setTimeout(forceClose, 200);
    }

    function updateReadiness() {
      if (finished || closing) return;
      const complete = Object.values(readiness).filter(Boolean).length;
      dialog.querySelector('progress').value = complete;
      dialog.querySelector('.silicon-intro-count').textContent = `${complete} / 3`;
      dialog.querySelector('#silicon-intro-phase').textContent = complete === 3
        ? 'Ready to explore' : readiness.document && readiness.fonts
          ? 'Lighting the silicon' : 'Preparing the interface';
      if (complete === 3) {
        clearTimeout(minimumTimer);
        minimumTimer = setTimeout(() => finish(), Math.max(0, 1000 - (performance.now() - started)));
      }
    }
    function onSiliconReady() { readiness.silicon = true; updateReadiness(); }
    function onDocumentReady() { readiness.document = true; updateReadiness(); }

    try {
      document.body.append(dialog);
      dialog.showModal();
      document.body.classList.add('portfolio-intro-open');
      closeIntro = finish;
      // The safety deadline is independent of assets, fonts, and animation frames.
      deadlineTimer = setTimeout(forceClose, 2900);
      dialog.querySelector('.silicon-intro-skip').addEventListener('click', () => finish(true));
      dialog.addEventListener('cancel', event => { event.preventDefault(); finish(true); });
      dialog.addEventListener('close', () => { if (!finished) forceClose(); });
      window.addEventListener('silicon-ready', onSiliconReady);
      document.addEventListener('DOMContentLoaded', onDocumentReady, { once: true });
      if (document.fonts && !readiness.fonts) {
        document.fonts.ready.then(() => {
          readiness.fonts = true;
          updateReadiness();
        }).catch(() => { readiness.fonts = true; updateReadiness(); });
      }
      updateReadiness();
    } catch (_) {
      forceClose();
    }
  }

  function initialize() {
    const toggle = document.getElementById('motion-toggle');
    if (toggle) toggle.addEventListener('click', () => {
      if (reducedMotion.matches) return;
      userMotionEnabled = !userMotionEnabled;
      storage.set('localStorage', MOTION_KEY, userMotionEnabled ? 'on' : 'off');
      syncMotion();
    });
    const replay = document.getElementById('replay-intro');
    if (replay) replay.addEventListener('click', () => runIntro(true));
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', syncMotion);
    else if (reducedMotion.addListener) reducedMotion.addListener(syncMotion);
    syncMotion();
    runIntro();
  }

  // Expose state immediately for a scene that may initialize before DOM ready.
  window.portfolioMotionEnabled = userMotionEnabled && !reducedMotion.matches;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
