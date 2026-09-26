(() => {
  'use strict';

  const COUNTRY_OPTIONS = Object.freeze([
    ['ES','España','🇪🇸'],['MX','México','🇲🇽'],['AR','Argentina','🇦🇷'],['CO','Colombia','🇨🇴'],['CL','Chile','🇨🇱'],['PE','Perú','🇵🇪'],['UY','Uruguay','🇺🇾'],['PY','Paraguay','🇵🇾'],['EC','Ecuador','🇪🇨'],['BO','Bolivia','🇧🇴'],['VE','Venezuela','🇻🇪'],['CR','Costa Rica','🇨🇷'],['PA','Panamá','🇵🇦'],['GT','Guatemala','🇬🇹'],['HN','Honduras','🇭🇳'],['SV','El Salvador','🇸🇻'],['NI','Nicaragua','🇳🇮'],['DO','República Dominicana','🇩🇴'],['PR','Puerto Rico','🇵🇷'],['CU','Cuba','🇨🇺'],['US','Estados Unidos','🇺🇸'],['CA','Canadá','🇨🇦'],['GB','Reino Unido','🇬🇧'],['IE','Irlanda','🇮🇪'],['FR','Francia','🇫🇷'],['PT','Portugal','🇵🇹'],['DE','Alemania','🇩🇪'],['IT','Italia','🇮🇹'],['BE','Bélgica','🇧🇪'],['NL','Países Bajos','🇳🇱'],['LU','Luxemburgo','🇱🇺'],['AT','Austria','🇦🇹'],['PL','Polonia','🇵🇱'],['SE','Suecia','🇸🇪'],['FI','Finlandia','🇫🇮'],['DK','Dinamarca','🇩🇰'],['GR','Grecia','🇬🇷'],['CZ','Chequia','🇨🇿'],['RO','Rumanía','🇷🇴'],['BG','Bulgaria','🇧🇬'],['HR','Croacia','🇭🇷'],['SK','Eslovaquia','🇸🇰'],['SI','Eslovenia','🇸🇮'],['HU','Hungría','🇭🇺'],['EE','Estonia','🇪🇪'],['LV','Letonia','🇱🇻'],['LT','Lituania','🇱🇹'],['MT','Malta','🇲🇹'],['CY','Chipre','🇨🇾'],['AU','Australia','🇦🇺'],['NZ','Nueva Zelanda','🇳🇿'],['IN','India','🇮🇳'],['JP','Japón','🇯🇵'],['KR','Corea del Sur','🇰🇷'],['ZA','Sudáfrica','🇿🇦'],['MA','Marruecos','🇲🇦'],['NG','Nigeria','🇳🇬'],['EU','Unión Europea','🇪🇺']
  ]);

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
    for (const record of directory.records) counts.set(record.country, (counts.get(record.country) || 0) + 1);
    return counts;
  }

  function buildCountryButtons() {
    const counts = countryCounts();
    picker.replaceChildren();
    for (const [code,name,flag] of COUNTRY_OPTIONS) {
      const count = counts.get(code) || 0;
      const button = el('button', `${flag} ${name}`, {
        type: 'button',
        class: `country-button${count ? '' : ' country-unavailable'}`,
        'data-country': code,
        'aria-pressed': String(code === selectedCountry)
      });
      if (!count) button.title = 'Cobertura en ampliación: todavía no mostramos recursos sin verificar';
      picker.append(button);
    }
  }

  function renderCountry(code) {
    selectedCountry = code;
    const meta = byCode.get(code) || {code,name:code,flag:'🌐'};
    const records = normalizeRecords(directory.records.filter((record) => record.country === code));

    for (const button of picker.querySelectorAll('button[data-country]')) {
      button.setAttribute('aria-pressed', String(button.dataset.country === code));
    }

    if (selectedLabel) selectedLabel.textContent = `${meta.flag} ${meta.name}`;
    nav.replaceChildren();
    groupsHost.replaceChildren();

    if (!records.length) {
      status.textContent = `${meta.flag} ${meta.name}: estamos ampliando y verificando recursos. No mostramos enlaces no comprobados.`;
      groupsHost.append(el('section', null, {class:'empty-country'}));
      groupsHost.lastElementChild.append(
        el('h2', `Aún no hay recursos verificados para ${meta.name}`),
        el('p', 'Estamos ampliando la cobertura. Mientras tanto, puedes volver a España o usar la ayuda internacional disponible sin que mostremos enlaces no verificados.')
      );
      return;
    }

    status.textContent = `${meta.flag} ${meta.name}: ${records.length} recursos verificados disponibles.`;
    const grouped = new Map();
    for (const record of records) {
      if (!grouped.has(record.category)) grouped.set(record.category, []);
      grouped.get(record.category).push(record);
    }

    const categories = [...grouped.keys()].sort((a,b) => (directory.categories[a] || a).localeCompare(directory.categories[b] || b, 'es', {sensitivity:'base'}));

    for (const category of categories) {
      const label = directory.categories[category] || category;
      const anchor = `cat-${category}`;
      nav.append(el('a', label, {href:`#${anchor}`}));

      const section = el('section', null, {class:'friends-group', id:anchor});
      section.append(el('h2', label));
      const grid = el('div', null, {class:'friends-grid'});

      for (const record of grouped.get(category).sort((a,b) => a.name.localeCompare(b.name, 'es', {sensitivity:'base'}))) {
        const card = el('a', null, {class:'friends-card', href:record.url, rel:'noreferrer'});
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
