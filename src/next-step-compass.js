import { evaluateCriticalSafety } from './critical-safety-taxonomy.js';
import { routeHumanNeeds } from './human-needs-router.js';

const QUESTIONS = [
  { id: 'safety_now', values: ['yes', 'no', 'unsure'] },
  { id: 'basic_needs', values: ['secure', 'strained', 'not_secure', 'unsure'] },
  { id: 'impact', values: ['low', 'moderate', 'high', 'severe'] },
  { id: 'trend', values: ['improving', 'stable', 'worsening', 'unsure'] },
  { id: 'support', values: ['none', 'one', 'some', 'unsure'] },
  { id: 'reversibility', values: ['can_wait', 'cannot_wait', 'no_decision', 'unsure'] }
];

const OUTCOME_TEXT = {
  IMMEDIATE: 'La seguridad tiene prioridad sobre cualquier otra ruta.',
  PRIORITY: 'La situación necesita atención prioritaria.',
  PROGRESSIVE: 'La situación es importante y puede abordarse por pasos, revisando su evolución.',
  MANAGEABLE: 'La situación parece manejable con los recursos actuales y acciones pequeñas; eso no significa que no importe.'
};

function sanitize(raw = {}) {
  const result = {};
  for (const question of QUESTIONS) {
    if (question.values.includes(raw[question.id])) result[question.id] = raw[question.id];
  }
  return result;
}

function has(answers, id) {
  return Object.prototype.hasOwnProperty.call(answers, id);
}

function question(id) {
  const item = QUESTIONS.find((entry) => entry.id === id);
  return item ? { ...item, values: [...item.values] } : null;
}

function collectFactors(answers) {
  const protective = [];
  const concerns = [];

  if (answers.basic_needs === 'secure') protective.push('Necesidades básicas cubiertas.');
  if (answers.basic_needs === 'strained') concerns.push('Necesidades básicas bajo presión.');
  if (answers.basic_needs === 'not_secure') concerns.push('Necesidades básicas o cuidados imprescindibles sin cubrir.');

  if (answers.impact === 'low') protective.push('Funcionamiento cotidiano conservado en gran medida.');
  if (answers.impact === 'moderate') concerns.push('Afectación moderada del funcionamiento cotidiano.');
  if (answers.impact === 'high') concerns.push('Afectación alta del funcionamiento cotidiano.');
  if (answers.impact === 'severe') concerns.push('Afectación muy alta del funcionamiento cotidiano.');

  if (answers.trend === 'improving') protective.push('Tendencia declarada favorable.');
  if (answers.trend === 'stable') protective.push('Sin empeoramiento declarado.');
  if (answers.trend === 'worsening') concerns.push('La situación está empeorando según la persona.');

  if (['one', 'some'].includes(answers.support)) protective.push('Existe apoyo seguro disponible.');
  if (answers.support === 'none') concerns.push('No se ha identificado apoyo seguro disponible.');

  if (['can_wait', 'no_decision'].includes(answers.reversibility)) protective.push('No hay presión inmediata hacia una decisión irreversible.');
  if (answers.reversibility === 'cannot_wait') concerns.push('Existe presión para una decisión importante no aplazable.');

  return { protective, concerns };
}

function nextQuestion(answers, safety) {
  if (!safety.safety_gateway && !has(answers, 'safety_now')) return question('safety_now');
  if (!has(answers, 'basic_needs')) return question('basic_needs');
  if (!has(answers, 'impact')) return question('impact');
  if (answers.impact === 'severe' || answers.basic_needs === 'not_secure') return null;

  if (['moderate', 'high'].includes(answers.impact) && !has(answers, 'trend')) return question('trend');
  if (answers.impact === 'high' && answers.trend === 'worsening') return null;

  if (!has(answers, 'support')) return question('support');
  if (answers.impact === 'low' && ['one', 'some'].includes(answers.support)) return null;
  if (answers.impact === 'high' && answers.support === 'none') return null;

  if (!has(answers, 'reversibility')) return question('reversibility');
  return null;
}

function outcome(answers, safety) {
  if (safety.safety_gateway || answers.safety_now === 'yes') return 'IMMEDIATE';
  if (answers.safety_now === 'unsure') return 'PRIORITY';
  if (answers.basic_needs === 'not_secure' || answers.impact === 'severe') return 'PRIORITY';
  if (answers.impact === 'high' && answers.trend === 'worsening') return 'PRIORITY';
  if (answers.impact === 'high' && answers.support === 'none') return 'PRIORITY';
  if (answers.reversibility === 'cannot_wait' && ['moderate', 'high'].includes(answers.impact)) return 'PRIORITY';

  if (answers.basic_needs === 'strained') return 'PROGRESSIVE';
  if (['moderate', 'high'].includes(answers.impact)) return 'PROGRESSIVE';
  if (answers.trend === 'worsening' || answers.support === 'none' || answers.reversibility === 'cannot_wait') return 'PROGRESSIVE';
  return 'MANAGEABLE';
}

export function assessNextStepCompass({ category = '', title = '', story = '', needs = [], answers: raw = {} } = {}) {
  const answers = sanitize(raw);
  const safety = evaluateCriticalSafety({ title, story });
  const routing = routeHumanNeeds({ category, title, story, needs });
  const resilience = collectFactors(answers);

  if (safety.safety_gateway || answers.safety_now === 'yes') {
    return {
      version: 1,
      diagnostic: false,
      automated_clinical_decision: false,
      complete: true,
      outcome: 'IMMEDIATE',
      explanation: OUTCOME_TEXT.IMMEDIATE,
      next_question: null,
      safety,
      routing,
      resilience
    };
  }

  const pending = nextQuestion(answers, safety);
  if (pending) {
    return {
      version: 1,
      diagnostic: false,
      automated_clinical_decision: false,
      complete: false,
      outcome: null,
      explanation: 'Se pregunta solo lo necesario para orientar sin dramatizar ni minimizar.',
      next_question: pending,
      safety,
      routing,
      resilience
    };
  }

  const level = outcome(answers, safety);
  return {
    version: 1,
    diagnostic: false,
    automated_clinical_decision: false,
    complete: true,
    outcome: level,
    explanation: OUTCOME_TEXT[level],
    next_question: null,
    safety,
    routing,
    resilience
  };
}

export function publicCompassQuestionCatalog() {
  return QUESTIONS.map((item) => ({ ...item, values: [...item.values] }));
}
