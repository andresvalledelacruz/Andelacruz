(function () {
  'use strict';

  const ALLOWED_HOSTS = new Set(['desgracias.es', 'www.desgracias.es']);
  const SUPABASE_URL = 'https://enspficpubtttybpzhph.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_TraLgSrXG8Jpgq_pE6uZgw_SQ7S5UL7';
  const currentPath = window.location.pathname === '/index.html' ? '/' : window.location.pathname;
  if (!ALLOWED_HOSTS.has(window.location.hostname) || currentPath !== '/') return;

  const sentScroll = new Set();

  function send(eventType, targetKey) {
    if (!/^(click|scroll)$/.test(eventType)) return;
    if (!/^[a-z0-9_:-]{2,64}$/.test(targetKey)) return;
    fetch(SUPABASE_URL + '/rest/v1/rpc/record_privacy_safe_interaction', {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ p_path: '/', p_event_type: eventType, p_target_key: targetKey })
    }).catch(() => {});
  }

  function clickKey(node) {
    if (!node) return null;
    if (node.matches('.urgent-help-link')) return 'header_urgent';
    if (node.matches('.header-cta')) return 'header_story';
    if (node.matches('[data-urgent-entry="hero"]')) return 'hero_urgent';
    if (node.matches('[data-search-entry="hero"]')) return 'hero_search';
    if (node.matches('.hero-final-actions a[href="#historias"]')) return 'hero_stories';
    if (node.matches('[data-urgent-entry="needs"]')) return 'needs_urgent';
    if (node.matches('[data-search-entry="needs"]')) return 'needs_search';
    if (node.matches('.needs-grid a[href="#historias"]')) return 'needs_stories';
    if (node.id === 'all-resources-link' || node.closest('#all-resources-link')) return 'resources_all';
    if (node.id === 'stories-by-topic-link' || node.closest('#stories-by-topic-link')) return 'stories_topics';
    if (node.matches('[data-search-entry="main-nav"]')) return 'nav_search';
    if (node.matches('.main-nav a[href="#historias"]')) return 'nav_stories';
    if (node.matches('.main-nav a[href="#recursos"]')) return 'nav_resources';
    if (node.matches('.main-nav a[href="#profesionales"]')) return 'nav_professionals';
    if (node.matches('.main-nav a[href="/contacto.html"]')) return 'nav_contact';
    const resource = node.closest('.resource-card-link');
    if (resource) {
      const href = resource.getAttribute('href') || '';
      const map = {
        '/ayuda-urgente.html':'resource_suicide','/violencia/':'resource_violence','/duelo/':'resource_grief',
        '/ansiedad/':'resource_anxiety','/gestion-emocional/':'resource_emotions','/soledad/':'resource_loneliness',
        '/salud/':'resource_health','/trabajo-dinero/':'resource_work_money','/rupturas/':'resource_breakups','/familia/':'resource_family'
      };
      return map[href] || null;
    }
    return null;
  }

  document.addEventListener('click', (event) => {
    const node = event.target.closest('a,button');
    const key = clickKey(node);
    if (key) send('click', key);
  }, { passive: true });

  function checkScroll() {
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    const pct = Math.min(100, Math.round((window.scrollY / max) * 100));
    for (const threshold of [25, 50, 75, 90, 100]) {
      if (pct >= threshold && !sentScroll.has(threshold)) {
        sentScroll.add(threshold);
        send('scroll', 'depth_' + threshold);
      }
    }
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; checkScroll(); });
  }, { passive: true });
  window.addEventListener('load', checkScroll, { once: true });
})();
