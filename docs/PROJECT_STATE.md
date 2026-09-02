# Desgracias.es · Estado Maestro del Proyecto

Última revisión: 2026-09-02

Este documento es la **fuente única de verdad operativa** para retomar Desgracias.es desde otro chat, otra sesión o por otro miembro del equipo. Antes de continuar trabajo importante, revisar este archivo y contrastar cualquier afirmación de “ya está en producción” con el estado real de staging/servicios.

Hito técnico de referencia al cierre de esta revisión: `production-v9@56ac3b44e3b103f7375111c1431eba3905c0bd22` (PR #196). Ese SHA quedó certificado por los checks aplicables de ingeniería, SEO, origen/TLS y despliegue de Pages. **Esto certifica el árbol y su cadena de integración; no convierte por sí solo todos los flujos o servicios de plataforma en PRODUCCIÓN VERIFICADA.**

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
- **Brújula de siguiente paso**: microbatería adaptativa de proporcionalidad, impacto y resiliencia, no diagnóstica;
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
11. `No urgente` nunca significa `sin importancia`: la proporcionalidad debe reducir dramatización sin invalidar el problema.
12. Los factores de resiliencia/protección jamás rebajan una señal crítica P0/P1.

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

### 7.1 Brújula de siguiente paso / resiliencia

Implementada el 2026-09-02 y ya integrada en `production-v9`:

- `src/next-step-compass.js`
- `docs/NEXT_STEP_COMPASS.md`
- `tests/next-step-compass.test.js`
- `tests/executive-compass-integration.test.js`

La Brújula es una microbatería adaptativa, no un test psicológico. Tiene un máximo de seis dimensiones y termina antes cuando ya existe información suficiente:

1. seguridad inmediata;
2. necesidades básicas/cuidado imprescindible;
3. impacto funcional;
4. tendencia (mejora/estable/empeora);
5. apoyo seguro disponible;
6. reversibilidad de decisiones importantes.

Salidas operativas V1:

- `IMMEDIATE`
- `PRIORITY`
- `PROGRESSIVE`
- `MANAGEABLE`

Reglas permanentes:

- Safety Gateway tiene precedencia absoluta;
- una respuesta explícita de seguridad puede activar `IMMEDIATE` aunque el texto libre no contenga una palabra clave;
- muchos factores protectores nunca neutralizan P0/P1;
- `MANAGEABLE` significa abordable con recursos y pasos pequeños, no irrelevante;
- `PRIORITY` no equivale automáticamente a necesidad clínica: dinero, trabajo, derecho, vivienda o relaciones siguen su ruta multidisciplinar real;
- no diagnóstico, no predicción individual y no decisión clínica automática;
- minimización de datos y prohibición de targeting/remarketing sensible.

Estado: **integrado y certificado en la rama protegida `production-v9`; interfaz pública específica de la Brújula aún no se considera STAGING VERIFICADO ni PRODUCCIÓN VERIFICADA hasta completar UX accesible, fixtures de frontera y prueba viva del flujo.**

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
- `tests/executive-compass-integration.test.js`

Modo `user_case`:

- `SAFETY_GATEWAY`
- `HUMAN_REVIEW`
- `ROUTE_WITH_GUARDRAILS`

El resultado `user_case` incorpora además `next_step_compass`. Una Brújula completa con resultado `IMMEDIATE` fuerza `SAFETY_GATEWAY`, cierra interfaz comercial y cambia la analítica a modo mínimo/agregado. Los resultados `PRIORITY`, `PROGRESSIVE` y `MANAGEABLE` conservan el routing multidisciplinar y no se convierten automáticamente en una conclusión clínica.

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

Pendiente de verificación viva tras la integración de la Brújula: confirmar que el brief servido por el Centro de Mando expone `next_step_compass` y que un `IMMEDIATE` sintético mantiene el fail-closed completo.

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

Issue humano asociado: #117, identidad individual + AAL2 para moderación sensible. No se debe resolver rebajando RBAC ni restaurando acceso sensible a token compartido.

## 12. Ingeniería y Quality Gate

GitHub Actions:

`.github/workflows/quality-gate.yml`

En cada push/PR gobernado:

- Node 20;
- instalación de dependencias;
- `node --check` sobre `src`, `ops`, `tests`;
- `npm test`;
- invariantes SEO cuando corresponda;
- despliegue/preview y comprobaciones de origen aplicables.

Suite actual incluye, entre otras:

- anti-abuse;
- critical safety taxonomy;
- decision ledger;
- executive decision engine;
- next-step compass;
- executive/compass integration;
- human needs router;
- moderation triage;
- multidisciplinary case map;
- story update policy;
- auditorías transversales de accesibilidad, rendimiento y Safety editorial.

`production-v9` está protegida y exige actualmente `Node tests and syntax` + `SEO invariants`; las integraciones se realizan por PR serializado y se certifican después del merge sobre el SHA resultante. La portada V9 queda fuera de alcance salvo petición explícita del usuario.

La rama `main` mantiene un papel distinto y no debe confundirse con `production-v9` al certificar el sitio público.

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

Durante 2026-09-01/02 se ha reforzado contenido de duelo, dinero, soledad, familia, rupturas y trabajo mediante piezas más profundas y gates Narrative/Safety específicos, junto con investigación internacional Native-First y endurecimiento transversal de accesibilidad. No se debe medir ese avance solo por número de URLs: el objetivo es profundidad, seguridad y utilidad diferenciada.

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

Existe además un firewall regresivo para impedir monetización/CTA comercial en rutas P0/P1 y de alto riesgo. Safety puede bloquear negocio aunque las métricas comerciales sean favorables.

## 17. Estado de staging / hito técnico

Core histórico:

`V32.3 → V33A → V33A.1 → V33A.2 → V33B staging real`

Staging ya existe y se ha usado manualmente para formularios, moderación, publicación, Historias y Nadie Solo.

Hitos técnicos del 2026-09-02:

- Brújula V1 integrada en código y tests mediante PR #195;
- Brújula conectada al Executive Decision Engine mediante PR #196;
- `production-v9@56ac3b44e3b103f7375111c1431eba3905c0bd22` certificado con Node, SEO, Cloudflare Pages, build/deploy y TLS/DNS/V9 origin verdes;
- ninguna de estas integraciones modifica la portada V9 ni añade todavía una nueva superficie pública de la Brújula.

No confundir esto con “producción completamente lista”. Todavía faltan, entre otros, identidad staff real, observabilidad/resiliencia completa, restore drill independiente, prueba viva de nuevos motores, Google/analytics reales, pagos, profesionales reales y revisión legal final.

## 18. Prioridades inmediatas recomendadas

### P0 — Verificación viva del Centro de Mando + Brújula
1. Confirmar que Render ha desplegado la versión actual de `ops-api` y `ops/`.
2. Probar una historia sintética normal y comprobar `ROUTE_WITH_GUARDRAILS` + `next_step_compass` incompleta/normal.
3. Probar `compass_answers.safety_now=yes` en fixture sintético controlado y comprobar `SAFETY_GATEWAY`, interfaz comercial cerrada y analítica mínima.
4. Probar un fixture crítico por texto y comprobar que Safety Gateway sigue teniendo precedencia.
5. Comprobar cola Safety y auditoría resultante.

### P1 — Validar Brújula V1 en staging antes de UX pública
- ampliar fixtures de frontera y combinaciones de factores protectores/riesgo;
- comprobar que Safety nunca puede ser rebajada por resiliencia;
- validar lenguaje humano de `MANAGEABLE/PROGRESSIVE/PRIORITY` sin invalidación ni alarmismo;
- diseñar formulario accesible y navegación por teclado/lector de pantalla;
- medir solo longitud/abandono de forma privacy-minimized, sin datos sensibles para publicidad;
- no publicar una puntuación clínica ni un “diagnóstico disfrazado”.

### P2 — Cerrar Qué pasó después de punta a punta
Nueva historia con autorización de autor → moderación → publicación → actualización → moderación → nuevo tramo temporal → seguidor detecta novedad.

### P3 — Endurecer backoffice
RBAC + identidad nominal + MFA AAL2 + separación de funciones + historial de decisión + apelaciones.

### P4 — Observabilidad / resiliencia
Logs estructurados, alertas, distributed rate limiting, backups/PITR, destino independiente, restore drill, health/readiness, fallos de cola y runbooks.

### P5 — Google Launch real
Search Console dominio, sitemap/robots/canonical finales, GA4/GTM/Consent Mode, conversiones mínimas sin datos sensibles, CWV de campo.

## 19. HOLD humanos que no deben detener el trabajo autónomo

Mantener aislados y continuar alrededor de ellos:

- #147: acreditar procedencia/licencia del asset V9 `manos-apoyo`;
- #117: identidad individual + AAL2 para moderación sensible;
- #111: revisión profesional de ahogamiento/sumersión/sofocación;
- #110: revisión clínica/legal y credenciales para Cáncer;
- #83: destino independiente de backup + restore drill real;
- #1: seguro y gestión de riesgo antes de escalar tráfico.

Estos HOLD bloquean únicamente los frentes a los que pertenecen. No justifican parar investigación, testing, contenido seguro, accesibilidad, SEO, infraestructura independiente ni documentación.

## 20. Cómo retomar desde un chat nuevo

Pegar o indicar al nuevo chat:

> Trabajamos en Desgracias.es. Usa el repositorio GitHub `andresvalledelacruz/Andelacruz` como fuente técnica y lee primero `docs/PROJECT_STATE.md`. Continúa desde “Prioridades inmediatas recomendadas”. No afirmes que algo está live sin verificar staging. Mantén Safety, privacidad y valor humano por encima de growth/monetización. Explícame los pasos de usuario de forma muy sencilla, pero ejecuta autónomamente todo lo que puedas desde ingeniería.

Después, si hace falta detalle de un subsistema, consultar:

- `docs/NEXT_STEP_COMPASS.md`
- `docs/AUTHOR_UPDATE_FLOW.md`
- `docs/GOOGLE_ENGINEERING_GROWTH_OS_2026.md`
- `src/next-step-compass.js`
- `src/executive-decision-engine.js`
- `src/critical-safety-taxonomy.js`
- `src/human-needs-router.js`
- `src/multidisciplinary-case-map.js`
- `src/ops-api.js`
- `ops/index.html`

## 21. Regla de estado

Usar siempre estas etiquetas:

- **IDEA**: todavía conceptual.
- **PREPARADO**: código/documentación creada, no verificado en entorno real.
- **STAGING VERIFICADO**: probado contra servicios de staging.
- **PRODUCCIÓN VERIFICADA**: desplegado, observado y validado en producción.

No saltar de PREPARADO a PRODUCCIÓN VERIFICADA sin evidencia real. Un check verde de CI/Pages certifica ese artefacto o despliegue concreto, no sustituye la prueba funcional del flujo completo.
