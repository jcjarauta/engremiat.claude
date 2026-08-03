/**
 * Vista de coincidencia de disponibilidad (ver conversacion: "detectar
 * que el voluntario tecnico de cerámica coincide con el taller de
 * cerámica disponible con la persona atesa disponible"). Distinto del
 * overlay del Gantt (que compara HORARIO contra tareas YA planificadas):
 * aqui se comparan los HORARIO de varias entidades cualesquiera entre
 * si, para encontrar huecos libres donde planificar algo nuevo.
 *
 * Reutiliza el mismo dato (HORARIO) y el mismo criterio de vigencia
 * que el overlay del Gantt (DesviacionService.js), pero con
 * interseccion de FRANJAS HORARIAS por dia, no solo "dia cubierto o
 * no" -- aqui dos entidades pueden compartir el mismo dia con horas
 * distintas (ej. persona libre 16-18, espacio abierto 10-14) y no
 * coincidir de verdad.
 */

var DIAS_SEMANA_ORDEN_ = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function minutosDesdeHHMM_(hhmm) {
  var partes = String(hhmm || '').split(':');
  return (Number(partes[0]) || 0) * 60 + (Number(partes[1]) || 0);
}

function hhmmDesdeMinutos_(minutos) {
  var h = Math.floor(minutos / 60);
  var m = minutos % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

/* Interseccion de dos conjuntos de intervalos {inicio,fin} en minutos. */
function intersectarIntervalos_(setA, setB) {
  var resultado = [];
  setA.forEach(function (a) {
    setB.forEach(function (b) {
      var inicio = Math.max(a.inicio, b.inicio);
      var fin = Math.min(a.fin, b.fin);
      if (fin > inicio) resultado.push({ inicio: inicio, fin: fin });
    });
  });
  return resultado;
}

/*
 * entidadesSeleccionadas: [{tipo: 'Persona/Equipo'|'Recurso', id}].
 * Devuelve, por entidad, sus franjas por dia de la semana (solo
 * HORARIO activo y vigente hoy), y si TODAS tienen al menos una fila
 * de horario, tambien la interseccion por dia (huecos donde coinciden
 * todas a la vez). Si alguna entidad no tiene ningun HORARIO cargado,
 * coincidencias es null -- se avisa en vez de fingir que esa entidad
 * esta libre siempre (seria un falso positivo).
 */
function obtenerDisponibilidadEntidades(entidadesSeleccionadas) {
  entidadesSeleccionadas = entidadesSeleccionadas || [];
  if (entidadesSeleccionadas.length === 0) {
    return { entidades: [], coincidencias: null };
  }
  var inicioMs = Date.now();
  cacheLecturaIniciarContexto_();
  try {

  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  var datos = leerVariasEntidadesBatch_(['HORARIO', 'PERSONA_EQUIPO', 'RECURSO']);

  var horarios = loteFiltrarPorIgualdad_(datos.HORARIO, { ACTIVO: 'SÍ', ESTADO: 'Activa' }).filter(function (h) {
    if (h.FECHA_INICIO_VIGENCIA && hoy < new Date(h.FECHA_INICIO_VIGENCIA)) return false;
    if (h.FECHA_FIN_VIGENCIA && hoy > new Date(h.FECHA_FIN_VIGENCIA)) return false;
    return true;
  });

  var nombresPersona = {};
  datos.PERSONA_EQUIPO.forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });
  var nombresRecurso = {};
  datos.RECURSO.forEach(function (r) { nombresRecurso[r.ID] = r.NOMBRE; });

  var entidades = entidadesSeleccionadas.map(function (sel) {
    var filas = horarios.filter(function (h) { return h.ENTIDAD_TIPO === sel.tipo && h.ENTIDAD_ID === sel.id; });

    var porDia = {};
    DIAS_SEMANA_ORDEN_.forEach(function (dia) { porDia[dia] = []; });
    filas.forEach(function (h) {
      if (!porDia[h.DIA_SEMANA]) return;
      porDia[h.DIA_SEMANA].push({ inicio: h.HORA_INICIO, fin: h.HORA_FIN });
    });

    var nombre = sel.tipo === 'Persona/Equipo' ? (nombresPersona[sel.id] || sel.id) : (nombresRecurso[sel.id] || sel.id);
    return { tipo: sel.tipo, id: sel.id, nombre: nombre, tieneHorario: filas.length > 0, porDia: porDia };
  });

  var todasConHorario = entidades.every(function (e) { return e.tieneHorario; });
  var coincidencias = null;

  if (todasConHorario) {
    coincidencias = {};
    DIAS_SEMANA_ORDEN_.forEach(function (dia) {
      var intervalos = entidades[0].porDia[dia].map(function (f) {
        return { inicio: minutosDesdeHHMM_(f.inicio), fin: minutosDesdeHHMM_(f.fin) };
      });
      for (var i = 1; i < entidades.length && intervalos.length > 0; i++) {
        var siguiente = entidades[i].porDia[dia].map(function (f) {
          return { inicio: minutosDesdeHHMM_(f.inicio), fin: minutosDesdeHHMM_(f.fin) };
        });
        intervalos = intersectarIntervalos_(intervalos, siguiente);
      }
      coincidencias[dia] = intervalos.map(function (iv) {
        return hhmmDesdeMinutos_(iv.inicio) + '–' + hhmmDesdeMinutos_(iv.fin);
      });
    });
  }

  return { entidades: entidades, coincidencias: coincidencias };
  } finally {
    console.log('OK obtenerDisponibilidadEntidades_ms=' + (Date.now() - inicioMs));
    cacheLecturaFinalizarContexto_();
  }
}

/*
 * Ocupacion real de las entidades seleccionadas (ver conversacion:
 * "misma vista que el Gantt principal, añadiendo quien esta usando
 * que y cuando"). Complementa la interseccion de HORARIO (patron
 * semanal, para hueco NUEVO) con las reservas YA existentes sobre
 * fechas reales: TAREA_RESPONSABLE para Persona/Equipo, TAREA_RECURSO
 * para Recurso -- ambas ya tienen sus propias fechas de asignacion,
 * no hace falta pasar por TAREA/PROCESO. Marca solapamientos reales
 * (dos reservas de la misma entidad con fechas cruzadas) para que se
 * pueda ver de un vistazo si hay doble reserva.
 */
function obtenerOcupacionEntidades(entidadesSeleccionadas) {
  entidadesSeleccionadas = entidadesSeleccionadas || [];
  if (entidadesSeleccionadas.length === 0) return { entidades: [] };
  var inicioMs = Date.now();
  cacheLecturaIniciarContexto_();
  try {

  var datos = leerVariasEntidadesBatch_(['PERSONA_EQUIPO', 'RECURSO', 'TAREA', 'TAREA_RESPONSABLE', 'TAREA_RECURSO']);

  var nombresPersona = {};
  datos.PERSONA_EQUIPO.forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });
  var nombresRecurso = {};
  datos.RECURSO.forEach(function (r) { nombresRecurso[r.ID] = r.NOMBRE; });
  var nombresTarea = {};
  datos.TAREA.forEach(function (t) { nombresTarea[t.ID] = t.NOMBRE; });

  var tareaResponsable = loteFiltrarPorIgualdad_(datos.TAREA_RESPONSABLE, { ACTIVO: 'SÍ', ESTADO: 'Activa' });
  var tareaRecurso = loteFiltrarPorIgualdad_(datos.TAREA_RECURSO, { ACTIVO: 'SÍ', ESTADO: 'Activa' });

  function marcarSolapamientos_(reservas) {
    reservas.forEach(function (r, i) {
      r.solapada = reservas.some(function (otra, j) {
        if (i === j || !r.fechaInicio || !r.fechaFin || !otra.fechaInicio || !otra.fechaFin) return false;
        return new Date(r.fechaInicio) <= new Date(otra.fechaFin) && new Date(otra.fechaInicio) <= new Date(r.fechaFin);
      });
    });
  }

  var entidades = entidadesSeleccionadas.map(function (sel) {
    var reservas;
    if (sel.tipo === 'Persona/Equipo') {
      reservas = tareaResponsable.filter(function (tr) { return tr.PERSONA_EQUIPO_ID === sel.id; }).map(function (tr) {
        return {
          id: tr.ID, tareaId: tr.TAREA_ID, nombre: nombresTarea[tr.TAREA_ID] || tr.TAREA_ID, detalle: tr.ROL_ASIGNADO,
          fechaInicio: tr.FECHA_INICIO_ASIGNACION || null, fechaFin: tr.FECHA_FIN_ASIGNACION || null
        };
      });
    } else {
      reservas = tareaRecurso.filter(function (tr) { return tr.RECURSO_ID === sel.id; }).map(function (tr) {
        return {
          id: tr.ID, tareaId: tr.TAREA_ID, nombre: nombresTarea[tr.TAREA_ID] || tr.TAREA_ID, detalle: tr.TIPO_USO,
          fechaInicio: tr.FECHA_INICIO || null, fechaFin: tr.FECHA_FIN || null
        };
      });
    }
    marcarSolapamientos_(reservas);
    reservas.sort(function (a, b) { return new Date(a.fechaInicio || 0) - new Date(b.fechaInicio || 0); });

    var nombre = sel.tipo === 'Persona/Equipo' ? (nombresPersona[sel.id] || sel.id) : (nombresRecurso[sel.id] || sel.id);
    return { tipo: sel.tipo, id: sel.id, nombre: nombre, reservas: reservas };
  });

  return { entidades: entidades };
  } finally {
    console.log('OK obtenerOcupacionEntidades_ms=' + (Date.now() - inicioMs));
    cacheLecturaFinalizarContexto_();
  }
}

/*
 * Vista del dia: gestion de recursos humanos (ver conversacion --
 * "prevista su participacion en los proyectos"). Para una fecha
 * concreta (buscable, no solo hoy), cruza TODAS las personas/equipos
 * activos con su HORARIO declarado ese dia de la semana (vigente en
 * esa fecha) y sus reservas reales ese dia (TAREA_RESPONSABLE). No
 * requiere elegir entidades de antemano -- es la vista global de "quien
 * esta previsto/asignado hoy", complementaria a la comparacion manual
 * de obtenerDisponibilidadEntidades/obtenerOcupacionEntidades.
 *
 * Estados por persona (para ordenar y colorear en el cliente):
 *   ocupado           -- tiene tarea asignada ese dia (con o sin horario declarado)
 *   fuera_de_horario  -- tiene tarea asignada ese dia pero NO le cubre ningun horario declarado
 *   disponible        -- tiene horario declarado ese dia y ninguna tarea asignada
 *   sin_horario       -- ni horario declarado ni tarea asignada ese dia
 */
function obtenerVistaDelDia(fechaISO) {
  var inicioMs = Date.now();
  cacheLecturaIniciarContexto_();
  try {
  var fecha = fechaISO ? new Date(fechaISO + 'T00:00:00') : new Date();
  fecha.setHours(0, 0, 0, 0);
  var nombreDia = DIA_SEMANA_POR_INDICE_JS_[fecha.getDay()];

  /*
   * Lectura por lotes (ver conversacion -- exploracion de rendimiento):
   * las 8 hojas de esta vista se traen en una sola llamada HTTP en vez
   * de 8 llamadas SpreadsheetApp independientes. Con eso el ahorro de
   * "solo leer TAREA/PROCESO/contexto si hay asignacion ese dia" (fix
   * anterior) deja de importar -- una llamada con 8 rangos cuesta casi
   * lo mismo que una con 3 -- asi que se simplifica leyendolo todo
   * siempre. Verificado con Tests_LecturaBatch.js antes de conectarlo.
   */
  var datos = leerVariasEntidadesBatch_([
    'HORARIO', 'TAREA_RESPONSABLE', 'TAREA', 'PROCESO',
    'PROYECTO_PRODUCTO', 'PROYECTO', 'CAMPANA', 'PERSONA_EQUIPO'
  ]);

  var horariosPorPersona = {};
  loteFiltrarPorIgualdad_(datos.HORARIO, { ACTIVO: 'SÍ', ESTADO: 'Activa' }).forEach(function (h) {
    if (h.ENTIDAD_TIPO !== 'Persona/Equipo' || h.DIA_SEMANA !== nombreDia) return;
    if (h.FECHA_INICIO_VIGENCIA && fecha < new Date(h.FECHA_INICIO_VIGENCIA)) return;
    if (h.FECHA_FIN_VIGENCIA && fecha > new Date(h.FECHA_FIN_VIGENCIA)) return;
    if (!horariosPorPersona[h.ENTIDAD_ID]) horariosPorPersona[h.ENTIDAD_ID] = [];
    horariosPorPersona[h.ENTIDAD_ID].push({ inicio: h.HORA_INICIO, fin: h.HORA_FIN });
  });

  var asignacionesHoy = loteFiltrarPorIgualdad_(datos.TAREA_RESPONSABLE, { ACTIVO: 'SÍ', ESTADO: 'Activa' }).filter(function (tr) {
    if (!tr.FECHA_INICIO_ASIGNACION || !tr.FECHA_FIN_ASIGNACION) return false;
    var ini = new Date(tr.FECHA_INICIO_ASIGNACION); ini.setHours(0, 0, 0, 0);
    var fin = new Date(tr.FECHA_FIN_ASIGNACION); fin.setHours(0, 0, 0, 0);
    return fecha >= ini && fecha <= fin;
  });

  var tareasPorId = {};
  datos.TAREA.forEach(function (t) { tareasPorId[t.ID] = t; });
  var procesosPorId = {};
  datos.PROCESO.forEach(function (p) { procesosPorId[p.ID] = p; });
  var contextoPorProducto = construirMapaContextoPorProductoDesdeFilas_(datos.PROYECTO_PRODUCTO, datos.PROYECTO, datos.CAMPANA);

  var tareasPorPersona = {};
  asignacionesHoy.forEach(function (tr) {
    var tarea = tareasPorId[tr.TAREA_ID];
    var proceso = tarea ? procesosPorId[tarea.PROCESO_ID] : null;
    var contexto = proceso ? contextoPorProducto[proceso.PRODUCTO_ID] : null;

    if (!tareasPorPersona[tr.PERSONA_EQUIPO_ID]) tareasPorPersona[tr.PERSONA_EQUIPO_ID] = [];
    tareasPorPersona[tr.PERSONA_EQUIPO_ID].push({
      tareaId: tr.TAREA_ID, nombre: tarea ? tarea.NOMBRE : tr.TAREA_ID, rol: tr.ROL_ASIGNADO,
      proyectoNombre: contexto ? contexto.proyectoNombre : '', campanaNombre: contexto ? contexto.campanaNombre : ''
    });
  });

  var personas = loteFiltrarPorIgualdad_(datos.PERSONA_EQUIPO, { ACTIVO: 'SÍ' }).map(function (p) {
    var horarios = horariosPorPersona[p.ID] || [];
    var tareas = tareasPorPersona[p.ID] || [];
    var estado = tareas.length > 0
      ? (horarios.length > 0 ? 'ocupado' : 'fuera_de_horario')
      : (horarios.length > 0 ? 'disponible' : 'sin_horario');
    return { id: p.ID, nombre: p.NOMBRE, tipo: p.TIPO, rol: p.ROL, horarios: horarios, tareas: tareas, estado: estado };
  });

  var ordenEstado = { ocupado: 0, fuera_de_horario: 1, disponible: 2, sin_horario: 3 };
  personas.sort(function (a, b) {
    return ordenEstado[a.estado] - ordenEstado[b.estado] || a.nombre.localeCompare(b.nombre);
  });

  return {
    fecha: Utilities.formatDate(fecha, Session.getScriptTimeZone() || 'Europe/Madrid', 'yyyy-MM-dd'),
    diaSemana: nombreDia,
    personas: personas
  };
  } finally {
    console.log('OK obtenerVistaDelDia_ms=' + (Date.now() - inicioMs));
    cacheLecturaFinalizarContexto_();
  }
}

/*
 * Vista de rango: registro de quien ha estado, donde y con que, en
 * un periodo cualquiera (ver conversacion: "seleccionar varios dias
 * del calendario y saber quien ha estado en el taller... quien ha
 * estado en que sitio y quien ha usado tal cosa"). Misma fuente que
 * obtenerOcupacionEntidades (TAREA_RESPONSABLE/TAREA_RECURSO, ya
 * planificadas), pero sin necesidad de elegir entidades de antemano
 * -- recorre TODAS y solo devuelve las que tuvieron alguna reserva
 * solapada con el rango (silencio = no aparece, evita listar entidades
 * inactivas en ese periodo cuando el rango es amplio).
 *
 * agrupacion='persona' responde "quien ha estado" (filas=personas,
 * contexto=recurso usado en cada reserva). agrupacion='recurso'
 * responde "quien ha estado en que sitio / que ha usado" (filas=
 * recursos/espacios, contexto=persona responsable de cada reserva).
 * Mismo componente visual que obtenerOcupacionEntidades en el cliente
 * (linea de tiempo con barras), solo cambia el agrupador.
 */
function rangosSeSolapan_(inicioA, finA, inicioB, finB) {
  return new Date(inicioA) <= new Date(finB) && new Date(inicioB) <= new Date(finA);
}

function obtenerOcupacionRango(fechaInicioISO, fechaFinISO, agrupacion) {
  var inicioMs = Date.now();
  cacheLecturaIniciarContexto_();
  try {
  var hoyISO = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Europe/Madrid', 'yyyy-MM-dd');
  var fechaInicio = fechaInicioISO || hoyISO;
  var fechaFin = fechaFinISO || fechaInicio;
  agrupacion = agrupacion === 'recurso' ? 'recurso' : 'persona';

  var datos = leerVariasEntidadesBatch_(['TAREA', 'PERSONA_EQUIPO', 'RECURSO', 'TAREA_RESPONSABLE', 'TAREA_RECURSO']);

  var nombresTarea = {};
  datos.TAREA.forEach(function (t) { nombresTarea[t.ID] = t.NOMBRE; });
  var nombresPersona = {};
  datos.PERSONA_EQUIPO.forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });
  var nombresRecurso = {};
  datos.RECURSO.forEach(function (r) { nombresRecurso[r.ID] = r.NOMBRE; });

  var tareaResponsable = loteFiltrarPorIgualdad_(datos.TAREA_RESPONSABLE, { ACTIVO: 'SÍ', ESTADO: 'Activa' });
  var tareaRecurso = loteFiltrarPorIgualdad_(datos.TAREA_RECURSO, { ACTIVO: 'SÍ', ESTADO: 'Activa' });

  var personasPorTarea = {};
  tareaResponsable.forEach(function (tr) {
    if (!personasPorTarea[tr.TAREA_ID]) personasPorTarea[tr.TAREA_ID] = [];
    personasPorTarea[tr.TAREA_ID].push(nombresPersona[tr.PERSONA_EQUIPO_ID] || tr.PERSONA_EQUIPO_ID);
  });
  var recursosPorTarea = {};
  tareaRecurso.forEach(function (tr) {
    if (!recursosPorTarea[tr.TAREA_ID]) recursosPorTarea[tr.TAREA_ID] = [];
    recursosPorTarea[tr.TAREA_ID].push(nombresRecurso[tr.RECURSO_ID] || tr.RECURSO_ID);
  });

  var filasBase = agrupacion === 'recurso' ? tareaRecurso : tareaResponsable;
  var entidadesMapa = {};

  filasBase.forEach(function (fila) {
    var fInicio = agrupacion === 'recurso' ? fila.FECHA_INICIO : fila.FECHA_INICIO_ASIGNACION;
    var fFin = agrupacion === 'recurso' ? fila.FECHA_FIN : fila.FECHA_FIN_ASIGNACION;
    if (!fInicio || !fFin) return;
    if (!rangosSeSolapan_(fInicio, fFin, fechaInicio, fechaFin)) return;

    var entidadId = agrupacion === 'recurso' ? fila.RECURSO_ID : fila.PERSONA_EQUIPO_ID;
    var entidadNombre = agrupacion === 'recurso' ? (nombresRecurso[entidadId] || entidadId) : (nombresPersona[entidadId] || entidadId);
    if (!entidadesMapa[entidadId]) entidadesMapa[entidadId] = { id: entidadId, nombre: entidadNombre, reservas: [] };

    var contexto = agrupacion === 'recurso'
      ? (personasPorTarea[fila.TAREA_ID] || []).join(', ')
      : (recursosPorTarea[fila.TAREA_ID] || []).join(', ');

    entidadesMapa[entidadId].reservas.push({
      id: fila.ID, tareaId: fila.TAREA_ID, nombre: nombresTarea[fila.TAREA_ID] || fila.TAREA_ID,
      detalle: agrupacion === 'recurso' ? fila.TIPO_USO : fila.ROL_ASIGNADO,
      contexto: contexto, fechaInicio: fInicio, fechaFin: fFin
    });
  });

  var entidades = Object.keys(entidadesMapa).map(function (id) { return entidadesMapa[id]; });
  entidades.forEach(function (e) {
    e.reservas.sort(function (a, b) { return new Date(a.fechaInicio) - new Date(b.fechaInicio); });
  });
  entidades.sort(function (a, b) { return b.reservas.length - a.reservas.length || a.nombre.localeCompare(b.nombre); });

  return { fechaInicio: fechaInicio, fechaFin: fechaFin, agrupacion: agrupacion, entidades: entidades };
  } finally {
    console.log('OK obtenerOcupacionRango_ms=' + (Date.now() - inicioMs));
    cacheLecturaFinalizarContexto_();
  }
}
