/**
 * "Incidencia aprobada -> Tarea" (ver ROADMAP_GESTOR_PROYECTOS_CLIENTE_
 * VENTAS.md, "El canal de comunicación", pieza diseñada en la Fase 1a
 * pero nunca construida). Cuando una INCIDENCIA pasa a ESTADO
 * 'En resolución' (se reutiliza este estado existente como disparador
 * -- CFG_ESTADO_INCIDENCIA no tenía ningún valor 'Aprobada', y no hacía
 * falta inventar uno nuevo), se crea una TAREA real, enlazada a la
 * INCIDENCIA vía VINCULO (18_VINCULO, genérico). Dos niveles soportados,
 * mismo mecanismo, ámbito distinto:
 *
 * - NIVEL_INCIDENCIA='Cliente' + CLIENTE_ID: soporte a un cliente
 *   entregado. La cadena completa CAMPANA->PROYECTO->PRODUCTO->PROCESO
 *   se crea perezosamente y una sola vez por cliente (una CAMPANA
 *   "paraguas" compartida "Mantenimiento de clientes", un PROYECTO/
 *   PRODUCTO/PROCESO de soporte por cliente).
 * - NIVEL_INCIDENCIA='Producto' + PRODUCTO_ID (ver conversación --
 *   ROADMAP_PROYECTO_0.md, "generalizar IncidenciaMantenimientoService.js"):
 *   mejora/auditoría de un módulo propio de la librería (cada módulo ya
 *   es un PRODUCTO real, sembrado vía importación masiva bajo la
 *   campaña "Proyecto 0" -- no hace falta crear CAMPANA/PROYECTO/
 *   PRODUCTO aquí, solo el PROCESO de mejora continua, perezosamente y
 *   una sola vez por módulo). No requiere ningún catálogo nuevo:
 *   'Producto' ya existía en CFG_NIVEL_INCIDENCIA.
 *
 * Vive en el módulo CLIENTE (depende de CORE) porque la rama 'Cliente'
 * solo tiene sentido si ese módulo está instalado -- la rama 'Producto'
 * no lo necesita, pero vivir en el mismo fichero evita duplicar el
 * despachador y la creación de TAREA/VINCULO, idénticos en ambas ramas.
 */

var NOMBRE_CAMPANA_MANTENIMIENTO_CLIENTES_ = 'Mantenimiento de clientes';
var NOMBRE_PRODUCTO_SOPORTE_CLIENTE_ = 'Soporte técnico';
var NOMBRE_PROCESO_SOPORTE_CLIENTE_ = 'Atención de incidencias';
var NOMBRE_PROCESO_MEJORA_PRODUCTO_ = 'Mejora continua';

function gestionarCreacionTareaMantenimientoDesdeIncidencia_(idIncidencia, datos, correlationId) {
  if (datos.ESTADO !== 'En resolución') return;

  var yaGeneroTarea = obtenerVinculosDeEntidad('INCIDENCIA', idIncidencia).some(function (v) { return v.entidad === 'TAREA'; });
  if (yaGeneroTarea) return;

  var procesoId;
  if (datos.NIVEL_INCIDENCIA === 'Cliente' && datos.CLIENTE_ID) {
    var cliente = obtenerRegistroPorId('CLIENTE', datos.CLIENTE_ID);
    if (!cliente) return;
    procesoId = obtenerOCrearProcesoSoporteCliente_(cliente, correlationId);
  } else if (datos.NIVEL_INCIDENCIA === 'Producto' && datos.PRODUCTO_ID) {
    var producto = obtenerRegistroPorId('PRODUCTO', datos.PRODUCTO_ID);
    if (!producto) return;
    procesoId = obtenerOCrearProcesoMejoraProducto_(producto, correlationId);
  } else {
    return;
  }

  var siguienteOrden = listarRegistrosSeguro_('TAREA', { ACTIVO: 'SÍ', PROCESO_ID: procesoId }).length + 1;

  var resultadoTarea = guardarFormulario('TAREA', null, {
    PROCESO_ID: procesoId,
    NOMBRE: datos.TITULO || ('Soporte -- ' + idIncidencia),
    DESCRIPCION: datos.DESCRIPCION || datos.OBSERVACIONES || '',
    ORDEN_SECUENCIA: siguienteOrden,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0
  }, correlationId);

  /*
   * ESTADO explícito (ver conversación -- bug real encontrado probando
   * en vivo): VINCULO.ESTADO tiene valorPorDefecto='Activa' en el
   * esquema, pero ese default solo lo aplica el JS de
   * FormularioGenerico.html al rellenar el formulario visual -- nunca
   * cuando se llama a guardarFormulario directamente desde código de
   * servidor como aquí. CAMPOS_OBLIGATORIOS_MVP.VINCULO exige ESTADO,
   * así que sin esto la creación fallaba siempre con "Campos
   * obligatorios ausentes o vacíos: ESTADO".
   */
  guardarFormulario('VINCULO', null, {
    ENTIDAD_ORIGEN_TIPO: 'Incidencia',
    ENTIDAD_ORIGEN_ID: idIncidencia,
    ENTIDAD_DESTINO_TIPO: 'Tarea',
    ENTIDAD_DESTINO_ID: resultadoTarea.id,
    TIPO_VINCULO: 'Corrige',
    ESTADO: 'Activa'
  }, correlationId);
}

/*
 * Cambio de ESTADO de un clic (ver conversación -- "que cambiar el
 * estado sea un clic, ya sea por formulario o por la ficha"): usado por
 * FichaIncidencia.html y por cambiarEstadoKanban (KanbanService.js).
 * Dispara las mismas reglas de negocio que guardarFormulario (Incidencia
 * aprobada -> Tarea) -- un actualizarRegistroTransaccional_ suelto
 * (como el que usa el resto del Kanban) las saltaría, porque el gancho
 * vive en guardarFormulario, no en el repositorio genérico.
 */
function cambiarEstadoIncidenciaRapido_(id, nuevoEstado) {
  actualizarRegistroTransaccional('INCIDENCIA', id, { ESTADO: nuevoEstado }, { origen: 'UI' });
  var registro = obtenerRegistroPorId('INCIDENCIA', id);
  gestionarCreacionTareaMantenimientoDesdeIncidencia_(id, registro, generarCorrelationId_());
  return registro;
}

/*
 * A diferencia de obtenerOCrearProcesoSoporteCliente_ (que también
 * tiene que crear PRODUCTO/PROYECTO/CAMPAÑA perezosamente, porque un
 * cliente nuevo no tiene nada de eso todavía), aquí el PRODUCTO ya
 * existe siempre -- los 15 módulos se sembraron de una vez vía
 * importación masiva (ver ROADMAP_PROYECTO_0.md) bajo la campaña
 * "Proyecto 0", con su propio PROYECTO ya vinculado. Solo falta el
 * PROCESO de mejora continua, perezoso y una sola vez por módulo.
 */
function obtenerOCrearProcesoMejoraProducto_(producto, correlationId) {
  var existente = listarRegistrosSeguro_('PROCESO', { ACTIVO: 'SÍ', PRODUCTO_ID: producto.ID, NOMBRE: NOMBRE_PROCESO_MEJORA_PRODUCTO_ })[0];
  if (existente) return existente.ID;

  var resultado = guardarFormulario('PROCESO', null, {
    PRODUCTO_ID: producto.ID,
    NOMBRE: NOMBRE_PROCESO_MEJORA_PRODUCTO_,
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'En proceso',
    FECHA_INICIO_REAL: formatoFechaISO_(new Date()),
    PORCENTAJE_AVANCE: 0
  }, correlationId);
  return resultado.id;
}

function obtenerOCrearProcesoSoporteCliente_(cliente, correlationId) {
  var productoId = obtenerOCrearProductoSoporteCliente_(cliente, correlationId);

  var existente = listarRegistrosSeguro_('PROCESO', { ACTIVO: 'SÍ', PRODUCTO_ID: productoId, NOMBRE: NOMBRE_PROCESO_SOPORTE_CLIENTE_ })[0];
  if (existente) return existente.ID;

  var resultado = guardarFormulario('PROCESO', null, {
    PRODUCTO_ID: productoId,
    NOMBRE: NOMBRE_PROCESO_SOPORTE_CLIENTE_,
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'En proceso',
    FECHA_INICIO_REAL: formatoFechaISO_(new Date()),
    PORCENTAJE_AVANCE: 0
  }, correlationId);
  return resultado.id;
}

function obtenerOCrearProductoSoporteCliente_(cliente, correlationId) {
  var codigo = 'SOP-' + cliente.ID;
  var existente = listarRegistrosSeguro_('PRODUCTO', { ACTIVO: 'SÍ', CODIGO: codigo })[0];
  if (existente) return existente.ID;

  var proyectoId = obtenerOCrearProyectoMantenimientoCliente_(cliente, correlationId);
  var resultado = guardarFormulario('PRODUCTO', null, {
    NOMBRE: NOMBRE_PRODUCTO_SOPORTE_CLIENTE_,
    ORIGEN: 'Pedido externo',
    UNIDAD: 'Unidad',
    CANTIDAD_PREVISTA: 1,
    PRIORIDAD: 'Media',
    CODIGO: codigo,
    ESTADO: 'En producción',
    PROYECTO_VINCULAR_ID: proyectoId
  }, correlationId);
  return resultado.id;
}

function obtenerOCrearProyectoMantenimientoCliente_(cliente, correlationId) {
  var existente = listarRegistrosSeguro_('PROYECTO', { ACTIVO: 'SÍ', CLIENTE_ID: cliente.ID, TIPO_PROYECTO: 'Mantenimiento / reparación' })
    .filter(function (p) { return p.ESTADO !== 'Completado' && p.ESTADO !== 'Cancelado'; })[0];
  if (existente) return existente.ID;

  var campanaId = obtenerOCrearCampanaMantenimientoClientes_(correlationId);
  var hoy = formatoFechaISO_(new Date());
  var enCincoAnios = formatoFechaISO_(new Date(new Date().setFullYear(new Date().getFullYear() + 5)));

  var resultado = guardarFormulario('PROYECTO', null, {
    CAMPANA_ID: campanaId,
    NOMBRE: 'Mantenimiento -- ' + cliente.NOMBRE,
    TIPO_PROYECTO: 'Mantenimiento / reparación',
    PRIORIDAD: 'Media',
    CLIENTE_ID: cliente.ID,
    FECHA_INICIO_PLAN: hoy,
    FECHA_FIN_PLAN: enCincoAnios,
    ESTADO: 'En proceso',
    FECHA_INICIO_REAL: hoy
  }, correlationId);
  return resultado.id;
}

function obtenerOCrearCampanaMantenimientoClientes_(correlationId) {
  var existente = listarRegistrosSeguro_('CAMPANA', { ACTIVO: 'SÍ', NOMBRE: NOMBRE_CAMPANA_MANTENIMIENTO_CLIENTES_ })[0];
  if (existente) return existente.ID;

  var hoy = formatoFechaISO_(new Date());
  var enCincoAnios = formatoFechaISO_(new Date(new Date().setFullYear(new Date().getFullYear() + 5)));

  var resultado = guardarFormulario('CAMPANA', null, {
    NOMBRE: NOMBRE_CAMPANA_MANTENIMIENTO_CLIENTES_,
    DESCRIPCION: 'Paraguas para los proyectos de Mantenimiento de todos los clientes -- creada automáticamente, ver IncidenciaMantenimientoService.js.',
    FECHA_INICIO_PLAN: hoy,
    FECHA_FIN_PLAN: enCincoAnios,
    ESTADO: 'Activa',
    NIVEL_DATO: 'Operativo'
  }, correlationId);
  return resultado.id;
}

function formatoFechaISO_(fecha) {
  return Utilities.formatDate(fecha, Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd');
}
