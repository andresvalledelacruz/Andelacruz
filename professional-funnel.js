(function () {
  'use strict';
  if (window.location.pathname !== '/profesionales.html') return;
  const form = document.getElementById('professional-application');
  if (!form) return;
  // Integration hook only. No network, storage, identifiers or form values.
  // A mail client opening is not evidence of a submitted application or a lead.
  const emit = stage => window.dispatchEvent(new CustomEvent('desgracias:professional-funnel', {
    detail: Object.freeze({ version:1, surface:'professionals', stage })
  }));
  emit('view');
  form.addEventListener('input', () => emit('application_start'), {once:true});
  form.addEventListener('submit', () => {
    if (form.checkValidity()) emit('email_prepared');
  });
})();
