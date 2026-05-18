initCursorGlow();
initScrollReveal(0.08);

document.querySelectorAll('.perk-card').forEach((el, i) => {
  el.style.transitionDelay = (i * 70) + 'ms';
});

// Department filter
document.querySelectorAll('[data-dept]').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('[data-dept]').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    const dept = this.dataset.dept;
    document.querySelectorAll('.job-card').forEach(card => {
      const match = dept === 'todos' || card.dataset.dept === dept;
      card.style.display = match ? '' : 'none';
    });
  });
});
