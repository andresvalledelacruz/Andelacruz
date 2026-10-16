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

Estos cambios no acreditan un despliegue. Para operar hay que desplegar la API Ops de staging autorizada, configurar sus secretos existentes y la conexión de solo lectura, montar el archivo privado opcional y verificar el endpoint y panel con acceso autorizado. Deben comprobarse las fuentes reales y la procedencia de cada dato; no basta que el proceso arranque. Habilitarlo en producción requiere un diseño de identidad y permisos aprobado, conservando los controles actuales hasta entonces.

Pruebas locales: `node --test tests/ops-business-metrics.test.mjs` cubre agregados, fallos, validación de exportación, presentación y HTTP real (401, 200 sin base de datos con métricas bloqueadas y 404 en producción).
