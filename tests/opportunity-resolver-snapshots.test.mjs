import test from 'node:test';
import assert from 'node:assert/strict';
import { attachCandidateId, resolveCandidate, resolverCoverage } from '../opportunity/candidate-resolver.mjs';
import { compareSnapshots, createRankingSnapshot, detectMovers } from '../opportunity/ranking-snapshots.mjs';

test('resolver maps exact candidate path', () => {
  const result = resolveCandidate({ path: '/trabajo/quiero-cambiar-de-trabajo-pero-no-se-a-que/' });
  assert.equal(result.candidate.id, 'work-change-job');
  assert.equal(result.method, 'exact_path');
});

test('resolver accepts full URLs and can attach id', () => {
  const row = attachCandidateId({ url: 'https://desgracias.es/soledad/quiero-conocer-gente/?utm_source=x' });
  assert.equal(row.candidateId, 'relations-meet-people');
  assert.equal(row.path, '/soledad/quiero-conocer-gente/');
});

test('coverage reports unresolved rows', () => {
  const summary = resolverCoverage([{ path:'/trabajo/quiero-cambiar-de-trabajo-pero-no-se-a-que/' }, { path:'/ruta-inexistente/' }]);
  assert.equal(summary.total, 2);
  assert.equal(summary.resolved, 1);
});

test('snapshot comparison detects rank and score changes', () => {
  const prev = createRankingSnapshot([{ rank:1,id:'a',slug:'/a/',title:'A',domain:'x',score:70,confidence:.5,risk:'low',evidence:{resolution:{evidenceCoverage:.2}} },{ rank:2,id:'b',slug:'/b/',title:'B',domain:'x',score:68,confidence:.5,risk:'low',evidence:{resolution:{evidenceCoverage:.2}} }], { createdAt:'2026-08-01' });
  const curr = createRankingSnapshot([{ rank:1,id:'b',slug:'/b/',title:'B',domain:'x',score:80,confidence:.7,risk:'low',evidence:{resolution:{evidenceCoverage:.8}} },{ rank:2,id:'a',slug:'/a/',title:'A',domain:'x',score:69,confidence:.5,risk:'low',evidence:{resolution:{evidenceCoverage:.2}} }], { createdAt:'2026-08-08' });
  const changes = compareSnapshots(prev, curr);
  assert.equal(changes.find(x => x.id === 'b').rankDelta, 1);
  assert.equal(changes.find(x => x.id === 'b').scoreDelta, 12);
  assert.ok(detectMovers(prev, curr, { minRankDelta:1 }).length >= 1);
});
