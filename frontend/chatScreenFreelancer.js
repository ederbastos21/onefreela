const API_BASE = 'http://localhost:8080';

OFAuth.requireLogin();
OFAuth.loadNav();
initNotifPanel();

/* ── State ─────────────────────────────────────────────────────────── */

var allOrderItems      = [];
var currentItemId      = null;
var selectedDelivFiles = [];
var pollTimer          = null;

function authHdr() {
  return { Authorization: OFAuth.getToken() };
}

/* ── Config ─────────────────────────────────────────────────────────── */

var STATUS_LABELS = {
  PENDING_DELIVERY:          'Aguardando Entrega',
  PENDING_DELIVERY_REVISION: 'Aguardando Revisão',
  ADJUSTMENT_REQUEST:        'Revisão Solicitada',
  ON_DISPUTE:                'Em Disputa',
  FROZEN:                    'Congelado',
  COMPLETED:                 'Concluído',
  REFUNDED:                  'Reembolsado'
};

var STATUS_BADGE_CLASSES = {
  PENDING_DELIVERY:          'status-pending',
  PENDING_DELIVERY_REVISION: 'status-pending',
  ADJUSTMENT_REQUEST:        'status-active',
  ON_DISPUTE:                'status-pending',
  FROZEN:                    'status-pending',
  COMPLETED:                 'status-done',
  REFUNDED:                  'status-done'
};

var MESSAGE_TYPE_LABELS = {
  TEXT:                          null,
  ATTACHMENT:                    null,
  DELIVERY:                      '📦 Entrega realizada',
  DELIVERY_ACCEPTED:             '✅ Entrega aceita pelo cliente',
  DELIVERY_REFUSED:              '❌ Revisão solicitada pelo cliente',
  ADJUSTMENT_ACCEPTED:           '🔄 Revisão aceita — pode reenviar',
  ADJUSTMENT_REFUSED:            '🚫 Revisão recusada — pedido congelado',
  DISPUTE_OPENED:                '⚖️ Disputa aberta',
  DISPUTE_RESOLVED_FREELANCER:   '✓ Disputa resolvida — favor freelancer',
  DISPUTE_RESOLVED_CLIENT:       '↩ Disputa resolvida — reembolso processado',
  DELIVERY_ACCEPTED_AFTER_FREEZE:'✅ Entrega aceita pelo cliente (pós-revisão)'
};

/* ── Sidebar ──────────────────────────────────────────────────────── */

async function loadSidebar() {
  var list = document.getElementById('convList');
  list.innerHTML = '<div class="conv-item" style="justify-content:center;color:var(--muted2);font-size:12px;padding:12px">Carregando...</div>';

  try {
    var res = await fetch(API_BASE + '/delivery/myActiveItems', { headers: authHdr() });
    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }
    allOrderItems = res.ok ? await res.json() : [];
    renderSidebar(allOrderItems);
  } catch (e) {
    list.innerHTML = '<div class="conv-item" style="color:#ef4444;font-size:12px;padding:12px">Erro ao carregar pedidos.</div>';
  }
}

function renderSidebar(items) {
  var list = document.getElementById('convList');
  list.innerHTML = '';

  if (!items.length) {
    list.innerHTML =
      '<div class="conv-item" style="display:block;padding:20px 16px;text-align:center;color:var(--muted2);font-size:12px;line-height:1.6">' +
        '<div style="font-size:28px;margin-bottom:8px">📦</div>' +
        '<div style="font-weight:600;color:var(--text);margin-bottom:4px">Nenhum pedido ativo</div>' +
        'Quando clientes comprarem seus serviços, os pedidos aparecem aqui.' +
      '</div>';
    return;
  }

  items.forEach(function (item) {
    var statusLabel = STATUS_LABELS[item.status]      || item.status || '—';
    var statusClass = STATUS_BADGE_CLASSES[item.status] || 'status-pending';
    var price = item.totalPrice != null
      ? 'R$ ' + Number(item.totalPrice).toLocaleString('pt-BR', {minimumFractionDigits:2})
      : '—';
    var clientInitials = OFAuth.getInitials(item.clientName || '?');

    var div = document.createElement('div');
    div.className = 'conv-item' + (item.id === currentItemId ? ' active' : '');
    div.dataset.itemId = item.id;
    div.dataset.searchText = ((item.workTitle || '') + ' ' + (item.clientName || '')).toLowerCase();
    div.innerHTML =
      '<div class="conv-avatar" style="background:var(--gdim);color:var(--green)">' + escHtml(clientInitials) + '</div>' +
      '<div class="conv-info">' +
        '<div class="conv-name"><span class="conv-name-text">' + escHtml(item.clientName || 'Cliente') + '</span><span class="conv-time">' + price + '</span></div>' +
        '<div class="conv-service-tag">' + escHtml(item.workTitle || 'Pedido #' + item.id) + '</div>' +
        '<div class="conv-preview"><span class="status-badge ' + statusClass + '" style="font-size:9px">' + escHtml(statusLabel.toUpperCase()) + '</span></div>' +
      '</div>';

    div.addEventListener('click', function () { selectConversation(item.id); });
    list.appendChild(div);
  });
}

function filterConvs() {
  var q = (document.getElementById('convSearch').value || '').toLowerCase();
  document.querySelectorAll('#convList .conv-item[data-item-id]').forEach(function (el) {
    el.style.display = (el.dataset.searchText || '').includes(q) ? '' : 'none';
  });
}

/* ── Select conversation ─────────────────────────────────────────── */

function selectConversation(itemId) {
  currentItemId = itemId;

  document.querySelectorAll('#convList .conv-item').forEach(function (el) {
    el.classList.toggle('active', Number(el.dataset.itemId) === itemId);
  });

  var input = document.getElementById('msgInput');
  if (input) { input.disabled = false; input.placeholder = 'Digite sua mensagem...'; }

  var item = allOrderItems.find(function (x) { return x.id === itemId; });
  updateServiceBar(item);
  updateInfoPanel(item);
  updateActionButtons(item);
  loadMessages(itemId);

  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(function () { if (currentItemId) loadMessages(currentItemId, true); }, 8000);
}

/* ── Service bar + info panel ─────────────────────────────────────── */

function updateServiceBar(item) {
  var bar = document.getElementById('serviceBar');
  if (!bar || !item) return;
  bar.style.display = '';

  var status   = STATUS_LABELS[item.status] || item.status || '—';
  var price    = item.totalPrice != null
    ? 'R$ ' + Number(item.totalPrice).toLocaleString('pt-BR', {minimumFractionDigits:2})
    : '—';
  var deadline = item.deadlineDate
    ? 'Entrega até: ' + new Date(item.deadlineDate).toLocaleDateString('pt-BR')
    : '';

  document.getElementById('svcBarTitle').textContent = item.workTitle || 'Pedido #' + item.id;
  document.getElementById('svcBarSub').textContent   = deadline || (item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '');
  document.getElementById('svcBarPrice').textContent  = price;
  document.getElementById('svcBarStatus').textContent = status;
}

function updateInfoPanel(item) {
  if (!item) return;

  var clientSection  = document.getElementById('infoPanelClientSection');
  var earningSection = document.getElementById('infoPanelEarningSection');
  if (clientSection)  clientSection.style.display  = '';
  if (earningSection) earningSection.style.display  = '';

  var nameEl   = document.getElementById('infoPanelClientName');
  var avatarEl = document.getElementById('infoPanelClientAvatar');
  var metaEl   = document.getElementById('infoPanelClientMeta');
  if (nameEl)   nameEl.textContent   = item.clientName || '—';
  if (avatarEl) avatarEl.textContent = OFAuth.getInitials(item.clientName || '?');
  if (metaEl)   metaEl.textContent   = item.workTitle  || '';

  var headerName   = document.getElementById('chatHeaderName');
  var headerAvatar = document.getElementById('chatHeaderAvatar');
  var headerStatus = document.getElementById('chatHeaderStatus');
  if (headerName)   headerName.textContent   = item.clientName || '—';
  if (headerAvatar) headerAvatar.textContent = OFAuth.getInitials(item.clientName || '?');
  if (headerStatus) headerStatus.textContent = STATUS_LABELS[item.status] || '';

  var price    = item.totalPrice != null
    ? 'R$ ' + Number(item.totalPrice).toLocaleString('pt-BR', {minimumFractionDigits:2})
    : '—';
  var earningEl = document.getElementById('earningVal');
  if (earningEl) earningEl.textContent = price;
}

/* ── Action buttons ───────────────────────────────────────────────── */

function updateActionButtons(item) {
  var section = document.getElementById('actionsSection');
  var btns    = document.getElementById('actionButtons');
  if (!section || !btns || !item) return;

  var html = '';

  switch (item.status) {
    case 'PENDING_DELIVERY':
      html = '<button class="btn-deliver" onclick="openDeliveryModal()">📦 FAZER ENTREGA</button>';
      break;
    case 'PENDING_DELIVERY_REVISION':
      html = '<p style="font-size:12px;color:var(--muted2);line-height:1.5">🔍 Entrega enviada — aguardando revisão do cliente.</p>';
      break;
    case 'ADJUSTMENT_REQUEST':
      html =
        '<button class="btn-approve" style="margin-bottom:8px" onclick="doAction(\'acceptAdjustment\')">✓ ACEITAR REVISÃO</button>' +
        '<button class="btn-dispute" onclick="doAction(\'refuseAdjustment\')">✗ Recusar Revisão</button>';
      break;
    case 'ON_DISPUTE':
      html = '<p style="font-size:12px;color:var(--muted2);line-height:1.5">⚖️ Disputa em análise pelo administrador.</p>';
      break;
    case 'FROZEN':
      html = '<p style="font-size:12px;color:var(--muted2);line-height:1.5">⏸️ Pedido congelado — aguardando decisão do cliente.</p>';
      break;
    case 'COMPLETED':
      html = '<p style="font-size:12px;color:var(--green);line-height:1.5">✅ Pedido concluído.</p>';
      break;
    case 'REFUNDED':
      html = '<p style="font-size:12px;color:var(--muted2);line-height:1.5">↩ Pedido reembolsado.</p>';
      break;
  }

  btns.innerHTML = html;
  section.style.display = '';
}

/* ── Messages ─────────────────────────────────────────────────────── */

async function loadMessages(itemId, silent) {
  if (itemId !== currentItemId) return;

  var msgs = document.getElementById('chatMessages');
  if (!msgs) return;

  if (!silent) msgs.innerHTML = '<div class="msg-date">Carregando...</div>';

  try {
    var res = await fetch(API_BASE + '/chat/orderItem/' + itemId, { headers: authHdr() });
    if (!res.ok) {
      if (!silent) msgs.innerHTML = '<div class="msg-date" style="color:#ef4444">Conversa não encontrada ou acesso negado.</div>';
      return;
    }

    var data = await res.json();
    if (itemId !== currentItemId) return;
    renderMessages(data);
  } catch (e) {
    if (!silent) msgs.innerHTML = '<div class="msg-date" style="color:#ef4444">Erro ao carregar mensagens.</div>';
  }
}

function renderMessages(messages) {
  var msgs      = document.getElementById('chatMessages');
  var wasBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 80;
  var myName    = OFAuth.getName();

  msgs.innerHTML = '';

  if (!messages || !messages.length) {
    msgs.innerHTML = '<div class="msg-date">Nenhuma mensagem ainda. Diga olá ao cliente! 👋</div>';
    return;
  }

  messages.forEach(function (m) {
    var isMine     = m.senderName && m.senderName === myName;
    var inits      = OFAuth.getInitials(m.senderName || '?');
    var time       = m.sentAt ? new Date(m.sentAt).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}) : '';
    var eventLabel = MESSAGE_TYPE_LABELS[m.type];

    if (eventLabel) {
      var ev = document.createElement('div');
      ev.className = 'msg-date';
      ev.style.cssText = 'font-size:11px;padding:4px 12px;background:rgba(127,255,0,.06);border-radius:var(--radius);color:var(--green);border:1px solid rgba(127,255,0,.15);margin:8px auto;display:table';
      ev.textContent = eventLabel;
      msgs.appendChild(ev);
    }

    if (!m.content && !(m.attachments && m.attachments.length)) return;

    var div = document.createElement('div');
    div.className = 'msg' + (isMine ? ' mine' : '');

    var attachHtml = '';
    if (m.attachments && m.attachments.length) {
      attachHtml = m.attachments.map(function (a) {
        return '<div class="msg-file">' +
          '<span class="msg-file-icon">📄</span>' +
          '<div class="msg-file-info">' +
            '<div class="msg-file-name">' + escHtml(a.originalName || 'arquivo') + '</div>' +
            '<div class="msg-file-size">' + formatFileSize(a.fileSize) + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    var avatarBg    = isMine ? 'var(--gdim)' : '#60a5fa';
    var avatarColor = isMine ? ';color:var(--green)' : '';

    div.innerHTML =
      '<div class="msg-avatar" style="background:' + avatarBg + avatarColor + '">' + escHtml(inits) + '</div>' +
      '<div>' +
        (m.content  ? '<div class="msg-bubble">' + escHtml(m.content) + '</div>' : '') +
        (attachHtml ? '<div class="msg-bubble">' + attachHtml + '</div>' : '') +
        '<div class="msg-meta">' + time + (isMine ? ' <span class="msg-check">✓✓</span>' : '') + '</div>' +
      '</div>';

    msgs.appendChild(div);
  });

  if (wasBottom) msgs.scrollTop = msgs.scrollHeight;
}

/* ── Send message ─────────────────────────────────────────────────── */

async function sendMsg() {
  if (!currentItemId) return;
  var input = document.getElementById('msgInput');
  var text  = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';

  var form = new FormData();
  form.append('content', text);

  try {
    var res = await fetch(API_BASE + '/chat/orderItem/' + currentItemId + '/message', {
      method:  'POST',
      headers: authHdr(),
      body:    form
    });
    if (res.ok) await loadMessages(currentItemId, true);
  } catch (e) {}
}

function useQuick(btn) {
  var input = document.getElementById('msgInput');
  if (input.disabled) return;
  input.value = btn.textContent.trim();
  input.focus();
}

function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }

/* ── Delivery modal ───────────────────────────────────────────────── */

function openDeliveryModal() {
  if (!currentItemId) return;
  document.getElementById('deliveryMsg').value = '';
  var statusMsg = document.getElementById('deliveryStatusMsg');
  if (statusMsg) { statusMsg.textContent = ''; statusMsg.className = 'admin-form-msg'; }
  selectedDelivFiles = [];
  renderDelivFilesPreview();
  var btn = document.getElementById('deliverySubmitBtn');
  if (btn) { btn.disabled = false; btn.textContent = 'ENVIAR ENTREGA'; }
  document.getElementById('deliveryModal').classList.add('show');
}

function closeDeliveryModal() {
  document.getElementById('deliveryModal').classList.remove('show');
}

document.getElementById('deliveryFiles').addEventListener('change', function () {
  Array.from(this.files).forEach(function (f) {
    if (!selectedDelivFiles.find(function (x) { return x.name === f.name && x.size === f.size; })) {
      selectedDelivFiles.push(f);
    }
  });
  document.getElementById('deliveryFiles').value = '';
  renderDelivFilesPreview();
});

function renderDelivFilesPreview() {
  var preview = document.getElementById('deliveryFilesPreview');
  preview.innerHTML = selectedDelivFiles.map(function (f, i) {
    return '<div style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);font-size:11px;color:var(--muted2);max-width:200px">' +
      '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(f.name) + '</span>' +
      '<span style="cursor:pointer;color:#ef4444;font-size:13px" data-idx="' + i + '">×</span>' +
    '</div>';
  }).join('');

  preview.querySelectorAll('[data-idx]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectedDelivFiles.splice(Number(btn.dataset.idx), 1);
      renderDelivFilesPreview();
    });
  });
}

async function submitDelivery() {
  if (!currentItemId) return;

  var msg       = document.getElementById('deliveryMsg').value.trim();
  var statusMsg = document.getElementById('deliveryStatusMsg');
  var btn       = document.getElementById('deliverySubmitBtn');

  btn.disabled    = true;
  btn.textContent = 'ENVIANDO...';
  if (statusMsg) statusMsg.textContent = '';

  var form = new FormData();
  form.append('message', msg || 'Entrega realizada.');
  form.append('orderItemId', currentItemId);
  selectedDelivFiles.forEach(function (f) { form.append('files', f); });

  try {
    var res = await fetch(API_BASE + '/chat/orderItem/' + currentItemId + '/delivery', {
      method:  'POST',
      headers: authHdr(),
      body:    form
    });

    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var errMsg = (Array.isArray(data.errors) && data.errors.length)
        ? data.errors.map(function (e) { return e.message; }).join(' | ')
        : 'Erro ao enviar entrega.';
      if (statusMsg) { statusMsg.textContent = errMsg; statusMsg.className = 'admin-form-msg admin-form-msg-error'; }
      btn.disabled    = false;
      btn.textContent = 'ENVIAR ENTREGA';
      return;
    }

    closeDeliveryModal();
    await refreshCurrentItem();
    await loadMessages(currentItemId, true);

  } catch (_) {
    if (statusMsg) { statusMsg.textContent = 'Erro de conexão.'; statusMsg.className = 'admin-form-msg admin-form-msg-error'; }
    btn.disabled    = false;
    btn.textContent = 'ENVIAR ENTREGA';
  }
}

document.getElementById('deliveryModal').addEventListener('click', function (e) {
  if (e.target === this) closeDeliveryModal();
});

/* ── Action dispatcher ────────────────────────────────────────────── */

async function doAction(action) {
  if (!currentItemId) return;

  try {
    var res = await fetch(API_BASE + '/chat/orderItem/' + currentItemId + '/' + action, {
      method:  'POST',
      headers: authHdr()
    });

    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      alert((Array.isArray(data.errors) && data.errors.length)
        ? data.errors.map(function (e) { return e.message; }).join(' | ')
        : 'Erro ao executar ação.');
      return;
    }

    await refreshCurrentItem();
    await loadMessages(currentItemId, true);

  } catch (_) {
    alert('Erro de conexão.');
  }
}

/* ── Refresh helpers ──────────────────────────────────────────────── */

async function refreshCurrentItem() {
  try {
    var res = await fetch(API_BASE + '/delivery/myActiveItems', { headers: authHdr() });
    if (res.ok) {
      allOrderItems = await res.json();
      renderSidebar(allOrderItems);
    }
  } catch (_) {}

  var item = allOrderItems.find(function (x) { return x.id === currentItemId; });
  if (item) {
    updateActionButtons(item);
    updateServiceBar(item);
    updateInfoPanel(item);
  }
}

/* ── Utils ─────────────────────────────────────────────────────────── */

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

/* ── Attach delivery btn ────────────────────────────────────────────── */
document.querySelector('.btn-attach-delivery').addEventListener('click', openDeliveryModal);

/* ── Boot — open orderItemId from URL if provided ─────────────────── */
(async function boot() {
  await loadSidebar();

  var params = new URLSearchParams(window.location.search);
  var itemId = params.get('orderItemId');
  if (itemId) {
    var id   = Number(itemId);
    var item = allOrderItems.find(function (x) { return x.id === id; });
    if (item) selectConversation(id);
  }
})();
