(() => {
  'use strict';

  const COUNTRY_OPTIONS = window.DesgraciasCountryOptions;

  const picker = document.querySelector('#country-buttons');
  const status = document.querySelector('#country-status');
  const nav = document.querySelector('#friends-nav');
  const groupsHost = document.querySelector('#friends-groups');
  const selectedLabel = document.querySelector('#selected-country-label');
  if (!picker || !status || !nav || !groupsHost) return;

  const byCode = new Map(COUNTRY_OPTIONS.map(([code,name,flag]) => [code,{code,name,flag}]));
  let directory = null;
  let selectedCountry = 'ES';

  const el = (tag, text, attrs = {}) => {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
    return node;
  };

  function normalizeRecords(records) {
    return [...records].sort((a,b) => {
      const categoryA = directory.categories[a.category] || a.category;
      const categoryB = directory.categories[b.category] || b.category;
      const byCategory = categoryA.localeCompare(categoryB, 'es', {sensitivity:'base'});
      return byCategory || a.name.localeCompare(b.name, 'es', {sensitivity:'base'});
    });
  }

  function countryCounts() {
    const counts = new Map();
    for (const record of directory.records.filter(record => record.kind === 'organization')) counts.set(record.country, (counts.get(record.country) || 0) + 1);
    return counts;
  }

  function buildCountryButtons() {
    const counts = countryCounts();
    picker.replaceChildren();
    for (const [index, [code,name]] of COUNTRY_OPTIONS.entries()) {
      const count = counts.get(code) || 0;
      const button = el('button', null, {
        type: 'button',
        class: `country-button${count ? '' : ' country-unavailable'}`,
        'data-country': code,
        'aria-pressed': String(code === selectedCountry)
      });
      const flag = el('span', null, {class:'flag-image', 'aria-hidden':'true'});
      flag.style.backgroundPosition = `0 -${index * 18}px`;
      button.append(flag, el('span', name));
      if (!count) button.title = 'Organizaciones pendientes de revisión para este país';
      picker.append(button);
    }
  }

  function renderCountry(code) {
    selectedCountry = code;
    const meta = byCode.get(code) || {code,name:code,flag:'🌐'};
    const records = normalizeRecords(directory.records.filter((record) => record.country === code && record.kind === 'organization'));

    for (const button of picker.querySelectorAll('button[data-country]')) {
      button.setAttribute('aria-pressed', String(button.dataset.country === code));
    }

    if (selectedLabel) selectedLabel.textContent = meta.name;
    nav.replaceChildren();
    groupsHost.replaceChildren();

    if (!records.length) {
      status.textContent = `${meta.name}: aún no hay organizaciones revisadas en Webs Amigas.`;
      groupsHost.append(el('section', null, {class:'empty-country'}));
      groupsHost.lastElementChild.append(
        el('h2', `Aún no hay webs amigas revisadas para ${meta.name}`),
        el('p', 'Estamos ampliando las organizaciones. Los servicios y ayudas de cada país están en Recursos.')
      );
      const link = el('a', 'Ver recursos por país', {href:`/recursos/#pais-${code}`});
      groupsHost.lastElementChild.append(link);
      return;
    }

    status.textContent = `${meta.name}: ${records.length} organizaciones revisadas disponibles.`;
    const grouped = new Map();
    for (const record of records) {
      if (!grouped.has(record.category)) grouped.set(record.category, []);
      grouped.get(record.category).push(record);
    }

    const categories = [...grouped.keys()].sort((a,b) => (directory.categories[a] || a).localeCompare(directory.categories[b] || b, 'es', {sensitivity:'base'}));

    for (const category of categories) {
      const label = directory.categories[category] || category;
      const anchor = category;
      nav.append(el('a', label, {href:`#${anchor}`}));

      const section = el('section', null, {class:'friends-group', id:anchor});
      section.append(el('h2', label));
      const grid = el('div', null, {class:'friends-grid'});

      for (const record of grouped.get(category).sort((a,b) => a.name.localeCompare(b.name, 'es', {sensitivity:'base'}))) {
        const card = el('a', null, {
          class:'friends-card',
          href:record.url,
          rel:'noreferrer',
          'data-organization':record.id,
          'data-country':record.country
        });
        if (record.language) card.setAttribute('lang', record.language);
        card.append(
          el('h3', record.name),
          el('p', record.description || 'Consulta el recurso oficial para conocer cobertura y requisitos.'),
          el('span', `${new URL(record.url).hostname.replace(/^www\./,'')} →`, {class:'friends-link'})
        );
        grid.append(card);
      }
      section.append(grid);
      groupsHost.append(section);
    }
  }

  picker.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-country]');
    if (!button) return;
    renderCountry(button.dataset.country);
  });

  fetch('/data/help-directory.json', {credentials:'same-origin'})
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (!data || !Array.isArray(data.records) || !data.categories) throw new Error('Formato de directorio no válido');
      directory = data;
      buildCountryButtons();
      renderCountry('ES');
    })
    .catch(() => {
      status.textContent = 'No hemos podido cargar el directorio ahora mismo. Puedes usar Buscar ayuda o volver a intentarlo más tarde.';
      groupsHost.replaceChildren();
      const fallback = el('p');
      const link = el('a', 'Ir a Buscar ayuda', {href:'/buscar/'});
      fallback.append(link);
      groupsHost.append(fallback);
    });
})();
