(() => {
  const images = [...document.querySelectorAll('[data-motion-image]')];
  if (!images.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  images.forEach(image => image.dataset.motionSrc = image.getAttribute('src'));
  function sync() {
    images.forEach(image => {
      const enabled = !reduced.matches && window.portfolioMotionEnabled !== false && !document.hidden && image.dataset.mediaVisible === 'true';
      const target = enabled ? image.dataset.motionSrc : image.dataset.stillSrc;
      if (target && image.getAttribute('src') !== target) image.src = target;
    });
  }
  const observer = new IntersectionObserver(entries => { entries.forEach(entry => entry.target.dataset.mediaVisible = String(entry.isIntersecting)); sync(); });
  images.forEach(image => observer.observe(image));
  window.addEventListener('portfolio-motion', sync); reduced.addEventListener('change', sync); document.addEventListener('visibilitychange', sync); sync();
})();
