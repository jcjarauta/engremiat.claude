/**
 * Instalador de la entidad MOVIMIENTO_MATERIAL (Fase L3.3 del backlog
 * consolidado — libro de movimientos, precondición para la Fase L5/RECURSO).
 *
 * Crea la hoja 19_MOVIMIENTO_MATERIAL con su cabecera si no existe, y el
 * catálogo TIPO_MOVIMIENTO (reutilizando crearCatalogoNuevoL3_ de
 * InstaladorVinculo.js). Puramente aditivo: no modifica MATERIAL ni su
 * STOCK_ACTUAL. Idempotente. Debe ejecutarse una única vez, manualmente.
 */
function instalarEntidadMovimientoMaterial() {
  var packageName = 'INSTALAR_ENTIDAD_MOVIMIENTO_MATERIAL';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var cabeceras = [
    'ID',
    'MATERIAL_ID',
    'TAREA_ID',
    'TIPO_MOVIMIENTO',
    'CANTIDAD',
    'UNIDAD',
    'FECHA_MOVIMIENTO',
    'RESPONSABLE_ID',
    'FECHA_CREACION',
    'CREADO_POR',
    'FECHA_MODIFICACION',
    'MODIFICADO_POR',
    'ACTIVO',
    'OBSERVACIONES'
  ];

  var tiposMovimiento = [
    ['ENTRADA', 'Entrada'],
    ['RESERVA', 'Reserva'],
    ['LIBERACION_RESERVA', 'Liberación de reserva'],
    ['SALIDA', 'Salida'],
    ['CONSUMO', 'Consumo'],
    ['MERMA', 'Merma'],
    ['DEVOLUCION', 'Devolución'],
    ['TRASLADO', 'Traslado'],
    ['AJUSTE_POSITIVO', 'Ajuste positivo'],
    ['AJUSTE_NEGATIVO', 'Ajuste negativo']
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var nombreHoja = ENTIDADES_MVP.MOVIMIENTO_MATERIAL.hoja;
    var hoja = ss.getSheetByName(nombreHoja);

    if (!hoja) {
      hoja = ss.insertSheet(nombreHoja);
      hoja.getRange(1, 1, 1, cabeceras.length).setValues([cabeceras]);
      hoja.setFrozenRows(1);

      console.log('OK hoja_creada=' + nombreHoja + ' columnas=' + cabeceras.length);
    } else {
      var ultimaColumna = hoja.getLastColumn();

      var cabecerasActuales = ultimaColumna > 0
        ? hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function (v) {
            return String(v || '').trim();
          })
        : [];

      var faltantes = cabeceras.filter(function (c) {
        return cabecerasActuales.indexOf(c) === -1;
      });

      if (faltantes.length > 0) {
        throw new Error(
          'INSTALAR_ENTIDAD_MOVIMIENTO_MATERIAL_ERROR: la hoja ' +
            nombreHoja +
            ' ya existe pero le faltan columnas: ' +
            faltantes.join(', ')
        );
      }

      console.log('OK hoja_ya_existente_y_valida=' + nombreHoja);
    }

    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error(
        'INSTALAR_ENTIDAD_MOVIMIENTO_MATERIAL_ERROR: no existe la hoja 90_CONFIGURACION'
      );
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'TIPO_MOVIMIENTO', tiposMovimiento);
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
