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

1. ✅ **Hecho.** `package-map.json` declara `module` por archivo de A (CORE, GANTT 3, ECONÓMICO 1, IMPACTO 1, COMPRAS 6, CONVOCATORIAS 2) y `moduleDependencies` con el cierre transitivo. COMPETENCIAS y PRESUPUESTO/FUENTE_FINANCIACION quedan documentados como límite conocido: sus esquemas viven embebidos en `FormularioEsquemas.js`, sin archivo propio.
2. ✅ **Hecho.** `tools/packager/generate-shell-wrappers.mjs` calcula, para un conjunto de módulos, qué envoltorios de cascarón son generables (verificado en real: los 6 módulos completos no dejan huecos; un módulo aislado sí revela huecos reales por el `onOpen()` monolítico).
3. ✅ **Cerrado.** La deuda de los 5 archivos mixtos originales tenía tres causas distintas, no una:
   - **Código de prueba embebido** (`Ids.js`: 6 funciones; `Repository.js`: 65 funciones/9097→1080 líneas) — extraído a `Tests_Ids.js` (nuevo) y `Tests_Repository2.js`. Ninguna de las 71 funciones tenía referencias externas. Verificado: 0 `EMBEDDED_TEST_CODE`, `clasp push` real + smoke test en el Sheet real (panel Personas y equipo, dependiente de `Repository.js`).
   - **Código muerto/obsoleto mal clasificado como mixto** (`Validation.js`, 3057 líneas, 24 funciones) — investigado antes de tocarlo: cero referencias externas en todo el repositorio, valida un esquema de solo 17 hojas cuando el modelo real tiene 37+ entidades. Mismo perfil que los `Instalador*.js`. Reclasificado de `mixed`/A a `auxiliary`/C — cero cambios de código.
   - **Mezcla de capas arquitectónicas activa** — cerrada en `Formularios.js` (separado en `FormularioMotorUI.js`/`FormularioValidacionService.js`/`FormularioEsquemas.js`, ver sección siguiente). `PedidoRecepcion.js` conserva su único backfill sin referencias (`corregirEstadoPedidosExistentes`, ya reclasificado a `auxiliary`/C) pero sigue `mixed:true` — las 5 funciones restantes son UI+DOMINIO activo y no se ha ejecutado su separación (queda como único mixto real, riesgo bajo dado el tamaño del archivo).
4. Publicar una primera versión real de la librería con el Core completo (no la POC de juguete) y un cascarón generado automáticamente, verificado igual que el Paquete A (`clasp push` + prueba real en navegador) — desbloqueado, pendiente de ejecutar.

## Plan de separación de capas — Formularios.js y PedidoRecepcion.js (diseño, no ejecutado)

**Hallazgo que reduce el riesgo del refactor**: en Apps Script no existen módulos/imports — todas las funciones de nivel superior de cualquier `.js` del proyecto comparten un único espacio de nombres global. Mover una función de archivo no requiere tocar ningún llamador: es reorganización pura de archivos fuente, no una reescritura de dependencias. El riesgo real está en (a) la mecánica de extracción (como ya pasó con Ids.js/Repository.js, hay que verificar con conteo de llaves, no a mano) y (b) el tamaño del diff para revisión humana — no en romper referencias.

### PedidoRecepcion.js (232 líneas, 6 funciones) — bajo riesgo, ejecutable en una sesión corta
- `corregirEstadoPedidosExistentes` → reclasificar a auxiliar/C (mismo tratamiento que Validation.js: backfill de un solo uso, sin referencias externas).
- `confirmarRecepcion_`, `actualizarEstadoPedidoTrasRecepcion_`, `obtenerOpcionesRecepcionPendiente` → DOMINIO, quedarían en el archivo (ya es su función principal).
- `abrirConfirmarRecepcion`, `seleccionarYConfirmarRecepcion` → UI_SERVIDOR, candidatas a mover a un archivo de UI si se agrupan con Formularios.js, o quedarse (el archivo ya es pequeño tras retirar el backfill).

### Formularios.js (2987 líneas, 115 funciones + 11 constantes de nivel superior) — ✅ ejecutado y verificado

Inventario real (126 declaraciones de nivel superior, no solo funciones — se encontraron 11 `var` de configuración/esquema que el conteo inicial de "115 funciones" no cubría: `ETIQUETA_ENTIDAD_MVP`, `ENTIDAD_DOCUMENTO_A_MVP`, `ENTIDAD_HORARIO_A_MVP`, `MVP_A_ENTIDAD_DOCUMENTO_`, `MAPAS_DEPENDENCIA_MVP`, `CLAVES_DUPLICADO_MVP`, `ESQUEMAS_FORMULARIO_MVP` de ~900 líneas, `ESTADOS_DECISION_CIERRE_`, `ESTADOS_INCIDENCIA_CIERRE_`, `NIVELES_JERARQUIA_INCIDENCIA_`, `ESTADO_DOCUMENTO_VIGENTE_`). Separado en tres archivos por capa real:

1. **`FormularioMotorUI.js`** (486 líneas, 95 funciones) — UI_SERVIDOR: `onOpen()` + los 6 motores genéricos (`abrirFormularioCrear_`, `abrirFormularioEditarPorId`, `abrirEditarRegistroPorEntidad_`, `abrirSelectorConAccion_`, `abrirFichaPorEntidad_`, `abrirRetorno`) + los ~90 despachadores `abrir*` de una línea.
2. **`FormularioValidacionService.js`** (1365 líneas, 20 funciones) — DOMINIO: `validarReglasNegocio*_` por entidad, `guardarFormulario`, `obtenerEsquemaFormulario`, `validarClavesForaneasFormulario_`, `validarDuplicidadFormulario_`, `normalizarValorFormulario_`, `traducirErrorFuncional_`, y las consultas de apoyo (`obtenerVinculosDeEntidad`, `obtenerOpcionesDependientes`, `obtenerProductoDesdeProyectoProducto`).
3. **`FormularioEsquemas.js`** (1099 líneas, 11 constantes) — CONFIGURACION: los catálogos y esquemas compartidos por los dos archivos anteriores (`ESQUEMAS_FORMULARIO_MVP` es usado tanto por `guardarFormulario`/`obtenerEsquemaFormulario` como por `abrirFormularioEditarPorId`).

**Extracción mecánica, no manual**: el script particiona el archivo en trozos contiguos por posición de bytes (fin de una declaración → fin de la siguiente), no reconoce comentarios por heurística — garantiza cobertura total por construcción, no por verificación posterior. Confirmado antes de aplicar: mismo conjunto de 126 nombres de declaración en origen y en la unión de los 3 destinos, mismo recuento exacto de caracteres no-blancos (96689 en ambos lados).

Verificado: 122/122 + 25/25 tests, `--check` sin `HASH_DIVERGENTE`, generador de envoltorios sigue en 176/0 huecos con los 6 módulos, Paquete A (69 archivos) construye sin error.

## Recordatorio de gobernanza (heredado, sin cambios)
Git local, `clasp push` con autorización explícita, cambios mínimos, verificación humana en Apps Script real antes de dar nada por cerrado — mismo criterio que el resto de este proyecto.
