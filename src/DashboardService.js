/**
 * DashboardService.gs -- Fase 7: Panel operativo.
 * Agrega consultas de resumen y alertas sobre el repositorio ya cerrado (Fase 2)
 * sin duplicar logica de acceso a datos ni de negocio.
 *
 * Decision de diseno: no se crea una hoja 07_SEGUIMIENTO estatica (como sugeria
 * el roadmap original). El panel se calcula en vivo sobre las hojas existentes
 * via listarRegistros, igual que el resto del MVP evita duplicar datos.
 */

var ESTADOS_CERRADOS_MVP = {
  TAREA: ['Terminada', 'Cancelada'],
  DECISION: ['Aprobada', 'Rechazada', 'Sustituida'],
  INCIDENCIA: ['Resuelta', 'Cerrada', 'Cancelada']
};

function contarPorEstado_(entidad) {
  var registros = listarRegistros(entidad, { ACTIVO: 'SÍ' });
  var conteo = {};
  registros.forEach(function (registro) {
    var estado = registro.ESTADO || '(sin estado)';
    conteo[estado] = (conteo[estado] || 0) + 1;
  });
  return conteo;
}

function obtenerResumenGlobal() {
  return {
    CAMPANA: contarPorEstado_('CAMPANA'),
    PROYECTO: contarPorEstado_('PROYECTO'),
    PRODUCTO: contarPorEstado_('PRODUCTO'),
    PROCESO: contarPorEstado_('PROCESO'),
    TAREA: contarPorEstado_('TAREA'),
    DECISION: contarPorEstado_('DECISION'),
    INCIDENCIA: contarPorEstado_('INCIDENCIA')
  };
}

function listarTareasRetrasadas() {
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  var tareas = listarRegistros('TAREA', { ACTIVO: 'SÍ' });
  return tareas.filter(function (tarea) {
    if (ESTADOS_CERRADOS_MVP.TAREA.indexOf(tarea.ESTADO) !== -1) return false;
    if (!tarea.FECHA_FIN_PLAN) return false;
    var fechaFin = new Date(tarea.FECHA_FIN_PLAN);
    return fechaFin < hoy;
  });
}

function listarTareasBloqueadas() {
  return listarRegistros('TAREA', { ACTIVO: 'SÍ', ESTADO: 'Bloqueada' });
}
function listarTareasPospuestas() {
  return listarRegistros('TAREA', { ACTIVO: 'SÍ', ESTADO: 'Pospuesta' });
}

function listarDecisionesPendientes() {
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  var decisiones = listarRegistros('DECISION', { ACTIVO: 'SÍ' });
  return decisiones
    .filter(function (decision) {
      return ESTADOS_CERRADOS_MVP.DECISION.indexOf(decision.ESTADO) === -1;
    })
    .map(function (decision) {
      var vencida = false;
      if (decision.FECHA_LIMITE) {
        vencida = new Date(decision.FECHA_LIMITE) < hoy;
      }
      decision.VENCIDA = vencida;
      return decision;
    });
}

function listarIncidenciasAbiertas() {
  var incidencias = listarRegistros('INCIDENCIA', { ACTIVO: 'SÍ' });
  return incidencias.filter(function (incidencia) {
    return ESTADOS_CERRADOS_MVP.INCIDENCIA.indexOf(incidencia.ESTADO) === -1;
  });
}


function listarRecursosNoDisponibles() {
  return listarRegistros('PERSONA_EQUIPO', { ACTIVO: 'SÍ', DISPONIBILIDAD: 'No disponible' });
}

function listarSobreasignaciones() {
  var asignaciones = listarRegistros('TAREA_RESPONSABLE', { ACTIVO: 'SÍ', ESTADO: 'Activa' });
  var totales = {};
  asignaciones.forEach(function (a) {
    var pct = Number(a.PORCENTAJE_DEDICACION) || 0;
    totales[a.PERSONA_EQUIPO_ID] = (totales[a.PERSONA_EQUIPO_ID] || 0) + pct;
  });
  var resultado = [];
  Object.keys(totales).forEach(function (id) {
    if (totales[id] > 100) {
      resultado.push({ PERSONA_EQUIPO_ID: id, PORCENTAJE_TOTAL: totales[id] });
    }
  });
  return resultado;
}


function listarProductosSinProyecto() {
  var productos = listarRegistros('PRODUCTO', { ACTIVO: 'SÍ' });
  var vinculos = listarRegistros('PROYECTO_PRODUCTO', { ACTIVO: 'SÍ' });
  var productosVinculados = {};
  vinculos.forEach(function (v) { productosVinculados[v.PRODUCTO_ID] = true; });
  return productos.filter(function (p) { return !productosVinculados[p.ID]; });
}

function listarProcesosSinFechas() {
  var procesos = listarRegistros('PROCESO', { ACTIVO: 'SÍ' });
  return procesos.filter(function (p) { return !p.FECHA_INICIO_PLAN || !p.FECHA_FIN_PLAN; });
}

function listarRelacionesIncompletas() {
  var vinculos = listarRegistros('PROYECTO_PRODUCTO', { ACTIVO: 'SÍ' });
  return vinculos.filter(function (v) {
    var cantidad = Number(v.CANTIDAD_ASIGNADA);
    return !v.CANTIDAD_ASIGNADA || !(cantidad > 0);
  });
}

/*
 * Base de competencias (ver conversación -- "recurso sin técnico
 * disponible" como ejemplo del camino determinista antes de L6).
 * Consulta simple, sin IA: recursos que requieren una competencia
 * (RECURSO_COMPETENCIA) para la que NINGUNA persona activa la tiene
 * declarada (PERSONA_COMPETENCIA). Se consolida junto a las demás
 * excepciones del Panel operativo, no como informe aislado.
 */
function listarRecursosSinCompetenciaDisponible() {
  var recursosCompetencia = listarRegistros('RECURSO_COMPETENCIA', { ACTIVO: 'SÍ', ESTADO: 'Activa' });
  if (recursosCompetencia.length === 0) return [];

  var personasPorId = {};
  listarRegistros('PERSONA_EQUIPO', { ACTIVO: 'SÍ' }).forEach(function (p) {
    if (p.ESTADO !== 'Inactivo') personasPorId[p.ID] = p;
  });

  var competenciasConPersonaDisponible = {};
  listarRegistros('PERSONA_COMPETENCIA', { ACTIVO: 'SÍ', ESTADO: 'Activa' }).forEach(function (pc) {
    if (personasPorId[pc.PERSONA_EQUIPO_ID]) competenciasConPersonaDisponible[pc.COMPETENCIA_ID] = true;
  });

  var recursosPorId = {};
  listarRegistros('RECURSO', { ACTIVO: 'SÍ' }).forEach(function (r) { recursosPorId[r.ID] = r; });
  var competenciasPorId = {};
  listarRegistros('COMPETENCIA', {}).forEach(function (c) { competenciasPorId[c.ID] = c; });

  return recursosCompetencia
    .filter(function (rc) { return recursosPorId[rc.RECURSO_ID] && !competenciasConPersonaDisponible[rc.COMPETENCIA_ID]; })
    .map(function (rc) {
      return {
        RECURSO_ID: rc.RECURSO_ID,
        NOMBRE: recursosPorId[rc.RECURSO_ID].NOMBRE,
        COMPETENCIA_ID: rc.COMPETENCIA_ID,
        COMPETENCIA_NOMBRE: competenciasPorId[rc.COMPETENCIA_ID] ? competenciasPorId[rc.COMPETENCIA_ID].NOMBRE : rc.COMPETENCIA_ID
      };
    });
}

/*
 * Track A -- encaje de competencias (ver conversación -- "que la
 * relación entre tarea y competencia forme parte del éxito de la
 * campaña"): mismo espíritu que listarRecursosSinCompetenciaDisponible,
 * pero mirando asignaciones YA HECHAS (TAREA_RESPONSABLE) en vez de
 * disponibilidad teórica -- avisa, no bloquea, cuando el responsable
 * asignado a una tarea no tiene la competencia que esa tarea exige, o la
 * tiene por debajo del nivel mínimo.
 */
var RANGO_NIVEL_COMPETENCIA_ = { 'Básico': 1, 'Intermedio': 2, 'Avanzado': 3 };

function listarAsignacionesSinEncajeCompetencia() {
  var requisitos = listarRegistros('TAREA_COMPETENCIA', { ACTIVO: 'SÍ', ESTADO: 'Activa' });
  if (requisitos.length === 0) return [];

  var requisitosPorTarea = {};
  requisitos.forEach(function (r) {
    if (!requisitosPorTarea[r.TAREA_ID]) requisitosPorTarea[r.TAREA_ID] = [];
    requisitosPorTarea[r.TAREA_ID].push(r);
  });

  var nivelPorPersonaYCompetencia = {};
  listarRegistros('PERSONA_COMPETENCIA', { ACTIVO: 'SÍ', ESTADO: 'Activa' }).forEach(function (pc) {
    nivelPorPersonaYCompetencia[pc.PERSONA_EQUIPO_ID + '::' + pc.COMPETENCIA_ID] = pc.NIVEL || '';
  });

  var tareasPorId = {};
  listarRegistros('TAREA', {}).forEach(function (t) { tareasPorId[t.ID] = t; });
  var personasPorId = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (p) { personasPorId[p.ID] = p; });
  var competenciasPorId = {};
  listarRegistros('COMPETENCIA', {}).forEach(function (c) { competenciasPorId[c.ID] = c; });

  var alertas = [];

  listarRegistros('TAREA_RESPONSABLE', { ACTIVO: 'SÍ', ESTADO: 'Activa' }).forEach(function (asignacion) {
    var reqs = requisitosPorTarea[asignacion.TAREA_ID];
    if (!reqs) return;

    reqs.forEach(function (req) {
      var nivelActual = nivelPorPersonaYCompetencia[asignacion.PERSONA_EQUIPO_ID + '::' + req.COMPETENCIA_ID];
      var tiene = nivelActual !== undefined;
      var nivelSuficiente = !req.NIVEL_MINIMO || (tiene && RANGO_NIVEL_COMPETENCIA_[nivelActual] >= RANGO_NIVEL_COMPETENCIA_[req.NIVEL_MINIMO]);

      if (tiene && nivelSuficiente) return;

      alertas.push({
        TAREA_ID: asignacion.TAREA_ID,
        TAREA_NOMBRE: tareasPorId[asignacion.TAREA_ID] ? tareasPorId[asignacion.TAREA_ID].NOMBRE : asignacion.TAREA_ID,
        PERSONA_EQUIPO_ID: asignacion.PERSONA_EQUIPO_ID,
        PERSONA_NOMBRE: personasPorId[asignacion.PERSONA_EQUIPO_ID] ? personasPorId[asignacion.PERSONA_EQUIPO_ID].NOMBRE : asignacion.PERSONA_EQUIPO_ID,
        COMPETENCIA_ID: req.COMPETENCIA_ID,
        COMPETENCIA_NOMBRE: competenciasPorId[req.COMPETENCIA_ID] ? competenciasPorId[req.COMPETENCIA_ID].NOMBRE : req.COMPETENCIA_ID,
        NIVEL_EXIGIDO: req.NIVEL_MINIMO || '',
        NIVEL_ACTUAL: tiene ? nivelActual : ''
      });
    });
  });

  return alertas;
}

function listarTareasSinResponsable() {
  var tareas = listarRegistros('TAREA', { ACTIVO: 'SÍ' });
  var activas = tareas.filter(function (t) {
    return ESTADOS_CERRADOS_MVP.TAREA.indexOf(t.ESTADO) === -1;
  });
  var asignaciones = listarRegistros('TAREA_RESPONSABLE', { ACTIVO: 'SÍ', ESTADO: 'Activa' });
  var tareasConResponsable = {};
  asignaciones.forEach(function (a) { tareasConResponsable[a.TAREA_ID] = true; });
  return activas.filter(function (t) { return !tareasConResponsable[t.ID]; });
}

function listarCapacidadRecursos() {
  var personas = listarRegistros('PERSONA_EQUIPO', { ACTIVO: 'SÍ' });
  var asignaciones = listarRegistros('TAREA_RESPONSABLE', { ACTIVO: 'SÍ', ESTADO: 'Activa' });
  return personas.map(function (p) {
    var dedicacion = 0;
    asignaciones.forEach(function (a) {
      if (a.PERSONA_EQUIPO_ID === p.ID) dedicacion += Number(a.PORCENTAJE_DEDICACION) || 0;
    });
    return {
      NOMBRE: p.NOMBRE,
      DEDICACION_TOTAL_PORCENTAJE: dedicacion,
      DIAS_LIBRES: p.CAPACIDAD_SEMANAL_DIAS
    };
  });
}

function listarMaterialesStockBajo() {
  var materiales = listarRegistros('MATERIAL', { ACTIVO: 'SÍ' });
  return materiales.filter(function (m) {
    var stock = Number(m.STOCK_ACTUAL) || 0;
    var minimo = Number(m.STOCK_MINIMO) || 0;
    return stock > 0 && stock <= minimo;
  });
}

function listarMaterialesAgotados() {
  var materiales = listarRegistros('MATERIAL', { ACTIVO: 'SÍ' });
  return materiales.filter(function (m) { return (Number(m.STOCK_ACTUAL) || 0) <= 0; });
}

function listarReservasSuperanStock() {
  var materiales = listarRegistros('MATERIAL', { ACTIVO: 'SÍ' });
  return materiales.filter(function (m) {
    return (Number(m.CANTIDAD_RESERVADA) || 0) > (Number(m.STOCK_ACTUAL) || 0);
  });
}

function listarNecesidadesReposicion() {
  var materiales = listarRegistros('MATERIAL', { ACTIVO: 'SÍ' });
  return materiales.filter(function (m) {
    var stock = Number(m.STOCK_ACTUAL) || 0;
    var minimo = Number(m.STOCK_MINIMO) || 0;
    return stock <= minimo;
  });
}

function listarMaterialesCriticos() {
  var materiales = listarRegistros('MATERIAL', { ACTIVO: 'SÍ' });
  return materiales.filter(function (m) {
    var stock = Number(m.STOCK_ACTUAL) || 0;
    return stock <= 0;
  });
}

function listarConsumoDesperdicioMaterial() {
  return listarRegistros('TAREA_MATERIAL', { ACTIVO: 'SÍ' }).filter(function (tm) {
    return (Number(tm.CANTIDAD_CONSUMIDA) || 0) > 0 || (Number(tm.CANTIDAD_DESPERDICIADA) || 0) > 0;
  });
}
function obtenerAlertasMaterialesSeguro_() {
  try {
    return {
      stockBajo: listarMaterialesStockBajo(),
      agotados: listarMaterialesAgotados(),
      reservasSuperanStock: listarReservasSuperanStock(),
      necesidadesReposicion: listarNecesidadesReposicion(),
      criticos: listarMaterialesCriticos(),
      consumoDesperdicio: listarConsumoDesperdicioMaterial()
    };
  } catch (e) {
    console.warn('PANEL_OPERATIVO_MATERIALES_OMITIDO: ' + e.message);
    return {
      stockBajo: [], agotados: [], reservasSuperanStock: [],
      necesidadesReposicion: [], criticos: [], consumoDesperdicio: []
    };
  }
}

function obtenerPanelOperativo() {
  cacheLecturaIniciarContexto_();

  try {
    var panel = {
      resumen: obtenerResumenGlobal(),
      tareasRetrasadas: listarTareasRetrasadas(),
      tareasBloqueadas: listarTareasBloqueadas(),
      tareasPospuestas: listarTareasPospuestas(),
      decisionesPendientes: listarDecisionesPendientes(),
      incidenciasAbiertas: listarIncidenciasAbiertas(),
      recursos: {
        noDisponibles: listarRecursosNoDisponibles(),
        sobreasignaciones: listarSobreasignaciones(),
        tareasSinResponsable: listarTareasSinResponsable(),
        capacidad: listarCapacidadRecursos()
      },
      excepciones: {
        productosSinProyecto: listarProductosSinProyecto(),
        procesosSinFechas: listarProcesosSinFechas(),
        relacionesIncompletas: listarRelacionesIncompletas(),
        recursosSinCompetenciaDisponible: listarRecursosSinCompetenciaDisponible(),
        asignacionesSinEncajeCompetencia: listarAsignacionesSinEncajeCompetencia()
      },
      materiales: obtenerAlertasMaterialesSeguro_()
    };

    return serializarParaCliente_(panel);
  } finally {
    cacheLecturaFinalizarContexto_();
  }
}

function abrirPanelOperativo() {
  var html = HtmlService.createTemplateFromFile('PanelOperativo')
    .evaluate()
    .setTitle('Panel operativo')
    .setWidth(420);
  SpreadsheetApp.getUi().showSidebar(html);
}
