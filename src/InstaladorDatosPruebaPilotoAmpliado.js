/**
 * Ampliacion de los datos de prueba del piloto (instalarDatosPruebaPiloto,
 * instalarCampanaCarnestoltesPruebaPiloto) a mecanismos del sistema que
 * hasta ahora no se habian ejercitado con ningun dato real: equipos,
 * asignacion de tareas, uso de recursos, tipos de proyecto no probados,
 * documentos, vinculos y el ciclo completo proveedor -> pedido ->
 * recepcion -> consumo.
 *
 * Dividido en 5 funciones independientes (una por lote) para poder
 * ejecutar y verificar cada una por separado, en vez de una unica
 * funcion larga donde un fallo a mitad de camino sea dificil de aislar.
 * Reutiliza guardarFormulario (misma validacion real que la UI) salvo
 * donde el flujo real pasa por una funcion de negocio propia
 * (confirmarRecepcion_, igual que haria un humano desde el menu).
 *
 * IDs de referencia (ya verificados en el spreadsheet real):
 *   Personas: PER-0004 Responsable Manipulados, PER-0005 Responsable
 *     Carpinteria, PER-0006 Coordinadora, PER-0007 Disenadora,
 *     PER-0008 Voluntariado.
 *   Materiales: MAT-0007 Cartulina reciclada A5.
 *   Proveedor: PRV-0006.
 *   Recursos: REC-0007 Maquina troqueladora.
 *   Campanas: CAM-0014 Sant Jordi 2026, CAM-0015 Navidad 2026,
 *     CAM-0016 Carnestoltes 2026.
 *   Incidencia: INC-0017 averia troqueladora, INC-0018 stock cartulina.
 *   Decision: DEC-0004 aumentar tirada.
 *   Producto: PRD-0008 Postal corazon Sant Jordi.
 */

// ---------------------------------------------------------------------
// Lote 1: equipo/miembros + tarea_responsable + tarea_recurso
// ---------------------------------------------------------------------
function instalarAmpliacion1EquiposYAsignaciones() {
  var packageName = 'INSTALAR_AMPLIACION_1_EQUIPOS_Y_ASIGNACIONES';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  var idResponsableManipulados = 'PER-0004';
  var idResponsableCarpinteria = 'PER-0005';
  var idCoordinadora = 'PER-0006';
  var idDisenadora = 'PER-0007';
  var idVoluntariado = 'PER-0008';

  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id);
    return resultado.id;
  }

  // Equipo real, con dos miembros de los ya creados.
  var idEquipo = crear_('PERSONA_EQUIPO', {
    TIPO: 'Equipo', NOMBRE: 'Equipo de Manipulados', ROL: 'Producción',
    CAPACIDAD_SEMANAL_DIAS: 5, DISPONIBILIDAD: 'Completa', ESTADO: 'Disponible',
    COORDINADOR_ID: idCoordinadora
  });
  crear_('EQUIPO_MIEMBRO', {
    EQUIPO_ID: idEquipo, MIEMBRO_ID: idResponsableManipulados,
    ROL_EN_EQUIPO: 'Responsable de producción', FECHA_ALTA: '2026-01-01', ESTADO: 'Activa'
  });
  crear_('EQUIPO_MIEMBRO', {
    EQUIPO_ID: idEquipo, MIEMBRO_ID: idVoluntariado,
    ROL_EN_EQUIPO: 'Apoyo en producción', FECHA_ALTA: '2026-01-01', ESTADO: 'Activa'
  });

  // TAREA_RESPONSABLE para las 21 tareas ya sembradas (mismo responsable
  // que su proceso), cerrando el hueco "(sin RESPONSABLE_ID)" visto en
  // el informe de Desviacion.
  var tareas = [
    // Sant Jordi -- postal (terminadas)
    { id: 'TAR-0009', persona: idDisenadora, terminada: true },
    { id: 'TAR-0010', persona: idDisenadora, terminada: true },
    { id: 'TAR-0011', persona: idResponsableManipulados, terminada: true },
    { id: 'TAR-0012', persona: idResponsableManipulados, terminada: true },
    { id: 'TAR-0013', persona: idResponsableManipulados, terminada: true },
    // Sant Jordi -- puntos de libro (terminadas)
    { id: 'TAR-0014', persona: idDisenadora, terminada: true },
    { id: 'TAR-0015', persona: idDisenadora, terminada: true },
    { id: 'TAR-0016', persona: idResponsableManipulados, terminada: true },
    { id: 'TAR-0017', persona: idResponsableManipulados, terminada: true },
    { id: 'TAR-0018', persona: idResponsableManipulados, terminada: true },
    // Navidad -- calendario (pendientes)
    { id: 'TAR-0019', persona: idDisenadora, terminada: false },
    { id: 'TAR-0020', persona: idResponsableCarpinteria, terminada: false },
    { id: 'TAR-0021', persona: idResponsableCarpinteria, terminada: false },
    // Navidad -- postal (pendientes)
    { id: 'TAR-0022', persona: idDisenadora, terminada: false },
    { id: 'TAR-0023', persona: idResponsableManipulados, terminada: false },
    { id: 'TAR-0024', persona: idResponsableManipulados, terminada: false },
    // Carnestoltes -- careta (terminadas)
    { id: 'TAR-0025', persona: idDisenadora, terminada: true },
    { id: 'TAR-0026', persona: idDisenadora, terminada: true },
    { id: 'TAR-0027', persona: idResponsableManipulados, terminada: true },
    { id: 'TAR-0028', persona: idResponsableManipulados, terminada: true },
    { id: 'TAR-0029', persona: idResponsableManipulados, terminada: true }
  ];

  tareas.forEach(function (t) {
    var tarea = obtenerRegistroPorId('TAREA', t.id);
    crear_('TAREA_RESPONSABLE', {
      TAREA_ID: t.id, PERSONA_EQUIPO_ID: t.persona, ROL_ASIGNADO: 'Ejecutor',
      FECHA_INICIO_ASIGNACION: tarea.FECHA_INICIO_PLAN, FECHA_FIN_ASIGNACION: tarea.FECHA_FIN_PLAN,
      PORCENTAJE_DEDICACION: 100, ESTADO: t.terminada ? 'Completada' : 'Planificada'
    });
  });

  // Uso de la troqueladora en el corte de la postal (coincide con la
  // averia registrada en INC-0017).
  crear_('TAREA_RECURSO', {
    TAREA_ID: 'TAR-0011', RECURSO_ID: 'REC-0007', TIPO_USO: 'Utiliza',
    FECHA_INICIO: '2026-03-06', FECHA_FIN: '2026-03-12', ESTADO: 'Activa'
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

// ---------------------------------------------------------------------
// Lote 2: proyectos adicionales (tipos de TIPO_PROYECTO no probados)
// ---------------------------------------------------------------------
function instalarAmpliacion2Proyectos() {
  var packageName = 'INSTALAR_AMPLIACION_2_PROYECTOS';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  var idCoordinadora = 'PER-0006';

  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id + ' nombre=' + datos.NOMBRE);
    return resultado.id;
  }

  crear_('PROYECTO', {
    CAMPANA_ID: 'CAM-0014', NOMBRE: 'Encargo Editorial Local: postales personalizadas',
    TIPO_PROYECTO: 'Encargo de cliente', PRIORIDAD: 'Alta', RESPONSABLE_ID: idCoordinadora,
    FECHA_INICIO_PLAN: '2026-03-01', FECHA_FIN_PLAN: '2026-03-20',
    FECHA_INICIO_REAL: '2026-03-01', FECHA_FIN_REAL: '2026-03-20', ESTADO: 'Completado',
    OBJETIVO: 'Producir un encargo de postales personalizadas para una editorial local',
    RESULTADO_ESPERADO: 'Entrega a tiempo del encargo'
  });

  crear_('PROYECTO', {
    CAMPANA_ID: 'CAM-0016', NOMBRE: 'Taller formativo de manipulados para voluntariado',
    TIPO_PROYECTO: 'Proyecto formativo', PRIORIDAD: 'Media', RESPONSABLE_ID: idCoordinadora,
    FECHA_INICIO_PLAN: '2026-01-19', FECHA_FIN_PLAN: '2026-01-30',
    FECHA_INICIO_REAL: '2026-01-19', FECHA_FIN_REAL: '2026-01-30', ESTADO: 'Completado',
    OBJETIVO: 'Formar al voluntariado en técnicas básicas de manipulados',
    RESULTADO_ESPERADO: 'Voluntariado capacitado para apoyar en producción'
  });

  crear_('PROYECTO', {
    CAMPANA_ID: 'CAM-0015', NOMBRE: 'Recogida solidaria de juguetes navideños',
    TIPO_PROYECTO: 'Colaboración social', PRIORIDAD: 'Media', RESPONSABLE_ID: idCoordinadora,
    FECHA_INICIO_PLAN: '2026-12-01', FECHA_FIN_PLAN: '2026-12-20', ESTADO: 'Planificado',
    OBJETIVO: 'Organizar una recogida solidaria de juguetes en colaboración con otras entidades',
    RESULTADO_ESPERADO: 'Juguetes recogidos y distribuidos antes de Navidad'
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

// ---------------------------------------------------------------------
// Lote 3: documentos + vinculos
// ---------------------------------------------------------------------
function instalarAmpliacion3DocumentosYVinculos() {
  var packageName = 'INSTALAR_AMPLIACION_3_DOCUMENTOS_Y_VINCULOS';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();

  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id + ' titulo=' + (datos.TITULO || ''));
    return resultado.id;
  }

  var idDocFicha = crear_('DOCUMENTO', {
    ENTIDAD_TIPO: 'Producto', ENTIDAD_ID: 'PRD-0008',
    TIPO_DOCUMENTO: 'Ficha técnica', TITULO: 'Ficha técnica: Postal corazón Sant Jordi',
    URL: 'https://drive.google.com/placeholder-ficha-tecnica-postal',
    ESTADO: 'Vigente', FECHA_DOCUMENTO: '2026-03-01'
  });

  var idDocActa = crear_('DOCUMENTO', {
    ENTIDAD_TIPO: 'Decisión', ENTIDAD_ID: 'DEC-0004',
    TIPO_DOCUMENTO: 'Acta', TITULO: 'Acta de decisión: aumento de tirada de postales',
    URL: 'https://drive.google.com/placeholder-acta-decision-tirada',
    ESTADO: 'Vigente', FECHA_DOCUMENTO: '2026-03-04'
  });

  var idDocEvidencia = crear_('DOCUMENTO', {
    ENTIDAD_TIPO: 'Incidencia', ENTIDAD_ID: 'INC-0017',
    TIPO_DOCUMENTO: 'Evidencia', TITULO: 'Evidencia: avería de la troqueladora',
    URL: 'https://drive.google.com/placeholder-evidencia-averia',
    ESTADO: 'Vigente', FECHA_DOCUMENTO: '2026-03-14'
  });

  crear_('VINCULO', {
    ENTIDAD_ORIGEN_TIPO: 'Incidencia', ENTIDAD_ORIGEN_ID: 'INC-0017',
    ENTIDAD_DESTINO_TIPO: 'Documento', ENTIDAD_DESTINO_ID: idDocEvidencia,
    TIPO_VINCULO: 'Evidencia', ESTADO: 'Activa'
  });

  crear_('VINCULO', {
    ENTIDAD_ORIGEN_TIPO: 'Decisión', ENTIDAD_ORIGEN_ID: 'DEC-0004',
    ENTIDAD_DESTINO_TIPO: 'Documento', ENTIDAD_DESTINO_ID: idDocActa,
    TIPO_VINCULO: 'Acta', ESTADO: 'Activa'
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

// ---------------------------------------------------------------------
// Lote 4: ciclo proveedor completo (pedido -> recepcion -> consumo)
// ---------------------------------------------------------------------
function instalarAmpliacion4CicloProveedor() {
  var packageName = 'INSTALAR_AMPLIACION_4_CICLO_PROVEEDOR';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  var idProveedor = 'PRV-0006';
  var idCartulina = 'MAT-0007';
  var idResponsableManipulados = 'PER-0004';

  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id);
    return resultado.id;
  }

  crear_('PROVEEDOR_MATERIAL', {
    PROVEEDOR_ID: idProveedor, MATERIAL_ID: idCartulina,
    PRECIO_UNITARIO: 0.15, PLAZO_ENTREGA_DIAS: 5, ES_PREFERENTE: 'SÍ', ESTADO: 'Activa'
  });

  // Pedido urgente que resuelve INC-0018 (stock de cartulina bajo minimo).
  var idPedido = crear_('PEDIDO_PROVEEDOR', {
    PROVEEDOR_ID: idProveedor, FECHA_PEDIDO: '2026-03-08', ESTADO: 'Borrador'
  });
  crear_('PEDIDO_PROVEEDOR_LINEA', {
    PEDIDO_PROVEEDOR_ID: idPedido, MATERIAL_ID: idCartulina,
    CANTIDAD_PEDIDA: 500, PRECIO_UNITARIO: 0.15, UNIDAD: 'Unidad', ESTADO: 'Activa'
  });

  var idRecepcion = crear_('RECEPCION', {
    PEDIDO_PROVEEDOR_ID: idPedido, FECHA_RECEPCION: '2026-03-10',
    RESPONSABLE_ID: idResponsableManipulados, ESTADO: 'Borrador'
  });
  crear_('RECEPCION_LINEA', {
    RECEPCION_ID: idRecepcion, MATERIAL_ID: idCartulina,
    CANTIDAD_RECIBIDA: 500, UNIDAD: 'Unidad', ESTADO: 'Activa'
  });

  // Confirmar de verdad (misma funcion que usa el menu "Confirmar
  // recepción") -- genera el MOVIMIENTO_MATERIAL de Entrada y actualiza
  // el estado de RECEPCION y PEDIDO_PROVEEDOR.
  var resultadoConfirmacion = confirmarRecepcion_(idRecepcion, true);
  console.log('OK recepcion_confirmada=' + idRecepcion + ' lineas=' + resultadoConfirmacion.numLineas);

  // Consumo real durante la producción de la postal (no lo genera
  // ningún mecanismo automático todavía -- se registra a mano, igual
  // que haría un humano desde "Nuevo movimiento de material").
  crear_('MOVIMIENTO_MATERIAL', {
    MATERIAL_ID: idCartulina, TAREA_ID: 'TAR-0011', TIPO_MOVIMIENTO: 'Consumo',
    CANTIDAD: 248, UNIDAD: 'Unidad', FECHA_MOVIMIENTO: '2026-03-12',
    RESPONSABLE_ID: idResponsableManipulados,
    OBSERVACIONES: 'Consumo de cartulina en el corte y estampado de la postal de Sant Jordi.'
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

// ---------------------------------------------------------------------
// Lote 5: ejecucion_tarea
// ---------------------------------------------------------------------
function instalarAmpliacion5EjecucionTarea() {
  var packageName = 'INSTALAR_AMPLIACION_5_EJECUCION_TAREA';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  var idResponsableManipulados = 'PER-0004';

  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id);
    return resultado.id;
  }

  crear_('EJECUCION_TAREA', {
    TAREA_ID: 'TAR-0011', RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO: '2026-03-06', FECHA_FIN: '2026-03-12', DURACION_REAL_DIAS: 6,
    ESTADO: 'Activa', RESULTADO: 'Con incidencias',
    OBSERVACIONES: 'Retraso por avería de la troqueladora (ver INC-0017).'
  });
  crear_('EJECUCION_TAREA', {
    TAREA_ID: 'TAR-0016', RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO: '2026-03-19', FECHA_FIN: '2026-03-22', DURACION_REAL_DIAS: 4,
    ESTADO: 'Activa', RESULTADO: 'Exitosa'
  });
  crear_('EJECUCION_TAREA', {
    TAREA_ID: 'TAR-0027', RESPONSABLE_ID: idResponsableManipulados,
    FECHA_INICIO: '2026-01-22', FECHA_FIN: '2026-01-25', DURACION_REAL_DIAS: 4,
    ESTADO: 'Activa', RESULTADO: 'Exitosa'
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}
