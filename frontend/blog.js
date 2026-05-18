initCursorGlow();
initScrollReveal(0.08);

// Category filter
document.querySelectorAll('.blog-filter-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.blog-filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    const cat = this.dataset.cat;
    const cards = document.querySelectorAll('#blogGrid .blog-card, .blog-featured');
    cards.forEach(card => {
      const match = cat === 'todos' || card.dataset.cat === cat;
      card.style.display = match ? '' : 'none';
    });
  });
});

// Newsletter form
document.getElementById('newsletterForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const input = this.querySelector('input');
  const btn   = this.querySelector('button');
  btn.textContent = 'Inscrito! ✓';
  btn.style.background = 'var(--green-dim)';
  input.disabled = true;
  btn.disabled   = true;
});

// Load more (toggle hidden cards — placeholder behaviour)
document.getElementById('loadMoreBtn').addEventListener('click', function () {
  this.textContent = 'Sem mais artigos por enquanto';
  this.disabled = true;
  this.style.opacity = '0.5';
});
