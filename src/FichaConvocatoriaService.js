/**
 * Ficha de registro de Convocatoria (eje económico, Capa 1 -- ver
 * conversación). Mismo patrón que las demás fichas: agregador de solo
 * lectura -- fuentes de financiación vinculadas (tu histórico de
 * aplicaciones a esta convocatoria concreta), documentos (bases) y un
 * filtro de encaje DETERMINISTA (sin IA, ver conversación): qué
 * proyectos activos cumplen el tipo elegible y el rango de importe
 * declarados, usando el coste ya calculado por CosteService.js.
 */

function obtenerProyectosQueEncajan_(convocatoria) {
  var tipoElegible = convocatoria.TIPO_PROYECTO_ELEGIBLE;
  var importeMin = Number(convocatoria.IMPORTE_MINIMO_SOLICITUD) || 0;
  var importeMax = Number(convocatoria.IMPORTE_MAXIMO_SOLICITUD) || 0;

  return listarRegistros('PROYECTO', { ACTIVO: 'SÍ' })
    .filter(function (p) {
      if (tipoElegible && p.TIPO_PROYECTO !== tipoElegible) return false;
      return true;
    })
    .map(function (p) {
      var coste = calcularCosteTotalPorCategoria_('Proyecto', p.ID);
      var tamano = Math.max(coste.totalPrevisto, coste.totalReal);
      var datosIncompletos = tamano === 0;
      var encajaImporte = true;
      if (!datosIncompletos) {
        if (importeMin > 0 && tamano < importeMin) encajaImporte = false;
        if (importeMax > 0 && tamano > importeMax) encajaImporte = false;
      }
      return {
        proyectoId: p.ID,
        proyectoNombre: p.NOMBRE,
        tipoProyecto: p.TIPO_PROYECTO,
        costeEstimado: Math.round(tamano * 100) / 100,
        datosEconomicosIncompletos: datosIncompletos,
        encajaImporte: encajaImporte
      };
    })
    .filter(function (p) { return p.encajaImporte; })
    .sort(function (a, b) { return b.costeEstimado - a.costeEstimado; });
}

function obtenerFichaConvocatoria(id) {
  var convocatoria = obtenerRegistroPorId('CONVOCATORIA', id);
  if (!convocatoria) {
    throw new Error('No existe ningún registro de Convocatoria con id "' + id + '".');
  }

  var entidadesPorTipo_ = {};
  ['CAMPANA', 'PROYECTO', 'PRODUCTO'].forEach(function (clave) { entidadesPorTipo_[clave] = {}; });
  listarRegistros('CAMPANA', {}).forEach(function (c) { entidadesPorTipo_.CAMPANA[c.ID] = c.NOMBRE; });
  listarRegistros('PROYECTO', {}).forEach(function (p) { entidadesPorTipo_.PROYECTO[p.ID] = p.NOMBRE; });
  listarRegistros('PRODUCTO', {}).forEach(function (p) { entidadesPorTipo_.PRODUCTO[p.ID] = p.NOMBRE; });

  var fuentesVinculadas = listarRegistros('FUENTE_FINANCIACION', { ACTIVO: 'SÍ' })
    .filter(function (f) { return f.CONVOCATORIA_ID === id; })
    .map(function (f) {
      var mapaNombres = entidadesPorTipo_[ENTIDAD_DOCUMENTO_A_MVP[f.ENTIDAD_TIPO]] || {};
      return {
        id: f.ID,
        nombre: f.NOMBRE,
        importe: f.IMPORTE,
        estado: f.ESTADO,
        entidadTipo: f.ENTIDAD_TIPO,
        entidadId: f.ENTIDAD_ID,
        entidadNombre: mapaNombres[f.ENTIDAD_ID] || f.ENTIDAD_ID
      };
    });

  var documentos = listarRegistros('DOCUMENTO', { ACTIVO: 'SÍ' })
    .filter(function (d) { return d.ENTIDAD_TIPO === 'Convocatoria' && d.ENTIDAD_ID === id; })
    .map(function (d) { return { id: d.ID, titulo: d.TITULO, tipo: d.TIPO_DOCUMENTO, estado: d.ESTADO }; });

  var proyectosQueEncajan = obtenerProyectosQueEncajan_(convocatoria);

  return serializarParaCliente_({
    convocatoria: convocatoria,
    fuentesVinculadas: fuentesVinculadas,
    documentos: documentos,
    proyectosQueEncajan: proyectosQueEncajan
  });
}

function abrirFichaConvocatoria(id) {
  var template = HtmlService.createTemplateFromFile('FichaConvocatoria');
  template.idRegistro = id;
  var html = template.evaluate().setWidth(600).setHeight(660);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Ficha: ' + id);
}

function seleccionarYAbrirFichaConvocatoria(entidad, idRegistro) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);
  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }
  abrirFichaConvocatoria(idRegistro);
  return true;
}

function abrirFichaConvocatoriaBuscar() {
  abrirSelectorConAccion_('CONVOCATORIA', 'Ver ficha de convocatoria', 'seleccionarYAbrirFichaConvocatoria', 'obtenerOpcionesEntidadParaSelector', true);
}

function abrirFormularioCrearDocumentoParaConvocatoria(convocatoriaId) {
  abrirFormularioCrear_('DOCUMENTO', 'Nuevo documento', {
    ENTIDAD_TIPO: 'Convocatoria', ENTIDAD_ID: convocatoriaId
  }, { tipo: 'ficha', entidad: 'CONVOCATORIA', id: convocatoriaId });
}

function abrirFormularioCrearFuenteFinanciacionParaConvocatoria(convocatoriaId) {
  abrirFormularioCrear_('FUENTE_FINANCIACION', 'Nueva fuente de financiación', {
    CONVOCATORIA_ID: convocatoriaId
  }, { tipo: 'ficha', entidad: 'CONVOCATORIA', id: convocatoriaId });
}

function exportarFichaConvocatoriaCSV(id) {
  var datos = obtenerFichaConvocatoria(id);
  var encabezados = ['Tipo', 'ID', 'Nombre', 'Detalle', 'Estado'];

  var filas = [];
  datos.fuentesVinculadas.forEach(function (f) {
    filas.push(['Fuente de financiación', f.id, f.nombre, f.importe + ' € — ' + f.entidadNombre, f.estado]);
  });
  datos.documentos.forEach(function (d) {
    filas.push(['Documento', d.id, d.titulo, d.tipo || '', d.estado]);
  });
  datos.proyectosQueEncajan.forEach(function (p) {
    filas.push(['Proyecto que encaja', p.proyectoId, p.proyectoNombre, p.costeEstimado + ' €' + (p.datosEconomicosIncompletos ? ' (datos incompletos)' : ''), p.tipoProyecto]);
  });

  var nombreArchivo = 'FICHA_CONVOCATORIA_' + id + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('CONVOCATORIA', id, 'EXPORTAR_FICHA', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombreArchivo, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarFichaConvocatoriaCSV(id) {
  var resultado = exportarFichaConvocatoriaCSV(id);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}
