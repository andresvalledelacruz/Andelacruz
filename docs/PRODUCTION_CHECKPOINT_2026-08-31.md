# Desgracias.es · Checkpoint verificable de producción

Fecha: 2026-08-31

## Producción verificada

- Rama: `production-v9`
- SHA verificado al iniciar este checkpoint: `a047f21d423b9e8344d398b1e0d8dceb93446061`
- Último cambio fusionado: `safety: exigir evidencia mínima antes de escalar (#97)`.
- La rama sigue sin protección nativa de GitHub (`protected: false`).
- No había pull requests abiertos al iniciar este checkpoint.

## Certificación del SHA actual

El SHA `a047f21d423b9e8344d398b1e0d8dceb93446061` tiene `Engineering Quality Gate` completado con éxito en `production-v9`.

Antes de cualquier siguiente merge deben mantenerse los gates existentes sin rebajar tests ni aserciones de Safety.

## Estado Safety / gobernanza

La base actual incluye, entre otros:

- Critical Safety Gateway P0/P1/P2;
- inventario y tests de rutas críticas;
- invariante no comercial para P0/P1;
- RBAC/autorización del backoffice en evolución;
- decision ledger con saneado y fingerprinting;
- Meta-Brain estratégico gobernado por Safety;
- suelo mínimo de evidencia antes de `SCALE_CANDIDATE`.

La portada V9 permanece fuera del alcance de este cambio y debe seguir tratándose como inmutable salvo petición explícita del propietario.

## Frentes humanos pendientes

### Pendiente de Andrés — protección nativa de `production-v9`

Issue #78. Configurar ruleset/branch protection que exija PR y gates obligatorios, impida force-push/borrado y limite bypass administrativo.

### Pendiente de Andrés — backup independiente + restore drill real

Issue #83. Falta destino independiente, custodia de credenciales/cifrado, primera copia completa y restauración verificada.

### Pendiente de Andrés — cobertura y gestión de riesgo antes de escalar adquisición

Issue #1. Mantener bloqueado el escalado significativo de adquisición hasta cerrar protocolo de seguridad, EIPD/RGPD, clausulado y cobertura de riesgo adecuada.

## Siguiente prioridad autónoma

Mientras los tres puntos humanos anteriores permanecen abiertos, el trabajo autónomo debe seguir priorizando, por este orden:

1. Safety Brain / P0-P1 / RBAC / moderación y trazabilidad.
2. Resiliencia, observabilidad, tests y deuda técnica.
3. UX móvil, accesibilidad y rendimiento sin modificar la portada V9.
4. SEO técnico, indexación, hubs, enlazado, E-E-A-T y AI/GEO.
5. Human Demand Intelligence e internacionalización Native-First.
6. Monetización segura únicamente en rutas y contextos no sensibles.

Para nuevas URLs se mantiene el protocolo completo: necesidad humana real → demanda/SERP/intención → fuentes oficiales actuales → canibalización → YMYL → GO/NO-GO → rama aislada → implementación → Safety Gate específico → Engineering Quality Gate → Production SEO Integrity → revisión editorial → merge solo todo verde → certificación post-merge Engineering + SEO + Pages sobre el mismo SHA.

## Anexo de continuidad — Cáncer y Emergencias accidentales

- Producción real comprobada antes de este ciclo: `a5da17d89e5782c41dac30d8edcec76e33bfc4fc`.
- Ese SHA tiene Engineering Quality Gate, Production SEO Integrity y Pages en verde.
- Cáncer entra como frente independiente: GO estratégico, HOLD de publicación hasta revisión clínica/profesional.
- Ahogamiento, sumersión y sofocación accidentales entra bajo Accidentes/Emergencias accidentales: prevención y arquitectura pueden prepararse; emergencia y contenido posterior quedan en HOLD hasta gate y revisión profesional.
- La portada V9 permanece intacta.

