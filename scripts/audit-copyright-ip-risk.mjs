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

const patterns = [
  ['blockquote', /<blockquote\b/gi],
  ['isbn', /\bISBN(?:-1[03])?\b/gi],
  ['book_reference', /\b(?:libro|cap[ií]tulo|editorial)\b/gi],
  ['explicit_quote', /\b(?:cita textual|textualmente|literalmente)\b/gi],
  ['copyright_marker', /(?:©|&copy;|copyright)/gi],
  ['remote_image', /<img\b[^>]*\bsrc=["']https?:\/\//gi]
];

const findings = [];
for (const file of htmlFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const [kind, regex] of patterns) {
    const matches = [...text.matchAll(regex)];
    if (matches.length) findings.push({ file: path.relative(root, file), kind, count: matches.length });
  }
}

const report = {
  audited_html_files: htmlFiles.length,
  automated_screen_only: true,
  findings,
  interpretation: findings.length
    ? 'Manual/source-level review required for flagged files; a finding is not proof of infringement.'
    : 'No heuristic markers found. This does not prove copyright/IP compliance or absence of problematic similarity.'
};

console.log(JSON.stringify(report, null, 2));

// Hard failures are limited to high-signal deployable risks. General textual markers are
// inventory signals for human review, not automatic allegations of infringement.
const hardFailures = findings.filter(({ kind }) => kind === 'remote_image');
if (hardFailures.length) {
  console.error('Copyright/IP gate: remote third-party images require explicit provenance/licence review before deployment.');
  process.exit(1);
}
