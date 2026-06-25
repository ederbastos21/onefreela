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

let allDisputes        = [];
let reviewingDisputeId = null;

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
  loadDisputes();
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

  var statDisputes = document.getElementById('statDisputes');
  if (statDisputes) statDisputes.textContent = allDisputes.length || '0';

  var disputesBadge = document.getElementById('disputesBadge');
  if (disputesBadge) {
    disputesBadge.textContent = allDisputes.length;
    disputesBadge.style.display = allDisputes.length > 0 ? '' : 'none';
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
    (u.verified ? '<span class="admin-badge admin-badge-verified">Verificado</span>' : '');

  var toggleBtn = document.getElementById('detailToggleAdminBtn');
  if (toggleBtn) {
    toggleBtn.textContent = isAdminU ? 'Remover Admin' : 'Tornar Admin';
    toggleBtn.className   = isAdminU
      ? 'btn-detail-delete'
      : 'btn-detail-edit';
  }

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

async function toggleUserAdmin() {
  var u = allUsers.find(function (x) { return x.id === detailUserId; });
  if (!u) return;

  var isAdmin  = !!u.admin;
  var endpoint = isAdmin
    ? '/admin/removeUserAdmin/' + detailUserId
    : '/admin/makeUserAdmin/'   + detailUserId;

  var btn = document.getElementById('detailToggleAdminBtn');
  btn.disabled    = true;
  btn.textContent = '...';

  try {
    var res = await fetch(API_BASE + endpoint, { method: 'POST', headers: authHeader() });
    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var msg  = (Array.isArray(data.errors) && data.errors.length)
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao alterar permissão.';
      alert(msg);
      btn.disabled    = false;
      btn.textContent = isAdmin ? 'Remover Admin' : 'Tornar Admin';
      return;
    }
    closeDetailModal();
    await loadUsers();
  } catch (_) {
    alert('Erro de conexão.');
    btn.disabled    = false;
    btn.textContent = isAdmin ? 'Remover Admin' : 'Tornar Admin';
  }
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

  if (isEdit) {
    setUserFormMsg('Edição de usuários pelo admin não está disponível nesta versão da API.', 'error');
    btn.disabled    = false;
    btn.textContent = 'SALVAR ALTERAÇÕES';
    return;
  }

  var payload = { name, email, password, cpf: '00000000000', birthday: '2000-01-01', phoneNumber: '00000000000', freelancer: type === 'freelancer' };

  try {
    var res = await fetch(API_BASE + '/users/register', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao cadastrar usuário.';
      setUserFormMsg(msg, 'error');
      return;
    }

    closeUserFormModal();
    await loadUsers();
  } catch (e) {
    setUserFormMsg('Erro de conexão.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'CADASTRAR';
  }
}

/* ── Delete ──────────────────────────────────────────────────────── */

async function confirmDeleteUser(userId) {
  var u    = allUsers.find(function (x) { return x.id === userId; });
  var name = u ? '"' + (u.name || 'este usuário') + '"' : 'este usuário';

  if (!confirm('Excluir ' + name + '? Esta ação não pode ser desfeita.')) return;

  try {
    var res = await fetch(API_BASE + '/admin/removeUser/' + userId, {
      method: 'POST',
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

var WORK_STATUS_LABELS = {
  ACTIVE:         'Ativo',
  INACTIVE:       'Inativo',
  PENDING_REVIEW: 'Pendente',
  REJECTED:       'Rejeitado'
};

var WORK_STATUS_BADGE = {
  ACTIVE:         'admin-badge-order-paid',
  INACTIVE:       'admin-badge-work-inactive',
  PENDING_REVIEW: 'admin-badge-order-not_paid',
  REJECTED:       'admin-badge-order-refunded'
};

function setWorksFilter(filter) {
  currentWorksFilter = filter;
  document.querySelectorAll('#servicos .filter-btn').forEach(function (b) { b.classList.remove('active'); });
  var map = {
    all:            'filterWorksAll',
    active:         'filterWorksActive',
    inactive:       'filterWorksInactive',
    pending_review: 'filterWorksPending'
  };
  var btn = document.getElementById(map[filter]);
  if (btn) btn.classList.add('active');
  renderWorks();
}

function filterWorks() { renderWorks(); }

function getFilteredWorks() {
  var query = (document.getElementById('searchWorksInput').value || '').toLowerCase().trim();
  return allWorks.filter(function (w) {
    var matchFilter =
      currentWorksFilter === 'all'            ? true :
      currentWorksFilter === 'active'         ? (w.status === 'ACTIVE') :
      currentWorksFilter === 'inactive'       ? (w.status === 'INACTIVE') :
      currentWorksFilter === 'pending_review' ? (w.status === 'PENDING_REVIEW') : true;

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
    var pendingCount = allWorks.filter(function (w) { return w.status === 'PENDING_REVIEW'; }).length;
    var pendingBadge = document.getElementById('filterWorksPendingCount');
    if (pendingBadge) pendingBadge.textContent = pendingCount > 0 ? ' (' + pendingCount + ')' : '';
    countEl.textContent = filtered.length + ' serviço' + (filtered.length !== 1 ? 's' : '') + ' encontrado' + (filtered.length !== 1 ? 's' : '');
  }

  list.innerHTML = '';

  if (filtered.length === 0) {
    list.innerHTML = '<p class="admin-list-empty">Nenhum serviço encontrado.</p>';
    return;
  }

  filtered.forEach(function (w) {
    var statusLbl  = WORK_STATUS_LABELS[w.status] || w.status;
    var badgeCls   = WORK_STATUS_BADGE[w.status]  || 'admin-badge';
    var isPending  = w.status === 'PENDING_REVIEW';
    var ownerName  = (w.owner && w.owner.name) ? w.owner.name : '—';
    var price      = w.price != null ? 'R$ ' + Number(w.price).toFixed(2).replace('.', ',') : '—';
    var date       = w.createdAt ? w.createdAt.split('T')[0] : '—';

    var row = document.createElement('div');
    row.className = 'admin-user-row';
    row.innerHTML =
      '<div class="admin-work-icon">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>' +
      '</div>' +
      '<div class="admin-user-info">' +
        '<div class="admin-user-name">' + escHtmlAdmin(w.title || 'Sem título') + '</div>' +
        '<div class="admin-user-email">' + escHtmlAdmin(w.category || '—') + ' · ' + escHtmlAdmin(ownerName) + '</div>' +
      '</div>' +
      '<div class="admin-user-meta">' +
        '<span class="admin-badge ' + badgeCls + '">' + statusLbl + '</span>' +
        '<span class="admin-user-date">' + price + '</span>' +
        '<span class="admin-user-date">' + date + '</span>' +
        '<div class="admin-user-actions">' +
          (isPending ? '<button class="btn-row" onclick="openWorkReviewModal(' + w.id + ')">Revisar</button>' : '') +
          (!isPending ? '<button class="btn-row" onclick="pauseWork(' + w.id + ')">Pausar</button>' : '') +
          '<button class="btn-row btn-row-danger" onclick="deleteWork(' + w.id + ')">Excluir</button>' +
        '</div>' +
      '</div>';

    list.appendChild(row);
  });
}

/* ── Work review modal ───────────────────────────────────────────── */

var reviewingWorkId = null;

function openWorkReviewModal(workId) {
  var w = allWorks.find(function (x) { return x.id === workId; });
  if (!w) return;
  reviewingWorkId = workId;

  document.getElementById('wrWorkTitle').textContent = w.title || 'Sem título';
  document.getElementById('wrNotes').value           = '';
  document.getElementById('wrMsg').textContent       = '';
  document.getElementById('wrMsg').className         = 'admin-form-msg';
  document.getElementById('workReviewModal').classList.add('show');
}

function closeWorkReviewModal() {
  document.getElementById('workReviewModal').classList.remove('show');
  reviewingWorkId = null;
}

async function submitWorkReview(status) {
  if (!reviewingWorkId) return;

  var notes = document.getElementById('wrNotes').value.trim();
  var msg   = document.getElementById('wrMsg');
  var btnA  = document.getElementById('wrApproveBtn');
  var btnR  = document.getElementById('wrRejectBtn');

  btnA.disabled = true;
  btnR.disabled = true;
  msg.textContent = 'Processando...';
  msg.className   = 'admin-form-msg';

  try {
    var res = await fetch(API_BASE + '/admin/works/reviewWork/' + reviewingWorkId, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader()),
      body: JSON.stringify({ status: status, adminNotes: notes || null })
    });

    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var errMsg = (Array.isArray(data.errors) && data.errors.length)
        ? data.errors.map(function (e) { return e.message; }).join(' | ')
        : 'Erro ao revisar serviço.';
      msg.textContent = errMsg;
      msg.className   = 'admin-form-msg admin-form-msg-error';
      btnA.disabled   = false;
      btnR.disabled   = false;
      return;
    }

    msg.textContent = status === 'ACTIVE' ? '✓ Serviço aprovado.' : '✓ Serviço rejeitado.';
    msg.className   = 'admin-form-msg admin-form-msg-success';
    await loadWorks();
    setTimeout(closeWorkReviewModal, 700);

  } catch (_) {
    msg.textContent = 'Erro de conexão.';
    msg.className   = 'admin-form-msg admin-form-msg-error';
    btnA.disabled   = false;
    btnR.disabled   = false;
  }
}

async function pauseWork(workId) {
  if (!confirm('Pausar este serviço?')) return;
  try {
    var res = await fetch(API_BASE + '/admin/works/pauseWork/' + workId, {
      method: 'POST', headers: authHeader()
    });
    if (!res.ok) { alert('Erro ao pausar serviço.'); return; }
    await loadWorks();
  } catch (_) { alert('Erro de conexão.'); }
}

async function deleteWork(workId) {
  if (!confirm('Excluir este serviço? Esta ação não pode ser desfeita.')) return;
  try {
    var res = await fetch(API_BASE + '/admin/removeWork/' + workId, {
      method: 'POST', headers: authHeader()
    });
    if (!res.ok) { alert('Erro ao excluir serviço.'); return; }
    await loadWorks();
  } catch (_) { alert('Erro de conexão.'); }
}

document.getElementById('workReviewModal').addEventListener('click', function (e) {
  if (e.target === this) closeWorkReviewModal();
});

/* ── Carts ───────────────────────────────────────────────────────── */

async function loadCarts() {
  var list = document.getElementById('adminCartList');
  if (list) list.innerHTML = '<p class="admin-list-empty" style="padding:24px;text-align:center;color:var(--muted2)">Gestão de carrinhos não disponível via API.</p>';
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
  if (list) list.innerHTML = '<p class="admin-list-empty" style="padding:24px;text-align:center;color:var(--muted2)">Gestão de pedidos não disponível via API.</p>';
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

/* ── Disputes ────────────────────────────────────────────────────── */

async function loadDisputes() {
  var list = document.getElementById('adminDisputeList');
  if (list) list.innerHTML = '<p class="admin-list-loading">Carregando disputas...</p>';

  try {
    var res = await fetch(API_BASE + '/admin/disputes', { headers: authHeader() });
    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    allDisputes = await res.json();
    updateStats();
    renderDisputes();
  } catch (e) {
    if (list) list.innerHTML = '<p class="admin-list-error">Erro ao carregar disputas.</p>';
  }
}

function filterDisputes() {
  renderDisputes();
}

function renderDisputes() {
  var search = (document.getElementById('searchDisputesInput') || {}).value || '';
  var q      = search.toLowerCase().trim();
  var list   = document.getElementById('adminDisputeList');

  var visible = allDisputes.filter(function (item) {
    return !q || String(item.id).includes(q);
  });

  var count = document.getElementById('adminDisputesCount');
  if (count) count.textContent = visible.length + ' disputa' + (visible.length !== 1 ? 's' : '');

  if (!visible.length) {
    list.innerHTML = '<p class="admin-list-empty">Nenhuma disputa em aberto. 🎉</p>';
    return;
  }

  list.innerHTML = '';
  visible.forEach(function (item) {
    var row = document.createElement('div');
    row.className = 'admin-user-row';
    row.style.cursor = 'pointer';

    var price     = item.totalPrice != null ? ('R$ ' + Number(item.totalPrice).toLocaleString('pt-BR', {minimumFractionDigits:2})) : '—';
    var tries     = item.deliveryTries != null ? item.deliveryTries + ' tentativa(s)' : '—';
    var createdAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '—';

    row.innerHTML =
      '<div class="admin-user-avatar" style="background:rgba(251,146,60,.15);color:#fb923c;">⚖️</div>' +
      '<div class="admin-user-info">' +
        '<div class="admin-user-name">Pedido Item #' + item.id + '</div>' +
        '<div class="admin-user-email">Valor: ' + escHtmlAdmin(price) + ' · ' + escHtmlAdmin(tries) + ' de entrega</div>' +
      '</div>' +
      '<div class="admin-user-meta">' +
        '<span class="admin-badge" style="background:rgba(251,146,60,.12);color:#fb923c;border:1px solid rgba(251,146,60,.3)">EM DISPUTA</span>' +
        '<span class="admin-user-date">' + createdAt + '</span>' +
        '<div class="admin-user-actions">' +
          '<button class="btn-row" onclick="openDisputeModal(' + item.id + ');event.stopPropagation()">Resolver</button>' +
        '</div>' +
      '</div>';

    row.addEventListener('click', function () { openDisputeModal(item.id); });
    list.appendChild(row);
  });
}

async function openDisputeModal(orderItemId) {
  var item = allDisputes.find(function (x) { return x.id === orderItemId; });
  if (!item) return;

  reviewingDisputeId = orderItemId;

  var price     = item.totalPrice != null ? ('R$ ' + Number(item.totalPrice).toLocaleString('pt-BR', {minimumFractionDigits:2})) : '—';
  var createdAt = item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '—';

  document.getElementById('disputeDetailGrid').innerHTML =
    '<div>' +
      '<div class="detail-label">Item ID</div>' +
      '<div class="detail-value">#' + item.id + '</div>' +
    '</div>' +
    '<div>' +
      '<div class="detail-label">Valor em disputa</div>' +
      '<div class="detail-value">' + escHtmlAdmin(price) + '</div>' +
    '</div>' +
    '<div>' +
      '<div class="detail-label">Tentativas de entrega</div>' +
      '<div class="detail-value">' + (item.deliveryTries || 0) + '</div>' +
    '</div>' +
    '<div>' +
      '<div class="detail-label">Criado em</div>' +
      '<div class="detail-value">' + createdAt + '</div>' +
    '</div>';

  var msgBox = document.getElementById('disputeMessages');
  msgBox.innerHTML = '<em style="color:var(--muted)">Carregando mensagens...</em>';

  document.getElementById('dmMsg').textContent = '';
  document.getElementById('dmMsg').className   = 'admin-form-msg';
  document.getElementById('dmFreelancerBtn').disabled = false;
  document.getElementById('dmClientBtn').disabled     = false;

  document.getElementById('disputeModal').classList.add('show');

  try {
    var res = await fetch(API_BASE + '/admin/disputes/' + orderItemId + '/messages', { headers: authHeader() });
    if (!res.ok) throw new Error();
    var messages = await res.json();

    if (!messages || !messages.length) {
      msgBox.innerHTML = '<em style="color:var(--muted)">Nenhuma mensagem ainda.</em>';
    } else {
      msgBox.innerHTML = messages.map(function (m) {
        var TYPE_ICONS = {
          TEXT:                          '💬',
          ATTACHMENT:                    '📎',
          DELIVERY:                      '📦',
          DELIVERY_ACCEPTED:             '✅',
          DELIVERY_REFUSED:              '❌',
          ADJUSTMENT_ACCEPTED:           '🔄',
          ADJUSTMENT_REFUSED:            '🚫',
          DISPUTE_OPENED:                '⚖️',
          DISPUTE_RESOLVED_FREELANCER:   '✓ Freelancer',
          DISPUTE_RESOLVED_CLIENT:       '↩ Cliente',
          DELIVERY_ACCEPTED_AFTER_FREEZE:'✅'
        };
        var TYPE_TONE_COLORS = {
          DELIVERY_REFUSED:    '#ef4444',
          ADJUSTMENT_REFUSED:  '#ef4444',
          DISPUTE_OPENED:      '#a855f7',
          DISPUTE_RESOLVED_FREELANCER: 'var(--green)',
          DISPUTE_RESOLVED_CLIENT:     '#a855f7'
        };
        var icon = TYPE_ICONS[m.type] || '•';
        var labelColor = TYPE_TONE_COLORS[m.type] || 'var(--text)';
        var time = m.sentAt ? new Date(m.sentAt).toLocaleString('pt-BR') : '';
        return '<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)">' +
          '<span style="color:' + labelColor + ';font-weight:600">' + escHtmlAdmin(icon + ' ' + (m.senderName || 'Sistema')) + '</span>' +
          '<span style="color:var(--muted);margin-left:8px;font-size:11px">' + time + '</span>' +
          '<div style="margin-top:4px">' + escHtmlAdmin(m.content || '') + '</div>' +
          (m.attachments && m.attachments.length ? '<div style="color:var(--muted);margin-top:2px">📎 ' + m.attachments.map(function (a) { return escHtmlAdmin(a.originalName || 'arquivo'); }).join(', ') + '</div>' : '') +
        '</div>';
      }).join('');
      msgBox.scrollTop = msgBox.scrollHeight;
    }
  } catch (_) {
    msgBox.innerHTML = '<em style="color:#ef4444">Erro ao carregar mensagens.</em>';
  }
}

function closeDisputeModal() {
  document.getElementById('disputeModal').classList.remove('show');
  reviewingDisputeId = null;
}

async function resolveDispute(side) {
  if (!reviewingDisputeId) return;

  var endpoint = side === 'freelancer'
    ? '/admin/disputes/' + reviewingDisputeId + '/resolveForFreelancer'
    : '/admin/disputes/' + reviewingDisputeId + '/resolveForClient';

  var msg = document.getElementById('dmMsg');
  var btnF = document.getElementById('dmFreelancerBtn');
  var btnC = document.getElementById('dmClientBtn');

  btnF.disabled = true;
  btnC.disabled = true;
  msg.textContent = 'Processando...';
  msg.className   = 'admin-form-msg';

  try {
    var res = await fetch(API_BASE + endpoint, {
      method:  'POST',
      headers: authHeader()
    });

    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var errMsg = (Array.isArray(data.errors) && data.errors.length)
        ? data.errors.map(function (e) { return e.message; }).join(' | ')
        : 'Erro ao resolver disputa.';
      msg.textContent = errMsg;
      msg.className   = 'admin-form-msg admin-form-msg-error';
      btnF.disabled = false;
      btnC.disabled = false;
      return;
    }

    msg.textContent = side === 'freelancer'
      ? '✓ Disputa resolvida em favor do freelancer. Pagamento liberado.'
      : '✓ Disputa resolvida em favor do cliente. Reembolso processado.';
    msg.className = 'admin-form-msg admin-form-msg-success';

    await loadDisputes();
    setTimeout(closeDisputeModal, 1200);

  } catch (_) {
    msg.textContent = 'Erro de conexão.';
    msg.className   = 'admin-form-msg admin-form-msg-error';
    btnF.disabled = false;
    btnC.disabled = false;
  }
}

document.getElementById('disputeModal').addEventListener('click', function (e) {
  if (e.target === this) closeDisputeModal();
});

/* ── Boot ────────────────────────────────────────────────────────── */

OFAuth.loadNav();
initAdmin();
initScrollReveal(0.08, null, 60);
initSidebarNavActive();
