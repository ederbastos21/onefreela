(function () {
  var API_BASE = 'http://localhost:8080';
  var AUTH_PAGES = ['loginScreen.html', 'signupScreen.html', 'index.html', 'forgotPassword.html'];

  function onAuthPage() {
    var path = window.location.pathname;
    return AUTH_PAGES.some(function (p) { return path.endsWith(p) || path === '/' || path === ''; });
  }

  function getInitials(name) {
    if (!name || !name.trim()) return '?';
    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getShortName(name) {
    if (!name || !name.trim()) return '';
    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return parts[0] + ' ' + parts[parts.length - 1][0] + '.';
  }

  var STORAGE_KEYS = ['of_token', 'of_name', 'of_user_type', 'of_email', 'of_is_admin', 'of_token_expiry'];

  function formatMoney(v) {
    return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }

  function authHdr() {
    return { Authorization: localStorage.getItem('of_token') || '' };
  }

  /* ── Saldo no header ───────────────────────────────────────────────
     Injeta a pílula de saldo em qualquer página que chame loadNav() e
     tenha um elemento .nav-right — sem precisar editar cada HTML.
     ────────────────────────────────────────────────────────────────── */
  function renderBalance() {
    var navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    var existing = navRight.querySelector('.nav-balance, .nav-balance-admin');
    if (existing) existing.remove();

    var isAdmin = window.OFAuth.isAdmin();
    var navUser = navRight.querySelector('.nav-user');

    if (isAdmin) {
      var wrap = document.createElement('div');
      wrap.className = 'nav-balance-admin';
      wrap.innerHTML =
        '<div class="nav-balance-chip" id="navBalanceChipUser"><div class="nav-balance-chip-label">Seu saldo</div><div class="nav-balance-chip-value">—</div></div>' +
        '<div class="nav-balance-chip tone-green" id="navBalanceChipAvailable"><div class="nav-balance-chip-label">Ativo plataforma</div><div class="nav-balance-chip-value">—</div></div>' +
        '<div class="nav-balance-chip tone-amber" id="navBalanceChipPending"><div class="nav-balance-chip-label">Pendente plataforma</div><div class="nav-balance-chip-value">—</div></div>';

      if (navUser) navRight.insertBefore(wrap, navUser); else navRight.appendChild(wrap);

      fetch(API_BASE + '/balance/me', { headers: authHdr() })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          var el = document.getElementById('navBalanceChipUser');
          if (el && data) el.querySelector('.nav-balance-chip-value').textContent = formatMoney(data.balance);
        }).catch(function () {});

      fetch(API_BASE + '/balance/platform', { headers: authHdr() })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data) return;
          var avail = document.getElementById('navBalanceChipAvailable');
          var pend  = document.getElementById('navBalanceChipPending');
          if (avail) avail.querySelector('.nav-balance-chip-value').textContent = formatMoney(data.availableBalance);
          if (pend)  pend.querySelector('.nav-balance-chip-value').textContent  = formatMoney(data.pendingBalance);
        }).catch(function () {});

    } else {
      var pill = document.createElement('div');
      pill.className = 'nav-balance';
      pill.innerHTML =
        '<div class="nav-balance-text"><span class="nav-balance-label">Saldo</span><span class="nav-balance-value" id="navBalanceValue">—</span></div>' +
        '<button class="btn-nav-withdraw" id="navWithdrawBtn" disabled>Resgatar</button>';

      if (navUser) navRight.insertBefore(pill, navUser); else navRight.appendChild(pill);

      var btn = pill.querySelector('#navWithdrawBtn');
      btn.addEventListener('click', function () {
        if (!window.confirm('Resgatar todo o saldo disponível?')) return;
        btn.disabled = true;
        fetch(API_BASE + '/balance/withdraw', { method: 'POST', headers: authHdr() })
          .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
          .then(function (res) {
            var valueEl = document.getElementById('navBalanceValue');
            if (res.ok) {
              if (valueEl) valueEl.textContent = formatMoney(res.data.newBalance);
              var msg = 'Saldo de ' + formatMoney(res.data.withdrawnAmount) + ' resgatado com sucesso!';
              if (typeof window.showToast === 'function') window.showToast(msg); else alert(msg);
            } else {
              var errMsg = (Array.isArray(res.data.errors) && res.data.errors.length) ? res.data.errors[0].message : 'Erro ao resgatar saldo.';
              alert(errMsg);
              btn.disabled = false;
            }
          })
          .catch(function () { alert('Erro de conexão.'); btn.disabled = false; });
      });

      fetch(API_BASE + '/balance/me', { headers: authHdr() })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          var valueEl = document.getElementById('navBalanceValue');
          if (valueEl && data) valueEl.textContent = formatMoney(data.balance);
          if (data && Number(data.balance) > 0) btn.disabled = false;
        }).catch(function () {});
    }
  }

  window.OFAuth = {
    getName:     function () { return localStorage.getItem('of_name')        || ''; },
    getType:     function () { return localStorage.getItem('of_user_type')   || ''; },
    getEmail:    function () { return localStorage.getItem('of_email')       || ''; },
    getToken:    function () { return localStorage.getItem('of_token')       || ''; },
    isAdmin:     function () { return localStorage.getItem('of_is_admin')   === 'true'; },
    getExpiry:   function () { return parseInt(localStorage.getItem('of_token_expiry') || '0', 10); },
    getInitials:  getInitials,
    getShortName: getShortName,

    isTokenExpired: function () {
      var expiry = this.getExpiry();
      return expiry === 0 || Date.now() > expiry;
    },

    isLoggedIn: function () {
      return !!this.getToken() && !this.isTokenExpired();
    },

    logout: function () {
      STORAGE_KEYS.forEach(function (k) { localStorage.removeItem(k); });
      window.location.href = 'loginScreen.html';
    },

    requireLogin: function () {
      if (!this.getToken()) {
        window.location.href = 'loginScreen.html';
        return false;
      }
      if (this.isTokenExpired()) {
        this.logout();
        return false;
      }
      return true;
    },

    /* Populates #navAvatar, #navUserName, #navUserRole */
    loadNav: function () {
      var name      = this.getName();
      var type      = this.getType();
      var initials  = getInitials(name);
      var shortName = getShortName(name);
      var roleLabel = this.isAdmin() ? 'Administrador' : (type === 'freelancer' ? 'Freelancer' : 'Cliente');

      var navAvatar   = document.getElementById('navAvatar');
      var navUserName = document.getElementById('navUserName');
      var navUserRole = document.getElementById('navUserRole');

      if (navAvatar) {
        navAvatar.textContent = initials;
        if (navAvatar.tagName === 'A') navAvatar.href = 'profile.html';
      }
      if (navUserName) navUserName.textContent = shortName;
      if (navUserRole) navUserRole.textContent = roleLabel;

      var adminBtn = document.getElementById('adminAreaBtn');
      if (adminBtn && this.isAdmin()) adminBtn.style.display = 'flex';

      if (this.isLoggedIn()) renderBalance();
    },

    /* Populates profile hero + settings inputs on profile pages */
    loadProfile: function () {
      var name     = this.getName();
      var email    = this.getEmail();
      var initials = getInitials(name);
      var parts    = name ? name.trim().split(/\s+/) : [];

      var profileAvatar = document.getElementById('profileAvatar');
      var profileName   = document.getElementById('profileName');
      var profileEmail  = document.getElementById('profileEmail');
      var settingNome   = document.getElementById('settingNome');
      var settingSobre  = document.getElementById('settingSobrenome');
      var settingEmail  = document.getElementById('settingEmail');

      if (profileAvatar) profileAvatar.textContent = initials;
      if (profileName)   profileName.textContent   = name || 'Sem nome';
      if (profileEmail)  profileEmail.textContent  = email;

      if (settingNome  && parts.length)     settingNome.value  = parts[0];
      if (settingSobre && parts.length > 1) settingSobre.value = parts.slice(1).join(' ');
      if (settingEmail && email)            settingEmail.value = email;
    }
  };

  /* ── Interceptor global de fetch ──────────────────────────────────
     Captura respostas 401 de qualquer requisição e força logout,
     exceto nas páginas de autenticação para evitar loop de redirecionamento.
     ────────────────────────────────────────────────────────────────── */
  var _nativeFetch = window.fetch.bind(window);
  window.fetch = async function () {
    var response = await _nativeFetch.apply(this, arguments);
    if (response.status === 401 && !onAuthPage() && window.OFAuth.getToken()) {
      window.OFAuth.logout();
    }
    return response;
  };

  /* ── Verificação de sessão no carregamento da página ──────────────
     Roda imediatamente. Se o token estiver expirado fora de uma página
     de autenticação, faz logout automático.
     ────────────────────────────────────────────────────────────────── */
  (function checkSessionOnLoad() {
    if (onAuthPage()) return;
    if (window.OFAuth.getToken() && window.OFAuth.isTokenExpired()) {
      window.OFAuth.logout();
    }
  })();

  /* ── Verificação periódica de sessão ──────────────────────────────
     Enquanto o usuário permanece na página, verifica a cada 60 segundos
     se o token ainda é válido. Encerra a sessão assim que expirar.
     ────────────────────────────────────────────────────────────────── */
  (function startSessionWatcher() {
    if (onAuthPage()) return;
    setInterval(function () {
      if (window.OFAuth.getToken() && window.OFAuth.isTokenExpired()) {
        window.OFAuth.logout();
      }
    }, 60000);
  })();
})();
