import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Owner authorized static essentials and transparency on 2026-09-14; visual layout reviewed.
const APPROVED_V9_INDEX_BLOB = '2ff0158f41edee6994f066595b412135d721692a';

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
