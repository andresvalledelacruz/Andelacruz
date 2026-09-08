(function () {
  const SEARCH_URL = '/buscar/';

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

  function insertFooterEntry() {
    const groups = Array.from(document.querySelectorAll('.footer-grid > div'));
    const navigation = groups.find((group) => group.querySelector('strong')?.textContent?.trim() === 'Navegación');
    if (!navigation || navigation.querySelector('[data-search-entry="footer"]')) return;

    const link = document.createElement('a');
    link.href = SEARCH_URL;
    link.textContent = 'Buscar ayuda';
    link.dataset.searchEntry = 'footer';
    navigation.append(link);
  }

  insertMainNavEntry();
  promoteHeroSearch();
  wireOrientationCard();
  insertFooterEntry();
})();
