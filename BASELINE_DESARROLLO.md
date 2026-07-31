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
- Paso 2 del roadmap (instrumentación barata) cerrado: `src/InstrumentacionService.js` nuevo, enganchado en los dos caminos de lectura de hoja existentes (`Repository.js` y `IntegrityService.js`).
- Paso 6 del roadmap (refactor de lectura, adelantado antes de Paso 3) cerrado: `src/CacheLecturaService.js` nuevo, caché de lectura con alcance de una sola ejecución. Ver Fase I en la tabla siguiente para los números medidos.
- Paso 3 del roadmap (Fase E, jerarquía) cerrado: 7 reglas nuevas (`FUNC-JER-001` a `FUNC-JER-007`) y sus pruebas reactivas, verificadas con `result=OK` en Apps Script real.
- Paso 4 del roadmap (Fase F, bloque DOCUMENTO) cerrado: 6 reglas nuevas (`FUNC-DOC-001` a `FUNC-DOC-006`) y sus pruebas reactivas, verificadas con `result=OK` en Apps Script real.
- Paso 5 del roadmap (Fase G, Historial/Reversión) cerrado: `ejecutarSuitePaso252a255` (Tests_Repository.js) estaba rota (esquema de columnas obsoleto + limpieza de historial que nunca funcionó); corregida, más robusta ante reutilización de ID, y re-verificada `result=OK` junto con las pruebas de reversión.
- La divergencia clasp↔git detectada anteriormente (función `auditarFaseC05A_TareaPredecesoraHuerfana` traída por `clasp pull` sin commitear) **quedó resuelta** — ya está incorporada en el commit `35b50d0`.
- Tamaño actual del código fuente: ~27 archivos, ~35.000 líneas. Los archivos dominantes siguen siendo `Repository.js`, `Tests_Repository.js` y `Tests_Repository2.js`.

## 3. Estado de la auditoría por fase

| Fase | Bloque | Estado | Pendiente principal |
|---|---|---|---|
| A-B | Estructura, configuración, CRUD/trazabilidad | Cerrado (WARN aceptable) | — |
| C | Coherencia de TAREA (fechas, estados, predecesoras, procesos) | **En curso** (activo ahora mismo) | `auditarFaseC06A` en desarrollo; posibles C06B+ |
| D | Recursos humanos y capacidad | **Cerrada (recortada)** | 4/5 reglas implementadas y verificadas: `FUNC-REC-002` (solapamiento temporal), `FUNC-REC-003` (persona inactiva con asignación activa), `FUNC-REC-004` (densidad vs capacidad semanal), `FUNC-REC-005` (sobrecarga por periodo). "Equipo/persona" **diferida** — no existe tabla de membresía equipo↔persona en el esquema, no modelable sin entidad nueva. "Disponibilidad real por fecha" también fuera de alcance — requiere entidad nueva (`PERSONA_EQUIPO` no tiene campos de fecha, solo `DISPONIBILIDAD` categórica estática) |
| E | Jerarquía (campaña→proyecto→producto→proceso→tarea) | **Cerrada** | 7/7 reglas implementadas y verificadas (`FUNC-JER-001` a `FUNC-JER-007`): coherencia temporal campaña↔proyecto, cierre de estado en cascada campaña→proyecto→producto→proceso, coherencia temporal proceso↔producto y relación↔proyecto. Catálogos de ESTADO confirmados contra la hoja `90_CONFIGURACION`, no asumidos |
| F | Documentos, decisiones, incidencias | **Cerrada (bloque DOCUMENTO)** | 6 reglas implementadas y verificadas (`FUNC-DOC-001` a `FUNC-DOC-006`): FK polimórfica huérfana/inactiva, doble vigencia, duplicado exacto, formato de VERSION y URL. Hallazgo colateral (no corregido aquí, tarea aparte): mapa `ENTIDAD_DOCUMENTO_A_MVP` de `Formularios.js` desincronizado del catálogo real de la hoja |
| G | Historial y reversión | **Cerrada (con corrección)** | La verificación previa se apoyaba en `ejecutarSuitePaso252a255` rota (nombres de columna del esquema viejo, limpieza de historial que nunca funcionó). Corregida y re-verificada `result=OK`, junto con `pruebaPaso308`/`309` de reversión. Riesgos de diseño documentados y aceptados: sin purga de `91_HISTORIAL` (1247 filas), reversión limitada a un solo paso de ACTUALIZAR |
| H | UI, panel e informes | **Pendiente — riesgo principal** | Todo: estabilidad, tiempos de carga, informes, exportación, prueba visual de usuario |
| I | Rendimiento y robustez | **Cerrada (mejora ligera aplicada)** | Refactor de lectura aplicado (`src/CacheLecturaService.js`, caché con alcance de una sola ejecución, sin tocar `Repository.js` ni lógica de negocio): `obtenerReporteIntegridad()` bajó de 30.7s/70 lecturas a 14.7s/27 lecturas (~52%/~61% de mejora), 0 flushes en ambos casos. Verificado sin regresión: 10 reglas de cobertura directa + 4 reglas nuevas de Fase D + duplicidad de proveedor, todas `result=OK`. Pendiente: si Fase H (UI) revela más presión de tiempo, reevaluar si hace falta ir más allá de esta caché ligera |
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
