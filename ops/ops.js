let opsToken = '';
let queueItems = [];
let selectedItem = null;
const sessionDecisions = [];

const loginView = document.querySelector('#loginView');
const consoleView = document.querySelector('#consoleView');
const loginForm = document.querySelector('#loginForm');
const tokenInput = document.querySelector('#opsToken');
const loginStatus = document.querySelector('#loginStatus');
const refreshButton = document.querySelector('#refreshButton');
const logoutButton = document.querySelector('#logoutButton');
const queueList = document.querySelector('#queueList');
const queueCount = document.querySelector('#queueCount');
const emptyReview = document.querySelector('#emptyReview');
const reviewCard = document.querySelector('#reviewCard');
const reasonSelect = document.querySelector('#reasonSelect');
const decisionNote = document.querySelector('#decisionNote');
const decisionStatus = document.querySelector('#decisionStatus');
const sessionLog = document.querySelector('#sessionLog');

const decisionReasonMap = {
  approve: new Set(['safe_and_useful']),
  reject: new Set(['needs_editing','privacy_risk','unsafe_guidance','spam_or_abuse','out_of_scope','duplicate_or_test']),
  escalate: new Set(['crisis_or_safeguarding'])
};

const needLabels = {
  que_me_lean: 'Que me lean',
  experiencias_similares: 'Experiencias similares',
  recursos_practicos: 'Recursos prácticos',
  orientacion_profesional: 'Orientación profesional'
};

const decisionLabels = {
  approve: 'Aprobada',
  reject: 'Rechazada',
  escalate: 'Escalada'
};

const reasonLabels = {
  safe_and_useful: 'Segura y útil',
  needs_editing: 'Necesita edición',
  privacy_risk: 'Riesgo de privacidad',
  unsafe_guidance: 'Orientación insegura',
  crisis_or_safeguarding: 'Crisis o salvaguarda',
  spam_or_abuse: 'Spam o abuso',
  out_of_scope: 'Fuera de alcance',
  duplicate_or_test: 'Duplicada o prueba'
};

const commandRoutes = {
  emotional_support: {
    label: 'Apoyo emocional y experiencias similares',
    disciplines: ['Psicología no diagnóstica', 'Counseling', 'Experiencia vivida']
  },
  grief_transition: {
    label: 'Duelo y transición vital',
    disciplines: ['Duelo y transiciones', 'Psicología', 'Trabajo social']
  },
  relationship_family: {
    label: 'Pareja, familia y mediación',
    disciplines: ['Pareja y familia', 'Mediación', 'Psicología sistémica']
  },
  work_career: {
    label: 'Trabajo, empleabilidad y transición profesional',
    disciplines: ['Psicología del trabajo', 'Orientación laboral', 'Mentoría profesional']
  },
  financial_practical: {
    label: 'Orientación económica y práctica',
    disciplines: ['Orientación financiera', 'Trabajo social', 'Asesoramiento práctico']
  },
  legal_mediation: {
    label: 'Orientación jurídica o mediación',
    disciplines: ['Derecho', 'Mediación', 'Psicología jurídica']
  },
  social_community: {
    label: 'Red social, comunidad y pertenencia',
    disciplines: ['Psicología social', 'Trabajo social', 'Intervención comunitaria']
  },
  wellbeing_habits: {
    label: 'Sueño, estrés, hábitos y autorregulación',
    disciplines: ['Sueño', 'Estrés', 'Hábitos', 'Autorregulación']
  },
  clinical_review: {
    label: 'Valoración profesional de salud mental',
    disciplines: ['Psicología clínica/sanitaria', 'Psiquiatría', 'Neuropsicología cuando corresponda']
  },
  urgent_safety: {
    label: 'Seguridad y ayuda urgente',
    disciplines: ['Seguridad', 'Emergencias', 'Salud mental acreditada']
  }
};

const categoryCommandRoutes = {
  'Duelo y Pérdidas': ['grief_transition', 'emotional_support'],
  Soledad: ['social_community', 'emotional_support'],
  'Pareja y Rupturas': ['relationship_family', 'emotional_support'],
  Familia: ['relationship_family', 'emotional_support'],
  Trabajo: ['work_career', 'emotional_support'],
  Dinero: ['financial_practical', 'emotional_support'],
  Autoestima: ['emotional_support', 'wellbeing_habits'],
  Amistad: ['social_community', 'emotional_support'],
  Conflictos: ['legal_mediation', 'relationship_family'],
  'Otras historias': ['emotional_support']
};

const commandSignalRules = [
  ['work_career', 4, ['despid', 'paro', 'trabajo', 'empleo', 'curriculum', 'jefe', 'empresa', 'jubilacion']],
  ['financial_practical', 4, ['deuda', 'hipoteca', 'alquiler', 'dinero', 'embargo', 'factura', 'prestamo', 'banco']],
  ['legal_mediation', 4, ['denuncia', 'abogado', 'custodia', 'divorcio', 'juicio', 'contrato', 'herencia', 'desahucio']],
  ['relationship_family', 3, ['pareja', 'ruptura', 'separacion', 'hijos', 'familia', 'padres', 'madre', 'padre']],
  ['social_community', 3, ['solo', 'sola', 'soledad', 'aislado', 'aislada', 'nadie', 'mudanza', 'amigos', 'amistad']],
  ['grief_transition', 4, ['fallecio', 'murio', 'muerte', 'duelo', 'funeral', 'perdida']],
  ['wellbeing_habits', 2, ['no duermo', 'insomnio', 'estres', 'agotado', 'agotada', 'ansiedad', 'rutina']],
  ['clinical_review', 3, ['no puedo funcionar', 'no puedo trabajar', 'no puedo levantarme', 'ataques de panico', 'medicacion', 'psiquiatra', 'psicologo']]
];

const criticalGroups = {
  self_harm: ['suicid', 'matarme', 'quitarme la vida', 'hacerme dano', 'autoles'],
  harm_to_others: ['matar a', 'voy a matar', 'hacerle dano', 'amenaza de muerte'],
  violence_active: ['me esta pegando', 'me va a matar', 'violencia ahora', 'secuestr', 'retenid', 'cautiverio'],
  sexual_violence: ['agresion sexual', 'violacion', 'abuso sexual', 'sextorsion'],
  vulnerable_person: ['maltrato infantil', 'abuso infantil', 'grooming', 'maltrato a mayor', 'persona dependiente', 'cuidador me pega'],
  acute_psychiatric: ['brote psicotico', 'psicosis', 'voces me ordenan', 'mania grave', 'confusion repentina'],
  overdose_withdrawal: ['sobredosis', 'overdose', 'abstinencia grave', 'delirium tremens', 'intoxicacion grave'],
  acute_medical: ['no puedo respirar', 'dolor en el pecho', 'perdida de conciencia', 'no puedo mover un lado', 'quemaduras graves'],
  trafficking_coercion: ['trata de personas', 'trabajo forzoso', 'matrimonio forzado', 'control coercitivo', 'explotacion sexual'],
  housing_exposure: ['duermo en la calle', 'sin hogar', 'desahucio hoy', 'sin calefaccion con frio extremo'],
  disaster: ['incendio ahora', 'evacuacion', 'inundacion', 'terremoto', 'derrumbe', 'explosion']
};

const immediateCriticalGroups = new Set(['self_harm','harm_to_others','violence_active','overdose_withdrawal','acute_medical','disaster']);
const urgentCriticalGroups = new Set(['sexual_violence','vulnerable_person','acute_psychiatric','trafficking_coercion','housing_exposure']);

function normalizeCommandText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function analyzeCriticalSafety(payload = {}) {
  const text = normalizeCommandText(`${payload.title || ''} ${payload.story || ''}`);
  const matches = [];
  for (const [group, terms] of Object.entries(criticalGroups)) {
    const found = terms.filter((term) => text.includes(normalizeCommandText(term)));
    if (found.length) matches.push({ group, terms: found.slice(0, 3) });
  }
  const p0 = matches.some((item) => immediateCriticalGroups.has(item.group));
  const p1 = !p0 && matches.some((item) => urgentCriticalGroups.has(item.group));
  const level = p0 ? 'P0' : p1 ? 'P1' : matches.length ? 'P2' : 'NONE';
  const resources = [];
  if (level === 'P0') resources.push('112');
  if (matches.some((item) => item.group === 'self_harm')) resources.push('024');
  if (matches.some((item) => ['violence_active','sexual_violence','trafficking_coercion'].includes(item.group))) resources.push('016');
  return {
    level,
    gateway: level === 'P0' || level === 'P1',
    matchedGroups: matches,
    resources: [...new Set(resources)]
  };
}

function analyzeHumanNeeds(payload = {}) {
  const text = normalizeCommandText(`${payload.title || ''} ${payload.story || ''}`);
  const score = new Map();
  const evidence = new Map();
  const add = (route, points, why) => {
    score.set(route, (score.get(route) || 0) + points);
    if (!evidence.has(route)) evidence.set(route, []);
    evidence.get(route).push(why);
  };

  for (const route of categoryCommandRoutes[payload.category] || ['emotional_support']) {
    add(route, 2, `Categoría declarada: ${payload.category || 'sin categoría específica'}`);
  }

  for (const [route, weight, terms] of commandSignalRules) {
    const matched = terms.filter((term) => text.includes(normalizeCommandText(term)));
    if (matched.length) add(route, weight + Math.min(matched.length - 1, 2), `Señales: ${matched.slice(0, 3).join(', ')}`);
  }

  const needs = Array.isArray(payload.needs) ? payload.needs : [];
  if (needs.includes('orientacion_profesional')) add('clinical_review', 1, 'Solicita orientación profesional.');
  if (needs.includes('recursos_practicos')) add('financial_practical', 1, 'Solicita recursos prácticos; se contextualizan antes de derivar.');
  if (needs.includes('experiencias_similares')) add('emotional_support', 1, 'Solicita experiencias similares.');
  if (needs.includes('que_me_lean')) add('emotional_support', 1, 'Solicita escucha y comprensión.');

  const ranked = [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, points]) => ({
      id,
      score: points,
      label: commandRoutes[id]?.label || id,
      disciplines: commandRoutes[id]?.disciplines || [],
      reasons: evidence.get(id) || []
    }));

  const primary = ranked[0] || {
    id: 'emotional_support',
    score: 0,
    label: commandRoutes.emotional_support.label,
    disciplines: commandRoutes.emotional_support.disciplines,
    reasons: ['Sin señales suficientes; revisar manualmente.']
  };
  return { primary, secondary: ranked.slice(1, 4) };
}

function buildCommandBrief(payload = {}) {
  const safety = analyzeCriticalSafety(payload);
  const needs = analyzeHumanNeeds(payload);
  const routes = [needs.primary, ...needs.secondary];
  const disciplines = [...new Set(routes.flatMap((route) => route.disciplines || []))];
  const decision = safety.gateway ? 'SAFETY_GATEWAY' : 'ROUTE_WITH_GUARDRAILS';
  const analyticsMode = safety.gateway ? 'Analítica mínima y agregada' : 'Analítica minimizada';
  const commercialMode = safety.gateway ? 'BLOQUEADO' : 'Sin targeting sensible';
  return {
    safety,
    needs,
    disciplines,
    decision,
    analyticsMode,
    commercialMode
  };
}

function renderCommandCenter(payload = {}) {
  const brief = buildCommandBrief(payload);
  const decisionEl = document.querySelector('#commandDecision');
  const safetyCard = document.querySelector('#safetyCard');
  const safetyLevel = document.querySelector('#safetyLevel');
  const safetyText = document.querySelector('#safetyText');
  const primaryNeed = document.querySelector('#primaryNeed');
  const primaryNeedText = document.querySelector('#primaryNeedText');
  const disciplineCount = document.querySelector('#disciplineCount');
  const disciplineText = document.querySelector('#disciplineText');
  const commercialMode = document.querySelector('#commercialMode');
  const analyticsMode = document.querySelector('#analyticsMode');
  const explanation = document.querySelector('#commandExplanation');
  const approveButton = document.querySelector('[data-decision="approve"]');
  const rejectButton = document.querySelector('[data-decision="reject"]');
  const escalateButton = document.querySelector('[data-decision="escalate"]');

  decisionEl.textContent = brief.decision === 'SAFETY_GATEWAY' ? 'SAFETY GATEWAY' : 'REVISIÓN CON GUARDRAILS';
  decisionEl.className = `command-decision ${brief.safety.gateway ? 'danger' : 'ok'}`;
  safetyCard.className = `command-card ${brief.safety.gateway ? 'danger' : brief.safety.level === 'P2' ? 'warning' : 'safe'}`;
  safetyLevel.textContent = brief.safety.level === 'NONE' ? 'Sin señal crítica explícita' : brief.safety.level;
  const resources = brief.safety.resources.length ? ` · Recursos: ${brief.safety.resources.join(', ')}` : '';
  safetyText.textContent = brief.safety.gateway
    ? `Revisión humana prioritaria${resources}`
    : brief.safety.level === 'P2'
      ? 'Situación grave: contexto humano obligatorio.'
      : 'El detector no sustituye criterio humano.';

  primaryNeed.textContent = brief.needs.primary.label;
  primaryNeedText.textContent = brief.needs.primary.reasons.slice(0, 2).join(' · ') || 'Revisión manual.';
  disciplineCount.textContent = `${brief.disciplines.length} perspectivas`;
  disciplineText.textContent = brief.disciplines.slice(0, 5).join(' · ') || 'Equipo generalista';
  commercialMode.textContent = brief.commercialMode;
  analyticsMode.textContent = brief.analyticsMode;

  const secondaryText = brief.needs.secondary.length
    ? `Dimensiones secundarias: ${brief.needs.secondary.map((item) => item.label).join(' · ')}.`
    : 'No se han detectado dimensiones secundarias suficientes.';
  explanation.textContent = `${secondaryText} La lectura es orientativa y explicable; no constituye diagnóstico, consejo profesional ni peritaje.`;

  if (brief.safety.gateway) {
    reasonSelect.value = 'crisis_or_safeguarding';
    approveButton.disabled = true;
    rejectButton.disabled = true;
    escalateButton.disabled = false;
    setStatus(decisionStatus, 'error', 'Safety Gateway activo: esta historia no debe aprobarse desde moderación ordinaria. Escálala a seguridad.');
  } else {
    approveButton.disabled = false;
    rejectButton.disabled = false;
    escalateButton.disabled = false;
  }

  return brief;
}

function setStatus(el, kind, text) {
  el.className = `status ${kind || ''}`.trim();
  el.textContent = text;
}

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${opsToken}`, ...extra };
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    cache: 'no-store',
    ...options,
    headers: authHeaders(options.headers || {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function queueLength(metric) {
  const value = metric?.queue_length ?? metric?.queue_visible_length ?? metric?.total_messages ?? 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function excerpt(text, max = 150) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

async function loadConsole() {
  refreshButton.disabled = true;
  try {
    const [summary, pending] = await Promise.all([
      api('/ops/summary'),
      api('/ops/moderation/pending?limit=25')
    ]);

    document.querySelector('#metricModeration').textContent = queueLength(summary.queues?.moderation);
    document.querySelector('#metricSafety').textContent = queueLength(summary.queues?.safety);
    document.querySelector('#metricTasks').textContent = queueLength(summary.queues?.internal_tasks);
    document.querySelector('#metricApi').textContent = 'OK';
    document.querySelector('#lastRefresh').textContent = `Actualizado ${new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date())}`;

    queueItems = Array.isArray(pending.items) ? pending.items : [];
    renderQueue();

    if (selectedItem) {
      const stillThere = queueItems.find((item) => item.message_id === selectedItem.message_id);
      if (stillThere) selectItem(stillThere);
      else clearReview();
    }
  } catch (error) {
    if (error.status === 401) {
      logout('El token ya no es válido. Vuelve a introducirlo.');
      return;
    }
    document.querySelector('#metricApi').textContent = 'ERROR';
    document.querySelector('#lastRefresh').textContent = 'No se pudo actualizar';
    queueList.replaceChildren(messageNode('No se pudo cargar la cola. Revisa la API interna de staging.'));
  } finally {
    refreshButton.disabled = false;
  }
}

function messageNode(text) {
  const p = document.createElement('p');
  p.className = 'queue-empty';
  p.textContent = text;
  return p;
}

function renderQueue() {
  queueCount.textContent = String(queueItems.length);
  queueList.replaceChildren();
  if (!queueItems.length) {
    queueList.append(messageNode('No hay historias visibles pendientes ahora mismo.'));
    return;
  }

  for (const item of queueItems) {
    const payload = item.payload || {};
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `queue-item${selectedItem?.message_id === item.message_id ? ' active' : ''}`;
    button.dataset.messageId = item.message_id;

    const top = document.createElement('div');
    top.className = 'queue-item-top';
    const category = document.createElement('span');
    category.className = 'queue-category';
    category.textContent = payload.category || 'Sin categoría';
    const time = document.createElement('span');
    time.className = 'queue-time';
    time.textContent = formatDate(item.enqueued_at);
    top.append(category, time);

    const title = document.createElement('strong');
    title.textContent = payload.title || 'Historia sin título';
    const preview = document.createElement('p');
    preview.textContent = excerpt(payload.story || '');

    button.append(top, title, preview);
    button.addEventListener('click', () => selectItem(item));
    queueList.append(button);
  }
}

function selectItem(item) {
  selectedItem = item;
  renderQueue();
  emptyReview.hidden = true;
  reviewCard.hidden = false;

  const payload = item.payload || {};
  document.querySelector('#reviewCategory').textContent = payload.category || 'Sin categoría';
  document.querySelector('#reviewHeadline').textContent = payload.title || 'Historia sin título';
  document.querySelector('#reviewId').textContent = `#${item.message_id}`;
  document.querySelector('#reviewAlias').textContent = payload.alias || 'Sin alias';
  document.querySelector('#reviewNeeds').textContent = Array.isArray(payload.needs) && payload.needs.length
    ? payload.needs.map((need) => needLabels[need] || need).join(' · ')
    : 'No indicado';
  document.querySelector('#reviewDate').textContent = formatDate(payload.submitted_at || item.enqueued_at);
  document.querySelector('#reviewSynthetic').textContent = payload.synthetic === true ? 'Contenido ficticio de staging' : 'Revisar origen';
  document.querySelector('#reviewStory').textContent = payload.story || '';
  reasonSelect.value = '';
  decisionNote.value = '';
  setStatus(decisionStatus, '', '');
  renderCommandCenter(payload);
}

function clearReview() {
  selectedItem = null;
  reviewCard.hidden = true;
  emptyReview.hidden = false;
  renderQueue();
}

function renderSessionLog() {
  sessionLog.replaceChildren();
  if (!sessionDecisions.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Todavía no has tomado ninguna decisión en esta sesión.';
    sessionLog.append(p);
    return;
  }

  for (const item of sessionDecisions) {
    const row = document.createElement('div');
    row.className = 'session-entry';
    const badge = document.createElement('span');
    badge.className = `decision-badge ${item.decision}`;
    badge.textContent = decisionLabels[item.decision];
    const text = document.createElement('strong');
    text.textContent = `#${item.messageId} · ${item.title}`;
    const meta = document.createElement('small');
    meta.textContent = `${reasonLabels[item.reason]} · ${item.time}`;
    row.append(badge, text, meta);
    sessionLog.append(row);
  }
}

async function submitDecision(decision) {
  if (!selectedItem) return;
  const brief = buildCommandBrief(selectedItem.payload || {});
  if (brief.safety.gateway && decision !== 'escalate') {
    reasonSelect.value = 'crisis_or_safeguarding';
    setStatus(decisionStatus, 'error', 'Safety Gateway activo: solo está permitido escalar esta historia a seguridad.');
    return;
  }

  const reason = reasonSelect.value;
  if (!reason) {
    setStatus(decisionStatus, 'error', 'Selecciona primero el motivo de la decisión.');
    reasonSelect.focus();
    return;
  }
  if (!decisionReasonMap[decision]?.has(reason)) {
    setStatus(decisionStatus, 'error', `El motivo “${reasonLabels[reason] || reason}” no corresponde a esta decisión.`);
    return;
  }

  if ((decision === 'reject' || decision === 'escalate') && !window.confirm(`¿Confirmas ${decision === 'reject' ? 'rechazar' : 'escalar'} esta historia?`)) return;

  const buttons = [...document.querySelectorAll('[data-decision]')];
  buttons.forEach((button) => { button.disabled = true; });
  setStatus(decisionStatus, '', 'Guardando decisión…');

  const current = selectedItem;
  try {
    await api(`/ops/moderation/${encodeURIComponent(current.message_id)}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        reason_code: reason,
        note: decisionNote.value.trim()
      })
    });

    sessionDecisions.unshift({
      messageId: current.message_id,
      title: current.payload?.title || 'Historia sin título',
      decision,
      reason,
      time: new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date())
    });
    renderSessionLog();
    setStatus(decisionStatus, 'ok', 'Decisión registrada correctamente.');
    clearReview();
    await loadConsole();
  } catch (error) {
    if (error.status === 401) {
      logout('El token ha dejado de ser válido.');
      return;
    }
    setStatus(decisionStatus, 'error', 'No se pudo registrar la decisión. No se ha modificado la cola.');
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

function logout(message = '') {
  opsToken = '';
  queueItems = [];
  selectedItem = null;
  tokenInput.value = '';
  consoleView.hidden = true;
  loginView.hidden = false;
  clearReview();
  if (message) setStatus(loginStatus, 'error', message);
  tokenInput.focus();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const candidate = tokenInput.value.trim();
  if (!candidate) return;
  opsToken = candidate;
  setStatus(loginStatus, '', 'Comprobando acceso…');
  try {
    await api('/ops/summary');
    setStatus(loginStatus, 'ok', 'Acceso correcto.');
    loginView.hidden = true;
    consoleView.hidden = false;
    await loadConsole();
  } catch (error) {
    opsToken = '';
    setStatus(loginStatus, 'error', error.status === 401 ? 'Token incorrecto.' : 'No se pudo conectar con la consola interna.');
  }
});

refreshButton.addEventListener('click', loadConsole);
logoutButton.addEventListener('click', () => logout());
for (const button of document.querySelectorAll('[data-decision]')) {
  button.addEventListener('click', () => submitDecision(button.dataset.decision));
}

renderSessionLog();
