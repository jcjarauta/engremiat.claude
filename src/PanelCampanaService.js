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

function obtenerOpcionesCampanasActivas(incluirPruebas) {
  var campanas = filtrarPorNivelDato_('CAMPANA', listarRegistros('CAMPANA', { ACTIVO: 'SÍ' }), incluirPruebas);
  return campanas.map(function (campana) {
    return { id: campana.ID, etiqueta: aplicarSufijoNivelDato_('CAMPANA', campana, campana.NOMBRE) };
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

  /*
   * Fase 1 (ver conversacion -- "cada parte del formulario deberia tener
   * una forma de acceder a la barra lateral... para no repetir
   * estructura del sheet"): las relaciones N:M puras que cuelgan de
   * Tarea (Responsable/Recurso/Material/Ejecucion) y las entidades con
   * FK fija que cuelgan de Proyecto (Decision) o de cualquier nivel
   * (Incidencia) se muestran dentro del propio nodo, en vez de exigir
   * un "Editar X" suelto del menu sin contexto.
   */
  var nombresRecurso_ = {};
  listarRegistros('RECURSO', {}).forEach(function (r) { nombresRecurso_[r.ID] = r.NOMBRE; });
  var recursosPorTarea = {};
  listarRegistros('TAREA_RECURSO', { ACTIVO: 'SÍ' }).forEach(function (tr) {
    if (!recursosPorTarea[tr.TAREA_ID]) recursosPorTarea[tr.TAREA_ID] = [];
    recursosPorTarea[tr.TAREA_ID].push({ id: tr.RECURSO_ID, nombre: nombresRecurso_[tr.RECURSO_ID] || tr.RECURSO_ID, tipoUso: tr.TIPO_USO });
  });

  /*
   * MATERIAL/TAREA_MATERIAL son del modulo COMPRAS -- en un cliente sin
   * ese modulo esas hojas no existen (mismo caso que el fk CLIENTE_ID en
   * PROYECTO, ver conversacion anterior). Envuelto en try/catch para que
   * un cliente solo-CORE siga viendo el resto del arbol sin romperse.
   */
  var materialesPorTarea = {};
  try {
    var nombresMaterial_ = {};
    listarRegistros('MATERIAL', {}).forEach(function (m) { nombresMaterial_[m.ID] = m.NOMBRE; });
    listarRegistros('TAREA_MATERIAL', { ACTIVO: 'SÍ' }).forEach(function (tm) {
      if (!materialesPorTarea[tm.TAREA_ID]) materialesPorTarea[tm.TAREA_ID] = [];
      materialesPorTarea[tm.TAREA_ID].push({
        id: tm.MATERIAL_ID, nombre: nombresMaterial_[tm.MATERIAL_ID] || tm.MATERIAL_ID,
        cantidadPrevista: tm.CANTIDAD_PREVISTA, unidad: tm.UNIDAD
      });
    });
  } catch (eMaterial_) { /* modulo COMPRAS no instalado en este cliente */ }

  var ejecucionesPorTarea = {};
  listarRegistros('EJECUCION_TAREA', { ACTIVO: 'SÍ' }).forEach(function (ej) {
    if (!ejecucionesPorTarea[ej.TAREA_ID]) ejecucionesPorTarea[ej.TAREA_ID] = [];
    ejecucionesPorTarea[ej.TAREA_ID].push({
      id: ej.ID, responsableNombre: nombresPersona[ej.RESPONSABLE_ID] || '',
      estado: ej.ESTADO, resultado: ej.RESULTADO || ''
    });
  });

  var decisionesPorProyecto = {};
  listarRegistros('DECISION', { ACTIVO: 'SÍ' }).forEach(function (d) {
    if (!decisionesPorProyecto[d.PROYECTO_ID]) decisionesPorProyecto[d.PROYECTO_ID] = [];
    decisionesPorProyecto[d.PROYECTO_ID].push({ id: d.ID, titulo: d.TITULO, estado: d.ESTADO });
  });

  /*
   * Incidencia se ancla al nivel MAS PROFUNDO que tenga relleno (TAREA_ID
   * si existe, si no PROCESO_ID, etc.) -- el mismo criterio que ya usa
   * NIVELES_JERARQUIA_INCIDENCIA_ (Ids.js) para saber "de que trata"
   * realmente una incidencia, en vez de fiarse solo de la etiqueta libre
   * NIVEL_INCIDENCIA.
   */
  var incidenciasPorNivelId_ = { CAMPANA_ID: {}, PROYECTO_ID: {}, PRODUCTO_ID: {}, PROCESO_ID: {}, TAREA_ID: {} };
  listarRegistros('INCIDENCIA', { ACTIVO: 'SÍ' }).forEach(function (inc) {
    var campoNivel = ['TAREA_ID', 'PROCESO_ID', 'PRODUCTO_ID', 'PROYECTO_ID', 'CAMPANA_ID'].filter(function (c) { return inc[c]; })[0];
    if (!campoNivel) return;
    var mapa = incidenciasPorNivelId_[campoNivel];
    var id = inc[campoNivel];
    if (!mapa[id]) mapa[id] = [];
    mapa[id].push({ id: inc.ID, titulo: inc.TITULO, estado: inc.ESTADO });
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
            sobreasignado: false,
            responsables: responsablesTarea,
            recursos: recursosPorTarea[tarea.ID] || [],
            materiales: materialesPorTarea[tarea.ID] || [],
            ejecuciones: ejecucionesPorTarea[tarea.ID] || [],
            incidencias: incidenciasPorNivelId_.TAREA_ID[tarea.ID] || [],
            proyectoId: proyecto.ID,
            productoId: producto.ID,
            procesoId: proceso.ID
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
          tareas: tareas,
          incidencias: incidenciasPorNivelId_.PROCESO_ID[proceso.ID] || [],
          proyectoId: proyecto.ID,
          productoId: producto.ID
        };
        registrarAsignacion_(asignacionesProcesoPorPersona, proceso.RESPONSABLE_ID, nodoProceso, proceso.FECHA_INICIO_PLAN, proceso.FECHA_FIN_PLAN);
        return nodoProceso;
      });
      return {
        id: producto.ID,
        nombre: producto.NOMBRE,
        estado: producto.ESTADO,
        responsable: nombresPersona[producto.RESPONSABLE_ID] || '',
        procesos: procesos,
        incidencias: incidenciasPorNivelId_.PRODUCTO_ID[producto.ID] || [],
        proyectoId: proyecto.ID
      };
    });
    return {
      id: proyecto.ID,
      nombre: proyecto.NOMBRE,
      estado: proyecto.ESTADO,
      responsable: nombresPersona[proyecto.RESPONSABLE_ID] || '',
      productos: productos,
      decisiones: decisionesPorProyecto[proyecto.ID] || [],
      incidencias: incidenciasPorNivelId_.PROYECTO_ID[proyecto.ID] || []
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
      fechaFinPlan: campana.FECHA_FIN_PLAN,
      incidencias: incidenciasPorNivelId_.CAMPANA_ID[campana.ID] || []
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
 * Export CSV del arbol completo, reutilizando construirCsvConBom_ /
 * abrirDialogoDescargaCSV_ (DesviacionService.js) -- mismo exportador
 * compartido que usa el Gantt, en vez de duplicar la logica de BOM/
 * base64/dialogo por tercera vez.
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

  var nombre = 'CAMPANA_' + arbol.campana.nombre.replace(/[^a-zA-Z0-9]+/g, '_') + '_' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('INFORME', nombre, 'EXPORTAR_ARBOL_CAMPANA', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombre, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarArbolCampanaCSV(campanaId) {
  var resultado = exportarArbolCampanaCSV(campanaId);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}

/*
 * preseleccionCampanaId (opcional): igual que preseleccionCampana en
 * abrirGanttPlanReal (DesviacionService.js) -- se pasa DIRECTO en el
 * template, no por un round-trip de guardarUltimaCampanaPanel() +
 * obtenerUltimaCampanaPanel() desde el cliente. Ese round-trip via
 * PropertiesService (usado antes desde abrirPanelCampanaEnCampana) daba
 * problemas intermitentes en vivo (el panel se abria vacio en vez de con
 * la campaña ya elegida) -- probablemente una condicion de carrera entre
 * el guardado server-side y la lectura async posterior desde el cliente
 * recien cargado. Pasarlo en el propio render es sincrono y no depende
 * de ninguna llamada adicional.
 */
function abrirPanelCampana(preseleccionCampanaId) {
  var template = HtmlService.createTemplateFromFile('PanelCampana');
  template.preseleccionCampanaId = JSON.stringify(preseleccionCampanaId || null);
  var html = template.evaluate()
    .setTitle('Gestión de campaña')
    .setWidth(440);
  SpreadsheetApp.getUi().showSidebar(html);
}

/*
 * Abre el Panel de Campaña ya preseleccionado en una campaña concreta
 * (ver conversacion -- "link para entrar en el árbol del producto",
 * desde la vista de Fases por producto del Gantt). Tambien guarda la
 * eleccion como "ultima campaña" para que la proxima vez que se abra el
 * panel SIN preseleccion (menu, sin campanaId) recuerde esta.
 */
function abrirPanelCampanaEnCampana(campanaId) {
  if (campanaId) guardarUltimaCampanaPanel(campanaId);
  abrirPanelCampana(campanaId);
}
