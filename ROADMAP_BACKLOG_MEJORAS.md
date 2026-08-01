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

### L1.4 — Precondiciones deterministas por estado ✅ CERRADA (2026-07-31)

**Construido**: 4 reglas nuevas, sin campos nuevos — aprovechan campos ya existentes, incluidos los añadidos en L1.3 (cierra el "puente" anotado al cerrar esa fase). Todas en `ADVERTENCIA`.
- `FUNC-PROCESO-003` (F-033): PROCESO "Preparado" sin `RESPONSABLE_ID` o `CRITERIOS_ACEPTACION`.
- `FUNC-TAREA-013` (F-044): TAREA "Preparada" sin responsable activo en `TAREA_RESPONSABLE` o sin `CRITERIOS_ACEPTACION`.
- `FUNC-INC-004` (F-065): INCIDENCIA "Resuelta"/"Cerrada" sin `ACCION_CORRECTORA` o `FECHA_RESOLUCION` — **campos que ya existían en la hoja y en el formulario** (condicionalmente visibles), no vistos en el análisis original de F-065.
- `FUNC-PRV-006` (F-095): PROVEEDOR "Activo" sin `NIF_CIF` o `PERSONA_CONTACTO` — la misma situación real observada en `PRV-0005` durante la prueba operativa.

Sin instalador — no se toca esquema ni catálogo, solo lógica de `IntegrityService.js`.

**Verificado**: las 4 pruebas reactivas (`probarIntegridadProcesoPreparadoSinPrecondiciones`, `probarIntegridadTareaPreparadaSinPrecondiciones`, `probarIntegridadIncidenciaResueltaSinAccionCorrectora`, `probarIntegridadProveedorActivoSinContacto`) con `result=OK`, cada una detectando el hallazgo al mutar un registro real (`PCS-0001`, `TAR-0003`, `INC-0001`, `PRV-0001`) y confirmando su desaparición tras restaurar. Sin verificación visual de UI adicional — a diferencia de L1.1/L1.2, esta fase no añade formularios ni desplegables nuevos; la prueba reactiva ya ejercita el mismo camino (`obtenerReporteIntegridad`) que usa producción.

**Alcance**: las 4 fricciones quedan resueltas como aviso de calidad de datos (no bloqueo) — coherente con el resto del sistema, que no impone reglas duras de transición de estado en ningún otro punto.

---

## Fase L2 — Ganancias baratas ✅ CERRADA (2026-07-31)

**Dos de los cinco elementos ya estaban resueltos, verificado antes de tocar nada**:
- **F-042 — falso hallazgo.** `git blame` confirma que `MOTIVO_BLOQUEO`/`MOTIVO_POSPOSICION`/`MOTIVO_CANCELACION` están en `ESQUEMAS_FORMULARIO_MVP.TAREA` con su `visibleSi` correcto desde el primer commit de la auditoría (`7d76bba`), antes de que empezara esta sesión. La fricción original confundió "campo oculto condicionalmente porque el estado de la tarea no lo requiere" con "campo ausente del formulario".
- **Validación condicional en DECISION — ya existía.** `FUNC-DEC-001` ya exige `RESOLUCION`+`FECHA_RESOLUCION` para los estados de cierre (`Aprobada`/`Rechazada`/`Sustituida`, vía `ESTADOS_DECISION_CIERRE_`), en `ERROR` — más estricto de lo planeado.

**Construido** (los 3 elementos restantes, genuinamente pendientes):
- **F-058** — catálogo `TIPO_INCIDENCIA` ampliado con 7 valores (Funcional/Usabilidad/Datos/Integración/Rendimiento/Trazabilidad/Automatización).
- **F-071** — catálogo `TIPO_DOCUMENTO` ampliado con 10 valores (Plan/Especificación/Requisitos/Tutorial/Checklist/Memoria/Evidencia/Prueba/Referencia/Decisión).
- Ambos insertados **antes** de la opción "Otra"/"Otro" de cada catálogo (que queda como última opción), con el named range `CFG_TIPO_INCIDENCIA`/`CFG_TIPO_DOCUMENTO` recalculado para seguir siendo un bloque contiguo tras el desplazamiento de filas — misma lección técnica que L1.2. Instalador `instalarCatalogosAmpliadosL2` (idempotente, reutilizable como patrón general `ampliarCatalogoL2_` para futuras ampliaciones de catálogo).
- **F-014** — `FUNC-PRD-001`: `PRODUCTO.CODIGO` con minúsculas/espacios/acentos genera `ADVERTENCIA` (aviso de calidad de datos, no reescribe el valor).

**Verificado**: `instalarCatalogosAmpliadosL2` (`status=OK`, named ranges recalculados `64:77` y `97:114`), `probarIntegridadCatalogosAmpliadosL2` (`result=OK`, 14 y 18 valores respectivamente, sin roturas en el resto de reglas tras el desplazamiento de filas), `probarIntegridadProductoCodigoNoNormalizado` (`result=OK`).

**Estimación real: 1 sesión**, como se había previsto — aunque el alcance real fue 3 elementos, no 5.

---

## Fase L3 — Mecanismos transversales secundarios
Dependen de que L1 esté cerrado (usan las mismas convenciones de diseño):

### L3.1 — Vínculo polimórfico genérico ✅ CERRADA (2026-08-01)

**Construido**: entidad `VINCULO` (hoja `18_VINCULO`, prefijo `VIN`) — vínculo entre dos entidades de **tipo distinto** (a diferencia de `RELACION`/L1.2, que exige el mismo tipo en ambos extremos). Sustituye el patrón repetido de `DOCUMENTO_CONTEXTO`/`DECISION_CONTEXTO`/`INCIDENCIA_BLOQUEO`. Reutiliza el catálogo `CFG_ENTIDAD_DOCUMENTO` (ampliado con el valor `Documento`, ya que hasta ahora solo cubría las 7 entidades de la jerarquía, no a sí mismo) y el resolver `DOCUMENTO_ENTIDAD_ID` en ambos extremos. Catálogo nuevo `CFG_TIPO_VINCULO` (10 valores: Contexto/Evidencia/Resultado/Manual/Tutorial/Acta/Referencia/Aprobación/Bloquea/Relacionada). Regla `FUNC-VIN-001` (autorreferencia: mismo tipo y mismo ID en origen y destino). Instalador `instalarEntidadVinculo`, reutilizando el helper genérico `ampliarCatalogoL2_` de L2 (ahora generalizado para admitir "añadir al final del bloque" cuando la categoría no tiene una opción "Otro" de cierre) más uno nuevo (`crearCatalogoNuevoL3_`) para categorías de catálogo completamente nuevas.

**Incidente durante la instalación (corregido en el momento)**: la primera ejecución del instalador falló a mitad de camino — `ampliarCatalogoL2_` insertaba la fila nueva en `90_CONFIGURACION` pero intentaba rellenarla usando una variable obsoleta (`filaAntesDe`, `null` en el caso "añadir al final"), dejando una fila en blanco real en producción tras el `insertRowsBefore` ya ejecutado. Diagnosticado con `gsheets` (fila 128, contigua al bloque `ENTIDAD_DOCUMENTO`, sin pérdida de datos), corregido en el código, y reparado pidiendo al usuario que borrara manualmente la fila en blanco antes de reintentar — coherente con el principio de que los escritos reales al Sheet los ejecuta el usuario, incluso para reparar un bug propio.

**Verificado**: instalador `status=OK` tras la reparación (named ranges `CFG_ENTIDAD_DOCUMENTO=121:128`, `CFG_TIPO_VINCULO=175:184`), `probarIntegridadAltaVinculoDryRun` (`result=OK`, ID `VIN-0001`), `probarIntegridadVinculoAutoreferenciaDetectada` (`result=OK`), y alta real en la UI (`VIN-0001`, Proyecto `PRO-0003` → Proceso `PCS-0002`, tipo "Evidencia", `HIS-1277`, `RESULTADO=OK`).

**Alcance**: F-052 (DECISION limitada a un solo PROYECTO) y F-067 (DOCUMENTO limitado a una sola entidad) quedan con el mecanismo disponible como relación adicional — no se modificaron los formularios de DECISION/DOCUMENTO para integrarlo automáticamente, igual que con `ASIGNACION` en L1.1. La parte de F-079 relativa a `RECURSO_REFERENCIA` queda cubierta conceptualmente (mismo patrón), pero no se construye hasta la Fase L5 (RECURSO).

### L3.2 — Recurso compartido reutilizado (`MODO_USO`) ✅ CERRADA (2026-08-01)

**Corrección de alcance (antes de construir)**: F-049 no encaja en este mecanismo — trata de desglose de equipo en `TAREA_RESPONSABLE` (capacidad individual dentro de una asignación a equipo), no de clasificación de reutilización de un recurso compartido. Se retira de esta fase, igual que F-052 en L1.2; queda pendiente de encaje futuro (probablemente junto a mejoras de `TAREA_RESPONSABLE`/`ASIGNACION`).

**Construido**: catálogo nuevo `CFG_MODO_USO` (4 valores: Referencia compartida/Reutilización sin cambios/Adaptación específica/Clonación como nuevo), compartido entre `PROYECTO_PRODUCTO` (F-022) y `PROCESO` (F-026). `PROCESO` gana además `PROYECTO_PRODUCTO_ID` (FK opcional) para vincularse al contexto específico de un proyecto sin dejar de referenciar el `PRODUCTO_ID` maestro. Ambos campos opcionales, sin regla de integridad nueva (mismo criterio que L1.3). Instalador `instalarModoUso`, reutilizando `crearCatalogoNuevoL3_` (de L3.1) y un nuevo helper genérico `agregarColumnasSiFaltan_` (generaliza el patrón de `InstaladorCriteriosAceptacion.js` a una entidad por llamada).

**Corrección durante la verificación**: la prueba `dryRun` inicial reutilizaba el par `PROYECTO_ID`/`PRODUCTO_ID` exacto de una relación real, chocando con una validación de unicidad de `PROYECTO_PRODUCTO` que no había detectado antes (no aparece con ese nombre exacto en el código, por eso el primer grep no la encontró). Corregido buscando dinámicamente un `PROYECTO` activo aún no vinculado al `PRODUCTO_ID` de la relación base.

**Verificado**: `instalarModoUso` (`status=OK`, named range `CFG_MODO_USO=185:188`), `probarIntegridadModoUsoDryRun` (`result=OK` para `PROYECTO_PRODUCTO` y `PROCESO`), y dos actualizaciones reales en la UI (`PCS-0002` con `PROYECTO_PRODUCTO_ID=PPR-0001`/`MODO_USO=Reutilización sin cambios`, `HIS-1278`; `PPR-0002` con `MODO_USO=Referencia compartida`, `HIS-1279`, ambos `RESULTADO=OK`).

### L3.3 — Libro de movimientos ✅ CERRADA (2026-08-01)

**Construido**: entidad `MOVIMIENTO_MATERIAL` (hoja `19_MOVIMIENTO_MATERIAL`, prefijo `MOV`) — registro aditivo de eventos de stock (`MATERIAL_ID`, `TAREA_ID` opcional, `TIPO_MOVIMIENTO`, `CANTIDAD`, `UNIDAD`, `FECHA_MOVIMIENTO`, `RESPONSABLE_ID` opcional, `OBSERVACIONES`). Catálogo nuevo `CFG_TIPO_MOVIMIENTO` (10 valores: Entrada/Reserva/Liberación de reserva/Salida/Consumo/Merma/Devolución/Traslado/Ajuste positivo/Ajuste negativo). Regla `FUNC-MOV-001`: la cantidad de un movimiento siempre debe ser positiva (el tipo indica la dirección). Instalador `instalarEntidadMovimientoMaterial`, reutilizando `crearCatalogoNuevoL3_`.

**Límite de alcance explícito, cumplido**: `MATERIAL.STOCK_ACTUAL` no se toca — sigue editándose directamente como hasta ahora. Esta fase solo construye el mecanismo para poder registrar movimientos de forma trazable; la migración real (derivar `STOCK_ACTUAL` de estos movimientos) queda para la Fase L5 (RECURSO), tal como estaba previsto.

**Incidente durante la verificación (no relacionado con el código)**: la primera ejecución del instalador se colgó ~195s y acabó cancelada por la plataforma — coincidió con una sincronización de `clasp push` en curso en el editor de Apps Script (visible como "Finalizar actualización" en la UI). Verificado con `gsheets` que no quedó ningún resto a medio escribir (ni la hoja ni filas de catálogo) antes de reintentar. Lección operativa: no ejecutar funciones mientras el editor muestre una sincronización en curso.

**Verificado**: `instalarEntidadMovimientoMaterial` (`status=OK`, named range `CFG_TIPO_MOVIMIENTO=189:198`), `probarIntegridadAltaMovimientoMaterialDryRun` (`result=OK`, ID `MOV-0001`), `probarIntegridadMovimientoMaterialCantidadNoPositiva` (`result=OK`), y alta real en la UI (`MOV-0001`, entrada de `MAT-0005` vinculada a `TAR-0004`, `HIS-1280`, `RESULTADO=OK`).

**Alcance**: F-083 (TAREA_MATERIAL) queda con el mecanismo de movimientos disponible como registro paralelo, sin integrar todavía en el flujo de `TAREA_MATERIAL` (eso requeriría tocar su lógica de consumo, fuera de alcance de "cambios mínimos" en esta fase). Sienta la base para F-098 (pedidos/recepciones) y para la migración completa de MATERIAL en la Fase L5.

### L3.4 — Definición vs. ejecución ✅ CERRADA (2026-08-01)

**Construido**: entidad `EJECUCION_TAREA` (hoja `20_EJECUCION_TAREA`, prefijo `EJT`) — `TAREA_ID` (la definición, sin tocar `TAREA`), `RESPONSABLE_ID`, `FECHA_INICIO`/`FECHA_FIN`, `DURACION_REAL_DIAS`, `ESTADO` (reutiliza `CFG_ESTADO_RELACION`), `RESULTADO` (catálogo nuevo `CFG_RESULTADO_EJECUCION`: Exitosa/Con incidencias/Fallida). `TAREA` sigue siendo la definición reutilizable; cada ocurrencia real queda como registro propio, sin sobrescribir el histórico si la tarea se repite. Regla `FUNC-EJT-001`: `FECHA_FIN` no puede ser anterior a `FECHA_INICIO`. Instalador `instalarEntidadEjecucionTarea`.

**Verificado**: instalador (`status=OK`, named range `CFG_RESULTADO_EJECUCION=199:201`), `probarIntegridadAltaEjecucionTareaDryRun` (`result=OK`, ID `EJT-0001`), `probarIntegridadEjecucionTareaFechaFinAnteriorInicio` (`result=OK`), y alta real en la UI (`EJT-0001` sobre `TAR-0004`, `HIS-1281`, `RESULTADO=OK`).

**Alcance**: la necesidad anotada en `PROPUESTA_TAREA_ALTA.md` y F-086 quedan con el mecanismo disponible como registro paralelo — no se integró todavía con `TAREA_MATERIAL` (vincular el consumo de material a una ejecución concreta en vez de a la definición de la tarea), que sigue pendiente como trabajo futuro fuera de "cambios mínimos" de esta fase.

### L3.5 — Buscador/filtro en selectores FK ✅ CERRADA (2026-08-01)

**Construido** (`FormularioGenerico.html`, solo cliente, sin tocar datos ni esquema): los campos `fk`/`fk_dependiente` pasan de `<select>` con todas las opciones a un `<input>` de texto con `<datalist>` nativo del navegador (sin librerías externas) que filtra mientras se escribe, más un `<input type="hidden">` con el ID real — el ID se extrae del texto mostrado ("ID - nombre") sin llamada adicional al servidor. `activarDependenciasFk_`/`aplicarVisibilidad_` siguen funcionando sin cambios porque el oculto conserva el mismo `id` que antes tenía el `<select>` y dispara `change`.

**Bug corregido de paso**: `tipo: 'textarea'` nunca estaba implementado en `renderCampo` — caía al mismo `<input>` de una línea que `tipo: 'texto'`. Los campos añadidos como `textarea` en L1.3 (`CRITERIOS_ACEPTACION`, `DEFINITION_OF_DONE`, y los ya existentes de DECISION) no tenían ningún efecto visual real hasta esta fase.

**Verificado en la UI real** (mayor radio de impacto que cualquier fase anterior — afecta a todos los formularios a la vez, por eso se pidió una verificación más amplia de lo habitual): alta real con FK simple (`TAR-0005`, buscador de Proceso filtrando, `HIS-1282`), alta real con FK dependiente (`DOC-0003`, Tipo de entidad→Registro, `HIS-1283`), edición de un registro existente con el buscador precargado correctamente con "ID - nombre" (no vacío), y confirmación visual de que los `textarea` ahora son cajas de varias líneas.

**Hallazgo nuevo, fuera del alcance original de esta fase (no resuelto aquí)**: el flujo **"Editar registro"** del menú (`abrirEditarRegistroPorEntidad_`) sigue usando un `ui.prompt()` nativo que exige escribir el ID exacto a ciegas, sin buscador — mismo problema de fondo (F-021/F-050/F-062 eran sobre desplegables *dentro* de un formulario, este es sobre el *punto de entrada* antes de abrir el formulario). El usuario decidió explícitamente registrarlo y no abordarlo en esta fase; queda pendiente para una ronda futura, candidato natural a reutilizar el mismo patrón de `<datalist>`.

### L3.6 — Avance derivado vs. manual ✅ CERRADA (2026-08-01)

**Construido**: campo `METODO_CALCULO_AVANCE` (catálogo nuevo `CFG_METODO_CALCULO_AVANCE`: Manual/Por tareas/Por estado) en `PROCESO` y `TAREA` — descriptivo, sin recálculo automático (mismo criterio de toda la fase). `FUNC-PROCESO-004`: coherencia avance↔estado en PROCESO (Completado≠100 ERROR; Pendiente/Preparado con avance>0 ADVERTENCIA) — no existía ninguna regla de este tipo para PROCESO. `FUNC-PROCESO-005`: si `METODO_CALCULO_AVANCE=Por tareas`, avisa si el avance difiere >15 puntos del promedio de sus tareas. `FUNC-TAREA-014`: Pendiente/Preparada con avance>0.

**Verificación previa que evitó un 4º falso hallazgo**: antes de escribir `FUNC-TAREA-014` confirmé que `FUNC-TAREA-001` ya cubre "Terminada con avance≠100" (ERROR) — no se duplicó, la nueva regla cubre solo el caso que faltaba.

**Hueco de cobertura reconocido, no oculto**: `FUNC-PROCESO-005` no tiene prueba reactiva dedicada (requeriría un escenario controlado con tareas hijas reales); queda pendiente.

Instalador `instalarMetodoCalculoAvance`, reutilizando `crearCatalogoNuevoL3_` y `agregarColumnasSiFaltan_`.

**Verificado**: instalador (`status=OK`, named range `CFG_METODO_CALCULO_AVANCE=202:204`), `probarIntegridadMetodoCalculoAvanceDryRun` (`result=OK` para PROCESO y TAREA), `probarIntegridadProcesoAvanceIncoherenteConEstado` (`result=OK`), `probarIntegridadTareaAvanceIncoherenteConEstado` (`result=OK`), y alta real en la UI (`PCS-0003` con `METODO_CALCULO_AVANCE=Por tareas`, `HIS-1284`, `RESULTADO=OK`).

**Estimación real: 1 sesión** para los 6 submódulos combinados (L3.1-L3.6), más rápido que la estimación original de 4-6 sesiones — el patrón de trabajo (esquema→código→instalador→pruebas→push→verificación real→commit) ya estaba consolidado desde la Fase L1.

---

## Fase L3 — CERRADA POR COMPLETO (2026-08-01)

Los 6 submódulos (L3.1 VINCULO, L3.2 MODO_USO, L3.3 MOVIMIENTO_MATERIAL, L3.4 EJECUCION_TAREA, L3.5 buscador FK, L3.6 avance derivado) verificados end-to-end contra el sistema real. 4 entidades nuevas, 4 catálogos nuevos, 6 reglas de integridad nuevas, 1 bug de renderizado corregido (`textarea`), 1 corrección de categorización (F-049 no encajaba), 1 hallazgo nuevo registrado para el futuro (buscador en "Editar registro").

### Pendiente detectado durante L3.5 — CERRADO al verificar L5.1 (ver más abajo, "Arreglos transversales")
El flujo **"Editar registro"** seguía pidiendo el ID exacto mediante un `ui.prompt()` nativo, sin buscador. Corregido con `SelectorRegistro.html`.

---

## Fase L4 — Funcionalidades específicas de alto valor — CERRADA POR COMPLETO (2026-08-01)
Se apoyan en los mecanismos de L1/L3 ya construidos:

- **F-063 (crítica) — CERRADA (2026-08-01)** — `INCIDENCIA_TAREA` + vínculo "Corrige". Opción A (recomendada, ampliar catálogo): en vez de un mecanismo nuevo, se amplió `CFG_TIPO_VINCULO` (DETECTADA_EN, CAUSADA_POR, CORRIGE, VERIFICA, PREVIENE) reutilizando VINCULO (L3.1), que ya soporta genéricamente INCIDENCIA→TAREA. Instalador `instalarTipoVinculoIncidencia`, test `probarIntegridadCatalogoTipoVinculoIncidenciaAmpliado` (OK, 15 valores), verificado en real con VIN-0002 (Proceso→Incidencia, Corrige, HIS-1285).
- **F-015 — CERRADA (2026-08-01)** — "Guardar y vincular" compuesto (PRODUCTO+PROYECTO_PRODUCTO). Tras crear un PRODUCTO nuevo, el mismo diálogo ofrece vincularlo ya a un proyecto sin cerrarse, reutilizando el formulario genérico de PROYECTO_PRODUCTO y compartiendo el mismo `CORRELATION_ID` de historial entre ambas escrituras (`guardarFormulario` ahora acepta un `correlationId` opcional). Verificado en real: PRD-0003+PPR-0003 (flujo "Vincular", mismo `CORRELATION_ID` en HIS-1287/HIS-1288) y PRD-0004 (flujo "Omitir", sin vínculo).
- **F-093 — CERRADA (2026-08-01)** — `PROVEEDOR_MATERIAL` N:M, alcance mínimo confirmado (igual que PRODUCTO_MATERIAL/TAREA_MATERIAL): `PROVEEDOR_ID`, `MATERIAL_ID`, `PRECIO_UNITARIO`, `PLAZO_ENTREGA_DIAS`, `ES_PREFERENTE`, `ESTADO`, `OBSERVACIONES`. Sin las tarifas versionadas/moneda/homologación/vigencias de la propuesta completa (`PROPUESTA_PROVEEDOR_ALTA.md`), que quedan cubiertas por sus propias fricciones ya numeradas (F-092, F-094, F-096, F-097, F-098). Nueva hoja `21_PROVEEDOR_MATERIAL` (prefijo `PRM`), reutiliza `CFG_ESTADO_RELACION`. Verificado en real: instalador OK, dryRun OK (PRM-0001), alta real PRM-0001 (PRV-0005/MAT-0004, HIS-1291) y rechazo correcto del duplicado PROVEEDOR_ID+MATERIAL_ID.

### Puntos 1 y 2 — CERRADOS (2026-08-01), fuera del backlog original
Surgidos de una pregunta estratégica tras F-063: cómo automatizar orden de secuencia, predecesor y % de avance al crear la jerarquía de un proyecto. Se acordó construir ahora los puntos 1 y 2 y dejar el punto 3 (importación masiva de jerarquía completa) para la futura Fase L5.3, junto con la expansión del modelo de "personas/equipo" (pendiente de definir antes de esa fase).

- **Punto 1 — "Recalcular avance de proceso"** (`AvanceYSecuencia.js`): acción de menú (Administración), disparada por un humano, no automática en el camino de escritura. Promedia `PORCENTAJE_AVANCE` de las TAREA activas no canceladas del proceso y solo escribe tras confirmación explícita. Verificado en real: PCS-0001 → 13%. Corregido en el camino un bug real: el `origen` pasado a `registrarHistorial` (`'MENU_RECALCULAR_AVANCE'`) no estaba en `ORIGENES_HISTORIAL_VALIDOS`; corregido a `'ADMIN'`.
- **Punto 2 — Sugerencia de `ORDEN_SECUENCIA` y predecesor** al crear PROCESO/TAREA (`obtenerSugerenciaSecuencia` + `activarSugerenciasSecuencia_` en `FormularioGenerico.html`): precarga solo si el campo está vacío, nunca pisa un valor ya escrito. Alcance de agrupación confirmado: si el PROCESO tiene `PROYECTO_PRODUCTO_ID`, la secuencia se calcula solo entre los procesos de ese mismo contexto de proyecto, no entre todos los del producto maestro. **Verificación end-to-end aplazada**: al probarlo con PCS-0004 no quedó claro si el autorrelleno propuso el valor esperado (se registró orden=4 en vez del 2 esperado por el contexto PPR-0001, pero la prueba mezcló tecleo manual con el autorrelleno); pendiente de revisar con más cuidado en el repaso general de UX previo a L6, junto con la falta de visibilidad de "cuántas tareas tiene un proceso" / "cuántos productos tiene un proyecto" detectada en la misma prueba.

### Sugerencia automática de CÓDIGO — CERRADA (2026-08-01), fuera del backlog original
Surgida al probar F-015: evitar tener que inventar y teclear a mano el `CODIGO` de PRODUCTO/MATERIAL/PROVEEDOR, normalizándolo. `GeneracionCodigo.js` (`obtenerSugerenciaCodigo` + `activarSugerenciasCodigo_` en `FormularioGenerico.html`), mismo patrón que la sugerencia de orden/predecesor: precarga el campo (sigue siendo texto libre y editable) solo si está vacío.

- **PRODUCTO**: `{3 letras ORIGEN}-{4 letras NOMBRE}-{inicial PRIORIDAD}-{correlativo}`.
- **MATERIAL**: `{3 letras CATEGORIA}-{4 letras NOMBRE}-{correlativo}`.
- **PROVEEDOR**: `{4 letras NOMBRE}-{correlativo}`.
- Las siglas de NOMBRE ignoran la palabra genérica que repite el nombre de la entidad (ej. "PRODUCTO" en "PRODUCTO_PRUEBA"). Las siglas de un valor de catálogo (ORIGEN/CATEGORIA/PRIORIDAD) se toman de su **última palabra**, no de las primeras letras del texto completo — corrige una colisión real detectada en pruebas: "Pedido interno"/"Pedido externo" daban ambos "PED" con las 3 primeras letras; con la última palabra dan "INT"/"EXT".
- Correlativo global por entidad (mayor sufijo numérico ya usado en `CODIGO` de esa entidad, +1).
- Verificado en real: PRD-0003 (`PED-CALE-A-002`, antes del fix) y PRD-0005 (`EXT-CALE-B-002`, Pedido externo, tras el fix).
- Nota del usuario tras la verificación: mejoras generales de UX/UI de los diálogos, sin alcance definido aún — se suma al repaso general de UX ya anotado más arriba (previo a L6).

**Fase L4 cerrada por completo.** Siguiente: Fase L5 (bloques estructurales grandes, uno a la vez).

---

### Expansión mínima de personas/equipos (F-046, F-049) — CERRADA (2026-08-01), prerrequisito de L5.3
Antes de L5, se valoró una propuesta externa de jerarquía PERSONA→EQUIPO→GRUPO→RED. Se descartaron GRUPO/RED por ahora: ese principio (persona atómica, pertenencias como relaciones) ya está construido dos veces en el sistema (`ASIGNACION` polimórfico y `VINCULO` genérico), y ninguna fricción real (solo F-046/F-049, no F-052+) pide esos niveles — si algún día hace falta coordinar equipos o federar con entidades externas, `VINCULO` ya lo soporta sin tablas nuevas. Se confirmó explícitamente que esto no bloquea la carga masiva futura (L5.3): añadir GRUPO/RED después sería aditivo vía `VINCULO`, sin migrar los datos ya importados.

Construido:
- `PERSONA_EQUIPO.ROL` pasa de texto libre a catálogo `CFG_ROL_PERSONA` (7 valores + Otra); se añaden `EMAIL`, `TELEFONO`, `COORDINADOR_ID` (fk a sí misma).
- `CFG_ROL_ASIGNACION` ampliado con matices RACI rescatados de la propuesta externa (Ejecutor, Consultado, Informado, Coordinador, Validador), reutilizando `ASIGNACION` tal cual.
- Nueva entidad `EQUIPO_MIEMBRO` (`22_EQUIPO_MIEMBRO`, prefijo `EQM`): desglose de equipo (F-049) sin tocar `ASIGNACION`/`TAREA_RESPONSABLE`.
- F-046 (selector no distinguía persona/equipo): la etiqueta de cualquier FK a `PERSONA_EQUIPO` ahora incluye el `TIPO`, ej. `"PER-0003 - Equipo de carpintería (Equipo)"`.

Verificado en real: instalador OK, catálogos OK (7/9 valores), dryRun OK, alta real `PER-0003` (Equipo/Producción) + `EQM-0001` (PER-0003/PER-0001), etiqueta `(Equipo)`/`(Persona)` confirmada visualmente.

Pendiente para una próxima iteración (nota del usuario): `ROL_EN_EQUIPO` debería normalizarse como catálogo — los equipos se configurarán según los roles necesarios para cumplir los objetivos de cada proyecto.

No construido ahora (documentado para cuando una fricción real lo demande): `GRUPO`, `RED`, `COMPETENCIA`/`PERSONA_COMPETENCIA`, `PERSONA_DISPONIBILIDAD`, `PERSONA_PREFERENCIA`, `PERSONA_RESTRICCION` (esta última, si se aborda, requiere definir antes control de acceso y base legal — probablemente datos de categoría especial bajo RGPD en un contexto ocupacional).

---

## Fase L5 — Bloques estructurales grandes (uno a la vez)
Cada uno es del tamaño de una fase completa del roadmap original — no se abre el siguiente sin cerrar el anterior:

### L5.1 — Abstracción RECURSO — CERRADA (2026-08-01), alcance mínimo (R1+parte de R2)
Antes de construir se contrastó `PROPUESTA_RECURSO_MATERIAL.md` con la realidad: `MOVIMIENTO_MATERIAL` (L3.3) ya es el mismo concepto que `RECURSO_MOVIMIENTO` (R3), y `PROVEEDOR_MATERIAL` (F-093) ya resuelve el "proveedor único" que motivaba parte de R3 — ambos sin saber que apuntaban aquí. Se pidió evidencia real antes de construir (mismo criterio que con GRUPO/RED): el usuario confirmó inventario real de herramientas manuales/eléctricas, maquinaria fija, equipos auxiliares y espacios del taller.

Construido: entidad `RECURSO` (`23_RECURSO`) — `CLASE_RECURSO` (catálogo nuevo `CFG_CLASE_RECURSO`: Herramienta/Maquinaria/Equipo_auxiliar/Espacio; "Equipo auxiliar" en vez de "Equipo" para no confundirse con `PERSONA_EQUIPO.TIPO=Equipo`), `CATEGORIA_RECURSO` (catálogo abierto, 11 valores), `UBICACION_ID` (fk a sí misma con `CLASE_RECURSO=Espacio`, sin tabla de ubicaciones aparte), `RESPONSABLE_ID`, `ESTADO` (catálogo nuevo `CFG_ESTADO_RECURSO_FISICO`, distinto de `CFG_ESTADO_RECURSO` que ya usa `PERSONA_EQUIPO`). Entidad `TAREA_RECURSO` (`24_TAREA_RECURSO`) con `TIPO_USO` (catálogo nuevo `CFG_TIPO_USO_RECURSO`). Sugerencia automática de `CODIGO` (mismo patrón que Producto/Material/Proveedor). `RECURSO` añadido como tipo de entidad válido para "Vínculo genérico" y `DOCUMENTO` (permite enlazar manuales/fichas técnicas reutilizando `VINCULO`, sin tabla nueva). `UBICACION_ID` filtra sus opciones a solo Espacios (nuevo mecanismo genérico `filtroValores` en `obtenerEsquemaFormulario`, reutilizable por cualquier FK futuro).

Verificado en real: instalador OK, 4 catálogos OK, dryRun OK, `REC-0001` (Zona de maquinaria, Espacio), `REC-0002` (Sierra de mesa, Maquinaria), `REC-0003` (Taladro, código auto-sugerido `HER-TALA-002`), `TRC-0001` (TAR-0001 utiliza Sierra de mesa).

**No construido** (documentado para cuando una fricción real lo demande): `RECURSO_INVENTARIO`/`RECURSO_ACTIVO`/`RECURSO_ESPACIO` (subtipos con campos de mantenimiento/aforo, resto de R2), migración de `MATERIAL` a `RECURSO` (R3), planificación de capacidad/reservas/solapamientos (R4).

**Efecto colateral importante descubierto durante la verificación** (documentado abajo como arreglo transversal): bug real de validación de claves foráneas que afectaba a todo el sistema, y hueco de UX de L3.5 en "Editar registro" señalado de nuevo por el usuario.

### L5.2 — Pedidos y recepciones de proveedor — CERRADA (2026-08-01), alcance mínimo
Construido con datos simulados (mismo criterio que RECURSO, sin esperar a un pedido real en producción). Alcance confirmado: solo `PEDIDO_PROVEEDOR`(+líneas) y `RECEPCION`(+líneas); sin `SOLICITUD_COMPRA` ni `DEVOLUCION_PROVEEDOR` todavía.

- `PEDIDO_PROVEEDOR` (25) + `PEDIDO_PROVEEDOR_LINEA` (26), `RECEPCION` (27) + `RECEPCION_LINEA` (28). Catálogos nuevos `CFG_ESTADO_PEDIDO_PROVEEDOR`, `CFG_ESTADO_RECEPCION`.
- `confirmarRecepcion_` (`PedidoRecepcion.js`): acción de menú humana (mismo patrón que "Recalcular avance de proceso"), vista previa + confirmación explícita, genera un `MOVIMIENTO_MATERIAL` tipo Entrada por línea (reutiliza L3.3, no escribe `STOCK_ACTUAL` directamente). Protegida contra doble confirmación.
- **Bug real corregido durante la verificación**: confirmar una recepción no actualizaba `PEDIDO_PROVEEDOR.ESTADO`, así que un pedido ya recibido por completo seguía ofreciéndose como pendiente en "Nueva recepción"/"Nueva línea de pedido". `actualizarEstadoPedidoTrasRecepcion_` recalcula el estado del pedido (Recibido parcial/completo) comparando pedido vs. recibido por material; ambos selectores FK a `PEDIDO_PROVEEDOR` ahora excluyen `Recibido completo`/`Cancelado`. `corregirEstadoPedidosExistentes()` hizo el backfill de los pedidos dados de alta antes del fix.
- `SelectorRegistro.html` (nacido en el fix de "Editar registro") generalizado a cualquier flujo "elige un registro y luego haz X" vía `abrirSelectorConAccion_`; "Confirmar recepción de pedido" lo reutiliza en vez de un `ui.prompt()`, filtrando a solo recepciones pendientes.

Verificado en real: instalador OK, catálogos OK, dryRun OK, `PED-0001`+`PPL-0001`+`RCP-0001` confirmada → generó `MOV-0002` (Entrada, 10 Unidad, MAT-0002); backfill corrigió `PED-0001` a "Recibido completo"; selectores ya no ofrecen pedidos cerrados; segunda recepción de prueba (`RCP-0003`, Pedido `PED-0002`) confirmó que el buscador de "Confirmar recepción" funciona.

### L5.3 — Importación masiva de campaña completa
Árbol `CAMPANA→PROYECTO→PRODUCTO→PROCESO→TAREA` de una vez, con plantilla+staging+dryRun+aprobación humana. Ya priorizado antes de la prueba operativa; ahora con más certeza de qué campos hacen falta en cada nivel gracias a las Fases L1-L4.

**Estimación restante: 3-4 sesiones (L5.3).**

---

### Arreglos transversales detectados verificando L5.1 — CERRADOS (2026-08-01)

- **Bug real de integridad (todo el sistema)**: el buscador de FK (L3.5) extrae el ID del texto escrito sin comprobar que exista de verdad. Escribir texto y guardar sin elegir ninguna opción del desplegable guardaba ese texto tal cual como si fuera un ID válido — ocurrió en real con `VIN-0003` (`ENTIDAD_DESTINO_ID="D"`). `validarClavesForaneasFormulario_` (nueva, en `guardarFormulario`) rechaza cualquier valor de campo fk/fk_dependiente que no corresponda a un registro real, reutilizando el mismo resolver que ya usa el cliente para poblar las opciones. Al editar, no revalida los campos FK que no cambiaron (evita bloquear la edición de registros antiguos por referencias que se desactivaron después, ajenas a la edición actual). De paso, corregido que `'Documento'` faltaba en `ENTIDAD_DOCUMENTO_A_MVP` desde L3.1 (dejaba vacío el buscador de "Registro origen/destino" en cualquier `VINCULO` donde un lado fuera "Documento"). Verificado: rechazo de ID inventado, edición sin cambios de FK no se rompe, corrección real de `VIN-0003` → `DOC-0003`.
- **Hueco de UX de L3.5, señalado de nuevo por el usuario**: "Editar registro" seguía pidiendo el ID exacto con un `ui.prompt()` nativo sin buscador, para las 21 entidades que comparten `abrirEditarRegistroPorEntidad_`. Sustituido por `SelectorRegistro.html`, mismo patrón de `<datalist>` que el resto de la app. Corrige de una vez las 21 entidades. Verificado en real: "Editar Campaña" muestra el buscador con campañas reales.

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
