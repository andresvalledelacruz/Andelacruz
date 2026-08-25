import crypto from 'node:crypto';

const suspiciousPhrases = [
  'buy followers','casino bonus','crypto giveaway','free money','seo backlink','viagra','cheap pills',
  'http://','https://','<script','javascript:','select * from','union select','drop table','onerror=',
  'discord.gg/','t.me/','wa.me/'
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function entropyLike(text) {
  if (!text) return 0;
  const unique = new Set(text).size;
  return unique / Math.max(text.length, 1);
}

export function hashAbuseKey(value, pepper = '') {
  return crypto.createHash('sha256').update(`desgracias-abuse:v1:${pepper}:${String(value || '')}`).digest('hex');
}

export function evaluateSubmissionIntegrity({
  title = '',
  story = '',
  alias = '',
  website = '',
  elapsed_ms = null,
  duplicate_count_24h = 0,
  submissions_10m = 0,
  challenge_passed = null,
  headers = {}
} = {}) {
  const joined = normalize(`${title} ${story} ${alias}`);
  const signals = [];
  let risk = 0;

  if (website) { risk += 100; signals.push({ id: 'honeypot_filled', weight: 100 }); }
  if (Number.isFinite(Number(elapsed_ms)) && Number(elapsed_ms) < 2500) {
    risk += 18; signals.push({ id: 'implausibly_fast_submit', weight: 18 });
  }
  if (Number(duplicate_count_24h) >= 2) {
    const weight = Math.min(35, 12 + Number(duplicate_count_24h) * 5);
    risk += weight; signals.push({ id: 'duplicate_content', weight });
  }
  if (Number(submissions_10m) >= 4) {
    const weight = Math.min(45, 15 + Number(submissions_10m) * 4);
    risk += weight; signals.push({ id: 'submission_burst', weight });
  }
  if (challenge_passed === false) {
    risk += 60; signals.push({ id: 'bot_challenge_failed', weight: 60 });
  }

  const phraseHits = suspiciousPhrases.filter((term) => joined.includes(term));
  if (phraseHits.length) {
    const weight = Math.min(40, 10 + phraseHits.length * 6);
    risk += weight; signals.push({ id: 'spam_or_injection_markers', weight, evidence: phraseHits.slice(0, 5) });
  }

  const urlCount = (joined.match(/https?:\/\//g) || []).length;
  if (urlCount >= 2) {
    const weight = Math.min(28, 8 + urlCount * 4);
    risk += weight; signals.push({ id: 'many_urls', weight });
  }

  if (joined.length >= 80 && entropyLike(joined) < 0.08) {
    risk += 12; signals.push({ id: 'low_information_repetition', weight: 12 });
  }

  const userAgent = normalize(headers['user-agent'] || headers['User-Agent'] || '');
  if (!userAgent) { risk += 8; signals.push({ id: 'missing_user_agent', weight: 8 }); }

  risk = Math.min(100, risk);
  let action = 'ALLOW_TO_MODERATION';
  if (risk >= 80) action = 'DROP_OR_CHALLENGE';
  else if (risk >= 50) action = 'QUARANTINE';
  else if (risk >= 25) action = 'FLAG_FOR_MODERATOR';

  return {
    version: 1,
    risk_score: risk,
    action,
    signals,
    diagnostic: false,
    user_character_judgment: false,
    content_quality_decision: false,
    principle: 'defend_the_platform_without_punishing_unusual_but_legitimate_human_expression'
  };
}
