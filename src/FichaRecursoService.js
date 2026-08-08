/**
 * Ficha de registro de Espacio/Recurso (roadmap N2.2). Mismo patron que
 * FichaPersonaEquipoService.js/FichaProductoService.js: agregador de
 * solo lectura -- TAREA_RECURSO, HORARIO, DOCUMENTO, incidencias
 * vinculadas via VINCULO (INCIDENCIA no puede apuntar a Recurso
 * directamente, su jerarquia es Campaña->Proyecto->Producto->Proceso->
 * Tarea) y otros recursos ubicados aqui (RECURSO.UBICACION_ID = este).
 */

function obtenerFichaRecurso(id) {
  var recurso = obtenerRegistroPorId('RECURSO', id);
  if (!recurso) {
    throw new Error('No existe ningún registro de Recurso con id "' + id + '".');
  }

  var recursosPorId = {};
  listarRegistros('RECURSO', {}).forEach(function (r) { recursosPorId[r.ID] = r; });
  var nombresPersona = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (p) { nombresPersona[p.ID] = p.NOMBRE; });

  var ubicacion = recurso.UBICACION_ID && recursosPorId[recurso.UBICACION_ID]
    ? { id: recurso.UBICACION_ID, nombre: recursosPorId[recurso.UBICACION_ID].NOMBRE }
    : null;

  var contenidos = listarRegistros('RECURSO', { ACTIVO: 'SÍ' })
    .filter(function (r) { return r.UBICACION_ID === id; })
    .map(function (r) { return { id: r.ID, nombre: r.NOMBRE, clase: r.CLASE_RECURSO, estado: r.ESTADO }; });

  var nombresTarea = {};
  listarRegistros('TAREA', {}).forEach(function (t) { nombresTarea[t.ID] = t; });
  var procesosPorId = {};
  listarRegistros('PROCESO', {}).forEach(function (p) { procesosPorId[p.ID] = p; });
  var contextoPorProducto = construirMapaContextoPorProducto_();

  var usos = listarRegistros('TAREA_RECURSO', { ACTIVO: 'SÍ' })
    .filter(function (tr) { return tr.RECURSO_ID === id; })
    .map(function (tr) {
      var tarea = nombresTarea[tr.TAREA_ID];
      var proceso = tarea ? procesosPorId[tarea.PROCESO_ID] : null;
      var contexto = proceso ? contextoPorProducto[proceso.PRODUCTO_ID] : null;
      return {
        id: tr.ID, tareaId: tr.TAREA_ID, tareaNombre: tarea ? tarea.NOMBRE : tr.TAREA_ID,
        tipoUso: tr.TIPO_USO, fechaInicio: tr.FECHA_INICIO || null, fechaFin: tr.FECHA_FIN || null,
        estado: tr.ESTADO, proyectoNombre: contexto ? contexto.proyectoNombre : ''
      };
    })
    .sort(function (a, b) { return new Date(a.fechaInicio || 0) - new Date(b.fechaInicio || 0); });

  var horarios = listarRegistros('HORARIO', { ACTIVO: 'SÍ' })
    .filter(function (h) { return h.ENTIDAD_TIPO === 'Recurso' && h.ENTIDAD_ID === id; })
    .map(function (h) {
      return {
        id: h.ID, dia: h.DIA_SEMANA, inicio: normalizarHoraHHMM_(h.HORA_INICIO), fin: normalizarHoraHHMM_(h.HORA_FIN), estado: h.ESTADO,
        vigenciaInicio: h.FECHA_INICIO_VIGENCIA || null, vigenciaFin: h.FECHA_FIN_VIGENCIA || null
      };
    });

  var documentos = listarRegistros('DOCUMENTO', { ACTIVO: 'SÍ' })
    .filter(function (d) { return d.ENTIDAD_TIPO === 'Recurso' && d.ENTIDAD_ID === id; })
    .map(function (d) { return { id: d.ID, titulo: d.TITULO, tipo: d.TIPO_DOCUMENTO, estado: d.ESTADO }; });

  /*
   * Incidencias vinculadas: INCIDENCIA no tiene ENTIDAD_TIPO/ENTIDAD_ID
   * generico (su jerarquia es Campaña->Proyecto->Producto->Proceso->
   * Tarea), asi que la unica forma de relacionar una incidencia con un
   * Recurso es a traves de VINCULO (generico), en cualquiera de sus dos
   * direcciones.
   */
  var incidenciasPorId = {};
  listarRegistros('INCIDENCIA', {}).forEach(function (i) { incidenciasPorId[i.ID] = i; });

  var incidenciasVinculadas = listarRegistros('VINCULO', { ACTIVO: 'SÍ' })
    .filter(function (v) {
      return (v.ENTIDAD_ORIGEN_TIPO === 'Recurso' && v.ENTIDAD_ORIGEN_ID === id && v.ENTIDAD_DESTINO_TIPO === 'Incidencia') ||
             (v.ENTIDAD_DESTINO_TIPO === 'Recurso' && v.ENTIDAD_DESTINO_ID === id && v.ENTIDAD_ORIGEN_TIPO === 'Incidencia');
    })
    .map(function (v) {
      var esOrigen = v.ENTIDAD_ORIGEN_TIPO === 'Recurso' && v.ENTIDAD_ORIGEN_ID === id;
      var incidenciaId = esOrigen ? v.ENTIDAD_DESTINO_ID : v.ENTIDAD_ORIGEN_ID;
      var incidencia = incidenciasPorId[incidenciaId];
      return {
        vinculoId: v.ID, incidenciaId: incidenciaId,
        titulo: incidencia ? incidencia.TITULO : incidenciaId,
        estado: incidencia ? incidencia.ESTADO : ''
      };
    });

  return serializarParaCliente_({
    recurso: recurso,
    responsableNombre: nombresPersona[recurso.RESPONSABLE_ID] || '',
    ubicacion: ubicacion,
    contenidos: contenidos,
    usos: usos,
    horarios: horarios,
    documentos: documentos,
    incidenciasVinculadas: incidenciasVinculadas
  });
}

function abrirFichaRecurso(id) {
  var template = HtmlService.createTemplateFromFile('FichaRecurso');
  template.idRegistro = id;
  var html = template.evaluate().setWidth(560).setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(html, 'Ficha: ' + id);
}

function seleccionarYAbrirFichaRecurso(entidad, idRegistro) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);
  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }
  abrirFichaRecurso(idRegistro);
  return true;
}

function abrirFichaRecursoBuscar() {
  abrirSelectorConAccion_('RECURSO', 'Ver ficha de espacio/recurso', 'seleccionarYAbrirFichaRecurso', 'obtenerOpcionesEntidadParaSelector', true);
}

function abrirFormularioCrearHorarioParaRecurso(recursoId) {
  abrirFormularioCrear_('HORARIO', 'Nuevo horario (franja semanal)', {
    ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: recursoId
  }, { tipo: 'ficha', entidad: 'RECURSO', id: recursoId });
}

function abrirFormularioCrearDocumentoParaRecurso(recursoId) {
  abrirFormularioCrear_('DOCUMENTO', 'Nuevo documento', {
    ENTIDAD_TIPO: 'Recurso', ENTIDAD_ID: recursoId
  }, { tipo: 'ficha', entidad: 'RECURSO', id: recursoId });
}
