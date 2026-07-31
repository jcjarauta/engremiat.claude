# Propuesta consolidada — Mejora del alta y planificación de proyectos

**Origen:** fricciones F-008 a F-013 de `PRUEBA_REAL_CAMPANA.md`, detectadas al dar de alta PRO-0003 ("Ingreso masivo de datos", dentro de CAM-0010).
**Estado:** propuesta de diseño, sin desarrollar. No se toca código hasta cerrar la prueba operativa real completa.

## 1. Estado actual (verificado)

`TIPO_PROYECTO` ofrece hoy: `Urgente`, `Importante`, `Propuesta` — mezcla tipo/naturaleza, prioridad y madurez en un único catálogo.

## 2. Clasificación: separar tres conceptos

```
TIPO_PROYECTO   (Desarrollo / Mejora continua / Auditoría / Implantación / Integración /
                 Mantenimiento / Investigación / Formación / Producción / Comunitario /
                 Documentación / Simulación)
PRIORIDAD       (Crítica / Alta / Media / Baja)
MADUREZ_PROYECTO (Idea / Propuesta / En evaluación / Aprobado / Rechazado)
CUADRANTE       (opcional — Urgente e importante / Importante no urgente / Urgente no
                 importante / No urgente ni importante; no usar como catálogo principal)
```

Para PRO-0003: `TIPO_PROYECTO=Desarrollo`.

## 3. Responsables, equipos y relaciones

**Alta mínima**: `RESPONSABLE_PRINCIPAL_ID`, `EQUIPO_RESPONSABLE_ID`, `REFERENTE_FUNCIONAL_ID`, `REFERENTE_TECNICO_ID`.

**Relación ampliable N:M** (`PROYECTO_PARTICIPANTE`: `ID_RELACION`, `PROYECTO_ID`, `PERSONA_EQUIPO_ID`, `ROL`, `RESPONSABILIDAD`, `PORCENTAJE_DEDICACION`, `FECHA_INICIO`, `FECHA_FIN`, `ACTIVO`; roles: RESPONSABLE/COORDINADOR/DESARROLLADOR/VALIDADOR/USUARIO_CLAVE/APOYO/OBSERVADOR).

**Relación entre equipos** (`PROYECTO_EQUIPO`: `PROYECTO_ID`, `EQUIPO_ID`, `TIPO_RELACION`, `RESPONSABILIDAD`, `NIVEL_IMPLICACION`, `ACTIVO`; tipos: PROPIETARIO/COLABORADOR/CONSULTADO/INFORMADO/DEPENDENCIA/PROVEEDOR_INTERNO).

**Nota de diseño (unificación, confirmada con esta tercera aparición del mismo patrón)**: `CAMPANA_RESPONSABLE`, `PROYECTO_PARTICIPANTE`/`PROYECTO_EQUIPO` y tarea↔persona/equipo son el mismo problema estructural repetido tres veces. Diseñar una única relación polimórfica de asignación (`ENTIDAD_TIPO`, `ENTIDAD_ID`, `PERSONA_EQUIPO_ID`, `ROL`, `DEDICACION`, fechas) reutilizable en CAMPANA/PROYECTO/TAREA, no tres tablas paralelas.

## 4. Planificación temporal

Mismo problema que CAMPANA. `TIPO_PLANIFICACION` (Fechas cerradas / Continua / Por objetivos / Por hitos / Iterativa / Recurrente), `FECHA_INICIO_PLAN`, `FECHA_FIN_PLAN`, `FECHA_REVISION`, `HORIZONTE_PLANIFICACION`, `CADENCIA_REVISION`. Para desarrollo de software: `ITERACION_ACTUAL`, `DURACION_ITERACION_DIAS`, `FECHA_SIGUIENTE_REVISION`.

## 5. Calendario

Igual que CAMPANA: LaTroballa fuente de verdad, sincronización unidireccional → Google Calendar (inicio, revisión, hitos, reuniones, entregas, bloqueos, tareas críticas).

## 6. Objetivo, alcance y entregables

`OBJETIVO`, `ALCANCE`, `FUERA_DE_ALCANCE`, `JUSTIFICACION`, `RESULTADOS_ESPERADOS`, `CRITERIOS_EXITO`, `CRITERIO_CIERRE`.

**Entregables** (`PROYECTO_ENTREGABLE`: `ID_ENTREGABLE`, `PROYECTO_ID`, `NOMBRE`, `DESCRIPCION`, `TIPO`, `ESTADO`, `FECHA_OBJETIVO`, `CRITERIO_ACEPTACION`, `RESPONSABLE_ID`).

Ejemplo para "Ingreso masivo de datos": E1 Contrato de plantilla, E2 Área de staging, E3 Validación dryRun, E4 Importación transaccional, E5 Reversión, E6 Informe de resultados, E7 Pruebas de regresión.

## 7. Dependencias y relaciones entre proyectos

```
PROYECTO_RELACION
- PROYECTO_ORIGEN_ID
- PROYECTO_DESTINO_ID
- TIPO_RELACION   (DEPENDE_DE / BLOQUEA / DUPLICA / COMPLEMENTA / SUSTITUYE / COMPARTE_RECURSOS)
- DESCRIPCION
```

Pieza base necesaria para el futuro simulador/motor por eventos (detección de bloqueos y cuellos de botella entre proyectos).

## 8. Presupuesto y recursos (prioridad media — el más especulativo del lote)

`PRESUPUESTO_ESTIMADO`, `PRESUPUESTO_APROBADO`, `COSTE_REAL`, `MONEDA`; `HORAS_ESTIMADAS`, `HORAS_ASIGNADAS`, `HORAS_REALES`; `NUM_PERSONAS_PREVISTAS`, `CAPACIDAD_DISPONIBLE`, `RECURSOS_CRITICOS`, `HERRAMIENTAS_CRITICAS`, `MATERIALES_CRITICOS`; `VIABILIDAD_TECNICA/OPERATIVA/ECONOMICA/TEMPORAL` (ALTA/MEDIA/BAJA/NO_EVALUADA); `RIESGO_GLOBAL`, `NIVEL_CONFIANZA_ESTIMACION`.

## 9. Valor e impacto (puntuación auditable, no delegada a IA)

`IMPACTO_OPERATIVO`, `IMPACTO_SOCIAL`, `IMPACTO_TECNICO`, `URGENCIA`, `ESFUERZO_ESTIMADO`, `RIESGO`, `VALOR_ESPERADO`.

```
PRIORIDAD_CALCULADA = IMPACTO + URGENCIA + RIESGO_EVITADO - ESFUERZO - DEPENDENCIAS
```

## 10. Riesgos, supuestos y restricciones

`RIESGOS`, `SUPUESTOS`, `RESTRICCIONES`, `DEPENDENCIAS_EXTERNAS`, `DECISIONES_PENDIENTES`.

Para PRO-0003 en concreto:
- Riesgo: duplicar reglas de validación fuera de `Repository.js`.
- Restricción: no escribir directamente en hojas maestras.
- Dependencia: cierre de auditoría y baseline estable.
- Supuesto: el repositorio actual seguirá siendo la única vía de escritura.

## 11. Documentación y repositorio

`DOCUMENTO_BASE_ID`, `CARPETA_DRIVE_URL`, `REPOSITORIO_URL`, `RAMA_GIT`, `ISSUE_TRACKER_URL`; para proyectos de software además `BASELINE_ID`, `VERSION_OBJETIVO`, `COMMIT_INICIAL`, `COMMIT_CIERRE`.

## 12. UX del formulario

Problemas: desplegable mezcla conceptos, campos descriptivos estrechos, formulario largo sin resumen contextual, fechas antes de explicar el tipo de planificación.

Estructura propuesta: identificación → clasificación y prioridad → objetivo y alcance → responsables y equipos → planificación e hitos → recursos y viabilidad → dependencias y riesgos → documentación → resumen y validación.

Acciones: `[Guardar borrador] [Validar] [Guardar] [Guardar y crear entregable] [Guardar y crear proceso]`.

## Recomendación para la prueba actual

No se modifica el modelo ahora. Para PRO-0003: `TIPO_PROYECTO=Importante` como prioridad provisional, fechas como horizonte revisable, seguir adelante.

**Hallazgo principal**: antes de añadir presupuesto o calendario, corregir la semántica básica de PROYECTO — qué tipo de trabajo es, qué entrega, quién responde, de qué depende y cuándo se considera terminado. Mismo criterio que en CAMPANA (ver `PROPUESTA_CAMPANA_ALTA_PLANIFICACION.md`).
