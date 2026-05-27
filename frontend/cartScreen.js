const API_BASE = 'http://localhost:8080';

OFAuth.loadNav();

let cartItems      = [];
let discountApplied = false;

function authHeader() {
  return { 'Authorization': OFAuth.getToken() };
}

/* ── Cache helpers ───────────────────────────────────────────────── */

function getWorkCache() {
  return JSON.parse(localStorage.getItem('of_work_cache') || '{}');
}

function getCartMap() {
  return JSON.parse(localStorage.getItem('of_cart_workmap') || '{}');
}

function getWorkForItem(cartItemId) {
  const map   = getCartMap();
  const cache = getWorkCache();
  const workId = map[String(cartItemId)];
  return workId != null ? (cache[String(workId)] || null) : null;
}

/* ── Formatters ──────────────────────────────────────────────────── */

function formatPrice(price) {
  if (price == null) return '—';
  const n = Number(price);
  return 'R$ ' + (Number.isInteger(n) ? n : n.toFixed(2).replace('.', ','));
}

const GRADIENTS = [
  'linear-gradient(135deg,#0d1f0d,#1a3a1a)',
  'linear-gradient(135deg,#0d0d1f,#1a1a3a)',
  'linear-gradient(135deg,#1f1a0d,#3a2e0d)',
  'linear-gradient(135deg,#1f0d1f,#3a1a3a)',
  'linear-gradient(135deg,#1f0d0d,#3a1a1a)',
  'linear-gradient(135deg,#0d1a1f,#0d2a2a)',
];
const COLORS = ['#7fff00','#b0ff4e','#a3e635','#5bbd00','#84cc16','#65a30d','#4d7c0f'];
function workGradient(id) { return GRADIENTS[Number(id) % GRADIENTS.length]; }
function workColor(id)    { return COLORS[Number(id) % COLORS.length]; }

function catEmoji(cat) {
  if (!cat) return '🛠️';
  const c = cat.toLowerCase();
  if (c.includes('design') || c.includes('figma'))  return '🎨';
  if (c.includes('dev')    || c.includes('web') || c.includes('react')) return '💻';
  if (c.includes('market') || c.includes('redes'))  return '📱';
  if (c.includes('redaç')  || c.includes('copy'))   return '✍️';
  if (c.includes('vídeo')  || c.includes('video'))  return '🎬';
  if (c.includes('dados')  || c.includes('data'))   return '📊';
  return '🛠️';
}

function getInitials(name) {
  if (!name || !name.trim()) return '?';
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/* ── Load cart from API ──────────────────────────────────────────── */

async function loadCart() {
  if (!OFAuth.isLoggedIn()) return;

  try {
    const res = await fetch(API_BASE + '/cart/show', { headers: authHeader() });
    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const cart = await res.json();
    cartItems  = (cart && cart.cartItemList) ? cart.cartItemList : [];
    renderCart();
  } catch (e) {
    console.error('loadCart:', e);
    showToast('Erro ao carregar carrinho.');
  }
}

/* ── Render cart ─────────────────────────────────────────────────── */

function renderCart() {
  const container = document.getElementById('cartItems');
  const empty     = document.getElementById('cartEmpty');
  const coupon    = document.getElementById('couponSection');
  const subtitle  = document.getElementById('cartSubtitle');
  const totalEl   = document.getElementById('totalVal');
  const subLabel  = document.getElementById('subtotalLabel');
  const subtotalEl = document.getElementById('subtotal');

  const count = cartItems.length;

  if (count === 0) {
    if (subtitle)   subtitle.textContent   = 'Nenhum serviço selecionado';
    if (totalEl)    totalEl.textContent    = '0';
    if (subLabel)   subLabel.textContent   = '0 serviços';
    if (subtotalEl) subtotalEl.textContent = '—';
    empty.classList.add('show');
    if (coupon) coupon.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  empty.classList.remove('show');
  if (coupon) coupon.classList.remove('hidden');

  if (subtitle) subtitle.textContent = count + ' serviço' + (count !== 1 ? 's' : '') +
    ' selecionado' + (count !== 1 ? 's' : '');

  container.innerHTML = '';

  let subtotal     = 0;
  let hasAllPrices = true;

  cartItems.forEach(function (item) {
    const work  = getWorkForItem(item.id);
    const price = work ? Number(work.price) : null;

    if (price != null) subtotal += price * item.amount;
    else hasAllPrices = false;

    const bg    = work ? workGradient(work.id) : 'linear-gradient(135deg,#1a1a1a,#2a2a2a)';
    const emoji = work ? catEmoji(work.category) : '🛒';
    const ini   = work ? getInitials(work.ownerName) : '?';
    const color = work ? workColor(work.id) : '#7fff00';

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.dataset.itemId = item.id;

    div.innerHTML =
      '<div class="cart-item-thumb" style="background:' + bg + '">' + emoji + '</div>' +
      '<div class="cart-item-body">' +
        (work && work.category ? '<div class="cart-item-cat">' + work.category + '</div>' : '') +
        '<div class="cart-item-title">' + (work ? (work.title || 'Serviço #' + item.id) : 'Serviço #' + item.id) + '</div>' +
        (work ? '<div class="cart-item-freelancer">' +
          '<div class="cart-item-avatar" style="background:' + color + '">' + ini + '</div>' +
          '<span class="cart-item-fname">' + (work.ownerName || '—') + '</span>' +
        '</div>' : '') +
      '</div>' +
      '<div class="cart-item-right">' +
        '<div><div class="cart-item-price">' + (work ? formatPrice(work.price) : '—') + '</div></div>' +
        '<div class="cart-item-stepper">' +
          '<button class="qty-btn-sm" onclick="changeAmount(' + item.id + ', -1, this)">−</button>' +
          '<span class="qty-val">' + item.amount + '</span>' +
          '<button class="qty-btn-sm" onclick="changeAmount(' + item.id + ', 1, this)">+</button>' +
        '</div>' +
        '<div class="cart-item-actions">' +
          '<button class="btn-item-remove" onclick="removeItem(' + item.id + ', this)">Remover</button>' +
        '</div>' +
      '</div>';

    container.appendChild(div);
  });

  if (subLabel)   subLabel.textContent   = count + ' serviço' + (count !== 1 ? 's' : '');
  if (subtotalEl) subtotalEl.textContent = hasAllPrices ? formatPrice(subtotal) : formatPrice(subtotal) + '+';
  if (totalEl)    totalEl.textContent    = count;
}

/* ── Remove item ─────────────────────────────────────────────────── */

async function removeItem(itemId, btn) {
  if (btn) btn.disabled = true;

  try {
    const res = await fetch(API_BASE + '/cart/removeItem/' + itemId, {
      method:  'POST',
      headers: authHeader()
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    // Remove mapeamento do localStorage
    const cartMap = getCartMap();
    delete cartMap[String(itemId)];
    localStorage.setItem('of_cart_workmap', JSON.stringify(cartMap));

    cartItems = cartItems.filter(function (i) { return i.id !== itemId; });

    const row = document.querySelector('[data-item-id="' + itemId + '"]');
    if (row) {
      row.classList.add('removing');
      setTimeout(function () { row.remove(); renderCart(); }, 300);
    } else {
      renderCart();
    }
  } catch (e) {
    console.error('removeItem:', e);
    showToast('Erro ao remover item.');
    if (btn) btn.disabled = false;
  }
}

/* ── Change amount ───────────────────────────────────────────────── */

async function changeAmount(itemId, delta, btn) {
  const item = cartItems.find(function (i) { return i.id === itemId; });
  if (!item) return;

  const newAmount = item.amount + delta;

  const row = document.querySelector('[data-item-id="' + itemId + '"]');
  if (row) row.querySelectorAll('button').forEach(function (b) { b.disabled = true; });

  if (newAmount <= 0) {
    await removeItem(itemId, null);
    return;
  }

  const work = getWorkForItem(itemId);
  if (!work) {
    showToast('Dados do serviço não encontrados.');
    if (row) row.querySelectorAll('button').forEach(function (b) { b.disabled = false; });
    return;
  }

  try {
    if (delta > 0) {
      const res = await fetch(API_BASE + '/cart/addItem', {
        method:  'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ WorkId: work.id, amount: 1 })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      item.amount = newAmount;
      renderCart();
    } else {
      // Decrement: remove then re-add with newAmount
      const removeRes = await fetch(API_BASE + '/cart/removeItem/' + itemId, {
        method:  'POST',
        headers: authHeader()
      });
      if (!removeRes.ok) throw new Error('HTTP ' + removeRes.status);

      const cartMap = getCartMap();
      delete cartMap[String(itemId)];
      localStorage.setItem('of_cart_workmap', JSON.stringify(cartMap));

      const prevRes  = await fetch(API_BASE + '/cart/show', { headers: authHeader() });
      const prevData = prevRes.ok ? await prevRes.json() : null;
      const prevItems = (prevData && prevData.cartItemList) ? prevData.cartItemList : [];
      const prevAmounts = {};
      prevItems.forEach(function (i) { prevAmounts[String(i.id)] = i.amount; });

      const addRes = await fetch(API_BASE + '/cart/addItem', {
        method:  'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ WorkId: work.id, amount: newAmount })
      });
      if (!addRes.ok) throw new Error('HTTP ' + addRes.status);

      const newItems   = await addRes.json();
      const newCartItem = newItems.find(function (i) { return prevAmounts[String(i.id)] === undefined; });
      const updatedMap  = getCartMap();
      if (newCartItem) {
        updatedMap[String(newCartItem.id)] = String(work.id);
        localStorage.setItem('of_cart_workmap', JSON.stringify(updatedMap));
      }

      await loadCart();
    }
  } catch (e) {
    console.error('changeAmount:', e);
    showToast('Erro ao alterar quantidade.');
    if (row) row.querySelectorAll('button').forEach(function (b) { b.disabled = false; });
  }
}

/* ── Cupom ───────────────────────────────────────────────────────── */

function applyCoupon() {
  const val = document.getElementById('couponInput').value.trim().toUpperCase();
  if (val === 'ONEFREELA10' && !discountApplied) {
    discountApplied = true;
    document.getElementById('couponSuccess').classList.add('show');
    showToast('🎉 Cupom aplicado com sucesso!');
  } else if (discountApplied) {
    showToast('Cupom já aplicado.');
  } else {
    showToast('Cupom inválido ou expirado.');
  }
}

/* ── Checkout ────────────────────────────────────────────────────── */

function checkout() {
  if (cartItems.length === 0) { showToast('Seu carrinho está vazio.'); return; }
  showToast('✓ Redirecionando para o pagamento...');
  setTimeout(function () { window.location.href = 'paymentScreen.html'; }, 900);
}

/* ── Init ────────────────────────────────────────────────────────── */

initNotifPanel();
loadCart();
