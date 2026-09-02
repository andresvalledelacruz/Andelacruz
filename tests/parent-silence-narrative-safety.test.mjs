import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = new URL("../familia/mi-madre-o-mi-padre-no-me-habla/index.html", import.meta.url);
const sitemapPath = new URL("../sitemap.xml", import.meta.url);
const html = await readFile(pagePath, "utf8");
const sitemap = await readFile(sitemapPath, "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

test("separa adulto, menor y necesidades básicas", () => {
  assert.match(text, /si eres adulto, puedes decidir el contacto; si eres menor, necesitas protección adulta/);
  assert.match(text, /no te corresponde negociar en igualdad ni resolver el silencio a solas/);
  assert.match(text, /comida, medicación, atención y protección/);
  assert.doesNotMatch(text, /un menor debe mediar|eres responsable de que vuelva/);
});

test("clasifica el silencio sin leer la mente ni diagnosticar", () => {
  assert.match(text, /pausa comunicada/);
  assert.match(text, /distancia difusa/);
  assert.match(text, /ruptura explícita/);
  assert.match(text, /silencio repetido tras un límite/);
  assert.match(text, /con el silencio solo no podemos diagnosticar/);
  assert.doesNotMatch(text, /es narcisista|alienación parental|trastorno de personalidad/);
});

test("protege contacto único, consentimiento y límites", () => {
  assert.match(text, /un contacto claro, no una persecución/);
  assert.match(text, /no voy a insistir cada día/);
  assert.match(text, /repetir mensajes, usar números distintos, presentarte en su casa/);
  assert.match(text, /esto no garantiza reconciliación/);
  assert.match(text, /disculpa útil nombra una conducta propia y su impacto/);
});

test("evita triangulación y protege hijos y nietos", () => {
  assert.match(text, /hermanos, pareja, hijos o nietos como mensajeros, prueba de lealtad ni moneda de cambio/);
  assert.match(text, /tercera persona solo debería intervenir si acepta libremente/);
  assert.match(text, /custodia, visitas o decisiones sobre menores/);
  assert.match(text, /no determina derechos de contacto/);
});

test("protege privacidad digital y material", () => {
  assert.match(text, /dispositivo seguro/);
  assert.match(text, /contraseñas, códigos bancarios, ubicación ni imágenes íntimas/);
  assert.match(text, /no uses alimentos, dinero, documentación o atención sanitaria como moneda/);
  assert.doesNotMatch(html, /href="\/#inicio"|contar mi historia/i);
});

test("mantiene 112, 016, ANAR y 024 con alcance exacto", () => {
  assert.match(html, /href="tel:112"/);
  assert.match(html, /href="tel:016"/);
  assert.match(html, /href="tel:900202010"/);
  assert.match(html, /href="tel:024"/);
  assert.match(text, /si eres mujer y estás viviendo violencia contra ti/);
  assert.match(text, /pensamientos de suicidio o riesgo de hacerte daño/);
  assert.match(text, /no sustituye la atención sanitaria presencial/);
  assert.match(text, /no es un servicio de emergencias y no supervisa mensajes en tiempo real/);
});

test("protege evidencia, fuentes, canonical, sitemap y firewall comercial", () => {
  assert.match(text, /datos poblacionales no predicen una reconciliación individual/);
  assert.match(html, /https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/37304343\//);
  assert.match(html, /https:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC12504279\//);
  assert.match(html, /https:\/\/violenciagenero\.igualdad\.gob\.es\/informacion-3\/recursos\/telefono016\//);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/familia\/mi-madre-o-mi-padre-no-me-habla\//);
  assert.match(text, /actualizado el 2 de septiembre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/familia\/mi-madre-o-mi-padre-no-me-habla\/<\/loc><lastmod>2026-09-02<\/lastmod>/);
  assert.doesNotMatch(html, /data-ad|affiliate|afiliad|patrocinad|sponsor|utm_|[?&]ref=|comprar ahora|contrata ahora|precio|suscríbete/i);
});
