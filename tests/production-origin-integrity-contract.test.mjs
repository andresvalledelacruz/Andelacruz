import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const script = fs.readFileSync('scripts/audit-production-origin.mjs', 'utf8');
const workflow = fs.readFileSync('.github/workflows/production-origin-integrity.yml', 'utf8');

const combined = `${script}\n${workflow}`;

function assertAbsent(pattern, message) {
  assert.doesNotMatch(combined, pattern, message);
}

test('el monitor de producción valida TLS sin bypass', () => {
  assert.match(script, /rejectUnauthorized:\s*true/);
  assert.match(script, /minVersion:\s*'TLSv1\.2'/);
  assert.match(script, /socket\.authorized\s*===\s*true/);

  assertAbsent(/NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*0/i, 'No se puede desactivar la validación TLS.');
  assertAbsent(/rejectUnauthorized:\s*false/i, 'No se puede aceptar un certificado no autorizado.');
  assertAbsent(/\bcurl\b[^\n]*\s-k(?:\s|$)/i, 'No se puede usar curl -k.');
  assertAbsent(/--insecure/i, 'No se puede usar --insecure.');
});

test('el monitor exige V9 y rechaza señales del WordPress histórico', () => {
  assert.match(script, /Historias reales y recursos para momentos difíciles/);
  assert.match(script, /UN ESPACIO ANÓNIMO, HUMANO Y RESPETUOSO/);
  assert.match(script, /Hay momentos/);
  assert.match(script, /dice basta\./);

  for (const marker of ['wp-content', 'wp-includes', 'wordpress', 'colormag']) {
    assert.ok(script.includes(`'${marker}'`), `Falta señal legacy ${marker}`);
  }
});

test('el monitor contrasta DNS con resolvers independientes', () => {
  assert.match(script, /https:\/\/dns\.google\/resolve/);
  assert.match(script, /https:\/\/cloudflare-dns\.com\/dns-query/);
  assert.match(script, /DNS resolver consensus/);
  assert.match(script, /desgracias\.es.*A/);
  assert.match(script, /desgracias\.es.*NS/);
  assert.match(script, /www\.desgracias\.es.*CNAME/);
});

test('el workflow se ejecuta en cada push real a production-v9 y conserva evidencia', () => {
  assert.match(workflow, /name:\s*Production Origin Integrity/);
  assert.match(workflow, /branches:\s*\[production-v9\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /node scripts\/audit-production-origin\.mjs/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /if:\s*always\(\)/);
  assert.doesNotMatch(workflow, /continue-on-error:\s*true/i);
});
