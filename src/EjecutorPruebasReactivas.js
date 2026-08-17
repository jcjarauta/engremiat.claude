/**
 * Runner de las 346 pruebas reactivas registradas en
 * RegistroPruebasReactivas.js (generado desde los ficheros Tests_ de
 * src/) -- ver "asesor técnico, valora el estado actual": hasta ahora
 * cada función probar-o-prueba solo se podía lanzar a mano, una por una,
 * desde el editor de Apps Script. Sin esto,
 * `Tests_IntegrityService_cobertura_directa_10_reglas.js` estuvo meses
 * dado por "cerrado" en dos informes distintos siendo en realidad un
 * stub vacío -- nadie lo notó porque no había forma barata de ejecutar
 * todo de golpe y ver qué falló.
 *
 * Por lotes con reanudación (ver primera ejecución real: 11/346 antes de
 * "Se ha superado el tiempo máximo de ejecución" -- varias pruebas
 * individuales tardan 60-100s porque montan un escenario transaccional
 * completo contra la hoja real, así que 346 nunca caben en una sola
 * ejecución de Apps Script). Cada tanda respeta un presupuesto de tiempo
 * por debajo del límite duro y se para limpiamente antes de llegar a él;
 * la siguiente vez que se abre el menú, continúa donde lo dejó en vez de
 * volver a empezar -- lee qué funciones ya tienen fila en
 * RESULTADOS_PRUEBAS_REACTIVAS y las salta.
 *
 * Escritura incremental fila a fila (no solo al final): si la tanda se
 * corta por el presupuesto de tiempo o por el propio límite de Apps
 * Script, las filas ya escritas no se pierden.
 */

var HOJA_RESULTADOS_PRUEBAS_REACTIVAS_ = 'RESULTADOS_PRUEBAS_REACTIVAS';

/*
 * 4.5 min: margen bajo el tope de ejecución de Apps Script (~6 min para
 * la mayoría de cuentas). No hay forma de leer el límite real en
 * tiempo de ejecución, así que se deja un margen generoso en vez de
 * apurar -- mejor una tanda algo corta que un corte a mitad de prueba.
 */
var PRESUPUESTO_TIEMPO_LOTE_PRUEBAS_REACTIVAS_MS_ = 4.5 * 60 * 1000;

function obtenerEstadoPruebasReactivas_() {
  var total = REGISTRO_PRUEBAS_REACTIVAS_.length;
  var completadas = leerFuncionesYaEjecutadas_(obtenerHojaResultadosSiExiste_()).size;
  return {
    total: total,
    completadas: completadas,
    pendientes: total - completadas
  };
}

/**
 * this[nombreFuncion]: las declaraciones `function foo(){}` a nivel de
 * fichero en Apps Script V8 cuelgan del objeto global del proyecto
 * (mismo ámbito compartido entre todos los ficheros .js), así que son
 * accesibles por nombre exactamente igual que Repository.js llama a
 * funciones de otros ficheros sin espacio de nombres -- aquí solo
 * necesitamos hacerlo dinámico porque el nombre viene del registro, no
 * escrito a mano. Al ser esta función invocada como llamada normal (no
 * como método), `this` ya es el objeto global -- no hace falta pasar un
 * thisArg explícito como en un forEach.
 */
function ejecutarLotePruebasReactivas_(reanudar) {
  var hoja = prepararHojaResultados_(reanudar);
  var yaEjecutadas = reanudar ? leerFuncionesYaEjecutadas_(hoja) : new Set();

  var pendientes = REGISTRO_PRUEBAS_REACTIVAS_.filter(function (entrada) {
    return !yaEjecutadas.has(entrada.funcion);
  });

  var inicioLote = new Date().getTime();
  var resultados = [];
  var ok = 0;
  var fallo = 0;
  var agotadoPresupuesto = false;

  for (var i = 0; i < pendientes.length; i++) {
    if (new Date().getTime() - inicioLote >= PRESUPUESTO_TIEMPO_LOTE_PRUEBAS_REACTIVAS_MS_) {
      agotadoPresupuesto = true;
      break;
    }

    var entrada = pendientes[i];
    var inicio = new Date().getTime();
    var fila = { archivo: entrada.archivo, funcion: entrada.funcion, resultado: '', mensaje: '', ms: 0 };

    try {
      var fn = this[entrada.funcion];
      if (typeof fn !== 'function') {
        throw new Error('Función no encontrada en el ámbito global: ' + entrada.funcion);
      }
      fn();
      fila.resultado = 'OK';
      ok++;
    } catch (e) {
      fila.resultado = 'FALLO';
      fila.mensaje = (e && e.message) ? e.message : String(e);
      fallo++;
    }

    fila.ms = new Date().getTime() - inicio;
    resultados.push(fila);
    Logger.log((fila.resultado === 'OK' ? 'OK ' : 'FALLO ') + entrada.funcion + ' (' + fila.ms + 'ms)' + (fila.mensaje ? ' -- ' + fila.mensaje : ''));
    escribirFilaResultadoPruebaReactiva_(hoja, fila);
  }

  var total = REGISTRO_PRUEBAS_REACTIVAS_.length;
  var procesadasEnEstaTanda = resultados.length;
  var pendientesRestantes = total - (yaEjecutadas.size + procesadasEnEstaTanda);

  return {
    total: total,
    procesadasEnEstaTanda: procesadasEnEstaTanda,
    ok: ok,
    fallo: fallo,
    pendientesRestantes: pendientesRestantes,
    agotadoPresupuesto: agotadoPresupuesto,
    resultados: resultados
  };
}

function obtenerHojaResultadosSiExiste_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_RESULTADOS_PRUEBAS_REACTIVAS_);
}

function prepararHojaResultados_(reanudar) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_RESULTADOS_PRUEBAS_REACTIVAS_);
  if (!hoja) hoja = ss.insertSheet(HOJA_RESULTADOS_PRUEBAS_REACTIVAS_);
  if (!reanudar || hoja.getLastRow() === 0) {
    hoja.clearContents();
    hoja.appendRow(['TIMESTAMP', 'ARCHIVO', 'FUNCION', 'RESULTADO', 'MS', 'MENSAJE']);
  }
  return hoja;
}

function leerFuncionesYaEjecutadas_(hoja) {
  var vistos = new Set();
  if (!hoja) return vistos;
  var ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return vistos;
  var valores = hoja.getRange(2, 3, ultimaFila - 1, 1).getValues();
  valores.forEach(function (fila) {
    if (fila[0]) vistos.add(String(fila[0]));
  });
  return vistos;
}

function escribirFilaResultadoPruebaReactiva_(hoja, fila) {
  hoja.appendRow([new Date(), fila.archivo, fila.funcion, fila.resultado, fila.ms, fila.mensaje]);
}
