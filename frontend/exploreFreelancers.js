const DATA = [
  { id:1,  name:'Marina Rocha',   adTitle:'Vou criar seu Design System completo no Figma',          emoji:'🎨', bannerBg:'linear-gradient(135deg,#0d1f0d,#1a3a1a)', tags:['Figma','Prototyping','Design System'], rating:4.98, reviews:214, price:120, color:'#7fff00', avail:'green',  badge:'TOP', cat:'design' },
  { id:2,  name:'Lucas Ferreira', adTitle:'Desenvolvo seu front-end com React e Next.js',           emoji:'💻', bannerBg:'linear-gradient(135deg,#0d0d1f,#1a1a3a)', tags:['React','TypeScript','Next.js'],        rating:4.95, reviews:183, price:95,  color:'#b0ff4e', avail:'green',  badge:'',    cat:'dev'    },
  { id:3,  name:'Julia Santos',   adTitle:'Escrevo textos otimizados para SEO que convertem',       emoji:'✍️', bannerBg:'linear-gradient(135deg,#1f1a0d,#3a2e0d)', tags:['SEO','Blog','Branding'],               rating:4.99, reviews:301, price:65,  color:'#a3e635', avail:'green',  badge:'TOP', cat:'copy'   },
  { id:4,  name:'Pedro Castro',   adTitle:'Produzo animações e motion graphics para sua marca',     emoji:'🎬', bannerBg:'linear-gradient(135deg,#1f0d1f,#3a1a3a)', tags:['After Effects','Cinema 4D'],          rating:4.87, reviews:97,  price:80,  color:'#5bbd00', avail:'yellow', badge:'',    cat:'video'  },
  { id:5,  name:'Ana Beatriz',    adTitle:'Gerencio suas redes sociais com estratégia e resultado', emoji:'📱', bannerBg:'linear-gradient(135deg,#1f0d0d,#3a1a1a)', tags:['Instagram','TikTok','Copy'],          rating:4.91, reviews:145, price:55,  color:'#84cc16', avail:'green',  badge:'NEW', cat:'mkt'    },
  { id:6,  name:'Rafael Mendes',  adTitle:'Desenvolvo sua aplicação full stack do zero ao deploy',  emoji:'⚡', bannerBg:'linear-gradient(135deg,#0d1a1f,#0d2a2a)', tags:['Node.js','React','AWS'],              rating:4.93, reviews:88,  price:140, color:'#65a30d', avail:'red',    badge:'',    cat:'dev'    },
  { id:7,  name:'Camila Torres',  adTitle:'Crio dashboards e análises de dados com Power BI',       emoji:'📊', bannerBg:'linear-gradient(135deg,#0d0d1a,#1a1a2a)', tags:['Python','Power BI','SQL'],            rating:4.80, reviews:62,  price:110, color:'#4d7c0f', avail:'green',  badge:'',    cat:'dados'  },
  { id:8,  name:'Diego Lima',     adTitle:'Desenvolvo a identidade visual completa da sua marca',   emoji:'🖌️', bannerBg:'linear-gradient(135deg,#1a1a0d,#2a2a0d)', tags:['Illustrator','Branding','Print'],     rating:4.76, reviews:134, price:70,  color:'#7fff00', avail:'yellow', badge:'',    cat:'design' },
  { id:9,  name:'Fernanda Costa', adTitle:'Crio seu app mobile com Flutter para iOS e Android',     emoji:'📲', bannerBg:'linear-gradient(135deg,#0d1a0d,#1a2a1a)', tags:['Flutter','Dart','Firebase'],          rating:4.88, reviews:56,  price:130, color:'#b0ff4e', avail:'green',  badge:'NEW', cat:'dev'    },
  { id:10, name:'Bruno Alves',    adTitle:'Elevo o tráfego orgânico do seu site com SEO técnico',   emoji:'🔍', bannerBg:'linear-gradient(135deg,#1a0d0d,#2a1a1a)', tags:['SEO','Analytics','Google Ads'],       rating:4.84, reviews:203, price:75,  color:'#a3e635', avail:'green',  badge:'',    cat:'mkt'    },
  { id:11, name:'Larissa Nunes',  adTitle:'Integro Inteligência Artificial ao seu produto digital', emoji:'🤖', bannerBg:'linear-gradient(135deg,#0d1f1f,#0d3030)', tags:['Python','LLMs','TensorFlow'],         rating:4.97, reviews:44,  price:180, color:'#5bbd00', avail:'red',    badge:'TOP', cat:'ia'     },
  { id:12, name:'Thiago Ramos',   adTitle:'Produzo vídeos profissionais para YouTube e redes',      emoji:'🎥', bannerBg:'linear-gradient(135deg,#1a0d1a,#2a0d2a)', tags:['Premiere','DaVinci','YouTube'],       rating:4.72, reviews:89,  price:90,  color:'#84cc16', avail:'green',  badge:'',    cat:'video'  },
];

let liked  = new Set();
let state  = { cat:'todos', star:0, avail:'todos', maxPrice:500 };
let openDd = null;

function render(data) {
  const grid  = document.getElementById('flGrid');
  const list  = document.getElementById('flList');
  const empty = document.getElementById('emptyState');
  const pag   = document.getElementById('pagination');
  grid.innerHTML = ''; list.innerHTML = '';
  document.getElementById('resultCount').textContent = data.length;
  if (!data.length) { empty.classList.add('show'); pag.classList.add('hidden'); return; }
  empty.classList.remove('show'); pag.classList.remove('hidden');

  data.forEach((f, i) => {
    const ac   = f.avail==='green'?'#22c55e':f.avail==='yellow'?'#eab308':'#ef4444';
    const al   = f.avail==='green'?'Disponível':f.avail==='yellow'?'Esta semana':'Este mês';
    const bp   = f.badge ? `<span class="fl-banner-badge badge-${f.badge.toLowerCase()}">${f.badge}</span>` : '';
    const lk   = liked.has(f.id);
    const ini  = f.name.split(' ').map(n=>n[0]).join('');
    const tags = f.tags.map(t=>`<span class="fl-tag">${t}</span>`).join('');

    const gc = document.createElement('div');
    gc.className = 'fl-card';
    gc.style.animationDelay = (i*40)+'ms'; /* dynamic: stagger computed from render index */
    gc.innerHTML = `
      <div class="fl-banner" style="background:${f.bannerBg}">
        <span style="position:relative;z-index:1">${f.emoji}</span>
        <div class="fl-banner-overlay"></div>
        ${bp}
        <button class="fl-heart${lk?' liked':''}" onclick="toggleLike(event,${f.id},this)">♥</button>
      </div>
      <div class="fl-card-body">
        <div class="fl-mini-profile">
          <div class="fl-mini-avatar" style="background:${f.color}">${ini}</div>
          <span class="fl-mini-name">${f.name}</span>
          <span class="avail-dot" style="background:${ac};margin-left:auto"></span>
        </div>
        <div class="fl-ad-title">${f.adTitle}</div>
        <div class="fl-tags">${tags}</div>
        <div class="fl-footer">
          <div class="fl-rating">★ ${f.rating} <span>(${f.reviews})</span></div>
          <div class="fl-price">R$${f.price}<small>/hr</small></div>
        </div>
        <button class="btn-chat-fl" onclick="tryChat(event,'${f.name}','${ini}','${f.color}','${f.adTitle}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Falar com ${f.name.split(' ')[0]}
        </button>
      </div>`;
    grid.appendChild(gc);

    const lc = document.createElement('div');
    lc.className = 'fl-list-card';
    lc.style.animationDelay = (i*30)+'ms'; /* dynamic: stagger computed from render index */
    lc.innerHTML = `
      <div class="fl-list-thumb" style="background:${f.bannerBg}">${f.emoji}</div>
      <div class="fl-list-body">
        <div class="fl-list-ad-title">${f.adTitle}</div>
        <div class="fl-list-mini">
          <div class="fl-list-mini-avatar" style="background:${f.color}">${ini}</div>
          <span class="fl-list-mini-name">${f.name}</span>
          ${f.badge ? `<span class="fl-banner-badge badge-${f.badge.toLowerCase()}" style="font-size:9px;padding:2px 7px">${f.badge}</span>` : ''}
        </div>
        <div class="fl-list-tags">${tags}</div>
      </div>
      <div class="fl-list-stats">
        <div class="fl-list-rating">★ ${f.rating} <span>(${f.reviews})</span></div>
        <div class="fl-list-avail"><span class="avail-dot" style="background:${ac}"></span>${al}</div>
      </div>
      <div class="fl-list-price-col">
        <div class="fl-list-price">R$${f.price}<small>/hr</small></div>
        <button class="fl-list-heart${lk?' liked':''}" onclick="toggleLike(event,${f.id},this)">♥</button>
        <button class="btn-chat-fl" style="margin-top:4px" onclick="tryChat(event,'${f.name}','${ini}','${f.color}','${f.adTitle}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Falar
        </button>
      </div>`;
    list.appendChild(lc);
  });
}

function applyFilters() {
  const q = document.getElementById('navSearch').value.toLowerCase();
  let result = DATA.filter(f => {
    if (state.cat !== 'todos' && f.cat !== state.cat) return false;
    if (f.rating < state.star) return false;
    if (f.price > state.maxPrice) return false;
    if (state.avail !== 'todos' && f.avail !== state.avail) return false;
    if (q && !f.name.toLowerCase().includes(q) && !f.adTitle.toLowerCase().includes(q) && !f.tags.some(t=>t.toLowerCase().includes(q))) return false;
    return true;
  });
  const sort = document.getElementById('sortSelect').value;
  if (sort==='preco-asc')  result.sort((a,b)=>a.price-b.price);
  if (sort==='preco-desc') result.sort((a,b)=>b.price-a.price);
  if (sort==='nota')       result.sort((a,b)=>b.rating-a.rating);
  render(result);
}

function setView(v) {
  const grid = document.getElementById('flGrid');
  const list = document.getElementById('flList');
  if (v==='grid') {
    grid.classList.remove('hidden'); list.classList.add('hidden');
    document.getElementById('btnGrid').classList.add('active');
    document.getElementById('btnList').classList.remove('active');
  } else {
    grid.classList.add('hidden'); list.classList.remove('hidden');
    document.getElementById('btnGrid').classList.remove('active');
    document.getElementById('btnList').classList.add('active');
  }
}

function toggleLike(e, id, btn) { e.stopPropagation(); liked.has(id)?(liked.delete(id),btn.classList.remove('liked')):(liked.add(id),btn.classList.add('liked')); }

function openDropdown(pillId, ddId) {
  const pill = document.getElementById(pillId);
  const dd   = document.getElementById(ddId);
  const rect = pill.getBoundingClientRect();
  /* dynamic: position:fixed dropdown anchored to pill via runtime getBoundingClientRect */
  dd.style.top  = (rect.bottom + 8) + 'px';
  dd.style.left = rect.left + 'px';
  dd.classList.add('open');
  pill.classList.add('open');
  openDd = { pillId, ddId };
}

function closeAllDd() {
  document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.fpill').forEach(p => p.classList.remove('open'));
  openDd = null;
}

document.querySelectorAll('.fpill').forEach(pill => {
  pill.addEventListener('click', e => {
    e.stopPropagation();
    const ddId = pill.dataset.dd;
    const isOpen = document.getElementById(ddId).classList.contains('open');
    closeAllDd();
    if (!isOpen) openDropdown(pill.id, ddId);
  });
});

document.querySelectorAll('.filter-dropdown').forEach(dd => {
  dd.addEventListener('click', e => e.stopPropagation());
});

document.addEventListener('click', closeAllDd);

function tryChat(e, name, initials, color, role) {
  e.stopPropagation();
  const type = localStorage.getItem('of_user_type');
  if (type === 'cliente') {
    window.location.href = 'chatScreenClient.html';
  } else if (type === 'freelancer') {
    window.location.href = 'chatScreenFreelancer.html';
  } else {
    openAuthModal(name, initials, color, role);
  }
}

function openAuthModal(name, initials, color, role) {
  document.getElementById('modalFreelancerName').textContent = name.split(' ')[0].toUpperCase();
  document.getElementById('modalAvatar').textContent = initials;
  document.getElementById('modalAvatar').style.background = color;
  document.getElementById('modalName').textContent = name;
  document.getElementById('modalRole').textContent = role;
  document.getElementById('authOverlay').classList.add('show');
}

function closeAuthModal() {
  document.getElementById('authOverlay').classList.remove('show');
}

function goToLogin() {
  window.location.href = 'loginScreen.html';
}

document.getElementById('authOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeAuthModal();
});

initNotifPanel();

function pickCat(el) {
  document.querySelectorAll('#ddCat .dd-opt').forEach(o=>o.classList.remove('active'));
  el.classList.add('active');
  state.cat = el.dataset.cat;
  document.getElementById('pillCatLabel').textContent = el.querySelector('span').textContent.trim();
  document.getElementById('pillCat').classList.toggle('active', state.cat !== 'todos');
  closeAllDd(); applyFilters();
}

function pickStar(el) {
  document.querySelectorAll('.dd-star').forEach(s=>s.classList.remove('active'));
  el.classList.add('active');
  state.star = parseFloat(el.dataset.val);
  document.getElementById('pillStarLabel').textContent = state.star > 0 ? `★ ${el.querySelector('.star-lbl').textContent}` : 'Avaliação';
  document.getElementById('pillStar').classList.toggle('active', state.star > 0);
  closeAllDd(); applyFilters();
}

function pickAvail(el) {
  document.querySelectorAll('.dd-av').forEach(a=>a.classList.remove('active'));
  el.classList.add('active');
  state.avail = el.dataset.val;
  document.getElementById('pillAvailLabel').textContent = state.avail !== 'todos' ? el.textContent.trim() : 'Disponibilidade';
  document.getElementById('pillAvail').classList.toggle('active', state.avail !== 'todos');
  closeAllDd(); applyFilters();
}

function syncMax() { const v=document.getElementById('priceSlider').value; document.getElementById('priceMax').value=v; document.getElementById('rangeVal').textContent=`Até R$ ${v}/hr`; }
function syncSlider() { const v=document.getElementById('priceMax').value; document.getElementById('priceSlider').value=v; document.getElementById('rangeVal').textContent=`Até R$ ${v}/hr`; }
function applyPrice() {
  state.maxPrice = parseInt(document.getElementById('priceMax').value)||500;
  const active = state.maxPrice < 500;
  document.getElementById('pillPrecoLabel').textContent = active ? `Até R$${state.maxPrice}` : 'Preço';
  document.getElementById('pillPreco').classList.toggle('active', active);
  closeAllDd(); applyFilters();
}

document.querySelectorAll('.page-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.page-btn').forEach(b=>b.classList.remove('active'));
    this.classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
  });
});

render(DATA);
OFAuth.loadNav();
