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

const CATEGORY_MAP = {
  'Pareja / ruptura': 'pareja-rupturas',
  'Familia': 'familia',
  'Trabajo': 'trabajo',
  'Dinero': 'dinero',
  'Pérdida / duelo': 'duelo-perdidas',
  'Soledad / bloqueo': 'soledad',
  'Otro': 'otras-historias'
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

function friendlySubmissionError(error) {
  const text = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  if (text.includes('rate limit')) return 'Has enviado varias historias seguidas. Espera un poco antes de volver a intentarlo.';
  if (text.includes('category')) return 'Selecciona una categoría válida.';
  if (text.includes('body') || text.includes('20')) return 'Cuéntanos un poco más para poder revisar bien tu historia.';
  return 'No hemos podido enviar la historia ahora mismo. Inténtalo de nuevo dentro de unos instantes.';
}

const storyForm = document.getElementById('story-form');
storyForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!storyForm.reportValidity()) return;

  const status = document.getElementById('story-status');
  const submitButton = storyForm.querySelector('button[type="submit"]');
  const formData = new FormData(storyForm);
  const categoryLabel = String(formData.get('category') || '').trim();
  const body = String(formData.get('story') || '').trim();
  const categorySlug = CATEGORY_MAP[categoryLabel];

  if (!categorySlug) {
    if (status) status.textContent = 'Selecciona una categoría válida.';
    return;
  }
  if (body.length < 20) {
    if (status) status.textContent = 'Cuéntanos un poco más para poder revisar bien tu historia.';
    return;
  }

  const originalButtonText = submitButton?.textContent || 'Enviar historia';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando…';
  }
  if (status) status.textContent = 'Enviando tu historia de forma anónima…';

  try {
    const client = await getSupabaseClient();
    await ensureAnonymousSession(client);

    const { data: storyId, error } = await client.rpc('submit_story', {
      p_category_slug: categorySlug,
      p_title: makeInternalTitle(body),
      p_body: body,
      p_identity_mode: 'anonymous',
      p_public_alias: null,
      p_allow_replies: true,
      p_allow_follow: true,
      p_allow_updates: true
    });

    if (error) throw error;

    const shortId = storyId ? ` · #${String(storyId).slice(0, 8)}` : '';
    if (status) status.textContent = `Historia recibida${shortId}. Queda pendiente de revisión antes de publicarse.`;
    storyForm.reset();
    setTimeout(() => modal?.close(), 3000);
  } catch (error) {
    console.error('Story submission failed', error);
    if (status) status.textContent = friendlySubmissionError(error);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});

const contactForm = document.getElementById('contact-form');
contactForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(contactForm);
  const name = (formData.get('name') || '').toString().trim();
  const email = (formData.get('email') || '').toString().trim();
  const reason = (formData.get('reason') || '').toString().trim();
  const message = (formData.get('message') || '').toString().trim();
  const status = contactForm.querySelector('.form-status');
  const subject = `Contacto Desgracias.es — ${reason || 'Consulta'}`;
  const body = [
    `Nombre o alias: ${name || 'No indicado'}`,
    `Correo de respuesta: ${email}`,
    `Motivo: ${reason || 'No indicado'}`,
    '',
    'Mensaje:',
    message
  ].join('\n');
  const mailto = `mailto:info@desgracias.es?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if (status) status.textContent = 'Abriendo tu aplicación de correo…';
  window.location.href = mailto;
});

document.querySelectorAll('[data-copy-email]').forEach(copyEmailButton => {
  copyEmailButton.addEventListener('click', async () => {
    const email = 'info@desgracias.es';
    try {
      await navigator.clipboard.writeText(email);
      const original = copyEmailButton.textContent;
      copyEmailButton.textContent = 'Email copiado';
      setTimeout(() => copyEmailButton.textContent = original, 1800);
    } catch {
      window.prompt('Copia este correo:', email);
    }
  });
});

const filters = document.querySelectorAll('.filter');
const stories = document.querySelectorAll('.story-card');

filters.forEach(btn => {
  btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const category = btn.dataset.filter;
    stories.forEach(card => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
    });
  });
});

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.main-nav a')];

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    }
  });
}, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

sections.forEach(section => observer.observe(section));
