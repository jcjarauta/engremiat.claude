# Roadmap — Auditoría por bloques y UX/UI (Fase M)

Continúa la numeración de fases del roadmap general (después de Fase L y de la auditoría piloto end-to-end documentada en `PRUEBA_PILOTO_END_TO_END.md`). Se apoya en la matriz de trabajo definida en `AUDITORIA_POR_BLOQUES.md` — este documento la convierte en una secuencia concreta de sesiones, con foco explícito en **comportamiento del sistema y UX/UI**, no solo en corrección técnica.

## Por qué esta fase

La auditoría piloto y el trabajo de Gantt/Desviación se concentraron en **Producción** y en los **outputs**. Personas, Espacios/Recursos y Proveedores/Materiales solo han recibido atención indirecta, como datos de apoyo. Esta fase cierra ese hueco, bloque a bloque, y de paso revisa la usabilidad de todo lo ya construido con ojo crítico ahora que hay más recorrido de uso real acumulado.

## Principio de secuenciación

Mismo criterio que el resto del roadmap: **verificar contra datos/UI reales → construir lo que se decida → prueba reactiva → `clasp push` con autorización explícita → verificación humana en Apps Script real → commit → actualizar este documento y `ROADMAP_BACKLOG_MEJORAS.md`**. Ningún bloque se abre sin cerrar el anterior (orden bottom-up: un hueco en Personas contamina la auditoría de todo lo que depende de Personas).

Los hallazgos de construcción inmediata se implementan igual que en la auditoría piloto (fix en caliente si es un `ERROR`/`BLOQUEO` que bloquea seguir probando); el resto se registra y se decide alcance con el usuario antes de construir, igual que se ha hecho hasta ahora.

## Las 6 dimensiones (recordatorio de `AUDITORIA_POR_BLOQUES.md`)

Input · Modelo de datos · Relaciones · Output · Trazabilidad · Rendimiento/escala.

## Preguntas de UX/UI a aplicar en cada bloque

Esta fase añade una capa explícita de usabilidad sobre las 6 dimensiones, con estas preguntas guía en cada formulario/pantalla revisada:

- ¿Se encuentra la opción en el menú sin tener que buscarla (ubicación lógica, nombre claro)?
- ¿Los campos del formulario siguen un orden que corresponde a cómo se piensa la tarea, no al orden en que se añadieron históricamente?
- ¿Los mensajes de error/validación dicen qué está mal y cómo corregirlo, no solo que algo falló?
- ¿La terminología es consistente entre formulario, menú e informes (mismo nombre para lo mismo en todas partes)?
- ¿La densidad de información es adecuada — ni pantallas vacías que no orientan, ni tablas saturadas sin jerarquía visual?
- ¿Las acciones con efecto real (guardar, cerrar sin guardar, desactivar) tienen la confirmación/feedback adecuado a su reversibilidad?

## Fases

### M1 — Personas (`PERSONA_EQUIPO`, `EQUIPO_MIEMBRO`)
**Por qué primero**: es la dependencia más transversal (referenciada por prácticamente todas las demás entidades vía `RESPONSABLE_ID`/`VALIDADOR_ID`); un hueco aquí se propaga a todo lo demás.

**Alcance**: alta/edición de persona y equipo, asignación de coordinador, disponibilidad/capacidad, cómo se ve una persona reflejada en el resto del sistema (buscadores de responsable, panel, informes).

**Método**: recorrido real en la UI (alta, edición, baja lógica) + las 6 dimensiones + preguntas de UX/UI. Usar los datos de prueba ya sembrados (`PER-0004` a `PER-0008`) como base y ampliar si hace falta un caso no cubierto (p. ej. un Equipo con miembros).

**Entregable**: lista de hallazgos clasificados (plantilla de `AUDITORIA_POR_BLOQUES.md`), decisión de qué se construye ya y qué se difiere.

**Estimación**: 1 sesión.

### M2 — Espacios/Recursos (`RECURSO`, `TAREA_RECURSO`)
**Alcance**: alta/edición de espacio/herramienta/maquinaria/equipo auxiliar, jerarquía de ubicación (recurso dentro de espacio), uso de recursos en tareas, estados físicos (disponible/en uso/en mantenimiento/averiado).

**Método**: igual que M1. Contrastar con los recursos ya sembrados (`ESP-01/02/03`, `MAQ-01`).

**Entregable/Estimación**: igual que M1.

### M3 — Proveedores/Materiales (`PROVEEDOR`, `MATERIAL`, `PEDIDO_PROVEEDOR`, `RECEPCION`, `PRODUCTO_MATERIAL`, `TAREA_MATERIAL`)
**Por qué aquí**: es la conexión menos probada hasta ahora — el ciclo completo proveedor → pedido → recepción → consumo en producción no se ha recorrido de punta a punta con datos reales.

**Alcance**: alta de proveedor/material, ciclo de pedido-recepción, asociación de materiales a producto/tarea (previsto vs. consumido vs. desperdiciado), estados de stock.

**Método**: recorrido real incluyendo el ciclo completo pedido→recepción (no solo altas sueltas). Si faltan datos para probar el cruce con Producción, ampliar los datos de prueba ya sembrados.

**Entregable/Estimación**: igual que M1, previsiblemente algo más larga por el número de entidades relacionadas (proveedor, material, pedido, línea de pedido, recepción, línea de recepción).

### M4 — Producción (pasada final)
**Por qué al final y no antes**: ya es el bloque más maduro (auditoría piloto + esta sesión), pero conviene una pasada de cierre una vez saneados M1-M3, para verificar que las mejoras de esos bloques (p. ej. si se cambia algo en Personas) no dejan nada descolgado en Producción.

**Alcance**: no repetir el recorrido completo de `PRUEBA_PILOTO_END_TO_END.md` — revisar específicamente los puntos que quedaron explícitamente diferidos ahí (agrupación visual en secciones, adjuntar documentos, ficha de registro, búsqueda del lado del servidor, normalización de Versión, normalización de campos "Motivo"/Rol) y decidir cuáles entran en esta iteración.

**Entregable/Estimación**: 1 sesión, alcance a decidir según lo que quede pendiente de la lista anterior.

### M5 — Outputs (informes, Gantt, panel operativo, historial)
**Por qué al final**: los outputs se calculan siempre a partir de Producción y cruzando los demás bloques — solo tiene sentido auditarlos con garantía una vez que las fuentes (M1-M4) están saneadas.

**Alcance**: `ReportService.js` (informes de campaña/proyecto/memoria/excepciones/cambios), `DesviacionService.js` (Gantt + desviación, ya trabajado extensamente esta sesión — revisar si el feedback de UX aplicado al Gantt debe extenderse a los demás informes), `DashboardService.js` (panel operativo), `HistorialService.js`/reversión.

**Entregable/Estimación**: 1 sesión.

## Registro de hallazgos y construcción

Los hallazgos de cada fase se documentan con la plantilla de `AUDITORIA_POR_BLOQUES.md` (sección propia de ese documento, actualizando su tabla de estado) y las decisiones de construcción se reflejan en `ROADMAP_BACKLOG_MEJORAS.md`, igual que en fases anteriores — este documento es el plan de secuenciación, no el lugar donde vive el detalle de cada hallazgo.

## Estado

| Fase | Bloque | Estado |
|---|---|---|
| M1 | Personas | ⬜ Pendiente |
| M2 | Espacios/Recursos | ⬜ Pendiente |
| M3 | Proveedores/Materiales | ⬜ Pendiente |
| M4 | Producción (pasada final) | ⬜ Pendiente |
| M5 | Outputs | ⬜ Pendiente |
