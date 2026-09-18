(() => {
  const DATA_URL = '/content/historias-ejemplo-v1.json';
  const EMPTY_STATE_TITLE = 'Aún no hay historias publicadas.';
  const STORY_SECTION = '#historias';
  let rendered = false;
  let libraryPromise;

  function replaceExactText(root, from, to) {
    root.querySelectorAll('strong, a, button, small, p').forEach((node) => {
      const fullText = node.textContent.trim();
      if (fullText !== from && !fullText.startsWith(`${from} `)) return;
      const textNode = [...node.childNodes].find((child) => child.nodeType === Node.TEXT_NODE && child.textContent.includes(from));
      if (textNode) textNode.textContent = textNode.textContent.replace(from, to);
      else if (node.children.length === 0) node.textContent = fullText.replace(from, to);
    });
  }

  function normalizePublicStoryCopy() {
    replaceExactText(document, 'Leer historias reales', 'Leer historias');
    const eyebrow = document.querySelector(`${STORY_SECTION} .section-heading .eyebrow`);
    if (eyebrow?.textContent.trim() === 'Experiencias reales') eyebrow.textContent = 'Relatos y experiencias';
  }

  function injectStyles() {
    if (document.getElementById('story-example-library-styles')) return;
    const style = document.createElement('style');
    style.id = 'story-example-library-styles';
    style.textContent = `
      .story-example-intro{grid-column:1/-1}.story-example-intro .story-visual{min-height:auto}
      .story-example-card{cursor:pointer;position:relative}.story-example-card .story-meta{align-items:center;gap:10px;flex-wrap:wrap}
      .story-example-card .story-example-read::after{content:'';position:absolute;inset:0;border-radius:inherit;z-index:3}
      .story-example-card:focus-within{outline:3px solid #b78d66;outline-offset:3px}
      .story-example-read{border:0;border-radius:999px;padding:8px 12px;background:#28332f;color:#fff;font:inherit;font-size:.82rem;font-weight:700;cursor:pointer}
      .story-example-read:hover{background:#435449}.story-example-read:focus-visible{outline:3px solid #b78d66;outline-offset:3px}
      .story-example-label{font-weight:700}.story-example-context{opacity:.72}
      #historias .section-heading.horizontal{display:block}#historias .story-filters{display:flex;flex-wrap:wrap;margin-top:20px;gap:8px}
      #historias .story-filters button{white-space:normal}#historias .story-filters [data-priority]{border:2px solid #82664f}
      #historias .story-example-card[hidden]{display:none}#historias .story-example-card .story-visual{min-height:0;padding:20px}
      #historias .story-example-card h3{font-size:1.18rem}#historias .story-example-card .story-meta{padding:14px 20px}
      #historias .story-example-intro .story-visual{padding:16px 20px}#historias .story-example-intro h3{font-size:1.05rem}
      #historias .story-example-more{display:block;margin:18px auto}#historias .story-example-more[hidden]{display:none}
      #historias .story-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      #historias .story-example-intro .story-visual{padding:12px 16px}#historias .story-example-intro p{margin:6px 0 0}
      #historias .section-subtitle{margin:10px 0;line-height:1.5}
      @media(min-width:1100px){#historias .story-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
      @media(max-width:720px){#historias .story-filters{flex-wrap:nowrap;overflow-x:auto;max-width:100%;padding:5px 4px 10px;margin-top:12px}#historias .story-filters button{flex:0 0 auto;min-height:44px;white-space:nowrap}#historias .story-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:479px){#historias .story-grid{grid-template-columns:minmax(0,1fr)}}
      .story-example-dialog{border:0;border-radius:20px;padding:0;width:min(900px,calc(100% - 24px));max-height:min(90vh,900px);box-shadow:0 24px 90px rgba(25,34,31,.28);color:#28332f;background:#fff}
      .story-example-dialog::backdrop{background:rgba(31,39,36,.52)}
      .story-example-shell{padding:clamp(20px,4vw,42px);position:relative}.story-example-close{position:absolute;right:18px;top:14px;border:0;background:transparent;font-size:2rem;line-height:1;cursor:pointer;color:#28332f}
      .story-example-kicker{font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:#82664f;margin:0 48px 9px 0}.story-example-shell h2{font-family:'Libre Baskerville',serif;font-size:clamp(1.7rem,4vw,2.55rem);line-height:1.18;margin:0 46px 10px 0}
      .story-example-disclosure{margin:18px 0;padding:14px 16px;border:1px solid #dfd3c7;border-radius:14px;background:#fbf7f2;font-size:.93rem}.story-example-body{font-size:1rem;line-height:1.72}.story-example-body p{margin:0 0 1em}
      .story-example-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:24px;margin-top:24px}.story-example-box{border:1px solid #e5ddd4;border-radius:16px;padding:18px}.story-example-box h3{font-size:1rem;margin:0 0 10px}.story-example-box ul{margin:0;padding-left:20px}.story-example-box li+li{margin-top:7px}
      .story-example-timeline{display:grid;gap:10px}.story-example-time{display:grid;grid-template-columns:110px 1fr;gap:12px;padding-top:10px;border-top:1px solid #eee6de}.story-example-time strong{font-size:.86rem;color:#82664f}
      .story-example-help{margin-top:20px;padding:16px;border-radius:14px;background:#f6efe8}.story-example-help strong{display:block;margin-bottom:6px}.story-example-help a{font-weight:800;color:inherit}
      @media(max-width:720px){.story-example-grid{grid-template-columns:1fr}.story-example-time{grid-template-columns:1fr;gap:3px}.story-example-dialog{width:calc(100% - 14px)}}
    `;
    document.head.append(style);
  }

  function loadLibrary() {
    if (!libraryPromise) {
      libraryPromise = fetch('/content/historias-ejemplo-v1.json', { cache: 'no-store', credentials: 'omit' })
        .then((response) => {
          if (!response.ok) throw new Error('story_examples_unavailable');
          return response.json();
        })
        .then((data) => {
          if (!data || data.is_real_user_content !== false || data.governance?.never_label_as_real !== true) {
            throw new Error('story_examples_governance_invalid');
          }
          if (!Array.isArray(data.stories) || data.stories.length < 40) throw new Error('story_examples_count_invalid');
          const groups = ['pareja', 'familia', 'trabajo', 'dinero', 'duelo', 'soledad', 'ansiedad', 'violencia', 'crisis', 'cuidados'];
          if (groups.some((group) => data.stories.filter((story) => categoryKey(story.category) === group).length < 4)) throw new Error('story_examples_category_incomplete');
          return data;
        });
    }
    return libraryPromise;
  }

  function categoryKey(category) {
    const map = {
      'Pareja y Rupturas': 'pareja',
      'Familia': 'familia',
      'Trabajo': 'trabajo',
      'Dinero': 'dinero',
      'Duelo y Pérdidas': 'duelo',
      'Soledad': 'soledad',
      'Ansiedad y Desbordamiento': 'ansiedad',
      'Violencia, Abuso y Acoso': 'violencia',
      'Crisis y Suicidio': 'crisis',
      'Salud y Cuidados': 'cuidados'
    };
    return map[category] || 'otras-historias';
  }

  function visualClass(index) {
    return `story-${['one', 'two', 'three'][index % 3]}`;
  }

  function createIntroCard(library) {
    const article = document.createElement('article');
    article.className = 'story-card story-example-intro';
    const visual = document.createElement('div');
    visual.className = 'story-visual story-one';
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = 'Biblioteca inicial';
    const title = document.createElement('h3');
    title.textContent = `${library.stories.length} relatos de ejemplo para encontrar experiencias parecidas`;
    const text = document.createElement('p');
    text.textContent = library.public_disclosure;
    visual.append(tag, title, text);
    article.append(visual);
    return article;
  }

  function createCard(story, index, library) {
    const article = document.createElement('article');
    article.className = 'story-card story-example-card';
    article.dataset.category = categoryKey(story.category);
    article.dataset.storyExample = story.slug;

    const visual = document.createElement('div');
    visual.className = `story-visual ${visualClass(index)}`;
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = story.category;
    const title = document.createElement('h3');
    title.textContent = story.title;
    const excerpt = document.createElement('p');
    excerpt.textContent = story.excerpt;
    visual.append(tag, title, excerpt);

    const meta = document.createElement('div');
    meta.className = 'story-meta';
    const label = document.createElement('span');
    label.className = 'story-example-label';
    label.textContent = library.display_label;
    const context = document.createElement('span');
    context.className = 'story-example-context';
    context.textContent = story.context;
    const read = document.createElement('button');
    read.type = 'button';
    read.className = 'story-example-read';
    read.textContent = 'Leer historia completa';
    read.setAttribute('aria-haspopup', 'dialog');
    read.setAttribute('aria-label', `Leer historia de ejemplo: ${story.title}`);
    read.addEventListener('click', () => openStory(story, library));
    meta.append(label, context, read);
    article.append(visual, meta);
    return article;
  }

  function ensureDialog() {
    let dialog = document.getElementById('story-example-dialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'story-example-dialog';
    dialog.className = 'story-example-dialog';
    dialog.setAttribute('aria-labelledby', 'story-example-title');
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    document.body.append(dialog);
    return dialog;
  }

  function appendList(box, titleText, values) {
    const title = document.createElement('h3');
    title.textContent = titleText;
    const list = document.createElement('ul');
    for (const value of values || []) {
      const item = document.createElement('li');
      item.textContent = value;
      list.append(item);
    }
    box.append(title, list);
  }

  function highRiskHelp(story) {
    const box = document.createElement('div');
    box.className = 'story-example-help';
    const title = document.createElement('strong');
    title.textContent = 'Si esto se parece a lo que estás viviendo ahora';
    const text = document.createElement('span');
    text.append('Si existe peligro inmediato en España, llama al ');
    const emergency = document.createElement('a');
    emergency.href = 'tel:112';
    emergency.textContent = '112';
    text.append(emergency, '.');

    if (story.category === 'Crisis y Suicidio') {
      text.append(' Para una crisis relacionada con conducta suicida, también puedes llamar al ');
      const suicide = document.createElement('a');
      suicide.href = 'tel:024';
      suicide.textContent = '024';
      text.append(suicide, '.');
    } else if (story.slug === 'tarde-mucho-en-llamar-maltrato-a-lo-que-me-pasaba') {
      text.append(' Para información y asesoramiento sobre violencia contra las mujeres, puedes contactar con el ');
      const violence = document.createElement('a');
      violence.href = 'tel:016';
      violence.textContent = '016';
      text.append(violence, '.');
    }
    box.append(title, text);
    return box;
  }

  function openStory(story, library) {
    const dialog = ensureDialog();
    dialog.replaceChildren();
    const shell = document.createElement('article');
    shell.className = 'story-example-shell';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'story-example-close';
    close.setAttribute('aria-label', 'Cerrar historia');
    close.textContent = '×';
    close.addEventListener('click', () => dialog.close());

    const kicker = document.createElement('p');
    kicker.className = 'story-example-kicker';
    kicker.textContent = `${library.display_label} · ${story.category}`;
    const title = document.createElement('h2');
    title.id = 'story-example-title';
    title.textContent = story.title;
    const context = document.createElement('p');
    context.className = 'story-example-context';
    context.textContent = story.context;
    const disclosure = document.createElement('div');
    disclosure.className = 'story-example-disclosure';
    disclosure.textContent = library.public_disclosure;

    const body = document.createElement('div');
    body.className = 'story-example-body';
    for (const paragraph of story.body || []) {
      const p = document.createElement('p');
      p.textContent = paragraph;
      body.append(p);
    }

    const detailGrid = document.createElement('div');
    detailGrid.className = 'story-example-grid';
    const timelineBox = document.createElement('section');
    timelineBox.className = 'story-example-box';
    const timelineTitle = document.createElement('h3');
    timelineTitle.textContent = 'El recorrido en el tiempo';
    const timeline = document.createElement('div');
    timeline.className = 'story-example-timeline';
    for (const point of story.timeline || []) {
      const row = document.createElement('div');
      row.className = 'story-example-time';
      const label = document.createElement('strong');
      label.textContent = point.label;
      const text = document.createElement('span');
      text.textContent = point.text;
      row.append(label, text);
      timeline.append(row);
    }
    timelineBox.append(timelineTitle, timeline);

    const actionsBox = document.createElement('section');
    actionsBox.className = 'story-example-box';
    appendList(actionsBox, 'Qué ayudó en este relato', story.helped);
    const divider = document.createElement('hr');
    divider.style.border = '0';
    divider.style.borderTop = '1px solid #eee6de';
    divider.style.margin = '18px 0';
    actionsBox.append(divider);
    appendList(actionsBox, 'Siguientes pasos posibles', story.nextSteps);
    detailGrid.append(timelineBox, actionsBox);

    shell.append(close, kicker, title, context, disclosure, body, detailGrid);
    if (['Crisis y Suicidio', 'Violencia, Abuso y Acoso'].includes(story.category)) shell.append(highRiskHelp(story));
    dialog.append(shell);
    dialog.showModal();
    close.focus();
  }

  function renderLibrary(grid, library) {
    if (rendered || !grid.isConnected) return;
    rendered = true;
    injectStyles();
    grid.replaceChildren(createIntroCard(library));
    library.stories.forEach((story, index) => grid.append(createCard(story, index, library)));
    installGroups(grid, library);
  }

  function installGroups(grid, library) {
    const filters = document.querySelector(`${STORY_SECTION} .story-filters`);
    if (!filters) return;
    const groups = [
      ['crisis', 'Crisis y suicidio'], ['violencia', 'Violencia, abuso y acoso'],
      ['ansiedad', 'Ansiedad y desbordamiento'], ['cuidados', 'Salud y cuidados'],
      ['duelo', 'Duelo y pérdidas'], ['soledad', 'Soledad'],
      ['pareja', 'Pareja y rupturas'], ['familia', 'Familia'],
      ['trabajo', 'Trabajo'], ['dinero', 'Dinero'], ['all', 'Todas']
    ];
    let selected = 'all';
    let limit = 6;
    const status = document.createElement('p');
    status.className = 'section-subtitle';
    status.setAttribute('role', 'status');
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'btn btn-ghost story-example-more';
    more.textContent = 'Mostrar más relatos de ejemplo';
    grid.before(status);
    grid.after(more);
    const cards = [...grid.querySelectorAll('[data-story-example]')];
    const refresh = () => {
      let count = 0;
      cards.forEach((card) => {
        const matches = selected === 'all' || card.dataset.category === selected;
        card.hidden = !matches || ++count > limit;
      });
      status.textContent = `${Math.min(count, limit)} de ${count} relatos de ejemplo. Elige una situación para acotar la lectura.`;
      more.hidden = count <= limit;
      filters.querySelectorAll('button').forEach((button) => {
        const active = button.dataset.group === selected;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    };
    filters.replaceChildren();
    groups.forEach(([key, label], index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'filter';
      button.dataset.group = key;
      if (index < 4) button.dataset.priority = 'true';
      button.textContent = label;
      button.addEventListener('click', () => { selected = key; limit = 6; refresh(); });
      filters.append(button);
    });
    more.addEventListener('click', () => {
      const previousLimit = limit;
      limit += 6;
      refresh();
      const visible = cards.filter((card) => !card.hidden);
      visible[previousLimit]?.querySelector('button')?.focus();
    });
    refresh();
  }

  function isConfirmedEmpty(grid) {
    return [...grid.querySelectorAll('h3')].some((node) => node.textContent.trim() === EMPTY_STATE_TITLE);
  }

  function watchForEmptyState() {
    const grid = document.querySelector('.story-grid');
    if (!grid) return;

    const tryRender = () => {
      if (rendered || !isConfirmedEmpty(grid)) return;
      loadLibrary()
        .then((library) => renderLibrary(grid, library))
        .catch((error) => console.error('Story example library failed', error));
    };

    const observer = new MutationObserver(tryRender);
    observer.observe(grid, { childList: true, subtree: true });
    tryRender();
  }

  normalizePublicStoryCopy();
  watchForEmptyState();
})();
