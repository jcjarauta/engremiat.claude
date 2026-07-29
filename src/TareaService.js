/*
 * TareaService.gs — Fase 5: capa fina de servicios de negocio.
 * Envuelve el repositorio ya cerrado (insertarRegistroTransaccional,
 * actualizarRegistroTransaccional, desactivarRegistro, reactivarRegistro,
 * obtenerRegistroPorId, listarRegistros, buscarRegistros) con nombres
 * de dominio para TAREA, fijando la clave de entidad y evitando
 * que las capas superiores (formularios, panel) manejen strings de
 * entidad sueltos. No se duplica ninguna validacion: toda la logica
 * de negocio sigue viviendo en el repositorio (Fases 1-4).
 */

function crearTarea(datos, opciones) {
  return insertarRegistroTransaccional('TAREA', datos, opciones);
}

function actualizarTarea(id, cambios, opciones) {
  return actualizarRegistroTransaccional('TAREA', id, cambios, opciones);
}

function desactivarTarea(id) {
  return desactivarRegistro('TAREA', id);
}

function reactivarTarea(id) {
  return reactivarRegistro('TAREA', id);
}

function obtenerTarea(id) {
  return obtenerRegistroPorId('TAREA', id);
}

function listarTareas(filtros) {
  return listarRegistros('TAREA', filtros);
}

function buscarTareas(criterio) {
  return buscarRegistros('TAREA', criterio);
}