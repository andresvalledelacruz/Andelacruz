import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html = readFileSync('recursos/index.html', 'utf8');
const runtime = readFileSync('resource-directory.js', 'utf8');

function staticCount(label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<summary>${escaped} <span>\\((\\d+) opciones\\)<\\/span><\\/summary>`));
  assert.ok(match, `missing resource branch: ${label}`);
  return Number(match[1]);
}

function expansionCount(label) {
  const start = runtime.indexOf(`'${label}': Object.freeze([`);
  assert.notEqual(start, -1, `missing runtime expansion: ${label}`);
  const end = runtime.indexOf('])', start);
  const block = runtime.slice(start, end);
  return (block.match(/^\s*\['\//gm) || []).length;
}

test('ordinary resource branches reach at least ten useful choices without padding Safety branches', () => {
  const targets = [
    'Soledad',
    'Ansiedad',
    'Gestión emocional',
    'Salud y enfermedad',
    'Rupturas y relaciones',
    'Familia',
    'Dinero y deudas'
  ];
  for (const label of targets) {
    assert.ok(staticCount(label) + expansionCount(label) >= 10, `${label} remains below 10 options`);
  }
  assert.equal(runtime.includes("'Suicidio y crisis': Object.freeze(["), false);
  assert.equal(runtime.includes("'Violencia y agresión sexual': Object.freeze(["), false);
});

test('resources start page pivots the second quick action to emotional support', () => {
  assert.match(runtime, /Necesito apoyo emocional/);
  assert.match(runtime, /ansiedad, la tristeza, la soledad, el miedo o el desbordamiento/);
  assert.match(runtime, /emotional\.href = '\/gestion-emocional\/'/);
});

test('resource expansion routes only point to root-relative internal destinations', () => {
  const routeBlock = runtime.slice(runtime.indexOf('const ROUTE_EXPANSIONS'), runtime.indexOf('function enhanceResourceTree'));
  const routes = [...routeBlock.matchAll(/\['([^']+)',\s*'([^']+)'\]/g)];
  assert.ok(routes.length >= 30);
  for (const [, href, label] of routes) {
    assert.ok(href.startsWith('/'), `${label}: route must stay internal`);
    assert.doesNotMatch(href, /^\/\//, `${label}: protocol-relative URL not allowed`);
  }
});
