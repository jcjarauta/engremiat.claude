/**
 * Fase N6 (ver conversación -- eje "Por qué"): etiquetas de impacto
 * (N6.1) + informe de evidencia (N6.2), como pieza propia en vez de
 * quedar enterradas dentro del informe de justificación económica
 * (donde ya vivía `calcularImpactoSocialAmbito_`, construido de paso
 * en N5.1). Alimenta el Balanç Social anual (XES) con datos reales,
 * sin replicar su cuestionario completo dentro del sistema (decisión
 * ya tomada al diseñar N6).
 *
 * Reutiliza sin duplicar: `resolverAmbitoCoste_`/
 * `calcularImpactoSocialAmbito_` (CosteService.js) y
 * `nombreRegistroEntidad_`/`obtenerOpcionesRegistroPorNivel`
 * (CosteService.js, ya genéricos, no específicos de economía).
 */

/*
 * "Reutilización" como indicador de evidencia (ver conversación --
 * "materiales reutilizados"): no existe un inventario de reutilización
 * de materiales físicos en el sistema, así que se usa el proxy
 * determinista que sí existe -- MODO_USO (L3.2) en PROYECTO_PRODUCTO/
 * PROCESO, cuando indica reutilización o adaptación de un
 * producto/proceso ya definido en vez de crear uno desde cero. Se
 * etiqueta explícitamente como tal en el informe, sin presentarlo como
 * si fuera literalmente material físico reutilizado.
 */
function calcularReutilizacionAmbito_(ambito) {
  var modosReutilizacion = ['Reutilización sin cambios', 'Adaptación específica'];

  var relacionesReutilizadas = listarRegistros('PROYECTO_PRODUCTO', { ACTIVO: 'SÍ' })
    .filter(function (r) {
      return ambito.productosIds.indexOf(r.PRODUCTO_ID) !== -1 && modosReutilizacion.indexOf(r.MODO_USO) !== -1;
    })
    .map(function (r) {
      return {
        id: r.ID,
        proyectoId: r.PROYECTO_ID,
        proyectoNombre: nombreRegistroEntidad_('Proyecto', r.PROYECTO_ID),
        productoId: r.PRODUCTO_ID,
        productoNombre: nombreRegistroEntidad_('Producto', r.PRODUCTO_ID),
        modoUso: r.MODO_USO
      };
    });

  var procesosReutilizados = listarRegistros('PROCESO', { ACTIVO: 'SÍ' })
    .filter(function (p) {
      return ambito.productosIds.indexOf(p.PRODUCTO_ID) !== -1 && modosReutilizacion.indexOf(p.MODO_USO) !== -1;
    })
    .map(function (p) {
      return {
        id: p.ID,
        nombre: p.NOMBRE,
        productoId: p.PRODUCTO_ID,
        productoNombre: nombreRegistroEntidad_('Producto', p.PRODUCTO_ID),
        modoUso: p.MODO_USO
      };
    });

  return {
    relacionesReutilizadas: relacionesReutilizadas,
    procesosReutilizados: procesosReutilizados,
    totalReutilizaciones: relacionesReutilizadas.length + procesosReutilizados.length
  };
}

function obtenerEtiquetasImpactoAmbito_(ambito) {
  var idsValidos = {};
  if (ambito.campanaId) idsValidos['Campaña:' + ambito.campanaId] = true;
  ambito.proyectosIds.forEach(function (id) { idsValidos['Proyecto:' + id] = true; });
  ambito.productosIds.forEach(function (id) { idsValidos['Producto:' + id] = true; });

  var etiquetas = listarRegistros('ETIQUETA_IMPACTO', { ACTIVO: 'SÍ' })
    .filter(function (e) { return idsValidos[e.ENTIDAD_TIPO + ':' + e.ENTIDAD_ID]; })
    .map(function (e) {
      return {
        id: e.ID,
        entidadTipo: e.ENTIDAD_TIPO,
        entidadId: e.ENTIDAD_ID,
        entidadNombre: nombreRegistroEntidad_(e.ENTIDAD_TIPO, e.ENTIDAD_ID),
        categoria: e.CATEGORIA_IMPACTO,
        descripcion: e.DESCRIPCION
      };
    });

  var porCategoria = {};
  etiquetas.forEach(function (e) {
    porCategoria[e.categoria] = (porCategoria[e.categoria] || 0) + 1;
  });

  return { etiquetas: etiquetas, porCategoria: porCategoria };
}

function generarInformeEvidenciaSocial(entidadTipo, entidadId) {
  if (!entidadTipo || !entidadId) {
    throw new Error('ERROR_INFORME: elige un nivel y un registro antes de generar el informe.');
  }

  var ambito = resolverAmbitoCoste_(entidadTipo, entidadId);
  var impactoSocial = calcularImpactoSocialAmbito_(ambito.productosIds);
  var reutilizacion = calcularReutilizacionAmbito_(ambito);
  var etiquetas = obtenerEtiquetasImpactoAmbito_(ambito);

  return serializarParaCliente_({
    tipo: 'EVIDENCIA_SOCIAL',
    entidadTipo: entidadTipo,
    entidadId: entidadId,
    entidadNombre: nombreRegistroEntidad_(entidadTipo, entidadId),
    impactoSocial: impactoSocial,
    reutilizacion: reutilizacion,
    etiquetasImpacto: etiquetas.etiquetas,
    etiquetasPorCategoria: etiquetas.porCategoria
  });
}
