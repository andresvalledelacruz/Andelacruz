# Accidentes — Human Demand & Safety Intelligence

Estado: arquitectura estratégica inicial. No implica publicación automática de URLs.
Última revisión: 2026-08-31.

## Principio rector

El frente `accidents` se trata como YMYL sensible por defecto porque puede mezclar emergencia, salud, menores, trabajo, seguros y cuestiones jurídicas. La plataforma debe separar siempre **qué hacer ahora** de **qué hacer después**, y nunca sustituir al 112, a servicios sanitarios, a profesionales acreditados ni a organismos oficiales.

## Taxonomía inicial

1. **Accidentes de tráfico / siniestros viales**
   - inmediato: seguridad física, 112 si existe emergencia, evitar instrucciones clínicas improvisadas;
   - posterior: documentación, apoyo emocional/social, recursos oficiales, aseguradora, trámites y orientación general;
   - recurso oficial diferencial: DGT 018 para víctimas y personas allegadas, que no sustituye a emergencias.

2. **Accidentes laborales**
   - inmediato: emergencia y asistencia sanitaria cuando proceda;
   - posterior: comunicación, contingencia profesional, mutua/empresa, prestaciones, investigación preventiva y recursos oficiales;
   - nunca determinar responsabilidad empresarial ni cuantías individuales.

3. **Accidentes escolares**
   - inmediato: atención de urgencia y activación del protocolo del centro cuando corresponda;
   - posterior: documentación del incidente, centro educativo, familia/tutor, Seguro Escolar cuando sea aplicable;
   - cualquier ruta con menores mantiene revisión humana reforzada.

4. **Accidentes domésticos / lesiones no intencionales**
   - inmediato: emergencia cuando exista riesgo vital o lesión grave;
   - posterior: recuperación práctica, prevención secundaria y recursos sanitarios generales;
   - no diagnosticar lesiones a distancia.

5. **Accidentes deportivos y de ocio**
   - candidato secundario; requiere estudio de demanda y canibalización antes de URLs públicas.

6. **Otros accidentes**
   - no crear cajón de sastre indexable. Toda nueva subcategoría requiere señal de demanda y fuente oficial suficiente.

7. **Ahogamiento, sumersión y sofocación accidentales**
   - subfrente de Accidentes/Emergencias accidentales, no un hub sanitario general;
   - separar `emergencia inmediata`, `prevención` y `qué hacer después`;
   - distinguir ahogamiento por inmersión/sumersión de atragantamiento, asfixia y estrangulamiento: la familia estadística es amplia, pero las maniobras no son intercambiables;
   - en emergencia priorizar 112, socorrista y recomendaciones oficiales vigentes; cero monetización y cero CTA comercial;
   - menores, rescate, RCP, obstrucción de vía aérea y síntomas posteriores requieren revisión profesional humana.

## Human Demand / SERP

Se observa intención claramente dividida entre:

- `qué hacer después de un accidente de tráfico`;
- `accidente de trabajo qué hacer`;
- `accidente escolar qué hacer`;
- `accidente doméstico qué hacer`.

La SERP comercial de tráfico y trabajo está fuertemente dominada por despachos, reclamación e indemnización. Desgracias.es debe diferenciarse con orientación humana, neutral y oficial-first, sin captación oportunista de personas vulnerables.

Para ahogamiento la SERP mezcla prevención, rescate/RCP, atragantamiento y noticias estacionales. `Ahogamiento` es ambiguo en lenguaje cotidiano: cada URL debe nombrar explícitamente si habla de agua, atragantamiento u otra asfixia para no inducir maniobras incorrectas.

## Fuentes oficiales prioritarias — España

### Tráfico
- DGT — Servicio 018 de atención a víctimas de siniestros viales: https://www.dgt.es/nuestros-servicios/atencion-a-victimas/telefono-atencion/018-servicio-atencion/index.html
- DGT — Qué es el 018: https://www.dgt.es/nuestros-servicios/atencion-a-victimas/telefono-atencion/que-es-el-018/
- Emergencias: 112 cuando exista peligro inmediato.

### Trabajo
- INSST — Seguridad en el trabajo: https://www.insst.es/materias/riesgos/seguridad-en-el-trabajo
- INSST — Notificación e investigación de accidentes de trabajo: https://www.insst.es/normativa/gestion-de-la-prevencion/notificacion-e-investigacion-at-y-ep
- Seguridad Social / normativa LGSS para definición y prestaciones aplicables.

### Escolar
- Seguridad Social — Seguro Escolar e información útil: https://www.seg-social.es/wps/portal/wss/internet/InformacionUtil/44539/43384/45077
- Seguridad Social — Prestaciones del Seguro Escolar: https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/PrestacionesPensionesTrabajadores/28622/28635

### Hogar / lesiones no intencionales
- Ministerio de Sanidad — Lesiones: https://www.sanidad.gob.es/areas/promocionPrevencion/lesiones/home.htm

### Ahogamiento, sumersión y sofocación
- Ministerio de Sanidad — Seguridad en el medio acuático: https://www.sanidad.gob.es/areas/promocionPrevencion/lesiones/medioAcuatico/home.htm
- Ministerio de Sanidad — Informe de prevención de ahogamientos 2025: https://www.sanidad.gob.es/areas/promocionPrevencion/lesiones/medioAcuatico/documentosTecnicos/docs/informeAhogamientosyLesionesGraves.pdf
- Ministerio de Sanidad — Prevención de asfixia, atragantamiento y estrangulamiento: https://estilosdevidasaludable.sanidad.gob.es/seguridad/asfixia/home.htm
- Asociación Española de Pediatría, como apoyo profesional no gubernamental: https://www.aeped.es/
- Emergencia inmediata: 112 y servicio de socorrismo cuando exista.

## Política GO / NO-GO

### GO potencial, después de gate individual
- `/accidentes/` como hub neutral y no comercial.
- `he-tenido-un-accidente-de-trafico-y-no-se-que-hacer-despues` con separación 112 / fase posterior / DGT 018.
- `he-tenido-un-accidente-en-el-trabajo-que-miro-primero` con INSST y Seguridad Social.
- `mi-hijo-ha-tenido-un-accidente-en-el-colegio-que-hago-ahora` solo con revisión humana reforzada por menores.
- preparación no pública de un subhub que desambigüe agua frente a obstrucción/asfixia;
- prevención acuática basada en Sanidad, sin maniobras clínicas individualizadas;
- guía posterior a un episodio no mortal solo tras revisión profesional y criterios oficiales claros de evaluación sanitaria.

### HOLD hasta revisión específica
- indemnizaciones, culpa, responsabilidad, baremos, recargos, demandas, plazos litigiosos;
- diagnóstico de lesiones, pronóstico, medicación o instrucciones clínicas individualizadas;
- accidentes con fallecimiento, trauma severo o menores cuando la redacción pueda inducir decisiones sensibles;
- comparadores o derivación comercial a abogados, clínicas, aseguradoras o peritos.
- instrucciones de rescate, RCP o desobstrucción sin revisión profesional y fuente oficial vigente;
- cualquier texto que sugiera observar síntomas posteriores en casa sin valoración adecuada;
- contenido sobre menores sin safeguarding y revisión reforzada.

### NO-GO
- calculadoras de indemnización presentadas como resultado fiable individual;
- captación comercial P0/P1;
- CTA de préstamo, seguro, abogado o clínica en contexto de emergencia o vulnerabilidad;
- contenido diseñado para alarmar o maximizar conversión por miedo.
- mezclar ahogamiento en agua y atragantamiento bajo una sola secuencia de primeros auxilios;
- recomendar entrar al agua o realizar un rescate que ponga en peligro a quien ayuda;
- monetización, captación de historias o CTA comercial dentro del bloque de emergencia.

## Arquitectura propuesta

`/accidentes/`
- tráfico
- laborales
- escolares
- domésticos
- deportivos/ocio (solo si Human Demand lo justifica)
- ahogamiento, sumersión y sofocación accidentales

Subarquitectura propuesta, todavía no pública:

- `/accidentes/ahogamiento-sumersion-sofocacion/` — subhub de desambiguación.
- `/accidentes/ahogamiento-en-el-agua-emergencia-ahora/` — P0; HOLD hasta gate y revisión profesional.
- `/accidentes/como-prevenir-ahogamientos-en-piscinas-playas-y-otros-entornos/` — prevención; candidato de menor riesgo.
- `/accidentes/despues-de-un-episodio-de-ahogamiento-no-mortal-que-hago/` — alto riesgo sanitario; HOLD.
- `/accidentes/atragantamiento-asfixia-y-estrangulamiento-como-prevenirlos/` — prevención, separado de agua.
- `/accidentes/atragantamiento-emergencia-ahora/` — P0; HOLD hasta gate y revisión profesional.

Cada vertical debe dividirse conceptualmente en:
1. `ahora-mismo` — Safety-first, emergencia, recursos oficiales, cero monetización;
2. `despues` — orientación práctica general, documentación, apoyo y siguientes pasos;
3. `recursos-oficiales` — organismos y vías verificadas;
4. `historias` — solo cuando exista moderación adecuada y sin convertir testimonios en consejo profesional.

## Reglas editoriales

- usar `siniestro vial` cuando corresponda y evitar atribuir culpa;
- distinguir hechos, orientación general y límites profesionales;
- fecha visible de revisión en contenido YMYL;
- enlaces directos a fuentes oficiales;
- cero afirmaciones de expertos locales reales si no existen;
- P0/P1 => `commercial_ui_allowed=false` y analítica mínima agregada;
- menores => revisión humana reforzada;
- no publicar ninguna nueva URL de este frente sin Safety Gate + Engineering + SEO Integrity + revisión editorial.
- emergency-first: 112 antes que cualquier explicación; sin bloque comercial, formulario, suscripción ni recomendador;
- revisión profesional obligatoria de maniobras, signos de alarma y criterios posteriores;
- usar `ahogamiento no mortal` cuando corresponda y evitar expresiones obsoletas o confusas;
- verificar enlaces y recomendaciones antes de cada temporada de baño y tras cambios de guías.

## Pendientes humanos

- revisión jurídica profesional antes de contenidos profundos sobre responsabilidad, indemnización o litigio;
- decisión futura sobre posibles acuerdos con terceros: prohibidos hasta tener política contractual, reputacional y Safety aprobada.
- revisión por profesional acreditado en emergencias/RCP y pediatría cuando afecte a menores;
- validación editorial de los límites entre ahogamiento, atragantamiento, asfixia y estrangulamiento.

