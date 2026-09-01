import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const script = path.resolve('scripts/audit-copyright-ip-risk.mjs');

function runAudit(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'copyright-ip-audit-'));
  try {
    for (const [relative, content] of Object.entries(files)) {
      const target = path.join(dir, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    const result = spawnSync(process.execPath, [script], { cwd: dir, encoding: 'utf8' });
    return { ...result, report: JSON.parse(result.stdout) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('copyright propio y blockquote noindex no se convierten en falsos positivos de alto riesgo', () => {
  const { status, report } = runAudit({
    'frontend/index.html': '<meta name="robots" content="noindex,nofollow"><blockquote>Texto propio de demostración</blockquote><footer>© 2026 Desgracias.es</footer>'
  });

  assert.equal(status, 0);
  assert.equal(report.summary.hard_fail, 0);
  assert.equal(report.summary.manual_review, 0);
  assert.equal(report.summary.informational, 1);
  assert.equal(report.findings[0].kind, 'blockquote');
  assert.equal(report.findings[0].exposure, 'non_indexed_staging');
});

test('una referencia bibliográfica en contenido indexable exige revisión source-level', () => {
  const { status, report } = runAudit({
    'guia.html': '<meta name="robots" content="index,follow"><p>Este libro desarrolla el enfoque.</p>'
  });

  assert.equal(status, 0);
  assert.equal(report.summary.manual_review, 1);
  assert.equal(report.findings[0].kind, 'book_reference');
  assert.equal(report.findings[0].priority, 'manual_review');
});

test('el uso genérico de editorial no se confunde con una referencia bibliográfica', () => {
  const { status, report } = runAudit({
    'metodologia.html': '<meta name="robots" content="index,follow"><p>La revisión y el criterio editorial son independientes.</p>'
  });

  assert.equal(status, 0);
  assert.equal(report.summary.hard_fail, 0);
  assert.equal(report.summary.manual_review, 0);
  assert.deepEqual(report.inventory, [{
    file: 'metodologia.html',
    exposure: 'deployable_indexed',
    status: 'PASS_SCREEN',
    finding_kinds: []
  }]);
});

test('el inventario clasifica cada página sin confundir cribado con clearance legal', () => {
  const { report } = runAudit({
    'limpia.html': '<meta name="robots" content="index,follow"><p>Síntesis propia.</p>',
    'revisar.html': '<meta name="robots" content="index,follow"><p>Este libro se cita como referencia.</p>',
    'bloquear.html': '<meta name="robots" content="index,follow"><img src="https://example.org/foto.jpg" alt="">'
  });

  assert.deepEqual(report.inventory.map(({ file, status }) => ({ file, status })), [
    { file: 'bloquear.html', status: 'HARD_FAIL' },
    { file: 'limpia.html', status: 'PASS_SCREEN' },
    { file: 'revisar.html', status: 'MANUAL_REVIEW' }
  ]);
  assert.match(report.inventory_interpretation, /not a legal clearance/i);
});

test('una imagen remota de terceros bloquea el gate, pero una imagen absoluta propia registrada no', () => {
  const own = runAudit({
    'copyright-asset-provenance.json': JSON.stringify({ version: 1, assets: { 'assets/manos-apoyo.png': { status: 'VERIFIED_OWNED' } } }),
    'propia.html': '<img src="https://desgracias.es/assets/manos-apoyo.png" alt="">'
  });
  assert.equal(own.status, 0);
  assert.equal(own.report.summary.hard_fail, 0);
  assert.equal(own.report.summary.manual_review, 0);

  const thirdParty = runAudit({
    'tercero.html': '<img src="https://example.org/foto.jpg" alt="">'
  });
  assert.equal(thirdParty.status, 1);
  assert.equal(thirdParty.report.summary.hard_fail, 1);
  assert.equal(thirdParty.report.findings[0].kind, 'remote_third_party_image');
});

test('una imagen local sin registrar queda visible como revisión manual', () => {
  const { status, report } = runAudit({
    'pagina.html': '<img src="/assets/foto-local.webp" alt="">'
  });

  assert.equal(status, 0);
  assert.equal(report.local_image_assets_referenced, 1);
  assert.equal(report.summary.manual_review, 1);
  assert.equal(report.findings[0].kind, 'local_image_unregistered');
  assert.equal(report.findings[0].asset, 'assets/foto-local.webp');
});

test('PENDING_PROVENANCE exige revisión y HOLD_LEGAL bloquea despliegue', () => {
  const pending = runAudit({
    'copyright-asset-provenance.json': JSON.stringify({ version: 1, assets: { 'assets/foto.webp': { status: 'PENDING_PROVENANCE' } } }),
    'pagina.html': '<img src="/assets/foto.webp" alt="">'
  });
  assert.equal(pending.status, 0);
  assert.equal(pending.report.summary.manual_review, 1);
  assert.equal(pending.report.findings[0].kind, 'local_image_pending_provenance');

  const hold = runAudit({
    'copyright-asset-provenance.json': JSON.stringify({ version: 1, assets: { 'assets/foto.webp': { status: 'HOLD_LEGAL' } } }),
    'pagina.html': '<img src="/assets/foto.webp" alt="">'
  });
  assert.equal(hold.status, 1);
  assert.equal(hold.report.summary.hard_fail, 1);
  assert.equal(hold.report.findings[0].kind, 'local_image_hold_legal');
});

