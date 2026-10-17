(() => {
  const root = document.querySelector('.palapes-carousel');
  if (!root) return;
  const frames = [...root.querySelectorAll('.palapes-frame')], button = root.querySelector('.palapes-toggle');
  if (!frames.length || !button) return;
  const runtime = window.PortfolioAutoplay, reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, paused = runtime.paused('palapes'), visible = false, hovering = false, timer;
  function sync() {
    clearTimeout(timer);
    const enabled = !reduced.matches && window.portfolioMotionEnabled !== false;
    button.disabled = !enabled || frames.length < 2;
    button.textContent = !enabled ? 'Auto off' : paused ? 'Play' : 'Pause';
    button.setAttribute('aria-label', !enabled ? 'PALAPES motion is off' : (paused ? 'Play' : 'Pause') + ' PALAPES slideshow');
    button.setAttribute('aria-pressed', String(enabled && !paused));
    runtime.remember('palapes', paused);
    const focused = root.contains(document.activeElement) && document.activeElement !== button;
    if (enabled && !paused && visible && !hovering && !focused && frames.length > 1 && runtime.canRun(root)) {
      timer = setTimeout(() => { frames[index].hidden = true; index = (index + 1) % frames.length; frames[index].hidden = false; sync(); }, 3000);
    }
  }
  button.onclick = () => { paused = !paused; sync(); };
  root.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hovering = true; sync(); } });
  root.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hovering = false; sync(); } });
  root.addEventListener('focusin', sync); root.addEventListener('focusout', () => queueMicrotask(sync));
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .15; sync(); }, {threshold:.15}).observe(root);
  runtime.watch(sync); sync();
})();
