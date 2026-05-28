initCursorGlow();

initScrollReveal(0.12);

document.querySelectorAll('.categories-grid .cat-card, .freelancers-grid .fl-card').forEach((el, i) => {
  el.style.transitionDelay = (i * 80) + 'ms'; /* dynamic: stagger computed from index */
});

document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-question').addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  navLinks.forEach(a => {
    a.classList.toggle('nav-active', a.getAttribute('href') === '#' + current);
  });
});

initNotifPanel();

OFAuth.loadNav();
