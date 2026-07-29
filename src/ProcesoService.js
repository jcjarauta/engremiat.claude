/*
 * ProcesoService.gs — Fase 5: capa fina de servicios de negocio.
 * Envuelve el repositorio ya cerrado (insertarRegistroTransaccional,
 * actualizarRegistroTransaccional, desactivarRegistro, reactivarRegistro,
 * obtenerRegistroPorId, listarRegistros, buscarRegistros) con nombres
 * de dominio para PROCESO, fijando la clave de entidad y evitando
 * que las capas superiores (formularios, panel) manejen strings de
 * entidad sueltos. No se duplica ninguna validacion: toda la logica
 * de negocio sigue viviendo en el repositorio (Fases 1-4).
 */

function crearProceso(datos, opciones) {
  return insertarRegistroTransaccional('PROCESO', datos, opciones);
}

function actualizarProceso(id, cambios, opciones) {
  return actualizarRegistroTransaccional('PROCESO', id, cambios, opciones);
}

function desactivarProceso(id) {
  return desactivarRegistro('PROCESO', id);
}

function reactivarProceso(id) {
  return reactivarRegistro('PROCESO', id);
}

function obtenerProceso(id) {
  return obtenerRegistroPorId('PROCESO', id);
}

function listarProcesos(filtros) {
  return listarRegistros('PROCESO', filtros);
}

function buscarProcesos(criterio) {
  return buscarRegistros('PROCESO', criterio);
}