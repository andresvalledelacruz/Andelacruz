# Desgracias.es · Monetización, visibilidad e historias · Programa 200

**Versión:** 2026-09-15-revenue-200-v1  
**Base exacta:** `c6ed5df25bd3f2f26a9026f17840a93ecc4a8b6e`  
**Objetivo:** preparar ingresos reales, mejorar descubrimiento y confianza, ampliar historias editoriales y profesionalizar la gobernanza psicosocial sin monetizar crisis ni atribuir revisiones profesionales inexistentes.

## Estado ejecutivo

El programa formaliza **200 controles/mejoras**, distribuidos en diez dominios de 20 medidas cada uno: ingresos y protección; partners y economía; publicidad y consentimiento; visibilidad/SEO; historias y confianza; gobernanza psicológica/social/psiquiátrica; conversión/UX; métricas e ingresos; técnico/accesibilidad/resiliencia; operaciones y escalado.

La implementación técnica incluye un runtime comercial fail-closed, un registro auditable de partners/ofertas ya existente y reforzado, telemetría comercial agregada, recibos de conversión service-role, nuevas superficies públicas de Soluciones, Colaborar, Media kit, Metodología e Historias, sitemap de crecimiento separado y una suite automática que exige 200/200 invariantes.

## Qué puede generar ingresos

La primera fase comercial pública queda limitada a intenciones de menor vulnerabilidad:

- búsqueda de empleo;
- mejora de currículum;
- preparación de entrevistas;
- formación;
- actividades sociales;
- matchmaking solo por intención explícita;
- energía;
- telecomunicaciones;
- servicios del hogar.

Los modelos técnicamente soportados incluyen afiliación, CPL, CPA, reserva, revenue share, marketplace y patrocinio claramente identificado, según el tipo de oportunidad y su riesgo.

La posición comercial no se compra. El runtime exige partner activo y verificado, verificación no caducada, estado de calidad no suspendido, oferta activa, destino HTTPS y disclosure visible. El orden prioriza calidad antes que compensación.

## Zonas fuera de monetización

No se monetizan las rutas o contextos de crisis P0/P1, conducta suicida, autolesión, violencia activa, agresión sexual, protección de menores, urgencia médica ni otras situaciones donde una oferta pueda interferir con seguridad. Tampoco se insertan anuncios u ofertas dentro del cuerpo de historias reales o editoriales.

El texto del buscador, las historias y los datos personales no se venden ni se incorporan a telemetría comercial. No se usa remarketing basado en vulnerabilidad ni perfilado por estado emocional.

## Historias

La biblioteca pública `/historias/` utiliza los 18 relatos editoriales de ejemplo existentes y conserva su gobernanza: cada uno se identifica como **Historia de ejemplo**, corresponde a contenido ficticio/editorial y no se presenta como experiencia real. No se inventan fechas, alias, reacciones, comentarios o métricas sociales.

Las historias reales enviadas por personas usuarias continúan en modo **fail-closed**: no se publican automáticamente y requieren el proceso de moderación, consentimiento y controles de acceso correspondientes. La reapertura de publicación/moderación real queda condicionada a identidad del personal y AAL2.

## Gobernanza psicológica, psicosocial y psiquiátrica

La arquitectura separa disciplinas y límites:

- **Psicología:** psicoeducación y apoyo general; no diagnóstico ni sustitución de terapia.
- **Psiquiatría:** información general y derivación; no prescripción, ajuste de medicación ni consulta individual simulada.
- **Trabajo social:** derechos, recursos públicos, apoyos comunitarios y problemas materiales.
- **Salvaguarda:** protección, seguridad y escalado P0/P1.
- **Legal y finanzas:** información general y derivación dentro de límites competenciales.

No se utiliza la etiqueta “revisado por profesional” o “revisión clínica” sin revisor identificable, fecha, ámbito y credenciales verificadas cuando correspondan.

## Backend comercial ejecutado

La migración `commercial_runtime_v2_privacy_first` ya está aplicada en Supabase y queda versionada en `sql/20260915_commercial_runtime_v2_privacy_first.sql`.

Incluye:

- `commercial_events_daily`: impresiones y clics agregados por día, ruta, oportunidad y oferta;
- `commercial_conversion_receipts`: recibos de conversión con referencia hash e idempotencia;
- `get_runtime_partner_offers_v2`: catálogo público restringido a oportunidades de menor vulnerabilidad;
- `record_commercial_event_v2`: solo `shown`/`clicked`, sin texto libre;
- `record_commercial_conversion_v1`: conversiones solo desde `service_role`.

El navegador no registra IP, texto libre, consulta del buscador, historia, user-agent completo ni identificador persistente en esta telemetría comercial.

## Publicidad / AdSense

La arquitectura está preparada, pero **AdSense permanece desactivado por defecto**. No se incorpora un `ads.txt` ficticio ni un publisher ID de relleno.

Antes de activar anuncios deben existir, como mínimo:

1. publisher ID real;
2. CMP/circuito de consentimiento compatible con los requisitos aplicables;
3. actualización final de privacidad/cookies/transparencia con la configuración real;
4. `ads.txt` con vendedores reales;
5. revisión de rendimiento y consentimiento;
6. verificación de exclusión de rutas sensibles;
7. recertificación del SHA exacto de producción.

## Visibilidad

La expansión no se basa en crear cientos de páginas vacías. Se usa una estrategia people-first: contenido original, intención real, canonicals correctos, datos estructurados coherentes con el contenido visible, enlazado contextual y páginas de confianza.

Se crea `sitemap-growth.xml` para las cinco superficies nuevas y `robots.txt` anuncia tanto el sitemap editorial existente como el de crecimiento.

## Bloqueadores externos para ingresos reales

La infraestructura comercial está operativa, pero a fecha de este programa la base contiene **0 partners** y **0 ofertas activas**. Por tanto, la página de Soluciones muestra correctamente un estado vacío hasta incorporar el primer colaborador real y verificado.

Los siguientes puntos requieren una credencial, tercero o decisión externa y no deben falsificarse:

- **Primer partner real verificado:** necesario para generar CPL/CPA/afiliación/reservas reales.
- **Publisher ID real de Google AdSense:** necesario para ingresos publicitarios.
- **CMP/configuración de consentimiento real:** necesaria antes de publicidad no esencial donde aplique.
- **AAL2 e identidad del personal de moderación:** necesaria para historias reales.
- **Credenciales verificadas de revisores profesionales:** necesarias antes de mostrar badges clínicos/profesionales.
- **Seguro/revisión de riesgo:** necesario antes de adquisición o marketing agresivo.
- **Backup externo independiente:** necesario antes de escalar ampliamente operaciones críticas.

## Prioridad de negocio inmediata

1. Captar el primer partner de empleo/CV/formación o ahorro doméstico mediante `/colaborar/` y `/media-kit.html`.
2. Verificarlo y activar una oferta piloto de baja vulnerabilidad.
3. Medir `shown → clicked → converted` de forma agregada.
4. Usar esos datos para negociar mejores acuerdos sin alterar el ranking de seguridad o la independencia editorial.
5. Tramitar AdSense/CMP en paralelo, sin bloquear los modelos de partner directo.
6. Aumentar tráfico orgánico con contenido útil y las superficies de Historias/Metodología, evitando contenido masivo de baja calidad.

## Regla de dirección

**Ingresos sí; explotación de vulnerabilidad no.** Si una optimización comercial entra en conflicto con seguridad, privacidad, independencia editorial o exactitud profesional, se bloquea la optimización comercial.
