const API_BASE = 'http://localhost:8080';

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

let liked    = new Set();
let state    = { cat: '', minPrice: 0, maxPrice: 10000 };
let openDd   = null;
let allWorks = [];
const workMap = {};

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

function workGradient(id)   { return GRADIENTS[Number(id) % GRADIENTS.length]; }
function workColor(id)      { return COLORS[Number(id) % COLORS.length]; }

function getInitials(name) {
  if (!name || !name.trim()) return '?';
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function formatPrice(price) {
  if (price == null) return '—';
  const n = Number(price);
  return 'R$' + (Number.isInteger(n) ? n : n.toFixed(2).replace('.', ','));
}

function setLoading(on) {
  const grid = document.getElementById('flGrid');
  if (on) {
    grid.innerHTML = '<div class="explore-loading">Carregando serviços...</div>';
    document.getElementById('flList').innerHTML = '';
  }
}

async function fetchWorks() {
  const params = new URLSearchParams();
  const q = document.getElementById('navSearch').value.trim();
  if (q)                      params.set('q', q);
  if (state.cat)              params.set('category', state.cat);
  if (state.minPrice > 0)     params.set('minPrice', state.minPrice);
  if (state.maxPrice < 10000) params.set('maxPrice', state.maxPrice);

  try {
    const res = await fetch(`${API_BASE}/works/search?${params}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.error('Erro ao buscar serviços:', e);
    document.getElementById('flGrid').innerHTML =
      '<div class="explore-error">Erro ao carregar serviços. Verifique se o servidor está ativo.</div>';
    return [];
  }
}

function buildCategoryDD(works) {
  const cats = [...new Set(works.map(w => w.category).filter(Boolean))].sort();
  const opts = document.querySelector('#ddCat .dd-options');
  opts.innerHTML = `<div class="dd-opt active" data-cat="" onclick="pickCat(this)"><span>🔥 Todos</span><span class="dd-count">${works.length}</span></div>`;
  cats.forEach(cat => {
    const count = works.filter(w => w.category === cat).length;
    const div = document.createElement('div');
    div.className = 'dd-opt';
    div.dataset.cat = cat;
    div.setAttribute('onclick', 'pickCat(this)');
    div.innerHTML = `<span>${catEmoji(cat)} ${cat}</span><span class="dd-count">${count}</span>`;
    opts.appendChild(div);
  });
}

function render(data) {
  const grid  = document.getElementById('flGrid');
  const list  = document.getElementById('flList');
  const empty = document.getElementById('emptyState');
  const pag   = document.getElementById('pagination');
  grid.innerHTML = ''; list.innerHTML = '';
  document.getElementById('resultCount').textContent = data.length;

  if (!data.length) { empty.classList.add('show'); pag.classList.add('hidden'); return; }
  empty.classList.remove('show'); pag.classList.remove('hidden');

  data.forEach((w, i) => {
    workMap[w.id] = w;

    const bg     = workGradient(w.id);
    const color  = workColor(w.ownerId || w.id);
    const ini    = getInitials(w.ownerName);
    const emoji  = catEmoji(w.category);
    const tag    = w.category ? `<span class="fl-tag">${w.category}</span>` : '';
    const lk     = liked.has(w.id);
    const name   = w.ownerName || 'Freelancer';
    const price  = formatPrice(w.price);
    const desc   = truncate(w.description, 85);

    const gc = document.createElement('div');
    gc.className = 'fl-card';
    gc.style.animationDelay = (i * 40) + 'ms';
    gc.style.cursor = 'pointer';
    gc.addEventListener('click', () => openWork(w));
    gc.innerHTML = `
      <div class="fl-banner" style="background:${bg}">
        <span style="position:relative;z-index:1">${emoji}</span>
        <div class="fl-banner-overlay"></div>
        <button class="fl-heart${lk ? ' liked' : ''}" data-wid="${w.id}" onclick="toggleLike(event,${w.id},this)">♥</button>
      </div>
      <div class="fl-card-body">
        <div class="fl-mini-profile">
          <div class="fl-mini-avatar" style="background:${color}">${ini}</div>
          <span class="fl-mini-name">${name}</span>
        </div>
        <div class="fl-ad-title">${w.title}</div>
        <div class="fl-work-desc">${desc}</div>
        <div class="fl-tags">${tag}</div>
        <div class="fl-footer">
          <div class="fl-price">${price}</div>
        </div>
      </div>`;
    grid.appendChild(gc);

    const lc = document.createElement('div');
    lc.className = 'fl-list-card';
    lc.style.animationDelay = (i * 30) + 'ms';
    lc.style.cursor = 'pointer';
    lc.addEventListener('click', () => openWork(w));
    lc.innerHTML = `
      <div class="fl-list-thumb" style="background:${bg}">${emoji}</div>
      <div class="fl-list-body">
        <div class="fl-list-ad-title">${w.title}</div>
        <div class="fl-list-mini">
          <div class="fl-list-mini-avatar" style="background:${color}">${ini}</div>
          <span class="fl-list-mini-name">${name}</span>
          <span class="avail-dot" style="background:#22c55e;margin-left:4px"></span>
        </div>
        <div class="fl-work-desc" style="margin-bottom:6px">${desc}</div>
        <div class="fl-list-tags">${tag}</div>
      </div>
      <div class="fl-list-price-col">
        <div class="fl-list-price">${price}</div>
        <button class="fl-list-heart${lk ? ' liked' : ''}" data-wid="${w.id}" onclick="toggleLike(event,${w.id},this)">♥</button>
      </div>`;
    list.appendChild(lc);
  });
}

async function applyFilters() {
  setLoading(true);
  let works = await fetchWorks();
  const sort = document.getElementById('sortSelect').value;
  if (sort === 'preco-asc')  works.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === 'preco-desc') works.sort((a, b) => Number(b.price) - Number(a.price));
  render(works);
}

function setView(v) {
  const grid = document.getElementById('flGrid');
  const list = document.getElementById('flList');
  if (v === 'grid') {
    grid.classList.remove('hidden'); list.classList.add('hidden');
    document.getElementById('btnGrid').classList.add('active');
    document.getElementById('btnList').classList.remove('active');
  } else {
    grid.classList.add('hidden'); list.classList.remove('hidden');
    document.getElementById('btnGrid').classList.remove('active');
    document.getElementById('btnList').classList.add('active');
  }
}

async function toggleLike(e, id, btn) {
  e.stopPropagation();
  if (!OFAuth.isLoggedIn()) return;
  const token = OFAuth.getToken();
  if (liked.has(id)) {
    await fetch(`${API_BASE}/favorites/${id}`, { method: 'DELETE', headers: { Authorization: token } });
    liked.delete(id);
    btn.classList.remove('liked');
    document.querySelectorAll(`.fl-heart[data-wid="${id}"], .fl-list-heart[data-wid="${id}"]`).forEach(b => b.classList.remove('liked'));
  } else {
    await fetch(`${API_BASE}/favorites/${id}`, { method: 'POST', headers: { Authorization: token } });
    liked.add(id);
    btn.classList.add('liked');
    document.querySelectorAll(`.fl-heart[data-wid="${id}"], .fl-list-heart[data-wid="${id}"]`).forEach(b => b.classList.add('liked'));
  }
}

function openDropdown(pillId, ddId) {
  const pill = document.getElementById(pillId);
  const dd   = document.getElementById(ddId);
  const rect = pill.getBoundingClientRect();
  dd.style.top  = (rect.bottom + 8) + 'px';
  dd.style.left = rect.left + 'px';
  dd.classList.add('open');
  pill.classList.add('open');
  openDd = { pillId, ddId };
}

function closeAllDd() {
  document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.fpill').forEach(p => p.classList.remove('open'));
  openDd = null;
}

document.querySelectorAll('.fpill').forEach(pill => {
  pill.addEventListener('click', e => {
    e.stopPropagation();
    const ddId  = pill.dataset.dd;
    const isOpen = document.getElementById(ddId).classList.contains('open');
    closeAllDd();
    if (!isOpen) openDropdown(pill.id, ddId);
  });
});

document.querySelectorAll('.filter-dropdown').forEach(dd => {
  dd.addEventListener('click', e => e.stopPropagation());
});

document.addEventListener('click', closeAllDd);

function tryChat(e, workId) {
  e.stopPropagation();
  const w     = workMap[workId] || {};
  const name  = w.ownerName || 'Freelancer';
  const ini   = getInitials(name);
  const color = workColor(w.ownerId || w.id || 0);
  const role  = w.title || '';
  const type  = localStorage.getItem('of_user_type');
  if (type === 'cliente' || type === 'freelancer') {
    window.location.href = 'chatScreen.html';
  } else {
    openAuthModal(name, ini, color, role);
  }
}

function openAuthModal(name, initials, color, role) {
  document.getElementById('modalFreelancerName').textContent = name.split(' ')[0].toUpperCase();
  document.getElementById('modalAvatar').textContent         = initials;
  document.getElementById('modalAvatar').style.background    = color;
  document.getElementById('modalName').textContent           = name;
  document.getElementById('modalRole').textContent           = role;
  document.getElementById('authOverlay').classList.add('show');
}

function closeAuthModal() {
  document.getElementById('authOverlay').classList.remove('show');
}

function goToLogin() {
  window.location.href = 'loginScreen.html';
}

document.getElementById('authOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeAuthModal();
});

function pickCat(el) {
  document.querySelectorAll('#ddCat .dd-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  state.cat = el.dataset.cat || '';
  document.getElementById('pillCatLabel').textContent = state.cat
    ? el.querySelector('span').textContent.trim()
    : 'Categoria';
  document.getElementById('pillCat').classList.toggle('active', !!state.cat);
  closeAllDd(); applyFilters();
}

function syncMax() {
  const v = document.getElementById('priceSlider').value;
  document.getElementById('priceMax').value = v;
  document.getElementById('rangeVal').textContent = `Até R$ ${v}`;
}

function syncSlider() {
  const v = document.getElementById('priceMax').value;
  document.getElementById('priceSlider').value = v;
  document.getElementById('rangeVal').textContent = `Até R$ ${v}`;
}

function applyPrice() {
  state.minPrice = parseInt(document.getElementById('priceMin').value) || 0;
  state.maxPrice = parseInt(document.getElementById('priceMax').value) || 10000;
  const hasMin = state.minPrice > 0;
  const hasMax = state.maxPrice < 10000;
  let label = 'Preço';
  if (hasMin && hasMax) label = `R$${state.minPrice} — R$${state.maxPrice}`;
  else if (hasMax)      label = `Até R$${state.maxPrice}`;
  else if (hasMin)      label = `A partir de R$${state.minPrice}`;
  document.getElementById('pillPrecoLabel').textContent = label;
  document.getElementById('pillPreco').classList.toggle('active', hasMin || hasMax);
  closeAllDd(); applyFilters();
}

document.querySelectorAll('.page-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

function openWork(w) {
  localStorage.setItem('of_selected_work', JSON.stringify(w));
  window.location.href = 'serviceScreen.html';
}

async function loadLiked() {
  if (!OFAuth.isLoggedIn()) return;
  try {
    const res = await fetch(`${API_BASE}/favorites`, { headers: { Authorization: OFAuth.getToken() } });
    if (res.ok) {
      const favs = await res.json();
      liked = new Set(favs.map(f => f.work.id));
    }
  } catch (_) {}
}

async function init() {
  setLoading(true);
  await loadLiked();
  allWorks = await fetchWorks();
  buildCategoryDD(allWorks);
  render(allWorks);
  OFAuth.loadNav();
  initNotifPanel();
}

init();
