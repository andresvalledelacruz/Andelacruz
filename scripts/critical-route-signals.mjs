export const CRITICAL_PATH_HINTS = [
  /suicid/i,
  /agresion-sexual/i,
  /maltrat/i,
  /violencia/i,
  /ayuda-urgente/i,
  /sobredosis/i,
  /abstinencia/i,
  /(?:^|\/)trata(?:-de-personas)?(?:\/|-|$)/i,
  /coaccion/i,
  /secuestro/i,
  /desahucio/i,
  /sin-hogar/i,
  /persona-vulnerable/i,
  /menor-en-riesgo/i,
  /desastre/i,
  /catastrofe/i,
];

export function isCriticalRoutePath(route) {
  return CRITICAL_PATH_HINTS.some((pattern) => pattern.test(route));
}
