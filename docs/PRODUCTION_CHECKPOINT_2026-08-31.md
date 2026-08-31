# Desgracias.es · Checkpoint verificable de producción

Fecha: 2026-08-31

## Producción verificada

- Rama: `production-v9`
- SHA verificado: `106d3366e93597b0665a1a8cbd1d62132bfed9bc`
- Último cambio fusionado: `feat: crear hub propio de Gestión emocional (#124)`.
- Resultado funcional del cambio: `/gestion-emocional/`, conexión desde Recursos, sitemap y Opportunity Map ampliados a 60 URLs, manteniendo Safety/SEO y la portada V9 sin cambios visuales.
- Pull requests abiertos al iniciar este checkpoint: 0.
- La rama continúa sin protección nativa de GitHub (`protected: false`).

## Certificación del SHA actual

Para `106d3366e93597b0665a1a8cbd1d62132bfed9bc` se ha verificado `Production SEO Integrity` completado con éxito sobre `production-v9`.

Antes de cualquier siguiente merge deben mantenerse todos los gates existentes. No se permite rebajar tests, aserciones Safety ni la protección lógica de V9 para acelerar entregas.

## Safety / gobernanza

La base vigente incluye:

- Critical Safety Gateway P0/P1/P2;
- inventario y tests de rutas críticas;
- invariante no comercial para P0/P1;
- RBAC/autorización en evolución;
- decisión sensible fail-closed cuando falta identidad/AAL2;
- decision ledger y trazabilidad;
- Meta-Brain gobernado por Safety;
- suelo mínimo de evidencia antes de escalar recomendaciones;
- Safety Gates específicos para piezas sensibles ya incorporadas.

## Portada V9

La portada V9 permanece **inmutable** salvo petición explícita de Andrés. Nuevos hubs, contenido, SEO, narrativa y producto deben evolucionar sin alterar su diseño, estructura visual, tarjetas, espaciados, colores o composición salvo instrucción expresa.

## Pendientes humanos abiertos

### Issue #117 — identidad individual + AAL2 para moderación sensible

**Pendiente de Andrés.** Falta seleccionar/autorizar proveedor de identidad de staff y validar identidad nominal, MFA/AAL2, revocación y roles. Mientras tanto, las capacidades sensibles permanecen fail-closed.

### Issue #110 — frente Cáncer

**Pendiente de Andrés.** Inteligencia y arquitectura pueden seguir avanzando; publicación clínica queda en HOLD hasta revisión profesional, legal y de credenciales.

### Issue #111 — ahogamiento, sumersión y sofocación

**Pendiente de Andrés.** Prevención y preparación interna pueden avanzar; publicación de emergencia/maniobras/postevento queda en HOLD hasta revisión profesional.

### Issue #83 — backup independiente + restore drill

**Pendiente de Andrés.** Falta destino externo independiente, custodia de credenciales/cifrado, primera copia y restauración real verificable.

### Issue #78 — protección de `production-v9`

**Pendiente de Andrés.** Falta ruleset/branch protection nativa que exija PR y checks y bloquee force-push/borrado.

### Issue #1 — seguro y gestión de riesgo antes de escalar tráfico

**Pendiente de Andrés.** No escalar adquisición significativa hasta cerrar protocolo, cobertura, privacidad/EIPD y revisión jurídica aplicable.

## Frentes autónomos activos

1. Safety Brain / P0-P1 / RBAC / moderación y trazabilidad.
2. Knowledge → Narrative Engine para explotar el corpus documental de Andrés.
3. Human Demand Intelligence y radar de nuevas necesidades.
4. SEO técnico, indexación, hubs, interlinking, E-E-A-T y AI/GEO.
5. UX móvil, accesibilidad y rendimiento sin tocar V9.
6. Backoffice, observabilidad y Product Readiness.
7. Resiliencia, tests, deuda técnica y DR preparado hasta el límite de credenciales disponibles.
8. Monetización segura solo en contextos no sensibles; P0/P1 y alto riesgo sin monetización.
9. International Expansion & Localization Intelligence Native-First, sin fingir expertos locales reales.

## Protocolo obligatorio para nuevas URLs

`necesidad humana real → demanda/SERP/intención → fuentes oficiales actuales → canibalización → YMYL → GO/NO-GO → rama aislada → implementación → Safety Gate específico → Engineering Quality Gate → Production SEO Integrity → revisión editorial → merge solo todo verde → certificación post-merge Engineering + SEO + Pages sobre el mismo SHA`

## Siguiente prioridad autónoma

Con producción limpia y sin PRs abiertos, el siguiente ciclo debe:

- convertir el corpus de conocimiento ya disponible en profundidad narrativa visible;
- enriquecer primero URLs existentes de alto valor antes de inflar volumen;
- mantener investigación paralela de nuevas URLs;
- continuar endurecimiento Safety/observabilidad/DR sin bloquear contenido independiente;
- crear ramas aisladas por frente y evitar editar los mismos archivos desde bases divergentes;
- registrar cualquier dependencia humana y continuar por otro frente inmediatamente.
