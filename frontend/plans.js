initCursorGlow();
initScrollReveal(0.08);

document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-question').addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

function setBilling(type) {
  const isAnual = type === 'anual';
  document.getElementById('btnMensal').classList.toggle('active', !isAnual);
  document.getElementById('btnAnual').classList.toggle('active', isAnual);
  document.getElementById('billingHint').textContent = isAnual
    ? 'Você está economizando 20% com o plano anual'
    : 'Economize 20% com plano anual';

  document.querySelectorAll('[data-mensal]').forEach(el => {
    el.textContent = isAnual ? el.dataset.anual : el.dataset.mensal;
  });
}
