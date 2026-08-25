const groups = {
  self_harm: ['suicid', 'matarme', 'quitarme la vida', 'hacerme dano', 'hacerme daño', 'autoles'],
  harm_to_others: ['matar a', 'voy a matar', 'hacerle dano', 'hacerle daño', 'amenaza de muerte'],
  violence_active: ['me esta pegando', 'me está pegando', 'me va a matar', 'violencia ahora', 'secuestr', 'retenid', 'cautiverio'],
  sexual_violence: ['agresion sexual', 'agresión sexual', 'violacion', 'violación', 'abuso sexual', 'sextorsion', 'sextorsión'],
  vulnerable_person: ['maltrato infantil', 'abuso infantil', 'grooming', 'maltrato a mayor', 'persona dependiente', 'cuidador me pega'],
  acute_psychiatric: ['brote psicotico', 'brote psicótico', 'psicosis', 'voces me ordenan', 'mania grave', 'manía grave', 'confusion repentina', 'confusión repentina'],
  overdose_withdrawal: ['sobredosis', 'overdose', 'abstinencia grave', 'delirium tremens', 'intoxicacion grave', 'intoxicación grave'],
  acute_medical: ['no puedo respirar', 'dolor en el pecho', 'perdida de conciencia', 'pérdida de conciencia', 'no puedo mover un lado', 'quemaduras graves'],
  trafficking_coercion: ['trata de personas', 'trabajo forzoso', 'matrimonio forzado', 'control coercitivo', 'explotacion sexual', 'explotación sexual'],
  housing_exposure: ['duermo en la calle', 'sin hogar', 'desahucio hoy', 'sin calefaccion con frio extremo', 'sin calefacción con frío extremo'],
  disaster: ['incendio ahora', 'evacuacion', 'evacuación', 'inundacion', 'inundación', 'terremoto', 'derrumbe', 'explosion', 'explosión']
};

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function containsAny(text, terms) {
  return terms.filter((term) => text.includes(normalize(term)));
}

export function evaluateCriticalSafety({ title = '', story = '' } = {}) {
  const text = normalize(`${title} ${story}`);
  const matches = [];
  for (const [group, terms] of Object.entries(groups)) {
    const found = containsAny(text, terms);
    if (found.length) matches.push({ group, terms: found.slice(0, 3) });
  }

  const immediateGroups = new Set(['self_harm', 'harm_to_others', 'violence_active', 'overdose_withdrawal', 'acute_medical', 'disaster']);
  const urgentGroups = new Set(['sexual_violence', 'vulnerable_person', 'acute_psychiatric', 'trafficking_coercion', 'housing_exposure']);

  const p0 = matches.some((item) => immediateGroups.has(item.group));
  const p1 = !p0 && matches.some((item) => urgentGroups.has(item.group));
  const level = p0 ? 'P0' : p1 ? 'P1' : matches.length ? 'P2' : 'NONE';

  const resources = [];
  if (level === 'P0') resources.push('112');
  if (matches.some((item) => item.group === 'self_harm')) resources.push('024');
  if (matches.some((item) => ['violence_active', 'sexual_violence', 'trafficking_coercion'].includes(item.group))) resources.push('016');

  return {
    version: 1,
    level,
    safety_gateway: level === 'P0' || level === 'P1',
    human_review_required: level !== 'NONE',
    diagnostic: false,
    automated_clinical_decision: false,
    matched_groups: matches,
    official_resources_spain: [...new Set(resources)],
    suppress_commercial_ui: level === 'P0' || level === 'P1'
  };
}

export function criticalSafetyGroups() {
  return Object.keys(groups);
}
