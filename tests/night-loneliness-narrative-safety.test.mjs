import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = new URL("../soledad/me-siento-solo-por-la-noche/index.html", import.meta.url);
const sitemapPath = new URL("../sitemap.xml", import.meta.url);
const html = await readFile(pagePath, "utf8");
const sitemap = await readFile(sitemapPath, "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

test("distingue soledad, aislamiento, sueño e intensificación nocturna sin diagnosticar", () => {
  assert.match(text, /soledad no es lo mismo que estar físicamente a solas/);
  assert.match(text, /soledad.*aislamiento.*dificultad para dormir/);
  assert.match(text, /puede parecer definitiva|pueden sonar más convincentes/);
  assert.match(text, /una mala noche no permite diagnosticar insomnio/);
  assert.doesNotMatch(text, /tienes insomnio|trastorno de soledad|tu cerebro siempre/);
});

test("ofrece un plan de 30 minutos y protege decisiones reversibles", () => {
  assert.match(text, /próximos 30 minutos/);
  assert.match(text, /aplaza las decisiones irreversibles/);
  assert.match(text, /deja una decisión para mañana/);
  assert.match(text, /paso pequeño, reversible y seguro/);
  assert.doesNotMatch(text, /te funcionará|te calmará|vas a dormir/);
});

test("separa el alivio nocturno del trabajo diurno y deja un traspaso concreto", () => {
  assert.match(text, /dos carriles: esta noche y mañana/);
  assert.match(text, /esta noche.*acción pequeña y reversible.*mañana.*estructural/);
  assert.match(text, /nota de traspaso/);
  assert.match(text, /hora aproximada, qué necesitabas, qué ayudó y cuál es la primera acción diurna/);
  assert.doesNotMatch(text, /registra cada minuto|controla cada minuto/);
});

test("protege conexión, privacidad y fraude", () => {
  assert.match(text, /la otra persona puede no estar despierta o no poder responder/);
  assert.match(text, /qué harás si no contesta/);
  assert.match(text, /eso habla de su disponibilidad, no de tu valor/);
  assert.match(text, /no envíes el mismo mensaje íntimo a muchas personas o a un grupo/);
  assert.match(text, /dinero, contraseñas, códigos bancarios, documentos, dirección, ubicación en tiempo real ni imágenes íntimas/);
  assert.match(text, /persona desconocida/);
  assert.match(text, /no incluyas nombres, dirección, teléfonos, documentos ni otros datos personales/);
  assert.match(html, /href="\/buscar\/">Buscar ayuda de forma privada/);
  assert.doesNotMatch(html, /href="\/#inicio">Contar mi historia/);
});

test("delimita autocuidado del sueño y derivación profesional", () => {
  assert.match(text, /horarios regulares/);
  assert.match(text, /dormitorio oscuro, tranquilo y fresco/);
  assert.match(text, /evita cafeína, alcohol y comidas copiosas/);
  assert.match(text, /consulta atención primaria/);
  assert.doesNotMatch(text, /melatonina|benzodiazep|somnífero|dosis de|suplemento/);
});

test("mantiene carril 112 y 024 sin teléfonos externos ni monetización", () => {
  assert.match(html, /href="tel:112"/);
  assert.match(html, /href="tel:024"/);
  assert.match(text, /peligro inmediato/);
  assert.match(text, /pensamientos de suicidio, riesgo de hacerte daño/);
  assert.match(text, /no sustituye la atención sanitaria presencial/);
  assert.match(text, /no es un servicio de emergencias/);
  assert.doesNotMatch(html, /717003717|Teléfono de la Esperanza/i);
  assert.doesNotMatch(html, /data-ad|affiliate|afiliad|patrocinad|sponsor|utm_|[?&]ref=|comprar|contrata|oferta|precio|consulta privada/i);
});

test("protege fuentes, canonical y lastmod editorial", () => {
  assert.match(html, /https:\/\/www\.who\.int\/publications\/i\/item\/978240112360/);
  assert.match(html, /https:\/\/www\.nhs\.uk\/conditions\/insomnia\//);
  assert.match(html, /https:\/\/www\.cdc\.gov\/sleep\/about\/index\.html/);
  assert.match(html, /https:\/\/www\.sanidad\.gob\.es\/linea024\/home\.htm/);
  assert.match(html, /https:\/\/www\.sanidad\.gob\.es\/areas\/calidadAsistencial\/excelenciaClinica\/docs\/EyR_UAS\.pdf/);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/soledad\/me-siento-solo-por-la-noche\//);
  assert.match(text, /actualizado el 27 de octubre de 2026/);
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-27"/);
  assert.match(html, /href="\/assets\/home-fonts\.css"/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(html, /src="\/public-page-runtime\.js" defer/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/soledad\/me-siento-solo-por-la-noche\/<\/loc><lastmod>2026-10-27<\/lastmod>/);
});
