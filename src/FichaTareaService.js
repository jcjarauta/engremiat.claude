/**
 * Ficha de registro de Tarea (ver conversacion -- completar la
 * cobertura del patron Panel/Ficha/Formulario en el resto de la
 * jerarquia; nivel más profundo de la cadena Campaña->Proyecto->
 * Producto->Proceso->Tarea, el mismo que ya enseña sus relaciones
 * inline en el Panel de Campaña Fase 1). Agregador de solo lectura:
 * TAREA_RESPONSABLE, TAREA_RECURSO, TAREA_MATERIAL (módulo COMPRAS),
 * EJECUCION_TAREA, INCIDENCIA (nivel Tarea, el más profundo posible) y
 * DOCUMENTO.
 */

function obtenerFichaTarea(id) {
  var tarea = obtenerRegistroPorId('TAREA', id);
  if (!tarea) {
    throw new Error('No existe ningún registro de Tarea con id "' + id + '".');
  }

  var nombresPersona = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });

  var proceso = obtenerRegistroPorId('PROCESO', tarea.PROCESO_ID);
  var producto = proceso ? obtenerRegistroPorId('PRODUCTO', proceso.PRODUCTO_ID) : null;

  /* Mismo criterio que FichaProcesoService.js: solo hay proyecto/campaña
   * ancestro único si el Proceso viene de una relación PROYECTO_PRODUCTO
   * concreta. */
  var proyectoId = null, proyectoNombre = '', campanaId = null, campanaNombre = '';
  if (proceso && proceso.PROYECTO_PRODUCTO_ID) {
    var proyectoProducto = obtenerRegistroPorId('PROYECTO_PRODUCTO', proceso.PROYECTO_PRODUCTO_ID);
    if (proyectoProducto) {
      var proyecto = obtenerRegistroPorId('PROYECTO', proyectoProducto.PROYECTO_ID);
      if (proyecto) {
        proyectoId = proyecto.ID;
        proyectoNombre = proyecto.NOMBRE;
        campanaId = proyecto.CAMPANA_ID;
        var campana = obtenerRegistroPorId('CAMPANA', proyecto.CAMPANA_ID);
        campanaNombre = campana ? campana.NOMBRE : '';
      }
    }
  }

  var responsables = listarRegistros('TAREA_RESPONSABLE', { ACTIVO: 'SÍ' })
    .filter(function (a) { return a.TAREA_ID === id; })
    .map(function (a) {
      return {
        relacionId: a.ID,
        personaId: a.PERSONA_EQUIPO_ID,
        personaNombre: nombresPersona[a.PERSONA_EQUIPO_ID] || a.PERSONA_EQUIPO_ID,
        rol: a.ROL_ASIGNADO,
        porcentajeDedicacion: a.PORCENTAJE_DEDICACION,
        estado: a.ESTADO
      };
    });

  var nombresRecurso_ = {};
  listarRegistros('RECURSO', {}).forEach(function (r) { nombresRecurso_[r.ID] = r.NOMBRE; });
  var recursos = listarRegistros('TAREA_RECURSO', { ACTIVO: 'SÍ' })
    .filter(function (tr) { return tr.TAREA_ID === id; })
    .map(function (tr) {
      return {
        relacionId: tr.ID,
        recursoId: tr.RECURSO_ID,
        recursoNombre: nombresRecurso_[tr.RECURSO_ID] || tr.RECURSO_ID,
        tipoUso: tr.TIPO_USO,
        estado: tr.ESTADO
      };
    });

  /*
   * MATERIAL/TAREA_MATERIAL son del módulo COMPRAS -- en un cliente
   * solo-CORE esas hojas no existen (mismo caso ya corregido en
   * FichaProductoService.js). Envuelto en try/catch para no romper el
   * resto de la ficha si falta ese módulo.
   */
  var materiales = [];
  try {
    var nombresMaterial_ = {};
    listarRegistros('MATERIAL', {}).forEach(function (m) { nombresMaterial_[m.ID] = m.NOMBRE; });
    materiales = listarRegistros('TAREA_MATERIAL', { ACTIVO: 'SÍ' })
      .filter(function (tm) { return tm.TAREA_ID === id; })
      .map(function (tm) {
        return {
          relacionId: tm.ID,
          materialId: tm.MATERIAL_ID,
          materialNombre: nombresMaterial_[tm.MATERIAL_ID] || tm.MATERIAL_ID,
          cantidadPrevista: tm.CANTIDAD_PREVISTA,
          cantidadConsumida: tm.CANTIDAD_CONSUMIDA,
          unidad: tm.UNIDAD,
          estado: tm.ESTADO
        };
      });
  } catch (eCompras) { /* módulo COMPRAS no instalado */ }

  var ejecuciones = listarRegistros('EJECUCION_TAREA', { ACTIVO: 'SÍ' })
    .filter(function (ej) { return ej.TAREA_ID === id; })
    .map(function (ej) {
      return {
        id: ej.ID,
        responsableNombre: nombresPersona[ej.RESPONSABLE_ID] || '',
        estado: ej.ESTADO,
        resultado: ej.RESULTADO || ''
      };
    });

  /*
   * Tarea es el nivel más profundo de la jerarquía, así que TODA
   * incidencia con TAREA_ID relleno pertenece a esta ficha (no hace
   * falta excluir subniveles, a diferencia de Proyecto/Proceso).
   */
  var incidencias = listarRegistros('INCIDENCIA', { ACTIVO: 'SÍ' })
    .filter(function (inc) { return inc.TAREA_ID === id; })
    .map(function (inc) { return { id: inc.ID, titulo: inc.TITULO, estado: inc.ESTADO }; });

  var documentos = listarRegistros('DOCUMENTO', { ACTIVO: 'SÍ' })
    .filter(function (d) { return d.ENTIDAD_TIPO === 'Tarea' && d.ENTIDAD_ID === id; })
    .map(function (d) { return { id: d.ID, titulo: d.TITULO, tipo: d.TIPO_DOCUMENTO, estado: d.ESTADO }; });

  return serializarParaCliente_({
    tarea: tarea,
    procesoId: tarea.PROCESO_ID,
    procesoNombre: proceso ? proceso.NOMBRE : '',
    productoId: producto ? producto.ID : null,
    productoNombre: producto ? producto.NOMBRE : '',
    proyectoId: proyectoId,
    proyectoNombre: proyectoNombre,
    campanaId: campanaId,
    campanaNombre: campanaNombre,
    diasDesviacionFin: calcularDesviacionRegistro_(tarea).DIAS_DESVIACION_FIN,
    diasRiesgo: calcularRiesgoRegistro_(tarea),
    responsables: responsables,
    recursos: recursos,
    materiales: materiales,
    ejecuciones: ejecuciones,
    incidencias: incidencias,
    documentos: documentos
  });
}

function abrirFichaTarea(id) {
  var template = HtmlService.createTemplateFromFile('FichaTarea');
  template.idRegistro = id;
  var html = template.evaluate().setWidth(560).setHeight(680);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Ficha: ' + id);
}

/* accionFn del selector genérico (SelectorRegistro.html): firma (entidad, idRegistro). */
function seleccionarYAbrirFichaTarea(entidad, idRegistro) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);
  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }
  abrirFichaTarea(idRegistro);
  return true;
}

function abrirFichaTareaBuscar() {
  abrirSelectorConAccion_('TAREA', 'Ver ficha de tarea', 'seleccionarYAbrirFichaTarea', 'obtenerOpcionesEntidadParaSelector', true);
}

function abrirFormularioCrearDocumentoParaTarea(tareaId) {
  abrirFormularioCrear_('DOCUMENTO', 'Nuevo documento', { ENTIDAD_TIPO: 'Tarea', ENTIDAD_ID: tareaId }, { tipo: 'ficha', entidad: 'TAREA', id: tareaId });
}

/*
 * Exportar CSV de la ficha -- mismo exportador compartido que el resto
 * de fichas y el Panel de Campaña.
 */
function exportarFichaTareaCSV(id) {
  var datos = obtenerFichaTarea(id);
  var encabezados = ['Tipo', 'ID', 'Nombre', 'Detalle', 'Estado'];

  var filas = [];
  datos.responsables.forEach(function (r) {
    var detalle = [r.rol, r.porcentajeDedicacion ? r.porcentajeDedicacion + '%' : ''].filter(Boolean).join(' · ');
    filas.push(['Responsable', r.personaId, r.personaNombre, detalle, r.estado]);
  });
  datos.recursos.forEach(function (r) {
    filas.push(['Recurso', r.recursoId, r.recursoNombre, r.tipoUso || '', r.estado]);
  });
  datos.materiales.forEach(function (m) {
    filas.push(['Material', m.materialId, m.materialNombre, [m.cantidadPrevista, m.unidad].filter(Boolean).join(' '), m.estado]);
  });
  datos.ejecuciones.forEach(function (e) {
    filas.push(['Ejecución', e.id, e.responsableNombre || e.id, e.resultado || '', e.estado]);
  });
  datos.incidencias.forEach(function (i) {
    filas.push(['Incidencia', i.id, i.titulo, '', i.estado]);
  });
  datos.documentos.forEach(function (d) {
    filas.push(['Documento', d.id, d.titulo, d.tipo, d.estado]);
  });

  var nombreArchivo = 'FICHA_TAREA_' + id + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('TAREA', id, 'EXPORTAR_FICHA', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombreArchivo, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarFichaTareaCSV(id) {
  var resultado = exportarFichaTareaCSV(id);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}
