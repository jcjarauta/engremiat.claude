# Reclamación del lote 1 — primera delegación real contra producción

Reparto fijado de antemano, sin solapamiento de ficheros entre ramas.

| Incidencia | Rama | Worker | Fichero(s) |
|---|---|---|---|
| INC-0036 | lote1-deepseek | DeepSeek | WebhookTelegramService.js |
| INC-0052 | lote1-deepseek | DeepSeek | ReportService.js |
| INC-0059 | lote1-deepseek | DeepSeek | CosteService.js |
| INC-0060 | lote1-deepseek | DeepSeek | MiTrabajoService.js |
| INC-0005 | lote1-codex | Codex | FichaRecursoService.js, FichaPersonaEquipoService.js |
| INC-0033 | lote1-codex | Codex | Estilos.html |
| INC-0034 | lote1-codex | Codex | FichaIncidencia.html + función de servidor nueva |
| INC-0053 | lote1-codex | Codex | ProyectoService.js |

Excluidas de este lote (no viven en este repo, delegarlas sería pedirle
a un worker que alucine un fichero inexistente): INC-0037, INC-0047,
INC-0048 (Consola/Graphify).

Cada rama en su propio `git worktree` -- sin carpeta compartida.
