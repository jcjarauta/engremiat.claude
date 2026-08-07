/**
 * Panel de Clientes: lista plana (CLIENTE no tiene jerarquía como
 * Campaña/Recurso) con incidencias abiertas por cliente y antigüedad de
 * la más antigua, acceso directo a "Nueva incidencia" (prefill
 * CLIENTE_ID + NIVEL_INCIDENCIA=Cliente) y al Sheet real si
 * CLIENTE.SHEET_URL está informado.
 */

var ESTADOS_INCIDENCIA_CERRADOS_ = ['Resuelta', 'Cerrada', 'Cancelada'];

function obtenerListaClientes() {
  var clientes = listarRegistros('CLIENTE', { ACTIVO: 'SÍ' });

  var incidenciasPorCliente_ = {};
  listarRegistros('INCIDENCIA', { ACTIVO: 'SÍ', NIVEL_INCIDENCIA: 'Cliente' }).forEach(function (inc) {
    if (!inc.CLIENTE_ID) return;
    if (!incidenciasPorCliente_[inc.CLIENTE_ID]) incidenciasPorCliente_[inc.CLIENTE_ID] = [];
    incidenciasPorCliente_[inc.CLIENTE_ID].push(inc);
  });

  var ahora = new Date();

  var lista = clientes.map(function (cliente) {
    var incidencias = incidenciasPorCliente_[cliente.ID] || [];
    var abiertas = incidencias.filter(function (inc) {
      return ESTADOS_INCIDENCIA_CERRADOS_.indexOf(inc.ESTADO) === -1;
    });

    var masAntigua = abiertas.reduce(function (min, inc) {
      var fecha = inc.FECHA_DETECCION ? new Date(inc.FECHA_DETECCION) : null;
      if (!fecha || isNaN(fecha.getTime())) return min;
      return (!min || fecha < min) ? fecha : min;
    }, null);

    var antiguedadDias = masAntigua ? Math.floor((ahora - masAntigua) / (1000 * 60 * 60 * 24)) : null;

    return {
      id: cliente.ID,
      codigo: cliente.CODIGO,
      nombre: cliente.NOMBRE,
      tipo: cliente.TIPO_CLIENTE,
      estado: cliente.ESTADO,
      sheetUrl: cliente.SHEET_URL || '',
      incidenciasAbiertas: abiertas.length,
      antiguedadDias: antiguedadDias
    };
  });

  lista.sort(function (a, b) { return b.incidenciasAbiertas - a.incidenciasAbiertas; });

  return { clientes: lista, total: lista.length };
}

function abrirPanelClientes() {
  var html = HtmlService.createTemplateFromFile('PanelClientes')
    .evaluate()
    .setTitle('Clientes')
    .setWidth(440);
  SpreadsheetApp.getUi().showSidebar(html);
}

/*
 * Exportar CSV (mismo exportador compartido que Proveedor/Gantt,
 * construirCsvConBom_/abrirDialogoDescargaCSV_ en DesviacionService.js).
 */
function exportarClientesCSV() {
  var datos = obtenerListaClientes();
  var encabezados = ['ID', 'Código', 'Nombre', 'Tipo', 'Estado', 'Incidencias abiertas', 'Antigüedad (días)'];

  var filas = datos.clientes.map(function (c) {
    return [c.id, c.codigo, c.nombre, c.tipo, c.estado, c.incidenciasAbiertas, c.antiguedadDias === null ? '' : c.antiguedadDias];
  });

  var nombreArchivo = 'CLIENTES_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('INFORME', 'PANEL_CLIENTES', 'EXPORTAR_PANEL_CLIENTES', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombreArchivo, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarClientesCSV() {
  var resultado = exportarClientesCSV();
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}
