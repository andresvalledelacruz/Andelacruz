import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync('index.html', 'utf8');
const styles = fs.readFileSync('styles.css', 'utf8');
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
const legal = fs.readFileSync('aviso-legal.html', 'utf8');
const transparency = fs.readFileSync('transparencia.html', 'utf8');
const contact = fs.readFileSync('contacto.html', 'utf8');

function mainNav(html) {
  return html.match(/<nav id="main-nav"[\s\S]*?<\/nav>/)?.[0] || '';
}

test('Comunidad e Impacto desaparecen de la navegación superior pero siguen disponibles al final', () => {
  const nav = mainNav(home);
  assert.doesNotMatch(nav, /href="#comunidad"/);
  assert.doesNotMatch(nav, /href="#impacto"/);
  assert.match(home, /id="comunidad"/);
  assert.match(home, /id="impacto"/);
  assert.match(home, /<footer[\s\S]*href="#comunidad"/);
  assert.match(home, /<footer[\s\S]*href="#impacto"/);
});

test('Contacto superior es una ruta interna segura y el footer expone confianza/legal', () => {
  const nav = mainNav(home);
  assert.match(nav, /href="\/contacto\.html">Contacto/);
  for (const href of ['/sobre.html', '/como-revisamos.html', '/aviso-legal.html', '/privacidad.html', '/transparencia.html', '/contacto.html']) {
    assert.match(home, new RegExp(`href="${href.replaceAll('/', '\\/').replace('.', '\\.')}"`));
  }
});

test('la portada usa datos estructurados WebSite + WebPage sin SearchAction ficticia', () => {
  assert.match(home, /"@graph"/);
  assert.match(home, /"@type": "WebSite"/);
  assert.match(home, /"@type": "WebPage"/);
  assert.match(home, /"dateModified": "2026-09-15"/);
  assert.doesNotMatch(home, /SearchAction/);
});

test('las páginas legales y de transparencia no inventan una fase comercial activa', () => {
  assert.match(legal, /Andrés Valle de la Cruz/);
  assert.match(legal, /fase no económica/);
  assert.match(transparency, /fase no económica/);
  assert.match(transparency, /P0\/P1/);
  assert.match(transparency, /no venderá el texto de historias/);
  assert.match(contact, /No está atendido como un servicio de emergencia/);
});

test('el sitemap incluye las nuevas superficies públicas de confianza', () => {
  for (const url of ['https://desgracias.es/aviso-legal.html', 'https://desgracias.es/transparencia.html', 'https://desgracias.es/contacto.html']) {
    assert.equal((sitemap.match(new RegExp(url.replaceAll('.', '\\.'), 'g')) || []).length, 1, `${url} debe aparecer exactamente una vez`);
  }
});

test('la deuda CSS no vuelve a introducir estilos inline en Recursos', () => {
  const resources = home.match(/<div class="resource-grid">[\s\S]*?<\/div>\s*\n\s*<div class="important-note">/)?.[0] || '';
  assert.ok(resources, 'resource-grid debe existir');
  assert.doesNotMatch(resources, /style=/);
  assert.doesNotMatch(home, /data-urgent-help-emphasis/);
  assert.match(styles, /\.resource-card-link/);
  assert.match(styles, /\.resource-link-cue/);
});
