// Deliberately local and bounded: no query leaves the page or enters a URL.
export function normalizeHelpText(value = '') {
  return String(value).slice(0,500).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}
const topics = {
  duelo: ['duelo','fallecimiento','herencia','repatriacion','grief','bereavement','inheritance','deuil','deces','succession','luto','falecimento','heranca'],
  empleo: ['trabajo','trabjo','travajo','chamba','jale','laburo','pega','curro','despedido','desempleo','paro','sueldo','cesantia','job','work','unemployed','fired','redundant','salary','benefits','emploi','travail','chomage','licenciement','emprego','trabalho','desemprego'],
  vivienda: ['alquiler','alqiler','renta','arriendo','vivienda','desahucio','housing','rent','eviction','homeless','logement','loyer','expulsion','habitacao','arrendamento','despejo'],
  infancia: ['hijo','hija','nino','nina','chamaco','escuela','bullying','familia','divorcio','child','children','kid','family','school','divorce','enfant','famille','ecole','crianca','filho','escola'],
  salud: ['salud','medico','enfermedad','hospital','health','doctor','illness','care','sante','maladie','medecin','saude','doenca'],
  emocional: ['ansiedad','angustia','solo','sola','soledad','adiccion','anxiety','lonely','loneliness','anxious','overwhelmed','addiction','anxiete','solitude','angoisse','ansiedade','solidao'],
  consumo: ['deuda','deudas','estafa','consumidor','banco','debt','debts','scam','consumer','bank','dette','arnaque','consommateur','banque','divida','burla','consumidor'],
  discapacidad: ['discapacidad','dependencia','disability','disabled','handicap','deficiencia','dependencia'],
  refugio: ['migracion','refugiado','asilo','residencia','immigration','refugee','asylum','residence','asile','refugie','imigracao','refugiado'],
  igualdad: ['violencia','maltrato','abuso','violence','abuse','abused','abusive','violencia','agression'],
  social: ['ayuda','alimentos','comida','pobreza','pension','support','food','poverty','pension','aide','alimentation','apoio','alimentos']
};
export function findHelpTopics(value) {
  const text=normalizeHelpText(value);const words=new Set(text.split(' '));
  const categories=Object.entries(topics).filter(([,terms])=>terms.some(t=>words.has(t))).map(([id])=>id);
  // This exposes an official safety route; it never diagnoses intent or dismisses negation.
  const safety=/\b(suicid\w*|suisid\w*|sucid\w*|matar\w*|morir\w*|kill|die|dying|overdose|danger|peligro|perigo|meurtre|mourir|tuer|sobredosis|viol\w*|abus\w*)\b/.test(text)||/\b(me pega|me esta pegando|no quiero vivir|no puedo seguir|end my life|hurt myself|end it all|en finir|nao quero viver|me machucar)\b/.test(text);
  return Object.freeze({categories:Object.freeze(categories),safety,needsClarification:categories.length===0,raw_query_retained:false});
}
