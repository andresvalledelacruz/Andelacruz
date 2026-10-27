import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = new URL("../soledad/no-tengo-con-quien-hablar/index.html", import.meta.url);
const sitemapPath = new URL("../sitemap.xml", import.meta.url);
const html = await readFile(pagePath, "utf8");
const sitemap = await readFile(sitemapPath, "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

test("convierte la necesidad de hablar en una petición limitada y observable", () => {
  assert.match(text, /prepara una conversación con cuatro límites claros/);
  assert.match(text, /propósito:.*tiempo:.*límite:.*cierre:/);
  assert.match(text, /diez minutos hoy o una llamada mañana/);
  assert.match(text, /no necesitas resolver toda la situación en una sola llamada/);
  assert.doesNotMatch(text, /garantiza que te escuche|resolverá tu problema|siempre será así/);
});

test("protege autonomía, confidencialidad y relaciones sin vigilancia", () => {
  assert.match(text, /no autoriza a nadie a presionarte, interrogarte, vigilarte o difundir/);
  assert.match(text, /una respuesta amable en internet no demuestra por sí sola identidad, confidencialidad ni capacidad profesional/);
  assert.match(text, /documentos, dirección, ubicación en tiempo real, contraseñas, códigos bancarios, dinero ni imágenes íntimas/);
  assert.match(text, /no publiques conversaciones o datos de terceras personas/);
  assert.match(text, /bloqueo o denuncia de la plataforma/);
});

test("mantiene alternativas, ayuda privada y carril de crisis", () => {
  assert.match(text, /si el primer contacto falla, prueba un segundo vínculo/);
  assert.match(html, /href="\/buscar\/">Buscar orientación/);
  assert.match(html, /href="tel:112"/);
  assert.match(html, /href="tel:024"/);
  assert.match(text, /peligro inmediato/);
  assert.match(text, /no es un chat, línea de crisis ni servicio de emergencias/);
  assert.doesNotMatch(html, /href="\/#inicio">Contar mi historia/);
  assert.doesNotMatch(html, /data-ad|affiliate|afiliad|patrocinad|sponsor|utm_|[?&]ref=|comprar|contrata|oferta|precio|consulta privada/i);
});

test("mantiene fuentes verificadas y metadatos editoriales coherentes", () => {
  assert.match(html, /Marco_Estrategico_Soledades\.pdf/);
  assert.match(html, /https:\/\/www\.who\.int\/news-room\/questions-and-answers\/item\/social-connection/);
  assert.match(html, /https:\/\/www\.sanidad\.gob\.es\/linea024\//);
  assert.match(html, /https:\/\/telefonodelaesperanza\.org\/contacto/);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/soledad\/no-tengo-con-quien-hablar\//);
  assert.match(text, /actualizado el 27 de octubre de 2026/);
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-27"/);
  assert.match(html, /href="\/assets\/home-fonts\.css"/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(html, /src="\/public-page-runtime\.js" defer/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/soledad\/no-tengo-con-quien-hablar\/<\/loc><lastmod>2026-10-27<\/lastmod>/);
});
