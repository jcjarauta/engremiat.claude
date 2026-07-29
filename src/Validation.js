function validarEstructuraInicial() {
  const esperado = {
    '01_CAMPANAS': 19,
    '02_PROYECTOS': 22,
    '03_PRODUCTOS': 19,
    '04_PROYECTO_PRODUCTO': 13,
    '05_PROCESOS': 21,
    '06_TAREAS': 23,
    '07_TAREA_RESPONSABLE': 14,
    '08_MATERIALES': 19,
    '09_PRODUCTO_MATERIAL': 13,
    '10_TAREA_MATERIAL': 15,
    '11_PERSONAS_EQUIPOS': 13,
    '12_DECISIONES': 17,
    '13_INCIDENCIAS': 26,
    '14_DOCUMENTOS': 16,
    '15_PROVEEDORES': 16,
    '90_CONFIGURACION': 11,
    '91_HISTORIAL': 15
  };

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const errores = [];

  Object.entries(esperado)
    .forEach(function (entrada) {
      const nombre = entrada[0];
      const columnasEsperadas = entrada[1];

      const hoja =
        ss.getSheetByName(nombre);

      if (!hoja) {
        errores.push(
          'Falta la hoja: ' + nombre
        );
        return;
      }

      /*
       * Leer todas las columnas utilizadas de la hoja,
       * no solo las esperadas.
       */
      const ultimaColumna =
        hoja.getLastColumn();

      if (ultimaColumna === 0) {
        errores.push(
          nombre +
          ': la hoja no contiene cabeceras.'
        );
        return;
      }

      const cabeceras =
        hoja
          .getRange(
            1,
            1,
            1,
            ultimaColumna
          )
          .getDisplayValues()[0]
          .map(function (valor) {
            return String(valor || '').trim();
          });

      /*
       * Obtener la posición de la última cabecera
       * realmente informada.
       */
      let ultimaCabeceraInformada = 0;

      cabeceras.forEach(function (
        cabecera,
        indice
      ) {
        if (cabecera !== '') {
          ultimaCabeceraInformada =
            indice + 1;
        }
      });

      const cabecerasEfectivas =
        cabeceras.slice(
          0,
          ultimaCabeceraInformada
        );

      const cabecerasVacias = [];

      cabecerasEfectivas.forEach(function (
        cabecera,
        indice
      ) {
        if (!cabecera) {
          cabecerasVacias.push(
            indice + 1
          );
        }
      });

      /*
       * Comprobar número exacto de cabeceras.
       */
      if (
        ultimaCabeceraInformada !==
        columnasEsperadas
      ) {
        errores.push(
          nombre +
          ': esperadas ' +
          columnasEsperadas +
          ' columnas, encontradas ' +
          ultimaCabeceraInformada +
          '.'
        );
      }

      /*
       * Detectar huecos intermedios en la fila
       * de cabeceras.
       */
      if (cabecerasVacias.length > 0) {
        errores.push(
          nombre +
          ': cabeceras vacías en columnas ' +
          cabecerasVacias.join(', ') +
          '.'
        );
      }
    });

  if (errores.length > 0) {
    console.error(
      errores.join('\n')
    );

    throw new Error(
      'Estructura inválida:\n' +
      errores.join('\n')
    );
  }

  console.log(
    'OK: estructura inicial válida y número exacto de cabeceras confirmado'
  );

  return true;
}

function validarCatalogoConfiguracion() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hoja =
    ss.getSheetByName('90_CONFIGURACION');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 90_CONFIGURACION'
    );
  }

  const ultimaFila =
    hoja.getLastRow();

  const FILAS_ESPERADAS = 146;
  const REGISTROS_ESPERADOS = 145;

  if (ultimaFila !== FILAS_ESPERADAS) {
    throw new Error(
      'Número de filas incorrecto en 90_CONFIGURACION. ' +
      'Esperado: ' +
      FILAS_ESPERADAS +
      '. Actual: ' +
      ultimaFila
    );
  }

  const datos =
    hoja
      .getRange(
        2,
        1,
        ultimaFila - 1,
        7
      )
      .getDisplayValues();

  const ids = new Set();
  const claves = new Set();
  const errores = [];

  datos.forEach(function (fila, indice) {
    const numeroFila =
      indice + 2;

    const id =
      String(fila[0] || '').trim();

    const categoria =
      String(fila[1] || '').trim();

    const clave =
      String(fila[2] || '').trim();

    const valor =
      String(fila[3] || '').trim();

    const orden =
      String(fila[4] || '').trim();

    const descripcion =
      String(fila[5] || '').trim();

    const activo =
      String(fila[6] || '').trim();

    if (
      !id ||
      !categoria ||
      !clave ||
      !valor ||
      !orden ||
      !descripcion ||
      !activo
    ) {
      errores.push(
        'Fila ' +
        numeroFila +
        ': existen campos obligatorios vacíos'
      );

      return;
    }

    if (!/^CFG-\d{4}$/.test(id)) {
      errores.push(
        'Fila ' +
        numeroFila +
        ': formato de ID incorrecto: ' +
        id
      );
    }

    if (ids.has(id)) {
      errores.push(
        'Fila ' +
        numeroFila +
        ': ID duplicado: ' +
        id
      );
    }

    ids.add(id);

    const claveCompuesta =
      categoria +
      '|' +
      clave;

    if (claves.has(claveCompuesta)) {
      errores.push(
        'Fila ' +
        numeroFila +
        ': combinación CATEGORIA + CLAVE duplicada: ' +
        claveCompuesta
      );
    }

    claves.add(claveCompuesta);

    if (!/^\d+$/.test(orden)) {
      errores.push(
        'Fila ' +
        numeroFila +
        ': ORDEN no es un número entero'
      );
    }

    if (activo !== 'SÍ') {
      errores.push(
        'Fila ' +
        numeroFila +
        ': ACTIVO debe ser SÍ'
      );
    }
  });

  if (
    datos.length !==
    REGISTROS_ESPERADOS
  ) {
    errores.push(
      'Número de registros incorrecto. ' +
      'Esperado: ' +
      REGISTROS_ESPERADOS +
      '. Actual: ' +
      datos.length
    );
  }

  if (errores.length > 0) {
    errores.forEach(function (error) {
      console.error(error);
    });

    throw new Error(
      'Catálogo de configuración no válido. ' +
      'Errores detectados: ' +
      errores.length
    );
  }

  console.log(
    'OK: catálogo de configuración válido'
  );

  console.log(
    'Registros verificados: ' +
    datos.length
  );

  console.log(
    'IDs únicos: ' +
    ids.size
  );

  console.log(
    'Claves únicas: ' +
    claves.size
  );

  return true;
}

function completarMetadatosConfiguracion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('90_CONFIGURACION');

  if (!hoja) {
    throw new Error('No existe la hoja 90_CONFIGURACION');
  }

  const ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    throw new Error('No existen registros de configuración');
  }

  const numeroRegistros = ultimaFila - 1;
  const ahora = new Date();
  const usuario =
    Session.getEffectiveUser().getEmail() || 'USUARIO_NO_IDENTIFICADO';

  const rango = hoja.getRange(2, 8, numeroRegistros, 4);
  const valoresActuales = rango.getValues();

  const valoresNuevos = valoresActuales.map(fila => [
    fila[0] || ahora,
    fila[1] || usuario,
    fila[2] || ahora,
    fila[3] || usuario
  ]);

  rango.setValues(valoresNuevos);
  hoja.getRange(2, 8, numeroRegistros, 1)
    .setNumberFormat('dd/MM/yyyy HH:mm:ss');
  hoja.getRange(2, 10, numeroRegistros, 1)
    .setNumberFormat('dd/MM/yyyy HH:mm:ss');

  SpreadsheetApp.flush();

  console.log('OK: metadatos de configuración completados');
  console.log('Registros actualizados: ' + numeroRegistros);
  console.log('Rango actualizado: H2:K' + ultimaFila);
  console.log('Usuario registrado: ' + usuario);

  return true;
}

function validarMetadatosConfiguracion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('90_CONFIGURACION');

  if (!hoja) {
    throw new Error('No existe la hoja 90_CONFIGURACION');
  }

  const ultimaFila = hoja.getLastRow();

  if (ultimaFila !== 137) {
    throw new Error(
      'Número de filas incorrecto. Esperado: 137. Actual: ' + ultimaFila
    );
  }

  const datos = hoja.getRange(2, 8, 136, 4).getValues();
  const errores = [];

  datos.forEach((fila, indice) => {
    const numeroFila = indice + 2;
    const [
      fechaCreacion,
      creadoPor,
      fechaModificacion,
      modificadoPor
    ] = fila;

    if (!(fechaCreacion instanceof Date) || isNaN(fechaCreacion.getTime())) {
      errores.push(
        'Fila ' + numeroFila + ': FECHA_CREACION no es válida'
      );
    }

    if (!creadoPor || String(creadoPor).trim() === '') {
      errores.push(
        'Fila ' + numeroFila + ': CREADO_POR está vacío'
      );
    }

    if (
      !(fechaModificacion instanceof Date) ||
      isNaN(fechaModificacion.getTime())
    ) {
      errores.push(
        'Fila ' + numeroFila + ': FECHA_MODIFICACION no es válida'
      );
    }

    if (!modificadoPor || String(modificadoPor).trim() === '') {
      errores.push(
        'Fila ' + numeroFila + ': MODIFICADO_POR está vacío'
      );
    }

    if (
      fechaCreacion instanceof Date &&
      fechaModificacion instanceof Date &&
      fechaModificacion.getTime() < fechaCreacion.getTime()
    ) {
      errores.push(
        'Fila ' + numeroFila +
        ': FECHA_MODIFICACION es anterior a FECHA_CREACION'
      );
    }
  });

  if (errores.length > 0) {
    errores.forEach(error => console.error(error));

    throw new Error(
      'Metadatos de configuración no válidos. Errores: ' +
      errores.length
    );
  }

  console.log('OK: metadatos de configuración válidos');
  console.log('Registros verificados: ' + datos.length);
  console.log('Rango verificado: H2:K137');

  return true;
}

function crearRangosCatalogosConfiguracion() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hoja =
    ss.getSheetByName('90_CONFIGURACION');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 90_CONFIGURACION'
    );
  }

  const ultimaFila =
    hoja.getLastRow();

  if (ultimaFila < 2) {
    throw new Error(
      '90_CONFIGURACION no contiene registros de catálogo.'
    );
  }

  /*
   * Leer CATEGORIA y ACTIVO de todos los registros actuales.
   * Se evita depender de un número fijo de filas.
   */
  const datos =
    hoja
      .getRange(
        2,
        2,
        ultimaFila - 1,
        6
      )
      .getDisplayValues();

  const grupos = {};

  datos.forEach(function (fila, indice) {
    const numeroFila =
      indice + 2;

    const categoria =
      String(fila[0] || '').trim();

    const activo =
      String(fila[5] || '').trim();

    if (!categoria) {
      throw new Error(
        'Categoría vacía en la fila ' +
        numeroFila
      );
    }

    /*
     * Solo incluir valores de catálogo habilitados.
     */
    if (activo !== 'SÍ') {
      return;
    }

    if (!grupos[categoria]) {
      grupos[categoria] = [];
    }

    grupos[categoria].push(
      numeroFila
    );
  });

  if (
    Object.keys(grupos).length === 0
  ) {
    throw new Error(
      'No existen categorías activas para crear rangos.'
    );
  }

  /*
   * Validar primero todos los grupos antes de eliminar
   * los rangos existentes. Así evitamos dejar el sistema
   * sin rangos si aparece una categoría no consecutiva.
   */
  Object.keys(grupos)
    .forEach(function (categoria) {
      const filas =
        grupos[categoria];

      const primeraFila =
        Math.min.apply(
          null,
          filas
        );

      const ultimaFilaCategoria =
        Math.max.apply(
          null,
          filas
        );

      if (
        ultimaFilaCategoria -
        primeraFila +
        1 !==
        filas.length
      ) {
        throw new Error(
          'La categoría ' +
          categoria +
          ' no ocupa filas consecutivas.'
        );
      }

      const nombreRango =
        'CFG_' + categoria;

      /*
       * Los nombres definidos de Sheets solo admiten
       * letras, números y guion bajo.
       */
      if (
        !/^[A-Za-z_][A-Za-z0-9_]*$/
          .test(nombreRango)
      ) {
        throw new Error(
          'Nombre de rango no válido para la categoría ' +
          categoria +
          ': ' +
          nombreRango
        );
      }
    });

  /*
   * Eliminar únicamente rangos propios del catálogo.
   */
  ss.getNamedRanges()
    .forEach(function (rangoNombrado) {
      if (
        rangoNombrado
          .getName()
          .indexOf('CFG_') === 0
      ) {
        rangoNombrado.remove();
      }
    });

  const nombresCreados = [];

  Object.keys(grupos)
    .sort()
    .forEach(function (categoria) {
      const filas =
        grupos[categoria];

      const primeraFila =
        Math.min.apply(
          null,
          filas
        );

      const nombreRango =
        'CFG_' + categoria;

      const rangoValores =
        hoja.getRange(
          primeraFila,
          4,
          filas.length,
          1
        );

      ss.setNamedRange(
        nombreRango,
        rangoValores
      );

      nombresCreados.push(
        nombreRango
      );
    });

  SpreadsheetApp.flush();

  console.log(
    'OK: rangos de catálogos creados'
  );

  console.log(
    'Rangos creados: ' +
    nombresCreados.length
  );

  console.log(
    nombresCreados.join(', ')
  );

  if (
    nombresCreados.indexOf(
      'CFG_NIVEL_INCIDENCIA'
    ) === -1
  ) {
    throw new Error(
      'No se creó el rango CFG_NIVEL_INCIDENCIA.'
    );
  }

  return true;
}

function validarRangosCatalogosConfiguracion() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hoja =
    ss.getSheetByName('90_CONFIGURACION');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 90_CONFIGURACION'
    );
  }

  const RANGOS_ESPERADOS = 27;

  const rangos = ss
    .getNamedRanges()
    .filter(function (rango) {
      return rango
        .getName()
        .indexOf('CFG_') === 0;
    });

  const errores = [];
  const nombres = new Set();

  rangos.forEach(function (rangoNombrado) {
    const nombre =
      rangoNombrado.getName();

    const rango =
      rangoNombrado.getRange();

    if (nombres.has(nombre)) {
      errores.push(
        'Rango duplicado: ' +
        nombre
      );
    }

    nombres.add(nombre);

    if (
      rango.getSheet().getName() !==
      '90_CONFIGURACION'
    ) {
      errores.push(
        nombre +
        ': apunta a una hoja incorrecta: ' +
        rango.getSheet().getName()
      );
    }

    if (
      rango.getColumn() !== 4 ||
      rango.getNumColumns() !== 1
    ) {
      errores.push(
        nombre +
        ': debe apuntar únicamente a la columna D'
      );
    }

    const valores =
      rango
        .getDisplayValues()
        .flat();

    if (valores.length === 0) {
      errores.push(
        nombre +
        ': rango vacío'
      );
    }

    valores.forEach(function (
      valor,
      indice
    ) {
      if (
        !String(valor || '').trim()
      ) {
        errores.push(
          nombre +
          ': valor vacío en la posición ' +
          (indice + 1)
        );
      }
    });
  });

  if (
    rangos.length !==
    RANGOS_ESPERADOS
  ) {
    errores.push(
      'Número de rangos incorrecto. Esperado: ' +
      RANGOS_ESPERADOS +
      '. Actual: ' +
      rangos.length
    );
  }

  if (
    nombres.size !==
    rangos.length
  ) {
    errores.push(
      'El número de nombres únicos no coincide con el número de rangos.'
    );
  }

  if (errores.length > 0) {
    errores.forEach(function (error) {
      console.error(error);
    });

    throw new Error(
      'Rangos de configuración no válidos. Errores: ' +
      errores.length
    );
  }

  console.log(
    'OK: rangos de catálogos válidos'
  );

  console.log(
    'Rangos verificados: ' +
    rangos.length
  );

  console.log(
    'Nombres únicos: ' +
    nombres.size
  );

  return true;
}

function aplicarValidacionesCampanas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('01_CAMPANAS');

  if (!hoja) {
    throw new Error('No existe la hoja 01_CAMPANAS');
  }

  const filaInicial = 2;
  const numeroFilas = Math.max(hoja.getMaxRows() - 1, 1);

  const rangoResponsable = ss.getRangeByName('CFG_TIPO_RECURSO');
  const rangoEstado = ss.getRangeByName('CFG_ESTADO_CAMPANA');

  if (!rangoResponsable || !rangoEstado) {
    throw new Error('Faltan rangos de configuración requeridos');
  }

  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEstado, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un estado válido de campaña')
    .build();

  const validacionPorcentaje = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(0, 100)
    .setAllowInvalid(false)
    .setHelpText('Introduzca un porcentaje entre 0 y 100')
    .build();

  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione SÍ o NO')
    .build();

  const validacionFecha = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('Introduzca una fecha válida')
    .build();

  hoja.getRange(filaInicial, 5, numeroFilas, 6)
    .setDataValidation(validacionFecha)
    .setNumberFormat('dd/MM/yyyy');

  hoja.getRange(filaInicial, 11, numeroFilas, 1)
    .setDataValidation(validacionEstado);

  hoja.getRange(filaInicial, 12, numeroFilas, 1)
    .setDataValidation(validacionPorcentaje)
    .setNumberFormat('0');

  hoja.getRange(filaInicial, 18, numeroFilas, 1)
    .setDataValidation(validacionActivo);

  SpreadsheetApp.flush();

  console.log('OK: validaciones aplicadas en 01_CAMPANAS');
  console.log('Filas preparadas: ' + numeroFilas);
  console.log('Fechas: E:J');
  console.log('Estado: K');
  console.log('Porcentaje de avance: L');
  console.log('Activo: R');

  return true;
}

function aplicarValidacionesProyectos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('02_PROYECTOS');

  if (!hoja) {
    throw new Error('No existe la hoja 02_PROYECTOS');
  }

  const filaInicial = 2;
  const numeroFilas = Math.max(hoja.getMaxRows() - 1, 1);

  const rangoTipoProyecto = ss.getRangeByName('CFG_TIPO_PROYECTO');
  const rangoPrioridad = ss.getRangeByName('CFG_PRIORIDAD');
  const rangoEstado = ss.getRangeByName('CFG_ESTADO_PROYECTO');

  if (!rangoTipoProyecto || !rangoPrioridad || !rangoEstado) {
    throw new Error('Faltan rangos de configuración requeridos');
  }

  const validacionTipoProyecto = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoTipoProyecto, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un tipo de proyecto válido')
    .build();

  const validacionPrioridad = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoPrioridad, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione una prioridad válida')
    .build();

  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEstado, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un estado válido de proyecto')
    .build();

  const validacionPorcentaje = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(0, 100)
    .setAllowInvalid(false)
    .setHelpText('Introduzca un porcentaje entre 0 y 100')
    .build();

  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione SÍ o NO')
    .build();

  const validacionFecha = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('Introduzca una fecha válida')
    .build();

  hoja.getRange(filaInicial, 5, numeroFilas, 1)
    .setDataValidation(validacionTipoProyecto);

  hoja.getRange(filaInicial, 6, numeroFilas, 1)
    .setDataValidation(validacionPrioridad);

  hoja.getRange(filaInicial, 8, numeroFilas, 6)
    .setDataValidation(validacionFecha)
    .setNumberFormat('dd/MM/yyyy');

  hoja.getRange(filaInicial, 14, numeroFilas, 1)
    .setDataValidation(validacionEstado);

  hoja.getRange(filaInicial, 15, numeroFilas, 1)
    .setDataValidation(validacionPorcentaje)
    .setNumberFormat('0');

  hoja.getRange(filaInicial, 21, numeroFilas, 1)
    .setDataValidation(validacionActivo);

  SpreadsheetApp.flush();

  console.log('OK: validaciones aplicadas en 02_PROYECTOS');
  console.log('Filas preparadas: ' + numeroFilas);
  console.log('Tipo de proyecto: E');
  console.log('Prioridad: F');
  console.log('Fechas: H:M');
  console.log('Estado: N');
  console.log('Porcentaje de avance: O');
  console.log('Activo: U');

  return true;
}

function aplicarValidacionesProductos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('03_PRODUCTOS');

  if (!hoja) {
    throw new Error('No existe la hoja 03_PRODUCTOS');
  }

  const filaInicial = 2;
  const numeroFilas = Math.max(hoja.getMaxRows() - 1, 1);

  const rangoOrigen = ss.getRangeByName('CFG_ORIGEN_PRODUCTO');
  const rangoUnidad = ss.getRangeByName('CFG_UNIDAD');
  const rangoPrioridad = ss.getRangeByName('CFG_PRIORIDAD');
  const rangoEstado = ss.getRangeByName('CFG_ESTADO_PRODUCTO');

  if (!rangoOrigen || !rangoUnidad || !rangoPrioridad || !rangoEstado) {
    throw new Error('Faltan rangos de configuración requeridos');
  }

  const validacionOrigen = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoOrigen, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un origen válido')
    .build();

  const validacionUnidad = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoUnidad, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione una unidad válida')
    .build();

  const validacionPrioridad = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoPrioridad, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione una prioridad válida')
    .build();

  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEstado, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un estado válido de producto')
    .build();

  const validacionCantidad = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false)
    .setHelpText('Introduzca una cantidad igual o superior a 0')
    .build();

  const validacionFecha = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('Introduzca una fecha válida')
    .build();

  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione SÍ o NO')
    .build();

  hoja.getRange(filaInicial, 6, numeroFilas, 1)
    .setDataValidation(validacionOrigen);

  hoja.getRange(filaInicial, 7, numeroFilas, 1)
    .setDataValidation(validacionUnidad);

  hoja.getRange(filaInicial, 8, numeroFilas, 2)
    .setDataValidation(validacionCantidad)
    .setNumberFormat('0.00');

  hoja.getRange(filaInicial, 10, numeroFilas, 1)
    .setDataValidation(validacionFecha)
    .setNumberFormat('dd/MM/yyyy');

  hoja.getRange(filaInicial, 11, numeroFilas, 1)
    .setDataValidation(validacionPrioridad);

  hoja.getRange(filaInicial, 13, numeroFilas, 1)
    .setDataValidation(validacionEstado);

  hoja.getRange(filaInicial, 18, numeroFilas, 1)
    .setDataValidation(validacionActivo);

  SpreadsheetApp.flush();

  console.log('OK: validaciones aplicadas en 03_PRODUCTOS');
  console.log('Filas preparadas: ' + numeroFilas);
  console.log('Origen: F');
  console.log('Unidad: G');
  console.log('Cantidades: H:I');
  console.log('Fecha requerida: J');
  console.log('Prioridad: K');
  console.log('Estado: M');
  console.log('Activo: R');

  return true;
}

function aplicarValidacionesProyectoProducto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('04_PROYECTO_PRODUCTO');

  if (!hoja) {
    throw new Error('No existe la hoja 04_PROYECTO_PRODUCTO');
  }

  const filaInicial = 2;
  const numeroFilas = Math.max(hoja.getMaxRows() - 1, 1);

  const rangoPrioridad = ss.getRangeByName('CFG_PRIORIDAD');
  const rangoEstado = ss.getRangeByName('CFG_ESTADO_RELACION');

  if (!rangoPrioridad || !rangoEstado) {
    throw new Error('Faltan rangos de configuración requeridos');
  }

  const validacionCantidad = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false)
    .setHelpText('Introduzca una cantidad igual o superior a 0')
    .build();

  const validacionPrioridad = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoPrioridad, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione una prioridad válida')
    .build();

  const validacionFecha = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('Introduzca una fecha válida')
    .build();

  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEstado, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un estado válido para la relación')
    .build();

  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione SÍ o NO')
    .build();

  hoja.getRange(filaInicial, 4, numeroFilas, 1)
    .setDataValidation(validacionCantidad)
    .setNumberFormat('0.00');

  hoja.getRange(filaInicial, 5, numeroFilas, 1)
    .setDataValidation(validacionPrioridad);

  hoja.getRange(filaInicial, 6, numeroFilas, 1)
    .setDataValidation(validacionFecha)
    .setNumberFormat('dd/MM/yyyy');

  hoja.getRange(filaInicial, 7, numeroFilas, 1)
    .setDataValidation(validacionEstado);

  hoja.getRange(filaInicial, 12, numeroFilas, 1)
    .setDataValidation(validacionActivo);

  SpreadsheetApp.flush();

  console.log('OK: validaciones aplicadas en 04_PROYECTO_PRODUCTO');
  console.log('Filas preparadas: ' + numeroFilas);
  console.log('Cantidad asignada: D');
  console.log('Prioridad: E');
  console.log('Fecha requerida: F');
  console.log('Estado: G');
  console.log('Activo: L');

  return true;
}

function aplicarValidacionesProcesos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('05_PROCESOS');

  if (!hoja) {
    throw new Error('No existe la hoja 05_PROCESOS');
  }

  const filaInicial = 2;
  const numeroFilas = Math.max(hoja.getMaxRows() - 1, 1);

  const rangoEstado = ss.getRangeByName('CFG_ESTADO_PROCESO');

  if (!rangoEstado) {
    throw new Error('Falta el rango CFG_ESTADO_PROCESO');
  }

  const validacionOrden = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(1)
    .setAllowInvalid(false)
    .setHelpText('Introduzca un número de secuencia igual o superior a 1')
    .build();

  const validacionDuracion = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false)
    .setHelpText('Introduzca una duración igual o superior a 0')
    .build();

  const validacionFecha = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('Introduzca una fecha válida')
    .build();

  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEstado, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un estado válido de proceso')
    .build();

  const validacionPorcentaje = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(0, 100)
    .setAllowInvalid(false)
    .setHelpText('Introduzca un porcentaje entre 0 y 100')
    .build();

  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione SÍ o NO')
    .build();

  hoja.getRange(filaInicial, 5, numeroFilas, 1)
    .setDataValidation(validacionOrden)
    .setNumberFormat('0');

  hoja.getRange(filaInicial, 7, numeroFilas, 2)
    .setDataValidation(validacionDuracion)
    .setNumberFormat('0.00');

  hoja.getRange(filaInicial, 10, numeroFilas, 4)
    .setDataValidation(validacionFecha)
    .setNumberFormat('dd/MM/yyyy');

  hoja.getRange(filaInicial, 14, numeroFilas, 1)
    .setDataValidation(validacionEstado);

  hoja.getRange(filaInicial, 15, numeroFilas, 1)
    .setDataValidation(validacionPorcentaje)
    .setNumberFormat('0');

  hoja.getRange(filaInicial, 20, numeroFilas, 1)
    .setDataValidation(validacionActivo);

  SpreadsheetApp.flush();

  console.log('OK: validaciones aplicadas en 05_PROCESOS');
  console.log('Filas preparadas: ' + numeroFilas);
  console.log('Orden de secuencia: E');
  console.log('Duraciones: G:H');
  console.log('Fechas: J:M');
  console.log('Estado: N');
  console.log('Porcentaje de avance: O');
  console.log('Activo: T');

  return true;
}

function aplicarValidacionesTareas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('06_TAREAS');

  if (!hoja) {
    throw new Error('No existe la hoja 06_TAREAS');
  }

  const filaInicial = 2;
  const numeroFilas = Math.max(hoja.getMaxRows() - 1, 1);

  const rangoEstado = ss.getRangeByName('CFG_ESTADO_TAREA');

  if (!rangoEstado) {
    throw new Error('Falta el rango CFG_ESTADO_TAREA');
  }

const validacionOrden = SpreadsheetApp.newDataValidation()
  .requireNumberGreaterThanOrEqualTo(1)
  .setAllowInvalid(false)
  .setHelpText('Introduzca un número igual o superior a 1')
  .build();

  const validacionDuracion = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false)
    .setHelpText('Introduzca una duración igual o superior a 0')
    .build();

  const validacionFecha = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('Introduzca una fecha válida')
    .build();

  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEstado, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un estado válido de tarea')
    .build();

  const validacionPorcentaje = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(0, 100)
    .setAllowInvalid(false)
    .setHelpText('Introduzca un porcentaje entre 0 y 100')
    .build();

  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione SÍ o NO')
    .build();

  hoja.getRange(filaInicial, 5, numeroFilas, 1)
    .setDataValidation(validacionOrden)
    .setNumberFormat('0');

  hoja.getRange(filaInicial, 7, numeroFilas, 2)
    .setDataValidation(validacionDuracion)
    .setNumberFormat('0.00');

  hoja.getRange(filaInicial, 9, numeroFilas, 4)
    .setDataValidation(validacionFecha)
    .setNumberFormat('dd/MM/yyyy');

  hoja.getRange(filaInicial, 13, numeroFilas, 1)
    .setDataValidation(validacionEstado);

  hoja.getRange(filaInicial, 14, numeroFilas, 1)
    .setDataValidation(validacionPorcentaje)
    .setNumberFormat('0');

  hoja.getRange(filaInicial, 22, numeroFilas, 1)
    .setDataValidation(validacionActivo);

  SpreadsheetApp.flush();

  console.log('OK: validaciones aplicadas en 06_TAREAS');
  console.log('Filas preparadas: ' + numeroFilas);
  console.log('Orden de secuencia: E');
  console.log('Duraciones: G:H');
  console.log('Fechas: I:L');
  console.log('Estado: M');
  console.log('Porcentaje de avance: N');
  console.log('Activo: V');

  return true;
}

function aplicarValidacionesTareaResponsable() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('07_TAREA_RESPONSABLE');

  if (!hoja) {
    throw new Error('No existe la hoja 07_TAREA_RESPONSABLE');
  }

  const filaInicial = 2;
  const numeroFilas = Math.max(hoja.getMaxRows() - 1, 1);

  const rangoRol = ss.getRangeByName('CFG_ROL_ASIGNACION');
  const rangoEstado = ss.getRangeByName('CFG_ESTADO_ASIGNACION');

  if (!rangoRol || !rangoEstado) {
    throw new Error('Faltan rangos de configuración requeridos');
  }

  const validacionRol = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoRol, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un rol de asignación válido')
    .build();

  const validacionFecha = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('Introduzca una fecha válida')
    .build();

  const validacionDedicacion = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(0, 100)
    .setAllowInvalid(false)
    .setHelpText('Introduzca un porcentaje entre 0 y 100')
    .build();

  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEstado, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un estado de asignación válido')
    .build();

  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione SÍ o NO')
    .build();

  hoja.getRange(filaInicial, 4, numeroFilas, 1)
    .setDataValidation(validacionRol);

  hoja.getRange(filaInicial, 5, numeroFilas, 2)
    .setDataValidation(validacionFecha)
    .setNumberFormat('dd/MM/yyyy');

  hoja.getRange(filaInicial, 7, numeroFilas, 1)
    .setDataValidation(validacionDedicacion)
    .setNumberFormat('0');

  hoja.getRange(filaInicial, 8, numeroFilas, 1)
    .setDataValidation(validacionEstado);

  hoja.getRange(filaInicial, 13, numeroFilas, 1)
    .setDataValidation(validacionActivo);

  SpreadsheetApp.flush();

  console.log('OK: validaciones aplicadas en 07_TAREA_RESPONSABLE');
  console.log('Filas preparadas: ' + numeroFilas);
  console.log('Rol asignado: D');
  console.log('Fechas de asignación: E:F');
  console.log('Porcentaje de dedicación: G');
  console.log('Estado: H');
  console.log('Activo: M');

  return true;
}


function aplicarValidacionesMateriales() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('08_MATERIALES');

  if (!hoja) {
    throw new Error('No existe la hoja 08_MATERIALES');
  }

  const filaInicial = 2;
  const numeroFilas = Math.max(hoja.getMaxRows() - 1, 1);

  const rangoCategoria = ss.getRangeByName('CFG_CATEGORIA_MATERIAL');
  const rangoUnidad = ss.getRangeByName('CFG_UNIDAD');
  const rangoEstado = ss.getRangeByName('CFG_ESTADO_MATERIAL');

  if (!rangoCategoria || !rangoUnidad || !rangoEstado) {
    throw new Error('Faltan rangos de configuración requeridos');
  }

  const validacionCategoria = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoCategoria, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione una categoría de material válida')
    .build();

  const validacionUnidad = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoUnidad, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione una unidad válida')
    .build();

  const validacionCantidad = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false)
    .setHelpText('Introduzca una cantidad igual o superior a 0')
    .build();

  const validacionPlazo = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false)
    .setHelpText('Introduzca un plazo igual o superior a 0 días')
    .build();

  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEstado, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un estado válido de material')
    .build();

  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione SÍ o NO')
    .build();

  hoja.getRange(filaInicial, 4, numeroFilas, 1)
    .setDataValidation(validacionCategoria);

  hoja.getRange(filaInicial, 5, numeroFilas, 1)
    .setDataValidation(validacionUnidad);

  hoja.getRange(filaInicial, 6, numeroFilas, 3)
    .setDataValidation(validacionCantidad)
    .setNumberFormat('0.00');

  hoja.getRange(filaInicial, 10, numeroFilas, 1)
    .setDataValidation(validacionPlazo)
    .setNumberFormat('0');

  hoja.getRange(filaInicial, 12, numeroFilas, 1)
    .setDataValidation(validacionEstado);

  hoja.getRange(filaInicial, 17, numeroFilas, 1)
    .setDataValidation(validacionActivo);

  SpreadsheetApp.flush();

  console.log('OK: validaciones aplicadas en 08_MATERIALES');
  console.log('Filas preparadas: ' + numeroFilas);
  console.log('Categoría: D');
  console.log('Unidad: E');
  console.log('Stock actual, mínimo y reservado: F:H');
  console.log('Plazo de reposición: J');
  console.log('Estado: L');
  console.log('Activo: Q');

  return true;
}

function aplicarValidacionesProductoMaterial() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('09_PRODUCTO_MATERIAL');

  if (!hoja) {
    throw new Error('No existe la hoja 09_PRODUCTO_MATERIAL');
  }

  const filaInicial = 2;
  const numeroFilas = Math.max(hoja.getMaxRows() - 1, 1);

  const rangoUnidad = ss.getRangeByName('CFG_UNIDAD');
  const rangoEstado = ss.getRangeByName('CFG_ESTADO_RELACION');

  if (!rangoUnidad || !rangoEstado) {
    throw new Error('Faltan rangos de configuración requeridos');
  }

  const validacionCantidad = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false)
    .setHelpText('Introduzca una cantidad igual o superior a 0')
    .build();

  const validacionUnidad = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoUnidad, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione una unidad válida')
    .build();

  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEstado, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un estado válido para la relación')
    .build();

  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione SÍ o NO')
    .build();

  hoja.getRange(filaInicial, 4, numeroFilas, 1)
    .setDataValidation(validacionCantidad)
    .setNumberFormat('0.00');

  hoja.getRange(filaInicial, 5, numeroFilas, 1)
    .setDataValidation(validacionUnidad);

  hoja.getRange(filaInicial, 6, numeroFilas, 1)
    .setDataValidation(validacionCantidad)
    .setNumberFormat('0.00');

  hoja.getRange(filaInicial, 7, numeroFilas, 1)
    .setDataValidation(validacionEstado);

  hoja.getRange(filaInicial, 12, numeroFilas, 1)
    .setDataValidation(validacionActivo);

  SpreadsheetApp.flush();

  console.log('OK: validaciones aplicadas en 09_PRODUCTO_MATERIAL');
  console.log('Filas preparadas: ' + numeroFilas);
  console.log('Cantidad prevista: D');
  console.log('Unidad: E');
  console.log('Cantidad reservada: F');
  console.log('Estado: G');
  console.log('Activo: L');

  return true;
}


function aplicarValidacionesTareaMaterial() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('10_TAREA_MATERIAL');

  if (!hoja) {
    throw new Error('No existe la hoja 10_TAREA_MATERIAL');
  }

  const filaInicial = 2;
  const numeroFilas = Math.max(hoja.getMaxRows() - 1, 1);

  const rangoUnidad = ss.getRangeByName('CFG_UNIDAD');
  const rangoEstado = ss.getRangeByName('CFG_ESTADO_RELACION');

  if (!rangoUnidad || !rangoEstado) {
    throw new Error('Faltan rangos de configuración requeridos');
  }

  const validacionCantidad = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false)
    .setHelpText('Introduzca una cantidad igual o superior a 0')
    .build();

  const validacionUnidad = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoUnidad, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione una unidad válida')
    .build();

  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEstado, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un estado válido para la relación')
    .build();

  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione SÍ o NO')
    .build();

  hoja.getRange(filaInicial, 4, numeroFilas, 3)
    .setDataValidation(validacionCantidad)
    .setNumberFormat('0.00');

  hoja.getRange(filaInicial, 7, numeroFilas, 1)
    .setDataValidation(validacionUnidad);

  hoja.getRange(filaInicial, 8, numeroFilas, 1)
    .setDataValidation(validacionEstado);

  hoja.getRange(filaInicial, 13, numeroFilas, 1)
    .setDataValidation(validacionActivo);

  SpreadsheetApp.flush();

  console.log('OK: validaciones aplicadas en 10_TAREA_MATERIAL');
  console.log('Filas preparadas: ' + numeroFilas);
  console.log('Cantidades prevista, consumida y desperdiciada: D:F');
  console.log('Unidad: G');
  console.log('Estado: H');
  console.log('Activo: M');

  return true;
}


function aplicarValidacionesPersonasEquipos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('11_PERSONAS_EQUIPOS');

  if (!hoja) {
    throw new Error('No existe la hoja 11_PERSONAS_EQUIPOS');
  }

  const filaInicial = 2;
  const numeroFilas = Math.max(hoja.getMaxRows() - 1, 1);

  const rangoTipo = ss.getRangeByName('CFG_TIPO_RECURSO');
  const rangoDisponibilidad = ss.getRangeByName('CFG_DISPONIBILIDAD');
  const rangoEstado = ss.getRangeByName('CFG_ESTADO_RECURSO');

  if (!rangoTipo || !rangoDisponibilidad || !rangoEstado) {
    throw new Error('Faltan rangos de configuración requeridos');
  }

  const validacionTipo = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoTipo, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un tipo de recurso válido')
    .build();

  const validacionCapacidad = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(0, 7)
    .setAllowInvalid(false)
    .setHelpText('Introduzca una capacidad semanal entre 0 y 7 días')
    .build();

  const validacionDisponibilidad = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoDisponibilidad, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione una disponibilidad válida')
    .build();

  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEstado, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un estado válido del recurso')
    .build();

  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione SÍ o NO')
    .build();

  hoja.getRange(filaInicial, 2, numeroFilas, 1)
    .setDataValidation(validacionTipo);

  hoja.getRange(filaInicial, 5, numeroFilas, 1)
    .setDataValidation(validacionCapacidad)
    .setNumberFormat('0.00');

  hoja.getRange(filaInicial, 6, numeroFilas, 1)
    .setDataValidation(validacionDisponibilidad);

  hoja.getRange(filaInicial, 7, numeroFilas, 1)
    .setDataValidation(validacionEstado);

  hoja.getRange(filaInicial, 12, numeroFilas, 1)
    .setDataValidation(validacionActivo);

  SpreadsheetApp.flush();

  console.log('OK: validaciones aplicadas en 11_PERSONAS_EQUIPOS');
  console.log('Filas preparadas: ' + numeroFilas);
  console.log('Tipo de recurso: B');
  console.log('Capacidad semanal: E');
  console.log('Disponibilidad: F');
  console.log('Estado: G');
  console.log('Activo: L');

  return true;
}


function aplicarValidacionesDecisiones() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('12_DECISIONES');

  if (!hoja) {
    throw new Error('No existe la hoja 12_DECISIONES');
  }

  const filaInicial = 2;
  const numeroFilas = Math.max(hoja.getMaxRows() - 1, 1);

  const rangoTipo = ss.getRangeByName('CFG_TIPO_DECISION');
  const rangoEstado = ss.getRangeByName('CFG_ESTADO_DECISION');
  const rangoImpacto = ss.getRangeByName('CFG_IMPACTO');

  if (!rangoTipo || !rangoEstado || !rangoImpacto) {
    throw new Error('Faltan rangos de configuración requeridos');
  }

  const validacionTipo = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoTipo, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un tipo de decisión válido')
    .build();

  const validacionFecha = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('Introduzca una fecha válida')
    .build();

  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEstado, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un estado válido de decisión')
    .build();

  const validacionImpacto = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoImpacto, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un nivel de impacto válido')
    .build();

  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione SÍ o NO')
    .build();

  hoja.getRange(filaInicial, 5, numeroFilas, 1)
    .setDataValidation(validacionTipo);

  hoja.getRange(filaInicial, 7, numeroFilas, 1)
    .setDataValidation(validacionFecha)
    .setNumberFormat('dd/MM/yyyy');

  hoja.getRange(filaInicial, 8, numeroFilas, 1)
    .setDataValidation(validacionEstado);

  hoja.getRange(filaInicial, 9, numeroFilas, 1)
    .setDataValidation(validacionImpacto);

  hoja.getRange(filaInicial, 11, numeroFilas, 1)
    .setDataValidation(validacionFecha)
    .setNumberFormat('dd/MM/yyyy');

  hoja.getRange(filaInicial, 16, numeroFilas, 1)
    .setDataValidation(validacionActivo);

  SpreadsheetApp.flush();

  console.log('OK: validaciones aplicadas en 12_DECISIONES');
  console.log('Filas preparadas: ' + numeroFilas);
  console.log('Tipo de decisión: E');
  console.log('Fecha límite: G');
  console.log('Estado: H');
  console.log('Impacto: I');
  console.log('Fecha de resolución: K');
  console.log('Activo: P');

  return true;
}

function aplicarValidacionesIncidencias() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hoja =
    ss.getSheetByName('13_INCIDENCIAS');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 13_INCIDENCIAS'
    );
  }

  const filaInicial = 2;
  const numeroFilas =
    Math.max(
      hoja.getMaxRows() - 1,
      1
    );

  /*
   * Rangos de configuración.
   */
  const rangoNivel =
    ss.getRangeByName(
      'CFG_NIVEL_INCIDENCIA'
    );

  const rangoTipo =
    ss.getRangeByName(
      'CFG_TIPO_INCIDENCIA'
    );

  const rangoPrioridad =
    ss.getRangeByName(
      'CFG_PRIORIDAD'
    );

  const rangoEstado =
    ss.getRangeByName(
      'CFG_ESTADO_INCIDENCIA'
    );

  const rangoImpacto =
    ss.getRangeByName(
      'CFG_IMPACTO'
    );

  const rangosFaltantes = [];

  if (!rangoNivel) {
    rangosFaltantes.push(
      'CFG_NIVEL_INCIDENCIA'
    );
  }

  if (!rangoTipo) {
    rangosFaltantes.push(
      'CFG_TIPO_INCIDENCIA'
    );
  }

  if (!rangoPrioridad) {
    rangosFaltantes.push(
      'CFG_PRIORIDAD'
    );
  }

  if (!rangoEstado) {
    rangosFaltantes.push(
      'CFG_ESTADO_INCIDENCIA'
    );
  }

  if (!rangoImpacto) {
    rangosFaltantes.push(
      'CFG_IMPACTO'
    );
  }

  if (rangosFaltantes.length > 0) {
    throw new Error(
      'Faltan rangos de configuración requeridos: ' +
      rangosFaltantes.join(', ')
    );
  }

  /*
   * Validaciones.
   */
  const validacionNivel =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInRange(
        rangoNivel,
        true
      )
      .setAllowInvalid(false)
      .setHelpText(
        'Seleccione un nivel de incidencia válido'
      )
      .build();

  const validacionTipo =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInRange(
        rangoTipo,
        true
      )
      .setAllowInvalid(false)
      .setHelpText(
        'Seleccione un tipo de incidencia válido'
      )
      .build();

  const validacionPrioridad =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInRange(
        rangoPrioridad,
        true
      )
      .setAllowInvalid(false)
      .setHelpText(
        'Seleccione una prioridad válida'
      )
      .build();

  const validacionFecha =
    SpreadsheetApp
      .newDataValidation()
      .requireDate()
      .setAllowInvalid(false)
      .setHelpText(
        'Introduzca una fecha válida'
      )
      .build();

  const validacionEstado =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInRange(
        rangoEstado,
        true
      )
      .setAllowInvalid(false)
      .setHelpText(
        'Seleccione un estado válido de incidencia'
      )
      .build();

  const validacionImpacto =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInRange(
        rangoImpacto,
        true
      )
      .setAllowInvalid(false)
      .setHelpText(
        'Seleccione un nivel de impacto válido'
      )
      .build();

  const validacionUrl =
    SpreadsheetApp
      .newDataValidation()
      .requireTextIsUrl()
      .setAllowInvalid(false)
      .setHelpText(
        'Introduzca una URL válida de Jira'
      )
      .build();

  const validacionActivo =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInList(
        ['SÍ', 'NO'],
        true
      )
      .setAllowInvalid(false)
      .setHelpText(
        'Seleccione SÍ o NO'
      )
      .build();

  /*
   * Eliminar validaciones antiguas desplazadas tras insertar
   * NIVEL_INCIDENCIA en la columna B.
   *
   * H: antigua Jira URL
   * K: antiguo Tipo
   * N: antigua Fecha detección
   * S: antigua Fecha resolución
   * X: antiguo Activo
   */
  [
    8,   // H
    11,  // K
    14,  // N
    19,  // S
    24   // X
  ].forEach(function (columna) {
    hoja
      .getRange(
        filaInicial,
        columna,
        numeroFilas,
        1
      )
      .clearDataValidations();
  });

  /*
   * Aplicar validaciones en las posiciones actuales.
   */

  // B — NIVEL_INCIDENCIA
  hoja
    .getRange(
      filaInicial,
      2,
      numeroFilas,
      1
    )
    .setDataValidation(
      validacionNivel
    );

  // I — Jira URL
  hoja
    .getRange(
      filaInicial,
      9,
      numeroFilas,
      1
    )
    .setDataValidation(
      validacionUrl
    );

  // L — TIPO
  hoja
    .getRange(
      filaInicial,
      12,
      numeroFilas,
      1
    )
    .setDataValidation(
      validacionTipo
    );

  // M — PRIORIDAD
  hoja
    .getRange(
      filaInicial,
      13,
      numeroFilas,
      1
    )
    .setDataValidation(
      validacionPrioridad
    );

  // O:P — FECHA_DETECCION y FECHA_LIMITE
  hoja
    .getRange(
      filaInicial,
      15,
      numeroFilas,
      2
    )
    .setDataValidation(
      validacionFecha
    )
    .setNumberFormat(
      'dd/MM/yyyy'
    );

  // Q — ESTADO
  hoja
    .getRange(
      filaInicial,
      17,
      numeroFilas,
      1
    )
    .setDataValidation(
      validacionEstado
    );

  // R — IMPACTO
  hoja
    .getRange(
      filaInicial,
      18,
      numeroFilas,
      1
    )
    .setDataValidation(
      validacionImpacto
    );

  // T — FECHA_RESOLUCION
  hoja
    .getRange(
      filaInicial,
      20,
      numeroFilas,
      1
    )
    .setDataValidation(
      validacionFecha
    )
    .setNumberFormat(
      'dd/MM/yyyy'
    );

  // Y — ACTIVO
  hoja
    .getRange(
      filaInicial,
      25,
      numeroFilas,
      1
    )
    .setDataValidation(
      validacionActivo
    );

  SpreadsheetApp.flush();

  console.log(
    'OK: validaciones aplicadas en 13_INCIDENCIAS'
  );

  console.log(
    'Filas preparadas: ' +
    numeroFilas
  );

  console.log(
    'Nivel de incidencia: B'
  );

  console.log(
    'Jira URL: I'
  );

  console.log(
    'Tipo: L'
  );

  console.log(
    'Prioridad: M'
  );

  console.log(
    'Fechas de detección y límite: O:P'
  );

  console.log(
    'Estado: Q'
  );

  console.log(
    'Impacto: R'
  );

  console.log(
    'Fecha de resolución: T'
  );

  console.log(
    'Activo: Y'
  );

  return true;
}

function aplicarValidacionesDocumentos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('14_DOCUMENTOS');

  if (!hoja) {
    throw new Error('No existe la hoja 14_DOCUMENTOS');
  }

  const filaInicial = 2;
  const numeroFilas = Math.max(hoja.getMaxRows() - 1, 1);

  const rangoEntidad = ss.getRangeByName('CFG_ENTIDAD_DOCUMENTO');
  const rangoTipo = ss.getRangeByName('CFG_TIPO_DOCUMENTO');
  const rangoEstado = ss.getRangeByName('CFG_ESTADO_DOCUMENTO');

  if (!rangoEntidad || !rangoTipo || !rangoEstado) {
    throw new Error('Faltan rangos de configuración requeridos');
  }

  const validacionEntidad = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEntidad, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un tipo de entidad válido')
    .build();

  const validacionTipo = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoTipo, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un tipo de documento válido')
    .build();

  const validacionUrl = SpreadsheetApp.newDataValidation()
    .requireTextIsUrl()
    .setAllowInvalid(false)
    .setHelpText('Introduzca una URL válida')
    .build();

  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInRange(rangoEstado, true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione un estado válido de documento')
    .build();

  const validacionFecha = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('Introduzca una fecha válida')
    .build();

  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÍ', 'NO'], true)
    .setAllowInvalid(false)
    .setHelpText('Seleccione SÍ o NO')
    .build();

  hoja.getRange(filaInicial, 2, numeroFilas, 1)
    .setDataValidation(validacionEntidad);

  hoja.getRange(filaInicial, 4, numeroFilas, 1)
    .setDataValidation(validacionTipo);

  hoja.getRange(filaInicial, 8, numeroFilas, 1)
    .setDataValidation(validacionUrl);

  hoja.getRange(filaInicial, 9, numeroFilas, 1)
    .setDataValidation(validacionEstado);

  hoja.getRange(filaInicial, 10, numeroFilas, 1)
    .setDataValidation(validacionFecha)
    .setNumberFormat('dd/MM/yyyy');

  hoja.getRange(filaInicial, 15, numeroFilas, 1)
    .setDataValidation(validacionActivo);

  SpreadsheetApp.flush();

  console.log('OK: validaciones aplicadas en 14_DOCUMENTOS');
  console.log('Filas preparadas: ' + numeroFilas);
  console.log('Entidad tipo: B');
  console.log('Tipo de documento: D');
  console.log('URL: H');
  console.log('Estado: I');
  console.log('Fecha del documento: J');
  console.log('Activo: O');

  return true;
}


function validarValidacionesMVP() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const comprobaciones = {
    '01_CAMPANAS': [
      'E', 'F', 'G', 'H', 'I',
      'J', 'K', 'L', 'R'
    ],

    '02_PROYECTOS': [
      'E', 'F', 'H', 'I', 'J',
      'K', 'L', 'M', 'N', 'O', 'U'
    ],

    '03_PRODUCTOS': [
      'F', 'G', 'H', 'I',
      'J', 'K', 'M', 'R'
    ],

    '04_PROYECTO_PRODUCTO': [
      'D', 'E', 'F', 'G', 'L'
    ],

    '05_PROCESOS': [
      'E', 'G', 'H', 'J', 'K',
      'L', 'M', 'N', 'O', 'T'
    ],

    '06_TAREAS': [
      'E', 'G', 'H', 'I', 'J',
      'K', 'L', 'M', 'N', 'V'
    ],

    '07_TAREA_RESPONSABLE': [
      'D', 'E', 'F', 'G', 'H', 'M'
    ],

    '08_MATERIALES': [
      'D', 'E', 'F', 'G',
      'H', 'J', 'L', 'Q'
    ],

    '09_PRODUCTO_MATERIAL': [
      'D', 'E', 'F', 'G', 'L'
    ],

    '10_TAREA_MATERIAL': [
      'D', 'E', 'F', 'G', 'H', 'M'
    ],

    '11_PERSONAS_EQUIPOS': [
      'B', 'E', 'F', 'G', 'L'
    ],

    '12_DECISIONES': [
      'E', 'G', 'H', 'I', 'K', 'P'
    ],

    '13_INCIDENCIAS': [
      'B', // NIVEL_INCIDENCIA
      'I', // JIRA_URL
      'L', // TIPO
      'M', // PRIORIDAD
      'O', // FECHA_DETECCION
      'P', // FECHA_LIMITE
      'Q', // ESTADO
      'R', // IMPACTO
      'T', // FECHA_RESOLUCION
      'Y'  // ACTIVO
    ],

    '14_DOCUMENTOS': [
      'B', 'D', 'H', 'I', 'J', 'O'
    ],

    '15_PROVEEDORES': [
      'J', // ESTADO
      'O'  // ACTIVO
    ]
  };

  const errores = [];
  let columnasVerificadas = 0;

  Object.entries(comprobaciones)
    .forEach(function (entrada) {
      const nombreHoja = entrada[0];
      const columnas = entrada[1];

      const hoja =
        ss.getSheetByName(nombreHoja);

      if (!hoja) {
        errores.push(
          'No existe la hoja ' +
          nombreHoja
        );

        return;
      }

      columnas.forEach(function (columna) {
        const celda =
          columna + '2';

        const regla =
          hoja
            .getRange(celda)
            .getDataValidation();

        if (!regla) {
          errores.push(
            nombreHoja +
            ': no existe validación en ' +
            celda
          );
        } else {
          columnasVerificadas++;
        }
      });
    });

  if (errores.length > 0) {
    errores.forEach(function (error) {
      console.error(error);
    });

    throw new Error(
      'Validaciones MVP incompletas. ' +
      'Errores detectados: ' +
      errores.length
    );
  }

  console.log(
    'OK: validaciones MVP verificadas'
  );

  console.log(
    'Hojas verificadas: ' +
    Object.keys(comprobaciones).length
  );

  console.log(
    'Columnas verificadas: ' +
    columnasVerificadas
  );

  console.log(
    'Errores detectados: 0'
  );

  return true;
}

function aplicarTodasLasValidacionesMVP() {
  const funciones = [
    aplicarValidacionesCampanas,
    aplicarValidacionesProyectos,
    aplicarValidacionesProductos,
    aplicarValidacionesProyectoProducto,
    aplicarValidacionesProcesos,
    aplicarValidacionesTareas,
    aplicarValidacionesTareaResponsable,
    aplicarValidacionesMateriales,
    aplicarValidacionesProductoMaterial,
    aplicarValidacionesTareaMaterial,
    aplicarValidacionesPersonasEquipos,
    aplicarValidacionesDecisiones,
    aplicarValidacionesIncidencias,
    aplicarValidacionesDocumentos
  ];

  const resultados = [];

  funciones.forEach(funcion => {
    try {
      funcion();
      resultados.push({
        funcion: funcion.name,
        resultado: 'OK'
      });
    } catch (error) {
      resultados.push({
        funcion: funcion.name,
        resultado: 'ERROR',
        detalle: error.message
      });

      throw new Error(
        'Error en ' + funcion.name + ': ' + error.message
      );
    }
  });

  validarValidacionesMVP();

  console.log('OK: todas las validaciones MVP aplicadas');
  console.log('Funciones ejecutadas: ' + funciones.length);
  console.log('Validación final: OK');

  return resultados;
}

function crearCatalogoNivelIncidencia() {
  var packageName =
    'CREAR_CATALOGO_NIVEL_INCIDENCIA';

  var nombreHoja =
    '90_CONFIGURACION';

  var nombreRango =
    'CFG_NIVEL_INCIDENCIA';

  var categoria =
    'NIVEL_INCIDENCIA';

  var opciones = [
    {
      clave: 'GENERAL',
      valor: 'General',
      orden: 1,
      descripcion: 'Incidencia general sin relación jerárquica obligatoria.'
    },
    {
      clave: 'CAMPANA',
      valor: 'Campaña',
      orden: 2,
      descripcion: 'Incidencia relacionada con una campaña.'
    },
    {
      clave: 'PROYECTO',
      valor: 'Proyecto',
      orden: 3,
      descripcion: 'Incidencia relacionada con un proyecto.'
    },
    {
      clave: 'PRODUCTO',
      valor: 'Producto',
      orden: 4,
      descripcion: 'Incidencia relacionada con un producto.'
    },
    {
      clave: 'PROCESO',
      valor: 'Proceso',
      orden: 5,
      descripcion: 'Incidencia relacionada con un proceso.'
    },
    {
      clave: 'TAREA',
      valor: 'Tarea',
      orden: 6,
      descripcion: 'Incidencia relacionada con una tarea.'
    }
  ];

  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  var hoja =
    ss.getSheetByName(nombreHoja);

  var lock =
    LockService.getDocumentLock();

  var filasInsertadas = [];
  var errorPendiente = null;

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  try {
    lock.waitLock(30000);

    if (!hoja) {
      throw new Error(
        'No existe la hoja ' +
        nombreHoja
      );
    }

    var ultimaFila =
      hoja.getLastRow();

    var ultimaColumna =
      hoja.getLastColumn();

    if (ultimaFila < 1) {
      throw new Error(
        nombreHoja +
        ' no contiene cabeceras.'
      );
    }

    var cabeceras =
      hoja
        .getRange(
          1,
          1,
          1,
          ultimaColumna
        )
        .getDisplayValues()[0]
        .map(function (valor) {
          return String(valor).trim();
        });

    var camposRequeridos = [
      'ID',
      'CATEGORIA',
      'CLAVE',
      'VALOR',
      'ORDEN',
      'DESCRIPCION',
      'ACTIVO'
    ];

    var faltantes =
      camposRequeridos.filter(function (campo) {
        return cabeceras.indexOf(campo) === -1;
      });

    if (faltantes.length > 0) {
      throw new Error(
        'Faltan columnas requeridas en ' +
        nombreHoja +
        ': ' +
        faltantes.join(', ')
      );
    }

    var idxId =
      cabeceras.indexOf('ID');

    var idxCategoria =
      cabeceras.indexOf('CATEGORIA');

    var idxClave =
      cabeceras.indexOf('CLAVE');

    var idxValor =
      cabeceras.indexOf('VALOR');

    var idxOrden =
      cabeceras.indexOf('ORDEN');

    var idxDescripcion =
      cabeceras.indexOf('DESCRIPCION');

    var idxActivo =
      cabeceras.indexOf('ACTIVO');

    var datosExistentes =
      ultimaFila >= 2
        ? hoja
            .getRange(
              2,
              1,
              ultimaFila - 1,
              ultimaColumna
            )
            .getDisplayValues()
        : [];

    var filasCategoria = [];

    datosExistentes.forEach(
      function (fila, indice) {
        if (
          String(fila[idxCategoria]).trim() ===
          categoria
        ) {
          filasCategoria.push({
            numeroFila: indice + 2,
            clave:
              String(fila[idxClave]).trim(),
            valor:
              String(fila[idxValor]).trim(),
            orden:
              String(fila[idxOrden]).trim(),
            activo:
              String(fila[idxActivo]).trim()
          });
        }
      }
    );

    /*
     * Si ya existe el catálogo completo,
     * no se insertan filas.
     */
    if (filasCategoria.length > 0) {
      if (
        filasCategoria.length !==
        opciones.length
      ) {
        throw new Error(
          'Existe una configuración parcial de ' +
          categoria +
          '. Registros encontrados: ' +
          filasCategoria.length +
          '. Esperados: ' +
          opciones.length
        );
      }

      opciones.forEach(function (opcion) {
        var coincidencias =
          filasCategoria.filter(
            function (fila) {
              return (
                fila.clave === opcion.clave &&
                fila.valor === opcion.valor &&
                fila.orden ===
                  String(opcion.orden) &&
                fila.activo === 'SÍ'
              );
            }
          );

        if (coincidencias.length !== 1) {
          throw new Error(
            'La opción ' +
            opcion.clave +
            ' no coincide con la configuración esperada.'
          );
        }
      });

      filasCategoria.sort(
        function (a, b) {
          return a.numeroFila - b.numeroFila;
        }
      );

      for (
        var i = 1;
        i < filasCategoria.length;
        i++
      ) {
        if (
          filasCategoria[i].numeroFila !==
          filasCategoria[i - 1].numeroFila + 1
        ) {
          throw new Error(
            'Las filas de ' +
            categoria +
            ' no son contiguas.'
          );
        }
      }

      console.log(
        'OK catalog_already_exists=true registros=' +
        filasCategoria.length
      );

    } else {
      /*
       * Calcular siguiente ID CFG-XXXX.
       */
      var maxNumeroId = 0;

      datosExistentes.forEach(function (fila) {
        var id =
          String(fila[idxId] || '').trim();

        var coincidencia =
          /^CFG-(\d{4})$/.exec(id);

        if (coincidencia) {
          maxNumeroId = Math.max(
            maxNumeroId,
            Number(coincidencia[1])
          );
        }
      });

      opciones.forEach(
        function (opcion, indice) {
          var numeroId =
            maxNumeroId + indice + 1;

          var id =
            'CFG-' +
            String(numeroId)
              .padStart(4, '0');

          var filaNueva =
            new Array(ultimaColumna)
              .fill('');

          filaNueva[idxId] =
            id;

          filaNueva[idxCategoria] =
            categoria;

          filaNueva[idxClave] =
            opcion.clave;

          filaNueva[idxValor] =
            opcion.valor;

          filaNueva[idxOrden] =
            opcion.orden;

          filaNueva[idxDescripcion] =
            opcion.descripcion;

          filaNueva[idxActivo] =
            'SÍ';

          hoja.appendRow(filaNueva);

          filasInsertadas.push(
            hoja.getLastRow()
          );

          console.log(
            'OK row_inserted=true id=' +
            id +
            ' clave=' +
            opcion.clave +
            ' valor=' +
            opcion.valor
          );
        }
      );

      SpreadsheetApp.flush();

      var primeraFilaInsertada =
        filasInsertadas[0];

      filasCategoria =
        opciones.map(
          function (opcion, indice) {
            return {
              numeroFila:
                primeraFilaInsertada + indice,
              clave:
                opcion.clave,
              valor:
                opcion.valor,
              orden:
                String(opcion.orden),
              activo:
                'SÍ'
            };
          }
        );

      console.log(
        'OK catalog_created=true registros=' +
        filasCategoria.length
      );
    }

    /*
     * Crear o reemplazar el rango con nombre.
     */
    var primeraFila =
      filasCategoria[0].numeroFila;

    var columnaValor =
      idxValor + 1;

    var rangoValores =
      hoja.getRange(
        primeraFila,
        columnaValor,
        opciones.length,
        1
      );

    var valoresRango =
      rangoValores
        .getDisplayValues()
        .flat()
        .map(function (valor) {
          return String(valor).trim();
        });

    var valoresEsperados =
      opciones.map(function (opcion) {
        return opcion.valor;
      });

    if (
      JSON.stringify(valoresRango) !==
      JSON.stringify(valoresEsperados)
    ) {
      throw new Error(
        'Los valores del rango no coinciden con el orden esperado. ' +
        'Actual=' +
        JSON.stringify(valoresRango) +
        ' Esperado=' +
        JSON.stringify(valoresEsperados)
      );
    }

    var rangoExistente =
      ss.getRangeByName(nombreRango);

    if (rangoExistente) {
      ss.removeNamedRange(nombreRango);

      console.log(
        'OK previous_named_range_removed=true'
      );
    }

    ss.setNamedRange(
      nombreRango,
      rangoValores
    );

    SpreadsheetApp.flush();

    var rangoVerificado =
      ss.getRangeByName(nombreRango);

    if (!rangoVerificado) {
      throw new Error(
        'No se pudo crear el rango con nombre ' +
        nombreRango
      );
    }

    var valoresVerificados =
      rangoVerificado
        .getDisplayValues()
        .flat()
        .map(function (valor) {
          return String(valor).trim();
        });

    if (
      JSON.stringify(valoresVerificados) !==
      JSON.stringify(valoresEsperados)
    ) {
      throw new Error(
        'El rango con nombre no contiene los valores esperados.'
      );
    }

    console.log(
      'OK named_range_created=true name=' +
      nombreRango
    );

    console.log(
      'OK named_range_a1=' +
      rangoVerificado.getA1Notation()
    );

    console.log(
      'OK values=' +
      JSON.stringify(valoresVerificados)
    );

    console.log(
      'OK verification_complete=true'
    );

  } catch (error) {
    errorPendiente = error;

    console.error(
      'ERR package=' +
      packageName +
      ' message=' +
      error.message
    );

    /*
     * Rollback únicamente de filas creadas
     * durante esta ejecución.
     */
    if (
      hoja &&
      filasInsertadas.length > 0
    ) {
      try {
        filasInsertadas
          .sort(function (a, b) {
            return b - a;
          })
          .forEach(function (numeroFila) {
            hoja.deleteRow(numeroFila);
          });

        SpreadsheetApp.flush();

        console.log(
          'OK rollback_rows=true rows=' +
          filasInsertadas.length
        );

      } catch (rollbackError) {
        console.error(
          'ERR rollback_failed=true message=' +
          rollbackError.message
        );
      }
    }

  } finally {
    try {
      lock.releaseLock();
    } catch (lockError) {
      console.warn(
        'WARN lock_release_failed=true message=' +
        lockError.message
      );
    }
  }

  if (errorPendiente) {
    console.log(
      'NEXT detener_y_diagnosticar_catalogo_nivel_incidencia'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw errorPendiente;
  }

  console.log(
    'NEXT recargar_sheet_y_abrir_formulario_incidencia'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );
}

function comprobarValidacionesProveedor() {
  const hoja =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('15_PROVEEDORES');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 15_PROVEEDORES'
    );
  }

  const validacionEstado =
    hoja.getRange('J2').getDataValidation();

  const validacionActivo =
    hoja.getRange('O2').getDataValidation();

  console.log(
    'J2_ESTADO=' +
    (validacionEstado ? 'OK' : 'FALTA')
  );

  console.log(
    'O2_ACTIVO=' +
    (validacionActivo ? 'OK' : 'FALTA')
  );

  return {
    estado: Boolean(validacionEstado),
    activo: Boolean(validacionActivo)
  };
}



