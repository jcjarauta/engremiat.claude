/**
 * Instalador de la entidad EJECUCION_TAREA (Fase L3.4 del backlog
 * consolidado — definición vs. ejecución).
 *
 * Crea la hoja 20_EJECUCION_TAREA con su cabecera si no existe, y el
 * catálogo RESULTADO_EJECUCION (reutilizando crearCatalogoNuevoL3_ de
 * InstaladorVinculo.js). No modifica TAREA ni TAREA_MATERIAL. Idempotente.
 * Debe ejecutarse una única vez, manualmente.
 */
function instalarEntidadEjecucionTarea() {
  var packageName = 'INSTALAR_ENTIDAD_EJECUCION_TAREA';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var cabeceras = [
    'ID',
    'TAREA_ID',
    'RESPONSABLE_ID',
    'FECHA_INICIO',
    'FECHA_FIN',
    'DURACION_REAL_DIAS',
    'ESTADO',
    'RESULTADO',
    'FECHA_CREACION',
    'CREADO_POR',
    'FECHA_MODIFICACION',
    'MODIFICADO_POR',
    'ACTIVO',
    'OBSERVACIONES'
  ];

  var resultadosEjecucion = [
    ['EXITOSA', 'Exitosa'],
    ['CON_INCIDENCIAS', 'Con incidencias'],
    ['FALLIDA', 'Fallida']
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var nombreHoja = ENTIDADES_MVP.EJECUCION_TAREA.hoja;
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
          'INSTALAR_ENTIDAD_EJECUCION_TAREA_ERROR: la hoja ' +
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
        'INSTALAR_ENTIDAD_EJECUCION_TAREA_ERROR: no existe la hoja 90_CONFIGURACION'
      );
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'RESULTADO_EJECUCION', resultadosEjecucion);
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
