import { readFileSync } from 'node:fs';
import { summarizeAcquisition, formatAcquisition } from './lib/private-acquisition.mjs';

const [input, rawDays = '7'] = process.argv.slice(2);
if (!input || !['7', '30'].includes(rawDays)) throw new Error('Uso: node scripts/inspect-private-acquisition.mjs /ruta/privada/exportacion.json [7|30]');
const snapshot = JSON.parse(readFileSync(input, 'utf8'));
console.log(formatAcquisition(summarizeAcquisition(snapshot, Number(rawDays))));
