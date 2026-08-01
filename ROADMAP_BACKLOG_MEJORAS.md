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

### L3.6 — Avance derivado vs. manual
`METODO_CALCULO_AVANCE` en PROCESO y TAREA.
Resuelve: F-029, F-039.

**Estimación: 4-6 sesiones (uno por submódulo).**

### Pendiente nuevo detectado durante L3.5 (sin número F-, fuera del backlog original)
El flujo **"Editar registro"** del menú (`abrirEditarRegistroPorEntidad_`, usado por todas las entidades) sigue pidiendo el ID exacto mediante un `ui.prompt()` nativo, sin buscador — mismo problema de fondo que F-021/F-050/F-062, pero en el punto de entrada antes de abrir el formulario, no en un desplegable dentro de él. Detectado al verificar L3.5, registrado explícitamente para no abordarlo en esa fase. Candidato natural: reutilizar el mismo patrón de `<datalist>` ya construido, mostrando una lista buscable de registros activos antes de abrir el formulario de edición.

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
