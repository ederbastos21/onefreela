const API_BASE = 'http://localhost:8080';

OFAuth.requireLogin();
OFAuth.loadNav();
initNotifPanel();

/* ── State ─────────────────────────────────────────────────────────── */

var allOrderItems     = [];
var currentItemId     = null;
var selectedDelivFiles = [];
var pollTimer         = null;

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
  DELIVERY_ACCEPTED:             '✅ Entrega aceita',
  DELIVERY_REFUSED:              '❌ Revisão solicitada',
  ADJUSTMENT_ACCEPTED:           '🔄 Revisão aceita',
  ADJUSTMENT_REFUSED:            '🚫 Revisão recusada',
  DISPUTE_OPENED:                '⚖️ Disputa aberta',
  DISPUTE_RESOLVED_FREELANCER:   '✓ Disputa resolvida — Freelancer',
  DISPUTE_RESOLVED_CLIENT:       '↩ Disputa resolvida — Cliente',
  DELIVERY_ACCEPTED_AFTER_FREEZE:'✅ Entrega aceita (pós-revisão)'
};

/* ── Load sidebar ─────────────────────────────────────────────────── */

async function loadSidebar() {
  var list = document.getElementById('convList');
  list.innerHTML = '<div class="conv-item" style="justify-content:center;color:var(--muted2);font-size:12px;padding:12px">Carregando...</div>';

  try {
    var endpoints = [
      '/delivery/findPending',
      '/delivery/findPendingAdjustments',
      '/delivery/findOnDispute',
      '/delivery/findCompleted'
    ];

    var results = await Promise.all(endpoints.map(function (ep) {
      return fetch(API_BASE + ep, { headers: authHdr() })
        .then(function (r) { return r.ok ? r.json() : []; })
        .catch(function () { return []; });
    }));

    var seen = {};
    allOrderItems = [];
    results.forEach(function (arr) {
      (arr || []).forEach(function (item) {
        if (!seen[item.id]) {
          seen[item.id] = true;
          allOrderItems.push(item);
        }
      });
    });

    renderSidebar(allOrderItems);
  } catch (e) {
    list.innerHTML = '<div class="conv-item" style="color:#ef4444;font-size:12px;padding:12px">Erro ao carregar pedidos.</div>';
  }
}

function renderSidebar(items) {
  var list = document.getElementById('convList');
  list.innerHTML = '';

  if (!items.length) {
    list.innerHTML = '<div class="conv-item" style="justify-content:center;color:var(--muted2);font-size:12px;padding:20px;text-align:center">Nenhum pedido ativo encontrado.</div>';
    return;
  }

  items.forEach(function (item) {
    var statusLabel = STATUS_LABELS[item.status]  || item.status || '—';
    var statusClass = STATUS_BADGE_CLASSES[item.status] || 'status-pending';
    var price = item.totalPrice != null
      ? 'R$ ' + Number(item.totalPrice).toLocaleString('pt-BR', {minimumFractionDigits:2})
      : '—';
    var date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '';

    var div = document.createElement('div');
    div.className = 'conv-item' + (item.id === currentItemId ? ' active' : '');
    div.dataset.itemId = item.id;
    div.innerHTML =
      '<div class="conv-avatar" style="background:var(--gdim);color:var(--green)">📦</div>' +
      '<div class="conv-info">' +
        '<div class="conv-name"><span class="conv-name-text">Pedido #' + item.id + '</span><span class="conv-time">' + date + '</span></div>' +
        '<div class="conv-service-tag">' + escHtml(price) + '</div>' +
        '<div class="conv-preview"><span>' + escHtml(statusLabel) + '</span></div>' +
        '<span class="status-badge ' + statusClass + '">' + escHtml(statusLabel.toUpperCase()) + '</span>' +
      '</div>';

    div.addEventListener('click', function () { selectConversation(item.id); });
    list.appendChild(div);
  });
}

/* ── Select conversation ─────────────────────────────────────────── */

function selectConversation(itemId) {
  currentItemId = itemId;

  document.querySelectorAll('.conv-item').forEach(function (el) {
    el.classList.toggle('active', Number(el.dataset.itemId) === itemId);
  });

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

  var status  = STATUS_LABELS[item.status] || item.status || '—';
  var price   = item.totalPrice != null
    ? 'R$ ' + Number(item.totalPrice).toLocaleString('pt-BR', {minimumFractionDigits:2})
    : '—';
  var deadline = item.deadlineDate
    ? 'Entrega: ' + new Date(item.deadlineDate).toLocaleDateString('pt-BR')
    : '';

  document.getElementById('svcBarTitle').textContent = 'Pedido Item #' + item.id;
  document.getElementById('svcBarSub').textContent   = deadline || ('Criado em: ' + (item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '—'));
  document.getElementById('svcBarPrice').textContent  = price;
  document.getElementById('svcBarStatus').textContent = status;
}

function updateInfoPanel(item) {
  if (!item) return;

  var clientSection  = document.getElementById('infoPanelClientSection');
  var earningSection = document.getElementById('infoPanelEarningSection');
  if (clientSection)  clientSection.style.display  = '';
  if (earningSection) earningSection.style.display  = '';

  var price = item.totalPrice != null
    ? 'R$ ' + Number(item.totalPrice).toLocaleString('pt-BR', {minimumFractionDigits:2})
    : '—';
  var earningEl = document.getElementById('earningVal');
  if (earningEl) earningEl.textContent = price;
}

function updateClientFromMessages(messages) {
  if (!messages || !messages.length) return;
  var myId = null;

  var item = allOrderItems.find(function (x) { return x.id === currentItemId; });
  if (!item) return;

  var myInitials = OFAuth.getInitials(OFAuth.getName());

  var otherMsg = messages.find(function (m) {
    return m.senderName && OFAuth.getInitials(m.senderName) !== myInitials;
  });

  if (!otherMsg) return;

  var nameEl = document.getElementById('infoPanelClientName');
  var avatEl = document.getElementById('infoPanelClientAvatar');
  if (nameEl) nameEl.textContent = otherMsg.senderName;
  if (avatEl) avatEl.textContent = OFAuth.getInitials(otherMsg.senderName);

  var headerName   = document.getElementById('chatHeaderName');
  var headerAvatar = document.getElementById('chatHeaderAvatar');
  if (headerName)   headerName.textContent   = otherMsg.senderName;
  if (headerAvatar) headerAvatar.textContent = OFAuth.getInitials(otherMsg.senderName);
}

/* ── Action buttons ───────────────────────────────────────────────── */

function updateActionButtons(item) {
  var section = document.getElementById('actionsSection');
  var btns    = document.getElementById('actionButtons');
  if (!section || !btns || !item) return;

  var status = item.status;
  var html   = '';

  if (status === 'PENDING_DELIVERY' || status === 'PENDING_DELIVERY_REVISION') {
    html = '<button class="btn-deliver" onclick="openDeliveryModal()">FAZER ENTREGA</button>';
  } else if (status === 'ADJUSTMENT_REQUEST') {
    html =
      '<button class="btn-approve" style="margin-bottom:8px" onclick="doAction(\'acceptAdjustment\')">✓ ACEITAR REVISÃO</button>' +
      '<button class="btn-dispute" onclick="doAction(\'refuseAdjustment\')">✗ Recusar Revisão</button>';
  } else if (status === 'ON_DISPUTE') {
    html = '<p style="font-size:12px;color:var(--muted2);line-height:1.5">⚖️ Esta disputa está sendo analisada pelo administrador. Aguarde a decisão.</p>';
  } else if (status === 'FROZEN') {
    html = '<p style="font-size:12px;color:var(--muted2);line-height:1.5">⏸️ O pedido está congelado aguardando decisão do cliente.</p>';
  } else if (status === 'COMPLETED') {
    html = '<p style="font-size:12px;color:var(--green);line-height:1.5">✅ Pedido concluído.</p>';
  } else if (status === 'REFUNDED') {
    html = '<p style="font-size:12px;color:var(--muted2);line-height:1.5">↩ Pedido reembolsado.</p>';
  }

  btns.innerHTML = html;
  section.style.display = '';
}

/* ── Messages ─────────────────────────────────────────────────────── */

async function loadMessages(itemId, silent) {
  if (itemId !== currentItemId) return;

  var msgs = document.getElementById('chatMessages');
  if (!msgs) return;

  if (!silent) {
    msgs.innerHTML = '<div class="msg-date">Carregando...</div>';
  }

  try {
    var res = await fetch(API_BASE + '/chat/orderItem/' + itemId, { headers: authHdr() });
    if (!res.ok) {
      if (!silent) msgs.innerHTML = '<div class="msg-date" style="color:#ef4444">Conversa não encontrada ou acesso negado.</div>';
      return;
    }

    var data = await res.json();
    if (itemId !== currentItemId) return;

    renderMessages(data);
    updateClientFromMessages(data);
  } catch (e) {
    if (!silent) msgs.innerHTML = '<div class="msg-date" style="color:#ef4444">Erro ao carregar mensagens.</div>';
  }
}

function renderMessages(messages) {
  var msgs    = document.getElementById('chatMessages');
  var wasBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 80;
  var myName  = OFAuth.getName();
  var myInits = OFAuth.getInitials(myName);

  msgs.innerHTML = '';

  if (!messages || !messages.length) {
    msgs.innerHTML = '<div class="msg-date">Nenhuma mensagem ainda.</div>';
    return;
  }

  messages.forEach(function (m) {
    var isMine  = m.senderName && m.senderName === myName;
    var inits   = OFAuth.getInitials(m.senderName || '?');
    var time    = m.sentAt ? new Date(m.sentAt).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}) : '';
    var eventLabel = MESSAGE_TYPE_LABELS[m.type];

    if (eventLabel) {
      var ev = document.createElement('div');
      ev.className = 'msg-date';
      ev.style.cssText = 'font-size:11px;padding:4px 12px;background:rgba(127,255,0,.06);border-radius:var(--radius);color:var(--green);border:1px solid rgba(127,255,0,.15);margin:8px auto;display:table';
      ev.textContent = eventLabel;
      msgs.appendChild(ev);
    }

    if (!m.content && !m.attachments.length) return;

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

    div.innerHTML =
      '<div class="msg-avatar" style="background:var(--gdim);color:var(--green)">' + escHtml(inits) + '</div>' +
      '<div>' +
        (m.content ? '<div class="msg-bubble">' + escHtml(m.content) + '</div>' : '') +
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
    if (res.ok) {
      await loadMessages(currentItemId, true);
    }
  } catch (e) {}
}

function useQuick(btn) {
  var input = document.getElementById('msgInput');
  input.value = btn.textContent.trim();
  input.focus();
}

function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }

/* ── Delivery modal ───────────────────────────────────────────────── */

function openDeliveryModal() {
  if (!currentItemId) return;
  document.getElementById('deliveryMsg').value = '';
  document.getElementById('deliveryMsg2').textContent = '';
  document.getElementById('deliveryMsg2').className = 'admin-form-msg';
  selectedDelivFiles = [];
  renderDelivFilesPreview();
  document.getElementById('deliverySubmitBtn').disabled = false;
  document.getElementById('deliverySubmitBtn').textContent = 'ENVIAR ENTREGA';
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

  var msg    = document.getElementById('deliveryMsg').value.trim();
  var msgBox = document.getElementById('deliveryMsg2');
  var btn    = document.getElementById('deliverySubmitBtn');

  btn.disabled    = true;
  btn.textContent = 'ENVIANDO...';
  msgBox.textContent = '';

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
      msgBox.textContent = (Array.isArray(data.errors) && data.errors.length)
        ? data.errors.map(function (e) { return e.message; }).join(' | ')
        : 'Erro ao enviar entrega.';
      msgBox.className = 'admin-form-msg admin-form-msg-error';
      btn.disabled    = false;
      btn.textContent = 'ENVIAR ENTREGA';
      return;
    }

    closeDeliveryModal();
    await loadSidebar();
    await loadMessages(currentItemId, true);
    var item = allOrderItems.find(function (x) { return x.id === currentItemId; });
    if (item) { updateActionButtons(item); updateServiceBar(item); }

  } catch (_) {
    msgBox.textContent = 'Erro de conexão.';
    msgBox.className = 'admin-form-msg admin-form-msg-error';
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

  var endpoint = '/chat/orderItem/' + currentItemId + '/' + action;

  try {
    var res = await fetch(API_BASE + endpoint, {
      method:  'POST',
      headers: authHdr()
    });

    if (!res.ok) {
      var data = await res.json().catch(function () { return {}; });
      var msg = (Array.isArray(data.errors) && data.errors.length)
        ? data.errors.map(function (e) { return e.message; }).join(' | ')
        : 'Erro ao executar ação.';
      alert(msg);
      return;
    }

    await loadSidebar();
    await loadMessages(currentItemId, true);
    var item = allOrderItems.find(function (x) { return x.id === currentItemId; });
    if (item) { updateActionButtons(item); updateServiceBar(item); }

  } catch (_) {
    alert('Erro de conexão.');
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

/* ── Attach btn ─────────────────────────────────────────────────────── */
document.querySelector('.btn-attach-delivery').addEventListener('click', openDeliveryModal);

/* ── Boot ──────────────────────────────────────────────────────────── */
loadSidebar();
