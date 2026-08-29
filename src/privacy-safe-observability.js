import crypto from 'node:crypto';

const SAFE_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']);

export function createRequestId() {
  return crypto.randomUUID();
}

export function normalizeMethod(method) {
  const normalized = String(method || '').toUpperCase();
  return SAFE_METHODS.has(normalized) ? normalized : 'OTHER';
}

export function normalizeRouteTemplate(route) {
  const value = String(route || '').trim();
  if (!value) return 'unknown';
  const pathOnly = value.split('?')[0].split('#')[0];
  return pathOnly.startsWith('/') ? pathOnly : 'unknown';
}

export function durationBucket(durationMs) {
  const value = Number(durationMs);
  if (!Number.isFinite(value) || value < 0) return 'unknown';
  if (value < 100) return 'lt_100ms';
  if (value < 500) return '100_499ms';
  if (value < 1000) return '500_999ms';
  if (value < 3000) return '1_2s';
  return 'gte_3s';
}

export function outcomeFromStatus(statusCode) {
  const code = Number(statusCode);
  if (!Number.isInteger(code)) return 'unknown';
  if (code >= 500) return 'server_error';
  if (code >= 400) return 'client_error';
  if (code >= 300) return 'redirect';
  if (code >= 200) return 'success';
  return 'unknown';
}

export function buildOperationalEvent({
  service,
  requestId,
  method,
  route,
  statusCode,
  durationMs,
  errorCode = null
} = {}) {
  const safeErrorCode = typeof errorCode === 'string' && /^[a-z0-9_.-]{1,80}$/i.test(errorCode)
    ? errorCode
    : null;

  return {
    event: 'http_request',
    service: String(service || 'unknown').slice(0, 64),
    request_id: typeof requestId === 'string' && requestId.length <= 80 ? requestId : createRequestId(),
    method: normalizeMethod(method),
    route: normalizeRouteTemplate(route),
    status_code: Number.isInteger(Number(statusCode)) ? Number(statusCode) : null,
    outcome: outcomeFromStatus(statusCode),
    duration_bucket: durationBucket(durationMs),
    error_code: safeErrorCode,
    privacy_mode: 'no_pii_no_payload'
  };
}

export function containsForbiddenObservabilityFields(event = {}) {
  const forbidden = new Set([
    'body', 'payload', 'story', 'text', 'email', 'name', 'phone', 'ip', 'user_agent',
    'authorization', 'cookie', 'headers', 'query', 'params', 'token', 'secret'
  ]);
  return Object.keys(event).some((key) => forbidden.has(String(key).toLowerCase()));
}
