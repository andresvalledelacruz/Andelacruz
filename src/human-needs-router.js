const routeCatalog = {
  emotional_support: {
    label: 'Apoyo emocional y experiencias similares',
    professional_boundary: 'No diagnostica ni sustituye atención psicológica o psiquiátrica.'
  },
  grief_transition: {
    label: 'Duelo y transición vital',
    professional_boundary: 'Acompañamiento y recursos; derivación clínica solo cuando corresponda.'
  },
  relationship_family: {
    label: 'Pareja, familia y mediación',
    professional_boundary: 'Puede incluir orientación relacional, mediación o apoyo profesional según el caso.'
  },
  work_career: {
    label: 'Trabajo, empleabilidad y transición profesional',
    professional_boundary: 'Prioriza necesidades laborales y prácticas antes de medicalizar el malestar.'
  },
  financial_practical: {
    label: 'Orientación económica y práctica',
    professional_boundary: 'No ofrece asesoramiento financiero regulado; orienta hacia recursos adecuados.'
  },
  legal_mediation: {
    label: 'Orientación jurídica o mediación',
    professional_boundary: 'No sustituye asesoramiento jurídico profesional.'
  },
  social_community: {
    label: 'Red social, comunidad y pertenencia',
    professional_boundary: 'Prioriza conexión y recursos comunitarios cuando la necesidad principal es social.'
  },
  wellbeing_habits: {
    label: 'Sueño, estrés, hábitos y autorregulación',
    professional_boundary: 'No prescribe tratamientos médicos ni interpreta síntomas clínicos.'
  },
  clinical_review: {
    label: 'Valoración profesional de salud mental',
    professional_boundary: 'Requiere profesionales acreditados; la plataforma no emite diagnósticos.'
  },
  urgent_safety: {
    label: 'Seguridad y ayuda urgente',
    professional_boundary: 'Prioriza recursos de emergencia y revisión humana; nunca se automatiza una decisión clínica.'
  }
};

const categoryRoutes = {
  'Duelo y Pérdidas': ['grief_transition', 'emotional_support'],
  Soledad: ['social_community', 'emotional_support'],
  'Pareja y Rupturas': ['relationship_family', 'emotional_support'],
  Familia: ['relationship_family', 'emotional_support'],
  Trabajo: ['work_career', 'emotional_support'],
  Dinero: ['financial_practical', 'emotional_support'],
  Autoestima: ['emotional_support', 'wellbeing_habits'],
  Amistad: ['social_community', 'emotional_support'],
  Conflictos: ['legal_mediation', 'relationship_family'],
  'Otras historias': ['emotional_support']
};

const signalRules = [
  {
    id: 'employment',
    route: 'work_career',
    weight: 4,
    terms: ['despid', 'paro', 'trabajo', 'empleo', 'currículum', 'curriculum', 'jefe', 'empresa', 'jubilación', 'jubilacion']
  },
  {
    id: 'money',
    route: 'financial_practical',
    weight: 4,
    terms: ['deuda', 'hipoteca', 'alquiler', 'dinero', 'embargo', 'factura', 'préstamo', 'prestamo', 'banco']
  },
  {
    id: 'legal',
    route: 'legal_mediation',
    weight: 4,
    terms: ['denuncia', 'abogado', 'custodia', 'divorcio', 'juicio', 'contrato', 'herencia', 'desahucio']
  },
  {
    id: 'relationships',
    route: 'relationship_family',
    weight: 3,
    terms: ['pareja', 'ruptura', 'separación', 'separacion', 'hijos', 'familia', 'padres', 'madre', 'padre']
  },
  {
    id: 'social',
    route: 'social_community',
    weight: 3,
    terms: ['solo', 'sola', 'soledad', 'aislado', 'aislada', 'nadie', 'mudanza', 'amigos', 'amistad']
  },
  {
    id: 'grief',
    route: 'grief_transition',
    weight: 4,
    terms: ['falleció', 'fallecio', 'murió', 'murio', 'muerte', 'duelo', 'funeral', 'pérdida', 'perdida']
  },
  {
    id: 'wellbeing',
    route: 'wellbeing_habits',
    weight: 2,
    terms: ['no duermo', 'insomnio', 'estrés', 'estres', 'agotado', 'agotada', 'ansiedad', 'rutina']
  },
  {
    id: 'clinical_review',
    route: 'clinical_review',
    weight: 3,
    terms: ['no puedo funcionar', 'no puedo trabajar', 'no puedo levantarme', 'ataques de pánico', 'ataques de panico', 'medicación', 'medicacion', 'psiquiatra', 'psicólogo', 'psicologo']
  }
];

const urgentTerms = [
  'suicid',
  'matarme',
  'quitarme la vida',
  'hacerme daño',
  'hacerme dano',
  'autoles',
  'violencia ahora',
  'me va a matar',
  'peligro inmediato',
  'emergencia médica',
  'emergencia medica'
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesTerm(text, term) {
  return text.includes(normalize(term));
}

export function routeHumanNeeds({ category = '', title = '', story = '', needs = [] } = {}) {
  const text = normalize(`${title} ${story}`);
  const evidence = [];
  const score = new Map();

  const add = (route, points, why) => {
    score.set(route, (score.get(route) || 0) + points);
    evidence.push({ route, why });
  };

  for (const route of categoryRoutes[category] || ['emotional_support']) {
    add(route, 2, `Categoría declarada: ${category || 'sin categoría específica'}`);
  }

  for (const rule of signalRules) {
    const matched = rule.terms.filter((term) => matchesTerm(text, term));
    if (matched.length) {
      add(rule.route, rule.weight + Math.min(matched.length - 1, 2), `Señales explícitas: ${matched.slice(0, 3).join(', ')}`);
    }
  }

  if (Array.isArray(needs)) {
    if (needs.includes('orientacion_profesional')) add('clinical_review', 1, 'La persona solicita orientación profesional.');
    if (needs.includes('recursos_practicos')) add('financial_practical', 1, 'La persona solicita recursos prácticos; se priorizarán según contexto.');
    if (needs.includes('experiencias_similares')) add('emotional_support', 1, 'La persona solicita experiencias similares.');
    if (needs.includes('que_me_lean')) add('emotional_support', 1, 'La persona pide escucha y comprensión.');
  }

  const urgentMatches = urgentTerms.filter((term) => matchesTerm(text, term));
  const urgent = urgentMatches.length > 0;
  if (urgent) add('urgent_safety', 100, 'Existe lenguaje explícito compatible con una necesidad de seguridad inmediata; requiere revisión humana.');

  const ranked = [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, points]) => ({
      id,
      score: points,
      ...routeCatalog[id],
      reasons: evidence.filter((item) => item.route === id).map((item) => item.why)
    }));

  const primary = urgent ? ranked.find((item) => item.id === 'urgent_safety') : ranked[0];
  const secondary = ranked.filter((item) => item.id !== primary?.id).slice(0, 3);

  return {
    version: 1,
    diagnostic: false,
    automated_clinical_decision: false,
    urgent_human_review: urgent,
    primary_route: primary || null,
    secondary_routes: secondary,
    explanation: 'La orientación se basa en el evento, las necesidades declaradas y señales explícitas del texto. No infiere diagnósticos ni sustituye profesionales acreditados.'
  };
}

export function publicRouteCatalog() {
  return Object.entries(routeCatalog).map(([id, value]) => ({ id, ...value }));
}
