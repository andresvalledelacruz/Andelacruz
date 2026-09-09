# Evidencia de ensayo de rollback de fuente — 2026-09-09

Estado: **EJECUTADO / GO para mecánica documental de rama y reversión**.

## Alcance

Ensayo no destructivo realizado en la rama aislada `rehearsal/rollback-source-20260909`, creada desde producción certificada. Solo se modificó transitoriamente `LAUNCH_INCIDENT_ROLLBACK_RUNBOOK.md`; el cambio se revirtió antes de abrir el PR. El diff final contiene únicamente este registro.

No se modificaron portada V9, CSS/assets, buscador, navegación, sitemap, contenido público, tests, workflows ni configuración.

## Evidencia exacta

- SHA base certificado: `8d11d914272066f2b1fa7f49784b421ddbf4e9a8`
- Árbol base: `d8ecdf9d4d72fc4a5321e5ed47f55859892353bf`
- Blob base del runbook: `22fd0226f3e21287097414134752e1e51c927f50`
- Commit de cambio inocuo: `534f9b3f821bd2f310d8caf4de59c3ed637014bd`
- Blob transitorio: `545b42fdfcbdc2ee793bdb385f10dab3d5f2a631`
- Commit de reversión: `581e3d24ea480b7aa2757ebc211f28bddf356874`
- Blob final del runbook: `22fd0226f3e21287097414134752e1e51c927f50`
- Igualdad byte a byte del contenido base/final: **PASS**
- Igualdad exacta del blob Git base/final: **PASS**

## Resultado

La rama pudo introducir un cambio documental inequívoco y retirarlo antes de revisión, conservando exactamente el blob certificado del runbook. El PR resultante es revisable y no contiene el marcador transitorio.

Este ensayo valida la mecánica de rama, commits secuenciales, restauración exacta del archivo, PR y gates. No valida rollback de un defecto productivo ni restauración de infraestructura.

## Límites

Este resultado **no resuelve #83**: no se ejecutaron backup externo, restore drill real, CDN/DNS, GitHub Pages, Cloudflare ni restauración Supabase. Tampoco sustituye la verificación manual del recorrido afectado exigida tras un incidente real.
