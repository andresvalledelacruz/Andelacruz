// Explicit categories, never keyword matches against sensitive free text.
export const cardContexts = Object.freeze({
  'ayuda-urgente.html': ['crisis'],
  'violencia/index.html': ['violencia'],
  'duelo/index.html': ['duelo'],
  'ansiedad/index.html': ['ansiedad'],
  'gestion-emocional/index.html': ['gestion-emocional'],
  'soledad/index.html': ['soledad'],
  'salud/index.html': ['salud'],
  'trabajo-dinero/index.html': ['trabajo', 'dinero'],
  'rupturas/index.html': ['rupturas'],
  'familia/index.html': ['familia']
});

const contextualRoutes = {
  crisis: ['tel:024'],
  violencia: ['/familia/mi-hijo-sufre-acoso-escolar-y-no-se-que-hacer/', '/trabajo/mi-jefe-me-hace-la-vida-imposible/', '/webs-amigas.html#igualdad'],
  ansiedad: ['/buscar/', '/webs-amigas.html#emocional'],
  salud: ['/buscar/', '/duelo/mi-familiar-se-esta-muriendo-y-no-se-que-hacer/', '/webs-amigas.html#salud'],
  'gestion-emocional': ['/soledad/no-tengo-con-quien-hablar/', '/soledad/me-siento-solo-por-la-noche/', '/webs-amigas.html#emocional'],
  soledad: ['/webs-amigas.html#social'],
  duelo: ['/webs-amigas.html#emocional'],
  rupturas: ['/webs-amigas.html#emocional'],
  familia: ['/webs-amigas.html#infancia']
};

export function contextualRank(resource, categories, catalog) {
  // Emergency contacts are never demoted by a topic selection.
  if (resource.urgent || /^(tel:|https:\/\/wa\.me\/)/.test(resource.url)) return 0;
  const category = resource.category || catalog.find(item => item.url === resource.url)?.category;
  if (categories.includes(category) || categories.some(key => contextualRoutes[key]?.includes(resource.url))) return 1;
  return 2;
}

export function rankResources(resources, categories, catalog = []) {
  // Stable ties preserve the editor's ordering; no resource is removed.
  return resources.map((resource, index) => ({resource, index, rank: contextualRank(resource, categories, catalog)}))
    .sort((a, b) => a.rank - b.rank || a.index - b.index).map(item => item.resource);
}
