#!/usr/bin/env bash
# Puente Aider: lanza devstral-dev (via Ollama) contra una tarea concreta en
# un worktree aislado, para que Claude la revise despues sin tocar el
# working tree principal.
#
# Uso:
#   bash puente-cline/lanzar-aider.sh TAR-0003
#
# Espera que exista puente-cline/tareas/TAR-0003.md con el brief (mismo
# formato que ya usaba el puente Cline -- objetivo, resultado esperado,
# criterios de aceptacion, definition of done).
#
# Ver conversacion -- INC-0004, historial completo de la investigacion:
# 6 fallos reales con Cline+Ollama (3 modelos, ningun archivo tocado
# nunca) -> cambio a Aider (edita con diffs de texto, no tool-calling
# estricto) -> 1/3 exitos con qwen3-coder:30b -> causa raiz identificada:
# Ollama usa 2048 tokens de contexto por defecto y descarta mensajes
# antiguos en silencio al superarlo (fuente: "the default context is the
# single most common reason local Cline fails"), lo que explica la perdida
# de formato/instrucciones observada. Ademas qwen3-coder:30b (20GB) no
# cabia entero en 16GB de VRAM (corria 27% en CPU, mas lento e inestable).
#
# FIX: modelo devstral-dev = devstral:24b (14GB, cabe entero en VRAM) +
# Modelfile con num_ctx=32768 y repeat_penalty=1.1 (rompe los bucles de
# repeticion que causaron un cuelgue real de 20+ min en una tarea
# trivial). Primera prueba limpia tras el fix: exito verificado contra
# el diff real (el modelo incluso se autocorrigio un primer intento
# destructivo antes de producir el diff correcto en el mismo turno).
#
# Para regenerar devstral-dev si hace falta:
#   ollama pull devstral:24b
#   printf 'FROM devstral:24b\nPARAMETER num_ctx 32768\nPARAMETER repeat_penalty 1.1\n' > Modelfile
#   ollama create devstral-dev -f Modelfile
#
# PYTHONIOENCODING=utf-8 evita un crash real observado en Windows: la
# consola cp1252 no puede imprimir ciertos caracteres (barras de progreso
# de lint) que Aider intenta mostrar, y el proceso entero moria a mitad
# de una edicion que SI se habia aplicado -- solo se detectaba revisando
# el diff a mano. Con esta variable, Aider imprime en UTF-8 sin crashear.
#
# --no-auto-lint: el flujo interactivo de "Attempt to fix lint errors?"
# hizo en una prueba que el modelo abandonara el formato de diff y
# volcara el archivo entero en un bloque de codigo generico, informando
# igualmente "ya esta actualizado" (exito fabricado, ver INC-0004). El
# lint de Aider no aporta nada aqui -- los gates reales del proyecto
# (build-packages.test.mjs) son la validacion que importa.
#
# --map-tokens 0: desactiva el repo-map de Aider (escanea el repo entero
# para construir contexto incluso en tareas triviales) -- solo anade
# lentitud sin aportar nada cuando el brief ya dice exactamente que
# archivo tocar.

set -euo pipefail

TAREA_ID="${1:?Uso: lanzar-aider.sh TAREA-ID (debe existir puente-cline/tareas/TAREA-ID.md)}"
REPO_ROOT="C:\\Users\\pc\\Desktop\\LaTroballa.audit"
BRIEF="puente-cline/tareas/${TAREA_ID}.md"
WORKTREE_DIR="C:\\Users\\pc\\aider-worktrees\\${TAREA_ID}"
BRANCH="aider-${TAREA_ID}"
MODEL="${AIDER_MODEL:-ollama/devstral-dev}"

if [ ! -f "${REPO_ROOT}/${BRIEF}" ]; then
  echo "ERROR: no existe ${BRIEF} -- crea el brief antes de lanzar." >&2
  exit 1
fi

cd "$REPO_ROOT"
git worktree add -b "$BRANCH" "$WORKTREE_DIR" main

export OLLAMA_API_BASE="http://127.0.0.1:11434"
export PYTHONIOENCODING="utf-8"

cd "$WORKTREE_DIR"
aider --model "$MODEL" --yes-always --no-auto-commits --no-auto-lint --map-tokens 0 \
  --message "Lee el fichero ${BRIEF} completo y sigue sus instrucciones al pie de la letra. No preguntes nada, actua directamente." \
  --exit

echo ""
echo "=== DIFF (revisar antes de fusionar nada) ==="
git diff --stat
echo ""
echo "Worktree: $WORKTREE_DIR (rama $BRANCH)"
echo "Para revisar el diff completo: git -C \"$WORKTREE_DIR\" diff"
echo "Para descartar la prueba: git worktree remove \"$WORKTREE_DIR\" --force && git branch -D $BRANCH"
