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
    assert.match(policy, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${route} missing from monetization policy`);
    assert.match(inventory, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${route} missing from Safety inventory`);

    const fileRoute = route.endsWith('.html')
      ? route.slice(1)
      : `${route.slice(1)}index.html`;
    assert.match(invariant, new RegExp(fileRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${route} missing from automated invariant`);
  }
});
