/**
 * DesviacionService.gs -- calculo de la desviacion entre planificacion
 * teorica (FECHA_INICIO_PLAN/FECHA_FIN_PLAN) y ejecucion real
 * (FECHA_INICIO_REAL/FECHA_FIN_REAL) de PROCESO y TAREA.
 *
 * Mismo criterio de diseno que DashboardService.js/ReportService.js: se
 * calcula en vivo sobre las hojas existentes, sin materializar ni
 * persistir nada. Solo se mide lo que ya ha terminado (FECHA_FIN_REAL
 * presente) -- no tiene sentido calcular una desviacion sobre algo que
 * todavia no ha pasado.
 */

function diferenciaDiasFechas_(fechaPlan, fechaReal) {
  if (!fechaPlan || !fechaReal) return null;

  var plan = new Date(fechaPlan);
  var real = new Date(fechaReal);
  plan.setHours(0, 0, 0, 0);
  real.setHours(0, 0, 0, 0);

  var msPorDia = 24 * 60 * 60 * 1000;
  return Math.round((real - plan) / msPorDia);
}

function calcularDesviacionRegistro_(registro) {
  return {
    DIAS_DESVIACION_INICIO: diferenciaDiasFechas_(registro.FECHA_INICIO_PLAN, registro.FECHA_INICIO_REAL),
    DIAS_DESVIACION_FIN: diferenciaDiasFechas_(registro.FECHA_FIN_PLAN, registro.FECHA_FIN_REAL)
  };
}

function enriquecerConDesviacion_(lista) {
  return lista
    .filter(function (registro) { return !!registro.FECHA_FIN_REAL; })
    .map(function (registro) {
      return Object.assign({}, registro, calcularDesviacionRegistro_(registro));
    });
}

function calcularDesviacionAgregada_(listaConDesviacion, agruparPorCampo) {
  var grupos = {};

  listaConDesviacion.forEach(function (registro) {
    var clave = registro[agruparPorCampo] || '(sin ' + agruparPorCampo + ')';
    if (!grupos[clave]) {
      grupos[clave] = { clave: clave, casos: 0, sumaDesviacionFin: 0, maxDesviacionFin: null, casosConRetraso: 0 };
    }
    var g = grupos[clave];
    g.casos++;
    if (registro.DIAS_DESVIACION_FIN !== null) {
      g.sumaDesviacionFin += registro.DIAS_DESVIACION_FIN;
      g.maxDesviacionFin = g.maxDesviacionFin === null
        ? registro.DIAS_DESVIACION_FIN
        : Math.max(g.maxDesviacionFin, registro.DIAS_DESVIACION_FIN);
      if (registro.DIAS_DESVIACION_FIN > 0) g.casosConRetraso++;
    }
  });

  return Object.keys(grupos).map(function (clave) {
    var g = grupos[clave];
    return {
      grupo: clave,
      casos: g.casos,
      diasDesviacionMedia: g.casos > 0 ? Math.round((g.sumaDesviacionFin / g.casos) * 10) / 10 : 0,
      diasDesviacionMaxima: g.maxDesviacionFin === null ? 0 : g.maxDesviacionFin,
      casosConRetraso: g.casosConRetraso
    };
  }).sort(function (a, b) { return b.diasDesviacionMedia - a.diasDesviacionMedia; });
}

/**
 * PROCESO/TAREA no tienen CAMPANA_ID propio -- solo llegan a una campaña
 * atravesando PRODUCTO_ID -> PROYECTO_PRODUCTO (activa) -> PROYECTO_ID ->
 * PROYECTO.CAMPANA_ID. Un producto reutilizado podria pertenecer a mas
 * de un proyecto/campaña; por simplicidad (igual que otras resoluciones
 * de contexto ya existentes en el sistema, ver PROCESO_PREDECESOR) se
 * toma la primera relacion activa encontrada. Prefetch en 3 pasadas
 * para evitar N+1 al recorrer todos los procesos/tareas.
 */
function construirMapaCampanaPorProducto_() {
  var proyectoPorProducto = {};
  listarRegistros('PROYECTO_PRODUCTO', { ACTIVO: 'SÍ' }).forEach(function (rel) {
    if (!proyectoPorProducto[rel.PRODUCTO_ID]) proyectoPorProducto[rel.PRODUCTO_ID] = rel.PROYECTO_ID;
  });

  var campanaPorProyecto = {};
  var nombreCampanaPorId = {};
  listarRegistros('PROYECTO', {}).forEach(function (proyecto) {
    campanaPorProyecto[proyecto.ID] = proyecto.CAMPANA_ID;
  });
  listarRegistros('CAMPANA', {}).forEach(function (campana) {
    nombreCampanaPorId[campana.ID] = campana.NOMBRE;
  });

  var campanaPorProducto = {};
  Object.keys(proyectoPorProducto).forEach(function (productoId) {
    var proyectoId = proyectoPorProducto[productoId];
    var campanaId = campanaPorProyecto[proyectoId];
    if (campanaId) {
      campanaPorProducto[productoId] = { id: campanaId, nombre: nombreCampanaPorId[campanaId] || campanaId };
    }
  });

  return campanaPorProducto;
}

function enriquecerConCampana_(lista, campanaPorProducto) {
  return lista.map(function (registro) {
    var campana = campanaPorProducto[registro.PRODUCTO_ID];
    return Object.assign({}, registro, {
      CAMPANA_ID: campana ? campana.id : '',
      CAMPANA_NOMBRE: campana ? campana.nombre : '(sin campaña)'
    });
  });
}

function listarDesviacionesProcesos_(filtro) {
  filtro = filtro || {};
  var procesos = enriquecerConDesviacion_(listarRegistros('PROCESO', { ACTIVO: 'SÍ' }));

  if (filtro.campanaId) {
    procesos = enriquecerConCampana_(procesos, construirMapaCampanaPorProducto_());
  }

  return procesos.filter(function (proceso) {
    if (filtro.faseProduccion && proceso.FASE_PRODUCCION !== filtro.faseProduccion) return false;
    if (filtro.responsableId && proceso.RESPONSABLE_ID !== filtro.responsableId) return false;
    if (filtro.campanaId && proceso.CAMPANA_ID !== filtro.campanaId) return false;
    return true;
  });
}

function listarDesviacionesTareas_(filtro) {
  filtro = filtro || {};
  var tareas = enriquecerConDesviacion_(listarRegistros('TAREA', { ACTIVO: 'SÍ' }));

  if (filtro.campanaId) {
    var productoPorProceso = {};
    listarRegistros('PROCESO', {}).forEach(function (proceso) {
      productoPorProceso[proceso.ID] = proceso.PRODUCTO_ID;
    });
    var campanaPorProducto = construirMapaCampanaPorProducto_();
    tareas = tareas.map(function (tarea) {
      return Object.assign({}, tarea, { PRODUCTO_ID: productoPorProceso[tarea.PROCESO_ID] });
    });
    tareas = enriquecerConCampana_(tareas, campanaPorProducto);
  }

  return tareas.filter(function (tarea) {
    if (filtro.responsableId && tarea.RESPONSABLE_ID !== filtro.responsableId) return false;
    if (filtro.campanaId && tarea.CAMPANA_ID !== filtro.campanaId) return false;
    return true;
  });
}

function construirBloqueDesviacion_(procesosConDesviacion, tareasConDesviacion) {
  return {
    procesosMedidos: procesosConDesviacion.length,
    tareasMedidas: tareasConDesviacion.length,
    procesosPorFase: calcularDesviacionAgregada_(procesosConDesviacion, 'FASE_PRODUCCION'),
    procesosPorResponsable: calcularDesviacionAgregada_(procesosConDesviacion, 'RESPONSABLE_ID'),
    tareasPorResponsable: calcularDesviacionAgregada_(tareasConDesviacion, 'RESPONSABLE_ID')
  };
}

function generarInformeDesviacion(filtro) {
  var procesos = listarDesviacionesProcesos_(filtro);
  var tareas = listarDesviacionesTareas_(filtro);

  var procesosConCampana = enriquecerConCampana_(procesos, construirMapaCampanaPorProducto_());

  return Object.assign(
    { tipo: 'DESVIACION' },
    construirBloqueDesviacion_(procesos, tareas),
    { procesosPorCampana: calcularDesviacionAgregada_(procesosConCampana, 'CAMPANA_NOMBRE') }
  );
}

/**
 * Vista Gantt de solo lectura: plan (FECHA_INICIO_PLAN/FECHA_FIN_PLAN)
 * frente a real (FECHA_INICIO_REAL/FECHA_FIN_REAL) por proceso. Solo
 * incluye procesos con fechas de plan (sin eso no hay barra que dibujar);
 * la barra real se omite si el proceso aun no tiene fechas reales.
 */
function obtenerOpcionesFiltroGantt() {
  var fases = obtenerCatalogo('CFG_FASE_PRODUCCION');
  var personas = listarRegistros('PERSONA_EQUIPO', { ACTIVO: 'SÍ' }).map(function (persona) {
    return { id: persona.ID, etiqueta: persona.NOMBRE };
  });
  var campanas = listarRegistros('CAMPANA', { ACTIVO: 'SÍ' }).map(function (campana) {
    return { id: campana.ID, etiqueta: campana.NOMBRE };
  });
  var proyectos = listarRegistros('PROYECTO', { ACTIVO: 'SÍ' }).map(function (proyecto) {
    return { id: proyecto.ID, etiqueta: proyecto.NOMBRE };
  });
  return { fases: fases, personas: personas, campanas: campanas, proyectos: proyectos };
}

/**
 * Contexto jerarquico de un producto (proyecto+campaña a los que
 * pertenece), para el Gantt y su exportacion -- mismo tipo de
 * resolucion que construirMapaCampanaPorProducto_ pero con el proyecto
 * tambien resuelto, ya que aqui hace falta mostrar/filtrar por ambos
 * niveles. Se mantiene separada de construirMapaCampanaPorProducto_
 * (usada por el informe de Desviacion, ya verificado) para no tocar esa
 * logica ya probada.
 */
function construirMapaContextoPorProducto_() {
  var proyectoPorProducto = {};
  listarRegistros('PROYECTO_PRODUCTO', { ACTIVO: 'SÍ' }).forEach(function (rel) {
    if (!proyectoPorProducto[rel.PRODUCTO_ID]) proyectoPorProducto[rel.PRODUCTO_ID] = rel.PROYECTO_ID;
  });

  var proyectos = {};
  listarRegistros('PROYECTO', {}).forEach(function (proyecto) { proyectos[proyecto.ID] = proyecto; });
  var campanas = {};
  listarRegistros('CAMPANA', {}).forEach(function (campana) { campanas[campana.ID] = campana; });

  var contexto = {};
  Object.keys(proyectoPorProducto).forEach(function (productoId) {
    var proyecto = proyectos[proyectoPorProducto[productoId]];
    if (!proyecto) return;
    var campana = campanas[proyecto.CAMPANA_ID];
    contexto[productoId] = {
      proyectoId: proyecto.ID,
      proyectoNombre: proyecto.NOMBRE,
      campanaId: proyecto.CAMPANA_ID,
      campanaNombre: campana ? campana.NOMBRE : proyecto.CAMPANA_ID
    };
  });

  return contexto;
}

/**
 * Fuente unica de filas para el Gantt (vista) y su exportacion CSV --
 * misma logica de filtrado y de detalle en ambos casos, para que lo que
 * se ve y lo que se exporta no puedan divergir.
 */
/*
 * "En riesgo" (hallazgo de la revision del Gantt): un proceso que sigue
 * abierto y ya paso su FECHA_FIN_PLAN no aparecia con ninguna senal --
 * calcularDesviacionRegistro_ solo mide lo ya terminado (FECHA_FIN_REAL
 * presente). Esto es un calculo distinto y complementario: dias desde
 * que vencio el plazo sin haber terminado, solo si no esta ya en un
 * estado cerrado.
 */
var ESTADOS_CERRADOS_PROCESO_MVP = ['Completado', 'Cancelado'];

function calcularRiesgoRegistro_(registro) {
  if (registro.FECHA_FIN_REAL) return null;
  if (ESTADOS_CERRADOS_PROCESO_MVP.indexOf(registro.ESTADO) !== -1) return null;
  if (!registro.FECHA_FIN_PLAN) return null;

  var hoy = new Date();
  var plan = new Date(registro.FECHA_FIN_PLAN);
  hoy.setHours(0, 0, 0, 0);
  plan.setHours(0, 0, 0, 0);

  var dias = Math.round((hoy - plan) / (24 * 60 * 60 * 1000));
  return dias > 0 ? dias : null;
}

function obtenerFilasGanttDetalladas_(filtro) {
  filtro = filtro || {};

  var contextoPorProducto = construirMapaContextoPorProducto_();

  var procesos = listarRegistros('PROCESO', { ACTIVO: 'SÍ' }).filter(function (proceso) {
    if (!proceso.FECHA_INICIO_PLAN || !proceso.FECHA_FIN_PLAN) return false;
    if (filtro.faseProduccion && proceso.FASE_PRODUCCION !== filtro.faseProduccion) return false;
    if (filtro.responsableId && proceso.RESPONSABLE_ID !== filtro.responsableId) return false;
    var contexto = contextoPorProducto[proceso.PRODUCTO_ID];
    if (filtro.campanaId && (!contexto || contexto.campanaId !== filtro.campanaId)) return false;
    if (filtro.proyectoId && (!contexto || contexto.proyectoId !== filtro.proyectoId)) return false;
    return true;
  });

  var nombresPersona = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (persona) {
    nombresPersona[persona.ID] = persona.NOMBRE;
  });
  var nombresProducto = {};
  listarRegistros('PRODUCTO', {}).forEach(function (producto) {
    nombresProducto[producto.ID] = producto.NOMBRE;
  });

  return procesos.map(function (proceso) {
    var contexto = contextoPorProducto[proceso.PRODUCTO_ID] || {};
    var desviacion = calcularDesviacionRegistro_(proceso);
    return {
      id: proceso.ID,
      nombre: proceso.NOMBRE,
      fase: proceso.FASE_PRODUCCION || '',
      estado: proceso.ESTADO || '',
      responsable: nombresPersona[proceso.RESPONSABLE_ID] || '',
      productoNombre: nombresProducto[proceso.PRODUCTO_ID] || '',
      proyectoNombre: contexto.proyectoNombre || '',
      campanaNombre: contexto.campanaNombre || '',
      fechaInicioPlan: proceso.FECHA_INICIO_PLAN,
      fechaFinPlan: proceso.FECHA_FIN_PLAN,
      fechaInicioReal: proceso.FECHA_INICIO_REAL || null,
      fechaFinReal: proceso.FECHA_FIN_REAL || null,
      duracionPrevistaDias: proceso.DURACION_PREVISTA_DIAS === '' || proceso.DURACION_PREVISTA_DIAS === undefined ? null : Number(proceso.DURACION_PREVISTA_DIAS),
      duracionRealDias: proceso.DURACION_REAL_DIAS === '' || proceso.DURACION_REAL_DIAS === undefined ? null : Number(proceso.DURACION_REAL_DIAS),
      diasDesviacionInicio: desviacion.DIAS_DESVIACION_INICIO,
      diasDesviacionFin: desviacion.DIAS_DESVIACION_FIN,
      diasRiesgo: calcularRiesgoRegistro_(proceso)
    };
  }).sort(function (a, b) { return new Date(a.fechaInicioPlan) - new Date(b.fechaInicioPlan); });
}

function obtenerDatosGanttPlanReal(filtro) {
  return serializarParaCliente_({ filas: obtenerFilasGanttDetalladas_(filtro) });
}

/**
 * Formatea una fecha con la zona horaria del script (no toISOString(),
 * que convierte a UTC y desplaza un dia hacia atras en cualquier huso
 * horario positivo -- bug real detectado al revisar la primera
 * exportacion: FECHA_INICIO_PLAN=2026-10-01 salia como "2026-09-30").
 */
function formatearFechaCsv_(fecha) {
  if (!fecha) return '';
  return Utilities.formatDate(new Date(fecha), Session.getScriptTimeZone() || 'Europe/Madrid', 'yyyy-MM-dd');
}

/**
 * Celda de CSV: los valores numericos van SIN comillas (para que Excel/
 * Sheets los reconozca como numero y se puedan sumar/promediar
 * directamente en una tabla dinamica); el texto va entre comillas,
 * escapando comillas internas.
 */
function celdaCsv_(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  if (typeof valor === 'number') return String(valor);
  return '"' + String(valor).replace(/"/g, '""') + '"';
}

/*
 * Exportador CSV compartido (antes duplicado entre el Gantt y el arbol
 * de campaña): construye el texto CSV con BOM UTF-8 (sin el, Excel
 * interpreta los acentos con la codificacion regional en vez de UTF-8,
 * mostrando caracteres corruptos) y el dialogo de descarga base64.
 * Reutilizado tambien por ReportService.js para el disparo de descarga
 * (su construccion de contenido es distinta -- clave/valor plano, no
 * tabular -- asi que solo comparte el dialogo, no construirCsvConBom_).
 */
function construirCsvConBom_(encabezados, filas) {
  var csv = [encabezados.map(celdaCsv_).join(',')]
    .concat(filas.map(function (fila) { return fila.map(celdaCsv_).join(','); }))
    .join('\n');
  var BOM_UTF8 = String.fromCharCode(0xFEFF);
  return BOM_UTF8 + csv;
}

function abrirDialogoDescargaCSV_(nombreArchivo, contenidoCsv) {
  var b64 = Utilities.base64Encode(contenidoCsv, Utilities.Charset.UTF_8);
  var html = '<html><body style="font-family:Arial,sans-serif;padding:16px;">' +
    '<p>Generando descarga de <strong>' + escaparHtmlServer_(nombreArchivo) + '</strong>...</p>' +
    '<a id="dl" download="' + escaparHtmlServer_(nombreArchivo) + '" href="data:text/csv;charset=utf-8;base64,' + b64 + '">Si la descarga no comienza, haz clic aqui</a>' +
    '<script>document.getElementById("dl").click();setTimeout(function(){ google.script.host.close(); }, 800);</script>' +
    '</body></html>';
  var output = HtmlService.createHtmlOutput(html).setWidth(360).setHeight(120);
  SpreadsheetApp.getUi().showModalDialog(output, 'Descargando CSV');
}

function exportarGanttCSV(filtro) {
  var filas = obtenerFilasGanttDetalladas_(filtro);
  var encabezados = [
    'ID', 'Campaña', 'Proyecto', 'Producto', 'Proceso', 'Fase', 'Responsable', 'Estado',
    'Fecha inicio plan', 'Fecha fin plan', 'Fecha inicio real', 'Fecha fin real',
    'Duración prevista (días)', 'Duración real (días)',
    'Desviación inicio (días)', 'Desviación fin (días)', 'Riesgo (días vencidos sin terminar)'
  ];
  var filasCsv = filas.map(function (f) {
    return [
      f.id, f.campanaNombre, f.proyectoNombre, f.productoNombre, f.nombre, f.fase, f.responsable, f.estado,
      formatearFechaCsv_(f.fechaInicioPlan), formatearFechaCsv_(f.fechaFinPlan),
      formatearFechaCsv_(f.fechaInicioReal), formatearFechaCsv_(f.fechaFinReal),
      f.duracionPrevistaDias, f.duracionRealDias,
      f.diasDesviacionInicio, f.diasDesviacionFin, f.diasRiesgo
    ];
  });

  var nombre = 'GANTT_PLAN_REAL_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('INFORME', nombre, 'EXPORTAR_GANTT', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombre, contenidoCsv: construirCsvConBom_(encabezados, filasCsv) };
}

function abrirDialogoExportarGanttCSV(filtro) {
  var resultado = exportarGanttCSV(filtro);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}

/*
 * campanaId (opcional): al llegar desde el boton "Ver Gantt" del panel
 * de campana, preselecciona ese filtro en vez de abrir sin filtrar.
 */
function abrirGanttPlanReal(campanaId) {
  var template = HtmlService.createTemplateFromFile('GanttPlanReal');
  template.preseleccionCampana = campanaId || '';
  var html = template.evaluate().setWidth(920).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, 'Gantt: plan vs. real');
}
