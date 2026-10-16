import { readFile } from 'node:fs/promises';

export async function loadSearchConsoleSnapshot(path) {
  if (!path) return null;
  try {
    const content = await readFile(path, 'utf8');
    if (content.length > 16384) return null;
    return JSON.parse(content);
  } catch { return null; }
}

export function validateSearchConsoleSnapshot(snapshot, now = new Date()) {
  const dateOnly = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  try {
    if (snapshot?.source !== 'google_search_console' || snapshot.property !== 'sc-domain:desgracias.es' || snapshot.search_type !== 'web') return null;
    const { from, to } = snapshot.period || {};
    if (!dateOnly(from) || !dateOnly(to) || from > to || to > now.toISOString().slice(0, 10)) return null;
    if (typeof snapshot.exported_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(snapshot.exported_at) || !dateOnly(snapshot.exported_at.slice(0, 10)) || !Number.isFinite(Date.parse(snapshot.exported_at)) || Date.parse(snapshot.exported_at) > now.getTime() || snapshot.exported_at.slice(0, 10) < to) return null;
    if (!Number.isSafeInteger(snapshot.clicks) || !Number.isSafeInteger(snapshot.impressions) || snapshot.clicks < 0 || snapshot.impressions < 0 || snapshot.clicks > snapshot.impressions) return null;
    return { clicks: snapshot.clicks, impressions: snapshot.impressions, period: { from, to }, exported_at: snapshot.exported_at };
  } catch { return null; }
}

// Only aggregate counters leave the database; no paths, stories or contact data.
export async function readBusinessMetrics(pool, now = new Date(), { searchConsoleSnapshot } = {}) {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 7);
  const blocked = reason => ({ value: null, status: 'BLOQUEADO', reason });
  const report = {
    generated_at: now.toISOString(),
    window: { from: start.toISOString().slice(0, 10), to_exclusive: end.toISOString().slice(0, 10), timezone: 'UTC', days: 7 },
    coverage: 'partial',
    limitations: ['Páginas vistas registradas; no personas, sesiones ni visitas totales.', 'Las pruebas no se pueden separar de estos contadores.', 'Cobertura parcial: ausencia de registros no demuestra ausencia de tráfico.'],
    pageviews: blocked('database_not_configured'),
    impressions: blocked('search_console_not_connected'),
    clicks: blocked('search_console_not_connected'),
    requests: blocked('professional_requests_source_not_verified'),
    leads: blocked('professional_leads_source_not_verified'),
    conversions: blocked('conversion_source_not_verified'),
    revenue: blocked('revenue_source_not_verified')
  };
  const seo = validateSearchConsoleSnapshot(searchConsoleSnapshot, now);
  if (seo) {
    for (const key of ['impressions', 'clicks']) report[key] = { value: seo[key], status: 'REGISTRADO', source: 'google_search_console', period: seo.period, exported_at: seo.exported_at, refresh: 'manual' };
  }
  if (!pool) return report;
  try {
    const { rows } = await pool.query(
      `select sum(pageviews)::text as pageviews, count(distinct day)::int as days_with_data
       from public.pageview_daily_analytics where day >= $1::date and day < $2::date`,
      [report.window.from, report.window.to_exclusive]
    );
    const row = rows[0];
    if (row?.pageviews == null) {
      report.pageviews = blocked('no_records_in_window');
    } else {
      if (typeof row.pageviews !== 'string' || !/^\d+$/.test(row.pageviews)) throw new Error('invalid_aggregate');
      const value = Number(row.pageviews);
      const days = Number(row.days_with_data);
      if (!Number.isSafeInteger(value) || value < 0 || !Number.isInteger(days) || days < 1 || days > 7) throw new Error('invalid_aggregate');
      report.pageviews = { value, status: 'REGISTRADO', source: 'public.pageview_daily_analytics', days_with_data: days };
    }
  } catch {
    report.pageviews = blocked('pageview_source_unavailable');
  }
  return report;
}
