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

  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  var horarios = listarRegistros('HORARIO', { ACTIVO: 'SÍ', ESTADO: 'Activa' }).filter(function (h) {
    if (h.FECHA_INICIO_VIGENCIA && hoy < new Date(h.FECHA_INICIO_VIGENCIA)) return false;
    if (h.FECHA_FIN_VIGENCIA && hoy > new Date(h.FECHA_FIN_VIGENCIA)) return false;
    return true;
  });

  var nombresPersona = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });
  var nombresRecurso = {};
  listarRegistros('RECURSO', {}).forEach(function (r) { nombresRecurso[r.ID] = r.NOMBRE; });

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

  var nombresPersona = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });
  var nombresRecurso = {};
  listarRegistros('RECURSO', {}).forEach(function (r) { nombresRecurso[r.ID] = r.NOMBRE; });
  var nombresTarea = {};
  listarRegistros('TAREA', {}).forEach(function (t) { nombresTarea[t.ID] = t.NOMBRE; });

  var tareaResponsable = listarRegistros('TAREA_RESPONSABLE', { ACTIVO: 'SÍ', ESTADO: 'Activa' });
  var tareaRecurso = listarRegistros('TAREA_RECURSO', { ACTIVO: 'SÍ', ESTADO: 'Activa' });

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
}
