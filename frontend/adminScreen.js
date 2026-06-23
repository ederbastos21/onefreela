const API_BASE = 'http://localhost:8080';

let allUsers      = [];
let currentFilter = 'all';
let editingUserId = null;
let detailUserId  = null;

let allWorks        = [];
let currentWorksFilter = 'all';

let allCarts = [];

let allOrders         = [];
let currentOrdersFilter = 'all';

let allReports         = [];
let currentReportsFilter = 'all';
let reviewingReportId    = null;

function authHeader() {
  return { 'Authorization': OFAuth.getToken() };
}

/* ── Init ─────────────────────────────────────────────────────────── */

function initAdmin() {
  if (!OFAuth.requireLogin()) return;
  if (!OFAuth.isAdmin()) {
    window.location.href = 'profile.html';
    return;
  }
  loadUsers();
  loadWorks();
  loadCarts();
  loadOrders();
  loadReports();
}

/* ── Load & render users ──────────────────────────────────────────── */

async function loadUsers() {
  const list = document.getElementById('adminUserList');
  list.innerHTML = '<p class="admin-list-loading">Carregando usuários...</p>';

  try {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeader() });

    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    allUsers = await res.json();
    updateStats();
    renderUsers();
  } catch (e) {
    console.error('loadUsers:', e);
    list.innerHTML = '<p class="admin-list-error">Erro ao carregar usuários. Verifique se o servidor está ativo.</p>';
  }
}

function updateStats() {
  const total       = allUsers.length;
  const freelancers = allUsers.filter(function (u) { return !!u.freelancer && !u.admin; }).length;
  const admins      = allUsers.filter(function (u) { return !!u.admin; }).length;
  const clients     = total - freelancers - admins;

  document.getElementById('statTotal').textContent       = total;
  document.getElementById('statFreelancers').textContent = freelancers;
  document.getElementById('statClients').textContent     = clients;
  document.getElementById('statAdmins').textContent      = admins;

  var badge = document.getElementById('usersBadge');
  if (badge) { badge.textContent = total; badge.style.display = total > 0 ? '' : 'none'; }

  var statWorks = document.getElementById('statWorks');
  if (statWorks) statWorks.textContent = allWorks.length || '—';

  var statOrders = document.getElementById('statOrders');
  if (statOrders) statOrders.textContent = allOrders.length || '—';

  var statReportsPending = document.getElementById('statReportsPending');
  if (statReportsPending) {
    var pending = allReports.filter(function (r) { return r.status === 'PENDING'; }).length;
    statReportsPending.textContent = pending || '0';
  }

  var reportsBadge = document.getElementById('reportsBadge');
  if (reportsBadge) {
    var pendingCount = allReports.filter(function (r) { return r.status === 'PENDING' || r.status === 'UNDER_REVIEW'; }).length;
    reportsBadge.textContent = pendingCount;
    reportsBadge.style.display = pendingCount > 0 ? '' : 'none';
  }
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
  var id  = 'filter' + filter.charAt(0).toUpperCase() + filter.slice(1);
  var btn = document.getElementById(id);
  if (btn) btn.classList.add('active');
  renderUsers();
}

function filterUsers() {
  renderUsers();
}

function getFilteredUsers() {
  var query = (document.getElementById('searchInput').value || '').toLowerCase().trim();

  return allUsers.filter(function (u) {
    var matchFilter =
      currentFilter === 'all'        ? true :
      currentFilter === 'admin'      ? !!u.admin :
      currentFilter === 'freelancer' ? (!!u.freelancer && !u.admin) :
      currentFilter === 'cliente'    ? (!u.freelancer && !u.admin) : true;

    var matchSearch = !query ||
      (u.name  && u.name.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query));

    return matchFilter && matchSearch;
  });
}

function renderUsers() {
  var list     = document.getElementById('adminUserList');
  var countEl  = document.getElementById('adminCount');
  var filtered = getFilteredUsers();

  if (countEl) {
    var suffix = currentFilter !== 'all' ? ' encontrado' + (filtered.length !== 1 ? 's' : '') : ' cadastrado' + (filtered.length !== 1 ? 's' : '');
    countEl.textContent = filtered.length + ' usuário' + (filtered.length !== 1 ? 's' : '') + suffix;
  }

  list.innerHTML = '';

  if (filtered.length === 0) {
    list.innerHTML = '<p class="admin-list-empty">Nenhum usuário encontrado.</p>';
    return;
  }

  filtered.forEach(function (u) {
    var initials  = OFAuth.getInitials(u.name || '');
    var isAdminU  = !!u.admin;
    var isFreelU  = !!u.freelancer;
    var roleKey   = isAdminU ? 'admin' : (isFreelU ? 'freelancer' : 'cliente');
    var roleLabel = isAdminU ? 'Admin' : (isFreelU ? 'Freelancer' : 'Cliente');
    var avatarMod = isAdminU ? 'is-admin' : (isFreelU ? 'is-freelancer' : '');
    var dateText  = u.registerDate || '—';
    var uid       = u.id;

    var row = document.createElement('div');
    row.className = 'admin-user-row';
    row.innerHTML =
      '<div class="admin-user-avatar ' + avatarMod + '" onclick="openDetailModal(' + uid + ')">' + initials + '</div>' +
      '<div class="admin-user-info" onclick="openDetailModal(' + uid + ')">' +
        '<div class="admin-user-name">'  + (u.name  || 'Sem nome') + '</div>' +
        '<div class="admin-user-email">' + (u.email || '—')        + '</div>' +
      '</div>' +
      '<div class="admin-user-meta">' +
        '<span class="admin-badge admin-badge-' + roleKey + '">' + roleLabel + '</span>' +
        (u.verified ? '<span class="admin-badge admin-badge-verified">Verificado</span>' : '') +
        '<span class="admin-user-date">' + dateText + '</span>' +
      '</div>' +
      '<div class="admin-user-actions">' +
        '<button class="btn-row"            onclick="openEditModal('   + uid + ')">Editar</button>' +
        '<button class="btn-row btn-row-danger" onclick="confirmDeleteUser(' + uid + ')">Excluir</button>' +
      '</div>';

    list.appendChild(row);
  });
}

/* ── Detail / Inspect modal ──────────────────────────────────────── */

function openDetailModal(userId) {
  var u = allUsers.find(function (x) { return x.id === userId; });
  if (!u) return;
  detailUserId = userId;

  var isAdminU  = !!u.admin;
  var isFreelU  = !!u.freelancer;
  var roleKey   = isAdminU ? 'admin' : (isFreelU ? 'freelancer' : 'cliente');
  var roleLabel = isAdminU ? 'Administrador' : (isFreelU ? 'Freelancer' : 'Cliente');
  var avatarMod = isAdminU ? 'is-admin' : (isFreelU ? 'is-freelancer' : '');

  var avatar = document.getElementById('detailAvatar');
  avatar.textContent = OFAuth.getInitials(u.name || '');
  avatar.className   = 'detail-modal-avatar ' + avatarMod;

  document.getElementById('detailName').textContent  = u.name  || 'Sem nome';
  document.getElementById('detailEmail').textContent = u.email || '—';
  document.getElementById('detailType').textContent  = roleLabel;
  document.getElementById('detailDate').textContent  = u.registerDate || '—';
  document.getElementById('detailId').textContent    = u.id != null ? '#' + u.id : '—';

  var badgesEl = document.getElementById('detailBadges');
  badgesEl.innerHTML =
    '<span class="admin-badge admin-badge-' + roleKey + '">' + roleLabel + '</span>' +
    (u.verified ? '<span class="admin-badge admin-badge-verified">Verificado</span>' : '') +
    (u.admin && !isAdminU ? '' : '');

  document.getElementById('detailModal').classList.add('show');
}

function closeDetailModal() {
  document.getElementById('detailModal').classList.remove('show');
  detailUserId = null;
}

function openEditFromDetail() {
  var id = detailUserId;
  closeDetailModal();
  openEditModal(id);
}

function deleteFromDetail() {
  var id = detailUserId;
  closeDetailModal();
  confirmDeleteUser(id);
}

document.getElementById('detailModal').addEventListener('click', function (e) {
  if (e.target === this) closeDetailModal();
});

/* ── Add / Edit user modal ──────────────────────────────────────── */

function clearUserForm() {
  document.getElementById('ufName').value     = '';
  document.getElementById('ufEmail').value    = '';
  document.getElementById('ufPassword').value = '';
  document.getElementById('ufType').value     = 'cliente';
  document.getElementById('ufAdminToggle').classList.remove('on');
  clearUserFormMsg();
}

function setUserFormMsg(msg, type) {
  var el = document.getElementById('ufMsg');
  el.textContent = msg;
  el.className   = 'admin-form-msg admin-form-msg-' + type;
}

function clearUserFormMsg() {
  var el = document.getElementById('ufMsg');
  el.textContent = '';
  el.className   = 'admin-form-msg';
}

function openAddModal() {
  editingUserId = null;
  clearUserForm();
  document.getElementById('userFormTitle').textContent    = 'NOVO USUÁRIO';
  document.getElementById('ufSubmitBtn').textContent      = 'CADASTRAR';
  document.getElementById('ufPasswordField').style.display = '';
  document.getElementById('userFormModal').classList.add('show');
}

function openEditModal(userId) {
  var u = allUsers.find(function (x) { return x.id === userId; });
  if (!u) return;
  editingUserId = userId;

  clearUserForm();
  document.getElementById('ufName').value  = u.name  || '';
  document.getElementById('ufEmail').value = u.email || '';
  document.getElementById('ufType').value  = u.freelancer ? 'freelancer' : 'cliente';
  if (u.admin) document.getElementById('ufAdminToggle').classList.add('on');

  document.getElementById('userFormTitle').textContent     = 'EDITAR USUÁRIO';
  document.getElementById('ufSubmitBtn').textContent       = 'SALVAR ALTERAÇÕES';
  document.getElementById('ufPasswordField').style.display = 'none';
  document.getElementById('userFormModal').classList.add('show');
}

function closeUserFormModal() {
  document.getElementById('userFormModal').classList.remove('show');
  editingUserId = null;
}

document.getElementById('userFormModal').addEventListener('click', function (e) {
  if (e.target === this) closeUserFormModal();
});

async function submitUserForm() {
  var name     = document.getElementById('ufName').value.trim();
  var email    = document.getElementById('ufEmail').value.trim();
  var password = document.getElementById('ufPassword').value;
  var type     = document.getElementById('ufType').value;
  var isAdminF = document.getElementById('ufAdminToggle').classList.contains('on');
  var isEdit   = editingUserId !== null;

  if (!name)            { setUserFormMsg('Preencha o nome.', 'error');   return; }
  if (!email)           { setUserFormMsg('Preencha o e-mail.', 'error'); return; }
  if (!isEdit && !password) { setUserFormMsg('Preencha a senha.', 'error');  return; }

  var btn = document.getElementById('ufSubmitBtn');
  btn.disabled    = true;
  btn.textContent = 'SALVANDO...';

  var payload = { name: name, email: email, freelancer: type === 'freelancer', admin: isAdminF };
  if (!isEdit) payload.password = password;

  var url    = isEdit ? `${API_BASE}/admin/users/${editingUserId}` : `${API_BASE}/admin/users`;
  var method = isEdit ? 'PUT' : 'POST';

  try {
    var res = await fetch(url, {
      method: method,
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao salvar usuário.';
      setUserFormMsg(msg, 'error');
      return;
    }

    closeUserFormModal();
    await loadUsers();
  } catch (e) {
    setUserFormMsg('Erro de conexão.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = isEdit ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR';
  }
}

/* ── Delete ──────────────────────────────────────────────────────── */

async function confirmDeleteUser(userId) {
  var u    = allUsers.find(function (x) { return x.id === userId; });
  var name = u ? '"' + (u.name || 'este usuário') + '"' : 'este usuário';

  if (!confirm('Excluir ' + name + '? Esta ação não pode ser desfeita.')) return;

  try {
    var res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: authHeader()
    });

    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao excluir usuário.';
      alert(msg);
      return;
    }

    await loadUsers();
  } catch (e) {
    alert('Erro de conexão ao excluir.');
  }
}

/* ── Works ───────────────────────────────────────────────────────── */

async function loadWorks() {
  var list = document.getElementById('adminWorkList');
  list.innerHTML = '<p class="admin-list-loading">Carregando serviços...</p>';

  try {
    var res = await fetch(API_BASE + '/admin/works', { headers: authHeader() });
    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    allWorks = await res.json();
    var badge = document.getElementById('worksBadge');
    if (badge) { badge.textContent = allWorks.length; badge.style.display = allWorks.length > 0 ? '' : 'none'; }
    updateStats();
    renderWorks();
  } catch (e) {
    console.error('loadWorks:', e);
    list.innerHTML = '<p class="admin-list-error">Erro ao carregar serviços.</p>';
  }
}

function setWorksFilter(filter) {
  currentWorksFilter = filter;
  document.querySelectorAll('#servicos .filter-btn').forEach(function (b) { b.classList.remove('active'); });
  var map = { all: 'filterWorksAll', active: 'filterWorksActive', inactive: 'filterWorksInactive' };
  var btn = document.getElementById(map[filter]);
  if (btn) btn.classList.add('active');
  renderWorks();
}

function filterWorks() { renderWorks(); }

function getFilteredWorks() {
  var query = (document.getElementById('searchWorksInput').value || '').toLowerCase().trim();
  return allWorks.filter(function (w) {
    var matchFilter =
      currentWorksFilter === 'all'      ? true :
      currentWorksFilter === 'active'   ? (w.status === 'ACTIVE') :
      currentWorksFilter === 'inactive' ? (w.status === 'INACTIVE') : true;

    var matchSearch = !query ||
      (w.title    && w.title.toLowerCase().includes(query)) ||
      (w.category && w.category.toLowerCase().includes(query));

    return matchFilter && matchSearch;
  });
}

function renderWorks() {
  var list     = document.getElementById('adminWorkList');
  var countEl  = document.getElementById('adminWorksCount');
  var filtered = getFilteredWorks();

  if (countEl) {
    countEl.textContent = filtered.length + ' serviço' + (filtered.length !== 1 ? 's' : '') + ' encontrado' + (filtered.length !== 1 ? 's' : '');
  }

  list.innerHTML = '';

  if (filtered.length === 0) {
    list.innerHTML = '<p class="admin-list-empty">Nenhum serviço encontrado.</p>';
    return;
  }

  filtered.forEach(function (w) {
    var isActive  = w.status === 'ACTIVE';
    var statusKey = isActive ? 'active' : 'inactive';
    var statusLabel = isActive ? 'Ativo' : 'Inativo';
    var ownerName = (w.owner && w.owner.name) ? w.owner.name : '—';
    var price     = w.price != null ? 'R$ ' + Number(w.price).toFixed(2).replace('.', ',') : '—';
    var date      = w.createdAt ? w.createdAt.split('T')[0] : '—';

    var row = document.createElement('div');
    row.className = 'admin-work-row';
    row.innerHTML =
      '<div class="admin-work-icon status-' + statusKey + '">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>' +
      '</div>' +
      '<div class="admin-work-info">' +
        '<div class="admin-work-title">' + (w.title || 'Sem título') + '</div>' +
        '<div class="admin-work-meta">' + (w.category || '—') + ' · ' + ownerName + '</div>' +
      '</div>' +
      '<div class="admin-user-meta">' +
        '<span class="admin-badge admin-badge-work-' + statusKey + '">' + statusLabel + '</span>' +
        '<span class="admin-user-date">' + price + '</span>' +
        '<span class="admin-user-date">' + date + '</span>' +
      '</div>';

    list.appendChild(row);
  });
}

/* ── Carts ───────────────────────────────────────────────────────── */

async function loadCarts() {
  var list = document.getElementById('adminCartList');
  list.innerHTML = '<p class="admin-list-loading">Carregando carrinhos...</p>';

  try {
    var res = await fetch(API_BASE + '/admin/carts', { headers: authHeader() });
    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    allCarts = await res.json();
    var badge = document.getElementById('cartsBadge');
    if (badge) { badge.textContent = allCarts.length; badge.style.display = allCarts.length > 0 ? '' : 'none'; }
    renderCarts();
  } catch (e) {
    console.error('loadCarts:', e);
    list.innerHTML = '<p class="admin-list-error">Erro ao carregar carrinhos.</p>';
  }
}

function renderCarts() {
  var list    = document.getElementById('adminCartList');
  var countEl = document.getElementById('adminCartsCount');

  if (countEl) {
    countEl.textContent = allCarts.length + ' carrinho' + (allCarts.length !== 1 ? 's' : '') + ' cadastrado' + (allCarts.length !== 1 ? 's' : '');
  }

  list.innerHTML = '';

  if (allCarts.length === 0) {
    list.innerHTML = '<p class="admin-list-empty">Nenhum carrinho encontrado.</p>';
    return;
  }

  allCarts.forEach(function (c) {
    var items     = (c.cartItemList && c.cartItemList.length) ? c.cartItemList.length : 0;
    var totalAmt  = 0;
    if (c.cartItemList) {
      c.cartItemList.forEach(function (i) { totalAmt += (i.amount || 0); });
    }

    var row = document.createElement('div');
    row.className = 'admin-cart-row';
    row.innerHTML =
      '<div class="admin-cart-icon">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
      '</div>' +
      '<div class="admin-cart-info">' +
        '<div class="admin-cart-id">Carrinho #' + c.id + '</div>' +
        '<div class="admin-cart-sub">' + items + ' item' + (items !== 1 ? 's' : '') + ' · ' + totalAmt + ' unidade' + (totalAmt !== 1 ? 's' : '') + '</div>' +
      '</div>';

    list.appendChild(row);
  });
}

/* ── Orders ──────────────────────────────────────────────────────── */

async function loadOrders() {
  var list = document.getElementById('adminOrderList');
  list.innerHTML = '<p class="admin-list-loading">Carregando pedidos...</p>';

  try {
    var res = await fetch(API_BASE + '/admin/orders', { headers: authHeader() });
    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    allOrders = await res.json();
    var badge = document.getElementById('ordersBadge');
    if (badge) { badge.textContent = allOrders.length; badge.style.display = allOrders.length > 0 ? '' : 'none'; }
    updateStats();
    renderOrders();
  } catch (e) {
    console.error('loadOrders:', e);
    list.innerHTML = '<p class="admin-list-error">Erro ao carregar pedidos.</p>';
  }
}

function setOrdersFilter(filter) {
  currentOrdersFilter = filter;
  document.querySelectorAll('#pedidos .filter-btn').forEach(function (b) { b.classList.remove('active'); });
  var map = { all: 'filterOrdersAll', NOT_PAID: 'filterOrdersNotPaid', PAID: 'filterOrdersPaid', REFUNDED: 'filterOrdersRefunded' };
  var btn = document.getElementById(map[filter]);
  if (btn) btn.classList.add('active');
  renderOrders();
}

function filterOrders() { renderOrders(); }

function getFilteredOrders() {
  var query = (document.getElementById('searchOrdersInput').value || '').toLowerCase().trim();
  return allOrders.filter(function (o) {
    var matchFilter = currentOrdersFilter === 'all' ? true : o.status === currentOrdersFilter;
    var userName    = (o.user && o.user.name)  ? o.user.name.toLowerCase()  : '';
    var userEmail   = (o.user && o.user.email) ? o.user.email.toLowerCase() : '';
    var matchSearch = !query || userName.includes(query) || userEmail.includes(query);
    return matchFilter && matchSearch;
  });
}

var ORDER_STATUS_LABEL = { NOT_PAID: 'Não pago', PAID: 'Pago', REFUNDED: 'Reembolsado' };

function renderOrders() {
  var list     = document.getElementById('adminOrderList');
  var countEl  = document.getElementById('adminOrdersCount');
  var filtered = getFilteredOrders();

  if (countEl) {
    countEl.textContent = filtered.length + ' pedido' + (filtered.length !== 1 ? 's' : '') + ' encontrado' + (filtered.length !== 1 ? 's' : '');
  }

  list.innerHTML = '';

  if (filtered.length === 0) {
    list.innerHTML = '<p class="admin-list-empty">Nenhum pedido encontrado.</p>';
    return;
  }

  filtered.forEach(function (o) {
    var statusKey   = (o.status || 'NOT_PAID').toLowerCase();
    var statusLabel = ORDER_STATUS_LABEL[o.status] || o.status || '—';
    var userName    = (o.user && o.user.name)  ? o.user.name  : '—';
    var userEmail   = (o.user && o.user.email) ? o.user.email : '';
    var total       = o.totalPrice != null ? 'R$ ' + Number(o.totalPrice).toFixed(2).replace('.', ',') : '—';
    var date        = o.createdAt || '—';
    var items       = (o.orderItemlist && o.orderItemlist.length) ? o.orderItemlist.length : 0;

    var row = document.createElement('div');
    row.className = 'admin-order-row';
    row.innerHTML =
      '<div class="admin-user-avatar" style="cursor:default">' +
        OFAuth.getInitials(userName) +
      '</div>' +
      '<div class="admin-order-info">' +
        '<div class="admin-order-id">Pedido #' + o.id + ' · ' + userName + '</div>' +
        '<div class="admin-order-meta">' + (userEmail || '') + (items ? ' · ' + items + ' item' + (items !== 1 ? 's' : '') : '') + '</div>' +
      '</div>' +
      '<div class="admin-user-meta">' +
        '<span class="admin-badge admin-badge-order-' + statusKey + '">' + statusLabel + '</span>' +
        '<span class="admin-user-date">' + total + '</span>' +
        '<span class="admin-user-date">' + date + '</span>' +
      '</div>';

    list.appendChild(row);
  });
}

/* ── Reports ─────────────────────────────────────────────────────── */

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

var REPORT_STATUS_BADGE = {
  PENDING:      'admin-badge-order-not_paid',
  UNDER_REVIEW: 'admin-badge',
  RESOLVED:     'admin-badge-order-paid',
  REJECTED:     'admin-badge-order-refunded'
};

async function loadReports() {
  var list = document.getElementById('adminReportList');
  list.innerHTML = '<p class="admin-list-loading">Carregando denúncias...</p>';

  try {
    var res = await fetch(API_BASE + '/reports/admin/all', { headers: authHeader() });
    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    allReports = await res.json();
    updateStats();
    renderReports();
  } catch (e) {
    list.innerHTML = '<p class="admin-list-error">Erro ao carregar denúncias.</p>';
  }
}

function setReportsFilter(filter) {
  currentReportsFilter = filter;
  document.querySelectorAll('#denuncias .filter-btn').forEach(function (b) { b.classList.remove('active'); });
  var idMap = {
    all:          'filterReportsAll',
    PENDING:      'filterReportsPending',
    UNDER_REVIEW: 'filterReportsUnder',
    RESOLVED:     'filterReportsResolved',
    REJECTED:     'filterReportsRejected'
  };
  var btn = document.getElementById(idMap[filter]);
  if (btn) btn.classList.add('active');
  renderReports();
}

function filterReports() {
  renderReports();
}

function renderReports() {
  var search  = (document.getElementById('searchReportsInput') || {}).value || '';
  var q       = search.toLowerCase().trim();
  var list    = document.getElementById('adminReportList');

  var visible = allReports.filter(function (r) {
    var matchFilter = currentReportsFilter === 'all' || r.status === currentReportsFilter;
    var matchSearch = !q ||
      (r.title         && r.title.toLowerCase().includes(q)) ||
      (r.reporterName  && r.reporterName.toLowerCase().includes(q)) ||
      (r.description   && r.description.toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  var count = document.getElementById('adminReportsCount');
  if (count) count.textContent = visible.length + ' denúncia' + (visible.length !== 1 ? 's' : '');

  if (!visible.length) {
    list.innerHTML = '<p class="admin-list-empty">Nenhuma denúncia encontrada.</p>';
    return;
  }

  list.innerHTML = '';
  visible
    .slice()
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
    .forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'admin-user-row';
      row.style.cursor = 'pointer';

      var natureLbl = REPORT_NATURE_LABELS[r.nature]  || r.nature  || '—';
      var statusLbl = REPORT_STATUS_LABELS[r.status]  || r.status  || '—';
      var badgeCls  = REPORT_STATUS_BADGE[r.status]   || 'admin-badge';
      var reporter  = r.reporterName || 'Usuário #' + r.reporterId;
      var createdAt = r.createdAt ? new Date(r.createdAt).toLocaleDateString('pt-BR') : '—';
      var initials  = OFAuth.getInitials(reporter);

      var attachBadge = (r.attachments && r.attachments.length)
        ? '<span class="admin-badge" style="background:rgba(255,255,255,.06);color:var(--muted2);border:1px solid var(--border)">📎 ' + r.attachments.length + '</span>'
        : '';

      row.innerHTML =
        '<div class="admin-user-avatar">' + initials + '</div>' +
        '<div class="admin-user-info">' +
          '<div class="admin-user-name">' + escHtmlAdmin(r.title) + '</div>' +
          '<div class="admin-user-email">' + natureLbl + ' · Denunciante: ' + escHtmlAdmin(reporter) + '</div>' +
        '</div>' +
        '<div class="admin-user-meta">' +
          attachBadge +
          '<span class="admin-badge ' + badgeCls + '">' + statusLbl + '</span>' +
          '<span class="admin-user-date">' + createdAt + '</span>' +
          '<div class="admin-user-actions">' +
            '<button class="btn-row" onclick="openReportModal(' + r.id + ');event.stopPropagation()">Revisar</button>' +
          '</div>' +
        '</div>';

      row.addEventListener('click', function () { openReportModal(r.id); });
      list.appendChild(row);
    });
}

function openReportModal(reportId) {
  var r = allReports.find(function (x) { return x.id === reportId; });
  if (!r) return;

  reviewingReportId = reportId;

  var natureLbl = REPORT_NATURE_LABELS[r.nature] || r.nature || '—';
  var reporter  = r.reporterName || 'Usuário #' + r.reporterId;
  var createdAt = r.createdAt ? new Date(r.createdAt).toLocaleString('pt-BR') : '—';
  var reviewedAt = r.reviewedAt ? new Date(r.reviewedAt).toLocaleString('pt-BR') : '—';

  document.getElementById('reportDetailGrid').innerHTML =
    '<div>' +
      '<div class="detail-label">Título</div>' +
      '<div class="detail-value">' + escHtmlAdmin(r.title) + '</div>' +
    '</div>' +
    '<div>' +
      '<div class="detail-label">Natureza</div>' +
      '<div class="detail-value">' + natureLbl + '</div>' +
    '</div>' +
    '<div>' +
      '<div class="detail-label">Denunciante</div>' +
      '<div class="detail-value">' + escHtmlAdmin(reporter) + '</div>' +
    '</div>' +
    '<div>' +
      '<div class="detail-label">Registrada em</div>' +
      '<div class="detail-value">' + createdAt + '</div>' +
    '</div>' +
    '<div class="detail-full">' +
      '<div class="detail-label">Descrição</div>' +
      '<div class="detail-value" style="white-space:pre-wrap;line-height:1.6">' + escHtmlAdmin(r.description) + '</div>' +
    '</div>' +
    (r.reviewedByName ? '<div class="detail-full"><div class="detail-label">Última análise por</div><div class="detail-value">' + escHtmlAdmin(r.reviewedByName) + ' em ' + reviewedAt + '</div></div>' : '') +
    (r.attachments && r.attachments.length ? '<div class="detail-full"><div class="detail-label">Anexos</div><div class="detail-value" style="color:var(--muted2)">' + r.attachments.length + ' arquivo(s) em anexo</div></div>' : '');

  document.getElementById('rmStatus').value = r.status;
  document.getElementById('rmNotes').value  = r.adminNotes || '';
  document.getElementById('rmMsg').textContent = '';
  document.getElementById('rmMsg').className   = 'admin-form-msg';

  document.getElementById('reportModal').classList.add('show');
}

function closeReportModal() {
  document.getElementById('reportModal').classList.remove('show');
  reviewingReportId = null;
}

async function submitReportReview() {
  if (!reviewingReportId) return;

  var status = document.getElementById('rmStatus').value;
  var notes  = document.getElementById('rmNotes').value.trim();
  var msg    = document.getElementById('rmMsg');
  var btn    = document.getElementById('rmSubmitBtn');

  btn.disabled    = true;
  btn.textContent = 'Salvando...';
  msg.textContent = '';
  msg.className   = 'admin-form-msg';

  try {
    var res = await fetch(API_BASE + '/reports/admin/updateStatus/' + reviewingReportId, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader()),
      body: JSON.stringify({ status: status, adminNotes: notes || null })
    });

    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var errMsg = (Array.isArray(data.errors) && data.errors.length)
        ? data.errors.map(function (e) { return e.message; }).join(' | ')
        : 'Erro ao salvar revisão.';
      msg.textContent = errMsg;
      msg.className   = 'admin-form-msg admin-form-msg-error';
      return;
    }

    msg.textContent = '✓ Denúncia atualizada com sucesso.';
    msg.className   = 'admin-form-msg admin-form-msg-success';

    await loadReports();
    setTimeout(closeReportModal, 800);

  } catch (_) {
    msg.textContent = 'Erro de conexão.';
    msg.className   = 'admin-form-msg admin-form-msg-error';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'SALVAR REVISÃO';
  }
}

function escHtmlAdmin(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.getElementById('reportModal').addEventListener('click', function (e) {
  if (e.target === this) closeReportModal();
});

/* ── Boot ────────────────────────────────────────────────────────── */

OFAuth.loadNav();
initAdmin();
initScrollReveal(0.08, null, 60);
initSidebarNavActive();
