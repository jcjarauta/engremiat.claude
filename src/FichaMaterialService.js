/**
 * Ficha de registro de Material. Mismo patron que las fichas anteriores
 * -- une lo que hoy solo se ve fila a fila: que productos lo necesitan
 * (PRODUCTO_MATERIAL), que proveedores lo suministran y a que precio
 * (PROVEEDOR_MATERIAL, comparable entre si) y los movimientos de stock
 * mas recientes (MOVIMIENTO_MATERIAL) -- mismos criterios de alerta de
 * stock que ya usa el Panel Operativo (DashboardService.js), no se
 * reinventan.
 */

function estadoStockMaterial_(material) {
  var stock = Number(material.STOCK_ACTUAL) || 0;
  var minimo = Number(material.STOCK_MINIMO) || 0;
  var reservada = Number(material.CANTIDAD_RESERVADA) || 0;
  if (stock <= 0) return 'agotado';
  if (reservada > stock) return 'reservas_superan_stock';
  if (stock <= minimo) return 'stock_bajo';
  return 'sano';
}

function obtenerFichaMaterial(id) {
  var material = obtenerRegistroPorId('MATERIAL', id);
  if (!material) {
    throw new Error('No existe ningún registro de Material con id "' + id + '".');
  }

  var productosPorId = {};
  listarRegistros('PRODUCTO', {}).forEach(function (p) { productosPorId[p.ID] = p; });

  var productos = listarRegistros('PRODUCTO_MATERIAL', { ACTIVO: 'SÍ' })
    .filter(function (pm) { return pm.MATERIAL_ID === id; })
    .map(function (pm) {
      var producto = productosPorId[pm.PRODUCTO_ID];
      return {
        relacionId: pm.ID, productoId: pm.PRODUCTO_ID, productoNombre: producto ? producto.NOMBRE : pm.PRODUCTO_ID,
        cantidadPrevista: pm.CANTIDAD_PREVISTA, unidad: pm.UNIDAD, estado: pm.ESTADO
      };
    });

  var proveedoresPorId = {};
  listarRegistros('PROVEEDOR', {}).forEach(function (p) { proveedoresPorId[p.ID] = p; });

  var proveedores = listarRegistros('PROVEEDOR_MATERIAL', { ACTIVO: 'SÍ' })
    .filter(function (pm) { return pm.MATERIAL_ID === id; })
    .map(function (pm) {
      var proveedor = proveedoresPorId[pm.PROVEEDOR_ID];
      return {
        relacionId: pm.ID, proveedorId: pm.PROVEEDOR_ID, proveedorNombre: proveedor ? proveedor.NOMBRE : pm.PROVEEDOR_ID,
        precioUnitario: pm.PRECIO_UNITARIO, plazoEntregaDias: pm.PLAZO_ENTREGA_DIAS,
        esPreferente: pm.ES_PREFERENTE === 'SÍ', estado: pm.ESTADO
      };
    })
    .sort(function (a, b) { return (Number(a.precioUnitario) || 0) - (Number(b.precioUnitario) || 0); });

  var nombresPersona = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });

  var movimientos = listarRegistros('MOVIMIENTO_MATERIAL', { ACTIVO: 'SÍ' })
    .filter(function (m) { return m.MATERIAL_ID === id; })
    .map(function (m) {
      return {
        id: m.ID, tipo: m.TIPO_MOVIMIENTO, cantidad: m.CANTIDAD, unidad: m.UNIDAD,
        fecha: m.FECHA_MOVIMIENTO || null, responsableNombre: nombresPersona[m.RESPONSABLE_ID] || ''
      };
    })
    .sort(function (a, b) { return new Date(b.fecha || 0) - new Date(a.fecha || 0); });

  return serializarParaCliente_({
    material: material,
    estadoStock: estadoStockMaterial_(material),
    productos: productos,
    proveedores: proveedores,
    movimientos: movimientos
  });
}

function abrirFichaMaterial(id) {
  var template = HtmlService.createTemplateFromFile('FichaMaterial');
  template.idRegistro = id;
  var html = template.evaluate().setWidth(560).setHeight(640);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Ficha: ' + id);
}

function seleccionarYAbrirFichaMaterial(entidad, idRegistro) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);
  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }
  abrirFichaMaterial(idRegistro);
  return true;
}

function abrirFichaMaterialBuscar() {
  abrirSelectorConAccion_('MATERIAL', 'Ver ficha de material', 'seleccionarYAbrirFichaMaterial', 'obtenerOpcionesEntidadParaSelector', true);
}

function abrirFormularioCrearMovimientoMaterialParaMaterial(materialId) {
  abrirFormularioCrear_('MOVIMIENTO_MATERIAL', 'Nuevo movimiento de material', {
    MATERIAL_ID: materialId
  }, { tipo: 'ficha', entidad: 'MATERIAL', id: materialId });
}

function abrirFormularioCrearProductoMaterialParaMaterial(materialId) {
  abrirFormularioCrear_('PRODUCTO_MATERIAL', 'Nuevo producto que usa este material', {
    MATERIAL_ID: materialId
  }, { tipo: 'ficha', entidad: 'MATERIAL', id: materialId });
}

function abrirFormularioCrearProveedorMaterialParaMaterial(materialId) {
  abrirFormularioCrear_('PROVEEDOR_MATERIAL', 'Nuevo proveedor de este material', {
    MATERIAL_ID: materialId
  }, { tipo: 'ficha', entidad: 'MATERIAL', id: materialId });
}

/*
 * Exportar CSV de la ficha (mismo exportador compartido que Producto,
 * Proveedor y el Gantt). Fila plana por Producto/Proveedor/Movimiento.
 */
function exportarFichaMaterialCSV(id) {
  var datos = obtenerFichaMaterial(id);
  var encabezados = ['Tipo', 'ID', 'Nombre', 'Detalle', 'Estado'];

  var filas = [];
  datos.productos.forEach(function (p) {
    filas.push(['Producto', p.productoId, p.productoNombre, [p.cantidadPrevista, p.unidad].filter(Boolean).join(' '), p.estado]);
  });
  datos.proveedores.forEach(function (pr) {
    var detalle = [pr.precioUnitario ? pr.precioUnitario + ' €/ud' : '', pr.plazoEntregaDias ? pr.plazoEntregaDias + ' días' : '', pr.esPreferente ? 'Preferente' : ''].filter(Boolean).join(' · ');
    filas.push(['Proveedor', pr.proveedorId, pr.proveedorNombre, detalle, pr.estado]);
  });
  datos.movimientos.forEach(function (m) {
    filas.push(['Movimiento', m.id, m.tipo, [m.cantidad, m.unidad, m.fecha].filter(Boolean).join(' · '), '']);
  });

  var nombreArchivo = 'FICHA_MATERIAL_' + id + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('MATERIAL', id, 'EXPORTAR_FICHA', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombreArchivo, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarFichaMaterialCSV(id) {
  var resultado = exportarFichaMaterialCSV(id);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}
