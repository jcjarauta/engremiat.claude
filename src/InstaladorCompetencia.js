/**
 * Base de competencias (ver conversación -- "rellenar los huecos del
 * sistema para dejarlo preparado para L6", sin construir L6 en sí:
 * esto es el dato determinista, no un motor de recomendación).
 *
 * COMPETENCIA es una entidad ligera propia (como MATERIAL/PROVEEDOR),
 * no un catálogo de texto -- así se puede referenciar por ID desde dos
 * sitios distintos (Persona y Recurso) en una relación N:M de verdad,
 * mismo patrón ya usado en EQUIPO_MIEMBRO/TAREA_RECURSO/PRODUCTO_MATERIAL
 * (entidad + tabla de unión), no un campo multi-valor -- el motor de
 * formularios no soporta selección múltiple.
 *
 * Crea 3 hojas nuevas (33_COMPETENCIA, 34_PERSONA_COMPETENCIA,
 * 35_RECURSO_COMPETENCIA) y su catálogo de estado propio. Idempotente.
 * Debe ejecutarse una única vez, manualmente.
 */
function instalarEntidadesCompetencia() {
  var packageName = 'INSTALAR_ENTIDADES_COMPETENCIA';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var estadosCompetencia = [
    ['ACTIVA', 'Activa'],
    ['INACTIVA', 'Inactiva']
  ];

  var definiciones = [
    {
      clave: 'COMPETENCIA',
      cabeceras: ['ID', 'NOMBRE', 'DESCRIPCION', 'ESTADO', 'FECHA_CREACION', 'CREADO_POR', 'FECHA_MODIFICACION', 'MODIFICADO_POR', 'ACTIVO', 'OBSERVACIONES']
    },
    {
      clave: 'PERSONA_COMPETENCIA',
      cabeceras: ['ID', 'PERSONA_EQUIPO_ID', 'COMPETENCIA_ID', 'NIVEL', 'ESTADO', 'FECHA_CREACION', 'CREADO_POR', 'FECHA_MODIFICACION', 'MODIFICADO_POR', 'ACTIVO', 'OBSERVACIONES']
    },
    {
      clave: 'RECURSO_COMPETENCIA',
      cabeceras: ['ID', 'RECURSO_ID', 'COMPETENCIA_ID', 'ESTADO', 'FECHA_CREACION', 'CREADO_POR', 'FECHA_MODIFICACION', 'MODIFICADO_POR', 'ACTIVO', 'OBSERVACIONES']
    }
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');
    if (!hojaConfig) {
      throw new Error('INSTALAR_ENTIDADES_COMPETENCIA_ERROR: no existe la hoja 90_CONFIGURACION');
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'ESTADO_COMPETENCIA', estadosCompetencia);
    // NIVEL_COMPETENCIA: opcional en PERSONA_COMPETENCIA -- se deja como
    // catálogo abierto simple (Básico/Intermedio/Avanzado), no bloqueante.
    crearCatalogoNuevoL3_(ss, hojaConfig, 'NIVEL_COMPETENCIA', [
      ['BASICO', 'Básico'],
      ['INTERMEDIO', 'Intermedio'],
      ['AVANZADO', 'Avanzado']
    ]);

    definiciones.forEach(function (definicion) {
      var nombreHoja = ENTIDADES_MVP[definicion.clave].hoja;
      var hoja = ss.getSheetByName(nombreHoja);

      if (!hoja) {
        hoja = ss.insertSheet(nombreHoja);
        hoja.getRange(1, 1, 1, definicion.cabeceras.length).setValues([definicion.cabeceras]);
        hoja.setFrozenRows(1);
        console.log('OK hoja_creada=' + nombreHoja + ' columnas=' + definicion.cabeceras.length);
      } else {
        var ultimaColumna = hoja.getLastColumn();
        var cabecerasActuales = ultimaColumna > 0
          ? hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function (v) { return String(v || '').trim(); })
          : [];
        var faltantes = definicion.cabeceras.filter(function (c) { return cabecerasActuales.indexOf(c) === -1; });
        if (faltantes.length > 0) {
          throw new Error(
            'INSTALAR_ENTIDADES_COMPETENCIA_ERROR: la hoja ' + nombreHoja + ' ya existe pero le faltan columnas: ' + faltantes.join(', ')
          );
        }
        console.log('OK hoja_ya_existente_y_valida=' + nombreHoja);
      }
    });
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
