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

/*
 * Nombre de responsable en vez de ID crudo (ver conversacion -- la
 * tabla "Procesos por responsable" mostraba PER-0006 en vez del
 * nombre, porque se agrupaba directamente por RESPONSABLE_ID).
 */
function enriquecerConNombreResponsableProceso_(procesosConDesviacion) {
  var nombresPersona = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });
  return procesosConDesviacion.map(function (proceso) {
    return Object.assign({}, proceso, {
      RESPONSABLE_NOMBRE: proceso.RESPONSABLE_ID ? (nombresPersona[proceso.RESPONSABLE_ID] || proceso.RESPONSABLE_ID) : '(sin responsable)'
    });
  });
}

/*
 * TAREA no tiene RESPONSABLE_ID propio -- el responsable se asigna via
 * TAREA_RESPONSABLE (N:M, una tarea puede tener varios responsables).
 * "Tareas por responsable" agrupaba por ese campo inexistente y
 * siempre salia "(sin RESPONSABLE_ID)" (ver conversacion). Se expande
 * una fila por cada responsable real de la tarea -- una tarea con 2
 * responsables cuenta para ambos, mismo criterio que
 * calcularDesviacionPorRecurso_ usa con los recursos de TAREA_RECURSO.
 */
function expandirTareasPorResponsable_(tareasConDesviacion) {
  var nombresPersona = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });

  var responsablesPorTarea = {};
  listarRegistros('TAREA_RESPONSABLE', { ACTIVO: 'SÍ' }).forEach(function (tr) {
    if (!responsablesPorTarea[tr.TAREA_ID]) responsablesPorTarea[tr.TAREA_ID] = [];
    responsablesPorTarea[tr.TAREA_ID].push(tr.PERSONA_EQUIPO_ID);
  });

  var registrosPlanos = [];
  tareasConDesviacion.forEach(function (tarea) {
    var responsables = responsablesPorTarea[tarea.ID] || [];
    if (responsables.length === 0) {
      registrosPlanos.push(Object.assign({}, tarea, { RESPONSABLE_NOMBRE: '(sin responsable)' }));
      return;
    }
    responsables.forEach(function (personaId) {
      registrosPlanos.push(Object.assign({}, tarea, { RESPONSABLE_NOMBRE: nombresPersona[personaId] || personaId }));
    });
  });
  return registrosPlanos;
}

function construirBloqueDesviacion_(procesosConDesviacion, tareasConDesviacion) {
  return {
    procesosMedidos: procesosConDesviacion.length,
    tareasMedidas: tareasConDesviacion.length,
    procesosPorFase: calcularDesviacionAgregada_(procesosConDesviacion, 'FASE_PRODUCCION'),
    procesosPorResponsable: calcularDesviacionAgregada_(enriquecerConNombreResponsableProceso_(procesosConDesviacion), 'RESPONSABLE_NOMBRE'),
    tareasPorResponsable: calcularDesviacionAgregada_(expandirTareasPorResponsable_(tareasConDesviacion), 'RESPONSABLE_NOMBRE')
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

/*
 * N3.4 (roadmap -- "Informe de calidad de planificación", cierra el
 * bloque N3): añade lo que faltaba en generarInformeDesviacion --
 * % de a tiempo, desviación por recurso y utilización del horario
 * declarado -- sin duplicar lo ya calculado (fase/responsable/campaña
 * se reutilizan tal cual via construirBloqueDesviacion_).
 *
 * "Por recurso" no existia como dimension: PROCESO no tiene RECURSO_ID
 * propio, se llega via TAREA_RECURSO -> TAREA -> PROCESO. Un proceso
 * con varias tareas que usan el mismo recurso solo debe contar una vez
 * para ese recurso (vistoPorRecurso_), igual que un proceso que usa 2
 * recursos distintos cuenta para ambos.
 */
function calcularDesviacionPorRecurso_(procesosConDesviacion) {
  var procesoPorId = {};
  procesosConDesviacion.forEach(function (p) { procesoPorId[p.ID] = p; });

  var procesoIdPorTarea = {};
  listarRegistros('TAREA', { ACTIVO: 'SÍ' }).forEach(function (t) { procesoIdPorTarea[t.ID] = t.PROCESO_ID; });

  var nombresRecurso = {};
  listarRegistros('RECURSO', {}).forEach(function (r) { nombresRecurso[r.ID] = r.NOMBRE; });

  var vistoPorRecurso_ = {};
  var registrosPlanos = [];
  listarRegistros('TAREA_RECURSO', { ACTIVO: 'SÍ' }).forEach(function (tr) {
    var procesoId = procesoIdPorTarea[tr.TAREA_ID];
    var proceso = procesoId && procesoPorId[procesoId];
    if (!proceso) return;
    if (!vistoPorRecurso_[tr.RECURSO_ID]) vistoPorRecurso_[tr.RECURSO_ID] = {};
    if (vistoPorRecurso_[tr.RECURSO_ID][procesoId]) return;
    vistoPorRecurso_[tr.RECURSO_ID][procesoId] = true;
    registrosPlanos.push(Object.assign({}, proceso, { RECURSO_NOMBRE: nombresRecurso[tr.RECURSO_ID] || tr.RECURSO_ID }));
  });

  return calcularDesviacionAgregada_(registrosPlanos, 'RECURSO_NOMBRE');
}

/*
 * Utilización de capacidad (ver conversacion -- "cierra el puente entre
 * HORARIO y planificacion, no solo desviacion"): no hay horas
 * trabajadas registradas en el sistema (EJECUCION_TAREA no lleva
 * horas), asi que se mide con lo que SI existe -- de los dias
 * planificados de cada proceso, cuantos caen dentro del horario
 * declarado del responsable/recursos (reutiliza diasFueraDeHorario, ya
 * calculado por obtenerFilasGanttDetalladas_ para el overlay del
 * Gantt). Solo se agregan procesos con horario cargado (diasFueraDeHorario
 * !== null) -- sin eso no hay nada que medir para ese responsable.
 */
function calcularUtilizacionHorarioPorResponsable_(filasGantt) {
  var porResponsable = {};
  filasGantt.forEach(function (fila) {
    if (fila.diasFueraDeHorario === null || fila.diasFueraDeHorario === undefined) return;
    var clave = fila.responsable || '(sin responsable)';
    if (!porResponsable[clave]) porResponsable[clave] = { responsable: clave, diasPlanificados: 0, diasFueraDeHorario: 0 };

    var fechaFinTramo = fila.fechaFinReal && new Date(fila.fechaFinReal) > new Date(fila.fechaFinPlan)
      ? fila.fechaFinReal : fila.fechaFinPlan;
    var dias = duracionDias_(fila.fechaInicioPlan, fechaFinTramo);
    porResponsable[clave].diasPlanificados += dias === null ? 0 : dias + 1;
    porResponsable[clave].diasFueraDeHorario += fila.diasFueraDeHorario.length;
  });

  return Object.keys(porResponsable).map(function (clave) {
    var r = porResponsable[clave];
    var diasDentro = Math.max(r.diasPlanificados - r.diasFueraDeHorario, 0);
    return {
      responsable: r.responsable,
      diasPlanificados: r.diasPlanificados,
      diasFueraDeHorario: r.diasFueraDeHorario,
      porcentajeUtilizacion: r.diasPlanificados > 0 ? Math.round((diasDentro / r.diasPlanificados) * 100) : null
    };
  }).sort(function (a, b) {
    var av = a.porcentajeUtilizacion === null ? 999 : a.porcentajeUtilizacion;
    var bv = b.porcentajeUtilizacion === null ? 999 : b.porcentajeUtilizacion;
    return av - bv;
  });
}

function generarInformeCalidadPlanificacion(filtro) {
  var procesos = listarDesviacionesProcesos_(filtro);
  var tareas = listarDesviacionesTareas_(filtro);
  var procesosConCampana = enriquecerConCampana_(procesos, construirMapaCampanaPorProducto_());
  var filasGantt = obtenerFilasGanttDetalladas_(filtro);

  function porcentajeATiempo_(lista) {
    if (lista.length === 0) return null;
    var aTiempo = lista.filter(function (r) { return r.DIAS_DESVIACION_FIN !== null && r.DIAS_DESVIACION_FIN <= 0; }).length;
    return Math.round((aTiempo / lista.length) * 100);
  }

  return Object.assign(
    { tipo: 'CALIDAD_PLANIFICACION' },
    construirBloqueDesviacion_(procesos, tareas),
    {
      porcentajeProcesosATiempo: porcentajeATiempo_(procesos),
      porcentajeTareasATiempo: porcentajeATiempo_(tareas),
      procesosPorCampana: calcularDesviacionAgregada_(procesosConCampana, 'CAMPANA_NOMBRE'),
      procesosPorRecurso: calcularDesviacionPorRecurso_(procesos),
      utilizacionHorarioPorResponsable: calcularUtilizacionHorarioPorResponsable_(filasGantt)
    }
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
  var datos = leerVariasEntidadesBatch_(['PERSONA_EQUIPO', 'CAMPANA', 'PROYECTO', 'RECURSO']);
  /*
   * grupo (ver conversacion: "desplegables segmentados por categorias
   * o tipos"): ROL para personas, CLASE_RECURSO para recursos -- ya
   * existian como campos, solo faltaba exponerlos para poder agrupar
   * las opciones en <optgroup> en vez de una lista plana larga.
   */
  var personas = loteFiltrarPorIgualdad_(datos.PERSONA_EQUIPO, { ACTIVO: 'SÍ' }).map(function (persona) {
    return { id: persona.ID, etiqueta: persona.NOMBRE, grupo: persona.ROL || 'Sin rol' };
  });
  var campanas = loteFiltrarPorIgualdad_(datos.CAMPANA, { ACTIVO: 'SÍ' }).map(function (campana) {
    return { id: campana.ID, etiqueta: campana.NOMBRE };
  });
  var proyectos = loteFiltrarPorIgualdad_(datos.PROYECTO, { ACTIVO: 'SÍ' }).map(function (proyecto) {
    return { id: proyecto.ID, etiqueta: proyecto.NOMBRE };
  });
  var recursos = loteFiltrarPorIgualdad_(datos.RECURSO, { ACTIVO: 'SÍ' }).map(function (recurso) {
    return { id: recurso.ID, etiqueta: recurso.NOMBRE, grupo: recurso.CLASE_RECURSO || 'Sin clase' };
  });
  return { fases: fases, personas: personas, campanas: campanas, proyectos: proyectos, recursos: recursos };
}

/**
 * Contexto jerarquico de un producto (proyecto+campaña a los que
 * pertenece), para el Gantt y su exportacion -- mismo tipo de
 * resolucion que construirMapaCampanaPorProducto_ pero con el proyecto
 * tambien resuelto, ya que aqui hace falta mostrar/filtrar por ambos
 * niveles. Se mantiene separada de construirMapaCampanaPorProducto_
 * (usada por el informe de Desviacion, ya verificado) para no tocar esa
 * logica ya probada.
 *
 * Separada en una version "desde filas" (nucleo reutilizable, recibe
 * las 3 hojas ya leidas) y una version normal que las lee una a una --
 * asi los sitios que ya traen las filas por lote (leerVariasEntidadesBatch_)
 * no tienen que releerlas.
 */
function construirMapaContextoPorProductoDesdeFilas_(proyectoProductoFilas, proyectoFilas, campanaFilas) {
  var proyectoPorProducto = {};
  loteFiltrarPorIgualdad_(proyectoProductoFilas, { ACTIVO: 'SÍ' }).forEach(function (rel) {
    if (!proyectoPorProducto[rel.PRODUCTO_ID]) proyectoPorProducto[rel.PRODUCTO_ID] = rel.PROYECTO_ID;
  });

  var proyectos = {};
  proyectoFilas.forEach(function (proyecto) { proyectos[proyecto.ID] = proyecto; });
  var campanas = {};
  campanaFilas.forEach(function (campana) { campanas[campana.ID] = campana; });

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

function construirMapaContextoPorProducto_() {
  return construirMapaContextoPorProductoDesdeFilas_(
    listarRegistros('PROYECTO_PRODUCTO', null),
    listarRegistros('PROYECTO', null),
    listarRegistros('CAMPANA', null)
  );
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

/*
 * N3.2: overlay de capacidad real sobre el Gantt (ver conversacion --
 * "el puente que faltaba" entre HORARIO y planificacion). getDay() de
 * JS: 0=Domingo..6=Sabado; mapeado a las etiquetas reales del catalogo
 * CFG_DIA_SEMANA (ver InstaladorHorario.js).
 */
var DIA_SEMANA_POR_INDICE_JS_ = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function diaCubiertoPorHorarios_(horariosEntidad, fecha, nombreDia) {
  return horariosEntidad.some(function (h) {
    if (h.DIA_SEMANA !== nombreDia) return false;
    if (h.FECHA_INICIO_VIGENCIA && fecha < new Date(h.FECHA_INICIO_VIGENCIA)) return false;
    if (h.FECHA_FIN_VIGENCIA && fecha > new Date(h.FECHA_FIN_VIGENCIA)) return false;
    return true;
  });
}

/*
 * Devuelve los dias (yyyy-MM-dd) del rango [fechaInicio, fechaFin] en
 * que alguna de las entidades relevantes (responsable y/o recursos
 * usados por las tareas del proceso) NO tiene ese dia cubierto por su
 * propio HORARIO -- ver conversacion: el caso real de Cerámica tiene
 * el horario en el ESPACIO, no en la persona, así que hace falta
 * comprobar ambos por separado (un dia solo cuenta como "en horario"
 * si TODAS las entidades con datos lo cubren).
 *
 * gruposHorario: array de arrays de filas HORARIO, uno por entidad
 * relevante -- ya filtrado antes de llamar para incluir solo entidades
 * que SI tienen datos (una entidad sin HORARIO cargado no debe forzar
 * "fuera de horario todos los dias", seria ruido). Si ninguna entidad
 * tiene datos, devuelve null (sin datos para evaluar).
 * Acotado a 120 dias para no iterar rangos patologicos.
 */
function calcularDiasFueraDeHorario_(gruposHorario, fechaInicio, fechaFin) {
  if (!gruposHorario || gruposHorario.length === 0) return null;

  var dia = 24 * 60 * 60 * 1000;
  var actual = new Date(fechaInicio);
  actual.setHours(0, 0, 0, 0);
  var fin = new Date(fechaFin);
  fin.setHours(0, 0, 0, 0);
  var limite = new Date(actual.getTime() + 120 * dia);
  if (fin.getTime() > limite.getTime()) fin = limite;

  var diasFuera = [];
  while (actual.getTime() <= fin.getTime()) {
    var nombreDia = DIA_SEMANA_POR_INDICE_JS_[actual.getDay()];
    var fueraDeAlguna = gruposHorario.some(function (horariosEntidad) {
      return !diaCubiertoPorHorarios_(horariosEntidad, actual, nombreDia);
    });
    if (fueraDeAlguna) {
      diasFuera.push(Utilities.formatDate(actual, Session.getScriptTimeZone() || 'Europe/Madrid', 'yyyy-MM-dd'));
    }
    actual = new Date(actual.getTime() + dia);
  }
  return diasFuera;
}

function obtenerFilasGanttDetalladas_(filtro) {
  filtro = filtro || {};

  /*
   * Lectura por lotes (ver conversacion -- exploracion de rendimiento):
   * las 9 hojas que necesita este Gantt se traen en una sola llamada
   * HTTP (Sheets Advanced Service) en vez de 9 llamadas SpreadsheetApp
   * independientes, cada una con coste fijo de ~0.7-1s. Verificado con
   * Tests_LecturaBatch.js contra listarRegistros antes de conectarlo.
   */
  var datos = leerVariasEntidadesBatch_([
    'PROYECTO_PRODUCTO', 'PROYECTO', 'CAMPANA',
    'TAREA', 'TAREA_RECURSO', 'PROCESO', 'PERSONA_EQUIPO', 'PRODUCTO', 'HORARIO'
  ]);

  var contextoPorProducto = construirMapaContextoPorProductoDesdeFilas_(datos.PROYECTO_PRODUCTO, datos.PROYECTO, datos.CAMPANA);

  /*
   * Recursos usados por cada proceso (via sus tareas -> TAREA_RECURSO),
   * necesario tanto para el filtro por recurso como para el overlay de
   * horario por recurso (ver conversacion: el caso real de Cerámica
   * tiene el horario en el espacio, no en la persona).
   */
  var tareasPorProceso_ = {};
  loteFiltrarPorIgualdad_(datos.TAREA, { ACTIVO: 'SÍ' }).forEach(function (t) {
    if (!tareasPorProceso_[t.PROCESO_ID]) tareasPorProceso_[t.PROCESO_ID] = [];
    tareasPorProceso_[t.PROCESO_ID].push({ id: t.ID, nombre: t.NOMBRE });
  });
  var recursosPorTarea_ = {};
  loteFiltrarPorIgualdad_(datos.TAREA_RECURSO, { ACTIVO: 'SÍ' }).forEach(function (tr) {
    if (!recursosPorTarea_[tr.TAREA_ID]) recursosPorTarea_[tr.TAREA_ID] = [];
    recursosPorTarea_[tr.TAREA_ID].push(tr.RECURSO_ID);
  });
  function recursosDelProceso_(procesoId) {
    var tareas = tareasPorProceso_[procesoId] || [];
    var recursos = {};
    tareas.forEach(function (tarea) {
      (recursosPorTarea_[tarea.id] || []).forEach(function (recursoId) { recursos[recursoId] = true; });
    });
    return Object.keys(recursos);
  }

  var procesos = loteFiltrarPorIgualdad_(datos.PROCESO, { ACTIVO: 'SÍ' }).filter(function (proceso) {
    if (!proceso.FECHA_INICIO_PLAN || !proceso.FECHA_FIN_PLAN) return false;
    if (filtro.faseProduccion && proceso.FASE_PRODUCCION !== filtro.faseProduccion) return false;
    if (filtro.responsableId && proceso.RESPONSABLE_ID !== filtro.responsableId) return false;
    if (filtro.recursoId && recursosDelProceso_(proceso.ID).indexOf(filtro.recursoId) === -1) return false;
    if (filtro.productoId && proceso.PRODUCTO_ID !== filtro.productoId) return false;
    var contexto = contextoPorProducto[proceso.PRODUCTO_ID];
    if (filtro.campanaId && (!contexto || contexto.campanaId !== filtro.campanaId)) return false;
    if (filtro.proyectoId && (!contexto || contexto.proyectoId !== filtro.proyectoId)) return false;
    return true;
  });

  var nombresPersona = {};
  datos.PERSONA_EQUIPO.forEach(function (persona) {
    nombresPersona[persona.ID] = persona.NOMBRE;
  });
  var nombresProducto = {};
  var fechaRequeridaPorProducto_ = {};
  datos.PRODUCTO.forEach(function (producto) {
    nombresProducto[producto.ID] = producto.NOMBRE;
    if (producto.FECHA_REQUERIDA) fechaRequeridaPorProducto_[producto.ID] = producto.FECHA_REQUERIDA;
  });
  var horariosPorPersona = {};
  var horariosPorRecurso = {};
  loteFiltrarPorIgualdad_(datos.HORARIO, { ACTIVO: 'SÍ', ESTADO: 'Activa' }).forEach(function (h) {
    if (h.ENTIDAD_TIPO === 'Persona/Equipo') {
      if (!horariosPorPersona[h.ENTIDAD_ID]) horariosPorPersona[h.ENTIDAD_ID] = [];
      horariosPorPersona[h.ENTIDAD_ID].push(h);
    } else if (h.ENTIDAD_TIPO === 'Recurso') {
      if (!horariosPorRecurso[h.ENTIDAD_ID]) horariosPorRecurso[h.ENTIDAD_ID] = [];
      horariosPorRecurso[h.ENTIDAD_ID].push(h);
    }
  });

  return procesos.map(function (proceso) {
    var contexto = contextoPorProducto[proceso.PRODUCTO_ID] || {};
    var desviacion = calcularDesviacionRegistro_(proceso);
    var fechaFinTramo = proceso.FECHA_FIN_REAL && new Date(proceso.FECHA_FIN_REAL) > new Date(proceso.FECHA_FIN_PLAN)
      ? proceso.FECHA_FIN_REAL
      : proceso.FECHA_FIN_PLAN;

    var gruposHorario = [];
    if (horariosPorPersona[proceso.RESPONSABLE_ID]) gruposHorario.push(horariosPorPersona[proceso.RESPONSABLE_ID]);
    recursosDelProceso_(proceso.ID).forEach(function (recursoId) {
      if (horariosPorRecurso[recursoId]) gruposHorario.push(horariosPorRecurso[recursoId]);
    });

    return {
      id: proceso.ID,
      nombre: proceso.NOMBRE,
      fase: proceso.FASE_PRODUCCION || '',
      estado: proceso.ESTADO || '',
      responsable: nombresPersona[proceso.RESPONSABLE_ID] || '',
      productoId: proceso.PRODUCTO_ID || '',
      productoNombre: nombresProducto[proceso.PRODUCTO_ID] || '',
      fechaRequeridaProducto: fechaRequeridaPorProducto_[proceso.PRODUCTO_ID] || null,
      proyectoId: contexto.proyectoId || '',
      proyectoNombre: contexto.proyectoNombre || '',
      campanaId: contexto.campanaId || '',
      campanaNombre: contexto.campanaNombre || '',
      tareas: tareasPorProceso_[proceso.ID] || [],
      fechaInicioPlan: proceso.FECHA_INICIO_PLAN,
      fechaFinPlan: proceso.FECHA_FIN_PLAN,
      fechaInicioReal: proceso.FECHA_INICIO_REAL || null,
      fechaFinReal: proceso.FECHA_FIN_REAL || null,
      duracionPrevistaDias: proceso.DURACION_PREVISTA_DIAS === '' || proceso.DURACION_PREVISTA_DIAS === undefined ? null : Number(proceso.DURACION_PREVISTA_DIAS),
      duracionRealDias: proceso.DURACION_REAL_DIAS === '' || proceso.DURACION_REAL_DIAS === undefined ? null : Number(proceso.DURACION_REAL_DIAS),
      diasDesviacionInicio: desviacion.DIAS_DESVIACION_INICIO,
      diasDesviacionFin: desviacion.DIAS_DESVIACION_FIN,
      diasRiesgo: calcularRiesgoRegistro_(proceso),
      diasFueraDeHorario: calcularDiasFueraDeHorario_(gruposHorario, proceso.FECHA_INICIO_PLAN, fechaFinTramo)
    };
  }).sort(function (a, b) { return new Date(a.fechaInicioPlan) - new Date(b.fechaInicioPlan); });
}

function obtenerDatosGanttPlanReal(filtro) {
  return serializarParaCliente_({ filas: obtenerFilasGanttDetalladas_(filtro) });
}

/*
 * N3.1 (roadmap -- "Gantt como espacio operativo"): vista de fases
 * agrupada por producto, con totales Preproducción/Producción/
 * Postproducción (previsto vs. real) y ciclo completo. Responde
 * directamente "cuánto duró cada fase" sin tener que sumar barras a
 * ojo en el Gantt. Reutiliza obtenerFilasGanttDetalladas_ (mismos
 * filtros, mismos datos ya calculados) en vez de releer nada.
 */
var FASES_ORDEN_ = ['Preproducción', 'Producción', 'Postproducción'];

function duracionDias_(inicio, fin) {
  if (!inicio || !fin) return null;
  var i = new Date(inicio); i.setHours(0, 0, 0, 0);
  var f = new Date(fin); f.setHours(0, 0, 0, 0);
  return Math.round((f - i) / (24 * 60 * 60 * 1000));
}

function obtenerVistaFasesPorProducto(filtro) {
  var filas = obtenerFilasGanttDetalladas_(filtro);
  var porProducto = {};

  filas.forEach(function (f) {
    if (!porProducto[f.productoId]) {
      var fasesVacias = {};
      FASES_ORDEN_.forEach(function (fase) {
        fasesVacias[fase] = { fase: fase, procesos: 0, procesosCompletados: 0, diasPrevistos: 0, diasReales: 0 };
      });
      porProducto[f.productoId] = {
        productoId: f.productoId, productoNombre: f.productoNombre,
        proyectoId: f.proyectoId, proyectoNombre: f.proyectoNombre,
        campanaId: f.campanaId, campanaNombre: f.campanaNombre,
        fases: fasesVacias,
        fechaInicioPlanCiclo: null, fechaFinPlanCiclo: null,
        fechaInicioRealCiclo: null, fechaFinRealCiclo: null
      };
    }
    var p = porProducto[f.productoId];

    if (p.fases[f.fase]) {
      var bloque = p.fases[f.fase];
      bloque.procesos++;
      bloque.diasPrevistos += f.duracionPrevistaDias || 0;
      if (f.duracionRealDias !== null) {
        bloque.diasReales += f.duracionRealDias;
        bloque.procesosCompletados++;
      }
    }

    if (f.fechaInicioPlan && (!p.fechaInicioPlanCiclo || new Date(f.fechaInicioPlan) < new Date(p.fechaInicioPlanCiclo))) p.fechaInicioPlanCiclo = f.fechaInicioPlan;
    if (f.fechaFinPlan && (!p.fechaFinPlanCiclo || new Date(f.fechaFinPlan) > new Date(p.fechaFinPlanCiclo))) p.fechaFinPlanCiclo = f.fechaFinPlan;
    if (f.fechaInicioReal && (!p.fechaInicioRealCiclo || new Date(f.fechaInicioReal) < new Date(p.fechaInicioRealCiclo))) p.fechaInicioRealCiclo = f.fechaInicioReal;
    if (f.fechaFinReal && (!p.fechaFinRealCiclo || new Date(f.fechaFinReal) > new Date(p.fechaFinRealCiclo))) p.fechaFinRealCiclo = f.fechaFinReal;
  });

  /*
   * Fase actual (ver conversacion -- "en que punto estan los productos"):
   * la primera fase (en orden Prepro->Pro->Postpro) que tiene procesos
   * sin terminar. Si todas las fases con procesos estan completas,
   * "Completado"; si no hay ningun proceso en ninguna fase reconocida,
   * "Sin fase".
   */
  function faseActualDe_(fasesLista) {
    for (var i = 0; i < fasesLista.length; i++) {
      var b = fasesLista[i];
      if (b.procesos > 0 && b.procesosCompletados < b.procesos) return b.fase;
    }
    var hayProcesos = fasesLista.some(function (b) { return b.procesos > 0; });
    return hayProcesos ? 'Completado' : 'Sin fase';
  }

  var resultado = Object.keys(porProducto).map(function (id) {
    var p = porProducto[id];
    var diasCicloPrevisto = duracionDias_(p.fechaInicioPlanCiclo, p.fechaFinPlanCiclo);
    var diasCicloReal = duracionDias_(p.fechaInicioRealCiclo, p.fechaFinRealCiclo);
    var fasesLista = FASES_ORDEN_.map(function (fase) { return p.fases[fase]; });
    return {
      productoId: p.productoId, productoNombre: p.productoNombre,
      proyectoId: p.proyectoId, proyectoNombre: p.proyectoNombre,
      campanaId: p.campanaId, campanaNombre: p.campanaNombre,
      fases: fasesLista,
      faseActual: faseActualDe_(fasesLista),
      diasCicloPrevisto: diasCicloPrevisto,
      diasCicloReal: diasCicloReal,
      diasDesviacionCiclo: (diasCicloPrevisto !== null && diasCicloReal !== null) ? (diasCicloReal - diasCicloPrevisto) : null
    };
  }).sort(function (a, b) {
    // Mayor desviacion primero (los problematicos arriba); sin desviacion medible, al final, por nombre.
    if (a.diasDesviacionCiclo === null && b.diasDesviacionCiclo === null) return a.productoNombre.localeCompare(b.productoNombre);
    if (a.diasDesviacionCiclo === null) return 1;
    if (b.diasDesviacionCiclo === null) return -1;
    return b.diasDesviacionCiclo - a.diasDesviacionCiclo;
  });

  return resultado;
}

/*
 * Cuello de botella (adelanto de N3.3, ver conversacion -- encaja mejor
 * aqui que en su propio paso separado): que fase acumula mas desviacion
 * media, agregando el bloque de cada fase de cada producto (solo los
 * bloques con al menos un proceso completado, que es donde hay dato
 * real que comparar).
 */
function calcularCuelloDeBotella_(productos) {
  var sumaPorFase = {};
  var casosPorFase = {};
  FASES_ORDEN_.forEach(function (fase) { sumaPorFase[fase] = 0; casosPorFase[fase] = 0; });

  productos.forEach(function (p) {
    p.fases.forEach(function (bloque) {
      if (bloque.procesosCompletados > 0) {
        sumaPorFase[bloque.fase] += (bloque.diasReales - bloque.diasPrevistos);
        casosPorFase[bloque.fase]++;
      }
    });
  });

  var peorFase = null;
  var peorMedia = -Infinity;
  FASES_ORDEN_.forEach(function (fase) {
    if (casosPorFase[fase] === 0) return;
    var media = sumaPorFase[fase] / casosPorFase[fase];
    if (media > peorMedia) { peorMedia = media; peorFase = fase; }
  });

  if (!peorFase) return null;
  return { fase: peorFase, desviacionMedia: Math.round(peorMedia * 10) / 10, casos: casosPorFase[peorFase] };
}

function obtenerDatosFasesPorProducto(filtro) {
  var productos = obtenerVistaFasesPorProducto(filtro);
  var medidos = productos.filter(function (p) { return p.diasDesviacionCiclo !== null; });
  var sumaDesviacion = medidos.reduce(function (acc, p) { return acc + p.diasDesviacionCiclo; }, 0);
  var resumen = {
    productosTotal: productos.length,
    productosMedidos: medidos.length,
    productosConRetraso: medidos.filter(function (p) { return p.diasDesviacionCiclo > 0; }).length,
    desviacionMediaCiclo: medidos.length > 0 ? Math.round((sumaDesviacion / medidos.length) * 10) / 10 : null,
    cuelloDeBotella: calcularCuelloDeBotella_(productos)
  };
  return serializarParaCliente_({ productos: productos, resumen: resumen });
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
  SpreadsheetApp.getUi().showModelessDialog(output, 'Descargando CSV');
}

function exportarGanttCSV(filtro) {
  var filas = obtenerFilasGanttDetalladas_(filtro);
  var encabezados = [
    'ID', 'Campaña', 'Proyecto', 'Producto', 'Proceso', 'Fase', 'Responsable', 'Estado',
    'Fecha inicio plan', 'Fecha fin plan', 'Fecha inicio real', 'Fecha fin real',
    'Duración prevista (días)', 'Duración real (días)',
    'Desviación inicio (días)', 'Desviación fin (días)', 'Riesgo (días vencidos sin terminar)',
    'Días planificados fuera del horario declarado'
  ];
  var filasCsv = filas.map(function (f) {
    return [
      f.id, f.campanaNombre, f.proyectoNombre, f.productoNombre, f.nombre, f.fase, f.responsable, f.estado,
      formatearFechaCsv_(f.fechaInicioPlan), formatearFechaCsv_(f.fechaFinPlan),
      formatearFechaCsv_(f.fechaInicioReal), formatearFechaCsv_(f.fechaFinReal),
      f.duracionPrevistaDias, f.duracionRealDias,
      f.diasDesviacionInicio, f.diasDesviacionFin, f.diasRiesgo,
      f.diasFueraDeHorario === null ? '' : f.diasFueraDeHorario.length
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

/* Exportar CSV de la vista "Fases por producto" (N3.1). */
function exportarFasesPorProductoCSV(filtro) {
  var productos = obtenerVistaFasesPorProducto(filtro);
  var encabezados = [
    'Producto', 'Proyecto', 'Campaña', 'Fase actual',
    'Preproducción prev. (días)', 'Preproducción real (días)',
    'Producción prev. (días)', 'Producción real (días)',
    'Postproducción prev. (días)', 'Postproducción real (días)',
    'Ciclo completo prev. (días)', 'Ciclo completo real (días)', 'Desviación ciclo (días)'
  ];
  var filasCsv = productos.map(function (p) {
    return [
      p.productoNombre, p.proyectoNombre, p.campanaNombre, p.faseActual,
      p.fases[0].diasPrevistos, p.fases[0].procesosCompletados > 0 ? p.fases[0].diasReales : '',
      p.fases[1].diasPrevistos, p.fases[1].procesosCompletados > 0 ? p.fases[1].diasReales : '',
      p.fases[2].diasPrevistos, p.fases[2].procesosCompletados > 0 ? p.fases[2].diasReales : '',
      p.diasCicloPrevisto, p.diasCicloReal, p.diasDesviacionCiclo
    ];
  });

  var nombre = 'FASES_POR_PRODUCTO_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('INFORME', nombre, 'EXPORTAR_FASES_PRODUCTO', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombre, contenidoCsv: construirCsvConBom_(encabezados, filasCsv) };
}

function abrirDialogoExportarFasesPorProductoCSV(filtro) {
  var resultado = exportarFasesPorProductoCSV(filtro);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}

/*
 * campanaId (opcional): al llegar desde el boton "Ver Gantt" del panel
 * de campana, preselecciona ese filtro en vez de abrir sin filtrar.
 * productoId (opcional, ver conversacion -- "Ver Gantt filtrado a este
 * producto" desde la Ficha de Producto): a diferencia de campanaId no
 * tiene un <select> propio en el Gantt, se aplica de forma fija durante
 * toda la sesion del dialogo (misma logica que filtroActual_ en
 * GanttPlanReal.html).
 */
function abrirGanttPlanReal(campanaId, productoId) {
  var template = HtmlService.createTemplateFromFile('GanttPlanReal');
  template.preseleccionCampana = campanaId || '';
  template.preseleccionProducto = productoId || '';
  template.preseleccionOcupacionRecurso = '';
  var html = template.evaluate().setWidth(920).setHeight(600);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Gantt: plan vs. real');
}

/*
 * "Ver ocupación" desde la Ficha de Espacio/Recurso (ver conversacion):
 * abre el Gantt directamente en modo Disponibilidad con este recurso ya
 * añadido como chip, reutilizando la comparacion de ocupacion que ya
 * existe (misma vista, misma barra de tiempo) en vez de duplicar nada.
 */
function abrirGanttOcupacionRecurso(recursoId, recursoNombre) {
  var template = HtmlService.createTemplateFromFile('GanttPlanReal');
  template.preseleccionCampana = '';
  template.preseleccionProducto = '';
  template.preseleccionOcupacionRecurso = JSON.stringify({ id: recursoId, nombre: recursoNombre });
  var html = template.evaluate().setWidth(920).setHeight(600);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Gantt: plan vs. real');
}
