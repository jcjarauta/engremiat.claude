/*
 * ProductoService.gs — Fase 5: capa fina de servicios de negocio.
 * Envuelve el repositorio ya cerrado (insertarRegistroTransaccional,
 * actualizarRegistroTransaccional, desactivarRegistro, reactivarRegistro,
 * obtenerRegistroPorId, listarRegistros, buscarRegistros) con nombres
 * de dominio para PRODUCTO, fijando la clave de entidad y evitando
 * que las capas superiores (formularios, panel) manejen strings de
 * entidad sueltos. No se duplica ninguna validacion: toda la logica
 * de negocio sigue viviendo en el repositorio (Fases 1-4).
 */

function crearProducto(datos, opciones) {
  return insertarRegistroTransaccional('PRODUCTO', datos, opciones);
}

function actualizarProducto(id, cambios, opciones) {
  return actualizarRegistroTransaccional('PRODUCTO', id, cambios, opciones);
}

function desactivarProducto(id) {
  return desactivarRegistro('PRODUCTO', id);
}

function reactivarProducto(id) {
  return reactivarRegistro('PRODUCTO', id);
}

function obtenerProducto(id) {
  return obtenerRegistroPorId('PRODUCTO', id);
}

function listarProductos(filtros) {
  return listarRegistros('PRODUCTO', filtros);
}

function buscarProductos(criterio) {
  return buscarRegistros('PRODUCTO', criterio);
}