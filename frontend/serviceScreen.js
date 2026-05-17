OFAuth.loadNav();

const packages = [
  {
    desc: 'Design System básico com 30 componentes essenciais e paleta de cores. Ideal para MVPs e projetos menores. Inclui 1 revisão.',
    features: [
      [true,  '30 componentes no Figma'],
      [true,  'Paleta de cores e tipografia'],
      [true,  'Grid básico'],
      [true,  '1 revisão incluída'],
      [true,  'Entrega em 5 dias'],
      [false, 'Tokens de design'],
      [false, 'Dark mode'],
      [false, 'Handoff para dev'],
    ]
  },
  {
    desc: 'Design System completo com 60+ componentes, tokens de design, guia de estilo e documentação para dev. Inclui 3 revisões.',
    features: [
      [true,  '60+ componentes no Figma'],
      [true,  'Tokens de design'],
      [true,  'Guia de tipografia e cores'],
      [true,  'Grid responsivo'],
      [true,  '3 revisões incluídas'],
      [true,  'Entrega em 10 dias'],
      [false, 'Dark mode'],
      [false, 'Handoff para dev'],
    ]
  },
  {
    desc: 'Design System enterprise com 100+ componentes, dark mode, tokens avançados, handoff completo para dev e revisões ilimitadas.',
    features: [
      [true, '100+ componentes no Figma'],
      [true, 'Tokens de design avançados'],
      [true, 'Dark mode completo'],
      [true, 'Handoff para dev'],
      [true, 'Revisões ilimitadas'],
      [true, 'Entrega em 15 dias'],
      [true, 'Suporte pós-entrega (30 dias)'],
      [true, 'Treinamento da equipe (1h)'],
    ]
  }
];

function setPackage(el, idx) {
  document.querySelectorAll('.package-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const p = packages[idx];
  document.getElementById('pkgDesc').textContent = p.desc;
  document.getElementById('pkgFeatures').innerHTML = p.features.map(([ok, txt]) =>
    `<div class="pkg-feat"><span class="pkg-feat-check${ok ? '' : ' pkg-feat-x'}">${ok ? '✓' : '✗'}</span> ${txt}</div>`
  ).join('');
}

function setThumb(el, bg, emoji) {
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const main = document.getElementById('galleryMain');
  main.style.background = bg;
  main.querySelector('span').textContent = emoji;
}

function updateObs() {
  document.getElementById('obsCount').textContent = document.getElementById('obsInput').value.length;
}

function addToCart() {
  const btn = document.getElementById('cartBtn');
  btn.classList.add('added');
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Adicionado ao carrinho`;
  showToast('🛒 Serviço adicionado ao carrinho!');
}

function buyNow() { showToast('✓ Redirecionando para o pagamento...'); }

function toggleFaq(el) {
  const item = el.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

initNotifPanel();
