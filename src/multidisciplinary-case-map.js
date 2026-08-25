import { routeHumanNeeds } from './human-needs-router.js';

const laneCatalog = {
  emotional_support: {
    discipline_cluster: ['Psicología no diagnóstica', 'Counseling', 'Experiencia vivida'],
    platform_role: 'Escucha, experiencias comparables, acompañamiento y recursos de autocuidado.',
    accredited_when: 'Cuando el malestar es persistente, intenso o deteriora de forma relevante el funcionamiento.'
  },
  grief_transition: {
    discipline_cluster: ['Duelo y transiciones', 'Psicología', 'Trabajo social'],
    platform_role: 'Normalizar la diversidad del proceso, mostrar experiencias por fase y ofrecer recursos.',
    accredited_when: 'Cuando existen complicaciones relevantes, deterioro intenso o necesidad clínica específica.'
  },
  relationship_family: {
    discipline_cluster: ['Pareja y familia', 'Mediación', 'Psicología sistémica'],
    platform_role: 'Ordenar necesidades relacionales y prácticas y ofrecer rutas de apoyo.',
    accredited_when: 'Cuando hay violencia, alto conflicto, menores, custodia o necesidad terapéutica especializada.'
  },
  work_career: {
    discipline_cluster: ['Psicología del trabajo', 'Orientación laboral', 'Mentoría profesional'],
    platform_role: 'Separar impacto emocional de decisiones de empleabilidad, carrera y transición.',
    accredited_when: 'Cuando se requiere intervención psicológica, jurídica o asesoramiento profesional específico.'
  },
  financial_practical: {
    discipline_cluster: ['Orientación financiera', 'Trabajo social', 'Asesoramiento práctico'],
    platform_role: 'Ayudar a ordenar datos, prioridades y recursos sin recomendar productos financieros.',
    accredited_when: 'Cuando se necesita asesoramiento financiero regulado, concursal, fiscal o jurídico.'
  },
  legal_mediation: {
    discipline_cluster: ['Derecho', 'Mediación', 'Psicología jurídica'],
    platform_role: 'Detectar que existe una dimensión jurídica y orientar hacia recursos adecuados.',
    accredited_when: 'Cuando se necesita consejo legal, representación, peritaje o mediación profesional.'
  },
  social_community: {
    discipline_cluster: ['Psicología social', 'Trabajo social', 'Intervención comunitaria'],
    platform_role: 'Priorizar pertenencia, red, comunidad y experiencias de integración.',
    accredited_when: 'Cuando existen exclusión, vulnerabilidad social o necesidades asistenciales específicas.'
  },
  wellbeing_habits: {
    discipline_cluster: ['Sueño', 'Estrés', 'Hábitos', 'Autorregulación'],
    platform_role: 'Ofrecer educación general y hábitos seguros sin interpretar síntomas médicos.',
    accredited_when: 'Cuando los síntomas pueden requerir evaluación médica, psicológica o de sueño.'
  },
  clinical_review: {
    discipline_cluster: ['Psicología clínica/sanitaria', 'Psiquiatría', 'Neuropsicología cuando corresponda'],
    platform_role: 'Explicar límites y facilitar acceso a profesionales acreditados.',
    accredited_when: 'Siempre: la plataforma no diagnostica ni prescribe.'
  },
  urgent_safety: {
    discipline_cluster: ['Seguridad', 'Emergencias', 'Salud mental acreditada'],
    platform_role: 'Priorizar seguridad, recursos urgentes y revisión humana.',
    accredited_when: 'Siempre y de forma prioritaria; nunca se automatiza una decisión clínica o de riesgo.'
  }
};

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function buildMultidisciplinaryCaseMap(input = {}) {
  const routed = routeHumanNeeds(input);
  const routes = [routed.primary_route, ...routed.secondary_routes].filter(Boolean);

  const disciplines = unique(
    routes.flatMap((route) => laneCatalog[route.id]?.discipline_cluster || [])
  );

  const dimensions = routes.map((route, index) => ({
    priority: index === 0 ? 'primary' : 'secondary',
    route_id: route.id,
    label: route.label,
    evidence: route.reasons,
    discipline_cluster: laneCatalog[route.id]?.discipline_cluster || [],
    platform_role: laneCatalog[route.id]?.platform_role || '',
    accredited_when: laneCatalog[route.id]?.accredited_when || route.professional_boundary
  }));

  const nextStepClass = routed.urgent_human_review
    ? 'human_safety_review'
    : routes.some((route) => route.id === 'clinical_review')
      ? 'mixed_support_plus_professional_option'
      : 'non_clinical_guidance_first';

  return {
    version: 1,
    framework: 'multidisciplinary_non_diagnostic',
    diagnostic: false,
    clinical_or_forensic_opinion: false,
    person_first: true,
    urgent_human_review: routed.urgent_human_review,
    next_step_class: nextStepClass,
    primary_need: routed.primary_route,
    dimensions,
    disciplines,
    guardrails: {
      no_automatic_diagnosis: true,
      no_medication_advice: true,
      no_forensic_conclusion: true,
      no_professional_impersonation: true,
      human_review_for_urgent_safety: true,
      practical_needs_not_automatically_psychologized: true
    },
    explanation: 'El mapa coordina perspectivas profesionales alrededor de necesidades explícitas. Sirve para orientar producto y recursos; no sustituye evaluación clínica, jurídica, financiera ni pericial.'
  };
}

export function multidisciplinaryLaneCatalog() {
  return Object.entries(laneCatalog).map(([id, value]) => ({ id, ...value }));
}
