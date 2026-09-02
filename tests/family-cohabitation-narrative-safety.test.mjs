import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = new URL("../familia/vivo-con-mi-familia-y-no-aguanto-mas/index.html", import.meta.url);
const sitemapPath = new URL("../sitemap.xml", import.meta.url);
const html = await readFile(pagePath, "utf8");
const sitemap = await readFile(sitemapPath, "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

test("distingue convivencia, dependencia y violencia sin diagnosticar", () => {
  assert.match(text, /convivencia difícil, dependencia y violencia no son lo mismo/);
  assert.match(text, /amenazas, agresiones, humillación sistemática, vigilancia, aislamiento/);
  assert.match(text, /no necesitas demostrar que “es suficientemente grave”/);
  assert.doesNotMatch(text, /tu familia es (tóxica|narcisista)|tienes que confrontar/);
});

test("protege necesidades básicas y salida gradual", () => {
  assert.match(text, /dinero, vivienda, papeles, discapacidad, cuidados o edad/);
  assert.match(text, /la salida suele ser un proceso/);
  assert.match(text, /vivienda posible, ingresos estables, documentación y red de apoyo/);
  assert.match(text, /medicación, movilidad, personas dependientes y animales/);
  assert.doesNotMatch(text, /vete hoy|márchate inmediatamente|corta todo contacto/);
});

test("exige salida segura condicionada y reversible", () => {
  assert.match(text, /persona segura, un lugar y un transporte/);
  assert.match(text, /medicación, teléfono y copias de tu documentación/);
  assert.match(text, /no intentes recuperar documentos originales ni anuncies la salida/);
  assert.match(text, /si eso puede aumentar el peligro/);
});

test("protege privacidad digital y elimina captación de historias", () => {
  assert.match(text, /dispositivo compartido/);
  assert.match(text, /contraseñas propias y no compartas códigos de verificación/);
  assert.match(text, /dinero, documentos, dirección alternativa ni ubicación/);
  assert.doesNotMatch(html, /href="\/#inicio"|contar mi historia/i);
});

test("protege específicamente a menores", () => {
  assert.match(text, /si eres menor de edad/);
  assert.match(text, /adulto seguro/);
  assert.match(html, /href="tel:900202010"/);
  assert.match(text, /gratuito, confidencial y está disponible las 24 horas/);
  assert.doesNotMatch(text, /debes mediar entre tus padres|protege a los adultos/);
});

test("mantiene carriles 112, 016 y 024 con alcance correcto", () => {
  assert.match(html, /href="tel:112"/);
  assert.match(html, /href="tel:016"/);
  assert.match(html, /href="tel:024"/);
  assert.match(text, /si eres mujer y estás viviendo violencia contra ti/);
  assert.match(text, /pensamientos de suicidio o riesgo de hacerte daño/);
  assert.match(text, /no sustituye la atención sanitaria presencial/);
  assert.match(text, /no es un servicio de emergencia ni supervisa mensajes en tiempo real/);
});

test("protege mediación, fuentes, canonical, sitemap y firewall comercial", () => {
  assert.match(text, /mediación familiar es voluntaria/);
  assert.match(text, /si existe coacción, miedo o una desigualdad/);
  assert.match(html, /https:\/\/violenciagenero\.igualdad\.gob\.es\/informacion-3\/recursos\/telefono016\//);
  assert.match(html, /https:\/\/www\.anar\.org\/que-hacemos\/telefono-chat-anar\//);
  assert.match(html, /https:\/\/www\.sanidad\.gob\.es\/linea024\/home\.htm/);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/familia\/vivo-con-mi-familia-y-no-aguanto-mas\//);
  assert.match(text, /actualizado el 2 de septiembre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/familia\/vivo-con-mi-familia-y-no-aguanto-mas\/<\/loc><lastmod>2026-09-02<\/lastmod>/);
  assert.doesNotMatch(html, /data-ad|affiliate|afiliad|patrocinad|sponsor|utm_|[?&]ref=|comprar ahora|contrata ahora|precio|suscríbete/i);
});
