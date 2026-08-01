/**
 * Instalador del campo MODO_USO (Fase L3.2 del backlog consolidado).
 *
 * Crea el catálogo CFG_MODO_USO (reutilizando crearCatalogoNuevoL3_ de
 * InstaladorVinculo.js) y añade, si faltan, las columnas necesarias al
 * final de PROYECTO_PRODUCTO (MODO_USO) y PROCESO (PROYECTO_PRODUCTO_ID,
 * MODO_USO). Solo añade columnas nuevas, nunca modifica las existentes.
 * Idempotente. Debe ejecutarse una única vez, manualmente.
 */
function instalarModoUso() {
  var packageName = 'INSTALAR_MODO_USO';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var modosUso = [
    ['REFERENCIA_COMPARTIDA', 'Referencia compartida'],
    ['REUTILIZACION_SIN_CAMBIOS', 'Reutilización sin cambios'],
    ['ADAPTACION_ESPECIFICA', 'Adaptación específica'],
    ['CLONACION_COMO_NUEVO', 'Clonación como nuevo']
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error(
        'INSTALAR_MODO_USO_ERROR: no existe la hoja 90_CONFIGURACION'
      );
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'MODO_USO', modosUso);

    agregarColumnasSiFaltan_(ss, 'PROYECTO_PRODUCTO', ['MODO_USO']);
    agregarColumnasSiFaltan_(ss, 'PROCESO', ['PROYECTO_PRODUCTO_ID', 'MODO_USO']);
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}

/**
 * Añade, al final de la hoja de una entidad ya registrada en
 * ENTIDADES_MVP, las columnas de `campos` que aún no existan.
 * Idempotente y reutilizable (mismo patrón que
 * InstaladorCriteriosAceptacion.js, generalizado a una sola entidad
 * por llamada en vez de una lista fija).
 */
function agregarColumnasSiFaltan_(ss, claveEntidad, campos) {
  var entidad = ENTIDADES_MVP[claveEntidad];

  if (!entidad) {
    throw new Error(
      'AGREGAR_COLUMNAS_SI_FALTAN_ERROR: entidad no configurada en ENTIDADES_MVP: ' +
        claveEntidad
    );
  }

  var hoja = ss.getSheetByName(entidad.hoja);

  if (!hoja) {
    throw new Error(
      'AGREGAR_COLUMNAS_SI_FALTAN_ERROR: no existe la hoja ' + entidad.hoja
    );
  }

  var ultimaColumna = hoja.getLastColumn();

  var cabeceras = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0]
    .map(function (v) { return String(v || '').trim(); });

  var faltantes = campos.filter(function (c) {
    return cabeceras.indexOf(c) === -1;
  });

  if (faltantes.length === 0) {
    console.log('OK ' + claveEntidad + '_ya_tiene_todos_los_campos=true');
    return;
  }

  hoja
    .getRange(1, ultimaColumna + 1, 1, faltantes.length)
    .setValues([faltantes]);

  console.log(
    'OK ' + claveEntidad + '_columnas_anadidas=' + faltantes.join(',')
  );
}
