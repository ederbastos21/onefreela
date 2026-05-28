OFAuth.loadNav();
OFAuth.loadProfile();

function updateCount(inputId, countId, max) {
  const val = document.getElementById(inputId).value.length;
  const el  = document.getElementById(countId);
  el.textContent = val + '/' + max;
  el.classList.toggle('warn', val > max * 0.85);
}

function saveProfile() {
  const bar = document.querySelector('.actions-left span');
  bar.textContent = 'salvo ✓';
  bar.classList.add('text-green');
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

document.querySelectorAll('.field-input').forEach(input => {
  input.addEventListener('focus', () => {
    const label = document.querySelector('.actions-left span');
    label.textContent = 'não salvas';
    label.classList.add('text-green');
  });
});

updateCount('bioInput', 'bioCount', 300);
initNotifPanel();
