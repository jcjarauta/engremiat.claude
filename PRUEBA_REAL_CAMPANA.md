# Prueba operativa real — Campaña "Desarrollo y mejora del sistema LaTroballa"

**Inicio:** 2026-07-31
**Cierre:** 2026-07-31
**Estado:** CERRADA — cobertura completa de dominios alcanzada, backlog consolidado en `BACKLOG_CONSOLIDADO.md`
**Sin fecha límite fija** — el ritmo lo marcó la propia campaña.

## 1. Objetivo

Ejecutar una campaña real y completa en el sistema tal cual está hoy (sin datos sintéticos, sin escenarios artificiales), gestionando el propio desarrollo de LaTroballa a través de su propio modelo funcional: `CAMPAÑA → PROYECTO → PRODUCTO/ENTREGABLE → PROCESO → TAREA → DOCUMENTO/DECISIÓN/INCIDENCIA/EVIDENCIA`.

Esta prueba es el paso 0, previo a cualquier desarrollo nuevo (Fase K, import de campaña completa, espacio de simulación, motor por eventos, etc.). El backlog priorizado que salga de aquí — no la lista de posibilidades ya documentada — decide qué se aborda primero.

**Nota de sesgo a vigilar**: al ser una campaña meta (gestionar el desarrollo del propio sistema, no producción física del taller), puede no ejercitar todo lo que ejercitaría una campaña real de taller (materiales, stock, maquinaria, personas atendidas). Si al cerrar se detecta que faltan áreas sin probar por este motivo, anotarlo en la sección 5 como riesgo residual, no como fricción del sistema.

## 2. Alcance previsto (orientativo, no cerrado)

Proyectos candidatos dentro de la campaña, a crear conforme se necesiten — no todos de golpe:

- Cierre de auditoría
- Importación masiva
- Espacio de simulación
- Motor por eventos
- Sistema de recomendaciones
- Gestión documental de tareas
- Manuales y tutoriales
- Gamificación
- Integración con Ollama
- Integración con n8n
- Mejora de paneles e informes
- Pruebas de integridad
- Automatización con Codex
- Mantenimiento y evolución del sistema
- (nuevos proyectos que surjan durante el desarrollo)

## 3. Registro de fricciones

Una entrada por fricción, en el momento en que aparece — no de memoria al cierre. Formato mínimo:

```
### F-001 — [título corto]
Fecha:
Entidad afectada:      (CAMPANA / PROYECTO / PRODUCTO / PROCESO / TAREA / DOCUMENTO / DECISION / INCIDENCIA / UI / otro)
Proceso/tarea concreta:
Usuario:
Tipo:                  (error / bloqueo / incoherencia / paso confuso / campo innecesario / campo ausente /
                        navegación / tarea repetitiva / falta automatización / trazabilidad / localización de
                        información / tiempo excesivo / decisión no soportada / oportunidad de simplificación /
                        nueva necesidad)
Impacto:
Frecuencia:
Evidencia:             (captura, log, ID de registro)
Causa probable:
Solución propuesta:
Prioridad:             (alta / media / baja)
```

### F-001 — Fecha final artificial en CAMPANA
Fecha: 2026-07-31
Entidad afectada: CAMPANA (CAM-0010)
Proceso/tarea concreta: alta de campaña
Usuario: sacandofilo@gmail.com
Tipo: incoherencia / campo ausente
Impacto: `FECHA_FIN_PLAN` es obligatoria incluso en campañas continuas o por objetivos; se puso `31/12/2026` como horizonte ficticio.
Frecuencia: cada campaña continua
Evidencia: fila real CAM-0010, `OBSERVACIONES` explica el uso forzado del campo
Causa probable: el modelo solo contempla `TIPO_PLANIFICACION` implícito = fechas cerradas
Solución propuesta: añadir `TIPO_PLANIFICACION` (FECHAS_CERRADAS/CONTINUA/POR_OBJETIVOS/POR_HITOS/RECURRENTE) + `FECHA_REVISION`
Prioridad: alta

### F-002 — Falta de responsable de referencia en CAMPANA
Fecha: 2026-07-31
Entidad afectada: CAMPANA
Tipo: campo ausente
Impacto: no queda identificada la persona/equipo responsable de coordinar la campaña
Causa probable: formulario de alta no contempla responsable
Solución propuesta: `RESPONSABLE_PRINCIPAL_ID` en el alta simple; relación N:M `CAMPANA_RESPONSABLE` (rol, dedicación, fechas) para el caso ampliado — **diseñar junto con el mismo problema ya identificado en tarea↔persona/equipo (Fase D), no como tablas separadas**
Prioridad: alta

### F-003 — Planificación temporal rígida
Fecha: 2026-07-31
Entidad afectada: CAMPANA
Tipo: incoherencia funcional
Impacto: el modelo solo representa campañas con inicio y fin cerrados
Solución propuesta: soportar `TIPO_PLANIFICACION` continua/por objetivos/por hitos/recurrente
Prioridad: alta

### F-004 — Falta de calendario operativo
Fecha: 2026-07-31
Entidad afectada: CAMPANA / UI
Tipo: falta de automatización
Impacto: las fechas no generan recordatorios ni vista temporal
Solución propuesta: sincronización unidireccional LaTroballa → Google Calendar (fuera del primer bloque)
Prioridad: media

### F-005 — Falta de objetivos y criterios de cierre
Fecha: 2026-07-31
Entidad afectada: CAMPANA
Tipo: campo ausente / decisión no soportada
Impacto: no puede determinarse objetivamente cuándo una campaña continua ha cumplido su finalidad
Evidencia: `DESCRIPCION` de CAM-0010 hace de objetivo por falta de campo dedicado
Solución propuesta: `OBJETIVO_GENERAL`, `RESULTADOS_ESPERADOS`, `CRITERIOS_EXITO`, `CRITERIO_CIERRE`
Prioridad: alta

### F-006 — Única vía de entrada manual
Fecha: 2026-07-31
Entidad afectada: CAMPANA / UI
Tipo: falta de automatización / tarea repetitiva
Impacto: campañas complejas (árbol completo) deben introducirse entidad por entidad
Solución propuesta: plantilla + staging + dryRun + importación masiva de campaña completa (coincide con Fase K ya priorizada)
Prioridad: alta

### F-007 — Formulario insuficiente para campañas complejas
Fecha: 2026-07-31
Entidad afectada: CAMPANA / UI
Tipo: usabilidad / campo ausente
Impacto: no hay borrador, resumen, validación contextual ni continuidad hacia el primer proyecto
Solución propuesta: rediseño por bloques + guardar borrador + guardar y crear proyecto
Prioridad: media

### F-008 — TIPO_PROYECTO mezcla tipo, prioridad y madurez
Fecha: 2026-07-31
Entidad afectada: PROYECTO (PRO-0003) / UI
Tipo: incoherencia funcional
Impacto: `Urgente`/`Importante` expresan prioridad; `Propuesta` expresa madurez — no describen la naturaleza del proyecto
Solución propuesta: separar `TIPO_PROYECTO`, `PRIORIDAD`, `MADUREZ_PROYECTO` y `CUADRANTE` opcional
Prioridad: alta — candidato limpio de bajo riesgo (no requiere entidad nueva)

### F-009 — Proyecto sin estructura de responsables y equipos
Fecha: 2026-07-31
Entidad afectada: PROYECTO
Tipo: campo ausente
Impacto: no permite representar responsable principal, equipo propietario, colaboradores ni relaciones entre equipos
Solución propuesta: `RESPONSABLE_PRINCIPAL_ID` + relación N:M `PROYECTO_PARTICIPANTE`/`PROYECTO_EQUIPO` — **tercera aparición confirmada del mismo patrón que CAMPANA_RESPONSABLE y tarea↔persona/equipo; diseñar una única relación polimórfica reutilizable, no tres tablas paralelas**
Prioridad: alta

### F-010 — Planificación temporal rígida (PROYECTO)
Fecha: 2026-07-31
Entidad afectada: PROYECTO
Tipo: incoherencia funcional
Impacto: obliga a fechas cerradas incluso en proyectos iterativos/continuos/por objetivos
Solución propuesta: mismo `TIPO_PLANIFICACION` que CAMPANA + iteraciones para proyectos de desarrollo
Prioridad: alta

### F-011 — Falta de entregables y criterios de aceptación
Fecha: 2026-07-31
Entidad afectada: PROYECTO
Tipo: campo ausente
Impacto: no permite comprobar qué debe producirse ni cuándo se considera aceptado
Solución propuesta: `PROYECTO_ENTREGABLE` con criterio de aceptación
Prioridad: alta

### F-012 — Falta de contexto de viabilidad y recursos
Fecha: 2026-07-31
Entidad afectada: PROYECTO
Tipo: decisión no soportada
Impacto: no se puede valorar capacidad, esfuerzo, presupuesto, riesgo ni viabilidad antes de iniciar
Solución propuesta: estimaciones básicas + viabilidad técnica/operativa/económica/temporal
Prioridad: media — el más especulativo del lote, no forzar a alta

### F-013 — Falta de dependencias entre proyectos
Fecha: 2026-07-31
Entidad afectada: PROYECTO
Tipo: campo ausente / trazabilidad
Impacto: no puede saberse qué proyecto bloquea, depende o comparte recursos con otro
Solución propuesta: `PROYECTO_RELACION` (DEPENDE_DE/BLOQUEA/DUPLICA/COMPLEMENTA/SUSTITUYE/COMPARTE_RECURSOS) — pieza base para el futuro simulador/motor por eventos
Prioridad: alta

### F-014 — Código de producto sin contrato de normalización
Fecha: 2026-07-31
Entidad afectada: PRODUCTO
Tipo: incoherencia / calidad de datos
Impacto: códigos con convenciones distintas pierden utilidad para búsqueda, integración y automatización
Solución propuesta: generación contextual `<TIPO>-<AREA>-<SECUENCIA>`, normalización automática, unicidad e inmutabilidad — verificar contra `Ids.js` antes de diseñar más
Prioridad: alta

### F-015 — Alta sin vinculación contextual al proyecto
Fecha: 2026-07-31
Entidad afectada: PRODUCTO / PROYECTO_PRODUCTO / UI
Tipo: tarea repetitiva / trazabilidad
Impacto: crear producto y relación exige dos operaciones separadas, permite productos sin vínculo funcional
Solución propuesta: operación compuesta "Guardar y vincular" con mismo `CORRELATION_ID` y reversión conjunta — reutiliza patrón ya existente en HistorialService/Reversion.js
Prioridad: alta

### F-016 — Modelo orientado principalmente a producto físico
Fecha: 2026-07-31
Entidad afectada: PRODUCTO
Tipo: incoherencia funcional
Impacto: `UNIDAD`/`CANTIDAD_PREVISTA` obligatorias incluso para software, documentos y servicios
Solución propuesta: `TIPO_PRODUCTO` + campos condicionales por tipo
Prioridad: alta

### F-017 — Criterios de aceptación no estructurados
Fecha: 2026-07-31
Entidad afectada: PRODUCTO
Tipo: campo ausente
Impacto: no existe comprobación objetiva de que el entregable esté terminado y aceptado
Solución propuesta: criterios, Definition of Done, validador y resultado
Prioridad: alta

### F-018 — Versionado técnico insuficiente
Fecha: 2026-07-31
Entidad afectada: PRODUCTO
Tipo: trazabilidad
Impacto: la versión libre no enlaza baseline, repositorio, commit ni estado de publicación
Solución propuesta: versionado ampliado — solo aplica a TIPO_PRODUCTO=DIGITAL
Prioridad: media — el más especulativo del lote

### F-021 — Desplegables no escalables
Fecha: 2026-07-31
Entidad afectada: PROYECTO_PRODUCTO / UI
Tipo: navegación / localización de información
Impacto: con muchos proyectos o productos no hay búsqueda ni filtrado suficiente en el `<select>`
Solución propuesta: autocompletado, búsqueda por ID/código/nombre, filtros de estado
Prioridad: alta

### F-022 — No se distingue reutilización, adaptación o clonación
Fecha: 2026-07-31
Entidad afectada: PROYECTO_PRODUCTO
Tipo: campo ausente / trazabilidad
Impacto: no puede saberse si el proyecto usa el producto común, una variante o una copia independiente
Solución propuesta: `MODO_USO` + versión contextual — **patrón nuevo, específico de relaciones N:M de recurso compartido; candidato a reaparecer en PRODUCTO_MATERIAL/TAREA_MATERIAL**
Prioridad: alta

### F-023 — Estado técnico y estado operativo mezclados — **INVALIDADO tras verificar la hoja real**
Fecha: 2026-07-31 (invalidado 2026-07-31)
Entidad afectada: PROYECTO_PRODUCTO
Tipo: incoherencia funcional (descartada)
Impacto original (incorrecto): se creyó que `ESTADO` era el único campo, sin `ACTIVO` separado
Corrección: verificado contra la hoja real `04_PROYECTO_PRODUCTO` (vía gsheets, no solo `Repository.js`) — **sí existe `ACTIVO` separado de `ESTADO`** (`ACTIVO="SÍ"`, `ESTADO="Activa"` en PPR-0001 y PPR-0002). `Repository.js` solo enumera campos de negocio editables, no las columnas de sistema (`FECHA_REQUERIDA`, `FECHA_CREACION`, `CREADO_POR`, `FECHA_MODIFICACION`, `MODIFICADO_POR`, `ACTIVO`, `OBSERVACIONES`), lo que llevó a una confirmación previa incorrecta basada en datos parciales
Lección: verificar contra la hoja real (o el generador de columnas de sistema), no solo contra el array de campos de negocio de `Repository.js`, antes de dar una fricción de esquema por confirmada
Prioridad: cerrado, sin acción

### F-024 — Falta de validación contextual
Fecha: 2026-07-31
Entidad afectada: PROYECTO_PRODUCTO
Tipo: campo ausente
Impacto: no se registran responsable, fechas, versión ni criterios de aceptación específicos del proyecto
Solución propuesta: ampliar la relación con contexto de entrega y validación
Prioridad: alta

### F-025 — Posible ID no normalizado en historial — **DESCARTADO tras verificar la celda real**
Fecha: 2026-07-31 (descartado 2026-07-31)
Entidad afectada: PROYECTO_PRODUCTO / HISTORIAL
Tipo: calidad de datos (descartada)
Impacto original (sospechado): JSON de historial mostraba `"PRODUCTO_ID":"PRD- 0002"` (posible espacio)
Corrección: verificado contra la hoja real `04_PROYECTO_PRODUCTO` vía `gsheets` — valor exacto `"PRD-0002"`, sin espacio. Confirmado artefacto del texto pegado en el chat, como se sospechaba
Prioridad: cerrado, sin acción

### F-026 — Proceso relacionado solo con el producto maestro
Fecha: 2026-07-31 (diseño previo a crear PCS-0002)
Entidad afectada: PROCESO / PROYECTO_PRODUCTO
Tipo: trazabilidad / incoherencia contextual
Impacto: un producto reutilizado puede tener procesos distintos según el proyecto, pero el alta de PROCESO solo permite seleccionar PRODUCTO, no `PROYECTO_PRODUCTO` — **extiende hacia PROCESO el mismo patrón de ambigüedad de reutilización visto en F-022**
Solución propuesta: vincular a `PROYECTO_PRODUCTO_ID` (no solo `PRODUCTO_ID`) + `TIPO_CONTEXTO` (MAESTRO_REUTILIZABLE/ESPECIFICO_PROYECTO/ADAPTACION); para PCS-0002 debería quedar relacionado con PPR-0002, sin eliminar la referencia a PRD-0002
Prioridad: alta

### F-027 — Duración sin esfuerzo
Fecha: 2026-07-31
Entidad afectada: PROCESO
Tipo: campo ausente
Impacto: no puede distinguirse tiempo calendario de carga efectiva de trabajo (ej. 5 días de duración vs 8h de esfuerzo real)
Solución propuesta: `DURACION_PREVISTA_DIAS` / `ESFUERZO_PREVISTO_HORAS` / `ESFUERZO_REAL_HORAS` — complementa F-031 (TIPO_DURACION), no lo duplica
Prioridad: alta

### F-028 — Dependencia limitada a un único predecesor
Fecha: 2026-07-31
Entidad afectada: PROCESO
Tipo: limitación funcional
Impacto: no permite redes de dependencias ni varios procesos bloqueantes
Solución propuesta: `PROCESO_DEPENDENCIA` N:M (FIN_A_INICIO/INICIO_A_INICIO/FIN_A_FIN/BLOQUEA/REQUIERE, con `DESFASE_DIAS`) — **3ª aparición del mecanismo de grafo de relaciones (tras PROYECTO_RELACION, PRODUCTO_RELACION)**
Prioridad: media

### F-029 — Avance manual no derivado de tareas
Fecha: 2026-07-31
Entidad afectada: PROCESO
Tipo: incoherencia potencial (patrón nuevo, no visto antes en la prueba)
Impacto: `PORCENTAJE_AVANCE` introducido a mano puede contradecir el estado real de las tareas hijas
Solución propuesta: `METODO_CALCULO_AVANCE` (MANUAL/POR_TAREAS/PONDERADO/POR_HITOS); edición manual debe quedar justificada y registrada
Prioridad: alta

### F-030 — Falta de resultado y criterio de aceptación
Fecha: 2026-07-31
Entidad afectada: PROCESO
Tipo: campo ausente
Impacto: no existe condición objetiva para considerar terminado el proceso
Solución propuesta: `OBJETIVO_PROCESO`/`RESULTADO_ESPERADO`/`CRITERIOS_ACEPTACION`/`DEFINITION_OF_DONE`/`VALIDADOR_ID`
Prioridad: alta
**Nota**: se solapa sustancialmente con F-035 (ambas piden criterios de aceptación/entradas-salidas para PROCESO) — fusionar en un único bloque de diseño, no tratar como dos mejoras independientes

### F-031 — Duración temporal ambigua
Fecha: 2026-07-31
Entidad afectada: PROCESO (PCS-0002)
Tipo: incoherencia funcional
Impacto: `DURACION_PREVISTA_DIAS=5` frente a rango real `FECHA_INICIO_PLAN`↔`FECHA_FIN_PLAN` = 8 días naturales; sin declarar si es días naturales/laborables/jornadas/horas
Evidencia: **confirmado que `IntegrityService.js` no tiene ninguna regla que compare duración prevista con rango de fechas para PROCESO** (sí existe algo similar para TAREA) — el caso real no lo detecta nada hoy
Solución propuesta: `TIPO_DURACION` + cálculo con calendario laboral
Prioridad: alta

### F-032 — Valores vacíos no normalizados
Fecha: 2026-07-31
Entidad afectada: PROCESO / HISTORIAL (patrón sistémico, no exclusivo de PROCESO — ya visto en CAMPANA/PROYECTO)
Tipo: calidad de datos
Impacto: se mezclan `""` y valores nulos en campos opcionales
Solución propuesta: contrato único de nulabilidad, aplicado en `insertarRegistroTransaccional` de forma centralizada, no por entidad
Prioridad: media

### F-033 — Estado "Preparado" sin criterio verificable
Fecha: 2026-07-31
Entidad afectada: PROCESO
Tipo: incoherencia funcional
Impacto: el estado no garantiza que el proceso esté realmente preparado (responsable, fechas, entradas, dependencias, criterio de salida)
Solución propuesta: precondiciones deterministas por estado
Prioridad: alta

### F-034 — Falta de tipo y fase del proceso
Fecha: 2026-07-31
Entidad afectada: PROCESO
Tipo: campo ausente
Impacto: no permite clasificar, reutilizar ni comparar procesos — **3ª aparición del patrón de clasificación tipo/prioridad/madurez (tras TIPO_PROYECTO F-008, TIPO_PRODUCTO F-016)**
Solución propuesta: `TIPO_PROCESO` + `FASE_PROYECTO`
Prioridad: media

### F-035 — Falta de entradas, salidas y validación
Fecha: 2026-07-31
Entidad afectada: PROCESO
Tipo: campo ausente
Impacto: no existe contrato operativo ni criterio objetivo de finalización
Solución propuesta: entradas, salidas, criterios de aceptación, validador
Prioridad: alta
**Nota**: solapa con F-030 (ambas piden criterios de aceptación para PROCESO) — fusionar, no implementar como dos mejoras separadas

<!-- Notas de diseño sin fricción formal (pendiente decidir si se numeran F-036+): orden de secuencia manual,
     predecesor único (falta PROCESO_DEPENDENCIA N:M), falta relación con hitos/entregables,
     falta capacidad/recursos, falta gestión de bloqueos, falta revisión/aprobación —
     ver PROPUESTA_PROCESO_ALTA.md secciones 5, 6, 9, 10, 11, 12 -->

### F-036 a F-045 — Alta de TAREA (TAR-0004)
Fecha: 2026-07-31
Entidad afectada: TAREA
Resumen: responsable ausente en el alta (F-036, patrón asignación N:M 6ª vez), duración sin esfuerzo (F-037), predecesora única confirmada contra hoja real (F-038, grafo de dependencias 4ª vez), avance manual incoherente (F-039), sin criterios de aceptación (F-040, 6ª vez), sin vínculo a documentos/evidencias (F-041), **F-042 — INVALIDADO en Fase L2 (2026-07-31): `git blame` confirma que `MOTIVO_BLOQUEO`/`MOTIVO_POSPOSICION`/`MOTIVO_CANCELACION` ya estaban en el formulario con `visibleSi` correcto desde el primer commit de la auditoría (`7d76bba`); se confundió ocultación condicional por estado con ausencia real**, sin reutilización/plantilla (F-043), estado "Preparada" sin precondiciones (F-044), fechas opcionales sin declarar el motivo (F-045)
Diseño completo: ver `PROPUESTA_TAREA_ALTA.md`
Prioridad: alta en F-036, F-037, F-039, F-040, F-041, F-044, F-045; media en F-038; F-042 cerrado sin acción (invalidado)
Nota transversal: TAREA cierra el recorrido completo de la jerarquía — los mismos ~6 mecanismos (asignación N:M, grafo de dependencias, clasificación por tipo, criterios de aceptación, avance derivado, y ahora desconexión modelo/UI) se repiten en los 5 niveles probados

### F-046 — Personas y equipos mezclados
Fecha: 2026-07-31
Entidad afectada: TAREA_RESPONSABLE / UI
Tipo: ambigüedad / navegación
Impacto: el selector FK no distingue tipo de recurso ni sus reglas de capacidad
Solución propuesta: mostrar tipo, filtrar, aplicar flujos distintos
Prioridad: alta

### F-047 — Dedicación sin magnitud temporal
Fecha: 2026-07-31
Entidad afectada: TAREA_RESPONSABLE
Tipo: incoherencia funcional
Impacto: el porcentaje no indica horas, periodo ni base de cálculo
Solución propuesta: `TIPO_DEDICACION` + horas
Prioridad: alta

### F-048 — Cálculo de carga sin solapamiento temporal — **CONFIRMADO EN CÓDIGO, ES UN BUG ACTIVO, NO SOLO GAP DE DISEÑO**
Fecha: 2026-07-31
Entidad afectada: TAREA_RESPONSABLE / IntegrityService (`FUNC-REC-001`)
Tipo: integridad funcional — defecto en regla ya desplegada
Impacto: dos asignaciones del 100% en periodos no solapados generan hoy un falso positivo `FUNC-REC-001`
Evidencia: verificado en `IntegrityService.js:1494-1528` (`detectarProblemasTareaResponsable_`) — suma `PORCENTAJE_DEDICACION` de todas las asignaciones `Planificada`/`Activa` de una persona sin comparar fechas en ningún punto de la función
Solución propuesta: calcular carga por periodos/calendario, no suma global
Prioridad: **crítica — tratar como corrección de bug en regla existente, no como mejora de diseño; distinto del resto del backlog**

### F-049 — Equipo sin desglose
Fecha: 2026-07-31
Entidad afectada: TAREA_RESPONSABLE
Tipo: trazabilidad
Impacto: una asignación a equipo no identifica ejecutores ni capacidad individual
Solución propuesta: asignación a equipo con desglose opcional (`EQUIPO_ID`, `COORDINADOR_ID`, `CAPACIDAD_RESERVADA`, `REQUIERE_DESGLOSE`)
Prioridad: media

### F-050 — Falta de buscador
Fecha: 2026-07-31
Entidad afectada: TAREA_RESPONSABLE / UI
Tipo: localización de información
Impacto: el selector no escala al crecer personas y equipos
Solución propuesta: autocompletado, filtros contextuales
Prioridad: alta

### F-051 — Disponibilidad no aplicada de forma visible
Fecha: 2026-07-31
Entidad afectada: PERSONA_EQUIPO / TAREA_RESPONSABLE
Tipo: decisión no soportada
Impacto: existe capacidad/disponibilidad en `PERSONA_EQUIPO` pero la asignación no la muestra ni la usa
Solución propuesta: vista previa de capacidad resultante antes de confirmar
Prioridad: alta

### F-052 a F-057 — Alta de DECISION (DEC-0003)
Fecha: 2026-07-31
Entidad afectada: DECISION
Resumen: vinculada solo a PROYECTO sin poder relacionarse con PRODUCTO/PROCESO/TAREA (F-052, patrón grafo de relaciones), responsable único sin separar proponente/analista/decisor/validador (F-053, variante del patrón N:M con roles de decisión), sin alternativas ni criterios estructurados (F-054), sin acciones derivadas de la resolución (F-055), impacto en un único catálogo genérico (F-056), sin revisión posterior para decisiones provisionales (F-057)
Evidencia: esquema real verificado en `Formularios.js:327-347` — confirma F-052/F-053/F-056 exactamente; `RESOLUCION`/`FECHA_RESOLUCION` ya existen (falta solo validación condicional, no campos nuevos)
Diseño completo: ver `PROPUESTA_DECISION_ALTA.md`
Prioridad: alta en F-052, F-053, F-054, F-055; media en F-056, F-057

### F-058 a F-065 — Alta de INCIDENCIA (INC-0014)
Fecha: 2026-07-31
Entidad afectada: INCIDENCIA
Resumen: catálogo de tipo insuficiente/"Otra" sobreusada (F-058, barato de arreglar), sin ciclo causa/contención/corrección/prevención (F-059), responsable único sin roles (F-060), sin evidencias (F-061), selectores sin búsqueda (F-062, mismo patrón que F-050/F-021), **no convertible en tareas correctoras — CRÍTICA, y es el mismo problema que este propio proceso de auditoría resuelve manualmente registrando fricciones fuera del sistema (F-063)**, fecha límite obligatoria sin condicionar por prioridad (F-064, mismo patrón que F-045), resolución y cierre no diferenciados (F-065, 3ª aparición del patrón "estado sin criterio verificable")
Evidencia: esquema real verificado en `Formularios.js:349+` — confirma cadena de FK dependientes y ausencia total de vínculo INCIDENCIA↔TAREA
Diseño completo: ver `PROPUESTA_INCIDENCIA_ALTA.md`
Prioridad: crítica en F-063; alta en F-058, F-059, F-060, F-061, F-062, F-065; media en F-064

### F-066 a F-073 — Alta de DOCUMENTO (DOC-0002)
Fecha: 2026-07-31
Entidad afectada: DOCUMENTO
Resumen: alta depende de URL externa sin flujo de creación (F-066), limitado a una sola entidad relacionada (F-067, patrón grafo de relaciones), sin versionado real (F-068), sin revisión/aprobación (F-069, recalibrado a "alta" no "crítica" — gap real sin comportamiento incorrecto activo), URL sin validar (F-070), catálogo de tipo insuficiente (F-071), sin documento principal (F-072), sin detección de cambios externos (F-073)
Evidencia: esquema real verificado en `Formularios.js:471-482` — confirma todas las afirmaciones excepto la calibración de prioridad de F-069
Diseño completo: ver `PROPUESTA_DOCUMENTO_ALTA.md`
Prioridad: alta en F-066, F-067, F-068, F-069, F-070, F-072; media en F-071, F-073
Nota: complementario, no redundante, con `FUNC-DOC-001..006` (Fase F de esta auditoría) — diseñar juntos al implementar

### F-079 — El modelo MATERIAL no representa todos los recursos operativos
Fecha: 2026-07-31
Entidad afectada: MATERIAL / TAREA_MATERIAL / PERSONA_EQUIPO
Tipo: limitación funcional / nueva necesidad (arquitectónica)
Impacto: no existe modelo común para consumibles, herramientas, maquinaria, espacios, servicios y capacidad humana — MATERIAL está orientado solo a stock/proveedor/reposición
Solución propuesta: entidad `RECURSO` común + extensiones por tipo (`RECURSO_INVENTARIO`/`RECURSO_ACTIVO`/`RECURSO_ESPACIO`) + relación genérica `TAREA_RECURSO` + `RECURSO_REFERENCIA` hacia `PERSONA_EQUIPO` (sin duplicar). Explícitamente NO_GO: tabla monolítica de 60 columnas; NO_GO: duplicar PERSONA_EQUIPO dentro de RECURSO; migración diferida a bloque posterior a la auditoría (fases R1-R4)
Prioridad: alta — pero es diseño anticipado, no verificado todavía contra un alta real de MATERIAL (única fricción de las 79 con este origen)
Mejoras a incorporar cuando se retome: (1) unificar con la corrección de F-048 — un único verificador de solapamiento temporal reutilizable para todo recurso, no solo personas; (2) `RECURSO_REFERENCIA` es la 3ª aparición de un vínculo polimórfico genérico (tras DOCUMENTO_CONTEXTO, bloqueos de INCIDENCIA/DECISION) — candidato a mecanismo único reutilizable; (3) considerar `RECURSO_MOVIMIENTO` (histórico de entradas/salidas de stock) en el mismo diseño de migración, no como extensión posterior separada
Diseño completo: ver `PROPUESTA_RECURSO_MATERIAL.md`

### Nota — Reenvío duplicado de F-046 a F-051 (TAREA_RESPONSABLE)
Fecha: 2026-07-31
El documento pegado en este turno repite el mismo hallazgo ya registrado como F-046 a F-051 (hito "Alta de TRE-0007"), con numeración local F-046 a F-050. No se registra de nuevo para no duplicar backlog — ver entradas originales más arriba.

### F-080 — Alta real de MATERIAL confirma limitaciones anticipadas en F-079
Fecha: 2026-07-31
Entidad afectada: MATERIAL (MAT-0005)
Tipo: confirmación empírica de F-079 + mejoras adicionales
Impacto: `UBICACION` texto libre (conecta con la mejora original de la sesión), `PROVEEDOR_ID` único (no N:M), `STOCK_ACTUAL` editable sin histórico de movimientos, sin lote/caducidad, sin distinción stock físico/reservado/disponible/comprometido, sin unidad de compra vs. consumo, sin código por categoría ni QR/código de barras
Evidencia: verificado contra `Formularios.js:263-283` y datos reales de MAT-0005; reglas de stock reservado>disponible y stock<=mínimo ya existen (`IntegrityService.js:481-535,1095-1096`)
Solución propuesta: módulo "logística/almacén" = capa operativa de `RECURSO_INVENTARIO`+`RECURSO_MOVIMIENTO` (Fase R3 de F-079) — no es diseño nuevo independiente, se incorpora al mismo documento
Diseño completo: ver `PROPUESTA_RECURSO_MATERIAL.md` (sección "Verificación empírica")
Prioridad: alta — primera fricción de F-079 con evidencia real, no solo anticipada

### F-081 a F-088 — Alta de TAREA_MATERIAL (TMA-0004)
Fecha: 2026-07-31
Entidad afectada: TAREA_MATERIAL
Resumen: unidad editable sin control/herencia (F-081), sin separar previsión/reserva/consumo (F-082), sin libro de movimientos — **mismo concepto que RECURSO_MOVIMIENTO de F-079, unificado en el mismo documento, no duplicado** (F-083), desviación no calculada ni catalogada (F-084), sin registro de devolución (F-085), consumo ligado a definición de TAREA no a ejecución — 3ª aparición del patrón definición-vs-ejecución (F-086), sin ubicación/lote contextual (F-087), estado funcional insuficiente (F-088)
Evidencia: esquema real verificado en `Formularios.js:295-305` — confirma todas las afirmaciones
Diseño completo: ver `PROPUESTA_RECURSO_MATERIAL.md` (sección "Ampliación desde TAREA_MATERIAL")
Prioridad: alta en F-081, F-082, F-083, F-084, F-086, F-088; media en F-085, F-087
Nota: numeración local del documento pegado (F-051 a F-058) chocaba con fricciones ya registradas — corregida aquí a F-081 a F-088

### F-089 a F-098 — Alta de PROVEEDOR (PRV-0005)
Fecha: 2026-07-31
Entidad afectada: PROVEEDOR
Resumen: código sin normalizar (F-089), un único contacto (F-090), dirección única sin estructura (F-091), plazo global no por material (F-092), un único proveedor por material — mejora prioritaria según el autor (F-093), sin evaluación histórica (F-094), **estado "Activo" sin criterio — 4ª aparición confirmada del patrón "estado sin criterio verificable" en todo el sistema (F-095)**, sin documentación ni vigencias (F-096), sin condiciones comerciales ni precios versionados (F-097), sin gestión de pedidos/recepciones (F-098)
Evidencia: esquema real verificado en `Formularios.js:307-318`; PRV-0005 real quedó `ESTADO=Activo` pese a que sus propias observaciones indican que no es una relación comercial confirmada — WARN real, no hipotético
Diseño completo: ver `PROPUESTA_PROVEEDOR_ALTA.md`
Prioridad: alta en F-092, F-093, F-095, F-098; media en F-089, F-090, F-094, F-096, F-097; baja/media en F-091
Nota: numeración local del documento (F-059 a F-068) colisionaba de nuevo con INCIDENCIA/DOCUMENTO — corregida a F-089–F-098

<!-- Añadir entradas F-099... debajo de esta línea, la más reciente al final -->

**Documentos de referencia con el diseño completo**:
- [PROPUESTA_CAMPANA_ALTA_PLANIFICACION.md](PROPUESTA_CAMPANA_ALTA_PLANIFICACION.md) — F-001 a F-007
- [PROPUESTA_PROYECTO_ALTA_PLANIFICACION.md](PROPUESTA_PROYECTO_ALTA_PLANIFICACION.md) — F-008 a F-013
- [PROPUESTA_PRODUCTO_ALTA.md](PROPUESTA_PRODUCTO_ALTA.md) — F-014 a F-018
- [PROPUESTA_PROYECTO_PRODUCTO_RELACION.md](PROPUESTA_PROYECTO_PRODUCTO_RELACION.md) — F-021 a F-025
- [PROPUESTA_PROCESO_ALTA.md](PROPUESTA_PROCESO_ALTA.md) — F-026 a F-035 (+ notas de diseño sin numerar; F-030/F-035 solapadas, fusionar al implementar)
- [PROPUESTA_TAREA_ALTA.md](PROPUESTA_TAREA_ALTA.md) — F-036 a F-045
- F-046 a F-051 (TAREA_RESPONSABLE/TRE-0007) — registradas directamente arriba; **F-048 es un bug confirmado en `FUNC-REC-001`, no una mejora de diseño — priorizar aparte del resto del backlog**
- [PROPUESTA_DECISION_ALTA.md](PROPUESTA_DECISION_ALTA.md) — F-052 a F-057
- [PROPUESTA_INCIDENCIA_ALTA.md](PROPUESTA_INCIDENCIA_ALTA.md) — F-058 a F-065 (F-063 crítica)
- [PROPUESTA_DOCUMENTO_ALTA.md](PROPUESTA_DOCUMENTO_ALTA.md) — F-066 a F-073
- [PROPUESTA_RECURSO_MATERIAL.md](PROPUESTA_RECURSO_MATERIAL.md) — F-079, F-080, F-081 a F-088 (incluye MOVIMIENTO_MATERIAL/RECURSO_MOVIMIENTO unificado)
- [PROPUESTA_PROVEEDOR_ALTA.md](PROPUESTA_PROVEEDOR_ALTA.md) — F-089 a F-098

**Patrón transversal detectado (3 niveles consecutivos)**: asignación N:M persona/equipo, grafo de relaciones entre entidades del mismo tipo, clasificación en 3 ejes (tipo/prioridad/madurez), criterios de aceptación estructurados. Confirmar si se repite en PROCESO/TAREA antes de diseñar mecanismos definitivos — si se repite, diseñar como mecanismos polimórficos únicos reutilizables en toda la jerarquía, no por entidad.

---

## 4. Informes de hito

Al cerrar cada bloque/hito relevante (no necesariamente cada proyecto), rellenar:

```
### Hito — [nombre] — [fecha]
OBJETIVO:
RESULTADO:
FRICCIONES DETECTADAS:     (referenciar F-XXX)
ERRORES:
ADVERTENCIAS:
MEJORAS PROPUESTAS:
CAMBIOS PRIORITARIOS:
CAMBIOS DESCARTADOS:
RIESGOS:
DEPENDENCIAS:
SIGUIENTE ITERACIÓN:
```

### Hito — Alta de CAM-0010 — 2026-07-31
OBJETIVO: dar de alta la campaña real de la prueba operativa.
RESULTADO: CAM-0010 creada correctamente (HIS-1262), trazabilidad OK. Requirió forzar `FECHA_FIN_PLAN` como horizonte provisional por ausencia de tipo de planificación continua.
FRICCIONES DETECTADAS: F-001, F-002, F-003, F-004, F-005, F-006, F-007
ERRORES: ninguno (la operación se completó, las limitaciones son de diseño, no fallos)
ADVERTENCIAS: —
MEJORAS PROPUESTAS: ver `PROPUESTA_CAMPANA_ALTA_PLANIFICACION.md` (Bloques K1-K4)
CAMBIOS PRIORITARIOS: ninguno aplicado todavía — no se toca código durante la prueba
CAMBIOS DESCARTADOS: —
RIESGOS: si se prioriza mal, el diseño N:M de `CAMPANA_RESPONSABLE` podría duplicar el de tarea↔persona/equipo — deben unificarse
DEPENDENCIAS: cierre completo de la prueba operativa antes de iniciar Bloque K1
SIGUIENTE ITERACIÓN: continuar la campaña creando el primer PROYECTO real

### Hito — Alta de PRO-0003 — 2026-07-31
OBJETIVO: dar de alta el primer proyecto real de CAM-0010 ("Ingreso masivo de datos").
RESULTADO: PRO-0003 creado correctamente (HIS-1263), trazabilidad OK. Mismo patrón de campos forzados que en CAMPANA (`TIPO_PROYECTO=Importante` como prioridad provisional, fechas como horizonte).
FRICCIONES DETECTADAS: F-008, F-009, F-010, F-011, F-012, F-013
ERRORES: ninguno
ADVERTENCIAS: —
MEJORAS PROPUESTAS: ver `PROPUESTA_PROYECTO_ALTA_PLANIFICACION.md`
CAMBIOS PRIORITARIOS: ninguno aplicado — no se toca código durante la prueba
CAMBIOS DESCARTADOS: —
RIESGOS: el patrón N:M persona/equipo ya apareció 3 veces (CAMPANA, PROYECTO, TAREA/Fase D) — confirma que hace falta una única relación polimórfica, no diseñarlo por separado en cada bloque K
DEPENDENCIAS: cierre completo de la prueba operativa antes de iniciar cualquier Bloque K
SIGUIENTE ITERACIÓN: continuar creando PRODUCTO/PROCESO/TAREA dentro de PRO-0003

### Hito — Alta de PRD-0002 — 2026-07-31
OBJETIVO: dar de alta el primer producto real de PRO-0003 ("Módulo de importación masiva v1").
RESULTADO: PRD-0002 creado correctamente (HIS-1264), trazabilidad OK.
FRICCIONES DETECTADAS: F-014, F-015, F-016, F-017, F-018
ERRORES: ninguno
ADVERTENCIAS: —
MEJORAS PROPUESTAS: ver `PROPUESTA_PRODUCTO_ALTA.md`
CAMBIOS PRIORITARIOS: ninguno aplicado — no se toca código durante la prueba
CAMBIOS DESCARTADOS: —
RIESGOS: patrón transversal confirmado 3 veces (ver nota en sección 3) — no diseñar tablas ad-hoc por entidad sin antes confirmar en PROCESO/TAREA
DEPENDENCIAS: cierre completo de la prueba operativa
SIGUIENTE ITERACIÓN: crear relación PROYECTO_PRODUCTO (PRO-0003 ↔ PRD-0002), revisando antes qué campos contextuales ofrece realmente el formulario

### Hito — Alta de PPR-0002 (PRO-0003 ↔ PRD-0002) — 2026-07-31
OBJETIVO: vincular el primer producto real a su proyecto.
RESULTADO: PPR-0002 creada correctamente (HIS-1265), trazabilidad OK.
FRICCIONES DETECTADAS: F-021, F-022, F-023, F-024, F-025 (F-025 pendiente de confirmar)
ERRORES: ninguno confirmado (F-025 en verificación)
ADVERTENCIAS: posible espacio en FK persistido — verificar antes de descartar
MEJORAS PROPUESTAS: ver `PROPUESTA_PROYECTO_PRODUCTO_RELACION.md`
CAMBIOS PRIORITARIOS: ninguno aplicado — no se toca código durante la prueba
CAMBIOS DESCARTADOS: —
RIESGOS: si F-025 se confirma, podría ser un problema sistémico de normalización de FK en `insertarRegistroTransaccional`, no puntual de esta fila
DEPENDENCIAS: confirmar F-025 con datos reales antes de cerrar esta iteración
SIGUIENTE ITERACIÓN: verificar F-025 (celda real); continuar bajando a PROCESO/TAREA dentro de PRO-0003

### Hito — Verificación F-023/F-025 contra datos reales — 2026-07-31
OBJETIVO: confirmar con datos reales del spreadsheet (no texto pegado) las dos fricciones marcadas como pendientes.
RESULTADO: ambas descartadas. F-025 sin espacio real en FK (artefacto de pegado). F-023 corregido — `ACTIVO` sí existe separado de `ESTADO` en `PROYECTO_PRODUCTO`; la confirmación previa se basó solo en `Repository.js` (campos de negocio), no en la hoja real (que añade columnas de sistema).
FRICCIONES DETECTADAS: ninguna nueva
ERRORES: error propio de verificación — confirmé F-023 sin mirar la hoja real, solo el código
ADVERTENCIAS: —
MEJORAS PROPUESTAS: —
CAMBIOS PRIORITARIOS: ninguno
CAMBIOS DESCARTADOS: F-023, F-025 (cerrados sin acción)
RIESGOS: —
DEPENDENCIAS: acceso al spreadsheet real (`12gIvFzsAXbaXJxFbIq2bjbBpPmtazotdTHkgvfp3Jc0`) disponible desde ahora para verificaciones directas
SIGUIENTE ITERACIÓN: alta de PCS-0002 (primer PROCESO real)

### Hito — Alta de PCS-0002 — 2026-07-31
OBJETIVO: dar de alta el primer proceso real de PRD-0002.
RESULTADO: PCS-0002 creado correctamente (HIS-1266), trazabilidad OK.
FRICCIONES DETECTADAS: F-031, F-032, F-033, F-034, F-035 (+ 6 notas de diseño sin numerar: orden de secuencia, predecesor único, hitos/entregables, capacidad, bloqueos, revisión)
ERRORES: ninguno
ADVERTENCIAS: `DURACION_PREVISTA_DIAS=5` no coincide con el rango de fechas (8 días naturales) — confirmado que ninguna regla de integridad lo detecta hoy para PROCESO
MEJORAS PROPUESTAS: ver `PROPUESTA_PROCESO_ALTA.md`
CAMBIOS PRIORITARIOS: ninguno aplicado — no se toca código durante la prueba
CAMBIOS DESCARTADOS: —
RIESGOS: F-032 (valores vacíos no normalizados) es sistémico, no debe arreglarse solo en PROCESO
DEPENDENCIAS: decidir si formalizar las 6 notas de diseño sin numerar como F-036+
SIGUIENTE ITERACIÓN: crear la primera TAREA de PCS-0002, comprobar si el nivel atómico soporta ejecución, capacidad, documentación y evidencia

### Hito — Alta de TAR-0004 — 2026-07-31
OBJETIVO: dar de alta la primera tarea real de PCS-0002 y comprobar si el nivel atómico soporta ejecución, capacidad, documentación y evidencia.
RESULTADO: TAR-0004 creada correctamente (HIS-1267), trazabilidad OK. Confirma que TAREA es hoy un registro de planificación, no una unidad operativa completa.
FRICCIONES DETECTADAS: F-036 a F-045 (10 fricciones, ver `PROPUESTA_TAREA_ALTA.md`)
ERRORES: ninguno
ADVERTENCIAS: estado "Preparada" no garantiza preparación real (F-044); F-042 confirmado con columnas reales de `06_TAREAS` (MOTIVO_BLOQUEO/POSPOSICION/CANCELACION existen en el modelo, ausentes del formulario)
MEJORAS PROPUESTAS: ver `PROPUESTA_TAREA_ALTA.md`
CAMBIOS PRIORITARIOS: ninguno aplicado — no se toca código durante la prueba
CAMBIOS DESCARTADOS: —
RIESGOS: con los 5 niveles de la jerarquía probados (CAMPANA→TAREA), la señal de convergencia en los mismos ~6 mecanismos transversales es ya muy fuerte — bajar a más entidades (MATERIAL, DOCUMENTO, DECISION, INCIDENCIA) tiene valor marginal decreciente frente a empezar a consolidar el backlog
DEPENDENCIAS: —
SIGUIENTE ITERACIÓN: crear TAREA_RESPONSABLE (TAR-0004 → PER-0001) — última ejecución real prevista antes de valorar si cerrar la prueba y consolidar backlog

### Hito — Alta de TRE-0007 (TAR-0004 → PER-0001) — 2026-07-31
OBJETIVO: primera ejecución real (no solo diseño en papel) del patrón de asignación N:M persona/equipo, confirmado 6 veces en la jerarquía.
RESULTADO: TRE-0007 creada correctamente (HIS-1268), trazabilidad OK. FK, catálogos y límite porcentual básico funcionan.
FRICCIONES DETECTADAS: F-046, F-047, F-048 (bug confirmado), F-049, F-050, F-051
ERRORES: ninguno en la operación; **F-048 es un bug real en `FUNC-REC-001`** (verificado en código, no solo sospechado)
ADVERTENCIAS: control del 100% es global, no temporal — riesgo de falsos positivos ya en producción
MEJORAS PROPUESTAS: buscador+separación persona/equipo, horas además de porcentaje, carga por intervalos, responsable principal, disponibilidad visible, competencias, asignado-vs-ejecutado
CAMBIOS PRIORITARIOS: ninguno aplicado — no se toca código durante la prueba (incluido F-048, pese a ser bug, por decisión de mantener la disciplina de la prueba)
CAMBIOS DESCARTADOS: —
RIESGOS: F-048 puede generar ruido real en auditorías de integridad futuras hasta que se corrija
DEPENDENCIAS: —
SIGUIENTE ITERACIÓN: DOCUMENTO/DECISIÓN/INCIDENCIA (encajan mejor con esta tarea de software) y, sin saltárselo, MATERIAL/PROVEEDOR (único dominio real del taller aún sin ninguna fricción registrada — riesgo de sesgo ya señalado)

### Hito — Alta de DEC-0003 — 2026-07-31
OBJETIVO: primera decisión real de PRO-0003.
RESULTADO: DEC-0003 creada correctamente (HIS-1269), trazabilidad OK. Creación, FK, historial y coherencia básica funcionan.
FRICCIONES DETECTADAS: F-052, F-053, F-054, F-055, F-056, F-057
ERRORES: ninguno
ADVERTENCIAS: —
MEJORAS PROPUESTAS: ver `PROPUESTA_DECISION_ALTA.md`
CAMBIOS PRIORITARIOS: ninguno aplicado — no se toca código durante la prueba
CAMBIOS DESCARTADOS: —
RIESGOS: —
DEPENDENCIAS: —
SIGUIENTE ITERACIÓN: INCIDENCIA, y recordatorio pendiente de no saltarse MATERIAL/PROVEEDOR antes de cerrar la prueba

### Hito — Alta de INC-0014 — 2026-07-31
OBJETIVO: primera incidencia real, vinculada a toda la cadena jerárquica (CAM-0010/PRO-0003/PRD-0002/PCS-0002/TAR-0004).
RESULTADO: INC-0014 creada correctamente (HIS-1270), trazabilidad OK. Cadena de FK dependiente hasta TAREA funciona.
FRICCIONES DETECTADAS: F-058 a F-065 (8 fricciones, F-063 crítica)
ERRORES: ninguno
ADVERTENCIAS: —
MEJORAS PROPUESTAS: ver `PROPUESTA_INCIDENCIA_ALTA.md`
CAMBIOS PRIORITARIOS: ninguno aplicado — no se toca código durante la prueba
CAMBIOS DESCARTADOS: —
RIESGOS: —
DEPENDENCIAS: —
SIGUIENTE ITERACIÓN: MATERIAL/PROVEEDOR — último dominio real del taller pendiente antes de cerrar la prueba operativa

### Hito — Alta de DOC-0002 — 2026-07-31
OBJETIVO: primer documento real, vinculado a CAM-0010.
RESULTADO: DOC-0002 creado correctamente (HIS-1271), trazabilidad OK.
FRICCIONES DETECTADAS: F-066 a F-073 (8 fricciones)
ERRORES: ninguno
ADVERTENCIAS: —
MEJORAS PROPUESTAS: ver `PROPUESTA_DOCUMENTO_ALTA.md`
CAMBIOS PRIORITARIOS: ninguno aplicado — no se toca código durante la prueba
CAMBIOS DESCARTADOS: —
RIESGOS: —
DEPENDENCIAS: —
SIGUIENTE ITERACIÓN: MATERIAL/PROVEEDOR — sigue siendo el único dominio real del taller pendiente antes de cerrar la prueba operativa (recordatorio repetido)

### Hito — Alta de MAT-0005 — 2026-07-31
OBJETIVO: primer material real del taller, cerrando el último dominio pendiente antes de valorar el cierre de la prueba.
RESULTADO: MAT-0005 creado correctamente (HIS-1272), trazabilidad OK, sin stock mínimo activo (5>2). Confirma con evidencia real las limitaciones ya anticipadas en F-079 (RECURSO).
FRICCIONES DETECTADAS: F-080 (confirma F-079 empíricamente); reenvío duplicado de F-046-051 no registrado de nuevo
ERRORES: ninguno
ADVERTENCIAS: —
MEJORAS PROPUESTAS: ver `PROPUESTA_RECURSO_MATERIAL.md`
CAMBIOS PRIORITARIOS: ninguno aplicado — no se toca código durante la prueba
CAMBIOS DESCARTADOS: —
RIESGOS: —
DEPENDENCIAS: —
SIGUIENTE ITERACIÓN: confirmar si PRV-0001 (proveedor usado en MAT-0005) ya fue dado de alta en esta prueba o es dato preexistente — si es preexistente, crear un PROVEEDOR real para cerrar también ese dominio

### Hito — Alta de TMA-0004 (TAR-0004 ↔ MAT-0005) — 2026-07-31
OBJETIVO: vincular material a tarea, cerrando el ciclo de planificación de materiales de esta campaña.
RESULTADO: TMA-0004 creada correctamente (HIS-1273), trazabilidad OK.
FRICCIONES DETECTADAS: F-081 a F-088 (8 fricciones; F-083 unificada con F-079/RECURSO_MOVIMIENTO)
ERRORES: ninguno
ADVERTENCIAS: numeración local del documento pegado colisionaba con fricciones ya registradas — corregida
MEJORAS PROPUESTAS: ver `PROPUESTA_RECURSO_MATERIAL.md`
CAMBIOS PRIORITARIOS: ninguno aplicado — no se toca código durante la prueba
CAMBIOS DESCARTADOS: —
RIESGOS: —
DEPENDENCIAS: —
SIGUIENTE ITERACIÓN: confirmar/crear PROVEEDOR real; si se confirma, valorar cierre de la prueba operativa y consolidación final del backlog

### Hito — Alta de PRV-0005 — 2026-07-31 — COBERTURA COMPLETA DE DOMINIOS ALCANZADA
OBJETIVO: cerrar el último dominio real del taller pendiente (PROVEEDOR).
RESULTADO: PRV-0005 creado correctamente (HIS-1274), trazabilidad OK. Con esto quedan cubiertos con datos reales: jerarquía completa (CAMPANA→TAREA), asignación de personas/equipos, DOCUMENTO, DECISION, INCIDENCIA, MATERIAL, TAREA_MATERIAL y PROVEEDOR.
FRICCIONES DETECTADAS: F-089 a F-098 (10 fricciones)
ERRORES: ninguno
ADVERTENCIAS: PRV-0005 quedó `ESTADO=Activo` sin criterio real detrás — 4ª confirmación del patrón "estado sin criterio verificable"
MEJORAS PROPUESTAS: ver `PROPUESTA_PROVEEDOR_ALTA.md`
CAMBIOS PRIORITARIOS: ninguno aplicado — no se toca código durante la prueba
CAMBIOS DESCARTADOS: —
RIESGOS: —
DEPENDENCIAS: —
SIGUIENTE ITERACIÓN: con la cobertura de dominios completa y 98 fricciones documentadas, valorar cerrar la prueba operativa y consolidar el backlog priorizado final

<!-- Añadir hitos debajo -->

---

## 5. Backlog priorizado

Consolidado en [BACKLOG_CONSOLIDADO.md](BACKLOG_CONSOLIDADO.md): 89 fricciones activas (91 registradas, 2 invalidadas por verificación), agrupadas en 12 mecanismos transversales + bug crítico (F-048) + ganancias baratas + funcionalidades específicas + bloques estructurales grandes + explícitamente diferido. No se aborda ningún desarrollo sin pasar antes por ese documento.

## 6. Gate final

```
CAMPAÑA_REAL_EJECUTADA=OK
PROYECTOS_GESTIONADOS=OK          (PRO-0003, con PRODUCTO/PROCESO/TAREA/asignación/material dentro)
TAREAS_TRAZADAS=OK                (TAR-0004, con responsable y material vinculados)
FRICCIONES_REGISTRADAS=OK         (98 números emitidos, 91 entradas reales, 89 activas)
INCIDENCIAS_DOCUMENTADAS=OK       (INC-0014)
DECISIONES_REGISTRADAS=OK         (DEC-0003)
INFORME_FINAL_GENERADO=OK         (BACKLOG_CONSOLIDADO.md)
MEJORAS_PRIORIZADAS=OK            (Tiers 0-5 en BACKLOG_CONSOLIDADO.md)
MEMORIA_GENERADA=OK               (este documento + 10 PROPUESTA_*.md + BACKLOG_CONSOLIDADO.md)
```
