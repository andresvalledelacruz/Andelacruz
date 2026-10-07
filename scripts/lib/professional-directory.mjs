import { evaluateMonetizationEligibility } from './monetization-eligibility.mjs';

const required = ['name', 'profession', 'description', 'area', 'modality', 'languages', 'pricing'];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const https = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }
  catch { return false; }
};

// The registry contains public information only. Applications and review documents
// belong in a private system, never in this deployable tree.
function reviewedProfiles(registry, asOf = new Date()) {
  if (registry?.version !== 1 || !Array.isArray(registry.profiles)) return [];
  const now = asOf.getTime();
  if (!Number.isFinite(now)) return [];
  const seen = new Set();
  return registry.profiles.filter(p => {
    if (!p || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id) || seen.has(p.id)) return false;
    seen.add(p.id);
    const review = p.review;
    const reviewed = Date.parse(review?.reviewed_at);
    const expires = Date.parse(review?.expires_at);
    return p.status === 'published' && p.publication_authorized === true &&
      required.every(key => typeof p[key] === 'string' && p[key].trim().length > 0 && p[key].length <= 1000) &&
      https(p.website) && review?.identity_verified === true && review?.credentials_verified === true &&
      review?.terms_verified === true && typeof review.reviewer_reference === 'string' && review.reviewer_reference.trim() &&
      Array.isArray(review.sources) && review.sources.length > 0 && review.sources.every(https) &&
      Number.isFinite(reviewed) && Number.isFinite(expires) && reviewed <= now && expires > now && expires > reviewed;
  });
}

const publicProjection = p => ({ id:p.id, ...Object.fromEntries(required.map(key => [key,p[key]])),
  website:p.website, reviewed_at:p.review.reviewed_at, sources:[...p.review.sources] });

export function publicProfiles(registry, asOf = new Date()) {
  return reviewedProfiles(registry, asOf).map(publicProjection);
}

export function renderPublicProfile(profile) {
  // Revalidate at the call boundary; callers cannot render unreviewed candidates.
  const p = publicProfiles({version:1,profiles:[profile]})[0];
  if (!p) throw new Error('Profile is not eligible for publication');
  return `<article id="professional-${escape(p.id)}"><h3>${escape(p.name)}</h3><p>${escape(p.profession)}</p><p>${escape(p.description)}</p><dl>${['area','modality','languages','pricing'].map((key,i)=>`<dt>${['Zona','Modalidad','Idiomas','Tarifas'][i]}</dt><dd>${escape(p[key])}</dd>`).join('')}</dl><p>Datos profesionales revisados: ${escape(p.reviewed_at)}. La revisión no garantiza resultados.</p><p><a href="${escape(p.website)}" rel="noopener noreferrer">Consultar web y condiciones del profesional</a></p></article>`;
}

export function matchPublicProfessionals({registry, category, ...eligibility} = {}) {
  if (!evaluateMonetizationEligibility(eligibility).allowed) return [];
  // Exact, reviewed categories only; never infer needs from free text or health data.
  if (!['employment','education'].includes(category)) return [];
  return reviewedProfiles(registry).filter(p => Array.isArray(p.categories) &&
    p.categories.length > 0 && p.categories.every(value => ['employment','education'].includes(value)) &&
    p.categories.includes(category)).map(publicProjection);
}
