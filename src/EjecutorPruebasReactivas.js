/**
 * Runner mínimo para las 346 pruebas reactivas registradas en
 * RegistroPruebasReactivas.js (generado desde los ficheros Tests_ de src/)
 * -- ver "asesor técnico, valora el estado actual": hasta ahora cada
 * función probar-o-prueba solo se podía lanzar a mano, una por una, desde
 * el editor de Apps Script. Sin esto, `Tests_IntegrityService_cobertura_directa_10_reglas.js`
 * estuvo meses dado por "cerrado" en dos informes distintos siendo en
 * realidad un stub vacío -- nadie lo notó porque no había forma barata
 * de ejecutar todo de golpe y ver qué falló.
 *
 * Escritura incremental fila a fila en RESULTADOS_PRUEBAS_REACTIVAS (no
 * solo al final): las pruebas mutan datos reales del Sheet y una tanda de
 * 346 puede acercarse al límite de ejecución de Apps Script -- si el
 * script se corta a mitad, las filas ya escritas siguen siendo un
 * resultado útil en vez de perderse con el resto de la ejecución.
 */

var HOJA_RESULTADOS_PRUEBAS_REACTIVAS_ = 'RESULTADOS_PRUEBAS_REACTIVAS';

/**
 * this[nombreFuncion]: las declaraciones `function foo(){}` a nivel de
 * fichero en Apps Script V8 cuelgan del objeto global del proyecto
 * (mismo ámbito compartido entre todos los ficheros .js), así que son
 * accesibles por nombre exactamente igual que Repository.js llama a
 * funciones de otros ficheros sin espacio de nombres -- aquí solo
 * necesitamos hacerlo dinámico porque el nombre viene del registro, no
 * escrito a mano.
 */
function ejecutarTodasLasPruebasReactivas() {
  var hoja = prepararHojaResultadosPruebasReactivas_();
  var resultados = [];
  var ok = 0;
  var fallo = 0;

  REGISTRO_PRUEBAS_REACTIVAS_.forEach(function (entrada) {
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
  }, this);

  return { total: resultados.length, ok: ok, fallo: fallo, resultados: resultados };
}

function prepararHojaResultadosPruebasReactivas_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA_RESULTADOS_PRUEBAS_REACTIVAS_);
  if (!hoja) hoja = ss.insertSheet(HOJA_RESULTADOS_PRUEBAS_REACTIVAS_);
  hoja.clearContents();
  hoja.appendRow(['TIMESTAMP', 'ARCHIVO', 'FUNCION', 'RESULTADO', 'MS', 'MENSAJE']);
  return hoja;
}

function escribirFilaResultadoPruebaReactiva_(hoja, fila) {
  hoja.appendRow([new Date(), fila.archivo, fila.funcion, fila.resultado, fila.ms, fila.mensaje]);
}
