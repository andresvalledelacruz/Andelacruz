(() => {
  const resourceGrid = document.querySelector('#recursos .resource-grid');
  if (!resourceGrid) return;

  const dueloCard = [...resourceGrid.children].find((element) =>
    element.tagName === 'ARTICLE' && element.querySelector('h3')?.textContent?.trim() === 'Duelo y pérdidas'
  );

  if (!dueloCard) return;

  const link = document.createElement('a');
  link.href = '/duelo/';
  link.setAttribute('aria-label', 'Ver recursos de Duelo y pérdidas');
  link.style.cssText = 'display:block;height:100%';
  dueloCard.style.height = '100%';

  dueloCard.replaceWith(link);
  link.append(dueloCard);
})();
