/**
 * N4.2 (roadmap "Formatos operativos baratos"): listado filtrable
 * plano para entidades sin árbol propio -- Incidencias abiertas,
 * Documentos vigentes, Decisiones pendientes. Hoy solo se buscaban una
 * a una (buscador + edición); esto da una vista de conjunto sin abrir
 * formularios. Reutiliza listarIncidenciasAbiertas/
 * listarDecisionesPendientes ya existentes (DashboardService.js) -- no
 * duplica su lógica de "abierta"/"pendiente", solo las presenta en tabla.
 */

function contextoIncidenciaListado_(incidencia, nombres) {
  return nombres.TAREA[incidencia.TAREA_ID] || nombres.PROCESO[incidencia.PROCESO_ID] ||
    nombres.PRODUCTO[incidencia.PRODUCTO_ID] || nombres.PROYECTO[incidencia.PROYECTO_ID] ||
    nombres.CAMPANA[incidencia.CAMPANA_ID] || '';
}

function obtenerListadoIncidenciasAbiertas_() {
  var nombres = { CAMPANA: {}, PROYECTO: {}, PRODUCTO: {}, PROCESO: {}, TAREA: {} };
  listarRegistros('CAMPANA', {}).forEach(function (c) { nombres.CAMPANA[c.ID] = c.NOMBRE; });
  listarRegistros('PROYECTO', {}).forEach(function (p) { nombres.PROYECTO[p.ID] = p.NOMBRE; });
  listarRegistros('PRODUCTO', {}).forEach(function (p) { nombres.PRODUCTO[p.ID] = p.NOMBRE; });
  listarRegistros('PROCESO', {}).forEach(function (p) { nombres.PROCESO[p.ID] = p.NOMBRE; });
  listarRegistros('TAREA', {}).forEach(function (t) { nombres.TAREA[t.ID] = t.NOMBRE; });

  return listarIncidenciasAbiertas().map(function (inc) {
    return {
      id: inc.ID,
      entidad: 'INCIDENCIA',
      titulo: inc.TITULO,
      estado: inc.ESTADO,
      subtitulo: [inc.TIPO, inc.PRIORIDAD].filter(Boolean).join(' · '),
      contexto: contextoIncidenciaListado_(inc, nombres),
      fechaClave: inc.FECHA_LIMITE || null
    };
  });
}

function obtenerListadoDecisionesPendientes_() {
  var nombresProyecto = {};
  listarRegistros('PROYECTO', {}).forEach(function (p) { nombresProyecto[p.ID] = p.NOMBRE; });

  return listarDecisionesPendientes().map(function (dec) {
    return {
      id: dec.ID,
      entidad: 'DECISION',
      titulo: dec.TITULO,
      estado: dec.ESTADO,
      subtitulo: [dec.TIPO, dec.IMPACTO].filter(Boolean).join(' · '),
      contexto: nombresProyecto[dec.PROYECTO_ID] || '',
      fechaClave: dec.FECHA_LIMITE || null
    };
  });
}

/*
 * DOCUMENTO se vincula de forma generica (ENTIDAD_TIPO/ENTIDAD_ID a
 * cualquiera de las 10 entidades de CFG_ENTIDAD_DOCUMENTO) -- se
 * reutiliza ENTIDAD_DOCUMENTO_A_MVP (Formularios.js) para resolver el
 * nombre visible de a qué está vinculado cada documento.
 */
function obtenerListadoDocumentosVigentes_() {
  return listarRegistrosSeguro_('DOCUMENTO', { ACTIVO: 'SÍ', ESTADO: 'Vigente' }).map(function (doc) {
    var entidadKey = ENTIDAD_DOCUMENTO_A_MVP[doc.ENTIDAD_TIPO];
    var registro = entidadKey && doc.ENTIDAD_ID ? obtenerRegistroPorId(entidadKey, doc.ENTIDAD_ID) : null;
    var nombreEntidad = registro ? (registro.TITULO || registro.NOMBRE || doc.ENTIDAD_ID) : doc.ENTIDAD_ID;
    return {
      id: doc.ID,
      entidad: 'DOCUMENTO',
      titulo: doc.TITULO,
      estado: doc.ESTADO,
      subtitulo: doc.TIPO_DOCUMENTO || '',
      contexto: doc.ENTIDAD_TIPO ? (doc.ENTIDAD_TIPO + ': ' + nombreEntidad) : '',
      fechaClave: null
    };
  });
}

function obtenerDatosListado(tipo) {
  var filas;
  if (tipo === 'INCIDENCIA') filas = obtenerListadoIncidenciasAbiertas_();
  else if (tipo === 'DECISION') filas = obtenerListadoDecisionesPendientes_();
  else if (tipo === 'DOCUMENTO') filas = obtenerListadoDocumentosVigentes_();
  else throw new Error('ERROR_LISTADO: tipo no soportado: ' + tipo);
  return serializarParaCliente_({ filas: filas });
}

/* Clic en una fila (ver conversacion -- Incidencia abre su Ficha, igual que en el Kanban; Decision/Documento van directo a edición). */
function abrirRegistroListado(entidad, id) {
  if (entidad === 'INCIDENCIA') {
    seleccionarYAbrirFichaIncidencia(entidad, id);
    return;
  }
  seleccionarYAbrirEdicion(entidad, id);
}

var ETIQUETA_LISTADO_ = {
  INCIDENCIA: 'Incidencias abiertas',
  DECISION: 'Decisiones pendientes',
  DOCUMENTO: 'Documentos vigentes'
};

function exportarListadoCSV(tipo) {
  var datos = obtenerDatosListado(tipo);
  var encabezados = ['ID', 'Título', 'Detalle', 'Contexto', 'Estado'];
  var filas = datos.filas.map(function (f) {
    return [f.id, f.titulo, f.subtitulo, f.contexto, f.estado];
  });

  var nombre = 'LISTADO_' + tipo + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial(tipo, '', 'EXPORTAR_LISTADO', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombre, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarListadoCSV(tipo) {
  var resultado = exportarListadoCSV(tipo);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}

function abrirListadoFiltrable() {
  var html = HtmlService.createTemplateFromFile('ListadoFiltrable')
    .evaluate()
    .setTitle('Listado filtrable')
    .setWidth(420);
  SpreadsheetApp.getUi().showSidebar(html);
}
