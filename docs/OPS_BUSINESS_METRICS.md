# Métricas internas de negocio

`GET /ops/business-metrics` forma parte de la API Ops existente. Solo funciona en `NODE_ENV=staging`: devuelve 404 en producción. Reutiliza la capacidad RBAC `ops.summary.read`; sin autenticación devuelve 401 cuando el token de staging está configurado. Una API sin token configurado devuelve 503. Las respuestas llevan `Cache-Control: no-store` y exclusión de indexación.

## Páginas vistas

La conexión privada `DATABASE_URL` existente necesita permiso de lectura sobre `public.pageview_daily_analytics`. El endpoint no crea tablas, no modifica permisos y solo consulta agregados de `pageviews` y días con registros. No conceder acceso público a la tabla para habilitar el panel.

La ventana comprende los siete días UTC completos anteriores al día actual: inicio incluido y fin excluido. No incluye el día en curso. Son páginas vistas registradas, no personas, sesiones ni visitas totales. La cobertura es parcial y los contadores históricos no permiten separar pruebas. Una consulta fallida, un esquema ausente o una ventana sin registros producen `null` y `BLOQUEADO`, nunca un cero supuesto.

## Exportación manual de Search Console

Configurar `OPS_SEARCH_CONSOLE_SNAPSHOT` con la ruta absoluta de un archivo privado del servidor, fuera del repositorio y de cualquier directorio servido públicamente. El archivo contiene exclusivamente agregados exportados por una persona autorizada. No incluir claves, consultas de búsqueda, URLs, datos personales ni credenciales.

Ejemplo exclusivamente de prueba; estas cifras no representan resultados reales:

```json
{
  "source": "google_search_console",
  "property": "sc-domain:desgracias.es",
  "search_type": "web",
  "period": { "from": "2026-09-01", "to": "2026-10-01" },
  "exported_at": "2026-10-15T12:00:00Z",
  "clicks": 3,
  "impressions": 20
}
```

El validador exige la propiedad y tipo indicados, fechas válidas sin futuro, período ordenado, exportación posterior o igual al fin del período y contadores enteros seguros no negativos con clics menores o iguales a impresiones. Solo proyecta métricas, período y fecha de exportación. Un archivo ausente, ilegible o inválido deja Search Console bloqueado. La actualización es manual; su período es independiente de la ventana de páginas vistas.

Solicitudes profesionales, leads, conversiones e ingresos permanecen `null / BLOQUEADO` hasta disponer de fuentes verificadas. El panel no deduce ingresos de clics ni atribuye conversiones sin evidencia.

## Puesta en servicio pendiente

### Snapshot privado de Awin

`OPS_AWIN_SNAPSHOT` apunta a otro archivo privado, leído con el mismo límite de 16 KiB. Exige `source: awin_authenticated_export`, `account_name: Desgracias.es`, `market: ES`, `currency: EUR`, `timezone: Europe-Paris` (etiqueta del informe), periodo de días completos `period: {from,to}`, `observed_at` UTC y `conversion_statuses: [pending,confirmed,bonus]`. Los contadores `impressions`, `clicks`, `sales` y `commission_minor` deben ser enteros seguros no negativos; la comisión se expresa en céntimos.

Se proyectan únicamente esos campos permitidos en `awin`, con actualización manual y periodo propio. La tarjeta distingue la suma de comisión pendiente, confirmada y bonos de los pagos y de los ingresos globales. No añade cookies, identificadores o enlaces de afiliación. No transforma fuentes ausentes en cero ni sustituye conversiones/ingresos globales. Los CSV reales y datos de cuenta quedan fuera de Git. Verificar siempre los filtros, fechas y unidades de la exportación; no usar totales del día en curso como días completos.

### Snapshot privado de Adtraction

`OPS_ADTRACTION_SNAPSHOT` apunta a un archivo privado fuera del árbol público. Se usa el mismo lector acotado a 16 KiB que para Search Console. Debe contener `source: adtraction_authenticated_export`, `channel_url: https://desgracias.es`, `market: ES`, `currency: EUR`, `period: {from,to}` (días completos, fecha final inclusiva anterior a hoy), `observed_at` en UTC, `conversion_statuses: [approved,pending]` y enteros no negativos `clicks`, `unique_clicks`, `conversions`, `commission_minor` (céntimos). Los clics únicos no pueden superar los clics. Fechas futuras, tipo incorrecto, otra moneda/canal o fuente ausente quedan bloqueados.

El endpoint proyecta únicamente esos agregados permitidos en `adtraction`; no publica correos, credenciales ni campos adicionales. El panel identifica canal, país, periodo, estados y actualización manual. La comisión de una red no sustituye `revenue` ni `conversions` globales: ambos siguen bloqueados hasta disponer de fuentes y conciliación completas. No acredita cobro, no acepta contratos y no activa campañas. Un archivo ausente/ilegible/inválido o un fallo de refresco limpia cualquier cifra anterior. Los datos reales de cuenta/exportación nunca se añaden al repositorio público.

Estos cambios no acreditan un despliegue. Para operar hay que desplegar la API Ops de staging autorizada, configurar sus secretos existentes y la conexión de solo lectura, montar el archivo privado opcional y verificar el endpoint y panel con acceso autorizado. Deben comprobarse las fuentes reales y la procedencia de cada dato; no basta que el proceso arranque. Habilitarlo en producción requiere un diseño de identidad y permisos aprobado, conservando los controles actuales hasta entonces.

Pruebas locales: `node --test tests/ops-business-metrics.test.mjs` cubre agregados, fallos, validación de exportación, presentación y HTTP real (401, 200 sin base de datos con métricas bloqueadas y 404 en producción).

### Comprobar la versión desplegada sin enviar credenciales

El auditor `node scripts/audit-ops-readiness.mjs` usa `OPS_BASE_URL`. Con `OPS_REQUIRE_BUSINESS_METRICS=1` exige también que `/ops/business-metrics` responda 401 al acceso anónimo, con no-store y noindex. Un 404 revela que esa ruta no está desplegada; un 200 anónimo también es un fallo. La comprobación no envía token y devuelve `data_verified:false`: detectar la ruta autenticada no acredita acceso a sus datos.

Para un servicio que necesita arrancar en frío, puede establecerse `OPS_AUDIT_TIMEOUT_MS=55000` antes de ejecutar el auditor. Una espera agotada no identifica por sí sola un servicio caído. Tras comprobar liveness/readiness y versión, sigue siendo necesaria una lectura autenticada contra las fuentes reales. No introducir credenciales en la URL base.
