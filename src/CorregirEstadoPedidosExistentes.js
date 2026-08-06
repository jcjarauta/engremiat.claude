/**
 * Backfill de un solo uso: recalcula ESTADO en todos los PEDIDO_PROVEEDOR
 * que ya tengan alguna RECEPCION Confirmada, para los pedidos dados de
 * alta antes de que actualizarEstadoPedidoTrasRecepcion_ existiera.
 * Sin parametros para poder ejecutarse directamente desde el
 * desplegable "Seleccionar funcion" del editor de Apps Script.
 *
 * Extraida de PedidoRecepcion.js (ver PROPUESTA_MODULARIZACION_LIBRERIA.md):
 * sin referencias externas, mismo perfil que CorregirCatalogoTipoProyecto.js.
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
