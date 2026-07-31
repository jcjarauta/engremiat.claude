/**
 * Prepara datos para cruzar la frontera google.script.run hacia el cliente.
 * Convierte recursivamente cualquier objeto Date a texto ISO: devolver un
 * Date crudo dentro de una estructura anidada (objeto/array) puede hacer
 * que la serialización de Apps Script caiga a una representación Java
 * (toString()) en vez de JSON, dejando la respuesta inutilizable en el
 * cliente sin ningún error visible.
 */
function serializarParaCliente_(valor) {
  if (valor instanceof Date) {
    return valor.toISOString();
  }

  if (Array.isArray(valor)) {
    return valor.map(serializarParaCliente_);
  }

  if (valor && typeof valor === 'object') {
    var resultado = {};

    Object.keys(valor).forEach(function (clave) {
      resultado[clave] = serializarParaCliente_(valor[clave]);
    });

    return resultado;
  }

  return valor;
}
