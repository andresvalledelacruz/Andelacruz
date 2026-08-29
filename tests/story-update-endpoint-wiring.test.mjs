import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const apiSource = await readFile(new URL('../src/api.js', import.meta.url), 'utf8');

function storyUpdateRoute(source) {
  const start = source.indexOf("app.post('/api/stories/:storyId/updates'");
  const end = source.indexOf("app.post('/api/stories/:slug/interactions'", start);
  assert.notEqual(start, -1, 'POST /api/stories/:storyId/updates must exist');
  assert.notEqual(end, -1, 'story interactions route must delimit the update route');
  return source.slice(start, end);
}

test('story update endpoint delegates to the hardened moderation handler', () => {
  assert.match(
    apiSource,
    /import\s+\{\s*handleStoryUpdateSubmission\s*\}\s+from\s+'\.\/story-update-http-handler\.js';/
  );

  const route = storyUpdateRoute(apiSource);
  assert.match(route, /handleStoryUpdateSubmission\s*\(/);
  assert.match(route, /db:\s*pool/);
  assert.match(route, /storyId/);
  assert.match(route, /body:\s*request\.body\s*\?\?\s*\{\}/);
  assert.match(route, /environment/);
  assert.match(route, /pepper:\s*authorUpdatePepper/);
});

test('story update endpoint is origin-guarded and rate limited before authorization work', () => {
  const route = storyUpdateRoute(apiSource);
  const originGuard = route.indexOf('allowOriginOrDeny');
  const rateLimit = route.indexOf('withinRateLimit(storyUpdateSubmissionsByIp');
  const handler = route.indexOf('handleStoryUpdateSubmission');

  assert.ok(originGuard >= 0, 'origin guard is required');
  assert.ok(rateLimit > originGuard, 'rate limit must run after origin guard');
  assert.ok(handler > rateLimit, 'rate limit must run before author authorization/database work');
  assert.match(route, /retry_after_seconds:\s*3600/);
});

test('story update endpoint never logs or reserializes the raw author secret', () => {
  const route = storyUpdateRoute(apiSource);
  assert.doesNotMatch(route, /author_secret/);
  assert.doesNotMatch(route, /authorSecret/);
  assert.doesNotMatch(route, /JSON\.stringify/);
  assert.doesNotMatch(route, /request\.body[^\n]*log|log[^\n]*request\.body/i);
});

test('story update endpoint has an explicit CORS preflight route', () => {
  assert.match(apiSource, /app\.options\('\/api\/stories\/:storyId\/updates'/);
});
