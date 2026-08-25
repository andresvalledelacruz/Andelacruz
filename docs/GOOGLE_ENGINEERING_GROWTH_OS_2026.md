# Desgracias.es · Google Engineering & Growth OS · 2026

Estado: modelo operativo de dirección para staging y preparación de lanzamiento.

## Objetivo

Tratar Google como un sistema transversal de adquisición, medición, calidad técnica, rendimiento, reputación y monetización, no como un conjunto de herramientas aisladas.

Funnel compartido:

`impresión → clic → visita útil → interacción → confianza/recurrencia → siguiente paso → acción útil/lead cualificado → ingreso sostenible → retención`

Ningún equipo optimiza una métrica local a costa de empeorar utilidad, confianza, seguridad, privacidad o rentabilidad global.

## Consejo Google

Áreas coordinadas:

- Search / SEO técnico / arquitectura web
- Search Console / indexación / sitemaps / inspección de URLs
- Core Web Vitals / PageSpeed / Lighthouse / CrUX
- Contenido people-first / E-E-A-T / YMYL / fuentes
- Datos estructurados válidos y vigentes
- GA4 / GTM / atribución / conversiones
- Consent Mode / privacidad / minimización de datos
- Google Ads / campañas de intención / medición fiable
- Looker Studio / BigQuery cuando haya escala y necesidad
- Discover / AI features / cambios de Search cuando aporten valor
- Local SEO y Business Profile solo si existe una presencia física o servicio local real que lo justifique

## Reglas no negociables

1. No fabricar volúmenes, CPC, CTR, rankings ni conversiones.
2. No publicar páginas masivas o doorway pages para capturar búsquedas.
3. No usar historias libres, texto emocional, diagnósticos inferidos ni atributos sensibles como parámetros de analítica o targeting publicitario.
4. En contenido YMYL, priorizar autoría real, revisión, fuentes oficiales y claridad de límites profesionales.
5. Search Console y GA4 miden; no sustituyen decisiones de producto.
6. Google Ads solo escala cuando la conversión principal está definida y medida de forma fiable.
7. No usar remarketing sensible basado en crisis personales, salud mental, violencia, deuda, duelo u otras situaciones vulnerables.
8. El consentimiento debe respetar la elección del usuario; las etiquetas no esenciales no deben activarse fuera del marco legal aplicable.
9. El marcado estructurado debe representar fielmente contenido visible y usar únicamente tipos vigentes y adecuados.
10. La estrategia se actualiza con documentación oficial de Google; no se congela en una checklist histórica.

## Prioridades para Desgracias.es

### P0 · Lanzamiento técnico

- propiedad de dominio en Search Console
- sitemap limpio con URLs 200, canónicas e indexables
- robots.txt sin bloqueos accidentales
- canonical coherente
- HTTPS y cabeceras seguras
- staging con noindex y fuera del índice
- producción separada del backoffice
- Core Web Vitals vigilados
- páginas clave accesibles y renderizables
- 404 reales y redirecciones 301 sin cadenas

### P1 · Medición

- GA4 con eventos mínimos y útiles
- GTM controlado
- Consent Mode conforme al consentimiento
- conversiones principales: historia enviada, historia aprobada/publicada, recurso útil, lead cualificado, contratación profesional cuando exista
- exclusión de datos sensibles de URLs, eventos, user properties y parámetros
- Search Console ↔ GA4 cuando esté disponible

### P2 · Crecimiento orgánico

- clústeres por intención y etapa vital
- enlazado interno por evento → fase → recurso → experiencia → profesional
- contenido original con experiencia, revisión y fuentes
- actualización editorial y control de canibalización
- Search Console Insights y Performance para detectar crecimiento, caída, CTR y oportunidades

### P3 · Paid acquisition

- campañas de búsqueda por intención, separando información de intención profesional/comercial
- Smart Bidding solo con suficiente señal de conversión fiable
- nada de audiencias sensibles ni creatividad explotativa
- evaluación por lead aceptado / ingreso, no por clic barato

## Core Web Vitals 2026

Objetivos de buena experiencia:

- LCP < 2,5 s
- INP < 200 ms
- CLS < 0,1

Se usan datos de campo cuando existan y laboratorio para depuración. No perseguimos una puntuación de Lighthouse como fin en sí mismo.

## Correcciones de herramientas/listas antiguas

- FID fue reemplazado por INP como Core Web Vital.
- Google Optimize cerró en septiembre de 2023; no debe figurar como herramienta activa.
- Mobile-Friendly Test y Mobile Usability report fueron retirados en diciembre de 2023; usar Lighthouse, DevTools, pruebas reales y guía de experiencia móvil.
- FAQ rich results fueron retirados de Google Search en mayo de 2026; no construir estrategia de visibilidad alrededor de FAQPage rich results.
- El marcado estructurado no garantiza rich results y debe seguir la galería y políticas vigentes.
- AMP, Google Domains y otras piezas históricas no son requisitos estratégicos para este proyecto.

## Google + Safety

Si una sesión entra en modo de seguridad crítica P0/P1:

- se suprimen anuncios, remarketing, ofertas y CRO comercial
- no se envía texto sensible a GA4/GTM/Ads
- solo se registra telemetría mínima y agregada necesaria para fiabilidad del sistema
- la prioridad es recurso oficial, seguridad y revisión humana

## Cadencia de dirección

Semanal:
- indexación y errores de Search Console
- queries/páginas en subida y caída
- CTR y posición sin vanity metrics
- CWV y regresiones
- conversiones y calidad de leads
- experimentos CRO/SEO activos
- incidentes de privacidad/safety

Mensual:
- arquitectura de contenidos
- oportunidad competitiva
- rendimiento por clúster
- coste/lead e ingreso por canal
- actualización de documentación oficial de Google y deprecaciones

## Regla de decisión

Toda iniciativa Google debe responder:

1. ¿Qué necesidad del usuario resuelve?
2. ¿Qué señal de Google/datos la justifica?
3. ¿Qué riesgo humano, legal o de privacidad introduce?
4. ¿Qué métrica de negocio valida su utilidad?
5. ¿Qué haríamos distinto o mejor que los competidores?

Si no hay respuesta clara, no se escala.
