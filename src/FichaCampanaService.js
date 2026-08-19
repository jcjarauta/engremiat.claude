/**
 * Ficha de registro de Campaña -- cierra la cobertura del patron
 * Panel/Ficha/Formulario en el nivel más alto de la jerarquía
 * (Campaña->Proyecto->Producto->Proceso->Tarea). A diferencia del resto
 * de fichas, Campaña ya tenía un punto de navegación propio (Panel de
 * campaña, PanelCampanaService.js), así que esta ficha no lo sustituye
 * -- es el resumen de detalle equivalente al de las demás fichas
 * (proyectos vinculados con su propio resumen de avance, incidencias a
 * este nivel, documentos y presupuesto si hay módulo ECONOMICO), con
 * un botón directo al panel para seguir navegando el árbol completo.
 */

function obtenerFichaCampana(id) {
  var campana = obtenerRegistroPorId('CAMPANA', id);
  if (!campana) {
    throw new Error('No existe ningún registro de Campaña con id "' + id + '".');
  }

  var proyectos = listarProyectosDeCampana(id).map(function (p) {
    return { id: p.ID, nombre: p.NOMBRE, estado: p.ESTADO };
  });

  /*
   * Resumen de avance agregado sobre TODOS los procesos de TODOS los
   * proyectos/productos de esta campaña -- mismo cálculo que
   * FichaProyectoService.js hace un nivel más abajo, aquí extendido a
   * toda la campaña.
   */
  var procesosTodos = [];
  listarProyectosDeCampana(id).forEach(function (proyecto) {
    listarProductosDeProyecto(proyecto.ID).forEach(function (producto) {
      procesosTodos = procesosTodos.concat(listarProcesosDeProducto(producto.ID));
    });
  });
  var procesosConDesviacion = procesosTodos.map(function (p) {
    var desviacion = calcularDesviacionRegistro_(p);
    return { diasDesviacionFin: desviacion.DIAS_DESVIACION_FIN, diasRiesgo: calcularRiesgoRegistro_(p) };
  });
  var procesosConFinReal = procesosConDesviacion.filter(function (p) { return p.diasDesviacionFin !== null; });
  var sumaDesviacion = procesosConFinReal.reduce(function (acc, p) { return acc + p.diasDesviacionFin; }, 0);
  var resumenAvance = {
    procesosTotal: procesosTodos.length,
    procesosMedidos: procesosConFinReal.length,
    procesosEnRiesgo: procesosConDesviacion.filter(function (p) { return p.diasRiesgo !== null; }).length,
    diasDesviacionMedia: procesosConFinReal.length > 0 ? Math.round((sumaDesviacion / procesosConFinReal.length) * 10) / 10 : null
  };

  /*
   * Solo incidencias ancladas EN ESTE nivel (mismo criterio que
   * PanelCampanaService.js: el nivel más profundo con FK rellena) -- una
   * incidencia de un Proyecto/Producto/Proceso/Tarea de esta campaña ya
   * aparece en la ficha de ese registro más específico, no se duplica
   * aquí.
   */
  var incidenciasDeEstaCampana_ = listarRegistrosSeguro_('INCIDENCIA', { ACTIVO: 'SÍ' })
    .filter(function (inc) { return inc.CAMPANA_ID === id; });
  var incidencias = incidenciasDeEstaCampana_
    .filter(function (inc) { return !inc.PROYECTO_ID && !inc.PRODUCTO_ID && !inc.PROCESO_ID && !inc.TAREA_ID; })
    .map(function (inc) { return { id: inc.ID, titulo: inc.TITULO, estado: inc.ESTADO }; });
  /*
   * Ver conversación -- "a este nivel tampoco se ven las incidencias":
   * mismo hallazgo y mismo arreglo que ya se aplicó en
   * FichaProyectoService.js -- "Sin incidencias a este nivel" daba la
   * falsa impresión de rama vacía cuando en realidad había una en un
   * Proyecto/Producto/Proceso/Tarea de esta campaña.
   */
  var incidenciasEnNivelesInferiores = incidenciasDeEstaCampana_.length - incidencias.length;

  var documentos = listarRegistrosSeguro_('DOCUMENTO', { ACTIVO: 'SÍ' })
    .filter(function (d) { return d.ENTIDAD_TIPO === 'Campaña' && d.ENTIDAD_ID === id; })
    .map(function (d) { return { id: d.ID, titulo: d.TITULO, tipo: d.TIPO_DOCUMENTO, estado: d.ESTADO }; });

  /* PRESUPUESTO es del módulo ECONOMICO -- mismo try/catch que en FichaProyectoService.js. */
  var presupuesto = [];
  try {
    presupuesto = listarRegistros('PRESUPUESTO', { ACTIVO: 'SÍ' })
      .filter(function (p) { return p.ENTIDAD_TIPO === 'Campaña' && p.ENTIDAD_ID === id; })
      .map(function (p) { return { id: p.ID, categoria: p.CATEGORIA, importePrevisto: p.IMPORTE_PREVISTO }; });
  } catch (ePresupuesto) { /* módulo ECONOMICO no instalado */ }

  return serializarParaCliente_({
    campana: campana,
    proyectos: proyectos,
    resumenAvance: resumenAvance,
    incidencias: incidencias,
    incidenciasEnNivelesInferiores: incidenciasEnNivelesInferiores,
    documentos: documentos,
    presupuesto: presupuesto
  });
}

function abrirFichaCampana(id) {
  var template = HtmlService.createTemplateFromFile('FichaCampana');
  template.idRegistro = id;
  var html = template.evaluate().setWidth(560).setHeight(640);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Ficha: ' + id);
}

/* accionFn del selector genérico (SelectorRegistro.html): firma (entidad, idRegistro). */
function seleccionarYAbrirFichaCampana(entidad, idRegistro) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);
  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }
  abrirFichaCampana(idRegistro);
  return true;
}

function abrirFichaCampanaBuscar() {
  abrirSelectorConAccion_('CAMPANA', 'Ver ficha de campaña', 'seleccionarYAbrirFichaCampana', 'obtenerOpcionesEntidadParaSelector', true);
}

/*
 * abrirGanttPlanReal (DesviacionService.js) es del módulo GANTT: en un
 * cliente sin ese módulo instalado, google.script.run no tiene envoltorio
 * para llamarla directo desde un HTML (el generador de envoltorios solo
 * expone las funciones del módulo del cliente). Este pequeño wrapper SÍ
 * es CORE, así que el botón "Ver Gantt" de la ficha funciona igual esté
 * o no instalado GANTT -- si no lo está, la propia librería sigue
 * teniendo la función (todas las librerías comparten un único código
 * fuente), solo que ningún HTML de un cliente sin GANTT podía llamarla
 * directamente hasta ahora.
 */
function abrirGanttParaCampana(campanaId) {
  abrirGanttPlanReal(campanaId);
}

function abrirFormularioCrearDocumentoParaCampana(campanaId) {
  abrirFormularioCrear_('DOCUMENTO', 'Nuevo documento', { ENTIDAD_TIPO: 'Campaña', ENTIDAD_ID: campanaId }, { tipo: 'ficha', entidad: 'CAMPANA', id: campanaId });
}

/*
 * Exportar CSV de la ficha -- mismo exportador compartido que el resto
 * de fichas y el Panel de Campaña.
 */
function exportarFichaCampanaCSV(id) {
  var datos = obtenerFichaCampana(id);
  var encabezados = ['Tipo', 'ID', 'Nombre', 'Detalle', 'Estado'];

  var filas = [];
  datos.proyectos.forEach(function (p) {
    filas.push(['Proyecto', p.id, p.nombre, '', p.estado]);
  });
  datos.incidencias.forEach(function (i) {
    filas.push(['Incidencia', i.id, i.titulo, '', i.estado]);
  });
  datos.documentos.forEach(function (d) {
    filas.push(['Documento', d.id, d.titulo, d.tipo, d.estado]);
  });
  datos.presupuesto.forEach(function (p) {
    filas.push(['Presupuesto', p.id, p.categoria, p.importePrevisto ? p.importePrevisto + ' €' : '', '']);
  });

  var nombreArchivo = 'FICHA_CAMPANA_' + id + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('CAMPANA', id, 'EXPORTAR_FICHA', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombreArchivo, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarFichaCampanaCSV(id) {
  var resultado = exportarFichaCampanaCSV(id);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}
