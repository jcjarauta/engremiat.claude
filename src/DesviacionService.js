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

function listarDesviacionesProcesos_(filtro) {
  filtro = filtro || {};
  var procesos = enriquecerConDesviacion_(listarRegistros('PROCESO', { ACTIVO: 'SÍ' }));

  return procesos.filter(function (proceso) {
    if (filtro.faseProduccion && proceso.FASE_PRODUCCION !== filtro.faseProduccion) return false;
    if (filtro.responsableId && proceso.RESPONSABLE_ID !== filtro.responsableId) return false;
    return true;
  });
}

function listarDesviacionesTareas_(filtro) {
  filtro = filtro || {};
  var tareas = enriquecerConDesviacion_(listarRegistros('TAREA', { ACTIVO: 'SÍ' }));

  return tareas.filter(function (tarea) {
    if (filtro.responsableId && tarea.RESPONSABLE_ID !== filtro.responsableId) return false;
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

  return Object.assign({ tipo: 'DESVIACION' }, construirBloqueDesviacion_(procesos, tareas));
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
  return { fases: fases, personas: personas };
}

function obtenerDatosGanttPlanReal(filtro) {
  filtro = filtro || {};

  var procesos = listarRegistros('PROCESO', { ACTIVO: 'SÍ' }).filter(function (proceso) {
    if (!proceso.FECHA_INICIO_PLAN || !proceso.FECHA_FIN_PLAN) return false;
    if (filtro.faseProduccion && proceso.FASE_PRODUCCION !== filtro.faseProduccion) return false;
    if (filtro.responsableId && proceso.RESPONSABLE_ID !== filtro.responsableId) return false;
    return true;
  });

  var nombresPersona = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (persona) {
    nombresPersona[persona.ID] = persona.NOMBRE;
  });

  var filas = procesos.map(function (proceso) {
    return {
      id: proceso.ID,
      nombre: proceso.NOMBRE,
      fase: proceso.FASE_PRODUCCION || '',
      responsable: nombresPersona[proceso.RESPONSABLE_ID] || '',
      fechaInicioPlan: proceso.FECHA_INICIO_PLAN,
      fechaFinPlan: proceso.FECHA_FIN_PLAN,
      fechaInicioReal: proceso.FECHA_INICIO_REAL || null,
      fechaFinReal: proceso.FECHA_FIN_REAL || null
    };
  }).sort(function (a, b) { return new Date(a.fechaInicioPlan) - new Date(b.fechaInicioPlan); });

  return serializarParaCliente_({ filas: filas });
}

function abrirGanttPlanReal() {
  var html = HtmlService.createTemplateFromFile('GanttPlanReal')
    .evaluate()
    .setWidth(920)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, 'Gantt: plan vs. real');
}
