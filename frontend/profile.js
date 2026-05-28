const API_BASE = 'http://localhost:8080';

let works        = [];
let editingWorkId = null;

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

  // Nav logo and home links
  const homeUrl = isFreelancer ? 'exploreFreelancers.html' : 'index.html';
  const navLogo = document.getElementById('navLogoLink');
  if (navLogo) navLogo.href = homeUrl;
  const sidebarHome = document.getElementById('sidebarHome');
  if (sidebarHome) sidebarHome.href = homeUrl;

  // Sidebar items
  if (isFreelancer) show('sidebarServicos'); else hide('sidebarServicos');
  if (!isFreelancer) show('sidebarExplorar'); else hide('sidebarExplorar');

  // Main sections
  if (isFreelancer) show('servicos'); else hide('servicos');

  // Client only: orders
  if (!isFreelancer) {
    show('sidebarPedidos');
    show('pedidos');
    loadOrders();
  } else {
    hide('sidebarPedidos');
    hide('pedidos');
  }

  // Client-only settings fields
  document.querySelectorAll('.client-only').forEach(function (el) {
    el.style.display = isFreelancer ? 'none' : '';
  });

  // Notification labels differ by role
  const notifLabel1 = document.getElementById('notifLabel1');
  const notifDesc1  = document.getElementById('notifDesc1');
  if (isFreelancer) {
    if (notifLabel1) notifLabel1.textContent = 'Novas propostas de clientes';
    if (notifDesc1)  notifDesc1.textContent  = 'Receba um e-mail quando um cliente entrar em contato com você';
  } else {
    if (notifLabel1) notifLabel1.textContent = 'Novas propostas de freelancers';
    if (notifDesc1)  notifDesc1.textContent  = 'Receba um e-mail quando alguém enviar uma proposta para seus projetos';
  }

  if (isFreelancer) loadWorks();
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

  works.forEach(function (w) {
    const isActive = w.status === 'ACTIVE';
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
        <span class="service-status ${isActive ? 'status-active' : 'status-paused'}">${isActive ? 'Ativo' : 'Inativo'}</span>
        <div class="service-price">${formatPrice(w.price)}</div>
        <div class="service-actions">
          <button class="btn-sm" onclick="openWorkModal(${w.id})">Editar</button>
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

/* ── Client: orders ───────────────────────────────────────────────── */

var METHOD_LABELS = {
  pix:    '⚡ PIX',
  card:   '💳 Cartão de Crédito',
  boleto: '📄 Boleto Bancário'
};

var STATUS_LABELS = {
  NOT_PAID:  'Aguardando',
  PAID:      'Pago',
  REFUNDED:  'Reembolsado'
};

var STATUS_CLASSES = {
  NOT_PAID:  'order-status-not-paid',
  PAID:      'order-status-paid',
  REFUNDED:  'order-status-refunded'
};

function loadOrders() {
  var orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('of_orders') || '[]');
  } catch (e) {
    orders = [];
  }
  renderOrders(orders);
}

function renderOrders(orders) {
  var list  = document.getElementById('ordersList');
  var badge = document.getElementById('ordersBadge');

  if (badge) {
    badge.textContent = orders.length;
    badge.style.display = orders.length > 0 ? '' : 'none';
  }

  if (!orders.length) {
    list.innerHTML = '<div class="orders-empty">Nenhum pedido realizado ainda.<br><a href="exploreFreelancers.html">Explore freelancers</a> para começar.</div>';
    return;
  }

  list.innerHTML = '';

  orders.forEach(function (order) {
    var statusClass = STATUS_CLASSES[order.status] || 'order-status-not-paid';
    var statusLabel = STATUS_LABELS[order.status]  || order.status;
    var methodLabel = METHOD_LABELS[order.method]  || order.method;

    var itemsHtml = '';
    if (order.items && order.items.length) {
      itemsHtml = '<div class="order-items-list">';
      order.items.forEach(function (item) {
        var amt   = item.amount > 1 ? ' × ' + item.amount : '';
        var price = item.price != null ? formatPrice(item.price * (item.amount || 1)) : '—';
        itemsHtml += '<div class="order-item-row">' +
          '<span class="order-item-title">' + (item.title || 'Serviço') + amt + '</span>' +
          '<span class="order-item-price">' + price + '</span>' +
        '</div>';
      });
      itemsHtml += '</div>';
    }

    var totalHtml = order.total != null ? formatPrice(order.total) : '—';

    var card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML =
      '<div class="order-card-header">' +
        '<div class="order-card-meta">' +
          '<div class="order-id">' + order.orderId + '</div>' +
          '<div class="order-date">' + order.date + '</div>' +
        '</div>' +
        '<span class="order-status-badge ' + statusClass + '">' + statusLabel + '</span>' +
      '</div>' +
      itemsHtml +
      '<div class="order-footer">' +
        '<span class="order-method-tag">' + methodLabel + '</span>' +
        '<span class="order-total-val">Total: ' + totalHtml + '</span>' +
      '</div>';

    list.appendChild(card);
  });
}

/* ── Init ─────────────────────────────────────────────────────────── */

OFAuth.loadNav();
OFAuth.loadProfile();
initProfile();
initScrollReveal(0.08, null, 60);
initSidebarNavActive();
