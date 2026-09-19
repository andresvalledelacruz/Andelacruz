import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {renderReport} from './lib/private-analytics-report.mjs';
import {privateReportDestination} from './lib/private-report-path.mjs';

const [input,output]=process.argv.slice(2);
if(!input||!output) throw new Error('Uso: node scripts/build-private-analytics-report.mjs exportacion.json /ruta/privada/visitas.html');
const root=fileURLToPath(new URL('..',import.meta.url));
const destination=privateReportDestination(root,output);
writeFileSync(destination,renderReport(JSON.parse(readFileSync(input,'utf8'))));
console.log('Informe privado creado: '+destination);
