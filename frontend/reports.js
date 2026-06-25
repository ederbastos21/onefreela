const API_BASE = 'http://localhost:8080';

OFAuth.requireLogin();
OFAuth.loadNav();

/* ── Config ────────────────────────────────────────────────────────── */

const NATURE_LABELS = {
  USER_BEHAVIOR:          'Comportamento de usuário',
  FRAUD:                  'Fraude',
  INAPPROPRIATE_CONTENT:  'Conteúdo inadequado',
  PAYMENT:                'Problema de pagamento',
  SERVICE:                'Problema com serviço',
  SECURITY:               'Segurança',
  OTHER:                  'Outro'
};

const STATUS_LABELS = {
  PENDING:      'Pendente',
  UNDER_REVIEW: 'Em análise',
  RESOLVED:     'Resolvida',
  REJECTED:     'Rejeitada'
};

const FILTER_CONFIG = [
  { id: 'all',          label: 'Todas' },
  { id: 'PENDING',      label: 'Pendentes' },
  { id: 'UNDER_REVIEW', label: 'Em análise' },
  { id: 'RESOLVED',     label: 'Resolvidas' },
  { id: 'REJECTED',     label: 'Rejeitadas' }
];

/* ── State ─────────────────────────────────────────────────────────── */

let allReports    = [];
let activeFilter  = 'all';
let selectedFiles = [];

/* ── Bootstrap ─────────────────────────────────────────────────────── */

function init() {
  populateNatureSelect();
  buildFilterButtons();
  setupAttachmentInput();
  loadMyReports();
  initNotifPanel();
}

function populateNatureSelect() {
  const sel = document.getElementById('rNature');
  Object.entries(NATURE_LABELS).forEach(([value, label]) => {
    const opt = document.createElement('option');
    opt.value       = value;
    opt.textContent = label;
    sel.appendChild(opt);
  });
}

function buildFilterButtons() {
  const wrap = document.getElementById('reportsFilterWrap');
  wrap.innerHTML = FILTER_CONFIG.map(f =>
    `<button class="rf-btn ${activeFilter === f.id ? 'active' : ''}"
             data-filter="${f.id}">${f.label}</button>`
  ).join('');

  wrap.addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    wrap.querySelectorAll('.rf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderReports();
  });
}

function setupAttachmentInput() {
  const input   = document.getElementById('rFiles');
  const preview = document.getElementById('attachPreview');

  input.addEventListener('change', () => {
    Array.from(input.files).forEach(f => {
      if (selectedFiles.find(s => s.name === f.name && s.size === f.size)) return;
      selectedFiles.push(f);
    });
    input.value = '';
    renderAttachPreview();
  });
}

function renderAttachPreview() {
  const preview = document.getElementById('attachPreview');
  preview.innerHTML = selectedFiles.map((f, i) =>
    `<div class="attach-chip">
       <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
       <span style="overflow:hidden;text-overflow:ellipsis">${escHtml(f.name)}</span>
       <span class="attach-chip-remove" data-idx="${i}">×</span>
     </div>`
  ).join('');

  preview.querySelectorAll('[data-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedFiles.splice(Number(btn.dataset.idx), 1);
      renderAttachPreview();
    });
  });
}

/* ── Form submission ────────────────────────────────────────────────── */

async function submitReport() {
  const nature = document.getElementById('rNature').value.trim();
  const title  = document.getElementById('rTitle').value.trim();
  const desc   = document.getElementById('rDesc').value.trim();

  let valid = true;

  function setErr(wrapId, errId, show) {
    document.getElementById(wrapId).classList.toggle('error', show);
    const el = document.getElementById(errId);
    el.classList.toggle('show', show);
    if (show) valid = false;
  }

  setErr('rNatureWrap', 'rNatureErr', !nature);
  setErr('rTitleWrap',  'rTitleErr',  !title);
  setErr('rDescWrap',   'rDescErr',   desc.length < 20);

  if (!valid) return;

  const btn      = document.getElementById('submitReportBtn');
  const feedback = document.getElementById('formFeedback');
  btn.disabled     = true;
  btn.textContent  = 'Enviando...';
  feedback.textContent = '';
  feedback.className   = 'form-feedback';

  try {
    const dto  = { nature, title, description: desc };
    const blob = new Blob([JSON.stringify(dto)], { type: 'application/json' });
    const form = new FormData();
    form.append('report', blob);
    selectedFiles.forEach(f => form.append('attachments', f));

    const res = await fetch(`${API_BASE}/reports/register`, {
      method: 'POST',
      headers: { Authorization: OFAuth.getToken() },
      body: form
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg  = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(e => e.message).join(' | ')
        : 'Erro ao registrar denúncia.';
      feedback.textContent = msg;
      feedback.className   = 'form-feedback error';
      return;
    }

    document.getElementById('rNature').value = '';
    document.getElementById('rTitle').value  = '';
    document.getElementById('rDesc').value   = '';
    selectedFiles = [];
    renderAttachPreview();

    feedback.textContent = '✓ Denúncia registrada com sucesso. Nossa equipe irá analisá-la.';
    feedback.className   = 'form-feedback success';

    showToast('Denúncia registrada!');
    activeFilter = 'all';
    buildFilterButtons();
    await loadMyReports();

  } catch (_) {
    feedback.textContent = 'Erro de conexão. Verifique sua internet.';
    feedback.className   = 'form-feedback error';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Registrar Denúncia';
  }
}

/* ── Load & render reports ──────────────────────────────────────────── */

async function loadMyReports() {
  const list = document.getElementById('reportsList');
  list.innerHTML = '<div class="reports-loading">Carregando denúncias...</div>';

  try {
    const res = await fetch(`${API_BASE}/reports/myReports`, {
      headers: { Authorization: OFAuth.getToken() }
    });
    if (!res.ok) throw new Error();
    allReports = await res.json();
    renderReports();
  } catch (_) {
    list.innerHTML = '<div class="reports-loading" style="color:#ef4444">Erro ao carregar denúncias.</div>';
  }
}

function renderReports() {
  const visible = activeFilter === 'all'
    ? allReports
    : allReports.filter(r => r.status === activeFilter);

  const list = document.getElementById('reportsList');

  if (!visible.length) {
    list.innerHTML = `
      <div class="reports-empty">
        <div class="reports-empty-icon">📋</div>
        <div class="reports-empty-title">
          ${activeFilter === 'all' ? 'Nenhuma denúncia registrada' : 'Nenhuma denúncia com este status'}
        </div>
        <div class="reports-empty-sub">
          ${activeFilter === 'all' ? 'Use o formulário ao lado para registrar uma.' : 'Altere o filtro para ver outras denúncias.'}
        </div>
      </div>`;
    return;
  }

  list.innerHTML = visible
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(tplReportCard)
    .join('');
}

function tplReportCard(r) {
  const natureLbl  = NATURE_LABELS[r.nature]  || r.nature;
  const statusLbl  = STATUS_LABELS[r.status]  || r.status;
  const createdAt  = r.createdAt ? fmtDate(r.createdAt) : '—';
  const reviewedAt = r.reviewedAt ? ` · Analisada em ${fmtDate(r.reviewedAt)}` : '';

  const workHtml = r.workTitle
    ? `<div class="report-card-work">🚩 Serviço: ${escHtml(r.workTitle)}</div>`
    : '';

  const adminNotesHtml = r.adminNotes
    ? `<div class="report-admin-notes">
         <div class="report-admin-notes-label">Notas do administrador</div>
         ${escHtml(r.adminNotes)}
       </div>`
    : '';

  const attachCount = r.attachments?.length
    ? `<span style="font-size:11px;color:var(--muted2)">📎 ${r.attachments.length} anexo${r.attachments.length > 1 ? 's' : ''}</span>`
    : '';

  return `
    <div class="report-card">
      <div class="report-card-top">
        <div>
          <div class="report-card-title">${escHtml(r.title)}</div>
          <div class="report-card-nature">${natureLbl}</div>
          ${workHtml}
        </div>
        <span class="rs-badge rs-${r.status}">${statusLbl}</span>
      </div>
      <div class="report-card-desc">${escHtml(r.description)}</div>
      ${adminNotesHtml}
      <div class="report-card-footer">
        <span class="report-card-date">Registrada em ${createdAt}${reviewedAt}</span>
        ${attachCount}
      </div>
    </div>`;
}

/* ── Utils ─────────────────────────────────────────────────────────── */

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ── Inline validation: clear errors on input ──────────────────────── */

['rNature','rTitle','rDesc'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => {
    const wrap = document.getElementById(id + 'Wrap') || el.closest('.form-input-wrap');
    if (wrap) wrap.classList.remove('error');
    const err = document.getElementById(id + 'Err');
    if (err) err.classList.remove('show');
    document.getElementById('formFeedback').textContent = '';
  });
});

init();
