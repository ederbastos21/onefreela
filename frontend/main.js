/* ──────────────────────────────────────────────────────────────────
   main.js — funções compartilhadas entre páginas do OneFreela
   ────────────────────────────────────────────────────────────────── */

/* ── Cursor glow ──────────────────────────────────────────────────
   Usado em: index, aboutUs, loginScreen, signupScreen, forgotPassword
   ────────────────────────────────────────────────────────────────── */
function initCursorGlow() {
  const glow = document.getElementById('cursorGlow');
  if (!glow) return;
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
}

/* ── Scroll reveal (IntersectionObserver em .reveal) ──────────────
   Usado em: index, aboutUs, freelancerProfile, clientProfile
   threshold: número entre 0 e 1 (padrão 0.1)
   staggerSelector: seletor CSS dos filhos que recebem transitionDelay
   staggerMs: delay em ms por item (padrão 0 = sem stagger)
   ────────────────────────────────────────────────────────────────── */
function initScrollReveal(threshold, staggerSelector, staggerMs) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: threshold || 0.1 });

  document.querySelectorAll('.reveal').forEach((el, i) => {
    if (staggerMs) el.style.transitionDelay = (i * staggerMs) + 'ms';
    observer.observe(el);
  });

  if (staggerSelector && !staggerMs) {
    document.querySelectorAll(staggerSelector).forEach((el, i) => {
      el.style.transitionDelay = (i * 80) + 'ms';
    });
  }
}

/* ── Painel de notificações ───────────────────────────────────────
   Usado em: index, serviceScreen, exploreFreelancers, cartScreen,
             chatScreenClient, chatScreenFreelancer
   ────────────────────────────────────────────────────────────────── */
function initNotifPanel() {
  const btn   = document.getElementById('notifBtn');
  const panel = document.getElementById('notifPanel');
  if (!btn || !panel) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    panel.classList.toggle('open');
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#notifBtn') && !e.target.closest('#notifPanel'))
      panel.classList.remove('open');
  });
}

/* ── Toast de feedback ────────────────────────────────────────────
   Usado em: serviceScreen, cartScreen
   ────────────────────────────────────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ── Redirecionamento para o chat conforme tipo de usuário ─────────
   Usado em: index, exploreFreelancers
   ────────────────────────────────────────────────────────────────── */
function goToChat() {
  const type = localStorage.getItem('of_user_type');
  if (type === 'freelancer') {
    window.location.href = 'chatScreenFreelancer.html';
  } else if (type === 'cliente') {
    window.location.href = 'chatScreenClient.html';
  } else {
    window.location.href = 'loginScreen.html';
  }
}

/* ── Sidebar: item ativo ao clicar ───────────────────────────────
   Usado em: freelancerProfile, clientProfile
   ────────────────────────────────────────────────────────────────── */
function initSidebarNavActive() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function () {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

/* ── Theme toggle (claro / escuro) ───────────────────────────────
   Persiste em localStorage como of_theme ('dark' | 'light').
   Injeta botão de toggle na nav de qualquer página.
   ────────────────────────────────────────────────────────────────── */
function initTheme() {
  const current = localStorage.getItem('of_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', current);

  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.title = 'Alternar tema';
  btn.setAttribute('aria-label', 'Alternar tema claro/escuro');
  _setThemeIcon(btn, current);

  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('of_theme', next);
    _setThemeIcon(btn, next);
  });

  const container = document.querySelector('.nav-cta') || document.querySelector('.nav-right');
  if (container) container.prepend(btn);
}

function _setThemeIcon(btn, theme) {
  if (theme === 'light') {
    btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  } else {
    btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  }
}

/* ── Chat: Enter para enviar + auto-resize do textarea ────────────
   Usado em: chatScreenClient, chatScreenFreelancer
   sendFn: referência para a função sendMsg() da página
   ────────────────────────────────────────────────────────────────── */
function initChatInput(sendFn) {
  const textarea = document.getElementById('msgInput');
  if (!textarea) return;

  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendFn();
    }
  });

  textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });
}

initTheme();
