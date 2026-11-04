(() => {
  const root = document.getElementById('academic-projects');
  if (!root) return;
  const buttons = [...root.querySelectorAll('[data-academic-filter]')];
  const cards = [...root.querySelectorAll('[data-academic-category]')];
  const results = root.querySelector('.academic-results');
  buttons.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.academicFilter;
    let count = 0;
    cards.forEach(card => {
      const visible = category === 'all' || card.dataset.academicCategory === category;
      card.hidden = !visible;
      if (visible) card.style.setProperty('--card-order', String(count++));
    });
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    results.textContent = count + (count === 1 ? ' project' : ' projects');
  }));
  root.querySelector('.academic-catalog-toolbar').hidden = false;
})();
