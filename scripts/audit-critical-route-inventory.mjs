import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { isCriticalRoutePath } from './critical-route-signals.mjs';

const ROOT = process.cwd();

const SKIP_DIRS = new Set(['.git', 'node_modules']);

function routeToFile(route) {
  return route.endsWith('/') ? `${route.slice(1)}index.html` : route.slice(1);
}

function readInventoryRoutes(markdown) {
  return [...markdown.matchAll(/^\|\s*`(\/[^`]+)`\s*\|/gm)].map((match) => match[1]);
}

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

const inventoryDocument = await readFile(path.join(ROOT, 'SAFETY_ROUTE_INVENTORY.md'), 'utf8');
const publicInventory = readInventoryRoutes(inventoryDocument);
if (publicInventory.length === 0) throw new Error('Safety route inventory is empty or cannot be parsed');
const INVENTORY = new Set(publicInventory.map(routeToFile));

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
