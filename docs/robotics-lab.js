(() => {
  const root = document.querySelector('#robotics-lab'); if (!root) return;
  const grid = root.querySelector('.robot-lab-grid'), status = root.querySelector('.robot-lab-status');
  const loopButton = root.querySelector('.robot-loop-toggle'), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const prev = root.querySelector('[data-lab-prev]'), next = root.querySelector('[data-lab-next]');
  let paused = false, hovering = false, onScreen = false, items = [], selected = 0, timer, opener, activeFilter = 'all', manualScroll = false;
  const make = (tag, cls, value) => { const el = document.createElement(tag); if (cls) el.className = cls; if (value) el.textContent = value; return el; };
  const visibleCards = () => [...grid.querySelectorAll('.robot-lab-card:not([hidden])')];
  const motion = () => !paused && !reduced.matches && window.portfolioMotionEnabled !== false && !document.hidden;
  function media(item) {
    const video = make('video', 'research-loop'); video.poster = item.preview.poster; video.dataset.previewSrc = item.preview.video;
    video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none';
    video.setAttribute('aria-label', item.preview.title + '. Reference footage by ' + item.preview.credit);
    return video;
  }
  const dialog = make('dialog', 'robot-lab-dialog'); dialog.setAttribute('aria-labelledby', 'robot-lab-dialog-title');
  dialog.innerHTML = '<header><div><span class="lab-dialog-label"></span><h2 id="robot-lab-dialog-title"></h2></div><button type="button" class="lab-close" aria-label="Close project details">×</button></header><div class="lab-dialog-layout"><div class="lab-dialog-media"></div><div class="lab-dialog-copy"></div></div>';
  document.body.append(dialog);
  function updateVideos() {
    [...grid.querySelectorAll('video'), ...dialog.querySelectorAll('video')].forEach(video => {
      const inDialog = dialog.contains(video);
      const card = video.closest('.robot-lab-card');
      const play = motion() && (inDialog ? dialog.open : onScreen && card && !card.hidden && card.classList.contains('loop-visible') && !dialog.open);
      if (play) { if (!video.getAttribute('src')) video.src = video.dataset.previewSrc; video.play().catch(() => {}); }
      else video.pause();
    });
  }
  function sync() {
    clearTimeout(timer); timer = null;
    loopButton.textContent = motion() ? 'Pause previews' : 'Play previews';
    loopButton.disabled = reduced.matches || window.portfolioMotionEnabled === false;
    loopButton.setAttribute('aria-pressed', String(motion()));
    updateVideos();
    const cards = visibleCards();
    prev.disabled = next.disabled = cards.length < 2;
    if (motion() && onScreen && !hovering && !grid.contains(document.activeElement) && !dialog.open && cards.length > 1) timer = setTimeout(() => select(selected + 1), 2500);
  }
  function select(index, manual = false) {
    const cards = visibleCards(); if (!cards.length) return;
    if (manual) paused = true;
    selected = (index + cards.length) % cards.length;
    cards.forEach((card, i) => card.classList.toggle('is-current', i === selected));
    const box = grid.getBoundingClientRect();
    grid.scrollTo({left:grid.scrollLeft + cards[selected].getBoundingClientRect().left - box.left, behavior:reduced.matches || window.portfolioMotionEnabled === false ? 'instant' : 'smooth'});
    root.querySelector('.lab-carousel-position').textContent = (selected + 1) + ' / ' + cards.length;
    sync();
  }
  function open(item, button) {
    opener = button; dialog.style.setProperty('--loop-accent', item.accent);
    dialog.querySelector('.lab-dialog-label').textContent = item.label + ' · ' + item.kind;
    dialog.querySelector('h2').textContent = item.title;
    const visual = dialog.querySelector('.lab-dialog-media'); visual.replaceChildren(media(item));
    visual.append(make('p', 'research-reference-title', item.preview.title), make('p', 'research-reference-credit', item.preview.credit), make('p', 'research-reference-note', item.preview.type + ' · Reference preview, not my project footage.'));
    const links = make('div', 'research-source-links');
    [['Research source ↗', item.preview.sourceUrl], ['Open sample GIF ↗', item.preview.gif]].forEach(([label, url]) => { const link = make('a', '', label); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; links.append(link); }); visual.append(links);
    const notes = dialog.querySelector('.lab-dialog-copy'); notes.replaceChildren();
    const append = (tag, text) => notes.append(make(tag, '', text));
    append('h3', 'My experience'); append('p', item.experience);
    append('h3', 'Case study outline'); const list = make('ul'); item.focus.forEach(text => list.append(make('li', '', text))); notes.append(list);
    append('h3', 'My footage to add'); append('p', item.media);
    append('h3', 'Project details'); append('p', 'Exact title, dates, my role, hardware, software, challenges and verified results will be added. The moving preview is credited reference material.');
    dialog.showModal(); dialog.scrollTop = 0; sync();
  }
  dialog.querySelector('.lab-close').onclick = () => dialog.close();
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { opener?.focus({preventScroll:true}); sync(); });
  loopButton.onclick = () => { paused = !paused; sync(); };
  prev.onclick = () => select(selected - 1, true); next.onclick = () => select(selected + 1, true);
  grid.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; sync(); } });
  grid.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovering = false; sync(); } });
  grid.addEventListener('focusin', sync); grid.addEventListener('focusout', () => queueMicrotask(sync));
  grid.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') { paused = true; manualScroll = true; sync(); } }, {passive:true});
  grid.addEventListener('wheel', event => { if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) { paused = true; manualScroll = true; sync(); } }, {passive:true});
  grid.addEventListener('scrollend', () => {
    if (!manualScroll) return; manualScroll = false;
    const cards = visibleCards(), left = grid.getBoundingClientRect().left;
    selected = cards.reduce((best, card, i) => Math.abs(card.getBoundingClientRect().left - left) < Math.abs(cards[best].getBoundingClientRect().left - left) ? i : best, 0);
    cards.forEach((card, i) => card.classList.toggle('is-current', i === selected));
    root.querySelector('.lab-carousel-position').textContent = (selected + 1) + ' / ' + cards.length;
  });
  grid.addEventListener('keydown', event => { if (event.target !== grid) return; const dir = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0; if (dir) { event.preventDefault(); select(selected + dir, true); } });
  const cardObserver = new IntersectionObserver(entries => { entries.forEach(entry => entry.target.classList.toggle('loop-visible', entry.isIntersecting)); updateVideos(); }, {root:grid, threshold:.1});
  new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; sync(); }, {threshold:.1}).observe(grid);
  new ResizeObserver(() => { updateVideos(); }).observe(grid);
  window.addEventListener('portfolio-motion', sync); reduced.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
  function filter(value) {
    activeFilter = value; root.querySelectorAll('[data-lab-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.labFilter === value)));
    grid.querySelectorAll('.robot-lab-card').forEach(card => card.hidden = value !== 'all' && card.dataset.category !== value);
    const count = visibleCards().length; status.textContent = count + ' showcases · credited research samples · tap a card for details'; selected = 0; select(0);
  }
  root.querySelectorAll('[data-lab-filter]').forEach(button => button.onclick = () => filter(button.dataset.labFilter));
  fetch('robotics-projects.json').then(response => { if (!response.ok) throw Error('Projects unavailable'); return response.json(); }).then(data => {
    items = data;
    items.forEach(item => {
      const card = make('button', 'robot-lab-card'); card.type = 'button'; card.dataset.category = item.category; card.style.setProperty('--loop-accent', item.accent); card.setAttribute('aria-label', 'View ' + item.title + ' details'); card.setAttribute('aria-haspopup', 'dialog');
      const visual = make('div', 'robot-lab-visual'); visual.append(media(item), make('span', 'loop-sample-label', 'RESEARCH REFERENCE'));
      const copy = make('div', 'robot-lab-card-copy'); copy.append(make('span', 'lab-kicker', item.label), make('h3', '', item.title), make('p', '', item.summary), make('span', 'lab-preview-source', item.preview.title));
      const footer = make('div', 'lab-card-footer'); footer.append(make('span', '', item.kind), make('b', '', '↗')); footer.querySelector('b').setAttribute('aria-hidden', 'true'); copy.append(footer); card.append(visual, copy); card.onclick = () => open(item, card); grid.append(card); cardObserver.observe(card);
    });
    filter(activeFilter);
  }).catch(() => { status.textContent = 'Project previews could not load. Please refresh.'; });
  sync();
})();
