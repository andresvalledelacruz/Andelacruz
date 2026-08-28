export const URL_OPPORTUNITY_MAP = Object.freeze({
  '/dinero/tengo-deudas-y-no-se-por-donde-empezar/':{needs:['debt_advice'],intents:[],defaultFlags:[]},
  '/dinero/quiero-reunificar-mis-deudas/':{needs:['debt_advice'],intents:['DEBT_CONSOLIDATION'],defaultFlags:[]},
  '/dinero/necesito-un-prestamo-pero-no-se-si-puedo-permitirmelo/':{needs:[],intents:['LOAN'],defaultFlags:['affordability_checked']},
  '/dinero/necesito-dinero-urgente/':{needs:[],intents:[],defaultFlags:[]},
  '/dinero/no-puedo-pagar-la-vivienda/':{needs:['mortgage_help'],intents:[],defaultFlags:[]},
  '/dinero/me-da-miedo-mirar-mi-cuenta/':{needs:[],intents:[],defaultFlags:[]},
  '/dinero/en-casa-discutimos-por-dinero/':{needs:['couples_support'],intents:[],defaultFlags:[]},
  '/trabajo/me-han-despedido-y-no-se-que-hacer/':{needs:['find_job','labor_legal'],intents:[],defaultFlags:[]},
  '/trabajo/quiero-encontrar-trabajo-cuanto-antes/':{needs:['find_job'],intents:[],defaultFlags:[]},
  '/trabajo/mi-curriculum-no-funciona/':{needs:['cv_help'],intents:[],defaultFlags:[]},
  '/trabajo/hago-entrevistas-pero-no-me-contratan/':{needs:['interview_help'],intents:[],defaultFlags:[]},
  '/trabajo/necesito-formacion-para-encontrar-trabajo/':{needs:['training_gap'],intents:[],defaultFlags:['market_evidence']},
  '/trabajo/odio-mi-trabajo-pero-no-puedo-dejarlo/':{needs:['find_job'],intents:[],defaultFlags:[]},
  '/trabajo/mi-jefe-me-hace-la-vida-imposible/':{needs:['labor_legal'],intents:[],defaultFlags:[]}
});

export function getOpportunityContext(pathname) {
  return URL_OPPORTUNITY_MAP[pathname] || { needs:[], intents:[], defaultFlags:[] };
}
