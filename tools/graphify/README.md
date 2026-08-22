# Graphify (context) -- port a Node.js

Selector determinista de contexto de código, sin IA: dado el nombre de una función,
devuelve su código fuente real y el de sus llamadas directas (`CALLEE`), acotado por
un presupuesto de tokens. Existe para que Ejecutor (que no tiene PowerShell en su
sandbox) pueda pedir contexto de código acotado en vez de leer ficheros completos.

Es un port del modo `context` de la herramienta local `Desktop\Graphify` (fuera de
este repo, en la máquina del operador). Solo cubre ese modo -- los modos
`explain`/`affected`/`path` del script original dependen de un binario compilado
(`graphify.exe`) que no existe en este entorno y no se han portado.

## Uso

```bash
node tools/graphify/graphify-context.mjs --symbol nombreDeLaFuncion
```

Opciones: `--root <repo>` (por defecto, la raíz de este repo), `--target-limit 200`,
`--related-limit 80`, `--prefix-lines 3`, `--budget 5000`.

Si el símbolo excede el presupuesto de tokens, falla cerrado
(`CONTEXT_BUDGET_EXCEEDED`, exit code 1) en vez de devolver contexto parcial sin
avisar.

## Ficheros de datos

- `graph.json` -- grafo de símbolos/relaciones extraído estáticamente (sin LLM) de
  `src/` con `graphify update`.
- `concat-map.json` -- mapa de líneas entre el fuente concatenado usado para la
  extracción y los ficheros reales de `src/`.

**Estos dos ficheros son una foto manual, no se regeneran solos.** Cuando `src/`
cambie de forma significativa, el operador debe refrescarlos desde
`Desktop\Graphify\tools\engremiat-live\refrescar-grafo.ps1` (local, fuera de este
repo) y volver a copiar `graph.json`/`concat-map.json` aquí. Ejecutor puede leerlos
pero no regenerarlos (no tiene PowerShell ni el binario `graphify.exe`).

Verificado (2026-08-22): la salida de este port coincide byte a byte con la del
script PowerShell original (`graphify-context.core.ps1`), tanto en bloques
`COMPLETE` como `BOUNDED`, contra el grafo real de este repo.
