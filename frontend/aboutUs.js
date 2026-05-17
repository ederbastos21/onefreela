initCursorGlow();

initScrollReveal(0.1);

document.querySelectorAll('.valor-card').forEach((el, i) => {
  el.style.transitionDelay = (i * 90) + 'ms';
});
