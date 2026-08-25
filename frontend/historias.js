const API_BASE = 'https://desgracias-api-staging.onrender.com';
const MODERATED_BASE = 'https://desgracias-ops-staging.onrender.com';
const STORAGE_KEY = 'desgracias_staging_story_actions_v1';
const CLIENT_KEY = 'desgracias_staging_community_client_v1';
const PRIVATE_ACTIONS = new Set(['seguir', 'guardar']);
const COMMUNITY_ACTIONS = new Set(['tambien_me_paso', 'te_acompano', 'esto_me_ayudo']);

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
    // The UI still works without localStorage.
  }
}

function getCommunityClientId() {
  try {
    const existing = localStorage.getItem(CLIENT_KEY);
    if (existing && /^[A-Za-z0-9-]{16,80}$/.test(existing)) return existing;
    const generated = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `browser-${Date.now()}-${Math.random().toString(36).slice(2, 18)}`;
    localStorage.setItem(CLIENT_KEY, generated);
    return generated;
  } catch {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 18)}`;
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

function updateNobodyState(slug, attention) {
  if (typeof attention !== 'boolean') return;
  const summary = stories.find((item) => item.slug === slug);
  if (summary) {
    summary.nadie_solo_attention = attention;
    summary.community_supported = !attention;
  }
  if (activeStory?.slug === slug) {
    activeStory.nadie_solo_attention = attention;
    activeStory.community_supported = !attention;
  }
}

async function queueInteraction(slug, type, active = true) {
  if (PRIVATE_ACTIONS.has(type)) {
    return { local_only: true, private_action: true, active };
  }

  if (activeStory?.source === 'moderated_staging' && COMMUNITY_ACTIONS.has(type)) {
    const response = await fetch(`${MODERATED_BASE}/public/stories/${encodeURIComponent(slug)}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        active,
        synthetic: true,
        client_id: getCommunityClientId()
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'interaction_failed');
    return { ...data, moderated: true };
  }

  if (!active) return { local_only: true, active: false };

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
  const slug = activeStory.slug;
  const enabling = toggleLocalAction(slug, type);
  updateActionButtons();

  button.disabled = true;
  setEventStatus('', enabling ? 'Registrando tu señal…' : 'Quitando esta señal…');

  try {
    const data = await queueInteraction(slug, type, enabling);
    updateNobodyState(slug, data.nadie_solo_attention);
    renderStories();

    if (data.private_action) {
      setEventStatus('ok', enabling
        ? 'Guardado de forma privada en este navegador. No entra en métricas ni en Nadie Solo.'
        : 'Preferencia privada quitada de este navegador.');
    } else if (data.moderated) {
      if (enabling) {
        setEventStatus('ok', data.nadie_solo_attention
          ? 'Señal registrada. Nadie Solo mantiene esta historia visible hasta que reciba una primera señal de acompañamiento.'
          : 'Señal registrada. La historia ya ha recibido acompañamiento y deja de necesitar prioridad de Nadie Solo.');
      } else {
        setEventStatus('ok', data.nadie_solo_attention
          ? 'Señal retirada. Nadie Solo vuelve a dar visibilidad temporal a esta historia.'
          : 'Señal retirada correctamente.');
      }
    } else if (data.local_only) {
      setEventStatus('', enabling
        ? 'Preferencia guardada en este navegador.'
        : 'Preferencia quitada en este navegador.');
    } else {
      const suffix = data.event_id ? ` · evento #${data.event_id}` : '';
      setEventStatus('ok', `Prueba registrada en staging${suffix}. No mostramos contadores sociales ficticios.`);
    }
  } catch {
    toggleLocalAction(slug, type);
    updateActionButtons();
    setEventStatus('error', 'No hemos podido registrar esta señal ahora mismo. No se ha cambiado tu estado local.');
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
    return matchesCategory && (!term || haystack.includes(term));
  });
}

function storyCard(story) {
  const article = document.createElement('article');
  article.className = 'story-card';
  if (story.nadie_solo_attention) article.classList.add('story-card--nadie-solo');

  const top = document.createElement('div');
  top.className = 'story-card-top';

  const chipRow = document.createElement('div');
  chipRow.className = 'story-chip-row';
  const chip = document.createElement('span');
  chip.className = 'story-chip';
  chip.textContent = story.category;
  const phase = document.createElement('span');
  phase.className = 'story-phase';
  phase.textContent = story.phase || 'Historia';
  chipRow.append(chip, phase);

  top.append(chipRow);

  if (story.nadie_solo_attention) {
    const nobody = document.createElement('div');
    nobody.className = 'story-nadie-solo-chip';
    nobody.innerHTML = '<span aria-hidden="true">●</span> Nadie Solo · esperando una primera señal';
    top.append(nobody);
  }

  const title = document.createElement('h2');
  title.textContent = story.title;
  const excerpt = document.createElement('p');
  excerpt.textContent = story.excerpt;
  top.append(title, excerpt);

  const foot = document.createElement('div');
  foot.className = 'story-card-foot';
  const context = document.createElement('div');
  context.className = 'story-context';
  context.textContent = story.context || '';

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
  if (count) {
    const moderated = items.filter((item) => item.source === 'moderated_staging').length;
    const nobodyActive = items.some((item) => item.nadie_solo_attention === true);
    count.textContent = moderated
      ? `${items.length} recorridos ficticios · ${moderated} aprobado${moderated === 1 ? '' : 's'} por moderación humana${nobodyActive ? ' · Nadie Solo activo' : ''}`
      : `${items.length} recorridos ficticios para probar la experiencia`;
  }

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
  const summary = stories.find((item) => item.slug === slug);
  const isModerated = summary?.source === 'moderated_staging';
  const url = isModerated
    ? `${MODERATED_BASE}/public/stories/${encodeURIComponent(slug)}`
    : `${API_BASE}/api/stories/${encodeURIComponent(slug)}`;
  const response = await fetch(url, { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.story) throw new Error(data.error || 'story_not_found');
  return data.story;
}

function renderDetail(story) {
  activeStory = story;
  detailChip.textContent = `${story.category} · ${story.phase || 'Historia'}`;
  detailTitle.textContent = story.title;
  detailContext.textContent = story.context || '';

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

  if (story.source === 'moderated_staging' && story.nadie_solo_attention) {
    setEventStatus('nadie-solo', 'Nadie Solo: esta historia todavía espera una primera señal comunitaria. Le damos visibilidad sin convertir el apoyo en una competición.');
  } else if (story.source === 'moderated_staging') {
    setEventStatus('ok', 'Historia ficticia aprobada mediante el circuito real de moderación y con una señal comunitaria registrada en staging.');
  } else {
    setEventStatus('', 'Las acciones son pruebas de staging. Guardar y seguir permanecen privados en este navegador.');
  }
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

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'request_failed');
  return data;
}

async function loadStories() {
  try {
    const [demoResult, moderatedResult] = await Promise.allSettled([
      fetchJson(`${API_BASE}/api/stories`),
      fetchJson(`${MODERATED_BASE}/public/stories`)
    ]);

    const demoItems = demoResult.status === 'fulfilled' && Array.isArray(demoResult.value.items)
      ? demoResult.value.items
      : [];
    const moderatedItems = moderatedResult.status === 'fulfilled' && Array.isArray(moderatedResult.value.items)
      ? moderatedResult.value.items
      : [];

    const bySlug = new Map();
    for (const item of [...moderatedItems, ...demoItems]) {
      if (item?.slug && !bySlug.has(item.slug)) bySlug.set(item.slug, item);
    }
    stories = [...bySlug.values()];

    if (!stories.length) throw new Error('stories_unavailable');
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
