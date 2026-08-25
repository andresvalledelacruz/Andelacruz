# Desgracias.es · Anti-Abuse & Fraud Defense

Estado: arquitectura y motor de staging preparados; integración completa en edge/API/backoffice pendiente.

## Objetivo

Evitar que bots, spam, sabotaje, formularios automatizados, contenido basura, inyección, duplicados masivos o abuso deliberado degraden Desgracias.es, sin tratar como sospechosa a una persona real por escribir de forma extraña, breve, emocional o desordenada.

## Principio

`EDGE → CHALLENGE → FORM INTEGRITY → RATE LIMIT → CONTENT INTEGRITY → QUARANTINE → HUMAN REVIEW → AUDIT`

No existe una única defensa. Se usan capas independientes para que el fallo de una no comprometa todo el sistema.

## Capa 1 · Edge / Cloudflare

- WAF administrado y reglas propias.
- Rate limiting por ruta y método, más estricto en POST públicos.
- protección DDoS y bot management/challenge cuando proceda.
- bloquear patrones manifiestamente automatizados o maliciosos sin depender de JavaScript del navegador.
- separar `/ops` y APIs internas del tráfico público; producción con identidad + MFA y reglas de acceso específicas.

## Capa 2 · Bot challenge

Preferencia técnica inicial: Cloudflare Turnstile por coherencia con la infraestructura ya elegida. El backend debe validar siempre el token; nunca confiar en una marca enviada por JavaScript.

El challenge puede ser adaptativo: no convertir cada relato humano en un CAPTCHA molesto si las señales son normales.

## Capa 3 · Integridad del formulario

- honeypot invisible accesible correctamente para no perjudicar lectores de pantalla.
- marca temporal de inicio de formulario para detectar envíos físicamente improbables, solo como señal, nunca como bloqueo aislado.
- nonce o token de sesión corto contra replay cuando se conecte la capa correspondiente.
- límites estrictos de longitud y tipos.
- normalización antes de comparar duplicados.
- nunca ejecutar HTML, JS o SQL procedente de un relato; tratar siempre como datos.

## Capa 4 · Rate limiting distribuido

El rate limiter en memoria sirve solo como defensa provisional de staging. Antes de producción debe sustituirse/complementarse por límites en Cloudflare y almacenamiento compartido/atómico cuando sea necesario.

Dimensiones posibles:
- IP/edge identifier pseudonimizado
- ruta
- ventana temporal
- hash de contenido
- cuenta/identidad si existe

No crear perfiles comerciales de estas señales.

## Capa 5 · Integridad de contenido

El motor `src/anti-abuse-engine.js` produce una puntuación de riesgo y razones auditables. Señales iniciales:
- honeypot
- velocidad de envío implausible
- ráfagas
- duplicados
- challenge fallido
- marcadores de spam/inyección
- exceso de URLs
- repetición de baja información
- cabeceras anómalas

No decide si una experiencia humana es 'verdadera' ni juzga a la persona. Determina solamente riesgo operativo de abuso.

## Acciones

- `ALLOW_TO_MODERATION`: cola normal.
- `FLAG_FOR_MODERATOR`: cola normal con señal discreta de integridad.
- `QUARANTINE`: bandeja separada; no publicar ni alimentar métricas normales.
- `DROP_OR_CHALLENGE`: rechazo técnico/challenge para patrones de alto riesgo; no generar trabajo humano innecesario.

Contenido crítico de Safety y abuso son dimensiones distintas. Un texto puede ser extraño y a la vez contener una petición real de ayuda; Safety debe tener prioridad cuando exista duda razonable.

## Capa 6 · Reputación operativa, no social

En producción pueden existir señales internas sobre comportamiento de una cuenta o sesión, con caducidad y minimización de datos. Nunca se mostrarán públicamente ni se usarán para crear rankings de personas.

## Capa 7 · Backoffice

El Centro de Mando debe mostrar:
- riesgo anti-abuso y señales
- Safety por separado
- historial de decisiones
- cola de cuarentena
- acciones de liberar, bloquear patrón, escalar seguridad técnica y reportar falso positivo

Las acciones de bloqueo relevantes deben ser auditables.

## Capa 8 · Observabilidad

Métricas agregadas:
- submissions permitidos
- challenged
- quarantined
- dropped
- falsos positivos confirmados
- principales reglas disparadas
- tasa de aprobación posterior por nivel de riesgo
- volumen por ruta y ventana

No enviar texto libre de historias a Google Analytics, Ads ni herramientas comerciales.

## Ataques contemplados

- spam automático y manual
- credential stuffing y brute force en zonas de autenticación
- DDoS/capas 7
- SQL injection/XSS/inyección de cabeceras
- replay de formularios
- scraping agresivo
- abuso de endpoints y enumeration
- payloads enormes
- creación masiva de cuentas cuando exista registro
- spam de comentarios/interacciones
- sabotaje coordinado
- enlaces maliciosos/phishing
- intentos de contaminar SEO con UGC
- scraping/exfiltración de contenido sensible

## Producción

Antes de lanzamiento público:
1. Cloudflare WAF + rate limit + Turnstile/managed challenge.
2. rate limiting distribuido y límites por endpoint.
3. CSP, output encoding, SQL parametrizado, validación de esquema y límites de body.
4. MFA + RBAC para staff; secretos fuera del navegador.
5. logs seguros, alertas y runbooks.
6. backups y restore drills.
7. pruebas de abuso, fuzzing básico y revisión OWASP.
8. cuarentena y appeal/falso positivo.
9. política de retención y hash/pseudonimización de señales técnicas.
10. no confiar en robots/noindex como seguridad.
