export function parseMetaDirectives(html, metaName) {
  const metaTags = html.match(/<meta\s+[^>]*>/gi) ?? [];
  const target = metaName.toLowerCase();

  for (const tag of metaTags) {
    const name = tag.match(/\bname\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (name !== target) continue;

    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
    return content.toLowerCase().split(/[,\s]+/).filter(Boolean);
  }

  return [];
}

export function isIndexable(html) {
  const robots = parseMetaDirectives(html, 'robots');
  const googlebot = parseMetaDirectives(html, 'googlebot');
  return !robots.includes('noindex') && !googlebot.includes('noindex');
}
