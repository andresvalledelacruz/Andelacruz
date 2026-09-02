import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = new URL("../rupturas/tenemos-hijos-en-comun/index.html", import.meta.url);
const sitemapPath = new URL("../sitemap.xml", import.meta.url);
const html = await readFile(pagePath, "utf8");
const sitemap = await readFile(sitemapPath, "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

test("prioriza seguridad y un plan inmediato sin decidir el caso", () => {
  assert.match(text, /un plan manejable para los próximos 30 minutos/);
  assert.match(text, /la seguridad va antes que cualquier conversación, entrega o acuerdo provisional/);
  assert.match(text, /una organización de emergencia no sustituye orientación jurídica/);
  assert.doesNotMatch(text, /debes pedir la custodia|te corresponde la custodia|denuncia siempre|garantiza el bienestar/);
});

test("protege a los hijos de triangulación, vigilancia e interrogatorio", () => {
  assert.match(text, /mensajeros, jueces o confidentes/);
  assert.match(text, /capturas, ubicaciones, contraseñas/);
  assert.match(text, /escucha sin interrogar, completar su relato ni sugerir respuestas/);
  assert.match(text, /no uses a familiares, amistades ni a los propios menores como intermediarios/);
});

test("limita las afirmaciones científicas y no diagnostica reacciones", () => {
  assert.match(text, /asociaciones poblacionales, no destinos individuales/);
  assert.match(text, /no permiten diagnosticar por sí solos/);
  assert.match(text, /no permite anticipar cómo reaccionará un hijo concreto/);
  assert.doesNotMatch(text, /la separación (siempre|inevitablemente) (daña|traumatiza)/);
});

test("somete mediación, contacto y entregas a seguridad", () => {
  assert.match(text, /la mediación es voluntaria/);
  assert.match(text, /no debe tratarse como la opción automática/);
  assert.match(text, /miedo, violencia, amenaza, acoso, vigilancia o control coercitivo/);
  assert.match(text, /no organices un encuentro directo ni una entrega improvisada/);
});

test("mantiene resoluciones y decisiones legales fuera de la guía", () => {
  assert.match(text, /las medidas judiciales y las instrucciones de protección vigentes prevalecen sobre esta guía/);
  assert.match(text, /no autoriza a incumplir una resolución, ocultar a un menor/);
  assert.match(text, /cambiar unilateralmente su residencia o colegio ni suspender contactos/);
  assert.match(text, /una guía general no puede decirte qué custodia/);
});

test("protege privacidad infantil y seguridad digital", () => {
  assert.match(text, /calendarios, cuentas familiares, localización, fotografías, nube/);
  assert.match(text, /no publiques el conflicto, documentos judiciales, centro escolar, domicilio/);
  assert.match(text, /dispositivo seguro/);
  assert.match(text, /sin nombres, centro escolar, dirección, rutinas localizables/);
});

test("mantiene 112, 016, ANAR y 024 con alcance preciso y sin captación", () => {
  assert.match(html, /href="tel:112"/);
  assert.match(html, /href="tel:016"/);
  assert.match(html, /href="tel:900202010"/);
  assert.match(html, /href="tel:600505152"/);
  assert.match(html, /href="tel:024"/);
  assert.match(text, /no presentamos el 016 como un recurso universal para hombres adultos/);
  assert.match(text, /desgracias\.es no es un servicio de emergencias ni supervisa mensajes en tiempo real/);
  assert.doesNotMatch(html, /class="cta"|href="\/#inicio"|contar mi situación/i);
});

test("protege fuentes, entity, sitemap y firewall comercial", () => {
  assert.match(html, /"@type":"Article"/);
  assert.match(html, /"dateModified":"2026-09-02"/);
  assert.match(html, /https:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC6313686\//);
  assert.match(html, /https:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC8805665\//);
  assert.match(html, /https:\/\/www\.anar\.org\/telefono-anar-familia-y-centros-escolares\//);
  assert.match(html, /https:\/\/violenciagenero\.igualdad\.gob\.es\/informacion-3\/recursos\/telefono016\//);
  assert.match(html, /https:\/\/www\.sanidad\.gob\.es\/linea024\/home\.htm/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/rupturas\/tenemos-hijos-en-comun\/<\/loc><lastmod>2026-09-02<\/lastmod>/);
  assert.doesNotMatch(html, /data-ad|affiliate|afiliad|patrocinad|sponsor|utm_|[?&]ref=|comprar ahora|contrata ahora|precio|suscríbete/i);
});
