# Desgracias.es · Estado Maestro del Proyecto

Última revisión: 2026-08-27

Este documento es la **fuente única de verdad operativa** para retomar Desgracias.es desde otro chat, otra sesión o por otro miembro del equipo. Antes de continuar trabajo importante, revisar este archivo y contrastar cualquier afirmación de “ya está en producción” con el estado real de staging/servicios.

## 1. Visión del producto

Desgracias.es es una plataforma española orientada a personas que atraviesan situaciones difíciles. El producto debe ser humano, sencillo, seguro y útil, sin convertir el sufrimiento en popularidad ni explotar vulnerabilidad.

Principio de navegación:

`evento → comprensión → experiencias similares → siguiente paso → recursos → comunidad → profesionales/servicios adecuados → seguimiento → qué pasó después`

Diferenciación principal:

- historias estructuradas por evento y fase temporal;
- **Qué pasó después**: evolución de la historia en el tiempo;
- **Nadie Solo**: prioridad temporal a historias sin una primera señal comunitaria, sin rankings;
- **Personas que ya estuvieron aquí**: acompañamiento por experiencia vivida, separado de atención clínica/profesional;
- lectura **multidisciplinar** de necesidades, no “todo es psicología”;
- Safety Gateway para situaciones críticas;
- Growth/Google y monetización subordinados a confianza, privacidad y seguridad.

## 2. Principios no negociables

1. No fabricar historias, apoyos, respuestas, seguidores, métricas ni resultados.
2. No usar dislikes ni rankings de sufrimiento.
3. No publicar historias sensibles sin moderación humana.
4. No diagnosticar, prescribir, emitir peritajes ni suplantar profesionales acreditados.
5. No psicologizar automáticamente problemas jurídicos, económicos, laborales o sociales.
6. No usar historias libres, crisis personales ni atributos sensibles para targeting/remarketing.
7. Safety y privacidad pueden bloquear negocio, growth y CRO.
8. Una insignia profesional verificada no se puede comprar.
9. Staging usa contenido sintético; producción y staging deben permanecer separados.
10. `robots/noindex` nunca sustituye autenticación real de backoffice.

## 3. Equipo multidisciplinar de dirección

Desgracias.es opera conceptualmente con cuatro consejos coordinados:

### Human Multidisciplinary Council
Psicología, psiquiatría, duelo, pareja/familia, psicología social, trabajo, orientación laboral, mediación, derecho, economía práctica, trabajo social, sueño/hábitos, neuropsicología y otras disciplinas cuando corresponda.

### Digital Product & Engineering Council
Producto, UX/UI, UX research, arquitectura de información, frontend, backend, full-stack, DevOps, DBA, seguridad, APIs, performance, accesibilidad, CRO, CRM, soporte, analítica y operaciones.

### Trust & Safety Council
Moderación, crisis, violencia, autolesión, safeguarding, abuso, privacidad, incidentes y revisión humana de decisiones sensibles.

### Google Engineering & Growth Council
Search Console, SEO técnico, arquitectura de URLs, Core Web Vitals, contenido people-first/YMYL, GA4, GTM, Consent Mode, Ads, medición, Search/Discover y crecimiento.

Orden de autoridad:

`critical safety → privacy/security → human user value → UX/accessibility → engineering quality → Google/growth/measurement → business economics`

## 4. Stack técnico actual

Arquitectura objetivo/preparada:

- Cloudflare Pages: frontend público / CDN / DNS.
- Render Frankfurt: API pública + servicio interno de operaciones + worker/procesador.
- Supabase Postgres Frankfurt: base de datos, Auth/MFA objetivo, Storage privado y pgmq/Queues.
- Node.js / Fastify / PostgreSQL.

Servicios de staging ya utilizados:

- frontend: `desgracias-staging.pages.dev`
- API pública: `desgracias-api-staging.onrender.com`
- operaciones: `desgracias-ops-staging.onrender.com`

El panel interno de staging sigue protegido por `STAGING_OPS_TOKEN`; producción debe migrar a identidad, roles y MFA AAL2.

## 5. Flujos validados manualmente en staging

### Historias
Validado de punta a punta:

`formulario → cola moderation → panel humano → aprobar → internal_tasks → procesador → publicación → listado Historias → ficha completa`

Una historia ficticia de prueba pasó por el circuito completo y apareció públicamente en staging tras aprobación humana.

### Nadie Solo
Validado:

`historia publicada sin señales → etiqueta Nadie Solo → usuario pulsa “Te acompaño” → señal registrada → historia deja de necesitar prioridad`

No se muestran contadores públicos ni rankings.

### Seguimiento privado
Validado visualmente:

- `Seguir historia` persiste de forma privada en el navegador de staging.
- La interfaz muestra `Qué pasó después` sin inventar actualizaciones.

## 6. Qué pasó después / autoría

Fundación técnica creada:

- `src/story-update-policy.js`
- `docs/AUTHOR_UPDATE_FLOW.md`
- migración SQL de staging para actualizaciones.

Principios:

- una actualización no reescribe la historia original;
- cada actualización es un tramo temporal independiente;
- toda actualización pasa por moderación;
- el autor debe demostrar autorización;
- staging usa una clave local transitoria; producción debe usar identidad recuperable.

Pendiente: cerrar el circuito vivo completo de nueva historia con autorización de autor → actualización → moderación → publicación temporal.

## 7. Motor Multidisciplinar de Necesidades

Implementado en código:

- `src/human-needs-router.js`
- `src/multidisciplinary-case-map.js`
- tests correspondientes.

Rutas principales actuales:

- apoyo emocional/experiencias;
- duelo/transición;
- pareja/familia/mediación;
- trabajo/carrera;
- economía práctica;
- jurídico/mediación;
- comunidad/pertenencia;
- sueño/estrés/hábitos;
- revisión profesional de salud mental;
- seguridad urgente.

El motor es explicable y **no diagnóstico**. Se usa para orientar producto, moderación y recursos; no para emitir conclusiones clínicas o periciales.

## 8. Critical Safety Gateway

Implementado en código:

- `src/critical-safety-taxonomy.js`
- tests específicos.

Niveles:

- **P0**: emergencia inmediata.
- **P1**: riesgo alto / atención urgente.
- **P2**: situación grave no necesariamente inmediata.
- `NONE`: sin señal crítica explícita.

Cuando P0/P1 activa Safety Gateway:

- revisión humana prioritaria;
- interfaz comercial bloqueada;
- analítica mínima/agregada;
- no hay decisión clínica automática;
- se muestran recursos oficiales adecuados cuando corresponda.

España: recursos base contemplados 112, 024 y 016 según el tipo de crisis; deben mantenerse validados con fuentes oficiales antes de producción.

## 9. Executive Decision Engine

Implementado:

- `src/executive-decision-engine.js`
- `tests/executive-decision-engine.test.js`

Modo `user_case`:

- `SAFETY_GATEWAY`
- `HUMAN_REVIEW`
- `ROUTE_WITH_GUARDRAILS`

Modo `product_change`:

- `BLOCKED`
- `HOLD`
- `EXPERIMENT`
- `SCALE_CANDIDATE`

Evalúa valor humano, evidencia, UX, ingeniería, seguridad/privacidad, Safety, Google/calidad, medición, negocio y mantenibilidad.

Hard blocks incluyen explotación de vulnerabilidad, targeting sensible, saltarse revisión Safety, YMYL no revisado, exposición de secretos/PII, tracking no esencial sin consentimiento, venta de insignias de calidad y dark patterns.

## 10. Centro de Mando interno

El backoffice `ops/` ya contiene:

- métricas de colas;
- cola ordenada por prioridad Safety;
- brief ejecutivo de cada historia;
- nivel Safety;
- necesidad principal;
- disciplinas sugeridas;
- modo comercial/analítica;
- controles de moderación;
- Consejo Ejecutivo de Producto con puntuación y hard blocks.

El cálculo **no se hace en el navegador**: `src/ops-api.js` importa `evaluateExecutiveDecision` y expone un brief autoritativo de servidor.

Regla crítica ya implementada en servidor:

si `Executive Decision Engine` devuelve `SAFETY_GATEWAY`, la API rechaza cualquier decisión que no sea `escalate`.

El endpoint `/ops/product/evaluate` también calcula la decisión de producto en servidor.

## 11. Moderación y trazabilidad

La cola de moderación se ordena por prioridad Safety y luego antigüedad.

Las decisiones incluyen un `executive_brief` resumido en el evento de auditoría antes de archivar el mensaje de moderación.

Existe trabajo de `decision ledger` y tests para gobernanza/auditoría.

Pendiente antes de producción:

- RBAC real;
- roles separados (moderación, safety, admin, analista);
- MFA AAL2 para acciones privilegiadas;
- historial append-only/tamper-evident;
- apelaciones/revisión de decisiones sensibles;
- no depender de token compartido.

## 12. Ingeniería y Quality Gate

GitHub Actions:

`.github/workflows/quality-gate.yml`

En cada push/PR a `main`:

- Node 20;
- instalación de dependencias;
- `node --check` sobre `src`, `ops`, `tests`;
- `npm test`.

Suite actual incluye, entre otras:

- anti-abuse;
- critical safety taxonomy;
- decision ledger;
- executive decision engine;
- human needs router;
- moderation triage;
- multidisciplinary case map;
- story update policy.

Nota: la rama `main` no está actualmente protegida con required status checks; endurecer antes de producción/equipo ampliado.

## 13. Google Engineering & Growth OS

Documento:

`docs/GOOGLE_ENGINEERING_GROWTH_OS_2026.md`

Funnel común:

`impresión → clic → visita útil → interacción → confianza/recurrencia → siguiente paso → acción útil/lead cualificado → ingreso sostenible → retención`

Reglas:

- no inventar volumen/CPC/CTR/ranking/conversiones;
- no doorway pages ni contenido masivo de poco valor;
- no enviar historias/sensibilidad individual a Google;
- Ads solo después de medir conversiones fiables;
- Safety P0/P1 suprime Ads/CRO comercial/remarketing;
- revisar siempre documentación oficial vigente de Google.

Correcciones históricas ya asumidas:

- INP sustituyó FID;
- Google Optimize cerrado;
- Mobile-Friendly Test y antiguo Mobile Usability report retirados;
- no basar estrategia 2026 en FAQ rich results;
- AMP/Google Domains no son requisitos estratégicos.

## 14. SEO / contenido público preparado

Existe trabajo previo de arquitectura SEO, Google Growth OS, Search Demand Engine, inteligencia competitiva e internacional.

Principios permanentes:

- contenido people-first;
- especial cuidado YMYL;
- autoría/revisión/fuentes cuando corresponda;
- distinct URLs + hreflang en internacional;
- no traducción masiva sin revisión cultural en contenido emocional sensible;
- Search Console como fuente de demanda/resultado, no como vanity dashboard.

## 15. Personas que ya estuvieron aquí

Concepto definido como red de acompañamiento por experiencia vivida.

Niveles diseñados:

- L1 Acompañante;
- L2 Experiencia vivida autorizada;
- L3 Avanzado;
- L4 Profesional verificado (rol separado; experiencia vivida ≠ consejo profesional).

Matching objetivo:

`evento + fase + idioma + mercado + disponibilidad + autorización + carga + calidad + seguridad`

Safety bloquea matching directo ante peligro inmediato, ideación suicida activa, violencia activa, emergencia médica, safeguarding de menores/dependientes, etc.

Pendiente: backoffice real con RBAC, autorización de categorías, simulaciones, incidencias, recertificación, capacidad y apelaciones.

## 16. Monetización

Modelo preferente:

- profesionales PRO;
- leads cualificados;
- partners seleccionados;
- futuro B2B / Desgracias Empresas;
- publicidad como complemento, no motor principal.

Reglas:

- monetizar valor organizado, no vulnerabilidad;
- PRO no compra calidad ni verificación;
- no remarketing sensible;
- medir lead aceptado, ingreso, CAC/LTV/churn/payback, no solo clics;
- pagos con proveedor PCI; nunca guardar PAN/CVV.

## 17. Estado de staging / hito técnico

Core histórico:

`V32.3 → V33A → V33A.1 → V33A.2 → V33B staging real`

Staging ya existe y se ha usado manualmente para formularios, moderación, publicación, Historias y Nadie Solo.

No confundir esto con “producción lista”. Todavía faltan endurecimiento, identidad staff real, observabilidad, pruebas integrales de nuevos motores, Google/analytics reales, pagos, profesionales reales y revisión legal final.

## 18. Prioridades inmediatas recomendadas

### Meta-Brain estratégico (PREPARADO)

El sistema interno incorpora una biblioteca gobernada de 99 marcos de razonamiento y la clasificación completa de los 120 prompts de negocio/gestión emocional. Safety conserva autoridad de bloqueo; P0/P1 no se monetiza y YMYL/legal/fiscal/datos sensibles/servicios profesionales requieren fuentes oficiales actuales y revisión humana/profesional. Ver `docs/STRATEGIC_META_BRAIN.md` y `src/strategic-meta-brain.js`.

### P0 — Verificación live del Centro de Mando
1. Confirmar que Render ha desplegado la versión actual de `ops-api` y `ops/`.
2. Probar una historia sintética normal y comprobar `ROUTE_WITH_GUARDRAILS`.
3. Probar un fixture sintético crítico controlado y comprobar `SAFETY_GATEWAY` + imposibilidad de aprobar.
4. Comprobar cola safety y auditoría resultante.

### P1 — Cerrar Qué pasó después de punta a punta
Nueva historia con autorización de autor → moderación → publicación → actualización → moderación → nuevo tramo temporal → seguidor detecta novedad.

### P2 — Endurecer backoffice
RBAC + MFA AAL2 + separación de funciones + historial de decisión + apelaciones.

### P3 — Observabilidad / resiliencia
Logs estructurados, alertas, distributed rate limiting, backups/PITR, restore drill, health/readiness y fallos de cola.

### P4 — Google Launch real
Search Console dominio, sitemap/robots/canonical finales, GA4/GTM/Consent Mode, conversiones mínimas sin datos sensibles, CWV de campo.

## 19. Cómo retomar desde un chat nuevo

Pegar o indicar al nuevo chat:

> Trabajamos en Desgracias.es. Usa el repositorio GitHub `andresvalledelacruz/Andelacruz` como fuente técnica y lee primero `docs/PROJECT_STATE.md`. Continúa desde “Prioridades inmediatas recomendadas”. No afirmes que algo está live sin verificar staging. Mantén Safety, privacidad y valor humano por encima de growth/monetización. Explícame los pasos de usuario de forma muy sencilla, pero ejecuta autónomamente todo lo que puedas desde ingeniería.

Después, si hace falta detalle de un subsistema, consultar:

- `docs/AUTHOR_UPDATE_FLOW.md`
- `docs/GOOGLE_ENGINEERING_GROWTH_OS_2026.md`
- `src/executive-decision-engine.js`
- `src/critical-safety-taxonomy.js`
- `src/human-needs-router.js`
- `src/multidisciplinary-case-map.js`
- `src/ops-api.js`
- `ops/index.html`

## 20. Regla de estado

Usar siempre estas etiquetas:

- **IDEA**: todavía conceptual.
- **PREPARADO**: código/documentación creada, no verificado en entorno real.
- **STAGING VERIFICADO**: probado contra servicios de staging.
- **PRODUCCIÓN VERIFICADA**: desplegado, observado y validado en producción.

No saltar de PREPARADO a PRODUCCIÓN VERIFICADA sin evidencia real.

