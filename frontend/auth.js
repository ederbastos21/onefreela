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

  /* Toast autocontido — não depende de cada página já ter um <div id="toast">
     (várias páginas que chamam loadNav() não têm esse elemento). */
  function showAuthToast(msg) {
    var t = document.getElementById('ofAuthToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'ofAuthToast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(function () { t.classList.remove('show'); }, 3000);
  }

  /* ── Saldo no header ───────────────────────────────────────────────
     Injeta a pílula de saldo em qualquer página que chame loadNav() e
     tenha um elemento .nav-right — sem precisar editar cada HTML.
     Mesmo componente (chip + botão "Resgatar") usado tanto pro saldo
     do usuário comum quanto pelos saldos do admin, pra manter o
     visual idêntico entre os dois.
     ────────────────────────────────────────────────────────────────── */
  function buildChip(label, tone) {
    var chip = document.createElement('div');
    chip.className = 'nav-balance-chip' + (tone ? ' tone-' + tone : '');
    chip.innerHTML = '<span class="nav-balance-chip-label">' + label + '</span><span class="nav-balance-chip-value">—</span>';
    return chip;
  }

  function buildWithdrawBtn() {
    var btn = document.createElement('button');
    btn.className = 'btn-withdraw';
    btn.textContent = 'Resgatar';
    btn.disabled = true;
    return btn;
  }

  function wireWithdraw(btn, valueEl, endpoint) {
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      btn.disabled = true;
      fetch(API_BASE + endpoint, { method: 'POST', headers: authHdr() })
        .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (res) {
          if (res.ok) {
            valueEl.textContent = formatMoney(res.data.newBalance);
            showAuthToast('Resgatado: ' + formatMoney(res.data.withdrawnAmount));
          } else {
            var errMsg = (Array.isArray(res.data.errors) && res.data.errors.length) ? res.data.errors[0].message : 'Erro ao resgatar saldo.';
            showAuthToast(errMsg);
            btn.disabled = false;
          }
        })
        .catch(function () { showAuthToast('Erro de conexão.'); btn.disabled = false; });
    });
  }

  function loadChipValue(chip, endpoint, field) {
    return fetch(API_BASE + endpoint, { headers: authHdr() })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var amount = data ? Number(data[field]) : 0;
        chip.querySelector('.nav-balance-chip-value').textContent = formatMoney(amount);
        return amount;
      }).catch(function () { return 0; });
  }

  function renderBalance() {
    var navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    var existing = navRight.querySelector('.nav-balance-group');
    if (existing) existing.remove();

    var group = document.createElement('div');
    group.className = 'nav-balance-group';

    if (window.OFAuth.isAdmin()) {
      var ownChip    = buildChip('Seu saldo');
      var ownBtn     = buildWithdrawBtn();
      var activeChip = buildChip('Ativo', 'green');
      var activeBtn  = buildWithdrawBtn();
      var pendingChip = buildChip('Pendente', 'amber');

      var ownPair = document.createElement('div');
      ownPair.className = 'nav-balance-pair';
      ownPair.appendChild(ownChip);
      ownPair.appendChild(ownBtn);

      var activePair = document.createElement('div');
      activePair.className = 'nav-balance-pair';
      activePair.appendChild(activeChip);
      activePair.appendChild(activeBtn);

      group.appendChild(ownPair);
      group.appendChild(activePair);
      group.appendChild(pendingChip);

      loadChipValue(ownChip, '/balance/me', 'balance').then(function (amount) {
        ownBtn.disabled = !(amount > 0);
      });
      fetch(API_BASE + '/balance/platform', { headers: authHdr() })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data) return;
          activeChip.querySelector('.nav-balance-chip-value').textContent  = formatMoney(data.availableBalance);
          pendingChip.querySelector('.nav-balance-chip-value').textContent = formatMoney(data.pendingBalance);
          activeBtn.disabled = !(Number(data.availableBalance) > 0);
        }).catch(function () {});

      wireWithdraw(ownBtn, ownChip.querySelector('.nav-balance-chip-value'), '/balance/withdraw');
      wireWithdraw(activeBtn, activeChip.querySelector('.nav-balance-chip-value'), '/balance/platform/withdraw');

    } else {
      var chip = buildChip('Saldo', 'green');
      var btn  = buildWithdrawBtn();
      group.appendChild(chip);
      group.appendChild(btn);

      loadChipValue(chip, '/balance/me', 'balance').then(function (amount) {
        btn.disabled = !(amount > 0);
      });

      wireWithdraw(btn, chip.querySelector('.nav-balance-chip-value'), '/balance/withdraw');
    }

    var navUser = navRight.querySelector('.nav-user');
    if (navUser) navRight.insertBefore(group, navUser); else navRight.appendChild(group);
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

      var favLink = document.getElementById('navFavoritesLink');
      if (favLink && type !== 'freelancer') favLink.style.display = 'flex';

      if (type === 'freelancer') {
        var newServiceBtn = document.getElementById('navNovoServico');
        if (newServiceBtn) {
          newServiceBtn.style.display = 'flex';
          var onProfile = window.location.pathname.endsWith('profile.html') || window.location.pathname.endsWith('profile');
          newServiceBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (onProfile && typeof switchSection === 'function' && typeof openWorkModal === 'function') {
              switchSection('servicos');
              openWorkModal(null);
            } else {
              window.location.href = 'profile.html?newWork=1';
            }
          });
        }
      }

      var navLogo = document.querySelector('.nav-logo');
      if (navLogo) navLogo.setAttribute('href', 'exploreFreelancers.html');

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
