import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Andrés autorizó el 2026-09-22 que la tarjeta “Necesito ayuda urgente” sea clicable en toda su superficie; se conserva la misma jerarquía visual.
const APPROVED_V9_INDEX_BLOB = '9236c39ec60a50b0eb6380cbd96c9224cdb88a8d';

test('la portada V9 permanece byte-a-byte intacta', () => {
  const actual = execFileSync('git', ['hash-object', 'index.html'], { encoding: 'utf8' }).trim();

  assert.equal(
    actual,
    APPROVED_V9_INDEX_BLOB,
    [
      'La portada V9 (index.html) ha cambiado.',
      'No actualices esta referencia para hacer pasar CI.',
      'Solo puede cambiarse tras petición explícita de Andrés y revisión visual/editorial específica.'
    ].join(' ')
  );
});
