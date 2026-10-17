(() => {
  const root = document.querySelector('#robocon-carousel');
  if (!root) return;
  const track = root.querySelector('.software-project-grid');
  const cards = [...track.querySelectorAll('.software-project')];
  const play = root.querySelector('[data-robocon-play]');
  const counter = root.querySelector('.robocon-carousel-position');
  const status = root.querySelector('.robocon-carousel-motion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, paused = window.PortfolioAutoplay.paused('robocon'), visible = false, hovering = false, timer;
  const motion = () => !reduced.matches && window.portfolioMotionEnabled !== false;
  const active = () => window.PortfolioAutoplay.canRun(root) && visible && !document.hidden && !root.closest('[hidden]');
  function sync() {
    window.PortfolioAutoplay.remember('robocon', paused);
    clearTimeout(timer);
    const blocked = !active() || hovering || (root.contains(document.activeElement) && document.activeElement !== play);
    play.disabled = !motion();
    play.textContent = paused || !motion() ? '▶' : 'Ⅱ';
    play.setAttribute('aria-pressed', String(!paused && motion()));
    play.setAttribute('aria-label', paused ? 'Play automatic Robocon carousel' : 'Pause automatic Robocon carousel');
    status.textContent = !motion() ? 'Motion off' : paused ? 'Automatic switching paused' : blocked ? 'Paused while browsing' : 'Auto switching · 3 s';
    if (cards.length > 1 && motion() && !paused && !blocked) timer = setTimeout(() => select(index + 1), 3000);
  }
  function update(indexValue) {
    index = (indexValue + cards.length) % cards.length;
    cards.forEach((card, i) => card.classList.toggle('is-current', i === index));
    counter.textContent = `${index + 1} / ${cards.length}`;
  }
  function select(next, manual = false) {
    if (manual) paused = true;
    update(next);
    track.scrollTo({left: track.scrollLeft + cards[index].getBoundingClientRect().left - track.getBoundingClientRect().left, behavior: motion() ? 'smooth' : 'instant'});
    if (manual) root.querySelector('.robocon-carousel-announcement').textContent = cards[index].getAttribute('aria-label');
    sync();
  }
  root.querySelector('[data-robocon-prev]').onclick = () => select(index - 1, true);
  root.querySelector('[data-robocon-next]').onclick = () => select(index + 1, true);
  play.onclick = () => { paused = !paused; sync(); };
  root.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hovering = true; sync(); } });
  root.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hovering = false; sync(); } });
  root.addEventListener('focusin', sync);
  root.addEventListener('focusout', () => queueMicrotask(sync));
  track.addEventListener('pointerdown', () => { paused = true; sync(); }, {passive:true});
  track.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { paused = true; sync(); } }, {passive:true});
  track.addEventListener('scrollend', () => {
    const left = track.getBoundingClientRect().left;
    const nearest = cards.reduce((best, card, i) => Math.abs(card.getBoundingClientRect().left - left) < Math.abs(cards[best].getBoundingClientRect().left - left) ? i : best, 0);
    update(nearest); sync();
  });
  track.addEventListener('keydown', e => {
    if (e.target !== track || !['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
    e.preventDefault(); select(e.key === 'Home' ? 0 : e.key === 'End' ? cards.length - 1 : index + (e.key === 'ArrowRight' ? 1 : -1), true);
  });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .15; sync(); }, {threshold:.15}).observe(track);
  new MutationObserver(sync).observe(root.closest('[data-area-content]'), {attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('portfolio-motion', sync);
  reduced.addEventListener('change', sync);
  window.PortfolioAutoplay.watch(sync);
  update(0); sync();
})();

