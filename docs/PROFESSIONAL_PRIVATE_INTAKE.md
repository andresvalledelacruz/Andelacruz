# Recepción privada de solicitudes profesionales

## Estado y límites

La recepción HTTP está desactivada por defecto. La página pública sigue preparando
un correo: no afirma recepción, no envía datos a este backend y no publica fichas.
El nuevo circuito prepara una recepción persistente y una revisión separada, sin
activar acuerdos comerciales, publicidad, leads, pagos ni recomendaciones.

## Configuración previa a una activación real

El servicio exige simultáneamente:

- `PROFESSIONAL_INTAKE_ENABLED=true`;
- `PROFESSIONAL_INTAKE_PRIVACY_REVIEW`: referencia real de revisión de privacidad;
- `PROFESSIONAL_INTAKE_RETENTION_DAYS`: plazo aprobado, entero de 1 a 90 días;
- `PROFESSIONAL_INTAKE_RETENTION_READY=true`: borrado operativo comprobado;
- `PROFESSIONAL_INTAKE_REVIEW_READY=true`: responsable, acceso nominal y revisión operativos.

No configurar estos indicadores para simular una aprobación. Hace falta definir
información al solicitante, responsables y acceso, y verificar el borrado dentro
del plazo aprobado. La limpieza elimina solicitudes caducadas con
`delete from private.professional_applications where expires_at <= now()`;
los eventos privados de revisión se eliminan en cascada. El listado ya excluye
solicitudes caducadas, pero esto no sustituye el borrado físico programado.

## Recepción

`POST /public/professional-applications` acepta JSON de hasta 8 KiB, con campos
profesionales acotados, `request_id` UUID, `privacy_acknowledged=true`,
`truth_confirmed=true` y `commercial_opt_in` booleano independiente.
No admite consultas de ayuda, historias, importes de conversión o estados de
verificación enviados por el navegador. No enviar datos de pacientes o terceros.
El CORS conserva la lista existente de staging; no habilita el dominio de
producción. La conexión de un formulario real necesita su revisión de privacidad.

La respuesta 202 incluye únicamente `receipt_id` y `received_pending_review`, y
solo se entrega después de confirmar la transacción. Un reintento con el mismo
UUID y contenido devuelve el mismo recibo; otro contenido produce conflicto.
Si el identificador sigue almacenado pero ha caducado, responde 409
`request_expired`, sin devolver el recibo ni intentar otra inserción. Una nueva
solicitud requiere un UUID nuevo; el reintento no renueva la retención.
Un bloqueo compartido en base de datos limita la capacidad a 100 solicitudes en
24 horas; no usa IP, cookies ni identificadores de visitante. Esto limita el daño,
pero no sustituye una revisión de abuso antes de abrir recepción pública.
En un entorno distinto de producción, todos los registros se marcan sintéticos
en el servidor. Las solicitudes no se convierten en leads ni ingresos.

## Revisión y publicación

`GET /ops/professionals/applications` y
`POST /ops/professionals/:applicationId/review` exigen la capacidad
`professional.review`, administrador nominal y MFA AAL2. El token compartido de
staging no puede acceder. La autorización nominal no está implementada por ese
puente heredado: esta dependencia sigue abierta y no debe eludirse.

La aprobación exige identidad, credenciales y condiciones revisadas, fuentes HTTPS,
revisión no caducada y referencia independiente de autorización de publicación.
El candidato revisado permanece en la tabla privada con su evidencia: todavía no
está publicado. Para publicar debe pasar de nuevo por `publicProfiles`, excluir
correo/teléfono y referencias internas, y actualizar el registro público mediante
un cambio revisado. Retirar una candidatura elimina su candidato aprobado; si ya
se hubiera publicado por separado, la retirada pública debe completarse también.

## Datos y medición

El esquema está en `scripts/sql/professional-intake.sql`. Las dos tablas privadas
tienen RLS y carecen de permisos para `anon` y `authenticated`. No hay RPC de datos
profesionales en `public`. El backend requiere su conexión de servidor autorizada.

Ops solo cuenta solicitudes no sintéticas cuando la recepción está habilitada.
Son solicitudes recibidas conservadas, no leads; el plazo de retención limita la
cobertura histórica. La consulta no devuelve nombres, correo, teléfono ni texto.
No se escriben datos reales, solicitudes, referencias privadas o métricas del
proyecto en el repositorio público.
