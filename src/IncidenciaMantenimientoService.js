/**
 * "Incidencia aprobada -> Tarea" (ver ROADMAP_GESTOR_PROYECTOS_CLIENTE_
 * VENTAS.md, "El canal de comunicación", pieza diseñada en la Fase 1a
 * pero nunca construida). Cuando una INCIDENCIA de NIVEL_INCIDENCIA
 * 'Cliente' pasa a ESTADO 'En resolución' (se reutiliza este estado
 * existente como disparador -- CFG_ESTADO_INCIDENCIA no tenía ningún
 * valor 'Aprobada', y no hacía falta inventar uno nuevo), se crea una
 * TAREA real bajo un PROYECTO de tipo Mantenimiento del cliente,
 * enlazada a la INCIDENCIA vía VINCULO (18_VINCULO, genérico).
 *
 * La cadena completa CAMPANA->PROYECTO->PRODUCTO->PROCESO->TAREA es
 * obligatoria (TAREA no existe sin PROCESO, PROCESO no existe sin
 * PRODUCTO, etc.) así que se crea perezosamente y una sola vez por
 * cliente: una CAMPANA "paraguas" compartida por todos los clientes
 * ("Mantenimiento de clientes"), un PROYECTO/PRODUCTO/PROCESO de
 * soporte por cliente, reutilizados en cada incidencia siguiente.
 *
 * Vive en el módulo CLIENTE (depende de CORE) porque solo tiene sentido
 * si CLIENTE está instalado -- sin él no puede haber
 * NIVEL_INCIDENCIA='Cliente' con CLIENTE_ID.
 */

var NOMBRE_CAMPANA_MANTENIMIENTO_CLIENTES_ = 'Mantenimiento de clientes';
var NOMBRE_PRODUCTO_SOPORTE_CLIENTE_ = 'Soporte técnico';
var NOMBRE_PROCESO_SOPORTE_CLIENTE_ = 'Atención de incidencias';

function gestionarCreacionTareaMantenimientoDesdeIncidencia_(idIncidencia, datos, correlationId) {
  if (datos.ESTADO !== 'En resolución') return;
  if (datos.NIVEL_INCIDENCIA !== 'Cliente' || !datos.CLIENTE_ID) return;

  var yaGeneroTarea = obtenerVinculosDeEntidad('INCIDENCIA', idIncidencia).some(function (v) { return v.entidad === 'TAREA'; });
  if (yaGeneroTarea) return;

  var cliente = obtenerRegistroPorId('CLIENTE', datos.CLIENTE_ID);
  if (!cliente) return;

  var procesoId = obtenerOCrearProcesoSoporteCliente_(cliente, correlationId);

  var siguienteOrden = listarRegistrosSeguro_('TAREA', { ACTIVO: 'SÍ', PROCESO_ID: procesoId }).length + 1;

  var resultadoTarea = guardarFormulario('TAREA', null, {
    PROCESO_ID: procesoId,
    NOMBRE: datos.TITULO || ('Soporte -- ' + idIncidencia),
    DESCRIPCION: datos.DESCRIPCION || datos.OBSERVACIONES || '',
    ORDEN_SECUENCIA: siguienteOrden,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente'
  }, correlationId);

  guardarFormulario('VINCULO', null, {
    ENTIDAD_ORIGEN_TIPO: 'Incidencia',
    ENTIDAD_ORIGEN_ID: idIncidencia,
    ENTIDAD_DESTINO_TIPO: 'Tarea',
    ENTIDAD_DESTINO_ID: resultadoTarea.id,
    TIPO_VINCULO: 'Corrige'
  }, correlationId);
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
    ESTADO: 'En proceso'
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
    ESTADO: 'En proceso'
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
