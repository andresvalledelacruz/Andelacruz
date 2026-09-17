(function () {
  'use strict';

  const ALLOWED_HOSTS = new Set(['desgracias.es', 'www.desgracias.es']);
  const SUPABASE_URL = 'https://enspficpubtttybpzhph.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_TraLgSrXG8Jpgq_pE6uZgw_SQ7S5UL7';
  const SENSITIVE_PREFIXES = Object.freeze([
    '/buscar/',
    '/ayuda-urgente.html',
    '/suicidio/',
    '/me-preocupa-que-alguien-pueda-suicidarse/',
    '/alguien-cercano-ha-intentado-suicidarse/',
    '/duelo/ha-muerto-por-suicidio-alguien-que-quiero/',
    '/mi-pareja-me-maltrata-y-no-se-que-hacer/',
    '/he-sufrido-una-agresion-sexual-y-no-se-que-hacer/'
  ]);

  if (!ALLOWED_HOSTS.has(window.location.hostname)) return;

  function safePath() {
    const path = window.location.pathname || '/';
    return /^\/[A-Za-z0-9_./-]*$/.test(path) && path.length <= 240 ? path : '/unknown';
  }

  function isSensitivePath(path) {
    return SENSITIVE_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
  }

  function referrerHost() {
    if (!document.referrer) return 'direct';
    try {
      const host = new URL(document.referrer).hostname.toLowerCase();
      if (!host || host.length > 120 || !/^[a-z0-9.-]+$/.test(host)) return 'unknown';
      if (ALLOWED_HOSTS.has(host)) return 'internal';
      return host;
    } catch {
      return 'unknown';
    }
  }

  function inferredCountryCode() {
    const locale = String(navigator.language || '');
    const match = locale.match(/[-_]([A-Za-z]{2})(?:$|[-_])/);
    return match ? match[1].toUpperCase() : 'unknown';
  }

  function deviceClass() {
    if (window.matchMedia('(max-width: 767px)').matches) return 'mobile';
    if (window.matchMedia('(max-width: 1024px)').matches) return 'tablet';
    return 'desktop';
  }

  function postRpc(name, payload) {
    return fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_PUBLISHABLE_KEY
      },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  const path = safePath();
  const device = deviceClass();

  if (!isSensitivePath(path)) {
    postRpc('record_privacy_safe_pageview', {
      p_path: path,
      p_referrer_host: referrerHost(),
      p_country_code: inferredCountryCode(),
      p_device_class: device
    });
  }

  function safeTargetKey(value) {
    const key = String(value || '').toLowerCase().slice(0, 96);
    return /^[a-z0-9_.:/-]+$/.test(key) ? key : '';
  }

  function internalLinkKey(anchor) {
    const href = anchor?.getAttribute('href') || '';
    if (!href) return '';
    if (href.startsWith('#')) return safeTargetKey(`link:${href.slice(1) || 'top'}`);
    try {
      const url = new URL(href, window.location.origin);
      if (!ALLOWED_HOSTS.has(url.hostname)) return '';
      return safeTargetKey(`link:${url.pathname || '/'}`);
    } catch {
      return '';
    }
  }

  function targetKey(element) {
    if (!element) return '';
    if (element.dataset.analyticsKey) return safeTargetKey(element.dataset.analyticsKey);
    if (element.dataset.urgentEntry) return safeTargetKey(`urgent:${element.dataset.urgentEntry}`);
    if (element.dataset.searchEntry) return safeTargetKey(`search:${element.dataset.searchEntry}`);
    if (element.hasAttribute('data-open-story')) return 'story:open';
    if (element.matches('a')) return internalLinkKey(element);
    if (element.id) return safeTargetKey(`button:${element.id}`);
    return '';
  }

  function recordInteraction(eventType, key) {
    if (isSensitivePath(path)) return;
    const safeKey = safeTargetKey(key);
    if (!safeKey) return;
    postRpc('record_privacy_safe_interaction', {
      p_path: path,
      p_event_type: eventType,
      p_target_key: safeKey,
      p_device_class: device
    });
  }

  document.addEventListener('click', (event) => {
    const control = event.target.closest('a,button');
    const key = targetKey(control);
    if (key) recordInteraction('click', key);
  }, { capture: true });

  const sections = [
    ['inicio', '#inicio'],
    ['necesitas', '#necesitas'],
    ['historias', '#historias'],
    ['recursos', '#recursos'],
    ['profesionales', '#profesionales'],
    ['contacto', '#contacto']
  ];
  const seenSections = new Set();

  if (!isSensitivePath(path) && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.55) return;
        const key = entry.target.getAttribute('data-analytics-section');
        if (!key || seenSections.has(key)) return;
        seenSections.add(key);
        recordInteraction('section_view', `section:${key}`);
        observer.unobserve(entry.target);
      });
    }, { threshold: [0.55] });

    sections.forEach(([key, selector]) => {
      const node = document.querySelector(selector);
      if (!node) return;
      node.setAttribute('data-analytics-section', key);
      observer.observe(node);
    });
  }

  const scrollMarks = new Set();
  function trackScrollDepth() {
    if (isSensitivePath(path)) return;
    const root = document.documentElement;
    const scrollable = Math.max(1, root.scrollHeight - window.innerHeight);
    const depth = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
    [25, 50, 75, 100].forEach((mark) => {
      if (depth >= mark && !scrollMarks.has(mark)) {
        scrollMarks.add(mark);
        recordInteraction('scroll_depth', `depth:${mark}`);
      }
    });
  }

  window.addEventListener('scroll', trackScrollDepth, { passive: true });
  window.addEventListener('pagehide', trackScrollDepth, { capture: true });
})();
