(function () {
  function getInitials(name) {
    if (!name || !name.trim()) return '?';
    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getShortName(name) {
    if (!name || !name.trim()) return '';
    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return parts[0] + ' ' + parts[parts.length - 1][0] + '.';
  }

  window.OFAuth = {
    getName:      function () { return localStorage.getItem('of_name')      || ''; },
    getType:      function () { return localStorage.getItem('of_user_type') || ''; },
    getEmail:     function () { return localStorage.getItem('of_email')     || ''; },
    getToken:     function () { return localStorage.getItem('of_token')     || ''; },
    isAdmin:      function () { return localStorage.getItem('of_is_admin')  === 'true'; },
    getInitials:  getInitials,
    getShortName: getShortName,

    isLoggedIn: function () { return !!this.getToken(); },

    logout: function () {
      ['of_token', 'of_name', 'of_user_type', 'of_email', 'of_is_admin'].forEach(function (k) {
        localStorage.removeItem(k);
      });
      window.location.href = 'loginScreen.html';
    },

    requireLogin: function () {
      if (!this.isLoggedIn()) {
        window.location.href = 'loginScreen.html';
        return false;
      }
      return true;
    },

    /* Populates #navAvatar, #navUserName, #navUserRole */
    loadNav: function () {
      var name        = this.getName();
      var type        = this.getType();
      var initials    = getInitials(name);
      var shortName   = getShortName(name);
      var roleLabel   = this.isAdmin() ? 'Administrador' : (type === 'freelancer' ? 'Freelancer' : 'Cliente');
      var profileHref = 'profile.html';

      var navAvatar   = document.getElementById('navAvatar');
      var navUserName = document.getElementById('navUserName');
      var navUserRole = document.getElementById('navUserRole');

      if (navAvatar) {
        navAvatar.textContent = initials;
        if (navAvatar.tagName === 'A') navAvatar.href = profileHref;
      }
      if (navUserName) navUserName.textContent = shortName;
      if (navUserRole) navUserRole.textContent = roleLabel;

      var adminBtn = document.getElementById('adminAreaBtn');
      if (adminBtn && this.isAdmin()) adminBtn.style.display = 'flex';
    },

    /* Populates profile hero + settings inputs on profile pages */
    loadProfile: function () {
      var name     = this.getName();
      var email    = this.getEmail();
      var initials = getInitials(name);
      var parts    = name ? name.trim().split(/\s+/) : [];

      var profileAvatar = document.getElementById('profileAvatar');
      var profileName   = document.getElementById('profileName');
      var profileEmail  = document.getElementById('profileEmail');
      var settingNome   = document.getElementById('settingNome');
      var settingSobre  = document.getElementById('settingSobrenome');
      var settingEmail  = document.getElementById('settingEmail');

      if (profileAvatar) profileAvatar.textContent = initials;
      if (profileName)   profileName.textContent   = name || 'Sem nome';
      if (profileEmail)  profileEmail.textContent  = email;

      if (settingNome  && parts.length)      settingNome.value  = parts[0];
      if (settingSobre && parts.length > 1)  settingSobre.value = parts.slice(1).join(' ');
      if (settingEmail && email)             settingEmail.value = email;
    }
  };
})();
