const API_BASE = 'http://localhost:8080';

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

function changeQty(delta) {
  const input = document.getElementById('qtyInput');
  input.value = Math.min(20, Math.max(1, (parseInt(input.value) || 1) + delta));
}

function clampQty(input) {
  const v = parseInt(input.value);
  if (isNaN(v) || v < 1) input.value = 1;
  else if (v > 20)       input.value = 20;
}

/* ── Auth header ─────────────────────────────────────────────────── */
function authHeader() {
  return { 'Authorization': OFAuth.getToken() };
}

/* ── Add to cart ─────────────────────────────────────────────────── */
async function addToCart() {
  if (!OFAuth.isLoggedIn()) {
    window.location.href = 'loginScreen.html';
    return;
  }

  const raw = localStorage.getItem('of_selected_work');
  if (!raw) { showToast('Erro: serviço não encontrado.'); return; }

  let work;
  try { work = JSON.parse(raw); } catch (e) { return; }

  const btn = document.getElementById('cartBtn');
  const origHTML = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Adicionando...';

  try {
    // 1. Salva informações do work no cache local
    const workCache = JSON.parse(localStorage.getItem('of_work_cache') || '{}');
    workCache[String(work.id)] = {
      id:        work.id,
      title:     work.title,
      price:     work.price,
      category:  work.category,
      ownerName: work.ownerName,
      ownerId:   work.ownerId
    };
    localStorage.setItem('of_work_cache', JSON.stringify(workCache));

    // 2. Snapshot do carrinho atual para identificar item novo após adição
    const prevRes = await fetch(`${API_BASE}/cart/show`, { headers: authHeader() });
    const prevData  = prevRes.ok ? await prevRes.json() : null;
    const prevItems = (prevData && prevData.cartItemList) ? prevData.cartItemList : [];
    const prevAmounts = {};
    prevItems.forEach(i => { prevAmounts[String(i.id)] = i.amount; });

    // 3. Chama API para adicionar ao carrinho
    const addRes = await fetch(`${API_BASE}/cart/addItem`, {
      method:  'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body:    JSON.stringify({ WorkId: work.id, amount: parseInt(document.getElementById('qtyInput').value) || 1 })
    });

    if (!addRes.ok) {
      const data = await addRes.json().catch(() => ({}));
      const msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(e => e.message).join(' • ')
        : 'Erro ao adicionar ao carrinho.';
      showToast(msg);
      btn.disabled = false;
      btn.innerHTML = origHTML;
      return;
    }

    const newItems = await addRes.json();

    // 4. Mapeia cartItemId → workId no localStorage
    const cartMap = JSON.parse(localStorage.getItem('of_cart_workmap') || '{}');

    const newItem = newItems.find(i => prevAmounts[String(i.id)] === undefined);
    if (newItem) {
      // work adicionado pela primeira vez — novo CartItem criado
      cartMap[String(newItem.id)] = String(work.id);
    } else {
      // work já estava no carrinho — quantidade incrementada
      const changed = newItems.find(i => i.amount !== prevAmounts[String(i.id)]);
      if (changed) cartMap[String(changed.id)] = String(work.id);
    }
    localStorage.setItem('of_cart_workmap', JSON.stringify(cartMap));

    // 5. Feedback visual
    btn.classList.add('added');
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Adicionado ao carrinho`;
    showToast('🛒 Serviço adicionado ao carrinho!');

  } catch (e) {
    console.error('addToCart:', e);
    showToast('Erro de conexão.');
    btn.disabled = false;
    btn.innerHTML = origHTML;
  }
}

function buyNow() { showToast('✓ Redirecionando para o pagamento...'); }

initNotifPanel();

let _currentWorkId = null;

async function toggleServiceFavorite() {
  if (!OFAuth.isLoggedIn()) { window.location.href = 'loginScreen.html'; return; }
  const btn = document.getElementById('favBtn');
  if (!_currentWorkId || !btn) return;
  const token = OFAuth.getToken();
  const isFav = btn.classList.contains('fav-active');
  if (isFav) {
    await fetch(`${API_BASE}/favorites/${_currentWorkId}`, { method: 'DELETE', headers: { Authorization: token } });
    btn.classList.remove('fav-active');
    btn.title = 'Adicionar aos favoritos';
  } else {
    await fetch(`${API_BASE}/favorites/${_currentWorkId}`, { method: 'POST', headers: { Authorization: token } });
    btn.classList.add('fav-active');
    btn.title = 'Remover dos favoritos';
  }
}

async function checkIfFavorited(workId) {
  if (!OFAuth.isLoggedIn()) return;
  try {
    const res = await fetch(`${API_BASE}/favorites/${workId}/check`, { headers: { Authorization: OFAuth.getToken() } });
    if (res.ok) {
      const data = await res.json();
      const btn = document.getElementById('favBtn');
      if (btn && data.favorited) { btn.classList.add('fav-active'); btn.title = 'Remover dos favoritos'; }
    }
  } catch (_) {}
}

(function loadSelectedWork() {
  const raw = localStorage.getItem('of_selected_work');
  if (!raw) return;
  try {
    const w = JSON.parse(raw);
    populateWork(w);
    _currentWorkId = w.id;
    checkIfFavorited(w.id);

    const reportBtn = document.getElementById('reportServiceBtn');
    if (reportBtn && OFAuth.isLoggedIn() && OFAuth.getType() !== 'freelancer') {
      reportBtn.style.display = '';
    }
    const titleEl = document.getElementById('reportModalWorkTitle');
    if (titleEl) titleEl.textContent = w.title || 'este serviço';
  } catch (e) {
    console.error('Erro ao carregar serviço:', e);
  }
})();

/* ── Denunciar serviço ───────────────────────────────────────────── */

const REPORT_NATURE_LABELS = {
  USER_BEHAVIOR:         'Comportamento de usuário',
  FRAUD:                 'Fraude',
  INAPPROPRIATE_CONTENT: 'Conteúdo inadequado',
  PAYMENT:               'Problema de pagamento',
  SERVICE:               'Problema com serviço',
  SECURITY:              'Segurança',
  OTHER:                 'Outro'
};

let srSelectedFiles = [];

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function populateReportNatureSelect() {
  const sel = document.getElementById('srNature');
  if (!sel || sel.options.length) return;
  Object.entries(REPORT_NATURE_LABELS).forEach(([value, label]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    sel.appendChild(opt);
  });
  sel.value = 'SERVICE';
}

function openReportModal() {
  if (!OFAuth.isLoggedIn()) { window.location.href = 'loginScreen.html'; return; }
  if (!_currentWorkId) return;

  populateReportNatureSelect();

  document.getElementById('srTitle').value = '';
  document.getElementById('srDesc').value  = '';
  ['srNatureWrap', 'srTitleWrap', 'srDescWrap'].forEach(id => document.getElementById(id).classList.remove('error'));
  ['srNatureErr', 'srTitleErr', 'srDescErr'].forEach(id => document.getElementById(id).classList.remove('show'));

  srSelectedFiles = [];
  renderSrAttachPreview();

  const feedback = document.getElementById('srFeedback');
  feedback.textContent = '';
  feedback.className   = 'form-feedback';

  const btn = document.getElementById('srSubmitBtn');
  btn.disabled    = false;
  btn.textContent = 'Registrar Denúncia';

  document.getElementById('reportModal').classList.add('show');
}

function closeReportModal() {
  document.getElementById('reportModal').classList.remove('show');
}

function renderSrAttachPreview() {
  const preview = document.getElementById('srAttachPreview');
  preview.innerHTML = srSelectedFiles.map((f, i) =>
    `<div class="attach-chip">
       <span style="overflow:hidden;text-overflow:ellipsis">${escHtml(f.name)}</span>
       <span class="attach-chip-remove" data-idx="${i}">×</span>
     </div>`
  ).join('');

  preview.querySelectorAll('[data-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      srSelectedFiles.splice(Number(btn.dataset.idx), 1);
      renderSrAttachPreview();
    });
  });
}

document.getElementById('srFiles').addEventListener('change', function () {
  Array.from(this.files).forEach(f => {
    if (srSelectedFiles.find(s => s.name === f.name && s.size === f.size)) return;
    srSelectedFiles.push(f);
  });
  this.value = '';
  renderSrAttachPreview();
});

document.getElementById('reportModal').addEventListener('click', function (e) {
  if (e.target === this) closeReportModal();
});

async function submitServiceReport() {
  const nature = document.getElementById('srNature').value.trim();
  const title  = document.getElementById('srTitle').value.trim();
  const desc   = document.getElementById('srDesc').value.trim();

  let valid = true;
  function setErr(wrapId, errId, show) {
    document.getElementById(wrapId).classList.toggle('error', show);
    document.getElementById(errId).classList.toggle('show', show);
    if (show) valid = false;
  }
  setErr('srNatureWrap', 'srNatureErr', !nature);
  setErr('srTitleWrap',  'srTitleErr',  title.length < 5);
  setErr('srDescWrap',   'srDescErr',   desc.length < 20);
  if (!valid) return;

  const btn      = document.getElementById('srSubmitBtn');
  const feedback = document.getElementById('srFeedback');
  btn.disabled    = true;
  btn.textContent = 'Enviando...';
  feedback.textContent = '';
  feedback.className   = 'form-feedback';

  try {
    const dto  = { nature, title, description: desc, workId: _currentWorkId };
    const blob = new Blob([JSON.stringify(dto)], { type: 'application/json' });
    const form = new FormData();
    form.append('report', blob);
    srSelectedFiles.forEach(f => form.append('attachments', f));

    const res = await fetch(`${API_BASE}/reports/register`, {
      method:  'POST',
      headers: { Authorization: OFAuth.getToken() },
      body:    form
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(e => e.message).join(' | ')
        : 'Erro ao registrar denúncia.';
      feedback.textContent = msg;
      feedback.className   = 'form-feedback error';
      btn.disabled    = false;
      btn.textContent = 'Registrar Denúncia';
      return;
    }

    feedback.textContent = '✓ Denúncia registrada. Você pode acompanhar o andamento no seu perfil.';
    feedback.className   = 'form-feedback success';
    btn.textContent = 'Enviada ✓';
    showToast('Denúncia registrada!');

  } catch (e) {
    feedback.textContent = 'Erro de conexão. Verifique sua internet.';
    feedback.className   = 'form-feedback error';
    btn.disabled    = false;
    btn.textContent = 'Registrar Denúncia';
  }
}
