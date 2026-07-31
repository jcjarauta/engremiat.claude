# Propuesta consolidada — Mejora del alta y planificación de campañas

**Origen:** fricciones F-001 a F-007 de `PRUEBA_REAL_CAMPANA.md`, detectadas al dar de alta CAM-0010 ("Desarrollo y mejora del sistema LaTroballa").
**Estado:** propuesta de diseño, sin desarrollar. No se toca código hasta cerrar la prueba operativa real completa (ver gate al final).

## 1. Estado actual (verificado)

El alta de campaña dispone de: nombre, descripción, fecha de inicio obligatoria, fecha final obligatoria, estado, observaciones.

**Limitaciones detectadas:**
- Obliga a establecer una fecha final, incluso en campañas continuas.
- No permite planificar por objetivos, hitos o recurrencia.
- No presenta responsable ni equipo de referencia.
- No registra objetivos, alcance, resultados ni criterios de cierre.
- No incluye hitos ni revisiones periódicas.
- No proporciona una vista temporal o calendario.
- Solo permite entrada manual.
- No admite clonación, plantilla, importación completa o generación asistida.
- Descripción y observaciones tienen poco espacio visible.
- No hay guardado de borrador, vista previa ni validación contextual.

## 2. Modelo funcional propuesto

### 2.1 Tipo de planificación

```
TIPO_PLANIFICACION
- FECHAS_CERRADAS
- CONTINUA
- POR_OBJETIVOS
- POR_HITOS
- RECURRENTE
```

| Tipo | Inicio | Fin | Revisión | Cierre |
|---|---|---|---|---|
| Fechas cerradas | Obligatorio | Obligatorio | Opcional | Fecha final |
| Continua | Obligatorio | Opcional | Obligatoria | Decisión explícita |
| Por objetivos | Obligatorio | Opcional | Recomendable | Cumplimiento de objetivos |
| Por hitos | Obligatorio | Opcional | Por hito | Hitos obligatorios completados |
| Recurrente | Obligatorio | Según recurrencia | Periódica | Fin de recurrencia o cancelación |

Campos asociados: `FECHA_INICIO_PLAN`, `FECHA_FIN_PLAN`, `FECHA_REVISION`, `HORIZONTE_PLANIFICACION`, `PERIODICIDAD`, `MOTIVO_CAMBIO_FECHA`.

`FECHA_FIN_PLAN` no debe emplearse como sustituto artificial de una fecha de revisión.

## 3. Objetivos, alcance y cierre

```
OBJETIVO_GENERAL
ALCANCE
FUERA_DE_ALCANCE
RESULTADOS_ESPERADOS
CRITERIOS_EXITO
CRITERIO_CIERRE
```

La campaña debe poder cerrarse por cumplimiento funcional, no únicamente por fecha.

## 4. Responsables y gobernanza

**Alta simplificada:** `RESPONSABLE_PRINCIPAL_ID`, `EQUIPO_REFERENCIA_ID`, `RESPONSABLE_SUPLENTE_ID`.

**Modelo ampliable** (N:M):

```
CAMPANA_RESPONSABLE
- ID_CAMPANA_RESPONSABLE
- CAMPANA_ID
- PERSONA_EQUIPO_ID
- ROL           (RESPONSABLE / COORDINADOR / REFERENTE_TECNICO / APOYO / VALIDADOR / OBSERVADOR)
- PORCENTAJE_DEDICACION
- FECHA_INICIO
- FECHA_FIN
- ACTIVO
```

**Nota de diseño (añadida en la valoración de esta propuesta)**: esta relación N:M es el mismo problema estructural ya identificado para tarea↔persona/equipo (Fase D, diferido). Deben diseñarse juntas como una única relación de "asignación de persona/equipo a entidad" reutilizable (CAMPANA, TAREA, y potencialmente PROYECTO), no como dos tablas ad-hoc con forma distinta.

El formulario inicial debe mantenerse simple; las asignaciones múltiples se gestionarían desde una pantalla específica.

## 5. Clasificación y prioridad

```
TIPO_CAMPANA   (PRODUCCION / DESARROLLO / MANTENIMIENTO / FORMACION / MEJORA_CONTINUA / INVESTIGACION / COMUNITARIA / SIMULACION)
PRIORIDAD
AREA
ETIQUETAS
ORIGEN
```

## 6. Hitos y revisiones

```
CAMPANA_HITO
- ID_HITO
- CAMPANA_ID
- NOMBRE
- DESCRIPCION
- FECHA_OBJETIVO
- ESTADO
- CRITERIO_ACEPTACION
- RESPONSABLE_ID
- ORDEN
- ACTIVO
```

Ejemplo (aplicado a CAM-0010): H1 Cierre de auditoría, H2 Baseline técnica estable, H3 Primera campaña operativa ejecutada, H4 Fricciones consolidadas, H5 Backlog priorizado. Los hitos deben poder existir sin una fecha final global cerrada.

## 7. Canales de entrada de datos

El formulario manual debe ser un canal más, no la única entrada. Selector inicial: Formulario manual / Desde plantilla / Clonar campaña / Importar campaña completa / Generar con IA / Importar documento.

### 7.1 Formulario manual
Guardar borrador, validar antes de crear, continuar posteriormente, guardar y crear el primer proyecto, conservar datos si falla la validación.

### 7.2 Plantilla estructurada
Pestañas: `00_CONTROL`, `01_CAMPANA`, `02_PROYECTOS`, `03_PRODUCTOS`, `04_PROYECTO_PRODUCTO`, `05_PROCESOS`, `06_TAREAS`, `07_RESPONSABLES`, `08_MATERIALES`, `09_DOCUMENTOS`, `10_HITOS`, `11_DECISIONES`, `12_INCIDENCIAS`, `99_RESULTADO`.

Flujo obligatorio: `PLANTILLA → STAGING → VALIDACION → DRY_RUN → VISTA_PREVIA → APROBACION_HUMANA → IMPORTACION`.

### 7.3 Clonación
Permitir seleccionar qué copiar (estructura, proyectos, procesos, tareas, documentos, responsables, materiales, hitos). No copiar nunca: historial, estados ejecutados, fechas reales, evidencias, incidencias cerradas, decisiones históricas, identificadores originales.

### 7.4 Importación de campaña completa
Crea de una vez `CAMPAÑA → PROYECTOS → PRODUCTOS → PROCESOS → TAREAS → RELACIONES`, con referencias temporales resueltas a IDs definitivos durante la importación.

### 7.5 Entrada conversacional con IA
Genera un borrador estructurado (`campana`, `proyectos`, `productos`, `procesos`, `tareas`, `responsables`, `documentos`, `hitos`, `supuestos`, `datos_pendientes`). Estados: `GENERADO_POR_IA → PENDIENTE_VALIDACION → VALIDADO → IMPORTABLE`.

**NO_GO: escritura directa de la salida de IA sobre las hojas operativas.**

### 7.6 Importación documental
Origen conceptual: briefing, memoria, acta, planificación, manual, tutorial, transcripción, documento de requisitos. Extracción siempre pasa por revisión tabular antes de importar.

## 8. Trazabilidad del origen

```
MODO_ENTRADA
ORIGEN_DATOS        (FORMULARIO / PLANTILLA / CLONACION / IMPORTACION_MASIVA / IA / DOCUMENTO / SISTEMA_EXTERNO)
DOCUMENTO_ORIGEN_ID
PLANTILLA_VERSION
IMPORTACION_ID
GENERADO_POR_IA
FECHA_VALIDACION
VALIDADO_POR
ESTADO_VALIDACION
CORRELATION_ID
```

## 9. Calendario

LaTroballa = fuente de verdad; Google Calendar = visualización y recordatorios (nunca al revés). Campos futuros: `CALENDAR_ID`, `SINCRONIZAR_CALENDARIO`, `ULTIMA_SINCRONIZACION`, `ESTADO_SINCRONIZACION`. Primera versión **unidireccional** LaTroballa → Calendar; la bidireccional queda fuera del primer bloque.

## 10. Documentación y referencias

`DOCUMENTO_BASE_ID`, `CARPETA_TRABAJO_URL`, `REPOSITORIO_URL`, `ENLACE_REFERENCIA`. El documento no debe almacenarse como campo libre si ya existe la entidad `DOCUMENTO` — la campaña se relaciona con ella por identificador.

## 11. Capacidad y previsión (diseño, no implantación inmediata)

`HORAS_PREVISTAS`, `CAPACIDAD_PERSONAS`, `NUM_PERSONAS_ATENDIDAS_PREVISTAS`, `NUM_VOLUNTARIOS_PREVISTOS`, `RECURSOS_CRITICOS` — pensados para alimentar el futuro simulador/motor por eventos. Contemplar en el diseño de campos para evitar una migración inmediata, sin implantar todos ahora.

## 12. Diseño de interfaz propuesto

Bloques: modo de creación → identificación → tipo de planificación → objetivos y cierre → responsables → hitos y calendario → clasificación → documentación → observaciones → validación y resumen.

Acciones: `[Guardar borrador] [Validar] [Guardar campaña] [Guardar y crear proyecto] [Cancelar]`.

Mejoras de UX: campos multilínea, secciones plegables, ayudas contextuales, campos condicionales según `TIPO_PLANIFICACION`, detección de duplicados, resumen previo, errores asociados al campo, conservación del formulario tras error.

## 13. Fricciones que originan esta propuesta

Ver `PRUEBA_REAL_CAMPANA.md` sección 3, entradas F-001 a F-007.

## 14. Priorización recomendada

- **Bloque K1 — Modelo mínimo de campaña**: `TIPO_PLANIFICACION`, `OBJETIVO_GENERAL`, `CRITERIO_CIERRE`, `FECHA_REVISION`, `RESPONSABLE_PRINCIPAL_ID`, guardado como borrador.
- **Bloque K2 — Entrada estructurada**: clonar campaña, plantilla de campaña, staging, dryRun, importación completa, informe y reversión.
- **Bloque K3 — Ampliación operativa**: hitos, responsables N:M (diseñar junto con tarea↔persona/equipo), documentación inicial, clasificación y prioridad, guardar y crear proyecto.
- **Bloque K4 — Automatización** (fuera de alcance por ahora): entrada conversacional, importación documental, Google Calendar, Google Drive, GitHub, n8n.

## Decisión operativa

Durante la prueba operativa actual **no se modifica código**. Se continúa usando el flujo vigente (fecha de horizonte provisional donde haga falta), registrando fricciones, hasta cerrar la campaña de prueba completa.

**Gate para iniciar desarrollo (Bloque K1):**

```
AUDITORIA_CERRADA=OK
PRUEBA_OPERATIVA_COMPLETADA=OK      (toda la campaña, no solo esta alta)
FRICCIONES_PRIORIZADAS=OK
BASELINE_GIT=OK
ALCANCE_K1_APROBADO=OK
```

El primer cambio no debe intentar construir todo el sistema de importación y planificación de golpe. Debe corregir el núcleo semántico de `CAMPANA`: cómo se planifica, para qué existe, quién responde y cuándo se considera cumplida.
