(() => {
  async function initializeGallery(root, galleryIndex) {
  const resultNoun = root.dataset.resultNoun || 'projects';
  const resultSingular = root.dataset.resultSingular || resultNoun.replace(/s$/, '');
  const resultCount = count => count + ' ' + (count === 1 ? resultSingular : resultNoun);
  let projects;
  try {
    const response = await fetch(root.dataset.projects || 'ic-projects.json');
    if (!response.ok) throw new Error('Gallery data unavailable');
    projects = await response.json();
  } catch (error) {
    console.error(error);
    root.querySelector('.ic-results').textContent = resultNoun === 'projects'
      ? 'Project details are temporarily unavailable'
      : resultNoun.charAt(0).toUpperCase() + resultNoun.slice(1) + ' are temporarily unavailable';
    return;
  }

  const track = root.querySelector('.ic-accordion-track');
  const cards = [...track.querySelectorAll('.ic-card')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 1000px)');
  const phoneLayout = matchMedia('(max-width: 760px)');
  const playButton = root.querySelector('.ic-showcase-play');
  let category = 'all', selectedId = projects[0]?.id;
  let manuallyPaused = window.PortfolioAutoplay.paused(root.id || 'ic-gallery'), hovering = false, onScreen = false;
  let timer = null, scrollTimer = null, scrollingByCode = false;
  let currentId = null, viewerProjects = [], zoom = 1;
  const visible = () => projects.filter(p => category === 'all' || p.category === category);
  const cardFor = id => cards.find(card => card.dataset.icId === id);
  const motionEnabled = () => !motion.matches && window.portfolioMotionEnabled !== false;
  const behavior = () => motionEnabled() ? 'smooth' : 'instant';

  const dialog = document.createElement('dialog');
  dialog.className = 'ic-viewer';
  const viewerPrefix = root.id === 'ic-gallery' ? 'ic-viewer' : (root.id || 'project-gallery-' + galleryIndex) + '-viewer';
  dialog.dataset.gallery = root.id || String(galleryIndex);
  dialog.setAttribute('aria-labelledby', viewerPrefix + '-title');
  dialog.innerHTML = `<header class="ic-viewer-head"><div><small id="${viewerPrefix}-meta"></small><h2 id="${viewerPrefix}-title"></h2></div><button class="ic-viewer-close" aria-label="Close project viewer">×</button></header><div class="ic-viewer-layout"><div class="ic-viewer-visual"><div class="ic-zoom-toolbar"><span class="ic-image-kind">ILLUSTRATIVE PREVIEW</span><button data-zoom="out" aria-label="Zoom out">−</button><span class="ic-zoom-value" aria-live="polite">100%</span><button data-zoom="in" aria-label="Zoom in">+</button><button data-zoom="reset">Reset</button></div><div class="ic-viewer-stage" tabindex="0" aria-label="Project image; scroll to pan when zoomed"><div class="ic-zoom-surface"><img alt=""></div></div><p class="ic-viewer-caption"></p></div><div class="ic-viewer-details"><div><h3 data-detail-label="purpose">Purpose</h3><p data-detail="purpose"></p><h3 data-detail-label="contribution">My contribution</h3><p data-detail="contribution"></p></div><div><h3 data-detail-label="decisions">Layout considerations</h3><ul data-detail="decisions"></ul><h3 data-detail-label="verification">Verification</h3><div class="ic-viewer-status" data-detail="verification"></div></div></div></div><footer class="ic-viewer-foot"><button class="ic-prev">← Previous</button><span class="ic-viewer-position"></span><button class="ic-next">Next →</button></footer>`;
  const additionalMedia = document.createElement('div'); additionalMedia.className = 'ic-viewer-additional-media'; additionalMedia.hidden = true; dialog.querySelector('.ic-viewer-visual').append(additionalMedia);
  document.body.append(dialog);

  function clearAutoplay() { clearTimeout(timer); timer = null; }
  function updateAutoplay() {
    window.PortfolioAutoplay.remember(root.id || 'ic-gallery', manuallyPaused);
    clearAutoplay();
    const count = visible().length;
    const enabled = motionEnabled();
    const focusBlocks = root.contains(document.activeElement) && document.activeElement !== playButton;
    playButton.disabled = !enabled || count < 2;
    playButton.setAttribute('aria-pressed', String(enabled && !manuallyPaused));
    playButton.innerHTML = !enabled ? '<span aria-hidden="true">−</span> Auto off' : manuallyPaused ? '<span aria-hidden="true">▷</span> Play' : '<span aria-hidden="true">Ⅱ</span> Pause';
    playButton.setAttribute('aria-label', !enabled ? 'Automatic showcase disabled while motion is off' : manuallyPaused ? 'Play automatic project showcase' : 'Pause automatic project showcase');
    if (window.PortfolioAutoplay.canRun(root) && enabled && !manuallyPaused && !hovering && onScreen && !root.closest('[hidden]') && !document.hidden && !focusBlocks && !dialog.open && count > 1) {
      timer = setTimeout(() => advance(1, false), 5000);
    }
  }
  function takeOver() { manuallyPaused = true; updateAutoplay(); }

  function scrollToCard(card) {
    if (!compact.matches) return;
    const target = card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft - (track.clientWidth - card.offsetWidth) / 2;
    scrollingByCode = true;
    track.scrollTo({ left: Math.max(0, target), behavior: behavior() });
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => { scrollingByCode = false; }, 650);
  }
  function select(id, { scroll = false, focus = false } = {}) {
    if (!visible().some(p => p.id === id)) return;
    selectedId = id;
    cards.forEach(card => {
      const active = card.dataset.icId === id;
      card.classList.toggle('is-active', active);
      card.querySelector('.ic-panel-toggle').setAttribute('aria-expanded', String(active));
      card.querySelector('.ic-panel-details').hidden = !active;
    });
    const candidates = visible(), index = candidates.findIndex(p => p.id === id);
    root.querySelector('.ic-showcase-count').textContent = String(index + 1) + ' / ' + String(candidates.length);
    const progress = root.querySelector('.ic-showcase-progress span');
    progress.style.width = (100 / candidates.length) + '%';
    progress.style.transform = `translateX(${index * 100}%)`;
    const card = cardFor(id);
    if (focus) card.querySelector('.ic-panel-toggle').focus({ preventScroll: true });
    if (scroll) scrollToCard(card);
    updateAutoplay();
  }
  function advance(direction, manual = true, focus = false) {
    const candidates = visible();
    if (!candidates.length) return;
    if (manual) takeOver();
    const index = candidates.findIndex(p => p.id === selectedId);
    const next = candidates[(index + direction + candidates.length) % candidates.length];
    select(next.id, { scroll: true, focus });
  }

  root.querySelectorAll('[data-ic-filter]').forEach(button => {
    button.addEventListener('click', () => {
      takeOver();
      category = button.dataset.icFilter;
      cards.forEach(card => { card.hidden = category !== 'all' && card.dataset.icCategory !== category; });
      root.querySelectorAll('[data-ic-filter]').forEach(filter => {
        const active = filter === button;
        filter.classList.toggle('active', active);
        filter.setAttribute('aria-pressed', String(active));
      });
      const candidates = visible();
      const nextId = candidates.some(p => p.id === selectedId) ? selectedId : candidates[0]?.id;
      root.querySelector('.ic-results').textContent = resultCount(candidates.length);
      track.dataset.count = String(candidates.length);
      root.querySelectorAll('.ic-showcase-prev,.ic-showcase-next').forEach(control => { control.disabled = candidates.length < 2; });
      if (nextId) select(nextId, { scroll: true });
    });
  });

  cards.forEach(card => {
    const toggle = card.querySelector('.ic-panel-toggle');
    card.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && !(root.contains(document.activeElement) && document.activeElement.matches(':focus-visible'))) select(card.dataset.icId);
    });
    card.addEventListener('click', event => {
      if (event.target.closest('[data-project]')) return;
      takeOver();
      select(card.dataset.icId, { scroll: true });
    });
    toggle.addEventListener('focus', () => select(card.dataset.icId));
    toggle.addEventListener('keydown', event => {
      const candidates = visible();
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        advance(event.key === 'ArrowRight' ? 1 : -1, true, true);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        takeOver();
        select((event.key === 'Home' ? candidates[0] : candidates[candidates.length - 1]).id, { scroll: true, focus: true });
      }
    });
  });
  root.querySelector('.ic-showcase-prev').onclick = () => advance(-1);
  root.querySelector('.ic-showcase-next').onclick = () => advance(1);
  playButton.onclick = () => { manuallyPaused = !manuallyPaused; updateAutoplay(); };
  root.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; updateAutoplay(); } });
  root.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovering = false; updateAutoplay(); } });
  root.addEventListener('focusin', updateAutoplay);
  root.addEventListener('focusout', () => queueMicrotask(updateAutoplay));
  track.addEventListener('pointerdown', () => { scrollingByCode = false; takeOver(); }, { passive: true });
  track.addEventListener('wheel', event => { if (Math.abs(event.deltaX) > 0) { scrollingByCode = false; takeOver(); } }, { passive: true });
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (scrollingByCode) { scrollingByCode = false; return; }
      if (!compact.matches) return;
      const midpoint = track.getBoundingClientRect().left + track.clientWidth / 2;
      const nearest = cards.filter(card => !card.hidden).reduce((best, card) => {
        const bounds = card.getBoundingClientRect();
        const distance = Math.abs(bounds.left + bounds.width / 2 - midpoint);
        return !best || distance < best.distance ? { card, distance } : best;
      }, null);
      if (nearest && nearest.card.dataset.icId !== selectedId) select(nearest.card.dataset.icId);
    }, 150);
  }, { passive: true });

  const viewerStage = dialog.querySelector('.ic-viewer-stage');
  const zoomSurface = dialog.querySelector('.ic-zoom-surface');
  const viewerImage = dialog.querySelector('.ic-zoom-surface img');
  let fitFrame = null;

  function renderZoom() {
    if (dialog.dataset.imageKind !== 'original') {
      zoomSurface.style.width = (zoom * 100) + '%';
      zoomSurface.style.height = '';
      viewerImage.style.width = '';
      viewerImage.style.height = '';
      return;
    }
    // 100% is a complete fit of the original image, not a claim of pixel-native size.
    // Measure the visible stage after showModal; its border box stays stable as scrollbars appear.
    if (!dialog.open || !viewerImage.naturalWidth || !viewerImage.naturalHeight) return;
    const viewportWidth = viewerStage.offsetWidth;
    const viewportHeight = viewerStage.offsetHeight;
    if (!viewportWidth || !viewportHeight) return;
    const margin = 16;
    const fit = Math.min(1, Math.max(1, viewportWidth - margin * 2) / viewerImage.naturalWidth,
      Math.max(1, viewportHeight - margin * 2) / viewerImage.naturalHeight);
    const imageWidth = viewerImage.naturalWidth * fit * zoom;
    const imageHeight = viewerImage.naturalHeight * fit * zoom;
    viewerImage.style.width = imageWidth.toFixed(2) + 'px';
    viewerImage.style.height = imageHeight.toFixed(2) + 'px';
    zoomSurface.style.width = Math.max(viewerStage.clientWidth, imageWidth + margin * 2).toFixed(2) + 'px';
    zoomSurface.style.height = Math.max(viewerStage.clientHeight, imageHeight + margin * 2).toFixed(2) + 'px';
    if (zoom === 1) viewerStage.scrollTo(0, 0);
  }

  function scheduleFit() {
    if (!dialog.open || dialog.dataset.imageKind !== 'original' || fitFrame !== null) return;
    fitFrame = requestAnimationFrame(() => { fitFrame = null; renderZoom(); });
  }

  function setZoom(next) {
    zoom = Math.max(1, Math.min(3, next));
    renderZoom();
    dialog.querySelector('.ic-zoom-value').textContent = Math.round(zoom * 100) + '%';
    dialog.querySelector('.ic-zoom-value').setAttribute('title', dialog.dataset.imageKind === 'original' ? 'Zoom relative to the full-image fit' : 'Image zoom');
    dialog.querySelector('[data-zoom="out"]').disabled = zoom === 1;
    dialog.querySelector('[data-zoom="in"]').disabled = zoom === 3;
    if (zoom === 1) viewerStage.scrollTo(0, 0);
  }
  viewerImage.addEventListener('load', scheduleFit);
  window.addEventListener('resize', scheduleFit, { passive: true });
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(scheduleFit).observe(viewerStage, { box: 'border-box' });
  }
  dialog.querySelectorAll('[data-zoom]').forEach(button => {
    button.onclick = () => setZoom(button.dataset.zoom === 'reset' ? 1 : zoom + (button.dataset.zoom === 'in' ? .25 : -.25));
  });
  function show(id, newSession = false) {
    const item = projects.find(p => p.id === id);
    if (!item) return;
    if (newSession) viewerProjects = visible().slice();
    currentId = id;
    takeOver();
    select(id);
    dialog.querySelector('h2').textContent = item.title;
    dialog.querySelector('.ic-viewer-head small').textContent = [item.categoryName, item.node, item.tools].filter(Boolean).join(' · ');
    const defaultLabels = { purpose: 'Purpose', contribution: 'My contribution', decisions: 'Layout considerations', verification: 'Verification' };
    Object.entries(defaultLabels).forEach(([key, fallback]) => {
      dialog.querySelector('[data-detail-label="' + key + '"]').textContent = item[key + 'Label'] || root.dataset[key + 'Label'] || fallback;
    });
    const image = viewerImage;
    const original = item.imageKind === 'original';
    dialog.dataset.imageKind = original ? 'original' : 'illustrative';
    dialog.querySelector('.ic-image-kind').textContent = item.imageLabel || (original ? root.dataset.originalImageLabel || 'PROJECT LAYOUT' : 'ILLUSTRATIVE PREVIEW');
    image.style.width = '';
    image.style.height = '';
    zoomSurface.style.width = '100%';
    zoomSurface.style.height = '';
    image.src = item.poster && !motionEnabled() ? item.poster : item.image;
    image.alt = item.imageAlt || (original ? 'Project layout for ' + item.title
      : 'Illustrative preview for ' + item.title + '; replace with approved project layout');
    dialog.querySelector('.ic-viewer-caption').textContent = item.imageNote;
    if (original) {
      const sourceLink = document.createElement('a');
      sourceLink.className = 'ic-original-image';
      sourceLink.href = item.image;
      sourceLink.target = '_blank';
      sourceLink.rel = 'noopener noreferrer';
      sourceLink.textContent = 'Open original image ↗';
      dialog.querySelector('.ic-viewer-caption').append(sourceLink);
    }
    additionalMedia.replaceChildren();
    (item.extraMedia || []).forEach(media => { const figure = document.createElement('figure'); const link = document.createElement('a'); link.href = media.image; link.target = '_blank'; link.rel = 'noopener noreferrer'; const photo = document.createElement('img'); photo.src = media.image; photo.alt = media.caption; photo.loading = 'lazy'; link.append(photo); const caption = document.createElement('figcaption'); caption.textContent = media.caption; figure.append(link, caption); additionalMedia.append(figure); });
    if (item.document) { const link = document.createElement('a'); link.href = item.document; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.className = 'project-report-link'; link.textContent = (item.documentLabel || 'Read project report') + ' ↗'; additionalMedia.append(link); }
    additionalMedia.hidden = !additionalMedia.children.length;
    ['purpose', 'contribution', 'verification'].forEach(key => { dialog.querySelector('[data-detail="' + key + '"]').textContent = item[key]; });
    const list = dialog.querySelector('[data-detail="decisions"]');
    list.replaceChildren();
    item.decisions.forEach(value => { const li = document.createElement('li'); li.textContent = value; list.append(li); });
    const index = viewerProjects.findIndex(p => p.id === id);
    dialog.querySelector('.ic-viewer-position').textContent = String(index + 1) + ' / ' + String(viewerProjects.length);
    dialog.querySelector('.ic-prev').disabled = index <= 0;
    dialog.querySelector('.ic-next').disabled = index >= viewerProjects.length - 1;
    if (!dialog.open) dialog.showModal();
    setZoom(1);
    dialog.scrollTop = 0;
    scheduleFit();
    updateAutoplay();
  }
  function updateAnimatedOriginal() {
    const item = projects.find(project => project.id === currentId);
    if (item?.poster) { const target = motionEnabled() ? item.image : item.poster; if (viewerImage.getAttribute('src') !== target) viewerImage.src = target; }
  }
  window.addEventListener('portfolio-motion', updateAnimatedOriginal);
  motion.addEventListener('change', updateAnimatedOriginal);
  function move(direction) {
    const index = viewerProjects.findIndex(p => p.id === currentId);
    if (viewerProjects[index + direction]) show(viewerProjects[index + direction].id);
  }
  dialog.querySelector('.ic-viewer-close').onclick = () => dialog.close();
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', updateAutoplay);
  dialog.querySelector('.ic-prev').onclick = () => move(-1);
  dialog.querySelector('.ic-next').onclick = () => move(1);
  dialog.addEventListener('keydown', event => {
    if (event.target.closest('.ic-viewer-stage')) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  root.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => show(button.dataset.project, true)));
  new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting && entries[0].intersectionRatio >= .15; updateAutoplay(); }, { threshold: .15 }).observe(track);
  const visibilityObserver = new MutationObserver(updateAutoplay);
  for (let element = root; element; element = element.parentElement) {
    visibilityObserver.observe(element, { attributes: true, attributeFilter: ['hidden'] });
  }
  const touchHint = root.querySelector('.ic-showcase-hint');
  const desktopHint = touchHint.innerHTML;
  function updateTouchHint() {
    if (phoneLayout.matches) touchHint.textContent = 'Swipe to explore · tap to expand';
    else touchHint.innerHTML = desktopHint;
  }
  phoneLayout.addEventListener('change', updateTouchHint);
  updateTouchHint();
  document.addEventListener('visibilitychange', updateAutoplay);
  motion.addEventListener('change', updateAutoplay);
  window.addEventListener('portfolio-motion', updateAutoplay);
  window.PortfolioAutoplay.watch(updateAutoplay);
  root.querySelector('.ic-results').textContent = resultCount(projects.length);
  select(selectedId);
  }

  document.querySelectorAll('#ic-gallery, .ic-gallery[data-projects]').forEach((root, index) => {
    initializeGallery(root, index).catch(error => console.error('Unable to initialize gallery', error));
  });
})();

