/**
 * Ficha de registro de Incidencia (ver conversacion -- pedida como
 * destino del clic en las tarjetas de Incidencia del Kanban operativo,
 * en vez de saltar directo al formulario de edicion). Mismo patron que
 * las fichas anteriores: agregador de solo lectura -- contexto
 * jerarquico (Campaña->Proyecto->Producto->Proceso->Tarea, todos
 * opcionales/encadenados) y documentos vinculados (DOCUMENTO si admite
 * 'Incidencia' como ENTIDAD_TIPO directamente, a diferencia de Recurso
 * que necesita VINCULO).
 */

function obtenerFichaIncidencia(id) {
  var incidencia = obtenerRegistroPorId('INCIDENCIA', id);
  if (!incidencia) {
    throw new Error('No existe ningún registro de Incidencia con id "' + id + '".');
  }

  var nombresPorEntidad_ = {
    CAMPANA: {}, PROYECTO: {}, PRODUCTO: {}, PROCESO: {}, TAREA: {}
  };
  listarRegistros('CAMPANA', {}).forEach(function (c) { nombresPorEntidad_.CAMPANA[c.ID] = c.NOMBRE; });
  listarRegistros('PROYECTO', {}).forEach(function (p) { nombresPorEntidad_.PROYECTO[p.ID] = p.NOMBRE; });
  listarRegistros('PRODUCTO', {}).forEach(function (p) { nombresPorEntidad_.PRODUCTO[p.ID] = p.NOMBRE; });
  listarRegistros('PROCESO', {}).forEach(function (p) { nombresPorEntidad_.PROCESO[p.ID] = p.NOMBRE; });
  listarRegistros('TAREA', {}).forEach(function (t) { nombresPorEntidad_.TAREA[t.ID] = t.NOMBRE; });

  var contexto = {
    campanaId: incidencia.CAMPANA_ID || null,
    campanaNombre: incidencia.CAMPANA_ID ? (nombresPorEntidad_.CAMPANA[incidencia.CAMPANA_ID] || incidencia.CAMPANA_ID) : null,
    proyectoId: incidencia.PROYECTO_ID || null,
    proyectoNombre: incidencia.PROYECTO_ID ? (nombresPorEntidad_.PROYECTO[incidencia.PROYECTO_ID] || incidencia.PROYECTO_ID) : null,
    productoId: incidencia.PRODUCTO_ID || null,
    productoNombre: incidencia.PRODUCTO_ID ? (nombresPorEntidad_.PRODUCTO[incidencia.PRODUCTO_ID] || incidencia.PRODUCTO_ID) : null,
    procesoId: incidencia.PROCESO_ID || null,
    procesoNombre: incidencia.PROCESO_ID ? (nombresPorEntidad_.PROCESO[incidencia.PROCESO_ID] || incidencia.PROCESO_ID) : null,
    tareaId: incidencia.TAREA_ID || null,
    tareaNombre: incidencia.TAREA_ID ? (nombresPorEntidad_.TAREA[incidencia.TAREA_ID] || incidencia.TAREA_ID) : null
  };

  var documentos = listarRegistrosSeguro_('DOCUMENTO', { ACTIVO: 'SÍ' })
    .filter(function (d) { return d.ENTIDAD_TIPO === 'Incidencia' && d.ENTIDAD_ID === id; })
    .map(function (d) { return { id: d.ID, titulo: d.TITULO, tipo: d.TIPO_DOCUMENTO, estado: d.ESTADO }; });

  /*
   * Decisiones vinculadas (ver conversacion -- "relación incidencia-
   * decisión-tarea"): DECISION no tiene INCIDENCIA_ID propio, se
   * relaciona via VINCULO (generico, obtenerVinculosDeEntidad en
   * Formularios.js -- mismo mecanismo ya usado en Ficha de Recurso
   * para sus incidencias, aqui al reves).
   */
  var decisionesVinculadas = obtenerVinculosDeEntidad('INCIDENCIA', id)
    .filter(function (v) { return v.entidad === 'DECISION'; });

  return serializarParaCliente_({
    incidencia: incidencia,
    contexto: contexto,
    documentos: documentos,
    decisionesVinculadas: decisionesVinculadas
  });
}

function abrirFichaIncidencia(id) {
  var template = HtmlService.createTemplateFromFile('FichaIncidencia');
  template.idRegistro = id;
  var html = template.evaluate().setWidth(560).setHeight(640);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Ficha: ' + id);
}

function seleccionarYAbrirFichaIncidencia(entidad, idRegistro) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);
  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }
  abrirFichaIncidencia(idRegistro);
  return true;
}

function abrirFichaIncidenciaBuscar() {
  abrirSelectorConAccion_('INCIDENCIA', 'Ver ficha de incidencia', 'seleccionarYAbrirFichaIncidencia', 'obtenerOpcionesEntidadParaSelector', true);
}

function abrirFormularioCrearDocumentoParaIncidencia(incidenciaId) {
  abrirFormularioCrear_('DOCUMENTO', 'Nuevo documento', {
    ENTIDAD_TIPO: 'Incidencia', ENTIDAD_ID: incidenciaId
  }, { tipo: 'ficha', entidad: 'INCIDENCIA', id: incidenciaId });
}

function abrirFormularioCrearVinculoADecisionParaIncidencia(incidenciaId) {
  abrirFormularioCrear_('VINCULO', 'Nuevo vínculo a decisión', {
    ENTIDAD_ORIGEN_TIPO: 'Incidencia', ENTIDAD_ORIGEN_ID: incidenciaId, ENTIDAD_DESTINO_TIPO: 'Decisión'
  }, { tipo: 'ficha', entidad: 'INCIDENCIA', id: incidenciaId });
}

function exportarFichaIncidenciaCSV(id) {
  var datos = obtenerFichaIncidencia(id);
  var encabezados = ['Tipo', 'ID', 'Nombre', 'Detalle', 'Estado'];

  var filas = [];
  datos.documentos.forEach(function (d) {
    filas.push(['Documento', d.id, d.titulo, d.tipo || '', d.estado]);
  });
  datos.decisionesVinculadas.forEach(function (v) {
    filas.push(['Decisión', v.id, v.nombre, v.tipoVinculo || '', v.estado]);
  });

  var nombreArchivo = 'FICHA_INCIDENCIA_' + id + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('INCIDENCIA', id, 'EXPORTAR_FICHA', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombreArchivo, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarFichaIncidenciaCSV(id) {
  var resultado = exportarFichaIncidenciaCSV(id);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}
