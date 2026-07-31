# Roadmap de desarrollo — Backlog consolidado de la prueba operativa real

**Basado en:** `BACKLOG_CONSOLIDADO.md` (cierre 2026-07-31, Paso 10 de `ROADMAP_IMPLEMENTACION.md`).
**Principio de secuenciación:** igual que todo el roadmap anterior — diseño contra datos reales → código → prueba reactiva → `clasp push` con autorización explícita → verificación humana en Apps Script real → commit → actualizar baseline. Ningún bloque se abre sin cerrar el anterior. Cambios mínimos, sin refactor de `Repository.js`, sin construir por delante de necesidad demostrada.

## Numeración
Continúa la serie de fases del roadmap original (A-J, Pasos 0-10). Estas son **Fases L en adelante**, para no chocar con la numeración ya cerrada.

---

## Fase L0 — Corrección de bug: `FUNC-REC-001` ✅ CERRADA (2026-07-31)

- **Corregido** `detectarProblemasTareaResponsable_` (`IntegrityService.js`): ahora calcula la dedicación máxima simultánea por barrido temporal (sweep-line) en vez de sumar todas las asignaciones activas sin comparar fechas. Las asignaciones sin fechas se tratan como siempre activas (mismo criterio que el resto del sistema); en empates de instante se procesan primero los inicios que los fines, igual que `detectarSolapamientoTemporalTareaResponsable_` (FUNC-REC-002), para mantener el mismo criterio de solapamiento inclusivo en todo el sistema.
- **Prueba reactiva nueva**: `probarIntegridadDedicacionSoloCuentaPeriodosSolapados` (`Tests_Repository2.js`) — calcula dinámicamente el margen de dedicación disponible de la persona de prueba (no exige una persona sin asignaciones), construye dos asignaciones sintéticas en fechas de 2035 (fuera de cualquier dato real): sin solapar no supera el 100% simultáneo, solapando sí lo supera. Verificada `result=OK` en Apps Script real, con restauración limpia.
- **Regresión verificada**: `probarIntegridadDedicacionPersonaSuperior100` (FUNC-REC-001 original, `result=OK`) y `probarIntegridadSolapamientoTemporalTareaResponsable` (FUNC-REC-002, `result=OK`) — sin cambios de comportamiento.
- **Estimación real: 1 sesión corta**, como se había previsto.

---

## Fase L1 — Mecanismos transversales fundamentales
Los cuatro de mayor apalancamiento (resuelven 20+ fricciones combinadas). Diseñar y verificar cada uno por separado, no como un único cambio monolítico.

### L1.1 — Asignación N:M polimórfica ✅ CERRADA (2026-07-31)

**Construido**: entidad `ASIGNACION` (hoja `16_ASIGNACION`, prefijo `ASG`) — `ENTIDAD_TIPO`, `ENTIDAD_ID` (FK dependiente), `PERSONA_EQUIPO_ID`, `ROL_ASIGNADO`, `FECHA_INICIO_ASIGNACION`, `FECHA_FIN_ASIGNACION`, `PORCENTAJE_DEDICACION`, `ESTADO`, `OBSERVACIONES`. Reutiliza sin crear nada nuevo: catálogo `CFG_ENTIDAD_DOCUMENTO`, resolver `DOCUMENTO_ENTIDAD_ID`, catálogos `CFG_ROL_ASIGNACION`/`CFG_ESTADO_ASIGNACION` (ya existían en `90_CONFIGURACION`, usados por `TAREA_RESPONSABLE`). Menú "Nueva asignación"/"Asignación" (editar) añadido. Regla de integridad `FUNC-ASG-001` (dedicación simultánea >100%) reutilizando el mismo barrido temporal del bug F-048, extraído a un helper compartido `calcularDedicacionMaximaSimultaneaPorPersona_`. Instalador `instalarEntidadAsignacion` (idempotente) para crear la hoja.

**Verificado**: `probarIntegridadAltaAsignacionDryRun` (`result=OK`, ID `ASG-0001` generado correctamente), `probarIntegridadDedicacionAsignacionSoloCuentaPeriodosSolapados` (`result=OK`, mismo patrón que L0), y **alta real en la UI** (`ASG-0001`, `HIS-1275`, `RESULTADO=OK` — desplegable dependiente de `ENTIDAD_ID` resolvió `CAM-0010` correctamente al elegir "Campaña").

**Corrección de alcance (tras construirlo, no asumido de antemano)**: de las fricciones originalmente listadas, solo **F-002** (CAMPANA sin responsable) y **F-009** (PROYECTO sin estructura de responsables) — y su equivalente para PRODUCTO/PROCESO/DECISION/INCIDENCIA — quedan realmente resueltas: son los 6 niveles que antes no tenían ningún mecanismo de asignación y ahora sí. **No resuelto todavía**:
- **F-036** (TAREA sin responsable en su propia alta) y **F-046/F-047/F-049/F-050/F-051** (mejoras de UX de `TAREA_RESPONSABLE`: buscador, horas, desglose de equipo, disponibilidad visible) — `TAREA_RESPONSABLE` se dejó intacta a propósito, sigue siendo el mecanismo de tareas.
- **F-053/F-060** (roles en DECISION/INCIDENCIA) — el mecanismo ya existe como relación independiente vía `ASIGNACION`, pero los formularios de DECISION/INCIDENCIA siguen mostrando un único `RESPONSABLE_ID`, sin integrar la nueva relación.
- **Límite de alcance documentado en código**: `FUNC-REC-001` (TAREA_RESPONSABLE) y `FUNC-ASG-001` (ASIGNACION) no se combinan — una persona podría superar el 100% real sumando ambas tablas sin que ninguna regla lo detecte todavía.

F-046/F-047/F-049/F-050/F-051 quedan reclasificadas hacia L3.5 (buscador en selectores) y una futura integración de UX de `TAREA_RESPONSABLE`, no cerradas por L1.1.

### L1.2 — Grafo de relaciones/dependencias entre entidades del mismo tipo ✅ CERRADA (2026-07-31)

**Construido**: entidad `RELACION` (hoja `17_RELACION`, prefijo `REL`) — `ENTIDAD_TIPO`, `ENTIDAD_ORIGEN_ID`, `ENTIDAD_DESTINO_ID` (ambos FK dependientes reutilizando el resolver `DOCUMENTO_ENTIDAD_ID`), `TIPO_RELACION`, `DESFASE_DIAS`, `ESTADO` (reutiliza `CFG_ESTADO_RELACION`, ya existente), `OBSERVACIONES`. Catálogo nuevo `TIPO_RELACION` (10 valores: Depende de/Bloquea/Requiere/Duplica/Complementa/Sustituye/Comparte recursos/Fin a inicio/Inicio a inicio/Fin a fin) — a diferencia de L1.1 sí hizo falta crear catálogo nuevo. Menú "Relación / dependencia (grafo)" / "Relación" (editar) añadido. Regla de integridad `FUNC-GRF-001` (autorreferencia: origen=destino) — alcance mínimo a propósito, detección de ciclos más allá del par directo queda fuera de esta fase. `TAREA_PREDECESORA_ID` no se toca; `RELACION` es mecanismo adicional, no sustituto. Instalador `instalarEntidadRelacion` (idempotente) crea hoja + filas de catálogo + **named range `CFG_TIPO_RELACION`**.

**Hallazgo técnico de esta fase**: los campos `tipo: 'catalogo'` de los formularios resuelven contra un *named range* de Google Sheets (`obtenerCatalogo()`, `ConfigRepository.js`), no contra las filas de `90_CONFIGURACION` directamente — cualquier catálogo nuevo futuro necesita también su named range, no solo sus filas. Documentado aquí porque L1.1 no lo necesitó (reutilizó catálogos ya existentes) y casi se pasa por alto en L1.2.

**Verificado**: `probarIntegridadAltaRelacionDryRun` (`result=OK`, ID `REL-0001`), `probarIntegridadRelacionAutoreferenciaDetectada` (`result=OK`), y **alta real en la UI** (`REL-0001`, PRO-0003→PRO-0001, "Comparte recursos", `HIS-1276`, `RESULTADO=OK` — catálogo nuevo y ambos desplegables dependientes funcionaron correctamente).

**Alcance real vs. backlog original**: F-013 (PROYECTO_RELACION) y F-028 (PROCESO_DEPENDENCIA) quedan resueltas — mecanismo disponible para ambos. F-038 (TAREA_PREDECESORA_ID único) queda **parcialmente** resuelta: existe una alternativa N:M vía `RELACION`, pero el campo simple de TAREA sigue igual, sin integración entre ambos. **F-052 se retira de esta fase**: es un vínculo *entre tipos distintos* (DECISION→PRODUCTO/PROCESO/TAREA), no una relación *entre entidades del mismo tipo* — pertenece al mecanismo #5 (vínculo polimórfico genérico, L3.1), no a este. Corrección de categorización del backlog original, no un hallazgo nuevo.

### L1.3 — Criterios de aceptación / Definition of Done ✅ CERRADA (2026-07-31)

**Construido**: 5 campos opcionales (`OBJETIVO`, `RESULTADO_ESPERADO`, `CRITERIOS_ACEPTACION`, `DEFINITION_OF_DONE`, `VALIDADOR_ID`) añadidos a `PROYECTO`, `PRODUCTO`, `PROCESO`, `TAREA`, `DECISION`. Columnas añadidas **al final** de cada hoja real (append puro, no inserción en medio) por seguridad frente a cientos de filas históricas ya existentes (`PROYECTO` 767, `TAREA` 824, etc.) — decisión explícita de minimizar riesgo, no descuido de la convención visual del resto del sistema. Ningún campo obligatorio, para no romper el histórico ni bloquear el flujo actual. `CRITERIOS_ACEPTACION`/`DEFINITION_OF_DONE` como `textarea` en las 5 entidades (ajustado tras revisión visual: el `texto` de una línea inicial no encajaba con contenido de varios puntos). Sin regla de integridad nueva — son campos descriptivos, no hay invariante objetivo que validar en esta fase. Instalador `instalarCriteriosAceptacion` (idempotente).

**Verificado**: `probarIntegridadCamposCriteriosAceptacionDryRun` (`result=OK` para las 5 entidades, tras dos correcciones de la propia prueba: `PRODUCTO` valida unicidad de `CODIGO` incluso en `dryRun`, `PROCESO`/`TAREA` validan unicidad de `ORDEN_SECUENCIA` dentro de su padre incluso en `dryRun` — ninguna de las dos es un defecto, son validaciones ya existentes que la prueba no tuvo en cuenta al reutilizar datos de un registro real). Alta real en la UI confirmada visualmente (formulario "Nueva tarea": los 5 campos aparecen correctamente antes de Observaciones).

**Alcance**: F-011 (PROYECTO), F-017 (PRODUCTO), F-030/F-035 (PROCESO, fusionadas), F-040 (TAREA), F-054 (DECISION, parcial — cubre criterios/objetivo/resultado, no las alternativas estructuradas completas que pedía F-054) quedan con el mecanismo disponible. **Limitación explícita**: al no ser obligatorios, la adopción es voluntaria — el campo existe pero nada fuerza su uso todavía. Puente natural hacia L1.4 (precondiciones por estado): exigir `CRITERIOS_ACEPTACION` relleno antes de permitir el paso a estados terminales cerraría esto del todo.

### L1.4 — Precondiciones deterministas por estado
Reglas de validación de transición de estado (no campos nuevos, solo reglas) para PROCESO, TAREA, INCIDENCIA, PROVEEDOR.
Resuelve: F-033, F-044, F-065, F-095.

Cada submódulo: prueba reactiva propia, `clasp push` propio, verificación humana propia, commit propio. **Estimación: 3-5 sesiones en total (una por submódulo, más integración).**

---

## Fase L2 — Ganancias baratas (en paralelo con L1)
No dependen de los mecanismos transversales, se pueden hacer en cualquier momento:

- F-058 — ampliar catálogo `TIPO` de INCIDENCIA.
- F-071 — ampliar catálogo `TIPO_DOCUMENTO`.
- F-042 — exponer `MOTIVO_BLOQUEO`/`MOTIVO_POSPOSICION`/`MOTIVO_CANCELACION` en el formulario de TAREA.
- Validación condicional en DECISION (resolución+fecha obligatorias al aprobar/rechazar).
- F-014 — normalización de código de PRODUCTO (verificar contra `Ids.js` primero).

**Estimación: 1 sesión, todo el bloque junto (son cambios pequeños e independientes).**

---

## Fase L3 — Mecanismos transversales secundarios
Dependen de que L1 esté cerrado (usan las mismas convenciones de diseño):

### L3.1 — Vínculo polimórfico genérico
`DOCUMENTO_CONTEXTO`/`DECISION_CONTEXTO`/`INCIDENCIA_BLOQUEO`/`RECURSO_REFERENCIA` como una única tabla `VINCULO(ENTIDAD_ORIGEN_TIPO, ENTIDAD_ORIGEN_ID, ENTIDAD_DESTINO_TIPO, ENTIDAD_DESTINO_ID, TIPO_VINCULO)`.
Resuelve: F-052, F-067, parte de F-079.

### L3.2 — Recurso compartido reutilizado (`MODO_USO`)
Resuelve: F-022, F-026, F-049.

### L3.3 — Libro de movimientos
`MOVIMIENTO_MATERIAL`/`RECURSO_MOVIMIENTO` unificado — precondición para Fase L5 (RECURSO).
Resuelve: F-083, base de F-098.

### L3.4 — Definición vs. ejecución
`EJECUCION_TAREA` como entidad separada de `TAREA`.
Resuelve: necesidad anotada en `PROPUESTA_TAREA_ALTA.md`, F-086.

### L3.5 — Buscador/filtro en selectores FK
Patrón de UI, no de datos — aplicable a todos los `<select>` del sistema.
Resuelve: F-021, F-050, F-062, selector de PROVEEDOR.

### L3.6 — Avance derivado vs. manual
`METODO_CALCULO_AVANCE` en PROCESO y TAREA.
Resuelve: F-029, F-039.

**Estimación: 4-6 sesiones (uno por submódulo).**

---

## Fase L4 — Funcionalidades específicas de alto valor
Se apoyan en los mecanismos de L1/L3 ya construidos:

- **F-063 (crítica)** — `INCIDENCIA_TAREA` + botón "Crear tarea correctora". Usa L1.2 (grafo de relaciones) como base.
- **F-015** — "Guardar y vincular" compuesto (PRODUCTO+PROYECTO_PRODUCTO), reutilizando `CORRELATION_ID`+reversión ya existente.
- **F-093** — `PROVEEDOR_MATERIAL` N:M.

**Estimación: 2-3 sesiones.**

---

## Fase L5 — Bloques estructurales grandes (uno a la vez)
Cada uno es del tamaño de una fase completa del roadmap original — no se abre el siguiente sin cerrar el anterior:

### L5.1 — Abstracción RECURSO (fases R1-R4 de `PROPUESTA_RECURSO_MATERIAL.md`)
R1 (abstracción sin romper MATERIAL/PERSONA_EQUIPO existentes) → R2 (nuevos tipos de recurso) → R3 (inventario unificado, migración de MATERIAL) → R4 (planificación de capacidad).
**No empezar sin L1.1 y L3.3 ya cerrados** (reutiliza asignación N:M y libro de movimientos).

### L5.2 — Pedidos y recepciones de proveedor
`SOLICITUD_COMPRA → PEDIDO_PROVEEDOR → RECEPCION`, actualizando inventario vía L3.3.
**Depende de L5.1.**

### L5.3 — Importación masiva de campaña completa
Árbol `CAMPANA→PROYECTO→PRODUCTO→PROCESO→TAREA` de una vez, con plantilla+staging+dryRun+aprobación humana. Ya priorizado antes de la prueba operativa; ahora con más certeza de qué campos hacen falta en cada nivel gracias a las Fases L1-L4.

**Estimación: 3-4 sesiones por bloque (L5.1 es el mayor, probablemente 2-3 sesiones él solo).**

---

## Fase L6 — Explícitamente diferido (sin fecha, revisar solo si cambia el contexto)
- Motor por eventos y sistema de recomendaciones.
- Espacio de simulación de escenarios.
- Entrada conversacional con IA para generar campañas/tutoriales.
- Sincronización con Google Calendar.
- Sistema de tutoriales en vídeo y gamificación.

No se empieza a diseñar nada de esto hasta que L0-L5 estén cerrados y haya evidencia de que sigue haciendo falta con la misma forma en que se planteó durante la prueba operativa.

---

## Resumen de secuencia y estimación total

| Fase | Contenido | Estimación | Depende de |
|---|---|---|---|
| L0 | Bug F-048 | 1 sesión | — |
| L1 | 4 mecanismos transversales fundamentales | 3-5 sesiones | — (puede empezar tras L0) |
| L2 | Ganancias baratas | 1 sesión | — (paralelo a L1) |
| L3 | 6 mecanismos transversales secundarios | 4-6 sesiones | L1 |
| L4 | 3 funcionalidades específicas | 2-3 sesiones | L1, L3 |
| L5 | 3 bloques estructurales grandes | 8-10 sesiones | L1, L3, L4 |
| L6 | Diferido | — | revisión de contexto |

**Total estimado L0-L5: ~19-26 sesiones**, con gate humano en cada submódulo — no es una cifra para comprometerse como plazo, es una referencia de esfuerzo relativo entre fases, igual que las estimaciones del roadmap original.

## Principios de gobierno (heredados, sin cambios)
- Git local, sin remoto. `clasp push` solo con autorización explícita.
- Ninguna IA colaboradora despliega o cierra fase por sí misma.
- Cambios mínimos, una modificación funcional por bloque, reversibilidad total.
- Gate humano obligatorio antes de cerrar cualquier fase.
- Cada fase, al cerrar, actualiza `BASELINE_DESARROLLO.md` y este roadmap — mismo patrón que Fases D-J.
