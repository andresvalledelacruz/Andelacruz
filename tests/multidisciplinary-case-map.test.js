import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMultidisciplinaryCaseMap } from '../src/multidisciplinary-case-map.js';

test('maps dismissal into work plus practical dimensions without diagnosis', () => {
  const result = buildMultidisciplinaryCaseMap({
    category: 'Trabajo',
    title: 'Me han despedido con 55 años',
    story: 'Tengo miedo por el dinero, no sé cómo buscar empleo y me está afectando mucho.',
    needs: ['recursos_practicos']
  });
  assert.equal(result.framework, 'multidisciplinary_non_diagnostic');
  assert.equal(result.diagnostic, false);
  assert.equal(result.primary_need.id, 'work_career');
  assert.ok(result.disciplines.includes('Psicología del trabajo'));
  assert.equal(result.guardrails.practical_needs_not_automatically_psychologized, true);
});

test('maps separation with custody into relational and legal lanes', () => {
  const result = buildMultidisciplinaryCaseMap({
    category: 'Pareja y Rupturas',
    title: 'Separación con hijos',
    story: 'Estamos en divorcio, discutimos por la custodia de nuestros hijos y necesito saber por dónde empezar.'
  });
  const ids = result.dimensions.map((item) => item.route_id);
  assert.ok(ids.includes('relationship_family'));
  assert.ok(ids.includes('legal_mediation'));
  assert.ok(result.disciplines.includes('Mediación'));
  assert.ok(result.disciplines.includes('Derecho'));
});

test('keeps loneliness primarily social/community when no clinical impairment is explicit', () => {
  const result = buildMultidisciplinaryCaseMap({
    category: 'Soledad',
    title: 'Estoy solo después de mudarme',
    story: 'No conozco a nadie aquí y echo de menos tener amigos con los que hablar.'
  });
  assert.equal(result.primary_need.id, 'social_community');
  assert.equal(result.next_step_class, 'non_clinical_guidance_first');
});

test('urgent safety language requires human review and blocks automatic clinical conclusions', () => {
  const result = buildMultidisciplinaryCaseMap({
    category: 'Otras historias',
    title: 'Necesito ayuda',
    story: 'Estoy pensando en quitarme la vida y no sé qué hacer.'
  });
  assert.equal(result.urgent_human_review, true);
  assert.equal(result.next_step_class, 'human_safety_review');
  assert.equal(result.clinical_or_forensic_opinion, false);
  assert.equal(result.guardrails.human_review_for_urgent_safety, true);
});
