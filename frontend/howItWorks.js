initCursorGlow();
initScrollReveal(0.08);

document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-question').addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

function switchTab(tab) {
  document.querySelectorAll('.hiw-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.getElementById('flowCliente').style.display    = tab === 'cliente'    ? 'grid' : 'none';
  document.getElementById('flowFreelancer').style.display = tab === 'freelancer' ? 'grid' : 'none';
  initScrollReveal(0.08);
}
