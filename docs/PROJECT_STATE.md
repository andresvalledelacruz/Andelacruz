# Desgracias.es · Estado Maestro del Proyecto

Última revisión: 2026-09-07

Este documento es la **fuente única de verdad operativa** para retomar Desgracias.es desde otro chat, otra sesión o por otro miembro del equipo. Antes de continuar trabajo importante, revisar este archivo y contrastar cualquier afirmación de “ya está en producción” con el estado real de staging/servicios.

Hito técnico de referencia al cierre de esta revisión: `production-v9@910e69aa83e5d2965ab310d1e663feaf9e84e41c` (merge PR #206). Ese SHA quedó certificado por Node/tests, SEO invariants, build, deploy, Cloudflare Pages y TLS/DNS/V9 origin. **Esto certifica el árbol y su cadena de integración; no convierte por sí solo todos los flujos o servicios de plataforma en PRODUCCIÓN VERIFICADA.**

## 0. Foto ejecutiva de control · 2026-09-07

Estado actual:

- `production-v9` protegida y serializada;
- portada V9 intacta;
- último SHA certificado: `910e69aa83e5d2965ab310d1e663feaf9e84e41c`;
- PR #201–#206 fusionados;
- sin PR técnico pendiente antes de abrir esta actualización documental;
- Brújula V1 integrada en motor ejecutivo y Ops, con fail-closed Safety;
- matriz exhaustiva de 3.072 combinaciones de Brújula y endurecimiento adicional para `basic_needs=unsure`;
- contenido profundo reforzado en trabajo: miedo a equivocarse y currículum;
- Search & Crisis Routing Intelligence V1 implementado en código, todavía sin interfaz pública;
- clasificador contextual de suicidio evita tratar automáticamente duelo, negación, pasado o contexto informativo como crisis activa;
- integridad de destinos del router blindada para evitar enlaces rotos, fallback `/` o competencia silenciosa entre intents.

Trabajo no considerado todavía PRODUCCIÓN VERIFICADA:

- flujo vivo Centro de Mando + Brújula contra servicios Render;
- interfaz pública accesible de Brújula;
- interfaz pública de búsqueda/orientación natural;
- circuito completo vivo de `Qué pasó después` con autorización recuperable;
- identidad staff, RBAC y MFA AAL2;
- restore drill independiente;
- Google Launch/medición real;
- pagos/profesionales reales y revisión legal final.

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
- **Search & Crisis Routing Intelligence**: orientación por lenguaje natural con Safety contextual y fallback conservador;
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
13. Ante ambigüedad sensible, el sistema prefiere aclarar o revisar antes que adivinar.
14. Una mención contextual de suicidio no equivale automáticamente a crisis suicida activa.

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

Integrada en `production-v9`:

- `src/next-step-compass.js`
- `docs/NEXT_STEP_COMPASS.md`
- `tests/next-step-compass.test.js`
- `tests/executive-compass-integration.test.js`
- `tests/next-step-compass-invariants.test.js`
- `tests/ops-compass-wiring.test.mjs`

La Brújula es una microbatería adaptativa, no un test psicológico. Máximo de seis dimensiones y terminación anticipada cuando existe información suficiente:

1. seguridad inmediata;
2. necesidades básicas/cuidado imprescindible;
3. impacto funcional;
4. tendencia;
5. apoyo seguro disponible;
6. reversibilidad de decisiones importantes.

Salidas operativas V1:

- `IMMEDIATE`
- `PRIORITY`
- `PROGRESSIVE`
- `MANAGEABLE`

Reglas permanentes:

- Safety Gateway tiene precedencia absoluta;
- `safety_now=yes` puede activar `IMMEDIATE` aunque el texto libre no contenga trigger explícito;
- `safety_now=unsure` corta la batería, recomienda revisión humana y suprime interfaz comercial;
- muchos factores protectores nunca neutralizan P0/P1;
- necesidades básicas no cubiertas o inciertas impiden un cierre `MANAGEABLE`;
- `MANAGEABLE` significa abordable con recursos y pasos pequeños, no irrelevante;
- `PRIORITY` no equivale automáticamente a necesidad clínica;
- no diagnóstico, no predicción individual y no decisión clínica automática;
- minimización de datos y prohibición de targeting/remarketing sensible.

La matriz exhaustiva recorre 3.072 combinaciones y blinda invariantes de seguridad, proporcionalidad, routing y no psicologización.

Estado: **código integrado y certificado; interfaz pública específica todavía PREPARADA/pendiente de staging vivo.**

### 7.2 Search & Crisis Routing Intelligence V1

Implementado el 2026-09-07:

- `src/search-crisis-router.js`;
- clasificador contextual integrado en `human-needs-router`;
- tests de routing, contexto suicida e integridad de destinos.

Comportamiento:

- lenguaje natural normalizado;
- tolerancia tipográfica limitada y conservadora;
- crisis suicida activa propia → ayuda urgente P0, 112/024, sin UI comercial;
- preocupación por otra persona → ruta P0 específica;
- duelo por suicidio → posvención P1, no confundido con crisis activa;
- negación, pasado, información o contexto no activan por sí solos crisis activa;
- ambigüedad → `needs_clarification=true` antes que adivinar;
- violencia/agresión sexual P1 suprime UI comercial;
- no conserva ni devuelve la consulta sensible original;
- todos los destinos deben existir localmente; no se admite `/` como fallback;
- intents y URLs deben ser únicos.

Estado: **motor PREPARADO e integrado; interfaz de búsqueda pública todavía no integrada.**

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

El resultado incorpora `next_step_compass`. `IMMEDIATE` fuerza `SAFETY_GATEWAY`, cierra interfaz comercial y cambia analítica a modo mínimo/agregado. Una incertidumbre Safety recomienda `HUMAN_REVIEW`. `PRIORITY`, `PROGRESSIVE` y `MANAGEABLE` conservan routing multidisciplinar y no se convierten automáticamente en una conclusión clínica.

Modo `product_change`:

- `BLOCKED`
- `HOLD`
- `EXPERIMENT`
- `SCALE_CANDIDATE`

Hard blocks incluyen explotación de vulnerabilidad, targeting sensible, saltarse revisión Safety, YMYL no revisado, exposición de secretos/PII, tracking no esencial sin consentimiento, venta de insignias de calidad y dark patterns.

## 10. Centro de Mando interno

El backoffice `ops/` ya contiene:

- métricas de colas;
- cola ordenada por prioridad Safety;
- brief ejecutivo;
- nivel Safety;
- necesidad principal;
- disciplinas sugeridas;
- modo comercial/analítica;
- controles de moderación;
- Consejo Ejecutivo de Producto con puntuación y hard blocks.

`src/ops-api.js` calcula el brief en servidor. Ops reenvía `compass_answers` al Executive Decision Engine, pero el resumen de auditoría conserva únicamente flags agregados de Brújula, no las respuestas crudas.

Reglas fail-closed:

- `SAFETY_GATEWAY` requiere `escalate`;
- Brújula con `human_review_recommended=true` requiere `escalate`;
- story updates sensibles conservan bloqueo específico.

Pendiente de verificación viva: confirmar contra Render que el brief servido refleja estos comportamientos y que la cola/auditoría resultante son coherentes.

## 11. Moderación y trazabilidad

La cola de moderación se ordena por prioridad Safety y luego antigüedad.

Las decisiones incluyen un `executive_brief` resumido en el evento de auditoría antes de archivar el mensaje de moderación.

Existe `decision ledger` y tests para gobernanza/auditoría.

Pendiente antes de producción:

- RBAC real;
- roles separados;
- MFA AAL2;
- historial append-only/tamper-evident;
- apelaciones/revisión de decisiones sensibles;
- no depender de token compartido.

Issue humano asociado: #117.

## 12. Ingeniería y Quality Gate

GitHub Actions gobierna cada push/PR con sintaxis/tests, invariantes SEO y auditorías transversales aplicables. La suite cubre, entre otras áreas:

- anti-abuse;
- critical safety taxonomy;
- decision ledger;
- executive decision engine;
- next-step compass + matriz exhaustiva;
- Ops/Compass wiring;
- human needs router;
- search/crisis router + contextual suicide classifier + route integrity;
- moderation triage;
- multidisciplinary case map;
- story update policy;
- accesibilidad;
- rendimiento;
- Safety editorial;
- Backup/DR;
- privacidad/analítica.

`production-v9` está protegida y exige `Node tests and syntax` + `SEO invariants`; las integraciones se realizan por PR serializado y se certifican después del merge sobre el SHA resultante. La portada V9 queda fuera de alcance salvo petición explícita del usuario.

El SHA `910e69aa83e5d2965ab310d1e663feaf9e84e41c` tiene verdes: Node/tests, SEO invariants, TLS/DNS/V9 origin, build, Cloudflare Pages, deploy y report-build-status.

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
- revisar documentación oficial vigente de Google.

## 14. SEO / contenido público preparado

Existe arquitectura SEO, Google Growth OS, Search Demand Engine, inteligencia competitiva e internacional.

Principios permanentes:

- contenido people-first;
- cuidado YMYL;
- autoría/revisión/fuentes cuando corresponda;
- distinct URLs + hreflang en internacional;
- no traducción masiva sin revisión cultural en contenido emocional sensible;
- Search Console como fuente de demanda/resultado.

Refuerzos recientes:

- `/trabajo/tengo-miedo-de-equivocarme-en-el-trabajo/`: diferencia riesgo real, sistema, cultura punitiva y miedo anticipatorio; controles de decisión y límites profesionales;
- `/trabajo/mi-curriculum-no-funciona/`: separa vacantes, encaje, CV, filtros e entrevista; evidencia, privacidad, falsas ofertas y alternativas públicas/gratuitas.

Los gates recientes han operado sobre un inventario de 60 URLs para accesibilidad/rendimiento. No se debe medir el avance solo por cantidad de URLs: el objetivo es profundidad, seguridad y utilidad diferenciada.

## 15. Personas que ya estuvieron aquí

Concepto definido como red de acompañamiento por experiencia vivida.

Niveles diseñados:

- L1 Acompañante;
- L2 Experiencia vivida autorizada;
- L3 Avanzado;
- L4 Profesional verificado.

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
- medir lead aceptado, ingreso, CAC/LTV/churn/payback;
- pagos con proveedor PCI; nunca guardar PAN/CVV.

Existe firewall regresivo para impedir monetización/CTA comercial en rutas P0/P1 y de alto riesgo.

## 17. Estado de staging / hitos técnicos

Core histórico:

`V32.3 → V33A → V33A.1 → V33A.2 → V33B staging real`

Staging ya existe y se ha usado manualmente para formularios, moderación, publicación, Historias y Nadie Solo.

Hitos 2026-09-02:

- PR #195 Brújula V1;
- PR #196 integración Executive Engine;
- PR #197 sincronización Estado Maestro;
- PR #198 short-circuit ante incertidumbre Safety;
- PR #199 wiring Ops + fail-closed;
- PR #200 matriz exhaustiva 3.072 combinaciones.

Hitos posteriores:

- PR #201 profundidad narrativa `miedo de equivocarme en el trabajo`;
- PR #202 `basic_needs=unsure` ya no puede parecer `MANAGEABLE`;
- PR #203 profundidad narrativa y privacidad en CV;
- PR #204 Search & Crisis Routing V1;
- PR #205 clasificación contextual de suicidio;
- PR #206 integridad de destinos del router.

No confundir estos hitos con “producción completamente lista”.

## 18. Prioridades inmediatas recomendadas

### P0 — Verificación viva de motores autoritativos
1. Confirmar despliegue real de `ops-api`/Ops en Render.
2. Probar fixture sintético normal → `ROUTE_WITH_GUARDRAILS` + Brújula normal.
3. Probar `safety_now=yes` → `SAFETY_GATEWAY`, comercial OFF, analítica mínima y `escalate` obligatorio.
4. Probar `safety_now=unsure` → `HUMAN_REVIEW`, comercial OFF y `escalate` obligatorio.
5. Probar señal crítica por texto → Safety Gateway prevalece.
6. Comprobar cola Safety y auditoría agregada, sin respuestas crudas.

### P1 — Validar Search & Crisis Routing + Brújula antes de UX pública
- ejecutar fixtures adversariales y fronteras del nuevo router;
- validar duelo/negación/pasado/información/ambigüedad frente a crisis activa;
- validar destinations e integridad en staging;
- validar lenguaje humano de `MANAGEABLE/PROGRESSIVE/PRIORITY`;
- diseñar superficies accesibles separadas de la portada V9;
- teclado, lector de pantalla, focus, errores comprensibles y no estigmatizantes;
- analítica privacy-minimized sin consulta sensible ni targeting;
- no publicar puntuación clínica ni “diagnóstico disfrazado”.

### P2 — Cerrar Qué pasó después de punta a punta
Nueva historia con autorización de autor → moderación → publicación → actualización → moderación → nuevo tramo temporal → seguidor detecta novedad.

### P3 — Endurecer backoffice
RBAC + identidad nominal + MFA AAL2 + separación de funciones + historial de decisión + apelaciones.

### P4 — Observabilidad / resiliencia
Logs estructurados, alertas, distributed rate limiting, backups/PITR, destino independiente, restore drill, health/readiness, fallos de cola y runbooks.

### P5 — Google Launch real
Search Console dominio, sitemap/robots/canonical finales, GA4/GTM/Consent Mode, conversiones mínimas sin datos sensibles, CWV de campo.

### Carriles paralelos no bloqueantes
- contenido profundo y seguro sobre URLs existentes;
- Safety editorial y fuentes oficiales;
- accesibilidad;
- SEO técnico sin tocar navegación global de forma concurrente;
- investigación internacional Native-First;
- tests/regresiones;
- documentación y runbooks.

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

Indicar:

> Trabajamos en Desgracias.es. Usa `andresvalledelacruz/Andelacruz`, lee primero `docs/PROJECT_STATE.md` y contrasta `production-v9` con GitHub antes de afirmar estado. Continúa desde “Prioridades inmediatas recomendadas”. No afirmes que algo está live sin verificar staging. Mantén Safety, privacidad y valor humano por encima de growth/monetización. No toques la portada V9 sin petición explícita. Ejecuta autónomamente lo no bloqueado y deja intervenciones humanas en HOLD.

Documentos/subsistemas de referencia:

- `docs/NEXT_STEP_COMPASS.md`
- `docs/AUTHOR_UPDATE_FLOW.md`
- `docs/GOOGLE_ENGINEERING_GROWTH_OS_2026.md`
- `src/next-step-compass.js`
- `src/search-crisis-router.js`
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