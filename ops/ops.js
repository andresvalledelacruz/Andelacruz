let opsToken = '';
let queueItems = [];
let selectedItem = null;
let selectedBrief = null;
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
    error.data = data;
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

function decisionButtons() {
  return {
    approve: document.querySelector('[data-decision="approve"]'),
    reject: document.querySelector('[data-decision="reject"]'),
    escalate: document.querySelector('[data-decision="escalate"]')
  };
}

function setDecisionButtons({ approve = true, reject = true, escalate = true } = {}) {
  const buttons = decisionButtons();
  buttons.approve.disabled = !approve;
  buttons.reject.disabled = !reject;
  buttons.escalate.disabled = !escalate;
}

function resetCommandCenter(message = 'Esperando análisis del servidor…') {
  selectedBrief = null;
  document.querySelector('#commandDecision').textContent = 'ANALIZANDO…';
  document.querySelector('#commandDecision').className = 'command-decision';
  document.querySelector('#safetyCard').className = 'command-card';
  document.querySelector('#safetyLevel').textContent = '—';
  document.querySelector('#safetyText').textContent = message;
  document.querySelector('#primaryNeed').textContent = '—';
  document.querySelector('#primaryNeedText').textContent = '—';
  document.querySelector('#disciplineCount').textContent = '—';
  document.querySelector('#disciplineText').textContent = '—';
  document.querySelector('#commercialMode').textContent = '—';
  document.querySelector('#analyticsMode').textContent = '—';
  document.querySelector('#commandExplanation').textContent = 'El brief se calcula en el servidor. La interfaz no puede sustituir ni rebajar sus guardrails.';
  setDecisionButtons({ approve: false, reject: true, escalate: true });
}

function renderAuthoritativeBrief(result = {}) {
  selectedBrief = result;
  const safety = result.safety || {};
  const multidisciplinary = result.multidisciplinary || {};
  const primary = multidisciplinary.primary_need || {};
  const dimensions = Array.isArray(multidisciplinary.dimensions) ? multidisciplinary.dimensions : [];
  const disciplines = Array.isArray(multidisciplinary.disciplines) ? multidisciplinary.disciplines : [];

  const decisionEl = document.querySelector('#commandDecision');
  const isGateway = result.decision === 'SAFETY_GATEWAY' || safety.safety_gateway === true;
  const isHumanReview = result.decision === 'HUMAN_REVIEW';
  decisionEl.textContent = isGateway
    ? 'SAFETY GATEWAY'
    : isHumanReview
      ? 'REVISIÓN HUMANA'
      : 'RUTA CON GUARDRAILS';
  decisionEl.className = `command-decision ${isGateway ? 'danger' : isHumanReview ? 'warning' : 'ok'}`;

  const safetyCard = document.querySelector('#safetyCard');
  safetyCard.className = `command-card ${isGateway ? 'danger' : safety.level === 'P2' ? 'warning' : 'safe'}`;
  document.querySelector('#safetyLevel').textContent = safety.level === 'NONE' || !safety.level
    ? 'Sin señal crítica explícita'
    : safety.level;
  const resources = Array.isArray(safety.official_resources_spain) && safety.official_resources_spain.length
    ? ` · Recursos: ${safety.official_resources_spain.join(', ')}`
    : '';
  document.querySelector('#safetyText').textContent = isGateway
    ? `Revisión humana prioritaria${resources}`
    : safety.level === 'P2'
      ? 'Situación grave: requiere contexto humano.'
      : 'Motor servidor · sin decisión clínica automática.';

  document.querySelector('#primaryNeed').textContent = primary.label || primary.id || 'Revisión manual';
  const primaryReasons = Array.isArray(primary.reasons) ? primary.reasons : [];
  document.querySelector('#primaryNeedText').textContent = primaryReasons.slice(0, 2).join(' · ') || 'Sin evidencia suficiente para automatizar.';

  document.querySelector('#disciplineCount').textContent = `${disciplines.length} perspectivas`;
  document.querySelector('#disciplineText').textContent = disciplines.slice(0, 5).join(' · ') || 'Equipo generalista';
  document.querySelector('#commercialMode').textContent = result.commercial_ui_allowed === false ? 'BLOQUEADO' : 'Sin targeting sensible';
  document.querySelector('#analyticsMode').textContent = result.analytics_mode === 'minimal_aggregate_only'
    ? 'Analítica mínima y agregada'
    : 'Analítica minimizada';

  const secondary = dimensions.filter((item) => item.priority === 'secondary').map((item) => item.label).filter(Boolean);
  const secondaryText = secondary.length
    ? `Dimensiones secundarias: ${secondary.join(' · ')}.`
    : 'No se han detectado dimensiones secundarias suficientes.';
  document.querySelector('#commandExplanation').textContent = `${secondaryText} Brief autorizado por el servidor. Es orientativo, explicable y no constituye diagnóstico, consejo profesional ni peritaje.`;

  if (isGateway) {
    reasonSelect.value = 'crisis_or_safeguarding';
    setDecisionButtons({ approve: false, reject: false, escalate: true });
    setStatus(decisionStatus, 'error', 'Safety Gateway activo: el servidor solo permitirá escalar esta historia a seguridad.');
  } else {
    setDecisionButtons({ approve: true, reject: true, escalate: true });
  }
}

async function loadAuthoritativeBrief(item) {
  const messageId = item?.message_id;
  if (!messageId) return;
  resetCommandCenter();
  try {
    const data = await api(`/ops/moderation/${encodeURIComponent(messageId)}/brief`);
    if (!selectedItem || selectedItem.message_id !== messageId) return;
    if (data.authoritative !== true || !data.result) throw new Error('brief_not_authoritative');
    renderAuthoritativeBrief(data.result);
  } catch (error) {
    if (!selectedItem || selectedItem.message_id !== messageId) return;
    if (error.status === 401) {
      logout('El token ha dejado de ser válido.');
      return;
    }
    resetCommandCenter('No se pudo obtener el brief autorizado.');
    setStatus(decisionStatus, 'error', 'Modo seguro: la aprobación queda bloqueada hasta recuperar el análisis del servidor. Puedes rechazar o escalar si el contexto lo exige.');
  }
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
  selectedBrief = null;
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
  void loadAuthoritativeBrief(item);
}

function clearReview() {
  selectedItem = null;
  selectedBrief = null;
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
    meta.textContent = `${reasonLabels[item.reason]} · ${item.time}${item.executiveDecision ? ` · ${item.executiveDecision}` : ''}`;
    row.append(badge, text, meta);
    sessionLog.append(row);
  }
}

async function submitDecision(decision) {
  if (!selectedItem) return;

  if (!selectedBrief && decision === 'approve') {
    setStatus(decisionStatus, 'error', 'La aprobación está bloqueada hasta disponer del brief autorizado del servidor.');
    return;
  }

  const isSafetyGateway = selectedBrief?.decision === 'SAFETY_GATEWAY' || selectedBrief?.safety?.safety_gateway === true;
  if (isSafetyGateway && decision !== 'escalate') {
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
    const response = await api(`/ops/moderation/${encodeURIComponent(current.message_id)}/decision`, {
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
      executiveDecision: response.executive_brief?.decision || selectedBrief?.decision || '',
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
    if (error.status === 409 && error.data?.error === 'safety_gateway_requires_escalation') {
      reasonSelect.value = 'crisis_or_safeguarding';
      setStatus(decisionStatus, 'error', 'El servidor ha bloqueado esta decisión: Safety Gateway exige escalado a seguridad.');
      await loadAuthoritativeBrief(current);
      return;
    }
    setStatus(decisionStatus, 'error', 'No se pudo registrar la decisión. No se ha modificado la cola.');
  } finally {
    if (selectedItem) {
      const gateway = selectedBrief?.decision === 'SAFETY_GATEWAY' || selectedBrief?.safety?.safety_gateway === true;
      setDecisionButtons({ approve: Boolean(selectedBrief) && !gateway, reject: !gateway, escalate: true });
    }
  }
}

function logout(message = '') {
  opsToken = '';
  queueItems = [];
  selectedItem = null;
  selectedBrief = null;
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
