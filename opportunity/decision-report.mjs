import { buildProductionQueue, PRODUCTION_STATES, queueSummary } from './production-queue.mjs';
import { rankCandidates } from './scoring.mjs';

function reasonText(item) {
  const parts = [];
  if (item.score >= 70) parts.push('high_priority_score');
  if (item.confidence >= 0.60) parts.push('good_confidence');
  if (item.confidence < 0.48) parts.push('needs_more_evidence');
  if (item.risk === 'high' || item.risk === 'critical') parts.push('sensitive_manual_review');
  if (item.evidenceCoverage >= 0.50) parts.push('measured_evidence_present');
  return [...new Set([...(item.reasons || []), ...parts])];
}

export function buildDecisionReport(candidates = [], options = {}) {
  const queue = buildProductionQueue(candidates, options);
  const queuedIds = new Set(queue.map(x => x.candidateId));
  const rankedAll = rankCandidates(candidates, { limit:candidates.length, evidenceByCandidate:options.evidenceByCandidate || {} });

  const buildNow = queue.filter(x => x.state === PRODUCTION_STATES.BUILD).map(x => ({ ...x, decision:'BUILD_NOW', reasons:reasonText(x) }));
  const researchFirst = queue.filter(x => x.state === PRODUCTION_STATES.RESEARCH).map(x => ({ ...x, decision:'RESEARCH_FIRST', reasons:reasonText(x) }));
  const readyNext = queue.filter(x => x.state === PRODUCTION_STATES.READY).map(x => ({ ...x, decision:'READY_NEXT', reasons:reasonText(x) }));
  const waitForData = rankedAll.filter(x => !queuedIds.has(x.id) && x.confidence < 0.48).slice(0,10).map(x => ({ candidateId:x.id,title:x.title,slug:x.slug,domain:x.domain,score:x.score,confidence:x.confidence,risk:x.risk,decision:'WAIT_FOR_DATA',reasons:reasonText({ ...x, evidenceCoverage:x.evidence?.resolution?.evidenceCoverage ?? 0 }) }));
  const hold = rankedAll.filter(x => !queuedIds.has(x.id) && x.confidence >= 0.48).slice(0,10).map(x => ({ candidateId:x.id,title:x.title,slug:x.slug,domain:x.domain,score:x.score,confidence:x.confidence,risk:x.risk,decision:'HOLD',reasons:reasonText({ ...x, evidenceCoverage:x.evidence?.resolution?.evidenceCoverage ?? 0 }) }));

  return Object.freeze({
    generatedAt: new Date().toISOString(),
    summary: queueSummary(queue),
    buildNow:Object.freeze(buildNow),
    readyNext:Object.freeze(readyNext),
    researchFirst:Object.freeze(researchFirst),
    waitForData:Object.freeze(waitForData),
    hold:Object.freeze(hold),
    methodology:Object.freeze({
      principle:'user_value_plus_seo_plus_commercial_plus_strategic_fit_minus_risk',
      note:'Measured evidence increases confidence but does not override safety, portfolio balance, or manual review requirements.'
    })
  });
}

export function decisionReportToMarkdown(report) {
  const section = (title, rows) => {
    const lines = [`## ${title}`];
    if (!rows.length) return [...lines, '- Ninguna.'].join('\n');
    for (const x of rows) lines.push(`- ${x.title} — score ${x.score}, confianza ${x.confidence}, riesgo ${x.risk}, dominio ${x.domain}. Motivos: ${(x.reasons || []).join(', ') || 'n/a'}.`);
    return lines.join('\n');
  };
  return [
    '# Desgracias.es — Opportunity Decision Report',
    `Generado: ${report.generatedAt}`,
    `Total en cartera: ${report.summary.total}. Alto riesgo: ${report.summary.highRisk}. Bajo riesgo: ${report.summary.lowRisk}.`,
    section('Construir ahora', report.buildNow),
    section('Preparadas para la siguiente tanda', report.readyNext),
    section('Investigar primero', report.researchFirst),
    section('Esperar más datos', report.waitForData),
    section('Mantener en cartera', report.hold),
    '## Metodología',
    report.methodology.note
  ].join('\n\n');
}
