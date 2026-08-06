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
   - **Mezcla de capas arquitectónicas activa** — cerrada en `Formularios.js` (separado en `FormularioMotorUI.js`/`FormularioValidacionService.js`/`FormularioEsquemas.js`) y en `PedidoRecepcion.js`: sus 3 funciones de DOMINIO (`confirmarRecepcion_`, `actualizarEstadoPedidoTrasRecepcion_`, `obtenerOpcionesRecepcionPendiente`) quedaron en `PedidoRecepcionService.js` (mismo nombre de servicio que el resto del proyecto) y sus 2 manejadores de UI (`abrirConfirmarRecepcion`, `seleccionarYConfirmarRecepcion`) se movieron a `FormularioMotorUI.js`, junto al resto de despachadores de menú.

**Resultado: 0 archivos `mixed` en todo el proyecto** (`MIXED_FILES` vacío en `build-packages.mjs`). Verificado: `--check` limpio sin ningún `WARN MIXED_ARCHITECTURE`, 122/122 + 25/25 tests, Paquete A (69 archivos) construye sin error, generador de envoltorios sigue en 176/0 huecos, `clasp push` real + smoke test en el Sheet real ("Nueva tarea" y "Editar Campaña" abren correctamente tras la separación de `Formularios.js`).

Efecto colateral positivo: al implementar el recuento por módulo en 0 (`MIXED_FILES` vacío), se encontró y corrigió un bug real en `validatePackageMap` — comparaba `categoryCounts.get(category) !== count` sin `?? 0`, así que un recuento esperado en 0 siempre fallaba con `undefined !== 0` aunque el estado real fuera correcto. Corregido en `build-packages.mjs`, con test de regresión (`build-packages.test.mjs`, caso 58).
4. ✅ **Hecho y verificado en real.** Primera versión real de la librería con el Core completo:
   - **Librería**: proyecto standalone "LaTroballa Core v1" (Script ID `1fRR3hjtUIxWcZrjU1APFtG361QuDZ8GmBNQjAoKY_ZjhaYprAkvOEA7M`), 69 archivos (Paquete A completo vía `--modules CORE,GANTT,ECONOMICO,IMPACTO,COMPRAS,CONVOCATORIAS`), desplegada como versión `@1`.
   - **Cascarón**: Sheet+script nuevo "LaTroballa - Cascarón (candidato v1)" (Sheet `1cY4KsyjI3FKKSykJyZZDPRvmh0_Qgz2VCJFW4oL8DR4`), `appsscript.json` con `dependencies.libraries` apuntando a la librería v1, y un único archivo `Codigo.js` de 176 envoltorios generado automáticamente por `generate-shell-wrappers.mjs` (no escrito a mano).
   - **Verificado en real** (no simulado): `clasp push` a ambos proyectos, autorización OAuth real, menú completo cargado (los 3 submenús con sus ~176 puntos de entrada). Dos acciones de módulos distintos probadas de punta a punta: "Panel operativo" (CORE) y "Gantt: plan vs. real" (GANTT) — ambas abrieron su UI completa (plantilla HTML resuelta desde la librería) y fallaron limpiamente por falta de datos en el Sheet cascarón vacío (`ERROR_CONSULTA`/`ERROR_CATALOGO`), confirmando que la cadena completa cascarón→librería→`SpreadsheetApp.getActiveSpreadsheet()` (resolviendo el Sheet del cliente, no el de la librería) funciona con el Core real, no solo con el POC de juguete.
   - Con 0 archivos mixtos, el `PACKAGE_STATUS.A` del packager pasó de `PRODUCTION_WITH_DECLARED_MIXED_DEBT` a `PRODUCTION_CLEAN`.

## Separación de capas — Formularios.js y PedidoRecepcion.js (✅ ambos ejecutados y verificados)

**Hallazgo que redujo el riesgo del refactor**: en Apps Script no existen módulos/imports — todas las funciones de nivel superior de cualquier `.js` del proyecto comparten un único espacio de nombres global. Mover una función de archivo no requiere tocar ningún llamador: es reorganización pura de archivos fuente, no una reescritura de dependencias. El riesgo real estuvo en (a) la mecánica de extracción (conteo de llaves, no a mano) y (b) el tamaño del diff para revisión humana — no en romper referencias.

### PedidoRecepcion.js (232→200→0 líneas, 6 funciones) — ✅ ejecutado
- `corregirEstadoPedidosExistentes` → ya reclasificado a auxiliar/C en el paso anterior (`CorregirEstadoPedidosExistentes.js`, mismo tratamiento que Validation.js).
- `confirmarRecepcion_`, `actualizarEstadoPedidoTrasRecepcion_`, `obtenerOpcionesRecepcionPendiente` → DOMINIO, movidas a `PedidoRecepcionService.js` (renombrado para seguir la convención `*Service.js` del resto del proyecto, ahora que el archivo es DOMINIO puro).
- `abrirConfirmarRecepcion`, `seleccionarYConfirmarRecepcion` → UI_SERVIDOR, movidas a `FormularioMotorUI.js` junto al resto de despachadores de menú y manejadores de selector.

`PedidoRecepcion.js` queda eliminado; sus 5 funciones activas reparten entre `PedidoRecepcionService.js` (3) y `FormularioMotorUI.js` (2), sin duplicados verificado por grep exhaustivo.

### Formularios.js (2987 líneas, 115 funciones + 11 constantes de nivel superior) — ✅ ejecutado y verificado

Inventario real (126 declaraciones de nivel superior, no solo funciones — se encontraron 11 `var` de configuración/esquema que el conteo inicial de "115 funciones" no cubría: `ETIQUETA_ENTIDAD_MVP`, `ENTIDAD_DOCUMENTO_A_MVP`, `ENTIDAD_HORARIO_A_MVP`, `MVP_A_ENTIDAD_DOCUMENTO_`, `MAPAS_DEPENDENCIA_MVP`, `CLAVES_DUPLICADO_MVP`, `ESQUEMAS_FORMULARIO_MVP` de ~900 líneas, `ESTADOS_DECISION_CIERRE_`, `ESTADOS_INCIDENCIA_CIERRE_`, `NIVELES_JERARQUIA_INCIDENCIA_`, `ESTADO_DOCUMENTO_VIGENTE_`). Separado en tres archivos por capa real:

1. **`FormularioMotorUI.js`** (486 líneas, 95 funciones) — UI_SERVIDOR: `onOpen()` + los 6 motores genéricos (`abrirFormularioCrear_`, `abrirFormularioEditarPorId`, `abrirEditarRegistroPorEntidad_`, `abrirSelectorConAccion_`, `abrirFichaPorEntidad_`, `abrirRetorno`) + los ~90 despachadores `abrir*` de una línea.
2. **`FormularioValidacionService.js`** (1365 líneas, 20 funciones) — DOMINIO: `validarReglasNegocio*_` por entidad, `guardarFormulario`, `obtenerEsquemaFormulario`, `validarClavesForaneasFormulario_`, `validarDuplicidadFormulario_`, `normalizarValorFormulario_`, `traducirErrorFuncional_`, y las consultas de apoyo (`obtenerVinculosDeEntidad`, `obtenerOpcionesDependientes`, `obtenerProductoDesdeProyectoProducto`).
3. **`FormularioEsquemas.js`** (1099 líneas, 11 constantes) — CONFIGURACION: los catálogos y esquemas compartidos por los dos archivos anteriores (`ESQUEMAS_FORMULARIO_MVP` es usado tanto por `guardarFormulario`/`obtenerEsquemaFormulario` como por `abrirFormularioEditarPorId`).

**Extracción mecánica, no manual**: el script particiona el archivo en trozos contiguos por posición de bytes (fin de una declaración → fin de la siguiente), no reconoce comentarios por heurística — garantiza cobertura total por construcción, no por verificación posterior. Confirmado antes de aplicar: mismo conjunto de 126 nombres de declaración en origen y en la unión de los 3 destinos, mismo recuento exacto de caracteres no-blancos (96689 en ambos lados).

Verificado: 122/122 + 25/25 tests, `--check` sin `HASH_DIVERGENTE`, generador de envoltorios sigue en 176/0 huecos con los 6 módulos, Paquete A (69 archivos) construye sin error.

## Estado tras el punto 4 y próximos pasos reales

Los 4 puntos del plan original están hechos y verificados en real. El patrón Core-como-librería queda validado de punta a punta con el sistema completo, no solo con la POC. Lo que sigue **no** es parte de este plan (son decisiones nuevas, cada una merece su propia conversación antes de tocar código):

- La librería/cascarón "candidato v1" son recursos reales nuevos en Drive, separados del proyecto principal (`.clasp.json` de la raíz sigue apuntando al Sheet de desarrollo de siempre) — no se ha migrado nada en producción.
- Falta sembrar el cascarón con datos/catálogos reales para probar un flujo de negocio completo (crear una tarea, ver el Gantt con datos), no solo confirmar que la arquitectura no rompe.
- Falta decidir el mecanismo de reparto por organización (Camino A: cada organización con su propio cascarón + Sheet, todas apuntando a la misma librería con Script ID fijo) y cómo se versiona/actualiza la librería sin romper cascarones ya desplegados.

## Constructor de clientes — Nivel 1 (✅ registro + comando montados)

Valorado como asesor técnico (ver conversación -- "automatizar preventas con la mínima fricción"):
dos niveles de personalización con coste muy distinto. **Nivel 1** (autoservicio de módulos
estándar, sin lógica propia): todos los clientes comparten la misma librería, así que mejorar el
Core no exige redesplegar nada por cliente. **Nivel 2** (lógica propia real): requiere librería
propia por cliente, coste de mantenimiento que crece con el número de clientes -- se deja para más
adelante, solo cuando la paguen clientes concretos.

`tools/constructor/` implementa el Nivel 1 (ver `tools/constructor/README.md`):
- `libreria.json`: Script ID/versión/símbolo de la librería compartida vigente.
- `clientes.json`: registro de clientes montados (módulos, envoltorios, huecos, estado).
- `montar-cliente.mjs`: genera el cascarón (`Codigo.js` + `appsscript.json`) de un cliente
  reutilizando `resolveWrapperPlan`/`renderWrapperStubs` (ya construidos y verificados, cero
  lógica nueva de empaquetado) y lo registra. No crea recursos de Drive ni ejecuta `clasp` --
  imprime los comandos exactos para ese paso manual, mismo criterio de "acción con efectos reales
  requiere confirmación explícita" que el resto del proyecto.

Verificado: 13/13 tests (incluida una construcción real contra el repositorio: CORE+GANTT con
huecos esperados, los 6 módulos completos sin huecos), 122/122 + 25/25 de las suites existentes
sin romperse, `--check` limpio con `tools/constructor/` excluido del escaneo del packager.

## Recordatorio de gobernanza (heredado, sin cambios)
Git local, `clasp push` con autorización explícita, cambios mínimos, verificación humana en Apps Script real antes de dar nada por cerrado — mismo criterio que el resto de este proyecto.
