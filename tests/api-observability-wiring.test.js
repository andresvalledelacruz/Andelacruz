import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const apiSource = await readFile(new URL('../src/api.js', import.meta.url), 'utf8');

test('public API wires privacy-safe Fastify observability with the expected service name', () => {
  assert.match(
    apiSource,
    /import \{ registerPrivacySafeHttpObservability \} from '\.\/fastify-privacy-safe-observability\.js';/
  );
  assert.match(
    apiSource,
    /registerPrivacySafeHttpObservability\(app, \{ service: 'desgracias-api' \}\);/
  );
});

test('public API observability wiring does not enable raw URL or request payload logging', () => {
  const wiringLine = apiSource
    .split('\n')
    .find((line) => line.includes('registerPrivacySafeHttpObservability(app'));

  assert.equal(wiringLine?.includes('request.url'), false);
  assert.equal(wiringLine?.includes('request.body'), false);
  assert.equal(wiringLine?.includes('request.headers'), false);
  assert.equal(wiringLine?.includes('request.ip'), false);
});
