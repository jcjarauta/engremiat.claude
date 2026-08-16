/**
 * Mi trabajo (ver conversación -- "Mi trabajo": vista personalizada de
 * lo que tengo pendiente). No es un sistema de permisos -- es una
 * lente sobre los mismos datos que cualquiera puede ver desde el resto
 * del sheet, filtrada por quien ha abierto el Sheet ahora mismo. Busca
 * la persona del equipo cuyo EMAIL coincide con el usuario actual y
 * reúne sus Tareas, Incidencias y Decisiones aún abiertas.
 */
function obtenerMiTrabajo() {
  var miEmail = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
  if (!miEmail) return serializarParaCliente_({ sinPersona: true });

  var yo = listarRegistrosSeguro_('PERSONA_EQUIPO', { ACTIVO: 'SÍ' })
    .filter(function (p) { return String(p.EMAIL || '').trim().toLowerCase() === miEmail; })[0];
  if (!yo) return serializarParaCliente_({ sinPersona: true });

  var tareasPorId = {};
  listarRegistros('TAREA', {}).forEach(function (t) { tareasPorId[t.ID] = t; });

  var ESTADOS_TAREA_CIERRE = ['Terminada', 'Cancelada'];
  var tareas = listarRegistros('TAREA_RESPONSABLE', { ACTIVO: 'SÍ' })
    .filter(function (a) { return a.PERSONA_EQUIPO_ID === yo.ID; })
    .map(function (a) { return tareasPorId[a.TAREA_ID]; })
    .filter(function (t) { return t && ESTADOS_TAREA_CIERRE.indexOf(t.ESTADO) === -1; })
    .map(function (t) { return { id: t.ID, nombre: t.NOMBRE, estado: t.ESTADO, fechaFinPlan: t.FECHA_FIN_PLAN || null }; })
    .sort(function (a, b) { return new Date(a.fechaFinPlan || 0) - new Date(b.fechaFinPlan || 0); });

  var ESTADOS_INCIDENCIA_CIERRE = ['Resuelta', 'Cerrada', 'Cancelada'];
  var incidencias = listarRegistrosSeguro_('INCIDENCIA', { ACTIVO: 'SÍ' })
    .filter(function (i) { return i.RESPONSABLE_ID === yo.ID && ESTADOS_INCIDENCIA_CIERRE.indexOf(i.ESTADO) === -1; })
    .map(function (i) { return { id: i.ID, titulo: i.TITULO, estado: i.ESTADO, prioridad: i.PRIORIDAD }; });

  var proyectosPorId = {};
  listarRegistros('PROYECTO', {}).forEach(function (p) { proyectosPorId[p.ID] = p; });
  var ESTADOS_DECISION_CIERRE = ['Aprobada', 'Rechazada', 'Sustituida'];
  var decisiones = listarRegistrosSeguro_('DECISION', { ACTIVO: 'SÍ' })
    .filter(function (d) { return d.RESPONSABLE_ID === yo.ID && ESTADOS_DECISION_CIERRE.indexOf(d.ESTADO) === -1; })
    .map(function (d) {
      var proyecto = proyectosPorId[d.PROYECTO_ID];
      return { id: d.ID, titulo: d.TITULO, estado: d.ESTADO, proyectoId: d.PROYECTO_ID, proyectoNombre: proyecto ? proyecto.NOMBRE : d.PROYECTO_ID };
    });

  return serializarParaCliente_({
    sinPersona: false,
    nombre: yo.NOMBRE,
    tareas: tareas,
    incidencias: incidencias,
    decisiones: decisiones
  });
}

function abrirMiTrabajo() {
  var html = HtmlService.createTemplateFromFile('MiTrabajo')
    .evaluate()
    .setWidth(420)
    .setHeight(560);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Mi trabajo');
}
