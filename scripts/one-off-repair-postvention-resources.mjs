import fs from 'node:fs';

const pagePath = 'duelo/ha-muerto-por-suicidio-alguien-que-quiero/index.html';
const sitemapPath = 'sitemap.xml';

let html = fs.readFileSync(pagePath, 'utf8');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');

const OLD_SAMARITANS = 'https://www.samaritans.org/how-we-can-help/if-youre-worried-about-someone-else/supporting-someone-after-a-suicide/';
const CURRENT_SAMARITANS = 'https://www.samaritans.org/how-we-can-help/schools/universities/information-friends-and-family/when-you-are-supporting-others/';
const OLD_EUSKADI = 'https://www.euskadi.eus/gobierno-vasco/-/salud-mental-suicidio/';
const CURRENT_NHS_TIMING = 'https://www.newcastle-hospitals.nhs.uk/resources/information-for-the-bereaved-what-to-do-after-a-death-in-the-hospital/';

function replaceRequired(text, before, after, label) {
  if (!text.includes(before)) {
    throw new Error(`Required replacement missing: ${label}`);
  }
  return text.replaceAll(before, after);
}

html = replaceRequired(html, OLD_SAMARITANS, CURRENT_SAMARITANS, 'obsolete Samaritans postvention URL');

const euskadiAnchorPattern = /<a href='https:\/\/www\.euskadi\.eus\/gobierno-vasco\/-\/salud-mental-suicidio\/' rel='noopener noreferrer'>[^<]*<\/a>/g;
const euskadiAnchors = html.match(euskadiAnchorPattern) ?? [];
if (euskadiAnchors.length === 0) {
  throw new Error('Expected at least one Euskadi postvention anchor');
}
html = html.replace(
  euskadiAnchorPattern,
  `<a href='${CURRENT_NHS_TIMING}' rel='noopener noreferrer'>NHS · Newcastle Hospitals · duelo sin plazos fijos</a>`
);

html = replaceRequired(
  html,
  'El Gobierno Vasco recuerda que el duelo es una respuesta normal y que cada persona lo vive de forma diferente; la muerte por suicidio puede añadir elementos que lo hagan especialmente complejo.',
  'Newcastle Hospitals, dentro del NHS, recuerda que no existe una forma correcta o incorrecta de atravesar el duelo ni un plazo fijo; cada persona puede necesitar tiempos y apoyos diferentes.',
  'Euskadi timing claim'
);

html = replaceRequired(html, '"dateModified":"2026-08-28"', '"dateModified":"2026-09-01"', 'structured editorial date');
html = replaceRequired(
  html,
  'Actualizado y auditado el 28 de agosto de 2026',
  'Actualizado y auditado el 1 de septiembre de 2026',
  'visible editorial date'
);
html = replaceRequired(
  html,
  'Datos y servicios comprobados el 28 de agosto de 2026.',
  'Datos y servicios comprobados el 1 de septiembre de 2026.',
  'resource verification date'
);

const oldSitemapEntry = '<loc>https://desgracias.es/duelo/ha-muerto-por-suicidio-alguien-que-quiero/</loc><lastmod>2026-08-28</lastmod>';
const newSitemapEntry = '<loc>https://desgracias.es/duelo/ha-muerto-por-suicidio-alguien-que-quiero/</loc><lastmod>2026-09-01</lastmod>';
sitemap = replaceRequired(sitemap, oldSitemapEntry, newSitemapEntry, 'postvention sitemap lastmod');

if (html.includes(OLD_SAMARITANS)) throw new Error('Old Samaritans URL still present');
if (html.includes(OLD_EUSKADI)) throw new Error('TLS-untrusted Euskadi URL still present');
if (!html.includes(CURRENT_SAMARITANS)) throw new Error('Current Samaritans URL missing');
if (!html.includes(CURRENT_NHS_TIMING)) throw new Error('Current NHS timing URL missing');
if (!html.includes('https://www.comunidad.madrid/publicacion/ref/20325')) throw new Error('Live Community of Madrid guide was unexpectedly removed');
if (!html.includes('https://www.comunidad.madrid/salud/ayuda-frente-suicidio-no-solo')) throw new Error('Live Community of Madrid suicide support page was unexpectedly removed');

fs.writeFileSync(pagePath, html);
fs.writeFileSync(sitemapPath, sitemap);
console.log(`Postvention resource repair applied: ${euskadiAnchors.length} Euskadi anchor(s) replaced.`);
