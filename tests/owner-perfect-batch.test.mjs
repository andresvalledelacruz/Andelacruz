import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('las tres tarjetas de decision son clicables en toda su superficie sin cambiar la jerarquia visual', async () => {
  const app = await read('app.js');
  assert.match(app, /\.needs-grid \.need-card\{position:relative;cursor:pointer\}/);
  assert.match(app, /\.needs-grid \.need-card \.need-link::after\{content:"";position:absolute;inset:0;border-radius:22px\}/);
  assert.match(app, /\.needs-grid \.need-card:focus-within\{outline:3px solid #8A4939/);
  assert.doesNotMatch(app, /\.need-card\.need-primary \.need-link::after/);
});

test('la medicion de atencion es agregada y excluye rutas sensibles', async () => {
  const analytics = await read('visitor-analytics.js');
  assert.match(analytics, /record_privacy_safe_interaction/);
  assert.match(analytics, /SENSITIVE_PREFIXES/);
  for (const sensitive of ['/buscar/', '/ayuda-urgente.html', '/suicidio/', '/mi-pareja-me-maltrata-y-no-se-que-hacer/', '/he-sufrido-una-agresion-sexual-y-no-se-que-hacer/']) {
    assert.ok(analytics.includes(sensitive), `falta exclusion sensible ${sensitive}`);
  }
  for (const forbidden of ['localStorage', 'sessionStorage', 'mousemove', 'pointermove', 'screenX', 'screenY', 'innerText']) {
    assert.ok(!analytics.includes(forbidden), `telemetria prohibida: ${forbidden}`);
  }
  assert.match(analytics, /section_view/);
  assert.match(analytics, /scroll_depth/);
});

test('el panel privado no se indexa ni expone secretos del propietario', async () => {
  const panel = await read('panel-analitica.html');
  const robots = await read('robots.txt');
  const sitemap = await read('sitemap-growth.xml');
  assert.match(panel, /noindex,nofollow,nosnippet,noarchive/);
  assert.match(panel, /get_owner_privacy_safe_analytics/);
  assert.match(panel, /no es seguimiento ocular/i);
  assert.doesNotMatch(panel, /v_expected|sha256|owner.*hash/i);
  assert.match(robots, /Disallow: \/panel-analitica\.html/);
  assert.ok(!sitemap.includes('panel-analitica.html'));
});

test('la migracion de analitica no guarda perfiles ni texto libre y protege el panel', async () => {
  const sql = await read('supabase/migrations/20260915150500_add_privacy_safe_interaction_analytics.sql');
  const rotation1 = await read('supabase/migrations/20260916080500_rotate_owner_analytics_token.sql');
  const rotation2 = await read('supabase/migrations/20260916081500_rotate_owner_analytics_token_v2.sql');
  assert.match(sql, /interaction_daily_analytics/);
  assert.match(sql, /get_owner_privacy_safe_analytics/);
  assert.match(sql, /v_path = '\/buscar\/'/);
  assert.match(sql, /v_path = '\/ayuda-urgente\.html'/);
  assert.match(sql, /No coordinates, free text, query strings, cookies, IDs, session replay or user profiles/);
  for (const rotation of [rotation1, rotation2]) {
    assert.match(rotation, /v_old_hash constant text := '[a-f0-9]{64}'/);
    assert.match(rotation, /v_new_hash constant text := '[a-f0-9]{64}'/);
    assert.doesNotMatch(rotation, /p_owner_token\s*:=|owner_token\s*=\s*'/i);
  }
});

test('buscar ayuda tolera lenguaje imperfecto sin prometer adivinar pensamientos', async () => {
  const search = await read('buscar/index.html');
  const bridge = await read('src/search-language-bridge.js');
  assert.match(search, /Intentamos entender faltas habituales, abreviaturas y formas coloquiales/);
  assert.match(search, /no adivinamos lo que no has escrito ni hacemos diagnósticos/);
  assert.match(search, /search-language-bridge\.js/);
  assert.match(bridge, /LANGUAGE_BRIDGE_VERSION/);
  assert.match(bridge, /suicidio/i);
});

test('historias empieza por grupos y reduce scroll antes de mostrar relatos', async () => {
  const page = await read('historias/index.html');
  const runtime = await read('stories-index.js');
  assert.match(page, /id="story-categories"/);
  assert.match(runtime, /story-categories/);
  assert.match(runtime, /renderCategories/);
  assert.match(runtime, /renderStories/);
});

test('existen hubs especializados y el hub de suicidio permanece sin telemetria comercial', async () => {
  const temas = await read('temas/index.html');
  const recursos = await read('recursos/index.html');
  const suicidio = await read('suicidio/index.html');
  const fuentes = await read('fuentes-y-revision.html');
  const prensa = await read('prensa.html');
  for (const term of ['Suicidio', 'Soledad', 'Violencia', 'Ansiedad', 'Salud', 'Rupturas']) assert.match(temas, new RegExp(term, 'i'));
  assert.match(recursos, /Directorio maestro/i);
  assert.match(suicidio, /tel:112/);
  assert.match(suicidio, /tel:024/);
  assert.ok(!suicidio.includes('visitor-analytics.js'));
  assert.ok(!suicidio.includes('public-page-runtime.js'));
  assert.match(fuentes, /No fingimos autoridad/);
  assert.match(prensa, /No publicaremos texto de búsquedas, relatos privados, datos identificativos/);
});

test('webs amigas ofrece exactamente 50 referencias externas con transparencia', async () => {
  const page = await read('webs-amigas.html');
  const matches = [...page.matchAll(/class="friend" href="https:\/\//g)];
  assert.equal(matches.length, 50);
  assert.match(page, /no significa[\s\S]*colaboración, patrocinio, afiliación ni respaldo recíproco/i);
  assert.match(page, /No cobramos por ocupar una posición/i);
});

test('sitemap publica las nuevas superficies utiles y excluye el panel privado', async () => {
  const sitemap = await read('sitemap-growth.xml');
  for (const path of ['/historias/', '/temas/', '/recursos/', '/suicidio/', '/fuentes-y-revision.html', '/webs-amigas.html', '/prensa.html']) {
    assert.ok(sitemap.includes(`https://desgracias.es${path}`), `falta ${path}`);
  }
  assert.ok(!sitemap.includes('/panel-analitica.html'));
});
