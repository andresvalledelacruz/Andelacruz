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

  const ROUTE_EXPANSIONS = Object.freeze({
    'Soledad': Object.freeze([
      ['/gestion-emocional/', 'Necesito apoyo emocional porque me siento solo/a'],
      ['/rupturas/', 'Me siento solo/a después de una ruptura'],
      ['/familia/siento-que-mi-familia-no-me-quiere/', 'Me siento solo/a o rechazado/a dentro de mi familia'],
      ['/webs-amigas.html#emocional', 'Quiero hablar con una organización de apoyo emocional']
    ]),
    'Ansiedad': Object.freeze([
      ['/buscar/', 'Estoy muy angustiado/a y no sé por dónde empezar'],
      ['/gestion-emocional/', 'Necesito bajar el desbordamiento emocional'],
      ['/trabajo/no-puedo-mas-en-el-trabajo/', 'El trabajo me está generando ansiedad'],
      ['/dinero/tengo-deudas-y-no-se-por-donde-empezar/', 'El dinero o las deudas me generan ansiedad'],
      ['/rupturas/', 'La ansiedad empezó o empeoró tras una ruptura'],
      ['/soledad/', 'La soledad está empeorando mi ansiedad'],
      ['/salud/', 'Quiero saber cuándo conviene pedir ayuda profesional'],
      ['/webs-amigas.html#emocional', 'Quiero encontrar apoyo emocional externo'],
      ['/ayuda-urgente.html', 'Además existe un riesgo inmediato o una crisis grave']
    ]),
    'Gestión emocional': Object.freeze([
      ['/ansiedad/', 'Siento ansiedad, miedo o preocupación constante'],
      ['/soledad/', 'Me siento solo/a o desconectado/a'],
      ['/duelo/', 'Estoy atravesando un duelo o una pérdida'],
      ['/rupturas/', 'Estoy desbordado/a por una ruptura o relación'],
      ['/familia/', 'El problema está en mi familia'],
      ['/trabajo/no-puedo-mas-en-el-trabajo/', 'El trabajo me está superando'],
      ['/dinero/', 'El dinero está afectando a cómo me siento'],
      ['/salud/', 'Una enfermedad o problema de salud me está desbordando'],
      ['/webs-amigas.html#emocional', 'Quiero encontrar una organización de apoyo emocional']
    ]),
    'Salud y enfermedad': Object.freeze([
      ['/buscar/', 'Tengo un problema de salud y no sé por dónde empezar'],
      ['/ansiedad/', 'La enfermedad o las pruebas médicas me generan ansiedad'],
      ['/gestion-emocional/', 'Necesito apoyo para manejar cómo me siento'],
      ['/duelo/mi-familiar-se-esta-muriendo-y-no-se-que-hacer/', 'Un familiar tiene una enfermedad avanzada'],
      ['/familia/', 'La salud de alguien está afectando a toda la familia'],
      ['/trabajo-dinero/', 'La enfermedad está afectando a mi trabajo o economía'],
      ['/soledad/', 'Me siento solo/a durante una enfermedad'],
      ['/webs-amigas.html#salud', 'Quiero localizar una organización relacionada con salud'],
      ['/ayuda-urgente.html', 'Existe una urgencia o un riesgo inmediato']
    ]),
    'Rupturas y relaciones': Object.freeze([
      ['/ansiedad/', 'La ruptura me está provocando mucha ansiedad'],
      ['/soledad/', 'Me siento muy solo/a después de la ruptura'],
      ['/gestion-emocional/', 'No consigo manejar lo que siento tras la ruptura'],
      ['/violencia/', 'Hay miedo, control, amenazas o violencia en la relación'],
      ['/webs-amigas.html#emocional', 'Quiero encontrar apoyo emocional externo']
    ]),
    'Familia': Object.freeze([
      ['/gestion-emocional/', 'Los problemas familiares me están desbordando emocionalmente'],
      ['/violencia/', 'En mi familia hay miedo, control, amenazas o violencia']
    ]),
    'Dinero y deudas': Object.freeze([
      ['/trabajo-dinero/', 'Necesito ordenar a la vez trabajo, ingresos, vivienda y deudas']
    ])
  });

  function enhanceResourceTree() {
    for (const details of document.querySelectorAll('.resource-branch')) {
      const summary = details.querySelector(':scope > summary');
      const list = details.querySelector(':scope > ul');
      if (!summary || !list) continue;
      const title = summary.childNodes[0]?.textContent?.trim() || '';
      const additions = ROUTE_EXPANSIONS[title];
      if (!additions) continue;

      const existing = new Set([...list.querySelectorAll('a')].map((a) => `${a.getAttribute('href')}|${a.textContent.trim()}`));
      for (const [href, label] of additions) {
        if (existing.has(`${href}|${label}`)) continue;
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        item.append(link);
        list.append(item);
      }

      const badge = summary.querySelector('span');
      if (badge) badge.textContent = `(${list.querySelectorAll(':scope > li').length} opciones)`;
    }

    const nextSteps = [...document.querySelectorAll('.next-steps .cardlink')];
    const emotional = nextSteps.find((link) => link.querySelector('strong')?.textContent.trim() === 'Necesito apoyo con trabajo o dinero');
    if (emotional) {
      emotional.href = '/gestion-emocional/';
      const strong = emotional.querySelector('strong');
      const description = emotional.querySelector('span');
      if (strong) strong.textContent = 'Necesito apoyo emocional';
      if (description) description.textContent = 'Encuentra una ruta cuando la ansiedad, la tristeza, la soledad, el miedo o el desbordamiento pesan más de la cuenta.';
    }
  }

  enhanceResourceTree();

  const select = document.getElementById('resource-category');
  const list = document.getElementById('resource-directory');
  const count = document.getElementById('resource-count');
  const filters = document.getElementById('resource-filters');
  const reset = document.getElementById('resource-reset');
  if (!select || !list || !count || !filters || !reset) return;

  // The resources directory did not previously load the common pageview runtime.
  // Add the same privacy-first, aggregate-only counter used by other public hubs.
  if (!document.querySelector('script[src="/visitor-analytics.js"]')) {
    const analytics = document.createElement('script');
    analytics.src = '/visitor-analytics.js';
    analytics.defer = true;
    document.head.append(analytics);
  }

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
  reset.addEventListener('click', () => {
    select.value = 'all';
    filter();
    select.focus();
  });
  filters.hidden = false;
})();
