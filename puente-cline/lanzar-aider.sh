#!/usr/bin/env bash
# Puente Aider: lanza qwen3-coder:30b (via Ollama) contra una tarea concreta
# en un worktree aislado, para que Claude la revise despues sin tocar el
# working tree principal.
#
# Uso:
#   bash puente-cline/lanzar-aider.sh TAR-0003
#
# Espera que exista puente-cline/tareas/TAR-0003.md con el brief (mismo
# formato que ya usaba el puente Cline -- objetivo, resultado esperado,
# criterios de aceptacion, definition of done).
#
# Ver conversacion -- INC-0004: tras 6 fallos reales con Cline+Ollama (3
# modelos, ningun archivo tocado nunca), Aider + qwen3-coder:30b completo
# correctamente la primera prueba real al primer intento. Aider edita con
# diffs de texto en vez de tool-calling estricto -- mas tolerante con
# modelos locales que no siguen el formato exacto de function-calling.
#
# PYTHONIOENCODING=utf-8 evita un crash real observado en Windows: la
# consola cp1252 no puede imprimir ciertos caracteres (barras de progreso
# de lint) que Aider intenta mostrar, y el proceso entero moria a mitad
# de una edicion que SI se habia aplicado -- solo se detectaba revisando
# el diff a mano. Con esta variable, Aider imprime en UTF-8 sin crashear.
#
# --no-lint: en una segunda prueba real, el flujo interactivo de "Attempt
# to fix lint errors?" hizo que el modelo abandonara el formato de diff
# SEARCH/REPLACE y volcara el archivo entero en un bloque de codigo
# generico -- Aider no lo aplico, pero el modelo igualmente informo
# "ya esta actualizado" (mismo patron de exito fabricado que con Cline,
# ver INC-0004). El lint de Aider no aporta nada aqui -- los gates reales
# del proyecto (build-packages.test.mjs) son la validacion que importa.

set -euo pipefail

TAREA_ID="${1:?Uso: lanzar-aider.sh TAREA-ID (debe existir puente-cline/tareas/TAREA-ID.md)}"
REPO_ROOT="C:\\Users\\pc\\Desktop\\LaTroballa.audit"
BRIEF="puente-cline/tareas/${TAREA_ID}.md"
WORKTREE_DIR="C:\\Users\\pc\\aider-worktrees\\${TAREA_ID}"
BRANCH="aider-${TAREA_ID}"
MODEL="${AIDER_MODEL:-ollama/qwen3-coder:30b}"

if [ ! -f "${REPO_ROOT}/${BRIEF}" ]; then
  echo "ERROR: no existe ${BRIEF} -- crea el brief antes de lanzar." >&2
  exit 1
fi

cd "$REPO_ROOT"
git worktree add -b "$BRANCH" "$WORKTREE_DIR" main

export OLLAMA_API_BASE="http://127.0.0.1:11434"
export PYTHONIOENCODING="utf-8"

cd "$WORKTREE_DIR"
aider --model "$MODEL" --yes-always --no-auto-commits --no-auto-lint \
  --message "Lee el fichero ${BRIEF} completo y sigue sus instrucciones al pie de la letra. No preguntes nada, actua directamente." \
  --exit

echo ""
echo "=== DIFF (revisar antes de fusionar nada) ==="
git diff --stat
echo ""
echo "Worktree: $WORKTREE_DIR (rama $BRANCH)"
echo "Para revisar el diff completo: git -C \"$WORKTREE_DIR\" diff"
echo "Para descartar la prueba: git worktree remove \"$WORKTREE_DIR\" --force && git branch -D $BRANCH"
