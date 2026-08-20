# Métricas del ecosistema de desarrollo (Engremiat)

Registro real de coste/tiempo por tarea -- tomado de `~/.claude.json`
(`lastCost`, `lastTotalInputTokens`/`lastTotalOutputTokens`,
`lastDuration`, `lastLinesAdded`/`lastLinesRemoved` del proyecto), no
estimaciones. Ver `ROADMAP_ECOSISTEMA_AGENTICO.md` -- objetivo: 10-15
puntos de datos reales antes de sacar conclusiones sobre cuándo
delegar a `sugerir-parche.sh` compensa frente a hacerlo directamente.

Cada fila = una tarea completada en su propia sesión de Claude Code
(condición necesaria para que `lastCost` de esa sesión refleje solo
esa tarea, no una mezcla de varias).

| Fecha | Tarea | Método | Coste ($) | Tokens entrada | Tokens salida | Duración | Líneas +/- |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

## Nota real (2026-08-20): el mecanismo de coste/tokens planeado no está disponible

El plan original era leer `lastCost`/`lastTotalInputTokens`/`lastTotalOutputTokens`/
`lastDuration` del proyecto en `~/.claude.json`. Comprobado hoy: esos campos
**no existen** para este proyecto en este entorno (`hasTrustDialogAccepted`,
`allowedTools`, etc. sí están, pero ninguno de coste/tokens) -- el
mecanismo se documentó asumiendo el CLI `claude` normal, no encaja con el
entorno real en el que ha corrido esta sesión. No se puede rellenar la
tabla de arriba con datos reales todavía; haría falta otra fuente (panel
de uso de Anthropic, o exportar el coste de la sesión manualmente) antes
de retomar el seguimiento por tarea.

## Métricas de proceso reales del ciclo 2026-08-20 (lo que sí se pudo medir)

- **32 commits**, 76 ficheros tocados en el repo en la sesión completa de
  hoy (incluye trabajo previo a los ciclos de auditoría).
- **25 incidencias registradas** en el ciclo de auditoría (INC-0005 a
  INC-0029): 12 resueltas y publicadas, 13 abiertas (5 reservadas para
  Claude por alcance mayor, 4 marcadas "pendiente de diseño" -- no son
  fixes mecánicos --, 1 de decisión de infraestructura, 1 de backlog de
  UI, 1 sobre desfase de esquema de datos, 1 sin auditar todavía --
  Escenarios).
- **Worker local (sugerir-parche.sh), 9 tareas delegadas**: 5 produjeron
  un diff correcto y aplicable sin intervención (INC-0008/09 combinadas,
  0010, 0014, 0016), 4 no completaron la tarea (se quedaron preguntando,
  en bucle, o con timeout de Ollama) y las aplicó Claude directamente con
  el fix ya verificado en el propio brief (INC-0011, 0012, 0015, 0025).
  Tasa de éxito real: ~56%, no 100% -- el worker ahorra el primer
  intento, no sustituye la revisión.
- **Bug real de la propia herramienta, encontrado y corregido en vivo**:
  `sugerir-parche.sh` no pasaba el brief al contexto de Aider
  (`--read` faltante) -- afectaba a las 8 primeras tareas del ciclo 1
  antes de detectarlo.
- **Publicación**: 9 versiones de librería (v163->v171 aprox.), 5
  despliegues explícitos del deployment fijo del maestro tras descubrir
  que no seguía `@HEAD` (INC-0020, sigue sin resolver de fondo).
- **Proceso, no solo código**: 12 incidencias quedaron con `ESTADO`
  desactualizado en el Sheet (código publicado pero fila sin cerrar)
  hasta que se detectó y corrigió al final del ciclo -- gap real de
  disciplina, no solo de herramienta.
- **Pata 3 (comportamiento con datos)**: acceso al Sheet real vía UI
  interactiva (Browser interno sin sesión, `clasp run` sin permiso)
  falló en los 2 intentos -- verificación hecha por API directa en su
  lugar. Encontró un hallazgo real no buscado (desfase de orden de
  columnas entre `EstructuraInicialDatos.js` y el Sheet real, INC-0029).
- **Pata 4 (diseño)**: bloqueada por la misma fragilidad de automatizar
  clics en menús anidados de Sheets -- 2 intentos, ningún hallazgo
  verificado en vivo esta vez. El caso ya detectado en
  `GUIA_DISENO_ENGREMIAT.md` (foco de formularios) sigue sin confirmar.
