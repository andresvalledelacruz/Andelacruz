import { CANDIDATE_PAGES } from '../opportunity/candidate-pages.mjs';
import { rankCandidates } from '../opportunity/scoring.mjs';

const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const domainArg = process.argv.find(arg => arg.startsWith('--domain='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 20;
const domain = domainArg ? domainArg.split('=')[1] : null;
const candidates = domain ? CANDIDATE_PAGES.filter(item => item.domain === domain) : CANDIDATE_PAGES;
const ranked = rankCandidates(candidates, { limit });

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  methodology: 'userValue 40% + seoValue 25% + commercialValue 25% + strategicFit 10% - risk penalty; confidence adjusts priority',
  warning: 'SEO and commercial inputs are hypotheses until replaced with measured data.',
  filters: { domain, limit },
  results: ranked
}, null, 2));
