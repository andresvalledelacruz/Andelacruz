import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExecutiveDecision } from '../src/executive-decision-engine.js';

test('ordinary user case exposes the next adaptive compass question', () => {
  const result = evaluateExecutiveDecision({
    kind: 'user_case',
    category: 'Trabajo',
    title: 'He perdido el empleo',
    story: 'Quiero ordenar los próximos pasos sin precipitarme.'
  });

  assert.equal(result.decision, 'ROUTE_WITH_GUARDRAILS');
  assert.equal(result.next_step_compass.complete, false);
  assert.equal(result.next_step_compass.next_question.id, 'safety_now');
  assert.equal(result.next_step_compass.diagnostic, false);
});

test('explicit compass safety answer closes commercial UI even without keyword trigger', () => {
  const result = evaluateExecutiveDecision({
    kind: 'user_case',
    category: 'Otras historias',
    title: 'Necesito orientación',
    story: 'No sé cuál es el siguiente paso.',
    compass_answers: {
      safety_now: 'yes'
    }
  });

  assert.equal(result.next_step_compass.outcome, 'IMMEDIATE');
  assert.equal(result.decision, 'SAFETY_GATEWAY');
  assert.equal(result.commercial_ui_allowed, false);
  assert.equal(result.analytics_mode, 'minimal_aggregate_only');
});

test('manageable work case remains multidisciplinary and non-clinical', () => {
  const result = evaluateExecutiveDecision({
    kind: 'user_case',
    category: 'Trabajo',
    title: 'Quiero cambiar de trabajo',
    story: 'Estoy valorando opciones y quiero hacerlo con calma.',
    compass_answers: {
      safety_now: 'no',
      basic_needs: 'secure',
      impact: 'low',
      support: 'one'
    }
  });

  assert.equal(result.next_step_compass.complete, true);
  assert.equal(result.next_step_compass.outcome, 'MANAGEABLE');
  assert.equal(result.decision, 'ROUTE_WITH_GUARDRAILS');
  assert.equal(result.multidisciplinary.primary_need.id, 'work_career');
  assert.equal(result.diagnostic, false);
});

test('priority financial case does not become an automatic clinical decision', () => {
  const result = evaluateExecutiveDecision({
    kind: 'user_case',
    category: 'Dinero',
    title: 'No cubro gastos esenciales',
    story: 'Necesito ordenar pagos y recursos prácticos.',
    compass_answers: {
      safety_now: 'no',
      basic_needs: 'not_secure',
      impact: 'moderate'
    }
  });

  assert.equal(result.next_step_compass.outcome, 'PRIORITY');
  assert.equal(result.next_step_compass.automated_clinical_decision, false);
  assert.equal(result.multidisciplinary.primary_need.id, 'financial_practical');
  assert.notEqual(result.decision, 'SAFETY_GATEWAY');
});
