# Backlog consolidado — Prueba operativa real "Desarrollo y mejora del sistema LaTroballa"

**Cierre de la prueba:** 2026-07-31
**Origen:** 98 números de fricción emitidos (`F-001` a `F-098`), 91 entradas reales (7 números no usados: F-019, F-020, F-074 a F-078), de las cuales **2 invalidadas por verificación** (F-023, F-025) y **2 solapadas a fusionar** (F-030/F-035) → **89 fricciones activas y distintas**.
**Cobertura real alcanzada**: jerarquía completa CAMPANA→PROYECTO→PRODUCTO→PROCESO→TAREA, asignación de personas/equipos (TAREA_RESPONSABLE), DOCUMENTO, DECISION, INCIDENCIA, MATERIAL, TAREA_MATERIAL, PROVEEDOR. Todas las entradas nacieron de un alta real en el sistema (excepto F-079, diseño anticipado, verificado después con F-080).

Este documento no repite el detalle de cada fricción — vive en `PRUEBA_REAL_CAMPANA.md` (registro cronológico) y los 10 `PROPUESTA_*.md` (diseño completo por entidad). Aquí se **prioriza y agrupa** para decidir qué se aborda primero.

---

## 0. El hallazgo más importante de toda la prueba

No son las 89 fricciones individuales — es que **la mayoría no son problemas de una entidad, son el mismo problema repetido en 4-7 entidades distintas**. Diseñar por fricción individual construiría el mismo mecanismo varias veces con forma distinta. Diseñar por mecanismo transversal (sección 2) resuelve decenas de fricciones a la vez.

---

## 1. Tier 0 — Corrección de bug (pista separada, distinta del resto del backlog)

### F-048 — `FUNC-REC-001` no considera solapamiento temporal
**Confirmado en código** (`IntegrityService.js:1494-1528`): suma `PORCENTAJE_DEDICACION` de todas las asignaciones activas de una persona sin comparar fechas — genera falsos positivos reales hoy (dos asignaciones del 100% en meses distintos = falso "200%"). No es una mejora de diseño, es una regla ya desplegada que produce resultados incorrectos. **Corregir con la misma prioridad que cualquier bug de producción, independiente del ritmo del resto del backlog.**

---

## 2. Tier 1 — Mecanismos transversales (diseñar una vez, no por entidad)

Cada uno resuelve varias fricciones simultáneamente. Orden sugerido por número de fricciones que resuelve:

| # | Mecanismo | Fricciones que resuelve | Apariciones |
|---|---|---|---|
| 1 | **Asignación N:M polimórfica** (persona/equipo → cualquier entidad, con rol/dedicación/fechas) | F-002, F-009, F-036, F-046, F-047, F-049, F-050, F-051, F-053, F-060 | 7+ |
| 2 | **Grafo de relaciones/dependencias** entre entidades del mismo tipo (tipo de relación + desfase) | F-013, F-028, F-038, F-052 | 4+ |
| 3 | **Criterios de aceptación / Definition of Done** estructurados | F-011, F-017, F-030/F-035 (fusionadas), F-040, F-054 | 5+ |
| 4 | **Clasificación en 3 ejes** (tipo / prioridad / madurez, separados) | F-008, F-016, F-034 | 3 |
| 5 | **Vínculo polimórfico genérico** (`ENTIDAD_TIPO`+`ENTIDAD_ID` → cualquier entidad, para documentos/decisiones/bloqueos/recursos) | F-052, F-067, F-079 (`RECURSO_REFERENCIA`) | 3+ |
| 6 | **Precondiciones deterministas por estado** ("estado sin criterio verificable") | F-033, F-044, F-065, F-095 | **4 confirmadas** |
| 7 | **Recurso compartido reutilizado** (`MODO_USO`: referencia/reutilización/adaptación/clon) | F-022, F-026, F-049 | 3 |
| 8 | **Libro de movimientos** en vez de sobrescribir un campo acumulado | F-079/F-083 (`RECURSO_MOVIMIENTO`/`MOVIMIENTO_MATERIAL`, ya unificados), F-098 | 2-3 |
| 9 | **Definición vs. ejecución** (entidad maestra reutilizable vs. ocurrencia real) | `EJECUCION_TAREA` (sin F, `PROPUESTA_TAREA_ALTA.md`), F-086 | 2-3 |
| 10 | **Buscador/filtro en selectores FK** (patrón de UI, no de datos) | F-021, F-050, F-062 + selector de PROVEEDOR | 4+ |
| 11 | **Avance derivado vs. manual** (`METODO_CALCULO_AVANCE`) | F-029, F-039 | 2 |
| 12 | **Exponer campos ya persistidos pero ausentes del formulario** | F-042 (confirmado con columnas reales) | 1 confirmado — revisar si se repite en otras entidades antes de descartarlo como aislado |

**Recomendación de orden**: mecanismos 1, 2, 3 y 6 primero (más fricciones resueltas, menor ambigüedad de diseño); 5 y 8 después (dependen de que 1-2 ya estén decididos); 10 puede ir en paralelo (es UI, no dato).

---

## 3. Tier 2 — Ganancias baratas (sin diseño nuevo, barato de implementar)

No requieren entidad nueva ni mecanismo transversal — son ampliar catálogos o exponer campos que ya existen:

- **F-058** — ampliar catálogo `TIPO` de INCIDENCIA (solo `90_CONFIGURACION`)
- **F-071** — ampliar catálogo `TIPO_DOCUMENTO`
- **F-042** — exponer `MOTIVO_BLOQUEO`/`MOTIVO_POSPOSICION`/`MOTIVO_CANCELACION` ya existentes en `06_TAREAS`
- **Validación condicional en DECISION** (parte de F-054): exigir `RESOLUCION`+`FECHA_RESOLUCION` al pasar a Aprobada/Rechazada — campos ya existen
- **F-014** — normalización de código de PRODUCTO (verificar primero contra `Ids.js`, puede ser solo una función nueva)

---

## 4. Tier 3 — Funcionalidades específicas de alto valor

No son mecanismos transversales, pero tienen valor claro por sí mismas:

- **F-063 (crítica)** — `INCIDENCIA_TAREA` + botón "Crear tarea correctora". Es, literalmente, el mecanismo que este propio proceso de auditoría echó en falta al tener que llevar el backlog fuera del sistema.
- **F-015** — operación compuesta "Guardar y vincular" (PRODUCTO+PROYECTO_PRODUCTO) reutilizando el patrón `CORRELATION_ID`+reversión ya existente en `HistorialService`/`Reversion.js`.
- **F-093** — `PROVEEDOR_MATERIAL` N:M (resuelve simultáneamente alternativas de proveedor, precios, plazos y resiliencia de suministro).

---

## 5. Tier 4 — Bloques estructurales grandes (no mezclar con lo anterior)

Requieren su propio ciclo de diseño→prueba→gate, igual que cualquier fase anterior de esta auditoría:

- **F-079** — abstracción `RECURSO` (fases R1-R4, `PROPUESTA_RECURSO_MATERIAL.md`). Incluye `TAREA_RECURSO`, `RECURSO_MOVIMIENTO`, módulo "logística/almacén".
- **F-098** — pedidos/recepciones de proveedor (`SOLICITUD_COMPRA → PEDIDO → RECEPCION`), depende de que F-079 esté decidido primero.
- **Importación masiva de campaña completa** (árbol `CAMPANA→TAREA` de una vez) — ya priorizado antes de esta prueba, ahora con más contexto real de qué campos hacen falta en cada nivel.

---

## 6. Tier 5 — Explícitamente diferido (no iniciar sin revisar esta decisión)

Sin cambios respecto a lo ya decidido en `ROADMAP_IMPLEMENTACION.md` y en la conversación de esta sesión:
- Motor por eventos y sistema de recomendaciones.
- Espacio de simulación de escenarios.
- Entrada conversacional con IA (ChatGPT/Ollama) para generar campañas/tutoriales.
- Sincronización con Google Calendar.
- Sistema de tutoriales en vídeo y gamificación.

---

## 7. Invalidadas / cerradas sin acción

- **F-023** — `ACTIVO` sí existe separado de `ESTADO` en `PROYECTO_PRODUCTO`; confirmación previa incorrecta por mirar solo `Repository.js`, no la hoja real.
- **F-025** — no había espacio real en el FK; artefacto de texto pegado.

## 8. Solapes a fusionar al diseñar

- **F-030 / F-035** (PROCESO) — ambas piden criterios de aceptación/entradas-salidas; es un único bloque de diseño, no dos mejoras independientes.

---

## 9. Riesgo residual documentado (no bloqueante)

- Toda la prueba se ejecutó dentro de una campaña meta (desarrollo del propio sistema). El dominio físico del taller (MATERIAL, PROVEEDOR) se cubrió, pero con menor profundidad de escenarios reales (una sola combinación material↔tarea↔proveedor) que el dominio de planificación (5 niveles de jerarquía, cada uno con alta real).
- Fase C de la auditoría original (más allá de `auditarFaseC06A`) sigue sin tocar.
- Formularios de Campaña/Proyecto/Producto/Proceso/Proveedor/Persona-Equipo y relaciones N:M ya fueron ejercitados aquí (a diferencia del riesgo residual anotado en Fase H, que decía que quedaban sin verificar) — **este riesgo de `ACTA_CIERRE_SESION.md` queda resuelto por esta prueba**.

---

## 10. Índice completo de fricciones por entidad

| Rango | Entidad | Activas | Prioridad crítica/alta destacada | Documento |
|---|---|---|---|---|
| F-001 a F-007 | CAMPANA | 7 | — | `PROPUESTA_CAMPANA_ALTA_PLANIFICACION.md` |
| F-008 a F-013 | PROYECTO | 6 | — | `PROPUESTA_PROYECTO_ALTA_PLANIFICACION.md` |
| F-014 a F-018 | PRODUCTO | 5 | — | `PROPUESTA_PRODUCTO_ALTA.md` |
| F-021 a F-025 | PROYECTO_PRODUCTO | 3 (2 invalidadas) | — | `PROPUESTA_PROYECTO_PRODUCTO_RELACION.md` |
| F-026 a F-035 | PROCESO | 10 (2 solapadas) | — | `PROPUESTA_PROCESO_ALTA.md` |
| F-036 a F-045 | TAREA | 10 | — | `PROPUESTA_TAREA_ALTA.md` |
| F-046 a F-051 | TAREA_RESPONSABLE | 6 | **F-048 bug crítico** | registrado en `PRUEBA_REAL_CAMPANA.md` |
| F-052 a F-057 | DECISION | 6 | — | `PROPUESTA_DECISION_ALTA.md` |
| F-058 a F-065 | INCIDENCIA | 8 | **F-063 crítica de diseño** | `PROPUESTA_INCIDENCIA_ALTA.md` |
| F-066 a F-073 | DOCUMENTO | 8 | — | `PROPUESTA_DOCUMENTO_ALTA.md` |
| F-079, F-080 | MATERIAL / RECURSO | 2 | — | `PROPUESTA_RECURSO_MATERIAL.md` |
| F-081 a F-088 | TAREA_MATERIAL | 8 | — | `PROPUESTA_RECURSO_MATERIAL.md` |
| F-089 a F-098 | PROVEEDOR | 10 | — | `PROPUESTA_PROVEEDOR_ALTA.md` |

---

## Recomendación de secuencia final

1. **F-048** (bug) — corrección aislada, gate humano propio, no espera al resto.
2. **Tier 1** (mecanismos 1, 2, 3, 6) — el trabajo de diseño con mayor apalancamiento de todo el backlog.
3. **Tier 2** (ganancias baratas) — puede ir en paralelo al punto 2, son independientes.
4. **Tier 3** (F-063, F-015, F-093) — una vez estén los mecanismos base, se apoyan en ellos.
5. **Tier 4** (RECURSO, import masivo) — bloques grandes, uno a la vez, con su propio ciclo de fase.
6. **Tier 5** — sin fecha, revisar solo si cambia el contexto.

Cada bloque, cuando se aborde, sigue el mismo ritmo que toda esta auditoría: diseño contra datos reales → código → prueba reactiva → `clasp push` con autorización → verificación humana en Apps Script real → commit → actualización de baseline.
