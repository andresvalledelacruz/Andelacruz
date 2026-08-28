const normalize = (value='') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();

const INTENT_PATTERNS = [
  {id:'want',weight:3,terms:['quiero','me gustaria','estoy buscando','busco']},
  {id:'need',weight:4,terms:['necesito','me hace falta','tengo que']},
  {id:'considering',weight:2,terms:['estoy pensando','me planteo','estoy valorando']},
  {id:'offered',weight:2,terms:['me han ofrecido','me ofrecen','tengo una oferta']},
  {id:'already_have',weight:1,terms:['ya tengo','ya estoy','ya uso','ya he contratado']},
  {id:'tried',weight:1,terms:['he probado','ya probe','he intentado','ya intente']}
];

const NEGATIONS = ['no quiero','no necesito','no me interesa','no busco','no pienso','no me planteo'];
const URGENCY = [
  {level:'immediate',terms:['ahora mismo','hoy','esta noche','urgente','ya']},
  {level:'near_term',terms:['esta semana','este mes','en unos dias','antes de fin de mes']}
];

const TOPICS = {
  debt_consolidation:['reunificar','unificar deudas','agrupar deudas'],
  loan:['prestamo','credito','financiacion'],
  psychologist:['psicologo','psicologa','terapia'],
  couples_therapy:['terapia de pareja'],
  lawyer:['abogado','abogada','asesoramiento legal'],
  job:['trabajo','empleo'],
  cv:['curriculum','cv'],
  interview:['entrevista'],
  training:['curso','formacion','certificacion'],
  matchmaking:['encontrar pareja','agencia de citas','matchmaking'],
  social_activity:['conocer gente','hacer amigos','actividades sociales']
};

function matchedTerms(text, terms){ return terms.filter(t=>text.includes(normalize(t))); }

export function extractIntentContext(input={}){
  const text=normalize(`${input.title||''} ${input.story||''}`);
  const intents=[];
  for(const pattern of INTENT_PATTERNS){
    const matched=matchedTerms(text,pattern.terms);
    if(matched.length) intents.push({id:pattern.id,weight:pattern.weight,evidence:matched.slice(0,3)});
  }
  const negated=matchedTerms(text,NEGATIONS);
  let urgency='none';
  const urgencyEvidence=[];
  for(const rule of URGENCY){
    const matched=matchedTerms(text,rule.terms);
    if(matched.length){ urgency=rule.level; urgencyEvidence.push(...matched); break; }
  }
  const topics=[];
  for(const [id,terms] of Object.entries(TOPICS)){
    const matched=matchedTerms(text,terms);
    if(matched.length) topics.push({id,evidence:matched.slice(0,3)});
  }

  const explicitCommercialIntent = topics.filter(topic => ['debt_consolidation','loan','psychologist','couples_therapy','lawyer','cv','interview','training','matchmaking'].includes(topic.id))
    .filter(() => intents.some(i=>['want','need','considering','offered'].includes(i.id)))
    .filter(() => negated.length===0)
    .map(x=>x.id);

  return Object.freeze({
    version:1,
    intents:Object.freeze(intents),
    topics:Object.freeze(topics),
    negation:Object.freeze({present:negated.length>0,evidence:negated}),
    urgency:Object.freeze({level:urgency,evidence:urgencyEvidence}),
    explicit_commercial_intent:Object.freeze([...new Set(explicitCommercialIntent)]),
    has_prior_attempt:intents.some(i=>i.id==='tried'),
    has_existing_solution:intents.some(i=>i.id==='already_have'),
    has_received_offer:intents.some(i=>i.id==='offered'),
    explanation:'Solo se marca intención comercial cuando existe lenguaje explícito de deseo, necesidad, consideración u oferta; la negación la bloquea.'
  });
}
