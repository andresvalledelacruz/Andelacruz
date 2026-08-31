# Desgracias.es — Moderación interna de staging

## Objetivo

Consola separada de la web pública para revisar únicamente contenido ficticio de staging antes de publicar o escalar.

## Servicio

- Proceso: `npm run start:ops`
- Health: `/health`
- Readiness: `/ready`
- Consola: `/ops`
- Región prevista: Frankfurt

## Variables obligatorias

### API `desgracias-api-staging`

- `NODE_ENV=staging`
- `DATABASE_URL` — conexión de staging a Supabase/Postgres.
- `STORY_AUTHOR_UPDATE_PEPPER` — secreto de servidor usado únicamente para derivar el hash de la credencial de actualización del autor. Debe tener al menos 16 caracteres, ser independiente de otros secretos y no almacenarse en código, GitHub, URL ni frontend. Si falta, el alta de historias falla de forma segura y no se encola contenido.

### Consola `desgracias-ops-staging`

- `NODE_ENV=staging`
- `DATABASE_URL` — conexión de staging a Supabase/Postgres.
- `STAGING_OPS_TOKEN` — puente transitorio de staging para operaciones no sensibles. No debe almacenarse en código, GitHub, URL ni frontend.

## Estado de autenticación y mínimo privilegio

El token transitorio ya **no puede leer datos crudos de moderación** (`/ops/moderation/pending` ni `/ops/moderation/:messageId/brief`). Tampoco puede decidir casos P0/P1. Esos accesos exigen una identidad individual, rol autorizado y AAL2/MFA.

Mientras no exista un proveedor de identidad de staff conectado al servicio Ops, las funciones sensibles de moderación permanecen deliberadamente **fail-closed**. Esto es una restricción de seguridad, no un error que deba resolverse relajando RBAC, AAL2 o los tests.

El token transitorio puede seguir utilizándose exclusivamente para operaciones de staging no sensibles que tengan capability explícita, como el resumen agregado y la evaluación interna de producto.

## Flujo operativo actual

1. La historia ficticia entra en la cola `moderation` con el hash de su credencial de actualización, nunca con el secreto bruto.
2. La respuesta 202 del alta devuelve el secreto bruto una sola vez para que el autor pueda conservarlo; no se registra en logs ni se persiste en la cola.
3. Los resúmenes agregados no sensibles pueden consultarse mediante el puente transitorio de staging.
4. La lectura de la cola, el brief ejecutivo y cualquier decisión P0/P1 requieren identidad individual autorizada + AAL2.
5. Hasta conectar esa identidad, esas operaciones sensibles deben permanecer inaccesibles.
6. Una vez conectada identidad de staff, cada decisión deberá mantener motivo compatible:
   - `approve` → `safe_and_useful`
   - `reject` → `needs_editing`, `privacy_risk`, `unsafe_guidance`, `spam_or_abuse`, `out_of_scope`, `duplicate_or_test`
   - `escalate` → `crisis_or_safeguarding`
7. La decisión se registra como evento interno y el mensaje original se archiva de `moderation`.
8. Aprobado → `internal_tasks` con tarea `publish_story_candidate`.
9. Escalado → `safety` con tarea `human_safety_review`.
10. Rechazado → `internal_tasks` como evento de auditoría, sin publicación.

## Seguridad

- `STORY_AUTHOR_UPDATE_PEPPER` y `STAGING_OPS_TOKEN` son secretos distintos y no reutilizables.
- El secreto de actualización del autor no se persiste en bruto; únicamente se deriva y propaga su hash.
- El token de operaciones nunca se persiste en `localStorage` ni `sessionStorage`.
- El token transitorio no concede identidad individual ni acceso a datos crudos de moderación.
- Cola y briefs de moderación requieren identidad individual y AAL2.
- P0/P1 requiere rol de Safety autorizado y AAL2; nunca debe existir bypass por token compartido.
- `Cache-Control: no-store`.
- `X-Robots-Tag: noindex, nofollow, noarchive`.
- CSP restrictiva y `frame-ancestors 'none'`.
- Sin datos de historias ni credenciales en logs de decisión.
- Esta autenticación por token es **solo un puente transitorio de staging y únicamente para operaciones no sensibles**.
- Producción no debe operar historias reales sin identidad de staff, RBAC y MFA/AAL2.

## Pendiente humano para habilitar moderación sensible

Se necesita seleccionar y configurar un proveedor de identidad de staff que permita obtener de forma verificable, en backend, al menos:

- identificador individual estable del operador;
- rol (`safety_reviewer`/`admin` según corresponda);
- nivel de autenticación AAL2/MFA;
- revocación y trazabilidad de acceso;
- integración server-side que no confíe en cabeceras arbitrarias enviadas por el navegador.

Hasta que esa integración esté implementada y probada, no debe reactivarse lectura de cola/brief ni decisiones P0/P1 mediante el token compartido.

## Estado

Código preparado en modo fail-closed para los datos sensibles de moderación. La activación real de lectura/decisión sensible requiere configurar identidad de staff + AAL2 y validar el flujo completo en staging. Además, `desgracias-api-staging` debe tener configurado manualmente `STORY_AUTHOR_UPDATE_PEPPER`; `render.yaml` lo declara como `sync: false` para impedir que un valor secreto entre en el repositorio.
