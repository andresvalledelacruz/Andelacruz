# Acceso nominal de Ops — preparación

## Decisiones del propietario, 20/10/2026

El propietario confirma que será administrador y revisor de candidaturas y autoriza
preparar acceso individual con MFA. La implementación elegida para preparar esa
integración es Supabase Auth; el único proyecto observado es el de staging.
Las cuatro redes comerciales están **solicitadas**, según su declaración, no
aprobadas. No hay destino independiente de backup disponible. La imagen de manos
se declara generada con IA, sin identificar todavía herramienta, fecha y condiciones.
La respuesta afirmativa sobre apoyo profesional/seguro no identifica qué cobertura
o revisión existe: continúa pendiente de documentación. Ninguna de estas
respuestas sustituye la revisión de privacidad del formulario.

## Estado técnico

El backend puede verificar identidad nominal en staging, desactivada por defecto.
No crea usuarios, no asigna administradores automáticamente, no entrega acceso al
primer usuario que se registre y no activa la recepción pública de solicitudes.
El guard de entorno de Ops sigue limitando las rutas al servicio de staging.
No existe todavía una interfaz de alta/MFA integrada en el panel. No cerrar #117
sin prueba real de cuenta nominal, MFA, roles, revocación y recuperación de acceso.

Configuración exclusivamente de servidor:

- `OPS_SUPABASE_AUTH_ENABLED=true` habilita la opción.
- `OPS_SUPABASE_URL`: origen HTTPS del proyecto Supabase correcto, sin rutas.
- `OPS_SUPABASE_PUBLISHABLE_KEY`: clave publicable moderna; no admite clave secreta.
- `OPS_ADMIN_SUBJECTS`: UUID de usuarios administradores expresamente autorizados,
  separados por coma, hasta 16. No nombres ni correos. Vacío deniega todo acceso.
- `DATABASE_URL`: conexión de servidor al mismo proyecto, con SELECT autorizado en
  las tablas Auth necesarias. No ampliar permisos de `anon` o `authenticated`.

No escribir UUID reales, claves ni tokens de sesión en el repositorio, logs o chat.
Modificar la lista de administradores exige actualizar la configuración del servicio
y reiniciarlo. Para revocar inmediatamente una sesión, usar el mecanismo de cierre
correspondiente en Auth y comprobar su desaparición del registro de sesiones.

## Comprobaciones por petición

1. Rechaza formatos inválidos, emisor/audiencia distintos, tokens caducados,
   AAL1, ausencia de sesión y sujetos fuera de la lista del servidor.
2. Envía el mismo bearer al endpoint `/auth/v1/user` del proyecto configurado,
   con clave publicable y plazo de cinco segundos; no sigue redirecciones.
3. Exige que la identidad validada coincida y no sea anónima.
4. Consulta la sesión exacta y su usuario/factor: sesión AAL2 no vencida,
   factor todavía verificado, usuario no eliminado, no anónimo y no bloqueado.
   La consulta tiene un plazo de cinco segundos y usa parámetros.
5. Vuelve a comprobar caducidad del token y construye el principal admin del
   servidor. Ignora roles y AAL de user_metadata/cabeceras del navegador.
6. Aplica el RBAC existente, incluida la reevaluación Safety de las decisiones.

El puente heredado permanece separado y no obtiene acceso sensible. No se envía
su token a Supabase. Fallos de Auth, red o base de datos deniegan acceso.
Esta comprobación no sustituye la política de caducidad/inactividad configurada en
Auth: `not_after` se respeta, pero no se afirma implementar un temporizador de
inactividad independiente. No se guardan ni se refrescan tokens en este módulo.

## Validación

Pruebas de configuración, claims adversariales, rechazo de Auth, usuario/sesión,
metadatos editables, caducidad durante la comprobación y aislamiento del puente.
Se ha ejecutado en el proyecto de staging una consulta de solo lectura con UUID
nulos: devuelve false y confirma la compatibilidad de tablas/columnas; **no** es
una prueba positiva de autenticación real. No se han leído secretos MFA ni datos
de usuarios. El alta real requiere identificar la cuenta del propietario, completar
MFA por su canal seguro y probar acceso/revocación de extremo a extremo.

Referencias: https://supabase.com/docs/guides/auth/auth-mfa y
https://supabase.com/docs/guides/auth/sessions . Revisado changelog vigente;
la retirada anunciada de cifrados TLS antiguos no modifica este contrato Node 24.
