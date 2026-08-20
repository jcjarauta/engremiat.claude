#!/usr/bin/env bash
# Puente Aider (modo sugerencia): pide a devstral-dev un borrador de
# parche para una tarea, SIN aplicar nada -- --dry-run garantiza que no
# se toca ni un solo byte del repo. La salida es una sugerencia para que
# Claude la revise y, si es correcta, la aplique con sus propias
# herramientas (Edit/Write) tras leer el archivo real.
#
# Uso:
#   bash puente-cline/sugerir-parche.sh TAR-0006
#
# Espera que exista puente-cline/tareas/TAR-0006.md con el brief.
#
# Ver conversación -- decisión de asesoría técnica (INC-0004): tras 10+
# intentos, el worker local no es fiable como APLICADOR autónomo de
# código (incluso con --edit-format diff como red de seguridad, falla en
# producir SEARCH/REPLACE exactos sobre archivos reales). Se reposiciona
# como SUGERIDOR de borrador -- el modelo ya no necesita reproducir
# código byte a byte para que su propuesta sea útil, porque quien aplica
# el cambio final es Claude, leyendo el archivo real primero. No hace
# falta worktree aislado: --dry-run no escribe nada, así que corre
# directo contra el repo principal.
#
# Reutiliza los mismos fixes ya validados: PYTHONIOENCODING=utf-8 (evita
# el crash de consola cp1252 en Windows), --no-auto-lint (evita el
# disparador de regresión de formato observado), --map-tokens 0 (sin
# repo-map, no aporta nada con un brief que ya dice qué archivo tocar).

set -euo pipefail

TAREA_ID="${1:?Uso: sugerir-parche.sh TAREA-ID (debe existir puente-cline/tareas/TAREA-ID.md)}"
REPO_ROOT="C:\\Users\\pc\\Desktop\\LaTroballa.audit"
BRIEF="puente-cline/tareas/${TAREA_ID}.md"
MODEL="${AIDER_MODEL:-ollama/devstral-dev}"

if [ ! -f "${REPO_ROOT}/${BRIEF}" ]; then
  echo "ERROR: no existe ${BRIEF} -- crea el brief antes de lanzar." >&2
  exit 1
fi

cd "$REPO_ROOT"

export OLLAMA_API_BASE="http://127.0.0.1:11434"
export PYTHONIOENCODING="utf-8"

echo "=== SUGERENCIA DE ${MODEL} para ${TAREA_ID} (no se ha tocado ningún archivo) ==="
# El brief tiene que entrar al contexto vía --read (solo lectura, no
# editable) -- mencionarlo por ruta en --message no basta, el modelo no
# tiene ninguna herramienta de lectura de ficheros en este modo y solo
# pide que se lo "compartan" (fallo real observado: INC-0008/0009/0010/
# 0012/0014, todas con el mismo síntoma).
aider --model "$MODEL" --edit-format diff --dry-run --yes-always --no-auto-lint --map-tokens 0 \
  --read "$BRIEF" \
  --message "Lee el contenido de ${BRIEF} (ya está en el contexto) y sigue sus instrucciones al pie de la letra. No preguntes nada, actua directamente." \
  --exit

echo ""
echo "=== FIN DE LA SUGERENCIA ==="
echo "Ningún archivo fue modificado (--dry-run). Revisa el parche propuesto"
echo "arriba y, si es correcto, aplícalo tú mismo (Claude) leyendo el"
echo "archivo real primero -- no confíes en que el diff coincida con el"
echo "código actual sin comprobarlo."
