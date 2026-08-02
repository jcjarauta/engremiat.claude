/**
 * Mejoras acordadas en la auditoria piloto end-to-end (2026-08-01):
 * catalogo nuevo de fase de produccion, rediseno de TIPO_PROYECTO,
 * aclaracion de CFG_MODO_USO. Idempotente. Debe ejecutarse una unica
 * vez, manualmente.
 */
function instalarMejorasAuditoriaPiloto() {
  var packageName = 'INSTALAR_MEJORAS_AUDITORIA_PILOTO';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error(
        'INSTALAR_MEJORAS_AUDITORIA_PILOTO_ERROR: no existe la hoja 90_CONFIGURACION'
      );
    }

    /*
     * Hallazgo #2: clasificar cada PROCESO por fase de produccion, para
     * poder agrupar y calcular fechas de cada fase agregando sus procesos.
     */
    crearCatalogoNuevoL3_(ss, hojaConfig, 'FASE_PRODUCCION', [
      ['PREPRODUCCION', 'Preproducción'],
      ['PRODUCCION', 'Producción'],
      ['POSTPRODUCCION', 'Postproducción']
    ]);

    agregarColumnasSiFaltan_(ss, 'PROCESO', ['FASE_PRODUCCION']);

    /*
     * Hallazgo #10 (ampliado): CAMPANA no tenia ningun campo de objetivo
     * (F-005 del backlog original). Se añaden OBJETIVO/RESULTADO_ESPERADO,
     * mismo nivel estrategico que PROYECTO.
     */
    agregarColumnasSiFaltan_(ss, 'CAMPANA', ['OBJETIVO', 'RESULTADO_ESPERADO']);

    /*
     * Hallazgo #3: TIPO_PROYECTO mezclaba tipo/urgencia/estado
     * (Urgente/Importante/Propuesta). Se sustituye por la naturaleza
     * real del proyecto -- la urgencia ya la cubre PRIORIDAD aparte.
     * Se AÑADEN los valores nuevos sin borrar los antiguos (para no
     * romper proyectos reales ya creados con Urgente/Importante/
     * Propuesta); el catalogo antiguo queda como legado, deprecado en
     * la documentacion pero no eliminado.
     *
     * IMPORTANTE: TIPO_PROYECTO ya existia con 3 filas -- hay que usar
     * ampliarCatalogoL2_ (inserta contiguo al bloque existente), NUNCA
     * crearCatalogoNuevoL3_ (piensa que la categoria no existe todavia
     * y añade al final de toda la hoja, rompiendo el named range al
     * quedar no contiguo -- bug real detectado y corregido con
     * corregirCatalogoTipoProyecto_ en CorregirCatalogoTipoProyecto.js).
     */
    ampliarCatalogoL2_(ss, hojaConfig, 'TIPO_PROYECTO', null, [
      ['ENCARGO_CLIENTE', 'Encargo de cliente'],
      ['PRODUCCION_PROPIA_STOCK', 'Producción propia / stock'],
      ['PROYECTO_FORMATIVO', 'Proyecto formativo'],
      ['COLABORACION_SOCIAL', 'Colaboración social'],
      ['PROTOTIPO_ID', 'Prototipo / I+D'],
      ['MANTENIMIENTO_REPARACION', 'Mantenimiento / reparación']
    ]);

    /*
     * Hallazgo #15: aclarar CFG_MODO_USO añadiendo a que se refiere cada
     * valor entre parentesis, sin cambiar la clave interna (no rompe
     * datos ya guardados, que se comparan por texto mostrado).
     */
    var aclaracionesModoUso = {
      REFERENCIA_COMPARTIDA: 'Referencia compartida (se usa tal cual, sin copiarlo)',
      REUTILIZACION_SIN_CAMBIOS: 'Reutilización sin cambios (mismo diseño, otro proyecto)',
      ADAPTACION_ESPECIFICA: 'Adaptación específica (variante modificada para este proyecto)',
      CLONACION_COMO_NUEVO: 'Clonación como nuevo (copia independiente para modificar)'
    };

    var datosConfig = hojaConfig.getDataRange().getValues();
    var modoUsoAclarados = 0;

    for (var i = 1; i < datosConfig.length; i++) {
      var categoria = String(datosConfig[i][1] || '').trim();
      var clave = String(datosConfig[i][2] || '').trim();

      if (categoria === 'MODO_USO' && aclaracionesModoUso[clave]) {
        hojaConfig.getRange(i + 1, 4).setValue(aclaracionesModoUso[clave]);
        modoUsoAclarados++;
      }
    }

    console.log('OK modo_uso_aclarado=' + modoUsoAclarados);
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
