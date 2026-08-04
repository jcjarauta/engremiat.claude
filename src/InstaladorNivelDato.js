/**
 * Cierre del hueco de "datos de prueba mezclados con datos reales"
 * (ver conversación -- memoria `latroballa_datos_prueba_a_auditar`,
 * y la valoración de asesor técnico del 2026-08-04). Solución
 * genérica pedida explícitamente por el usuario, con dos niveles
 * distintos en vez de un único ES_PRUEBA binario:
 *
 *   - Operativo (por defecto): campaña real del taller.
 *   - Piloto: campaña de demostración con estructura realista
 *     (Sant Jordi, Navidad, Carnestoltes...), NO se oculta -- es dato
 *     de referencia legítimo, solo se distingue visualmente.
 *   - Auditoría: artefacto nacido de verificar el propio sistema
 *     (campañas "AUD-*", "WORK-AUDIT", "Verificación visual Fase X"),
 *     oculto por defecto en selectores/paneles, visible solo si se
 *     pide explícitamente.
 *
 * Solo en CAMPANA en esta primera pasada (ver conversación -- alcance
 * acotado a propósito): PROYECTO siempre cuelga de una única
 * CAMPANA_ID (resolución directa y sin ambigüedad), pero PRODUCTO se
 * reutiliza entre proyectos/campañas distintas vía PROYECTO_PRODUCTO
 * (N:M) -- filtrar por nivel de dato a partir de PRODUCTO sin más
 * evidencia real de que haga falta se arriesgaba a ocultar datos
 * reales por error, así que se deja fuera de esta fase.
 *
 * Idempotente. Debe ejecutarse una única vez, manualmente.
 */
function instalarNivelDatoCampana() {
  var packageName = 'INSTALAR_NIVEL_DATO_CAMPANA';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var nivelesDato = [
    ['OPERATIVO', 'Operativo'],
    ['PILOTO', 'Piloto'],
    ['AUDITORIA', 'Auditoría']
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');
    if (!hojaConfig) {
      throw new Error('INSTALAR_NIVEL_DATO_CAMPANA_ERROR: no existe la hoja 90_CONFIGURACION');
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'NIVEL_DATO', nivelesDato);

    agregarColumnasSiFaltan_(ss, 'CAMPANA', ['NIVEL_DATO']);
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/*
 * Backfill retroactivo, clasificación confirmada por el usuario
 * (2026-08-04) sobre las 14 campañas activas reales en ese momento:
 * 7 artefactos de auditoría/desarrollo, 7 campañas piloto con
 * estructura realista. Idempotente (usa actualizarRegistroTransaccional,
 * vuelve a ejecutarse sin efecto si ya está clasificado). Debe
 * ejecutarse una única vez, manualmente, después de
 * instalarNivelDatoCampana.
 */
function backfillNivelDatoCampanasExistentes() {
  var packageName = 'BACKFILL_NIVEL_DATO_CAMPANAS_EXISTENTES';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var auditoria = ['CAM-0001', 'CAM-0002', 'CAM-0008', 'CAM-0009', 'CAM-0010', 'CAM-0011', 'CAM-0013'];
  var piloto = ['CAM-0012', 'CAM-0014', 'CAM-0015', 'CAM-0016', 'CAM-0018', 'CAM-0019', 'CAM-0020'];

  var resultados = { auditoria: [], piloto: [], saltadas: [] };

  auditoria.forEach(function (id) {
    if (!obtenerRegistroPorId('CAMPANA', id)) { resultados.saltadas.push(id); return; }
    actualizarRegistroTransaccional('CAMPANA', id, { NIVEL_DATO: 'Auditoría' }, { origen: 'ADMIN' });
    resultados.auditoria.push(id);
  });

  piloto.forEach(function (id) {
    if (!obtenerRegistroPorId('CAMPANA', id)) { resultados.saltadas.push(id); return; }
    actualizarRegistroTransaccional('CAMPANA', id, { NIVEL_DATO: 'Piloto' }, { origen: 'ADMIN' });
    resultados.piloto.push(id);
  });

  console.log('OK auditoria=' + resultados.auditoria.join(',') + ' piloto=' + resultados.piloto.join(',') + ' saltadas=' + resultados.saltadas.join(','));
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return resultados;
}
