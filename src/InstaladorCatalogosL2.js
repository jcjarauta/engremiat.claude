/**
 * Instalador de catálogos ampliados (Fase L2 del backlog consolidado).
 *
 * Amplía TIPO_INCIDENCIA (F-058) y TIPO_DOCUMENTO (F-071) con valores más
 * precisos, insertados justo antes de la opción "Otra"/"Otro" de cada
 * categoría (que se conserva como última opción). A diferencia de
 * InstaladorRelacion.js, aquí las filas nuevas se insertan EN MEDIO del
 * bloque existente de 90_CONFIGURACION (con insertRowsBefore, que Google
 * Sheets desplaza automáticamente junto con cualquier referencia/named
 * range posterior), porque el named range CFG_TIPO_INCIDENCIA/
 * CFG_TIPO_DOCUMENTO ya existe y debe seguir siendo un bloque contiguo
 * que incluya los valores nuevos. Idempotente: si un valor ya existe, no
 * se duplica. Debe ejecutarse una única vez, manualmente.
 */
function instalarCatalogosAmpliadosL2() {
  var packageName = 'INSTALAR_CATALOGOS_AMPLIADOS_L2';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error(
        'INSTALAR_CATALOGOS_AMPLIADOS_L2_ERROR: no existe la hoja 90_CONFIGURACION'
      );
    }

    ampliarCatalogoL2_(ss, hojaConfig, 'TIPO_INCIDENCIA', 'OTRA', [
      ['FUNCIONAL', 'Funcional'],
      ['USABILIDAD', 'Usabilidad'],
      ['DATOS', 'Datos'],
      ['INTEGRACION', 'Integración'],
      ['RENDIMIENTO', 'Rendimiento'],
      ['TRAZABILIDAD', 'Trazabilidad'],
      ['AUTOMATIZACION', 'Automatización']
    ]);

    ampliarCatalogoL2_(ss, hojaConfig, 'TIPO_DOCUMENTO', 'OTRO', [
      ['PLAN', 'Plan'],
      ['ESPECIFICACION', 'Especificación'],
      ['REQUISITOS', 'Requisitos'],
      ['TUTORIAL', 'Tutorial'],
      ['CHECKLIST', 'Checklist'],
      ['MEMORIA', 'Memoria'],
      ['EVIDENCIA', 'Evidencia'],
      ['PRUEBA', 'Prueba'],
      ['REFERENCIA', 'Referencia'],
      ['DECISION', 'Decisión']
    ]);
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}

/**
 * Añade a una categoría de 90_CONFIGURACION los pares [CLAVE, VALOR] que
 * falten, insertados justo antes de la fila cuya CLAVE es
 * `claveInsertarAntesDe` (típicamente "OTRA"/"OTRO"), y actualiza el
 * named range CFG_<categoria> para que siga cubriendo todo el bloque.
 */
function ampliarCatalogoL2_(ss, hojaConfig, categoria, claveInsertarAntesDe, nuevosPares) {
  var ultimaFilaConfig = hojaConfig.getLastRow();

  var datosConfig = ultimaFilaConfig > 1
    ? hojaConfig.getRange(2, 1, ultimaFilaConfig - 1, 4).getDisplayValues()
    : [];

  var filasCategoria = [];
  var clavesExistentes_ = {};
  var maxNumero = 0;
  var filaAntesDe = null;

  datosConfig.forEach(function (fila, indice) {
    var id = String(fila[0] || '').trim();
    var cat = String(fila[1] || '').trim();
    var clave = String(fila[2] || '').trim();
    var filaReal = indice + 2;

    var coincidencia = /^CFG-(\d+)$/.exec(id);

    if (coincidencia) {
      maxNumero = Math.max(maxNumero, parseInt(coincidencia[1], 10));
    }

    if (cat === categoria) {
      filasCategoria.push(filaReal);
      clavesExistentes_[clave] = true;

      if (clave === claveInsertarAntesDe) {
        filaAntesDe = filaReal;
      }
    }
  });

  if (filasCategoria.length === 0) {
    throw new Error(
      'AMPLIAR_CATALOGO_L2_ERROR: no existe ninguna fila con CATEGORIA=' + categoria
    );
  }

  var filaMinOriginal = Math.min.apply(null, filasCategoria);
  var filaMaxOriginal = Math.max.apply(null, filasCategoria);

  if ((filaMaxOriginal - filaMinOriginal + 1) !== filasCategoria.length) {
    throw new Error(
      'AMPLIAR_CATALOGO_L2_ERROR: las filas de ' + categoria + ' no son contiguas'
    );
  }

  // claveInsertarAntesDe = null significa "añadir al final del bloque"
  // (categorías sin opción "Otra"/"Otro" que preservar al final).
  if (claveInsertarAntesDe && !filaAntesDe) {
    throw new Error(
      'AMPLIAR_CATALOGO_L2_ERROR: no se encontró la clave ' +
        claveInsertarAntesDe +
        ' dentro de ' +
        categoria
    );
  }

  var filaInsercion = claveInsertarAntesDe ? filaAntesDe : (filaMaxOriginal + 1);

  var pendientes = nuevosPares.filter(function (par) {
    return !clavesExistentes_[par[0]];
  });

  if (pendientes.length === 0) {
    console.log('OK ' + categoria + '_ya_completo=true');
    return;
  }

  hojaConfig.insertRowsBefore(filaInsercion, pendientes.length);

  var filasNuevas = pendientes.map(function (par) {
    maxNumero += 1;

    return [
      'CFG-' + String(maxNumero).padStart(4, '0'),
      categoria,
      par[0],
      par[1]
    ];
  });

  hojaConfig
    .getRange(filaInsercion, 1, filasNuevas.length, 4)
    .setValues(filasNuevas);

  console.log(
    'OK ' + categoria + '_filas_anadidas=' + pendientes.map(function (p) { return p[0]; }).join(',')
  );

  var nombreRango = 'CFG_' + categoria;
  var filaMaxNueva = filaMaxOriginal + pendientes.length;

  ss.getNamedRanges().forEach(function (nr) {
    if (nr.getName() === nombreRango) {
      nr.remove();
    }
  });

  ss.setNamedRange(
    nombreRango,
    hojaConfig.getRange(filaMinOriginal, 4, filaMaxNueva - filaMinOriginal + 1, 1)
  );

  console.log(
    'OK named_range_' + nombreRango + '=' + filaMinOriginal + ':' + filaMaxNueva
  );
}
