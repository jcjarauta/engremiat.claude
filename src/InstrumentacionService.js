/**
 * Instrumentación barata de Fase I (adelantada, Paso 2 del roadmap).
 * Solo mide: no modifica el comportamiento de lectura/escritura.
 * Contadores globales de lecturas de hoja y flushes, más un
 * envoltorio para medir duración de bloques concretos.
 */

var INSTRUMENTACION_ESTADO_ = {
  lecturasHoja: 0,
  flushes: 0,
  flushInterceptado: false
};

function instrumentacionRegistrarLecturaHoja_() {
  INSTRUMENTACION_ESTADO_.lecturasHoja++;
}

function instrumentacionActivarFlush_() {
  if (INSTRUMENTACION_ESTADO_.flushInterceptado) {
    return;
  }

  var flushOriginal_ = SpreadsheetApp.flush;

  SpreadsheetApp.flush = function () {
    INSTRUMENTACION_ESTADO_.flushes++;
    return flushOriginal_.apply(SpreadsheetApp, arguments);
  };

  INSTRUMENTACION_ESTADO_.flushInterceptado = true;
}

function instrumentacionReiniciarContadores() {
  instrumentacionActivarFlush_();

  INSTRUMENTACION_ESTADO_.lecturasHoja = 0;
  INSTRUMENTACION_ESTADO_.flushes = 0;
}

function instrumentacionObtenerContadores() {
  instrumentacionActivarFlush_();

  return {
    lecturasHoja: INSTRUMENTACION_ESTADO_.lecturasHoja,
    flushes: INSTRUMENTACION_ESTADO_.flushes
  };
}

/**
 * Mide duración, lecturas de hoja y flushes producidos por `funcion`.
 * No altera lo que `funcion` devuelve ni cómo se ejecuta.
 */
function instrumentacionMedirFuncion_(etiqueta, funcion) {
  instrumentacionActivarFlush_();

  var contadoresAntes =
    instrumentacionObtenerContadores();

  var inicio = Date.now();

  var resultado = funcion();

  var duracionMs = Date.now() - inicio;

  var contadoresDespues =
    instrumentacionObtenerContadores();

  var medicion = {
    etiqueta: etiqueta,
    duracionMs: duracionMs,
    lecturasHoja:
      contadoresDespues.lecturasHoja -
      contadoresAntes.lecturasHoja,
    flushes:
      contadoresDespues.flushes -
      contadoresAntes.flushes
  };

  console.log(
    'INSTR etiqueta=' + medicion.etiqueta +
    ' duracion_ms=' + medicion.duracionMs +
    ' lecturas_hoja=' + medicion.lecturasHoja +
    ' flushes=' + medicion.flushes
  );

  return {
    resultado: resultado,
    medicion: medicion
  };
}
