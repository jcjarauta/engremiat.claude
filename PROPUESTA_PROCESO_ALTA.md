# Propuesta consolidada — Mejora del alta de proceso

**Origen:** dos documentos complementarios sobre PCS-0002 ("Definir contrato y plantilla de importación", dentro de PRD-0002):
- Diseño previo a la creación → F-026 a F-030
- Revisión posterior a la creación real → F-031 a F-035

**Estado:** propuesta de diseño, sin desarrollar.

## F-026 a F-030 (diseño previo)

### F-026 — Proceso relacionado solo con el producto maestro
Un producto reutilizado puede tener procesos distintos según el proyecto, pero el alta solo permite seleccionar `PRODUCTO`, no `PROYECTO_PRODUCTO`. **Extiende hacia PROCESO el mismo patrón de ambigüedad de reutilización visto en F-022 (PROYECTO_PRODUCTO).**

```
PROYECTO_PRODUCTO_ID
PRODUCTO_ID
TIPO_CONTEXTO  (MAESTRO_REUTILIZABLE / ESPECIFICO_PROYECTO / ADAPTACION)
```

Para PCS-0002 debería quedar relacionado con `PPR-0002`, sin eliminar la referencia a `PRD-0002`.

### F-027 — Duración sin esfuerzo
`DURACION_PREVISTA_DIAS` no indica cuánto trabajo requiere (ej. 5 días de duración calendario vs 8h de esfuerzo real). Añadir `ESFUERZO_PREVISTO_HORAS`, `ESFUERZO_REAL_HORAS`. Necesario para capacidad, presupuesto y simulación. Complementa F-031 (`TIPO_DURACION`), no lo duplica.

### F-028 — Dependencias más expresivas
Un único `PROCESO_PREDECESOR_ID` solo permite dependencia simple.

```
PROCESO_DEPENDENCIA
- PROCESO_ORIGEN_ID
- PROCESO_DESTINO_ID
- TIPO_DEPENDENCIA  (FIN_A_INICIO / INICIO_A_INICIO / FIN_A_FIN / BLOQUEA / REQUIERE)
- DESFASE_DIAS
```

3ª aparición del mecanismo de grafo de relaciones (tras `PROYECTO_RELACION`, `PRODUCTO_RELACION`).

### Responsable único insuficiente (sin F asignada)

```
PROCESO_PARTICIPANTE
- PROCESO_ID
- PERSONA_EQUIPO_ID
- ROL  (RESPONSABLE / EJECUTOR / VALIDADOR / APOYO / CONSULTADO)
- DEDICACION
- FECHA_INICIO
- FECHA_FIN
```

5ª aparición del patrón de asignación N:M persona/equipo. En el formulario inicial puede mantenerse un responsable principal.

### Fechas rígidas (mismo patrón que CAMPANA/PROYECTO, sin F asignada)

```
TIPO_PLANIFICACION
- FECHAS_CERRADAS / POR_DURACION / POR_OBJETIVO / POR_HITO / CONTINUO
```

En muchos procesos bastaría con duración prevista + dependencias + fecha objetivo, calculando el sistema las fechas.

### F-029 — Avance manual poco fiable
`PORCENTAJE_AVANCE` manual puede quedar incoherente con las tareas reales — **patrón nuevo, no visto en niveles anteriores de la prueba**.

```
METODO_CALCULO_AVANCE
- MANUAL / POR_TAREAS / PONDERADO / POR_HITOS
```

Para procesos con tareas: `AVANCE_PROCESO = avance agregado de tareas`. La edición manual debería quedar justificada y registrada.

### F-030 — Falta de criterio de finalización
```
OBJETIVO_PROCESO
RESULTADO_ESPERADO
CRITERIOS_ACEPTACION
DEFINITION_OF_DONE
VALIDADOR_ID
```
**Se solapa sustancialmente con F-035 más abajo — fusionar en un único bloque de diseño al implementar, no tratar como dos mejoras independientes.**

### Entradas y salidas (parte de F-030/F-035, sin F propia)
```
ENTRADAS
SALIDAS
DOCUMENTOS_REQUERIDOS
ENTREGABLE_GENERADO_ID
```

### Riesgos y bloqueos (sin F asignada)
```
RIESGO
BLOQUEO_ACTUAL
MOTIVO_BLOQUEO
DECISION_REQUERIDA_ID
```
Necesario para que el futuro motor por eventos pueda proponer acciones ante procesos bloqueados.

### Plantillas de procesos (sin F asignada)
```
ES_PLANTILLA
PLANTILLA_ORIGEN_ID
VERSION_PLANTILLA
```
Para procesos repetibles (análisis, diseño, desarrollo, pruebas, validación, documentación, despliegue).

---

## F-031 a F-035 (revisión posterior a la creación real)

## Verificación de código relevante

No existe ninguna regla en `IntegrityService.js` que compare `DURACION_PREVISTA_DIAS` con el rango `FECHA_INICIO_PLAN`↔`FECHA_FIN_PLAN` para PROCESO (sí existe algo similar para TAREA). El caso real de PCS-0002 (5 días previstos, 8 días naturales de rango) no lo detecta nada hoy — confirma F-031 como gap real, no solo ambigüedad conceptual.

## 1. Duración temporal ambigua (F-031)

```
TIPO_DURACION
- DIAS_NATURALES / DIAS_LABORABLES / HORAS / JORNADAS
```
Calcular automáticamente la fecha final cuando exista calendario laboral.

## 2. Campos vacíos no normalizados (F-032 — patrón sistémico, no solo de PROCESO)

Contrato único propuesto: campo opcional vacío → `null`; texto vacío permitido → `""`; campo ausente → error o valor por defecto explícito. **Si se aborda, debe ser una decisión única en `insertarRegistroTransaccional`, no arreglo por entidad** — el mismo patrón aparece en CAMPANA/PROYECTO con `FECHA_INICIO_REAL:""`.

## 3. Fecha interna en UTC poco legible

Registrar también `FECHA_LOCAL` y `TIMEZONE` explícitos; reservar timestamps UTC para eventos con hora real.

## 4. Estado "Preparado" sin criterio verificable (F-033)

```
BORRADOR    → definición incompleta
PREPARADO   → responsable asignado + fechas/duración definidas + entradas
              disponibles + dependencias resueltas + criterio de salida
EN_PROCESO  → fecha real de inicio informada
TERMINADO   → resultado validado + fecha real de fin + avance 100%
```

## 5. Orden de secuencia manual (sin número de fricción formal)

`ORDEN_SECUENCIA` manual arriesga duplicados, huecos, conflictos al insertar procesos intermedios. Propuesta: autogenerar, reordenación visual, detectar duplicidades, recalcular, no asumir que orden implica dependencia.

## 6. Predecesor único (sin número de fricción formal)

`PROCESO_PREDECESOR_ID` no soporta varios predecesores, dependencias condicionales, bloqueos externos, relaciones paralelas. Se mantiene la propuesta ya existente de `PROCESO_DEPENDENCIA` N:M (mismo patrón de grafo de relaciones visto en PROYECTO_RELACION/PRODUCTO_RELACION).

## 7. Falta de tipo de proceso (F-034 — 3ª aparición del patrón de clasificación)

```
TIPO_PROCESO   (ANALISIS/DISEÑO/DESARROLLO/PRUEBAS/VALIDACION/DOCUMENTACION/DESPLIEGUE/MANTENIMIENTO)
FASE_PROYECTO
```
Para PCS-0002: `TIPO_PROCESO=DISEÑO`, `FASE_PROYECTO=PREPARACION`.

## 8. Falta de entradas y salidas estructuradas (F-035)

```
ENTRADAS_REQUERIDAS
SALIDAS_ESPERADAS
DOCUMENTOS_GENERADOS
CRITERIOS_ACEPTACION
```
Para PCS-0002: entradas = modelo de datos, catálogos, Repository, IntegrityService; salidas = contrato de plantilla, esquema de referencias, reglas de validación.

## 9. Falta de relación con hitos y entregables (sin número de fricción formal)

`PROCESO_HITO`, `PROCESO_ENTREGABLE`, `PROCESO_DOCUMENTO`, `PROCESO_DECISION`.

## 10. Falta de capacidad y recursos (sin número de fricción formal)

`ESFUERZO_PREVISTO_HORAS`, `DEDICACION_PREVISTA`, `EQUIPO_RESPONSABLE_ID`, `RECURSOS_REQUERIDOS`.

## 11. Falta de gestión de bloqueos (sin número de fricción formal)

`ESTADO_BLOQUEO`, `MOTIVO_BLOQUEO`, `BLOQUEADO_DESDE`, `DECISION_REQUERIDA_ID` — pieza necesaria para el futuro motor por eventos.

## 12. Falta de revisión y aprobación (sin número de fricción formal)

`VALIDADOR_ID`, `FECHA_REVISION`, `RESULTADO_REVISION`, `OBSERVACIONES_REVISION`.

## Prioridad recomendada (según valoración del propio autor de la propuesta)

Antes que presupuesto o automatización: `TIPO_PROCESO`, `TIPO_DURACION`, `ESFUERZO_PREVISTO_HORAS`, `CRITERIOS_ACEPTACION`, `PRECONDICIONES_DE_ESTADO`.
