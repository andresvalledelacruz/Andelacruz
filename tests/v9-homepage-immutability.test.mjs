import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Andrés autorizó el 2026-09-15 la simplificación de cabecera, SEO/trust y consolidación CSS de esta tanda.
const APPROVED_V9_INDEX_BLOB = '3114c567b18f277d92e86220500ea134935cf49a';

test('la portada V9 permanece byte-a-byte intacta', () => {
  // 2026-09-20: Andrés pidió explícitamente visibilidad de países e idiomas al final.
  // Preserve the previous approved baseline after removing only this fixed footer paragraph.
  const approvedFooter = '<p class="help-language-coverage">Orientación inicial por país: España, México, Argentina, Colombia, Chile, Portugal, Francia, Reino Unido y recursos de la UE. <a href="/ayuda/es/" lang="es">Español</a> · <a href="/ayuda/en/" lang="en">English</a> · <a href="/ayuda/fr/" lang="fr">Français</a> · <a href="/ayuda/pt/" lang="pt">Português</a>. Las guías completas siguen principalmente en español.</p>';
  const html = readFileSync('index.html', 'utf8').replaceAll('\r\n', '\n');
  assert.equal(html.split(approvedFooter).length, 2, 'one exact language footer is required');
  assert.ok(html.includes(approvedFooter + '</footer>'), 'language coverage belongs at the end of the footer');
  const actual = execFileSync('git', ['hash-object', '--stdin'], { input: html.replace(approvedFooter, ''), encoding: 'utf8' }).trim();

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
