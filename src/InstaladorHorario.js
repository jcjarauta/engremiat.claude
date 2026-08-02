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

    /*
     * Columnas HORA_INICIO/HORA_FIN (5 y 6) como texto plano ("@"), no
     * "Automático" -- ver conversacion: Sheets autoconvertia "16:00" a
     * un valor interno de hora al escribirlo, y se leia de vuelta como
     * Date con la fecha ficticia 1899-12-30 (bug real visto en la
     * ficha de Persona/Equipo). Con la columna en formato texto, el
     * valor se guarda literal. Se aplica siempre, idempotente.
     */
    hoja.getRange(2, 5, Math.max(hoja.getMaxRows() - 1, 1), 2).setNumberFormat('@');
    console.log('OK formato_texto_horas_aplicado=true');

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

/*
 * N1.1: corrige filas HORARIO ya sembradas antes del fix de formato de
 * columna -- sus celdas HORA_INICIO/HORA_FIN quedaron guardadas como
 * valor de hora (Date con fecha ficticia 1899-12-30) en vez de texto
 * "HH:MM". Idempotente: una fila ya corregida (texto) no se toca.
 * Ejecutar despues de instalarEntidadHorario() (que ya deja la columna
 * en formato texto para altas futuras).
 */
function corregirFormatoHorasHorario() {
  var packageName = 'CORREGIR_FORMATO_HORAS_HORARIO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(ENTIDADES_MVP.HORARIO.hoja);

  if (!hoja) {
    throw new Error('CORREGIR_FORMATO_HORAS_HORARIO_ERROR: no existe la hoja ' + ENTIDADES_MVP.HORARIO.hoja);
  }

  var ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    console.log('OK sin_filas=true');
    console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
    return true;
  }

  // Reafirma el formato texto por si esta funcion se ejecuta antes que instalarEntidadHorario().
  hoja.getRange(2, 5, ultimaFila - 1, 2).setNumberFormat('@');

  var rango = hoja.getRange(2, 5, ultimaFila - 1, 2);
  var valores = rango.getValues();
  var corregidas = 0;

  var valoresCorregidos = valores.map(function (fila, indiceFila) {
    return fila.map(function (valor, indiceCol) {
      if (Object.prototype.toString.call(valor) === '[object Date]') {
        var textoHora = Utilities.formatDate(valor, Session.getScriptTimeZone() || 'Europe/Madrid', 'HH:mm');
        corregidas++;
        console.log('OK corregida_fila=' + (indiceFila + 2) + ' columna=' + (indiceCol === 0 ? 'HORA_INICIO' : 'HORA_FIN') + ' valor=' + textoHora);
        return textoHora;
      }
      return valor;
    });
  });

  rango.setValues(valoresCorregidos);

  console.log('OK celdas_corregidas=' + corregidas);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/*
 * N1.2: añade rango de vigencia temporal opcional a HORARIO --
 * ver conversacion: sin esto no hay forma de expresar "este horario
 * solo aplica en diciembre" o "horario reducido solo en verano" sin
 * crear filas contradictorias para el mismo dia de la semana.
 * Columnas añadidas al final (agregarColumnasSiFaltan_), no en medio,
 * mismo criterio de seguridad que el resto del sistema frente a filas
 * historicas ya existentes. Ambas opcionales: sin vigencia informada,
 * el horario se sigue interpretando como permanente (comportamiento
 * actual, sin cambios).
 */
function instalarVigenciaHorario() {
  var packageName = 'INSTALAR_VIGENCIA_HORARIO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  agregarColumnasSiFaltan_(ss, 'HORARIO', ['FECHA_INICIO_VIGENCIA', 'FECHA_FIN_VIGENCIA']);

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}
