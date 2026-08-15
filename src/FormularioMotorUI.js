/**
 * FormularioMotorUI.js -- capa UI_SERVIDOR de formularios (menu real + motor
 * generico de apertura/edicion/creacion de dialogos). Extraido de
 * Formularios.js para cerrar su deuda de mezcla de capas (ver
 * PROPUESTA_MODULARIZACION_LIBRERIA.md). No contiene reglas de negocio ni
 * guardado: eso vive en FormularioValidacionService.js.
 */
/*
 * Hallazgo #23 (auditoría piloto): el menú había crecido por orden de
 * aparición de cada fase (L1-L5), agrupado por tipo de entidad en dos
 * submenús separados ("Nuevo registro"/"Relaciones") que no reflejaban
 * como se usa el sistema de verdad. Reorganizado por contexto de uso;
 * "Nuevo X"/"Editar X" de la misma entidad quedan juntos en el mismo
 * grupo. Cambio puramente de organización del menú -- no toca lógica
 * de servidor ni datos.
 */
/*
 * Menu organizado en 3 polos (ver conversacion -- "gantt responde
 * preguntas, arboles/fichas son el espacio de edicion, el resto es
 * administracion de datos"), no por entidad suelta como antes:
 *   📊 Analizar   -- vistas de consulta, sin edicion profunda.
 *   🌳 Navegar y editar -- arboles de jerarquia + fichas de registro,
 *      con sus "Editar X" asociados (el atajo directo a cada nivel).
 *   ➕ Crear y gestionar datos -- alta de registros/relaciones nuevas
 *      y administracion (catalogos, importacion, mantenimiento).
 * Ningun nombre de funcion cambia, solo se reagrupan los accesos.
 *
 * Refactor (ver conversación -- "el menú sigue creciendo, valora una
 * nueva segmentación ahora que los módulos están definidos"): cada
 * submenú se construye en su propia función, nombrada por el módulo
 * que aporta sus ítems (CORE/GANTT/COMPRAS/ECONOMICO/CONVOCATORIAS/
 * IMPACTO/comercial = CLIENTE+VENTAS+OPORTUNIDAD). Las listas que ya
 * mezclaban módulos ("Nuevo registro", "Nueva relación / vínculo",
 * "Movimientos y confirmaciones", "Catálogos y administración") se
 * reparten entre funciones "agregarX_" encadenadas -- incluye
 * reagrupar visualmente sus ítems por módulo (antes intercalados sin
 * criterio); nombres de función, etiquetas y estructura de submenús
 * quedan igual. Es solo reorganización de código -- todavía no
 * condiciona qué bloques se muestran según módulos instalados (eso es
 * el siguiente paso, pendiente de una señal en tiempo de ejecución que
 * hoy no existe).
 */
/**
 * Módulos instalados del cliente que llamó a onOpen() en esta ejecución.
 * Una librería de Apps Script corre en su PROPIO ámbito global, aislado del
 * proyecto que la invoca -- por eso MODULOS_INSTALADOS_CLIENTE, definida en
 * el Codigo.js de cada cliente, no es visible aquí directamente y hay que
 * pasarla como argumento explícito a onOpen() (ver más abajo) y guardarla en
 * esta variable de módulo para que moduloInstalado_() pueda leerla.
 */
var modulosInstaladosClienteActual_ = null;

/**
 * true si nombreModulo está en la lista de módulos instalados del cliente
 * que llamó a onOpen(). Si onOpen() se ejecutó sin argumento (cliente
 * antiguo sin regenerar Codigo.js, o el propio Sheet maestro) se asume que
 * todos los módulos están instalados, por compatibilidad -- así onOpen()
 * nunca deja de mostrar el menú.
 */
function moduloInstalado_(nombreModulo) {
  if (!modulosInstaladosClienteActual_) return true;
  return modulosInstaladosClienteActual_.indexOf(nombreModulo) !== -1;
}

/*
 * moduloGanttInstalado (ver conversacion -- "el boton de acceso a
 * gantt... deberiamos dejarlo visible pero anulado... o eliminado"):
 * a diferencia de moduloInstalado_(), que solo puede leer
 * modulosInstaladosClienteActual_ (fijada por onOpen(), no vigente en
 * la ejecucion aislada de un google.script.run posterior desde una
 * Ficha/Panel), esta función recibe MODULOS_INSTALADOS_CLIENTE como
 * argumento explícito -- mismo caso especial que abrirInstalarEstructuraInicial,
 * ver FUNCIONES_QUE_RECIBEN_MODULOS_INSTALADOS en generate-shell-wrappers.mjs
 * y GeneradorEnvoltoriosEmbebido.js. Las Fichas/Panel la llaman al cargar
 * para ocultar "Ver Gantt"/"Ver ocupación" en clientes sin GANTT --
 * GanttPlanReal.html hace ~17 llamadas a funciones del módulo GANTT
 * (DesviacionService.js), así que sin ese módulo el diálogo se queda
 * colgado en "Cargando..." en vez de fallar con un error claro.
 */
function moduloGanttInstalado(modulosInstalados) {
  return Array.isArray(modulosInstalados) ? modulosInstalados.indexOf('GANTT') !== -1 : true;
}

/**
 * modulosInstalados: array de módulos instalados en el cliente que llama,
 * pasado explícitamente por el envoltorio onOpen() generado en el Codigo.js
 * de cada cliente (ver renderWrapperStubs/renderizarEnvoltorios_) como
 * Core.onOpen(MODULOS_INSTALADOS_CLIENTE) -- no como .apply(null, arguments)
 * genérico, precisamente porque una librería no puede leer las variables
 * globales de quien la invoca.
 */
function onOpen(modulosInstalados) {
  // Google Sheets pasa un objeto de evento (no un array) como primer
  // argumento cuando onOpen() se dispara como trigger real (simple o
  // instalable) -- el maestro invoca onOpen() directamente como trigger
  // (sin envoltorio), así que ese objeto de evento llegaba aquí y rompía
  // moduloInstalado_ (.indexOf no existe en un objeto de evento). Los
  // clientes no lo sufren porque su envoltorio llama explícitamente
  // Core.onOpen(MODULOS_INSTALADOS_CLIENTE), una llamada normal, no un
  // disparo de trigger. Array.isArray descarta cualquier objeto de
  // evento/argumento inesperado sin tocar el caso real (array de módulos).
  modulosInstaladosClienteActual_ = Array.isArray(modulosInstalados) ? modulosInstalados : null;
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Taller de Producción')
    .addItem('🗺️ Mapa del sheet (inicio)', 'abrirMapaSheet')
    .addSubMenu(construirSubmenuAnalizar_(ui))
    .addSubMenu(construirSubmenuNavegarYEditar_(ui))
    .addSubMenu(construirSubmenuCrearYGestionar_(ui))
    .addToUi();
}

/* === 📊 Analizar === */

function construirSubmenuAnalizar_(ui) {
  var menu = ui.createMenu('📊 Analizar');
  menu = agregarAnalizarCore_(menu);
  if (moduloInstalado_('GANTT')) menu = agregarAnalizarGantt_(menu);
  if (moduloInstalado_('CLIENTE') || moduloInstalado_('VENTAS')) menu = agregarAnalizarComercial_(menu);
  return menu;
}

function agregarAnalizarCore_(menu) {
  return menu
    .addItem('Panel operativo', 'abrirPanelOperativo')
    .addItem('Informes', 'abrirInformes')
    .addItem('Kanban operativo (Tarea/Proceso/Incidencia)', 'abrirKanban')
    .addItem('Listado filtrable (Incidencias/Decisiones/Documentos)', 'abrirListadoFiltrable')
    .addItem('Verificar integridad', 'abrirIntegridad')
    .addItem('Historial', 'abrirHistorialAdmin');
}

function agregarAnalizarGantt_(menu) {
  return menu.addItem('Gantt: plan vs. real', 'abrirGanttPlanReal');
}

function agregarAnalizarComercial_(menu) {
  return menu
    .addItem('Panel de clientes', 'abrirPanelClientes')
    .addItem('Panel de ventas', 'abrirPanelVentas');
}

/* === 🌳 Navegar y editar === */

function construirSubmenuNavegarYEditar_(ui) {
  var menu = ui.createMenu('🌳 Navegar y editar')
    .addSubMenu(construirSubmenuCampanaProyecto_(ui))
    .addSubMenu(construirSubmenuPersonasYEquipos_(ui))
    .addSubMenu(construirSubmenuEspaciosYRecursos_(ui))
    .addSubMenu(construirSubmenuSeguimientoYDecisiones_(ui));
  if (moduloInstalado_('COMPRAS')) menu = menu.addSubMenu(construirSubmenuMaterialesYProveedores_(ui));
  if (moduloInstalado_('CLIENTE') || moduloInstalado_('VENTAS') || moduloInstalado_('OPORTUNIDAD')) menu = menu.addSubMenu(construirSubmenuClientesYVentas_(ui));
  return menu;
}

/* CORE */
function construirSubmenuCampanaProyecto_(ui) {
  return ui.createMenu('Campaña → Proyecto → Producto → Proceso → Tarea')
    .addItem('Gestión de campaña (vista global)', 'abrirPanelCampana')
    .addItem('Ficha de campaña (buscar)', 'abrirFichaCampanaBuscar')
    .addItem('Ficha de proyecto (buscar)', 'abrirFichaProyectoBuscar')
    .addItem('Ficha de producto (buscar)', 'abrirFichaProductoBuscar')
    .addItem('Ficha de proceso (buscar)', 'abrirFichaProcesoBuscar')
    .addItem('Ficha de tarea (buscar)', 'abrirFichaTareaBuscar')
    .addItem('Editar campaña', 'abrirEditarCampana')
    .addItem('Editar proyecto', 'abrirEditarProyecto')
    .addItem('Editar producto', 'abrirEditarProducto')
    .addItem('Editar Proyecto-Producto', 'abrirEditarProyectoProducto')
    .addItem('Editar proceso', 'abrirEditarProceso')
    .addItem('Editar tarea', 'abrirEditarTarea');
}

/* CORE */
function construirSubmenuPersonasYEquipos_(ui) {
  return ui.createMenu('Personas y equipos')
    .addItem('Ver personas y equipo (jerarquía)', 'abrirPanelPersonas')
    .addItem('Ficha de persona/equipo (buscar)', 'abrirFichaPersonaEquipoBuscar')
    .addItem('Editar persona/equipo', 'abrirEditarPersonaEquipo')
    .addItem('Editar Equipo-Miembro', 'abrirEditarEquipoMiembro')
    .addItem('Editar Tarea-Responsable', 'abrirEditarTareaResponsable');
}

/* CORE */
function construirSubmenuEspaciosYRecursos_(ui) {
  return ui.createMenu('Espacios y recursos')
    .addItem('Ver espacios y recursos (jerarquía)', 'abrirPanelRecursos')
    .addItem('Ficha de espacio/recurso (buscar)', 'abrirFichaRecursoBuscar')
    .addItem('Editar recurso', 'abrirEditarRecurso')
    .addItem('Editar Tarea-Recurso', 'abrirEditarTareaRecurso')
    .addItem('Editar Tarea-Necesidad de recurso', 'abrirEditarTareaRecursoNecesidad')
    .addItem('Editar horario', 'abrirEditarHorario');
}

/* COMPRAS */
function construirSubmenuMaterialesYProveedores_(ui) {
  return ui.createMenu('Materiales y proveedores')
    .addItem('Ficha de material (buscar)', 'abrirFichaMaterialBuscar')
    .addItem('Editar material', 'abrirEditarMaterial')
    .addItem('Editar Producto-Material', 'abrirEditarProductoMaterial')
    .addItem('Editar Tarea-Material', 'abrirEditarTareaMaterial')
    .addItem('Ficha de proveedor (buscar)', 'abrirFichaProveedorBuscar')
    .addItem('Editar proveedor', 'abrirEditarProveedor')
    .addItem('Editar Proveedor-Material', 'abrirEditarProveedorMaterial')
    .addItem('Editar pedido a proveedor', 'abrirEditarPedidoProveedor')
    .addItem('Editar Pedido-Línea', 'abrirEditarPedidoProveedorLinea')
    .addItem('Editar recepción de pedido', 'abrirEditarRecepcion')
    .addItem('Editar Recepción-Línea', 'abrirEditarRecepcionLinea')
    .addItem('Editar Movimiento de material', 'abrirEditarMovimientoMaterial');
}

/* CORE */
function construirSubmenuSeguimientoYDecisiones_(ui) {
  return ui.createMenu('Seguimiento y decisiones')
    .addItem('Ficha de incidencia (buscar)', 'abrirFichaIncidenciaBuscar')
    .addItem('Editar incidencia', 'abrirEditarIncidencia')
    .addItem('Editar decisión', 'abrirEditarDecision')
    .addItem('Editar documento', 'abrirEditarDocumento')
    .addItem('Editar Relación', 'abrirEditarRelacion')
    .addItem('Editar Vínculo', 'abrirEditarVinculo')
    .addItem('Editar Ejecución de tarea', 'abrirEditarEjecucionTarea')
    .addItem('Editar Asignación', 'abrirEditarAsignacion');
}

/* Comercial: CLIENTE + VENTAS */
function construirSubmenuClientesYVentas_(ui) {
  return ui.createMenu('Clientes y ventas')
    .addItem('Editar cliente', 'abrirEditarCliente')
    .addItem('Editar pedido de cliente', 'abrirEditarPedidoCliente')
    .addItem('Editar Pedido-Línea', 'abrirEditarPedidoClienteLinea')
    .addItem('Editar entrega', 'abrirEditarEntrega')
    .addItem('Editar Entrega-Línea', 'abrirEditarEntregaLinea')
    .addItem('Editar contrato de servicio', 'abrirEditarContratoServicio')
    .addItem('Editar oportunidad', 'abrirEditarOportunidad');
}

/* === ➕ Crear y gestionar datos === */

function construirSubmenuCrearYGestionar_(ui) {
  var menu = ui.createMenu('➕ Crear y gestionar datos')
    .addSubMenu(construirSubmenuNuevoRegistro_(ui))
    .addSubMenu(construirSubmenuNuevaRelacion_(ui));
  // Sin COMPRAS, "Movimientos y confirmaciones" solo tendria un item
  // (Recalcular avance de proceso) -- se aplana como item directo en vez
  // de un submenu de un solo elemento.
  if (moduloInstalado_('COMPRAS')) {
    menu = menu.addSubMenu(construirSubmenuMovimientosYConfirmaciones_(ui));
  } else {
    menu = menu.addItem('Recalcular avance de proceso', 'abrirRecalcularAvanceProceso');
  }
  menu = menu.addSubMenu(construirSubmenuCompetencias_(ui));
  if (moduloInstalado_('ECONOMICO')) menu = menu.addSubMenu(construirSubmenuPresupuestoYFinanciacion_(ui));
  if (moduloInstalado_('CONVOCATORIAS')) menu = menu.addSubMenu(construirSubmenuConvocatorias_(ui));
  if (moduloInstalado_('IMPACTO')) menu = menu.addSubMenu(construirSubmenuImpacto_(ui));
  menu = menu.addSubMenu(construirSubmenuCatalogosYAdministracion_(ui));
  return menu;
}

function construirSubmenuNuevoRegistro_(ui) {
  var menu = ui.createMenu('Nuevo registro');
  menu = agregarNuevoRegistroCore_(menu);
  if (moduloInstalado_('COMPRAS')) menu = agregarNuevoRegistroCompras_(menu);
  if (moduloInstalado_('CLIENTE') || moduloInstalado_('VENTAS') || moduloInstalado_('OPORTUNIDAD')) menu = agregarNuevoRegistroComercial_(menu);
  return menu;
}

function agregarNuevoRegistroCore_(menu) {
  return menu
    .addItem('Nueva campaña', 'abrirFormularioCrearCampana')
    .addItem('Nuevo proyecto', 'abrirFormularioCrearProyecto')
    .addItem('Nuevo producto', 'abrirFormularioCrearProducto')
    .addItem('Nuevo proceso', 'abrirFormularioCrearProceso')
    .addItem('Nueva tarea', 'abrirFormularioCrearTarea')
    .addItem('Nueva persona/equipo', 'abrirFormularioCrearPersonaEquipo')
    .addItem('Nuevo recurso (herramienta/maquinaria/equipo/espacio)', 'abrirFormularioCrearRecurso')
    .addItem('Nuevo horario (franja semanal)', 'abrirFormularioCrearHorario')
    .addItem('Nueva incidencia', 'abrirFormularioCrearIncidencia')
    .addItem('Nueva decisión', 'abrirFormularioCrearDecision')
    .addItem('Nuevo documento', 'abrirFormularioCrearDocumento');
}

function agregarNuevoRegistroCompras_(menu) {
  return menu
    .addItem('Nuevo material', 'abrirFormularioCrearMaterial')
    .addItem('Nuevo proveedor', 'abrirFormularioCrearProveedor')
    .addItem('Nuevo pedido a proveedor', 'abrirFormularioCrearPedidoProveedor')
    .addItem('Nueva recepción de pedido', 'abrirFormularioCrearRecepcion');
}

function agregarNuevoRegistroComercial_(menu) {
  return menu
    .addItem('Nuevo cliente', 'abrirFormularioCrearCliente')
    .addItem('Nuevo pedido de cliente', 'abrirFormularioCrearPedidoCliente')
    .addItem('Nueva entrega', 'abrirFormularioCrearEntrega')
    .addItem('Nuevo contrato de servicio', 'abrirFormularioCrearContratoServicio')
    .addItem('Nueva oportunidad', 'abrirFormularioCrearOportunidad');
}

function construirSubmenuNuevaRelacion_(ui) {
  var menu = ui.createMenu('Nueva relación / vínculo');
  menu = agregarNuevaRelacionCore_(menu);
  if (moduloInstalado_('COMPRAS')) menu = agregarNuevaRelacionCompras_(menu);
  if (moduloInstalado_('CLIENTE') || moduloInstalado_('VENTAS')) menu = agregarNuevaRelacionComercial_(menu);
  return menu;
}

function agregarNuevaRelacionCore_(menu) {
  return menu
    .addItem('Proyecto - Producto (nueva relación)', 'abrirFormularioCrearProyectoProducto')
    .addItem('Equipo - Miembro (nueva relación)', 'abrirFormularioCrearEquipoMiembro')
    .addItem('Tarea - Responsable (asignar)', 'abrirFormularioCrearTareaResponsable')
    .addItem('Tarea - Recurso (asignar)', 'abrirFormularioCrearTareaRecurso')
    .addItem('Tarea - Necesidad de recurso (declarar requisito)', 'abrirFormularioCrearTareaRecursoNecesidad')
    .addItem('Relación / dependencia (grafo, nueva)', 'abrirFormularioCrearRelacion')
    .addItem('Vínculo genérico (nuevo)', 'abrirFormularioCrearVinculo')
    .addItem('Ejecución de tarea (nueva)', 'abrirFormularioCrearEjecucionTarea')
    .addItem('Asignación (Campaña/Proyecto/Producto/Proceso/Decisión/Incidencia)', 'abrirFormularioCrearAsignacion');
}

function agregarNuevaRelacionCompras_(menu) {
  return menu
    .addItem('Producto - Material (nueva relación)', 'abrirFormularioCrearProductoMaterial')
    .addItem('Tarea - Material (nueva relación)', 'abrirFormularioCrearTareaMaterial')
    .addItem('Proveedor - Material (nueva relación)', 'abrirFormularioCrearProveedorMaterial')
    .addItem('Pedido - Línea (nueva)', 'abrirFormularioCrearPedidoProveedorLinea')
    .addItem('Recepción - Línea (nueva)', 'abrirFormularioCrearRecepcionLinea');
}

function agregarNuevaRelacionComercial_(menu) {
  return menu
    .addItem('Pedido de cliente - Línea (nueva)', 'abrirFormularioCrearPedidoClienteLinea')
    .addItem('Entrega - Línea (nueva)', 'abrirFormularioCrearEntregaLinea');
}

function construirSubmenuMovimientosYConfirmaciones_(ui) {
  var menu = ui.createMenu('Movimientos y confirmaciones');
  if (moduloInstalado_('COMPRAS')) menu = agregarMovimientosCompras_(menu);
  menu = agregarMovimientosCore_(menu);
  return menu;
}

function agregarMovimientosCompras_(menu) {
  return menu
    .addItem('Confirmar recepción de pedido', 'abrirConfirmarRecepcion')
    .addItem('Movimiento de material (nuevo)', 'abrirFormularioCrearMovimientoMaterial');
}

function agregarMovimientosCore_(menu) {
  return menu.addItem('Recalcular avance de proceso', 'abrirRecalcularAvanceProceso');
}

/* ECONOMICO */
function construirSubmenuPresupuestoYFinanciacion_(ui) {
  return ui.createMenu('Presupuesto y financiación')
    .addItem('Nueva línea de presupuesto', 'abrirFormularioCrearPresupuesto')
    .addItem('Editar línea de presupuesto', 'abrirEditarPresupuesto')
    .addItem('Nueva fuente de financiación', 'abrirFormularioCrearFuenteFinanciacion')
    .addItem('Editar fuente de financiación', 'abrirEditarFuenteFinanciacion')
    .addItem('Nuevo coste (materiales/recursos/actividad)', 'abrirFormularioCrearCoste')
    .addItem('Editar coste', 'abrirEditarCoste');
}

/* CORE */
function construirSubmenuCompetencias_(ui) {
  return ui.createMenu('Competencias')
    .addItem('Nueva competencia', 'abrirFormularioCrearCompetencia')
    .addItem('Editar competencia', 'abrirEditarCompetencia')
    .addItem('Persona - Competencia (asignar)', 'abrirFormularioCrearPersonaCompetencia')
    .addItem('Editar Persona-Competencia', 'abrirEditarPersonaCompetencia')
    .addItem('Recurso - Competencia requerida (asignar)', 'abrirFormularioCrearRecursoCompetencia')
    .addItem('Editar Recurso-Competencia', 'abrirEditarRecursoCompetencia')
    .addItem('Tarea - Competencia requerida (asignar)', 'abrirFormularioCrearTareaCompetencia')
    .addItem('Editar Tarea-Competencia', 'abrirEditarTareaCompetencia');
}

/* CONVOCATORIAS */
function construirSubmenuConvocatorias_(ui) {
  return ui.createMenu('Convocatorias')
    .addItem('Ficha de convocatoria (buscar)', 'abrirFichaConvocatoriaBuscar')
    .addItem('Nueva convocatoria', 'abrirFormularioCrearConvocatoria')
    .addItem('Editar convocatoria', 'abrirEditarConvocatoria');
}

/* IMPACTO */
function construirSubmenuImpacto_(ui) {
  return ui.createMenu('Impacto')
    .addItem('Nueva etiqueta de impacto', 'abrirFormularioCrearEtiquetaImpacto')
    .addItem('Editar etiqueta de impacto', 'abrirEditarEtiquetaImpacto');
}

function construirSubmenuCatalogosYAdministracion_(ui) {
  var menu = ui.createMenu('Catálogos y administración');
  menu = agregarCatalogosCore_(menu);
  if (moduloInstalado_('COMPRAS')) menu = agregarCatalogosCompras_(menu);
  if (moduloInstalado_('CLIENTE')) menu = agregarCatalogosCliente_(menu);
  if (moduloInstalado_('VENTAS')) menu = agregarCatalogosVentas_(menu);
  if (moduloInstalado_('OPORTUNIDAD')) menu = agregarCatalogosOportunidad_(menu);
  if (moduloInstalado_('ESCENARIOS')) menu = agregarCatalogosEscenarios_(menu);
  return menu;
}

function agregarCatalogosEscenarios_(menu) {
  return menu
    .addItem('Nuevo escenario de simulación', 'abrirFormularioCrearEscenario')
    .addItem('Editar escenario de simulación', 'abrirEditarEscenario');
}

function agregarCatalogosCore_(menu) {
  menu = menu
    .addItem('Catálogos', 'abrirCatalogosAdmin')
    .addItem('Personas y equipos (hoja)', 'abrirPersonasEquiposAdmin');
  if (moduloInstalado_('COMPRAS')) menu = menu.addItem('Proveedores (hoja)', 'abrirProveedoresAdmin');
  menu = menu
    .addItem('Protección de hojas', 'abrirProteccionHojas')
    .addItem('Importación masiva (STG_*)', 'abrirImportacionMasivaInicio')
    .addItem('Mantenimiento (revertir cambio)', 'abrirRevertirUltimoCambio')
    .addItem('Instalar estructura inicial (hojas + catálogo)', 'abrirInstalarEstructuraInicial');
  // Aprovisionamiento (montaje de clientes nuevos) es una herramienta de
  // administración interna de LaTroballa Software, no una función de negocio
  // del cliente -- ver AprovisionamientoService.js, ya fuera de la librería
  // (package C). 'INTERNO' no es un módulo real: ningún cliente lo pide
  // nunca, así que moduloInstalado_('INTERNO') siempre es false ahí; en el
  // propio Sheet maestro (que ejecuta el código en crudo, sin envoltorios,
  // sin MODULOS_INSTALADOS_CLIENTE) el valor por defecto es true.
  if (moduloInstalado_('INTERNO')) {
    menu = menu
      .addItem('Configurar aprovisionamiento (montaje de clientes)', 'abrirConfigurarAprovisionamiento')
      .addItem('Actualizar versión de librería (aprovisionamiento)', 'abrirActualizarVersionLibreria');
  }
  return menu;
}

function agregarCatalogosCompras_(menu) {
  return menu.addItem('Instalar catálogo de Compras (L4)', 'abrirInstalarCatalogoComprasL4');
}

function agregarCatalogosCliente_(menu) {
  return menu.addItem('Instalar catálogo de Cliente (L4)', 'abrirInstalarCatalogoClienteL4');
}

function agregarCatalogosVentas_(menu) {
  return menu.addItem('Instalar catálogo de Ventas (L4)', 'abrirInstalarCatalogoVentasL4');
}

function agregarCatalogosOportunidad_(menu) {
  return menu
    .addItem('Instalar catálogo de Oportunidad (L4)', 'abrirInstalarCatalogoOportunidadL4')
    .addItem('Recalcular encaje de oportunidades', 'abrirRecalcularPuntuacionEncajeOportunidades');
}
/*
 * prefill (opcional): valores iniciales para campos del formulario en
 * modo creacion -- hoy solo lo usa el encadenado Campaña->Proyecto
 * (abrirFormularioCrearProyectoConCampana), para no obligar a buscar de
 * nuevo la campaña que se acaba de crear en el buscador de CAMPANA_ID.
 */
/*
 * Resuelve la etiqueta legible del destino de un RETORNO (ver
 * conversacion -- "ya hay un recorrido reversible, falta tenerlo mas
 * claro"): el mecanismo de volver ya existia (cerrarOVolver_/abrirRetorno)
 * pero el boton solo decia "Cancelar y volver", sin decir a donde.
 * Se resuelve aqui, en el unico punto donde se construye el `retorno`
 * que ve el cliente, para que sea igual venga de donde venga (dependiente
 * bloqueante, ficha con retorno...). Si no se puede resolver (registro
 * borrado, error de lectura) se deja etiquetaDestino=null y el cliente
 * cae al texto generico de siempre.
 */
function resolverEtiquetaRetorno_(retorno) {
  if (!retorno || !retorno.entidad || !retorno.id) return retorno || null;
  var copia = Object.assign({}, retorno);
  try {
    var clave = String(retorno.entidad).trim().toUpperCase();
    var registro = obtenerRegistroPorId(clave, retorno.id);
    var etiquetaEntidad = ETIQUETA_ENTIDAD_MVP[clave] || clave.toLowerCase();
    var nombre = registro ? (registro.NOMBRE || registro.TITULO || retorno.id) : retorno.id;
    copia.etiquetaDestino = etiquetaEntidad + ' "' + nombre + '"';
  } catch (e) {
    copia.etiquetaDestino = null;
  }
  return copia;
}
/*
 * campanaRaiz (opcional): id de la CAMPANA raiz de la cadena de creacion
 * en curso (ver conversacion -- "entrar en la ficha... con opcion de
 * volver atras, editar, ver resultados"). Se usa solo para ofrecer el
 * enlace "Ver panel de campaña" en FormularioGenerico.html -- el Panel es
 * un sidebar (showSidebar), no un dialogo modal, asi que abrirlo NO
 * cierra ni compite con el dialogo de creacion actual; se puede dejar
 * abierto todo el rato como mapa en vivo mientras se sigue la cadena.
 */
function abrirFormularioCrear_(entidad, tituloVentana, prefill, retorno, ruta, campanaRaiz) {
  var template = HtmlService.createTemplateFromFile('FormularioGenerico');
  template.entidad = entidad;
  template.idRegistro = '';
  template.titulo = tituloVentana;
  template.prefill = JSON.stringify(prefill || {});
  template.retorno = JSON.stringify(resolverEtiquetaRetorno_(retorno));
  template.ruta = JSON.stringify(ruta || []);
  template.campanaRaiz = JSON.stringify(campanaRaiz || null);
  var html = template.evaluate().setWidth(460).setHeight(540);
  SpreadsheetApp.getUi().showModelessDialog(html, tituloVentana);
}
/*
 * retorno (opcional, {entidad, id}): a que formulario volver al cerrar
 * este (cancelar, guardar o desactivar) -- resuelve el hallazgo "me
 * quedo bloqueado" al editar un dependiente desde la lista de bloqueo
 * de Desactivar (ver abrirDependienteConRetorno_). Sin retorno, cerrar
 * se comporta igual que siempre.
 */
function abrirFormularioEditarPorId(entidad, idRegistro, retorno) {
  var clave = String(entidad || '').trim().toUpperCase();
  if (!ESQUEMAS_FORMULARIO_MVP[clave]) {
    throw new Error('No hay formulario disponible para la entidad ' + entidad);
  }
  var tituloVentana = 'Editar ' + (ETIQUETA_ENTIDAD_MVP[clave] || clave.toLowerCase());
  var template = HtmlService.createTemplateFromFile('FormularioGenerico');
  template.entidad = clave;
  template.idRegistro = idRegistro;
  template.titulo = tituloVentana;
  template.prefill = JSON.stringify({});
  template.retorno = JSON.stringify(resolverEtiquetaRetorno_(retorno));
  template.ruta = JSON.stringify([]);
  template.campanaRaiz = JSON.stringify(null);
  var html = template.evaluate().setWidth(460).setHeight(540);
  SpreadsheetApp.getUi().showModelessDialog(html, tituloVentana);
}
/*
 * Llamada desde el listado de dependientes bloqueantes de "Desactivar"
 * (FormularioGenerico.html): abre el dependiente con retorno al
 * formulario que se estaba intentando desactivar, para no dejar al
 * usuario sin forma de volver tras editarlo.
 */
function abrirDependienteConRetorno(entidadHijo, idHijo, entidadOrigen, idOrigen) {
  abrirFormularioEditarPorId(entidadHijo, idHijo, { entidad: entidadOrigen, id: idOrigen });
}
/*
 * Despacha una entidad a su ficha de registro correspondiente (ver
 * conversacion -- generalizacion del mecanismo de retorno para que
 * tambien pueda volver a una ficha, no solo a otro formulario). Unico
 * punto que conoce la lista de fichas existentes; añadir aqui cuando
 * se cree una ficha nueva (Espacio/Recurso, etc.).
 */
function abrirFichaPorEntidad_(entidad, id) {
  var clave = String(entidad || '').trim().toUpperCase();
  if (clave === 'PERSONA_EQUIPO') { abrirFichaPersonaEquipo(id); return; }
  if (clave === 'CAMPANA') { abrirFichaCampana(id); return; }
  if (clave === 'PROYECTO') { abrirFichaProyecto(id); return; }
  if (clave === 'PRODUCTO') { abrirFichaProducto(id); return; }
  if (clave === 'PROCESO') { abrirFichaProceso(id); return; }
  if (clave === 'TAREA') { abrirFichaTarea(id); return; }
  if (clave === 'RECURSO') { abrirFichaRecurso(id); return; }
  if (clave === 'PROVEEDOR') { abrirFichaProveedor(id); return; }
  if (clave === 'MATERIAL') { abrirFichaMaterial(id); return; }
  if (clave === 'INCIDENCIA') { abrirFichaIncidencia(id); return; }
  if (clave === 'CONVOCATORIA') { abrirFichaConvocatoria(id); return; }
  throw new Error('No hay ficha disponible para la entidad ' + entidad);
}
/*
 * Punto unico de despacho de "retorno" (ver conversacion -- "no tener
 * que salir de la ficha por sus partes"): antes RETORNO solo volvia a
 * otro formulario de edicion (abrirFormularioEditarPorId); ahora tambien
 * puede volver a una ficha de registro con retorno.tipo='ficha'. Sin
 * tipo (el caso ya existente de "dependiente bloqueante"), se comporta
 * exactamente igual que antes.
 */
function abrirRetorno(retorno) {
  if (!retorno || !retorno.entidad || !retorno.id) return;
  if (retorno.tipo === 'ficha') {
    abrirFichaPorEntidad_(retorno.entidad, retorno.id);
    return;
  }
  abrirFormularioEditarPorId(retorno.entidad, retorno.id);
}
/*
 * accionFn usado por los botones "Editar" dentro de una ficha de
 * registro (FichaProducto.html/FichaPersonaEquipo.html): igual que
 * seleccionarYAbrirEdicion, pero con retorno a la propia ficha para no
 * dejar al usuario "fuera" tras cerrar el formulario de edicion.
 */
function abrirEdicionConRetornoAFicha(entidad, idRegistro, fichaEntidad, fichaId) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);
  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }
  abrirFormularioEditarPorId(entidad, idRegistro, { tipo: 'ficha', entidad: fichaEntidad, id: fichaId });
  return true;
}
/*
 * Flujo encadenado Campaña->Proyecto: al guardar una campaña nueva,
 * FormularioGenerico.html ofrece crear ya el primer proyecto; si se
 * acepta, llama aqui con el ID recien creado para abrir "Nuevo
 * proyecto" con CAMPANA_ID precargado (mismo buscador de FK de
 * siempre, solo que ya viene relleno).
 */
function abrirFormularioCrearProyectoConCampana(campanaId, ruta, campanaRaiz) {
  abrirFormularioCrear_('PROYECTO', 'Nuevo proyecto', { CAMPANA_ID: campanaId }, null, ruta, campanaRaiz);
}
/*
 * Mismo flujo encadenado, un nivel mas abajo: Proyecto->Producto. El
 * campo real de PRODUCTO no es PROYECTO_ID (no existe) sino el campo
 * virtual PROYECTO_VINCULAR_ID (hallazgo #13 de la auditoria piloto),
 * que guardarFormulario resuelve creando el PROYECTO_PRODUCTO en el
 * mismo guardado.
 */
function abrirFormularioCrearProductoConProyecto(proyectoId, ruta, campanaRaiz) {
  abrirFormularioCrear_('PRODUCTO', 'Nuevo producto', { PROYECTO_VINCULAR_ID: proyectoId }, null, ruta, campanaRaiz);
}
/*
 * Resto de la cadena hacia abajo: Producto->Proceso->Tarea. Aqui
 * PRODUCTO_ID/PROCESO_ID si son campos reales de PROCESO/TAREA (no
 * virtuales como PROYECTO_VINCULAR_ID), asi que el prefill es directo.
 */
function abrirFormularioCrearProcesoConProducto(productoId, ruta, campanaRaiz) {
  abrirFormularioCrear_('PROCESO', 'Nuevo proceso', { PRODUCTO_ID: productoId }, null, ruta, campanaRaiz);
}
function abrirFormularioCrearTareaConProceso(procesoId, ruta, campanaRaiz) {
  abrirFormularioCrear_('TAREA', 'Nueva tarea', { PROCESO_ID: procesoId }, null, ruta, campanaRaiz);
}
/*
 * Cadena "hermano": crear otro registro del mismo tipo para el mismo
 * padre (otro proyecto en la misma campaña, otro producto en el mismo
 * proyecto...), sin tener que volver al menu y rebuscar el padre en el
 * desplegable. Generico para toda la jerarquia -- un unico punto de
 * entrada en vez de una funcion "ConMismoPadre" por entidad.
 */
function abrirFormularioCrearHermano(entidad, campoPadre, valorPadre, ruta, campanaRaiz) {
  var clave = String(entidad || '').trim().toUpperCase();
  var etiquetas = { CAMPANA: 'campaña', PROYECTO: 'proyecto', PRODUCTO: 'producto', PROCESO: 'proceso', TAREA: 'tarea' };
  var prefill = {};
  prefill[campoPadre] = valorPadre;
  abrirFormularioCrear_(clave, 'Nuevo ' + (etiquetas[clave] || clave.toLowerCase()), prefill, null, ruta, campanaRaiz);
}
function abrirFormularioCrearCampana() { abrirFormularioCrear_('CAMPANA', 'Nueva campaña'); }
function abrirFormularioCrearProyecto() { abrirFormularioCrear_('PROYECTO', 'Nuevo proyecto'); }
function abrirFormularioCrearProducto() { abrirFormularioCrear_('PRODUCTO', 'Nuevo producto'); }
function abrirFormularioCrearProceso() { abrirFormularioCrear_('PROCESO', 'Nuevo proceso'); }
function abrirFormularioCrearTarea() { abrirFormularioCrear_('TAREA', 'Nueva tarea'); }
function abrirFormularioCrearProveedor() { abrirFormularioCrear_('PROVEEDOR', 'Nuevo proveedor'); }
function abrirFormularioCrearCliente() { abrirFormularioCrear_('CLIENTE', 'Nuevo cliente'); }
function abrirFormularioCrearPedidoCliente() { abrirFormularioCrear_('PEDIDO_CLIENTE', 'Nuevo pedido de cliente'); }
function abrirFormularioCrearPedidoClienteLinea() { abrirFormularioCrear_('PEDIDO_CLIENTE_LINEA', 'Línea de pedido de cliente'); }
function abrirFormularioCrearEntrega() { abrirFormularioCrear_('ENTREGA', 'Nueva entrega'); }
function abrirFormularioCrearEntregaLinea() { abrirFormularioCrear_('ENTREGA_LINEA', 'Línea de entrega'); }
function abrirFormularioCrearContratoServicio() { abrirFormularioCrear_('CONTRATO_SERVICIO', 'Nuevo contrato de servicio'); }
function abrirFormularioCrearOportunidad() { abrirFormularioCrear_('OPORTUNIDAD', 'Nueva oportunidad'); }
function abrirFormularioCrearIncidenciaParaCliente(clienteId) {
  abrirFormularioCrear_('INCIDENCIA', 'Nueva incidencia', {
    CLIENTE_ID: clienteId,
    NIVEL_INCIDENCIA: 'Cliente'
  });
}
function abrirFormularioCrearDecision() { abrirFormularioCrear_('DECISION', 'Nueva decisión'); }
function abrirFormularioCrearIncidencia() { abrirFormularioCrear_('INCIDENCIA', 'Nueva incidencia'); }
/*
 * Fase 1 del Panel de campaña (ver conversacion -- "cada parte del
 * formulario deberia tener una forma de acceder a la barra lateral...
 * para no repetir estructura del sheet"): abridores "ParaX" que
 * precargan el padre desde el nodo del arbol donde se pulsa "+", mismo
 * patron que abrirFormularioCrearProyectoConCampana etc.
 *
 * INCIDENCIA es la unica con una cadena de fk_dependiente (CAMPANA_ID->
 * PROYECTO_ID->PRODUCTO_ID->PROCESO_ID->TAREA_ID): hay que precargar
 * TODOS los ancestros, no solo el nivel pulsado, para que
 * repoblarDependiente_ (FormularioGenerico.html) pueda resolver la
 * cadena entera en cascada -- cada nivel dispara el "change" del
 * siguiente al quedar resuelto.
 */
function abrirFormularioCrearTareaResponsableParaTarea(tareaId) {
  abrirFormularioCrear_('TAREA_RESPONSABLE', 'Nueva asignación tarea-responsable', { TAREA_ID: tareaId }, { tipo: 'ficha', entidad: 'TAREA', id: tareaId });
}
function abrirFormularioCrearTareaRecursoParaTarea(tareaId) {
  abrirFormularioCrear_('TAREA_RECURSO', 'Nueva relación tarea-recurso', { TAREA_ID: tareaId }, { tipo: 'ficha', entidad: 'TAREA', id: tareaId });
}
function abrirFormularioCrearTareaMaterialParaTarea(tareaId) {
  abrirFormularioCrear_('TAREA_MATERIAL', 'Nueva relación tarea-material', { TAREA_ID: tareaId }, { tipo: 'ficha', entidad: 'TAREA', id: tareaId });
}
function abrirFormularioCrearEjecucionTareaParaTarea(tareaId) {
  abrirFormularioCrear_('EJECUCION_TAREA', 'Nueva ejecución de tarea', { TAREA_ID: tareaId }, { tipo: 'ficha', entidad: 'TAREA', id: tareaId });
}
/*
 * retorno tipo='ficha' (ver conversacion -- "Panel = navegación, Ficha =
 * detalle"): al cerrar, vuelve a la Ficha de Proyecto en vez de a nada.
 * Usada tanto desde el Panel de campaña (Fase 1) como desde la propia
 * Ficha de Proyecto -- mismo destino coherente venga de donde venga.
 */
function abrirFormularioCrearDecisionParaProyecto(proyectoId) {
  abrirFormularioCrear_('DECISION', 'Nueva decisión', { PROYECTO_ID: proyectoId }, { tipo: 'ficha', entidad: 'PROYECTO', id: proyectoId });
}
function abrirFormularioCrearIncidenciaParaCampana(campanaId) {
  abrirFormularioCrear_('INCIDENCIA', 'Nueva incidencia', { CAMPANA_ID: campanaId, NIVEL_INCIDENCIA: 'Campaña' }, { tipo: 'ficha', entidad: 'CAMPANA', id: campanaId });
}
function abrirFormularioCrearIncidenciaParaProyecto(campanaId, proyectoId) {
  abrirFormularioCrear_('INCIDENCIA', 'Nueva incidencia', {
    CAMPANA_ID: campanaId, PROYECTO_ID: proyectoId, NIVEL_INCIDENCIA: 'Proyecto'
  }, { tipo: 'ficha', entidad: 'PROYECTO', id: proyectoId });
}
function abrirFormularioCrearIncidenciaParaProducto(campanaId, proyectoId, productoId) {
  abrirFormularioCrear_('INCIDENCIA', 'Nueva incidencia', {
    CAMPANA_ID: campanaId, PROYECTO_ID: proyectoId, PRODUCTO_ID: productoId, NIVEL_INCIDENCIA: 'Producto'
  });
}
function abrirFormularioCrearIncidenciaParaProceso(campanaId, proyectoId, productoId, procesoId) {
  abrirFormularioCrear_('INCIDENCIA', 'Nueva incidencia', {
    CAMPANA_ID: campanaId, PROYECTO_ID: proyectoId, PRODUCTO_ID: productoId, PROCESO_ID: procesoId, NIVEL_INCIDENCIA: 'Proceso'
  }, { tipo: 'ficha', entidad: 'PROCESO', id: procesoId });
}
function abrirFormularioCrearIncidenciaParaTarea(campanaId, proyectoId, productoId, procesoId, tareaId) {
  abrirFormularioCrear_('INCIDENCIA', 'Nueva incidencia', {
    CAMPANA_ID: campanaId, PROYECTO_ID: proyectoId, PRODUCTO_ID: productoId, PROCESO_ID: procesoId, TAREA_ID: tareaId, NIVEL_INCIDENCIA: 'Tarea'
  }, { tipo: 'ficha', entidad: 'TAREA', id: tareaId });
}
function abrirFormularioCrearDocumento() { abrirFormularioCrear_('DOCUMENTO', 'Nuevo documento'); }
function abrirFormularioCrearPresupuesto() { abrirFormularioCrear_('PRESUPUESTO', 'Nueva línea de presupuesto'); }
function abrirFormularioCrearFuenteFinanciacion() { abrirFormularioCrear_('FUENTE_FINANCIACION', 'Nueva fuente de financiación'); }
function abrirFormularioCrearCoste() { abrirFormularioCrear_('COSTE', 'Nuevo coste'); }
function abrirFormularioCrearCompetencia() { abrirFormularioCrear_('COMPETENCIA', 'Nueva competencia'); }
function abrirFormularioCrearPersonaCompetencia() { abrirFormularioCrear_('PERSONA_COMPETENCIA', 'Persona - Competencia (nueva)'); }
function abrirFormularioCrearRecursoCompetencia() { abrirFormularioCrear_('RECURSO_COMPETENCIA', 'Recurso - Competencia requerida (nueva)'); }
function abrirFormularioCrearTareaCompetencia() { abrirFormularioCrear_('TAREA_COMPETENCIA', 'Tarea - Competencia requerida (nueva)'); }
function abrirFormularioCrearConvocatoria() { abrirFormularioCrear_('CONVOCATORIA', 'Nueva convocatoria'); }
function abrirFormularioCrearEtiquetaImpacto() { abrirFormularioCrear_('ETIQUETA_IMPACTO', 'Nueva etiqueta de impacto'); }
/**
 * Punto de entrada generico "Editar registro" (Fase 1, BL-MVP-02).
 * Reconstruido tras deteccion de regresion via AUD-01.
 */
/*
 * Hueco detectado en L3.5 y registrado explicitamente para no abordarlo
 * en esa fase ("Editar registro" seguia pidiendo el ID exacto con un
 * ui.prompt() nativo, sin buscador, a diferencia de los desplegables de
 * dentro de cada formulario). El usuario lo ha vuelto a señalar en la
 * verificacion de L5.1 -- se corrige ahora para las 21 entidades que
 * comparten esta funcion, reutilizando el mismo patron de <datalist>
 * que FormularioGenerico.html.
 */
function abrirEditarRegistroPorEntidad_(entidad, etiqueta) {
  // seleccionarYAbrirEdicion abre otro modal (el formulario de edicion) --
  // ver abreOtroDialogo en abrirSelectorConAccion_.
  abrirSelectorConAccion_(entidad, 'Editar ' + etiqueta, 'seleccionarYAbrirEdicion', 'obtenerOpcionesEntidadParaSelector', true);
}
/*
 * Generaliza el selector con buscador (nacido en "Editar registro",
 * L3.5/L5.1) para cualquier flujo "elige un registro y luego haz X":
 * abrirConfirmarRecepcion lo reutiliza para no volver a pedir el ID a
 * memoria con un ui.prompt() (mismo hueco senalado por el usuario al
 * verificar L5.2).
 *
 * abreOtroDialogo (boolean, default false): true si accionFn termina
 * abriendo otro SpreadsheetApp.getUi().showModelessDialog() (p.ej.
 * seleccionarYAbrirEdicion, seleccionarYAbrirFicha*). Los dialogos son
 * modeless (ver conversacion -- "no pueden convivir los dos espacios"):
 * pueden coexistir sin pisarse, asi que ya no hace falta cerrar este
 * selector para que el siguiente se muestre. Sigue haciendo falta
 * lanzar accionFn ANTES de cerrar, no despues -- cerrar corta el canal
 * de google.script.run de ESTE dialogo antes de que la peticion salga
 * (confirmado con un marcador de diagnostico), problema de ciclo de
 * vida del iframe, no de modal-vs-modeless. Cuando accionFn no abre
 * nada mas y puede fallar con un error que hay que mostrar aqui mismo
 * (confirmarRecepcion_), sigue siendo correcto cerrar solo tras el
 * exito.
 */
function abrirSelectorConAccion_(entidad, tituloVentana, accionFn, opcionesFn, abreOtroDialogo) {
  var template = HtmlService.createTemplateFromFile('SelectorRegistro');
  template.entidad = entidad;
  template.titulo = tituloVentana;
  template.accionFn = accionFn;
  template.opcionesFn = opcionesFn;
  template.abreOtroDialogo = !!abreOtroDialogo;
  var html = template.evaluate().setWidth(380).setHeight(220);
  SpreadsheetApp.getUi().showModelessDialog(html, tituloVentana);
}
/*
 * Texto adicional buscable por entidad, mas alla de ID/NOMBRE (ver
 * conversacion: "buscador mas profundo" -- en Persona/Equipo, buscar
 * solo por nombre no encontraba a alguien por su rol o tipo).
 */
function etiquetaExtraSelector_(clave, registro) {
  if (clave === 'PERSONA_EQUIPO') {
    var partes = [registro.TIPO, registro.ROL].filter(function (v) { return v; });
    return partes.length ? ' (' + partes.join(' · ') + ')' : '';
  }
  return '';
}
/*
 * Hallazgo real al verificar el cierre de PedidoRecepcion.js (ver
 * conversación -- "en estos buscadores solo sale el id, necesitamos que
 * salga el nombre"): 22 de las 37 entidades no tienen NOMBRE/TITULO
 * (son relaciones/movimientos, p.ej. RECEPCION_LINEA, PEDIDO_PROVEEDOR),
 * así que el buscador solo mostraba el ID. En vez de mantener una lista
 * aparte de "campos identificativos" por entidad (se desincronizaría del
 * esquema real), se reutiliza ESQUEMAS_FORMULARIO_MVP -- ya es la fuente
 * de verdad de qué campos tiene cada entidad y en qué orden importan.
 *
 * Toma los 3 primeros campos del esquema (saltando ESTADO/OBSERVACIONES,
 * ya cubiertos por otras vías) y construye una etiqueta legible:
 * - tipo 'fk': resuelve el NOMBRE/TITULO del registro referenciado
 *   (con caché por llamada, ver cacheNombresFk_ en
 *   obtenerOpcionesEntidadParaSelector). Si el propio referenciado
 *   tampoco tiene NOMBRE/TITULO (encadenamiento, p.ej.
 *   RECEPCION_LINEA -> RECEPCION), cae al ID en crudo -- no se resuelve
 *   en cascada para no complicar ni encarecer la búsqueda.
 * - tipo 'fk_dependiente' (ENTIDAD_TIPO/ENTIDAD_ID polimórfico): se
 *   deja en crudo (el propio ENTIDAD_TIPO ya es legible, p.ej.
 *   "Proceso"); resolver el registro apuntado exigiría repetir la
 *   lógica de MAPAS_DEPENDENCIA_MVP aquí, fuera de alcance de este
 *   arreglo puntual.
 * - tipo 'fecha': formatea con Utilities.formatDate (mismo patrón que
 *   el resto del proyecto, p.ej. DesviacionService.js).
 * - el resto (numero/catalogo/texto): valor tal cual.
 */
function resolverNombreFk_(entidadFk, id, cacheNombresFk_) {
  if (!id) return null;

  var claveCache = entidadFk + ':' + id;

  if (cacheNombresFk_.hasOwnProperty(claveCache)) {
    return cacheNombresFk_[claveCache];
  }

  var registroFk = obtenerRegistroPorId(entidadFk, id);
  var nombre = registroFk ? (registroFk.NOMBRE || registroFk.TITULO || null) : null;

  cacheNombresFk_[claveCache] = nombre;

  return nombre;
}
function resolverEtiquetaPrincipal_(clave, registro, cacheNombresFk_) {
  if (registro.NOMBRE) return registro.NOMBRE;
  if (registro.TITULO) return registro.TITULO;

  var esquema = ESQUEMAS_FORMULARIO_MVP[clave];

  if (!esquema) return '';

  var campos = esquema
    .filter(function (campo) { return campo.campo !== 'ESTADO' && campo.campo !== 'OBSERVACIONES'; })
    .slice(0, 3);

  var partes = campos.map(function (campo) {
    var valor = registro[campo.campo];

    if (valor === undefined || valor === null || valor === '') return null;

    if (campo.tipo === 'fk') {
      return resolverNombreFk_(campo.entidadFk, valor, cacheNombresFk_) || valor;
    }

    if (campo.tipo === 'fecha') {
      try {
        return Utilities.formatDate(new Date(valor), Session.getScriptTimeZone() || 'Europe/Madrid', 'dd/MM/yyyy');
      } catch (e) {
        return valor;
      }
    }

    return valor;
  }).filter(function (parte) { return parte !== null && parte !== undefined && parte !== ''; });

  return partes.join(' · ');
}
function obtenerOpcionesEntidadParaSelector(entidad, incluirPruebas) {
  var clave = String(entidad || '').trim().toUpperCase();

  if (!ENTIDADES_MVP[clave]) {
    throw new Error('Entidad no configurada: ' + entidad);
  }

  var registros = listarRegistros(clave, { ACTIVO: 'SÍ' });
  registros = filtrarPorNivelDato_(clave, registros, incluirPruebas);

  var cacheNombresFk_ = {};

  return registros.map(function (registro) {
    var etiquetaPrincipal = resolverEtiquetaPrincipal_(clave, registro, cacheNombresFk_);
    var etiqueta = registro.ID + (etiquetaPrincipal ? ' - ' + etiquetaPrincipal : '') + etiquetaExtraSelector_(clave, registro);
    return {
      id: registro.ID,
      etiqueta: aplicarSufijoNivelDato_(clave, registro, etiqueta)
    };
  });
}
function seleccionarYAbrirEdicion(entidad, idRegistro) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);

  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }

  abrirFormularioEditarPorId(entidad, idRegistro);

  return true;
}
function abrirEditarCampana() { abrirEditarRegistroPorEntidad_('CAMPANA', 'Campaña'); }
function abrirEditarProyecto() { abrirEditarRegistroPorEntidad_('PROYECTO', 'Proyecto'); }
function abrirEditarProducto() { abrirEditarRegistroPorEntidad_('PRODUCTO', 'Producto'); }
function abrirEditarProceso() { abrirEditarRegistroPorEntidad_('PROCESO', 'Proceso'); }
function abrirEditarTarea() { abrirEditarRegistroPorEntidad_('TAREA', 'Tarea'); }
function abrirEditarMaterial() { abrirEditarRegistroPorEntidad_('MATERIAL', 'Material'); }
function abrirEditarPersonaEquipo() { abrirEditarRegistroPorEntidad_('PERSONA_EQUIPO', 'Persona/Equipo'); }
function abrirEditarProveedor() { abrirEditarRegistroPorEntidad_('PROVEEDOR', 'Proveedor'); }
function abrirEditarCliente() { abrirEditarRegistroPorEntidad_('CLIENTE', 'Cliente'); }
function abrirEditarPedidoCliente() { abrirEditarRegistroPorEntidad_('PEDIDO_CLIENTE', 'Pedido de cliente'); }
function abrirEditarPedidoClienteLinea() { abrirEditarRegistroPorEntidad_('PEDIDO_CLIENTE_LINEA', 'Pedido de cliente - Línea'); }
function abrirEditarEntrega() { abrirEditarRegistroPorEntidad_('ENTREGA', 'Entrega'); }
function abrirEditarEntregaLinea() { abrirEditarRegistroPorEntidad_('ENTREGA_LINEA', 'Entrega - Línea'); }
function abrirEditarContratoServicio() { abrirEditarRegistroPorEntidad_('CONTRATO_SERVICIO', 'Contrato de servicio'); }
function abrirEditarOportunidad() { abrirEditarRegistroPorEntidad_('OPORTUNIDAD', 'Oportunidad'); }
function abrirEditarDecision() { abrirEditarRegistroPorEntidad_('DECISION', 'Decisión'); }
function abrirEditarIncidencia() { abrirEditarRegistroPorEntidad_('INCIDENCIA', 'Incidencia'); }
function abrirEditarDocumento() { abrirEditarRegistroPorEntidad_('DOCUMENTO', 'Documento'); }
function abrirEditarPresupuesto() { abrirEditarRegistroPorEntidad_('PRESUPUESTO', 'línea de presupuesto'); }
function abrirEditarFuenteFinanciacion() { abrirEditarRegistroPorEntidad_('FUENTE_FINANCIACION', 'fuente de financiación'); }
function abrirEditarCoste() { abrirEditarRegistroPorEntidad_('COSTE', 'coste'); }
function abrirEditarCompetencia() { abrirEditarRegistroPorEntidad_('COMPETENCIA', 'competencia'); }
function abrirEditarPersonaCompetencia() { abrirEditarRegistroPorEntidad_('PERSONA_COMPETENCIA', 'persona - competencia'); }
function abrirEditarRecursoCompetencia() { abrirEditarRegistroPorEntidad_('RECURSO_COMPETENCIA', 'recurso - competencia'); }
function abrirEditarTareaCompetencia() { abrirEditarRegistroPorEntidad_('TAREA_COMPETENCIA', 'tarea - competencia'); }
function abrirEditarConvocatoria() { abrirEditarRegistroPorEntidad_('CONVOCATORIA', 'convocatoria'); }
function abrirEditarEtiquetaImpacto() { abrirEditarRegistroPorEntidad_('ETIQUETA_IMPACTO', 'etiqueta de impacto'); }
function abrirEditarProyectoProducto() { abrirEditarRegistroPorEntidad_('PROYECTO_PRODUCTO', 'Proyecto-Producto'); }
function abrirEditarTareaResponsable() { abrirEditarRegistroPorEntidad_('TAREA_RESPONSABLE', 'Tarea-Responsable'); }
function abrirEditarProductoMaterial() { abrirEditarRegistroPorEntidad_('PRODUCTO_MATERIAL', 'Producto-Material'); }
function abrirEditarTareaMaterial() { abrirEditarRegistroPorEntidad_('TAREA_MATERIAL', 'Tarea-Material'); }
function abrirEditarAsignacion() { abrirEditarRegistroPorEntidad_('ASIGNACION', 'Asignación'); }
function abrirEditarRelacion() { abrirEditarRegistroPorEntidad_('RELACION', 'Relación'); }
function abrirEditarVinculo() { abrirEditarRegistroPorEntidad_('VINCULO', 'Vínculo'); }
function abrirEditarHorario() { abrirEditarRegistroPorEntidad_('HORARIO', 'Horario'); }
function abrirEditarMovimientoMaterial() { abrirEditarRegistroPorEntidad_('MOVIMIENTO_MATERIAL', 'Movimiento de material'); }
function abrirEditarEjecucionTarea() { abrirEditarRegistroPorEntidad_('EJECUCION_TAREA', 'Ejecución de tarea'); }
function abrirEditarProveedorMaterial() { abrirEditarRegistroPorEntidad_('PROVEEDOR_MATERIAL', 'Proveedor-Material'); }
function abrirEditarEquipoMiembro() { abrirEditarRegistroPorEntidad_('EQUIPO_MIEMBRO', 'Equipo-Miembro'); }
function abrirEditarRecurso() { abrirEditarRegistroPorEntidad_('RECURSO', 'Recurso'); }
function abrirEditarTareaRecurso() { abrirEditarRegistroPorEntidad_('TAREA_RECURSO', 'Tarea-Recurso'); }
function abrirEditarTareaRecursoNecesidad() { abrirEditarRegistroPorEntidad_('TAREA_RECURSO_NECESIDAD', 'Tarea-Necesidad de recurso'); }
function abrirEditarEscenario() { abrirEditarRegistroPorEntidad_('ESCENARIO', 'Escenario de simulación'); }
function abrirEditarPedidoProveedor() { abrirEditarRegistroPorEntidad_('PEDIDO_PROVEEDOR', 'Pedido a proveedor'); }
function abrirEditarPedidoProveedorLinea() { abrirEditarRegistroPorEntidad_('PEDIDO_PROVEEDOR_LINEA', 'Pedido-Línea'); }
function abrirEditarRecepcion() { abrirEditarRegistroPorEntidad_('RECEPCION', 'Recepción de pedido'); }
function abrirEditarRecepcionLinea() { abrirEditarRegistroPorEntidad_('RECEPCION_LINEA', 'Recepción-Línea'); }
/**
 * Menu "Relaciones" (Fase 1/2, BL-MVP-02): entradas de creacion para entidades de relacion.
 */
function abrirFormularioCrearProyectoProducto() { abrirFormularioCrear_('PROYECTO_PRODUCTO', 'Nueva relación proyecto-producto'); }
function abrirFormularioCrearTareaResponsable() { abrirFormularioCrear_('TAREA_RESPONSABLE', 'Nueva asignación tarea-responsable'); }
function abrirFormularioCrearProductoMaterial() { abrirFormularioCrear_('PRODUCTO_MATERIAL', 'Nueva relación producto-material'); }
function abrirFormularioCrearTareaMaterial() { abrirFormularioCrear_('TAREA_MATERIAL', 'Nueva relación tarea-material'); }
function abrirFormularioCrearAsignacion() { abrirFormularioCrear_('ASIGNACION', 'Nueva asignación'); }
function abrirFormularioCrearRelacion() { abrirFormularioCrear_('RELACION', 'Nueva relación / dependencia'); }
function abrirFormularioCrearVinculo() { abrirFormularioCrear_('VINCULO', 'Nuevo vínculo genérico'); }
function abrirFormularioCrearHorario() { abrirFormularioCrear_('HORARIO', 'Nuevo horario (franja semanal)'); }
function abrirFormularioCrearMovimientoMaterial() { abrirFormularioCrear_('MOVIMIENTO_MATERIAL', 'Nuevo movimiento de material'); }
function abrirFormularioCrearEjecucionTarea() { abrirFormularioCrear_('EJECUCION_TAREA', 'Nueva ejecución de tarea'); }
function abrirFormularioCrearProveedorMaterial() { abrirFormularioCrear_('PROVEEDOR_MATERIAL', 'Nueva relación proveedor-material'); }
function abrirFormularioCrearEquipoMiembro() { abrirFormularioCrear_('EQUIPO_MIEMBRO', 'Nueva relación equipo-miembro'); }
function abrirFormularioCrearRecurso() { abrirFormularioCrear_('RECURSO', 'Nuevo recurso'); }
function abrirFormularioCrearTareaRecurso() { abrirFormularioCrear_('TAREA_RECURSO', 'Nueva relación tarea-recurso'); }
function abrirFormularioCrearTareaRecursoNecesidad() { abrirFormularioCrear_('TAREA_RECURSO_NECESIDAD', 'Tarea - Necesidad de recurso (nueva)'); }
function abrirFormularioCrearEscenario() { abrirFormularioCrear_('ESCENARIO', 'Nuevo escenario de simulación'); }
function abrirFormularioCrearPedidoProveedor() { abrirFormularioCrear_('PEDIDO_PROVEEDOR', 'Nuevo pedido a proveedor'); }
function abrirFormularioCrearPedidoProveedorLinea() { abrirFormularioCrear_('PEDIDO_PROVEEDOR_LINEA', 'Nueva línea de pedido'); }
function abrirFormularioCrearRecepcion() { abrirFormularioCrear_('RECEPCION', 'Nueva recepción de pedido'); }
function abrirFormularioCrearRecepcionLinea() { abrirFormularioCrear_('RECEPCION_LINEA', 'Nueva línea de recepción'); }
/**
 * Menu "Administración" (Fase 1, BL-MVP-02): accesos rapidos a hojas de soporte.
 */
function abrirHojaAdmin_(nombreHoja) {
  var ss = SpreadsheetApp.getActive();
  var hoja = ss.getSheetByName(nombreHoja);
  if (!hoja) {
    SpreadsheetApp.getUi().alert('No existe la hoja ' + nombreHoja + '.');
    return;
  }
  ss.setActiveSheet(hoja);
}
// abrirCatalogosAdmin ahora vive en GestionCatalogos.js (hallazgo #21:
// interfaz real en vez de abrir la hoja cruda 90_CONFIGURACION).
function abrirPersonasEquiposAdmin() { abrirHojaAdmin_('11_PERSONAS_EQUIPOS'); }
function abrirProveedoresAdmin() { abrirHojaAdmin_('15_PROVEEDORES'); }
function abrirHistorialAdmin() { abrirHojaAdmin_('91_HISTORIAL'); }

/*
 * Extraidas de PedidoRecepcion.js (ver PROPUESTA_MODULARIZACION_LIBRERIA.md):
 * unico manejador de menu real para confirmar recepciones. Reemplaza el
 * ui.prompt() original (pedia el ID de memoria) por el selector con
 * buscador generico (abrirSelectorConAccion_). Solo ofrece recepciones no
 * Confirmadas/Canceladas -- "pedidos a recepcionar" en la terminologia del
 * usuario. La logica de dominio (confirmarRecepcion_ y compañia) vive en
 * PedidoRecepcionService.js.
 */
function abrirConfirmarRecepcion() {
  abrirSelectorConAccion_(
    'RECEPCION',
    'Confirmar recepción de pedido',
    'seleccionarYConfirmarRecepcion',
    'obtenerOpcionesRecepcionPendiente'
  );
}

/*
 * Igual que el flujo previo del ui.prompt: previsualiza (ui.alert), pide
 * confirmacion explicita y solo entonces escribe. Se llama desde
 * SelectorRegistro.html tras elegir la recepcion en el buscador.
 */
function seleccionarYConfirmarRecepcion(entidad, recepcionId) {
  var ui = SpreadsheetApp.getUi();

  var resultado;

  try {
    resultado = confirmarRecepcion_(recepcionId, false);
  } catch (e) {
    ui.alert('No se puede confirmar', e.message, ui.ButtonSet.OK);
    return true;
  }

  var detalleLineas = resultado.lineas
    .map(function (l) { return '- ' + l.materialId + ': ' + l.cantidad + ' ' + l.unidad; })
    .join('\n');

  var mensaje =
    'Pedido: ' + resultado.pedidoId + '\n' +
    'Se generará una entrada de stock por cada línea:\n' +
    detalleLineas + '\n\n' +
    '¿Confirmar la recepción y registrar estas entradas?';

  var confirmacion = ui.alert('Confirmar recepción', mensaje, ui.ButtonSet.YES_NO);

  if (confirmacion !== ui.Button.YES) return true;

  try {
    confirmarRecepcion_(recepcionId, true);
    ui.alert(
      'Recepción confirmada',
      'Se registraron ' + resultado.numLineas + ' entradas de material para ' + recepcionId + '.',
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('Error al confirmar', e.message, ui.ButtonSet.OK);
  }

  return true;
}
function abrirFormularioCrearMaterial() { abrirFormularioCrear_('MATERIAL', 'Nuevo material'); }
function abrirFormularioCrearPersonaEquipo() { abrirFormularioCrear_('PERSONA_EQUIPO', 'Nueva persona/equipo'); }