/**
 * N7.2 (roadmap -- "recálculo automático de MATERIAL.STOCK_ACTUAL
 * desde MOVIMIENTO_MATERIAL"): hasta ahora el libro de movimientos
 * (L3.3) se registraba pero nunca tocaba el stock -- STOCK_ACTUAL solo
 * cambiaba si alguien lo editaba a mano en el formulario. Esta pieza
 * cierra ese hueco: cada MOVIMIENTO_MATERIAL nuevo ajusta STOCK_ACTUAL
 * (o CANTIDAD_RESERVADA, para Reserva/Liberación de reserva) en el
 * MATERIAL correspondiente, automáticamente.
 *
 * Alcance deliberado: solo se aplica a la CREACIÓN de un movimiento
 * (evento que ya ocurrió, registro aditivo -- mismo criterio que
 * EJECUCION_TAREA/registrarHistorial). Editar o desactivar un
 * movimiento pasado no revierte el stock; no hay caso de uso real
 * planteado para eso y complicaría la trazabilidad sin necesidad.
 *
 * No se llama desde dentro de insertarRegistroTransaccional (evitar
 * anidar una segunda adquisición de LockService.getScriptLock()
 * mientras la primera sigue abierta) -- se llama DESPUÉS, una vez el
 * insert ya liberó su bloqueo, desde los dos sitios que crean
 * MOVIMIENTO_MATERIAL: guardarFormulario (alta manual) y
 * confirmarRecepcion_ (alta automática al confirmar una recepción).
 */

var DELTA_STOCK_POR_TIPO_MOVIMIENTO_ = Object.freeze({
  'Entrada': 1,
  'Devolución': 1,
  'Ajuste positivo': 1,
  'Salida': -1,
  'Consumo': -1,
  'Merma': -1,
  'Ajuste negativo': -1,
  'Traslado': 0
});

var DELTA_RESERVA_POR_TIPO_MOVIMIENTO_ = Object.freeze({
  'Reserva': 1,
  'Liberación de reserva': -1
});

function aplicarMovimientoAStock_(materialId, tipoMovimiento, cantidad) {
  var cantidadNum = Number(cantidad) || 0;
  if (!materialId || cantidadNum === 0) return;

  var material = obtenerRegistroPorId('MATERIAL', materialId);
  if (!material) {
    console.warn('aplicarMovimientoAStock_: material no encontrado, stock desincronizado. materialId=' + materialId + ' tipoMovimiento=' + tipoMovimiento);
    return;
  }

  if (Object.prototype.hasOwnProperty.call(DELTA_STOCK_POR_TIPO_MOVIMIENTO_, tipoMovimiento)) {
    var signoStock = DELTA_STOCK_POR_TIPO_MOVIMIENTO_[tipoMovimiento];
    if (signoStock === 0) return;
    var nuevoStock = Math.max((Number(material.STOCK_ACTUAL) || 0) + signoStock * cantidadNum, 0);
    actualizarRegistroTransaccional('MATERIAL', materialId, { STOCK_ACTUAL: nuevoStock }, { origen: 'SCRIPT' });
    return;
  }

  if (Object.prototype.hasOwnProperty.call(DELTA_RESERVA_POR_TIPO_MOVIMIENTO_, tipoMovimiento)) {
    var signoReserva = DELTA_RESERVA_POR_TIPO_MOVIMIENTO_[tipoMovimiento];
    var nuevaReserva = Math.max((Number(material.CANTIDAD_RESERVADA) || 0) + signoReserva * cantidadNum, 0);
    actualizarRegistroTransaccional('MATERIAL', materialId, { CANTIDAD_RESERVADA: nuevaReserva }, { origen: 'SCRIPT' });
  }
}
