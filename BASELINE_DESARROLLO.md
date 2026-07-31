# BASELINE DE DESARROLLO — LaTroballa Audit

**Fecha de este snapshot:** 2026-07-30
**Baseline de código previa referenciada:** `BL-CODE-AUDIT-CLOSE-01` (26 archivos reconciliados, 23 funcionales + 3 de test, cobertura 27/27, integridad global limpia en su momento)

## 1. Identificación técnica

| Campo | Valor |
|---|---|
| `SCRIPT_ID` | `1kCjXYmMPOIPdK3zYC9w1cGz53ag74BCW2fT5lnTjWzWWcI1NHGmhVDzx` |
| Deployment | 1 deployment activo, `@HEAD` (sirve siempre el código guardado más reciente, sin versión fijada) |
| `rootDir` | `src/` |
| Runtime | V8, zona horaria Europe/Madrid |
| OAuth scopes (manifest) | `script.projects.readonly`, `script.external_request`, `drive`, `spreadsheets.currentonly`, `script.container.ui`, `userinfo.email` |
| Git | Repositorio local, **sin remoto** |
| Último commit | `35b50d0` — "audit: validate task predecessor integrity" (2026-07-30 13:07) |

## 2. Estado del repositorio en este instante

- Fase C (`auditarFaseC06A_ProcesoCompletadoConTareaNoTerminada`) quedó cerrada y commiteada en un ciclo previo (commit `0981818`).
- Fase D recortada: 4 reglas nuevas (`FUNC-REC-002` a `FUNC-REC-005`) y sus pruebas reactivas añadidas a `src/IntegrityService.js` y `src/Tests_Repository2.js`, desplegadas vía `clasp push` y verificadas con `result=OK` en el editor de Apps Script real.
- La divergencia clasp↔git detectada anteriormente (función `auditarFaseC05A_TareaPredecesoraHuerfana` traída por `clasp pull` sin commitear) **quedó resuelta** — ya está incorporada en el commit `35b50d0`.
- Tamaño actual del código fuente: ~27 archivos, ~35.000 líneas. Los archivos dominantes siguen siendo `Repository.js`, `Tests_Repository.js` y `Tests_Repository2.js`.

## 3. Estado de la auditoría por fase

| Fase | Bloque | Estado | Pendiente principal |
|---|---|---|---|
| A-B | Estructura, configuración, CRUD/trazabilidad | Cerrado (WARN aceptable) | — |
| C | Coherencia de TAREA (fechas, estados, predecesoras, procesos) | **En curso** (activo ahora mismo) | `auditarFaseC06A` en desarrollo; posibles C06B+ |
| D | Recursos humanos y capacidad | **Cerrada (recortada)** | 4/5 reglas implementadas y verificadas: `FUNC-REC-002` (solapamiento temporal), `FUNC-REC-003` (persona inactiva con asignación activa), `FUNC-REC-004` (densidad vs capacidad semanal), `FUNC-REC-005` (sobrecarga por periodo). "Equipo/persona" **diferida** — no existe tabla de membresía equipo↔persona en el esquema, no modelable sin entidad nueva. "Disponibilidad real por fecha" también fuera de alcance — requiere entidad nueva (`PERSONA_EQUIPO` no tiene campos de fecha, solo `DISPONIBILIDAD` categórica estática) |
| E | Jerarquía (campaña→proyecto→producto→proceso→tarea) | Parcial | 7 reglas de coherencia de fechas/estados cruzados |
| F | Documentos, decisiones, incidencias | Casi completada | Bloque DOCUMENTO (FK polimórfica, versión, vigencia) |
| G | Historial y reversión | Verificado | Revisión consolidada final, no desarrollo |
| H | UI, panel e informes | **Pendiente — riesgo principal** | Todo: estabilidad, tiempos de carga, informes, exportación, prueba visual de usuario |
| I | Rendimiento y robustez | No verificado | **Riesgo confirmado empíricamente**: una suite de 10 reglas ya superó el tiempo máximo de ejecución de Apps Script. `IntegrityService` tarda 20-30s |
| J | Seguridad, despliegue, baseline | Parcial avanzado | Backup formal del Sheet, hashes, acta de cierre, revisión de scopes/secretos |

## 4. Decisiones tomadas en este ciclo de trabajo

1. **Fase D recortada**: "disponibilidad real por fecha" se excluye del gate actual y se reserva como funcionalidad nueva futura (entidad `PERSONA_EQUIPO_AUSENCIA` o similar, con feature flag propio).
2. **Automatización de auditoría**: se aprueba conceptualmente la "Opción A" — menú de Sheet (`Auditoría`) que invoca funciones ya existentes, sin MCP, sin OAuth adicional, sin servidor externo. Implantación mínima recomendada: 3 opciones de menú (ejecutar gate actual, ejecutar IntegrityService, ver último resultado), estimada en 8-15 horas.
3. **"Regresión completa" vía menú se difiere** hasta resolver el particionado por bloques — ya hay evidencia de que una regresión completa excede el límite de ejecución.
4. **Arquitectura de gateway multi-IA (`ToolRegistry`/`ToolDispatcher`/roles IA/MCP) se difiere** a una fase posterior, una vez el runner interno de auditoría esté maduro. No se empieza a construir todavía.
5. **Refactor de `Repository.js`** (dividir en `RepositoryCore/Queries/Insert/Update/Rules`) se pospone indefinidamente — no se hace como preparación previa a nada, dado el riesgo de regresión en el archivo más crítico del sistema.
6. **Gap de cobertura de pruebas conocido**: 27 reglas inventariadas, 17 con prueba directa, 1 indirecta, 9 sin prueba reactiva localizada (según reconciliación previa) — pendiente de cierre, con prioridad alta.
7. **Fase D cerrada recortada**: la regla "equipo/persona" queda fuera del gate porque el esquema no modela membresía equipo↔persona (`PERSONA_EQUIPO.TIPO` solo distingue 'Persona'/'Equipo', sin relación estructural entre ambos); se documenta como diferida, no como pendiente de desarrollo inmediato.

## 5. Principios de gobierno vigentes (no negociables en este proyecto)

- Git únicamente local, sin remotos.
- `clasp push` solo con autorización explícita, nunca automático.
- Ninguna IA colaboradora (Codex, Claude, ChatGPT, Ollama) despliega, activa funciones o acepta WARN por sí misma.
- Cambios mínimos, una modificación funcional por bloque, reversibilidad total (`try/finally`, fixtures restaurables).
- Gate humano obligatorio antes de cerrar cualquier fase o desplegar a DEV.
