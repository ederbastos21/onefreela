initCursorGlow();

const perks = [
  { icon: '🔍', title: 'Encontre talentos',    desc: 'Navegue por centenas de freelancers verificados prontos para seu projeto.' },
  { icon: '💰', title: 'Pagamentos seguros',    desc: 'Seu dinheiro fica protegido até a entrega ser aprovada.' },
  { icon: '📈', title: 'Cresça na plataforma', desc: 'Gerencie projetos, entregas e reputação em um só lugar.' },
];

const perksWrap = document.getElementById('perksWrap');
perks.forEach((p, i) => {
  const el = document.createElement('div');
  el.className = 'perk';
  el.innerHTML = `
    <div class="perk-icon">${p.icon}</div>
    <div class="perk-text"><strong>${p.title}</strong> — ${p.desc}</div>`;
  perksWrap.appendChild(el);
  setTimeout(() => el.classList.add('visible'), 80 + i * 100);
});

document.getElementById('eyeBtn').addEventListener('click', () => {
  const input   = document.getElementById('senha');
  const icon    = document.getElementById('eyeIcon');
  const showing = input.type === 'text';
  input.type    = showing ? 'password' : 'text';
  icon.innerHTML = showing
    ? `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`
    : `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;
});

document.getElementById('toggle').addEventListener('click', e => {
  e.currentTarget.classList.toggle('on');
});

const API = 'http://localhost:8080';

function showMsg(text, type) {
  const el = document.getElementById('formMsg');
  el.textContent = text;
  el.className = 'form-msg ' + type;
}

async function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  if (!email || !senha) { showMsg('Preencha e-mail e senha.', 'error'); return; }

  const btn = document.getElementById('loginBtn');
  const originalText = btn.textContent;
  btn.textContent = 'ENTRANDO...';
  btn.disabled = true;

  try {
    const res = await fetch(API + '/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: senha })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(e => e.message).join(' | ')
        : 'E-mail ou senha incorretos.';
      showMsg(msg, 'error');
      return;
    }

    const token = await res.text();

    const userRes = await fetch(API + '/users/loginToken', {
      method: 'POST',
      headers: { 'Authorization': token }
    });
    const userData = await userRes.json();

    const userType = userData.freelancer ? 'freelancer' : 'cliente';
    localStorage.setItem('of_token',     token);
    localStorage.setItem('of_user_type', userType);
    localStorage.setItem('of_email',     email);
    if (userData.name) localStorage.setItem('of_name', userData.name);
    localStorage.setItem('of_is_admin', userData.admin ? 'true' : 'false');

    window.location.href = userType === 'freelancer' ? 'profile.html' : 'exploreFreelancers.html';

  } catch {
    showMsg('Erro de conexão. Verifique sua internet.', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

setTimeout(() => {
  document.getElementById('testimonial').classList.add('visible');
}, 500);
