const API_BASE = 'http://localhost:8080';

OFAuth.loadNav();
initNotifPanel();

/* ── Utils ──────────────────────────────────────────────────────── */

function getInitials(name) {
  if (!name) return '?';
  var parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatPrice(p) {
  if (p == null) return '—';
  return 'R$ ' + Number(p).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
}

function catEmoji(cat) {
  if (!cat) return '🛠️';
  var c = cat.toLowerCase();
  if (c.includes('design') || c.includes('arte') || c.includes('figma'))                          return '🎨';
  if (c.includes('dev') || c.includes('program') || c.includes('web') ||
      c.includes('front') || c.includes('back') || c.includes('react'))                           return '💻';
  if (c.includes('market') || c.includes('redes') || c.includes('social'))                        return '📱';
  if (c.includes('redaç') || c.includes('texto') || c.includes('copy') || c.includes('conteú'))   return '✍️';
  if (c.includes('vídeo') || c.includes('video') || c.includes('anim') || c.includes('motion'))   return '🎬';
  if (c.includes('dados') || c.includes('data') || c.includes('anali'))                           return '📊';
  if (c.includes('foto') || c.includes('photo'))                                                   return '📷';
  return '🛠️';
}

var GRADIENTS = [
  'linear-gradient(135deg,#1a1a2e,#16213e)',
  'linear-gradient(135deg,#0d1b2a,#1b4332)',
  'linear-gradient(135deg,#1a1a2e,#2d1b69)',
  'linear-gradient(135deg,#0d1117,#1e3a5f)',
  'linear-gradient(135deg,#1a0a00,#3d1a00)',
  'linear-gradient(135deg,#0a1628,#1a3a2a)',
];

function workGradient(id) {
  return GRADIENTS[id % GRADIENTS.length];
}

/* ── Main ────────────────────────────────────────────────────────── */

async function loadFreelancerProfile() {
  var params   = new URLSearchParams(window.location.search);
  var userId   = params.get('userId');

  if (!userId) {
    showNotFound();
    return;
  }

  try {
    var res = await fetch(API_BASE + '/works/search?ownerId=' + encodeURIComponent(userId));
    if (!res.ok) throw new Error('HTTP ' + res.status);

    var works = await res.json();
    var active = works.filter(function (w) { return w.status === 'ACTIVE'; });

    if (!works.length) {
      showNotFound();
      return;
    }

    var ownerName  = works[0].ownerName || 'Freelancer';
    var categories = Array.from(new Set(active.map(function (w) { return w.category; }).filter(Boolean)));

    // Update hero
    document.getElementById('fpAvatar').textContent       = getInitials(ownerName);
    document.getElementById('fpName').textContent         = ownerName;
    document.getElementById('fpServicesCount').textContent = active.length;
    document.getElementById('fpCategoriesCount').textContent = categories.length || '—';
    document.title = 'OneFreela — ' + ownerName;
    document.getElementById('fpHero').style.display = '';

    // Section title
    document.getElementById('fpSectionTitle').textContent =
      active.length === 0
        ? 'Nenhum serviço ativo no momento'
        : 'Serviços de ' + ownerName.split(' ')[0];

    // Cards
    var grid = document.getElementById('fpGrid');
    grid.innerHTML = '';

    if (!active.length) {
      grid.innerHTML = '<div class="fp-empty">Este freelancer não possui serviços ativos no momento.</div>';
    } else {
      active.forEach(function (w) {
        var emoji = catEmoji(w.category);
        var bg    = workGradient(w.id);
        var price = formatPrice(w.price);
        var desc  = truncate(w.description, 90);
        var cat   = w.category ? '<span class="fp-card-cat">' + escHtml(w.category) + '</span>' : '';

        var card = document.createElement('div');
        card.className = 'fp-card reveal';
        card.innerHTML =
          '<div class="fp-card-banner" style="background:' + bg + '">' +
            '<span style="position:relative;z-index:1;font-size:38px">' + emoji + '</span>' +
            '<div class="fp-card-banner-overlay"></div>' +
            cat +
          '</div>' +
          '<div class="fp-card-body">' +
            '<div class="fp-card-title">' + escHtml(w.title) + '</div>' +
            '<div class="fp-card-desc">'  + escHtml(desc)    + '</div>' +
            '<div class="fp-card-footer">' +
              '<span class="fp-card-price">' + price + '</span>' +
              '<a href="serviceScreen.html?id=' + w.id + '" class="fp-card-btn" onclick="event.stopPropagation()">Ver serviço</a>' +
            '</div>' +
          '</div>';

        card.addEventListener('click', function () {
          window.location.href = 'serviceScreen.html?id=' + w.id;
        });

        grid.appendChild(card);
      });
    }

    document.getElementById('fpLoading').style.display  = 'none';
    document.getElementById('fpContent').style.display  = '';
    initScrollReveal(0.08);

  } catch (e) {
    document.getElementById('fpLoading').innerHTML =
      '<div class="fp-error">Erro ao carregar o perfil. Tente novamente.</div>';
  }
}

function showNotFound() {
  document.getElementById('fpLoading').style.display   = 'none';
  document.getElementById('fpNotFound').style.display  = '';
}

loadFreelancerProfile();
