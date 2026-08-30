# Safety × Monetización — Política de separación

## Principio

Desgracias.es no monetiza el momento de máxima vulnerabilidad. Las rutas y experiencias clasificadas como P0/P1 deben permanecer libres de publicidad, afiliación, patrocinios, captación comercial y llamadas a compra/contratación.

## Invariante de producto

Para superficies P0/P1:

- prioridad absoluta: seguridad, recursos oficiales y continuidad asistencial;
- sin anuncios programáticos ni scripts publicitarios;
- sin enlaces de afiliación;
- sin patrocinio comercial;
- sin CTA de compra, contratación o lead comercial;
- sin paywall ni bloqueo de ayuda esencial;
- sin experimentos de conversión que compitan con la salida segura;
- sí se permiten enlaces y teléfonos oficiales necesarios para la ayuda.

## Cobertura inicial automatizada

El test `tests/p0-p1-noncommercial-invariant.test.mjs` protege inicialmente:

- `/ayuda-urgente.html`;
- `/alguien-cercano-ha-intentado-suicidarse/`.

Cada nueva URL P0/P1 deberá añadirse al inventario protegido en el mismo PR que la crea. No se considera completa una nueva ruta crítica sin esta cobertura.

## Regla de revisión

Si una URL cambia de clasificación de riesgo, la monetización no se activa automáticamente. Requiere revisión específica Safety + editorial + legal/privacidad cuando proceda.

## Regla de fallo

Si el test detecta un marcador comercial en una ruta protegida, el cambio debe bloquearse y corregirse. No se debilita el test para hacer pasar una implementación.

## Alcance futuro

La arquitectura de monetización general deberá consumir la clasificación Safety como señal de denegación: `P0/P1 => monetization=false`. Esa integración se implementará antes de activar monetización en producción.
