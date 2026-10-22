#!/usr/bin/env python3
"""Offline, privacy-preserving triage of a Google Search Console Page indexing CSV.

No network access, credentials, URL Inspection calls, or changes to production.
Input must be an AUTHENTICATED export from the relevant Search Console property.
This is a diagnostic grouping tool, NOT proof of indexing or a GSC integration.

Usage:
  python3 scripts/gsc_indexing_triage.py export.csv --output report.json
  python3 scripts/gsc_indexing_triage.py export.csv --output report.json --expected 57

Accepted header aliases: URL/Page/Página, Reason/Motivo/Why pages aren't indexed,
Status/Estado, Last crawled/Último rastreo. Other fields are ignored.
"""
import argparse
import csv
import json
import pathlib
import sys
from collections import Counter
from datetime import datetime, timezone
from urllib.parse import urlsplit

ALIASES = {
    "url": ("url", "page", "página", "pagina"),
    "reason": ("reason", "motivo", "why pages aren't indexed", "por qué no se indexan las páginas"),
    "status": ("status", "estado"),
    "last_crawled": ("last crawled", "último rastreo", "ultimo rastreo"),
}


def field_map(fields):
    names = {str(name).strip().casefold(): name for name in fields if name}
    return {key: next((names[a] for a in options if a in names), None)
            for key, options in ALIASES.items()}


def category(row, field):
    """Return a scalar aggregate label without reading DictReader overflow cells."""
    if not field:
        return "Not supplied"
    value = row.get(field)
    if value is None:
        return "Not supplied"
    label = " ".join(str(value).split())
    return label or "Not supplied"


def triage(source, expected=None):
    with open(source, newline="", encoding="utf-8-sig") as stream:
        reader = csv.DictReader(stream)
        mapping = field_map(reader.fieldnames or [])
        if not mapping["url"]:
            raise ValueError("Missing URL/Page/Página column; check the GSC export format")
        rows = list(reader)
    reasons = Counter()
    statuses = Counter()
    invalid = 0
    off_property = 0
    duplicates = 0
    seen = set()
    for row in rows:
        url = (row.get(mapping["url"]) or "").strip()
        parsed = urlsplit(url)
        if parsed.scheme not in ("https", "http") or not parsed.netloc:
            invalid += 1
            continue
        if parsed.hostname not in ("desgracias.es", "www.desgracias.es"):
            off_property += 1
            continue
        normalized = (parsed.hostname, parsed.path.rstrip("/") or "/", parsed.query)
        if normalized in seen:
            duplicates += 1
            continue
        seen.add(normalized)
        reasons[category(row, mapping["reason"])] += 1
        statuses[category(row, mapping["status"])] += 1
    return {
        "source": "user-provided authenticated GSC CSV; not independently verified",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "total_export_rows": len(rows),
        "valid_unique_property_urls": len(seen),
        "expected_count": expected,
        "expected_count_matches": None if expected is None else len(seen) == expected,
        "invalid_urls": invalid,
        "other_property_urls": off_property,
        "duplicate_urls": duplicates,
        "reasons": dict(sorted(reasons.items())),
        "statuses": dict(sorted(statuses.items())),
        "limitations": [
            "Counts describe the exported snapshot only; HTTP 200 and sitemap presence do not establish indexing.",
            "GSC exports may be sampled or filtered; missing rows cannot be inferred.",
            "No live URL Inspection, performance metrics, canonical evaluation, or remediation performed.",
            "Raw URL lists are not written to the report to reduce accidental exposure.",
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", type=pathlib.Path)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    parser.add_argument("--expected", type=int)
    args = parser.parse_args()
    if args.expected is not None and args.expected < 0:
        parser.error("Expected count must be zero or greater")
    if args.csv.resolve() == args.output.resolve():
        parser.error("Output must not overwrite the source CSV")
    try:
        report = triage(args.csv, args.expected)
    except (OSError, UnicodeError, csv.Error, ValueError) as exc:
        parser.error(str(exc))
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Analysed {report['valid_unique_property_urls']} unique property URLs; report: {args.output}")
    if args.expected is not None and not report["expected_count_matches"]:
        print("WARNING: export count does not match expected count; investigate filters/date/property", file=sys.stderr)


if __name__ == "__main__":
    main()
