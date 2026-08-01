/**
 * Instalador de la entidad PROVEEDOR_MATERIAL (Fase L4, F-093 -- alcance
 * minimo confirmado: PROVEEDOR_ID, MATERIAL_ID, PRECIO_UNITARIO,
 * PLAZO_ENTREGA_DIAS, ES_PREFERENTE, ESTADO, OBSERVACIONES).
 *
 * Misma familia que PRODUCTO_MATERIAL/TAREA_MATERIAL: relacion N:M que
 * permite varios proveedores por material (y varios materiales por
 * proveedor), con precio y plazo propios de esa combinacion. Reutiliza
 * el catalogo CFG_ESTADO_RELACION ya existente (mismo que PRODUCTO_
 * MATERIAL/TAREA_MATERIAL) -- no crea ningun catalogo nuevo. ES_PREFERENTE
 * usa opciones en linea (SI/NO) del propio esquema de formulario, sin
 * necesidad de un catalogo dedicado.
 *
 * MATERIAL.PROVEEDOR_ID actual se mantiene sin cambios (proveedor
 * "principal" implicito); PROVEEDOR_MATERIAL es la fuente para
 * alternativas, precios y plazos por combinacion. No se modifica MATERIAL.
 *
 * Crea la hoja 21_PROVEEDOR_MATERIAL con su cabecera si no existe.
 * Idempotente. Debe ejecutarse una unica vez, manualmente.
 */
function instalarEntidadProveedorMaterial() {
  var packageName = 'INSTALAR_ENTIDAD_PROVEEDOR_MATERIAL';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var cabeceras = [
    'ID',
    'PROVEEDOR_ID',
    'MATERIAL_ID',
    'PRECIO_UNITARIO',
    'PLAZO_ENTREGA_DIAS',
    'ES_PREFERENTE',
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
    var nombreHoja = ENTIDADES_MVP.PROVEEDOR_MATERIAL.hoja;
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
          'INSTALAR_ENTIDAD_PROVEEDOR_MATERIAL_ERROR: la hoja ' +
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
