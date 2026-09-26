# Commercial Measurement Contract

## Propósito

Definir qué se podrá medir cuando exista una superficie comercial aprobada, sin convertir las consultas de ayuda, historias o circunstancias sensibles en datos publicitarios.

Este contrato **no activa tracking comercial**. Solo fija el vocabulario y los límites que una implementación posterior deberá respetar.

## Eventos permitidos

### Cliente

- `commercial_offer_view`: una oferta comercial aprobada se ha mostrado en una superficie aprobada.
- `commercial_offer_click`: el usuario ha pulsado voluntariamente una oferta comercial aprobada.

El cliente no puede declarar conversiones, ventas ni ingresos.

### Servidor / conciliación

- `commercial_lead_confirmed`: un lead válido ha sido confirmado por una fuente servidor-a-servidor o conciliación fiable.
- `commercial_sale_confirmed`: una venta válida ha sido confirmada.
- `commercial_revenue_booked`: ingreso atribuido y contabilizable, expresado en unidades monetarias menores y moneda ISO de tres letras.

## Campos permitidos

El contrato trabaja con identificadores editoriales no sensibles y acotados:

- ruta pública aprobada;
- `surface_id`;
- `partner_id` del registro comercial;
- modelo comercial revisado;
- código de país opcional de dos letras;
- en eventos servidor, importe y moneda cuando corresponda.

## Datos prohibidos

No se admite en el evento comercial:

- texto de búsqueda o consulta del usuario;
- historia, mensaje o texto libre;
- nombre, correo, teléfono o dirección;
- diagnóstico, estado de salud o categorías sensibles;
- contenido relativo a suicidio, violencia o deuda en formato libre;
- identificadores persistentes de usuario/sesión, cookies o fingerprint;
- URL completa de referrer con path/query;
- importe/ingreso declarado por el navegador.

## Separación Safety

Cualquier ruta del inventario P0/P1 es inválida para eventos comerciales, incluso si el evento se origina en servidor. La medición comercial no puede convertirse en una vía indirecta para instrumentar rutas críticas.

## Separación editorial

Un `commercial_offer_click` demuestra interacción, no calidad ni conveniencia del partner. Las métricas económicas no modifican automáticamente el ranking editorial, la etiqueta de verificación ni la clasificación Safety.

## Activación futura

Antes de conectar estos eventos a Supabase, GA, una red de afiliación u otro backend deben estar verdes:

1. superficie aprobada;
2. partner aprobado;
3. revisión legal/privacidad;
4. consentimiento cuando corresponda;
5. pruebas de que no salen eventos desde P0/P1;
6. mecanismo de apagado/rollback;
7. conciliación servidor para ventas/ingresos, evitando confiar en datos económicos enviados por el navegador.
