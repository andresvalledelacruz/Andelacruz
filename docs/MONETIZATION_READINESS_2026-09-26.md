# Monetization Readiness — 26 septiembre 2026

Estado: **preparación técnica; monetización no activada**.

Este documento separa con rigor lo ya construido de lo que todavía necesita evidencia externa, revisión o decisión del titular. No autoriza anuncios, afiliación, captación comercial ni cambios en superficies sensibles.

## Resumen ejecutivo

La prioridad económica es llegar a un primer piloto comercial de baja sensibilidad sin contaminar las rutas de ayuda crítica. La arquitectura ya dispone de firewall P0/P1 y de un guard de elegibilidad que falla cerrado. El siguiente escalón es un registro explícito de superficies: solo las rutas revisadas una por una pueden avanzar; todo lo demás permanece denegado.

## Estado verificable en repositorio

| Elemento | Estado | Evidencia / criterio |
|---|---|---|
| Firewall P0/P1 | VERIFICADO EN CÓDIGO | Tests de rutas críticas bloquean marcadores publicitarios, afiliación, pago y CTA comercial. |
| Guard de elegibilidad | IMPLEMENTADO | `scripts/lib/monetization-eligibility.mjs`: P0/P1 y clasificación desconocida denegados; P2/P3 requieren inventario Safety y prerrequisitos explícitos. |
| Registro de superficies | EN REVISIÓN | `data/monetization-surfaces.json`: deny-by-default y `activation_enabled=false`. |
| Primera superficie candidata | EN REVISIÓN | `/trabajo/necesito-formacion-para-encontrar-trabajo/`; candidata, no aprobada y no monetizada. |
| Publicidad / afiliación activa | NO | Este bloque no inserta scripts, anuncios, enlaces patrocinados ni checkout. |
| `ads.txt` | AUSENTE | No crear un identificador ficticio. Hace falta el publisher ID real si se decide usar AdSense. |
| Política de cookies | EXISTE, FASE NO PUBLICITARIA | Declara que actualmente no hay cookies publicitarias y exige actualizar mecanismo/política antes de publicidad no esencial. |
| Aviso legal / privacidad | EXISTEN, FASE NO ECONÓMICA | Ambos documentos indican que el proyecto está en fase no económica; deben revisarse antes de activar actividad económica. |

## Bloqueos que no deben fingirse resueltos

| Dependencia | Estado 26-09-2026 | Evidencia necesaria para cerrar |
|---|---|---|
| Cuenta AdSense y sitio aceptado | NO CONFIRMADO | Estado autenticado del panel y sitio en estado apto/listo. |
| Publisher ID para `ads.txt` | NO CONFIRMADO | ID real del titular/proyecto; nunca inventarlo ni publicarlo desde una captura dudosa. |
| CMP / consentimiento para publicidad no esencial | NO IMPLEMENTADO / NO CERTIFICADO | Proveedor/mecanismo elegido, configuración, pruebas de aceptar/rechazar y bloqueo previo de tags. |
| Revisión legal/privacidad de fase económica | PENDIENTE | Revisión de aviso legal, privacidad, cookies, transparencia, contratos y base jurídica según modelo real. |
| Seguro/riesgo del servicio comercial | PENDIENTE / NO ACREDITADO | Alcance del servicio, riesgos, póliza o decisión documentada aplicable. |
| Partner comercial | NINGUNO APROBADO EN ESTE REGISTRO | Identidad, contrato, territorio, condiciones, precio/tarifa, reclamaciones y due diligence. |
| Superficie comercial aprobada | 0 | Revisión individual Safety + editorial + legal/privacidad + UX y aprobación explícita. |

## Primera candidata: formación para encontrar trabajo

Ruta: `/trabajo/necesito-formacion-para-encontrar-trabajo/`.

Motivos para estudiarla primero:

- el contenido ya obliga a comprobar una brecha laboral real antes de pagar;
- prioriza alternativas públicas o subvencionadas antes de opciones comerciales;
- enseña a comparar coste total, acreditación, resultados y señales de alerta;
- su criterio editorial ya contempla que, si no existe una necesidad clara, la salida correcta es no recomendar ninguna compra.

**Esto no equivale a aprobar la monetización de la página.** En el registro figura como `candidate_review`, con `surface_approved=false`.

Modelos que pueden estudiarse sin activarlos todavía:

1. partner educativo cuidadosamente seleccionado;
2. lead cualificado y voluntario cuando el usuario haya identificado una necesidad de formación real.

No se aprobarán pagos por posición editorial, venta de la etiqueta de “verificado”, promesas de empleo ni proveedores que mezclen financiación opaca con la recomendación.

## Secuencia para llegar a ingresos sin saltarnos gates

1. Cerrar M0: guard + registro de superficies + kill-switch lógico + tests deny-by-default.
2. Resolver identidad/fase económica y revisión legal/privacidad.
3. Elegir una sola superficie de baja sensibilidad y completar su revisión.
4. Elegir un modelo comercial real y un proveedor/partner verificable; documentar precio, comisión y obligaciones.
5. Implementar consentimiento/disclosure cuando corresponda y demostrar que ninguna petición comercial sale desde P0/P1.
6. Lanzar un piloto pequeño, medible y reversible.
7. Medir oferta mostrada → interacción voluntaria → lead/venta válida → ingreso cobrado, sin utilizar consultas sensibles ni historias como atributos publicitarios.
8. Solo después ampliar inventario o estudiar AdSense limitado.

## Regla de decisión

Un incremento potencial de ingresos no justifica convertir rutas de crisis, violencia, duelo sensible, salud delicada o deuda crítica en inventario comercial. Si la clasificación o el contexto es ambiguo, el resultado es **DENY/HOLD** hasta revisión, no “probar y ver”.
