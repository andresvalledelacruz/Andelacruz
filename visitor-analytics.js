(function () {
  'use strict';

  const ALLOWED_HOSTS = new Set(['desgracias.es', 'www.desgracias.es']);
  const SUPABASE_URL = 'https://enspficpubtttybpzhph.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_TraLgSrXG8Jpgq_pE6uZgw_SQ7S5UL7';
  const ALLOWED_EVENT_TYPES = new Set(['click']);

  if (!ALLOWED_HOSTS.has(window.location.hostname)) return;

  function safePath() {
    const path = window.location.pathname || '/';
    return /^\/[A-Za-z0-9_./-]*$/.test(path) && path.length <= 240 ? path : '/unknown';
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
    fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
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

  postRpc('record_privacy_safe_pageview', {
    p_path: safePath(),
    p_referrer_host: referrerHost(),
    p_country_code: inferredCountryCode(),
    p_device_class: deviceClass()
  });

  function safeTargetKey(element) {
    const urgent = element.closest('[data-urgent-entry]');
    if (urgent) return `urgent:${String(urgent.dataset.urgentEntry || 'unknown').slice(0, 40)}`;

    const search = element.closest('[data-search-entry]');
    if (search) return `search:${String(search.dataset.searchEntry || 'unknown').slice(0, 40)}`;

    const storyOpen = element.closest('[data-open-story]');
    if (storyOpen) return 'story:open';

    const filter = element.closest('.story-filters .filter');
    if (filter) return `stories:filter:${String(filter.dataset.filter || 'category').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'category'}`;

    const resource = element.closest('#recursos a[href]');
    if (resource) return 'resources:open';

    const nav = element.closest('#main-nav a[href]');
    if (nav) return 'navigation:main';

    return null;
  }

  document.addEventListener('click', (event) => {
    if (!ALLOWED_EVENT_TYPES.has('click')) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const key = safeTargetKey(target);
    if (!key) return;

    postRpc('record_privacy_safe_interaction', {
      p_path: safePath(),
      p_event_type: 'click',
      p_target_key: key,
      p_device_class: deviceClass()
    });
  }, { passive: true });
})();
