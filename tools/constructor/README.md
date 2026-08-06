# Constructor de clientes (Nivel 1 — autoservicio de módulos estándar)

Ver `PROPUESTA_MODULARIZACION_LIBRERIA.md` para el contexto completo. Este directorio es la
"mesa de montaje" del fundador: monta el cascarón de un cliente que solo necesita módulos
estándar (sin lógica propia) sobre la librería compartida ya publicada.

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `libreria.json` | Script ID, versión y símbolo de la librería compartida actual ("LaTroballa Core v1"). Único lugar a actualizar tras un `clasp deploy` nuevo de la librería. |
| `clientes.json` | Registro de clientes: módulos, envoltorios generados, huecos, estado. Se actualiza automáticamente al montar un cliente. |
| `montar-cliente.mjs` | CLI: genera `Codigo.js` (envoltorios) + `appsscript.json` (dependencia de librería) para un cliente, y lo registra. |
| `montar-cliente.test.mjs` | 13 pruebas, incluidas contra el repositorio real. |

Excluido del escaneo del packager (`tools/constructor/`, igual que `tools/packager/` y `.claude/`) — no es parte del universo Apps Script desplegable.

## Uso

```text
node tools/constructor/montar-cliente.mjs --nombre acme --modulos CORE,GANTT,COMPRAS --output <ruta-nueva>
```

Esto escribe `<ruta>/Codigo.js` y `<ruta>/appsscript.json`, y añade una entrada a `clientes.json`. No crea recursos de Drive ni ejecuta `clasp` — al final imprime los comandos exactos a ejecutar a mano:

```text
cd <ruta> && clasp create --type sheets --title "<nombre visible>" --rootDir .
clasp push --force
```

Deliberadamente **no automatiza la creación de recursos reales**: crear un Sheet+script es una acción con efectos reales en Drive, y este comando solo prepara el paquete — el paso de `clasp create`/`push` queda como confirmación explícita del fundador, mismo criterio que el resto del proyecto (`PROPUESTA_MODULARIZACION_LIBRERIA.md`, gobernanza).

## Límite explícito (Nivel 1 vs Nivel 2)

Este comando **no admite personalización de código por cliente**. Todos los clientes de Nivel 1
comparten la misma librería: `montar-cliente.mjs` solo decide qué funciones de esa librería quedan
accesibles desde el menú del cliente (qué envoltorios genera), nunca añade lógica nueva. Un cliente
que necesite lógica propia requiere su propia librería (Nivel 2, no cubierto por esta herramienta —
ver "Separación de capas" y el aviso sobre el límite compartido en `PROPUESTA_MODULARIZACION_LIBRERIA.md`).

## Huecos (`EXCLUDED_MODULE_GAP`)

Si el cliente elige un subconjunto de módulos y el menú generado (`onOpen()`, hoy monolítico)
referencia funciones fuera de ese subconjunto, `montar-cliente.mjs` genera igualmente lo que sí
puede y avisa de los huecos (se registran en `clientes.json`, campo `huecos`). No bloquea el montaje
-- el cliente recibe un menú funcional con los ítems de sus módulos ausentes, no un error. Pedir los
6 módulos completos no deja ningún hueco (verificado en `montar-cliente.test.mjs`, caso 11).
