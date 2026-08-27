const SUPABASE_URL = 'https://enspficpubtttybpzhph.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_TraLgSrXG8Jpgq_pE6uZgw_SQ7S5UL7';

const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');

navToggle?.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});

document.querySelectorAll('.main-nav a').forEach(a => {
  a.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

const modal = document.getElementById('story-modal');
document.querySelectorAll('[data-open-story]').forEach(btn => {
  btn.addEventListener('click', () => modal?.showModal());
});

modal?.querySelectorAll('.close, .modal-actions .btn-ghost').forEach(btn => {
  btn.addEventListener('click', event => {
    event.preventDefault();
    modal.close();
  });
});

modal?.addEventListener('click', event => {
  if (event.target === modal) modal.close();
});

const POLICY_VERSION = '2026-08-27-v2';

function installStorySafetyLayer() {
  const form = document.getElementById('story-form');
  const actions = form?.querySelector('.modal-actions');
  if (!form || !actions || form.querySelector('#story-safety-layer')) return;

  const legacyPrivacyCheck = [...form.querySelectorAll('label.check')].find(label => !label.querySelector('[name]'));
  if (legacyPrivacyCheck) {
    legacyPrivacyCheck.className = 'personal-data-guidance';
    legacyPrivacyCheck.innerHTML = '<span>Evita incluir siempre datos personales.</span>';
  }

  actions.insertAdjacentHTML('beforebegin', `
    <div class="story-safety-layer" id="story-safety-layer">
      <fieldset class="safety-fieldset safety-compact">
        <legend>Seguridad: ¿Existe alguna persona en peligro inmediato?</legend>
        <div class="safety-options safety-inline">
          <label><input type="radio" name="safetyLevel" value="normal" required> No</label>
          <label><input type="radio" name="safetyLevel" value="elevated" required> No estoy seguro/a</label>
          <label><input type="radio" name="safetyLevel" value="urgent" required> Sí, ahora mismo</label>
        </div>
      </fieldset>

      <div class="safety-help safety-help-compact" id="emergency-help" hidden>
        <strong>Si hay peligro inmediato, no esperes nuestra revisión.</strong>
        <p>Llama al <a href="tel:112"><strong>112</strong></a>. Si se trata de una crisis relacionada con conducta suicida, también puedes llamar al <a href="tel:024"><strong>024</strong></a> o al <strong>Teléfono de la Esperanza</strong>, <a href="tel:717003717"><strong>717 003 717</strong></a>.</p>
      </div>

      <div class="story-confirmations">
        <label class="check">
          <input type="checkbox" name="ageGate" value="adult" required>
          <span>Tengo 18 años o más.</span>
        </label>

        <label class="check">
          <input type="checkbox" name="privacyConsent" required>
          <span>Consiento que Desgracias.es reciba y modere mi historia.</span>
        </label>
      </div>

      <details class="minor-help-compact">
        <summary>Si eres menor de 18 años</summary>
        <p>Este espacio todavía no admite historias de menores. Puedes contactar con ANAR en el <a href="tel:900202010">900 20 20 10</a>. Si existe peligro inmediato, llama al <a href="tel:112">112</a>.</p>
      </details>
    </div>
  `);

  const emergencyHelp = form.querySelector('#emergency-help');

  const updateSafetyUi = () => {
    const safety = form.querySelector('input[name="safetyLevel"]:checked')?.value || '';
    if (emergencyHelp) emergencyHelp.hidden = !['elevated', 'urgent'].includes(safety);
  };

  form.querySelectorAll('input[name="safetyLevel"]').forEach(input => {
    input.addEventListener('change', updateSafetyUi);
  });

  form.addEventListener('reset', () => setTimeout(updateSafetyUi, 0));
  updateSafetyUi();
}

installStorySafetyLayer();

const CATEGORY_MAP = {
  'Pareja / ruptura': 'pareja-rupturas',
  'Familia': 'familia',
  'Trabajo': 'trabajo',
  'Dinero': 'dinero',
  'Pérdida / duelo': 'duelo-perdidas',
  'Soledad / bloqueo': 'soledad',
  'Otro': 'otras-historias'
};

const PUBLIC_CATEGORY_LABELS = {
  'pareja-rupturas': 'Pareja',
  'familia': 'Familia',
  'trabajo': 'Trabajo',
  'dinero': 'Dinero',
  'duelo-perdidas': 'Pérdida / duelo',
  'soledad': 'Soledad',
  'otras-historias': 'Otra historia'
};

const FILTER_CATEGORY_MAP = {
  'pareja-rupturas': 'pareja',
  'familia': 'familia',
  'trabajo': 'trabajo'
};

let supabaseClientPromise;
async function getSupabaseClient() {
  if (!supabaseClientPromise) {
    supabaseClientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }));
  }
  return supabaseClientPromise;
}

async function ensureAnonymousSession(client) {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session) return sessionData.session;

  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

function makeInternalTitle(body) {
  const clean = body.replace(/\s+/g, ' ').trim();
  const firstSentence = clean.split(/(?<=[.!?])\s+/)[0] || clean;
  let title = firstSentence.trim();
  if (title.length < 5) title = clean;
  if (title.length < 5) title = 'Historia compartida';
  if (title.length > 120) title = `${title.slice(0, 117).trimEnd()}...`;
  return title;
}

async function extractFunctionErrorCode(error) {
  const context = error?.context;
  if (context && typeof context.clone === 'function') {
    try {
      const payload = await context.clone().json();
      if (payload?.error) return String(payload.error).toLowerCase();
    } catch {
      // La respuesta puede no ser JSON; se usa el mensaje genérico.
    }
  }
  return String(error?.message || '').toLowerCase();
}

async function friendlySubmissionError(error) {
  const code = await extractFunctionErrorCode(error);
  if (code.includes('rate_limit')) return 'Has enviado varias historias seguidas. Espera un poco antes de volver a intentarlo.';
  if (code.includes('adult_confirmation')) return 'Actualmente solo podemos recibir historias de personas de 18 años o más.';
  if (code.includes('privacy_consent')) return 'Necesitamos tu consentimiento para recibir y moderar la historia.';
  if (code.includes('invalid_story')) return 'Revisa la categoría y cuéntanos un poco más para poder valorar bien tu historia.';
  if (code.includes('invalid_session') || code.includes('authentication')) return 'La sesión anónima ha caducado. Recarga la página e inténtalo de nuevo.';
  if (code.includes('origin_not_allowed')) return 'No hemos podido validar el origen de la solicitud. Recarga la página e inténtalo de nuevo.';
  return 'No hemos podido enviar la historia ahora mismo. Inténtalo de nuevo dentro de unos instantes.';
}

function truncateText(text, maxLength = 190) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

function formatPublishedDate(value) {
  if (!value) return 'Publicada recientemente';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Publicada recientemente';
  return `Publicada ${new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)}`;
}

function createStoryCard(story, index) {
  const article = document.createElement('article');
  article.className = 'story-card';
  article.dataset.category = FILTER_CATEGORY_MAP[story.category_slug] || story.category_slug || 'otras-historias';
  article.dataset.storyId = story.id;

  const visual = document.createElement('div');
  visual.className = `story-visual story-${['one', 'two', 'three'][index % 3]}`;

  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = PUBLIC_CATEGORY_LABELS[story.category_slug] || 'Historia';

  const title = document.createElement('h3');
  title.textContent = story.title || 'Historia compartida';

  const body = document.createElement('p');
  body.textContent = truncateText(story.body);

  visual.append(tag, title, body);

  const meta = document.createElement('div');
  meta.className = 'story-meta';

  const published = document.createElement('span');
  published.textContent = formatPublishedDate(story.published_at);

  const identity = document.createElement('span');
  identity.textContent = story.public_alias ? `Por ${story.public_alias}` : 'Anónimo';

  meta.append(published, identity);
  article.append(visual, meta);
  return article;
}

function createStoryStateCard(titleText, bodyText) {
  const article = document.createElement('article');
  article.className = 'story-card';
  article.style.gridColumn = '1 / -1';

  const visual = document.createElement('div');
  visual.className = 'story-visual story-one';

  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = 'Comunidad';

  const title = document.createElement('h3');
  title.textContent = titleText;

  const body = document.createElement('p');
  body.textContent = bodyText;

  visual.append(tag, title, body);
  article.append(visual);
  return article;
}

async function loadPublicStories() {
  const storyGrid = document.querySelector('.story-grid');
  if (!storyGrid) return;

  storyGrid.replaceChildren(createStoryStateCard(
    'Cargando historias…',
    'Estamos preparando las experiencias aprobadas para mostrarlas con cuidado.'
  ));

  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.rpc('list_public_stories', {
      p_limit: 12,
      p_offset: 0,
      p_category_slug: null
    });
    if (error) throw error;

    storyGrid.replaceChildren();
    if (!data?.length) {
      storyGrid.append(createStoryStateCard(
        'Aún no hay historias publicadas.',
        'Las primeras experiencias aparecerán aquí únicamente después de haber sido revisadas y aprobadas.'
      ));
      return;
    }

    data.forEach((story, index) => storyGrid.append(createStoryCard(story, index)));

    const activeFilter = document.querySelector('.filter.active')?.dataset.filter || 'all';
    applyStoryFilter(activeFilter);
  } catch (error) {
    console.error('Public stories loading failed', error);
    storyGrid.replaceChildren(createStoryStateCard(
      'No hemos podido cargar las historias ahora mismo.',
      'Puedes seguir usando el resto del espacio e intentarlo de nuevo dentro de unos instantes.'
    ));
  }
}

function applyStoryFilter(category) {
  document.querySelectorAll('.story-grid .story-card[data-category]').forEach(card => {
    card.hidden = category !== 'all' && card.dataset.category !== category;
  });
}

const storyForm = document.getElementById('story-form');
storyForm?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!storyForm.reportValidity()) return;

  const status = document.getElementById('story-status');
  const submitButton = storyForm.querySelector('button[type="submit"]');
  const formData = new FormData(storyForm);
  const categoryLabel = String(formData.get('category') || '').trim();
  const body = String(formData.get('story') || '').trim();
  const categorySlug = CATEGORY_MAP[categoryLabel];
  const adultConfirmed = formData.get('ageGate') === 'adult';
  const safetyLevel = String(formData.get('safetyLevel') || 'normal');
  const privacyConsent = formData.get('privacyConsent') === 'on';

  if (!adultConfirmed) {
    if (status) status.textContent = 'Actualmente solo podemos recibir historias de personas de 18 años o más.';
    return;
  }
  if (!categorySlug) {
    if (status) status.textContent = 'Selecciona una categoría válida.';
    return;
  }
  if (body.length < 20) {
    if (status) status.textContent = 'Cuéntanos un poco más para poder revisar bien tu historia.';
    return;
  }
  if (!privacyConsent) {
    if (status) status.textContent = 'Necesitamos tu consentimiento para recibir y moderar la historia.';
    return;
  }

  const originalButtonText = submitButton?.textContent || 'Enviar historia';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando…';
  }
  if (status) status.textContent = safetyLevel === 'normal'
    ? 'Enviando tu historia de forma anónima…'
    : 'Enviando tu historia y marcándola para revisión prioritaria…';

  try {
    const client = await getSupabaseClient();
    await ensureAnonymousSession(client);

    const { data, error } = await client.functions.invoke('submit-story', {
      body: {
        categorySlug,
        title: makeInternalTitle(body),
        body,
        identityMode: 'anonymous',
        publicAlias: null,
        allowReplies: true,
        allowFollow: true,
        allowUpdates: true,
        adultConfirmed,
        privacyConsent,
        safetyLevel,
        policyVersion: POLICY_VERSION
      }
    });

    if (error) throw error;
    if (!data?.id) throw new Error('submission_failed');

    const shortId = ` · #${String(data.id).slice(0, 8)}`;
    if (status) {
      status.textContent = safetyLevel === 'normal'
        ? `Historia recibida${shortId}. Queda pendiente de revisión antes de publicarse.`
        : `Historia recibida${shortId}. Se ha marcado para revisión prioritaria. Si existe peligro inmediato, no esperes nuestra revisión: llama al 112.`;
    }
    storyForm.reset();
    setTimeout(() => modal?.close(), safetyLevel === 'normal' ? 3000 : 6500);
  } catch (error) {
    console.error('Story submission failed', error);
    if (status) status.textContent = await friendlySubmissionError(error);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});

const filters = document.querySelectorAll('.filter');
filters.forEach(btn => {
  btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyStoryFilter(btn.dataset.filter || 'all');
  });
});

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    }
  });
}, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

sections.forEach(section => observer.observe(section));
loadPublicStories();