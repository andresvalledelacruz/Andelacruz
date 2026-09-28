(() => {
  'use strict';

  const picker = document.querySelector('#country-buttons');
  const status = document.querySelector('#country-status');
  const nav = document.querySelector('#friends-nav');
  const groupsHost = document.querySelector('#friends-groups');
  const selectedLabel = document.querySelector('#selected-country-label');
  if (!picker || !status || !nav || !groupsHost) return;

  let directory = null;
  let options = [];
  let selectedCountry = 'ES';
  const collator = new Intl.Collator('es', { sensitivity: 'base' });

  const el = (tag, text, attrs = {}) => {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, value));
    return node;
  };

  const optionMeta = (code) => options.find((item) => item.code === code) || { code, name: code, flag: '🌐' };

  function countryCounts() {
    const counts = new Map();
    directory.records.forEach((record) => counts.set(record.country, (counts.get(record.country) || 0) + 1));
    return counts;
  }

  function buildCountryButtons() {
    const counts = countryCounts();
    picker.replaceChildren();
    options.forEach(({ code, name, flag }) => {
      const count = counts.get(code) || 0;
      const button = el('button', `${flag} ${name}`, {
        type: 'button',
        class: `country-button${count ? '' : ' country-unavailable'}`,
        'data-country': code,
        'aria-pressed': String(code === selectedCountry)
      });
      if (!count) button.title = 'Cobertura en ampliación: todavía no mostramos recursos sin verificar';
      picker.append(button);
    });
  }

  function renderCountry(code) {
    selectedCountry = code;
    const meta = optionMeta(code);
    const records = directory.records.filter((record) => record.country === code);
    picker.querySelectorAll('button[data-country]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.country === code)));
    if (selectedLabel) selectedLabel.textContent = `${meta.flag} ${meta.name}`;
    nav.replaceChildren();
    groupsHost.replaceChildren();

    if (!records.length) {
      status.textContent = `${meta.flag} ${meta.name}: cobertura en ampliación. No mostramos enlaces no verificados.`;
      const section = el('section', null, { class: 'empty-country' });
      section.append(el('h2', `Aún no hay recursos verificados para ${meta.name}`), el('p', 'Estamos ampliando la cobertura. Puedes elegir otro país o utilizar Buscar ayuda.'));
      groupsHost.append(section);
      return;
    }

    status.textContent = `${meta.flag} ${meta.name}: ${records.length} recursos verificados disponibles.`;
    const grouped = new Map();
    records.forEach((record) => {
      if (!grouped.has(record.category)) grouped.set(record.category, []);
      grouped.get(record.category).push(record);
    });

    [...grouped.keys()].sort((a, b) => collator.compare(directory.categories[a] || a, directory.categories[b] || b)).forEach((category) => {
      const label = directory.categories[category] || category;
      nav.append(el('a', label, { href: `#${category}` }));
      const section = el('section', null, { class: 'friends-group', id: category });
      section.append(el('h2', label));
      const grid = el('div', null, { class: 'friends-grid' });
      grouped.get(category).sort((a, b) => collator.compare(a.name, b.name)).forEach((record) => {
        const card = el('a', null, { class: 'friends-card', href: record.url, rel: 'noreferrer', 'data-organization': record.id, 'data-country': record.country });
        if (record.language) card.setAttribute('lang', record.language);
        card.append(el('h3', record.name), el('p', record.description || 'Consulta el recurso oficial para conocer cobertura y requisitos.'), el('span', `${new URL(record.url).hostname.replace(/^www\./, '')} →`, { class: 'friends-link' }));
        grid.append(card);
      });
      section.append(grid);
      groupsHost.append(section);
    });
  }

  picker.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-country]');
    if (button) renderCountry(button.dataset.country);
  });

  Promise.all([
    fetch('/data/help-directory.json', { credentials: 'same-origin' }).then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }),
    import('/country-options.js')
  ]).then(([data, countryModule]) => {
    if (!data || !Array.isArray(data.records) || !data.categories) throw new Error('Formato de directorio no válido');
    directory = data;
    const rawOptions = countryModule.COUNTRY_OPTIONS || countryModule.default || window.DesgraciasCountryOptions || [];
    options = rawOptions.map((item) => Array.isArray(item) ? { code: item[0], name: item[1], flag: item[2] } : item).filter((item) => item && item.code && item.name);
    if (!options.some((item) => item.code === 'ES')) options.unshift({ code: 'ES', name: 'España', flag: '🇪🇸' });
    options = [optionMeta('ES'), ...options.filter((item) => item.code !== 'ES').sort((a, b) => collator.compare(a.name, b.name))];
    buildCountryButtons();
    picker.closest('.country-picker').hidden = false;
    renderCountry('ES');
  }).catch(() => {
    status.textContent = 'No hemos podido cargar el directorio ahora mismo. Puedes utilizar Buscar ayuda o volver a intentarlo más tarde.';
    // Keep the sourced Spanish HTML available when loading fails.
    picker.closest('.country-picker').hidden = true;
  });
})();
