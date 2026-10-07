import fs from 'node:fs';
import { validatePartnerRegistry } from './lib/monetization-partner-registry.mjs';

const registry = JSON.parse(fs.readFileSync('data/monetization-partners.json','utf8'));
const validation = validatePartnerRegistry(registry);
const ads = fs.existsSync('ads.txt') ? fs.readFileSync('ads.txt','utf8') : '';
const approved = (registry.partners ?? []).filter(p => p.status === 'approved');
const report = {
  activation_enabled:registry.activation_enabled,
  registry_valid:validation.valid,
  networks:['Awin','Adtraction','financeAds'].map(network => ({
    network, status:'BLOQUEADO',
    configured_approved_partners:approved.filter(p => String(p.network_name).toLowerCase() === network.toLowerCase()).length,
    reason:'Account approval, usable programs, authenticated attribution and privacy review require real external evidence.'
  })),
  adsense:{status:'BLOQUEADO', ads_txt_present:fs.existsSync('ads.txt'),
    publisher_id_present:/google\.com,\s*pub-\d+,\s*DIRECT,\s*f08c47fec0942fa0/.test(ads),
    reason:'Domain approval, real publisher ID, CMP selection/configuration and consent tests are not established by repository files.'},
  professionals:{status:'BLOQUEADO',reason:'Real profile review and publication authorization; private intake backend and server-confirmed leads/revenue pending.'}
};
console.log(JSON.stringify(report,null,2));
if(!validation.valid || registry.activation_enabled !== false) process.exitCode=1;
