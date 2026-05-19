initCursorGlow();
initScrollReveal(0.06, '.cat-full-card', 60);

function filterCategories(query) {
  const q = query.toLowerCase().trim();
  const cards = document.querySelectorAll('.cat-full-card');
  let visible = 0;
  cards.forEach(card => {
    const match = card.dataset.name.includes(q) || card.querySelector('.cat-full-name').textContent.toLowerCase().includes(q);
    card.style.display = (!q || match) ? '' : 'none';
    if (!q || match) visible++;
  });
  document.getElementById('catEmpty').style.display = visible === 0 ? 'flex' : 'none';
}

function sortCategories(order, btn) {
  document.querySelectorAll('.cat-sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function clearSearch() {
  document.getElementById('catSearch').value = '';
  filterCategories('');
}
