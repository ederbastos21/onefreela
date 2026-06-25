const API_BASE = 'http://localhost:8080';

let allUsers      = [];
let currentFilter = 'all';
let editingUserId = null;
let detailUserId  = null;

let allWorks        = [];
let currentWorksFilter = 'all';

let allReports         = [];
let currentReportsFilter = 'all';
let reviewingReportId    = null;

let allDisputes        = [];
let reviewingDisputeId = null;

var ADMIN_PAGE_SIZE   = 10;
var adminUsersPage    = 1;
var adminWorksPage    = 1;
var adminReportsPage  = 1;
var adminDisputesPage = 1;

var ADMIN_SECTIONS = ['dashboard', 'usuarios', 'servicos', 'denuncias', 'disputas'];
var adminLoadedSections = {};

function switchAdminSection(id) {
  ADMIN_SECTIONS.forEach(function (s) {
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

  if (!adminLoadedSections[id]) {
    adminLoadedSections[id] = true;
    if (id === 'usuarios') loadUsers();
    if (id === 'servicos') loadWorks();
    if (id === 'denuncias') loadReports();
    if (id === 'disputas') loadDisputes();
  }
}

function renderAdminPagination(containerId, total, currentPage, setterName) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var totalPages = Math.ceil(total / ADMIN_PAGE_SIZE);
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  var start = (currentPage - 1) * ADMIN_PAGE_SIZE + 1;
  var end   = Math.min(currentPage * ADMIN_PAGE_SIZE, total);

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

function setAdminUsersPage(p)    { adminUsersPage    = p; renderUsers(); }
function setAdminWorksPage(p)    { adminWorksPage    = p; renderWorks(); }
function setAdminReportsPage(p)  { adminReportsPage  = p; renderReports(); }
function setAdminDisputesPage(p) { adminDisputesPage = p; renderDisputes(); }

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
  // Start on dashboard; other sections load on first visit
  switchAdminSection('dashboard');
  // Load all data in background so stats cards populate
  loadUsers();
  loadWorks();
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

  // Serviços: total + pending review highlight
  var statWorks = document.getElementById('statWorks');
  if (statWorks) statWorks.textContent = allWorks.length || '—';
  var worksPending = allWorks.filter(function (w) { return w.status === 'PENDING_REVIEW'; }).length;
  var statWorksPendingRow = document.getElementById('statWorksPendingRow');
  var statWorksPendingEl  = document.getElementById('statWorksPending');
  if (statWorksPendingRow && statWorksPendingEl) {
    if (worksPending > 0) {
      statWorksPendingEl.textContent     = worksPending + ' aguardando revisão';
      statWorksPendingRow.style.display  = '';
    } else {
      statWorksPendingRow.style.display  = 'none';
    }
  }

  // Denúncias: total + pending/under_review highlight
  var statReportsTotal = document.getElementById('statReportsTotal');
  if (statReportsTotal) statReportsTotal.textContent = allReports.length || '—';
  var reportsPending = allReports.filter(function (r) { return r.status === 'PENDING' || r.status === 'UNDER_REVIEW'; }).length;
  var statReportsPendingRow = document.getElementById('statReportsPendingRow');
  var statReportsPendingEl  = document.getElementById('statReportsPending');
  if (statReportsPendingRow && statReportsPendingEl) {
    if (reportsPending > 0) {
      statReportsPendingEl.textContent    = reportsPending + ' pendente' + (reportsPending > 1 ? 's' : '');
      statReportsPendingRow.style.display = '';
    } else {
      statReportsPendingRow.style.display = 'none';
    }
  }

  var reportsBadge = document.getElementById('reportsBadge');
  if (reportsBadge) {
    reportsBadge.textContent   = reportsPending;
    reportsBadge.style.display = reportsPending > 0 ? '' : 'none';
  }

  // Disputas: total + em aberto
  var statDisputes = document.getElementById('statDisputes');
  if (statDisputes) statDisputes.textContent = allDisputes.length || '—';
  var statDisputesPendingRow = document.getElementById('statDisputesPendingRow');
  var statDisputesPendingEl  = document.getElementById('statDisputesPending');
  if (statDisputesPendingRow && statDisputesPendingEl) {
    if (allDisputes.length > 0) {
      statDisputesPendingEl.textContent    = allDisputes.length + ' em aberto';
      statDisputesPendingRow.style.display = '';
    } else {
      statDisputesPendingRow.style.display = 'none';
    }
  }

  var disputesBadge = document.getElementById('disputesBadge');
  if (disputesBadge) {
    disputesBadge.textContent   = allDisputes.length;
    disputesBadge.style.display = allDisputes.length > 0 ? '' : 'none';
  }
}

function setFilter(filter) {
  currentFilter = filter;
  adminUsersPage = 1;
  document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
  var id  = 'filter' + filter.charAt(0).toUpperCase() + filter.slice(1);
  var btn = document.getElementById(id);
  if (btn) btn.classList.add('active');
  renderUsers();
}

function filterUsers() {
  adminUsersPage = 1;
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
    renderAdminPagination('usersPagination', 0, 1, 'setAdminUsersPage');
    return;
  }

  var start     = (adminUsersPage - 1) * ADMIN_PAGE_SIZE;
  var pageItems = filtered.slice(start, start + ADMIN_PAGE_SIZE);

  pageItems.forEach(function (u) {
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
        (u.blocked  ? '<span class="admin-badge admin-badge-blocked">Bloqueado</span>'    : '') +
        '<span class="admin-user-date">' + dateText + '</span>' +
      '</div>' +
      '<div class="admin-user-actions">' +
        '<button class="btn-row"            onclick="openEditModal('   + uid + ')">Editar</button>' +
        '<button class="btn-row btn-row-danger" onclick="toggleBlockUser(' + uid + ')">' + (u.blocked ? 'Desbloquear' : 'Bloquear') + '</button>' +
      '</div>';

    list.appendChild(row);
  });

  renderAdminPagination('usersPagination', filtered.length, adminUsersPage, 'setAdminUsersPage');
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
    (u.blocked  ? '<span class="admin-badge admin-badge-blocked">Bloqueado</span>'    : '');

  var toggleBtn = document.getElementById('detailToggleAdminBtn');
  if (toggleBtn) {
    toggleBtn.textContent = isAdminU ? 'Remover Admin' : 'Tornar Admin';
    toggleBtn.className   = isAdminU
      ? 'btn-detail-delete'
      : 'btn-detail-edit';
  }

  var blockBtn = document.getElementById('detailToggleBlockBtn');
  if (blockBtn) {
    blockBtn.textContent = u.blocked ? 'Desbloquear' : 'Bloquear';
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

function toggleUserBlock() {
  var id = detailUserId;
  closeDetailModal();
  toggleBlockUser(id);
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

  try {
    if (isEdit) {
      var res = await fetch(API_BASE + '/admin/users/' + editingUserId, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });

      if (!res.ok) {
        var data = await res.json().catch(function () { return {}; });
        var msg  = Array.isArray(data.errors) && data.errors.length
          ? data.errors.map(function (e) { return e.message; }).join(' • ')
          : 'Erro ao salvar alterações.';
        setUserFormMsg(msg, 'error');
        return;
      }

      var original = allUsers.find(function (x) { return x.id === editingUserId; });
      if (original && !!original.admin !== isAdminF) {
        var toggleEndpoint = isAdminF ? '/admin/makeUserAdmin/' : '/admin/removeUserAdmin/';
        await fetch(API_BASE + toggleEndpoint + editingUserId, { method: 'POST', headers: authHeader() });
      }
    } else {
      var payload = { name, email, password, cpf: '00000000000', birthday: '2000-01-01', phoneNumber: '00000000000', freelancer: type === 'freelancer' };
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

/* ── Block / Unblock ─────────────────────────────────────────────── */

async function toggleBlockUser(userId) {
  var u = allUsers.find(function (x) { return x.id === userId; });
  if (!u) return;

  var isBlocked = !!u.blocked;
  var endpoint  = isBlocked ? '/admin/unblockUser/' + userId : '/admin/blockUser/' + userId;

  try {
    var res = await fetch(API_BASE + endpoint, { method: 'POST', headers: authHeader() });

    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao alterar bloqueio do usuário.';
      alert(msg);
      return;
    }

    await loadUsers();
  } catch (e) {
    alert('Erro de conexão.');
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
  INACTIVE:       'Pausado',
  PENDING_REVIEW: 'Pendente',
  REJECTED:       'Rejeitado',
  BLOCKED:        'Bloqueado'
};

var WORK_STATUS_BADGE = {
  ACTIVE:         'admin-badge-order-paid',
  INACTIVE:       'admin-badge-work-inactive',
  PENDING_REVIEW: 'admin-badge-order-not_paid',
  REJECTED:       'admin-badge-order-refunded',
  BLOCKED:        'admin-badge-blocked'
};

function setWorksFilter(filter) {
  currentWorksFilter = filter;
  adminWorksPage = 1;
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

function filterWorks() { adminWorksPage = 1; renderWorks(); }

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
    renderAdminPagination('adminWorksPagination', 0, 1, 'setAdminWorksPage');
    return;
  }

  var wStart     = (adminWorksPage - 1) * ADMIN_PAGE_SIZE;
  var wPageItems = filtered.slice(wStart, wStart + ADMIN_PAGE_SIZE);

  wPageItems.forEach(function (w) {
    var statusLbl  = WORK_STATUS_LABELS[w.status] || w.status;
    var badgeCls   = WORK_STATUS_BADGE[w.status]  || 'admin-badge';
    var isPending  = w.status === 'PENDING_REVIEW';
    var isBlocked  = w.status === 'BLOCKED';
    var pauseLabel = w.status === 'ACTIVE' ? 'Pausar' : 'Reativar';
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
          (!isPending && !isBlocked ? '<button class="btn-row" onclick="pauseWork(' + w.id + ')">' + pauseLabel + '</button>' : '') +
          (!isPending && !isBlocked ? '<button class="btn-row btn-row-danger" onclick="blockWork(' + w.id + ')">Bloquear</button>' : '') +
          (isBlocked ? '<button class="btn-row" onclick="unblockWork(' + w.id + ')">Desbloquear</button>' : '') +
          '<button class="btn-row btn-row-danger" onclick="deleteWork(' + w.id + ')">Excluir</button>' +
        '</div>' +
      '</div>';

    list.appendChild(row);
  });

  renderAdminPagination('adminWorksPagination', filtered.length, adminWorksPage, 'setAdminWorksPage');
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
  try {
    var res = await fetch(API_BASE + '/admin/works/pauseWork/' + workId, {
      method: 'POST', headers: authHeader()
    });
    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao alterar status do serviço.';
      alert(msg);
      return;
    }
    await loadWorks();
  } catch (_) { alert('Erro de conexão.'); }
}

async function blockWork(workId) {
  if (!confirm('Bloquear este serviço? Ele deixará de aparecer para o cliente e para o freelancer.')) return;
  try {
    var res = await fetch(API_BASE + '/admin/works/blockWork/' + workId, {
      method: 'POST', headers: authHeader()
    });
    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao bloquear serviço.';
      alert(msg);
      return;
    }
    await loadWorks();
  } catch (_) { alert('Erro de conexão.'); }
}

async function unblockWork(workId) {
  try {
    var res = await fetch(API_BASE + '/admin/works/unblockWork/' + workId, {
      method: 'POST', headers: authHeader()
    });
    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao desbloquear serviço.';
      alert(msg);
      return;
    }
    await loadWorks();
  } catch (_) { alert('Erro de conexão.'); }
}

async function deleteWork(workId) {
  if (!confirm('Excluir este serviço? Esta ação não pode ser desfeita.')) return;
  try {
    var res = await fetch(API_BASE + '/admin/removeWork/' + workId, {
      method: 'POST', headers: authHeader()
    });
    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(function (e) { return e.message; }).join(' • ')
        : 'Erro ao excluir serviço.';
      alert(msg);
      return;
    }
    await loadWorks();
  } catch (_) { alert('Erro de conexão.'); }
}

document.getElementById('workReviewModal').addEventListener('click', function (e) {
  if (e.target === this) closeWorkReviewModal();
});

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
  adminReportsPage = 1;
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
  adminReportsPage = 1;
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
    renderAdminPagination('adminReportsPagination', 0, 1, 'setAdminReportsPage');
    return;
  }

  list.innerHTML = '';
  var sortedR    = visible.slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  var rStart     = (adminReportsPage - 1) * ADMIN_PAGE_SIZE;
  var rPageItems = sortedR.slice(rStart, rStart + ADMIN_PAGE_SIZE);

  rPageItems.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'admin-user-row';
      row.style.cursor = 'pointer';

      var natureLbl = REPORT_NATURE_LABELS[r.nature]  || r.nature  || '—';
      var statusLbl = REPORT_STATUS_LABELS[r.status]  || r.status  || '—';
      var badgeCls  = REPORT_STATUS_BADGE[r.status]   || 'admin-badge';
      var reporter  = r.reporterName || 'Usuário #' + r.reporterId;
      var createdAt = r.createdAt ? new Date(r.createdAt).toLocaleDateString('pt-BR') : '—';
      var initials  = OFAuth.getInitials(reporter);
      var workInfo  = r.workTitle ? ' · Serviço: ' + escHtmlAdmin(r.workTitle) : '';

      var attachBadge = (r.attachments && r.attachments.length)
        ? '<span class="admin-badge" style="background:rgba(255,255,255,.06);color:var(--muted2);border:1px solid var(--border)">📎 ' + r.attachments.length + '</span>'
        : '';

      row.innerHTML =
        '<div class="admin-user-avatar">' + initials + '</div>' +
        '<div class="admin-user-info">' +
          '<div class="admin-user-name">' + escHtmlAdmin(r.title) + '</div>' +
          '<div class="admin-user-email">' + natureLbl + ' · Denunciante: ' + escHtmlAdmin(reporter) + workInfo + '</div>' +
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

  renderAdminPagination('adminReportsPagination', sortedR.length, adminReportsPage, 'setAdminReportsPage');
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
    (r.workTitle ? '<div><div class="detail-label">Serviço denunciado</div><div class="detail-value">' + escHtmlAdmin(r.workTitle) + '</div></div>' : '') +
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
  adminDisputesPage = 1;
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
    renderAdminPagination('adminDisputesPagination', 0, 1, 'setAdminDisputesPage');
    return;
  }

  list.innerHTML = '';
  var dStart     = (adminDisputesPage - 1) * ADMIN_PAGE_SIZE;
  var dPageItems = visible.slice(dStart, dStart + ADMIN_PAGE_SIZE);

  dPageItems.forEach(function (item) {
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

  renderAdminPagination('adminDisputesPagination', visible.length, adminDisputesPage, 'setAdminDisputesPage');
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
        var attachHtml = '';
        if (m.attachments && m.attachments.length) {
          attachHtml = m.attachments.map(function (a) {
            var url = API_BASE + '/admin/disputes/' + orderItemId + '/attachment/' + (a.source || 'MESSAGE') + '/' + a.id + '/download';
            return '<div class="msg-file">' +
              '<span class="msg-file-icon">📄</span>' +
              '<div class="msg-file-info">' +
                '<div class="msg-file-name">' + escHtmlAdmin(a.originalName || 'arquivo') + '</div>' +
                '<div class="msg-file-size">' + formatFileSizeAdmin(a.fileSize) + '</div>' +
              '</div>' +
              '<button class="msg-file-download" data-url="' + escHtmlAdmin(url) + '" data-name="' + escHtmlAdmin(a.originalName || 'arquivo') + '" title="Baixar arquivo">⬇</button>' +
            '</div>';
          }).join('');
        }
        return '<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)">' +
          '<span style="color:' + labelColor + ';font-weight:600">' + escHtmlAdmin(icon + ' ' + (m.senderName || 'Sistema')) + '</span>' +
          '<span style="color:var(--muted);margin-left:8px;font-size:11px">' + time + '</span>' +
          '<div style="margin-top:4px">' + escHtmlAdmin(m.content || '') + '</div>' +
          attachHtml +
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

function formatFileSizeAdmin(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

async function downloadFileAdmin(url, filename) {
  try {
    var res = await fetch(url, { headers: authHeader() });
    if (!res.ok) { alert('Erro ao baixar arquivo.'); return; }
    var blob = await res.blob();
    var blobUrl = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'arquivo';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (_) {
    alert('Erro de conexão ao baixar arquivo.');
  }
}

document.getElementById('disputeMessages').addEventListener('click', function (e) {
  var btn = e.target.closest('.msg-file-download');
  if (!btn) return;
  downloadFileAdmin(btn.dataset.url, btn.dataset.name);
});

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
