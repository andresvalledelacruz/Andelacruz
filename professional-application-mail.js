(function () {
  'use strict';
  if (window.location.pathname !== '/profesionales.html') return;
  const form = document.getElementById('professional-application');
  const copyButton = document.getElementById('professional-mail-copy');
  const draft = document.getElementById('professional-mail-draft');
  const bodyField = document.getElementById('professional-mail-body');
  if (!form || !copyButton || !draft || !bodyField) return;
  const fields = [
    ['Nombre', 'pro-name'], ['Profesión', 'pro-field'],
    ['Colegio o registro', 'pro-register'], ['Web', 'pro-website'],
    ['Áreas o especialidades', 'pro-specialties'], ['A quién atiende', 'pro-audience'],
    ['Descripción', 'pro-description'], ['País de establecimiento', 'pro-country'],
    ['Ciudad o región', 'pro-area'], ['Países de prestación declarados', 'pro-service-countries'],
    ['Modalidad', 'pro-mode'], ['Idiomas', 'pro-languages'], ['Precio orientativo', 'pro-price'],
    ['Correo', 'pro-contact'], ['Teléfono', 'pro-phone']
  ];
  const prepare = () => {
    if (!form.reportValidity()) return null;
    const body = fields.map(([label, id]) => `${label}: ${document.getElementById(id).value.trim()}`)
      .concat([`Interés comercial futuro: ${document.getElementById('pro-commercial').checked ? 'Sí' : 'No'}`])
      .join('\r\n');
    bodyField.value = body;
    draft.hidden = false;
    return body;
  };
  copyButton.hidden = false;
  copyButton.addEventListener('click', () => {
    if (prepare() !== null) bodyField.focus();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const body = prepare();
    if (body === null) return;
    window.location.href = 'mailto:info@desgracias.es?subject=' +
      encodeURIComponent('Solicitud profesional Desgracias.es') + '&body=' + encodeURIComponent(body);
  });
  // Discard the prepared text when the applicant changes the form: never offer
  // an outdated copy. No storage, clipboard access, network or receipt claim.
  form.addEventListener('input', () => {
    bodyField.value = '';
    draft.hidden = true;
  });
})();
