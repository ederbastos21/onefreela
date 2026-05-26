const API_BASE = 'http://localhost:8080';

let allUsers      = [];
let currentFilter = 'all';
let editingUserId = null;
let detailUserId  = null;

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

  document.getElementById('statTotal').textContent      = total;
  document.getElementById('statFreelancers').textContent = freelancers;
  document.getElementById('statClients').textContent    = clients;
  document.getElementById('statAdmins').textContent     = admins;

  var badge = document.getElementById('usersBadge');
  if (badge) { badge.textContent = total; badge.style.display = total > 0 ? '' : 'none'; }
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

/* ── Boot ────────────────────────────────────────────────────────── */

OFAuth.loadNav();
initAdmin();
initScrollReveal(0.08, null, 60);
initSidebarNavActive();
