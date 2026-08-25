# Motor Multidisciplinar de Necesidades

Estado: **fundación técnica en staging; todavía no expuesta como recomendación automática al usuario final**.

## Objetivo

Convertir la visión de Desgracias.es en una lógica de producto coordinada: una historia no se interpreta desde una única profesión, sino desde varias dimensiones que pueden coexistir alrededor de la misma persona.

La salida del motor sirve para ordenar producto, moderación, recursos, matching de experiencias y futuras derivaciones. No emite diagnósticos, recetas, peritajes ni conclusiones clínicas.

## Principio central

`persona → situación → necesidades explícitas → dimensiones relevantes → siguiente paso → recurso/acompañamiento/profesional adecuado`

No se usa la regla simplista `problema emocional → psicólogo`.

Ejemplos:

- despido + deuda + identidad → trabajo/carrera + economía práctica + apoyo emocional;
- divorcio + hijos + custodia → pareja/familia + mediación/derecho + apoyo emocional;
- soledad tras mudanza → comunidad/pertenencia antes de asumir patología;
- duelo → transición/acompañamiento, con opción clínica solo cuando corresponde;
- riesgo inmediato explícito → seguridad + revisión humana prioritaria.

## Lanes multidisciplinares

1. Apoyo emocional y experiencias similares.
2. Duelo y transición vital.
3. Pareja, familia y mediación.
4. Trabajo, empleabilidad y transición profesional.
5. Orientación económica y práctica.
6. Orientación jurídica o mediación.
7. Red social, comunidad y pertenencia.
8. Sueño, estrés, hábitos y autorregulación.
9. Valoración profesional de salud mental.
10. Seguridad y ayuda urgente.

Cada lane contiene:

- disciplina o conjunto de disciplinas relevantes;
- qué puede hacer la plataforma;
- cuándo debe intervenir un profesional acreditado;
- evidencia explícita que justificó la ruta.

## Guardrails

- No diagnóstico automático.
- No prescripción farmacológica.
- No conclusión forense/pericial.
- No suplantación de profesionales acreditados.
- Riesgo urgente siempre requiere revisión humana y recursos adecuados.
- Problemas prácticos no se psicologizan automáticamente.
- Solicitar ayuda profesional no equivale a tener un trastorno.
- El motor usa señales explícitas y contexto declarado; evita inferencias ocultas sobre atributos sensibles.

## Arquitectura

- `src/human-needs-router.js`: router explicable de necesidades.
- `src/multidisciplinary-case-map.js`: coordina las rutas en un mapa de caso multidisciplinar.
- `tests/human-needs-router.test.js`: pruebas del router.
- `tests/multidisciplinary-case-map.test.js`: pruebas del mapa coordinado.

## Próxima integración

1. Calcular el mapa al recibir una historia de staging.
2. Adjuntarlo a la cola de moderación como metadato interno, nunca como diagnóstico visible.
3. Mostrar al moderador las dimensiones detectadas y su evidencia.
4. Permitir al moderador corregir/confirmar rutas antes de usarlas.
5. Tras aprobación, utilizar solo rutas validadas para recursos, experiencias similares y profesionales.
6. Registrar correcciones humanas para mejorar reglas sin convertirlas en decisiones clínicas automáticas.
7. Integrar la evolución de `Qué pasó después`: las necesidades pueden cambiar con el tiempo y el mapa debe versionarse por actualización.

## Métrica de éxito

El objetivo no es maximizar clics hacia profesionales. Es aumentar la proporción de personas que reciben un siguiente paso pertinente con el mínimo nivel de intervención necesario y seguro.

Métricas futuras:

- precisión de ruta confirmada por moderadores;
- tasa de corrección humana por lane;
- utilidad percibida del siguiente paso;
- derivaciones apropiadas vs. innecesarias;
- tiempo hasta primer recurso útil;
- evolución de necesidades entre historia inicial y actualizaciones.
