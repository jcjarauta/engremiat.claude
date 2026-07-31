/**
 * Instalador de los campos de criterios de aceptación / Definition of Done
 * (Fase L1.3 del backlog consolidado).
 *
 * Añade, si faltan, las columnas OBJETIVO, RESULTADO_ESPERADO,
 * CRITERIOS_ACEPTACION, DEFINITION_OF_DONE y VALIDADOR_ID al final de las
 * hojas de PROYECTO, PRODUCTO, PROCESO, TAREA y DECISION. Solo añade
 * columnas nuevas — nunca modifica ni reordena las columnas existentes,
 * así que las filas ya presentes quedan intactas (los campos nuevos
 * simplemente quedan vacíos hasta que se editen). Idempotente: si una
 * hoja ya tiene alguna de las columnas, no la duplica. Debe ejecutarse
 * una única vez, manualmente, desde el editor de Apps Script.
 */
function instalarCriteriosAceptacion() {
  var packageName = 'INSTALAR_CRITERIOS_ACEPTACION';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var camposNuevos = [
    'OBJETIVO',
    'RESULTADO_ESPERADO',
    'CRITERIOS_ACEPTACION',
    'DEFINITION_OF_DONE',
    'VALIDADOR_ID'
  ];

  var entidadesObjetivo = [
    'PROYECTO',
    'PRODUCTO',
    'PROCESO',
    'TAREA',
    'DECISION'
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    entidadesObjetivo.forEach(function (clave) {
      var entidad = ENTIDADES_MVP[clave];

      if (!entidad) {
        throw new Error(
          'INSTALAR_CRITERIOS_ACEPTACION_ERROR: entidad no configurada en ENTIDADES_MVP: ' +
            clave
        );
      }

      var hoja = ss.getSheetByName(entidad.hoja);

      if (!hoja) {
        throw new Error(
          'INSTALAR_CRITERIOS_ACEPTACION_ERROR: no existe la hoja ' +
            entidad.hoja
        );
      }

      var ultimaColumna = hoja.getLastColumn();

      var cabeceras = hoja
        .getRange(1, 1, 1, ultimaColumna)
        .getDisplayValues()[0]
        .map(function (v) { return String(v || '').trim(); });

      var faltantes = camposNuevos.filter(function (c) {
        return cabeceras.indexOf(c) === -1;
      });

      if (faltantes.length === 0) {
        console.log('OK ' + clave + '_ya_tiene_todos_los_campos=true');
        return;
      }

      hoja
        .getRange(1, ultimaColumna + 1, 1, faltantes.length)
        .setValues([faltantes]);

      console.log(
        'OK ' + clave + '_columnas_anadidas=' + faltantes.join(',')
      );
    });
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
