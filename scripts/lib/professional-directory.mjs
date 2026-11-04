import { evaluateMonetizationEligibility } from './monetization-eligibility.mjs';

const required = ['name', 'profession', 'description', 'country', 'area', 'service_countries',
  'modality', 'languages', 'pricing'];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const https = value => {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }
  catch { return false; }
};
const reviewedStatus = value => value === 'verified' || value === 'not_applicable';
const reviewReference = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 160;
const exactKeys = (value, allowed) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).every(key => allowed.includes(key));
const categories = ['employment', 'education'];

// The registry contains public information only. Applications and review documents
// belong in a private system, never in this deployable tree.
function reviewedCandidate(p, asOf = new Date()) {
  const now = asOf.getTime();
  if (!Number.isFinite(now) || !p || typeof p.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id)) return false;
  const review = p.review;
  const reviewed = Date.parse(review?.reviewed_at);
  const expires = Date.parse(review?.expires_at);
  return p.status === 'published' && p.publication_authorized === true &&
    p.commercial_relationship === 'none' &&
    required.every(key => typeof p[key] === 'string' && p[key].trim().length > 0 && p[key].length <= 1000) &&
    https(p.website) && review?.identity_verified === true && review?.credentials_verified === true &&
    review?.jurisdiction_verified === true && review?.terms_verified === true &&
    reviewedStatus(review?.registration_status) && reviewedStatus(review?.insurance_status) &&
    reviewReference(review?.registration_review_reference) && reviewReference(review?.insurance_review_reference) &&
    typeof review.reviewer_reference === 'string' && review.reviewer_reference.trim() &&
    Array.isArray(review.sources) && review.sources.length > 0 && Array.from(review.sources).every(https) &&
    Number.isFinite(reviewed) && Number.isFinite(expires) && reviewed <= now && expires > now && expires > reviewed;
}

// Convert a candidate held in the private intake store into the only shape that
// may be copied to the deployable registry. Internal reviewer and evidence
// references deliberately have no destination in this projection.
export function preparePublicProfile(candidate, asOf = new Date()) {
  if (!reviewedCandidate(candidate, asOf)) return null;
  return { id:candidate.id, status:'published', publication_authorized:true,
    ...Object.fromEntries(required.map(key => [key,candidate[key]])), website:candidate.website,
    commercial_relationship:'none',
    categories:Array.isArray(candidate.categories) && candidate.categories.length === Array.from(candidate.categories).length &&
      Array.from(candidate.categories).every(value => categories.includes(value)) ? [...candidate.categories] : [],
    verification:{ reviewed_at:candidate.review.reviewed_at, expires_at:candidate.review.expires_at,
      registration_status:candidate.review.registration_status, insurance_status:candidate.review.insurance_status,
      sources:[...candidate.review.sources] } };
}

function reviewedProfiles(registry, asOf = new Date()) {
  if (registry?.version !== 1 || !Array.isArray(registry.profiles)) return [];
  const now = asOf.getTime();
  if (!Number.isFinite(now)) return [];
  const allowed = ['id','status','publication_authorized',...required,'website','commercial_relationship','categories','verification'];
  const verificationKeys = ['reviewed_at','expires_at','registration_status','insurance_status','sources'];
  const seen = new Set();
  return registry.profiles.filter(p => {
    if (!exactKeys(p, allowed) || typeof p.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id) || seen.has(p.id)) return false;
    seen.add(p.id);
    const verification = p.verification;
    const reviewed = Date.parse(verification?.reviewed_at);
    const expires = Date.parse(verification?.expires_at);
    return p.status === 'published' && p.publication_authorized === true && p.commercial_relationship === 'none' &&
      required.every(key => typeof p[key] === 'string' && p[key].trim().length > 0 && p[key].length <= 1000) &&
      https(p.website) && Array.isArray(p.categories) && p.categories.length === Array.from(p.categories).length &&
      Array.from(p.categories).every(value => categories.includes(value)) && exactKeys(verification, verificationKeys) &&
      reviewedStatus(verification.registration_status) && reviewedStatus(verification.insurance_status) &&
      Array.isArray(verification.sources) && verification.sources.length > 0 && Array.from(verification.sources).every(https) &&
      Number.isFinite(reviewed) && Number.isFinite(expires) && reviewed <= now && expires > now && expires > reviewed;
  });
}

export function publicProfiles(registry, asOf = new Date()) {
  return reviewedProfiles(registry, asOf).map(p => ({...p, categories:[...p.categories],
    verification:{...p.verification, sources:[...p.verification.sources]}}));
}

export function renderPublicProfile(profile) {
  // Revalidate at the call boundary; callers cannot render unreviewed candidates.
  const p = publicProfiles({version:1,profiles:[profile]})[0];
  if (!p) throw new Error('Profile is not eligible for publication');
  return `<article id="professional-${escape(p.id)}"><h3>${escape(p.name)}</h3><p>${escape(p.profession)}</p><p>${escape(p.description)}</p><dl>${['country','area','service_countries','modality','languages','pricing'].map((key,i)=>`<dt>${['País de establecimiento','Zona','Países de prestación declarados','Modalidad','Idiomas','Tarifas'][i]}</dt><dd>${escape(p[key])}</dd>`).join('')}</dl><p>Datos profesionales revisados: ${escape(p.verification.reviewed_at)}. La revisión no garantiza resultados.</p><p>Sin relación comercial remunerada con Desgracias.es. La candidatura y el interés comercial opcional no alteran esta declaración.</p><p><a href="${escape(p.website)}" rel="noopener noreferrer">Consultar web y condiciones del profesional</a></p></article>`;
}

export function matchPublicProfessionals({registry, category, ...eligibility} = {}) {
  if (!evaluateMonetizationEligibility(eligibility).allowed) return [];
  // Exact, reviewed categories only; never infer needs from free text or health data.
  if (!['employment','education'].includes(category)) return [];
  return publicProfiles(registry).filter(p => p.categories.length > 0 && p.categories.includes(category));
}
