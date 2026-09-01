import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../duelo/ha-muerto-por-suicidio-alguien-que-quiero/index.html', import.meta.url), 'utf8');
const sitemap = fs.readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');

const OLD_SAMARITANS = 'https://www.samaritans.org/how-we-can-help/if-youre-worried-about-someone-else/supporting-someone-after-a-suicide/';
const CURRENT_SAMARITANS = 'https://www.samaritans.org/how-we-can-help/schools/universities/information-friends-and-family/when-you-are-supporting-others/';
const OLD_EUSKADI = 'https://www.euskadi.eus/gobierno-vasco/-/salud-mental-suicidio/';
const CURRENT_NHS_TIMING = 'https://www.newcastle-hospitals.nhs.uk/resources/information-for-the-bereaved-what-to-do-after-a-death-in-the-hospital/';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('postvention page no longer exposes dead or TLS-untrusted resource URLs', () => {
  assert.doesNotMatch(html, new RegExp(escapeRegex(OLD_SAMARITANS)));
  assert.doesNotMatch(html, new RegExp(escapeRegex(OLD_EUSKADI)));
  assert.match(html, new RegExp(escapeRegex(CURRENT_SAMARITANS)));
  assert.match(html, new RegExp(escapeRegex(CURRENT_NHS_TIMING)));
});

test('live Community of Madrid postvention resources remain available in the guide', () => {
  assert.match(html, /https:\/\/www\.comunidad\.madrid\/salud\/ayuda-frente-suicidio-no-solo/);
  assert.match(html, /https:\/\/www\.comunidad\.madrid\/publicacion\/ref\/20325/);
});

test('resource repair has an explicit editorial date synchronized with sitemap', () => {
  assert.match(html, /"dateModified":"2026-09-01"/);
  assert.match(html, /Actualizado y auditado el 1 de septiembre de 2026/i);
  assert.match(html, /Datos y servicios comprobados el 1 de septiembre de 2026/i);
  assert.match(
    sitemap,
    /<loc>https:\/\/desgracias\.es\/duelo\/ha-muerto-por-suicidio-alguien-que-quiero\/<\/loc><lastmod>2026-09-01<\/lastmod>/
  );
});
