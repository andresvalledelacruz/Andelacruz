import { routeHumanNeeds } from './human-needs-router.js';
import { extractIntentContext } from './intent-context-extractor.js';

const ROUTE_PRIORITY = Object.freeze({ urgent_safety:100, legal_mediation:72, financial_practical:68, work_career:64, clinical_review:62, relationship_family:58, social_community:54, grief_transition:52, wellbeing_habits:48, emotional_support:40 });

const ACTIONS = Object.freeze({
  urgent_safety:{kind:'safety',commercial:false,label:'Priorizar seguridad y ayuda urgente'},
  financial_practical:{kind:'practical',commercial:'restricted',label:'Ordenar la situación económica antes de ofrecer productos'},
  work_career:{kind:'practical',commercial:'conditional',label:'Resolver primero la necesidad laboral concreta'},
  legal_mediation:{kind:'professional',commercial:'conditional',label:'Valorar orientación jurídica o mediación acreditada'},
  clinical_review:{kind:'professional',commercial:'conditional',label:'Valorar apoyo profesional acreditado sin diagnosticar'},
  relationship_family:{kind:'support',commercial:'conditional',label:'Orientación relacional o familiar según contexto'},
  social_community:{kind:'support',commercial:'conditional',label:'Priorizar conexión social y comunidad'},
  grief_transition:{kind:'support',commercial:'conditional',label:'Acompañamiento y recursos de duelo'},
  wellbeing_habits:{kind:'support',commercial:false,label:'Hábitos y autorregulación como apoyo, no diagnóstico'},
  emotional_support:{kind:'support',commercial:false,label:'Escucha, experiencias y apoyo emocional'}
});

function dedupeRoutes(base) {
  const all=[base.primary_route,...base.secondary_routes].filter(Boolean);
  return [...new Map(all.map(x=>[x.id,x])).values()];
}

function priorityScore(route, base) {
  const basePoints=Number(route.score)||0;
  const policy=ROUTE_PRIORITY[route.id]||30;
  const urgent=base.urgent_human_review && route.id==='urgent_safety' ? 1000 : 0;
  return urgent + policy + Math.min(basePoints*4,40);
}

export function routeSituation(input={}) {
  const base=routeHumanNeeds(input);
  const intent=extractIntentContext(input);
  const routes=dedupeRoutes(base).map(route=>({
    ...route,
    priority_score:priorityScore(route,base),
    action:ACTIONS[route.id]||{kind:'support',commercial:false,label:'Orientación general'}
  })).sort((a,b)=>b.priority_score-a.priority_score);

  const safetyOverride=base.urgent_human_review;
  const ordered=safetyOverride ? routes.sort((a,b)=>a.id==='urgent_safety'?-1:b.id==='urgent_safety'?1:b.priority_score-a.priority_score) : routes;
  const commercialAllowed=!safetyOverride && !intent.negation.present;

  return Object.freeze({
    version:3,
    diagnostic:false,
    automated_clinical_decision:false,
    safety_override:safetyOverride,
    commercial_allowed:commercialAllowed,
    primary:ordered[0]||null,
    needs:ordered,
    intent_context:intent,
    next_actions:ordered.slice(0,4).map((route,index)=>Object.freeze({order:index+1,route:route.id,...route.action,commercial:commercialAllowed ? route.action.commercial : false})),
    routing_basis:Object.freeze({category:input.category||null,declared_needs:Array.isArray(input.needs)?input.needs:[],multi_need:ordered.length>1,urgency:intent.urgency.level,explicit_commercial_intent:intent.explicit_commercial_intent}),
    explanation:'Ordena varias necesidades simultáneas e incorpora intención explícita, negación, urgencia y contexto. La seguridad prevalece sobre cualquier oportunidad comercial; el sistema no diagnostica ni sustituye profesionales.'
  });
}
