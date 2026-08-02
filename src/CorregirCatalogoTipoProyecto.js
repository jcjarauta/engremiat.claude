/**
 * Correccion de un bug real introducido en InstaladorMejorasAuditoriaPiloto.js:
 * se uso crearCatalogoNuevoL3_ (pensado para categorias nuevas desde cero)
 * para AMPLIAR TIPO_PROYECTO, que ya tenia 3 filas (Urgente/Importante/
 * Propuesta). Eso añadio las 6 filas nuevas al final de toda la hoja
 * 90_CONFIGURACION, no junto al bloque original, y el named range
 * CFG_TIPO_PROYECTO quedo abarcando (min a max fila) todo lo que hay
 * entre medias -- mezclando valores de otros catalogos en el desplegable.
 *
 * Esta funcion mueve las filas nuevas para que queden contiguas con las
 * originales, y reconstruye el named range correctamente. Idempotente
 * (si ya estan contiguas, no hace nada). Debe ejecutarse una unica vez,
 * manualmente.
 */
function corregirCatalogoTipoProyecto() {
  var packageName = 'CORREGIR_CATALOGO_TIPO_PROYECTO';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActive();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error('CORREGIR_CATALOGO_TIPO_PROYECTO_ERROR: no existe 90_CONFIGURACION');
    }

    ss.getNamedRanges().forEach(function (nr) {
      if (nr.getName() === 'CFG_TIPO_PROYECTO') nr.remove();
    });

    /*
     * Funcion auxiliar: relee la hoja (solo A:D) y devuelve, ordenadas
     * por fila, todas las filas TIPO_PROYECTO. Se llama varias veces
     * para no arrastrar indices de fila obsoletos tras cada operacion
     * que desplaza filas (insertar/eliminar).
     */
    function leerFilasTipoProyecto_() {
      var ultimaFila = hojaConfig.getLastRow();
      var datosAD = hojaConfig.getRange(1, 1, ultimaFila, 4).getValues();
      var filas = [];

      for (var idx = 1; idx < datosAD.length; idx++) {
        if (String(datosAD[idx][1]).trim() === 'TIPO_PROYECTO') {
          filas.push({ fila: idx + 1, valores: datosAD[idx] });
        }
      }

      filas.sort(function (a, b) { return a.fila - b.fila; });
      return filas;
    }

    var filasTipoProyecto = leerFilasTipoProyecto_();

    if (filasTipoProyecto.length === 0) {
      throw new Error('CORREGIR_CATALOGO_TIPO_PROYECTO_ERROR: no hay ninguna fila TIPO_PROYECTO');
    }

    var bloqueOriginal = [filasTipoProyecto[0]];

    for (var j = 1; j < filasTipoProyecto.length; j++) {
      if (filasTipoProyecto[j].fila === bloqueOriginal[bloqueOriginal.length - 1].fila + 1) {
        bloqueOriginal.push(filasTipoProyecto[j]);
      } else {
        break;
      }
    }

    /*
     * Limpieza de un intento anterior fallido (bug de columnas, ya
     * corregido): pudo dejar filas totalmente vacías justo despues del
     * bloque original. Se eliminan antes de insertar las nuevas, y se
     * relee todo despues para no arrastrar indices de fila obsoletos.
     */
    var filaTrasBloqueOriginal = bloqueOriginal[bloqueOriginal.length - 1].fila + 1;
    var blancosEliminados = 0;

    while (
      filaTrasBloqueOriginal <= hojaConfig.getLastRow() &&
      hojaConfig.getRange(filaTrasBloqueOriginal, 1, 1, 4).getValues()[0].every(function (v) { return String(v).trim() === ''; })
    ) {
      hojaConfig.deleteRow(filaTrasBloqueOriginal);
      blancosEliminados++;
    }

    if (blancosEliminados > 0) {
      console.log('OK filas_en_blanco_eliminadas=' + blancosEliminados);
      filasTipoProyecto = leerFilasTipoProyecto_();
      bloqueOriginal = [filasTipoProyecto[0]];
      for (var j2 = 1; j2 < filasTipoProyecto.length; j2++) {
        if (filasTipoProyecto[j2].fila === bloqueOriginal[bloqueOriginal.length - 1].fila + 1) {
          bloqueOriginal.push(filasTipoProyecto[j2]);
        } else {
          break;
        }
      }
    }

    var filasSueltas = filasTipoProyecto.slice(bloqueOriginal.length);

    if (filasSueltas.length === 0) {
      console.log('OK ya_estaba_contiguo=true');
    } else {
      var filaInsercionDespuesDe = bloqueOriginal[bloqueOriginal.length - 1].fila;

      hojaConfig.insertRowsAfter(filaInsercionDespuesDe, filasSueltas.length);

      filasSueltas.forEach(function (item, indice) {
        var filaDestino = filaInsercionDespuesDe + 1 + indice;
        hojaConfig.getRange(filaDestino, 1, 1, 4).setValues([item.valores.slice(0, 4)]);
      });

      var offset = filasSueltas.length;
      var filasABorrar = filasSueltas
        .map(function (item) { return item.fila + offset; })
        .sort(function (a, b) { return b - a; });

      filasABorrar.forEach(function (fila) {
        hojaConfig.deleteRow(fila);
      });

      console.log('OK filas_reubicadas=' + filasSueltas.length);
    }

    var datosActualizados = hojaConfig.getDataRange().getValues();
    var filasFinal = [];

    for (var k = 1; k < datosActualizados.length; k++) {
      if (String(datosActualizados[k][1]).trim() === 'TIPO_PROYECTO') filasFinal.push(k + 1);
    }

    var filaMin = Math.min.apply(null, filasFinal);
    var filaMax = Math.max.apply(null, filasFinal);

    if ((filaMax - filaMin + 1) !== filasFinal.length) {
      throw new Error('CORREGIR_CATALOGO_TIPO_PROYECTO_ERROR: las filas siguen sin ser contiguas tras la corrección');
    }

    ss.setNamedRange('CFG_TIPO_PROYECTO', hojaConfig.getRange(filaMin, 4, filaMax - filaMin + 1, 1));

    console.log('OK named_range_CFG_TIPO_PROYECTO=' + filaMin + ':' + filaMax + ' filas=' + filasFinal.length);
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
