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

function remoteImages(text) {
  const urls = [...text.matchAll(/<img\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/gi)].map((match) => match[1]);
  return urls.filter((url) => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host !== 'desgracias.es' && host !== 'www.desgracias.es';
    } catch {
      return true;
    }
  });
}

function thirdPartyCopyrightMarkers(text) {
  const markers = [...text.matchAll(/(?:©|&copy;|copyright)[^<\n]{0,120}/gi)].map((match) => match[0].trim());
  return markers.filter((marker) => !/©\s*2026\s+Desgracias\.es/i.test(marker) && !/&copy;\s*2026\s+Desgracias\.es/i.test(marker));
}

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
}

const manualReview = findings.filter(({ priority }) => priority === 'manual_review');
const hardFailures = findings.filter(({ priority }) => priority === 'hard_fail');
const informational = findings.filter(({ priority }) => priority === 'informational');

const report = {
  audited_html_files: htmlFiles.length,
  automated_screen_only: true,
  findings,
  summary: {
    hard_fail: hardFailures.length,
    manual_review: manualReview.length,
    informational: informational.length
  },
  interpretation: hardFailures.length
    ? 'Deployment blocked: at least one remote third-party image requires explicit provenance/licence review.'
    : manualReview.length
      ? 'Source-level review required for higher-signal findings; a finding is not proof of infringement.'
      : 'No higher-signal heuristic markers found. This does not prove copyright/IP compliance or absence of problematic similarity.'
};

console.log(JSON.stringify(report, null, 2));

// Automatic hard failures are deliberately limited to clear deployable provenance risks.
// Textual similarity and legal basis for quotations still require source-level review.
if (hardFailures.length) {
  console.error('Copyright/IP gate: remote third-party images require explicit provenance/licence review before deployment.');
  process.exit(1);
}
