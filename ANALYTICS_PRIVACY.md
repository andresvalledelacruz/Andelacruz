# Analítica interna privacy-first de Desgracias.es

## Objetivo

Medir uso real de la web con el mínimo dato necesario para tomar decisiones de producto, seguridad, UX y SEO, sin construir perfiles de personas ni recoger el contenido sensible que puedan consultar o enviar.

## Qué se registra

La tabla `public.pageview_daily_analytics` conserva únicamente contadores agregados por:

- día UTC;
- ruta (`pathname`, nunca query string ni hash);
- procedencia resumida por host (`direct`, `internal` o dominio externo);
- clase de dispositivo (`mobile`, `tablet`, `desktop` o `unknown`);
- código de país **inferido del locale del navegador cuando existe**, no de geolocalización física.

## Qué NO se registra

No se guardan:

- direcciones IP;
- cookies;
- IDs de usuario, sesión o dispositivo;
- correo, teléfono, nombres o cuentas;
- user-agent completo;
- coordenadas;
- parámetros de URL o fragmentos;
- texto de historias, búsquedas, formularios o cualquier payload libre.

## Interpretación correcta del país

`country_code` es una señal orientativa derivada de `navigator.language` (por ejemplo, `es-ES` -> `ES`). No demuestra dónde se encuentra físicamente la persona. Nunca debe presentarse como geolocalización exacta ni utilizarse para decisiones individuales.

## Arquitectura

1. Las páginas habilitadas cargan `/visitor-analytics.js` directamente o mediante `/public-page-runtime.js`.
2. El beacon solo funciona en `desgracias.es` y `www.desgracias.es`.
3. Envía un `POST` a la RPC `record_privacy_safe_pageview` de Supabase.
4. La RPC valida las dimensiones y hace `upsert` sobre contadores agregados.
5. La tabla tiene RLS y no se concede lectura a `anon` ni `authenticated`.

## Consultas operativas

### Pageviews por día

```sql
select day, sum(pageviews) as pageviews
from public.pageview_daily_analytics
group by day
order by day desc;
```

### Páginas más vistas

```sql
select path, sum(pageviews) as pageviews
from public.pageview_daily_analytics
group by path
order by pageviews desc, path;
```

### Procedencia

```sql
select referrer_host, sum(pageviews) as pageviews
from public.pageview_daily_analytics
group by referrer_host
order by pageviews desc, referrer_host;
```

### Dispositivo

```sql
select device_class, sum(pageviews) as pageviews
from public.pageview_daily_analytics
group by device_class
order by pageviews desc;
```

### Región inferida por locale

```sql
select country_code, sum(pageviews) as pageviews
from public.pageview_daily_analytics
group by country_code
order by pageviews desc;
```

## Verificación end-to-end

Después de un despliegue de analítica:

1. confirmar Engineering Quality Gate y Production SEO Integrity en el PR;
2. hacer merge solo con ambos verdes;
3. confirmar Engineering, SEO y Pages sobre el mismo SHA de producción;
4. comprobar que el HTML visible no ha cambiado cuando la tarea es solo observabilidad;
5. consultar `pageview_daily_analytics` y verificar que aparece tráfico real posterior al despliegue;
6. no insertar visitas sintéticas en métricas operativas salvo test controlado y eliminación inmediata.

## Cobertura actual

El contador está habilitado en la portada y en los hubs públicos que ya cargan el runtime común, incluidos Familia, Rupturas, Duelo, Dinero, Trabajo y Soledad. La extensión a guías individuales debe hacerse en lotes pequeños y revisables para evitar reescrituras accidentales de contenido YMYL.

## Principios de producto

- Analítica sirve para mejorar ayuda, seguridad, UX e indexación; no para perfilar vulnerabilidad.
- En rutas P0/P1 no se introduce monetización ni segmentación comercial basada en comportamiento.
- Si en el futuro se incorpora geolocalización agregada de infraestructura (por ejemplo, país de edge), debe documentarse por separado y revisarse desde privacidad antes de sustituir la señal de locale.
