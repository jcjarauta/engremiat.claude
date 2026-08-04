/**
 * Eje económico, Capa 1 de convocatorias (ver conversación -- "un
 * buscador de convocatorias por scrap web... generar propuestas de
 * participación"). Esta pieza es solo el registro y seguimiento
 * determinista: CONVOCATORIA (la oportunidad en sí) + un enlace
 * opcional desde FUENTE_FINANCIACION (tu aplicación concreta a una
 * convocatoria). El scraping (Capa 2) y la generación de propuestas
 * con IA (Capa 3/L6) quedan fuera, tal como se acordó.
 *
 * TIPO_PROYECTO_ELEGIBLE reutiliza el catálogo CFG_TIPO_PROYECTO ya
 * existente (no uno nuevo) -- así el filtro de encaje determinista
 * (obtenerProyectosQueEncajan, FichaConvocatoriaService.js) es una
 * simple igualdad de catálogo compartido, sin taxonomía duplicada.
 *
 * Crea la hoja 36_CONVOCATORIA + sus catálogos, y añade la columna
 * CONVOCATORIA_ID (opcional) a 31_FUENTE_FINANCIACION si falta.
 * Idempotente. Debe ejecutarse una única vez, manualmente.
 */
function instalarEntidadConvocatoria() {
  var packageName = 'INSTALAR_ENTIDAD_CONVOCATORIA';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var tiposConvocatoria = [
    ['SUBVENCION_PUBLICA', 'Subvención pública'],
    ['PREMIO', 'Premio'],
    ['CONCURSO', 'Concurso'],
    ['AYUDA_PRIVADA', 'Ayuda privada'],
    ['DONACION', 'Donación'],
    ['OTRO', 'Otro']
  ];

  var estadosConvocatoria = [
    ['ABIERTA', 'Abierta'],
    ['CERRADA', 'Cerrada'],
    ['PRESENTADA', 'Presentada'],
    ['RESUELTA', 'Resuelta'],
    ['DESCARTADA', 'Descartada']
  ];

  var cabecerasConvocatoria = [
    'ID', 'NOMBRE', 'ENTIDAD_CONVOCANTE', 'TIPO', 'IMPORTE_DISPONIBLE',
    'IMPORTE_MINIMO_SOLICITUD', 'IMPORTE_MAXIMO_SOLICITUD', 'TIPO_PROYECTO_ELEGIBLE',
    'FECHA_LIMITE', 'REQUISITOS', 'URL_BASES', 'ESTADO',
    'FECHA_CREACION', 'CREADO_POR', 'FECHA_MODIFICACION', 'MODIFICADO_POR', 'ACTIVO', 'OBSERVACIONES'
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');
    if (!hojaConfig) {
      throw new Error('INSTALAR_ENTIDAD_CONVOCATORIA_ERROR: no existe la hoja 90_CONFIGURACION');
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'TIPO_CONVOCATORIA', tiposConvocatoria);
    crearCatalogoNuevoL3_(ss, hojaConfig, 'ESTADO_CONVOCATORIA', estadosConvocatoria);

    // Permite adjuntar DOCUMENTO (bases, convocatoria en PDF...) a una
    // CONVOCATORIA, igual que ya se hizo para Recurso/Documento/Incidencia.
    ampliarCatalogoL2_(ss, hojaConfig, 'ENTIDAD_DOCUMENTO', null, [
      ['CONVOCATORIA', 'Convocatoria']
    ]);

    var hojaConvocatoria = ss.getSheetByName(ENTIDADES_MVP.CONVOCATORIA.hoja);
    if (!hojaConvocatoria) {
      hojaConvocatoria = ss.insertSheet(ENTIDADES_MVP.CONVOCATORIA.hoja);
      hojaConvocatoria.getRange(1, 1, 1, cabecerasConvocatoria.length).setValues([cabecerasConvocatoria]);
      hojaConvocatoria.setFrozenRows(1);
      console.log('OK hoja_creada=' + ENTIDADES_MVP.CONVOCATORIA.hoja + ' columnas=' + cabecerasConvocatoria.length);
    } else {
      var ultimaColumna = hojaConvocatoria.getLastColumn();
      var cabecerasActuales = ultimaColumna > 0
        ? hojaConvocatoria.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function (v) { return String(v || '').trim(); })
        : [];
      var faltantes = cabecerasConvocatoria.filter(function (c) { return cabecerasActuales.indexOf(c) === -1; });
      if (faltantes.length > 0) {
        hojaConvocatoria.getRange(1, ultimaColumna + 1, 1, faltantes.length).setValues([faltantes]);
        console.log('OK columnas_anadidas_a_convocatoria=' + faltantes.join(','));
      } else {
        console.log('OK hoja_ya_existente_y_valida=' + ENTIDADES_MVP.CONVOCATORIA.hoja);
      }
    }

    // FUENTE_FINANCIACION.CONVOCATORIA_ID (opcional): vincula la
    // aplicación concreta a la convocatoria de origen. Aditivo, columna
    // al final -- la hoja ya existe con datos reales desde la Fase 1.
    var hojaFuente = ss.getSheetByName(ENTIDADES_MVP.FUENTE_FINANCIACION.hoja);
    if (!hojaFuente) {
      throw new Error('INSTALAR_ENTIDAD_CONVOCATORIA_ERROR: no existe la hoja ' + ENTIDADES_MVP.FUENTE_FINANCIACION.hoja);
    }
    var ultimaColumnaFuente = hojaFuente.getLastColumn();
    var cabecerasFuenteActuales = hojaFuente.getRange(1, 1, 1, ultimaColumnaFuente).getDisplayValues()[0].map(function (v) { return String(v || '').trim(); });
    if (cabecerasFuenteActuales.indexOf('CONVOCATORIA_ID') === -1) {
      hojaFuente.getRange(1, ultimaColumnaFuente + 1).setValue('CONVOCATORIA_ID');
      console.log('OK columna_anadida_a_fuente_financiacion=CONVOCATORIA_ID');
    } else {
      console.log('OK columna_ya_existia_en_fuente_financiacion=CONVOCATORIA_ID');
    }
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
