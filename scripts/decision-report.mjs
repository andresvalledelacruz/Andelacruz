import { CANDIDATE_PAGES } from '../opportunity/candidate-pages.mjs';
import { buildDecisionReport, decisionReportToMarkdown } from '../opportunity/decision-report.mjs';

const report = buildDecisionReport(CANDIDATE_PAGES, { policy:{ limit:20, maxPerDomain:6, maxHighRisk:5, reserveLowRisk:6 } });
process.stdout.write(decisionReportToMarkdown(report) + '\n');
