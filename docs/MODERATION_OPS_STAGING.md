# Desgracias.es · Moderation Ops (staging)

## Objetivo

Separar las operaciones internas de moderación de la API pública y del frontend público. El módulo `src/ops-api.js` es una API interna de staging. No debe exponerse como backoffice público.

## Flujo

`web_staging -> moderation -> decisión humana -> internal_tasks | safety`

- `approve`: crea una tarea `publish_story_candidate` en `internal_tasks` y archiva el mensaje original de `moderation`.
- `reject`: registra la decisión en `internal_tasks` y archiva el mensaje original.
- `escalate`: mueve el caso a `safety` como `human_safety_review` y archiva el mensaje original.

Las decisiones se ejecutan dentro de una transacción PostgreSQL para evitar una decisión parcial entre el envío a la cola siguiente y el archivado de la cola de moderación.

## Seguridad de staging

- Solo funciona cuando `NODE_ENV=staging`.
- Requiere `STAGING_OPS_TOKEN` y `Authorization: Bearer <token>`.
- Comparación del token con `crypto.timingSafeEqual`.
- `Cache-Control: no-store`.
- `X-Robots-Tag: noindex, nofollow, noarchive`.
- No se habilita CORS de forma general.
- Los logs de decisión no incluyen el texto de la historia.

`STAGING_OPS_TOKEN` es únicamente un mecanismo temporal de staging. Producción debe sustituirlo por identidad de staff real, MFA AAL2, RBAC, separación de funciones y auditoría persistente.

## Roles previstos para producción

- `companion_reviewer` / `moderation_reviewer`: revisión y propuesta de decisión.
- `safety_reviewer`: escalados de seguridad.
- `moderation_admin`: políticas, reinstalaciones y excepciones.
- `analyst`: métricas agregadas sin acceso innecesario al texto sensible.

## AAL2 y RBAC

Las acciones `approve`, `reject`, `escalate`, suspensión, revocación y reinstalación deberán comprobar sesión AAL2 y capability específica antes de ejecutarse. El token de staging no sustituye este control.

## Endpoints preparados

- `GET /health`
- `GET /ready`
- `GET /ops/moderation/pending?limit=10`
- `POST /ops/moderation/:messageId/decision`

Payload de decisión:

```json
{
  "decision": "approve | reject | escalate",
  "reason_code": "safe_and_useful | needs_editing | privacy_risk | unsafe_guidance | crisis_or_safeguarding | spam_or_abuse | out_of_scope | duplicate_or_test",
  "note": "opcional, máximo 500 caracteres"
}
```

## Importante

Este módulo está preparado en código pero no está desplegado como servicio interno. No crear un enlace desde Cloudflare Pages público. El siguiente paso es levantarlo como servicio interno/privado de staging y construir el backoffice separado con autenticación de staff.
