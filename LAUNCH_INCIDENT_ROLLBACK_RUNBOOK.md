# Launch incident & rollback runbook

Estado: release-critical. Aplica a la beta pública controlada de Desgracias.es.

## Principio

Safety y privacidad prevalecen sobre disponibilidad, SEO, métricas y crecimiento. Ante un incidente P0 se detiene la ampliación de audiencia y se restaura el último SHA certificado antes de investigar mejoras.

## Severidad

### P0 — bloqueo de lanzamiento / rollback inmediato
- Ayuda urgente inaccesible, incorrecta o degradada de forma material.
- Una consulta sensible del buscador sale a red, URL, almacenamiento, historial o telemetría.
- Clasificación Safety puede ocultar ayuda urgente ante riesgo ambiguo o etiquetar sistemáticamente como crisis activa contextos no activos.
- Monetización, afiliación, lead-gen o CTA comercial aparece en P0/P1.
- Publicación/recepción de historias deja de estar fail-closed mientras identidad nominal + AAL2 siga pendiente.
- Compromiso de integridad del sitio, contenido malicioso o pérdida material de privacidad.

Acción: congelar merges y distribución; identificar último SHA production-v9 certificado; preparar PR de reversión contra el SHA vigente; exigir gates completos; fusionar solo el rollback; certificar Engineering + SEO + Origin + Pages sobre el nuevo SHA.

### P1 — corregir antes de ampliar audiencia
- Recurso crítico roto sin alternativa equivalente visible.
- Regresión grave móvil, teclado, zoom o lector de pantalla en un recorrido prioritario.
- 404/canonical/robots que impida un recorrido MVP importante.
- Mensaje legal o de privacidad materialmente incoherente con el comportamiento real.

Acción: mantener audiencia controlada o pausarla según impacto; rama aislada; corrección mínima; gates completos; integración serial.

### P2 — post-lanzamiento salvo acumulación
Defectos cosméticos o de contenido sin impacto Safety, privacidad, accesibilidad crítica ni recorrido MVP.

## Detección y triage

1. Registrar hora, URL/ruta, SHA de producción y evidencia reproducible.
2. Clasificar P0/P1/P2 por impacto real, no por origen del reporte.
3. Para P0: NO-GO inmediato para nuevas integraciones y ampliación de audiencia.
4. Verificar si el problema existe en producción y si el último SHA certificado anterior está libre del defecto.
5. No borrar evidencia ni modificar tests para obtener verde.

## Rollback por PR de reversión

Nunca mover `production-v9` a mano ni forzar el ref.

1. Leer el SHA vigente de `production-v9`.
2. Identificar el merge commit culpable y el último SHA certificado anterior.
3. Crear rama `rollback/<incidente>-<fecha>` desde el SHA vigente.
4. Revertir únicamente el cambio causante, preservando cambios posteriores independientes cuando sea seguro. Si no puede aislarse, mantener HOLD y preparar reversión compuesta revisable.
5. Confirmar Scope Firewall: solo archivos necesarios.
6. Ejecutar gates aplicables sobre el mismo head SHA: Safety específico, Engineering Quality Gate, Production SEO Integrity, accesibilidad/enlaces cuando aplique y preview Pages.
7. Fusionar un único PR.
8. Sobre el nuevo SHA exacto de producción certificar Engineering + SEO + Origin/TLS/V9 + Pages.
9. Verificar manualmente el recorrido que originó el incidente.
10. Documentar causa, impacto, detección, corrección y prevención.

## Criterio de rollback viable

Un rollback se considera viable solo si puede ejecutarse mediante PR revisable sin force-push a producción, conserva la portada V9 salvo autorización expresa, no debilita gates y termina con certificación exact-SHA.

## Checklist GO/NO-GO tras incidente

- [ ] Causa P0 eliminada o contenida de forma fail-closed.
- [ ] Ayuda urgente accesible.
- [ ] Buscador no transmite ni persiste consultas sensibles.
- [ ] P0/P1 sin monetización.
- [ ] Historias sensibles fail-closed si #117 continúa abierto.
- [ ] Engineering verde en SHA exacto.
- [ ] SEO verde en SHA exacto.
- [ ] Origin/TLS/V9 verde en SHA exacto.
- [ ] Pages verde en SHA exacto.
- [ ] Recorrido afectado revalidado.

## Límites humanos/HOLD

Este runbook no declara resueltos: #147 procedencia/licencia `manos-apoyo`; #117 identidad nominal + AAL2; #111 revisión profesional de ahogamiento; #110 revisión clínica/legal de Cáncer; #83 backup externo + restore drill real; #1 seguro/gestión de riesgo.

## Ensayo seguro previo al lanzamiento

El ensayo no debe introducir un defecto real en producción. Se valida el procedimiento mediante una rama efímera desde producción: cambio inocuo y aislado en documentación, commit de reversión en la misma rama y comprobación de que el árbol final coincide con el SHA base para ese archivo. El ensayo se documenta; no se fusiona un cambio destructivo para probar rollback.

<!-- ROLLBACK_REHEARSAL_TRANSIENT_MARKER_2026-09-09: never merge -->
