/**
 * Caché de lectura con alcance de una sola ejecución (Paso 6 del roadmap).
 * No cambia ningún dato ni lógica de negocio: evita releer la misma hoja
 * varias veces dentro de una única llamada a obtenerReporteIntegridad().
 * El contexto se abre y se cierra explícitamente; fuera de un contexto
 * activo, las funciones de este archivo son transparentes (no cachean).
 */

var CACHE_LECTURA_ESTADO_ = {
  activo: false,
  filasObjetos: {},
  valoresMostrados: {}
};

function cacheLecturaIniciarContexto_() {
  CACHE_LECTURA_ESTADO_.activo = true;
  CACHE_LECTURA_ESTADO_.filasObjetos = {};
  CACHE_LECTURA_ESTADO_.valoresMostrados = {};
}

function cacheLecturaFinalizarContexto_() {
  CACHE_LECTURA_ESTADO_.activo = false;
  CACHE_LECTURA_ESTADO_.filasObjetos = {};
  CACHE_LECTURA_ESTADO_.valoresMostrados = {};
}

function cacheLecturaEjecutar_(mapaCache, entidad, funcionLectura) {
  if (!CACHE_LECTURA_ESTADO_.activo) {
    return funcionLectura();
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      mapaCache,
      entidad
    )
  ) {
    mapaCache[entidad] = funcionLectura();
  }

  return mapaCache[entidad];
}

/**
 * Cachea el resultado de leerFilasEntidadComoObjetos_ (array de objetos,
 * vía getValues()).
 */
function cacheLecturaFilasObjetos_(entidad, funcionLectura) {
  return cacheLecturaEjecutar_(
    CACHE_LECTURA_ESTADO_.filasObjetos,
    entidad,
    funcionLectura
  );
}

/**
 * Cachea el resultado crudo de getDataRange().getDisplayValues(), usado
 * por obtenerIdsDeEntidad_ y detectarReferenciasHuerfanas.
 */
function cacheLecturaValoresMostrados_(entidad, funcionLectura) {
  return cacheLecturaEjecutar_(
    CACHE_LECTURA_ESTADO_.valoresMostrados,
    entidad,
    funcionLectura
  );
}
