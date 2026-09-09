# QA móvil y tecnologías asistivas — Launch Candidate

Base de este frente: `498dd9032784764a2ce25dee293da3113752c4f7` (`production-v9`).

## Objetivo

Cerrar el frente D3 de lanzamiento con una matriz reproducible para móvil, teclado, zoom y tecnologías asistivas, sin tocar la portada V9 ni declarar validaciones manuales que no se hayan ejecutado realmente.

## Regla de GO/NO-GO

- **P0**: cualquier bloqueo que impida acceder a ayuda urgente, 112/024/016, buscador Safety-first, privacidad esencial o navegación básica => **NO-GO**.
- **P1**: pérdida de contenido, foco, lectura, activación o comprensión en móvil/AT => **NO-GO hasta corregir o mitigar explícitamente**.
- **P2**: defecto cosmético sin pérdida funcional => puede pasar a post-lanzamiento si queda registrado.
- No se considera validado ningún ítem manual sin evidencia de ejecución real.

## Viewports mínimos

Ejecutar sobre producción candidata y registrar dispositivo/navegador real o emulado:

| Ancho | Caso | Criterio |
|---:|---|---|
| 320 px | móvil estrecho | sin scroll horizontal, CTA críticos visibles y activables |
| 360 px | Android compacto | orden visual y foco coherentes |
| 390 px | iPhone actual | buscador y ayuda urgente utilizables con una mano |
| 414 px | móvil ancho | sin solapes ni truncados críticos |
| 430 px | móvil grande | jerarquía idéntica y sin reflujo roto |

## Recorridos P0/P1 a repetir en cada viewport

1. Inicio → **Necesito ayuda urgente** → recursos 112/024/016.
2. Inicio → buscador → consulta no crítica → resultados priorizados.
3. Inicio → buscador → consulta de crisis propia activa → ayuda urgente visible sin ocultar resultados pertinentes.
4. Inicio → buscador → preocupación por otra persona.
5. Inicio → buscador → duelo por suicidio.
6. Inicio → buscador → negación/pasado resuelto/hipótesis/cita informativa/ambigüedad.
7. Buscador con JavaScript desactivado → fallback de ayuda segura.
8. Ruta editorial prioritaria → volver/inicio → recurso siguiente paso.
9. URL inexistente → 404 → recuperación.
10. Privacidad → comprobar que no se promete almacenamiento/transmisión de consultas.

## Teclado

- Orden de tabulación sigue el orden visual y de lectura.
- Foco visible en todos los controles interactivos.
- Ningún elemento `aria-hidden` recibe foco.
- No hay trampas de teclado.
- Enter/Espacio activan controles según semántica nativa.
- El acceso a ayuda urgente es alcanzable antes que acciones de menor prioridad cuando comparte región visual.
- El buscador puede completarse y abandonarse sin ratón.

## Zoom y reflow

Validar al menos 200 % y, cuando el navegador lo permita, 400 %:

- no se pierde texto ni funcionalidad;
- no aparece scroll bidimensional en lectura normal;
- controles críticos no se solapan;
- mensajes dinámicos siguen visibles y asociados al contexto;
- ayuda urgente y buscador continúan identificables.

## Táctil

- Objetivos críticos deben ser cómodamente activables y no quedar pegados a otros controles.
- Prioridad: ayuda urgente, 112, 024, 016, enviar/buscar, volver/cerrar cuando exista.
- No depender de hover.
- No existir gestos complejos como única vía de interacción.

## VoiceOver / iOS Safari

Registrar versión de iOS/Safari y resultado por recorrido:

- landmark/regiones comprensibles;
- encabezados en jerarquía lógica;
- nombre, rol y estado de controles correctos;
- ayuda urgente anunciada de forma inequívoca;
- campo de búsqueda con etiqueta y propósito claros;
- resultados y cambios dinámicos anunciados sin ruido excesivo;
- enlaces 112/024/016 comprensibles fuera de contexto;
- no se anuncia contenido oculto del fallback JS cuando JS está activo.

## TalkBack / Android Chrome

Mismos criterios que VoiceOver, añadiendo:

- exploración táctil sin zonas muertas críticas;
- orden lineal coherente;
- controles no duplicados por capas JS/HTML;
- retorno de foco razonable tras ejecutar búsqueda.

## Reduced motion / contraste / orientación

- `prefers-reduced-motion`: ninguna información depende de animación.
- contraste suficiente para texto, foco y CTA críticos.
- portrait y landscape mantienen ayuda urgente y buscador operables.

## Evidencia requerida para cerrar D3

Por cada plataforma real validada registrar:

- fecha/hora;
- dispositivo/OS/navegador;
- SHA exacto probado;
- recorridos ejecutados;
- PASS/FAIL;
- captura o nota reproducible cuando haya fallo;
- severidad P0/P1/P2;
- issue/PR de corrección si procede.

## Estado actual

- Matriz y criterios: **LISTO PARA EJECUTAR**.
- Validación automática existente de accesibilidad/rendimiento: se conserva como gate separado y no sustituye esta matriz manual.
- VoiceOver real: **PENDIENTE DE EJECUCIÓN**.
- TalkBack real: **PENDIENTE DE EJECUCIÓN**.
- QA 320–430 px sobre release candidate definitivo: **PENDIENTE DE EJECUCIÓN**.

## Scope Firewall

Este frente solo puede modificar este documento. Prohibidos: `index.html`, CSS/assets V9, `buscar/`, navegación, sitemap, robots, tests, workflows, código productivo y configuración compartida.
