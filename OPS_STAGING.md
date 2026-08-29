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
- `STAGING_OPS_TOKEN` — secreto independiente. No debe almacenarse en código, GitHub, URL ni frontend.

## Flujo

1. La historia ficticia entra en la cola `moderation` con el hash de su credencial de actualización, nunca con el secreto bruto.
2. La respuesta 202 del alta devuelve el secreto bruto una sola vez para que el autor pueda conservarlo; no se registra en logs ni se persiste en la cola.
3. Un operador abre `/ops` e introduce el token en memoria.
4. La consola muestra la cola pendiente.
5. Cada decisión requiere un motivo compatible:
   - `approve` → `safe_and_useful`
   - `reject` → `needs_editing`, `privacy_risk`, `unsafe_guidance`, `spam_or_abuse`, `out_of_scope`, `duplicate_or_test`
   - `escalate` → `crisis_or_safeguarding`
6. La decisión se registra como evento interno y el mensaje original se archiva de `moderation`.
7. Aprobado → `internal_tasks` con tarea `publish_story_candidate`.
8. Escalado → `safety` con tarea `human_safety_review`.
9. Rechazado → `internal_tasks` como evento de auditoría, sin publicación.

## Seguridad

- `STORY_AUTHOR_UPDATE_PEPPER` y `STAGING_OPS_TOKEN` son secretos distintos y no reutilizables.
- El secreto de actualización del autor no se persiste en bruto; únicamente se deriva y propaga su hash.
- El token de operaciones nunca se persiste en `localStorage` ni `sessionStorage`.
- `Cache-Control: no-store`.
- `X-Robots-Tag: noindex, nofollow, noarchive`.
- CSP restrictiva y `frame-ancestors 'none'`.
- Sin datos de historias ni credenciales en logs de decisión.
- Esta autenticación por token es **solo para staging**.
- Producción debe migrar a identidad de staff, RBAC y MFA/AAL2 antes de operar con historias reales.

## Estado

Código preparado para despliegue. La activación real requiere crear/configurar el servicio `desgracias-ops-staging` en Render y definir sus secretos allí. Además, `desgracias-api-staging` debe tener configurado manualmente `STORY_AUTHOR_UPDATE_PEPPER`; `render.yaml` lo declara como `sync: false` para impedir que un valor secreto entre en el repositorio.
