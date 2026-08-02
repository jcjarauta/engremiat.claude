# Prueba piloto end-to-end del sistema (2026-08-01/02)

Auditoría funcional y de usabilidad guiada paso a paso por el ciclo completo del sistema, tras el cierre de las Fases L1-L5 del roadmap:

```
crear campaña → crear proyecto → asignar producto → crear proceso → crear tarea
→ asignar personas y recursos → registrar incidencias y decisiones
→ consultar panel → generar informe → revisar historial y reversión
```

Caso usado: campaña real simulada de mobiliario infantil (Producción Otoño 2026 → Mobiliario para escuela infantil El Roble → Mesa infantil modelo Roble → Corte y ensamblaje / Lijado y acabado → tareas).

Cada hallazgo se clasificó como `ERROR` / `BLOQUEO` / `FRICCIÓN DE USO` / `MEJORA FUNCIONAL` / `MEJORA DE RENDIMIENTO` / `MEJORA DE TRAZABILIDAD`, y se decidió su implementación al final del recorrido, no sobre la marcha.

## Hallazgos y estado

| # | Paso | Hallazgo | Clasificación | Estado |
|---|------|----------|----------------|--------|
| 1 | Crear campaña | Sin visión global de campañas existentes al crear una nueva | FRICCIÓN DE USO | No implementado |
| 2 | Crear campaña | Falta clasificar `PROCESO` por fase de producción (Preproducción/Producción/Postproducción) | MEJORA FUNCIONAL | ✅ Implementado (`CFG_FASE_PRODUCCION`) |
| 3 | Crear proyecto | `TIPO_PROYECTO` mezclaba tipo/urgencia/estado (Urgente/Importante/Propuesta) | MEJORA FUNCIONAL | ✅ Implementado (6 tipos reales añadidos, antiguos como legado) |
| 4 | Crear proyecto | Campo "Activo" del formulario no tenía ningún efecto real | **ERROR** | ✅ Corregido (quitado del formulario) |
| 5/6 | Crear proyecto | "Fecha inicio/fin real" y "Motivo de replanificación" siempre visibles, aunque no aplicables al crear | FRICCIÓN DE USO | ✅ Implementado (`visibleSi`) |
| 7/9 | Crear proyecto/producto | Formularios en lista plana sin agrupar por bloque | FRICCIÓN DE USO | No implementado — sesión propia (toca el motor de render) |
| 8 | Crear producto | "Código" aparecía antes que los campos de los que depende su autorrelleno | FRICCIÓN DE USO | ✅ Implementado (reordenado) |
| 10 | Transversal | Objetivo/Resultado esperado/Criterios/DoD repetidos idénticos en los 5 niveles jerárquicos | MEJORA FUNCIONAL | ✅ Implementado (diferenciado por nivel) |
| 11 | Crear producto/proyecto | No se pueden adjuntar documentos desde el propio formulario | MEJORA FUNCIONAL | No implementado |
| 12 | Transversal | Falta una "ficha de registro" que agregue jerarquía+documentos+incidencias en un solo sitio | MEJORA FUNCIONAL (grande) | No implementado |
| 13 | Crear producto | "¿Vincular a un proyecto?" como paso posterior (F-015) confundía | FRICCIÓN DE USO | ✅ Implementado (campo inline `PROYECTO_VINCULAR_ID`) |
| 14 | Crear proceso | Etiqueta vacía en el buscador de `PROYECTO_PRODUCTO` (sin campo NOMBRE propio) | **ERROR** | ✅ Corregido (etiqueta compuesta proyecto/producto) |
| 15 | Crear proceso | "Modo de uso" no aclaraba que es opcional ni cuándo aplica cada valor | FRICCIÓN DE USO | ✅ Implementado (catálogo aclarado + texto de ayuda) |
| 16 | Crear proceso | `PRODUCTO_ID`/`PROYECTO_PRODUCTO_ID` sin validación cruzada, combinación inconsistente posible | MEJORA FUNCIONAL | ✅ Implementado (auto-derivación) |
| 17 | Transversal | Buscadores cargan todo del lado del cliente, no escala a miles de registros | MEJORA DE RENDIMIENTO | No implementado |
| 18 | Crear proceso/tarea | "Porcentaje de avance" pedido como obligatorio al crear (siempre 0 al principio) | FRICCIÓN DE USO | ✅ Implementado (oculto al crear, 0 por defecto) |
| 19 | Crear proceso | `CFG_METODO_CALCULO_AVANCE` sin filosofía clara (Manual/Por tareas/Por estado) | MEJORA FUNCIONAL (grande) | No implementado — propuesta: Por tiempo (Gantt) / Por objetivos (`EVENTO_AVANCE`) |
| 20 | Crear tarea | "Tarea predecesora"/"Proceso predecesor" mostraban todo el sistema, no solo el contexto | FRICCIÓN DE USO | ✅ Implementado (`fk_dependiente` filtrado) |
| 21 | Crear material | Sin gestión de catálogos desde la UI; "Otro" era una etiqueta muerta | MEJORA FUNCIONAL | ✅ Implementado (gestión real + alta rápida vía "Otro" en todo el sistema) |
| 22 | Crear material | "Ubicación" era texto libre en vez de usar los Recursos-Espacio ya normalizados | MEJORA FUNCIONAL | ✅ Implementado (buscador fk filtrado) |
| 23 | Transversal | Menú organizado por tipo de entidad y orden histórico, no por contexto de uso | MEJORA FUNCIONAL | ✅ Implementado (reorganizado en 6 grupos) |
| 24 | Crear producto | "Versión" texto libre sin normalizar | MEJORA FUNCIONAL | No implementado — propuesta: Mayor.Menor con autosugerencia |
| 25 | Transversal | 5 campos "Motivo de..." + `ROL_EN_EQUIPO` texto libre para razones semi-cerradas | MEJORA FUNCIONAL | No implementado — mecanismo de catálogo+"Otro" ya existe, falta aplicarlo |
| UX-2 | Transversal | Errores de validación solo se mostraban de uno en uno al guardar | FRICCIÓN DE USO | ✅ Implementado (valida todos los obligatorios de golpe) |
| UX-3 | Transversal | Cerrar el diálogo sin guardar perdía los datos sin avisar | FRICCIÓN DE USO | ✅ Implementado (botón Cancelar + confirmación) |
| UX-5 | Transversal | Catálogos sin valor por defecto aunque hubiera uno obvio (Estado=Borrador) | FRICCIÓN DE USO | ✅ Implementado (`valorPorDefecto`, solo al crear) |
| UX-7 | Transversal | Campos numéricos sin límites básicos (negativos, %>100) | FRICCIÓN DE USO | ✅ Implementado (`min`/`max` HTML5) |

**Total: 27 hallazgos. 19 implementados y verificados en real durante esta sesión. 8 pendientes, documentados con alcance para retomar cuando corresponda.**

## Bug real corregido durante la implementación (no es un hallazgo del recorrido, salió al construir)

Al ampliar el catálogo `TIPO_PROYECTO` (ya existente, 3 valores) se usó por error `crearCatalogoNuevoL3_` (pensado para categorías nuevas desde cero) en vez de `ampliarCatalogoL2_`. Esto añadió las 6 filas nuevas al final de toda la hoja `90_CONFIGURACION` en vez de junto al bloque original, y el named range `CFG_TIPO_PROYECTO` quedó abarcando (mín a máx fila) todo lo que había entre medias — mezclando valores de otros catálogos en el desplegable de "Tipo de proyecto". Corregido el instalador y añadida `CorregirCatalogoTipoProyecto.js` para reubicar las filas; verificado en real (rango final correcto, filas 18-26, 9 valores).

## Pendientes para retomar (con alcance ya definido)

- **Agrupación visual en secciones** (#7/#9): requiere ampliar `FormularioGenerico.html` para renderizar cabeceras de sección a partir de una nueva propiedad de esquema (`seccion: '...'`). El más valioso de los pendientes, pero toca el motor de render usado por los ~25 formularios.
- **Adjuntar documentos desde cualquier formulario** (#11): reutilizar el patrón de campo inline de F-015/#13 para DOCUMENTO, con dos caminos ("nuevo documento" o "de la biblioteca" vía `VINCULO`).
- **Ficha de registro** (#12): vista de consulta con jerarquía+documentos+incidencias/decisiones en un solo sitio. Bloque de fase completo.
- **Búsqueda del lado del servidor** (#17): sustituir el `<datalist>` client-side por búsqueda con `google.script.run` y debounce cuando el volumen de datos lo justifique.
- **Simplificación de avance** (#19): dos modos (Por tiempo con vista Gantt / Por objetivos con entidad `EVENTO_AVANCE`), sustituyendo Manual/Por tareas/Por estado.
- **Versión estructurada** (#24): Mayor.Menor con autosugerencia, mismo patrón que `ORDEN_SECUENCIA`.
- **Normalización de campos "Motivo"/"Rol"** (#25): aplicar el catálogo+"Otro" ya construido (#21) a `MOTIVO_BLOQUEO`, `MOTIVO_POSPOSICION`, `MOTIVO_CANCELACION`, `MOTIVO_REPLANIFICACION`, `MOTIVO_DESVIACION` y `ROL_EN_EQUIPO`.
