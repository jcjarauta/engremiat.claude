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

  var nombresPersona = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (persona) {
    nombresPersona[persona.ID] = persona.NOMBRE;
  });

  var responsablesPorTarea = {};
  listarRegistros('TAREA_RESPONSABLE', { ACTIVO: 'SÍ' }).forEach(function (asignacion) {
    var nombre = nombresPersona[asignacion.PERSONA_EQUIPO_ID] || asignacion.PERSONA_EQUIPO_ID;
    if (!responsablesPorTarea[asignacion.TAREA_ID]) responsablesPorTarea[asignacion.TAREA_ID] = [];
    responsablesPorTarea[asignacion.TAREA_ID].push({ id: asignacion.PERSONA_EQUIPO_ID, nombre: nombre });
  });

  var contadores = { proyectos: 0, productos: 0, procesos: 0, tareas: 0 };

  function desviacionDe_(registro) {
    if (!registro.FECHA_FIN_REAL) return null;
    var dias = calcularDesviacionRegistro_(registro).DIAS_DESVIACION_FIN;
    return dias;
  }

  /*
   * Aviso de sobreasignacion (hallazgo "evitar solapamientos"): se
   * registra, por persona, cada proceso/tarea con sus fechas de plan
   * dentro de esta campaña, y al final se marcan como "sobreasignado"
   * los nodos cuyo rango se solapa con otro de la misma persona.
   * Deliberadamente simple (solapamiento de fechas, no % de dedicacion
   * como FUNC-REC-001/ASG-001 en IntegrityService.js) -- responde
   * directamente a "¿puede esta persona estar en dos sitios a la vez?",
   * que es la pregunta que se hace al construir el calendario aqui.
   *
   * Importante: la comparacion es SOLO dentro del mismo nivel (proceso
   * contra proceso, tarea contra tarea) -- un proceso y su propia tarea
   * comparten fechas por diseño (la tarea ES el trabajo del proceso),
   * compararlos entre niveles daba un falso positivo permanente en
   * cualquier tarea con el mismo responsable que su proceso padre.
   */
  var asignacionesProcesoPorPersona = {};
  var asignacionesTareaPorPersona = {};
  function registrarAsignacion_(mapa, personaId, nodo, fechaInicio, fechaFin) {
    if (!personaId || !fechaInicio || !fechaFin) return;
    var inicio = new Date(fechaInicio).getTime();
    var fin = new Date(fechaFin).getTime();
    if (isNaN(inicio) || isNaN(fin)) return;
    if (!mapa[personaId]) mapa[personaId] = [];
    mapa[personaId].push({ nodo: nodo, inicio: inicio, fin: fin });
  }

  var proyectos = listarProyectosDeCampana(campanaId).map(function (proyecto) {
    contadores.proyectos++;
    var productos = listarProductosDeProyecto(proyecto.ID).map(function (producto) {
      contadores.productos++;
      var procesos = listarProcesosDeProducto(producto.ID).map(function (proceso) {
        contadores.procesos++;
        var tareas = listarTareasDeProceso(proceso.ID).map(function (tarea) {
          contadores.tareas++;
          var responsablesTarea = responsablesPorTarea[tarea.ID] || [];
          var nodoTarea = {
            id: tarea.ID,
            nombre: tarea.NOMBRE,
            estado: tarea.ESTADO,
            responsable: responsablesTarea.map(function (r) { return r.nombre; }).join(', '),
            diasDesviacion: desviacionDe_(tarea),
            sobreasignado: false
          };
          responsablesTarea.forEach(function (r) {
            registrarAsignacion_(asignacionesTareaPorPersona, r.id, nodoTarea, tarea.FECHA_INICIO_PLAN, tarea.FECHA_FIN_PLAN);
          });
          return nodoTarea;
        });
        var nodoProceso = {
          id: proceso.ID,
          nombre: proceso.NOMBRE,
          estado: proceso.ESTADO,
          responsable: nombresPersona[proceso.RESPONSABLE_ID] || '',
          diasDesviacion: desviacionDe_(proceso),
          sobreasignado: false,
          tareas: tareas
        };
        registrarAsignacion_(asignacionesProcesoPorPersona, proceso.RESPONSABLE_ID, nodoProceso, proceso.FECHA_INICIO_PLAN, proceso.FECHA_FIN_PLAN);
        return nodoProceso;
      });
      return {
        id: producto.ID,
        nombre: producto.NOMBRE,
        estado: producto.ESTADO,
        responsable: nombresPersona[producto.RESPONSABLE_ID] || '',
        procesos: procesos
      };
    });
    return {
      id: proyecto.ID,
      nombre: proyecto.NOMBRE,
      estado: proyecto.ESTADO,
      responsable: nombresPersona[proyecto.RESPONSABLE_ID] || '',
      productos: productos
    };
  });

  function marcarSolapamientos_(mapa) {
    Object.keys(mapa).forEach(function (personaId) {
      var lista = mapa[personaId];
      for (var i = 0; i < lista.length; i++) {
        for (var j = i + 1; j < lista.length; j++) {
          if (lista[i].inicio <= lista[j].fin && lista[j].inicio <= lista[i].fin) {
            lista[i].nodo.sobreasignado = true;
            lista[j].nodo.sobreasignado = true;
          }
        }
      }
    });
  }
  marcarSolapamientos_(asignacionesProcesoPorPersona);
  marcarSolapamientos_(asignacionesTareaPorPersona);

  return serializarParaCliente_({
    campana: {
      id: campana.ID,
      nombre: campana.NOMBRE,
      estado: campana.ESTADO,
      fechaInicioPlan: campana.FECHA_INICIO_PLAN,
      fechaFinPlan: campana.FECHA_FIN_PLAN
    },
    contadores: contadores,
    proyectos: proyectos
  });
}

/*
 * Recordar la ultima campaña elegida (por usuario, no global) para no
 * tener que reseleccionarla cada vez que se reabre el sidebar.
 */
function guardarUltimaCampanaPanel(campanaId) {
  PropertiesService.getUserProperties().setProperty('PANEL_CAMPANA_ULTIMA', campanaId || '');
}

function obtenerUltimaCampanaPanel() {
  return PropertiesService.getUserProperties().getProperty('PANEL_CAMPANA_ULTIMA') || '';
}

/*
 * Export CSV del arbol completo -- mismo patron que exportarGanttCSV
 * (DesviacionService.js): fechas con formatearFechaCsv_ (zona horaria
 * del script, no toISOString()), celdaCsv_ para que los numeros no
 * vayan entre comillas, BOM UTF-8 para que Excel lea bien los acentos.
 */
function exportarArbolCampanaCSV(campanaId) {
  var arbol = obtenerArbolCampana(campanaId);
  if (!arbol) throw new Error('Elige una campaña antes de exportar.');

  var encabezados = ['Proyecto', 'Producto', 'Proceso', 'Tarea', 'Estado', 'Responsable', 'Desviación fin (días)'];
  var filas = [];

  arbol.proyectos.forEach(function (proyecto) {
    if (proyecto.productos.length === 0) {
      filas.push([proyecto.nombre, '', '', '', proyecto.estado, proyecto.responsable, '']);
      return;
    }
    proyecto.productos.forEach(function (producto) {
      if (producto.procesos.length === 0) {
        filas.push([proyecto.nombre, producto.nombre, '', '', producto.estado, producto.responsable, '']);
        return;
      }
      producto.procesos.forEach(function (proceso) {
        if (proceso.tareas.length === 0) {
          filas.push([proyecto.nombre, producto.nombre, proceso.nombre, '', proceso.estado, proceso.responsable, proceso.diasDesviacion]);
          return;
        }
        proceso.tareas.forEach(function (tarea) {
          filas.push([proyecto.nombre, producto.nombre, proceso.nombre, tarea.nombre, tarea.estado, tarea.responsable, tarea.diasDesviacion]);
        });
      });
    });
  });

  var csv = [encabezados.map(celdaCsv_).join(',')]
    .concat(filas.map(function (fila) { return fila.map(celdaCsv_).join(','); }))
    .join('\n');

  var BOM_UTF8 = String.fromCharCode(0xFEFF);
  var nombre = 'CAMPANA_' + arbol.campana.nombre.replace(/[^a-zA-Z0-9]+/g, '_') + '_' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('INFORME', nombre, 'EXPORTAR_ARBOL_CAMPANA', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombre, contenidoCsv: BOM_UTF8 + csv };
}

function abrirDialogoExportarArbolCampanaCSV(campanaId) {
  var resultado = exportarArbolCampanaCSV(campanaId);
  var b64 = Utilities.base64Encode(resultado.contenidoCsv, Utilities.Charset.UTF_8);
  var html = '<html><body style="font-family:Arial,sans-serif;padding:16px;">' +
    '<p>Generando descarga de <strong>' + escaparHtmlServer_(resultado.nombreArchivo) + '</strong>...</p>' +
    '<a id="dl" download="' + escaparHtmlServer_(resultado.nombreArchivo) + '" href="data:text/csv;charset=utf-8;base64,' + b64 + '">Si la descarga no comienza, haz clic aqui</a>' +
    '<script>document.getElementById("dl").click();setTimeout(function(){ google.script.host.close(); }, 800);</script>' +
    '</body></html>';
  var output = HtmlService.createHtmlOutput(html).setWidth(360).setHeight(120);
  SpreadsheetApp.getUi().showModalDialog(output, 'Descargando CSV');
}

function abrirPanelCampana() {
  var html = HtmlService.createTemplateFromFile('PanelCampana')
    .evaluate()
    .setTitle('Gestión de campaña')
    .setWidth(440);
  SpreadsheetApp.getUi().showSidebar(html);
}
