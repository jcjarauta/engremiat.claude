# ROADMAP DE IMPLEMENTACIÓN — LaTroballa Audit

Basado en `BASELINE_DESARROLLO.md` (2026-07-30). Secuencia priorizada, no calendario fijo — cada paso termina con gate humano antes de avanzar al siguiente.

## Principio de secuenciación

No se construye automatización (menú, `AuditRunner`, gateway multi-IA) por delante del cierre de auditoría real. No se refactoriza `Repository.js`. No se introduce MCP hasta que el runner interno esté maduro. El orden abajo respeta eso.

## Paso 0 — Terminar lo que ya está en curso ✅ CERRADO
- Cerrado: `auditarFaseC06A_ProcesoCompletadoConTareaNoTerminada` commiteado (`0981818`), Fase C cerrada.

## Paso 1 — Fase D recortada ✅ CERRADO (4/5 reglas)
Implementadas y verificadas con `result=OK` en Apps Script real: `FUNC-REC-002` (solapamientos temporales), `FUNC-REC-003` (personas inactivas con asignación activa), `FUNC-REC-004` (capacidad semanal vs duración), `FUNC-REC-005` (carga por periodos). "Equipo/persona" diferida (no modelable sin entidad nueva de membresía). "Disponibilidad real por fecha" queda fuera (ver baseline).

## Paso 2 — Instrumentación barata de Fase I (adelantada) ✅ CERRADO
Instrumentación añadida (`src/InstrumentacionService.js`, sin refactor, solo contadores de lecturas de hoja/flush y medición de duración) enganchada en los dos caminos de lectura reales: `leerFilasEntidadComoObjetos_` (Repository.js) y `obtenerIdsDeEntidad_`/`detectarReferenciasHuerfanas` (IntegrityService.js, ruta separada que se leía directo de la hoja sin pasar por Repository).

**Datos medidos con `diagnosticarInstrumentacionReporteIntegridad()` en Apps Script real (una ejecución de `obtenerReporteIntegridad()`):**

| Bloque | Duración | Lecturas de hoja | Flushes |
|---|---|---|---|
| Estructural (duplicados/huérfanas) | 16.5s | 38 | 0 |
| Funcional (27 reglas) | 14.2s | 32 | 0 |
| **Total** | **30.7s** | **70** | **0** |

Confirma el riesgo de Fase I: 70 lecturas completas de hoja para una sola pasada, muchas redundantes (misma entidad releída sin caché entre llamadas a `obtenerIdsDeEntidad_`). Sin uso de `flush` (esperado, es solo lectura). Este dato alimenta directamente el Paso 6.

## Paso 3 — Fase E: Jerarquía principal
Campaña→proyecto→producto→proceso→tarea: 7 reglas de coherencia cruzada.
**Estimación: 2 sesiones.**

## Paso 4 — Fase F: Documentos
Bloque DOCUMENTO (FK polimórfica, versión, vigencia, duplicados).
**Estimación: 1 sesión.**

## Paso 5 — Fase G: Revisión consolidada de Historial/Reversión
No es desarrollo nuevo, es cierre formal de algo ya verificado.
**Estimación: 1 sesión corta.**

## Paso 6 — Fase I completa: Rendimiento ✅ CERRADO (adelantado antes del Paso 3)
Alcance decidido y aplicado: **caché de lectura con alcance de una sola ejecución** (`src/CacheLecturaService.js`), sin tocar `Repository.js` en su arquitectura ni ninguna lógica de negocio. Engancha `leerFilasEntidadComoObjetos_` y `obtenerIdsDeEntidad_`/`detectarReferenciasHuerfanas`; el contexto se abre y cierra dentro de `obtenerReporteIntegridad()` (try/finally), así que no afecta el patrón mutar→flush→comprobar→restaurar de las pruebas reactivas (cada llamada arranca con caché limpio).

**Resultado verificado en Apps Script real:**

| Métrica | Antes | Después | Mejora |
|---|---|---|---|
| Duración total | 30.7s | 14.7s | ~52% |
| Lecturas de hoja | 70 | 27 | ~61% |
| Flushes | 0 | 0 | — |

**Regresión verificada sin fallos**: `ejecutarSuiteIntegridadCoberturaDirectaPendiente` (10 reglas), las 4 pruebas nuevas de Fase D (`FUNC-REC-002` a `FUNC-REC-005`) y `probarIntegridadProveedorCodigoDuplicado` (ruta de duplicados) — todas `result=OK` tras el cambio.

## Paso 7 — Fase H: UI, panel e informes
El bloque más débil y de mayor riesgo. Requiere verificación visual humana en cada iteración — no delegable.
**Estimación: 2-4 sesiones.**

## Paso 8 — Fase J: Cierre de seguridad y baseline final
Backup formal del Sheet, hashes, acta de cierre, revisión de scopes OAuth, decidir archivos temporales que permanecen, matriz de cobertura final.
**Estimación: 1 sesión.**

## Paso 9 — Cierre de auditoría global
Informe final + nueva baseline (sucesora de `BL-CODE-AUDIT-CLOSE-01`).

---

## En paralelo, cuando convenga: automatización (Opción A)
No bloquea nada de lo anterior ni depende de terminarlo todo. Puede insertarse en cuanto haya 2-3 gates estables que valga la pena repetir sin trabajo manual — candidato natural: después del Paso 1 o Paso 3.

- Menú `Auditoría` con 3 opciones: ejecutar gate actual, ejecutar `IntegrityService`, ver último resultado.
- Reutiliza `IntegridadReporte.html` para mostrar resultados (no `Ui.alert()`).
- `LockService` + `try/finally` + registro en hoja `99_AUDITORIA`.
- **Sin** "regresión completa" todavía (depende del Paso 6).
- **Estimación: 8-15 horas.**

## Explícitamente diferido (no iniciar sin revisar esta decisión)
- `AuditRegistry.gs` / `AuditRunner.gs` completo (registro declarativo + reanudación entre ejecuciones) — solo si el menú mínimo demuestra que hace falta más.
- `ToolRegistry.gs`, `ToolDispatcher.gs`, roles de IA, `AI_EXECUTION`, MCP como capa de orquestación — fase posterior a un runner interno maduro.
- Refactor de `Repository.js` en módulos — al final, nunca como preparación previa.
- Funcionalidades nuevas con feature flag: `TIPO_MATERIAL`, `PERSONA_EQUIPO_AUSENCIA` (disponibilidad por fecha), `PLANIFICACION_DIARIA`, `ASISTENCIA_DIARIA`.

## Riesgos abiertos a vigilar en todo el roadmap
- Recurrencia de la divergencia clasp↔git (ya ocurrió una vez, se resolvió) — verificar `git status`/`clasp pull` antes de cada sesión de cierre de fase.
- 9 de 27 reglas inventariadas sin prueba reactiva localizada — cerrar en paralelo, no esperar a que bloquee una fase.
- Apps Script sin pruebas locales completas — todo cierre de gate requiere ejecución real y, en Fase H, verificación visual humana.
