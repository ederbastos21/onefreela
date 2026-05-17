initCursorGlow();

let currentType = 'cliente';
let checked = false;

const content = {
  cliente: {
    label:      'Para clientes',
    title:      'CONTRATE\nOS MELHORES\nTALENTOS',
    accentWord: 'TALENTOS',
    desc:       'Publique projetos, encontre profissionais verificados e pague com segurança — tudo em um só lugar.',
    perks: [
      { icon: '🎯', title: 'Freelancers verificados', desc: 'Todos os perfis passam por curadoria da nossa equipe.' },
      { icon: '🔒', title: 'Pagamento seguro',        desc: 'O valor só é liberado quando você aprova a entrega.' },
      { icon: '⚡', title: 'Rápido de verdade',       desc: 'Encontre o profissional ideal em minutos, não dias.' },
    ],
    quote:      '"Contratei um designer em menos de 2 horas. A qualidade superou todas as expectativas."',
    author:     'CA', authorName: 'Carlos Andrade', authorRole: 'CEO, Startup de Tecnologia',
    heading:    'CRIAR CONTA',
  },
  freelancer: {
    label:      'Para freelancers',
    title:      'MOSTRE SEU\nTALENTO PARA\nO BRASIL',
    accentWord: 'BRASIL',
    desc:       'Crie seu perfil, publique seus serviços e comece a receber projetos de clientes em todo o país.',
    perks: [
      { icon: '💰', title: 'Receba com segurança',    desc: 'Garantia de pagamento para cada projeto concluído.' },
      { icon: '📈', title: 'Construa sua reputação',  desc: 'Avaliações verificadas que valorizam seu portfólio.' },
      { icon: '🌍', title: 'Clientes em todo Brasil', desc: 'Trabalhe de onde quiser para quem precisar.' },
    ],
    quote:      '"Em 3 meses na OneFreela já superei meu salário CLT. A plataforma mudou minha vida."',
    author:     'JS', authorName: 'Julia Santos', authorRole: 'Designer Freelancer, SP',
    heading:    'CRIAR PERFIL',
  },
};

function setType(type) {
  currentType = type;
  const isFreela = type === 'freelancer';

  document.getElementById('togglePill').classList.toggle('freelancer', isFreela);
  document.getElementById('btnCliente').classList.toggle('active', !isFreela);
  document.getElementById('btnFreelancer').classList.toggle('active', isFreela);

  document.getElementById('cursorGlow').classList.toggle('freelancer', isFreela);
  document.getElementById('leftPanel').classList.toggle('freelancer', isFreela);
  document.getElementById('logoIcon').classList.toggle('freelancer', isFreela);
  document.getElementById('logoSpan').classList.toggle('freelancer', isFreela);
  document.getElementById('leftLabel').classList.toggle('freelancer', isFreela);
  document.getElementById('leftAccent').classList.toggle('freelancer', isFreela);
  document.getElementById('testStars').classList.toggle('freelancer', isFreela);
  document.getElementById('testAvatar').classList.toggle('freelancer', isFreela);

  document.getElementById('fieldsWrap').classList.toggle('freelancer-mode', isFreela);
  document.getElementById('btnSubmit').classList.toggle('freelancer', isFreela);
  document.getElementById('loginLink').classList.toggle('freelancer', isFreela);
  document.getElementById('termsLink').classList.toggle('freelancer', isFreela);
  document.getElementById('privacyLink').classList.toggle('freelancer', isFreela);

  document.getElementById('areaField').classList.toggle('show', isFreela);

  const c = content[type];
  document.getElementById('leftLabel').textContent = c.label;
  document.getElementById('formHeading').textContent = c.heading;

  const titleLines = c.title.split('\n');
  document.getElementById('leftTitle').innerHTML =
    titleLines.map((l, i) =>
      i === titleLines.length - 1
        ? `<span class="accent${isFreela ? ' freelancer' : ''}" id="leftAccent">${l}</span>`
        : l + '<br>'
    ).join('');

  document.getElementById('leftDesc').textContent = c.desc;

  document.getElementById('testQuote').textContent = c.quote;
  document.getElementById('testAvatar').textContent = c.author;
  document.getElementById('testName').textContent = c.authorName;
  document.getElementById('testRole').textContent = c.authorRole;

  const perksWrap = document.getElementById('perksWrap');
  perksWrap.innerHTML = '';
  c.perks.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'perk';
    el.innerHTML = `
      <div class="perk-icon${isFreela ? ' freelancer' : ''}">${p.icon}</div>
      <div class="perk-text"><strong>${p.title}</strong> — ${p.desc}</div>`;
    perksWrap.appendChild(el);
    setTimeout(() => el.classList.add('visible'), 80 + i * 100);
  });

  if (checked) {
    document.getElementById('checkbox').classList.toggle('freelancer', isFreela);
  }
}

function toggleEye() {
  const input = document.getElementById('senha');
  const icon  = document.getElementById('eyeIcon');
  const show  = input.type === 'text';
  input.type  = show ? 'password' : 'text';
  icon.innerHTML = show
    ? `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`
    : `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;
}

function checkStrength(val) {
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  let score = 0;
  if (val.length >= 8)          score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { w: '0%',   c: 'transparent', t: '' },
    { w: '25%',  c: '#ef4444',     t: 'Fraca' },
    { w: '50%',  c: '#f97316',     t: 'Razoável' },
    { w: '75%',  c: '#eab308',     t: 'Boa' },
    { w: '100%', c: '#7fff00',     t: 'Forte ✓' },
  ];
  fill.style.width      = levels[score].w;
  fill.style.background = levels[score].c;
  label.textContent     = levels[score].t;
}

function toggleCheck() {
  checked = !checked;
  const cb = document.getElementById('checkbox');
  cb.classList.toggle('checked', checked);
  cb.classList.toggle('freelancer', checked && currentType === 'freelancer');
  cb.innerHTML = checked
    ? `<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,6 5,9 10,3"/></svg>`
    : '';
}

function maskCpf(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  input.value = v;
}

function maskPhone(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 10) {
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
  }
  input.value = v;
}

const API = 'http://localhost:8080';

function showMsg(text, type) {
  const el = document.getElementById('formMsg');
  el.textContent = text;
  el.className = 'form-msg ' + type;
}

async function handleSubmit(e) {
  const btn  = document.getElementById('btnSubmit');
  const rect = btn.getBoundingClientRect();
  const r    = document.createElement('span');
  r.className = 'ripple';
  const size  = Math.max(rect.width, rect.height);
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
  btn.appendChild(r);
  r.addEventListener('animationend', () => r.remove());

  const nome       = document.getElementById('nome').value.trim();
  const sobrenome  = document.getElementById('sobrenome').value.trim();
  const email      = document.getElementById('email').value.trim();
  const cpf        = document.getElementById('cpf').value.trim();
  const telefone   = document.getElementById('telefone').value.trim();
  const nascimento = document.getElementById('nascimento').value;
  const senha      = document.getElementById('senha').value;
  const confirma   = document.getElementById('confirma').value;

  if (!nome || !sobrenome || !email || !cpf || !telefone || !nascimento || !senha || !confirma) {
    showMsg('Preencha todos os campos obrigatórios.', 'error'); return;
  }
  if (cpf.replace(/\D/g, '').length !== 11) {
    showMsg('CPF inválido. Informe os 11 dígitos.', 'error'); return;
  }
  if (senha.length < 8) {
    showMsg('A senha deve ter pelo menos 8 caracteres.', 'error'); return;
  }
  if (senha !== confirma) {
    showMsg('As senhas não coincidem.', 'error'); return;
  }
  if (!checked) {
    showMsg('Você precisa aceitar os Termos de Uso.', 'error'); return;
  }
  if (currentType === 'freelancer' && !document.getElementById('area').value) {
    showMsg('Selecione sua área de atuação.', 'error'); return;
  }

  const originalText = btn.textContent;
  btn.textContent = 'CRIANDO CONTA...';
  btn.disabled = true;

  try {
    const body = {
      name:        nome + ' ' + sobrenome,
      email,
      password:    senha,
      cpf:         cpf.replace(/\D/g, ''),
      phoneNumber: telefone.replace(/\D/g, ''),
      birthday:    nascimento,
      freelancer:  currentType === 'freelancer',
    };

    const res = await fetch(API + '/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = Array.isArray(data.errors) && data.errors.length
        ? data.errors.map(e => e.message).join(' | ')
        : 'Erro ao criar conta. Tente novamente.';
      showMsg(msg, 'error'); return;
    }

    showMsg('Conta criada com sucesso! Redirecionando para o login...', 'success');
    setTimeout(() => { window.location.href = 'loginScreen.html'; }, 1200);

  } catch (err) {
    showMsg('Não foi possível conectar ao servidor: ' + (err.message || err), 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

setType('cliente');
setTimeout(() => {
  document.getElementById('testimonial').classList.add('visible');
}, 500);
