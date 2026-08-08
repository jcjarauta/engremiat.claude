/**
 * Ficha de registro de Persona/Equipo (ver conversacion: patron "ficha
 * de registro", varias veces diferido para relaciones muchos-a-muchos
 * que no encajan en un arbol). Agregador de solo lectura: no inventa
 * relaciones nuevas, reune las que ya existen y apuntan a un registro
 * PERSONA_EQUIPO -- EQUIPO_MIEMBRO (en ambas direcciones), COORDINADOR_ID
 * (en ambas direcciones), HORARIO, TAREA_RESPONSABLE, ASIGNACION,
 * DOCUMENTO y VINCULO (estos dos ultimos posibles desde que se amplio
 * CFG_ENTIDAD_DOCUMENTO con "Persona/Equipo", ver
 * InstaladorEntidadPersonaDocumento.js).
 */

/*
 * Resuelve una etiqueta legible para una fila ENTIDAD_TIPO/ENTIDAD_ID
 * generica (usada por ASIGNACION/VINCULO), reutilizando el mismo mapa
 * de nombres internos que ya usa el resolver DOCUMENTO_ENTIDAD_ID.
 */
function etiquetaEntidadGenerica_(entidadTipoLabel, entidadId) {
  var claveInterna = ENTIDAD_DOCUMENTO_A_MVP[entidadTipoLabel];
  if (!claveInterna || !entidadId) return entidadTipoLabel + ': ' + entidadId;
  var registro = obtenerRegistroPorId(claveInterna, entidadId);
  if (!registro) return entidadTipoLabel + ': ' + entidadId + ' (no encontrado)';
  return entidadTipoLabel + ': ' + (registro.NOMBRE || registro.TITULO || registro.ID);
}

/*
 * Clasifica una tarea por fecha (ver conversacion: "tareas del dia,
 * proximas o terminadas"). Basado en fechas de PLAN, no de REAL --
 * igual criterio que calcularRiesgoRegistro_ en DesviacionService.js.
 * "Cerrada" por coincidencia de texto (mismo patron que claseBadgeEstado_
 * en los paneles), para no depender de listar los estados exactos del
 * catalogo CFG_ESTADO_TAREA.
 */
function clasificarTareaPorFecha_(tarea) {
  var estado = String(tarea.ESTADO || '').toLowerCase();
  if (estado.indexOf('complet') !== -1 || estado.indexOf('cancel') !== -1) return 'terminadas';
  if (!tarea.FECHA_INICIO_PLAN || !tarea.FECHA_FIN_PLAN) return 'otras';

  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  var inicio = new Date(tarea.FECHA_INICIO_PLAN); inicio.setHours(0, 0, 0, 0);
  var fin = new Date(tarea.FECHA_FIN_PLAN); fin.setHours(0, 0, 0, 0);

  if (hoy >= inicio && hoy <= fin) return 'hoy';
  if (inicio > hoy) return 'proximas';
  return 'otras'; // vencida sin cerrar -- misma senal que "en riesgo" del Gantt
}

function obtenerFichaPersonaEquipo(id) {
  var persona = obtenerRegistroPorId('PERSONA_EQUIPO', id);
  if (!persona) {
    throw new Error('No existe ningún registro de Persona/Equipo con id "' + id + '".');
  }

  var esEquipo = persona.TIPO === 'Equipo';

  var nombresPersona = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (p) {
    nombresPersona[p.ID] = p.NOMBRE;
  });

  var equipoMiembro = listarRegistros('EQUIPO_MIEMBRO', { ACTIVO: 'SÍ' });

  var miembros = !esEquipo ? [] : equipoMiembro
    .filter(function (em) { return em.EQUIPO_ID === id; })
    .map(function (em) {
      return {
        id: em.ID, miembroId: em.MIEMBRO_ID, miembroNombre: nombresPersona[em.MIEMBRO_ID] || em.MIEMBRO_ID,
        rol: em.ROL_EN_EQUIPO, estado: em.ESTADO
      };
    });

  var equiposDondeEsMiembro = esEquipo ? [] : equipoMiembro
    .filter(function (em) { return em.MIEMBRO_ID === id; })
    .map(function (em) {
      return {
        id: em.ID, equipoId: em.EQUIPO_ID, equipoNombre: nombresPersona[em.EQUIPO_ID] || em.EQUIPO_ID,
        rol: em.ROL_EN_EQUIPO, estado: em.ESTADO
      };
    });

  var coordinador = (esEquipo && persona.COORDINADOR_ID)
    ? { id: persona.COORDINADOR_ID, nombre: nombresPersona[persona.COORDINADOR_ID] || persona.COORDINADOR_ID }
    : null;

  var equiposQueCoordina = esEquipo ? [] : listarRegistros('PERSONA_EQUIPO', { ACTIVO: 'SÍ', TIPO: 'Equipo' })
    .filter(function (e) { return e.COORDINADOR_ID === id; })
    .map(function (e) { return { id: e.ID, nombre: e.NOMBRE, estado: e.ESTADO }; });

  var horarios = listarRegistros('HORARIO', { ACTIVO: 'SÍ' })
    .filter(function (h) { return h.ENTIDAD_TIPO === 'Persona/Equipo' && h.ENTIDAD_ID === id; })
    .map(function (h) {
      return {
        id: h.ID, dia: h.DIA_SEMANA, inicio: normalizarHoraHHMM_(h.HORA_INICIO), fin: normalizarHoraHHMM_(h.HORA_FIN), estado: h.ESTADO,
        vigenciaInicio: h.FECHA_INICIO_VIGENCIA || null, vigenciaFin: h.FECHA_FIN_VIGENCIA || null
      };
    });

  var contextoPorProducto = construirMapaContextoPorProducto_();
  var procesosPorId = {};
  listarRegistros('PROCESO', {}).forEach(function (p) { procesosPorId[p.ID] = p; });

  var tareasResponsable = listarRegistros('TAREA_RESPONSABLE', { ACTIVO: 'SÍ' })
    .filter(function (tr) { return tr.PERSONA_EQUIPO_ID === id; })
    .map(function (tr) {
      var tarea = obtenerRegistroPorId('TAREA', tr.TAREA_ID);
      var proceso = tarea ? procesosPorId[tarea.PROCESO_ID] : null;
      var contexto = proceso ? contextoPorProducto[proceso.PRODUCTO_ID] : null;
      return {
        id: tr.ID, tareaId: tr.TAREA_ID, tareaNombre: tarea ? tarea.NOMBRE : tr.TAREA_ID,
        rol: tr.ROL_ASIGNADO, estado: tarea ? tarea.ESTADO : '',
        fechaInicioPlan: tarea ? tarea.FECHA_INICIO_PLAN : null,
        fechaFinPlan: tarea ? tarea.FECHA_FIN_PLAN : null,
        proyectoId: contexto ? contexto.proyectoId : null,
        proyectoNombre: contexto ? contexto.proyectoNombre : null,
        campanaNombre: contexto ? contexto.campanaNombre : null,
        grupoFecha: tarea ? clasificarTareaPorFecha_(tarea) : 'otras'
      };
    })
    .sort(function (a, b) { return new Date(a.fechaInicioPlan || 0) - new Date(b.fechaInicioPlan || 0); });

  var tareasPorFecha = { hoy: [], proximas: [], terminadas: [], otras: [] };
  tareasResponsable.forEach(function (t) { tareasPorFecha[t.grupoFecha].push(t); });

  var asignacionesCrudas = listarRegistros('ASIGNACION', { ACTIVO: 'SÍ' })
    .filter(function (a) { return a.PERSONA_EQUIPO_ID === id; });

  var asignaciones = asignacionesCrudas.map(function (a) {
    return { id: a.ID, entidad: etiquetaEntidadGenerica_(a.ENTIDAD_TIPO, a.ENTIDAD_ID), rol: a.ROL_ASIGNADO, estado: a.ESTADO };
  });

  /*
   * Proyectos involucrados (ver conversacion): no es una relacion nueva,
   * se deriva de las tareas de las que es responsable (via PROCESO->
   * PRODUCTO->PROYECTO_PRODUCTO, el mismo mapa que usa el Gantt) y de
   * las asignaciones genericas que apunten directamente a un Proyecto.
   */
  var proyectosMapa = {};
  tareasResponsable.forEach(function (t) {
    if (!t.proyectoId) return;
    if (!proyectosMapa[t.proyectoId]) {
      proyectosMapa[t.proyectoId] = { id: t.proyectoId, nombre: t.proyectoNombre, campana: t.campanaNombre, tareasTotal: 0, tareasAbiertas: 0 };
    }
    proyectosMapa[t.proyectoId].tareasTotal += 1;
    if (t.grupoFecha !== 'terminadas') proyectosMapa[t.proyectoId].tareasAbiertas += 1;
  });
  asignacionesCrudas.filter(function (a) { return a.ENTIDAD_TIPO === 'Proyecto'; }).forEach(function (a) {
    if (!proyectosMapa[a.ENTIDAD_ID]) {
      var proyecto = obtenerRegistroPorId('PROYECTO', a.ENTIDAD_ID);
      var campana = proyecto ? obtenerRegistroPorId('CAMPANA', proyecto.CAMPANA_ID) : null;
      proyectosMapa[a.ENTIDAD_ID] = {
        id: a.ENTIDAD_ID, nombre: proyecto ? proyecto.NOMBRE : a.ENTIDAD_ID,
        campana: campana ? campana.NOMBRE : '', tareasTotal: 0, tareasAbiertas: 0
      };
    }
  });
  var proyectosInvolucrado = Object.keys(proyectosMapa).map(function (k) { return proyectosMapa[k]; });

  var documentos = listarRegistros('DOCUMENTO', { ACTIVO: 'SÍ' })
    .filter(function (d) { return d.ENTIDAD_TIPO === 'Persona/Equipo' && d.ENTIDAD_ID === id; })
    .map(function (d) { return { id: d.ID, titulo: d.TITULO, tipo: d.TIPO_DOCUMENTO, estado: d.ESTADO }; });

  var vinculos = listarRegistros('VINCULO', { ACTIVO: 'SÍ' })
    .filter(function (v) {
      return (v.ENTIDAD_ORIGEN_TIPO === 'Persona/Equipo' && v.ENTIDAD_ORIGEN_ID === id) ||
             (v.ENTIDAD_DESTINO_TIPO === 'Persona/Equipo' && v.ENTIDAD_DESTINO_ID === id);
    })
    .map(function (v) {
      var esOrigen = v.ENTIDAD_ORIGEN_TIPO === 'Persona/Equipo' && v.ENTIDAD_ORIGEN_ID === id;
      var otroTipo = esOrigen ? v.ENTIDAD_DESTINO_TIPO : v.ENTIDAD_ORIGEN_TIPO;
      var otroId = esOrigen ? v.ENTIDAD_DESTINO_ID : v.ENTIDAD_ORIGEN_ID;
      return {
        id: v.ID, tipoVinculo: v.TIPO_VINCULO,
        direccion: esOrigen ? 'hacia' : 'desde',
        otro: etiquetaEntidadGenerica_(otroTipo, otroId)
      };
    });

  return serializarParaCliente_({
    persona: persona,
    esEquipo: esEquipo,
    miembros: miembros,
    equiposDondeEsMiembro: equiposDondeEsMiembro,
    coordinador: coordinador,
    equiposQueCoordina: equiposQueCoordina,
    horarios: horarios,
    proyectosInvolucrado: proyectosInvolucrado,
    tareasPorFecha: tareasPorFecha,
    asignaciones: asignaciones,
    documentos: documentos,
    vinculos: vinculos
  });
}

function abrirFichaPersonaEquipo(id) {
  var template = HtmlService.createTemplateFromFile('FichaPersonaEquipo');
  template.idRegistro = id;
  var html = template.evaluate().setWidth(560).setHeight(640);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Ficha: ' + id);
}

/* accionFn del selector generico (SelectorRegistro.html): firma (entidad, idRegistro). */
function seleccionarYAbrirFicha(entidad, idRegistro) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);
  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }
  abrirFichaPersonaEquipo(idRegistro);
  return true;
}

function abrirFichaPersonaEquipoBuscar() {
  abrirSelectorConAccion_('PERSONA_EQUIPO', 'Ver ficha de persona/equipo', 'seleccionarYAbrirFicha', 'obtenerOpcionesEntidadParaSelector', true);
}

/*
 * Prefija ENTIDAD_TIPO/ENTIDAD_ID -- mismo mecanismo PREFILL que la
 * cadena Campaña->Proyecto -- y retorna a esta misma ficha al cerrar
 * el formulario (ver conversacion: "no tener que salir de la ficha").
 */
function abrirFormularioCrearHorarioParaPersonaEquipo(entidadId) {
  abrirFormularioCrear_('HORARIO', 'Nuevo horario (franja semanal)', {
    ENTIDAD_TIPO: 'Persona/Equipo', ENTIDAD_ID: entidadId
  }, { tipo: 'ficha', entidad: 'PERSONA_EQUIPO', id: entidadId });
}
