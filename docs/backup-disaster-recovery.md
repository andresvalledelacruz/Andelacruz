# Backup, Disaster Recovery y continuidad de Desgracias.es

## Objetivo

Poder reconstruir Desgracias.es aunque falle una plataforma completa, se pierda una cuenta, se borre un repositorio, una automatización introduzca daños masivos o una base de datos quede inutilizable.

## Principios

- Backups independientes del proveedor principal.
- Ninguna copia debe contener secretos en texto plano.
- Un backup que nunca se restaura no se considera probado.
- Toda restauración debe poder anclarse a un SHA certificado de `production-v9`.
- Portada V9 y activos bloqueados deben poder verificarse por hash tras una restauración.

## Estrategia 3-2-1 adaptada

1. **Copia operativa:** repositorio GitHub `andresvalledelacruz/Andelacruz` con historial Git completo.
2. **Copia independiente:** espejo Git (`git clone --mirror`) almacenado fuera de GitHub.
3. **Copia bajo control del propietario:** snapshot periódico cifrado y fechado, conservado en al menos un dispositivo externo o almacenamiento distinto al proveedor principal.

## Alcance mínimo del backup

### Código y contenido
- Repositorio Git completo, todas las ramas y tags relevantes.
- `production-v9` y SHA de último despliegue certificado.
- Workflows de GitHub Actions, tests, scripts, documentación, assets y sitemap.

### Datos y backend
- Esquemas, migraciones, políticas RLS y funciones de Supabase.
- Export periódico de tablas necesarias para restauración, aplicando minimización y cifrado adecuados.
- Configuración reproducible del backoffice, moderación y Safety Brain.
- No exportar secretos ni credenciales dentro del repositorio o snapshots sin cifrado específico.

### Infraestructura y operaciones
- Inventario de dominio, DNS, despliegue y dependencias externas.
- Runbooks de GitHub Pages, Cloudflare y servicios asociados.
- Lista de secretos necesarios para reconstrucción **sin incluir sus valores**: nombre, sistema propietario, finalidad y procedimiento de rotación.
- Configuración relevante de Search Console y analítica que deba poder reconstruirse.

## RPO y RTO iniciales

- **RPO objetivo inicial:** máximo 24 horas de pérdida de trabajo o datos no reproducibles.
- **RTO objetivo inicial:** restaurar una versión pública funcional y segura en menos de 8 horas una vez disponibles cuentas y DNS.
- P0/P1, moderación y datos sensibles deberán tener objetivos más estrictos cuando pasen a operación real.

## Procedimiento de snapshot de código

Ejemplo manual desde un equipo controlado:

```bash
git clone --mirror https://github.com/andresvalledelacruz/Andelacruz.git Andelacruz.git
cd Andelacruz.git
git fsck --full
git show-ref
```

Para actualizar un espejo existente:

```bash
cd Andelacruz.git
git remote update --prune
git fsck --full
```

El directorio espejo puede comprimirse y cifrarse después fuera del repositorio. El nombre del snapshot debe incluir fecha y SHA de producción, por ejemplo:

`DESGRACIAS_BACKUP_2026-08-30_SHA-3be2770.zip.enc`

## Verificación mínima

Cada copia se considera válida solo si:

1. `git fsck --full` termina sin errores.
2. Existe el SHA esperado de `production-v9`.
3. Se puede crear un checkout limpio desde ese SHA.
4. Pasan los tests y los gates de integridad aplicables.
5. Los hashes bloqueados de V9 siguen coincidiendo.
6. Se registra fecha, ubicación lógica del backup y resultado de verificación, sin guardar secretos.

## Simulacro de restauración

Frecuencia inicial recomendada: mensual, y además después de cambios grandes de infraestructura.

Escenario mínimo:

1. Crear directorio o entorno aislado vacío.
2. Restaurar el espejo Git sin usar el checkout habitual.
3. Checkout del último SHA certificado.
4. Instalar dependencias desde cero.
5. Ejecutar tests, Safety/Engineering Quality Gate y SEO Integrity localmente o en una rama temporal.
6. Validar que V9 permanece intacta.
7. Documentar tiempo empleado y cualquier dependencia que no estuviera registrada.

## Clasificación de incidentes

- **DR-1:** archivo/commit erróneo. Recuperación mediante Git.
- **DR-2:** rama o repositorio dañado/eliminado. Recuperación desde mirror independiente.
- **DR-3:** pérdida de cuenta/proveedor Git. Restauración en proveedor/repositorio alternativo.
- **DR-4:** pérdida o corrupción de base de datos. Restauración desde backup de datos + migraciones verificadas.
- **DR-5:** compromiso de credenciales. Revocación/rotación antes de restaurar; nunca reutilizar secretos potencialmente comprometidos.
- **DR-6:** pérdida total de plataforma. Reconstrucción desde runbook, mirror Git, backup de datos, DNS e inventario de dependencias.

## Pendientes externos

### Pendiente de Andrés
- Elegir un almacenamiento externo bajo su control para conservar una segunda copia independiente de GitHub.
- Elegir, cuando proceda, un dispositivo físico/NAS/disco externo para una tercera copia.
- Mantener credenciales de dominio, registrador y proveedores en un gestor de contraseñas seguro y con MFA.

## Próximas mejoras técnicas

- Automatizar snapshot periódico del repositorio hacia un proveedor independiente.
- Añadir backup y restore probado de Supabase cuando el entorno de datos definitivo esté fijado.
- Generar un manifiesto de recuperación con SHA de producción, hashes críticos y fecha.
- Añadir prueba automática de restaurabilidad en entorno efímero.
- Definir política de retención (diario/semanal/mensual) según crecimiento y riesgo.

## Regla de cierre

No declarar “backup completo” hasta que exista al menos una copia independiente de GitHub y se haya realizado con éxito un simulacro de restauración desde esa copia.
