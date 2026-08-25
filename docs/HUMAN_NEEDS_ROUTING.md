# Human Needs Routing · Desgracias.es

Estado: **motor explicable preparado en código; no es un sistema diagnóstico**.

## Objetivo

Traducir una historia difícil en rutas de ayuda útiles sin reducir a la persona a una etiqueta clínica.

Modelo:

`hecho → emoción/necesidad declarada → contexto → etapa → riesgo → rutas útiles → explicación`

## Principio central

Lo que la persona expresa no se convierte automáticamente en un diagnóstico ni en una recomendación psicológica. El sistema debe distinguir entre necesidades emocionales, sociales, laborales, económicas, jurídicas, relacionales, de hábitos/bienestar y de salud mental.

Ejemplos:

- despido → trabajo/empleabilidad + economía + apoyo emocional;
- ruptura con custodia → pareja/familia + mediación/jurídico + apoyo emocional;
- soledad tras mudanza → comunidad/pertenencia antes de medicalizar;
- deuda → orientación práctica/económica antes de interpretar el malestar como trastorno;
- lenguaje explícito de peligro inmediato → prioridad de seguridad y revisión humana.

## Rutas iniciales

- `emotional_support`
- `grief_transition`
- `relationship_family`
- `work_career`
- `financial_practical`
- `legal_mediation`
- `social_community`
- `wellbeing_habits`
- `clinical_review`
- `urgent_safety`

## Guardarraíles

1. `diagnostic=false` siempre en este motor.
2. No prescribe medicación ni tratamiento.
3. No emite informes periciales.
4. No infiere enfermedades mentales a partir de una historia.
5. Las señales urgentes no producen una decisión clínica automática: activan revisión humana y recursos de seguridad.
6. El usuario debe poder entender por qué aparece una ruta (`reasons`).
7. Una ruta clínica es una opción contextual, no el destino por defecto.
8. Los datos sensibles no deben reutilizarse para segmentación publicitaria.

## Arquitectura de decisión

El motor combina:

- categoría elegida por la persona;
- necesidades que declara explícitamente;
- señales textuales concretas;
- reglas de seguridad de alta prioridad.

La salida ofrece una ruta primaria y hasta tres rutas secundarias. Cada una incluye razones visibles y el límite profesional correspondiente.

## Siguiente integración

1. Ejecutar el router sobre historias sintéticas de staging tras el envío.
2. Guardar únicamente etiquetas/rutas necesarias para producto y moderación, no inferencias clínicas.
3. Mostrar al usuario un bloque de orientación del tipo «Por dónde podrías empezar».
4. Conectar cada ruta con recursos verificados y, cuando corresponda, profesionales acreditados.
5. Añadir revisión humana para cualquier ruta de seguridad.
6. Evaluar precisión y sesgo con casos sintéticos antes de activarlo con usuarios reales.

## Producción

Antes de usarse con contenido real, requiere revisión de Trust & Safety, privacidad, profesionales clínicos acreditados y asesoramiento legal. El motor debe permanecer como sistema de orientación y navegación, no de diagnóstico o tratamiento.
