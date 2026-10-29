(function () {
  'use strict';
  if (window.location.pathname !== '/profesionales.html') return;
  const form = document.getElementById('professional-application');
  const button = document.getElementById('professional-preview-button');
  const preview = document.getElementById('professional-preview');
  const fields = document.getElementById('professional-preview-fields');
  if (!form || !button || !preview || !fields) return;
  const publicFields = [
    ['Nombre profesional', 'pro-name'], ['Profesión', 'pro-field'],
    ['Áreas o especialidades', 'pro-specialties'], ['A quién atiende', 'pro-audience'],
    ['Descripción', 'pro-description'], ['País de establecimiento declarado', 'pro-country'],
    ['Zona declarada', 'pro-area'], ['Países de prestación declarados', 'pro-service-countries'],
    ['Modalidad', 'pro-mode'], ['Idiomas de atención declarados', 'pro-languages'],
    ['Precio o presupuesto', 'pro-price'], ['Web profesional', 'pro-website']
  ];
  const render = () => {
    const fragment = document.createDocumentFragment();
    for (const [label, id] of publicFields) {
      const title = document.createElement('dt');
      const value = document.createElement('dd');
      title.textContent = label;
      value.textContent = document.getElementById(id).value.trim() || 'Pendiente de completar';
      fragment.append(title, value);
    }
    fields.replaceChildren(fragment);
  };
  button.hidden = false;
  button.addEventListener('click', () => {
    render();
    preview.hidden = false;
    preview.setAttribute('tabindex', '-1');
    preview.focus();
  });
  form.addEventListener('input', () => {
    if (!preview.hidden) render();
  });
})();
