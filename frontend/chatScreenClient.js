const API_BASE = 'http://localhost:8080';

OFAuth.requireLogin();
OFAuth.loadNav();
initNotifPanel();

/* ── State ─────────────────────────────────────────────────────────── */

var currentItemId  = null;
var lastMessages   = [];
var pollTimer      = null;

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

var MESSAGE_TYPE_LABELS = {
  TEXT:                          null,
  ATTACHMENT:                    null,
  DELIVERY:                      '📦 Entrega realizada — aguardando sua aprovação',
  DELIVERY_ACCEPTED:             '✅ Entrega aprovada',
  DELIVERY_REFUSED:              '❌ Revisão solicitada',
  ADJUSTMENT_ACCEPTED:           '🔄 Revisão aceita pelo freelancer',
  ADJUSTMENT_REFUSED:            '🚫 Revisão recusada — aguardando sua decisão',
  DISPUTE_OPENED:                '⚖️ Disputa aberta',
  DISPUTE_RESOLVED_FREELANCER:   '✓ Disputa resolvida — favor freelancer',
  DISPUTE_RESOLVED_CLIENT:       '↩ Disputa resolvida — reembolso processado',
  DELIVERY_ACCEPTED_AFTER_FREEZE:'✅ Entrega aceita após revisão recusada'
};

/* ── Boot — check URL param ─────────────────────────────────────────── */

(function init() {
  var params = new URLSearchParams(window.location.search);
  var itemId = params.get('orderItemId');
  if (itemId) {
    loadConversation(Number(itemId));
  } else {
    showEmptySidebar();
  }
})();

function showEmptySidebar() {
  var list = document.getElementById('convList');
  if (list) {
    list.innerHTML =
      '<div class="conv-item" style="display:block;padding:20px 16px;text-align:center;color:var(--muted2);font-size:12px;line-height:1.6">' +
        '<div style="font-size:28px;margin-bottom:8px">💬</div>' +
        '<div style="font-weight:600;color:var(--text);margin-bottom:4px">Acesse um pedido</div>' +
        'Suas conversas aparecem aqui quando você acessa um pedido ativo.' +
      '</div>';
  }
}

/* ── Load conversation ──────────────────────────────────────────────── */

async function loadConversation(itemId) {
  currentItemId = itemId;

  var msgs = document.getElementById('chatMessages');
  if (msgs) msgs.innerHTML = '<div class="msg-date">Carregando conversa...</div>';

  try {
    var res = await fetch(API_BASE + '/chat/orderItem/' + itemId, { headers: authHdr() });

    if (res.status === 403 || res.status === 401) {
      if (msgs) msgs.innerHTML = '<div class="msg-date" style="color:#ef4444">Sem permissão para visualizar esta conversa.</div>';
      return;
    }
    if (!res.ok) {
      if (msgs) msgs.innerHTML = '<div class="msg-date" style="color:#ef4444">Conversa não encontrada.</div>';
      return;
    }

    lastMessages = await res.json();

    updateSidebarItem(itemId, lastMessages);
    updateServiceBar(itemId, lastMessages);
    renderMessages(lastMessages);
    updateActionButtons(lastMessages);

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function () { pollMessages(itemId); }, 6000);

  } catch (e) {
    if (msgs) msgs.innerHTML = '<div class="msg-date" style="color:#ef4444">Erro ao carregar conversa.</div>';
  }
}

async function pollMessages(itemId) {
  if (itemId !== currentItemId) return;
  try {
    var res = await fetch(API_BASE + '/chat/orderItem/' + itemId, { headers: authHdr() });
    if (!res.ok) return;
    lastMessages = await res.json();
    renderMessages(lastMessages);
    updateActionButtons(lastMessages);
  } catch (_) {}
}

/* ── Sidebar ────────────────────────────────────────────────────────── */

function updateSidebarItem(itemId, messages) {
  var list = document.getElementById('convList');
  if (!list) return;

  var freelancerName = '—';
  var myName = OFAuth.getName();
  var other = messages.find(function (m) { return m.senderName && m.senderName !== myName; });
  if (other) freelancerName = other.senderName;

  var lastMsg = messages.length ? messages[messages.length - 1] : null;
  var preview = lastMsg ? (lastMsg.content || '📎 Arquivo') : 'Sem mensagens';
  var time    = lastMsg && lastMsg.sentAt
    ? new Date(lastMsg.sentAt).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})
    : '';

  list.innerHTML =
    '<div class="conv-item active">' +
      '<div class="conv-avatar" style="background:var(--gdim);color:var(--green)">' + escHtml(OFAuth.getInitials(freelancerName)) + '</div>' +
      '<div class="conv-info">' +
        '<div class="conv-name"><span class="conv-name-text">' + escHtml(freelancerName) + '</span><span class="conv-time">' + time + '</span></div>' +
        '<div class="conv-service-tag">Pedido #' + itemId + '</div>' +
        '<div class="conv-preview"><span>' + escHtml(preview.substring(0, 40)) + '</span></div>' +
      '</div>' +
    '</div>';

  var headerName   = document.getElementById('chatHeaderName');
  var headerAvatar = document.getElementById('chatHeaderAvatar');
  var infoPanelAvatar = document.getElementById('infoPanelAvatar');
  var infoPanelName   = document.getElementById('infoPanelName');
  var infoPanelRole   = document.getElementById('infoPanelRole');

  if (headerName)     headerName.textContent     = freelancerName;
  if (headerAvatar)   headerAvatar.textContent   = OFAuth.getInitials(freelancerName);
  if (infoPanelAvatar) infoPanelAvatar.textContent = OFAuth.getInitials(freelancerName);
  if (infoPanelName)  infoPanelName.textContent  = freelancerName;
  if (infoPanelRole)  infoPanelRole.textContent  = 'Freelancer · Pedido #' + itemId;
}

/* ── Service bar ────────────────────────────────────────────────────── */

function updateServiceBar(itemId, messages) {
  var bar = document.getElementById('serviceBar');
  if (!bar) return;
  bar.style.display = '';

  document.getElementById('svcBarTitle').textContent = 'Pedido Item #' + itemId;
  document.getElementById('svcBarSub').textContent   = messages.length + ' mensagem(ns) na conversa';
  document.getElementById('svcBarPrice').textContent = '—';
  document.getElementById('svcBarStatus').textContent = '—';
}

/* ── Messages ─────────────────────────────────────────────────────── */

function renderMessages(messages) {
  var msgs    = document.getElementById('chatMessages');
  if (!msgs) return;
  var wasBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 80;
  var myName  = OFAuth.getName();

  msgs.innerHTML = '';

  if (!messages || !messages.length) {
    msgs.innerHTML = '<div class="msg-date">Nenhuma mensagem ainda.</div>';
    return;
  }

  messages.forEach(function (m) {
    var isMine     = m.senderName === myName;
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

    var avatarColor = isMine ? '#60a5fa' : 'var(--gdim)';
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

/* ── Action buttons ───────────────────────────────────────────────── */

function updateActionButtons(messages) {
  var section = document.getElementById('actionsSection');
  var btns    = document.getElementById('actionButtons');
  if (!section || !btns) return;

  var html = '';

  if (!messages || !messages.length) {
    section.style.display = 'none';
    return;
  }

  var lastMsg = messages[messages.length - 1];
  var lastType = lastMsg ? lastMsg.type : null;

  var hasDelivery        = lastType === 'DELIVERY';
  var hasRefusalFreeze   = lastType === 'ADJUSTMENT_REFUSED';

  if (hasDelivery) {
    html =
      '<button class="btn-approve" style="margin-bottom:8px" onclick="doAction(\'acceptDelivery\')">✅ APROVAR ENTREGA</button>' +
      '<button class="btn-dispute" style="margin-bottom:8px" onclick="doAction(\'refuseDelivery\')">↩ Solicitar Revisão</button>';
  } else if (hasRefusalFreeze) {
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
      await pollMessages(currentItemId);
    }
  } catch (_) {}
}

function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }

/* ── Action dispatcher ────────────────────────────────────────────── */

async function doAction(action) {
  if (!currentItemId) return;

  var section = document.getElementById('actionsSection');
  var btns    = document.querySelectorAll('#actionButtons button');
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

    lastMessages = await loadMessagesQuiet();
    renderMessages(lastMessages);
    updateActionButtons(lastMessages);

  } catch (_) {
    alert('Erro de conexão.');
    btns.forEach(function (b) { b.disabled = false; });
  }
}

async function loadMessagesQuiet() {
  try {
    var res = await fetch(API_BASE + '/chat/orderItem/' + currentItemId, { headers: authHdr() });
    if (res.ok) return await res.json();
  } catch (_) {}
  return lastMessages;
}

/* ── Legacy / sidebar stubs ─────────────────────────────────────── */

function selectConv(el, initials, color, name, role) {
  document.querySelectorAll('.conv-item').forEach(function (i) { i.classList.remove('active'); });
  el.classList.add('active');
  var headerName   = document.getElementById('chatHeaderName');
  var headerAvatar = document.getElementById('chatHeaderAvatar');
  if (headerName)   headerName.textContent   = name;
  if (headerAvatar) headerAvatar.textContent  = initials;
}

function filterConvs() {
  var q = (document.getElementById('convSearch') || {}).value || '';
  q = q.toLowerCase();
  document.querySelectorAll('.conv-item').forEach(function (item) {
    var nameEl = item.querySelector('.conv-name-text');
    var name   = nameEl ? nameEl.textContent.toLowerCase() : '';
    item.style.display = name.includes(q) ? 'flex' : 'none';
  });
}

/* ── Utils ──────────────────────────────────────────────────────────── */

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
