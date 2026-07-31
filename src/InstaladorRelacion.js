/**
 * Instalador de la entidad RELACION (Fase L1.2 del backlog consolidado).
 *
 * Crea la hoja 17_RELACION con su cabecera si no existe, y añade a
 * 90_CONFIGURACION las filas del catálogo TIPO_RELACION que falten.
 * Idempotente: si la hoja o las filas ya existen, no las duplica ni las
 * modifica. Debe ejecutarse una única vez, manualmente, desde el editor
 * de Apps Script antes de usar el formulario "Nueva relación / dependencia"
 * o la regla de integridad FUNC-GRF-001.
 */
function instalarEntidadRelacion() {
  var packageName = 'INSTALAR_ENTIDAD_RELACION';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var cabeceras = [
    'ID',
    'ENTIDAD_TIPO',
    'ENTIDAD_ORIGEN_ID',
    'ENTIDAD_DESTINO_ID',
    'TIPO_RELACION',
    'DESFASE_DIAS',
    'ESTADO',
    'FECHA_CREACION',
    'CREADO_POR',
    'FECHA_MODIFICACION',
    'MODIFICADO_POR',
    'ACTIVO',
    'OBSERVACIONES'
  ];

  var tiposRelacion = [
    ['DEPENDE_DE', 'Depende de'],
    ['BLOQUEA', 'Bloquea'],
    ['REQUIERE', 'Requiere'],
    ['DUPLICA', 'Duplica'],
    ['COMPLEMENTA', 'Complementa'],
    ['SUSTITUYE', 'Sustituye'],
    ['COMPARTE_RECURSOS', 'Comparte recursos'],
    ['FIN_A_INICIO', 'Fin a inicio'],
    ['INICIO_A_INICIO', 'Inicio a inicio'],
    ['FIN_A_FIN', 'Fin a fin']
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var nombreHoja = ENTIDADES_MVP.RELACION.hoja;
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
          'INSTALAR_ENTIDAD_RELACION_ERROR: la hoja ' +
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
        'INSTALAR_ENTIDAD_RELACION_ERROR: no existe la hoja 90_CONFIGURACION'
      );
    }

    var ultimaFilaConfig = hojaConfig.getLastRow();

    var datosConfig = ultimaFilaConfig > 1
      ? hojaConfig.getRange(2, 1, ultimaFilaConfig - 1, 4).getDisplayValues()
      : [];

    var clavesExistentes_ = {};
    var filasExistentesTipoRelacion = [];
    var maxNumero = 0;

    datosConfig.forEach(function (fila, indice) {
      var id = String(fila[0] || '').trim();
      var categoria = String(fila[1] || '').trim();
      var clave = String(fila[2] || '').trim();

      var coincidencia = /^CFG-(\d+)$/.exec(id);

      if (coincidencia) {
        maxNumero = Math.max(maxNumero, parseInt(coincidencia[1], 10));
      }

      if (categoria === 'TIPO_RELACION') {
        clavesExistentes_[clave] = true;
        filasExistentesTipoRelacion.push(indice + 2); // fila real en la hoja
      }
    });

    var filasNuevas = [];

    tiposRelacion.forEach(function (par) {
      if (!clavesExistentes_[par[0]]) {
        maxNumero += 1;

        filasNuevas.push([
          'CFG-' + String(maxNumero).padStart(4, '0'),
          'TIPO_RELACION',
          par[0],
          par[1]
        ]);
      }
    });

    var filaInicioNuevas = hojaConfig.getLastRow() + 1;

    if (filasNuevas.length > 0) {
      hojaConfig
        .getRange(filaInicioNuevas, 1, filasNuevas.length, 4)
        .setValues(filasNuevas);

      console.log('OK catalogo_tipo_relacion_filas_creadas=' + filasNuevas.length);
    } else {
      console.log('OK catalogo_tipo_relacion_ya_completo=true');
    }

    // El desplegable "catalogo" del formulario resuelve CFG_TIPO_RELACION
    // contra un named range (obtenerCatalogo(), ConfigRepository.js), no
    // contra las filas de 90_CONFIGURACION directamente — hay que crearlo
    // aquí o el formulario fallaría al intentar mostrar el desplegable.
    var todasLasFilas = filasExistentesTipoRelacion.concat(
      filasNuevas.length > 0
        ? Array.from(
            {length: filasNuevas.length},
            function (_, i) { return filaInicioNuevas + i; }
          )
        : []
    ).sort(function (a, b) { return a - b; });

    var filaMin = todasLasFilas[0];
    var filaMax = todasLasFilas[todasLasFilas.length - 1];
    var esContiguo = (filaMax - filaMin + 1) === todasLasFilas.length;

    if (!esContiguo) {
      throw new Error(
        'INSTALAR_ENTIDAD_RELACION_ERROR: las filas de TIPO_RELACION en 90_CONFIGURACION no son contiguas (' +
          todasLasFilas.join(',') +
          '); crear el named range CFG_TIPO_RELACION manualmente'
      );
    }

    ss.getNamedRanges().forEach(function (nr) {
      if (nr.getName() === 'CFG_TIPO_RELACION') {
        nr.remove();
      }
    });

    ss.setNamedRange(
      'CFG_TIPO_RELACION',
      hojaConfig.getRange(filaMin, 4, filaMax - filaMin + 1, 1)
    );

    console.log(
      'OK named_range_CFG_TIPO_RELACION=' +
        filaMin + ':' + filaMax
    );
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
