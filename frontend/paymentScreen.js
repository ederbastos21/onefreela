const API_BASE = 'http://localhost:8080';

OFAuth.loadNav();

let currentMethod = 'pix';
let cartSnapshot  = null;

/* ── Helpers ──────────────────────────────────────────────── */

const PAY_GRADIENTS = [
  'linear-gradient(135deg,#0d1f0d,#1a3a1a)',
  'linear-gradient(135deg,#0d0d1f,#1a1a3a)',
  'linear-gradient(135deg,#1f1a0d,#3a2e0d)',
  'linear-gradient(135deg,#1f0d1f,#3a1a3a)',
  'linear-gradient(135deg,#1f0d0d,#3a1a1a)',
  'linear-gradient(135deg,#0d1a1f,#0d2a2a)',
];

function itemBg(id) {
  return PAY_GRADIENTS[Number(id) % PAY_GRADIENTS.length];
}

function catEmoji(cat) {
  if (!cat) return '🛠️';
  const c = cat.toLowerCase();
  if (c.includes('design') || c.includes('figma'))                         return '🎨';
  if (c.includes('dev') || c.includes('web') || c.includes('react'))       return '💻';
  if (c.includes('market') || c.includes('redes') || c.includes('social')) return '📱';
  if (c.includes('redaç') || c.includes('copy') || c.includes('conteú'))   return '✍️';
  if (c.includes('vídeo') || c.includes('video') || c.includes('anim'))    return '🎬';
  if (c.includes('dados') || c.includes('data'))                            return '📊';
  return '🛠️';
}

function formatMoney(n) {
  if (n == null || isNaN(n)) return '—';
  return 'R$ ' + Number(n).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* ── Method selector ──────────────────────────────────────── */

function setMethod(method, el) {
  currentMethod = method;
  document.querySelectorAll('.method-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');

  const psPixForm     = document.getElementById('psPixForm');
  const psCardForm    = document.getElementById('psCardForm');
  const psBalanceForm = document.getElementById('psBalanceForm');
  if (psPixForm)     psPixForm.style.display     = (method === 'pix')     ? '' : 'none';
  if (psCardForm)    psCardForm.style.display     = (method === 'card')    ? '' : 'none';
  if (psBalanceForm) psBalanceForm.style.display  = (method === 'balance') ? '' : 'none';
}

/* ── Order items render ───────────────────────────────────── */

function renderOrderSummary(snapshot) {
  const container = document.getElementById('payOrderItems');
  if (!container) return;

  if (!snapshot || !snapshot.length) {
    container.innerHTML = '<p class="pay-empty-msg">Nenhum item no carrinho. <a href="cartScreen.html">Voltar</a></p>';
    return;
  }

  container.innerHTML = '';
  snapshot.forEach(item => {
    const work  = item._work;
    const emoji = catEmoji(work ? work.category : '');
    const bg    = work ? itemBg(work.id) : 'linear-gradient(135deg,#1a1a1a,#2a2a2a)';
    const title = work ? (work.title     || 'Serviço') : 'Serviço';
    const owner = work ? (work.ownerName || '—')       : '—';
    const amt   = item.amount || 1;
    const price = work ? Number(work.price) * amt : 0;
    const amtLabel = amt > 1 ? ' × ' + amt : '';

    const div = document.createElement('div');
    div.className = 'pay-order-item';
    div.innerHTML =
      '<div class="pay-order-thumb" style="background:' + bg + '">' + emoji + '</div>' +
      '<div class="pay-order-info">' +
        '<div class="pay-order-title">' + title + amtLabel + '</div>' +
        '<div class="pay-order-meta">' + owner + ' · Entrega em 14 dias</div>' +
      '</div>' +
      '<div class="pay-order-price">' + (work ? formatMoney(price) : '—') + '</div>';
    container.appendChild(div);
  });
}

function updateTotals(snapshot) {
  let subtotal = 0;
  (snapshot || []).forEach(item => {
    if (item._work) subtotal += Number(item._work.price) * (item.amount || 1);
  });
  const total = subtotal;
  const count = (snapshot || []).length;

  const subLabel = document.getElementById('paySubtotalLabel');

  const subVal = document.getElementById('paySubtotalVal');
  if (subVal)  subVal.textContent = formatMoney(subtotal);

  const feeVal = document.getElementById('payFeeVal');
  if (feeVal)  feeVal.textContent = formatMoney(fee);

  const totalVal = document.getElementById('payTotalVal');
  if (totalVal) totalVal.textContent = formatMoney(total);

  return total;
}

/* ── Load cart from API ───────────────────────────────────── */

async function loadCartSummary() {
  if (!OFAuth.isLoggedIn()) {
    window.location.href = 'loginScreen.html';
    return;
  }

  try {
    const res = await fetch(API_BASE + '/cart/show', {
      headers: { 'Authorization': OFAuth.getToken() }
    });

    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const cart      = await res.json();
    const items     = (cart && cart.cartItemList) ? cart.cartItemList : [];
    const workCache = JSON.parse(localStorage.getItem('of_work_cache')   || '{}');
    const cartMap   = JSON.parse(localStorage.getItem('of_cart_workmap') || '{}');

    cartSnapshot = items.map(item => ({
      ...item,
      _work: workCache[String(cartMap[String(item.id)])] || null
    }));

    if (!cartSnapshot.length) {
      window.location.href = 'cartScreen.html';
      return;
    }

    renderOrderSummary(cartSnapshot);
    updateTotals(cartSnapshot);

  } catch (e) {
    console.error('loadCartSummary:', e);
    const container = document.getElementById('payOrderItems');
    if (container) container.innerHTML = '<p class="pay-loading-txt" style="color:#ef4444">Erro ao carregar itens.</p>';
  }
}

/* ── Confirm order ────────────────────────────────────────── */

const METHOD_DISPLAY = {
  pix:     '⚡ PIX',
  card:    '💳 Cartão de Crédito',
  boleto:  '📄 Boleto Bancário',
  balance: '💰 Saldo OneFreela'
};

const METHOD_MAP = { pix: 'PIX', card: 'CARTAO', boleto: 'PIX', balance: 'BALANCE' };

async function confirmPayment() {
  const btn          = document.getElementById('confirmBtn');
  const originalText = btn.textContent;
  btn.textContent    = 'PROCESSANDO...';
  btn.disabled       = true;
  btn.style.opacity  = '.7';

  const paymentMethod = METHOD_MAP[currentMethod] || 'PIX';

  try {
    const cartItemIds = (cartSnapshot || []).map(function (item) { return item.id; });

    const res = await fetch(API_BASE + '/order/createOrder', {
      method:  'POST',
      headers: {
        'Authorization': OFAuth.getToken(),
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({ cartItemIds, additionalsByCartItem: {}, paymentMethod })
    });

    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }

    if (!res.ok) {
      let msg = 'Erro ao criar pedido.';
      try {
        const data = await res.json();
        if (Array.isArray(data.errors) && data.errors.length) {
          msg = data.errors.map(e => e.message).join(' • ');
        }
      } catch (_) {}
      showToast(msg);
      btn.textContent   = originalText;
      btn.disabled      = false;
      btn.style.opacity = '1';
      return;
    }

    // Try to capture the backend-assigned order ID for payment processing
    let backendOrderId = null;
    try {
      const text   = await res.text();
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && (parsed.id || parsed.orderId)) {
        backendOrderId = Number(parsed.id || parsed.orderId) || null;
      }
    } catch (_) {}

    // Process payment based on selected method
    let paymentCallOk = false;
    if (backendOrderId) {
      try {
        if (currentMethod === 'balance') {
          const r = await fetch(API_BASE + '/payment/makePaymentBalance/' + backendOrderId, {
            method: 'POST', headers: { 'Authorization': OFAuth.getToken() }
          });
          paymentCallOk = r.ok;

        } else if (currentMethod === 'pix') {
          const cpf = (document.getElementById('psPixCpf').value || '').replace(/\D/g, '');
          const r = await fetch(API_BASE + '/payment/makePaymentPix', {
            method: 'POST',
            headers: { 'Authorization': OFAuth.getToken(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: backendOrderId, cpf })
          });
          paymentCallOk = r.ok;

        } else if (currentMethod === 'card') {
          const cardNumber = (document.getElementById('psCardNumber').value || '').replace(/\s/g, '');
          const name       = document.getElementById('psCardName').value || '';
          const expiryStr  = document.getElementById('psCardExpiry').value || '';
          const cvv        = document.getElementById('psCvv').value || '';
          const cpf        = (document.getElementById('psCardCpf').value || '').replace(/\D/g, '');
          const expMatch   = expiryStr.match(/^(\d{2})\/(\d{4})$/);
          const expirationDate = expMatch ? (expMatch[2] + '-' + expMatch[1] + '-01') : null;
          if (cardNumber && name && expirationDate && cvv && cpf) {
            const r = await fetch(API_BASE + '/payment/makePaymentCard', {
              method: 'POST',
              headers: { 'Authorization': OFAuth.getToken(), 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: backendOrderId, cardNumber, name, expirationDate, cvv, cpf })
            });
            paymentCallOk = r.ok;
          }
        }
      } catch (_) {}
    }

    /* build order record */
    const rand      = Math.floor(Math.random() * 90000) + 10000;
    const orderId   = '#OF-' + new Date().getFullYear() + '-' + rand;
    const orderDate = new Date().toLocaleDateString('pt-BR');

    const savedItems = [];
    let   total      = 0;
    if (cartSnapshot && cartSnapshot.length) {
      cartSnapshot.forEach(item => {
        const work  = item._work;
        const price = work ? Number(work.price) : 0;
        savedItems.push({
          title:    work ? (work.title    || 'Serviço') : 'Serviço',
          category: work ? (work.category || '')        : '',
          price,
          amount:   item.amount || 1
        });
        total += price * (item.amount || 1);
      });
    }

    const orderRecord = {
      orderId,
      backendOrderId,
      method:        currentMethod,
      paymentMethod,
      date:          orderDate,
      timestamp:     Date.now(),
      status:        paymentCallOk ? 'PAID' : 'NOT_PAID',
      items:         savedItems,
      total
    };

    const orders = JSON.parse(localStorage.getItem('of_orders') || '[]');
    orders.unshift(orderRecord);
    localStorage.setItem('of_orders', JSON.stringify(orders));
    localStorage.removeItem('of_cart_workmap');

    /* show inline success */
    document.getElementById('preOrderState').style.display   = 'none';
    document.getElementById('orderSuccessState').style.display = '';

    document.getElementById('successOrderId').textContent = orderId;
    document.getElementById('successDate').textContent    = orderDate;
    document.getElementById('successMethod').textContent  = METHOD_DISPLAY[currentMethod] || currentMethod;
    document.getElementById('successTotal').textContent   = formatMoney(total);

  } catch (e) {
    console.error('confirmPayment:', e);
    showToast('Erro de conexão ao realizar pedido.');
    btn.textContent   = originalText;
    btn.disabled      = false;
    btn.style.opacity = '1';
  }
}

/* ── Init ─────────────────────────────────────────────────── */

initNotifPanel();
loadCartSummary();
