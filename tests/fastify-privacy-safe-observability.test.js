import test from 'node:test';
import assert from 'node:assert/strict';
import { registerPrivacySafeHttpObservability } from '../src/fastify-privacy-safe-observability.js';

function fakeFastify() {
  const hooks = new Map();
  const logs = [];
  return {
    hooks,
    logs,
    addHook(name, handler) {
      hooks.set(name, handler);
    },
    log: {
      info(event, message) {
        logs.push({ event, message });
      }
    }
  };
}

test('Fastify adapter logs only the route template and coarse operational fields', async () => {
  const app = fakeFastify();
  let clock = 1000;
  registerPrivacySafeHttpObservability(app, {
    service: 'desgracias-api',
    now: () => clock
  });

  const request = {
    method: 'POST',
    url: '/api/stories/real-user-id/updates?email=user@example.com&token=secret',
    routeOptions: { url: '/api/stories/:storyId/updates' },
    body: { story: 'private story text' },
    headers: { authorization: 'Bearer secret' },
    ip: '203.0.113.42'
  };
  const responseHeaders = {};
  const reply = {
    statusCode: 202,
    header(name, value) {
      responseHeaders[name] = value;
    }
  };

  await app.hooks.get('onRequest')(request, reply);
  clock = 1240;
  await app.hooks.get('onResponse')(request, reply);

  assert.match(responseHeaders['X-Request-Id'], /^[0-9a-f-]{36}$/i);
  assert.equal(app.logs.length, 1);
  assert.equal(app.logs[0].message, 'http_request');
  assert.equal(app.logs[0].event.route, '/api/stories/:storyId/updates');
  assert.equal(app.logs[0].event.duration_bucket, '100_499ms');

  const serialized = JSON.stringify(app.logs[0].event);
  assert.equal(serialized.includes('real-user-id'), false);
  assert.equal(serialized.includes('user@example.com'), false);
  assert.equal(serialized.includes('private story text'), false);
  assert.equal(serialized.includes('Bearer secret'), false);
  assert.equal(serialized.includes('203.0.113.42'), false);
});

test('Fastify adapter never falls back to the raw request URL', async () => {
  const app = fakeFastify();
  let clock = 0;
  registerPrivacySafeHttpObservability(app, { now: () => clock });

  const request = {
    method: 'GET',
    url: '/unknown/path?secret=never-log-this',
    routeOptions: null
  };
  const reply = {
    statusCode: 404,
    header() {}
  };

  await app.hooks.get('onRequest')(request, reply);
  clock = 25;
  await app.hooks.get('onResponse')(request, reply);

  assert.equal(app.logs[0].event.route, 'unknown');
  assert.equal(JSON.stringify(app.logs[0].event).includes('never-log-this'), false);
});
