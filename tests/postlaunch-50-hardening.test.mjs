import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const error404 = read('404.html');
const headers = read('_headers');
const security = read('.well-known/security.txt');
const cookies = read('cookies.html');
const legal = read('aviso-legal.html');
const transparency = read('transparencia.html');
const sitemap = read('sitemap.xml');
const trustCss = read('trust.css');

const sitemapRows = [...sitemap.matchAll(/<url><loc>(https:\/\/desgracias\.es\/[^<]*)<\/loc><lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod><\/url>/g)].map(([,loc,lastmod]) => ({ loc, lastmod }));
const localPath = loc => {
  const pathname = new URL(loc).pathname;
  if (pathname === '/') return 'index.html';
  const clean = pathname.replace(/^\//, '');
  return pathname.endsWith('/') ? `${clean}index.html` : clean;
};
const publicPages = sitemapRows.map(row => ({ ...row, html: read(localPath(row.loc)) }));

// 01–10 · Recuperación, accesibilidad y privacidad del 404.
test('01 404 permanece fuera del índice', () => assert.match(error404, /meta name="robots" content="noindex,follow"/));
test('02 404 ofrece Buscar ayuda como recuperación primaria', () => assert.match(error404, /href="\/buscar\/"/));
test('03 404 ofrece Ayuda urgente de forma nativa', () => assert.match(error404, /href="\/ayuda-urgente\.html"/));
test('04 404 deriva el contacto a una ruta interna', () => assert.match(error404, /href="\/contacto\.html"/));
test('05 404 no depende de mailto para recuperarse', () => assert.doesNotMatch(error404, /mailto:/i));
test('06 404 no descarga tipografías de terceros', () => assert.doesNotMatch(error404, /fonts\.(?:googleapis|gstatic)\.com/i));
test('07 404 conserva un único h1 comprensible', () => assert.equal((error404.match(/<h1\b/gi) || []).length, 1));
test('08 404 conserva objetivos táctiles de al menos 48 px', () => assert.match(trustCss, /\.actions a\{[^}]*min-height:48px/));
test('09 404 declara idioma español', () => assert.match(error404, /<html lang="es">/));
test('10 404 conserva vuelta al inicio', () => assert.match(error404, /href="\/">Volver al inicio<\/a>/));

// 11–22 · Cabeceras defensivas y CSP en modo observación antes de enforcement.
test('11 bloquea MIME sniffing', () => assert.match(headers, /X-Content-Type-Options: nosniff/));
test('12 aplica una política de referrer minimizada', () => assert.match(headers, /Referrer-Policy: strict-origin-when-cross-origin/));
test('13 impide framing mediante X-Frame-Options', () => assert.match(headers, /X-Frame-Options: DENY/));
test('14 deshabilita cámara por defecto', () => assert.match(headers, /camera=\(\)/));
test('15 deshabilita micrófono por defecto', () => assert.match(headers, /microphone=\(\)/));
test('16 deshabilita geolocalización por defecto', () => assert.match(headers, /geolocation=\(\)/));
test('17 deshabilita Payment API por defecto', () => assert.match(headers, /payment=\(\)/));
test('18 publica HSTS sin comprometer subdominios ajenos', () => { assert.match(headers, /Strict-Transport-Security: max-age=31536000/); assert.doesNotMatch(headers, /includeSubDomains/i); });
test('19 aísla el opener entre orígenes', () => assert.match(headers, /Cross-Origin-Opener-Policy: same-origin/));
test('20 mantiene CSP en report-only durante la fase de observación', () => assert.match(headers, /Content-Security-Policy-Report-Only:/));
test('21 CSP restringe base-uri al mismo origen', () => assert.match(headers, /base-uri 'self'/));
test('22 CSP declara frame-ancestors none', () => assert.match(headers, /frame-ancestors 'none'/));

// 23–27 · Divulgación de seguridad responsable.
test('23 security.txt ofrece contacto de seguridad', () => assert.match(security, /^Contact: mailto:info@desgracias\.es$/m));
test('24 security.txt tiene una expiración futura y renovable', () => { const value = security.match(/^Expires: (.+)$/m)?.[1]; assert.ok(value); assert.ok(new Date(value) > new Date('2026-09-15T00:00:00Z')); });
test('25 security.txt usa canonical HTTPS propio', () => assert.match(security, /^Canonical: https:\/\/desgracias\.es\/\.well-known\/security\.txt$/m));
test('26 security.txt declara español como idioma preferente', () => assert.match(security, /^Preferred-Languages: es(?:,|$)/m));
test('27 security.txt no publica datos sensibles ni tokens', () => assert.doesNotMatch(security, /(token|password|secret|api[_-]?key)\s*[:=]/i));

// 28–38 · Cookies, futura monetización y transparencia.
test('28 política de cookies tiene canonical propio', () => assert.match(cookies, /rel="canonical" href="https:\/\/desgracias\.es\/cookies\.html"/));
test('29 política de cookies es indexable', () => assert.match(cookies, /meta name="robots" content="index,follow/));
test('30 declara que no hay cookies publicitarias actuales', () => assert.match(cookies, /no utiliza actualmente cookies publicitarias/i));
test('31 declara ausencia actual de remarketing', () => assert.match(cookies, /remarketing/i));
test('32 analítica interna queda descrita como sin cookies de analítica', () => assert.match(cookies, /sin cookies de analítica/i));
test('33 Buscar ayuda no persiste la consulta en cookies', () => assert.match(cookies, /no guarda esa consulta en cookies/i));
test('34 distingue el almacenamiento técnico de Supabase del perfilado', () => assert.match(cookies, /almacenamiento técnico del navegador[\s\S]*no se utiliza con fines publicitarios/i));
test('35 exige actualizar política antes de publicidad no esencial', () => assert.match(cookies, /no se activarán antes de actualizar esta política/i));
test('36 exige mecanismo de consentimiento cuando corresponda', () => assert.match(cookies, /mecanismo de consentimiento/i));
test('37 enlaza la política de privacidad', () => assert.match(cookies, /href="\/privacidad\.html"/));
test('38 aviso legal y transparencia enlazan Cookies', () => { assert.match(legal, /href="\/cookies\.html"/); assert.match(transparency, /href="\/cookies\.html"/); });

// 39–50 · Integridad SEO pública y prevención de regresiones de navegación.
test('39 sitemap no contiene URLs duplicadas', () => assert.equal(new Set(sitemapRows.map(x => x.loc)).size, sitemapRows.length));
test('40 todas las URLs del sitemap son HTTPS de desgracias.es', () => assert.ok(sitemapRows.every(x => x.loc.startsWith('https://desgracias.es/'))));
test('41 sitemap no incorpora query strings ni fragments', () => assert.ok(sitemapRows.every(x => !/[?#]/.test(new URL(x.loc).pathname + new URL(x.loc).search + new URL(x.loc).hash))));
test('42 todos los lastmod tienen formato ISO de fecha', () => assert.ok(sitemapRows.every(x => /^\d{4}-\d{2}-\d{2}$/.test(x.lastmod))));
test('43 cada URL del sitemap resuelve a un archivo físico', () => assert.ok(sitemapRows.every(x => fs.existsSync(new URL(`../${localPath(x.loc)}`, import.meta.url)))));
test('44 el sitemap no incluye páginas noindex', () => assert.ok(publicPages.every(x => !/meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(x.html))));
test('45 cada página indexable tiene exactamente un canonical', () => assert.ok(publicPages.every(x => (x.html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi) || []).length === 1)));
test('46 canonical coincide con la URL declarada en sitemap', () => assert.ok(publicPages.every(x => x.html.includes(`href="${x.loc}"`) || x.html.includes(`href='${x.loc}'`))));
test('47 todas las páginas indexables declaran lang es', () => assert.ok(publicPages.every(x => /<html\b[^>]*lang=["']es["']/i.test(x.html))));
test('48 todas las páginas indexables tienen un único h1', () => assert.ok(publicPages.every(x => (x.html.match(/<h1\b/gi) || []).length === 1)));
test('49 ningún href público usa javascript:', () => assert.ok(publicPages.every(x => !/href\s*=\s*["']javascript:/i.test(x.html))));
test('50 ningún href público apunta a localhost, staging o pages.dev', () => assert.ok(publicPages.every(x => !/href\s*=\s*["'][^"']*(?:localhost|127\.0\.0\.1|pages\.dev)/i.test(x.html))));
