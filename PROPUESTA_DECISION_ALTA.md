# Propuesta consolidada — Mejora de DECISION

**Origen:** fricciones F-052 a F-057, detectadas al dar de alta DEC-0003 (dentro de PRO-0003).
**Estado:** propuesta de diseño, sin desarrollar.

## Esquema real verificado
`DECISION` (`Formularios.js:327-347`): `PROYECTO_ID`, `TITULO`, `CONTEXTO`, `TIPO`, `RESPONSABLE_ID`, `FECHA_LIMITE`, `ESTADO`, `IMPACTO`, `RESOLUCION`, `FECHA_RESOLUCION`, `OBSERVACIONES`. Confirma F-052 (solo vínculo a PROYECTO), F-053 (responsable único sin roles), F-056 (impacto único). `RESOLUCION`/`FECHA_RESOLUCION` ya existen — la regla de "exigir resolución+fecha al aprobar/rechazar" es validación condicional sobre campos existentes, no diseño nuevo.

## F-052 — Decisión vinculada solo al proyecto
```
DECISION_CONTEXTO
- DECISION_ID / ENTIDAD (CAMPANA/PROYECTO/PRODUCTO/PROCESO/TAREA/INCIDENCIA/DOCUMENTO) / REGISTRO_ID / TIPO_RELACION
```
Para DEC-0003: debería poder vincularse también a PRD-0002, PCS-0002, TAR-0004. Prioridad: alta.

## F-053 — Responsable ambiguo
No distingue quién propone, analiza, decide, valida, ejecuta.
```
DECISION_PARTICIPANTE
- DECISION_ID / PERSONA_EQUIPO_ID / ROL / POSICION / FECHA
```
Prioridad: alta.

## Alternativas estructuradas (sin F numerada — parte de F-054)
```
DECISION_ALTERNATIVA
- ID_ALTERNATIVA / DECISION_ID / NOMBRE / DESCRIPCION / VENTAJAS / INCONVENIENTES / COSTE / RIESGO / VIABILIDAD / SELECCIONADA
```
Para DEC-0003: A) Importar solo jerarquía principal, B) Jerarquía + responsables y documentos, C) Importación completa.

## F-054 — Sin alternativas ni criterios
```
CRITERIOS_DECISION / PONDERACION / RESTRICCIONES / SUPUESTOS / DATOS_PENDIENTES
```
Criterios aplicables al propio caso: seguridad, reversibilidad, complejidad, mantenibilidad, cobertura, capacidad de prueba, riesgo de escritura parcial. Prioridad: alta.

## Estado más expresivo (sin F numerada, ligado a F-054/057)
```
BORRADOR / PENDIENTE_INFORMACION / EN_ANALISIS / PENDIENTE_APROBACION / APROBADA / RECHAZADA / POSPUESTA / CANCELADA
```
Regla: `APROBADA`/`RECHAZADA` → resolución + fecha de resolución + decisor obligatorios (**campos ya existen, solo falta la validación condicional**).

## F-056 — Impacto demasiado genérico
```
IMPACTO_TECNICO / IMPACTO_OPERATIVO / IMPACTO_ECONOMICO / IMPACTO_SOCIAL / URGENCIA / REVERSIBILIDAD / RIESGO_NO_DECIDIR
```
Mantener impacto global calculado o manual como resumen. Prioridad: media.

## F-055 — Sin acciones derivadas
```
DECISION_ACCION
- DECISION_ID / TIPO_ACCION / ENTIDAD_DESTINO / REGISTRO_ID / RESPONSABLE_ID / FECHA_OBJETIVO / ESTADO
```
Ejemplos: crear tarea, modificar alcance, actualizar documento, ejecutar simulación, crear incidencia, replanificar proyecto. Prioridad: alta.

## Relación con bloqueos (sin F numerada)
```
BLOQUEA_PROYECTO_ID / BLOQUEA_PROCESO_ID / BLOQUEA_TAREA_ID  (mejor como relación genérica)
```
Alimentaría al futuro motor por eventos: `DECISION_ABIERTA + FECHA_LIMITE_PROXIMA + TAREAS_BLOQUEADAS → proponer priorizar decisión`.

## Documentos y evidencias (sin F numerada)
```
DECISION_DOCUMENTO / DECISION_EVIDENCIA / DECISION_COMENTARIO
```

## F-057 — Sin revisión posterior
```
FECHA_REVISION / REQUIERE_REVISION / CRITERIO_REVISION / RESULTADO_REVISION
```
Útil para decisiones provisionales o reversibles. Prioridad: media.

## Buscadores/filtros y UX condicional (sin F numerada — mismo patrón visto en TAREA_RESPONSABLE F-046/F-050)
Verificado: los desplegables no permiten búsqueda y mezclan personas/equipos (mismo patrón ya registrado). UX condicional por estado (ocultar resolución si abierta; exigirla si cerrada).

## Prioridad recomendada (según el autor)
1. `DECISION_CONTEXTO`
2. `DECISOR_ID`
3. Alternativas
4. `CRITERIOS_DECISION`
5. Acciones derivadas
6. `FECHA_REVISION`
7. Buscadores y filtros

**Hallazgo principal**: la entidad funciona hoy como registro de decisión, no como sistema trazable completo (problema → alternativas → criterios → decisión → justificación → acciones → revisión).
