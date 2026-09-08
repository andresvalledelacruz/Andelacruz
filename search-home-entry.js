(function () {
  const SEARCH_URL = '/buscar/';
  const URGENT_URL = '/ayuda-urgente.html';

  function insertMainNavEntry() {
    const nav = document.querySelector('#main-nav');
    if (!nav || nav.querySelector('[data-search-entry="main-nav"]')) return;

    const link = document.createElement('a');
    link.href = SEARCH_URL;
    link.textContent = 'Buscar ayuda';
    link.dataset.searchEntry = 'main-nav';

    const firstLink = nav.querySelector('a');
    if (firstLink?.nextSibling) nav.insertBefore(link, firstLink.nextSibling);
    else nav.append(link);
  }

  function promoteHeroUrgent() {
    const actions = document.querySelector('.hero-final-actions');
    if (!actions || actions.querySelector('[data-urgent-entry="hero"]')) return;

    const storyButton = actions.querySelector('button[data-open-story]');
    if (!storyButton) return;

    const card = document.createElement('a');
    card.className = storyButton.className;
    card.href = URGENT_URL;
    card.dataset.urgentEntry = 'hero';
    card.setAttribute('aria-label', 'Necesito ayuda urgente');

    while (storyButton.firstChild) card.append(storyButton.firstChild);

    const icon = card.querySelector('.final-icon');
    if (icon) {
      icon.setAttribute('aria-hidden', 'true');
      icon.replaceChildren(document.createTextNode('!'));
    }

    const title = card.querySelector('.final-card-copy strong');
    const description = card.querySelector('.final-card-copy small');
    if (title) title.textContent = 'Necesito ayuda urgente';
    if (description) description.textContent = 'Si hay peligro inmediato o no sabes qué hacer ahora.';

    storyButton.replaceWith(card);
  }

  function promoteHeroSearch() {
    const card = document.querySelector('.hero-final-actions a[href^="mailto:info@desgracias.es"]');
    if (!card) return;

    card.href = SEARCH_URL;
    card.dataset.searchEntry = 'hero';
    card.setAttribute('aria-label', 'Cuéntame qué te pasa y encuentra por dónde empezar');

    const icon = card.querySelector('.final-icon');
    if (icon) {
      icon.classList.remove('final-icon-mail');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '⌕';
    }

    const title = card.querySelector('.final-card-copy strong');
    const description = card.querySelector('.final-card-copy small');
    if (title) {
      title.classList.remove('email-strong');
      title.textContent = 'Cuéntame qué te pasa';
    }
    if (description) description.textContent = 'Encuentra por dónde empezar.';
  }

  function promoteNeedsUrgent() {
    const firstCard = document.querySelector('.needs-grid .need-card');
    if (!firstCard || firstCard.querySelector('[data-urgent-entry="needs"]')) return;

    const heading = firstCard.querySelector('h3');
    const copy = firstCard.querySelector('p');
    const icon = firstCard.querySelector('.need-icon');
    const oldLink = firstCard.querySelector('.need-link');

    if (heading) heading.textContent = 'Necesito ayuda urgente';
    if (copy) copy.textContent = 'Si hay peligro inmediato, riesgo para ti o para otra persona, o necesitas saber qué hacer ahora, empieza aquí.';
    if (icon) icon.textContent = '!';

    if (oldLink) {
      const link = document.createElement('a');
      link.className = oldLink.className;
      link.href = URGENT_URL;
      link.dataset.urgentEntry = 'needs';
      link.append(document.createTextNode('Ver ayuda urgente '));
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      link.append(arrow);
      oldLink.replaceWith(link);
    }
  }

  function wireOrientationCard() {
    const cards = Array.from(document.querySelectorAll('.needs-grid .need-card'));
    const orientation = cards.find((card) => card.querySelector('h3')?.textContent?.trim() === 'Busco orientación');
    const link = orientation?.querySelector('.need-link');
    if (!link) return;

    link.href = SEARCH_URL;
    link.dataset.searchEntry = 'needs';
    link.replaceChildren(document.createTextNode('Encontrar por dónde empezar '));
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    link.append(arrow);
  }

  function insertFooterEntries() {
    const groups = Array.from(document.querySelectorAll('.footer-grid > div'));
    const navigation = groups.find((group) => group.querySelector('strong')?.textContent?.trim() === 'Navegación');
    if (!navigation) return;

    let urgent = navigation.querySelector('[data-urgent-entry="footer"]');
    if (!urgent) {
      urgent = document.createElement('a');
      urgent.href = URGENT_URL;
      urgent.textContent = 'Ayuda urgente';
      urgent.dataset.urgentEntry = 'footer';
      navigation.append(urgent);
    }

    if (!navigation.querySelector('[data-search-entry="footer"]')) {
      const link = document.createElement('a');
      link.href = SEARCH_URL;
      link.textContent = 'Buscar ayuda';
      link.dataset.searchEntry = 'footer';
      navigation.append(link);
    }
  }

  insertMainNavEntry();
  promoteHeroUrgent();
  promoteHeroSearch();
  promoteNeedsUrgent();
  wireOrientationCard();
  insertFooterEntries();
})();
