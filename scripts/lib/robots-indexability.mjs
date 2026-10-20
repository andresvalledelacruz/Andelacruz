export function parseMetaDirectives(html, metaName) {
  const metaTags = html.match(/<meta\s+[^>]*>/gi) ?? [];
  const target = metaName.toLowerCase();
  const directives = [];

  for (const tag of metaTags) {
    const name = tag.match(/\bname\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (name !== target) continue;

    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
    directives.push(...content.toLowerCase().split(/[,\s]+/).filter(Boolean));
  }

  return directives;
}

export function isIndexable(html) {
  const robots = parseMetaDirectives(html, 'robots');
  const googlebot = parseMetaDirectives(html, 'googlebot');
  // Google combines repeated tags; the most restrictive rule wins. `none`
  // is equivalent to `noindex, nofollow`, even alongside an `index` rule.
  return ![...robots, ...googlebot].some(rule => rule === 'noindex' || rule === 'none');
}
