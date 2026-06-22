OFAuth.loadNav();
OFAuth.loadProfile();

function updateCount(inputId, countId, max) {
  const val = document.getElementById(inputId).value.length;
  const el  = document.getElementById(countId);
  el.textContent = val + '/' + max;
  el.classList.toggle('warn', val > max * 0.85);
}

function addTag(e) {
  if (e.key !== 'Enter') return;
  const input = document.getElementById('tagInput');
  const val   = input.value.trim();
  const chips = document.querySelectorAll('.tag-chip');
  if (!val || chips.length >= 10) return;
  const chip = document.createElement('span');
  chip.className = 'tag-chip';
  chip.innerHTML = `${val} <span class="tag-remove" onclick="removeTag(this)">×</span>`;
  document.getElementById('tagsWrap').insertBefore(chip, input);
  input.value = '';
  e.preventDefault();
}

function removeTag(el) { el.closest('.tag-chip').remove(); }

function setAvail(el) {
  document.querySelectorAll('.avail-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
}

function saveProfile() {
  const status = document.getElementById('saveStatus');
  status.textContent = 'salvo ✓';
  status.classList.add('text-green');
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

document.querySelectorAll('.side-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.side-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

updateCount('bioInput', 'bioCount', 400);
initNotifPanel();
