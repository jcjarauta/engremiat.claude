/**
 * Ficha de registro de Proveedor. Mismo patron que las fichas anteriores
 * -- agregador de solo lectura: materiales que suministra
 * (PROVEEDOR_MATERIAL, con precio comparable entre proveedores),
 * pedidos realizados (PEDIDO_PROVEEDOR) y un resumen de gasto/recepcion.
 */

function obtenerFichaProveedor(id) {
  var proveedor = obtenerRegistroPorId('PROVEEDOR', id);
  if (!proveedor) {
    throw new Error('No existe ningún registro de Proveedor con id "' + id + '".');
  }

  var materialesPorId = {};
  listarRegistros('MATERIAL', {}).forEach(function (m) { materialesPorId[m.ID] = m; });

  var materiales = listarRegistros('PROVEEDOR_MATERIAL', { ACTIVO: 'SÍ' })
    .filter(function (pm) { return pm.PROVEEDOR_ID === id; })
    .map(function (pm) {
      var material = materialesPorId[pm.MATERIAL_ID];
      return {
        relacionId: pm.ID, materialId: pm.MATERIAL_ID, materialNombre: material ? material.NOMBRE : pm.MATERIAL_ID,
        precioUnitario: pm.PRECIO_UNITARIO, plazoEntregaDias: pm.PLAZO_ENTREGA_DIAS,
        esPreferente: pm.ES_PREFERENTE === 'SÍ', estado: pm.ESTADO
      };
    })
    .sort(function (a, b) { return (b.esPreferente ? 1 : 0) - (a.esPreferente ? 1 : 0); });

  var lineasPorPedido = {};
  listarRegistros('PEDIDO_PROVEEDOR_LINEA', { ACTIVO: 'SÍ' }).forEach(function (linea) {
    if (!lineasPorPedido[linea.PEDIDO_PROVEEDOR_ID]) lineasPorPedido[linea.PEDIDO_PROVEEDOR_ID] = [];
    lineasPorPedido[linea.PEDIDO_PROVEEDOR_ID].push(linea);
  });

  var pedidos = listarRegistros('PEDIDO_PROVEEDOR', { ACTIVO: 'SÍ' })
    .filter(function (p) { return p.PROVEEDOR_ID === id; })
    .map(function (p) {
      var lineas = lineasPorPedido[p.ID] || [];
      var totalPedido = lineas.reduce(function (acc, l) {
        return acc + (Number(l.CANTIDAD_PEDIDA) || 0) * (Number(l.PRECIO_UNITARIO) || 0);
      }, 0);
      return {
        id: p.ID, fechaPedido: p.FECHA_PEDIDO || null, estado: p.ESTADO,
        numeroLineas: lineas.length, total: Math.round(totalPedido * 100) / 100
      };
    })
    .sort(function (a, b) { return new Date(b.fechaPedido || 0) - new Date(a.fechaPedido || 0); });

  var resumen = {
    pedidosTotal: pedidos.length,
    pedidosRecibidos: pedidos.filter(function (p) { return p.estado === 'Recibido completo'; }).length,
    gastoTotal: Math.round(pedidos.reduce(function (acc, p) { return acc + p.total; }, 0) * 100) / 100,
    materialesTotal: materiales.length
  };

  return serializarParaCliente_({
    proveedor: proveedor,
    materiales: materiales,
    pedidos: pedidos,
    resumen: resumen
  });
}

function abrirFichaProveedor(id) {
  var template = HtmlService.createTemplateFromFile('FichaProveedor');
  template.idRegistro = id;
  var html = template.evaluate().setWidth(560).setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(html, 'Ficha: ' + id);
}

function seleccionarYAbrirFichaProveedor(entidad, idRegistro) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);
  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }
  abrirFichaProveedor(idRegistro);
  return true;
}

function abrirFichaProveedorBuscar() {
  abrirSelectorConAccion_('PROVEEDOR', 'Ver ficha de proveedor', 'seleccionarYAbrirFichaProveedor', 'obtenerOpcionesEntidadParaSelector');
}

function abrirFormularioCrearProveedorMaterialParaProveedor(proveedorId) {
  abrirFormularioCrear_('PROVEEDOR_MATERIAL', 'Nuevo material suministrado', {
    PROVEEDOR_ID: proveedorId
  }, { tipo: 'ficha', entidad: 'PROVEEDOR', id: proveedorId });
}

function abrirFormularioCrearPedidoProveedorParaProveedor(proveedorId) {
  abrirFormularioCrear_('PEDIDO_PROVEEDOR', 'Nuevo pedido a proveedor', {
    PROVEEDOR_ID: proveedorId
  }, { tipo: 'ficha', entidad: 'PROVEEDOR', id: proveedorId });
}

/*
 * Exportar CSV de la ficha (mismo exportador compartido que Producto y
 * el Gantt, construirCsvConBom_/abrirDialogoDescargaCSV_ en
 * DesviacionService.js). Fila plana por Material/Pedido.
 */
function exportarFichaProveedorCSV(id) {
  var datos = obtenerFichaProveedor(id);
  var encabezados = ['Tipo', 'ID', 'Nombre', 'Detalle', 'Estado'];

  var filas = [];
  datos.materiales.forEach(function (m) {
    var detalle = [m.precioUnitario ? m.precioUnitario + ' €/ud' : '', m.plazoEntregaDias ? m.plazoEntregaDias + ' días' : '', m.esPreferente ? 'Preferente' : ''].filter(Boolean).join(' · ');
    filas.push(['Material', m.materialId, m.materialNombre, detalle, m.estado]);
  });
  datos.pedidos.forEach(function (p) {
    filas.push(['Pedido', p.id, p.fechaPedido, p.numeroLineas + ' líneas · ' + p.total + ' €', p.estado]);
  });

  var nombreArchivo = 'FICHA_PROVEEDOR_' + id + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('PROVEEDOR', id, 'EXPORTAR_FICHA', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombreArchivo, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarFichaProveedorCSV(id) {
  var resultado = exportarFichaProveedorCSV(id);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}
