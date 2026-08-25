import test from 'node:test';
import assert from 'node:assert/strict';
import { buildModerationTriage, sortModerationItems, moderationTriageSummary } from '../src/moderation-triage.js';

test('P0 self-harm language receives emergency priority and safety gateway', () => {
  const triage = buildModerationTriage({
    category: 'Otras historias',
    title: 'Necesito ayuda ahora',
    story: 'Estoy pensando en quitarme la vida y necesito ayuda inmediata.'
  });
  assert.equal(triage.safety_level, 'P0');
  assert.equal(triage.priority_label, 'EMERGENCIA');
  assert.equal(triage.safety_gateway, true);
  assert.ok(triage.official_resources_spain.includes('112'));
  assert.ok(triage.official_resources_spain.includes('024'));
});

test('ordinary work distress remains normal triage and routes to work/career', () => {
  const triage = buildModerationTriage({
    category: 'Trabajo',
    title: 'Me han despedido con 55 años',
    story: 'Estoy preocupado por encontrar empleo y organizar mis gastos durante los próximos meses.'
  });
  assert.equal(triage.safety_level, 'NONE');
  assert.equal(triage.priority_label, 'NORMAL');
  assert.equal(triage.primary_need_id, 'work_career');
});

test('queue sorting puts P0 before P1/P2/normal and keeps oldest first within same priority', () => {
  const items = [
    { id: 'normal', enqueued_at: '2026-08-25T10:00:00Z', triage: { priority_rank: 100 } },
    { id: 'p0-new', enqueued_at: '2026-08-25T12:00:00Z', triage: { priority_rank: 400 } },
    { id: 'p0-old', enqueued_at: '2026-08-25T11:00:00Z', triage: { priority_rank: 400 } },
    { id: 'p1', enqueued_at: '2026-08-25T09:00:00Z', triage: { priority_rank: 300 } }
  ];
  assert.deepEqual(sortModerationItems(items).map((item) => item.id), ['p0-old', 'p0-new', 'p1', 'normal']);
});

test('summary reports critical queue distribution without exposing story text', () => {
  const summary = moderationTriageSummary([
    { triage: { safety_level: 'P0', safety_gateway: true } },
    { triage: { safety_level: 'P1', safety_gateway: true } },
    { triage: { safety_level: 'NONE', safety_gateway: false } }
  ]);
  assert.deepEqual(summary, { P0: 1, P1: 1, P2: 0, NONE: 1, safety_gateway: 2, total: 3 });
});
