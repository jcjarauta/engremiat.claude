/**
 * Ficha de registro de Proceso (ver conversacion -- completar la
 * cobertura del patron Panel/Ficha/Formulario en el resto de la
 * jerarquia, mismo patron que FichaProductoService.js/
 * FichaProyectoService.js). Agregador de solo lectura: TAREA (hijas
 * directas, con su propia desviacion/riesgo), INCIDENCIA (nivel
 * Proceso) y DOCUMENTO.
 */

function obtenerFichaProceso(id) {
  var proceso = obtenerRegistroPorId('PROCESO', id);
  if (!proceso) {
    throw new Error('No existe ningún registro de Proceso con id "' + id + '".');
  }

  var nombresPersona = {};
  listarRegistrosSeguro_('PERSONA_EQUIPO', {}).forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });

  var producto = obtenerRegistroPorId('PRODUCTO', proceso.PRODUCTO_ID);

  /*
   * El proyecto/campaña ancestros solo son resolubles de forma única si
   * este Proceso viene de una relación PROYECTO_PRODUCTO concreta
   * (PROYECTO_PRODUCTO_ID, campo opcional del esquema) -- un mismo
   * Producto puede reutilizarse en varios Proyectos (N:M), así que sin
   * ese dato no hay un único "Ver panel de campaña" al que enlazar
   * (mismo motivo por el que FichaProducto.html no tiene ese botón).
   */
  var proyectoId = null, proyectoNombre = '', campanaId = null, campanaNombre = '';
  if (proceso.PROYECTO_PRODUCTO_ID) {
    var proyectoProducto = obtenerRegistroPorId('PROYECTO_PRODUCTO', proceso.PROYECTO_PRODUCTO_ID);
    if (proyectoProducto) {
      var proyecto = obtenerRegistroPorId('PROYECTO', proyectoProducto.PROYECTO_ID);
      if (proyecto) {
        proyectoId = proyecto.ID;
        proyectoNombre = proyecto.NOMBRE;
        campanaId = proyecto.CAMPANA_ID;
        var campana = obtenerRegistroPorId('CAMPANA', proyecto.CAMPANA_ID);
        campanaNombre = campana ? campana.NOMBRE : '';
      }
    }
  }

  var responsablesPorTarea = {};
  listarRegistrosSeguro_('TAREA_RESPONSABLE', { ACTIVO: 'SÍ' }).forEach(function (a) {
    if (!responsablesPorTarea[a.TAREA_ID]) responsablesPorTarea[a.TAREA_ID] = [];
    responsablesPorTarea[a.TAREA_ID].push(nombresPersona[a.PERSONA_EQUIPO_ID] || a.PERSONA_EQUIPO_ID);
  });

  var tareas = listarRegistros('TAREA', { ACTIVO: 'SÍ' })
    .filter(function (t) { return t.PROCESO_ID === id; })
    .map(function (t) {
      var desviacion = calcularDesviacionRegistro_(t);
      return {
        id: t.ID,
        nombre: t.NOMBRE,
        estado: t.ESTADO || '',
        responsableNombre: (responsablesPorTarea[t.ID] || []).join(', '),
        fechaInicioPlan: t.FECHA_INICIO_PLAN || null,
        porcentajeAvance: t.PORCENTAJE_AVANCE === '' || t.PORCENTAJE_AVANCE === undefined ? null : Number(t.PORCENTAJE_AVANCE),
        diasDesviacionFin: desviacion.DIAS_DESVIACION_FIN,
        diasRiesgo: calcularRiesgoRegistro_(t)
      };
    })
    .sort(function (a, b) { return new Date(a.fechaInicioPlan || 0) - new Date(b.fechaInicioPlan || 0); });

  /*
   * Resumen de avance agregado sobre las tareas de este proceso -- mismo
   * cálculo que FichaProyectoService.js hace un nivel más arriba con sus
   * procesos.
   */
  var tareasConFinReal = tareas.filter(function (t) { return t.diasDesviacionFin !== null; });
  var sumaDesviacion = tareasConFinReal.reduce(function (acc, t) { return acc + t.diasDesviacionFin; }, 0);
  var resumenAvance = {
    tareasTotal: tareas.length,
    tareasMedidas: tareasConFinReal.length,
    tareasEnRiesgo: tareas.filter(function (t) { return t.diasRiesgo !== null; }).length,
    diasDesviacionMedia: tareasConFinReal.length > 0 ? Math.round((sumaDesviacion / tareasConFinReal.length) * 10) / 10 : null
  };

  /*
   * Solo incidencias ancladas EN ESTE nivel (mismo criterio que
   * PanelCampanaService.js: el nivel más profundo con FK rellena) -- una
   * incidencia de una Tarea de este proceso ya aparece en la ficha de
   * esa tarea, no se duplica aquí.
   */
  var incidencias = listarRegistrosSeguro_('INCIDENCIA', { ACTIVO: 'SÍ' })
    .filter(function (inc) { return inc.PROCESO_ID === id && !inc.TAREA_ID; })
    .map(function (inc) { return { id: inc.ID, titulo: inc.TITULO, estado: inc.ESTADO }; });

  var documentos = listarRegistrosSeguro_('DOCUMENTO', { ACTIVO: 'SÍ' })
    .filter(function (d) { return d.ENTIDAD_TIPO === 'Proceso' && d.ENTIDAD_ID === id; })
    .map(function (d) { return { id: d.ID, titulo: d.TITULO, tipo: d.TIPO_DOCUMENTO, estado: d.ESTADO }; });

  return serializarParaCliente_({
    proceso: proceso,
    responsableNombre: nombresPersona[proceso.RESPONSABLE_ID] || '',
    productoId: proceso.PRODUCTO_ID,
    productoNombre: producto ? producto.NOMBRE : '',
    proyectoId: proyectoId,
    proyectoNombre: proyectoNombre,
    campanaId: campanaId,
    campanaNombre: campanaNombre,
    tareas: tareas,
    resumenAvance: resumenAvance,
    incidencias: incidencias,
    documentos: documentos
  });
}

function abrirFichaProceso(id) {
  var template = HtmlService.createTemplateFromFile('FichaProceso');
  template.idRegistro = id;
  var html = template.evaluate().setWidth(560).setHeight(640);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Ficha: ' + id);
}

/* accionFn del selector genérico (SelectorRegistro.html): firma (entidad, idRegistro). */
function seleccionarYAbrirFichaProceso(entidad, idRegistro) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);
  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }
  abrirFichaProceso(idRegistro);
  return true;
}

function abrirFichaProcesoBuscar() {
  abrirSelectorConAccion_('PROCESO', 'Ver ficha de proceso', 'seleccionarYAbrirFichaProceso', 'obtenerOpcionesEntidadParaSelector', true);
}

/*
 * Crear una tarea nueva directamente desde la ficha del proceso -- mismo
 * caso que abrirFormularioCrearProcesoParaProducto en
 * FichaProductoService.js, un nivel más abajo. Retorna a esta misma
 * ficha al cerrar.
 */
function abrirFormularioCrearTareaParaProceso(procesoId) {
  abrirFormularioCrear_('TAREA', 'Nueva tarea', { PROCESO_ID: procesoId }, { tipo: 'ficha', entidad: 'PROCESO', id: procesoId });
}

function abrirFormularioCrearDocumentoParaProceso(procesoId) {
  abrirFormularioCrear_('DOCUMENTO', 'Nuevo documento', { ENTIDAD_TIPO: 'Proceso', ENTIDAD_ID: procesoId }, { tipo: 'ficha', entidad: 'PROCESO', id: procesoId });
}

/*
 * Exportar CSV de la ficha -- mismo exportador compartido que Producto,
 * Proyecto y el Panel de Campaña.
 */
function exportarFichaProcesoCSV(id) {
  var datos = obtenerFichaProceso(id);
  var encabezados = ['Tipo', 'ID', 'Nombre', 'Detalle', 'Estado'];

  var filas = [];
  datos.tareas.forEach(function (t) {
    var detalle = [t.responsableNombre, t.porcentajeAvance !== null ? t.porcentajeAvance + '%' : ''].filter(Boolean).join(' · ');
    filas.push(['Tarea', t.id, t.nombre, detalle, t.estado]);
  });
  datos.incidencias.forEach(function (i) {
    filas.push(['Incidencia', i.id, i.titulo, '', i.estado]);
  });
  datos.documentos.forEach(function (d) {
    filas.push(['Documento', d.id, d.titulo, d.tipo, d.estado]);
  });

  var nombreArchivo = 'FICHA_PROCESO_' + id + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('PROCESO', id, 'EXPORTAR_FICHA', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombreArchivo, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarFichaProcesoCSV(id) {
  var resultado = exportarFichaProcesoCSV(id);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}
