const API_BASE = 'http://localhost:8080';

let works         = [];
let editingWorkId  = null;
let ordersData     = [];
let payingOrderIdx = -1;

var freelancerOrdersData = [];
var loadedSections = {};

var PAGE_SIZE              = 10;
var worksPage              = 1;
var ordersPage             = 1;
var flOrdersPage           = 1;
var reportsPage            = 1;
var disputasRecebidasPage  = 1;
var minhasDisputasPage     = 1;

var PROFILE_SECTIONS = ['servicos', 'pedidosAtivos', 'pedidos', 'denuncias', 'configGroup', 'disputasRecebidas', 'minhasDisputas'];

function switchSection(id) {
  PROFILE_SECTIONS.forEach(function (s) {
    var el = document.getElementById(s);
    if (el) el.style.display = 'none';
  });

  var target = document.getElementById(id);
  if (target) target.style.display = '';

  document.querySelectorAll('.nav-item[data-section]').forEach(function (el) {
    el.classList.remove('active');
  });
  document.querySelectorAll('.nav-item[data-section="' + id + '"]').forEach(function (el) {
    el.classList.add('active');
  });

  if (!loadedSections[id]) {
    loadedSections[id] = true;
    if (id === 'pedidos')       loadOrders();
    if (id === 'servicos')      loadWorks();
    if (id === 'pedidosAtivos') loadFreelancerOrders();
    if (id === 'denuncias')     { buildReportsFilterButtons(); loadMyReports(); }
    if (id === 'disputasRecebidas') {
      if (!loadedSections['pedidosAtivos']) {
        loadedSections['pedidosAtivos'] = true;
        loadFreelancerOrders();
      } else {
        renderDisputasRecebidas();
      }
    }
    if (id === 'minhasDisputas') {
      if (!loadedSections['pedidos']) {
        loadedSections['pedidos'] = true;
        loadOrders();
      } else {
        renderMinhasDisputas();
      }
    }
  }
}

function renderPagination(containerId, total, currentPage, setterName) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  var start = (currentPage - 1) * PAGE_SIZE + 1;
  var end   = Math.min(currentPage * PAGE_SIZE, total);

  var base   = 'border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:6px;padding:5px 11px;cursor:pointer;font-size:13px;transition:background .15s';
  var active = 'border:1px solid var(--green);background:var(--green);color:#000;border-radius:6px;padding:5px 11px;cursor:pointer;font-size:13px;font-weight:700';

  var html = '<div style="display:flex;align-items:center;gap:6px;padding:18px 0 4px;justify-content:center;flex-wrap:wrap">';
  html += '<span style="font-size:12px;color:var(--muted2);margin-right:6px">' + start + '–' + end + ' de ' + total + '</span>';

  if (currentPage > 1) {
    html += '<button style="' + base + '" onclick="' + setterName + '(' + (currentPage - 1) + ')">‹</button>';
  }

  var from = Math.max(1, currentPage - 2);
  var to   = Math.min(totalPages, currentPage + 2);
  for (var p = from; p <= to; p++) {
    html += '<button style="' + (p === currentPage ? active : base) + '" onclick="' + setterName + '(' + p + ')">' + p + '</button>';
  }

  if (currentPage < totalPages) {
    html += '<button style="' + base + '" onclick="' + setterName + '(' + (currentPage + 1) + ')">›</button>';
  }

  html += '</div>';
  el.innerHTML = html;
}

function setWorksPage(p)             { worksPage             = p; renderWorks(); }
function setOrdersPage(p)            { ordersPage            = p; renderOrders(ordersData); }
function setFlOrdersPage(p)          { flOrdersPage          = p; renderFreelancerOrders(freelancerOrdersData); }
function setReportsPage(p)           { reportsPage           = p; renderMyReports(); }
function setDisputasRecebidasPage(p) { disputasRecebidasPage = p; renderDisputasRecebidas(); }
function setMinhasDisputasPage(p)    { minhasDisputasPage    = p; renderMinhasDisputas(); }

function authHeader() {
  return { 'Authorization': OFAuth.getToken() };
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = '';
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function initProfile() {
  if (!OFAuth.requireLogin()) return;

  const isFreelancer = OFAuth.getType() === 'freelancer';
  const isAdmin      = OFAuth.isAdmin();

  // Profile hero
  var typeLabel = isAdmin ? '✦ Administrador' : (isFreelancer ? '✦ Freelancer' : '✦ Cliente');
  document.getElementById('profileType').textContent = typeLabel;
  document.getElementById('editProfileLink').href    = isFreelancer ? 'freelancerEditProfile.html' : 'clientEditProfile.html';

  const homeUrl     = isFreelancer ? 'exploreFreelancers.html' : 'index.html';
  const sidebarHome = document.getElementById('sidebarHome');
  if (sidebarHome) sidebarHome.href = homeUrl;

  // Sidebar visibility by role
  if (isFreelancer) {
    show('sidebarServicos');
    show('sidebarPedidosAtivos');
    show('sidebarDisputasRecebidas');
    show('sidebarPedidos');
    show('sidebarMinhasDisputas');
    show('sidebarDenuncias');
    hide('sidebarExplorar');
    hide('sidebarFavoritos');
  } else {
    hide('sidebarServicos');
    hide('sidebarPedidosAtivos');
    hide('sidebarDisputasRecebidas');
    show('sidebarPedidos');
    hide('sidebarMinhasDisputas');
    show('sidebarDenuncias');
    show('sidebarExplorar');
    show('sidebarFavoritos');
  }

  // Set section titles for freelancer pedidos
  if (isFreelancer) {
    var recTitle = document.querySelector('#pedidosAtivos .block-title');
    if (recTitle) {
      recTitle.style.fontSize = '22px';
      recTitle.innerHTML =
        'Pedidos Recebidos' +
        '<div style="font-size:14px;font-weight:400;color:var(--muted2);margin-top:4px">Serviços comprados pelos clientes de você</div>';
    }
    var myTitle = document.querySelector('#pedidos .block-title');
    if (myTitle) {
      myTitle.style.fontSize = '22px';
      myTitle.innerHTML =
        'Meus Pedidos' +
        '<div style="font-size:14px;font-weight:400;color:var(--muted2);margin-top:4px">Serviços que você comprou de outros freelancers</div>';
    }
  }

  // Client-only settings fields
  document.querySelectorAll('.client-only').forEach(function (el) {
    el.style.display = isFreelancer ? 'none' : '';
  });

  var chatLink = document.getElementById('navChatLink');
  if (chatLink) chatLink.href = 'chatScreen.html';

  // Start on settings section (lazy-loads other sections on demand)
  switchSection('configGroup');
}

/* ── Freelancer: works ────────────────────────────────────────────── */

function catEmoji(cat) {
  if (!cat) return '🛠️';
  const c = cat.toLowerCase();
  if (c.includes('design') || c.includes('arte') || c.includes('figma'))                          return '🎨';
  if (c.includes('dev') || c.includes('programa') || c.includes('web') ||
      c.includes('front') || c.includes('back') || c.includes('react') || c.includes('flutter'))  return '💻';
  if (c.includes('market') || c.includes('redes') || c.includes('social'))                        return '📱';
  if (c.includes('redaç') || c.includes('texto') || c.includes('copy') || c.includes('conteú'))   return '✍️';
  if (c.includes('vídeo') || c.includes('video') || c.includes('anim') || c.includes('motion'))   return '🎬';
  if (c.includes('dados') || c.includes('data') || c.includes(' bi') || c.includes('anali'))      return '📊';
  if (c.includes(' ia') || c.includes('intelig') || c.includes('machine') || c.includes(' ml'))   return '🤖';
  if (c.includes('foto') || c.includes('photo'))                                                   return '📷';
  return '🛠️';
}

function formatPrice(price) {
  if (price == null) return '—';
  const n = Number(price);
  return 'R$' + (Number.isInteger(n) ? n : n.toFixed(2).replace('.', ','));
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

async function loadWorks() {
  const list = document.getElementById('servicesList');
  list.innerHTML = '<p class="works-loading">Carregando serviços...</p>';

  try {
    const res = await fetch(`${API_BASE}/works/myWorks`, { headers: authHeader() });

    if (res.status === 401 || res.status === 403) {
      OFAuth.logout();
      return;
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    works = await res.json();
    renderWorks();
  } catch (e) {
    console.error('loadWorks:', e);
    list.innerHTML = '<p class="works-error">Erro ao carregar serviços. Verifique se o servidor está ativo.</p>';
  }
}

function renderWorks() {
  const list = document.getElementById('servicesList');
  list.innerHTML = '';

  const badge = document.getElementById('worksBadge');
  if (badge) {
    badge.textContent = works.length;
    badge.style.display = works.length > 0 ? '' : 'none';
  }

  const STATUS_LABELS = { ACTIVE: 'Ativo', INACTIVE: 'Pausado', PENDING_REVIEW: 'Em análise', REJECTED: 'Rejeitado' };

  var start    = (worksPage - 1) * PAGE_SIZE;
  var pageItems = works.slice(start, start + PAGE_SIZE);

  pageItems.forEach(function (w) {
    const isActive    = w.status === 'ACTIVE';
    const canTogglePause = w.status === 'ACTIVE' || w.status === 'INACTIVE';
    const pauseLabel  = isActive ? 'Pausar' : 'Reativar';
    const card = document.createElement('div');
    card.className = 'service-card';
    card.innerHTML = `
      <div class="service-icon">${catEmoji(w.category)}</div>
      <div class="service-info">
        <div class="service-name">${w.title}</div>
        <div class="service-desc">${truncate(w.description, 85)}</div>
        ${w.category ? `<div class="service-cat-tag">${w.category}</div>` : ''}
      </div>
      <div class="service-right">
        <span class="service-status ${isActive ? 'status-active' : 'status-paused'}">${STATUS_LABELS[w.status] || w.status}</span>
        <div class="service-price">${formatPrice(w.price)}</div>
        <div class="service-actions">
          <button class="btn-sm" onclick="openWorkModal(${w.id})">Editar</button>
          ${canTogglePause ? `<button class="btn-sm" onclick="toggleWorkPause(${w.id})">${pauseLabel}</button>` : ''}
          ${canTogglePause ? `<button class="btn-sm btn-sm-danger" onclick="confirmBlockWork(${w.id})">Bloquear</button>` : ''}
          <button class="btn-sm btn-sm-danger" onclick="confirmDeleteWork(${w.id})">Excluir</button>
        </div>
      </div>`;
    list.appendChild(card);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'btn-add-service';
  addBtn.innerHTML = '+ Adicionar novo serviço';
  addBtn.addEventListener('click', function () { openWorkModal(null); });
  list.appendChild(addBtn);

  renderPagination('worksPagination', works.length, worksPage, 'setWorksPage');
}

function openWorkModal(workId) {
  editingWorkId = workId;

  document.getElementById('wfTitle').value       = '';
  document.getElementById('wfCategory').value    = '';
  document.getElementById('wfPrice').value       = '';
  document.getElementById('wfDescription').value = '';
  clearFormMsg();

  if (workId !== null) {
    const w = works.find(function (x) { return x.id === workId; });
    if (w) {
      document.getElementById('wfTitle').value       = w.title       || '';
      document.getElementById('wfCategory').value    = w.category    || '';
      document.getElementById('wfPrice').value       = w.price != null ? Number(w.price) : '';
      document.getElementById('wfDescription').value = w.description || '';
    }
    document.getElementById('workModalTitle').textContent = 'EDITAR SERVIÇO';
    document.getElementById('wfSubmitBtn').textContent    = 'SALVAR ALTERAÇÕES';
  } else {
    document.getElementById('workModalTitle').textContent = 'NOVO SERVIÇO';
    document.getElementById('wfSubmitBtn').textContent    = 'CADASTRAR SERVIÇO';
  }

  document.getElementById('workModal').classList.add('show');
}

function closeWorkModal() {
  document.getElementById('workModal').classList.remove('show');
  editingWorkId = null;
}

function showFormMsg(msg, type) {
  const el = document.getElementById('wfMsg');
  el.textContent = msg;
  el.className = 'wf-msg wf-msg-' + type;
}

function clearFormMsg() {
  const el = document.getElementById('wfMsg');
  el.textContent = '';
  el.className = 'wf-msg';
}

async function submitWork() {
  const title       = document.getElementById('wfTitle').value.trim();
  const category    = document.getElementById('wfCategory').value.trim();
  const priceRaw    = document.getElementById('wfPrice').value.trim();
  const description = document.getElementById('wfDescription').value.trim();

  if (!title || !category || !priceRaw || !description) {
    showFormMsg('Preencha todos os campos.', 'error');
    return;
  }

  const price = parseFloat(priceRaw);
  if (isNaN(price) || price < 0) {
    showFormMsg('Preço inválido.', 'error');
    return;
  }

  const btn    = document.getElementById('wfSubmitBtn');
  const isEdit = editingWorkId !== null;
  btn.disabled = true;
  btn.textContent = 'SALVANDO...';

  const url    = isEdit
    ? `${API_BASE}/works/updateWork/${editingWorkId}`
    : `${API_BASE}/works/register`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category, price })
    });

    if (!res.ok) {
      const data = await res.json().catch(function () { return {}; });
      const msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao salvar serviço.';
      showFormMsg(msg, 'error');
      return;
    }

    closeWorkModal();
    await loadWorks();
  } catch (e) {
    showFormMsg('Erro de conexão.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = isEdit ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR SERVIÇO';
  }
}

async function toggleWorkPause(workId) {
  try {
    const res = await fetch(`${API_BASE}/works/${workId}/pause`, {
      method: 'POST',
      headers: authHeader()
    });

    if (!res.ok) {
      const data = await res.json().catch(function () { return {}; });
      const msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao alterar status do serviço.';
      alert(msg);
      return;
    }

    await loadWorks();
  } catch (e) {
    alert('Erro de conexão.');
  }
}

async function confirmBlockWork(workId) {
  const w    = works.find(function (x) { return x.id === workId; });
  const name = w ? `"${w.title}"` : 'este serviço';
  if (!confirm(`Bloquear ${name}? Ele vai desaparecer da sua lista de serviços e só um administrador poderá reverter isso.`)) return;

  try {
    const res = await fetch(`${API_BASE}/works/${workId}/block`, {
      method: 'POST',
      headers: authHeader()
    });

    if (!res.ok) {
      const data = await res.json().catch(function () { return {}; });
      const msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao bloquear serviço.';
      alert(msg);
      return;
    }

    await loadWorks();
  } catch (e) {
    alert('Erro de conexão.');
  }
}

async function confirmDeleteWork(workId) {
  const w    = works.find(function (x) { return x.id === workId; });
  const name = w ? `"${w.title}"` : 'este serviço';
  if (!confirm(`Excluir ${name}? Esta ação não pode ser desfeita.`)) return;

  try {
    const res = await fetch(`${API_BASE}/works/deleteWork/${workId}`, {
      method: 'DELETE',
      headers: authHeader()
    });

    if (!res.ok) {
      const data = await res.json().catch(function () { return {}; });
      const msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao excluir serviço.';
      alert(msg);
      return;
    }

    await loadWorks();
  } catch (e) {
    alert('Erro de conexão ao excluir.');
  }
}

document.getElementById('workModal').addEventListener('click', function (e) {
  if (e.target === this) closeWorkModal();
});

/* ── Freelancer: active orders ────────────────────────────────────── */

var ITEM_FL_STATUS_LABELS = {
  PENDING_DELIVERY:          '📦 Aguardando Entrega',
  PENDING_DELIVERY_REVISION: '🔍 Aguardando Revisão',
  ADJUSTMENT_REQUEST:        '🔄 Revisão Solicitada',
  ON_DISPUTE:                '⚖️ Em Disputa',
  FROZEN:                    '⏸️ Congelado',
  COMPLETED:                 '✅ Concluído',
  REFUNDED:                  '↩ Reembolsado'
};

var ITEM_FL_STATUS_CSS = {
  PENDING_DELIVERY:          'item-status-pending',
  PENDING_DELIVERY_REVISION: 'item-status-review',
  ADJUSTMENT_REQUEST:        'item-status-adjust',
  ON_DISPUTE:                'item-status-dispute',
  FROZEN:                    'item-status-frozen',
  COMPLETED:                 'item-status-done',
  REFUNDED:                  'item-status-refunded'
};

async function loadFreelancerOrders() {
  var list = document.getElementById('activeOrdersList');
  if (list) list.innerHTML = '<div class="works-loading">Carregando pedidos ativos...</div>';

  try {
    var res = await fetch(API_BASE + '/delivery/myActiveItems', { headers: authHeader() });
    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    var items = await res.json();
    renderFreelancerOrders(items);
    renderDisputasRecebidas();
  } catch (e) {
    if (list) list.innerHTML = '<div class="works-error">Erro ao carregar pedidos ativos.</div>';
  }
}

function renderFreelancerOrders(items) {
  freelancerOrdersData = items;
  var list  = document.getElementById('activeOrdersList');
  var badge = document.getElementById('activeOrdersBadge');

  var active = items.filter(function (i) { return i.status !== 'COMPLETED' && i.status !== 'REFUNDED'; });

  if (badge) {
    badge.textContent   = active.length;
    badge.style.display = active.length > 0 ? '' : 'none';
  }

  if (!items.length) {
    list.innerHTML = '<div class="active-orders-empty">Nenhum pedido encontrado. Quando clientes comprarem seus serviços, eles aparecem aqui.</div>';
    return;
  }

  list.innerHTML = '';

  var sorted    = items.slice().sort(function (a, b) { return b.id - a.id; });
  var start     = (flOrdersPage - 1) * PAGE_SIZE;
  var pageItems = sorted.slice(start, start + PAGE_SIZE);

  pageItems.forEach(function (item) {
    var stLabel  = ITEM_FL_STATUS_LABELS[item.status] || item.status;
    var stClass  = ITEM_FL_STATUS_CSS[item.status]    || 'item-status-pending';
    var price    = formatPrice(item.totalPrice);
    var amtBadge = (item.amount && item.amount > 1)
      ? '<span style="background:var(--green);color:#000;border-radius:4px;padding:2px 7px;font-size:11px;font-weight:700;margin-left:8px">' + item.amount + 'x</span>'
      : '';
    var deadline = item.deadlineDate
      ? new Date(item.deadlineDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    var card = document.createElement('div');
    card.className = 'order-card';
    card.style.borderLeft = '3px solid var(--green)';
    card.innerHTML =
      '<div class="order-card-header" style="align-items:center;gap:12px">' +
        '<div style="display:flex;align-items:baseline;gap:10px;flex:1;min-width:0">' +
          '<span style="font-size:22px;font-weight:800;color:var(--green);letter-spacing:-0.5px">#' + item.id + '</span>' +
          '<span style="font-size:16px;font-weight:600;color:var(--text)">' + escHtml(item.workTitle || 'Serviço') + '</span>' +
          amtBadge +
        '</div>' +
        '<span class="order-item-status ' + stClass + '" style="font-size:12px;white-space:nowrap">' + escHtml(stLabel) + '</span>' +
      '</div>' +
      '<div class="order-items-list">' +
        '<div class="order-item-row" style="gap:14px;padding:14px 0;align-items:center">' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-size:13px;color:var(--muted2)">Cliente: <span style="color:var(--text)">' + escHtml(item.clientName || '—') + '</span></div>' +
            '<div style="font-size:13px;color:var(--muted2);margin-top:3px">Entrega até: <span style="color:var(--text)">' + deadline + '</span></div>' +
          '</div>' +
          '<span style="font-size:15px;font-weight:700;color:var(--green);white-space:nowrap">' + price + '</span>' +
          '<a href="chatScreen.html?orderItemId=' + item.id + '" class="btn-chat-item" style="font-size:13px;padding:6px 14px">💬 Abrir chat</a>' +
        '</div>' +
      '</div>';

    list.appendChild(card);
  });

  renderPagination('flOrdersPagination', sorted.length, flOrdersPage, 'setFlOrdersPage');
}

/* ── Freelancer: disputas recebidas (clientes disputaram contra o freelancer) ── */

function renderDisputasRecebidas() {
  var list  = document.getElementById('disputasRecebidasList');
  var badge = document.getElementById('disputasRecebidasBadge');
  if (!list) return;

  var disputed = (freelancerOrdersData || []).filter(function (i) { return i.status === 'ON_DISPUTE'; });

  if (badge) {
    badge.textContent   = disputed.length;
    badge.style.display = disputed.length > 0 ? '' : 'none';
  }

  if (!disputed.length) {
    list.innerHTML = '<div class="active-orders-empty">Nenhuma disputa recebida. Quando um cliente contestar sua entrega, ela aparecerá aqui.</div>';
    renderPagination('disputasRecebidasPagination', 0, 1, 'setDisputasRecebidasPage');
    return;
  }

  var sorted    = disputed.slice().sort(function (a, b) { return b.id - a.id; });
  var start     = (disputasRecebidasPage - 1) * PAGE_SIZE;
  var pageItems = sorted.slice(start, start + PAGE_SIZE);

  list.innerHTML = '';
  pageItems.forEach(function (item) {
    var price    = formatPrice(item.totalPrice);
    var deadline = item.deadlineDate
      ? new Date(item.deadlineDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    var card = document.createElement('div');
    card.className = 'order-card';
    card.style.borderLeft = '3px solid #fb923c';
    card.innerHTML =
      '<div class="order-card-header" style="align-items:center;gap:12px">' +
        '<div style="display:flex;align-items:baseline;gap:10px;flex:1;min-width:0">' +
          '<span style="font-size:22px;font-weight:800;color:var(--green);letter-spacing:-0.5px">#' + item.id + '</span>' +
          '<span style="font-size:16px;font-weight:600;color:var(--text)">' + escHtml(item.workTitle || 'Serviço') + '</span>' +
        '</div>' +
        '<span class="order-item-status item-status-dispute" style="font-size:12px;white-space:nowrap">⚖️ Em Disputa</span>' +
      '</div>' +
      '<div class="order-items-list">' +
        '<div class="order-item-row" style="gap:14px;padding:14px 0;align-items:center">' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-size:13px;color:var(--muted2)">Cliente: <span style="color:var(--text)">' + escHtml(item.clientName || '—') + '</span></div>' +
            '<div style="font-size:13px;color:var(--muted2);margin-top:3px">Prazo: <span style="color:var(--text)">' + deadline + '</span></div>' +
          '</div>' +
          '<span style="font-size:15px;font-weight:700;color:var(--green);white-space:nowrap">' + price + '</span>' +
          '<a href="chatScreen.html?orderItemId=' + item.id + '" class="btn-chat-item" style="font-size:13px;padding:6px 14px">💬 Ver chat</a>' +
        '</div>' +
      '</div>';
    list.appendChild(card);
  });

  renderPagination('disputasRecebidasPagination', sorted.length, disputasRecebidasPage, 'setDisputasRecebidasPage');
}

/* ── Freelancer/Both: minhas disputas (disputas abertas pelo dono do perfil como comprador) ── */

function renderMinhasDisputas() {
  var list  = document.getElementById('minhasDisputasList');
  var badge = document.getElementById('minhasDisputasBadge');
  if (!list) return;

  var disputed = [];
  (ordersData || []).forEach(function (order) {
    if (order.items) {
      order.items.forEach(function (item) {
        if (item.status === 'ON_DISPUTE') disputed.push({ item: item, order: order });
      });
    }
  });

  if (badge) {
    badge.textContent   = disputed.length;
    badge.style.display = disputed.length > 0 ? '' : 'none';
  }

  if (!disputed.length) {
    list.innerHTML = '<div class="active-orders-empty">Nenhuma disputa em aberto. Quando contestar uma entrega recebida, ela aparecerá aqui.</div>';
    renderPagination('minhasDisputasPagination', 0, 1, 'setMinhasDisputasPage');
    return;
  }

  var sorted    = disputed.slice().sort(function (a, b) { return b.item.id - a.item.id; });
  var start     = (minhasDisputasPage - 1) * PAGE_SIZE;
  var pageItems = sorted.slice(start, start + PAGE_SIZE);

  list.innerHTML = '';
  pageItems.forEach(function (entry) {
    var item  = entry.item;
    var order = entry.order;
    var price = formatPrice(item.totalPrice);
    var fl    = item.freelancerName
      ? '<div style="font-size:13px;color:var(--muted2);margin-top:3px">Freelancer: <span style="color:var(--text)">' + escHtml(item.freelancerName) + '</span></div>'
      : '';
    var card = document.createElement('div');
    card.className = 'order-card';
    card.style.borderLeft = '3px solid #fb923c';
    card.innerHTML =
      '<div class="order-card-header" style="align-items:center;gap:12px">' +
        '<div style="display:flex;align-items:baseline;gap:10px;flex:1;min-width:0">' +
          '<span style="font-size:22px;font-weight:800;color:var(--green);letter-spacing:-0.5px">#' + item.id + '</span>' +
          '<span style="font-size:16px;font-weight:600;color:var(--text)">' + escHtml(item.workTitle || 'Serviço') + '</span>' +
        '</div>' +
        '<span class="order-item-status item-status-dispute" style="font-size:12px;white-space:nowrap">⚖️ Em Disputa</span>' +
      '</div>' +
      '<div class="order-items-list">' +
        '<div class="order-item-row" style="gap:14px;padding:14px 0;align-items:center">' +
          '<div style="flex:1;min-width:0">' + fl + '</div>' +
          '<span style="font-size:15px;font-weight:700;color:var(--green);white-space:nowrap">' + price + '</span>' +
          '<a href="chatScreen.html?orderItemId=' + item.id + '" class="btn-chat-item" style="font-size:13px;padding:6px 14px">💬 Ver chat</a>' +
        '</div>' +
      '</div>';
    list.appendChild(card);
  });

  renderPagination('minhasDisputasPagination', sorted.length, minhasDisputasPage, 'setMinhasDisputasPage');
}

/* ── Client: orders ───────────────────────────────────────────────── */

var METHOD_LABELS = {
  PIX:     '⚡ PIX',
  CARTAO:  '💳 Cartão de Crédito',
  BALANCE: '💰 Saldo OneFreela'
};

var ORDER_STATUS_LABELS = {
  NOT_PAID: 'Aguardando Pagamento',
  PAID:     'Pago',
  REFUNDED: 'Reembolsado',
  FAILED:   'Pagamento falhou'
};

var ORDER_STATUS_CLASSES = {
  NOT_PAID: 'order-status-not-paid',
  PAID:     'order-status-paid',
  REFUNDED: 'order-status-refunded',
  FAILED:   'order-status-failed'
};

var ITEM_STATUS_LABELS = {
  PENDING_DELIVERY:          'Aguardando Entrega',
  PENDING_DELIVERY_REVISION: 'Aguardando Revisão',
  ADJUSTMENT_REQUEST:        'Revisão Solicitada',
  ON_DISPUTE:                'Em Disputa',
  FROZEN:                    'Congelado',
  COMPLETED:                 'Concluído',
  REFUNDED:                  'Reembolsado'
};

var ITEM_STATUS_CLASSES = {
  PENDING_DELIVERY:          'item-status-pending',
  PENDING_DELIVERY_REVISION: 'item-status-review',
  ADJUSTMENT_REQUEST:        'item-status-adjust',
  ON_DISPUTE:                'item-status-dispute',
  FROZEN:                    'item-status-frozen',
  COMPLETED:                 'item-status-done',
  REFUNDED:                  'item-status-refunded'
};

async function loadOrders() {
  var list = document.getElementById('ordersList');
  if (list) list.innerHTML = '<div class="works-loading">Carregando pedidos...</div>';

  try {
    var res = await fetch(API_BASE + '/order/myOrders', { headers: authHeader() });

    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    ordersData = await res.json();
    renderOrders(ordersData);
    renderMinhasDisputas();
  } catch (e) {
    if (list) list.innerHTML = '<div class="works-error">Erro ao carregar pedidos.</div>';
  }
}

function renderOrders(orders) {
  var list  = document.getElementById('ordersList');
  var badge = document.getElementById('ordersBadge');

  if (badge) {
    badge.textContent   = orders.length;
    badge.style.display = orders.length > 0 ? '' : 'none';
  }

  if (!orders.length) {
    list.innerHTML = '<div class="orders-empty">Nenhum pedido realizado ainda.<br><a href="exploreFreelancers.html">Explore freelancers</a> para começar.</div>';
    return;
  }

  list.innerHTML = '';

  var sorted    = orders.slice().sort(function (a, b) { return b.id - a.id; });
  var start     = (ordersPage - 1) * PAGE_SIZE;
  var pageItems = sorted.slice(start, start + PAGE_SIZE);

  pageItems.forEach(function (order) {
    var originalIdx = ordersData.indexOf(order);
    var statusClass = ORDER_STATUS_CLASSES[order.status] || 'order-status-not-paid';
    var statusLabel = ORDER_STATUS_LABELS[order.status]  || order.status;
    var methodLabel = METHOD_LABELS[order.paymentMethod] || order.paymentMethod || '—';
    var isPaid      = order.status === 'PAID';
    var canPay      = order.status === 'NOT_PAID' || order.status === 'FAILED';

    var dateStr = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    var itemsHtml = '';
    if (order.items && order.items.length) {
      itemsHtml = '<div class="order-items-list">';
      order.items.forEach(function (item) {
        var stClass    = ITEM_STATUS_CLASSES[item.status] || 'item-status-pending';
        var stLabel    = ITEM_STATUS_LABELS[item.status]  || item.status;
        var amtBadge   = item.amount > 1
          ? '<span style="background:var(--green);color:#000;border-radius:4px;padding:2px 7px;font-size:11px;font-weight:700;margin-left:8px">' + item.amount + 'x</span>'
          : '';
        var chatBtn    = isPaid
          ? '<a href="chatScreen.html?orderItemId=' + item.id + '" class="btn-chat-item" style="font-size:13px;padding:6px 14px">💬 Abrir chat</a>'
          : '';
        var freelancer = item.freelancerName
          ? '<div style="font-size:13px;color:var(--muted2);margin-top:3px">Freelancer: <span style="color:var(--text)">' + escHtml(item.freelancerName) + '</span></div>'
          : '';

        itemsHtml +=
          '<div class="order-item-row" style="gap:14px;padding:14px 0;align-items:center">' +
            '<div style="flex:1;min-width:0">' +
              '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
                '<span style="font-size:15px;font-weight:600;color:var(--text)">' + escHtml(item.workTitle || 'Serviço') + '</span>' +
                amtBadge +
              '</div>' +
              freelancer +
            '</div>' +
            '<span class="order-item-status ' + stClass + '" style="font-size:12px;white-space:nowrap">' + stLabel + '</span>' +
            '<span style="font-size:15px;font-weight:700;color:var(--green);white-space:nowrap">' + formatPrice(item.totalPrice) + '</span>' +
            chatBtn +
          '</div>';
      });
      itemsHtml += '</div>';
    }

    var payBtnHtml = canPay
      ? '<div class="order-pay-action"><button class="btn-pay-order" onclick="openPaymentModal(' + originalIdx + ')">Realizar Pagamento</button></div>'
      : '';

    var card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML =
      '<div class="order-card-header" style="align-items:center;gap:12px">' +
        '<div style="display:flex;align-items:baseline;gap:10px;flex:1;min-width:0">' +
          '<span style="font-size:22px;font-weight:800;color:var(--green);letter-spacing:-0.5px">#' + order.id + '</span>' +
          '<span style="font-size:16px;font-weight:600;color:var(--text)">Pedido</span>' +
          '<span style="font-size:13px;color:var(--muted2);margin-left:4px">' + dateStr + '</span>' +
        '</div>' +
        '<span class="order-status-badge ' + statusClass + '" style="font-size:12px;white-space:nowrap">' + statusLabel + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:10px;margin:4px 0 2px;font-size:13px;color:var(--muted2)">' +
        '<span>' + methodLabel + '</span>' +
        '<span style="margin-left:auto;font-size:14px;font-weight:700;color:var(--text)">Total: ' + formatPrice(order.totalPrice) + '</span>' +
      '</div>' +
      itemsHtml +
      payBtnHtml;

    list.appendChild(card);
  });

  renderPagination('ordersPagination', sorted.length, ordersPage, 'setOrdersPage');
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Client: minhas denúncias ─────────────────────────────────────── */

var myReports          = [];
var myReportsFilter     = 'all';

var REPORT_NATURE_LABELS = {
  USER_BEHAVIOR:         'Comportamento de usuário',
  FRAUD:                 'Fraude',
  INAPPROPRIATE_CONTENT: 'Conteúdo inadequado',
  PAYMENT:               'Problema de pagamento',
  SERVICE:               'Problema com serviço',
  SECURITY:              'Segurança',
  OTHER:                 'Outro'
};

var REPORT_STATUS_LABELS = {
  PENDING:      'Pendente',
  UNDER_REVIEW: 'Em análise',
  RESOLVED:     'Resolvida',
  REJECTED:     'Rejeitada'
};

var REPORT_FILTER_CONFIG = [
  { id: 'all',          label: 'Todas' },
  { id: 'PENDING',      label: 'Pendentes' },
  { id: 'UNDER_REVIEW', label: 'Em análise' },
  { id: 'RESOLVED',     label: 'Resolvidas' },
  { id: 'REJECTED',     label: 'Rejeitadas' }
];

function buildReportsFilterButtons() {
  var wrap = document.getElementById('reportsFilterWrap');
  if (!wrap) return;
  wrap.innerHTML = REPORT_FILTER_CONFIG.map(function (f) {
    return '<button class="rf-btn ' + (myReportsFilter === f.id ? 'active' : '') + '" data-filter="' + f.id + '">' + f.label + '</button>';
  }).join('');

  wrap.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-filter]');
    if (!btn) return;
    myReportsFilter = btn.dataset.filter;
    reportsPage = 1;
    wrap.querySelectorAll('.rf-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    renderMyReports();
  });
}

async function loadMyReports() {
  var list = document.getElementById('myReportsList');
  if (list) list.innerHTML = '<div class="reports-loading">Carregando denúncias...</div>';

  try {
    var res = await fetch(API_BASE + '/reports/myReports', { headers: authHeader() });
    if (!res.ok) throw new Error();
    myReports = await res.json();
    renderMyReports();

    var badge = document.getElementById('myReportsBadge');
    if (badge) {
      badge.textContent   = myReports.length;
      badge.style.display = myReports.length > 0 ? '' : 'none';
    }
  } catch (e) {
    if (list) list.innerHTML = '<div class="reports-loading" style="color:#ef4444">Erro ao carregar denúncias.</div>';
  }
}

function renderMyReports() {
  var list = document.getElementById('myReportsList');
  if (!list) return;

  var visible = myReportsFilter === 'all'
    ? myReports
    : myReports.filter(function (r) { return r.status === myReportsFilter; });

  if (!visible.length) {
    list.innerHTML =
      '<div class="reports-empty">' +
        '<div class="reports-empty-icon">📋</div>' +
        '<div class="reports-empty-title">' + (myReportsFilter === 'all' ? 'Nenhuma denúncia registrada' : 'Nenhuma denúncia com este status') + '</div>' +
        '<div class="reports-empty-sub">' + (myReportsFilter === 'all' ? 'Denuncie um serviço a partir da página dele para começar.' : 'Altere o filtro para ver outras denúncias.') + '</div>' +
      '</div>';
    return;
  }

  var sorted    = visible.slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  var start     = (reportsPage - 1) * PAGE_SIZE;
  var pageItems = sorted.slice(start, start + PAGE_SIZE);

  list.innerHTML = pageItems.map(tplMyReportCard).join('');

  renderPagination('reportsPagination', sorted.length, reportsPage, 'setReportsPage');
}

function tplMyReportCard(r) {
  var natureLbl  = REPORT_NATURE_LABELS[r.nature] || r.nature;
  var statusLbl  = REPORT_STATUS_LABELS[r.status] || r.status;
  var createdAt  = r.createdAt  ? fmtReportDate(r.createdAt)  : '—';
  var reviewedAt = r.reviewedAt ? ' · Analisada em ' + fmtReportDate(r.reviewedAt) : '';
  var workHtml   = r.workTitle ? '<div class="report-card-work">🚩 Serviço: ' + escHtml(r.workTitle) + '</div>' : '';

  var adminNotesHtml = r.adminNotes
    ? '<div class="report-admin-notes"><div class="report-admin-notes-label">Notas do administrador</div>' + escHtml(r.adminNotes) + '</div>'
    : '';

  var attachCount = (r.attachments && r.attachments.length)
    ? '<span style="font-size:11px;color:var(--muted2)">📎 ' + r.attachments.length + ' anexo' + (r.attachments.length > 1 ? 's' : '') + '</span>'
    : '';

  return (
    '<div class="report-card">' +
      '<div class="report-card-top">' +
        '<div>' +
          '<div class="report-card-title">' + escHtml(r.title) + '</div>' +
          '<div class="report-card-nature">' + natureLbl + '</div>' +
          workHtml +
        '</div>' +
        '<span class="rs-badge rs-' + r.status + '">' + statusLbl + '</span>' +
      '</div>' +
      '<div class="report-card-desc">' + escHtml(r.description) + '</div>' +
      adminNotesHtml +
      '<div class="report-card-footer">' +
        '<span class="report-card-date">Registrada em ' + createdAt + reviewedAt + '</span>' +
        attachCount +
      '</div>' +
    '</div>'
  );
}

function fmtReportDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Client: payment modal ───────────────────────────────────────────── */

function openPaymentModal(orderIdx) {
  const order = ordersData[orderIdx];
  if (!order) return;
  payingOrderIdx = orderIdx;

  var method = (order.paymentMethod || '').toUpperCase();
  var isPix      = method === 'PIX';
  var isCard     = method === 'CARTAO';
  var isBalance  = method === 'BALANCE';

  var pillClass   = isPix ? 'pix' : isCard ? 'card' : 'balance';
  var pillLabel   = isPix ? '⚡ PIX' : isCard ? '💳 Cartão de Crédito' : '💰 Saldo OneFreela';

  const pill = document.getElementById('pmMethodPill');
  if (pill) {
    pill.className   = 'pm-method-pill ' + pillClass;
    pill.textContent = pillLabel;
  }

  const pixForm     = document.getElementById('pmPixForm');
  const cardForm    = document.getElementById('pmCardForm');
  const balanceForm = document.getElementById('pmBalanceForm');
  if (pixForm)     pixForm.style.display     = isPix     ? '' : 'none';
  if (cardForm)    cardForm.style.display     = isCard    ? '' : 'none';
  if (balanceForm) balanceForm.style.display  = isBalance ? '' : 'none';

  const totalRow = document.getElementById('pmTotalRow');
  const totalVal = document.getElementById('pmTotalVal');
  if (totalRow) totalRow.style.display = '';
  if (totalVal && order.totalPrice != null) totalVal.textContent = formatPrice(order.totalPrice);

  ['pmPixCpf', 'pmCardNumber', 'pmCardName', 'pmCardExpiry', 'pmCardCvv', 'pmCardCpf'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  clearPmMsg();

  const btn = document.getElementById('pmSubmitBtn');
  if (btn) { btn.disabled = false; btn.textContent = 'CONFIRMAR PAGAMENTO'; }

  document.getElementById('paymentModal').classList.add('show');
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('show');
  payingOrderIdx = -1;
}

function showPmMsg(msg, type) {
  const el = document.getElementById('pmMsg');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'wf-msg wf-msg-' + type;
}

function clearPmMsg() {
  const el = document.getElementById('pmMsg');
  if (!el) return;
  el.textContent = '';
  el.className   = 'wf-msg';
}

async function submitPayment() {
  const order = ordersData[payingOrderIdx];
  if (!order) return;

  const btn = document.getElementById('pmSubmitBtn');
  btn.disabled    = true;
  btn.textContent = 'PROCESSANDO...';
  clearPmMsg();

  const method    = (order.paymentMethod || '').toUpperCase();
  const isPix     = method === 'PIX';
  const isBalance = method === 'BALANCE';
  let endpoint, body;

  if (isBalance) {
    endpoint = '/payment/makePaymentBalance/' + order.id;
    body     = null;
  } else if (isPix) {
    const cpf = document.getElementById('pmPixCpf').value.trim();
    if (!cpf) {
      showPmMsg('Informe o CPF do pagador.', 'error');
      btn.disabled    = false;
      btn.textContent = 'CONFIRMAR PAGAMENTO';
      return;
    }
    endpoint = '/payment/makePaymentPix';
    body = { orderId: order.id, cpf };
  } else {
    const cardNumber = document.getElementById('pmCardNumber').value.trim().replace(/\s/g, '');
    const cardName   = document.getElementById('pmCardName').value.trim();
    const expiryStr  = document.getElementById('pmCardExpiry').value.trim();
    const cvv        = document.getElementById('pmCardCvv').value.trim();
    const cpf        = document.getElementById('pmCardCpf').value.trim();

    if (!cardNumber || !cardName || !expiryStr || !cvv || !cpf) {
      showPmMsg('Preencha todos os campos do cartão.', 'error');
      btn.disabled    = false;
      btn.textContent = 'CONFIRMAR PAGAMENTO';
      return;
    }

    const parts = expiryStr.split('/');
    if (parts.length !== 2 || parts[1].length < 4) {
      showPmMsg('Validade inválida. Use o formato MM/AAAA.', 'error');
      btn.disabled    = false;
      btn.textContent = 'CONFIRMAR PAGAMENTO';
      return;
    }
    const expirationDate = parts[1] + '-' + parts[0].padStart(2, '0') + '-01';

    endpoint = '/payment/makePaymentCard';
    body = { orderId: order.id, cardNumber, name: cardName, expirationDate, cvv, cpf };
  }

  try {
    var fetchOpts = {
      method:  'POST',
      headers: isBalance ? authHeader() : Object.assign({ 'Content-Type': 'application/json' }, authHeader()),
    };
    if (!isBalance) fetchOpts.body = JSON.stringify(body);

    const res = await fetch(API_BASE + endpoint, fetchOpts);

    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }

    if (!res.ok) {
      const data = await res.json().catch(function () { return {}; });
      const msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao processar pagamento.';
      showPmMsg(msg, 'error');
      btn.disabled    = false;
      btn.textContent = 'CONFIRMAR PAGAMENTO';
      return;
    }

    closePaymentModal();
    await loadOrders();
  } catch (e) {
    console.error('submitPayment:', e);
    showPmMsg('Erro de conexão ao processar pagamento.', 'error');
    btn.disabled    = false;
    btn.textContent = 'CONFIRMAR PAGAMENTO';
  }
}

document.getElementById('paymentModal').addEventListener('click', function (e) {
  if (e.target === this) closePaymentModal();
});

/* ── Init ─────────────────────────────────────────────────────────── */

OFAuth.loadNav();
OFAuth.loadProfile();
initProfile();
initScrollReveal(0.08, null, 60);
initSidebarNavActive();
