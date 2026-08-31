(() => {
  const resourceGrid = document.querySelector('#recursos .resource-grid');
  if (!resourceGrid) return;

  const cardDestinations = new Map([
    ['Rupturas y relaciones', '/rupturas/'],
    ['Duelo y pérdidas', '/duelo/']
  ]);

  const wrapCard = (card, href, label) => {
    if (!card || card.parentElement?.tagName === 'A') return card?.parentElement ?? null;

    const link = document.createElement('a');
    link.href = href;
    link.setAttribute('aria-label', `Ver recursos de ${label}`);
    link.style.cssText = 'display:block;height:100%';
    card.style.height = '100%';
    card.replaceWith(link);
    link.append(card);
    return link;
  };

  for (const [label, href] of cardDestinations) {
    const card = [...resourceGrid.children].find((element) =>
      element.tagName === 'ARTICLE' && element.querySelector('h3')?.textContent?.trim() === label
    );
    wrapCard(card, href, label);
  }

  const linkedCards = [...resourceGrid.children].filter((element) => element.tagName === 'A');
  for (const link of linkedCards) {
    const article = link.querySelector('article');
    if (!article || article.querySelector('[data-resource-link-cue]')) continue;

    const cue = document.createElement('span');
    cue.dataset.resourceLinkCue = '';
    cue.setAttribute('aria-hidden', 'true');
    cue.textContent = 'Ver recursos →';
    cue.style.cssText = 'display:block;margin-top:12px;font-weight:700;font-size:.9rem';
    article.append(cue);
  }

  const emotionalCard = [...resourceGrid.children].find((element) =>
    element.tagName === 'ARTICLE' && element.querySelector('h3')?.textContent?.trim() === 'Gestión emocional'
  );

  if (emotionalCard && !emotionalCard.querySelector('[data-resource-status]')) {
    const status = document.createElement('span');
    status.dataset.resourceStatus = '';
    status.textContent = 'En preparación';
    status.style.cssText = 'display:block;margin-top:12px;font-weight:600;font-size:.88rem;opacity:.72';
    emotionalCard.append(status);
  }
})();
