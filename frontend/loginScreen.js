initCursorGlow();

let selectedType = 'cliente';

function setUserType(type) {
  selectedType = type;
  const pill = document.getElementById('typePill');
  const btnC = document.getElementById('btnCliente');
  const btnF = document.getElementById('btnFreelancer');
  if (type === 'freelancer') {
    pill.classList.add('freelancer');
    btnC.classList.remove('active');
    btnF.classList.add('active');
  } else {
    pill.classList.remove('freelancer');
    btnC.classList.add('active');
    btnF.classList.remove('active');
  }
}

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
    const res  = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: senha })
    });
    const data = await res.json();

    if (!res.ok) { showMsg(data.message || 'E-mail ou senha incorretos.', 'error'); return; }

    localStorage.setItem('of_token',     data.token);
    localStorage.setItem('of_user_type', data.userType || selectedType);
    localStorage.setItem('of_email',     email);
    if (data.name) localStorage.setItem('of_name', data.name);

    const type = data.userType || selectedType;
    window.location.href = type === 'freelancer' ? 'freelancerProfile.html' : 'exploreFreelancers.html';

  } catch {
    showMsg('Erro de conexão. Verifique sua internet.', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

const senhaInput = document.getElementById('senha');
const eyeBtn    = document.getElementById('eyeBtn');
const eyeIcon   = document.getElementById('eyeIcon');
eyeBtn.addEventListener('click', () => {
  const showing = senhaInput.type === 'text';
  senhaInput.type = showing ? 'password' : 'text';
  eyeIcon.innerHTML = showing
    ? `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`
    : `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;
});

const toggle = document.getElementById('toggle');
toggle.addEventListener('click', () => toggle.classList.toggle('on'));

const loginBtn = document.getElementById('loginBtn');
loginBtn.addEventListener('pointerdown', e => {
  const rect = loginBtn.getBoundingClientRect();
  const r = document.createElement('span');
  r.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  /* dynamic: size and position computed from pointer + button rect */
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
  loginBtn.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
});

document.querySelectorAll('.draggable').forEach(el => {
  let dragging = false;
  let clone = null;
  let offX, offY;

  const onPointerDown = e => {
    if (e.button !== 0) return;
    e.preventDefault();

    dragging = true;
    const rect = el.getBoundingClientRect();
    offX = e.clientX - rect.left;
    offY = e.clientY - rect.top;

    clone = el.cloneNode(true);
    /* dynamic: clone needs position:fixed with runtime-computed coordinates and lift animation */
    clone.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      margin: 0;
      pointer-events: none;
      z-index: 9999;
      opacity: .92;
      transform: scale(1.04) rotate(-1.5deg);
      transition: transform .15s, box-shadow .15s;
      box-shadow: 0 20px 60px rgba(0,0,0,.5), 0 0 30px rgba(127,255,0,.18);
      animation: none;
      filter: drop-shadow(0 0 12px rgba(127,255,0,.3));
    `;
    document.body.appendChild(clone);
    el.classList.add('drag-source');

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup',   onPointerUp);
  };

  const onPointerMove = e => {
    if (!dragging || !clone) return;
    /* dynamic: position tracks pointer in real time */
    clone.style.left = (e.clientX - offX) + 'px';
    clone.style.top  = (e.clientY - offY) + 'px';
  };

  const onPointerUp = () => {
    if (!dragging) return;
    dragging = false;

    if (clone) {
      const rect = el.getBoundingClientRect();
      /* dynamic: spring-back animates to live getBoundingClientRect position */
      clone.style.transition = 'left .5s cubic-bezier(.34,1.56,.64,1), top .5s cubic-bezier(.34,1.56,.64,1), opacity .35s, transform .35s';
      clone.style.left      = rect.left + 'px';
      clone.style.top       = rect.top  + 'px';
      clone.style.transform = 'scale(1) rotate(0deg)';
      clone.style.opacity   = '0';
      clone.addEventListener('transitionend', () => {
        clone && clone.remove();
        clone = null;
      }, { once: true });
    }

    el.classList.remove('drag-source');
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup',   onPointerUp);
  };

  el.addEventListener('pointerdown', onPointerDown);
});
