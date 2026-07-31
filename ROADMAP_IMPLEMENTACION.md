# ROADMAP DE IMPLEMENTACIÓN — LaTroballa Audit

Basado en `BASELINE_DESARROLLO.md` (2026-07-30). Secuencia priorizada, no calendario fijo — cada paso termina con gate humano antes de avanzar al siguiente.

## Principio de secuenciación

No se construye automatización (menú, `AuditRunner`, gateway multi-IA) por delante del cierre de auditoría real. No se refactoriza `Repository.js`. No se introduce MCP hasta que el runner interno esté maduro. El orden abajo respeta eso.

## Paso 0 — Terminar lo que ya está en curso ✅ CERRADO
- Cerrado: `auditarFaseC06A_ProcesoCompletadoConTareaNoTerminada` commiteado (`0981818`), Fase C cerrada.

## Paso 1 — Fase D recortada ✅ CERRADO (4/5 reglas)
Implementadas y verificadas con `result=OK` en Apps Script real: `FUNC-REC-002` (solapamientos temporales), `FUNC-REC-003` (personas inactivas con asignación activa), `FUNC-REC-004` (capacidad semanal vs duración), `FUNC-REC-005` (carga por periodos). "Equipo/persona" diferida (no modelable sin entidad nueva de membresía). "Disponibilidad real por fecha" queda fuera (ver baseline).

## Paso 2 — Instrumentación barata de Fase I (adelantada) — EN CURSO
Antes de construir Fase H, medir: tiempos por prueba, número de lecturas de hoja, uso de `flush`. Esto no requiere refactor todavía, solo logging. Se hace ahora porque Fase H depende de la misma arquitectura de lectura que ya sabemos que falla bajo carga.
**Estimación: 0.5-1 sesión.**

## Paso 3 — Fase E: Jerarquía principal
Campaña→proyecto→producto→proceso→tarea: 7 reglas de coherencia cruzada.
**Estimación: 2 sesiones.**

## Paso 4 — Fase F: Documentos
Bloque DOCUMENTO (FK polimórfica, versión, vigencia, duplicados).
**Estimación: 1 sesión.**

## Paso 5 — Fase G: Revisión consolidada de Historial/Reversión
No es desarrollo nuevo, es cierre formal de algo ya verificado.
**Estimación: 1 sesión corta.**

## Paso 6 — Fase I completa: Rendimiento
Con los datos del Paso 2 ya medidos, decidir alcance real del refactor de lectura (contexto de datos único, evitar `listarRegistros` repetido, reducir `flush`). Puede ser ligero o significativo según lo que midáis.
**Estimación: 1-3 sesiones.**

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
