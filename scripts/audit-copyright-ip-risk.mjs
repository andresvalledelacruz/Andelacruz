import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skipDirs = new Set(['.git', 'node_modules', 'docs', 'tests', 'scripts', 'src', 'ops', 'opportunity', '.github']);
const htmlFiles = [];

function walk(dir, depth = 0) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.') continue;
    if (depth === 0 && skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, depth + 1);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}

walk(root);

const textualPatterns = [
  ['blockquote', /<blockquote\b/gi],
  ['isbn', /\bISBN(?:-1[03])?\b/gi],
  ['book_reference', /\b(?:libro|cap[ií]tulo|editorial)\b/gi],
  ['explicit_quote', /\b(?:cita textual|textualmente|literalmente)\b/gi]
];

function isNoindex(text) {
  return /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(text)
    || /<meta\b[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(text);
}

function allImageSources(text) {
  return [...text.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map((match) => match[1].trim());
}

function isOwnAbsoluteUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'desgracias.es' || host === 'www.desgracias.es';
  } catch {
    return false;
  }
}

function remoteImages(text) {
  return allImageSources(text).filter((url) => /^https?:\/\//i.test(url) && !isOwnAbsoluteUrl(url));
}

function normalizeLocalAsset(url) {
  if (!url || /^data:|^blob:/i.test(url)) return null;
  if (/^https?:\/\//i.test(url)) {
    if (!isOwnAbsoluteUrl(url)) return null;
    try {
      return new URL(url).pathname.replace(/^\/+/, '');
    } catch {
      return null;
    }
  }
  const clean = url.split(/[?#]/, 1)[0];
  return clean.replace(/^\/+/, '');
}

function thirdPartyCopyrightMarkers(text) {
  const markers = [...text.matchAll(/(?:©|&copy;|copyright)[^<\n]{0,120}/gi)].map((match) => match[0].trim());
  return markers.filter((marker) => !/©\s*2026\s+Desgracias\.es/i.test(marker) && !/&copy;\s*2026\s+Desgracias\.es/i.test(marker));
}

function loadAssetProvenance() {
  const registryPath = path.join(root, 'copyright-asset-provenance.json');
  if (!fs.existsSync(registryPath)) return { version: 1, assets: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    return parsed && typeof parsed === 'object' && parsed.assets && typeof parsed.assets === 'object'
      ? parsed
      : { version: 1, assets: {} };
  } catch {
    return { version: 1, assets: {} };
  }
}

const provenance = loadAssetProvenance();
const localAssetUsage = new Map();
const findings = [];

for (const file of htmlFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const relativeFile = path.relative(root, file);
  const noindex = isNoindex(text);
  const exposure = noindex ? 'non_indexed_staging' : 'deployable_indexed';

  for (const [kind, regex] of textualPatterns) {
    const matches = [...text.matchAll(regex)];
    if (!matches.length) continue;
    const priority = exposure === 'deployable_indexed' || kind !== 'blockquote' ? 'manual_review' : 'informational';
    findings.push({ file: relativeFile, kind, count: matches.length, exposure, priority });
  }

  const copyrightMarkers = thirdPartyCopyrightMarkers(text);
  if (copyrightMarkers.length) {
    findings.push({
      file: relativeFile,
      kind: 'third_party_copyright_marker',
      count: copyrightMarkers.length,
      exposure,
      priority: 'manual_review'
    });
  }

  const externalImages = remoteImages(text);
  if (externalImages.length) {
    findings.push({
      file: relativeFile,
      kind: 'remote_third_party_image',
      count: externalImages.length,
      exposure,
      priority: 'hard_fail'
    });
  }

  for (const src of allImageSources(text)) {
    const asset = normalizeLocalAsset(src);
    if (!asset || !/\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(asset)) continue;
    const usage = localAssetUsage.get(asset) || new Set();
    usage.add(relativeFile);
    localAssetUsage.set(asset, usage);
  }
}

for (const [asset, files] of localAssetUsage.entries()) {
  const record = provenance.assets?.[asset];
  if (!record) {
    findings.push({
      asset,
      files: [...files].sort(),
      kind: 'local_image_unregistered',
      count: files.size,
      priority: 'manual_review'
    });
    continue;
  }

  if (record.status === 'HOLD_LEGAL') {
    findings.push({
      asset,
      files: [...files].sort(),
      kind: 'local_image_hold_legal',
      count: files.size,
      priority: 'hard_fail'
    });
  } else if (record.status === 'PENDING_PROVENANCE') {
    findings.push({
      asset,
      files: [...files].sort(),
      kind: 'local_image_pending_provenance',
      count: files.size,
      priority: 'manual_review'
    });
  }
}

const manualReview = findings.filter(({ priority }) => priority === 'manual_review');
const hardFailures = findings.filter(({ priority }) => priority === 'hard_fail');
const informational = findings.filter(({ priority }) => priority === 'informational');

const report = {
  audited_html_files: htmlFiles.length,
  automated_screen_only: true,
  asset_provenance_registry_present: fs.existsSync(path.join(root, 'copyright-asset-provenance.json')),
  local_image_assets_referenced: localAssetUsage.size,
  findings,
  summary: {
    hard_fail: hardFailures.length,
    manual_review: manualReview.length,
    informational: informational.length
  },
  interpretation: hardFailures.length
    ? 'Deployment blocked: at least one image asset has an unresolved hard provenance/legal condition.'
    : manualReview.length
      ? 'Source-level/provenance review required for higher-signal findings; a finding is not proof of infringement.'
      : 'No higher-signal heuristic markers found. This does not prove copyright/IP compliance or absence of problematic similarity.'
};

console.log(JSON.stringify(report, null, 2));

// Automatic hard failures are deliberately limited to clear deployable provenance/legal risks.
// Textual similarity, pending local provenance and legal basis for quotations remain explicit review states.
if (hardFailures.length) {
  console.error('Copyright/IP gate: unresolved hard provenance/legal condition detected.');
  process.exit(1);
}
