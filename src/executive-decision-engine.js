import { evaluateCriticalSafety } from './critical-safety-taxonomy.js';
import { buildMultidisciplinaryCaseMap } from './multidisciplinary-case-map.js';

const productWeights = {
  user_value: 0.20,
  evidence_strength: 0.08,
  ux_clarity: 0.10,
  engineering_readiness: 0.10,
  security_privacy: 0.12,
  safety: 0.12,
  google_quality: 0.08,
  measurement: 0.06,
  business_value: 0.08,
  maintainability: 0.06
};

const hardBlockCatalog = {
  exploits_vulnerability: 'La propuesta obtiene conversión o ingresos explotando vulnerabilidad o sufrimiento.',
  sensitive_targeting: 'Usa salud mental, violencia, duelo, deuda u otros datos sensibles para targeting/remarketing.',
  bypasses_human_safety_review: 'Permite que una decisión crítica de seguridad o clínica evite revisión humana.',
  publishes_unreviewed_ymyl: 'Publica orientación YMYL sensible sin el control editorial/profesional exigible.',
  exposes_secrets_or_pii: 'Expone secretos, credenciales o datos personales innecesarios.',
  nonessential_tracking_without_consent: 'Activa medición o publicidad no esencial sin el consentimiento aplicable.',
  paid_verification_or_quality_badge: 'Permite comprar una insignia que implique calidad o verificación profesional.',
  deceptive_cro: 'Usa presión, dark patterns o mensajes engañosos para aumentar conversión.'
};

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(5, Math.max(0, number));
}

function normalizedProductScores(scores = {}) {
  return Object.fromEntries(
    Object.keys(productWeights).map((key) => [key, clampScore(scores[key])])
  );
}

function weightedProductScore(scores) {
  return Math.round(
    Object.entries(productWeights).reduce(
      (total, [key, weight]) => total + (scores[key] / 5) * 100 * weight,
      0
    )
  );
}

function productRequirements(scores) {
  const requirements = [];
  if (scores.user_value < 3) requirements.push('Demostrar mejor el valor real para la persona usuaria.');
  if (scores.ux_clarity < 3) requirements.push('Resolver fricción o ambigüedad de UX antes de escalar.');
  if (scores.engineering_readiness < 3) requirements.push('Completar arquitectura, pruebas, observabilidad o rollback.');
  if (scores.security_privacy < 4) requirements.push('Revisión de seguridad/privacidad obligatoria.');
  if (scores.safety < 4) requirements.push('Revisión Trust & Safety obligatoria.');
  if (scores.google_quality < 3) requirements.push('Revisar impacto SEO/Search/Ads y evitar contenido o adquisición de baja calidad.');
  if (scores.measurement < 3) requirements.push('Definir evento, outcome y criterio de éxito antes de escalar.');
  if (scores.business_value < 2) requirements.push('Aclarar coste, retorno o valor estratégico antes de invertir más capacidad.');
  if (scores.maintainability < 3) requirements.push('Reducir deuda técnica o coste operacional futuro.');
  return requirements;
}

function evaluateProductChange(input = {}) {
  const scores = normalizedProductScores(input.scores);
  const hardBlocks = Object.entries(hardBlockCatalog)
    .filter(([key]) => input.hard_blocks?.[key] === true)
    .map(([id, reason]) => ({ id, reason }));

  const score = weightedProductScore(scores);
  const requirements = productRequirements(scores);

  let decision = 'EXPERIMENT';
  if (hardBlocks.length) decision = 'BLOCKED';
  else if (scores.security_privacy < 3 || scores.safety < 3) decision = 'HOLD';
  else if (score >= 80 && requirements.length <= 2) decision = 'SCALE_CANDIDATE';
  else if (score < 55) decision = 'HOLD';

  return {
    version: 1,
    decision_type: 'product_change',
    decision,
    score,
    scores,
    hard_blocks: hardBlocks,
    requirements,
    authority_order: [
      'critical_safety',
      'privacy_security',
      'human_user_value',
      'ux_accessibility',
      'engineering_quality',
      'google_growth_measurement',
      'business_economics'
    ],
    required_councils: [
      'Human Multidisciplinary Council',
      'Digital Product & Engineering Council',
      'Trust & Safety Council',
      'Google Engineering & Growth Council'
    ],
    guardrails: {
      safety_can_block_business: true,
      privacy_can_block_growth: true,
      human_value_can_block_cro: true,
      no_sensitive_commercial_targeting: true,
      no_vanity_metric_approval: true
    }
  };
}

function evaluateUserCase(input = {}) {
  const safety = evaluateCriticalSafety(input);
  const multidisciplinary = buildMultidisciplinaryCaseMap(input);

  const decision = safety.safety_gateway
    ? 'SAFETY_GATEWAY'
    : multidisciplinary.urgent_human_review
      ? 'HUMAN_REVIEW'
      : 'ROUTE_WITH_GUARDRAILS';

  return {
    version: 1,
    decision_type: 'user_case',
    decision,
    safety,
    multidisciplinary,
    commercial_ui_allowed: !safety.suppress_commercial_ui,
    analytics_mode: safety.safety_gateway ? 'minimal_aggregate_only' : 'privacy_minimized',
    diagnostic: false,
    forensic_opinion: false,
    human_override_supported: true
  };
}

export function evaluateExecutiveDecision(input = {}) {
  if (input.kind === 'user_case') return evaluateUserCase(input);
  if (input.kind === 'product_change') return evaluateProductChange(input);
  return {
    version: 1,
    decision_type: 'invalid',
    decision: 'HOLD',
    error: 'kind_must_be_user_case_or_product_change'
  };
}

export function executiveDecisionFramework() {
  return {
    product_weights: productWeights,
    hard_blocks: hardBlockCatalog,
    product_thresholds: {
      scale_candidate: 80,
      hold_below: 55,
      minimum_security_privacy: 3,
      minimum_safety: 3
    }
  };
}
