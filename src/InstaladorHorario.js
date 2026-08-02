/**
 * Instalador de la entidad HORARIO (franjas semanales recurrentes,
 * ver conversacion: horario de apertura del taller, horario de
 * profesionales, franja de voluntarios). Patron polimorfico
 * ENTIDAD_TIPO/ENTIDAD_ID, igual que DOCUMENTO/ASIGNACION/RELACION/
 * VINCULO, pero con un catalogo propio y mas acotado (CFG_ENTIDAD_HORARIO
 * = solo Recurso y Persona/Equipo) en vez de reutilizar CFG_ENTIDAD_DOCUMENTO,
 * que arrastraria opciones sin sentido (Decisión, Incidencia...).
 *
 * Sin campo de hora nativo en el motor de formularios -- HORA_INICIO/
 * HORA_FIN se guardan como texto "HH:MM", validado por regla de negocio
 * (ver validarReglasNegocioHorario_ en Formularios.js).
 *
 * Crea la hoja 29_HORARIO con su cabecera si no existe. Idempotente.
 * Debe ejecutarse una unica vez, manualmente.
 */
function instalarEntidadHorario() {
  var packageName = 'INSTALAR_ENTIDAD_HORARIO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var cabeceras = [
    'ID',
    'ENTIDAD_TIPO',
    'ENTIDAD_ID',
    'DIA_SEMANA',
    'HORA_INICIO',
    'HORA_FIN',
    'ESTADO',
    'FECHA_CREACION',
    'CREADO_POR',
    'FECHA_MODIFICACION',
    'MODIFICADO_POR',
    'ACTIVO',
    'OBSERVACIONES'
  ];

  var tiposEntidadHorario = [
    ['RECURSO', 'Recurso'],
    ['PERSONA_EQUIPO', 'Persona/Equipo']
  ];

  var diasSemana = [
    ['LUNES', 'Lunes'],
    ['MARTES', 'Martes'],
    ['MIERCOLES', 'Miércoles'],
    ['JUEVES', 'Jueves'],
    ['VIERNES', 'Viernes'],
    ['SABADO', 'Sábado'],
    ['DOMINGO', 'Domingo']
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var nombreHoja = ENTIDADES_MVP.HORARIO.hoja;
    var hoja = ss.getSheetByName(nombreHoja);

    if (!hoja) {
      hoja = ss.insertSheet(nombreHoja);
      hoja.getRange(1, 1, 1, cabeceras.length).setValues([cabeceras]);
      hoja.setFrozenRows(1);
      console.log('OK hoja_creada=' + nombreHoja + ' columnas=' + cabeceras.length);
    } else {
      var ultimaColumna = hoja.getLastColumn();
      var cabecerasActuales = ultimaColumna > 0
        ? hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function (v) {
            return String(v || '').trim();
          })
        : [];

      var faltantes = cabeceras.filter(function (c) {
        return cabecerasActuales.indexOf(c) === -1;
      });

      if (faltantes.length > 0) {
        throw new Error(
          'INSTALAR_ENTIDAD_HORARIO_ERROR: la hoja ' + nombreHoja + ' ya existe pero le faltan columnas: ' + faltantes.join(', ')
        );
      }

      console.log('OK hoja_ya_existente_y_valida=' + nombreHoja);
    }

    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error('INSTALAR_ENTIDAD_HORARIO_ERROR: no existe la hoja 90_CONFIGURACION');
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'ENTIDAD_HORARIO', tiposEntidadHorario);
    crearCatalogoNuevoL3_(ss, hojaConfig, 'DIA_SEMANA', diasSemana);
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}
