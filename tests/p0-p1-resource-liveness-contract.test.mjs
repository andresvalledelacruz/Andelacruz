import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const policy = fs.readFileSync('scripts/lib/p0-p1-resource-policy.mjs', 'utf8');
const script = fs.readFileSync('scripts/audit-p0-p1-resource-liveness.mjs', 'utf8');
const workflow = fs.readFileSync('.github/workflows/p0-p1-resource-liveness.yml', 'utf8');
const integrityTest = fs.readFileSync('tests/p0-p1-external-resource-integrity.test.mjs', 'utf8');
const combined = `${policy}\n${script}\n${workflow}`;

function assertAbsent(pattern, message) {
  assert.doesNotMatch(combined, pattern, message);
}

test('gate and live monitor share one governed P0/P1 resource policy', () => {
  assert.match(integrityTest, /scripts\/lib\/p0-p1-resource-policy\.mjs/);
  assert.match(script, /\.\/lib\/p0-p1-resource-policy\.mjs/);
  assert.match(policy, /PUBLIC_AUTHORITY_BASE_DOMAINS/);
  assert.match(policy, /REVIEWED_NON_GOVERNMENT_HOSTS/);
  assert.match(policy, /redirectTargetIsGoverned/);
});

test('live monitor keeps strict TLS and never introduces an insecure bypass', () => {
  assert.match(script, /NODE_TLS_REJECT_UNAUTHORIZED\s*===\s*'0'/);
  assert.match(script, /redirect:\s*'manual'/);
  assert.match(script, /AbortSignal\.timeout\(TIMEOUT_MS\)/);

  assertAbsent(/NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0/i, 'TLS verification cannot be disabled.');
  assertAbsent(/rejectUnauthorized:\s*false/i, 'Untrusted certificates cannot be accepted.');
  assertAbsent(/\bcurl\b[^\n]*\s-k(?:\s|$)/i, 'curl -k is forbidden.');
  assertAbsent(/--insecure/i, '--insecure is forbidden.');
});

test('monitor separates integrity failures from transient third-party availability noise', () => {
  assert.match(script, /tls_failure[^\n]*transient_network_failure/);
  assert.match(script, /severity:\s*details\.tlsFailure\s*\?\s*'hard'\s*:\s*'warning'/);
  assert.match(script, /resource_missing/);
  assert.match(script, /ungoverned_redirect/);
  assert.match(script, /reachable_restricted/);
  assert.match(script, /transient_server_failure/);
  assert.match(script, /MAX_ATTEMPTS\s*=\s*2/);
  assert.match(script, /STRICT\s*=\s*process\.argv\.includes\('--strict'\)/);
  assert.match(script, /if \(STRICT\) process\.exitCode = 1/);
});

test('redirect integrity remains HTTPS and governed', () => {
  assert.match(policy, /target\.protocol !== 'https:'/);
  assert.match(policy, /withoutWww\(source\.hostname\) === withoutWww\(target\.hostname\)/);
  assert.match(policy, /classification\.kind === 'public_authority'/);
  assert.match(policy, /isAuthorityHost\(target\.hostname\)/);
});

test('liveness workflow is reusable/manual, production-pinned and not a deployment trigger', () => {
  assert.match(workflow, /name:\s*P0\/P1 Resource Liveness/);
  assert.match(workflow, /workflow_call:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /ref:\s*production-v9/);
  assert.match(workflow, /node scripts\/audit-p0-p1-resource-liveness\.mjs --strict/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /if:\s*always\(\)/);
  assert.doesNotMatch(workflow, /\bschedule:/);
  assert.doesNotMatch(workflow, /\bpull_request:/);
  assert.doesNotMatch(workflow, /^\s*push:/m);
  assert.doesNotMatch(workflow, /continue-on-error:\s*true/i);
});
