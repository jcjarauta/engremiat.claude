# Propuesta consolidada — Mejora del alta de tarea

**Origen:** diseño previo + revisión posterior a crear TAR-0004 ("Definir estructura y columnas de la plantilla v1", dentro de PCS-0002). Fricciones F-036 a F-045.
**Estado:** propuesta de diseño, sin desarrollar.

## Verificación de código/datos relevante

- **F-042 confirmado con evidencia dura**: `MOTIVO_BLOQUEO`, `MOTIVO_POSPOSICION`, `MOTIVO_CANCELACION` son columnas reales de `06_TAREAS` (verificado vía `gsheets`), pero no están en `ESQUEMAS_FORMULARIO_MVP.TAREA` (`Formularios.js`). Desconexión modelo↔UI real — candidato de implementación de bajo esfuerzo (exponer campos ya existentes, sin diseño de esquema nuevo).
- **F-038 confirmado** (no solo inferido): `06_TAREAS` tiene un único campo `TAREA_PREDECESORA_ID`, FK simple, sin N:M.
- **Dato adicional**: `06_TAREAS` no tiene columna `PRIORIDAD` en absoluto.

## F-036 — Tarea sin responsable directo (VERIFICADO)
El alta no permite persona/equipo; requiere crear `TAREA` y luego `TAREA_RESPONSABLE` por separado.
```
RESPONSABLE_INICIAL_ID / EQUIPO_INICIAL_ID / ROL_INICIAL / PORCENTAJE_DEDICACION
```
Al guardar: crear TAREA → crear TAREA_RESPONSABLE → mismo CORRELATION_ID → revertir todo si falla (mismo patrón que F-015 en PRODUCTO). Prioridad: alta.

## F-037 — Duración y esfuerzo mezclados (VERIFICADO)
Solo existe `DURACION_PREVISTA_DIAS`. Añadir `ESFUERZO_PREVISTO_HORAS`, `ESFUERZO_REAL_HORAS`, `TIPO_DURACION` (DIAS_NATURALES/DIAS_LABORABLES/HORAS/JORNADAS). Prioridad: alta (simulación, capacidad, presupuesto).

## F-038 — Dependencia limitada a una predecesora (CONFIRMADO)
```
TAREA_DEPENDENCIA
- TAREA_ORIGEN_ID / TAREA_DESTINO_ID / TIPO_DEPENDENCIA (FIN_A_INICIO/INICIO_A_INICIO/FIN_A_FIN/BLOQUEA/REQUIERE) / DESFASE_DIAS / ACTIVO
```

## F-039 — Avance manual potencialmente incoherente (VERIFICADO)
Permite `ESTADO=Preparada` con `PORCENTAJE_AVANCE=70`, incoherente.
```
METODO_AVANCE  (MANUAL/POR_CHECKLIST/POR_SUBTAREAS/POR_HITOS/POR_EVIDENCIAS)
```
Modelo simple sugerido: Borrador=0%, Preparada=0%, En proceso=1-99%, Terminada=100%, Cancelada=valor congelado. Con checklist: `avance = completados/totales`. Edición manual requeriría justificación registrada.

## F-040 — Sin criterios de aceptación (VERIFICADO)
```
OBJETIVO_TAREA / RESULTADO_ESPERADO / CRITERIOS_ACEPTACION / DEFINITION_OF_DONE / VALIDADOR_ID / RESULTADO_VALIDACION / FECHA_VALIDACION
```
"Crítica conceptualmente" según el propio autor — es la unidad mínima de trabajo del sistema.

## F-041 — Sin vinculación a documentación/evidencia (VERIFICADO)
No hay vínculo desde el formulario a documentos/manuales/tutoriales/evidencias/incidencias/decisiones. Preferir relaciones (`TAREA_DOCUMENTO`, `TAREA_EVIDENCIA`, `TAREA_INCIDENCIA`, `TAREA_DECISION`, `TAREA_TUTORIAL`) sobre múltiples IDs directos en TAREA. UX: `[Guardar y añadir documento]` etc.

## F-042 — Bloqueo existe en el modelo pero no es operable desde el alta (CONFIRMADO CON EVIDENCIA DE HOJA REAL)
Campos condicionales por estado:
```
Bloqueada  → MOTIVO_BLOQUEO obligatorio + BLOQUEADA_DESDE + DECISION_REQUERIDA_ID opcional
Pospuesta  → MOTIVO_POSPOSICION obligatorio + FECHA_REVISION
Cancelada  → MOTIVO_CANCELACION obligatorio + CANCELADA_POR
```

## F-043 — Sin reutilización ni plantilla de tarea (VERIFICADO)
```
TIPO_TAREA (ANALISIS/DISEÑO/DESARROLLO/PRUEBA/VALIDACION/DOCUMENTACION/COORDINACION/MANTENIMIENTO/FORMACION/PRODUCCION)
ES_PLANTILLA / PLANTILLA_ORIGEN_ID / VERSION_TAREA / AMBITO_REUTILIZACION
```
Para TAR-0004: `TIPO_TAREA=DISEÑO`, `ES_PLANTILLA=NO`.

## F-044 — Estado "Preparada" sin precondiciones (VERIFICADO)
Se creó como Preparada sin responsable, criterios, entradas, documentación, validación de recursos ni dependencias resueltas explícitamente.
```
Preparada requiere: responsable/equipo asignado; resultado esperado; criterios de aceptación;
duración/esfuerzo previsto; dependencias resueltas; recursos críticos disponibles
```
Alternativa: solo `BORRADOR`/`PREPARADA`, bloqueando el paso hasta cumplir condiciones.

## F-045 — Fechas opcionales sin modelo alternativo explícito (VERIFICADO)
```
TIPO_PLANIFICACION (FECHAS_CERRADAS/POR_DURACION/POR_OBJETIVO/CONTINUA/SIN_PLANIFICAR)
```
Distingue fecha no necesaria / fecha pendiente / tarea mal cumplimentada.

## Mejoras adicionales sin fricción numerada

1. **Checklist operativo** (`TAREA_CHECKLIST`: ID_ITEM/TAREA_ID/ORDEN/DESCRIPCION/OBLIGATORIO/COMPLETADO/COMPLETADO_POR/FECHA) — permitiría derivar el avance (ver F-039).
2. **Entradas/salidas** (`ENTRADAS_REQUERIDAS`/`SALIDAS_ESPERADAS`).
3. **Prioridad** (`PRIORIDAD_TAREA`, `ORIGEN_PRIORIDAD`: HEREDADA/ESPECIFICA/CALCULADA) — **confirmado que hoy no existe columna `PRIORIDAD` en `06_TAREAS`**.
4. **Recursos y competencias** (competencias requeridas, materiales, herramientas, maquinaria, documentos previos, espacio, tiempo, acompañamiento) — alimentaría al futuro motor por eventos ("hay 3 personas disponibles, ¿qué tareas preparadas pueden ejecutar?").
5. **Separar definición de ejecución** (`EJECUCION_TAREA`: ID_EJECUCION/TAREA_ID/RESPONSABLE_ID/FECHA_INICIO/FECHA_FIN/DURACION_REAL/RESULTADO/OBSERVACIONES/EVIDENCIAS) — una tarea reutilizable podría ejecutarse varias veces sin perder su definición maestra.

## Valoración del propio autor (mantenida)

VERIFICADO: creación e historial funcionan. WARN: "Preparada" no representa preparación real. Hallazgo principal: la tarea funciona como registro de planificación, todavía no como unidad operativa completa (trabajo + responsable + criterio de éxito + recursos + evidencia + aprendizaje).

**Siguiente paso**: crear `TAREA_RESPONSABLE` para TAR-0004 (TAR-0004 → PER-0001), sin modificar código.
