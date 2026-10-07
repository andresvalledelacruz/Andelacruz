import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { publicProfiles } from './lib/professional-directory.mjs';
import { validatePartnerRegistry } from './lib/monetization-partner-registry.mjs';

export function commercialReadiness({directory, partners, surfaces, adsText = ''}, asOf = new Date()) {
  if (directory?.version !== 1 || !Array.isArray(directory.profiles)) throw new Error('Invalid directory');
  const validation = validatePartnerRegistry(partners);
  if (!validation.valid) throw new Error('Invalid partner registry: ' + validation.errors.join(', '));
  if (surfaces?.version !== 1 || surfaces.default_status !== 'denied' || surfaces.activation_enabled !== false || !Array.isArray(surfaces.surfaces)) throw new Error('Invalid surface registry');
  const eligible = publicProfiles(directory, asOf);
  const adsDeclared = /^google\.com\s*,\s*pub-\d{16}\s*,\s*DIRECT\s*,\s*f08c47fec0942fa0\s*$/mi.test(adsText);
  return {
    version: 1,
    generated_at: asOf.toISOString(),
    decision: 'BLOCKED',
    verified_public_profiles: eligible.length,
    commercial_activation_enabled: false,
    received_leads: null, confirmed_conversions: null, recognized_revenue_eur: null,
    measurement_note: 'Null means not measured. Mail prepared is not a received application or lead.',
    blockers: [
      ...(eligible.length ? [] : [{id:'profiles',status:'BLOCKED',next:'Provide real profiles, human review evidence and publication authorization.'}]),
      {id:'private_intake',status:'BLOCKED',next:'Implement and validate private intake, restricted access, retention and privacy responsibilities before activation.'},
      {id:'commercial_terms',status:'BLOCKED',next:'Owner must approve offer, billing conditions and fees; verification cannot be bought.'},
      ...['Awin','Adtraction','financeAds'].map(network => ({id:network,status:'BLOCKED',next:'Account/program approval and tracking/privacy evidence are not established by the public registry.'})),
      {id:'AdSense',status:'BLOCKED',ads_txt_google_declaration_present:adsDeclared,next:'Prove domain approval, authentic publisher identity, certified CMP and route allowlist before ads.'}
    ]
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const read = file => JSON.parse(readFileSync(file,'utf8'));
  console.log(JSON.stringify(commercialReadiness({
    directory:read('data/professional-directory.json'), partners:read('data/monetization-partners.json'),
    surfaces:read('data/monetization-surfaces.json'), adsText:existsSync('ads.txt')?readFileSync('ads.txt','utf8'):''
  }),null,2));
}
