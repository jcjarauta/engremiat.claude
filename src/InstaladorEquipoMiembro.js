/**
 * Expansion minima de personas/equipos (F-046, F-049), previa a la
 * futura Fase L5.3 (importacion masiva de jerarquia). Alcance confirmado
 * explicitamente por el usuario tras valorar una propuesta mas amplia de
 * GRUPO/RED: la persona sigue siendo la unidad atomica y las pertenencias
 * se modelan como relaciones (mismo principio que ASIGNACION/VINCULO, ya
 * construidos), sin anadir niveles jerarquicos (GRUPO/RED) sin una
 * friccion real que los demande -- si algun dia hace falta, VINCULO ya
 * los soporta sin tablas nuevas.
 *
 * Contenido:
 * 1. Catalogo nuevo CFG_ROL_PERSONA (PERSONA_EQUIPO.ROL pasa de texto
 *    libre a catalogo).
 * 2. Amplia CFG_ROL_ASIGNACION con matices tipo RACI (rescatados de la
 *    propuesta externa: EJECUTOR, CONSULTADO, INFORMADO, COORDINADOR,
 *    VALIDADOR), ademas de los 4 valores ya existentes.
 * 3. Anade EMAIL, TELEFONO, COORDINADOR_ID a PERSONA_EQUIPO (F-046 en
 *    parte: identidad de contacto; coordinador para cuando TIPO=Equipo).
 * 4. Crea la hoja 22_EQUIPO_MIEMBRO (F-049: desglose de equipo sin tocar
 *    ASIGNACION/TAREA_RESPONSABLE, que siguen asignando el equipo como
 *    bloque).
 *
 * Idempotente. Debe ejecutarse una unica vez, manualmente.
 */
function instalarExpansionPersonaEquipo() {
  var packageName = 'INSTALAR_EXPANSION_PERSONA_EQUIPO';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var rolesPersona = [
    ['COORDINACION', 'Coordinación'],
    ['PRODUCCION', 'Producción'],
    ['DISENO', 'Diseño'],
    ['LOGISTICA', 'Logística'],
    ['ADMINISTRACION', 'Administración'],
    ['VOLUNTARIADO', 'Voluntariado'],
    ['OTRA', 'Otra']
  ];

  var rolesAsignacionNuevos = [
    ['EJECUTOR', 'Ejecutor'],
    ['CONSULTADO', 'Consultado'],
    ['INFORMADO', 'Informado'],
    ['COORDINADOR', 'Coordinador'],
    ['VALIDADOR', 'Validador']
  ];

  var cabecerasEquipoMiembro = [
    'ID',
    'EQUIPO_ID',
    'MIEMBRO_ID',
    'ROL_EN_EQUIPO',
    'FECHA_ALTA',
    'FECHA_BAJA',
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
      throw new Error(
        'INSTALAR_EXPANSION_PERSONA_EQUIPO_ERROR: no existe la hoja 90_CONFIGURACION'
      );
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'ROL_PERSONA', rolesPersona);

    // CFG_ROL_ASIGNACION no tiene "Otra" de cierre -> se anade al final
    // del bloque, igual que TIPO_VINCULO en InstaladorTipoVinculoIncidencia.js.
    ampliarCatalogoL2_(ss, hojaConfig, 'ROL_ASIGNACION', null, rolesAsignacionNuevos);

    agregarColumnasSiFaltan_(ss, 'PERSONA_EQUIPO', ['EMAIL', 'TELEFONO', 'COORDINADOR_ID']);

    var nombreHojaEquipoMiembro = ENTIDADES_MVP.EQUIPO_MIEMBRO.hoja;
    var hojaEquipoMiembro = ss.getSheetByName(nombreHojaEquipoMiembro);

    if (!hojaEquipoMiembro) {
      hojaEquipoMiembro = ss.insertSheet(nombreHojaEquipoMiembro);
      hojaEquipoMiembro.getRange(1, 1, 1, cabecerasEquipoMiembro.length).setValues([cabecerasEquipoMiembro]);
      hojaEquipoMiembro.setFrozenRows(1);

      console.log('OK hoja_creada=' + nombreHojaEquipoMiembro + ' columnas=' + cabecerasEquipoMiembro.length);
    } else {
      var ultimaColumna = hojaEquipoMiembro.getLastColumn();

      var cabecerasActuales = ultimaColumna > 0
        ? hojaEquipoMiembro.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function (v) {
            return String(v || '').trim();
          })
        : [];

      var faltantes = cabecerasEquipoMiembro.filter(function (c) {
        return cabecerasActuales.indexOf(c) === -1;
      });

      if (faltantes.length > 0) {
        throw new Error(
          'INSTALAR_EXPANSION_PERSONA_EQUIPO_ERROR: la hoja ' +
            nombreHojaEquipoMiembro +
            ' ya existe pero le faltan columnas: ' +
            faltantes.join(', ')
        );
      }

      console.log('OK hoja_ya_existente_y_valida=' + nombreHojaEquipoMiembro);
    }
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
