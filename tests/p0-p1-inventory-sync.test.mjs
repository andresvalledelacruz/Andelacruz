import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

function inventoryRoutes(markdown) {
  return [...markdown.matchAll(/^\|\s*`(\/[^`]+)`\s*\|/gm)].map((match) => match[1]);
}

function policyRoutes(markdown) {
  const section = markdown.match(/## Inventario automatizado actual([\s\S]*?)(?=\n## )/)?.[1] ?? '';
  return [...section.matchAll(/`(\/[^`]+)`/g)].map((match) => match[1]);
}

test('documented P0/P1 inventory stays synchronized with the protected route set', async () => {
  const policy = await readFile(new URL('../SAFETY_MONETIZATION_POLICY.md', import.meta.url), 'utf8');
  const inventory = await readFile(new URL('../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');
  const invariant = await readFile(new URL('./p0-p1-noncommercial-invariant.test.mjs', import.meta.url), 'utf8');

  const documented = inventoryRoutes(inventory).sort();
  const protectedByPolicy = policyRoutes(policy).sort();
  assert.ok(documented.length > 0, 'Safety inventory must contain at least one protected route');
  assert.deepEqual(protectedByPolicy, documented, 'monetization policy and Safety inventory must contain the exact same route set');

  assert.match(invariant, /SAFETY_ROUTE_INVENTORY\.md/, 'automated invariant must read the Safety inventory');
  assert.match(invariant, /readCriticalInventory\(\)/, 'automated invariant must derive its protected routes from the inventory');
  assert.match(invariant, /routeToFile\(route\)/, 'automated invariant must map inventory routes to public files');
  assert.doesNotMatch(invariant, /const\s+CRITICAL_PUBLIC_ROUTES\s*=/, 'automated invariant must not restore a duplicated critical-route list');
});

test('critical-route auditor derives its set from the canonical inventory', async () => {
  const auditor = await readFile(new URL('../scripts/audit-critical-route-inventory.mjs', import.meta.url), 'utf8');
  assert.match(auditor, /SAFETY_ROUTE_INVENTORY\.md/);
  assert.match(auditor, /readInventoryRoutes\(inventoryDocument\)/);
  assert.doesNotMatch(auditor, /const\s+INVENTORY\s*=\s*new Set\s*\(\s*\[/);
});
