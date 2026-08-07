/**
 * Panel de Ventas: dos listas planas -- Pedidos de cliente (con total
 * calculado desde PEDIDO_CLIENTE_LINEA) y Contratos de servicio.
 * Mismo patrón que PanelClientesService.js.
 */

function obtenerListaVentas() {
  var nombresCliente_ = {};
  listarRegistros('CLIENTE', {}).forEach(function (c) { nombresCliente_[c.ID] = c.NOMBRE; });

  var lineasPorPedido_ = {};
  listarRegistros('PEDIDO_CLIENTE_LINEA', { ACTIVO: 'SÍ' }).forEach(function (linea) {
    if (!lineasPorPedido_[linea.PEDIDO_CLIENTE_ID]) lineasPorPedido_[linea.PEDIDO_CLIENTE_ID] = [];
    lineasPorPedido_[linea.PEDIDO_CLIENTE_ID].push(linea);
  });

  var pedidos = listarRegistros('PEDIDO_CLIENTE', { ACTIVO: 'SÍ' }).map(function (p) {
    var lineas = lineasPorPedido_[p.ID] || [];
    var total = lineas.reduce(function (acc, l) {
      return acc + (Number(l.CANTIDAD) || 0) * (Number(l.PRECIO_UNITARIO) || 0);
    }, 0);
    return {
      id: p.ID,
      clienteNombre: nombresCliente_[p.CLIENTE_ID] || p.CLIENTE_ID,
      canal: p.CANAL,
      fechaPedido: p.FECHA_PEDIDO || null,
      estado: p.ESTADO,
      numeroLineas: lineas.length,
      total: Math.round(total * 100) / 100
    };
  }).sort(function (a, b) { return new Date(b.fechaPedido || 0) - new Date(a.fechaPedido || 0); });

  var contratos = listarRegistros('CONTRATO_SERVICIO', { ACTIVO: 'SÍ' }).map(function (c) {
    return {
      id: c.ID,
      clienteNombre: nombresCliente_[c.CLIENTE_ID] || c.CLIENTE_ID,
      periodicidad: c.PERIODICIDAD,
      importePeriodico: c.IMPORTE_PERIODICO,
      modalidadPago: c.MODALIDAD_PAGO,
      estado: c.ESTADO,
      fechaRenovacion: c.FECHA_RENOVACION || null
    };
  }).sort(function (a, b) { return new Date(a.fechaRenovacion || 0) - new Date(b.fechaRenovacion || 0); });

  return { pedidos: pedidos, contratos: contratos };
}

function abrirPanelVentas() {
  var html = HtmlService.createTemplateFromFile('PanelVentas')
    .evaluate()
    .setTitle('Ventas')
    .setWidth(440);
  SpreadsheetApp.getUi().showSidebar(html);
}

/* Exportar CSV -- mismo exportador compartido (DesviacionService.js). */
function exportarVentasCSV() {
  var datos = obtenerListaVentas();
  var encabezados = ['Tipo', 'ID', 'Cliente', 'Detalle', 'Total/Importe', 'Estado'];

  var filas = [];
  datos.pedidos.forEach(function (p) {
    filas.push(['Pedido', p.id, p.clienteNombre, p.canal + ' · ' + p.numeroLineas + ' líneas', p.total, p.estado]);
  });
  datos.contratos.forEach(function (c) {
    filas.push(['Contrato', c.id, c.clienteNombre, c.periodicidad + ' · ' + c.modalidadPago, c.importePeriodico || '', c.estado]);
  });

  var nombreArchivo = 'VENTAS_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('INFORME', 'PANEL_VENTAS', 'EXPORTAR_PANEL_VENTAS', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombreArchivo, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarVentasCSV() {
  var resultado = exportarVentasCSV();
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}
