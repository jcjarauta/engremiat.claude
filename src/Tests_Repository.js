function pruebaPaso159_InspeccionarHojaTareas() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hoja =
    ss.getSheetByName('06_TAREAS');

  if (!hoja) {
    throw new Error(
      'PASO_159_ERROR: no existe la hoja 06_TAREAS'
    );
  }

  const ultimaFila =
    hoja.getLastRow();

  const ultimaColumna =
    hoja.getLastColumn();

  if (ultimaColumna < 1) {
    throw new Error(
      'PASO_159_ERROR: 06_TAREAS no contiene columnas'
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

  console.log(
    'Hoja: ' +
    hoja.getName()
  );

  console.log(
    'Filas: ' +
    ultimaFila
  );

  console.log(
    'Columnas: ' +
    ultimaColumna
  );

  cabeceras.forEach(
    function(cabecera, indice) {
      console.log(
        String(indice + 1) +
        '. ' +
        cabecera
      );
    }
  );

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
      'PASO_159_ERROR: cabeceras vacías en columnas: ' +
      cabecerasVacias.join(', ')
    );
  }

  const cabecerasDuplicadas =
    cabeceras.filter(
      function(cabecera, indice) {
        return (
          cabeceras.indexOf(cabecera) !==
          indice
        );
      }
    );

  if (cabecerasDuplicadas.length > 0) {
    throw new Error(
      'PASO_159_ERROR: cabeceras duplicadas: ' +
      cabecerasDuplicadas.join(', ')
    );
  }

  console.log(
    'OK: estructura de 06_TAREAS inspeccionada'
  );

  console.log(
    'OK: prueba controlada del PASO 159 superada'
  );
}


function pruebaPaso160_ConfiguracionEntidadTarea() {
  if (
    typeof ENTIDADES_MVP !== 'object' ||
    !ENTIDADES_MVP
  ) {
    throw new Error(
      'PASO_160_ERROR: ENTIDADES_MVP no está disponible'
    );
  }

  if (
    typeof CAMPOS_OBLIGATORIOS_MVP !== 'object' ||
    !CAMPOS_OBLIGATORIOS_MVP
  ) {
    throw new Error(
      'PASO_160_ERROR: CAMPOS_OBLIGATORIOS_MVP no está disponible'
    );
  }

  const entidad =
    ENTIDADES_MVP.TAREA;

  if (!entidad) {
    throw new Error(
      'PASO_160_ERROR: no existe la entidad TAREA'
    );
  }

  if (entidad.hoja !== '06_TAREAS') {
    throw new Error(
      'PASO_160_ERROR: hoja incorrecta para TAREA: ' +
      entidad.hoja
    );
  }

  if (entidad.prefijo !== 'TAR') {
    throw new Error(
      'PASO_160_ERROR: prefijo incorrecto para TAREA: ' +
      entidad.prefijo
    );
  }

  const campos =
    CAMPOS_OBLIGATORIOS_MVP.TAREA;

  if (!Array.isArray(campos)) {
    throw new Error(
      'PASO_160_ERROR: campos obligatorios de TAREA no definidos'
    );
  }

  const esperados = [
    'PROCESO_ID',
    'NOMBRE',
    'ORDEN_SECUENCIA',
    'DURACION_PREVISTA_DIAS',
    'ESTADO',
    'PORCENTAJE_AVANCE'
  ];

  const faltantes =
    esperados.filter(function(campo) {
      return !campos.includes(campo);
    });

  console.log(
    'Hoja configurada: ' +
    entidad.hoja
  );

  console.log(
    'Prefijo configurado: ' +
    entidad.prefijo
  );

  console.log(
    'Campos obligatorios: ' +
    campos.join(', ')
  );

  if (faltantes.length > 0) {
    throw new Error(
      'PASO_160_ERROR: faltan campos obligatorios: ' +
      faltantes.join(', ')
    );
  }

  console.log(
    'OK: entidad TAREA configurada'
  );

  console.log(
    'OK: prueba controlada del PASO 160 superada'
  );
}

function pruebaPaso161_ProcesoTareaInexistente() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaTareas =
    ss.getSheetByName('06_TAREAS');

  if (!hojaTareas) {
    throw new Error(
      'PASO_161_ERROR: no existe la hoja 06_TAREAS'
    );
  }

  const filasIniciales =
    hojaTareas.getLastRow();

  let errorEsperadoDetectado = false;

  try {
    insertarRegistroTransaccional(
      'TAREA',
      {
        PROCESO_ID: 'PCS-INEXISTENTE',
        NOMBRE: 'Tarea temporal paso 161',
        ORDEN_SECUENCIA: 1,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO: 'Pendiente',
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó un PROCESO_ID inexistente'
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
        'ERROR_INSERCION_TAREA'
      ) !== -1 &&
      mensaje.indexOf(
        'PROCESO_ID de tarea no existe'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: PROCESO_ID inexistente rechazado'
        : 'ERR: error distinto al esperado'
    );
  }

  SpreadsheetApp.flush();

  const filasFinales =
    hojaTareas.getLastRow();

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
      'PASO_161_ERROR: no se rechazó el PROCESO_ID inexistente'
    );
  }

  if (filasIniciales !== filasFinales) {
    throw new Error(
      'PASO_161_ERROR: 06_TAREAS fue modificada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 161 superada'
  );
}


function pruebaPaso162_OrdenSecuenciaTareaInvalido() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaTareas =
    ss.getSheetByName('06_TAREAS');

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  if (!hojaTareas) {
    throw new Error(
      'PASO_162_ERROR: no existe la hoja 06_TAREAS'
    );
  }

  if (!hojaProcesos) {
    throw new Error(
      'PASO_162_ERROR: no existe la hoja 05_PROCESOS'
    );
  }

  const filasTareasIniciales =
    hojaTareas.getLastRow();

  const filasProcesosIniciales =
    hojaProcesos.getLastRow();

  const cabecerasProcesos =
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

  const procesoTemporalId =
    'PRO-TEMP-P162';

  const registroProcesoTemporal = {
    ID: procesoTemporalId,
    PRODUCTO_ID: 'PRD-TEMP-P162',
    NOMBRE: 'Proceso temporal paso 162',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_162',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_162',
    ACTIVO: 'SÍ'
  };

  const filaProcesoTemporal =
    cabecerasProcesos.map(
      function(cabecera) {
        return Object.prototype
          .hasOwnProperty.call(
            registroProcesoTemporal,
            cabecera
          )
          ? registroProcesoTemporal[cabecera]
          : '';
      }
    );

  let filaProcesoInsertada = null;
  let errorEsperadoDetectado = false;

  try {
    hojaProcesos.appendRow(
      filaProcesoTemporal
    );

    SpreadsheetApp.flush();

    filaProcesoInsertada =
      hojaProcesos.getLastRow();

    insertarRegistroTransaccional(
      'TAREA',
      {
        PROCESO_ID: procesoTemporalId,
        NOMBRE: 'Tarea temporal paso 162',
        ORDEN_SECUENCIA: 0,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO: 'Pendiente',
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó un ORDEN_SECUENCIA inválido'
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
        'ERROR_INSERCION_TAREA'
      ) !== -1 &&
      mensaje.indexOf(
        'ORDEN_SECUENCIA debe ser un número entero mayor que 0'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: ORDEN_SECUENCIA inválido rechazado'
        : 'ERR: error distinto al esperado'
    );

  } finally {
    if (
      filaProcesoInsertada !== null &&
      hojaProcesos.getLastRow() >=
        filaProcesoInsertada
    ) {
      hojaProcesos.deleteRow(
        filaProcesoInsertada
      );

      SpreadsheetApp.flush();
    }
  }

  const filasTareasFinales =
    hojaTareas.getLastRow();

  const filasProcesosFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Filas tareas iniciales: ' +
    filasTareasIniciales
  );

  console.log(
    'Filas tareas finales: ' +
    filasTareasFinales
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
    '06_TAREAS sin cambios: ' +
    (
      filasTareasIniciales ===
      filasTareasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  console.log(
    '05_PROCESOS restaurada: ' +
    (
      filasProcesosIniciales ===
      filasProcesosFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_162_ERROR: no se rechazó ORDEN_SECUENCIA inválido'
    );
  }

  if (
    filasTareasIniciales !==
    filasTareasFinales
  ) {
    throw new Error(
      'PASO_162_ERROR: 06_TAREAS fue modificada'
    );
  }

  if (
    filasProcesosIniciales !==
    filasProcesosFinales
  ) {
    throw new Error(
      'PASO_162_ERROR: 05_PROCESOS no fue restaurada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 162 superada'
  );
}

function pruebaPaso163_DuracionPrevistaTareaInvalida() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaTareas =
    ss.getSheetByName('06_TAREAS');

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  if (!hojaTareas) {
    throw new Error(
      'PASO_163_ERROR: no existe la hoja 06_TAREAS'
    );
  }

  if (!hojaProcesos) {
    throw new Error(
      'PASO_163_ERROR: no existe la hoja 05_PROCESOS'
    );
  }

  const filasTareasIniciales =
    hojaTareas.getLastRow();

  const filasProcesosIniciales =
    hojaProcesos.getLastRow();

  const ultimaColumnaProcesos =
    hojaProcesos.getLastColumn();

  if (ultimaColumnaProcesos < 1) {
    throw new Error(
      'PASO_163_ERROR: 05_PROCESOS no contiene columnas'
    );
  }

  const cabecerasProcesos =
    hojaProcesos
      .getRange(
        1,
        1,
        1,
        ultimaColumnaProcesos
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

  const procesoTemporalId =
    'PRO-TEMP-P163';

  const registroProcesoTemporal = {
    ID: procesoTemporalId,
    PRODUCTO_ID: 'PRD-TEMP-P163',
    NOMBRE: 'Proceso temporal paso 163',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_163',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_163',
    ACTIVO: 'SÍ'
  };

  const filaProcesoTemporal =
    cabecerasProcesos.map(
      function(cabecera) {
        return Object.prototype
          .hasOwnProperty.call(
            registroProcesoTemporal,
            cabecera
          )
          ? registroProcesoTemporal[cabecera]
          : '';
      }
    );

  let filaProcesoInsertada = null;
  let errorEsperadoDetectado = false;

  try {
    hojaProcesos.appendRow(
      filaProcesoTemporal
    );

    SpreadsheetApp.flush();

    filaProcesoInsertada =
      hojaProcesos.getLastRow();

    insertarRegistroTransaccional(
      'TAREA',
      {
        PROCESO_ID: procesoTemporalId,
        NOMBRE: 'Tarea temporal paso 163',
        ORDEN_SECUENCIA: 1,
        DURACION_PREVISTA_DIAS: 0,
        ESTADO: 'Pendiente',
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó una DURACION_PREVISTA_DIAS inválida'
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
        'ERROR_INSERCION_TAREA'
      ) !== -1 &&
      mensaje.indexOf(
        'DURACION_PREVISTA_DIAS debe ser un número mayor que 0'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: DURACION_PREVISTA_DIAS inválida rechazada'
        : 'ERR: error distinto al esperado'
    );

  } finally {
    if (
      filaProcesoInsertada !== null &&
      hojaProcesos.getLastRow() >=
        filaProcesoInsertada
    ) {
      hojaProcesos.deleteRow(
        filaProcesoInsertada
      );

      SpreadsheetApp.flush();
    }
  }

  const filasTareasFinales =
    hojaTareas.getLastRow();

  const filasProcesosFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Filas tareas iniciales: ' +
    filasTareasIniciales
  );

  console.log(
    'Filas tareas finales: ' +
    filasTareasFinales
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
    '06_TAREAS sin cambios: ' +
    (
      filasTareasIniciales ===
      filasTareasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  console.log(
    '05_PROCESOS restaurada: ' +
    (
      filasProcesosIniciales ===
      filasProcesosFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_163_ERROR: no se rechazó DURACION_PREVISTA_DIAS inválida'
    );
  }

  if (
    filasTareasIniciales !==
    filasTareasFinales
  ) {
    throw new Error(
      'PASO_163_ERROR: 06_TAREAS fue modificada'
    );
  }

  if (
    filasProcesosIniciales !==
    filasProcesosFinales
  ) {
    throw new Error(
      'PASO_163_ERROR: 05_PROCESOS no fue restaurada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 163 superada'
  );
}

function pruebaPaso164_EstadoTareaInvalido() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaTareas =
    ss.getSheetByName('06_TAREAS');

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  if (!hojaTareas) {
    throw new Error(
      'PASO_164_ERROR: no existe la hoja 06_TAREAS'
    );
  }

  if (!hojaProcesos) {
    throw new Error(
      'PASO_164_ERROR: no existe la hoja 05_PROCESOS'
    );
  }

  const rangoEstados =
    ss.getRangeByName(
      'CFG_ESTADO_TAREA'
    );

  if (!rangoEstados) {
    throw new Error(
      'PASO_164_ERROR: no existe el rango CFG_ESTADO_TAREA'
    );
  }

  const estadosConfigurados =
    rangoEstados
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return String(valor)
          .trim()
          .toUpperCase();
      })
      .filter(function(valor) {
        return valor !== '';
      });

  if (estadosConfigurados.length === 0) {
    throw new Error(
      'PASO_164_ERROR: CFG_ESTADO_TAREA no contiene estados'
    );
  }

  const estadoInvalido =
    'ESTADO-INEXISTENTE-P164';

  if (
    estadosConfigurados.includes(
      estadoInvalido
    )
  ) {
    throw new Error(
      'PASO_164_ERROR: el estado temporal ya existe en CFG_ESTADO_TAREA'
    );
  }

  const filasTareasIniciales =
    hojaTareas.getLastRow();

  const filasProcesosIniciales =
    hojaProcesos.getLastRow();

  const ultimaColumnaProcesos =
    hojaProcesos.getLastColumn();

  if (ultimaColumnaProcesos < 1) {
    throw new Error(
      'PASO_164_ERROR: 05_PROCESOS no contiene columnas'
    );
  }

  const cabecerasProcesos =
    hojaProcesos
      .getRange(
        1,
        1,
        1,
        ultimaColumnaProcesos
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

  const procesoTemporalId =
    'PRO-TEMP-P164';

  const registroProcesoTemporal = {
    ID: procesoTemporalId,
    PRODUCTO_ID: 'PRD-TEMP-P164',
    NOMBRE: 'Proceso temporal paso 164',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_164',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_164',
    ACTIVO: 'SÍ'
  };

  const filaProcesoTemporal =
    cabecerasProcesos.map(
      function(cabecera) {
        return Object.prototype
          .hasOwnProperty.call(
            registroProcesoTemporal,
            cabecera
          )
          ? registroProcesoTemporal[cabecera]
          : '';
      }
    );

  let filaProcesoInsertada = null;
  let errorEsperadoDetectado = false;

  try {
    hojaProcesos.appendRow(
      filaProcesoTemporal
    );

    SpreadsheetApp.flush();

    filaProcesoInsertada =
      hojaProcesos.getLastRow();

    insertarRegistroTransaccional(
      'TAREA',
      {
        PROCESO_ID: procesoTemporalId,
        NOMBRE: 'Tarea temporal paso 164',
        ORDEN_SECUENCIA: 1,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO: estadoInvalido,
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó un ESTADO de tarea inválido'
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
        'ERROR_INSERCION_TAREA'
      ) !== -1 &&
      mensaje.toUpperCase().indexOf(
        'ESTADO'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: ESTADO de tarea inválido rechazado'
        : 'ERR: error distinto al esperado'
    );

  } finally {
    if (
      filaProcesoInsertada !== null &&
      hojaProcesos.getLastRow() >=
        filaProcesoInsertada
    ) {
      hojaProcesos.deleteRow(
        filaProcesoInsertada
      );

      SpreadsheetApp.flush();
    }
  }

  const filasTareasFinales =
    hojaTareas.getLastRow();

  const filasProcesosFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Estados configurados: ' +
    estadosConfigurados.join(', ')
  );

  console.log(
    'Estado inválido probado: ' +
    estadoInvalido
  );

  console.log(
    'Filas tareas iniciales: ' +
    filasTareasIniciales
  );

  console.log(
    'Filas tareas finales: ' +
    filasTareasFinales
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
    '06_TAREAS sin cambios: ' +
    (
      filasTareasIniciales ===
      filasTareasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  console.log(
    '05_PROCESOS restaurada: ' +
    (
      filasProcesosIniciales ===
      filasProcesosFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_164_ERROR: no se rechazó el ESTADO de tarea inválido'
    );
  }

  if (
    filasTareasIniciales !==
    filasTareasFinales
  ) {
    throw new Error(
      'PASO_164_ERROR: 06_TAREAS fue modificada'
    );
  }

  if (
    filasProcesosIniciales !==
    filasProcesosFinales
  ) {
    throw new Error(
      'PASO_164_ERROR: 05_PROCESOS no fue restaurada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 164 superada'
  );
}

function pruebaPaso165_PorcentajeAvanceTareaInvalido() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaTareas =
    ss.getSheetByName('06_TAREAS');

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  if (!hojaTareas) {
    throw new Error(
      'PASO_165_ERROR: no existe la hoja 06_TAREAS'
    );
  }

  if (!hojaProcesos) {
    throw new Error(
      'PASO_165_ERROR: no existe la hoja 05_PROCESOS'
    );
  }

  const filasTareasIniciales =
    hojaTareas.getLastRow();

  const filasProcesosIniciales =
    hojaProcesos.getLastRow();

  const ultimaColumnaProcesos =
    hojaProcesos.getLastColumn();

  if (ultimaColumnaProcesos < 1) {
    throw new Error(
      'PASO_165_ERROR: 05_PROCESOS no contiene columnas'
    );
  }

  const cabecerasProcesos =
    hojaProcesos
      .getRange(
        1,
        1,
        1,
        ultimaColumnaProcesos
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

  const procesoTemporalId =
    'PRO-TEMP-P165';

  const registroProcesoTemporal = {
    ID: procesoTemporalId,
    PRODUCTO_ID: 'PRD-TEMP-P165',
    NOMBRE: 'Proceso temporal paso 165',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_165',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_165',
    ACTIVO: 'SÍ'
  };

  const filaProcesoTemporal =
    cabecerasProcesos.map(
      function(cabecera) {
        return Object.prototype
          .hasOwnProperty.call(
            registroProcesoTemporal,
            cabecera
          )
          ? registroProcesoTemporal[cabecera]
          : '';
      }
    );

  let filaProcesoInsertada = null;
  let errorEsperadoDetectado = false;

  try {
    hojaProcesos.appendRow(
      filaProcesoTemporal
    );

    SpreadsheetApp.flush();

    filaProcesoInsertada =
      hojaProcesos.getLastRow();

    insertarRegistroTransaccional(
      'TAREA',
      {
        PROCESO_ID: procesoTemporalId,
        NOMBRE: 'Tarea temporal paso 165',
        ORDEN_SECUENCIA: 1,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO: 'Pendiente',
        PORCENTAJE_AVANCE: 101
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó un PORCENTAJE_AVANCE inválido'
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
        'ERROR_INSERCION_TAREA'
      ) !== -1 &&
      mensaje.indexOf(
        'PORCENTAJE_AVANCE debe ser un número entre 0 y 100'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: PORCENTAJE_AVANCE inválido rechazado'
        : 'ERR: error distinto al esperado'
    );

  } finally {
    if (
      filaProcesoInsertada !== null &&
      hojaProcesos.getLastRow() >=
        filaProcesoInsertada
    ) {
      hojaProcesos.deleteRow(
        filaProcesoInsertada
      );

      SpreadsheetApp.flush();
    }
  }

  const filasTareasFinales =
    hojaTareas.getLastRow();

  const filasProcesosFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Filas tareas iniciales: ' +
    filasTareasIniciales
  );

  console.log(
    'Filas tareas finales: ' +
    filasTareasFinales
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
    '06_TAREAS sin cambios: ' +
    (
      filasTareasIniciales ===
      filasTareasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  console.log(
    '05_PROCESOS restaurada: ' +
    (
      filasProcesosIniciales ===
      filasProcesosFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_165_ERROR: no se rechazó PORCENTAJE_AVANCE inválido'
    );
  }

  if (
    filasTareasIniciales !==
    filasTareasFinales
  ) {
    throw new Error(
      'PASO_165_ERROR: 06_TAREAS fue modificada'
    );
  }

  if (
    filasProcesosIniciales !==
    filasProcesosFinales
  ) {
    throw new Error(
      'PASO_165_ERROR: 05_PROCESOS no fue restaurada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 165 superada'
  );
}

function pruebaPaso166_OrdenSecuenciaTareaDuplicado() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaTareas =
    ss.getSheetByName('06_TAREAS');

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  if (!hojaTareas) {
    throw new Error(
      'PASO_166_ERROR: no existe la hoja 06_TAREAS'
    );
  }

  if (!hojaProcesos) {
    throw new Error(
      'PASO_166_ERROR: no existe la hoja 05_PROCESOS'
    );
  }

  const filasTareasIniciales =
    hojaTareas.getLastRow();

  const filasProcesosIniciales =
    hojaProcesos.getLastRow();

  const cabecerasProcesos =
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

  const cabecerasTareas =
    hojaTareas
      .getRange(
        1,
        1,
        1,
        hojaTareas.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

  const procesoTemporalId =
    'PRO-TEMP-P166';

  const tareaTemporalId =
    'TAR-TEMP-P166';

  const ordenDuplicado =
    1;

  const registroProcesoTemporal = {
    ID: procesoTemporalId,
    PRODUCTO_ID: 'PRD-TEMP-P166',
    NOMBRE: 'Proceso temporal paso 166',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_166',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_166',
    ACTIVO: 'SÍ'
  };

  const registroTareaTemporal = {
    ID: tareaTemporalId,
    PROCESO_ID: procesoTemporalId,
    NOMBRE: 'Tarea existente paso 166',
    ORDEN_SECUENCIA: ordenDuplicado,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_166',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_166',
    ACTIVO: 'SÍ'
  };

  const filaProcesoTemporal =
    cabecerasProcesos.map(
      function(cabecera) {
        return Object.prototype
          .hasOwnProperty.call(
            registroProcesoTemporal,
            cabecera
          )
          ? registroProcesoTemporal[cabecera]
          : '';
      }
    );

  const filaTareaTemporal =
    cabecerasTareas.map(
      function(cabecera) {
        return Object.prototype
          .hasOwnProperty.call(
            registroTareaTemporal,
            cabecera
          )
          ? registroTareaTemporal[cabecera]
          : '';
      }
    );

  let filaProcesoInsertada = null;
  let filaTareaInsertada = null;
  let errorEsperadoDetectado = false;

  try {
    hojaProcesos.appendRow(
      filaProcesoTemporal
    );

    SpreadsheetApp.flush();

    filaProcesoInsertada =
      hojaProcesos.getLastRow();

    hojaTareas.appendRow(
      filaTareaTemporal
    );

    SpreadsheetApp.flush();

    filaTareaInsertada =
      hojaTareas.getLastRow();

    insertarRegistroTransaccional(
      'TAREA',
      {
        PROCESO_ID: procesoTemporalId,
        NOMBRE: 'Tarea duplicada paso 166',
        ORDEN_SECUENCIA: ordenDuplicado,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO: 'Pendiente',
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
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
        'ERROR_INSERCION_TAREA'
      ) !== -1 &&
      mensaje.indexOf(
        'ORDEN_SECUENCIA duplicado para PROCESO_ID'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: ORDEN_SECUENCIA duplicado rechazado'
        : 'ERR: error distinto al esperado'
    );

  } finally {
    if (
      filaTareaInsertada !== null &&
      hojaTareas.getLastRow() >=
        filaTareaInsertada
    ) {
      hojaTareas.deleteRow(
        filaTareaInsertada
      );

      SpreadsheetApp.flush();
    }

    if (
      filaProcesoInsertada !== null &&
      hojaProcesos.getLastRow() >=
        filaProcesoInsertada
    ) {
      hojaProcesos.deleteRow(
        filaProcesoInsertada
      );

      SpreadsheetApp.flush();
    }
  }

  const filasTareasFinales =
    hojaTareas.getLastRow();

  const filasProcesosFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Proceso temporal: ' +
    procesoTemporalId
  );

  console.log(
    'Orden duplicado probado: ' +
    ordenDuplicado
  );

  console.log(
    'Filas tareas iniciales: ' +
    filasTareasIniciales
  );

  console.log(
    'Filas tareas finales: ' +
    filasTareasFinales
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
    '06_TAREAS restaurada: ' +
    (
      filasTareasIniciales ===
      filasTareasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  console.log(
    '05_PROCESOS restaurada: ' +
    (
      filasProcesosIniciales ===
      filasProcesosFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_166_ERROR: no se rechazó el ORDEN_SECUENCIA duplicado'
    );
  }

  if (
    filasTareasIniciales !==
    filasTareasFinales
  ) {
    throw new Error(
      'PASO_166_ERROR: 06_TAREAS no fue restaurada'
    );
  }

  if (
    filasProcesosIniciales !==
    filasProcesosFinales
  ) {
    throw new Error(
      'PASO_166_ERROR: 05_PROCESOS no fue restaurada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 166 superada'
  );
}

function pruebaPaso167_TareaPredecesoraInvalida() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaTareas =
    ss.getSheetByName('06_TAREAS');

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  if (!hojaTareas) {
    throw new Error(
      'PASO_167_ERROR: no existe la hoja 06_TAREAS'
    );
  }

  if (!hojaProcesos) {
    throw new Error(
      'PASO_167_ERROR: no existe la hoja 05_PROCESOS'
    );
  }

  const filasTareasIniciales =
    hojaTareas.getLastRow();

  const filasProcesosIniciales =
    hojaProcesos.getLastRow();

  const cabecerasProcesos =
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

  const procesoTemporalId =
    'PRO-TEMP-P167';

  const registroProcesoTemporal = {
    ID: procesoTemporalId,
    PRODUCTO_ID: 'PRD-TEMP-P167',
    NOMBRE: 'Proceso temporal paso 167',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_167',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_167',
    ACTIVO: 'SÍ'
  };

  const filaProcesoTemporal =
    cabecerasProcesos.map(
      function(cabecera) {
        return Object.prototype
          .hasOwnProperty.call(
            registroProcesoTemporal,
            cabecera
          )
          ? registroProcesoTemporal[cabecera]
          : '';
      }
    );

  let filaProcesoInsertada = null;
  let errorEsperadoDetectado = false;

  try {
    hojaProcesos.appendRow(
      filaProcesoTemporal
    );

    SpreadsheetApp.flush();

    filaProcesoInsertada =
      hojaProcesos.getLastRow();

    insertarRegistroTransaccional(
      'TAREA',
      {
        PROCESO_ID: procesoTemporalId,
        NOMBRE: 'Tarea temporal paso 167',
        ORDEN_SECUENCIA: 2,
        TAREA_PREDECESORA_ID:
          'TAR-INEXISTENTE-P167',
        DURACION_PREVISTA_DIAS: 1,
        ESTADO: 'Pendiente',
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó una TAREA_PREDECESORA_ID inexistente'
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
        'ERROR_INSERCION_TAREA'
      ) !== -1 &&
      mensaje.indexOf(
        'TAREA_PREDECESORA_ID no existe'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: TAREA_PREDECESORA_ID inexistente rechazada'
        : 'ERR: error distinto al esperado'
    );

  } finally {
    if (
      filaProcesoInsertada !== null &&
      hojaProcesos.getLastRow() >=
        filaProcesoInsertada
    ) {
      hojaProcesos.deleteRow(
        filaProcesoInsertada
      );

      SpreadsheetApp.flush();
    }
  }

  const filasTareasFinales =
    hojaTareas.getLastRow();

  const filasProcesosFinales =
    hojaProcesos.getLastRow();

  console.log(
    'Filas tareas iniciales: ' +
    filasTareasIniciales
  );

  console.log(
    'Filas tareas finales: ' +
    filasTareasFinales
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
    '06_TAREAS sin cambios: ' +
    (
      filasTareasIniciales ===
      filasTareasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  console.log(
    '05_PROCESOS restaurada: ' +
    (
      filasProcesosIniciales ===
      filasProcesosFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_167_ERROR: no se rechazó TAREA_PREDECESORA_ID inexistente'
    );
  }

  if (
    filasTareasIniciales !==
    filasTareasFinales
  ) {
    throw new Error(
      'PASO_167_ERROR: 06_TAREAS fue modificada'
    );
  }

  if (
    filasProcesosIniciales !==
    filasProcesosFinales
  ) {
    throw new Error(
      'PASO_167_ERROR: 05_PROCESOS no fue restaurada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 167 superada'
  );
}

function pruebaPaso168_PredecessoraOtroProceso() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaTareas =
    ss.getSheetByName('06_TAREAS');

  if (!hojaProcesos) {
    throw new Error(
      'PASO_168_ERROR: no existe la hoja 05_PROCESOS'
    );
  }

  if (!hojaTareas) {
    throw new Error(
      'PASO_168_ERROR: no existe la hoja 06_TAREAS'
    );
  }

  const filasProcesosIniciales =
    hojaProcesos.getLastRow();

  const filasTareasIniciales =
    hojaTareas.getLastRow();

  const cabecerasProcesos =
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

  const cabecerasTareas =
    hojaTareas
      .getRange(
        1,
        1,
        1,
        hojaTareas.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

  const procesoOrigenId =
    'PRO-TEMP-P168-A';

  const procesoDestinoId =
    'PRO-TEMP-P168-B';

  const tareaPredecesoraId =
    'TAR-TEMP-P168';

  const registroProcesoOrigen = {
    ID: procesoOrigenId,
    PRODUCTO_ID: 'PRD-TEMP-P168',
    NOMBRE: 'Proceso origen paso 168',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_168',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_168',
    ACTIVO: 'SÍ'
  };

  const registroProcesoDestino = {
    ID: procesoDestinoId,
    PRODUCTO_ID: 'PRD-TEMP-P168',
    NOMBRE: 'Proceso destino paso 168',
    ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_168',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_168',
    ACTIVO: 'SÍ'
  };

  const registroTareaPredecesora = {
    ID: tareaPredecesoraId,
    PROCESO_ID: procesoOrigenId,
    NOMBRE: 'Tarea predecesora paso 168',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_168',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_168',
    ACTIVO: 'SÍ'
  };

  const construirFila =
    function(cabeceras, registro) {
      return cabeceras.map(
        function(cabecera) {
          return Object.prototype
            .hasOwnProperty.call(
              registro,
              cabecera
            )
            ? registro[cabecera]
            : '';
        }
      );
    };

  let errorEsperadoDetectado =
    false;

  try {
    hojaProcesos.appendRow(
      construirFila(
        cabecerasProcesos,
        registroProcesoOrigen
      )
    );

    hojaProcesos.appendRow(
      construirFila(
        cabecerasProcesos,
        registroProcesoDestino
      )
    );

    hojaTareas.appendRow(
      construirFila(
        cabecerasTareas,
        registroTareaPredecesora
      )
    );

    SpreadsheetApp.flush();

    insertarRegistroTransaccional(
      'TAREA',
      {
        PROCESO_ID: procesoDestinoId,
        NOMBRE: 'Tarea inválida paso 168',
        ORDEN_SECUENCIA: 1,
        TAREA_PREDECESORA_ID:
          tareaPredecesoraId,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO: 'Pendiente',
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó una predecesora de otro proceso'
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
        'ERROR_INSERCION_TAREA'
      ) !== -1 &&
      mensaje.indexOf(
        'TAREA_PREDECESORA_ID pertenece a otro proceso'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: predecesora de otro proceso rechazada'
        : 'ERR: error distinto al esperado'
    );

  } finally {
    eliminarFilaPorIdPaso168_(
      hojaTareas,
      tareaPredecesoraId
    );

    eliminarFilaPorIdPaso168_(
      hojaProcesos,
      procesoDestinoId
    );

    eliminarFilaPorIdPaso168_(
      hojaProcesos,
      procesoOrigenId
    );

    SpreadsheetApp.flush();
  }

  const filasProcesosFinales =
    hojaProcesos.getLastRow();

  const filasTareasFinales =
    hojaTareas.getLastRow();

  console.log(
    'Filas procesos iniciales: ' +
    filasProcesosIniciales
  );

  console.log(
    'Filas procesos finales: ' +
    filasProcesosFinales
  );

  console.log(
    'Filas tareas iniciales: ' +
    filasTareasIniciales
  );

  console.log(
    'Filas tareas finales: ' +
    filasTareasFinales
  );

  console.log(
    '05_PROCESOS restaurada: ' +
    (
      filasProcesosIniciales ===
      filasProcesosFinales
        ? 'OK'
        : 'ERR'
    )
  );

  console.log(
    '06_TAREAS restaurada: ' +
    (
      filasTareasIniciales ===
      filasTareasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_168_ERROR: no se rechazó la predecesora de otro proceso'
    );
  }

  if (
    filasProcesosIniciales !==
    filasProcesosFinales
  ) {
    throw new Error(
      'PASO_168_ERROR: 05_PROCESOS no fue restaurada'
    );
  }

  if (
    filasTareasIniciales !==
    filasTareasFinales
  ) {
    throw new Error(
      'PASO_168_ERROR: 06_TAREAS no fue restaurada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 168 superada'
  );
}


function eliminarFilaPorIdPaso168_(
  hoja,
  idBuscado
) {
  const ultimaFila =
    hoja.getLastRow();

  const ultimaColumna =
    hoja.getLastColumn();

  if (
    ultimaFila < 2 ||
    ultimaColumna < 1
  ) {
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
      .map(function(valor) {
        return String(valor).trim();
      });

  const indiceId =
    cabeceras.indexOf('ID');

  if (indiceId === -1) {
    throw new Error(
      'No existe la columna ID en ' +
      hoja.getName()
    );
  }

  const valores =
    hoja
      .getRange(
        2,
        indiceId + 1,
        ultimaFila - 1,
        1
      )
      .getDisplayValues();

  const idNormalizado =
    String(idBuscado)
      .trim()
      .toUpperCase();

  for (
    let indice = valores.length - 1;
    indice >= 0;
    indice--
  ) {
    const idFila =
      String(
        valores[indice][0] || ''
      )
        .trim()
        .toUpperCase();

    if (idFila === idNormalizado) {
      hoja.deleteRow(
        indice + 2
      );
    }
  }
}

function pruebaPaso169_OrdenPredecesoraInvalido() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaTareas =
    ss.getSheetByName('06_TAREAS');

  if (!hojaProcesos) {
    throw new Error(
      'PASO_169_ERROR: no existe la hoja 05_PROCESOS'
    );
  }

  if (!hojaTareas) {
    throw new Error(
      'PASO_169_ERROR: no existe la hoja 06_TAREAS'
    );
  }

  const filasProcesosIniciales =
    hojaProcesos.getLastRow();

  const filasTareasIniciales =
    hojaTareas.getLastRow();

  const cabecerasProcesos =
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

  const cabecerasTareas =
    hojaTareas
      .getRange(
        1,
        1,
        1,
        hojaTareas.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

  const procesoTemporalId =
    'PRO-TEMP-P169';

  const tareaPredecesoraId =
    'TAR-TEMP-P169';

  /*
   * La predecesora tendrá orden 2.
   * La nueva tarea intentará usar orden 1.
   *
   * Como 2 >= 1, debe ser rechazada.
   */
  const ordenPredecesora =
    2;

  const ordenNuevaTarea =
    1;

  const registroProcesoTemporal = {
    ID: procesoTemporalId,
    PRODUCTO_ID: 'PRD-TEMP-P169',
    NOMBRE: 'Proceso temporal paso 169',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_169',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_169',
    ACTIVO: 'SÍ'
  };

  const registroTareaPredecesora = {
    ID: tareaPredecesoraId,
    PROCESO_ID: procesoTemporalId,
    NOMBRE: 'Tarea predecesora paso 169',
    DESCRIPCION:
      'Predecesora con orden posterior a la nueva tarea',
    ORDEN_SECUENCIA: ordenPredecesora,
    TAREA_PREDECESORA_ID: '',
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_169',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_169',
    ACTIVO: 'SÍ',
    OBSERVACIONES:
      'Registro temporal para PASO 169'
  };

  function construirFila_(
    cabeceras,
    registro
  ) {
    return cabeceras.map(
      function(cabecera) {
        return Object.prototype
          .hasOwnProperty.call(
            registro,
            cabecera
          )
          ? registro[cabecera]
          : '';
      }
    );
  }

  function eliminarFilasPorId_(
    hoja,
    idBuscado
  ) {
    const ultimaFila =
      hoja.getLastRow();

    const ultimaColumna =
      hoja.getLastColumn();

    if (
      ultimaFila < 2 ||
      ultimaColumna < 1
    ) {
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
        .map(function(valor) {
          return String(valor).trim();
        });

    const indiceId =
      cabeceras.indexOf('ID');

    if (indiceId === -1) {
      throw new Error(
        'No existe la columna ID en ' +
        hoja.getName()
      );
    }

    const valoresIds =
      hoja
        .getRange(
          2,
          indiceId + 1,
          ultimaFila - 1,
          1
        )
        .getDisplayValues();

    const idNormalizado =
      String(idBuscado)
        .trim()
        .toUpperCase();

    for (
      let indice = valoresIds.length - 1;
      indice >= 0;
      indice--
    ) {
      const idFila =
        String(
          valoresIds[indice][0] || ''
        )
          .trim()
          .toUpperCase();

      if (idFila === idNormalizado) {
        hoja.deleteRow(
          indice + 2
        );
      }
    }
  }

  let errorEsperadoDetectado =
    false;

  try {
    hojaProcesos.appendRow(
      construirFila_(
        cabecerasProcesos,
        registroProcesoTemporal
      )
    );

    hojaTareas.appendRow(
      construirFila_(
        cabecerasTareas,
        registroTareaPredecesora
      )
    );

    SpreadsheetApp.flush();

    insertarRegistroTransaccional(
      'TAREA',
      {
        PROCESO_ID: procesoTemporalId,
        NOMBRE: 'Nueva tarea paso 169',
        ORDEN_SECUENCIA:
          ordenNuevaTarea,
        TAREA_PREDECESORA_ID:
          tareaPredecesoraId,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO: 'Pendiente',
        PORCENTAJE_AVANCE: 0
      },
      {
        dryRun: true
      }
    );

    console.log(
      'ERR: se aceptó una predecesora con ORDEN_SECUENCIA igual o posterior'
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
        'ERROR_INSERCION_TAREA'
      ) !== -1 &&
      mensaje.indexOf(
        'ORDEN_SECUENCIA de la tarea predecesora debe ser menor'
      ) !== -1;

    console.log(
      errorEsperadoDetectado
        ? 'OK: orden inválido de predecesora rechazado'
        : 'ERR: error distinto al esperado'
    );

  } finally {
    eliminarFilasPorId_(
      hojaTareas,
      tareaPredecesoraId
    );

    eliminarFilasPorId_(
      hojaProcesos,
      procesoTemporalId
    );

    SpreadsheetApp.flush();
  }

  const filasProcesosFinales =
    hojaProcesos.getLastRow();

  const filasTareasFinales =
    hojaTareas.getLastRow();

  console.log(
    'Proceso temporal: ' +
    procesoTemporalId
  );

  console.log(
    'Tarea predecesora: ' +
    tareaPredecesoraId
  );

  console.log(
    'Orden predecesora: ' +
    ordenPredecesora
  );

  console.log(
    'Orden nueva tarea: ' +
    ordenNuevaTarea
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
    'Filas tareas iniciales: ' +
    filasTareasIniciales
  );

  console.log(
    'Filas tareas finales: ' +
    filasTareasFinales
  );

  console.log(
    '05_PROCESOS restaurada: ' +
    (
      filasProcesosIniciales ===
      filasProcesosFinales
        ? 'OK'
        : 'ERR'
    )
  );

  console.log(
    '06_TAREAS restaurada: ' +
    (
      filasTareasIniciales ===
      filasTareasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!errorEsperadoDetectado) {
    throw new Error(
      'PASO_169_ERROR: no se rechazó el orden inválido de la predecesora'
    );
  }

  if (
    filasProcesosIniciales !==
    filasProcesosFinales
  ) {
    throw new Error(
      'PASO_169_ERROR: 05_PROCESOS no fue restaurada'
    );
  }

  if (
    filasTareasIniciales !==
    filasTareasFinales
  ) {
    throw new Error(
      'PASO_169_ERROR: 06_TAREAS no fue restaurada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 169 superada'
  );
}

function pruebaPaso170_PredecessoraValidaDryRun() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaProcesos =
    ss.getSheetByName('05_PROCESOS');

  const hojaTareas =
    ss.getSheetByName('06_TAREAS');

  if (!hojaProcesos) {
    throw new Error(
      'PASO_170_ERROR: no existe la hoja 05_PROCESOS'
    );
  }

  if (!hojaTareas) {
    throw new Error(
      'PASO_170_ERROR: no existe la hoja 06_TAREAS'
    );
  }

  const filasProcesosIniciales =
    hojaProcesos.getLastRow();

  const filasTareasIniciales =
    hojaTareas.getLastRow();

  const cabecerasProcesos =
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

  const cabecerasTareas =
    hojaTareas
      .getRange(
        1,
        1,
        1,
        hojaTareas.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

  const procesoTemporalId =
    'PRO-TEMP-P170';

  const tareaPredecesoraId =
    'TAR-TEMP-P170';

  const ordenPredecesora =
    1;

  const ordenNuevaTarea =
    2;

  const registroProcesoTemporal = {
    ID: procesoTemporalId,
    PRODUCTO_ID: 'PRD-TEMP-P170',
    NOMBRE: 'Proceso temporal paso 170',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_170',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_170',
    ACTIVO: 'SÍ',
    OBSERVACIONES:
      'Registro temporal para PASO 170'
  };

  const registroTareaPredecesora = {
    ID: tareaPredecesoraId,
    PROCESO_ID: procesoTemporalId,
    NOMBRE: 'Tarea predecesora válida paso 170',
    DESCRIPCION:
      'Tarea temporal para probar una relación válida',
    ORDEN_SECUENCIA: ordenPredecesora,
    TAREA_PREDECESORA_ID: '',
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_CREACION: new Date(),
    CREADO_POR: 'PRUEBA_PASO_170',
    FECHA_MODIFICACION: new Date(),
    MODIFICADO_POR: 'PRUEBA_PASO_170',
    ACTIVO: 'SÍ',
    OBSERVACIONES:
      'Registro temporal para PASO 170'
  };

  function construirFila_(
    cabeceras,
    registro
  ) {
    return cabeceras.map(
      function(cabecera) {
        return Object.prototype
          .hasOwnProperty.call(
            registro,
            cabecera
          )
          ? registro[cabecera]
          : '';
      }
    );
  }

  function eliminarFilasPorId_(
    hoja,
    idBuscado
  ) {
    const ultimaFila =
      hoja.getLastRow();

    const ultimaColumna =
      hoja.getLastColumn();

    if (
      ultimaFila < 2 ||
      ultimaColumna < 1
    ) {
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
        .map(function(valor) {
          return String(valor).trim();
        });

    const indiceId =
      cabeceras.indexOf('ID');

    if (indiceId === -1) {
      throw new Error(
        'No existe la columna ID en ' +
        hoja.getName()
      );
    }

    const valoresIds =
      hoja
        .getRange(
          2,
          indiceId + 1,
          ultimaFila - 1,
          1
        )
        .getDisplayValues();

    const idNormalizado =
      String(idBuscado)
        .trim()
        .toUpperCase();

    for (
      let indice = valoresIds.length - 1;
      indice >= 0;
      indice--
    ) {
      const idFila =
        String(
          valoresIds[indice][0] || ''
        )
          .trim()
          .toUpperCase();

      if (idFila === idNormalizado) {
        hoja.deleteRow(
          indice + 2
        );
      }
    }
  }

  let dryRunAceptado =
    false;

  let tareasAntesDryRun =
    null;

  let tareasDespuesDryRun =
    null;

  let resultadoDryRun =
    null;

  try {
    hojaProcesos.appendRow(
      construirFila_(
        cabecerasProcesos,
        registroProcesoTemporal
      )
    );

    hojaTareas.appendRow(
      construirFila_(
        cabecerasTareas,
        registroTareaPredecesora
      )
    );

    SpreadsheetApp.flush();

    tareasAntesDryRun =
      hojaTareas.getLastRow();

    resultadoDryRun =
      insertarRegistroTransaccional(
        'TAREA',
        {
          PROCESO_ID:
            procesoTemporalId,
          NOMBRE:
            'Nueva tarea válida paso 170',
          DESCRIPCION:
            'Tarea válida con predecesora anterior',
          ORDEN_SECUENCIA:
            ordenNuevaTarea,
          TAREA_PREDECESORA_ID:
            tareaPredecesoraId,
          DURACION_PREVISTA_DIAS:
            1,
          ESTADO:
            'Pendiente',
          PORCENTAJE_AVANCE:
            0,
          ACTIVO:
            'SÍ',
          OBSERVACIONES:
            'Dry run PASO 170'
        },
        {
          dryRun: true
        }
      );

    SpreadsheetApp.flush();

    tareasDespuesDryRun =
      hojaTareas.getLastRow();

    dryRunAceptado =
      tareasAntesDryRun ===
      tareasDespuesDryRun;

    console.log(
      'OK: predecesora válida aceptada en dryRun'
    );

    console.log(
      'Resultado dryRun: ' +
      JSON.stringify(resultadoDryRun)
    );

  } catch (error) {
    const mensaje =
      String(
        error && error.message
          ? error.message
          : error
      );

    console.log(
      'ERR: una predecesora válida fue rechazada: ' +
      mensaje
    );

    dryRunAceptado =
      false;

  } finally {
    eliminarFilasPorId_(
      hojaTareas,
      tareaPredecesoraId
    );

    eliminarFilasPorId_(
      hojaProcesos,
      procesoTemporalId
    );

    SpreadsheetApp.flush();
  }

  const filasProcesosFinales =
    hojaProcesos.getLastRow();

  const filasTareasFinales =
    hojaTareas.getLastRow();

  console.log(
    'Proceso temporal: ' +
    procesoTemporalId
  );

  console.log(
    'Tarea predecesora: ' +
    tareaPredecesoraId
  );

  console.log(
    'Orden predecesora: ' +
    ordenPredecesora
  );

  console.log(
    'Orden nueva tarea: ' +
    ordenNuevaTarea
  );

  console.log(
    'Filas antes del dryRun: ' +
    tareasAntesDryRun
  );

  console.log(
    'Filas después del dryRun: ' +
    tareasDespuesDryRun
  );

  console.log(
    'DryRun sin inserción permanente: ' +
    (
      tareasAntesDryRun ===
      tareasDespuesDryRun
        ? 'OK'
        : 'ERR'
    )
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
    'Filas tareas iniciales: ' +
    filasTareasIniciales
  );

  console.log(
    'Filas tareas finales: ' +
    filasTareasFinales
  );

  console.log(
    '05_PROCESOS restaurada: ' +
    (
      filasProcesosIniciales ===
      filasProcesosFinales
        ? 'OK'
        : 'ERR'
    )
  );

  console.log(
    '06_TAREAS restaurada: ' +
    (
      filasTareasIniciales ===
      filasTareasFinales
        ? 'OK'
        : 'ERR'
    )
  );

  if (!dryRunAceptado) {
    throw new Error(
      'PASO_170_ERROR: la relación válida no fue aceptada o dryRun insertó una fila'
    );
  }

  if (
    filasProcesosIniciales !==
    filasProcesosFinales
  ) {
    throw new Error(
      'PASO_170_ERROR: 05_PROCESOS no fue restaurada'
    );
  }

  if (
    filasTareasIniciales !==
    filasTareasFinales
  ) {
    throw new Error(
      'PASO_170_ERROR: 06_TAREAS no fue restaurada'
    );
  }

  console.log(
    'OK: prueba controlada del PASO 170 superada'
  );
}



/**
 * ============================================================
 * CIERRE ENTIDAD TAREA (paso171-172) + APERTURA TAREA_RESPONSABLE
 * (paso173-175). Continua la metodologia pruebaPasoNNN_ existente.
 * NOTA: los valores de catalogo usan el VALOR legible de
 * 90_CONFIGURACION (columna D), no la CLAVE interna (columna C).
 * NOTA 2: eliminarRegistroPruebaPorId_ espera el objeto Sheet,
 * no el nombre de la hoja como string.
 * ============================================================
 */

function pruebaPaso171_InsertarTareaReal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaProductos = ss.getSheetByName('03_PRODUCTOS');
  const hojaProcesos = ss.getSheetByName('05_PROCESOS');
  const hojaTareas = ss.getSheetByName('06_TAREAS');
  const idsCreados = { producto: null, proceso: null, tarea: null };

  try {
    idsCreados.producto = insertarRegistroTransaccional('PRODUCTO', {
      CODIGO: 'TEST-P171-PRD',
      NOMBRE: 'Producto temporal paso171',
      ORIGEN: 'Producción propia',
      UNIDAD: 'Unidad',
      ESTADO: 'Borrador'
    }, { dryRun: false }).id;

    idsCreados.proceso = insertarRegistroTransaccional('PROCESO', {
      PRODUCTO_ID: idsCreados.producto,
      NOMBRE: 'Proceso temporal paso171',
      ORDEN_SECUENCIA: 1,
      DURACION_PREVISTA_DIAS: 2,
      ESTADO: 'Pendiente',
      PORCENTAJE_AVANCE: 0
    }, { dryRun: false }).id;

    const tarea = insertarRegistroTransaccional('TAREA', {
      PROCESO_ID: idsCreados.proceso,
      NOMBRE: 'Tarea real paso171',
      ORDEN_SECUENCIA: 1,
      DURACION_PREVISTA_DIAS: 1,
      ESTADO: 'Pendiente',
      PORCENTAJE_AVANCE: 0
    }, { dryRun: false });
    idsCreados.tarea = tarea.id;

    if (!tarea.id) {
      throw new Error('PASO_171_ERROR: la insercion real de Tarea no devolvio ID');
    }

    console.log('OK: prueba controlada del PASO 171 superada, Tarea ' + tarea.id);

  } finally {
    if (idsCreados.tarea) eliminarRegistroPruebaPorId_(hojaTareas, idsCreados.tarea);
    if (idsCreados.proceso) eliminarRegistroPruebaPorId_(hojaProcesos, idsCreados.proceso);
    if (idsCreados.producto) eliminarRegistroPruebaPorId_(hojaProductos, idsCreados.producto);
    SpreadsheetApp.flush();
  }
}

function pruebaPaso172_ReinicioIdTarea() {
  const siguiente = obtenerSiguienteIdEntidad('TAREA');
  if (siguiente !== 'TAR-0001') {
    throw new Error('PASO_172_ERROR: se esperaba TAR-0001 tras la limpieza, se obtuvo ' + siguiente);
  }
  console.log('OK: prueba controlada del PASO 172 superada, siguiente ID ' + siguiente);
}

/**
 * ============================================================
 * ENTIDAD: TAREA_RESPONSABLE (07_TAREA_RESPONSABLE)
 *
 * Bloqueo inicial (FK/catalogo no validados para entidades mas
 * alla de las 6 originales) RESUELTO: se extendio
 * Repository_InsertarRegistro...gs con el bloque
 * if (clave === 'TAREA_RESPONSABLE') { ... } que valida FK de
 * TAREA_ID y PERSONA_EQUIPO_ID, catalogo de ROL_ASIGNADO y
 * ESTADO (via CFG_ROL_ASIGNACION / CFG_ESTADO_ASIGNACION, ya
 * existentes como named ranges) y rango de
 * PORCENTAJE_DEDICACION. paso173-175 verificados en ejecucion
 * real contra el sheet.
 * ============================================================
 */

function pruebaPaso173_TareaResponsable_CasosInvalidos() {
  const fallos = [];

  try {
    insertarRegistroTransaccional('TAREA_RESPONSABLE', {
      TAREA_ID: 'TAR-9999',
      PERSONA_EQUIPO_ID: 'PER-9999',
      ROL_ASIGNADO: 'Responsable',
      PORCENTAJE_DEDICACION: 50,
      ESTADO: 'Planificada'
    }, { dryRun: true });
    fallos.push('no se rechazo TAREA_ID inexistente');
  } catch (e) { /* comportamiento esperado */ }

  try {
    insertarRegistroTransaccional('TAREA_RESPONSABLE', {
      TAREA_ID: 'TAR-0001',
      PERSONA_EQUIPO_ID: 'PER-0001',
      ROL_ASIGNADO: 'NO_EXISTE',
      PORCENTAJE_DEDICACION: 50,
      ESTADO: 'Planificada'
    }, { dryRun: true });
    fallos.push('no se rechazo ROL_ASIGNADO invalido');
  } catch (e) { /* comportamiento esperado */ }

  try {
    insertarRegistroTransaccional('TAREA_RESPONSABLE', {
      TAREA_ID: 'TAR-0001',
      PERSONA_EQUIPO_ID: 'PER-0001',
      ROL_ASIGNADO: 'Responsable',
      PORCENTAJE_DEDICACION: 150,
      ESTADO: 'Planificada'
    }, { dryRun: true });
    fallos.push('no se rechazo PORCENTAJE_DEDICACION fuera de rango');
  } catch (e) { /* comportamiento esperado */ }

  if (fallos.length > 0) {
    throw new Error('PASO_173_ERROR: ' + fallos.join(' | '));
  }
  console.log('OK: prueba controlada del PASO 173 superada, 3 casos invalidos rechazados');
}

function pruebaPaso174_TareaResponsable_ValidoYReal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaProductos = ss.getSheetByName('03_PRODUCTOS');
  const hojaProcesos = ss.getSheetByName('05_PROCESOS');
  const hojaTareas = ss.getSheetByName('06_TAREAS');
  const hojaPersonas = ss.getSheetByName('11_PERSONAS_EQUIPOS');
  const hojaAsignaciones = ss.getSheetByName('07_TAREA_RESPONSABLE');
  const ids = { producto: null, proceso: null, tarea: null, persona: null, asignacion: null };

  try {
    ids.producto = insertarRegistroTransaccional('PRODUCTO', {
      CODIGO: 'TEST-P174-PRD', NOMBRE: 'Producto temporal paso174',
      ORIGEN: 'Producción propia', UNIDAD: 'Unidad', ESTADO: 'Borrador'
    }, { dryRun: false }).id;

    ids.proceso = insertarRegistroTransaccional('PROCESO', {
      PRODUCTO_ID: ids.producto, NOMBRE: 'Proceso temporal paso174',
      ORDEN_SECUENCIA: 1, DURACION_PREVISTA_DIAS: 1, ESTADO: 'Pendiente', PORCENTAJE_AVANCE: 0
    }, { dryRun: false }).id;

    ids.tarea = insertarRegistroTransaccional('TAREA', {
      PROCESO_ID: ids.proceso, NOMBRE: 'Tarea temporal paso174',
      ORDEN_SECUENCIA: 1, DURACION_PREVISTA_DIAS: 1, ESTADO: 'Pendiente', PORCENTAJE_AVANCE: 0
    }, { dryRun: false }).id;

    ids.persona = insertarRegistroTransaccional('PERSONA_EQUIPO', {
      TIPO: 'Persona', NOMBRE: 'Persona temporal paso174', ROL: 'Carpintero', ESTADO: 'Disponible'
    }, { dryRun: false }).id;

    const dry = insertarRegistroTransaccional('TAREA_RESPONSABLE', {
      TAREA_ID: ids.tarea, PERSONA_EQUIPO_ID: ids.persona,
      ROL_ASIGNADO: 'Responsable', PORCENTAJE_DEDICACION: 50, ESTADO: 'Planificada'
    }, { dryRun: true });
    if (!dry) throw new Error('PASO_174_ERROR: el dry-run valido no devolvio resultado');

    const real = insertarRegistroTransaccional('TAREA_RESPONSABLE', {
      TAREA_ID: ids.tarea, PERSONA_EQUIPO_ID: ids.persona,
      ROL_ASIGNADO: 'Responsable', PORCENTAJE_DEDICACION: 50, ESTADO: 'Planificada'
    }, { dryRun: false });
    ids.asignacion = real.id;
    if (!real.id) throw new Error('PASO_174_ERROR: la insercion real no devolvio ID');

    console.log('OK: prueba controlada del PASO 174 superada, Tarea_Responsable ' + real.id);

  } finally {
    if (ids.asignacion) eliminarRegistroPruebaPorId_(hojaAsignaciones, ids.asignacion);
    if (ids.persona) eliminarRegistroPruebaPorId_(hojaPersonas, ids.persona);
    if (ids.tarea) eliminarRegistroPruebaPorId_(hojaTareas, ids.tarea);
    if (ids.proceso) eliminarRegistroPruebaPorId_(hojaProcesos, ids.proceso);
    if (ids.producto) eliminarRegistroPruebaPorId_(hojaProductos, ids.producto);
    SpreadsheetApp.flush();
  }
}

function pruebaPaso175_ReinicioIdTareaResponsable() {
  const siguiente = obtenerSiguienteIdEntidad('TAREA_RESPONSABLE');
  if (siguiente !== 'TRE-0001') {
    throw new Error('PASO_175_ERROR: se esperaba TRE-0001 tras la limpieza, se obtuvo ' + siguiente);
  }
  console.log('OK: prueba controlada del PASO 175 superada, siguiente ID ' + siguiente);
}

function ejecutarSuitePaso171a175() {
  pruebaPaso171_InsertarTareaReal();
  pruebaPaso172_ReinicioIdTarea();
  pruebaPaso173_TareaResponsable_CasosInvalidos();
  pruebaPaso174_TareaResponsable_ValidoYReal();
  pruebaPaso175_ReinicioIdTareaResponsable();
  console.log('SUITE PASO171-175 COMPLETA: todos los pasos OK');
}



/**
 * ============================================================
 * ENTIDAD: MATERIAL (08_MATERIALES)
 * ============================================================
 */

function pruebaPaso176_Material_CasosInvalidos() {
  const fallos = [];

  try {
    insertarRegistroTransaccional('MATERIAL', {
      CODIGO: 'TEST-P176-MAT',
      NOMBRE: 'Material temporal paso176',
      CATEGORIA: 'NO_EXISTE',
      UNIDAD: 'Unidad',
      ESTADO: 'Disponible'
    }, { dryRun: true });
    fallos.push('no se rechazo CATEGORIA invalida');
  } catch (e) { /* comportamiento esperado */ }

  try {
    insertarRegistroTransaccional('MATERIAL', {
      CODIGO: 'TEST-P176-MAT',
      NOMBRE: 'Material temporal paso176',
      CATEGORIA: 'Madera',
      UNIDAD: 'NO_EXISTE',
      ESTADO: 'Disponible'
    }, { dryRun: true });
    fallos.push('no se rechazo UNIDAD invalida');
  } catch (e) { /* comportamiento esperado */ }

  try {
    insertarRegistroTransaccional('MATERIAL', {
      CODIGO: 'TEST-P176-MAT',
      NOMBRE: 'Material temporal paso176',
      CATEGORIA: 'Madera',
      UNIDAD: 'Unidad',
      ESTADO: 'NO_EXISTE'
    }, { dryRun: true });
    fallos.push('no se rechazo ESTADO invalido');
  } catch (e) { /* comportamiento esperado */ }

  if (fallos.length > 0) {
    throw new Error('PASO_176_ERROR: ' + fallos.join(' | '));
  }
  console.log('OK: prueba controlada del PASO 176 superada, 3 casos invalidos rechazados');
}

function pruebaPaso177_Material_ValidoYReal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaMateriales = ss.getSheetByName('08_MATERIALES');
  let materialId = null;

  try {
    const dry = insertarRegistroTransaccional('MATERIAL', {
      CODIGO: 'TEST-P177-MAT',
      NOMBRE: 'Material temporal paso177',
      CATEGORIA: 'Madera',
      UNIDAD: 'Unidad',
      ESTADO: 'Disponible'
    }, { dryRun: true });
    if (!dry) throw new Error('PASO_177_ERROR: el dry-run valido no devolvio resultado');

    const real = insertarRegistroTransaccional('MATERIAL', {
      CODIGO: 'TEST-P177-MAT',
      NOMBRE: 'Material temporal paso177',
      CATEGORIA: 'Madera',
      UNIDAD: 'Unidad',
      ESTADO: 'Disponible'
    }, { dryRun: false });
    materialId = real.id;
    if (!real.id) throw new Error('PASO_177_ERROR: la insercion real no devolvio ID');

    console.log('OK: prueba controlada del PASO 177 superada, Material ' + real.id);

  } finally {
    if (materialId) eliminarRegistroPruebaPorId_(hojaMateriales, materialId);
    SpreadsheetApp.flush();
  }
}

function pruebaPaso178_ReinicioIdMaterial() {
  const siguiente = obtenerSiguienteIdEntidad('MATERIAL');
  if (siguiente !== 'MAT-0001') {
    throw new Error('PASO_178_ERROR: se esperaba MAT-0001 tras la limpieza, se obtuvo ' + siguiente);
  }
  console.log('OK: prueba controlada del PASO 178 superada, siguiente ID ' + siguiente);
}

function ejecutarSuitePaso176a178() {
  pruebaPaso176_Material_CasosInvalidos();
  pruebaPaso177_Material_ValidoYReal();
  pruebaPaso178_ReinicioIdMaterial();
  console.log('SUITE PASO176-178 COMPLETA: Material verificado OK');
}


/**
 * ============================================================
 * ENTIDAD: PERSONA_EQUIPO (11_PERSONAS_EQUIPOS)
 * ============================================================
 */

function pruebaPaso179_PersonaEquipo_CasosInvalidos() {
  const fallos = [];

  try {
    insertarRegistroTransaccional('PERSONA_EQUIPO', {
      TIPO: 'NO_EXISTE',
      NOMBRE: 'Persona temporal paso179',
      ROL: 'Carpintero',
      ESTADO: 'Disponible'
    }, { dryRun: true });
    fallos.push('no se rechazo TIPO invalido');
  } catch (e) { /* comportamiento esperado */ }

  try {
    insertarRegistroTransaccional('PERSONA_EQUIPO', {
      TIPO: 'Persona',
      NOMBRE: 'Persona temporal paso179',
      ROL: 'Carpintero',
      ESTADO: 'NO_EXISTE'
    }, { dryRun: true });
    fallos.push('no se rechazo ESTADO invalido');
  } catch (e) { /* comportamiento esperado */ }

  if (fallos.length > 0) {
    throw new Error('PASO_179_ERROR: ' + fallos.join(' | '));
  }
  console.log('OK: prueba controlada del PASO 179 superada, 2 casos invalidos rechazados');
}

function pruebaPaso180_PersonaEquipo_ValidoYReal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaPersonas = ss.getSheetByName('11_PERSONAS_EQUIPOS');
  let personaId = null;

  try {
    const dry = insertarRegistroTransaccional('PERSONA_EQUIPO', {
      TIPO: 'Persona',
      NOMBRE: 'Persona temporal paso180',
      ROL: 'Carpintero',
      ESTADO: 'Disponible'
    }, { dryRun: true });
    if (!dry) throw new Error('PASO_180_ERROR: el dry-run valido no devolvio resultado');

    const real = insertarRegistroTransaccional('PERSONA_EQUIPO', {
      TIPO: 'Persona',
      NOMBRE: 'Persona temporal paso180',
      ROL: 'Carpintero',
      ESTADO: 'Disponible'
    }, { dryRun: false });
    personaId = real.id;
    if (!real.id) throw new Error('PASO_180_ERROR: la insercion real no devolvio ID');

    console.log('OK: prueba controlada del PASO 180 superada, Persona_Equipo ' + real.id);

  } finally {
    if (personaId) eliminarRegistroPruebaPorId_(hojaPersonas, personaId);
    SpreadsheetApp.flush();
  }
}

function pruebaPaso181_ReinicioIdPersonaEquipo() {
  const siguiente = obtenerSiguienteIdEntidad('PERSONA_EQUIPO');
  if (siguiente !== 'PER-0001') {
    throw new Error('PASO_181_ERROR: se esperaba PER-0001 tras la limpieza, se obtuvo ' + siguiente);
  }
  console.log('OK: prueba controlada del PASO 181 superada, siguiente ID ' + siguiente);
}

function ejecutarSuitePaso179a181() {
  pruebaPaso179_PersonaEquipo_CasosInvalidos();
  pruebaPaso180_PersonaEquipo_ValidoYReal();
  pruebaPaso181_ReinicioIdPersonaEquipo();
  console.log('SUITE PASO179-181 COMPLETA: Persona_Equipo verificado OK');
}


function pruebaPaso182_ProductoMaterialFKInvalida() {
  Logger.log('=== PASO 182: PRODUCTO_MATERIAL con PRODUCTO_ID inexistente ===');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaMaterial = ss.getSheetByName('08_MATERIALES');

  var datosMaterial = {
    CODIGO: 'MAT-P182',
    NOMBRE: 'Material de prueba paso182',
    CATEGORIA: 'Madera',
    UNIDAD: 'Unidad',
    ESTADO: 'Disponible'
  };
  var material = insertarRegistroTransaccional('MATERIAL', datosMaterial, {dryRun: false});

  var errorCapturado = null;
  try {
    var datos = {
      PRODUCTO_ID: 'PRD-9999',
      MATERIAL_ID: material.id,
      CANTIDAD_PREVISTA: 5,
      UNIDAD: 'Unidad',
      ESTADO: 'Planificada'
    };
    insertarRegistroTransaccional('PRODUCTO_MATERIAL', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }

  eliminarRegistroPruebaPorId_(hojaMaterial, material.id);

  if (!errorCapturado) {
    throw new Error('PASO 182 FALLIDO: se esperaba un error por PRODUCTO_ID inexistente y no se produjo.');
  }
  Logger.log('PASO 182 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso183_ProductoMaterialEstadoInvalido() {
  Logger.log('=== PASO 183: PRODUCTO_MATERIAL con ESTADO invalido ===');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaProducto = ss.getSheetByName('03_PRODUCTOS');
  var hojaMaterial = ss.getSheetByName('08_MATERIALES');

  var datosProducto = {
    CODIGO: 'PRD-P183',
    NOMBRE: 'Producto de prueba paso183',
    ORIGEN: 'Producción propia',
    UNIDAD: 'Unidad',
    ESTADO: 'Borrador'
  };
  var producto = insertarRegistroTransaccional('PRODUCTO', datosProducto, {dryRun: false});

  var datosMaterial = {
    CODIGO: 'MAT-P183',
    NOMBRE: 'Material de prueba paso183',
    CATEGORIA: 'Madera',
    UNIDAD: 'Unidad',
    ESTADO: 'Disponible'
  };
  var material = insertarRegistroTransaccional('MATERIAL', datosMaterial, {dryRun: false});

  var errorCapturado = null;
  try {
    var datos = {
      PRODUCTO_ID: producto.id,
      MATERIAL_ID: material.id,
      CANTIDAD_PREVISTA: 5,
      UNIDAD: 'Unidad',
      ESTADO: 'Descatalogada'
    };
    insertarRegistroTransaccional('PRODUCTO_MATERIAL', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }

  eliminarRegistroPruebaPorId_(hojaProducto, producto.id);
  eliminarRegistroPruebaPorId_(hojaMaterial, material.id);

  if (!errorCapturado) {
    throw new Error('PASO 183 FALLIDO: se esperaba un error por ESTADO invalido y no se produjo.');
  }
  Logger.log('PASO 183 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso184_ProductoMaterialValido() {
  Logger.log('=== PASO 184: PRODUCTO_MATERIAL valido (dry-run + insercion real) ===');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaProducto = ss.getSheetByName('03_PRODUCTOS');
  var hojaMaterial = ss.getSheetByName('08_MATERIALES');
  var hojaProductoMaterial = ss.getSheetByName('09_PRODUCTO_MATERIAL');

  var datosProducto = {
    CODIGO: 'PRD-P184',
    NOMBRE: 'Producto de prueba paso184',
    ORIGEN: 'Producción propia',
    UNIDAD: 'Unidad',
    ESTADO: 'Borrador'
  };
  var producto = insertarRegistroTransaccional('PRODUCTO', datosProducto, {dryRun: false});

  var datosMaterial = {
    CODIGO: 'MAT-P184',
    NOMBRE: 'Material de prueba paso184',
    CATEGORIA: 'Madera',
    UNIDAD: 'Unidad',
    ESTADO: 'Disponible'
  };
  var material = insertarRegistroTransaccional('MATERIAL', datosMaterial, {dryRun: false});

  var datos = {
    PRODUCTO_ID: producto.id,
    MATERIAL_ID: material.id,
    CANTIDAD_PREVISTA: 5,
    UNIDAD: 'Unidad',
    ESTADO: 'Planificada'
  };

  var resultadoDry = insertarRegistroTransaccional('PRODUCTO_MATERIAL', datos, {dryRun: true});
  if (!resultadoDry || !resultadoDry.id) {
    throw new Error('PASO 184 FALLIDO: el dry-run no devolvio un id previsto.');
  }
  Logger.log('PASO 184: dry-run OK, id previsto -> ' + resultadoDry.id);

  var resultadoReal = insertarRegistroTransaccional('PRODUCTO_MATERIAL', datos, {dryRun: false});
  if (!resultadoReal || !resultadoReal.id) {
    throw new Error('PASO 184 FALLIDO: la insercion real no devolvio un id.');
  }
  Logger.log('PASO 184: insercion real OK, id -> ' + resultadoReal.id);

  eliminarRegistroPruebaPorId_(hojaProductoMaterial, resultadoReal.id);
  eliminarRegistroPruebaPorId_(hojaProducto, producto.id);
  eliminarRegistroPruebaPorId_(hojaMaterial, material.id);
  Logger.log('PASO 184 OK: registros de prueba eliminados');
}

function ejecutarSuitePaso182a184() {
  pruebaPaso182_ProductoMaterialFKInvalida();
  pruebaPaso183_ProductoMaterialEstadoInvalido();
  pruebaPaso184_ProductoMaterialValido();
  Logger.log('SUITE PASO 182-184 (PRODUCTO_MATERIAL) COMPLETADA CON EXITO');
}


function construirCadenaTareaPrueba_(sufijo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var campana = insertarRegistroTransaccional('CAMPANA', {
    NOMBRE: 'Campana prueba ' + sufijo,
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var proyecto = insertarRegistroTransaccional('PROYECTO', {
    CAMPANA_ID: campana.id,
    NOMBRE: 'Proyecto prueba ' + sufijo,
    TIPO_PROYECTO: 'Propuesta',
    PRIORIDAD: 'Media',
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var producto = insertarRegistroTransaccional('PRODUCTO', {
    CODIGO: 'PRD-' + sufijo,
    NOMBRE: 'Producto prueba ' + sufijo,
    ORIGEN: 'Producción propia',
    UNIDAD: 'Unidad',
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var proyectoProducto = insertarRegistroTransaccional('PROYECTO_PRODUCTO', {
    PROYECTO_ID: proyecto.id,
    PRODUCTO_ID: producto.id,
    CANTIDAD_ASIGNADA: 1,
    PRIORIDAD: 'Media',
    ESTADO: 'Planificada',
    OBSERVACIONES: 'Prueba ' + sufijo
  }, {dryRun: false});

  var proceso = insertarRegistroTransaccional('PROCESO', {
    PRODUCTO_ID: producto.id,
    NOMBRE: 'Proceso prueba ' + sufijo,
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0
  }, {dryRun: false});

  var tarea = insertarRegistroTransaccional('TAREA', {
    PROCESO_ID: proceso.id,
    NOMBRE: 'Tarea prueba ' + sufijo,
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0
  }, {dryRun: false});

  return {
    ss: ss,
    campanaId: campana.id,
    proyectoId: proyecto.id,
    productoId: producto.id,
    proyectoProductoId: proyectoProducto.id,
    procesoId: proceso.id,
    tareaId: tarea.id
  };
}

function limpiarCadenaTareaPrueba_(cadena) {
  var ss = cadena.ss;
  eliminarFilasPorColumnaValor_(ss.getSheetByName('07_TAREA_RESPONSABLE'), 'TAREA_ID', cadena.tareaId);
  eliminarFilasPorColumnaValor_(ss.getSheetByName('10_TAREA_MATERIAL'), 'TAREA_ID', cadena.tareaId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('06_TAREAS'), cadena.tareaId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('05_PROCESOS'), cadena.procesoId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('04_PROYECTO_PRODUCTO'), cadena.proyectoProductoId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('03_PRODUCTOS'), cadena.productoId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('02_PROYECTOS'), cadena.proyectoId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('01_CAMPANAS'), cadena.campanaId);
}

function eliminarFilasPorColumnaValor_(hoja, columna, valor) {
  if (!hoja || !valor || hoja.getLastRow() < 2) {
    return;
  }
  var cabeceras = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getDisplayValues()[0].map(function (v) { return String(v).trim(); });
  var indice = cabeceras.indexOf(columna);
  if (indice === -1) {
    return;
  }
  var valores = hoja.getRange(2, indice + 1, hoja.getLastRow() - 1, 1).getDisplayValues().flat();
  for (var i = valores.length - 1; i >= 0; i--) {
    if (String(valores[i]).trim() === String(valor).trim()) {
      hoja.deleteRow(i + 2);
    }
  }
}

function pruebaPaso185_TareaMaterialFKInvalida() {
  Logger.log('=== PASO 185: TAREA_MATERIAL con TAREA_ID inexistente ===');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaMaterial = ss.getSheetByName('08_MATERIALES');

  var datosMaterial = {
    CODIGO: 'MAT-P185',
    NOMBRE: 'Material de prueba paso185',
    CATEGORIA: 'Madera',
    UNIDAD: 'Unidad',
    ESTADO: 'Disponible'
  };
  var material = insertarRegistroTransaccional('MATERIAL', datosMaterial, {dryRun: false});

  var errorCapturado = null;
  try {
    var datos = {
      TAREA_ID: 'TAR-9999',
      MATERIAL_ID: material.id,
      CANTIDAD_PREVISTA: 5,
      UNIDAD: 'Unidad',
      ESTADO: 'Planificada'
    };
    insertarRegistroTransaccional('TAREA_MATERIAL', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }

  eliminarRegistroPruebaPorId_(hojaMaterial, material.id);

  if (!errorCapturado) {
    throw new Error('PASO 185 FALLIDO: se esperaba un error por TAREA_ID inexistente y no se produjo.');
  }
  Logger.log('PASO 185 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso186_TareaMaterialEstadoInvalido() {
  Logger.log('=== PASO 186: TAREA_MATERIAL con ESTADO invalido ===');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaMaterial = ss.getSheetByName('08_MATERIALES');
  var cadena = construirCadenaTareaPrueba_('P186');

  var datosMaterial = {
    CODIGO: 'MAT-P186',
    NOMBRE: 'Material de prueba paso186',
    CATEGORIA: 'Madera',
    UNIDAD: 'Unidad',
    ESTADO: 'Disponible'
  };
  var material = insertarRegistroTransaccional('MATERIAL', datosMaterial, {dryRun: false});

  var errorCapturado = null;
  try {
    var datos = {
      TAREA_ID: cadena.tareaId,
      MATERIAL_ID: material.id,
      CANTIDAD_PREVISTA: 5,
      UNIDAD: 'Unidad',
      ESTADO: 'Descatalogada'
    };
    insertarRegistroTransaccional('TAREA_MATERIAL', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }

  eliminarRegistroPruebaPorId_(hojaMaterial, material.id);
  limpiarCadenaTareaPrueba_(cadena);

  if (!errorCapturado) {
    throw new Error('PASO 186 FALLIDO: se esperaba un error por ESTADO invalido y no se produjo.');
  }
  Logger.log('PASO 186 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso187_TareaMaterialValido() {
  Logger.log('=== PASO 187: TAREA_MATERIAL valido (dry-run + insercion real) ===');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaMaterial = ss.getSheetByName('08_MATERIALES');
  var hojaTareaMaterial = ss.getSheetByName('10_TAREA_MATERIAL');
  var cadena = construirCadenaTareaPrueba_('P187');

  var datosMaterial = {
    CODIGO: 'MAT-P187',
    NOMBRE: 'Material de prueba paso187',
    CATEGORIA: 'Madera',
    UNIDAD: 'Unidad',
    ESTADO: 'Disponible'
  };
  var material = insertarRegistroTransaccional('MATERIAL', datosMaterial, {dryRun: false});

  var datos = {
    TAREA_ID: cadena.tareaId,
    MATERIAL_ID: material.id,
    CANTIDAD_PREVISTA: 5,
    UNIDAD: 'Unidad',
    ESTADO: 'Planificada'
  };

  var resultadoDry = insertarRegistroTransaccional('TAREA_MATERIAL', datos, {dryRun: true});
  if (!resultadoDry || !resultadoDry.id) {
    throw new Error('PASO 187 FALLIDO: el dry-run no devolvio un id previsto.');
  }
  Logger.log('PASO 187: dry-run OK, id previsto -> ' + resultadoDry.id);

  var resultadoReal = insertarRegistroTransaccional('TAREA_MATERIAL', datos, {dryRun: false});
  if (!resultadoReal || !resultadoReal.id) {
    throw new Error('PASO 187 FALLIDO: la insercion real no devolvio un id.');
  }
  Logger.log('PASO 187: insercion real OK, id -> ' + resultadoReal.id);

  eliminarRegistroPruebaPorId_(hojaTareaMaterial, resultadoReal.id);
  eliminarRegistroPruebaPorId_(hojaMaterial, material.id);
  limpiarCadenaTareaPrueba_(cadena);
  Logger.log('PASO 187 OK: registros de prueba eliminados');
}

function ejecutarSuitePaso185a187() {
  pruebaPaso185_TareaMaterialFKInvalida();
  pruebaPaso186_TareaMaterialEstadoInvalido();
  pruebaPaso187_TareaMaterialValido();
  Logger.log('SUITE PASO 185-187 (TAREA_MATERIAL) COMPLETADA CON EXITO');
}


function construirProyectoDePrueba_(sufijo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var campana = insertarRegistroTransaccional('CAMPANA', {
    NOMBRE: 'Campana prueba ' + sufijo,
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var proyecto = insertarRegistroTransaccional('PROYECTO', {
    CAMPANA_ID: campana.id,
    NOMBRE: 'Proyecto prueba ' + sufijo,
    TIPO_PROYECTO: 'Propuesta',
    PRIORIDAD: 'Media',
    ESTADO: 'Borrador'
  }, {dryRun: false});

  return {
    ss: ss,
    campanaId: campana.id,
    proyectoId: proyecto.id
  };
}

function limpiarProyectoDePrueba_(cadena) {
  var ss = cadena.ss;
  eliminarRegistroPruebaPorId_(ss.getSheetByName('02_PROYECTOS'), cadena.proyectoId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('01_CAMPANAS'), cadena.campanaId);
}

function pruebaPaso188_DecisionFKInvalida() {
  Logger.log('=== PASO 188: DECISION con PROYECTO_ID inexistente ===');
  var errorCapturado = null;
  try {
    var datos = {
      PROYECTO_ID: 'PRO-9999',
      TITULO: 'Decision de prueba paso188',
      TIPO: 'Técnica',
      ESTADO: 'Pendiente de consenso',
      IMPACTO: 'Medio'
    };
    insertarRegistroTransaccional('DECISION', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }
  if (!errorCapturado) {
    throw new Error('PASO 188 FALLIDO: se esperaba un error por PROYECTO_ID inexistente y no se produjo.');
  }
  Logger.log('PASO 188 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso189_DecisionImpactoInvalido() {
  Logger.log('=== PASO 189: DECISION con IMPACTO invalido ===');
  var cadena = construirProyectoDePrueba_('P189');

  var errorCapturado = null;
  try {
    var datos = {
      PROYECTO_ID: cadena.proyectoId,
      TITULO: 'Decision de prueba paso189',
      TIPO: 'Técnica',
      ESTADO: 'Pendiente de consenso',
      IMPACTO: 'Catastrofico'
    };
    insertarRegistroTransaccional('DECISION', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }

  limpiarProyectoDePrueba_(cadena);

  if (!errorCapturado) {
    throw new Error('PASO 189 FALLIDO: se esperaba un error por IMPACTO invalido y no se produjo.');
  }
  Logger.log('PASO 189 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso190_DecisionValida() {
  Logger.log('=== PASO 190: DECISION valida (dry-run + insercion real) ===');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDecision = ss.getSheetByName('12_DECISIONES');
  var cadena = construirProyectoDePrueba_('P190');

  var datos = {
    PROYECTO_ID: cadena.proyectoId,
    TITULO: 'Decision de prueba paso190',
    TIPO: 'Técnica',
    ESTADO: 'Pendiente de consenso',
    IMPACTO: 'Medio'
  };

  var resultadoDry = insertarRegistroTransaccional('DECISION', datos, {dryRun: true});
  if (!resultadoDry || !resultadoDry.id) {
    throw new Error('PASO 190 FALLIDO: el dry-run no devolvio un id previsto.');
  }
  Logger.log('PASO 190: dry-run OK, id previsto -> ' + resultadoDry.id);

  var resultadoReal = insertarRegistroTransaccional('DECISION', datos, {dryRun: false});
  if (!resultadoReal || !resultadoReal.id) {
    throw new Error('PASO 190 FALLIDO: la insercion real no devolvio un id.');
  }
  Logger.log('PASO 190: insercion real OK, id -> ' + resultadoReal.id);

  eliminarRegistroPruebaPorId_(hojaDecision, resultadoReal.id);
  limpiarProyectoDePrueba_(cadena);
  Logger.log('PASO 190 OK: registros de prueba eliminados');
}

function ejecutarSuitePaso188a190() {
  pruebaPaso188_DecisionFKInvalida();
  pruebaPaso189_DecisionImpactoInvalido();
  pruebaPaso190_DecisionValida();
  Logger.log('SUITE PASO 188-190 (DECISION) COMPLETADA CON EXITO');
}


function pruebaPaso191_IncidenciaTipoInvalido() {
  Logger.log('=== PASO 191: INCIDENCIA con TIPO invalido ===');
  var errorCapturado = null;
  try {
    var datos = {
      TITULO: 'Incidencia de prueba paso191',
      TIPO: 'INEXISTENTE',
      PRIORIDAD: 'Media',
      ESTADO: 'Abierta'
    };
    insertarRegistroTransaccional('INCIDENCIA', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }
  if (!errorCapturado) {
    throw new Error('PASO 191 FALLIDO: se esperaba un error por TIPO invalido y no se produjo.');
  }
  Logger.log('PASO 191 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso192_IncidenciaEstadoInvalido() {
  Logger.log('=== PASO 192: INCIDENCIA con ESTADO invalido ===');
  var errorCapturado = null;
  try {
    var datos = {
      TITULO: 'Incidencia de prueba paso192',
      TIPO: 'Calidad',
      PRIORIDAD: 'Media',
      ESTADO: 'Archivada'
    };
    insertarRegistroTransaccional('INCIDENCIA', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }
  if (!errorCapturado) {
    throw new Error('PASO 192 FALLIDO: se esperaba un error por ESTADO invalido y no se produjo.');
  }
  Logger.log('PASO 192 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso193_IncidenciaValida() {
  Logger.log('=== PASO 193: INCIDENCIA valida (dry-run + insercion real) ===');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaIncidencia = ss.getSheetByName('13_INCIDENCIAS');

  var datos = {
    TITULO: 'Incidencia de prueba paso193',
    TIPO: 'Calidad',
    PRIORIDAD: 'Media',
    ESTADO: 'Abierta'
  };

  var resultadoDry = insertarRegistroTransaccional('INCIDENCIA', datos, {dryRun: true});
  if (!resultadoDry || !resultadoDry.id) {
    throw new Error('PASO 193 FALLIDO: el dry-run no devolvio un id previsto.');
  }
  Logger.log('PASO 193: dry-run OK, id previsto -> ' + resultadoDry.id);

  var resultadoReal = insertarRegistroTransaccional('INCIDENCIA', datos, {dryRun: false});
  if (!resultadoReal || !resultadoReal.id) {
    throw new Error('PASO 193 FALLIDO: la insercion real no devolvio un id.');
  }
  Logger.log('PASO 193: insercion real OK, id -> ' + resultadoReal.id);

  eliminarRegistroPruebaPorId_(hojaIncidencia, resultadoReal.id);
  Logger.log('PASO 193 OK: registro de prueba eliminado -> ' + resultadoReal.id);
}

function ejecutarSuitePaso191a193() {
  pruebaPaso191_IncidenciaTipoInvalido();
  pruebaPaso192_IncidenciaEstadoInvalido();
  pruebaPaso193_IncidenciaValida();
  Logger.log('SUITE PASO 191-193 (INCIDENCIA) COMPLETADA CON EXITO');
}

function pruebaPaso194_DocumentoEntidadTipoInvalido() {
  Logger.log('=== PASO 194: DOCUMENTO con ENTIDAD_TIPO invalido ===');
  var errorCapturado = null;
  try {
    var datos = {
      ENTIDAD_TIPO: 'INEXISTENTE',
      ENTIDAD_ID: 'CAM-0001',
      TIPO_DOCUMENTO: 'Informe',
      TITULO: 'Documento de prueba paso194',
      ESTADO: 'Borrador'
    };
    insertarRegistroTransaccional('DOCUMENTO', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }
  if (!errorCapturado) {
    throw new Error('PASO 194 FALLIDO: se esperaba un error por ENTIDAD_TIPO invalido y no se produjo.');
  }
  Logger.log('PASO 194 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso195_DocumentoTipoDocumentoInvalido() {
  Logger.log('=== PASO 195: DOCUMENTO con TIPO_DOCUMENTO invalido ===');
  var errorCapturado = null;
  try {
    var datos = {
      ENTIDAD_TIPO: 'Campaña',
      ENTIDAD_ID: 'CAM-0001',
      TIPO_DOCUMENTO: 'INEXISTENTE',
      TITULO: 'Documento de prueba paso195',
      ESTADO: 'Borrador'
    };
    insertarRegistroTransaccional('DOCUMENTO', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }
  if (!errorCapturado) {
    throw new Error('PASO 195 FALLIDO: se esperaba un error por TIPO_DOCUMENTO invalido y no se produjo.');
  }
  Logger.log('PASO 195 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso196_DocumentoValido() {
  Logger.log('=== PASO 196: DOCUMENTO valido (dry-run + insercion real) ===');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDocumento = ss.getSheetByName('14_DOCUMENTOS');

  var datos = {
    ENTIDAD_TIPO: 'Campaña',
    ENTIDAD_ID: 'CAM-0001',
    TIPO_DOCUMENTO: 'Informe',
    TITULO: 'Documento de prueba paso196',
    ESTADO: 'Borrador'
  };

  var resultadoDry = insertarRegistroTransaccional('DOCUMENTO', datos, {dryRun: true});
  if (!resultadoDry || !resultadoDry.id) {
    throw new Error('PASO 196 FALLIDO: el dry-run no devolvio un id previsto.');
  }
  Logger.log('PASO 196: dry-run OK, id previsto -> ' + resultadoDry.id);

  var resultadoReal = insertarRegistroTransaccional('DOCUMENTO', datos, {dryRun: false});
  if (!resultadoReal || !resultadoReal.id) {
    throw new Error('PASO 196 FALLIDO: la insercion real no devolvio un id.');
  }
  Logger.log('PASO 196: insercion real OK, id -> ' + resultadoReal.id);

  eliminarRegistroPruebaPorId_(hojaDocumento, resultadoReal.id);
  Logger.log('PASO 196 OK: registro de prueba eliminado -> ' + resultadoReal.id);
}

function ejecutarSuitePaso194a196() {
  pruebaPaso194_DocumentoEntidadTipoInvalido();
  pruebaPaso195_DocumentoTipoDocumentoInvalido();
  pruebaPaso196_DocumentoValido();
  Logger.log('SUITE PASO 194-196 (DOCUMENTO) COMPLETADA CON EXITO');
}


function construirProcesoDePrueba_(sufijo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var campana = insertarRegistroTransaccional('CAMPANA', {
    NOMBRE: 'Campana prueba ' + sufijo,
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var proyecto = insertarRegistroTransaccional('PROYECTO', {
    CAMPANA_ID: campana.id,
    NOMBRE: 'Proyecto prueba ' + sufijo,
    TIPO_PROYECTO: 'Propuesta',
    PRIORIDAD: 'Media',
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var producto = insertarRegistroTransaccional('PRODUCTO', {
    CODIGO: 'PRD-' + sufijo,
    NOMBRE: 'Producto prueba ' + sufijo,
    ORIGEN: 'Producción propia',
    UNIDAD: 'Unidad',
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var proceso = insertarRegistroTransaccional('PROCESO', {
    PRODUCTO_ID: producto.id,
    NOMBRE: 'Proceso prueba ' + sufijo,
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0
  }, {dryRun: false});

  return {
    ss: ss,
    campanaId: campana.id,
    proyectoId: proyecto.id,
    productoId: producto.id,
    procesoId: proceso.id
  };
}

function limpiarProcesoDePrueba_(cadena) {
  var ss = cadena.ss;
  eliminarRegistroPruebaPorId_(ss.getSheetByName('05_PROCESOS'), cadena.procesoId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('03_PRODUCTOS'), cadena.productoId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('02_PROYECTOS'), cadena.proyectoId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('01_CAMPANAS'), cadena.campanaId);
}

function pruebaPaso197_TareaFechaInicioRealIncompatible() {
  Logger.log('=== PASO 197: TAREA con FECHA_INICIO_REAL incompatible con ESTADO Pendiente ===');
  var cadena = construirProcesoDePrueba_('P197');

  var errorCapturado = null;
  try {
    var datos = {
      PROCESO_ID: cadena.procesoId,
      NOMBRE: 'Tarea de prueba paso197',
      ORDEN_SECUENCIA: 1,
      DURACION_PREVISTA_DIAS: 1,
      ESTADO: 'Pendiente',
      PORCENTAJE_AVANCE: 0,
      FECHA_INICIO_REAL: new Date()
    };
    insertarRegistroTransaccional('TAREA', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }

  limpiarProcesoDePrueba_(cadena);

  if (!errorCapturado) {
    throw new Error('PASO 197 FALLIDO: se esperaba un error por FECHA_INICIO_REAL incompatible con Pendiente y no se produjo.');
  }
  Logger.log('PASO 197 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso198_TareaEnProcesoRequiereFechaInicioReal() {
  Logger.log('=== PASO 198: TAREA En proceso sin FECHA_INICIO_REAL ===');
  var cadena = construirProcesoDePrueba_('P198');

  var errorCapturado = null;
  try {
    var datos = {
      PROCESO_ID: cadena.procesoId,
      NOMBRE: 'Tarea de prueba paso198',
      ORDEN_SECUENCIA: 1,
      DURACION_PREVISTA_DIAS: 1,
      ESTADO: 'En proceso',
      PORCENTAJE_AVANCE: 10
    };
    insertarRegistroTransaccional('TAREA', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }

  limpiarProcesoDePrueba_(cadena);

  if (!errorCapturado) {
    throw new Error('PASO 198 FALLIDO: se esperaba un error por falta de FECHA_INICIO_REAL en En proceso y no se produjo.');
  }
  Logger.log('PASO 198 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso199_TareaTerminadaRequiereFechas() {
  Logger.log('=== PASO 199: TAREA Terminada sin FECHA_FIN_REAL ===');
  var cadena = construirProcesoDePrueba_('P199');

  var errorCapturado = null;
  try {
    var datos = {
      PROCESO_ID: cadena.procesoId,
      NOMBRE: 'Tarea de prueba paso199',
      ORDEN_SECUENCIA: 1,
      DURACION_PREVISTA_DIAS: 1,
      ESTADO: 'Terminada',
      PORCENTAJE_AVANCE: 100,
      FECHA_INICIO_REAL: new Date()
    };
    insertarRegistroTransaccional('TAREA', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }

  limpiarProcesoDePrueba_(cadena);

  if (!errorCapturado) {
    throw new Error('PASO 199 FALLIDO: se esperaba un error por falta de FECHA_FIN_REAL en Terminada y no se produjo.');
  }
  Logger.log('PASO 199 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso200_TareaTerminadaRequiereDuracionReal() {
  Logger.log('=== PASO 200: TAREA Terminada sin DURACION_REAL_DIAS ===');
  var cadena = construirProcesoDePrueba_('P200');

  var errorCapturado = null;
  try {
    var datos = {
      PROCESO_ID: cadena.procesoId,
      NOMBRE: 'Tarea de prueba paso200',
      ORDEN_SECUENCIA: 1,
      DURACION_PREVISTA_DIAS: 1,
      ESTADO: 'Terminada',
      PORCENTAJE_AVANCE: 100,
      FECHA_INICIO_REAL: new Date(),
      FECHA_FIN_REAL: new Date()
    };
    insertarRegistroTransaccional('TAREA', datos, {dryRun: true});
  } catch (e) {
    errorCapturado = e;
  }

  limpiarProcesoDePrueba_(cadena);

  if (!errorCapturado) {
    throw new Error('PASO 200 FALLIDO: se esperaba un error por falta de DURACION_REAL_DIAS en Terminada y no se produjo.');
  }
  Logger.log('PASO 200 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso201_TareaTerminadaValidaDryRun() {
  Logger.log('=== PASO 201: TAREA Terminada valida (dry-run) ===');
  var cadena = construirProcesoDePrueba_('P201');

  var fechaInicio = new Date();
  var fechaFin = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  var datos = {
    PROCESO_ID: cadena.procesoId,
    NOMBRE: 'Tarea de prueba paso201',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 2,
    ESTADO: 'Terminada',
    PORCENTAJE_AVANCE: 100,
    FECHA_INICIO_REAL: fechaInicio,
    FECHA_FIN_REAL: fechaFin,
    DURACION_REAL_DIAS: 2
  };

  var resultadoDry = insertarRegistroTransaccional('TAREA', datos, {dryRun: true});

  limpiarProcesoDePrueba_(cadena);

  if (!resultadoDry || !resultadoDry.id) {
    throw new Error('PASO 201 FALLIDO: el dry-run no devolvio un id previsto.');
  }
  Logger.log('PASO 201 OK: dry-run OK, id previsto -> ' + resultadoDry.id);
}

function pruebaPaso202_TareaTerminadaValidaReal() {
  Logger.log('=== PASO 202: TAREA Terminada valida (insercion real + limpieza) ===');
  var cadena = construirProcesoDePrueba_('P202');
  var hojaTarea = cadena.ss.getSheetByName('06_TAREAS');

  var fechaInicio = new Date();
  var fechaFin = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  var datos = {
    PROCESO_ID: cadena.procesoId,
    NOMBRE: 'Tarea de prueba paso202',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 2,
    ESTADO: 'Terminada',
    PORCENTAJE_AVANCE: 100,
    FECHA_INICIO_REAL: fechaInicio,
    FECHA_FIN_REAL: fechaFin,
    DURACION_REAL_DIAS: 2
  };

  var resultadoReal = insertarRegistroTransaccional('TAREA', datos, {dryRun: false});
  if (!resultadoReal || !resultadoReal.id) {
    limpiarProcesoDePrueba_(cadena);
    throw new Error('PASO 202 FALLIDO: la insercion real no devolvio un id.');
  }
  Logger.log('PASO 202: insercion real OK, id -> ' + resultadoReal.id);

  eliminarRegistroPruebaPorId_(hojaTarea, resultadoReal.id);
  limpiarProcesoDePrueba_(cadena);
  Logger.log('PASO 202 OK: registros de prueba eliminados');
}

function ejecutarSuitePaso197a202() {
  pruebaPaso197_TareaFechaInicioRealIncompatible();
  pruebaPaso198_TareaEnProcesoRequiereFechaInicioReal();
  pruebaPaso199_TareaTerminadaRequiereFechas();
  pruebaPaso200_TareaTerminadaRequiereDuracionReal();
  pruebaPaso201_TareaTerminadaValidaDryRun();
  pruebaPaso202_TareaTerminadaValidaReal();
  Logger.log('SUITE PASO 197-202 (COHERENCIA TAREA) COMPLETADA CON EXITO');
}

function ejecutarSuitePaso171a202() {
  Logger.log('======================================================');
  Logger.log('INICIO SUITE COMPLETA PASO 171-202 (BACKEND + COHERENCIA)');
  Logger.log('======================================================');

  ejecutarSuitePaso171a175();
  ejecutarSuitePaso176a178();
  ejecutarSuitePaso179a181();
  ejecutarSuitePaso182a184();
  ejecutarSuitePaso185a187();
  ejecutarSuitePaso188a190();
  ejecutarSuitePaso191a193();
  ejecutarSuitePaso194a196();
  ejecutarSuitePaso197a202();

  Logger.log('======================================================');
  Logger.log('SUITE COMPLETA PASO 171-202 COMPLETADA CON EXITO');
  Logger.log('======================================================');
}


function pruebaPaso203_ObtenerRegistroPorIdEntidadInvalida() {
  Logger.log('=== PASO 203: obtenerRegistroPorId con entidad no reconocida ===');
  var errorCapturado = null;
  try {
    obtenerRegistroPorId('ENTIDAD_FALSA', 'X-0001');
  } catch (e) {
    errorCapturado = e;
  }
  if (!errorCapturado) {
    throw new Error('PASO 203 FALLIDO: se esperaba un error por entidad no reconocida y no se produjo.');
  }
  Logger.log('PASO 203 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso204_ObtenerRegistroPorIdInexistenteYExistente() {
  Logger.log('=== PASO 204: obtenerRegistroPorId inexistente y existente ===');
  var cadena = construirProcesoDePrueba_('P204');

  var inexistente = obtenerRegistroPorId('PROCESO', 'PCS-9999');
  if (inexistente !== null) {
    limpiarProcesoDePrueba_(cadena);
    throw new Error('PASO 204 FALLIDO: se esperaba null para un id inexistente.');
  }

  var existente = obtenerRegistroPorId('PROCESO', cadena.procesoId);
  limpiarProcesoDePrueba_(cadena);

  if (!existente || existente.ID !== cadena.procesoId) {
    throw new Error('PASO 204 FALLIDO: no se recupero el registro esperado.');
  }
  Logger.log('PASO 204 OK: inexistente -> null, existente -> ' + existente.ID);
}

function pruebaPaso205_ListarRegistrosSinFiltro() {
  Logger.log('=== PASO 205: listarRegistros sin filtro ===');
  var cadena = construirProcesoDePrueba_('P205');

  var todos = listarRegistros('PROCESO');
  var encontrado = todos.some(function (f) { return f.ID === cadena.procesoId; });

  limpiarProcesoDePrueba_(cadena);

  if (!encontrado) {
    throw new Error('PASO 205 FALLIDO: el proceso de prueba no aparece en listarRegistros sin filtro.');
  }
  Logger.log('PASO 205 OK: ' + todos.length + ' procesos listados, incluye el de prueba');
}

function pruebaPaso206_ListarRegistrosConFiltro() {
  Logger.log('=== PASO 206: listarRegistros con filtro ===');
  var cadena = construirProcesoDePrueba_('P206');

  var pendientes = listarRegistros('PROCESO', {ESTADO: 'Pendiente'});
  var encontradoEnPendientes = pendientes.some(function (f) { return f.ID === cadena.procesoId; });

  var completados = listarRegistros('PROCESO', {ESTADO: 'Completado'});
  var encontradoEnCompletados = completados.some(function (f) { return f.ID === cadena.procesoId; });

  limpiarProcesoDePrueba_(cadena);

  if (!encontradoEnPendientes || encontradoEnCompletados) {
    throw new Error('PASO 206 FALLIDO: el filtro por ESTADO no funciono como se esperaba.');
  }
  Logger.log('PASO 206 OK: filtro por ESTADO funciona correctamente');
}

function pruebaPaso207_BuscarRegistros() {
  Logger.log('=== PASO 207: buscarRegistros ===');

  var errorCapturado = null;
  try {
    buscarRegistros('PROCESO', {});
  } catch (e) {
    errorCapturado = e;
  }
  if (!errorCapturado) {
    throw new Error('PASO 207 FALLIDO: se esperaba un error por criterio invalido y no se produjo.');
  }

  var cadena = construirProcesoDePrueba_('P207');
  var resultados = buscarRegistros('PROCESO', {campo: 'NOMBRE', texto: 'prueba P207'});
  var encontrado = resultados.some(function (f) { return f.ID === cadena.procesoId; });

  limpiarProcesoDePrueba_(cadena);

  if (!encontrado) {
    throw new Error('PASO 207 FALLIDO: no se encontro el proceso de prueba mediante busqueda de texto.');
  }
  Logger.log('PASO 207 OK: criterio invalido rechazado y busqueda de texto encuentra el registro');
}

function pruebaPaso208_ListarPorRelacion() {
  Logger.log('=== PASO 208: listarPorRelacion ===');
  var cadena = construirCadenaTareaPrueba_('P208');

  var tareasDelProceso = listarPorRelacion('TAREA', 'PROCESO_ID', cadena.procesoId);
  var encontrado = tareasDelProceso.some(function (f) { return f.ID === cadena.tareaId; });

  limpiarCadenaTareaPrueba_(cadena);

  if (!encontrado) {
    throw new Error('PASO 208 FALLIDO: no se encontro la tarea de prueba mediante listarPorRelacion.');
  }
  Logger.log('PASO 208 OK: listarPorRelacion encuentra la tarea de prueba');
}

function pruebaPaso209_ListarCampanasActivas() {
  Logger.log('=== PASO 209: listarCampanasActivas ===');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaCampana = ss.getSheetByName('01_CAMPANAS');

  var campana = insertarRegistroTransaccional('CAMPANA', {
    NOMBRE: 'Campana activa de prueba P209',
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ESTADO: 'Activa'
  }, {dryRun: false});

  var activas = listarCampanasActivas();
  var encontrado = activas.some(function (f) { return f.ID === campana.id; });

  eliminarRegistroPruebaPorId_(hojaCampana, campana.id);

  if (!encontrado) {
    throw new Error('PASO 209 FALLIDO: la campana activa de prueba no aparece en listarCampanasActivas.');
  }
  Logger.log('PASO 209 OK: listarCampanasActivas encuentra la campana de prueba');
}

function pruebaPaso210_ListarProyectosDeCampana() {
  Logger.log('=== PASO 210: listarProyectosDeCampana ===');
  var cadena = construirProcesoDePrueba_('P210');

  var proyectos = listarProyectosDeCampana(cadena.campanaId);
  var encontrado = proyectos.some(function (f) { return f.ID === cadena.proyectoId; });

  limpiarProcesoDePrueba_(cadena);

  if (!encontrado) {
    throw new Error('PASO 210 FALLIDO: no se encontro el proyecto de prueba mediante listarProyectosDeCampana.');
  }
  Logger.log('PASO 210 OK: listarProyectosDeCampana encuentra el proyecto de prueba');
}

function pruebaPaso211_ListarProductosDeProyecto() {
  Logger.log('=== PASO 211: listarProductosDeProyecto ===');
  var cadena = construirCadenaTareaPrueba_('P211');

  var productos = listarProductosDeProyecto(cadena.proyectoId);
  var encontrado = productos.some(function (f) { return f.ID === cadena.productoId; });

  limpiarCadenaTareaPrueba_(cadena);

  if (!encontrado) {
    throw new Error('PASO 211 FALLIDO: no se encontro el producto de prueba mediante listarProductosDeProyecto.');
  }
  Logger.log('PASO 211 OK: listarProductosDeProyecto encuentra el producto de prueba');
}

function pruebaPaso212_ListarProcesosDeProducto() {
  Logger.log('=== PASO 212: listarProcesosDeProducto ===');
  var cadena = construirProcesoDePrueba_('P212');

  var procesos = listarProcesosDeProducto(cadena.productoId);
  var encontrado = procesos.some(function (f) { return f.ID === cadena.procesoId; });

  limpiarProcesoDePrueba_(cadena);

  if (!encontrado) {
    throw new Error('PASO 212 FALLIDO: no se encontro el proceso de prueba mediante listarProcesosDeProducto.');
  }
  Logger.log('PASO 212 OK: listarProcesosDeProducto encuentra el proceso de prueba');
}

function pruebaPaso213_ListarTareasDeProceso() {
  Logger.log('=== PASO 213: listarTareasDeProceso ===');
  var cadena = construirCadenaTareaPrueba_('P213');

  var tareas = listarTareasDeProceso(cadena.procesoId);
  var encontrado = tareas.some(function (f) { return f.ID === cadena.tareaId; });

  limpiarCadenaTareaPrueba_(cadena);

  if (!encontrado) {
    throw new Error('PASO 213 FALLIDO: no se encontro la tarea de prueba mediante listarTareasDeProceso.');
  }
  Logger.log('PASO 213 OK: listarTareasDeProceso encuentra la tarea de prueba');
}

function pruebaPaso214_ListarTareasPorEstado() {
  Logger.log('=== PASO 214: listarTareasPorEstado ===');
  var cadena = construirCadenaTareaPrueba_('P214');

  var pendientes = listarTareasPorEstado('Pendiente');
  var encontrado = pendientes.some(function (f) { return f.ID === cadena.tareaId; });

  limpiarCadenaTareaPrueba_(cadena);

  if (!encontrado) {
    throw new Error('PASO 214 FALLIDO: no se encontro la tarea de prueba mediante listarTareasPorEstado.');
  }
  Logger.log('PASO 214 OK: listarTareasPorEstado encuentra la tarea de prueba');
}

function ejecutarSuitePaso203a214() {
  pruebaPaso203_ObtenerRegistroPorIdEntidadInvalida();
  pruebaPaso204_ObtenerRegistroPorIdInexistenteYExistente();
  pruebaPaso205_ListarRegistrosSinFiltro();
  pruebaPaso206_ListarRegistrosConFiltro();
  pruebaPaso207_BuscarRegistros();
  pruebaPaso208_ListarPorRelacion();
  pruebaPaso209_ListarCampanasActivas();
  pruebaPaso210_ListarProyectosDeCampana();
  pruebaPaso211_ListarProductosDeProyecto();
  pruebaPaso212_ListarProcesosDeProducto();
  pruebaPaso213_ListarTareasDeProceso();
  pruebaPaso214_ListarTareasPorEstado();
  Logger.log('SUITE PASO 203-214 (REPOSITORY_CONSULTAR) COMPLETADA CON EXITO');
}

function ejecutarSuitePaso171a214() {
  ejecutarSuitePaso171a202();
  ejecutarSuitePaso203a214();
  Logger.log('======================================================');
  Logger.log('SUITE COMPLETA PASO 171-214 COMPLETADA CON EXITO');
  Logger.log('======================================================');
}


function pruebaPaso215_ActualizarIdInmutable() {
  Logger.log('=== PASO 215: actualizarRegistroTransaccional no permite modificar ID ===');
  var cadena = construirProcesoDePrueba_('P215');

  var errorCapturado = null;
  try {
    actualizarRegistroTransaccional('PROCESO', cadena.procesoId, {ID: 'PCS-9999'});
  } catch (e) {
    errorCapturado = e;
  }

  limpiarProcesoDePrueba_(cadena);

  if (!errorCapturado) {
    throw new Error('PASO 215 FALLIDO: se esperaba un error al intentar modificar ID y no se produjo.');
  }
  Logger.log('PASO 215 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso216_ActualizarRegistroInexistente() {
  Logger.log('=== PASO 216: actualizarRegistroTransaccional sobre id inexistente ===');
  var errorCapturado = null;
  try {
    actualizarRegistroTransaccional('PROCESO', 'PCS-9999', {NOMBRE: 'No deberia aplicarse'});
  } catch (e) {
    errorCapturado = e;
  }
  if (!errorCapturado) {
    throw new Error('PASO 216 FALLIDO: se esperaba un error por id inexistente y no se produjo.');
  }
  Logger.log('PASO 216 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso217_ActualizarCampoNoReconocido() {
  Logger.log('=== PASO 217: actualizarRegistroTransaccional con campo no reconocido ===');
  var cadena = construirProcesoDePrueba_('P217');

  var errorCapturado = null;
  try {
    actualizarRegistroTransaccional('PROCESO', cadena.procesoId, {CAMPO_INVENTADO: 'x'});
  } catch (e) {
    errorCapturado = e;
  }

  limpiarProcesoDePrueba_(cadena);

  if (!errorCapturado) {
    throw new Error('PASO 217 FALLIDO: se esperaba un error por campo no reconocido y no se produjo.');
  }
  Logger.log('PASO 217 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso218_ActualizarViolaCoherencia() {
  Logger.log('=== PASO 218: actualizarRegistroTransaccional reutiliza reglas de coherencia de TAREA ===');
  var cadena = construirCadenaTareaPrueba_('P218');

  var errorCapturado = null;
  try {
    actualizarRegistroTransaccional('TAREA', cadena.tareaId, {ESTADO: 'Terminada'});
  } catch (e) {
    errorCapturado = e;
  }

  limpiarCadenaTareaPrueba_(cadena);

  if (!errorCapturado) {
    throw new Error('PASO 218 FALLIDO: se esperaba un error por ESTADO Terminada sin fechas reales y no se produjo.');
  }
  Logger.log('PASO 218 OK: error esperado capturado -> ' + errorCapturado.message);
}

function pruebaPaso219_ActualizarValidoDryRun() {
  Logger.log('=== PASO 219: actualizarRegistroTransaccional valido en dry-run ===');
  var cadena = construirProcesoDePrueba_('P219');

  var resultado = actualizarRegistroTransaccional('PROCESO', cadena.procesoId, {NOMBRE: 'Proceso renombrado P219'}, {dryRun: true});

  var registroTrasDryRun = obtenerRegistroPorId('PROCESO', cadena.procesoId);

  limpiarProcesoDePrueba_(cadena);

  if (!resultado || resultado.diferencias.length !== 1 || resultado.diferencias[0].campo !== 'NOMBRE') {
    throw new Error('PASO 219 FALLIDO: las diferencias devueltas no son las esperadas.');
  }
  if (registroTrasDryRun.NOMBRE === 'Proceso renombrado P219') {
    throw new Error('PASO 219 FALLIDO: el dry-run no debia escribir cambios en la hoja.');
  }
  Logger.log('PASO 219 OK: diferencias correctas y sin escritura en dry-run -> ' + JSON.stringify(resultado.diferencias));
}

function pruebaPaso220_ActualizarRealYVerificarHoja() {
  Logger.log('=== PASO 220: actualizarRegistroTransaccional real, verificado en la hoja ===');
  var cadena = construirProcesoDePrueba_('P220');

  var resultado = actualizarRegistroTransaccional('PROCESO', cadena.procesoId, {NOMBRE: 'Proceso renombrado P220'});
  var registroActualizado = obtenerRegistroPorId('PROCESO', cadena.procesoId);

  limpiarProcesoDePrueba_(cadena);

  if (!resultado || resultado.diferencias.length !== 1) {
    throw new Error('PASO 220 FALLIDO: no se devolvieron las diferencias esperadas.');
  }
  if (!registroActualizado || registroActualizado.NOMBRE !== 'Proceso renombrado P220') {
    throw new Error('PASO 220 FALLIDO: el cambio no se reflejo en la hoja.');
  }
  Logger.log('PASO 220 OK: actualizacion real verificada en la hoja -> ' + registroActualizado.NOMBRE);
}

function pruebaPaso221_ActualizarSinDiferencias() {
  Logger.log('=== PASO 221: actualizarRegistroTransaccional sin diferencias reales ===');
  var cadena = construirProcesoDePrueba_('P221');
  var registroActual = obtenerRegistroPorId('PROCESO', cadena.procesoId);

  var resultado = actualizarRegistroTransaccional('PROCESO', cadena.procesoId, {NOMBRE: registroActual.NOMBRE});

  limpiarProcesoDePrueba_(cadena);

  if (!resultado || resultado.diferencias.length !== 0) {
    throw new Error('PASO 221 FALLIDO: se esperaban cero diferencias al enviar el mismo valor.');
  }
  Logger.log('PASO 221 OK: sin diferencias cuando el valor no cambia');
}

function ejecutarSuitePaso215a221() {
  pruebaPaso215_ActualizarIdInmutable();
  pruebaPaso216_ActualizarRegistroInexistente();
  pruebaPaso217_ActualizarCampoNoReconocido();
  pruebaPaso218_ActualizarViolaCoherencia();
  pruebaPaso219_ActualizarValidoDryRun();
  pruebaPaso220_ActualizarRealYVerificarHoja();
  pruebaPaso221_ActualizarSinDiferencias();
  Logger.log('SUITE PASO 215-221 (REPOSITORY_ACTUALIZAR) COMPLETADA CON EXITO');
}

/* ============================================================
 * PASO 222-227 — Fase 4: baja logica y reactivacion.
 * ============================================================ */

function pruebaPaso222_DesactivarBloqueadoPorDependientes() {
  Logger.log('=== PASO 222: desactivarRegistro bloqueado por dependientes activos ===');
  var cadena = construirCadenaTareaPrueba_('P222');

  var error = null;
  try {
    desactivarRegistro('PROCESO', cadena.procesoId);
  } catch (e) {
    error = e;
  }

  limpiarCadenaTareaPrueba_(cadena);

  if (!error) {
    throw new Error('PASO 222 FALLIDO: se esperaba un error por dependientes activos.');
  }
  Logger.log('PASO 222 OK: error esperado capturado -> ' + error.message);
}

function pruebaPaso223_DesactivarSinDependientes() {
  Logger.log('=== PASO 223: desactivarRegistro exitoso sin dependientes ===');
  var cadena = construirCadenaTareaPrueba_('P223');

  var resultado = desactivarRegistro('TAREA', cadena.tareaId);
  var registroTrasBaja = obtenerRegistroPorId('TAREA', cadena.tareaId);

  limpiarCadenaTareaPrueba_(cadena);

  if (!resultado || registroTrasBaja.ACTIVO !== 'NO') {
    throw new Error('PASO 223 FALLIDO: el registro no quedo inactivo en la hoja.');
  }
  Logger.log('PASO 223 OK: TAREA desactivada y verificada en la hoja.');
}

function pruebaPaso224_ReactivarExitoso() {
  Logger.log('=== PASO 224: reactivarRegistro exitoso ===');
  var cadena = construirCadenaTareaPrueba_('P224');

  desactivarRegistro('TAREA', cadena.tareaId);
  var resultado = reactivarRegistro('TAREA', cadena.tareaId);
  var registroTrasReactivar = obtenerRegistroPorId('TAREA', cadena.tareaId);

  limpiarCadenaTareaPrueba_(cadena);

  if (!resultado || registroTrasReactivar.ACTIVO !== 'SÍ') {
    throw new Error('PASO 224 FALLIDO: el registro no quedo activo en la hoja.');
  }
  Logger.log('PASO 224 OK: TAREA reactivada y verificada en la hoja.');
}

function pruebaPaso225_DesactivarIdInexistente() {
  Logger.log('=== PASO 225: desactivarRegistro sobre id inexistente ===');
  var error = null;
  try {
    desactivarRegistro('TAREA', 'TAR-9999');
  } catch (e) {
    error = e;
  }
  if (!error) {
    throw new Error('PASO 225 FALLIDO: se esperaba un error de id inexistente.');
  }
  Logger.log('PASO 225 OK: error esperado capturado -> ' + error.message);
}

function pruebaPaso226_DesactivarYaInactivo() {
  Logger.log('=== PASO 226: desactivarRegistro sobre registro ya inactivo ===');
  var cadena = construirCadenaTareaPrueba_('P226');
  desactivarRegistro('TAREA', cadena.tareaId);

  var error = null;
  try {
    desactivarRegistro('TAREA', cadena.tareaId);
  } catch (e) {
    error = e;
  }

  limpiarCadenaTareaPrueba_(cadena);

  if (!error) {
    throw new Error('PASO 226 FALLIDO: se esperaba un error de registro ya inactivo.');
  }
  Logger.log('PASO 226 OK: error esperado capturado -> ' + error.message);
}

function pruebaPaso227_ReactivarYaActivo() {
  Logger.log('=== PASO 227: reactivarRegistro sobre registro ya activo ===');
  var cadena = construirCadenaTareaPrueba_('P227');

  var error = null;
  try {
    reactivarRegistro('TAREA', cadena.tareaId);
  } catch (e) {
    error = e;
  }

  limpiarCadenaTareaPrueba_(cadena);

  if (!error) {
    throw new Error('PASO 227 FALLIDO: se esperaba un error de registro ya activo.');
  }
  Logger.log('PASO 227 OK: error esperado capturado -> ' + error.message);
}

function ejecutarSuitePaso222a227() {
  pruebaPaso222_DesactivarBloqueadoPorDependientes();
  pruebaPaso223_DesactivarSinDependientes();
  pruebaPaso224_ReactivarExitoso();
  pruebaPaso225_DesactivarIdInexistente();
  pruebaPaso226_DesactivarYaInactivo();
  pruebaPaso227_ReactivarYaActivo();
  Logger.log('SUITE PASO 222-227 (REPOSITORY_ESTADO) COMPLETADA CON EXITO');
}
/* ============================================================
 * PASO 228-232 — Fase 5: capa de servicios de negocio.
 * Cada paso ejerce el ciclo crear/obtener/actualizar/desactivar/
 * reactivar de un servicio, verificando que la delegacion al
 * repositorio funciona igual que llamando a las funciones
 * genericas directamente.
 * ============================================================ */

function pruebaPaso228_CampaniaServiceCicloCompleto() {
  Logger.log('=== PASO 228: CampaniaService ciclo completo ===');
  var campana = crearCampana({
    NOMBRE: 'Campana prueba P228',
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var creada = obtenerCampana(campana.id);
  actualizarCampana(campana.id, {NOMBRE: 'Campana P228 renombrada'});
  var actualizada = obtenerCampana(campana.id);
  desactivarCampana(campana.id);
  var inactiva = obtenerCampana(campana.id);
  reactivarCampana(campana.id);
  var reactivada = obtenerCampana(campana.id);

  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), campana.id);

  if (!creada || creada.NOMBRE !== 'Campana prueba P228') {
    throw new Error('PASO 228 FALLIDO: crearCampana/obtenerCampana no coinciden.');
  }
  if (actualizada.NOMBRE !== 'Campana P228 renombrada') {
    throw new Error('PASO 228 FALLIDO: actualizarCampana no aplico el cambio.');
  }
  if (inactiva.ACTIVO !== 'NO') {
    throw new Error('PASO 228 FALLIDO: desactivarCampana no marco ACTIVO NO.');
  }
  if (reactivada.ACTIVO !== 'SÍ') {
    throw new Error('PASO 228 FALLIDO: reactivarCampana no marco ACTIVO SI.');
  }
  Logger.log('PASO 228 OK: CampaniaService crear/obtener/actualizar/desactivar/reactivar verificado.');
}

function pruebaPaso229_ProyectoServiceCicloCompleto() {
  Logger.log('=== PASO 229: ProyectoService ciclo completo ===');
  var campana = crearCampana({
    NOMBRE: 'Campana base P229',
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var proyecto = crearProyecto({
    CAMPANA_ID: campana.id,
    NOMBRE: 'Proyecto prueba P229',
    TIPO_PROYECTO: 'Propuesta',
    PRIORIDAD: 'Media',
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var creado = obtenerProyecto(proyecto.id);
  actualizarProyecto(proyecto.id, {NOMBRE: 'Proyecto P229 renombrado'});
  var actualizado = obtenerProyecto(proyecto.id);
  desactivarProyecto(proyecto.id);
  var inactivo = obtenerProyecto(proyecto.id);
  reactivarProyecto(proyecto.id);
  var reactivado = obtenerProyecto(proyecto.id);

  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROYECTO'), proyecto.id);
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), campana.id);

  if (!creado || creado.NOMBRE !== 'Proyecto prueba P229') {
    throw new Error('PASO 229 FALLIDO: crearProyecto/obtenerProyecto no coinciden.');
  }
  if (actualizado.NOMBRE !== 'Proyecto P229 renombrado') {
    throw new Error('PASO 229 FALLIDO: actualizarProyecto no aplico el cambio.');
  }
  if (inactivo.ACTIVO !== 'NO') {
    throw new Error('PASO 229 FALLIDO: desactivarProyecto no marco ACTIVO NO.');
  }
  if (reactivado.ACTIVO !== 'SÍ') {
    throw new Error('PASO 229 FALLIDO: reactivarProyecto no marco ACTIVO SI.');
  }
  Logger.log('PASO 229 OK: ProyectoService crear/obtener/actualizar/desactivar/reactivar verificado.');
}

function pruebaPaso230_ProductoServiceCicloCompleto() {
  Logger.log('=== PASO 230: ProductoService ciclo completo ===');
  var producto = crearProducto({
    CODIGO: 'PRD-P230',
    NOMBRE: 'Producto prueba P230',
    ORIGEN: 'Producción propia',
    UNIDAD: 'Unidad',
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var creado = obtenerProducto(producto.id);
  actualizarProducto(producto.id, {NOMBRE: 'Producto P230 renombrado'});
  var actualizado = obtenerProducto(producto.id);
  desactivarProducto(producto.id);
  var inactivo = obtenerProducto(producto.id);
  reactivarProducto(producto.id);
  var reactivado = obtenerProducto(producto.id);

  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PRODUCTO'), producto.id);

  if (!creado || creado.NOMBRE !== 'Producto prueba P230') {
    throw new Error('PASO 230 FALLIDO: crearProducto/obtenerProducto no coinciden.');
  }
  if (actualizado.NOMBRE !== 'Producto P230 renombrado') {
    throw new Error('PASO 230 FALLIDO: actualizarProducto no aplico el cambio.');
  }
  if (inactivo.ACTIVO !== 'NO') {
    throw new Error('PASO 230 FALLIDO: desactivarProducto no marco ACTIVO NO.');
  }
  if (reactivado.ACTIVO !== 'SÍ') {
    throw new Error('PASO 230 FALLIDO: reactivarProducto no marco ACTIVO SI.');
  }
  Logger.log('PASO 230 OK: ProductoService crear/obtener/actualizar/desactivar/reactivar verificado.');
}

function pruebaPaso231_ProcesoServiceCicloCompleto() {
  Logger.log('=== PASO 231: ProcesoService ciclo completo ===');
  var producto = crearProducto({
    CODIGO: 'PRD-P231',
    NOMBRE: 'Producto base P231',
    ORIGEN: 'Producción propia',
    UNIDAD: 'Unidad',
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var proceso = crearProceso({
    PRODUCTO_ID: producto.id,
    NOMBRE: 'Proceso prueba P231',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0
  }, {dryRun: false});

  var creado = obtenerProceso(proceso.id);
  actualizarProceso(proceso.id, {NOMBRE: 'Proceso P231 renombrado'});
  var actualizado = obtenerProceso(proceso.id);
  desactivarProceso(proceso.id);
  var inactivo = obtenerProceso(proceso.id);
  reactivarProceso(proceso.id);
  var reactivado = obtenerProceso(proceso.id);

  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROCESO'), proceso.id);
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PRODUCTO'), producto.id);

  if (!creado || creado.NOMBRE !== 'Proceso prueba P231') {
    throw new Error('PASO 231 FALLIDO: crearProceso/obtenerProceso no coinciden.');
  }
  if (actualizado.NOMBRE !== 'Proceso P231 renombrado') {
    throw new Error('PASO 231 FALLIDO: actualizarProceso no aplico el cambio.');
  }
  if (inactivo.ACTIVO !== 'NO') {
    throw new Error('PASO 231 FALLIDO: desactivarProceso no marco ACTIVO NO.');
  }
  if (reactivado.ACTIVO !== 'SÍ') {
    throw new Error('PASO 231 FALLIDO: reactivarProceso no marco ACTIVO SI.');
  }
  Logger.log('PASO 231 OK: ProcesoService crear/obtener/actualizar/desactivar/reactivar verificado.');
}

function pruebaPaso232_TareaServiceCicloCompleto() {
  Logger.log('=== PASO 232: TareaService ciclo completo ===');
  var producto = crearProducto({
    CODIGO: 'PRD-P232',
    NOMBRE: 'Producto base P232',
    ORIGEN: 'Producción propia',
    UNIDAD: 'Unidad',
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var proceso = crearProceso({
    PRODUCTO_ID: producto.id,
    NOMBRE: 'Proceso base P232',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0
  }, {dryRun: false});

  var tarea = crearTarea({
    PROCESO_ID: proceso.id,
    NOMBRE: 'Tarea prueba P232',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0
  }, {dryRun: false});

  var creada = obtenerTarea(tarea.id);
  actualizarTarea(tarea.id, {NOMBRE: 'Tarea P232 renombrada'});
  var actualizada = obtenerTarea(tarea.id);
  desactivarTarea(tarea.id);
  var inactiva = obtenerTarea(tarea.id);
  reactivarTarea(tarea.id);
  var reactivada = obtenerTarea(tarea.id);

  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('TAREA'), tarea.id);
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROCESO'), proceso.id);
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PRODUCTO'), producto.id);

  if (!creada || creada.NOMBRE !== 'Tarea prueba P232') {
    throw new Error('PASO 232 FALLIDO: crearTarea/obtenerTarea no coinciden.');
  }
  if (actualizada.NOMBRE !== 'Tarea P232 renombrada') {
    throw new Error('PASO 232 FALLIDO: actualizarTarea no aplico el cambio.');
  }
  if (inactiva.ACTIVO !== 'NO') {
    throw new Error('PASO 232 FALLIDO: desactivarTarea no marco ACTIVO NO.');
  }
  if (reactivada.ACTIVO !== 'SÍ') {
    throw new Error('PASO 232 FALLIDO: reactivarTarea no marco ACTIVO SI.');
  }
  Logger.log('PASO 232 OK: TareaService crear/obtener/actualizar/desactivar/reactivar verificado.');
}

function ejecutarSuitePaso228a232() {
  pruebaPaso228_CampaniaServiceCicloCompleto();
  pruebaPaso229_ProyectoServiceCicloCompleto();
  pruebaPaso230_ProductoServiceCicloCompleto();
  pruebaPaso231_ProcesoServiceCicloCompleto();
  pruebaPaso232_TareaServiceCicloCompleto();
  Logger.log('SUITE PASO 228-232 (SERVICIOS DE NEGOCIO) COMPLETADA CON EXITO');
}
/* ============================================================
 * PASO 233-237 — Fase 6: formularios y ventanas modales.
 * ============================================================ */

function pruebaPaso233_EsquemaFormularioLasCincoEntidades() {
  Logger.log('=== PASO 233: obtenerEsquemaFormulario para las 5 entidades ===');
  var entidades = ['CAMPANA', 'PROYECTO', 'PRODUCTO', 'PROCESO', 'TAREA'];
  entidades.forEach(function (entidad) {
    var esquema = obtenerEsquemaFormulario(entidad);
    if (!Array.isArray(esquema) || esquema.length === 0) {
      throw new Error('PASO 233 FALLIDO: esquema vacio para ' + entidad);
    }
    esquema.forEach(function (campo) {
      if ((campo.tipo === 'catalogo' || campo.tipo === 'fk') && !Array.isArray(campo.opciones)) {
        throw new Error('PASO 233 FALLIDO: campo ' + campo.campo + ' de ' + entidad + ' sin opciones.');
      }
      if (campo.tipo === 'catalogo' && campo.opciones.length === 0) {
        throw new Error('PASO 233 FALLIDO: catalogo vacio para ' + campo.campo + ' de ' + entidad + ' (' + campo.catalogo + ').');
      }
    });
  });
  Logger.log('PASO 233 OK: esquema valido para CAMPANA, PROYECTO, PRODUCTO, PROCESO y TAREA.');
}

function pruebaPaso234_GuardarFormularioCreaCampana() {
  Logger.log('=== PASO 234: guardarFormulario crea CAMPANA ===');
  var datosForm = {
    NOMBRE: 'Campana prueba P234',
    FECHA_INICIO_PLAN: '2026-01-01',
    FECHA_FIN_PLAN: '2026-12-31',
    ESTADO: 'Borrador'
  };
  var resultado = guardarFormulario('CAMPANA', '', datosForm);
  var creada = obtenerCampana(resultado.id);

  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), resultado.id);

  if (!creada || creada.NOMBRE !== 'Campana prueba P234') {
    throw new Error('PASO 234 FALLIDO: la campaña creada desde el formulario no coincide.');
  }
  Logger.log('PASO 234 OK: guardarFormulario creo la CAMPANA correctamente desde datos de formulario (strings).');
}

function pruebaPaso235_GuardarFormularioCreaProyectoConFk() {
  Logger.log('=== PASO 235: guardarFormulario crea PROYECTO usando FK de formulario ===');
  var campana = crearCampana({
    NOMBRE: 'Campana base P235',
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var datosForm = {
    CAMPANA_ID: campana.id,
    NOMBRE: 'Proyecto prueba P235',
    TIPO_PROYECTO: 'Propuesta',
    PRIORIDAD: 'Media',
    ESTADO: 'Borrador'
  };
  var resultado = guardarFormulario('PROYECTO', '', datosForm);
  var creado = obtenerProyecto(resultado.id);

  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROYECTO'), resultado.id);
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), campana.id);

  if (!creado || creado.CAMPANA_ID !== campana.id) {
    throw new Error('PASO 235 FALLIDO: el proyecto creado no quedo asociado a la campaña del formulario.');
  }
  Logger.log('PASO 235 OK: guardarFormulario creo el PROYECTO con el FK CAMPANA_ID tomado del select.');
}

function pruebaPaso236_GuardarFormularioActualizaRegistro() {
  Logger.log('=== PASO 236: guardarFormulario actualiza un registro existente ===');
  var campana = crearCampana({
    NOMBRE: 'Campana prueba P236',
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ESTADO: 'Borrador'
  }, {dryRun: false});

  var datosForm = {
    NOMBRE: 'Campana P236 renombrada desde formulario',
    FECHA_INICIO_PLAN: '2026-01-01',
    FECHA_FIN_PLAN: '2026-12-31',
    ESTADO: 'Borrador'
  };
  guardarFormulario('CAMPANA', campana.id, datosForm);
  var actualizada = obtenerCampana(campana.id);

  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), campana.id);

  if (actualizada.NOMBRE !== 'Campana P236 renombrada desde formulario') {
    throw new Error('PASO 236 FALLIDO: guardarFormulario no aplico la actualizacion.');
  }
  Logger.log('PASO 236 OK: guardarFormulario actualizo el registro existente.');
}

function pruebaPaso237_GuardarFormularioEntidadNoSoportada() {
  Logger.log('=== PASO 237: guardarFormulario con entidad no soportada ===');
  var error = null;
  try {
    guardarFormulario('MATERIAL', '', {CODIGO: 'X'});
  } catch (e) {
    error = e;
  }
  if (!error) {
    throw new Error('PASO 237 FALLIDO: se esperaba un error para entidad sin formulario.');
  }
  Logger.log('PASO 237 OK: error esperado capturado -> ' + error.message);
}

function ejecutarSuitePaso233a237() {
  pruebaPaso233_EsquemaFormularioLasCincoEntidades();
  pruebaPaso234_GuardarFormularioCreaCampana();
  pruebaPaso235_GuardarFormularioCreaProyectoConFk();
  pruebaPaso236_GuardarFormularioActualizaRegistro();
  pruebaPaso237_GuardarFormularioEntidadNoSoportada();
  Logger.log('SUITE PASO 233-237 (FORMULARIOS) COMPLETADA CON EXITO');
}
// ===== PASO 238-243: Fase 7 -- Panel operativo (DashboardService.gs) =====

function pruebaPaso238_ResumenGlobalDevuelveConteosPorEntidad() {
  var cadena = construirCadenaTareaPrueba_('P238');
  try {
    var resumen = obtenerResumenGlobal();
    ['CAMPANA', 'PROYECTO', 'PRODUCTO', 'PROCESO', 'TAREA', 'DECISION', 'INCIDENCIA'].forEach(function (entidad) {
      if (typeof resumen[entidad] !== 'object') {
        throw new Error('PASO238 FALLO: falta la entidad ' + entidad + ' en el resumen.');
      }
    });
    var tarea = obtenerRegistroPorId('TAREA', cadena.tareaId);
    var conteoEstadoTarea = resumen.TAREA[tarea.ESTADO];
    if (!conteoEstadoTarea || conteoEstadoTarea < 1) {
      throw new Error('PASO238 FALLO: el resumen de TAREA no cuenta la tarea de prueba.');
    }
    Logger.log('PASO238 OK: resumen global con las 7 entidades y conteo de TAREA coherente.');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
  }
}

function pruebaPaso239_TareasRetrasadasDetectaTareaVencida() {
  var cadena = construirCadenaTareaPrueba_('P239');
  try {
    var fechaPasada = new Date();
    fechaPasada.setDate(fechaPasada.getDate() - 10);
    actualizarRegistroTransaccional('TAREA', cadena.tareaId, { FECHA_FIN_PLAN: fechaPasada });

    var retrasadas = listarTareasRetrasadas();
    var encontrada = retrasadas.some(function (t) { return t.ID === cadena.tareaId; });
    if (!encontrada) {
      throw new Error('PASO239 FALLO: la tarea vencida no aparece en listarTareasRetrasadas().');
    }
    Logger.log('PASO239 OK: listarTareasRetrasadas() detecta la tarea con FECHA_FIN_PLAN vencida.');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
  }
}

function pruebaPaso240_TareasBloqueadasDetectaTareaBloqueada() {
  var cadena = construirCadenaTareaPrueba_('P240');
  try {
    actualizarRegistroTransaccional('TAREA', cadena.tareaId, {
      ESTADO: 'Bloqueada',
      MOTIVO_BLOQUEO: 'Bloqueo de prueba PASO240'
    });

    var bloqueadas = listarTareasBloqueadas();
    var encontrada = bloqueadas.some(function (t) { return t.ID === cadena.tareaId; });
    if (!encontrada) {
      throw new Error('PASO240 FALLO: la tarea bloqueada no aparece en listarTareasBloqueadas().');
    }
    Logger.log('PASO240 OK: listarTareasBloqueadas() detecta la tarea con ESTADO Bloqueada.');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
  }
}

function pruebaPaso241_DecisionesPendientesMarcaVencida() {
  var cadena = construirProyectoDePrueba_('P241');
  var decisionId = null;
  try {
    var fechaPasada = new Date();
    fechaPasada.setDate(fechaPasada.getDate() - 5);

    var decision = insertarRegistroTransaccional('DECISION', {
      PROYECTO_ID: cadena.proyectoId,
      TITULO: 'Decision de prueba PASO241',
      TIPO: 'Técnica',
      ESTADO: 'Pendiente de aprobación',
      IMPACTO: 'Medio',
      FECHA_LIMITE: fechaPasada
    }, { dryRun: false });
    decisionId = decision.id;

    var pendientes = listarDecisionesPendientes();
    var encontrada = pendientes.filter(function (d) { return d.ID === decisionId; })[0];
    if (!encontrada) {
      throw new Error('PASO241 FALLO: la decision pendiente no aparece en listarDecisionesPendientes().');
    }
    if (encontrada.VENCIDA !== true) {
      throw new Error('PASO241 FALLO: la decision con FECHA_LIMITE vencida no se marco VENCIDA=true.');
    }
    Logger.log('PASO241 OK: listarDecisionesPendientes() incluye la decision y marca VENCIDA correctamente.');
  } finally {
    if (decisionId) {
      eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('DECISION'), decisionId);
    }
    limpiarProyectoDePrueba_(cadena);
  }
}

function pruebaPaso242_IncidenciasAbiertasExcluyeCerradas() {
  var cadena = construirProyectoDePrueba_('P242');
  var idAbierta = null;
  var idCerrada = null;
  try {
    var abierta = insertarRegistroTransaccional('INCIDENCIA', {
      PROYECTO_ID: cadena.proyectoId,
      TITULO: 'Incidencia abierta PASO242',
      TIPO: 'Calidad',
      PRIORIDAD: 'Media',
      ESTADO: 'Abierta'
    }, { dryRun: false });
    idAbierta = abierta.id;

    var cerrada = insertarRegistroTransaccional('INCIDENCIA', {
      PROYECTO_ID: cadena.proyectoId,
      TITULO: 'Incidencia cerrada PASO242',
      TIPO: 'Calidad',
      PRIORIDAD: 'Media',
      ESTADO: 'Cerrada'
    }, { dryRun: false });
    idCerrada = cerrada.id;

    var abiertas = listarIncidenciasAbiertas();
    var incluyeAbierta = abiertas.some(function (i) { return i.ID === idAbierta; });
    var incluyeCerrada = abiertas.some(function (i) { return i.ID === idCerrada; });
    if (!incluyeAbierta) {
      throw new Error('PASO242 FALLO: la incidencia Abierta no aparece en listarIncidenciasAbiertas().');
    }
    if (incluyeCerrada) {
      throw new Error('PASO242 FALLO: la incidencia Cerrada aparece indebidamente en listarIncidenciasAbiertas().');
    }
    Logger.log('PASO242 OK: listarIncidenciasAbiertas() incluye abiertas y excluye cerradas.');
  } finally {
    if (idAbierta) eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('INCIDENCIA'), idAbierta);
    if (idCerrada) eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('INCIDENCIA'), idCerrada);
    limpiarProyectoDePrueba_(cadena);
  }
}

function ejecutarSuitePaso238a243() {
  Logger.log('=== INICIO SUITE PASO 238-243: Fase 7, Panel operativo ===');
  pruebaPaso238_ResumenGlobalDevuelveConteosPorEntidad();
  pruebaPaso239_TareasRetrasadasDetectaTareaVencida();
  pruebaPaso240_TareasBloqueadasDetectaTareaBloqueada();
  pruebaPaso241_DecisionesPendientesMarcaVencida();
  pruebaPaso242_IncidenciasAbiertasExcluyeCerradas();
  Logger.log('=== SUITE PASO 238-243 COMPLETADA CON EXITO ===');
}


/* ============================================================
   PASO 238-242 -- Fase 7: Panel operativo (DashboardService.gs)
   ============================================================ */

function pruebaPaso238_ResumenGlobalTieneLasSieteEntidades() {
  Logger.log('=== PASO 238: resumen global tiene las 7 entidades ===');
  var resumen = obtenerResumenGlobal();
  var claves = ['CAMPANA', 'PROYECTO', 'PRODUCTO', 'PROCESO', 'TAREA', 'DECISION', 'INCIDENCIA'];
  claves.forEach(function (clave) {
    if (!resumen.hasOwnProperty(clave) || typeof resumen[clave] !== 'object') {
      throw new Error('PASO238_FALLO: falta o es invalida la clave ' + clave + ' en el resumen.');
    }
  });
  Logger.log('PASO238 COMPLETADA CON EXITO: obtenerResumenGlobal devuelve las 7 entidades.');
}

function pruebaPaso239_TareaRetrasadaYBloqueadaAparecenEnPanel() {
  Logger.log('=== PASO 239: tareas retrasadas y bloqueadas ===');
  var producto = crearProducto({
    CODIGO: 'PRD-P239',
    NOMBRE: 'Producto base P239',
    ORIGEN: 'Producción propia',
    UNIDAD: 'Unidad',
    ESTADO: 'Borrador'
  }, { dryRun: false });

  var proceso = crearProceso({
    PRODUCTO_ID: producto.id,
    NOMBRE: 'Proceso base P239',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0
  }, { dryRun: false });

  var tareaRetrasada = crearTarea({
    PROCESO_ID: proceso.id,
    NOMBRE: 'Tarea retrasada P239',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    FECHA_FIN_PLAN: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0
  }, { dryRun: false });

  var tareaBloqueada = crearTarea({
    PROCESO_ID: proceso.id,
    NOMBRE: 'Tarea bloqueada P239',
    ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Bloqueada',
    PORCENTAJE_AVANCE: 0,
    MOTIVO_BLOQUEO: 'Prueba P239'
  }, { dryRun: false });

  var retrasadas = listarTareasRetrasadas();
  var bloqueadas = listarTareasBloqueadas();

  var encontradaRetrasada = retrasadas.some(function (t) { return t.ID === tareaRetrasada.id; });
  var encontradaBloqueada = bloqueadas.some(function (t) { return t.ID === tareaBloqueada.id; });

  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('TAREA'), tareaRetrasada.id);
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('TAREA'), tareaBloqueada.id);
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROCESO'), proceso.id);
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PRODUCTO'), producto.id);

  if (!encontradaRetrasada) {
    throw new Error('PASO239_FALLO: la tarea retrasada no aparecio en listarTareasRetrasadas.');
  }
  if (!encontradaBloqueada) {
    throw new Error('PASO239_FALLO: la tarea bloqueada no aparecio en listarTareasBloqueadas.');
  }
  Logger.log('PASO239 COMPLETADA CON EXITO: retrasadas y bloqueadas detectadas correctamente.');
}

function pruebaPaso240_DecisionPendienteMarcaVencida() {
  Logger.log('=== PASO 240: decision pendiente vencida ===');
  var campana = crearCampana({
    NOMBRE: 'Campana base P240',
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ESTADO: 'Borrador'
  }, { dryRun: false });

  var proyecto = crearProyecto({
    CAMPANA_ID: campana.id,
    NOMBRE: 'Proyecto base P240',
    TIPO_PROYECTO: 'Importante',
    PRIORIDAD: 'Media',
    ESTADO: 'Planificado'
  }, { dryRun: false });

  var decisionVencida = insertarRegistroTransaccional('DECISION', {
    PROYECTO_ID: proyecto.id,
    TITULO: 'Decision pendiente vencida P240',
    TIPO: 'Técnica',
    ESTADO: 'Pendiente de aprobación',
    IMPACTO: 'Medio',
    FECHA_LIMITE: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  }, { dryRun: false });

  var decisionAlDia = insertarRegistroTransaccional('DECISION', {
    PROYECTO_ID: proyecto.id,
    TITULO: 'Decision pendiente al dia P240',
    TIPO: 'Técnica',
    ESTADO: 'Pendiente de aprobación',
    IMPACTO: 'Bajo',
    FECHA_LIMITE: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }, { dryRun: false });

  var pendientes = listarDecisionesPendientes();
  var vencida = pendientes.filter(function (d) { return d.ID === decisionVencida.id; })[0];
  var alDia = pendientes.filter(function (d) { return d.ID === decisionAlDia.id; })[0];

  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('DECISION'), decisionVencida.id);
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('DECISION'), decisionAlDia.id);
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROYECTO'), proyecto.id);
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), campana.id);

  if (!vencida || vencida.VENCIDA !== true) {
    throw new Error('PASO240_FALLO: la decision vencida no quedo marcada como VENCIDA.');
  }
  if (!alDia || alDia.VENCIDA !== false) {
    throw new Error('PASO240_FALLO: la decision al dia no debia marcarse como VENCIDA.');
  }
  Logger.log('PASO240 COMPLETADA CON EXITO: listarDecisionesPendientes marca VENCIDA correctamente.');
}

function pruebaPaso241_IncidenciaAbiertaYCerradaSeFiltranBien() {
  Logger.log('=== PASO 241: incidencias abiertas vs cerradas ===');
  var incidenciaAbierta = insertarRegistroTransaccional('INCIDENCIA', {
    TITULO: 'Incidencia abierta P241',
    TIPO: 'Calidad',
    PRIORIDAD: 'Alta',
    ESTADO: 'Abierta'
  }, { dryRun: false });

  var incidenciaCerrada = insertarRegistroTransaccional('INCIDENCIA', {
    TITULO: 'Incidencia cerrada P241',
    TIPO: 'Calidad',
    PRIORIDAD: 'Baja',
    ESTADO: 'Cerrada'
  }, { dryRun: false });

  var abiertas = listarIncidenciasAbiertas();
  var apareceAbierta = abiertas.some(function (i) { return i.ID === incidenciaAbierta.id; });
  var apareceCerrada = abiertas.some(function (i) { return i.ID === incidenciaCerrada.id; });

  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('INCIDENCIA'), incidenciaAbierta.id);
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('INCIDENCIA'), incidenciaCerrada.id);

  if (!apareceAbierta) {
    throw new Error('PASO241_FALLO: la incidencia abierta no aparecio en listarIncidenciasAbiertas.');
  }
  if (apareceCerrada) {
    throw new Error('PASO241_FALLO: la incidencia cerrada no debia aparecer en listarIncidenciasAbiertas.');
  }
  Logger.log('PASO241 COMPLETADA CON EXITO: listarIncidenciasAbiertas filtra correctamente.');
}

function pruebaPaso242_ObtenerPanelOperativoDevuelveLasCincoSecciones() {
  Logger.log('=== PASO 242: obtenerPanelOperativo devuelve las 5 secciones ===');
  var panel = obtenerPanelOperativo();
  var secciones = ['resumen', 'tareasRetrasadas', 'tareasBloqueadas', 'decisionesPendientes', 'incidenciasAbiertas'];
  secciones.forEach(function (seccion) {
    if (!panel.hasOwnProperty(seccion)) {
      throw new Error('PASO242_FALLO: falta la seccion ' + seccion + ' en obtenerPanelOperativo.');
    }
  });
  Logger.log('PASO242 COMPLETADA CON EXITO: obtenerPanelOperativo devuelve las 5 secciones.');
}

function ejecutarSuitePaso238a242() {
  pruebaPaso238_ResumenGlobalTieneLasSieteEntidades();
  pruebaPaso239_TareaRetrasadaYBloqueadaAparecenEnPanel();
  pruebaPaso240_DecisionPendienteMarcaVencida();
  pruebaPaso241_IncidenciaAbiertaYCerradaSeFiltranBien();
  pruebaPaso242_ObtenerPanelOperativoDevuelveLasCincoSecciones();
  Logger.log('SUITE PASO 238-242 (DASHBOARD_SERVICE) COMPLETADA CON EXITO');
}

function pruebaPaso243_GenerarInformeCampaniaTieneEstructuraYAlertas() {
  var hoy = new Date();
  var haceCinco = new Date(hoy.getTime() - 5 * 24 * 60 * 60 * 1000);
  var haceDiez = new Date(hoy.getTime() - 10 * 24 * 60 * 60 * 1000);
  var enDiez = new Date(hoy.getTime() + 10 * 24 * 60 * 60 * 1000);

  var campana = crearCampana({
    NOMBRE: 'Campana informe P243',
    FECHA_INICIO_PLAN: haceDiez,
    FECHA_FIN_PLAN: enDiez,
    ESTADO: 'Activa'
  }, { dryRun: false });

  var proyecto = crearProyecto({
    CAMPANA_ID: campana.id,
    NOMBRE: 'Proyecto informe P243',
    TIPO_PROYECTO: 'Importante',
    PRIORIDAD: 'Alta',
    ESTADO: 'En proceso'
  }, { dryRun: false });

  var producto = crearProducto({
    CODIGO: 'PRD-P243',
    NOMBRE: 'Producto informe P243',
    ORIGEN: 'Producción propia',
    UNIDAD: 'Unidad',
    ESTADO: 'Planificado',
    CANTIDAD_PREVISTA: 10,
    CANTIDAD_PRODUCIDA: 4
  }, { dryRun: false });

  var relacion = insertarRegistroTransaccional('PROYECTO_PRODUCTO', {
    PROYECTO_ID: proyecto.id,
    PRODUCTO_ID: producto.id,
    CANTIDAD_ASIGNADA: 10,
    PRIORIDAD: 'Alta',
    ESTADO: 'Pendiente'
  }, { dryRun: false });

  var proceso = crearProceso({
    PRODUCTO_ID: producto.id,
    NOMBRE: 'Proceso informe P243',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 2,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0
  }, { dryRun: false });

  var tarea = crearTarea({
    PROCESO_ID: proceso.id,
    NOMBRE: 'Tarea informe P243',
    ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1,
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_FIN_PLAN: haceCinco
  }, { dryRun: false });

  var decision = insertarRegistroTransaccional('DECISION', {
    PROYECTO_ID: proyecto.id,
    TITULO: 'Decision informe P243',
    TIPO: 'Técnica',
    ESTADO: 'Pendiente de aprobación',
    IMPACTO: 'Medio',
    FECHA_LIMITE: haceCinco
  }, { dryRun: false });

  var incidencia = insertarRegistroTransaccional('INCIDENCIA', {
    CAMPANA_ID: campana.id,
    PROYECTO_ID: proyecto.id,
    TITULO: 'Incidencia informe P243',
    TIPO: 'Calidad',
    PRIORIDAD: 'Alta',
    ESTADO: 'Abierta'
  }, { dryRun: false });

  try {
    var informe = generarInformeCampania(campana.id);

    if (informe.tipo !== 'CAMPANA') throw new Error('PASO243 FALLÓ: tipo incorrecto.');
    if (informe.proyectos.length !== 1) throw new Error('PASO243 FALLÓ: proyectos.length esperado 1, obtenido ' + informe.proyectos.length);
    if (informe.totales.productos !== 1) throw new Error('PASO243 FALLÓ: totales.productos esperado 1.');
    if (informe.totales.procesos !== 1) throw new Error('PASO243 FALLÓ: totales.procesos esperado 1.');
    if (informe.totales.tareas !== 1) throw new Error('PASO243 FALLÓ: totales.tareas esperado 1.');
    if (informe.tareasRetrasadas.length !== 1) throw new Error('PASO243 FALLÓ: tareasRetrasadas esperado 1.');
    if (informe.decisionesPendientes.length !== 1) throw new Error('PASO243 FALLÓ: decisionesPendientes esperado 1.');
    if (informe.incidenciasAbiertas.length !== 1) throw new Error('PASO243 FALLÓ: incidenciasAbiertas esperado 1.');

    Logger.log('PASO 243 OK: generarInformeCampania devuelve estructura y alertas correctas.');
  } finally {
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('INCIDENCIA'), incidencia.id);
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('DECISION'), decision.id);
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('TAREA'), tarea.id);
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROCESO'), proceso.id);
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROYECTO_PRODUCTO'), relacion.id);
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PRODUCTO'), producto.id);
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROYECTO'), proyecto.id);
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), campana.id);
  }
}

function pruebaPaso244_GenerarInformeProyectoCalculaAvanceDeProductos() {
  var campana = crearCampana({
    NOMBRE: 'Campana informe P244',
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    ESTADO: 'Activa'
  }, { dryRun: false });

  var proyecto = crearProyecto({
    CAMPANA_ID: campana.id,
    NOMBRE: 'Proyecto informe P244',
    TIPO_PROYECTO: 'Urgente',
    PRIORIDAD: 'Media',
    ESTADO: 'Planificado'
  }, { dryRun: false });

  var producto = crearProducto({
    CODIGO: 'PRD-P244',
    NOMBRE: 'Producto informe P244',
    ORIGEN: 'Pedido interno',
    UNIDAD: 'Unidad',
    ESTADO: 'Planificado',
    CANTIDAD_PREVISTA: 20,
    CANTIDAD_PRODUCIDA: 5
  }, { dryRun: false });

  var relacion = insertarRegistroTransaccional('PROYECTO_PRODUCTO', {
    PROYECTO_ID: proyecto.id,
    PRODUCTO_ID: producto.id,
    CANTIDAD_ASIGNADA: 20,
    PRIORIDAD: 'Media',
    ESTADO: 'Pendiente'
  }, { dryRun: false });

  try {
    var informe = generarInformeProyecto(proyecto.id);

    if (informe.tipo !== 'PROYECTO') throw new Error('PASO244 FALLÓ: tipo incorrecto.');
    if (informe.productos.length !== 1) throw new Error('PASO244 FALLÓ: productos.length esperado 1.');
    if (informe.productos[0].PORCENTAJE_AVANCE_CALCULADO !== 25) {
      throw new Error('PASO244 FALLÓ: avance calculado esperado 25, obtenido ' + informe.productos[0].PORCENTAJE_AVANCE_CALCULADO);
    }
    if (informe.totales.productos !== 1) throw new Error('PASO244 FALLÓ: totales.productos esperado 1.');

    Logger.log('PASO 244 OK: generarInformeProyecto calcula el avance de productos correctamente.');
  } finally {
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROYECTO_PRODUCTO'), relacion.id);
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PRODUCTO'), producto.id);
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROYECTO'), proyecto.id);
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), campana.id);
  }
}

function pruebaPaso245_GenerarMemoriaProduccionDevuelveLasCincoSecciones() {
  var memoria = generarMemoriaProduccion();

  if (memoria.tipo !== 'MEMORIA') throw new Error('PASO245 FALLÓ: tipo incorrecto.');
  if (!memoria.resumenGlobal) throw new Error('PASO245 FALLÓ: falta resumenGlobal.');
  if (!Array.isArray(memoria.campanas)) throw new Error('PASO245 FALLÓ: campanas debe ser un array.');
  if (!Array.isArray(memoria.tareasRetrasadas)) throw new Error('PASO245 FALLÓ: tareasRetrasadas debe ser un array.');
  if (!Array.isArray(memoria.decisionesPendientes)) throw new Error('PASO245 FALLÓ: decisionesPendientes debe ser un array.');
  if (!Array.isArray(memoria.incidenciasAbiertas)) throw new Error('PASO245 FALLÓ: incidenciasAbiertas debe ser un array.');

  Logger.log('PASO 245 OK: generarMemoriaProduccion devuelve las cinco secciones esperadas.');
}

function pruebaPaso246_ObtenerOpcionesInformeDevuelveIdYEtiqueta() {
  var opcionesCampana = obtenerOpcionesInforme('CAMPANA');
  var opcionesProyecto = obtenerOpcionesInforme('PROYECTO');

  if (!Array.isArray(opcionesCampana)) throw new Error('PASO246 FALLÓ: opcionesCampana debe ser un array.');
  if (!Array.isArray(opcionesProyecto)) throw new Error('PASO246 FALLÓ: opcionesProyecto debe ser un array.');
  if (opcionesCampana.length > 0 && (!opcionesCampana[0].id || !opcionesCampana[0].etiqueta)) {
    throw new Error('PASO246 FALLÓ: opcionesCampana debe tener id y etiqueta.');
  }

  var lanzoError = false;
  try {
    obtenerOpcionesInforme('TIPO_INEXISTENTE');
  } catch (e) {
    lanzoError = true;
  }
  if (!lanzoError) throw new Error('PASO246 FALLÓ: obtenerOpcionesInforme debería lanzar error con tipo no soportado.');

  Logger.log('PASO 246 OK: obtenerOpcionesInforme devuelve id/etiqueta y valida el tipo.');
}

function pruebaPaso247_GenerarInformeDispatcherCubreLosTresTipos() {
  var campana = crearCampana({
    NOMBRE: 'Campana informe P247',
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    ESTADO: 'Activa'
  }, { dryRun: false });

  var proyecto = crearProyecto({
    CAMPANA_ID: campana.id,
    NOMBRE: 'Proyecto informe P247',
    TIPO_PROYECTO: 'Propuesta',
    PRIORIDAD: 'Baja',
    ESTADO: 'Borrador'
  }, { dryRun: false });

  try {
    var informeCampania = generarInforme('CAMPANA', campana.id);
    if (informeCampania.tipo !== 'CAMPANA') throw new Error('PASO247 FALLÓ: dispatcher CAMPANA incorrecto.');

    var informeProyecto = generarInforme('PROYECTO', proyecto.id);
    if (informeProyecto.tipo !== 'PROYECTO') throw new Error('PASO247 FALLÓ: dispatcher PROYECTO incorrecto.');

    var informeMemoria = generarInforme('MEMORIA', null);
    if (informeMemoria.tipo !== 'MEMORIA') throw new Error('PASO247 FALLÓ: dispatcher MEMORIA incorrecto.');

    var lanzoError = false;
    try {
      generarInforme('TIPO_INEXISTENTE', null);
    } catch (e) {
      lanzoError = true;
    }
    if (!lanzoError) throw new Error('PASO247 FALLÓ: dispatcher debería lanzar error con tipo no soportado.');

    Logger.log('PASO 247 OK: generarInforme cubre CAMPANA, PROYECTO y MEMORIA, y valida el tipo.');
  } finally {
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROYECTO'), proyecto.id);
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), campana.id);
  }
}

function ejecutarSuitePaso243a247() {
  pruebaPaso243_GenerarInformeCampaniaTieneEstructuraYAlertas();
  pruebaPaso244_GenerarInformeProyectoCalculaAvanceDeProductos();
  pruebaPaso245_GenerarMemoriaProduccionDevuelveLasCincoSecciones();
  pruebaPaso246_ObtenerOpcionesInformeDevuelveIdYEtiqueta();
  pruebaPaso247_GenerarInformeDispatcherCubreLosTresTipos();
  Logger.log('SUITE PASO 243-247 (REPORT_SERVICE) COMPLETADA CON EXITO');
}

function pruebaPaso248_ObtenerCatalogoDevuelveValoresYValidaNombre() {
  var valores = obtenerCatalogo('CFG_ESTADO_TAREA');

  if (!Array.isArray(valores) || valores.length === 0) {
    throw new Error('PASO248 FALLÓ: obtenerCatalogo(CFG_ESTADO_TAREA) debería devolver valores.');
  }
  if (valores.indexOf('Pendiente') === -1 || valores.indexOf('Terminada') === -1) {
    throw new Error('PASO248 FALLÓ: faltan valores esperados del catálogo de ESTADO_TAREA.');
  }

  var lanzoError = false;
  try {
    obtenerCatalogo('CFG_RANGO_INEXISTENTE');
  } catch (e) {
    lanzoError = true;
  }
  if (!lanzoError) {
    throw new Error('PASO248 FALLÓ: obtenerCatalogo debería lanzar error con un nombre de rango inexistente.');
  }

  Logger.log('PASO 248 OK: obtenerCatalogo devuelve valores y valida el nombre del rango.');
}

function pruebaPaso249_ListarOpcionesActivasDevuelveClaveYValor() {
  var opciones = listarOpcionesActivas('ESTADO_TAREA');

  if (!Array.isArray(opciones) || opciones.length === 0) {
    throw new Error('PASO249 FALLÓ: listarOpcionesActivas(ESTADO_TAREA) debería devolver opciones.');
  }

  var pendiente = opciones.filter(function (op) { return op.clave === 'PENDIENTE'; })[0];
  if (!pendiente || pendiente.valor !== 'Pendiente') {
    throw new Error('PASO249 FALLÓ: no se encontró la opción PENDIENTE/Pendiente esperada.');
  }

  var opcionesVacias = listarOpcionesActivas('CATEGORIA_INEXISTENTE');
  if (!Array.isArray(opcionesVacias) || opcionesVacias.length !== 0) {
    throw new Error('PASO249 FALLÓ: una categoría inexistente debería devolver un array vacío, no un error.');
  }

  Logger.log('PASO 249 OK: listarOpcionesActivas devuelve pares clave/valor y un array vacío para categorías inexistentes.');
}

function pruebaPaso250_ListarCategoriasDisponiblesSinDuplicados() {
  var categorias = listarCategoriasDisponibles();

  if (!Array.isArray(categorias) || categorias.length === 0) {
    throw new Error('PASO250 FALLÓ: listarCategoriasDisponibles debería devolver categorías.');
  }
  if (categorias.indexOf('ESTADO_TAREA') === -1 || categorias.indexOf('PRIORIDAD') === -1) {
    throw new Error('PASO250 FALLÓ: faltan categorías esperadas.');
  }

  var vistas = {};
  categorias.forEach(function (categoria) {
    if (vistas[categoria]) {
      throw new Error('PASO250 FALLÓ: categoría duplicada ' + categoria);
    }
    vistas[categoria] = true;
  });

  Logger.log('PASO 250 OK: listarCategoriasDisponibles devuelve categorías sin duplicados.');
}

function pruebaPaso251_CatalogoFisicoYLogicoCoinciden() {
  var porRango = obtenerCatalogo('CFG_PRIORIDAD').slice().sort();
  var porCategoria = listarOpcionesActivas('PRIORIDAD').map(function (op) { return op.valor; }).sort();

  if (JSON.stringify(porRango) !== JSON.stringify(porCategoria)) {
    throw new Error('PASO251 FALLÓ: obtenerCatalogo y listarOpcionesActivas deberían coincidir para PRIORIDAD. ' +
      JSON.stringify(porRango) + ' vs ' + JSON.stringify(porCategoria));
  }

  Logger.log('PASO 251 OK: el acceso físico (named range) y el lógico (CATEGORIA) devuelven el mismo conjunto de valores.');
}

function ejecutarSuitePaso248a251() {
  pruebaPaso248_ObtenerCatalogoDevuelveValoresYValidaNombre();
  pruebaPaso249_ListarOpcionesActivasDevuelveClaveYValor();
  pruebaPaso250_ListarCategoriasDisponiblesSinDuplicados();
  pruebaPaso251_CatalogoFisicoYLogicoCoinciden();
  Logger.log('SUITE PASO 248-251 (CONFIG_REPOSITORY) COMPLETADA CON EXITO');
}

function eliminarFilaHistorialPorId_(hoja, idHistorial) {
  if (!hoja || !idHistorial || hoja.getLastRow() < 2) {
    return;
  }

  var cabeceras = hoja
    .getRange(1, 1, 1, hoja.getLastColumn())
    .getDisplayValues()[0]
    .map(function (valor) {
      return String(valor).trim();
    });

  var indiceId = cabeceras.indexOf('ID_HISTORIAL');

  if (indiceId === -1) {
    return;
  }

  var ids = hoja
    .getRange(2, indiceId + 1, hoja.getLastRow() - 1, 1)
    .getDisplayValues();

  for (var i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]).trim() === String(idHistorial).trim()) {
      hoja.deleteRow(i + 2);
    }
  }
}

function pruebaPaso252_CrearRegistraHistorialConAccionCrear() {
  var campana = crearCampana({
    NOMBRE: 'Campana historial P252',
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    ESTADO: 'Borrador'
  }, { dryRun: false });

  var hoja = SpreadsheetApp.getActive().getSheetByName('91_HISTORIAL');
  var historial = listarHistorialDeRegistro('CAMPANA', campana.id);

  try {
    /*
     * No se asume historial vacío: el ID de CAMPANA puede reutilizarse
     * tras borrar filas de prueba anteriores, así que puede haber
     * entradas de ejecuciones previas con el mismo REGISTRO_ID. Se
     * busca la entrada CREAR de esta ejecución en vez de exigir
     * exactamente 1 fila.
     */
    var filaCreacion =
      historial.filter(function (fila) {
        if (fila.ACCION !== 'CREAR') {
          return false;
        }

        try {
          return (
            JSON.parse(fila.DESPUES_JSON).NOMBRE ===
            'Campana historial P252'
          );
        } catch (e) {
          return false;
        }
      })[0];

    if (!filaCreacion) {
      throw new Error('PASO252 FALLÓ: no se encontró una fila de historial con ACCION CREAR y el NOMBRE esperado.');
    }

    Logger.log('PASO 252 OK: crearCampana registra una fila de historial con ACCION CREAR.');
  } finally {
    historial.forEach(function (fila) {
      eliminarFilaHistorialPorId_(hoja, fila.ID_HISTORIAL);
    });
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), campana.id);
  }
}

function pruebaPaso253_ActualizarRegistraHistorialConDiferencias() {
  var campana = crearCampana({
    NOMBRE: 'Campana historial P253',
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    ESTADO: 'Borrador'
  }, { dryRun: false });

  actualizarCampana(campana.id, { ESTADO: 'Activa' }, { dryRun: false });

  var hoja = SpreadsheetApp.getActive().getSheetByName('91_HISTORIAL');
  var historial = listarHistorialDeRegistro('CAMPANA', campana.id);

  try {
    /*
     * No se asume un total exacto de filas: el ID de CAMPANA puede
     * reutilizarse tras borrar filas de prueba anteriores. Se busca
     * la fila ACTUALIZAR con el diff exacto de esta ejecución.
     */
    var filaActualizacion =
      historial.filter(function (fila) {
        if (fila.ACCION !== 'ACTUALIZAR') {
          return false;
        }

        try {
          var anterior = JSON.parse(fila.ANTES_JSON);
          var nuevo = JSON.parse(fila.DESPUES_JSON);

          return (
            anterior.ESTADO === 'Borrador' &&
            nuevo.ESTADO === 'Activa'
          );
        } catch (e) {
          return false;
        }
      })[0];

    if (!filaActualizacion) {
      throw new Error('PASO253 FALLÓ: no se encontró una fila ACTUALIZAR con el diff ESTADO Borrador->Activa esperado.');
    }

    Logger.log('PASO 253 OK: actualizarCampana registra una fila de historial con el diff correcto.');
  } finally {
    historial.forEach(function (fila) {
      eliminarFilaHistorialPorId_(hoja, fila.ID_HISTORIAL);
    });
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), campana.id);
  }
}

function pruebaPaso254_DesactivarYReactivarAfinanLaAccion() {
  var campana = crearCampana({
    NOMBRE: 'Campana historial P254',
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    ESTADO: 'Borrador'
  }, { dryRun: false });

  desactivarCampana(campana.id);
  reactivarCampana(campana.id);

  var hoja = SpreadsheetApp.getActive().getSheetByName('91_HISTORIAL');
  var historial = listarHistorialDeRegistro('CAMPANA', campana.id);

  try {
    var acciones = historial.map(function (fila) { return fila.ACCION; });
    if (acciones.indexOf('DESACTIVAR') === -1) {
      throw new Error('PASO254 FALLÓ: no se encontró ACCION DESACTIVAR. Acciones: ' + acciones.join(','));
    }
    if (acciones.indexOf('REACTIVAR') === -1) {
      throw new Error('PASO254 FALLÓ: no se encontró ACCION REACTIVAR. Acciones: ' + acciones.join(','));
    }

    Logger.log('PASO 254 OK: desactivarRegistro y reactivarRegistro afinan la ACCION a DESACTIVAR/REACTIVAR.');
  } finally {
    historial.forEach(function (fila) {
      eliminarFilaHistorialPorId_(hoja, fila.ID_HISTORIAL);
    });
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), campana.id);
  }
}

function pruebaPaso255_ListarHistorialDeRegistroFiltraPorEntidadYId() {
  var campanaA = crearCampana({
    NOMBRE: 'Campana historial P255-A',
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    ESTADO: 'Borrador'
  }, { dryRun: false });

  var campanaB = crearCampana({
    NOMBRE: 'Campana historial P255-B',
    FECHA_INICIO_PLAN: new Date(),
    FECHA_FIN_PLAN: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    ESTADO: 'Borrador'
  }, { dryRun: false });

  var hoja = SpreadsheetApp.getActive().getSheetByName('91_HISTORIAL');
  var historialA = listarHistorialDeRegistro('CAMPANA', campanaA.id);
  var historialB = listarHistorialDeRegistro('CAMPANA', campanaB.id);

  try {
    /*
     * No se asume un total exacto de filas (el ID puede reutilizarse
     * tras borrar filas de prueba anteriores): lo que importa es que
     * ninguna fila de historialA referencie a campanaB y viceversa.
     */
    if (historialA.length < 1 || historialB.length < 1) {
      throw new Error('PASO255 FALLÓ: cada campaña debería tener al menos 1 fila de historial propia.');
    }

    var mezclaA =
      historialA.some(function (fila) {
        return fila.REGISTRO_ID !== campanaA.id;
      });

    var mezclaB =
      historialB.some(function (fila) {
        return fila.REGISTRO_ID !== campanaB.id;
      });

    if (mezclaA || mezclaB) {
      throw new Error('PASO255 FALLÓ: listarHistorialDeRegistro mezcló registros de distintas campañas.');
    }

    Logger.log('PASO 255 OK: listarHistorialDeRegistro filtra correctamente por entidad y registroId.');
  } finally {
    historialA.concat(historialB).forEach(function (fila) {
      eliminarFilaHistorialPorId_(hoja, fila.ID_HISTORIAL);
    });
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), campanaA.id);
    eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), campanaB.id);
  }
}

function ejecutarSuitePaso252a255() {
  pruebaPaso252_CrearRegistraHistorialConAccionCrear();
  pruebaPaso253_ActualizarRegistraHistorialConDiferencias();
  pruebaPaso254_DesactivarYReactivarAfinanLaAccion();
  pruebaPaso255_ListarHistorialDeRegistroFiltraPorEntidadYId();
  Logger.log('SUITE PASO 252-255 (HISTORIAL_SERVICE) COMPLETADA CON EXITO');
}

function pruebaPaso256_DetectarIdsDuplicados() {
  var hoja = obtenerHojaEntidad_('CAMPANA');
  var campana = insertarRegistroTransaccional('CAMPANA', {
    NOMBRE: 'Campana prueba P256', FECHA_INICIO_PLAN: new Date(), FECHA_FIN_PLAN: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), ESTADO: 'Borrador'
  }, {dryRun: false});

  var valores = hoja.getDataRange().getValues();
  var encabezados = valores[0];
  var filaOriginal = valores.filter(function (fila) { return fila[encabezados.indexOf('ID')] === campana.id; })[0];
  hoja.appendRow(filaOriginal);

  var duplicados = detectarIdsDuplicados('CAMPANA');
  var encontrado = duplicados.some(function (d) { return d.id === campana.id && d.ocurrencias === 2; });
  if (!encontrado) {
    throw new Error('PASO 256: no se detecto el ID duplicado insertado manualmente.');
  }

  hoja.deleteRow(hoja.getLastRow());
  eliminarRegistroPruebaPorId_(hoja, campana.id);
  Logger.log('PASO 256 OK: detectarIdsDuplicados detecta una fila duplicada real insertada directamente en la hoja.');
}

function pruebaPaso257_DetectarReferenciasHuerfanas() {
  var cadena = construirProyectoDePrueba_('P257');
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), cadena.campanaId);

  var huerfanas = detectarReferenciasHuerfanas('PROYECTO');
  var encontrado = huerfanas.some(function (h) { return h.registroId === cadena.proyectoId && h.campo === 'CAMPANA_ID'; });
  if (!encontrado) {
    throw new Error('PASO 257: no se detecto la referencia huerfana tras eliminar la campana padre.');
  }

  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROYECTO'), cadena.proyectoId);
  Logger.log('PASO 257 OK: detectarReferenciasHuerfanas detecta una FK que ya no existe en la entidad destino.');
}

function pruebaPaso258_ReporteIntegridadAgregaAmbosTipos() {
  var hojaCampana = obtenerHojaEntidad_('CAMPANA');
  var campanaDup = insertarRegistroTransaccional('CAMPANA', {
    NOMBRE: 'Campana duplicada P258', FECHA_INICIO_PLAN: new Date(), FECHA_FIN_PLAN: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), ESTADO: 'Borrador'
  }, {dryRun: false});
  var valores = hojaCampana.getDataRange().getValues();
  var encabezados = valores[0];
  var filaOriginal = valores.filter(function (fila) { return fila[encabezados.indexOf('ID')] === campanaDup.id; })[0];
  hojaCampana.appendRow(filaOriginal);

  var cadenaHuerfana = construirProyectoDePrueba_('P258b');
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('CAMPANA'), cadenaHuerfana.campanaId);

  var reporte = obtenerReporteIntegridad();
  var tieneDuplicado = reporte.idsDuplicados.CAMPANA && reporte.idsDuplicados.CAMPANA.some(function (d) { return d.id === campanaDup.id; });
  var tieneHuerfana = reporte.referenciasHuerfanas.PROYECTO && reporte.referenciasHuerfanas.PROYECTO.some(function (h) { return h.registroId === cadenaHuerfana.proyectoId; });
  if (!tieneDuplicado || !tieneHuerfana) {
    throw new Error('PASO 258: el reporte no agrego ambos problemas -> ' + JSON.stringify(reporte));
  }

  hojaCampana.deleteRow(hojaCampana.getLastRow());
  eliminarRegistroPruebaPorId_(hojaCampana, campanaDup.id);
  eliminarRegistroPruebaPorId_(obtenerHojaEntidad_('PROYECTO'), cadenaHuerfana.proyectoId);
  Logger.log('PASO 258 OK: obtenerReporteIntegridad agrega IDs duplicados y referencias huerfanas de entidades distintas en un unico reporte.');
}

function pruebaPaso259_HayProblemasIntegridad() {
  var reporteLimpio = {idsDuplicados: {}, referenciasHuerfanas: {}};
  var reporteConProblema = {idsDuplicados: {CAMPANA: [{id: 'CAM-9999', ocurrencias: 2}]}, referenciasHuerfanas: {}};

  if (hayProblemasIntegridad(reporteLimpio) !== false) {
    throw new Error('PASO 259: hayProblemasIntegridad deberia devolver false para un reporte limpio.');
  }
  if (hayProblemasIntegridad(reporteConProblema) !== true) {
    throw new Error('PASO 259: hayProblemasIntegridad deberia devolver true para un reporte con problemas.');
  }
  Logger.log('PASO 259 OK: hayProblemasIntegridad distingue un reporte limpio de uno con problemas.');
}

function ejecutarSuitePaso256a259() {
  pruebaPaso256_DetectarIdsDuplicados();
  pruebaPaso257_DetectarReferenciasHuerfanas();
  pruebaPaso258_ReporteIntegridadAgregaAmbosTipos();
  pruebaPaso259_HayProblemasIntegridad();
  Logger.log('SUITE PASO 256-259 (INTEGRIDAD Y MANTENIMIENTO) COMPLETADA CON EXITO');
}
function construirCadenaCompletaPrueba_(sufijo) {
  var base = construirCadenaTareaPrueba_(sufijo);
  var ss = base.ss;

  var persona = insertarRegistroTransaccional('PERSONA_EQUIPO', {
    TIPO: 'Persona', NOMBRE: 'Persona prueba ' + sufijo, ROL: 'Operario',
    CAPACIDAD_SEMANAL_DIAS: 5, DISPONIBILIDAD: 'Completa', ESTADO: 'Disponible'
  }, {dryRun: false});

  var tareaResponsable = insertarRegistroTransaccional('TAREA_RESPONSABLE', {
    TAREA_ID: base.tareaId, PERSONA_EQUIPO_ID: persona.id, ROL_ASIGNADO: 'Responsable',
    FECHA_INICIO_ASIGNACION: new Date(), PORCENTAJE_DEDICACION: 100, ESTADO: 'Planificada'
  }, {dryRun: false});

  var material = insertarRegistroTransaccional('MATERIAL', {
    CODIGO: 'MAT-' + sufijo, NOMBRE: 'Material prueba ' + sufijo, CATEGORIA: 'Otro',
    UNIDAD: 'Unidad', STOCK_ACTUAL: 100, STOCK_MINIMO: 10, ESTADO: 'Disponible'
  }, {dryRun: false});

  var productoMaterial = insertarRegistroTransaccional('PRODUCTO_MATERIAL', {
    PRODUCTO_ID: base.productoId, MATERIAL_ID: material.id, CANTIDAD_PREVISTA: 10,
    UNIDAD: 'Unidad', ESTADO: 'Planificada'
  }, {dryRun: false});

  var tareaMaterial = insertarRegistroTransaccional('TAREA_MATERIAL', {
    TAREA_ID: base.tareaId, MATERIAL_ID: material.id, CANTIDAD_PREVISTA: 5,
    UNIDAD: 'Unidad', ESTADO: 'Planificada'
  }, {dryRun: false});

  var decision = insertarRegistroTransaccional('DECISION', {
    PROYECTO_ID: base.proyectoId, TITULO: 'Decision prueba ' + sufijo, CONTEXTO: 'Contexto de prueba',
    TIPO: 'Técnica', ESTADO: 'Pendiente de información', IMPACTO: 'Medio'
  }, {dryRun: false});

  return {
    ss: ss,
    campanaId: base.campanaId,
    proyectoId: base.proyectoId,
    productoId: base.productoId,
    proyectoProductoId: base.proyectoProductoId,
    procesoId: base.procesoId,
    tareaId: base.tareaId,
    personaId: persona.id,
    tareaResponsableId: tareaResponsable.id,
    materialId: material.id,
    productoMaterialId: productoMaterial.id,
    tareaMaterialId: tareaMaterial.id,
    decisionId: decision.id
  };
}

function limpiarCadenaCompletaPrueba_(cadena) {
  var ss = cadena.ss;
  eliminarRegistroPruebaPorId_(ss.getSheetByName('12_DECISIONES'), cadena.decisionId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('10_TAREA_MATERIAL'), cadena.tareaMaterialId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('09_PRODUCTO_MATERIAL'), cadena.productoMaterialId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('08_MATERIALES'), cadena.materialId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('07_TAREA_RESPONSABLE'), cadena.tareaResponsableId);
  eliminarRegistroPruebaPorId_(ss.getSheetByName('11_PERSONAS_EQUIPOS'), cadena.personaId);
  limpiarCadenaTareaPrueba_(cadena);
}

function pruebaPaso260_CicloCompletoCreacion() {
  var cadena = construirCadenaCompletaPrueba_('P260');
  if (!cadena.campanaId || !cadena.proyectoId || !cadena.productoId || !cadena.procesoId ||
    !cadena.tareaId || !cadena.personaId || !cadena.tareaResponsableId || !cadena.materialId ||
    !cadena.productoMaterialId || !cadena.tareaMaterialId || !cadena.decisionId) {
    limpiarCadenaCompletaPrueba_(cadena);
    throw new Error('PASO 260: la cadena completa no genero todos los IDs esperados -> ' + JSON.stringify(cadena));
  }
  Logger.log('PASO 260 OK: se crea de punta a punta una cadena de las 12 entidades operativas del MVP.');
  limpiarCadenaCompletaPrueba_(cadena);
  return cadena;
}

function pruebaPaso261_ActualizarYTrazabilidad() {
  var cadena = construirCadenaCompletaPrueba_('P261');
  actualizarRegistroTransaccional('TAREA', cadena.tareaId, {PORCENTAJE_AVANCE: 50, ESTADO: 'En proceso', FECHA_INICIO_REAL: new Date()});

  var historial = listarHistorialDeRegistro('TAREA', cadena.tareaId);
  if (!historial || historial.length === 0) {
    limpiarCadenaCompletaPrueba_(cadena);
    throw new Error('PASO 261: la actualizacion de la tarea no genero historial.');
  }
  var registroActualizado = obtenerRegistroPorId('TAREA', cadena.tareaId);
  if (registroActualizado.ESTADO !== 'En proceso') {
    limpiarCadenaCompletaPrueba_(cadena);
    throw new Error('PASO 261: el estado de la tarea no reflejo la actualizacion.');
  }
  limpiarCadenaCompletaPrueba_(cadena);
  Logger.log('PASO 261 OK: actualizarRegistroTransaccional persiste cambios y HistorialService registra la trazabilidad.');
}

function pruebaPaso262_ConsultasPanelInformesCatalogos() {
  var cadena = construirCadenaCompletaPrueba_('P262');
  var panel = obtenerPanelOperativo();
  if (!panel || typeof panel !== 'object') {
    limpiarCadenaCompletaPrueba_(cadena);
    throw new Error('PASO 262: obtenerPanelOperativo no devolvio un objeto valido.');
  }
  var opciones = listarOpcionesActivas('ESTADO_TAREA');
  if (!opciones || opciones.length === 0) {
    limpiarCadenaCompletaPrueba_(cadena);
    throw new Error('PASO 262: listarOpcionesActivas no devolvio opciones para CFG_ESTADO_TAREA.');
  }
  limpiarCadenaCompletaPrueba_(cadena);
  Logger.log('PASO 262 OK: panel operativo y catalogos de configuracion responden con la cadena de prueba activa.');
}

function pruebaPaso263_IntegridadYBajaReactivacion() {
  var cadena = construirCadenaCompletaPrueba_('P263');

  var reporteAntes = obtenerReporteIntegridad();
  if (hayProblemasIntegridad(reporteAntes)) {
    var huerfanasPropias = (reporteAntes.referenciasHuerfanas.TAREA || []).some(function (h) { return h.registroId === cadena.tareaId; });
    if (huerfanasPropias) {
      limpiarCadenaCompletaPrueba_(cadena);
      throw new Error('PASO 263: la cadena recien creada no deberia generar referencias huerfanas propias.');
    }
  }

  desactivarRegistro('TAREA_RESPONSABLE', cadena.tareaResponsableId);
  desactivarRegistro('TAREA_MATERIAL', cadena.tareaMaterialId);
  desactivarRegistro('TAREA', cadena.tareaId);
  var tareaInactiva = obtenerRegistroPorId('TAREA', cadena.tareaId);
  if (tareaInactiva.ACTIVO !== 'NO') {
    limpiarCadenaCompletaPrueba_(cadena);
    throw new Error('PASO 263: desactivarRegistro no marco la tarea como inactiva.');
  }

  reactivarRegistro('TAREA', cadena.tareaId);
  var tareaReactivada = obtenerRegistroPorId('TAREA', cadena.tareaId);
  if (tareaReactivada.ACTIVO !== 'SÍ') {
    limpiarCadenaCompletaPrueba_(cadena);
    throw new Error('PASO 263: reactivarRegistro no devolvio la tarea a activa.');
  }

  limpiarCadenaCompletaPrueba_(cadena);
  Logger.log('PASO 263 OK: baja logica, reactivacion e integridad conviven correctamente sobre la cadena completa.');
}

function pruebaPaso264_LimpiezaTotalVerificada() {
  var cadena = construirCadenaCompletaPrueba_('P264');
  limpiarCadenaCompletaPrueba_(cadena);

  var entidadesCadena = ['CAMPANA', 'PROYECTO', 'PROYECTO_PRODUCTO', 'PRODUCTO', 'PROCESO', 'TAREA',
    'PERSONA_EQUIPO', 'TAREA_RESPONSABLE', 'MATERIAL', 'PRODUCTO_MATERIAL', 'TAREA_MATERIAL', 'DECISION'];
  var idsCadena = [cadena.campanaId, cadena.proyectoId, cadena.proyectoProductoId, cadena.productoId,
    cadena.procesoId, cadena.tareaId, cadena.personaId, cadena.tareaResponsableId, cadena.materialId,
    cadena.productoMaterialId, cadena.tareaMaterialId, cadena.decisionId];

  for (var i = 0; i < entidadesCadena.length; i++) {
    var registro = obtenerRegistroPorId(entidadesCadena[i], idsCadena[i]);
    if (registro !== null) {
      throw new Error('PASO 264: quedo un residuo de la entidad ' + entidadesCadena[i] + ' (' + idsCadena[i] + ') tras la limpieza total.');
    }
  }
  Logger.log('PASO 264 OK: limpiarCadenaCompletaPrueba_ elimina sin residuos las 12 entidades de la cadena de prueba.');
}

function ejecutarSuitePaso260a264() {
  pruebaPaso260_CicloCompletoCreacion();
  pruebaPaso261_ActualizarYTrazabilidad();
  pruebaPaso262_ConsultasPanelInformesCatalogos();
  pruebaPaso263_IntegridadYBajaReactivacion();
  pruebaPaso264_LimpiezaTotalVerificada();
  Logger.log('SUITE PASO 260-264 (PRUEBA INTEGRAL END-TO-END DEL MVP) COMPLETADA CON EXITO');
}

function pruebaPaso265_ProcesoCoherenciaFechasReales() {
  var cadena = construirCadenaTareaPrueba_('P265');
  try {
    var fallo = false;
    try {
      actualizarRegistroTransaccional('PROCESO', cadena.procesoId, {FECHA_INICIO_REAL: new Date()});
      fallo = true;
    } catch (e1) {
      if (String(e1).indexOf('ERROR_INSERCION_PROCESO') === -1) throw e1;
    }
    if (fallo) throw new Error('PASO 265: se permitio FECHA_INICIO_REAL en un proceso Pendiente.');

    actualizarRegistroTransaccional('PROCESO', cadena.procesoId, {ESTADO: 'En proceso', FECHA_INICIO_REAL: new Date()});

    var fallo2 = false;
    try {
      actualizarRegistroTransaccional('PROCESO', cadena.procesoId, {ESTADO: 'Completado'});
      fallo2 = true;
    } catch (e2) {
      if (String(e2).indexOf('ERROR_INSERCION_PROCESO') === -1) throw e2;
    }
    if (fallo2) throw new Error('PASO 265: se permitio completar un proceso sin FECHA_FIN_REAL ni DURACION_REAL_DIAS.');

    actualizarRegistroTransaccional('PROCESO', cadena.procesoId, {
      ESTADO: 'Completado', FECHA_FIN_REAL: new Date(), DURACION_REAL_DIAS: 1
    });
    var procesoFinal = obtenerRegistroPorId('PROCESO', cadena.procesoId);
    if (procesoFinal.ESTADO !== 'Completado') {
      throw new Error('PASO 265: el proceso no quedo Completado tras aportar las fechas reales.');
    }
    Logger.log('PASO 265 OK: PROCESO exige fechas/duracion reales coherentes con su ESTADO en cada transicion.');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
  }
}

function pruebaPaso266_ProyectoCoherenciaFechasReales() {
  var cadena = construirCadenaTareaPrueba_('P266');
  try {
    var fallo = false;
    try {
      actualizarRegistroTransaccional('PROYECTO', cadena.proyectoId, {FECHA_INICIO_REAL: new Date()});
      fallo = true;
    } catch (e1) {
      if (String(e1).indexOf('ERROR_INSERCION_PROYECTO') === -1) throw e1;
    }
    if (fallo) throw new Error('PASO 266: se permitio FECHA_INICIO_REAL en un proyecto Borrador.');

    actualizarRegistroTransaccional('PROYECTO', cadena.proyectoId, {ESTADO: 'En proceso', FECHA_INICIO_REAL: new Date()});

    var fallo2 = false;
    try {
      actualizarRegistroTransaccional('PROYECTO', cadena.proyectoId, {ESTADO: 'Completado'});
      fallo2 = true;
    } catch (e2) {
      if (String(e2).indexOf('ERROR_INSERCION_PROYECTO') === -1) throw e2;
    }
    if (fallo2) throw new Error('PASO 266: se permitio completar un proyecto sin FECHA_FIN_REAL.');

    actualizarRegistroTransaccional('PROYECTO', cadena.proyectoId, {ESTADO: 'Completado', FECHA_FIN_REAL: new Date()});
    var proyectoFinal = obtenerRegistroPorId('PROYECTO', cadena.proyectoId);
    if (proyectoFinal.ESTADO !== 'Completado') {
      throw new Error('PASO 266: el proyecto no quedo Completado tras aportar la fecha real de fin.');
    }
    Logger.log('PASO 266 OK: PROYECTO exige fechas reales coherentes con su ESTADO en cada transicion (sin exigir duracion).');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
  }
}

function ejecutarSuitePaso265a266() {
  pruebaPaso265_ProcesoCoherenciaFechasReales();
  pruebaPaso266_ProyectoCoherenciaFechasReales();
  Logger.log('SUITE PASO 265-266 (COHERENCIA FECHAS REALES PROCESO/PROYECTO) COMPLETADA CON EXITO');
}

function pruebaPaso267_ListarTareasPospuestas() {
  var cadena = construirCadenaTareaPrueba_('P267');
  try {
    actualizarRegistroTransaccional('TAREA', cadena.tareaId, {ESTADO: 'Pospuesta', MOTIVO_POSPOSICION: 'Prueba PASO 267'});
    var pospuestas = listarTareasPospuestas();
    var encontrada = pospuestas.some(function (t) { return t.ID === cadena.tareaId; });
    if (!encontrada) {
      throw new Error('PASO 267: listarTareasPospuestas no incluyo la tarea pospuesta de prueba.');
    }
    Logger.log('PASO 267 OK: listarTareasPospuestas devuelve las tareas en estado Pospuesta con su motivo.');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
  }
}

function ejecutarSuitePaso267() {
  pruebaPaso267_ListarTareasPospuestas();
  Logger.log('SUITE PASO 267 (TAREAS POSPUESTAS) COMPLETADA CON EXITO');
}
function limpiarResiduosPruebaPorTexto_(texto) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojas = ['01_CAMPANAS','02_PROYECTOS','03_PRODUCTOS','04_PROYECTO_PRODUCTO','05_PROCESOS','06_TAREAS',
    '07_TAREA_RESPONSABLE','08_MATERIALES','09_PRODUCTO_MATERIAL','10_TAREA_MATERIAL','11_PERSONAS_EQUIPOS','12_DECISIONES',
    '13_INCIDENCIAS','14_DOCUMENTOS','15_PROVEEDORES'];
  var eliminadas = {};
  hojas.forEach(function (nombreHoja) {
    var hoja = ss.getSheetByName(nombreHoja);
    if (!hoja) return;
    var valores = hoja.getDataRange().getValues();
    var filasAEliminar = [];
    for (var i = 1; i < valores.length; i++) {
      var filaTexto = valores[i].join(' | ');
      if (filaTexto.indexOf(texto) !== -1) {
        filasAEliminar.push(i + 1);
      }
    }
    for (var j = filasAEliminar.length - 1; j >= 0; j--) {
      hoja.deleteRow(filasAEliminar[j]);
    }
    if (filasAEliminar.length > 0) eliminadas[nombreHoja] = filasAEliminar.length;
  });
  Logger.log('Limpieza de residuos "' + texto + '": ' + JSON.stringify(eliminadas));
}

function limpiarResiduosP260() {
  limpiarResiduosPruebaPorTexto_('P260');
}
function limpiarHuerfanasGlobal() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var mapaHojas = {
    PROYECTO_PRODUCTO: '04_PROYECTO_PRODUCTO', TAREA_RESPONSABLE: '07_TAREA_RESPONSABLE',
    PRODUCTO_MATERIAL: '09_PRODUCTO_MATERIAL', TAREA_MATERIAL: '10_TAREA_MATERIAL', DECISION: '12_DECISIONES'
  };
  var resumen = {};
  Object.keys(mapaHojas).forEach(function (entidad) {
    var huerfanas = detectarReferenciasHuerfanas(entidad);
    if (huerfanas.length === 0) return;
    var hoja = ss.getSheetByName(mapaHojas[entidad]);
    huerfanas.forEach(function (h) {
      eliminarRegistroPruebaPorId_(hoja, h.registroId);
    });
    resumen[entidad] = huerfanas.length;
  });
  Logger.log('Limpieza de huerfanas globales: ' + JSON.stringify(resumen));
}
function debugCatalogoDecision() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var rango = libro.getRangeByName('CFG_TIPO_DECISION');
  if (!rango) { Logger.log('NO EXISTE el rango CFG_TIPO_DECISION'); return; }
  Logger.log(JSON.stringify(rango.getDisplayValues()));
}
function debugCatalogoDecisionEstado() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var rango = libro.getRangeByName('CFG_ESTADO_DECISION');
  if (!rango) { Logger.log('NO EXISTE el rango CFG_ESTADO_DECISION'); return; }
  Logger.log(JSON.stringify(rango.getDisplayValues()));
}
function debugContenidoEstadoTarea() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var rango = libro.getRangeByName('CFG_ESTADO_TAREA');
  if (!rango) { Logger.log('NO EXISTE'); return; }
  Logger.log('valores=' + JSON.stringify(rango.getDisplayValues()));
  Logger.log('opciones=' + JSON.stringify(typeof listarOpcionesActivas === 'function' ? listarOpcionesActivas('ESTADO_TAREA') : 'FUNC_NO_EXISTE'));
}

function limpiarResiduosP263() { limpiarResiduosPruebaPorTexto_('P263'); }

function debugCatalogoEstadoTarea() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var nombres = libro.getNamedRanges().map(function(nr){ return nr.getName(); }).filter(function(n){ return n.indexOf('TAREA') !== -1 || n.indexOf('ESTADO') !== -1; });
  Logger.log(JSON.stringify(nombres));
}

function debugCatalogoImpacto() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var rango = libro.getRangeByName('CFG_IMPACTO');
  if (!rango) { Logger.log('NO EXISTE el rango CFG_IMPACTO'); return; }
  Logger.log(JSON.stringify(rango.getDisplayValues()));
}
/* ===================== FASE 2-6: reconstrucción tras regresión (PASO 272-290) ===================== */

function pruebaPaso272_GuardarFormularioProyectoCompleto() {
  Logger.log('=== PASO 272: guardarFormulario crea PROYECTO con esquema completo ===');
  var cadena = construirCadenaTareaPrueba_('P272');
  try {
    var datos = {
      CAMPANA_ID: cadena.campanaId,
      NOMBRE: 'Proyecto formulario P272',
      TIPO_PROYECTO: 'Propuesta',
      PRIORIDAD: 'Media',
      FECHA_INICIO_PLAN: '2026-01-01',
      FECHA_FIN_PLAN: '2026-02-01',
      ESTADO: 'Borrador'
    };
    guardarFormulario("PROYECTO", null, datos);
    var creados = listarRegistros('PROYECTO', { ACTIVO: 'SÍ' }).filter(function (r) { return r.NOMBRE === 'Proyecto formulario P272'; });
    if (creados.length !== 1) throw new Error("PASO 272: no se creó el proyecto vía guardarFormulario.");
    Logger.log('PASO 272 OK');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
    limpiarResiduosPruebaPorTexto_('P272');
  }
}

function pruebaPaso273_EsquemaPrecargaValorActualEnEdicion() {
  Logger.log('=== PASO 273: obtenerEsquemaFormulario precarga valorActual en modo edición ===');
  var cadena = construirCadenaTareaPrueba_('P273');
  try {
    var esquema = obtenerEsquemaFormulario('TAREA', cadena.tareaId);
    var campoNombre = esquema.filter(function (c) { return c.campo === 'NOMBRE'; })[0];
    if (!campoNombre || campoNombre.valorActual !== 'Tarea prueba P273') {
      throw new Error('PASO 273: el esquema no precargó el valor actual del campo NOMBRE.');
    }
    Logger.log('PASO 273 OK');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
  }
}

function pruebaPaso274_DuplicidadProyectoProducto() {
  Logger.log('=== PASO 274: validarDuplicidadFormulario_ rechaza PROYECTO_PRODUCTO duplicado ===');
  var cadena = construirCadenaTareaPrueba_('P274');
  try {
    var errorCapturado = null;
    try {
      guardarFormulario("PROYECTO_PRODUCTO", null, {
        PROYECTO_ID: cadena.proyectoId,
        PRODUCTO_ID: cadena.productoId,
        CANTIDAD_ASIGNADA: 2,
        PRIORIDAD: 'Media',
        ESTADO: 'Planificada'
      });
    } catch (e) { errorCapturado = String(e); }
    if (!errorCapturado || errorCapturado.indexOf('misma combinación') === -1) {
      throw new Error('PASO 274: no se rechazó la combinación PROYECTO_ID/PRODUCTO_ID duplicada. ' + errorCapturado);
    }
    Logger.log('PASO 274 OK');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
  }
}

function pruebaPaso275_TraduccionErrorFuncional() {
  Logger.log('=== PASO 275: guardarFormulario traduce error de campos obligatorios ===');
  var errorCapturado = null;
  try {
    guardarFormulario('PRODUCTO', null, { NOMBRE: 'Producto sin código P275' });
  } catch (e) { errorCapturado = String(e); }
  limpiarResiduosPruebaPorTexto_('P275');
  if (!errorCapturado || errorCapturado.indexOf('ERROR_') !== -1) {
    throw new Error('PASO 275: el error debía traducirse sin exponer prefijos ERROR_. ' + errorCapturado);
  }
  if (errorCapturado.indexOf('obligatorios') === -1) {
    throw new Error('PASO 275: el mensaje traducido no menciona campos obligatorios. ' + errorCapturado);
  }
  Logger.log('PASO 275 OK');
}

function pruebaPaso276_DocumentoFkDependiente() {
  Logger.log('=== PASO 276: esquema DOCUMENTO expone fk_dependiente y resuelve opciones ===');
  var cadena = construirCadenaTareaPrueba_('P276');
  try {
    var esquema = obtenerEsquemaFormulario('DOCUMENTO', null);
    var campoEntidad = esquema.filter(function (c) { return c.campo === 'ENTIDAD_ID'; })[0];
    if (!campoEntidad || campoEntidad.tipo !== 'fk_dependiente') {
      throw new Error('PASO 276: ENTIDAD_ID no está declarado como fk_dependiente.');
    }
    var opciones = obtenerOpcionesDependientes(campoEntidad.mapaEntidad, 'PROYECTO');
    var incluyeProyecto = opciones.some(function (o) { return o.id === cadena.proyectoId; });
    if (!incluyeProyecto) throw new Error('PASO 276: las opciones dependientes no incluyen el proyecto de prueba.');
    Logger.log('PASO 276 OK');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
  }
}

function ejecutarSuitePaso272a276() {
  try { pruebaPaso272_GuardarFormularioProyectoCompleto(); } finally { limpiarResiduosPruebaPorTexto_('P272'); }
  try { pruebaPaso273_EsquemaPrecargaValorActualEnEdicion(); } finally { limpiarResiduosPruebaPorTexto_('P273'); }
  try { pruebaPaso274_DuplicidadProyectoProducto(); } finally { limpiarResiduosPruebaPorTexto_('P274'); }
  try { pruebaPaso275_TraduccionErrorFuncional(); } finally { limpiarResiduosPruebaPorTexto_('P275'); }
  try { pruebaPaso276_DocumentoFkDependiente(); } finally { limpiarResiduosPruebaPorTexto_('P276'); }
  Logger.log('SUITE PASO 272-276 (FASE 2 -- FORMULARIOS Y SELECTORES) COMPLETADA CON EXITO');
}

function pruebaPaso277_EsquemaTareaVisibleSi() {
  Logger.log('=== PASO 277: esquema TAREA declara visibleSi en campos condicionales ===');
  var esquema = obtenerEsquemaFormulario('TAREA', null);
  var motivoBloqueo = esquema.filter(function (c) { return c.campo === 'MOTIVO_BLOQUEO'; })[0];
  if (!motivoBloqueo || !motivoBloqueo.visibleSi || motivoBloqueo.visibleSi.valores.indexOf('Bloqueada') === -1) {
    throw new Error('PASO 277: MOTIVO_BLOQUEO no tiene visibleSi correcto.');
  }
  Logger.log('PASO 277 OK');
}

function pruebaPaso278_TareaBloqueadaExigeMotivo() {
  Logger.log('=== PASO 278: guardarFormulario TAREA bloqueada exige motivo de bloqueo ===');
  var cadena = construirCadenaTareaPrueba_('P278');
  try {
    var errorCapturado = null;
    try {
      guardarFormulario('TAREA', cadena.tareaId, {
        PROCESO_ID: cadena.procesoId,
        NOMBRE: 'Tarea prueba P278',
        ORDEN_SECUENCIA: 1,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO: 'Bloqueada'
      });
    } catch (e) { errorCapturado = String(e); }
    if (!errorCapturado || errorCapturado.indexOf('motivo de bloqueo') === -1) {
      throw new Error('PASO 278: no se exigió el motivo de bloqueo. ' + errorCapturado);
    }
    guardarFormulario('TAREA', cadena.tareaId, {
      PROCESO_ID: cadena.procesoId,
      NOMBRE: 'Tarea prueba P278',
      ORDEN_SECUENCIA: 1,
      DURACION_PREVISTA_DIAS: 1,
      ESTADO: 'Bloqueada',
      MOTIVO_BLOQUEO: 'Esperando material'
    });
    var actualizada = obtenerRegistroPorId('TAREA', cadena.tareaId);
    if (actualizada.ESTADO !== 'Bloqueada') throw new Error('PASO 278: la tarea no quedó bloqueada tras indicar el motivo.');
    Logger.log('PASO 278 OK');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
  }
}

function pruebaPaso279_TareaCanceladaExigeFechaFinReal() {
  Logger.log('=== PASO 279: TAREA cancelada exige FECHA_FIN_REAL ===');
  var cadena = construirCadenaTareaPrueba_('P279');
  try {
    var errorCapturado = null;
    try {
      guardarFormulario('TAREA', cadena.tareaId, {
        PROCESO_ID: cadena.procesoId,
        NOMBRE: 'Tarea prueba P279',
        ORDEN_SECUENCIA: 1,
        DURACION_PREVISTA_DIAS: 1,
        ESTADO: 'Cancelada',
        MOTIVO_CANCELACION: 'Ya no es necesaria'
      });
    } catch (e) { errorCapturado = String(e); }
    if (!errorCapturado || errorCapturado.indexOf('fecha fin real') === -1) {
      throw new Error('PASO 279: no se exigió la fecha fin real al cancelar. ' + errorCapturado);
    }
    Logger.log('PASO 279 OK');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
  }
}

function pruebaPaso280_TareaTerminadaCicloCompleto() {
  Logger.log('=== PASO 280: TAREA se puede terminar aportando fecha fin real (camino feliz) ===');
  var cadena = construirCadenaTareaPrueba_('P280');
  try {
    guardarFormulario('TAREA', cadena.tareaId, {
      PROCESO_ID: cadena.procesoId,
      NOMBRE: 'Tarea prueba P280',
      ORDEN_SECUENCIA: 1,
      DURACION_PREVISTA_DIAS: 1,
      ESTADO: 'Terminada',
      FECHA_INICIO_REAL: '2026-01-10',
      FECHA_FIN_REAL: '2026-01-15',
      DURACION_REAL_DIAS: 5
    });
    var actualizada = obtenerRegistroPorId('TAREA', cadena.tareaId);
    if (actualizada.ESTADO !== 'Terminada') throw new Error('PASO 280: la tarea no quedó Terminada.');
    Logger.log('PASO 280 OK');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
  }
}

function ejecutarSuitePaso277a280() {
  try { pruebaPaso277_EsquemaTareaVisibleSi(); } finally {  }
  try { pruebaPaso278_TareaBloqueadaExigeMotivo(); } finally { limpiarResiduosPruebaPorTexto_('P278'); }
  try { pruebaPaso279_TareaCanceladaExigeFechaFinReal(); } finally { limpiarResiduosPruebaPorTexto_('P279'); }
  try { pruebaPaso280_TareaTerminadaCicloCompleto(); } finally { limpiarResiduosPruebaPorTexto_('P280'); }
  Logger.log('SUITE PASO 277-280 (FASE 3 -- VISIBILIDAD CONDICIONAL Y REGLAS TAREA) COMPLETADA CON EXITO');
}

function crearPersonaPrueba_(sufijo, dedicacionDias) {
  return insertarRegistroTransaccional('PERSONA_EQUIPO', {
    TIPO: 'Persona',
    NOMBRE: 'Persona prueba ' + sufijo,
    ROL: 'Operario',
    CAPACIDAD_SEMANAL_DIAS: dedicacionDias || 5,
    DISPONIBILIDAD: 'Completa',
    ESTADO: 'Disponible'
  }, {dryRun: false});
}

function pruebaPaso281_DuplicidadTareaResponsable() {
  Logger.log('=== PASO 281: CLAVES_DUPLICADO_MVP rechaza TAREA_RESPONSABLE duplicada ===');
  var cadena = construirCadenaTareaPrueba_('P281');
  var persona = crearPersonaPrueba_('P281', 5);
  try {
    guardarFormulario('TAREA_RESPONSABLE', null, {
      TAREA_ID: cadena.tareaId,
      PERSONA_EQUIPO_ID: persona.id,
      ROL_ASIGNADO: 'Responsable',
      PORCENTAJE_DEDICACION: 40,
      ESTADO: 'Activa'
    });
    var errorCapturado = null;
    try {
      guardarFormulario('TAREA_RESPONSABLE', null, {
        TAREA_ID: cadena.tareaId,
        PERSONA_EQUIPO_ID: persona.id,
        ROL_ASIGNADO: 'Revisor',
        PORCENTAJE_DEDICACION: 20,
        ESTADO: 'Activa'
      });
    } catch (e) { errorCapturado = String(e); }
    if (!errorCapturado || errorCapturado.indexOf('misma combinación') === -1) {
      throw new Error('PASO 281: no se rechazó la asignación duplicada TAREA_ID/PERSONA_EQUIPO_ID. ' + errorCapturado);
    }
    Logger.log('PASO 281 OK');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
    limpiarResiduosPruebaPorTexto_('P281');
  }
}

function pruebaPaso282_SobreasignacionRechazada() {
  Logger.log('=== PASO 282: se rechaza sobreasignación de dedicación > 100% ===');
  var cadenaA = construirCadenaTareaPrueba_('P282A');
  var cadenaB = construirCadenaTareaPrueba_('P282B');
  var persona = crearPersonaPrueba_('P282', 5);
  try {
    guardarFormulario('TAREA_RESPONSABLE', null, {
      TAREA_ID: cadenaA.tareaId,
      PERSONA_EQUIPO_ID: persona.id,
      ROL_ASIGNADO: 'Responsable',
      PORCENTAJE_DEDICACION: 70,
      ESTADO: 'Activa'
    });
    var errorCapturado = null;
    try {
      guardarFormulario('TAREA_RESPONSABLE', null, {
        TAREA_ID: cadenaB.tareaId,
        PERSONA_EQUIPO_ID: persona.id,
        ROL_ASIGNADO: 'Responsable',
        PORCENTAJE_DEDICACION: 50,
        ESTADO: 'Activa'
      });
    } catch (e) { errorCapturado = String(e); }
    if (!errorCapturado || errorCapturado.indexOf('superaría el 100%') === -1) {
      throw new Error('PASO 282: no se rechazó la sobreasignación. ' + errorCapturado);
    }
    Logger.log('PASO 282 OK');
  } finally {
    limpiarCadenaTareaPrueba_(cadenaA);
    limpiarCadenaTareaPrueba_(cadenaB);
    limpiarResiduosPruebaPorTexto_('P282');
  }
}

function pruebaPaso283_TareasSinResponsable() {
  Logger.log('=== PASO 283: listarTareasSinResponsable refleja asignación ===');
  var cadena = construirCadenaTareaPrueba_('P283');
  var persona = crearPersonaPrueba_('P283', 5);
  try {
    var antes = listarTareasSinResponsable().some(function (t) { return t.ID === cadena.tareaId; });
    if (!antes) throw new Error('PASO 283: la tarea recién creada debería aparecer sin responsable.');
    guardarFormulario('TAREA_RESPONSABLE', null, {
      TAREA_ID: cadena.tareaId,
      PERSONA_EQUIPO_ID: persona.id,
      ROL_ASIGNADO: 'Responsable',
      PORCENTAJE_DEDICACION: 30,
      ESTADO: 'Activa'
    });
    var despues = listarTareasSinResponsable().some(function (t) { return t.ID === cadena.tareaId; });
    if (despues) throw new Error('PASO 283: la tarea sigue apareciendo sin responsable tras asignar.');
    Logger.log('PASO 283 OK');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
    limpiarResiduosPruebaPorTexto_('P283');
  }
}

function pruebaPaso284_CapacidadRecursosRefleyaDedicacion() {
  Logger.log('=== PASO 284: listarCapacidadRecursos refleja la dedicación total ===');
  var cadena = construirCadenaTareaPrueba_('P284');
  var persona = crearPersonaPrueba_('P284', 5);
  try {
    guardarFormulario('TAREA_RESPONSABLE', null, {
      TAREA_ID: cadena.tareaId,
      PERSONA_EQUIPO_ID: persona.id,
      ROL_ASIGNADO: 'Responsable',
      PORCENTAJE_DEDICACION: 65,
      ESTADO: 'Activa'
    });
    var fila = listarCapacidadRecursos().filter(function (r) { return r.NOMBRE === 'Persona prueba P284'; })[0];
    if (!fila || fila.DEDICACION_TOTAL_PORCENTAJE !== 65) {
      throw new Error('PASO 284: la dedicación total no coincide con lo asignado. ' + JSON.stringify(fila));
    }
    Logger.log('PASO 284 OK');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
    limpiarResiduosPruebaPorTexto_('P284');
  }
}

function ejecutarSuitePaso281a284() {
  try { pruebaPaso281_DuplicidadTareaResponsable(); } finally { limpiarResiduosPruebaPorTexto_('P281'); }
  try { pruebaPaso282_SobreasignacionRechazada(); } finally { limpiarResiduosPruebaPorTexto_('P282A'); limpiarResiduosPruebaPorTexto_('P282B'); limpiarResiduosPruebaPorTexto_('P282'); }
  try { pruebaPaso283_TareasSinResponsable(); } finally { limpiarResiduosPruebaPorTexto_('P283'); }
  try { pruebaPaso284_CapacidadRecursosRefleyaDedicacion(); } finally { limpiarResiduosPruebaPorTexto_('P284'); }
  Logger.log('SUITE PASO 281-284 (FASE 4 -- RECURSOS) COMPLETADA CON EXITO');
}

function pruebaPaso285_GuardarFormularioProveedor() {
  Logger.log('=== PASO 285: guardarFormulario crea PROVEEDOR ===');
  try {
    guardarFormulario('PROVEEDOR', null, {
      CODIGO: 'PRV-P285',
      NOMBRE: 'Proveedor prueba P285',
      ESTADO: 'Activo'
    });
    var creado = listarRegistros('PROVEEDOR', { ACTIVO: 'SÍ' }).filter(function (r) { return r.CODIGO === 'PRV-P285'; })[0];
    if (!creado) throw new Error('PASO 285: no se creó el proveedor vía guardarFormulario.');
    if (ENTIDADES_MVP.PROVEEDOR.hoja !== '15_PROVEEDORES') throw new Error('PASO 285: ENTIDADES_MVP.PROVEEDOR mal configurado.');
    Logger.log('PASO 285 OK');
  } finally {
    limpiarResiduosPruebaPorTexto_('P285');
  }
}

function pruebaPaso286_MaterialProveedorYStockNegativoRechazado() {
  Logger.log('=== PASO 286: MATERIAL con PROVEEDOR_ID y stock negativo rechazado ===');
  var proveedor = insertarRegistroTransaccional('PROVEEDOR', {
    CODIGO: 'PRV-P286', NOMBRE: 'Proveedor prueba P286', ESTADO: 'Activo'
  }, {dryRun: false});
  try {
    guardarFormulario('MATERIAL', null, {
      CODIGO: 'MAT-P286',
      NOMBRE: 'Material prueba P286',
      CATEGORIA: 'Madera',
      UNIDAD: 'Unidad',
      STOCK_ACTUAL: 10,
      STOCK_MINIMO: 2,
      PROVEEDOR_ID: proveedor.id,
      ESTADO: 'Disponible'
    });
    var creado = listarRegistros('MATERIAL', { ACTIVO: 'SÍ' }).filter(function (r) { return r.CODIGO === 'MAT-P286'; })[0];
    if (!creado || creado.PROVEEDOR_ID !== proveedor.id) throw new Error('PASO 286: el material no quedó asociado al proveedor.');
    var errorCapturado = null;
    try {
      guardarFormulario('MATERIAL', null, {
        CODIGO: 'MAT-P286B',
        NOMBRE: 'Material prueba P286B',
        CATEGORIA: 'Madera',
        UNIDAD: 'Unidad',
        STOCK_ACTUAL: -5,
        STOCK_MINIMO: 2,
        ESTADO: 'Disponible'
      });
    } catch (e) { errorCapturado = String(e); }
    if (!errorCapturado || errorCapturado.indexOf('no pueden ser negativos') === -1) {
      throw new Error('PASO 286: no se rechazó el stock negativo. ' + errorCapturado);
    }
    Logger.log('PASO 286 OK');
  } finally {
    limpiarResiduosPruebaPorTexto_('P286');
  }
}

function pruebaPaso287_AlertasStockMaterial() {
  Logger.log('=== PASO 287: listas de alertas de stock reflejan el material de prueba ===');
  try {
    insertarRegistroTransaccional('MATERIAL', {
      CODIGO: 'MAT-P287BAJO', NOMBRE: 'Material bajo P287', CATEGORIA: 'Madera',
      UNIDAD: 'Unidad', STOCK_ACTUAL: 1, STOCK_MINIMO: 5, ESTADO: 'Disponible'
    }, {dryRun: false});
    insertarRegistroTransaccional('MATERIAL', {
      CODIGO: 'MAT-P287AGOTADO', NOMBRE: 'Material agotado P287', CATEGORIA: 'Madera',
      UNIDAD: 'Unidad', STOCK_ACTUAL: 0, STOCK_MINIMO: 5, ESTADO: 'Disponible'
    }, {dryRun: false});
    var bajo = listarMaterialesStockBajo().some(function (m) { return m.CODIGO === 'MAT-P287BAJO'; });
    var agotado = listarMaterialesAgotados().some(function (m) { return m.CODIGO === 'MAT-P287AGOTADO'; });
    var critico = listarMaterialesCriticos().some(function (m) { return m.CODIGO === 'MAT-P287AGOTADO'; });
    if (!bajo) throw new Error('PASO 287: el material con stock bajo no aparece en listarMaterialesStockBajo.');
    if (!agotado) throw new Error('PASO 287: el material agotado no aparece en listarMaterialesAgotados.');
    if (!critico) throw new Error('PASO 287: el material agotado no aparece en listarMaterialesCriticos.');
    Logger.log('PASO 287 OK');
  } finally {
    limpiarResiduosPruebaPorTexto_('P287');
  }
}

function pruebaPaso288_ReservasSuperanStock() {
  Logger.log('=== PASO 288: listarReservasSuperanStock detecta reserva mayor que stock ===');
  try {
    insertarRegistroTransaccional('MATERIAL', {
      CODIGO: 'MAT-P288', NOMBRE: 'Material reservado P288', CATEGORIA: 'Madera',
      UNIDAD: 'Unidad', STOCK_ACTUAL: 5, STOCK_MINIMO: 1, CANTIDAD_RESERVADA: 8, ESTADO: 'Disponible'
    }, {dryRun: false});
    var detectado = listarReservasSuperanStock().some(function (m) { return m.CODIGO === 'MAT-P288'; });
    if (!detectado) throw new Error('PASO 288: no se detectó la reserva que supera el stock.');
    Logger.log('PASO 288 OK');
  } finally {
    limpiarResiduosPruebaPorTexto_('P288');
  }
}

function pruebaPaso289_TareaMaterialExigeMotivoDesviacion() {
  Logger.log('=== PASO 289: TAREA_MATERIAL exige motivo de desviación si el consumo supera lo previsto ===');
  var cadena = construirCadenaTareaPrueba_('P289');
  try {
    var material = insertarRegistroTransaccional('MATERIAL', {
      CODIGO: 'MAT-P289', NOMBRE: 'Material prueba P289', CATEGORIA: 'Madera',
      UNIDAD: 'Unidad', STOCK_ACTUAL: 20, STOCK_MINIMO: 1, ESTADO: 'Disponible'
    }, {dryRun: false});
    var errorCapturado = null;
    try {
      guardarFormulario('TAREA_MATERIAL', null, {
        TAREA_ID: cadena.tareaId,
        MATERIAL_ID: material.id,
        CANTIDAD_PREVISTA: 5,
        CANTIDAD_CONSUMIDA: 8,
        CANTIDAD_DESPERDICIADA: 0,
        UNIDAD: 'Unidad',
        ESTADO: 'Completada'
      });
    } catch (e) { errorCapturado = String(e); }
    if (!errorCapturado || errorCapturado.indexOf('motivo de desviación') === -1) {
      throw new Error('PASO 289: no se exigió el motivo de desviación. ' + errorCapturado);
    }
    guardarFormulario('TAREA_MATERIAL', null, {
      TAREA_ID: cadena.tareaId,
      MATERIAL_ID: material.id,
      CANTIDAD_PREVISTA: 5,
      CANTIDAD_CONSUMIDA: 8,
      CANTIDAD_DESPERDICIADA: 0,
      UNIDAD: 'Unidad',
      ESTADO: 'Completada',
      MOTIVO_DESVIACION: 'Se requirió más material del previsto'
    });
    Logger.log('PASO 289 OK');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
    limpiarResiduosPruebaPorTexto_('P289');
  }
}

function pruebaPaso290_PanelOperativoIntegraRecursosYMateriales() {
  Logger.log('=== PASO 290: obtenerPanelOperativo integra recursos y materiales sin errores ===');
  var panel = obtenerPanelOperativo();
  if (!panel.recursos || !panel.materiales) throw new Error('PASO 290: el panel no incluye recursos/materiales.');
  var clavesRecursos = ['noDisponibles', 'sobreasignaciones', 'tareasSinResponsable', 'capacidad'];
  clavesRecursos.forEach(function (k) { if (!(k in panel.recursos)) throw new Error('PASO 290: falta panel.recursos.' + k); });
  var clavesMateriales = ['stockBajo', 'agotados', 'reservasSuperanStock', 'necesidadesReposicion', 'criticos', 'consumoDesperdicio'];
  clavesMateriales.forEach(function (k) { if (!(k in panel.materiales)) throw new Error('PASO 290: falta panel.materiales.' + k); });
  Logger.log('PASO 290 OK');
}

function ejecutarSuitePaso285a290() {
  try { pruebaPaso285_GuardarFormularioProveedor(); } finally { limpiarResiduosPruebaPorTexto_('P285'); }
  try { pruebaPaso286_MaterialProveedorYStockNegativoRechazado(); } finally { limpiarResiduosPruebaPorTexto_('P286'); }
  try { pruebaPaso287_AlertasStockMaterial(); } finally { limpiarResiduosPruebaPorTexto_('P287'); }
  try { pruebaPaso288_ReservasSuperanStock(); } finally { limpiarResiduosPruebaPorTexto_('P288'); }
  try { pruebaPaso289_TareaMaterialExigeMotivoDesviacion(); } finally { limpiarResiduosPruebaPorTexto_('P289'); }
  try { pruebaPaso290_PanelOperativoIntegraRecursosYMateriales(); } finally {  }
  Logger.log('SUITE PASO 285-290 (FASE 5 -- MATERIALES Y PROVEEDOR) COMPLETADA CON EXITO');
}

function ejecutarSuitePaso272a290() {
  ejecutarSuitePaso272a276();
  ejecutarSuitePaso277a280();
  ejecutarSuitePaso281a284();
  ejecutarSuitePaso285a290();
  Logger.log('SUITE PASO 272-290 (RECONSTRUCCION FASES 2-5 TRAS REGRESION) COMPLETADA CON EXITO');
}

function pruebaPaso291_DecisionResponsableInactivo() {
  Logger.log('=== PASO 291: DECISION - responsable inactivo rechazado ===');
  var cadena = construirCadenaTareaPrueba_('P291');
  try {
    var personaInactiva = insertarRegistroTransaccional('PERSONA_EQUIPO', {
      TIPO: 'Persona',
      NOMBRE: 'Persona prueba P291 inactiva',
      ROL: 'Operario',
      CAPACIDAD_SEMANAL_DIAS: 5,
      DISPONIBILIDAD: 'Completa',
      ESTADO: 'Inactivo'
    }, {dryRun: false});
    var errorCapturado = null;
    try {
      guardarFormulario('DECISION', null, {
        PROYECTO_ID: cadena.proyectoId,
        TITULO: 'Decision prueba P291',
        CONTEXTO: 'Contexto de prueba',
        TIPO: 'Técnica',
        RESPONSABLE_ID: personaInactiva.id,
        ESTADO: 'Pendiente de consenso',
        IMPACTO: 'Medio'
      });
    } catch (e) { errorCapturado = e; }
    if (!errorCapturado) {
      throw new Error('PASO 291 FALLO: se permitio guardar una decision con responsable inactivo');
    }
    Logger.log('OK PASO 291a: responsable inactivo rechazado -- ' + errorCapturado.message);

    var personaActiva = crearPersonaPrueba_('P291b', 5);
    var resultado = guardarFormulario('DECISION', null, {
      PROYECTO_ID: cadena.proyectoId,
      TITULO: 'Decision prueba P291b',
      CONTEXTO: 'Contexto de prueba',
      TIPO: 'Técnica',
      RESPONSABLE_ID: personaActiva.id,
      ESTADO: 'Pendiente de consenso',
      IMPACTO: 'Medio'
    });
    if (resultado !== true) {
      throw new Error('PASO 291 FALLO: no se pudo guardar una decision valida con responsable activo');
    }
    Logger.log('OK PASO 291b: decision valida con responsable activo guardada correctamente');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
    limpiarResiduosPruebaPorTexto_('P291');
  }
}

function pruebaPaso292_DecisionCierreExigeResolucion() {
  Logger.log('=== PASO 292: DECISION - cierre exige resolucion y fecha de resolucion ===');
  var cadena = construirCadenaTareaPrueba_('P292');
  try {
    var persona = crearPersonaPrueba_('P292', 5);
    var errorCapturado = null;
    try {
      guardarFormulario('DECISION', null, {
        PROYECTO_ID: cadena.proyectoId,
        TITULO: 'Decision prueba P292 sin resolucion',
        TIPO: 'Técnica',
        RESPONSABLE_ID: persona.id,
        ESTADO: 'Aprobada',
        IMPACTO: 'Medio'
      });
    } catch (e) { errorCapturado = e; }
    if (!errorCapturado) {
      throw new Error('PASO 292 FALLO: se permitio cerrar (Aprobada) una decision sin resolucion ni fecha');
    }
    Logger.log('OK PASO 292a: cierre sin resolucion/fecha rechazado -- ' + errorCapturado.message);

    var resultado = guardarFormulario('DECISION', null, {
      PROYECTO_ID: cadena.proyectoId,
      TITULO: 'Decision prueba P292 con resolucion',
      TIPO: 'Técnica',
      RESPONSABLE_ID: persona.id,
      ESTADO: 'Aprobada',
      RESOLUCION: 'Se aprueba el cambio de proveedor',
      FECHA_RESOLUCION: '2026-07-25',
      IMPACTO: 'Medio'
    });
    if (resultado !== true) {
      throw new Error('PASO 292 FALLO: no se pudo cerrar una decision con resolucion y fecha');
    }
    Logger.log('OK PASO 292b: decision cerrada correctamente con resolucion y fecha');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
    limpiarResiduosPruebaPorTexto_('P292');
  }
}

function pruebaPaso293_IncidenciaExigeRelacion() {
  Logger.log('=== PASO 293: INCIDENCIA - exige al menos una entidad relacionada ===');
  var errorCapturado = null;
  try {
    guardarFormulario('INCIDENCIA', null, {
      TITULO: 'Incidencia prueba P293 sin relacion',
      TIPO: 'Calidad',
      PRIORIDAD: 'Baja',
      ESTADO: 'Abierta'
    });
  } catch (e) { errorCapturado = e; }
  if (!errorCapturado) {
    throw new Error('PASO 293 FALLO: se permitio guardar una incidencia sin ninguna entidad relacionada');
  }
  Logger.log('OK PASO 293a: incidencia sin relacion rechazada -- ' + errorCapturado.message);

  var cadena = construirCadenaTareaPrueba_('P293');
  try {
    var resultado = guardarFormulario('INCIDENCIA', null, {
      CAMPANA_ID: cadena.campanaId,
      TITULO: 'Incidencia prueba P293 con relacion',
      TIPO: 'Calidad',
      PRIORIDAD: 'Baja',
      ESTADO: 'Abierta'
    });
    if (resultado !== true) {
      throw new Error('PASO 293 FALLO: no se pudo guardar una incidencia con una relacion valida');
    }
    Logger.log('OK PASO 293b: incidencia con relacion valida guardada correctamente');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
    limpiarResiduosPruebaPorTexto_('P293');
  }
}

function pruebaPaso294_IncidenciaCoherenciaJerarquia() {
  Logger.log('=== PASO 294: INCIDENCIA - coherencia entre niveles de la jerarquia ===');
  var cadenaA = construirCadenaTareaPrueba_('P294A');
  var cadenaB = construirCadenaTareaPrueba_('P294B');
  try {
    var errorCapturado = null;
    try {
      guardarFormulario('INCIDENCIA', null, {
        CAMPANA_ID: cadenaB.campanaId,
        PROYECTO_ID: cadenaA.proyectoId,
        TITULO: 'Incidencia P294 proyecto-campana incoherente',
        TIPO: 'Calidad',
        PRIORIDAD: 'Baja',
        ESTADO: 'Abierta'
      });
    } catch (e) { errorCapturado = e; }
    if (!errorCapturado) throw new Error('PASO 294 FALLO: proyecto de otra campana no fue rechazado');
    Logger.log('OK PASO 294a: proyecto-campana incoherente rechazado -- ' + errorCapturado.message);

    errorCapturado = null;
    try {
      guardarFormulario('INCIDENCIA', null, {
        PROYECTO_ID: cadenaB.proyectoId,
        PRODUCTO_ID: cadenaA.productoId,
        TITULO: 'Incidencia P294 producto-proyecto incoherente',
        TIPO: 'Calidad',
        PRIORIDAD: 'Baja',
        ESTADO: 'Abierta'
      });
    } catch (e) { errorCapturado = e; }
    if (!errorCapturado) throw new Error('PASO 294 FALLO: producto no vinculado al proyecto no fue rechazado');
    Logger.log('OK PASO 294b: producto-proyecto incoherente rechazado -- ' + errorCapturado.message);

    errorCapturado = null;
    try {
      guardarFormulario('INCIDENCIA', null, {
        PRODUCTO_ID: cadenaB.productoId,
        PROCESO_ID: cadenaA.procesoId,
        TITULO: 'Incidencia P294 proceso-producto incoherente',
        TIPO: 'Calidad',
        PRIORIDAD: 'Baja',
        ESTADO: 'Abierta'
      });
    } catch (e) { errorCapturado = e; }
    if (!errorCapturado) throw new Error('PASO 294 FALLO: proceso de otro producto no fue rechazado');
    Logger.log('OK PASO 294c: proceso-producto incoherente rechazado -- ' + errorCapturado.message);

    errorCapturado = null;
    try {
      guardarFormulario('INCIDENCIA', null, {
        PROCESO_ID: cadenaB.procesoId,
        TAREA_ID: cadenaA.tareaId,
        TITULO: 'Incidencia P294 tarea-proceso incoherente',
        TIPO: 'Calidad',
        PRIORIDAD: 'Baja',
        ESTADO: 'Abierta'
      });
    } catch (e) { errorCapturado = e; }
    if (!errorCapturado) throw new Error('PASO 294 FALLO: tarea de otro proceso no fue rechazado');
    Logger.log('OK PASO 294d: tarea-proceso incoherente rechazado -- ' + errorCapturado.message);

    var resultado = guardarFormulario('INCIDENCIA', null, {
      CAMPANA_ID: cadenaA.campanaId,
      PROYECTO_ID: cadenaA.proyectoId,
      PRODUCTO_ID: cadenaA.productoId,
      PROCESO_ID: cadenaA.procesoId,
      TAREA_ID: cadenaA.tareaId,
      TITULO: 'Incidencia P294 cadena coherente',
      TIPO: 'Calidad',
      PRIORIDAD: 'Baja',
      ESTADO: 'Abierta'
    });
    if (resultado !== true) throw new Error('PASO 294 FALLO: no se pudo guardar una incidencia con cadena coherente completa');
    Logger.log('OK PASO 294e: incidencia con cadena jerarquica coherente guardada correctamente');
  } finally {
    limpiarCadenaTareaPrueba_(cadenaA);
    limpiarCadenaTareaPrueba_(cadenaB);
    limpiarResiduosPruebaPorTexto_('P294');
  }
}

function pruebaPaso295_IncidenciaCierreYAccionCorrectora() {
  Logger.log('=== PASO 295: INCIDENCIA - cierre exige fecha de resolucion y accion correctora si es critica/seguridad ===');
  var cadena = construirCadenaTareaPrueba_('P295');
  try {
    var errorCapturado = null;
    try {
      guardarFormulario('INCIDENCIA', null, {
        CAMPANA_ID: cadena.campanaId,
        TITULO: 'Incidencia P295 cierre sin fecha resolucion',
        TIPO: 'Calidad',
        PRIORIDAD: 'Baja',
        ESTADO: 'Resuelta'
      });
    } catch (e) { errorCapturado = e; }
    if (!errorCapturado) throw new Error('PASO 295 FALLO: se permitio cerrar una incidencia sin fecha de resolucion');
    Logger.log('OK PASO 295a: cierre sin fecha de resolucion rechazado -- ' + errorCapturado.message);

    errorCapturado = null;
    try {
      guardarFormulario('INCIDENCIA', null, {
        CAMPANA_ID: cadena.campanaId,
        TITULO: 'Incidencia P295 alta prioridad sin accion correctora',
        TIPO: 'Calidad',
        PRIORIDAD: 'Alta',
        ESTADO: 'Resuelta',
        FECHA_RESOLUCION: '2026-07-25'
      });
    } catch (e) { errorCapturado = e; }
    if (!errorCapturado) throw new Error('PASO 295 FALLO: se permitio cerrar una incidencia de prioridad alta sin accion correctora');
    Logger.log('OK PASO 295b: cierre prioridad alta sin accion correctora rechazado -- ' + errorCapturado.message);

    errorCapturado = null;
    try {
      guardarFormulario('INCIDENCIA', null, {
        CAMPANA_ID: cadena.campanaId,
        TITULO: 'Incidencia P295 seguridad sin accion correctora',
        TIPO: 'Seguridad',
        PRIORIDAD: 'Baja',
        ESTADO: 'Cerrada',
        FECHA_RESOLUCION: '2026-07-25'
      });
    } catch (e) { errorCapturado = e; }
    if (!errorCapturado) throw new Error('PASO 295 FALLO: se permitio cerrar una incidencia de seguridad sin accion correctora');
    Logger.log('OK PASO 295c: cierre tipo seguridad sin accion correctora rechazado -- ' + errorCapturado.message);

    var resultado = guardarFormulario('INCIDENCIA', null, {
      CAMPANA_ID: cadena.campanaId,
      TITULO: 'Incidencia P295 cierre completo',
      TIPO: 'Seguridad',
      PRIORIDAD: 'Alta',
      ESTADO: 'Cerrada',
      FECHA_RESOLUCION: '2026-07-25',
      ACCION_CORRECTORA: 'Se reviso el protocolo de seguridad y se reforzo la senalizacion'
    });
    if (resultado !== true) throw new Error('PASO 295 FALLO: no se pudo cerrar una incidencia critica con fecha y accion correctora');
    Logger.log('OK PASO 295d: incidencia critica cerrada correctamente con fecha y accion correctora');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
    limpiarResiduosPruebaPorTexto_('P295');
  }
}

function pruebaPaso296_DocumentoFormatoUrlVersion() {
  Logger.log('=== PASO 296: DOCUMENTO - formato de URL y version ===');
  var cadena = construirCadenaTareaPrueba_('P296');
  try {
    var errorCapturado = null;
    try {
      guardarFormulario('DOCUMENTO', null, {
        ENTIDAD_TIPO: 'Proyecto',
        ENTIDAD_ID: cadena.proyectoId,
        TIPO_DOCUMENTO: 'Informe',
        TITULO: 'Documento P296 url invalida',
        VERSION: '1.0',
        URL: 'ftp://servidor/documento.pdf',
        ESTADO: 'Borrador'
      });
    } catch (e) { errorCapturado = e; }
    if (!errorCapturado) throw new Error('PASO 296 FALLO: se acepto una URL sin http(s)');
    Logger.log('OK PASO 296a: URL invalida rechazada -- ' + errorCapturado.message);

    errorCapturado = null;
    try {
      guardarFormulario('DOCUMENTO', null, {
        ENTIDAD_TIPO: 'Proyecto',
        ENTIDAD_ID: cadena.proyectoId,
        TIPO_DOCUMENTO: 'Informe',
        TITULO: 'Documento P296 version invalida',
        VERSION: 'primera',
        URL: 'https://drive.google.com/documento-p296',
        ESTADO: 'Borrador'
      });
    } catch (e) { errorCapturado = e; }
    if (!errorCapturado) throw new Error('PASO 296 FALLO: se acepto una version con formato invalido');
    Logger.log('OK PASO 296b: version invalida rechazada -- ' + errorCapturado.message);

    var resultado = guardarFormulario('DOCUMENTO', null, {
      ENTIDAD_TIPO: 'Proyecto',
      ENTIDAD_ID: cadena.proyectoId,
      TIPO_DOCUMENTO: 'Informe',
      TITULO: 'Documento P296 valido',
      VERSION: 'v1.0.0',
      URL: 'https://drive.google.com/documento-p296-valido',
      ESTADO: 'Borrador'
    });
    if (resultado !== true) throw new Error('PASO 296 FALLO: no se pudo guardar un documento con URL y version validas');
    Logger.log('OK PASO 296c: documento con URL y version validas guardado correctamente');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
    limpiarResiduosPruebaPorTexto_('P296');
  }
}

function pruebaPaso297_DocumentoDuplicado() {
  Logger.log('=== PASO 297: DOCUMENTO - duplicado por entidad+tipo+version rechazado ===');
  var cadena = construirCadenaTareaPrueba_('P297');
  try {
    var resultado = guardarFormulario('DOCUMENTO', null, {
      ENTIDAD_TIPO: 'Proyecto',
      ENTIDAD_ID: cadena.proyectoId,
      TIPO_DOCUMENTO: 'Manual',
      TITULO: 'Documento P297 original',
      VERSION: '1',
      URL: 'https://drive.google.com/documento-p297',
      ESTADO: 'Borrador'
    });
    if (resultado !== true) throw new Error('PASO 297 FALLO: no se pudo guardar el documento original');

    var errorCapturado = null;
    try {
      guardarFormulario('DOCUMENTO', null, {
        ENTIDAD_TIPO: 'Proyecto',
        ENTIDAD_ID: cadena.proyectoId,
        TIPO_DOCUMENTO: 'Manual',
        TITULO: 'Documento P297 duplicado',
        VERSION: '1',
        URL: 'https://drive.google.com/documento-p297-duplicado',
        ESTADO: 'Borrador'
      });
    } catch (e) { errorCapturado = e; }
    if (!errorCapturado) throw new Error('PASO 297 FALLO: se permitio un documento duplicado (misma entidad, tipo y version)');
    Logger.log('OK PASO 297: documento duplicado rechazado -- ' + errorCapturado.message);
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
    limpiarResiduosPruebaPorTexto_('P297');
  }
}

function pruebaPaso298_DocumentoUnicoVigente() {
  Logger.log('=== PASO 298: DOCUMENTO - unico vigente por entidad y tipo ===');
  var cadena = construirCadenaTareaPrueba_('P298');
  try {
    var resultado = guardarFormulario('DOCUMENTO', null, {
      ENTIDAD_TIPO: 'Proyecto',
      ENTIDAD_ID: cadena.proyectoId,
      TIPO_DOCUMENTO: 'Protocolo',
      TITULO: 'Documento P298 vigente original',
      VERSION: '1',
      URL: 'https://drive.google.com/documento-p298-v1',
      ESTADO: 'Vigente'
    });
    if (resultado !== true) throw new Error('PASO 298 FALLO: no se pudo guardar el primer documento vigente');

    var errorCapturado = null;
    try {
      guardarFormulario('DOCUMENTO', null, {
        ENTIDAD_TIPO: 'Proyecto',
        ENTIDAD_ID: cadena.proyectoId,
        TIPO_DOCUMENTO: 'Protocolo',
        TITULO: 'Documento P298 segundo vigente',
        VERSION: '2',
        URL: 'https://drive.google.com/documento-p298-v2',
        ESTADO: 'Vigente'
      });
    } catch (e) { errorCapturado = e; }
    if (!errorCapturado) throw new Error('PASO 298 FALLO: se permitio un segundo documento vigente del mismo tipo para la misma entidad');
    Logger.log('OK PASO 298: segundo documento vigente rechazado -- ' + errorCapturado.message);
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
    limpiarResiduosPruebaPorTexto_('P298');
  }
}

function pruebaPaso299_IncidenciaResolversDependientes() {
  Logger.log('=== PASO 299: INCIDENCIA - resolvers de selectores dependientes ===');
  var cadena = construirCadenaTareaPrueba_('P299');
  try {
    var proyectos = obtenerOpcionesDependientes('INCIDENCIA_PROYECTO_ID', cadena.campanaId);
    if (!proyectos.some(function (p) { return String(p.id) === String(cadena.proyectoId); })) {
      throw new Error('PASO 299 FALLO: el resolver de proyectos por campana no devolvio el proyecto esperado');
    }
    Logger.log('OK PASO 299a: resolver INCIDENCIA_PROYECTO_ID devuelve el proyecto esperado');

    var productos = obtenerOpcionesDependientes('INCIDENCIA_PRODUCTO_ID', cadena.proyectoId);
    if (!productos.some(function (p) { return String(p.id) === String(cadena.productoId); })) {
      throw new Error('PASO 299 FALLO: el resolver de productos por proyecto (via tabla de union) no devolvio el producto esperado');
    }
    Logger.log('OK PASO 299b: resolver INCIDENCIA_PRODUCTO_ID (via PROYECTO_PRODUCTO) devuelve el producto esperado');

    var procesos = obtenerOpcionesDependientes('INCIDENCIA_PROCESO_ID', cadena.productoId);
    if (!procesos.some(function (p) { return String(p.id) === String(cadena.procesoId); })) {
      throw new Error('PASO 299 FALLO: el resolver de procesos por producto no devolvio el proceso esperado');
    }
    Logger.log('OK PASO 299c: resolver INCIDENCIA_PROCESO_ID devuelve el proceso esperado');

    var tareas = obtenerOpcionesDependientes('INCIDENCIA_TAREA_ID', cadena.procesoId);
    if (!tareas.some(function (t) { return String(t.id) === String(cadena.tareaId); })) {
      throw new Error('PASO 299 FALLO: el resolver de tareas por proceso no devolvio la tarea esperada');
    }
    Logger.log('OK PASO 299d: resolver INCIDENCIA_TAREA_ID devuelve la tarea esperada');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
  }
}

function ejecutarSuitePaso291a295() {
  pruebaPaso291_DecisionResponsableInactivo();
  pruebaPaso292_DecisionCierreExigeResolucion();
  pruebaPaso293_IncidenciaExigeRelacion();
  pruebaPaso294_IncidenciaCoherenciaJerarquia();
  pruebaPaso295_IncidenciaCierreYAccionCorrectora();
  Logger.log('SUITE PASO 291-295 (FASE 6 -- DECISION E INCIDENCIA) COMPLETADA CON EXITO');
}

function ejecutarSuitePaso296a299() {
  pruebaPaso296_DocumentoFormatoUrlVersion();
  pruebaPaso297_DocumentoDuplicado();
  pruebaPaso298_DocumentoUnicoVigente();
  pruebaPaso299_IncidenciaResolversDependientes();
  Logger.log('SUITE PASO 296-299 (FASE 6 -- DOCUMENTO Y RESOLVERS) COMPLETADA CON EXITO');
}

function ejecutarSuitePaso291a299() {
  ejecutarSuitePaso291a295();
  ejecutarSuitePaso296a299();
  Logger.log('SUITE PASO 291-299 (FASE 6 -- DECISIONES, INCIDENCIAS Y DOCUMENTOS) COMPLETADA CON EXITO');
}

function pruebaPaso300_PanelConDatosRealesSimultaneos() {
  Logger.log('=== PASO 300: Panel operativo con tarea pospuesta + producto sin proyecto + material stock bajo simultaneos ===');
  try {
    var cadena = construirCadenaTareaPrueba_('P300X');
    var tareaPospuesta = insertarRegistroTransaccional('TAREA', {
      PROCESO_ID: cadena.procesoId,
      NOMBRE: 'Tarea pospuesta prueba P300X',
      ORDEN_SECUENCIA: 2,
      DURACION_PREVISTA_DIAS: 1,
      ESTADO: 'Pospuesta',
      MOTIVO_POSPOSICION: 'Motivo de prueba P300X',
      PORCENTAJE_AVANCE: 0
    }, {dryRun: false});

    var productoSinProyecto = insertarRegistroTransaccional('PRODUCTO', {
      CODIGO: 'PRD-P300XB',
      NOMBRE: 'Producto sin proyecto prueba P300X',
      ORIGEN: 'Producción propia',
      UNIDAD: 'Unidad',
      ESTADO: 'Borrador'
    }, {dryRun: false});

    var materialStockBajo = insertarRegistroTransaccional('MATERIAL', {
      CODIGO: 'MAT-P300X',
      NOMBRE: 'Material stock bajo prueba P300X',
      CATEGORIA: 'Madera',
      UNIDAD: 'Unidad',
      STOCK_ACTUAL: 1,
      STOCK_MINIMO: 5,
      ESTADO: 'Disponible'
    }, {dryRun: false});

    var panel = obtenerPanelOperativo();

    if (!panel.tareasPospuestas.some(function (t) { return t.ID === tareaPospuesta.id; })) {
      throw new Error('PASO 300 FALLO: la tarea pospuesta no aparece en panel.tareasPospuestas');
    }
    if (!panel.excepciones.productosSinProyecto.some(function (p) { return p.ID === productoSinProyecto.id; })) {
      throw new Error('PASO 300 FALLO: el producto sin proyecto no aparece en panel.excepciones.productosSinProyecto');
    }
    if (!panel.materiales.stockBajo.some(function (m) { return m.ID === materialStockBajo.id; })) {
      throw new Error('PASO 300 FALLO: el material con stock bajo no aparece en panel.materiales.stockBajo');
    }
    Logger.log('OK PASO 300: panel muestra correctamente los tres casos simultaneos con datos reales');
  } finally {
    limpiarResiduosPruebaPorTexto_('P300X');
  }
}

function pruebaPaso301_InformeExcepcionesAgregaCorrectamente() {
  Logger.log('=== PASO 301: generarInformeExcepciones agrega tarea pospuesta con datos reales ===');
  try {
    var cadena = construirCadenaTareaPrueba_('P301');
    var tareaPospuesta = insertarRegistroTransaccional('TAREA', {
      PROCESO_ID: cadena.procesoId,
      NOMBRE: 'Tarea pospuesta prueba P301',
      ORDEN_SECUENCIA: 2,
      DURACION_PREVISTA_DIAS: 1,
      ESTADO: 'Pospuesta',
      MOTIVO_POSPOSICION: 'Motivo de prueba P301',
      PORCENTAJE_AVANCE: 0
    }, {dryRun: false});

    var informe = generarInformeExcepciones();
    if (informe.tipo !== 'EXCEPCIONES') throw new Error('PASO 301 FALLO: tipo de informe incorrecto');
    if (!informe.tareasPospuestas.some(function (t) { return t.ID === tareaPospuesta.id; })) {
      throw new Error('PASO 301 FALLO: la tarea pospuesta no aparece en el informe de excepciones');
    }
    Logger.log('OK PASO 301: informe de excepciones agrega correctamente los datos reales');
  } finally {
    limpiarResiduosPruebaPorTexto_('P301');
  }
}

function pruebaPaso302_ExportarInformeCsv() {
  Logger.log('=== PASO 302: exportarInformeCSV genera CSV real y registra EXPORTAR_INFORME ===');
  var resultado = exportarInformeCSV('EXCEPCIONES', null, { esPrueba: true, pruebaId: 'P302' });
  if (!resultado || !resultado.nombreArchivo || !resultado.contenidoCsv) {
    throw new Error('PASO 302 FALLO: exportarInformeCSV no devolvio un resultado valido');
  }
  if (resultado.contenidoCsv.indexOf('campo,valor') === -1) {
    throw new Error('PASO 302 FALLO: el CSV exportado no tiene la cabecera esperada');
  }
  var historial = listarHistorialPorOrigen(null, true).filter(function (h) {
    return h.ACCION === 'EXPORTAR_INFORME' && h.REGISTRO_ID === resultado.nombreArchivo;
  });
  if (historial.length === 0) {
    throw new Error('PASO 302 FALLO: no se registro EXPORTAR_INFORME en el historial');
  }
  Logger.log('OK PASO 302: CSV generado correctamente y registrado en historial -- ' + resultado.nombreArchivo);
}

function pruebaPaso303_ExportarInformePdf() {
  Logger.log('=== PASO 303: exportarInformePDF genera HTML de impresion real y registra EXPORTAR_INFORME ===');
  var resultado = exportarInformePDF('EXCEPCIONES', null, { esPrueba: true, pruebaId: 'P303' });
  if (!resultado || !resultado.nombreArchivo || !resultado.contenidoHtml) {
    throw new Error('PASO 303 FALLO: exportarInformePDF no devolvio un resultado valido');
  }
  if (resultado.contenidoHtml.indexOf('<table>') === -1 || resultado.contenidoHtml.indexOf('Informe: EXCEPCIONES') === -1) {
    throw new Error('PASO 303 FALLO: el HTML de impresion no tiene el contenido esperado');
  }
  var historial = listarHistorialPorOrigen(null, true).filter(function (h) {
    return h.ACCION === 'EXPORTAR_INFORME' && h.REGISTRO_ID === resultado.nombreArchivo;
  });
  if (historial.length === 0) {
    throw new Error('PASO 303 FALLO: no se registro EXPORTAR_INFORME en el historial');
  }
  Logger.log('OK PASO 303: HTML de impresion generado correctamente y registrado en historial -- ' + resultado.nombreArchivo);
}

function pruebaPaso304_IntegridadFuncionalDetectaReservaMayorQueStock() {
  Logger.log('=== PASO 304: obtenerReporteIntegridad detecta reserva mayor que stock (integridad funcional) ===');
  try {
    var materialReservaExcesiva = insertarRegistroTransaccional('MATERIAL', {
      CODIGO: 'MAT-P304',
      NOMBRE: 'Material reserva excesiva prueba P304',
      CATEGORIA: 'Madera',
      UNIDAD: 'Unidad',
      STOCK_ACTUAL: 5,
      STOCK_MINIMO: 2,
      CANTIDAD_RESERVADA: 10,
      ESTADO: 'Disponible'
    }, {dryRun: false});

    var reporte = obtenerReporteIntegridad();
    var hallazgos = (reporte.funcional && reporte.funcional.errores) ? reporte.funcional.errores.filter(function (h) {
      return h.codigo === 'FUNC-STOCK-001' && h.registroId === materialReservaExcesiva.id;
    }) : [];
    if (hallazgos.length === 0) {
      throw new Error('PASO 304 FALLO: obtenerReporteIntegridad no detecto FUNC-STOCK-001 para el material con reserva mayor que stock');
    }
    if (!hayProblemasIntegridad(reporte)) {
      throw new Error('PASO 304 FALLO: hayProblemasIntegridad no devolvio true con el problema funcional presente');
    }
    Logger.log('OK PASO 304: integridad funcional detecta correctamente la reserva mayor que stock -- ' + materialReservaExcesiva.id);
  } finally {
    limpiarResiduosPruebaPorTexto_('P304');
  }
}

function ejecutarSuitePaso300a304() {
  pruebaPaso300_PanelConDatosRealesSimultaneos();
  pruebaPaso301_InformeExcepcionesAgregaCorrectamente();
  pruebaPaso302_ExportarInformeCsv();
  pruebaPaso303_ExportarInformePdf();
  pruebaPaso304_IntegridadFuncionalDetectaReservaMayorQueStock();
  Logger.log('SUITE PASO 300-304 (FASE 7 -- PANEL, INFORMES, EXPORTACION E INTEGRIDAD FUNCIONAL) COMPLETADA CON EXITO');
}


function pruebaPaso305_ProtegerHojasDatosMVPPrimeraEjecucion() {
  Logger.log('=== PASO 305: protegerHojasDatosMVP protege las hojas de datos reales sin lanzar error ===');
  var resultado = protegerHojasDatosMVP();
  var totalGestionadas = resultado.protegidas.length + resultado.yaProtegidas.length;
  if (totalGestionadas < hojasProtegiblesMVP_().length) {
    throw new Error('PASO 305 FALLO: no se gestionaron todas las hojas protegibles -- ' + JSON.stringify(resultado));
  }
  if (resultado.errores.length > 0) {
    throw new Error('PASO 305 FALLO: hubo errores al proteger -- ' + resultado.errores.join('; '));
  }
  Logger.log('OK PASO 305: proteccion gestionada correctamente -- ' + JSON.stringify(resultado));
}

function pruebaPaso306_ProtegerHojasDatosMVPEsIdempotente() {
  Logger.log('=== PASO 306: protegerHojasDatosMVP es idempotente en una segunda ejecucion ===');
  var resultado = protegerHojasDatosMVP();
  if (resultado.protegidas.length !== 0) {
    throw new Error('PASO 306 FALLO: la segunda ejecucion volvio a proteger hojas en vez de detectarlas ya protegidas -- ' + JSON.stringify(resultado));
  }
  if (resultado.yaProtegidas.length < hojasProtegiblesMVP_().length) {
    throw new Error('PASO 306 FALLO: no todas las hojas protegibles aparecen como ya protegidas -- ' + JSON.stringify(resultado));
  }
  Logger.log('OK PASO 306: proteccion idempotente confirmada -- ' + JSON.stringify(resultado));
}

function pruebaPaso307_OnEditRegistraEdicionDirecta() {
  Logger.log('=== PASO 307: onEdit(e) simulado registra EDICION_DIRECTA_DETECTADA en historial ===');
  var hoja = SpreadsheetApp.getActive().getSheetByName('01_CAMPANAS');
  var ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) {
    throw new Error('PASO 307 FALLO: 01_CAMPANAS no tiene filas de datos reales para simular la edicion.');
  }
  var rango = hoja.getRange(ultimaFila, 3);
  var idFila = hoja.getRange(ultimaFila, 1).getValue();
  var eventoSimulado = { range: rango, oldValue: 'VALOR_ANTERIOR_SIMULADO_P307', value: 'VALOR_NUEVO_SIMULADO_P307' };
  onEdit(eventoSimulado);
  var historial = listarHistorialPorOrigen(null, true).filter(function (h) {
    return h.ACCION === 'EDICION_DIRECTA_DETECTADA' && h.ENTIDAD === 'CAMPANA' && h.REGISTRO_ID === String(idFila);
  });
  if (historial.length === 0) {
    throw new Error('PASO 307 FALLO: no se registro EDICION_DIRECTA_DETECTADA en el historial.');
  }
  Logger.log('OK PASO 307: onEdit(e) simulado registro correctamente la edicion directa -- ' + idFila);
}

function pruebaPaso308_RevertirUltimoCambioControladoFuncionaYRechazaDoble() {
  Logger.log('=== PASO 308: revertirUltimoCambioControlado revierte una actualizacion real y rechaza la doble reversion ===');
  try {
    var producto = insertarRegistroTransaccional('PRODUCTO', {
      CODIGO: 'PRD-P308',
      NOMBRE: 'Producto original prueba P308',
      ORIGEN: 'Producción propia',
      UNIDAD: 'Unidad',
      ESTADO: 'Borrador'
    }, { dryRun: false });

    actualizarRegistroTransaccional('PRODUCTO', producto.id, { NOMBRE: 'Producto modificado prueba P308' }, { dryRun: false });

    var resultado = revertirUltimoCambioControlado('PRODUCTO', producto.id);
    if (resultado.camposRevertidos.indexOf('NOMBRE') === -1) {
      throw new Error('PASO 308 FALLO: la reversion no incluyo el campo NOMBRE -- ' + JSON.stringify(resultado));
    }

    var registroTrasRevertir = obtenerRegistroPorId('PRODUCTO', producto.id);
    if (registroTrasRevertir.NOMBRE !== 'Producto original prueba P308') {
      throw new Error('PASO 308 FALLO: el NOMBRE no se restauro al valor original -- valor actual: ' + registroTrasRevertir.NOMBRE);
    }

    var historialRevertir = listarHistorialPorOrigen(null, true).filter(function (h) {
      return h.ACCION === 'REVERTIR' && h.ENTIDAD === 'PRODUCTO' && h.REGISTRO_ID === producto.id;
    });
    if (historialRevertir.length === 0) {
      throw new Error('PASO 308 FALLO: no se registro la accion REVERTIR en el historial.');
    }

    var segundaReversionRechazada = false;
    try {
      revertirUltimoCambioControlado('PRODUCTO', producto.id);
    } catch (eSegunda) {
      segundaReversionRechazada = true;
    }
    if (!segundaReversionRechazada) {
      throw new Error('PASO 308 FALLO: una segunda reversion del mismo cambio deberia haber sido rechazada.');
    }

    Logger.log('OK PASO 308: reversion de actualizacion real funciona y la doble reversion se rechaza correctamente -- ' + producto.id);
  } finally {
    limpiarResiduosPruebaPorTexto_('P308');
  }
}

function pruebaPaso309_RevertirUltimoCambioControladoRechazaCreacionYEntidadInvalida() {
  Logger.log('=== PASO 309: revertirUltimoCambioControlado rechaza revertir una creacion y una entidad no reconocida ===');
  try {
    var producto = insertarRegistroTransaccional('PRODUCTO', {
      CODIGO: 'PRD-P309',
      NOMBRE: 'Producto recien creado prueba P309',
      ORIGEN: 'Producción propia',
      UNIDAD: 'Unidad',
      ESTADO: 'Borrador'
    }, { dryRun: false });

    var rechazadaCreacion = false;
    try {
      revertirUltimoCambioControlado('PRODUCTO', producto.id);
    } catch (eCreacion) {
      rechazadaCreacion = true;
    }
    if (!rechazadaCreacion) {
      throw new Error('PASO 309 FALLO: revertir la propia creacion de un registro deberia haber sido rechazado.');
    }

    var rechazadaEntidad = false;
    try {
      revertirUltimoCambioControlado('ENTIDAD_INEXISTENTE_P309', producto.id);
    } catch (eEntidad) {
      rechazadaEntidad = true;
    }
    if (!rechazadaEntidad) {
      throw new Error('PASO 309 FALLO: una entidad no reconocida deberia haber sido rechazada.');
    }

    Logger.log('OK PASO 309: revertir una creacion y una entidad invalida se rechazan correctamente -- ' + producto.id);
  } finally {
    limpiarResiduosPruebaPorTexto_('P309');
  }
}


function pruebaPaso310_NuevoRegistroMaterialYPersonaEquipoDisponibles() {
  Logger.log('=== PASO 310: puntos de entrada Nuevo registro -> Material y Persona/Equipo funcionan sin error ===');
  if (!ESQUEMAS_FORMULARIO_MVP.MATERIAL) {
    throw new Error('PASO 310 FALLO: no existe ESQUEMAS_FORMULARIO_MVP.MATERIAL');
  }
  if (!ESQUEMAS_FORMULARIO_MVP.PERSONA_EQUIPO) {
    throw new Error('PASO 310 FALLO: no existe ESQUEMAS_FORMULARIO_MVP.PERSONA_EQUIPO');
  }
  try {
    abrirFormularioCrearMaterial();
  } catch (e) {
    throw new Error('PASO 310 FALLO: abrirFormularioCrearMaterial lanzo un error -- ' + e.message);
  }
  try {
    abrirFormularioCrearPersonaEquipo();
  } catch (e) {
    throw new Error('PASO 310 FALLO: abrirFormularioCrearPersonaEquipo lanzo un error -- ' + e.message);
  }
  Logger.log('OK PASO 310: los puntos de entrada de Nuevo registro para Material y Persona/Equipo estan disponibles y no lanzan error');
}

function ejecutarSuitePaso305a310() {
  pruebaPaso305_ProtegerHojasDatosMVPPrimeraEjecucion();
  pruebaPaso306_ProtegerHojasDatosMVPEsIdempotente();
  pruebaPaso307_OnEditRegistraEdicionDirecta();
  pruebaPaso308_RevertirUltimoCambioControladoFuncionaYRechazaDoble();
  pruebaPaso309_RevertirUltimoCambioControladoRechazaCreacionYEntidadInvalida();
  pruebaPaso310_NuevoRegistroMaterialYPersonaEquipoDisponibles();
  Logger.log('SUITE PASO 305-310 (RECONSTRUCCION FASE 1 -- PROTECCION, EDICION DIRECTA, REVERSION, NUEVO REGISTRO MATERIAL/PERSONA) COMPLETADA CON EXITO');
}

/*
 * PASO 311 (ver conversación -- "necesitamos poder incluir los tres
 * tipos, que no sean excluyentes"): PASO 297/298 ya prueban que
 * DOCUMENTO rechaza duplicados (mismo tipo+version) y un segundo
 * vigente del mismo tipo -- correcto para Manual/Protocolo, pero
 * Imagen/Vídeo son una galería de adjuntos, no una relación 1:1. Esta
 * prueba confirma que ambas reglas quedan exentas para esos dos tipos:
 * se pueden crear varias imágenes vigentes con VERSION en blanco sobre
 * el mismo registro sin que salte ningún rechazo.
 */
function pruebaPaso311_DocumentoImagenVideoNoExcluyentes() {
  Logger.log('=== PASO 311: DOCUMENTO - Imagen/Vídeo no son excluyentes entre sí ni consigo mismos ===');
  var cadena = construirCadenaTareaPrueba_('P311');
  try {
    var primeraImagen = guardarFormulario('DOCUMENTO', null, {
      ENTIDAD_TIPO: 'Tarea',
      ENTIDAD_ID: cadena.tareaId,
      TIPO_DOCUMENTO: 'Imagen',
      TITULO: 'Foto P311 uno',
      URL: 'https://drive.google.com/file/d/foto-p311-uno/view',
      ESTADO: 'Vigente'
    });
    if (primeraImagen !== true) throw new Error('PASO 311 FALLO: no se pudo guardar la primera imagen vigente');

    var segundaImagen = guardarFormulario('DOCUMENTO', null, {
      ENTIDAD_TIPO: 'Tarea',
      ENTIDAD_ID: cadena.tareaId,
      TIPO_DOCUMENTO: 'Imagen',
      TITULO: 'Foto P311 dos',
      URL: 'https://drive.google.com/file/d/foto-p311-dos/view',
      ESTADO: 'Vigente'
    });
    if (segundaImagen !== true) throw new Error('PASO 311 FALLO: se rechazo una segunda imagen vigente del mismo tipo (deberian poder coexistir)');
    Logger.log('OK PASO 311a: dos imágenes vigentes del mismo tipo coexisten en el mismo registro');

    var video = guardarFormulario('DOCUMENTO', null, {
      ENTIDAD_TIPO: 'Tarea',
      ENTIDAD_ID: cadena.tareaId,
      TIPO_DOCUMENTO: 'Vídeo',
      TITULO: 'Vídeo P311',
      URL: 'https://drive.google.com/file/d/video-p311/view',
      ESTADO: 'Vigente'
    });
    if (video !== true) throw new Error('PASO 311 FALLO: se rechazo un vídeo vigente coexistiendo con imágenes vigentes del mismo registro');
    Logger.log('OK PASO 311b: imagen y vídeo coexisten como vigentes en el mismo registro');
  } finally {
    limpiarCadenaTareaPrueba_(cadena);
    limpiarResiduosPruebaPorTexto_('P311');
  }
}

function ejecutarSuitePaso311() {
  pruebaPaso311_DocumentoImagenVideoNoExcluyentes();
  Logger.log('SUITE PASO 311 (DOCUMENTO -- IMAGEN/VIDEO NO EXCLUYENTES) COMPLETADA CON EXITO');
}
