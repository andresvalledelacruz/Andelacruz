# Copyright / Asset Provenance Ledger

Purpose: maintain an explicit provenance status for non-text assets published by Desgracias.es. This ledger supports, but does not replace, legal review.

## Status model

- `VERIFIED_OWNED`: authorship/ownership evidence is documented.
- `VERIFIED_LICENSED`: licence/permission and scope are documented.
- `VERIFIED_PUBLIC_DOMAIN`: public-domain basis is documented.
- `PENDING_PROVENANCE`: asset is present but its ownership/licence evidence has not yet been verified.
- `HOLD_LEGAL`: do not newly publish or expand use until legal/provenance review is resolved.

## Current published image inventory

| Asset | Current use | Status | Evidence / next action |
|---|---|---|---|
| `assets/manos-apoyo.png` | Site/OG visual asset | `PENDING_PROVENANCE` | Existing production asset. Do not infer ownership from repository presence. `Pendiente de Andrés`: confirm original source/authorship or licence/permission before classifying as verified. |
| `assets/manos-apoyo.webp` | Optimized derivative of `manos-apoyo.png` | `PENDING_PROVENANCE` | Derivative inherits the provenance status of the source image. Resolve together with the PNG. |

## Rules

1. Repository presence is not evidence of copyright ownership.
2. Attribution alone is not treated as permission.
3. A derivative cannot receive a safer status than its source unless an independent lawful basis is documented.
4. New third-party remote images remain a CI hard fail until explicit provenance/licence review exists.
5. New local visual assets should be entered here at creation/import time with source, creator, date, rights basis and permitted uses.
6. `PENDING_PROVENANCE` is a review state, not a finding of infringement. Existing V9 assets are not altered merely to satisfy this ledger; any replacement of a V9 visual requires Andrés's explicit approval.

## Review record

- 2026-09-01: initial source-level inventory created from `production-v9`. The two published files above are treated conservatively as unverified until evidence is attached. No claim is made that they infringe third-party rights.
