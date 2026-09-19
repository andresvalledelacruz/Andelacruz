import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { nextSteps } from '../scripts/build-resource-directory.mjs';

test('next steps remain reachable without scripts and outside topic filtering', async () => {
  const html = await readFile(new URL('../recursos/index.html', import.meta.url), 'utf8');
  const section = html.match(/<section aria-labelledby="next-steps-title">([\s\S]*?)<\/section>/)?.[1];
  assert.ok(section);
  assert.ok(html.indexOf('href="tel:112"') < html.indexOf('id="next-steps-title"'));
  assert.ok(html.indexOf('id="next-steps-title"') < html.indexOf('id="resource-directory"'));
  assert.equal((section.match(/<a class="cardlink"/g) || []).length, nextSteps.length);
  assert.doesNotMatch(section, /<button|<input|<select|\bhidden\b|onclick=/);
  for (const step of nextSteps) {
    assert.ok(section.includes(`href="${step.url}"><strong>${step.title}</strong>`));
    await access(new URL(`..${step.url}${step.url.endsWith('/') ? 'index.html' : ''}`, import.meta.url));
  }
});
