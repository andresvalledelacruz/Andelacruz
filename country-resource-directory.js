(() => {
  'use strict';
  const buttons = document.getElementById('resource-country-buttons');
  const groupsHost = document.getElementById('resource-country-groups');
  const status = document.getElementById('resource-country-status');
  const empty = document.getElementById('country-resource-empty');
  if (!buttons || !groupsHost || !status || !empty) return;

  const groups = [...groupsHost.querySelectorAll('.country-resource-group')];
  const names = new Map([...buttons.querySelectorAll('button[data-country]')]
    .map(button => [button.dataset.country, button.querySelector('span:last-child').textContent]));

  function showCountry(code) {
    if (!names.has(code)) return;
    const group = groups.find(item => item.dataset.country === code);
    for (const button of buttons.querySelectorAll('button[data-country]')) {
      button.setAttribute('aria-pressed', String(button.dataset.country === code));
    }
    for (const item of groups) item.hidden = item !== group;
    empty.hidden = Boolean(group);
    const name = names.get(code);
    if (code === 'ES') {
      status.textContent = `${name}: ${document.querySelectorAll('#resource-directory li').length} guías disponibles por tema.`;
    } else {
      const count = group ? group.querySelectorAll('li').length : 0;
      status.textContent = count ? `${name}: ${count} enlaces revisados disponibles.` : `${name}: todavía sin enlaces revisados.`;
    }
  }

  buttons.addEventListener('click', event => {
    const button = event.target.closest('button[data-country]');
    if (!button) return;
    showCountry(button.dataset.country);
    history.replaceState(null, '', `#pais-${button.dataset.country}`);
  });
  const code = /^#pais-([A-Z]{2})$/.exec(location.hash)?.[1] || 'ES';
  showCountry(names.has(code) ? code : 'ES');
})();
