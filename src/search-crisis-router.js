import { classifySuicideContext } from './suicide-context-classifier.js';

const ROUTES = Object.freeze({
  active_self_harm: Object.freeze({
    intent: 'active_self_harm',
    url: '/ayuda-urgente.html',
    label: 'Necesito ayuda urgente ahora',
    safety_level: 'P0',
    official_resources_spain: Object.freeze(['112', '024']),
    urgent: true
  }),
  concern_for_someone: Object.freeze({
    intent: 'concern_for_someone',
    url: '/me-preocupa-que-alguien-pueda-suicidarse/',
    label: 'Me preocupa que alguien pueda suicidarse',
    safety_level: 'P0',
    official_resources_spain: Object.freeze(['112', '024']),
    urgent: true
  }),
  suicide_bereavement: Object.freeze({
    intent: 'suicide_bereavement',
    url: '/duelo/ha-muerto-por-suicidio-alguien-que-quiero/',
    label: 'Ha muerto por suicidio alguien que quiero',
    safety_level: 'P1',
    official_resources_spain: Object.freeze([]),
    urgent: false
  }),
  intimate_partner_violence: Object.freeze({
    intent: 'intimate_partner_violence',
    url: '/mi-pareja-me-maltrata-y-no-se-que-hacer/',
    label: 'Mi pareja me maltrata y no sé qué hacer',
    safety_level: 'P1',
    official_resources_spain: Object.freeze(['016', '112']),
    urgent: false
  }),
  sexual_violence: Object.freeze({
    intent: 'sexual_violence',
    url: '/he-sufrido-una-agresion-sexual-y-no-se-que-hacer/',
    label: 'He sufrido una agresión sexual y no sé qué hacer',
    safety_level: 'P1',
    official_resources_spain: Object.freeze(['016', '112']),
    urgent: false
  }),
  debt_overwhelm: Object.freeze({
    intent: 'debt_overwhelm',
    url: '/dinero/tengo-deudas-y-no-se-por-donde-empezar/',
    label: 'Tengo deudas y no sé por dónde empezar',
    safety_level: 'P2',
    official_resources_spain: Object.freeze([]),
    urgent: false
  }),
  job_loss: Object.freeze({
    intent: 'job_loss',
    url: '/trabajo/me-han-despedido-y-no-se-que-hacer/',
    label: 'Me han despedido y no sé qué hacer',
    safety_level: 'P2',
    official_resources_spain: Object.freeze([]),
    urgent: false
  }),
  urgent_job_search: Object.freeze({
    intent: 'urgent_job_search',
    url: '/trabajo/quiero-encontrar-trabajo-cuanto-antes/',
    label: 'Quiero encontrar trabajo cuanto antes',
    safety_level: 'P3',
    official_resources_spain: Object.freeze([]),
    urgent: false
  }),
  loneliness: Object.freeze({
    intent: 'loneliness',
    url: '/soledad/no-tengo-con-quien-hablar/',
    label: 'No tengo con quién hablar',
    safety_level: 'P2',
    official_resources_spain: Object.freeze([]),
    urgent: false
  })
});

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(a, b) {
  const left = String(a);
  const right = String(b);
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const saved = row[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + cost);
      previous = saved;
    }
  }
  return row[right.length];
}

function containsAny(text, phrases) {
  return phrases.some((phrase) => text.includes(normalize(phrase)));
}

function hasApproximateToken(text, target, maxDistance = 1) {
  const normalizedTarget = normalize(target);
  return text.split(' ').some((token) => {
    if (token.length < 5 || Math.abs(token.length - normalizedTarget.length) > maxDistance) return false;
    return editDistance(token, normalizedTarget) <= maxDistance;
  });
}

function hasSuicideLanguage(text) {
  return text.split(' ').some((token) => token.startsWith('suicid')) ||
    hasApproximateToken(text, 'suicidio') ||
    containsAny(text, ['quitarme la vida', 'quitarse la vida', 'acabar con mi vida', 'no quiero vivir']);
}

function withoutNegatedDeathWish(text) {
  return text
    .replace(/\b(?:ya\s+)?no\s+(?:me\s+)?quiero\s+morir\b/g, ' ')
    .replace(/\b(?:ya\s+)?no\s+quiero\s+hacerme\s+dano\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function activeSelfHarmFallback(text) {
  const activeText = withoutNegatedDeathWish(text);
  return containsAny(activeText, [
    'quiero morir', 'me quiero morir', 'me voy a matar', 'hacerme daño', 'hacerme dano',
    'no quiero vivir', 'no puedo seguir viviendo'
  ]);
}

function concernForSomeoneFallback(text) {
  const otherPerson = containsAny(text, [
    'mi hijo', 'mi hija', 'mi hermano', 'mi hermana', 'mi padre', 'mi madre',
    'mi marido', 'mi mujer', 'mi pareja', 'mi amigo', 'mi amiga', 'alguien', 'una persona'
  ]);
  const concern = containsAny(text, [
    'quiere morir', 'no quiere vivir', 'se quiere suicidar', 'se va a matar',
    'dice que se va a matar', 'dice que quiere morir'
  ]);
  return otherPerson && concern;
}

function suicideBereavementFallback(text) {
  const deathContext = containsAny(text, [
    'murio', 'ha muerto', 'fallecio', 'perdi a', 'he perdido a', 'se quito la vida', 'se suicido'
  ]);
  return deathContext && hasSuicideLanguage(text);
}

function matchSuicideIntent(text) {
  const context = classifySuicideContext(text);

  if (context.context === 'active_self') {
    return { route: ROUTES.active_self_harm, confidence: 'high' };
  }
  if (context.context === 'active_third_party') {
    return { route: ROUTES.concern_for_someone, confidence: 'high' };
  }
  if (context.context === 'bereavement') {
    return { route: ROUTES.suicide_bereavement, confidence: 'high' };
  }

  // Once the certified classifier recognises suicide language as negated,
  // historical, informational or ambiguous, do not reinterpret that same
  // wording with looser search heuristics.
  if (context.context !== 'none') return null;

  // Conservative fallbacks cover important everyday wording and limited typo
  // tolerance that sit outside the classifier's explicit suicide vocabulary.
  if (activeSelfHarmFallback(text)) return { route: ROUTES.active_self_harm, confidence: 'high' };
  if (concernForSomeoneFallback(text)) return { route: ROUTES.concern_for_someone, confidence: 'high' };
  if (suicideBereavementFallback(text)) return { route: ROUTES.suicide_bereavement, confidence: 'high' };

  return null;
}

function matchIntent(text) {
  const suicideMatch = matchSuicideIntent(text);
  if (suicideMatch) return suicideMatch;

  if (containsAny(text, ['agresion sexual', 'violacion', 'abuso sexual', 'me han violado', 'me violo'])) {
    return { route: ROUTES.sexual_violence, confidence: 'high' };
  }
  if (containsAny(text, ['mi pareja me pega', 'mi pareja me maltrata', 'mi marido me pega', 'mi mujer me pega', 'me controla mi pareja', 'tengo miedo de mi pareja'])) {
    return { route: ROUTES.intimate_partner_violence, confidence: 'high' };
  }
  if (containsAny(text, ['tengo deudas', 'muchas deudas', 'no se por donde empezar con mis deudas', 'no puedo pagar mis deudas'])) {
    return { route: ROUTES.debt_overwhelm, confidence: 'high' };
  }
  if (containsAny(text, ['me han despedido', 'me despidieron', 'he perdido mi trabajo', 'me quede sin trabajo'])) {
    return { route: ROUTES.job_loss, confidence: 'high' };
  }
  if (containsAny(text, ['quiero encontrar trabajo', 'necesito encontrar trabajo', 'busco trabajo urgente', 'necesito empleo'])) {
    return { route: ROUTES.urgent_job_search, confidence: 'medium' };
  }
  if (containsAny(text, ['no tengo con quien hablar', 'no tengo a nadie', 'me siento muy solo', 'me siento muy sola'])) {
    return { route: ROUTES.loneliness, confidence: 'medium' };
  }
  return null;
}

export function routeSearchQuery(query = '') {
  const text = normalize(query);
  if (!text) {
    return Object.freeze({
      version: 1,
      matched: false,
      needs_clarification: true,
      route: null,
      safety_level: 'NONE',
      suppress_commercial_ui: false,
      raw_query_retained: false
    });
  }

  const match = matchIntent(text);
  if (!match) {
    return Object.freeze({
      version: 1,
      matched: false,
      needs_clarification: true,
      route: null,
      safety_level: 'NONE',
      suppress_commercial_ui: false,
      raw_query_retained: false
    });
  }

  const safetyCritical = match.route.safety_level === 'P0' || match.route.safety_level === 'P1';
  return Object.freeze({
    version: 1,
    matched: true,
    needs_clarification: false,
    intent: match.route.intent,
    confidence: match.confidence,
    route: Object.freeze({ url: match.route.url, label: match.route.label }),
    safety_level: match.route.safety_level,
    urgent: match.route.urgent,
    official_resources_spain: match.route.official_resources_spain,
    suppress_commercial_ui: safetyCritical,
    raw_query_retained: false,
    diagnostic: false,
    automated_clinical_decision: false
  });
}

export function searchRoutingCapabilities() {
  return Object.freeze({
    version: 1,
    natural_language: true,
    accent_insensitive: true,
    limited_typo_tolerance: true,
    safety_first: true,
    retains_raw_query: false,
    public_ui_integrated: false
  });
}

export function searchRouteCatalog() {
  return Object.freeze(Object.values(ROUTES).map((route) => Object.freeze({
    intent: route.intent,
    url: route.url,
    label: route.label,
    safety_level: route.safety_level,
    urgent: route.urgent
  })));
}
