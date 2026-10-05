import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read = p => fs.readFileSync(p, 'utf8');
const contact = read('contacto.html');
const hub = read('profesionales.html');
test('Contacto no duplica captación y conserva atención general y urgente', () => {
  assert.doesNotMatch(contact, /id="(?:participar|recursos|profesionales|colaboraciones)"|Sugerir un recurso|Propuestas de colaboración|Solicitud%20profesional/);
  for (const id of ['general','incidencias','privacidad']) assert.ok(contact.includes(`id="${id}"`));
  assert.ok(contact.includes('href="/ayuda-urgente.html"'));
  assert.ok(contact.includes('href="/profesionales.html"'));
});
test('Las seis rutas resuelven a secciones y se preservan los destinos de correo', () => {
  const nav = hub.match(/<nav class="grid"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual([...nav.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]), ['solicitud','colaboraciones','alianzas','recursos','condiciones','buscar-profesional']);
  for (const id of ['solicitud','colaboraciones','alianzas','recursos','condiciones','buscar-profesional']) assert.equal(hub.split(`id="${id}"`).length-1,1);
  for (const subject of ['Solicitud%20profesional%20Desgracias.es','Sugerir%20un%20recurso','Propuesta%20de%20colaboraci%C3%B3n%20profesional']) assert.ok(hub.includes(subject));
  assert.ok(hub.includes('id="professional-application"'));
  assert.ok(hub.includes('href="/alianzas.html"'));
  assert.match(hub,/crisis, suicidio, violencia, Buscar Ayuda y recursos sensibles quedan fuera/);
});
test('Los enlaces antiguos solo redirigen fragmentos conocidos, sin propagar datos', () => {
  for (const [hash,expected] of Object.entries({'#participar':'#participar','#profesionales':'#solicitud','#recursos':'#recursos','#colaboraciones':'#colaboraciones','#privacidad':null,'#general':null,'#https://example.org':null})) {
    const calls=[];
    vm.runInNewContext(read('contact-legacy-links.js'),{window:{location:{hash,replace:p=>calls.push(p)},addEventListener(){}}});
    assert.deepEqual(calls, expected ? ['/profesionales.html'+expected] : []);
  }
});
test('La solicitud valida antes de preparar un correo y no envía datos a la red', () => {
  const source=hub.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  let submit;
  const location={};
  const document={getElementById(id){return id==='professional-application'?{addEventListener(type,fn){assert.equal(type,'submit');submit=fn;}}:id==='pro-commercial'?{checked:false}:{value:' Ejemplo & prueba '};}};
  vm.runInNewContext(source,{document,location});
  const event={preventDefault(){}};
  submit.call({reportValidity:()=>false},event);
  assert.equal(location.href,undefined);
  submit.call({reportValidity:()=>true},event);
  const url=new URL(location.href);
  assert.equal(url.protocol,'mailto:');
  assert.equal(url.pathname,'info@desgracias.es');
  assert.equal(url.searchParams.get('subject'),'Solicitud profesional Desgracias.es');
  assert.equal(url.searchParams.get('body').split('\n').length,14);
  assert.ok(url.searchParams.get('body').includes('Nombre: Ejemplo & prueba'));
  assert.ok(url.searchParams.get('body').includes('Interés comercial futuro: No'));
});
test('SEO y breadcrumbs reflejan la jerarquía y las visitas mantienen el runtime privado', () => {
  for (const file of ['contacto.html','profesionales.html','alianzas.html']) {
    const html=read(file);
    const schemas=[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
    const crumbs=schemas.find(s=>s['@type']==='BreadcrumbList').itemListElement;
    assert.equal(crumbs.at(-1).item,'https://desgracias.es/'+file);
    if(file==='alianzas.html') assert.equal(crumbs[1].item,'https://desgracias.es/profesionales.html');
    assert.ok(html.includes(`rel="canonical" href="https://desgracias.es/${file}"`));
    assert.ok(html.includes('src="/public-page-runtime.js"'));
    assert.equal((html.match(/<h1>/g)||[]).length,1);
    for (const m of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${m[1]}"`));
  }
  assert.doesNotMatch(read('visitor-analytics.js'),/FormData|\.value|location\.hash|location\.search/);
});

test('El acceso público no promete un directorio y la portada apunta directamente al hub', () => {
  const home = read('index.html');
  const panel = home.match(/<nav class="professionals-home-grid"[\s\S]*?<\/nav>/)[0];
  assert.equal((panel.match(/<a href=/g) || []).length, 6);
  for (const id of ['solicitud','colaboraciones','alianzas','recursos','condiciones','buscar-profesional']) {
    assert.ok(panel.includes(`href="/profesionales.html#${id}"`));
  }
  assert.doesNotMatch(panel, /<details|hidden|display:none/);
  assert.match(panel, /Directorio todavía no disponible/);
  assert.doesNotMatch(home, /href="\/contacto.html#profesionales"/);
  assert.match(hub, /El directorio de profesionales todavía no está disponible/);
  assert.match(hub, /No hay fichas públicas, buscador de profesionales/);
  assert.match(hub, /El botón prepara un correo/);
  assert.ok(hub.includes('<noscript>'));
  assert.match(hub, /Cualquier futura ficha comercial o cobro/);
});
