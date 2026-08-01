/**
 * Amplía CFG_TIPO_VINCULO con los tipos específicos de relación
 * incidencia↔tarea (Fase L4, F-063). No crea ninguna entidad nueva:
 * VINCULO (Fase L3.1) ya soporta genéricamente INCIDENCIA→TAREA, solo
 * le faltaban estos valores de catálogo. El flujo queda: crear la tarea
 * correctora con el formulario "Nueva tarea" (ya con buscador, Fase
 * L3.5) y vincularla con "Nuevo vínculo genérico" (Fase L3.1) eligiendo
 * "Corrige". Reutiliza ampliarCatalogoL2_ (InstaladorCatalogosL2.js).
 * Idempotente. Debe ejecutarse una única vez, manualmente.
 */
function instalarTipoVinculoIncidencia() {
  var packageName = 'INSTALAR_TIPO_VINCULO_INCIDENCIA';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error(
        'INSTALAR_TIPO_VINCULO_INCIDENCIA_ERROR: no existe la hoja 90_CONFIGURACION'
      );
    }

    // TIPO_VINCULO no tiene opcion "Otro" de cierre -> se añade al final
    // del bloque (claveInsertarAntesDe = null), igual que se hizo con
    // CFG_ENTIDAD_DOCUMENTO al instalar VINCULO en L3.1.
    ampliarCatalogoL2_(ss, hojaConfig, 'TIPO_VINCULO', null, [
      ['DETECTADA_EN', 'Detectada en'],
      ['CAUSADA_POR', 'Causada por'],
      ['CORRIGE', 'Corrige'],
      ['VERIFICA', 'Verifica'],
      ['PREVIENE', 'Previene']
    ]);
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
