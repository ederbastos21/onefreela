const API_BASE = 'http://localhost:8080';

OFAuth.loadNav();

let cartItems = [];

function authHeader() {
  return { 'Authorization': OFAuth.getToken() };
}

/* ── Load cart from API ──────────────────────────────────────────── */

async function loadCart() {
  if (!OFAuth.isLoggedIn()) return;

  try {
    const res = await fetch(API_BASE + '/cart/show', { headers: authHeader() });
    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const cart = await res.json();
    cartItems = (cart && cart.cartItemList) ? cart.cartItemList : [];
    renderCart();
  } catch (e) {
    console.error('loadCart:', e);
    showToast('Erro ao carregar carrinho.');
  }
}

/* ── Render ──────────────────────────────────────────────────────── */

function renderCart() {
  const container = document.getElementById('cartItems');
  const empty     = document.getElementById('cartEmpty');
  const coupon    = document.getElementById('couponSection');
  const subtitle  = document.getElementById('cartSubtitle');
  const totalEl   = document.getElementById('totalVal');
  const subLabel  = document.getElementById('subtotalLabel');

  const count = cartItems.length;

  if (subtitle) {
    subtitle.textContent = count === 0
      ? 'Nenhum serviço selecionado'
      : count + ' serviço' + (count !== 1 ? 's' : '') + ' selecionado' + (count !== 1 ? 's' : '');
  }
  if (totalEl)  totalEl.textContent  = count;
  if (subLabel) subLabel.textContent = count + ' serviço' + (count !== 1 ? 's' : '');

  container.innerHTML = '';

  if (count === 0) {
    empty.classList.add('show');
    if (coupon) coupon.classList.add('hidden');
    return;
  }

  empty.classList.remove('show');
  if (coupon) coupon.classList.remove('hidden');

  cartItems.forEach(function (item) {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.dataset.itemId = item.id;
    div.innerHTML =
      '<div class="cart-item-thumb" style="background:linear-gradient(135deg,#0d1f0d,#1a3a1a)">🛒</div>' +
      '<div class="cart-item-body">' +
        '<div class="cart-item-title">Item #' + item.id + '</div>' +
        '<div class="cart-item-cat">Qtd: ' + item.amount + '</div>' +
      '</div>' +
      '<div class="cart-item-right">' +
        '<div class="cart-item-actions">' +
          '<button class="btn-item-remove" onclick="removeItem(' + item.id + ', this)">Remover</button>' +
        '</div>' +
      '</div>';
    container.appendChild(div);
  });
}

/* ── Remove item ─────────────────────────────────────────────────── */

async function removeItem(itemId, btn) {
  if (btn) btn.disabled = true;

  try {
    const res = await fetch(API_BASE + '/cart/removeItem/' + itemId, {
      method: 'POST',
      headers: authHeader()
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

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

/* ── Coupon (local UI only) ──────────────────────────────────────── */

let discountApplied = false;

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
