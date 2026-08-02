/**
 * Campaña de prueba piloto "Mercats de Tardor 2026" (ver conversacion):
 * pensada para forzar el uso conjunto de todo lo construido este mes --
 * jerarquia fisica real (Ceramica/Carpinteria/Manipulados/Tienda),
 * HORARIO, ficha de Persona/Equipo (proyectos involucrados + tareas por
 * fecha), Gantt/desviacion, aviso de solapamiento, e Incidencia/
 * Documento enganchados a Persona y a Recurso.
 *
 * Estructura y categorias (Preproduccion/Produccion/Postproduccion,
 * mantenimiento de espacios, manuales/protocolos) inspiradas en el
 * documento real "TAREAS DIARIAS TROBALLA" que revisamos antes --
 * anonimizado: sin nombres reales de personas, solo estructura.
 *
 * Fechas ancladas alrededor de "hoy" (2026-08-02) para poblar los 4
 * cubos de la ficha (Hoy/Proximas/Terminadas/Otras) con datos reales.
 *
 * Orden de ejecucion (idempotente cada uno, pero deben correr en este
 * orden la primera vez):
 *   1. instalarPersonasMercatsTardor()
 *   2. instalarCampanaMercatsTardor()
 *   3. instalarAsignacionesMercatsTardor()
 *   4. instalarHorariosMercatsTardor()
 *   5. instalarIncidenciasDocumentosMercatsTardor()
 */

function buscarPersonaEquipoPorNombre_(nombre) {
  var encontrada = listarRegistros('PERSONA_EQUIPO', { ACTIVO: 'SÍ' }).filter(function (p) {
    return p.NOMBRE === nombre;
  })[0];
  if (!encontrada) {
    throw new Error('No se encontró "' + nombre + '" en Persona/Equipo. ¿Ejecutaste instalarPersonasMercatsTardor() primero?');
  }
  return encontrada;
}

function buscarProductoPorCodigo_(codigo) {
  var encontrado = listarRegistros('PRODUCTO', { ACTIVO: 'SÍ' }).filter(function (p) {
    return p.CODIGO === codigo;
  })[0];
  if (!encontrado) {
    throw new Error('No se encontró el producto con código "' + codigo + '". ¿Ejecutaste instalarCampanaMercatsTardor() primero?');
  }
  return encontrado;
}

function buscarTareaPorNombreYProducto_(nombreTarea, codigoProducto) {
  var producto = buscarProductoPorCodigo_(codigoProducto);
  var procesos = listarRegistros('PROCESO', { ACTIVO: 'SÍ', PRODUCTO_ID: producto.ID });
  var idsProceso = procesos.map(function (p) { return p.ID; });
  var encontrada = listarRegistros('TAREA', { ACTIVO: 'SÍ' }).filter(function (t) {
    return t.NOMBRE === nombreTarea && idsProceso.indexOf(t.PROCESO_ID) !== -1;
  })[0];
  if (!encontrada) {
    throw new Error('No se encontró la tarea "' + nombreTarea + '" del producto "' + codigoProducto + '".');
  }
  return encontrada;
}

/* Paso 1: personas/equipo nuevos que aún no existían (Cerámica y Tienda no tenían responsable). */
function instalarPersonasMercatsTardor() {
  var packageName = 'INSTALAR_PERSONAS_MERCATS_TARDOR';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id + ' nombre=' + (datos.NOMBRE || ''));
    return resultado.id;
  }

  if (listarRegistros('PERSONA_EQUIPO', { ACTIVO: 'SÍ' }).some(function (p) { return p.NOMBRE === 'Responsable de Cerámica'; })) {
    console.log('OK ya_instalado=true (Responsable de Cerámica ya existe)');
    console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
    return true;
  }

  var idResponsableCeramica = crear_('PERSONA_EQUIPO', {
    TIPO: 'Persona', NOMBRE: 'Responsable de Cerámica', ROL: 'Producción',
    CAPACIDAD_SEMANAL_DIAS: 4, DISPONIBILIDAD: 'Parcial', ESTADO: 'Disponible'
  });
  crear_('PERSONA_EQUIPO', {
    TIPO: 'Persona', NOMBRE: 'Responsable de Tienda', ROL: 'Producción',
    CAPACIDAD_SEMANAL_DIAS: 4, DISPONIBILIDAD: 'Parcial', ESTADO: 'Disponible'
  });
  var idEquipoCeramica = crear_('PERSONA_EQUIPO', {
    TIPO: 'Equipo', NOMBRE: 'Equipo de Cerámica', ROL: 'Producción',
    COORDINADOR_ID: idResponsableCeramica, CAPACIDAD_SEMANAL_DIAS: 4, DISPONIBILIDAD: 'Parcial', ESTADO: 'Disponible'
  });

  var idVoluntariado = buscarPersonaEquipoPorNombre_('Voluntariado de Apoyo').ID;
  crear_('EQUIPO_MIEMBRO', {
    EQUIPO_ID: idEquipoCeramica, MIEMBRO_ID: idResponsableCeramica,
    ROL_EN_EQUIPO: 'Responsable de Cerámica', FECHA_ALTA: new Date(), ESTADO: 'Activa'
  });
  crear_('EQUIPO_MIEMBRO', {
    EQUIPO_ID: idEquipoCeramica, MIEMBRO_ID: idVoluntariado,
    ROL_EN_EQUIPO: 'Apoyo en Cerámica', FECHA_ALTA: new Date(), ESTADO: 'Activa'
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/* Paso 2: campaña + 3 proyectos (uno por espacio físico) + productos + procesos + tareas. */
function instalarCampanaMercatsTardor() {
  var packageName = 'INSTALAR_CAMPANA_MERCATS_TARDOR';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id + ' nombre=' + (datos.NOMBRE || ''));
    return resultado.id;
  }

  if (listarRegistros('CAMPANA', { ACTIVO: 'SÍ' }).some(function (c) { return c.NOMBRE === 'Mercats de Tardor 2026'; })) {
    console.log('OK ya_instalado=true (campaña ya existe)');
    console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
    return true;
  }

  var idResponsableCeramica = buscarPersonaEquipoPorNombre_('Responsable de Cerámica').ID;
  var idResponsableTienda = buscarPersonaEquipoPorNombre_('Responsable de Tienda').ID;
  var idResponsableCarpinteria = buscarPersonaEquipoPorNombre_('Responsable de Carpintería').ID;
  var idResponsableManipulados = buscarPersonaEquipoPorNombre_('Responsable de Manipulados').ID;
  var idCoordinadora = buscarPersonaEquipoPorNombre_('Coordinadora de Taller').ID;

  var idCampana = crear_('CAMPANA', {
    NOMBRE: 'Mercats de Tardor 2026', DESCRIPCION: 'Producción para los mercados y ferias de otoño (septiembre-noviembre).',
    FECHA_INICIO_PLAN: '2026-07-20', FECHA_FIN_PLAN: '2026-11-30', ESTADO: 'Activa',
    OBJETIVO: 'Preparar y vender stock en los mercados de temporada de otoño',
    RESULTADO_ESPERADO: 'Colecciones de Cerámica, Carpintería y Manipulados listas y vendidas en Tienda/mercados'
  });

  /* --- Proyecto 1: Colección Cerámica de Otoño (en curso, incluye "hoy"). --- */
  var idProyectoCeramica = crear_('PROYECTO', {
    CAMPANA_ID: idCampana, NOMBRE: 'Colección Cerámica de Otoño',
    TIPO_PROYECTO: 'Producción propia / stock', PRIORIDAD: 'Media', RESPONSABLE_ID: idResponsableCeramica,
    FECHA_INICIO_PLAN: '2026-07-20', FECHA_FIN_PLAN: '2026-08-08', FECHA_INICIO_REAL: '2026-07-20',
    ESTADO: 'En proceso', OBJETIVO: 'Fabricar una colección de piezas de cerámica de temporada',
    RESULTADO_ESPERADO: 'Piezas de cerámica esmaltadas y listas para vender'
  });
  var idProductoCeramica = crear_('PRODUCTO', {
    NOMBRE: 'Colección Cerámica de Otoño', ORIGEN: 'Producción propia', UNIDAD: 'Unidad',
    CANTIDAD_PREVISTA: 150, FECHA_REQUERIDA: '2026-08-08', PRIORIDAD: 'Media',
    CODIGO: 'PRD-CERAM-OTONO26', PROYECTO_VINCULAR_ID: idProyectoCeramica,
    RESPONSABLE_ID: idResponsableCeramica, ESTADO: 'En producción'
  });
  var idCeramicaPreprod = crear_('PROCESO', {
    PRODUCTO_ID: idProductoCeramica, NOMBRE: 'Preproducción colección cerámica', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 5, DURACION_REAL_DIAS: 5, RESPONSABLE_ID: idResponsableCeramica,
    FECHA_INICIO_PLAN: '2026-07-20', FECHA_FIN_PLAN: '2026-07-24',
    FECHA_INICIO_REAL: '2026-07-20', FECHA_FIN_REAL: '2026-07-24',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Preproducción'
  });
  var idCeramicaProd = crear_('PROCESO', {
    PRODUCTO_ID: idProductoCeramica, NOMBRE: 'Producción colección cerámica', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 6, RESPONSABLE_ID: idResponsableCeramica,
    FECHA_INICIO_PLAN: '2026-07-30', FECHA_FIN_PLAN: '2026-08-04',
    FECHA_INICIO_REAL: '2026-07-30',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'En proceso', FASE_PRODUCCION: 'Producción'
  });
  var idCeramicaPostprod = crear_('PROCESO', {
    PRODUCTO_ID: idProductoCeramica, NOMBRE: 'Postproducción colección cerámica', ORDEN_SECUENCIA: 3,
    DURACION_PREVISTA_DIAS: 4, PROCESO_PREDECESOR_ID: idCeramicaProd, RESPONSABLE_ID: idResponsableCeramica,
    FECHA_INICIO_PLAN: '2026-08-05', FECHA_FIN_PLAN: '2026-08-08',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Postproducción'
  });

  crear_('TAREA', {
    PROCESO_ID: idCeramicaPreprod, NOMBRE: 'Diseño de la colección', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 2, DURACION_REAL_DIAS: 2,
    FECHA_INICIO_PLAN: '2026-07-20', FECHA_FIN_PLAN: '2026-07-21',
    FECHA_INICIO_REAL: '2026-07-20', FECHA_FIN_REAL: '2026-07-21', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idCeramicaPreprod, NOMBRE: 'Preparación de arcilla y moldes', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 3, DURACION_REAL_DIAS: 3,
    FECHA_INICIO_PLAN: '2026-07-22', FECHA_FIN_PLAN: '2026-07-24',
    FECHA_INICIO_REAL: '2026-07-22', FECHA_FIN_REAL: '2026-07-24', ESTADO: 'Terminada'
  });
  var idTareaModelado = crear_('TAREA', {
    PROCESO_ID: idCeramicaProd, NOMBRE: 'Modelado de piezas', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 3, DURACION_REAL_DIAS: 3,
    FECHA_INICIO_PLAN: '2026-07-30', FECHA_FIN_PLAN: '2026-08-01',
    FECHA_INICIO_REAL: '2026-07-30', FECHA_FIN_REAL: '2026-08-01', ESTADO: 'Terminada'
  });
  var idTareaCoccion = crear_('TAREA', {
    PROCESO_ID: idCeramicaProd, NOMBRE: 'Cocción en horno', ORDEN_SECUENCIA: 2,
    TAREA_PREDECESORA_ID: idTareaModelado, DURACION_PREVISTA_DIAS: 3,
    FECHA_INICIO_PLAN: '2026-08-02', FECHA_FIN_PLAN: '2026-08-04',
    FECHA_INICIO_REAL: '2026-08-02', ESTADO: 'En proceso'
  });
  crear_('TAREA', {
    PROCESO_ID: idCeramicaPostprod, NOMBRE: 'Esmaltado', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 2,
    FECHA_INICIO_PLAN: '2026-08-05', FECHA_FIN_PLAN: '2026-08-06', ESTADO: 'Pendiente'
  });
  crear_('TAREA', {
    PROCESO_ID: idCeramicaPostprod, NOMBRE: 'Embalaje y etiquetado', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 2,
    FECHA_INICIO_PLAN: '2026-08-07', FECHA_FIN_PLAN: '2026-08-08', ESTADO: 'Pendiente'
  });

  /* --- Proyecto 2: Mobiliario de exterior (Carpintería, todo en el futuro próximo). --- */
  var idProyectoCarpinteria = crear_('PROYECTO', {
    CAMPANA_ID: idCampana, NOMBRE: 'Mobiliario de exterior',
    TIPO_PROYECTO: 'Producción propia / stock', PRIORIDAD: 'Media', RESPONSABLE_ID: idResponsableCarpinteria,
    FECHA_INICIO_PLAN: '2026-08-10', FECHA_FIN_PLAN: '2026-08-28',
    ESTADO: 'Planificado', OBJETIVO: 'Fabricar mobiliario ligero de exterior para la temporada',
    RESULTADO_ESPERADO: 'Bancos y jardineras listos para la venta de otoño'
  });
  var idProductoCarpinteria = crear_('PRODUCTO', {
    NOMBRE: 'Banco y jardinera de exterior', ORIGEN: 'Producción propia', UNIDAD: 'Unidad',
    CANTIDAD_PREVISTA: 30, FECHA_REQUERIDA: '2026-08-28', PRIORIDAD: 'Media',
    CODIGO: 'PRD-CARP-MOBEXT26', PROYECTO_VINCULAR_ID: idProyectoCarpinteria,
    RESPONSABLE_ID: idResponsableCarpinteria, ESTADO: 'Planificado'
  });
  var idCarpinteriaPreprod = crear_('PROCESO', {
    PRODUCTO_ID: idProductoCarpinteria, NOMBRE: 'Preproducción mobiliario', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 3, RESPONSABLE_ID: idResponsableCarpinteria,
    FECHA_INICIO_PLAN: '2026-08-10', FECHA_FIN_PLAN: '2026-08-12',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Preproducción'
  });
  var idCarpinteriaProd = crear_('PROCESO', {
    PRODUCTO_ID: idProductoCarpinteria, NOMBRE: 'Producción mobiliario', ORDEN_SECUENCIA: 2,
    PROCESO_PREDECESOR_ID: idCarpinteriaPreprod, DURACION_PREVISTA_DIAS: 10, RESPONSABLE_ID: idResponsableCarpinteria,
    FECHA_INICIO_PLAN: '2026-08-13', FECHA_FIN_PLAN: '2026-08-24',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Producción'
  });
  var idCarpinteriaPostprod = crear_('PROCESO', {
    PRODUCTO_ID: idProductoCarpinteria, NOMBRE: 'Postproducción mobiliario', ORDEN_SECUENCIA: 3,
    PROCESO_PREDECESOR_ID: idCarpinteriaProd, DURACION_PREVISTA_DIAS: 4, RESPONSABLE_ID: idResponsableCarpinteria,
    FECHA_INICIO_PLAN: '2026-08-25', FECHA_FIN_PLAN: '2026-08-28',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Postproducción'
  });
  crear_('TAREA', {
    PROCESO_ID: idCarpinteriaPreprod, NOMBRE: 'Diseño y plano de corte', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 3, FECHA_INICIO_PLAN: '2026-08-10', FECHA_FIN_PLAN: '2026-08-12', ESTADO: 'Pendiente'
  });
  crear_('TAREA', {
    PROCESO_ID: idCarpinteriaProd, NOMBRE: 'Corte y ensamblaje', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 6, FECHA_INICIO_PLAN: '2026-08-13', FECHA_FIN_PLAN: '2026-08-19', ESTADO: 'Pendiente'
  });
  crear_('TAREA', {
    PROCESO_ID: idCarpinteriaProd, NOMBRE: 'Lijado y pintura', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 4, FECHA_INICIO_PLAN: '2026-08-20', FECHA_FIN_PLAN: '2026-08-24', ESTADO: 'Pendiente'
  });
  crear_('TAREA', {
    PROCESO_ID: idCarpinteriaPostprod, NOMBRE: 'Control de calidad y embalaje', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 4, FECHA_INICIO_PLAN: '2026-08-25', FECHA_FIN_PLAN: '2026-08-28', ESTADO: 'Pendiente'
  });

  /* --- Proyecto 3: Packaging y merchandising (Manipulados, ya producido con retraso; venta en Tienda, futura). --- */
  var idProyectoPackaging = crear_('PROYECTO', {
    CAMPANA_ID: idCampana, NOMBRE: 'Packaging y merchandising',
    TIPO_PROYECTO: 'Producción propia / stock', PRIORIDAD: 'Alta', RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-06-01', FECHA_FIN_PLAN: '2026-11-27', FECHA_INICIO_REAL: '2026-06-01',
    ESTADO: 'En proceso', OBJETIVO: 'Producir packaging y venderlo en Tienda y mercados de otoño',
    RESULTADO_ESPERADO: 'Packaging fabricado y stock vendido en la temporada de otoño'
  });
  var idProductoPackaging = crear_('PRODUCTO', {
    NOMBRE: 'Packaging y merchandising de temporada', ORIGEN: 'Producción propia', UNIDAD: 'Unidad',
    CANTIDAD_PREVISTA: 500, FECHA_REQUERIDA: '2026-11-27', PRIORIDAD: 'Alta',
    CODIGO: 'PRD-MANIP-PACK26', PROYECTO_VINCULAR_ID: idProyectoPackaging,
    RESPONSABLE_ID: idResponsableManipulados, ESTADO: 'En producción'
  });
  var idPackagingPreprod = crear_('PROCESO', {
    PRODUCTO_ID: idProductoPackaging, NOMBRE: 'Preproducción packaging', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 5, DURACION_REAL_DIAS: 5, RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-06-01', FECHA_FIN_PLAN: '2026-06-05',
    FECHA_INICIO_REAL: '2026-06-01', FECHA_FIN_REAL: '2026-06-05',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Preproducción'
  });
  var idPackagingProd = crear_('PROCESO', {
    PRODUCTO_ID: idProductoPackaging, NOMBRE: 'Producción packaging', ORDEN_SECUENCIA: 2,
    PROCESO_PREDECESOR_ID: idPackagingPreprod, DURACION_PREVISTA_DIAS: 8, DURACION_REAL_DIAS: 14,
    RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-06-08', FECHA_FIN_PLAN: '2026-06-19',
    FECHA_INICIO_REAL: '2026-06-08', FECHA_FIN_REAL: '2026-06-25',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Producción'
  });
  var idPackagingVenta = crear_('PROCESO', {
    PRODUCTO_ID: idProductoPackaging, NOMBRE: 'Venta en mercados y Tienda', ORDEN_SECUENCIA: 3,
    PROCESO_PREDECESOR_ID: idPackagingProd, DURACION_PREVISTA_DIAS: 60, RESPONSABLE_ID: idResponsableTienda,
    FECHA_INICIO_PLAN: '2026-09-01', FECHA_FIN_PLAN: '2026-11-27',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Postproducción'
  });
  crear_('TAREA', {
    PROCESO_ID: idPackagingPreprod, NOMBRE: 'Diseño de packaging', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 5, DURACION_REAL_DIAS: 5,
    FECHA_INICIO_PLAN: '2026-06-01', FECHA_FIN_PLAN: '2026-06-05',
    FECHA_INICIO_REAL: '2026-06-01', FECHA_FIN_REAL: '2026-06-05', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idPackagingProd, NOMBRE: 'Impresión y troquelado', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 4, DURACION_REAL_DIAS: 8,
    FECHA_INICIO_PLAN: '2026-06-08', FECHA_FIN_PLAN: '2026-06-11',
    FECHA_INICIO_REAL: '2026-06-08', FECHA_FIN_REAL: '2026-06-16', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idPackagingProd, NOMBRE: 'Montaje y control de calidad', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 4, DURACION_REAL_DIAS: 6,
    FECHA_INICIO_PLAN: '2026-06-16', FECHA_FIN_PLAN: '2026-06-19',
    FECHA_INICIO_REAL: '2026-06-19', FECHA_FIN_REAL: '2026-06-25', ESTADO: 'Terminada'
  });
  var idTareaPreparacionMercadillo = crear_('TAREA', {
    PROCESO_ID: idPackagingVenta, NOMBRE: 'Preparar mercadillo local', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 3,
    FECHA_INICIO_PLAN: '2026-08-01', FECHA_FIN_PLAN: '2026-08-03',
    FECHA_INICIO_REAL: '2026-08-01', ESTADO: 'En proceso'
  });
  crear_('TAREA', {
    PROCESO_ID: idPackagingVenta, NOMBRE: 'Venta en Tienda', ORDEN_SECUENCIA: 2,
    TAREA_PREDECESORA_ID: idTareaPreparacionMercadillo, DURACION_PREVISTA_DIAS: 55,
    FECHA_INICIO_PLAN: '2026-09-05', FECHA_FIN_PLAN: '2026-11-27', ESTADO: 'Pendiente'
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/* Paso 3: TAREA_RESPONSABLE (incl. solapamiento deliberado) + TAREA_RECURSO. */
function instalarAsignacionesMercatsTardor() {
  var packageName = 'INSTALAR_ASIGNACIONES_MERCATS_TARDOR';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id);
    return resultado.id;
  }

  /*
   * Idempotencia (ver conversacion: TRE-0029/0030 ya se crearon antes de
   * que la 3ra fila reventara la regla de dedicacion total <=100% --
   * sin esto, volver a ejecutar duplicaria esas dos).
   */
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

  var idResponsableCeramica = buscarPersonaEquipoPorNombre_('Responsable de Cerámica').ID;
  var idVoluntariado = buscarPersonaEquipoPorNombre_('Voluntariado de Apoyo').ID;
  var idResponsableTienda = buscarPersonaEquipoPorNombre_('Responsable de Tienda').ID;

  var idTareaCoccion = buscarTareaPorNombreYProducto_('Cocción en horno', 'PRD-CERAM-OTONO26').ID;
  var idTareaMercadillo = buscarTareaPorNombreYProducto_('Preparar mercadillo local', 'PRD-MANIP-PACK26').ID;

  /*
   * Solapamiento deliberado (ver conversacion): el Voluntariado de Apoyo
   * queda responsable a la vez de "Cocción en horno" (Cerámica,
   * 2026-08-02..04) y "Preparar mercadillo local" (Manipulados/Tienda,
   * 2026-08-01..03) -- fechas solapadas, dos espacios distintos, para
   * volver a probar el aviso de sobreasignación del Panel de Campaña.
   * 50%+50% (no 50%+100%): la regla de negocio real limita la
   * dedicacion ACTIVA TOTAL de una persona a 100% sumando TODAS sus
   * tareas, sin mirar fechas -- un primer intento con 150% lo confirmó.
   */
  crearTareaResponsableSiFalta_({
    TAREA_ID: idTareaCoccion, PERSONA_EQUIPO_ID: idResponsableCeramica,
    ROL_ASIGNADO: 'Responsable', FECHA_INICIO_ASIGNACION: '2026-08-02', FECHA_FIN_ASIGNACION: '2026-08-04',
    PORCENTAJE_DEDICACION: 100, ESTADO: 'Activa'
  });
  crearTareaResponsableSiFalta_({
    TAREA_ID: idTareaCoccion, PERSONA_EQUIPO_ID: idVoluntariado,
    ROL_ASIGNADO: 'Colaborador', FECHA_INICIO_ASIGNACION: '2026-08-02', FECHA_FIN_ASIGNACION: '2026-08-04',
    PORCENTAJE_DEDICACION: 50, ESTADO: 'Activa'
  });
  crearTareaResponsableSiFalta_({
    TAREA_ID: idTareaMercadillo, PERSONA_EQUIPO_ID: idVoluntariado,
    ROL_ASIGNADO: 'Colaborador', FECHA_INICIO_ASIGNACION: '2026-08-01', FECHA_FIN_ASIGNACION: '2026-08-03',
    PORCENTAJE_DEDICACION: 50, ESTADO: 'Activa'
  });
  crearTareaResponsableSiFalta_({
    TAREA_ID: idTareaMercadillo, PERSONA_EQUIPO_ID: idResponsableTienda,
    ROL_ASIGNADO: 'Supervisor', FECHA_INICIO_ASIGNACION: '2026-08-01', FECHA_FIN_ASIGNACION: '2026-08-03',
    PORCENTAJE_DEDICACION: 50, ESTADO: 'Activa'
  });

  /* TAREA_RECURSO: usa los espacios reales de la jerarquía física ya sembrada. */
  var RECURSO_CERAMICA = 'REC-0009';
  var RECURSO_MANIPULADOS = 'REC-0004';
  var RECURSO_TIENDA = 'REC-0011';

  function crearTareaRecursoSiFalta_(datos) {
    var yaExiste = listarRegistros('TAREA_RECURSO', { ACTIVO: 'SÍ' }).some(function (tr) {
      return tr.TAREA_ID === datos.TAREA_ID && tr.RECURSO_ID === datos.RECURSO_ID;
    });
    if (yaExiste) {
      console.log('OK ya_existe=true tarea=' + datos.TAREA_ID + ' recurso=' + datos.RECURSO_ID);
      return;
    }
    crear_('TAREA_RECURSO', datos);
  }

  crearTareaRecursoSiFalta_({
    TAREA_ID: idTareaCoccion, RECURSO_ID: RECURSO_CERAMICA, TIPO_USO: 'Utiliza',
    FECHA_INICIO: '2026-08-02', FECHA_FIN: '2026-08-04', ESTADO: 'Activa'
  });
  crearTareaRecursoSiFalta_({
    TAREA_ID: idTareaMercadillo, RECURSO_ID: RECURSO_MANIPULADOS, TIPO_USO: 'Utiliza',
    FECHA_INICIO: '2026-08-01', FECHA_FIN: '2026-08-03', ESTADO: 'Activa'
  });

  var idTareaVentaTienda = listarRegistros('TAREA', { ACTIVO: 'SÍ', NOMBRE: 'Venta en Tienda' })[0];
  if (idTareaVentaTienda) {
    crearTareaRecursoSiFalta_({
      TAREA_ID: idTareaVentaTienda.ID, RECURSO_ID: RECURSO_TIENDA, TIPO_USO: 'Utiliza',
      FECHA_INICIO: '2026-09-05', FECHA_FIN: '2026-11-27', ESTADO: 'Activa'
    });
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/* Paso 4: HORARIO -- apertura de espacios y franja del voluntariado. */
function instalarHorariosMercatsTardor() {
  var packageName = 'INSTALAR_HORARIOS_MERCATS_TARDOR';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  function crear_(datos) {
    var resultado = guardarFormulario('HORARIO', null, datos, correlationId);
    console.log('OK creado entidad=HORARIO id=' + resultado.id);
    return resultado.id;
  }

  var RECURSO_LA_TROBALLA = 'REC-0008';
  var RECURSO_CERAMICA = 'REC-0009';
  var RECURSO_TIENDA = 'REC-0011';
  var idVoluntariado = buscarPersonaEquipoPorNombre_('Voluntariado de Apoyo').ID;

  crear_({ ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: RECURSO_LA_TROBALLA, DIA_SEMANA: 'Lunes', HORA_INICIO: '09:00', HORA_FIN: '17:00', ESTADO: 'Activa', OBSERVACIONES: 'Apertura general del taller.' });
  crear_({ ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: RECURSO_LA_TROBALLA, DIA_SEMANA: 'Martes', HORA_INICIO: '09:00', HORA_FIN: '17:00', ESTADO: 'Activa' });
  crear_({ ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: RECURSO_LA_TROBALLA, DIA_SEMANA: 'Miércoles', HORA_INICIO: '09:00', HORA_FIN: '17:00', ESTADO: 'Activa' });
  crear_({ ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: RECURSO_LA_TROBALLA, DIA_SEMANA: 'Jueves', HORA_INICIO: '09:00', HORA_FIN: '17:00', ESTADO: 'Activa' });
  crear_({ ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: RECURSO_LA_TROBALLA, DIA_SEMANA: 'Viernes', HORA_INICIO: '09:00', HORA_FIN: '17:00', ESTADO: 'Activa' });

  /* Cerámica solo abre 2 días -- deliberado, para valorar más adelante la alerta de coherencia horario-tarea (la tarea "Cocción en horno" cae también en lunes). */
  crear_({ ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: RECURSO_CERAMICA, DIA_SEMANA: 'Martes', HORA_INICIO: '10:00', HORA_FIN: '14:00', ESTADO: 'Activa', OBSERVACIONES: 'Horario reducido, sin equipo a tiempo completo.' });
  crear_({ ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: RECURSO_CERAMICA, DIA_SEMANA: 'Jueves', HORA_INICIO: '10:00', HORA_FIN: '14:00', ESTADO: 'Activa' });

  crear_({ ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: RECURSO_TIENDA, DIA_SEMANA: 'Miércoles', HORA_INICIO: '10:00', HORA_FIN: '13:00', ESTADO: 'Activa', OBSERVACIONES: 'Horario de atención al público.' });
  crear_({ ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: RECURSO_TIENDA, DIA_SEMANA: 'Jueves', HORA_INICIO: '10:00', HORA_FIN: '13:00', ESTADO: 'Activa' });
  crear_({ ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: RECURSO_TIENDA, DIA_SEMANA: 'Viernes', HORA_INICIO: '10:00', HORA_FIN: '13:00', ESTADO: 'Activa' });
  crear_({ ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: RECURSO_TIENDA, DIA_SEMANA: 'Sábado', HORA_INICIO: '10:00', HORA_FIN: '13:00', ESTADO: 'Activa' });

  crear_({ ENTIDAD_TIPO: 'Persona/Equipo', ENTIDAD_ID: idVoluntariado, DIA_SEMANA: 'Lunes', HORA_INICIO: '16:00', HORA_FIN: '18:00', ESTADO: 'Activa' });
  crear_({ ENTIDAD_TIPO: 'Persona/Equipo', ENTIDAD_ID: idVoluntariado, DIA_SEMANA: 'Miércoles', HORA_INICIO: '16:00', HORA_FIN: '18:00', ESTADO: 'Activa' });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/*
 * Paso 5: Incidencias de mantenimiento (grounded en patrones reales del
 * documento de tareas diarias: horno cerámica, extintores tienda) +
 * documentos/manuales (protocolo alimentario, ficha técnica, protocolo
 * de packaging) -- probando el hueco cerrado de Documento/Vínculo sobre
 * Persona/Equipo y sobre Recurso.
 */
function instalarIncidenciasDocumentosMercatsTardor() {
  var packageName = 'INSTALAR_INCIDENCIAS_DOCUMENTOS_MERCATS_TARDOR';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id);
    return resultado.id;
  }

  var RECURSO_CERAMICA = 'REC-0009';
  var RECURSO_TIENDA = 'REC-0011';
  var idResponsableCeramica = buscarPersonaEquipoPorNombre_('Responsable de Cerámica').ID;
  var idCoordinadora = buscarPersonaEquipoPorNombre_('Coordinadora de Taller').ID;
  var idProductoCeramica = buscarProductoPorCodigo_('PRD-CERAM-OTONO26').ID;
  var idProyectoPackaging = listarRegistros('PROYECTO', { ACTIVO: 'SÍ', NOMBRE: 'Packaging y merchandising' })[0].ID;

  /* --- Incidencias de mantenimiento, tipo "infraestructura" del documento real. --- */
  var idIncidenciaHorno = crear_('INCIDENCIA', {
    NIVEL_INCIDENCIA: 'General', TITULO: 'Mantenimiento del horno de cerámica',
    DESCRIPCION: 'El horno necesita revisión y mantenimiento preventivo antes de la próxima cocción.',
    TIPO: 'Maquinaria', PRIORIDAD: 'Alta', RESPONSABLE_ID: idResponsableCeramica,
    FECHA_DETECCION: '2026-07-28', FECHA_LIMITE: '2026-08-15', ESTADO: 'Abierta', IMPACTO: 'Alto'
  });
  var idIncidenciaExtintor = crear_('INCIDENCIA', {
    NIVEL_INCIDENCIA: 'General', TITULO: 'Extintor de Tienda caducado',
    DESCRIPCION: 'El extintor de la Tienda ha caducado y hay que sustituirlo antes de reabrir al público.',
    TIPO: 'Seguridad', PRIORIDAD: 'Alta', RESPONSABLE_ID: idCoordinadora,
    FECHA_DETECCION: '2026-07-30', FECHA_LIMITE: '2026-09-01', ESTADO: 'Abierta', IMPACTO: 'Alto'
  });

  crear_('VINCULO', {
    ENTIDAD_ORIGEN_TIPO: 'Incidencia', ENTIDAD_ORIGEN_ID: idIncidenciaHorno,
    ENTIDAD_DESTINO_TIPO: 'Recurso', ENTIDAD_DESTINO_ID: RECURSO_CERAMICA,
    TIPO_VINCULO: 'Detectada en', ESTADO: 'Activa'
  });
  crear_('VINCULO', {
    ENTIDAD_ORIGEN_TIPO: 'Incidencia', ENTIDAD_ORIGEN_ID: idIncidenciaExtintor,
    ENTIDAD_DESTINO_TIPO: 'Recurso', ENTIDAD_DESTINO_ID: RECURSO_TIENDA,
    TIPO_VINCULO: 'Detectada en', ESTADO: 'Activa'
  });

  /* --- Documentos/manuales, tipo "MEJORAS" del documento real (formación) y fichas de producto. --- */
  crear_('DOCUMENTO', {
    ENTIDAD_TIPO: 'Persona/Equipo', ENTIDAD_ID: idCoordinadora,
    TIPO_DOCUMENTO: 'Protocolo', TITULO: 'Protocolo de manipulador de alimentos',
    DESCRIPCION: 'Protocolo interno de formación en manipulación de alimentos para el equipo de Cocina/Tienda.',
    VERSION: '1.0', URL: 'https://intranet.latroballa.local/protocolos/manipulador-alimentos',
    ESTADO: 'Vigente', FECHA_DOCUMENTO: '2026-07-15'
  });
  crear_('DOCUMENTO', {
    ENTIDAD_TIPO: 'Producto', ENTIDAD_ID: idProductoCeramica,
    TIPO_DOCUMENTO: 'Ficha técnica', TITULO: 'Ficha técnica: Colección Cerámica de Otoño',
    DESCRIPCION: 'Materiales, medidas y proceso de esmaltado de la colección.',
    VERSION: '1.0', URL: 'https://intranet.latroballa.local/fichas/ceramica-otono-2026',
    ESTADO: 'Vigente', FECHA_DOCUMENTO: '2026-07-24'
  });
  crear_('DOCUMENTO', {
    ENTIDAD_TIPO: 'Proyecto', ENTIDAD_ID: idProyectoPackaging,
    TIPO_DOCUMENTO: 'Protocolo', TITULO: 'Procedimiento de packaging y etiquetado',
    DESCRIPCION: 'Procedimiento estándar de impresión, troquelado y montaje de packaging.',
    VERSION: '2.0', URL: 'https://intranet.latroballa.local/protocolos/packaging',
    ESTADO: 'Vigente', FECHA_DOCUMENTO: '2026-06-01'
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}
