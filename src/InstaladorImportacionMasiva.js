/**
 * Fase L5.3 -- Importacion masiva de campana completa, alcance V1
 * minimo confirmado: solo los campos realmente obligatorios de cada
 * nivel (CAMPOS_OBLIGATORIOS_MVP + los pocos campos que el formulario
 * exige ademas, como CANTIDAD_PREVISTA en PRODUCTO) mas el enlace
 * jerarquico via IDs temporales. Nada de los campos opcionales de
 * criterios/OKR anadidos en L1-L3 -- esos se rellenan despues editando
 * el registro ya creado si hace falta.
 *
 * 5 hojas de staging, una por nivel (CAMPANA->PROYECTO->PRODUCTO->
 * PROCESO->TAREA). Cada fila tiene ID_TEMPORAL (referencia local dentro
 * del lote) y, salvo CAMPANA, una columna que apunta al ID_TEMPORAL de
 * su padre (o directamente a un ID real ya existente, para poder
 * ampliar una campana ya creada). ESTADO_IMPORTACION/ID_REAL son
 * columnas de control que rellena el propio proceso de importacion
 * (ver ImportacionMasiva.js) -- no las rellena el usuario.
 *
 * Idempotente. Debe ejecutarse una unica vez, manualmente.
 */
function instalarStagingImportacionMasiva() {
  var packageName = 'INSTALAR_STAGING_IMPORTACION_MASIVA';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var definiciones = [
    {
      hoja: 'STG_CAMPANA',
      cabeceras: ['ID_TEMPORAL', 'NOMBRE', 'FECHA_INICIO_PLAN', 'FECHA_FIN_PLAN', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    {
      hoja: 'STG_PROYECTO',
      cabeceras: ['ID_TEMPORAL', 'CAMPANA_TEMPORAL', 'NOMBRE', 'TIPO_PROYECTO', 'PRIORIDAD', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    {
      hoja: 'STG_PRODUCTO',
      cabeceras: ['ID_TEMPORAL', 'PROYECTO_TEMPORAL', 'CODIGO', 'NOMBRE', 'ORIGEN', 'UNIDAD', 'CANTIDAD_PREVISTA', 'PRIORIDAD', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL', 'PROYECTO_PRODUCTO_ID_REAL']
    },
    {
      hoja: 'STG_PROCESO',
      cabeceras: ['ID_TEMPORAL', 'PRODUCTO_TEMPORAL', 'NOMBRE', 'DURACION_PREVISTA_DIAS', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    {
      hoja: 'STG_TAREA',
      cabeceras: ['ID_TEMPORAL', 'PROCESO_TEMPORAL', 'NOMBRE', 'DURACION_PREVISTA_DIAS', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    }
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    definiciones.forEach(function (definicion) {
      var hoja = ss.getSheetByName(definicion.hoja);

      if (!hoja) {
        hoja = ss.insertSheet(definicion.hoja);
        hoja.getRange(1, 1, 1, definicion.cabeceras.length).setValues([definicion.cabeceras]);
        hoja.setFrozenRows(1);

        console.log('OK hoja_creada=' + definicion.hoja + ' columnas=' + definicion.cabeceras.length);
      } else {
        var ultimaColumna = hoja.getLastColumn();

        var cabecerasActuales = ultimaColumna > 0
          ? hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function (v) {
              return String(v || '').trim();
            })
          : [];

        var faltantes = definicion.cabeceras.filter(function (c) {
          return cabecerasActuales.indexOf(c) === -1;
        });

        if (faltantes.length > 0) {
          throw new Error(
            'INSTALAR_STAGING_IMPORTACION_MASIVA_ERROR: la hoja ' +
              definicion.hoja +
              ' ya existe pero le faltan columnas: ' +
              faltantes.join(', ')
          );
        }

        console.log('OK hoja_ya_existente_y_valida=' + definicion.hoja);
      }
    });
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
