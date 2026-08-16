/**
 * Ficha de registro de Proyecto (ver conversacion -- "Panel = navegación,
 * Ficha = detalle, Formulario = edición": faltaba justo este nivel, el
 * único de la cadena Campaña->Proyecto->Producto->Proceso->Tarea sin
 * Ficha propia salvo Producto). Mismo patron que FichaProductoService.js:
 * agregador de solo lectura -- PROYECTO_PRODUCTO (N:M, un producto puede
 * reutilizarse en varios proyectos), DECISION (FK directa PROYECTO_ID),
 * INCIDENCIA (nivel Proyecto), DOCUMENTO y PRESUPUESTO (ambos genéricos
 * via ENTIDAD_TIPO/ENTIDAD_ID).
 */

function obtenerFichaProyecto(id) {
  var proyecto = obtenerRegistroPorId('PROYECTO', id);
  if (!proyecto) {
    throw new Error('No existe ningún registro de Proyecto con id "' + id + '".');
  }

  var nombresPersona = {};
  listarRegistrosSeguro_('PERSONA_EQUIPO', {}).forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });

  var campana = obtenerRegistroPorId('CAMPANA', proyecto.CAMPANA_ID);

  /*
   * CLIENTE es del módulo CLIENTE -- en un cliente solo-CORE la hoja no
   * existe (mismo caso que el fk PROYECTO.CLIENTE_ID ya corregido en
   * obtenerEsquemaFormulario). Envuelto en try/catch para no romper el
   * resto de la ficha si falta ese módulo.
   */
  var clienteNombre = '';
  if (proyecto.CLIENTE_ID) {
    try {
      var cliente = obtenerRegistroPorId('CLIENTE', proyecto.CLIENTE_ID);
      clienteNombre = cliente ? cliente.NOMBRE : '';
    } catch (eCliente) { /* módulo CLIENTE no instalado */ }
  }

  var productosPorId = {};
  listarRegistros('PRODUCTO', {}).forEach(function (p) { productosPorId[p.ID] = p; });

  var productos = listarRegistros('PROYECTO_PRODUCTO', { ACTIVO: 'SÍ' })
    .filter(function (pp) { return pp.PROYECTO_ID === id; })
    .map(function (pp) {
      var producto = productosPorId[pp.PRODUCTO_ID];
      return {
        relacionId: pp.ID,
        productoId: pp.PRODUCTO_ID,
        productoNombre: producto ? producto.NOMBRE : pp.PRODUCTO_ID,
        cantidadAsignada: pp.CANTIDAD_ASIGNADA,
        estado: pp.ESTADO
      };
    });

  /*
   * Resumen de avance agregado sobre TODOS los procesos de TODOS los
   * productos vinculados a este proyecto -- mismo cálculo que
   * FichaProductoService.js, un nivel más arriba en la jerarquía.
   */
  var idsProducto = productos.map(function (pp) { return pp.productoId; });
  var procesosTodos = listarRegistros('PROCESO', { ACTIVO: 'SÍ' })
    .filter(function (p) { return idsProducto.indexOf(p.PRODUCTO_ID) !== -1; });
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

  var decisiones = listarRegistrosSeguro_('DECISION', { ACTIVO: 'SÍ' })
    .filter(function (d) { return d.PROYECTO_ID === id; })
    .map(function (d) { return { id: d.ID, titulo: d.TITULO, estado: d.ESTADO, tipo: d.TIPO }; });

  /*
   * Solo incidencias ancladas EN ESTE nivel (mismo criterio que
   * PanelCampanaService.js: el nivel más profundo con FK rellena) --
   * una incidencia de un Producto/Proceso/Tarea de este proyecto ya
   * aparece en la ficha de ese registro más específico, no se duplica
   * aquí.
   */
  var incidencias = listarRegistrosSeguro_('INCIDENCIA', { ACTIVO: 'SÍ' })
    .filter(function (inc) { return inc.PROYECTO_ID === id && !inc.PRODUCTO_ID && !inc.PROCESO_ID && !inc.TAREA_ID; })
    .map(function (inc) { return { id: inc.ID, titulo: inc.TITULO, estado: inc.ESTADO }; });

  var documentos = listarRegistrosSeguro_('DOCUMENTO', { ACTIVO: 'SÍ' })
    .filter(function (d) { return d.ENTIDAD_TIPO === 'Proyecto' && d.ENTIDAD_ID === id; })
    .map(function (d) { return { id: d.ID, titulo: d.TITULO, tipo: d.TIPO_DOCUMENTO, estado: d.ESTADO, url: d.URL }; });

  /* PRESUPUESTO es del módulo ECONOMICO -- mismo try/catch que CLIENTE. */
  var presupuesto = [];
  try {
    presupuesto = listarRegistros('PRESUPUESTO', { ACTIVO: 'SÍ' })
      .filter(function (p) { return p.ENTIDAD_TIPO === 'Proyecto' && p.ENTIDAD_ID === id; })
      .map(function (p) { return { id: p.ID, categoria: p.CATEGORIA, importePrevisto: p.IMPORTE_PREVISTO }; });
  } catch (ePresupuesto) { /* módulo ECONOMICO no instalado */ }

  return serializarParaCliente_({
    proyecto: proyecto,
    responsableNombre: nombresPersona[proyecto.RESPONSABLE_ID] || '',
    campanaId: proyecto.CAMPANA_ID,
    campanaNombre: campana ? campana.NOMBRE : '',
    clienteNombre: clienteNombre,
    productos: productos,
    resumenAvance: resumenAvance,
    decisiones: decisiones,
    incidencias: incidencias,
    documentos: documentos,
    presupuesto: presupuesto
  });
}

function abrirFichaProyecto(id) {
  var template = HtmlService.createTemplateFromFile('FichaProyecto');
  template.idRegistro = id;
  var html = template.evaluate().setWidth(560).setHeight(640);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Ficha: ' + id);
}

/* accionFn del selector genérico (SelectorRegistro.html): firma (entidad, idRegistro). */
function seleccionarYAbrirFichaProyecto(entidad, idRegistro) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);
  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }
  abrirFichaProyecto(idRegistro);
  return true;
}

function abrirFichaProyectoBuscar() {
  abrirSelectorConAccion_('PROYECTO', 'Ver ficha de proyecto', 'seleccionarYAbrirFichaProyecto', 'obtenerOpcionesEntidadParaSelector', true);
}

/*
 * Vincular un producto YA EXISTENTE a este proyecto (a diferencia de la
 * cadena Proyecto->Producto, que siempre crea un producto nuevo) --
 * mismo caso que abrirFormularioCrearProyectoProductoParaProducto en
 * FichaProductoService.js, en la dirección inversa. Retorna a esta
 * misma ficha al cerrar.
 */
function abrirFormularioCrearProyectoProductoParaProyecto(proyectoId) {
  abrirFormularioCrear_('PROYECTO_PRODUCTO', 'Vincular un producto', { PROYECTO_ID: proyectoId }, { tipo: 'ficha', entidad: 'PROYECTO', id: proyectoId });
}

function abrirFormularioCrearDocumentoParaProyecto(proyectoId) {
  abrirFormularioCrear_('DOCUMENTO', 'Nuevo documento', { ENTIDAD_TIPO: 'Proyecto', ENTIDAD_ID: proyectoId }, { tipo: 'ficha', entidad: 'PROYECTO', id: proyectoId });
}

/*
 * abrirGanttPlanReal (DesviacionService.js) es del módulo GANTT -- mismo
 * caso que abrirGanttParaCampana en FichaCampanaService.js: este
 * wrapper SÍ es CORE, así que "Ver Gantt" funciona esté o no instalado
 * GANTT. Resuelve la campaña internamente (PROYECTO.CAMPANA_ID es
 * siempre una FK real, a diferencia de Proceso/Tarea) para no depender
 * de que el cliente ya la traiga cargada.
 */
function abrirGanttParaProyecto(proyectoId) {
  var proyecto = obtenerRegistroPorId('PROYECTO', proyectoId);
  if (!proyecto) {
    throw new Error('No existe ningún registro de Proyecto con id "' + proyectoId + '".');
  }
  abrirGanttPlanReal(proyecto.CAMPANA_ID);
}

/*
 * Exportar CSV de la ficha -- mismo exportador compartido que Producto,
 * Material y el Panel de Campaña.
 */
function exportarFichaProyectoCSV(id) {
  var datos = obtenerFichaProyecto(id);
  var encabezados = ['Tipo', 'ID', 'Nombre', 'Detalle', 'Estado'];

  var filas = [];
  datos.productos.forEach(function (pp) {
    filas.push(['Producto', pp.productoId, pp.productoNombre, pp.cantidadAsignada || '', pp.estado]);
  });
  datos.decisiones.forEach(function (d) {
    filas.push(['Decisión', d.id, d.titulo, d.tipo || '', d.estado]);
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

  var nombreArchivo = 'FICHA_PROYECTO_' + id + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('PROYECTO', id, 'EXPORTAR_FICHA', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombreArchivo, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarFichaProyectoCSV(id) {
  var resultado = exportarFichaProyectoCSV(id);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}
