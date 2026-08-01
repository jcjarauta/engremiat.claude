/**
 * Instalador de la entidad VINCULO (Fase L3.1 del backlog consolidado).
 *
 * Crea la hoja 18_VINCULO con su cabecera si no existe. Amplía el
 * catálogo compartido CFG_ENTIDAD_DOCUMENTO con el valor "Documento"
 * (hoy solo cubre Campaña/Proyecto/Producto/Proceso/Tarea/Decisión/
 * Incidencia — reutilizando el helper genérico de InstaladorCatalogosL2.js,
 * que también recalcula el named range tras insertar filas). Crea el
 * catálogo nuevo TIPO_VINCULO y su named range. Idempotente. Debe
 * ejecutarse una única vez, manualmente.
 */
function instalarEntidadVinculo() {
  var packageName = 'INSTALAR_ENTIDAD_VINCULO';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var cabeceras = [
    'ID',
    'ENTIDAD_ORIGEN_TIPO',
    'ENTIDAD_ORIGEN_ID',
    'ENTIDAD_DESTINO_TIPO',
    'ENTIDAD_DESTINO_ID',
    'TIPO_VINCULO',
    'ESTADO',
    'FECHA_CREACION',
    'CREADO_POR',
    'FECHA_MODIFICACION',
    'MODIFICADO_POR',
    'ACTIVO',
    'OBSERVACIONES'
  ];

  var tiposVinculo = [
    ['CONTEXTO', 'Contexto'],
    ['EVIDENCIA', 'Evidencia'],
    ['RESULTADO', 'Resultado'],
    ['MANUAL', 'Manual'],
    ['TUTORIAL', 'Tutorial'],
    ['ACTA', 'Acta'],
    ['REFERENCIA', 'Referencia'],
    ['APROBACION', 'Aprobación'],
    ['BLOQUEA', 'Bloquea'],
    ['RELACIONADA', 'Relacionada']
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var nombreHoja = ENTIDADES_MVP.VINCULO.hoja;
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
          'INSTALAR_ENTIDAD_VINCULO_ERROR: la hoja ' +
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
        'INSTALAR_ENTIDAD_VINCULO_ERROR: no existe la hoja 90_CONFIGURACION'
      );
    }

    // Amplía CFG_ENTIDAD_DOCUMENTO con "Documento" (categoría sin opción
    // "Otro" de cierre — se añade al final del bloque, claveInsertarAntesDe=null).
    ampliarCatalogoL2_(ss, hojaConfig, 'ENTIDAD_DOCUMENTO', null, [
      ['DOCUMENTO', 'Documento']
    ]);

    // Crea el catálogo nuevo TIPO_VINCULO (categoría inexistente hasta
    // ahora: ampliarCatalogoL2_ exige que ya existan filas de la
    // categoría, así que aquí se construye igual que hizo
    // InstaladorRelacion.js para TIPO_RELACION).
    crearCatalogoNuevoL3_(ss, hojaConfig, 'TIPO_VINCULO', tiposVinculo);
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}

/**
 * Crea una categoría de catálogo completamente nueva en 90_CONFIGURACION
 * (sin filas previas), añadida al final de la hoja, con su named range.
 * Idempotente: si la categoría ya existe con todas las claves, no hace nada.
 */
function crearCatalogoNuevoL3_(ss, hojaConfig, categoria, pares) {
  var ultimaFilaConfig = hojaConfig.getLastRow();

  var datosConfig = ultimaFilaConfig > 1
    ? hojaConfig.getRange(2, 1, ultimaFilaConfig - 1, 4).getDisplayValues()
    : [];

  var clavesExistentes_ = {};
  var maxNumero = 0;

  datosConfig.forEach(function (fila) {
    var id = String(fila[0] || '').trim();
    var cat = String(fila[1] || '').trim();
    var clave = String(fila[2] || '').trim();

    var coincidencia = /^CFG-(\d+)$/.exec(id);

    if (coincidencia) {
      maxNumero = Math.max(maxNumero, parseInt(coincidencia[1], 10));
    }

    if (cat === categoria) {
      clavesExistentes_[clave] = true;
    }
  });

  var pendientes = pares.filter(function (par) {
    return !clavesExistentes_[par[0]];
  });

  var filaInicio = hojaConfig.getLastRow() + 1;

  if (pendientes.length > 0) {
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
      .getRange(filaInicio, 1, filasNuevas.length, 4)
      .setValues(filasNuevas);

    console.log(
      'OK ' + categoria + '_filas_creadas=' + pendientes.length
    );
  } else {
    console.log('OK ' + categoria + '_ya_completo=true');
  }

  // Recalcula el rango completo de la categoría (por si ya existía
  // parcialmente de una ejecución anterior) para el named range.
  var ultimaFilaConfigActualizada = hojaConfig.getLastRow();

  var datosActualizados = hojaConfig
    .getRange(2, 1, ultimaFilaConfigActualizada - 1, 4)
    .getDisplayValues();

  var filasCategoria = [];

  datosActualizados.forEach(function (fila, indice) {
    if (String(fila[1] || '').trim() === categoria) {
      filasCategoria.push(indice + 2);
    }
  });

  var filaMin = Math.min.apply(null, filasCategoria);
  var filaMax = Math.max.apply(null, filasCategoria);

  var nombreRango = 'CFG_' + categoria;

  ss.getNamedRanges().forEach(function (nr) {
    if (nr.getName() === nombreRango) {
      nr.remove();
    }
  });

  ss.setNamedRange(
    nombreRango,
    hojaConfig.getRange(filaMin, 4, filaMax - filaMin + 1, 1)
  );

  console.log('OK named_range_' + nombreRango + '=' + filaMin + ':' + filaMax);
}
