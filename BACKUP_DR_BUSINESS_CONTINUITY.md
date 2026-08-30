# Desgracias.es — Backup, Disaster Recovery & Business Continuity

Estado: marco operativo
Prioridad: alta, transversal
Propósito: asegurar que Desgracias.es pueda recuperarse de pérdida accidental, corrupción, borrado, fallo de proveedor, compromiso de cuenta o incidente operativo sin depender de una única copia o plataforma.

## 1. Principio rector

GitHub es control de versiones y colaboración, pero no debe considerarse por sí solo un sistema completo de backup y continuidad.

Objetivo mínimo: estrategia 3-2-1 adaptada al proyecto:

- 3 copias lógicas de la información crítica;
- 2 soportes/proveedores distintos;
- 1 copia independiente fuera del proveedor principal.

Un backup no se considera válido hasta que se ha probado una restauración real.

## 2. Activos críticos

Clasificar y proteger al menos:

- repositorio y ramas de producción;
- historial Git completo, tags y referencias relevantes;
- configuración de GitHub Pages y dominio;
- documentación operativa y Safety;
- workflows y tests;
- assets estáticos y contenido publicado;
- configuración de backoffice/moderación cuando exista;
- datos de configuración no secretos necesarios para reconstrucción;
- inventario de secretos y credenciales, sin almacenarlos en texto plano dentro del repositorio;
- proveedores externos, DNS, analítica y servicios conectados;
- decisiones y runbooks necesarios para operar el proyecto.

## 3. Objetivos de recuperación

Definir por activo:

- RPO: pérdida máxima aceptable de datos/cambios.
- RTO: tiempo objetivo para recuperar servicio o capacidad operativa.
- Owner: responsable de restauración/validación.
- Dependencias: servicios externos necesarios.

Mientras no existan valores aprobados formalmente, aplicar criterio conservador: cambios de producción y configuración crítica deben poder reconstruirse desde un snapshot reciente y verificable.

## 4. Copias recomendadas

### Capa A — GitHub

Mantener historial Git, PRs, issues y workflows como fuente operativa principal.

### Capa B — Mirror independiente

Mantener un mirror completo del repositorio en un proveedor o soporte distinto, incluyendo todas las refs relevantes.

### Capa C — Snapshot exportable

Generar periódicamente una copia independiente exportable del repositorio, documentación y configuración recuperable. Esta copia debe almacenarse fuera de la cuenta principal de GitHub.

No guardar secretos sensibles dentro de snapshots sin cifrado y control de acceso adecuados.

## 5. Restore Drill obligatorio

La restauración debe probarse de forma periódica.

Prueba mínima:

1. seleccionar un snapshot/mirror concreto;
2. restaurarlo en un entorno aislado;
3. comprobar integridad Git y ramas relevantes;
4. ejecutar tests/gates disponibles;
5. levantar una copia no productiva del sitio;
6. verificar rutas críticas, assets, canonical, robots, sitemap y recursos Safety;
7. registrar SHA restaurado, fecha, resultado y fallos;
8. corregir el proceso si cualquier paso falla.

Una copia que no supera restore drill se considera no confiable.

## 6. Runbook de incidente

Ante borrado, corrupción o compromiso:

1. detener cambios no esenciales;
2. preservar evidencia y estado actual;
3. identificar último SHA/backup confiable;
4. rotar credenciales si existe sospecha de compromiso;
5. restaurar primero en entorno aislado;
6. ejecutar Safety Gate, Engineering Quality Gate y Production SEO Integrity;
7. comprobar Pages/producción sobre el mismo SHA;
8. recuperar DNS/configuración solo cuando el entorno restaurado sea verificable;
9. documentar causa raíz y acciones preventivas.

Nunca restaurar ciegamente una copia sin validarla.

## 7. Protección frente a errores humanos

Medidas deseables:

- branch protection/rulesets para `production-v9`;
- PR obligatorio y gates requeridos;
- bloqueo de force-push y borrado;
- permisos mínimos necesarios;
- commits pequeños y reversibles;
- snapshots antes de migraciones o cambios de alto impacto.

La falta actual de protección nativa de `production-v9` está registrada como `Pendiente de Andrés` y debe resolverse administrativamente.

## 8. Secretos y credenciales

- no almacenar contraseñas, tokens o claves en Git;
- mantener inventario de qué servicios usan secretos y cómo rotarlos;
- documentar procedimiento de recuperación de acceso;
- aplicar MFA donde sea posible;
- revisar credenciales tras incidentes o cambios de responsables.

## 9. Dependencias externas

Mantener inventario de:

- registrador del dominio;
- DNS;
- GitHub/GitHub Pages;
- analítica/Search Console/Bing u otras plataformas;
- backoffice, base de datos, correo o terceros cuando existan;
- responsables y método de recuperación de cuenta.

Para cada dependencia crítica debe existir al menos una vía documentada de recuperación o sustitución.

## 10. Cadencia de verificación

Revisar periódicamente:

- fecha del último snapshot independiente;
- integridad del mirror;
- último restore drill exitoso;
- cambios de proveedores/dependencias;
- permisos y accesos;
- vigencia del runbook;
- RPO/RTO reales frente a los objetivos.

La cadencia debe endurecerse cuando aumente tráfico, complejidad o volumen de datos.

## 11. Business Continuity

El objetivo no es solo recuperar archivos, sino mantener la capacidad de ayudar con seguridad.

Orden de recuperación recomendado:

1. contenido y recursos P0/P1/Safety;
2. infraestructura mínima de publicación;
3. navegación/hubs y contenido de alta utilidad;
4. funciones operativas/backoffice;
5. analítica, crecimiento y monetización.

Safety prevalece sobre crecimiento durante un incidente.

## 12. Evidencia y checkpoint

Cada prueba o restauración real debe dejar registro verificable de:

- fecha;
- origen de la copia;
- SHA o versión recuperada;
- entorno de restauración;
- gates ejecutados;
- resultado;
- incidencias y correcciones;
- responsable de validación cuando corresponda.

## 13. Pendientes humanos que no bloquean el resto del proyecto

- elegir y configurar destino físico/proveedor independiente de backup;
- custodiar credenciales o claves de cifrado necesarias;
- proteger administrativamente `production-v9`;
- aprobar RPO/RTO formales cuando el proyecto escale.

Estos puntos se marcan `Pendiente de Andrés`; el trabajo técnico y documental independiente continúa.