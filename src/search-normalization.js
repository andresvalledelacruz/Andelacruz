// Deliberately bounded corrections: never fuzzy-match short words or negation.
const CORRECTIONS = Object.freeze({
  q: 'que', k: 'que', xq: 'porque', pq: 'porque',
  travajo: 'trabajo', trabjo: 'trabajo', curro: 'trabajo', currelo: 'trabajo',
  currar: 'trabajar', currando: 'trabajando', currela: 'trabajador',
  coleguis: 'amigos', amiwos: 'amigos', hamigos: 'amigos',
  agobiao: 'agobiado', quemao: 'quemado',
  alkiler: 'alquiler', alqiler: 'alquiler', arquiler: 'alquiler',
  deudad: 'deudas', deudaz: 'deudas', despidido: 'despedido', despedio: 'despedido',
  hipteca: 'hipoteca', ipoteca: 'hipoteca', prestmo: 'prestamo',
  curriculun: 'curriculum', curriclum: 'curriculum',
  suicidame: 'suicidarme', sucidarme: 'suicidarme', suisidarme: 'suicidarme',
  sucidio: 'suicidio', suisidio: 'suicidio',
  sucidarse: 'suicidarse', suisidarse: 'suicidarse',
  sucido: 'suicido', suisido: 'suicido',
  maltratto: 'maltrato', maltratta: 'maltrata',
  agression: 'agresion', agrecion: 'agresion', agreison: 'agresion'
});

export function normalizeSearchText(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim().split(/\s+/)
    .map((token) => CORRECTIONS[token] || token).join(' ');
}
