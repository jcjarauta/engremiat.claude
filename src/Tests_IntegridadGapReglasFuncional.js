/**
 * Cierre del gap de cobertura de pruebas reactivas detectado el
 * 2026-08-04 (ver conversación -- "asesor técnico, punto 3: 9 de 27
 * reglas sin prueba reactiva localizada"). Reemplaza el stub vacío
 * `Tests_IntegrityService_cobertura_directa_10_reglas.js`
 * (`function myFunction() {}`, sin implementar) que `ACTA_CIERRE_SESION.md`
 * e `INFORME_CIERRE_AUDITORIA_GLOBAL.md` daban por resuelto ("62/62
 * reglas con prueba reactiva verificada") sin que quedara una prueba
 * permanente en el repositorio para volver a confirmarlo.
 *
 * Un barrido real (grep de código FUNC-* en IntegrityService.js
 * contra Tests_*.js) encontró 21 reglas sin referencia en ningún
 * archivo de prueba (crecieron desde las 9 originales porque L0-N8
 * añadieron ~28 reglas nuevas). Confirmado antes de escribir nada que
 * las 21 SÍ están activas en producción -- las funciones que las
 * contienen (detectarProblemasTarea_,
 * detectarRelacionesMaterialConPadresInactivos_,
 * detectarDuplicidadesRelacionesMaterial_, detectarProblemasDecision_,
 * detectarProblemasAvanceProceso_ vía la sección FUNC-PROCESO-001)
 * están todas enganchadas en detectarProblemasFuncionales_(), que
 * ejecuta obtenerReporteIntegridad() en producción -- no es código
 * muerto, es una red de seguridad de regresión ausente.
 *
 * Mismo patrón que las pruebas ya existentes en Tests_Repository2.js:
 * mutar un registro real vía escribirCamposRegistroIntegridad_,
 * confirmar el hallazgo con assertHallazgoIntegridad_, restaurar en
 * `finally`, confirmar su desaparición con assertSinHallazgoIntegridad_.
 * Reutiliza los helpers compartidos ya existentes, no duplica nada.
 */

/* ---------------------------------------------------------------- */
/* DECISION: FUNC-DEC-002, FUNC-DEC-003, FUNC-DEC-004                */
/* ---------------------------------------------------------------- */

function probarIntegridadDecisionAbiertaConResolucionInformada() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_DEC_002';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var decision = listarRegistros('DECISION', { ACTIVO: 'SÍ' })[0];
  if (!decision) throw new Error('FUNC-DEC-002_TEST_ERROR: no existe una DECISION activa utilizable');

  var hoja = obtenerHojaEntidadPruebaIntegridad_('DECISION');
  var valoresOriginales = {
    ESTADO: decision.ESTADO || '',
    RESOLUCION: decision.RESOLUCION || '',
    FECHA_RESOLUCION: decision.FECHA_RESOLUCION || ''
  };

  try {
    escribirCamposRegistroIntegridad_(hoja, decision.ID, {
      ESTADO: 'Pendiente de aprobación',
      RESOLUCION: 'Resolución de prueba (FUNC-DEC-002)',
      FECHA_RESOLUCION: new Date()
    });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-DEC-002', 'DECISION', decision.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hoja, decision.ID, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-DEC-002', 'DECISION', decision.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadDecisionFechaResolucionAnteriorCreacion() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_DEC_003';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var decision = listarRegistros('DECISION', { ACTIVO: 'SÍ' })[0];
  if (!decision || !decision.FECHA_CREACION) throw new Error('FUNC-DEC-003_TEST_ERROR: no existe una DECISION activa con FECHA_CREACION utilizable');

  var fechaCreacion = decision.FECHA_CREACION instanceof Date ? decision.FECHA_CREACION : new Date(decision.FECHA_CREACION);
  var fechaAnterior = new Date(fechaCreacion.getTime() - (10 * 24 * 60 * 60 * 1000));

  var hoja = obtenerHojaEntidadPruebaIntegridad_('DECISION');
  var valoresOriginales = { FECHA_RESOLUCION: decision.FECHA_RESOLUCION || '' };

  try {
    escribirCamposRegistroIntegridad_(hoja, decision.ID, { FECHA_RESOLUCION: fechaAnterior });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-DEC-003', 'DECISION', decision.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hoja, decision.ID, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-DEC-003', 'DECISION', decision.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadDecisionFechaLimiteAnteriorCreacion() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_DEC_004';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var decision = listarRegistros('DECISION', { ACTIVO: 'SÍ' })[0];
  if (!decision || !decision.FECHA_CREACION) throw new Error('FUNC-DEC-004_TEST_ERROR: no existe una DECISION activa con FECHA_CREACION utilizable');

  var fechaCreacion = decision.FECHA_CREACION instanceof Date ? decision.FECHA_CREACION : new Date(decision.FECHA_CREACION);
  var fechaAnterior = new Date(fechaCreacion.getTime() - (10 * 24 * 60 * 60 * 1000));

  var hoja = obtenerHojaEntidadPruebaIntegridad_('DECISION');
  var valoresOriginales = { FECHA_LIMITE: decision.FECHA_LIMITE || '' };

  try {
    escribirCamposRegistroIntegridad_(hoja, decision.ID, { FECHA_LIMITE: fechaAnterior });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-DEC-004', 'DECISION', decision.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hoja, decision.ID, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-DEC-004', 'DECISION', decision.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

/* ---------------------------------------------------------------- */
/* PRODUCTO_MATERIAL: FUNC-PMA-001, FUNC-PMA-002, FUNC-PMA-003       */
/* ---------------------------------------------------------------- */

function probarIntegridadProductoMaterialConProductoInactivo() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_PMA_001';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var relacion = listarRegistros('PRODUCTO_MATERIAL', { ACTIVO: 'SÍ' })[0];
  if (!relacion) throw new Error('FUNC-PMA-001_TEST_ERROR: no existe un PRODUCTO_MATERIAL activo utilizable');

  var hojaProducto = obtenerHojaEntidadPruebaIntegridad_('PRODUCTO');

  try {
    escribirCamposRegistroIntegridad_(hojaProducto, relacion.PRODUCTO_ID, { ACTIVO: 'NO' });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-PMA-001', 'PRODUCTO_MATERIAL', relacion.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hojaProducto, relacion.PRODUCTO_ID, { ACTIVO: 'SÍ' });
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-PMA-001', 'PRODUCTO_MATERIAL', relacion.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadProductoMaterialConMaterialInactivo() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_PMA_002';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var relacion = listarRegistros('PRODUCTO_MATERIAL', { ACTIVO: 'SÍ' })[0];
  if (!relacion) throw new Error('FUNC-PMA-002_TEST_ERROR: no existe un PRODUCTO_MATERIAL activo utilizable');

  var hojaMaterial = obtenerHojaEntidadPruebaIntegridad_('MATERIAL');

  try {
    escribirCamposRegistroIntegridad_(hojaMaterial, relacion.MATERIAL_ID, { ACTIVO: 'NO' });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-PMA-002', 'PRODUCTO_MATERIAL', relacion.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hojaMaterial, relacion.MATERIAL_ID, { ACTIVO: 'SÍ' });
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-PMA-002', 'PRODUCTO_MATERIAL', relacion.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadProductoMaterialDuplicado() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_PMA_003';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  /*
   * insertarRegistroTransaccional ya rechaza este duplicado a nivel de
   * aplicación (ERROR_INSERCION_PRODUCTO_MATERIAL: relación activa
   * duplicada) -- confirmado al ejecutar esta prueba por primera vez.
   * FUNC-PMA-003 es una segunda red de seguridad para filas que
   * pudieran saltarse ese camino (import directo, edición manual de
   * la hoja...), así que se prueba escribiendo la fila cruda
   * directamente (insertarFilaCrudaIntegridad_, mismo patrón que
   * probarIntegridadMaterialCodigoDuplicado), no vía el repositorio.
   */
  var hoja = obtenerHojaEntidadPruebaIntegridad_('PRODUCTO_MATERIAL');
  var original = seleccionarPrimerRegistroActivo_('PRODUCTO_MATERIAL');
  var idTemporal = 'PMA-AUD-FUNC-PMA-003';

  try {
    eliminarFilaPorIdIntegridad_(hoja, idTemporal);

    var filaTemporal = Object.assign({}, original, {
      ID: idTemporal,
      PRODUCTO_ID: original.PRODUCTO_ID,
      MATERIAL_ID: original.MATERIAL_ID,
      ACTIVO: 'SÍ'
    });

    insertarFilaCrudaIntegridad_(hoja, filaTemporal);
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-PMA-003', 'PRODUCTO_MATERIAL', idTemporal, 1);
  } finally {
    eliminarFilaPorIdIntegridad_(hoja, idTemporal);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-PMA-003', 'PRODUCTO_MATERIAL', idTemporal);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

/* ---------------------------------------------------------------- */
/* PROCESO: FUNC-PROCESO-001, FUNC-PROCESO-005                       */
/* ---------------------------------------------------------------- */

function probarIntegridadProcesoCompletadoConTareaNoTerminada() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_PROCESO_001';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tareas = listarRegistros('TAREA', { ACTIVO: 'SÍ' });
  var tarea = tareas.filter(function (t) { return t.PROCESO_ID; })[0];
  if (!tarea) throw new Error('FUNC-PROCESO-001_TEST_ERROR: no existe una TAREA activa con PROCESO_ID utilizable');

  var proceso = obtenerRegistroPorId('PROCESO', tarea.PROCESO_ID);
  if (!proceso) throw new Error('FUNC-PROCESO-001_TEST_ERROR: no existe el PROCESO ' + tarea.PROCESO_ID);

  var hojaProceso = obtenerHojaEntidadPruebaIntegridad_('PROCESO');
  var hojaTarea = obtenerHojaEntidadPruebaIntegridad_('TAREA');

  var procesoOriginal = { ESTADO: proceso.ESTADO || '' };
  var tareaOriginal = { ESTADO: tarea.ESTADO || '' };

  try {
    escribirCamposRegistroIntegridad_(hojaTarea, tarea.ID, { ESTADO: 'Pendiente' });
    escribirCamposRegistroIntegridad_(hojaProceso, proceso.ID, { ESTADO: 'Completado' });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-PROCESO-001', 'PROCESO', proceso.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hojaProceso, proceso.ID, procesoOriginal);
    escribirCamposRegistroIntegridad_(hojaTarea, tarea.ID, tareaOriginal);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-PROCESO-001', 'PROCESO', proceso.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadProcesoAvancePorTareasDifiereDePromedio() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_PROCESO_005';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tareasActivas = listarRegistros('TAREA', { ACTIVO: 'SÍ' });
  var tareasPorProceso_ = {};
  tareasActivas.forEach(function (t) {
    if (t.ESTADO === 'Cancelada' || !t.PROCESO_ID) return;
    (tareasPorProceso_[t.PROCESO_ID] = tareasPorProceso_[t.PROCESO_ID] || []).push(t);
  });

  var procesoId = Object.keys(tareasPorProceso_).filter(function (id) { return tareasPorProceso_[id].length > 0; })[0];
  if (!procesoId) throw new Error('FUNC-PROCESO-005_TEST_ERROR: no existe un PROCESO con TAREA activa utilizable');

  var proceso = obtenerRegistroPorId('PROCESO', procesoId);
  var tareas = tareasPorProceso_[procesoId];
  var promedio = tareas.reduce(function (t, x) { return t + (Number(x.PORCENTAJE_AVANCE) || 0); }, 0) / tareas.length;
  var avanceForzado = promedio > 50 ? Math.max(0, Math.round(promedio) - 50) : Math.min(100, Math.round(promedio) + 50);

  var hojaProceso = obtenerHojaEntidadPruebaIntegridad_('PROCESO');
  var valoresOriginales = {
    METODO_CALCULO_AVANCE: proceso.METODO_CALCULO_AVANCE || '',
    PORCENTAJE_AVANCE: proceso.PORCENTAJE_AVANCE
  };

  try {
    escribirCamposRegistroIntegridad_(hojaProceso, procesoId, {
      METODO_CALCULO_AVANCE: 'Por tareas',
      PORCENTAJE_AVANCE: avanceForzado
    });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-PROCESO-005', 'PROCESO', procesoId, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hojaProceso, procesoId, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-PROCESO-005', 'PROCESO', procesoId);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

/* ---------------------------------------------------------------- */
/* TAREA: FUNC-TAREA-003/004/005/006/007/009/010/011                 */
/* ---------------------------------------------------------------- */

function probarIntegridadTareaFechaFinPlanAnteriorInicioPlan() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_TAREA_003';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tarea = listarRegistros('TAREA', { ACTIVO: 'SÍ' })[0];
  if (!tarea) throw new Error('FUNC-TAREA-003_TEST_ERROR: no existe una TAREA activa utilizable');

  var hoja = obtenerHojaEntidadPruebaIntegridad_('TAREA');
  var valoresOriginales = {
    FECHA_INICIO_PLAN: tarea.FECHA_INICIO_PLAN || '',
    FECHA_FIN_PLAN: tarea.FECHA_FIN_PLAN || ''
  };

  try {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, {
      FECHA_INICIO_PLAN: new Date('2035-06-10'),
      FECHA_FIN_PLAN: new Date('2035-06-01')
    });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-TAREA-003', 'TAREA', tarea.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-TAREA-003', 'TAREA', tarea.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadTareaPendienteConFechaInicioReal() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_TAREA_004';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tarea = listarRegistros('TAREA', { ACTIVO: 'SÍ' })[0];
  if (!tarea) throw new Error('FUNC-TAREA-004_TEST_ERROR: no existe una TAREA activa utilizable');

  var hoja = obtenerHojaEntidadPruebaIntegridad_('TAREA');
  var valoresOriginales = {
    ESTADO: tarea.ESTADO || '',
    FECHA_INICIO_REAL: tarea.FECHA_INICIO_REAL || ''
  };

  try {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, {
      ESTADO: 'Pendiente',
      FECHA_INICIO_REAL: new Date()
    });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-TAREA-004', 'TAREA', tarea.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-TAREA-004', 'TAREA', tarea.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadTareaEnProcesoSinFechaInicioReal() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_TAREA_005';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tarea = listarRegistros('TAREA', { ACTIVO: 'SÍ' })[0];
  if (!tarea) throw new Error('FUNC-TAREA-005_TEST_ERROR: no existe una TAREA activa utilizable');

  var hoja = obtenerHojaEntidadPruebaIntegridad_('TAREA');
  var valoresOriginales = {
    ESTADO: tarea.ESTADO || '',
    FECHA_INICIO_REAL: tarea.FECHA_INICIO_REAL || ''
  };

  try {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, {
      ESTADO: 'En proceso',
      FECHA_INICIO_REAL: ''
    });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-TAREA-005', 'TAREA', tarea.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-TAREA-005', 'TAREA', tarea.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadTareaTerminadaSinFechaInicioReal() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_TAREA_006';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tarea = listarRegistros('TAREA', { ACTIVO: 'SÍ' })[0];
  if (!tarea) throw new Error('FUNC-TAREA-006_TEST_ERROR: no existe una TAREA activa utilizable');

  var hoja = obtenerHojaEntidadPruebaIntegridad_('TAREA');
  var valoresOriginales = {
    ESTADO: tarea.ESTADO || '',
    FECHA_INICIO_REAL: tarea.FECHA_INICIO_REAL || ''
  };

  try {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, {
      ESTADO: 'Terminada',
      FECHA_INICIO_REAL: ''
    });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-TAREA-006', 'TAREA', tarea.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-TAREA-006', 'TAREA', tarea.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadTareaTerminadaSinFechaFinReal() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_TAREA_007';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tarea = listarRegistros('TAREA', { ACTIVO: 'SÍ' })[0];
  if (!tarea) throw new Error('FUNC-TAREA-007_TEST_ERROR: no existe una TAREA activa utilizable');

  var hoja = obtenerHojaEntidadPruebaIntegridad_('TAREA');
  var valoresOriginales = {
    ESTADO: tarea.ESTADO || '',
    FECHA_FIN_REAL: tarea.FECHA_FIN_REAL || ''
  };

  try {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, {
      ESTADO: 'Terminada',
      FECHA_FIN_REAL: ''
    });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-TAREA-007', 'TAREA', tarea.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-TAREA-007', 'TAREA', tarea.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadTareaTerminadaDuracionRealInvalida() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_TAREA_009';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tarea = listarRegistros('TAREA', { ACTIVO: 'SÍ' })[0];
  if (!tarea) throw new Error('FUNC-TAREA-009_TEST_ERROR: no existe una TAREA activa utilizable');

  var hoja = obtenerHojaEntidadPruebaIntegridad_('TAREA');
  var valoresOriginales = {
    ESTADO: tarea.ESTADO || '',
    DURACION_REAL_DIAS: tarea.DURACION_REAL_DIAS
  };

  try {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, {
      ESTADO: 'Terminada',
      DURACION_REAL_DIAS: -5
    });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-TAREA-009', 'TAREA', tarea.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-TAREA-009', 'TAREA', tarea.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadTareaPredecesoraInexistente() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_TAREA_010';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tarea = listarRegistros('TAREA', { ACTIVO: 'SÍ' })[0];
  if (!tarea) throw new Error('FUNC-TAREA-010_TEST_ERROR: no existe una TAREA activa utilizable');

  var hoja = obtenerHojaEntidadPruebaIntegridad_('TAREA');
  var valoresOriginales = { TAREA_PREDECESORA_ID: tarea.TAREA_PREDECESORA_ID || '' };

  try {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, { TAREA_PREDECESORA_ID: 'TAR-9999' });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-TAREA-010', 'TAREA', tarea.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hoja, tarea.ID, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-TAREA-010', 'TAREA', tarea.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadTareaPredecesoraDeOtroProceso() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_TAREA_011';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tareas = listarRegistros('TAREA', { ACTIVO: 'SÍ' });
  var porProceso_ = {};
  tareas.forEach(function (t) {
    if (!t.PROCESO_ID) return;
    (porProceso_[t.PROCESO_ID] = porProceso_[t.PROCESO_ID] || []).push(t);
  });
  var procesosConTarea = Object.keys(porProceso_);
  if (procesosConTarea.length < 2) throw new Error('FUNC-TAREA-011_TEST_ERROR: no hay al menos 2 PROCESO distintos con TAREA activa');

  var tareaA = porProceso_[procesosConTarea[0]][0];
  var tareaB = porProceso_[procesosConTarea[1]][0];

  var hoja = obtenerHojaEntidadPruebaIntegridad_('TAREA');
  var valoresOriginales = { TAREA_PREDECESORA_ID: tareaA.TAREA_PREDECESORA_ID || '' };

  try {
    escribirCamposRegistroIntegridad_(hoja, tareaA.ID, { TAREA_PREDECESORA_ID: tareaB.ID });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-TAREA-011', 'TAREA', tareaA.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hoja, tareaA.ID, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-TAREA-011', 'TAREA', tareaA.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

/* ---------------------------------------------------------------- */
/* TAREA_MATERIAL: FUNC-TMA-001/002/003/004/005                      */
/* ---------------------------------------------------------------- */

function probarIntegridadTareaMaterialCantidadConsumidaNegativa() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_TMA_001';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tm = listarRegistros('TAREA_MATERIAL', { ACTIVO: 'SÍ' })[0];
  if (!tm) throw new Error('FUNC-TMA-001_TEST_ERROR: no existe un TAREA_MATERIAL activo utilizable');

  var hoja = obtenerHojaEntidadPruebaIntegridad_('TAREA_MATERIAL');
  var valoresOriginales = { CANTIDAD_CONSUMIDA: tm.CANTIDAD_CONSUMIDA };

  try {
    escribirCamposRegistroIntegridad_(hoja, tm.ID, { CANTIDAD_CONSUMIDA: -1 });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-TMA-001', 'TAREA_MATERIAL', tm.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hoja, tm.ID, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-TMA-001', 'TAREA_MATERIAL', tm.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadTareaMaterialCantidadDesperdiciadaNegativa() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_TMA_002';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tm = listarRegistros('TAREA_MATERIAL', { ACTIVO: 'SÍ' })[0];
  if (!tm) throw new Error('FUNC-TMA-002_TEST_ERROR: no existe un TAREA_MATERIAL activo utilizable');

  var hoja = obtenerHojaEntidadPruebaIntegridad_('TAREA_MATERIAL');
  var valoresOriginales = { CANTIDAD_DESPERDICIADA: tm.CANTIDAD_DESPERDICIADA };

  try {
    escribirCamposRegistroIntegridad_(hoja, tm.ID, { CANTIDAD_DESPERDICIADA: -1 });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-TMA-002', 'TAREA_MATERIAL', tm.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hoja, tm.ID, valoresOriginales);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-TMA-002', 'TAREA_MATERIAL', tm.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadTareaMaterialConTareaInactiva() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_TMA_003';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tm = listarRegistros('TAREA_MATERIAL', { ACTIVO: 'SÍ' })[0];
  if (!tm) throw new Error('FUNC-TMA-003_TEST_ERROR: no existe un TAREA_MATERIAL activo utilizable');

  var hojaTarea = obtenerHojaEntidadPruebaIntegridad_('TAREA');

  try {
    escribirCamposRegistroIntegridad_(hojaTarea, tm.TAREA_ID, { ACTIVO: 'NO' });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-TMA-003', 'TAREA_MATERIAL', tm.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hojaTarea, tm.TAREA_ID, { ACTIVO: 'SÍ' });
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-TMA-003', 'TAREA_MATERIAL', tm.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadTareaMaterialConMaterialInactivo() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_TMA_004';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tm = listarRegistros('TAREA_MATERIAL', { ACTIVO: 'SÍ' })[0];
  if (!tm) throw new Error('FUNC-TMA-004_TEST_ERROR: no existe un TAREA_MATERIAL activo utilizable');

  var hojaMaterial = obtenerHojaEntidadPruebaIntegridad_('MATERIAL');

  try {
    escribirCamposRegistroIntegridad_(hojaMaterial, tm.MATERIAL_ID, { ACTIVO: 'NO' });
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-TMA-004', 'TAREA_MATERIAL', tm.ID, 1);
  } finally {
    escribirCamposRegistroIntegridad_(hojaMaterial, tm.MATERIAL_ID, { ACTIVO: 'SÍ' });
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-TMA-004', 'TAREA_MATERIAL', tm.ID);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function probarIntegridadTareaMaterialDuplicado() {
  var packageName = 'PROBAR_INTEGRIDAD_FUNC_TMA_005';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  /* Mismo criterio que FUNC-PMA-003: fila cruda, no vía repositorio
   * (que ya rechaza este duplicado por su cuenta a nivel de aplicación). */
  var hoja = obtenerHojaEntidadPruebaIntegridad_('TAREA_MATERIAL');
  var original = seleccionarPrimerRegistroActivo_('TAREA_MATERIAL');
  var idTemporal = 'TMA-AUD-FUNC-TMA-005';

  try {
    eliminarFilaPorIdIntegridad_(hoja, idTemporal);

    var filaTemporal = Object.assign({}, original, {
      ID: idTemporal,
      TAREA_ID: original.TAREA_ID,
      MATERIAL_ID: original.MATERIAL_ID,
      ACTIVO: 'SÍ'
    });

    insertarFilaCrudaIntegridad_(hoja, filaTemporal);
    SpreadsheetApp.flush();

    assertHallazgoIntegridad_('FUNC-TMA-005', 'TAREA_MATERIAL', idTemporal, 1);
  } finally {
    eliminarFilaPorIdIntegridad_(hoja, idTemporal);
    SpreadsheetApp.flush();
  }

  assertSinHallazgoIntegridad_('FUNC-TMA-005', 'TAREA_MATERIAL', idTemporal);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

/* ---------------------------------------------------------------- */
/* Suite completa                                                    */
/* ---------------------------------------------------------------- */

function ejecutarSuiteIntegridadGap21ReglasFuncionales() {
  var packageName = 'SUITE_INTEGRIDAD_GAP_21_REGLAS_FUNCIONALES';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var pruebas = [
    probarIntegridadDecisionAbiertaConResolucionInformada,
    probarIntegridadDecisionFechaResolucionAnteriorCreacion,
    probarIntegridadDecisionFechaLimiteAnteriorCreacion,
    probarIntegridadProductoMaterialConProductoInactivo,
    probarIntegridadProductoMaterialConMaterialInactivo,
    probarIntegridadProductoMaterialDuplicado,
    probarIntegridadProcesoCompletadoConTareaNoTerminada,
    probarIntegridadProcesoAvancePorTareasDifiereDePromedio,
    probarIntegridadTareaFechaFinPlanAnteriorInicioPlan,
    probarIntegridadTareaPendienteConFechaInicioReal,
    probarIntegridadTareaEnProcesoSinFechaInicioReal,
    probarIntegridadTareaTerminadaSinFechaInicioReal,
    probarIntegridadTareaTerminadaSinFechaFinReal,
    probarIntegridadTareaTerminadaDuracionRealInvalida,
    probarIntegridadTareaPredecesoraInexistente,
    probarIntegridadTareaPredecesoraDeOtroProceso,
    probarIntegridadTareaMaterialCantidadConsumidaNegativa,
    probarIntegridadTareaMaterialCantidadDesperdiciadaNegativa,
    probarIntegridadTareaMaterialConTareaInactiva,
    probarIntegridadTareaMaterialConMaterialInactivo,
    probarIntegridadTareaMaterialDuplicado
  ];

  pruebas.forEach(function (prueba) { prueba(); });

  console.log('OK pruebas_superadas=' + pruebas.length);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' result=OK');
  return true;
}

function ejecutarSuiteIntegridadGap21ReglasFuncionalesLote1() {
  [
    probarIntegridadDecisionAbiertaConResolucionInformada,
    probarIntegridadDecisionFechaResolucionAnteriorCreacion,
    probarIntegridadDecisionFechaLimiteAnteriorCreacion,
    probarIntegridadProductoMaterialConProductoInactivo,
    probarIntegridadProductoMaterialConMaterialInactivo,
    probarIntegridadProductoMaterialDuplicado,
    probarIntegridadProcesoCompletadoConTareaNoTerminada
  ].forEach(function (p) { p(); });
  return 'result=OK lote=1';
}

function ejecutarSuiteIntegridadGap21ReglasFuncionalesLote2() {
  [
    probarIntegridadProcesoAvancePorTareasDifiereDePromedio,
    probarIntegridadTareaFechaFinPlanAnteriorInicioPlan,
    probarIntegridadTareaPendienteConFechaInicioReal,
    probarIntegridadTareaEnProcesoSinFechaInicioReal,
    probarIntegridadTareaTerminadaSinFechaInicioReal,
    probarIntegridadTareaTerminadaSinFechaFinReal,
    probarIntegridadTareaTerminadaDuracionRealInvalida
  ].forEach(function (p) { p(); });
  return 'result=OK lote=2';
}

function ejecutarSuiteIntegridadGap21ReglasFuncionalesLote3() {
  [
    probarIntegridadTareaPredecesoraInexistente,
    probarIntegridadTareaPredecesoraDeOtroProceso,
    probarIntegridadTareaMaterialCantidadConsumidaNegativa,
    probarIntegridadTareaMaterialCantidadDesperdiciadaNegativa,
    probarIntegridadTareaMaterialConTareaInactiva,
    probarIntegridadTareaMaterialConMaterialInactivo,
    probarIntegridadTareaMaterialDuplicado
  ].forEach(function (p) { p(); });
  return 'result=OK lote=3';
}

/* ---------------------------------------------------------------- */
/* PRUEBAS MANUALES DEL REPORTE DE INTEGRIDAD                       */
/* ---------------------------------------------------------------- */

function probarReporteIntegridad() {
  console.log(
    JSON.stringify(
      obtenerReporteIntegridad(),
      null,
      2
    )
  );
}
