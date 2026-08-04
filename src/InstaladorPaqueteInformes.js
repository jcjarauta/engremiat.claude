/**
 * Paquete de datos para informes y exportaciones (ver conversacion --
 * "recorra todo el sheet necesario, datos de calidad y variados").
 *
 * Diagnostico previo (censo real de filas, no tamaño de grid): la
 * columna vertebral Campaña->Proyecto->Producto->Proceso ya es rica
 * (fechas plan/real, estados variados, hasta un caso real de retraso
 * con incidencia vinculada). Lo genuinamente delgado eran las hojas
 * relacionales que alimentan el Panel Operativo, los informes y las 3
 * fichas de registro nuevas (Espacio/Recurso, Proveedor, Material):
 * stock de materiales, PRODUCTO_MATERIAL, TAREA_RECURSO, el ciclo de
 * proveedor completo, PROVEEDOR_MATERIAL, DECISION, ASIGNACION,
 * RELACION, EQUIPO_MIEMBRO y documentos/vinculos sobre Recurso.
 *
 * Cada bloque es idempotente (comprueba antes de crear) y se puede
 * ejecutar suelto o via el orquestador instalarPaqueteDatosInformes().
 * Usa actualizarRegistroTransaccional (no guardarFormulario) para
 * actualizar filas YA EXISTENTES -- guardarFormulario reenvia el
 * esquema completo del formulario y sobrescribiria a vacio cualquier
 * campo no incluido en el objeto pasado.
 */

/* ---------- A. Stock de materiales ---------- */
function instalarStockMateriales() {
  var packageName = 'INSTALAR_STOCK_MATERIALES';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  var correlationId = Utilities.getUuid();

  // [id, STOCK_ACTUAL, STOCK_MINIMO, CANTIDAD_RESERVADA, PROVEEDOR_ID]
  var datos = [
    ['MAT-0004', 45, 10, 5, 'PRV-0006'],   // Barniz -- sano
    ['MAT-0005', 8, 15, 0, 'PRV-0005'],    // Papel A4 -- stock bajo
    ['MAT-0006', 0, 5, 0, 'PRV-0006'],     // Tablero roble -- agotado
    ['MAT-0007', 350, 100, 713, 'PRV-0005'], // Cartulina -- reservas superan stock
    ['MAT-0008', 400, 100, 1212, 'PRV-0005'], // Cordón yute -- reservas superan stock
    ['MAT-0009', 12, 20, 0, 'PRV-0006'],   // Contrachapado -- stock bajo
    ['MAT-0010', 3, 5, 0, 'PRV-0006'],     // Pintura acrílica -- stock bajo
    ['MAT-0011', 25, 5, 3, 'PRV-0006'],    // Cola blanca -- sano
    ['MAT-0012', 620, 100, 500, 'PRV-0005'] // Caja cartón -- sano
  ];

  var actualizados = 0;
  datos.forEach(function (fila) {
    var id = fila[0];
    var actual = obtenerRegistroPorId('MATERIAL', id);
    if (!actual) { console.log('OMITIDO no_existe id=' + id); return; }
    if (actual.STOCK_ACTUAL !== '' && actual.STOCK_ACTUAL !== undefined && actual.STOCK_ACTUAL !== null) {
      console.log('OK ya_tiene_stock id=' + id);
      return;
    }
    actualizarRegistroTransaccional('MATERIAL', id, {
      STOCK_ACTUAL: fila[1], STOCK_MINIMO: fila[2], CANTIDAD_RESERVADA: fila[3], PROVEEDOR_ID: fila[4]
    }, { origen: 'SCRIPT', correlationId: correlationId });
    actualizados++;
    console.log('OK actualizado id=' + id);
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK actualizados=' + actualizados);
  return true;
}

/* ---------- B. Producto-Material ampliado ---------- */
function instalarProductoMaterialAmpliado() {
  var packageName = 'INSTALAR_PRODUCTO_MATERIAL_AMPLIADO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  var correlationId = Utilities.getUuid();

  var existentes = listarRegistros('PRODUCTO_MATERIAL', { ACTIVO: 'SÍ' });
  function yaExiste(productoId, materialId) {
    return existentes.some(function (pm) { return pm.PRODUCTO_ID === productoId && pm.MATERIAL_ID === materialId; });
  }

  /*
   * UNIDAD debe coincidir exactamente con la del MATERIAL referenciado
   * (regla de negocio real, ver Repository_InsertarRegistro.js) -- no
   * se puede fijar 'Unidad' a ciegas, se resuelve por material.
   */
  var unidadesPorMaterial = {};
  listarRegistros('MATERIAL', {}).forEach(function (m) { unidadesPorMaterial[m.ID] = m.UNIDAD; });

  // [PRODUCTO_ID, MATERIAL_ID, CANTIDAD_PREVISTA]
  var lineas = [
    ['PRD-0007', 'MAT-0006', 2],    // Mesa infantil -- tablero roble
    ['PRD-0007', 'MAT-0011', 1],    // Mesa infantil -- cola blanca
    ['PRD-0008', 'MAT-0007', 248],  // Postal Sant Jordi -- cartulina
    ['PRD-0009', 'MAT-0007', 1212], // Puntos de libro -- cartulina
    ['PRD-0009', 'MAT-0008', 1212], // Puntos de libro -- cordón yute
    ['PRD-0010', 'MAT-0007', 1020], // Calendario Adviento -- cartulina
    ['PRD-0011', 'MAT-0007', 713],  // Postal Navidad -- cartulina
    ['PRD-0012', 'MAT-0007', 400],  // Careta Carnaval -- cartulina
    ['PRD-0015', 'MAT-0006', 10],   // Banco/jardinera -- tablero roble
    ['PRD-0015', 'MAT-0004', 3],    // Banco/jardinera -- barniz
    ['PRD-0016', 'MAT-0012', 500],  // Packaging -- caja cartón
    ['PRD-0019', 'MAT-0009', 300]   // Estrella cartón -- contrachapado
  ];

  var creadas = 0;
  lineas.forEach(function (fila) {
    if (yaExiste(fila[0], fila[1])) { return; }
    var resultado = guardarFormulario('PRODUCTO_MATERIAL', null, {
      PRODUCTO_ID: fila[0], MATERIAL_ID: fila[1], CANTIDAD_PREVISTA: fila[2], UNIDAD: unidadesPorMaterial[fila[1]] || 'Unidad', ESTADO: 'Activa'
    }, correlationId);
    creadas++;
    console.log('OK creado id=' + resultado.id + ' producto=' + fila[0] + ' material=' + fila[1]);
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK creadas=' + creadas);
  return true;
}

/* ---------- C. Tarea-Recurso ampliado ---------- */
function instalarTareaRecursoAmpliado() {
  var packageName = 'INSTALAR_TAREA_RECURSO_AMPLIADO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  var correlationId = Utilities.getUuid();

  var existentes = listarRegistros('TAREA_RECURSO', { ACTIVO: 'SÍ' });
  function yaExiste(tareaId, recursoId) {
    return existentes.some(function (tr) { return tr.TAREA_ID === tareaId && tr.RECURSO_ID === recursoId; });
  }

  // [TAREA_ID, RECURSO_ID, TIPO_USO]
  var asignaciones = [
    ['TAR-0009', 'REC-0004', 'Utiliza'], ['TAR-0010', 'REC-0004', 'Utiliza'],
    ['TAR-0011', 'REC-0007', 'Utiliza'], ['TAR-0012', 'REC-0007', 'Utiliza'],
    ['TAR-0013', 'REC-0004', 'Ocupa'],
    ['TAR-0014', 'REC-0004', 'Utiliza'], ['TAR-0015', 'REC-0004', 'Utiliza'],
    ['TAR-0016', 'REC-0007', 'Utiliza'], ['TAR-0017', 'REC-0007', 'Utiliza'],
    ['TAR-0018', 'REC-0004', 'Ocupa'],
    ['TAR-0019', 'REC-0004', 'Reserva'],
    ['TAR-0020', 'REC-0007', 'Reserva'],
    ['TAR-0021', 'REC-0004', 'Reserva'],
    ['TAR-0022', 'REC-0004', 'Reserva'],
    ['TAR-0023', 'REC-0007', 'Reserva'],
    ['TAR-0024', 'REC-0004', 'Reserva'],
    ['TAR-0030', 'REC-0009', 'Utiliza'], ['TAR-0031', 'REC-0009', 'Utiliza'],
    ['TAR-0032', 'REC-0009', 'Ocupa'], ['TAR-0033', 'REC-0009', 'Ocupa'],
    ['TAR-0034', 'REC-0009', 'Reserva'], ['TAR-0035', 'REC-0009', 'Reserva'],
    ['TAR-0036', 'REC-0005', 'Reserva'],
    ['TAR-0037', 'REC-0005', 'Reserva'], ['TAR-0037', 'REC-0002', 'Reserva'],
    ['TAR-0038', 'REC-0005', 'Reserva'],
    ['TAR-0039', 'REC-0005', 'Reserva'],
    ['TAR-0043', 'REC-0011', 'Ocupa'], ['TAR-0044', 'REC-0011', 'Ocupa'],
    ['TAR-0048', 'REC-0005', 'Utiliza'],
    ['TAR-0049', 'REC-0006', 'Utiliza'],
    ['TAR-0050', 'REC-0009', 'Utiliza'],
    ['TAR-0051', 'REC-0004', 'Reserva'],
    ['TAR-0052', 'REC-0007', 'Reserva'],
    ['TAR-0053', 'REC-0004', 'Reserva']
  ];

  var procesosPorId = {};
  listarRegistros('PROCESO', {}).forEach(function (p) { procesosPorId[p.ID] = p; });
  var tareasPorId = {};
  listarRegistros('TAREA', {}).forEach(function (t) { tareasPorId[t.ID] = t; });

  function estadoParaProceso_(proceso) {
    if (!proceso) return 'Planificada';
    if (proceso.ESTADO === 'Completado') return 'Completada';
    if (proceso.ESTADO === 'En proceso') return 'Activa';
    return 'Planificada';
  }

  var creadas = 0;
  asignaciones.forEach(function (fila) {
    var tareaId = fila[0], recursoId = fila[1], tipoUso = fila[2];
    if (yaExiste(tareaId, recursoId)) { return; }
    var tarea = tareasPorId[tareaId];
    var proceso = tarea ? procesosPorId[tarea.PROCESO_ID] : null;
    var resultado = guardarFormulario('TAREA_RECURSO', null, {
      TAREA_ID: tareaId, RECURSO_ID: recursoId, TIPO_USO: tipoUso,
      FECHA_INICIO: proceso ? proceso.FECHA_INICIO_PLAN : '',
      FECHA_FIN: proceso ? proceso.FECHA_FIN_PLAN : '',
      ESTADO: estadoParaProceso_(proceso)
    }, correlationId);
    creadas++;
    console.log('OK creado id=' + resultado.id + ' tarea=' + tareaId + ' recurso=' + recursoId);
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK creadas=' + creadas);
  return true;
}

/* ---------- D. Ciclo proveedor ampliado ---------- */
function instalarCicloProveedorAmpliado() {
  var packageName = 'INSTALAR_CICLO_PROVEEDOR_AMPLIADO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  var correlationId = Utilities.getUuid();

  /*
   * FECHA_PEDIDO vuelve como objeto Date (no como texto "yyyy-MM-dd"),
   * igual que ya vimos con HORA_INICIO/HORA_FIN -- comparar contra el
   * string original nunca coincidia, asi que la comprobacion de
   * idempotencia nunca detectaba lo ya creado y duplicaba en cada
   * reejecucion. Se normaliza a texto antes de comparar.
   */
  var pedidosExistentes = listarRegistros('PEDIDO_PROVEEDOR', { ACTIVO: 'SÍ' });
  function fechaComoTexto_(valor) {
    if (valor instanceof Date) {
      return Utilities.formatDate(valor, Session.getScriptTimeZone() || 'Europe/Madrid', 'yyyy-MM-dd');
    }
    return valor;
  }
  function pedidoYaExiste(proveedorId, fechaPedido) {
    return pedidosExistentes.some(function (p) { return p.PROVEEDOR_ID === proveedorId && fechaComoTexto_(p.FECHA_PEDIDO) === fechaPedido; });
  }

  function crearLinea_(pedidoId, materialId, cantidad, precio) {
    var resultado = guardarFormulario('PEDIDO_PROVEEDOR_LINEA', null, {
      PEDIDO_PROVEEDOR_ID: pedidoId, MATERIAL_ID: materialId, CANTIDAD_PEDIDA: cantidad, PRECIO_UNITARIO: precio, UNIDAD: 'Unidad', ESTADO: 'Activa'
    }, correlationId);
    console.log('OK linea_pedido id=' + resultado.id + ' pedido=' + pedidoId + ' material=' + materialId);
    return resultado.id;
  }

  function crearRecepcionLinea_(recepcionId, materialId, cantidad) {
    var resultado = guardarFormulario('RECEPCION_LINEA', null, {
      RECEPCION_ID: recepcionId, MATERIAL_ID: materialId, CANTIDAD_RECIBIDA: cantidad, UNIDAD: 'Unidad', ESTADO: 'Completada'
    }, correlationId);
    console.log('OK linea_recepcion id=' + resultado.id + ' recepcion=' + recepcionId + ' material=' + materialId);
    return resultado.id;
  }

  function crearMovimiento_(materialId, cantidad, fecha, responsableId) {
    var resultado = guardarFormulario('MOVIMIENTO_MATERIAL', null, {
      MATERIAL_ID: materialId, TIPO_MOVIMIENTO: 'Entrada', CANTIDAD: cantidad, UNIDAD: 'Unidad',
      FECHA_MOVIMIENTO: fecha, RESPONSABLE_ID: responsableId
    }, correlationId);
    console.log('OK movimiento id=' + resultado.id + ' material=' + materialId);
    return resultado.id;
  }

  // Ciclo 2: madera/pintura para Mobiliario, completo.
  if (!pedidoYaExiste('PRV-0006', '2026-08-01')) {
    var pedido2 = guardarFormulario('PEDIDO_PROVEEDOR', null, {
      PROVEEDOR_ID: 'PRV-0006', FECHA_PEDIDO: '2026-08-01', ESTADO: 'Recibido completo',
      OBSERVACIONES: 'Material para banco y jardinera de exterior'
    }, correlationId).id;
    crearLinea_(pedido2, 'MAT-0006', 15, 25);
    crearLinea_(pedido2, 'MAT-0004', 5, 8);
    var recepcion2 = guardarFormulario('RECEPCION', null, {
      PEDIDO_PROVEEDOR_ID: pedido2, FECHA_RECEPCION: '2026-08-05', RESPONSABLE_ID: 'PER-0005', ESTADO: 'Confirmada'
    }, correlationId).id;
    crearRecepcionLinea_(recepcion2, 'MAT-0006', 15);
    crearRecepcionLinea_(recepcion2, 'MAT-0004', 5);
    crearMovimiento_('MAT-0006', 15, '2026-08-05', 'PER-0005');
    crearMovimiento_('MAT-0004', 5, '2026-08-05', 'PER-0005');
  }

  // Ciclo 3: papelería para Sant Jordi, completo, historico (antes de la campaña).
  if (!pedidoYaExiste('PRV-0005', '2026-02-10')) {
    var pedido3 = guardarFormulario('PEDIDO_PROVEEDOR', null, {
      PROVEEDOR_ID: 'PRV-0005', FECHA_PEDIDO: '2026-02-10', ESTADO: 'Recibido completo',
      OBSERVACIONES: 'Papelería para producción de Sant Jordi'
    }, correlationId).id;
    crearLinea_(pedido3, 'MAT-0007', 2000, 0.15);
    crearLinea_(pedido3, 'MAT-0008', 1500, 0.05);
    var recepcion3 = guardarFormulario('RECEPCION', null, {
      PEDIDO_PROVEEDOR_ID: pedido3, FECHA_RECEPCION: '2026-02-15', RESPONSABLE_ID: 'PER-0004', ESTADO: 'Confirmada'
    }, correlationId).id;
    crearRecepcionLinea_(recepcion3, 'MAT-0007', 2000);
    crearRecepcionLinea_(recepcion3, 'MAT-0008', 1500);
    crearMovimiento_('MAT-0007', 2000, '2026-02-15', 'PER-0004');
    crearMovimiento_('MAT-0008', 1500, '2026-02-15', 'PER-0004');
  }

  // Ciclo 4: contrachapado para la estrella navideña, todavía en tránsito (sin recepción) -- variedad de estado.
  if (!pedidoYaExiste('PRV-0006', '2026-10-20')) {
    var pedido4 = guardarFormulario('PEDIDO_PROVEEDOR', null, {
      PROVEEDOR_ID: 'PRV-0006', FECHA_PEDIDO: '2026-10-20', ESTADO: 'Enviado',
      OBSERVACIONES: 'Contrachapado para la estrella de cartón navideña'
    }, correlationId).id;
    crearLinea_(pedido4, 'MAT-0009', 300, 1.2);
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/*
 * Limpieza puntual (ver conversacion): el bug de comparacion de fecha
 * en pedidoYaExiste (ya corregido arriba) dejo que una reejecucion
 * duplicara el ciclo 2 y el ciclo 3 completos (pedido+lineas+recepcion+
 * lineas+movimientos) y el pedido del ciclo 4. Desactiva especificamente
 * ese segundo lote (PED-0008/0009/0010 y sus hijos), dejando el primero
 * (PED-0005/0006/0007) como el real. Ejecutar UNA VEZ; no forma parte
 * del orquestador porque es una correccion de un error concreto, no un
 * paso repetible del paquete de datos.
 */
function instalarLimpiezaDuplicadosCicloProveedor() {
  var packageName = 'LIMPIEZA_DUPLICADOS_CICLO_PROVEEDOR';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  function desactivarSiActivo_(entidad, id) {
    var registro = obtenerRegistroPorId(entidad, id);
    if (!registro) { console.log('OMITIDO no_existe ' + entidad + ' id=' + id); return; }
    if (registro.ACTIVO === 'NO') { console.log('OK ya_inactivo ' + entidad + ' id=' + id); return; }
    desactivarRegistro(entidad, id);
    console.log('OK desactivado ' + entidad + ' id=' + id);
  }

  ['RCL-0007', 'RCL-0008', 'RCL-0009', 'RCL-0010'].forEach(function (id) { desactivarSiActivo_('RECEPCION_LINEA', id); });
  ['RCP-0007', 'RCP-0008'].forEach(function (id) { desactivarSiActivo_('RECEPCION', id); });
  ['PPL-0010', 'PPL-0011', 'PPL-0012', 'PPL-0013', 'PPL-0014'].forEach(function (id) { desactivarSiActivo_('PEDIDO_PROVEEDOR_LINEA', id); });
  ['PED-0008', 'PED-0009', 'PED-0010'].forEach(function (id) { desactivarSiActivo_('PEDIDO_PROVEEDOR', id); });
  ['MOV-0009', 'MOV-0010', 'MOV-0011', 'MOV-0012'].forEach(function (id) { desactivarSiActivo_('MOVIMIENTO_MATERIAL', id); });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/* ---------- E. Decisiones ampliado ---------- */
function instalarDecisionesAmpliado() {
  var packageName = 'INSTALAR_DECISIONES_AMPLIADO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  var correlationId = Utilities.getUuid();

  var existentes = listarRegistros('DECISION', { ACTIVO: 'SÍ' });
  function yaExiste(titulo) {
    return existentes.some(function (d) { return d.TITULO === titulo; });
  }

  /*
   * Contradiccion real entre reglas de negocio (ver
   * Repository_InsertarRegistro.js): FECHA_LIMITE y (si la decision ya
   * esta cerrada) FECHA_RESOLUCION no pueden ser anteriores a
   * FECHA_CREACION -- y FECHA_CREACION se fija al momento real de la
   * insercion (hoy), no a una fecha narrativa pasada. FECHA_RESOLUCION
   * es obligatoria en estados cerrados, asi que se fija a hoy; FECHA_LIMITE
   * es opcional, asi que se omite cuando la fecha narrativa cae en el
   * pasado (solo se conserva si ya era futura respecto a hoy).
   */
  var HOY_ = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Europe/Madrid', 'yyyy-MM-dd');

  var decisiones = [
    { PROYECTO_ID: 'PRO-0006', TITULO: 'Confirmar tirada definitiva de postales', TIPO: 'Producción', RESPONSABLE_ID: 'PER-0004', ESTADO: 'Aprobada', IMPACTO: 'Medio', RESOLUCION: 'Se confirma tirada de 248 unidades.', FECHA_RESOLUCION: HOY_ },
    { PROYECTO_ID: 'PRO-0007', TITULO: 'Elegir proveedor de contrachapado para la estrella', TIPO: 'Recursos', RESPONSABLE_ID: 'PER-0004', FECHA_LIMITE: '2026-10-15', ESTADO: 'Pendiente de aprobación', IMPACTO: 'Medio' },
    { PROYECTO_ID: 'PRO-0013', TITULO: 'Ampliar capacidad del horno de cocción', TIPO: 'Recursos', RESPONSABLE_ID: 'PER-0016', ESTADO: 'Rechazada', IMPACTO: 'Alto', RESOLUCION: 'Presupuesto insuficiente este trimestre.', FECHA_RESOLUCION: HOY_ },
    { PROYECTO_ID: 'PRO-0015', TITULO: 'Externalizar impresión de cajas de packaging', TIPO: 'Producción', RESPONSABLE_ID: 'PER-0004', ESTADO: 'Pendiente de aprobación', IMPACTO: 'Medio' },
    { PROYECTO_ID: 'PRO-0016', TITULO: 'Ampliar plazas de voluntariado del taller', TIPO: 'Organizativa', RESPONSABLE_ID: 'PER-0006', ESTADO: 'Aprobada', IMPACTO: 'Bajo', RESOLUCION: 'Se amplían 5 plazas más.', FECHA_RESOLUCION: HOY_ },
    { PROYECTO_ID: 'PRO-0017', TITULO: 'Sustituir estantería dañada de Carpintería', TIPO: 'Recursos', RESPONSABLE_ID: 'PER-0005', ESTADO: 'Aprobada', IMPACTO: 'Bajo', RESOLUCION: 'Comprada nueva estantería.', FECHA_RESOLUCION: HOY_ }
  ];

  var creadas = 0;
  decisiones.forEach(function (d) {
    if (yaExiste(d.TITULO)) { return; }
    var resultado = guardarFormulario('DECISION', null, d, correlationId);
    creadas++;
    console.log('OK creado id=' + resultado.id + ' titulo=' + d.TITULO);
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK creadas=' + creadas);
  return true;
}

/* ---------- F. Asignación + Relación ampliado ---------- */
function instalarAsignacionRelacionAmpliado() {
  var packageName = 'INSTALAR_ASIGNACION_RELACION_AMPLIADO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  var correlationId = Utilities.getUuid();

  var incidencias = listarRegistros('INCIDENCIA', { ACTIVO: 'SÍ' });
  var incidenciaRef = incidencias.length > 0 ? incidencias[0].ID : null;

  var asignacionesExistentes = listarRegistros('ASIGNACION', { ACTIVO: 'SÍ' });
  function asignacionYaExiste(entidadTipo, entidadId, personaId) {
    return asignacionesExistentes.some(function (a) {
      return a.ENTIDAD_TIPO === entidadTipo && a.ENTIDAD_ID === entidadId && a.PERSONA_EQUIPO_ID === personaId;
    });
  }

  var asignaciones = [
    { ENTIDAD_TIPO: 'Proyecto', ENTIDAD_ID: 'PRO-0013', PERSONA_EQUIPO_ID: 'PER-0016', ROL_ASIGNADO: 'Responsable', FECHA_INICIO_ASIGNACION: '2026-07-20', FECHA_FIN_ASIGNACION: '2026-08-08', PORCENTAJE_DEDICACION: 60, ESTADO: 'Activa' },
    { ENTIDAD_TIPO: 'Proyecto', ENTIDAD_ID: 'PRO-0007', PERSONA_EQUIPO_ID: 'PER-0006', ROL_ASIGNADO: 'Coordinador', PORCENTAJE_DEDICACION: 15, ESTADO: 'Planificada' },
    { ENTIDAD_TIPO: 'Proyecto', ENTIDAD_ID: 'PRO-0016', PERSONA_EQUIPO_ID: 'PER-0006', ROL_ASIGNADO: 'Supervisor', PORCENTAJE_DEDICACION: 10, ESTADO: 'Planificada' }
  ];
  if (incidenciaRef) {
    asignaciones.push({ ENTIDAD_TIPO: 'Incidencia', ENTIDAD_ID: incidenciaRef, PERSONA_EQUIPO_ID: 'PER-0005', ROL_ASIGNADO: 'Ejecutor', PORCENTAJE_DEDICACION: 20, ESTADO: 'Activa' });
  }

  var creadasAsignacion = 0;
  asignaciones.forEach(function (a) {
    if (asignacionYaExiste(a.ENTIDAD_TIPO, a.ENTIDAD_ID, a.PERSONA_EQUIPO_ID)) { return; }
    var resultado = guardarFormulario('ASIGNACION', null, a, correlationId);
    creadasAsignacion++;
    console.log('OK asignacion id=' + resultado.id + ' entidad=' + a.ENTIDAD_TIPO + ':' + a.ENTIDAD_ID);
  });

  var relacionesExistentes = listarRegistros('RELACION', { ACTIVO: 'SÍ' });
  function relacionYaExiste(origenId, destinoId) {
    return relacionesExistentes.some(function (r) { return r.ENTIDAD_ORIGEN_ID === origenId && r.ENTIDAD_DESTINO_ID === destinoId; });
  }

  var relaciones = [
    { ENTIDAD_TIPO: 'Proyecto', ENTIDAD_ORIGEN_ID: 'PRO-0009', ENTIDAD_DESTINO_ID: 'PRO-0006', TIPO_RELACION: 'Depende de', ESTADO: 'Activa' },
    { ENTIDAD_TIPO: 'Proyecto', ENTIDAD_ORIGEN_ID: 'PRO-0012', ENTIDAD_DESTINO_ID: 'PRO-0007', TIPO_RELACION: 'Depende de', ESTADO: 'Activa' },
    { ENTIDAD_TIPO: 'Producto', ENTIDAD_ORIGEN_ID: 'PRD-0015', ENTIDAD_DESTINO_ID: 'PRD-0007', TIPO_RELACION: 'Comparte recursos', ESTADO: 'Activa' }
  ];

  var creadasRelacion = 0;
  relaciones.forEach(function (r) {
    if (relacionYaExiste(r.ENTIDAD_ORIGEN_ID, r.ENTIDAD_DESTINO_ID)) { return; }
    var resultado = guardarFormulario('RELACION', null, r, correlationId);
    creadasRelacion++;
    console.log('OK relacion id=' + resultado.id + ' origen=' + r.ENTIDAD_ORIGEN_ID + ' destino=' + r.ENTIDAD_DESTINO_ID);
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK asignaciones=' + creadasAsignacion + ' relaciones=' + creadasRelacion);
  return true;
}

/* ---------- G. Equipo-Miembro ampliado ---------- */
function instalarEquipoMiembroAmpliado() {
  var packageName = 'INSTALAR_EQUIPO_MIEMBRO_AMPLIADO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  var correlationId = Utilities.getUuid();

  var existentes = listarRegistros('EQUIPO_MIEMBRO', { ACTIVO: 'SÍ' });
  function yaExiste(equipoId, miembroId) {
    return existentes.some(function (em) { return em.EQUIPO_ID === equipoId && em.MIEMBRO_ID === miembroId; });
  }

  var miembros = [
    { EQUIPO_ID: 'PER-0003', MIEMBRO_ID: 'PER-0005', ROL_EN_EQUIPO: 'Encargado', FECHA_ALTA: '2026-01-01' },
    { EQUIPO_ID: 'PER-0014', MIEMBRO_ID: 'PER-0004', ROL_EN_EQUIPO: 'Encargado', FECHA_ALTA: '2026-01-01' },
    { EQUIPO_ID: 'PER-0014', MIEMBRO_ID: 'PER-0015', ROL_EN_EQUIPO: 'Participante', FECHA_ALTA: '2026-01-01' },
    { EQUIPO_ID: 'PER-0018', MIEMBRO_ID: 'PER-0016', ROL_EN_EQUIPO: 'Encargado', FECHA_ALTA: '2026-07-01' },
    { EQUIPO_ID: 'PER-0018', MIEMBRO_ID: 'PER-0008', ROL_EN_EQUIPO: 'Voluntario', FECHA_ALTA: '2026-07-01' }
  ];

  var creadas = 0;
  miembros.forEach(function (m) {
    m.ESTADO = 'Activa';
    if (yaExiste(m.EQUIPO_ID, m.MIEMBRO_ID)) { return; }
    var resultado = guardarFormulario('EQUIPO_MIEMBRO', null, m, correlationId);
    creadas++;
    console.log('OK creado id=' + resultado.id + ' equipo=' + m.EQUIPO_ID + ' miembro=' + m.MIEMBRO_ID);
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK creadas=' + creadas);
  return true;
}

/* ---------- H. Proveedor-Material ampliado ---------- */
function instalarProveedorMaterialAmpliado() {
  var packageName = 'INSTALAR_PROVEEDOR_MATERIAL_AMPLIADO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  var correlationId = Utilities.getUuid();

  var existentes = listarRegistros('PROVEEDOR_MATERIAL', { ACTIVO: 'SÍ' });
  function yaExiste(proveedorId, materialId) {
    return existentes.some(function (pm) { return pm.PROVEEDOR_ID === proveedorId && pm.MATERIAL_ID === materialId; });
  }

  // [PROVEEDOR_ID, MATERIAL_ID, PRECIO_UNITARIO, PLAZO_ENTREGA_DIAS, ES_PREFERENTE]
  var lineas = [
    // PRV-0005 -- proveedor alternativo de papelería.
    ['PRV-0005', 'MAT-0007', 0.15, 5, 'SÍ'],
    ['PRV-0005', 'MAT-0008', 0.05, 5, 'SÍ'],
    ['PRV-0005', 'MAT-0012', 0.6, 7, 'NO'],
    // PRV-0006 -- suministros de Manipulados y Carpintería.
    ['PRV-0006', 'MAT-0004', 8, 4, 'SÍ'],
    ['PRV-0006', 'MAT-0006', 25, 6, 'SÍ'],
    ['PRV-0006', 'MAT-0009', 1.2, 4, 'SÍ'],
    ['PRV-0006', 'MAT-0010', 4.5, 3, 'NO'],
    ['PRV-0006', 'MAT-0011', 6, 3, 'SÍ']
  ];

  var creadas = 0;
  lineas.forEach(function (fila) {
    if (yaExiste(fila[0], fila[1])) { return; }
    var resultado = guardarFormulario('PROVEEDOR_MATERIAL', null, {
      PROVEEDOR_ID: fila[0], MATERIAL_ID: fila[1], PRECIO_UNITARIO: fila[2], PLAZO_ENTREGA_DIAS: fila[3], ES_PREFERENTE: fila[4], ESTADO: 'Activa'
    }, correlationId);
    creadas++;
    console.log('OK creado id=' + resultado.id + ' proveedor=' + fila[0] + ' material=' + fila[1]);
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK creadas=' + creadas);
  return true;
}

/* ---------- I. Documentos + vínculos para Recursos ---------- */
function instalarDocumentosVinculosRecurso() {
  var packageName = 'INSTALAR_DOCUMENTOS_VINCULOS_RECURSO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);
  var correlationId = Utilities.getUuid();

  var documentosExistentes = listarRegistros('DOCUMENTO', { ACTIVO: 'SÍ' });
  function documentoYaExiste(titulo) {
    return documentosExistentes.some(function (d) { return d.TITULO === titulo; });
  }

  var documentos = [
    { ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: 'REC-0002', TITULO: 'Manual de uso de la sierra de mesa', TIPO_DOCUMENTO: 'Manual', ESTADO: 'Vigente' },
    { ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: 'REC-0009', TITULO: 'Protocolo del taller de Cerámica', TIPO_DOCUMENTO: 'Protocolo', ESTADO: 'Vigente' },
    { ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: 'REC-0007', TITULO: 'Ficha técnica de la troqueladora', TIPO_DOCUMENTO: 'Ficha técnica', ESTADO: 'Vigente' }
  ];

  var creadosDocumento = 0;
  var idsDocumentoCreados = [];
  documentos.forEach(function (d) {
    if (documentoYaExiste(d.TITULO)) { return; }
    var resultado = guardarFormulario('DOCUMENTO', null, d, correlationId);
    idsDocumentoCreados.push(resultado.id);
    creadosDocumento++;
    console.log('OK documento id=' + resultado.id + ' recurso=' + d.ENTIDAD_ID);
  });

  var incidencias = listarRegistros('INCIDENCIA', { ACTIVO: 'SÍ' });
  var vinculosExistentes = listarRegistros('VINCULO', { ACTIVO: 'SÍ' });
  function vinculoYaExiste(origenId, destinoId) {
    return vinculosExistentes.some(function (v) { return v.ENTIDAD_ORIGEN_ID === origenId && v.ENTIDAD_DESTINO_ID === destinoId; });
  }

  var creadosVinculo = 0;
  if (incidencias.length >= 2) {
    var vinculos = [
      { ENTIDAD_ORIGEN_TIPO: 'Incidencia', ENTIDAD_ORIGEN_ID: incidencias[0].ID, ENTIDAD_DESTINO_TIPO: 'Recurso', ENTIDAD_DESTINO_ID: 'REC-0002', TIPO_VINCULO: 'Relacionada', ESTADO: 'Activa' },
      { ENTIDAD_ORIGEN_TIPO: 'Incidencia', ENTIDAD_ORIGEN_ID: incidencias[1].ID, ENTIDAD_DESTINO_TIPO: 'Recurso', ENTIDAD_DESTINO_ID: 'REC-0009', TIPO_VINCULO: 'Relacionada', ESTADO: 'Activa' }
    ];
    vinculos.forEach(function (v) {
      if (vinculoYaExiste(v.ENTIDAD_ORIGEN_ID, v.ENTIDAD_DESTINO_ID)) { return; }
      var resultado = guardarFormulario('VINCULO', null, v, correlationId);
      creadosVinculo++;
      console.log('OK vinculo id=' + resultado.id + ' origen=' + v.ENTIDAD_ORIGEN_ID + ' destino=' + v.ENTIDAD_DESTINO_ID);
    });
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK documentos=' + creadosDocumento + ' vinculos=' + creadosVinculo);
  return true;
}

/* ---------- J. Limpieza de procesos/tareas de prueba ---------- */
/*
 * PCS-0001..PCS-0004 (y sus TAR-0001..TAR-0005) son restos de pruebas
 * manuales de UI ("PROCESO1", "SDF", campos vacios) -- se desactivan en
 * vez de sembrar mas datos encima, para no ensuciar exportaciones e
 * informes con texto de prueba. Se desactivan primero las TAREA (hijas)
 * y luego los PROCESO (padres), porque desactivarRegistro bloquea si
 * hay dependientes activos.
 */
function instalarLimpiezaProcesosPrueba() {
  var packageName = 'INSTALAR_LIMPIEZA_PROCESOS_PRUEBA';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var procesosPrueba = ['PCS-0001', 'PCS-0002', 'PCS-0003', 'PCS-0004'];
  var tareas = listarRegistros('TAREA', { ACTIVO: 'SÍ' }).filter(function (t) {
    return procesosPrueba.indexOf(t.PROCESO_ID) !== -1;
  });

  var desactivadas = 0;
  tareas.forEach(function (t) {
    try {
      desactivarRegistro('TAREA', t.ID);
      desactivadas++;
      console.log('OK tarea_desactivada id=' + t.ID);
    } catch (e) {
      console.log('OMITIDO tarea id=' + t.ID + ' motivo=' + e.message);
    }
  });

  procesosPrueba.forEach(function (id) {
    try {
      var registro = obtenerRegistroPorId('PROCESO', id);
      if (!registro || registro.ACTIVO === 'NO') { console.log('OK ya_inactivo id=' + id); return; }
      desactivarRegistro('PROCESO', id);
      desactivadas++;
      console.log('OK proceso_desactivado id=' + id);
    } catch (e) {
      console.log('OMITIDO proceso id=' + id + ' motivo=' + e.message);
    }
  });

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK desactivadas=' + desactivadas);
  return true;
}

/* ---------- Orquestador ---------- */
function instalarPaqueteDatosInformes() {
  var packageName = 'INSTALAR_PAQUETE_DATOS_INFORMES';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  instalarStockMateriales();
  instalarProductoMaterialAmpliado();
  instalarTareaRecursoAmpliado();
  instalarCicloProveedorAmpliado();
  instalarDecisionesAmpliado();
  instalarAsignacionRelacionAmpliado();
  instalarEquipoMiembroAmpliado();
  instalarProveedorMaterialAmpliado();
  instalarDocumentosVinculosRecurso();
  instalarLimpiezaProcesosPrueba();

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}
