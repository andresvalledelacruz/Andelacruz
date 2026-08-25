(() => {
  const STORAGE_KEY = 'desgracias_staging_story_actions_v1';
  const dialog = document.querySelector('#storyDetail');
  const detailTimeline = document.querySelector('#detailTimeline');
  const followButton = document.querySelector('[data-interaction="seguir"]');
  if (!dialog || !detailTimeline || !followButton) return;

  const panel = document.createElement('section');
  panel.className = 'story-followup-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="story-followup-head">
      <div>
        <div class="story-followup-kicker">Qué pasó después</div>
        <h3 class="story-followup-title">Sigues esta historia en este navegador</h3>
      </div>
      <span class="story-followup-status"><i></i> Seguimiento privado</span>
    </div>
    <p class="story-followup-copy">Cuando esta historia tenga una actualización autorizada, este espacio mostrará el nuevo tramo del recorrido. En staging todavía no enviamos avisos externos ni correos.</p>
    <div class="story-followup-empty">
      <strong>Aún no hay una actualización posterior.</strong>
      <span>No inventamos un “después”. Solo aparecerá cuando exista una actualización real y haya pasado los controles correspondientes.</span>
    </div>`;
  detailTimeline.insertAdjacentElement('afterend', panel);

  function readActions() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function currentSlug() {
    return new URLSearchParams(location.search).get('historia') || '';
  }

  function isFollowing(slug) {
    if (!slug) return false;
    return Boolean(readActions()[slug]?.includes('seguir'));
  }

  function refresh() {
    const slug = currentSlug();
    panel.hidden = !isFollowing(slug);
    followButton.textContent = isFollowing(slug) ? 'Siguiendo' : 'Seguir historia';
  }

  followButton.addEventListener('click', () => setTimeout(refresh, 0));
  window.addEventListener('popstate', () => setTimeout(refresh, 0));

  const observer = new MutationObserver(() => refresh());
  observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  refresh();
})();