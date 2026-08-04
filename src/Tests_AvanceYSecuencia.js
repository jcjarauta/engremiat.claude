/**
 * Prueba reactiva del bug real encontrado y corregido en
 * `obtenerSugerenciaSecuencia` (AvanceYSecuencia.js, ver conversación
 * -- "asesor técnico, qué queda por cerrar antes de nuevas
 * funcionalidades"): el guard de PROCESO exigía PRODUCTO_ID incluso
 * cuando PROYECTO_PRODUCTO_ID ya era contexto suficiente, devolviendo
 * `ordenSugerido: null` en silencio -- exactamente el síntoma dejado
 * sin diagnosticar en L4 ("Punto 2", verificación aplazada).
 *
 * Solo lectura (`obtenerSugerenciaSecuencia` no escribe nada), así
 * que no hace falta preparar ni limpiar datos de prueba -- se apoya
 * en PPR-0001/PCS-0002, la misma relación real usada para verificar
 * L3.2/N6.
 */
function pruebaSugerenciaSecuenciaConSoloProyectoProducto() {
  var conSoloProyectoProducto = obtenerSugerenciaSecuencia('PROCESO', { PROYECTO_PRODUCTO_ID: 'PPR-0001' });
  if (conSoloProyectoProducto.ordenSugerido === null || conSoloProyectoProducto.ordenSugerido === undefined) {
    throw new Error('FALLO (regresión del bug): ordenSugerido sigue siendo null pasando solo PROYECTO_PRODUCTO_ID.');
  }
  if (typeof conSoloProyectoProducto.ordenSugerido !== 'number' || conSoloProyectoProducto.ordenSugerido < 1) {
    throw new Error('FALLO: ordenSugerido inesperado: ' + JSON.stringify(conSoloProyectoProducto));
  }

  var sinContexto = obtenerSugerenciaSecuencia('PROCESO', {});
  if (sinContexto.ordenSugerido !== null) {
    throw new Error('FALLO: sin ningún contexto debería seguir devolviendo null, obtuvo: ' + JSON.stringify(sinContexto));
  }

  console.log('OK pruebaSugerenciaSecuenciaConSoloProyectoProducto: ordenSugerido=' + conSoloProyectoProducto.ordenSugerido + ' predecesorId=' + conSoloProyectoProducto.predecesorId);
  return 'result=OK';
}
