import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../visitor-analytics.js', import.meta.url), 'utf8');
const loader = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const publicRuntime = await readFile(new URL('../public-page-runtime.js', import.meta.url), 'utf8');

test('visitor analytics is loaded without changing homepage markup', () => {
  assert.match(loader, /load\('\/visitor-analytics\.js'\);/);
});

test('public content runtime loads the same privacy-safe analytics beacon', () => {
  assert.match(publicRuntime, /script\.src = '\/visitor-analytics\.js'/);
  assert.equal(publicRuntime.includes('innerHTML'), false);
  assert.equal(publicRuntime.includes('document.write'), false);
});

test('visitor analytics never reads or sends persistent identifiers or URL query data', () => {
  for (const forbidden of [
    'document.cookie',
    'localStorage',
    'sessionStorage',
    'location.search',
    'location.hash',
    'userAgent',
    'email',
    'authorization'
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden analytics input: ${forbidden}`);
  }
  assert.match(source, /credentials: 'omit'/);
  assert.match(source, /window\.location\.pathname/);
});

test('visitor analytics only sends aggregate-safe dimensions', () => {
  assert.match(source, /p_path:/);
  assert.match(source, /p_referrer_host:/);
  assert.match(source, /p_country_code:/);
  assert.match(source, /p_device_class:/);
  assert.equal(source.includes('latitude'), false);
  assert.equal(source.includes('longitude'), false);
  assert.equal(source.includes('ip'), false);
});
