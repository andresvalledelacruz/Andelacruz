import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { isCriticalRoutePath } from './critical-route-signals.mjs';

const ROOT = process.cwd();

const INVENTORY = new Set([
  'ayuda-urgente.html',
  'me-preocupa-que-alguien-pueda-suicidarse/index.html',
  'alguien-cercano-ha-intentado-suicidarse/index.html',
  'mi-pareja-me-maltrata-y-no-se-que-hacer/index.html',
  'he-sufrido-una-agresion-sexual-y-no-se-que-hacer/index.html',
  'duelo/ha-muerto-por-suicidio-alguien-que-quiero/index.html',
]);

const SKIP_DIRS = new Set(['.git', 'node_modules']);

async function walk(dir, out = []) {
  for (const entry of await readdir(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const absolute = path.join(dir, entry);
    const relative = path.relative(ROOT, absolute).replaceAll(path.sep, '/');
    const info = await stat(absolute);
    if (info.isDirectory()) await walk(absolute, out);
    else if (entry === 'index.html' || relative === 'ayuda-urgente.html') out.push(relative);
  }
  return out;
}

const routes = await walk(ROOT);
const suspicious = routes.filter(isCriticalRoutePath);
const missing = suspicious.filter((route) => !INVENTORY.has(route));
const absent = [...INVENTORY].filter((route) => !routes.includes(route));

const policy = await readFile(path.join(ROOT, 'SAFETY_MONETIZATION_POLICY.md'), 'utf8');
const undocumented = [...INVENTORY].filter((route) => {
  const publicRoute = route === 'ayuda-urgente.html' ? '/ayuda-urgente.html' : `/${route.replace(/index\.html$/, '')}`;
  return !policy.includes(publicRoute);
});

const report = {
  inventoryCount: INVENTORY.size,
  suspiciousRouteCount: suspicious.length,
  missingFromInventory: missing,
  inventoriedButMissingOnDisk: absent,
  inventoriedButMissingFromPolicy: undocumented,
  ok: missing.length === 0 && absent.length === 0 && undocumented.length === 0,
};

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error('Critical-route Safety inventory drift detected. Classify and inventory the route before merge.');
  process.exit(1);
}
