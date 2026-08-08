/**
 * Ficha de registro de Producto (roadmap N2.1 -- "es donde nacen las
 * tareas y se forman los proyectos"). Mismo patron que
 * FichaPersonaEquipoService.js: agregador de solo lectura, no inventa
 * relaciones nuevas, reune las que ya existen y apuntan a un registro
 * PRODUCTO -- PROYECTO_PRODUCTO (N:M real, un producto puede
 * reutilizarse en varios proyectos, hasta ahora invisible), PROCESO
 * (y sus TAREA), PRODUCTO_MATERIAL y DOCUMENTO.
 */

function obtenerFichaProducto(id) {
  var producto = obtenerRegistroPorId('PRODUCTO', id);
  if (!producto) {
    throw new Error('No existe ningún registro de Producto con id "' + id + '".');
  }

  var nombresPersona = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });

  /*
   * Proyectos vinculados: se muestran TODAS las relaciones (no solo la
   * primera, a diferencia de construirMapaContextoPorProducto_, que
   * colapsa a una sola para el Gantt) -- justo el hueco que señala el
   * roadmap ("hoy invisible").
   */
  var proyectosPorId = {};
  listarRegistros('PROYECTO', {}).forEach(function (p) { proyectosPorId[p.ID] = p; });
  var campanasPorId = {};
  listarRegistros('CAMPANA', {}).forEach(function (c) { campanasPorId[c.ID] = c; });

  var proyectos = listarRegistros('PROYECTO_PRODUCTO', { ACTIVO: 'SÍ' })
    .filter(function (pp) { return pp.PRODUCTO_ID === id; })
    .map(function (pp) {
      var proyecto = proyectosPorId[pp.PROYECTO_ID];
      var campana = proyecto ? campanasPorId[proyecto.CAMPANA_ID] : null;
      return {
        relacionId: pp.ID,
        proyectoId: pp.PROYECTO_ID,
        proyectoNombre: proyecto ? proyecto.NOMBRE : pp.PROYECTO_ID,
        campanaNombre: campana ? campana.NOMBRE : '',
        cantidadAsignada: pp.CANTIDAD_ASIGNADA,
        estado: pp.ESTADO
      };
    });

  /*
   * Procesos del producto, con recuento de tareas y desviacion/riesgo
   * -- mismo calculo que ya usa el Gantt (DesviacionService.js), no se
   * reinventa, solo se aplica por producto en vez de para todos.
   */
  var tareas = listarRegistros('TAREA', { ACTIVO: 'SÍ' });
  var tareasPorProceso = {};
  tareas.forEach(function (t) {
    if (!tareasPorProceso[t.PROCESO_ID]) tareasPorProceso[t.PROCESO_ID] = [];
    tareasPorProceso[t.PROCESO_ID].push(t);
  });

  var procesos = listarRegistros('PROCESO', { ACTIVO: 'SÍ' })
    .filter(function (p) { return p.PRODUCTO_ID === id; })
    .map(function (p) {
      var tareasDelProceso = tareasPorProceso[p.ID] || [];
      var tareasAbiertas = tareasDelProceso.filter(function (t) {
        var estado = String(t.ESTADO || '').toLowerCase();
        return estado.indexOf('complet') === -1 && estado.indexOf('cancel') === -1;
      }).length;
      var desviacion = calcularDesviacionRegistro_(p);
      return {
        id: p.ID,
        nombre: p.NOMBRE,
        fase: p.FASE_PRODUCCION || '',
        estado: p.ESTADO || '',
        responsableNombre: nombresPersona[p.RESPONSABLE_ID] || '',
        fechaInicioPlan: p.FECHA_INICIO_PLAN || null,
        fechaFinPlan: p.FECHA_FIN_PLAN || null,
        porcentajeAvance: p.PORCENTAJE_AVANCE === '' || p.PORCENTAJE_AVANCE === undefined ? null : Number(p.PORCENTAJE_AVANCE),
        tareasTotal: tareasDelProceso.length,
        tareasAbiertas: tareasAbiertas,
        diasDesviacionFin: desviacion.DIAS_DESVIACION_FIN,
        diasRiesgo: calcularRiesgoRegistro_(p)
      };
    })
    .sort(function (a, b) { return new Date(a.fechaInicioPlan || 0) - new Date(b.fechaInicioPlan || 0); });

  /*
   * Resumen de avance/desviacion agregado (roadmap: "avance/desviación
   * agregado"): agregado simple sobre los procesos ya calculados arriba,
   * sin volver a leer nada -- mismo dato que calcularDesviacionAgregada_
   * pero como un unico total, no agrupado por campo.
   */
  var procesosConFinReal = procesos.filter(function (p) { return p.diasDesviacionFin !== null; });
  var sumaDesviacion = procesosConFinReal.reduce(function (acc, p) { return acc + p.diasDesviacionFin; }, 0);
  var resumenAvance = {
    procesosTotal: procesos.length,
    procesosMedidos: procesosConFinReal.length,
    procesosEnRiesgo: procesos.filter(function (p) { return p.diasRiesgo !== null; }).length,
    diasDesviacionMedia: procesosConFinReal.length > 0 ? Math.round((sumaDesviacion / procesosConFinReal.length) * 10) / 10 : null
  };

  var materialesPorId = {};
  listarRegistros('MATERIAL', {}).forEach(function (m) { materialesPorId[m.ID] = m; });

  /*
   * N7.1 (roadmap -- "Ficha de Producto-Material-Proveedor"): en vez de
   * una ficha nueva para una relación N:M sin ID propio con el que
   * navegar (mismo matiz que "Ficha de Presupuesto" -- ver conversación),
   * se enriquece la lista de materiales que YA tiene esta ficha con el
   * proveedor preferente, su precio de referencia y el coste estimado
   * -- mismo criterio ya usado en CosteService.js (calcularCosteMaterialesEstimado_),
   * no se duplica la lógica, solo se reexpone aquí.
   */
  var preciosPorMaterial_ = {};
  var proveedorPreferentePorMaterial_ = {};
  var nombresProveedor_ = {};
  listarRegistros('PROVEEDOR', {}).forEach(function (p) { nombresProveedor_[p.ID] = p.NOMBRE; });
  listarRegistros('PROVEEDOR_MATERIAL', { ACTIVO: 'SÍ' }).forEach(function (pm) {
    if (!preciosPorMaterial_[pm.MATERIAL_ID] || pm.ES_PREFERENTE === 'SÍ') {
      preciosPorMaterial_[pm.MATERIAL_ID] = Number(pm.PRECIO_UNITARIO) || 0;
      proveedorPreferentePorMaterial_[pm.MATERIAL_ID] = pm.PROVEEDOR_ID;
    }
  });

  var materiales = listarRegistros('PRODUCTO_MATERIAL', { ACTIVO: 'SÍ' })
    .filter(function (pm) { return pm.PRODUCTO_ID === id; })
    .map(function (pm) {
      var material = materialesPorId[pm.MATERIAL_ID];
      var precioReferencia = preciosPorMaterial_[pm.MATERIAL_ID];
      var proveedorId = proveedorPreferentePorMaterial_[pm.MATERIAL_ID];
      var cantidad = Number(pm.CANTIDAD_PREVISTA) || 0;
      return {
        relacionId: pm.ID,
        materialId: pm.MATERIAL_ID,
        materialNombre: material ? material.NOMBRE : pm.MATERIAL_ID,
        cantidadPrevista: pm.CANTIDAD_PREVISTA,
        unidad: pm.UNIDAD,
        cantidadReservada: pm.CANTIDAD_RESERVADA,
        estado: pm.ESTADO,
        proveedorId: proveedorId || null,
        proveedorNombre: proveedorId ? (nombresProveedor_[proveedorId] || proveedorId) : null,
        precioReferencia: precioReferencia !== undefined ? precioReferencia : null,
        costeEstimado: precioReferencia !== undefined ? Math.round(cantidad * precioReferencia * 100) / 100 : null
      };
    });

  var documentos = listarRegistros('DOCUMENTO', { ACTIVO: 'SÍ' })
    .filter(function (d) { return d.ENTIDAD_TIPO === 'Producto' && d.ENTIDAD_ID === id; })
    .map(function (d) { return { id: d.ID, titulo: d.TITULO, tipo: d.TIPO_DOCUMENTO, estado: d.ESTADO }; });

  return serializarParaCliente_({
    producto: producto,
    responsableNombre: nombresPersona[producto.RESPONSABLE_ID] || '',
    proyectos: proyectos,
    procesos: procesos,
    resumenAvance: resumenAvance,
    materiales: materiales,
    documentos: documentos
  });
}

function abrirFichaProducto(id) {
  var template = HtmlService.createTemplateFromFile('FichaProducto');
  template.idRegistro = id;
  var html = template.evaluate().setWidth(560).setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(html, 'Ficha: ' + id);
}

/* accionFn del selector generico (SelectorRegistro.html): firma (entidad, idRegistro). */
function seleccionarYAbrirFichaProducto(entidad, idRegistro) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);
  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }
  abrirFichaProducto(idRegistro);
  return true;
}

function abrirFichaProductoBuscar() {
  abrirSelectorConAccion_('PRODUCTO', 'Ver ficha de producto', 'seleccionarYAbrirFichaProducto', 'obtenerOpcionesEntidadParaSelector', true);
}

/*
 * Prefija PRODUCTO_ID -- mismo mecanismo PREFILL que la cadena
 * Campaña->Proyecto -- y retorna a esta misma ficha al cerrar el
 * formulario (ver conversacion: "no tener que salir de ficha de
 * producto por sus partes").
 */
function abrirFormularioCrearProcesoParaProducto(productoId) {
  abrirFormularioCrear_('PROCESO', 'Nuevo proceso', { PRODUCTO_ID: productoId }, { tipo: 'ficha', entidad: 'PRODUCTO', id: productoId });
}

function abrirFormularioCrearProductoMaterialParaProducto(productoId) {
  abrirFormularioCrear_('PRODUCTO_MATERIAL', 'Nuevo material para el producto', { PRODUCTO_ID: productoId }, { tipo: 'ficha', entidad: 'PRODUCTO', id: productoId });
}

function abrirFormularioCrearDocumentoParaProducto(productoId) {
  abrirFormularioCrear_('DOCUMENTO', 'Nuevo documento', { ENTIDAD_TIPO: 'Producto', ENTIDAD_ID: productoId }, { tipo: 'ficha', entidad: 'PRODUCTO', id: productoId });
}

function abrirFormularioCrearProyectoProductoParaProducto(productoId) {
  abrirFormularioCrear_('PROYECTO_PRODUCTO', 'Vincular a un proyecto', { PRODUCTO_ID: productoId }, { tipo: 'ficha', entidad: 'PRODUCTO', id: productoId });
}

/* Mismo patron de preseleccion que abrirGanttPlanReal(campanaId) desde el Panel de Campaña. */
function abrirGanttFiltradoProducto(productoId) {
  abrirGanttPlanReal(null, productoId);
}

/*
 * Exportar CSV de la ficha (ver conversacion -- "importar/exportar
 * como en el resto del sistema"): mismo exportador compartido
 * (construirCsvConBom_/abrirDialogoDescargaCSV_, DesviacionService.js)
 * que ya usan el Gantt y el Panel de Campaña. Fila plana por registro
 * relacionado (Proyecto/Proceso/Material/Documento), reutilizando los
 * datos ya calculados por obtenerFichaProducto -- no se vuelve a leer
 * nada.
 */
function exportarFichaProductoCSV(id) {
  var datos = obtenerFichaProducto(id);
  var encabezados = ['Tipo', 'ID', 'Nombre', 'Detalle', 'Estado'];

  var filas = [];
  datos.proyectos.forEach(function (pp) {
    filas.push(['Proyecto', pp.proyectoId, pp.proyectoNombre, [pp.campanaNombre, pp.cantidadAsignada].filter(Boolean).join(' · '), pp.estado]);
  });
  datos.procesos.forEach(function (pr) {
    var detalle = [pr.fase, pr.responsableNombre, pr.tareasAbiertas + ' de ' + pr.tareasTotal + ' tareas abiertas'].filter(Boolean).join(' · ');
    filas.push(['Proceso', pr.id, pr.nombre, detalle, pr.estado]);
  });
  datos.materiales.forEach(function (m) {
    filas.push(['Material', m.materialId, m.materialNombre, [m.cantidadPrevista, m.unidad].filter(Boolean).join(' '), m.estado]);
  });
  datos.documentos.forEach(function (d) {
    filas.push(['Documento', d.id, d.titulo, d.tipo, d.estado]);
  });

  var nombreArchivo = 'FICHA_PRODUCTO_' + id + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('PRODUCTO', id, 'EXPORTAR_FICHA', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombreArchivo, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarFichaProductoCSV(id) {
  var resultado = exportarFichaProductoCSV(id);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}
