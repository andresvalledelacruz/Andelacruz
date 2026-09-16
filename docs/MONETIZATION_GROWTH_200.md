# Desgracias.es · Monetización, visibilidad e historias · Programa integral

**Versión:** 2026-09-16-integral-v2  
**Base de producción al iniciar el lote:** `c6ed5df25bd3f2f26a9026f17840a93ecc4a8b6e`  
**Objetivo:** aumentar utilidad, accesibilidad, descubrimiento, medición y preparación de ingresos sin convertir la vulnerabilidad en un producto ni atribuir autoridad clínica inexistente.

## Estado ejecutivo

El programa mantiene los 200 controles/mejoras previos y añade la implementación solicitada después por el propietario: mejor comprensión lingüística del buscador, organización de historias por temas, directorio ampliado de recursos, especialización temática, referencias externas transparentes, superficies de autoridad y prensa, tarjetas de decisión completamente clicables y analítica agregada de atención/interacción para el propietario.

## UX y accesibilidad

- Las tres tarjetas de decisión de la portada conservan su jerarquía visual y toda su superficie actúa como área de activación del enlace nativo mediante una ampliación del hit-area; el foco de teclado permanece visible.
- `Necesito ayuda urgente` sigue siendo la opción visualmente prioritaria y mantiene su destino Safety.
- La portada conserva V9; no se altera su estructura editorial salvo mejoras expresamente autorizadas.

## Buscar ayuda

- La interpretación mantiene Safety antes de cualquier clasificación ordinaria.
- Se añade una capa conservadora para faltas frecuentes, abreviaturas y expresiones coloquiales.
- No se promete leer pensamientos, diagnosticar ni inferir hechos que la persona no haya expresado.
- La consulta continúa procesándose localmente y no entra en telemetría de interacción.

## Historias

- `/historias/` muestra primero grupos temáticos y solo después los relatos elegidos, reduciendo scroll y carga cognitiva.
- Los relatos editoriales permanecen identificados como historias de ejemplo y no se presentan como testimonios reales.
- Las historias reales continúan fail-closed hasta completar las garantías de identidad/AAL2 y moderación humana.

## Temas, recursos y especialización

Se incorporan hubs públicos para facilitar navegación y SEO people-first:

- `/temas/`;
- `/recursos/`;
- `/suicidio/`;
- `/fuentes-y-revision.html`;
- `/webs-amigas.html`;
- `/prensa.html`.

Suicidio/crisis conserva prioridad de recursos oficiales y no incorpora analítica comportamental ni monetización.

## Confianza y visibilidad

- `webs-amigas.html` reúne 50 referencias externas con aviso expreso de que una inclusión no implica colaboración, patrocinio, afiliación o respaldo recíproco.
- Fuentes y revisión explica límites de autoridad y evita badges profesionales no acreditados.
- Prensa prepara Digital PR sin publicar búsquedas privadas, historias privadas o datos identificativos.
- `sitemap-growth.xml` incorpora las nuevas superficies públicas y excluye el panel privado.

## Analítica para el propietario

`/panel-analitica.html` ofrece una lectura privada y agregada de:

- visitas de página;
- evolución por días;
- páginas más vistas;
- procedencia por dominio;
- dispositivo;
- configuración regional aproximada;
- secciones que llegan a ser visibles;
- profundidad aproximada de lectura;
- clics agregados sobre controles allow-listed.

No es eye-tracking: no guarda coordenadas, movimientos del puntero, grabaciones, reproducción de sesiones, texto escrito, consultas, historias, cookies analíticas, identificadores persistentes ni perfiles individuales. Las rutas sensibles están excluidas de la telemetría de interacción.

El acceso al panel se protege mediante un secreto del propietario cuyo valor nunca se almacena en el repositorio; únicamente se compara su huella SHA-256 en servidor. El secreto fue rotado antes de integración final tras detectar que una versión anterior había quedado referenciada en una prueba histórica.

## Monetización responsable

La infraestructura comercial sigue limitada a intenciones de menor vulnerabilidad. No se monetizan P0/P1, suicidio/autolesión, violencia activa, agresión sexual, protección de menores ni urgencia médica. No se venden historias, búsquedas ni datos personales y no existe pay-to-rank.

AdSense permanece desactivado hasta disponer de publisher ID real, consentimiento/CMP aplicable y revisión final. Los ingresos directos requieren partners reales y verificados; no se inventan ofertas.

## Regla de dirección

**Ingresos sí; explotación de vulnerabilidad no.** Toda optimización queda subordinada a Safety, privacidad, independencia editorial, accesibilidad y exactitud profesional.
