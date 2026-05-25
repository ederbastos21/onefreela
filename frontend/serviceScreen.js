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
  'linear-gradient(135deg,#0d1f1f,#0d3030)',
  'linear-gradient(135deg,#1a0d1a,#2a0d2a)',
];
const COLORS = ['#7fff00','#b0ff4e','#a3e635','#5bbd00','#84cc16','#65a30d','#4d7c0f'];

function workGradient(id)  { return GRADIENTS[Number(id) % GRADIENTS.length]; }
function workColor(id)     { return COLORS[Number(id) % COLORS.length]; }

function catEmoji(cat) {
  if (!cat) return '🛠️';
  const c = cat.toLowerCase();
  if (c.includes('design') || c.includes('arte') || c.includes('figma')) return '🎨';
  if (c.includes('dev') || c.includes('programa') || c.includes('web') || c.includes('front') || c.includes('back') || c.includes('react') || c.includes('flutter')) return '💻';
  if (c.includes('market') || c.includes('redes') || c.includes('social') || c.includes('instagram') || c.includes('tiktok')) return '📱';
  if (c.includes('redaç') || c.includes('texto') || c.includes('copy') || c.includes('conteú')) return '✍️';
  if (c.includes('vídeo') || c.includes('video') || c.includes('anim') || c.includes('motion') || c.includes('youtube')) return '🎬';
  if (c.includes('dados') || c.includes('data') || c.includes(' bi') || c.includes('anali')) return '📊';
  if (c.includes(' ia') || c.includes('intelig') || c.includes('machine') || c.includes(' ml') || c.includes('llm')) return '🤖';
  if (c.includes('foto') || c.includes('photo')) return '📷';
  if (c.includes('mús') || c.includes('audio') || c.includes('áudio') || c.includes('som')) return '🎵';
  return '🛠️';
}

function getInitials(name) {
  if (!name || !name.trim()) return '?';
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function formatPrice(price) {
  if (price == null) return '—';
  const n = Number(price);
  return 'R$ ' + (Number.isInteger(n) ? n : n.toFixed(2).replace('.', ','));
}

function populateWork(w) {
  const bg    = workGradient(w.id);
  const color = workColor(w.ownerId || w.id);
  const ini   = getInitials(w.ownerName);
  const emoji = catEmoji(w.category);
  const name  = w.ownerName || 'Freelancer';

  document.getElementById('serviceTitle').textContent    = w.title || '';
  document.getElementById('breadcrumbTitle').textContent = w.title || '';
  document.getElementById('serviceCat').textContent      = w.category || '';
  document.getElementById('breadcrumbCat').textContent   = w.category || 'Explorar';

  document.getElementById('galleryMain').style.background = bg;
  document.getElementById('galleryEmoji').textContent     = emoji;

  document.getElementById('serviceOwnerAvatar').textContent      = ini;
  document.getElementById('serviceOwnerAvatar').style.background = color;
  document.getElementById('serviceOwnerName').textContent        = name;
  document.getElementById('serviceOwnerRole').textContent        = w.category || '';
  document.getElementById('serviceProfileLink').href             = `freelancerProfile.html?userId=${w.ownerId}`;

  document.getElementById('serviceDesc').innerHTML =
    w.description ? `<p>${w.description.replace(/\n/g, '</p><p>')}</p>` : '';

  document.getElementById('servicePrice').textContent = formatPrice(w.price);

  document.title = `OneFreela — ${w.title || 'Serviço'}`;
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

initNotifPanel();

(function loadSelectedWork() {
  const raw = localStorage.getItem('of_selected_work');
  if (!raw) return;
  try {
    populateWork(JSON.parse(raw));
  } catch (e) {
    console.error('Erro ao carregar serviço:', e);
  }
})();
