import { recommendFromSituation } from './recommendation-bridge.mjs';
import { findEligiblePartners, PARTNERS } from './partners.mjs';
import { applyLearningPolicy } from './learning-policy.mjs';

const OWN_CONTENT = Object.freeze({
  financial_practical:['/dinero/','/dinero/tengo-deudas-y-no-se-por-donde-empezar/','/dinero/no-llego-a-fin-de-mes/'],
  work_career:['/trabajo/','/trabajo/quiero-encontrar-trabajo-cuanto-antes/','/trabajo/mi-curriculum-no-funciona/'],
  legal_mediation:['/trabajo/mi-jefe-me-hace-la-vida-imposible/','/familia/'],
  clinical_review:['/soledad/','/rupturas/','/familia/'],
  relationship_family:['/familia/','/rupturas/'],
  social_community:['/soledad/'],
  wellbeing_habits:['/soledad/','/trabajo/no-puedo-mas-en-el-trabajo/'],
  emotional_support:['/']
});

const OFFICIAL_RESOURCES = Object.freeze({
  financial_practical:[{id:'bde',label:'Banco de España',type:'official'},{id:'social_services',label:'Servicios sociales públicos',type:'official'}],
  work_career:[{id:'sepe',label:'SEPE y servicios públicos de empleo',type:'official'}],
  legal_mediation:[{id:'legal_aid',label:'Orientación jurídica pública/colegial',type:'official'}],
  clinical_review:[{id:'public_health',label:'Sistema público de salud',type:'official'}],
  urgent_safety:[{id:'112',label:'Emergencias 112',type:'official'},{id:'024',label:'Línea 024',type:'official'}]
});

function ownContentFor(situation){
  const route=situation.primary?.id;
  return (OWN_CONTENT[route]||['/']).map(path=>({kind:'own_content',path,priority:80,commercial:false,userValue:90}));
}

function officialFor(situation){
  const route=situation.primary?.id;
  return (OFFICIAL_RESOURCES[route]||[]).map(resource=>({kind:'official_resource',...resource,priority:90,commercial:false,userValue:100}));
}

function freeActionFor(situation){
  const route=situation.primary?.id;
  const labels={
    financial_practical:'Ordenar cifras, urgencias y obligaciones antes de contratar nada',
    work_career:'Definir el siguiente cuello de botella laboral antes de pagar por ayuda',
    social_community:'Dar un primer paso de conexión social antes de asumir una necesidad comercial',
    relationship_family:'Aclarar qué conflicto concreto necesita resolverse',
    clinical_review:'Valorar apoyo profesional adecuado sin autodiagnóstico',
    wellbeing_habits:'Aplicar una medida práctica de autocuidado y observar evolución',
    emotional_support:'Explicar la situación y elegir un siguiente paso pequeño'
  };
  return labels[route]?[{kind:'free_action',label:labels[route],priority:85,commercial:false,userValue:95}]:[];
}

function partnerRecommendations(bridge,{territory='ES',registry=PARTNERS}={}){
  if(!bridge.commercial_action_allowed) return [];
  const out=[];
  for(const opportunity of bridge.eligible){
    const partners=findEligiblePartners({opportunityId:opportunity.id,territory,registry});
    for(const partner of partners){
      out.push({kind:'partner',partnerId:partner.id,partnerName:partner.name,opportunityId:opportunity.id,priority:50,commercial:true,userValue:70,verification:partner.verification,disclosure:partner.disclosure||null});
    }
  }
  return out;
}

function applyLearningToRecommendations(recommendations,learningSignals={}){
  return recommendations.map(rec=>{
    const signal=rec.opportunityId?learningSignals[rec.opportunityId]||{}:{};
    const policyResult=applyLearningPolicy({userValue:rec.userValue,commercial:rec.commercial},signal);
    return {...rec,basePriority:rec.priority,learningAdjustment:policyResult.learningAdjustment,learningStatus:policyResult.learningStatus,priority:Number((rec.priority+policyResult.learningAdjustment).toFixed(2))};
  });
}

export function recommendNextBestActions(input={},options={}){
  const bridge=recommendFromSituation(input);
  if(bridge.situation.safety_override){
    const safetyRecommendations=officialFor(bridge.situation);
    return Object.freeze({version:2,situation:bridge.situation,primary_recommendation:safetyRecommendations[0]||null,recommendations:Object.freeze(safetyRecommendations),commercial_suppressed:true,reason:'safety_first'});
  }
  const base=[...officialFor(bridge.situation),...freeActionFor(bridge.situation),...ownContentFor(bridge.situation),...partnerRecommendations(bridge,options)];
  const recommendations=applyLearningToRecommendations(base,options.learningSignals||{}).sort((a,b)=>b.priority-a.priority || Number(a.commercial)-Number(b.commercial));
  return Object.freeze({
    version:2,
    situation:bridge.situation,
    opportunity_state:Object.freeze({eligible:bridge.eligible,pending:bridge.pending,blocked:bridge.blocked}),
    primary_recommendation:recommendations[0]||null,
    recommendations:Object.freeze(recommendations),
    commercial_suppressed:!bridge.commercial_action_allowed,
    learning_applied:Object.values(options.learningSignals||{}).some(x=>(Number(x.sampleSize)||0)>=10),
    reason:recommendations.length?'ranked_recommendations':'no_recommendation'
  });
}
