/**
 * Fase L5.2: confirmar una recepcion genera un MOVIMIENTO_MATERIAL
 * (tipo Entrada, L3.3) por cada linea recibida -- no escribe
 * MATERIAL.STOCK_ACTUAL directamente. Mismo patron que "Recalcular
 * avance de proceso" (AvanceYSecuencia.js): accion de menu disparada
 * por un humano, con vista previa y confirmacion explicita antes de
 * escribir, nunca automatica en el camino de guardado de una linea.
 *
 * Protegido contra doble confirmacion: si la RECEPCION ya esta
 * Confirmada, se rechaza (evitaria duplicar la entrada de stock).
 */

function confirmarRecepcion_(recepcionId, confirmar) {
  var recepcion = obtenerRegistroPorId('RECEPCION', recepcionId);

  if (!recepcion) {
    throw new Error('No existe una RECEPCION con ID ' + recepcionId);
  }

  if (recepcion.ESTADO === 'Confirmada') {
    throw new Error(
      'La recepción ' + recepcionId + ' ya está confirmada; no se puede confirmar dos veces (duplicaría la entrada de stock).'
    );
  }

  var lineas = listarRegistros(
    'RECEPCION_LINEA',
    {ACTIVO: 'SÍ', RECEPCION_ID: recepcionId}
  ).filter(function (l) {
    return l.ESTADO !== 'Cancelada';
  });

  if (lineas.length === 0) {
    throw new Error(
      'La recepción ' + recepcionId + ' no tiene líneas activas (no canceladas) que confirmar.'
    );
  }

  if (confirmar) {
    lineas.forEach(function (linea) {
      insertarRegistroTransaccional(
        'MOVIMIENTO_MATERIAL',
        {
          MATERIAL_ID: linea.MATERIAL_ID,
          TIPO_MOVIMIENTO: 'Entrada',
          CANTIDAD: linea.CANTIDAD_RECIBIDA,
          UNIDAD: linea.UNIDAD,
          FECHA_MOVIMIENTO: recepcion.FECHA_RECEPCION || new Date(),
          RESPONSABLE_ID: recepcion.RESPONSABLE_ID || '',
          OBSERVACIONES: 'Generado al confirmar ' + recepcionId + ' (pedido ' + recepcion.PEDIDO_PROVEEDOR_ID + ').'
        },
        {origen: 'ADMIN'}
      );
      // N7.2 -- ahora sí actualiza MATERIAL.STOCK_ACTUAL (StockMaterialService.js).
      aplicarMovimientoAStock_(linea.MATERIAL_ID, 'Entrada', linea.CANTIDAD_RECIBIDA);
    });

    actualizarRegistroTransaccional(
      'RECEPCION',
      recepcionId,
      {ESTADO: 'Confirmada'},
      {origen: 'ADMIN'}
    );

    actualizarEstadoPedidoTrasRecepcion_(recepcion.PEDIDO_PROVEEDOR_ID);
  }

  return {
    recepcionId: recepcionId,
    pedidoId: recepcion.PEDIDO_PROVEEDOR_ID,
    numLineas: lineas.length,
    lineas: lineas.map(function (l) {
      return {materialId: l.MATERIAL_ID, cantidad: l.CANTIDAD_RECIBIDA, unidad: l.UNIDAD};
    })
  };
}

/*
 * Bug real detectado al verificar L5.2: confirmar una recepcion nunca
 * actualizaba PEDIDO_PROVEEDOR.ESTADO (se quedaba en "Enviado" para
 * siempre), asi que un pedido ya recibido por completo seguia
 * apareciendo en el buscador de "Nueva recepcion de pedido" como si
 * estuviera pendiente. Compara lo recibido (suma de RECEPCION_LINEA de
 * todas las RECEPCION Confirmadas de ese pedido) contra lo pedido
 * (PEDIDO_PROVEEDOR_LINEA) por material, y marca Recibido_completo si
 * todo llego, Recibido_parcial en otro caso.
 */
function actualizarEstadoPedidoTrasRecepcion_(pedidoId) {
  var lineasPedido = listarRegistros(
    'PEDIDO_PROVEEDOR_LINEA',
    {ACTIVO: 'SÍ', PEDIDO_PROVEEDOR_ID: pedidoId}
  ).filter(function (l) { return l.ESTADO !== 'Cancelada'; });

  if (lineasPedido.length === 0) return;

  var recepcionesConfirmadas = listarRegistros(
    'RECEPCION',
    {ACTIVO: 'SÍ', PEDIDO_PROVEEDOR_ID: pedidoId, ESTADO: 'Confirmada'}
  );

  if (recepcionesConfirmadas.length === 0) return;

  var idsRecepcionesConfirmadas = recepcionesConfirmadas.map(function (r) { return r.ID; });

  var recibidoPorMaterial = {};

  listarRegistros('RECEPCION_LINEA', {ACTIVO: 'SÍ'})
    .filter(function (l) {
      return idsRecepcionesConfirmadas.indexOf(l.RECEPCION_ID) !== -1 && l.ESTADO !== 'Cancelada';
    })
    .forEach(function (l) {
      recibidoPorMaterial[l.MATERIAL_ID] =
        (recibidoPorMaterial[l.MATERIAL_ID] || 0) + Number(l.CANTIDAD_RECIBIDA || 0);
    });

  var completo = lineasPedido.every(function (l) {
    return (recibidoPorMaterial[l.MATERIAL_ID] || 0) >= Number(l.CANTIDAD_PEDIDA || 0);
  });

  actualizarRegistroTransaccional(
    'PEDIDO_PROVEEDOR',
    pedidoId,
    {ESTADO: completo ? 'Recibido completo' : 'Recibido parcial'},
    {origen: 'ADMIN'}
  );
}

/*
 * Backfill de un solo uso: recalcula ESTADO en todos los PEDIDO_PROVEEDOR
 * que ya tengan alguna RECEPCION Confirmada, para los pedidos dados de
 * alta antes de que actualizarEstadoPedidoTrasRecepcion_ existiera.
 * Sin parametros para poder ejecutarse directamente desde el
 * desplegable "Seleccionar funcion" del editor de Apps Script.
 */
function corregirEstadoPedidosExistentes() {
  var packageName = 'CORREGIR_ESTADO_PEDIDOS_EXISTENTES';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var pedidos = listarRegistros('PEDIDO_PROVEEDOR', {ACTIVO: 'SÍ'});
  var corregidos = 0;

  pedidos.forEach(function (pedido) {
    var antes = pedido.ESTADO;
    actualizarEstadoPedidoTrasRecepcion_(pedido.ID);
    var despues = obtenerRegistroPorId('PEDIDO_PROVEEDOR', pedido.ID).ESTADO;

    if (antes !== despues) {
      corregidos += 1;
      console.log('OK pedido_corregido=' + pedido.ID + ' antes=' + antes + ' despues=' + despues);
    }
  });

  console.log('OK pedidos_revisados=' + pedidos.length + ' pedidos_corregidos=' + corregidos);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}

/*
 * Reemplaza el ui.prompt() original (pedia el ID de memoria, mismo
 * hueco que "Editar registro" antes de L5.1) por el selector con
 * buscador generico (abrirSelectorConAccion_, Formularios.js). Solo
 * ofrece recepciones no Confirmadas/Canceladas -- "pedidos a
 * recepcionar" en la terminologia del usuario.
 */
function abrirConfirmarRecepcion() {
  abrirSelectorConAccion_(
    'RECEPCION',
    'Confirmar recepción de pedido',
    'seleccionarYConfirmarRecepcion',
    'obtenerOpcionesRecepcionPendiente'
  );
}

function obtenerOpcionesRecepcionPendiente() {
  return listarRegistros('RECEPCION', { ACTIVO: 'SÍ' })
    .filter(function (r) {
      return r.ESTADO !== 'Confirmada' && r.ESTADO !== 'Cancelada';
    })
    .map(function (r) {
      return {
        id: r.ID,
        etiqueta: r.ID + ' - Pedido ' + r.PEDIDO_PROVEEDOR_ID + ' (' + r.ESTADO + ')'
      };
    });
}

/*
 * Igual que el flujo previo del ui.prompt: previsualiza (ui.alert),
 * pide confirmacion explicita y solo entonces escribe. Se llama desde
 * SelectorRegistro.html tras elegir la recepcion en el buscador.
 */
function seleccionarYConfirmarRecepcion(entidad, recepcionId) {
  var ui = SpreadsheetApp.getUi();

  var resultado;

  try {
    resultado = confirmarRecepcion_(recepcionId, false);
  } catch (e) {
    ui.alert('No se puede confirmar', e.message, ui.ButtonSet.OK);
    return true;
  }

  var detalleLineas = resultado.lineas
    .map(function (l) { return '- ' + l.materialId + ': ' + l.cantidad + ' ' + l.unidad; })
    .join('\n');

  var mensaje =
    'Pedido: ' + resultado.pedidoId + '\n' +
    'Se generará una entrada de stock por cada línea:\n' +
    detalleLineas + '\n\n' +
    '¿Confirmar la recepción y registrar estas entradas?';

  var confirmacion = ui.alert('Confirmar recepción', mensaje, ui.ButtonSet.YES_NO);

  if (confirmacion !== ui.Button.YES) return true;

  try {
    confirmarRecepcion_(recepcionId, true);
    ui.alert(
      'Recepción confirmada',
      'Se registraron ' + resultado.numLineas + ' entradas de material para ' + recepcionId + '.',
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('Error al confirmar', e.message, ui.ButtonSet.OK);
  }

  return true;
}
