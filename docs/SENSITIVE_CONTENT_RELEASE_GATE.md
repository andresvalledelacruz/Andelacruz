# Gate de publicación — Cáncer y Emergencias accidentales

Estado: **PREPARADO**. Control interno; no publica páginas ni modifica la portada V9.

## Finalidad

`src/sensitive-content-release-gate.js` convierte en condiciones ejecutables los HOLD establecidos para Cáncer y para ahogamiento, sumersión y sofocación accidentales. Evalúa frente, modo, actualidad de fuentes y aprobaciones humanas antes de permitir que una propuesta pase a implementación pública.

## Decisiones

- `SAFETY_GATEWAY`: emergencia o riesgo inmediato. Nunca publica automáticamente; en emergencias accidentales exige 112 primero.
- `HOLD_REVIEW_REQUIRED`: faltan fuentes actuales, revisiones, credenciales o el frente/modo es desconocido.
- `READY_FOR_IMPLEMENTATION`: solo significa que puede entrar en la fase de implementación. No sustituye Engineering, SEO, revisión visual/editorial ni certificación post-merge.

## Reglas de Cáncer

- todos los modos exigen revisión clínica y editorial con credencial verificada;
- trabajo/trámites exige además revisión legal;
- nunca habilita consejo individual automatizado ni interfaz comercial;
- una fuente debe ser oficial o clínica consensuada, HTTPS y verificada en los últimos 120 días;
- diagnóstico, pronóstico, prescripción y CTA comercial permanecen prohibidos.

## Reglas de Emergencias accidentales

- prevención exige revisión Safety y editorial;
- emergencia y después exigen revisión clínica de emergencias, Safety y editorial;
- `emergency` activa siempre Safety Gateway, aunque existan aprobaciones;
- 112 debe ser la primera acción en la experiencia de emergencia;
- no se mezclan instrucciones de ahogamiento en agua con atragantamiento/asfixia.

## Evidencia de revisión

El gate solo acepta aprobaciones estructuradas con:

- rol requerido;
- `approved=true`;
- `credential_verified=true`;
- fecha válida de revisión.

No almacena nombres, documentos de identidad ni copias de credenciales. El expediente de acreditación debe residir en el sistema autorizado que se adopte posteriormente.

## Límite

Este gate evita una liberación accidental desde código. No afirma que exista ya un oncólogo, profesional de emergencias o asesor jurídico contratado. Esas revisiones continúan como `Pendiente de Andrés` en los issues #110 y #111.

