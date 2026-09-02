import test from 'node:test';
import assert from 'node:assert/strict';
import { assessNextStepCompass, publicCompassQuestionCatalog } from '../src/next-step-compass.js';

const values = Object.fromEntries(
  publicCompassQuestionCatalog().map((item) => [item.id, item.values])
);

function combinations() {
  const result = [];
  for (const safety_now of values.safety_now) {
    for (const basic_needs of values.basic_needs) {
      for (const impact of values.impact) {
        for (const trend of values.trend) {
          for (const support of values.support) {
            for (const reversibility of values.reversibility) {
              result.push({ safety_now, basic_needs, impact, trend, support, reversibility });
            }
          }
        }
      }
    }
  }
  return result;
}

const matrix = combinations();

test('Compass invariant matrix stays bounded and deterministic', () => {
  assert.equal(matrix.length, 3072);
  for (const answers of matrix) {
    const first = assessNextStepCompass({
      category: 'Familia',
      title: 'Necesito ordenar una situación',
      story: 'Quiero valorar el siguiente paso con calma.',
      answers
    });
    const second = assessNextStepCompass({
      category: 'Familia',
      title: 'Necesito ordenar una situación',
      story: 'Quiero valorar el siguiente paso con calma.',
      answers
    });
    assert.deepEqual(second, first);
    assert.equal(first.diagnostic, false);
    assert.equal(first.automated_clinical_decision, false);
  }
});

test('every explicit yes to immediate safety is IMMEDIATE regardless of protective answers', () => {
  for (const answers of matrix.filter((item) => item.safety_now === 'yes')) {
    const result = assessNextStepCompass({
      category: 'Trabajo',
      title: 'Cambio laboral',
      story: 'Quiero organizar una decisión laboral.',
      answers
    });
    assert.equal(result.complete, true);
    assert.equal(result.outcome, 'IMMEDIATE');
    assert.equal(result.human_review_recommended, true);
    assert.equal(result.suppress_commercial_ui, true);
    assert.equal(result.next_question, null);
  }
});

test('every unsure immediate-safety answer stops at PRIORITY and human review', () => {
  for (const answers of matrix.filter((item) => item.safety_now === 'unsure')) {
    const result = assessNextStepCompass({
      category: 'Dinero',
      title: 'Necesito ordenar gastos',
      story: 'Quiero decidir qué hacer primero.',
      answers
    });
    assert.equal(result.complete, true);
    assert.equal(result.outcome, 'PRIORITY');
    assert.equal(result.human_review_recommended, true);
    assert.equal(result.suppress_commercial_ui, true);
    assert.equal(result.next_question, null);
  }
});

test('an explicit Critical Safety text signal dominates the full protective matrix', () => {
  const protective = {
    safety_now: 'no',
    basic_needs: 'secure',
    impact: 'low',
    trend: 'improving',
    support: 'some',
    reversibility: 'can_wait'
  };
  const result = assessNextStepCompass({
    category: 'Otras historias',
    title: 'Necesito ayuda',
    story: 'Tengo dolor en el pecho y no puedo respirar.',
    answers: protective
  });
  assert.equal(result.safety.safety_gateway, true);
  assert.equal(result.outcome, 'IMMEDIATE');
  assert.equal(result.human_review_recommended, true);
  assert.equal(result.suppress_commercial_ui, true);
});

test('MANAGEABLE is impossible with severe impact or uncovered basic needs', () => {
  for (const answers of matrix.filter((item) => item.safety_now === 'no')) {
    if (answers.impact !== 'severe' && answers.basic_needs !== 'not_secure') continue;
    const result = assessNextStepCompass({
      category: 'Familia',
      title: 'Necesito ordenar una situación',
      story: 'Quiero decidir el siguiente paso.',
      answers
    });
    assert.notEqual(result.outcome, 'MANAGEABLE');
  }
});

test('noncritical financial pressure preserves financial routing across priority outcomes', () => {
  const result = assessNextStepCompass({
    category: 'Dinero',
    title: 'No cubro gastos esenciales',
    story: 'Necesito ordenar pagos y recursos prácticos.',
    answers: {
      safety_now: 'no',
      basic_needs: 'not_secure',
      impact: 'moderate',
      trend: 'stable',
      support: 'one',
      reversibility: 'can_wait'
    }
  });
  assert.equal(result.outcome, 'PRIORITY');
  assert.equal(result.routing.primary_route.id, 'financial_practical');
  assert.notEqual(result.routing.primary_route.id, 'clinical_review');
  assert.equal(result.automated_clinical_decision, false);
});
