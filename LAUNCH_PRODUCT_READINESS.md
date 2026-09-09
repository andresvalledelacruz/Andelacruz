# Launch Product Readiness — Desgracias.es

Fecha de referencia: 9 septiembre 2026

## Propósito

Este documento convierte la ruta crítica de lanzamiento en un ledger único de evidencia y decisiones GO/NO-GO. No sustituye los gates existentes ni declara pruebas manuales como realizadas sin evidencia.

## Release candidate de referencia

- Rama protegida: `production-v9`
- SHA de partida de este ledger: `9cab22f93feadc39be2f5af13ca2aecf8dd0c75e`
- Portada V9: protegida; solo se permiten cambios expresamente autorizados.
- Integración visible del buscador y prioridad de ayuda urgente: ya autorizadas e integradas.

## Estado de ruta crítica

| Frente | Estado | Evidencia / condición |
| --- | --- | --- |
| Safety P0/P1 | VERDE AUTOMÁTICO / vigilancia continua | Gates de inventario, privacidad, medición segura, recorridos críticos y liveness integrados. Cualquier P0 reabre NO-GO. |
| Buscador Safety-first | VERDE AUTOMÁTICO | Procesamiento local/privado, `noindex`, fallback sin JS y cierre transitivo de privacidad protegidos por tests. |
| Ayuda urgente | VERDE AUTOMÁTICO | Acceso prioritario y recursos críticos 112/024 protegidos por recorridos/liveness. |
| Privacidad de medición | VERDE AUTOMÁTICO | Gate fail-closed de medición segura reconstruido y fusionado; no se permite capturar texto sensible. |
| D5 recorridos / 404 / canonical / robots / sitemap | CERRADO AUTOMÁTICO | Gates de recorridos y liveness integrados. |
| D6 incidentes / rollback | CERRADO DOCUMENTAL + ENSAYO SOURCE | Runbook integrado y ensayo no destructivo de rollback registrado. Esto no equivale a restore externo de infraestructura. |
| QA móvil 320–430 | PENDIENTE EVIDENCIA MANUAL | Matriz definida; no declarar GO hasta completar dispositivos/viewports requeridos. |
| Teclado / zoom / VoiceOver / TalkBack | PENDIENTE EVIDENCIA MANUAL | Matriz definida; cualquier bloqueo P0/P1 mantiene NO-GO. |
| Gates exact-SHA | OBLIGATORIO EN CADA RC | Safety → Engineering → SEO → accesibilidad/rendimiento/enlaces → Pages/Origin sobre el mismo SHA. |
| Product Readiness | EN CURSO | Este ledger centraliza criterios y bloqueos; el GO final requiere evidencia manual y gates del RC final. |

## Criterios fail-closed para GO

El release candidate es **NO-GO** si ocurre cualquiera de estos supuestos:

1. Existe un defecto P0 Safety, privacidad o accesibilidad.
2. Un recurso urgente crítico no resuelve correctamente.
3. Una consulta sensible puede aparecer en URL, almacenamiento, telemetría o analítica.
4. Existe monetización, afiliación, lead generation o captación en superficies P0/P1.
5. Un recorrido crítico tiene enlace roto, 404 inesperado o destino inexistente.
6. Engineering, SEO, Origin/V9, Pages u otro gate obligatorio no están verdes sobre el mismo SHA.
7. La evidencia manual móvil/AT requerida no está completada o contiene un P0/P1 sin resolver.
8. Se altera la V9 fuera de una autorización expresa vigente.

## Evidencia manual mínima para cerrar D3

Registrar para cada prueba: fecha/hora, SHA exacto, dispositivo/navegador/AT, ruta, resultado PASS/FAIL, defecto asociado y evidencia reproducible.

Mínimos:

- 320, 360, 390, 414 y 430 px sin overflow horizontal funcional.
- Teclado completo: orden de foco, foco visible, activación y escape cuando corresponda.
- Zoom/reflow hasta 200 % sin pérdida de contenido o acción crítica.
- Objetivos táctiles críticos utilizables y sin solapamiento.
- VoiceOver en iOS/Safari para portada → ayuda urgente y portada → buscador → salida Safety-first.
- TalkBack en Android/Chrome para los mismos recorridos.
- Buscador con JavaScript y fallback sin JavaScript.
- Reduced motion y orientación cuando sean aplicables.
- 404 recuperable hacia superficies seguras.

## HOLD humanos que no deben resolverse automáticamente

- `#147`: procedencia/licencia del asset V9 `manos-apoyo`.
- `#117`: identidad nominal + AAL2 antes de publicación/moderación de historias reales.
- `#110` / `#111`: revisión profesional antes de ampliar cáncer y ahogamiento/sofocación.
- `#83`: restore externo real antes de declarar backup/continuidad completa.
- `#1`: seguro/revisión legal y condiciones necesarias antes de adquisición amplia o monetización.

Estos HOLD no deben bloquear trabajo independiente del MVP controlado cuando estén explícitamente fuera de alcance, pero tampoco pueden darse por resueltos por inferencia.

## Decisión de lanzamiento

### GO controlado

Solo cuando:

- cero P0 conocidos;
- P1 de lanzamiento resueltos o formalmente fuera de alcance sin degradar Safety;
- D3 manual completado con evidencia;
- todos los gates obligatorios verdes sobre un único SHA final;
- liveness crítico al 100 %;
- privacidad y medición seguras;
- rollback documentado y ensayo source registrado;
- aviso claro de que Desgracias.es no es un servicio de emergencias ni un canal atendido en directo.

### NO-GO

Ante cualquier incumplimiento anterior, congelar distribución, clasificar el defecto, corregir en rama aislada y repetir la cadena de certificación exact-SHA completa.

## Scope Firewall de este ledger

Este documento es de control de lanzamiento. Su creación no autoriza cambios en `index.html`, CSS/assets V9, buscador productivo, navegación, sitemap, contenido público, tests, workflows o configuración compartida.
