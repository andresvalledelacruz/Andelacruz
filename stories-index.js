(() => {
  'use strict';

  const DATA_URL = '/content/historias-ejemplo-v1.json';
  const categoryRoot = document.getElementById('story-categories');
  const list = document.getElementById('story-library');
  const status = document.getElementById('story-library-status');
  const dialog = document.getElementById('story-reader');
  const shell = document.getElementById('story-reader-content');
  let library = null;

  if (!categoryRoot || !list || !status || !dialog || !shell) return;

  function text(tag, value, className = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value;
    return node;
  }

  function riskHelp(story) {
    const box = document.createElement('aside');
    box.className = 'notice';
    const strong = text('strong', 'Si esto se parece a lo que estás viviendo ahora');
    const p = document.createElement('p');
    p.append('Si existe peligro inmediato en España, llama al ');
    const emergency = document.createElement('a');
    emergency.href = 'tel:112'; emergency.textContent = '112'; p.append(emergency, '.');
    if (story.category === 'Crisis y Suicidio') {
      p.append(' Para una crisis relacionada con conducta suicida, también puedes llamar al ');
      const suicide = document.createElement('a'); suicide.href = 'tel:024'; suicide.textContent = '024'; p.append(suicide, '.');
    }
    if (story.category === 'Violencia, Abuso y Acoso') {
      p.append(' En violencia contra las mujeres, el ');
      const violence = document.createElement('a'); violence.href = 'tel:016'; violence.textContent = '016'; p.append(violence, ' ofrece información y asesoramiento dentro de su ámbito.');
    }
    box.append(strong, p); return box;
  }

  function openStory(story) {
    shell.replaceChildren();
    const close = text('button', '×', 'story-reader-close');
    close.type = 'button'; close.setAttribute('aria-label', 'Cerrar historia'); close.addEventListener('click', () => dialog.close());
    const kicker = text('p', `Historia de ejemplo · ${story.category}`, 'eyebrow');
    const title = text('h2', story.title); title.id = 'story-reader-title';
    const context = text('p', story.context, 'small');
    const disclosure = text('p', library.public_disclosure, 'commercial-disclosure');
    const body = document.createElement('div'); body.className = 'story-reader-body';
    (story.body || []).forEach(paragraph => body.append(text('p', paragraph)));

    const detail = document.createElement('div'); detail.className = 'grid two';
    const helped = document.createElement('section'); helped.className = 'growth-card'; helped.append(text('h3', 'Qué ayudó en este relato'));
    const helpedList = document.createElement('ul'); helpedList.className = 'checklist'; (story.helped || []).forEach(item => helpedList.append(text('li', item))); helped.append(helpedList);
    const next = document.createElement('section'); next.className = 'growth-card'; next.append(text('h3', 'Siguientes pasos posibles'));
    const nextList = document.createElement('ul'); nextList.className = 'checklist'; (story.nextSteps || []).forEach(item => nextList.append(text('li', item))); next.append(nextList);
    detail.append(helped, next);
    shell.append(close, kicker, title, context, disclosure, body, detail);
    if (['Crisis y Suicidio', 'Violencia, Abuso y Acoso'].includes(story.category)) shell.append(riskHelp(story));
    dialog.showModal(); close.focus();
  }

  function compactStory(story) {
    const article = document.createElement('article'); article.className = 'story-row';
    const copy = document.createElement('div');
    copy.append(text('p', 'Historia de ejemplo', 'label'), text('h3', story.title), text('p', story.excerpt, 'small'));
    const button = text('button', 'Leer', 'button secondary'); button.type = 'button'; button.addEventListener('click', () => openStory(story));
    article.append(copy, button); return article;
  }

  function showCategories() {
    list.replaceChildren();
    const counts = new Map();
    library.stories.forEach(story => counts.set(story.category, (counts.get(story.category) || 0) + 1));
    categoryRoot.replaceChildren(...[...counts.entries()].map(([category, count]) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'story-category';
      button.append(text('strong', category), text('span', `${count} relato${count === 1 ? '' : 's'} de ejemplo`));
      button.addEventListener('click', () => showCategory(category));
      return button;
    }));
    categoryRoot.hidden = false;
    status.textContent = 'Elige un tema para ver solo sus historias.';
  }

  function showCategory(category) {
    const stories = library.stories.filter(story => story.category === category);
    categoryRoot.hidden = true;
    const back = text('button', '← Volver a los temas', 'button secondary'); back.type = 'button'; back.addEventListener('click', showCategories);
    const heading = text('h2', category);
    const head = document.createElement('div'); head.className = 'story-selection-head'; head.append(heading, back);
    list.replaceChildren(head, ...stories.map(compactStory));
    status.textContent = `${stories.length} historia${stories.length === 1 ? '' : 's'} de ejemplo en ${category}.`;
    head.scrollIntoView({ block: 'nearest' });
  }

  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

  fetch(DATA_URL, { cache: 'no-store', credentials: 'omit' })
    .then(response => { if (!response.ok) throw new Error('story_library_unavailable'); return response.json(); })
    .then(data => {
      if (!data || data.is_real_user_content !== false || data.governance?.never_label_as_real !== true) throw new Error('story_library_governance_invalid');
      if (!Array.isArray(data.stories) || data.stories.length !== 18) throw new Error('story_library_count_invalid');
      library = data; showCategories();
    })
    .catch(() => { status.textContent = 'La biblioteca de relatos no está disponible ahora mismo. Puedes seguir usando Buscar ayuda y Recursos.'; });
})();
