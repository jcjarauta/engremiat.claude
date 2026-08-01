/**
 * Fase L4 (puntos 1 y 2 acordados tras la prueba real):
 *
 * 1. "Recalcular avance de proceso": accion disparada por un humano
 *    (menu), no un recalculo automatico en el camino de escritura.
 *    Lee las TAREA activas del proceso, calcula el promedio y actualiza
 *    PROCESO.PORCENTAJE_AVANCE solo tras confirmacion explicita.
 *
 * 2. Sugerencia de ORDEN_SECUENCIA y predecesor al crear un PROCESO o
 *    TAREA nuevos: calculada por obtenerSugerenciaSecuencia (llamada
 *    desde FormularioGenerico.html cuando cambia el campo de contexto),
 *    nunca escrita automaticamente -- solo precarga el campo si el
 *    usuario aun no ha escrito nada.
 *
 * Decision de alcance de agrupacion para PROCESO (confirmada): si tiene
 * PROYECTO_PRODUCTO_ID, la secuencia se calcula solo entre los procesos
 * de ese mismo contexto de proyecto, no entre todos los del producto
 * maestro.
 */

function recalcularAvanceProceso_(procesoId, confirmar) {
  var proceso = obtenerRegistroPorId('PROCESO', procesoId);

  if (!proceso) {
    throw new Error('No existe un PROCESO con ID ' + procesoId);
  }

  var tareas = listarRegistros(
    'TAREA',
    {ACTIVO: 'SÍ', PROCESO_ID: procesoId}
  ).filter(function (t) {
    return t.ESTADO !== 'Cancelada';
  });

  if (tareas.length === 0) {
    throw new Error(
      'El proceso ' + procesoId + ' no tiene tareas activas (no canceladas) para calcular el avance.'
    );
  }

  var promedio = tareas.reduce(function (total, t) {
    return total + (Number(t.PORCENTAJE_AVANCE) || 0);
  }, 0) / tareas.length;

  var avanceCalculado = Math.round(promedio);

  if (confirmar) {
    actualizarRegistroTransaccional(
      'PROCESO',
      procesoId,
      {PORCENTAJE_AVANCE: avanceCalculado},
      {origen: 'ADMIN'}
    );
  }

  return {
    procesoId: procesoId,
    avanceActual: Number(proceso.PORCENTAJE_AVANCE),
    avanceCalculado: avanceCalculado,
    numTareas: tareas.length
  };
}

function abrirRecalcularAvanceProceso() {
  var ui = SpreadsheetApp.getUi();

  var resp = ui.prompt(
    'Recalcular avance de proceso',
    'Esta acción calcula el % de avance de un PROCESO a partir del avance ' +
      'de sus tareas (promedio de las tareas activas y no canceladas) y, ' +
      'si lo confirmas, lo guarda.\n\n' +
      'Escribe el ID del proceso a recalcular (lo encuentras en la ' +
      'columna ID de la hoja PROCESO, ej. PCS-0001):',
    ui.ButtonSet.OK_CANCEL
  );

  if (resp.getSelectedButton() !== ui.Button.OK) return;

  var id = resp.getResponseText().trim();

  if (!id) return;

  var resultado;

  try {
    resultado = recalcularAvanceProceso_(id, false);
  } catch (e) {
    ui.alert(
      'No se puede calcular el avance',
      e.message,
      ui.ButtonSet.OK
    );
    return;
  }

  var proceso = obtenerRegistroPorId('PROCESO', id);
  var nombreProceso = proceso && proceso.NOMBRE ? proceso.NOMBRE : id;

  var mensaje =
    'Proceso: ' + nombreProceso + ' (' + id + ')\n\n' +
    'Avance guardado actualmente: ' + resultado.avanceActual + '%\n' +
    'Avance calculado ahora (promedio de sus ' + resultado.numTareas + ' tareas activas, sin contar las canceladas): ' + resultado.avanceCalculado + '%\n\n' +
    (resultado.avanceCalculado === resultado.avanceActual
      ? 'El valor guardado ya coincide con el calculado, no hay cambios que aplicar.\n\n'
      : '') +
    '¿Quieres reemplazar el avance guardado (' + resultado.avanceActual + '%) por el calculado (' + resultado.avanceCalculado + '%)?';

  var confirmacion = ui.alert(
    'Confirmar recálculo de avance',
    mensaje,
    ui.ButtonSet.YES_NO
  );

  if (confirmacion !== ui.Button.YES) return;

  try {
    recalcularAvanceProceso_(id, true);
    ui.alert(
      'Avance actualizado',
      'El proceso ' + nombreProceso + ' (' + id + ') queda con ' + resultado.avanceCalculado + '% de avance.',
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('Error al guardar', e.message, ui.ButtonSet.OK);
  }
}

/**
 * Sugerencia de ORDEN_SECUENCIA y predecesor, llamada desde el cliente
 * (FormularioGenerico.html) al crear un PROCESO o TAREA nuevos. No
 * escribe nada -- solo calcula. `contexto` trae los valores actuales de
 * los campos padre relevantes (ver camposContexto en el esquema).
 */
function obtenerSugerenciaSecuencia(entidadClave, contexto) {
  var clave = String(entidadClave || '').trim().toUpperCase();
  contexto = contexto || {};

  var registrosHermanos;

  if (clave === 'PROCESO') {
    var proyectoProductoId = String(contexto.PROYECTO_PRODUCTO_ID || '').trim();
    var productoId = String(contexto.PRODUCTO_ID || '').trim();

    if (!productoId) {
      return {ordenSugerido: null, predecesorId: '', predecesorEtiqueta: ''};
    }

    registrosHermanos = listarRegistros(
      'PROCESO',
      {ACTIVO: 'SÍ'}
    ).filter(function (r) {
      if (proyectoProductoId) {
        return String(r.PROYECTO_PRODUCTO_ID || '').trim() === proyectoProductoId;
      }
      return (
        String(r.PRODUCTO_ID || '').trim() === productoId &&
        !String(r.PROYECTO_PRODUCTO_ID || '').trim()
      );
    });
  } else if (clave === 'TAREA') {
    var procesoId = String(contexto.PROCESO_ID || '').trim();

    if (!procesoId) {
      return {ordenSugerido: null, predecesorId: '', predecesorEtiqueta: ''};
    }

    registrosHermanos = listarRegistros(
      'TAREA',
      {ACTIVO: 'SÍ', PROCESO_ID: procesoId}
    );
  } else {
    throw new Error(
      'No hay sugerencia de secuencia configurada para ' + entidadClave
    );
  }

  var maxOrden = 0;
  var ultimoRegistro = null;

  registrosHermanos.forEach(function (r) {
    var orden = Number(r.ORDEN_SECUENCIA) || 0;

    if (orden >= maxOrden) {
      maxOrden = orden;
      ultimoRegistro = r;
    }
  });

  return {
    ordenSugerido: maxOrden + 1,
    predecesorId: ultimoRegistro ? ultimoRegistro.ID : '',
    predecesorEtiqueta: ultimoRegistro
      ? (ultimoRegistro.ID + ' - ' + (ultimoRegistro.NOMBRE || ''))
      : ''
  };
}
