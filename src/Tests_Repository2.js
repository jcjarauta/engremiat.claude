function auditarJerarquiaProductoProcesoTarea() {
  console.log('ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_JERARQUIA_PRODUCTO_PROCESO_TAREA');

  var procesos = listarProcesosDeProducto('PRD-0001');
  var tareas = listarTareasDeProceso('PCS-0001');

  var idsProcesos = procesos.map(function (registro) {
    return String(registro.ID || '').trim();
  });

  var idsTareas = tareas.map(function (registro) {
    return String(registro.ID || '').trim();
  });

  console.log('OK producto_id=PRD-0001 procesos=' + JSON.stringify(idsProcesos));
  console.log('OK proceso_id=PCS-0001 tareas=' + JSON.stringify(idsTareas));

  if (idsProcesos.length !== 1 || idsProcesos[0] !== 'PCS-0001') {
    console.error('ERR procesos_inesperados=' + JSON.stringify(idsProcesos));
    console.log('ENGREMIAT_PACKAGE_END package=AUDITAR_JERARQUIA_PRODUCTO_PROCESO_TAREA result=ERR');
    throw new Error(
      'AUDITORIA_JERARQUIA_ERROR: PRD-0001 debe devolver exclusivamente PCS-0001'
    );
  }

  if (idsTareas.length !== 1 || idsTareas[0] !== 'TAR-0001') {
    console.error('ERR tareas_inesperadas=' + JSON.stringify(idsTareas));
    console.log('ENGREMIAT_PACKAGE_END package=AUDITAR_JERARQUIA_PRODUCTO_PROCESO_TAREA result=ERR');
    throw new Error(
      'AUDITORIA_JERARQUIA_ERROR: PCS-0001 debe devolver exclusivamente TAR-0001'
    );
  }

  console.log('OK jerarquia=PRD-0001>PCS-0001>TAR-0001');
  console.log('NEXT revisar_resultado_y_cerrar_gate');
  console.log('ENGREMIAT_PACKAGE_END package=AUDITAR_JERARQUIA_PRODUCTO_PROCESO_TAREA result=OK');

  return {
    productoId: 'PRD-0001',
    procesos: idsProcesos,
    procesoId: 'PCS-0001',
    tareas: idsTareas
  };
}

function auditarFechasTareaResponsableRepositorio() {
  console.log('ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_FECHAS_TAREA_RESPONSABLE_REPOSITORIO');

  var hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('07_TAREA_RESPONSABLE');

  var filasAntes = hoja.getLastRow();
  var rechazado = false;

  try {
    insertarRegistroTransaccional(
      'TAREA_RESPONSABLE',
      {
        TAREA_ID: 'TAR-0002',
        PERSONA_EQUIPO_ID: 'PER-0002',
        ROL_ASIGNADO: 'Responsable',
        FECHA_INICIO_ASIGNACION: new Date(2026, 6, 27),
        FECHA_FIN_ASIGNACION: new Date(2026, 6, 26),
        PORCENTAJE_DEDICACION: 50,
        ESTADO: 'Activa'
      },
      {
        dryRun: true,
        origen: 'TEST',
        esPrueba: true,
        pruebaId: 'AUD-FECHAS-TAREA-RESPONSABLE-REPO'
      }
    );

    console.log('ERR repositorio_acepto_fechas_incoherentes=true');
  } catch (error) {
    rechazado = true;
    console.log('OK error_controlado=' + error.message);
  }

  var filasDespues = hoja.getLastRow();

  if (filasAntes !== filasDespues) {
    console.log('ERR hoja_modificada=true');
    console.log('ENGREMIAT_PACKAGE_END package=AUDITAR_FECHAS_TAREA_RESPONSABLE_REPOSITORIO result=ERR');
    throw new Error('AUDITORIA_REPOSITORIO_ERROR: la prueba modificó 07_TAREA_RESPONSABLE');
  }

  if (!rechazado) {
    console.log('ERR validacion_repositorio_ausente=true');
    console.log('ENGREMIAT_PACKAGE_END package=AUDITAR_FECHAS_TAREA_RESPONSABLE_REPOSITORIO result=NO_GO');
    throw new Error(
      'AUDITORIA_REPOSITORIO_NO_GO: el repositorio acepta FECHA_FIN_ASIGNACION anterior a FECHA_INICIO_ASIGNACION'
    );
  }

  console.log('OK filas_antes=' + filasAntes);
  console.log('OK filas_despues=' + filasDespues);
  console.log('NEXT revisar_si_el_error_es_por_fechas_o_por_otra_regla');
  console.log('ENGREMIAT_PACKAGE_END package=AUDITAR_FECHAS_TAREA_RESPONSABLE_REPOSITORIO result=OK');
}

function auditarActualizacionFechasTareaResponsableRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_ACTUALIZACION_FECHAS_TAREA_RESPONSABLE_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaAsignaciones = ss.getSheetByName('07_TAREA_RESPONSABLE');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');

  if (!hojaAsignaciones) {
    console.log('ERR hoja_no_existe=07_TAREA_RESPONSABLE');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_ACTUALIZACION_FECHAS_TAREA_RESPONSABLE_REPOSITORIO result=ERR'
    );
    throw new Error(
      'AUDITORIA_ACTUALIZACION_ERROR: no existe 07_TAREA_RESPONSABLE'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=91_HISTORIAL');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_ACTUALIZACION_FECHAS_TAREA_RESPONSABLE_REPOSITORIO result=ERR'
    );
    throw new Error(
      'AUDITORIA_ACTUALIZACION_ERROR: no existe 91_HISTORIAL'
    );
  }

  var idRegistro = 'TRE-0006';
  var registroAntes = obtenerRegistroPorId(
    'TAREA_RESPONSABLE',
    idRegistro
  );

  if (!registroAntes) {
    console.log('ERR registro_no_existe=' + idRegistro);
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_ACTUALIZACION_FECHAS_TAREA_RESPONSABLE_REPOSITORIO result=ERR'
    );
    throw new Error(
      'AUDITORIA_ACTUALIZACION_ERROR: no existe ' +
      idRegistro
    );
  }

  var filasAsignacionesAntes =
    hojaAsignaciones.getLastRow();

  var filasHistorialAntes =
    hojaHistorial.getLastRow();

  var fechaInicioAntes =
    registroAntes.FECHA_INICIO_ASIGNACION;

  var fechaFinAntes =
    registroAntes.FECHA_FIN_ASIGNACION;

  var fechaModificacionAntes =
    registroAntes.FECHA_MODIFICACION;

  var rechazadoPorFechas = false;
  var mensajeError = '';

  try {
    actualizarRegistroTransaccional(
      'TAREA_RESPONSABLE',
      idRegistro,
      {
        FECHA_INICIO_ASIGNACION:
          new Date(2026, 6, 27),
        FECHA_FIN_ASIGNACION:
          new Date(2026, 6, 26)
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_actualizacion_con_fechas_incoherentes=true'
    );

  } catch (error) {
    mensajeError = String(
      error && error.message
        ? error.message
        : error
    );

    rechazadoPorFechas =
      mensajeError.indexOf(
        'FECHA_FIN_ASIGNACION no puede ser anterior a FECHA_INICIO_ASIGNACION'
      ) !== -1;

    if (rechazadoPorFechas) {
      console.log(
        'OK error_controlado=' +
        mensajeError
      );
    } else {
      console.log(
        'ERR error_distinto_al_esperado=' +
        mensajeError
      );
    }
  }

  SpreadsheetApp.flush();

  var registroDespues = obtenerRegistroPorId(
    'TAREA_RESPONSABLE',
    idRegistro
  );

  var filasAsignacionesDespues =
    hojaAsignaciones.getLastRow();

  var filasHistorialDespues =
    hojaHistorial.getLastRow();

  if (!registroDespues) {
    console.log(
      'ERR registro_desaparecido=' +
      idRegistro
    );
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_ACTUALIZACION_FECHAS_TAREA_RESPONSABLE_REPOSITORIO result=ERR'
    );
    throw new Error(
      'AUDITORIA_ACTUALIZACION_ERROR: el registro desapareció'
    );
  }

  var fechaInicioSinCambios =
    compararValoresAuditoria_(
      fechaInicioAntes,
      registroDespues.FECHA_INICIO_ASIGNACION
    );

  var fechaFinSinCambios =
    compararValoresAuditoria_(
      fechaFinAntes,
      registroDespues.FECHA_FIN_ASIGNACION
    );

  var fechaModificacionSinCambios =
    compararValoresAuditoria_(
      fechaModificacionAntes,
      registroDespues.FECHA_MODIFICACION
    );

  console.log(
    'OK filas_asignaciones_antes=' +
    filasAsignacionesAntes
  );

  console.log(
    'OK filas_asignaciones_despues=' +
    filasAsignacionesDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  console.log(
    'OK fecha_inicio_sin_cambios=' +
    fechaInicioSinCambios
  );

  console.log(
    'OK fecha_fin_sin_cambios=' +
    fechaFinSinCambios
  );

  console.log(
    'OK fecha_modificacion_sin_cambios=' +
    fechaModificacionSinCambios
  );

  if (!rechazadoPorFechas) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_ACTUALIZACION_FECHAS_TAREA_RESPONSABLE_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_ACTUALIZACION_NO_GO: el repositorio no rechazó específicamente las fechas incoherentes'
    );
  }

  if (
    filasAsignacionesAntes !==
    filasAsignacionesDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_ACTUALIZACION_FECHAS_TAREA_RESPONSABLE_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ACTUALIZACION_ERROR: cambió el número de filas de 07_TAREA_RESPONSABLE'
    );
  }

  if (
    filasHistorialAntes !==
    filasHistorialDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_ACTUALIZACION_FECHAS_TAREA_RESPONSABLE_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ACTUALIZACION_ERROR: se generó historial durante un dryRun rechazado'
    );
  }

  if (
    !fechaInicioSinCambios ||
    !fechaFinSinCambios ||
    !fechaModificacionSinCambios
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_ACTUALIZACION_FECHAS_TAREA_RESPONSABLE_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ACTUALIZACION_ERROR: TRE-0006 fue modificado'
    );
  }

  console.log(
    'OK actualizacion_invalida_rechazada=true'
  );

  console.log(
    'OK registro_sin_cambios=' +
    idRegistro
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_validacion_temporal_de_actualizacion'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_ACTUALIZACION_FECHAS_TAREA_RESPONSABLE_REPOSITORIO result=OK'
  );

  return true;
}

function compararValoresAuditoria_(valorA, valorB) {
  if (
    valorA instanceof Date &&
    valorB instanceof Date
  ) {
    return (
      valorA.getTime() ===
      valorB.getTime()
    );
  }

  return String(
    valorA == null ? '' : valorA
  ) === String(
    valorB == null ? '' : valorB
  );
}

function retirarDuplicadoProductoMaterialAuditoria() {
  console.log('ENGREMIAT_PACKAGE_BEGIN package=RETIRAR_DUPLICADO_PRODUCTO_MATERIAL');

  var resultado = desactivarRegistro(
    'PRODUCTO_MATERIAL',
    'PMA-0002'
  );

  console.log(
    'OK entidad=PRODUCTO_MATERIAL id=PMA-0002 activo=NO'
  );
  console.log(
    'NEXT verificar_fila_e_historial'
  );
  console.log(
    'ENGREMIAT_PACKAGE_END package=RETIRAR_DUPLICADO_PRODUCTO_MATERIAL result=OK'
  );

  return resultado;
}


function auditarCantidadCeroProductoMaterial() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_CANTIDAD_CERO_PRODUCTO_MATERIAL'
  );

  var rechazado = false;
  var mensajeError = '';

  try {
    actualizarRegistroTransaccional(
      'PRODUCTO_MATERIAL',
      'PMA-0001',
      {
        CANTIDAD_PREVISTA: 0
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_cantidad_prevista_cero=true'
    );

  } catch (error) {
    mensajeError = String(
      error && error.message
        ? error.message
        : error
    );

    rechazado =
      mensajeError.indexOf('CANTIDAD_PREVISTA') !== -1;

    if (rechazado) {
      console.log(
        'OK error_controlado=' + mensajeError
      );
    } else {
      console.log(
        'ERR error_distinto_al_esperado=' + mensajeError
      );
    }
  }

  if (!rechazado) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CANTIDAD_CERO_PRODUCTO_MATERIAL result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: CANTIDAD_PREVISTA=0 fue aceptada'
    );
  }

  console.log(
    'OK registro_sin_cambios=PMA-0001'
  );

  console.log(
    'NEXT verificar_validacion_en_ui'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_CANTIDAD_CERO_PRODUCTO_MATERIAL result=OK'
  );

  return true;
}


function auditarUnidadProductoMaterialRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_UNIDAD_PRODUCTO_MATERIAL_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaRelacion = ss.getSheetByName('09_PRODUCTO_MATERIAL');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');

  if (!hojaRelacion) {
    console.log('ERR hoja_no_existe=09_PRODUCTO_MATERIAL');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_UNIDAD_PRODUCTO_MATERIAL_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 09_PRODUCTO_MATERIAL'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=98_HISTORIAL');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_UNIDAD_PRODUCTO_MATERIAL_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 98_HISTORIAL'
    );
  }

  var filasRelacionAntes = hojaRelacion.getLastRow();
  var filasHistorialAntes = hojaHistorial.getLastRow();

  var rechazadoPorUnidad = false;
  var mensajeError = '';

  try {
    insertarRegistroTransaccional(
      'PRODUCTO_MATERIAL',
      {
        PRODUCTO_ID: 'PRD-0001',
        MATERIAL_ID: 'MAT-0002',
        CANTIDAD_PREVISTA: 2,
        UNIDAD: 'Kilogramo',
        ESTADO: 'Activa',
        OBSERVACIONES: ''
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_unidad_incompatible=true'
    );

  } catch (error) {
    mensajeError = String(
      error && error.message
        ? error.message
        : error
    );

    rechazadoPorUnidad =
      mensajeError.indexOf(
        'UNIDAD debe coincidir con la unidad del material MAT-0002'
      ) !== -1 &&
      mensajeError.indexOf(
        'Esperada: Unidad'
      ) !== -1 &&
      mensajeError.indexOf(
        'Recibida: Kilogramo'
      ) !== -1;

    if (rechazadoPorUnidad) {
      console.log(
        'OK error_controlado=' + mensajeError
      );
    } else {
      console.log(
        'ERR error_distinto_al_esperado=' + mensajeError
      );
    }
  }

  SpreadsheetApp.flush();

  var filasRelacionDespues = hojaRelacion.getLastRow();
  var filasHistorialDespues = hojaHistorial.getLastRow();

  console.log(
    'OK filas_relacion_antes=' +
    filasRelacionAntes
  );

  console.log(
    'OK filas_relacion_despues=' +
    filasRelacionDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  if (!rechazadoPorUnidad) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_UNIDAD_PRODUCTO_MATERIAL_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio no rechazó específicamente la unidad incompatible'
    );
  }

  if (
    filasRelacionAntes !==
    filasRelacionDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_UNIDAD_PRODUCTO_MATERIAL_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: cambió el número de filas de 09_PRODUCTO_MATERIAL'
    );
  }

  if (
    filasHistorialAntes !==
    filasHistorialDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_UNIDAD_PRODUCTO_MATERIAL_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: se generó historial durante el dryRun rechazado'
    );
  }

  console.log(
    'OK unidad_incompatible_rechazada=true'
  );

  console.log(
    'OK relacion_sin_cambios=true'
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_coherencia_unidad_producto_material'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_UNIDAD_PRODUCTO_MATERIAL_REPOSITORIO result=OK'
  );

  return true;
}

function retirarDuplicadoTareaMaterialAuditoria() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=RETIRAR_DUPLICADO_TAREA_MATERIAL'
  );

  var resultado = desactivarRegistro(
    'TAREA_MATERIAL',
    'TMA-0003'
  );

  console.log(
    'OK entidad=TAREA_MATERIAL id=TMA-0003 activo=NO'
  );

  console.log(
    'NEXT verificar_fila_e_historial'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=RETIRAR_DUPLICADO_TAREA_MATERIAL result=OK'
  );

  return resultado;
}

function auditarUnidadTareaMaterialRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_UNIDAD_TAREA_MATERIAL_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaRelacion = ss.getSheetByName('10_TAREA_MATERIAL');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');

  if (!hojaRelacion) {
    console.log('ERR hoja_no_existe=10_TAREA_MATERIAL');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_UNIDAD_TAREA_MATERIAL_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 10_TAREA_MATERIAL'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=91_HISTORIAL');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_UNIDAD_TAREA_MATERIAL_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 91_HISTORIAL'
    );
  }

  var filasRelacionAntes = hojaRelacion.getLastRow();
  var filasHistorialAntes = hojaHistorial.getLastRow();

  var rechazadoPorUnidad = false;
  var mensajeError = '';

  try {
    insertarRegistroTransaccional(
      'TAREA_MATERIAL',
      {
        TAREA_ID: 'TAR-0002',
        MATERIAL_ID: 'MAT-0002',
        CANTIDAD_PREVISTA: 5,
        CANTIDAD_CONSUMIDA: 0,
        CANTIDAD_DESPERDICIADA: 0,
        UNIDAD: 'Kilogramo',
        ESTADO: 'Activa',
        MOTIVO_DESVIACION: '',
        OBSERVACIONES: ''
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_unidad_incompatible=true'
    );

  } catch (error) {
    mensajeError = String(
      error && error.message
        ? error.message
        : error
    );

    rechazadoPorUnidad =
      mensajeError.indexOf(
        'UNIDAD debe coincidir con la unidad del material MAT-0002'
      ) !== -1 &&
      mensajeError.indexOf(
        'Esperada: Unidad'
      ) !== -1 &&
      mensajeError.indexOf(
        'Recibida: Kilogramo'
      ) !== -1;

    if (rechazadoPorUnidad) {
      console.log(
        'OK error_controlado=' + mensajeError
      );
    } else {
      console.log(
        'ERR error_distinto_al_esperado=' + mensajeError
      );
    }
  }

  SpreadsheetApp.flush();

  var filasRelacionDespues = hojaRelacion.getLastRow();
  var filasHistorialDespues = hojaHistorial.getLastRow();

  console.log(
    'OK filas_relacion_antes=' +
    filasRelacionAntes
  );

  console.log(
    'OK filas_relacion_despues=' +
    filasRelacionDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  if (!rechazadoPorUnidad) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_UNIDAD_TAREA_MATERIAL_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio no rechazó específicamente la unidad incompatible'
    );
  }

  if (
    filasRelacionAntes !==
    filasRelacionDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_UNIDAD_TAREA_MATERIAL_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: cambió el número de filas de 10_TAREA_MATERIAL'
    );
  }

  if (
    filasHistorialAntes !==
    filasHistorialDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_UNIDAD_TAREA_MATERIAL_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: se generó historial durante el dryRun rechazado'
    );
  }

  console.log(
    'OK unidad_incompatible_rechazada=true'
  );

  console.log(
    'OK relacion_sin_cambios=true'
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_coherencia_unidad_tarea_material'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_UNIDAD_TAREA_MATERIAL_REPOSITORIO result=OK'
  );

  return true;
}

function auditarCantidadPrevistaCeroTareaMaterialRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_CANTIDAD_PREVISTA_CERO_TAREA_MATERIAL_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaRelacion = ss.getSheetByName('10_TAREA_MATERIAL');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');

  if (!hojaRelacion) {
    console.log('ERR hoja_no_existe=10_TAREA_MATERIAL');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CANTIDAD_PREVISTA_CERO_TAREA_MATERIAL_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 10_TAREA_MATERIAL'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=91_HISTORIAL');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CANTIDAD_PREVISTA_CERO_TAREA_MATERIAL_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 91_HISTORIAL'
    );
  }

  var filasRelacionAntes = hojaRelacion.getLastRow();
  var filasHistorialAntes = hojaHistorial.getLastRow();

  var rechazadoPorCantidad = false;
  var mensajeError = '';

  try {
    insertarRegistroTransaccional(
      'TAREA_MATERIAL',
      {
        TAREA_ID: 'TAR-0002',
        MATERIAL_ID: 'MAT-0002',
        CANTIDAD_PREVISTA: 0,
        CANTIDAD_CONSUMIDA: 0,
        CANTIDAD_DESPERDICIADA: 0,
        UNIDAD: 'Unidad',
        ESTADO: 'Activa',
        MOTIVO_DESVIACION: '',
        OBSERVACIONES: ''
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_cantidad_prevista_cero=true'
    );

  } catch (error) {
    mensajeError = String(
      error && error.message
        ? error.message
        : error
    );

    rechazadoPorCantidad =
      mensajeError.indexOf(
        'CANTIDAD_PREVISTA debe ser un número mayor que 0: 0'
      ) !== -1;

    if (rechazadoPorCantidad) {
      console.log(
        'OK error_controlado=' + mensajeError
      );
    } else {
      console.log(
        'ERR error_distinto_al_esperado=' + mensajeError
      );
    }
  }

  SpreadsheetApp.flush();

  var filasRelacionDespues = hojaRelacion.getLastRow();
  var filasHistorialDespues = hojaHistorial.getLastRow();

  console.log(
    'OK filas_relacion_antes=' +
    filasRelacionAntes
  );

  console.log(
    'OK filas_relacion_despues=' +
    filasRelacionDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  if (!rechazadoPorCantidad) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CANTIDAD_PREVISTA_CERO_TAREA_MATERIAL_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio no rechazó específicamente CANTIDAD_PREVISTA=0'
    );
  }

  if (
    filasRelacionAntes !==
    filasRelacionDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CANTIDAD_PREVISTA_CERO_TAREA_MATERIAL_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: cambió el número de filas de 10_TAREA_MATERIAL'
    );
  }

  if (
    filasHistorialAntes !==
    filasHistorialDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CANTIDAD_PREVISTA_CERO_TAREA_MATERIAL_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: se generó historial durante el dryRun rechazado'
    );
  }

  console.log(
    'OK cantidad_prevista_cero_rechazada=true'
  );

  console.log(
    'OK relacion_sin_cambios=true'
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_cantidad_prevista_tarea_material'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_CANTIDAD_PREVISTA_CERO_TAREA_MATERIAL_REPOSITORIO result=OK'
  );

  return true;
}


function auditarCapacidadSemanalPersonaEquipoRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_CAPACIDAD_SEMANAL_PERSONA_EQUIPO_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaRecursos = ss.getSheetByName('11_PERSONAS_EQUIPOS');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');

  if (!hojaRecursos) {
    console.log('ERR hoja_no_existe=11_PERSONAS_EQUIPOS');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CAPACIDAD_SEMANAL_PERSONA_EQUIPO_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 11_PERSONAS_EQUIPOS'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=91_HISTORIAL');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CAPACIDAD_SEMANAL_PERSONA_EQUIPO_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 91_HISTORIAL'
    );
  }

  var filasRecursosAntes = hojaRecursos.getLastRow();
  var filasHistorialAntes = hojaHistorial.getLastRow();

  var rechazadoPorCapacidad = false;
  var mensajeError = '';

  try {
    insertarRegistroTransaccional(
      'PERSONA_EQUIPO',
      {
        TIPO: 'Persona',
        NOMBRE: 'AUDITORIA CAPACIDAD CERO REPOSITORIO',
        ROL: 'Prueba controlada',
        CAPACIDAD_SEMANAL_DIAS: 0,
        DISPONIBILIDAD: 'Completa',
        ESTADO: 'Disponible',
        OBSERVACIONES: ''
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_capacidad_semanal_cero=true'
    );

  } catch (error) {
    mensajeError = String(
      error && error.message
        ? error.message
        : error
    );

    rechazadoPorCapacidad =
      mensajeError.indexOf(
        'CAPACIDAD_SEMANAL_DIAS debe ser un número mayor que 0 y menor o igual que 7: 0'
      ) !== -1;

    if (rechazadoPorCapacidad) {
      console.log(
        'OK error_controlado=' + mensajeError
      );
    } else {
      console.log(
        'ERR error_distinto_al_esperado=' + mensajeError
      );
    }
  }

  SpreadsheetApp.flush();

  var filasRecursosDespues = hojaRecursos.getLastRow();
  var filasHistorialDespues = hojaHistorial.getLastRow();

  console.log(
    'OK filas_recursos_antes=' +
    filasRecursosAntes
  );

  console.log(
    'OK filas_recursos_despues=' +
    filasRecursosDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  if (!rechazadoPorCapacidad) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CAPACIDAD_SEMANAL_PERSONA_EQUIPO_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio no rechazó específicamente CAPACIDAD_SEMANAL_DIAS=0'
    );
  }

  if (
    filasRecursosAntes !==
    filasRecursosDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CAPACIDAD_SEMANAL_PERSONA_EQUIPO_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: cambió el número de filas de 11_PERSONAS_EQUIPOS'
    );
  }

  if (
    filasHistorialAntes !==
    filasHistorialDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CAPACIDAD_SEMANAL_PERSONA_EQUIPO_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: se generó historial durante el dryRun rechazado'
    );
  }

  console.log(
    'OK capacidad_semanal_cero_rechazada=true'
  );

  console.log(
    'OK recursos_sin_cambios=true'
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_capacidad_semanal_persona_equipo'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_CAPACIDAD_SEMANAL_PERSONA_EQUIPO_REPOSITORIO result=OK'
  );

  return true;
}

function auditarDisponibilidadEstadoPersonaEquipoRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_DISPONIBILIDAD_ESTADO_PERSONA_EQUIPO_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaRecursos = ss.getSheetByName('11_PERSONAS_EQUIPOS');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');

  if (!hojaRecursos) {
    console.log('ERR hoja_no_existe=11_PERSONAS_EQUIPOS');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_DISPONIBILIDAD_ESTADO_PERSONA_EQUIPO_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 11_PERSONAS_EQUIPOS'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=91_HISTORIAL');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_DISPONIBILIDAD_ESTADO_PERSONA_EQUIPO_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 91_HISTORIAL'
    );
  }

  var filasRecursosAntes = hojaRecursos.getLastRow();
  var filasHistorialAntes = hojaHistorial.getLastRow();

  var rechazadoPorCoherencia = false;
  var mensajeError = '';

  try {
    insertarRegistroTransaccional(
      'PERSONA_EQUIPO',
      {
        TIPO: 'Persona',
        NOMBRE: 'AUDITORIA DISPONIBILIDAD ESTADO REPOSITORIO',
        ROL: 'Prueba controlada',
        CAPACIDAD_SEMANAL_DIAS: 5,
        DISPONIBILIDAD: 'No disponible',
        ESTADO: 'Disponible',
        OBSERVACIONES: ''
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_disponibilidad_estado_incompatibles=true'
    );

  } catch (error) {
    mensajeError = String(
      error && error.message
        ? error.message
        : error
    );

    rechazadoPorCoherencia =
      mensajeError.indexOf(
        'DISPONIBILIDAD No disponible no es compatible con ESTADO Disponible'
      ) !== -1;

    if (rechazadoPorCoherencia) {
      console.log(
        'OK error_controlado=' + mensajeError
      );
    } else {
      console.log(
        'ERR error_distinto_al_esperado=' + mensajeError
      );
    }
  }

  SpreadsheetApp.flush();

  var filasRecursosDespues = hojaRecursos.getLastRow();
  var filasHistorialDespues = hojaHistorial.getLastRow();

  console.log(
    'OK filas_recursos_antes=' +
    filasRecursosAntes
  );

  console.log(
    'OK filas_recursos_despues=' +
    filasRecursosDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  if (!rechazadoPorCoherencia) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_DISPONIBILIDAD_ESTADO_PERSONA_EQUIPO_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio no rechazó específicamente la combinación DISPONIBILIDAD/ESTADO incompatible'
    );
  }

  if (
    filasRecursosAntes !==
    filasRecursosDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_DISPONIBILIDAD_ESTADO_PERSONA_EQUIPO_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: cambió el número de filas de 11_PERSONAS_EQUIPOS'
    );
  }

  if (
    filasHistorialAntes !==
    filasHistorialDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_DISPONIBILIDAD_ESTADO_PERSONA_EQUIPO_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: se generó historial durante el dryRun rechazado'
    );
  }

  console.log(
    'OK disponibilidad_estado_incompatibles_rechazados=true'
  );

  console.log(
    'OK recursos_sin_cambios=true'
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_coherencia_disponibilidad_estado_persona_equipo'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_DISPONIBILIDAD_ESTADO_PERSONA_EQUIPO_REPOSITORIO result=OK'
  );

  return true;
}

function auditarFechaResolucionDecisionRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_FECHA_RESOLUCION_DECISION_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDecisiones = ss.getSheetByName('12_DECISIONES');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');

  if (!hojaDecisiones) {
    console.log('ERR hoja_no_existe=12_DECISIONES');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_FECHA_RESOLUCION_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 12_DECISIONES'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=91_HISTORIAL');
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_FECHA_RESOLUCION_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 91_HISTORIAL'
    );
  }

  var idDecision = 'DEC-0001';

  var registroAntes = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  if (!registroAntes) {
    console.log(
      'ERR decision_no_existe=' + idDecision
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_FECHA_RESOLUCION_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe ' + idDecision
    );
  }

  var filasDecisionesAntes =
    hojaDecisiones.getLastRow();

  var filasHistorialAntes =
    hojaHistorial.getLastRow();

  var fechaResolucionAntes =
    registroAntes.FECHA_RESOLUCION;

  var fechaModificacionAntes =
    registroAntes.FECHA_MODIFICACION;

  var rechazadoPorFecha = false;
  var mensajeError = '';

  try {
    actualizarRegistroTransaccional(
      'DECISION',
      idDecision,
      {
        ESTADO: 'Aprobada',
        RESOLUCION:
          'Decisión aprobada en prueba controlada',
        FECHA_RESOLUCION:
          new Date(2026, 6, 26)
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_fecha_resolucion_anterior=true'
    );

  } catch (error) {
    mensajeError = String(
      error && error.message
        ? error.message
        : error
    );

    rechazadoPorFecha =
      mensajeError.indexOf(
        'La fecha de resolución no puede ser anterior a la fecha de creación.'
      ) !== -1;

    if (rechazadoPorFecha) {
      console.log(
        'OK error_controlado=' +
        mensajeError
      );
    } else {
      console.log(
        'ERR error_distinto_al_esperado=' +
        mensajeError
      );
    }
  }

  SpreadsheetApp.flush();

  var registroDespues = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  var filasDecisionesDespues =
    hojaDecisiones.getLastRow();

  var filasHistorialDespues =
    hojaHistorial.getLastRow();

  var fechaResolucionSinCambios =
    compararValoresAuditoria_(
      fechaResolucionAntes,
      registroDespues.FECHA_RESOLUCION
    );

  var fechaModificacionSinCambios =
    compararValoresAuditoria_(
      fechaModificacionAntes,
      registroDespues.FECHA_MODIFICACION
    );

  console.log(
    'OK filas_decisiones_antes=' +
    filasDecisionesAntes
  );

  console.log(
    'OK filas_decisiones_despues=' +
    filasDecisionesDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  console.log(
    'OK fecha_resolucion_sin_cambios=' +
    fechaResolucionSinCambios
  );

  console.log(
    'OK fecha_modificacion_sin_cambios=' +
    fechaModificacionSinCambios
  );

  if (!rechazadoPorFecha) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_FECHA_RESOLUCION_DECISION_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio no rechazó específicamente la fecha de resolución anterior'
    );
  }

  if (
    filasDecisionesAntes !==
    filasDecisionesDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_FECHA_RESOLUCION_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: cambió el número de filas de 12_DECISIONES'
    );
  }

  if (
    filasHistorialAntes !==
    filasHistorialDespues
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_FECHA_RESOLUCION_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: se generó historial durante el dryRun rechazado'
    );
  }

  if (
    !fechaResolucionSinCambios ||
    !fechaModificacionSinCambios
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_FECHA_RESOLUCION_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: DEC-0001 fue modificada'
    );
  }

  console.log(
    'OK fecha_resolucion_anterior_rechazada=true'
  );

  console.log(
    'OK decision_sin_cambios=' +
    idDecision
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_coherencia_temporal_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_FECHA_RESOLUCION_DECISION_REPOSITORIO result=OK'
  );

  return true;
}

function auditarFechaLimiteDecisionRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_FECHA_LIMITE_DECISION_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDecisiones = ss.getSheetByName('12_DECISIONES');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');
  var idDecision = 'DEC-0001';

  if (!hojaDecisiones || !hojaHistorial) {
    throw new Error(
      'AUDITORIA_ERROR: faltan hojas requeridas'
    );
  }

  var registroAntes = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  if (!registroAntes) {
    throw new Error(
      'AUDITORIA_ERROR: no existe ' + idDecision
    );
  }

  var filasDecisionesAntes = hojaDecisiones.getLastRow();
  var filasHistorialAntes = hojaHistorial.getLastRow();
  var fechaLimiteAntes = registroAntes.FECHA_LIMITE;
  var fechaModificacionAntes =
    registroAntes.FECHA_MODIFICACION;

  var rechazoEsperado = false;

  try {
    actualizarRegistroTransaccional(
      'DECISION',
      idDecision,
      {
        FECHA_LIMITE: new Date(2026, 6, 26)
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_fecha_limite_anterior=true'
    );
  } catch (error) {
    var mensaje = String(
      error && error.message
        ? error.message
        : error
    );

    rechazoEsperado =
      mensaje.indexOf(
        'La fecha límite no puede ser anterior a la fecha de creación.'
      ) !== -1;

    if (rechazoEsperado) {
      console.log(
        'OK error_controlado=' + mensaje
      );
    } else {
      console.log(
        'ERR error_distinto_al_esperado=' + mensaje
      );
    }
  }

  SpreadsheetApp.flush();

  var registroDespues = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  var filasDecisionesDespues =
    hojaDecisiones.getLastRow();

  var filasHistorialDespues =
    hojaHistorial.getLastRow();

  var fechaLimiteSinCambios =
    compararValoresAuditoria_(
      fechaLimiteAntes,
      registroDespues.FECHA_LIMITE
    );

  var fechaModificacionSinCambios =
    compararValoresAuditoria_(
      fechaModificacionAntes,
      registroDespues.FECHA_MODIFICACION
    );

  console.log(
    'OK filas_decisiones_antes=' +
    filasDecisionesAntes
  );

  console.log(
    'OK filas_decisiones_despues=' +
    filasDecisionesDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  console.log(
    'OK fecha_limite_sin_cambios=' +
    fechaLimiteSinCambios
  );

  console.log(
    'OK fecha_modificacion_sin_cambios=' +
    fechaModificacionSinCambios
  );

  if (!rechazoEsperado) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_FECHA_LIMITE_DECISION_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio no rechazó la fecha límite anterior'
    );
  }

  if (
    filasDecisionesAntes !== filasDecisionesDespues ||
    filasHistorialAntes !== filasHistorialDespues ||
    !fechaLimiteSinCambios ||
    !fechaModificacionSinCambios
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_FECHA_LIMITE_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: la prueba produjo efectos laterales'
    );
  }

  console.log(
    'OK fecha_limite_anterior_rechazada=true'
  );

  console.log(
    'OK decision_sin_cambios=' + idDecision
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_validacion_fecha_limite_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_FECHA_LIMITE_DECISION_REPOSITORIO result=OK'
  );

  return true;
}

function auditarDecisionAbiertaConDatosCierreRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_DECISION_ABIERTA_CON_DATOS_CIERRE_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDecisiones = ss.getSheetByName('12_DECISIONES');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');
  var idDecision = 'DEC-0001';

  if (!hojaDecisiones) {
    console.log('ERR hoja_no_existe=12_DECISIONES');

    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_DECISION_ABIERTA_CON_DATOS_CIERRE_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 12_DECISIONES'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=91_HISTORIAL');

    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_DECISION_ABIERTA_CON_DATOS_CIERRE_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe la hoja 91_HISTORIAL'
    );
  }

  var registroAntes = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  if (!registroAntes) {
    console.log(
      'ERR decision_no_existe=' + idDecision
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_DECISION_ABIERTA_CON_DATOS_CIERRE_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe ' + idDecision
    );
  }

  var filasDecisionesAntes =
    hojaDecisiones.getLastRow();

  var filasHistorialAntes =
    hojaHistorial.getLastRow();

  var estadoAntes =
    registroAntes.ESTADO;

  var resolucionAntes =
    registroAntes.RESOLUCION;

  var fechaResolucionAntes =
    registroAntes.FECHA_RESOLUCION;

  var fechaModificacionAntes =
    registroAntes.FECHA_MODIFICACION;

  var rechazoEsperado = false;
  var mensajeError = '';

  try {
    actualizarRegistroTransaccional(
      'DECISION',
      idDecision,
      {
        ESTADO: 'Pendiente de aprobación',
        RESOLUCION: 'Texto indebido',
        FECHA_RESOLUCION: new Date(2026, 6, 27)
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_estado_abierto_con_datos_cierre=true'
    );

  } catch (error) {
    mensajeError = String(
      error && error.message
        ? error.message
        : error
    );

    rechazoEsperado =
      mensajeError.indexOf(
        'Una decisión abierta no puede contener resolución ni fecha de resolución.'
      ) !== -1;

    if (rechazoEsperado) {
      console.log(
        'OK error_controlado=' +
        mensajeError
      );
    } else {
      console.log(
        'ERR error_distinto_al_esperado=' +
        mensajeError
      );
    }
  }

  SpreadsheetApp.flush();

  var registroDespues = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  var filasDecisionesDespues =
    hojaDecisiones.getLastRow();

  var filasHistorialDespues =
    hojaHistorial.getLastRow();

  var estadoSinCambios =
    compararValoresAuditoria_(
      estadoAntes,
      registroDespues.ESTADO
    );

  var resolucionSinCambios =
    compararValoresAuditoria_(
      resolucionAntes,
      registroDespues.RESOLUCION
    );

  var fechaResolucionSinCambios =
    compararValoresAuditoria_(
      fechaResolucionAntes,
      registroDespues.FECHA_RESOLUCION
    );

  var fechaModificacionSinCambios =
    compararValoresAuditoria_(
      fechaModificacionAntes,
      registroDespues.FECHA_MODIFICACION
    );

  console.log(
    'OK filas_decisiones_antes=' +
    filasDecisionesAntes
  );

  console.log(
    'OK filas_decisiones_despues=' +
    filasDecisionesDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  console.log(
    'OK estado_sin_cambios=' +
    estadoSinCambios
  );

  console.log(
    'OK resolucion_sin_cambios=' +
    resolucionSinCambios
  );

  console.log(
    'OK fecha_resolucion_sin_cambios=' +
    fechaResolucionSinCambios
  );

  console.log(
    'OK fecha_modificacion_sin_cambios=' +
    fechaModificacionSinCambios
  );

  if (!rechazoEsperado) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_DECISION_ABIERTA_CON_DATOS_CIERRE_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio aceptó una decisión abierta con datos de cierre'
    );
  }

  if (
    filasDecisionesAntes !== filasDecisionesDespues ||
    filasHistorialAntes !== filasHistorialDespues ||
    !estadoSinCambios ||
    !resolucionSinCambios ||
    !fechaResolucionSinCambios ||
    !fechaModificacionSinCambios
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_DECISION_ABIERTA_CON_DATOS_CIERRE_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: la prueba produjo efectos laterales'
    );
  }

  console.log(
    'OK decision_abierta_con_datos_cierre_rechazada=true'
  );

  console.log(
    'OK decision_sin_cambios=' +
    idDecision
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_coherencia_estado_datos_cierre_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_DECISION_ABIERTA_CON_DATOS_CIERRE_REPOSITORIO result=OK'
  );

  return true;
}

function auditarResponsableDecisionRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_RESPONSABLE_DECISION_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDecisiones = ss.getSheetByName('12_DECISIONES');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');
  var idDecision = 'DEC-0001';

  if (!hojaDecisiones) {
    console.log('ERR hoja_no_existe=12_DECISIONES');
    throw new Error(
      'AUDITORIA_ERROR: no existe 12_DECISIONES'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=91_HISTORIAL');
    throw new Error(
      'AUDITORIA_ERROR: no existe 91_HISTORIAL'
    );
  }

  var registroAntes = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  if (!registroAntes) {
    console.log(
      'ERR decision_no_existe=' + idDecision
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe ' + idDecision
    );
  }

  var filasDecisionesAntes =
    hojaDecisiones.getLastRow();

  var filasHistorialAntes =
    hojaHistorial.getLastRow();

  var responsableAntes =
    registroAntes.RESPONSABLE_ID;

  var fechaModificacionAntes =
    registroAntes.FECHA_MODIFICACION;

  /*
   * Caso 1:
   * responsable existente con ESTADO Inactivo.
   */
  var rechazoInactivo = false;
  var mensajeInactivo = '';

  try {
    actualizarRegistroTransaccional(
      'DECISION',
      idDecision,
      {
        RESPONSABLE_ID: 'PER-0002'
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_responsable_inactivo=true'
    );

  } catch (errorInactivo) {
    mensajeInactivo = String(
      errorInactivo && errorInactivo.message
        ? errorInactivo.message
        : errorInactivo
    );

    rechazoInactivo =
      mensajeInactivo.indexOf(
        'RESPONSABLE_ID no existe o no está activo: PER-0002'
      ) !== -1;

    if (rechazoInactivo) {
      console.log(
        'OK responsable_inactivo_rechazado=' +
        mensajeInactivo
      );
    } else {
      console.log(
        'ERR error_inactivo_distinto=' +
        mensajeInactivo
      );
    }
  }

  /*
   * Caso 2:
   * responsable inexistente.
   */
  var rechazoInexistente = false;
  var mensajeInexistente = '';

  try {
    actualizarRegistroTransaccional(
      'DECISION',
      idDecision,
      {
        RESPONSABLE_ID: 'PER-9999'
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_responsable_inexistente=true'
    );

  } catch (errorInexistente) {
    mensajeInexistente = String(
      errorInexistente && errorInexistente.message
        ? errorInexistente.message
        : errorInexistente
    );

    rechazoInexistente =
      mensajeInexistente.indexOf(
        'RESPONSABLE_ID no existe o no está activo: PER-9999'
      ) !== -1;

    if (rechazoInexistente) {
      console.log(
        'OK responsable_inexistente_rechazado=' +
        mensajeInexistente
      );
    } else {
      console.log(
        'ERR error_inexistente_distinto=' +
        mensajeInexistente
      );
    }
  }

  SpreadsheetApp.flush();

  var registroDespues = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  var filasDecisionesDespues =
    hojaDecisiones.getLastRow();

  var filasHistorialDespues =
    hojaHistorial.getLastRow();

  var responsableSinCambios =
    compararValoresAuditoria_(
      responsableAntes,
      registroDespues.RESPONSABLE_ID
    );

  var fechaModificacionSinCambios =
    compararValoresAuditoria_(
      fechaModificacionAntes,
      registroDespues.FECHA_MODIFICACION
    );

  console.log(
    'OK filas_decisiones_antes=' +
    filasDecisionesAntes
  );

  console.log(
    'OK filas_decisiones_despues=' +
    filasDecisionesDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  console.log(
    'OK responsable_sin_cambios=' +
    responsableSinCambios
  );

  console.log(
    'OK fecha_modificacion_sin_cambios=' +
    fechaModificacionSinCambios
  );

  if (!rechazoInactivo) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_RESPONSABLE_DECISION_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio aceptó PER-0002 inactivo'
    );
  }

  if (!rechazoInexistente) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_RESPONSABLE_DECISION_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio aceptó PER-9999 inexistente'
    );
  }

  if (
    filasDecisionesAntes !==
      filasDecisionesDespues ||
    filasHistorialAntes !==
      filasHistorialDespues ||
    !responsableSinCambios ||
    !fechaModificacionSinCambios
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_RESPONSABLE_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: la prueba produjo efectos laterales'
    );
  }

  console.log(
    'OK responsable_inactivo_rechazado=true'
  );

  console.log(
    'OK responsable_inexistente_rechazado=true'
  );

  console.log(
    'OK decision_sin_cambios=' +
    idDecision
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_validacion_responsable_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_RESPONSABLE_DECISION_REPOSITORIO result=OK'
  );

  return true;
}

function prepararProyectoInactivoAuditoriaDecision() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=PREPARAR_PROYECTO_INACTIVO_AUDITORIA_DECISION'
  );

  var proyectoAntes = obtenerRegistroPorId(
    'PROYECTO',
    'PRO-0002'
  );

  if (!proyectoAntes) {
    console.log('ERR proyecto_no_existe=PRO-0002');

    console.log(
      'ENGREMIAT_PACKAGE_END package=PREPARAR_PROYECTO_INACTIVO_AUDITORIA_DECISION result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe PRO-0002'
    );
  }

  if (proyectoAntes.ACTIVO !== 'SÍ') {
    console.log(
      'WARN proyecto_ya_inactivo=PRO-0002'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=PREPARAR_PROYECTO_INACTIVO_AUDITORIA_DECISION result=OK'
    );

    return true;
  }

  actualizarRegistroTransaccional(
    'PROYECTO',
    'PRO-0002',
    {
      ACTIVO: 'NO'
    },
    {
      dryRun: false,
      origen: 'TEST'
    }
  );

  var proyectoDespues = obtenerRegistroPorId(
    'PROYECTO',
    'PRO-0002'
  );

  if (
    !proyectoDespues ||
    proyectoDespues.ACTIVO !== 'NO'
  ) {
    console.log(
      'ERR proyecto_no_quedo_inactivo=PRO-0002'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=PREPARAR_PROYECTO_INACTIVO_AUDITORIA_DECISION result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: PRO-0002 no quedó inactivo'
    );
  }

  console.log(
    'OK proyecto_inactivo=PRO-0002'
  );

  console.log(
    'NEXT comprobar_desplegable_proyecto_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=PREPARAR_PROYECTO_INACTIVO_AUDITORIA_DECISION result=OK'
  );

  return true;
}

function auditarProyectoDecisionRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_PROYECTO_DECISION_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDecisiones = ss.getSheetByName('12_DECISIONES');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');
  var idDecision = 'DEC-0001';

  if (!hojaDecisiones) {
    console.log('ERR hoja_no_existe=12_DECISIONES');

    throw new Error(
      'AUDITORIA_ERROR: no existe 12_DECISIONES'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=91_HISTORIAL');

    throw new Error(
      'AUDITORIA_ERROR: no existe 91_HISTORIAL'
    );
  }

  var registroAntes = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  if (!registroAntes) {
    console.log(
      'ERR decision_no_existe=' + idDecision
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe ' + idDecision
    );
  }

  var filasDecisionesAntes =
    hojaDecisiones.getLastRow();

  var filasHistorialAntes =
    hojaHistorial.getLastRow();

  var proyectoAntes =
    registroAntes.PROYECTO_ID;

  var fechaModificacionAntes =
    registroAntes.FECHA_MODIFICACION;

  /*
   * Caso 1:
   * proyecto existente, pero desactivado.
   */
  var rechazoInactivo = false;
  var mensajeInactivo = '';

  try {
    actualizarRegistroTransaccional(
      'DECISION',
      idDecision,
      {
        PROYECTO_ID: 'PRO-0002'
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_proyecto_inactivo=true'
    );
  } catch (errorInactivo) {
    mensajeInactivo = String(
      errorInactivo && errorInactivo.message
        ? errorInactivo.message
        : errorInactivo
    );

    rechazoInactivo =
      mensajeInactivo.indexOf(
        'PROYECTO_ID no existe o no está activo: PRO-0002'
      ) !== -1;

    if (rechazoInactivo) {
      console.log(
        'OK proyecto_inactivo_rechazado=' +
        mensajeInactivo
      );
    } else {
      console.log(
        'ERR error_inactivo_distinto=' +
        mensajeInactivo
      );
    }
  }

  /*
   * Caso 2:
   * proyecto inexistente.
   */
  var rechazoInexistente = false;
  var mensajeInexistente = '';

  try {
    actualizarRegistroTransaccional(
      'DECISION',
      idDecision,
      {
        PROYECTO_ID: 'PRO-9999'
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_proyecto_inexistente=true'
    );
  } catch (errorInexistente) {
    mensajeInexistente = String(
      errorInexistente && errorInexistente.message
        ? errorInexistente.message
        : errorInexistente
    );

    rechazoInexistente =
      mensajeInexistente.indexOf(
        'PROYECTO_ID no existe o no está activo: PRO-9999'
      ) !== -1;

    if (rechazoInexistente) {
      console.log(
        'OK proyecto_inexistente_rechazado=' +
        mensajeInexistente
      );
    } else {
      console.log(
        'ERR error_inexistente_distinto=' +
        mensajeInexistente
      );
    }
  }

  SpreadsheetApp.flush();

  var registroDespues = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  var filasDecisionesDespues =
    hojaDecisiones.getLastRow();

  var filasHistorialDespues =
    hojaHistorial.getLastRow();

  var proyectoSinCambios =
    compararValoresAuditoria_(
      proyectoAntes,
      registroDespues.PROYECTO_ID
    );

  var fechaModificacionSinCambios =
    compararValoresAuditoria_(
      fechaModificacionAntes,
      registroDespues.FECHA_MODIFICACION
    );

  console.log(
    'OK filas_decisiones_antes=' +
    filasDecisionesAntes
  );

  console.log(
    'OK filas_decisiones_despues=' +
    filasDecisionesDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  console.log(
    'OK proyecto_sin_cambios=' +
    proyectoSinCambios
  );

  console.log(
    'OK fecha_modificacion_sin_cambios=' +
    fechaModificacionSinCambios
  );

  if (!rechazoInactivo) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_PROYECTO_DECISION_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio aceptó PRO-0002 inactivo'
    );
  }

  if (!rechazoInexistente) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_PROYECTO_DECISION_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio aceptó PRO-9999 inexistente'
    );
  }

  if (
    filasDecisionesAntes !== filasDecisionesDespues ||
    filasHistorialAntes !== filasHistorialDespues ||
    !proyectoSinCambios ||
    !fechaModificacionSinCambios
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_PROYECTO_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: la prueba produjo efectos laterales'
    );
  }

  console.log(
    'OK proyecto_inactivo_rechazado=true'
  );

  console.log(
    'OK proyecto_inexistente_rechazado=true'
  );

  console.log(
    'OK decision_sin_cambios=' +
    idDecision
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_validacion_proyecto_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_PROYECTO_DECISION_REPOSITORIO result=OK'
  );

  return true;
}


function auditarCatalogosDecisionRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_CATALOGOS_DECISION_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDecisiones = ss.getSheetByName('12_DECISIONES');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');
  var idDecision = 'DEC-0001';

  if (!hojaDecisiones) {
    console.log('ERR hoja_no_existe=12_DECISIONES');

    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CATALOGOS_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 12_DECISIONES'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=91_HISTORIAL');

    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CATALOGOS_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 91_HISTORIAL'
    );
  }

  var registroAntes = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  if (!registroAntes) {
    console.log(
      'ERR decision_no_existe=' + idDecision
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CATALOGOS_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe ' + idDecision
    );
  }

  var filasDecisionesAntes =
    hojaDecisiones.getLastRow();

  var filasHistorialAntes =
    hojaHistorial.getLastRow();

  var tipoAntes =
    registroAntes.TIPO;

  var estadoAntes =
    registroAntes.ESTADO;

  var impactoAntes =
    registroAntes.IMPACTO;

  var fechaModificacionAntes =
    registroAntes.FECHA_MODIFICACION;

  /*
   * CASO 1 — TIPO inválido
   */
  var tipoRechazado = false;
  var mensajeTipo = '';

  try {
    actualizarRegistroTransaccional(
      'DECISION',
      idDecision,
      {
        TIPO: 'TIPO_INVALIDO'
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_tipo_invalido=true'
    );
  } catch (errorTipo) {
    mensajeTipo = String(
      errorTipo && errorTipo.message
        ? errorTipo.message
        : errorTipo
    );

    tipoRechazado =
      mensajeTipo.indexOf('TIPO') !== -1 &&
      mensajeTipo.indexOf('TIPO_INVALIDO') !== -1;

    if (tipoRechazado) {
      console.log(
        'OK tipo_invalido_rechazado=' +
        mensajeTipo
      );
    } else {
      console.log(
        'ERR error_tipo_distinto=' +
        mensajeTipo
      );
    }
  }

  /*
   * CASO 2 — ESTADO inválido
   */
  var estadoRechazado = false;
  var mensajeEstado = '';

  try {
    actualizarRegistroTransaccional(
      'DECISION',
      idDecision,
      {
        ESTADO: 'ESTADO_INVALIDO'
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_estado_invalido=true'
    );
  } catch (errorEstado) {
    mensajeEstado = String(
      errorEstado && errorEstado.message
        ? errorEstado.message
        : errorEstado
    );

    estadoRechazado =
      mensajeEstado.indexOf('ESTADO') !== -1 &&
      mensajeEstado.indexOf('ESTADO_INVALIDO') !== -1;

    if (estadoRechazado) {
      console.log(
        'OK estado_invalido_rechazado=' +
        mensajeEstado
      );
    } else {
      console.log(
        'ERR error_estado_distinto=' +
        mensajeEstado
      );
    }
  }

  /*
   * CASO 3 — IMPACTO inválido
   */
  var impactoRechazado = false;
  var mensajeImpacto = '';

  try {
    actualizarRegistroTransaccional(
      'DECISION',
      idDecision,
      {
        IMPACTO: 'IMPACTO_INVALIDO'
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

    console.log(
      'ERR repositorio_acepto_impacto_invalido=true'
    );
  } catch (errorImpacto) {
    mensajeImpacto = String(
      errorImpacto && errorImpacto.message
        ? errorImpacto.message
        : errorImpacto
    );

    impactoRechazado =
      mensajeImpacto.indexOf('IMPACTO') !== -1 &&
      mensajeImpacto.indexOf('IMPACTO_INVALIDO') !== -1;

    if (impactoRechazado) {
      console.log(
        'OK impacto_invalido_rechazado=' +
        mensajeImpacto
      );
    } else {
      console.log(
        'ERR error_impacto_distinto=' +
        mensajeImpacto
      );
    }
  }

  SpreadsheetApp.flush();

  var registroDespues = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  var filasDecisionesDespues =
    hojaDecisiones.getLastRow();

  var filasHistorialDespues =
    hojaHistorial.getLastRow();

  var tipoSinCambios =
    compararValoresAuditoria_(
      tipoAntes,
      registroDespues.TIPO
    );

  var estadoSinCambios =
    compararValoresAuditoria_(
      estadoAntes,
      registroDespues.ESTADO
    );

  var impactoSinCambios =
    compararValoresAuditoria_(
      impactoAntes,
      registroDespues.IMPACTO
    );

  var fechaModificacionSinCambios =
    compararValoresAuditoria_(
      fechaModificacionAntes,
      registroDespues.FECHA_MODIFICACION
    );

  console.log(
    'OK filas_decisiones_antes=' +
    filasDecisionesAntes
  );

  console.log(
    'OK filas_decisiones_despues=' +
    filasDecisionesDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  console.log(
    'OK tipo_sin_cambios=' +
    tipoSinCambios
  );

  console.log(
    'OK estado_sin_cambios=' +
    estadoSinCambios
  );

  console.log(
    'OK impacto_sin_cambios=' +
    impactoSinCambios
  );

  console.log(
    'OK fecha_modificacion_sin_cambios=' +
    fechaModificacionSinCambios
  );

  if (!tipoRechazado) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CATALOGOS_DECISION_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio aceptó TIPO inválido'
    );
  }

  if (!estadoRechazado) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CATALOGOS_DECISION_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio aceptó ESTADO inválido'
    );
  }

  if (!impactoRechazado) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CATALOGOS_DECISION_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio aceptó IMPACTO inválido'
    );
  }

  if (
    filasDecisionesAntes !== filasDecisionesDespues ||
    filasHistorialAntes !== filasHistorialDespues ||
    !tipoSinCambios ||
    !estadoSinCambios ||
    !impactoSinCambios ||
    !fechaModificacionSinCambios
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CATALOGOS_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: la prueba produjo efectos laterales'
    );
  }

  console.log(
    'OK tipo_invalido_rechazado=true'
  );

  console.log(
    'OK estado_invalido_rechazado=true'
  );

  console.log(
    'OK impacto_invalido_rechazado=true'
  );

  console.log(
    'OK decision_sin_cambios=' +
    idDecision
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_catalogos_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_CATALOGOS_DECISION_REPOSITORIO result=OK'
  );

  return true;
}

function diagnosticarCatalogosDecisionRepository() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=DIAGNOSTICAR_CATALOGOS_DECISION_REPOSITORY'
  );

  var pruebas = [
    {
      campo: 'TIPO',
      valor: 'TIPO_INVALIDO',
      rango: 'CFG_TIPO_DECISION'
    },
    {
      campo: 'ESTADO',
      valor: 'ESTADO_INVALIDO',
      rango: 'CFG_ESTADO_DECISION'
    },
    {
      campo: 'IMPACTO',
      valor: 'IMPACTO_INVALIDO',
      rango: 'CFG_IMPACTO'
    }
  ];

  var rechazadas = 0;

  pruebas.forEach(function (prueba) {
    try {
      validarValorCatalogoRepository_(
        prueba.valor,
        prueba.rango,
        prueba.campo
      );

      console.log(
        'ERR validador_acepto=' +
        prueba.campo +
        ' valor=' +
        prueba.valor +
        ' rango=' +
        prueba.rango
      );
    } catch (error) {
      rechazadas++;

      console.log(
        'OK validador_rechazo=' +
        prueba.campo +
        ' mensaje=' +
        String(
          error && error.message
            ? error.message
            : error
        )
      );
    }
  });

  console.log(
    'OK catalogos_rechazados=' +
    rechazadas +
    '/3'
  );

  if (rechazadas !== 3) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=DIAGNOSTICAR_CATALOGOS_DECISION_REPOSITORY result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: validarValorCatalogoRepository_ no rechazó todos los valores inválidos'
    );
  }

  console.log(
    'NEXT revisar_llamadas_catalogo_bloque_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=DIAGNOSTICAR_CATALOGOS_DECISION_REPOSITORY result=OK'
  );

  return true;
}

function auditarCamposObligatoriosDecisionRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_CAMPOS_OBLIGATORIOS_DECISION_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDecisiones = ss.getSheetByName('12_DECISIONES');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');
  var idDecision = 'DEC-0001';

  if (!hojaDecisiones) {
    console.log('ERR hoja_no_existe=12_DECISIONES');

    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CAMPOS_OBLIGATORIOS_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 12_DECISIONES'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=91_HISTORIAL');

    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CAMPOS_OBLIGATORIOS_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 91_HISTORIAL'
    );
  }

  var registroAntes = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  if (!registroAntes) {
    console.log(
      'ERR decision_no_existe=' + idDecision
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CAMPOS_OBLIGATORIOS_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe ' + idDecision
    );
  }

  var filasDecisionesAntes =
    hojaDecisiones.getLastRow();

  var filasHistorialAntes =
    hojaHistorial.getLastRow();

  var proyectoAntes =
    registroAntes.PROYECTO_ID;

  var tituloAntes =
    registroAntes.TITULO;

  var tipoAntes =
    registroAntes.TIPO;

  var estadoAntes =
    registroAntes.ESTADO;

  var fechaModificacionAntes =
    registroAntes.FECHA_MODIFICACION;

  var pruebas = [
    {
      id: 'PROYECTO_ID_VACIO',
      campo: 'PROYECTO_ID',
      valor: '',
      textoEsperado: 'PROYECTO_ID'
    },
    {
      id: 'TITULO_VACIO',
      campo: 'TITULO',
      valor: '',
      textoEsperado: 'TITULO'
    },
    {
      id: 'TITULO_ESPACIOS',
      campo: 'TITULO',
      valor: '   ',
      textoEsperado: 'TITULO'
    },
    {
      id: 'TIPO_VACIO',
      campo: 'TIPO',
      valor: '',
      textoEsperado: 'TIPO'
    },
    {
      id: 'ESTADO_VACIO',
      campo: 'ESTADO',
      valor: '',
      textoEsperado: 'ESTADO'
    }
  ];

  var resultados = [];

  pruebas.forEach(function (prueba) {
    var datosActualizacion = {};
    datosActualizacion[prueba.campo] =
      prueba.valor;

    var rechazado = false;
    var mensaje = '';

    try {
      actualizarRegistroTransaccional(
        'DECISION',
        idDecision,
        datosActualizacion,
        {
          dryRun: true,
          origen: 'TEST'
        }
      );

      console.log(
        'ERR repositorio_acepto_campo_obligatorio_invalido=' +
        prueba.id
      );
    } catch (error) {
      mensaje = String(
        error && error.message
          ? error.message
          : error
      );

      rechazado =
        mensaje.indexOf(
          prueba.textoEsperado
        ) !== -1;

      if (rechazado) {
        console.log(
          'OK campo_obligatorio_rechazado=' +
          prueba.id +
          ' mensaje=' +
          mensaje
        );
      } else {
        console.log(
          'ERR error_distinto=' +
          prueba.id +
          ' mensaje=' +
          mensaje
        );
      }
    }

    resultados.push({
      id: prueba.id,
      rechazado: rechazado,
      mensaje: mensaje
    });
  });

  SpreadsheetApp.flush();

  var registroDespues = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  var filasDecisionesDespues =
    hojaDecisiones.getLastRow();

  var filasHistorialDespues =
    hojaHistorial.getLastRow();

  var proyectoSinCambios =
    compararValoresAuditoria_(
      proyectoAntes,
      registroDespues.PROYECTO_ID
    );

  var tituloSinCambios =
    compararValoresAuditoria_(
      tituloAntes,
      registroDespues.TITULO
    );

  var tipoSinCambios =
    compararValoresAuditoria_(
      tipoAntes,
      registroDespues.TIPO
    );

  var estadoSinCambios =
    compararValoresAuditoria_(
      estadoAntes,
      registroDespues.ESTADO
    );

  var fechaModificacionSinCambios =
    compararValoresAuditoria_(
      fechaModificacionAntes,
      registroDespues.FECHA_MODIFICACION
    );

  console.log(
    'OK filas_decisiones_antes=' +
    filasDecisionesAntes
  );

  console.log(
    'OK filas_decisiones_despues=' +
    filasDecisionesDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  console.log(
    'OK proyecto_sin_cambios=' +
    proyectoSinCambios
  );

  console.log(
    'OK titulo_sin_cambios=' +
    tituloSinCambios
  );

  console.log(
    'OK tipo_sin_cambios=' +
    tipoSinCambios
  );

  console.log(
    'OK estado_sin_cambios=' +
    estadoSinCambios
  );

  console.log(
    'OK fecha_modificacion_sin_cambios=' +
    fechaModificacionSinCambios
  );

  var pruebasRechazadas =
    resultados.filter(function (resultado) {
      return resultado.rechazado;
    }).length;

  console.log(
    'OK pruebas_rechazadas=' +
    pruebasRechazadas +
    '/' +
    pruebas.length
  );

  if (pruebasRechazadas !== pruebas.length) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CAMPOS_OBLIGATORIOS_DECISION_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio aceptó uno o más campos obligatorios inválidos'
    );
  }

  if (
    filasDecisionesAntes !== filasDecisionesDespues ||
    filasHistorialAntes !== filasHistorialDespues ||
    !proyectoSinCambios ||
    !tituloSinCambios ||
    !tipoSinCambios ||
    !estadoSinCambios ||
    !fechaModificacionSinCambios
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_CAMPOS_OBLIGATORIOS_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: la prueba produjo efectos laterales'
    );
  }

  console.log(
    'OK proyecto_id_vacio_rechazado=true'
  );

  console.log(
    'OK titulo_vacio_rechazado=true'
  );

  console.log(
    'OK titulo_espacios_rechazado=true'
  );

  console.log(
    'OK tipo_vacio_rechazado=true'
  );

  console.log(
    'OK estado_vacio_rechazado=true'
  );

  console.log(
    'OK decision_sin_cambios=' +
    idDecision
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT auditar_normalizacion_textos_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_CAMPOS_OBLIGATORIOS_DECISION_REPOSITORIO result=OK'
  );

  return true;
}

function auditarNormalizacionTextosDecisionRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_NORMALIZACION_TEXTOS_DECISION_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDecisiones = ss.getSheetByName('12_DECISIONES');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');
  var idDecision = 'DEC-0001';

  if (!hojaDecisiones) {
    console.log('ERR hoja_no_existe=12_DECISIONES');

    throw new Error(
      'AUDITORIA_ERROR: no existe 12_DECISIONES'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=91_HISTORIAL');

    throw new Error(
      'AUDITORIA_ERROR: no existe 91_HISTORIAL'
    );
  }

  var registroAntes = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  if (!registroAntes) {
    console.log(
      'ERR decision_no_existe=' + idDecision
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe ' + idDecision
    );
  }

  var filasDecisionesAntes =
    hojaDecisiones.getLastRow();

  var filasHistorialAntes =
    hojaHistorial.getLastRow();

  var fechaModificacionAntes =
    registroAntes.FECHA_MODIFICACION;

  var tituloAntes =
    registroAntes.TITULO;

  var contextoAntes =
    registroAntes.CONTEXTO;

  var observacionesAntes =
    registroAntes.OBSERVACIONES;

  var resultadoDryRun =
    actualizarRegistroTransaccional(
      'DECISION',
      idDecision,
      {
        TITULO:
          '  AUDITORIA DECISION UI  ',
        CONTEXTO:
          '  Prueba controlada de decisión  ',
        OBSERVACIONES:
          '  PRUEBA NORMALIZACION TEXTOS  '
      },
      {
        dryRun: true,
        origen: 'TEST'
      }
    );

  if (!resultadoDryRun) {
    console.log(
      'ERR dryrun_sin_resultado=true'
    );

    throw new Error(
      'AUDITORIA_ERROR: actualizarRegistroTransaccional no devolvió resultado'
    );
  }

  var diferenciasDryRun =
    resultadoDryRun.diferencias;

  if (!Array.isArray(diferenciasDryRun)) {
    console.log(
      'ERR dryrun_sin_diferencias=true'
    );

    console.log(
      'INFO resultado_dryrun=' +
      JSON.stringify(resultadoDryRun)
    );

    throw new Error(
      'AUDITORIA_ERROR: dryRun no devolvió el array diferencias'
    );
  }

  /*
   * Los textos enviados contienen espacios extremos.
   * Si el repositorio los normaliza correctamente,
   * coinciden con los valores ya almacenados y
   * no debe existir ninguna diferencia.
   */
  var textosNormalizados =
    diferenciasDryRun.length === 0;

  console.log(
    'OK diferencias_dryrun=' +
    JSON.stringify(diferenciasDryRun)
  );

  console.log(
    'OK textos_normalizados=' +
    textosNormalizados
  );

  SpreadsheetApp.flush();

  var registroDespues = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  var filasDecisionesDespues =
    hojaDecisiones.getLastRow();

  var filasHistorialDespues =
    hojaHistorial.getLastRow();

  var tituloSinCambios =
    compararValoresAuditoria_(
      tituloAntes,
      registroDespues.TITULO
    );

  var contextoSinCambios =
    compararValoresAuditoria_(
      contextoAntes,
      registroDespues.CONTEXTO
    );

  var observacionesSinCambios =
    compararValoresAuditoria_(
      observacionesAntes,
      registroDespues.OBSERVACIONES
    );

  var fechaModificacionSinCambios =
    compararValoresAuditoria_(
      fechaModificacionAntes,
      registroDespues.FECHA_MODIFICACION
    );

  console.log(
    'OK filas_decisiones_antes=' +
    filasDecisionesAntes
  );

  console.log(
    'OK filas_decisiones_despues=' +
    filasDecisionesDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  console.log(
    'OK titulo_sin_cambios=' +
    tituloSinCambios
  );

  console.log(
    'OK contexto_sin_cambios=' +
    contextoSinCambios
  );

  console.log(
    'OK observaciones_sin_cambios=' +
    observacionesSinCambios
  );

  console.log(
    'OK fecha_modificacion_sin_cambios=' +
    fechaModificacionSinCambios
  );

  if (!textosNormalizados) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_NORMALIZACION_TEXTOS_DECISION_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: el repositorio no normalizó todos los textos de DECISION'
    );
  }

  if (
    filasDecisionesAntes !==
      filasDecisionesDespues ||
    filasHistorialAntes !==
      filasHistorialDespues ||
    !tituloSinCambios ||
    !contextoSinCambios ||
    !observacionesSinCambios ||
    !fechaModificacionSinCambios
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_NORMALIZACION_TEXTOS_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: la prueba produjo efectos laterales'
    );
  }

  console.log(
    'OK textos_decision_normalizados=true'
  );

  console.log(
    'OK decision_sin_cambios=' +
    idDecision
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_normalizacion_textos_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_NORMALIZACION_TEXTOS_DECISION_REPOSITORIO result=OK'
  );

  return true;
}

function auditarNormalizacionResolucionDecisionRepositorio() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_NORMALIZACION_RESOLUCION_DECISION_REPOSITORIO'
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDecisiones = ss.getSheetByName('12_DECISIONES');
  var hojaHistorial = ss.getSheetByName('91_HISTORIAL');
  var idDecision = 'DEC-0001';

  if (!hojaDecisiones) {
    console.log('ERR hoja_no_existe=12_DECISIONES');

    throw new Error(
      'AUDITORIA_ERROR: no existe 12_DECISIONES'
    );
  }

  if (!hojaHistorial) {
    console.log('ERR hoja_no_existe=91_HISTORIAL');

    throw new Error(
      'AUDITORIA_ERROR: no existe 91_HISTORIAL'
    );
  }

  var registroAntes = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  if (!registroAntes) {
    console.log(
      'ERR decision_no_existe=' + idDecision
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe ' + idDecision
    );
  }

  var filasDecisionesAntes =
    hojaDecisiones.getLastRow();

  var filasHistorialAntes =
    hojaHistorial.getLastRow();

  var estadoAntes =
    registroAntes.ESTADO;

  var resolucionAntes =
    registroAntes.RESOLUCION;

  var fechaResolucionAntes =
    registroAntes.FECHA_RESOLUCION;

  var fechaModificacionAntes =
    registroAntes.FECHA_MODIFICACION;

  var fechaCreacion =
    new Date(registroAntes.FECHA_CREACION);

  if (isNaN(fechaCreacion.getTime())) {
    console.log(
      'ERR fecha_creacion_invalida=' +
      registroAntes.FECHA_CREACION
    );

    throw new Error(
      'AUDITORIA_ERROR: FECHA_CREACION no es válida'
    );
  }

  /*
   * Se emplea una fecha posterior a la creación
   * para respetar la regla temporal de DECISION.
   */
  var fechaResolucionPrueba =
    new Date(fechaCreacion.getTime());

  fechaResolucionPrueba.setDate(
    fechaResolucionPrueba.getDate() + 1
  );

  var resultadoDryRun =
    actualizarRegistroTransaccional(
      'DECISION',
      idDecision,
      {
        ESTADO: 'Aprobada',
        RESOLUCION:
          '  Resolución de prueba controlada  ',
        FECHA_RESOLUCION:
          fechaResolucionPrueba
      },
      {
        dryRun: true,
        origen: 'TEST',
        esPrueba: true,
        pruebaId:
          'AUDITAR_NORMALIZACION_RESOLUCION_DECISION'
      }
    );

  if (
    !resultadoDryRun ||
    !Array.isArray(
      resultadoDryRun.diferencias
    )
  ) {
    console.log(
      'ERR dryrun_sin_diferencias=true'
    );

    console.log(
      'INFO resultado_dryrun=' +
      JSON.stringify(resultadoDryRun)
    );

    throw new Error(
      'AUDITORIA_ERROR: dryRun no devolvió diferencias'
    );
  }

  var diferencias =
    resultadoDryRun.diferencias;

  console.log(
    'OK diferencias_dryrun=' +
    JSON.stringify(diferencias)
  );

  var diferenciaResolucion =
    diferencias.find(function (diferencia) {
      return (
        diferencia.campo ===
        'RESOLUCION'
      );
    });

  var resolucionNormalizada =
    !!diferenciaResolucion &&
    diferenciaResolucion.nuevo ===
      'Resolución de prueba controlada';

  var sinEspacioInicial =
    !!diferenciaResolucion &&
    diferenciaResolucion.nuevo.charAt(0) !==
      ' ';

  var sinEspacioFinal =
    !!diferenciaResolucion &&
    diferenciaResolucion.nuevo.charAt(
      diferenciaResolucion.nuevo.length - 1
    ) !== ' ';

  console.log(
    'OK resolucion_nueva=' +
    JSON.stringify(
      diferenciaResolucion
        ? diferenciaResolucion.nuevo
        : null
    )
  );

  console.log(
    'OK resolucion_normalizada=' +
    resolucionNormalizada
  );

  console.log(
    'OK resolucion_sin_espacio_inicial=' +
    sinEspacioInicial
  );

  console.log(
    'OK resolucion_sin_espacio_final=' +
    sinEspacioFinal
  );

  SpreadsheetApp.flush();

  var registroDespues = obtenerRegistroPorId(
    'DECISION',
    idDecision
  );

  var filasDecisionesDespues =
    hojaDecisiones.getLastRow();

  var filasHistorialDespues =
    hojaHistorial.getLastRow();

  var estadoSinCambios =
    compararValoresAuditoria_(
      estadoAntes,
      registroDespues.ESTADO
    );

  var resolucionSinCambios =
    compararValoresAuditoria_(
      resolucionAntes,
      registroDespues.RESOLUCION
    );

  var fechaResolucionSinCambios =
    compararValoresAuditoria_(
      fechaResolucionAntes,
      registroDespues.FECHA_RESOLUCION
    );

  var fechaModificacionSinCambios =
    compararValoresAuditoria_(
      fechaModificacionAntes,
      registroDespues.FECHA_MODIFICACION
    );

  console.log(
    'OK filas_decisiones_antes=' +
    filasDecisionesAntes
  );

  console.log(
    'OK filas_decisiones_despues=' +
    filasDecisionesDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  console.log(
    'OK estado_sin_cambios=' +
    estadoSinCambios
  );

  console.log(
    'OK resolucion_sin_cambios=' +
    resolucionSinCambios
  );

  console.log(
    'OK fecha_resolucion_sin_cambios=' +
    fechaResolucionSinCambios
  );

  console.log(
    'OK fecha_modificacion_sin_cambios=' +
    fechaModificacionSinCambios
  );

  if (
    !resolucionNormalizada ||
    !sinEspacioInicial ||
    !sinEspacioFinal
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_NORMALIZACION_RESOLUCION_DECISION_REPOSITORIO result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: RESOLUCION no fue normalizada correctamente'
    );
  }

  if (
    filasDecisionesAntes !==
      filasDecisionesDespues ||
    filasHistorialAntes !==
      filasHistorialDespues ||
    !estadoSinCambios ||
    !resolucionSinCambios ||
    !fechaResolucionSinCambios ||
    !fechaModificacionSinCambios
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=AUDITAR_NORMALIZACION_RESOLUCION_DECISION_REPOSITORIO result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: la prueba produjo efectos laterales'
    );
  }

  console.log(
    'OK resolucion_decision_normalizada=true'
  );

  console.log(
    'OK decision_sin_cambios=' +
    idDecision
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_normalizacion_resolucion_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_NORMALIZACION_RESOLUCION_DECISION_REPOSITORIO result=OK'
  );

  return true;
}

function auditarTransicionRealDecisionAprobada() {
  var paquete =
    'AUDITAR_TRANSICION_REAL_DECISION_APROBADA';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    paquete
  );

  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  var hojaDecisiones =
    ss.getSheetByName('12_DECISIONES');

  var hojaHistorial =
    ss.getSheetByName('91_HISTORIAL');

  var idDecision = 'DEC-0001';

  if (!hojaDecisiones) {
    console.log(
      'ERR hoja_no_existe=12_DECISIONES'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 12_DECISIONES'
    );
  }

  if (!hojaHistorial) {
    console.log(
      'ERR hoja_no_existe=91_HISTORIAL'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 91_HISTORIAL'
    );
  }

  var registroInicial =
    obtenerRegistroPorId(
      'DECISION',
      idDecision
    );

  if (!registroInicial) {
    console.log(
      'ERR decision_no_existe=' +
      idDecision
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe ' +
      idDecision
    );
  }

  var estadoInicial =
    registroInicial.ESTADO;

  var resolucionInicial =
    registroInicial.RESOLUCION;

  var fechaResolucionInicial =
    registroInicial.FECHA_RESOLUCION;

  var fechaModificacionInicial =
    registroInicial.FECHA_MODIFICACION;

  var modificadoPorInicial =
    registroInicial.MODIFICADO_POR;

  var filasDecisionesIniciales =
    hojaDecisiones.getLastRow();

  var filasHistorialIniciales =
    hojaHistorial.getLastRow();

  var fechaCreacion =
    new Date(
      registroInicial.FECHA_CREACION
    );

  if (isNaN(fechaCreacion.getTime())) {
    throw new Error(
      'AUDITORIA_ERROR: FECHA_CREACION no válida'
    );
  }

  /*
   * Fecha posterior a la creación para cumplir
   * la regla temporal de la decisión.
   */
  var fechaResolucionPrueba =
    new Date(fechaCreacion.getTime());

  fechaResolucionPrueba.setDate(
    fechaResolucionPrueba.getDate() + 1
  );

  var resolucionEsperada =
    'Resolución de transición real';

  var resultadoActualizacion = null;
  var resultadoEquivalente = null;
  var resultadoRestauracion = null;

  try {
    /*
     * 1. Actualización real.
     */
    resultadoActualizacion =
      actualizarRegistroTransaccional(
        'DECISION',
        idDecision,
        {
          ESTADO: 'Aprobada',
          RESOLUCION:
            '  Resolución de transición real  ',
          FECHA_RESOLUCION:
            fechaResolucionPrueba
        },
        {
          dryRun: false,
          origen: 'TEST',
          esPrueba: true,
          pruebaId:
            'TRANSICION_REAL_DECISION_APROBADA'
        }
      );

    SpreadsheetApp.flush();

    var registroAprobado =
      obtenerRegistroPorId(
        'DECISION',
        idDecision
      );

    var filasHistorialTrasActualizar =
      hojaHistorial.getLastRow();

    var diferenciasActualizacion =
      resultadoActualizacion &&
      Array.isArray(
        resultadoActualizacion.diferencias
      )
        ? resultadoActualizacion.diferencias
        : [];

    var camposActualizados =
      diferenciasActualizacion
        .map(function (diferencia) {
          return diferencia.campo;
        })
        .sort();

    var camposEsperados = [
      'ESTADO',
      'FECHA_RESOLUCION',
      'RESOLUCION'
    ].sort();

    var diferenciasCorrectas =
      JSON.stringify(camposActualizados) ===
      JSON.stringify(camposEsperados);

    var estadoPersistido =
      registroAprobado.ESTADO ===
      'Aprobada';

    var resolucionPersistida =
      registroAprobado.RESOLUCION ===
      resolucionEsperada;

    var fechaResolucionPersistida =
      compararValoresAuditoria_(
        fechaResolucionPrueba,
        registroAprobado.FECHA_RESOLUCION
      );

    var fechaModificacionActualizada =
      !compararValoresAuditoria_(
        fechaModificacionInicial,
        registroAprobado.FECHA_MODIFICACION
      );

    var modificadoPorInformado =
      String(
        registroAprobado.MODIFICADO_POR || ''
      ).trim() !== '';

    var historialCreado =
      filasHistorialTrasActualizar ===
      filasHistorialIniciales + 1;

    console.log(
      'OK diferencias_actualizacion=' +
      JSON.stringify(
        diferenciasActualizacion
      )
    );

    console.log(
      'OK diferencias_correctas=' +
      diferenciasCorrectas
    );

    console.log(
      'OK estado_persistido=' +
      estadoPersistido
    );

    console.log(
      'OK resolucion_persistida=' +
      resolucionPersistida
    );

    console.log(
      'OK fecha_resolucion_persistida=' +
      fechaResolucionPersistida
    );

    console.log(
      'OK fecha_modificacion_actualizada=' +
      fechaModificacionActualizada
    );

    console.log(
      'OK modificado_por_informado=' +
      modificadoPorInformado
    );

    console.log(
      'OK historial_creado=' +
      historialCreado
    );

    if (
      !diferenciasCorrectas ||
      !estadoPersistido ||
      !resolucionPersistida ||
      !fechaResolucionPersistida ||
      !fechaModificacionActualizada ||
      !modificadoPorInformado ||
      !historialCreado
    ) {
      throw new Error(
        'AUDITORIA_NO_GO: transición real incorrecta'
      );
    }

    /*
     * 2. Segunda actualización equivalente.
     *
     * Los espacios extremos deben normalizarse,
     * por lo que no debe existir ninguna diferencia.
     */
    var fechaModificacionAntesEquivalente =
      registroAprobado.FECHA_MODIFICACION;

    var filasHistorialAntesEquivalente =
      hojaHistorial.getLastRow();

    resultadoEquivalente =
      actualizarRegistroTransaccional(
        'DECISION',
        idDecision,
        {
          ESTADO: 'Aprobada',
          RESOLUCION:
            '  Resolución de transición real  ',
          FECHA_RESOLUCION:
            fechaResolucionPrueba
        },
        {
          dryRun: false,
          origen: 'TEST',
          esPrueba: true,
          pruebaId:
            'TRANSICION_EQUIVALENTE_DECISION_APROBADA'
        }
      );

    SpreadsheetApp.flush();

    var registroTrasEquivalente =
      obtenerRegistroPorId(
        'DECISION',
        idDecision
      );

    var filasHistorialTrasEquivalente =
      hojaHistorial.getLastRow();

    var sinDiferencias =
      resultadoEquivalente &&
      Array.isArray(
        resultadoEquivalente.diferencias
      ) &&
      resultadoEquivalente.diferencias.length ===
        0;

    var sinHistorialAdicional =
      filasHistorialTrasEquivalente ===
      filasHistorialAntesEquivalente;

    var fechaModificacionSinCambios =
      compararValoresAuditoria_(
        fechaModificacionAntesEquivalente,
        registroTrasEquivalente.FECHA_MODIFICACION
      );

    console.log(
      'OK diferencias_equivalente=' +
      JSON.stringify(
        resultadoEquivalente.diferencias
      )
    );

    console.log(
      'OK actualizacion_equivalente_sin_diferencias=' +
      sinDiferencias
    );

    console.log(
      'OK actualizacion_equivalente_sin_historial=' +
      sinHistorialAdicional
    );

    console.log(
      'OK actualizacion_equivalente_sin_modificar_fecha=' +
      fechaModificacionSinCambios
    );

    if (
      !sinDiferencias ||
      !sinHistorialAdicional ||
      !fechaModificacionSinCambios
    ) {
      throw new Error(
        'AUDITORIA_NO_GO: la actualización equivalente produjo efectos laterales'
      );
    }

  } finally {
    /*
     * 3. Restauración controlada.
     *
     * Para volver a un estado abierto deben limpiarse
     * simultáneamente RESOLUCION y FECHA_RESOLUCION.
     */
    var registroAntesRestaurar =
      obtenerRegistroPorId(
        'DECISION',
        idDecision
      );

    if (
      registroAntesRestaurar &&
      (
        registroAntesRestaurar.ESTADO !==
          estadoInicial ||
        !compararValoresAuditoria_(
          registroAntesRestaurar.RESOLUCION,
          resolucionInicial
        ) ||
        !compararValoresAuditoria_(
          registroAntesRestaurar.FECHA_RESOLUCION,
          fechaResolucionInicial
        )
      )
    ) {
      resultadoRestauracion =
        actualizarRegistroTransaccional(
          'DECISION',
          idDecision,
          {
            ESTADO: estadoInicial,
            RESOLUCION:
              resolucionInicial || '',
            FECHA_RESOLUCION:
              fechaResolucionInicial || ''
          },
          {
            dryRun: false,
            origen: 'TEST',
            esPrueba: true,
            pruebaId:
              'RESTAURAR_TRANSICION_DECISION_APROBADA'
          }
        );

      SpreadsheetApp.flush();
    }
  }

  var registroFinal =
    obtenerRegistroPorId(
      'DECISION',
      idDecision
    );

  var filasDecisionesFinales =
    hojaDecisiones.getLastRow();

  var filasHistorialFinales =
    hojaHistorial.getLastRow();

  var estadoRestaurado =
    compararValoresAuditoria_(
      estadoInicial,
      registroFinal.ESTADO
    );

  var resolucionRestaurada =
    compararValoresAuditoria_(
      resolucionInicial,
      registroFinal.RESOLUCION
    );

  var fechaResolucionRestaurada =
    compararValoresAuditoria_(
      fechaResolucionInicial,
      registroFinal.FECHA_RESOLUCION
    );

  var filasDecisionSinCambios =
    filasDecisionesFinales ===
    filasDecisionesIniciales;

  /*
   * Historial esperado:
   * +1 transición real
   * +0 actualización equivalente
   * +1 restauración
   */
  var incrementoHistorialEsperado =
    filasHistorialFinales ===
    filasHistorialIniciales + 2;

  console.log(
    'OK filas_decisiones_iniciales=' +
    filasDecisionesIniciales
  );

  console.log(
    'OK filas_decisiones_finales=' +
    filasDecisionesFinales
  );

  console.log(
    'OK filas_historial_iniciales=' +
    filasHistorialIniciales
  );

  console.log(
    'OK filas_historial_finales=' +
    filasHistorialFinales
  );

  console.log(
    'OK estado_restaurado=' +
    estadoRestaurado
  );

  console.log(
    'OK resolucion_restaurada=' +
    resolucionRestaurada
  );

  console.log(
    'OK fecha_resolucion_restaurada=' +
    fechaResolucionRestaurada
  );

  console.log(
    'OK filas_decision_sin_cambios=' +
    filasDecisionSinCambios
  );

  console.log(
    'OK incremento_historial_esperado=' +
    incrementoHistorialEsperado
  );

  if (
    !estadoRestaurado ||
    !resolucionRestaurada ||
    !fechaResolucionRestaurada ||
    !filasDecisionSinCambios ||
    !incrementoHistorialEsperado
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      paquete +
      ' result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: la decisión no fue restaurada correctamente'
    );
  }

  console.log(
    'OK transicion_real_decision_aprobada=true'
  );

  console.log(
    'OK actualizacion_equivalente_sin_efectos=true'
  );

  console.log(
    'OK decision_restaurada=' +
    idDecision
  );

  console.log(
    'NEXT cerrar_transicion_real_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    paquete +
    ' result=OK'
  );

  return true;
}

function auditarCierresRechazadaSustituidaDecisionRepositorio() {
  var paquete =
    'AUDITAR_CIERRES_RECHAZADA_SUSTITUIDA_DECISION_REPOSITORIO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    paquete
  );

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDecisiones =
    ss.getSheetByName('12_DECISIONES');
  var hojaHistorial =
    ss.getSheetByName('91_HISTORIAL');

  var idDecision = 'DEC-0001';

  if (!hojaDecisiones) {
    console.log(
      'ERR hoja_no_existe=12_DECISIONES'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 12_DECISIONES'
    );
  }

  if (!hojaHistorial) {
    console.log(
      'ERR hoja_no_existe=91_HISTORIAL'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 91_HISTORIAL'
    );
  }

  var registroAntes =
    obtenerRegistroPorId(
      'DECISION',
      idDecision
    );

  if (!registroAntes) {
    console.log(
      'ERR decision_no_existe=' +
      idDecision
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe ' +
      idDecision
    );
  }

  var filasDecisionesAntes =
    hojaDecisiones.getLastRow();

  var filasHistorialAntes =
    hojaHistorial.getLastRow();

  var estadoAntes =
    registroAntes.ESTADO;

  var resolucionAntes =
    registroAntes.RESOLUCION;

  var fechaResolucionAntes =
    registroAntes.FECHA_RESOLUCION;

  var fechaModificacionAntes =
    registroAntes.FECHA_MODIFICACION;

  var fechaCreacion =
    new Date(
      registroAntes.FECHA_CREACION
    );

  if (isNaN(fechaCreacion.getTime())) {
    throw new Error(
      'AUDITORIA_ERROR: FECHA_CREACION no válida'
    );
  }

  var fechaResolucionValida =
    new Date(fechaCreacion.getTime());

  fechaResolucionValida.setDate(
    fechaResolucionValida.getDate() + 1
  );

  var estadosCierre = [
    'Rechazada',
    'Sustituida'
  ];

  var resultados = [];

  estadosCierre.forEach(
    function (estadoCierre) {
      var sinResolucionRechazado = false;
      var sinFechaRechazado = false;
      var cierreValidoAceptado = false;
      var resolucionNormalizada = false;
      var diferenciasValidas = false;

      /*
       * CASO 1:
       * estado cerrado sin RESOLUCION.
       */
      try {
        actualizarRegistroTransaccional(
          'DECISION',
          idDecision,
          {
            ESTADO: estadoCierre,
            RESOLUCION: '',
            FECHA_RESOLUCION:
              fechaResolucionValida
          },
          {
            dryRun: true,
            origen: 'TEST',
            esPrueba: true,
            pruebaId:
              'CIERRE_' +
              estadoCierre.toUpperCase() +
              '_SIN_RESOLUCION'
          }
        );

        console.log(
          'ERR cierre_sin_resolucion_aceptado=' +
          estadoCierre
        );

      } catch (errorSinResolucion) {
        var mensajeSinResolucion =
          String(
            errorSinResolucion &&
            errorSinResolucion.message
              ? errorSinResolucion.message
              : errorSinResolucion
          );

        sinResolucionRechazado =
          mensajeSinResolucion.indexOf(
            'Debe indicar la resolución'
          ) !== -1;

        console.log(
          (
            sinResolucionRechazado
              ? 'OK'
              : 'ERR'
          ) +
          ' cierre_sin_resolucion_rechazado=' +
          estadoCierre +
          ' mensaje=' +
          mensajeSinResolucion
        );
      }

      /*
       * CASO 2:
       * estado cerrado sin FECHA_RESOLUCION.
       */
      try {
        actualizarRegistroTransaccional(
          'DECISION',
          idDecision,
          {
            ESTADO: estadoCierre,
            RESOLUCION:
              'Resolución de prueba',
            FECHA_RESOLUCION: ''
          },
          {
            dryRun: true,
            origen: 'TEST',
            esPrueba: true,
            pruebaId:
              'CIERRE_' +
              estadoCierre.toUpperCase() +
              '_SIN_FECHA'
          }
        );

        console.log(
          'ERR cierre_sin_fecha_aceptado=' +
          estadoCierre
        );

      } catch (errorSinFecha) {
        var mensajeSinFecha =
          String(
            errorSinFecha &&
            errorSinFecha.message
              ? errorSinFecha.message
              : errorSinFecha
          );

        sinFechaRechazado =
          mensajeSinFecha.indexOf(
            'Debe indicar la fecha de resolución'
          ) !== -1;

        console.log(
          (
            sinFechaRechazado
              ? 'OK'
              : 'ERR'
          ) +
          ' cierre_sin_fecha_rechazado=' +
          estadoCierre +
          ' mensaje=' +
          mensajeSinFecha
        );
      }

      /*
       * CASO 3:
       * cierre completo y válido.
       */
      var textoResolucionEsperado =
        'Resolución válida ' +
        estadoCierre;

      var resultadoValido =
        actualizarRegistroTransaccional(
          'DECISION',
          idDecision,
          {
            ESTADO: estadoCierre,
            RESOLUCION:
              '  ' +
              textoResolucionEsperado +
              '  ',
            FECHA_RESOLUCION:
              fechaResolucionValida
          },
          {
            dryRun: true,
            origen: 'TEST',
            esPrueba: true,
            pruebaId:
              'CIERRE_' +
              estadoCierre.toUpperCase() +
              '_VALIDO'
          }
        );

      if (
        resultadoValido &&
        Array.isArray(
          resultadoValido.diferencias
        )
      ) {
        cierreValidoAceptado = true;

        var diferenciaResolucion =
          resultadoValido.diferencias.find(
            function (diferencia) {
              return (
                diferencia.campo ===
                'RESOLUCION'
              );
            }
          );

        resolucionNormalizada =
          !!diferenciaResolucion &&
          diferenciaResolucion.nuevo ===
            textoResolucionEsperado;

        var camposDiferencias =
          resultadoValido.diferencias
            .map(function (diferencia) {
              return diferencia.campo;
            })
            .sort();

        var camposEsperados = [
          'ESTADO',
          'FECHA_RESOLUCION',
          'RESOLUCION'
        ].sort();

        diferenciasValidas =
          JSON.stringify(
            camposDiferencias
          ) ===
          JSON.stringify(
            camposEsperados
          );

        console.log(
          'OK diferencias_cierre_valido_' +
          estadoCierre.toUpperCase() +
          '=' +
          JSON.stringify(
            resultadoValido.diferencias
          )
        );
      }

      console.log(
        'OK cierre_valido_aceptado_' +
        estadoCierre.toUpperCase() +
        '=' +
        cierreValidoAceptado
      );

      console.log(
        'OK resolucion_normalizada_' +
        estadoCierre.toUpperCase() +
        '=' +
        resolucionNormalizada
      );

      console.log(
        'OK diferencias_validas_' +
        estadoCierre.toUpperCase() +
        '=' +
        diferenciasValidas
      );

      resultados.push({
        estado: estadoCierre,
        sinResolucionRechazado:
          sinResolucionRechazado,
        sinFechaRechazado:
          sinFechaRechazado,
        cierreValidoAceptado:
          cierreValidoAceptado,
        resolucionNormalizada:
          resolucionNormalizada,
        diferenciasValidas:
          diferenciasValidas
      });
    }
  );

  SpreadsheetApp.flush();

  var registroDespues =
    obtenerRegistroPorId(
      'DECISION',
      idDecision
    );

  var filasDecisionesDespues =
    hojaDecisiones.getLastRow();

  var filasHistorialDespues =
    hojaHistorial.getLastRow();

  var estadoSinCambios =
    compararValoresAuditoria_(
      estadoAntes,
      registroDespues.ESTADO
    );

  var resolucionSinCambios =
    compararValoresAuditoria_(
      resolucionAntes,
      registroDespues.RESOLUCION
    );

  var fechaResolucionSinCambios =
    compararValoresAuditoria_(
      fechaResolucionAntes,
      registroDespues.FECHA_RESOLUCION
    );

  var fechaModificacionSinCambios =
    compararValoresAuditoria_(
      fechaModificacionAntes,
      registroDespues.FECHA_MODIFICACION
    );

  var pruebasCorrectas =
    resultados.every(
      function (resultado) {
        return (
          resultado.sinResolucionRechazado &&
          resultado.sinFechaRechazado &&
          resultado.cierreValidoAceptado &&
          resultado.resolucionNormalizada &&
          resultado.diferenciasValidas
        );
      }
    );

  var sinEfectosLaterales =
    filasDecisionesAntes ===
      filasDecisionesDespues &&
    filasHistorialAntes ===
      filasHistorialDespues &&
    estadoSinCambios &&
    resolucionSinCambios &&
    fechaResolucionSinCambios &&
    fechaModificacionSinCambios;

  console.log(
    'OK resultados=' +
    JSON.stringify(resultados)
  );

  console.log(
    'OK pruebas_correctas=' +
    pruebasCorrectas
  );

  console.log(
    'OK filas_decisiones_antes=' +
    filasDecisionesAntes
  );

  console.log(
    'OK filas_decisiones_despues=' +
    filasDecisionesDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  console.log(
    'OK estado_sin_cambios=' +
    estadoSinCambios
  );

  console.log(
    'OK resolucion_sin_cambios=' +
    resolucionSinCambios
  );

  console.log(
    'OK fecha_resolucion_sin_cambios=' +
    fechaResolucionSinCambios
  );

  console.log(
    'OK fecha_modificacion_sin_cambios=' +
    fechaModificacionSinCambios
  );

  console.log(
    'OK sin_efectos_laterales=' +
    sinEfectosLaterales
  );

  if (!pruebasCorrectas) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      paquete +
      ' result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: alguna regla de cierre Rechazada/Sustituida no se cumple'
    );
  }

  if (!sinEfectosLaterales) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      paquete +
      ' result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: la prueba produjo efectos laterales'
    );
  }

  console.log(
    'OK cierre_rechazada_verificado=true'
  );

  console.log(
    'OK cierre_sustituida_verificado=true'
  );

  console.log(
    'OK decision_sin_cambios=' +
    idDecision
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_estados_cierre_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    paquete +
    ' result=OK'
  );

  return true;
}

function auditarEstadosAbiertosDecisionRepositorio() {
  var paquete =
    'AUDITAR_ESTADOS_ABIERTOS_DECISION_REPOSITORIO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    paquete
  );

  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  var hojaDecisiones =
    ss.getSheetByName('12_DECISIONES');

  var hojaHistorial =
    ss.getSheetByName('91_HISTORIAL');

  var idDecision = 'DEC-0001';

  if (!hojaDecisiones) {
    console.log(
      'ERR hoja_no_existe=12_DECISIONES'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 12_DECISIONES'
    );
  }

  if (!hojaHistorial) {
    console.log(
      'ERR hoja_no_existe=91_HISTORIAL'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 91_HISTORIAL'
    );
  }

  var registroAntes =
    obtenerRegistroPorId(
      'DECISION',
      idDecision
    );

  if (!registroAntes) {
    console.log(
      'ERR decision_no_existe=' +
      idDecision
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe ' +
      idDecision
    );
  }

  var filasDecisionesAntes =
    hojaDecisiones.getLastRow();

  var filasHistorialAntes =
    hojaHistorial.getLastRow();

  var estadoAntes =
    registroAntes.ESTADO;

  var resolucionAntes =
    registroAntes.RESOLUCION;

  var fechaResolucionAntes =
    registroAntes.FECHA_RESOLUCION;

  var fechaModificacionAntes =
    registroAntes.FECHA_MODIFICACION;

  var fechaCreacion =
    new Date(
      registroAntes.FECHA_CREACION
    );

  if (isNaN(fechaCreacion.getTime())) {
    throw new Error(
      'AUDITORIA_ERROR: FECHA_CREACION no válida'
    );
  }

  var fechaResolucionPrueba =
    new Date(fechaCreacion.getTime());

  fechaResolucionPrueba.setDate(
    fechaResolucionPrueba.getDate() + 1
  );

  var estadosAbiertos = [
    'Pendiente de información',
    'Pendiente de consenso',
    'Pendiente de aprobación'
  ];

  var resultados = [];

  estadosAbiertos.forEach(
    function (estadoAbierto) {
      var resolucionRechazada = false;
      var fechaRechazada = false;
      var ambosRechazados = false;
      var limpioAceptado = false;

      var estadoLog =
        String(estadoAbierto)
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '_');

      /*
       * CASO 1:
       * estado abierto con RESOLUCION.
       */
      try {
        actualizarRegistroTransaccional(
          'DECISION',
          idDecision,
          {
            ESTADO: estadoAbierto,
            RESOLUCION:
              'Resolución no permitida',
            FECHA_RESOLUCION: ''
          },
          {
            dryRun: true,
            origen: 'TEST',
            esPrueba: true,
            pruebaId:
              'ESTADO_ABIERTO_CON_RESOLUCION_' +
              estadoLog
          }
        );

        console.log(
          'ERR estado_abierto_con_resolucion_aceptado=' +
          estadoAbierto
        );

      } catch (errorResolucion) {
        var mensajeResolucion =
          String(
            errorResolucion &&
            errorResolucion.message
              ? errorResolucion.message
              : errorResolucion
          );

        resolucionRechazada =
          mensajeResolucion.indexOf(
            'Una decisión abierta no puede contener resolución ni fecha de resolución'
          ) !== -1;

        console.log(
          (
            resolucionRechazada
              ? 'OK'
              : 'ERR'
          ) +
          ' estado_abierto_con_resolucion_rechazado=' +
          estadoAbierto +
          ' mensaje=' +
          mensajeResolucion
        );
      }

      /*
       * CASO 2:
       * estado abierto con FECHA_RESOLUCION.
       */
      try {
        actualizarRegistroTransaccional(
          'DECISION',
          idDecision,
          {
            ESTADO: estadoAbierto,
            RESOLUCION: '',
            FECHA_RESOLUCION:
              fechaResolucionPrueba
          },
          {
            dryRun: true,
            origen: 'TEST',
            esPrueba: true,
            pruebaId:
              'ESTADO_ABIERTO_CON_FECHA_' +
              estadoLog
          }
        );

        console.log(
          'ERR estado_abierto_con_fecha_aceptado=' +
          estadoAbierto
        );

      } catch (errorFecha) {
        var mensajeFecha =
          String(
            errorFecha &&
            errorFecha.message
              ? errorFecha.message
              : errorFecha
          );

        fechaRechazada =
          mensajeFecha.indexOf(
            'Una decisión abierta no puede contener resolución ni fecha de resolución'
          ) !== -1;

        console.log(
          (
            fechaRechazada
              ? 'OK'
              : 'ERR'
          ) +
          ' estado_abierto_con_fecha_rechazado=' +
          estadoAbierto +
          ' mensaje=' +
          mensajeFecha
        );
      }

      /*
       * CASO 3:
       * estado abierto con ambos campos de cierre.
       */
      try {
        actualizarRegistroTransaccional(
          'DECISION',
          idDecision,
          {
            ESTADO: estadoAbierto,
            RESOLUCION:
              'Resolución no permitida',
            FECHA_RESOLUCION:
              fechaResolucionPrueba
          },
          {
            dryRun: true,
            origen: 'TEST',
            esPrueba: true,
            pruebaId:
              'ESTADO_ABIERTO_CON_CIERRE_COMPLETO_' +
              estadoLog
          }
        );

        console.log(
          'ERR estado_abierto_con_cierre_aceptado=' +
          estadoAbierto
        );

      } catch (errorAmbos) {
        var mensajeAmbos =
          String(
            errorAmbos &&
            errorAmbos.message
              ? errorAmbos.message
              : errorAmbos
          );

        ambosRechazados =
          mensajeAmbos.indexOf(
            'Una decisión abierta no puede contener resolución ni fecha de resolución'
          ) !== -1;

        console.log(
          (
            ambosRechazados
              ? 'OK'
              : 'ERR'
          ) +
          ' estado_abierto_con_cierre_rechazado=' +
          estadoAbierto +
          ' mensaje=' +
          mensajeAmbos
        );
      }

      /*
       * CASO 4:
       * estado abierto limpio.
       */
      var resultadoLimpio =
        actualizarRegistroTransaccional(
          'DECISION',
          idDecision,
          {
            ESTADO: estadoAbierto,
            RESOLUCION: '',
            FECHA_RESOLUCION: ''
          },
          {
            dryRun: true,
            origen: 'TEST',
            esPrueba: true,
            pruebaId:
              'ESTADO_ABIERTO_LIMPIO_' +
              estadoLog
          }
        );

      limpioAceptado =
        !!resultadoLimpio &&
        Array.isArray(
          resultadoLimpio.diferencias
        );

      console.log(
        'OK estado_abierto_limpio_aceptado_' +
        estadoLog +
        '=' +
        limpioAceptado
      );

      console.log(
        'OK diferencias_estado_abierto_limpio_' +
        estadoLog +
        '=' +
        JSON.stringify(
          resultadoLimpio.diferencias
        )
      );

      resultados.push({
        estado: estadoAbierto,
        resolucionRechazada:
          resolucionRechazada,
        fechaRechazada:
          fechaRechazada,
        ambosRechazados:
          ambosRechazados,
        limpioAceptado:
          limpioAceptado
      });
    }
  );

  SpreadsheetApp.flush();

  var registroDespues =
    obtenerRegistroPorId(
      'DECISION',
      idDecision
    );

  var filasDecisionesDespues =
    hojaDecisiones.getLastRow();

  var filasHistorialDespues =
    hojaHistorial.getLastRow();

  var estadoSinCambios =
    compararValoresAuditoria_(
      estadoAntes,
      registroDespues.ESTADO
    );

  var resolucionSinCambios =
    compararValoresAuditoria_(
      resolucionAntes,
      registroDespues.RESOLUCION
    );

  var fechaResolucionSinCambios =
    compararValoresAuditoria_(
      fechaResolucionAntes,
      registroDespues.FECHA_RESOLUCION
    );

  var fechaModificacionSinCambios =
    compararValoresAuditoria_(
      fechaModificacionAntes,
      registroDespues.FECHA_MODIFICACION
    );

  var pruebasCorrectas =
    resultados.length ===
      estadosAbiertos.length &&
    resultados.every(
      function (resultado) {
        return (
          resultado.resolucionRechazada &&
          resultado.fechaRechazada &&
          resultado.ambosRechazados &&
          resultado.limpioAceptado
        );
      }
    );

  var sinEfectosLaterales =
    filasDecisionesAntes ===
      filasDecisionesDespues &&
    filasHistorialAntes ===
      filasHistorialDespues &&
    estadoSinCambios &&
    resolucionSinCambios &&
    fechaResolucionSinCambios &&
    fechaModificacionSinCambios;

  console.log(
    'OK estados_abiertos_auditados=' +
    JSON.stringify(estadosAbiertos)
  );

  console.log(
    'OK resultados=' +
    JSON.stringify(resultados)
  );

  console.log(
    'OK pruebas_correctas=' +
    pruebasCorrectas
  );

  console.log(
    'OK filas_decisiones_antes=' +
    filasDecisionesAntes
  );

  console.log(
    'OK filas_decisiones_despues=' +
    filasDecisionesDespues
  );

  console.log(
    'OK filas_historial_antes=' +
    filasHistorialAntes
  );

  console.log(
    'OK filas_historial_despues=' +
    filasHistorialDespues
  );

  console.log(
    'OK estado_sin_cambios=' +
    estadoSinCambios
  );

  console.log(
    'OK resolucion_sin_cambios=' +
    resolucionSinCambios
  );

  console.log(
    'OK fecha_resolucion_sin_cambios=' +
    fechaResolucionSinCambios
  );

  console.log(
    'OK fecha_modificacion_sin_cambios=' +
    fechaModificacionSinCambios
  );

  console.log(
    'OK sin_efectos_laterales=' +
    sinEfectosLaterales
  );

  if (!pruebasCorrectas) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      paquete +
      ' result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: alguna regla de estado abierto no se cumple'
    );
  }

  if (!sinEfectosLaterales) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      paquete +
      ' result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: la prueba produjo efectos laterales'
    );
  }

  console.log(
    'OK pendiente_informacion_abierto_verificado=true'
  );

  console.log(
    'OK pendiente_consenso_abierto_verificado=true'
  );

  console.log(
    'OK pendiente_aprobacion_abierto_verificado=true'
  );

  console.log(
    'OK decision_sin_cambios=' +
    idDecision
  );

  console.log(
    'OK historial_sin_cambios=true'
  );

  console.log(
    'NEXT cerrar_estados_abiertos_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    paquete +
    ' result=OK'
  );

  return true;
}

function auditarCatalogoEstadosDecision() {
  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=AUDITAR_CATALOGO_ESTADOS_DECISION'
  );

  var estados = obtenerCatalogo(
    'CFG_ESTADO_DECISION'
  );

  console.log(
    'OK estados_decision=' +
    JSON.stringify(estados)
  );

  console.log(
    'OK total_estados_decision=' +
    estados.length
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=AUDITAR_CATALOGO_ESTADOS_DECISION result=OK'
  );

  return estados;
}

function auditarTransicionesEstadosAbiertosDecision() {
  var paquete =
    'AUDITAR_TRANSICIONES_ESTADOS_ABIERTOS_DECISION';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    paquete
  );

  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  var hojaDecisiones =
    ss.getSheetByName('12_DECISIONES');

  var hojaHistorial =
    ss.getSheetByName('91_HISTORIAL');

  var idDecision = 'DEC-0001';

  if (!hojaDecisiones) {
    console.log(
      'ERR hoja_no_existe=12_DECISIONES'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 12_DECISIONES'
    );
  }

  if (!hojaHistorial) {
    console.log(
      'ERR hoja_no_existe=91_HISTORIAL'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 91_HISTORIAL'
    );
  }

  var registroInicial =
    obtenerRegistroPorId(
      'DECISION',
      idDecision
    );

  if (!registroInicial) {
    console.log(
      'ERR decision_no_existe=' +
      idDecision
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe ' +
      idDecision
    );
  }

  var estadoInicial =
    registroInicial.ESTADO;

  var resolucionInicial =
    registroInicial.RESOLUCION;

  var fechaResolucionInicial =
    registroInicial.FECHA_RESOLUCION;

  var filasDecisionesIniciales =
    hojaDecisiones.getLastRow();

  var filasHistorialIniciales =
    hojaHistorial.getLastRow();

  if (
    estadoInicial !==
    'Pendiente de aprobación'
  ) {
    console.log(
      'ERR estado_inicial_inesperado=' +
      estadoInicial
    );

    throw new Error(
      'AUDITORIA_ERROR: DEC-0001 debe comenzar en Pendiente de aprobación'
    );
  }

  if (
    String(
      resolucionInicial || ''
    ).trim() !== '' ||
    String(
      fechaResolucionInicial || ''
    ).trim() !== ''
  ) {
    console.log(
      'ERR decision_inicial_con_datos_cierre=true'
    );

    throw new Error(
      'AUDITORIA_ERROR: la decisión inicial contiene datos de cierre'
    );
  }

  var secuencia = [
    {
      anterior:
        'Pendiente de aprobación',
      nuevo:
        'Pendiente de información'
    },
    {
      anterior:
        'Pendiente de información',
      nuevo:
        'Pendiente de consenso'
    },
    {
      anterior:
        'Pendiente de consenso',
      nuevo:
        'Pendiente de aprobación'
    }
  ];

  var resultados = [];

  secuencia.forEach(
    function (transicion, indice) {
      var registroAntes =
        obtenerRegistroPorId(
          'DECISION',
          idDecision
        );

      var filasHistorialAntes =
        hojaHistorial.getLastRow();

      var fechaModificacionAntes =
        registroAntes.FECHA_MODIFICACION;

      var resultado =
        actualizarRegistroTransaccional(
          'DECISION',
          idDecision,
          {
            ESTADO:
              transicion.nuevo,
            RESOLUCION: '',
            FECHA_RESOLUCION: ''
          },
          {
            dryRun: false,
            origen: 'TEST',
            esPrueba: true,
            pruebaId:
              'TRANSICION_ABIERTA_DECISION_' +
              String(indice + 1)
          }
        );

      SpreadsheetApp.flush();

      var registroDespues =
        obtenerRegistroPorId(
          'DECISION',
          idDecision
        );

      var filasHistorialDespues =
        hojaHistorial.getLastRow();

      var diferencias =
        resultado &&
        Array.isArray(
          resultado.diferencias
        )
          ? resultado.diferencias
          : [];

      var soloEstado =
        diferencias.length === 1 &&
        diferencias[0].campo ===
          'ESTADO' &&
        diferencias[0].anterior ===
          transicion.anterior &&
        diferencias[0].nuevo ===
          transicion.nuevo;

      var estadoPersistido =
        registroDespues.ESTADO ===
        transicion.nuevo;

      var resolucionVacia =
        String(
          registroDespues.RESOLUCION || ''
        ).trim() === '';

      var fechaResolucionVacia =
        String(
          registroDespues
            .FECHA_RESOLUCION || ''
        ).trim() === '';

      var historialCreado =
        filasHistorialDespues ===
        filasHistorialAntes + 1;

      var fechaModificacionInformada =
        registroDespues
          .FECHA_MODIFICACION !==
          null &&
        registroDespues
          .FECHA_MODIFICACION !==
          undefined &&
        String(
          registroDespues
            .FECHA_MODIFICACION
        ).trim() !== '';

      var resultadoMetadatosCorrecto =
        resultado &&
        resultado
          .fechaModificacionActualizada ===
          true &&
        resultado
          .modificadoPorActualizado ===
          true;

      console.log(
        'OK transicion_' +
        String(indice + 1) +
        '=' +
        transicion.anterior +
        ' -> ' +
        transicion.nuevo
      );

      console.log(
        'OK diferencias_transicion_' +
        String(indice + 1) +
        '=' +
        JSON.stringify(diferencias)
      );

      console.log(
        'OK solo_estado_transicion_' +
        String(indice + 1) +
        '=' +
        soloEstado
      );

      console.log(
        'OK estado_persistido_transicion_' +
        String(indice + 1) +
        '=' +
        estadoPersistido
      );

      console.log(
        'OK resolucion_vacia_transicion_' +
        String(indice + 1) +
        '=' +
        resolucionVacia
      );

      console.log(
        'OK fecha_resolucion_vacia_transicion_' +
        String(indice + 1) +
        '=' +
        fechaResolucionVacia
      );

      console.log(
        'OK historial_creado_transicion_' +
        String(indice + 1) +
        '=' +
        historialCreado
      );

      console.log(
        'OK metadatos_actualizados_transicion_' +
        String(indice + 1) +
        '=' +
        resultadoMetadatosCorrecto
      );

      console.log(
        'INFO fecha_modificacion_antes_' +
        String(indice + 1) +
        '=' +
        fechaModificacionAntes
      );

      console.log(
        'INFO fecha_modificacion_despues_' +
        String(indice + 1) +
        '=' +
        registroDespues
          .FECHA_MODIFICACION
      );

      resultados.push({
        indice: indice + 1,
        anterior:
          transicion.anterior,
        nuevo:
          transicion.nuevo,
        soloEstado:
          soloEstado,
        estadoPersistido:
          estadoPersistido,
        resolucionVacia:
          resolucionVacia,
        fechaResolucionVacia:
          fechaResolucionVacia,
        historialCreado:
          historialCreado,
        fechaModificacionInformada:
          fechaModificacionInformada,
        metadatosActualizados:
          resultadoMetadatosCorrecto
      });

      if (
        !soloEstado ||
        !estadoPersistido ||
        !resolucionVacia ||
        !fechaResolucionVacia ||
        !historialCreado ||
        !fechaModificacionInformada ||
        !resultadoMetadatosCorrecto
      ) {
        throw new Error(
          'AUDITORIA_NO_GO: transición abierta incorrecta: ' +
          transicion.anterior +
          ' -> ' +
          transicion.nuevo
        );
      }
    }
  );

  SpreadsheetApp.flush();

  var registroFinal =
    obtenerRegistroPorId(
      'DECISION',
      idDecision
    );

  var filasDecisionesFinales =
    hojaDecisiones.getLastRow();

  var filasHistorialFinales =
    hojaHistorial.getLastRow();

  var estadoRestaurado =
    registroFinal.ESTADO ===
    estadoInicial;

  var resolucionRestaurada =
    compararValoresAuditoria_(
      resolucionInicial,
      registroFinal.RESOLUCION
    );

  var fechaResolucionRestaurada =
    compararValoresAuditoria_(
      fechaResolucionInicial,
      registroFinal.FECHA_RESOLUCION
    );

  var filasDecisionSinCambios =
    filasDecisionesFinales ===
    filasDecisionesIniciales;

  var incrementoHistorialCorrecto =
    filasHistorialFinales ===
    filasHistorialIniciales +
      secuencia.length;

  var pruebasCorrectas =
    resultados.length ===
      secuencia.length &&
    resultados.every(
      function (resultado) {
        return (
          resultado.soloEstado &&
          resultado.estadoPersistido &&
          resultado.resolucionVacia &&
          resultado.fechaResolucionVacia &&
          resultado.historialCreado &&
          resultado
            .fechaModificacionInformada &&
          resultado
            .metadatosActualizados
        );
      }
    );

  console.log(
    'OK resultados=' +
    JSON.stringify(resultados)
  );

  console.log(
    'OK pruebas_correctas=' +
    pruebasCorrectas
  );

  console.log(
    'OK filas_decisiones_iniciales=' +
    filasDecisionesIniciales
  );

  console.log(
    'OK filas_decisiones_finales=' +
    filasDecisionesFinales
  );

  console.log(
    'OK filas_historial_iniciales=' +
    filasHistorialIniciales
  );

  console.log(
    'OK filas_historial_finales=' +
    filasHistorialFinales
  );

  console.log(
    'OK estado_restaurado=' +
    estadoRestaurado
  );

  console.log(
    'OK resolucion_restaurada=' +
    resolucionRestaurada
  );

  console.log(
    'OK fecha_resolucion_restaurada=' +
    fechaResolucionRestaurada
  );

  console.log(
    'OK filas_decision_sin_cambios=' +
    filasDecisionSinCambios
  );

  console.log(
    'OK incremento_historial_correcto=' +
    incrementoHistorialCorrecto
  );

  if (
    !pruebasCorrectas ||
    !estadoRestaurado ||
    !resolucionRestaurada ||
    !fechaResolucionRestaurada ||
    !filasDecisionSinCambios ||
    !incrementoHistorialCorrecto
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      paquete +
      ' result=NO_GO'
    );

    throw new Error(
      'AUDITORIA_NO_GO: las transiciones entre estados abiertos no quedaron cerradas'
    );
  }

  console.log(
    'OK transicion_pendiente_informacion=true'
  );

  console.log(
    'OK transicion_pendiente_consenso=true'
  );

  console.log(
    'OK transicion_pendiente_aprobacion=true'
  );

  console.log(
    'OK decision_restaurada=' +
    idDecision
  );

  console.log(
    'NEXT cerrar_transiciones_estados_abiertos_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    paquete +
    ' result=OK'
  );

  return true;
}

function auditarHistorialTransicionEstadoDecision() {
  var paquete =
    'AUDITAR_HISTORIAL_TRANSICION_ESTADO_DECISION';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    paquete
  );

  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  var hojaDecisiones =
    ss.getSheetByName('12_DECISIONES');

  var hojaHistorial =
    ss.getSheetByName('91_HISTORIAL');

  var idDecision = 'DEC-0001';

  if (!hojaDecisiones) {
    console.log(
      'ERR hoja_no_existe=12_DECISIONES'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 12_DECISIONES'
    );
  }

  if (!hojaHistorial) {
    console.log(
      'ERR hoja_no_existe=91_HISTORIAL'
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe 91_HISTORIAL'
    );
  }

  var registroInicial =
    obtenerRegistroPorId(
      'DECISION',
      idDecision
    );

  if (!registroInicial) {
    console.log(
      'ERR decision_no_existe=' +
      idDecision
    );

    throw new Error(
      'AUDITORIA_ERROR: no existe ' +
      idDecision
    );
  }

  var estadoInicial =
    registroInicial.ESTADO;

  var resolucionInicial =
    registroInicial.RESOLUCION;

  var fechaResolucionInicial =
    registroInicial.FECHA_RESOLUCION;

  var filasDecisionesIniciales =
    hojaDecisiones.getLastRow();

  var filasHistorialIniciales =
    hojaHistorial.getLastRow();

  if (
    estadoInicial !==
    'Pendiente de aprobación'
  ) {
    console.log(
      'ERR estado_inicial_inesperado=' +
      estadoInicial
    );

    throw new Error(
      'AUDITORIA_ERROR: DEC-0001 debe comenzar en Pendiente de aprobación'
    );
  }

  if (
    String(
      resolucionInicial || ''
    ).trim() !== '' ||
    String(
      fechaResolucionInicial || ''
    ).trim() !== ''
  ) {
    console.log(
      'ERR decision_inicial_con_datos_cierre=true'
    );

    throw new Error(
      'AUDITORIA_ERROR: DEC-0001 contiene datos de cierre'
    );
  }

  var estadoDestino =
    'Pendiente de información';

  var correlationIdPrueba =
    generarCorrelationId_();

  var pruebaId =
    'AUD_HIST_TRANSICION_DECISION';

  var resultadoActualizacion = null;
  var historialEncontrado = null;
  var resultadoRestauracion = null;

  try {
    /*
     * 1. Transición real controlada.
     */
    resultadoActualizacion =
      actualizarRegistroTransaccional(
        'DECISION',
        idDecision,
        {
          ESTADO: estadoDestino,
          RESOLUCION: '',
          FECHA_RESOLUCION: ''
        },
        {
          dryRun: false,
          origen: 'TEST',
          correlationId:
            correlationIdPrueba,
          esPrueba: true,
          pruebaId: pruebaId
        }
      );

    SpreadsheetApp.flush();

    var registroTrasActualizar =
      obtenerRegistroPorId(
        'DECISION',
        idDecision
      );

    var filasHistorialTrasActualizar =
      hojaHistorial.getLastRow();

    /*
     * 2. Localizar exactamente el historial
     * mediante CORRELATION_ID.
     */
    var valoresHistorial =
      hojaHistorial
        .getDataRange()
        .getDisplayValues();

    var cabecerasHistorial =
      valoresHistorial[0].map(
        function (valor) {
          return String(valor).trim();
        }
      );

    var registrosHistorial =
      valoresHistorial
        .slice(1)
        .map(function (fila) {
          var registro = {};

          cabecerasHistorial.forEach(
            function (cabecera, indice) {
              registro[cabecera] =
                fila[indice];
            }
          );

          return registro;
        })
        .filter(function (registro) {
          return (
            registro.CORRELATION_ID ===
            correlationIdPrueba
          );
        });

    var historialUnico =
      registrosHistorial.length === 1;

    if (historialUnico) {
      historialEncontrado =
        registrosHistorial[0];
    }

    console.log(
      'OK correlation_id_prueba=' +
      correlationIdPrueba
    );

    console.log(
      'OK registros_historial_encontrados=' +
      registrosHistorial.length
    );

    console.log(
      'OK historial_unico=' +
      historialUnico
    );

    if (!historialUnico) {
      throw new Error(
        'AUDITORIA_NO_GO: no se encontró un único historial para el CORRELATION_ID'
      );
    }

    /*
     * 3. Interpretar JSON del historial.
     */
    var antesJson = null;
    var despuesJson = null;
    var jsonValido = true;

    try {
      antesJson = JSON.parse(
        historialEncontrado.ANTES_JSON ||
        '{}'
      );

      despuesJson = JSON.parse(
        historialEncontrado.DESPUES_JSON ||
        '{}'
      );

    } catch (errorJson) {
      jsonValido = false;

      console.log(
        'ERR historial_json_invalido=' +
        errorJson.message
      );
    }

    var accionCorrecta =
      historialEncontrado.ACCION ===
      'ACTUALIZAR';

    var entidadCorrecta =
      historialEncontrado.ENTIDAD ===
      'DECISION';

    var registroCorrecto =
      historialEncontrado.REGISTRO_ID ===
      idDecision;

    var origenCorrecto =
      historialEncontrado.ORIGEN ===
      'TEST';

    var resultadoCorrecto =
      historialEncontrado.RESULTADO ===
      'OK';

    var esPruebaCorrecto =
      historialEncontrado.ES_PRUEBA ===
      'SÍ';

    var pruebaIdCorrecto =
      historialEncontrado.PRUEBA_ID ===
      pruebaId;

    var correlationIdCorrecto =
      historialEncontrado.CORRELATION_ID ===
      correlationIdPrueba;

    var antesEstadoCorrecto =
      jsonValido &&
      antesJson.ESTADO ===
      estadoInicial;

    var despuesEstadoCorrecto =
      jsonValido &&
      despuesJson.ESTADO ===
      estadoDestino;

    var antesSoloEstado =
      jsonValido &&
      Object.keys(antesJson).length === 1 &&
      Object.prototype.hasOwnProperty.call(
        antesJson,
        'ESTADO'
      );

    var despuesSoloEstado =
      jsonValido &&
      Object.keys(despuesJson).length === 1 &&
      Object.prototype.hasOwnProperty.call(
        despuesJson,
        'ESTADO'
      );

    var estadoPersistido =
      registroTrasActualizar.ESTADO ===
      estadoDestino;

    var historialIncrementado =
      filasHistorialTrasActualizar ===
      filasHistorialIniciales + 1;

    var diferenciasCorrectas =
      resultadoActualizacion &&
      Array.isArray(
        resultadoActualizacion.diferencias
      ) &&
      resultadoActualizacion
        .diferencias.length === 1 &&
      resultadoActualizacion
        .diferencias[0].campo ===
        'ESTADO' &&
      resultadoActualizacion
        .diferencias[0].anterior ===
        estadoInicial &&
      resultadoActualizacion
        .diferencias[0].nuevo ===
        estadoDestino;

    console.log(
      'OK historial=' +
      JSON.stringify(
        historialEncontrado
      )
    );

    console.log(
      'OK antes_json=' +
      JSON.stringify(antesJson)
    );

    console.log(
      'OK despues_json=' +
      JSON.stringify(despuesJson)
    );

    console.log(
      'OK json_valido=' +
      jsonValido
    );

    console.log(
      'OK accion_correcta=' +
      accionCorrecta
    );

    console.log(
      'OK entidad_correcta=' +
      entidadCorrecta
    );

    console.log(
      'OK registro_correcto=' +
      registroCorrecto
    );

    console.log(
      'OK origen_correcto=' +
      origenCorrecto
    );

    console.log(
      'OK resultado_correcto=' +
      resultadoCorrecto
    );

    console.log(
      'OK es_prueba_correcto=' +
      esPruebaCorrecto
    );

    console.log(
      'OK prueba_id_correcto=' +
      pruebaIdCorrecto
    );

    console.log(
      'OK correlation_id_correcto=' +
      correlationIdCorrecto
    );

    console.log(
      'OK antes_estado_correcto=' +
      antesEstadoCorrecto
    );

    console.log(
      'OK despues_estado_correcto=' +
      despuesEstadoCorrecto
    );

    console.log(
      'OK antes_solo_estado=' +
      antesSoloEstado
    );

    console.log(
      'OK despues_solo_estado=' +
      despuesSoloEstado
    );

    console.log(
      'OK estado_persistido=' +
      estadoPersistido
    );

    console.log(
      'OK historial_incrementado=' +
      historialIncrementado
    );

    console.log(
      'OK diferencias_correctas=' +
      diferenciasCorrectas
    );

    if (
      !jsonValido ||
      !accionCorrecta ||
      !entidadCorrecta ||
      !registroCorrecto ||
      !origenCorrecto ||
      !resultadoCorrecto ||
      !esPruebaCorrecto ||
      !pruebaIdCorrecto ||
      !correlationIdCorrecto ||
      !antesEstadoCorrecto ||
      !despuesEstadoCorrecto ||
      !antesSoloEstado ||
      !despuesSoloEstado ||
      !estadoPersistido ||
      !historialIncrementado ||
      !diferenciasCorrectas
    ) {
      throw new Error(
        'AUDITORIA_NO_GO: contenido semántico del historial incorrecto'
      );
    }

  } finally {
    /*
     * 4. Restauración controlada.
     * Se usa otro CORRELATION_ID para diferenciar
     * claramente la restauración.
     */
    var registroAntesRestaurar =
      obtenerRegistroPorId(
        'DECISION',
        idDecision
      );

    if (
      registroAntesRestaurar &&
      registroAntesRestaurar.ESTADO !==
        estadoInicial
    ) {
      resultadoRestauracion =
        actualizarRegistroTransaccional(
          'DECISION',
          idDecision,
          {
            ESTADO: estadoInicial,
            RESOLUCION:
              resolucionInicial || '',
            FECHA_RESOLUCION:
              fechaResolucionInicial || ''
          },
          {
            dryRun: false,
            origen: 'TEST',
            correlationId:
              generarCorrelationId_(),
            esPrueba: true,
            pruebaId:
              'RESTAURAR_' +
              pruebaId
          }
        );

      SpreadsheetApp.flush();
    }
  }

  /*
   * 5. Comprobación final.
   */
  var registroFinal =
    obtenerRegistroPorId(
      'DECISION',
      idDecision
    );

  var filasDecisionesFinales =
    hojaDecisiones.getLastRow();

  var filasHistorialFinales =
    hojaHistorial.getLastRow();

  var estadoRestaurado =
    registroFinal.ESTADO ===
    estadoInicial;

  var resolucionRestaurada =
    compararValoresAuditoria_(
      resolucionInicial,
      registroFinal.RESOLUCION
    );

  var fechaResolucionRestaurada =
    compararValoresAuditoria_(
      fechaResolucionInicial,
      registroFinal.FECHA_RESOLUCION
    );

  var filasDecisionesSinCambios =
    filasDecisionesFinales ===
    filasDecisionesIniciales;

  /*
   * Historial esperado:
   * +1 transición auditada
   * +1 restauración
   */
  var incrementoHistorialFinalCorrecto =
    filasHistorialFinales ===
    filasHistorialIniciales + 2;

  console.log(
    'OK filas_decisiones_iniciales=' +
    filasDecisionesIniciales
  );

  console.log(
    'OK filas_decisiones_finales=' +
    filasDecisionesFinales
  );

  console.log(
    'OK filas_historial_iniciales=' +
    filasHistorialIniciales
  );

  console.log(
    'OK filas_historial_finales=' +
    filasHistorialFinales
  );

  console.log(
    'OK estado_restaurado=' +
    estadoRestaurado
  );

  console.log(
    'OK resolucion_restaurada=' +
    resolucionRestaurada
  );

  console.log(
    'OK fecha_resolucion_restaurada=' +
    fechaResolucionRestaurada
  );

  console.log(
    'OK filas_decisiones_sin_cambios=' +
    filasDecisionesSinCambios
  );

  console.log(
    'OK incremento_historial_final_correcto=' +
    incrementoHistorialFinalCorrecto
  );

  if (
    !estadoRestaurado ||
    !resolucionRestaurada ||
    !fechaResolucionRestaurada ||
    !filasDecisionesSinCambios ||
    !incrementoHistorialFinalCorrecto
  ) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      paquete +
      ' result=ERR'
    );

    throw new Error(
      'AUDITORIA_ERROR: restauración final incorrecta'
    );
  }

  console.log(
    'OK trazabilidad_semantica_decision=true'
  );

  console.log(
    'OK historial_transicion_verificado=true'
  );

  console.log(
    'OK decision_restaurada=' +
    idDecision
  );

  console.log(
    'NEXT cerrar_trazabilidad_semantica_decision'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    paquete +
    ' result=OK'
  );

  return true;
}

function auditarIntegridadDecisionProyectoHuerfano() {
  var packageName = 'AUDITAR_INTEGRIDAD_DECISION_PROYECTO_HUERFANO';
  var pruebaId = 'DEC-AUD-FK-PRO-001';
  var proyectoHuerfano = 'PRO-AUD-INEXISTENTE';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('12_DECISIONES');
  var filaInsertada = null;
  var filasIniciales = null;

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  try {
    if (!hoja) {
      throw new Error('No existe la hoja 12_DECISIONES');
    }

    filasIniciales = hoja.getLastRow();

    var cabeceras = hoja
      .getRange(1, 1, 1, hoja.getLastColumn())
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

    var camposRequeridos = [
      'ID',
      'PROYECTO_ID',
      'TITULO',
      'TIPO',
      'ESTADO',
      'IMPACTO',
      'FECHA_CREACION',
      'CREADO_POR',
      'FECHA_MODIFICACION',
      'MODIFICADO_POR',
      'ACTIVO'
    ];

    var camposFaltantes = camposRequeridos.filter(function(campo) {
      return cabeceras.indexOf(campo) === -1;
    });

    if (camposFaltantes.length > 0) {
      throw new Error(
        'Faltan columnas requeridas: ' +
        camposFaltantes.join(', ')
      );
    }

    var proyectosExistentes = obtenerIdsDeEntidad_('PROYECTO');

    if (proyectosExistentes.indexOf(proyectoHuerfano) !== -1) {
      throw new Error(
        'El ID temporal existe realmente en PROYECTO: ' +
        proyectoHuerfano
      );
    }

    var ahora = new Date();

    var registroTemporal = {
      ID: pruebaId,
      PROYECTO_ID: proyectoHuerfano,
      TITULO: 'Auditoria integridad DECISION proyecto huerfano',
      TIPO: 'Técnica',
      ESTADO: 'Pendiente de aprobación',
      IMPACTO: 'Medio',
      FECHA_CREACION: ahora,
      CREADO_POR: 'TEST_INTEGRITY',
      FECHA_MODIFICACION: ahora,
      MODIFICADO_POR: 'TEST_INTEGRITY',
      ACTIVO: 'SÍ'
    };

    var filaTemporal = cabeceras.map(function(cabecera) {
      return Object.prototype.hasOwnProperty.call(
        registroTemporal,
        cabecera
      )
        ? registroTemporal[cabecera]
        : '';
    });

    hoja.appendRow(filaTemporal);
    SpreadsheetApp.flush();
    filaInsertada = hoja.getLastRow();

    console.log(
      'OK fixture_inserted=true decision_id=' +
      pruebaId +
      ' proyecto_id=' +
      proyectoHuerfano
    );

    var hallazgos =
      detectarReferenciasHuerfanas('DECISION');

    var coincidencias = hallazgos.filter(function(hallazgo) {
      return hallazgo.registroId === pruebaId &&
        hallazgo.campo === 'PROYECTO_ID' &&
        hallazgo.entidadDestino === 'PROYECTO' &&
        hallazgo.valorReferenciado === proyectoHuerfano;
    });

    console.log(
      'OK referencias_huerfanas_totales=' +
      hallazgos.length
    );

    console.log(
      'OK coincidencias_prueba=' +
      coincidencias.length
    );

    if (coincidencias.length !== 1) {
      throw new Error(
        'Se esperaba exactamente un hallazgo para la decisión temporal y se obtuvieron ' +
        coincidencias.length
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(coincidencias[0])
    );

    console.log(
      'OK detection_verified=true'
    );

  } catch (error) {
    console.error(
      'ERR package=' +
      packageName +
      ' message=' +
      error.message
    );

    throw error;

  } finally {
    try {
      if (hoja) {
        var ultimaFila = hoja.getLastRow();

        if (ultimaFila >= 2) {
          var ids = hoja
            .getRange(2, 1, ultimaFila - 1, 1)
            .getDisplayValues();

          for (var i = ids.length - 1; i >= 0; i--) {
            if (
              String(ids[i][0]).trim() === pruebaId
            ) {
              hoja.deleteRow(i + 2);
            }
          }

          SpreadsheetApp.flush();
        }

        var filasFinales = hoja.getLastRow();

        console.log(
          filasIniciales === filasFinales
            ? 'OK sheet_restored=true filas_iniciales=' +
              filasIniciales +
              ' filas_finales=' +
              filasFinales
            : 'ERR sheet_restored=false filas_iniciales=' +
              filasIniciales +
              ' filas_finales=' +
              filasFinales
        );

        if (
          filasIniciales !== null &&
          filasIniciales !== filasFinales
        ) {
          throw new Error(
            '12_DECISIONES no quedó restaurada'
          );
        }
      }

      console.log(
        'NEXT revisar_resultado_y_autorizar_RESPONSABLE_ID_huerfano'
      );

      console.log(
        'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=OK'
      );

    } catch (cleanupError) {
      console.error(
        'ERR cleanup_failed=true message=' +
        cleanupError.message
      );

      console.log(
        'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=ERR'
      );

      throw cleanupError;
    }
  }
}


function auditarIntegridadDecisionResponsableHuerfano() {
  var packageName = 'AUDITAR_INTEGRIDAD_DECISION_RESPONSABLE_HUERFANO';
  var pruebaId = 'DEC-AUD-FK-RESP-001';
  var responsableHuerfano = 'PER-AUD-INEXISTENTE';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDecisiones = ss.getSheetByName('12_DECISIONES');
  var hojaResponsables = ss.getSheetByName('11_PERSONAS_EQUIPOS');
  var filasIniciales = null;
  var errorPendiente = null;

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  try {
    if (!hojaDecisiones) {
      throw new Error('No existe la hoja 12_DECISIONES');
    }

    if (!hojaResponsables) {
      throw new Error('No existe la hoja 11_PERSONAS_EQUIPOS');
    }

    filasIniciales = hojaDecisiones.getLastRow();

    var cabeceras = hojaDecisiones
      .getRange(1, 1, 1, hojaDecisiones.getLastColumn())
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

    var idxId = cabeceras.indexOf('ID');
    var idxProyecto = cabeceras.indexOf('PROYECTO_ID');
    var idxResponsable = cabeceras.indexOf('RESPONSABLE_ID');
    var idxActivo = cabeceras.indexOf('ACTIVO');

    if (
      idxId === -1 ||
      idxProyecto === -1 ||
      idxResponsable === -1 ||
      idxActivo === -1
    ) {
      throw new Error(
        'Faltan columnas ID, PROYECTO_ID, RESPONSABLE_ID o ACTIVO'
      );
    }

    var idsResponsables = obtenerIdsDeEntidad_('PERSONA_EQUIPO');

    if (idsResponsables.indexOf(responsableHuerfano) !== -1) {
      throw new Error(
        'El responsable temporal existe realmente: ' +
        responsableHuerfano
      );
    }

    var datosDecisiones = filasIniciales < 2
      ? []
      : hojaDecisiones
        .getRange(
          2,
          1,
          filasIniciales - 1,
          cabeceras.length
        )
        .getValues();

    var filaBase = null;

    datosDecisiones.some(function(fila) {
      var proyectoId = String(
        fila[idxProyecto] || ''
      ).trim();

      if (
        proyectoId !== '' &&
        obtenerIdsDeEntidad_('PROYECTO')
          .indexOf(proyectoId) !== -1
      ) {
        filaBase = fila.slice();
        return true;
      }

      return false;
    });

    if (!filaBase) {
      throw new Error(
        'No existe una DECISION base con PROYECTO_ID válido'
      );
    }

    filaBase[idxId] = pruebaId;
    filaBase[idxResponsable] = responsableHuerfano;
    filaBase[idxActivo] = 'SÍ';

    hojaDecisiones.appendRow(filaBase);
    SpreadsheetApp.flush();

    console.log(
      'OK fixture_inserted=true decision_id=' +
      pruebaId +
      ' responsable_id=' +
      responsableHuerfano
    );

    var reporte = obtenerReporteIntegridad();

    var referenciasDecision =
      reporte.referenciasHuerfanas.DECISION || [];

    var coincidenciasFk =
      referenciasDecision.filter(function(hallazgo) {
        return hallazgo.registroId === pruebaId &&
          hallazgo.campo === 'RESPONSABLE_ID' &&
          hallazgo.entidadDestino === 'PERSONA_EQUIPO' &&
          hallazgo.valorReferenciado === responsableHuerfano;
      });

    var hallazgosFuncionales = [];

    if (reporte.funcional) {
      ['errores', 'advertencias', 'informacion']
        .forEach(function(grupo) {
          if (Array.isArray(reporte.funcional[grupo])) {
            hallazgosFuncionales =
              hallazgosFuncionales.concat(
                reporte.funcional[grupo]
              );
          }
        });
    }

    var coincidenciasFuncionales =
      hallazgosFuncionales.filter(function(hallazgo) {
        return hallazgo.entidad === 'DECISION' &&
          hallazgo.registroId === pruebaId &&
          String(hallazgo.descripcion || '')
            .indexOf(responsableHuerfano) !== -1;
      });

    var deteccionesTotales =
      coincidenciasFk.length +
      coincidenciasFuncionales.length;

    console.log(
      'OK coincidencias_fk=' +
      coincidenciasFk.length
    );

    console.log(
      'OK coincidencias_funcionales=' +
      coincidenciasFuncionales.length
    );

    console.log(
      'OK detecciones_totales=' +
      deteccionesTotales
    );

    if (deteccionesTotales !== 1) {
      throw new Error(
        'RESPONSABLE_ID huerfano no detectado exactamente una vez; detecciones=' +
        deteccionesTotales
      );
    }

    console.log('OK detection_verified=true');

  } catch (error) {
    errorPendiente = error;

    console.error(
      'ERR package=' +
      packageName +
      ' message=' +
      error.message
    );

  } finally {
    try {
      if (hojaDecisiones) {
        var ultimaFila = hojaDecisiones.getLastRow();

        if (ultimaFila >= 2) {
          var ids = hojaDecisiones
            .getRange(2, 1, ultimaFila - 1, 1)
            .getDisplayValues();

          for (var i = ids.length - 1; i >= 0; i--) {
            if (
              String(ids[i][0]).trim() === pruebaId
            ) {
              hojaDecisiones.deleteRow(i + 2);
            }
          }

          SpreadsheetApp.flush();
        }

        var filasFinales =
          hojaDecisiones.getLastRow();

        if (filasIniciales !== filasFinales) {
          throw new Error(
            '12_DECISIONES no quedó restaurada: iniciales=' +
            filasIniciales +
            ' finales=' +
            filasFinales
          );
        }

        console.log(
          'OK sheet_restored=true filas_iniciales=' +
          filasIniciales +
          ' filas_finales=' +
          filasFinales
        );
      }
    } catch (cleanupError) {
      console.error(
        'ERR cleanup_failed=true message=' +
        cleanupError.message
      );

      errorPendiente = cleanupError;
    }
  }

  if (errorPendiente) {
    console.log(
      'NEXT detener_auditoria_y_reparar_RESPONSABLE_ID'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw errorPendiente;
  }

  console.log(
    'NEXT revisar_resultado_y_autorizar_estado_cerrado_sin_resolucion'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );
}

function auditarIntegridadDecisionCerradaSinResolucion() {
  var packageName = 'AUDITAR_INTEGRIDAD_DECISION_CERRADA_SIN_RESOLUCION';
  var pruebaId = 'DEC-AUD-CIERRE-SIN-RES-001';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('12_DECISIONES');
  var filasIniciales = null;
  var errorPendiente = null;

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  try {
    if (!hoja) {
      throw new Error('No existe la hoja 12_DECISIONES');
    }

    if (
      typeof ESTADOS_DECISION_CIERRE_ === 'undefined' ||
      !Array.isArray(ESTADOS_DECISION_CIERRE_) ||
      ESTADOS_DECISION_CIERRE_.length === 0
    ) {
      throw new Error(
        'ESTADOS_DECISION_CIERRE_ no está definido o está vacío'
      );
    }

    filasIniciales = hoja.getLastRow();

    var cabeceras = hoja
      .getRange(1, 1, 1, hoja.getLastColumn())
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

    var camposRequeridos = [
      'ID',
      'PROYECTO_ID',
      'TITULO',
      'TIPO',
      'ESTADO',
      'IMPACTO',
      'RESOLUCION',
      'FECHA_RESOLUCION',
      'FECHA_CREACION',
      'CREADO_POR',
      'FECHA_MODIFICACION',
      'MODIFICADO_POR',
      'ACTIVO'
    ];

    var faltantes = camposRequeridos.filter(function(campo) {
      return cabeceras.indexOf(campo) === -1;
    });

    if (faltantes.length > 0) {
      throw new Error(
        'Faltan columnas requeridas: ' +
        faltantes.join(', ')
      );
    }

    var proyectos = obtenerIdsDeEntidad_('PROYECTO');

    if (proyectos.length === 0) {
      throw new Error(
        'No existe ningún PROYECTO válido para construir la prueba'
      );
    }

    var ahora = new Date();
    var estadoCierre = ESTADOS_DECISION_CIERRE_[0];

    var registroTemporal = {
      ID: pruebaId,
      PROYECTO_ID: proyectos[0],
      TITULO: 'Auditoria decision cerrada sin resolucion',
      TIPO: 'Técnica',
      ESTADO: estadoCierre,
      IMPACTO: 'Medio',
      RESOLUCION: '',
      FECHA_RESOLUCION: ahora,
      FECHA_CREACION: ahora,
      CREADO_POR: 'TEST_INTEGRITY',
      FECHA_MODIFICACION: ahora,
      MODIFICADO_POR: 'TEST_INTEGRITY',
      ACTIVO: 'SÍ'
    };

    var filaTemporal = cabeceras.map(function(cabecera) {
      return Object.prototype.hasOwnProperty.call(
        registroTemporal,
        cabecera
      )
        ? registroTemporal[cabecera]
        : '';
    });

    hoja.appendRow(filaTemporal);
    SpreadsheetApp.flush();

    console.log(
      'OK fixture_inserted=true decision_id=' +
      pruebaId +
      ' estado=' +
      estadoCierre
    );

    console.log('OK resolucion_vacia=true');
    console.log('OK fecha_resolucion_informada=true');

    var reporte = obtenerReporteIntegridad();

    var erroresFuncionales =
      reporte.funcional &&
      Array.isArray(reporte.funcional.errores)
        ? reporte.funcional.errores
        : [];

    var coincidencias = erroresFuncionales.filter(function(hallazgo) {
      return hallazgo.codigo === 'FUNC-DEC-001' &&
        hallazgo.entidad === 'DECISION' &&
        hallazgo.registroId === pruebaId;
    });

    console.log(
      'OK coincidencias_funcionales=' +
      coincidencias.length
    );

    if (coincidencias.length !== 1) {
      throw new Error(
        'Se esperaba exactamente un hallazgo FUNC-DEC-001 y se obtuvieron ' +
        coincidencias.length
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(coincidencias[0])
    );

    console.log('OK detection_verified=true');

  } catch (error) {
    errorPendiente = error;

    console.error(
      'ERR package=' +
      packageName +
      ' message=' +
      error.message
    );

  } finally {
    try {
      if (hoja) {
        var ultimaFila = hoja.getLastRow();

        if (ultimaFila >= 2) {
          var ids = hoja
            .getRange(2, 1, ultimaFila - 1, 1)
            .getDisplayValues();

          for (var i = ids.length - 1; i >= 0; i--) {
            if (String(ids[i][0]).trim() === pruebaId) {
              hoja.deleteRow(i + 2);
            }
          }

          SpreadsheetApp.flush();
        }

        var filasFinales = hoja.getLastRow();

        if (filasIniciales !== filasFinales) {
          throw new Error(
            '12_DECISIONES no quedó restaurada: iniciales=' +
            filasIniciales +
            ' finales=' +
            filasFinales
          );
        }

        console.log(
          'OK sheet_restored=true filas_iniciales=' +
          filasIniciales +
          ' filas_finales=' +
          filasFinales
        );
      }
    } catch (cleanupError) {
      errorPendiente = cleanupError;

      console.error(
        'ERR cleanup_failed=true message=' +
        cleanupError.message
      );
    }
  }

  if (errorPendiente) {
    console.log(
      'NEXT detener_auditoria_y_diagnosticar_estado_cerrado_sin_resolucion'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw errorPendiente;
  }

  console.log(
    'NEXT revisar_resultado_y_autorizar_estado_abierto_con_datos_cierre'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );
}

function auditarIntegridadDecisionAbiertaConDatosCierre() {
  var packageName = 'AUDITAR_INTEGRIDAD_DECISION_ABIERTA_CON_DATOS_CIERRE';
  var pruebaId = 'DEC-AUD-ABIERTA-CIERRE-001';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('12_DECISIONES');
  var filasIniciales = null;
  var errorPendiente = null;

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  try {
    if (!hoja) {
      throw new Error('No existe la hoja 12_DECISIONES');
    }

    if (
      typeof ESTADOS_DECISION_CIERRE_ === 'undefined' ||
      !Array.isArray(ESTADOS_DECISION_CIERRE_)
    ) {
      throw new Error('ESTADOS_DECISION_CIERRE_ no está disponible');
    }

    filasIniciales = hoja.getLastRow();

    var cabeceras = hoja
      .getRange(1, 1, 1, hoja.getLastColumn())
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

    var camposRequeridos = [
      'ID',
      'PROYECTO_ID',
      'TITULO',
      'TIPO',
      'ESTADO',
      'IMPACTO',
      'RESOLUCION',
      'FECHA_RESOLUCION',
      'FECHA_CREACION',
      'CREADO_POR',
      'FECHA_MODIFICACION',
      'MODIFICADO_POR',
      'ACTIVO'
    ];

    var faltantes = camposRequeridos.filter(function(campo) {
      return cabeceras.indexOf(campo) === -1;
    });

    if (faltantes.length > 0) {
      throw new Error(
        'Faltan columnas requeridas: ' +
        faltantes.join(', ')
      );
    }

    var proyectos = obtenerIdsDeEntidad_('PROYECTO');

    if (proyectos.length === 0) {
      throw new Error(
        'No existe ningún PROYECTO válido para construir la prueba'
      );
    }

    var estadosPosibles = [
      'Pendiente de aprobación',
      'Pendiente de información'
    ];

    var estadoAbierto = estadosPosibles.filter(function(estado) {
      return ESTADOS_DECISION_CIERRE_.indexOf(estado) === -1;
    })[0];

    if (!estadoAbierto) {
      throw new Error(
        'No se pudo resolver un estado abierto válido'
      );
    }

    var ahora = new Date();

    var registroTemporal = {
      ID: pruebaId,
      PROYECTO_ID: proyectos[0],
      TITULO: 'Auditoria decision abierta con datos de cierre',
      TIPO: 'Técnica',
      ESTADO: estadoAbierto,
      IMPACTO: 'Medio',
      RESOLUCION: 'Resolución temporal indebida',
      FECHA_RESOLUCION: ahora,
      FECHA_CREACION: ahora,
      CREADO_POR: 'TEST_INTEGRITY',
      FECHA_MODIFICACION: ahora,
      MODIFICADO_POR: 'TEST_INTEGRITY',
      ACTIVO: 'SÍ'
    };

    var filaTemporal = cabeceras.map(function(cabecera) {
      return Object.prototype.hasOwnProperty.call(
        registroTemporal,
        cabecera
      )
        ? registroTemporal[cabecera]
        : '';
    });

    hoja.appendRow(filaTemporal);
    SpreadsheetApp.flush();

    console.log(
      'OK fixture_inserted=true decision_id=' +
      pruebaId +
      ' estado=' +
      estadoAbierto
    );

    console.log('OK resolucion_informada=true');
    console.log('OK fecha_resolucion_informada=true');

    var reporte = obtenerReporteIntegridad();

    var grupos = [
      reporte.funcional.errores || [],
      reporte.funcional.advertencias || [],
      reporte.funcional.informacion || []
    ];

    var hallazgos = [].concat.apply([], grupos);

    var coincidencias = hallazgos.filter(function(hallazgo) {
      return hallazgo.entidad === 'DECISION' &&
        hallazgo.registroId === pruebaId;
    });

    console.log(
      'OK coincidencias_funcionales=' +
      coincidencias.length
    );

    if (coincidencias.length !== 1) {
      throw new Error(
        'Estado abierto con datos de cierre no detectado exactamente una vez; detecciones=' +
        coincidencias.length
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(coincidencias[0])
    );

    console.log('OK detection_verified=true');

  } catch (error) {
    errorPendiente = error;

    console.error(
      'ERR package=' +
      packageName +
      ' message=' +
      error.message
    );

  } finally {
    try {
      if (hoja) {
        var ultimaFila = hoja.getLastRow();

        if (ultimaFila >= 2) {
          var ids = hoja
            .getRange(2, 1, ultimaFila - 1, 1)
            .getDisplayValues();

          for (var i = ids.length - 1; i >= 0; i--) {
            if (String(ids[i][0]).trim() === pruebaId) {
              hoja.deleteRow(i + 2);
            }
          }

          SpreadsheetApp.flush();
        }

        var filasFinales = hoja.getLastRow();

        if (filasIniciales !== filasFinales) {
          throw new Error(
            '12_DECISIONES no quedó restaurada: iniciales=' +
            filasIniciales +
            ' finales=' +
            filasFinales
          );
        }

        console.log(
          'OK sheet_restored=true filas_iniciales=' +
          filasIniciales +
          ' filas_finales=' +
          filasFinales
        );
      }
    } catch (cleanupError) {
      errorPendiente = cleanupError;

      console.error(
        'ERR cleanup_failed=true message=' +
        cleanupError.message
      );
    }
  }

  if (errorPendiente) {
    console.log(
      'NEXT detener_auditoria_y_reparar_estado_abierto_con_datos_cierre'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw errorPendiente;
  }

  console.log(
    'NEXT revisar_resultado_y_autorizar_fecha_resolucion_anterior_a_creacion'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );
}


function auditarIntegridadDecisionFechaResolucionAnteriorCreacion() {
  var packageName =
    'AUDITAR_INTEGRIDAD_DECISION_FECHA_RESOLUCION_ANTERIOR_CREACION';

  var pruebaId =
    'DEC-AUD-FECHA-RES-001';

  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  var hoja =
    ss.getSheetByName('12_DECISIONES');

  var filasIniciales = null;
  var errorPendiente = null;

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  try {
    if (!hoja) {
      throw new Error(
        'No existe la hoja 12_DECISIONES'
      );
    }

    if (
      typeof ESTADOS_DECISION_CIERRE_ ===
        'undefined' ||
      !Array.isArray(
        ESTADOS_DECISION_CIERRE_
      ) ||
      ESTADOS_DECISION_CIERRE_.length === 0
    ) {
      throw new Error(
        'ESTADOS_DECISION_CIERRE_ no está disponible'
      );
    }

    filasIniciales =
      hoja.getLastRow();

    var cabeceras =
      hoja
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

    var camposRequeridos = [
      'ID',
      'PROYECTO_ID',
      'TITULO',
      'TIPO',
      'ESTADO',
      'IMPACTO',
      'RESOLUCION',
      'FECHA_RESOLUCION',
      'FECHA_CREACION',
      'CREADO_POR',
      'FECHA_MODIFICACION',
      'MODIFICADO_POR',
      'ACTIVO'
    ];

    var faltantes =
      camposRequeridos.filter(
        function(campo) {
          return cabeceras.indexOf(campo) === -1;
        }
      );

    if (faltantes.length > 0) {
      throw new Error(
        'Faltan columnas requeridas: ' +
        faltantes.join(', ')
      );
    }

    var proyectos =
      obtenerIdsDeEntidad_('PROYECTO');

    if (proyectos.length === 0) {
      throw new Error(
        'No existe ningún PROYECTO válido para construir la prueba'
      );
    }

    var fechaCreacion =
      new Date(2026, 6, 28, 10, 0, 0);

    var fechaResolucion =
      new Date(2026, 6, 27, 10, 0, 0);

    var registroTemporal = {
      ID: pruebaId,
      PROYECTO_ID: proyectos[0],
      TITULO:
        'Auditoria fecha resolucion anterior a creacion',
      TIPO: 'Técnica',
      ESTADO:
        ESTADOS_DECISION_CIERRE_[0],
      IMPACTO: 'Medio',
      RESOLUCION:
        'Resolución temporal válida',
      FECHA_RESOLUCION:
        fechaResolucion,
      FECHA_CREACION:
        fechaCreacion,
      CREADO_POR:
        'TEST_INTEGRITY',
      FECHA_MODIFICACION:
        fechaCreacion,
      MODIFICADO_POR:
        'TEST_INTEGRITY',
      ACTIVO: 'SÍ'
    };

    var filaTemporal =
      cabeceras.map(
        function(cabecera) {
          return Object.prototype
            .hasOwnProperty.call(
              registroTemporal,
              cabecera
            )
            ? registroTemporal[cabecera]
            : '';
        }
      );

    hoja.appendRow(
      filaTemporal
    );

    SpreadsheetApp.flush();

    console.log(
      'OK fixture_inserted=true decision_id=' +
      pruebaId
    );

    console.log(
      'OK fecha_creacion=' +
      fechaCreacion.toISOString()
    );

    console.log(
      'OK fecha_resolucion=' +
      fechaResolucion.toISOString()
    );

    console.log(
      'OK fecha_resolucion_anterior=true'
    );

    var reporte =
      obtenerReporteIntegridad();

    var grupos = [
      reporte.funcional.errores || [],
      reporte.funcional.advertencias || [],
      reporte.funcional.informacion || []
    ];

    var hallazgos =
      [].concat.apply([], grupos);

    var coincidencias =
      hallazgos.filter(
        function(hallazgo) {
          return (
            hallazgo.entidad === 'DECISION' &&
            hallazgo.registroId === pruebaId
          );
        }
      );

    console.log(
      'OK coincidencias_funcionales=' +
      coincidencias.length
    );

    if (coincidencias.length !== 1) {
      throw new Error(
        'FECHA_RESOLUCION anterior a FECHA_CREACION no detectada exactamente una vez; detecciones=' +
        coincidencias.length
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(
        coincidencias[0]
      )
    );

    console.log(
      'OK detection_verified=true'
    );

  } catch (error) {
    errorPendiente = error;

    console.error(
      'ERR package=' +
      packageName +
      ' message=' +
      error.message
    );

  } finally {
    try {
      if (hoja) {
        var ultimaFila =
          hoja.getLastRow();

        if (ultimaFila >= 2) {
          var ids =
            hoja
              .getRange(
                2,
                1,
                ultimaFila - 1,
                1
              )
              .getDisplayValues();

          for (
            var i = ids.length - 1;
            i >= 0;
            i--
          ) {
            if (
              String(ids[i][0]).trim() ===
              pruebaId
            ) {
              hoja.deleteRow(
                i + 2
              );
            }
          }

          SpreadsheetApp.flush();
        }

        var filasFinales =
          hoja.getLastRow();

        if (
          filasIniciales !==
          filasFinales
        ) {
          throw new Error(
            '12_DECISIONES no quedó restaurada: iniciales=' +
            filasIniciales +
            ' finales=' +
            filasFinales
          );
        }

        console.log(
          'OK sheet_restored=true filas_iniciales=' +
          filasIniciales +
          ' filas_finales=' +
          filasFinales
        );
      }

    } catch (cleanupError) {
      errorPendiente =
        cleanupError;

      console.error(
        'ERR cleanup_failed=true message=' +
        cleanupError.message
      );
    }
  }

  if (errorPendiente) {
    console.log(
      'NEXT detener_auditoria_y_reparar_fecha_resolucion_anterior_creacion'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw errorPendiente;
  }

  console.log(
    'NEXT revisar_resultado_y_autorizar_fecha_limite_anterior_creacion'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );
}

function auditarIntegridadDecisionFechaLimiteAnteriorCreacion() {
  var packageName =
    'AUDITAR_INTEGRIDAD_DECISION_FECHA_LIMITE_ANTERIOR_CREACION';

  var pruebaId =
    'DEC-AUD-FECHA-LIM-001';

  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  var hoja =
    ss.getSheetByName('12_DECISIONES');

  var filasIniciales = null;
  var errorPendiente = null;

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  try {
    if (!hoja) {
      throw new Error(
        'No existe la hoja 12_DECISIONES'
      );
    }

    filasIniciales =
      hoja.getLastRow();

    var cabeceras =
      hoja
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

    var camposRequeridos = [
      'ID',
      'PROYECTO_ID',
      'TITULO',
      'TIPO',
      'ESTADO',
      'IMPACTO',
      'FECHA_LIMITE',
      'FECHA_CREACION',
      'CREADO_POR',
      'FECHA_MODIFICACION',
      'MODIFICADO_POR',
      'ACTIVO'
    ];

    var faltantes =
      camposRequeridos.filter(function(campo) {
        return cabeceras.indexOf(campo) === -1;
      });

    if (faltantes.length > 0) {
      throw new Error(
        'Faltan columnas requeridas: ' +
        faltantes.join(', ')
      );
    }

    var proyectos =
      obtenerIdsDeEntidad_('PROYECTO');

    if (proyectos.length === 0) {
      throw new Error(
        'No existe ningún PROYECTO válido para construir la prueba'
      );
    }

    var fechaCreacion =
      new Date(2026, 6, 28, 10, 0, 0);

    var fechaLimite =
      new Date(2026, 6, 27, 10, 0, 0);

    var registroTemporal = {
      ID: pruebaId,
      PROYECTO_ID: proyectos[0],
      TITULO:
        'Auditoria fecha limite anterior a creacion',
      TIPO: 'Técnica',
      ESTADO: 'Pendiente de aprobación',
      IMPACTO: 'Medio',
      FECHA_LIMITE: fechaLimite,
      RESOLUCION: '',
      FECHA_RESOLUCION: '',
      FECHA_CREACION: fechaCreacion,
      CREADO_POR: 'TEST_INTEGRITY',
      FECHA_MODIFICACION: fechaCreacion,
      MODIFICADO_POR: 'TEST_INTEGRITY',
      ACTIVO: 'SÍ'
    };

    var filaTemporal =
      cabeceras.map(function(cabecera) {
        return Object.prototype.hasOwnProperty.call(
          registroTemporal,
          cabecera
        )
          ? registroTemporal[cabecera]
          : '';
      });

    hoja.appendRow(filaTemporal);
    SpreadsheetApp.flush();

    console.log(
      'OK fixture_inserted=true decision_id=' +
      pruebaId
    );

    console.log(
      'OK fecha_creacion=' +
      fechaCreacion.toISOString()
    );

    console.log(
      'OK fecha_limite=' +
      fechaLimite.toISOString()
    );

    console.log(
      'OK fecha_limite_anterior=true'
    );

    var reporte =
      obtenerReporteIntegridad();

    var grupos = [
      reporte.funcional.errores || [],
      reporte.funcional.advertencias || [],
      reporte.funcional.informacion || []
    ];

    var hallazgos =
      [].concat.apply([], grupos);

    var coincidencias =
      hallazgos.filter(function(hallazgo) {
        return hallazgo.entidad === 'DECISION' &&
          hallazgo.registroId === pruebaId;
      });

    console.log(
      'OK coincidencias_funcionales=' +
      coincidencias.length
    );

    if (coincidencias.length !== 1) {
      throw new Error(
        'FECHA_LIMITE anterior a FECHA_CREACION no detectada exactamente una vez; detecciones=' +
        coincidencias.length
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(coincidencias[0])
    );

    console.log(
      'OK detection_verified=true'
    );

  } catch (error) {
    errorPendiente = error;

    console.error(
      'ERR package=' +
      packageName +
      ' message=' +
      error.message
    );

  } finally {
    try {
      if (hoja) {
        var ultimaFila =
          hoja.getLastRow();

        if (ultimaFila >= 2) {
          var ids =
            hoja
              .getRange(
                2,
                1,
                ultimaFila - 1,
                1
              )
              .getDisplayValues();

          for (
            var i = ids.length - 1;
            i >= 0;
            i--
          ) {
            if (
              String(ids[i][0]).trim() ===
              pruebaId
            ) {
              hoja.deleteRow(i + 2);
            }
          }

          SpreadsheetApp.flush();
        }

        var filasFinales =
          hoja.getLastRow();

        if (
          filasIniciales !== filasFinales
        ) {
          throw new Error(
            '12_DECISIONES no quedó restaurada: iniciales=' +
            filasIniciales +
            ' finales=' +
            filasFinales
          );
        }

        console.log(
          'OK sheet_restored=true filas_iniciales=' +
          filasIniciales +
          ' filas_finales=' +
          filasFinales
        );
      }

    } catch (cleanupError) {
      errorPendiente =
        cleanupError;

      console.error(
        'ERR cleanup_failed=true message=' +
        cleanupError.message
      );
    }
  }

  if (errorPendiente) {
    console.log(
      'NEXT detener_auditoria_y_reparar_fecha_limite_anterior_creacion'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw errorPendiente;
  }

  console.log(
    'NEXT cerrar_bloque_integridad_funcional_DECISION'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );
}

function auditarIntegridadIncidenciaCerradaSinFechaResolucion() {
  var packageName =
    'AUDITAR_INTEGRIDAD_INCIDENCIA_CERRADA_SIN_FECHA_RESOLUCION';

  var pruebaId =
    'INC-AUD-CIERRE-SIN-FECHA-001';

  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  var hoja =
    ss.getSheetByName('13_INCIDENCIAS');

  var filasIniciales = null;
  var errorPendiente = null;

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  try {
    if (!hoja) {
      throw new Error(
        'No existe la hoja 13_INCIDENCIAS'
      );
    }

    if (
      typeof ESTADOS_INCIDENCIA_CIERRE_ ===
        'undefined' ||
      !Array.isArray(
        ESTADOS_INCIDENCIA_CIERRE_
      ) ||
      ESTADOS_INCIDENCIA_CIERRE_.length === 0
    ) {
      throw new Error(
        'ESTADOS_INCIDENCIA_CIERRE_ no está disponible'
      );
    }

    filasIniciales =
      hoja.getLastRow();

    var cabeceras =
      hoja
        .getRange(
          1,
          1,
          1,
          hoja.getLastColumn()
        )
        .getDisplayValues()[0]
        .map(function (valor) {
          return String(valor).trim();
        });

    var camposRequeridos = [
      'ID',
      'TITULO',
      'TIPO',
      'PRIORIDAD',
      'ESTADO',
      'FECHA_RESOLUCION',
      'FECHA_CREACION',
      'CREADO_POR',
      'FECHA_MODIFICACION',
      'MODIFICADO_POR',
      'ACTIVO'
    ];

    var faltantes =
      camposRequeridos.filter(function (campo) {
        return cabeceras.indexOf(campo) === -1;
      });

    if (faltantes.length > 0) {
      throw new Error(
        'Faltan columnas requeridas: ' +
        faltantes.join(', ')
      );
    }

    var ahora = new Date();
    var estadoCierre =
      ESTADOS_INCIDENCIA_CIERRE_[0];

    var registroTemporal = {
      ID: pruebaId,
      TITULO:
        'Auditoria incidencia cerrada sin fecha de resolucion',
      TIPO: 'General',
      PRIORIDAD: 'Media',
      ESTADO: estadoCierre,
      FECHA_RESOLUCION: '',
      FECHA_CREACION: ahora,
      CREADO_POR: 'TEST_INTEGRITY',
      FECHA_MODIFICACION: ahora,
      MODIFICADO_POR: 'TEST_INTEGRITY',
      ACTIVO: 'SÍ'
    };

    var filaTemporal =
      cabeceras.map(function (cabecera) {
        return Object.prototype.hasOwnProperty.call(
          registroTemporal,
          cabecera
        )
          ? registroTemporal[cabecera]
          : '';
      });

    hoja.appendRow(filaTemporal);
    SpreadsheetApp.flush();

    console.log(
      'OK fixture_inserted=true incidencia_id=' +
      pruebaId +
      ' estado=' +
      estadoCierre
    );

    console.log(
      'OK fecha_resolucion_vacia=true'
    );

    var reporte =
      obtenerReporteIntegridad();

    var errores =
      reporte.funcional &&
      Array.isArray(reporte.funcional.errores)
        ? reporte.funcional.errores
        : [];

    var coincidencias =
      errores.filter(function (hallazgo) {
        return hallazgo.codigo === 'FUNC-INC-001' &&
          hallazgo.entidad === 'INCIDENCIA' &&
          hallazgo.registroId === pruebaId;
      });

    console.log(
      'OK coincidencias_funcionales=' +
      coincidencias.length
    );

    if (coincidencias.length !== 1) {
      throw new Error(
        'Se esperaba exactamente un hallazgo FUNC-INC-001 y se obtuvieron ' +
        coincidencias.length
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(coincidencias[0])
    );

    console.log(
      'OK detection_verified=true'
    );

  } catch (error) {
    errorPendiente = error;

    console.error(
      'ERR package=' +
      packageName +
      ' message=' +
      error.message
    );

  } finally {
    try {
      if (hoja) {
        var ultimaFila =
          hoja.getLastRow();

        if (ultimaFila >= 2) {
          var ids =
            hoja
              .getRange(
                2,
                1,
                ultimaFila - 1,
                1
              )
              .getDisplayValues();

          for (
            var i = ids.length - 1;
            i >= 0;
            i--
          ) {
            if (
              String(ids[i][0]).trim() ===
              pruebaId
            ) {
              hoja.deleteRow(i + 2);
            }
          }

          SpreadsheetApp.flush();
        }

        var filasFinales =
          hoja.getLastRow();

        if (
          filasIniciales !==
          filasFinales
        ) {
          throw new Error(
            '13_INCIDENCIAS no quedó restaurada: iniciales=' +
            filasIniciales +
            ' finales=' +
            filasFinales
          );
        }

        console.log(
          'OK sheet_restored=true filas_iniciales=' +
          filasIniciales +
          ' filas_finales=' +
          filasFinales
        );
      }

    } catch (cleanupError) {
      errorPendiente =
        cleanupError;

      console.error(
        'ERR cleanup_failed=true message=' +
        cleanupError.message
      );
    }
  }

  if (errorPendiente) {
    console.log(
      'NEXT detener_auditoria_y_diagnosticar_incidencia_cerrada_sin_fecha'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw errorPendiente;
  }

  console.log(
    'NEXT revisar_resultado_y_autorizar_incidencia_critica_sin_accion_correctora'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );
}

function auditarIntegridadIncidenciaCriticaSinAccionCorrectora() {
  var packageName =
    'AUDITAR_INTEGRIDAD_INCIDENCIA_CRITICA_SIN_ACCION_CORRECTORA';

  var pruebaId =
    'INC-AUD-CRITICA-SIN-ACCION-001';

  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  var hoja =
    ss.getSheetByName('13_INCIDENCIAS');

  var filasIniciales = null;
  var errorPendiente = null;

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  try {
    if (!hoja) {
      throw new Error(
        'No existe la hoja 13_INCIDENCIAS'
      );
    }

    if (
      typeof ESTADOS_INCIDENCIA_CIERRE_ ===
        'undefined' ||
      !Array.isArray(
        ESTADOS_INCIDENCIA_CIERRE_
      ) ||
      ESTADOS_INCIDENCIA_CIERRE_.length === 0
    ) {
      throw new Error(
        'ESTADOS_INCIDENCIA_CIERRE_ no está disponible'
      );
    }

    filasIniciales =
      hoja.getLastRow();

    var cabeceras =
      hoja
        .getRange(
          1,
          1,
          1,
          hoja.getLastColumn()
        )
        .getDisplayValues()[0]
        .map(function (valor) {
          return String(valor).trim();
        });

    var camposRequeridos = [
      'ID',
      'TITULO',
      'TIPO',
      'PRIORIDAD',
      'ESTADO',
      'ACCION_CORRECTORA',
      'FECHA_RESOLUCION',
      'FECHA_CREACION',
      'CREADO_POR',
      'FECHA_MODIFICACION',
      'MODIFICADO_POR',
      'ACTIVO'
    ];

    var faltantes =
      camposRequeridos.filter(function (campo) {
        return cabeceras.indexOf(campo) === -1;
      });

    if (faltantes.length > 0) {
      throw new Error(
        'Faltan columnas requeridas: ' +
        faltantes.join(', ')
      );
    }

    var ahora = new Date();
    var estadoCierre =
      ESTADOS_INCIDENCIA_CIERRE_[0];

    var registroTemporal = {
      ID: pruebaId,
      TITULO:
        'Auditoria incidencia critica sin accion correctora',
      TIPO: 'General',
      PRIORIDAD: 'Alta',
      ESTADO: estadoCierre,
      ACCION_CORRECTORA: '',
      FECHA_RESOLUCION: ahora,
      FECHA_CREACION: ahora,
      CREADO_POR: 'TEST_INTEGRITY',
      FECHA_MODIFICACION: ahora,
      MODIFICADO_POR: 'TEST_INTEGRITY',
      ACTIVO: 'SÍ'
    };

    var filaTemporal =
      cabeceras.map(function (cabecera) {
        return Object.prototype.hasOwnProperty.call(
          registroTemporal,
          cabecera
        )
          ? registroTemporal[cabecera]
          : '';
      });

    hoja.appendRow(filaTemporal);
    SpreadsheetApp.flush();

    console.log(
      'OK fixture_inserted=true incidencia_id=' +
      pruebaId +
      ' estado=' +
      estadoCierre +
      ' prioridad=Alta'
    );

    console.log(
      'OK fecha_resolucion_informada=true'
    );

    console.log(
      'OK accion_correctora_vacia=true'
    );

    var reporte =
      obtenerReporteIntegridad();

    var errores =
      reporte.funcional &&
      Array.isArray(reporte.funcional.errores)
        ? reporte.funcional.errores
        : [];

    var coincidencias =
      errores.filter(function (hallazgo) {
        return hallazgo.codigo === 'FUNC-INC-002' &&
          hallazgo.entidad === 'INCIDENCIA' &&
          hallazgo.registroId === pruebaId;
      });

    var coincidenciasFecha =
      errores.filter(function (hallazgo) {
        return hallazgo.codigo === 'FUNC-INC-001' &&
          hallazgo.entidad === 'INCIDENCIA' &&
          hallazgo.registroId === pruebaId;
      });

    console.log(
      'OK coincidencias_accion_correctora=' +
      coincidencias.length
    );

    console.log(
      'OK coincidencias_fecha_resolucion=' +
      coincidenciasFecha.length
    );

    if (coincidencias.length !== 1) {
      throw new Error(
        'Se esperaba exactamente un hallazgo FUNC-INC-002 y se obtuvieron ' +
        coincidencias.length
      );
    }

    if (coincidenciasFecha.length !== 0) {
      throw new Error(
        'La prueba generó un hallazgo FUNC-INC-001 no esperado'
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(coincidencias[0])
    );

    console.log(
      'OK detection_verified=true'
    );

  } catch (error) {
    errorPendiente = error;

    console.error(
      'ERR package=' +
      packageName +
      ' message=' +
      error.message
    );

  } finally {
    try {
      if (hoja) {
        var ultimaFila =
          hoja.getLastRow();

        if (ultimaFila >= 2) {
          var ids =
            hoja
              .getRange(
                2,
                1,
                ultimaFila - 1,
                1
              )
              .getDisplayValues();

          for (
            var i = ids.length - 1;
            i >= 0;
            i--
          ) {
            if (
              String(ids[i][0]).trim() ===
              pruebaId
            ) {
              hoja.deleteRow(i + 2);
            }
          }

          SpreadsheetApp.flush();
        }

        var filasFinales =
          hoja.getLastRow();

        if (
          filasIniciales !==
          filasFinales
        ) {
          throw new Error(
            '13_INCIDENCIAS no quedó restaurada: iniciales=' +
            filasIniciales +
            ' finales=' +
            filasFinales
          );
        }

        console.log(
          'OK sheet_restored=true filas_iniciales=' +
          filasIniciales +
          ' filas_finales=' +
          filasFinales
        );
      }

    } catch (cleanupError) {
      errorPendiente =
        cleanupError;

      console.error(
        'ERR cleanup_failed=true message=' +
        cleanupError.message
      );
    }
  }

  if (errorPendiente) {
    console.log(
      'NEXT detener_auditoria_y_diagnosticar_incidencia_critica_sin_accion'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw errorPendiente;
  }

  console.log(
    'NEXT revisar_resultado_y_definir_siguiente_caso_INCIDENCIA'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );
}

function agregarColumnaNivelIncidencia() {
  var packageName =
    'AGREGAR_COLUMNA_NIVEL_INCIDENCIA';

  var nombreHoja =
    '13_INCIDENCIAS';

  var nuevaColumna =
    'NIVEL_INCIDENCIA';

  var columnaAnterior =
    'ID';

  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  var hoja =
    ss.getSheetByName(nombreHoja);

  var lock =
    LockService.getDocumentLock();

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

    var ultimaColumna =
      hoja.getLastColumn();

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

    var indiceExistente =
      cabeceras.indexOf(nuevaColumna);

    if (indiceExistente !== -1) {
      console.log(
        'OK column_already_exists=true column=' +
        nuevaColumna +
        ' position=' +
        (indiceExistente + 1)
      );

      console.log(
        'NEXT reabrir_formulario_incidencia'
      );

      console.log(
        'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=OK'
      );

      return;
    }

    var indiceAnterior =
      cabeceras.indexOf(columnaAnterior);

    if (indiceAnterior === -1) {
      throw new Error(
        'No existe la columna de referencia ' +
        columnaAnterior
      );
    }

    var posicionInsercion =
      indiceAnterior + 2;

    hoja.insertColumnBefore(
      posicionInsercion
    );

    hoja
      .getRange(
        1,
        posicionInsercion
      )
      .setValue(nuevaColumna);

    SpreadsheetApp.flush();

    var cabeceraVerificada =
      String(
        hoja
          .getRange(
            1,
            posicionInsercion
          )
          .getDisplayValue()
      ).trim();

    if (
      cabeceraVerificada !==
      nuevaColumna
    ) {
      throw new Error(
        'No se pudo verificar la nueva cabecera.'
      );
    }

    console.log(
      'OK column_inserted=true column=' +
      nuevaColumna +
      ' position=' +
      posicionInsercion
    );

    console.log(
      'OK existing_rows_preserved=true data_rows=' +
      Math.max(
        hoja.getLastRow() - 1,
        0
      )
    );

    console.log(
      'OK verification_complete=true'
    );

  } catch (error) {
    console.error(
      'ERR package=' +
      packageName +
      ' message=' +
      error.message
    );

    console.log(
      'NEXT detener_y_diagnosticar_columna_nivel_incidencia'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw error;

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

  console.log(
    'NEXT reabrir_formulario_incidencia'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );
}

function probarMaterialProveedorInactivo() {
  const antes =
    obtenerRegistroPorId(
      'MATERIAL',
      'MAT-0003'
    );

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN ' +
    'package=PROBAR_MATERIAL_PROVEEDOR_INACTIVO'
  );

  console.log(
    'OK proveedor_antes=' +
    String(antes.PROVEEDOR_ID || '')
  );

  try {
    actualizarRegistroTransaccional(
      'MATERIAL',
      'MAT-0003',
      {
        PROVEEDOR_ID: 'PRV-0004'
      },
      {
        origen: 'TEST'
      }
    );

    console.error(
      'ERR proveedor_inactivo_aceptado=true'
    );

    throw new Error(
      'La actualización aceptó un proveedor no operativo.'
    );
  } catch (error) {
    const mensaje =
      String(error && error.message || error);

    if (
      mensaje.indexOf(
        'El proveedor indicado no existe o no está operativo.'
      ) === -1
    ) {
      console.error(
        'ERR mensaje_inesperado=' +
        mensaje
      );

      throw error;
    }

    console.log(
      'OK proveedor_inactivo_rechazado=true'
    );

    console.log(
      'OK mensaje=' +
      mensaje
    );
  }

  const despues =
    obtenerRegistroPorId(
      'MATERIAL',
      'MAT-0003'
    );

  if (
    String(despues.PROVEEDOR_ID || '') !==
    'PRV-0001'
  ) {
    console.error(
      'ERR proveedor_final=' +
      String(despues.PROVEEDOR_ID || '')
    );

    throw new Error(
      'MAT-0003 fue modificado durante la prueba.'
    );
  }

  console.log(
    'OK proveedor_final=PRV-0001'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END ' +
    'package=PROBAR_MATERIAL_PROVEEDOR_INACTIVO ' +
    'result=OK'
  );

  return true;
}

function probarIntegridadProveedorCodigoDuplicado() {
  var packageName =
    'PROBAR_INTEGRIDAD_PROVEEDOR_CODIGO_DUPLICADO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('15_PROVEEDORES');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 15_PROVEEDORES'
    );
  }

  var valores =
    hoja.getDataRange().getDisplayValues();

  var cabeceras = valores[0];
  var idxId = cabeceras.indexOf('ID');
  var idxCodigo = cabeceras.indexOf('CODIGO');

  if (
    idxId === -1 ||
    idxCodigo === -1
  ) {
    throw new Error(
      'Faltan las columnas ID o CODIGO.'
    );
  }

  var filaPrv0002 = -1;

  valores.slice(1)
    .forEach(function (fila, indice) {
      if (
        String(fila[idxId]).trim() ===
        'PRV-0002'
      ) {
        filaPrv0002 = indice + 2;
      }
    });

  if (filaPrv0002 === -1) {
    throw new Error(
      'No existe PRV-0002.'
    );
  }

  var celdaCodigo =
    hoja.getRange(
      filaPrv0002,
      idxCodigo + 1
    );

  var codigoOriginal =
    String(
      celdaCodigo.getDisplayValue() || ''
    ).trim();

  console.log(
    'OK codigo_original=' +
    codigoOriginal
  );

  try {
    /*
     * Simular una inconsistencia histórica o una
     * edición directa que evita el repositorio.
     */
    celdaCodigo.setValue(
      'AUD-PROV-001'
    );

    SpreadsheetApp.flush();

    console.log(
      'OK duplicidad_temporal_creada=true'
    );

    var reporte =
      obtenerReporteIntegridad();

    var erroresFuncionales =
      reporte.funcional &&
      reporte.funcional.errores
        ? reporte.funcional.errores
        : [];

    var hallazgos =
      erroresFuncionales.filter(
        function (hallazgo) {
          return (
            hallazgo.codigo ===
              'FUNC-PRV-001' &&
            hallazgo.entidad ===
              'PROVEEDOR' &&
            (
              hallazgo.registroId ===
                'PRV-0001' ||
              hallazgo.registroId ===
                'PRV-0002'
            )
          );
        }
      );

    console.log(
      'OK hallazgos_func_prv_001=' +
      hallazgos.length
    );

    if (hallazgos.length !== 2) {
      console.error(
        'ERR hallazgos_esperados=2 ' +
        'hallazgos_reales=' +
        hallazgos.length
      );

      throw new Error(
        'FUNC-PRV-001 no detectó correctamente los dos proveedores duplicados.'
      );
    }

    hallazgos.forEach(function (hallazgo) {
      console.log(
        'OK hallazgo=' +
        JSON.stringify(hallazgo)
      );
    });
  } finally {
    /*
     * Restauración obligatoria incluso si falla
     * la comprobación.
     */
    celdaCodigo.setValue(
      codigoOriginal
    );

    SpreadsheetApp.flush();

    console.log(
      'OK codigo_restaurado=' +
      codigoOriginal
    );
  }

  var reporteFinal =
    obtenerReporteIntegridad();

  var erroresFinales =
    reporteFinal.funcional &&
    reporteFinal.funcional.errores
      ? reporteFinal.funcional.errores
      : [];

  var persisteDuplicidad =
    erroresFinales.some(function (hallazgo) {
      return (
        hallazgo.codigo ===
        'FUNC-PRV-001'
      );
    });

  if (persisteDuplicidad) {
    console.error(
      'ERR duplicidad_persistente=true'
    );

    throw new Error(
      'El hallazgo FUNC-PRV-001 persiste después de restaurar los datos.'
    );
  }

  console.log(
    'OK integridad_final_limpia=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}

function probarIntegridadProveedorNifDuplicado() {
  var packageName =
    'PROBAR_INTEGRIDAD_PROVEEDOR_NIF_DUPLICADO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('15_PROVEEDORES');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 15_PROVEEDORES'
    );
  }

  var valores =
    hoja.getDataRange().getDisplayValues();

  var cabeceras = valores[0];
  var idxId = cabeceras.indexOf('ID');
  var idxNifCif = cabeceras.indexOf('NIF_CIF');

  if (
    idxId === -1 ||
    idxNifCif === -1
  ) {
    throw new Error(
      'Faltan las columnas ID o NIF_CIF.'
    );
  }

  var filaPrv0002 = -1;

  valores.slice(1)
    .forEach(function (fila, indice) {
      if (
        String(fila[idxId] || '').trim() ===
        'PRV-0002'
      ) {
        filaPrv0002 = indice + 2;
      }
    });

  if (filaPrv0002 === -1) {
    throw new Error(
      'No existe PRV-0002.'
    );
  }

  var celdaNifCif =
    hoja.getRange(
      filaPrv0002,
      idxNifCif + 1
    );

  var nifOriginal =
    String(
      celdaNifCif.getDisplayValue() || ''
    ).trim();

  console.log(
    'OK nif_original=' +
    nifOriginal
  );

  try {
    /*
     * Simular inconsistencia histórica evitando
     * deliberadamente el repositorio.
     */
    celdaNifCif.setValue(
      'B12345678'
    );

    SpreadsheetApp.flush();

    console.log(
      'OK duplicidad_temporal_creada=true'
    );

    var reporte =
      obtenerReporteIntegridad();

    var erroresFuncionales =
      reporte.funcional &&
      reporte.funcional.errores
        ? reporte.funcional.errores
        : [];

    var hallazgos =
      erroresFuncionales.filter(
        function (hallazgo) {
          return (
            hallazgo.codigo ===
              'FUNC-PRV-002' &&
            hallazgo.entidad ===
              'PROVEEDOR' &&
            (
              hallazgo.registroId ===
                'PRV-0001' ||
              hallazgo.registroId ===
                'PRV-0002'
            )
          );
        }
      );

    console.log(
      'OK hallazgos_func_prv_002=' +
      hallazgos.length
    );

    if (hallazgos.length !== 2) {
      console.error(
        'ERR hallazgos_esperados=2 ' +
        'hallazgos_reales=' +
        hallazgos.length
      );

      throw new Error(
        'FUNC-PRV-002 no detectó correctamente los dos proveedores con NIF_CIF duplicado.'
      );
    }

    hallazgos.forEach(function (hallazgo) {
      console.log(
        'OK hallazgo=' +
        JSON.stringify(hallazgo)
      );
    });
  } finally {
    celdaNifCif.setValue(
      nifOriginal
    );

    SpreadsheetApp.flush();

    console.log(
      'OK nif_restaurado=' +
      nifOriginal
    );
  }

  var reporteFinal =
    obtenerReporteIntegridad();

  var erroresFinales =
    reporteFinal.funcional &&
    reporteFinal.funcional.errores
      ? reporteFinal.funcional.errores
      : [];

  var persisteDuplicidad =
    erroresFinales.some(function (hallazgo) {
      return (
        hallazgo.codigo ===
        'FUNC-PRV-002'
      );
    });

  if (persisteDuplicidad) {
    console.error(
      'ERR duplicidad_persistente=true'
    );

    throw new Error(
      'FUNC-PRV-002 persiste después de restaurar los datos.'
    );
  }

  console.log(
    'OK integridad_final_limpia=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}

function probarIntegridadProveedorEmailInvalido() {
  var packageName =
    'PROBAR_INTEGRIDAD_PROVEEDOR_EMAIL_INVALIDO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('15_PROVEEDORES');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 15_PROVEEDORES'
    );
  }

  var valores =
    hoja.getDataRange().getDisplayValues();

  var cabeceras = valores[0];
  var idxId = cabeceras.indexOf('ID');
  var idxEmail = cabeceras.indexOf('EMAIL');

  if (
    idxId === -1 ||
    idxEmail === -1
  ) {
    throw new Error(
      'Faltan las columnas ID o EMAIL.'
    );
  }

  var filaPrv0003 = -1;

  valores.slice(1)
    .forEach(function (fila, indice) {
      if (
        String(fila[idxId] || '').trim() ===
        'PRV-0003'
      ) {
        filaPrv0003 = indice + 2;
      }
    });

  if (filaPrv0003 === -1) {
    throw new Error(
      'No existe PRV-0003.'
    );
  }

  var celdaEmail =
    hoja.getRange(
      filaPrv0003,
      idxEmail + 1
    );

  var emailOriginal =
    String(
      celdaEmail.getDisplayValue() || ''
    ).trim();

  console.log(
    'OK email_original=' +
    emailOriginal
  );

  try {
    celdaEmail.setValue(
      'correo-invalido'
    );

    SpreadsheetApp.flush();

    console.log(
      'OK email_invalido_temporal=true'
    );

    var reporte =
      obtenerReporteIntegridad();

    var erroresFuncionales =
      reporte.funcional &&
      reporte.funcional.errores
        ? reporte.funcional.errores
        : [];

    var hallazgos =
      erroresFuncionales.filter(
        function (hallazgo) {
          return (
            hallazgo.codigo ===
              'FUNC-PRV-003' &&
            hallazgo.entidad ===
              'PROVEEDOR' &&
            hallazgo.registroId ===
              'PRV-0003'
          );
        }
      );

    console.log(
      'OK hallazgos_func_prv_003=' +
      hallazgos.length
    );

    if (hallazgos.length !== 1) {
      throw new Error(
        'FUNC-PRV-003 no detectó correctamente el EMAIL inválido.'
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(hallazgos[0])
    );
  } finally {
    celdaEmail.setValue(
      emailOriginal
    );

    SpreadsheetApp.flush();

    console.log(
      'OK email_restaurado=' +
      emailOriginal
    );
  }

  var reporteFinal =
    obtenerReporteIntegridad();

  var erroresFinales =
    reporteFinal.funcional &&
    reporteFinal.funcional.errores
      ? reporteFinal.funcional.errores
      : [];

  var persisteError =
    erroresFinales.some(function (hallazgo) {
      return (
        hallazgo.codigo ===
        'FUNC-PRV-003'
      );
    });

  if (persisteError) {
    throw new Error(
      'FUNC-PRV-003 persiste después de restaurar el dato.'
    );
  }

  console.log(
    'OK integridad_final_limpia=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}

function probarIntegridadProveedorPlazoEntregaInvalido() {
  var packageName =
    'PROBAR_INTEGRIDAD_PROVEEDOR_PLAZO_ENTREGA_INVALIDO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('15_PROVEEDORES');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 15_PROVEEDORES.'
    );
  }

  var valores =
    hoja.getDataRange().getDisplayValues();

  var cabeceras = valores[0];
  var idxId =
    cabeceras.indexOf('ID');
  var idxPlazo =
    cabeceras.indexOf('PLAZO_ENTREGA_DIAS');

  if (
    idxId === -1 ||
    idxPlazo === -1
  ) {
    throw new Error(
      'Faltan las columnas ID o PLAZO_ENTREGA_DIAS.'
    );
  }

  var filaProveedor = -1;

  valores.slice(1)
    .forEach(function (fila, indice) {
      if (
        String(fila[idxId] || '').trim() ===
        'PRV-0004'
      ) {
        filaProveedor =
          indice + 2;
      }
    });

  if (filaProveedor === -1) {
    throw new Error(
      'No existe PRV-0004.'
    );
  }

  var celdaPlazo =
    hoja.getRange(
      filaProveedor,
      idxPlazo + 1
    );

  var plazoOriginal =
    celdaPlazo.getValue();

  console.log(
    'OK plazo_original=' +
    String(plazoOriginal)
  );

  try {
    /*
     * Simular inconsistencia histórica evitando
     * deliberadamente el repositorio.
     */
    celdaPlazo.setValue(-1);

    SpreadsheetApp.flush();

    console.log(
      'OK plazo_invalido_temporal=-1'
    );

    var reporte =
      obtenerReporteIntegridad();

    var erroresFuncionales =
      reporte.funcional &&
      reporte.funcional.errores
        ? reporte.funcional.errores
        : [];

    var hallazgos =
      erroresFuncionales.filter(
        function (hallazgo) {
          return (
            hallazgo.codigo ===
              'FUNC-PRV-004' &&
            hallazgo.entidad ===
              'PROVEEDOR' &&
            hallazgo.registroId ===
              'PRV-0004'
          );
        }
      );

    console.log(
      'OK hallazgos_func_prv_004=' +
      hallazgos.length
    );

    if (hallazgos.length !== 1) {
      throw new Error(
        'FUNC-PRV-004 no detectó correctamente el plazo de entrega inválido.'
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(hallazgos[0])
    );
  } finally {
    celdaPlazo.setValue(
      plazoOriginal
    );

    SpreadsheetApp.flush();

    console.log(
      'OK plazo_restaurado=' +
      String(plazoOriginal)
    );
  }

  var reporteFinal =
    obtenerReporteIntegridad();

  var erroresFinales =
    reporteFinal.funcional &&
    reporteFinal.funcional.errores
      ? reporteFinal.funcional.errores
      : [];

  var persisteError =
    erroresFinales.some(function (hallazgo) {
      return (
        hallazgo.codigo ===
        'FUNC-PRV-004'
      );
    });

  if (persisteError) {
    throw new Error(
      'FUNC-PRV-004 persiste después de restaurar el dato.'
    );
  }

  console.log(
    'OK integridad_final_limpia=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}

function probarIntegridadProveedorEstadoInvalido() {
  var packageName =
    'PROBAR_INTEGRIDAD_PROVEEDOR_ESTADO_INVALIDO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('15_PROVEEDORES');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 15_PROVEEDORES.'
    );
  }

  var valores =
    hoja.getDataRange().getDisplayValues();

  var cabeceras = valores[0];

  var idxId =
    cabeceras.indexOf('ID');

  var idxEstado =
    cabeceras.indexOf('ESTADO');

  if (
    idxId === -1 ||
    idxEstado === -1
  ) {
    throw new Error(
      'Faltan las columnas ID o ESTADO.'
    );
  }

  var filaProveedor = -1;

  valores.slice(1)
    .forEach(function (fila, indice) {
      if (
        String(fila[idxId] || '').trim() ===
        'PRV-0004'
      ) {
        filaProveedor =
          indice + 2;
      }
    });

  if (filaProveedor === -1) {
    throw new Error(
      'No existe PRV-0004.'
    );
  }

  var celdaEstado =
    hoja.getRange(
      filaProveedor,
      idxEstado + 1
    );

  var estadoOriginal =
    celdaEstado.getValue();

  var validacionOriginal =
    celdaEstado.getDataValidation();

  console.log(
    'OK estado_original=' +
    String(estadoOriginal)
  );

  console.log(
    'OK validacion_original_existe=' +
    Boolean(validacionOriginal)
  );

  try {
    /*
     * Se elimina temporalmente la validación
     * para simular un dato histórico inconsistente.
     */
    celdaEstado.clearDataValidations();

    SpreadsheetApp.flush();

    console.log(
      'OK validacion_temporal_retirada=true'
    );

    celdaEstado.setValue(
      'ESTADO_NO_VALIDO'
    );

    SpreadsheetApp.flush();

    console.log(
      'OK estado_invalido_temporal=true'
    );

    var reporte =
      obtenerReporteIntegridad();

    var erroresFuncionales =
      reporte.funcional &&
      reporte.funcional.errores
        ? reporte.funcional.errores
        : [];

    var hallazgos =
      erroresFuncionales.filter(
        function (hallazgo) {
          return (
            hallazgo.codigo ===
              'FUNC-PRV-005' &&
            hallazgo.entidad ===
              'PROVEEDOR' &&
            hallazgo.registroId ===
              'PRV-0004'
          );
        }
      );

    console.log(
      'OK hallazgos_func_prv_005=' +
      hallazgos.length
    );

    if (hallazgos.length !== 1) {
      console.error(
        'ERR hallazgos_esperados=1 ' +
        'hallazgos_reales=' +
        hallazgos.length
      );

      throw new Error(
        'FUNC-PRV-005 no detectó correctamente el ESTADO inválido.'
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(hallazgos[0])
    );
  } finally {
    celdaEstado.setValue(
      estadoOriginal
    );

    if (validacionOriginal) {
      celdaEstado.setDataValidation(
        validacionOriginal
      );
    } else {
      celdaEstado.clearDataValidations();
    }

    SpreadsheetApp.flush();

    console.log(
      'OK estado_restaurado=' +
      String(estadoOriginal)
    );

    console.log(
      'OK validacion_restaurada=' +
      Boolean(validacionOriginal)
    );
  }

  var reporteFinal =
    obtenerReporteIntegridad();

  var erroresFinales =
    reporteFinal.funcional &&
    reporteFinal.funcional.errores
      ? reporteFinal.funcional.errores
      : [];

  var persisteError =
    erroresFinales.some(function (hallazgo) {
      return (
        hallazgo.codigo ===
        'FUNC-PRV-005'
      );
    });

  if (persisteError) {
    console.error(
      'ERR integridad_final_limpia=false'
    );

    throw new Error(
      'FUNC-PRV-005 persiste después de restaurar el dato.'
    );
  }

  console.log(
    'OK integridad_final_limpia=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}

function probarIntegridadMaterialValorNegativo() {
  var packageName =
    'PROBAR_INTEGRIDAD_MATERIAL_VALOR_NEGATIVO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('08_MATERIALES');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 08_MATERIALES.'
    );
  }

  var valores =
    hoja.getDataRange().getDisplayValues();

  var cabeceras = valores[0];

  var idxId =
    cabeceras.indexOf('ID');

  var idxStockMinimo =
    cabeceras.indexOf('STOCK_MINIMO');

  if (
    idxId === -1 ||
    idxStockMinimo === -1
  ) {
    throw new Error(
      'Faltan las columnas ID o STOCK_MINIMO.'
    );
  }

  var filaMaterial = -1;

  valores.slice(1)
    .forEach(function (fila, indice) {
      if (
        String(fila[idxId] || '').trim() ===
        'MAT-0003'
      ) {
        filaMaterial =
          indice + 2;
      }
    });

  if (filaMaterial === -1) {
    throw new Error(
      'No existe MAT-0003.'
    );
  }

  var celdaStockMinimo =
    hoja.getRange(
      filaMaterial,
      idxStockMinimo + 1
    );

  var valorOriginal =
    celdaStockMinimo.getValue();

  var validacionOriginal =
    celdaStockMinimo.getDataValidation();

  console.log(
    'OK stock_minimo_original=' +
    String(valorOriginal)
  );

  console.log(
    'OK validacion_original_existe=' +
    Boolean(validacionOriginal)
  );

  try {
    /*
     * Simular una inconsistencia histórica evitando
     * temporalmente la validación preventiva.
     */
    celdaStockMinimo.clearDataValidations();

    SpreadsheetApp.flush();

    console.log(
      'OK validacion_temporal_retirada=true'
    );

    celdaStockMinimo.setValue(-1);

    SpreadsheetApp.flush();

    console.log(
      'OK stock_minimo_negativo_temporal=-1'
    );

    var reporte =
      obtenerReporteIntegridad();

    var errores =
      reporte.funcional &&
      reporte.funcional.errores
        ? reporte.funcional.errores
        : [];

    var hallazgos =
      errores.filter(function (hallazgo) {
        return (
          hallazgo.codigo ===
            'FUNC-MAT-003' &&
          hallazgo.entidad ===
            'MATERIAL' &&
          hallazgo.registroId ===
            'MAT-0003' &&
          String(
            hallazgo.descripcion || ''
          ).indexOf('STOCK_MINIMO') !== -1
        );
      });

    console.log(
      'OK hallazgos_func_mat_003=' +
      hallazgos.length
    );

    if (hallazgos.length !== 1) {
      throw new Error(
        'FUNC-MAT-003 no detectó correctamente STOCK_MINIMO negativo.'
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(hallazgos[0])
    );
  } finally {
    celdaStockMinimo.setValue(
      valorOriginal
    );

    if (validacionOriginal) {
      celdaStockMinimo.setDataValidation(
        validacionOriginal
      );
    } else {
      celdaStockMinimo.clearDataValidations();
    }

    SpreadsheetApp.flush();

    console.log(
      'OK stock_minimo_restaurado=' +
      String(valorOriginal)
    );

    console.log(
      'OK validacion_restaurada=' +
      Boolean(validacionOriginal)
    );
  }

  var reporteFinal =
    obtenerReporteIntegridad();

  var erroresFinales =
    reporteFinal.funcional &&
    reporteFinal.funcional.errores
      ? reporteFinal.funcional.errores
      : [];

  var persisteError =
    erroresFinales.some(function (hallazgo) {
      return (
        hallazgo.codigo ===
          'FUNC-MAT-003' &&
        hallazgo.registroId ===
          'MAT-0003'
      );
    });

  if (persisteError) {
    throw new Error(
      'FUNC-MAT-003 persiste después de restaurar el dato.'
    );
  }

  console.log(
    'OK integridad_final_limpia=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}

function probarIntegridadMaterialValorNoNumerico() {
  var packageName =
    'PROBAR_INTEGRIDAD_MATERIAL_VALOR_NO_NUMERICO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('08_MATERIALES');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 08_MATERIALES.'
    );
  }

  var valores =
    hoja.getDataRange().getDisplayValues();

  var cabeceras = valores[0];

  var idxId =
    cabeceras.indexOf('ID');

  var idxStockActual =
    cabeceras.indexOf('STOCK_ACTUAL');

  if (
    idxId === -1 ||
    idxStockActual === -1
  ) {
    throw new Error(
      'Faltan las columnas ID o STOCK_ACTUAL.'
    );
  }

  var filaMaterial = -1;

  valores.slice(1)
    .forEach(function (fila, indice) {
      if (
        String(fila[idxId] || '').trim() ===
        'MAT-0003'
      ) {
        filaMaterial =
          indice + 2;
      }
    });

  if (filaMaterial === -1) {
    throw new Error(
      'No existe MAT-0003.'
    );
  }

  var celdaStockActual =
    hoja.getRange(
      filaMaterial,
      idxStockActual + 1
    );

  var valorOriginal =
    celdaStockActual.getValue();

  var validacionOriginal =
    celdaStockActual.getDataValidation();

  console.log(
    'OK stock_actual_original=' +
    String(valorOriginal)
  );

  console.log(
    'OK validacion_original_existe=' +
    Boolean(validacionOriginal)
  );

  try {
    /*
     * Se retira temporalmente la validación para
     * simular un dato histórico inconsistente.
     */
    celdaStockActual.clearDataValidations();

    SpreadsheetApp.flush();

    console.log(
      'OK validacion_temporal_retirada=true'
    );

    celdaStockActual.setValue(
      'NO_NUMERICO'
    );

    SpreadsheetApp.flush();

    console.log(
      'OK stock_actual_no_numerico_temporal=true'
    );

    var reporte =
      obtenerReporteIntegridad();

    var errores =
      reporte.funcional &&
      reporte.funcional.errores
        ? reporte.funcional.errores
        : [];

    var hallazgos =
      errores.filter(function (hallazgo) {
        return (
          hallazgo.codigo ===
            'FUNC-MAT-004' &&
          hallazgo.entidad ===
            'MATERIAL' &&
          hallazgo.registroId ===
            'MAT-0003' &&
          String(
            hallazgo.descripcion || ''
          ).indexOf(
            'STOCK_ACTUAL'
          ) !== -1
        );
      });

    console.log(
      'OK hallazgos_func_mat_004=' +
      hallazgos.length
    );

    if (hallazgos.length !== 1) {
      console.error(
        'ERR hallazgos_esperados=1 ' +
        'hallazgos_reales=' +
        hallazgos.length
      );

      throw new Error(
        'FUNC-MAT-004 no detectó correctamente STOCK_ACTUAL no numérico.'
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(hallazgos[0])
    );
  } finally {
    celdaStockActual.setValue(
      valorOriginal
    );

    if (validacionOriginal) {
      celdaStockActual.setDataValidation(
        validacionOriginal
      );
    } else {
      celdaStockActual.clearDataValidations();
    }

    SpreadsheetApp.flush();

    console.log(
      'OK stock_actual_restaurado=' +
      String(valorOriginal)
    );

    console.log(
      'OK validacion_restaurada=' +
      Boolean(validacionOriginal)
    );
  }

  var reporteFinal =
    obtenerReporteIntegridad();

  var erroresFinales =
    reporteFinal.funcional &&
    reporteFinal.funcional.errores
      ? reporteFinal.funcional.errores
      : [];

  var persisteError =
    erroresFinales.some(function (hallazgo) {
      return (
        hallazgo.codigo ===
          'FUNC-MAT-004' &&
        hallazgo.entidad ===
          'MATERIAL' &&
        hallazgo.registroId ===
          'MAT-0003'
      );
    });

  if (persisteError) {
    console.error(
      'ERR integridad_final_limpia=false'
    );

    throw new Error(
      'FUNC-MAT-004 persiste después de restaurar el dato.'
    );
  }

  console.log(
    'OK integridad_final_limpia=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}

function probarIntegridadMaterialEstadoInvalido() {
  var packageName =
    'PROBAR_INTEGRIDAD_MATERIAL_ESTADO_INVALIDO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('08_MATERIALES');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 08_MATERIALES.'
    );
  }

  var valores =
    hoja.getDataRange().getDisplayValues();

  var cabeceras = valores[0];

  var idxId =
    cabeceras.indexOf('ID');

  var idxEstado =
    cabeceras.indexOf('ESTADO');

  if (
    idxId === -1 ||
    idxEstado === -1
  ) {
    throw new Error(
      'Faltan las columnas ID o ESTADO.'
    );
  }

  var filaMaterial = -1;

  valores.slice(1)
    .forEach(function (fila, indice) {
      if (
        String(fila[idxId] || '').trim() ===
        'MAT-0003'
      ) {
        filaMaterial =
          indice + 2;
      }
    });

  if (filaMaterial === -1) {
    throw new Error(
      'No existe MAT-0003.'
    );
  }

  var celdaEstado =
    hoja.getRange(
      filaMaterial,
      idxEstado + 1
    );

  var estadoOriginal =
    celdaEstado.getValue();

  var validacionOriginal =
    celdaEstado.getDataValidation();

  console.log(
    'OK estado_original=' +
    String(estadoOriginal)
  );

  console.log(
    'OK validacion_original_existe=' +
    Boolean(validacionOriginal)
  );

  try {
    /*
     * Se retira temporalmente la validación para
     * simular un dato histórico inconsistente.
     */
    celdaEstado.clearDataValidations();

    SpreadsheetApp.flush();

    console.log(
      'OK validacion_temporal_retirada=true'
    );

    celdaEstado.setValue(
      'ESTADO_NO_VALIDO'
    );

    SpreadsheetApp.flush();

    console.log(
      'OK estado_invalido_temporal=true'
    );

    var reporte =
      obtenerReporteIntegridad();

    var errores =
      reporte.funcional &&
      reporte.funcional.errores
        ? reporte.funcional.errores
        : [];

    var hallazgos =
      errores.filter(function (hallazgo) {
        return (
          hallazgo.codigo ===
            'FUNC-MAT-005' &&
          hallazgo.entidad ===
            'MATERIAL' &&
          hallazgo.registroId ===
            'MAT-0003'
        );
      });

    console.log(
      'OK hallazgos_func_mat_005=' +
      hallazgos.length
    );

    if (hallazgos.length !== 1) {
      console.error(
        'ERR hallazgos_esperados=1 ' +
        'hallazgos_reales=' +
        hallazgos.length
      );

      throw new Error(
        'FUNC-MAT-005 no detectó correctamente el ESTADO inválido.'
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(hallazgos[0])
    );
  } finally {
    celdaEstado.setValue(
      estadoOriginal
    );

    if (validacionOriginal) {
      celdaEstado.setDataValidation(
        validacionOriginal
      );
    } else {
      celdaEstado.clearDataValidations();
    }

    SpreadsheetApp.flush();

    console.log(
      'OK estado_restaurado=' +
      String(estadoOriginal)
    );

    console.log(
      'OK validacion_restaurada=' +
      Boolean(validacionOriginal)
    );
  }

  var reporteFinal =
    obtenerReporteIntegridad();

  var erroresFinales =
    reporteFinal.funcional &&
    reporteFinal.funcional.errores
      ? reporteFinal.funcional.errores
      : [];

  var persisteError =
    erroresFinales.some(function (hallazgo) {
      return (
        hallazgo.codigo ===
          'FUNC-MAT-005' &&
        hallazgo.entidad ===
          'MATERIAL' &&
        hallazgo.registroId ===
          'MAT-0003'
      );
    });

  if (persisteError) {
    console.error(
      'ERR integridad_final_limpia=false'
    );

    throw new Error(
      'FUNC-MAT-005 persiste después de restaurar el dato.'
    );
  }

  console.log(
    'OK integridad_final_limpia=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}

function probarIntegridadMaterialUnidadInvalida() {
  var packageName =
    'PROBAR_INTEGRIDAD_MATERIAL_UNIDAD_INVALIDA';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('08_MATERIALES');

  if (!hoja) {
    throw new Error(
      'No existe la hoja 08_MATERIALES.'
    );
  }

  var valores =
    hoja.getDataRange().getDisplayValues();

  var cabeceras =
    valores[0];

  var idxId =
    cabeceras.indexOf('ID');

  var idxUnidad =
    cabeceras.indexOf('UNIDAD');

  if (
    idxId === -1 ||
    idxUnidad === -1
  ) {
    throw new Error(
      'Faltan las columnas ID o UNIDAD.'
    );
  }

  var filaMaterial = -1;

  valores.slice(1)
    .forEach(function (fila, indice) {
      if (
        String(fila[idxId] || '').trim() ===
        'MAT-0003'
      ) {
        filaMaterial =
          indice + 2;
      }
    });

  if (filaMaterial === -1) {
    throw new Error(
      'No existe MAT-0003.'
    );
  }

  var celdaUnidad =
    hoja.getRange(
      filaMaterial,
      idxUnidad + 1
    );

  var unidadOriginal =
    celdaUnidad.getValue();

  var validacionOriginal =
    celdaUnidad.getDataValidation();

  console.log(
    'OK unidad_original=' +
    String(unidadOriginal)
  );

  console.log(
    'OK validacion_original_existe=' +
    Boolean(validacionOriginal)
  );

  try {
    /*
     * Se retira temporalmente la validación para
     * simular una inconsistencia histórica.
     */
    celdaUnidad.clearDataValidations();

    SpreadsheetApp.flush();

    console.log(
      'OK validacion_temporal_retirada=true'
    );

    celdaUnidad.setValue(
      'UNIDAD_NO_VALIDA'
    );

    SpreadsheetApp.flush();

    console.log(
      'OK unidad_invalida_temporal=true'
    );

    var reporte =
      obtenerReporteIntegridad();

    var errores =
      reporte.funcional &&
      reporte.funcional.errores
        ? reporte.funcional.errores
        : [];

    var hallazgos =
      errores.filter(function (hallazgo) {
        return (
          hallazgo.codigo ===
            'FUNC-MAT-006' &&
          hallazgo.entidad ===
            'MATERIAL' &&
          hallazgo.registroId ===
            'MAT-0003'
        );
      });

    console.log(
      'OK hallazgos_func_mat_006=' +
      hallazgos.length
    );

    if (hallazgos.length !== 1) {
      console.error(
        'ERR hallazgos_esperados=1 ' +
        'hallazgos_reales=' +
        hallazgos.length
      );

      throw new Error(
        'FUNC-MAT-006 no detectó correctamente la UNIDAD inválida.'
      );
    }

    console.log(
      'OK hallazgo=' +
      JSON.stringify(hallazgos[0])
    );
  } finally {
    celdaUnidad.setValue(
      unidadOriginal
    );

    if (validacionOriginal) {
      celdaUnidad.setDataValidation(
        validacionOriginal
      );
    } else {
      celdaUnidad.clearDataValidations();
    }

    SpreadsheetApp.flush();

    console.log(
      'OK unidad_restaurada=' +
      String(unidadOriginal)
    );

    console.log(
      'OK validacion_restaurada=' +
      Boolean(validacionOriginal)
    );
  }

  var reporteFinal =
    obtenerReporteIntegridad();

  var erroresFinales =
    reporteFinal.funcional &&
    reporteFinal.funcional.errores
      ? reporteFinal.funcional.errores
      : [];

  var persisteError =
    erroresFinales.some(function (hallazgo) {
      return (
        hallazgo.codigo ===
          'FUNC-MAT-006' &&
        hallazgo.entidad ===
          'MATERIAL' &&
        hallazgo.registroId ===
          'MAT-0003'
      );
    });

  if (persisteError) {
    console.error(
      'ERR integridad_final_limpia=false'
    );

    throw new Error(
      'FUNC-MAT-006 persiste después de restaurar el dato.'
    );
  }

  console.log(
    'OK integridad_final_limpia=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}

function probarIntegridadMaterialCategoriaInvalida() {
  var packageName =
    'PROBAR_INTEGRIDAD_MATERIAL_CATEGORIA_INVALIDA';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('08_MATERIALES');

  if (!hoja) {
    console.error(
      'ERR hoja_no_existe=08_MATERIALES'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw new Error(
      'No existe la hoja 08_MATERIALES.'
    );
  }

  var valores =
    hoja.getDataRange().getDisplayValues();

  var cabeceras =
    valores[0];

  var idxId =
    cabeceras.indexOf('ID');

  var idxCategoria =
    cabeceras.indexOf('CATEGORIA');

  if (
    idxId === -1 ||
    idxCategoria === -1
  ) {
    console.error(
      'ERR columnas_requeridas=false'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw new Error(
      'Faltan las columnas ID o CATEGORIA.'
    );
  }

  var filaMaterial = -1;

  valores.slice(1)
    .forEach(function (fila, indice) {
      if (
        String(fila[idxId] || '').trim() ===
        'MAT-0003'
      ) {
        filaMaterial =
          indice + 2;
      }
    });

  if (filaMaterial === -1) {
    console.error(
      'ERR material_no_existe=MAT-0003'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw new Error(
      'No existe MAT-0003.'
    );
  }

  var celdaCategoria =
    hoja.getRange(
      filaMaterial,
      idxCategoria + 1
    );

  var categoriaOriginal =
    celdaCategoria.getValue();

  var validacionOriginal =
    celdaCategoria.getDataValidation();

  console.log(
    'OK categoria_original=' +
    String(categoriaOriginal)
  );

  console.log(
    'OK validacion_original_existe=' +
    Boolean(validacionOriginal)
  );

  try {
    celdaCategoria.clearDataValidations();

    SpreadsheetApp.flush();

    console.log(
      'OK validacion_temporal_retirada=true'
    );

    /*
     * Caso 1: categoría vacía.
     */
    celdaCategoria.setValue('');

    SpreadsheetApp.flush();

    var reporteVacio =
      obtenerReporteIntegridad();

    var erroresVacio =
      reporteVacio.funcional &&
      reporteVacio.funcional.errores
        ? reporteVacio.funcional.errores
        : [];

    var hallazgosVacio =
      erroresVacio.filter(function (hallazgo) {
        return (
          hallazgo.codigo ===
            'FUNC-MAT-010' &&
          hallazgo.entidad ===
            'MATERIAL' &&
          hallazgo.registroId ===
            'MAT-0003'
        );
      });

    console.log(
      'OK hallazgos_categoria_vacia=' +
      hallazgosVacio.length
    );

    if (hallazgosVacio.length !== 1) {
      console.error(
        'ERR caso=categoria_vacia ' +
        'hallazgos_esperados=1 ' +
        'hallazgos_reales=' +
        hallazgosVacio.length
      );

      throw new Error(
        'FUNC-MAT-010 no detectó correctamente la CATEGORIA vacía.'
      );
    }

    console.log(
      'OK hallazgo_categoria_vacia=' +
      JSON.stringify(hallazgosVacio[0])
    );

    /*
     * Caso 2: categoría inexistente.
     */
    celdaCategoria.setValue(
      'CATEGORIA_NO_VALIDA'
    );

    SpreadsheetApp.flush();

    var reporteInvalido =
      obtenerReporteIntegridad();

    var erroresInvalido =
      reporteInvalido.funcional &&
      reporteInvalido.funcional.errores
        ? reporteInvalido.funcional.errores
        : [];

    var hallazgosInvalido =
      erroresInvalido.filter(function (hallazgo) {
        return (
          hallazgo.codigo ===
            'FUNC-MAT-010' &&
          hallazgo.entidad ===
            'MATERIAL' &&
          hallazgo.registroId ===
            'MAT-0003'
        );
      });

    console.log(
      'OK hallazgos_categoria_invalida=' +
      hallazgosInvalido.length
    );

    if (hallazgosInvalido.length !== 1) {
      console.error(
        'ERR caso=categoria_invalida ' +
        'hallazgos_esperados=1 ' +
        'hallazgos_reales=' +
        hallazgosInvalido.length
      );

      throw new Error(
        'FUNC-MAT-010 no detectó correctamente la CATEGORIA inválida.'
      );
    }

    console.log(
      'OK hallazgo_categoria_invalida=' +
      JSON.stringify(hallazgosInvalido[0])
    );

  } finally {
    celdaCategoria.setValue(
      categoriaOriginal
    );

    if (validacionOriginal) {
      celdaCategoria.setDataValidation(
        validacionOriginal
      );
    } else {
      celdaCategoria.clearDataValidations();
    }

    SpreadsheetApp.flush();

    console.log(
      'OK categoria_restaurada=' +
      String(categoriaOriginal)
    );

    console.log(
      'OK validacion_restaurada=' +
      Boolean(validacionOriginal)
    );
  }

  var reporteFinal =
    obtenerReporteIntegridad();

  var erroresFinales =
    reporteFinal.funcional &&
    reporteFinal.funcional.errores
      ? reporteFinal.funcional.errores
      : [];

  var persisteError =
    erroresFinales.some(function (hallazgo) {
      return (
        hallazgo.codigo ===
          'FUNC-MAT-010' &&
        hallazgo.entidad ===
          'MATERIAL' &&
        hallazgo.registroId ===
          'MAT-0003'
      );
    });

  if (persisteError) {
    console.error(
      'ERR integridad_final_limpia=false'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw new Error(
      'FUNC-MAT-010 persiste después de restaurar el dato.'
    );
  }

  console.log(
    'OK integridad_final_limpia=true'
  );

  console.log(
    'NEXT revisar_resultado_FUNC_MAT_010'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}


function diagnosticarInstrumentacionReporteIntegridad() {
  var packageName =
    'DIAGNOSTICAR_INSTRUMENTACION_REPORTE_INTEGRIDAD';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var reporte =
    obtenerReporteIntegridad();

  if (!reporte.instrumentacion) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw new Error(
      'INSTRUMENTACION_ERROR: obtenerReporteIntegridad no devolvió reporte.instrumentacion'
    );
  }

  var instrumentacion =
    reporte.instrumentacion;

  console.log(
    'OK duracion_total_ms=' +
    instrumentacion.duracionTotalMs
  );

  console.log(
    'OK estructural=' +
    JSON.stringify(instrumentacion.estructural)
  );

  console.log(
    'OK funcional=' +
    JSON.stringify(instrumentacion.funcional)
  );

  var totalLecturasHoja =
    instrumentacion.estructural.lecturasHoja +
    instrumentacion.funcional.lecturasHoja;

  console.log(
    'OK total_lecturas_hoja=' +
    totalLecturasHoja
  );

  if (!(instrumentacion.duracionTotalMs >= 0)) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw new Error(
      'INSTRUMENTACION_ERROR: duracionTotalMs no es un número válido'
    );
  }

  if (!(totalLecturasHoja > 0)) {
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=ERR'
    );

    throw new Error(
      'INSTRUMENTACION_ERROR: no se contabilizó ninguna lectura de hoja, revisar el enganche en leerFilasEntidadComoObjetos_'
    );
  }

  console.log(
    'NEXT usar_estos_datos_para_decidir_alcance_refactor_lectura_Paso_6'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return instrumentacion;
}


function diagnosticarLecturaCategoriaMaterial() {
  var packageName = 'DIAGNOSTICAR_LECTURA_CATEGORIA_MATERIAL';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('08_MATERIALES');

  if (!hoja) {
    console.error('ERR hoja_no_existe=08_MATERIALES');
    console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=ERR');
    throw new Error('No existe 08_MATERIALES.');
  }

  var datos = hoja.getDataRange().getDisplayValues();
  var cabeceras = datos[0].map(function(valor) {
    return String(valor || '').trim();
  });

  var idxId = cabeceras.indexOf('ID');
  var idxCategoria = cabeceras.indexOf('CATEGORIA');

  if (idxId === -1 || idxCategoria === -1) {
    console.error('ERR columnas_requeridas=false');
    console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=ERR');
    throw new Error('Faltan ID o CATEGORIA.');
  }

  var fila = -1;

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][idxId] || '').trim() === 'MAT-0003') {
      fila = i + 1;
      break;
    }
  }

  if (fila === -1) {
    console.error('ERR material_no_existe=MAT-0003');
    console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=ERR');
    throw new Error('No existe MAT-0003.');
  }

  var celda = hoja.getRange(fila, idxCategoria + 1);
  var valorOriginal = celda.getValue();
  var validacionOriginal = celda.getDataValidation();

  try {
    celda.clearDataValidations();
    celda.setValue('');
    SpreadsheetApp.flush();

    var valorCelda = celda.getDisplayValue();

    var materialLeido = listarRegistros('MATERIAL').filter(function(material) {
      return String(material.ID || '').trim() === 'MAT-0003';
    })[0];

    console.log('OK valor_celda=[' + valorCelda + ']');
    console.log('OK material_encontrado=' + Boolean(materialLeido));
    console.log('OK activo_leido=[' + String(materialLeido && materialLeido.ACTIVO || '') + ']');
    console.log('OK categoria_leida=[' + String(materialLeido && materialLeido.CATEGORIA || '') + ']');

    if (!materialLeido) {
      console.error('ERR listarRegistros_no_devuelve_MAT-0003');
      throw new Error('listarRegistros no devuelve MAT-0003.');
    }

    if (String(materialLeido.CATEGORIA || '').trim() !== '') {
      console.error('ERR categoria_no_leida_como_vacia=true');
      throw new Error('listarRegistros no lee la categoría vacía.');
    }

    if (String(materialLeido.ACTIVO || '').trim() !== 'SÍ') {
      console.error('ERR material_no_esta_activo=true');
      throw new Error('MAT-0003 no cumple el filtro ACTIVO=SÍ.');
    }

    console.log('OK lectura_categoria_vacia=true');
    console.log('NEXT revisar_ubicacion_FUNC_MAT_010');

  } finally {
    celda.setValue(valorOriginal);

    if (validacionOriginal) {
      celda.setDataValidation(validacionOriginal);
    } else {
      celda.clearDataValidations();
    }

    SpreadsheetApp.flush();

    console.log('OK categoria_restaurada=' + String(valorOriginal));
    console.log('OK validacion_restaurada=' + Boolean(validacionOriginal));
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
}


/**
 * ============================================================
 * COBERTURA DIRECTA PENDIENTE — INTEGRITYSERVICE
 *
 * Reglas:
 * - FUNC-STOCK-002
 * - FUNC-MAT-001
 * - FUNC-TAREA-001
 * - FUNC-REC-001
 * - FUNC-INC-003
 * - FUNC-MAT-002
 * - FUNC-MAT-007
 * - FUNC-MAT-008
 * - FUNC-MAT-009
 * - FUNC-REL-001
 *
 * Metodología:
 * - introduce una inconsistencia temporal por edición directa;
 * - ejecuta obtenerReporteIntegridad();
 * - exige exactamente el código, entidad y registro esperados;
 * - restaura los datos en finally;
 * - comprueba que el hallazgo ya no persiste.
 * ============================================================
 */

function ejecutarSuiteIntegridadCoberturaDirectaPendiente() {
  var packageName =
    'SUITE_INTEGRIDAD_COBERTURA_DIRECTA_PENDIENTE';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var pruebas = [
    probarIntegridadStockMinimo,
    probarIntegridadTareaMaterialDesviacionSinMotivo,
    probarIntegridadTareaTerminadaAvanceIncompleto,
    probarIntegridadDedicacionPersonaSuperior100,
    probarIntegridadIncidenciaResolucionAnteriorDeteccion,
    probarIntegridadMaterialProveedorInactivo,
    probarIntegridadMaterialCodigoDuplicado,
    probarIntegridadMaterialCodigoVacio,
    probarIntegridadMaterialNombreVacio,
    probarIntegridadProyectoProductoCantidadInvalida
  ];

  pruebas.forEach(function (prueba) {
    prueba();
  });

  console.log(
    'OK pruebas_superadas=' +
      pruebas.length
  );

  console.log(
    'NEXT ejecutar_obtenerReporteIntegridad_y_confirmar_limpio'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadStockMinimo() {
  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_STOCK_002',

    codigo:
      'FUNC-STOCK-002',

    entidad:
      'MATERIAL',

    seleccionarRegistro:
      function () {
        return seleccionarPrimerRegistroActivo_(
          'MATERIAL'
        );
      },

    mutaciones: {
      STOCK_ACTUAL: 1,
      STOCK_MINIMO: 1,
      CANTIDAD_RESERVADA: 0
    }
  });
}


function probarIntegridadTareaMaterialDesviacionSinMotivo() {
  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_MAT_001',

    codigo:
      'FUNC-MAT-001',

    entidad:
      'TAREA_MATERIAL',

    seleccionarRegistro:
      function () {
        return seleccionarPrimerRegistroActivo_(
          'TAREA_MATERIAL'
        );
      },

    mutaciones: {
      CANTIDAD_PREVISTA: 1,
      CANTIDAD_CONSUMIDA: 1,
      CANTIDAD_DESPERDICIADA: 1,
      MOTIVO_DESVIACION: ''
    }
  });
}


function probarIntegridadTareaTerminadaAvanceIncompleto() {
  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_TAREA_001',

    codigo:
      'FUNC-TAREA-001',

    entidad:
      'TAREA',

    seleccionarRegistro:
      function () {
        return seleccionarPrimerRegistroActivo_(
          'TAREA'
        );
      },

    mutaciones: {
      ESTADO: 'Terminada',
      PORCENTAJE_AVANCE: 50
    }
  });
}


function probarIntegridadIncidenciaResolucionAnteriorDeteccion() {
  var registro =
    seleccionarPrimerRegistroActivo_(
      'INCIDENCIA'
    );

  var fechaDeteccion =
    new Date(2026, 6, 29);

  var fechaResolucion =
    new Date(2026, 6, 28);

  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_INC_003',

    codigo:
      'FUNC-INC-003',

    entidad:
      'INCIDENCIA',

    registro:
      registro,

    mutaciones: {
      FECHA_DETECCION:
        fechaDeteccion,

      FECHA_RESOLUCION:
        fechaResolucion
    }
  });
}


function probarIntegridadMaterialProveedorInactivo() {
  var materiales =
    listarRegistros(
      'MATERIAL',
      {ACTIVO: 'SÍ'}
    );

  var proveedores =
    listarRegistros(
      'PROVEEDOR',
      {}
    );

  var proveedoresPorId = {};

  proveedores.forEach(function (proveedor) {
    proveedoresPorId[
      String(proveedor.ID || '').trim()
    ] = proveedor;
  });

  var material =
    materiales.find(function (registro) {
      var proveedorId =
        String(
          registro.PROVEEDOR_ID || ''
        ).trim();

      return (
        proveedorId !== '' &&
        Boolean(
          proveedoresPorId[
            proveedorId
          ]
        )
      );
    });

  if (!material) {
    throw new Error(
      'FUNC-MAT-002_TEST_ERROR: no existe material activo con proveedor existente'
    );
  }

  var proveedor =
    proveedoresPorId[
      String(
        material.PROVEEDOR_ID
      ).trim()
    ];

  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_MAT_002',

    codigo:
      'FUNC-MAT-002',

    entidad:
      'MATERIAL',

    registroIdEsperado:
      material.ID,

    registro:
      proveedor,

    entidadMutada:
      'PROVEEDOR',

    mutaciones: {
      ACTIVO: 'NO'
    }
  });
}


function probarIntegridadMaterialCodigoVacio() {
  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_MAT_008',

    codigo:
      'FUNC-MAT-008',

    entidad:
      'MATERIAL',

    seleccionarRegistro:
      function () {
        return seleccionarPrimerRegistroActivo_(
          'MATERIAL'
        );
      },

    mutaciones: {
      CODIGO: ''
    }
  });
}


function probarIntegridadMaterialNombreVacio() {
  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_MAT_009',

    codigo:
      'FUNC-MAT-009',

    entidad:
      'MATERIAL',

    seleccionarRegistro:
      function () {
        return seleccionarPrimerRegistroActivo_(
          'MATERIAL'
        );
      },

    mutaciones: {
      NOMBRE: ''
    }
  });
}


function probarIntegridadProyectoProductoCantidadInvalida() {
  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_REL_001',

    codigo:
      'FUNC-REL-001',

    entidad:
      'PROYECTO_PRODUCTO',

    seleccionarRegistro:
      function () {
        return seleccionarPrimerRegistroActivo_(
          'PROYECTO_PRODUCTO'
        );
      },

    mutaciones: {
      CANTIDAD_ASIGNADA: 0
    }
  });
}


function probarIntegridadMaterialCodigoDuplicado() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_MAT_007';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'MATERIAL'
    );

  var materialBase =
    seleccionarPrimerRegistroActivo_(
      'MATERIAL'
    );

  var idTemporal =
    'MAT-AUD-FUNC-MAT-007';

  var filaTemporal =
    null;

  try {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    var registroTemporal =
      Object.assign(
        {},
        materialBase,
        {
          ID: idTemporal,
          CODIGO:
            materialBase.CODIGO,
          NOMBRE:
            'AUDITORIA DUPLICADO FUNC-MAT-007',
          ACTIVO:
            'SÍ'
        }
      );

    filaTemporal =
      insertarFilaCrudaIntegridad_(
        hoja,
        registroTemporal
      );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-MAT-007',
      'MATERIAL',
      materialBase.ID,
      1
    );

    assertHallazgoIntegridad_(
      'FUNC-MAT-007',
      'MATERIAL',
      idTemporal,
      1
    );

    console.log(
      'OK duplicidad_detectada_en_ambos_registros=true'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-MAT-007',
    'MATERIAL',
    idTemporal
  );

  console.log(
    'OK fila_temporal_restaurada=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadDedicacionPersonaSuperior100() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_REC_001';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var asignaciones =
    listarRegistros(
      'TAREA_RESPONSABLE',
      {ACTIVO: 'SÍ'}
    ).filter(function (registro) {
      return (
        ['Planificada', 'Activa']
          .indexOf(registro.ESTADO) !== -1 &&
        String(
          registro.PERSONA_EQUIPO_ID || ''
        ).trim() !== ''
      );
    });

  if (asignaciones.length === 0) {
    throw new Error(
      'FUNC-REC-001_TEST_ERROR: no existe asignación activa o planificada'
    );
  }

  var base =
    asignaciones[0];

  var personaId =
    String(
      base.PERSONA_EQUIPO_ID
    ).trim();

  var totalActual =
    asignaciones
      .filter(function (registro) {
        return (
          String(
            registro.PERSONA_EQUIPO_ID || ''
          ).trim() === personaId
        );
      })
      .reduce(function (total, registro) {
        return (
          total +
          (
            Number(
              registro.PORCENTAJE_DEDICACION
            ) || 0
          )
        );
      }, 0);

  var porcentajeTemporal =
    Math.max(
      1,
      101 - totalActual
    );

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'TAREA_RESPONSABLE'
    );

  var idTemporal =
    'TRE-AUD-FUNC-REC-001';

  try {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    insertarFilaCrudaIntegridad_(
      hoja,
      Object.assign(
        {},
        base,
        {
          ID:
            idTemporal,

          PORCENTAJE_DEDICACION:
            porcentajeTemporal,

          ESTADO:
            'Activa',

          ACTIVO:
            'SÍ'
        }
      )
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-REC-001',
      'PERSONA_EQUIPO',
      personaId,
      1
    );

    console.log(
      'OK dedicacion_total_temporal=' +
        (
          totalActual +
          porcentajeTemporal
        )
    );

  } finally {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-REC-001',
    'PERSONA_EQUIPO',
    personaId
  );

  console.log(
    'OK asignacion_temporal_restaurada=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadDedicacionSoloCuentaPeriodosSolapados() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_REC_001_SOLAPAMIENTO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  // Las fechas sintéticas de esta prueba están deliberadamente en 2035,
  // fuera de cualquier dato real de la hoja, por lo que solo las
  // asignaciones ACTIVAS SIN FECHAS de una persona cuentan como "carga
  // de fondo" que se solapa con esa ventana (se tratan como siempre
  // activas, igual que en detectarProblemasTareaResponsable_).
  var dedicacionSinFechasPorPersona_ = {};

  listarRegistros(
    'TAREA_RESPONSABLE',
    {ACTIVO: 'SÍ'}
  ).forEach(function (registro) {
    if (
      ['Planificada', 'Activa']
        .indexOf(registro.ESTADO) === -1
    ) {
      return;
    }

    var inicio =
      parseFechaIntegridad_(
        registro.FECHA_INICIO_ASIGNACION
      );

    var fin =
      parseFechaIntegridad_(
        registro.FECHA_FIN_ASIGNACION
      );

    var tieneFechas =
      !isNaN(inicio.getTime()) &&
      !isNaN(fin.getTime());

    if (tieneFechas) {
      return;
    }

    var personaId =
      String(registro.PERSONA_EQUIPO_ID || '').trim();

    if (!personaId) {
      return;
    }

    dedicacionSinFechasPorPersona_[personaId] =
      (dedicacionSinFechasPorPersona_[personaId] || 0) +
      (Number(registro.PORCENTAJE_DEDICACION) || 0);
  });

  var personaId = null;
  var dedicacionBase = 0;

  listarRegistros(
    'PERSONA_EQUIPO',
    {ACTIVO: 'SÍ'}
  ).filter(function (persona) {
    return persona.ESTADO !== 'Inactivo';
  }).some(function (persona) {
    var id = String(persona.ID).trim();
    var base = dedicacionSinFechasPorPersona_[id] || 0;

    if (base < 100) {
      personaId = id;
      dedicacionBase = base;
      return true;
    }

    return false;
  });

  if (!personaId) {
    throw new Error(
      'FUNC-REC-001_SOLAPAMIENTO_TEST_ERROR: no existe una PERSONA_EQUIPO activa con margen de dedicación disponible para aislar la prueba'
    );
  }

  // pct se calcula para que baseline+pct=100 (caso sin solapamiento,
  // no debe superar el 100%) y baseline+2*pct>100 (caso solapado,
  // debe superarlo), sea cual sea la dedicación previa sin fechas.
  var pct = 100 - dedicacionBase;

  console.log(
    'OK persona_id=' + personaId +
      ' dedicacion_base_sin_fechas=' + dedicacionBase +
      ' pct_sintetico=' + pct
  );

  var tareaBase =
    listarRegistros(
      'TAREA',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!tareaBase) {
    throw new Error(
      'FUNC-REC-001_SOLAPAMIENTO_TEST_ERROR: no existe una TAREA activa utilizable'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'TAREA_RESPONSABLE'
    );

  var idA = 'TRE-AUD-REC-001-A';
  var idB = 'TRE-AUD-REC-001-B';

  var filaBase = {
    TAREA_ID: tareaBase.ID,
    PERSONA_EQUIPO_ID: personaId,
    ROL_ASIGNADO: 'Responsable',
    PORCENTAJE_DEDICACION: pct,
    ESTADO: 'Activa',
    ACTIVO: 'SÍ'
  };

  try {
    eliminarFilaPorIdIntegridad_(hoja, idA);
    eliminarFilaPorIdIntegridad_(hoja, idB);

    // Caso 1: dos asignaciones de "pct" cada una (baseline+pct=100)
    // en periodos NO solapados (fechas lejanas, fuera de cualquier
    // dato real de la hoja) — no debe superar el 100% simultáneo.
    insertarFilaCrudaIntegridad_(
      hoja,
      Object.assign({}, filaBase, {
        ID: idA,
        FECHA_INICIO_ASIGNACION: new Date(2035, 0, 1),
        FECHA_FIN_ASIGNACION: new Date(2035, 0, 31)
      })
    );

    insertarFilaCrudaIntegridad_(
      hoja,
      Object.assign({}, filaBase, {
        ID: idB,
        FECHA_INICIO_ASIGNACION: new Date(2035, 1, 1),
        FECHA_FIN_ASIGNACION: new Date(2035, 1, 28)
      })
    );

    SpreadsheetApp.flush();

    assertSinHallazgoIntegridad_(
      'FUNC-REC-001',
      'PERSONA_EQUIPO',
      personaId
    );

    console.log(
      'OK sin_solapamiento_sin_falso_positivo=true'
    );

    // Caso 2: se traslada la asignación B para que solape con A.
    escribirCamposRegistroIntegridad_(
      hoja,
      idB,
      {
        FECHA_INICIO_ASIGNACION: new Date(2035, 0, 15),
        FECHA_FIN_ASIGNACION: new Date(2035, 1, 15)
      }
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-REC-001',
      'PERSONA_EQUIPO',
      personaId,
      1
    );

    console.log(
      'OK con_solapamiento_genera_hallazgo=true'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(hoja, idA);
    eliminarFilaPorIdIntegridad_(hoja, idB);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-REC-001',
    'PERSONA_EQUIPO',
    personaId
  );

  console.log(
    'OK restauracion_completa=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadAltaAsignacionDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_ALTA_ASIGNACION_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var campanaBase =
    listarRegistros(
      'CAMPANA',
      {ACTIVO: 'SÍ'}
    )[0];

  var personaBase =
    listarRegistros(
      'PERSONA_EQUIPO',
      {ACTIVO: 'SÍ'}
    ).filter(function (persona) {
      return persona.ESTADO !== 'Inactivo';
    })[0];

  if (!campanaBase) {
    throw new Error(
      'ALTA_ASIGNACION_DRYRUN_TEST_ERROR: no existe una CAMPANA activa utilizable'
    );
  }

  if (!personaBase) {
    throw new Error(
      'ALTA_ASIGNACION_DRYRUN_TEST_ERROR: no existe una PERSONA_EQUIPO activa utilizable'
    );
  }

  var resultado =
    insertarRegistroTransaccional(
      'ASIGNACION',
      {
        ENTIDAD_TIPO: 'Campaña',
        ENTIDAD_ID: campanaBase.ID,
        PERSONA_EQUIPO_ID: personaBase.ID,
        ROL_ASIGNADO: 'Responsable',
        PORCENTAJE_DEDICACION: 10,
        ESTADO: 'Planificada'
      },
      {dryRun: true}
    );

  if (
    !resultado ||
    resultado.ok !== true ||
    resultado.dryRun !== true
  ) {
    throw new Error(
      'ALTA_ASIGNACION_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido'
    );
  }

  if (!/^ASG-\d{4}$/.test(resultado.id)) {
    throw new Error(
      'ALTA_ASIGNACION_DRYRUN_TEST_ERROR: ID generado con formato inesperado: ' +
        resultado.id
    );
  }

  console.log(
    'OK dryRun_id_generado=' + resultado.id
  );

  console.log(
    'OK dryRun_fila_destino=' + resultado.filaDestino
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadDedicacionAsignacionSoloCuentaPeriodosSolapados() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_ASG_001_SOLAPAMIENTO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var dedicacionSinFechasPorPersona_ = {};

  listarRegistros(
    'ASIGNACION',
    {ACTIVO: 'SÍ'}
  ).forEach(function (registro) {
    if (
      ['Planificada', 'Activa']
        .indexOf(registro.ESTADO) === -1
    ) {
      return;
    }

    var inicio =
      parseFechaIntegridad_(
        registro.FECHA_INICIO_ASIGNACION
      );

    var fin =
      parseFechaIntegridad_(
        registro.FECHA_FIN_ASIGNACION
      );

    var tieneFechas =
      !isNaN(inicio.getTime()) &&
      !isNaN(fin.getTime());

    if (tieneFechas) {
      return;
    }

    var personaId =
      String(registro.PERSONA_EQUIPO_ID || '').trim();

    if (!personaId) {
      return;
    }

    dedicacionSinFechasPorPersona_[personaId] =
      (dedicacionSinFechasPorPersona_[personaId] || 0) +
      (Number(registro.PORCENTAJE_DEDICACION) || 0);
  });

  var personaId = null;
  var dedicacionBase = 0;

  listarRegistros(
    'PERSONA_EQUIPO',
    {ACTIVO: 'SÍ'}
  ).filter(function (persona) {
    return persona.ESTADO !== 'Inactivo';
  }).some(function (persona) {
    var id = String(persona.ID).trim();
    var base = dedicacionSinFechasPorPersona_[id] || 0;

    if (base < 100) {
      personaId = id;
      dedicacionBase = base;
      return true;
    }

    return false;
  });

  if (!personaId) {
    throw new Error(
      'FUNC-ASG-001_SOLAPAMIENTO_TEST_ERROR: no existe una PERSONA_EQUIPO activa con margen de dedicación disponible para aislar la prueba'
    );
  }

  var pct = 100 - dedicacionBase;

  console.log(
    'OK persona_id=' + personaId +
      ' dedicacion_base_sin_fechas=' + dedicacionBase +
      ' pct_sintetico=' + pct
  );

  var campanaBase =
    listarRegistros(
      'CAMPANA',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!campanaBase) {
    throw new Error(
      'FUNC-ASG-001_SOLAPAMIENTO_TEST_ERROR: no existe una CAMPANA activa utilizable'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'ASIGNACION'
    );

  var idA = 'ASG-AUD-001-A';
  var idB = 'ASG-AUD-001-B';

  var filaBase = {
    ENTIDAD_TIPO: 'Campaña',
    ENTIDAD_ID: campanaBase.ID,
    PERSONA_EQUIPO_ID: personaId,
    ROL_ASIGNADO: 'Responsable',
    PORCENTAJE_DEDICACION: pct,
    ESTADO: 'Activa',
    ACTIVO: 'SÍ'
  };

  try {
    eliminarFilaPorIdIntegridad_(hoja, idA);
    eliminarFilaPorIdIntegridad_(hoja, idB);

    // Caso 1: dos asignaciones de "pct" cada una (baseline+pct=100)
    // en periodos NO solapados (fechas de 2035) — no debe superar
    // el 100% simultáneo.
    insertarFilaCrudaIntegridad_(
      hoja,
      Object.assign({}, filaBase, {
        ID: idA,
        FECHA_INICIO_ASIGNACION: new Date(2035, 0, 1),
        FECHA_FIN_ASIGNACION: new Date(2035, 0, 31)
      })
    );

    insertarFilaCrudaIntegridad_(
      hoja,
      Object.assign({}, filaBase, {
        ID: idB,
        FECHA_INICIO_ASIGNACION: new Date(2035, 1, 1),
        FECHA_FIN_ASIGNACION: new Date(2035, 1, 28)
      })
    );

    SpreadsheetApp.flush();

    assertSinHallazgoIntegridad_(
      'FUNC-ASG-001',
      'PERSONA_EQUIPO',
      personaId
    );

    console.log(
      'OK sin_solapamiento_sin_falso_positivo=true'
    );

    // Caso 2: se traslada la asignación B para que solape con A.
    escribirCamposRegistroIntegridad_(
      hoja,
      idB,
      {
        FECHA_INICIO_ASIGNACION: new Date(2035, 0, 15),
        FECHA_FIN_ASIGNACION: new Date(2035, 1, 15)
      }
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-ASG-001',
      'PERSONA_EQUIPO',
      personaId,
      1
    );

    console.log(
      'OK con_solapamiento_genera_hallazgo=true'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(hoja, idA);
    eliminarFilaPorIdIntegridad_(hoja, idB);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-ASG-001',
    'PERSONA_EQUIPO',
    personaId
  );

  console.log(
    'OK restauracion_completa=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadAltaRelacionDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_ALTA_RELACION_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var proyectos =
    listarRegistros(
      'PROYECTO',
      {ACTIVO: 'SÍ'}
    );

  if (proyectos.length < 2) {
    throw new Error(
      'ALTA_RELACION_DRYRUN_TEST_ERROR: se necesitan al menos 2 PROYECTO activos para origen y destino'
    );
  }

  var origen = proyectos[0];
  var destino = proyectos[1];

  var resultado =
    insertarRegistroTransaccional(
      'RELACION',
      {
        ENTIDAD_TIPO: 'Proyecto',
        ENTIDAD_ORIGEN_ID: origen.ID,
        ENTIDAD_DESTINO_ID: destino.ID,
        TIPO_RELACION: 'Depende de',
        ESTADO: 'Planificada'
      },
      {dryRun: true}
    );

  if (
    !resultado ||
    resultado.ok !== true ||
    resultado.dryRun !== true
  ) {
    throw new Error(
      'ALTA_RELACION_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido'
    );
  }

  if (!/^REL-\d{4}$/.test(resultado.id)) {
    throw new Error(
      'ALTA_RELACION_DRYRUN_TEST_ERROR: ID generado con formato inesperado: ' +
        resultado.id
    );
  }

  console.log(
    'OK dryRun_id_generado=' + resultado.id
  );

  console.log(
    'OK dryRun_origen=' + origen.ID + ' destino=' + destino.ID
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadRelacionAutoreferenciaDetectada() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_GRF_001';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var campanaBase =
    listarRegistros(
      'CAMPANA',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!campanaBase) {
    throw new Error(
      'FUNC-GRF-001_TEST_ERROR: no existe una CAMPANA activa utilizable'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'RELACION'
    );

  var idTemporal = 'REL-AUD-GRF-001';

  try {
    eliminarFilaPorIdIntegridad_(hoja, idTemporal);

    insertarFilaCrudaIntegridad_(
      hoja,
      {
        ID: idTemporal,
        ENTIDAD_TIPO: 'Campaña',
        ENTIDAD_ORIGEN_ID: campanaBase.ID,
        ENTIDAD_DESTINO_ID: campanaBase.ID,
        TIPO_RELACION: 'Depende de',
        ESTADO: 'Activa',
        ACTIVO: 'SÍ'
      }
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-GRF-001',
      'RELACION',
      idTemporal,
      1
    );

    console.log(
      'OK autoreferencia_detectada=true'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(hoja, idTemporal);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-GRF-001',
    'RELACION',
    idTemporal
  );

  console.log(
    'OK restauracion_completa=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadCamposCriteriosAceptacionDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_CRITERIOS_ACEPTACION_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var casos = [
    {entidad: 'PROYECTO', prefijo: 'PRO'},
    {entidad: 'PRODUCTO', prefijo: 'PRD'},
    {entidad: 'PROCESO', prefijo: 'PCS'},
    {entidad: 'TAREA', prefijo: 'TAR'},
    {entidad: 'DECISION', prefijo: 'DEC'}
  ];

  casos.forEach(function (caso) {
    var registros =
      listarRegistros(
        caso.entidad,
        {ACTIVO: 'SÍ'}
      );

    if (registros.length === 0) {
      throw new Error(
        'CRITERIOS_ACEPTACION_DRYRUN_TEST_ERROR: no existe ningún registro activo de ' +
          caso.entidad
      );
    }

    var base = registros[0];

    var camposObligatorios =
      CAMPOS_OBLIGATORIOS_MVP[caso.entidad] || [];

    var datos = {};

    camposObligatorios.forEach(function (campo) {
      datos[campo] = base[campo];
    });

    // PRODUCTO valida unicidad de CODIGO incluso en dryRun: reutilizar el
    // código exacto de un producto real provocaría un falso ERROR.
    if (caso.entidad === 'PRODUCTO') {
      datos.CODIGO =
        'AUD-CRIT-DRYRUN-' + new Date().getTime();
    }

    // PROCESO y TAREA validan unicidad de ORDEN_SECUENCIA dentro de su
    // padre incluso en dryRun: reutilizar el orden exacto de un registro
    // real provocaría un falso ERROR.
    if (
      caso.entidad === 'PROCESO' ||
      caso.entidad === 'TAREA'
    ) {
      datos.ORDEN_SECUENCIA = 9000 + Math.floor(Math.random() * 999);
    }

    datos.OBJETIVO =
      'Objetivo de prueba (dryRun)';

    datos.RESULTADO_ESPERADO =
      'Resultado esperado de prueba (dryRun)';

    datos.CRITERIOS_ACEPTACION =
      'Criterios de prueba (dryRun)';

    datos.DEFINITION_OF_DONE =
      'Definition of Done de prueba (dryRun)';

    var resultado =
      insertarRegistroTransaccional(
        caso.entidad,
        datos,
        {dryRun: true}
      );

    if (
      !resultado ||
      resultado.ok !== true ||
      resultado.dryRun !== true
    ) {
      throw new Error(
        'CRITERIOS_ACEPTACION_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido para ' +
          caso.entidad
      );
    }

    var patronId =
      new RegExp('^' + caso.prefijo + '-\\d{4}$');

    if (!patronId.test(resultado.id)) {
      throw new Error(
        'CRITERIOS_ACEPTACION_DRYRUN_TEST_ERROR: ID inesperado para ' +
          caso.entidad +
          ': ' +
          resultado.id
      );
    }

    console.log(
      'OK ' + caso.entidad + '_dryRun_id=' + resultado.id
    );
  });

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadProcesoPreparadoSinPrecondiciones() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_PROCESO_003';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var proceso =
    listarRegistros(
      'PROCESO',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!proceso) {
    throw new Error(
      'FUNC-PROCESO-003_TEST_ERROR: no existe un PROCESO activo utilizable'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'PROCESO'
    );

  var valoresOriginales = {
    ESTADO: proceso.ESTADO || '',
    RESPONSABLE_ID: proceso.RESPONSABLE_ID || '',
    CRITERIOS_ACEPTACION: proceso.CRITERIOS_ACEPTACION || ''
  };

  try {
    escribirCamposRegistroIntegridad_(
      hoja,
      proceso.ID,
      {
        ESTADO: 'Preparado',
        RESPONSABLE_ID: '',
        CRITERIOS_ACEPTACION: ''
      }
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-PROCESO-003',
      'PROCESO',
      proceso.ID,
      1
    );

    console.log(
      'OK precondiciones_faltantes_detectadas=true'
    );

  } finally {
    escribirCamposRegistroIntegridad_(
      hoja,
      proceso.ID,
      valoresOriginales
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-PROCESO-003',
    'PROCESO',
    proceso.ID
  );

  console.log(
    'OK restauracion_completa=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadTareaPreparadaSinPrecondiciones() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_TAREA_013';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var tareasConResponsable_ = {};

  listarRegistros(
    'TAREA_RESPONSABLE',
    {ACTIVO: 'SÍ'}
  ).forEach(function (a) {
    if (
      ['Planificada', 'Activa']
        .indexOf(a.ESTADO) !== -1
    ) {
      tareasConResponsable_[
        String(a.TAREA_ID || '').trim()
      ] = true;
    }
  });

  var tarea =
    listarRegistros(
      'TAREA',
      {ACTIVO: 'SÍ'}
    ).filter(function (t) {
      return !tareasConResponsable_[
        String(t.ID || '').trim()
      ];
    })[0];

  if (!tarea) {
    throw new Error(
      'FUNC-TAREA-013_TEST_ERROR: no existe una TAREA activa sin responsable asignado para aislar la prueba'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'TAREA'
    );

  var valoresOriginales = {
    ESTADO: tarea.ESTADO || '',
    CRITERIOS_ACEPTACION: tarea.CRITERIOS_ACEPTACION || ''
  };

  try {
    escribirCamposRegistroIntegridad_(
      hoja,
      tarea.ID,
      {
        ESTADO: 'Preparada',
        CRITERIOS_ACEPTACION: ''
      }
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-TAREA-013',
      'TAREA',
      tarea.ID,
      1
    );

    console.log(
      'OK precondiciones_faltantes_detectadas=true'
    );

  } finally {
    escribirCamposRegistroIntegridad_(
      hoja,
      tarea.ID,
      valoresOriginales
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-TAREA-013',
    'TAREA',
    tarea.ID
  );

  console.log(
    'OK restauracion_completa=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadIncidenciaResueltaSinAccionCorrectora() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_INC_004';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var incidencia =
    listarRegistros(
      'INCIDENCIA',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!incidencia) {
    throw new Error(
      'FUNC-INC-004_TEST_ERROR: no existe una INCIDENCIA activa utilizable'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'INCIDENCIA'
    );

  var valoresOriginales = {
    ESTADO: incidencia.ESTADO || '',
    ACCION_CORRECTORA: incidencia.ACCION_CORRECTORA || '',
    FECHA_RESOLUCION: incidencia.FECHA_RESOLUCION || ''
  };

  try {
    escribirCamposRegistroIntegridad_(
      hoja,
      incidencia.ID,
      {
        ESTADO: 'Resuelta',
        ACCION_CORRECTORA: '',
        FECHA_RESOLUCION: ''
      }
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-INC-004',
      'INCIDENCIA',
      incidencia.ID,
      1
    );

    console.log(
      'OK precondiciones_faltantes_detectadas=true'
    );

  } finally {
    escribirCamposRegistroIntegridad_(
      hoja,
      incidencia.ID,
      valoresOriginales
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-INC-004',
    'INCIDENCIA',
    incidencia.ID
  );

  console.log(
    'OK restauracion_completa=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadProveedorActivoSinContacto() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_PRV_006';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var proveedor =
    listarRegistros(
      'PROVEEDOR',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!proveedor) {
    throw new Error(
      'FUNC-PRV-006_TEST_ERROR: no existe un PROVEEDOR activo utilizable'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'PROVEEDOR'
    );

  var valoresOriginales = {
    ESTADO: proveedor.ESTADO || '',
    NIF_CIF: proveedor.NIF_CIF || '',
    PERSONA_CONTACTO: proveedor.PERSONA_CONTACTO || ''
  };

  try {
    escribirCamposRegistroIntegridad_(
      hoja,
      proveedor.ID,
      {
        ESTADO: 'Activo',
        NIF_CIF: '',
        PERSONA_CONTACTO: ''
      }
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-PRV-006',
      'PROVEEDOR',
      proveedor.ID,
      1
    );

    console.log(
      'OK precondiciones_faltantes_detectadas=true'
    );

  } finally {
    escribirCamposRegistroIntegridad_(
      hoja,
      proveedor.ID,
      valoresOriginales
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-PRV-006',
    'PROVEEDOR',
    proveedor.ID
  );

  console.log(
    'OK restauracion_completa=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadProductoCodigoNoNormalizado() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_PRD_001';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var producto =
    listarRegistros(
      'PRODUCTO',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!producto) {
    throw new Error(
      'FUNC-PRD-001_TEST_ERROR: no existe un PRODUCTO activo utilizable'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'PRODUCTO'
    );

  var codigoOriginal = producto.CODIGO || '';

  try {
    escribirCamposRegistroIntegridad_(
      hoja,
      producto.ID,
      {CODIGO: 'código con espacios ñ'}
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-PRD-001',
      'PRODUCTO',
      producto.ID,
      1
    );

    console.log(
      'OK codigo_no_normalizado_detectado=true'
    );

  } finally {
    escribirCamposRegistroIntegridad_(
      hoja,
      producto.ID,
      {CODIGO: codigoOriginal}
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-PRD-001',
    'PRODUCTO',
    producto.ID
  );

  console.log(
    'OK restauracion_completa=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadCatalogosAmpliadosL2() {
  var packageName =
    'PROBAR_INTEGRIDAD_CATALOGOS_AMPLIADOS_L2';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var tiposIncidencia =
    obtenerCatalogo('CFG_TIPO_INCIDENCIA');

  var esperadosIncidencia = [
    'Funcional', 'Usabilidad', 'Datos', 'Integración',
    'Rendimiento', 'Trazabilidad', 'Automatización', 'Otra'
  ];

  esperadosIncidencia.forEach(function (valor) {
    if (tiposIncidencia.indexOf(valor) === -1) {
      throw new Error(
        'CATALOGOS_AMPLIADOS_L2_TEST_ERROR: falta "' +
          valor +
          '" en CFG_TIPO_INCIDENCIA (valores actuales: ' +
          tiposIncidencia.join(', ') +
          ')'
      );
    }
  });

  console.log(
    'OK CFG_TIPO_INCIDENCIA_completo=true valores=' +
      tiposIncidencia.length
  );

  var tiposDocumento =
    obtenerCatalogo('CFG_TIPO_DOCUMENTO');

  var esperadosDocumento = [
    'Plan', 'Especificación', 'Requisitos', 'Tutorial', 'Checklist',
    'Memoria', 'Evidencia', 'Prueba', 'Referencia', 'Decisión', 'Otro'
  ];

  esperadosDocumento.forEach(function (valor) {
    if (tiposDocumento.indexOf(valor) === -1) {
      throw new Error(
        'CATALOGOS_AMPLIADOS_L2_TEST_ERROR: falta "' +
          valor +
          '" en CFG_TIPO_DOCUMENTO (valores actuales: ' +
          tiposDocumento.join(', ') +
          ')'
      );
    }
  });

  console.log(
    'OK CFG_TIPO_DOCUMENTO_completo=true valores=' +
      tiposDocumento.length
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadAltaVinculoDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_ALTA_VINCULO_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var documento =
    listarRegistros(
      'DOCUMENTO',
      {ACTIVO: 'SÍ'}
    )[0];

  var campana =
    listarRegistros(
      'CAMPANA',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!documento) {
    throw new Error(
      'ALTA_VINCULO_DRYRUN_TEST_ERROR: no existe un DOCUMENTO activo utilizable'
    );
  }

  if (!campana) {
    throw new Error(
      'ALTA_VINCULO_DRYRUN_TEST_ERROR: no existe una CAMPANA activa utilizable'
    );
  }

  var resultado =
    insertarRegistroTransaccional(
      'VINCULO',
      {
        ENTIDAD_ORIGEN_TIPO: 'Documento',
        ENTIDAD_ORIGEN_ID: documento.ID,
        ENTIDAD_DESTINO_TIPO: 'Campaña',
        ENTIDAD_DESTINO_ID: campana.ID,
        TIPO_VINCULO: 'Contexto',
        ESTADO: 'Planificada'
      },
      {dryRun: true}
    );

  if (
    !resultado ||
    resultado.ok !== true ||
    resultado.dryRun !== true
  ) {
    throw new Error(
      'ALTA_VINCULO_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido'
    );
  }

  if (!/^VIN-\d{4}$/.test(resultado.id)) {
    throw new Error(
      'ALTA_VINCULO_DRYRUN_TEST_ERROR: ID generado con formato inesperado: ' +
        resultado.id
    );
  }

  console.log(
    'OK dryRun_id_generado=' + resultado.id
  );

  console.log(
    'OK dryRun_origen=Documento:' + documento.ID +
      ' destino=Campaña:' + campana.ID
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadVinculoAutoreferenciaDetectada() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_VIN_001';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var campana =
    listarRegistros(
      'CAMPANA',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!campana) {
    throw new Error(
      'FUNC-VIN-001_TEST_ERROR: no existe una CAMPANA activa utilizable'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'VINCULO'
    );

  var idTemporal = 'VIN-AUD-VIN-001';

  try {
    eliminarFilaPorIdIntegridad_(hoja, idTemporal);

    insertarFilaCrudaIntegridad_(
      hoja,
      {
        ID: idTemporal,
        ENTIDAD_ORIGEN_TIPO: 'Campaña',
        ENTIDAD_ORIGEN_ID: campana.ID,
        ENTIDAD_DESTINO_TIPO: 'Campaña',
        ENTIDAD_DESTINO_ID: campana.ID,
        TIPO_VINCULO: 'Relacionada',
        ESTADO: 'Activa',
        ACTIVO: 'SÍ'
      }
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-VIN-001',
      'VINCULO',
      idTemporal,
      1
    );

    console.log(
      'OK autoreferencia_detectada=true'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(hoja, idTemporal);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-VIN-001',
    'VINCULO',
    idTemporal
  );

  console.log(
    'OK restauracion_completa=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadModoUsoDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_MODO_USO_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var proyectoProductoBase =
    listarRegistros(
      'PROYECTO_PRODUCTO',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!proyectoProductoBase) {
    throw new Error(
      'MODO_USO_DRYRUN_TEST_ERROR: no existe una PROYECTO_PRODUCTO activa utilizable'
    );
  }

  // PROYECTO_PRODUCTO no permite duplicar el par PROYECTO_ID/PRODUCTO_ID
  // incluso en dryRun: se busca un PROYECTO activo que todavía no esté
  // vinculado al PRODUCTO_ID del registro base.
  var proyectosYaVinculados_ = {};

  listarRegistros(
    'PROYECTO_PRODUCTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (pp) {
    if (
      String(pp.PRODUCTO_ID || '').trim() ===
        String(proyectoProductoBase.PRODUCTO_ID || '').trim()
    ) {
      proyectosYaVinculados_[
        String(pp.PROYECTO_ID || '').trim()
      ] = true;
    }
  });

  var proyectoLibre =
    listarRegistros(
      'PROYECTO',
      {ACTIVO: 'SÍ'}
    ).filter(function (p) {
      return !proyectosYaVinculados_[String(p.ID).trim()];
    })[0];

  if (!proyectoLibre) {
    throw new Error(
      'MODO_USO_DRYRUN_TEST_ERROR: no existe un PROYECTO activo sin vincular ya al PRODUCTO_ID de la relación base'
    );
  }

  var datosProyectoProducto = {};

  (CAMPOS_OBLIGATORIOS_MVP.PROYECTO_PRODUCTO || [])
    .forEach(function (campo) {
      datosProyectoProducto[campo] = proyectoProductoBase[campo];
    });

  datosProyectoProducto.PROYECTO_ID = proyectoLibre.ID;
  datosProyectoProducto.MODO_USO = 'Reutilización sin cambios';

  var resultadoProyectoProducto =
    insertarRegistroTransaccional(
      'PROYECTO_PRODUCTO',
      datosProyectoProducto,
      {dryRun: true}
    );

  if (
    !resultadoProyectoProducto ||
    resultadoProyectoProducto.ok !== true ||
    resultadoProyectoProducto.dryRun !== true
  ) {
    throw new Error(
      'MODO_USO_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido para PROYECTO_PRODUCTO'
    );
  }

  console.log(
    'OK PROYECTO_PRODUCTO_dryRun_id=' + resultadoProyectoProducto.id
  );

  var procesoBase =
    listarRegistros(
      'PROCESO',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!procesoBase) {
    throw new Error(
      'MODO_USO_DRYRUN_TEST_ERROR: no existe un PROCESO activo utilizable'
    );
  }

  var datosProceso = {};

  (CAMPOS_OBLIGATORIOS_MVP.PROCESO || [])
    .forEach(function (campo) {
      datosProceso[campo] = procesoBase[campo];
    });

  // PROCESO valida unicidad de ORDEN_SECUENCIA dentro de su PRODUCTO_ID
  // incluso en dryRun (ver Fase L1.3) — usar un valor sintético.
  datosProceso.ORDEN_SECUENCIA = 9000 + Math.floor(Math.random() * 999);

  datosProceso.PROYECTO_PRODUCTO_ID = proyectoProductoBase.ID;
  datosProceso.MODO_USO = 'Adaptación específica';

  var resultadoProceso =
    insertarRegistroTransaccional(
      'PROCESO',
      datosProceso,
      {dryRun: true}
    );

  if (
    !resultadoProceso ||
    resultadoProceso.ok !== true ||
    resultadoProceso.dryRun !== true
  ) {
    throw new Error(
      'MODO_USO_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido para PROCESO'
    );
  }

  console.log(
    'OK PROCESO_dryRun_id=' + resultadoProceso.id
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadAltaMovimientoMaterialDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_ALTA_MOVIMIENTO_MATERIAL_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var material =
    listarRegistros(
      'MATERIAL',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!material) {
    throw new Error(
      'ALTA_MOVIMIENTO_MATERIAL_DRYRUN_TEST_ERROR: no existe un MATERIAL activo utilizable'
    );
  }

  var resultado =
    insertarRegistroTransaccional(
      'MOVIMIENTO_MATERIAL',
      {
        MATERIAL_ID: material.ID,
        TIPO_MOVIMIENTO: 'Entrada',
        CANTIDAD: 5,
        UNIDAD: material.UNIDAD,
        FECHA_MOVIMIENTO: new Date()
      },
      {dryRun: true}
    );

  if (
    !resultado ||
    resultado.ok !== true ||
    resultado.dryRun !== true
  ) {
    throw new Error(
      'ALTA_MOVIMIENTO_MATERIAL_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido'
    );
  }

  if (!/^MOV-\d{4}$/.test(resultado.id)) {
    throw new Error(
      'ALTA_MOVIMIENTO_MATERIAL_DRYRUN_TEST_ERROR: ID generado con formato inesperado: ' +
        resultado.id
    );
  }

  console.log(
    'OK dryRun_id_generado=' + resultado.id
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadMovimientoMaterialCantidadNoPositiva() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_MOV_001';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var material =
    listarRegistros(
      'MATERIAL',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!material) {
    throw new Error(
      'FUNC-MOV-001_TEST_ERROR: no existe un MATERIAL activo utilizable'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'MOVIMIENTO_MATERIAL'
    );

  var idTemporal = 'MOV-AUD-001';

  try {
    eliminarFilaPorIdIntegridad_(hoja, idTemporal);

    insertarFilaCrudaIntegridad_(
      hoja,
      {
        ID: idTemporal,
        MATERIAL_ID: material.ID,
        TIPO_MOVIMIENTO: 'Entrada',
        CANTIDAD: 0,
        UNIDAD: material.UNIDAD,
        FECHA_MOVIMIENTO: new Date(),
        ACTIVO: 'SÍ'
      }
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-MOV-001',
      'MOVIMIENTO_MATERIAL',
      idTemporal,
      1
    );

    console.log(
      'OK cantidad_no_positiva_detectada=true'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(hoja, idTemporal);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-MOV-001',
    'MOVIMIENTO_MATERIAL',
    idTemporal
  );

  console.log(
    'OK restauracion_completa=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadAltaEjecucionTareaDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_ALTA_EJECUCION_TAREA_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var tarea =
    listarRegistros(
      'TAREA',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!tarea) {
    throw new Error(
      'ALTA_EJECUCION_TAREA_DRYRUN_TEST_ERROR: no existe una TAREA activa utilizable'
    );
  }

  var resultado =
    insertarRegistroTransaccional(
      'EJECUCION_TAREA',
      {
        TAREA_ID: tarea.ID,
        FECHA_INICIO: new Date(2035, 0, 1),
        FECHA_FIN: new Date(2035, 0, 3),
        ESTADO: 'Activa',
        RESULTADO: 'Exitosa'
      },
      {dryRun: true}
    );

  if (
    !resultado ||
    resultado.ok !== true ||
    resultado.dryRun !== true
  ) {
    throw new Error(
      'ALTA_EJECUCION_TAREA_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido'
    );
  }

  if (!/^EJT-\d{4}$/.test(resultado.id)) {
    throw new Error(
      'ALTA_EJECUCION_TAREA_DRYRUN_TEST_ERROR: ID generado con formato inesperado: ' +
        resultado.id
    );
  }

  console.log(
    'OK dryRun_id_generado=' + resultado.id
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadEjecucionTareaFechaFinAnteriorInicio() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_EJT_001';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var tarea =
    listarRegistros(
      'TAREA',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!tarea) {
    throw new Error(
      'FUNC-EJT-001_TEST_ERROR: no existe una TAREA activa utilizable'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'EJECUCION_TAREA'
    );

  var idTemporal = 'EJT-AUD-001';

  try {
    eliminarFilaPorIdIntegridad_(hoja, idTemporal);

    insertarFilaCrudaIntegridad_(
      hoja,
      {
        ID: idTemporal,
        TAREA_ID: tarea.ID,
        FECHA_INICIO: new Date(2035, 0, 10),
        FECHA_FIN: new Date(2035, 0, 5),
        ESTADO: 'Activa',
        ACTIVO: 'SÍ'
      }
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-EJT-001',
      'EJECUCION_TAREA',
      idTemporal,
      1
    );

    console.log(
      'OK fecha_fin_anterior_a_inicio_detectada=true'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(hoja, idTemporal);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-EJT-001',
    'EJECUCION_TAREA',
    idTemporal
  );

  console.log(
    'OK restauracion_completa=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadMetodoCalculoAvanceDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_METODO_CALCULO_AVANCE_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var procesoBase =
    listarRegistros(
      'PROCESO',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!procesoBase) {
    throw new Error(
      'METODO_CALCULO_AVANCE_DRYRUN_TEST_ERROR: no existe un PROCESO activo utilizable'
    );
  }

  var datosProceso = {};

  (CAMPOS_OBLIGATORIOS_MVP.PROCESO || [])
    .forEach(function (campo) {
      datosProceso[campo] = procesoBase[campo];
    });

  datosProceso.ORDEN_SECUENCIA = 9000 + Math.floor(Math.random() * 999);
  datosProceso.METODO_CALCULO_AVANCE = 'Manual';

  var resultadoProceso =
    insertarRegistroTransaccional(
      'PROCESO',
      datosProceso,
      {dryRun: true}
    );

  if (
    !resultadoProceso ||
    resultadoProceso.ok !== true ||
    resultadoProceso.dryRun !== true
  ) {
    throw new Error(
      'METODO_CALCULO_AVANCE_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido para PROCESO'
    );
  }

  console.log(
    'OK PROCESO_dryRun_id=' + resultadoProceso.id
  );

  var tareaBase =
    listarRegistros(
      'TAREA',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!tareaBase) {
    throw new Error(
      'METODO_CALCULO_AVANCE_DRYRUN_TEST_ERROR: no existe una TAREA activa utilizable'
    );
  }

  var datosTarea = {};

  (CAMPOS_OBLIGATORIOS_MVP.TAREA || [])
    .forEach(function (campo) {
      datosTarea[campo] = tareaBase[campo];
    });

  datosTarea.ORDEN_SECUENCIA = 9000 + Math.floor(Math.random() * 999);
  datosTarea.METODO_CALCULO_AVANCE = 'Por estado';

  var resultadoTarea =
    insertarRegistroTransaccional(
      'TAREA',
      datosTarea,
      {dryRun: true}
    );

  if (
    !resultadoTarea ||
    resultadoTarea.ok !== true ||
    resultadoTarea.dryRun !== true
  ) {
    throw new Error(
      'METODO_CALCULO_AVANCE_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido para TAREA'
    );
  }

  console.log(
    'OK TAREA_dryRun_id=' + resultadoTarea.id
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadProcesoAvanceIncoherenteConEstado() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_PROCESO_004';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var proceso =
    listarRegistros(
      'PROCESO',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!proceso) {
    throw new Error(
      'FUNC-PROCESO-004_TEST_ERROR: no existe un PROCESO activo utilizable'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'PROCESO'
    );

  var valoresOriginales = {
    ESTADO: proceso.ESTADO || '',
    PORCENTAJE_AVANCE: proceso.PORCENTAJE_AVANCE
  };

  try {
    escribirCamposRegistroIntegridad_(
      hoja,
      proceso.ID,
      {
        ESTADO: 'Completado',
        PORCENTAJE_AVANCE: 40
      }
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-PROCESO-004',
      'PROCESO',
      proceso.ID,
      1
    );

    console.log(
      'OK avance_incoherente_detectado=true'
    );

  } finally {
    escribirCamposRegistroIntegridad_(
      hoja,
      proceso.ID,
      valoresOriginales
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-PROCESO-004',
    'PROCESO',
    proceso.ID
  );

  console.log(
    'OK restauracion_completa=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadTareaAvanceIncoherenteConEstado() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_TAREA_014';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var tarea =
    listarRegistros(
      'TAREA',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!tarea) {
    throw new Error(
      'FUNC-TAREA-014_TEST_ERROR: no existe una TAREA activa utilizable'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'TAREA'
    );

  var valoresOriginales = {
    ESTADO: tarea.ESTADO || '',
    PORCENTAJE_AVANCE: tarea.PORCENTAJE_AVANCE
  };

  try {
    escribirCamposRegistroIntegridad_(
      hoja,
      tarea.ID,
      {
        ESTADO: 'Pendiente',
        PORCENTAJE_AVANCE: 30
      }
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-TAREA-014',
      'TAREA',
      tarea.ID,
      1
    );

    console.log(
      'OK avance_incoherente_detectado=true'
    );

  } finally {
    escribirCamposRegistroIntegridad_(
      hoja,
      tarea.ID,
      valoresOriginales
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-TAREA-014',
    'TAREA',
    tarea.ID
  );

  console.log(
    'OK restauracion_completa=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadCatalogoTipoVinculoIncidenciaAmpliado() {
  var packageName =
    'PROBAR_INTEGRIDAD_CATALOGO_TIPO_VINCULO_INCIDENCIA';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var tiposVinculo =
    obtenerCatalogo('CFG_TIPO_VINCULO');

  var esperados = [
    'Contexto', 'Evidencia', 'Resultado', 'Manual', 'Tutorial',
    'Acta', 'Referencia', 'Aprobación', 'Bloquea', 'Relacionada',
    'Detectada en', 'Causada por', 'Corrige', 'Verifica', 'Previene'
  ];

  esperados.forEach(function (valor) {
    if (tiposVinculo.indexOf(valor) === -1) {
      throw new Error(
        'CATALOGO_TIPO_VINCULO_INCIDENCIA_TEST_ERROR: falta "' +
          valor +
          '" en CFG_TIPO_VINCULO (valores actuales: ' +
          tiposVinculo.join(', ') +
          ')'
      );
    }
  });

  console.log(
    'OK CFG_TIPO_VINCULO_completo=true valores=' + tiposVinculo.length
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadAltaProveedorMaterialDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_ALTA_PROVEEDOR_MATERIAL_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var proveedor =
    listarRegistros(
      'PROVEEDOR',
      {ACTIVO: 'SÍ'}
    )[0];

  var material =
    listarRegistros(
      'MATERIAL',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!proveedor) {
    throw new Error(
      'ALTA_PROVEEDOR_MATERIAL_DRYRUN_TEST_ERROR: no existe un PROVEEDOR activo utilizable'
    );
  }

  if (!material) {
    throw new Error(
      'ALTA_PROVEEDOR_MATERIAL_DRYRUN_TEST_ERROR: no existe un MATERIAL activo utilizable'
    );
  }

  var resultado =
    insertarRegistroTransaccional(
      'PROVEEDOR_MATERIAL',
      {
        PROVEEDOR_ID: proveedor.ID,
        MATERIAL_ID: material.ID,
        PRECIO_UNITARIO: 9.5,
        PLAZO_ENTREGA_DIAS: 3,
        ES_PREFERENTE: 'NO',
        ESTADO: 'Activa'
      },
      {dryRun: true}
    );

  if (
    !resultado ||
    resultado.ok !== true ||
    resultado.dryRun !== true
  ) {
    throw new Error(
      'ALTA_PROVEEDOR_MATERIAL_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido'
    );
  }

  console.log('OK dryRun_id=' + resultado.id);

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadProveedorMaterialDuplicadoRechazado() {
  var packageName =
    'PROBAR_INTEGRIDAD_PROVEEDOR_MATERIAL_DUPLICADO_RECHAZADO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var existente =
    listarRegistros(
      'PROVEEDOR_MATERIAL',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!existente) {
    console.log(
      'OK sin_registros_activos_para_probar_duplicado=true (se omite: requiere al menos un PROVEEDOR_MATERIAL real dado de alta)'
    );
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=OK'
    );
    return true;
  }

  var lanzoError = false;

  try {
    guardarFormulario(
      'PROVEEDOR_MATERIAL',
      '',
      {
        PROVEEDOR_ID: existente.PROVEEDOR_ID,
        MATERIAL_ID: existente.MATERIAL_ID,
        PRECIO_UNITARIO: 1,
        PLAZO_ENTREGA_DIAS: 1,
        ES_PREFERENTE: 'NO',
        ESTADO: existente.ESTADO
      },
      null
    );
  } catch (error) {
    lanzoError = true;
    console.log('OK duplicado_rechazado_mensaje=' + error.message);
  }

  if (!lanzoError) {
    throw new Error(
      'PROVEEDOR_MATERIAL_DUPLICADO_TEST_ERROR: guardarFormulario no rechazó la combinación PROVEEDOR_ID/MATERIAL_ID ya existente (' +
        existente.PROVEEDOR_ID + '/' + existente.MATERIAL_ID + ')'
    );
  }

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadCatalogosRolPersonaYAsignacionAmpliados() {
  var packageName =
    'PROBAR_INTEGRIDAD_CATALOGOS_ROL_PERSONA_Y_ASIGNACION_AMPLIADOS';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var rolesPersona = obtenerCatalogo('CFG_ROL_PERSONA');

  var esperadosRolPersona = [
    'Coordinación', 'Producción', 'Diseño', 'Logística',
    'Administración', 'Voluntariado', 'Otra'
  ];

  esperadosRolPersona.forEach(function (valor) {
    if (rolesPersona.indexOf(valor) === -1) {
      throw new Error(
        'CATALOGO_ROL_PERSONA_TEST_ERROR: falta "' + valor + '" en CFG_ROL_PERSONA (valores actuales: ' + rolesPersona.join(', ') + ')'
      );
    }
  });

  console.log('OK CFG_ROL_PERSONA_completo=true valores=' + rolesPersona.length);

  var rolesAsignacion = obtenerCatalogo('CFG_ROL_ASIGNACION');

  var esperadosRolAsignacion = [
    'Responsable', 'Colaborador', 'Supervisor', 'Apoyo',
    'Ejecutor', 'Consultado', 'Informado', 'Coordinador', 'Validador'
  ];

  esperadosRolAsignacion.forEach(function (valor) {
    if (rolesAsignacion.indexOf(valor) === -1) {
      throw new Error(
        'CATALOGO_ROL_ASIGNACION_TEST_ERROR: falta "' + valor + '" en CFG_ROL_ASIGNACION (valores actuales: ' + rolesAsignacion.join(', ') + ')'
      );
    }
  });

  console.log('OK CFG_ROL_ASIGNACION_completo=true valores=' + rolesAsignacion.length);

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadAltaEquipoMiembroDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_ALTA_EQUIPO_MIEMBRO_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var personasActivas =
    listarRegistros(
      'PERSONA_EQUIPO',
      {ACTIVO: 'SÍ'}
    );

  if (personasActivas.length === 0) {
    throw new Error(
      'ALTA_EQUIPO_MIEMBRO_DRYRUN_TEST_ERROR: no existe ningún PERSONA_EQUIPO activo utilizable'
    );
  }

  var equipo = personasActivas[0];
  var miembro = personasActivas[1] || personasActivas[0];

  var resultado =
    insertarRegistroTransaccional(
      'EQUIPO_MIEMBRO',
      {
        EQUIPO_ID: equipo.ID,
        MIEMBRO_ID: miembro.ID,
        ROL_EN_EQUIPO: 'Miembro',
        FECHA_ALTA: new Date(),
        ESTADO: 'Activa'
      },
      {dryRun: true}
    );

  if (
    !resultado ||
    resultado.ok !== true ||
    resultado.dryRun !== true
  ) {
    throw new Error(
      'ALTA_EQUIPO_MIEMBRO_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido'
    );
  }

  console.log('OK dryRun_id=' + resultado.id);

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadEquipoMiembroDuplicadoRechazado() {
  var packageName =
    'PROBAR_INTEGRIDAD_EQUIPO_MIEMBRO_DUPLICADO_RECHAZADO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var existente =
    listarRegistros(
      'EQUIPO_MIEMBRO',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!existente) {
    console.log(
      'OK sin_registros_activos_para_probar_duplicado=true (se omite: requiere al menos un EQUIPO_MIEMBRO real dado de alta)'
    );
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=OK'
    );
    return true;
  }

  var lanzoError = false;

  try {
    guardarFormulario(
      'EQUIPO_MIEMBRO',
      '',
      {
        EQUIPO_ID: existente.EQUIPO_ID,
        MIEMBRO_ID: existente.MIEMBRO_ID,
        ROL_EN_EQUIPO: 'Duplicado de prueba',
        ESTADO: existente.ESTADO
      },
      null
    );
  } catch (error) {
    lanzoError = true;
    console.log('OK duplicado_rechazado_mensaje=' + error.message);
  }

  if (!lanzoError) {
    throw new Error(
      'EQUIPO_MIEMBRO_DUPLICADO_TEST_ERROR: guardarFormulario no rechazó la combinación EQUIPO_ID/MIEMBRO_ID ya existente (' +
        existente.EQUIPO_ID + '/' + existente.MIEMBRO_ID + ')'
    );
  }

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadCatalogosRecursoAmpliados() {
  var packageName =
    'PROBAR_INTEGRIDAD_CATALOGOS_RECURSO_AMPLIADOS';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var comprobaciones = [
    {
      catalogo: 'CFG_CLASE_RECURSO',
      esperados: ['Herramienta', 'Maquinaria', 'Equipo auxiliar', 'Espacio']
    },
    {
      catalogo: 'CFG_CATEGORIA_RECURSO',
      esperados: [
        'Herramienta manual', 'Herramienta eléctrica', 'Útil o plantilla',
        'Maquinaria fija', 'Equipo informático', 'Equipo de protección',
        'Espacio productivo', 'Espacio de almacenamiento',
        'Espacio formativo', 'Espacio polivalente', 'Otro'
      ]
    },
    {
      catalogo: 'CFG_ESTADO_RECURSO_FISICO',
      esperados: ['Disponible', 'En uso', 'En mantenimiento', 'Averiado', 'De baja']
    },
    {
      catalogo: 'CFG_TIPO_USO_RECURSO',
      esperados: ['Utiliza', 'Reserva', 'Ocupa', 'Requiere']
    }
  ];

  comprobaciones.forEach(function (comprobacion) {
    var valores = obtenerCatalogo(comprobacion.catalogo);

    comprobacion.esperados.forEach(function (valor) {
      if (valores.indexOf(valor) === -1) {
        throw new Error(
          'CATALOGO_RECURSO_TEST_ERROR: falta "' + valor + '" en ' + comprobacion.catalogo +
            ' (valores actuales: ' + valores.join(', ') + ')'
        );
      }
    });

    console.log('OK ' + comprobacion.catalogo + '_completo=true valores=' + valores.length);
  });

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadAltaRecursoDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_ALTA_RECURSO_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var resultado =
    insertarRegistroTransaccional(
      'RECURSO',
      {
        CODIGO: 'REC-TEST-' + new Date().getTime(),
        NOMBRE: 'Sierra de mesa de prueba',
        CLASE_RECURSO: 'Maquinaria',
        CATEGORIA_RECURSO: 'Maquinaria fija',
        ESTADO: 'Disponible'
      },
      {dryRun: true}
    );

  if (
    !resultado ||
    resultado.ok !== true ||
    resultado.dryRun !== true
  ) {
    throw new Error(
      'ALTA_RECURSO_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido'
    );
  }

  console.log('OK dryRun_id=' + resultado.id);

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadAltaTareaRecursoDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_ALTA_TAREA_RECURSO_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var tarea =
    listarRegistros(
      'TAREA',
      {ACTIVO: 'SÍ'}
    )[0];

  var recurso =
    listarRegistros(
      'RECURSO',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!tarea) {
    throw new Error(
      'ALTA_TAREA_RECURSO_DRYRUN_TEST_ERROR: no existe ninguna TAREA activa utilizable'
    );
  }

  if (!recurso) {
    console.log(
      'OK sin_recurso_activo_para_probar=true (se omite: requiere al menos un RECURSO real dado de alta)'
    );
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=OK'
    );
    return true;
  }

  var resultado =
    insertarRegistroTransaccional(
      'TAREA_RECURSO',
      {
        TAREA_ID: tarea.ID,
        RECURSO_ID: recurso.ID,
        TIPO_USO: 'Utiliza',
        ESTADO: 'Planificada'
      },
      {dryRun: true}
    );

  if (
    !resultado ||
    resultado.ok !== true ||
    resultado.dryRun !== true
  ) {
    throw new Error(
      'ALTA_TAREA_RECURSO_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido'
    );
  }

  console.log('OK dryRun_id=' + resultado.id);

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadTareaRecursoDuplicadoRechazado() {
  var packageName =
    'PROBAR_INTEGRIDAD_TAREA_RECURSO_DUPLICADO_RECHAZADO';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var existente =
    listarRegistros(
      'TAREA_RECURSO',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!existente) {
    console.log(
      'OK sin_registros_activos_para_probar_duplicado=true (se omite: requiere al menos un TAREA_RECURSO real dado de alta)'
    );
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=OK'
    );
    return true;
  }

  var lanzoError = false;

  try {
    guardarFormulario(
      'TAREA_RECURSO',
      '',
      {
        TAREA_ID: existente.TAREA_ID,
        RECURSO_ID: existente.RECURSO_ID,
        TIPO_USO: existente.TIPO_USO,
        ESTADO: existente.ESTADO
      },
      null
    );
  } catch (error) {
    lanzoError = true;
    console.log('OK duplicado_rechazado_mensaje=' + error.message);
  }

  if (!lanzoError) {
    throw new Error(
      'TAREA_RECURSO_DUPLICADO_TEST_ERROR: guardarFormulario no rechazó la combinación TAREA_ID/RECURSO_ID ya existente (' +
        existente.TAREA_ID + '/' + existente.RECURSO_ID + ')'
    );
  }

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


/*
 * Bug real detectado al probar VINCULO Recurso->Documento (VIN-0003,
 * ENTIDAD_DESTINO_ID="D"): el buscador de FK solo extrae el ID del
 * texto escrito sin comprobar que exista de verdad. Estas dos pruebas
 * cubren el arreglo (validarClavesForaneasFormulario_ en Formularios.js):
 * 1) un ID inventado debe rechazarse al crear.
 * 2) editar un registro existente SIN tocar sus FK no debe romperse
 *    (evita bloquear ediciones por referencias antiguas ya desactivadas).
 */
function probarIntegridadRechazoClaveForaneaInexistente() {
  var packageName =
    'PROBAR_INTEGRIDAD_RECHAZO_CLAVE_FORANEA_INEXISTENTE';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var recurso =
    listarRegistros(
      'RECURSO',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!recurso) {
    throw new Error(
      'RECHAZO_CLAVE_FORANEA_TEST_ERROR: no existe ningún RECURSO activo utilizable'
    );
  }

  var lanzoError = false;

  try {
    guardarFormulario(
      'VINCULO',
      '',
      {
        ENTIDAD_ORIGEN_TIPO: 'Recurso',
        ENTIDAD_ORIGEN_ID: recurso.ID,
        ENTIDAD_DESTINO_TIPO: 'Documento',
        ENTIDAD_DESTINO_ID: 'DOC-9999-INEXISTENTE',
        TIPO_VINCULO: 'Evidencia',
        ESTADO: 'Planificada'
      },
      null
    );
  } catch (error) {
    lanzoError = true;
    console.log('OK clave_foranea_inexistente_rechazada_mensaje=' + error.message);
  }

  if (!lanzoError) {
    throw new Error(
      'RECHAZO_CLAVE_FORANEA_TEST_ERROR: guardarFormulario no rechazó un ENTIDAD_DESTINO_ID inexistente'
    );
  }

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadEdicionSinCambiarClaveForaneaNoSeRompe() {
  var packageName =
    'PROBAR_INTEGRIDAD_EDICION_SIN_CAMBIAR_CLAVE_FORANEA_NO_SE_ROMPE';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var vinculo =
    listarRegistros(
      'VINCULO',
      {ACTIVO: 'SÍ'}
    ).filter(function (v) {
      return v.ENTIDAD_ORIGEN_TIPO !== 'Recurso';
    })[0];

  if (!vinculo) {
    throw new Error(
      'EDICION_SIN_CAMBIAR_CLAVE_FORANEA_TEST_ERROR: no existe ningún VINCULO activo válido utilizable'
    );
  }

  guardarFormulario(
    'VINCULO',
    vinculo.ID,
    {
      ENTIDAD_ORIGEN_TIPO: vinculo.ENTIDAD_ORIGEN_TIPO,
      ENTIDAD_ORIGEN_ID: vinculo.ENTIDAD_ORIGEN_ID,
      ENTIDAD_DESTINO_TIPO: vinculo.ENTIDAD_DESTINO_TIPO,
      ENTIDAD_DESTINO_ID: vinculo.ENTIDAD_DESTINO_ID,
      TIPO_VINCULO: vinculo.TIPO_VINCULO,
      ESTADO: vinculo.ESTADO,
      OBSERVACIONES: vinculo.OBSERVACIONES || ''
    },
    null
  );

  console.log('OK edicion_sin_cambios_de_fk_no_lanzo_error=true id=' + vinculo.ID);

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadCatalogosPedidoRecepcionAmpliados() {
  var packageName =
    'PROBAR_INTEGRIDAD_CATALOGOS_PEDIDO_RECEPCION_AMPLIADOS';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var comprobaciones = [
    {
      catalogo: 'CFG_ESTADO_PEDIDO_PROVEEDOR',
      esperados: ['Borrador', 'Enviado', 'Confirmado', 'Recibido parcial', 'Recibido completo', 'Cancelado']
    },
    {
      catalogo: 'CFG_ESTADO_RECEPCION',
      esperados: ['Borrador', 'Confirmada', 'Cancelada']
    }
  ];

  comprobaciones.forEach(function (comprobacion) {
    var valores = obtenerCatalogo(comprobacion.catalogo);

    comprobacion.esperados.forEach(function (valor) {
      if (valores.indexOf(valor) === -1) {
        throw new Error(
          'CATALOGO_PEDIDO_RECEPCION_TEST_ERROR: falta "' + valor + '" en ' + comprobacion.catalogo +
            ' (valores actuales: ' + valores.join(', ') + ')'
        );
      }
    });

    console.log('OK ' + comprobacion.catalogo + '_completo=true valores=' + valores.length);
  });

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadAltaPedidoProveedorDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_ALTA_PEDIDO_PROVEEDOR_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var proveedor =
    listarRegistros(
      'PROVEEDOR',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!proveedor) {
    throw new Error(
      'ALTA_PEDIDO_PROVEEDOR_DRYRUN_TEST_ERROR: no existe ningún PROVEEDOR activo utilizable'
    );
  }

  var resultado =
    insertarRegistroTransaccional(
      'PEDIDO_PROVEEDOR',
      {
        PROVEEDOR_ID: proveedor.ID,
        FECHA_PEDIDO: new Date(),
        ESTADO: 'Borrador'
      },
      {dryRun: true}
    );

  if (
    !resultado ||
    resultado.ok !== true ||
    resultado.dryRun !== true
  ) {
    throw new Error(
      'ALTA_PEDIDO_PROVEEDOR_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido'
    );
  }

  console.log('OK dryRun_id=' + resultado.id);

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadAltaPedidoProveedorLineaDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_ALTA_PEDIDO_PROVEEDOR_LINEA_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var pedido =
    listarRegistros(
      'PEDIDO_PROVEEDOR',
      {ACTIVO: 'SÍ'}
    )[0];

  var material =
    listarRegistros(
      'MATERIAL',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!pedido || !material) {
    console.log(
      'OK sin_pedido_o_material_activo_para_probar=true (se omite: requiere al menos un PEDIDO_PROVEEDOR y un MATERIAL reales)'
    );
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=OK'
    );
    return true;
  }

  var resultado =
    insertarRegistroTransaccional(
      'PEDIDO_PROVEEDOR_LINEA',
      {
        PEDIDO_PROVEEDOR_ID: pedido.ID,
        MATERIAL_ID: material.ID,
        CANTIDAD_PEDIDA: 10,
        PRECIO_UNITARIO: 2.5,
        UNIDAD: material.UNIDAD,
        ESTADO: 'Activa'
      },
      {dryRun: true}
    );

  if (
    !resultado ||
    resultado.ok !== true ||
    resultado.dryRun !== true
  ) {
    throw new Error(
      'ALTA_PEDIDO_PROVEEDOR_LINEA_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido'
    );
  }

  console.log('OK dryRun_id=' + resultado.id);

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadAltaRecepcionDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_ALTA_RECEPCION_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var pedido =
    listarRegistros(
      'PEDIDO_PROVEEDOR',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!pedido) {
    console.log(
      'OK sin_pedido_activo_para_probar=true (se omite: requiere al menos un PEDIDO_PROVEEDOR real)'
    );
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=OK'
    );
    return true;
  }

  var resultado =
    insertarRegistroTransaccional(
      'RECEPCION',
      {
        PEDIDO_PROVEEDOR_ID: pedido.ID,
        FECHA_RECEPCION: new Date(),
        ESTADO: 'Borrador'
      },
      {dryRun: true}
    );

  if (
    !resultado ||
    resultado.ok !== true ||
    resultado.dryRun !== true
  ) {
    throw new Error(
      'ALTA_RECEPCION_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido'
    );
  }

  console.log('OK dryRun_id=' + resultado.id);

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadAltaRecepcionLineaDryRun() {
  var packageName =
    'PROBAR_INTEGRIDAD_ALTA_RECEPCION_LINEA_DRYRUN';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var recepcion =
    listarRegistros(
      'RECEPCION',
      {ACTIVO: 'SÍ'}
    )[0];

  var material =
    listarRegistros(
      'MATERIAL',
      {ACTIVO: 'SÍ'}
    )[0];

  if (!recepcion || !material) {
    console.log(
      'OK sin_recepcion_o_material_activo_para_probar=true (se omite: requiere al menos una RECEPCION y un MATERIAL reales)'
    );
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=OK'
    );
    return true;
  }

  var resultado =
    insertarRegistroTransaccional(
      'RECEPCION_LINEA',
      {
        RECEPCION_ID: recepcion.ID,
        MATERIAL_ID: material.ID,
        CANTIDAD_RECIBIDA: 10,
        UNIDAD: material.UNIDAD,
        ESTADO: 'Activa'
      },
      {dryRun: true}
    );

  if (
    !resultado ||
    resultado.ok !== true ||
    resultado.dryRun !== true
  ) {
    throw new Error(
      'ALTA_RECEPCION_LINEA_DRYRUN_TEST_ERROR: dryRun no devolvió un resultado válido'
    );
  }

  console.log('OK dryRun_id=' + resultado.id);

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function parseFechaIntegridad_(
  valor
) {
  var fecha =
    valor instanceof Date
      ? new Date(valor.getTime())
      : new Date(valor);

  return fecha;
}


function probarIntegridadSolapamientoTemporalTareaResponsable() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_REC_002';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var asignaciones =
    listarRegistros(
      'TAREA_RESPONSABLE',
      {ACTIVO: 'SÍ'}
    ).filter(function (registro) {
      if (
        ['Planificada', 'Activa']
          .indexOf(registro.ESTADO) === -1 ||
        String(
          registro.PERSONA_EQUIPO_ID || ''
        ).trim() === ''
      ) {
        return false;
      }

      var inicio =
        parseFechaIntegridad_(
          registro.FECHA_INICIO_ASIGNACION
        );

      var fin =
        parseFechaIntegridad_(
          registro.FECHA_FIN_ASIGNACION
        );

      return (
        !isNaN(inicio.getTime()) &&
        !isNaN(fin.getTime())
      );
    });

  if (asignaciones.length === 0) {
    throw new Error(
      'FUNC-REC-002_TEST_ERROR: no existe asignación activa o planificada con fechas de asignación válidas'
    );
  }

  var base =
    asignaciones[0];

  var personaId =
    String(
      base.PERSONA_EQUIPO_ID
    ).trim();

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'TAREA_RESPONSABLE'
    );

  var idTemporal =
    'TRE-AUD-FUNC-REC-002';

  try {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    insertarFilaCrudaIntegridad_(
      hoja,
      Object.assign(
        {},
        base,
        {
          ID:
            idTemporal,

          ESTADO:
            'Activa',

          ACTIVO:
            'SÍ'
        }
      )
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-REC-002',
      'PERSONA_EQUIPO',
      personaId,
      1
    );

    console.log(
      'OK asignacion_solapada_temporal_insertada=true'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-REC-002',
    'PERSONA_EQUIPO',
    personaId
  );

  console.log(
    'OK asignacion_temporal_restaurada=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadPersonaInactivaConAsignacionActiva() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_REC_003';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var personasPorId_ = {};

  listarRegistros(
    'PERSONA_EQUIPO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (persona) {
    personasPorId_[persona.ID] = persona;
  });

  var asignacion =
    listarRegistros(
      'TAREA_RESPONSABLE',
      {ACTIVO: 'SÍ'}
    ).filter(function (registro) {
      var persona =
        personasPorId_[registro.PERSONA_EQUIPO_ID];

      return (
        ['Planificada', 'Activa']
          .indexOf(registro.ESTADO) !== -1 &&
        persona &&
        persona.ESTADO !== 'Inactivo'
      );
    })[0];

  if (!asignacion) {
    throw new Error(
      'FUNC-REC-003_TEST_ERROR: no existe asignación activa con persona no Inactiva'
    );
  }

  var persona =
    personasPorId_[asignacion.PERSONA_EQUIPO_ID];

  ejecutarPruebaIntegridadMutacion_({
    packageName:
      packageName,

    codigo:
      'FUNC-REC-003',

    entidad:
      'TAREA_RESPONSABLE',

    entidadMutada:
      'PERSONA_EQUIPO',

    registro:
      persona,

    registroIdEsperado:
      asignacion.ID,

    mutaciones: {
      ESTADO: 'Inactivo'
    }
  });

  return true;
}


function probarIntegridadCapacidadSemanalInsuficiente() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_REC_004';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var tareasPorId_ = {};

  listarRegistros(
    'TAREA',
    {ACTIVO: 'SÍ'}
  ).forEach(function (tarea) {
    tareasPorId_[tarea.ID] = tarea;
  });

  var personasPorId_ = {};

  listarRegistros(
    'PERSONA_EQUIPO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (persona) {
    personasPorId_[persona.ID] = persona;
  });

  var asignaciones =
    listarRegistros(
      'TAREA_RESPONSABLE',
      {ACTIVO: 'SÍ'}
    ).filter(function (registro) {
      if (
        ['Planificada', 'Activa']
          .indexOf(registro.ESTADO) === -1
      ) {
        return false;
      }

      var tarea =
        tareasPorId_[registro.TAREA_ID];

      var persona =
        personasPorId_[registro.PERSONA_EQUIPO_ID];

      return (
        tarea &&
        Number(tarea.DURACION_PREVISTA_DIAS) > 0 &&
        persona &&
        Number(persona.CAPACIDAD_SEMANAL_DIAS) > 0
      );
    });

  if (asignaciones.length === 0) {
    throw new Error(
      'FUNC-REC-004_TEST_ERROR: no existe asignación con tarea y persona con duración/capacidad válidas'
    );
  }

  var base =
    asignaciones[0];

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'TAREA_RESPONSABLE'
    );

  var idTemporal =
    'TRE-AUD-FUNC-REC-004';

  var ahora =
    new Date();

  var finVentanaCorta =
    new Date(
      ahora.getTime() +
        6 * 60 * 60 * 1000
    );

  try {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    insertarFilaCrudaIntegridad_(
      hoja,
      Object.assign(
        {},
        base,
        {
          ID:
            idTemporal,

          FECHA_INICIO_ASIGNACION:
            ahora,

          FECHA_FIN_ASIGNACION:
            finVentanaCorta,

          PORCENTAJE_DEDICACION:
            100,

          ESTADO:
            'Activa',

          ACTIVO:
            'SÍ'
        }
      )
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-REC-004',
      'TAREA_RESPONSABLE',
      idTemporal,
      1
    );

    console.log(
      'OK asignacion_densidad_temporal_insertada=true'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-REC-004',
    'TAREA_RESPONSABLE',
    idTemporal
  );

  console.log(
    'OK asignacion_temporal_restaurada=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadSobrecargaPorPeriodo() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_REC_005';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var asignaciones =
    listarRegistros(
      'TAREA_RESPONSABLE',
      {ACTIVO: 'SÍ'}
    ).filter(function (registro) {
      if (
        ['Planificada', 'Activa']
          .indexOf(registro.ESTADO) === -1 ||
        String(
          registro.PERSONA_EQUIPO_ID || ''
        ).trim() === ''
      ) {
        return false;
      }

      var inicio =
        parseFechaIntegridad_(
          registro.FECHA_INICIO_ASIGNACION
        );

      var fin =
        parseFechaIntegridad_(
          registro.FECHA_FIN_ASIGNACION
        );

      return (
        !isNaN(inicio.getTime()) &&
        !isNaN(fin.getTime())
      );
    });

  if (asignaciones.length === 0) {
    throw new Error(
      'FUNC-REC-005_TEST_ERROR: no existe asignación activa o planificada con fechas de asignación válidas'
    );
  }

  var base =
    asignaciones[0];

  var personaId =
    String(
      base.PERSONA_EQUIPO_ID
    ).trim();

  var baseInicio =
    parseFechaIntegridad_(
      base.FECHA_INICIO_ASIGNACION
    ).getTime();

  var baseFin =
    parseFechaIntegridad_(
      base.FECHA_FIN_ASIGNACION
    ).getTime();

  var totalCohorteSolapada =
    asignaciones
      .filter(function (registro) {
        if (
          String(
            registro.PERSONA_EQUIPO_ID || ''
          ).trim() !== personaId
        ) {
          return false;
        }

        var inicio =
          parseFechaIntegridad_(
            registro.FECHA_INICIO_ASIGNACION
          ).getTime();

        var fin =
          parseFechaIntegridad_(
            registro.FECHA_FIN_ASIGNACION
          ).getTime();

        return (
          baseInicio <= fin &&
          inicio <= baseFin
        );
      })
      .reduce(function (total, registro) {
        return (
          total +
          (
            Number(
              registro.PORCENTAJE_DEDICACION
            ) || 0
          )
        );
      }, 0);

  var porcentajeTemporal =
    Math.max(
      1,
      101 - totalCohorteSolapada
    );

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'TAREA_RESPONSABLE'
    );

  var idTemporal =
    'TRE-AUD-FUNC-REC-005';

  try {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    insertarFilaCrudaIntegridad_(
      hoja,
      Object.assign(
        {},
        base,
        {
          ID:
            idTemporal,

          FECHA_INICIO_ASIGNACION:
            base.FECHA_INICIO_ASIGNACION,

          FECHA_FIN_ASIGNACION:
            base.FECHA_FIN_ASIGNACION,

          PORCENTAJE_DEDICACION:
            porcentajeTemporal,

          ESTADO:
            'Activa',

          ACTIVO:
            'SÍ'
        }
      )
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-REC-005',
      'PERSONA_EQUIPO',
      personaId,
      1
    );

    console.log(
      'OK carga_solapada_temporal=' +
        (
          totalCohorteSolapada +
          porcentajeTemporal
        )
    );

  } finally {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-REC-005',
    'PERSONA_EQUIPO',
    personaId
  );

  console.log(
    'OK asignacion_temporal_restaurada=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function probarIntegridadProyectoInicioAnteriorCampana() {
  var campanasPorId_ = {};

  listarRegistros(
    'CAMPANA',
    {ACTIVO: 'SÍ'}
  ).forEach(function (campana) {
    campanasPorId_[campana.ID] = campana;
  });

  var proyecto =
    listarRegistros(
      'PROYECTO',
      {ACTIVO: 'SÍ'}
    ).filter(function (registro) {
      var campana =
        campanasPorId_[registro.CAMPANA_ID];

      if (!campana) {
        return false;
      }

      var inicioCampana =
        parseFechaIntegridad_(campana.FECHA_INICIO_PLAN);

      return !isNaN(inicioCampana.getTime());
    })[0];

  if (!proyecto) {
    throw new Error(
      'FUNC-JER-001_TEST_ERROR: no existe un proyecto activo con campana activa de fecha valida'
    );
  }

  var campana =
    campanasPorId_[proyecto.CAMPANA_ID];

  var inicioCampana =
    parseFechaIntegridad_(campana.FECHA_INICIO_PLAN);

  var fechaAnterior =
    new Date(
      inicioCampana.getTime() - 86400000
    );

  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_JER_001',

    codigo:
      'FUNC-JER-001',

    entidad:
      'PROYECTO',

    registro:
      proyecto,

    mutaciones: {
      FECHA_INICIO_PLAN: fechaAnterior
    }
  });
}


function probarIntegridadProyectoFinPosteriorCampana() {
  var campanasPorId_ = {};

  listarRegistros(
    'CAMPANA',
    {ACTIVO: 'SÍ'}
  ).forEach(function (campana) {
    campanasPorId_[campana.ID] = campana;
  });

  var proyecto =
    listarRegistros(
      'PROYECTO',
      {ACTIVO: 'SÍ'}
    ).filter(function (registro) {
      var campana =
        campanasPorId_[registro.CAMPANA_ID];

      if (!campana) {
        return false;
      }

      var finCampana =
        parseFechaIntegridad_(campana.FECHA_FIN_PLAN);

      return !isNaN(finCampana.getTime());
    })[0];

  if (!proyecto) {
    throw new Error(
      'FUNC-JER-002_TEST_ERROR: no existe un proyecto activo con campana activa de fecha valida'
    );
  }

  var campana =
    campanasPorId_[proyecto.CAMPANA_ID];

  var finCampana =
    parseFechaIntegridad_(campana.FECHA_FIN_PLAN);

  var fechaPosterior =
    new Date(
      finCampana.getTime() + 86400000
    );

  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_JER_002',

    codigo:
      'FUNC-JER-002',

    entidad:
      'PROYECTO',

    registro:
      proyecto,

    mutaciones: {
      FECHA_FIN_PLAN: fechaPosterior
    }
  });
}


function probarIntegridadCampanaCerradaConProyectoActivo() {
  var proyectosPorCampana_ = {};

  listarRegistros(
    'PROYECTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (proyecto) {
    if (
      ESTADOS_CIERRE_PROYECTO_.indexOf(proyecto.ESTADO) !== -1
    ) {
      return;
    }

    var campanaId =
      String(proyecto.CAMPANA_ID || '').trim();

    if (!campanaId) {
      return;
    }

    if (!proyectosPorCampana_[campanaId]) {
      proyectosPorCampana_[campanaId] = [];
    }

    proyectosPorCampana_[campanaId].push(proyecto);
  });

  var campana =
    listarRegistros(
      'CAMPANA',
      {ACTIVO: 'SÍ'}
    ).filter(function (registro) {
      return (
        ESTADOS_CIERRE_CAMPANA_.indexOf(registro.ESTADO) === -1 &&
        (proyectosPorCampana_[registro.ID] || []).length > 0
      );
    })[0];

  if (!campana) {
    throw new Error(
      'FUNC-JER-003_TEST_ERROR: no existe una campana no cerrada con proyecto activo no cerrado'
    );
  }

  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_JER_003',

    codigo:
      'FUNC-JER-003',

    entidad:
      'CAMPANA',

    registro:
      campana,

    mutaciones: {
      ESTADO: 'Completada'
    }
  });
}


function probarIntegridadProyectoProductoCerradoConProductoActivo() {
  var proyectosPorId_ = {};

  listarRegistros(
    'PROYECTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (proyecto) {
    proyectosPorId_[proyecto.ID] = proyecto;
  });

  var productosPorId_ = {};

  listarRegistros(
    'PRODUCTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (producto) {
    productosPorId_[producto.ID] = producto;
  });

  var relacion =
    listarRegistros(
      'PROYECTO_PRODUCTO',
      {ACTIVO: 'SÍ'}
    ).filter(function (registro) {
      var proyecto =
        proyectosPorId_[registro.PROYECTO_ID];

      var producto =
        productosPorId_[registro.PRODUCTO_ID];

      return (
        proyecto &&
        producto &&
        ESTADOS_CIERRE_PROYECTO_.indexOf(proyecto.ESTADO) === -1 &&
        ESTADOS_CIERRE_PRODUCTO_.indexOf(producto.ESTADO) === -1
      );
    })[0];

  if (!relacion) {
    throw new Error(
      'FUNC-JER-004_TEST_ERROR: no existe una relacion PROYECTO_PRODUCTO con proyecto y producto no cerrados'
    );
  }

  var proyecto =
    proyectosPorId_[relacion.PROYECTO_ID];

  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_JER_004',

    codigo:
      'FUNC-JER-004',

    entidadMutada:
      'PROYECTO',

    entidad:
      'PROYECTO_PRODUCTO',

    registro:
      proyecto,

    registroIdEsperado:
      relacion.ID,

    mutaciones: {
      ESTADO: 'Completado'
    }
  });
}


function probarIntegridadProductoCerradoConProcesoActivo() {
  var procesosPorProducto_ = {};

  listarRegistros(
    'PROCESO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (proceso) {
    if (
      ESTADOS_CIERRE_PROCESO_JERARQUIA_.indexOf(proceso.ESTADO) !== -1
    ) {
      return;
    }

    var productoId =
      String(proceso.PRODUCTO_ID || '').trim();

    if (!productoId) {
      return;
    }

    if (!procesosPorProducto_[productoId]) {
      procesosPorProducto_[productoId] = [];
    }

    procesosPorProducto_[productoId].push(proceso);
  });

  var producto =
    listarRegistros(
      'PRODUCTO',
      {ACTIVO: 'SÍ'}
    ).filter(function (registro) {
      return (
        ESTADOS_CIERRE_PRODUCTO_.indexOf(registro.ESTADO) === -1 &&
        (procesosPorProducto_[registro.ID] || []).length > 0
      );
    })[0];

  if (!producto) {
    throw new Error(
      'FUNC-JER-005_TEST_ERROR: no existe un producto no cerrado con proceso activo no cerrado'
    );
  }

  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_JER_005',

    codigo:
      'FUNC-JER-005',

    entidad:
      'PRODUCTO',

    registro:
      producto,

    mutaciones: {
      ESTADO: 'Completado'
    }
  });
}


function probarIntegridadProcesoFinPosteriorProductoRequerido() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_JER_006';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var productosPorId_ = {};

  listarRegistros(
    'PRODUCTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (producto) {
    productosPorId_[producto.ID] = producto;
  });

  var proceso =
    listarRegistros(
      'PROCESO',
      {ACTIVO: 'SÍ'}
    ).filter(function (registro) {
      return Boolean(
        productosPorId_[registro.PRODUCTO_ID]
      );
    })[0];

  if (!proceso) {
    throw new Error(
      'FUNC-JER-006_TEST_ERROR: no existe un proceso activo con producto activo vinculado'
    );
  }

  var producto =
    productosPorId_[proceso.PRODUCTO_ID];

  var hojaProcesos =
    obtenerHojaEntidadPruebaIntegridad_(
      'PROCESO'
    );

  var hojaProductos =
    obtenerHojaEntidadPruebaIntegridad_(
      'PRODUCTO'
    );

  var filaProceso =
    buscarFilaPorIdIntegridad_(
      hojaProcesos,
      proceso.ID
    );

  var filaProducto =
    buscarFilaPorIdIntegridad_(
      hojaProductos,
      producto.ID
    );

  var columnaFinProceso =
    obtenerMapaCabecerasIntegridad_(
      hojaProcesos
    ).mapa.FECHA_FIN_PLAN;

  var columnaRequeridaProducto =
    obtenerMapaCabecerasIntegridad_(
      hojaProductos
    ).mapa.FECHA_REQUERIDA;

  var celdaFinProceso =
    hojaProcesos.getRange(
      filaProceso,
      columnaFinProceso
    );

  var celdaRequeridaProducto =
    hojaProductos.getRange(
      filaProducto,
      columnaRequeridaProducto
    );

  var valorOriginalFinProceso =
    celdaFinProceso.getValue();

  var valorOriginalRequeridaProducto =
    celdaRequeridaProducto.getValue();

  var requeridaProducto = new Date();

  var finPosterior =
    new Date(
      requeridaProducto.getTime() + 86400000
    );

  try {
    celdaRequeridaProducto.setValue(
      requeridaProducto
    );

    celdaFinProceso.setValue(
      finPosterior
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-JER-006',
      'PROCESO',
      proceso.ID,
      1
    );

    console.log(
      'OK hallazgo_detectado=FUNC-JER-006'
    );

  } finally {
    celdaFinProceso.setValue(
      valorOriginalFinProceso
    );

    celdaRequeridaProducto.setValue(
      valorOriginalRequeridaProducto
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-JER-006',
    'PROCESO',
    proceso.ID
  );

  console.log(
    'OK registros_restaurados=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}


function probarIntegridadRelacionFechaRequeridaAnteriorProyecto() {
  var proyectosPorId_ = {};

  listarRegistros(
    'PROYECTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (proyecto) {
    proyectosPorId_[proyecto.ID] = proyecto;
  });

  var relacion =
    listarRegistros(
      'PROYECTO_PRODUCTO',
      {ACTIVO: 'SÍ'}
    ).filter(function (registro) {
      var proyecto =
        proyectosPorId_[registro.PROYECTO_ID];

      if (!proyecto) {
        return false;
      }

      var inicioProyecto =
        parseFechaIntegridad_(proyecto.FECHA_INICIO_PLAN);

      return !isNaN(inicioProyecto.getTime());
    })[0];

  if (!relacion) {
    throw new Error(
      'FUNC-JER-007_TEST_ERROR: no existe una relacion PROYECTO_PRODUCTO con proyecto de FECHA_INICIO_PLAN valida'
    );
  }

  var proyecto =
    proyectosPorId_[relacion.PROYECTO_ID];

  var inicioProyecto =
    parseFechaIntegridad_(proyecto.FECHA_INICIO_PLAN);

  var fechaAnterior =
    new Date(
      inicioProyecto.getTime() - 86400000
    );

  ejecutarPruebaIntegridadMutacion_({
    packageName:
      'PROBAR_INTEGRIDAD_FUNC_JER_007',

    codigo:
      'FUNC-JER-007',

    entidad:
      'PROYECTO_PRODUCTO',

    registro:
      relacion,

    mutaciones: {
      FECHA_REQUERIDA: fechaAnterior
    }
  });
}


function construirDocumentoPruebaIntegridad_(
  idTemporal,
  overrides
) {
  return Object.assign(
    {
      ID: idTemporal,
      ENTIDAD_TIPO: 'Tarea',
      ENTIDAD_ID: 'TAR-0001',
      TIPO_DOCUMENTO: 'Informe',
      TITULO: 'AUDITORIA DOCUMENTO ' + idTemporal,
      DESCRIPCION: '',
      VERSION: '1.0',
      URL: 'https://ejemplo.local/documento',
      ESTADO: 'Borrador',
      FECHA_DOCUMENTO: '',
      OBSERVACIONES: '',
      ACTIVO: 'SÍ'
    },
    overrides || {}
  );
}


function probarIntegridadDocumentoEntidadIdHuerfano() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_DOC_001';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'DOCUMENTO'
    );

  var idTemporal =
    'DOC-AUD-FUNC-DOC-001';

  try {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    insertarFilaCrudaIntegridad_(
      hoja,
      construirDocumentoPruebaIntegridad_(
        idTemporal,
        {
          ENTIDAD_TIPO: 'Tarea',
          ENTIDAD_ID: 'TAR-INEXISTENTE-DOC'
        }
      )
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-DOC-001',
      'DOCUMENTO',
      idTemporal,
      1
    );

    console.log(
      'OK hallazgo_detectado=FUNC-DOC-001'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-DOC-001',
    'DOCUMENTO',
    idTemporal
  );

  console.log(
    'OK fila_temporal_restaurada=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}


function probarIntegridadDocumentoReferenciaInactiva() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_DOC_002';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var padreInactivo =
    listarRegistros(
      'PROYECTO',
      {ACTIVO: 'NO'}
    )[0];

  if (!padreInactivo) {
    throw new Error(
      'FUNC-DOC-002_TEST_ERROR: no existe un PROYECTO inactivo utilizable'
    );
  }

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'DOCUMENTO'
    );

  var idTemporal =
    'DOC-AUD-FUNC-DOC-002';

  try {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    insertarFilaCrudaIntegridad_(
      hoja,
      construirDocumentoPruebaIntegridad_(
        idTemporal,
        {
          ENTIDAD_TIPO: 'Proyecto',
          ENTIDAD_ID: padreInactivo.ID
        }
      )
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-DOC-002',
      'DOCUMENTO',
      idTemporal,
      1
    );

    console.log(
      'OK hallazgo_detectado=FUNC-DOC-002'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-DOC-002',
    'DOCUMENTO',
    idTemporal
  );

  console.log(
    'OK fila_temporal_restaurada=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}


function probarIntegridadDocumentoDobleVigente() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_DOC_003';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'DOCUMENTO'
    );

  var idA =
    'DOC-AUD-FUNC-DOC-003-A';

  var idB =
    'DOC-AUD-FUNC-DOC-003-B';

  try {
    eliminarFilaPorIdIntegridad_(hoja, idA);
    eliminarFilaPorIdIntegridad_(hoja, idB);

    insertarFilaCrudaIntegridad_(
      hoja,
      construirDocumentoPruebaIntegridad_(
        idA,
        {ESTADO: 'Vigente', VERSION: '1.0'}
      )
    );

    insertarFilaCrudaIntegridad_(
      hoja,
      construirDocumentoPruebaIntegridad_(
        idB,
        {ESTADO: 'Vigente', VERSION: '2.0'}
      )
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-DOC-003',
      'DOCUMENTO',
      idA,
      1
    );

    assertHallazgoIntegridad_(
      'FUNC-DOC-003',
      'DOCUMENTO',
      idB,
      1
    );

    console.log(
      'OK hallazgo_detectado=FUNC-DOC-003'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(hoja, idA);
    eliminarFilaPorIdIntegridad_(hoja, idB);

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-DOC-003',
    'DOCUMENTO',
    idA
  );

  assertSinHallazgoIntegridad_(
    'FUNC-DOC-003',
    'DOCUMENTO',
    idB
  );

  console.log(
    'OK filas_temporales_restauradas=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}


function probarIntegridadDocumentoDuplicadoExacto() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_DOC_004';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'DOCUMENTO'
    );

  var idA =
    'DOC-AUD-FUNC-DOC-004-A';

  var idB =
    'DOC-AUD-FUNC-DOC-004-B';

  try {
    eliminarFilaPorIdIntegridad_(hoja, idA);
    eliminarFilaPorIdIntegridad_(hoja, idB);

    insertarFilaCrudaIntegridad_(
      hoja,
      construirDocumentoPruebaIntegridad_(
        idA,
        {VERSION: '1.0'}
      )
    );

    insertarFilaCrudaIntegridad_(
      hoja,
      construirDocumentoPruebaIntegridad_(
        idB,
        {VERSION: '1.0'}
      )
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-DOC-004',
      'DOCUMENTO',
      idA,
      1
    );

    assertHallazgoIntegridad_(
      'FUNC-DOC-004',
      'DOCUMENTO',
      idB,
      1
    );

    console.log(
      'OK hallazgo_detectado=FUNC-DOC-004'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(hoja, idA);
    eliminarFilaPorIdIntegridad_(hoja, idB);

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-DOC-004',
    'DOCUMENTO',
    idA
  );

  assertSinHallazgoIntegridad_(
    'FUNC-DOC-004',
    'DOCUMENTO',
    idB
  );

  console.log(
    'OK filas_temporales_restauradas=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}


function probarIntegridadDocumentoVersionInvalida() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_DOC_005';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'DOCUMENTO'
    );

  var idTemporal =
    'DOC-AUD-FUNC-DOC-005';

  try {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    insertarFilaCrudaIntegridad_(
      hoja,
      construirDocumentoPruebaIntegridad_(
        idTemporal,
        {VERSION: 'version-x'}
      )
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-DOC-005',
      'DOCUMENTO',
      idTemporal,
      1
    );

    console.log(
      'OK hallazgo_detectado=FUNC-DOC-005'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-DOC-005',
    'DOCUMENTO',
    idTemporal
  );

  console.log(
    'OK fila_temporal_restaurada=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}


function probarIntegridadDocumentoUrlInvalida() {
  var packageName =
    'PROBAR_INTEGRIDAD_FUNC_DOC_006';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      'DOCUMENTO'
    );

  var idTemporal =
    'DOC-AUD-FUNC-DOC-006';

  try {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    insertarFilaCrudaIntegridad_(
      hoja,
      construirDocumentoPruebaIntegridad_(
        idTemporal,
        {URL: 'no-es-una-url'}
      )
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      'FUNC-DOC-006',
      'DOCUMENTO',
      idTemporal,
      1
    );

    console.log(
      'OK hallazgo_detectado=FUNC-DOC-006'
    );

  } finally {
    eliminarFilaPorIdIntegridad_(
      hoja,
      idTemporal
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    'FUNC-DOC-006',
    'DOCUMENTO',
    idTemporal
  );

  console.log(
    'OK fila_temporal_restaurada=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' result=OK'
  );

  return true;
}


/**
 * Ejecuta una prueba basada en mutación temporal de un registro.
 */
function ejecutarPruebaIntegridadMutacion_(
  config
) {
  var packageName =
    config.packageName;

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var entidadMutada =
    config.entidadMutada ||
    config.entidad;

  var registro =
    config.registro ||
    config.seleccionarRegistro();

  if (
    !registro ||
    !registro.ID
  ) {
    throw new Error(
      packageName +
      ': no se encontró registro de prueba'
    );
  }

  var registroIdEsperado =
    config.registroIdEsperado ||
    registro.ID;

  var hoja =
    obtenerHojaEntidadPruebaIntegridad_(
      entidadMutada
    );

  var copiaOriginal =
    copiarRegistroIntegridad_(
      registro
    );

  try {
    escribirCamposRegistroIntegridad_(
      hoja,
      registro.ID,
      config.mutaciones
    );

    SpreadsheetApp.flush();

    assertHallazgoIntegridad_(
      config.codigo,
      config.entidad,
      registroIdEsperado,
      1
    );

    console.log(
      'OK hallazgo_detectado=' +
        config.codigo
    );

  } finally {
    restaurarRegistroIntegridad_(
      hoja,
      copiaOriginal
    );

    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_(
    config.codigo,
    config.entidad,
    registroIdEsperado
  );

  console.log(
    'OK registro_restaurado=' +
      registro.ID
  );

  console.log(
    'OK integridad_regla_restaurada=true'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return true;
}


function seleccionarPrimerRegistroActivo_(
  entidad
) {
  var registros =
    listarRegistros(
      entidad,
      {ACTIVO: 'SÍ'}
    );

  if (registros.length === 0) {
    throw new Error(
      'TEST_INTEGRIDAD_ERROR: no existen registros activos para ' +
        entidad
    );
  }

  return registros[0];
}


function assertHallazgoIntegridad_(
  codigo,
  entidad,
  registroId,
  minimoEsperado
) {
  var reporte =
    obtenerReporteIntegridad();

  var hallazgos =
    concatenarHallazgosFuncionales_(
      reporte
    ).filter(function (hallazgo) {
      return (
        hallazgo.codigo === codigo &&
        hallazgo.entidad === entidad &&
        String(
          hallazgo.registroId || ''
        ) === String(
          registroId || ''
        )
      );
    });

  console.log(
    'OK codigo=' +
      codigo +
      ' entidad=' +
      entidad +
      ' registro_id=' +
      registroId +
      ' hallazgos=' +
      hallazgos.length
  );

  if (
    hallazgos.length <
    (
      minimoEsperado || 1
    )
  ) {
    throw new Error(
      codigo +
      ' no detectó el hallazgo esperado para ' +
      entidad +
      ' ' +
      registroId
    );
  }

  return hallazgos;
}


function assertSinHallazgoIntegridad_(
  codigo,
  entidad,
  registroId
) {
  var reporte =
    obtenerReporteIntegridad();

  var persiste =
    concatenarHallazgosFuncionales_(
      reporte
    ).some(function (hallazgo) {
      return (
        hallazgo.codigo === codigo &&
        hallazgo.entidad === entidad &&
        String(
          hallazgo.registroId || ''
        ) === String(
          registroId || ''
        )
      );
    });

  if (persiste) {
    throw new Error(
      codigo +
      ' persiste después de restaurar ' +
      entidad +
      ' ' +
      registroId
    );
  }

  return true;
}


function concatenarHallazgosFuncionales_(
  reporte
) {
  var funcional =
    reporte &&
    reporte.funcional
      ? reporte.funcional
      : {};

  return []
    .concat(
      funcional.errores || []
    )
    .concat(
      funcional.advertencias || []
    )
    .concat(
      funcional.informacion || []
    );
}


function obtenerHojaEntidadPruebaIntegridad_(
  entidad
) {
  if (
    !ENTIDADES_MVP ||
    !ENTIDADES_MVP[entidad]
  ) {
    throw new Error(
      'TEST_INTEGRIDAD_ERROR: entidad no configurada ' +
        entidad
    );
  }

  var nombreHoja =
    ENTIDADES_MVP[entidad].hoja;

  var hoja =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        nombreHoja
      );

  if (!hoja) {
    throw new Error(
      'TEST_INTEGRIDAD_ERROR: no existe hoja ' +
        nombreHoja
    );
  }

  return hoja;
}


function copiarRegistroIntegridad_(
  registro
) {
  var copia = {};

  Object.keys(registro)
    .forEach(function (campo) {
      var valor =
        registro[campo];

      copia[campo] =
        valor instanceof Date
          ? new Date(
              valor.getTime()
            )
          : valor;
    });

  return copia;
}


function obtenerMapaCabecerasIntegridad_(
  hoja
) {
  var cabeceras =
    hoja
      .getRange(
        1,
        1,
        1,
        hoja.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function (valor) {
        return String(
          valor || ''
        ).trim();
      });

  var mapa = {};

  cabeceras.forEach(
    function (cabecera, indice) {
      mapa[cabecera] =
        indice + 1;
    }
  );

  return {
    cabeceras:
      cabeceras,

    mapa:
      mapa
  };
}


function buscarFilaPorIdIntegridad_(
  hoja,
  id
) {
  var estructura =
    obtenerMapaCabecerasIntegridad_(
      hoja
    );

  var columnaId =
    estructura.mapa.ID;

  if (!columnaId) {
    throw new Error(
      'TEST_INTEGRIDAD_ERROR: no existe columna ID en ' +
        hoja.getName()
    );
  }

  var ultimaFila =
    hoja.getLastRow();

  if (ultimaFila < 2) {
    return null;
  }

  var ids =
    hoja
      .getRange(
        2,
        columnaId,
        ultimaFila - 1,
        1
      )
      .getDisplayValues();

  var idBuscado =
    String(id).trim();

  for (
    var indice = 0;
    indice < ids.length;
    indice++
  ) {
    if (
      String(
        ids[indice][0] || ''
      ).trim() === idBuscado
    ) {
      return indice + 2;
    }
  }

  return null;
}


function escribirCamposRegistroIntegridad_(
  hoja,
  id,
  cambios
) {
  var fila =
    buscarFilaPorIdIntegridad_(
      hoja,
      id
    );

  if (!fila) {
    throw new Error(
      'TEST_INTEGRIDAD_ERROR: no existe registro ' +
        id +
        ' en ' +
        hoja.getName()
    );
  }

  var estructura =
    obtenerMapaCabecerasIntegridad_(
      hoja
    );

  Object.keys(cambios)
    .forEach(function (campo) {
      var columna =
        estructura.mapa[campo];

      if (!columna) {
        throw new Error(
          'TEST_INTEGRIDAD_ERROR: no existe campo ' +
            campo +
            ' en ' +
            hoja.getName()
        );
      }

      hoja
        .getRange(
          fila,
          columna
        )
        .setValue(
          cambios[campo]
        );
    });
}


function restaurarRegistroIntegridad_(
  hoja,
  registroOriginal
) {
  var fila =
    buscarFilaPorIdIntegridad_(
      hoja,
      registroOriginal.ID
    );

  if (!fila) {
    throw new Error(
      'TEST_INTEGRIDAD_ERROR: no se puede restaurar ' +
        registroOriginal.ID
    );
  }

  var estructura =
    obtenerMapaCabecerasIntegridad_(
      hoja
    );

  estructura.cabeceras
    .forEach(function (campo, indice) {
      if (
        Object.prototype
          .hasOwnProperty.call(
            registroOriginal,
            campo
          )
      ) {
        hoja
          .getRange(
            fila,
            indice + 1
          )
          .setValue(
            registroOriginal[campo]
          );
      }
    });
}


function insertarFilaCrudaIntegridad_(
  hoja,
  registro
) {
  var estructura =
    obtenerMapaCabecerasIntegridad_(
      hoja
    );

  var fila =
    estructura.cabeceras
      .map(function (campo) {
        return Object.prototype
          .hasOwnProperty.call(
            registro,
            campo
          )
          ? registro[campo]
          : '';
      });

  hoja.appendRow(fila);

  return hoja.getLastRow();
}


function eliminarFilaPorIdIntegridad_(
  hoja,
  id
) {
  var fila =
    buscarFilaPorIdIntegridad_(
      hoja,
      id
    );

  if (fila) {
    hoja.deleteRow(fila);
  }
}


function mostrarReporteIntegridadEnLog() {
  var packageName =
    'MOSTRAR_REPORTE_INTEGRIDAD_EN_LOG';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName
  );

  var reporte =
    obtenerReporteIntegridad();

  console.log(
    JSON.stringify(
      reporte,
      null,
      2
    )
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' result=OK'
  );

  return reporte;
}

function auditarFaseB01_DuplicidadProductoMaterial() {
  var packageName = 'F02_B01_DUPLICIDAD_PRODUCTO_MATERIAL';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaProducto = ss.getSheetByName('03_PRODUCTOS');
  var hojaMaterial = ss.getSheetByName('08_MATERIALES');
  var hojaRelacion = ss.getSheetByName('09_PRODUCTO_MATERIAL');
  var sufijo = String(Date.now());
  var producto = null;
  var material = null;
  var relacionInicial = null;
  var relacionDuplicada = null;
  var errorDuplicidad = null;
  var errorFinal = null;

  Logger.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  try {
    if (!hojaProducto || !hojaMaterial || !hojaRelacion) {
      throw new Error('F02_B01_ERROR: faltan una o más hojas requeridas');
    }

    producto = insertarRegistroTransaccional('PRODUCTO', {
      CODIGO: 'AUD-B01-PRD-' + sufijo,
      NOMBRE: 'AUD B01 producto temporal',
      ORIGEN: 'Producción propia',
      UNIDAD: 'Unidad',
      ESTADO: 'Borrador'
    }, {dryRun: false});

    Logger.log('OK producto_id=' + producto.id);

    material = insertarRegistroTransaccional('MATERIAL', {
      CODIGO: 'AUD-B01-MAT-' + sufijo,
      NOMBRE: 'AUD B01 material temporal',
      CATEGORIA: 'Madera',
      UNIDAD: 'Unidad',
      ESTADO: 'Disponible'
    }, {dryRun: false});

    Logger.log('OK material_id=' + material.id);

    relacionInicial = insertarRegistroTransaccional('PRODUCTO_MATERIAL', {
      PRODUCTO_ID: producto.id,
      MATERIAL_ID: material.id,
      CANTIDAD_PREVISTA: 5,
      UNIDAD: 'Unidad',
      ESTADO: 'Planificada'
    }, {dryRun: false});

    Logger.log('OK relacion_inicial_id=' + relacionInicial.id);

    try {
      relacionDuplicada = insertarRegistroTransaccional('PRODUCTO_MATERIAL', {
        PRODUCTO_ID: producto.id,
        MATERIAL_ID: material.id,
        CANTIDAD_PREVISTA: 3,
        UNIDAD: 'Unidad',
        ESTADO: 'Planificada'
      }, {dryRun: false});
    } catch (e) {
      errorDuplicidad = e;
    }

    if (relacionDuplicada && relacionDuplicada.id) {
      Logger.log('ERR duplicidad_aceptada=true relacion_duplicada_id=' + relacionDuplicada.id);
      errorFinal = new Error('F02_B01_NO_GO: el repositorio aceptó dos relaciones activas con el mismo PRODUCTO_ID y MATERIAL_ID');
    } else if (errorDuplicidad) {
      Logger.log('OK duplicidad_rechazada=true mensaje=' + errorDuplicidad.message);
    } else {
      Logger.log('ERR resultado_duplicidad_indeterminado=true');
      errorFinal = new Error('F02_B01_ERROR: resultado indeterminado al probar la duplicidad');
    }
  } catch (e) {
    Logger.log('ERR diagnostico=' + e.message);
    errorFinal = errorFinal || e;
  } finally {
    try {
      if (relacionDuplicada && relacionDuplicada.id) {
        eliminarRegistroPruebaPorId_(hojaRelacion, relacionDuplicada.id);
        Logger.log('OK limpieza_relacion_duplicada=' + relacionDuplicada.id);
      }

      if (relacionInicial && relacionInicial.id) {
        eliminarRegistroPruebaPorId_(hojaRelacion, relacionInicial.id);
        Logger.log('OK limpieza_relacion_inicial=' + relacionInicial.id);
      }

      if (producto && producto.id) {
        eliminarRegistroPruebaPorId_(hojaProducto, producto.id);
        Logger.log('OK limpieza_producto=' + producto.id);
      }

      if (material && material.id) {
        eliminarRegistroPruebaPorId_(hojaMaterial, material.id);
        Logger.log('OK limpieza_material=' + material.id);
      }
    } catch (eLimpieza) {
      Logger.log('ERR limpieza=' + eLimpieza.message);
      errorFinal = errorFinal || eLimpieza;
    }

    Logger.log(errorFinal ? 'NEXT reparar_validacion_preventiva_PRODUCTO_MATERIAL' : 'NEXT auditar_actualizacion_PRODUCTO_MATERIAL');
    Logger.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  }

  if (errorFinal) {
    throw errorFinal;
  }
}

function auditarFaseB02_ActualizacionProductoMaterial() {
  var packageName =
    'F02_B02_ACTUALIZACION_PRODUCTO_MATERIAL';

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var hojaProducto =
    ss.getSheetByName('03_PRODUCTOS');

  var hojaMaterial =
    ss.getSheetByName('08_MATERIALES');

  var hojaRelacion =
    ss.getSheetByName('09_PRODUCTO_MATERIAL');

  var sufijo = String(Date.now());

  var producto = null;
  var materialA = null;
  var materialB = null;
  var relacionA = null;
  var relacionB = null;

  var errorDuplicidad = null;
  var errorFinal = null;

  Logger.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  try {
    if (
      !hojaProducto ||
      !hojaMaterial ||
      !hojaRelacion
    ) {
      throw new Error(
        'F02_B02_ERROR: faltan hojas requeridas'
      );
    }

    producto =
      insertarRegistroTransaccional(
        'PRODUCTO',
        {
          CODIGO:
            'AUD-B02-PRD-' + sufijo,
          NOMBRE:
            'AUD B02 producto temporal',
          ORIGEN:
            'Producción propia',
          UNIDAD:
            'Unidad',
          ESTADO:
            'Borrador'
        },
        {
          origen: 'TEST'
        }
      );

    Logger.log(
      'OK producto_id=' + producto.id
    );

    materialA =
      insertarRegistroTransaccional(
        'MATERIAL',
        {
          CODIGO:
            'AUD-B02-MAT-A-' + sufijo,
          NOMBRE:
            'AUD B02 material A',
          CATEGORIA:
            'Madera',
          UNIDAD:
            'Unidad',
          ESTADO:
            'Disponible'
        },
        {
          origen: 'TEST'
        }
      );

    Logger.log(
      'OK material_a_id=' + materialA.id
    );

    materialB =
      insertarRegistroTransaccional(
        'MATERIAL',
        {
          CODIGO:
            'AUD-B02-MAT-B-' + sufijo,
          NOMBRE:
            'AUD B02 material B',
          CATEGORIA:
            'Madera',
          UNIDAD:
            'Unidad',
          ESTADO:
            'Disponible'
        },
        {
          origen: 'TEST'
        }
      );

    Logger.log(
      'OK material_b_id=' + materialB.id
    );

    relacionA =
      insertarRegistroTransaccional(
        'PRODUCTO_MATERIAL',
        {
          PRODUCTO_ID:
            producto.id,
          MATERIAL_ID:
            materialA.id,
          CANTIDAD_PREVISTA:
            5,
          UNIDAD:
            'Unidad',
          ESTADO:
            'Planificada'
        },
        {
          origen: 'TEST'
        }
      );

    Logger.log(
      'OK relacion_a_id=' + relacionA.id
    );

    relacionB =
      insertarRegistroTransaccional(
        'PRODUCTO_MATERIAL',
        {
          PRODUCTO_ID:
            producto.id,
          MATERIAL_ID:
            materialB.id,
          CANTIDAD_PREVISTA:
            3,
          UNIDAD:
            'Unidad',
          ESTADO:
            'Planificada'
        },
        {
          origen: 'TEST'
        }
      );

    Logger.log(
      'OK relacion_b_id=' + relacionB.id
    );

    actualizarRegistroTransaccional(
      'PRODUCTO_MATERIAL',
      relacionA.id,
      {
        CANTIDAD_PREVISTA: 7
      },
      {
        origen: 'TEST'
      }
    );

    var relacionAActualizada =
      obtenerRegistroPorId(
        'PRODUCTO_MATERIAL',
        relacionA.id
      );

    if (
      !relacionAActualizada ||
      Number(
        relacionAActualizada.CANTIDAD_PREVISTA
      ) !== 7
    ) {
      throw new Error(
        'F02_B02_NO_GO: ' +
        'la actualización propia no se aplicó'
      );
    }

    Logger.log(
      'OK actualizacion_propia_aceptada=true' +
      ' cantidad_prevista=7'
    );

    try {
      actualizarRegistroTransaccional(
        'PRODUCTO_MATERIAL',
        relacionB.id,
        {
          MATERIAL_ID: materialA.id
        },
        {
          origen: 'TEST'
        }
      );
    } catch (error) {
      errorDuplicidad = error;
    }

    if (!errorDuplicidad) {
      Logger.log(
        'ERR actualizacion_duplicada_aceptada=true'
      );

      errorFinal = new Error(
        'F02_B02_NO_GO: ' +
        'la actualización permitió duplicar ' +
        'PRODUCTO_ID/MATERIAL_ID'
      );
    } else {
      Logger.log(
        'OK actualizacion_duplicada_rechazada=true' +
        ' mensaje=' +
        errorDuplicidad.message
      );
    }

    var relacionBFinal =
      obtenerRegistroPorId(
        'PRODUCTO_MATERIAL',
        relacionB.id
      );

    if (
      !relacionBFinal ||
      String(
        relacionBFinal.MATERIAL_ID || ''
      ).trim() !== materialB.id
    ) {
      Logger.log(
        'ERR actualizacion_fallida_modifico_registro=true'
      );

      errorFinal =
        errorFinal ||
        new Error(
          'F02_B02_NO_GO: ' +
          'el rechazo dejó cambios parciales'
        );
    } else {
      Logger.log(
        'OK sin_cambios_parciales=true'
      );
    }
  } catch (errorGeneral) {
    Logger.log(
      'ERR diagnostico=' +
      errorGeneral.message
    );

    errorFinal =
      errorFinal ||
      errorGeneral;
  } finally {
    try {
      if (relacionB && relacionB.id) {
        eliminarRegistroPruebaPorId_(
          hojaRelacion,
          relacionB.id
        );

        Logger.log(
          'OK limpieza_relacion_b=' +
          relacionB.id
        );
      }

      if (relacionA && relacionA.id) {
        eliminarRegistroPruebaPorId_(
          hojaRelacion,
          relacionA.id
        );

        Logger.log(
          'OK limpieza_relacion_a=' +
          relacionA.id
        );
      }

      if (materialB && materialB.id) {
        eliminarRegistroPruebaPorId_(
          hojaMaterial,
          materialB.id
        );

        Logger.log(
          'OK limpieza_material_b=' +
          materialB.id
        );
      }

      if (materialA && materialA.id) {
        eliminarRegistroPruebaPorId_(
          hojaMaterial,
          materialA.id
        );

        Logger.log(
          'OK limpieza_material_a=' +
          materialA.id
        );
      }

      if (producto && producto.id) {
        eliminarRegistroPruebaPorId_(
          hojaProducto,
          producto.id
        );

        Logger.log(
          'OK limpieza_producto=' +
          producto.id
        );
      }
    } catch (errorLimpieza) {
      Logger.log(
        'ERR limpieza=' +
        errorLimpieza.message
      );

      errorFinal =
        errorFinal ||
        errorLimpieza;
    }

    Logger.log(
      errorFinal
        ? 'NEXT reparar_actualizacion_PRODUCTO_MATERIAL'
        : 'NEXT auditar_duplicidad_TAREA_MATERIAL'
    );

    Logger.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' status=' +
      (errorFinal ? 'NO_GO' : 'OK')
    );
  }

  if (errorFinal) {
    throw errorFinal;
  }
}

function auditarFaseB03_DuplicidadTareaMaterial() {
  var packageName = 'F02_B03_DUPLICIDAD_TAREA_MATERIAL';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaRelacion = ss.getSheetByName('10_TAREA_MATERIAL');

  var relacionInicial = null;
  var relacionDuplicada = null;
  var errorDuplicidad = null;
  var errorFinal = null;

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  try {
    if (!hojaRelacion) {
      throw new Error(
        'F02_B03_ERROR: no existe la hoja 10_TAREA_MATERIAL'
      );
    }

    var tareas = listarRegistros(
      'TAREA',
      {ACTIVO: 'SÍ'}
    );

    var materiales = listarRegistros(
      'MATERIAL',
      {ACTIVO: 'SÍ'}
    );

    var relacionesExistentes = listarRegistros(
      'TAREA_MATERIAL',
      {ACTIVO: 'SÍ'}
    );

    if (!tareas.length) {
      throw new Error(
        'F02_B03_ERROR: no existen tareas activas'
      );
    }

    if (!materiales.length) {
      throw new Error(
        'F02_B03_ERROR: no existen materiales activos'
      );
    }

    var combinacionesOcupadas = {};

    relacionesExistentes.forEach(
      function(relacion) {
        combinacionesOcupadas[
          String(relacion.TAREA_ID || '').trim() +
          '|' +
          String(relacion.MATERIAL_ID || '').trim()
        ] = true;
      }
    );

    var tareaSeleccionada = null;
    var materialSeleccionado = null;

    for (
      var i = 0;
      i < tareas.length && !tareaSeleccionada;
      i++
    ) {
      for (
        var j = 0;
        j < materiales.length;
        j++
      ) {
        var claveCombinacion =
          String(tareas[i].ID || '').trim() +
          '|' +
          String(materiales[j].ID || '').trim();

        if (!combinacionesOcupadas[claveCombinacion]) {
          tareaSeleccionada = tareas[i];
          materialSeleccionado = materiales[j];
          break;
        }
      }
    }

    if (
      !tareaSeleccionada ||
      !materialSeleccionado
    ) {
      throw new Error(
        'F02_B03_ERROR: no existe una combinación libre TAREA_ID/MATERIAL_ID'
      );
    }

    console.log(
      'OK tarea_id=' +
      tareaSeleccionada.ID
    );

    console.log(
      'OK material_id=' +
      materialSeleccionado.ID
    );

    var unidadMaterial = String(
      materialSeleccionado.UNIDAD || ''
    ).trim();

    if (!unidadMaterial) {
      throw new Error(
        'F02_B03_ERROR: el material seleccionado no tiene UNIDAD'
      );
    }

    relacionInicial =
      insertarRegistroTransaccional(
        'TAREA_MATERIAL',
        {
          TAREA_ID:
            tareaSeleccionada.ID,

          MATERIAL_ID:
            materialSeleccionado.ID,

          CANTIDAD_PREVISTA:
            5,

          CANTIDAD_CONSUMIDA:
            0,

          CANTIDAD_DESPERDICIADA:
            0,

          UNIDAD:
            unidadMaterial,

          ESTADO:
            'Activa',

          MOTIVO_DESVIACION:
            '',

          OBSERVACIONES:
            'AUDITORÍA F02 B03'
        },
        {
          origen: 'TEST'
        }
      );

    console.log(
      'OK relacion_inicial_id=' +
      relacionInicial.id
    );

    try {
      relacionDuplicada =
        insertarRegistroTransaccional(
          'TAREA_MATERIAL',
          {
            TAREA_ID:
              tareaSeleccionada.ID,

            MATERIAL_ID:
              materialSeleccionado.ID,

            CANTIDAD_PREVISTA:
              3,

            CANTIDAD_CONSUMIDA:
              0,

            CANTIDAD_DESPERDICIADA:
              0,

            UNIDAD:
              unidadMaterial,

            ESTADO:
              'Activa',

            MOTIVO_DESVIACION:
              '',

            OBSERVACIONES:
              'AUDITORÍA F02 B03 DUPLICADA'
          },
          {
            origen: 'TEST'
          }
        );
    } catch (error) {
      errorDuplicidad = error;
    }

    if (
      relacionDuplicada &&
      relacionDuplicada.id
    ) {
      console.log(
        'ERR duplicidad_aceptada=true' +
        ' relacion_duplicada_id=' +
        relacionDuplicada.id
      );

      errorFinal = new Error(
        'F02_B03_NO_GO: el repositorio aceptó dos relaciones activas con el mismo TAREA_ID y MATERIAL_ID'
      );
    } else if (errorDuplicidad) {
      console.log(
        'OK duplicidad_rechazada=true' +
        ' mensaje=' +
        errorDuplicidad.message
      );
    } else {
      console.log(
        'ERR resultado_duplicidad_indeterminado=true'
      );

      errorFinal = new Error(
        'F02_B03_ERROR: resultado indeterminado'
      );
    }
  } catch (errorGeneral) {
    console.log(
      'ERR diagnostico=' +
      errorGeneral.message
    );

    errorFinal =
      errorFinal ||
      errorGeneral;
  } finally {
    try {
      if (
        relacionDuplicada &&
        relacionDuplicada.id
      ) {
        eliminarRegistroPruebaPorId_(
          hojaRelacion,
          relacionDuplicada.id
        );

        console.log(
          'OK limpieza_relacion_duplicada=' +
          relacionDuplicada.id
        );
      }

      if (
        relacionInicial &&
        relacionInicial.id
      ) {
        eliminarRegistroPruebaPorId_(
          hojaRelacion,
          relacionInicial.id
        );

        console.log(
          'OK limpieza_relacion_inicial=' +
          relacionInicial.id
        );
      }
    } catch (errorLimpieza) {
      console.log(
        'ERR limpieza=' +
        errorLimpieza.message
      );

      errorFinal =
        errorFinal ||
        errorLimpieza;
    }

    console.log(
      errorFinal
        ? 'NEXT reparar_validacion_preventiva_TAREA_MATERIAL'
        : 'NEXT auditar_actualizacion_TAREA_MATERIAL'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' status=' +
      (errorFinal ? 'NO_GO' : 'OK')
    );
  }

  if (errorFinal) {
    throw errorFinal;
  }

  return true;
}

function auditarFaseB04_ActualizacionTareaMaterial() {
  var packageName = 'F02_B04_ACTUALIZACION_TAREA_MATERIAL';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaRelacion = ss.getSheetByName('10_TAREA_MATERIAL');

  var relacionA = null;
  var relacionB = null;
  var errorDuplicidad = null;
  var errorFinal = null;

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  try {
    if (!hojaRelacion) {
      throw new Error(
        'F02_B04_ERROR: no existe la hoja 10_TAREA_MATERIAL'
      );
    }

    var tareas = listarRegistros(
      'TAREA',
      { ACTIVO: 'SÍ' }
    );

    var materiales = listarRegistros(
      'MATERIAL',
      { ACTIVO: 'SÍ' }
    );

    var relaciones = listarRegistros(
      'TAREA_MATERIAL',
      { ACTIVO: 'SÍ' }
    );

    if (!tareas.length) {
      throw new Error(
        'F02_B04_ERROR: no existen tareas activas'
      );
    }

    if (materiales.length < 2) {
      throw new Error(
        'F02_B04_ERROR: se requieren al menos dos materiales activos'
      );
    }

    var ocupadas = {};

    relaciones.forEach(function(relacion) {
      ocupadas[
        String(relacion.TAREA_ID || '').trim() +
        '|' +
        String(relacion.MATERIAL_ID || '').trim()
      ] = true;
    });

    var tareaSeleccionada = null;
    var materialA = null;
    var materialB = null;

    for (
      var i = 0;
      i < tareas.length && !tareaSeleccionada;
      i++
    ) {
      var libres = [];

      for (var j = 0; j < materiales.length; j++) {
        var clave =
          String(tareas[i].ID || '').trim() +
          '|' +
          String(materiales[j].ID || '').trim();

        if (!ocupadas[clave]) {
          libres.push(materiales[j]);
        }
      }

      if (libres.length >= 2) {
        tareaSeleccionada = tareas[i];
        materialA = libres[0];
        materialB = libres[1];
      }
    }

    if (
      !tareaSeleccionada ||
      !materialA ||
      !materialB
    ) {
      throw new Error(
        'F02_B04_ERROR: no existe una tarea con dos combinaciones libres'
      );
    }

    console.log(
      'OK tarea_id=' + tareaSeleccionada.ID
    );

    console.log(
      'OK material_a_id=' + materialA.ID
    );

    console.log(
      'OK material_b_id=' + materialB.ID
    );

    relacionA = insertarRegistroTransaccional(
      'TAREA_MATERIAL',
      {
        TAREA_ID: tareaSeleccionada.ID,
        MATERIAL_ID: materialA.ID,
        CANTIDAD_PREVISTA: 5,
        CANTIDAD_CONSUMIDA: 0,
        CANTIDAD_DESPERDICIADA: 0,
        UNIDAD: materialA.UNIDAD,
        ESTADO: 'Activa',
        MOTIVO_DESVIACION: '',
        OBSERVACIONES: 'AUDITORÍA F02 B04 A'
      },
      {
        origen: 'TEST'
      }
    );

    console.log(
      'OK relacion_a_id=' + relacionA.id
    );

    relacionB = insertarRegistroTransaccional(
      'TAREA_MATERIAL',
      {
        TAREA_ID: tareaSeleccionada.ID,
        MATERIAL_ID: materialB.ID,
        CANTIDAD_PREVISTA: 3,
        CANTIDAD_CONSUMIDA: 0,
        CANTIDAD_DESPERDICIADA: 0,
        UNIDAD: materialB.UNIDAD,
        ESTADO: 'Activa',
        MOTIVO_DESVIACION: '',
        OBSERVACIONES: 'AUDITORÍA F02 B04 B'
      },
      {
        origen: 'TEST'
      }
    );

    console.log(
      'OK relacion_b_id=' + relacionB.id
    );

    actualizarRegistroTransaccional(
      'TAREA_MATERIAL',
      relacionA.id,
      {
        CANTIDAD_PREVISTA: 7
      },
      {
        origen: 'TEST'
      }
    );

    var relacionAActualizada = obtenerRegistroPorId(
      'TAREA_MATERIAL',
      relacionA.id
    );

    if (
      !relacionAActualizada ||
      Number(
        relacionAActualizada.CANTIDAD_PREVISTA
      ) !== 7
    ) {
      throw new Error(
        'F02_B04_NO_GO: la actualización propia no se aplicó'
      );
    }

    console.log(
      'OK actualizacion_propia_aceptada=true cantidad_prevista=7'
    );

    try {
      actualizarRegistroTransaccional(
        'TAREA_MATERIAL',
        relacionB.id,
        {
          MATERIAL_ID: materialA.ID,
          UNIDAD: materialA.UNIDAD
        },
        {
          origen: 'TEST'
        }
      );
    } catch (error) {
      errorDuplicidad = error;
    }

    if (!errorDuplicidad) {
      console.log(
        'ERR actualizacion_duplicada_aceptada=true'
      );

      errorFinal = new Error(
        'F02_B04_NO_GO: la actualización permitió duplicar TAREA_ID/MATERIAL_ID'
      );
    } else {
      console.log(
        'OK actualizacion_duplicada_rechazada=true mensaje=' +
        errorDuplicidad.message
      );
    }

    var relacionBFinal = obtenerRegistroPorId(
      'TAREA_MATERIAL',
      relacionB.id
    );

    if (
      !relacionBFinal ||
      String(
        relacionBFinal.MATERIAL_ID || ''
      ).trim() !== String(materialB.ID).trim()
    ) {
      console.log(
        'ERR actualizacion_fallida_modifico_registro=true'
      );

      errorFinal =
        errorFinal ||
        new Error(
          'F02_B04_NO_GO: el rechazo dejó cambios parciales'
        );
    } else {
      console.log(
        'OK sin_cambios_parciales=true'
      );
    }
  } catch (errorGeneral) {
    console.log(
      'ERR diagnostico=' +
      errorGeneral.message
    );

    errorFinal =
      errorFinal ||
      errorGeneral;
  } finally {
    try {
      if (relacionB && relacionB.id) {
        eliminarRegistroPruebaPorId_(
          hojaRelacion,
          relacionB.id
        );

        console.log(
          'OK limpieza_relacion_b=' +
          relacionB.id
        );
      }

      if (relacionA && relacionA.id) {
        eliminarRegistroPruebaPorId_(
          hojaRelacion,
          relacionA.id
        );

        console.log(
          'OK limpieza_relacion_a=' +
          relacionA.id
        );
      }
    } catch (errorLimpieza) {
      console.log(
        'ERR limpieza=' +
        errorLimpieza.message
      );

      errorFinal =
        errorFinal ||
        errorLimpieza;
    }

    console.log(
      errorFinal
        ? 'NEXT reparar_actualizacion_TAREA_MATERIAL'
        : 'NEXT auditar_coherencia_cantidades_materiales'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' status=' +
      (errorFinal ? 'NO_GO' : 'OK')
    );
  }

  if (errorFinal) {
    throw errorFinal;
  }

  return true;
}

function auditarFaseB05_MatrizPreventivaCantidadesTareaMaterial() {
  var packageName =
    'F02_B05_MATRIZ_PREVENTIVA_CANTIDADES_TAREA_MATERIAL';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  var errorFinal = null;

  try {
    var tareas =
      listarRegistros(
        'TAREA',
        {ACTIVO: 'SÍ'}
      );

    var materiales =
      listarRegistros(
        'MATERIAL',
        {ACTIVO: 'SÍ'}
      );

    var relaciones =
      listarRegistros(
        'TAREA_MATERIAL',
        {ACTIVO: 'SÍ'}
      );

    if (!tareas.length) {
      throw new Error(
        'F02_B05_ERROR: no existen tareas activas'
      );
    }

    if (!materiales.length) {
      throw new Error(
        'F02_B05_ERROR: no existen materiales activos'
      );
    }

    var ocupadas = {};

    relaciones.forEach(function(relacion) {
      ocupadas[
        String(relacion.TAREA_ID || '').trim() +
        '|' +
        String(relacion.MATERIAL_ID || '').trim()
      ] = true;
    });

    var tarea = null;
    var material = null;

    for (
      var i = 0;
      i < tareas.length && !tarea;
      i++
    ) {
      for (
        var j = 0;
        j < materiales.length;
        j++
      ) {
        var combinacion =
          String(tareas[i].ID || '').trim() +
          '|' +
          String(materiales[j].ID || '').trim();

        if (!ocupadas[combinacion]) {
          tarea = tareas[i];
          material = materiales[j];
          break;
        }
      }
    }

    if (!tarea || !material) {
      throw new Error(
        'F02_B05_ERROR: no existe una combinación libre TAREA_ID/MATERIAL_ID'
      );
    }

    var datosBase = {
      TAREA_ID: tarea.ID,
      MATERIAL_ID: material.ID,
      CANTIDAD_PREVISTA: 10,
      CANTIDAD_CONSUMIDA: 4,
      CANTIDAD_DESPERDICIADA: 1,
      UNIDAD: material.UNIDAD,
      ESTADO: 'Activa',
      MOTIVO_DESVIACION: '',
      OBSERVACIONES: 'AUDITORÍA F02 B05'
    };

    console.log(
      'OK tarea_id=' + tarea.ID
    );

    console.log(
      'OK material_id=' + material.ID
    );

    probarCasoB05_(
      'consumida_negativa',
      datosBase,
      {
        CANTIDAD_CONSUMIDA: -1
      },
      false,
      'CANTIDAD_CONSUMIDA'
    );

    probarCasoB05_(
      'desperdiciada_negativa',
      datosBase,
      {
        CANTIDAD_DESPERDICIADA: -1
      },
      false,
      'CANTIDAD_DESPERDICIADA'
    );

    probarCasoB05_(
      'desviacion_sin_motivo',
      datosBase,
      {
        CANTIDAD_CONSUMIDA: 9,
        CANTIDAD_DESPERDICIADA: 2,
        MOTIVO_DESVIACION: ''
      },
      false,
      'MOTIVO_DESVIACION'
    );

    probarCasoB05_(
      'desviacion_con_motivo',
      datosBase,
      {
        CANTIDAD_CONSUMIDA: 9,
        CANTIDAD_DESPERDICIADA: 2,
        MOTIVO_DESVIACION:
          'Rotura controlada durante producción'
      },
      true,
      ''
    );

    probarCasoB05_(
      'cantidades_dentro_prevision',
      datosBase,
      {
        CANTIDAD_CONSUMIDA: 8,
        CANTIDAD_DESPERDICIADA: 2,
        MOTIVO_DESVIACION: ''
      },
      true,
      ''
    );

    console.log(
      'OK matriz_preventiva_superada=true casos=5'
    );
  } catch (error) {
    console.log(
      'ERR diagnostico=' +
      error.message
    );

    errorFinal = error;
  }

  console.log(
    errorFinal
      ? 'NEXT reparar_coherencia_preventiva_cantidades'
      : 'NEXT auditar_cantidades_negativas_historicas'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' status=' +
    (errorFinal ? 'NO_GO' : 'OK')
  );

  if (errorFinal) {
    throw errorFinal;
  }

  return true;
}


function probarCasoB05_(
  nombre,
  datosBase,
  cambios,
  debeAceptar,
  fragmentoEsperado
) {
  var datos = {};

  Object.keys(datosBase).forEach(
    function(campo) {
      datos[campo] = datosBase[campo];
    }
  );

  Object.keys(cambios).forEach(
    function(campo) {
      datos[campo] = cambios[campo];
    }
  );

  var resultado = null;
  var errorCapturado = null;

  try {
    resultado =
      insertarRegistroTransaccional(
        'TAREA_MATERIAL',
        datos,
        {
          dryRun: true,
          origen: 'TEST'
        }
      );
  } catch (error) {
    errorCapturado = error;
  }

  if (debeAceptar) {
    if (errorCapturado) {
      console.log(
        'ERR caso=' +
        nombre +
        ' aceptacion_esperada=false mensaje=' +
        errorCapturado.message
      );

      throw new Error(
        'F02_B05_NO_GO: el caso ' +
        nombre +
        ' fue rechazado indebidamente'
      );
    }

    if (!resultado) {
      throw new Error(
        'F02_B05_ERROR: el caso ' +
        nombre +
        ' no devolvió resultado dryRun'
      );
    }

    console.log(
      'OK caso=' +
      nombre +
      ' aceptado=true'
    );

    return;
  }

  if (!errorCapturado) {
    console.log(
      'ERR caso=' +
      nombre +
      ' rechazado=false'
    );

    throw new Error(
      'F02_B05_NO_GO: el repositorio aceptó el caso inválido ' +
      nombre
    );
  }

  var mensaje = String(
    errorCapturado.message || ''
  );

  var normalizarTextoB05_ = function(valor) {
    var texto = String(valor || '')
      .trim()
      .toLowerCase();

    if (
      texto.normalize &&
      typeof texto.normalize === 'function'
    ) {
      texto = texto
        .normalize('NFD')
        .replace(
          /[\u0300-\u036f]/g,
          ''
        );
    }

    return texto
      .replace(/[_-]+/g, ' ')
      .replace(/\bde\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  var mensajeNormalizado =
    normalizarTextoB05_(
      mensaje
    );

  var fragmentoNormalizado =
    normalizarTextoB05_(
      fragmentoEsperado
    );

  if (
    fragmentoNormalizado &&
    mensajeNormalizado.indexOf(
      fragmentoNormalizado
    ) === -1
  ) {
    console.log(
      'ERR caso=' +
      nombre +
      ' error_distinto=' +
      mensaje +
      ' fragmento_esperado=' +
      fragmentoEsperado +
      ' mensaje_normalizado=' +
      mensajeNormalizado +
      ' fragmento_normalizado=' +
      fragmentoNormalizado
    );

    throw new Error(
      'F02_B05_NO_GO: el caso ' +
      nombre +
      ' falló por una causa distinta'
    );
  }

  console.log(
    'OK caso=' +
    nombre +
    ' rechazado=true mensaje=' +
    mensaje
  );
}

function auditarFaseB06_CantidadesNegativasHistoricas() {
  var packageName =
    'F02_B06_CANTIDADES_NEGATIVAS_HISTORICAS';

  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  var hoja =
    ss.getSheetByName(
      '10_TAREA_MATERIAL'
    );

  var filaObjetivo = null;
  var valoresOriginales = null;
  var cabeceras = null;
  var errorFinal = null;

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  try {
    if (!hoja) {
      throw new Error(
        'F02_B06_ERROR: no existe la hoja 10_TAREA_MATERIAL'
      );
    }

    var ultimaFila =
      hoja.getLastRow();

    var ultimaColumna =
      hoja.getLastColumn();

    if (ultimaFila < 2) {
      throw new Error(
        'F02_B06_ERROR: no existen registros en 10_TAREA_MATERIAL'
      );
    }

    cabeceras =
      hoja
        .getRange(
          1,
          1,
          1,
          ultimaColumna
        )
        .getDisplayValues()[0];

    var indiceId =
      cabeceras.indexOf('ID');

    var indiceConsumida =
      cabeceras.indexOf(
        'CANTIDAD_CONSUMIDA'
      );

    var indiceDesperdiciada =
      cabeceras.indexOf(
        'CANTIDAD_DESPERDICIADA'
      );

    var indiceActivo =
      cabeceras.indexOf('ACTIVO');

    if (
      indiceId === -1 ||
      indiceConsumida === -1 ||
      indiceDesperdiciada === -1
    ) {
      throw new Error(
        'F02_B06_ERROR: faltan columnas requeridas'
      );
    }

    var filas =
      hoja
        .getRange(
          2,
          1,
          ultimaFila - 1,
          ultimaColumna
        )
        .getValues();

    for (
      var i = 0;
      i < filas.length;
      i++
    ) {
      var activo =
        indiceActivo === -1
          ? 'SÍ'
          : String(
              filas[i][indiceActivo] || ''
            )
              .trim()
              .toUpperCase();

      if (activo !== 'NO') {
        filaObjetivo = i + 2;
        valoresOriginales =
          filas[i].slice();

        break;
      }
    }

    if (!filaObjetivo) {
      throw new Error(
        'F02_B06_ERROR: no existe una relación activa'
      );
    }

    var registroId = String(
      valoresOriginales[indiceId] || ''
    ).trim();

    console.log(
      'OK registro_id=' +
      registroId
    );

    hoja
      .getRange(
        filaObjetivo,
        indiceConsumida + 1
      )
      .setValue(-1);

    hoja
      .getRange(
        filaObjetivo,
        indiceDesperdiciada + 1
      )
      .setValue(-1);

    SpreadsheetApp.flush();

    console.log(
      'OK mutacion_directa_aplicada=true' +
      ' consumida=-1 desperdiciada=-1'
    );

    var reporte =
      obtenerReporteIntegridad();

    var errores =
      reporte &&
      reporte.funcional &&
      Array.isArray(
        reporte.funcional.errores
      )
        ? reporte.funcional.errores
        : [];

    var hallazgoConsumida =
      errores.some(function(hallazgo) {
        return (
          hallazgo.entidad ===
            'TAREA_MATERIAL' &&
          hallazgo.registroId ===
            registroId &&
          String(
            hallazgo.descripcion || ''
          ).indexOf(
            'CANTIDAD_CONSUMIDA'
          ) !== -1
        );
      });

    var hallazgoDesperdiciada =
      errores.some(function(hallazgo) {
        return (
          hallazgo.entidad ===
            'TAREA_MATERIAL' &&
          hallazgo.registroId ===
            registroId &&
          String(
            hallazgo.descripcion || ''
          ).indexOf(
            'CANTIDAD_DESPERDICIADA'
          ) !== -1
        );
      });

    console.log(
      'OK hallazgo_consumida_negativa=' +
      hallazgoConsumida
    );

    console.log(
      'OK hallazgo_desperdiciada_negativa=' +
      hallazgoDesperdiciada
    );

    if (
      !hallazgoConsumida ||
      !hallazgoDesperdiciada
    ) {
      errorFinal = new Error(
        'F02_B06_NO_GO: IntegrityService no detecta todas las cantidades negativas históricas'
      );
    }
  } catch (error) {
    console.log(
      'ERR diagnostico=' +
      error.message
    );

    errorFinal =
      errorFinal ||
      error;
  } finally {
    try {
      if (
        filaObjetivo &&
        valoresOriginales
      ) {
        hoja
          .getRange(
            filaObjetivo,
            1,
            1,
            valoresOriginales.length
          )
          .setValues([
            valoresOriginales
          ]);

        SpreadsheetApp.flush();

        console.log(
          'OK restauracion_completa=true'
        );

        var reporteFinal =
          obtenerReporteIntegridad();

        var erroresFinales =
          reporteFinal &&
          reporteFinal.funcional &&
          Array.isArray(
            reporteFinal.funcional.errores
          )
            ? reporteFinal.funcional.errores
            : [];

        var registroRestaurado =
          String(
            valoresOriginales[
              cabeceras.indexOf('ID')
            ] || ''
          ).trim();

        var persisteHallazgo =
          erroresFinales.some(
            function(hallazgo) {
              return (
                hallazgo.entidad ===
                  'TAREA_MATERIAL' &&
                hallazgo.registroId ===
                  registroRestaurado &&
                (
                  String(
                    hallazgo.descripcion || ''
                  ).indexOf(
                    'CANTIDAD_CONSUMIDA'
                  ) !== -1 ||
                  String(
                    hallazgo.descripcion || ''
                  ).indexOf(
                    'CANTIDAD_DESPERDICIADA'
                  ) !== -1
                )
              );
            }
          );

        if (persisteHallazgo) {
          console.log(
            'ERR hallazgo_persiste_tras_restauracion=true'
          );

          errorFinal =
            errorFinal ||
            new Error(
              'F02_B06_ERROR: el hallazgo persiste tras restaurar'
            );
        } else {
          console.log(
            'OK integridad_restaurada=true'
          );
        }
      }
    } catch (errorRestauracion) {
      console.log(
        'ERR restauracion=' +
        errorRestauracion.message
      );

      errorFinal =
        errorFinal ||
        errorRestauracion;
    }

    console.log(
      errorFinal
        ? 'NEXT reparar_IntegrityService_cantidades_negativas'
        : 'NEXT auditar_relaciones_con_registros_inactivos'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' status=' +
      (errorFinal ? 'NO_GO' : 'OK')
    );
  }

  if (errorFinal) {
    throw errorFinal;
  }

  return true;
}

function auditarFaseB07_RelacionesConRegistrosInactivos() {
  var packageName = 'F02_B07_RELACIONES_CON_REGISTROS_INACTIVOS';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var restauraciones = [];
  var errorFinal = null;

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  try {
    var productos = listarRegistros('PRODUCTO', {ACTIVO: 'SÍ'});
    var tareas = listarRegistros('TAREA', {ACTIVO: 'SÍ'});
    var materiales = listarRegistros('MATERIAL', {ACTIVO: 'SÍ'});
    var productoMaterial = listarRegistros('PRODUCTO_MATERIAL', {ACTIVO: 'SÍ'});
    var tareaMaterial = listarRegistros('TAREA_MATERIAL', {ACTIVO: 'SÍ'});

    if (!productos.length) {
      throw new Error('F02_B07_ERROR: no existen productos activos');
    }

    if (!tareas.length) {
      throw new Error('F02_B07_ERROR: no existen tareas activas');
    }

    if (!materiales.length) {
      throw new Error('F02_B07_ERROR: no existen materiales activos');
    }

    var combinacionesProductoMaterial = {};
    productoMaterial.forEach(function(relacion) {
      combinacionesProductoMaterial[
        String(relacion.PRODUCTO_ID || '').trim() +
        '|' +
        String(relacion.MATERIAL_ID || '').trim()
      ] = true;
    });

    var combinacionesTareaMaterial = {};
    tareaMaterial.forEach(function(relacion) {
      combinacionesTareaMaterial[
        String(relacion.TAREA_ID || '').trim() +
        '|' +
        String(relacion.MATERIAL_ID || '').trim()
      ] = true;
    });

    var seleccionPM = buscarCombinacionLibreB07_(
      productos,
      materiales,
      combinacionesProductoMaterial
    );

    var seleccionTM = buscarCombinacionLibreB07_(
      tareas,
      materiales,
      combinacionesTareaMaterial
    );

    if (!seleccionPM) {
      throw new Error(
        'F02_B07_ERROR: no existe combinación libre PRODUCTO_ID/MATERIAL_ID'
      );
    }

    if (!seleccionTM) {
      throw new Error(
        'F02_B07_ERROR: no existe combinación libre TAREA_ID/MATERIAL_ID'
      );
    }

    console.log('OK producto_id=' + seleccionPM.padre.ID);
    console.log('OK tarea_id=' + seleccionTM.padre.ID);
    console.log('OK material_pm_id=' + seleccionPM.material.ID);
    console.log('OK material_tm_id=' + seleccionTM.material.ID);

    probarRelacionConPadreInactivoB07_(
      ss,
      restauraciones,
      {
        nombreCaso: 'producto_inactivo',
        hojaPadre: '03_PRODUCTOS',
        idPadre: seleccionPM.padre.ID,
        entidadRelacion: 'PRODUCTO_MATERIAL',
        datosRelacion: {
          PRODUCTO_ID: seleccionPM.padre.ID,
          MATERIAL_ID: seleccionPM.material.ID,
          CANTIDAD_PREVISTA: 1,
          UNIDAD: seleccionPM.material.UNIDAD,
          ESTADO: 'Planificada'
        },
        fragmentoEsperado: 'PRODUCTO'
      }
    );

    probarRelacionConPadreInactivoB07_(
      ss,
      restauraciones,
      {
        nombreCaso: 'material_inactivo_producto_material',
        hojaPadre: '08_MATERIALES',
        idPadre: seleccionPM.material.ID,
        entidadRelacion: 'PRODUCTO_MATERIAL',
        datosRelacion: {
          PRODUCTO_ID: seleccionPM.padre.ID,
          MATERIAL_ID: seleccionPM.material.ID,
          CANTIDAD_PREVISTA: 1,
          UNIDAD: seleccionPM.material.UNIDAD,
          ESTADO: 'Planificada'
        },
        fragmentoEsperado: 'MATERIAL'
      }
    );

    probarRelacionConPadreInactivoB07_(
      ss,
      restauraciones,
      {
        nombreCaso: 'tarea_inactiva',
        hojaPadre: '06_TAREAS',
        idPadre: seleccionTM.padre.ID,
        entidadRelacion: 'TAREA_MATERIAL',
        datosRelacion: {
          TAREA_ID: seleccionTM.padre.ID,
          MATERIAL_ID: seleccionTM.material.ID,
          CANTIDAD_PREVISTA: 1,
          CANTIDAD_CONSUMIDA: 0,
          CANTIDAD_DESPERDICIADA: 0,
          UNIDAD: seleccionTM.material.UNIDAD,
          ESTADO: 'Activa',
          MOTIVO_DESVIACION: '',
          OBSERVACIONES: 'AUDITORÍA F02 B07'
        },
        fragmentoEsperado: 'TAREA'
      }
    );

    probarRelacionConPadreInactivoB07_(
      ss,
      restauraciones,
      {
        nombreCaso: 'material_inactivo_tarea_material',
        hojaPadre: '08_MATERIALES',
        idPadre: seleccionTM.material.ID,
        entidadRelacion: 'TAREA_MATERIAL',
        datosRelacion: {
          TAREA_ID: seleccionTM.padre.ID,
          MATERIAL_ID: seleccionTM.material.ID,
          CANTIDAD_PREVISTA: 1,
          CANTIDAD_CONSUMIDA: 0,
          CANTIDAD_DESPERDICIADA: 0,
          UNIDAD: seleccionTM.material.UNIDAD,
          ESTADO: 'Activa',
          MOTIVO_DESVIACION: '',
          OBSERVACIONES: 'AUDITORÍA F02 B07'
        },
        fragmentoEsperado: 'MATERIAL'
      }
    );

    console.log('OK matriz_inactivos_preventiva_superada=true casos=4');
  } catch (error) {
    console.log('ERR diagnostico=' + error.message);
    errorFinal = error;
  } finally {
    for (var i = restauraciones.length - 1; i >= 0; i--) {
      try {
        restauraciones[i]();
      } catch (errorRestauracion) {
        console.log(
          'ERR restauracion_indice=' +
          i +
          ' mensaje=' +
          errorRestauracion.message
        );

        errorFinal = errorFinal || errorRestauracion;
      }
    }

    SpreadsheetApp.flush();

    console.log(
      errorFinal
        ? 'NEXT reparar_validacion_preventiva_registros_inactivos'
        : 'NEXT auditar_integridad_historica_registros_inactivos'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' status=' +
      (errorFinal ? 'NO_GO' : 'OK')
    );
  }

  if (errorFinal) {
    throw errorFinal;
  }

  return true;
}


function buscarCombinacionLibreB07_(
  padres,
  materiales,
  combinacionesOcupadas
) {
  for (var i = 0; i < padres.length; i++) {
    for (var j = 0; j < materiales.length; j++) {
      var clave =
        String(padres[i].ID || '').trim() +
        '|' +
        String(materiales[j].ID || '').trim();

      if (!combinacionesOcupadas[clave]) {
        return {
          padre: padres[i],
          material: materiales[j]
        };
      }
    }
  }

  return null;
}


function probarRelacionConPadreInactivoB07_(
  ss,
  restauraciones,
  configuracionPrueba
) {
  var hoja = ss.getSheetByName(
    configuracionPrueba.hojaPadre
  );

  if (!hoja) {
    throw new Error(
      'F02_B07_ERROR: no existe la hoja ' +
      configuracionPrueba.hojaPadre
    );
  }

  var ultimaFila = hoja.getLastRow();
  var ultimaColumna = hoja.getLastColumn();

  var cabeceras = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0];

  var indiceId = cabeceras.indexOf('ID');
  var indiceActivo = cabeceras.indexOf('ACTIVO');

  if (
    indiceId === -1 ||
    indiceActivo === -1
  ) {
    throw new Error(
      'F02_B07_ERROR: ' +
      configuracionPrueba.hojaPadre +
      ' no contiene ID o ACTIVO'
    );
  }

  var filas = ultimaFila > 1
    ? hoja
        .getRange(
          2,
          1,
          ultimaFila - 1,
          ultimaColumna
        )
        .getDisplayValues()
    : [];

  var filaObjetivo = null;

  for (var i = 0; i < filas.length; i++) {
    if (
      String(filas[i][indiceId] || '').trim() ===
      String(configuracionPrueba.idPadre || '').trim()
    ) {
      filaObjetivo = i + 2;
      break;
    }
  }

  if (!filaObjetivo) {
    throw new Error(
      'F02_B07_ERROR: no se encontró el registro ' +
      configuracionPrueba.idPadre
    );
  }

  var celdaActivo = hoja.getRange(
    filaObjetivo,
    indiceActivo + 1
  );

  var valorOriginal = celdaActivo.getValue();

  celdaActivo.setValue('NO');
  SpreadsheetApp.flush();

  restauraciones.push(function() {
    celdaActivo.setValue(valorOriginal);
    SpreadsheetApp.flush();

    console.log(
      'OK restauracion=' +
      configuracionPrueba.nombreCaso +
      ' valor=' +
      valorOriginal
    );
  });

  var errorCapturado = null;

  try {
    insertarRegistroTransaccional(
      configuracionPrueba.entidadRelacion,
      configuracionPrueba.datosRelacion,
      {
        dryRun: true,
        origen: 'TEST'
      }
    );
  } catch (error) {
    errorCapturado = error;
  }

  celdaActivo.setValue(valorOriginal);
  SpreadsheetApp.flush();
  restauraciones.pop();

  console.log(
    'OK restauracion_inmediata=' +
    configuracionPrueba.nombreCaso
  );

  if (!errorCapturado) {
    console.log(
      'ERR caso=' +
      configuracionPrueba.nombreCaso +
      ' relacion_con_inactivo_aceptada=true'
    );

    throw new Error(
      'F02_B07_NO_GO: el repositorio aceptó el caso ' +
      configuracionPrueba.nombreCaso
    );
  }

  var mensaje = String(
    errorCapturado.message || ''
  );

  if (
    configuracionPrueba.fragmentoEsperado &&
    mensaje
      .toUpperCase()
      .indexOf(
        String(
          configuracionPrueba.fragmentoEsperado
        ).toUpperCase()
      ) === -1
  ) {
    console.log(
      'ERR caso=' +
      configuracionPrueba.nombreCaso +
      ' rechazo_por_causa_distinta=' +
      mensaje
    );

    throw new Error(
      'F02_B07_NO_GO: el caso ' +
      configuracionPrueba.nombreCaso +
      ' fue rechazado por una causa distinta'
    );
  }

  console.log(
    'OK caso=' +
    configuracionPrueba.nombreCaso +
    ' rechazado=true mensaje=' +
    mensaje
  );
}

function auditarFaseB08_IntegridadHistoricaRegistrosInactivos() {
  var packageName =
    'F02_B08_INTEGRIDAD_HISTORICA_REGISTROS_INACTIVOS';

  var errorFinal = null;

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  try {
    var relacionesPM = listarRegistros(
      'PRODUCTO_MATERIAL',
      {ACTIVO: 'SÍ'}
    );

    var relacionesTM = listarRegistros(
      'TAREA_MATERIAL',
      {ACTIVO: 'SÍ'}
    );

    if (!relacionesPM.length) {
      throw new Error(
        'F02_B08_ERROR: no existen relaciones PRODUCTO_MATERIAL activas'
      );
    }

    if (!relacionesTM.length) {
      throw new Error(
        'F02_B08_ERROR: no existen relaciones TAREA_MATERIAL activas'
      );
    }

    var relacionPM = relacionesPM[0];
    var relacionTM = relacionesTM[0];

    console.log(
      'OK producto_material_id=' +
      relacionPM.ID
    );

    console.log(
      'OK tarea_material_id=' +
      relacionTM.ID
    );

    probarIntegridadPadreInactivoB08_({
      nombreCaso:
        'producto_inactivo_producto_material',

      hojaPadre:
        '03_PRODUCTOS',

      idPadre:
        relacionPM.PRODUCTO_ID,

      entidadRelacion:
        'PRODUCTO_MATERIAL',

      idRelacion:
        relacionPM.ID,

      campoRelacion:
        'PRODUCTO_ID',

      entidadPadre:
        'PRODUCTO'
    });

    probarIntegridadPadreInactivoB08_({
      nombreCaso:
        'material_inactivo_producto_material',

      hojaPadre:
        '08_MATERIALES',

      idPadre:
        relacionPM.MATERIAL_ID,

      entidadRelacion:
        'PRODUCTO_MATERIAL',

      idRelacion:
        relacionPM.ID,

      campoRelacion:
        'MATERIAL_ID',

      entidadPadre:
        'MATERIAL'
    });

    probarIntegridadPadreInactivoB08_({
      nombreCaso:
        'tarea_inactiva_tarea_material',

      hojaPadre:
        '06_TAREAS',

      idPadre:
        relacionTM.TAREA_ID,

      entidadRelacion:
        'TAREA_MATERIAL',

      idRelacion:
        relacionTM.ID,

      campoRelacion:
        'TAREA_ID',

      entidadPadre:
        'TAREA'
    });

    probarIntegridadPadreInactivoB08_({
      nombreCaso:
        'material_inactivo_tarea_material',

      hojaPadre:
        '08_MATERIALES',

      idPadre:
        relacionTM.MATERIAL_ID,

      entidadRelacion:
        'TAREA_MATERIAL',

      idRelacion:
        relacionTM.ID,

      campoRelacion:
        'MATERIAL_ID',

      entidadPadre:
        'MATERIAL'
    });

    console.log(
      'OK matriz_integridad_inactivos_superada=true casos=4'
    );
  } catch (error) {
    console.log(
      'ERR diagnostico=' +
      error.message
    );

    errorFinal = error;
  }

  console.log(
    errorFinal
      ? 'NEXT reparar_IntegrityService_relaciones_inactivas'
      : 'NEXT auditar_duplicidades_historicas_materiales'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' status=' +
    (errorFinal ? 'NO_GO' : 'OK')
  );

  if (errorFinal) {
    throw errorFinal;
  }

  return true;
}


function probarIntegridadPadreInactivoB08_(
  configuracionPrueba
) {
  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  var hoja =
    ss.getSheetByName(
      configuracionPrueba.hojaPadre
    );

  if (!hoja) {
    throw new Error(
      'F02_B08_ERROR: no existe la hoja ' +
      configuracionPrueba.hojaPadre
    );
  }

  var ultimaFila =
    hoja.getLastRow();

  var ultimaColumna =
    hoja.getLastColumn();

  if (ultimaFila < 2) {
    throw new Error(
      'F02_B08_ERROR: la hoja ' +
      configuracionPrueba.hojaPadre +
      ' no contiene registros'
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
      .getDisplayValues()[0];

  var indiceId =
    cabeceras.indexOf('ID');

  var indiceActivo =
    cabeceras.indexOf('ACTIVO');

  if (
    indiceId === -1 ||
    indiceActivo === -1
  ) {
    throw new Error(
      'F02_B08_ERROR: ' +
      configuracionPrueba.hojaPadre +
      ' no contiene ID o ACTIVO'
    );
  }

  var filas =
    hoja
      .getRange(
        2,
        1,
        ultimaFila - 1,
        ultimaColumna
      )
      .getValues();

  var filaObjetivo = null;
  var valorOriginalActivo = null;

  for (
    var i = 0;
    i < filas.length;
    i++
  ) {
    if (
      String(
        filas[i][indiceId] || ''
      ).trim() ===
      String(
        configuracionPrueba.idPadre || ''
      ).trim()
    ) {
      filaObjetivo = i + 2;
      valorOriginalActivo =
        filas[i][indiceActivo];

      break;
    }
  }

  if (!filaObjetivo) {
    throw new Error(
      'F02_B08_ERROR: no se encontró el padre ' +
      configuracionPrueba.idPadre
    );
  }

  var celdaActivo =
    hoja.getRange(
      filaObjetivo,
      indiceActivo + 1
    );

  var hallazgoDetectado = false;
  var errorPrueba = null;

  try {
    celdaActivo.setValue('NO');

    SpreadsheetApp.flush();

    console.log(
      'OK mutacion_directa=' +
      configuracionPrueba.nombreCaso +
      ' padre_id=' +
      configuracionPrueba.idPadre +
      ' activo=NO'
    );

    var reporte =
      obtenerReporteIntegridad();

    var hallazgos = [];

    if (
      reporte &&
      reporte.funcional
    ) {
      hallazgos = hallazgos
        .concat(
          reporte.funcional.errores || []
        )
        .concat(
          reporte.funcional.advertencias || []
        )
        .concat(
          reporte.funcional.informacion || []
        );
    }

    hallazgoDetectado =
      hallazgos.some(
        function(hallazgo) {
          var entidad = String(
            hallazgo.entidad || ''
          ).trim();

          var registroId = String(
            hallazgo.registroId || ''
          ).trim();

          var descripcion = String(
            hallazgo.descripcion || ''
          ).toUpperCase();

          return (
            entidad ===
              configuracionPrueba.entidadRelacion &&
            registroId ===
              configuracionPrueba.idRelacion &&
            (
              descripcion.indexOf(
                configuracionPrueba.campoRelacion
              ) !== -1 ||
              descripcion.indexOf(
                configuracionPrueba.entidadPadre
              ) !== -1
            ) &&
            descripcion.indexOf(
              'INACTIV'
            ) !== -1
          );
        }
      );

    console.log(
      'OK caso=' +
      configuracionPrueba.nombreCaso +
      ' hallazgo_detectado=' +
      hallazgoDetectado
    );

    if (!hallazgoDetectado) {
      errorPrueba = new Error(
        'F02_B08_NO_GO: IntegrityService no detecta el caso ' +
        configuracionPrueba.nombreCaso
      );
    }
  } catch (error) {
    errorPrueba =
      errorPrueba ||
      error;
  } finally {
    celdaActivo.setValue(
      valorOriginalActivo
    );

    SpreadsheetApp.flush();

    console.log(
      'OK restauracion=' +
      configuracionPrueba.nombreCaso +
      ' valor=' +
      valorOriginalActivo
    );

    var reporteRestaurado =
      obtenerReporteIntegridad();

    var hallazgosRestaurados = [];

    if (
      reporteRestaurado &&
      reporteRestaurado.funcional
    ) {
      hallazgosRestaurados =
        hallazgosRestaurados
          .concat(
            reporteRestaurado.funcional.errores || []
          )
          .concat(
            reporteRestaurado.funcional.advertencias || []
          )
          .concat(
            reporteRestaurado.funcional.informacion || []
          );
    }

    var persisteHallazgo =
      hallazgosRestaurados.some(
        function(hallazgo) {
          return (
            String(
              hallazgo.entidad || ''
            ).trim() ===
              configuracionPrueba.entidadRelacion &&
            String(
              hallazgo.registroId || ''
            ).trim() ===
              configuracionPrueba.idRelacion &&
            String(
              hallazgo.descripcion || ''
            )
              .toUpperCase()
              .indexOf('INACTIV') !== -1
          );
        }
      );

    if (persisteHallazgo) {
      console.log(
        'ERR caso=' +
        configuracionPrueba.nombreCaso +
        ' hallazgo_persiste_tras_restauracion=true'
      );

      errorPrueba =
        errorPrueba ||
        new Error(
          'F02_B08_ERROR: el hallazgo persiste tras restaurar ' +
          configuracionPrueba.nombreCaso
        );
    } else {
      console.log(
        'OK caso=' +
        configuracionPrueba.nombreCaso +
        ' integridad_restaurada=true'
      );
    }
  }

  if (errorPrueba) {
    throw errorPrueba;
  }
}

function auditarFaseB09_DuplicidadesHistoricasMateriales() {
  var packageName =
    'F02_B09_DUPLICIDADES_HISTORICAS_MATERIALES';

  var errorFinal = null;

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  try {
    probarDuplicidadHistoricaMaterialB09_({
      nombreCaso:
        'producto_material_duplicado',

      hojaRelacion:
        '09_PRODUCTO_MATERIAL',

      entidad:
        'PRODUCTO_MATERIAL',

      camposClave: [
        'PRODUCTO_ID',
        'MATERIAL_ID'
      ],

      prefijoId:
        'PMA-B09-'
    });

    probarDuplicidadHistoricaMaterialB09_({
      nombreCaso:
        'tarea_material_duplicado',

      hojaRelacion:
        '10_TAREA_MATERIAL',

      entidad:
        'TAREA_MATERIAL',

      camposClave: [
        'TAREA_ID',
        'MATERIAL_ID'
      ],

      prefijoId:
        'TMA-B09-'
    });

    console.log(
      'OK matriz_duplicidades_historicas_superada=true casos=2'
    );
  } catch (error) {
    console.log(
      'ERR diagnostico=' +
      error.message
    );

    errorFinal = error;
  }

  console.log(
    errorFinal
      ? 'NEXT reparar_IntegrityService_duplicidades_funcionales'
      : 'NEXT auditar_matriz_final_relaciones_materiales'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' status=' +
    (errorFinal ? 'NO_GO' : 'OK')
  );

  if (errorFinal) {
    throw errorFinal;
  }

  return true;
}


function probarDuplicidadHistoricaMaterialB09_(
  configuracionPrueba
) {
  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  var hoja =
    ss.getSheetByName(
      configuracionPrueba.hojaRelacion
    );

  if (!hoja) {
    throw new Error(
      'F02_B09_ERROR: no existe la hoja ' +
      configuracionPrueba.hojaRelacion
    );
  }

  var ultimaFila =
    hoja.getLastRow();

  var ultimaColumna =
    hoja.getLastColumn();

  if (ultimaFila < 2) {
    throw new Error(
      'F02_B09_ERROR: no existen relaciones en ' +
      configuracionPrueba.hojaRelacion
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
      .map(function(cabecera) {
        return String(
          cabecera || ''
        ).trim();
      });

  var indiceId =
    cabeceras.indexOf('ID');

  var indiceActivo =
    cabeceras.indexOf('ACTIVO');

  if (indiceId === -1) {
    throw new Error(
      'F02_B09_ERROR: ' +
      configuracionPrueba.hojaRelacion +
      ' no contiene la columna ID'
    );
  }

  var indicesClave =
    configuracionPrueba.camposClave.map(
      function(campo) {
        return cabeceras.indexOf(campo);
      }
    );

  var faltaCampoClave =
    indicesClave.some(
      function(indice) {
        return indice === -1;
      }
    );

  if (faltaCampoClave) {
    throw new Error(
      'F02_B09_ERROR: ' +
      configuracionPrueba.hojaRelacion +
      ' no contiene todos los campos clave: ' +
      configuracionPrueba.camposClave.join(', ')
    );
  }

  var filas =
    hoja
      .getRange(
        2,
        1,
        ultimaFila - 1,
        ultimaColumna
      )
      .getValues();

  var filaOrigen = null;

  for (
    var i = 0;
    i < filas.length;
    i++
  ) {
    var activa =
      indiceActivo === -1 ||
      String(
        filas[i][indiceActivo] || ''
      )
        .trim()
        .toUpperCase() !== 'NO';

    var clavesCompletas =
      indicesClave.every(
        function(indice) {
          return String(
            filas[i][indice] || ''
          ).trim() !== '';
        }
      );

    if (
      activa &&
      clavesCompletas
    ) {
      filaOrigen =
        filas[i].slice();

      break;
    }
  }

  if (!filaOrigen) {
    throw new Error(
      'F02_B09_ERROR: no existe una relación activa utilizable en ' +
      configuracionPrueba.hojaRelacion
    );
  }

  var idOrigen = String(
    filaOrigen[indiceId] || ''
  ).trim();

  var valoresClave =
    indicesClave.map(
      function(indice) {
        return String(
          filaOrigen[indice] || ''
        ).trim();
      }
    );

  var idTemporal =
    configuracionPrueba.prefijoId +
    Utilities.getUuid()
      .replace(/-/g, '')
      .substring(0, 12)
      .toUpperCase();

  filaOrigen[indiceId] =
    idTemporal;

  if (indiceActivo !== -1) {
    filaOrigen[indiceActivo] =
      'SÍ';
  }

  var filaInsertada = null;
  var errorPrueba = null;

  try {
    hoja.appendRow(
      filaOrigen
    );

    filaInsertada =
      hoja.getLastRow();

    SpreadsheetApp.flush();

    console.log(
      'OK mutacion_directa=' +
      configuracionPrueba.nombreCaso +
      ' id_origen=' +
      idOrigen +
      ' id_duplicado=' +
      idTemporal +
      ' clave=' +
      valoresClave.join(' / ')
    );

    var reporte =
      obtenerReporteIntegridad();

    var hallazgosFuncionales =
      extraerHallazgosFuncionalesB09_(
        reporte
      );

    var hallazgoDetectado =
      hallazgosFuncionales.some(
        function(hallazgo) {
          var entidad = String(
            hallazgo.entidad || ''
          ).trim();

          var registroId = String(
            hallazgo.registroId || ''
          ).trim();

          var descripcion = String(
            hallazgo.descripcion || ''
          ).toUpperCase();

          var contieneDuplicidad =
            descripcion.indexOf(
              'DUPLIC'
            ) !== -1;

          var contieneCampos =
            configuracionPrueba.camposClave.every(
              function(campo) {
                return descripcion.indexOf(
                  campo.toUpperCase()
                ) !== -1;
              }
            );

          var contieneValores =
            valoresClave.every(
              function(valor) {
                return descripcion.indexOf(
                  valor.toUpperCase()
                ) !== -1;
              }
            );

          return (
            entidad ===
              configuracionPrueba.entidad &&
            (
              registroId === idTemporal ||
              registroId === idOrigen ||
              !registroId
            ) &&
            contieneDuplicidad &&
            (
              contieneCampos ||
              contieneValores
            )
          );
        }
      );

    console.log(
      'OK caso=' +
      configuracionPrueba.nombreCaso +
      ' hallazgo_detectado=' +
      hallazgoDetectado
    );

    if (!hallazgoDetectado) {
      errorPrueba = new Error(
        'F02_B09_NO_GO: IntegrityService no detecta el caso ' +
        configuracionPrueba.nombreCaso
      );
    }
  } catch (error) {
    errorPrueba =
      errorPrueba ||
      error;
  } finally {
    if (filaInsertada) {
      eliminarFilaPorIdB09_(
        hoja,
        indiceId,
        idTemporal
      );

      SpreadsheetApp.flush();

      console.log(
        'OK restauracion=' +
        configuracionPrueba.nombreCaso +
        ' id_eliminado=' +
        idTemporal
      );
    }

    var reporteRestaurado =
      obtenerReporteIntegridad();

    var hallazgosRestaurados =
      extraerHallazgosFuncionalesB09_(
        reporteRestaurado
      );

    var persisteDuplicidad =
      hallazgosRestaurados.some(
        function(hallazgo) {
          var entidad = String(
            hallazgo.entidad || ''
          ).trim();

          var descripcion = String(
            hallazgo.descripcion || ''
          ).toUpperCase();

          var contieneValores =
            valoresClave.every(
              function(valor) {
                return descripcion.indexOf(
                  valor.toUpperCase()
                ) !== -1;
              }
            );

          return (
            entidad ===
              configuracionPrueba.entidad &&
            descripcion.indexOf(
              'DUPLIC'
            ) !== -1 &&
            contieneValores
          );
        }
      );

    if (persisteDuplicidad) {
      console.log(
        'ERR caso=' +
        configuracionPrueba.nombreCaso +
        ' hallazgo_persiste_tras_restauracion=true'
      );

      errorPrueba =
        errorPrueba ||
        new Error(
          'F02_B09_ERROR: el hallazgo persiste tras restaurar ' +
          configuracionPrueba.nombreCaso
        );
    } else {
      console.log(
        'OK caso=' +
        configuracionPrueba.nombreCaso +
        ' integridad_restaurada=true'
      );
    }
  }

  if (errorPrueba) {
    throw errorPrueba;
  }
}


function extraerHallazgosFuncionalesB09_(
  reporte
) {
  var hallazgos = [];

  if (
    !reporte ||
    !reporte.funcional
  ) {
    return hallazgos;
  }

  return hallazgos
    .concat(
      reporte.funcional.errores || []
    )
    .concat(
      reporte.funcional.advertencias || []
    )
    .concat(
      reporte.funcional.informacion || []
    );
}


function eliminarFilaPorIdB09_(
  hoja,
  indiceId,
  idBuscado
) {
  var ultimaFila =
    hoja.getLastRow();

  if (ultimaFila < 2) {
    return false;
  }

  var ids =
    hoja
      .getRange(
        2,
        indiceId + 1,
        ultimaFila - 1,
        1
      )
      .getDisplayValues();

  for (
    var i = ids.length - 1;
    i >= 0;
    i--
  ) {
    if (
      String(
        ids[i][0] || ''
      ).trim() ===
      String(
        idBuscado || ''
      ).trim()
    ) {
      hoja.deleteRow(
        i + 2
      );

      return true;
    }
  }

  return false;
}

function auditarFaseB10_MatrizFinalRelacionesMateriales() {
  var packageName =
    'F02_B10_MATRIZ_FINAL_RELACIONES_MATERIALES';

  var pruebas = [
    {
      codigo: 'B01',
      nombre: 'duplicidad_producto_material',
      ejecutar:
        auditarFaseB01_DuplicidadProductoMaterial
    },
    {
      codigo: 'B02',
      nombre: 'actualizacion_producto_material',
      ejecutar:
        auditarFaseB02_ActualizacionProductoMaterial
    },
    {
      codigo: 'B03',
      nombre: 'duplicidad_tarea_material',
      ejecutar:
        auditarFaseB03_DuplicidadTareaMaterial
    },
    {
      codigo: 'B04',
      nombre: 'actualizacion_tarea_material',
      ejecutar:
        auditarFaseB04_ActualizacionTareaMaterial
    },
    {
      codigo: 'B05',
      nombre: 'cantidades_preventivas',
      ejecutar:
        auditarFaseB05_MatrizPreventivaCantidadesTareaMaterial
    },
    {
      codigo: 'B06',
      nombre: 'cantidades_negativas_historicas',
      ejecutar:
        auditarFaseB06_CantidadesNegativasHistoricas
    },
    {
      codigo: 'B07',
      nombre: 'relaciones_con_registros_inactivos',
      ejecutar:
        auditarFaseB07_RelacionesConRegistrosInactivos
    },
    {
      codigo: 'B08',
      nombre: 'integridad_historica_registros_inactivos',
      ejecutar:
        auditarFaseB08_IntegridadHistoricaRegistrosInactivos
    },
    {
      codigo: 'B09',
      nombre: 'duplicidades_historicas_materiales',
      ejecutar:
        auditarFaseB09_DuplicidadesHistoricasMateriales
    }
  ];

  var errorFinal = null;
  var pruebasSuperadas = 0;

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  try {
    verificarIntegridadLimpiaB10_(
      'inicio'
    );

    pruebas.forEach(
      function(prueba) {
        console.log(
          'ENGREMIAT_STEP_BEGIN step=' +
          prueba.codigo +
          ' nombre=' +
          prueba.nombre
        );

        try {
          var resultado =
            prueba.ejecutar();

          if (resultado === false) {
            throw new Error(
              'La prueba devolvió false'
            );
          }

          pruebasSuperadas++;

          console.log(
            'OK step=' +
            prueba.codigo +
            ' nombre=' +
            prueba.nombre +
            ' resultado=SUPERADO'
          );

          console.log(
            'ENGREMIAT_STEP_END step=' +
            prueba.codigo +
            ' status=OK'
          );
        } catch (errorPaso) {
          console.log(
            'ERR step=' +
            prueba.codigo +
            ' nombre=' +
            prueba.nombre +
            ' mensaje=' +
            errorPaso.message
          );

          console.log(
            'ENGREMIAT_STEP_END step=' +
            prueba.codigo +
            ' status=NO_GO'
          );

          throw new Error(
            'F02_B10_NO_GO: regresión en ' +
            prueba.codigo +
            ' ' +
            prueba.nombre +
            ': ' +
            errorPaso.message
          );
        }
      }
    );

    verificarIntegridadLimpiaB10_(
      'final'
    );

    console.log(
      'OK matriz_final_superada=true'
    );

    console.log(
      'OK pruebas_superadas=' +
      pruebasSuperadas
    );

    console.log(
      'OK pruebas_totales=' +
      pruebas.length
    );
  } catch (error) {
    errorFinal = error;

    console.log(
      'ERR diagnostico=' +
      error.message
    );
  }

  console.log(
    errorFinal
      ? 'NEXT reparar_regresion_relaciones_materiales'
      : 'NEXT cerrar_gate_relaciones_materiales'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
    packageName +
    ' status=' +
    (errorFinal ? 'NO_GO' : 'OK')
  );

  if (errorFinal) {
    throw errorFinal;
  }

  return true;
}


function verificarIntegridadLimpiaB10_(
  momento
) {
  var reporte =
    obtenerReporteIntegridad();

  var duplicados =
    reporte &&
    reporte.idsDuplicados
      ? reporte.idsDuplicados
      : {};

  var huerfanas =
    reporte &&
    reporte.referenciasHuerfanas
      ? reporte.referenciasHuerfanas
      : {};

  var funcional =
    reporte &&
    reporte.funcional
      ? reporte.funcional
      : {};

  var erroresFuncionales =
    funcional.errores || [];

  var advertenciasFuncionales =
    funcional.advertencias || [];

  var informacionFuncional =
    funcional.informacion || [];

  var entidadesDuplicadas =
    Object.keys(
      duplicados
    ).filter(
      function(entidad) {
        var valores =
          duplicados[entidad];

        return Array.isArray(valores)
          ? valores.length > 0
          : Boolean(valores);
      }
    );

  var entidadesHuerfanas =
    Object.keys(
      huerfanas
    ).filter(
      function(entidad) {
        var valores =
          huerfanas[entidad];

        return Array.isArray(valores)
          ? valores.length > 0
          : Boolean(valores);
      }
    );

  console.log(
    'OK integridad_' +
    momento +
    '_ids_duplicados=' +
    entidadesDuplicadas.length
  );

  console.log(
    'OK integridad_' +
    momento +
    '_referencias_huerfanas=' +
    entidadesHuerfanas.length
  );

  console.log(
    'OK integridad_' +
    momento +
    '_errores_funcionales=' +
    erroresFuncionales.length
  );

  console.log(
    'OK integridad_' +
    momento +
    '_advertencias_funcionales=' +
    advertenciasFuncionales.length
  );

  console.log(
    'OK integridad_' +
    momento +
    '_informacion_funcional=' +
    informacionFuncional.length
  );

  if (
    entidadesDuplicadas.length > 0 ||
    entidadesHuerfanas.length > 0 ||
    erroresFuncionales.length > 0 ||
    advertenciasFuncionales.length > 0
  ) {
    throw new Error(
      'F02_B10_NO_GO: integridad no limpia en ' +
      momento +
      '. idsDuplicados=' +
      entidadesDuplicadas.length +
      ', referenciasHuerfanas=' +
      entidadesHuerfanas.length +
      ', errores=' +
      erroresFuncionales.length +
      ', advertencias=' +
      advertenciasFuncionales.length
    );
  }
}

function auditarFaseB10_CierreIntegridadRelacionesMateriales() {
  var packageName =
    'F02_B10_CIERRE_INTEGRIDAD_RELACIONES_MATERIALES';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
    packageName
  );

  try {
    verificarIntegridadLimpiaB10_(
      'cierre'
    );

    console.log(
      'OK bloques_verificados_individualmente=B01,B02,B03,B04,B05,B06,B07,B08,B09'
    );

    console.log(
      'OK cierre_relaciones_materiales=true'
    );

    console.log(
      'NEXT cerrar_gate_relaciones_materiales'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' status=OK'
    );

    return true;
  } catch (error) {
    console.log(
      'ERR diagnostico=' +
      error.message
    );

    console.log(
      'NEXT reparar_integridad_residual'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' status=NO_GO'
    );

    throw error;
  }
}
function auditarFaseC01_FechaFinRealAnteriorInicioReal() {
  var packageName = 'F03_C01_FECHA_FIN_REAL_ANTERIOR_INICIO_REAL';
  var s = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = s.getSheetByName('06_TAREAS');
  var filaObjetivo = null;
  var valoresOriginales = null;
  var errorFinal = null;

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  try {
    if (!hoja) {
      throw new Error('F03_C01_ERROR: no existe la hoja 06_TAREAS');
    }

    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();

    if (ultimaFila < 2) {
      throw new Error('F03_C01_ERROR: 06_TAREAS no contiene registros');
    }

    var cabeceras = hoja
      .getRange(1, 1, 1, ultimaColumna)
      .getDisplayValues()[0]
      .map(function(cabecera) {
        return String(cabecera || '').trim();
      });

    var campos = [
      'ID',
      'ESTADO',
      'PORCENTAJE_AVANCE',
      'FECHA_INICIO_REAL',
      'FECHA_FIN_REAL',
      'DURACION_REAL_DIAS',
      'ACTIVO'
    ];

    var indices = {};

    campos.forEach(function(campo) {
      indices[campo] = cabeceras.indexOf(campo);

      if (indices[campo] === -1) {
        throw new Error(
          'F03_C01_ERROR: 06_TAREAS no contiene la columna ' + campo
        );
      }
    });

    var filas = hoja
      .getRange(2, 1, ultimaFila - 1, ultimaColumna)
      .getValues();

    for (var i = 0; i < filas.length; i++) {
      var id = String(filas[i][indices.ID] || '').trim();
      var activo = String(filas[i][indices.ACTIVO] || '')
        .trim()
        .toUpperCase();

      if (id && activo !== 'NO') {
        filaObjetivo = i + 2;
        valoresOriginales = filas[i].slice();
        break;
      }
    }

    if (!filaObjetivo) {
      throw new Error(
        'F03_C01_ERROR: no existe una TAREA activa utilizable'
      );
    }

    var registroId = String(
      valoresOriginales[indices.ID] || ''
    ).trim();

    var fechaInicio = new Date(2026, 6, 2, 12, 0, 0);
    var fechaFin = new Date(2026, 6, 1, 12, 0, 0);

    hoja
      .getRange(filaObjetivo, indices.ESTADO + 1)
      .setValue('Terminada');

    hoja
      .getRange(filaObjetivo, indices.PORCENTAJE_AVANCE + 1)
      .setValue(100);

    hoja
      .getRange(filaObjetivo, indices.FECHA_INICIO_REAL + 1)
      .setValue(fechaInicio);

    hoja
      .getRange(filaObjetivo, indices.FECHA_FIN_REAL + 1)
      .setValue(fechaFin);

    hoja
      .getRange(filaObjetivo, indices.DURACION_REAL_DIAS + 1)
      .setValue(1);

    SpreadsheetApp.flush();

    console.log('OK registro_id=' + registroId);
    console.log(
      'OK mutacion_directa_aplicada=true fecha_inicio_real=' +
        fechaInicio.toISOString() +
        ' fecha_fin_real=' +
        fechaFin.toISOString()
    );

    var reporte = obtenerReporteIntegridad();
    var hallazgos = [];

    if (reporte && reporte.funcional) {
      hallazgos = hallazgos
        .concat(reporte.funcional.errores || [])
        .concat(reporte.funcional.advertencias || [])
        .concat(reporte.funcional.informacion || []);
    }

    var detectado = hallazgos.some(function(hallazgo) {
      var descripcion = String(hallazgo.descripcion || '')
        .toUpperCase();

      return (
        String(hallazgo.entidad || '').trim() === 'TAREA' &&
        String(hallazgo.registroId || '').trim() === registroId &&
        descripcion.indexOf('FECHA_FIN_REAL') !== -1 &&
        descripcion.indexOf('FECHA_INICIO_REAL') !== -1
      );
    });

    console.log('OK hallazgo fecha_fin_anterior_inicio=' + detectado);

    if (!detectado) {
      errorFinal = new Error(
        'F03_C01_NO_GO: IntegrityService no detecta FECHA_FIN_REAL anterior a FECHA_INICIO_REAL en TAREA'
      );
    }
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    if (filaObjetivo && valoresOriginales) {
      hoja
        .getRange(filaObjetivo, 1, 1, valoresOriginales.length)
        .setValues([valoresOriginales]);

      SpreadsheetApp.flush();

      console.log('OK restauracion_completa=true');

      var reporteRestaurado = obtenerReporteIntegridad();
      var erroresRestaurados =
        reporteRestaurado && reporteRestaurado.funcional
          ? reporteRestaurado.funcional.errores || []
          : [];

      var persiste = erroresRestaurados.some(function(hallazgo) {
        return (
          String(hallazgo.entidad || '').trim() === 'TAREA' &&
          String(hallazgo.registroId || '').trim() ===
            String(valoresOriginales[indices.ID] || '').trim() &&
          String(hallazgo.descripcion || '')
            .toUpperCase()
            .indexOf('FECHA_FIN_REAL') !== -1
        );
      });

      console.log('OK integridad_restaurada=' + !persiste);

      if (persiste) {
        errorFinal =
          errorFinal ||
          new Error(
            'F03_C01_ERROR: el hallazgo persiste tras restaurar la TAREA'
          );
      }
    }
  }

  console.log(
    errorFinal
      ? 'NEXT reparar_IntegrityService_fechas_reales_TAREA'
      : 'NEXT auditar_fechas_planificadas_TAREA'
  );

  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' status=' +
      (errorFinal ? 'NO_GO' : 'OK')
  );

  if (errorFinal) {
    throw errorFinal;
  }

  return true;
}

function diagnosticarFaseC01_EstadoOriginalTarea() {
  var packageName = 'F03_C01_DIAGNOSTICAR_ESTADO_ORIGINAL_TAREA';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tareas = listarRegistros('TAREA', {ACTIVO: 'SÍ'});
  var tarea = tareas.filter(function (item) {
    return String(item.ID || '').trim() === 'TAR-0001';
  })[0];

  if (!tarea) {
    console.log('ERR message=No se encontró TAR-0001 activa');
    console.log('NEXT detener_y_revisar_datos_TAREA');
    console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=NO_GO');
    throw new Error('F03_C01_DIAGNOSTICO: no se encontró TAR-0001 activa');
  }

  function describirValor_(valor) {
    var tipo = Object.prototype.toString.call(valor);
    var texto = String(valor === null || valor === undefined ? '' : valor);
    var fecha = valor instanceof Date ? valor : new Date(valor);
    var iso = !isNaN(fecha.getTime()) ? fecha.toISOString() : 'INVALID_DATE';
    return 'tipo=' + tipo + ' texto=' + texto + ' iso=' + iso;
  }

  console.log('OK registro_id=' + tarea.ID);
  console.log('OK estado=' + tarea.ESTADO);
  console.log('OK porcentaje_avance=' + tarea.PORCENTAJE_AVANCE);
  console.log('OK fecha_inicio_real ' + describirValor_(tarea.FECHA_INICIO_REAL));
  console.log('OK fecha_fin_real ' + describirValor_(tarea.FECHA_FIN_REAL));
  console.log('OK duracion_real_dias=' + tarea.DURACION_REAL_DIAS);

  var reporte = obtenerReporteIntegridad();
  var hallazgos = []
    .concat(reporte.funcional.errores || [])
    .concat(reporte.funcional.advertencias || [])
    .concat(reporte.funcional.informacion || []);

  var coincidentes = hallazgos.filter(function (hallazgo) {
    return (
      String(hallazgo.codigo || '').trim() === 'FUNC-TAREA-002' &&
      String(hallazgo.entidad || '').trim() === 'TAREA' &&
      String(hallazgo.registroId || '').trim() === String(tarea.ID || '').trim()
    );
  });

  console.log('OK func_tarea_002_coincidentes=' + coincidentes.length);
  coincidentes.forEach(function (hallazgo, indice) {
    console.log('OK hallazgo_' + (indice + 1) + '=' + JSON.stringify(hallazgo));
  });

  var inicio = tarea.FECHA_INICIO_REAL instanceof Date
    ? tarea.FECHA_INICIO_REAL
    : new Date(tarea.FECHA_INICIO_REAL);
  var fin = tarea.FECHA_FIN_REAL instanceof Date
    ? tarea.FECHA_FIN_REAL
    : new Date(tarea.FECHA_FIN_REAL);
  var fechasValidas = !isNaN(inicio.getTime()) && !isNaN(fin.getTime());
  var finAnterior = fechasValidas && fin.getTime() < inicio.getTime();

  console.log('OK fechas_validas=' + fechasValidas);
  console.log('OK estado_original_fin_anterior_inicio=' + finAnterior);
  console.log(
    finAnterior
      ? 'NEXT decidir_correccion_dato_historico_TAR_0001'
      : 'NEXT revisar_filtro_restauracion_prueba_C01'
  );
  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' status=' +
      (finAnterior ? 'WARN' : 'OK')
  );

  return {
    registroId: tarea.ID,
    fechasValidas: fechasValidas,
    finAnteriorInicio: finAnterior,
    hallazgos: coincidentes
  };
}

function repararFaseC01_Tarea0001() {
  var packageName = 'F03_C01_REPARAR_TAR_0001';
  var id = 'TAR-0001';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  var antes = obtenerTarea(id);
  if (!antes) throw new Error('F03_C01_ERROR: no existe TAR-0001');
  console.log('OK antes=' + JSON.stringify({ESTADO: antes.ESTADO, PORCENTAJE_AVANCE: antes.PORCENTAJE_AVANCE, FECHA_INICIO_REAL: antes.FECHA_INICIO_REAL, FECHA_FIN_REAL: antes.FECHA_FIN_REAL, DURACION_REAL_DIAS: antes.DURACION_REAL_DIAS}));
  var inicio = antes.FECHA_INICIO_REAL instanceof Date ? antes.FECHA_INICIO_REAL : new Date(antes.FECHA_INICIO_REAL);
  var fin = antes.FECHA_FIN_REAL instanceof Date ? antes.FECHA_FIN_REAL : new Date(antes.FECHA_FIN_REAL);
  if (String(antes.ESTADO || '').trim() !== 'Terminada' || Number(antes.PORCENTAJE_AVANCE) !== 100 || isNaN(inicio.getTime()) || isNaN(fin.getTime()) || fin.getTime() >= inicio.getTime()) {
    throw new Error('F03_C01_ABORT: TAR-0001 ya no coincide con el estado diagnosticado');
  }
  var resultado = actualizarTarea(id, {
    ESTADO: 'Pendiente',
    PORCENTAJE_AVANCE: 0,
    FECHA_INICIO_REAL: '',
    FECHA_FIN_REAL: '',
    DURACION_REAL_DIAS: ''
  }, {origen: 'ADMIN'});
  console.log('OK actualizacion_resultado=' + JSON.stringify(resultado));
  var despues = obtenerTarea(id);
  var reparada = String(despues.ESTADO || '').trim() === 'Pendiente' && Number(despues.PORCENTAJE_AVANCE) === 0 && String(despues.FECHA_INICIO_REAL || '').trim() === '' && String(despues.FECHA_FIN_REAL || '').trim() === '' && String(despues.DURACION_REAL_DIAS || '').trim() === '';
  console.log('OK dato_reparado=' + reparada);
  if (!reparada) throw new Error('F03_C01_ERROR: TAR-0001 no quedó restaurada al estado trazable');
  var reporte = obtenerReporteIntegridad();
  var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
  var persiste = hallazgos.some(function(h) { return String(h.codigo || '') === 'FUNC-TAREA-002' && String(h.entidad || '') === 'TAREA' && String(h.registroId || '') === id; });
  console.log('OK func_tarea_002_resuelto=' + !persiste);
  if (persiste) throw new Error('F03_C01_ERROR: persiste FUNC-TAREA-002 tras la reparación');
  var historial = listarHistorialDeRegistro('TAREA', id);
  var ultimo = historial.length ? historial[historial.length - 1] : null;
  console.log('OK historial_ultimo=' + JSON.stringify(ultimo));
  var trazada = !!ultimo && String(ultimo.ACCION || '') === 'ACTUALIZAR' && String(ultimo.ORIGEN || '') === 'ADMIN';
  console.log('OK reparacion_trazada=' + trazada);
  if (!trazada) throw new Error('F03_C01_ERROR: la reparación no quedó trazada como ADMIN');
  console.log('NEXT repetir_auditarFaseC01_FechaFinRealAnteriorInicioReal');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}
function auditarFaseC02_FechaFinPlanAnteriorInicioPlan() {
  var packageName = 'F03_C02_FECHA_FIN_PLAN_ANTERIOR_INICIO_PLAN';
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('06_TAREAS');
  var filaObjetivo = null;
  var valoresOriginales = null;
  var indices = {};
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hoja) throw new Error('F03_C02_ERROR: no existe 06_TAREAS');
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();
    if (ultimaFila < 2) throw new Error('F03_C02_ERROR: 06_TAREAS no contiene registros');
    var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function(c) { return String(c || "").trim(); });
    ['ID', 'FECHA_INICIO_PLAN', 'FECHA_FIN_PLAN', 'ACTIVO'].forEach(function(campo) {
      indices[campo] = cabeceras.indexOf(campo);
      if (indices[campo] === -1) throw new Error('F03_C02_ERROR: falta columna ' + campo);
    });
    var filas = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
    for (var i = 0; i < filas.length; i++) {
      var id = String(filas[i][indices.ID] || '').trim();
      var activo = String(filas[i][indices.ACTIVO] || '').trim().toUpperCase();
      if (id && activo !== 'NO') {
        filaObjetivo = i + 2;
        valoresOriginales = filas[i].slice();
        break;
      }
    }
    if (!filaObjetivo) throw new Error('F03_C02_ERROR: no existe una TAREA activa utilizable');
    var registroId = String(valoresOriginales[indices.ID] || '').trim();
    var fechaInicio = new Date(2026, 6, 2, 12, 0, 0);
    var fechaFin = new Date(2026, 6, 1, 12, 0, 0);
    hoja.getRange(filaObjetivo, indices.FECHA_INICIO_PLAN + 1).setValue(fechaInicio);
    hoja.getRange(filaObjetivo, indices.FECHA_FIN_PLAN + 1).setValue(fechaFin);
    SpreadsheetApp.flush();
    console.log('OK registro_id=' + registroId);
    console.log('OK mutacion_directa_aplicada=true fecha_inicio_plan=' + fechaInicio.toISOString() + ' fecha_fin_plan=' + fechaFin.toISOString());
    var reporte = obtenerReporteIntegridad();
    var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
    var detectado = hallazgos.some(function(hallazgo) {
      return String(hallazgo.entidad || '').trim() === 'TAREA' &&
        String(hallazgo.registroId || '').trim() === registroId &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('FECHA_FIN_PLAN') !== -1 &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('FECHA_INICIO_PLAN') !== -1;
    });
    console.log('OK hallazgo_fecha_fin_plan_anterior_inicio=' + detectado);
    if (!detectado) errorFinal = new Error('F03_C02_NO_GO: IntegrityService no detecta FECHA_FIN_PLAN anterior a FECHA_INICIO_PLAN en TAREA');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    if (filaObjetivo && valoresOriginales) {
      hoja.getRange(filaObjetivo, 1, 1, valoresOriginales.length).setValues([valoresOriginales]);
      SpreadsheetApp.flush();
      console.log('OK restauracion_completa=true');
      var reporteRestaurado = obtenerReporteIntegridad();
      var erroresRestaurados = reporteRestaurado && reporteRestaurado.funcional ? reporteRestaurado.funcional.errores || [] : [];
      var registroOriginalId = String(valoresOriginales[indices.ID] || "").trim();
      var persiste = erroresRestaurados.some(function(hallazgo) {
        return String(hallazgo.entidad || '').trim() === 'TAREA' &&
          String(hallazgo.registroId || '').trim() === registroOriginalId &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('FECHA_FIN_PLAN') !== -1;
      });
      console.log('OK integridad_restaurada=' + !persiste);
      if (persiste) errorFinal = errorFinal || new Error('F03_C02_ERROR: el hallazgo persiste tras restaurar la TAREA');
    }
  }
  console.log(errorFinal ? 'NEXT reparar_IntegrityService_fechas_planificadas_TAREA' : 'NEXT cerrar_C02_fechas_planificadas_TAREA');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC03_PendienteConFechaInicioReal() {
  var packageName = 'F03_C03_PENDIENTE_CON_FECHA_INICIO_REAL';
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('06_TAREAS');
  var filaObjetivo = null;
  var valoresOriginales = null;
  var indices = {};
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hoja) throw new Error('F03_C03_ERROR: no existe 06_TAREAS');
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();
    if (ultimaFila < 2) throw new Error('F03_C03_ERROR: 06_TAREAS no contiene registros');
    var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function(c) { return String(c || "").trim(); });
    ['ID', 'ESTADO', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'DURACION_REAL_DIAS', 'PORCENTAJE_AVANCE', 'ACTIVO'].forEach(function(campo) {
      indices[campo] = cabeceras.indexOf(campo);
      if (indices[campo] === -1) throw new Error('F03_C03_ERROR: falta columna ' + campo);
    });
    var filas = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
    for (var i = 0; i < filas.length; i++) {
      var id = String(filas[i][indices.ID] || '').trim();
      var activo = String(filas[i][indices.ACTIVO] || '').trim().toUpperCase();
      if (id && activo !== 'NO') {
        filaObjetivo = i + 2;
        valoresOriginales = filas[i].slice();
        break;
      }
    }
    if (!filaObjetivo) throw new Error('F03_C03_ERROR: no existe una TAREA activa utilizable');
    var registroId = String(valoresOriginales[indices.ID] || '').trim();
    var fechaInicio = new Date(2026, 6, 2, 12, 0, 0);
    hoja.getRange(filaObjetivo, indices.ESTADO + 1).setValue('Pendiente');
    hoja.getRange(filaObjetivo, indices.PORCENTAJE_AVANCE + 1).setValue(0);
    hoja.getRange(filaObjetivo, indices.FECHA_INICIO_REAL + 1).setValue(fechaInicio);
    hoja.getRange(filaObjetivo, indices.FECHA_FIN_REAL + 1).setValue('');
    hoja.getRange(filaObjetivo, indices.DURACION_REAL_DIAS + 1).setValue('');
    SpreadsheetApp.flush();
    console.log('OK registro_id=' + registroId);
    console.log('OK mutacion_directa_aplicada=true estado=Pendiente fecha_inicio_real=' + fechaInicio.toISOString());
    var reporte = obtenerReporteIntegridad();
    var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
    var detectado = hallazgos.some(function(hallazgo) {
      return String(hallazgo.entidad || '').trim() === 'TAREA' &&
        String(hallazgo.registroId || '').trim() === registroId &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('PENDIENTE') !== -1 &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('FECHA_INICIO_REAL') !== -1;
    });
    console.log('OK hallazgo_pendiente_con_fecha_inicio_real=' + detectado);
    if (!detectado) errorFinal = new Error('F03_C03_NO_GO: IntegrityService no detecta TAREA Pendiente con FECHA_INICIO_REAL');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    if (filaObjetivo && valoresOriginales) {
      hoja.getRange(filaObjetivo, 1, 1, valoresOriginales.length).setValues([valoresOriginales]);
      SpreadsheetApp.flush();
      console.log('OK restauracion_completa=true');
      var reporteRestaurado = obtenerReporteIntegridad();
      var erroresRestaurados = reporteRestaurado && reporteRestaurado.funcional ? reporteRestaurado.funcional.errores || [] : [];
      var registroOriginalId = String(valoresOriginales[indices.ID] || "").trim();
      var persiste = erroresRestaurados.some(function(hallazgo) {
        return String(hallazgo.entidad || '').trim() === 'TAREA' &&
          String(hallazgo.registroId || '').trim() === registroOriginalId &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('PENDIENTE') !== -1 &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('FECHA_INICIO_REAL') !== -1;
      });
      console.log('OK integridad_restaurada=' + !persiste);
      if (persiste) errorFinal = errorFinal || new Error('F03_C03_ERROR: el hallazgo persiste tras restaurar la TAREA');
    }
  }
  console.log(errorFinal ? 'NEXT añadir_regla_integridad_Pendiente_Preparada_con_inicio_real' : 'NEXT auditar_En_proceso_sin_inicio_real');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC03_PreparadaConFechaInicioReal() {
  var packageName = 'F03_C03_PREPARADA_CON_FECHA_INICIO_REAL';
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('06_TAREAS');
  var filaObjetivo = null;
  var valoresOriginales = null;
  var indices = {};
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hoja) throw new Error('F03_C03_ERROR: no existe 06_TAREAS');
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();
    if (ultimaFila < 2) throw new Error('F03_C03_ERROR: 06_TAREAS no contiene registros');
    var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function(c) { return String(c || "").trim(); });
    ['ID', 'ESTADO', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'DURACION_REAL_DIAS', 'PORCENTAJE_AVANCE', 'ACTIVO'].forEach(function(campo) {
      indices[campo] = cabeceras.indexOf(campo);
      if (indices[campo] === -1) throw new Error('F03_C03_ERROR: falta columna ' + campo);
    });
    var filas = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
    for (var i = 0; i < filas.length; i++) {
      var id = String(filas[i][indices.ID] || '').trim();
      var activo = String(filas[i][indices.ACTIVO] || '').trim().toUpperCase();
      if (id && activo !== 'NO') { filaObjetivo = i + 2; valoresOriginales = filas[i].slice(); break; }
    }
    if (!filaObjetivo) throw new Error('F03_C03_ERROR: no existe una TAREA activa utilizable');
    var registroId = String(valoresOriginales[indices.ID] || '').trim();
    var fechaInicio = new Date(2026, 6, 2, 12, 0, 0);
    hoja.getRange(filaObjetivo, indices.ESTADO + 1).setValue('Preparada');
    hoja.getRange(filaObjetivo, indices.PORCENTAJE_AVANCE + 1).setValue(0);
    hoja.getRange(filaObjetivo, indices.FECHA_INICIO_REAL + 1).setValue(fechaInicio);
    hoja.getRange(filaObjetivo, indices.FECHA_FIN_REAL + 1).setValue('');
    hoja.getRange(filaObjetivo, indices.DURACION_REAL_DIAS + 1).setValue('');
    SpreadsheetApp.flush();
    console.log('OK registro_id=' + registroId);
    console.log('OK mutacion_directa_aplicada=true estado=Preparada fecha_inicio_real=' + fechaInicio.toISOString());
    var reporte = obtenerReporteIntegridad();
    var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
    var detectado = hallazgos.some(function(hallazgo) {
      return String(hallazgo.entidad || '').trim() === 'TAREA' &&
        String(hallazgo.registroId || '').trim() === registroId &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('PREPARADA') !== -1 &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('FECHA_INICIO_REAL') !== -1;
    });
    console.log('OK hallazgo_preparada_con_fecha_inicio_real=' + detectado);
    if (!detectado) errorFinal = new Error('F03_C03_NO_GO: IntegrityService no detecta TAREA Preparada con FECHA_INICIO_REAL');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    if (filaObjetivo && valoresOriginales) {
      hoja.getRange(filaObjetivo, 1, 1, valoresOriginales.length).setValues([valoresOriginales]);
      SpreadsheetApp.flush();
      console.log('OK restauracion_completa=true');
      var reporteRestaurado = obtenerReporteIntegridad();
      var erroresRestaurados = reporteRestaurado && reporteRestaurado.funcional ? reporteRestaurado.funcional.errores || [] : [];
      var registroOriginalId = String(valoresOriginales[indices.ID] || "").trim();
      var persiste = erroresRestaurados.some(function(hallazgo) {
        return String(hallazgo.entidad || '').trim() === 'TAREA' &&
          String(hallazgo.registroId || '').trim() === registroOriginalId &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('PREPARADA') !== -1 &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('FECHA_INICIO_REAL') !== -1;
      });
      console.log('OK integridad_restaurada=' + !persiste);
      if (persiste) errorFinal = errorFinal || new Error('F03_C03_ERROR: el hallazgo persiste tras restaurar la TAREA');
    }
  }
  console.log(errorFinal ? 'NEXT revisar_FUNC_TAREA_004' : 'NEXT cerrar_C03_A_y_commit');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC03_EnProcesoSinFechaInicioReal() {
  var packageName = 'F03_C03_EN_PROCESO_SIN_FECHA_INICIO_REAL';
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('06_TAREAS');
  var filaObjetivo = null;
  var valoresOriginales = null;
  var indices = {};
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hoja) throw new Error('F03_C03_ERROR: no existe 06_TAREAS');
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();
    if (ultimaFila < 2) throw new Error('F03_C03_ERROR: 06_TAREAS no contiene registros');
    var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function(c) { return String(c || "").trim(); });
    ['ID', 'ESTADO', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'DURACION_REAL_DIAS', 'PORCENTAJE_AVANCE', 'ACTIVO'].forEach(function(campo) {
      indices[campo] = cabeceras.indexOf(campo);
      if (indices[campo] === -1) throw new Error('F03_C03_ERROR: falta columna ' + campo);
    });
    var filas = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
    for (var i = 0; i < filas.length; i++) {
      var id = String(filas[i][indices.ID] || '').trim();
      var activo = String(filas[i][indices.ACTIVO] || '').trim().toUpperCase();
      if (id && activo !== 'NO') { filaObjetivo = i + 2; valoresOriginales = filas[i].slice(); break; }
    }
    if (!filaObjetivo) throw new Error('F03_C03_ERROR: no existe una TAREA activa utilizable');
    var registroId = String(valoresOriginales[indices.ID] || '').trim();
    hoja.getRange(filaObjetivo, indices.ESTADO + 1).setValue('En proceso');
    hoja.getRange(filaObjetivo, indices.PORCENTAJE_AVANCE + 1).setValue(50);
    hoja.getRange(filaObjetivo, indices.FECHA_INICIO_REAL + 1).setValue('');
    hoja.getRange(filaObjetivo, indices.FECHA_FIN_REAL + 1).setValue('');
    hoja.getRange(filaObjetivo, indices.DURACION_REAL_DIAS + 1).setValue('');
    SpreadsheetApp.flush();
    console.log('OK registro_id=' + registroId);
    console.log('OK mutacion_directa_aplicada=true estado=En proceso fecha_inicio_real=VACIA');
    var reporte = obtenerReporteIntegridad();
    var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
    var detectado = hallazgos.some(function(hallazgo) {
      return String(hallazgo.entidad || '').trim() === 'TAREA' &&
        String(hallazgo.registroId || '').trim() === registroId &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('EN PROCESO') !== -1 &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('FECHA_INICIO_REAL') !== -1;
    });
    console.log('OK hallazgo_en_proceso_sin_fecha_inicio_real=' + detectado);
    if (!detectado) errorFinal = new Error('F03_C03_NO_GO: IntegrityService no detecta TAREA En proceso sin FECHA_INICIO_REAL');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    if (filaObjetivo && valoresOriginales) {
      hoja.getRange(filaObjetivo, 1, 1, valoresOriginales.length).setValues([valoresOriginales]);
      SpreadsheetApp.flush();
      console.log('OK restauracion_completa=true');
      var reporteRestaurado = obtenerReporteIntegridad();
      var erroresRestaurados = reporteRestaurado && reporteRestaurado.funcional ? reporteRestaurado.funcional.errores || [] : [];
      var registroOriginalId = String(valoresOriginales[indices.ID] || "").trim();
      var persiste = erroresRestaurados.some(function(hallazgo) {
        return String(hallazgo.entidad || '').trim() === 'TAREA' &&
          String(hallazgo.registroId || '').trim() === registroOriginalId &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('EN PROCESO') !== -1 &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('FECHA_INICIO_REAL') !== -1;
      });
      console.log('OK integridad_restaurada=' + !persiste);
      if (persiste) errorFinal = errorFinal || new Error('F03_C03_ERROR: el hallazgo persiste tras restaurar la TAREA');
    }
  }
  console.log(errorFinal ? 'NEXT añadir_FUNC_TAREA_005' : 'NEXT cerrar_C03_B');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC03_TerminadaSinFechaInicioReal() {
  var packageName = 'F03_C03_TERMINADA_SIN_FECHA_INICIO_REAL';
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('06_TAREAS');
  var filaObjetivo = null;
  var valoresOriginales = null;
  var indices = {};
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hoja) throw new Error('F03_C03_ERROR: no existe 06_TAREAS');
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();
    if (ultimaFila < 2) throw new Error('F03_C03_ERROR: 06_TAREAS no contiene registros');
    var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function(c) { return String(c || "").trim(); });
    ['ID', 'ESTADO', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'DURACION_REAL_DIAS', 'PORCENTAJE_AVANCE', 'ACTIVO'].forEach(function(campo) {
      indices[campo] = cabeceras.indexOf(campo);
      if (indices[campo] === -1) throw new Error('F03_C03_ERROR: falta columna ' + campo);
    });
    var filas = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
    for (var i = 0; i < filas.length; i++) {
      var id = String(filas[i][indices.ID] || '').trim();
      var activo = String(filas[i][indices.ACTIVO] || '').trim().toUpperCase();
      if (id && activo !== 'NO') { filaObjetivo = i + 2; valoresOriginales = filas[i].slice(); break; }
    }
    if (!filaObjetivo) throw new Error('F03_C03_ERROR: no existe una TAREA activa utilizable');
    var registroId = String(valoresOriginales[indices.ID] || '').trim();
    var fechaFin = new Date(2026, 6, 3, 12, 0, 0);
    hoja.getRange(filaObjetivo, indices.ESTADO + 1).setValue('Terminada');
    hoja.getRange(filaObjetivo, indices.PORCENTAJE_AVANCE + 1).setValue(100);
    hoja.getRange(filaObjetivo, indices.FECHA_INICIO_REAL + 1).setValue('');
    hoja.getRange(filaObjetivo, indices.FECHA_FIN_REAL + 1).setValue(fechaFin);
    hoja.getRange(filaObjetivo, indices.DURACION_REAL_DIAS + 1).setValue(1);
    SpreadsheetApp.flush();
    console.log('OK registro_id=' + registroId);
    console.log('OK mutacion_directa_aplicada=true estado=Terminada fecha_inicio_real=VACIA fecha_fin_real=' + fechaFin.toISOString() + ' duracion_real_dias=1 porcentaje_avance=100');
    var reporte = obtenerReporteIntegridad();
    var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
    var detectado = hallazgos.some(function(hallazgo) {
      return String(hallazgo.entidad || '').trim() === 'TAREA' &&
        String(hallazgo.registroId || '').trim() === registroId &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('TERMINADA') !== -1 &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('FECHA_INICIO_REAL') !== -1;
    });
    console.log('OK hallazgo_terminada_sin_fecha_inicio_real=' + detectado);
    if (!detectado) errorFinal = new Error('F03_C03_NO_GO: IntegrityService no detecta TAREA Terminada sin FECHA_INICIO_REAL');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    if (filaObjetivo && valoresOriginales) {
      hoja.getRange(filaObjetivo, 1, 1, valoresOriginales.length).setValues([valoresOriginales]);
      SpreadsheetApp.flush();
      console.log('OK restauracion_completa=true');
      var reporteRestaurado = obtenerReporteIntegridad();
      var erroresRestaurados = reporteRestaurado && reporteRestaurado.funcional ? reporteRestaurado.funcional.errores || [] : [];
      var registroOriginalId = String(valoresOriginales[indices.ID] || "").trim();
      var persiste = erroresRestaurados.some(function(hallazgo) {
        return String(hallazgo.entidad || '').trim() === 'TAREA' &&
          String(hallazgo.registroId || '').trim() === registroOriginalId &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('TERMINADA') !== -1 &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('FECHA_INICIO_REAL') !== -1;
      });
      console.log('OK integridad_restaurada=' + !persiste);
      if (persiste) errorFinal = errorFinal || new Error('F03_C03_ERROR: el hallazgo persiste tras restaurar la TAREA');
    }
  }
  console.log(errorFinal ? 'NEXT añadir_FUNC_TAREA_006' : 'NEXT cerrar_C03_C');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC03_TerminadaSinFechaFinReal() {
  var packageName = 'F03_C03_TERMINADA_SIN_FECHA_FIN_REAL';
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('06_TAREAS');
  var filaObjetivo = null;
  var valoresOriginales = null;
  var indices = {};
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hoja) throw new Error('F03_C03_ERROR: no existe 06_TAREAS');
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();
    if (ultimaFila < 2) throw new Error('F03_C03_ERROR: 06_TAREAS no contiene registros');
    var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function(c) { return String(c || "").trim(); });
    ['ID', 'ESTADO', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'DURACION_REAL_DIAS', 'PORCENTAJE_AVANCE', 'ACTIVO'].forEach(function(campo) {
      indices[campo] = cabeceras.indexOf(campo);
      if (indices[campo] === -1) throw new Error('F03_C03_ERROR: falta columna ' + campo);
    });
    var filas = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
    for (var i = 0; i < filas.length; i++) {
      var id = String(filas[i][indices.ID] || '').trim();
      var activo = String(filas[i][indices.ACTIVO] || '').trim().toUpperCase();
      if (id && activo !== 'NO') { filaObjetivo = i + 2; valoresOriginales = filas[i].slice(); break; }
    }
    if (!filaObjetivo) throw new Error('F03_C03_ERROR: no existe una TAREA activa utilizable');
    var registroId = String(valoresOriginales[indices.ID] || '').trim();
    var fechaInicio = new Date(2026, 6, 2, 12, 0, 0);
    hoja.getRange(filaObjetivo, indices.ESTADO + 1).setValue('Terminada');
    hoja.getRange(filaObjetivo, indices.PORCENTAJE_AVANCE + 1).setValue(100);
    hoja.getRange(filaObjetivo, indices.FECHA_INICIO_REAL + 1).setValue(fechaInicio);
    hoja.getRange(filaObjetivo, indices.FECHA_FIN_REAL + 1).setValue('');
    hoja.getRange(filaObjetivo, indices.DURACION_REAL_DIAS + 1).setValue(1);
    SpreadsheetApp.flush();
    console.log('OK registro_id=' + registroId);
    console.log('OK mutacion_directa_aplicada=true estado=Terminada fecha_inicio_real=' + fechaInicio.toISOString() + ' fecha_fin_real=VACIA duracion_real_dias=1 porcentaje_avance=100');
    var reporte = obtenerReporteIntegridad();
    var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
    var detectado = hallazgos.some(function(hallazgo) {
      return String(hallazgo.entidad || '').trim() === 'TAREA' &&
        String(hallazgo.registroId || '').trim() === registroId &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('TERMINADA') !== -1 &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('FECHA_FIN_REAL') !== -1;
    });
    console.log('OK hallazgo_terminada_sin_fecha_fin_real=' + detectado);
    if (!detectado) errorFinal = new Error('F03_C03_NO_GO: IntegrityService no detecta TAREA Terminada sin FECHA_FIN_REAL');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    if (filaObjetivo && valoresOriginales) {
      hoja.getRange(filaObjetivo, 1, 1, valoresOriginales.length).setValues([valoresOriginales]);
      SpreadsheetApp.flush();
      console.log('OK restauracion_completa=true');
      var reporteRestaurado = obtenerReporteIntegridad();
      var erroresRestaurados = reporteRestaurado && reporteRestaurado.funcional ? reporteRestaurado.funcional.errores || [] : [];
      var registroOriginalId = String(valoresOriginales[indices.ID] || "").trim();
      var persiste = erroresRestaurados.some(function(hallazgo) {
        return String(hallazgo.entidad || '').trim() === 'TAREA' &&
          String(hallazgo.registroId || '').trim() === registroOriginalId &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('TERMINADA') !== -1 &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('FECHA_FIN_REAL') !== -1;
      });
      console.log('OK integridad_restaurada=' + !persiste);
      if (persiste) errorFinal = errorFinal || new Error('F03_C03_ERROR: el hallazgo persiste tras restaurar la TAREA');
    }
  }
  console.log(errorFinal ? 'NEXT añadir_FUNC_TAREA_007' : 'NEXT cerrar_C03_D');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC03_TerminadaSinDuracionReal() {
  var packageName = 'F03_C03_TERMINADA_SIN_DURACION_REAL';
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('06_TAREAS');
  var filaObjetivo = null;
  var valoresOriginales = null;
  var indices = {};
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hoja) throw new Error('F03_C03_ERROR: no existe 06_TAREAS');
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();
    if (ultimaFila < 2) throw new Error('F03_C03_ERROR: 06_TAREAS no contiene registros');
    var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function(c) { return String(c || "").trim(); });
    ['ID', 'ESTADO', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'DURACION_REAL_DIAS', 'PORCENTAJE_AVANCE', 'ACTIVO'].forEach(function(campo) {
      indices[campo] = cabeceras.indexOf(campo);
      if (indices[campo] === -1) throw new Error('F03_C03_ERROR: falta columna ' + campo);
    });
    var filas = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
    for (var i = 0; i < filas.length; i++) {
      var id = String(filas[i][indices.ID] || '').trim();
      var activo = String(filas[i][indices.ACTIVO] || '').trim().toUpperCase();
      if (id && activo !== 'NO') { filaObjetivo = i + 2; valoresOriginales = filas[i].slice(); break; }
    }
    if (!filaObjetivo) throw new Error('F03_C03_ERROR: no existe una TAREA activa utilizable');
    var registroId = String(valoresOriginales[indices.ID] || '').trim();
    var fechaInicio = new Date(2026, 6, 2, 12, 0, 0);
    var fechaFin = new Date(2026, 6, 3, 12, 0, 0);
    hoja.getRange(filaObjetivo, indices.ESTADO + 1).setValue('Terminada');
    hoja.getRange(filaObjetivo, indices.PORCENTAJE_AVANCE + 1).setValue(100);
    hoja.getRange(filaObjetivo, indices.FECHA_INICIO_REAL + 1).setValue(fechaInicio);
    hoja.getRange(filaObjetivo, indices.FECHA_FIN_REAL + 1).setValue(fechaFin);
    hoja.getRange(filaObjetivo, indices.DURACION_REAL_DIAS + 1).setValue('');
    SpreadsheetApp.flush();
    console.log('OK registro_id=' + registroId);
    console.log('OK mutacion_directa_aplicada=true estado=Terminada fecha_inicio_real=' + fechaInicio.toISOString() + ' fecha_fin_real=' + fechaFin.toISOString() + ' duracion_real_dias=VACIA porcentaje_avance=100');
    var reporte = obtenerReporteIntegridad();
    var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
    var detectado = hallazgos.some(function(hallazgo) {
      return String(hallazgo.entidad || '').trim() === 'TAREA' &&
        String(hallazgo.registroId || '').trim() === registroId &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('TERMINADA') !== -1 &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('DURACION_REAL_DIAS') !== -1;
    });
    console.log('OK hallazgo_terminada_sin_duracion_real=' + detectado);
    if (!detectado) errorFinal = new Error('F03_C03_NO_GO: IntegrityService no detecta TAREA Terminada sin DURACION_REAL_DIAS');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    if (filaObjetivo && valoresOriginales) {
      hoja.getRange(filaObjetivo, 1, 1, valoresOriginales.length).setValues([valoresOriginales]);
      SpreadsheetApp.flush();
      console.log('OK restauracion_completa=true');
      var reporteRestaurado = obtenerReporteIntegridad();
      var erroresRestaurados = reporteRestaurado && reporteRestaurado.funcional ? reporteRestaurado.funcional.errores || [] : [];
      var registroOriginalId = String(valoresOriginales[indices.ID] || "").trim();
      var persiste = erroresRestaurados.some(function(hallazgo) {
        return String(hallazgo.entidad || '').trim() === 'TAREA' &&
          String(hallazgo.registroId || '').trim() === registroOriginalId &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('TERMINADA') !== -1 &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('DURACION_REAL_DIAS') !== -1;
      });
      console.log('OK integridad_restaurada=' + !persiste);
      if (persiste) errorFinal = errorFinal || new Error('F03_C03_ERROR: el hallazgo persiste tras restaurar la TAREA');
    }
  }
  console.log(errorFinal ? 'NEXT añadir_FUNC_TAREA_008' : 'NEXT cerrar_C03_E');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC04_DuracionRealInvalidaTarea() {
  var packageName = 'F03_C04_DURACION_REAL_INVALIDA_TAREA';
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('06_TAREAS');
  var filaObjetivo = null;
  var valoresOriginales = null;
  var indices = {};
  var errorFinal = null;
  var resultados = [];
  var celdaDuracion = null;
  var validacionDuracionOriginal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hoja) throw new Error('F03_C04_ERROR: no existe 06_TAREAS');
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();
    if (ultimaFila < 2) throw new Error('F03_C04_ERROR: 06_TAREAS no contiene registros');
    var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function(c) { return String(c || "").trim(); });
    ['ID', 'ESTADO', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'DURACION_REAL_DIAS', 'PORCENTAJE_AVANCE', 'ACTIVO'].forEach(function(campo) {
      indices[campo] = cabeceras.indexOf(campo);
      if (indices[campo] === -1) throw new Error('F03_C04_ERROR: falta columna ' + campo);
    });
    var filas = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
    for (var i = 0; i < filas.length; i++) {
      var id = String(filas[i][indices.ID] || '').trim();
      var activo = String(filas[i][indices.ACTIVO] || '').trim().toUpperCase();
      if (id && activo !== 'NO') { filaObjetivo = i + 2; valoresOriginales = filas[i].slice(); break; }
    }
    if (!filaObjetivo) throw new Error('F03_C04_ERROR: no existe una TAREA activa utilizable');
    var registroId = String(valoresOriginales[indices.ID] || '').trim();
    var fechaInicio = new Date(2026, 6, 2, 12, 0, 0);
    var fechaFin = new Date(2026, 6, 3, 12, 0, 0);
    hoja.getRange(filaObjetivo, indices.ESTADO + 1).setValue('Terminada');
    hoja.getRange(filaObjetivo, indices.PORCENTAJE_AVANCE + 1).setValue(100);
    hoja.getRange(filaObjetivo, indices.FECHA_INICIO_REAL + 1).setValue(fechaInicio);
    hoja.getRange(filaObjetivo, indices.FECHA_FIN_REAL + 1).setValue(fechaFin);
    celdaDuracion = hoja.getRange(filaObjetivo, indices.DURACION_REAL_DIAS + 1);
    validacionDuracionOriginal = celdaDuracion.getDataValidation();
    celdaDuracion.clearDataValidations();
    console.log('OK validacion_duracion_suspendida=true');
    var casos = [
      { nombre: 'CERO', valor: 0 },
      { nombre: 'NEGATIVA', valor: -1 },
      { nombre: 'NO_NUMERICA', valor: 'INVALIDA' }
    ];
    console.log("OK registro_id=" + registroId);
    casos.forEach(function(caso) {
      hoja.getRange(filaObjetivo, indices.DURACION_REAL_DIAS + 1).setValue(caso.valor);
      SpreadsheetApp.flush();
      var reporte = obtenerReporteIntegridad();
      var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
      var detectado = hallazgos.some(function(hallazgo) {
        return String(hallazgo.entidad || '').trim() === 'TAREA' &&
          String(hallazgo.registroId || '').trim() === registroId &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('DURACION_REAL_DIAS') !== -1;
      });
      resultados.push({ caso: caso.nombre, detectado: detectado });
      console.log('OK caso=' + caso.nombre + ' valor=' + caso.valor + ' hallazgo_duracion_real_invalida=' + detectado);
    });
    var todosDetectados = resultados.every(function(resultado) { return resultado.detectado; });
    console.log('OK todos_los_casos_detectados=' + todosDetectados);
    if (!todosDetectados) errorFinal = new Error('F03_C04_NO_GO: IntegrityService no detecta todos los casos de DURACION_REAL_DIAS inválida');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    if (filaObjetivo && valoresOriginales) {
      hoja.getRange(filaObjetivo, 1, 1, valoresOriginales.length).setValues([valoresOriginales]);
      if (celdaDuracion) {
        if (validacionDuracionOriginal) {
          celdaDuracion.setDataValidation(validacionDuracionOriginal);
        } else {
          celdaDuracion.clearDataValidations();
        }
      }
      SpreadsheetApp.flush();
      console.log('OK validacion_duracion_restaurada=true');
      console.log('OK restauracion_completa=true');
      var reporteRestaurado = obtenerReporteIntegridad();
      var erroresRestaurados = reporteRestaurado && reporteRestaurado.funcional ? reporteRestaurado.funcional.errores || [] : [];
      var registroOriginalId = String(valoresOriginales[indices.ID] || "").trim();
      var persiste = erroresRestaurados.some(function(hallazgo) {
        return String(hallazgo.entidad || '').trim() === 'TAREA' &&
          String(hallazgo.registroId || '').trim() === registroOriginalId &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('DURACION_REAL_DIAS') !== -1;
      });
      console.log('OK integridad_restaurada=' + !persiste);
      if (persiste) errorFinal = errorFinal || new Error('F03_C04_ERROR: el hallazgo persiste tras restaurar la TAREA');
    }
  }
  console.log(errorFinal ? 'NEXT añadir_FUNC_TAREA_009' : 'NEXT cerrar_C04');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC04B_TerminadaSinDuracionReal() {
  var packageName = 'F03_C04_B_TERMINADA_SIN_DURACION_REAL';
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('06_TAREAS');
  var filaObjetivo = null;
  var valoresOriginales = null;
  var indices = {};
  var errorFinal = null;
  var celdaDuracion = null;
  var validacionDuracionOriginal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hoja) throw new Error('F03_C04_B_ERROR: no existe 06_TAREAS');
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();
    if (ultimaFila < 2) throw new Error('F03_C04_B_ERROR: 06_TAREAS no contiene registros');
    var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function(c) { return String(c || "").trim(); });
    ['ID', 'ESTADO', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'DURACION_REAL_DIAS', 'PORCENTAJE_AVANCE', 'ACTIVO'].forEach(function(campo) {
      indices[campo] = cabeceras.indexOf(campo);
      if (indices[campo] === -1) throw new Error('F03_C04_B_ERROR: falta columna ' + campo);
    });
    var filas = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
    for (var i = 0; i < filas.length; i++) {
      var id = String(filas[i][indices.ID] || '').trim();
      var activo = String(filas[i][indices.ACTIVO] || '').trim().toUpperCase();
      if (id && activo !== 'NO') { filaObjetivo = i + 2; valoresOriginales = filas[i].slice(); break; }
    }
    if (!filaObjetivo) throw new Error('F03_C04_B_ERROR: no existe una TAREA activa utilizable');
    var registroId = String(valoresOriginales[indices.ID] || '').trim();
    var fechaInicio = new Date(2026, 6, 2, 12, 0, 0);
    var fechaFin = new Date(2026, 6, 3, 12, 0, 0);
    hoja.getRange(filaObjetivo, indices.ESTADO + 1).setValue('Terminada');
    hoja.getRange(filaObjetivo, indices.PORCENTAJE_AVANCE + 1).setValue(100);
    hoja.getRange(filaObjetivo, indices.FECHA_INICIO_REAL + 1).setValue(fechaInicio);
    hoja.getRange(filaObjetivo, indices.FECHA_FIN_REAL + 1).setValue(fechaFin);
    celdaDuracion = hoja.getRange(filaObjetivo, indices.DURACION_REAL_DIAS + 1);
    validacionDuracionOriginal = celdaDuracion.getDataValidation();
    celdaDuracion.clearDataValidations();
    celdaDuracion.setValue('');
    SpreadsheetApp.flush();
    console.log('OK registro_id=' + registroId);
    console.log('OK mutacion_directa_aplicada=true estado=Terminada duracion_real_dias=VACIA porcentaje_avance=100');
    var reporte = obtenerReporteIntegridad();
    var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
    var detectado = hallazgos.some(function(hallazgo) {
      return String(hallazgo.entidad || '').trim() === 'TAREA' &&
        String(hallazgo.registroId || '').trim() === registroId &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('TERMINADA') !== -1 &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('DURACION_REAL_DIAS') !== -1;
    });
    console.log('OK hallazgo_terminada_sin_duracion_real=' + detectado);
    if (!detectado) errorFinal = new Error('F03_C04_B_NO_GO: IntegrityService no detecta TAREA Terminada sin DURACION_REAL_DIAS (valor vacio, FUNC-TAREA-008)');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    if (filaObjetivo && valoresOriginales) {
      hoja.getRange(filaObjetivo, 1, 1, valoresOriginales.length).setValues([valoresOriginales]);
      if (celdaDuracion) {
        if (validacionDuracionOriginal) {
          celdaDuracion.setDataValidation(validacionDuracionOriginal);
        } else {
          celdaDuracion.clearDataValidations();
        }
      }
      SpreadsheetApp.flush();
      console.log('OK validacion_duracion_restaurada=true');
      console.log('OK restauracion_completa=true');
      var reporteRestaurado = obtenerReporteIntegridad();
      var erroresRestaurados = reporteRestaurado && reporteRestaurado.funcional ? reporteRestaurado.funcional.errores || [] : [];
      var registroOriginalId = String(valoresOriginales[indices.ID] || "").trim();
      var persiste = erroresRestaurados.some(function(hallazgo) {
        return String(hallazgo.entidad || '').trim() === 'TAREA' &&
          String(hallazgo.registroId || '').trim() === registroOriginalId &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('TERMINADA') !== -1 &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('DURACION_REAL_DIAS') !== -1;
      });
      console.log('OK integridad_restaurada=' + !persiste);
      if (persiste) errorFinal = errorFinal || new Error('F03_C04_B_ERROR: el hallazgo persiste tras restaurar la TAREA');
    }
  }
  console.log(errorFinal ? 'NEXT revisar_FUNC_TAREA_008' : 'NEXT cerrar_C04_B');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC05A_TareaPredecesoraHuerfana() {
  var packageName = 'F03_C05_A_TAREA_PREDECESORA_HUERFANA';
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('06_TAREAS');
  var filaObjetivo = null;
  var valoresOriginales = null;
  var indices = {};
  var celdaPredecesora = null;
  var validacionOriginal = null;
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hoja) throw new Error('F03_C05_A_ERROR: no existe 06_TAREAS');
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();
    if (ultimaFila < 2) throw new Error('F03_C05_A_ERROR: 06_TAREAS no contiene registros');
    var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function(c) { return String(c || "").trim(); });
    ['ID', 'PROCESO_ID', 'ORDEN_SECUENCIA', 'TAREA_PREDECESORA_ID', 'ACTIVO'].forEach(function(campo) {
      indices[campo] = cabeceras.indexOf(campo);
      if (indices[campo] === -1) throw new Error('F03_C05_A_ERROR: falta columna ' + campo);
    });
    var filas = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
    for (var i = 0; i < filas.length; i++) {
      var id = String(filas[i][indices.ID] || '').trim();
      var procesoId = String(filas[i][indices.PROCESO_ID] || '').trim();
      var activo = String(filas[i][indices.ACTIVO] || '').trim().toUpperCase();
      if (id && procesoId && activo !== 'NO') { filaObjetivo = i + 2; valoresOriginales = filas[i].slice(); break; }
    }
    if (!filaObjetivo) throw new Error('F03_C05_A_ERROR: no existe una TAREA activa utilizable');
    var registroId = String(valoresOriginales[indices.ID] || '').trim();
    var idHuerfano = 'TAR-INEXISTENTE-C05';
    celdaPredecesora = hoja.getRange(filaObjetivo, indices.TAREA_PREDECESORA_ID + 1);
    validacionOriginal = celdaPredecesora.getDataValidation();
    celdaPredecesora.clearDataValidations();
    console.log('OK validacion_predecesora_suspendida=true');
    celdaPredecesora.setValue(idHuerfano);
    SpreadsheetApp.flush();
    console.log('OK registro_id=' + registroId);
    console.log('OK mutacion_directa_aplicada=true tarea_predecesora_id=' + idHuerfano);
    var reporte = obtenerReporteIntegridad();
    var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
    var detectado = hallazgos.some(function(hallazgo) {
      return String(hallazgo.entidad || '').trim() === 'TAREA' &&
        String(hallazgo.registroId || '').trim() === registroId &&
        String(hallazgo.descripcion || '').toUpperCase().indexOf('TAREA_PREDECESORA_ID') !== -1;
    });
    console.log('OK hallazgo_predecesora_huerfana=' + detectado);
    if (!detectado) errorFinal = new Error('F03_C05_A_NO_GO: IntegrityService no detecta TAREA_PREDECESORA_ID huérfana');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    if (filaObjetivo && valoresOriginales) {
      hoja.getRange(filaObjetivo, 1, 1, valoresOriginales.length).setValues([valoresOriginales]);
      if (celdaPredecesora) {
        if (validacionOriginal) {
          celdaPredecesora.setDataValidation(validacionOriginal);
        } else {
          celdaPredecesora.clearDataValidations();
        }
      }
      SpreadsheetApp.flush();
      console.log('OK validacion_predecesora_restaurada=true');
      console.log('OK restauracion_completa=true');
      var reporteRestaurado = obtenerReporteIntegridad();
      var hallazgosRestaurados = [].concat(reporteRestaurado.funcional.errores || [], reporteRestaurado.funcional.advertencias || [], reporteRestaurado.funcional.informacion || []);
      var registroOriginalId = String(valoresOriginales[indices.ID] || '').trim();
      var persiste = hallazgosRestaurados.some(function(hallazgo) {
        return String(hallazgo.entidad || '').trim() === 'TAREA' &&
          String(hallazgo.registroId || '').trim() === registroOriginalId &&
          String(hallazgo.descripcion || '').toUpperCase().indexOf('TAREA_PREDECESORA_ID') !== -1;
      });
      console.log('OK integridad_restaurada=' + !persiste);
      if (persiste) errorFinal = errorFinal || new Error('F03_C05_A_ERROR: el hallazgo persiste tras restaurar la TAREA');
    }
  }
  console.log(errorFinal ? 'NEXT añadir_FUNC_TAREA_010' : 'NEXT cerrar_C05_A');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function inspeccionarFixtureC05B_TareasProcesosDistintos() {
  var packageName = 'F03_C05_B_INSPECT_CROSS_PROCESS_TASK_FIXTURE';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('06_TAREAS');
  if (!hoja) {
    throw new Error('F03_C05_B_ERROR: no existe 06_TAREAS');
  }

  var ultimaFila = hoja.getLastRow();
  var ultimaColumna = hoja.getLastColumn();

  if (ultimaFila < 2) {
    throw new Error('F03_C05_B_ERROR: 06_TAREAS no contiene registros');
  }

  var cabeceras = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0]
    .map(function(c) {
      return String(c || '').trim();
    });

  var indiceId = cabeceras.indexOf('ID');
  var indiceProceso = cabeceras.indexOf('PROCESO_ID');
  var indiceOrden = cabeceras.indexOf('ORDEN_SECUENCIA');
  var indiceActivo = cabeceras.indexOf('ACTIVO');

  if (
    indiceId === -1 ||
    indiceProceso === -1 ||
    indiceOrden === -1 ||
    indiceActivo === -1
  ) {
    throw new Error('F03_C05_B_ERROR: faltan columnas necesarias');
  }

  var filas = hoja
    .getRange(2, 1, ultimaFila - 1, ultimaColumna)
    .getDisplayValues();

  var tareas = filas
    .map(function(fila, indice) {
      return {
        fila: indice + 2,
        id: String(fila[indiceId] || '').trim(),
        procesoId: String(fila[indiceProceso] || '').trim(),
        orden: String(fila[indiceOrden] || '').trim(),
        activo: String(fila[indiceActivo] || '').trim().toUpperCase()
      };
    })
    .filter(function(tarea) {
      return (
        tarea.id &&
        tarea.procesoId &&
        tarea.activo !== 'NO'
      );
    });

  var procesos = {};
  tareas.forEach(function(tarea) {
    procesos[tarea.procesoId] = procesos[tarea.procesoId] || [];
    procesos[tarea.procesoId].push(tarea);
  });

  var procesosIds = Object.keys(procesos);

  console.log('OK tareas_activas_utilizables=' + tareas.length);
  console.log('OK procesos_con_tareas=' + procesosIds.length);

  procesosIds.forEach(function(procesoId) {
    console.log(
      'OK proceso_id=' +
        procesoId +
        ' tareas=' +
        procesos[procesoId]
          .map(function(tarea) {
            return tarea.id + ':orden=' + tarea.orden;
          })
          .join(',')
    );
  });

  if (procesosIds.length < 2) {
    console.log('NEXT crear_fixture_controlado_C05_B');
    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' status=NO_GO'
    );
    throw new Error(
      'F03_C05_B_NO_GO: no existen tareas activas en dos procesos diferentes'
    );
  }

  var tareaObjetivo = procesos[procesosIds[0]][0];
  var tareaOtroProceso = procesos[procesosIds[1]][0];

  console.log(
    'OK tarea_objetivo=' +
      tareaObjetivo.id +
      ' proceso=' +
      tareaObjetivo.procesoId +
      ' fila=' +
      tareaObjetivo.fila
  );

  console.log(
    'OK tarea_predecesora_otro_proceso=' +
      tareaOtroProceso.id +
      ' proceso=' +
      tareaOtroProceso.procesoId +
      ' fila=' +
      tareaOtroProceso.fila
  );

  console.log('OK fixture_cross_process_ready=true');
  console.log('NEXT diseñar_diagnostico_C05_B');
  console.log(
    'ENGREMIAT_PACKAGE_END package=' +
      packageName +
      ' status=OK'
  );

  return true;
}
function inspeccionarFixtureC05B_ProcesosDisponibles() {
  var packageName = 'F03_C05_B_INSPECT_AVAILABLE_PROCESSES';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaProcesos = ss.getSheetByName('05_PROCESOS');
  var hojaTareas = ss.getSheetByName('06_TAREAS');
  if (!hojaProcesos || !hojaTareas) {
    throw new Error('F03_C05_B_ERROR: faltan 05_PROCESOS o 06_TAREAS');
  }
  function leerHoja(hoja) {
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();
    if (ultimaFila < 1 || ultimaColumna < 1) return {cabeceras: [], filas: []};
    var valores = hoja.getRange(1, 1, ultimaFila, ultimaColumna).getDisplayValues();
    return {
      cabeceras: valores[0].map(function(c) { return String(c || '').trim(); }),
      filas: valores.slice(1)
    };
  }
  var procesosData = leerHoja(hojaProcesos);
  var tareasData = leerHoja(hojaTareas);
  var pId = procesosData.cabeceras.indexOf('ID');
  var pProducto = procesosData.cabeceras.indexOf('PRODUCTO_ID');
  var pNombre = procesosData.cabeceras.indexOf('NOMBRE');
  var pEstado = procesosData.cabeceras.indexOf('ESTADO');
  var pActivo = procesosData.cabeceras.indexOf('ACTIVO');
  var tProceso = tareasData.cabeceras.indexOf('PROCESO_ID');
  var tActivo = tareasData.cabeceras.indexOf('ACTIVO');
  if (pId === -1 || pProducto === -1 || pActivo === -1 || tProceso === -1 || tActivo === -1) {
    throw new Error('F03_C05_B_ERROR: faltan columnas necesarias');
  }
  var tareasActivasPorProceso = {};
  tareasData.filas.forEach(function(fila) {
    var activo = String(fila[tActivo] || '').trim().toUpperCase();
    var procesoId = String(fila[tProceso] || '').trim();
    if (procesoId && activo !== 'NO') {
      tareasActivasPorProceso[procesoId] = (tareasActivasPorProceso[procesoId] || 0) + 1;
    }
  });
  var procesosActivos = procesosData.filas.map(function(fila, indice) {
    return {
      fila: indice + 2,
      id: String(fila[pId] || '').trim(),
      productoId: String(fila[pProducto] || '').trim(),
      nombre: pNombre === -1 ? '' : String(fila[pNombre] || '').trim(),
      estado: pEstado === -1 ? '' : String(fila[pEstado] || '').trim(),
      activo: String(fila[pActivo] || '').trim().toUpperCase()
    };
  }).filter(function(proceso) {
    return proceso.id && proceso.productoId && proceso.activo !== 'NO';
  });
  console.log('OK procesos_activos=' + procesosActivos.length);
  procesosActivos.forEach(function(proceso) {
    console.log(
      'OK proceso_id=' + proceso.id +
      ' producto_id=' + proceso.productoId +
      ' estado=' + proceso.estado +
      ' tareas_activas=' + (tareasActivasPorProceso[proceso.id] || 0) +
      ' fila=' + proceso.fila +
      ' nombre=' + proceso.nombre
    );
  });
  var procesosAlternativos = procesosActivos.filter(function(proceso) {
    return proceso.id !== 'PCS-0001';
  });
  console.log('OK procesos_alternativos=' + procesosAlternativos.length);
  if (procesosAlternativos.length === 0) {
    console.log('NEXT crear_proceso_y_tarea_temporales_C05_B');
    console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=NO_GO');
    throw new Error('F03_C05_B_NO_GO: no existe un segundo proceso activo utilizable');
  }
  console.log('OK proceso_alternativo_id=' + procesosAlternativos[0].id);
  console.log('OK fixture_process_ready=true');
  console.log('NEXT crear_tarea_temporal_en_proceso_alternativo_C05_B');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}
function auditarFaseC05B_PredecessoraOtroProceso() {
  var packageName = 'F03_C05_B_PREDECESORA_OTRO_PROCESO';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaProcesos = ss.getSheetByName('05_PROCESOS');
  var hojaTareas = ss.getSheetByName('06_TAREAS');
  var filaProcesoTemporal = null;
  var filasTareaRestaurar = [];
  var validacionesRestaurar = [];
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hojaProcesos || !hojaTareas) throw new Error('F03_C05_B_ERROR: faltan 05_PROCESOS o 06_TAREAS');
    function leerCabeceras(hoja) {
      return hoja.getRange(1, 1, 1, hoja.getLastColumn()).getDisplayValues()[0].map(function(c) { return String(c || '').trim(); });
    }
    var cabecerasProcesos = leerCabeceras(hojaProcesos);
    var cabecerasTareas = leerCabeceras(hojaTareas);
    var pId = cabecerasProcesos.indexOf('ID');
    var tId = cabecerasTareas.indexOf('ID');
    var tProceso = cabecerasTareas.indexOf('PROCESO_ID');
    var tOrden = cabecerasTareas.indexOf('ORDEN_SECUENCIA');
    var tPredecesora = cabecerasTareas.indexOf('TAREA_PREDECESORA_ID');
    var tActivo = cabecerasTareas.indexOf('ACTIVO');
    if (pId === -1 || tId === -1 || tProceso === -1 || tOrden === -1 || tPredecesora === -1 || tActivo === -1) throw new Error('F03_C05_B_ERROR: faltan columnas necesarias');
    if (hojaProcesos.getLastRow() < 2 || hojaTareas.getLastRow() < 3) throw new Error('F03_C05_B_ERROR: faltan registros base');
    var procesos = hojaProcesos.getRange(2, 1, hojaProcesos.getLastRow() - 1, hojaProcesos.getLastColumn()).getValues();
    var tareas = hojaTareas.getRange(2, 1, hojaTareas.getLastRow() - 1, hojaTareas.getLastColumn()).getValues();
    var procesoBase = null;
    for (var i = 0; i < procesos.length; i++) {
      if (String(procesos[i][pId] || '').trim() === 'PCS-0001') { procesoBase = procesos[i].slice(); break; }
    }
    if (!procesoBase) throw new Error('F03_C05_B_ERROR: no existe PCS-0001');
    var tareaAnterior = null;
    var tareaDependiente = null;
    for (var j = 0; j < tareas.length; j++) {
      var tareaId = String(tareas[j][tId] || '').trim();
      var activa = String(tareas[j][tActivo] || '').trim().toUpperCase() !== 'NO';
      if (tareaId === 'TAR-0001' && activa) tareaAnterior = {fila: j + 2, valores: tareas[j].slice()};
      if (tareaId === 'TAR-0002' && activa) tareaDependiente = {fila: j + 2, valores: tareas[j].slice()};
    }
    if (!tareaAnterior || !tareaDependiente) throw new Error('F03_C05_B_ERROR: faltan TAR-0001 o TAR-0002 activas');
    if (Number(tareaAnterior.valores[tOrden]) >= Number(tareaDependiente.valores[tOrden])) throw new Error('F03_C05_B_ERROR: el orden base no permite aislar la prueba');
    var procesoTemporalId = 'PCS-AUD-C05B';
    var existenteTemporal = procesos.some(function(fila) { return String(fila[pId] || '').trim() === procesoTemporalId; });
    if (existenteTemporal) throw new Error('F03_C05_B_ERROR: ya existe ' + procesoTemporalId);
    procesoBase[pId] = procesoTemporalId;
    hojaProcesos.appendRow(procesoBase);
    filaProcesoTemporal = hojaProcesos.getLastRow();
    console.log('OK proceso_temporal_creado=' + procesoTemporalId + ' fila=' + filaProcesoTemporal);
    filasTareaRestaurar.push(tareaAnterior, tareaDependiente);
    [tareaAnterior, tareaDependiente].forEach(function(tarea) {
      var celdaProceso = hojaTareas.getRange(tarea.fila, tProceso + 1);
      var celdaPredecesora = hojaTareas.getRange(tarea.fila, tPredecesora + 1);
      validacionesRestaurar.push({celda: celdaProceso, validacion: celdaProceso.getDataValidation()});
      validacionesRestaurar.push({celda: celdaPredecesora, validacion: celdaPredecesora.getDataValidation()});
      celdaProceso.clearDataValidations();
      celdaPredecesora.clearDataValidations();
    });
    hojaTareas.getRange(tareaAnterior.fila, tProceso + 1).setValue(procesoTemporalId);
    hojaTareas.getRange(tareaDependiente.fila, tPredecesora + 1).setValue('TAR-0001');
    SpreadsheetApp.flush();
    console.log('OK mutacion_directa_aplicada=true tarea_objetivo=TAR-0002 proceso_objetivo=PCS-0001 predecesora=TAR-0001 proceso_predecesora=' + procesoTemporalId);
    console.log('OK orden_predecesora=' + tareaAnterior.valores[tOrden] + ' orden_dependiente=' + tareaDependiente.valores[tOrden]);
    var reporte = obtenerReporteIntegridad();
    var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
    var detectado = hallazgos.some(function(hallazgo) {
      var descripcion = String(hallazgo.descripcion || '').toUpperCase();
      return String(hallazgo.entidad || '').trim() === 'TAREA' && String(hallazgo.registroId || '').trim() === 'TAR-0002' && descripcion.indexOf('TAREA_PREDECESORA_ID') !== -1 && descripcion.indexOf('PROCESO') !== -1;
    });
    console.log('OK hallazgo_predecesora_otro_proceso=' + detectado);
    if (!detectado) errorFinal = new Error('F03_C05_B_NO_GO: IntegrityService no detecta predecesora perteneciente a otro proceso');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    filasTareaRestaurar.forEach(function(tarea) {
      hojaTareas.getRange(tarea.fila, 1, 1, tarea.valores.length).setValues([tarea.valores]);
    });
    validacionesRestaurar.forEach(function(item) {
      if (item.validacion) item.celda.setDataValidation(item.validacion); else item.celda.clearDataValidations();
    });
    if (filaProcesoTemporal && filaProcesoTemporal <= hojaProcesos.getLastRow()) hojaProcesos.deleteRow(filaProcesoTemporal);
    SpreadsheetApp.flush();
    console.log('OK validaciones_restauradas=true');
    console.log('OK tareas_restauradas=' + filasTareaRestaurar.length);
    console.log('OK proceso_temporal_eliminado=' + Boolean(filaProcesoTemporal));
    var reporteRestaurado = obtenerReporteIntegridad();
    var hallazgosRestaurados = [].concat(reporteRestaurado.funcional.errores || [], reporteRestaurado.funcional.advertencias || [], reporteRestaurado.funcional.informacion || []);
    var persiste = hallazgosRestaurados.some(function(hallazgo) {
      var descripcion = String(hallazgo.descripcion || '').toUpperCase();
      return String(hallazgo.entidad || '').trim() === 'TAREA' && descripcion.indexOf('TAREA_PREDECESORA_ID') !== -1 && descripcion.indexOf('PROCESO') !== -1;
    });
    console.log('OK integridad_restaurada=' + !persiste);
    if (persiste) errorFinal = errorFinal || new Error('F03_C05_B_ERROR: persiste hallazgo tras restaurar');
  }
  console.log(errorFinal ? 'NEXT añadir_FUNC_TAREA_011' : 'NEXT cerrar_C05_B');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC05C_OrdenPredecesoraInvalido() {
  var packageName = 'F03_C05_C_ORDEN_PREDECESORA_INVALIDO';
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('06_TAREAS');
  var tareasRestaurar = [];
  var validacionesRestaurar = [];
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hoja) throw new Error('F03_C05_C_ERROR: no existe 06_TAREAS');
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();
    if (ultimaFila < 3) throw new Error('F03_C05_C_ERROR: faltan tareas base');
    var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function(c) { return String(c || '').trim(); });
    var indiceId = cabeceras.indexOf('ID');
    var indiceProceso = cabeceras.indexOf('PROCESO_ID');
    var indiceOrden = cabeceras.indexOf('ORDEN_SECUENCIA');
    var indicePredecesora = cabeceras.indexOf('TAREA_PREDECESORA_ID');
    var indiceActivo = cabeceras.indexOf('ACTIVO');
    if (indiceId === -1 || indiceProceso === -1 || indiceOrden === -1 || indicePredecesora === -1 || indiceActivo === -1) throw new Error('F03_C05_C_ERROR: faltan columnas necesarias');
    var filas = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
    var predecesora = null;
    var dependiente = null;
    filas.forEach(function(fila, indice) {
      var id = String(fila[indiceId] || '').trim();
      var activa = String(fila[indiceActivo] || '').trim().toUpperCase() !== 'NO';
      if (id === 'TAR-0001' && activa) predecesora = {fila: indice + 2, valores: fila.slice()};
      if (id === 'TAR-0002' && activa) dependiente = {fila: indice + 2, valores: fila.slice()};
    });
    if (!predecesora || !dependiente) throw new Error('F03_C05_C_ERROR: faltan TAR-0001 o TAR-0002 activas');
    var procesoPredecesora = String(predecesora.valores[indiceProceso] || '').trim();
    var procesoDependiente = String(dependiente.valores[indiceProceso] || '').trim();
    if (!procesoPredecesora || procesoPredecesora !== procesoDependiente) throw new Error('F03_C05_C_ERROR: las tareas base no pertenecen al mismo proceso');
    tareasRestaurar.push(predecesora, dependiente);
    [predecesora, dependiente].forEach(function(tarea) {
      [indiceOrden, indicePredecesora].forEach(function(indiceColumna) {
        var celda = hoja.getRange(tarea.fila, indiceColumna + 1);
        validacionesRestaurar.push({celda: celda, validacion: celda.getDataValidation()});
        celda.clearDataValidations();
      });
    });
    hoja.getRange(predecesora.fila, indiceOrden + 1).setValue(2);
    hoja.getRange(dependiente.fila, indiceOrden + 1).setValue(1);
    hoja.getRange(dependiente.fila, indicePredecesora + 1).setValue('TAR-0001');
    SpreadsheetApp.flush();
    console.log('OK mutacion_directa_aplicada=true tarea_dependiente=TAR-0002 predecesora=TAR-0001');
    console.log('OK proceso_compartido=' + procesoDependiente);
    console.log('OK orden_predecesora=2 orden_dependiente=1');
    var reporte = obtenerReporteIntegridad();
    var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
    var detectado = hallazgos.some(function(hallazgo) {
      var descripcion = String(hallazgo.descripcion || '').toUpperCase();
      return String(hallazgo.entidad || '').trim() === 'TAREA' && String(hallazgo.registroId || '').trim() === 'TAR-0002' && descripcion.indexOf('TAREA_PREDECESORA_ID') !== -1 && descripcion.indexOf('ORDEN') !== -1;
    });
    console.log('OK hallazgo_orden_predecesora_invalido=' + detectado);
    if (!detectado) errorFinal = new Error('F03_C05_C_NO_GO: IntegrityService no detecta orden inválido de la tarea predecesora');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    tareasRestaurar.forEach(function(tarea) {
      hoja.getRange(tarea.fila, 1, 1, tarea.valores.length).setValues([tarea.valores]);
    });
    validacionesRestaurar.forEach(function(item) {
      if (item.validacion) item.celda.setDataValidation(item.validacion); else item.celda.clearDataValidations();
    });
    SpreadsheetApp.flush();
    console.log('OK validaciones_restauradas=true');
    console.log('OK tareas_restauradas=' + tareasRestaurar.length);
    var reporteRestaurado = obtenerReporteIntegridad();
    var hallazgosRestaurados = [].concat(reporteRestaurado.funcional.errores || [], reporteRestaurado.funcional.advertencias || [], reporteRestaurado.funcional.informacion || []);
    var persiste = hallazgosRestaurados.some(function(hallazgo) {
      var descripcion = String(hallazgo.descripcion || '').toUpperCase();
      return String(hallazgo.entidad || '').trim() === 'TAREA' && descripcion.indexOf('TAREA_PREDECESORA_ID') !== -1 && descripcion.indexOf('ORDEN') !== -1;
    });
    console.log('OK integridad_restaurada=' + !persiste);
    if (persiste) errorFinal = errorFinal || new Error('F03_C05_C_ERROR: persiste hallazgo tras restaurar');
  }
  console.log(errorFinal ? 'NEXT añadir_FUNC_TAREA_012' : 'NEXT cerrar_C05_C');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC05D_CicloEntreTareas() {
  var packageName = 'F03_C05_D_CICLO_ENTRE_TAREAS';
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('06_TAREAS');
  var tareasRestaurar = [];
  var validacionesRestaurar = [];
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hoja) throw new Error('F03_C05_D_ERROR: no existe 06_TAREAS');
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();
    if (ultimaFila < 3) throw new Error('F03_C05_D_ERROR: faltan tareas base');
    var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function(c) { return String(c || '').trim(); });
    var indiceId = cabeceras.indexOf('ID');
    var indiceProceso = cabeceras.indexOf('PROCESO_ID');
    var indiceOrden = cabeceras.indexOf('ORDEN_SECUENCIA');
    var indicePredecesora = cabeceras.indexOf('TAREA_PREDECESORA_ID');
    var indiceActivo = cabeceras.indexOf('ACTIVO');
    if (indiceId === -1 || indiceProceso === -1 || indiceOrden === -1 || indicePredecesora === -1 || indiceActivo === -1) throw new Error('F03_C05_D_ERROR: faltan columnas necesarias');
    var filas = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
    var tarea1 = null;
    var tarea2 = null;
    filas.forEach(function(fila, indice) {
      var id = String(fila[indiceId] || '').trim();
      var activa = String(fila[indiceActivo] || '').trim().toUpperCase() !== 'NO';
      if (id === 'TAR-0001' && activa) tarea1 = {fila: indice + 2, valores: fila.slice()};
      if (id === 'TAR-0002' && activa) tarea2 = {fila: indice + 2, valores: fila.slice()};
    });
    if (!tarea1 || !tarea2) throw new Error('F03_C05_D_ERROR: faltan TAR-0001 o TAR-0002 activas');
    var proceso1 = String(tarea1.valores[indiceProceso] || '').trim();
    var proceso2 = String(tarea2.valores[indiceProceso] || '').trim();
    if (!proceso1 || proceso1 !== proceso2) throw new Error('F03_C05_D_ERROR: las tareas no pertenecen al mismo proceso');
    tareasRestaurar.push(tarea1, tarea2);
    [tarea1, tarea2].forEach(function(tarea) {
      var celda = hoja.getRange(tarea.fila, indicePredecesora + 1);
      validacionesRestaurar.push({celda: celda, validacion: celda.getDataValidation()});
      celda.clearDataValidations();
    });
    hoja.getRange(tarea1.fila, indiceOrden + 1).setValue(1);
    hoja.getRange(tarea2.fila, indiceOrden + 1).setValue(2);
    hoja.getRange(tarea1.fila, indicePredecesora + 1).setValue('TAR-0002');
    hoja.getRange(tarea2.fila, indicePredecesora + 1).setValue('TAR-0001');
    SpreadsheetApp.flush();
    console.log('OK mutacion_directa_aplicada=true ciclo=TAR-0001->TAR-0002->TAR-0001');
    console.log('OK proceso_compartido=' + proceso1);
    console.log('OK orden_TAR_0001=1 orden_TAR_0002=2');
    var reporte = obtenerReporteIntegridad();
    var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
    var hallazgosCiclo = hallazgos.filter(function(hallazgo) {
      return String(hallazgo.codigo || '').trim() === 'FUNC-TAREA-012' && ['TAR-0001', 'TAR-0002'].indexOf(String(hallazgo.registroId || '').trim()) !== -1;
    });
    var detectado = hallazgosCiclo.length > 0;
    console.log('OK hallazgos_func_tarea_012=' + hallazgosCiclo.length);
    console.log('OK ciclo_detectado_por_invariante_orden=' + detectado);
    if (!detectado) errorFinal = new Error('F03_C05_D_NO_GO: el ciclo entre tareas no genera ningún hallazgo funcional');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    tareasRestaurar.forEach(function(tarea) {
      hoja.getRange(tarea.fila, 1, 1, tarea.valores.length).setValues([tarea.valores]);
    });
    validacionesRestaurar.forEach(function(item) {
      if (item.validacion) item.celda.setDataValidation(item.validacion); else item.celda.clearDataValidations();
    });
    SpreadsheetApp.flush();
    console.log('OK validaciones_restauradas=true');
    console.log('OK tareas_restauradas=' + tareasRestaurar.length);
    var reporteRestaurado = obtenerReporteIntegridad();
    var hallazgosRestaurados = [].concat(reporteRestaurado.funcional.errores || [], reporteRestaurado.funcional.advertencias || [], reporteRestaurado.funcional.informacion || []);
    var persiste = hallazgosRestaurados.some(function(hallazgo) {
      return String(hallazgo.codigo || '').trim() === 'FUNC-TAREA-012' && ['TAR-0001', 'TAR-0002'].indexOf(String(hallazgo.registroId || '').trim()) !== -1;
    });
    console.log('OK integridad_restaurada=' + !persiste);
    if (persiste) errorFinal = errorFinal || new Error('F03_C05_D_ERROR: persiste hallazgo tras restaurar');
  }
  console.log(errorFinal ? 'NEXT añadir_regla_especifica_de_ciclo' : 'NEXT cerrar_C05_D');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC06A_ProcesoCompletadoConTareaNoTerminada() {
  var packageName = 'F03_C06_A_PROCESO_COMPLETADO_CON_TAREA_NO_TERMINADA';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaProcesos = ss.getSheetByName('05_PROCESOS');
  var hojaTareas = ss.getSheetByName('06_TAREAS');
  var respaldoProceso = null;
  var respaldoTarea = null;
  var validaciones = [];
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hojaProcesos || !hojaTareas) throw new Error('F03_C06_A_ERROR: faltan hojas 05_PROCESOS o 06_TAREAS');
    var cabProcesos = hojaProcesos.getRange(1, 1, 1, hojaProcesos.getLastColumn()).getDisplayValues()[0].map(function(v) { return String(v || '').trim(); });
    var cabTareas = hojaTareas.getRange(1, 1, 1, hojaTareas.getLastColumn()).getDisplayValues()[0].map(function(v) { return String(v || '').trim(); });
    var pId = cabProcesos.indexOf('ID');
    var pEstado = cabProcesos.indexOf('ESTADO');
    var pInicio = cabProcesos.indexOf('FECHA_INICIO_REAL');
    var pFin = cabProcesos.indexOf('FECHA_FIN_REAL');
    var pDuracion = cabProcesos.indexOf('DURACION_REAL_DIAS');
    var tId = cabTareas.indexOf('ID');
    var tProceso = cabTareas.indexOf('PROCESO_ID');
    var tEstado = cabTareas.indexOf('ESTADO');
    var tActivo = cabTareas.indexOf('ACTIVO');
    if ([pId,pEstado,pInicio,pFin,pDuracion,tId,tProceso,tEstado,tActivo].some(function(i){return i === -1;})) throw new Error('F03_C06_A_ERROR: faltan columnas necesarias');
    var procesos = hojaProcesos.getRange(2, 1, hojaProcesos.getLastRow() - 1, hojaProcesos.getLastColumn()).getValues();
    var tareas = hojaTareas.getRange(2, 1, hojaTareas.getLastRow() - 1, hojaTareas.getLastColumn()).getValues();
    var proceso = null;
    var tarea = null;
    procesos.forEach(function(fila, i) { if (String(fila[pId] || '').trim() === 'PCS-0001') proceso = {fila:i+2,valores:fila.slice()}; });
    tareas.forEach(function(fila, i) {
      var activa = String(fila[tActivo] || '').trim().toUpperCase() !== 'NO';
      if (!tarea && activa && String(fila[tProceso] || '').trim() === 'PCS-0001') tarea = {fila:i+2,valores:fila.slice(),id:String(fila[tId] || '').trim()};
    });
    if (!proceso || !tarea) throw new Error('F03_C06_A_ERROR: no existe fixture PCS-0001 con tarea activa');
    respaldoProceso = proceso;
    respaldoTarea = tarea;
    [
      {hoja:hojaProcesos,fila:proceso.fila,columnas:[pEstado,pInicio,pFin,pDuracion]},
      {hoja:hojaTareas,fila:tarea.fila,columnas:[tEstado]}
    ].forEach(function(grupo){grupo.columnas.forEach(function(indice){var celda=grupo.hoja.getRange(grupo.fila,indice+1);validaciones.push({celda:celda,validacion:celda.getDataValidation()});celda.clearDataValidations();});});
    var ahora = new Date();
    var inicio = new Date(ahora.getTime() - 86400000);
    hojaProcesos.getRange(proceso.fila, pEstado + 1).setValue('Completado');
    hojaProcesos.getRange(proceso.fila, pInicio + 1).setValue(inicio);
    hojaProcesos.getRange(proceso.fila, pFin + 1).setValue(ahora);
    hojaProcesos.getRange(proceso.fila, pDuracion + 1).setValue(1);
    hojaTareas.getRange(tarea.fila, tEstado + 1).setValue('Pendiente');
    SpreadsheetApp.flush();
    console.log('OK mutacion_directa_aplicada=true proceso=PCS-0001 estado_proceso=Completado');
    console.log('OK tarea_no_terminada=' + tarea.id + ' estado_tarea=Pendiente');
    console.log('OK proceso_fechas_reales_validas=true duracion_real_dias=1');
    var reporte = obtenerReporteIntegridad();
    var hallazgos = [].concat(reporte.funcional.errores || [], reporte.funcional.advertencias || [], reporte.funcional.informacion || []);
    var detectado = hallazgos.some(function(h) {
      var descripcion = String(h.descripcion || '').toUpperCase();
      return String(h.entidad || '').trim() === 'PROCESO' && String(h.registroId || '').trim() === 'PCS-0001' && descripcion.indexOf('TAREA') !== -1 && descripcion.indexOf('TERMINADA') !== -1;
    });
    console.log('OK hallazgo_proceso_completado_con_tarea_no_terminada=' + detectado);
    if (!detectado) errorFinal = new Error('F03_C06_A_NO_GO: IntegrityService no detecta proceso Completado con tarea no Terminada');
  } catch (error) {
    errorFinal = errorFinal || error;
  } finally {
    if (respaldoProceso) hojaProcesos.getRange(respaldoProceso.fila,1,1,respaldoProceso.valores.length).setValues([respaldoProceso.valores]);
    if (respaldoTarea) hojaTareas.getRange(respaldoTarea.fila,1,1,respaldoTarea.valores.length).setValues([respaldoTarea.valores]);
    validaciones.forEach(function(item){if(item.validacion)item.celda.setDataValidation(item.validacion);else item.celda.clearDataValidations();});
    SpreadsheetApp.flush();
    console.log('OK validaciones_restauradas=true');
    console.log('OK proceso_restaurado=' + Boolean(respaldoProceso));
    console.log('OK tarea_restaurada=' + Boolean(respaldoTarea));
    var restaurado = obtenerReporteIntegridad();
    var hallazgosRestaurados = [].concat(restaurado.funcional.errores || [], restaurado.funcional.advertencias || [], restaurado.funcional.informacion || []);
    var persiste = hallazgosRestaurados.some(function(h){var d=String(h.descripcion||'').toUpperCase();return String(h.entidad||'').trim()==='PROCESO' && String(h.registroId||'').trim()==='PCS-0001' && d.indexOf('TAREA')!==-1 && d.indexOf('TERMINADA')!==-1;});
    console.log('OK integridad_restaurada=' + !persiste);
    if (persiste) errorFinal = errorFinal || new Error('F03_C06_A_ERROR: persiste hallazgo tras restaurar');
  }
  console.log(errorFinal ? 'NEXT añadir_FUNC_PROCESO_001' : 'NEXT cerrar_C06_A');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if (errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC06B_ProcesoPendienteConTareaIniciada() {
  var packageName = 'F03_C06_B_PROCESO_PENDIENTE_CON_TAREA_INICIADA';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaProcesos = ss.getSheetByName('05_PROCESOS');
  var hojaTareas = ss.getSheetByName('06_TAREAS');
  var respaldoProceso = null;
  var respaldoTarea = null;
  var validaciones = [];
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hojaProcesos || !hojaTareas) throw new Error('F03_C06_B_ERROR: faltan hojas necesarias');
    var cabProcesos = hojaProcesos.getRange(1,1,1,hojaProcesos.getLastColumn()).getDisplayValues()[0].map(function(v){return String(v||'').trim();});
    var cabTareas = hojaTareas.getRange(1,1,1,hojaTareas.getLastColumn()).getDisplayValues()[0].map(function(v){return String(v||'').trim();});
    var pId=cabProcesos.indexOf('ID');
    var pEstado=cabProcesos.indexOf('ESTADO');
    var pInicio=cabProcesos.indexOf('FECHA_INICIO_REAL');
    var pFin=cabProcesos.indexOf('FECHA_FIN_REAL');
    var pDuracion=cabProcesos.indexOf('DURACION_REAL_DIAS');
    var tId=cabTareas.indexOf('ID');
    var tProceso=cabTareas.indexOf('PROCESO_ID');
    var tEstado=cabTareas.indexOf('ESTADO');
    var tInicio=cabTareas.indexOf('FECHA_INICIO_REAL');
    var tFin=cabTareas.indexOf('FECHA_FIN_REAL');
    var tDuracion=cabTareas.indexOf('DURACION_REAL_DIAS');
    var tActivo=cabTareas.indexOf('ACTIVO');
    if ([pId,pEstado,pInicio,pFin,pDuracion,tId,tProceso,tEstado,tInicio,tFin,tDuracion,tActivo].some(function(i){return i===-1;})) throw new Error('F03_C06_B_ERROR: faltan columnas necesarias');
    var procesos=hojaProcesos.getRange(2,1,hojaProcesos.getLastRow()-1,hojaProcesos.getLastColumn()).getValues();
    var tareas=hojaTareas.getRange(2,1,hojaTareas.getLastRow()-1,hojaTareas.getLastColumn()).getValues();
    var proceso=null;
    var tarea=null;
    procesos.forEach(function(fila,i){if(String(fila[pId]||'').trim()==='PCS-0001') proceso={fila:i+2,valores:fila.slice()};});
    tareas.forEach(function(fila,i){var activa=String(fila[tActivo]||'').trim().toUpperCase()!=='NO';if(!tarea&&activa&&String(fila[tProceso]||'').trim()==='PCS-0001') tarea={fila:i+2,valores:fila.slice(),id:String(fila[tId]||'').trim()};});
    if (!proceso || !tarea) throw new Error('F03_C06_B_ERROR: no existe fixture PCS-0001 con tarea activa');
    respaldoProceso=proceso;
    respaldoTarea=tarea;
    [{hoja:hojaProcesos,fila:proceso.fila,columnas:[pEstado,pInicio,pFin,pDuracion]},{hoja:hojaTareas,fila:tarea.fila,columnas:[tEstado,tInicio,tFin,tDuracion]}].forEach(function(grupo){grupo.columnas.forEach(function(indice){var celda=grupo.hoja.getRange(grupo.fila,indice+1);validaciones.push({celda:celda,validacion:celda.getDataValidation()});celda.clearDataValidations();});});
    hojaProcesos.getRange(proceso.fila,pEstado+1).setValue('Pendiente');
    hojaProcesos.getRange(proceso.fila,pInicio+1).clearContent();
    hojaProcesos.getRange(proceso.fila,pFin+1).clearContent();
    hojaProcesos.getRange(proceso.fila,pDuracion+1).clearContent();
    hojaTareas.getRange(tarea.fila,tEstado+1).setValue('En proceso');
    hojaTareas.getRange(tarea.fila,tInicio+1).setValue(new Date());
    hojaTareas.getRange(tarea.fila,tFin+1).clearContent();
    hojaTareas.getRange(tarea.fila,tDuracion+1).clearContent();
    SpreadsheetApp.flush();
    console.log('OK mutacion_directa_aplicada=true proceso=PCS-0001 estado_proceso=Pendiente');
    console.log('OK tarea_iniciada=' + tarea.id + ' estado_tarea=En proceso');
    console.log('OK coherencia_interna_proceso=true coherencia_interna_tarea=true');
    var reporte=obtenerReporteIntegridad();
    var hallazgos=[].concat(reporte.funcional.errores||[],reporte.funcional.advertencias||[],reporte.funcional.informacion||[]);
    var detectado=hallazgos.some(function(h){var descripcion=String(h.descripcion||'').toUpperCase();return String(h.entidad||'').trim()==='PROCESO'&&String(h.registroId||'').trim()==='PCS-0001'&&descripcion.indexOf('PENDIENTE')!==-1&&descripcion.indexOf('TAREA')!==-1&&descripcion.indexOf('EN PROCESO')!==-1;});
    console.log('OK hallazgo_proceso_pendiente_con_tarea_iniciada=' + detectado);
    if(!detectado) errorFinal=new Error('F03_C06_B_NO_GO: IntegrityService no detecta proceso Pendiente con tarea En proceso');
  } catch(error) {
    errorFinal=errorFinal||error;
  } finally {
    if(respaldoProceso) hojaProcesos.getRange(respaldoProceso.fila,1,1,respaldoProceso.valores.length).setValues([respaldoProceso.valores]);
    if(respaldoTarea) hojaTareas.getRange(respaldoTarea.fila,1,1,respaldoTarea.valores.length).setValues([respaldoTarea.valores]);
    validaciones.forEach(function(item){if(item.validacion)item.celda.setDataValidation(item.validacion);else item.celda.clearDataValidations();});
    SpreadsheetApp.flush();
    console.log('OK validaciones_restauradas=true');
    console.log('OK proceso_restaurado=' + Boolean(respaldoProceso));
    console.log('OK tarea_restaurada=' + Boolean(respaldoTarea));
    var restaurado=obtenerReporteIntegridad();
    var hallazgosRestaurados=[].concat(restaurado.funcional.errores||[],restaurado.funcional.advertencias||[],restaurado.funcional.informacion||[]);
    var persiste=hallazgosRestaurados.some(function(h){var d=String(h.descripcion||'').toUpperCase();return String(h.entidad||'').trim()==='PROCESO'&&String(h.registroId||'').trim()==='PCS-0001'&&d.indexOf('PENDIENTE')!==-1&&d.indexOf('EN PROCESO')!==-1;});
    console.log('OK integridad_restaurada=' + !persiste);
    if(persiste) errorFinal=errorFinal||new Error('F03_C06_B_ERROR: persiste hallazgo tras restaurar');
  }
  console.log(errorFinal ? 'NEXT añadir_FUNC_PROCESO_002' : 'NEXT cerrar_C06_B');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if(errorFinal) throw errorFinal;
  return true;
}
function auditarFaseC06C_ProcesoPreparadoConTareaTerminada() {
  var packageName = 'F03_C06_C_PROCESO_PREPARADO_CON_TAREA_TERMINADA';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaProcesos = ss.getSheetByName('05_PROCESOS');
  var hojaTareas = ss.getSheetByName('06_TAREAS');
  var respaldoProceso = null;
  var respaldoTarea = null;
  var validaciones = [];
  var errorFinal = null;
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  try {
    if (!hojaProcesos || !hojaTareas) throw new Error('F03_C06_C_ERROR: faltan hojas necesarias');
    var cabProcesos = hojaProcesos.getRange(1,1,1,hojaProcesos.getLastColumn()).getDisplayValues()[0].map(function(v){return String(v||'').trim();});
    var cabTareas = hojaTareas.getRange(1,1,1,hojaTareas.getLastColumn()).getDisplayValues()[0].map(function(v){return String(v||'').trim();});
    var pId=cabProcesos.indexOf('ID');
    var pEstado=cabProcesos.indexOf('ESTADO');
    var pInicio=cabProcesos.indexOf('FECHA_INICIO_REAL');
    var pFin=cabProcesos.indexOf('FECHA_FIN_REAL');
    var pDuracion=cabProcesos.indexOf('DURACION_REAL_DIAS');
    var tId=cabTareas.indexOf('ID');
    var tProceso=cabTareas.indexOf('PROCESO_ID');
    var tEstado=cabTareas.indexOf('ESTADO');
    var tInicio=cabTareas.indexOf('FECHA_INICIO_REAL');
    var tFin=cabTareas.indexOf('FECHA_FIN_REAL');
    var tDuracion=cabTareas.indexOf('DURACION_REAL_DIAS');
    var tAvance=cabTareas.indexOf('PORCENTAJE_AVANCE');
    var tActivo=cabTareas.indexOf('ACTIVO');
    if ([pId,pEstado,pInicio,pFin,pDuracion,tId,tProceso,tEstado,tInicio,tFin,tDuracion,tAvance,tActivo].some(function(i){return i===-1;})) throw new Error('F03_C06_C_ERROR: faltan columnas necesarias');
    var procesos=hojaProcesos.getRange(2,1,hojaProcesos.getLastRow()-1,hojaProcesos.getLastColumn()).getValues();
    var tareas=hojaTareas.getRange(2,1,hojaTareas.getLastRow()-1,hojaTareas.getLastColumn()).getValues();
    var proceso=null;
    var tarea=null;
    procesos.forEach(function(fila,i){if(String(fila[pId]||'').trim()==='PCS-0001') proceso={fila:i+2,valores:fila.slice()};});
    tareas.forEach(function(fila,i){var activa=String(fila[tActivo]||'').trim().toUpperCase()!=='NO';if(!tarea&&activa&&String(fila[tProceso]||'').trim()==='PCS-0001') tarea={fila:i+2,valores:fila.slice(),id:String(fila[tId]||'').trim()};});
    if (!proceso || !tarea) throw new Error('F03_C06_C_ERROR: no existe fixture PCS-0001 con tarea activa');
    respaldoProceso=proceso; respaldoTarea=tarea;
    [{hoja:hojaProcesos,fila:proceso.fila,columnas:[pEstado,pInicio,pFin,pDuracion]},{hoja:hojaTareas,fila:tarea.fila,columnas:[tEstado,tInicio,tFin,tDuracion,tAvance]}].forEach(function(grupo){grupo.columnas.forEach(function(indice){var celda=grupo.hoja.getRange(grupo.fila,indice+1);validaciones.push({celda:celda,validacion:celda.getDataValidation()});celda.clearDataValidations();});});
    var fin=new Date(); var inicio=new Date(fin.getTime()-86400000);
    hojaProcesos.getRange(proceso.fila,pEstado+1).setValue('Preparado');
    hojaProcesos.getRange(proceso.fila,pInicio+1).clearContent();
    hojaProcesos.getRange(proceso.fila,pFin+1).clearContent();
    hojaProcesos.getRange(proceso.fila,pDuracion+1).clearContent();
    hojaTareas.getRange(tarea.fila,tEstado+1).setValue('Terminada');
    hojaTareas.getRange(tarea.fila,tInicio+1).setValue(inicio);
    hojaTareas.getRange(tarea.fila,tFin+1).setValue(fin);
    hojaTareas.getRange(tarea.fila,tDuracion+1).setValue(1);
    hojaTareas.getRange(tarea.fila,tAvance+1).setValue(100);
    SpreadsheetApp.flush();
    console.log('OK mutacion_directa_aplicada=true proceso=PCS-0001 estado_proceso=Preparado');
    console.log('OK tarea_terminada=' + tarea.id + ' estado_tarea=Terminada avance=100');
    console.log('OK coherencia_interna_proceso=true coherencia_interna_tarea=true');
    var reporte=obtenerReporteIntegridad();
    var hallazgos=[].concat(reporte.funcional.errores||[],reporte.funcional.advertencias||[],reporte.funcional.informacion||[]);
    var detectado=hallazgos.some(function(h){return String(h.codigo||'').trim()==='FUNC-PROCESO-002'&&String(h.entidad||'').trim()==='PROCESO'&&String(h.registroId||'').trim()==='PCS-0001';});
    console.log('OK hallazgo_proceso_preparado_con_tarea_terminada=' + detectado);
    if(!detectado) errorFinal=new Error('F03_C06_C_NO_GO: FUNC-PROCESO-002 no detecta proceso Preparado con tarea Terminada');
  } catch(error) { errorFinal=errorFinal||error; } finally {
    if(respaldoProceso) hojaProcesos.getRange(respaldoProceso.fila,1,1,respaldoProceso.valores.length).setValues([respaldoProceso.valores]);
    if(respaldoTarea) hojaTareas.getRange(respaldoTarea.fila,1,1,respaldoTarea.valores.length).setValues([respaldoTarea.valores]);
    validaciones.forEach(function(item){if(item.validacion)item.celda.setDataValidation(item.validacion);else item.celda.clearDataValidations();});
    SpreadsheetApp.flush();
    console.log('OK validaciones_restauradas=true');
    console.log('OK proceso_restaurado=' + Boolean(respaldoProceso));
    console.log('OK tarea_restaurada=' + Boolean(respaldoTarea));
    var restaurado=obtenerReporteIntegridad();
    var hallazgosRestaurados=[].concat(restaurado.funcional.errores||[],restaurado.funcional.advertencias||[],restaurado.funcional.informacion||[]);
    var persiste=hallazgosRestaurados.some(function(h){return String(h.codigo||'').trim()==='FUNC-PROCESO-002'&&String(h.registroId||'').trim()==='PCS-0001';});
    console.log('OK integridad_restaurada=' + !persiste);
    if(persiste) errorFinal=errorFinal||new Error('F03_C06_C_ERROR: persiste hallazgo tras restaurar');
  }
  console.log(errorFinal ? 'NEXT revisar_FUNC_PROCESO_002' : 'NEXT cerrar_C06_C');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=' + (errorFinal ? 'NO_GO' : 'OK'));
  if(errorFinal) throw errorFinal;
  return true;
}
function ejecutarFaseC07_RegresionFinalProcesoTarea() {
  var packageName = 'F03_C07_REGRESION_FINAL_PROCESO_TAREA';
  var pruebas = [
    {nombre: 'PASO_161_PROCESO_ID_INEXISTENTE', ejecutar: pruebaPaso161_ProcesoTareaInexistente},
    {nombre: 'PASO_167_PREDECESORA_INEXISTENTE', ejecutar: pruebaPaso167_TareaPredecesoraInvalida},
    {nombre: 'PASO_168_PREDECESORA_OTRO_PROCESO', ejecutar: pruebaPaso168_PredecessoraOtroProceso},
    {nombre: 'PASO_198_EN_PROCESO_SIN_INICIO_REAL', ejecutar: pruebaPaso198_TareaEnProcesoRequiereFechaInicioReal},
    {nombre: 'PASO_199_TERMINADA_SIN_FECHAS', ejecutar: pruebaPaso199_TareaTerminadaRequiereFechas},
    {nombre: 'PASO_200_TERMINADA_SIN_DURACION', ejecutar: pruebaPaso200_TareaTerminadaRequiereDuracionReal},
    {nombre: 'PASO_201_TERMINADA_VALIDA_DRY_RUN', ejecutar: pruebaPaso201_TareaTerminadaValidaDryRun}
  ];
  var resultados = [];
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  pruebas.forEach(function(prueba) {
    console.log('OK regression_test_begin=' + prueba.nombre);
    prueba.ejecutar();
    resultados.push(prueba.nombre);
    console.log('OK regression_test_end=' + prueba.nombre + ' status=OK');
  });
  var reporte = obtenerReporteIntegridad();
  var duplicados = Object.keys(reporte.idsDuplicados || {});
  var huerfanas = Object.keys(reporte.referenciasHuerfanas || {});
  var errores = (reporte.funcional && reporte.funcional.errores) || [];
  console.log('OK regression_tests_passed=' + resultados.length);
  console.log('OK ids_duplicados_entidades=' + duplicados.length);
  console.log('OK referencias_huerfanas_entidades=' + huerfanas.length);
  console.log('OK errores_funcionales=' + errores.length);
  if (duplicados.length > 0) throw new Error('F03_C07_NO_GO: existen IDs duplicados tras la regresión');
  if (huerfanas.length > 0) throw new Error('F03_C07_NO_GO: existen referencias huérfanas tras la regresión');
  if (errores.length > 0) throw new Error('F03_C07_NO_GO: existen errores funcionales tras la regresión: ' + JSON.stringify(errores));
  console.log('OK integridad_final_limpia=true');
  console.log('NEXT cerrar_C07_y_Fase_C');
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}