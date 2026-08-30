import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const APPROVED_V9_INDEX_BLOB = 'a9190d04e302d1848873985144eff9a267507153';

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
