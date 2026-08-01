/**
 * Fase L5.1 -- Abstraccion RECURSO, alcance minimo confirmado tras
 * evaluar PROPUESTA_RECURSO_MATERIAL.md contra inventario real
 * (herramientas manuales/electricas, maquinaria fija, equipos
 * auxiliares, espacios). No sustituye MATERIAL (consumibles) ni
 * PERSONA_EQUIPO (personas/equipos de personas); cubre unicamente los
 * tipos sin cabida en ninguna de las dos: herramienta, maquinaria,
 * equipo auxiliar, espacio.
 *
 * Catalogos nuevos con nombres deliberadamente distintos de los ya
 * existentes CFG_TIPO_RECURSO/CFG_ESTADO_RECURSO (que pertenecen a
 * PERSONA_EQUIPO y significan otra cosa -- Persona/Equipo de personas,
 * disponibilidad humana):
 *   CFG_CLASE_RECURSO         -- Herramienta/Maquinaria/Equipo auxiliar/Espacio
 *   CFG_CATEGORIA_RECURSO     -- subclasificacion abierta (Herramienta manual,
 *                                Maquinaria fija, Espacio productivo, etc.)
 *   CFG_ESTADO_RECURSO_FISICO -- Disponible/En uso/En mantenimiento/Averiado/De baja
 *   CFG_TIPO_USO_RECURSO      -- Utiliza/Reserva/Ocupa/Requiere (para TAREA_RECURSO)
 *
 * "Equipo" como clase de RECURSO se llama EQUIPO_AUXILIAR para no
 * confundirse con un equipo de personas (PERSONA_EQUIPO.TIPO=Equipo).
 *
 * UBICACION_ID de un RECURSO reutiliza la propia tabla RECURSO (un
 * RECURSO con CLASE_RECURSO=Espacio) en vez de crear una tabla de
 * ubicaciones aparte.
 *
 * Crea las hojas 23_RECURSO y 24_TAREA_RECURSO. Idempotente. Debe
 * ejecutarse una unica vez, manualmente.
 */
function instalarEntidadRecurso() {
  var packageName = 'INSTALAR_ENTIDAD_RECURSO';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var clasesRecurso = [
    ['HERRAMIENTA', 'Herramienta'],
    ['MAQUINARIA', 'Maquinaria'],
    ['EQUIPO_AUXILIAR', 'Equipo auxiliar'],
    ['ESPACIO', 'Espacio']
  ];

  var categoriasRecurso = [
    ['HERRAMIENTA_MANUAL', 'Herramienta manual'],
    ['HERRAMIENTA_ELECTRICA', 'Herramienta eléctrica'],
    ['UTIL_PLANTILLA', 'Útil o plantilla'],
    ['MAQUINARIA_FIJA', 'Maquinaria fija'],
    ['EQUIPO_INFORMATICO', 'Equipo informático'],
    ['EQUIPO_PROTECCION', 'Equipo de protección'],
    ['ESPACIO_PRODUCTIVO', 'Espacio productivo'],
    ['ESPACIO_ALMACENAMIENTO', 'Espacio de almacenamiento'],
    ['ESPACIO_FORMATIVO', 'Espacio formativo'],
    ['ESPACIO_POLIVALENTE', 'Espacio polivalente'],
    ['OTRO', 'Otro']
  ];

  var estadosRecursoFisico = [
    ['DISPONIBLE', 'Disponible'],
    ['EN_USO', 'En uso'],
    ['EN_MANTENIMIENTO', 'En mantenimiento'],
    ['AVERIADO', 'Averiado'],
    ['DE_BAJA', 'De baja']
  ];

  var tiposUsoRecurso = [
    ['UTILIZA', 'Utiliza'],
    ['RESERVA', 'Reserva'],
    ['OCUPA', 'Ocupa'],
    ['REQUIERE', 'Requiere']
  ];

  var cabecerasRecurso = [
    'ID',
    'CODIGO',
    'NOMBRE',
    'DESCRIPCION',
    'CLASE_RECURSO',
    'CATEGORIA_RECURSO',
    'UBICACION_ID',
    'RESPONSABLE_ID',
    'ESTADO',
    'FECHA_CREACION',
    'CREADO_POR',
    'FECHA_MODIFICACION',
    'MODIFICADO_POR',
    'ACTIVO',
    'OBSERVACIONES'
  ];

  var cabecerasTareaRecurso = [
    'ID',
    'TAREA_ID',
    'RECURSO_ID',
    'TIPO_USO',
    'FECHA_INICIO',
    'FECHA_FIN',
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
        'INSTALAR_ENTIDAD_RECURSO_ERROR: no existe la hoja 90_CONFIGURACION'
      );
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'CLASE_RECURSO', clasesRecurso);
    crearCatalogoNuevoL3_(ss, hojaConfig, 'CATEGORIA_RECURSO', categoriasRecurso);
    crearCatalogoNuevoL3_(ss, hojaConfig, 'ESTADO_RECURSO_FISICO', estadosRecursoFisico);
    crearCatalogoNuevoL3_(ss, hojaConfig, 'TIPO_USO_RECURSO', tiposUsoRecurso);

    // Permite vincular RECURSO con DOCUMENTO (manual de uso, ficha
    // tecnica...) via "Vinculo generico" (VINCULO, L3.1), que ya soporta
    // TIPO_VINCULO=Manual -- solo faltaba que RECURSO fuera un tipo de
    // entidad valido en CFG_ENTIDAD_DOCUMENTO.
    ampliarCatalogoL2_(ss, hojaConfig, 'ENTIDAD_DOCUMENTO', null, [
      ['RECURSO', 'Recurso']
    ]);

    [
      {clave: 'RECURSO', cabeceras: cabecerasRecurso},
      {clave: 'TAREA_RECURSO', cabeceras: cabecerasTareaRecurso}
    ].forEach(function (definicion) {
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
          ? hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function (v) {
              return String(v || '').trim();
            })
          : [];

        var faltantes = definicion.cabeceras.filter(function (c) {
          return cabecerasActuales.indexOf(c) === -1;
        });

        if (faltantes.length > 0) {
          throw new Error(
            'INSTALAR_ENTIDAD_RECURSO_ERROR: la hoja ' +
              nombreHoja +
              ' ya existe pero le faltan columnas: ' +
              faltantes.join(', ')
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
