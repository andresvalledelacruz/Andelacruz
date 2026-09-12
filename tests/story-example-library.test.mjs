import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const library = JSON.parse(readFileSync(new URL('../content/historias-ejemplo-v1.json', import.meta.url), 'utf8'));
const loader = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../story-example-library.js', import.meta.url), 'utf8');

function findStory(slug) {
  return library.stories.find((story) => story.slug === slug);
}

test('editorial story library contains exactly 18 complete, uniquely identified examples', () => {
  assert.equal(library.is_real_user_content, false);
  assert.equal(library.source_type, 'editorial_composite');
  assert.equal(library.display_label, 'Historia de ejemplo');
  assert.match(library.public_disclosure, /ficticio/i);
  assert.match(library.public_disclosure, /no corresponde a una persona real/i);
  assert.equal(library.stories.length, 18);

  const ids = new Set();
  const slugs = new Set();
  for (const story of library.stories) {
    assert.ok(story.id);
    assert.ok(story.slug);
    assert.ok(story.title.length >= 20);
    assert.ok(story.excerpt.length >= 40);
    assert.ok(story.context.length >= 10);
    assert.ok(Array.isArray(story.body) && story.body.length >= 4);
    assert.ok(story.body.every((paragraph) => paragraph.length >= 70));
    assert.ok(Array.isArray(story.timeline) && story.timeline.length >= 3);
    assert.ok(Array.isArray(story.helped) && story.helped.length >= 3);
    assert.ok(Array.isArray(story.nextSteps) && story.nextSteps.length >= 3);
    assert.equal(ids.has(story.id), false, `duplicate id ${story.id}`);
    assert.equal(slugs.has(story.slug), false, `duplicate slug ${story.slug}`);
    ids.add(story.id);
    slugs.add(story.slug);
  }
});

test('governance forbids fake social proof and false real-story labeling', () => {
  assert.equal(library.governance.never_label_as_real, true);
  assert.equal(library.governance.no_fake_dates, true);
  assert.equal(library.governance.no_fake_aliases, true);
  assert.equal(library.governance.no_fake_reactions_or_counts, true);
  assert.equal(library.governance.high_risk_stories_avoid_method_details, true);
  assert.equal(library.governance.high_risk_stories_include_official_help, true);

  const serialized = JSON.stringify(library);
  assert.doesNotMatch(serialized, /"public_alias"/i);
  assert.doesNotMatch(serialized, /"reaction/i);
  assert.doesNotMatch(serialized, /"followers/i);
  assert.doesNotMatch(serialized, /"likes/i);
});

test('high-risk examples include appropriate Spain safety routes', () => {
  const suicide = findStory('la-noche-que-por-fin-dije-no-estoy-seguro-conmigo-mismo');
  const abuse = findStory('tarde-mucho-en-llamar-maltrato-a-lo-que-me-pasaba');
  const assault = findStory('durante-meses-pense-que-como-no-grite-no-tenia-derecho-a-sentirme-asi');
  const bereavement = findStory('mi-hermano-murio-por-suicidio-y-me-quede-con-mil-preguntas');

  assert.ok(suicide && abuse && assault && bereavement);
  assert.match(suicide.nextSteps.join(' '), /112/);
  assert.match(suicide.nextSteps.join(' '), /024/);
  assert.match(abuse.nextSteps.join(' '), /112/);
  assert.match(abuse.nextSteps.join(' '), /016/);
  assert.match(assault.nextSteps.join(' '), /112/);
  assert.match(bereavement.nextSteps.join(' '), /024/);
});

test('frontend only replaces a confirmed empty state and keeps examples transparently labeled', () => {
  assert.match(loader, /story-example-library\.js/);
  assert.match(runtime, /Aún no hay historias publicadas\./);
  assert.match(runtime, /if \(rendered \|\| !isConfirmedEmpty\(grid\)\) return;/);
  assert.match(runtime, /is_real_user_content !== false/);
  assert.match(runtime, /never_label_as_real !== true/);
  assert.match(runtime, /Historia de ejemplo|display_label/);
  assert.match(runtime, /Relatos y experiencias/);
  assert.match(runtime, /Leer historias/);
  assert.match(runtime, /tel:112/);
  assert.match(runtime, /tel:024/);
  assert.match(runtime, /tel:016/);
});
