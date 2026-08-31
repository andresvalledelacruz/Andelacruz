const FRAMEWORK_NAMES = [
  'genius','millionaire','detective','psychologist','negotiator','investor','lawyer','redteam','firstprinciples','shark','futureproof',
  '80-20','blindspots','secondorder','leverage','bottleneck','breakthrough','shortcut','simplestpath','edge','moat','blueocean',
  'monetize','sidehustle','businessmodel','revenue','profit','conversion','launch','prelaunch','scale','acquisition','referral',
  'scrollstopper','curiosity','patterninterrupt','clickworthy','retentionhack','openloop','controversy','emotional','relatable','shareable','saveworthy',
  'viralangle','trendjack','contentremix','repurpose','series','contentgap','hookbattle','captionhack','commentbait','storyarc','cliffhanger',
  'brandvoice','luxury','bold','authority','trust','minimal','punchy','dramatic','cinematic','storybrand','analogy',
  'teachback','memoryhack','cheatsheet','crashcourse','masterclass','examiner','tutor','misconceptions','intuition','deepdive','keyinsights',
  'steelman','counterargument','biascheck','tradeoffs','premortem','whatif','stresstest','worstcase','bestcase','probability','signalnoise',
  'reverseengineer','cloneframework','upgrade','compress','expand','transform','extract','rank','score','nextmove','godmode'
];

export const STRATEGIC_FRAMEWORKS = Object.freeze(FRAMEWORK_NAMES.map((id) => Object.freeze({ id, command: `/${id}` })));

export const FRONT_FRAMEWORKS = Object.freeze({
  safety: ['redteam','blindspots','secondorder','premortem','stresstest','worstcase','probability','counterargument','biascheck'],
  human_demand: ['detective','psychologist','contentgap','trendjack','signalnoise','probability','futureproof'],
  cancer: ['detective','psychologist','redteam','blindspots','secondorder','premortem','stresstest','trust','authority','biascheck'],
  accidental_emergencies: ['redteam','blindspots','secondorder','premortem','stresstest','worstcase','probability','simplestpath','teachback'],
  seo_ai_geo: ['80-20','bottleneck','leverage','reverseengineer','authority','trust','contentgap','score','nextmove'],
  ux: ['simplestpath','psychologist','misconceptions','intuition','teachback','minimal','stresstest'],
  international_native_first: ['detective','psychologist','secondorder','blindspots','reverseengineer','futureproof','biascheck'],
  product_readiness: ['firstprinciples','bottleneck','tradeoffs','premortem','stresstest','score','nextmove'],
  backup_dr: ['premortem','worstcase','stresstest','bottleneck','futureproof','nextmove'],
  ethical_business: ['businessmodel','revenue','profit','monetize','conversion','acquisition','referral','tradeoffs','redteam']
});

const PROFESSIONAL_REVIEW = new Set([16,17,18,19,20,21,22,23,24,32,38,40,41,43,44,49,53,61,62,68,77,78,81,82,83,85,92,94,99,101,102,103,104,105,106,108,118,119,120]);
const NOT_APPLICABLE = new Set([2,4,6,7,10,37,45,46,47,55,66,96,100,113]);
const APPLY_NOW = new Set([25,27,29,34,35,36,39,48,52,54,56,57,58,60,63,64,65,67,69,70,71,72,73,74,75,76,79,80,84,87,88,89,90,91,93,95,97,98,109,110,111,112,115,116,117]);

const PROMPT_SECTIONS = [
  [1,15,'modelo_negocio'],[16,24,'legal_fiscal'],[25,34,'marca'],[35,44,'confianza_etica'],[45,55,'copy'],
  [56,62,'operacion_humana'],[63,69,'arquitectura_web'],[70,78,'ux_ui'],[79,87,'contenido'],[88,94,'seo'],
  [95,100,'conversion_analitica'],[101,105,'soporte_sensible'],[106,109,'comunidad'],[110,117,'operativa'],[118,120,'mercado']
];

function sectionFor(id) {
  return PROMPT_SECTIONS.find(([from,to]) => id >= from && id <= to)?.[2];
}

export const BUSINESS_PROMPT_MATRIX = Object.freeze(Array.from({ length: 120 }, (_, index) => {
  const id = index + 1;
  let classification = 'APLICABLE_FUTURO';
  if (PROFESSIONAL_REVIEW.has(id)) classification = 'REQUIERE_PROFESIONAL_ASESORIA';
  if (NOT_APPLICABLE.has(id)) classification = 'NO_APLICABLE_A_DESGRACIAS';
  if (APPLY_NOW.has(id)) classification = 'APLICABLE_AHORA';
  return Object.freeze({ id, section: sectionFor(id), classification });
}));

const SENSITIVE_FLAGS = new Set(['ymyl','health','cancer','minors','mental_health','p0_p1','immediate_risk','sensitive_data','testimonials','legal','fiscal','insurance','referral','professional_services']);
const NON_SENSITIVE_FLAGS = new Set(['operational','seo','ai_geo','ux','accessibility','performance','backup_dr','analytics','content','native_first','product_readiness']);
const SENSITIVE_FRONTS = new Set(['cancer','accidental_emergencies']);
const KNOWN_FRONTS = new Set(Object.keys(FRONT_FRAMEWORKS));

function normalizeToken(value) {
  return String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function selectStrategicFrameworks({ front, flags = [], evidence = [] } = {}) {
  const normalizedFront = normalizeToken(front ?? 'unclassified');
  const unknownFront = !KNOWN_FRONTS.has(normalizedFront);
  const normalizedFlags = new Set(flags.map(normalizeToken).filter(Boolean));
  const knownFlags = new Set([...SENSITIVE_FLAGS, ...NON_SENSITIVE_FLAGS]);
  const unknownFlags = [...normalizedFlags].filter((flag) => !knownFlags.has(flag));
  const selected = new Set(FRONT_FRAMEWORKS[normalizedFront] ?? ['firstprinciples','blindspots','tradeoffs','score','nextmove']);
  const sensitiveFront = SENSITIVE_FRONTS.has(normalizedFront);
  const sensitive = sensitiveFront || [...normalizedFlags].some((flag) => SENSITIVE_FLAGS.has(flag));
  const critical = normalizedFlags.has('p0_p1') || normalizedFlags.has('immediate_risk');
  const requiresReview = sensitive || unknownFlags.length > 0 || unknownFront;

  if (requiresReview) ['redteam','premortem','stresstest','biascheck'].forEach((id) => selected.add(id));

  return {
    version: 1,
    front: normalizedFront,
    unknown_front: unknownFront ? normalizedFront : null,
    frameworks: [...selected].map((id) => `/${id}`),
    evidence_count: evidence.length,
    unknown_flags: unknownFlags,
    decision: critical ? 'SAFETY_GATEWAY' : requiresReview ? 'HUMAN_REVIEW_REQUIRED' : 'PROCEED_WITH_GUARDRAILS',
    monetization_allowed: !requiresReview,
    automated_individual_advice_allowed: false,
    requires_official_current_sources: sensitive,
    requires_human_professional_review: requiresReview,
    prohibitions: ['invented_credentials','fictional_testimonials_as_real','vulnerability_manipulation','dark_patterns','sensitive_targeting']
  };
}

