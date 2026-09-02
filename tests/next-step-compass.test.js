import test from 'node:test';
import assert from 'node:assert/strict';
import { assessNextStepCompass, publicCompassQuestionCatalog } from '../src/next-step-compass.js';

test('starts with the minimum safety question when no critical signal is explicit', () => {
  const result = assessNextStepCompass({
    category: 'Trabajo',
    title: 'He perdido el empleo',
    story: 'Estoy preocupado y quiero ordenar los próximos pasos.'
  });
  assert.equal(result.complete, false);
  assert.equal(result.next_question.id, 'safety_now');
  assert.equal(result.diagnostic, false);
});

test('critical Safety Gateway short-circuits the microbattery', () => {
  const result = assessNextStepCompass({
    category: 'Otras historias',
    title: 'Necesito ayuda',
    story: 'Tengo dolor en el pecho y no puedo respirar.'
  });
  assert.equal(result.complete, true);
  assert.equal(result.outcome, 'IMMEDIATE');
  assert.equal(result.safety.safety_gateway, true);
  assert.equal(result.next_question, null);
});

test('low impact plus covered basics and support can finish as manageable without six questions', () => {
  const result = assessNextStepCompass({
    category: 'Familia',
    title: 'He discutido con mi hermano',
    story: 'Me ha dolido y quiero decidir cómo hablarlo.',
    answers: {
      safety_now: 'no',
      basic_needs: 'secure',
      impact: 'low',
      support: 'one'
    }
  });
  assert.equal(result.complete, true);
  assert.equal(result.outcome, 'MANAGEABLE');
  assert.match(result.explanation, /no significa que no importe/i);
  assert.ok(result.resilience.protective.length >= 3);
});

test('high and worsening impact is priority without forcing remaining questions', () => {
  const result = assessNextStepCompass({
    category: 'Soledad',
    title: 'Cada día me cuesta más',
    story: 'La situación me está afectando mucho.',
    answers: {
      safety_now: 'no',
      basic_needs: 'secure',
      impact: 'high',
      trend: 'worsening'
    }
  });
  assert.equal(result.complete, true);
  assert.equal(result.outcome, 'PRIORITY');
  assert.equal(result.next_question, null);
});

test('uncovered basic needs are prioritized independently of psychological framing', () => {
  const result = assessNextStepCompass({
    category: 'Dinero',
    title: 'No llego a final de mes',
    story: 'Necesito ordenar facturas y gastos esenciales.',
    answers: {
      safety_now: 'no',
      basic_needs: 'not_secure',
      impact: 'moderate'
    }
  });
  assert.equal(result.complete, true);
  assert.equal(result.outcome, 'PRIORITY');
  assert.equal(result.routing.primary_route.id, 'financial_practical');
  assert.notEqual(result.routing.primary_route.id, 'clinical_review');
});

test('moderate impact with resources remains progressive rather than automatically clinical', () => {
  const result = assessNextStepCompass({
    category: 'Trabajo',
    title: 'Estoy buscando trabajo',
    story: 'Llevo semanas buscando empleo y necesito un plan realista.',
    answers: {
      safety_now: 'no',
      basic_needs: 'secure',
      impact: 'moderate',
      trend: 'stable',
      support: 'some',
      reversibility: 'can_wait'
    }
  });
  assert.equal(result.complete, true);
  assert.equal(result.outcome, 'PROGRESSIVE');
  assert.equal(result.routing.primary_route.id, 'work_career');
  assert.equal(result.automated_clinical_decision, false);
});

test('question catalog is bounded to six adaptive dimensions', () => {
  const questions = publicCompassQuestionCatalog();
  assert.equal(questions.length, 6);
  assert.deepEqual(questions.map((item) => item.id), [
    'safety_now',
    'basic_needs',
    'impact',
    'trend',
    'support',
    'reversibility'
  ]);
});
