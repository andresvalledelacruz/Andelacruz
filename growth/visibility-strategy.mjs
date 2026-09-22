export const VISIBILITY_PRINCIPLES = Object.freeze([
  'people_first','original_value','no_scaled_thin_content','no_site_reputation_abuse','clear_authorship_boundaries',
  'trust_pages_visible','internal_links_contextual','commercial_content_disclosed','high_risk_official_sources_first',
  'story_examples_disclosed','no_keyword_stuffing','no_fake_reviews','no_fake_metrics','canonical_consistency',
  'structured_data_matches_visible_content','index_only_complete_pages','update_dates_only_when_content_changes',
  'search_intent_before_volume','mobile_first','accessibility_is_visibility'
]);

export const GROWTH_CLUSTERS = Object.freeze([
  {id:'employment',label:'Trabajo y empleo',risk:'low_to_medium',commercial:['JOB_SEARCH','CV_SERVICE','INTERVIEW_COACHING','TRAINING']},
  {id:'household_savings',label:'Ahorro doméstico',risk:'low_to_medium',commercial:['ENERGY_SWITCH','TELECOM_SWITCH','HOME_SERVICES']},
  {id:'social_connection',label:'Conexión social',risk:'medium',commercial:['SOCIAL_ACTIVITIES']},
  {id:'relationships',label:'Relaciones',risk:'medium',commercial:[]},
  {id:'family',label:'Familia',risk:'medium_to_high',commercial:[]},
  {id:'grief',label:'Duelo',risk:'medium_to_high',commercial:[]},
  {id:'money_guidance',label:'Dinero y deudas',risk:'medium_to_high',commercial:[]},
  {id:'trust',label:'Metodología, transparencia y seguridad',risk:'none',commercial:[]},
  {id:'stories',label:'Relatos orientativos y experiencias',risk:'contextual',commercial:[]},
  {id:'b2b',label:'Colaboradores y profesionales',risk:'none',commercial:[]}
]);

export const GROWTH_SITEMAP_ROUTES = Object.freeze([
  '/historias/','/soluciones/','/colaborar/','/metodologia.html','/media-kit.html'
]);

export function clusterForOpportunity(opportunityId) {
  return GROWTH_CLUSTERS.find(cluster => cluster.commercial.includes(opportunityId)) || null;
}

export function shouldIndexGrowthPage({complete=false,canonical=false,description=false,h1=false,jsonLd=false,disclosed=true}={}) {
  return Boolean(complete && canonical && description && h1 && jsonLd && disclosed);
}
