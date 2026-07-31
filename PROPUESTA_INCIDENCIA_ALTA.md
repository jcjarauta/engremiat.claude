# Propuesta consolidada — Mejora de INCIDENCIA

**Origen:** fricciones F-058 a F-065, detectadas al dar de alta INC-0014 (vinculada a CAM-0010/PRO-0003/PRD-0002/PCS-0002/TAR-0004).
**Estado:** propuesta de diseño, sin desarrollar.

## Esquema real verificado
`INCIDENCIA` (`Formularios.js:349+`): cadena de FK dependientes `NIVEL_INCIDENCIA` → `CAMPANA_ID` → `PROYECTO_ID` (dependiente) → `PRODUCTO_ID` (dependiente) → `PROCESO_ID` (dependiente) → ... hasta TAREA. **No existe ningún mecanismo de vínculo INCIDENCIA↔TAREA aparte de esa cadena jerárquica** — confirma la premisa de F-063.

**Observación**: la ausencia de F-063 es, en esencia, el mismo problema que este propio proceso de auditoría resuelve manualmente — cada fricción registrada en `PRUEBA_REAL_CAMPANA.md` es una "incidencia" convertida a mano en tarea de backlog fuera del sistema.

## F-058 — Tipología insuficiente
Catálogo actual: Calidad/Material/Maquinaria/Planificación/Seguridad/Documentación/Otra. Faltan: FUNCIONAL/USABILIDAD/DATOS/INTEGRACIÓN/RENDIMIENTO/TRAZABILIDAD/AUTOMATIZACIÓN. "Otra" debería ser excepcional y exigir explicación. **Barato**: solo ampliar catálogo en `90_CONFIGURACION`, sin cambio de esquema. Prioridad: alta.

## F-059 — Falta de ciclo de corrección completo
```
CAUSA_RAIZ / ACCION_CONTENCION / ACCION_CORRECTORA / ACCION_PREVENTIVA / RESULTADO_VERIFICACION
```
Distinción: contención reduce impacto inmediato; corrección elimina el problema; prevención evita recurrencia; verificación demuestra que la solución funciona. Prioridad: alta.

## F-060 — Responsable ambiguo
```
INCIDENCIA_PARTICIPANTE
- INCIDENCIA_ID / PERSONA_EQUIPO_ID / ROL (DETECTOR/ANALISTA/RESPONSABLE/EJECUTOR/VALIDADOR/OBSERVADOR) / ACTIVO
```
Prioridad: alta.

## F-061 — Falta de evidencias
```
INCIDENCIA_EVIDENCIA / INCIDENCIA_DOCUMENTO
```
Tipos: CAPTURA/LOG/PRUEBA/DOCUMENTO/VIDEO/ENLACE/RESULTADO_INTEGRIDAD. Para INC-0014: captura del formulario, registro TAR-0004, historial HIS-1267, futura prueba de corrección. Prioridad: alta.

## F-062 — Selectores sin búsqueda
Mismo patrón ya visto en TAREA_RESPONSABLE (F-050) y PROYECTO_PRODUCTO (F-021) — la selección jerárquica no escalará. Prioridad: alta.

## F-063 — Incidencia no convertible en tareas (CRÍTICA — justificada, ver observación arriba)
```
INCIDENCIA_TAREA
- ID_RELACION / INCIDENCIA_ID / TAREA_ID / TIPO_RELACION (DETECTADA_EN/CAUSADA_POR/CORRIGE/VERIFICA/PREVIENE/RELACIONADA) / ES_PRINCIPAL / ESTADO / FECHA_VINCULACION / VINCULADO_POR / ACTIVO
```
Para INC-0014: `INC-0014 → TAR-0004 = DETECTADA_EN`, `INC-0014 → nueva tarea = CORRIGE`.

**Flujo propuesto**: `[Crear tarea correctora]` → pedir proceso destino → proponer nombre/descripción → copiar contexto → crear tarea → crear relación → mismo `CORRELATION_ID` → registrar ambos eventos en historial → no cerrar la incidencia automáticamente.

Precarga sugerida: Proceso=contexto de la incidencia, Nombre=acción correctora resumida, Descripción=problema+resultado esperado, Prioridad=heredada, Responsable=heredado o seleccionado, Fecha objetivo=fecha límite de incidencia, Estado=Borrador, Observaciones=referencia a INC-0014. Revisión humana obligatoria antes de guardar.

**NO_GO: crear tareas automáticamente sin confirmación humana.**

Tarea propuesta para INC-0014: "Definir precondiciones del estado Preparada" — cierra el círculo con F-044 (TAREA) y F-033 (PROCESO).

## F-064 — Fecha límite obligatoria para todos los casos
```
TIPO_COMPROMISO  (FECHA_LIMITE / PROXIMA_REVISION / SIN_FECHA)
```
Regla: CRÍTICA/ALTA → fecha límite obligatoria; MEDIA/BAJA → fecha o revisión opcional. Mismo mecanismo que F-045 en TAREA, aplicado a INCIDENCIA. Prioridad: media.

## F-065 — Resolución y cierre no diferenciados
```
FECHA_RESOLUCION / FECHA_VERIFICACION / FECHA_CIERRE / RESUELTA_POR / CERRADA_POR
```
3ª aparición del patrón "estado sin criterio verificable" (tras F-033 PROCESO, F-044 TAREA). Prioridad: alta.

## Mejoras adicionales sin fricción numerada

- **Campos condicionales por estado** (mismo patrón F-042 en TAREA): Abierta→detección, En análisis→causa probable, En resolución→acción+responsable obligatorios, Bloqueada→motivo+decisión, Resuelta→acción+fecha, Cerrada→verificación+validador+fecha, Cancelada→motivo.
- **Duplicidad y recurrencia**: buscar similares antes de crear (mismo tipo+entidad+registro+título+abierta); `[Crear nueva]`/`[Vincular con existente]`/`[Registrar recurrencia]`; `INCIDENCIA_ORIGEN_ID`, `ES_REINCIDENCIA`, `NUM_REPETICIONES`.
- **Severidad separada de prioridad e impacto**: `SEVERIDAD` (gravedad intrínseca) vs `PRIORIDAD` (orden de atención) vs `IMPACTO` (consecuencia observada) vs `URGENCIA` (tiempo disponible) — evita usar "Alta" para varios significados distintos.
- **Alcance y afectación**: `NUM_REGISTROS_AFECTADOS`, `PERSONAS_AFECTADAS`, `PROCESOS_AFECTADOS`, `ENTORNO_AFECTADO` (DEV/TEST/PRODUCCION/DOCUMENTACION/OPERACION).
- **Clasificación de origen**: `ORIGEN_INCIDENCIA` (USO_REAL/AUDITORIA/TEST/EDICION_DIRECTA/IMPORTACION/MOTOR_EVENTOS/USUARIO). Para INC-0014: `USO_REAL`.
- **Bloqueo operativo**: `INCIDENCIA_BLOQUEO` (INCIDENCIA_ID/ENTIDAD/REGISTRO_ID/TIPO_BLOQUEO/ACTIVO) — alimentaría al futuro motor por eventos.
- **Métricas operativas**: `TIEMPO_DETECCION`/`ANALISIS`/`RESOLUCION`/`CIERRE`, `REAPERTURAS` — tiempo medio de resolución, causas frecuentes, recurrencia, eficacia de correctoras.

## Prioridad recomendada (según el autor)
`INCIDENCIA_TAREA`, botón "Crear tarea correctora", `CAUSA_RAIZ`, `ACCION_CONTENCION`, `ACCION_CORRECTORA`, `RESULTADO_VERIFICACION`, roles diferenciados, evidencias, separación resolución-cierre, buscadores.

**Hallazgo principal**: la incidencia detecta y contextualiza correctamente el problema, pero no completa el ciclo operativo (detectar → analizar → convertir en tareas → corregir → verificar → cerrar).
