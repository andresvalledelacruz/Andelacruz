// Deliberately local and bounded: no query leaves the page or enters a URL.
export function normalizeHelpText(value = '') {
  return String(value).slice(0,500).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
}
const topics = {
  duelo: ['وفاة','حزن','ميراث','duelo','fallecimiento','herencia','repatriacion','grief','bereavement','inheritance','deuil','deces','succession','luto','falecimento','heranca','trauer','todesfall','erbschaft'],
  empleo: ['عمل','العمل','خدمة','الخدمة','بطالة','خدام','trabajo','trabjo','travajo','chamba','jale','laburo','pega','curro','despedido','desempleo','paro','sueldo','cesantia','job','work','unemployed','fired','redundant','salary','benefits','emploi','travail','chomage','licenciement','emprego','trabalho','desemprego','arbeit','arbeitslos','kundigung','gehalt'],
  vivienda: ['سكن','السكن','كراء','الكرا','الكراء','تشرد','alquiler','alqiler','renta','arriendo','vivienda','desahucio','housing','rent','eviction','homeless','logement','loyer','expulsion','habitacao','arrendamento','despejo','miete','wohnung','obdachlos','raumung'],
  infancia: ['طفل','اطفال','الاطفال','مدرسة','hijo','hija','nino','nina','chamaco','escuela','bullying','familia','divorcio','child','children','kid','family','school','divorce','enfant','famille','ecole','crianca','filho','escola','kind','kinder','familie','schule'],
  salud: ['صحة','الصحة','طبيب','الطبيب','مستشفي','salud','medico','enfermedad','hospital','health','doctor','illness','care','sante','maladie','medecin','saude','doenca','gesundheit','krankheit','arzt'],
  emocional: ['قلق','وحدة','بوحدي','حزين','ansiedad','angustia','solo','sola','soledad','adiccion','anxiety','lonely','loneliness','anxious','overwhelmed','addiction','anxiete','solitude','angoisse','ansiedade','solidao','einsam','einsamkeit','angst','sucht'],
  consumo: ['ديون','دين','نصب','deuda','deudas','estafa','consumidor','banco','debt','debts','scam','consumer','bank','dette','arnaque','consommateur','banque','divida','burla','consumidor','schulden','betrug','verbraucher'],
  discapacidad: ['اعاقة','discapacidad','dependencia','disability','disabled','handicap','deficiencia','dependencia','behinderung'],
  refugio: ['هجرة','الهجرة','لجوء','اللجوء','اقامة','الاقامة','اوراق','الوراق','migracion','refugiado','asilo','residencia','immigration','refugee','asylum','residence','asile','refugie','imigracao','refugiado','flucht','asyl','migration'],
  igualdad: ['عنف','العنف','ضرب','كيضربني','اعتداء','violencia','maltrato','abuso','violence','abuse','abused','abusive','violencia','agression','gewalt','missbrauch'],
  social: ['مساعدة','المساعدة','ماكلة','الماكلة','طعام','جوع','ayuda','alimentos','comida','pobreza','pension','support','food','poverty','pension','aide','alimentation','apoio','alimentos','hilfe','armut','lebensmittel']
};
export function findHelpTopics(value) {
  const text=normalizeHelpText(value);const words=new Set(text.split(' '));
  const categories=Object.entries(topics).filter(([,terms])=>terms.some(t=>words.has(t))).map(([id])=>id);
  // This exposes an official safety route; it never diagnoses intent or dismisses negation.
  const arabicSafety=/(?:انتحار|ننتحر|نتحر|اقتل نفسي|نقتل راسي|نموت|بغيت نموت|ما بغيتش نعيش|مابغيتش نعيش|اذي نفسي|خطر|عنف|كيضربني|ضربني|اغتصاب)/.test(text);
  const safety=arabicSafety||/\b(suicid\w*|suizid\w*|selbstmord|selbsttotung|umbringen|sterben|missbrauch|gewalt|suisid\w*|sucid\w*|matar\w*|morir\w*|kill|die|dying|overdose|danger|peligro|perigo|meurtre|mourir|tuer|sobredosis|viol\w*|abus\w*)\b/.test(text)||/\b(me pega|me esta pegando|no quiero vivir|no puedo seguir|end my life|hurt myself|end it all|en finir|nao quero viver|me machucar|ich will nicht mehr leben|ich will mich umbringen|ich mochte sterben)\b/.test(text);
  return Object.freeze({categories:Object.freeze(categories),safety,needsClarification:categories.length===0,raw_query_retained:false});
}
