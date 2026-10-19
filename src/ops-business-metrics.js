import { open } from 'node:fs/promises';

const MAX_SNAPSHOT_BYTES = 16 * 1024;

export async function loadSearchConsoleSnapshot(path) {
  if (!path) return null;
  let handle;
  try {
    handle = await open(path, 'r');
    if (!(await handle.stat()).isFile()) return null;
    // Read at most one byte beyond the limit, even if the file grows after stat.
    const buffer = Buffer.alloc(MAX_SNAPSHOT_BYTES + 1);
    let total = 0;
    while (total < buffer.length) {
      const { bytesRead } = await handle.read(buffer, total, buffer.length - total, null);
      if (bytesRead === 0) break;
      total += bytesRead;
    }
    if (total > MAX_SNAPSHOT_BYTES) return null;
    const content = new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, total));
    return JSON.parse(content);
  } catch { return null; }
  finally { if (handle) await handle.close().catch(() => {}); }
}

export const loadAdtractionSnapshot = loadSearchConsoleSnapshot;
export const loadAwinSnapshot = loadSearchConsoleSnapshot;

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

export function validateAdtractionSnapshot(snapshot, now = new Date()) {
  try {
    if (snapshot?.source !== 'adtraction_authenticated_export' || snapshot.channel_url !== 'https://desgracias.es' || snapshot.market !== 'ES' || snapshot.currency !== 'EUR') return null;
    const { from, to } = snapshot.period || {};
    const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
    if (!validDate(from) || !validDate(to) || from > to || to >= now.toISOString().slice(0, 10)) return null;
    if (typeof snapshot.observed_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(snapshot.observed_at) || !validDate(snapshot.observed_at.slice(0,10)) || !Number.isFinite(Date.parse(snapshot.observed_at)) || Date.parse(snapshot.observed_at) > now.getTime() || snapshot.observed_at.slice(0,10) < to) return null;
    if (!Array.isArray(snapshot.conversion_statuses) || snapshot.conversion_statuses.length !== 2 || snapshot.conversion_statuses[0] !== 'approved' || snapshot.conversion_statuses[1] !== 'pending') return null;
    if (!['clicks','unique_clicks','conversions','commission_minor'].every(key => Number.isSafeInteger(snapshot[key]) && snapshot[key] >= 0) || snapshot.unique_clicks > snapshot.clicks) return null;
    return { status:'REGISTRADO', source:snapshot.source, period:{from,to}, observed_at:snapshot.observed_at, refresh:'manual', market:'ES', channel:'desgracias.es', currency:'EUR', conversion_statuses:['approved','pending'], clicks:snapshot.clicks, unique_clicks:snapshot.unique_clicks, conversions:snapshot.conversions, commission_minor:snapshot.commission_minor };
  } catch { return null; }
}

// Only aggregate counters leave the database; no paths, stories or contact data.
export function validateAwinSnapshot(snapshot, now = new Date()) {
  try {
    if (snapshot?.source !== 'awin_authenticated_export' || snapshot.account_name !== 'Desgracias.es' || snapshot.market !== 'ES' || snapshot.currency !== 'EUR' || snapshot.timezone !== 'Europe-Paris') return null;
    const { from, to } = snapshot.period || {};
    const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
    if (!validDate(from) || !validDate(to) || from > to || to >= now.toISOString().slice(0, 10)) return null;
    if (typeof snapshot.observed_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(snapshot.observed_at) || !validDate(snapshot.observed_at.slice(0,10)) || !Number.isFinite(Date.parse(snapshot.observed_at)) || Date.parse(snapshot.observed_at) > now.getTime() || snapshot.observed_at.slice(0,10) < to) return null;
    if (!Array.isArray(snapshot.conversion_statuses) || snapshot.conversion_statuses.length !== 3 || snapshot.conversion_statuses[0] !== 'pending' || snapshot.conversion_statuses[1] !== 'confirmed' || snapshot.conversion_statuses[2] !== 'bonus') return null;
    if (!['impressions','clicks','sales','commission_minor'].every(key => Number.isSafeInteger(snapshot[key]) && snapshot[key] >= 0)) return null;
    return {status:'REGISTRADO',source:snapshot.source,account:'Desgracias.es',market:'ES',currency:'EUR',timezone:'Europe-Paris',period:{from,to},observed_at:snapshot.observed_at,refresh:'manual',conversion_statuses:['pending','confirmed','bonus'],impressions:snapshot.impressions,clicks:snapshot.clicks,sales:snapshot.sales,commission_minor:snapshot.commission_minor};
  } catch { return null; }
}

export async function readBusinessMetrics(pool, now = new Date(), { searchConsoleSnapshot, adtractionSnapshot, awinSnapshot, professionalIntakeEnabled = false } = {}) {
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
    revenue: blocked('revenue_source_not_verified'),
    adtraction: blocked('adtraction_snapshot_not_verified'),
    awin: blocked('awin_snapshot_not_verified')
  };
  const seo = validateSearchConsoleSnapshot(searchConsoleSnapshot, now);
  if (seo) {
    for (const key of ['impressions', 'clicks']) report[key] = { value: seo[key], status: 'REGISTRADO', source: 'google_search_console', period: seo.period, exported_at: seo.exported_at, refresh: 'manual' };
  }
  const adtraction = validateAdtractionSnapshot(adtractionSnapshot, now);
  if (adtraction) report.adtraction = adtraction;
  const awin = validateAwinSnapshot(awinSnapshot, now);
  if (awin) report.awin = awin;
  if (!pool) return report;
  if (professionalIntakeEnabled === true) {
    try {
      const { rows } = await pool.query(`select count(*)::text as received_applications
        from private.professional_applications where synthetic = false
        and received_at >= $1::date and received_at < $2::date`, [report.window.from, report.window.to_exclusive]);
      const count = rows[0]?.received_applications;
      if (typeof count !== 'string' || !/^\d+$/.test(count) || !Number.isSafeInteger(Number(count))) throw new Error('invalid_aggregate');
      report.requests = {value:Number(count),status:'REGISTRADO',source:'private.professional_applications',
        definition:'received_professional_applications_not_leads',synthetic_excluded:true,
        limitation:'Solo solicitudes conservadas dentro de su plazo de retención; no es un acumulado histórico.'};
    } catch { report.requests = blocked('professional_intake_source_unavailable'); }
  }
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
