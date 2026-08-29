(function () {
  'use strict';

  const ALLOWED_HOSTS = new Set(['desgracias.es', 'www.desgracias.es']);
  const SUPABASE_URL = 'https://enspficpubtttybpzhph.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_TraLgSrXG8Jpgq_pE6uZgw_SQ7S5UL7';

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

  const payload = {
    p_path: safePath(),
    p_referrer_host: referrerHost(),
    p_country_code: inferredCountryCode(),
    p_device_class: deviceClass()
  };

  fetch(`${SUPABASE_URL}/rest/v1/rpc/record_privacy_safe_pageview`, {
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
})();
