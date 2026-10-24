import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../gestion-emocional/index.html', import.meta.url), 'utf8');

test('Gestión emocional tiene identidad, canonical e indexación propios', () => {
  assert.match(html, /<title>Gestión emocional:/);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/gestion-emocional\/"/);
  assert.match(html, /name="robots" content="index,follow/);
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-24"/);
  assert.match(html, /Actualizado el 24 de octubre de 2026/);
  assert.match(html, /href="\/assets\/home-fonts\.css"/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
});

test('el hub deriva a causas específicas sin canibalizarlas', () => {
  for (const href of ['/soledad/', '/rupturas/', '/duelo/', '/familia/', '/trabajo/', '/dinero/']) {
    assert.ok(html.includes(`href="${href}`), `missing route: ${href}`);
  }
});

test('el hub mantiene límites no diagnósticos y puente de seguridad', () => {
  assert.match(html, /no intenta diagnosticar/i);
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /no es un servicio de emergencias/i);
  assert.match(html, /no asigna un diagnóstico ni una puntuación clínica/i);
  assert.match(html, /no demuestra que el problema sea psicológico/i);
});

test('el hub ofrece decisiones, apoyo psicológico verificable y seguimiento acotado', () => {
  assert.match(html, /Un mapa para decidir qué necesita atención primero/i);
  assert.match(html, /Un plan de veinte minutos/i);
  assert.match(html, /Cómo preparar y evaluar una primera consulta/i);
  assert.match(html, /Un registro breve de siete días/i);
  assert.match(html, /Cualificación y alcance/i);
  assert.match(html, /Sin promesas absolutas/i);
});

test('el hub convierte el desbordamiento en un plan de 24 horas con continuidad', () => {
  assert.match(html, /Un mapa para las próximas 24 horas/i);
  assert.match(html, /Ahora: seguridad y cuerpo/i);
  assert.match(html, /Hoy: una obligación real/i);
  assert.match(html, /Mañana: continuidad/i);
  assert.match(html, /Cómo pedir ayuda sin tener que explicarlo todo/i);
  assert.match(html, /Cierra el bucle: qué hacer después de pedir ayuda/i);
  assert.match(html, /qué acción hará cada persona, en qué plazo y por qué canal/i);
});

test('el acceso público, la privacidad y los límites clínicos quedan separados', () => {
  assert.match(html, /cartera común del Sistema Nacional de Salud incluye en atención primaria/i);
  assert.match(html, /El acceso concreto y los tiempos dependen del servicio de salud de cada comunidad autónoma/i);
  assert.match(html, /sin cambiar tratamientos por tu cuenta/i);
  assert.match(html, /no conviertas una noche difícil en un diagnóstico/i);
  assert.match(html, /no documentos completos, contraseñas, historiales o datos de terceras personas/i);
  assert.match(html, /cuando existe miedo/i);
});

test('el hub sustituye la captación de relatos y conserva el firewall comercial', () => {
  assert.match(html, /Buscar ayuda por situación/i);
  assert.doesNotMatch(html, /Contar mi historia/i);
  assert.match(html, /<a href="\/#inicio">Inicio<\/a>/i);
  assert.doesNotMatch(html, /afiliad|publicidad|patrocin|data-ad|utm_/i);
});

test('las fuentes primarias vigentes y el runtime público permanecen visibles', () => {
  assert.match(html, /who\.int\/es\/publications\/b\/53604/);
  assert.match(html, /who\.int\/es\/news-room\/questions-and-answers\/item\/stress/);
  assert.match(html, /sanidad\.gob\.es\/areas\/calidadAsistencial\/estrategias\/saludMental/);
  assert.match(html, /sanidad\.gob\.es\/linea024/);
  assert.match(html, /mental-health-strengthening-our-response/);
  assert.match(html, /Plan_accion_salud_mental_2025_27\.pdf/);
  assert.match(html, /prestacionesSanitarias\/CarteraDeServicios\/home\.htm/);
  assert.match(html, /<script src="\/public-page-runtime\.js" async><\/script>/);
});
