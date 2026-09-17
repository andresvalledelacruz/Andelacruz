(() => {
  'use strict';
  const homeResources = document.getElementById('recursos');
  if (homeResources && !document.getElementById('resource-directory-entry')) {
    const paragraph = document.createElement('p');
    paragraph.style.textAlign = 'center';
    paragraph.style.marginTop = '24px';
    const link = document.createElement('a');
    link.id = 'resource-directory-entry';
    link.href = '/recursos/';
    link.className = 'btn btn-ghost';
    link.textContent = 'Explorar todos los recursos por tema →';
    paragraph.append(link);
    (homeResources.querySelector('.container') || homeResources).append(paragraph);
  }
  const select = document.getElementById('resource-category');
  const list = document.getElementById('resource-directory');
  const count = document.getElementById('resource-count');
  const filters = document.getElementById('resource-filters');
  const reset = document.getElementById('resource-reset');
  if (!select || !list || !count || !filters || !reset) return;
  const cards = [...list.children];
  function filter() {
    let visible = 0;
    for (const card of cards) {
      card.hidden = select.value !== 'all' && card.dataset.category !== select.value;
      if (!card.hidden) visible++;
    }
    count.textContent = `${visible} de ${cards.length} guías disponibles`;
  }
  select.addEventListener('change', filter);
  reset.addEventListener('click', () => { select.value = 'all'; filter(); select.focus(); });
  filters.hidden = false;
})();
