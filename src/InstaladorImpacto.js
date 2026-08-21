/**
 * Fase N6.1 (ver conversación -- eje "Por qué"): etiquetas de impacto
 * social/ecológico/económico sobre Campaña/Proyecto/Producto, mismo
 * patrón polimórfico ya establecido (DOCUMENTO/ASIGNACION/VINCULO) y
 * mismo catálogo de nivel que el eje económico (CFG_ENTIDAD_PRESUPUESTO
 * -- Campaña/Proyecto/Producto, ya existe, no se crea uno nuevo).
 * Descriptivas, sin regla de integridad nueva (mismo criterio que
 * L1.3 -- campos de calidad de datos, no invariantes objetivas).
 * Idempotente. Debe ejecutarse una única vez, manualmente.
 */
function instalarEntidadEtiquetaImpacto() {
  var packageName = 'INSTALAR_ENTIDAD_ETIQUETA_IMPACTO';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var categoriasImpacto = [
    ['SOCIAL', 'Social'],
    ['ECOLOGICO', 'Ecológico'],
    ['ECONOMICO', 'Económico']
  ];

  var cabecerasEtiquetaImpacto = [
    'ID', 'ENTIDAD_TIPO', 'ENTIDAD_ID', 'CATEGORIA_IMPACTO', 'DESCRIPCION',
    'FECHA_CREACION', 'CREADO_POR', 'FECHA_MODIFICACION', 'MODIFICADO_POR', 'ACTIVO', 'OBSERVACIONES'
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');
    if (!hojaConfig) {
      throw new Error('INSTALAR_ENTIDAD_ETIQUETA_IMPACTO_ERROR: no existe la hoja 90_CONFIGURACION');
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'CATEGORIA_IMPACTO', categoriasImpacto);

    var hojaEtiqueta = ss.getSheetByName(ENTIDADES_MVP.ETIQUETA_IMPACTO.hoja);
    if (!hojaEtiqueta) {
      hojaEtiqueta = ss.insertSheet(ENTIDADES_MVP.ETIQUETA_IMPACTO.hoja);
      hojaEtiqueta.getRange(1, 1, 1, cabecerasEtiquetaImpacto.length).setValues([cabecerasEtiquetaImpacto]);
      hojaEtiqueta.setFrozenRows(1);
      console.log('OK hoja_creada=' + ENTIDADES_MVP.ETIQUETA_IMPACTO.hoja + ' columnas=' + cabecerasEtiquetaImpacto.length);
    } else {
      var ultimaColumna = hojaEtiqueta.getLastColumn();
      var cabecerasActuales = ultimaColumna > 0
        ? hojaEtiqueta.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function (v) { return String(v || '').trim(); })
        : [];
      var faltantes = cabecerasEtiquetaImpacto.filter(function (c) { return cabecerasActuales.indexOf(c) === -1; });
      if (faltantes.length > 0) {
        hojaEtiqueta.getRange(1, ultimaColumna + 1, 1, faltantes.length).setValues([faltantes]);
        console.log('OK columnas_anadidas=' + faltantes.join(','));
      } else {
        console.log('OK hoja_ya_existente_y_valida=' + ENTIDADES_MVP.ETIQUETA_IMPACTO.hoja);
      }
    }
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}

/*
 * INC-0023: sin esta entrada de menú, "Nueva etiqueta de impacto" crashea
 * sin salida si este instalador nunca corrió (hoja ENTIDAD_ETIQUETA_IMPACTO
 * o catálogo CATEGORIA_IMPACTO ausentes) -- mismo patrón que
 * abrirInstalarCatalogoComprasL4 (confirmación + try/catch con mensaje).
 */
function abrirInstalarEntidadEtiquetaImpacto() {
  var ui = SpreadsheetApp.getUi();

  var resp = ui.alert(
    'Instalar catálogo de Impacto',
    'Esto crea (si falta) la hoja de etiquetas de impacto y el catálogo CATEGORIA_IMPACTO ' +
    'en 90_CONFIGURACION. Idempotente -- no duplica nada ya presente. ¿Continuar?',
    ui.ButtonSet.YES_NO
  );

  if (resp !== ui.Button.YES) return;

  try {
    instalarEntidadEtiquetaImpacto();
    ui.alert('Catálogo de Impacto instalado', 'Ya puedes crear etiquetas de impacto.', ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('Error', err.message, ui.ButtonSet.OK);
  }
}
