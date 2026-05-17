OFAuth.loadNav();

let currentMethod = 'pix';
let pixInterval   = null;
let pixSeconds    = 15 * 60; // 15 minutes

/* ── Payment method switching ─────────────────────────────── */

function setMethod(method, btn) {
  document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.pay-pane').forEach(p => p.classList.remove('active'));

  btn.classList.add('active');
  document.getElementById('pane-' + method).classList.add('active');
  currentMethod = method;

  if (method === 'pix') {
    startPixTimer();
  } else {
    clearInterval(pixInterval);
  }
}

/* ── PIX countdown ────────────────────────────────────────── */

function startPixTimer() {
  clearInterval(pixInterval);
  const el = document.getElementById('pixCountdown');
  if (!el) return;

  pixInterval = setInterval(() => {
    pixSeconds--;
    if (pixSeconds <= 0) {
      clearInterval(pixInterval);
      el.textContent = '00:00';
      el.style.color = 'var(--red)';
      showToast('Código PIX expirado. Gere um novo.');
      return;
    }
    const m = Math.floor(pixSeconds / 60).toString().padStart(2, '0');
    const s = (pixSeconds % 60).toString().padStart(2, '0');
    el.textContent = m + ':' + s;
  }, 1000);
}

function copyPix() {
  const code = document.getElementById('pixCodeText').textContent.trim();
  navigator.clipboard.writeText(code)
    .then(() => showToast('✓ Código PIX copiado!'))
    .catch(() => showToast('Não foi possível copiar. Copie manualmente.'));
}

/* ── Credit card formatting & visual update ───────────────── */

function formatCardNumber(input) {
  const raw = input.value.replace(/\D/g, '').slice(0, 16);
  input.value = raw.match(/.{1,4}/g)?.join(' ') || raw;

  const padded = raw.padEnd(16, '·');
  const groups = padded.match(/.{1,4}/g);
  document.getElementById('cardVisualNumber').textContent = groups.join('  ');

  updateCardBrand(raw);
}

function updateCardName(input) {
  document.getElementById('cardVisualName').textContent =
    input.value.toUpperCase().trim() || 'SEU NOME';
}

function formatExpiry(input) {
  let raw = input.value.replace(/\D/g, '').slice(0, 4);
  if (raw.length >= 3) raw = raw.slice(0, 2) + '/' + raw.slice(2);
  input.value = raw;
  document.getElementById('cardVisualExpiry').textContent = raw || 'MM/AA';
}

function updateCardBrand(digits) {
  const first = digits[0];
  const el    = document.getElementById('cardBrand');
  if (!el) return;
  if (first === '4')      el.textContent = 'VISA';
  else if (first === '5') el.textContent = 'MASTER';
  else if (first === '3') el.textContent = 'AMEX';
  else if (first === '6') el.textContent = 'ELO';
  else                    el.textContent = 'CARD';
}

/* ── Boleto ───────────────────────────────────────────────── */

function copyBoleto() {
  const code = '10491.75714 15005.010924 02469.210003 7 10070000335500';
  navigator.clipboard.writeText(code)
    .then(() => showToast('✓ Código de barras copiado!'))
    .catch(() => showToast('Não foi possível copiar. Copie manualmente.'));
}

function downloadBoleto() {
  showToast('Preparando PDF do boleto...');
}

/* ── Payment validation & confirmation ────────────────────── */

function confirmPayment() {
  if (currentMethod === 'card' && !validateCard()) return;

  const btn = document.getElementById('confirmBtn');
  btn.textContent   = 'PROCESSANDO...';
  btn.disabled      = true;
  btn.style.opacity = '.7';

  /* persist order context for the confirmation page */
  const rand = Math.floor(Math.random() * 90000) + 10000;
  sessionStorage.setItem('of_last_order', JSON.stringify({
    orderId: '#OF-2026-' + rand,
    method:  currentMethod,
    date:    new Date().toLocaleDateString('pt-BR'),
  }));
  sessionStorage.removeItem('of_payment_done');

  setTimeout(() => {
    clearInterval(pixInterval);
    window.location.href = 'orderConfirmation.html';
  }, 1800);
}

function validateCard() {
  const num  = document.getElementById('cardNumber').value.replace(/\s/g, '');
  const name = document.getElementById('cardName').value.trim();
  const exp  = document.getElementById('cardExpiry').value;
  const cvv  = document.getElementById('cardCvv').value;

  if (num.length < 16)  { showToast('Número do cartão inválido.'); return false; }
  if (!name)            { showToast('Informe o nome impresso no cartão.'); return false; }
  if (exp.length < 5)   { showToast('Informe a validade do cartão.'); return false; }
  if (cvv.length < 3)   { showToast('Informe o CVV.'); return false; }
  return true;
}

/* ── Init ─────────────────────────────────────────────────── */

startPixTimer();
initNotifPanel();
