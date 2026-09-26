// Deliberately bounded corrections: never fuzzy-match short words or negation.
// Keep this dictionary explicit and reviewable: the goal is to understand likely
// human spelling/phonetic variants without silently rewriting ambiguous language.
const CORRECTIONS = Object.freeze({
  q: 'que', k: 'que', xq: 'porque', pq: 'porque', qiero: 'quiero', kiero: 'quiero',

  // Trabajo / empleo
  travajo: 'trabajo', trabjo: 'trabajo', trbajo: 'trabajo', trabago: 'trabajo',
  trabajp: 'trabajo', trvajo: 'trabajo', curro: 'trabajo', currelo: 'trabajo',
  currar: 'trabajar', currando: 'trabajando', currela: 'trabajador',
  despidido: 'despedido', despedio: 'despedido', despedidoo: 'despedido',
  echao: 'echado', hechado: 'echado',

  // Relaciones y apoyo social
  coleguis: 'amigos', amiwos: 'amigos', hamigos: 'amigos',
  famila: 'familia', familiaa: 'familia',
  soleda: 'soledad', soledat: 'soledad', solrdad: 'soledad',
  rutura: 'ruptura', rupturra: 'ruptura', ruptrua: 'ruptura',

  // Emoción / ansiedad
  agobiao: 'agobiado', agovia: 'agobia', agovio: 'agobio', quemao: 'quemado',
  ansieda: 'ansiedad', anciedad: 'ansiedad', anxiedad: 'ansiedad', ansiedat: 'ansiedad',
  ansieddad: 'ansiedad', angustiao: 'angustiado', angustiadaa: 'angustiada',
  emocionl: 'emocional', emocinal: 'emocional', desbordao: 'desbordado',

  // Dinero / vivienda
  alkiler: 'alquiler', alqiler: 'alquiler', arquiler: 'alquiler',
  alquier: 'alquiler', alquler: 'alquiler',
  deudad: 'deudas', deudaz: 'deudas', deuds: 'deudas', deudaas: 'deudas',
  hipteca: 'hipoteca', ipoteca: 'hipoteca', hipotecaa: 'hipoteca', prestmo: 'prestamo',
  prestammo: 'prestamo', curriculun: 'curriculum', curriclum: 'curriculum',

  // Ayuda / urgencia
  aiuda: 'ayuda', alluda: 'ayuda', urjente: 'urgente', urguente: 'urgente',
  peligor: 'peligro',

  // Safety: suicide/self-harm and violence variants are explicit so misspelling
  // cannot make a high-risk disclosure fall through to an ordinary route.
  suicidame: 'suicidarme', sucidarme: 'suicidarme', suisidarme: 'suicidarme',
  suizidarme: 'suicidarme', suicidarrme: 'suicidarme',
  sucidio: 'suicidio', suisidio: 'suicidio', suizidio: 'suicidio', suicidioo: 'suicidio',
  sucidarse: 'suicidarse', suisidarse: 'suicidarse', suizidarse: 'suicidarse',
  sucido: 'suicido', suisido: 'suicido',
  matarrme: 'matarme', morirr: 'morir',
  maltratto: 'maltrato', maltratta: 'maltrata', maltrto: 'maltrato',
  maltratao: 'maltratado', violensia: 'violencia', biolencia: 'violencia',
  agression: 'agresion', agrecion: 'agresion', agreison: 'agresion', agrecionsexual: 'agresionsexual'
});

export function normalizeSearchText(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim().split(/\s+/)
    .map((token) => CORRECTIONS[token] || token).join(' ');
}
