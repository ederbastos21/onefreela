const API_BASE = 'http://localhost:8080';

OFAuth.requireLogin();
OFAuth.loadNav();
initNotifPanel();

/* ── State ─────────────────────────────────────────────────────────── */

var currentItemId = null;
var lastMessages  = [];
var sidebarItems  = [];
var pollTimer     = null;

function authHdr() { return { Authorization: OFAuth.getToken() }; }

/* ── Config ─────────────────────────────────────────────────────────── */

var STATUS_LABELS = {
  PENDING_DELIVERY:           'Aguardando Entrega',
  PENDING_DELIVERY_REVISION:  'Aguardando Revisão',
  ADJUSTMENT_REQUEST:         'Revisão Solicitada',
  ON_DISPUTE:                 'Em Disputa',
  FROZEN:                     'Congelado',
  COMPLETED:                  'Concluído',
  REFUNDED:                   'Reembolsado'
};

var MESSAGE_TYPE_LABELS = {
  TEXT:                           null,
  ATTACHMENT:                     null,
  DELIVERY:                       '📦 Entrega realizada — aguardando sua aprovação',
  DELIVERY_ACCEPTED:              '✅ Entrega aprovada',
  DELIVERY_REFUSED:               '❌ Revisão solicitada',
  ADJUSTMENT_ACCEPTED:            '🔄 Revisão aceita pelo freelancer',
  ADJUSTMENT_REFUSED:             '🚫 Revisão recusada — aguardando sua decisão',
  DISPUTE_OPENED:                 '⚖️ Disputa aberta',
  DISPUTE_RESOLVED_FREELANCER:    '✓ Disputa resolvida — favor freelancer',
  DISPUTE_RESOLVED_CLIENT:        '↩ Disputa resolvida — reembolso processado',
  DELIVERY_ACCEPTED_AFTER_FREEZE: '✅ Entrega aceita após revisão recusada'
};

/* ── Boot ───────────────────────────────────────────────────────────── */

loadAllConversations();

/* ── Sidebar: load all conversations ─────────────────────────────── */

async function loadAllConversations() {
  var list = document.getElementById('convList');
  if (list) {
    list.innerHTML =
      '<div style="padding:20px 16px;text-align:center;color:var(--muted2);font-size:12px">' +
        'Carregando conversas...' +
      '</div>';
  }

  try {
    var res = await fetch(API_BASE + '/order/myOrders', { headers: authHdr() });
    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return; }
    var orders = res.ok ? await res.json() : [];

    sidebarItems = [];
    orders.forEach(function (order) {
      if (order.status === 'PAID') {
        (order.items || []).forEach(function (item) {
          sidebarItems.push(item);
        });
      }
    });

    renderSidebarItems();

    var params = new URLSearchParams(window.location.search);
    var itemId = Number(params.get('orderItemId'));
    if (itemId && sidebarItems.find(function (x) { return x.id === itemId; })) {
      loadConversation(itemId);
    }
  } catch (e) {
    if (list) {
      list.innerHTML =
        '<div style="padding:20px 16px;text-align:center;color:#ef4444;font-size:12px">' +
          'Erro ao carregar conversas.' +
        '</div>';
    }
  }
}

async function refreshSidebarItems() {
  try {
    var res = await fetch(API_BASE + '/order/myOrders', { headers: authHdr() });
    if (!res.ok) return;
    var orders = await res.json();
    sidebarItems = [];
    orders.forEach(function (order) {
      if (order.status === 'PAID') {
        (order.items || []).forEach(function (item) { sidebarItems.push(item); });
      }
    });
    renderSidebarItems();
  } catch (_) {}
}

function renderSidebarItems() {
  var list = document.getElementById('convList');
  if (!list) return;
  list.innerHTML = '';

  if (!sidebarItems.length) {
    list.innerHTML =
      '<div style="display:block;padding:28px 16px;text-align:center;color:var(--muted2);font-size:12px;line-height:1.6">' +
        '<div style="font-size:28px;margin-bottom:8px">💬</div>' +
        '<div style="font-weight:600;color:var(--text);margin-bottom:4px">Nenhuma conversa</div>' +
        'Suas conversas aparecem aqui quando você faz um pedido.' +
      '</div>';
    return;
  }

  sidebarItems.forEach(function (item) {
    var div = document.createElement('div');
    div.className = 'conv-item' + (item.id === currentItemId ? ' active' : '');
    div.dataset.itemId    = item.id;
    div.dataset.searchText = ((item.freelancerName || '') + ' ' + (item.workTitle || '')).toLowerCase();

    var inits   = OFAuth.getInitials(item.freelancerName || '?');
    var stLabel = STATUS_LABELS[item.status] || item.status || '—';
    var price   = formatPrice(item.totalPrice);

    div.innerHTML =
      '<div class="conv-avatar" style="background:var(--gdim);color:var(--green)">' + escHtml(inits) + '</div>' +
      '<div class="conv-info">' +
        '<div class="conv-name">' +
          '<span class="conv-name-text">' + escHtml(item.freelancerName || 'Freelancer') + '</span>' +
          '<span class="conv-time">' + escHtml(price) + '</span>' +
        '</div>' +
        '<div class="conv-service-tag">' + escHtml(item.workTitle || 'Pedido #' + item.id) + '</div>' +
        '<div class="conv-preview"><span>' + escHtml(stLabel) + '</span></div>' +
      '</div>';

    div.addEventListener('click', function () { loadConversation(item.id); });
    list.appendChild(div);
  });
}

/* ── Load conversation ──────────────────────────────────────────────── */

async function loadConversation(itemId) {
  currentItemId = itemId;

  document.querySelectorAll('#convList .conv-item').forEach(function (el) {
    el.classList.toggle('active', Number(el.dataset.itemId) === itemId);
  });

  var msgs = document.getElementById('chatMessages');
  if (msgs) msgs.innerHTML = '<div class="msg-date">Carregando conversa...</div>';

  updateHeaderFromItem(itemId);

  try {
    var res = await fetch(API_BASE + '/chat/orderItem/' + itemId, { headers: authHdr() });

    if (res.status === 403 || res.status === 401) {
      if (msgs) msgs.innerHTML =
        '<div class="msg-date" style="color:#ef4444">Sem permissão para visualizar esta conversa.</div>';
      return;
    }
    if (!res.ok) {
      if (msgs) msgs.innerHTML =
        '<div class="msg-date" style="color:#ef4444">Conversa não encontrada.</div>';
      return;
    }

    lastMessages = await res.json();
    updateServiceBar(itemId);
    renderMessages(lastMessages);
    updateActionButtons();

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function () { pollMessages(itemId); }, 6000);

  } catch (e) {
    if (msgs) msgs.innerHTML =
      '<div class="msg-date" style="color:#ef4444">Erro ao carregar conversa.</div>';
  }
}

async function pollMessages(itemId) {
  if (itemId !== currentItemId) return;
  try {
    var res = await fetch(API_BASE + '/chat/orderItem/' + itemId, { headers: authHdr() });
    if (!res.ok) return;
    lastMessages = await res.json();
    renderMessages(lastMessages);
    await refreshSidebarItems();
    updateActionButtons();
    updateServiceBar(itemId);
  } catch (_) {}
}

/* ── Header / info panel ────────────────────────────────────────────── */

function updateHeaderFromItem(itemId) {
  var item = sidebarItems.find(function (x) { return x.id === itemId; });
  if (!item) return;

  var name  = item.freelancerName || '—';
  var inits = OFAuth.getInitials(name);

  var headerName    = document.getElementById('chatHeaderName');
  var headerAvatar  = document.getElementById('chatHeaderAvatar');
  var infoPanelAvatar = document.getElementById('infoPanelAvatar');
  var infoPanelName   = document.getElementById('infoPanelName');
  var infoPanelRole   = document.getElementById('infoPanelRole');

  if (headerName)      headerName.textContent      = name;
  if (headerAvatar)    headerAvatar.textContent    = inits;
  if (infoPanelAvatar) infoPanelAvatar.textContent = inits;
  if (infoPanelName)   infoPanelName.textContent   = name;
  if (infoPanelRole)   infoPanelRole.textContent   = item.workTitle || 'Pedido #' + itemId;
}

/* ── Service bar ────────────────────────────────────────────────────── */

function updateServiceBar(itemId) {
  var bar = document.getElementById('serviceBar');
  if (!bar) return;
  bar.style.display = '';

  var item = sidebarItems.find(function (x) { return x.id === itemId; });
  document.getElementById('svcBarTitle').textContent  = item ? (item.workTitle || 'Pedido #' + itemId) : 'Pedido #' + itemId;
  document.getElementById('svcBarSub').textContent    = lastMessages.length + ' mensagem(ns)';
  document.getElementById('svcBarPrice').textContent  = item ? formatPrice(item.totalPrice) : '—';
  document.getElementById('svcBarStatus').textContent = item ? (STATUS_LABELS[item.status] || item.status) : '—';
}

/* ── Messages ─────────────────────────────────────────────────────── */

function renderMessages(messages) {
  var msgs = document.getElementById('chatMessages');
  if (!msgs) return;
  var wasBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 80;
  var myName    = OFAuth.getName();

  msgs.innerHTML = '';

  if (!messages || !messages.length) {
    msgs.innerHTML = '<div class="msg-date">Nenhuma mensagem ainda.</div>';
    return;
  }

  messages.forEach(function (m) {
    var isMine     = m.senderName === myName;
    var inits      = OFAuth.getInitials(m.senderName || '?');
    var time       = m.sentAt ? new Date(m.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
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

    var avatarColor     = isMine ? '#60a5fa' : 'var(--gdim)';
    var avatarTextColor = isMine ? '' : ';color:var(--green)';

    div.innerHTML =
      '<div class="msg-avatar" style="background:' + avatarColor + avatarTextColor + '">' + escHtml(inits) + '</div>' +
      '<div>' +
        (m.content ? '<div class="msg-bubble">' + escHtml(m.content) + '</div>' : '') +
        (attachHtml ? '<div class="msg-bubble">' + attachHtml + '</div>' : '') +
        '<div class="msg-meta">' + time + (isMine ? ' <span class="msg-check">✓✓</span>' : '') + '</div>' +
      '</div>';

    msgs.appendChild(div);
  });

  if (wasBottom) msgs.scrollTop = msgs.scrollHeight;
}

/* ── Action buttons (based on item STATUS, not last message type) ──── */

function updateActionButtons() {
  var section = document.getElementById('actionsSection');
  var btns    = document.getElementById('actionButtons');
  if (!section || !btns) return;

  var item   = sidebarItems.find(function (x) { return x.id === currentItemId; });
  var status = item ? item.status : null;

  var html = '';

  if (status === 'PENDING_DELIVERY_REVISION') {
    html =
      '<button class="btn-approve" style="margin-bottom:8px" onclick="doAction(\'acceptDelivery\')">✅ APROVAR ENTREGA</button>' +
      '<button class="btn-dispute" style="margin-bottom:8px" onclick="doAction(\'refuseDelivery\')">↩ Solicitar Revisão</button>';
  } else if (status === 'FROZEN') {
    html =
      '<button class="btn-approve" style="margin-bottom:8px" onclick="doAction(\'acceptDeliveryAfterFreeze\')">✅ Aceitar mesmo assim</button>' +
      '<button class="btn-dispute" onclick="doAction(\'openDispute\')">⚖️ Abrir Disputa</button>';
  } else {
    section.style.display = 'none';
    return;
  }

  btns.innerHTML = html;
  section.style.display = '';
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
    if (res.ok) {
      var msgRes = await fetch(API_BASE + '/chat/orderItem/' + currentItemId, { headers: authHdr() });
      if (msgRes.ok) { lastMessages = await msgRes.json(); renderMessages(lastMessages); }
    }
  } catch (_) {}
}

function handleKey(e)    { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }
function autoResize(el)  { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }

/* ── Action dispatcher ────────────────────────────────────────────── */

async function doAction(action) {
  if (!currentItemId) return;

  var btns = document.querySelectorAll('#actionButtons button');
  btns.forEach(function (b) { b.disabled = true; });

  try {
    var res = await fetch(API_BASE + '/chat/orderItem/' + currentItemId + '/' + action, {
      method:  'POST',
      headers: authHdr()
    });

    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var msg = (Array.isArray(data.errors) && data.errors.length)
        ? data.errors.map(function (e) { return e.message; }).join(' | ')
        : 'Erro ao executar ação.';
      alert(msg);
      btns.forEach(function (b) { b.disabled = false; });
      return;
    }

    await refreshSidebarItems();
    var msgRes = await fetch(API_BASE + '/chat/orderItem/' + currentItemId, { headers: authHdr() });
    if (msgRes.ok) { lastMessages = await msgRes.json(); renderMessages(lastMessages); }
    updateActionButtons();
    updateServiceBar(currentItemId);

  } catch (_) {
    alert('Erro de conexão.');
    btns.forEach(function (b) { b.disabled = false; });
  }
}

/* ── Sidebar search ──────────────────────────────────────────────── */

function filterConvs() {
  var q = ((document.getElementById('convSearch') || {}).value || '').toLowerCase();
  document.querySelectorAll('#convList .conv-item').forEach(function (el) {
    el.style.display = (el.dataset.searchText || '').includes(q) ? '' : 'none';
  });
}

/* ── Utils ──────────────────────────────────────────────────────────── */

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatPrice(price) {
  if (price == null) return '—';
  var n = Number(price);
  return 'R$' + (Number.isInteger(n) ? n : n.toFixed(2).replace('.', ','));
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
