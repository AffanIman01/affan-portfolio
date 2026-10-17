(() => {
  'use strict';
  const root = document.querySelector('.ic-story-hero');
  if (!root) return;
  const stage = root.querySelector('.ic-story-carousel');
  const slides = [...root.querySelectorAll('.ic-story-slide')];
  const selectors = [...root.querySelectorAll('[data-ic-story]')];
  const play = root.querySelector('[data-ic-story-play]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0, paused = false, hovering = false, visible = false, timer;
  function schedule() {
    clearTimeout(timer);
    const enabled = !reduced.matches && window.portfolioMotionEnabled !== false;
    play.disabled = !enabled;
    play.textContent = !enabled ? 'Auto off' : paused ? '▷ Play' : 'Ⅱ Pause';
    play.setAttribute('aria-label', !enabled ? 'Automatic picture stories disabled while motion is off' : paused ? 'Play automatic picture stories' : 'Pause automatic picture stories');
    const focused = root.contains(document.activeElement) && document.activeElement !== play;
    if (enabled && !paused && !hovering && !focused && visible && !root.hidden && !document.hidden) timer = setTimeout(() => select(current + 1), 5000);
  }
  function select(index, manual = false) {
    if (manual) paused = true;
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; slide.classList.toggle('is-active', i === current); });
    selectors.forEach((button, i) => { button.setAttribute('aria-pressed', String(i === current)); button.classList.toggle('is-active', i === current); });
    root.querySelector('[data-ic-story-count]').textContent = `${current + 1} / ${slides.length}`;
    const rail = selectors[current].parentElement;
    rail.scrollTo({left: selectors[current].offsetLeft - selectors[0].offsetLeft, behavior: 'instant'});
    if (manual) root.querySelector('[data-ic-story-announcement]').textContent = slides[current].querySelector('h2').textContent;
    schedule();
  }
  selectors.forEach((button, i) => button.addEventListener('click', () => select(i, true)));
  root.querySelector('[data-ic-story-prev]').onclick = () => select(current - 1, true);
  root.querySelector('[data-ic-story-next]').onclick = () => select(current + 1, true);
  play.onclick = () => { paused = !paused; schedule(); };
  root.addEventListener('keydown', event => {
    if (event.target !== stage && !event.target.matches('[data-ic-story]')) return;
    const target = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: slides.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault(); select(target, true);
    if (event.target !== stage) selectors[current].focus({preventScroll:true});
  });
  root.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; schedule(); } });
  root.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovering = false; schedule(); } });
  root.addEventListener('focusin', schedule);
  root.addEventListener('focusout', () => queueMicrotask(schedule));
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, {threshold:.15}).observe(stage);
  new MutationObserver(schedule).observe(root, {attributes:true, attributeFilter:['hidden']});
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('portfolio-motion', schedule);
  reduced.addEventListener('change', schedule);
  select(0);
})();
