import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const categories = [
  ['crisis', 'Suicidio y crisis'], ['violencia', 'Violencia y agresión sexual'],
  ['duelo', 'Duelo y pérdidas'], ['soledad', 'Soledad'], ['ansiedad', 'Ansiedad'],
  ['gestion-emocional', 'Gestión emocional'], ['salud', 'Salud y enfermedad'],
  ['rupturas', 'Rupturas y relaciones'], ['familia', 'Familia'],
  ['trabajo', 'Trabajo'], ['dinero', 'Dinero y deudas']
];
const root = new URL('../', import.meta.url);
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function renderDirectory() {
  const records = JSON.parse(await readFile(new URL('recursos/catalog.json', root), 'utf8'));
  const cards = records.map(r => `<li data-category="${escape(r.category)}"><a class="cardlink" href="${escape(r.url)}"><strong>${escape(r.title)}</strong><span>${escape(r.description)}</span></a></li>`).join('\n');
  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Recursos de ayuda por situación | Desgracias.es</title>
<meta name="description" content="Explora guías de ayuda sobre crisis, violencia, duelo, soledad, ansiedad, salud, relaciones, familia, trabajo y dinero. Filtra por tema sin escribir datos personales.">
<meta name="robots" content="index,follow,max-snippet:-1"><meta name="referrer" content="no-referrer">
<link rel="canonical" href="https://desgracias.es/recursos/"><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/guia.css">
<meta property="og:site_name" content="Desgracias.es"><meta property="og:title" content="Recursos de ayuda por situación"><meta property="og:type" content="website"><meta property="og:url" content="https://desgracias.es/recursos/"><meta name="twitter:card" content="summary">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Recursos de ayuda por situación","url":"https://desgracias.es/recursos/"}</script>
<style>.directory{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px}.directory li[hidden]{display:none}.directory .cardlink{height:100%;box-sizing:border-box}.filters{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:24px 0}.filters select,.filters button{font:inherit;padding:12px;border:1px solid #79583f;border-radius:6px;background:white;color:#342b25}a:focus-visible,select:focus-visible,button:focus-visible{outline:3px solid #79583f;outline-offset:4px}.skip{display:block;padding:8px 16px}.help-links{display:flex;gap:20px;flex-wrap:wrap}</style>
</head><body><a class="skip" href="#contenido">Saltar al contenido</a>
<header class="sitebar"><div class="wrap sitebar-inner"><a class="brand" href="/">Desgracias.es</a><a href="/buscar/">Buscar ayuda</a></div></header>
<main id="contenido" class="wrap"><section class="hero"><p class="eyebrow">Recursos por situación</p><h1>Encuentra un siguiente paso.</h1><p class="lead">Explora las guías por tema. No necesitas contar tu situación ni introducir datos personales para usar este directorio.</p>
<aside class="quick" aria-label="Ayuda urgente"><strong>Si hay peligro inmediato, llama al <a href="tel:112">112</a> en España.</strong> Para atención a la conducta suicida está el <a href="tel:024">024</a>. <a href="/ayuda-urgente.html">Ver toda la ayuda urgente</a>. Este acceso permanece visible al filtrar.</aside></section>
<section aria-label="Directorio de guías"><div class="filters" id="resource-filters" hidden><label for="resource-category">Filtrar por tema</label><select id="resource-category"><option value="all">Todos los temas</option>${categories.map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select><button type="button" id="resource-reset">Mostrar todo</button></div>
<p id="resource-count" role="status" aria-live="polite">${records.length} guías disponibles</p><ul class="directory" id="resource-directory">${cards}</ul>
<noscript><p>Todos los recursos están disponibles arriba. Para orientarte también puedes usar <a href="/buscar/">Buscar ayuda</a>.</p></noscript></section>
<section><h2>Si no sabes por dónde empezar</h2><p><a href="/buscar/">Buscar ayuda</a> puede orientarte. Estas guías son informativas y no sustituyen la atención profesional.</p><p><a href="/como-revisamos.html">Cómo revisamos el contenido</a></p></section></main>
<footer class="wrap"><p class="help-links"><a href="/">Inicio</a><a href="/webs-amigas.html">Webs amigas</a><a href="/privacidad.html">Privacidad</a><a href="/contacto.html">Contacto</a></p></footer>
<script src="/resource-directory.js" defer></script></body></html>\n`;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await mkdir(new URL('recursos/', root), { recursive: true });
  await writeFile(new URL('recursos/index.html', root), await renderDirectory());
}
