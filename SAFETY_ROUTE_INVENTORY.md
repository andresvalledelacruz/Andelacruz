# Inventario Safety de superficies públicas

Fecha de auditoría: 2026-08-30.

Este inventario sirve como control conservador para separar contenido crítico de cualquier monetización futura. La inclusión aquí no diagnostica ni clasifica clínicamente a una persona; clasifica la superficie de producto por el nivel de precaución requerido.

## P0/P1 — monetización denegada por construcción

| Ruta | Motivo de precaución | Invariante adicional |
| --- | --- | --- |
| `/ayuda-urgente.html` | puerta de entrada a situaciones urgentes | sin monetización |
| `/me-preocupa-que-alguien-pueda-suicidarse/` | posible riesgo suicida de tercero | 112 + 024 + fuente oficial Sanidad |
| `/alguien-cercano-ha-intentado-suicidarse/` | intento suicida reciente de tercero | 112 + 024 + fuente oficial Sanidad |
| `/mi-pareja-me-maltrata-y-no-se-que-hacer/` | violencia de pareja | sin monetización |
| `/he-sufrido-una-agresion-sexual-y-no-se-que-hacer/` | violencia sexual | sin monetización |
| `/duelo/ha-muerto-por-suicidio-alguien-que-quiero/` | posvención con bloque explícito de ideación suicida del lector | 112 + 024 + fuente oficial Sanidad |

## Regla de alta

Toda nueva superficie P0/P1 debe entrar en este inventario y en `tests/p0-p1-noncommercial-invariant.test.mjs` dentro del mismo PR. Si necesita recursos oficiales específicos, el Safety Gate debe comprobarlos explícitamente.

## Regla de duda

Ante clasificación dudosa se aplica el lado conservador: `monetization=false` hasta revisión. Que una ruta no figure en este inventario no significa que esté autorizada para monetización.

## Próximas revisiones

- revisar de forma periódica rutas YMYL que incorporen nuevos bloques de crisis o emergencia;
- conectar este inventario con la futura arquitectura de monetización como deny-list derivada de Safety;
- mantener separada la revisión editorial/legal de cualquier futura decisión comercial.
