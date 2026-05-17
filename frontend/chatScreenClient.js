OFAuth.loadNav();
initNotifPanel();

function selectConv(el, initials, color, name, role) {
  document.querySelectorAll('.conv-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  el.querySelector('.conv-unread')?.remove();
  document.getElementById('chatHeaderAvatar').textContent = initials;
  document.getElementById('chatHeaderAvatar').style.background = color;
  document.getElementById('chatHeaderName').textContent = name;
  document.getElementById('infoPanelAvatar').textContent = initials;
  document.getElementById('infoPanelAvatar').style.background = color;
  document.getElementById('infoPanelName').textContent = name;
  document.getElementById('infoPanelRole').textContent = role;
}

function filterConvs() {
  const q = document.getElementById('convSearch').value.toLowerCase();
  document.querySelectorAll('.conv-item').forEach(item => {
    const name = item.querySelector('.conv-name-text').textContent.toLowerCase();
    item.style.display = name.includes(q) ? 'flex' : 'none';
  });
}

function sendMsg() {
  const input = document.getElementById('msgInput');
  const text  = input.value.trim();
  if (!text) return;
  const msgs   = document.getElementById('chatMessages');
  const typing = document.getElementById('typingIndicator');
  const div = document.createElement('div');
  div.className = 'msg mine';
  div.innerHTML = `
    <div class="msg-avatar" style="background:#60a5fa">${OFAuth.getInitials(OFAuth.getName())}</div>
    <div>
      <div class="msg-bubble">${text.replace(/</g, '&lt;')}</div>
      <div class="msg-meta">${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} <span class="msg-check">✓✓</span></div>
    </div>`;
  msgs.insertBefore(div, typing);
  input.value = '';
  input.style.height = 'auto';
  msgs.scrollTop = msgs.scrollHeight;
}

function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }

document.getElementById('chatMessages').scrollTop = 99999;
