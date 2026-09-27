import { normalizeSnapshot, summarize } from './private-analytics-report.mjs';

export function summarizeAcquisition(input, days = 7) {
  if (![7, 30].includes(days)) throw new Error('El periodo debe ser de 7 o 30 días.');
  const snapshot = normalizeSnapshot(input);
  const summary = summarize(snapshot, days);
  const reserved = new Set(['direct', 'internal', 'unknown']);
  const externalHosts = summary.referrers.filter(([host]) => !reserved.has(host));
  const external = externalHosts.reduce((sum, [, count]) => sum + count, 0);
  const count = name => summary.referrers.find(([host]) => host === name)?.[1] ?? 0;
  return {
    generatedAt: snapshot.generated_at,
    days,
    total: summary.total,
    daysWithData: summary.daysWithData,
    external,
    internal: count('internal'),
    direct: count('direct'),
    unknown: count('unknown'),
    externalHosts,
  };
}

export function formatAcquisition(summary) {
  const fmt = value => value.toLocaleString('es-ES');
  const share = value => summary.total ? (100 * value / summary.total).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' %' : 'No calculable';
  return [
    `Procedencia de páginas vistas registradas · ${summary.days} días UTC`,
    `Exportación: ${summary.generatedAt}`,
    `Días con registros: ${summary.daysWithData} de ${summary.days}`,
    `Total: ${fmt(summary.total)} páginas vistas (no personas ni sesiones)`,
    `Referencia externa: ${fmt(summary.external)} (${share(summary.external)})`,
    `Navegación interna: ${fmt(summary.internal)} (${share(summary.internal)})`,
    `Directa o referencia no enviada: ${fmt(summary.direct)} (${share(summary.direct)})`,
    `Procedencia desconocida: ${fmt(summary.unknown)} (${share(summary.unknown)})`,
    'Hosts externos con más páginas vistas registradas:',
    ...summary.externalHosts.slice(0, 10).map(([host, count]) => `  ${host}: ${fmt(count)}`),
    'La referencia externa indica el origen informado para una página vista; no mide adquisición de personas.',
    'La cobertura de páginas es parcial y las pruebas internas no se pueden separar de las visitas reales.',
  ].join('\n');
}
