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
- `STAGING_OPS_TOKEN` es un puente transitorio exclusivamente para operaciones no sensibles.
- El token compartido no puede leer cola/brief de moderación ni emitir ninguna decisión `approve`, `reject` o `escalate`.
- Toda lectura de casos y toda decisión de moderación requieren identidad individual de staff y AAL2/MFA.
- Los casos P0/P1 requieren además rol/capability de Safety.
- Comparación del token con `crypto.timingSafeEqual`.
- `Cache-Control: no-store`.
- `X-Robots-Tag: noindex, nofollow, noarchive`.
- No se habilita CORS de forma general.
- Los logs de decisión no incluyen el texto de la historia.

`STAGING_OPS_TOKEN` no sustituye identidad de staff. Producción debe usar identidad real, MFA AAL2, RBAC, separación de funciones y auditoría persistente.

## Roles previstos para producción

- `moderator`: decisiones estándar con identidad individual y AAL2.
- `safety_reviewer`: revisión y decisión de casos P0/P1 con identidad individual y AAL2.
- `admin`: administración de políticas y accesos con mínimo privilegio.
- `analyst`: métricas agregadas sin acceso innecesario al texto sensible.

## AAL2 y RBAC

Las acciones `approve`, `reject`, `escalate`, suspensión, revocación y reinstalación deben comprobar sesión AAL2 y capability específica antes de ejecutarse. El token de staging no puede usarse como identidad individual ni como bypass de este control.

## Endpoints preparados

- `GET /health`
- `GET /ready`
- `GET /ops/moderation/pending?limit=10` — identidad individual + AAL2
- `GET /ops/moderation/:messageId/brief` — identidad individual + AAL2
- `POST /ops/moderation/:messageId/decision` — identidad individual + AAL2; P0/P1 además Safety

Payload de decisión:

```json
{
  "decision": "approve | reject | escalate",
  "reason_code": "safe_and_useful | needs_editing | privacy_risk | unsafe_guidance | crisis_or_safeguarding | spam_or_abuse | out_of_scope | duplicate_or_test",
  "note": "opcional, máximo 500 caracteres"
}
```

## Importante

Este módulo está preparado en código pero la moderación permanece deliberadamente fail-closed hasta conectar y verificar identidad individual de staff + AAL2 en backend. No crear un enlace desde Cloudflare Pages público y no reactivar decisiones mediante el token compartido.
