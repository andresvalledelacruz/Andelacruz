import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ROUTES = [
  '/ayuda-urgente.html',
  '/me-preocupa-que-alguien-pueda-suicidarse/',
  '/alguien-cercano-ha-intentado-suicidarse/',
  '/mi-pareja-me-maltrata-y-no-se-que-hacer/',
  '/he-sufrido-una-agresion-sexual-y-no-se-que-hacer/',
  '/duelo/ha-muerto-por-suicidio-alguien-que-quiero/',
];

test('documented P0/P1 inventory stays synchronized with the protected route set', async () => {
  const policy = await readFile(new URL('../SAFETY_MONETIZATION_POLICY.md', import.meta.url), 'utf8');
  const inventory = await readFile(new URL('../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');
  const invariant = await readFile(new URL('./p0-p1-noncommercial-invariant.test.mjs', import.meta.url), 'utf8');

  for (const route of ROUTES) {
    const escapedRoute = new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    assert.match(policy, escapedRoute, `${route} missing from monetization policy`);
    assert.match(inventory, escapedRoute, `${route} missing from Safety inventory`);
  }

  assert.match(invariant, /SAFETY_ROUTE_INVENTORY\.md/, 'automated invariant must read the Safety inventory');
  assert.match(invariant, /readCriticalInventory\(\)/, 'automated invariant must derive its protected routes from the inventory');
  assert.match(invariant, /routeToFile\(route\)/, 'automated invariant must map inventory routes to public files');
  assert.doesNotMatch(invariant, /const\s+CRITICAL_PUBLIC_ROUTES\s*=/, 'automated invariant must not restore a duplicated critical-route list');
});
