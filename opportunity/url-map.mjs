export const URL_OPPORTUNITY_MAP = Object.freeze({
  '/':{domain:'core',needs:[],intents:[],opportunities:[],risk:'contextual',consent:'contextual',commercialPolicy:'contextual',defaultFlags:[]},
  '/sobre.html':{domain:'core',needs:[],intents:[],opportunities:[],risk:'none',consent:'none',commercialPolicy:'off',defaultFlags:[]},
  '/como-revisamos.html':{domain:'core',needs:[],intents:[],opportunities:[],risk:'none',consent:'none',commercialPolicy:'off',defaultFlags:[]},
  '/privacidad.html':{domain:'core',needs:[],intents:[],opportunities:[],risk:'none',consent:'none',commercialPolicy:'off',defaultFlags:[]},

  '/rupturas/':{domain:'relationships',needs:['relationship_support'],intents:[],opportunities:['RELATIONSHIP_SUPPORT','PSYCHOLOGY'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/rupturas/mi-pareja-me-ha-dejado/':{domain:'relationships',needs:['relationship_support'],intents:[],opportunities:['RELATIONSHIP_SUPPORT','PSYCHOLOGY','MATCHMAKING'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:['matchmaking_explicit_intent_only']},
  '/rupturas/no-puedo-dejar-de-pensar-en-mi-ex/':{domain:'relationships',needs:['relationship_support'],intents:[],opportunities:['PSYCHOLOGY','RELATIONSHIP_SUPPORT'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/rupturas/mi-ex-me-ha-bloqueado/':{domain:'relationships',needs:['relationship_support'],intents:[],opportunities:['RELATIONSHIP_SUPPORT','PSYCHOLOGY'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},

  '/soledad/':{domain:'social',needs:['social_connection'],intents:[],opportunities:['SOCIAL_ACTIVITIES','PSYCHOLOGY','MATCHMAKING'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:['matchmaking_explicit_intent_only']},
  '/soledad/me-siento-solo/':{domain:'social',needs:['social_connection'],intents:[],opportunities:['SOCIAL_ACTIVITIES','PSYCHOLOGY','MATCHMAKING'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:['matchmaking_explicit_intent_only']},
  '/soledad/no-tengo-con-quien-hablar/':{domain:'social',needs:['social_connection'],intents:[],opportunities:['SOCIAL_ACTIVITIES','PSYCHOLOGY'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/soledad/me-siento-solo-aunque-tengo-gente/':{domain:'social',needs:['emotional_support'],intents:[],opportunities:['PSYCHOLOGY','SOCIAL_ACTIVITIES'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/soledad/no-tengo-amigos/':{domain:'social',needs:['social_connection'],intents:[],opportunities:['SOCIAL_ACTIVITIES','PSYCHOLOGY','MATCHMAKING'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:['matchmaking_explicit_intent_only']},
  '/soledad/me-siento-solo-por-la-noche/':{domain:'social',needs:['emotional_support'],intents:[],opportunities:['PSYCHOLOGY','SOCIAL_ACTIVITIES'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},

  '/familia/':{domain:'family',needs:['family_support'],intents:[],opportunities:['FAMILY_THERAPY','FAMILY_MEDIATION','PSYCHOLOGY'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/familia/mi-familia-no-me-habla/':{domain:'family',needs:['family_support'],intents:[],opportunities:['FAMILY_MEDIATION','FAMILY_THERAPY','PSYCHOLOGY'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/familia/siento-que-mi-familia-no-me-quiere/':{domain:'family',needs:['emotional_support','family_support'],intents:[],opportunities:['PSYCHOLOGY','FAMILY_THERAPY'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/familia/necesito-poner-limites-a-mi-familia/':{domain:'family',needs:['family_support'],intents:[],opportunities:['PSYCHOLOGY','FAMILY_THERAPY','FAMILY_MEDIATION'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/familia/vivo-con-mi-familia-y-no-aguanto-mas/':{domain:'family',needs:['family_support'],intents:[],opportunities:['FAMILY_THERAPY','PSYCHOLOGY','FAMILY_MEDIATION'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/familia/mi-madre-o-mi-padre-no-me-habla/':{domain:'family',needs:['family_support'],intents:[],opportunities:['FAMILY_MEDIATION','FAMILY_THERAPY','PSYCHOLOGY'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},

  '/trabajo-dinero/':{domain:'work_money',needs:[],intents:[],opportunities:['JOB_SEARCH','LEGAL_LABOR','DEBT_ADVICE','PSYCHOLOGY'],risk:'contextual',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/trabajo/':{domain:'work',needs:[],intents:[],opportunities:['JOB_SEARCH','CV_SERVICE','INTERVIEW_COACHING','TRAINING','LEGAL_LABOR','PSYCHOLOGY'],risk:'contextual',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/trabajo/no-puedo-mas-en-el-trabajo/':{domain:'work',needs:['work_stress'],intents:[],opportunities:['PSYCHOLOGY','LEGAL_LABOR','JOB_SEARCH'],risk:'high',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/trabajo/no-consigo-desconectar-del-trabajo/':{domain:'work',needs:['work_stress'],intents:[],opportunities:['PSYCHOLOGY','LEGAL_LABOR'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/trabajo/me-han-despedido-y-no-se-que-hacer/':{domain:'work',needs:['find_job','labor_legal'],intents:[],opportunities:['JOB_SEARCH','LEGAL_LABOR','CV_SERVICE','TRAINING'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/trabajo/quiero-encontrar-trabajo-cuanto-antes/':{domain:'work',needs:['find_job'],intents:[],opportunities:['JOB_SEARCH','CV_SERVICE','INTERVIEW_COACHING','TRAINING'],risk:'low',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/trabajo/mi-curriculum-no-funciona/':{domain:'work',needs:['cv_help'],intents:[],opportunities:['CV_SERVICE','JOB_SEARCH','INTERVIEW_COACHING'],risk:'low',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/trabajo/hago-entrevistas-pero-no-me-contratan/':{domain:'work',needs:['interview_help'],intents:[],opportunities:['INTERVIEW_COACHING','JOB_SEARCH','TRAINING','PSYCHOLOGY'],risk:'low',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/trabajo/necesito-formacion-para-encontrar-trabajo/':{domain:'work',needs:['training_gap'],intents:[],opportunities:['TRAINING','JOB_SEARCH'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:['market_evidence']},
  '/trabajo/odio-mi-trabajo-pero-no-puedo-dejarlo/':{domain:'work',needs:['find_job','financial_transition'],intents:[],opportunities:['JOB_SEARCH','CV_SERVICE','TRAINING','PSYCHOLOGY','DEBT_ADVICE'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/trabajo/mi-jefe-me-hace-la-vida-imposible/':{domain:'work',needs:['labor_legal','work_stress'],intents:[],opportunities:['LEGAL_LABOR','PSYCHOLOGY','JOB_SEARCH'],risk:'high',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/trabajo/tengo-miedo-de-equivocarme-en-el-trabajo/':{domain:'work',needs:['work_stress'],intents:[],opportunities:['PSYCHOLOGY','LEGAL_LABOR','TRAINING'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},

  '/dinero/':{domain:'money',needs:[],intents:[],opportunities:['DEBT_ADVICE','DEBT_CONSOLIDATION','LOAN','MORTGAGE_HELP','INSOLVENCY_LEGAL'],risk:'contextual',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/dinero/no-llego-a-fin-de-mes/':{domain:'money',needs:['budget_gap'],intents:[],opportunities:['DEBT_ADVICE','ENERGY_SWITCH','TELECOM_SWITCH'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/dinero/necesito-dinero-urgente/':{domain:'money',needs:['urgent_cash_gap'],intents:[],opportunities:['DEBT_ADVICE','LOAN'],risk:'high',consent:'before_lead',commercialPolicy:'restricted',defaultFlags:['loan_explicit_intent_only','affordability_required']},
  '/dinero/tengo-deudas-y-no-se-por-donde-empezar/':{domain:'money',needs:['debt_advice'],intents:[],opportunities:['DEBT_ADVICE','DEBT_CONSOLIDATION','INSOLVENCY_LEGAL'],risk:'high',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:['consolidation_explicit_intent_only']},
  '/dinero/quiero-reunificar-mis-deudas/':{domain:'money',needs:['debt_advice'],intents:['DEBT_CONSOLIDATION'],opportunities:['DEBT_CONSOLIDATION','DEBT_ADVICE','INSOLVENCY_LEGAL'],risk:'high',consent:'before_lead',commercialPolicy:'restricted',defaultFlags:['compare_total_cost','partner_verification_required']},
  '/dinero/necesito-un-prestamo-pero-no-se-si-puedo-permitirmelo/':{domain:'money',needs:['affordability_check'],intents:['LOAN'],opportunities:['LOAN','DEBT_ADVICE'],risk:'high',consent:'before_lead',commercialPolicy:'restricted',defaultFlags:['affordability_checked','partner_verification_required']},
  '/dinero/no-puedo-pagar-la-vivienda/':{domain:'money',needs:['mortgage_help','housing_protection'],intents:[],opportunities:['MORTGAGE_HELP','DEBT_ADVICE','INSOLVENCY_LEGAL'],risk:'high',consent:'before_lead',commercialPolicy:'restricted',defaultFlags:['essential_housing_first']},
  '/dinero/me-da-miedo-mirar-mi-cuenta/':{domain:'money',needs:['financial_avoidance'],intents:[],opportunities:['DEBT_ADVICE','PSYCHOLOGY'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/dinero/en-casa-discutimos-por-dinero/':{domain:'money_family',needs:['couples_support','financial_conflict'],intents:[],opportunities:['COUPLES_THERAPY','FAMILY_MEDIATION','DEBT_ADVICE','PSYCHOLOGY'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:['mediation_not_for_active_abuse']},

  '/duelo/':{domain:'grief',needs:['grief_support'],intents:[],opportunities:['PSYCHOLOGY'],risk:'contextual',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]},
  '/duelo/ha-muerto-alguien-que-quiero-y-no-se-como-seguir/':{domain:'grief',needs:['grief_support'],intents:[],opportunities:['PSYCHOLOGY'],risk:'medium',consent:'before_lead',commercialPolicy:'contextual',defaultFlags:[]}
});

export const EXPECTED_PRODUCTION_URL_COUNT = 43;

export function getOpportunityContext(pathname) {
  return URL_OPPORTUNITY_MAP[pathname] || { domain:'unknown', needs:[], intents:[], opportunities:[], risk:'unknown', consent:'none', commercialPolicy:'off', defaultFlags:[] };
}

export function mappedUrlCount() {
  return Object.keys(URL_OPPORTUNITY_MAP).length;
}
