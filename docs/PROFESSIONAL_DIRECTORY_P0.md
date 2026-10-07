# MON-002 checkpoint — 7 October 2026

The public 3×2 panel and Contacto destinations are preserved. The directory stays empty: no invented identity, verification, recommendation, conversion or income.

## Implemented foundation

- `data/professional-directory.json` contains **public profiles only**, currently none. Never commit applications, patient data, credential documents or private correspondence.
- `scripts/lib/professional-directory.mjs` validates identity, credentials, public conditions, publication authorization, HTTPS evidence, named review reference and unexpired review before allowing a public profile. Rejected, pending, withdrawn or expired profiles cannot render. Rendering escapes untrusted text and excludes internal review references.
- `renderPublicProfile` prepares an accessible public article with profession, description, location, modality, languages, price and public professional website. It does not publish automatically. Real reviewed profiles and a governed publishing workflow are still required.
- Contextual matching is prepared only for exact employment/education categories and after the existing route Safety and commercial prerequisites gate. Unknown classifications and P0/P1 are denied. No matching is connected to public routes yet.
- `professional-funnel.js`, loaded only on the professional hub, emits local `desgracias:professional-funnel` hooks: `view`, `application_start` once per page and `email_prepared` only after valid submission. Payload: version, fixed surface and stage. No network, storage, persistent ID or form value. These hooks alone do **not** store metrics.

## Blocked activation

An email being prepared is not a received application, professional contact or lead. Aggregate storage requires an approved backend/privacy integration. Real `commercial_lead_confirmed`, sale and revenue events must follow `COMMERCIAL_MEASUREMENT_CONTRACT.md` and trusted server reconciliation; never let a browser claim revenue.

Publication requires actual evidence reviewed by an authorized human, explicit permission for public fields and private handling of intake. Do not claim clinical quality or sell verification. Paid visibility and pricing need reviewed disclosure before activation.

`node scripts/audit-commercial-readiness.mjs` prints current repository evidence and blockers for Awin, Adtraction, financeAds, AdSense and professionals. No authenticated account evidence was available in this run. The partner registry remains empty/disabled. `ads.txt` remains absent until a real publisher ID is supplied. A CMP must be chosen and tested before non-essential tags activate. Do not treat prior chat approval claims as credentials or confirmed account status.

Search Console access/export is also unavailable. The 80 sitemap URLs and hub indexability are protected by local SEO tests; this does not establish Google indexing, impressions or CTR.

## Checks

Run `node --test tests/professional-directory.test.mjs tests/professionals-hub.test.mjs tests/seo-public-indexability.test.mjs` and the full repository CI. Run the existing responsive hub QA, accessibility, performance and Safety/measurement audits. Merge only after remote gates are green, then compare production files with reviewed source.
