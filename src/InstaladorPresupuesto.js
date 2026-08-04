/**
 * Instalador de las entidades PRESUPUESTO y FUENTE_FINANCIACION (N -
 * "eje económico", Fase 1: dato base, sin cálculo todavía -- ver
 * conversación). Crea las hojas 30_PRESUPUESTO/31_FUENTE_FINANCIACION
 * con su cabecera y los catálogos que necesitan. Idempotente. Debe
 * ejecutarse una única vez, manualmente.
 *
 * ENTIDAD_TIPO usa un catálogo propio y acotado (CFG_ENTIDAD_PRESUPUESTO
 * = Campaña/Proyecto/Producto, los 3 niveles decididos), no el genérico
 * CFG_ENTIDAD_DOCUMENTO (10 valores, arrastraría opciones sin sentido
 * como "Tarea" o "Recurso" para un presupuesto) -- mismo criterio que
 * CFG_ENTIDAD_HORARIO en su día. El resolver de ENTIDAD_ID sí reutiliza
 * el mapa genérico DOCUMENTO_ENTIDAD_ID (Formularios.js): su función ya
 * resuelve cualquier etiqueta válida de ENTIDAD_DOCUMENTO_A_MVP, y
 * Campaña/Proyecto/Producto son un subconjunto de esas 10 -- no hace
 * falta un mapa de dependencia nuevo.
 */
function instalarEntidadesPresupuesto() {
  var packageName = 'INSTALAR_ENTIDADES_PRESUPUESTO';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var cabecerasPresupuesto = [
    'ID',
    'ENTIDAD_TIPO',
    'ENTIDAD_ID',
    'CATEGORIA',
    'IMPORTE_PREVISTO',
    'FECHA_CREACION',
    'CREADO_POR',
    'FECHA_MODIFICACION',
    'MODIFICADO_POR',
    'ACTIVO',
    'OBSERVACIONES'
  ];

  var cabecerasFuenteFinanciacion = [
    'ID',
    'ENTIDAD_TIPO',
    'ENTIDAD_ID',
    'NOMBRE',
    'TIPO',
    'IMPORTE',
    'ESTADO',
    'FECHA_SOLICITUD',
    'FECHA_RESOLUCION',
    'FECHA_CREACION',
    'CREADO_POR',
    'FECHA_MODIFICACION',
    'MODIFICADO_POR',
    'ACTIVO',
    'OBSERVACIONES'
  ];

  var entidadesPresupuesto = [
    ['CAMPANA', 'Campaña'],
    ['PROYECTO', 'Proyecto'],
    ['PRODUCTO', 'Producto']
  ];

  var categoriasPresupuesto = [
    ['MATERIALES', 'Materiales'],
    ['RECURSOS', 'Recursos'],
    ['ACTIVIDAD', 'Actividad'],
    ['OTROS', 'Otros']
  ];

  var tiposFuenteFinanciacion = [
    ['SUBVENCION', 'Subvención'],
    ['DEPARTAMENTO', 'Departamento'],
    ['CLIENTE', 'Cliente'],
    ['DONACION', 'Donación'],
    ['OTRO', 'Otro']
  ];

  var estadosFuenteFinanciacion = [
    ['SOLICITADA', 'Solicitada'],
    ['CONCEDIDA', 'Concedida'],
    ['PENDIENTE_COBRO', 'Pendiente de cobro'],
    ['COBRADA', 'Cobrada'],
    ['RECHAZADA', 'Rechazada']
  ];

  function crearHojaSiFalta_(ss, nombreHoja, cabeceras) {
    var hoja = ss.getSheetByName(nombreHoja);

    if (!hoja) {
      hoja = ss.insertSheet(nombreHoja);
      hoja.getRange(1, 1, 1, cabeceras.length).setValues([cabeceras]);
      hoja.setFrozenRows(1);
      console.log('OK hoja_creada=' + nombreHoja + ' columnas=' + cabeceras.length);
      return;
    }

    var ultimaColumna = hoja.getLastColumn();
    var cabecerasActuales = ultimaColumna > 0
      ? hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function (v) { return String(v || '').trim(); })
      : [];

    var faltantes = cabeceras.filter(function (c) { return cabecerasActuales.indexOf(c) === -1; });

    if (faltantes.length > 0) {
      throw new Error(
        'INSTALAR_ENTIDADES_PRESUPUESTO_ERROR: la hoja ' + nombreHoja + ' ya existe pero le faltan columnas: ' + faltantes.join(', ')
      );
    }

    console.log('OK hoja_ya_existente_y_valida=' + nombreHoja);
  }

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    crearHojaSiFalta_(ss, ENTIDADES_MVP.PRESUPUESTO.hoja, cabecerasPresupuesto);
    crearHojaSiFalta_(ss, ENTIDADES_MVP.FUENTE_FINANCIACION.hoja, cabecerasFuenteFinanciacion);

    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');
    if (!hojaConfig) {
      throw new Error('INSTALAR_ENTIDADES_PRESUPUESTO_ERROR: no existe la hoja 90_CONFIGURACION');
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'ENTIDAD_PRESUPUESTO', entidadesPresupuesto);
    crearCatalogoNuevoL3_(ss, hojaConfig, 'CATEGORIA_PRESUPUESTO', categoriasPresupuesto);
    crearCatalogoNuevoL3_(ss, hojaConfig, 'TIPO_FUENTE_FINANCIACION', tiposFuenteFinanciacion);
    crearCatalogoNuevoL3_(ss, hojaConfig, 'ESTADO_FUENTE_FINANCIACION', estadosFuenteFinanciacion);
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
