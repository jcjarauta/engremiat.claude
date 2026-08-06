# Propuesta — Core como librería protegida + producto modular replicable

**Fecha:** 2026-08-06
**Contexto:** decisión estratégica de escalar el sistema como producto comercial, replicable por organización (Camino A: plantilla, no SaaS centralizado — ver `MANUAL_MARCO_FUNDAMENTAL.md` y la conversación de asesoría técnica de la sesión), con la condición explícita de que el cliente pueda autogestionar la implementación **sin acceso a la lógica del programa**.

## Por qué ocultar la lógica ahora sí se justifica

No es "un cliente cotilla mira el código" — el Core está dejando de ser un script interno para convertirse en el motor propietario de un ecosistema más amplio (integraciones con n8n, Obsidian, un grafo de relaciones, IA local y externa, y un módulo de alcance a comunidades/preventas). Con IA externa y herramientas de terceros tocando el sistema, y de cara a comunidades externas, proteger la implementación deja de ser opcional.

## La única forma nativa de Apps Script de ocultar lógica: Library

Google Apps Script no tiene "compilar" — si el cliente tiene el Sheet con el script vinculado, por defecto ve el 100% del código. La única forma real de que el cliente ejecute el sistema sin ver su implementación es el patrón de **librería**: el Core vive en un proyecto Apps Script propio (standalone), publicado como librería versionada; el Sheet del cliente tiene solo un **cascarón fino** que declara la librería como dependencia (Script ID + versión) y expone los puntos de entrada necesarios. El cliente nunca recibe permiso de Editor/Viewer sobre el proyecto de la librería.

## POC realizada — resultado: viable, con un coste concreto y ya medido

Antes de comprometer los 63 archivos de producción a este patrón, se hizo una prueba de concepto aislada (dos proyectos Apps Script reales, uno standalone como librería, uno bound a un Sheet nuevo como cascarón), para validar las dos preguntas técnicas de mayor riesgo:

1. **¿`SpreadsheetApp.getActiveSpreadsheet()` dentro de una función de librería resuelve el Sheet del cliente, o algo del contexto de la librería?**
   ✅ **Confirmado con evidencia real (Apps Script real, no simulado)**: resuelve correctamente el Sheet del cliente. El "hoja activa" depende del contexto de ejecución (qué sesión/menú lo disparó), no de en qué proyecto vive el código. Esto significa que la inmensa mayoría de `Repository.js`, `IntegrityService.js`, etc. — que dependen implícitamente de `getActiveSpreadsheet()`/`getActive()` — puede migrar a la librería sin reescritura estructural.

2. **¿`HtmlService.createTemplateFromFile()` resuelve plantillas que viven dentro del proyecto librería, cuando se invoca desde código de la librería?**
   ✅ **Confirmado**: sí, sin problema. Las 21 HTML del sistema pueden vivir junto al código de producción dentro de la librería, no en el cascarón.

3. **¿`google.script.run` desde una plantilla HTML renderizada por la librería resuelve directamente contra la librería, o necesita un envoltorio en el cascarón?**
   ❌→✅ **Confirmado el coste real**: `google.script.run` **no** resuelve contra la librería — solo conoce funciones globales del proyecto contenedor (el cascarón). Sin envoltorio, falla en el navegador con `TypeError: ... is not a function` (verificado en la consola real del navegador). Con un envoltorio de una línea en el cascarón (`function x(a){ return Poc.x(a); }`), funciona de punta a punta sin más fricción.

## Consecuencia concreta para la migración real

Cada punto de entrada necesita un envoltorio de una línea en el cascarón del cliente:
- Cada `addItem('Nombre', 'funcion')` del menú (~90 en `onOpen()` hoy).
- Cada función invocada vía `google.script.run` desde las 21 HTML (entre 100 y 150 llamadas distintas, sin deduplicar).
- Los triggers simples (`onOpen`, `onEdit`) — Apps Script no los detecta si solo existen en la librería.

Esto son entre 150 y 250 envoltorios mecánicos, generables automáticamente a partir de la matriz de módulos del packager (`tools/packager/package-map.json`) en vez de escritos a mano — es la siguiente pieza de herramienta a construir, no trabajo manual por archivo.

## Siguiente paso propuesto

1. ✅ **Hecho.** `package-map.json` declara `module` por archivo de A (CORE 55, GANTT 3, ECONÓMICO 1, IMPACTO 1, COMPRAS 6, CONVOCATORIAS 2) y `moduleDependencies` con el cierre transitivo. COMPETENCIAS y PRESUPUESTO/FUENTE_FINANCIACION quedan documentados como límite conocido: sus esquemas viven embebidos en `Formularios.js`, sin archivo propio.
2. ✅ **Hecho.** `tools/packager/generate-shell-wrappers.mjs` calcula, para un conjunto de módulos, qué envoltorios de cascarón son generables (verificado en real: los 6 módulos completos no dejan huecos; un módulo aislado sí revela huecos reales por el `onOpen()` monolítico).
3. **Prácticamente cerrado.** La deuda de los 5 archivos mixtos originales tenía tres causas distintas, no una:
   - **Código de prueba embebido** (`Ids.js`: 6 funciones; `Repository.js`: 65 funciones/9097→1080 líneas) — ✅ extraído a `Tests_Ids.js` (nuevo) y `Tests_Repository2.js`. Ninguna de las 71 funciones tenía referencias externas. Verificado: 0 `EMBEDDED_TEST_CODE`, 122/122 + 25/25 tests, `clasp push` real + smoke test en el Sheet real (panel Personas y equipo, dependiente de `Repository.js`).
   - **Código muerto/obsoleto mal clasificado como mixto** (`Validation.js`, 3057 líneas, 24 funciones) — investigado antes de tocarlo: **cero referencias externas** en todo el repositorio (ni menú, ni otro archivo), y valida un esquema de solo 17 hojas cuando el modelo real tiene 37+ entidades (falta Proveedor, Asignación, Relación... hasta Convocatoria/EtiquetaImpacto). Mismo perfil que los `Instalador*.js`: ejecución manual, nunca en el camino de producción. ✅ Reclasificado de `mixed`/A a `auxiliary`/C — cero cambios de código, solo metadatos del packager. Reversible.
   - **Mezcla de capas arquitectónicas activa** (UI_SERVIDOR + DOMINIO interleaved, código realmente vivo y referenciado desde el menú) — sigue abierta en `Formularios.js` (2987 líneas, 115 funciones, ~90 de ellas envoltorios de un menú de `onOpen()` que sí se ejecuta) y `PedidoRecepcion.js` (232 líneas, 6 funciones; una de ellas, `corregirEstadoPedidosExistentes`, es también un backfill de un solo uso sin referencias, candidata a reclasificar igual que `Validation.js`). Plan de separación: ver sección siguiente.
4. Publicar una primera versión real de la librería con el Core completo (no la POC de juguete) y un cascarón generado automáticamente, verificado igual que el Paquete A (`clasp push` + prueba real en navegador) — bloqueado hasta cerrar el punto 3.

## Plan de separación de capas — Formularios.js y PedidoRecepcion.js (diseño, no ejecutado)

**Hallazgo que reduce el riesgo del refactor**: en Apps Script no existen módulos/imports — todas las funciones de nivel superior de cualquier `.js` del proyecto comparten un único espacio de nombres global. Mover una función de archivo no requiere tocar ningún llamador: es reorganización pura de archivos fuente, no una reescritura de dependencias. El riesgo real está en (a) la mecánica de extracción (como ya pasó con Ids.js/Repository.js, hay que verificar con conteo de llaves, no a mano) y (b) el tamaño del diff para revisión humana — no en romper referencias.

### PedidoRecepcion.js (232 líneas, 6 funciones) — bajo riesgo, ejecutable en una sesión corta
- `corregirEstadoPedidosExistentes` → reclasificar a auxiliar/C (mismo tratamiento que Validation.js: backfill de un solo uso, sin referencias externas).
- `confirmarRecepcion_`, `actualizarEstadoPedidoTrasRecepcion_`, `obtenerOpcionesRecepcionPendiente` → DOMINIO, quedarían en el archivo (ya es su función principal).
- `abrirConfirmarRecepcion`, `seleccionarYConfirmarRecepcion` → UI_SERVIDOR, candidatas a mover a un archivo de UI si se agrupan con Formularios.js, o quedarse (el archivo ya es pequeño tras retirar el backfill).

### Formularios.js (2987 líneas, 115 funciones) — refactor grande, requiere plan propio
Perfil real tras inventariar las 115 funciones:
- **~90 funciones `abrir*`**: UI_SERVIDOR puro — envoltorios de una a tres líneas que delegan en un puñado de motores genéricos (`abrirFormularioCrear_`, `abrirFormularioEditarPorId`, `abrirEditarRegistroPorEntidad_`, `abrirSelectorConAccion_`, `abrirFichaPorEntidad_`, `abrirRetorno`) más `onOpen()` (el menú real, ~100 `addItem`).
- **~12 funciones `validarReglasNegocio*_`**: DOMINIO — reglas de negocio específicas por entidad (Material, Tarea, TareaResponsable, Documento, Incidencia, Decisión, PersonaEquipo, EquipoMiembro, Horario, TareaMaterial).
- **`guardarFormulario`, `obtenerEsquemaFormulario`, `validarClavesForaneasFormulario_`, `validarDuplicidadFormulario_`, `normalizarValorFormulario_`, `traducirErrorFuncional_`**: el orquestador de guardado genérico + esquema — CONFIGURACION/DOMINIO, el núcleo real de la capa de formularios.
- **`obtenerOpcionesDependientes`, `obtenerOpcionesEntidadParaSelector`, `etiquetaExtraSelector_`, `obtenerProductoDesdeProyectoProducto`, `obtenerVinculosDeEntidad`**: consultas de apoyo a la UI.

Propuesta de destino (a validar con el usuario antes de ejecutar, no decidido en firme):
1. `FormularioMotorUI.js` — los ~90 `abrir*` uno-línea + `onOpen()` + los 6 motores genéricos. Es, de lejos, el bloque más grande pero también el más mecánico y de menor riesgo semántico (son despachadores, no lógica).
2. `FormularioValidacionService.js` — los `validarReglasNegocio*_` (reglas por entidad).
3. Núcleo (`guardarFormulario` + esquema + normalización) — a decidir si queda en `Formularios.js` (renombrado a algo como `FormularioCoreService.js`) o se funde con (2).

No ejecutar sin confirmación explícita: es un diff de ~2900 líneas movidas, con más superficie de revisión humana que las extracciones anteriores (aunque el riesgo de romper referencias sea bajo por la razón explicada arriba).

## Recordatorio de gobernanza (heredado, sin cambios)
Git local, `clasp push` con autorización explícita, cambios mínimos, verificación humana en Apps Script real antes de dar nada por cerrado — mismo criterio que el resto de este proyecto.
