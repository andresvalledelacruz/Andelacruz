import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { routeSearchQuery } from '../src/search-crisis-router.js';
import { routeKnownContentQuery } from '../src/search-content-catalog.js';
import { buildSearchClarification } from '../src/search-clarification.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];
const errors = [];

function read(relative) {
  const file = path.join(ROOT, relative);
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${relative}`);
  return fs.readFileSync(file, 'utf8');
}

function check(name, condition, detail) {
  checks.push({ name, status: condition ? 'PASS' : 'FAIL', detail });
  if (!condition) errors.push(`${name}: ${detail}`);
}

const readiness = spawnSync(process.execPath, ['scripts/audit-launch-readiness.mjs'], {
  cwd: ROOT,
  encoding: 'utf8'
});
check('launch-readiness-gate', readiness.status === 0, readiness.status === 0 ? 'technical readiness gate passes' : readiness.stderr || readiness.stdout);

const home = read('index.html');
const loader = read('app.js');
const searchEntry = read('search-home-entry.js');
const searchUi = read('buscar/index.html');
const appCore = read('app-core.js');
const urgent = read('ayuda-urgente.html');
const notFound = read('404.html');

check('homepage-search-loader', loader.includes("load('/search-home-entry.js')"), 'homepage loads the discoverability layer');
for (const location of ['main-nav', 'hero', 'needs', 'footer']) {
  check(`homepage-search-${location}`, searchEntry.includes(`searchEntry = '${location}'`), `search entry exists in ${location}`);
}
check('homepage-v9-structure', home.includes('class="hero-final-actions"') && home.includes('<h3>Busco orientación</h3>'), 'V9 structural anchors remain present');

const ordinaryCases = [
  ['mi ex me ha bloqueado de todas partes', '/rupturas/mi-ex-me-ha-bloqueado/'],
  ['por la noche me siento sola', '/soledad/me-siento-solo-por-la-noche/'],
  ['mi madre ha dejado de hablarme', '/familia/mi-madre-o-mi-padre-no-me-habla/'],
  ['mi jefe me tiene amargado', '/trabajo/mi-jefe-me-hace-la-vida-imposible/'],
  ['me da miedo abrir la app del banco', '/dinero/me-da-miedo-mirar-mi-cuenta/'],
  ['murio y no pude despedirme', '/duelo/no-pude-despedirme/']
];
for (const [query, expected] of ordinaryCases) {
  const primary = routeSearchQuery(query);
  const result = primary.matched ? primary : routeKnownContentQuery(query);
  check(`search-ordinary:${query}`, result.matched === true && result.route?.url === expected, `expected ${expected}, got ${result.route?.url || 'unmatched'}`);
}

const safetyCases = [
  ['quiero morir', 'P0', '/ayuda-urgente.html'],
  ['mi hijo dice que se va a matar', 'P0', '/me-preocupa-que-alguien-pueda-suicidarse/'],
  ['mi pareja me esta pegando ahora', 'P0', '/mi-pareja-me-maltrata-y-no-se-que-hacer/'],
  ['me estan violando', 'P0', '/he-sufrido-una-agresion-sexual-y-no-se-que-hacer/'],
  ['tengo muchas deudas y no se por donde empezar', 'P1', '/dinero/tengo-deudas-y-no-se-por-donde-empezar/']
];
for (const [query, level, expected] of safetyCases) {
  const result = routeSearchQuery(query);
  check(
    `search-safety:${query}`,
    result.matched === true && result.safety_level === level && result.route?.url === expected && result.suppress_commercial_ui === true,
    `expected ${level} ${expected} noncommercial; got ${result.safety_level || 'NONE'} ${result.route?.url || 'unmatched'}`
  );
}

const ambiguous = routeSearchQuery('no se como llamarlo solo se que algo va mal');
const clarification = buildSearchClarification(ambiguous);
check('search-clarification', ambiguous.matched === false && ambiguous.needs_clarification === true && clarification.needed === true, 'unknown wording asks for clarification instead of guessing');

const historical = routeSearchQuery('intente suicidarme hace diez anos');
check('search-historical-context', historical.matched === false && historical.safety_level === 'NONE', 'historical wording is not relabeled as a current crisis');

check('search-ui-safety-first-order', searchUi.indexOf('routeSearchQuery(submittedQuery)') >= 0 && searchUi.indexOf('routeKnownContentQuery(submittedQuery)') > searchUi.indexOf('routeSearchQuery(submittedQuery)'), 'Safety router executes before ordinary content fallback');
check('search-ui-clears-query', searchUi.indexOf("query.value = '';", searchUi.indexOf('const submittedQuery')) < searchUi.indexOf('routeSearchQuery(submittedQuery)'), 'textarea is cleared before routing');
check('search-ui-local-privacy', !/(localStorage|sessionStorage|indexedDB|XMLHttpRequest|sendBeacon)/.test(searchUi), 'search page has no direct storage or telemetry sink');

check('story-form-present', home.includes('id="story-form"'), 'homepage retains story submission form');
check('story-safety-layer', appCore.includes('name="safetyLevel"') && appCore.includes('name="ageGate"') && appCore.includes('name="privacyConsent"'), 'story form installs safety, adult and privacy controls');
check('story-submit-wiring', appCore.includes("functions.invoke('submit-story'") && appCore.includes("storyForm?.addEventListener('submit'"), 'story submission remains wired to moderated submit-story function');

check('urgent-help-resources', urgent.includes('tel:112') && urgent.includes('tel:024'), 'urgent surface keeps 112 and 024 direct-call resources');
check('urgent-help-no-story-capture', !urgent.includes('data-open-story'), 'urgent surface does not capture stories');
check('404-recovery', /name=["']robots["'][^>]*noindex|noindex[^>]*name=["']robots["']/i.test(notFound) && /href=["']\/["']/.test(notFound), '404 is noindex and links back to home');

const report = {
  version: 1,
  hard_failures: errors.length,
  decision: errors.length ? 'HOLD' : 'SMOKE_GO',
  checks,
  errors
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
