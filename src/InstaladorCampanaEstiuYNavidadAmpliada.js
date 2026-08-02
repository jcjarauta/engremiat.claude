/**
 * Cierra el año completo de campañas de prueba piloto (ver conversacion):
 * Carnestoltes (ene-feb) -> Sant Jordi (mar-abr) -> Tallers d'Estiu
 * (abr-jul, NUEVA, llena el hueco real) -> Mercats de Tardor (jul-nov)
 * -> Navidad (oct-dic, AMPLIADA aquí con un tercer producto e incidencias).
 *
 * Misma politica que el resto de instaladores de este mes: estructura
 * real, personas/roles anonimizados, reutiliza guardarFormulario (pasa
 * por toda la validacion real).
 *
 * Nota de diseño encontrada al construir esto: HORARIO no tiene rango
 * de vigencia (FECHA_INICIO/FECHA_FIN) -- es un patron semanal fijo,
 * sin forma de expresar "estas horas solo aplican en diciembre" o
 * "horario reducido solo en verano" sin crear filas contradictorias
 * para el mismo día. Por eso la diferencia entre temporada alta/baja
 * se representa aquí con retrasos, incidencias y dedicación real, NO
 * con filas de HORARIO estacionales -- si se quiere modelar horario
 * estacional de verdad, hace falta ampliar el esquema de HORARIO
 * primero (fuera de alcance de este seed).
 *
 * Orden de ejecucion (idempotente cada uno):
 *   1. instalarCampanaTallersEstiu2026()
 *   2. instalarAmpliacionNavidad2026()
 */

function capacidadDisponible_(personaId) {
  var total = listarRegistros('TAREA_RESPONSABLE', { ACTIVO: 'SÍ', ESTADO: 'Activa', PERSONA_EQUIPO_ID: personaId })
    .reduce(function (suma, tr) { return suma + (Number(tr.PORCENTAJE_DEDICACION) || 0); }, 0);
  return Math.max(0, 100 - total);
}

/* Paso 1: nueva campaña "Tallers d'Estiu 2026" -- llena el hueco real (24 abril - 19 julio). */
function instalarCampanaTallersEstiu2026() {
  var packageName = 'INSTALAR_CAMPANA_TALLERS_ESTIU_2026';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  if (listarRegistros('CAMPANA', { ACTIVO: 'SÍ' }).some(function (c) { return c.NOMBRE === "Tallers d'Estiu 2026"; })) {
    console.log('OK ya_instalado=true (campaña ya existe)');
    console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
    return true;
  }

  var correlationId = Utilities.getUuid();
  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id + ' nombre=' + (datos.NOMBRE || ''));
    return resultado.id;
  }

  var idResponsableManipulados = buscarPersonaEquipoPorNombre_('Responsable de Manipulados').ID;
  var idResponsableCarpinteria = buscarPersonaEquipoPorNombre_('Responsable de Carpintería').ID;
  var idCoordinadora = buscarPersonaEquipoPorNombre_('Coordinadora de Taller').ID;
  var idVoluntariado = buscarPersonaEquipoPorNombre_('Voluntariado de Apoyo').ID;
  var idPersonaAtendida = buscarPersonaEquipoPorNombre_('Participante Manipulados 1').ID;

  var idCampana = crear_('CAMPANA', {
    NOMBRE: "Tallers d'Estiu 2026", DESCRIPCION: 'Temporada de baja intensidad comercial: taller comunitario de macetas y mantenimiento de espacios.',
    FECHA_INICIO_PLAN: '2026-04-24', FECHA_FIN_PLAN: '2026-07-19', ESTADO: 'Completada',
    OBJETIVO: 'Mantener actividad comunitaria y los espacios en buen estado durante el verano',
    RESULTADO_ESPERADO: 'Taller de macetas realizado y espacios mantenidos antes de la temporada de otoño'
  });

  /* --- Proyecto 1: taller comunitario de macetas (voluntariado + persona atendida). --- */
  var idProyectoMacetas = crear_('PROYECTO', {
    CAMPANA_ID: idCampana, NOMBRE: 'Taller de macetas amb llavors',
    TIPO_PROYECTO: 'Colaboración social', PRIORIDAD: 'Baja', RESPONSABLE_ID: idCoordinadora,
    FECHA_INICIO_PLAN: '2026-04-27', FECHA_FIN_PLAN: '2026-05-15',
    FECHA_INICIO_REAL: '2026-04-27', FECHA_FIN_REAL: '2026-05-29',
    ESTADO: 'Completado',
    OBJETIVO: 'Taller comunitario de plantación de semillas en macetas recicladas',
    RESULTADO_ESPERADO: 'Macetas plantadas y repartidas entre el voluntariado y las familias del programa'
  });
  var idProductoMacetas = crear_('PRODUCTO', {
    NOMBRE: 'Maceta con semillas', ORIGEN: 'Producción propia', UNIDAD: 'Unidad',
    CANTIDAD_PREVISTA: 80, FECHA_REQUERIDA: '2026-05-15', PRIORIDAD: 'Baja',
    CODIGO: 'PRD-ESTIU-MACETA', PROYECTO_VINCULAR_ID: idProyectoMacetas,
    RESPONSABLE_ID: idResponsableManipulados, ESTADO: 'Completado'
  });
  var idMacetasPreprod = crear_('PROCESO', {
    PRODUCTO_ID: idProductoMacetas, NOMBRE: 'Preparación de materiales', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 3, DURACION_REAL_DIAS: 3, RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-04-27', FECHA_FIN_PLAN: '2026-04-29',
    FECHA_INICIO_REAL: '2026-04-27', FECHA_FIN_REAL: '2026-04-29',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Preproducción'
  });
  var idMacetasProd = crear_('PROCESO', {
    PRODUCTO_ID: idProductoMacetas, NOMBRE: 'Talleres de plantación', ORDEN_SECUENCIA: 2,
    PROCESO_PREDECESOR_ID: idMacetasPreprod, DURACION_PREVISTA_DIAS: 10, DURACION_REAL_DIAS: 24,
    RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-04-30', FECHA_FIN_PLAN: '2026-05-13',
    FECHA_INICIO_REAL: '2026-04-30', FECHA_FIN_REAL: '2026-05-27',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Producción',
    OBSERVACIONES: 'Retraso por menor disponibilidad de voluntariado durante las vacaciones de verano (ver INCIDENCIA vinculada).'
  });
  var idMacetasPostprod = crear_('PROCESO', {
    PRODUCTO_ID: idProductoMacetas, NOMBRE: 'Reparto de macetas', ORDEN_SECUENCIA: 3,
    PROCESO_PREDECESOR_ID: idMacetasProd, DURACION_PREVISTA_DIAS: 2, DURACION_REAL_DIAS: 2,
    RESPONSABLE_ID: idCoordinadora,
    FECHA_INICIO_PLAN: '2026-05-14', FECHA_FIN_PLAN: '2026-05-15',
    FECHA_INICIO_REAL: '2026-05-28', FECHA_FIN_REAL: '2026-05-29',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Postproducción'
  });

  crear_('TAREA', {
    PROCESO_ID: idMacetasPreprod, NOMBRE: 'Recogida de macetas recicladas', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 3, DURACION_REAL_DIAS: 3,
    FECHA_INICIO_PLAN: '2026-04-27', FECHA_FIN_PLAN: '2026-04-29',
    FECHA_INICIO_REAL: '2026-04-27', FECHA_FIN_REAL: '2026-04-29', ESTADO: 'Terminada'
  });
  var idTareaSesiones = crear_('TAREA', {
    PROCESO_ID: idMacetasProd, NOMBRE: 'Sesiones semanales de plantación', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 10, DURACION_REAL_DIAS: 24,
    FECHA_INICIO_PLAN: '2026-04-30', FECHA_FIN_PLAN: '2026-05-13',
    FECHA_INICIO_REAL: '2026-04-30', FECHA_FIN_REAL: '2026-05-27', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idMacetasPostprod, NOMBRE: 'Entrega a familias y voluntariado', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 2, DURACION_REAL_DIAS: 2,
    FECHA_INICIO_PLAN: '2026-05-14', FECHA_FIN_PLAN: '2026-05-15',
    FECHA_INICIO_REAL: '2026-05-28', FECHA_FIN_REAL: '2026-05-29', ESTADO: 'Terminada'
  });

  var capVoluntariado = Math.min(50, capacidadDisponible_(idVoluntariado));
  var capPersonaAtendida = Math.min(50, capacidadDisponible_(idPersonaAtendida));
  if (capVoluntariado > 0) {
    crear_('TAREA_RESPONSABLE', {
      TAREA_ID: idTareaSesiones, PERSONA_EQUIPO_ID: idVoluntariado,
      ROL_ASIGNADO: 'Responsable', FECHA_INICIO_ASIGNACION: '2026-04-30', FECHA_FIN_ASIGNACION: '2026-05-27',
      PORCENTAJE_DEDICACION: capVoluntariado, ESTADO: 'Activa'
    });
  }
  if (capPersonaAtendida > 0) {
    crear_('TAREA_RESPONSABLE', {
      TAREA_ID: idTareaSesiones, PERSONA_EQUIPO_ID: idPersonaAtendida,
      ROL_ASIGNADO: 'Colaborador', FECHA_INICIO_ASIGNACION: '2026-04-30', FECHA_FIN_ASIGNACION: '2026-05-27',
      PORCENTAJE_DEDICACION: capPersonaAtendida, ESTADO: 'Activa'
    });
  }

  var idIncidenciaCapacidad = crear_('INCIDENCIA', {
    NIVEL_INCIDENCIA: 'Proyecto', CAMPANA_ID: idCampana, PROYECTO_ID: idProyectoMacetas,
    TITULO: 'Reducción de capacidad por vacaciones de verano',
    DESCRIPCION: 'Menor disponibilidad de voluntariado durante julio, lo que alargó las sesiones semanales de plantación más de lo previsto.',
    TIPO: 'Planificación', PRIORIDAD: 'Baja', RESPONSABLE_ID: idCoordinadora,
    FECHA_DETECCION: '2026-05-10', ESTADO: 'Resuelta',
    ACCION_CORRECTORA: 'Se ampliaron las fechas de las sesiones semanales hasta finales de mayo.',
    FECHA_RESOLUCION: '2026-05-27'
  });

  /* --- Proyecto 2: mantenimiento de espacios (sin venta, solo infraestructura). --- */
  var idProyectoMantenimiento = crear_('PROYECTO', {
    CAMPANA_ID: idCampana, NOMBRE: 'Mantenimiento de espacios de verano',
    TIPO_PROYECTO: 'Mantenimiento / reparación', PRIORIDAD: 'Media', RESPONSABLE_ID: idResponsableCarpinteria,
    FECHA_INICIO_PLAN: '2026-06-15', FECHA_FIN_PLAN: '2026-07-19',
    FECHA_INICIO_REAL: '2026-06-15', FECHA_FIN_REAL: '2026-07-17',
    ESTADO: 'Completado',
    OBJETIVO: 'Limpiar, reordenar y mantener los espacios antes de la temporada de otoño',
    RESULTADO_ESPERADO: 'Espacios limpios, ordenados y con el mantenimiento preventivo al día'
  });
  var idProductoMantenimiento = crear_('PRODUCTO', {
    NOMBRE: 'Mantenimiento y reordenación de espacios', ORIGEN: 'Producción propia', UNIDAD: 'Hora',
    CANTIDAD_PREVISTA: 40, FECHA_REQUERIDA: '2026-07-19', PRIORIDAD: 'Media',
    CODIGO: 'PRD-ESTIU-MANTEN', PROYECTO_VINCULAR_ID: idProyectoMantenimiento,
    RESPONSABLE_ID: idResponsableCarpinteria, ESTADO: 'Completado'
  });
  var idMantenimientoProceso = crear_('PROCESO', {
    PRODUCTO_ID: idProductoMantenimiento, NOMBRE: 'Mantenimiento de espacios', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 25, DURACION_REAL_DIAS: 23, RESPONSABLE_ID: idResponsableCarpinteria,
    FECHA_INICIO_PLAN: '2026-06-15', FECHA_FIN_PLAN: '2026-07-19',
    FECHA_INICIO_REAL: '2026-06-15', FECHA_FIN_REAL: '2026-07-17',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Producción'
  });
  var idTareaLimpiezaCarpinteria = crear_('TAREA', {
    PROCESO_ID: idMantenimientoProceso, NOMBRE: 'Limpieza y reorden de Carpintería', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 3, DURACION_REAL_DIAS: 3,
    FECHA_INICIO_PLAN: '2026-06-15', FECHA_FIN_PLAN: '2026-06-17',
    FECHA_INICIO_REAL: '2026-06-15', FECHA_FIN_REAL: '2026-06-17', ESTADO: 'Terminada'
  });
  var idTareaReordenAlmacen = crear_('TAREA', {
    PROCESO_ID: idMantenimientoProceso, NOMBRE: 'Reorden del Almacén de Materiales', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 4, DURACION_REAL_DIAS: 4,
    FECHA_INICIO_PLAN: '2026-06-22', FECHA_FIN_PLAN: '2026-06-25',
    FECHA_INICIO_REAL: '2026-06-22', FECHA_FIN_REAL: '2026-06-25', ESTADO: 'Terminada'
  });
  var idTareaMantenimientoHorno = crear_('TAREA', {
    PROCESO_ID: idMantenimientoProceso, NOMBRE: 'Mantenimiento preventivo del horno de Cerámica', ORDEN_SECUENCIA: 3,
    DURACION_PREVISTA_DIAS: 2, DURACION_REAL_DIAS: 2,
    FECHA_INICIO_PLAN: '2026-07-13', FECHA_FIN_PLAN: '2026-07-14',
    FECHA_INICIO_REAL: '2026-07-13', FECHA_FIN_REAL: '2026-07-14', ESTADO: 'Terminada'
  });

  var RECURSO_CARPINTERIA = 'REC-0005';
  var RECURSO_ALMACEN = 'REC-0006';
  var RECURSO_CERAMICA = 'REC-0009';
  crear_('TAREA_RECURSO', { TAREA_ID: idTareaLimpiezaCarpinteria, RECURSO_ID: RECURSO_CARPINTERIA, TIPO_USO: 'Utiliza', FECHA_INICIO: '2026-06-15', FECHA_FIN: '2026-06-17', ESTADO: 'Activa' });
  crear_('TAREA_RECURSO', { TAREA_ID: idTareaReordenAlmacen, RECURSO_ID: RECURSO_ALMACEN, TIPO_USO: 'Utiliza', FECHA_INICIO: '2026-06-22', FECHA_FIN: '2026-06-25', ESTADO: 'Activa' });
  crear_('TAREA_RECURSO', { TAREA_ID: idTareaMantenimientoHorno, RECURSO_ID: RECURSO_CERAMICA, TIPO_USO: 'Utiliza', FECHA_INICIO: '2026-07-13', FECHA_FIN: '2026-07-14', ESTADO: 'Activa' });

  /*
   * Este mantenimiento del horno resuelve, con fecha real, la incidencia
   * de "Mantenimiento del horno de cerámica" sembrada en Mercats de
   * Tardor -- si esa incidencia ya se instaló, se marca resuelta aquí
   * para no dejar dos historias contradictorias sobre el mismo horno.
   */
  var incidenciaHorno = listarRegistros('INCIDENCIA', { ACTIVO: 'SÍ', TITULO: 'Mantenimiento del horno de cerámica' })[0];
  if (incidenciaHorno && incidenciaHorno.ESTADO === 'Abierta') {
    console.log('AVISO: la incidencia "Mantenimiento del horno de cerámica" (Mercats de Tardor) sigue abierta -- revisar manualmente si se quiere marcar resuelta con esta tarea de julio.');
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/*
 * Paso 2: amplía la campaña Navidad 2026 ya existente con un tercer
 * producto, incidencia y documentos.
 *
 * Idempotente PASO A PASO (no con un único guard al principio): un
 * primer intento reventó a mitad -- PRODUCTO/PROCESO/TAREA ya se habían
 * creado cuando la asignación de "Corte y estampado" (Postal de
 * Navidad) falló porque esa persona YA estaba asignada a esa tarea
 * desde un lote de siembra anterior (misma combinación TAREA_ID+
 * PERSONA_EQUIPO_ID, no permitida). Un guard único al principio (tipo
 * "si ya existe el producto, salir") habría dejado la incidencia y los
 * documentos sin crear en el reintento -- por eso cada bloque busca
 * antes de crear.
 */
function instalarAmpliacionNavidad2026() {
  var packageName = 'INSTALAR_AMPLIACION_NAVIDAD_2026';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var campanaNavidad = listarRegistros('CAMPANA', { ACTIVO: 'SÍ', NOMBRE: 'Navidad 2026' })[0];
  if (!campanaNavidad) {
    throw new Error('No existe la campaña "Navidad 2026". Ejecuta primero instalarDatosPruebaPiloto().');
  }
  var proyectoNavidad = listarRegistros('PROYECTO', { ACTIVO: 'SÍ', CAMPANA_ID: campanaNavidad.ID })[0];
  if (!proyectoNavidad) {
    throw new Error('No existe ningún proyecto en la campaña "Navidad 2026".');
  }

  var correlationId = Utilities.getUuid();
  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id + ' nombre=' + (datos.NOMBRE || ''));
    return resultado.id;
  }
  function buscarOCrear_(entidad, filtro, datos) {
    var filtroCompleto = Object.assign({ ACTIVO: 'SÍ' }, filtro);
    var existente = listarRegistros(entidad, filtroCompleto)[0];
    if (existente) {
      console.log('OK ya_existe=true entidad=' + entidad + ' id=' + existente.ID);
      return existente.ID;
    }
    return crear_(entidad, datos);
  }
  function crearTareaResponsableSiFalta_(datos) {
    var yaExiste = listarRegistros('TAREA_RESPONSABLE', { ACTIVO: 'SÍ' }).some(function (tr) {
      return tr.TAREA_ID === datos.TAREA_ID && tr.PERSONA_EQUIPO_ID === datos.PERSONA_EQUIPO_ID;
    });
    if (yaExiste) {
      console.log('OK ya_existe=true tarea=' + datos.TAREA_ID + ' persona=' + datos.PERSONA_EQUIPO_ID);
      return;
    }
    crear_('TAREA_RESPONSABLE', datos);
  }

  var idResponsableManipulados = buscarPersonaEquipoPorNombre_('Responsable de Manipulados').ID;
  var idDisenadora = buscarPersonaEquipoPorNombre_('Diseñador/a de Producto').ID;
  var idCoordinadora = buscarPersonaEquipoPorNombre_('Coordinadora de Taller').ID;

  /* --- Tercer producto: Estrella de cartón navideña (grounded en el documento real, producto recurrente de temporada). --- */
  var idProductoEstrella = buscarOCrear_('PRODUCTO', { CODIGO: 'PRD-NAD-ESTRELLA' }, {
    NOMBRE: 'Estrella de cartón navideña', ORIGEN: 'Producción propia', UNIDAD: 'Unidad',
    CANTIDAD_PREVISTA: 300, FECHA_REQUERIDA: '2026-12-05', PRIORIDAD: 'Alta',
    CODIGO: 'PRD-NAD-ESTRELLA', PROYECTO_VINCULAR_ID: proyectoNavidad.ID,
    RESPONSABLE_ID: idResponsableManipulados, ESTADO: 'Planificado'
  });
  var idEstrellaPreprod = buscarOCrear_('PROCESO', { NOMBRE: 'Preproducción estrella de cartón', PRODUCTO_ID: idProductoEstrella }, {
    PRODUCTO_ID: idProductoEstrella, NOMBRE: 'Preproducción estrella de cartón', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 4, RESPONSABLE_ID: idDisenadora,
    FECHA_INICIO_PLAN: '2026-11-13', FECHA_FIN_PLAN: '2026-11-18',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Preproducción'
  });
  var idEstrellaProd = buscarOCrear_('PROCESO', { NOMBRE: 'Producción estrella de cartón', PRODUCTO_ID: idProductoEstrella }, {
    PRODUCTO_ID: idProductoEstrella, NOMBRE: 'Producción estrella de cartón', ORDEN_SECUENCIA: 2,
    PROCESO_PREDECESOR_ID: idEstrellaPreprod, DURACION_PREVISTA_DIAS: 12, RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-11-19', FECHA_FIN_PLAN: '2026-12-02',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Producción'
  });
  var idEstrellaPostprod = buscarOCrear_('PROCESO', { NOMBRE: 'Postproducción estrella de cartón', PRODUCTO_ID: idProductoEstrella }, {
    PRODUCTO_ID: idProductoEstrella, NOMBRE: 'Postproducción estrella de cartón', ORDEN_SECUENCIA: 3,
    PROCESO_PREDECESOR_ID: idEstrellaProd, DURACION_PREVISTA_DIAS: 3, RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-12-03', FECHA_FIN_PLAN: '2026-12-05',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Postproducción'
  });

  buscarOCrear_('TAREA', { NOMBRE: 'Diseño de plantilla y troquel', PROCESO_ID: idEstrellaPreprod }, {
    PROCESO_ID: idEstrellaPreprod, NOMBRE: 'Diseño de plantilla y troquel', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 4, FECHA_INICIO_PLAN: '2026-11-13', FECHA_FIN_PLAN: '2026-11-18', ESTADO: 'Pendiente'
  });
  var idTareaCorteEstrella = buscarOCrear_('TAREA', { NOMBRE: 'Corte y montaje', PROCESO_ID: idEstrellaProd }, {
    PROCESO_ID: idEstrellaProd, NOMBRE: 'Corte y montaje', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 12, FECHA_INICIO_PLAN: '2026-11-19', FECHA_FIN_PLAN: '2026-12-02', ESTADO: 'Pendiente'
  });
  buscarOCrear_('TAREA', { NOMBRE: 'Control de calidad y embalaje', PROCESO_ID: idEstrellaPostprod }, {
    PROCESO_ID: idEstrellaPostprod, NOMBRE: 'Control de calidad y embalaje', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 3, FECHA_INICIO_PLAN: '2026-12-03', FECHA_FIN_PLAN: '2026-12-05', ESTADO: 'Pendiente'
  });

  /*
   * Solapamiento de temporada alta: el Responsable de Manipulados
   * queda repartido entre la Postal de Navidad y la nueva Estrella de
   * cartón. La asignación a la Postal YA EXISTÍA desde un lote de
   * siembra anterior (de ahí el error real del primer intento) --
   * crearTareaResponsableSiFalta_ la respeta tal cual en vez de
   * duplicarla o reventar, y solo añade la de la Estrella.
   */
  var procesoPostal = listarRegistros('PROCESO', { ACTIVO: 'SÍ', NOMBRE: 'Producción postal navidad' })[0];
  var tareaCortePostal = procesoPostal
    ? listarRegistros('TAREA', { ACTIVO: 'SÍ', NOMBRE: 'Corte y estampado', PROCESO_ID: procesoPostal.ID })[0]
    : null;

  if (tareaCortePostal) {
    crearTareaResponsableSiFalta_({
      TAREA_ID: tareaCortePostal.ID, PERSONA_EQUIPO_ID: idResponsableManipulados,
      ROL_ASIGNADO: 'Responsable', FECHA_INICIO_ASIGNACION: '2026-10-29', FECHA_FIN_ASIGNACION: '2026-11-10',
      PORCENTAJE_DEDICACION: Math.min(50, capacidadDisponible_(idResponsableManipulados)) || 1, ESTADO: 'Activa'
    });
  }
  var capManipuladosEstrella = Math.min(50, capacidadDisponible_(idResponsableManipulados));
  if (capManipuladosEstrella > 0) {
    crearTareaResponsableSiFalta_({
      TAREA_ID: idTareaCorteEstrella, PERSONA_EQUIPO_ID: idResponsableManipulados,
      ROL_ASIGNADO: 'Responsable', FECHA_INICIO_ASIGNACION: '2026-11-19', FECHA_FIN_ASIGNACION: '2026-12-02',
      PORCENTAJE_DEDICACION: capManipuladosEstrella, ESTADO: 'Activa'
    });
  } else {
    console.log('AVISO: sin dedicación disponible para asignar a Responsable de Manipulados en la Estrella de cartón (ya está al 100% en otras tareas activas).');
  }

  /* --- Incidencia real de pico de temporada (riesgo, aún no ocurrido a la fecha de siembra). --- */
  buscarOCrear_('INCIDENCIA', { TITULO: 'Riesgo de sobrecarga en Manipulados por pico de diciembre' }, {
    NIVEL_INCIDENCIA: 'Proyecto', CAMPANA_ID: campanaNavidad.ID, PROYECTO_ID: proyectoNavidad.ID,
    TITULO: 'Riesgo de sobrecarga en Manipulados por pico de diciembre',
    DESCRIPCION: 'La producción de la Postal de Navidad y de la Estrella de cartón coinciden en el mismo responsable en noviembre-diciembre; riesgo de retraso si se suma algún imprevisto.',
    TIPO: 'Planificación', PRIORIDAD: 'Media', RESPONSABLE_ID: idCoordinadora,
    FECHA_DETECCION: '2026-08-01', FECHA_LIMITE: '2026-11-15', ESTADO: 'Abierta', IMPACTO: 'Medio'
  });

  /* --- Documentos: ficha técnica del nuevo producto + protocolo de embalaje navideño. --- */
  buscarOCrear_('DOCUMENTO', { TITULO: 'Ficha técnica: Estrella de cartón navideña' }, {
    ENTIDAD_TIPO: 'Producto', ENTIDAD_ID: idProductoEstrella,
    TIPO_DOCUMENTO: 'Ficha técnica', TITULO: 'Ficha técnica: Estrella de cartón navideña',
    DESCRIPCION: 'Plantilla, troquel y proceso de montaje de la estrella de cartón.',
    VERSION: '1.0', URL: 'https://intranet.latroballa.local/fichas/estrella-carton-navidad-2026',
    ESTADO: 'Vigente', FECHA_DOCUMENTO: '2026-08-01'
  });
  buscarOCrear_('DOCUMENTO', { TITULO: 'Protocolo de embalaje navideño' }, {
    ENTIDAD_TIPO: 'Proyecto', ENTIDAD_ID: proyectoNavidad.ID,
    TIPO_DOCUMENTO: 'Protocolo', TITULO: 'Protocolo de embalaje navideño',
    DESCRIPCION: 'Procedimiento común de embalaje para calendario, postal y estrella de cartón.',
    VERSION: '1.0', URL: 'https://intranet.latroballa.local/protocolos/embalaje-navidad',
    ESTADO: 'Vigente', FECHA_DOCUMENTO: '2026-08-01'
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}
