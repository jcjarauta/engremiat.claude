# Diario de Navegación

El grafo de decisiones de Engremiat. No es una base de datos nueva --
es el propio historial de git, usado a propósito como lo que ya es: un
grafo acíclico dirigido (DAG) navegable, con ramas reales y memoria de
quién participó en cada nodo.

## La convención

- **Cada Parte de Vigilia es un commit.** El mensaje del commit resume
  qué se exploró y con qué resultado -- igual que ya se viene haciendo,
  de forma informal, en `PROPUESTA_EMPAQUETADO_PRODUCTO_CLIENTE_FINAL.md`.
- **Cada rama de exploración (`RAMA` en `VIGILIA_TAREA`) es una rama git
  real**, no solo un valor de texto en Baserow: `rama/<nombre-de-la-rama>`.
  Nace de un commit común (el tema/punto de partida) y contiene el
  contenido real de esa exploración en `diario-navegacion/`.
- **"Reabrir un árbol desde un punto concreto" = `git checkout <commit>`
  seguido de `git branch <nueva-rama>`.** La operación que hacía falta
  ya existe, no hay que construirla.
- **"Cuántos workers han participado" = el autor de cada commit.**
  Convención de autoría: `Concilio (local)`, `Concilio (DeepSeek)`,
  `Claude (Relevo)`, `Humano (Cuadrilla)` según quién produjo ese nodo.
- **"Si un tipo de trabajo compensa la cantidad de iteraciones por
  resultado" = cuántos commits tuvo una rama** antes de fusionarse o
  descartarse -- dato que ya existe en el historial, no hay que
  calcularlo aparte.
- **El Relevo decide qué rama gana.** Ganar no significa "fusionar
  texto" (una narrativa no se fusiona como código, ver
  `PROPUESTA_EMPAQUETADO_PRODUCTO_CLIENTE_FINAL.md`, sección "Ramas") --
  significa que su contenido se copia a `ACERVO` como recurso real, y la
  rama git queda como historial consultable, nunca se borra.

## Relación con Baserow

Baserow (`VIGILIA_TAREA`, `ACERVO`) sigue siendo la fuente de verdad del
*contenido de producción* -- lo que Feria/Taller sirve de verdad. El
Diario de Navegación es una capa paralela de *memoria de decisiones*: no
sustituye a Baserow, lo indexa de una forma navegable y con historial
real. Coherente con `MAPA_DOMINIOS_DATOS.md` -- cada cosa vive donde
corresponde, sin duplicar "por si acaso".

## Límite conocido

Git se queda corto si el volumen crece mucho (cientos de decisiones
diarias harían el grafo lento de renderizar entero) -- a la escala real
de hoy (decenas de decisiones) es más que suficiente. No se ha construido
todavía ninguna herramienta que convierta `git log --graph` en el árbol
visual de la Consola de Relevo -- eso sigue pendiente.

## Primer ejemplo real

`diario-navegacion/2026-08-30-reparto-tareas/` -- las tres ramas del
primer piloto (Reparto-A-SoloFisico, Reparto-B-Pi-SMS,
Reparto-C-AppCloud) existen como ramas git reales
(`rama/reparto-A-solofisico`, `rama/reparto-B-pi-sms`,
`rama/reparto-C-appcloud`), partiendo de un commit común. Ninguna se ha
fusionado todavía -- el Relevo real de esa decisión sigue pendiente.
