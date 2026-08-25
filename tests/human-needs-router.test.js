import test from 'node:test';
import assert from 'node:assert/strict';
import { routeHumanNeeds } from '../src/human-needs-router.js';

test('prioritizes work/career for dismissal without medicalizing by default', () => {
  const result = routeHumanNeeds({
    category: 'Trabajo',
    title: 'Me han despedido con 55 años',
    story: 'Me preocupa el empleo y el dinero y no sé por dónde empezar.',
    needs: ['recursos_practicos']
  });
  assert.equal(result.diagnostic, false);
  assert.equal(result.urgent_human_review, false);
  assert.equal(result.primary_route.id, 'work_career');
});

test('combines relationship and legal needs when custody is explicit', () => {
  const result = routeHumanNeeds({
    category: 'Pareja y Rupturas',
    title: 'Separación complicada',
    story: 'Estamos en divorcio y tenemos un conflicto por la custodia de nuestros hijos.'
  });
  const ids = [result.primary_route, ...result.secondary_routes].map((item) => item.id);
  assert.ok(ids.includes('relationship_family'));
  assert.ok(ids.includes('legal_mediation'));
});

test('routes loneliness toward community rather than automatically toward clinical care', () => {
  const result = routeHumanNeeds({
    category: 'Soledad',
    title: 'Me he mudado y estoy solo',
    story: 'No conozco a nadie en esta ciudad y echo de menos tener amigos.'
  });
  assert.equal(result.primary_route.id, 'social_community');
  assert.notEqual(result.primary_route.id, 'clinical_review');
});

test('explicit immediate self-harm language overrides normal routing and requires human review', () => {
  const result = routeHumanNeeds({
    category: 'Otras historias',
    title: 'No puedo más',
    story: 'Estoy pensando en quitarme la vida y necesito ayuda.'
  });
  assert.equal(result.urgent_human_review, true);
  assert.equal(result.primary_route.id, 'urgent_safety');
  assert.equal(result.automated_clinical_decision, false);
});

test('requests for professional orientation do not become diagnoses', () => {
  const result = routeHumanNeeds({
    category: 'Autoestima',
    title: 'No me reconozco',
    story: 'Estoy agotado y no duermo bien desde hace semanas.',
    needs: ['orientacion_profesional']
  });
  assert.equal(result.diagnostic, false);
  assert.ok(result.secondary_routes.some((item) => item.id === 'clinical_review') || result.primary_route.id === 'clinical_review');
});
