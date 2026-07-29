/**
 * Reversion.gs -- Fase 1 (BL-MVP-02): revertir el ultimo cambio controlado de un registro.
 * Reconstruido tras deteccion de regresion via AUD-01.
 */

function revertirUltimoCambioControlado(entidad, idRegistro) {
  var clave = String(entidad || '').trim().toUpperCase();
  if (!ENTIDADES_MVP[clave]) {
    throw new Error('No es posible revertir: entidad no reconocida (' + entidad + ').');
  }
  if (!idRegistro) {
    throw new Error('No es posible revertir: se requiere el ID del registro.');
  }

  var registroActual = obtenerRegistroPorId(clave, idRegistro);
  if (!registroActual) {
    throw new Error('No es posible revertir: no existe un registro de ' + clave + ' con id ' + idRegistro + '.');
  }

  var historialEntidad = listarHistorialPorOrigen(null, true).filter(function (h) {
    return h.ENTIDAD === clave && h.REGISTRO_ID === idRegistro;
  });

  var cambiosControlados = historialEntidad
    .filter(function (h) { return h.ACCION === 'CREAR' || h.ACCION === 'ACTUALIZAR'; })
    .sort(function (a, b) { return compararIdHistorial_(b.ID_HISTORIAL, a.ID_HISTORIAL); });

  if (cambiosControlados.length === 0) {
    throw new Error('No es posible revertir: no hay cambios controlados registrados para ' + clave + ' ' + idRegistro + '.');
  }

  var ultimoCambio = cambiosControlados[0];

  if (ultimoCambio.ACCION === 'CREAR') {
    throw new Error('No es posible revertir: el ultimo cambio fue la creacion del registro; use la baja logica en vez de revertir la creacion.');
  }

  var yaRevertido = historialEntidad.some(function (h) {
    return h.ACCION === 'REVERTIR' && compararIdHistorial_(h.ID_HISTORIAL, ultimoCambio.ID_HISTORIAL) > 0;
  });
  if (yaRevertido) {
    throw new Error('No es posible revertir: este cambio ya fue revertido anteriormente.');
  }

  var antes;
  try {
    antes = JSON.parse(ultimoCambio.ANTES_JSON || '{}');
  } catch (e) {
    throw new Error('No es posible revertir: el historial de este cambio no tiene datos previos validos.');
  }

  var camposARevertir = {};
  Object.keys(antes).forEach(function (campo) {
    if (antes[campo] !== null && antes[campo] !== undefined) {
      camposARevertir[campo] = antes[campo];
    }
  });

  if (Object.keys(camposARevertir).length === 0) {
    throw new Error('No es posible revertir: no hay campos previos que restaurar en este cambio.');
  }

  var diferencias = Object.keys(camposARevertir).map(function (campo) {
    return { campo: campo, anterior: registroActual[campo], nuevo: camposARevertir[campo] };
  });

  actualizarRegistroTransaccional(clave, idRegistro, camposARevertir, { dryRun: false });

  registrarHistorial(clave, idRegistro, 'REVERTIR', diferencias, {
    origen: 'ADMIN',
    resultado: 'OK',
    codigo: 'REVERTIDO_' + ultimoCambio.ID_HISTORIAL
  });

  return { entidad: clave, id: idRegistro, camposRevertidos: Object.keys(camposARevertir) };
}

function abrirRevertirUltimoCambio() {
  var ui = SpreadsheetApp.getUi();
  var respEntidad = ui.prompt('Revertir ultimo cambio controlado', 'Entidad (' + Object.keys(ENTIDADES_MVP).join(', ') + '):', ui.ButtonSet.OK_CANCEL);
  if (respEntidad.getSelectedButton() !== ui.Button.OK) return;
  var respId = ui.prompt('Revertir ultimo cambio controlado', 'ID del registro:', ui.ButtonSet.OK_CANCEL);
  if (respId.getSelectedButton() !== ui.Button.OK) return;
  try {
    var resultado = revertirUltimoCambioControlado(respEntidad.getResponseText().trim(), respId.getResponseText().trim());
    ui.alert('Reversion completada', 'Se revirtieron los campos: ' + resultado.camposRevertidos.join(', '), ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('No se pudo revertir', e.message, ui.ButtonSet.OK);
  }
}
function compararIdHistorial_(idA, idB) {
  var numA = parseInt(String(idA).replace(/[^0-9]/g, ''), 10) || 0;
  var numB = parseInt(String(idB).replace(/[^0-9]/g, ''), 10) || 0;
  return numA - numB;
}
