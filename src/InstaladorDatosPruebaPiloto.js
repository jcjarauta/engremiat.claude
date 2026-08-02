/**
 * Datos de prueba de todo el sistema, basados en la ESTRUCTURA real del
 * taller (categorias, fases de produccion, ritmos y cantidades reales
 * extraidos de MEMORIA - PRODUCCION 2023 / Planning 2024 / tareas
 * diarias), pero con personas y clientes ANONIMIZADOS (roles genericos
 * en vez de nombres reales, ningun cliente ni entidad externa real).
 * Ver valoracion de coste/beneficio en la conversacion -- el motivo de
 * anonimizar es que el documento de tareas diarias contiene nombres de
 * participantes de un programa social, mas sensibles que un dato de
 * negocio normal, y estos registros no son efimeros: quedan en el
 * spreadsheet de produccion real, sin mecanismo de purga.
 *
 * Reutiliza guardarFormulario (la misma funcion que usa la UI) para
 * cada registro, en vez de escribir directamente en las hojas -- así
 * pasa por toda la validacion real (FK, duplicados, reglas de negocio)
 * en vez de solo simular que pasaria.
 *
 * Idempotente NO: pensada para ejecutarse una unica vez, manualmente.
 * Si algo falla a medio camino, los registros ya creados quedan en el
 * spreadsheet (no hay rollback transaccional entre entidades).
 */
function instalarDatosPruebaPiloto() {
  var packageName = 'INSTALAR_DATOS_PRUEBA_PILOTO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  var contador = { creados: 0 };

  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    contador.creados++;
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id + ' nombre=' + (datos.NOMBRE || datos.TITULO || datos.CODIGO || ''));
    return resultado.id;
  }

  // 1. Personas y equipo (roles anonimizados, sin nombres reales)
  var idResponsableManipulados = crear_('PERSONA_EQUIPO', {
    TIPO: 'Persona', NOMBRE: 'Responsable de Manipulados', ROL: 'Producción',
    CAPACIDAD_SEMANAL_DIAS: 5, DISPONIBILIDAD: 'Completa', ESTADO: 'Disponible'
  });
  var idResponsableCarpinteria = crear_('PERSONA_EQUIPO', {
    TIPO: 'Persona', NOMBRE: 'Responsable de Carpintería', ROL: 'Producción',
    CAPACIDAD_SEMANAL_DIAS: 5, DISPONIBILIDAD: 'Completa', ESTADO: 'Disponible'
  });
  var idCoordinadora = crear_('PERSONA_EQUIPO', {
    TIPO: 'Persona', NOMBRE: 'Coordinadora de Taller', ROL: 'Coordinación',
    CAPACIDAD_SEMANAL_DIAS: 5, DISPONIBILIDAD: 'Completa', ESTADO: 'Disponible'
  });
  var idDisenadora = crear_('PERSONA_EQUIPO', {
    TIPO: 'Persona', NOMBRE: 'Diseñador/a de Producto', ROL: 'Diseño',
    CAPACIDAD_SEMANAL_DIAS: 4, DISPONIBILIDAD: 'Parcial', ESTADO: 'Disponible'
  });
  var idVoluntariado = crear_('PERSONA_EQUIPO', {
    TIPO: 'Persona', NOMBRE: 'Voluntariado de Apoyo', ROL: 'Voluntariado',
    CAPACIDAD_SEMANAL_DIAS: 2, DISPONIBILIDAD: 'Puntual', ESTADO: 'Disponible'
  });

  // 2. Proveedor genérico (sin identidad real)
  var idProveedor = crear_('PROVEEDOR', {
    CODIGO: 'PROV-MAT-01', NOMBRE: 'Suministros de Manipulados y Carpintería',
    PLAZO_ENTREGA_DIAS: 5, ESTADO: 'Activo'
  });

  // 3. Recursos: espacios primero (UBICACION_ID/UBICACION dependen de ellos)
  var idTallerManipulados = crear_('RECURSO', {
    CODIGO: 'ESP-01', NOMBRE: 'Taller de Manipulados', CLASE_RECURSO: 'Espacio',
    CATEGORIA_RECURSO: 'Espacio productivo', ESTADO: 'Disponible'
  });
  var idTallerCarpinteria = crear_('RECURSO', {
    CODIGO: 'ESP-02', NOMBRE: 'Taller de Carpintería', CLASE_RECURSO: 'Espacio',
    CATEGORIA_RECURSO: 'Espacio productivo', ESTADO: 'Disponible'
  });
  var idAlmacen = crear_('RECURSO', {
    CODIGO: 'ESP-03', NOMBRE: 'Almacén de Materiales', CLASE_RECURSO: 'Espacio',
    CATEGORIA_RECURSO: 'Espacio de almacenamiento', ESTADO: 'Disponible'
  });
  crear_('RECURSO', {
    CODIGO: 'MAQ-01', NOMBRE: 'Máquina troqueladora', CLASE_RECURSO: 'Maquinaria',
    CATEGORIA_RECURSO: 'Maquinaria fija', UBICACION_ID: idTallerManipulados,
    RESPONSABLE_ID: idResponsableManipulados, ESTADO: 'Disponible'
  });

  // 4. Materiales (categorías reales del taller: consumible, madera, pintura,
  // adhesivo, embalaje)
  crear_('MATERIAL', {
    CODIGO: 'MAT-01', NOMBRE: 'Cartulina reciclada A5', CATEGORIA: 'Consumible',
    UNIDAD: 'Unidad', STOCK_ACTUAL: 500, STOCK_MINIMO: 100,
    PROVEEDOR_ID: idProveedor, UBICACION: idAlmacen, ESTADO: 'Disponible'
  });
  crear_('MATERIAL', {
    CODIGO: 'MAT-02', NOMBRE: 'Cordón de yute', CATEGORIA: 'Consumible',
    UNIDAD: 'Metro', STOCK_ACTUAL: 300, STOCK_MINIMO: 50,
    PROVEEDOR_ID: idProveedor, UBICACION: idAlmacen, ESTADO: 'Disponible'
  });
  crear_('MATERIAL', {
    CODIGO: 'MAT-03', NOMBRE: 'Tablero contrachapado 3mm', CATEGORIA: 'Madera',
    UNIDAD: 'Metro cuadrado', STOCK_ACTUAL: 40, STOCK_MINIMO: 10,
    PROVEEDOR_ID: idProveedor, UBICACION: idAlmacen, ESTADO: 'Disponible'
  });
  crear_('MATERIAL', {
    CODIGO: 'MAT-04', NOMBRE: 'Pintura acrílica blanca', CATEGORIA: 'Pintura y acabado',
    UNIDAD: 'Litro', STOCK_ACTUAL: 8, STOCK_MINIMO: 2,
    PROVEEDOR_ID: idProveedor, UBICACION: idAlmacen, ESTADO: 'Disponible'
  });
  crear_('MATERIAL', {
    CODIGO: 'MAT-05', NOMBRE: 'Cola blanca para madera', CATEGORIA: 'Adhesivo',
    UNIDAD: 'Litro', STOCK_ACTUAL: 5, STOCK_MINIMO: 1,
    PROVEEDOR_ID: idProveedor, UBICACION: idAlmacen, ESTADO: 'Disponible'
  });
  crear_('MATERIAL', {
    CODIGO: 'MAT-06', NOMBRE: 'Caja de cartón embalaje', CATEGORIA: 'Embalaje',
    UNIDAD: 'Unidad', STOCK_ACTUAL: 150, STOCK_MINIMO: 30,
    PROVEEDOR_ID: idProveedor, UBICACION: idAlmacen, ESTADO: 'Disponible'
  });

  // 5. Campaña 1: Sant Jordi 2026 -- ya completada, con fechas reales
  // (algunas a tiempo, otras con retraso) para poder probar el Gantt y
  // el informe de desviación con datos que sí tienen algo que mostrar.
  var idCampanaSantJordi = crear_('CAMPANA', {
    NOMBRE: 'Sant Jordi 2026', DESCRIPCION: 'Producción de temporada para la diada de Sant Jordi',
    FECHA_INICIO_PLAN: '2026-03-02', FECHA_FIN_PLAN: '2026-04-23', ESTADO: 'Completada',
    OBJETIVO: 'Producir artículos de temporada para Sant Jordi',
    RESULTADO_ESPERADO: 'Cubrir la demanda de postales y puntos de libro de la campaña'
  });

  var idProyectoSantJordi = crear_('PROYECTO', {
    CAMPANA_ID: idCampanaSantJordi, NOMBRE: 'Producción Sant Jordi 2026',
    TIPO_PROYECTO: 'Producción propia / stock', PRIORIDAD: 'Alta',
    RESPONSABLE_ID: idCoordinadora,
    FECHA_INICIO_PLAN: '2026-03-02', FECHA_FIN_PLAN: '2026-04-23',
    FECHA_INICIO_REAL: '2026-03-02', FECHA_FIN_REAL: '2026-04-27',
    ESTADO: 'Completado',
    OBJETIVO: 'Fabricar el stock de temporada de Sant Jordi',
    RESULTADO_ESPERADO: 'Postales y puntos de libro listos para la diada'
  });

  var idProductoPostal = crear_('PRODUCTO', {
    NOMBRE: 'Postal corazón Sant Jordi', ORIGEN: 'Producción propia', UNIDAD: 'Unidad',
    CANTIDAD_PREVISTA: 248, FECHA_REQUERIDA: '2026-04-23', PRIORIDAD: 'Alta',
    CODIGO: 'PRD-SJ-POSTAL', PROYECTO_VINCULAR_ID: idProyectoSantJordi,
    RESPONSABLE_ID: idResponsableManipulados, ESTADO: 'Completado'
  });
  var idProductoPuntosLibro = crear_('PRODUCTO', {
    NOMBRE: 'Puntos de libro Sant Jordi', ORIGEN: 'Producción propia', UNIDAD: 'Unidad',
    CANTIDAD_PREVISTA: 1212, FECHA_REQUERIDA: '2026-04-23', PRIORIDAD: 'Alta',
    CODIGO: 'PRD-SJ-LIBRO', PROYECTO_VINCULAR_ID: idProyectoSantJordi,
    RESPONSABLE_ID: idResponsableManipulados, ESTADO: 'Completado'
  });

  // Postal: preproducción y producción a tiempo, postproducción con retraso
  // (avería de la troqueladora, ver incidencia más abajo).
  var idProcesoPreprodPostal = crear_('PROCESO', {
    PRODUCTO_ID: idProductoPostal, NOMBRE: 'Preproducción postal', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 3, DURACION_REAL_DIAS: 3, RESPONSABLE_ID: idDisenadora,
    FECHA_INICIO_PLAN: '2026-03-02', FECHA_FIN_PLAN: '2026-03-05',
    FECHA_INICIO_REAL: '2026-03-02', FECHA_FIN_REAL: '2026-03-05',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Preproducción'
  });
  var idProcesoProdPostal = crear_('PROCESO', {
    PRODUCTO_ID: idProductoPostal, NOMBRE: 'Producción postal', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 5, DURACION_REAL_DIAS: 9, RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-03-06', FECHA_FIN_PLAN: '2026-03-12',
    FECHA_INICIO_REAL: '2026-03-06', FECHA_FIN_REAL: '2026-03-16',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Producción'
  });
  var idProcesoPostprodPostal = crear_('PROCESO', {
    PRODUCTO_ID: idProductoPostal, NOMBRE: 'Postproducción postal', ORDEN_SECUENCIA: 3,
    DURACION_PREVISTA_DIAS: 1, DURACION_REAL_DIAS: 2, RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-03-13', FECHA_FIN_PLAN: '2026-03-13',
    FECHA_INICIO_REAL: '2026-03-17', FECHA_FIN_REAL: '2026-03-18',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Postproducción'
  });

  crear_('TAREA', {
    PROCESO_ID: idProcesoPreprodPostal, NOMBRE: 'Diseño de plantilla', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 2, DURACION_REAL_DIAS: 2,
    FECHA_INICIO_PLAN: '2026-03-02', FECHA_FIN_PLAN: '2026-03-03',
    FECHA_INICIO_REAL: '2026-03-02', FECHA_FIN_REAL: '2026-03-03', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idProcesoPreprodPostal, NOMBRE: 'Preparación de materiales', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 1, DURACION_REAL_DIAS: 1,
    FECHA_INICIO_PLAN: '2026-03-04', FECHA_FIN_PLAN: '2026-03-05',
    FECHA_INICIO_REAL: '2026-03-04', FECHA_FIN_REAL: '2026-03-05', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idProcesoProdPostal, NOMBRE: 'Corte y estampado', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 3, DURACION_REAL_DIAS: 6,
    FECHA_INICIO_PLAN: '2026-03-06', FECHA_FIN_PLAN: '2026-03-09',
    FECHA_INICIO_REAL: '2026-03-06', FECHA_FIN_REAL: '2026-03-12', ESTADO: 'Terminada',
    OBSERVACIONES: 'Retraso por avería de la troqueladora.'
  });
  crear_('TAREA', {
    PROCESO_ID: idProcesoProdPostal, NOMBRE: 'Montaje y pintado', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 2, DURACION_REAL_DIAS: 4,
    FECHA_INICIO_PLAN: '2026-03-10', FECHA_FIN_PLAN: '2026-03-12',
    FECHA_INICIO_REAL: '2026-03-13', FECHA_FIN_REAL: '2026-03-16', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idProcesoPostprodPostal, NOMBRE: 'Control de calidad y embalaje', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1, DURACION_REAL_DIAS: 2,
    FECHA_INICIO_PLAN: '2026-03-13', FECHA_FIN_PLAN: '2026-03-13',
    FECHA_INICIO_REAL: '2026-03-17', FECHA_FIN_REAL: '2026-03-18', ESTADO: 'Terminada'
  });

  // Puntos de libro: las tres fases a tiempo.
  var idProcesoPreprodLibro = crear_('PROCESO', {
    PRODUCTO_ID: idProductoPuntosLibro, NOMBRE: 'Preproducción puntos de libro', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 2, DURACION_REAL_DIAS: 2, RESPONSABLE_ID: idDisenadora,
    FECHA_INICIO_PLAN: '2026-03-16', FECHA_FIN_PLAN: '2026-03-18',
    FECHA_INICIO_REAL: '2026-03-16', FECHA_FIN_REAL: '2026-03-18',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Preproducción'
  });
  var idProcesoProdLibro = crear_('PROCESO', {
    PRODUCTO_ID: idProductoPuntosLibro, NOMBRE: 'Producción puntos de libro', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 8, DURACION_REAL_DIAS: 8, RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-03-19', FECHA_FIN_PLAN: '2026-03-27',
    FECHA_INICIO_REAL: '2026-03-19', FECHA_FIN_REAL: '2026-03-27',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Producción'
  });
  var idProcesoPostprodLibro = crear_('PROCESO', {
    PRODUCTO_ID: idProductoPuntosLibro, NOMBRE: 'Postproducción puntos de libro', ORDEN_SECUENCIA: 3,
    DURACION_PREVISTA_DIAS: 1, DURACION_REAL_DIAS: 1, RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-03-30', FECHA_FIN_PLAN: '2026-03-30',
    FECHA_INICIO_REAL: '2026-03-30', FECHA_FIN_REAL: '2026-03-30',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Postproducción'
  });

  crear_('TAREA', {
    PROCESO_ID: idProcesoPreprodLibro, NOMBRE: 'Diseño de plantilla', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1, DURACION_REAL_DIAS: 1,
    FECHA_INICIO_PLAN: '2026-03-16', FECHA_FIN_PLAN: '2026-03-16',
    FECHA_INICIO_REAL: '2026-03-16', FECHA_FIN_REAL: '2026-03-16', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idProcesoPreprodLibro, NOMBRE: 'Preparación de materiales', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 1, DURACION_REAL_DIAS: 1,
    FECHA_INICIO_PLAN: '2026-03-17', FECHA_FIN_PLAN: '2026-03-18',
    FECHA_INICIO_REAL: '2026-03-17', FECHA_FIN_REAL: '2026-03-18', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idProcesoProdLibro, NOMBRE: 'Corte y estampado', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 4, DURACION_REAL_DIAS: 4,
    FECHA_INICIO_PLAN: '2026-03-19', FECHA_FIN_PLAN: '2026-03-22',
    FECHA_INICIO_REAL: '2026-03-19', FECHA_FIN_REAL: '2026-03-22', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idProcesoProdLibro, NOMBRE: 'Montaje y pintado', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 4, DURACION_REAL_DIAS: 4,
    FECHA_INICIO_PLAN: '2026-03-23', FECHA_FIN_PLAN: '2026-03-27',
    FECHA_INICIO_REAL: '2026-03-23', FECHA_FIN_REAL: '2026-03-27', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idProcesoPostprodLibro, NOMBRE: 'Control de calidad y embalaje', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1, DURACION_REAL_DIAS: 1,
    FECHA_INICIO_PLAN: '2026-03-30', FECHA_FIN_PLAN: '2026-03-30',
    FECHA_INICIO_REAL: '2026-03-30', FECHA_FIN_REAL: '2026-03-30', ESTADO: 'Terminada'
  });

  // 6. Campaña 2: Navidad 2026 -- todavía en planificación (sin fechas
  // reales), para cubrir también el caso de datos que aún no se pueden
  // medir.
  var idCampanaNavidad = crear_('CAMPANA', {
    NOMBRE: 'Navidad 2026', DESCRIPCION: 'Producción de temporada navideña',
    FECHA_INICIO_PLAN: '2026-10-01', FECHA_FIN_PLAN: '2026-12-20', ESTADO: 'Planificada',
    OBJETIVO: 'Producir artículos de temporada navideña',
    RESULTADO_ESPERADO: 'Stock listo para la campaña de diciembre'
  });

  var idProyectoNavidad = crear_('PROYECTO', {
    CAMPANA_ID: idCampanaNavidad, NOMBRE: 'Producción Navidad 2026',
    TIPO_PROYECTO: 'Producción propia / stock', PRIORIDAD: 'Media',
    RESPONSABLE_ID: idCoordinadora,
    FECHA_INICIO_PLAN: '2026-10-01', FECHA_FIN_PLAN: '2026-12-20',
    ESTADO: 'Planificado',
    OBJETIVO: 'Fabricar el stock de temporada navideña',
    RESULTADO_ESPERADO: 'Calendarios y postales listos para diciembre'
  });

  var idProductoCalendario = crear_('PRODUCTO', {
    NOMBRE: 'Calendario de Adviento', ORIGEN: 'Producción propia', UNIDAD: 'Unidad',
    CANTIDAD_PREVISTA: 1020, FECHA_REQUERIDA: '2026-12-01', PRIORIDAD: 'Media',
    CODIGO: 'PRD-NAD-CALENDARIO', PROYECTO_VINCULAR_ID: idProyectoNavidad,
    RESPONSABLE_ID: idResponsableCarpinteria, ESTADO: 'Planificado'
  });
  var idProductoPostalNavidad = crear_('PRODUCTO', {
    NOMBRE: 'Postal de Navidad árbol', ORIGEN: 'Producción propia', UNIDAD: 'Unidad',
    CANTIDAD_PREVISTA: 713, FECHA_REQUERIDA: '2026-12-01', PRIORIDAD: 'Media',
    CODIGO: 'PRD-NAD-POSTAL', PROYECTO_VINCULAR_ID: idProyectoNavidad,
    RESPONSABLE_ID: idResponsableManipulados, ESTADO: 'Planificado'
  });

  var idProcesoPreprodCalendario = crear_('PROCESO', {
    PRODUCTO_ID: idProductoCalendario, NOMBRE: 'Preproducción calendario', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 5, RESPONSABLE_ID: idDisenadora,
    FECHA_INICIO_PLAN: '2026-10-01', FECHA_FIN_PLAN: '2026-10-05',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Preproducción'
  });
  var idProcesoProdCalendario = crear_('PROCESO', {
    PRODUCTO_ID: idProductoCalendario, NOMBRE: 'Producción calendario', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 15, RESPONSABLE_ID: idResponsableCarpinteria,
    FECHA_INICIO_PLAN: '2026-10-06', FECHA_FIN_PLAN: '2026-10-20',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Producción'
  });
  var idProcesoPostprodCalendario = crear_('PROCESO', {
    PRODUCTO_ID: idProductoCalendario, NOMBRE: 'Postproducción calendario', ORDEN_SECUENCIA: 3,
    DURACION_PREVISTA_DIAS: 2, RESPONSABLE_ID: idResponsableCarpinteria,
    FECHA_INICIO_PLAN: '2026-10-21', FECHA_FIN_PLAN: '2026-10-22',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Postproducción'
  });

  crear_('TAREA', {
    PROCESO_ID: idProcesoPreprodCalendario, NOMBRE: 'Diseño de plantilla', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 5, FECHA_INICIO_PLAN: '2026-10-01', FECHA_FIN_PLAN: '2026-10-05',
    ESTADO: 'Pendiente'
  });
  crear_('TAREA', {
    PROCESO_ID: idProcesoProdCalendario, NOMBRE: 'Corte y montaje', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 15, FECHA_INICIO_PLAN: '2026-10-06', FECHA_FIN_PLAN: '2026-10-20',
    ESTADO: 'Pendiente'
  });
  crear_('TAREA', {
    PROCESO_ID: idProcesoPostprodCalendario, NOMBRE: 'Control de calidad y embalaje', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 2, FECHA_INICIO_PLAN: '2026-10-21', FECHA_FIN_PLAN: '2026-10-22',
    ESTADO: 'Pendiente'
  });

  var idProcesoPreprodPostalNavidad = crear_('PROCESO', {
    PRODUCTO_ID: idProductoPostalNavidad, NOMBRE: 'Preproducción postal navidad', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 3, RESPONSABLE_ID: idDisenadora,
    FECHA_INICIO_PLAN: '2026-10-26', FECHA_FIN_PLAN: '2026-10-28',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Preproducción'
  });
  var idProcesoProdPostalNavidad = crear_('PROCESO', {
    PRODUCTO_ID: idProductoPostalNavidad, NOMBRE: 'Producción postal navidad', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 13, RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-10-29', FECHA_FIN_PLAN: '2026-11-10',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Producción'
  });
  var idProcesoPostprodPostalNavidad = crear_('PROCESO', {
    PRODUCTO_ID: idProductoPostalNavidad, NOMBRE: 'Postproducción postal navidad', ORDEN_SECUENCIA: 3,
    DURACION_PREVISTA_DIAS: 2, RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-11-11', FECHA_FIN_PLAN: '2026-11-12',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Pendiente', FASE_PRODUCCION: 'Postproducción'
  });

  crear_('TAREA', {
    PROCESO_ID: idProcesoPreprodPostalNavidad, NOMBRE: 'Diseño de plantilla', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 3, FECHA_INICIO_PLAN: '2026-10-26', FECHA_FIN_PLAN: '2026-10-28',
    ESTADO: 'Pendiente'
  });
  crear_('TAREA', {
    PROCESO_ID: idProcesoProdPostalNavidad, NOMBRE: 'Corte y estampado', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 13, FECHA_INICIO_PLAN: '2026-10-29', FECHA_FIN_PLAN: '2026-11-10',
    ESTADO: 'Pendiente'
  });
  crear_('TAREA', {
    PROCESO_ID: idProcesoPostprodPostalNavidad, NOMBRE: 'Control de calidad y embalaje', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 2, FECHA_INICIO_PLAN: '2026-11-11', FECHA_FIN_PLAN: '2026-11-12',
    ESTADO: 'Pendiente'
  });

  // 7. Incidencias: explican por qué la postproducción de la postal se
  // retrasó (avería de máquina) y un problema de stock ya resuelto.
  crear_('INCIDENCIA', {
    NIVEL_INCIDENCIA: 'Proyecto', CAMPANA_ID: idCampanaSantJordi, PROYECTO_ID: idProyectoSantJordi,
    TITULO: 'Avería de la troqueladora durante la producción de postales',
    DESCRIPCION: 'La máquina troqueladora dejó de funcionar 2 días, retrasando el acabado de las postales.',
    TIPO: 'Maquinaria', PRIORIDAD: 'Alta', RESPONSABLE_ID: idResponsableManipulados,
    FECHA_DETECCION: '2026-03-14', ESTADO: 'Resuelta',
    ACCION_CORRECTORA: 'Reparación de la troqueladora y ajuste del calendario de postproducción.',
    FECHA_RESOLUCION: '2026-03-16'
  });
  crear_('INCIDENCIA', {
    NIVEL_INCIDENCIA: 'Proyecto', CAMPANA_ID: idCampanaSantJordi, PROYECTO_ID: idProyectoSantJordi,
    TITULO: 'Stock de cartulina por debajo del mínimo',
    DESCRIPCION: 'El stock de cartulina reciclada bajó del mínimo antes de terminar la tirada de postales.',
    TIPO: 'Material', PRIORIDAD: 'Media', RESPONSABLE_ID: idResponsableManipulados,
    FECHA_DETECCION: '2026-03-08', ESTADO: 'Resuelta',
    ACCION_CORRECTORA: 'Pedido urgente al proveedor habitual.',
    FECHA_RESOLUCION: '2026-03-10'
  });

  // 8. Decisiones: una ya resuelta (Sant Jordi) y una pendiente (Navidad).
  crear_('DECISION', {
    PROYECTO_ID: idProyectoSantJordi, TITULO: 'Aumentar la tirada de postales de 200 a 248 unidades',
    CONTEXTO: 'La demanda estimada superó la previsión inicial de 200 unidades.',
    TIPO: 'Producción', RESPONSABLE_ID: idCoordinadora, FECHA_LIMITE: '2026-03-05',
    ESTADO: 'Aprobada', IMPACTO: 'Medio',
    RESOLUCION: 'Se aprueba aumentar la tirada a 248 unidades.', FECHA_RESOLUCION: '2026-03-04'
  });
  crear_('DECISION', {
    PROYECTO_ID: idProyectoNavidad, TITULO: 'Definir diseño del calendario de Adviento 2026',
    CONTEXTO: 'Pendiente de decidir si se reutiliza el diseño de 2025 o se hace uno nuevo.',
    TIPO: 'Técnica', RESPONSABLE_ID: idDisenadora, FECHA_LIMITE: '2026-09-15',
    ESTADO: 'Pendiente de consenso', IMPACTO: 'Bajo'
  });

  console.log('OK total_registros_creados=' + contador.creados);
  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/**
 * instalarDatosPruebaPiloto() no es idempotente: la primera ejecucion
 * fallo tras crear PERSONA_EQUIPO/PROVEEDOR/RECURSO/MATERIAL/CAMPANA/
 * PROYECTO/PRODUCTO/PROCESO/TAREA (todo correcto) al llegar a
 * INCIDENCIA (guardarFormulario no aplica valorPorDefecto en servidor,
 * solo en el cliente -- ver commit de la correccion). La segunda
 * ejecucion, ya corregida, volvio a crear PERSONA_EQUIPO desde cero
 * (duplicando PER-0004..PER-0008 como PER-0009..PER-0013) antes de
 * fallar por CODIGO de proveedor duplicado. Esta funcion desactiva esos
 * 5 duplicados huerfanos (no los borra -- baja logica via ACTIVO=NO,
 * igual que el resto del sistema).
 */
function limpiarDuplicadosDatosPruebaPiloto() {
  var packageName = 'LIMPIAR_DUPLICADOS_DATOS_PRUEBA_PILOTO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  ['PER-0009', 'PER-0010', 'PER-0011', 'PER-0012', 'PER-0013'].forEach(function (id) {
    desactivarRegistro('PERSONA_EQUIPO', id);
    console.log('OK desactivado id=' + id);
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/**
 * completarDatosPruebaPilotoIncidenciasDecisiones() se ejecutó dos
 * veces (la segunda vez sin darse cuenta de que ya existía la función
 * completarDatosPruebaPilotoDecisiones, ya corregida) -- cada vez volvió
 * a crear las mismas 2 incidencias antes de fallar en la misma decisión
 * con fecha retroactiva. Esta función desactiva el segundo par
 * duplicado (INC-0019/INC-0020), dejando INC-0017/INC-0018 como las
 * válidas. Ejecutar una única vez, y NO volver a ejecutar
 * completarDatosPruebaPilotoIncidenciasDecisiones -- usar
 * completarDatosPruebaPilotoDecisiones para las decisiones.
 */
function limpiarDuplicadosIncidenciasDatosPruebaPiloto() {
  var packageName = 'LIMPIAR_DUPLICADOS_INCIDENCIAS_DATOS_PRUEBA_PILOTO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  ['INC-0019', 'INC-0020'].forEach(function (id) {
    desactivarRegistro('INCIDENCIA', id);
    console.log('OK desactivado id=' + id);
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/**
 * Completa la parte que instalarDatosPruebaPiloto() no llegó a crear
 * (INCIDENCIA/DECISION), reutilizando los IDs ya creados en la primera
 * ejecución real (CAM-0014/CAM-0015, PRO-0006/PRO-0007, PER-0004/
 * PER-0006/PER-0007). Ejecutar una única vez, después de
 * limpiarDuplicadosDatosPruebaPiloto().
 */
function completarDatosPruebaPilotoIncidenciasDecisiones() {
  var packageName = 'COMPLETAR_DATOS_PRUEBA_PILOTO_INCIDENCIAS_DECISIONES';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  var idCampanaSantJordi = 'CAM-0014';
  var idProyectoSantJordi = 'PRO-0006';
  var idProyectoNavidad = 'PRO-0007';
  var idResponsableManipulados = 'PER-0004';
  var idCoordinadora = 'PER-0006';
  var idDisenadora = 'PER-0007';

  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id + ' titulo=' + (datos.TITULO || ''));
  }

  crear_('INCIDENCIA', {
    NIVEL_INCIDENCIA: 'Proyecto', CAMPANA_ID: idCampanaSantJordi, PROYECTO_ID: idProyectoSantJordi,
    TITULO: 'Avería de la troqueladora durante la producción de postales',
    DESCRIPCION: 'La máquina troqueladora dejó de funcionar 2 días, retrasando el acabado de las postales.',
    TIPO: 'Maquinaria', PRIORIDAD: 'Alta', RESPONSABLE_ID: idResponsableManipulados,
    FECHA_DETECCION: '2026-03-14', ESTADO: 'Resuelta',
    ACCION_CORRECTORA: 'Reparación de la troqueladora y ajuste del calendario de postproducción.',
    FECHA_RESOLUCION: '2026-03-16'
  });
  crear_('INCIDENCIA', {
    NIVEL_INCIDENCIA: 'Proyecto', CAMPANA_ID: idCampanaSantJordi, PROYECTO_ID: idProyectoSantJordi,
    TITULO: 'Stock de cartulina por debajo del mínimo',
    DESCRIPCION: 'El stock de cartulina reciclada bajó del mínimo antes de terminar la tirada de postales.',
    TIPO: 'Material', PRIORIDAD: 'Media', RESPONSABLE_ID: idResponsableManipulados,
    FECHA_DETECCION: '2026-03-08', ESTADO: 'Resuelta',
    ACCION_CORRECTORA: 'Pedido urgente al proveedor habitual.',
    FECHA_RESOLUCION: '2026-03-10'
  });

  crear_('DECISION', {
    PROYECTO_ID: idProyectoSantJordi, TITULO: 'Aumentar la tirada de postales de 200 a 248 unidades',
    CONTEXTO: 'La demanda estimada superó la previsión inicial de 200 unidades.',
    TIPO: 'Producción', RESPONSABLE_ID: idCoordinadora, FECHA_LIMITE: '2026-03-05',
    ESTADO: 'Aprobada', IMPACTO: 'Medio',
    RESOLUCION: 'Se aprueba aumentar la tirada a 248 unidades.', FECHA_RESOLUCION: '2026-03-04'
  });
  crear_('DECISION', {
    PROYECTO_ID: idProyectoNavidad, TITULO: 'Definir diseño del calendario de Adviento 2026',
    CONTEXTO: 'Pendiente de decidir si se reutiliza el diseño de 2025 o se hace uno nuevo.',
    TIPO: 'Técnica', RESPONSABLE_ID: idDisenadora, FECHA_LIMITE: '2026-09-15',
    ESTADO: 'Pendiente de consenso', IMPACTO: 'Bajo'
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/**
 * completarDatosPruebaPilotoIncidenciasDecisiones() creó las 2
 * incidencias (INC-0017/INC-0018) pero falló en la primera decisión:
 * DECISION valida que FECHA_RESOLUCION no sea anterior a la fecha de
 * creación REAL del registro (hoy), y la fecha retroactiva de marzo que
 * usé para simular una decisión histórica viola esa regla (no aplica a
 * INCIDENCIA, que compara contra FECHA_DETECCION -- un campo propio del
 * formulario, no la fecha de creación del registro). Esta función solo
 * crea las 2 decisiones que faltan, con la fecha de resolución de la
 * primera ajustada a hoy.
 */
function completarDatosPruebaPilotoDecisiones() {
  var packageName = 'COMPLETAR_DATOS_PRUEBA_PILOTO_DECISIONES';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  var idProyectoSantJordi = 'PRO-0006';
  var idProyectoNavidad = 'PRO-0007';
  var idCoordinadora = 'PER-0006';
  var idDisenadora = 'PER-0007';

  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id + ' titulo=' + (datos.TITULO || ''));
  }

  crear_('DECISION', {
    PROYECTO_ID: idProyectoSantJordi, TITULO: 'Aumentar la tirada de postales de 200 a 248 unidades',
    CONTEXTO: 'La demanda estimada superó la previsión inicial de 200 unidades.',
    TIPO: 'Producción', RESPONSABLE_ID: idCoordinadora, FECHA_LIMITE: '2026-08-02',
    ESTADO: 'Aprobada', IMPACTO: 'Medio',
    RESOLUCION: 'Se aprueba aumentar la tirada a 248 unidades.', FECHA_RESOLUCION: '2026-08-02'
  });
  crear_('DECISION', {
    PROYECTO_ID: idProyectoNavidad, TITULO: 'Definir diseño del calendario de Adviento 2026',
    CONTEXTO: 'Pendiente de decidir si se reutiliza el diseño de 2025 o se hace uno nuevo.',
    TIPO: 'Técnica', RESPONSABLE_ID: idDisenadora, FECHA_LIMITE: '2026-09-15',
    ESTADO: 'Pendiente de consenso', IMPACTO: 'Bajo'
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/**
 * Tercera campaña simulada (Carnestoltes 2026), estructura real de
 * Planning 2024 (Disseny/Pre Producció/Producció/Post Producció),
 * completada y mayoritariamente a tiempo -- a diferencia de Sant Jordi
 * 2026, para que la comparación "procesos por campaña" del informe de
 * Desviación tenga más de un caso real que comparar. Reutiliza las
 * personas ya creadas por instalarDatosPruebaPiloto() (PER-0004,
 * PER-0006, PER-0007). Ejecutar una única vez, manualmente.
 */
function instalarCampanaCarnestoltesPruebaPiloto() {
  var packageName = 'INSTALAR_CAMPANA_CARNESTOLTES_PRUEBA_PILOTO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  var idResponsableManipulados = 'PER-0004';
  var idCoordinadora = 'PER-0006';
  var idDisenadora = 'PER-0007';

  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id + ' nombre=' + (datos.NOMBRE || ''));
    return resultado.id;
  }

  var idCampana = crear_('CAMPANA', {
    NOMBRE: 'Carnestoltes 2026', DESCRIPCION: 'Producción de temporada de Carnaval',
    FECHA_INICIO_PLAN: '2026-01-19', FECHA_FIN_PLAN: '2026-02-17', ESTADO: 'Completada',
    OBJETIVO: 'Producir artículos de Carnaval', RESULTADO_ESPERADO: 'Stock listo para la temporada de Carnaval'
  });

  var idProyecto = crear_('PROYECTO', {
    CAMPANA_ID: idCampana, NOMBRE: 'Producción Carnestoltes 2026',
    TIPO_PROYECTO: 'Producción propia / stock', PRIORIDAD: 'Media',
    RESPONSABLE_ID: idCoordinadora,
    FECHA_INICIO_PLAN: '2026-01-19', FECHA_FIN_PLAN: '2026-01-30',
    FECHA_INICIO_REAL: '2026-01-19', FECHA_FIN_REAL: '2026-01-30',
    ESTADO: 'Completado',
    OBJETIVO: 'Fabricar el stock de temporada de Carnaval',
    RESULTADO_ESPERADO: 'Caretas listas para la temporada'
  });

  var idProducto = crear_('PRODUCTO', {
    NOMBRE: 'Careta de Carnaval', ORIGEN: 'Producción propia', UNIDAD: 'Unidad',
    CANTIDAD_PREVISTA: 400, FECHA_REQUERIDA: '2026-01-30', PRIORIDAD: 'Media',
    CODIGO: 'PRD-CARN-CARETA', PROYECTO_VINCULAR_ID: idProyecto,
    RESPONSABLE_ID: idResponsableManipulados, ESTADO: 'Completado'
  });

  var idPreprod = crear_('PROCESO', {
    PRODUCTO_ID: idProducto, NOMBRE: 'Preproducción careta', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 2, DURACION_REAL_DIAS: 2, RESPONSABLE_ID: idDisenadora,
    FECHA_INICIO_PLAN: '2026-01-19', FECHA_FIN_PLAN: '2026-01-21',
    FECHA_INICIO_REAL: '2026-01-19', FECHA_FIN_REAL: '2026-01-21',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Preproducción'
  });
  var idProd = crear_('PROCESO', {
    PRODUCTO_ID: idProducto, NOMBRE: 'Producción careta', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 6, DURACION_REAL_DIAS: 7, RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-01-22', FECHA_FIN_PLAN: '2026-01-28',
    FECHA_INICIO_REAL: '2026-01-22', FECHA_FIN_REAL: '2026-01-29',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Producción'
  });
  var idPostprod = crear_('PROCESO', {
    PRODUCTO_ID: idProducto, NOMBRE: 'Postproducción careta', ORDEN_SECUENCIA: 3,
    DURACION_PREVISTA_DIAS: 1, DURACION_REAL_DIAS: 1, RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO_PLAN: '2026-01-29', FECHA_FIN_PLAN: '2026-01-30',
    FECHA_INICIO_REAL: '2026-01-29', FECHA_FIN_REAL: '2026-01-30',
    METODO_CALCULO_AVANCE: 'Manual', ESTADO: 'Completado', FASE_PRODUCCION: 'Postproducción'
  });

  crear_('TAREA', {
    PROCESO_ID: idPreprod, NOMBRE: 'Diseño de plantilla', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1, DURACION_REAL_DIAS: 1,
    FECHA_INICIO_PLAN: '2026-01-19', FECHA_FIN_PLAN: '2026-01-19',
    FECHA_INICIO_REAL: '2026-01-19', FECHA_FIN_REAL: '2026-01-19', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idPreprod, NOMBRE: 'Preparación de materiales', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 1, DURACION_REAL_DIAS: 1,
    FECHA_INICIO_PLAN: '2026-01-20', FECHA_FIN_PLAN: '2026-01-21',
    FECHA_INICIO_REAL: '2026-01-20', FECHA_FIN_REAL: '2026-01-21', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idProd, NOMBRE: 'Corte y estampado', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 3, DURACION_REAL_DIAS: 4,
    FECHA_INICIO_PLAN: '2026-01-22', FECHA_FIN_PLAN: '2026-01-24',
    FECHA_INICIO_REAL: '2026-01-22', FECHA_FIN_REAL: '2026-01-25', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idProd, NOMBRE: 'Montaje y pintado', ORDEN_SECUENCIA: 2,
    DURACION_PREVISTA_DIAS: 3, DURACION_REAL_DIAS: 3,
    FECHA_INICIO_PLAN: '2026-01-25', FECHA_FIN_PLAN: '2026-01-28',
    FECHA_INICIO_REAL: '2026-01-26', FECHA_FIN_REAL: '2026-01-29', ESTADO: 'Terminada'
  });
  crear_('TAREA', {
    PROCESO_ID: idPostprod, NOMBRE: 'Control de calidad y embalaje', ORDEN_SECUENCIA: 1,
    DURACION_PREVISTA_DIAS: 1, DURACION_REAL_DIAS: 1,
    FECHA_INICIO_PLAN: '2026-01-29', FECHA_FIN_PLAN: '2026-01-30',
    FECHA_INICIO_REAL: '2026-01-29', FECHA_FIN_REAL: '2026-01-30', ESTADO: 'Terminada'
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}
