import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSearchText} from '../src/search-normalization.js';
import {routeSearchQuery} from '../src/search-crisis-router.js';

test('Search Help 3.0 normalizes common spelling and phonetic variants explicitly', () => {
  const cases = new Map([
    ['trbajo', 'trabajo'],
    ['trabago', 'trabajo'],
    ['hechado', 'echado'],
    ['ansieda', 'ansiedad'],
    ['anciedad', 'ansiedad'],
    ['anxiedad', 'ansiedad'],
    ['solrdad', 'soledad'],
    ['famila', 'familia'],
    ['rutura', 'ruptura'],
    ['alqiler', 'alquiler'],
    ['deuds', 'deudas'],
    ['ipoteca', 'hipoteca'],
    ['aiuda', 'ayuda'],
    ['urjente', 'urgente'],
    ['suisidio', 'suicidio'],
    ['suizidarme', 'suicidarme'],
    ['violensia', 'violencia'],
    ['maltratta', 'maltrata']
  ]);
  for (const [raw, expected] of cases) assert.equal(normalizeSearchText(raw), expected, raw);
});

test('crisis typos still reach the Safety router before ordinary content routing', () => {
  for (const query of ['no qiero vivir', 'no kiero vivir']) {
    const result = routeSearchQuery(query);
    assert.equal(result.matched, true, query);
    assert.equal(result.safety_level, 'P0', query);
    assert.equal(result.route.url, '/ayuda-urgente.html', query);
  }
});

test('normalization never rewrites negation', () => {
  assert.equal(normalizeSearchText('no qiero morir'), 'no quiero morir');
  assert.equal(normalizeSearchText('no estoy en peligro'), 'no estoy en peligro');
});
