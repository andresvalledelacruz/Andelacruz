const API_BASE = 'https://desgracias-api-staging.onrender.com';
const STORAGE_KEY = 'desgracias_staging_story_actions_v1';

const grid = document.querySelector('#storyGrid');
const count = document.querySelector('#storyCount');
const searchInput = document.querySelector('#storySearch');
const categoryFilter = document.querySelector('#storyCategory');
const dialog = document.querySelector('#storyDetail');
const detailChip = document.querySelector('#detailChip');
const detailTitle = document.querySelector('#detailTitle');
const detailContext = document.querySelector('#detailContext');
const detailCopy = document.querySelector('#detailCopy');
const detailTimeline = document.querySelector('#detailTimeline');
const detailHelped = document.querySelector('#detailHelped');
const detailNext = document.querySelector('#detailNext');
const eventStatus = document.querySelector('#storyEventStatus');
const closeDetail = document.querySelector('#closeDetail');
const interactionButtons = [...document.querySelectorAll('[data-interaction]')];

let stories = [];
let activeStory = null;

function readActions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeActions(actions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  } catch {
    // Staging UX must keep working even when local storage is unavailable.
  }
}

function hasAction(slug, type) {
  return Boolean(readActions()[slug]?.includes(type));
}

function toggleLocalAction(slug, type) {
  const actions = readActions();
  const current = new Set(actions[slug] || []);
  const enabling = !current.has(type);
  if (enabling) current.add(type);
  else current.delete(type);
  actions[slug] = [...current];
  writeActions(actions);
  return enabling;
}

function setEventStatus(kind, text) {
  if (!eventStatus) return;
  eventStatus.className = `story-event-status ${kind || ''}`;
  eventStatus.textContent = text || '';
}

function updateActionButtons() {
  if (!activeStory) return;
  for (const button of interactionButtons) {
    button.setAttribute('aria-pressed', String(hasAction(activeStory.slug, button.dataset.interaction)));
  }
}

async function queueInteraction(slug, type) {
  const response = await fetch(`${API_BASE}/api/stories/${encodeURIComponent(slug)}/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, synthetic: true })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'interaction_failed');
  return data;
}

async function applyInteraction(type, button) {
  if (!activeStory) return;
  const enabling = toggleLocalAction(activeStory.slug, type);
  updateActionButtons();
  renderStories();

  if (!enabling) {
    setEventStatus('', 'Preferencia quitada en este navegador.');
    return;
  }

  button.disabled = true;
  setEventStatus('', 'Guardando prueba de interacción…');
  try {
    const data = await queueInteraction(activeStory.slug, type);
    const suffix = data.event_id ? ` · evento #${data.event_id}` : '';
    setEventStatus('ok', `Prueba registrada en staging${suffix}. No mostramos contadores sociales ficticios.`);
  } catch {
    setEventStatus('error', 'La preferencia se guardó en este navegador, pero la API no pudo registrar la prueba ahora mismo.');
  } finally {
    button.disabled = false;
  }
}

for (const button of interactionButtons) {
  button.addEventListener('click', () => applyInteraction(button.dataset.interaction, button));
}

function normalized(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function filteredStories() {
  const term = normalized(searchInput?.value);
  const category = categoryFilter?.value || '';
  return stories.filter((story) => {
    const matchesCategory = !category || story.category === category;
    const haystack = normalized(`${story.title} ${story.excerpt} ${story.context} ${story.category}`);
    const matchesTerm = !term || haystack.includes(term);
    return matchesCategory && matchesTerm;
  });
}

function storyCard(story) {
  const article = document.createElement('article');
  article.className = 'story-card';

  const top = document.createElement('div');
  top.className = 'story-card-top';

  const chipRow = document.createElement('div');
  chipRow.className = 'story-chip-row';
  const chip = document.createElement('span');
  chip.className = 'story-chip';
  chip.textContent = story.category;
  const phase = document.createElement('span');
  phase.className = 'story-phase';
  phase.textContent = story.phase;
  chipRow.append(chip, phase);

  const title = document.createElement('h2');
  title.textContent = story.title;
  const excerpt = document.createElement('p');
  excerpt.textContent = story.excerpt;
  top.append(chipRow, title, excerpt);

  const foot = document.createElement('div');
  foot.className = 'story-card-foot';
  const context = document.createElement('div');
  context.className = 'story-context';
  context.textContent = story.context;

  const actions = document.createElement('div');
  actions.className = 'story-card-actions';
  const read = document.createElement('button');
  read.className = 'story-read';
  read.type = 'button';
  read.textContent = 'Leer recorrido';
  read.addEventListener('click', () => openStory(story.slug));

  const save = document.createElement('button');
  save.className = 'story-save-quick';
  save.type = 'button';
  save.setAttribute('aria-label', 'Guardar esta historia en este navegador');
  save.setAttribute('aria-pressed', String(hasAction(story.slug, 'guardar')));
  save.textContent = hasAction(story.slug, 'guardar') ? '★' : '☆';
  save.addEventListener('click', async () => {
    const enabling = toggleLocalAction(story.slug, 'guardar');
    save.setAttribute('aria-pressed', String(enabling));
    save.textContent = enabling ? '★' : '☆';
    if (enabling) {
      try { await queueInteraction(story.slug, 'guardar'); } catch { /* local save remains useful */ }
    }
  });

  actions.append(read, save);
  foot.append(context, actions);
  article.append(top, foot);
  return article;
}

function renderStories() {
  if (!grid) return;
  const items = filteredStories();
  grid.replaceChildren();
  if (count) count.textContent = `${items.length} recorridos ficticios para probar la experiencia`;

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'story-empty';
    empty.innerHTML = '<strong>No encontramos una demostración con ese filtro.</strong><span>Prueba otra categoría o una búsqueda más amplia.</span>';
    grid.append(empty);
    return;
  }
  for (const story of items) grid.append(storyCard(story));
}

async function fetchStory(slug) {
  const response = await fetch(`${API_BASE}/api/stories/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'story_not_found');
  return data.story;
}

function renderDetail(story) {
  activeStory = story;
  detailChip.textContent = `${story.category} · ${story.phase}`;
  detailTitle.textContent = story.title;
  detailContext.textContent = story.context;
  detailCopy.replaceChildren();
  for (const paragraph of story.body || []) {
    const p = document.createElement('p');
    p.textContent = paragraph;
    detailCopy.append(p);
  }

  detailTimeline.replaceChildren();
  for (const item of story.timeline || []) {
    const row = document.createElement('div');
    row.className = 'timeline-item';
    const label = document.createElement('div');
    label.className = 'timeline-label';
    label.textContent = item.label;
    const text = document.createElement('div');
    text.className = 'timeline-text';
    text.textContent = item.text;
    row.append(label, text);
    detailTimeline.append(row);
  }

  for (const [target, values] of [[detailHelped, story.helped], [detailNext, story.nextSteps]]) {
    target.replaceChildren();
    for (const value of values || []) {
      const li = document.createElement('li');
      li.textContent = value;
      target.append(li);
    }
  }
  setEventStatus('', 'Las acciones son pruebas de staging y se guardan también en este navegador.');
  updateActionButtons();
}

async function openStory(slug, pushState = true) {
  try {
    setEventStatus('', 'Cargando recorrido…');
    const story = await fetchStory(slug);
    renderDetail(story);
    if (dialog && !dialog.open) dialog.showModal();
    if (pushState) history.pushState({ story: slug }, '', `?historia=${encodeURIComponent(slug)}`);
  } catch {
    setEventStatus('error', 'No hemos podido abrir esta demostración ahora mismo.');
  }
}

function closeStory({ updateUrl = true } = {}) {
  if (dialog?.open) dialog.close();
  activeStory = null;
  if (updateUrl) history.pushState({}, '', location.pathname);
}

closeDetail?.addEventListener('click', () => closeStory());
dialog?.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) closeStory();
});
dialog?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeStory();
});

searchInput?.addEventListener('input', renderStories);
categoryFilter?.addEventListener('change', renderStories);

window.addEventListener('popstate', () => {
  const slug = new URLSearchParams(location.search).get('historia');
  if (slug) openStory(slug, false);
  else closeStory({ updateUrl: false });
});

async function loadStories() {
  try {
    const response = await fetch(`${API_BASE}/api/stories`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.items)) throw new Error('stories_unavailable');
    stories = data.items;
    renderStories();
    const slug = new URLSearchParams(location.search).get('historia');
    if (slug) openStory(slug, false);
  } catch {
    if (grid) {
      grid.innerHTML = '<div class="story-empty"><strong>La API de staging está despertando.</strong><span>En el plan gratuito puede tardar unos segundos. Vuelve a cargar la página en un momento.</span></div>';
    }
    if (count) count.textContent = 'API temporalmente no disponible';
  }
}

loadStories();
