(() => {
  const resourceGrid = document.querySelector('#recursos .resource-grid');
  if (!resourceGrid) return;

  const resources = Object.freeze([
    { label: 'Gestión emocional', href: '/gestion-emocional/', icon: '♡', copy: 'Entender lo que sientes y ponerle nombre.' },
    { label: 'Rupturas y relaciones', href: '/rupturas/', icon: '◎', copy: 'Ideas para atravesar cambios sentimentales.' },
    { label: 'Familia', href: '/familia/', icon: '⌂', copy: 'Conflictos, límites y comunicación.' },
    { label: 'Trabajo y dinero', href: '/trabajo-dinero/', icon: '↗', copy: 'Orientación ante despidos, deudas y cambios.' },
    { label: 'Duelo y pérdidas', href: '/duelo/', icon: '◇', copy: 'Recursos para transitar procesos difíciles.' },
    { label: 'Soledad', href: '/soledad/', icon: '◌', copy: 'Cuando falta compañía, conexión o alguien con quien hablar.' },
    { label: 'Ansiedad y desbordamiento', href: '/ansiedad/', icon: '≈', copy: 'Miedo, estrés, angustia o la sensación de no poder con todo.' },
    { label: 'Salud y enfermedad', href: '/salud/', icon: '+', copy: 'Orientación ante una enfermedad propia o de alguien cercano.' },
    { label: 'Violencia, abuso y acoso', href: '/violencia/', icon: '◈', copy: 'Si alguien te está dañando, controlando, amenazando o acosando.' },
    { label: 'Suicidio', href: '/ayuda-urgente.html', icon: 'SOS', copy: 'Si estás pensando en suicidarte o te preocupa un riesgo inmediato.', safety: 'P0' }
  ]);

  const directCards = () => [...resourceGrid.children].map((node) => ({
    node,
    article: node.tagName === 'ARTICLE' ? node : node.querySelector(':scope > article')
  }));

  const findCard = (label) => directCards().find(({ article }) =>
    article?.querySelector('h3')?.textContent?.trim() === label
  );

  const createCard = ({ label, icon, copy, safety }) => {
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

  for (const resource of resources) {
    let found = findCard(resource.label);
    if (!found) {
      const article = createCard(resource);
      resourceGrid.append(article);
      found = { node: article, article };
    }
    wrapCard(found.article, resource.href, resource.label, resource.safety);
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
})();
