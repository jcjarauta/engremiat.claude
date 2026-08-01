/**
 * Instalador del campo METODO_CALCULO_AVANCE (Fase L3.6 del backlog
 * consolidado — avance derivado vs. manual).
 *
 * Crea el catálogo CFG_METODO_CALCULO_AVANCE (reutilizando
 * crearCatalogoNuevoL3_ de InstaladorVinculo.js) y añade, si falta, la
 * columna METODO_CALCULO_AVANCE al final de PROCESO y TAREA (reutilizando
 * agregarColumnasSiFaltan_ de InstaladorModoUso.js). Idempotente. Debe
 * ejecutarse una única vez, manualmente.
 */
function instalarMetodoCalculoAvance() {
  var packageName = 'INSTALAR_METODO_CALCULO_AVANCE';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var metodos = [
    ['MANUAL', 'Manual'],
    ['POR_TAREAS', 'Por tareas'],
    ['POR_ESTADO', 'Por estado']
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error(
        'INSTALAR_METODO_CALCULO_AVANCE_ERROR: no existe la hoja 90_CONFIGURACION'
      );
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'METODO_CALCULO_AVANCE', metodos);

    agregarColumnasSiFaltan_(ss, 'PROCESO', ['METODO_CALCULO_AVANCE']);
    agregarColumnasSiFaltan_(ss, 'TAREA', ['METODO_CALCULO_AVANCE']);
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
