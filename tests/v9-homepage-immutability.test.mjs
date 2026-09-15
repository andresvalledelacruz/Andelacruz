import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Andrés autorizó el 2026-09-15 la simplificación de cabecera, SEO/trust y consolidación CSS de esta tanda.
const APPROVED_V9_INDEX_BLOB = '3114c567b18f277d92e86220500ea134935cf49a';

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
