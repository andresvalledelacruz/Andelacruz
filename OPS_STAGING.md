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

- `NODE_ENV=staging`
- `DATABASE_URL` — conexión de staging a Supabase/Postgres.
- `STAGING_OPS_TOKEN` — secreto independiente. No debe almacenarse en código, GitHub, URL ni frontend.

## Flujo

1. La historia ficticia entra en la cola `moderation`.
2. Un operador abre `/ops` e introduce el token en memoria.
3. La consola muestra la cola pendiente.
4. Cada decisión requiere un motivo compatible:
   - `approve` → `safe_and_useful`
   - `reject` → `needs_editing`, `privacy_risk`, `unsafe_guidance`, `spam_or_abuse`, `out_of_scope`, `duplicate_or_test`
   - `escalate` → `crisis_or_safeguarding`
5. La decisión se registra como evento interno y el mensaje original se archiva de `moderation`.
6. Aprobado → `internal_tasks` con tarea `publish_story_candidate`.
7. Escalado → `safety` con tarea `human_safety_review`.
8. Rechazado → `internal_tasks` como evento de auditoría, sin publicación.

## Seguridad

- El token nunca se persiste en `localStorage` ni `sessionStorage`.
- `Cache-Control: no-store`.
- `X-Robots-Tag: noindex, nofollow, noarchive`.
- CSP restrictiva y `frame-ancestors 'none'`.
- Sin datos de historias en logs de decisión.
- Esta autenticación por token es **solo para staging**.
- Producción debe migrar a identidad de staff, RBAC y MFA/AAL2 antes de operar con historias reales.

## Estado

Código preparado para despliegue. La activación real requiere crear/configurar el servicio `desgracias-ops-staging` en Render y definir sus secretos allí.
