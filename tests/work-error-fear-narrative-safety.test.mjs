import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../trabajo/tengo-miedo-de-equivocarme-en-el-trabajo/index.html', import.meta.url), 'utf8');

test('separa riesgo real, sistema, entorno y miedo anticipatorio', () => {
  assert.match(html, /El error tiene consecuencias reales/i);
  assert.match(html, /No tienes suficiente claridad o apoyo/i);
  assert.match(html, /El entorno castiga el error/i);
  assert.match(html, /El miedo aparece incluso con medios suficientes/i);
});

test('evita convertir un error laboral en identidad personal', () => {
  assert.match(html, /el error deja de describir una tarea y empieza a amenazar la identidad profesional/i);
  assert.match(html, /He cometido un error/i);
  assert.match(html, /soy un desastre/i);
});

test('incluye controles concretos y criterio de cierre', () => {
  assert.match(html, /Define qué errores son críticos/i);
  assert.match(html, /Decide cuándo una tarea está suficientemente comprobada/i);
  assert.match(html, /Consecuencia:/i);
  assert.match(html, /Reversibilidad:/i);
  assert.match(html, /Escalado:/i);
});

test('no diagnostica y contextualiza límites de la evidencia', () => {
  assert.match(html, /No hace falta etiquetarlo como ansiedad, perfeccionismo o síndrome del impostor/i);
  assert.match(html, /procede en parte de entornos sanitarios/i);
  assert.match(html, /no como prueba de que todos los sectores funcionen igual/i);
});

test('mantiene carril de seguridad para errores de alto impacto', () => {
  assert.match(html, /No improvises ni ocultes una duda crítica/i);
  assert.match(html, /detén o escala la actuación cuando corresponda/i);
  assert.match(html, /peligro grave e inmediato/i);
  assert.match(html, /no puede evaluar a distancia si una tarea concreta es segura/i);
});

test('conserva canonical y límites profesionales', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/trabajo\/tengo-miedo-de-equivocarme-en-el-trabajo\/"/);
  assert.match(html, /no sustituye evaluación de riesgos, formación específica del puesto, atención sanitaria ni asesoramiento laboral o jurídico individual/i);
});
