import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = new URL("../rupturas/mi-ex-me-ha-bloqueado/index.html", import.meta.url);
const sitemapPath = new URL("../sitemap.xml", import.meta.url);
const html = await readFile(pagePath, "utf8");
const sitemap = await readFile(sitemapPath, "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

test("separa hechos e interpretaciones sin diagnosticar ni leer intenciones", () => {
  assert.match(text, /separa lo que sabes de lo que estás intentando adivinar/);
  assert.match(text, /son posibilidades imaginadas, no hechos comprobados/);
  assert.match(text, /el mismo gesto puede tener significados distintos/);
  assert.doesNotMatch(text, /tu ex (es|tiene) (narcisista|psicópata)|te bloquea porque aún te quiere/);
});

test("impide sortear el bloqueo y presionar mediante terceras personas", () => {
  assert.match(text, /el bloqueo no es una invitación a buscar otra puerta/);
  assert.match(text, /crear cuentas nuevas o usar otro número/);
  assert.match(text, /amistades, familiares o compañeros que lleven mensajes emocionales/);
  assert.match(text, /domicilio, trabajo o lugares habituales sin invitación/);
  assert.match(text, /una disculpa no exige ser recibida/);
});

test("ofrece un plan inmediato y reduce comprobaciones sin promesas", () => {
  assert.match(text, /un plan para los próximos 30 minutos/);
  assert.match(text, /anota dos columnas/);
  assert.match(text, /cierra una vía de comprobación/);
  assert.match(text, /el objetivo no es dejar de sentir en media hora/);
  assert.doesNotMatch(text, /lo superarás en|dejarás de pensar en|recuperarás a tu ex/);
});

test("separa logística compartida de conversación sentimental", () => {
  assert.match(text, /hijos, vivienda, dinero o pertenencias pendientes/);
  assert.match(text, /canal neutral, autorizado y seguro/);
  assert.match(text, /no uses a hijos, familiares o amistades como mensajeros/);
  assert.match(text, /esta guía no determina derechos, custodia, propiedad ni obligaciones legales/);
});

test("protege privacidad y conserva evidencia sin provocar contacto", () => {
  assert.match(text, /cambia contraseñas reutilizadas, cierra sesiones abiertas/);
  assert.match(text, /ubicación compartida/);
  assert.match(text, /no difundas imágenes íntimas ni conversaciones privadas/);
  assert.match(text, /conserva mensajes, fechas y capturas de forma segura sin provocar un nuevo contacto/);
});

test("mantiene 112, 016 y 024 con alcance correcto y sin captación", () => {
  assert.match(html, /href="tel:112"/);
  assert.match(html, /href="tel:016"/);
  assert.match(html, /href="tel:024"/);
  assert.match(text, /si eres una mujer y la situación está relacionada con violencia contra las mujeres/);
  assert.match(text, /pensamientos suicidas, riesgo de autolesión/);
  assert.match(text, /desgracias\.es no presta atención de emergencia ni seguimiento en tiempo real/);
  assert.doesNotMatch(html, /href="\/#inicio"|contar mi historia/i);
});

test("protege fuentes, canonical, sitemap y firewall comercial", () => {
  assert.match(html, /https:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC3472530\//);
  assert.match(html, /https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/10972515\//);
  assert.match(html, /https:\/\/violenciagenero\.igualdad\.gob\.es\/informacion-3\/recursos\/telefono016\//);
  assert.match(html, /https:\/\/www\.sanidad\.gob\.es\/linea024\/home\.htm/);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/rupturas\/mi-ex-me-ha-bloqueado\//);
  assert.match(text, /actualizado el 2 de septiembre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/rupturas\/mi-ex-me-ha-bloqueado\/<\/loc><lastmod>2026-09-02<\/lastmod>/);
  assert.doesNotMatch(html, /data-ad|affiliate|afiliad|patrocinad|sponsor|utm_|[?&]ref=|comprar ahora|contrata ahora|precio|suscríbete/i);
});
