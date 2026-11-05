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
del plazo aprobado. La limpieza preparada se ejecuta con
`npm run purge:professional-intake`, únicamente cuando
`PROFESSIONAL_INTAKE_PURGE_ENABLED=true`, se elige un modo explícito y existe una
conexión de servidor. Ambos modos necesitan un secreto operativo independiente de
al menos 32 bytes en `PROFESSIONAL_INTAKE_PURGE_CONFIRMATION_SECRET`; no debe
registrarse, publicarse ni guardarse en el repositorio.
Por defecto, ambos modos seleccionan exclusivamente filas sintéticas. Incluir datos
no sintéticos exige además `PROFESSIONAL_INTAKE_PURGE_INCLUDE_NON_SYNTHETIC=true`,
`PROFESSIONAL_INTAKE_RETENTION_READY=true` y una referencia válida en
`PROFESSIONAL_INTAKE_PRIVACY_REVIEW`. No se deben configurar estos valores para
simular preparación: la prueba inicial debe permanecer en el ámbito sintético.
`PROFESSIONAL_INTAKE_PURGE_MODE=plan` hace una consulta acotada de solo lectura y
devuelve cuántas filas serían elegibles junto con un token de confirmación firmado;
no bloquea ni borra. Para confirmar, el operador debe conservar el mismo lote y
secreto, cambiar a `PROFESSIONAL_INTAKE_PURGE_MODE=commit` y proporcionar ese token
en `PROFESSIONAL_INTAKE_PURGE_PLAN_TOKEN`. El token caduca a los 15 minutos, está
vinculado a un identificador aleatorio de plan, ámbito sintético o completo, instante de corte, tamaño del lote y
recuentos agregados, y no contiene identificadores de candidaturas ni datos personales.
El commit vuelve a seleccionar bajo bloqueo y reserva el identificador en un recibo
privado antes de tocar las candidaturas. Ese recibo se confirma atómicamente con el
borrado, conserva solo el identificador del plan, ámbito, corte, lote, recuentos y finalización,
e impide reutilizar el mismo token. Un rollback elimina también la reserva y no deja
un falso recibo de éxito. El commit solo ejecuta el borrado si los recuentos siguen
coincidiendo. Omitir el modo, secreto o token, usar otro valor, presentar una firma
inválida o confirmar un plan caducado falla antes de acceder a los datos; un token ya
consumido, un cambio de ámbito o un cambio en el lote provoca rollback sin borrar.
El ejecutor usa un bloqueo transaccional, elimina como máximo 250 filas por lote
(configurable entre 1 y 1000), selecciona solo `expires_at <= now()` con
`FOR UPDATE SKIP LOCKED` y devuelve exclusivamente recuentos agregados. Los eventos
privados de revisión se eliminan en cascada. El listado ya excluye solicitudes
caducadas, pero esto no sustituye el borrado físico programado.

El ejecutor permanece desactivado y no está programado en ningún servicio: disponer
del código o de pruebas no acredita borrado operativo. Antes de marcar
`PROFESSIONAL_INTAKE_RETENTION_READY=true` hay que configurar un runner autorizado,
ejecutar primero `plan`, copiar su confirmación de vida corta, cambiar después de
forma deliberada a `commit`, observar una ejecución real sobre datos de prueba
caducados y documentar su resultado. El plan es una fotografía orientativa: el lote
se revalida al confirmar y nunca acredita por sí solo una eliminación.

## Recepción

`POST /public/professional-applications` acepta JSON de hasta 8 KiB, con campos
profesionales acotados, `request_id` UUID, `privacy_acknowledged=true`,
`truth_confirmed=true` y `commercial_opt_in` booleano independiente.
El esquema separa país de establecimiento (`country`), zona (`area`), países de
prestación declarados (`service_countries`) e idiomas (`languages`). Autoridad de
registro, identificador, URL oficial de consulta y declaración mínima de cobertura
se conservan únicamente en el expediente privado; son datos declarados pendientes
de contraste. La URL de consulta debe ser HTTPS, pero superar esa validación técnica
no acredita que la fuente sea oficial ni que la credencial esté vigente.
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
`GET /ops/professionals/:applicationId/public-profile` y
`POST /ops/professionals/:applicationId/review` exigen la capacidad
`professional.review`, administrador nominal y MFA AAL2. El token compartido de
staging no puede acceder. La autorización nominal no está implementada por ese
puente heredado: esta dependencia sigue abierta y no debe eludirse.

La aprobación exige identidad, credenciales, jurisdicción declarada y condiciones
revisadas, fuentes HTTPS, revisión no caducada y referencia independiente de
autorización de publicación. Esa referencia queda vinculada al candidato privado y
al evento de auditoría para que la proyección pueda revalidarla; nunca se copia a la
ficha desplegable. `jurisdiction_verified=true` solo puede registrarse
después de contrastar el país de establecimiento y los países de prestación con
evidencia aplicable; el idioma de atención, la modalidad online o una equivalencia
profesional de otro país no prueban por sí solos autorización territorial.
Registro y cobertura deben quedar resueltos por separado como `verified` o
`not_applicable`, cada uno con una referencia privada de revisión. `verified` exige
evidencia pertinente; `not_applicable` exige una determinación documentada para la
profesión y jurisdicción concretas. La mera ausencia de datos o la declaración de la
persona candidata no permiten ninguno de los dos estados. Estas referencias siguen
fuera de la proyección y de la ficha pública.
La aprobación también exige que el revisor asigne al menos una categoría editorial
acotada (`employment` o `education`). No se deriva de especialidades, descripción,
idioma ni texto libre de la candidatura, y no acredita una profesión o competencia.
Categorías vacías, repetidas, desconocidas o sensibles se rechazan antes de preparar
la ficha; esta taxonomía solo permite el matching no sensible ya previsto.
La proyección preparada fija `commercial_relationship: none` y la ficha debe mostrar
que no existe relación comercial remunerada. La casilla opcional de interés comercial
de una candidatura no cambia ese estado. Un modelo de pago, afiliación, coste por
contacto o posición destacada requiere aprobación real, esquema y disclosure nuevos;
un valor distinto de `none` se rechaza por defecto.
El candidato revisado permanece en la tabla privada con su evidencia: todavía no
está publicado. Su identificador público se genera de forma independiente dentro de
la transacción de aprobación: nunca reutiliza ni permite derivar el `receipt_id`
privado entregado a la persona solicitante. `preparePublicProfile` es la única frontera preparada para convertirlo
en una ficha desplegable: revalida evidencia y caducidad y elimina correo, teléfono,
registro, cobertura, el objeto privado de revisión, las URL de sus fuentes y sus
referencias internas. Las fuentes HTTPS son obligatorias para que el revisor pueda
justificar la decisión privada, pero no se copian al JSON público aunque la URL sea
técnicamente válida; podría identificar documentación o contener acceso transitorio.
`publicProfiles` acepta solo esa forma pública estricta y rechaza la candidatura
privada aunque sus pruebas sean válidas. Publicar todavía exige actualizar el registro
público mediante un cambio revisado. La ruta de previsualización vuelve a comprobar
estado, retención, autorización y vigencia, y devuelve exclusivamente esa proyección
pública: no devuelve el recibo, contacto, fuentes ni referencias internas y tampoco
publica o modifica el registro. Al retirar una candidatura aprobada, el candidato
privado se conserva solo hasta su fecha de retención y la respuesta devuelve su ID
público opaco. Así puede retirarse la entrada correcta mediante un cambio revisado sin
exponer ni reutilizar el recibo privado. El estado `withdrawn` impide previsualizar o
republicar la ficha. La retirada repetida es idempotente y una candidatura rechazada no
puede cambiarse a retirada. Si ya se hubiera publicado por separado, la retirada del
registro público debe completarse también: este paso no modifica el JSON desplegable.

## Datos y medición

El esquema está en `scripts/sql/professional-intake.sql`. Las dos tablas privadas
tienen RLS y carecen de permisos para `anon` y `authenticated`. No hay RPC de datos
profesionales en `public`. El backend requiere su conexión de servidor autorizada.

Una instalación nueva dispone primero de la migración
`supabase/migrations/20261105140000_create_professional_intake_core.sql`, que crea
el esquema privado, candidaturas y eventos de revisión. Después se aplica
`supabase/migrations/20261105150000_add_professional_retention_purge_receipts.sql`.
Ambas conservan el orden previo al recibo anti-reutilización. Si aparece cualquiera
de esas tablas antes de empezar, la cadena aborta para exigir inspección del esquema
en lugar de aceptar silenciosamente una instalación parcial o divergente.

Una instalación que ya tenga las tablas de recepción y revisión, pero no el recibo
anti-reutilización, dispone de la migración aditiva
`supabase/migrations/20261105150000_add_professional_retention_purge_receipts.sql`.
El archivo no se aplica automáticamente y su presencia en el repositorio no acredita
que una base real esté migrada. Antes de usarlo hay que inspeccionar el esquema del
entorno autorizado y conservar la salvaguarda aprobada. La migración falla si la
tabla ya existe para evitar aceptar silenciosamente una estructura desconocida;
en ese caso se debe comparar su definición y resolver la divergencia, no omitir la
comprobación. Tras aplicarla únicamente en staging autorizado, se deben verificar
RLS y privilegios y después ejecutar el circuito `plan`/`commit` sobre datos
sintéticos caducados. Ninguno de esos pasos se ha ejecutado por añadir este archivo.

Ops solo cuenta solicitudes no sintéticas cuando la recepción está habilitada.
Son solicitudes recibidas conservadas, no leads; el plazo de retención limita la
cobertura histórica. La consulta no devuelve nombres, correo, teléfono ni texto.
No se escriben datos reales, solicitudes, referencias privadas o métricas del
proyecto en el repositorio público.
