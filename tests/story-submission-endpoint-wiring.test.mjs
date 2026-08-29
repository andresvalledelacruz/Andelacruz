import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const apiSource = await readFile(new URL('../src/api.js', import.meta.url), 'utf8');

function storyPostRoute(source) {
  const start = source.indexOf("app.post('/api/stories'");
  const end = source.indexOf("app.post('/api/stories/:slug/interactions'", start);
  assert.notEqual(start, -1, 'POST /api/stories must exist');
  assert.notEqual(end, -1, 'story interactions route must delimit POST /api/stories');
  return source.slice(start, end);
}

test('POST /api/stories is wired to the one-time author credential service', () => {
  assert.match(
    apiSource,
    /import\s+\{\s*queueStorySubmissionWithAuthorCredential\s*\}\s+from\s+'\.\/story-submission-author-credential-service\.js';/
  );
  assert.match(apiSource, /STORY_AUTHOR_UPDATE_PEPPER/);

  const route = storyPostRoute(apiSource);
  assert.match(route, /queueStorySubmissionWithAuthorCredential\s*\(/);
  assert.match(route, /pepper:\s*authorUpdatePepper/);
  assert.match(route, /environment\s*[,}]/);
});

test('POST /api/stories no longer sends directly to moderation', () => {
  const route = storyPostRoute(apiSource);
  assert.doesNotMatch(route, /pgmq\.send/);
  assert.doesNotMatch(route, /author_update_key_hash\s*:/);
});

test('endpoint never logs or re-serializes the raw author secret', () => {
  const route = storyPostRoute(apiSource);
  assert.doesNotMatch(route, /JSON\.stringify\s*\(\s*result\.value/);
  assert.doesNotMatch(route, /log\.(?:info|error|warn|debug)\([^\n]*author_update_secret/);
  assert.match(route, /author_update_secret/);
});
