/**
 * Panel de campaña (vista global): arbol Proyecto->Producto->Proceso->
 * Tarea de una campana, pensado como capa de navegacion/orquestacion
 * sobre los formularios ya existentes -- no sustituye ningun
 * formulario, solo evita perder de vista la jerarquia mientras se
 * trabaja con ellos (crear/editar) via la cadena hijo/hermano ya
 * construida en FormularioGenerico.html.
 *
 * Reutiliza sin duplicar: listarProyectosDeCampana/
 * listarProductosDeProyecto/listarProcesosDeProducto/
 * listarTareasDeProceso, todas ya existentes (ReportService.js las usa
 * igual para los informes).
 */

function obtenerOpcionesCampanasActivas() {
  return listarRegistros('CAMPANA', { ACTIVO: 'SÍ' }).map(function (campana) {
    return { id: campana.ID, etiqueta: campana.NOMBRE };
  });
}

function obtenerArbolCampana(campanaId) {
  if (!campanaId) return null;

  var campana = obtenerCampana(campanaId);
  if (!campana) {
    throw new Error('No existe una campaña con id ' + campanaId + '.');
  }

  var proyectos = listarProyectosDeCampana(campanaId).map(function (proyecto) {
    var productos = listarProductosDeProyecto(proyecto.ID).map(function (producto) {
      var procesos = listarProcesosDeProducto(producto.ID).map(function (proceso) {
        var tareas = listarTareasDeProceso(proceso.ID).map(function (tarea) {
          return { id: tarea.ID, nombre: tarea.NOMBRE, estado: tarea.ESTADO };
        });
        return { id: proceso.ID, nombre: proceso.NOMBRE, estado: proceso.ESTADO, tareas: tareas };
      });
      return { id: producto.ID, nombre: producto.NOMBRE, estado: producto.ESTADO, procesos: procesos };
    });
    return { id: proyecto.ID, nombre: proyecto.NOMBRE, estado: proyecto.ESTADO, productos: productos };
  });

  return {
    campana: { id: campana.ID, nombre: campana.NOMBRE, estado: campana.ESTADO },
    proyectos: proyectos
  };
}

function abrirPanelCampana() {
  var html = HtmlService.createTemplateFromFile('PanelCampana')
    .evaluate()
    .setTitle('Gestión de campaña')
    .setWidth(440);
  SpreadsheetApp.getUi().showSidebar(html);
}
