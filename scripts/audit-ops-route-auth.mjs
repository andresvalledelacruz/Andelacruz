import fs from 'node:fs';
import { capabilityForOpsRoute } from '../src/ops-authz.js';

const source = fs.readFileSync(new URL('../src/ops-api.js', import.meta.url), 'utf8');
const publicOpsAssets = new Set(['/ops', '/ops/', '/ops/ops.css', '/ops/ops.js']);
const routePattern = /app\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]([\s\S]*?)async\s*\(/g;

const failures = [];
const audited = [];
let match;

while ((match = routePattern.exec(source)) !== null) {
  const method = match[1].toUpperCase();
  const route = match[2];
  const options = match[3] || '';

  if (!route.startsWith('/ops') || publicOpsAssets.has(route)) continue;

  audited.push(`${method} ${route}`);

  if (!/preHandler\s*:\s*requireOpsCapability\s*\(/.test(options)) {
    failures.push(`${method} ${route}: missing requireOpsCapability preHandler`);
    continue;
  }

  const capability = capabilityForOpsRoute(method, route);
  if (!capability) {
    failures.push(`${method} ${route}: route is not mapped to an RBAC capability`);
  }
}

if (audited.length === 0) {
  failures.push('no protected /ops data routes were discovered; audit parser may be stale');
}

if (failures.length > 0) {
  console.error('Ops route authorization audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Ops route authorization audit passed (${audited.length} protected data routes).`);
for (const route of audited) console.log(`- ${route}`);
