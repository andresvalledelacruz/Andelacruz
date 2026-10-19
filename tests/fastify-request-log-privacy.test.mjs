import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Fastify from 'fastify';
import { privacySafeFastifyOptions } from '../src/privacy-safe-fastify-options.js';
import { registerPrivacySafeHttpObservability } from '../src/fastify-privacy-safe-observability.js';

test('real Fastify logs omit raw request data on success, errors and unknown routes', async () => {
  const lines = [];
  const app = Fastify(privacySafeFastifyOptions({
    bodyLimit: 1024,
    logger: { stream: { write: line => lines.push(line) } }
  }));
  registerPrivacySafeHttpObservability(app, { service: 'privacy-test' });
  app.post('/probe/:id', async () => ({ ok: true }));
  app.get('/failure/:id', async () => { throw new Error('private-exception-marker'); });
  try {
    const shared = { remoteAddress: '203.0.113.42', headers: { authorization: 'Bearer private-auth-marker' } };
    const responses = [
      await app.inject({ ...shared, method: 'POST', url: '/probe/private-id-marker?query=private-query-marker', payload: { story: 'private-body-marker' } }),
      await app.inject({ ...shared, method: 'GET', url: '/failure/private-id-marker?query=private-query-marker' }),
      await app.inject({ ...shared, method: 'GET', url: '/unknown-private-path-marker?query=private-query-marker' }),
      await app.inject({ ...shared, method: 'POST', url: '/probe/private-id-marker', headers: { ...shared.headers, 'content-type': 'application/json' }, payload: '{private-invalid-json-marker' })
    ];
    assert.deepEqual(responses.map(r => r.statusCode), [200, 500, 404, 400]);
    const records = lines.join('').trim().split('\n').filter(Boolean).map(JSON.parse);
    assert.equal(records.length, responses.length);
    assert.ok(records.every(r => r.event === 'http_request' && r.msg === 'http_request'));
    assert.deepEqual(records.map(r => r.route), ['/probe/:id', '/failure/:id', 'unknown', '/probe/:id']);
    assert.doesNotMatch(lines.join(''), /private-|203\.0\.113\.42|incoming request|request completed|authorization|remoteAddress/);
  } finally { await app.close(); }
});

test('both API entrypoints use the tested privacy-safe server options', async () => {
  for (const file of ['api.js', 'ops-api.js']) {
    const source = await readFile(new URL('../src/' + file, import.meta.url), 'utf8');
    assert.match(source, /import \{ privacySafeFastifyOptions \} from '\.\/privacy-safe-fastify-options\.js'/);
    assert.match(source, /Fastify\(privacySafeFastifyOptions\(/);
  }
});
