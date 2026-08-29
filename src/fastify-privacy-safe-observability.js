import { buildOperationalEvent, createRequestId } from './privacy-safe-observability.js';

export function registerPrivacySafeHttpObservability(app, {
  service = 'unknown',
  now = () => Date.now()
} = {}) {
  if (!app || typeof app.addHook !== 'function') {
    throw new TypeError('fastify_app_required');
  }

  const requestState = new WeakMap();

  app.addHook('onRequest', async (request, reply) => {
    const requestId = createRequestId();
    requestState.set(request, {
      requestId,
      startedAt: now()
    });

    reply.header('X-Request-Id', requestId);
  });

  app.addHook('onResponse', async (request, reply) => {
    const state = requestState.get(request);
    const durationMs = state ? Math.max(0, now() - state.startedAt) : null;
    const routeTemplate = request?.routeOptions?.url || 'unknown';

    const event = buildOperationalEvent({
      service,
      requestId: state?.requestId,
      method: request?.method,
      route: routeTemplate,
      statusCode: reply?.statusCode,
      durationMs
    });

    app.log.info(event, 'http_request');
    requestState.delete(request);
  });
}
