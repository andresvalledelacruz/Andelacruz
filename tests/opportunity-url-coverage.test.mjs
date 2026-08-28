import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { URL_OPPORTUNITY_MAP, EXPECTED_PRODUCTION_URL_COUNT, mappedUrlCount } from '../opportunity/url-map.mjs';

const xml = fs.readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const urls = [...xml.matchAll(/<loc>https:\/\/desgracias\.es([^<]*)<\/loc>/g)].map(m => m[1] || '/');

test('sitemap and opportunity map contain the expected number of production URLs', () => {
  assert.equal(urls.length, EXPECTED_PRODUCTION_URL_COUNT);
  assert.equal(mappedUrlCount(), EXPECTED_PRODUCTION_URL_COUNT);
});

test('every sitemap URL has an opportunity context', () => {
  const missing = urls.filter(path => !URL_OPPORTUNITY_MAP[path]);
  assert.deepEqual(missing, []);
});

test('every mapped URL exists in sitemap', () => {
  const extra = Object.keys(URL_OPPORTUNITY_MAP).filter(path => !urls.includes(path));
  assert.deepEqual(extra, []);
});

test('commercially sensitive finance pages remain restricted', () => {
  for (const path of [
    '/dinero/necesito-dinero-urgente/',
    '/dinero/quiero-reunificar-mis-deudas/',
    '/dinero/necesito-un-prestamo-pero-no-se-si-puedo-permitirmelo/',
    '/dinero/no-puedo-pagar-la-vivienda/'
  ]) assert.equal(URL_OPPORTUNITY_MAP[path].commercialPolicy, 'restricted');
});

test('matchmaking is never a default intent on loneliness or breakup pages', () => {
  const paths = Object.keys(URL_OPPORTUNITY_MAP).filter(p => p.startsWith('/soledad/') || p.startsWith('/rupturas/'));
  for (const path of paths) assert.equal(URL_OPPORTUNITY_MAP[path].intents.includes('MATCHMAKING'), false);
});
