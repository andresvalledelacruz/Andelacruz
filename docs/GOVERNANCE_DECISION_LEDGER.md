# Desgracias.es · Governance Decision Ledger

Estado: **fundación técnica preparada en staging; pendiente de integración completa con `ops-api.js` y visualización persistente en el Centro de Mando**.

## Objetivo

Conservar un historial auditable de decisiones importantes sin almacenar innecesariamente el texto sensible de las historias. El ledger sirve para gobernanza, revisión, aprendizaje y rendición de cuentas interna.

## Principios

1. **Append-only por diseño funcional**: una decisión nueva añade un evento; no se reescribe silenciosamente la anterior.
2. **Minimización de datos**: no se guardan en el ledger historia completa, alias, email, teléfono, token, secreto ni cabeceras de autorización.
3. **Trazabilidad**: cada evento incluye tipo, entidad, referencia técnica, decisión, motivo, actor, fecha y fingerprint SHA-256.
4. **Separación de funciones**: el ledger registra lo ocurrido; no sustituye el sistema fuente ni decide por sí mismo.
5. **Safety y privacidad primero**: en casos críticos se conserva únicamente el resumen necesario para auditar el flujo.
6. **No diagnóstico / no peritaje**: registrar una ruta o nivel Safety no convierte el evento en diagnóstico clínico o conclusión forense.

## Eventos previstos

- `moderation`: aprobación, rechazo o escalado de una historia.
- `product_evaluation`: resultado del Executive Decision Engine para una propuesta de producto.
- `safety_review`: resolución futura de una revisión humana de seguridad.
- `system`: eventos técnicos de gobernanza relevantes.

## Datos permitidos

- `event_type`
- `entity_type`
- `entity_ref`
- `decision`
- `reason_code`
- `score`
- `safety_level`
- `actor_class`
- `occurred_at`
- `metadata` minimizada
- `fingerprint`

## Datos prohibidos en metadata

- `story`
- `text`
- `body`
- `alias`
- `email`
- `phone`
- `token`
- `secret`
- `authorization`

La lista anterior es una defensa básica de staging. Producción debe usar además una política explícita de allow-list y revisión de privacidad.

## Integración prevista

### Moderación

Después de que la transacción de moderación se confirme, registrar un evento con:

- referencia = `moderation_message_id`
- decisión = `approve | reject | escalate`
- motivo = `reason_code`
- Safety = nivel calculado por Executive Decision Engine
- metadata: ruta principal, modo analítico y si la UI comercial estaba permitida.

El texto de la historia no entra en el ledger.

### Consejo de Producto

Tras evaluar una propuesta:

- referencia = identificador interno/slug de propuesta
- decisión = `BLOCKED | HOLD | EXPERIMENT | SCALE_CANDIDATE`
- score = 0–100
- metadata = número de bloqueos y requisitos, sin texto sensible.

### Centro de Mando

Añadir una sección **Historial de gobernanza** que permita ver:

- fecha/hora
- tipo de decisión
- referencia
- resultado
- Safety
- puntuación cuando exista
- fingerprint corto

No debe mostrar contenido sensible de historias.

## Integridad

El fingerprint se calcula sobre hechos esenciales de la decisión. No es una firma criptográfica ni prueba legal de inmutabilidad. Producción debería evolucionar hacia:

- identidad real del actor y AAL/MFA
- registros de auditoría append-only con privilegios separados
- retención definida
- exportación/backup
- detección de manipulación o encadenado de hashes si el riesgo lo justifica
- revisión legal y de protección de datos.

## Estado de implementación

- `src/decision-ledger.js`: creado.
- `tests/decision-ledger.test.js`: creado.
- creación automática de tabla de staging: incluida en el módulo.
- integración en rutas de `ops-api.js`: pendiente.
- panel visual persistente: pendiente.

Hasta completar esas dos últimas piezas, **no debe afirmarse que el ledger está operativo en staging**.
