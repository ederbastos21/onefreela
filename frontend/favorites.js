const API_BASE = 'http://localhost:8080';

OFAuth.requireLogin();
OFAuth.loadNav();

const GRADIENTS = [
  'linear-gradient(135deg,#0d1f0d,#1a3a1a)',
  'linear-gradient(135deg,#0d0d1f,#1a1a3a)',
  'linear-gradient(135deg,#1f1a0d,#3a2e0d)',
  'linear-gradient(135deg,#1f0d1f,#3a1a3a)',
  'linear-gradient(135deg,#1f0d0d,#3a1a1a)',
  'linear-gradient(135deg,#0d1a1f,#0d2a2a)',
  'linear-gradient(135deg,#0d0d1a,#1a1a2a)',
  'linear-gradient(135deg,#1a1a0d,#2a2a0d)',
  'linear-gradient(135deg,#0d1a0d,#1a2a1a)',
  'linear-gradient(135deg,#1a0d0d,#2a1a1a)',
];
const COLORS = ['#7fff00','#b0ff4e','#a3e635','#5bbd00','#84cc16','#65a30d','#4d7c0f'];

function workGradient(id) { return GRADIENTS[Number(id) % GRADIENTS.length]; }
function workColor(id)    { return COLORS[Number(id) % COLORS.length]; }

function getInitials(name) {
  if (!name || !name.trim()) return '?';
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function catEmoji(cat) {
  if (!cat) return '🛠️';
  const c = cat.toLowerCase();
  if (c.includes('design') || c.includes('arte') || c.includes('figma')) return '🎨';
  if (c.includes('dev') || c.includes('programa') || c.includes('web') || c.includes('front') || c.includes('back')) return '💻';
  if (c.includes('market') || c.includes('redes') || c.includes('social')) return '📱';
  if (c.includes('redaç') || c.includes('texto') || c.includes('copy')) return '✍️';
  if (c.includes('vídeo') || c.includes('video') || c.includes('anim')) return '🎬';
  if (c.includes('dados') || c.includes('data')) return '📊';
  return '🛠️';
}

function formatPrice(price) {
  if (price == null) return '—';
  const n = Number(price);
  return 'R$ ' + (Number.isInteger(n) ? n : n.toFixed(2).replace('.', ','));
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

async function removeFavorite(workId, cardEl) {
  await fetch(`${API_BASE}/favorites/${workId}`, {
    method: 'DELETE',
    headers: { Authorization: OFAuth.getToken() }
  });
  cardEl.style.opacity = '0';
  cardEl.style.transform = 'scale(0.95)';
  setTimeout(() => {
    cardEl.remove();
    const grid = document.getElementById('favGrid');
    if (!grid.children.length) showEmpty();
  }, 250);
  showToast('Removido dos favoritos');
}

function openWork(w) {
  localStorage.setItem('of_selected_work', JSON.stringify(w));
  window.location.href = 'serviceScreen.html';
}

function showEmpty() {
  document.getElementById('emptyState').style.display = 'flex';
  document.getElementById('emptyState').style.flexDirection = 'column';
  document.getElementById('emptyState').style.alignItems = 'center';
}

function render(favorites) {
  const grid = document.getElementById('favGrid');
  grid.innerHTML = '';

  if (!favorites.length) { showEmpty(); return; }

  favorites.forEach((fav, i) => {
    const w     = fav.work;
    const bg    = workGradient(w.id);
    const color = workColor(w.ownerId || w.id);
    const ini   = getInitials(w.ownerName);
    const emoji = catEmoji(w.category);
    const badge = w.category ? `<span class="fl-banner-badge">${w.category}</span>` : '';
    const name  = w.ownerName || 'Freelancer';
    const price = formatPrice(w.price);
    const desc  = truncate(w.description, 85);

    const card = document.createElement('div');
    card.className = 'fl-card';
    card.style.animationDelay = (i * 40) + 'ms';
    card.style.cursor = 'pointer';
    card.style.transition = 'opacity .25s, transform .25s';
    card.addEventListener('click', () => openWork(w));
    card.innerHTML = `
      <div class="fl-banner" style="background:${bg}">
        <span style="position:relative;z-index:1">${emoji}</span>
        <div class="fl-banner-overlay"></div>
        ${badge}
        <button class="fl-heart liked" title="Remover dos favoritos" onclick="removeFavorite(${w.id}, this.closest('.fl-card'));event.stopPropagation()">♥</button>
      </div>
      <div class="fl-card-body">
        <div class="fl-ad-title">${w.title}</div>
        <div class="fl-work-desc">${desc}</div>
        <div class="fl-footer">
          <div class="fl-mini-profile">
            <div class="fl-mini-avatar" style="background:${color}">${ini}</div>
            <span class="fl-mini-name">${name}</span>
          </div>
          <div class="fl-price">${price}</div>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

async function init() {
  try {
    const res = await fetch(`${API_BASE}/favorites`, {
      headers: { Authorization: OFAuth.getToken() }
    });
    if (!res.ok) throw new Error();
    render(await res.json());
  } catch (_) {
    showToast('Erro ao carregar favoritos.');
  }
  initNotifPanel();
}

init();
