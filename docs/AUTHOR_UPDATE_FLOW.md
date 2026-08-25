# Actualizaciones del autor · «Qué pasó después»

Estado: **fundación técnica preparada; todavía no conectada al flujo público vivo**.

## Objetivo

Permitir que el autor de una historia publicada vuelva con el tiempo y añada una actualización sin convertir Desgracias.es en una red social convencional y sin permitir que terceros editen su historia.

Flujo objetivo:

`historia original → moderación → publicación → actualización del autor → moderación independiente → nuevo tramo temporal → seguidores ven la evolución`

## Principios no negociables

1. La actualización no modifica ni reescribe silenciosamente la historia original: se añade como un nuevo tramo temporal.
2. Nadie puede publicar una actualización directamente; toda actualización pasa por moderación humana.
3. El servidor nunca almacena el secreto de actualización del autor en claro. Solo conserva un hash SHA-256 con separación de dominio y pepper de servidor en producción.
4. El navegador del autor conserva el secreto localmente. En producción se migrará a identidad autenticada/recuperable cuando el modelo de cuenta esté listo.
5. Una persona que sigue una historia no recibe el secreto del autor ni puede editarla.
6. Las actualizaciones retiradas o rechazadas no se muestran públicamente.
7. En staging solo se admite contenido sintético.

## Modelo temporal

Fases iniciales:

- `dias_despues` → Días después
- `semanas_despues` → Semanas después
- `mes_1` → Mes 1
- `mes_3` → Mes 3
- `mes_6` → Mes 6
- `ano_1` → Año 1
- `otro` → Después

No se obliga al autor a encajar su experiencia en una cronología rígida; estas fases son etiquetas de navegación.

## Estados de una actualización

`pending_moderation → approved → published`

Rutas alternativas:

- `pending_moderation → rejected`
- `pending_moderation → escalated → revisión humana especializada`

La decisión de seguridad nunca es automática.

## Contrato de autorización

Al enviar una historia futura, el navegador generará un secreto aleatorio de alta entropía. La API validará el formato y calculará un hash. Solo el hash viajará con el candidato hasta el registro publicado.

Para enviar una actualización, el navegador presentará el secreto. El backend recalculará el hash y lo comparará en tiempo constante con el hash almacenado.

Para la historia de prueba ya publicada antes de introducir este mecanismo no se fabricará retroactivamente una identidad de autor. Se probará el flujo completo con una nueva historia ficticia creada después de activar esta capa.

## Seguimiento

`Seguir historia` continúa siendo privado en staging. El seguimiento y la autorización del autor son conceptos separados:

- seguir = quiero volver a ver novedades;
- autorizar actualización = puedo demostrar que soy quien creó la historia.

No se usan contadores de seguidores para ordenar sufrimiento ni para Nadie Solo.

## Base de datos

La migración de staging está en `sql/20260825_story_updates_staging.sql`.

Tablas:

- `staging_story_update_candidates`: actualizaciones pendientes de decisión humana.
- `staging_story_updates`: actualizaciones aprobadas/publicadas.
- `staging_published_stories.author_update_key_hash`: hash de autorización del autor.

## Siguiente integración

1. Generar el secreto en `frontend/app.js` para nuevas historias.
2. Validarlo y hashearlo en `src/api.js` antes de encolar la historia.
3. Propagar el hash en `src/publish-processor.js`.
4. Crear endpoint de envío de actualización autenticado por ese secreto.
5. Encolar la actualización en moderación con `kind=story_update_submission`.
6. Ampliar el backoffice para distinguir historia nueva de actualización.
7. Publicar el tramo temporal solo después de aprobación.
8. Mostrar las actualizaciones en el bloque «Qué pasó después» y señalar novedades a seguidores privados.

## Producción

El secreto local es adecuado como mecanismo transitorio de staging, no como sustituto definitivo de una cuenta recuperable. Producción debe integrar identidad, MFA para personal, recuperación segura y auditoría de decisiones conforme a la arquitectura general del proyecto.
