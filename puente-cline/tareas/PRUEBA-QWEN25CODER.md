# PRUEBA-QWEN25CODER -- Documentar el Kanban operativo en la Biblioteca

Prueba de fiabilidad de `qwen2.5-coder:14b` como worker (ver conversación
-- INC-0004, tres fallos reales con qwen3:14b). Tarea real, pequeña,
verificable, no solapa con TAR-0002 (ya hecha).

## Objetivo

La Biblioteca (`src/Biblioteca.html`) no tiene ninguna entrada que
explique qué es el Kanban operativo (las pestañas Tareas/Procesos/
Incidencias, columnas por estado). Añadirla.

## Resultado esperado

Un nuevo bloque `<details>` en `src/Biblioteca.html`, mismo estilo que
los `<details>` ya existentes en ese fichero (indentación de 4 espacios,
estructura `<details><summary>...</summary><div>...</div></details>`),
explicando en dos o tres frases: qué es el Kanban operativo, sus tres
pestañas (Tareas, Procesos, Incidencias) y que cada columna es un
estado -- cambiar el desplegable de una tarjeta mueve el registro real
de estado.

## Criterios de aceptación

- Solo se toca `src/Biblioteca.html`.
- El nuevo `<details>` sigue el mismo patrón HTML/CSS exacto que los
  existentes en el mismo fichero.
- No se borra ni reescribe ningún bloque existente -- se añade uno
  nuevo, después del que ya existe sobre "Cuando una Incidencia genera
  una Tarea sola".

## Definition of done

1. Cambio hecho en `src/Biblioteca.html`.
2. Gates locales en verde:
   - `node tools/packager/build-packages.test.mjs`
   - `node tools/packager/generate-shell-wrappers.test.mjs`
3. Mensaje final con el formato ESTADO/RESUMEN/ARCHIVOS/GATES de
   `.clinerules`.

Recuerda `.clinerules`: no hay nadie en directo esperando tu pregunta --
actúa, no preguntes. No hagas `clasp push`/`clasp version`. No pruebes
contra el Sheet real.
