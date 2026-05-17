OFAuth.loadNav();
initNotifPanel();

/* ── Read order context from sessionStorage (set by paymentScreen.js) ── */

const orderData = (() => {
  try {
    return JSON.parse(sessionStorage.getItem('of_last_order') || '{}');
  } catch {
    return {};
  }
})();

const ORDER_ID   = orderData.orderId   || generateOrderId();
const PAY_METHOD = orderData.method    || 'pix';
const ORDER_DATE = orderData.date      || new Date().toLocaleDateString('pt-BR');

function generateOrderId() {
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return '#OF-2026-' + rand;
}

/* ── Processing animation sequence ─────────────────────────────────── */

const STEPS = [
  { id: 'procStep1', label: 'Verificando dados',       delay: 0    },
  { id: 'procStep2', label: 'Autorizando pagamento',   delay: 900  },
  { id: 'procStep3', label: 'Confirmando pedido',      delay: 1900 },
  { id: 'procStep4', label: 'Notificando freelancers', delay: 2800 },
];

const METHOD_LABELS = {
  pix:    'Pago via PIX',
  card:   'Pago via Cartão de Crédito',
  boleto: 'Pago via Boleto Bancário',
};

function runProcessingSequence() {
  const bar       = document.getElementById('progressBar');
  const title     = document.getElementById('processingTitle');
  const subtitle  = document.getElementById('processingSubtitle');

  const subtitles = [
    'Verificando seus dados...',
    'Autorizando com o banco...',
    'Registrando o pedido...',
    'Notificando os freelancers...',
  ];

  STEPS.forEach((step, i) => {
    setTimeout(() => {
      /* mark previous step done */
      if (i > 0) {
        const prev = document.querySelector(`#${STEPS[i - 1].id} .conf-proc-dot`);
        if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
      }
      const dot = document.querySelector(`#${step.id} .conf-proc-dot`);
      if (dot) dot.classList.add('active');

      if (subtitle) subtitle.textContent = subtitles[i];

      /* progress bar */
      const pct = ((i + 1) / STEPS.length) * 100;
      if (bar) bar.style.width = pct + '%';
    }, step.delay);
  });

  /* finish last step and show success */
  const totalDuration = STEPS[STEPS.length - 1].delay + 1000;

  setTimeout(() => {
    const lastDot = document.querySelector(`#${STEPS[STEPS.length - 1].id} .conf-proc-dot`);
    if (lastDot) { lastDot.classList.remove('active'); lastDot.classList.add('done'); }
    if (bar)    bar.style.width = '100%';
    if (title)  title.textContent = 'PAGAMENTO APROVADO';
    if (subtitle) subtitle.textContent = 'Redirecionando para confirmação...';
  }, totalDuration);

  setTimeout(() => revealSuccess(), totalDuration + 700);
}

/* ── Reveal success state ───────────────────────────────────────────── */

function revealSuccess() {
  document.getElementById('processingState').classList.add('hidden');

  const success = document.getElementById('successState');
  success.classList.remove('hidden');
  success.classList.add('conf-success--enter');

  /* populate dynamic data */
  document.getElementById('orderIdDisplay').textContent   = ORDER_ID;
  document.getElementById('orderDateDisplay').textContent  = ORDER_DATE;
  document.getElementById('paymentMethodDisplay').innerHTML =
    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> ${METHOD_LABELS[PAY_METHOD] || METHOD_LABELS.pix}`;

  /* trigger check animation */
  setTimeout(() => {
    const circle = document.getElementById('checkCircle');
    if (circle) circle.classList.add('conf-check-circle--animate');
  }, 200);
}

/* ── Receipt download (stub) ────────────────────────────────────────── */

function downloadReceipt() {
  showToast('Preparando comprovante PDF...');
}

/* ── Init ───────────────────────────────────────────────────────────── */

/* If arriving directly (no sessionStorage), skip straight to success */
if (sessionStorage.getItem('of_payment_done') === 'true') {
  document.getElementById('processingState').classList.add('hidden');
  document.getElementById('successState').classList.remove('hidden');
  document.getElementById('successState').classList.add('conf-success--enter');
  document.getElementById('orderIdDisplay').textContent  = ORDER_ID;
  document.getElementById('orderDateDisplay').textContent = ORDER_DATE;
  document.getElementById('paymentMethodDisplay').innerHTML =
    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> ${METHOD_LABELS[PAY_METHOD] || METHOD_LABELS.pix}`;
  setTimeout(() => {
    document.getElementById('checkCircle')?.classList.add('conf-check-circle--animate');
  }, 300);
} else {
  runProcessingSequence();
}
