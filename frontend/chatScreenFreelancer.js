OFAuth.loadNav();
initNotifPanel();

document.querySelectorAll('.filter-chip').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
  });
});

document.querySelectorAll('.conv-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.conv-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
    this.querySelector('.conv-unread')?.remove();
  });
});

function useQuick(btn) {
  document.getElementById('msgInput').value = btn.textContent;
  document.getElementById('msgInput').focus();
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
    <div class="msg-avatar" style="background:#7fff00">${OFAuth.getInitials(OFAuth.getName())}</div>
    <div>
      <div class="msg-bubble">${text.replace(/</g, '&lt;')}</div>
      <div class="msg-meta">${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} <span class="msg-check">✓</span></div>
    </div>`;
  msgs.insertBefore(div, typing);
  input.value = '';
  input.style.height = 'auto';
  msgs.scrollTop = msgs.scrollHeight;
}

function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }

document.getElementById('chatMessages').scrollTop = 99999;
