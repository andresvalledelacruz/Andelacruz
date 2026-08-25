import Fastify from 'fastify';
import pg from 'pg';

const { Pool } = pg;
const app = Fastify({
  logger: true,
  bodyLimit: 32 * 1024
});

const port = Number(process.env.PORT || 10000);
const host = '0.0.0.0';
const environment = process.env.NODE_ENV || 'staging';
const queueNames = ['moderation', 'safety', 'internal_tasks'];
const categories = [
  'Duelo y Pérdidas',
  'Soledad',
  'Pareja y Rupturas',
  'Familia',
  'Trabajo',
  'Dinero',
  'Autoestima',
  'Amistad',
  'Conflictos',
  'Otras historias'
];
const allowedNeeds = new Set([
  'que_me_lean',
  'experiencias_similares',
  'recursos_practicos',
  'orientacion_profesional'
]);
const allowedInteractions = new Set([
  'tambien_me_paso',
  'te_acompano',
  'esto_me_ayudo',
  'seguir',
  'guardar'
]);

const syntheticStories = [
  {
    id: 'demo-ruptura-01',
    slug: 'volver-a-ser-yo-despues-de-una-ruptura',
    category: 'Pareja y Rupturas',
    title: 'Volver a ser yo después de una ruptura que no vi venir',
    excerpt: 'Los primeros días no buscaba una frase bonita. Necesitaba entender por qué todo lo cotidiano se había quedado sin sitio.',
    phase: 'Mes 4',
    context: 'Ruptura inesperada · convivencia terminada',
    body: [
      'La ruptura fue rápida y, para mí, completamente inesperada. Lo más difícil no fue solo perder la relación, sino perder de golpe la rutina que daba forma a casi todos mis días.',
      'Durante la primera semana intenté resolverlo todo a la vez. Después entendí que necesitaba separar tres cosas: lo que había ocurrido, lo que todavía dependía de mí y lo que tenía que dejar de intentar controlar.',
      'A los cuatro meses sigo teniendo días difíciles, pero ya no organizo cada decisión alrededor de lo que pasó. Recuperé hábitos propios, volví a ver a personas que había dejado de frecuentar y dejé de buscar una explicación nueva cada noche.'
    ],
    timeline: [
      { label: 'Día 3', text: 'Bloqueo, sueño irregular y necesidad constante de entender qué había pasado.' },
      { label: 'Semana 3', text: 'Empecé a separar decisiones prácticas de emociones que no necesitaban resolverse ese mismo día.' },
      { label: 'Mes 4', text: 'La ruptura sigue formando parte de mi historia, pero ya no dirige cada hora de mi vida.' }
    ],
    helped: ['Volver a una rutina propia', 'Hablar con alguien que ya había pasado por una ruptura similar', 'Poner límites a la búsqueda constante de respuestas'],
    nextSteps: ['Ordenar primero los cambios prácticos inmediatos', 'Buscar experiencias comparables por fase, no solo por categoría', 'Pedir apoyo profesional si el malestar desborda la vida cotidiana']
  },
  {
    id: 'demo-trabajo-01',
    slug: 'me-despidieron-con-52-y-no-sabia-por-donde-empezar',
    category: 'Trabajo',
    title: 'Me despidieron con 52 años y no sabía por dónde empezar',
    excerpt: 'El golpe no fue únicamente económico. Sentí que de repente tenía que demostrar que todavía servía para algo.',
    phase: 'Mes 7',
    context: 'Despido · reinvención profesional +50',
    body: [
      'El día del despido salí pensando en el dinero, pero al llegar a casa descubrí que también me había quedado sin una parte importante de mi identidad.',
      'Los primeros intentos de buscar trabajo fueron desordenados. Enviaba currículums a casi cualquier cosa. Cuando empecé a registrar qué sabía hacer, qué problemas podía resolver y qué sectores estaban contratando perfiles parecidos, la búsqueda dejó de ser una reacción y se convirtió en un plan.',
      'Siete meses después mi situación no es idéntica a la anterior, pero ya no quiero que lo sea. He conseguido reconstruir una dirección profesional distinta y más realista.'
    ],
    timeline: [
      { label: 'Semana 1', text: 'Urgencia económica y sensación de pérdida de valor personal.' },
      { label: 'Mes 2', text: 'Inventario de experiencia, contactos y opciones de formación muy concretas.' },
      { label: 'Mes 7', text: 'Nueva dirección profesional y expectativas más ajustadas al mercado real.' }
    ],
    helped: ['Separar identidad y puesto de trabajo', 'Convertir experiencia en capacidades concretas', 'Hablar con personas que se reinventaron después de los 50'],
    nextSteps: ['Revisar obligaciones económicas inmediatas', 'Mapear capacidades transferibles', 'Usar orientación laboral especializada cuando aporte valor']
  },
  {
    id: 'demo-duelo-01',
    slug: 'despues-del-funeral-empezo-la-parte-que-nadie-me-habia-contado',
    category: 'Duelo y Pérdidas',
    title: 'Después del funeral empezó la parte que nadie me había contado',
    excerpt: 'Cuando todo el mundo volvió a su rutina, yo seguía intentando entender cómo continuar con una ausencia que estaba en todas partes.',
    phase: 'Año 1',
    context: 'Pérdida familiar · reconstrucción cotidiana',
    body: [
      'Los primeros días estuvieron llenos de gente y gestiones. La parte más extraña llegó después, cuando el entorno recuperó su ritmo normal y yo todavía no sabía cuál era el mío.',
      'Me ayudó dejar de medir el duelo como si tuviera que ir desapareciendo de forma lineal. Empecé a observar qué momentos me desbordaban, qué fechas necesitaban más espacio y qué rutinas sí podía recuperar sin sentir que estaba olvidando a nadie.',
      'Un año después la ausencia continúa. Lo que ha cambiado es mi capacidad para convivir con ella sin que cada recuerdo me quite el suelo.'
    ],
    timeline: [
      { label: 'Semana 2', text: 'Fin de las gestiones y sensación de vacío cuando el entorno vuelve a la normalidad.' },
      { label: 'Mes 5', text: 'Recuperación de rutinas sin exigir que el dolor desaparezca.' },
      { label: 'Año 1', text: 'La ausencia permanece, pero existe más espacio para vivir alrededor de ella.' }
    ],
    helped: ['Aceptar que el proceso no era lineal', 'Preparar fechas especialmente difíciles', 'Compartir el proceso con personas que conocían esa fase del duelo'],
    nextSteps: ['Dar espacio a necesidades prácticas y emocionales', 'Evitar compararse con el ritmo de otras personas', 'Buscar apoyo especializado si el sufrimiento se vuelve inmanejable']
  },
  {
    id: 'demo-soledad-01',
    slug: 'me-mude-y-descubri-que-estar-rodeado-no-es-lo-mismo-que-estar-acompanado',
    category: 'Soledad',
    title: 'Me mudé y descubrí que estar rodeado no es lo mismo que estar acompañado',
    excerpt: 'Tenía compañeros, vecinos y mensajes en el móvil. Aun así, no tenía a quién llamar para decir simplemente “hoy no estoy bien”.',
    phase: 'Mes 6',
    context: 'Mudanza · red social nueva',
    body: [
      'Pensé que conocer gente sería cuestión de tiempo. Lo fue, pero conocer personas no significó sentirme acompañado.',
      'El cambio empezó cuando dejé de intentar crear una vida social completa de golpe. Elegí dos espacios recurrentes y me propuse aparecer con regularidad. La repetición creó algo que las conversaciones sueltas no habían conseguido: familiaridad.',
      'Seis meses después mi red sigue siendo pequeña, pero ya tiene continuidad. Y eso ha cambiado mucho más de lo que esperaba.'
    ],
    timeline: [
      { label: 'Mes 1', text: 'Mucho contacto superficial y muy poca sensación de pertenencia.' },
      { label: 'Mes 3', text: 'Dos actividades recurrentes y primeras relaciones con continuidad.' },
      { label: 'Mes 6', text: 'Una red pequeña, pero suficientemente estable para dejar de sentir que cada semana empieza desde cero.' }
    ],
    helped: ['Priorizar continuidad sobre cantidad', 'Elegir espacios recurrentes', 'Aceptar una red pequeña mientras se construye'],
    nextSteps: ['Buscar contextos con repetición real', 'Distinguir aislamiento de falta de pertenencia', 'Explorar recursos comunitarios locales si encajan']
  },
  {
    id: 'demo-familia-01',
    slug: 'cuando-deje-de-cuidar-no-sabia-quien-era-yo',
    category: 'Familia',
    title: 'Cuando dejé de cuidar, no sabía quién era yo',
    excerpt: 'Durante años mi agenda, mis decisiones y hasta mis conversaciones giraron alrededor de cuidar. Cuando terminó, apareció un vacío inesperado.',
    phase: 'Mes 9',
    context: 'Fin de cuidados · identidad posterior',
    body: [
      'Durante mucho tiempo pensé que el cansancio desaparecería cuando dejara de cuidar. No esperaba que, junto al alivio, llegara una sensación tan fuerte de no saber qué hacer conmigo mismo.',
      'La reconstrucción empezó cuando traté mi tiempo libre no como un hueco que había que llenar, sino como una vida que necesitaba volver a aprender. Recuperé una actividad antigua y empecé otra completamente nueva.',
      'Nueve meses después todavía estoy descubriendo qué quiero conservar de la persona que fui durante los cuidados y qué necesito dejar atrás.'
    ],
    timeline: [
      { label: 'Semana 1', text: 'Alivio, culpa y una agenda repentinamente vacía.' },
      { label: 'Mes 4', text: 'Recuperación de intereses propios sin negar la etapa anterior.' },
      { label: 'Mes 9', text: 'Nueva identidad cotidiana que integra lo vivido sin quedar definida solo por ello.' }
    ],
    helped: ['Nombrar el vacío posterior a los cuidados', 'Recuperar actividades propias', 'Hablar con otros ex cuidadores'],
    nextSteps: ['Revisar descanso, rutinas y red personal', 'Recuperar decisiones pequeñas propias', 'Buscar asociaciones o apoyo específico para cuidadores y ex cuidadores']
  },
  {
    id: 'demo-dinero-01',
    slug: 'una-deuda-me-quitaba-el-sueno-hasta-que-deje-de-mirarla-como-un-monstruo',
    category: 'Dinero',
    title: 'Una deuda me quitaba el sueño hasta que dejé de mirarla como un monstruo',
    excerpt: 'No resolví el problema en una tarde. Lo primero que cambió fue dejar de evitar abrir cartas, correos y números.',
    phase: 'Mes 5',
    context: 'Deuda · reorganización financiera',
    body: [
      'Durante semanas mi estrategia fue no mirar. Cada aviso parecía confirmar que la situación era demasiado grande para afrontarla.',
      'El primer cambio útil fue hacer un inventario completo: importes, fechas, intereses y consecuencias reales. No solucionó la deuda, pero transformó una amenaza difusa en una lista concreta de decisiones.',
      'Cinco meses después sigo pagando y ajustando gastos. La diferencia es que ahora sé qué viene después y cuándo necesito pedir asesoramiento.'
    ],
    timeline: [
      { label: 'Semana 1', text: 'Evitación, ansiedad y desconocimiento del importe total real.' },
      { label: 'Mes 2', text: 'Inventario completo y prioridades ordenadas.' },
      { label: 'Mes 5', text: 'Plan en marcha y criterios claros para pedir ayuda profesional cuando hace falta.' }
    ],
    helped: ['Convertir incertidumbre en datos concretos', 'Priorizar pagos por impacto real', 'Pedir orientación antes de tomar decisiones irreversibles'],
    nextSteps: ['Reunir información completa antes de decidir', 'Evitar soluciones milagro o créditos impulsivos', 'Consultar asesoramiento financiero o jurídico cualificado cuando corresponda']
  }
];

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

const rateWindowMs = 60 * 60 * 1000;
const rateMax = 3;
const submissionsByIp = new Map();
const interactionWindowMs = 10 * 60 * 1000;
const interactionMax = 30;
const interactionsByIp = new Map();

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') return false;
    return (
      url.hostname === 'desgracias-staging.pages.dev' ||
      url.hostname.endsWith('.desgracias-staging.pages.dev') ||
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

function applyCors(request, reply) {
  const origin = request.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Vary', 'Origin');
  }
  reply.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  reply.header('Access-Control-Max-Age', '600');
}

function allowOriginOrDeny(request, reply) {
  const origin = request.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    reply.code(403).send({ error: 'origin_not_allowed' });
    return false;
  }
  return true;
}

function withinRateLimit(store, ip, windowMs, max) {
  const now = Date.now();
  const recent = (store.get(ip) || []).filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= max) return false;
  recent.push(now);
  store.set(ip, recent);
  return true;
}

function storySummary(story) {
  return {
    id: story.id,
    slug: story.slug,
    category: story.category,
    title: story.title,
    excerpt: story.excerpt,
    phase: story.phase,
    context: story.context
  };
}

app.addHook('onSend', async (request, reply, payload) => {
  applyCors(request, reply);
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('Referrer-Policy', 'no-referrer');
  return payload;
});

app.options('/api/stories', async (request, reply) => {
  if (!allowOriginOrDeny(request, reply)) return;
  applyCors(request, reply);
  return reply.code(204).send();
});

app.options('/api/stories/:slug/interactions', async (request, reply) => {
  if (!allowOriginOrDeny(request, reply)) return;
  applyCors(request, reply);
  return reply.code(204).send();
});

app.get('/health', async () => ({
  status: 'ok',
  service: 'desgracias-api',
  environment,
  timestamp: new Date().toISOString()
}));

app.get('/ready', async (_request, reply) => {
  if (!pool) {
    return reply.code(503).send({ status: 'not_ready', database: 'not_configured' });
  }

  try {
    await pool.query('select 1');
    return { status: 'ready', database: 'ok' };
  } catch (error) {
    app.log.error(error);
    return reply.code(503).send({ status: 'not_ready', database: 'error' });
  }
});

app.get('/api/meta', async () => ({
  environment,
  categories,
  story_submission: environment === 'staging' ? 'enabled_for_synthetic_testing' : 'enabled',
  story_explorer: environment === 'staging' ? 'synthetic_demo' : 'not_configured'
}));

app.get('/api/stories', async (request, reply) => {
  if (!allowOriginOrDeny(request, reply)) return;
  const requestedCategory = typeof request.query?.category === 'string' ? request.query.category.trim() : '';
  const items = requestedCategory && categories.includes(requestedCategory)
    ? syntheticStories.filter((story) => story.category === requestedCategory)
    : syntheticStories;

  return {
    environment,
    synthetic: true,
    disclaimer: 'Contenido ficticio de staging. No representa historias ni métricas reales de usuarios.',
    items: items.map(storySummary)
  };
});

app.get('/api/stories/:slug', async (request, reply) => {
  if (!allowOriginOrDeny(request, reply)) return;
  const slug = String(request.params?.slug || '');
  const story = syntheticStories.find((item) => item.slug === slug);
  if (!story) return reply.code(404).send({ error: 'story_not_found' });
  return {
    environment,
    synthetic: true,
    disclaimer: 'Historia ficticia de staging. No representa a una persona real.',
    story
  };
});

app.post('/api/stories', async (request, reply) => {
  if (!allowOriginOrDeny(request, reply)) return;
  if (!pool) {
    return reply.code(503).send({ error: 'database_not_configured' });
  }

  const body = request.body ?? {};
  const alias = typeof body.alias === 'string' ? body.alias.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const story = typeof body.story === 'string' ? body.story.trim() : '';
  const website = typeof body.website === 'string' ? body.website.trim() : '';
  const consent = body.consent === true;
  const synthetic = body.synthetic === true;
  const needs = Array.isArray(body.needs)
    ? body.needs.filter((item) => typeof item === 'string' && allowedNeeds.has(item)).slice(0, 4)
    : [];

  if (website) {
    return reply.code(202).send({ status: 'received' });
  }
  if (!categories.includes(category)) {
    return reply.code(400).send({ error: 'invalid_category' });
  }
  if (alias.length > 40) {
    return reply.code(400).send({ error: 'alias_too_long' });
  }
  if (title.length < 8 || title.length > 120) {
    return reply.code(400).send({ error: 'invalid_title_length' });
  }
  if (story.length < 80 || story.length > 5000) {
    return reply.code(400).send({ error: 'invalid_story_length' });
  }
  if (!consent) {
    return reply.code(400).send({ error: 'consent_required' });
  }
  if (environment === 'staging' && !synthetic) {
    return reply.code(400).send({ error: 'staging_requires_synthetic_content' });
  }

  const ip = request.ip || 'unknown';
  if (!withinRateLimit(submissionsByIp, ip, rateWindowMs, rateMax)) {
    return reply.code(429).send({ error: 'rate_limit', retry_after_seconds: 3600 });
  }

  const message = {
    kind: 'story_submission',
    version: 1,
    environment,
    source: 'web_staging',
    submitted_at: new Date().toISOString(),
    alias: alias || null,
    category,
    title,
    story,
    needs,
    synthetic
  };

  try {
    const { rows } = await pool.query(
      'select pgmq.send($1, $2::jsonb) as msg_id',
      ['moderation', JSON.stringify(message)]
    );
    const msgId = rows[0]?.msg_id ?? null;
    app.log.info({ msgId, category, synthetic }, 'story submission queued for moderation');
    return reply.code(202).send({
      status: 'queued_for_moderation',
      submission_id: msgId,
      environment
    });
  } catch (error) {
    app.log.error({ err: error }, 'story submission queue failed');
    return reply.code(503).send({ error: 'queue_unavailable' });
  }
});

app.post('/api/stories/:slug/interactions', async (request, reply) => {
  if (!allowOriginOrDeny(request, reply)) return;
  if (!pool) return reply.code(503).send({ error: 'database_not_configured' });

  const slug = String(request.params?.slug || '');
  const story = syntheticStories.find((item) => item.slug === slug);
  if (!story) return reply.code(404).send({ error: 'story_not_found' });

  const body = request.body ?? {};
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const synthetic = body.synthetic === true;
  if (!allowedInteractions.has(type)) return reply.code(400).send({ error: 'invalid_interaction' });
  if (environment === 'staging' && !synthetic) {
    return reply.code(400).send({ error: 'staging_requires_synthetic_content' });
  }

  const ip = request.ip || 'unknown';
  if (!withinRateLimit(interactionsByIp, ip, interactionWindowMs, interactionMax)) {
    return reply.code(429).send({ error: 'rate_limit', retry_after_seconds: 600 });
  }

  const message = {
    kind: 'story_interaction',
    version: 1,
    environment,
    source: 'web_staging',
    occurred_at: new Date().toISOString(),
    story_id: story.id,
    story_slug: story.slug,
    interaction_type: type,
    synthetic: true
  };

  try {
    const { rows } = await pool.query(
      'select pgmq.send($1, $2::jsonb) as msg_id',
      ['internal_tasks', JSON.stringify(message)]
    );
    return reply.code(202).send({
      status: 'interaction_queued',
      event_id: rows[0]?.msg_id ?? null,
      synthetic: true
    });
  } catch (error) {
    app.log.error({ err: error, slug, type }, 'story interaction queue failed');
    return reply.code(503).send({ error: 'queue_unavailable' });
  }
});

async function runStagingQueueSelfTest() {
  if (environment !== 'staging' || !pool) return;

  for (const queue of queueNames) {
    try {
      const { rows } = await pool.query('select * from pgmq.metrics($1)', [queue]);
      app.log.info({ queue, metrics: rows[0] ?? {} }, 'staging queue self-test ok');
    } catch (error) {
      app.log.error({ queue, err: error }, 'staging queue self-test failed');
    }
  }
}

const shutdown = async () => {
  try {
    await app.close();
    if (pool) await pool.end();
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

await app.listen({ port, host });
await runStagingQueueSelfTest();
