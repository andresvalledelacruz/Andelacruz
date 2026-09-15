(() => {
  'use strict';

  if (location.pathname !== '/soluciones/' && location.pathname !== '/soluciones/index.html') return;

  const SUPABASE_URL = 'https://enspficpubtttybpzhph.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_TraLgSrXG8Jpgq_pE6uZgw_SQ7S5UL7';
  const ALLOWED = new Set([
    'JOB_SEARCH','CV_SERVICE','INTERVIEW_COACHING','TRAINING',
    'SOCIAL_ACTIVITIES','MATCHMAKING','ENERGY_SWITCH','TELECOM_SWITCH','HOME_SERVICES'
  ]);

  const panel = document.getElementById('commercial-results');
  const status = document.getElementById('commercial-status');
  const buttons = [...document.querySelectorAll('[data-opportunity]')];
  if (!panel || !status || !buttons.length) return;

  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    'Content-Type': 'application/json'
  };

  function setStatus(text) {
    status.textContent = text;
  }

  async function rpc(name, body) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST', headers, credentials: 'omit', cache: 'no-store',
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`commercial_rpc_${response.status}`);
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  function recordEvent(offer, eventType) {
    rpc('record_commercial_event_v2', {
      p_path: location.pathname,
      p_opportunity_id: offer.opportunity_id,
      p_offer_id: offer.offer_id,
      p_event_type: eventType
    }).catch(() => {});
  }

  function safeDestination(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' ? parsed.href : null;
    } catch {
      return null;
    }
  }

  function renderOffer(offer) {
    const destination = safeDestination(offer.destination_url);
    if (!destination || !ALLOWED.has(offer.opportunity_id)) return null;

    const article = document.createElement('article');
    article.className = 'growth-card commercial-offer';
    article.dataset.offerId = offer.offer_id;

    const kicker = document.createElement('p');
    kicker.className = 'eyebrow';
    kicker.textContent = 'Colaborador verificado';

    const title = document.createElement('h3');
    title.textContent = offer.partner_name;

    const disclosure = document.createElement('p');
    disclosure.className = 'commercial-disclosure';
    disclosure.textContent = offer.disclosure || 'Podemos recibir una compensación si utilizas este servicio.';

    const meta = document.createElement('p');
    meta.className = 'small';
    meta.textContent = `Modelo: ${offer.compensation_model}. La posición no se compra: priorizamos verificación y calidad.`;

    const link = document.createElement('a');
    link.className = 'button primary';
    link.href = destination;
    link.target = '_blank';
    link.rel = 'sponsored noopener noreferrer';
    link.textContent = 'Ver esta opción';

    if (offer.requires_consent) {
      const label = document.createElement('label');
      label.className = 'commercial-ack';
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.addEventListener('change', () => { link.setAttribute('aria-disabled', check.checked ? 'false' : 'true'); link.tabIndex = check.checked ? 0 : -1; });
      const text = document.createElement('span');
      text.textContent = 'Entiendo que al abrir esta opción saldré de Desgracias.es y se aplicarán las condiciones y privacidad del proveedor.';
      label.append(check, text);
      link.setAttribute('aria-disabled', 'true');
      link.tabIndex = -1;
      link.addEventListener('click', event => { if (!check.checked) event.preventDefault(); });
      article.append(kicker, title, disclosure, meta, label, link);
    } else {
      article.append(kicker, title, disclosure, meta, link);
    }

    link.addEventListener('click', () => recordEvent(offer, 'clicked'));
    recordEvent(offer, 'shown');
    return article;
  }

  async function loadOpportunity(opportunityId) {
    if (!ALLOWED.has(opportunityId)) return;
    panel.replaceChildren();
    setStatus('Buscando opciones verificadas…');
    buttons.forEach(btn => btn.setAttribute('aria-pressed', btn.dataset.opportunity === opportunityId ? 'true' : 'false'));

    try {
      const offers = await rpc('get_runtime_partner_offers_v2', {
        p_opportunity_ids: [opportunityId],
        p_territory: 'ES',
        p_limit: 6
      });
      const cards = Array.isArray(offers) ? offers.map(renderOffer).filter(Boolean) : [];
      if (!cards.length) {
        setStatus('Ahora mismo no hay colaboradores verificados disponibles para esta opción. No mostramos sustitutos pagados ni empresas ficticias.');
        return;
      }
      cards.forEach(card => panel.append(card));
      setStatus(`${cards.length} opción${cards.length === 1 ? '' : 'es'} verificada${cards.length === 1 ? '' : 's'} disponible${cards.length === 1 ? '' : 's'}.`);
    } catch {
      setStatus('No hemos podido consultar las opciones verificadas. El resto de la página sigue disponible con normalidad.');
    }
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => loadOpportunity(button.dataset.opportunity));
  });
})();
