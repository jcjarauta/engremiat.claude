/*
 * CampanaService.gs — Fase 5: capa fina de servicios de negocio.
 * Envuelve el repositorio ya cerrado (insertarRegistroTransaccional,
 * actualizarRegistroTransaccional, desactivarRegistro, reactivarRegistro,
 * obtenerRegistroPorId, listarRegistros, buscarRegistros) con nombres
 * de dominio para CAMPANA, fijando la clave de entidad y evitando
 * que las capas superiores (formularios, panel) manejen strings de
 * entidad sueltos. No se duplica ninguna validacion: toda la logica
 * de negocio sigue viviendo en el repositorio (Fases 1-4).
 */

function crearCampana(datos, opciones) {
  return insertarRegistroTransaccional('CAMPANA', datos, opciones);
}

function actualizarCampana(id, cambios, opciones) {
  return actualizarRegistroTransaccional('CAMPANA', id, cambios, opciones);
}

function desactivarCampana(id) {
  return desactivarRegistro('CAMPANA', id);
}

function reactivarCampana(id) {
  return reactivarRegistro('CAMPANA', id);
}

function obtenerCampana(id) {
  return obtenerRegistroPorId('CAMPANA', id);
}

function listarCampanas(filtros) {
  return listarRegistros('CAMPANA', filtros);
}

function buscarCampanas(criterio) {
  return buscarRegistros('CAMPANA', criterio);
}