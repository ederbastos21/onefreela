initCursorGlow();
initScrollReveal(0.08);

document.getElementById('contactForm').addEventListener('submit', function (e) {
  e.preventDefault();
  this.style.display = 'none';
  document.getElementById('contactSuccess').classList.add('visible');
});
