/**
 * Prueba reactiva de la Fase N8 (ver conversación): importación masiva
 * de Recursos y Personas/EQUIPO_MIEMBRO. Escribe filas de prueba
 * directamente en las hojas STG_* (mismo mecanismo que usaría un
 * humano rellenando la hoja a mano), ejecuta dry-run + confirmación,
 * y verifica: alta de un RECURSO raíz + uno hijo (UBICACION_ID resuelto
 * en la segunda pasada), alta de una Persona + un Equipo con
 * COORDINADOR_ID resuelto en la segunda pasada, y alta de la relación
 * EQUIPO_MIEMBRO correspondiente. Limpia todo (registros reales
 * desactivados + filas de staging borradas) en el `finally`,
 * independientemente de si la prueba pasa o falla.
 */
function pruebaImportacionRecursosPersonas() {
  var sufijo = String(Date.now()).slice(-6);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var idsCreados = { RECURSO: [], PERSONA_EQUIPO: [], EQUIPO_MIEMBRO: [] };
  var filasEscritas = [];

  function escribirFilaStaging_(nombreHoja, fila) {
    var hoja = ss.getSheetByName(nombreHoja);
    var numeroFila = hoja.getLastRow() + 1;
    var cabeceras = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
    var valores = cabeceras.map(function (c) { return fila[c] !== undefined ? fila[c] : ''; });
    hoja.getRange(numeroFila, 1, 1, valores.length).setValues([valores]);
    filasEscritas.push({ hoja: nombreHoja, fila: numeroFila });
    return numeroFila;
  }

  try {
    escribirFilaStaging_('STG_RECURSO', {
      ID_TEMPORAL: 'R1', UBICACION_TEMPORAL: '', CODIGO: 'ESP-N8-' + sufijo,
      NOMBRE: 'Espacio prueba N8 ' + sufijo, CLASE_RECURSO: 'Espacio', CATEGORIA_RECURSO: '', ESTADO: 'Disponible'
    });
    escribirFilaStaging_('STG_RECURSO', {
      ID_TEMPORAL: 'R2', UBICACION_TEMPORAL: 'R1', CODIGO: 'HER-N8-' + sufijo,
      NOMBRE: 'Herramienta prueba N8 ' + sufijo, CLASE_RECURSO: 'Herramienta', CATEGORIA_RECURSO: '', ESTADO: 'Disponible'
    });
    escribirFilaStaging_('STG_PERSONA', {
      ID_TEMPORAL: 'P1', COORDINADOR_TEMPORAL: '', TIPO: 'Persona', NOMBRE: 'Persona prueba N8 ' + sufijo,
      ROL: 'Voluntariado', CAPACIDAD_SEMANAL_DIAS: 3, DISPONIBILIDAD: 'Completa', ESTADO: 'Disponible'
    });
    escribirFilaStaging_('STG_PERSONA', {
      ID_TEMPORAL: 'P2', COORDINADOR_TEMPORAL: 'P1', TIPO: 'Equipo', NOMBRE: 'Equipo prueba N8 ' + sufijo,
      ROL: 'Voluntariado', CAPACIDAD_SEMANAL_DIAS: 5, DISPONIBILIDAD: 'Completa', ESTADO: 'Disponible'
    });
    escribirFilaStaging_('STG_EQUIPO_MIEMBRO', {
      ID_TEMPORAL: 'EM1', EQUIPO_TEMPORAL: 'P2', MIEMBRO_TEMPORAL: 'P1', ESTADO: 'Activa'
    });

    var dryRun = procesarImportacionRecursosPersonas_(false);
    if (!dryRun.ok || dryRun.errores.length > 0) {
      throw new Error('FALLO: dry-run con errores inesperados: ' + JSON.stringify(dryRun.errores));
    }
    if (dryRun.resumen.recursos !== 2 || dryRun.resumen.personas !== 2 || dryRun.resumen.equipoMiembros !== 1) {
      throw new Error('FALLO: resumen de dry-run inesperado: ' + JSON.stringify(dryRun.resumen));
    }

    var resultado = procesarImportacionRecursosPersonas_(true);
    if (!resultado.ok) throw new Error('FALLO: la confirmación devolvió ok=false');

    var filaR1 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STG_RECURSO').getRange(filasEscritas[0].fila, 1, 1, 20).getValues()[0];
    var filaR2 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STG_RECURSO').getRange(filasEscritas[1].fila, 1, 1, 20).getValues()[0];
    var cabecerasRecurso = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STG_RECURSO').getRange(1, 1, 1, 20).getValues()[0];
    var colIdReal = cabecerasRecurso.indexOf('ID_REAL');
    var r1Id = filaR1[colIdReal];
    var r2Id = filaR2[colIdReal];
    idsCreados.RECURSO.push(r1Id, r2Id);

    var registroR2 = obtenerRegistroPorId('RECURSO', r2Id);
    if (registroR2.UBICACION_ID !== r1Id) {
      throw new Error('FALLO: R2.UBICACION_ID esperado=' + r1Id + ' obtenido=' + registroR2.UBICACION_ID);
    }

    var cabecerasPersona = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STG_PERSONA').getRange(1, 1, 1, 20).getValues()[0];
    var colIdRealPersona = cabecerasPersona.indexOf('ID_REAL');
    var filaP1 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STG_PERSONA').getRange(filasEscritas[2].fila, 1, 1, 20).getValues()[0];
    var filaP2 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STG_PERSONA').getRange(filasEscritas[3].fila, 1, 1, 20).getValues()[0];
    var p1Id = filaP1[colIdRealPersona];
    var p2Id = filaP2[colIdRealPersona];
    // Orden inverso a proposito (ver conversacion -- bug real encontrado
    // verificando esta prueba): P2 referencia a P1 como COORDINADOR_ID,
    // y actualizarRegistroTransaccional revalida el registro completo
    // en cada escritura -- desactivar al coordinador (P1) antes que al
    // equipo que lo referencia (P2) hace fallar la desactivacion de P2
    // ("El coordinador debe estar ACTIVO=SI"). Se desactiva primero
    // quien referencia, luego el referenciado.
    idsCreados.PERSONA_EQUIPO.push(p2Id, p1Id);

    var registroP2 = obtenerRegistroPorId('PERSONA_EQUIPO', p2Id);
    if (registroP2.COORDINADOR_ID !== p1Id) {
      throw new Error('FALLO: P2.COORDINADOR_ID esperado=' + p1Id + ' obtenido=' + registroP2.COORDINADOR_ID);
    }

    var cabecerasEM = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STG_EQUIPO_MIEMBRO').getRange(1, 1, 1, 20).getValues()[0];
    var colIdRealEM = cabecerasEM.indexOf('ID_REAL');
    var filaEM1 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STG_EQUIPO_MIEMBRO').getRange(filasEscritas[4].fila, 1, 1, 20).getValues()[0];
    var em1Id = filaEM1[colIdRealEM];
    idsCreados.EQUIPO_MIEMBRO.push(em1Id);

    var registroEM1 = obtenerRegistroPorId('EQUIPO_MIEMBRO', em1Id);
    if (registroEM1.EQUIPO_ID !== p2Id || registroEM1.MIEMBRO_ID !== p1Id) {
      throw new Error('FALLO: EQUIPO_MIEMBRO con EQUIPO_ID/MIEMBRO_ID incorrectos: ' + JSON.stringify(registroEM1));
    }

    console.log('OK pruebaImportacionRecursosPersonas: R1=' + r1Id + ' R2=' + r2Id + ' (UBICACION_ID correcto), P1=' + p1Id + ' P2=' + p2Id + ' (COORDINADOR_ID correcto), EM1=' + em1Id);
    return 'result=OK';
  } finally {
    idsCreados.EQUIPO_MIEMBRO.forEach(function (id) { if (id) desactivarRegistro('EQUIPO_MIEMBRO', id); });
    idsCreados.PERSONA_EQUIPO.forEach(function (id) { if (id) desactivarRegistro('PERSONA_EQUIPO', id); });
    idsCreados.RECURSO.forEach(function (id) { if (id) desactivarRegistro('RECURSO', id); });
    filasEscritas.forEach(function (f) {
      var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(f.hoja);
      var ultimaColumna = hoja.getLastColumn();
      hoja.getRange(f.fila, 1, 1, ultimaColumna).clearContent();
    });
  }
}
