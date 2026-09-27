import { readFileSync, writeFileSync } from 'node:fs';
import { verifiedCountries } from './lib/verified-country-options.mjs';

const root = new URL('../', import.meta.url);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const cards = verifiedCountries.map(({ code, name, spriteIndex }) =>
  `        <a class="country-button" data-country="${code}" href="/recursos/#pais-${code}"><span class="flag-image" aria-hidden="true" style="background-position:0 -${spriteIndex * 18}px"></span><span>${escape(name)}</span></a>`
).join('\n');
const path = new URL('buscar/index.html', root);
let html = readFileSync(path, 'utf8');
const region = /(<nav class="country-buttons" aria-label="Recursos por país o ámbito">)[\s\S]*?(<\/nav>)/;
if (!region.test(html)) throw new Error('Search country selector not found');
html = html.replace(region, `$1\n${cards}\n      $2`)
  .replace(/<p>Elige una bandera para abrir la sección de recursos\.[^<]*<\/p>/,
    '<p>Elige un destino para abrir sus recursos revisados. España aparece primero y el resto está en orden alfabético. Solo mostramos destinos con ayuda disponible.</p>');
writeFileSync(path, html);
