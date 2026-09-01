# Production Origin Integrity

Fecha de alta: 2026-09-01
Incidencia principal: #127

## Objetivo

Convertir la comprobación del dominio público de Desgracias.es en evidencia externa, repetible y conservadora. Este control no modifica la portada V9, DNS, certificados ni configuración de hosting: observa producción y falla si no puede demostrar las propiedades mínimas esperadas.

## Qué verifica

El script `scripts/audit-production-origin.mjs` comprueba desde un runner externo:

1. TLS de `desgracias.es` y `www.desgracias.es` usando el almacén de confianza normal del sistema, `rejectUnauthorized: true` y TLS 1.2 como mínimo.
2. Las cuatro variantes públicas:
   - `https://desgracias.es/`
   - `https://www.desgracias.es/`
   - `http://desgracias.es/`
   - `http://www.desgracias.es/`
3. Que todas terminen en `https://desgracias.es/` con respuesta 2xx.
4. Que el HTML final contenga marcadores estables de la V9 aprobada.
5. Que el HTML final no contenga señales típicas del WordPress histórico (`wp-content`, `wp-includes`, `wordpress`, `colormag`).
6. DNS A, AAAA y NS del apex y CNAME/A/AAAA de `www`, consultados de forma independiente mediante Google Public DNS DoH y Cloudflare DoH.
7. Consenso entre ambos resolvers para cada tipo consultado, sin comparar TTL.

## Regla de seguridad

Está prohibido convertir un fallo de certificado en verde mediante `curl -k`, `--insecure`, `NODE_TLS_REJECT_UNAUTHORIZED=0`, `rejectUnauthorized: false` o equivalentes. Si el certificado no valida, el resultado correcto del monitor es rojo y debe investigarse la causa.

## Automatización

`.github/workflows/production-origin-integrity.yml` se ejecuta en cada `push` a `production-v9` y también admite `workflow_dispatch`. Guarda el JSON de evidencia como artifact durante 30 días.

No se ejecuta como dependencia de red dentro del Engineering Quality Gate: Engineering conserva tests deterministas y, en cambio, valida por contrato que este monitor no pueda desactivar sus guardrails. La comprobación externa se realiza contra producción tras cada cambio real de `production-v9`.

## Interpretación

- `pass`: desde ese runner y en ese instante, TLS, redirecciones, contenido V9 y evidencia DNS cumplen las invariantes comprobadas.
- `fail`: existe una discrepancia real o no se pudo demostrar una invariante. No autoriza bypass ni inferencias sobre la causa.

Un `pass` no sustituye la administración del proveedor DNS/TLS ni demuestra por sí solo ausencia universal de cachés antiguas, pero aporta una señal externa reproducible y acumulativa muy superior a una única lectura de navegador/crawler.
