function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const SUICIDE_SIGNAL = /\b(?:suicid\w*|matarme|quitarme la vida|acabar con mi vida|(?:me )?(?:quiero|queria) morir|no quiero (?:seguir )?viviendo?|no puedo seguir viviendo|pensamientos suicidas)\b/;
const ACTIVE_SELF = [
  /\b(?:quiero|voy a|pienso(?: en)?|estoy pensando en|he pensado en|tengo pensado)\s+(?:suicidarme|matarme|quitarme la vida|acabar con mi vida)\b/,
  /\b(?:suicidarme|matarme|quitarme la vida)\s+(?:ahora|hoy|esta noche|ya)\b/,
  /\b(?:quiero morir|me quiero morir|no quiero (?:seguir )?viviendo?|no puedo seguir viviendo)\b/
];
const ACTIVE_THIRD_PARTY = [
  /\b(?:mi\s+)?(?:hijo|hija|hermano|hermana|pareja|amigo|amiga|padre|madre|marido|mujer|alguien)\b.{0,60}\b(?:quiere|va a|piensa(?: en)?|dice que (?:quiere|va a)|puede|podria)\s+(?:suicidarse|matarse|quitarse la vida)\b/,
  /\b(?:me preocupa|temo que)\b.{0,80}\b(?:suicidarse|matarse|quitarse la vida)\b/
];
const BEREAVEMENT = [
  /\b(?:murio|fallecio|ha muerto|se ha muerto|perdi|hemos perdido)\b.{0,80}\b(?:por suicidio|se suicido)\b/,
  /\b(?:se suicido)\b.{0,80}\b(?:ano|anos|mes|meses|semana|semanas|ayer|familiar|padre|madre|hijo|hija|hermano|hermana|pareja|amigo|amiga)\b/
];
const NEGATED_CURRENT = [
  /\bno\s+(?:quiero|voy a|pienso(?: en)?|estoy pensando en|he pensado en|tengo pensado)\s+(?:suicidarme|matarme|quitarme la vida|hacerme dano)\b/,
  /\bya no\s+(?:quiero|voy a|pienso(?: en)?|estoy pensando en|he pensado en|tengo pensado)\s+(?:suicidarme|matarme|quitarme la vida|hacerme dano)\b/,
  /\bno\s+(?:quiere|va a|piensa(?: en)?|puede|podria)\s+(?:suicidarse|matarse|quitarse la vida)\b/,
  /\b(?:ya\s+)?no\s+(?:me\s+)?quiero\s+morir\b/
];
const PAST_ATTEMPT = [
  /\b(?:intente|trate de)\s+(?:suicidarme|matarme|quitarme la vida)\b.{0,50}\b(?:hace|en el pasado|anos?|meses?)\b/,
  /\bhace\s+(?:mucho|\d+\s+(?:anos?|meses?))\b.{0,60}\b(?:intente suicidarme|trate de matarme)\b/
];
const RESOLVED_PAST = [
  /\b(?:antes|hace anos?|en el pasado)\b.{0,80}\b(?:queria morir|me queria morir|pensaba en suicidarme|tuve pensamientos suicidas)\b.{0,80}\b(?:ahora estoy bien|ya estoy bien|ya no|lo supere|quedo atras)\b/,
  /\b(?:queria morir|me queria morir|pensaba en suicidarme|tuve pensamientos suicidas)\b.{0,80}\b(?:ahora estoy bien|ya estoy bien|ya no|lo supere|quedo atras)\b/
];
const HYPOTHETICAL = [
  /\b(?:que hago si|que pasaria si|y si quisiera|en caso de que|hipoteticamente|supongamos que|imagina que)\b.{0,80}\b(?:suicid\w*|matarme|quitarme la vida|quiero morir)\b/
];
const INFORMATIONAL = [
  /\b(?:informacion|estadisticas|datos|noticia|articulo|trabajo|estudio|prevencion)\b.{0,80}\bsuicid/,
  /\bsuicid\w*\b.{0,80}\b(?:informacion|estadisticas|datos|noticia|articulo|trabajo|estudio|prevencion)\b/,
  /\b(?:noticia|articulo|estudio|cita|libro|pelicula)\b.{0,80}\b(?:quiero morir|me quiero morir|suicid\w*)\b/
];

function any(patterns, text) {
  return patterns.some((pattern) => pattern.test(text));
}

function withoutMatches(patterns, text) {
  return patterns.reduce((remaining, pattern) => {
    const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    return remaining.replace(globalPattern, ' ');
  }, text);
}

export function classifySuicideContext(value) {
  const text = normalize(value);
  if (!SUICIDE_SIGNAL.test(text)) return Object.freeze({ context: 'none', urgent: false });

  const hasNegatedCurrent = any(NEGATED_CURRENT, text);
  // Remove only explicitly negated clauses before looking for active language.
  // This avoids turning "no quiero suicidarme" into an active crisis while
  // still allowing a separate active clause later in the same text to prevail.
  const activeText = hasNegatedCurrent ? withoutMatches(NEGATED_CURRENT, text) : text;

  if (any(HYPOTHETICAL, text)) return Object.freeze({ context: 'hypothetical', urgent: false });
  if (any(INFORMATIONAL, text)) return Object.freeze({ context: 'informational', urgent: false });
  if (any(RESOLVED_PAST, text)) return Object.freeze({ context: 'resolved_past', urgent: false });
  if (any(ACTIVE_SELF, activeText)) return Object.freeze({ context: 'active_self', urgent: true });
  if (any(ACTIVE_THIRD_PARTY, activeText)) return Object.freeze({ context: 'active_third_party', urgent: true });
  if (any(BEREAVEMENT, text)) return Object.freeze({ context: 'bereavement', urgent: false });
  if (hasNegatedCurrent) return Object.freeze({ context: 'negated_current', urgent: false });
  if (any(PAST_ATTEMPT, text)) return Object.freeze({ context: 'past_attempt', urgent: false });

  return Object.freeze({ context: 'ambiguous', urgent: false });
}
