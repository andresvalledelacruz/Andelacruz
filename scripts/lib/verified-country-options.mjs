import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const root = new URL('../../', import.meta.url);
const win = {};
runInNewContext(readFileSync(new URL('country-options.js', root), 'utf8'), { window: win });
const directory = JSON.parse(readFileSync(new URL('data/help-directory.json', root), 'utf8'));
const covered = new Set(directory.records.filter(record => record.kind === 'resource').map(record => record.country));
covered.add('ES'); // Spanish guides live in recursos/catalog.json.

export const verifiedCountries = Array.from(win.DesgraciasCountryOptions, ([code, name], spriteIndex) => ({ code, name, spriteIndex }))
  .filter(({ code }) => covered.has(code));
