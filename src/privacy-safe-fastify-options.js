import { LogController } from 'fastify';

// Fastify's default request logs include raw URLs and remote IPs. The explicit
// observability adapter emits route templates and coarse outcomes instead.
export function privacySafeFastifyOptions({ bodyLimit, logger = true } = {}) {
  return { logger, bodyLimit, logController: new LogController({ disableRequestLogging: true }) };
}
