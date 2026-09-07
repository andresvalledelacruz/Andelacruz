const CLARIFICATION_OPTIONS = Object.freeze([
  Object.freeze({
    id: 'safety_self',
    label: 'Estoy en peligro o temo hacerme daño',
    priority: 100,
    safety_level: 'P0'
  }),
  Object.freeze({
    id: 'safety_other',
    label: 'Me preocupa la seguridad de otra persona',
    priority: 95,
    safety_level: 'P0'
  }),
  Object.freeze({
    id: 'loss_or_grief',
    label: 'Ha ocurrido una muerte, pérdida o duelo',
    priority: 70,
    safety_level: 'UNRESOLVED'
  }),
  Object.freeze({
    id: 'violence_or_fear',
    label: 'Tengo miedo de alguien, sufro violencia o me han agredido',
    priority: 70,
    safety_level: 'UNRESOLVED'
  }),
  Object.freeze({
    id: 'money',
    label: 'El problema principal es dinero, pagos o deudas',
    priority: 50,
    safety_level: 'UNRESOLVED'
  }),
  Object.freeze({
    id: 'work',
    label: 'El problema principal es trabajo, despido o empleo',
    priority: 50,
    safety_level: 'UNRESOLVED'
  }),
  Object.freeze({
    id: 'loneliness_support',
    label: 'Me siento solo/a o necesito apoyo y alguien con quien hablar',
    priority: 45,
    safety_level: 'UNRESOLVED'
  }),
  Object.freeze({
    id: 'something_else',
    label: 'Es otra situación o varias cosas a la vez',
    priority: 10,
    safety_level: 'UNRESOLVED'
  })
]);

function immutableOptions() {
  return Object.freeze(CLARIFICATION_OPTIONS.map((option) => Object.freeze({ ...option })));
}

export function buildSearchClarification(routingResult = {}) {
  const matched = routingResult?.matched === true;
  const needsClarification = routingResult?.needs_clarification === true;

  if (matched || !needsClarification) {
    return Object.freeze({
      version: 1,
      needed: false,
      options: Object.freeze([]),
      safety_first: true,
      suppress_commercial_ui: Boolean(routingResult?.suppress_commercial_ui),
      raw_query_required: false,
      retains_raw_query: false
    });
  }

  return Object.freeze({
    version: 1,
    needed: true,
    title: '¿Se parece más a alguna de estas situaciones?',
    guidance: 'Elige solo si alguna opción encaja. Si ninguna encaja, puedes describirlo de otra forma sin añadir datos personales.',
    options: immutableOptions(),
    safety_first: true,
    suppress_commercial_ui: true,
    raw_query_required: false,
    retains_raw_query: false,
    diagnostic: false,
    automated_clinical_decision: false
  });
}

export function searchClarificationCapabilities() {
  return Object.freeze({
    version: 1,
    safety_first: true,
    fixed_choices_only: true,
    infers_from_raw_query: false,
    retains_raw_query: false,
    suppresses_commerce_while_unresolved: true
  });
}
