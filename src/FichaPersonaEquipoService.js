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
    .map(function (h) { return { id: h.ID, dia: h.DIA_SEMANA, inicio: h.HORA_INICIO, fin: h.HORA_FIN, estado: h.ESTADO }; });

  var tareasResponsable = listarRegistros('TAREA_RESPONSABLE', { ACTIVO: 'SÍ' })
    .filter(function (tr) { return tr.PERSONA_EQUIPO_ID === id; })
    .map(function (tr) {
      var tarea = obtenerRegistroPorId('TAREA', tr.TAREA_ID);
      return {
        id: tr.ID, tareaId: tr.TAREA_ID, tareaNombre: tarea ? tarea.NOMBRE : tr.TAREA_ID,
        rol: tr.ROL_ASIGNADO, estado: tr.ESTADO,
        fechaInicioPlan: tarea ? tarea.FECHA_INICIO_PLAN : null,
        fechaFinPlan: tarea ? tarea.FECHA_FIN_PLAN : null
      };
    });

  var asignaciones = listarRegistros('ASIGNACION', { ACTIVO: 'SÍ' })
    .filter(function (a) { return a.PERSONA_EQUIPO_ID === id; })
    .map(function (a) {
      return { id: a.ID, entidad: etiquetaEntidadGenerica_(a.ENTIDAD_TIPO, a.ENTIDAD_ID), rol: a.ROL_ASIGNADO, estado: a.ESTADO };
    });

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
    tareasResponsable: tareasResponsable,
    asignaciones: asignaciones,
    documentos: documentos,
    vinculos: vinculos
  });
}

function abrirFichaPersonaEquipo(id) {
  var template = HtmlService.createTemplateFromFile('FichaPersonaEquipo');
  template.idRegistro = id;
  var html = template.evaluate().setWidth(560).setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(html, 'Ficha: ' + id);
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
  abrirSelectorConAccion_('PERSONA_EQUIPO', 'Ver ficha de persona/equipo', 'seleccionarYAbrirFicha', 'obtenerOpcionesEntidadParaSelector');
}

/* Prefija ENTIDAD_TIPO/ENTIDAD_ID -- mismo mecanismo PREFILL que la cadena Campaña->Proyecto. */
function abrirFormularioCrearHorarioParaPersonaEquipo(entidadId) {
  abrirFormularioCrear_('HORARIO', 'Nuevo horario (franja semanal)', {
    ENTIDAD_TIPO: 'Persona/Equipo', ENTIDAD_ID: entidadId
  });
}
