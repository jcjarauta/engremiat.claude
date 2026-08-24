/**
 * KanbanService.gs -- N4.1 (roadmap "Formatos operativos baratos"):
 * Kanban por estado para Tarea/Proceso/Incidencia. Las columnas son el
 * propio catalogo CFG_ESTADO_* de cada entidad (su orden en el
 * catalogo ES el orden del pipeline, no hace falta inventar uno
 * nuevo). El cambio de estado usa actualizarRegistroTransaccional
 * (PATCH seguro, solo toca ESTADO) -- no guardarFormulario, que
 * exigiria el esquema completo del registro.
 */

var KANBAN_CONFIG_ = {
  TAREA: { catalogoEstado: 'CFG_ESTADO_TAREA' },
  PROCESO: { catalogoEstado: 'CFG_ESTADO_PROCESO' },
  INCIDENCIA: { catalogoEstado: 'CFG_ESTADO_INCIDENCIA' }
};

function obtenerOpcionesFiltroKanban() {
  var datos = leerVariasEntidadesBatch_(['CAMPANA', 'PERSONA_EQUIPO']);
  return {
    campanas: loteFiltrarPorIgualdad_(datos.CAMPANA, { ACTIVO: 'SÍ' }).map(function (c) {
      return { id: c.ID, etiqueta: c.NOMBRE };
    }),
    personas: loteFiltrarPorIgualdad_(datos.PERSONA_EQUIPO, { ACTIVO: 'SÍ' }).map(function (p) {
      return { id: p.ID, etiqueta: p.NOMBRE };
    })
  };
}

/*
 * TAREA no tiene RESPONSABLE_ID propio (ver conversacion -- mismo
 * hallazgo que en el Informe de calidad de planificacion): se llega via
 * TAREA_RESPONSABLE. Una tarea puede tener varios responsables, se
 * muestran todos en la tarjeta.
 */
function tarjetasKanbanTarea_(filtro) {
  var datos = leerVariasEntidadesBatch_([
    'TAREA', 'TAREA_RESPONSABLE', 'PROCESO', 'PRODUCTO',
    'PROYECTO_PRODUCTO', 'PROYECTO', 'CAMPANA', 'PERSONA_EQUIPO'
  ]);
  var contextoPorProducto = construirMapaContextoPorProductoDesdeFilas_(datos.PROYECTO_PRODUCTO, datos.PROYECTO, datos.CAMPANA);
  var procesoPorId = {};
  datos.PROCESO.forEach(function (p) { procesoPorId[p.ID] = p; });
  var nombresPersona = {};
  datos.PERSONA_EQUIPO.forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });

  var responsablesPorTarea = {};
  loteFiltrarPorIgualdad_(datos.TAREA_RESPONSABLE, { ACTIVO: 'SÍ' }).forEach(function (tr) {
    if (!responsablesPorTarea[tr.TAREA_ID]) responsablesPorTarea[tr.TAREA_ID] = [];
    responsablesPorTarea[tr.TAREA_ID].push(tr.PERSONA_EQUIPO_ID);
  });

  return loteFiltrarPorIgualdad_(datos.TAREA, { ACTIVO: 'SÍ' }).filter(function (tarea) {
    var proceso = procesoPorId[tarea.PROCESO_ID];
    var contexto = proceso ? contextoPorProducto[proceso.PRODUCTO_ID] : null;
    if (filtro.campanaId && (!contexto || contexto.campanaId !== filtro.campanaId)) return false;
    if (filtro.proyectoId && (!contexto || contexto.proyectoId !== filtro.proyectoId)) return false;
    if (filtro.procesoId && tarea.PROCESO_ID !== filtro.procesoId) return false;
    if (filtro.responsableId && (responsablesPorTarea[tarea.ID] || []).indexOf(filtro.responsableId) === -1) return false;
    return true;
  }).map(function (tarea) {
    var proceso = procesoPorId[tarea.PROCESO_ID];
    var contexto = (proceso && contextoPorProducto[proceso.PRODUCTO_ID]) || {};
    var nombresResponsables = (responsablesPorTarea[tarea.ID] || []).map(function (id) { return nombresPersona[id] || id; });
    return {
      id: tarea.ID,
      entidad: 'TAREA',
      titulo: tarea.NOMBRE,
      estado: tarea.ESTADO,
      subtitulo: nombresResponsables.join(', ') || 'Sin responsable',
      /*
       * procesoId/procesoNombre separados del resto del contexto (ver
       * conversacion -- "proceso es padre de tarea, parece repetitivo"):
       * el cliente los usa para el enlace de edicion directa al proceso
       * padre y para el toggle "Agrupar por proceso".
       */
      procesoId: tarea.PROCESO_ID || null,
      procesoNombre: proceso ? proceso.NOMBRE : null,
      contexto: contexto.proyectoNombre || '',
      fechaClave: tarea.FECHA_FIN_PLAN || null
    };
  });
}

/*
 * Opciones para el filtro "Proyecto" del Kanban (dependiente de
 * Campaña -- PROYECTO tiene CAMPANA_ID propio, no hace falta pasar por
 * el mapa de contexto de producto).
 */
function obtenerOpcionesProyectoKanban(filtro) {
  filtro = filtro || {};
  return listarRegistros('PROYECTO', { ACTIVO: 'SÍ' }).filter(function (proyecto) {
    if (filtro.campanaId && proyecto.CAMPANA_ID !== filtro.campanaId) return false;
    return true;
  }).map(function (proyecto) {
    return { id: proyecto.ID, etiqueta: proyecto.NOMBRE };
  });
}

/*
 * Opciones para el filtro "Proceso" del Kanban de Tareas (dependiente
 * de Campaña y, si esta elegido, tambien de Proyecto -- misma cadena
 * jerarquica Campaña->Proyecto->Proceso que el resto del sistema).
 */
function obtenerOpcionesProcesoKanban(filtro) {
  filtro = filtro || {};
  var datos = leerVariasEntidadesBatch_(['PROCESO', 'PRODUCTO', 'PROYECTO_PRODUCTO', 'PROYECTO', 'CAMPANA']);
  var contextoPorProducto = construirMapaContextoPorProductoDesdeFilas_(datos.PROYECTO_PRODUCTO, datos.PROYECTO, datos.CAMPANA);
  return loteFiltrarPorIgualdad_(datos.PROCESO, { ACTIVO: 'SÍ' }).filter(function (proceso) {
    var contexto = contextoPorProducto[proceso.PRODUCTO_ID];
    if (filtro.proyectoId) return contexto && contexto.proyectoId === filtro.proyectoId;
    if (filtro.campanaId) return contexto && contexto.campanaId === filtro.campanaId;
    return true;
  }).map(function (proceso) {
    return { id: proceso.ID, etiqueta: proceso.NOMBRE };
  });
}

/*
 * Progreso de tareas hijas (ver conversacion -- "proceso es padre de
 * tarea, se siente repetitivo tener dos tableros separados"): la
 * tarjeta de Proceso resume cuantas de sus tareas estan Terminadas sin
 * tener que cambiar a la pestaña de Tareas.
 */
function calcularProgresoTareasPorProceso_(tareasFilas) {
  var progreso = {};
  loteFiltrarPorIgualdad_(tareasFilas, { ACTIVO: 'SÍ' }).forEach(function (tarea) {
    if (!progreso[tarea.PROCESO_ID]) progreso[tarea.PROCESO_ID] = { total: 0, terminadas: 0 };
    progreso[tarea.PROCESO_ID].total++;
    if (tarea.ESTADO === 'Terminada') progreso[tarea.PROCESO_ID].terminadas++;
  });
  return progreso;
}

function tarjetasKanbanProceso_(filtro) {
  var datos = leerVariasEntidadesBatch_(['PROCESO', 'TAREA', 'PRODUCTO', 'PROYECTO_PRODUCTO', 'PROYECTO', 'CAMPANA', 'PERSONA_EQUIPO']);
  var contextoPorProducto = construirMapaContextoPorProductoDesdeFilas_(datos.PROYECTO_PRODUCTO, datos.PROYECTO, datos.CAMPANA);
  var nombresPersona = {};
  datos.PERSONA_EQUIPO.forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });
  var nombresProducto = {};
  datos.PRODUCTO.forEach(function (p) { nombresProducto[p.ID] = p.NOMBRE; });
  var progresoTareas = calcularProgresoTareasPorProceso_(datos.TAREA);

  return loteFiltrarPorIgualdad_(datos.PROCESO, { ACTIVO: 'SÍ' }).filter(function (proceso) {
    var contexto = contextoPorProducto[proceso.PRODUCTO_ID];
    if (filtro.campanaId && (!contexto || contexto.campanaId !== filtro.campanaId)) return false;
    if (filtro.proyectoId && (!contexto || contexto.proyectoId !== filtro.proyectoId)) return false;
    if (filtro.responsableId && proceso.RESPONSABLE_ID !== filtro.responsableId) return false;
    return true;
  }).map(function (proceso) {
    var contexto = contextoPorProducto[proceso.PRODUCTO_ID] || {};
    var progreso = progresoTareas[proceso.ID] || { total: 0, terminadas: 0 };
    return {
      id: proceso.ID,
      entidad: 'PROCESO',
      titulo: proceso.NOMBRE,
      estado: proceso.ESTADO,
      subtitulo: nombresPersona[proceso.RESPONSABLE_ID] || 'Sin responsable',
      contexto: [nombresProducto[proceso.PRODUCTO_ID], contexto.proyectoNombre].filter(Boolean).join(' · '),
      fechaClave: proceso.FECHA_FIN_PLAN || null,
      tareasTotal: progreso.total,
      tareasTerminadas: progreso.terminadas
    };
  });
}

/*
 * INCIDENCIA SI tiene RESPONSABLE_ID propio (columna real en
 * 13_INCIDENCIAS) -- corregido 2026-08-23 (INC-0035): el comentario
 * anterior decia lo contrario y el filtro de responsable se ignoraba
 * sin motivo real. Tiene tambien PROCESO_ID propio (a diferencia de
 * TAREA), asi que el filtro "Proceso" tambien se aplica.
 */
function tarjetasKanbanIncidencia_(filtro) {
  var datos = leerVariasEntidadesBatch_(['INCIDENCIA', 'CAMPANA', 'PROYECTO', 'PRODUCTO', 'PROCESO', 'TAREA']);
  var nombresCampana = {};
  datos.CAMPANA.forEach(function (c) { nombresCampana[c.ID] = c.NOMBRE; });
  var nombresProyecto = {};
  datos.PROYECTO.forEach(function (p) { nombresProyecto[p.ID] = p.NOMBRE; });
  var nombresProducto = {};
  datos.PRODUCTO.forEach(function (p) { nombresProducto[p.ID] = p.NOMBRE; });
  var nombresProceso = {};
  datos.PROCESO.forEach(function (p) { nombresProceso[p.ID] = p.NOMBRE; });
  var nombresTarea = {};
  datos.TAREA.forEach(function (t) { nombresTarea[t.ID] = t.NOMBRE; });

  return loteFiltrarPorIgualdad_(datos.INCIDENCIA, { ACTIVO: 'SÍ' }).filter(function (incidencia) {
    if (filtro.campanaId && incidencia.CAMPANA_ID !== filtro.campanaId) return false;
    if (filtro.proyectoId && incidencia.PROYECTO_ID !== filtro.proyectoId) return false;
    if (filtro.procesoId && incidencia.PROCESO_ID !== filtro.procesoId) return false;
    if (filtro.responsableId && incidencia.RESPONSABLE_ID !== filtro.responsableId) return false;
    return true;
  }).map(function (incidencia) {
    /*
     * Contexto = el nivel MAS PROFUNDO vinculado (ver conversacion --
     * antes se mostraba siempre Proyecto·Campaña aunque la incidencia
     * estuviera vinculada a un Proceso o Tarea concretos).
     */
    var contexto = nombresTarea[incidencia.TAREA_ID] || nombresProceso[incidencia.PROCESO_ID] ||
      nombresProducto[incidencia.PRODUCTO_ID] || nombresProyecto[incidencia.PROYECTO_ID] ||
      nombresCampana[incidencia.CAMPANA_ID] || '';
    return {
      id: incidencia.ID,
      entidad: 'INCIDENCIA',
      titulo: incidencia.TITULO,
      estado: incidencia.ESTADO,
      subtitulo: [incidencia.TIPO, incidencia.PRIORIDAD].filter(Boolean).join(' · '),
      contexto: contexto,
      fechaClave: null
    };
  });
}

function obtenerDatosKanban(entidad, filtro) {
  filtro = filtro || {};
  var config = KANBAN_CONFIG_[entidad];
  if (!config) throw new Error('ERROR_KANBAN: entidad no soportada: ' + entidad);

  var tarjetas;
  if (entidad === 'TAREA') tarjetas = tarjetasKanbanTarea_(filtro);
  else if (entidad === 'PROCESO') tarjetas = tarjetasKanbanProceso_(filtro);
  else tarjetas = tarjetasKanbanIncidencia_(filtro);

  return serializarParaCliente_({
    columnas: obtenerCatalogo(config.catalogoEstado),
    tarjetas: tarjetas
  });
}

function cambiarEstadoKanban(entidad, id, nuevoEstado) {
  if (!KANBAN_CONFIG_[entidad]) throw new Error('ERROR_KANBAN: entidad no soportada: ' + entidad);
  /*
   * INCIDENCIA pasa por cambiarEstadoIncidenciaRapido_ (Incidencia
   * MantenimientoService.js) en vez del actualizarRegistroTransaccional
   * directo de abajo -- dispara "Incidencia aprobada -> Tarea", que un
   * cambio de ESTADO suelto se saltaría.
   */
  if (entidad === 'INCIDENCIA') {
    cambiarEstadoIncidenciaRapido_(id, nuevoEstado);
    return { ok: true };
  }
  actualizarRegistroTransaccional(entidad, id, { ESTADO: nuevoEstado }, { origen: 'UI' });
  return { ok: true };
}

function abrirKanban() {
  var html = HtmlService.createTemplateFromFile('KanbanOperativo')
    .evaluate()
    .setTitle('Kanban operativo')
    .setWidth(1000)
    .setHeight(640);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Kanban operativo');
}
