# Telar — Fase B0

Contratos y fixtures de la Fase B0 de Telar. Ver [`PROPUESTA_TELAR_INTERFAZ_OPERATIVA.md`](../../../PROPUESTA_TELAR_INTERFAZ_OPERATIVA.md) (§16-17) para el diseño completo.

**Alcance de B0**: solo esto. Sin llamadas a DeepSeek, sin conexión a Baserow/Sheet/Grafana/el VPS, sin escrituras en ningún sistema real. Todo el contenido de `fixtures/` es simulado (marcado `_fixture: true`), nunca datos de producción.

## Estructura

- `estados.json` — el único grafo de estados vigente de una Misión (antes convivían tres modelos distintos, ver Anexo A del paper).
- `schemas/` — 5 JSON Schema (draft 2020-12) reales: `mision`, `participante`, `contribucion` (hilo), `evento`, `huella`.
- `fixtures/` — 5 Misiones fixture, una por cada estado visual del MVP (`sin_seleccionar`, `deliberando`, `tejiendo`, `esperando_relevo`, `huella`), más 2 auxiliares para los esquemas de evento y huella-evento. `03_tejiendo.json` incluye a propósito un hecho `PENDIENTE_DE_COMPROBAR` y una contribución `ERR`, para probar los caminos de error, no solo el camino feliz.

## Uso

```bash
npm install
node validar_b0.mjs
```

Verificado en real: los 5 fixtures pasan contra sus esquemas con `ajv`, el grafo de transiciones es consistente, y un fixture roto a propósito (campo obligatorio ausente + estado inventado) es rechazado con errores concretos — el validador no es un sello de goma.

## Gate de B0

Contrato revisado + 5 casos reproducibles, sin API ni escrituras — cumplido.

## B1 — interfaz estática interactiva

`b1/` — vertical slice DOM puro (sin Phaser) sobre estos mismos fixtures. `node b1/servidor_b1.mjs` (puerto 4310). Ciclo completo verificado con clics reales en el navegador: Reencuentro → Encargo (con gate de preparación real) → Concilio → Tejido → Relevo → Puerta Humana (5 pasos) → Huella.

## B2 — deliberación real en solo lectura

`b2/` — llama a DeepSeek de verdad con el mismo roster de Acervos que `spike_concilio_coop/`, ahora forzado al contrato estructurado (`contribucion.schema.json`, JSON mode + validación ajv + reintento con el error como feedback). `node b2/deliberar_b2.mjs`. Ninguna escritura en 92_BUS_TRABAJO; sí registra coste real en `GASTO_API`. Verificado dos veces (2 y 3 Acervos, 5/5 contratos válidos en la última ejecución) — la primera ejecución encontró un fallo real de calibración (`maxLength` de `propuestas` demasiado estricto) que quedó corregido en el esquema.

## B3 — registro controlado y Puerta Humana real

`b3/` — servidor con estado de Misión versionado (`servidor_b3.mjs`, puerto 4320): idempotencia real por `clientEventId`, concurrencia optimista real por `expectedMissionVersion`, y una Puerta Humana que separa `decision_aprobar` / `ejecucion_autorizar` / `ejecucion_iniciar` / `ejecucion_verificar`, escribiendo y releyendo de verdad un **destino de prueba aislado** (`b3/destino_prueba/`, nunca el `docker-compose.yml` real del VPS). `node b3/servidor_b3.mjs` y luego `node b3/prueba_b3.mjs` — 15/15 comprobaciones reales, incluida la regla "si la Misión cambia después de inspeccionarla, la autorización queda inválida" y la idempotencia (reenviar el mismo evento no repite la escritura). Se encontraron y corrigieron 2 bugs reales de lógica de estado durante la primera ejecución.
