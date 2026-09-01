import fs from 'node:fs';

const pagePath = 'duelo/ha-muerto-por-suicidio-alguien-que-quiero/index.html';
let html = fs.readFileSync(pagePath, 'utf8');

const CURRENT_NHS_TIMING = 'https://www.newcastle-hospitals.nhs.uk/resources/information-for-the-bereaved-what-to-do-after-a-death-in-the-hospital/';
const misplaced = `<li><a href='${CURRENT_NHS_TIMING}' rel='noopener noreferrer'>NHS · Newcastle Hospitals · duelo sin plazos fijos</a>.</li>`;
const nhsCore = `<li><a href='https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/grief-bereavement-loss/' rel='noopener noreferrer'>NHS: duelo, reacciones y autocuidado</a>.</li>`;

const firstMisplaced = html.indexOf(misplaced);
const internationalHeading = html.indexOf('<h3>Contraste internacional experto</h3>');
if (firstMisplaced === -1 || internationalHeading === -1 || firstMisplaced > internationalHeading) {
  throw new Error('Expected Newcastle NHS source inside the Spanish source nucleus');
}

html = html.slice(0, firstMisplaced) + html.slice(firstMisplaced + misplaced.length);

if (!html.includes(nhsCore)) throw new Error('International NHS core source marker missing');
html = html.replace(nhsCore, `${nhsCore}${misplaced}`);

html = html.replace(
  'Algunas comunidades autónomas mantienen además directorios propios. Cataluña incluye en su Plan de Prevención del Suicidio asociaciones de supervivientes; el Gobierno Vasco dispone de un espacio específico para supervivientes y otras comunidades desarrollan programas y grupos propios.',
  'Algunas comunidades autónomas mantienen además directorios propios. Cataluña incluye en su Plan de Prevención del Suicidio asociaciones de supervivientes y otras comunidades autónomas desarrollan programas y grupos propios.'
);

const spanishSources = html.split('<h3>Núcleo español</h3>')[1]?.split('<h3>Contraste internacional experto</h3>')[0] ?? '';
const internationalSources = html.split('<h3>Contraste internacional experto</h3>')[1]?.split('<h3>Cómo usamos estas fuentes</h3>')[0] ?? '';
if (spanishSources.includes(CURRENT_NHS_TIMING)) throw new Error('Newcastle NHS source remains inside Spanish nucleus');
if (!internationalSources.includes(CURRENT_NHS_TIMING)) throw new Error('Newcastle NHS source missing from international audit');

fs.writeFileSync(pagePath, html);
console.log('Postvention source sections normalized.');
