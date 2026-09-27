# Mapa editorial hacia 250 guías · 27/09/2026

## Punto de partida comprobable

Ejecutar `node scripts/audit-editorial-inventory.mjs` en la raíz. El script recorre las URL del sitemap, comprueba que existe su HTML, rechaza páginas `noindex` en el sitemap y cuenta como **guía** las URL de situación con dos niveles de ruta dentro de las macroáreas y las tres guías temáticas nuevas situadas en la raíz, clasificadas explícitamente. Un hub, la portada, Recursos, Buscar, los textos legales y páginas de contacto no cuentan como guía. En el estado de esta entrega: **76 URL del sitemap = 47 guías + 7 hubs + 22 páginas de otro tipo**. La meta de 250 guías exige **203 guías adicionales**. El inventario cuenta publicación, no calidad, tráfico, revisión clínica, ni indexación real en Google.

## Mapa semántico y cupos de planificación

Los cupos son una **distribución editorial propuesta**, no volúmenes de búsqueda ni compromiso de publicar páginas sin validar. Una necesidad no tiene por qué convertirse en una URL independiente: si coincide con otra intención, se resuelve dentro de la guía existente.

| Macroárea / ruta canónica | Guías actuales | Meta propuesta | Diferencia | Intenciones que requieren investigación antes de crear URL |
|---|---:|---:|---:|---|
| Duelo `/duelo/` | 10 | 35 | 25 | primeras semanas; apoyo de amigos; vuelta al trabajo; diferencias entre familiares; fechas señaladas |
| Rupturas `/rupturas/` | 4 | 25 | 21 | primeras 24 horas; límites de contacto; convivencia y vivienda; crianza compartida |
| Soledad `/soledad/` | 5 | 25 | 20 | aislamiento tras mudanza; pedir compañía; crear vínculos; soledad de cuidadores |
| Familia `/familia/` | 7 | 35 | 28 | límites; dependencia y cuidados; conflictos; acceso a ayuda familiar |
| Trabajo `/trabajo/` y guía transversal | 11 | 35 | 24 | despido; búsqueda de empleo; entrevistas; condiciones; entorno hostil |
| Dinero `/dinero/` y guía transversal | 9 | 30 | 21 | gastos prioritarios; deuda; vivienda; fraudes; orientación pública |
| Gestión emocional `/gestion-emocional/` | 0 | 25 | 25 | sobrecarga; rumiación; petición de apoyo; regulación en momentos concretos |
| Salud `/salud/` y guía transversal | 1 | 15 | 14 | pedir cita; acompañar diagnóstico; orientarse en servicios sin recomendar tratamientos |
| Ansiedad `/ansiedad/` | 0 | 15 | 15 | preocupación; miedo; gestión diaria y cuándo buscar evaluación profesional |
| Violencia `/violencia/` | 0 | 10 | 10 | orientación segura de acceso a servicios; las páginas sensibles precisan revisión experta |
| **Total** | **47** | **250** | **203** | |

`/salud/`, `/ansiedad/` y `/violencia/` no se cuentan como hubs publicados: hoy son rutas de entrada o derivación de otro tipo; crear hubs o guías requiere decidir la intención y superar revisión de seguridad. Otras páginas transversales de crisis tampoco se incluyen en la meta de guías.

## Primeras decisiones de producción

1. **Revisar lo existente antes de publicar:** las doce URLs Tier A identificadas en `docs/CONTENT_ENRICHMENT_BACKLOG_V1.md`; mejorar la claridad y corregir datos caducos tiene prioridad sobre aumentar artificialmente el contador.
2. **Candidatas iniciales de bajo riesgo, sujetas a demanda y diferenciación:** vuelta al trabajo después de una pérdida (duelo + trabajo); ruptura con vivienda compartida (rupturas + vivienda); cómo pedir compañía después de una mudanza (soledad); entender a qué ayuda pública acudir por un problema laboral (trabajo). Cada una debe enlazar hacia su hub, una página vecina útil y la ruta de Recursos que corresponda. Si la intención ya se satisface en otra guía, ampliar esa guía y no crear otra URL.
3. **Seguridad reforzada:** suicidio, autolesiones, violencia, menores, salud y finanzas personales necesitan una revisión adicional según `docs/SENSITIVE_CONTENT_RELEASE_GATE.md`. No usar interés comercial para ordenar esos temas ni introducir anuncios en páginas sensibles.
4. **Mercados e idiomas:** una traducción no cuenta automáticamente como nueva guía original. Una guía internacional requiere fuentes, jurisdicción y recursos locales contrastados; evitar traducir por copiar y pegar números de España.

## Ficha mínima que debe acompañar a cada candidata

- Consulta o necesidad real, persona destinataria e intención concreta; evidencia de demanda (Search Console anonimizada si está autorizada, consultas internas agregadas sin texto sensible o investigación documentada).
- Revisión de páginas existentes y motivo por el que una nueva URL aporta respuesta distinta; enlaces de entrada y salida propuestos.
- Fuentes primarias verificables con fecha de consulta, jurisdicción, límites del consejo e indicación de quién revisó el contenido. No atribuir una revisión profesional a personas que no han revisado.
- Detección de crisis y derivación; guía de lenguaje claro; información comercial separada y reglas de monetización aplicables.
- Comprobación editorial, accesibilidad, estado HTTP, canonical, sitemap, contenido útil en móvil y revisión posterior; publicación solo al superar la puerta de calidad y seguridad.

## Cómo medir avance sin confundirlo con visitas

Guardar el resultado de `node scripts/audit-editorial-inventory.mjs` al cierre de cada lote. Cruzar la lista de URL con la cobertura real de Search Console cuando haya acceso y medir por separado guías publicadas, guías revisadas, páginas indexadas, impresiones, clics y siguientes pasos útiles. El inventario local no permite inferir posiciones, tráfico ni ingresos.
