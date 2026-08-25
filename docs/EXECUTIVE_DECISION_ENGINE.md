# Desgracias.es · Executive Decision Engine

Estado: **fundación técnica de staging**. No sustituye revisión humana ni decisiones profesionales acreditadas.

## Objetivo

Unificar cuatro sistemas de dirección:

1. Human Multidisciplinary Council
2. Digital Product & Engineering Council
3. Trust & Safety Council
4. Google Engineering & Growth Council

Cada decisión importante debe responder simultáneamente a:

- ¿aporta valor real a la persona?
- ¿es segura?
- ¿respeta privacidad y límites profesionales?
- ¿la UX es clara y accesible?
- ¿la arquitectura y operación son sólidas?
- ¿Google/Search/medición pueden trabajar con ella sin degradar confianza?
- ¿genera o protege valor económico sostenible?

## Orden de autoridad

`Safety → Privacidad/Seguridad → Valor humano → UX/Accesibilidad → Ingeniería → Google/Medición → Negocio`

Una capa superior puede bloquear una optimización inferior. Ejemplos:

- Safety puede bloquear monetización.
- Privacidad puede bloquear tracking/growth.
- Valor humano puede bloquear CRO manipulativo.
- Seguridad puede bloquear velocidad de lanzamiento.
- Calidad editorial puede bloquear una oportunidad SEO de volumen.

## Dos modos

### 1. User Case

Entrada: historia, categoría y necesidades declaradas.

Combina:

- Critical Safety Taxonomy
- Human Needs Router
- Multidisciplinary Case Map

Salidas principales:

- `SAFETY_GATEWAY`
- `HUMAN_REVIEW`
- `ROUTE_WITH_GUARDRAILS`

Si Safety Gateway está activo:

- se suprime UI comercial
- analítica mínima/agregada
- recurso oficial y revisión humana primero
- no diagnóstico automático
- no recomendación comercial sensible

### 2. Product Change

Evalúa una nueva función, experimento, página, campaña o integración.

Dimensiones 0–5:

- valor para usuario
- evidencia
- claridad UX
- preparación de ingeniería
- seguridad/privacidad
- safety
- calidad Google/Search
- medición
- valor de negocio
- mantenibilidad

Decisiones:

- `BLOCKED`: existe un hard block ético/seguridad/privacidad.
- `HOLD`: no cumple mínimos o falta preparación.
- `EXPERIMENT`: puede probarse de forma controlada.
- `SCALE_CANDIDATE`: suficientemente equilibrado para valorar escalado.

## Hard blocks

No pueden compensarse con tráfico, ingresos o puntuaciones altas:

- explotar vulnerabilidad
- targeting sensible
- evitar revisión humana en safety
- publicar YMYL sensible sin revisión apropiada
- exponer secretos o PII
- tracking no esencial sin consentimiento aplicable
- vender insignias que impliquen verificación/calidad profesional
- dark patterns o CRO engañoso

## Métrica de dirección

No existe una única métrica reina. El sistema debe observar el funnel completo:

`impresión → clic → visita útil → interacción → confianza → siguiente paso → outcome útil → lead cualificado → ingreso sostenible → retención`

El tráfico sin utilidad no es éxito. La conversión obtenida dañando confianza no es éxito. El ingreso que explota vulnerabilidad no es éxito.

## Uso previsto en staging

Primero se usará como capa interna de producto y moderación. Las decisiones se registrarán con:

- tipo de decisión
- scores/evidencias
- hard blocks
- requisitos pendientes
- resultado
- actor/revisor humano cuando corresponda
- fecha/versión del marco

Después podrá integrarse en backoffice y dashboard de dirección.

## Próximo paso

Conectar el Executive Decision Engine al backoffice para mostrar, junto a cada historia/caso o propuesta interna:

- semáforo de Safety
- mapa multidisciplinar
- requisitos de revisión
- motivos de bloqueo
- estado `HOLD / EXPERIMENT / SCALE_CANDIDATE`

La aprobación final de decisiones sensibles permanece humana.
