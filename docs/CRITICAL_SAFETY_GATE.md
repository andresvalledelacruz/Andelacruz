# Desgracias.es · Critical Safety Gateway

Estado: diseño operativo de staging. No sustituye protocolos clínicos, jurídicos, policiales ni servicios de emergencia.

## Objetivo

Cuando una historia o interacción contiene señales compatibles con riesgo inmediato o una situación crítica, la experiencia normal de la plataforma debe detenerse y pasar a un modo de seguridad. La prioridad deja de ser engagement, SEO, monetización o navegación y pasa a ser: seguridad, recursos oficiales, revisión humana y mínima recopilación de datos.

## Principios no negociables

1. El sistema no diagnostica ni decide clínicamente.
2. Los detectores automáticos solo activan una ruta de seguridad o revisión humana.
3. Una señal crítica nunca se monetiza, no se usa para segmentación publicitaria y no se envía como atributo sensible a plataformas de marketing.
4. No se muestran rankings, recomendaciones comerciales ni contenido que distraiga cuando hay riesgo inmediato.
5. La persona conserva una salida visible para contactar con emergencias o recursos oficiales.
6. Los menores, personas dependientes y víctimas de violencia requieren rutas de safeguarding específicas.
7. Nunca se promete confidencialidad absoluta cuando una actuación legal/profesional real pudiera implicar deberes de protección; en staging no se realizan intervenciones clínicas.
8. La revisión humana tiene prioridad sobre automatismos en decisiones sensibles.

## Niveles operativos

### P0 · Emergencia inmediata

Ejemplos: intento suicida en curso, plan suicida inminente, sobredosis, violencia física activa, amenaza creíble de homicidio, pérdida de conciencia, dificultad respiratoria grave, incendio/evacuación, secuestro/cautiverio en curso.

Comportamiento UX:
- Interrumpir la navegación normal.
- Mostrar mensaje breve y no culpabilizante.
- Priorizar botón de emergencia 112 en España.
- Si la señal es suicida, mostrar también 024.
- Si es violencia contra las mujeres, mostrar 016 y 112 cuando exista peligro inmediato.
- No pedir que la persona escriba una historia larga antes de poder ver la ayuda.
- Crear evento interno de seguridad mínimo y auditable cuando proceda.

### P1 · Riesgo alto / atención urgente

Ejemplos: ideación suicida sin inminencia clara, autolesiones recurrentes, psicosis aguda, manía con pérdida importante de juicio, violencia doméstica continuada con escalada, abuso sexual reciente, retirada grave de sustancias, TCA con signos médicos preocupantes, sinhogarismo con exposición extrema, menor o persona dependiente en situación de maltrato.

Comportamiento UX:
- Mostrar recursos adecuados de forma inmediata.
- Recomendar contacto urgente con servicios sanitarios/sociales/protección según el caso.
- Enviar a revisión humana prioritaria.
- Mantener disponible la opción de continuar contando lo ocurrido solo después de mostrar la ruta de ayuda.

### P2 · Situación grave no necesariamente inmediata

Ejemplos: duelo traumático, diagnóstico de enfermedad grave, ruina económica, desahucio, mobbing, stalking no inminente, discriminación, burnout, dolor crónico, divorcio conflictivo, duelo perinatal, aislamiento severo.

Comportamiento UX:
- No activar una alarma roja por defecto.
- Mostrar un mapa multidisciplinar de siguientes pasos.
- Combinar apoyo emocional con recursos jurídicos, sociales, sanitarios, laborales o económicos según necesidad.
- Escalar a profesional acreditado cuando corresponda.

## Taxonomía crítica ampliada

### Autolesión, suicidio y riesgo para terceros
- Ideación suicida activa.
- Plan o intento suicida.
- Autolesiones recurrentes.
- Amenazas creíbles de homicidio o violencia hacia terceros.
- Acceso inmediato a medios letales acompañado de intención de daño.
- Pacto suicida o conducta suicida compartida.

### Crisis psiquiátrica / médica aguda
- Episodio psicótico agudo con desorganización o peligro.
- Manía grave con pérdida de juicio o conducta de riesgo.
- Delirium/confusión súbita.
- Catatonia o incapacidad extrema para autocuidado.
- Sobredosis, intoxicación o retirada grave de sustancias.
- Crisis de pánico con síntomas que requieren descartar emergencia médica.
- TCA con deshidratación, síncope u otros signos médicos graves.
- Psicosis posparto u otra crisis perinatal aguda.

### Violencia, abuso, coerción y explotación
- Violencia de pareja o intrafamiliar.
- Coercive control / control coercitivo.
- Agresión o abuso sexual.
- Stalking o acecho.
- Secuestro, cautiverio o privación de libertad.
- Trata de personas, explotación sexual o laboral.
- Trabajo forzoso.
- Matrimonio forzado o violencia basada en honor.
- Mutilación genital femenina o riesgo de sufrirla.
- Sextorsión, difusión íntima no consentida o amenazas con material sexual.
- Doxxing acompañado de amenazas creíbles.
- Abuso financiero ejercido por pareja, familiar o cuidador.

### Safeguarding de menores y personas vulnerables
- Maltrato infantil físico, emocional o sexual.
- Negligencia grave infantil.
- Bullying persistente con riesgo para la integridad.
- Grooming sexual online.
- Menor fugado/desaparecido o en riesgo de explotación.
- Maltrato o abandono de persona mayor.
- Maltrato de persona con discapacidad o dependencia.
- Abuso por parte de cuidador.

### Salud física y autonomía
- Accidente grave.
- Traumatismo craneal con síntomas de alarma.
- Pérdida súbita de visión, habla o fuerza.
- Dolor torácico, dificultad respiratoria grave o pérdida de conciencia.
- Quemaduras graves.
- Reacción alérgica grave.
- Empeoramiento agudo de enfermedad crónica con riesgo vital.
- Falta urgente de medicación esencial.

### Vivienda, pobreza y exclusión con riesgo inmediato
- Desahucio inminente sin alternativa segura.
- Sinhogarismo con exposición a frío/calor extremo.
- Falta de alimento, agua o medicación en persona dependiente.
- Corte de suministros esenciales con riesgo sanitario.
- Violencia o explotación en albergue o vivienda.

### Catástrofes y desplazamiento
- Incendio forestal o doméstico con evacuación.
- Inundación, terremoto, derrumbe o explosión.
- Desplazamiento forzado.
- Persona separada de menores/dependientes durante emergencia.
- Pérdida de documentos esenciales tras desastre o desplazamiento.

### Legal, criminal y seguridad personal
- Víctima reciente de delito violento.
- Amenaza extorsiva creíble.
- Detención con vulnerabilidad médica/psiquiátrica.
- Acusación grave con riesgo inmediato de violencia o represalia.
- Discriminación institucional con riesgo de acceso a salud, vivienda o protección.
- Captación coercitiva por sectas o grupos extremistas cuando exista riesgo de violencia/explotación.

## Recursos oficiales España · base inicial

- 112: emergencias vitales, policiales, sanitarias, incendios y otras situaciones urgentes.
- 024: línea nacional, gratuita, confidencial y 24/7 para personas con ideación o conducta suicida y familiares/allegados; puede derivar al 112 en emergencias.
- 016: información, asesoramiento jurídico y atención psicosocial inmediata sobre violencia contra las mujeres; gratuito y confidencial. En peligro inmediato, 112.

Los recursos se almacenarán en un registro versionado por país/territorio, con fecha de verificación y fuente oficial. Nunca se hardcodearán números internacionales sin verificación local.

## UX del Safety Gateway

Orden recomendado:
1. Mensaje humano de seguridad.
2. Acción inmediata principal (p. ej. 112).
3. Recurso especializado pertinente (024, 016 u otros verificados).
4. Opción de ocultar rápidamente la pantalla cuando la seguridad frente a un agresor pueda requerirlo.
5. Información mínima sobre privacidad y qué guarda la plataforma.
6. Opción de continuar con la historia solo si no interfiere con la necesidad inmediata.

## Revisión y gobernanza

- Trust & Safety + profesional acreditado revisan taxonomía y copy.
- Legal/privacidad revisa deberes y límites por país.
- UX prueba comprensión bajo estrés.
- Ingeniería prueba disponibilidad, fallback y degradación segura.
- Analytics registra solo eventos mínimos y no sensibles; nunca texto libre a Google/ads.
- Revisión trimestral de recursos y revisión inmediata cuando cambie una línea oficial.
