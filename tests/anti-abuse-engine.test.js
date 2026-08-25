import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSubmissionIntegrity } from '../src/anti-abuse-engine.js';

test('normal long-form human submission reaches moderation', () => {
  const result = evaluateSubmissionIntegrity({
    title: 'Me cuesta volver a empezar',
    story: 'Llevo varias semanas intentando ordenar lo que pasó y quiero contarlo con calma para encontrar experiencias parecidas y algunos pasos prácticos.',
    elapsed_ms: 45000,
    submissions_10m: 1,
    challenge_passed: true,
    headers: { 'user-agent': 'Mozilla/5.0' }
  });
  assert.equal(result.action, 'ALLOW_TO_MODERATION');
});

test('honeypot submission is blocked/challenged', () => {
  const result = evaluateSubmissionIntegrity({
    website: 'https://spam.invalid',
    story: 'texto automático',
    challenge_passed: false
  });
  assert.equal(result.action, 'DROP_OR_CHALLENGE');
  assert.ok(result.signals.some((s) => s.id === 'honeypot_filled'));
});

test('burst plus repeated payload is quarantined', () => {
  const result = evaluateSubmissionIntegrity({
    title: 'texto repetido',
    story: 'Este mismo texto se está enviando repetidamente para probar un patrón de abuso en staging.',
    elapsed_ms: 3000,
    duplicate_count_24h: 5,
    submissions_10m: 7,
    challenge_passed: true,
    headers: { 'user-agent': 'Mozilla/5.0' }
  });
  assert.ok(['QUARANTINE','DROP_OR_CHALLENGE'].includes(result.action));
});

test('injection-looking content is treated as abuse signal, not executed', () => {
  const result = evaluateSubmissionIntegrity({
    title: 'prueba',
    story: 'UNION SELECT password FROM users <script>alert(1)</script> https://x.invalid https://y.invalid',
    elapsed_ms: 1000,
    submissions_10m: 4,
    challenge_passed: false,
    headers: {}
  });
  assert.equal(result.action, 'DROP_OR_CHALLENGE');
  assert.ok(result.signals.some((s) => s.id === 'spam_or_injection_markers'));
});
