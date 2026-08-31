import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const page = await readFile(new URL('../duelo/no-pude-despedirme/index.html', import.meta.url), 'utf8');

test('no-pude-despedirme keeps sitemap lastmod aligned with its substantial editorial update', () => {
  assert.match(page, /Actualizado el 31 de agosto de 2026/);
  assert.match(
    sitemap,
    /<loc>https:\/\/desgracias\.es\/duelo\/no-pude-despedirme\/<\/loc><lastmod>2026-08-31<\/lastmod>/
  );
});
