/**
 * Eje económico, Fase 2 (ver conversación): completa lo que faltaba de
 * la Fase 1 -- campos de coste en RECURSO (amortización/periódico,
 * "ambos según el recurso") y la entidad COSTE genérica (costes de
 * actividad sueltos: honorarios de externos, transporte, seguros...,
 * vinculados a Campaña/Proyecto/Producto/Recurso).
 *
 * RECURSO ya existe con datos reales -- sus 5 columnas nuevas se
 * AÑADEN AL FINAL de la cabecera (no se insertan en medio, para no
 * desplazar ninguna columna existente ni romper referencias por
 * índice). Idempotente. Debe ejecutarse una única vez, manualmente.
 */
function instalarEjeEconomicoFase2() {
  var packageName = 'INSTALAR_EJE_ECONOMICO_FASE_2';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var modosCosteRecurso = [
    ['AMORTIZACION', 'Amortización'],
    ['PERIODICO', 'Periódico'],
    ['SIN_COSTE', 'Sin coste']
  ];

  var periodicidadesCoste = [
    ['MENSUAL', 'Mensual'],
    ['ANUAL', 'Anual']
  ];

  var entidadesCoste = [
    ['CAMPANA', 'Campaña'],
    ['PROYECTO', 'Proyecto'],
    ['PRODUCTO', 'Producto'],
    ['RECURSO', 'Recurso']
  ];

  var estadosCoste = [
    ['PREVISTO', 'Previsto'],
    ['CONFIRMADO', 'Confirmado'],
    ['PAGADO', 'Pagado']
  ];

  var columnasCosteRecurso = ['MODO_COSTE', 'COSTE_ADQUISICION', 'VIDA_UTIL_ANOS', 'COSTE_PERIODICO', 'PERIODICIDAD_COSTE'];

  var cabecerasCoste = [
    'ID',
    'ENTIDAD_TIPO',
    'ENTIDAD_ID',
    'CATEGORIA',
    'CONCEPTO',
    'IMPORTE',
    'FECHA',
    'ESTADO',
    'FECHA_CREACION',
    'CREADO_POR',
    'FECHA_MODIFICACION',
    'MODIFICADO_POR',
    'ACTIVO',
    'OBSERVACIONES'
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error('INSTALAR_EJE_ECONOMICO_FASE_2_ERROR: no existe la hoja 90_CONFIGURACION');
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'MODO_COSTE_RECURSO', modosCosteRecurso);
    crearCatalogoNuevoL3_(ss, hojaConfig, 'PERIODICIDAD_COSTE', periodicidadesCoste);
    crearCatalogoNuevoL3_(ss, hojaConfig, 'ENTIDAD_COSTE', entidadesCoste);
    crearCatalogoNuevoL3_(ss, hojaConfig, 'ESTADO_COSTE', estadosCoste);

    // RECURSO: añadir las 5 columnas de coste al final, solo si faltan.
    var hojaRecurso = ss.getSheetByName(ENTIDADES_MVP.RECURSO.hoja);
    if (!hojaRecurso) {
      throw new Error('INSTALAR_EJE_ECONOMICO_FASE_2_ERROR: no existe la hoja ' + ENTIDADES_MVP.RECURSO.hoja);
    }
    var ultimaColumnaRecurso = hojaRecurso.getLastColumn();
    var cabecerasRecursoActuales = hojaRecurso.getRange(1, 1, 1, ultimaColumnaRecurso).getDisplayValues()[0].map(function (v) {
      return String(v || '').trim();
    });
    var columnasFaltantes = columnasCosteRecurso.filter(function (c) { return cabecerasRecursoActuales.indexOf(c) === -1; });
    if (columnasFaltantes.length > 0) {
      hojaRecurso.getRange(1, ultimaColumnaRecurso + 1, 1, columnasFaltantes.length).setValues([columnasFaltantes]);
      console.log('OK columnas_coste_anadidas_a_recurso=' + columnasFaltantes.join(','));
    } else {
      console.log('OK columnas_coste_ya_existian_en_recurso=true');
    }

    // COSTE: hoja nueva, mismo patrón idempotente que el resto.
    var nombreHojaCoste = ENTIDADES_MVP.COSTE.hoja;
    var hojaCoste = ss.getSheetByName(nombreHojaCoste);
    if (!hojaCoste) {
      hojaCoste = ss.insertSheet(nombreHojaCoste);
      hojaCoste.getRange(1, 1, 1, cabecerasCoste.length).setValues([cabecerasCoste]);
      hojaCoste.setFrozenRows(1);
      console.log('OK hoja_creada=' + nombreHojaCoste + ' columnas=' + cabecerasCoste.length);
    } else {
      var ultimaColumnaCoste = hojaCoste.getLastColumn();
      var cabecerasCosteActuales = ultimaColumnaCoste > 0
        ? hojaCoste.getRange(1, 1, 1, ultimaColumnaCoste).getDisplayValues()[0].map(function (v) { return String(v || '').trim(); })
        : [];
      var faltantesCoste = cabecerasCoste.filter(function (c) { return cabecerasCosteActuales.indexOf(c) === -1; });
      if (faltantesCoste.length > 0) {
        // Añade al final (aditivo, ver conversación -- la hoja ya se
        // había creado antes de decidir el campo CATEGORIA).
        hojaCoste.getRange(1, ultimaColumnaCoste + 1, 1, faltantesCoste.length).setValues([faltantesCoste]);
        console.log('OK columnas_anadidas_a_coste=' + faltantesCoste.join(','));
      } else {
        console.log('OK hoja_ya_existente_y_valida=' + nombreHojaCoste);
      }
    }
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
