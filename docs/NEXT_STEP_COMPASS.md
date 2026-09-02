# Desgracias.es · Brújula de siguiente paso

Estado: PREPARADO / diseño técnico V1

## Objetivo

La Brújula es una microbatería adaptativa, breve y no diagnóstica para decidir cuánto preguntar antes de orientar a una persona hacia un siguiente paso proporcionado.

No es un test psicológico, no asigna trastornos, no predice resultados y no sustituye evaluación profesional. Su función es reducir fricción y evitar dos errores simétricos: infravalorar una situación relevante o sobrerreaccionar ante un problema que puede abordarse progresivamente.

## Principios

1. Safety siempre tiene precedencia.
2. Preguntar solo lo necesario: la batería termina cuando existe información suficiente.
3. No confundir `no urgente` con `sin importancia`.
4. La resiliencia se mide como recursos y funcionamiento disponibles, nunca como una etiqueta de fortaleza/debilidad.
5. Priorizar decisiones reversibles cuando no hay urgencia.
6. Separar impacto de duración: algo reciente puede ser intenso sin implicar automáticamente escalada clínica.
7. La ruta multidisciplinar puede ser laboral, económica, jurídica, familiar, social, de duelo, hábitos, apoyo emocional o revisión profesional.
8. Las señales críticas bloquean la lógica de proporcionalidad ordinaria y derivan al Safety Gateway.
9. Ninguna salida autoriza diagnóstico, prescripción, peritaje ni decisión clínica automática.
10. No usar respuestas individuales para publicidad, remarketing o targeting sensible.

## Resultados V1

- `IMMEDIATE`: la seguridad tiene prioridad sobre cualquier otra ruta.
- `PRIORITY`: necesita atención prioritaria, aunque no se haya detectado una emergencia inmediata.
- `PROGRESSIVE`: situación importante que puede abordarse por pasos pequeños y revisarse.
- `MANAGEABLE`: dificultad aparentemente manejable con recursos actuales y acciones pequeñas; nunca significa que el problema no importe.

## Preguntas adaptativas V1

1. `safety_now`: seguridad inmediata.
2. `basic_needs`: necesidades básicas y cuidados imprescindibles.
3. `impact`: impacto sobre funcionamiento cotidiano.
4. `trend`: mejora, estabilidad o empeoramiento.
5. `support`: disponibilidad de persona o recurso seguro.
6. `reversibility`: posibilidad de aplazar una decisión importante o probar primero una opción reversible.

No todas las personas reciben las seis preguntas. Las señales explícitas del relato pueden resolver Safety o ruta sin preguntar de nuevo.

## Resiliencia V1

Factores protectores observables:

- necesidades básicas cubiertas;
- funcionamiento conservado total o parcialmente;
- apoyo seguro disponible;
- tendencia estable o favorable;
- posibilidad de aplazar decisiones irreversibles.

Estos factores reducen urgencia operacional cuando es seguro hacerlo, pero nunca anulan Safety.

## Explicabilidad

Cada resultado debe incluir nivel, razones resumidas, factores de impacto, factores protectores, ruta multidisciplinar, siguiente pregunta si falta información y recordatorio no diagnóstico.

## Privacidad

La V1 debe aplicar minimización de datos. No necesita nombre, documento de identidad, dirección, geolocalización precisa ni historial clínico para orientar. Los datos sensibles no se envían a plataformas publicitarias.

## Integración

La Brújula consume `evaluateCriticalSafety` y `routeHumanNeeds`; no replica sus taxonomías. Posteriormente podrá alimentar Executive Decision Engine, moderación y UX pública.

## Validación antes de interfaz pública

- regresiones de Safety;
- fixtures sintéticos de baja, media y alta afectación;
- casos económicos/laborales/jurídicos que no deben psicologizarse;
- accesibilidad del formulario;
- longitud y abandono de batería;
- lenguaje no invalidante;
- privacidad y analítica mínima;
- revisión de falsos positivos/falsos negativos sobre fixtures sintéticos.
