(() => {
  const root = document.querySelector('#robotics-profile');
  if (!root) return;
  const stage = root.querySelector('.robotics-carousel');
  if (!stage) return;
  const slides = [...stage.querySelectorAll('.robotics-slide')];
  const selectors = [...root.querySelectorAll('[data-robotics-select]')];
  const playButton = stage.querySelector('.robotics-play');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const phoneLayout = matchMedia('(max-width: 760px)');
  const touchPointers = new Set();
  let selected = 0, paused = false, hovering = false, onScreen = false, timer = null, swipe = null;
  const motionEnabled = () => !reduced.matches && window.portfolioMotionEnabled !== false;

  const dialog = document.createElement('dialog');
  dialog.className = 'robotics-project-dialog';
  dialog.setAttribute('aria-labelledby', 'robotics-dialog-title');
  dialog.innerHTML = '<header class="robotics-dialog-header"><div><span class="entry-label"></span><h2 id="robotics-dialog-title"></h2></div><button class="robotics-dialog-close" aria-label="Close robotics project notes">×</button></header><div class="robotics-dialog-body"><div class="robotics-dialog-visual"><img alt=""><span>CONCEPT ILLUSTRATION · NOT PROJECT PHOTOGRAPHY</span></div><div class="robotics-dialog-notes"></div></div>';
  document.body.append(dialog);

  function updateAutoplay() {
    clearTimeout(timer);
    timer = null;
    const enabled = motionEnabled();
    playButton.disabled = !enabled || slides.length < 2;
    playButton.innerHTML = !enabled ? '<span aria-hidden="true">−</span> Auto off'
      : paused ? '<span aria-hidden="true">▷</span> Play' : '<span aria-hidden="true">Ⅱ</span> Pause';
    playButton.setAttribute('aria-label', !enabled ? 'Automatic robotics showcase disabled while motion is off'
      : paused ? 'Play automatic robotics showcase' : 'Pause automatic robotics showcase');
    const focused = root.contains(document.activeElement) && document.activeElement !== playButton;
    if (enabled && !paused && !hovering && !focused && onScreen && !root.closest('[hidden]') && !document.hidden && !dialog.open && slides.length > 1) {
      timer = setTimeout(() => select(selected + 1), 6000);
    }
  }

  function takeOver() { paused = true; updateAutoplay(); }

  function select(index, { manual = false, focus = false, announce = false } = {}) {
    if (manual) takeOver();
    selected = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === selected;
      slide.hidden = !active;
      slide.classList.toggle('is-active', active);
    });
    selectors.forEach((button, i) => {
      button.classList.toggle('is-active', i === selected);
      button.setAttribute('aria-pressed', String(i === selected));
    });
    stage.querySelector('.robotics-index').textContent = String(selected + 1) + ' / ' + String(slides.length);
    if (announce) root.querySelector('.robotics-announcement').textContent = slides[selected].querySelector('h3').textContent + ', project ' + (selected + 1) + ' of ' + slides.length;
    if (focus) selectors[selected].focus({ preventScroll: true });
    updateAutoplay();
  }

  selectors.forEach((button, index) => button.addEventListener('click', () => select(index, { manual: true, announce: true })));
  stage.querySelector('.robotics-prev').onclick = () => select(selected - 1, { manual: true, announce: true });
  stage.querySelector('.robotics-next').onclick = () => select(selected + 1, { manual: true, announce: true });
  playButton.onclick = () => { paused = !paused; updateAutoplay(); };
  root.addEventListener('keydown', event => {
    if (event.target !== stage && !event.target.closest('[data-robotics-select]')) return;
    let next;
    if (event.key === 'ArrowRight') next = selected + 1;
    if (event.key === 'ArrowLeft') next = selected - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = slides.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      select(next, { manual: true, focus: event.target !== stage, announce: true });
    }
  });
  root.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; updateAutoplay(); } });
  root.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovering = false; updateAutoplay(); } });
  root.addEventListener('focusin', updateAutoplay);
  root.addEventListener('focusout', () => queueMicrotask(updateAutoplay));

  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || event.target.closest('button,a')) return;
    takeOver();
    touchPointers.add(event.pointerId);
    // Reading text and pinch zoom remain native; one-finger image swipes are optional.
    if (touchPointers.size > 1 || (phoneLayout.matches && !event.target.closest('.robotics-slide-image'))) {
      swipe = null;
      return;
    }
    swipe = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }, { passive: true });
  stage.addEventListener('pointerup', event => {
    touchPointers.delete(event.pointerId);
    if (touchPointers.size) { swipe = null; return; }
    if (!swipe || swipe.id !== event.pointerId) return;
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      // Keep any focused slide control available; visible arrows also work on touch.
      if (root.contains(document.activeElement) && document.activeElement.closest('.robotics-slide')) return;
      select(selected + (dx < 0 ? 1 : -1), { manual: true, announce: true });
    }
  }, { passive: true });
  stage.addEventListener('pointercancel', event => { touchPointers.delete(event.pointerId); swipe = null; }, { passive: true });

  slides.forEach(slide => {
    slide.querySelector('[data-robotics-open]').addEventListener('click', () => {
      takeOver();
      dialog.querySelector('#robotics-dialog-title').textContent = slide.querySelector('h3').textContent;
      dialog.querySelector('.entry-label').textContent = slide.querySelector('.robotics-slide-meta').textContent;
      const source = slide.querySelector('.robotics-slide-image');
      const image = dialog.querySelector('img');
      image.src = source.getAttribute('src');
      image.alt = source.getAttribute('alt');
      dialog.querySelector('.robotics-dialog-visual span').textContent = slide.dataset.roboticsId === 'HeronM300restoration' ? 'CONCEPT ILLUSTRATION · NOT PROJECT PHOTOGRAPHY' : 'ORIGINAL PROJECT PHOTOGRAPH';
      const content = slide.querySelector('template').content.cloneNode(true);
      dialog.querySelector('.robotics-dialog-notes').replaceChildren(content);
      dialog.showModal();
      dialog.scrollTop = 0;
      updateAutoplay();
    });
  });
  dialog.querySelector('.robotics-dialog-close').onclick = () => dialog.close();
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', updateAutoplay);
  new IntersectionObserver(entries => {
    onScreen = entries[0].isIntersecting && entries[0].intersectionRatio >= .15;
    updateAutoplay();
  }, { threshold: .15 }).observe(stage);
  new MutationObserver(updateAutoplay).observe(root, { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('visibilitychange', updateAutoplay);
  reduced.addEventListener('change', updateAutoplay);
  window.addEventListener('portfolio-motion', updateAutoplay);
  select(0);
})();
