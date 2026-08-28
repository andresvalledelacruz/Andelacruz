import test from 'node:test';
import assert from 'node:assert/strict';
import { CANDIDATE_PAGES } from '../opportunity/candidate-pages.mjs';
import { buildDecisionReport, decisionReportToMarkdown } from '../opportunity/decision-report.mjs';

test('decision report categorizes the production portfolio',()=>{
  const report=buildDecisionReport(CANDIDATE_PAGES,{policy:{limit:20,maxPerDomain:6,maxHighRisk:5,reserveLowRisk:6}});
  const total=report.buildNow.length+report.readyNext.length+report.researchFirst.length;
  assert.equal(total,20);
  assert.ok(report.summary.total===20);
});

test('every active queue item has an explicit decision',()=>{
  const report=buildDecisionReport(CANDIDATE_PAGES);
  const rows=[...report.buildNow,...report.readyNext,...report.researchFirst];
  assert.ok(rows.every(x=>['BUILD_NOW','READY_NEXT','RESEARCH_FIRST'].includes(x.decision)));
});

test('markdown report contains executive sections',()=>{
  const md=decisionReportToMarkdown(buildDecisionReport(CANDIDATE_PAGES));
  assert.match(md,/Construir ahora/);
  assert.match(md,/Investigar primero/);
  assert.match(md,/Esperar más datos/);
  assert.match(md,/Metodología/);
});
