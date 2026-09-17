import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const data = await readFile(file);
    const type = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' }[path.extname(file)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type }); res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
await mkdir(path.join(root, 'qa-static-homepage'), { recursive: true });
try {
  for (const mode of ['no-js', 'normal', 'failed-core']) {
    for (const width of [320, 360, 390, 414, 430, 1440]) {
      const context = await browser.newContext({ javaScriptEnabled: mode !== 'no-js', viewport: { width, height: 900 } });
      await context.route('**/*', route => {
        const url = route.request().url();
        if (!url.startsWith(origin) || (mode === 'failed-core' && url.endsWith('/app-core.js'))) return route.abort();
        return route.continue();
      });
      const page = await context.newPage();
      await page.goto(origin, { waitUntil: 'networkidle' });
      const urgent = page.locator('.urgent-help-link');
      assert.equal(await urgent.count(), 1, `${mode}/${width}: duplicate urgent header`);
      assert.ok(await urgent.isVisible());
      const box = await urgent.boundingBox();
      assert.ok(box.height >= 44 && box.x >= -1 && box.x + box.width <= width + 1, `${mode}/${width}: urgent clipped or too small`);
      assert.equal(await page.locator('[data-urgent-entry="needs"]').count(), 1, 'reading card must not become a second urgent card');
      if (mode !== 'no-js') {
        const card = page.locator('a.need-card[data-urgent-entry="needs"]');
        assert.equal(await card.count(), 1, 'the entire urgent card must be one native link');
        assert.equal(await card.locator('a, button, [tabindex]').count(), 0, 'no nested interactive controls');
        await card.click({ position: { x: 12, y: 12 } });
        await page.waitForURL(`${origin}/ayuda-urgente.html`);
        await page.goto(origin, { waitUntil: 'networkidle' });
        await page.locator('#resource-directory-entry').click();
        await page.waitForURL(`${origin}/recursos/`);
        await page.locator('#resource-category').selectOption('duelo');
        assert.ok(await page.locator('#resource-directory > li:not([hidden])').count() > 0);
        assert.equal(await page.locator('#resource-directory > li:not([hidden]):not([data-category="duelo"])').count(), 0);
        assert.ok(await page.locator('a[href="tel:112"]').isVisible());
        await page.goto(origin, { waitUntil: 'networkidle' });
      }
      assert.equal(await page.locator('#recursos .resource-grid > a').count(), 10);
      assert.equal(await page.locator('[data-search-entry="hero"]').getAttribute('href'), '/buscar/');
      assert.ok(await page.locator('.hero-final-privacy a[href="privacidad.html"]').isVisible());
      assert.equal(await page.title(), 'Desgracias.es | Ayuda, historias y recursos para momentos difíciles');
      assert.ok(await page.locator('[data-story-disclosure="static"]').isVisible());
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${mode}/${width}: horizontal overflow`);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('href')), '#contenido');
      if (width === 390 || width === 1440) await page.screenshot({ path: path.join(root, `qa-static-homepage/${mode}-${width}.png`), fullPage: true });
      await urgent.click();
      await page.waitForURL(`${origin}/ayuda-urgente.html`);
      assert.ok(await page.locator('a[href="tel:112"]').count());
      assert.ok(await page.locator('a[href="tel:024"]').count());
      await page.goto(origin, { waitUntil: 'networkidle' });
      await page.locator('[data-search-entry="hero"]').click();
      await page.waitForURL(`${origin}/buscar/`);
      assert.ok(await page.locator('main').isVisible());
      await context.close();
      console.log(`PASS ${mode} ${width}px: urgent, search, ten resources, privacy, keyboard and layout`);
    }
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
