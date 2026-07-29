/*
 * ProyectoService.gs — Fase 5: capa fina de servicios de negocio.
 * Envuelve el repositorio ya cerrado (insertarRegistroTransaccional,
 * actualizarRegistroTransaccional, desactivarRegistro, reactivarRegistro,
 * obtenerRegistroPorId, listarRegistros, buscarRegistros) con nombres
 * de dominio para PROYECTO, fijando la clave de entidad y evitando
 * que las capas superiores (formularios, panel) manejen strings de
 * entidad sueltos. No se duplica ninguna validacion: toda la logica
 * de negocio sigue viviendo en el repositorio (Fases 1-4).
 */

function crearProyecto(datos, opciones) {
  return insertarRegistroTransaccional('PROYECTO', datos, opciones);
}

function actualizarProyecto(id, cambios, opciones) {
  return actualizarRegistroTransaccional('PROYECTO', id, cambios, opciones);
}

function desactivarProyecto(id) {
  return desactivarRegistro('PROYECTO', id);
}

function reactivarProyecto(id) {
  return reactivarRegistro('PROYECTO', id);
}

function obtenerProyecto(id) {
  return obtenerRegistroPorId('PROYECTO', id);
}

function listarProyectos(filtros) {
  return listarRegistros('PROYECTO', filtros);
}

function buscarProyectos(criterio) {
  return buscarRegistros('PROYECTO', criterio);
}