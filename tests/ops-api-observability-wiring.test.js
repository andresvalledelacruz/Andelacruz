import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const opsApiSource = await readFile(new URL('../src/ops-api.js', import.meta.url), 'utf8');

test('ops API wires privacy-safe Fastify observability with the expected service name', () => {
  assert.match(
    opsApiSource,
    /import \{ registerPrivacySafeHttpObservability \} from '\.\/fastify-privacy-safe-observability\.js';/
  );
  assert.match(
    opsApiSource,
    /registerPrivacySafeHttpObservability\(app, \{ service: 'desgracias-ops-api' \}\);/
  );
});

test('ops API observability wiring does not opt into raw URL, payload, auth or IP logging', () => {
  const wiringLine = opsApiSource
    .split('\n')
    .find((line) => line.includes('registerPrivacySafeHttpObservability(app'));

  assert.equal(wiringLine?.includes('request.url'), false);
  assert.equal(wiringLine?.includes('request.body'), false);
  assert.equal(wiringLine?.includes('request.headers'), false);
  assert.equal(wiringLine?.includes('authorization'), false);
  assert.equal(wiringLine?.includes('request.ip'), false);
});
