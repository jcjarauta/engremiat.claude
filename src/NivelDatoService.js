/**
 * Distinción genérica Operativo/Piloto/Auditoría (ver conversación --
 * "revisa las expectativas del sistema", asesoría técnica 2026-08-04,
 * y memoria `latroballa_datos_prueba_a_auditar`). Alcance acotado a
 * CAMPANA y PROYECTO (resolución directa y sin ambigüedad); PRODUCTO/
 * PROCESO/TAREA quedan fuera de esta primera pasada porque se
 * reutilizan entre campañas vía PROYECTO_PRODUCTO N:M.
 */

function resolverNivelDatoPorCampana_() {
  var mapa = {};
  listarRegistros('CAMPANA', {}).forEach(function (c) {
    mapa[c.ID] = String(c.NIVEL_DATO || '').trim() || 'Operativo';
  });
  return mapa;
}

/*
 * Filtra una lista de registros de CAMPANA o PROYECTO por nivel de
 * dato. incluirPruebas=false (por defecto) excluye Piloto/Auditoría;
 * true los incluye todos, con la etiqueta ampliada para distinguirlos
 * en la UI (ver aplicarSufijoNivelDato_).
 */
function filtrarPorNivelDato_(entidad, registros, incluirPruebas) {
  if (incluirPruebas) return registros;

  var clave = String(entidad || '').trim().toUpperCase();
  var nivelPorCampana = resolverNivelDatoPorCampana_();

  return registros.filter(function (r) {
    var campanaId = clave === 'CAMPANA' ? r.ID : r.CAMPANA_ID;
    var nivel = nivelPorCampana[campanaId] || 'Operativo';
    return nivel === 'Operativo';
  });
}

function aplicarSufijoNivelDato_(entidad, registro, etiqueta) {
  var clave = String(entidad || '').trim().toUpperCase();
  if (clave !== 'CAMPANA' && clave !== 'PROYECTO') return etiqueta;

  var nivelPorCampana = resolverNivelDatoPorCampana_();
  var campanaId = clave === 'CAMPANA' ? registro.ID : registro.CAMPANA_ID;
  var nivel = nivelPorCampana[campanaId] || 'Operativo';

  return nivel === 'Operativo' ? etiqueta : etiqueta + ' [' + nivel + ']';
}
