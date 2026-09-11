(() => {
  const resourceGrid = document.querySelector('#recursos .resource-grid');
  if (!resourceGrid) return;

  const routes = new Map([
    ['Gestión emocional', '/gestion-emocional/'],
    ['Rupturas y relaciones', '/rupturas/'],
    ['Familia', '/familia/'],
    ['Trabajo y dinero', '/trabajo-dinero/'],
    ['Duelo y pérdidas', '/duelo/'],
    ['Soledad', '/soledad/'],
    ['Ansiedad y desbordamiento', '/ansiedad/'],
    ['Salud y enfermedad', '/salud/'],
    ['Violencia, abuso y acoso', '/violencia/'],
    ['Suicidio', '/ayuda-urgente.html']
  ]);

  const RESOURCE_ORDER = [
    'Suicidio',
    'Violencia, abuso y acoso',
    'Duelo y pérdidas',
    'Ansiedad y desbordamiento',
    'Gestión emocional',
    'Soledad',
    'Salud y enfermedad',
    'Trabajo y dinero',
    'Rupturas y relaciones',
    'Familia'
  ];

  const presentation = new Map([
    ['Gestión emocional', { icon: '♡', copy: 'Entender lo que sientes y ponerle nombre.' }],
    ['Rupturas y relaciones', { icon: '◎', copy: 'Ideas para atravesar cambios sentimentales.' }],
    ['Familia', { icon: '⌂', copy: 'Conflictos, límites y comunicación.' }],
    ['Trabajo y dinero', { icon: '↗', copy: 'Orientación ante despidos, deudas y cambios.' }],
    ['Duelo y pérdidas', { icon: '◇', copy: 'Recursos para transitar procesos difíciles.' }],
    ['Soledad', { icon: '◌', copy: 'Cuando falta compañía, conexión o alguien con quien hablar.' }],
    ['Ansiedad y desbordamiento', { icon: '≈', copy: 'Miedo, estrés, angustia o la sensación de no poder con todo.' }],
    ['Salud y enfermedad', { icon: '+', copy: 'Orientación ante una enfermedad propia o de alguien cercano.' }],
    ['Violencia, abuso y acoso', { icon: '◈', copy: 'Si alguien te está dañando, controlando, amenazando o acosando.' }],
    ['Suicidio', { icon: 'SOS', copy: 'Si estás pensando en suicidarte o te preocupa un riesgo inmediato.', safety: 'P0' }]
  ]);

  const directCards = () => [...resourceGrid.children].map((node) => ({
    node,
    article: node.tagName === 'ARTICLE' ? node : node.querySelector(':scope > article')
  }));

  const findCard = (label) => directCards().find(({ article }) =>
    article?.querySelector('h3')?.textContent?.trim() === label
  );

  const createCard = (label) => {
    const { icon, copy, safety } = presentation.get(label);
    const article = document.createElement('article');
    if (safety) article.dataset.safety = safety;

    const symbol = document.createElement('span');
    symbol.textContent = icon;
    const heading = document.createElement('h3');
    heading.textContent = label;
    const paragraph = document.createElement('p');
    paragraph.textContent = copy;

    article.append(symbol, heading, paragraph);
    if (safety === 'P0') {
      article.style.border = '2px solid #8E6548';
      article.style.background = '#FFF8F2';
    }
    return article;
  };

  const wrapCard = (card, href, label, safety) => {
    if (!card) return null;
    const existingLink = card.parentElement?.tagName === 'A' ? card.parentElement : null;
    const link = existingLink ?? document.createElement('a');

    link.href = href;
    link.setAttribute('aria-label', safety === 'P0'
      ? 'Abrir ayuda urgente sobre suicidio y riesgo inmediato'
      : `Ver recursos de ${label}`);
    link.style.cssText = 'display:block;height:100%';
    if (safety) link.dataset.safety = safety;
    card.style.height = '100%';

    if (!existingLink) {
      card.replaceWith(link);
      link.append(card);
    }
    return link;
  };

  for (const [label, href] of routes) {
    const { safety } = presentation.get(label);
    let found = findCard(label);
    if (!found) {
      const article = createCard(label);
      resourceGrid.append(article);
      found = { node: article, article };
    }
    wrapCard(found.article, href, label, safety);
  }

  const linkedCards = [...resourceGrid.children].filter((element) => element.tagName === 'A');
  for (const link of linkedCards) {
    const article = link.querySelector('article');
    if (!article || article.querySelector('[data-resource-link-cue]')) continue;

    const cue = document.createElement('span');
    cue.dataset.resourceLinkCue = '';
    cue.setAttribute('aria-hidden', 'true');
    cue.textContent = link.dataset.safety === 'P0' ? 'Ver ayuda ahora →' : 'Ver recursos →';
    cue.style.cssText = 'display:block;margin-top:12px;font-weight:700;font-size:.9rem';
    article.append(cue);
  }

  const orderedNodes = new Set();
  for (const label of RESOURCE_ORDER) {
    const found = findCard(label);
    if (!found?.node) continue;
    resourceGrid.append(found.node);
    orderedNodes.add(found.node);
  }

  for (const child of [...resourceGrid.children]) {
    if (!orderedNodes.has(child)) resourceGrid.append(child);
  }
})();
