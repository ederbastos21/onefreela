initCursorGlow();

let currentStep = 1;
let userEmail   = '';
let timerInterval = null;

function render(step) {
  const container = document.getElementById('stepContainer');

  if (step === 1) {
    container.innerHTML = `
      <div class="step" id="step">
        <div class="step-icon">📧</div>
        <div class="progress">
          <div class="dot dot-1 active"></div>
          <div class="dot dot-2"></div>
          <div class="dot dot-3"></div>
        </div>
        <h2 class="step-title">ESQUECEU<br>A <span class="green">SENHA?</span></h2>
        <p class="step-desc">Sem problemas. Digite seu e-mail cadastrado e enviaremos um código de verificação.</p>
        <div class="field">
          <label for="emailInput">E-mail cadastrado</label>
          <input type="email" id="emailInput" placeholder="seu@email.com" />
          <span class="error-msg" id="emailError">Por favor, insira um e-mail válido.</span>
        </div>
        <button class="btn" id="btnStep1" onclick="handleStep1(event)">ENVIAR CÓDIGO</button>
      </div>`;

    document.getElementById('emailInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') handleStep1({ clientX: 0, clientY: 0 });
    });

  } else if (step === 2) {
    container.innerHTML = `
      <div class="step" id="step">
        <div class="step-icon">🔑</div>
        <div class="progress">
          <div class="dot dot-1 active"></div>
          <div class="dot dot-2 active"></div>
          <div class="dot dot-3"></div>
        </div>
        <h2 class="step-title">CÓDIGO DE<br><span class="green">VERIFICAÇÃO</span></h2>
        <p class="step-desc">Enviamos um código de 6 dígitos para <strong>${userEmail}</strong>. Verifique sua caixa de entrada.</p>
        <div class="otp-wrap" id="otpWrap">
          <input class="otp-input" maxlength="1" inputmode="numeric" />
          <input class="otp-input" maxlength="1" inputmode="numeric" />
          <input class="otp-input" maxlength="1" inputmode="numeric" />
          <input class="otp-input" maxlength="1" inputmode="numeric" />
          <input class="otp-input" maxlength="1" inputmode="numeric" />
          <input class="otp-input" maxlength="1" inputmode="numeric" />
        </div>
        <div class="resend-row">
          <span class="resend-text">Não recebeu?</span>
          <div style="display:flex;align-items:center;gap:8px">
            <button class="resend-btn" id="resendBtn" onclick="startTimer()" disabled>Reenviar</button>
            <span class="timer" id="timerDisplay">00:59</span>
          </div>
        </div>
        <button class="btn" id="btnStep2" onclick="handleStep2(event)">VERIFICAR CÓDIGO</button>
      </div>`;

    setupOTP();
    startTimer();

  } else if (step === 3) {
    container.innerHTML = `
      <div class="step" id="step">
        <div class="step-icon">🔒</div>
        <div class="progress">
          <div class="dot dot-1 active"></div>
          <div class="dot dot-2 active"></div>
          <div class="dot dot-3 active"></div>
        </div>
        <h2 class="step-title">NOVA<br><span class="green">SENHA</span></h2>
        <p class="step-desc">Escolha uma senha forte. Ela deve ter pelo menos 8 caracteres, com letras, números e símbolos.</p>
        <div class="field">
          <label>Nova senha</label>
          <div class="input-wrap">
            <input type="password" id="novaSenha" placeholder="Mínimo 8 caracteres" oninput="checkStrength(this.value)" />
            <button class="eye-btn" onclick="toggleEye('novaSenha','eyeIcon1')" type="button">
              <svg id="eyeIcon1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <div class="strength-bar"><div class="strength-fill" id="strengthFill"></div></div>
          <span class="strength-label" id="strengthLabel"></span>
        </div>
        <div class="field">
          <label>Confirmar senha</label>
          <div class="input-wrap">
            <input type="password" id="confirmaSenha" placeholder="Repita a senha" />
            <button class="eye-btn" onclick="toggleEye('confirmaSenha','eyeIcon2')" type="button">
              <svg id="eyeIcon2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <span class="error-msg" id="confirmError">As senhas não coincidem.</span>
        </div>
        <button class="btn" id="btnStep3" onclick="handleStep3(event)">REDEFINIR SENHA</button>
      </div>`;

  } else if (step === 4) {
    container.innerHTML = `
      <div class="step" id="step" style="text-align:center">
        <div class="success-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7fff00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline class="success-check" points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 class="success-title">SENHA<br><span>REDEFINIDA!</span></h2>
        <p class="success-desc">Sua senha foi alterada com sucesso.<br>Agora você já pode fazer login com a nova senha.</p>
        <a href="loginScreen.html" style="text-decoration:none">
          <button class="btn">IR PARA O LOGIN</button>
        </a>
      </div>`;
  }
}

function handleStep1(e) {
  const input = document.getElementById('emailInput');
  const error = document.getElementById('emailError');
  const val   = input.value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  if (!valid) {
    input.classList.add('error');
    error.classList.add('show');
    input.focus();
    return;
  }
  input.classList.remove('error');
  error.classList.remove('show');
  userEmail = val;

  ripple(document.getElementById('btnStep1'), e);
  transition(() => { currentStep = 2; render(2); });
}

function setupOTP() {
  const inputs = document.querySelectorAll('.otp-input');
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 1);
      if (inp.value) {
        inp.classList.add('filled');
        if (i < inputs.length - 1) inputs[i + 1].focus();
      } else {
        inp.classList.remove('filled');
      }
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && i > 0) inputs[i - 1].focus();
      if (e.key === 'Enter') handleStep2({ clientX: 0, clientY: 0 });
    });
    inp.addEventListener('paste', e => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      [...paste].slice(0, 6).forEach((ch, j) => {
        if (inputs[i + j]) { inputs[i + j].value = ch; inputs[i + j].classList.add('filled'); }
      });
      const next = Math.min(i + paste.length, inputs.length - 1);
      inputs[next].focus();
    });
  });
  inputs[0].focus();
}

function startTimer() {
  clearInterval(timerInterval);
  let secs = 59;
  const btn   = document.getElementById('resendBtn');
  const timer = document.getElementById('timerDisplay');
  if (btn) btn.disabled = true;

  timerInterval = setInterval(() => {
    if (!document.getElementById('timerDisplay')) { clearInterval(timerInterval); return; }
    secs--;
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    if (timer) timer.textContent = `${m}:${s}`;
    if (secs <= 0) {
      clearInterval(timerInterval);
      if (btn)   { btn.disabled = false; }
      if (timer) { timer.textContent = ''; }
    }
  }, 1000);
}

function handleStep2(e) {
  const inputs = document.querySelectorAll('.otp-input');
  const code   = [...inputs].map(i => i.value).join('');
  if (code.length < 6) {
    inputs.forEach(i => { if (!i.value) i.classList.add('input-otp-error'); });
    setTimeout(() => inputs.forEach(i => i.classList.remove('input-otp-error')), 1200);
    return;
  }
  clearInterval(timerInterval);
  ripple(document.getElementById('btnStep2'), e);
  transition(() => { currentStep = 3; render(3); });
}

function toggleEye(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon  = document.getElementById(iconId);
  const show  = input.type === 'text';
  input.type  = show ? 'password' : 'text';
  icon.innerHTML = show
    ? `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`
    : `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;
}

function checkStrength(val) {
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!fill) return;
  let score = 0;
  if (val.length >= 8)          score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const lvl = [
    { w: '0%',   c: 'transparent', t: '' },
    { w: '25%',  c: '#ef4444',     t: 'Fraca' },
    { w: '50%',  c: '#f97316',     t: 'Razoável' },
    { w: '75%',  c: '#eab308',     t: 'Boa' },
    { w: '100%', c: '#7fff00',     t: 'Forte ✓' },
  ];
  /* dynamic: width and color vary continuously with password score (0–4) */
  fill.style.width      = lvl[score].w;
  fill.style.background = lvl[score].c;
  label.textContent     = lvl[score].t;
}

function handleStep3(e) {
  const nova     = document.getElementById('novaSenha').value;
  const confirma = document.getElementById('confirmaSenha').value;
  const err      = document.getElementById('confirmError');

  if (nova.length < 8) {
    document.getElementById('novaSenha').focus();
    return;
  }
  if (nova !== confirma) {
    document.getElementById('confirmaSenha').classList.add('error');
    err.classList.add('show');
    return;
  }
  err.classList.remove('show');
  ripple(document.getElementById('btnStep3'), e);
  transition(() => { currentStep = 4; render(4); });
}

function transition(cb) {
  const step = document.getElementById('step');
  if (!step) { cb(); return; }
  step.classList.add('leaving');
  setTimeout(() => { cb(); }, 300);
}

function ripple(btn, e) {
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const r    = document.createElement('span');
  r.className = 'ripple';
  const size  = Math.max(rect.width, rect.height);
  const x     = (e.clientX || rect.left + rect.width / 2)  - rect.left - size / 2;
  const y     = (e.clientY || rect.top  + rect.height / 2) - rect.top  - size / 2;
  r.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  btn.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
}

render(1);
