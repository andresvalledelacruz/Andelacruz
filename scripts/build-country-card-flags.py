"""Build shaded country cards from the already licensed local flag sprite."""

from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "assets" / "country-card.css"
codes = json.loads(subprocess.check_output([
    "node", "-e", "global.window={};require(process.argv[1]);process.stdout.write(JSON.stringify(window.DesgraciasCountryOptions.map(option=>option[0])))",
    str(ROOT / "country-options.js"),
]))
assert len(codes) == 58

base = """/* Country cards: flags stay visible beneath a light veil so every country name remains readable. */
.home-country-links{margin:22px 0 4px;padding:20px;border:1px solid #dac9b7;border-radius:14px;background:#fffaf4}
.home-country-links h3{margin:0 0 7px;font-size:1.2rem}
.home-country-links p{margin:0 0 14px;line-height:1.45}
.country-buttons{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:6px}
.country-button[data-country]{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;min-height:76px;padding:4px;border:1px solid #b9a38b;border-radius:9px;background-color:#f8f1e9;color:#30231b;font-size:.82rem;font-weight:800;line-height:1.14;text-align:center;text-shadow:0 1px 2px #fff,0 0 8px #fff;box-shadow:0 2px 5px #4a2d2020,inset 0 1px 2px #ffffffcc;opacity:1;text-decoration:none}
.country-button[data-country]::before{content:"";position:absolute;z-index:-1;inset:0;border-radius:inherit;background-image:linear-gradient(90deg,#fff9f299,#fff9f299),url(/assets/country-flags.png);background-size:100% 100%,100% 5800%;opacity:.64;filter:saturate(.92)}
.country-button[data-country] .flag-image{display:none}
.country-button[data-country] span:last-child{overflow-wrap:normal;word-break:normal;hyphens:auto}
.country-button[data-country].country-unavailable{opacity:.72}
.country-button[data-country][aria-pressed="true"],.country-button[data-country][aria-current="page"]{border:2px solid #704324;background-color:#f9eddf;color:#26190f;opacity:1;box-shadow:0 2px 7px #4a2d203d,inset 0 0 0 1px #fff}
.country-button[data-country]:hover{background-color:#f9ead9;opacity:1}
.country-button[data-country]:focus-visible{outline:3px solid #704324;outline-offset:3px}
@media(max-width:650px){.country-buttons{grid-template-columns:repeat(3,minmax(0,1fr))}.country-button[data-country]{min-height:65px;font-size:.82rem;padding:5px}}
@media(max-width:390px){.country-buttons{grid-template-columns:repeat(2,minmax(0,1fr))}}
"""
rules = "".join(f'.country-button[data-country="{code}"]::before{{background-position:center,center {index * 100 / (len(codes) - 1):.6f}%}}\n' for index, code in enumerate(codes))
CSS.write_text(base + rules)
