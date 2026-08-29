import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const render = await readFile(new URL('../render.yaml', import.meta.url), 'utf8');
const ops = await readFile(new URL('../OPS_STAGING.md', import.meta.url), 'utf8');

test('staging API declares the author update pepper as a manual secret', () => {
  const apiService = render.split('name: desgracias-api-staging')[1]?.split('- type: web')[0] || '';
  assert.match(apiService, /key: STORY_AUTHOR_UPDATE_PEPPER\s+sync: false/);
  assert.doesNotMatch(apiService, /STORY_AUTHOR_UPDATE_PEPPER\s*\n\s*value:/);
});

test('deployment documentation keeps the author pepper server-only and fail-closed', () => {
  assert.match(ops, /STORY_AUTHOR_UPDATE_PEPPER/);
  assert.match(ops, /no almacenarse en código, GitHub, URL ni frontend/);
  assert.match(ops, /Si falta, el alta de historias falla de forma segura/);
  assert.match(ops, /no se persiste en bruto/);
});
