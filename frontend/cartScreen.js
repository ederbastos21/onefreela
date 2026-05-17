OFAuth.loadNav();

let itemCount = 3;
let discountApplied = false;

function removeItem(btn) {
  const item = btn.closest('.cart-item');
  item.classList.add('removing');
  setTimeout(() => {
    item.remove();
    itemCount--;
    updateCart();
  }, 300);
}

function updateCart() {
  const subtitle = document.getElementById('cartSubtitle');
  const empty    = document.getElementById('cartEmpty');
  const coupon   = document.getElementById('couponSection');
  if (itemCount === 0) {
    empty.classList.add('show');
    coupon.classList.add('hidden');
    subtitle.textContent = 'Nenhum serviço selecionado';
  } else {
    empty.classList.remove('show');
    subtitle.textContent = `${itemCount} serviço${itemCount > 1 ? 's' : ''} selecionado${itemCount > 1 ? 's' : ''}`;
  }
}

function applyCoupon() {
  const val = document.getElementById('couponInput').value.trim().toUpperCase();
  if (val === 'ONEFREELA10' && !discountApplied) {
    discountApplied = true;
    document.getElementById('couponSuccess').classList.add('show');
    document.getElementById('discountLine').classList.remove('hidden');
    document.getElementById('totalVal').textContent = 'R$3.050';
    showToast('🎉 Cupom aplicado com sucesso!');
  } else if (discountApplied) {
    showToast('Cupom já aplicado.');
  } else {
    showToast('Cupom inválido ou expirado.');
  }
}

function checkout() { showToast('✓ Redirecionando para o pagamento...'); }

initNotifPanel();
