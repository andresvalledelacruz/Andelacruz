import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const privacy = await readFile(new URL('../privacidad.html', import.meta.url), 'utf8');

test('privacy policy discloses aggregate cookie-free analytics', () => {
  assert.match(privacy, /Analítica interna agregada:/);
  assert.match(privacy, /sin cookies de analítica/i);
  assert.match(privacy, /sin identificadores persistentes/i);
  assert.match(privacy, /sin parámetros de URL/i);
  assert.match(privacy, /sin texto libre/i);
});

test('privacy policy explains the aggregate dimensions without claiming physical geolocation', () => {
  assert.match(privacy, /procedencia resumida por dominio/i);
  assert.match(privacy, /clase aproximada de dispositivo/i);
  assert.match(privacy, /código de país orientativo inferido/i);
  assert.equal(/geolocalización exacta/i.test(privacy), false);
});

test('privacy page uses the shared public runtime without adding analytics cookies', () => {
  assert.match(privacy, /<script src="\/public-page-runtime\.js" defer><\/script>/);
  assert.equal(/document\.cookie/.test(privacy), false);
});
