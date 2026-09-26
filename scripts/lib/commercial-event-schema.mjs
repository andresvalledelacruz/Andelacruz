const CLIENT_EVENTS = new Set(['commercial_offer_view', 'commercial_offer_click']);
const SERVER_EVENTS = new Set(['commercial_lead_confirmed', 'commercial_sale_confirmed', 'commercial_revenue_booked']);
const ALLOWED_MODELS = new Set(['education_partner', 'qualified_lead', 'display_ads', 'other_reviewed']);
const PROHIBITED_KEYS = /(?:query|search|story|message|email|phone|name|address|health|diagnos|suicid|violence|violencia|debt_text|free_text|referrer_url|user_id|session_id|cookie|fingerprint)/i;

function cleanText(value, max = 120) {
  const text = String(value ?? '').trim();
  if (!text || text.length > max || /[<>\r\n]/.test(text)) return null;
  return text;
}

function cleanRoute(value) {
  const route = String(value ?? '').trim();
  if (!/^\/[A-Za-z0-9_./-]*$/.test(route) || route.includes('..') || route.length > 240) return null;
  return route || '/';
}

function cleanCurrency(value) {
  const currency = String(value ?? '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : null;
}

function cleanCountry(value) {
  const country = String(value ?? '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : null;
}

function inspectKeys(value, path = '') {
  if (!value || typeof value !== 'object') return [];
  const errors = [];
  for (const [key, nested] of Object.entries(value)) {
    const current = path ? `${path}.${key}` : key;
    if (PROHIBITED_KEYS.test(key)) errors.push(`prohibited_field:${current}`);
    if (nested && typeof nested === 'object') errors.push(...inspectKeys(nested, current));
  }
  return errors;
}

export function sanitizeCommercialEvent(input = {}, { source = 'client', critical_routes = [] } = {}) {
  const errors = inspectKeys(input);
  const event = cleanText(input.event, 64);
  const allowedEvents = source === 'server' ? new Set([...CLIENT_EVENTS, ...SERVER_EVENTS]) : CLIENT_EVENTS;
  if (!event || !allowedEvents.has(event)) errors.push('event_not_allowed_for_source');

  const route = cleanRoute(input.route);
  if (!route) errors.push('route_invalid');
  const critical = new Set((Array.isArray(critical_routes) ? critical_routes : []).map(cleanRoute).filter(Boolean));
  if (route && critical.has(route)) errors.push('critical_route_forbidden');

  const surface_id = cleanText(input.surface_id, 100);
  const partner_id = cleanText(input.partner_id, 100);
  const commercial_model = cleanText(input.commercial_model, 40);
  if (!surface_id) errors.push('surface_id_required');
  if (!partner_id) errors.push('partner_id_required');
  if (!commercial_model || !ALLOWED_MODELS.has(commercial_model)) errors.push('commercial_model_invalid');

  const country_code = input.country_code == null ? null : cleanCountry(input.country_code);
  if (input.country_code != null && !country_code) errors.push('country_code_invalid');

  const payload = {
    event,
    route,
    surface_id,
    partner_id,
    commercial_model,
    country_code
  };

  if (SERVER_EVENTS.has(event)) {
    if (source !== 'server') errors.push('server_event_from_client_forbidden');
    if (event === 'commercial_revenue_booked' || event === 'commercial_sale_confirmed') {
      const amount = Number(input.value_minor_units);
      const currency = cleanCurrency(input.currency);
      if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1_000_000_000) errors.push('value_minor_units_invalid');
      if (!currency) errors.push('currency_invalid');
      payload.value_minor_units = Number.isSafeInteger(amount) ? amount : null;
      payload.currency = currency;
    }
  } else if ('value_minor_units' in input || 'currency' in input) {
    errors.push('client_revenue_fields_forbidden');
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze([...new Set(errors)].sort()),
    payload: errors.length === 0 ? Object.freeze(payload) : null
  });
}

export function commercialEventCapabilities() {
  return Object.freeze({
    version:1,
    client_events:Object.freeze([...CLIENT_EVENTS]),
    server_events:Object.freeze([...SERVER_EVENTS]),
    free_text_allowed:false,
    sensitive_query_allowed:false,
    story_content_allowed:false,
    client_revenue_allowed:false,
    critical_routes_allowed:false
  });
}
