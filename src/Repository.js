const CAMPOS_OBLIGATORIOS_MVP = Object.freeze({
  CAMPANA: Object.freeze([
    'NOMBRE',
    'FECHA_INICIO_PLAN',
    'FECHA_FIN_PLAN',
    'ESTADO'
  ]),

  PROYECTO: Object.freeze([
    'CAMPANA_ID',
    'NOMBRE',
    'TIPO_PROYECTO',
    'PRIORIDAD',
    'ESTADO'
  ]),

  PRODUCTO: Object.freeze([
    'CODIGO',
    'NOMBRE',
    'ORIGEN',
    'UNIDAD',
    'ESTADO'
  ]),

  PROYECTO_PRODUCTO: Object.freeze([
    'PROYECTO_ID',
    'PRODUCTO_ID',
    'CANTIDAD_ASIGNADA',
    'PRIORIDAD',
    'ESTADO'
  ]),

  PROCESO: Object.freeze([
    'PRODUCTO_ID',
    'NOMBRE',
    'ORDEN_SECUENCIA',
    'DURACION_PREVISTA_DIAS',
    'ESTADO',
    'PORCENTAJE_AVANCE'
  ]),

  TAREA: Object.freeze([
    'PROCESO_ID',
    'NOMBRE',
    'ORDEN_SECUENCIA',
    'DURACION_PREVISTA_DIAS',
    'ESTADO',
    'PORCENTAJE_AVANCE'
  ]),

  TAREA_RESPONSABLE: Object.freeze([
    'TAREA_ID',
    'PERSONA_EQUIPO_ID',
    'ROL_ASIGNADO',
    'PORCENTAJE_DEDICACION',
    'ESTADO'
  ]),

  MATERIAL: Object.freeze([
    'CODIGO',
    'NOMBRE',
    'CATEGORIA',
    'UNIDAD',
    'ESTADO'
  ]),

  PRODUCTO_MATERIAL: Object.freeze([
    'PRODUCTO_ID',
    'MATERIAL_ID',
    'CANTIDAD_PREVISTA',
    'UNIDAD',
    'ESTADO'
  ]),

  TAREA_MATERIAL: Object.freeze([
    'TAREA_ID',
    'MATERIAL_ID',
    'CANTIDAD_PREVISTA',
    'UNIDAD',
    'ESTADO'
  ]),

  PERSONA_EQUIPO: Object.freeze([
    'TIPO',
    'NOMBRE',
    'ROL',
    'ESTADO'
  ]),

  DECISION: Object.freeze([
    'PROYECTO_ID',
    'TITULO',
    'TIPO',
    'ESTADO',
    'IMPACTO'
  ]),

  INCIDENCIA: Object.freeze([
    'TITULO',
    'TIPO',
    'PRIORIDAD',
    'ESTADO'
  ]),

  DOCUMENTO: Object.freeze([
    'ENTIDAD_TIPO',
    'ENTIDAD_ID',
    'TIPO_DOCUMENTO',
    'TITULO',
    'ESTADO'
  ]),

  PROVEEDOR: Object.freeze(['CODIGO', 'NOMBRE', 'ESTADO']),

  ASIGNACION: Object.freeze([
    'ENTIDAD_TIPO',
    'ENTIDAD_ID',
    'PERSONA_EQUIPO_ID',
    'ROL_ASIGNADO',
    'PORCENTAJE_DEDICACION',
    'ESTADO'
  ]),

  RELACION: Object.freeze([
    'ENTIDAD_TIPO',
    'ENTIDAD_ORIGEN_ID',
    'ENTIDAD_DESTINO_ID',
    'TIPO_RELACION',
    'ESTADO'
  ]),

  VINCULO: Object.freeze([
    'ENTIDAD_ORIGEN_TIPO',
    'ENTIDAD_ORIGEN_ID',
    'ENTIDAD_DESTINO_TIPO',
    'ENTIDAD_DESTINO_ID',
    'TIPO_VINCULO',
    'ESTADO'
  ]),

  MOVIMIENTO_MATERIAL: Object.freeze([
    'MATERIAL_ID',
    'TIPO_MOVIMIENTO',
    'CANTIDAD',
    'UNIDAD',
    'FECHA_MOVIMIENTO'
  ]),

  EJECUCION_TAREA: Object.freeze([
    'TAREA_ID',
    'ESTADO'
  ]),

  PROVEEDOR_MATERIAL: Object.freeze([
    'PROVEEDOR_ID',
    'MATERIAL_ID',
    'PRECIO_UNITARIO',
    'PLAZO_ENTREGA_DIAS',
    'ES_PREFERENTE',
    'ESTADO'
  ]),

  EQUIPO_MIEMBRO: Object.freeze([
    'EQUIPO_ID',
    'MIEMBRO_ID',
    'ESTADO'
  ]),

  RECURSO: Object.freeze([
    'CODIGO',
    'NOMBRE',
    'CLASE_RECURSO',
    'ESTADO'
  ]),

  TAREA_RECURSO: Object.freeze([
    'TAREA_ID',
    'RECURSO_ID',
    'TIPO_USO',
    'ESTADO'
  ])
});

/**
 * Inserta un registro completo dentro de un bloqueo de script.
 *
 * Genera el ID y escribe la fila en una única operación protegida.
 *
 * @param {string} claveEntidad
 * @param {Object} datos
 * @param {Object} opciones
 * @return {Object}
 */
/**
 * Inserta un registro completo dentro de un bloqueo de script.
 *
 * Genera el ID y escribe la fila en una única operación protegida.
 *
 * @param {string} claveEntidad
 * @param {Object} datos
 * @param {Object} opciones
 * @return {Object}
 */
/**
 * Inserta un registro completo dentro de un bloqueo de script.
 *
 * Genera el ID y escribe la fila en una única operación protegida.
 *
 * @param {string} claveEntidad
 * @param {Object} datos
 * @param {Object} opciones
 * @return {Object}
 */


function probarValidacionInsercionTransaccional() {
  const pruebasInvalidas = [
    ['', {}],
    ['NO_EXISTE', {}],
    ['CAMPANA', null],
    ['CAMPANA', []],
    ['CAMPANA', 'texto']
  ];

  let erroresControlados = 0;
  const entradasAceptadasIncorrectamente = [];

  pruebasInvalidas.forEach(([entidad, datos]) => {
    let rechazada = false;

    try {
      insertarRegistroTransaccional(entidad, datos);
    } catch (error) {
      rechazada = true;
      erroresControlados++;

      console.log(
        'Error controlado [' +
        String(entidad) +
        ']: ' +
        error.message
      );
    }

    if (!rechazada) {
      entradasAceptadasIncorrectamente.push(
        String(entidad)
      );
    }
  });

  if (entradasAceptadasIncorrectamente.length > 0) {
    throw new Error(
      'Entradas inválidas aceptadas incorrectamente: ' +
      entradasAceptadasIncorrectamente.join(', ')
    );
  }

  if (erroresControlados !== pruebasInvalidas.length) {
    throw new Error(
      'Errores controlados incorrectos. Esperado: ' +
      pruebasInvalidas.length +
      '. Actual: ' +
      erroresControlados
    );
  }

  console.log(
    'OK: validación de inserción transaccional verificada'
  );
  console.log(
    'Entradas inválidas verificadas: ' +
    pruebasInvalidas.length
  );
  console.log(
    'Errores controlados: ' +
    erroresControlados
  );
  console.log('Registros insertados: 0');

  return true;
}


function probarInsercionTransaccionalDryRun() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('01_CAMPANAS');

  const filasAntes = hoja.getLastRow();

  const resultado = insertarRegistroTransaccional(
    'CAMPANA',
    {
      NOMBRE: 'PRUEBA DRY RUN',
      ESTADO: 'Borrador',
      PORCENTAJE_AVANCE: 0,
      ACTIVO: 'SÍ'
    },
    {
      dryRun: true
    }
  );

  const filasDespues = hoja.getLastRow();

  if (!resultado.ok || !resultado.dryRun) {
    throw new Error('El resultado dryRun no es válido');
  }

  if (resultado.id !== 'CAM-0001') {
    throw new Error(
      'ID esperado CAM-0001. Obtenido: ' + resultado.id
    );
  }

  if (filasAntes !== filasDespues) {
    throw new Error(
      'El modo dryRun modificó la hoja'
    );
  }

  console.log('OK: inserción transaccional simulada');
  console.log('ID calculado: ' + resultado.id);
  console.log('Fila destino calculada: ' + resultado.filaDestino);
  console.log('Filas antes: ' + filasAntes);
  console.log('Filas después: ' + filasDespues);
  console.log('Registros insertados: 0');

  return true;
}


function probarRechazoCamposDesconocidos() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('01_CAMPANAS');

  const filasAntes = hoja.getLastRow();
  let errorControlado = false;

  try {
    insertarRegistroTransaccional(
      'CAMPANA',
      {
        NOMBRE: 'PRUEBA',
        CAMPO_INEXISTENTE: 'VALOR'
      },
      {
        dryRun: true
      }
    );
  } catch (error) {
    console.log('Error controlado: ' + error.message);

    errorControlado = error.message.includes(
      'Campos no reconocidos: CAMPO_INEXISTENTE'
    );
  }

  const filasDespues = hoja.getLastRow();

  if (!errorControlado) {
    throw new Error(
      'El campo desconocido no fue rechazado correctamente'
    );
  }

  if (filasAntes !== filasDespues) {
    throw new Error(
      'La prueba modificó la hoja'
    );
  }

  console.log('OK: campos desconocidos rechazados');
  console.log('Filas antes: ' + filasAntes);
  console.log('Filas después: ' + filasDespues);
  console.log('Registros insertados: 0');

  return true;
}

function probarRechazoCamposSistema() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('01_CAMPANAS');

  const filasAntes = hoja.getLastRow();
  let errorControlado = false;

  try {
    insertarRegistroTransaccional(
      'CAMPANA',
      {
        ID: 'CAM-9999',
        NOMBRE: 'PRUEBA',
        CREADO_POR: 'usuario-manual'
      },
      {
        dryRun: true
      }
    );
  } catch (error) {
    console.log('Error controlado: ' + error.message);

    errorControlado =
      error.message.includes(
        'Campos gestionados por el sistema no permitidos'
      ) &&
      error.message.includes('ID') &&
      error.message.includes('CREADO_POR');
  }

  const filasDespues = hoja.getLastRow();

  if (!errorControlado) {
    throw new Error(
      'Los campos gestionados por el sistema no fueron rechazados'
    );
  }

  if (filasAntes !== filasDespues) {
    throw new Error(
      'La prueba modificó la hoja'
    );
  }

  console.log('OK: campos del sistema rechazados');
  console.log('Filas antes: ' + filasAntes);
  console.log('Filas después: ' + filasDespues);
  console.log('Registros insertados: 0');

  return true;
}

function probarValidacionOpcionDryRun() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('01_CAMPANAS');

  const filasAntes = hoja.getLastRow();
  let errorControlado = false;

  try {
    insertarRegistroTransaccional(
      'CAMPANA',
      {
        NOMBRE: 'PRUEBA DRY RUN INVÁLIDO'
      },
      {
        dryRun: 'sí'
      }
    );
  } catch (error) {
    console.log('Error controlado: ' + error.message);

    errorControlado = error.message.includes(
      'La opción dryRun debe ser booleana'
    );
  }

  const filasDespues = hoja.getLastRow();

  if (!errorControlado) {
    throw new Error(
      'La opción dryRun inválida no fue rechazada'
    );
  }

  if (filasAntes !== filasDespues) {
    throw new Error(
      'La prueba modificó la hoja'
    );
  }

  console.log('OK: opción dryRun validada');
  console.log('Filas antes: ' + filasAntes);
  console.log('Filas después: ' + filasDespues);
  console.log('Registros insertados: 0');

  return true;
}

function probarCamposObligatoriosCampana() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('01_CAMPANAS');

  const filasAntes = hoja.getLastRow();
  let errorControlado = false;

  try {
    insertarRegistroTransaccional(
      'CAMPANA',
      {
        NOMBRE: 'Campaña incompleta',
        ESTADO: 'Borrador'
      },
      {
        dryRun: true
      }
    );
  } catch (error) {
    console.log('Error controlado: ' + error.message);

    errorControlado =
      error.message.includes(
        'Campos obligatorios ausentes o vacíos'
      ) &&
      error.message.includes('FECHA_INICIO_PLAN') &&
      error.message.includes('FECHA_FIN_PLAN');
  }

  const filasDespues = hoja.getLastRow();

  if (!errorControlado) {
    throw new Error(
      'Los campos obligatorios ausentes no fueron rechazados'
    );
  }

  if (filasAntes !== filasDespues) {
    throw new Error(
      'La prueba modificó la hoja'
    );
  }

  console.log('OK: campos obligatorios de campaña validados');
  console.log('Filas antes: ' + filasAntes);
  console.log('Filas después: ' + filasDespues);
  console.log('Registros insertados: 0');

  return true;
}

function probarCampanaCompletaDryRun() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('01_CAMPANAS');

  const filasAntes = hoja.getLastRow();

  const resultado = insertarRegistroTransaccional(
    'CAMPANA',
    {
      NOMBRE: 'Campaña de prueba',
      DESCRIPCION: 'Validación de inserción completa en modo simulación',
      FECHA_INICIO_PLAN: new Date(2026, 0, 1),
      FECHA_FIN_PLAN: new Date(2026, 11, 31),
      ESTADO: 'Borrador',
      PORCENTAJE_AVANCE: 0,
      OBSERVACIONES: 'Registro no persistido'
    },
    {
      dryRun: true
    }
  );

  const filasDespues = hoja.getLastRow();

  if (!resultado.ok || !resultado.dryRun) {
    throw new Error('El resultado de la simulación no es válido');
  }

  if (resultado.id !== 'CAM-0001') {
    throw new Error(
      'ID esperado CAM-0001. Obtenido: ' + resultado.id
    );
  }

  if (filasAntes !== filasDespues) {
    throw new Error('La simulación modificó la hoja');
  }

  if (!Array.isArray(resultado.valores)) {
    throw new Error('La simulación no devolvió los valores de la fila');
  }

  console.log('OK: campaña completa validada en dryRun');
  console.log('ID calculado: ' + resultado.id);
  console.log('Fila destino: ' + resultado.filaDestino);
  console.log('Columnas preparadas: ' + resultado.valores.length);
  console.log('Filas antes: ' + filasAntes);
  console.log('Filas después: ' + filasDespues);
  console.log('Registros insertados: 0');

  return true;
}

function probarFechasCampanaInvalidas() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('01_CAMPANAS');

  const filasAntes = hoja.getLastRow();
  let errorControlado = false;

  try {
    insertarRegistroTransaccional(
      'CAMPANA',
      {
        NOMBRE: 'Campaña con fechas inválidas',
        FECHA_INICIO_PLAN: new Date(2026, 11, 31),
        FECHA_FIN_PLAN: new Date(2026, 0, 1),
        ESTADO: 'Borrador'
      },
      {
        dryRun: true
      }
    );
  } catch (error) {
    console.log('Error controlado: ' + error.message);

    errorControlado = error.message.includes(
      'FECHA_FIN_PLAN no puede ser anterior a FECHA_INICIO_PLAN'
    );
  }

  const filasDespues = hoja.getLastRow();

  if (!errorControlado) {
    throw new Error(
      'La incoherencia de fechas no fue rechazada'
    );
  }

  if (filasAntes !== filasDespues) {
    throw new Error(
      'La prueba modificó la hoja'
    );
  }

  console.log('OK: coherencia de fechas de campaña validada');
  console.log('Filas antes: ' + filasAntes);
  console.log('Filas después: ' + filasDespues);
  console.log('Registros insertados: 0');

  return true;
}

function probarEstadoCampanaInvalido() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('01_CAMPANAS');

  const filasAntes = hoja.getLastRow();
  let errorControlado = false;

  try {
    insertarRegistroTransaccional(
      'CAMPANA',
      {
        NOMBRE: 'Campaña con estado inválido',
        FECHA_INICIO_PLAN: new Date(2026, 0, 1),
        FECHA_FIN_PLAN: new Date(2026, 11, 31),
        ESTADO: 'ESTADO_INEXISTENTE'
      },
      {
        dryRun: true
      }
    );
  } catch (error) {
    console.log('Error controlado: ' + error.message);

    errorControlado = error.message.includes(
      'ESTADO de campaña no válido: ESTADO_INEXISTENTE'
    );
  }

  const filasDespues = hoja.getLastRow();

  if (!errorControlado) {
    throw new Error(
      'El estado inválido de campaña no fue rechazado'
    );
  }

  if (filasAntes !== filasDespues) {
    throw new Error(
      'La prueba modificó la hoja'
    );
  }

  console.log('OK: estado de campaña validado');
  console.log('Filas antes: ' + filasAntes);
  console.log('Filas después: ' + filasDespues);
  console.log('Registros insertados: 0');

  return true;
}

function probarPorcentajeCampanaInvalido() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('01_CAMPANAS');

  const filasAntes = hoja.getLastRow();
  let errorControlado = false;

  try {
    insertarRegistroTransaccional(
      'CAMPANA',
      {
        NOMBRE: 'Campaña con porcentaje inválido',
        FECHA_INICIO_PLAN: new Date(2026, 0, 1),
        FECHA_FIN_PLAN: new Date(2026, 11, 31),
        ESTADO: 'Borrador',
        PORCENTAJE_AVANCE: 150
      },
      {
        dryRun: true
      }
    );
  } catch (error) {
    console.log('Error controlado: ' + error.message);

    errorControlado = error.message.includes(
      'PORCENTAJE_AVANCE debe ser un número entre 0 y 100'
    );
  }

  const filasDespues = hoja.getLastRow();

  if (!errorControlado) {
    throw new Error(
      'El porcentaje inválido no fue rechazado'
    );
  }

  if (filasAntes !== filasDespues) {
    throw new Error(
      'La prueba modificó la hoja'
    );
  }

  console.log('OK: porcentaje de avance de campaña validado');
  console.log('Filas antes: ' + filasAntes);
  console.log('Filas después: ' + filasDespues);
  console.log('Registros insertados: 0');

  return true;
}

function probarResponsableCampanaInexistente() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('01_CAMPANAS');

  const filasAntes = hoja.getLastRow();
  let errorControlado = false;

  try {
    insertarRegistroTransaccional(
      'CAMPANA',
      {
        NOMBRE: 'Campaña con responsable inexistente',
        RESPONSABLE_ID: 'PER-9999',
        FECHA_INICIO_PLAN: new Date(2026, 0, 1),
        FECHA_FIN_PLAN: new Date(2026, 11, 31),
        ESTADO: 'Borrador',
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );
  } catch (error) {
    console.log('Error controlado: ' + error.message);

    errorControlado = error.message.includes(
      'RESPONSABLE_ID de campaña no existe: PER-9999'
    );
  }

  const filasDespues = hoja.getLastRow();

  if (!errorControlado) {
    throw new Error(
      'El responsable inexistente no fue rechazado'
    );
  }

  if (filasAntes !== filasDespues) {
    throw new Error(
      'La prueba modificó la hoja'
    );
  }

  console.log(
    'OK: responsable de campaña validado'
  );
  console.log('Filas antes: ' + filasAntes);
  console.log('Filas después: ' + filasDespues);
  console.log('Registros insertados: 0');

  return true;
}

function probarCampanaValidaDryRun() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('01_CAMPANAS');

  const filasAntes = hoja.getLastRow();

  const resultado = insertarRegistroTransaccional(
    'CAMPANA',
    {
      NOMBRE: 'Campaña válida de prueba',
      DESCRIPCION: 'Validación integral del repositorio',
      FECHA_INICIO_PLAN: new Date(2026, 0, 1),
      FECHA_FIN_PLAN: new Date(2026, 11, 31),
      ESTADO: 'Borrador',
      PORCENTAJE_AVANCE: 0,
      OBSERVACIONES: 'Prueba sin escritura'
    },
    {
      dryRun: true
    }
  );

  const filasDespues = hoja.getLastRow();

  if (!resultado || resultado.ok !== true) {
    throw new Error(
      'La simulación no devolvió un resultado correcto'
    );
  }

  if (resultado.dryRun !== true) {
    throw new Error(
      'El resultado no está identificado como dryRun'
    );
  }

  if (resultado.entidad !== 'CAMPANA') {
    throw new Error(
      'La entidad devuelta no es CAMPANA'
    );
  }

  if (!/^CAM-\d{4}$/.test(resultado.id)) {
    throw new Error(
      'El ID generado no cumple el formato CAM-0000'
    );
  }

  if (!Array.isArray(resultado.valores)) {
    throw new Error(
      'La simulación no devolvió los valores de la fila'
    );
  }

  if (resultado.valores.length !== hoja.getLastColumn()) {
    throw new Error(
      'La cantidad de valores no coincide con las columnas'
    );
  }

  if (filasAntes !== filasDespues) {
    throw new Error(
      'La prueba dryRun modificó la hoja'
    );
  }

  console.log('OK: campaña válida aceptada en dryRun');
  console.log('ID simulado: ' + resultado.id);
  console.log('Fila destino: ' + resultado.filaDestino);
  console.log('Columnas: ' + resultado.valores.length);
  console.log('Filas antes: ' + filasAntes);
  console.log('Filas después: ' + filasDespues);
  console.log('Registros insertados: 0');

  return true;
}

function probarInsercionRealCampana() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('01_CAMPANAS');

  const filasAntes = hoja.getLastRow();

  const resultado = insertarRegistroTransaccional(
    'CAMPANA',
    {
      NOMBRE: 'Campaña real de prueba',
      DESCRIPCION: 'Primera inserción real controlada',
      FECHA_INICIO_PLAN: new Date(2026, 0, 1),
      FECHA_FIN_PLAN: new Date(2026, 11, 31),
      ESTADO: 'Borrador',
      PORCENTAJE_AVANCE: 0,
      OBSERVACIONES: 'Registro de validación técnica'
    },
    {
      dryRun: false
    }
  );

  const filasDespues = hoja.getLastRow();

  if (!resultado || resultado.ok !== true) {
    throw new Error(
      'La inserción no devolvió un resultado correcto'
    );
  }

  if (resultado.dryRun !== false) {
    throw new Error(
      'El resultado indica incorrectamente dryRun'
    );
  }

  if (!/^CAM-\d{4}$/.test(resultado.id)) {
    throw new Error(
      'El ID insertado no cumple el formato esperado'
    );
  }

  if (filasDespues !== filasAntes + 1) {
    throw new Error(
      'La hoja no incrementó exactamente una fila'
    );
  }

  const filaInsertada = hoja
    .getRange(filasDespues, 1, 1, hoja.getLastColumn())
    .getValues()[0];

  if (filaInsertada[0] !== resultado.id) {
    throw new Error(
      'El ID escrito no coincide con el resultado'
    );
  }

  if (filaInsertada[1] !== 'Campaña real de prueba') {
    throw new Error(
      'El nombre escrito no coincide'
    );
  }

  console.log('OK: campaña insertada correctamente');
  console.log('ID insertado: ' + resultado.id);
  console.log('Fila insertada: ' + resultado.fila);
  console.log('Filas antes: ' + filasAntes);
  console.log('Filas después: ' + filasDespues);
  console.log('Registros insertados: 1');

  return true;
}

function probarCodigoProductoDuplicado() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('03_PRODUCTOS');

  const filasIniciales = hoja.getLastRow();
  let filaTemporal = null;
  let errorControlado = false;

  try {
    const primerResultado =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-DUP-001',
          NOMBRE: 'Producto temporal duplicidad',
          ORIGEN: 'Propio',
          UNIDAD: 'Unidad',
          ESTADO: 'Borrador'
        },
        {
          dryRun: false
        }
      );

    filaTemporal = primerResultado.fila;

    insertarRegistroTransaccional(
      'PRODUCTO',
      {
        CODIGO: 'test-dup-001',
        NOMBRE: 'Producto duplicado',
        ORIGEN: 'Propio',
        UNIDAD: 'Unidad',
        ESTADO: 'Borrador'
      },
      {
        dryRun: true
      }
    );

  } catch (error) {
    console.log(
      'Error controlado: ' + error.message
    );

    errorControlado = error.message.includes(
      'CODIGO de producto duplicado: TEST-DUP-001'
    );

  } finally {
    if (
      filaTemporal !== null &&
      filaTemporal >= 2 &&
      filaTemporal <= hoja.getLastRow()
    ) {
      hoja.deleteRow(filaTemporal);
      SpreadsheetApp.flush();
    }
  }

  const filasFinales = hoja.getLastRow();

  if (!errorControlado) {
    throw new Error(
      'El código duplicado no fue rechazado'
    );
  }

  if (filasFinales !== filasIniciales) {
    throw new Error(
      'La prueba no restauró la hoja correctamente'
    );
  }

  console.log(
    'OK: código duplicado de producto rechazado'
  );
  console.log(
    'Comparación sin distinguir mayúsculas/minúsculas: OK'
  );
  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log('Registros permanentes insertados: 0');

  return true;
}


function pruebaPaso108_ListarRangosProducto() {
  const nombres = SpreadsheetApp.getActive()
    .getNamedRanges()
    .map(rango => rango.getName())
    .filter(nombre =>
      nombre.includes('ORIGEN') ||
      nombre.includes('UNIDAD') ||
      nombre.includes('ESTADO_PRODUCTO')
    )
    .sort();

  console.log(JSON.stringify(nombres, null, 2));
}

/**
 * Valida que un valor pertenezca a un rango con nombre.
 *
 * La comparación ignora espacios exteriores y mayúsculas/minúsculas.
 *
 * @param {*} valor Valor recibido.
 * @param {string} nombreRango Nombre exacto del rango configurado.
 * @param {string} nombreCampo Campo que se está validando.
 */
function validarValorCatalogoRepository_(valor, nombreRango, nombreCampo) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const rango = libro.getRangeByName(nombreRango);

  if (!rango) {
    throw new Error(
      'Rango de configuración inexistente: ' + nombreRango
    );
  }

  const valorNormalizado = String(valor == null ? '' : valor)
    .trim()
    .toUpperCase();

  const valoresPermitidos = rango
    .getDisplayValues()
    .flat()
    .map(function(valorCatalogo) {
      return String(valorCatalogo).trim().toUpperCase();
    })
    .filter(function(valorCatalogo) {
      return valorCatalogo !== '';
    });

  if (valoresPermitidos.indexOf(valorNormalizado) === -1) {
    throw new Error(
      nombreCampo +
      ' no pertenece al catálogo ' +
      nombreRango +
      ': ' +
      valor
    );
  }
}

function pruebaPaso108_OrigenProductoInvalido() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('03_PRODUCTOS');

  if (!hoja) {
    throw new Error('No existe la hoja 03_PRODUCTOS');
  }

  const filasIniciales = hoja.getLastRow();
  let errorEsperadoDetectado = false;

  try {
    insertarRegistroTransaccional(
      'PRODUCTO',
      {
        CODIGO: 'TEST-CATALOGO-108',
        NOMBRE: 'Producto prueba catálogo paso 108',
        ORIGEN: 'ORIGEN_INEXISTENTE',
        UNIDAD: 'Unidad',
        ESTADO: 'Borrador'
      },
      {
        dryRun: true
      }
    );

    console.log('ERR: se aceptó un ORIGEN no incluido en el catálogo');
  } catch (error) {
    const mensaje = String(
      error && error.message ? error.message : error
    );

    console.log('Error controlado: ' + mensaje);

    errorEsperadoDetectado =
      mensaje.indexOf('ERROR_INSERCION_PRODUCTO') !== -1 &&
      mensaje.indexOf('ORIGEN') !== -1 &&
      mensaje.indexOf('CFG_ORIGEN_PRODUCTO') !== -1;

    if (errorEsperadoDetectado) {
      console.log('OK: ORIGEN inválido rechazado');
    } else {
      console.log('ERR: el error recibido no coincide con el esperado');
    }
  }

  SpreadsheetApp.flush();

  const filasFinales = hoja.getLastRow();

  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_108_ERROR: no se confirmó el rechazo del catálogo'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_108_ERROR: la hoja 03_PRODUCTOS fue modificada'
    );
  }

  console.log('OK: prueba controlada del PASO 108 superada');
}

function pruebaPaso109_UnidadProductoInvalida() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('03_PRODUCTOS');

  if (!hoja) {
    throw new Error('PASO_109_ERROR: no existe la hoja 03_PRODUCTOS');
  }

  const filasIniciales = hoja.getLastRow();
  let errorEsperadoDetectado = false;

  try {
    insertarRegistroTransaccional(
      'PRODUCTO',
      {
        CODIGO: 'TEST-UNIDAD-109',
        NOMBRE: 'Producto prueba unidad paso 109',
        ORIGEN: 'Pedido interno',
        UNIDAD: 'UNIDAD_INEXISTENTE',
        ESTADO: 'Borrador'
      },
      {
        dryRun: true
      }
    );

    console.log('ERR: se aceptó una UNIDAD no incluida en el catálogo');
  } catch (error) {
    const mensaje = String(
      error && error.message ? error.message : error
    );

    console.log('Error controlado: ' + mensaje);

    errorEsperadoDetectado =
      mensaje.indexOf('ERROR_INSERCION_PRODUCTO') !== -1 &&
      mensaje.indexOf('UNIDAD') !== -1 &&
      mensaje.indexOf('CFG_UNIDAD') !== -1;

    if (errorEsperadoDetectado) {
      console.log('OK: UNIDAD inválida rechazada');
    } else {
      console.log('ERR: el error recibido no coincide con el esperado');
    }
  }

  SpreadsheetApp.flush();

  const filasFinales = hoja.getLastRow();

  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_109_ERROR: no se confirmó el rechazo de UNIDAD'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_109_ERROR: la hoja 03_PRODUCTOS fue modificada'
    );
  }

  console.log('OK: prueba controlada del PASO 109 superada');
}


function pruebaPaso110_EstadoProductoInvalido() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('03_PRODUCTOS');

  if (!hoja) {
    throw new Error('PASO_110_ERROR: no existe la hoja 03_PRODUCTOS');
  }

  const filasIniciales = hoja.getLastRow();
  let errorEsperadoDetectado = false;

  try {
    insertarRegistroTransaccional(
      'PRODUCTO',
      {
        CODIGO: 'TEST-ESTADO-110',
        NOMBRE: 'Producto prueba estado paso 110',
        ORIGEN: 'Pedido interno',
        UNIDAD: 'Unidad',
        ESTADO: 'ESTADO_INEXISTENTE'
      },
      {
        dryRun: true
      }
    );

    console.log('ERR: se aceptó un ESTADO no incluido en el catálogo');
  } catch (error) {
    const mensaje = String(
      error && error.message ? error.message : error
    );

    console.log('Error controlado: ' + mensaje);

    errorEsperadoDetectado =
      mensaje.indexOf('ERROR_INSERCION_PRODUCTO') !== -1 &&
      mensaje.indexOf('ESTADO') !== -1 &&
      mensaje.indexOf('CFG_ESTADO_PRODUCTO') !== -1;

    if (errorEsperadoDetectado) {
      console.log('OK: ESTADO inválido rechazado');
    } else {
      console.log('ERR: el error recibido no coincide con el esperado');
    }
  }

  SpreadsheetApp.flush();

  const filasFinales = hoja.getLastRow();

  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_110_ERROR: no se confirmó el rechazo de ESTADO'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_110_ERROR: la hoja 03_PRODUCTOS fue modificada'
    );
  }

  console.log('OK: prueba controlada del PASO 110 superada');
}


function pruebaPaso111_ProductoValidoDryRun() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('03_PRODUCTOS');

  if (!hoja) {
    throw new Error('PASO_111_ERROR: no existe la hoja 03_PRODUCTOS');
  }

  const filasIniciales = hoja.getLastRow();

  const resultado = insertarRegistroTransaccional(
    'PRODUCTO',
    {
      CODIGO: 'TEST-VALIDO-111',
      NOMBRE: 'Producto válido paso 111',
      ORIGEN: 'Pedido interno',
      UNIDAD: 'Unidad',
      ESTADO: 'Borrador'
    },
    {
      dryRun: true
    }
  );

  SpreadsheetApp.flush();

  const filasFinales = hoja.getLastRow();

  console.log('OK: producto válido aceptado en dryRun');
  console.log('ID simulado: ' + resultado.id);
  console.log('Fila destino: ' + resultado.filaDestino);
  console.log('Columnas: ' + resultado.columnas);
  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (!resultado || resultado.dryRun !== true) {
    throw new Error(
      'PASO_111_ERROR: el resultado no confirma dryRun'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_111_ERROR: la hoja 03_PRODUCTOS fue modificada'
    );
  }

  console.log('OK: prueba controlada del PASO 111 superada');
}

function pruebaPaso112_InsercionRealProducto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('03_PRODUCTOS');

  if (!hoja) {
    throw new Error(
      'PASO_112_ERROR: no existe la hoja 03_PRODUCTOS'
    );
  }

  const filasIniciales = hoja.getLastRow();

  const resultado = insertarRegistroTransaccional(
    'PRODUCTO',
    {
      CODIGO: 'TEST-REAL-112',
      NOMBRE: 'Producto real paso 112',
      ORIGEN: 'Pedido interno',
      UNIDAD: 'Unidad',
      ESTADO: 'Borrador'
    },
    {
      dryRun: false
    }
  );

  const filasFinales = hoja.getLastRow();

  if (!resultado || resultado.ok !== true) {
    throw new Error(
      'PASO_112_ERROR: resultado de inserción no válido'
    );
  }

  if (resultado.dryRun !== false) {
    throw new Error(
      'PASO_112_ERROR: la operación se ejecutó como dryRun'
    );
  }

  if (filasFinales !== filasIniciales + 1) {
    throw new Error(
      'PASO_112_ERROR: incremento de filas inesperado'
    );
  }

  const cabeceras = hoja
    .getRange(1, 1, 1, hoja.getLastColumn())
    .getDisplayValues()[0]
    .map(valor => String(valor).trim());

  const valores = hoja
    .getRange(filasFinales, 1, 1, cabeceras.length)
    .getValues()[0];

  const registro = {};

  cabeceras.forEach(function(cabecera, indice) {
    registro[cabecera] = valores[indice];
  });

  if (String(registro.ID).trim() !== resultado.id) {
    throw new Error(
      'PASO_112_ERROR: el ID persistido no coincide'
    );
  }

  if (String(registro.CODIGO).trim() !== 'TEST-REAL-112') {
    throw new Error(
      'PASO_112_ERROR: CODIGO persistido incorrectamente'
    );
  }

  if (String(registro.NOMBRE).trim() !== 'Producto real paso 112') {
    throw new Error(
      'PASO_112_ERROR: NOMBRE persistido incorrectamente'
    );
  }

  if (!(registro.FECHA_CREACION instanceof Date)) {
    throw new Error(
      'PASO_112_ERROR: FECHA_CREACION no informada'
    );
  }

  if (String(registro.CREADO_POR || '').trim() === '') {
    throw new Error(
      'PASO_112_ERROR: CREADO_POR no informado'
    );
  }

  console.log('OK: producto insertado correctamente');
  console.log('ID generado: ' + resultado.id);
  console.log('Fila insertada: ' + resultado.fila);
  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log('CODIGO persistido: ' + registro.CODIGO);
  console.log('NOMBRE persistido: ' + registro.NOMBRE);
  console.log('ORIGEN persistido: ' + registro.ORIGEN);
  console.log('UNIDAD persistida: ' + registro.UNIDAD);
  console.log('ESTADO persistido: ' + registro.ESTADO);
  console.log('ACTIVO persistido: ' + registro.ACTIVO);
  console.log('OK: prueba controlada del PASO 112 superada');
}

function pruebaPaso113_SiguienteIdProducto() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('03_PRODUCTOS');

  if (!hoja) {
    throw new Error(
      'PASO_113_ERROR: no existe la hoja 03_PRODUCTOS'
    );
  }

  const filasIniciales = hoja.getLastRow();

  const resultado = insertarRegistroTransaccional(
    'PRODUCTO',
    {
      CODIGO: 'TEST-ID-113',
      NOMBRE: 'Producto prueba ID paso 113',
      ORIGEN: 'Pedido interno',
      UNIDAD: 'Unidad',
      ESTADO: 'Borrador'
    },
    {
      dryRun: true
    }
  );

  const filasFinales = hoja.getLastRow();

  console.log('ID simulado: ' + resultado.id);
  console.log('ID esperado: PRD-0002');
  console.log(
    'Secuencia correcta: ' +
    (resultado.id === 'PRD-0002' ? 'OK' : 'ERR')
  );
  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (resultado.id !== 'PRD-0002') {
    throw new Error(
      'PASO_113_ERROR: ID esperado PRD-0002, recibido ' +
      resultado.id
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_113_ERROR: la hoja 03_PRODUCTOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 113 superada'
  );
}

function pruebaPaso114_RetirarProductoPrueba() {
  const bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    const hoja = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('03_PRODUCTOS');

    if (!hoja) {
      throw new Error(
        'PASO_114_ERROR: no existe la hoja 03_PRODUCTOS'
      );
    }

    const filasIniciales = hoja.getLastRow();

    if (filasIniciales < 2) {
      throw new Error(
        'PASO_114_ERROR: no existen registros para revisar'
      );
    }

    const cabeceras = hoja
      .getRange(1, 1, 1, hoja.getLastColumn())
      .getDisplayValues()[0]
      .map(valor => String(valor).trim());

    const indiceId = cabeceras.indexOf('ID');
    const indiceCodigo = cabeceras.indexOf('CODIGO');

    if (indiceId === -1 || indiceCodigo === -1) {
      throw new Error(
        'PASO_114_ERROR: faltan las columnas ID o CODIGO'
      );
    }

    const datos = hoja
      .getRange(
        2,
        1,
        filasIniciales - 1,
        cabeceras.length
      )
      .getDisplayValues();

    const filasCoincidentes = [];

    datos.forEach(function(fila, indice) {
      const id = String(fila[indiceId]).trim();
      const codigo = String(fila[indiceCodigo])
        .trim()
        .toUpperCase();

      if (
        id === 'PRD-0001' &&
        codigo === 'TEST-REAL-112'
      ) {
        filasCoincidentes.push(indice + 2);
      }
    });

    if (filasCoincidentes.length !== 1) {
      throw new Error(
        'PASO_114_ERROR: coincidencias esperadas 1, encontradas ' +
        filasCoincidentes.length
      );
    }

    const filaEliminada = filasCoincidentes[0];

    hoja.deleteRow(filaEliminada);
    SpreadsheetApp.flush();

    const filasFinales = hoja.getLastRow();

    console.log('OK: producto de prueba retirado');
    console.log('Fila eliminada: ' + filaEliminada);
    console.log('ID retirado: PRD-0001');
    console.log('CODIGO retirado: TEST-REAL-112');
    console.log('Filas iniciales: ' + filasIniciales);
    console.log('Filas finales: ' + filasFinales);

    if (filasFinales !== filasIniciales - 1) {
      throw new Error(
        'PASO_114_ERROR: reducción de filas inesperada'
      );
    }

    console.log(
      'OK: prueba controlada del PASO 114 superada'
    );

  } catch (error) {
    throw new Error(
      'ERROR_PASO_114: ' + error.message
    );

  } finally {
    if (bloqueo.hasLock()) {
      bloqueo.releaseLock();
    }
  }
}


function pruebaPaso115_IdProductoTrasRestauracion() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('03_PRODUCTOS');

  if (!hoja) {
    throw new Error(
      'PASO_115_ERROR: no existe la hoja 03_PRODUCTOS'
    );
  }

  const filasIniciales = hoja.getLastRow();

  const resultado = insertarRegistroTransaccional(
    'PRODUCTO',
    {
      CODIGO: 'TEST-ID-115',
      NOMBRE: 'Producto prueba ID paso 115',
      ORIGEN: 'Pedido interno',
      UNIDAD: 'Unidad',
      ESTADO: 'Borrador'
    },
    {
      dryRun: true
    }
  );

  const filasFinales = hoja.getLastRow();

  console.log('ID simulado: ' + resultado.id);
  console.log('ID esperado: PRD-0001');
  console.log(
    'Secuencia restaurada: ' +
    (resultado.id === 'PRD-0001' ? 'OK' : 'ERR')
  );
  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (resultado.id !== 'PRD-0001') {
    throw new Error(
      'PASO_115_ERROR: ID esperado PRD-0001, recibido ' +
      resultado.id
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_115_ERROR: la hoja 03_PRODUCTOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 115 superada'
  );
}


function pruebaPaso116_CampanaProyectoInexistente() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('02_PROYECTOS');

  if (!hoja) {
    throw new Error(
      'PASO_116_ERROR: no existe la hoja 02_PROYECTOS'
    );
  }

  const filasIniciales = hoja.getLastRow();
  let errorEsperadoDetectado = false;

  try {
    insertarRegistroTransaccional(
      'PROYECTO',
      {
        CAMPANA_ID: 'CAM-9999',
        NOMBRE: 'Proyecto prueba paso 116',
        TIPO_PROYECTO: 'Urgente',
        PRIORIDAD: 'Alta',
        ESTADO: 'Borrador'
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó una CAMPANA_ID inexistente'
    );
  } catch (error) {
    const mensaje = String(
      error && error.message ? error.message : error
    );

    console.log('Error controlado: ' + mensaje);

    errorEsperadoDetectado =
      mensaje.indexOf('ERROR_INSERCION_PROYECTO') !== -1 &&
      mensaje.indexOf('CAMPANA_ID') !== -1 &&
      mensaje.indexOf('CAM-9999') !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: CAMPANA_ID inexistente rechazada'
        : 'ERR: el error recibido no coincide con el esperado'
    );
  }

  SpreadsheetApp.flush();

  const filasFinales = hoja.getLastRow();

  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_116_ERROR: no se confirmó el rechazo de CAMPANA_ID'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_116_ERROR: la hoja 02_PROYECTOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 116 superada'
  );
}

function pruebaPaso117_ListarRangosProyecto() {
  const nombres = SpreadsheetApp
    .getActiveSpreadsheet()
    .getNamedRanges()
    .map(function(rango) {
      return rango.getName();
    })
    .filter(function(nombre) {
      return nombre.includes('TIPO_PROYECTO') ||
        nombre.includes('PRIORIDAD') ||
        nombre.includes('ESTADO_PROYECTO');
    })
    .sort();

  console.log(JSON.stringify(nombres, null, 2));

  if (nombres.length !== 3) {
    throw new Error(
      'PASO_117_ERROR: se esperaban 3 rangos y se encontraron ' +
      nombres.length
    );
  }

  console.log(
    'OK: rangos de catálogo de proyecto localizados'
  );
}

function pruebaPaso118_TipoProyectoInvalido() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaProyectos = ss.getSheetByName('02_PROYECTOS');
  const hojaCampanas = ss.getSheetByName('01_CAMPANAS');

  if (!hojaProyectos) {
    throw new Error(
      'PASO_118_ERROR: no existe la hoja 02_PROYECTOS'
    );
  }

  if (!hojaCampanas || hojaCampanas.getLastRow() < 2) {
    throw new Error(
      'PASO_118_ERROR: no existe una campaña válida para la prueba'
    );
  }

  const cabecerasCampanas = hojaCampanas
    .getRange(1, 1, 1, hojaCampanas.getLastColumn())
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceIdCampana = cabecerasCampanas.indexOf('ID');

  if (indiceIdCampana === -1) {
    throw new Error(
      'PASO_118_ERROR: 01_CAMPANAS no contiene la columna ID'
    );
  }

  const campanaId = String(
    hojaCampanas.getRange(2, indiceIdCampana + 1).getDisplayValue()
  ).trim();

  if (campanaId === '') {
    throw new Error(
      'PASO_118_ERROR: la campaña de prueba no tiene ID'
    );
  }

  const filasIniciales = hojaProyectos.getLastRow();
  let errorEsperadoDetectado = false;

  try {
    insertarRegistroTransaccional(
      'PROYECTO',
      {
        CAMPANA_ID: campanaId,
        NOMBRE: 'Proyecto prueba paso 118',
        TIPO_PROYECTO: 'TIPO_INEXISTENTE',
        PRIORIDAD: 'Alta',
        ESTADO: 'Borrador'
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó un TIPO_PROYECTO no incluido en el catálogo'
    );
  } catch (error) {
    const mensaje = String(
      error && error.message ? error.message : error
    );

    console.log('Error controlado: ' + mensaje);

    errorEsperadoDetectado =
      mensaje.indexOf('ERROR_INSERCION_PROYECTO') !== -1 &&
      mensaje.indexOf('TIPO_PROYECTO') !== -1 &&
      mensaje.indexOf('CFG_TIPO_PROYECTO') !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: TIPO_PROYECTO inválido rechazado'
        : 'ERR: el error recibido no coincide con el esperado'
    );
  }

  SpreadsheetApp.flush();

  const filasFinales = hojaProyectos.getLastRow();

  console.log('CAMPANA_ID utilizada: ' + campanaId);
  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_118_ERROR: no se confirmó el rechazo de TIPO_PROYECTO'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_118_ERROR: la hoja 02_PROYECTOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 118 superada'
  );
}

function pruebaPaso119_PrioridadProyectoInvalida() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaProyectos = ss.getSheetByName('02_PROYECTOS');
  const hojaCampanas = ss.getSheetByName('01_CAMPANAS');

  if (!hojaProyectos) {
    throw new Error(
      'PASO_119_ERROR: no existe la hoja 02_PROYECTOS'
    );
  }

  if (!hojaCampanas || hojaCampanas.getLastRow() < 2) {
    throw new Error(
      'PASO_119_ERROR: no existe una campaña válida para la prueba'
    );
  }

  const cabecerasCampanas = hojaCampanas
    .getRange(1, 1, 1, hojaCampanas.getLastColumn())
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceIdCampana = cabecerasCampanas.indexOf('ID');

  if (indiceIdCampana === -1) {
    throw new Error(
      'PASO_119_ERROR: 01_CAMPANAS no contiene la columna ID'
    );
  }

  const campanaId = String(
    hojaCampanas
      .getRange(2, indiceIdCampana + 1)
      .getDisplayValue()
  ).trim();

  const filasIniciales = hojaProyectos.getLastRow();
  let errorEsperadoDetectado = false;

  try {
    insertarRegistroTransaccional(
      'PROYECTO',
      {
        CAMPANA_ID: campanaId,
        NOMBRE: 'Proyecto prueba paso 119',
        TIPO_PROYECTO: 'Urgente',
        PRIORIDAD: 'PRIORIDAD_INEXISTENTE',
        ESTADO: 'Borrador'
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó una PRIORIDAD no incluida en el catálogo'
    );
  } catch (error) {
    const mensaje = String(
      error && error.message ? error.message : error
    );

    console.log('Error controlado: ' + mensaje);

    errorEsperadoDetectado =
      mensaje.indexOf('ERROR_INSERCION_PROYECTO') !== -1 &&
      mensaje.indexOf('PRIORIDAD') !== -1 &&
      mensaje.indexOf('CFG_PRIORIDAD') !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: PRIORIDAD inválida rechazada'
        : 'ERR: el error recibido no coincide con el esperado'
    );
  }

  SpreadsheetApp.flush();

  const filasFinales = hojaProyectos.getLastRow();

  console.log('CAMPANA_ID utilizada: ' + campanaId);
  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_119_ERROR: no se confirmó el rechazo de PRIORIDAD'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_119_ERROR: la hoja 02_PROYECTOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 119 superada'
  );
}

function pruebaPaso120_EstadoProyectoInvalido() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaProyectos = ss.getSheetByName('02_PROYECTOS');
  const hojaCampanas = ss.getSheetByName('01_CAMPANAS');

  if (!hojaProyectos) {
    throw new Error(
      'PASO_120_ERROR: no existe la hoja 02_PROYECTOS'
    );
  }

  if (!hojaCampanas || hojaCampanas.getLastRow() < 2) {
    throw new Error(
      'PASO_120_ERROR: no existe una campaña válida para la prueba'
    );
  }

  const cabecerasCampanas = hojaCampanas
    .getRange(1, 1, 1, hojaCampanas.getLastColumn())
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceIdCampana = cabecerasCampanas.indexOf('ID');

  if (indiceIdCampana === -1) {
    throw new Error(
      'PASO_120_ERROR: 01_CAMPANAS no contiene la columna ID'
    );
  }

  const campanaId = String(
    hojaCampanas
      .getRange(2, indiceIdCampana + 1)
      .getDisplayValue()
  ).trim();

  const filasIniciales = hojaProyectos.getLastRow();
  let errorEsperadoDetectado = false;

  try {
    insertarRegistroTransaccional(
      'PROYECTO',
      {
        CAMPANA_ID: campanaId,
        NOMBRE: 'Proyecto prueba paso 120',
        TIPO_PROYECTO: 'Urgente',
        PRIORIDAD: 'Alta',
        ESTADO: 'ESTADO_INEXISTENTE'
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó un ESTADO no incluido en el catálogo'
    );
  } catch (error) {
    const mensaje = String(
      error && error.message ? error.message : error
    );

    console.log('Error controlado: ' + mensaje);

    errorEsperadoDetectado =
      mensaje.indexOf('ERROR_INSERCION_PROYECTO') !== -1 &&
      mensaje.indexOf('ESTADO') !== -1 &&
      mensaje.indexOf('CFG_ESTADO_PROYECTO') !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: ESTADO de proyecto inválido rechazado'
        : 'ERR: el error recibido no coincide con el esperado'
    );
  }

  SpreadsheetApp.flush();

  const filasFinales = hojaProyectos.getLastRow();

  console.log('CAMPANA_ID utilizada: ' + campanaId);
  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_120_ERROR: no se confirmó el rechazo de ESTADO'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_120_ERROR: la hoja 02_PROYECTOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 120 superada'
  );
}

function pruebaPaso121_ProyectoValidoDryRun() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaProyectos = ss.getSheetByName('02_PROYECTOS');
  const hojaCampanas = ss.getSheetByName('01_CAMPANAS');

  if (!hojaProyectos) {
    throw new Error(
      'PASO_121_ERROR: no existe la hoja 02_PROYECTOS'
    );
  }

  if (!hojaCampanas || hojaCampanas.getLastRow() < 2) {
    throw new Error(
      'PASO_121_ERROR: no existe una campaña válida'
    );
  }

  const cabecerasCampanas = hojaCampanas
    .getRange(
      1,
      1,
      1,
      hojaCampanas.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceIdCampana = cabecerasCampanas.indexOf('ID');

  if (indiceIdCampana === -1) {
    throw new Error(
      'PASO_121_ERROR: 01_CAMPANAS no contiene la columna ID'
    );
  }

  const campanaId = String(
    hojaCampanas
      .getRange(2, indiceIdCampana + 1)
      .getDisplayValue()
  ).trim();

  const filasIniciales = hojaProyectos.getLastRow();

  const resultado = insertarRegistroTransaccional(
    'PROYECTO',
    {
      CAMPANA_ID: campanaId,
      NOMBRE: 'Proyecto válido paso 121',
      TIPO_PROYECTO: 'Urgente',
      PRIORIDAD: 'Alta',
      ESTADO: 'Borrador'
    },
    {
      dryRun: true
    }
  );

  SpreadsheetApp.flush();

  const filasFinales = hojaProyectos.getLastRow();

  console.log('OK: proyecto válido aceptado en dryRun');
  console.log('CAMPANA_ID utilizada: ' + campanaId);
  console.log('ID simulado: ' + resultado.id);
  console.log('Fila destino: ' + resultado.filaDestino);
  console.log('Columnas: ' + resultado.columnas);
  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (!resultado.ok || !resultado.dryRun) {
    throw new Error(
      'PASO_121_ERROR: el resultado dryRun no es válido'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_121_ERROR: la hoja 02_PROYECTOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 121 superada'
  );
}

function pruebaPaso122_InsertarProyectoReal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaProyectos = ss.getSheetByName('02_PROYECTOS');
  const hojaCampanas = ss.getSheetByName('01_CAMPANAS');

  if (!hojaProyectos) {
    throw new Error(
      'PASO_122_ERROR: no existe la hoja 02_PROYECTOS'
    );
  }

  if (!hojaCampanas || hojaCampanas.getLastRow() < 2) {
    throw new Error(
      'PASO_122_ERROR: no existe una campaña válida'
    );
  }

  const cabecerasCampanas = hojaCampanas
    .getRange(
      1,
      1,
      1,
      hojaCampanas.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceIdCampana = cabecerasCampanas.indexOf('ID');

  if (indiceIdCampana === -1) {
    throw new Error(
      'PASO_122_ERROR: 01_CAMPANAS no contiene la columna ID'
    );
  }

  const campanaId = String(
    hojaCampanas
      .getRange(2, indiceIdCampana + 1)
      .getDisplayValue()
  ).trim();

  const filasIniciales = hojaProyectos.getLastRow();

  const resultado = insertarRegistroTransaccional(
    'PROYECTO',
    {
      CAMPANA_ID: campanaId,
      NOMBRE: 'Proyecto real paso 122',
      TIPO_PROYECTO: 'Urgente',
      PRIORIDAD: 'Alta',
      ESTADO: 'Borrador'
    },
    {
      dryRun: false
    }
  );

  SpreadsheetApp.flush();

  const filasFinales = hojaProyectos.getLastRow();

  const cabecerasProyectos = hojaProyectos
    .getRange(
      1,
      1,
      1,
      hojaProyectos.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceIdProyecto = cabecerasProyectos.indexOf('ID');
  const indiceCampanaProyecto =
    cabecerasProyectos.indexOf('CAMPANA_ID');
  const indiceNombreProyecto =
    cabecerasProyectos.indexOf('NOMBRE');

  if (
    indiceIdProyecto === -1 ||
    indiceCampanaProyecto === -1 ||
    indiceNombreProyecto === -1
  ) {
    throw new Error(
      'PASO_122_ERROR: faltan columnas obligatorias en 02_PROYECTOS'
    );
  }

  const filaInsertada = hojaProyectos
    .getRange(
      filasFinales,
      1,
      1,
      hojaProyectos.getLastColumn()
    )
    .getDisplayValues()[0];

  const idPersistido =
    String(filaInsertada[indiceIdProyecto]).trim();

  const campanaPersistida =
    String(filaInsertada[indiceCampanaProyecto]).trim();

  const nombrePersistido =
    String(filaInsertada[indiceNombreProyecto]).trim();

  console.log('OK: proyecto insertado realmente');
  console.log('ID generado: ' + resultado.id);
  console.log('ID persistido: ' + idPersistido);
  console.log('CAMPANA_ID persistida: ' + campanaPersistida);
  console.log('NOMBRE persistido: ' + nombrePersistido);
  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);

  if (filasFinales !== filasIniciales + 1) {
    throw new Error(
      'PASO_122_ERROR: no se añadió exactamente una fila'
    );
  }

  if (resultado.id !== idPersistido) {
    throw new Error(
      'PASO_122_ERROR: el ID generado no coincide con el persistido'
    );
  }

  if (campanaPersistida !== campanaId) {
    throw new Error(
      'PASO_122_ERROR: CAMPANA_ID persistida incorrecta'
    );
  }

  if (nombrePersistido !== 'Proyecto real paso 122') {
    throw new Error(
      'PASO_122_ERROR: NOMBRE persistido incorrecto'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 122 superada'
  );
}

function pruebaPaso123_SiguienteIdProyecto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaProyectos = ss.getSheetByName('02_PROYECTOS');
  const hojaCampanas = ss.getSheetByName('01_CAMPANAS');

  if (!hojaProyectos) {
    throw new Error(
      'PASO_123_ERROR: no existe la hoja 02_PROYECTOS'
    );
  }

  if (!hojaCampanas || hojaCampanas.getLastRow() < 2) {
    throw new Error(
      'PASO_123_ERROR: no existe una campaña válida'
    );
  }

  const cabecerasCampanas = hojaCampanas
    .getRange(
      1,
      1,
      1,
      hojaCampanas.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceIdCampana = cabecerasCampanas.indexOf('ID');

  if (indiceIdCampana === -1) {
    throw new Error(
      'PASO_123_ERROR: 01_CAMPANAS no contiene la columna ID'
    );
  }

  const campanaId = String(
    hojaCampanas
      .getRange(2, indiceIdCampana + 1)
      .getDisplayValue()
  ).trim();

  const filasIniciales = hojaProyectos.getLastRow();

  const resultado = insertarRegistroTransaccional(
    'PROYECTO',
    {
      CAMPANA_ID: campanaId,
      NOMBRE: 'Proyecto simulado paso 123',
      TIPO_PROYECTO: 'Urgente',
      PRIORIDAD: 'Alta',
      ESTADO: 'Borrador'
    },
    {
      dryRun: true
    }
  );

  SpreadsheetApp.flush();

  const filasFinales = hojaProyectos.getLastRow();

  console.log('ID simulado: ' + resultado.id);
  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (resultado.id !== 'PRO-0002') {
    throw new Error(
      'PASO_123_ERROR: se esperaba PRO-0002 y se obtuvo ' +
      resultado.id
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_123_ERROR: la hoja 02_PROYECTOS fue modificada'
    );
  }

  console.log(
    'OK: siguiente ID de proyecto verificado'
  );
}

function pruebaPaso124_EliminarProyectoPrueba() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('02_PROYECTOS');

  if (!hoja) {
    throw new Error(
      'PASO_124_ERROR: no existe la hoja 02_PROYECTOS'
    );
  }

  const ultimaFilaInicial = hoja.getLastRow();

  if (ultimaFilaInicial < 2) {
    throw new Error(
      'PASO_124_ERROR: no existen registros para eliminar'
    );
  }

  const cabeceras = hoja
    .getRange(1, 1, 1, hoja.getLastColumn())
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceId = cabeceras.indexOf('ID');
  const indiceNombre = cabeceras.indexOf('NOMBRE');

  if (indiceId === -1 || indiceNombre === -1) {
    throw new Error(
      'PASO_124_ERROR: faltan las columnas ID o NOMBRE'
    );
  }

  const datos = hoja
    .getRange(
      2,
      1,
      ultimaFilaInicial - 1,
      hoja.getLastColumn()
    )
    .getDisplayValues();

  const filasCoincidentes = [];

  datos.forEach(function(fila, indice) {
    const id = String(fila[indiceId]).trim();
    const nombre = String(fila[indiceNombre]).trim();

    if (
      id === 'PRO-0001' &&
      nombre === 'Proyecto real paso 122'
    ) {
      filasCoincidentes.push(indice + 2);
    }
  });

  console.log(
    'Registros coincidentes encontrados: ' +
    filasCoincidentes.length
  );

  if (filasCoincidentes.length !== 1) {
    throw new Error(
      'PASO_124_ERROR: se esperaba exactamente un registro coincidente'
    );
  }

  const filaEliminada = filasCoincidentes[0];

  hoja.deleteRow(filaEliminada);
  SpreadsheetApp.flush();

  const ultimaFilaFinal = hoja.getLastRow();

  console.log('Fila eliminada: ' + filaEliminada);
  console.log('Filas iniciales: ' + ultimaFilaInicial);
  console.log('Filas finales: ' + ultimaFilaFinal);

  if (ultimaFilaFinal !== ultimaFilaInicial - 1) {
    throw new Error(
      'PASO_124_ERROR: el número final de filas no es correcto'
    );
  }

  if (ultimaFilaFinal !== 1) {
    throw new Error(
      'PASO_124_ERROR: 02_PROYECTOS no quedó solo con cabeceras'
    );
  }

  console.log(
    'OK: proyecto de prueba eliminado'
  );

  console.log(
    'OK: prueba controlada del PASO 124 superada'
  );
}

function pruebaPaso125_ReinicioIdProyecto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaProyectos = ss.getSheetByName('02_PROYECTOS');
  const hojaCampanas = ss.getSheetByName('01_CAMPANAS');

  if (!hojaProyectos) {
    throw new Error(
      'PASO_125_ERROR: no existe la hoja 02_PROYECTOS'
    );
  }

  if (!hojaCampanas || hojaCampanas.getLastRow() < 2) {
    throw new Error(
      'PASO_125_ERROR: no existe una campaña válida'
    );
  }

  const cabecerasCampanas = hojaCampanas
    .getRange(
      1,
      1,
      1,
      hojaCampanas.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceIdCampana = cabecerasCampanas.indexOf('ID');

  if (indiceIdCampana === -1) {
    throw new Error(
      'PASO_125_ERROR: 01_CAMPANAS no contiene la columna ID'
    );
  }

  const campanaId = String(
    hojaCampanas
      .getRange(2, indiceIdCampana + 1)
      .getDisplayValue()
  ).trim();

  const filasIniciales = hojaProyectos.getLastRow();

  const resultado = insertarRegistroTransaccional(
    'PROYECTO',
    {
      CAMPANA_ID: campanaId,
      NOMBRE: 'Proyecto simulado paso 125',
      TIPO_PROYECTO: 'Urgente',
      PRIORIDAD: 'Alta',
      ESTADO: 'Borrador'
    },
    {
      dryRun: true
    }
  );

  SpreadsheetApp.flush();

  const filasFinales = hojaProyectos.getLastRow();

  console.log('ID simulado: ' + resultado.id);
  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (resultado.id !== 'PRO-0001') {
    throw new Error(
      'PASO_125_ERROR: se esperaba PRO-0001 y se obtuvo ' +
      resultado.id
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_125_ERROR: la hoja 02_PROYECTOS fue modificada'
    );
  }

  console.log(
    'OK: reinicio del ID de proyecto verificado'
  );
}

function pruebaPaso126_CabecerasProyectoProducto() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('04_PROYECTO_PRODUCTO');

  if (!hoja) {
    throw new Error(
      'PASO_126_ERROR: no existe la hoja 04_PROYECTO_PRODUCTO'
    );
  }

  const ultimaColumna = hoja.getLastColumn();

  if (ultimaColumna < 1) {
    throw new Error(
      'PASO_126_ERROR: la hoja no contiene columnas'
    );
  }

  const cabeceras = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  console.log(
    JSON.stringify(cabeceras, null, 2)
  );

  console.log(
    'Número de columnas: ' + cabeceras.length
  );

  if (
    !cabeceras.includes('PROYECTO_ID') ||
    !cabeceras.includes('PRODUCTO_ID')
  ) {
    throw new Error(
      'PASO_126_ERROR: faltan PROYECTO_ID o PRODUCTO_ID'
    );
  }

  console.log(
    'OK: estructura de 04_PROYECTO_PRODUCTO localizada'
  );
}

function pruebaPaso128_ProyectoRelacionInexistente() {
  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('04_PROYECTO_PRODUCTO');

  if (!hoja) {
    throw new Error(
      'PASO_128_ERROR: no existe 04_PROYECTO_PRODUCTO'
    );
  }

  const filasIniciales = hoja.getLastRow();
  let errorEsperadoDetectado = false;

  try {
    insertarRegistroTransaccional(
      'PROYECTO_PRODUCTO',
      {
        PROYECTO_ID: 'PRO-9999',
        PRODUCTO_ID: 'PRD-9999',
        CANTIDAD_ASIGNADA: 1,
        PRIORIDAD: 'Alta',
        ESTADO: 'Borrador'
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó un PROYECTO_ID inexistente'
    );
  } catch (error) {
    const mensaje = String(
      error && error.message ? error.message : error
    );

    console.log('Error controlado: ' + mensaje);

    errorEsperadoDetectado =
      mensaje.indexOf(
        'ERROR_INSERCION_PROYECTO_PRODUCTO'
      ) !== -1 &&
      mensaje.indexOf('PROYECTO_ID') !== -1 &&
      mensaje.indexOf('PRO-9999') !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: PROYECTO_ID inexistente rechazado'
        : 'ERR: el error recibido no coincide con el esperado'
    );
  }

  SpreadsheetApp.flush();

  const filasFinales = hoja.getLastRow();

  console.log('Filas iniciales: ' + filasIniciales);
  console.log('Filas finales: ' + filasFinales);
  console.log(
    'Hoja sin cambios: ' +
    (filasIniciales === filasFinales ? 'OK' : 'ERR')
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_128_ERROR: no se confirmó el rechazo de PROYECTO_ID'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_128_ERROR: 04_PROYECTO_PRODUCTO fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 128 superada'
  );
}

function pruebaPaso129_ProductoRelacionInexistente() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaRelaciones =
    ss.getSheetByName('04_PROYECTO_PRODUCTO');

  const hojaCampanas =
    ss.getSheetByName('01_CAMPANAS');

  const hojaProyectos =
    ss.getSheetByName('02_PROYECTOS');

  if (
    !hojaRelaciones ||
    !hojaCampanas ||
    !hojaProyectos
  ) {
    throw new Error(
      'PASO_129_ERROR: faltan hojas necesarias'
    );
  }

  const cabecerasCampanas = hojaCampanas
    .getRange(
      1,
      1,
      1,
      hojaCampanas.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceCampana =
    cabecerasCampanas.indexOf('ID');

  if (
    indiceCampana === -1 ||
    hojaCampanas.getLastRow() < 2
  ) {
    throw new Error(
      'PASO_129_ERROR: no existe una campaña válida'
    );
  }

  const campanaId = String(
    hojaCampanas
      .getRange(2, indiceCampana + 1)
      .getDisplayValue()
  ).trim();

  const filasRelacionesIniciales =
    hojaRelaciones.getLastRow();

  let proyectoId = '';
  let errorEsperadoDetectado = false;

  try {
    const resultadoProyecto =
      insertarRegistroTransaccional(
        'PROYECTO',
        {
          CAMPANA_ID: campanaId,
          NOMBRE: 'Proyecto temporal paso 129',
          TIPO_PROYECTO: 'Urgente',
          PRIORIDAD: 'Alta',
          ESTADO: 'Borrador'
        },
        {
          dryRun: false
        }
      );

    proyectoId = resultadoProyecto.id;

    insertarRegistroTransaccional(
      'PROYECTO_PRODUCTO',
      {
        PROYECTO_ID: proyectoId,
        PRODUCTO_ID: 'PRD-9999',
        CANTIDAD_ASIGNADA: 1,
        PRIORIDAD: 'Alta',
        ESTADO: 'Borrador'
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó un PRODUCTO_ID inexistente'
    );

  } catch (error) {
    const mensaje = String(
      error && error.message
        ? error.message
        : error
    );

    console.log(
      'Error controlado: ' + mensaje
    );

    errorEsperadoDetectado =
      mensaje.indexOf(
        'ERROR_INSERCION_PROYECTO_PRODUCTO'
      ) !== -1 &&
      mensaje.indexOf('PRODUCTO_ID') !== -1 &&
      mensaje.indexOf('PRD-9999') !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: PRODUCTO_ID inexistente rechazado'
        : 'ERR: el error recibido no coincide con el esperado'
    );

  } finally {
    if (proyectoId !== '') {
      const cabecerasProyectos = hojaProyectos
        .getRange(
          1,
          1,
          1,
          hojaProyectos.getLastColumn()
        )
        .getDisplayValues()[0]
        .map(function(valor) {
          return String(valor).trim();
        });

      const indiceProyecto =
        cabecerasProyectos.indexOf('ID');

      const ultimaFilaProyecto =
        hojaProyectos.getLastRow();

      if (
        indiceProyecto !== -1 &&
        ultimaFilaProyecto >= 2
      ) {
        const ids = hojaProyectos
          .getRange(
            2,
            indiceProyecto + 1,
            ultimaFilaProyecto - 1,
            1
          )
          .getDisplayValues()
          .flat();

        for (
          let indice = ids.length - 1;
          indice >= 0;
          indice--
        ) {
          if (
            String(ids[indice]).trim() ===
            proyectoId
          ) {
            hojaProyectos.deleteRow(indice + 2);
          }
        }
      }
    }
  }

  SpreadsheetApp.flush();

  const filasRelacionesFinales =
    hojaRelaciones.getLastRow();

  console.log(
    'Proyecto temporal utilizado: ' +
    proyectoId
  );

  console.log(
    'Filas iniciales: ' +
    filasRelacionesIniciales
  );

  console.log(
    'Filas finales: ' +
    filasRelacionesFinales
  );

  console.log(
    'Hoja sin cambios: ' +
    (
      filasRelacionesIniciales ===
      filasRelacionesFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_129_ERROR: no se confirmó el rechazo de PRODUCTO_ID'
    );
  }

  if (
    filasRelacionesIniciales !==
    filasRelacionesFinales
  ) {
    throw new Error(
      'PASO_129_ERROR: 04_PROYECTO_PRODUCTO fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 129 superada'
  );
}

function pruebaPaso130_ListarRangosProyectoProducto() {
  const nombres = SpreadsheetApp
    .getActiveSpreadsheet()
    .getNamedRanges()
    .map(function(rango) {
      return rango.getName();
    })
    .filter(function(nombre) {
      return nombre.includes('PRIORIDAD') ||
        nombre.includes('ESTADO_PROYECTO_PRODUCTO');
    })
    .sort();

  console.log(
    JSON.stringify(nombres, null, 2)
  );

  console.log(
    'Rangos encontrados: ' +
    nombres.length
  );

  if (
    !nombres.includes('CFG_PRIORIDAD')
  ) {
    throw new Error(
      'PASO_130_ERROR: no existe CFG_PRIORIDAD'
    );
  }

  console.log(
    'OK: rangos de relación proyecto-producto localizados'
  );
}

function pruebaPaso131_PrioridadRelacionInvalida() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaRelaciones =
    ss.getSheetByName('04_PROYECTO_PRODUCTO');

  const hojaCampanas =
    ss.getSheetByName('01_CAMPANAS');

  const hojaProyectos =
    ss.getSheetByName('02_PROYECTOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaRelaciones ||
    !hojaCampanas ||
    !hojaProyectos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_131_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo = function(nombreRango) {
    const rango = ss.getRangeByName(nombreRango);

    if (!rango) {
      throw new Error(
        'PASO_131_ERROR: no existe el rango ' +
        nombreRango
      );
    }

    const valores = rango
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return String(valor).trim();
      })
      .filter(function(valor) {
        return valor !== '';
      });

    if (valores.length === 0) {
      throw new Error(
        'PASO_131_ERROR: el rango ' +
        nombreRango +
        ' no contiene valores'
      );
    }

    return valores[0];
  };

  const origenProducto =
    obtenerPrimerValorCatalogo(
      'CFG_ORIGEN_PRODUCTO'
    );

  const unidadProducto =
    obtenerPrimerValorCatalogo(
      'CFG_UNIDAD'
    );

  const estadoProducto =
    obtenerPrimerValorCatalogo(
      'CFG_ESTADO_PRODUCTO'
    );

  let proyectoId = '';
  let productoId = '';
  let errorEsperadoDetectado = false;

  const filasRelacionesIniciales =
    hojaRelaciones.getLastRow();

  try {
    if (hojaCampanas.getLastRow() < 2) {
      throw new Error(
        'PASO_131_ERROR: no existe una campaña válida'
      );
    }

    const cabecerasCampanas = hojaCampanas
      .getRange(
        1,
        1,
        1,
        hojaCampanas.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

    const indiceCampana =
      cabecerasCampanas.indexOf('ID');

    if (indiceCampana === -1) {
      throw new Error(
        'PASO_131_ERROR: 01_CAMPANAS no contiene ID'
      );
    }

    const campanaId = String(
      hojaCampanas
        .getRange(
          2,
          indiceCampana + 1
        )
        .getDisplayValue()
    ).trim();

    const resultadoProyecto =
      insertarRegistroTransaccional(
        'PROYECTO',
        {
          CAMPANA_ID: campanaId,
          NOMBRE: 'Proyecto temporal paso 131',
          TIPO_PROYECTO: 'Urgente',
          PRIORIDAD: 'Alta',
          ESTADO: 'Borrador'
        },
        {
          dryRun: false
        }
      );

    proyectoId = resultadoProyecto.id;

    const resultadoProducto =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P131',
          NOMBRE: 'Producto temporal paso 131',
          ORIGEN: origenProducto,
          UNIDAD: unidadProducto,
          ESTADO: estadoProducto
        },
        {
          dryRun: false
        }
      );

    productoId = resultadoProducto.id;

    insertarRegistroTransaccional(
      'PROYECTO_PRODUCTO',
      {
        PROYECTO_ID: proyectoId,
        PRODUCTO_ID: productoId,
        CANTIDAD_ASIGNADA: 1,
        PRIORIDAD: 'PRIORIDAD_INEXISTENTE',
        ESTADO: 'Borrador'
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó una PRIORIDAD inexistente'
    );

  } catch (error) {
    const mensaje = String(
      error && error.message
        ? error.message
        : error
    );

    console.log(
      'Error controlado: ' + mensaje
    );

    errorEsperadoDetectado =
      mensaje.indexOf(
        'ERROR_INSERCION_PROYECTO_PRODUCTO'
      ) !== -1 &&
      mensaje.indexOf('PRIORIDAD') !== -1 &&
      mensaje.indexOf('CFG_PRIORIDAD') !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: PRIORIDAD inválida rechazada'
        : 'ERR: el error recibido no coincide con el esperado'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProyectos,
      proyectoId
    );

    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }

  SpreadsheetApp.flush();

  const filasRelacionesFinales =
    hojaRelaciones.getLastRow();

  console.log(
    'ORIGEN válido utilizado: ' +
    origenProducto
  );

  console.log(
    'UNIDAD válida utilizada: ' +
    unidadProducto
  );

  console.log(
    'ESTADO de producto utilizado: ' +
    estadoProducto
  );

  console.log(
    'Proyecto temporal utilizado: ' +
    proyectoId
  );

  console.log(
    'Producto temporal utilizado: ' +
    productoId
  );

  console.log(
    'Filas iniciales: ' +
    filasRelacionesIniciales
  );

  console.log(
    'Filas finales: ' +
    filasRelacionesFinales
  );

  console.log(
    'Hoja sin cambios: ' +
    (
      filasRelacionesIniciales ===
      filasRelacionesFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_131_ERROR: no se confirmó el rechazo de PRIORIDAD'
    );
  }

  if (
    filasRelacionesIniciales !==
    filasRelacionesFinales
  ) {
    throw new Error(
      'PASO_131_ERROR: 04_PROYECTO_PRODUCTO fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 131 superada'
  );
}

function eliminarRegistroPruebaPorId_(hoja, id) {
  if (!hoja || !id || hoja.getLastRow() < 2) {
    return;
  }

  const cabeceras = hoja
    .getRange(
      1,
      1,
      1,
      hoja.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceId = cabeceras.indexOf('ID');

  if (indiceId === -1) {
    return;
  }

  const ids = hoja
    .getRange(
      2,
      indiceId + 1,
      hoja.getLastRow() - 1,
      1
    )
    .getDisplayValues()
    .flat();

  for (
    let indice = ids.length - 1;
    indice >= 0;
    indice--
  ) {
    if (
      String(ids[indice]).trim() === id
    ) {
      hoja.deleteRow(indice + 2);
      return;
    }
  }
}


function pruebaPaso132_CantidadRelacionInvalida() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaRelaciones =
    ss.getSheetByName('04_PROYECTO_PRODUCTO');

  const hojaCampanas =
    ss.getSheetByName('01_CAMPANAS');

  const hojaProyectos =
    ss.getSheetByName('02_PROYECTOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaRelaciones ||
    !hojaCampanas ||
    !hojaProyectos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_132_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo = function(nombreRango) {
    const rango = ss.getRangeByName(nombreRango);

    if (!rango) {
      throw new Error(
        'PASO_132_ERROR: no existe el rango ' +
        nombreRango
      );
    }

    const valores = rango
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return String(valor).trim();
      })
      .filter(function(valor) {
        return valor !== '';
      });

    if (valores.length === 0) {
      throw new Error(
        'PASO_132_ERROR: catálogo vacío: ' +
        nombreRango
      );
    }

    return valores[0];
  };

  let proyectoId = '';
  let productoId = '';
  let errorEsperadoDetectado = false;

  const filasIniciales =
    hojaRelaciones.getLastRow();

  try {
    const cabecerasCampanas = hojaCampanas
      .getRange(
        1,
        1,
        1,
        hojaCampanas.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

    const indiceCampana =
      cabecerasCampanas.indexOf('ID');

    if (
      indiceCampana === -1 ||
      hojaCampanas.getLastRow() < 2
    ) {
      throw new Error(
        'PASO_132_ERROR: no existe una campaña válida'
      );
    }

    const campanaId = String(
      hojaCampanas
        .getRange(
          2,
          indiceCampana + 1
        )
        .getDisplayValue()
    ).trim();

    proyectoId =
      insertarRegistroTransaccional(
        'PROYECTO',
        {
          CAMPANA_ID: campanaId,
          NOMBRE: 'Proyecto temporal paso 132',
          TIPO_PROYECTO: 'Urgente',
          PRIORIDAD: 'Alta',
          ESTADO: 'Borrador'
        },
        {
          dryRun: false
        }
      ).id;

    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P132',
          NOMBRE: 'Producto temporal paso 132',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    insertarRegistroTransaccional(
      'PROYECTO_PRODUCTO',
      {
        PROYECTO_ID: proyectoId,
        PRODUCTO_ID: productoId,
        CANTIDAD_ASIGNADA: 0,
        PRIORIDAD: 'Alta',
        ESTADO: 'Borrador'
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó CANTIDAD_ASIGNADA igual a 0'
    );

  } catch (error) {
    const mensaje = String(
      error && error.message
        ? error.message
        : error
    );

    console.log(
      'Error controlado: ' + mensaje
    );

    errorEsperadoDetectado =
      mensaje.indexOf(
        'ERROR_INSERCION_PROYECTO_PRODUCTO'
      ) !== -1 &&
      mensaje.indexOf('CANTIDAD_ASIGNADA') !== -1 &&
      mensaje.indexOf('mayor que 0') !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: CANTIDAD_ASIGNADA inválida rechazada'
        : 'ERR: el error recibido no coincide con el esperado'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProyectos,
      proyectoId
    );

    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }

  SpreadsheetApp.flush();

  const filasFinales =
    hojaRelaciones.getLastRow();

  console.log(
    'Proyecto temporal utilizado: ' +
    proyectoId
  );

  console.log(
    'Producto temporal utilizado: ' +
    productoId
  );

  console.log(
    'Filas iniciales: ' +
    filasIniciales
  );

  console.log(
    'Filas finales: ' +
    filasFinales
  );

  console.log(
    'Hoja sin cambios: ' +
    (
      filasIniciales === filasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_132_ERROR: no se confirmó el rechazo de CANTIDAD_ASIGNADA'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_132_ERROR: 04_PROYECTO_PRODUCTO fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 132 superada'
  );
}


function pruebaPaso133_RelacionValidaDryRun() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaRelaciones =
    ss.getSheetByName('04_PROYECTO_PRODUCTO');

  const hojaCampanas =
    ss.getSheetByName('01_CAMPANAS');

  const hojaProyectos =
    ss.getSheetByName('02_PROYECTOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaRelaciones ||
    !hojaCampanas ||
    !hojaProyectos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_133_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo = function(nombreRango) {
    const rango = ss.getRangeByName(nombreRango);

    if (!rango) {
      throw new Error(
        'PASO_133_ERROR: no existe el rango ' +
        nombreRango
      );
    }

    const valores = rango
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return String(valor).trim();
      })
      .filter(function(valor) {
        return valor !== '';
      });

    if (valores.length === 0) {
      throw new Error(
        'PASO_133_ERROR: catálogo vacío: ' +
        nombreRango
      );
    }

    return valores[0];
  };

  let proyectoId = '';
  let productoId = '';

  const filasIniciales =
    hojaRelaciones.getLastRow();

  try {
    const cabecerasCampanas = hojaCampanas
      .getRange(
        1,
        1,
        1,
        hojaCampanas.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

    const indiceCampana =
      cabecerasCampanas.indexOf('ID');

    if (
      indiceCampana === -1 ||
      hojaCampanas.getLastRow() < 2
    ) {
      throw new Error(
        'PASO_133_ERROR: no existe una campaña válida'
      );
    }

    const campanaId = String(
      hojaCampanas
        .getRange(
          2,
          indiceCampana + 1
        )
        .getDisplayValue()
    ).trim();

    proyectoId =
      insertarRegistroTransaccional(
        'PROYECTO',
        {
          CAMPANA_ID: campanaId,
          NOMBRE: 'Proyecto temporal paso 133',
          TIPO_PROYECTO: 'Urgente',
          PRIORIDAD: 'Alta',
          ESTADO: 'Borrador'
        },
        {
          dryRun: false
        }
      ).id;

    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P133',
          NOMBRE: 'Producto temporal paso 133',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    const resultado =
      insertarRegistroTransaccional(
        'PROYECTO_PRODUCTO',
        {
          PROYECTO_ID: proyectoId,
          PRODUCTO_ID: productoId,
          CANTIDAD_ASIGNADA: 1,
          PRIORIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_PRIORIDAD'
            ),
          ESTADO: 'Borrador'
        },
        {
          dryRun: true
        }
      );

    SpreadsheetApp.flush();

    const filasFinales =
      hojaRelaciones.getLastRow();

    console.log(
      'OK: relación válida aceptada en dryRun'
    );

    console.log(
      'Proyecto temporal utilizado: ' +
      proyectoId
    );

    console.log(
      'Producto temporal utilizado: ' +
      productoId
    );

    console.log(
      'ID simulado: ' +
      resultado.id
    );

    console.log(
      'Fila destino: ' +
      resultado.filaDestino
    );

    console.log(
      'Columnas: ' +
      resultado.columnas
    );

    console.log(
      'Filas iniciales: ' +
      filasIniciales
    );

    console.log(
      'Filas finales: ' +
      filasFinales
    );

    console.log(
      'Hoja sin cambios: ' +
      (
        filasIniciales === filasFinales
          ? 'OK'
          : 'ERR'
      )
    );

    if (!resultado.ok || !resultado.dryRun) {
      throw new Error(
        'PASO_133_ERROR: resultado dryRun inválido'
      );
    }

    if (!String(resultado.id).startsWith('PPR-')) {
      throw new Error(
        'PASO_133_ERROR: prefijo de ID incorrecto: ' +
        resultado.id
      );
    }

    if (filasIniciales !== filasFinales) {
      throw new Error(
        'PASO_133_ERROR: 04_PROYECTO_PRODUCTO fue modificada'
      );
    }

    console.log(
      'OK: prueba controlada del PASO 133 superada'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProyectos,
      proyectoId
    );

    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }
}

function pruebaPaso134_InsertarRelacionReal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaRelaciones =
    ss.getSheetByName('04_PROYECTO_PRODUCTO');

  const hojaCampanas =
    ss.getSheetByName('01_CAMPANAS');

  const hojaProyectos =
    ss.getSheetByName('02_PROYECTOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaRelaciones ||
    !hojaCampanas ||
    !hojaProyectos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_134_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo = function(nombreRango) {
    const rango = ss.getRangeByName(nombreRango);

    if (!rango) {
      throw new Error(
        'PASO_134_ERROR: no existe el rango ' +
        nombreRango
      );
    }

    const valores = rango
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return String(valor).trim();
      })
      .filter(function(valor) {
        return valor !== '';
      });

    if (valores.length === 0) {
      throw new Error(
        'PASO_134_ERROR: catálogo vacío: ' +
        nombreRango
      );
    }

    return valores[0];
  };

  let proyectoId = '';
  let productoId = '';
  let relacionId = '';

  const filasIniciales =
    hojaRelaciones.getLastRow();

  try {
    const cabecerasCampanas = hojaCampanas
      .getRange(
        1,
        1,
        1,
        hojaCampanas.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

    const indiceCampana =
      cabecerasCampanas.indexOf('ID');

    if (
      indiceCampana === -1 ||
      hojaCampanas.getLastRow() < 2
    ) {
      throw new Error(
        'PASO_134_ERROR: no existe una campaña válida'
      );
    }

    const campanaId = String(
      hojaCampanas
        .getRange(
          2,
          indiceCampana + 1
        )
        .getDisplayValue()
    ).trim();

    proyectoId =
      insertarRegistroTransaccional(
        'PROYECTO',
        {
          CAMPANA_ID: campanaId,
          NOMBRE: 'Proyecto temporal paso 134',
          TIPO_PROYECTO: 'Urgente',
          PRIORIDAD: 'Alta',
          ESTADO: 'Borrador'
        },
        {
          dryRun: false
        }
      ).id;

    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P134',
          NOMBRE: 'Producto temporal paso 134',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    const resultado =
      insertarRegistroTransaccional(
        'PROYECTO_PRODUCTO',
        {
          PROYECTO_ID: proyectoId,
          PRODUCTO_ID: productoId,
          CANTIDAD_ASIGNADA: 2,
          PRIORIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_PRIORIDAD'
            ),
          ESTADO: 'Borrador'
        },
        {
          dryRun: false
        }
      );

    relacionId = resultado.id;

    SpreadsheetApp.flush();

    const filasFinales =
      hojaRelaciones.getLastRow();

    const cabeceras = hojaRelaciones
      .getRange(
        1,
        1,
        1,
        hojaRelaciones.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

    const indiceId =
      cabeceras.indexOf('ID');

    const indiceProyecto =
      cabeceras.indexOf('PROYECTO_ID');

    const indiceProducto =
      cabeceras.indexOf('PRODUCTO_ID');

    const indiceCantidad =
      cabeceras.indexOf('CANTIDAD_ASIGNADA');

    if (
      indiceId === -1 ||
      indiceProyecto === -1 ||
      indiceProducto === -1 ||
      indiceCantidad === -1
    ) {
      throw new Error(
        'PASO_134_ERROR: faltan columnas obligatorias'
      );
    }

    const filaInsertada = hojaRelaciones
      .getRange(
        filasFinales,
        1,
        1,
        hojaRelaciones.getLastColumn()
      )
      .getValues()[0];

    const idPersistido =
      String(filaInsertada[indiceId]).trim();

    const proyectoPersistido =
      String(filaInsertada[indiceProyecto]).trim();

    const productoPersistido =
      String(filaInsertada[indiceProducto]).trim();

    const cantidadPersistida =
      filaInsertada[indiceCantidad];

    console.log(
      'OK: relación insertada realmente'
    );

    console.log(
      'ID generado: ' +
      relacionId
    );

    console.log(
      'ID persistido: ' +
      idPersistido
    );

    console.log(
      'PROYECTO_ID persistido: ' +
      proyectoPersistido
    );

    console.log(
      'PRODUCTO_ID persistido: ' +
      productoPersistido
    );

    console.log(
      'CANTIDAD_ASIGNADA persistida: ' +
      cantidadPersistida
    );

    console.log(
      'Filas iniciales: ' +
      filasIniciales
    );

    console.log(
      'Filas finales: ' +
      filasFinales
    );

    if (filasFinales !== filasIniciales + 1) {
      throw new Error(
        'PASO_134_ERROR: no se añadió exactamente una fila'
      );
    }

    if (idPersistido !== relacionId) {
      throw new Error(
        'PASO_134_ERROR: ID persistido incorrecto'
      );
    }

    if (proyectoPersistido !== proyectoId) {
      throw new Error(
        'PASO_134_ERROR: PROYECTO_ID persistido incorrecto'
      );
    }

    if (productoPersistido !== productoId) {
      throw new Error(
        'PASO_134_ERROR: PRODUCTO_ID persistido incorrecto'
      );
    }

    if (cantidadPersistida !== 2) {
      throw new Error(
        'PASO_134_ERROR: CANTIDAD_ASIGNADA persistida incorrecta'
      );
    }

    console.log(
      'OK: prueba controlada del PASO 134 superada'
    );

  } catch (error) {
    if (relacionId !== '') {
      eliminarRegistroPruebaPorId_(
        hojaRelaciones,
        relacionId
      );
    }

    eliminarRegistroPruebaPorId_(
      hojaProyectos,
      proyectoId
    );

    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );

    throw error;
  }
}

function pruebaPaso135_EliminarDatosRelacionPrueba() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaRelaciones =
    ss.getSheetByName('04_PROYECTO_PRODUCTO');

  const hojaProyectos =
    ss.getSheetByName('02_PROYECTOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaRelaciones ||
    !hojaProyectos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_135_ERROR: faltan hojas necesarias'
    );
  }

  const filasRelacionesIniciales =
    hojaRelaciones.getLastRow();

  const filasProyectosIniciales =
    hojaProyectos.getLastRow();

  const filasProductosIniciales =
    hojaProductos.getLastRow();

  eliminarRegistroPruebaPorId_(
    hojaRelaciones,
    'PPR-0001'
  );

  eliminarRegistroPruebaPorId_(
    hojaProyectos,
    'PRO-0001'
  );

  eliminarRegistroPruebaPorId_(
    hojaProductos,
    'PRD-0001'
  );

  SpreadsheetApp.flush();

  const filasRelacionesFinales =
    hojaRelaciones.getLastRow();

  const filasProyectosFinales =
    hojaProyectos.getLastRow();

  const filasProductosFinales =
    hojaProductos.getLastRow();

  console.log(
    'Relaciones: ' +
    filasRelacionesIniciales +
    ' → ' +
    filasRelacionesFinales
  );

  console.log(
    'Proyectos: ' +
    filasProyectosIniciales +
    ' → ' +
    filasProyectosFinales
  );

  console.log(
    'Productos: ' +
    filasProductosIniciales +
    ' → ' +
    filasProductosFinales
  );

  if (filasRelacionesFinales !== 1) {
    throw new Error(
      'PASO_135_ERROR: 04_PROYECTO_PRODUCTO no quedó solo con cabeceras'
    );
  }

  if (filasProyectosFinales !== 1) {
    throw new Error(
      'PASO_135_ERROR: 02_PROYECTOS no quedó solo con cabeceras'
    );
  }

  if (filasProductosFinales !== 1) {
    throw new Error(
      'PASO_135_ERROR: 03_PRODUCTOS no quedó solo con cabeceras'
    );
  }

  console.log(
    'OK: datos reales de prueba eliminados'
  );

  console.log(
    'OK: prueba controlada del PASO 135 superada'
  );
}

function pruebaPaso136_ReinicioIdRelacion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaRelaciones =
    ss.getSheetByName('04_PROYECTO_PRODUCTO');

  const hojaCampanas =
    ss.getSheetByName('01_CAMPANAS');

  const hojaProyectos =
    ss.getSheetByName('02_PROYECTOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaRelaciones ||
    !hojaCampanas ||
    !hojaProyectos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_136_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo = function(nombreRango) {
    const rango = ss.getRangeByName(nombreRango);

    if (!rango) {
      throw new Error(
        'PASO_136_ERROR: no existe el rango ' +
        nombreRango
      );
    }

    const valores = rango
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return String(valor).trim();
      })
      .filter(function(valor) {
        return valor !== '';
      });

    if (valores.length === 0) {
      throw new Error(
        'PASO_136_ERROR: catálogo vacío: ' +
        nombreRango
      );
    }

    return valores[0];
  };

  let proyectoId = '';
  let productoId = '';

  const filasIniciales =
    hojaRelaciones.getLastRow();

  try {
    const cabecerasCampanas = hojaCampanas
      .getRange(
        1,
        1,
        1,
        hojaCampanas.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

    const indiceCampana =
      cabecerasCampanas.indexOf('ID');

    if (
      indiceCampana === -1 ||
      hojaCampanas.getLastRow() < 2
    ) {
      throw new Error(
        'PASO_136_ERROR: no existe una campaña válida'
      );
    }

    const campanaId = String(
      hojaCampanas
        .getRange(
          2,
          indiceCampana + 1
        )
        .getDisplayValue()
    ).trim();

    proyectoId =
      insertarRegistroTransaccional(
        'PROYECTO',
        {
          CAMPANA_ID: campanaId,
          NOMBRE: 'Proyecto temporal paso 136',
          TIPO_PROYECTO: 'Urgente',
          PRIORIDAD: 'Alta',
          ESTADO: 'Borrador'
        },
        {
          dryRun: false
        }
      ).id;

    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P136',
          NOMBRE: 'Producto temporal paso 136',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    const resultado =
      insertarRegistroTransaccional(
        'PROYECTO_PRODUCTO',
        {
          PROYECTO_ID: proyectoId,
          PRODUCTO_ID: productoId,
          CANTIDAD_ASIGNADA: 1,
          PRIORIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_PRIORIDAD'
            ),
          ESTADO: 'Borrador'
        },
        {
          dryRun: true
        }
      );

    SpreadsheetApp.flush();

    const filasFinales =
      hojaRelaciones.getLastRow();

    console.log(
      'ID simulado: ' +
      resultado.id
    );

    console.log(
      'Filas iniciales: ' +
      filasIniciales
    );

    console.log(
      'Filas finales: ' +
      filasFinales
    );

    console.log(
      'Hoja sin cambios: ' +
      (
        filasIniciales === filasFinales
          ? 'OK'
          : 'ERR'
      )
    );

    if (resultado.id !== 'PPR-0001') {
      throw new Error(
        'PASO_136_ERROR: se esperaba PPR-0001 y se obtuvo ' +
        resultado.id
      );
    }

    if (filasIniciales !== filasFinales) {
      throw new Error(
        'PASO_136_ERROR: 04_PROYECTO_PRODUCTO fue modificada'
      );
    }

    console.log(
      'OK: reinicio del ID de relación verificado'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProyectos,
      proyectoId
    );

    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }
}

function pruebaPaso137_RelacionDuplicada() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaRelaciones =
    ss.getSheetByName('04_PROYECTO_PRODUCTO');

  const hojaCampanas =
    ss.getSheetByName('01_CAMPANAS');

  const hojaProyectos =
    ss.getSheetByName('02_PROYECTOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaRelaciones ||
    !hojaCampanas ||
    !hojaProyectos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_137_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo = function(nombreRango) {
    const rango = ss.getRangeByName(nombreRango);

    if (!rango) {
      throw new Error(
        'PASO_137_ERROR: no existe el rango ' +
        nombreRango
      );
    }

    const valores = rango
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return String(valor).trim();
      })
      .filter(function(valor) {
        return valor !== '';
      });

    if (valores.length === 0) {
      throw new Error(
        'PASO_137_ERROR: catálogo vacío: ' +
        nombreRango
      );
    }

    return valores[0];
  };

  let proyectoId = '';
  let productoId = '';
  let relacionId = '';
  let errorEsperadoDetectado = false;

  const filasIniciales =
    hojaRelaciones.getLastRow();

  try {
    const cabecerasCampanas = hojaCampanas
      .getRange(
        1,
        1,
        1,
        hojaCampanas.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

    const indiceCampana =
      cabecerasCampanas.indexOf('ID');

    if (
      indiceCampana === -1 ||
      hojaCampanas.getLastRow() < 2
    ) {
      throw new Error(
        'PASO_137_ERROR: no existe una campaña válida'
      );
    }

    const campanaId = String(
      hojaCampanas
        .getRange(2, indiceCampana + 1)
        .getDisplayValue()
    ).trim();

    proyectoId =
      insertarRegistroTransaccional(
        'PROYECTO',
        {
          CAMPANA_ID: campanaId,
          NOMBRE: 'Proyecto temporal paso 137',
          TIPO_PROYECTO: 'Urgente',
          PRIORIDAD: 'Alta',
          ESTADO: 'Borrador'
        },
        {
          dryRun: false
        }
      ).id;

    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P137',
          NOMBRE: 'Producto temporal paso 137',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    relacionId =
      insertarRegistroTransaccional(
        'PROYECTO_PRODUCTO',
        {
          PROYECTO_ID: proyectoId,
          PRODUCTO_ID: productoId,
          CANTIDAD_ASIGNADA: 1,
          PRIORIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_PRIORIDAD'
            ),
          ESTADO: 'Borrador'
        },
        {
          dryRun: false
        }
      ).id;

    insertarRegistroTransaccional(
      'PROYECTO_PRODUCTO',
      {
        PROYECTO_ID: proyectoId,
        PRODUCTO_ID: productoId,
        CANTIDAD_ASIGNADA: 2,
        PRIORIDAD:
          obtenerPrimerValorCatalogo(
            'CFG_PRIORIDAD'
          ),
        ESTADO: 'Borrador'
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó una relación duplicada'
    );

  } catch (error) {
    const mensaje = String(
      error && error.message
        ? error.message
        : error
    );

    console.log(
      'Error controlado: ' + mensaje
    );

    errorEsperadoDetectado =
      mensaje.indexOf(
        'ERROR_INSERCION_PROYECTO_PRODUCTO'
      ) !== -1 &&
      mensaje.indexOf('duplicada') !== -1 &&
      mensaje.indexOf(proyectoId) !== -1 &&
      mensaje.indexOf(productoId) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: relación duplicada rechazada'
        : 'ERR: el error recibido no coincide con el esperado'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaRelaciones,
      relacionId
    );

    eliminarRegistroPruebaPorId_(
      hojaProyectos,
      proyectoId
    );

    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }

  SpreadsheetApp.flush();

  const filasFinales =
    hojaRelaciones.getLastRow();

  console.log(
    'Relación temporal utilizada: ' +
    relacionId
  );

  console.log(
    'Filas iniciales: ' +
    filasIniciales
  );

  console.log(
    'Filas finales: ' +
    filasFinales
  );

  console.log(
    'Hoja restaurada: ' +
    (
      filasIniciales === filasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_137_ERROR: no se confirmó el rechazo de relación duplicada'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_137_ERROR: 04_PROYECTO_PRODUCTO no fue restaurada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 137 superada'
  );
}

function pruebaPaso138_CabecerasProcesos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hoja =
    ss.getSheetByName('05_PROCESOS');

  if (!hoja) {
    throw new Error(
      'PASO_138_ERROR: no existe la hoja 05_PROCESOS'
    );
  }

  const ultimaColumna =
    hoja.getLastColumn();

  if (ultimaColumna < 1) {
    throw new Error(
      'PASO_138_ERROR: la hoja no contiene columnas'
    );
  }

  const cabeceras = hoja
    .getRange(
      1,
      1,
      1,
      ultimaColumna
    )
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  console.log(
    'Hoja: ' +
    hoja.getName()
  );

  console.log(
    'Columnas: ' +
    cabeceras.length
  );

  cabeceras.forEach(function(cabecera, indice) {
    console.log(
      (indice + 1) +
      ': ' +
      cabecera
    );
  });

  const cabecerasVacias =
    cabeceras
      .map(function(cabecera, indice) {
        return cabecera === ''
          ? indice + 1
          : null;
      })
      .filter(function(indice) {
        return indice !== null;
      });

  if (cabecerasVacias.length > 0) {
    throw new Error(
      'PASO_138_ERROR: cabeceras vacías en columnas: ' +
      cabecerasVacias.join(', ')
    );
  }

  console.log(
    'OK: cabeceras de 05_PROCESOS leídas correctamente'
  );
}

function pruebaPaso139_ConfiguracionEntidadProceso() {
  if (
    typeof ENTIDADES_MVP === 'undefined' ||
    !ENTIDADES_MVP
  ) {
    throw new Error(
      'PASO_139_ERROR: ENTIDADES_MVP no está definido'
    );
  }

  const entidad =
    ENTIDADES_MVP.PROCESO;

  if (!entidad) {
    throw new Error(
      'PASO_139_ERROR: no existe la entidad PROCESO'
    );
  }

  console.log(
    'Entidad: PROCESO'
  );

  console.log(
    'Hoja configurada: ' +
    entidad.hoja
  );

  console.log(
    'Prefijo configurado: ' +
    entidad.prefijo
  );

  if (entidad.hoja !== '05_PROCESOS') {
    throw new Error(
      'PASO_139_ERROR: hoja incorrecta para PROCESO: ' +
      entidad.hoja
    );
  }

  if (entidad.prefijo !== 'PCS') {
    throw new Error(
      'PASO_139_ERROR: prefijo incorrecto para PROCESO: ' +
      entidad.prefijo
    );
  }

  console.log(
    'OK: entidad PROCESO configurada correctamente'
  );

  console.log(
    'OK: prueba controlada del PASO 139 superada'
  );
}


function pruebaPaso140_ProcesoProductoInexistente() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  if (!hojaProcesos) {
    throw new Error(
      'PASO_140_ERROR: no existe la hoja 05_PROCESOS'
    );
  }

  const filasIniciales =
    hojaProcesos.getLastRow();

  let errorEsperadoDetectado = false;

  try {
    insertarRegistroTransaccional(
      'PROCESO',
      {
        PRODUCTO_ID: 'PRD-INEXISTENTE',
        NOMBRE: 'Proceso temporal paso 140',
        ORDEN_SECUENCIA: 1,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO: 'Borrador',
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó un PRODUCTO_ID inexistente'
    );

  } catch (error) {
    const mensaje = String(
      error && error.message
        ? error.message
        : error
    );

    console.log(
      'Error controlado: ' + mensaje
    );

    errorEsperadoDetectado =
      mensaje.indexOf(
        'ERROR_INSERCION_PROCESO'
      ) !== -1 &&
      mensaje.indexOf(
        'PRODUCTO_ID'
      ) !== -1 &&
      mensaje.indexOf(
        'no existe'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: PRODUCTO_ID inexistente rechazado'
        : 'ERR: el error recibido no coincide con el esperado'
    );
  }

  SpreadsheetApp.flush();

  const filasFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Filas iniciales: ' +
    filasIniciales
  );

  console.log(
    'Filas finales: ' +
    filasFinales
  );

  console.log(
    'Hoja sin cambios: ' +
    (
      filasIniciales === filasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_140_ERROR: no se confirmó el rechazo del PRODUCTO_ID inexistente'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_140_ERROR: 05_PROCESOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 140 superada'
  );
}


function pruebaPaso141_OrdenSecuenciaInvalido() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_141_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo = function(nombreRango) {
    const rango = ss.getRangeByName(nombreRango);

    if (!rango) {
      throw new Error(
        'PASO_141_ERROR: no existe el rango ' +
        nombreRango
      );
    }

    const valores = rango
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return String(valor).trim();
      })
      .filter(function(valor) {
        return valor !== '';
      });

    if (valores.length === 0) {
      throw new Error(
        'PASO_141_ERROR: catálogo vacío: ' +
        nombreRango
      );
    }

    return valores[0];
  };

  let productoId = '';
  let errorEsperadoDetectado = false;

  const filasIniciales =
    hojaProcesos.getLastRow();

  try {
    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P141',
          NOMBRE: 'Producto temporal paso 141',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    insertarRegistroTransaccional(
      'PROCESO',
      {
        PRODUCTO_ID: productoId,
        NOMBRE: 'Proceso temporal paso 141',
        ORDEN_SECUENCIA: 0,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO: 'Borrador',
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó ORDEN_SECUENCIA igual a 0'
    );

  } catch (error) {
    const mensaje = String(
      error && error.message
        ? error.message
        : error
    );

    console.log(
      'Error controlado: ' +
      mensaje
    );

    errorEsperadoDetectado =
      mensaje.indexOf(
        'ERROR_INSERCION_PROCESO'
      ) !== -1 &&
      mensaje.indexOf(
        'ORDEN_SECUENCIA'
      ) !== -1 &&
      mensaje.indexOf(
        'entero mayor que 0'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: ORDEN_SECUENCIA inválido rechazado'
        : 'ERR: el error recibido no coincide con el esperado'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }

  SpreadsheetApp.flush();

  const filasFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Filas iniciales: ' +
    filasIniciales
  );

  console.log(
    'Filas finales: ' +
    filasFinales
  );

  console.log(
    'Hoja sin cambios: ' +
    (
      filasIniciales === filasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_141_ERROR: no se confirmó el rechazo de ORDEN_SECUENCIA'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_141_ERROR: 05_PROCESOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 141 superada'
  );
}

function pruebaPaso142_DuracionPrevistaInvalida() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_142_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo = function(nombreRango) {
    const rango = ss.getRangeByName(nombreRango);

    if (!rango) {
      throw new Error(
        'PASO_142_ERROR: no existe el rango ' +
        nombreRango
      );
    }

    const valores = rango
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return String(valor).trim();
      })
      .filter(function(valor) {
        return valor !== '';
      });

    if (valores.length === 0) {
      throw new Error(
        'PASO_142_ERROR: catálogo vacío: ' +
        nombreRango
      );
    }

    return valores[0];
  };

  let productoId = '';
  let errorEsperadoDetectado = false;

  const filasIniciales =
    hojaProcesos.getLastRow();

  try {
    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P142',
          NOMBRE: 'Producto temporal paso 142',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    insertarRegistroTransaccional(
      'PROCESO',
      {
        PRODUCTO_ID: productoId,
        NOMBRE: 'Proceso temporal paso 142',
        ORDEN_SECUENCIA: 1,
        DURACION_PREVISTA_DIAS: 0,
        ESTADO: 'Borrador',
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó DURACION_PREVISTA_DIAS igual a 0'
    );

  } catch (error) {
    const mensaje = String(
      error && error.message
        ? error.message
        : error
    );

    console.log(
      'Error controlado: ' +
      mensaje
    );

    errorEsperadoDetectado =
      mensaje.indexOf(
        'ERROR_INSERCION_PROCESO'
      ) !== -1 &&
      mensaje.indexOf(
        'DURACION_PREVISTA_DIAS'
      ) !== -1 &&
      mensaje.indexOf(
        'número mayor que 0'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: DURACION_PREVISTA_DIAS inválida rechazada'
        : 'ERR: el error recibido no coincide con el esperado'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }

  SpreadsheetApp.flush();

  const filasFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Filas iniciales: ' +
    filasIniciales
  );

  console.log(
    'Filas finales: ' +
    filasFinales
  );

  console.log(
    'Hoja sin cambios: ' +
    (
      filasIniciales === filasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_142_ERROR: no se confirmó el rechazo de DURACION_PREVISTA_DIAS'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_142_ERROR: 05_PROCESOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 142 superada'
  );
}

function pruebaPaso143_CatalogosProceso() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const rangosNombrados =
    ss.getNamedRanges();

  const resultados =
    rangosNombrados
      .map(function(rangoNombrado) {
        return rangoNombrado.getName();
      })
      .filter(function(nombre) {
        const nombreNormalizado =
          String(nombre)
            .trim()
            .toUpperCase();

        return (
          nombreNormalizado.indexOf(
            'PROCESO'
          ) !== -1 ||
          nombreNormalizado.indexOf(
            'ESTADO'
          ) !== -1
        );
      })
      .sort();

  console.log(
    'Rangos relacionados encontrados: ' +
    resultados.length
  );

  resultados.forEach(function(nombre) {
    const rango =
      ss.getRangeByName(nombre);

    const valores =
      rango
        .getDisplayValues()
        .flat()
        .map(function(valor) {
          return String(valor).trim();
        })
        .filter(function(valor) {
          return valor !== '';
        });

    console.log(
      nombre +
      ': ' +
      valores.join(' | ')
    );
  });

  if (resultados.length === 0) {
    console.log(
      'WARN: no se encontraron rangos relacionados con PROCESO o ESTADO'
    );
  }

  console.log(
    'OK: inspección de catálogos del PASO 143 completada'
  );
}

function pruebaPaso144_EstadoProcesoInvalido() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_144_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo = function(nombreRango) {
    const rango = ss.getRangeByName(nombreRango);

    if (!rango) {
      throw new Error(
        'PASO_144_ERROR: no existe el rango ' +
        nombreRango
      );
    }

    const valores = rango
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return String(valor).trim();
      })
      .filter(function(valor) {
        return valor !== '';
      });

    if (valores.length === 0) {
      throw new Error(
        'PASO_144_ERROR: catálogo vacío: ' +
        nombreRango
      );
    }

    return valores[0];
  };

  let productoId = '';
  let errorEsperadoDetectado = false;

  const filasIniciales =
    hojaProcesos.getLastRow();

  try {
    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P144',
          NOMBRE: 'Producto temporal paso 144',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    insertarRegistroTransaccional(
      'PROCESO',
      {
        PRODUCTO_ID: productoId,
        NOMBRE: 'Proceso temporal paso 144',
        ORDEN_SECUENCIA: 1,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO: 'ESTADO-INEXISTENTE',
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó un ESTADO de proceso no válido'
    );

  } catch (error) {
    const mensaje = String(
      error && error.message
        ? error.message
        : error
    );

    console.log(
      'Error controlado: ' +
      mensaje
    );

errorEsperadoDetectado =
  mensaje.indexOf(
    'ERROR_INSERCION_PROCESO'
  ) !== -1 &&
  mensaje.indexOf(
    'ESTADO'
  ) !== -1 &&
  mensaje.indexOf(
    'CFG_ESTADO_PROCESO'
  ) !== -1 &&
  mensaje.indexOf(
    'no pertenece al catálogo'
  ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: ESTADO de proceso inválido rechazado'
        : 'ERR: el error recibido no coincide con el esperado'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }

  SpreadsheetApp.flush();

  const filasFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Filas iniciales: ' +
    filasIniciales
  );

  console.log(
    'Filas finales: ' +
    filasFinales
  );

  console.log(
    'Hoja sin cambios: ' +
    (
      filasIniciales === filasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_144_ERROR: no se confirmó el rechazo de ESTADO'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_144_ERROR: 05_PROCESOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 144 superada'
  );
}

function pruebaPaso145_PorcentajeAvanceInvalido() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_145_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo = function(nombreRango) {
    const rango = ss.getRangeByName(nombreRango);

    if (!rango) {
      throw new Error(
        'PASO_145_ERROR: no existe el rango ' +
        nombreRango
      );
    }

    const valores = rango
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return String(valor).trim();
      })
      .filter(function(valor) {
        return valor !== '';
      });

    if (valores.length === 0) {
      throw new Error(
        'PASO_145_ERROR: catálogo vacío: ' +
        nombreRango
      );
    }

    return valores[0];
  };

  let productoId = '';
  let errorEsperadoDetectado = false;

  const filasIniciales =
    hojaProcesos.getLastRow();

  try {
    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P145',
          NOMBRE: 'Producto temporal paso 145',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    insertarRegistroTransaccional(
      'PROCESO',
      {
        PRODUCTO_ID: productoId,
        NOMBRE: 'Proceso temporal paso 145',
        ORDEN_SECUENCIA: 1,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO:
          obtenerPrimerValorCatalogo(
            'CFG_ESTADO_PROCESO'
          ),
        PORCENTAJE_AVANCE: 101
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó PORCENTAJE_AVANCE superior a 100'
    );

  } catch (error) {
    const mensaje = String(
      error && error.message
        ? error.message
        : error
    );

    console.log(
      'Error controlado: ' +
      mensaje
    );

    errorEsperadoDetectado =
      mensaje.indexOf(
        'ERROR_INSERCION_PROCESO'
      ) !== -1 &&
      mensaje.indexOf(
        'PORCENTAJE_AVANCE'
      ) !== -1 &&
      mensaje.indexOf(
        'entre 0 y 100'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: PORCENTAJE_AVANCE inválido rechazado'
        : 'ERR: el error recibido no coincide con el esperado'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }

  SpreadsheetApp.flush();

  const filasFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Filas iniciales: ' +
    filasIniciales
  );

  console.log(
    'Filas finales: ' +
    filasFinales
  );

  console.log(
    'Hoja sin cambios: ' +
    (
      filasIniciales === filasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_145_ERROR: no se confirmó el rechazo de PORCENTAJE_AVANCE'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_145_ERROR: 05_PROCESOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 145 superada'
  );
}

function pruebaPaso146_ProcesoPredecesorInexistente() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_146_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo =
    function(nombreRango) {
      const rango =
        ss.getRangeByName(nombreRango);

      if (!rango) {
        throw new Error(
          'PASO_146_ERROR: no existe el rango ' +
          nombreRango
        );
      }

      const valores = rango
        .getDisplayValues()
        .flat()
        .map(function(valor) {
          return String(valor).trim();
        })
        .filter(function(valor) {
          return valor !== '';
        });

      if (valores.length === 0) {
        throw new Error(
          'PASO_146_ERROR: catálogo vacío: ' +
          nombreRango
        );
      }

      return valores[0];
    };

  let productoId = '';
  let errorEsperadoDetectado = false;

  const filasIniciales =
    hojaProcesos.getLastRow();

  try {
    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P146',
          NOMBRE: 'Producto temporal paso 146',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    insertarRegistroTransaccional(
      'PROCESO',
      {
        PRODUCTO_ID: productoId,
        NOMBRE: 'Proceso temporal paso 146',
        ORDEN_SECUENCIA: 2,
        PROCESO_PREDECESOR_ID:
          'PCS-INEXISTENTE',
        DURACION_PREVISTA_DIAS: 1,
        ESTADO:
          obtenerPrimerValorCatalogo(
            'CFG_ESTADO_PROCESO'
          ),
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó un proceso predecesor inexistente'
    );

  } catch (error) {
    const mensaje = String(
      error && error.message
        ? error.message
        : error
    );

    console.log(
      'Error controlado: ' +
      mensaje
    );

    errorEsperadoDetectado =
      mensaje.indexOf(
        'ERROR_INSERCION_PROCESO'
      ) !== -1 &&
      mensaje.indexOf(
        'PROCESO_PREDECESOR_ID'
      ) !== -1 &&
      mensaje.indexOf(
        'no existe'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: proceso predecesor inexistente rechazado'
        : 'ERR: el error recibido no coincide con el esperado'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }

  SpreadsheetApp.flush();

  const filasFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Filas iniciales: ' +
    filasIniciales
  );

  console.log(
    'Filas finales: ' +
    filasFinales
  );

  console.log(
    'Hoja sin cambios: ' +
    (
      filasIniciales === filasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_146_ERROR: no se confirmó el rechazo del proceso predecesor'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_146_ERROR: 05_PROCESOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 146 superada'
  );
}

function pruebaPaso147_ResponsableProcesoInexistente() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_147_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo =
    function(nombreRango) {
      const rango =
        ss.getRangeByName(nombreRango);

      if (!rango) {
        throw new Error(
          'PASO_147_ERROR: no existe el rango ' +
          nombreRango
        );
      }

      const valores = rango
        .getDisplayValues()
        .flat()
        .map(function(valor) {
          return String(valor).trim();
        })
        .filter(function(valor) {
          return valor !== '';
        });

      if (valores.length === 0) {
        throw new Error(
          'PASO_147_ERROR: catálogo vacío: ' +
          nombreRango
        );
      }

      return valores[0];
    };

  let productoId = '';
  let errorEsperadoDetectado = false;

  const filasIniciales =
    hojaProcesos.getLastRow();

  try {
    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P147',
          NOMBRE: 'Producto temporal paso 147',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    insertarRegistroTransaccional(
      'PROCESO',
      {
        PRODUCTO_ID: productoId,
        NOMBRE: 'Proceso temporal paso 147',
        ORDEN_SECUENCIA: 1,
        DURACION_PREVISTA_DIAS: 1,
        RESPONSABLE_ID: 'PER-INEXISTENTE',
        ESTADO:
          obtenerPrimerValorCatalogo(
            'CFG_ESTADO_PROCESO'
          ),
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó un RESPONSABLE_ID inexistente'
    );

  } catch (error) {
    const mensaje = String(
      error && error.message
        ? error.message
        : error
    );

    console.log(
      'Error controlado: ' +
      mensaje
    );

    errorEsperadoDetectado =
      mensaje.indexOf(
        'ERROR_INSERCION_PROCESO'
      ) !== -1 &&
      mensaje.indexOf(
        'RESPONSABLE_ID'
      ) !== -1 &&
      mensaje.indexOf(
        'no existe'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: RESPONSABLE_ID inexistente rechazado'
        : 'ERR: el error recibido no coincide con el esperado'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }

  SpreadsheetApp.flush();

  const filasFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Filas iniciales: ' +
    filasIniciales
  );

  console.log(
    'Filas finales: ' +
    filasFinales
  );

  console.log(
    'Hoja sin cambios: ' +
    (
      filasIniciales === filasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_147_ERROR: no se confirmó el rechazo de RESPONSABLE_ID'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_147_ERROR: 05_PROCESOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 147 superada'
  );
}

function pruebaPaso148_FechasPlanProcesoInvalidas() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_148_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo =
    function(nombreRango) {
      const rango =
        ss.getRangeByName(nombreRango);

      if (!rango) {
        throw new Error(
          'PASO_148_ERROR: no existe el rango ' +
          nombreRango
        );
      }

      const valores = rango
        .getDisplayValues()
        .flat()
        .map(function(valor) {
          return String(valor).trim();
        })
        .filter(function(valor) {
          return valor !== '';
        });

      if (valores.length === 0) {
        throw new Error(
          'PASO_148_ERROR: catálogo vacío: ' +
          nombreRango
        );
      }

      return valores[0];
    };

  let productoId = '';
  let errorEsperadoDetectado = false;

  const filasIniciales =
    hojaProcesos.getLastRow();

  try {
    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P148',
          NOMBRE: 'Producto temporal paso 148',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    insertarRegistroTransaccional(
      'PROCESO',
      {
        PRODUCTO_ID: productoId,
        NOMBRE: 'Proceso temporal paso 148',
        ORDEN_SECUENCIA: 1,
        DURACION_PREVISTA_DIAS: 1,
        FECHA_INICIO_PLAN:
          new Date(2026, 6, 20),
        FECHA_FIN_PLAN:
          new Date(2026, 6, 19),
        ESTADO:
          obtenerPrimerValorCatalogo(
            'CFG_ESTADO_PROCESO'
          ),
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó FECHA_FIN_PLAN anterior a FECHA_INICIO_PLAN'
    );

  } catch (error) {
    const mensaje = String(
      error && error.message
        ? error.message
        : error
    );

    console.log(
      'Error controlado: ' +
      mensaje
    );

    errorEsperadoDetectado =
      mensaje.indexOf(
        'ERROR_INSERCION_PROCESO'
      ) !== -1 &&
      mensaje.indexOf(
        'FECHA_FIN_PLAN'
      ) !== -1 &&
      mensaje.indexOf(
        'anterior'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: fechas planificadas inválidas rechazadas'
        : 'ERR: el error recibido no coincide con el esperado'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }

  SpreadsheetApp.flush();

  const filasFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Filas iniciales: ' +
    filasIniciales
  );

  console.log(
    'Filas finales: ' +
    filasFinales
  );

  console.log(
    'Hoja sin cambios: ' +
    (
      filasIniciales === filasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_148_ERROR: no se confirmó el rechazo de fechas planificadas'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_148_ERROR: 05_PROCESOS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 148 superada'
  );
}


function pruebaPaso149_ProcesoValidoDryRun() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_149_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo =
    function(nombreRango) {
      const rango =
        ss.getRangeByName(nombreRango);

      if (!rango) {
        throw new Error(
          'PASO_149_ERROR: no existe el rango ' +
          nombreRango
        );
      }

      const valores = rango
        .getDisplayValues()
        .flat()
        .map(function(valor) {
          return String(valor).trim();
        })
        .filter(function(valor) {
          return valor !== '';
        });

      if (valores.length === 0) {
        throw new Error(
          'PASO_149_ERROR: catálogo vacío: ' +
          nombreRango
        );
      }

      return valores[0];
    };

  let productoId = '';

  const filasIniciales =
    hojaProcesos.getLastRow();

  try {
    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P149',
          NOMBRE: 'Producto temporal paso 149',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    const resultado =
      insertarRegistroTransaccional(
        'PROCESO',
        {
          PRODUCTO_ID: productoId,
          NOMBRE: 'Proceso temporal paso 149',
          ORDEN_SECUENCIA: 1,
          DURACION_PREVISTA_DIAS: 2,
          FECHA_INICIO_PLAN:
            new Date(2026, 6, 22),
          FECHA_FIN_PLAN:
            new Date(2026, 6, 24),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PROCESO'
            ),
          PORCENTAJE_AVANCE: 0
        },
        {
          dryRun: true
        }
      );

    SpreadsheetApp.flush();

    const filasFinales =
      hojaProcesos.getLastRow();

    console.log(
      'OK: proceso válido aceptado en dryRun'
    );

    console.log(
      'ID simulado: ' +
      resultado.id
    );

    console.log(
      'Fila destino: ' +
      resultado.filaDestino
    );

    console.log(
      'Columnas: ' +
      resultado.columnas
    );

    console.log(
      'Filas iniciales: ' +
      filasIniciales
    );

    console.log(
      'Filas finales: ' +
      filasFinales
    );

    if (
      !resultado.ok ||
      resultado.dryRun !== true
    ) {
      throw new Error(
        'PASO_149_ERROR: resultado dryRun incorrecto'
      );
    }

    if (
      String(resultado.id).indexOf('PCS-') !== 0
    ) {
      throw new Error(
        'PASO_149_ERROR: prefijo de ID incorrecto: ' +
        resultado.id
      );
    }

    if (
      filasIniciales !== filasFinales
    ) {
      throw new Error(
        'PASO_149_ERROR: 05_PROCESOS fue modificada'
      );
    }

    console.log(
      'Hoja sin cambios: OK'
    );

    console.log(
      'OK: prueba controlada del PASO 149 superada'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }
}

function pruebaPaso150_InsertarProcesoReal() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_150_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo =
    function(nombreRango) {
      const rango =
        ss.getRangeByName(nombreRango);

      if (!rango) {
        throw new Error(
          'PASO_150_ERROR: no existe el rango ' +
          nombreRango
        );
      }

      const valores = rango
        .getDisplayValues()
        .flat()
        .map(function(valor) {
          return String(valor).trim();
        })
        .filter(function(valor) {
          return valor !== '';
        });

      if (valores.length === 0) {
        throw new Error(
          'PASO_150_ERROR: catálogo vacío: ' +
          nombreRango
        );
      }

      return valores[0];
    };

  let productoId = '';
  let procesoId = '';

  const filasIniciales =
    hojaProcesos.getLastRow();

  try {
    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P150',
          NOMBRE: 'Producto temporal paso 150',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    const resultado =
      insertarRegistroTransaccional(
        'PROCESO',
        {
          PRODUCTO_ID: productoId,
          NOMBRE: 'Proceso temporal paso 150',
          ORDEN_SECUENCIA: 1,
          DURACION_PREVISTA_DIAS: 2,
          FECHA_INICIO_PLAN:
            new Date(2026, 6, 22),
          FECHA_FIN_PLAN:
            new Date(2026, 6, 24),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PROCESO'
            ),
          PORCENTAJE_AVANCE: 0
        },
        {
          dryRun: false
        }
      );

    procesoId = resultado.id;

    SpreadsheetApp.flush();

    const filasFinales =
      hojaProcesos.getLastRow();

    const cabeceras =
      hojaProcesos
        .getRange(
          1,
          1,
          1,
          hojaProcesos.getLastColumn()
        )
        .getDisplayValues()[0]
        .map(function(valor) {
          return String(valor).trim();
        });

    const indiceId =
      cabeceras.indexOf('ID');

    const indiceProducto =
      cabeceras.indexOf('PRODUCTO_ID');

    const indiceNombre =
      cabeceras.indexOf('NOMBRE');

    const indiceOrden =
      cabeceras.indexOf('ORDEN_SECUENCIA');

    const indiceDuracion =
      cabeceras.indexOf('DURACION_PREVISTA_DIAS');

    const indiceEstado =
      cabeceras.indexOf('ESTADO');

    const indiceAvance =
      cabeceras.indexOf('PORCENTAJE_AVANCE');

    if (
      indiceId === -1 ||
      indiceProducto === -1 ||
      indiceNombre === -1 ||
      indiceOrden === -1 ||
      indiceDuracion === -1 ||
      indiceEstado === -1 ||
      indiceAvance === -1
    ) {
      throw new Error(
        'PASO_150_ERROR: faltan columnas obligatorias'
      );
    }

    const filaInsertada =
      hojaProcesos
        .getRange(
          filasFinales,
          1,
          1,
          hojaProcesos.getLastColumn()
        )
        .getValues()[0];

    const idPersistido =
      String(
        filaInsertada[indiceId]
      ).trim();

    const productoPersistido =
      String(
        filaInsertada[indiceProducto]
      ).trim();

    const nombrePersistido =
      String(
        filaInsertada[indiceNombre]
      ).trim();

    const ordenPersistido =
      filaInsertada[indiceOrden];

    const duracionPersistida =
      filaInsertada[indiceDuracion];

    const estadoPersistido =
      String(
        filaInsertada[indiceEstado]
      ).trim();

    const avancePersistido =
      filaInsertada[indiceAvance];

    console.log(
      'OK: proceso insertado realmente'
    );

    console.log(
      'ID generado: ' +
      procesoId
    );

    console.log(
      'ID persistido: ' +
      idPersistido
    );

    console.log(
      'PRODUCTO_ID persistido: ' +
      productoPersistido
    );

    console.log(
      'NOMBRE persistido: ' +
      nombrePersistido
    );

    console.log(
      'ORDEN_SECUENCIA persistido: ' +
      ordenPersistido
    );

    console.log(
      'DURACION_PREVISTA_DIAS persistida: ' +
      duracionPersistida
    );

    console.log(
      'ESTADO persistido: ' +
      estadoPersistido
    );

    console.log(
      'PORCENTAJE_AVANCE persistido: ' +
      avancePersistido
    );

    console.log(
      'Filas iniciales: ' +
      filasIniciales
    );

    console.log(
      'Filas finales: ' +
      filasFinales
    );

    if (
      filasFinales !==
      filasIniciales + 1
    ) {
      throw new Error(
        'PASO_150_ERROR: no se añadió exactamente una fila'
      );
    }

    if (idPersistido !== procesoId) {
      throw new Error(
        'PASO_150_ERROR: ID persistido incorrecto'
      );
    }

    if (
      productoPersistido !== productoId
    ) {
      throw new Error(
        'PASO_150_ERROR: PRODUCTO_ID persistido incorrecto'
      );
    }

    if (
      nombrePersistido !==
      'Proceso temporal paso 150'
    ) {
      throw new Error(
        'PASO_150_ERROR: NOMBRE persistido incorrecto'
      );
    }

    if (ordenPersistido !== 1) {
      throw new Error(
        'PASO_150_ERROR: ORDEN_SECUENCIA persistido incorrecto'
      );
    }

    if (duracionPersistida !== 2) {
      throw new Error(
        'PASO_150_ERROR: DURACION_PREVISTA_DIAS persistida incorrecta'
      );
    }

    if (avancePersistido !== 0) {
      throw new Error(
        'PASO_150_ERROR: PORCENTAJE_AVANCE persistido incorrecto'
      );
    }

    console.log(
      'OK: prueba controlada del PASO 150 superada'
    );

  } catch (error) {
    if (procesoId !== '') {
      eliminarRegistroPruebaPorId_(
        hojaProcesos,
        procesoId
      );
    }

    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );

    throw error;
  }
}

function pruebaPaso151_SiguienteIdProceso() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_151_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo =
    function(nombreRango) {
      const rango =
        ss.getRangeByName(nombreRango);

      if (!rango) {
        throw new Error(
          'PASO_151_ERROR: no existe el rango ' +
          nombreRango
        );
      }

      const valores = rango
        .getDisplayValues()
        .flat()
        .map(function(valor) {
          return String(valor).trim();
        })
        .filter(function(valor) {
          return valor !== '';
        });

      if (valores.length === 0) {
        throw new Error(
          'PASO_151_ERROR: catálogo vacío: ' +
          nombreRango
        );
      }

      return valores[0];
    };

  const cabecerasProductos =
    hojaProductos
      .getRange(
        1,
        1,
        1,
        hojaProductos.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

  const indiceIdProducto =
    cabecerasProductos.indexOf('ID');

  if (
    indiceIdProducto === -1 ||
    hojaProductos.getLastRow() < 2
  ) {
    throw new Error(
      'PASO_151_ERROR: no existe el producto temporal del PASO 150'
    );
  }

  const productoId =
    String(
      hojaProductos
        .getRange(
          2,
          indiceIdProducto + 1
        )
        .getDisplayValue()
    )
      .trim()
      .toUpperCase();

  const filasIniciales =
    hojaProcesos.getLastRow();

  const resultado =
    insertarRegistroTransaccional(
      'PROCESO',
      {
        PRODUCTO_ID: productoId,
        NOMBRE: 'Proceso simulado paso 151',
        ORDEN_SECUENCIA: 2,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO:
          obtenerPrimerValorCatalogo(
            'CFG_ESTADO_PROCESO'
          ),
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

  SpreadsheetApp.flush();

  const filasFinales =
    hojaProcesos.getLastRow();

  console.log(
    'ID simulado: ' +
    resultado.id
  );

  console.log(
    'PRODUCTO_ID utilizado: ' +
    productoId
  );

  console.log(
    'Filas iniciales: ' +
    filasIniciales
  );

  console.log(
    'Filas finales: ' +
    filasFinales
  );

  console.log(
    'Hoja sin cambios: ' +
    (
      filasIniciales === filasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (resultado.id !== 'PCS-0002') {
    throw new Error(
      'PASO_151_ERROR: se esperaba PCS-0002 y se obtuvo ' +
      resultado.id
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_151_ERROR: 05_PROCESOS fue modificada'
    );
  }

  console.log(
    'OK: siguiente ID de proceso verificado'
  );

  console.log(
    'OK: prueba controlada del PASO 151 superada'
  );
}


function pruebaPaso152_VerificarLimpiezaProcesoYProducto() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_152_ERROR: faltan hojas necesarias'
    );
  }

  const existeIdEnHoja =
    function(hoja, idBuscado) {
      const ultimaColumna =
        hoja.getLastColumn();

      if (ultimaColumna < 1) {
        throw new Error(
          'PASO_152_ERROR: hoja sin columnas: ' +
          hoja.getName()
        );
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
          .map(function(valor) {
            return String(valor).trim();
          });

      const indiceId =
        cabeceras.indexOf('ID');

      if (indiceId === -1) {
        throw new Error(
          'PASO_152_ERROR: no existe columna ID en ' +
          hoja.getName()
        );
      }

      const ultimaFila =
        hoja.getLastRow();

      if (ultimaFila < 2) {
        return false;
      }

      const ids =
        hoja
          .getRange(
            2,
            indiceId + 1,
            ultimaFila - 1,
            1
          )
          .getDisplayValues()
          .flat()
          .map(function(valor) {
            return String(valor)
              .trim()
              .toUpperCase();
          });

      return ids.includes(
        String(idBuscado)
          .trim()
          .toUpperCase()
      );
    };

  const procesoExiste =
    existeIdEnHoja(
      hojaProcesos,
      'PCS-0001'
    );

  const productoExiste =
    existeIdEnHoja(
      hojaProductos,
      'PRD-0001'
    );

  const filasProcesos =
    hojaProcesos.getLastRow();

  const filasProductos =
    hojaProductos.getLastRow();

  console.log(
    'PCS-0001 existe: ' +
    procesoExiste
  );

  console.log(
    'PRD-0001 existe: ' +
    productoExiste
  );

  console.log(
    'Filas actuales en 05_PROCESOS: ' +
    filasProcesos
  );

  console.log(
    'Filas actuales en 03_PRODUCTOS: ' +
    filasProductos
  );

  if (procesoExiste) {
    throw new Error(
      'PASO_152_ERROR: PCS-0001 continúa existiendo'
    );
  }

  if (productoExiste) {
    throw new Error(
      'PASO_152_ERROR: PRD-0001 continúa existiendo'
    );
  }

  if (filasProcesos !== 1) {
    throw new Error(
      'PASO_152_ERROR: 05_PROCESOS contiene filas residuales'
    );
  }

  if (filasProductos !== 1) {
    throw new Error(
      'PASO_152_ERROR: 03_PRODUCTOS contiene filas residuales'
    );
  }

  console.log(
    'OK: proceso temporal ausente'
  );

  console.log(
    'OK: producto temporal ausente'
  );

  console.log(
    'OK: prueba controlada del PASO 152 superada'
  );
}

function pruebaPaso153_ReinicioIdProceso() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_153_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo =
    function(nombreRango) {
      const rango =
        ss.getRangeByName(nombreRango);

      if (!rango) {
        throw new Error(
          'PASO_153_ERROR: no existe el rango ' +
          nombreRango
        );
      }

      const valores =
        rango
          .getDisplayValues()
          .flat()
          .map(function(valor) {
            return String(valor).trim();
          })
          .filter(function(valor) {
            return valor !== '';
          });

      if (valores.length === 0) {
        throw new Error(
          'PASO_153_ERROR: catálogo vacío: ' +
          nombreRango
        );
      }

      return valores[0];
    };

  let productoId = '';

  const filasProcesosIniciales =
    hojaProcesos.getLastRow();

  try {
    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P153',
          NOMBRE: 'Producto temporal paso 153',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    const resultado =
      insertarRegistroTransaccional(
        'PROCESO',
        {
          PRODUCTO_ID: productoId,
          NOMBRE: 'Proceso simulado paso 153',
          ORDEN_SECUENCIA: 1,
          DURACION_PREVISTA_DIAS: 1,
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PROCESO'
            ),
          PORCENTAJE_AVANCE: 0
        },
        {
          dryRun: true
        }
      );

    SpreadsheetApp.flush();

    const filasProcesosFinales =
      hojaProcesos.getLastRow();

    console.log(
      'ID simulado: ' +
      resultado.id
    );

    console.log(
      'PRODUCTO_ID temporal: ' +
      productoId
    );

    console.log(
      'Filas procesos iniciales: ' +
      filasProcesosIniciales
    );

    console.log(
      'Filas procesos finales: ' +
      filasProcesosFinales
    );

    console.log(
      'Hoja 05_PROCESOS sin cambios: ' +
      (
        filasProcesosIniciales ===
        filasProcesosFinales
          ? 'OK'
          : 'ERR'
      )
    );

    if (resultado.id !== 'PCS-0001') {
      throw new Error(
        'PASO_153_ERROR: se esperaba PCS-0001 y se obtuvo ' +
        resultado.id
      );
    }

    if (
      filasProcesosIniciales !==
      filasProcesosFinales
    ) {
      throw new Error(
        'PASO_153_ERROR: 05_PROCESOS fue modificada'
      );
    }

    console.log(
      'OK: reinicio del ID de proceso verificado'
    );

    console.log(
      'OK: prueba controlada del PASO 153 superada'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }
}

function pruebaPaso154_OrdenProcesoDuplicado() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_154_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo =
    function(nombreRango) {
      const rango =
        ss.getRangeByName(nombreRango);

      if (!rango) {
        throw new Error(
          'PASO_154_ERROR: no existe el rango ' +
          nombreRango
        );
      }

      const valores =
        rango
          .getDisplayValues()
          .flat()
          .map(function(valor) {
            return String(valor).trim();
          })
          .filter(function(valor) {
            return valor !== '';
          });

      if (valores.length === 0) {
        throw new Error(
          'PASO_154_ERROR: catálogo vacío: ' +
          nombreRango
        );
      }

      return valores[0];
    };

  let productoId = '';
  let procesoId = '';
  let errorEsperadoDetectado = false;

  try {
    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P154',
          NOMBRE: 'Producto temporal paso 154',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    procesoId =
      insertarRegistroTransaccional(
        'PROCESO',
        {
          PRODUCTO_ID: productoId,
          NOMBRE: 'Primer proceso paso 154',
          ORDEN_SECUENCIA: 1,
          DURACION_PREVISTA_DIAS: 1,
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PROCESO'
            ),
          PORCENTAJE_AVANCE: 0
        },
        {
          dryRun: false
        }
      ).id;

    const filasIniciales =
      hojaProcesos.getLastRow();

    try {
      insertarRegistroTransaccional(
        'PROCESO',
        {
          PRODUCTO_ID: productoId,
          NOMBRE: 'Proceso duplicado paso 154',
          ORDEN_SECUENCIA: 1,
          DURACION_PREVISTA_DIAS: 1,
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PROCESO'
            ),
          PORCENTAJE_AVANCE: 0
        },
        {
          dryRun: false
        }
      );

      console.log(
        'ERR: se aceptó un ORDEN_SECUENCIA duplicado'
      );

    } catch (error) {
      const mensaje =
        String(
          error && error.message
            ? error.message
            : error
        );

      console.log(
        'Error controlado: ' +
        mensaje
      );

      errorEsperadoDetectado =
        mensaje.indexOf(
          'ERROR_INSERCION_PROCESO'
        ) !== -1 &&
        mensaje.indexOf(
          'ORDEN_SECUENCIA duplicado'
        ) !== -1;

      console.log(
        errorEsperadoDetectado
          ? 'OK: ORDEN_SECUENCIA duplicado rechazado'
          : 'ERR: error distinto al esperado'
      );
    }

    SpreadsheetApp.flush();

    const filasFinales =
      hojaProcesos.getLastRow();

    console.log(
      'Filas iniciales: ' +
      filasIniciales
    );

    console.log(
      'Filas finales: ' +
      filasFinales
    );

    console.log(
      'Registros duplicados insertados: ' +
      (
        filasFinales - filasIniciales
      )
    );

    if (!errorEsperadoDetectado) {
      throw new Error(
        'PASO_154_ERROR: no se rechazó el orden duplicado'
      );
    }

    if (filasIniciales !== filasFinales) {
      throw new Error(
        'PASO_154_ERROR: se insertó una fila duplicada'
      );
    }

    console.log(
      'OK: prueba controlada del PASO 154 superada'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProcesos,
      procesoId
    );

    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }
}


function pruebaPaso155_PredecessorOtroProducto() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_155_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo =
    function(nombreRango) {
      const rango =
        ss.getRangeByName(nombreRango);

      if (!rango) {
        throw new Error(
          'PASO_155_ERROR: no existe el rango ' +
          nombreRango
        );
      }

      const valores =
        rango
          .getDisplayValues()
          .flat()
          .map(function(valor) {
            return String(valor).trim();
          })
          .filter(function(valor) {
            return valor !== '';
          });

      if (valores.length === 0) {
        throw new Error(
          'PASO_155_ERROR: catálogo vacío: ' +
          nombreRango
        );
      }

      return valores[0];
    };

  let productoAId = '';
  let productoBId = '';
  let procesoAId = '';
  let errorEsperadoDetectado = false;

  try {
    productoAId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P155-A',
          NOMBRE: 'Producto A paso 155',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    productoBId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P155-B',
          NOMBRE: 'Producto B paso 155',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    procesoAId =
      insertarRegistroTransaccional(
        'PROCESO',
        {
          PRODUCTO_ID: productoAId,
          NOMBRE: 'Proceso producto A paso 155',
          ORDEN_SECUENCIA: 1,
          DURACION_PREVISTA_DIAS: 1,
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PROCESO'
            ),
          PORCENTAJE_AVANCE: 0
        },
        {
          dryRun: false
        }
      ).id;

    const filasIniciales =
      hojaProcesos.getLastRow();

    try {
      insertarRegistroTransaccional(
        'PROCESO',
        {
          PRODUCTO_ID: productoBId,
          NOMBRE: 'Proceso producto B paso 155',
          ORDEN_SECUENCIA: 1,
          PROCESO_PREDECESOR_ID:
            procesoAId,
          DURACION_PREVISTA_DIAS: 1,
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PROCESO'
            ),
          PORCENTAJE_AVANCE: 0
        },
        {
          dryRun: false
        }
      );

      console.log(
        'ERR: se aceptó un predecesor de otro producto'
      );

    } catch (error) {
      const mensaje =
        String(
          error && error.message
            ? error.message
            : error
        );

      console.log(
        'Error controlado: ' +
        mensaje
      );

      errorEsperadoDetectado =
        mensaje.indexOf(
          'ERROR_INSERCION_PROCESO'
        ) !== -1 &&
        mensaje.indexOf(
          'pertenece a otro producto'
        ) !== -1;

      console.log(
        errorEsperadoDetectado
          ? 'OK: predecesor de otro producto rechazado'
          : 'ERR: error distinto al esperado'
      );
    }

    SpreadsheetApp.flush();

    const filasFinales =
      hojaProcesos.getLastRow();

    console.log(
      'Filas iniciales: ' +
      filasIniciales
    );

    console.log(
      'Filas finales: ' +
      filasFinales
    );

    console.log(
      'Registros inválidos insertados: ' +
      (
        filasFinales - filasIniciales
      )
    );

    if (!errorEsperadoDetectado) {
      throw new Error(
        'PASO_155_ERROR: no se rechazó el predecesor de otro producto'
      );
    }

    if (
      filasIniciales !== filasFinales
    ) {
      throw new Error(
        'PASO_155_ERROR: se insertó un proceso inválido'
      );
    }

    console.log(
      'OK: prueba controlada del PASO 155 superada'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProcesos,
      procesoAId
    );

    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoBId
    );

    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoAId
    );
  }
}

function pruebaPaso156_PredecessorMismoProducto() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_156_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo =
    function(nombreRango) {
      const rango =
        ss.getRangeByName(nombreRango);

      if (!rango) {
        throw new Error(
          'PASO_156_ERROR: no existe el rango ' +
          nombreRango
        );
      }

      const valores =
        rango
          .getDisplayValues()
          .flat()
          .map(function(valor) {
            return String(valor).trim();
          })
          .filter(function(valor) {
            return valor !== '';
          });

      if (valores.length === 0) {
        throw new Error(
          'PASO_156_ERROR: catálogo vacío: ' +
          nombreRango
        );
      }

      return valores[0];
    };

  let productoId = '';
  let procesoPredecesorId = '';

  try {
    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P156',
          NOMBRE: 'Producto temporal paso 156',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    procesoPredecesorId =
      insertarRegistroTransaccional(
        'PROCESO',
        {
          PRODUCTO_ID: productoId,
          NOMBRE: 'Proceso predecesor paso 156',
          ORDEN_SECUENCIA: 1,
          DURACION_PREVISTA_DIAS: 1,
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PROCESO'
            ),
          PORCENTAJE_AVANCE: 0
        },
        {
          dryRun: false
        }
      ).id;

    const filasIniciales =
      hojaProcesos.getLastRow();

    const resultado =
      insertarRegistroTransaccional(
        'PROCESO',
        {
          PRODUCTO_ID: productoId,
          NOMBRE: 'Proceso dependiente paso 156',
          ORDEN_SECUENCIA: 2,
          PROCESO_PREDECESOR_ID:
            procesoPredecesorId,
          DURACION_PREVISTA_DIAS: 1,
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PROCESO'
            ),
          PORCENTAJE_AVANCE: 0
        },
        {
          dryRun: true
        }
      );

    SpreadsheetApp.flush();

    const filasFinales =
      hojaProcesos.getLastRow();

    console.log(
      'OK: predecesor del mismo producto aceptado'
    );

    console.log(
      'ID simulado: ' +
      resultado.id
    );

    console.log(
      'PRODUCTO_ID: ' +
      productoId
    );

    console.log(
      'PROCESO_PREDECESOR_ID: ' +
      procesoPredecesorId
    );

    console.log(
      'Filas iniciales: ' +
      filasIniciales
    );

    console.log(
      'Filas finales: ' +
      filasFinales
    );

    console.log(
      'Hoja sin cambios: ' +
      (
        filasIniciales === filasFinales
          ? 'OK'
          : 'ERR'
      )
    );

    if (
      !resultado.ok ||
      resultado.dryRun !== true
    ) {
      throw new Error(
        'PASO_156_ERROR: resultado dryRun incorrecto'
      );
    }

    if (
      filasIniciales !== filasFinales
    ) {
      throw new Error(
        'PASO_156_ERROR: 05_PROCESOS fue modificada'
      );
    }

    console.log(
      'OK: prueba controlada del PASO 156 superada'
    );

  } finally {
    eliminarRegistroPruebaPorId_(
      hojaProcesos,
      procesoPredecesorId
    );

    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );
  }
}

function pruebaPaso157_InsertarProcesoDependienteReal() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_157_ERROR: faltan hojas necesarias'
    );
  }

  const obtenerPrimerValorCatalogo =
    function(nombreRango) {
      const rango =
        ss.getRangeByName(nombreRango);

      if (!rango) {
        throw new Error(
          'PASO_157_ERROR: no existe el rango ' +
          nombreRango
        );
      }

      const valores =
        rango
          .getDisplayValues()
          .flat()
          .map(function(valor) {
            return String(valor).trim();
          })
          .filter(function(valor) {
            return valor !== '';
          });

      if (valores.length === 0) {
        throw new Error(
          'PASO_157_ERROR: catálogo vacío: ' +
          nombreRango
        );
      }

      return valores[0];
    };

  let productoId = '';
  let procesoPredecesorId = '';
  let procesoDependienteId = '';

  try {
    productoId =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO: 'TEST-P157',
          NOMBRE: 'Producto temporal paso 157',
          ORIGEN:
            obtenerPrimerValorCatalogo(
              'CFG_ORIGEN_PRODUCTO'
            ),
          UNIDAD:
            obtenerPrimerValorCatalogo(
              'CFG_UNIDAD'
            ),
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PRODUCTO'
            )
        },
        {
          dryRun: false
        }
      ).id;

    procesoPredecesorId =
      insertarRegistroTransaccional(
        'PROCESO',
        {
          PRODUCTO_ID: productoId,
          NOMBRE: 'Proceso predecesor paso 157',
          ORDEN_SECUENCIA: 1,
          DURACION_PREVISTA_DIAS: 1,
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PROCESO'
            ),
          PORCENTAJE_AVANCE: 0
        },
        {
          dryRun: false
        }
      ).id;

    const filasIniciales =
      hojaProcesos.getLastRow();

    const resultado =
      insertarRegistroTransaccional(
        'PROCESO',
        {
          PRODUCTO_ID: productoId,
          NOMBRE: 'Proceso dependiente paso 157',
          ORDEN_SECUENCIA: 2,
          PROCESO_PREDECESOR_ID:
            procesoPredecesorId,
          DURACION_PREVISTA_DIAS: 2,
          ESTADO:
            obtenerPrimerValorCatalogo(
              'CFG_ESTADO_PROCESO'
            ),
          PORCENTAJE_AVANCE: 0
        },
        {
          dryRun: false
        }
      );

    procesoDependienteId =
      resultado.id;

    SpreadsheetApp.flush();

    const filasFinales =
      hojaProcesos.getLastRow();

    const cabeceras =
      hojaProcesos
        .getRange(
          1,
          1,
          1,
          hojaProcesos.getLastColumn()
        )
        .getDisplayValues()[0]
        .map(function(valor) {
          return String(valor).trim();
        });

    const indiceId =
      cabeceras.indexOf('ID');

    const indiceProducto =
      cabeceras.indexOf('PRODUCTO_ID');

    const indicePredecesor =
      cabeceras.indexOf(
        'PROCESO_PREDECESOR_ID'
      );

    const indiceOrden =
      cabeceras.indexOf(
        'ORDEN_SECUENCIA'
      );

    if (
      indiceId === -1 ||
      indiceProducto === -1 ||
      indicePredecesor === -1 ||
      indiceOrden === -1
    ) {
      throw new Error(
        'PASO_157_ERROR: faltan columnas necesarias'
      );
    }

    const filaDependiente =
      hojaProcesos
        .getRange(
          filasFinales,
          1,
          1,
          hojaProcesos.getLastColumn()
        )
        .getDisplayValues()[0];

    const idPersistido =
      String(
        filaDependiente[indiceId]
      ).trim();

    const productoPersistido =
      String(
        filaDependiente[indiceProducto]
      ).trim();

    const predecesorPersistido =
      String(
        filaDependiente[indicePredecesor]
      ).trim();

    const ordenPersistido =
      Number(
        filaDependiente[indiceOrden]
      );

    console.log(
      'OK: proceso dependiente insertado realmente'
    );

    console.log(
      'ID generado: ' +
      procesoDependienteId
    );

    console.log(
      'ID persistido: ' +
      idPersistido
    );

    console.log(
      'PRODUCTO_ID persistido: ' +
      productoPersistido
    );

    console.log(
      'PROCESO_PREDECESOR_ID persistido: ' +
      predecesorPersistido
    );

    console.log(
      'ORDEN_SECUENCIA persistido: ' +
      ordenPersistido
    );

    console.log(
      'Filas iniciales: ' +
      filasIniciales
    );

    console.log(
      'Filas finales: ' +
      filasFinales
    );

    if (
      filasFinales !==
      filasIniciales + 1
    ) {
      throw new Error(
        'PASO_157_ERROR: no se insertó exactamente una fila'
      );
    }

    if (
      idPersistido !==
      procesoDependienteId
    ) {
      throw new Error(
        'PASO_157_ERROR: ID persistido incorrecto'
      );
    }

    if (
      productoPersistido !==
      productoId
    ) {
      throw new Error(
        'PASO_157_ERROR: PRODUCTO_ID persistido incorrecto'
      );
    }

    if (
      predecesorPersistido !==
      procesoPredecesorId
    ) {
      throw new Error(
        'PASO_157_ERROR: PROCESO_PREDECESOR_ID persistido incorrecto'
      );
    }

    if (ordenPersistido !== 2) {
      throw new Error(
        'PASO_157_ERROR: ORDEN_SECUENCIA persistido incorrecto'
      );
    }

    console.log(
      'OK: prueba controlada del PASO 157 superada'
    );

  } catch (error) {
    eliminarRegistroPruebaPorId_(
      hojaProcesos,
      procesoDependienteId
    );

    eliminarRegistroPruebaPorId_(
      hojaProcesos,
      procesoPredecesorId
    );

    eliminarRegistroPruebaPorId_(
      hojaProductos,
      productoId
    );

    throw error;
  }
}



function pruebaPaso158_LimpiarProcesosDependientes() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaProductos =
    ss.getSheetByName('03_PRODUCTOS');

  if (
    !hojaProcesos ||
    !hojaProductos
  ) {
    throw new Error(
      'PASO_158_ERROR: faltan hojas necesarias'
    );
  }

  eliminarRegistroPruebaPorId_(
    hojaProcesos,
    'PCS-0002'
  );

  eliminarRegistroPruebaPorId_(
    hojaProcesos,
    'PCS-0001'
  );

  eliminarRegistroPruebaPorId_(
    hojaProductos,
    'PRD-0001'
  );

  SpreadsheetApp.flush();

  const filasProcesos =
    hojaProcesos.getLastRow();

  const filasProductos =
    hojaProductos.getLastRow();

  console.log(
    'Filas actuales en 05_PROCESOS: ' +
    filasProcesos
  );

  console.log(
    'Filas actuales en 03_PRODUCTOS: ' +
    filasProductos
  );

  if (filasProcesos !== 1) {
    throw new Error(
      'PASO_158_ERROR: quedan procesos temporales'
    );
  }

  if (filasProductos !== 1) {
    throw new Error(
      'PASO_158_ERROR: queda el producto temporal'
    );
  }

  console.log(
    'OK: procesos temporales eliminados'
  );

  console.log(
    'OK: producto temporal eliminado'
  );

  console.log(
    'OK: prueba controlada del PASO 158 superada'
  );
}

/*
 * ============================================================
 * REPOSITORY_CONSULTAR (FASE 2, anadido de forma autonoma)
 * Funciones de lectura del repositorio. No realizan ninguna
 * escritura sobre las hojas. Se apoyan en ENTIDADES_MVP (Ids.gs)
 * para resolver la hoja de cada entidad de forma generica.
 * Nota: se ubican en Repository.gs en lugar de un archivo propio
 * Repository_Consultar.gs por inestabilidad del dialogo de
 * creacion de archivos en el editor durante esta sesion.
 * ============================================================
 */

function obtenerHojaEntidad_(entidad) {
  var config = ENTIDADES_MVP[entidad];
  if (!config) {
    throw new Error('ERROR_CONSULTA: entidad no reconocida: ' + entidad);
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(config.hoja);
  if (!hoja) {
    throw new Error('ERROR_CONSULTA: hoja no encontrada para la entidad ' + entidad + ': ' + config.hoja);
  }
  return hoja;
}

function leerFilasEntidadComoObjetos_(entidad) {
  return cacheLecturaFilasObjetos_(entidad, function () {
    instrumentacionRegistrarLecturaHoja_();
    var hoja = obtenerHojaEntidad_(entidad);
    var lastRow = hoja.getLastRow();
    var lastCol = hoja.getLastColumn();
    if (lastRow < 2) {
      return [];
    }
    var valores = hoja.getRange(1, 1, lastRow, lastCol).getValues();
    var cabeceras = valores[0];
    var filas = [];
    for (var i = 1; i < valores.length; i++) {
      var fila = valores[i];
      var objeto = {};
      for (var c = 0; c < cabeceras.length; c++) {
        objeto[cabeceras[c]] = fila[c];
      }
      filas.push(objeto);
    }
    return filas;
  });
}

/**
 * Devuelve el registro cuya columna ID coincide con el id dado,
 * o null si no existe. Lanza error si la entidad no es reconocida.
 */
function obtenerRegistroPorId(entidad, id) {
  if (!id) {
    throw new Error('ERROR_CONSULTA: se requiere un id para obtenerRegistroPorId.');
  }
  var filas = leerFilasEntidadComoObjetos_(entidad);
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i].ID).trim() === String(id).trim()) {
      return filas[i];
    }
  }
  return null;
}

/**
 * Devuelve todos los registros de una entidad, opcionalmente
 * filtrados por igualdad exacta en uno o varios campos.
 * filtros: objeto {CAMPO: valor, ...} o null/undefined para listar todo.
 */
function listarRegistros(entidad, filtros) {
  var filas = leerFilasEntidadComoObjetos_(entidad);
  if (!filtros) {
    return filas;
  }
  var claves = Object.keys(filtros);
  return filas.filter(function (fila) {
    return claves.every(function (clave) {
      return String(fila[clave]) === String(filtros[clave]);
    });
  });
}

/**
 * Busqueda de texto libre (subcadena, sin distinguir mayusculas)
 * dentro de un unico campo. criterio: {campo: 'NOMBRE', texto: 'foo'}.
 */
function buscarRegistros(entidad, criterio) {
  if (!criterio || !criterio.campo || criterio.texto === undefined || criterio.texto === null) {
    throw new Error('ERROR_CONSULTA: buscarRegistros requiere criterio = {campo, texto}.');
  }
  var filas = leerFilasEntidadComoObjetos_(entidad);
  var textoBuscado = String(criterio.texto).toLowerCase();
  return filas.filter(function (fila) {
    var valorCampo = fila[criterio.campo];
    if (valorCampo === undefined || valorCampo === null) {
      return false;
    }
    return String(valorCampo).toLowerCase().indexOf(textoBuscado) !== -1;
  });
}

/**
 * Atajo sobre listarRegistros para consultas por relacion (FK):
 * listarPorRelacion('TAREA', 'PROCESO_ID', procesoId).
 */
function listarPorRelacion(entidad, campoRelacion, idRelacion) {
  if (!campoRelacion || !idRelacion) {
    throw new Error('ERROR_CONSULTA: listarPorRelacion requiere campoRelacion e idRelacion.');
  }
  var filtros = {};
  filtros[campoRelacion] = idRelacion;
  return listarRegistros(entidad, filtros);
}

/*
 * Consultas jerarquicas de conveniencia para el MVP, construidas
 * sobre las funciones genericas anteriores.
 */

function listarCampanasActivas() {
  return listarRegistros('CAMPANA', {ESTADO: 'Activa'});
}

function listarProyectosDeCampana(campanaId) {
  return listarPorRelacion('PROYECTO', 'CAMPANA_ID', campanaId);
}

function listarProductosDeProyecto(proyectoId) {
  var relaciones = listarPorRelacion('PROYECTO_PRODUCTO', 'PROYECTO_ID', proyectoId);
  var productos = [];
  for (var i = 0; i < relaciones.length; i++) {
    var producto = obtenerRegistroPorId('PRODUCTO', relaciones[i].PRODUCTO_ID);
    if (producto) {
      productos.push(producto);
    }
  }
  return productos;
}

function listarProcesosDeProducto(productoId) {
  return listarPorRelacion('PROCESO', 'PRODUCTO_ID', productoId);
}

function listarTareasDeProceso(procesoId) {
  return listarPorRelacion('TAREA', 'PROCESO_ID', procesoId);
}

function listarTareasPorEstado(estado) {
  return listarRegistros('TAREA', {ESTADO: estado});
}


/*
 * ============================================================
 * REPOSITORY_ACTUALIZAR (FASE 3, anadido de forma autonoma)
 * actualizarRegistroTransaccional revalida los cambios llamando
 * a insertarRegistroTransaccional en modo dryRun sobre el
 * registro fusionado (actual + cambios), reutilizando integramente
 * los bloques de validacion if (clave === 'X') { ... } ya existentes
 * sin duplicar logica. Ubicada en Repository.gs por la misma razon
 * que REPOSITORY_CONSULTAR (ver nota en ese bloque).
 *
 * Nota: el modelo de datos actual no tiene columnas FECHA_MODIFICACION
 * ni MODIFICADO_POR en las hojas de entidad; la trazabilidad de
 * cambios se delega a la hoja 91_HISTORIAL prevista para la Fase 10
 * (Auditoria), todavia no implementada.
 * ============================================================
 */

function sonValoresEquivalentesActualizacion_(anterior, nuevo, zonaHoraria) {
  var anteriorEsFecha =
    Object.prototype.toString.call(anterior) === '[object Date]' &&
    !isNaN(anterior.getTime());

  var nuevoEsFecha =
    Object.prototype.toString.call(nuevo) === '[object Date]' &&
    !isNaN(nuevo.getTime());

  if (anteriorEsFecha && nuevoEsFecha) {
    return Utilities.formatDate(anterior, zonaHoraria, 'yyyy-MM-dd') ===
      Utilities.formatDate(nuevo, zonaHoraria, 'yyyy-MM-dd');
  }

  var anteriorVacio =
    anterior === null ||
    anterior === undefined ||
    anterior === '';

  var nuevoVacio =
    nuevo === null ||
    nuevo === undefined ||
    nuevo === '';

  if (anteriorVacio && nuevoVacio) {
    return true;
  }

  return String(anterior) === String(nuevo);
}

function actualizarRegistroTransaccional(entidad, id, cambios, opciones) {
  opciones = opciones || {};

  var dryRun = !!opciones.dryRun;
  var origen = opciones.origen || 'SCRIPT';
  var correlationId =
    opciones.correlationId || generarCorrelationId_();
  var esPrueba = !!opciones.esPrueba;
  var pruebaId = opciones.pruebaId || '';

  if (!id) {
    throw new Error(
      'ERROR_ACTUALIZACION: se requiere un id.'
    );
  }

  if (
    !cambios ||
    typeof cambios !== 'object' ||
    Array.isArray(cambios) ||
    Object.keys(cambios).length === 0
  ) {
    throw new Error(
      'ERROR_ACTUALIZACION: se requiere al menos un cambio en el objeto cambios.'
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      cambios,
      'ID'
    )
  ) {
    throw new Error(
      'ERROR_ACTUALIZACION: no esta permitido modificar el campo ID.'
    );
  }

  /*
   * Normalización de textos de DECISION.
   * Se aplica antes de validar, fusionar, comparar,
   * ejecutar dryRun y escribir en hoja.
   */
  if (
    String(entidad || '')
      .trim()
      .toUpperCase() === 'DECISION'
  ) {
    cambios = Object.assign({}, cambios);

    [
      'TITULO',
      'CONTEXTO',
      'RESOLUCION',
      'OBSERVACIONES'
    ].forEach(function (campo) {
      if (
        Object.prototype.hasOwnProperty.call(
          cambios,
          campo
        ) &&
        typeof cambios[campo] === 'string'
      ) {
        cambios[campo] =
          cambios[campo].trim();
      }
    });
  }

  var registroActual =
    obtenerRegistroPorId(entidad, id);

  if (!registroActual) {
    throw new Error(
      'ERROR_ACTUALIZACION: no existe un registro de ' +
      entidad +
      ' con id ' +
      id +
      '.'
    );
  }

  var hoja = obtenerHojaEntidad_(entidad);
  var ultimaColumna = hoja.getLastColumn();

  var cabeceras = hoja
    .getRange(
      1,
      1,
      1,
      ultimaColumna
    )
    .getValues()[0]
    .map(function (valor) {
      return String(valor).trim();
    });

  /*
   * Se obtienen después de normalizar cambios,
   * para que todas las operaciones posteriores
   * usen los valores ya recortados.
   */
  var clavesCambio = Object.keys(cambios);

  clavesCambio.forEach(function (campo) {
    if (cabeceras.indexOf(campo) === -1) {
      throw new Error(
        'ERROR_ACTUALIZACION: campo no reconocido para ' +
        entidad +
        ': ' +
        campo
      );
    }
  });

  var camposSistemaActualizar = [
    'ID',
    'FECHA_CREACION',
    'CREADO_POR',
    'FECHA_MODIFICACION',
    'MODIFICADO_POR'
  ];

  var camposSistemaRecibidos =
    clavesCambio.filter(function (campo) {
      return (
        camposSistemaActualizar.indexOf(
          campo
        ) !== -1
      );
    });

  if (camposSistemaRecibidos.length > 0) {
    throw new Error(
      'ERROR_ACTUALIZACION: campos gestionados por el sistema no permitidos: ' +
      camposSistemaRecibidos.join(', ')
    );
  }

  var registroFusionado = {};

  cabeceras.forEach(function (campo) {
    if (
      camposSistemaActualizar.indexOf(
        campo
      ) !== -1
    ) {
      return;
    }

    var tieneCambio =
      Object.prototype.hasOwnProperty.call(
        cambios,
        campo
      );

    var valor = tieneCambio
      ? cambios[campo]
      : registroActual[campo];

    if (tieneCambio || valor !== '') {
      registroFusionado[campo] = valor;
    }
  });

  /*
   * Revalidación completa reutilizando
   * el motor de inserción.
   *
   * La validación se ejecuta en dryRun
   * y excluye el registro actual.
   */
  insertarRegistroTransaccional(
    entidad,
    registroFusionado,
    {
      dryRun: true,
      idExcluir: id,
      origen: origen,
      correlationId: correlationId,
      esPrueba: esPrueba,
      pruebaId: pruebaId
    }
  );

  var zonaHoraria =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSpreadsheetTimeZone();

  var diferencias = clavesCambio
    .filter(function (campo) {
      return !sonValoresEquivalentesActualizacion_(
        registroActual[campo],
        cambios[campo],
        zonaHoraria
      );
    })
    .map(function (campo) {
      return {
        campo: campo,
        anterior: registroActual[campo],
        nuevo: cambios[campo]
      };
    });

  if (
    dryRun ||
    diferencias.length === 0
  ) {
    return {
      id: id,
      diferencias: diferencias
    };
  }

  var ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    throw new Error(
      'ERROR_ACTUALIZACION: la hoja no contiene registros.'
    );
  }

  var idsColumna = hoja
    .getRange(
      2,
      1,
      ultimaFila - 1,
      1
    )
    .getDisplayValues()
    .map(function (fila) {
      return String(fila[0]).trim();
    });

  var indiceFila =
    idsColumna.indexOf(
      String(id).trim()
    );

  if (indiceFila === -1) {
    throw new Error(
      'ERROR_ACTUALIZACION: no se encontro la fila del registro al escribir los cambios.'
    );
  }

  var numeroFila = indiceFila + 2;

  diferencias.forEach(function (diferencia) {
    var numeroColumna =
      cabeceras.indexOf(
        diferencia.campo
      ) + 1;

    if (numeroColumna <= 0) {
      throw new Error(
        'ERROR_ACTUALIZACION: no se encontro la columna ' +
        diferencia.campo +
        '.'
      );
    }

    hoja
      .getRange(
        numeroFila,
        numeroColumna
      )
      .setValue(
        diferencia.nuevo
      );
  });

  var usuarioModificacion =
    Session
      .getEffectiveUser()
      .getEmail() ||
    'USUARIO_NO_IDENTIFICADO';

  var indiceFechaModificacion =
    cabeceras.indexOf(
      'FECHA_MODIFICACION'
    );

  var indiceModificadoPor =
    cabeceras.indexOf(
      'MODIFICADO_POR'
    );

  if (indiceFechaModificacion !== -1) {
    hoja
      .getRange(
        numeroFila,
        indiceFechaModificacion + 1
      )
      .setValue(new Date());
  }

  if (indiceModificadoPor !== -1) {
    hoja
      .getRange(
        numeroFila,
        indiceModificadoPor + 1
      )
      .setValue(usuarioModificacion);
  }

  SpreadsheetApp.flush();

  var accionHistorial = 'ACTUALIZAR';

  if (
    diferencias.length === 1 &&
    diferencias[0].campo === 'ACTIVO'
  ) {
    accionHistorial =
      String(diferencias[0].nuevo)
        .trim()
        .toUpperCase() === 'NO'
        ? 'DESACTIVAR'
        : 'REACTIVAR';
  }

  registrarHistorial(
    entidad,
    id,
    accionHistorial,
    diferencias,
    {
      origen: origen,
      correlationId: correlationId,
      esPrueba: esPrueba,
      pruebaId: pruebaId,
      resultado: 'OK'
    }
  );

  return {
    id: id,
    diferencias: diferencias,
    fechaModificacionActualizada:
      indiceFechaModificacion !== -1,
    modificadoPorActualizado:
      indiceModificadoPor !== -1,
    origen: origen,
    correlationId: correlationId
  };
}

/* ============================================================
 * REPOSITORY_ESTADO — Fase 4: baja logica y reactivacion.
 * Reutiliza actualizarRegistroTransaccional (Fase 3) para escribir
 * el campo ACTIVO, y listarPorRelacion (Fase 2) para detectar
 * dependientes activos antes de desactivar. No se duplica logica
 * de escritura ni de consulta ya existente.
 *
 * Alcance: solo se cubren relaciones FK directas (no polimorficas).
 * DOCUMENTO referencia otras entidades via ENTIDAD_TIPO/ENTIDAD_ID
 * de forma polimorfica y no se valida aqui, igual que en el motor
 * de insercion (ver nota de DOCUMENTO en Fase 2). RESPONSABLE_ID
 * en CAMPANA/PROYECTO/PRODUCTO/PROCESO/DECISION/INCIDENCIA es una
 * referencia opcional de un solo valor, no un listado de
 * dependientes, por lo que tampoco bloquea la baja.
 * ============================================================ */

const DEPENDENCIAS_ACTIVAS_MVP = Object.freeze({
  CAMPANA: [
    {entidad: 'PROYECTO', campo: 'CAMPANA_ID'}
  ],
  PROYECTO: [
    {entidad: 'PROYECTO_PRODUCTO', campo: 'PROYECTO_ID'},
    {entidad: 'DECISION', campo: 'PROYECTO_ID'}
  ],
  PRODUCTO: [
    {entidad: 'PROYECTO_PRODUCTO', campo: 'PRODUCTO_ID'},
    {entidad: 'PROCESO', campo: 'PRODUCTO_ID'},
    {entidad: 'PRODUCTO_MATERIAL', campo: 'PRODUCTO_ID'}
  ],
  PROYECTO_PRODUCTO: [],
  PROCESO: [
    {entidad: 'TAREA', campo: 'PROCESO_ID'}
  ],
  TAREA: [
    {entidad: 'TAREA_RESPONSABLE', campo: 'TAREA_ID'},
    {entidad: 'TAREA_MATERIAL', campo: 'TAREA_ID'}
  ],
  TAREA_RESPONSABLE: [],
  MATERIAL: [
    {entidad: 'PRODUCTO_MATERIAL', campo: 'MATERIAL_ID'},
    {entidad: 'TAREA_MATERIAL', campo: 'MATERIAL_ID'}
  ],
  PERSONA_EQUIPO: [
    {entidad: 'TAREA_RESPONSABLE', campo: 'PERSONA_EQUIPO_ID'}
  ],
  PRODUCTO_MATERIAL: [],
  TAREA_MATERIAL: [],
  DECISION: [],
  INCIDENCIA: [],
  DOCUMENTO: []
});

function obtenerDependenciasActivas_(entidad, id) {
  var clave = String(entidad || '').trim().toUpperCase();
  var reglas = DEPENDENCIAS_ACTIVAS_MVP[clave] || [];

  var encontradas = [];
  reglas.forEach(function (regla) {
    var hijos = listarPorRelacion(regla.entidad, regla.campo, id);
    var activos = hijos.filter(function (fila) {
      return fila.ACTIVO === 'SÍ';
    });
    if (activos.length > 0) {
      encontradas.push({
        entidad: regla.entidad,
        campo: regla.campo,
        cantidad: activos.length
      });
    }
  });
  return encontradas;
}

function desactivarRegistro(entidad, id) {
  var registroActual = obtenerRegistroPorId(entidad, id);
  if (!registroActual) {
    throw new Error('ERROR_BAJA: no existe un registro de ' + entidad + ' con id ' + id + '.');
  }
  if (registroActual.ACTIVO === 'NO') {
    throw new Error('ERROR_BAJA: el registro ' + id + ' ya esta inactivo.');
  }

  var dependencias = obtenerDependenciasActivas_(entidad, id);
  if (dependencias.length > 0) {
    var detalle = dependencias
      .map(function (dep) { return dep.entidad + ' (' + dep.cantidad + ')'; })
      .join(', ');
    throw new Error('ERROR_BAJA: no se puede desactivar ' + id + ', tiene dependientes activos: ' + detalle);
  }

  return actualizarRegistroTransaccional(entidad, id, {ACTIVO: 'NO'});
}

function reactivarRegistro(entidad, id) {
  var registroActual = obtenerRegistroPorId(entidad, id);
  if (!registroActual) {
    throw new Error('ERROR_REACTIVACION: no existe un registro de ' + entidad + ' con id ' + id + '.');
  }
  if (registroActual.ACTIVO === 'SÍ') {
    throw new Error('ERROR_REACTIVACION: el registro ' + id + ' ya esta activo.');
  }

  return actualizarRegistroTransaccional(entidad, id, {ACTIVO: 'SÍ'});
}


