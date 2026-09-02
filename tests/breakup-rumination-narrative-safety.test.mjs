import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = new URL("../rupturas/no-puedo-dejar-de-pensar-en-mi-ex/index.html", import.meta.url);
const sitemapPath = new URL("../sitemap.xml", import.meta.url);
const html = await readFile(pagePath, "utf8");
const sitemap = await readFile(sitemapPath, "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

test("normaliza el duelo por ruptura sin diagnosticar ni fijar calendario", () => {
  assert.match(text, /no estás fallando por seguir recordando/);
  assert.match(text, /aquí describe una experiencia, no un diagnóstico ni un trastorno/);
  assert.match(text, /no hay un plazo universal/);
  assert.doesNotMatch(text, /tienes (depresión|toc|dependencia emocional)|en \d+ días/);
});

test("separa recuerdos, atención y destino de la relación", () => {
  assert.match(text, /tu atención no es una prueba sobre la relación/);
  assert.match(text, /no demuestra por sí solo que sea tu única pareja posible ni que debas actuar/);
  assert.match(text, /lo que sé/);
  assert.match(text, /lo que estoy intentando adivinar/);
});

test("rompe el bucle con acciones pequeñas y sin prometer olvido", () => {
  assert.match(text, /nómbralo sin discutir con él/);
  assert.match(text, /retrásalo diez minutos/);
  assert.match(text, /reserva un momento para lo que sí necesites pensar/);
  assert.doesNotMatch(text, /olvidarás a tu ex|dejarás de pensar|recuperarás la relación/);
});

test("impide vigilancia, bypass y presión mediante terceros", () => {
  assert.match(text, /no pidas a amistades que te informen ni que te envíen capturas/);
  assert.match(text, /no crees cuentas o números alternativos/);
  assert.match(text, /no intentes sortear un bloqueo/);
  assert.match(text, /no aparezcas sin invitación/);
  assert.match(text, /no sigas ubicaciones, sesiones o dispositivos compartidos/);
});

test("protege logística compartida, sueño y funcionamiento", () => {
  assert.match(text, /usa un canal neutral y seguro/);
  assert.match(text, /no conviertas a hijos, familiares o amistades en mensajeros/);
  assert.match(text, /cuida el cuerpo que sostiene tu atención/);
  assert.match(text, /no puedes sostener trabajo, estudios, cuidados o higiene/);
  assert.match(text, /pide apoyo sanitario o psicológico/);
});

test("reduce autocastigo sin borrar responsabilidad", () => {
  assert.match(text, /cuando aparece el autocastigo/);
  assert.match(text, /separar responsabilidad de identidad/);
  assert.match(text, /qué parte dependía de ti/);
  assert.doesNotMatch(text, /nada fue culpa tuya|todo fue culpa de tu ex/);
});

test("mantiene 112, 016 y 024 con alcance exacto y sin captación", () => {
  assert.match(html, /href="tel:112"/);
  assert.match(html, /href="tel:016"/);
  assert.match(html, /href="tel:024"/);
  assert.match(text, /si eres mujer y la situación está relacionada con violencia contra las mujeres/);
  assert.match(text, /pensamientos o riesgo de conducta suicida/);
  assert.match(text, /desgracias\.es no es un servicio de emergencias ni supervisa historias de forma continua/);
  assert.doesNotMatch(html, /href="\/#inicio"|contar mi historia/i);
});

test("protege evidencia, canonical, sitemap y firewall comercial", () => {
  assert.match(html, /https:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC11985774\//);
  assert.match(html, /https:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC10727987\//);
  assert.match(html, /https:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC3472530\//);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/rupturas\/no-puedo-dejar-de-pensar-en-mi-ex\//);
  assert.match(text, /actualizado el 2 de septiembre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/rupturas\/no-puedo-dejar-de-pensar-en-mi-ex\/<\/loc><lastmod>2026-09-02<\/lastmod>/);
  assert.doesNotMatch(html, /data-ad|affiliate|afiliad|patrocinad|sponsor|utm_|[?&]ref=|comprar ahora|contrata ahora|precio|suscríbete/i);
});
