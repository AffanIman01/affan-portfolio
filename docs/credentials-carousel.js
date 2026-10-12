(() => {
  const root = document.querySelector('#credential-carousel');
  if (!root) return;
  const track = root.querySelector('.certificate-track');
  const status = root.querySelector('.certificate-status');
  const prev = root.querySelector('[data-certificate-prev]');
  const next = root.querySelector('[data-certificate-next]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let records = [], filter = 'all', frame = 0, opener;
  const create = (tag, className, value) => { const el = document.createElement(tag); if (className) el.className = className; if (value) el.textContent = value; return el; };
  function preview(record) {
    const el = create('div', 'certificate-preview' + (record.image ? ' has-evidence' : ''));
    if (record.image) {
      const img = create('img'); img.src = record.image; img.alt = record.imageAlt || record.title; img.loading = 'lazy'; el.append(img);
      el.append(create('span', 'certificate-preview-label', 'OFFICIAL BADGE'));
    } else {
      const sheet = create('div', 'certificate-sheet');
      sheet.append(create('span', 'certificate-sheet-label', record.category === 'future' ? 'NEXT CHAPTER' : 'LEARNING RECORD'));
      if (record.issuerLogo) { const img = create('img', 'certificate-issuer-logo'); img.src = record.issuerLogo; img.alt = record.issuer; img.loading = 'lazy'; sheet.append(img); }
      else sheet.append(create('strong', 'certificate-sheet-issuer', record.issuer));
      const lines = create('div', 'certificate-sheet-lines'); lines.setAttribute('aria-hidden', 'true'); lines.append(create('i'), create('i'), create('i')); sheet.append(lines);
      sheet.append(create('span', 'certificate-sheet-note', record.category === 'future' ? 'A place for what comes next' : 'Certificate preview to add'));
      el.append(sheet);
    }
    return el;
  }
  const dialog = create('dialog', 'certificate-dialog');
  dialog.setAttribute('aria-labelledby', 'certificate-dialog-title');
  const header = create('header', 'certificate-dialog-header');
  const heading = create('div'); heading.append(create('span', 'certificate-dialog-issuer'), create('h2'));
  heading.querySelector('h2').id = 'certificate-dialog-title';
  const close = create('button', 'certificate-dialog-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close credential details'); header.append(heading, close);
  const body = create('div', 'certificate-dialog-body'); dialog.append(header, body); document.body.append(dialog);
  close.onclick = () => dialog.close();
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => opener?.focus({preventScroll:true}));
  function open(record, button) {
    opener = button; dialog.style.setProperty('--certificate-accent', record.accent);
    heading.querySelector('span').textContent = record.issuer;
    heading.querySelector('h2').textContent = record.title;
    const copy = create('div', 'certificate-dialog-copy');
    copy.append(create('span', 'certificate-kind', record.type), create('p', '', record.description));
    if (record.date) copy.append(create('p', 'certificate-date', record.date));
    copy.append(create('p', 'certificate-evidence-note', record.status));
    if (record.link) { const link = create('a', 'certificate-evidence-link', record.linkLabel + ' ↗'); link.href = record.link; link.target = '_blank'; link.rel = 'noopener noreferrer'; copy.append(link); }
    body.replaceChildren(preview(record), copy); dialog.showModal(); dialog.scrollTop = 0;
  }
  const cards = () => [...track.querySelectorAll('.certificate-card:not([hidden])')];
  function update() {
    const visible = cards(); if (!visible.length || !track.clientWidth) return;
    const bounds = track.getBoundingClientRect();
    let first = visible.findIndex(card => card.getBoundingClientRect().right > bounds.left + 20); if (first < 0) first = visible.length - 1;
    let last = first;
    visible.forEach((card, i) => { const box = card.getBoundingClientRect(); if (box.left < bounds.right - 20 && box.right > bounds.left + 20) last = i; });
    status.textContent = (first + 1 === last + 1 ? String(first + 1) : (first + 1) + '–' + (last + 1)) + ' / ' + visible.length;
    prev.disabled = track.scrollLeft <= 3;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 3;
    root.querySelector('.certificate-progress span').style.width = ((last + 1) / visible.length * 100) + '%';
  }
  function scheduleUpdate() { if (frame) return; frame = requestAnimationFrame(() => { frame = 0; update(); }); }
  function move(direction, edge) {
    const visible = cards(); if (!visible.length) return;
    const bounds = track.getBoundingClientRect();
    let index = visible.findIndex(card => card.getBoundingClientRect().left >= bounds.left - 5); if (index < 0) index = visible.length - 1;
    const target = edge === 'start' ? 0 : edge === 'end' ? visible.length - 1 : Math.max(0, Math.min(visible.length - 1, index + direction));
    track.scrollTo({left:track.scrollLeft + visible[target].getBoundingClientRect().left - bounds.left, behavior:reduced.matches || window.portfolioMotionEnabled === false ? 'instant' : 'smooth'});
  }
  prev.onclick = () => move(-1); next.onclick = () => move(1);
  track.addEventListener('scroll', scheduleUpdate, {passive:true});
  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'Home') { event.preventDefault(); move(0, 'start'); }
    if (event.key === 'End') { event.preventDefault(); move(0, 'end'); }
  });
  new ResizeObserver(scheduleUpdate).observe(track);
  root.querySelectorAll('[data-certificate-filter]').forEach(button => button.onclick = () => {
    filter = button.dataset.certificateFilter;
    root.querySelectorAll('[data-certificate-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    track.querySelectorAll('.certificate-card').forEach(card => card.hidden = filter !== 'all' && card.dataset.category !== filter);
    track.scrollTo({left:0, behavior:'instant'}); scheduleUpdate();
  });
  fetch('credential-records.json').then(response => { if (!response.ok) throw Error('Credentials unavailable'); return response.json(); }).then(data => {
    records = data;
    records.forEach((record, i) => {
      const card = create('article', 'certificate-card' + (record.category === 'future' ? ' certificate-future' : ''));
      card.dataset.category = record.category; card.style.setProperty('--certificate-accent', record.accent);
      card.setAttribute('role', 'group'); card.setAttribute('aria-roledescription', 'slide'); card.setAttribute('aria-label', (i + 1) + ' of ' + records.length + ': ' + record.title);
      const copy = create('div', 'certificate-card-copy'); copy.append(create('span', 'certificate-kind', record.type), create('h3', '', record.title), create('p', 'certificate-card-issuer', record.issuer));
      if (record.date) copy.append(create('p', 'certificate-date', record.date));
      copy.append(create('p', 'certificate-card-description', record.description));
      const footer = create('div', 'certificate-card-footer'); footer.append(create('span', 'certificate-evidence-note', record.status));
      if (record.category !== 'future') { const button = create('button', 'certificate-details-button', 'View details ↗'); button.type = 'button'; button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-label', 'View ' + record.title + ' credential details'); button.onclick = () => open(record, button); footer.append(button); }
      copy.append(footer); card.append(preview(record), copy); track.append(card);
    });
    root.querySelector('.certificate-collection-count').textContent = records.filter(record => record.category !== 'future').length + ' learning records · room to grow';
    scheduleUpdate();
  }).catch(() => { status.textContent = 'Credentials could not load. Please refresh.'; });
})();
