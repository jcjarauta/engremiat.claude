/**
 * Instalador de la entidad ASIGNACION (Fase L1.1 del backlog consolidado).
 *
 * Crea la hoja 16_ASIGNACION con su cabecera si no existe todavia. Idempotente:
 * si la hoja ya existe, solo verifica que tenga las columnas necesarias y no
 * la modifica. Debe ejecutarse una unica vez, manualmente, desde el editor de
 * Apps Script antes de usar el formulario "Nueva asignacion" o las reglas de
 * integridad FUNC-ASG-*.
 */
function instalarEntidadAsignacion() {
  var packageName = 'INSTALAR_ENTIDAD_ASIGNACION';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var cabeceras = [
    'ID',
    'ENTIDAD_TIPO',
    'ENTIDAD_ID',
    'PERSONA_EQUIPO_ID',
    'ROL_ASIGNADO',
    'FECHA_INICIO_ASIGNACION',
    'FECHA_FIN_ASIGNACION',
    'PORCENTAJE_DEDICACION',
    'ESTADO',
    'FECHA_CREACION',
    'CREADO_POR',
    'FECHA_MODIFICACION',
    'MODIFICADO_POR',
    'ACTIVO',
    'OBSERVACIONES'
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var nombreHoja = ENTIDADES_MVP.ASIGNACION.hoja;
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
          'INSTALAR_ENTIDAD_ASIGNACION_ERROR: la hoja ' +
            nombreHoja +
            ' ya existe pero le faltan columnas: ' +
            faltantes.join(', ')
        );
      }

      console.log('OK hoja_ya_existente_y_valida=' + nombreHoja);
    }
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
