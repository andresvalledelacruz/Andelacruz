import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = new URL("../familia/mi-madre-o-mi-padre-no-me-habla/index.html", import.meta.url);
const sitemapPath = new URL("../sitemap.xml", import.meta.url);
const html = await readFile(pagePath, "utf8");
const sitemap = await readFile(sitemapPath, "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

test("distingue vínculo, cuidados, logística y obligaciones", () => {
  assert.match(text, /separa vínculo, cuidados y obligaciones/);
  assert.match(text, /hay medicación, alimentación, acompañamiento, dependencia/);
  assert.match(text, /custodia, alimentos, representación, herencia/);
  assert.match(text, /no calcula plazos ni interpreta resoluciones/);
});

test("ofrece un mapa de 48 horas con safety primero", () => {
  assert.match(text, /mapa de decisión para las próximas 48 horas/);
  assert.match(text, /primero, seguridad y cuidados/);
  assert.match(text, /persona menor sin atención/);
  assert.match(text, /respeta el no contacto/);
  assert.doesNotMatch(text, /preséntate sin avisar|usa otro número para que responda/);
});

test("no inventa intención, diagnóstico ni resultado", () => {
  assert.match(text, /con el silencio solo no podemos diagnosticar a nadie/);
  assert.match(text, /no todo silencio significa lo mismo/);
  assert.match(text, /son ejemplos, no fórmulas garantizadas/);
  assert.doesNotMatch(text, /tu (madre|padre) es (narcisista|tóxic)|seguro volverá/);
});

test("protege contacto, menores y terceras personas", () => {
  assert.match(text, /no uses números alternativos, perfiles nuevos, terceras personas ni menores/);
  assert.match(text, /no utilices a hermanos, pareja, hijos o nietos como mensajeros/);
  assert.match(text, /si eres menor de edad/);
  assert.match(html, /href="tel:900202010"/);
  assert.match(text, /gratuito, confidencial y disponible las 24 horas/);
});

test("separa alcance legal y no presenta la guía como asesoramiento", () => {
  assert.match(text, /no determina tu situación jurídica, custodia ni medidas aplicables/);
  assert.match(text, /no determina derechos de contacto/);
  assert.match(html, /https:\/\/www\.boe\.es\/eli\/es\/rd\/1889\/07\/24\/\(1\)\/con/);
});

test("protege privacidad y deriva ciberseguridad con alcance correcto", () => {
  assert.match(text, /no publiques mensajes completos, nombres, direcciones, documentos/);
  assert.match(text, /contraseñas propias; no pidas ni uses credenciales ajenas/);
  assert.match(text, /el 017 de incibe ofrece orientación en ciberseguridad/);
  assert.match(text, /no es un servicio de emergencias ni sustituye al 112/);
});

test("mantiene carriles 112, 016 y 024", () => {
  assert.match(html, /href="tel:112"/);
  assert.match(html, /href="tel:016"/);
  assert.match(html, /href="tel:024"/);
  assert.match(text, /si eres mujer y estás viviendo violencia contra ti/);
  assert.match(text, /pensamientos de suicidio o riesgo de hacerte daño/);
});

test("usa búsqueda privada, fuentes y metadatos coherentes", () => {
  assert.match(html, /href="\/buscar\/"/);
  assert.match(text, /no introduzcas nombres, direcciones, teléfonos, documentos, capturas ni mensajes completos/);
  assert.match(html, /href="\/assets\/fonts\/fonts\.css"/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);
  assert.match(html, /"dateModified":"2026-10-26"/);
  assert.match(text, /actualizado el 26 de octubre de 2026/);
  assert.match(sitemap, /mi-madre-o-mi-padre-no-me-habla\/<\/loc><lastmod>2026-10-26<\/lastmod>/);
});

test("mantiene firewall comercial", () => {
  assert.doesNotMatch(html, /data-ad|affiliate|afiliad|patrocinad|sponsor|utm_|[?&]ref=|comprar ahora|contrata ahora|suscríbete/i);
  assert.doesNotMatch(html, /contar mi historia|href="\/#inicio"/i);
});
