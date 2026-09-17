const EXACT_REPLACEMENTS = Object.freeze([
  [/\b(?:suicdio|sucid(?:io|arme|arse)|suicd(?:io|arme|arse)|suicididio)\b/gi, (m) => m.toLowerCase().endsWith('arme') ? 'suicidarme' : m.toLowerCase().endsWith('arse') ? 'suicidarse' : 'suicidio'],
  [/\b(?:matrme|matarmee|matarmeee)\b/gi, 'matarme'],
  [/\b(?:autolesion|autolesionarme|autolesionarse)\b/gi, (m) => m.toLowerCase()],
  [/\b(?:maltrto|maltratoo)\b/gi, 'maltrato'],
  [/\b(?:agreson|agrecion|agresionn)\b/gi, 'agresion'],
  [/\b(?:acso|acosoo)\b/gi, 'acoso'],
  [/\b(?:buling|bulling|bullyng)\b/gi, 'bullying'],
  [/\b(?:deprecion|depresionn)\b/gi, 'depresion'],
  [/\b(?:ansieda|ansiedadd)\b/gi, 'ansiedad'],
  [/\b(?:soleda|soledadd)\b/gi, 'soledad'],
  [/\b(?:curro|currelo)\b/gi, 'trabajo'],
  [/\b(?:pasta|pelas)\b/gi, 'dinero'],
  [/\b(?:cvitae|curriculun|curriculom)\b/gi, 'curriculum'],
  [/\b(?:parienta|pariente|pariento)\b/gi, 'pareja'],
  [/\b(?:mobbing)\b/gi, 'acoso laboral'],
  [/\b(?:ghosting)\b/gi, 'me ha bloqueado y ha cortado el contacto']
]);

const CHAT_ABBREVIATIONS = Object.freeze({
  'toy':'estoy', 'tngo':'tengo', 'xq':'porque', 'pq':'porque', 'q':'que',
  'k':'que', 'dnd':'donde', 'tb':'tambien', 'tmb':'tambien', 'xfa':'por favor',
  'finde':'fin de semana', 'curro':'trabajo'
});

const SEMANTIC_EXPANSIONS = Object.freeze([
  { when: /\b(?:me rayo|me estoy rayando|no paro de darle vueltas|me come la cabeza)\b/i, add: ' no paro de pensar rumiacion ' },
  { when: /\b(?:me dejo en visto|desaparecio sin decir nada)\b/i, add: ' bloqueo contacto pareja ruptura ' },
  { when: /\b(?:no tengo a nadie|nadie me escucha|nadie me entiende)\b/i, add: ' soledad no tengo con quien hablar ' },
  { when: /\b(?:no puedo con todo|estoy al limite|estoy desbordad[oa])\b/i, add: ' desbordamiento ansiedad gestion emocional ' },
  { when: /\b(?:me echan de casa|me van a echar de casa)\b/i, add: ' vivienda alquiler dinero ' },
  { when: /\b(?:no me llega|no llego)\b.*\b(?:mes|sueldo|dinero)\b/i, add: ' no llego a fin de mes dinero ' },
  { when: /\b(?:me han echado|me echaron|me despidieron)\b.*\b(?:trabajo|curro)?\b/i, add: ' me han despedido trabajo ' },
  { when: /\b(?:se ha muerto|ha fallecido|perdi)\b.*\b(?:madre|padre|hermano|hermana|pareja|amigo|amiga|familiar|persona|perro|gato|mascota)\b/i, add: ' duelo perdida ha muerto alguien que quiero ' },
  { when: /\b(?:me controla|me vigila|me amenaza|me humilla)\b/i, add: ' violencia maltrato control pareja ' }
]);

function stripDiacritics(value='') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function collapseRepeatedLetters(value='') {
  return String(value).replace(/([a-záéíóúñ])\1{2,}/gi, '$1$1');
}

function normalizeChatTokens(value='') {
  return String(value).split(/\s+/).map((token) => {
    const plain = stripDiacritics(token.toLowerCase()).replace(/[^a-zñ]/g, '');
    return CHAT_ABBREVIATIONS[plain] || token;
  }).join(' ');
}

export function normalizeHelpLanguage(value='') {
  const original = String(value).slice(0, 500);
  let normalized = collapseRepeatedLetters(original);
  for (const [pattern, replacement] of EXACT_REPLACEMENTS) normalized = normalized.replace(pattern, replacement);
  normalized = normalizeChatTokens(normalized).replace(/\s+/g, ' ').trim();

  let semanticText = normalized;
  for (const rule of SEMANTIC_EXPANSIONS) {
    if (rule.when.test(stripDiacritics(normalized))) semanticText += rule.add;
  }
  semanticText = semanticText.replace(/\s+/g, ' ').trim();

  const plain = stripDiacritics(normalized.toLowerCase());
  const signals = Object.freeze({
    negation: /\b(?:no|nunca|jamas|sin)\b/.test(plain),
    past: /\b(?:antes|hace meses|hace anos|paso|pasado|superado|ya no)\b/.test(plain),
    otherPerson: /\b(?:mi hijo|mi hija|mi pareja|mi amigo|mi amiga|alguien|otra persona|un familiar)\b/.test(plain),
    uncertainty: /\b(?:no se|quizas|puede que|creo que|me parece)\b/.test(plain)
  });

  return Object.freeze({
    original,
    normalized,
    semanticText,
    signals,
    changed: normalized !== original
  });
}

export const LANGUAGE_BRIDGE_VERSION = '2026-09-15-v1';
