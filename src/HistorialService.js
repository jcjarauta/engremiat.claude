/**
 * HistorialService.gs -- Fase 1 (roadmap BL-MVP-02): esquema ampliado de trazabilidad.
 * Registra en 91_HISTORIAL una fila por cada operacion de escritura real (no dryRun)
 * sobre cualquier entidad del MVP, con antes/despues en JSON, origen de la operacion,
 * correlation id y marca de prueba explicita (ES_PRUEBA/PRUEBA_ID) para poder filtrar
 * actividad operativa real de actividad tecnica/pruebas sin mezclarlas.
 *
 * Esquema de 91_HISTORIAL (ampliado respecto a la Fase 10 del plan anterior):
 *   ID_HISTORIAL, TIMESTAMP, CORRELATION_ID, USUARIO, ACCION, ENTIDAD, REGISTRO_ID,
 *   ORIGEN, ANTES_JSON, DESPUES_JSON, RESULTADO, CODIGO, ERROR, ES_PRUEBA, PRUEBA_ID
 *
 * Mismo punto unico de enganche de bajo nivel que en la Fase 10 (no se duplica logica):
 *   - insertarRegistroTransaccional llama a registrarHistorial con accion CREAR.
 *   - actualizarRegistroTransaccional llama a registrarHistorial despues de escribir,
 *     afinando la accion a DESACTIVAR/REACTIVAR cuando el unico campo modificado es ACTIVO.
 *
 * ORIGEN llega a traves de opciones.origen en insertarRegistroTransaccional /
 * actualizarRegistroTransaccional (mismo objeto opciones que ya llevaba dryRun/idExcluir).
 * Por defecto SCRIPT si no se especifica.
 */

var ORIGENES_HISTORIAL_VALIDOS = ['UI', 'SCRIPT', 'TEST', 'ADMIN', 'N8N'];

function generarCorrelationId_() {
  return Utilities.getUuid();
}

function registrarHistorial(entidad, registroId, accion, diferencias, opciones) {
  var hoja = SpreadsheetApp.getActive().getSheetByName('91_HISTORIAL');
  if (!hoja) {
    throw new Error('ERROR_HISTORIAL: no existe la hoja 91_HISTORIAL.');
  }

  var config = opciones || {};
  var listaDiferencias = diferencias || [];
  var antes = {};
  var despues = {};
  listaDiferencias.forEach(function (dif) {
    antes[dif.campo] = dif.anterior;
    despues[dif.campo] = dif.nuevo;
  });

  var origen = config.origen || 'SCRIPT';
  if (ORIGENES_HISTORIAL_VALIDOS.indexOf(origen) === -1) {
    throw new Error('ERROR_HISTORIAL: ORIGEN no valido: ' + origen);
  }

  var id = obtenerSiguienteId('91_HISTORIAL', 'HIS');
  var usuario = Session.getEffectiveUser().getEmail() || 'USUARIO_NO_IDENTIFICADO';
  var esPrueba = config.esPrueba ? 'S\u00cd' : 'NO';

  hoja.appendRow([
    id,
    new Date(),
    config.correlationId || generarCorrelationId_(),
    usuario,
    accion,
    entidad,
    registroId,
    origen,
    JSON.stringify(antes),
    JSON.stringify(despues),
    config.resultado || 'OK',
    config.codigo || '',
    config.error || '',
    esPrueba,
    config.pruebaId || ''
  ]);
  SpreadsheetApp.flush();

  return {id: id};
}

function listarHistorialDeRegistro(entidad, registroId) {
  var hoja = SpreadsheetApp.getActive().getSheetByName('91_HISTORIAL');
  if (!hoja) {
    throw new Error('ERROR_HISTORIAL: no existe la hoja 91_HISTORIAL.');
  }

  var valores = hoja.getDataRange().getDisplayValues();
  var encabezados = valores[0];

  return valores.slice(1)
    .map(function (fila) {
      var registro = {};
      encabezados.forEach(function (encabezado, indice) {
        registro[encabezado] = fila[indice];
      });
      return registro;
    })
    .filter(function (registro) {
      return registro.ENTIDAD === entidad && registro.REGISTRO_ID === registroId;
    });
}

function listarHistorialPorOrigen(origen, incluirPruebas) {
  var hoja = SpreadsheetApp.getActive().getSheetByName('91_HISTORIAL');
  if (!hoja) {
    throw new Error('ERROR_HISTORIAL: no existe la hoja 91_HISTORIAL.');
  }
  var valores = hoja.getDataRange().getDisplayValues();
  var encabezados = valores[0];
  return valores.slice(1)
    .map(function (fila) {
      var registro = {};
      encabezados.forEach(function (encabezado, indice) { registro[encabezado] = fila[indice]; });
      return registro;
    })
    .filter(function (registro) {
      var coincideOrigen = !origen || registro.ORIGEN === origen;
      var coincidePrueba = incluirPruebas ? true : registro.ES_PRUEBA !== 'S\u00cd';
      return coincideOrigen && coincidePrueba;
    });
}

/**
 * Migracion unica de 91_HISTORIAL del esquema de Fase 10 (12 columnas) al esquema
 * ampliado de Fase 1 de BL-MVP-02 (15 columnas). Preserva todas las filas existentes.
 * Respaldo de seguridad ya duplicado como 91_HISTORIAL_BACKUP_PRE_FASE1 antes de ejecutar.
 *
 * Heuristica ES_PRUEBA (economica, sin juicio manual fila a fila): una fila se marca
 * ES_PRUEBA SI si el REGISTRO_ID ya no existe en la hoja real de esa entidad -- es decir,
 * si el propio registro fue limpiado por una suite de pruebas. Los que sobreviven
 * (p.ej. CAM-0001, CAM-0002) quedan ES_PRUEBA NO. ORIGEN se fija a SCRIPT para todo
 * el historico (no existia UI real en ese momento).
 */
function migrarHistorialEsquemaAmpliado() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('91_HISTORIAL');
  if (!hoja) throw new Error('ERROR_MIGRACION: no existe 91_HISTORIAL');

  var datos = hoja.getDataRange().getValues();
  var encabezadosViejos = datos[0];
  var filas = datos.slice(1);

  var idxViejo = {};
  encabezadosViejos.forEach(function (h, i) { idxViejo[h] = i; });

  var cacheIds = {};
  function existeIdEnEntidad(entidad, id) {
    if (!cacheIds.hasOwnProperty(entidad)) {
      try {
        var hojaEnt = obtenerHojaEntidad_(entidad);
        var valoresEnt = hojaEnt.getDataRange().getValues();
        var idxId = valoresEnt[0].indexOf('ID');
        var set = {};
        valoresEnt.slice(1).forEach(function (f) { set[f[idxId]] = true; });
        cacheIds[entidad] = set;
      } catch (e) {
        cacheIds[entidad] = null;
      }
    }
    var set = cacheIds[entidad];
    return set ? !!set[id] : false;
  }

  var nuevosEncabezados = ['ID_HISTORIAL', 'TIMESTAMP', 'CORRELATION_ID', 'USUARIO', 'ACCION', 'ENTIDAD', 'REGISTRO_ID', 'ORIGEN', 'ANTES_JSON', 'DESPUES_JSON', 'RESULTADO', 'CODIGO', 'ERROR', 'ES_PRUEBA', 'PRUEBA_ID'];

  var filasNuevas = filas.map(function (fila) {
    var entidad = fila[idxViejo['ENTIDAD']];
    var registroId = fila[idxViejo['REGISTRO_ID']];
    var esReal = existeIdEnEntidad(entidad, registroId);
    return [
      fila[idxViejo['ID']],
      fila[idxViejo['FECHA_HORA']],
      fila[idxViejo['OPERACION_ID']],
      fila[idxViejo['USUARIO']],
      fila[idxViejo['ACCION']],
      entidad,
      registroId,
      'SCRIPT',
      fila[idxViejo['VALOR_ANTERIOR']],
      fila[idxViejo['VALOR_NUEVO']],
      fila[idxViejo['RESULTADO']],
      '',
      fila[idxViejo['DETALLE_ERROR']],
      esReal ? 'NO' : 'S\u00cd',
      ''
    ];
  });

  hoja.clear();
  hoja.getRange(1, 1, 1, nuevosEncabezados.length).setValues([nuevosEncabezados]);
  if (filasNuevas.length > 0) {
    hoja.getRange(2, 1, filasNuevas.length, nuevosEncabezados.length).setValues(filasNuevas);
  }

  var totalPrueba = filasNuevas.filter(function (f) { return f[13] === 'S\u00cd'; }).length;
  var totalReal = filasNuevas.length - totalPrueba;
  Logger.log('Migracion completada: ' + filasNuevas.length + ' filas totales, ' + totalReal + ' reales, ' + totalPrueba + ' de prueba.');
}
