const API_BASE = 'http://localhost:8080';

OFAuth.requireLogin();
OFAuth.loadNav();
initNotifPanel();

/* ── Role (conta inteira é freelancer OU cliente, nunca os dois) ─────── */

var ROLE = OFAuth.getType() === 'freelancer' ? 'freelancer' : 'client';
var IS_FREELANCER = ROLE === 'freelancer';

/* ── State ─────────────────────────────────────────────────────────── */

var allItems           = [];
var currentItemId       = null;
var lastMessages        = [];
var selectedDelivFiles  = [];
var pollTimer           = null;

function authHdr() {
  return { Authorization: OFAuth.getToken() };
}

function findItem(itemId) {
  return allItems.find(function (x) { return x.id === itemId; });
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

var FREELANCER_MESSAGE_TYPE_INFO = {
  TEXT:                           null,
  ATTACHMENT:                     null,
  DELIVERY:                       { label: '📦 Entrega realizada',                     tone: 'ok' },
  DELIVERY_ACCEPTED:              { label: '✅ Entrega aceita pelo cliente',             tone: 'ok' },
  DELIVERY_REFUSED:               { label: '❌ Revisão solicitada pelo cliente',         tone: 'danger' },
  ADJUSTMENT_ACCEPTED:            { label: '🔄 Revisão aceita — pode reenviar',           tone: 'ok' },
  ADJUSTMENT_REFUSED:             { label: '🚫 Revisão recusada — pedido congelado',      tone: 'danger' },
  DISPUTE_OPENED:                 { label: '⚖️ Disputa aberta',                          tone: 'dispute' },
  DISPUTE_RESOLVED_FREELANCER:    { label: '✓ Disputa resolvida — favor freelancer',     tone: 'ok' },
  DISPUTE_RESOLVED_CLIENT:        { label: '↩ Disputa resolvida — reembolso processado', tone: 'dispute' },
  DELIVERY_ACCEPTED_AFTER_FREEZE: { label: '✅ Entrega aceita pelo cliente (pós-revisão)', tone: 'ok' }
};

var CLIENT_MESSAGE_TYPE_INFO = {
  TEXT:                           null,
  ATTACHMENT:                     null,
  DELIVERY:                       { label: '📦 Entrega realizada — aguardando sua aprovação', tone: 'ok' },
  DELIVERY_ACCEPTED:              { label: '✅ Entrega aprovada',                              tone: 'ok' },
  DELIVERY_REFUSED:               { label: '❌ Revisão solicitada',                            tone: 'danger' },
  ADJUSTMENT_ACCEPTED:            { label: '🔄 Revisão aceita pelo freelancer',                 tone: 'ok' },
  ADJUSTMENT_REFUSED:             { label: '🚫 Revisão recusada — aguardando sua decisão',      tone: 'danger' },
  DISPUTE_OPENED:                 { label: '⚖️ Disputa aberta',                                tone: 'dispute' },
  DISPUTE_RESOLVED_FREELANCER:    { label: '✓ Disputa resolvida — favor freelancer',           tone: 'ok' },
  DISPUTE_RESOLVED_CLIENT:        { label: '↩ Disputa resolvida — reembolso processado',       tone: 'dispute' },
  DELIVERY_ACCEPTED_AFTER_FREEZE: { label: '✅ Entrega aceita após revisão recusada',           tone: 'ok' }
};

var MESSAGE_TYPE_INFO = IS_FREELANCER ? FREELANCER_MESSAGE_TYPE_INFO : CLIENT_MESSAGE_TYPE_INFO;

/* ── Boot: ajusta UI conforme o papel ─────────────────────────────── */

(function setupRoleUI() {
  document.getElementById('convTitle').textContent = IS_FREELANCER ? 'Meus Pedidos' : 'Mensagens';
  document.getElementById('convSearch').placeholder = IS_FREELANCER ? 'Buscar pedido...' : 'Buscar conversa...';
  document.getElementById('infoPanelCounterpartLabel').textContent = IS_FREELANCER ? 'Cliente' : 'Freelancer';
  document.getElementById('chatBackLink').href = IS_FREELANCER ? 'profile.html' : 'profile.html#pedidos';
  document.getElementById('chatClosedSub').textContent = IS_FREELANCER
    ? 'A entrega foi aceita e o pagamento foi liberado. Este chat foi encerrado e não aceita mais mensagens.'
    : 'Você aprovou a entrega e o pagamento foi liberado ao freelancer. Este chat foi encerrado e não aceita mais mensagens.';

  if (!IS_FREELANCER) {
    document.getElementById('quickReplies').style.display = 'none';
    document.getElementById('btnAttachDelivery').style.display = 'none';
    document.getElementById('navCartLink').style.display = '';
  } else {
    document.getElementById('navCartLink').style.display = 'none';
  }
})();

/* ── Sidebar ──────────────────────────────────────────────────────── */

async function fetchRawItems() {
  if (IS_FREELANCER) {
    var res = await fetch(API_BASE + '/delivery/myActiveItems', { headers: authHdr() });
    if (res.status === 401 || res.status === 403) { OFAuth.logout(); return null; }
    return res.ok ? await res.json() : [];
  }

  var res2 = await fetch(API_BASE + '/order/myOrders', { headers: authHdr() });
  if (res2.status === 401 || res2.status === 403) { OFAuth.logout(); return null; }
  var orders = res2.ok ? await res2.json() : [];
  var items = [];
  orders.forEach(function (order) {
    if (order.status === 'PAID') {
      (order.items || []).forEach(function (item) { items.push(item); });
    }
  });
  return items;
}

function normalizeItem(raw) {
  raw.counterpartName = IS_FREELANCER ? raw.clientName : raw.freelancerName;
  return raw;
}

async function loadSidebar() {
  var list = document.getElementById('convList');
  list.innerHTML = '<div class="conv-item" style="justify-content:center;color:var(--muted2);font-size:12px;padding:12px">Carregando...</div>';

  try {
    var items = await fetchRawItems();
    if (items === null) return;
    allItems = items.map(normalizeItem);
    renderSidebar();
  } catch (e) {
    list.innerHTML = '<div class="conv-item" style="color:#ef4444;font-size:12px;padding:12px">Erro ao carregar conversas.</div>';
  }
}

async function refreshItems() {
  try {
    var items = await fetchRawItems();
    if (items !== null) {
      allItems = items.map(normalizeItem);
      renderSidebar();
    }
  } catch (_) {}

  var item = findItem(currentItemId);
  if (item) {
    updateActionButtons(item);
    updateServiceBar(item);
    updateInfoPanel(item);
  }
}

function renderSidebar() {
  var list = document.getElementById('convList');
  list.innerHTML = '';

  if (!allItems.length) {
    list.innerHTML = IS_FREELANCER
      ? '<div class="conv-item" style="display:block;padding:20px 16px;text-align:center;color:var(--muted2);font-size:12px;line-height:1.6">' +
          '<div style="font-size:28px;margin-bottom:8px">📦</div>' +
          '<div style="font-weight:600;color:var(--text);margin-bottom:4px">Nenhum pedido ativo</div>' +
          'Quando clientes comprarem seus serviços, os pedidos aparecem aqui.' +
        '</div>'
      : '<div class="conv-item" style="display:block;padding:28px 16px;text-align:center;color:var(--muted2);font-size:12px;line-height:1.6">' +
          '<div style="font-size:28px;margin-bottom:8px">💬</div>' +
          '<div style="font-weight:600;color:var(--text);margin-bottom:4px">Nenhuma conversa</div>' +
          'Suas conversas aparecem aqui quando você faz um pedido.' +
        '</div>';
    return;
  }

  allItems.forEach(function (item) {
    var statusLabel = STATUS_LABELS[item.status]       || item.status || '—';
    var statusClass  = STATUS_BADGE_CLASSES[item.status] || 'status-pending';
    var price = item.totalPrice != null
      ? 'R$ ' + Number(item.totalPrice).toLocaleString('pt-BR', {minimumFractionDigits:2})
      : '—';
    var inits = OFAuth.getInitials(item.counterpartName || '?');

    var div = document.createElement('div');
    div.className = 'conv-item' + (item.id === currentItemId ? ' active' : '');
    div.dataset.itemId = item.id;
    div.dataset.searchText = ((item.workTitle || '') + ' ' + (item.counterpartName || '')).toLowerCase();
    div.innerHTML =
      '<div class="conv-avatar" style="background:var(--gdim);color:var(--green)">' + escHtml(inits) + '</div>' +
      '<div class="conv-info">' +
        '<div class="conv-name"><span class="conv-name-text">' + escHtml(item.counterpartName || (IS_FREELANCER ? 'Cliente' : 'Freelancer')) + '</span><span class="conv-time">' + price + '</span></div>' +
        '<div class="conv-service-tag">' + escHtml(item.workTitle || 'Pedido #' + item.id) + '</div>' +
        '<div class="conv-preview"><span class="status-badge ' + statusClass + '" style="font-size:9px">' + escHtml(statusLabel.toUpperCase()) + '</span></div>' +
      '</div>';

    div.addEventListener('click', function () { selectConversation(item.id); });
    list.appendChild(div);
  });
}

function filterConvs() {
  var q = ((document.getElementById('convSearch') || {}).value || '').toLowerCase();
  document.querySelectorAll('#convList .conv-item').forEach(function (el) {
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

  var item = findItem(itemId);
  updateServiceBar(item);
  updateInfoPanel(item);
  updateActionButtons(item);
  loadMessages(itemId);

  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(function () {
    if (!currentItemId) return;
    loadMessages(currentItemId, true);
    refreshItems();
  }, 3000);
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
  var sub = IS_FREELANCER
    ? (item.deadlineDate ? 'Entrega até: ' + new Date(item.deadlineDate).toLocaleDateString('pt-BR') : (item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : ''))
    : lastMessages.length + ' mensagem(ns)';

  document.getElementById('svcBarTitle').textContent  = item.workTitle || 'Pedido #' + item.id;
  document.getElementById('svcBarSub').textContent    = sub;
  document.getElementById('svcBarPrice').textContent  = price;
  document.getElementById('svcBarStatus').textContent = status;
}

function updateInfoPanel(item) {
  if (!item) return;

  var counterpartSection = document.getElementById('infoPanelCounterpartSection');
  var earningSection     = document.getElementById('infoPanelEarningSection');
  if (counterpartSection) counterpartSection.style.display = '';
  if (earningSection)     earningSection.style.display     = IS_FREELANCER ? '' : 'none';

  var nameEl   = document.getElementById('infoPanelName');
  var avatarEl = document.getElementById('infoPanelAvatar');
  var metaEl   = document.getElementById('infoPanelMeta');
  if (nameEl)   nameEl.textContent   = item.counterpartName || '—';
  if (avatarEl) avatarEl.textContent = OFAuth.getInitials(item.counterpartName || '?');
  if (metaEl)   metaEl.textContent   = item.workTitle || '';

  var headerName   = document.getElementById('chatHeaderName');
  var headerAvatar = document.getElementById('chatHeaderAvatar');
  var headerStatus = document.getElementById('chatHeaderStatus');
  if (headerName)   headerName.textContent   = item.counterpartName || '—';
  if (headerAvatar) headerAvatar.textContent = OFAuth.getInitials(item.counterpartName || '?');
  if (headerStatus) headerStatus.textContent = STATUS_LABELS[item.status] || '';

  if (IS_FREELANCER) {
    var price = item.totalPrice != null
      ? 'R$ ' + Number(item.totalPrice).toLocaleString('pt-BR', {minimumFractionDigits:2})
      : '—';
    var earningEl = document.getElementById('earningVal');
    if (earningEl) earningEl.textContent = price;
  }
}

/* ── Action buttons ───────────────────────────────────────────────── */

function updateActionButtons(item) {
  var section = document.getElementById('actionsSection');
  var btns    = document.getElementById('actionButtons');
  if (!section || !btns) return;

  toggleChatClosed(item);

  if (!item) { btns.innerHTML = ''; section.style.display = 'none'; return; }

  var html = '';

  if (IS_FREELANCER) {
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
  } else {
    switch (item.status) {
      case 'PENDING_DELIVERY':
        html = '<p style="font-size:12px;color:var(--muted2);line-height:1.5">⏳ Aguardando o freelancer enviar a entrega.</p>';
        break;
      case 'PENDING_DELIVERY_REVISION':
        html =
          '<button class="btn-approve" style="margin-bottom:8px" onclick="doAction(\'acceptDelivery\')">✅ APROVAR ENTREGA</button>' +
          '<button class="btn-dispute" style="margin-bottom:8px" onclick="openRefuseModal()">↩ Solicitar Revisão</button>';
        break;
      case 'FROZEN':
        html =
          '<button class="btn-approve" style="margin-bottom:8px" onclick="doAction(\'acceptDeliveryAfterFreeze\')">✅ Aceitar mesmo assim</button>' +
          '<button class="btn-dispute" onclick="doAction(\'openDispute\')">⚖️ Abrir Disputa</button>';
        break;
      case 'ON_DISPUTE':
        html = '<p style="font-size:12px;color:var(--muted2);line-height:1.5">⚖️ Disputa em análise pelo administrador.</p>';
        break;
      case 'COMPLETED':
        html = '<p style="font-size:12px;color:var(--green);line-height:1.5">✅ Pedido concluído.</p>';
        break;
      case 'REFUNDED':
        html = '<p style="font-size:12px;color:var(--muted2);line-height:1.5">↩ Pedido reembolsado.</p>';
        break;
    }
  }

  if (!html) { btns.innerHTML = ''; section.style.display = 'none'; return; }

  btns.innerHTML = html;
  section.style.display = '';
}

function toggleChatClosed(item) {
  var banner    = document.getElementById('chatClosedBanner');
  var inputArea = document.getElementById('chatInputArea');
  if (!banner || !inputArea) return;

  var isFinished = !!item && (item.status === 'COMPLETED' || item.status === 'REFUNDED');
  banner.style.display    = isFinished ? '' : 'none';
  inputArea.style.display = isFinished ? 'none' : '';

  if (!isFinished) return;

  var icon  = banner.querySelector('.chat-closed-icon');
  var title = banner.querySelector('.chat-closed-title');
  var sub   = document.getElementById('chatClosedSub');

  if (item.status === 'REFUNDED') {
    if (icon)  icon.textContent  = '↩';
    if (title) title.textContent = 'Pedido reembolsado';
    if (sub) sub.textContent = IS_FREELANCER
      ? 'O administrador resolveu a disputa em favor do cliente e o valor foi reembolsado a ele. Este chat foi encerrado e não aceita mais mensagens.'
      : 'O administrador resolveu a disputa em seu favor e o valor foi reembolsado. Este chat foi encerrado e não aceita mais mensagens.';
  } else {
    if (icon)  icon.textContent  = '✅';
    if (title) title.textContent = 'Serviço concluído';
    if (sub) sub.textContent = IS_FREELANCER
      ? 'A entrega foi aceita e o pagamento foi liberado. Este chat foi encerrado e não aceita mais mensagens.'
      : 'Você aprovou a entrega e o pagamento foi liberado ao freelancer. Este chat foi encerrado e não aceita mais mensagens.';
  }
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

    var item = findItem(itemId);
    if (item) updateServiceBar(item);
  } catch (e) {
    if (!silent) msgs.innerHTML = '<div class="msg-date" style="color:#ef4444">Erro ao carregar mensagens.</div>';
  }
}

function renderMessages(messages) {
  var msgs      = document.getElementById('chatMessages');
  var wasBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 80;
  var myName    = OFAuth.getName();

  lastMessages = messages || [];
  msgs.innerHTML = '';

  if (!messages || !messages.length) {
    msgs.innerHTML = '<div class="msg-date">Nenhuma mensagem ainda' + (IS_FREELANCER ? '. Diga olá ao cliente! 👋' : '.') + '</div>';
    return;
  }

  messages.forEach(function (m) {
    var isMine    = m.senderName && m.senderName === myName;
    var inits     = OFAuth.getInitials(m.senderName || '?');
    var time      = m.sentAt ? new Date(m.sentAt).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}) : '';
    var eventInfo = MESSAGE_TYPE_INFO[m.type];
    var hasFiles  = m.attachments && m.attachments.length;

    if (!eventInfo && !m.content && !hasFiles) return;

    var div = document.createElement('div');
    div.className = 'msg' + (isMine ? ' mine' : '');

    var attachHtml = '';
    if (hasFiles) {
      attachHtml = m.attachments.map(function (a) {
        var url = API_BASE + '/chat/orderItem/' + m.orderItemId + '/attachment/' + (a.source || 'MESSAGE') + '/' + a.id + '/download';
        return '<div class="msg-file">' +
          '<span class="msg-file-icon">📄</span>' +
          '<div class="msg-file-info">' +
            '<div class="msg-file-name">' + escHtml(a.originalName || 'arquivo') + '</div>' +
            '<div class="msg-file-size">' + formatFileSize(a.fileSize) + '</div>' +
          '</div>' +
          '<button class="msg-file-download" data-url="' + escHtml(url) + '" data-name="' + escHtml(a.originalName || 'arquivo') + '" title="Baixar arquivo">⬇</button>' +
        '</div>';
      }).join('');
    }

    var avatarBg    = isMine ? 'var(--gdim)' : '#60a5fa';
    var avatarColor = isMine ? ';color:var(--green)' : '';

    var bodyHtml;
    if (eventInfo) {
      var toneClass = eventInfo.tone !== 'ok' ? ' tone-' + eventInfo.tone : '';
      bodyHtml =
        '<div class="msg-bubble msg-event' + toneClass + '">' +
          '<div class="msg-event-label' + toneClass + '">' + escHtml(eventInfo.label) + '</div>' +
          (m.content ? '<div class="msg-event-text">' + escHtml(m.content) + '</div>' : '') +
          attachHtml +
        '</div>';
    } else {
      bodyHtml =
        (m.content  ? '<div class="msg-bubble">' + escHtml(m.content) + '</div>' : '') +
        (attachHtml ? '<div class="msg-bubble">' + attachHtml + '</div>' : '');
    }

    div.innerHTML =
      '<div class="msg-avatar" style="background:' + avatarBg + avatarColor + '">' + escHtml(inits) + '</div>' +
      '<div class="msg-content">' +
        bodyHtml +
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
      alert((Array.isArray(data.errors) && data.errors.length)
        ? data.errors.map(function (e) { return e.message; }).join(' | ')
        : 'Erro ao executar ação.');
      btns.forEach(function (b) { b.disabled = false; });
      return;
    }

    await refreshItems();
    await loadMessages(currentItemId, true);

  } catch (_) {
    alert('Erro de conexão.');
    btns.forEach(function (b) { b.disabled = false; });
  }
}

/* ── Delivery modal (papel freelancer) ────────────────────────────── */

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

  if (statusMsg) { statusMsg.textContent = ''; statusMsg.className = 'admin-form-msg'; }

  if (!selectedDelivFiles.length) {
    if (statusMsg) { statusMsg.textContent = 'Selecione ao menos um arquivo para entregar.'; statusMsg.className = 'admin-form-msg admin-form-msg-error'; }
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'ENVIANDO...';

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
    await refreshItems();
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

document.querySelector('.btn-attach-delivery').addEventListener('click', openDeliveryModal);

/* ── Refuse delivery modal (papel cliente) ────────────────────────── */

function openRefuseModal() {
  if (!currentItemId) return;
  document.getElementById('refuseMsg').value = '';
  var statusMsg = document.getElementById('refuseStatusMsg');
  if (statusMsg) { statusMsg.textContent = ''; statusMsg.className = 'admin-form-msg'; }
  var btn = document.getElementById('refuseSubmitBtn');
  if (btn) { btn.disabled = false; btn.textContent = 'ENVIAR SOLICITAÇÃO'; }
  document.getElementById('refuseModal').classList.add('show');
}

function closeRefuseModal() {
  document.getElementById('refuseModal').classList.remove('show');
}

async function submitRefuseDelivery() {
  if (!currentItemId) return;

  var reason    = document.getElementById('refuseMsg').value.trim();
  var statusMsg = document.getElementById('refuseStatusMsg');
  var btn       = document.getElementById('refuseSubmitBtn');

  btn.disabled    = true;
  btn.textContent = 'ENVIANDO...';
  if (statusMsg) { statusMsg.textContent = ''; statusMsg.className = 'admin-form-msg'; }

  var form = new FormData();
  if (reason) form.append('message', reason);

  try {
    var res = await fetch(API_BASE + '/chat/orderItem/' + currentItemId + '/refuseDelivery', {
      method:  'POST',
      headers: authHdr(),
      body:    form
    });

    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var errMsg = (Array.isArray(data.errors) && data.errors.length)
        ? data.errors.map(function (e) { return e.message; }).join(' | ')
        : 'Erro ao solicitar revisão.';
      if (statusMsg) { statusMsg.textContent = errMsg; statusMsg.className = 'admin-form-msg admin-form-msg-error'; }
      btn.disabled    = false;
      btn.textContent = 'ENVIAR SOLICITAÇÃO';
      return;
    }

    closeRefuseModal();
    await refreshItems();
    await loadMessages(currentItemId, true);

  } catch (_) {
    if (statusMsg) { statusMsg.textContent = 'Erro de conexão.'; statusMsg.className = 'admin-form-msg admin-form-msg-error'; }
    btn.disabled    = false;
    btn.textContent = 'ENVIAR SOLICITAÇÃO';
  }
}

document.getElementById('refuseModal').addEventListener('click', function (e) {
  if (e.target === this) closeRefuseModal();
});

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

async function downloadFile(url, filename) {
  try {
    var res = await fetch(url, { headers: authHdr() });
    if (!res.ok) { alert('Erro ao baixar arquivo.'); return; }
    var blob = await res.blob();
    var blobUrl = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'arquivo';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (_) {
    alert('Erro de conexão ao baixar arquivo.');
  }
}

document.getElementById('chatMessages').addEventListener('click', function (e) {
  var btn = e.target.closest('.msg-file-download');
  if (!btn) return;
  downloadFile(btn.dataset.url, btn.dataset.name);
});

/* ── Boot — abre orderItemId da URL se vier por query param ───────── */
(async function boot() {
  await loadSidebar();

  var params = new URLSearchParams(window.location.search);
  var itemId = params.get('orderItemId');
  if (itemId) {
    var id   = Number(itemId);
    var item = findItem(id);
    if (item) selectConversation(id);
  }
})();
