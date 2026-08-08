/**
 * Instalador limpio del Core: crea las 37 hojas de entidad + 90_CONFIGURACION
 * (con su catálogo semilla) + 91_HISTORIAL en un Sheet nuevo, o completa las
 * que falten en uno ya iniciado a medias. Idempotente -- no toca hojas que ya
 * existen, no duplica el catálogo si 90_CONFIGURACION ya tenía datos.
 *
 * Nace del hallazgo de que montar-cliente.mjs + la librería Core dejaban un
 * cliente Nivel 1 con menú funcional pero sin hojas de datos: los
 * Instalador*.js existentes son auxiliares (package C, fuera de la
 * librería) y se fueron acumulando como parches puntuales, nunca como un
 * arranque único y repetible. Este archivo va en package A (CORE) para que
 * cualquier cliente, interno o externo, pueda arrancar su Sheet desde cero.
 *
 * Datos de referencia (cabeceras + catálogo semilla) en
 * EstructuraInicialDatos.js -- transcripción literal de la hoja de
 * desarrollo real, no inventada aquí.
 */
/**
 * true si la hoja corresponde a un módulo instalado. Sin lista (null/
 * undefined, cliente antiguo sin regenerar Codigo.js, o el propio Sheet
 * maestro) instala todo, por compatibilidad -- mismo criterio que
 * moduloInstalado_ en FormularioMotorUI.js. 90_CONFIGURACION/91_HISTORIAL
 * no son hojas de entidad (no están en MODULO_POR_HOJA_MVP) y se instalan
 * siempre.
 */
function hojaInstalable_(nombreHoja, modulosInstalados) {
  if (!modulosInstalados) return true;
  var modulo = MODULO_POR_HOJA_MVP[nombreHoja];
  if (!modulo) return true;
  return modulosInstalados.indexOf(modulo) !== -1;
}

/**
 * modulosInstalados: array de módulos instalados en el cliente, pasado
 * explícitamente por el envoltorio abrirInstalarEstructuraInicial()
 * generado en el Codigo.js de cada cliente (mismo patrón que onOpen() en
 * FormularioMotorUI.js -- una librería no puede leer MODULOS_INSTALADOS_CLIENTE
 * directamente, corre en su propio ámbito global).
 *
 * ssDestino (opcional): Spreadsheet sobre el que instalar, en vez de
 * SpreadsheetApp.getActiveSpreadsheet(). Lo usa subirContenidoScript_
 * (AprovisionamientoService.js, Fase 3) para instalar la estructura en el
 * Sheet recién creado de un cliente nuevo en la misma ejecución -- ambas
 * funciones viven en la misma librería CORE, así que no hace falta ninguna
 * llamada remota (Execution API) ni scope adicional.
 */
function instalarEstructuraInicial(modulosInstalados, ssDestino) {
  var packageName = 'ESTRUCTURA_INICIAL';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var bloqueo = LockService.getScriptLock();
  var resultado = { hojasCreadas: [], hojasExistentes: [], hojasOmitidasPorModulo: [], catalogoSembrado: false, rangosNombradosAsegurados: 0 };

  try {
    bloqueo.waitLock(10000);

    var ss = ssDestino || SpreadsheetApp.getActiveSpreadsheet();

    ORDEN_HOJAS_ESTRUCTURA_INICIAL.forEach(function (nombreHoja) {
      if (!hojaInstalable_(nombreHoja, modulosInstalados)) {
        resultado.hojasOmitidasPorModulo.push(nombreHoja);
        return;
      }

      var cabeceras = CABECERAS_HOJA_MVP[nombreHoja];
      var hoja = ss.getSheetByName(nombreHoja);
      var creadaAhora = false;

      if (!hoja) {
        hoja = ss.insertSheet(nombreHoja);
        hoja.getRange(1, 1, 1, cabeceras.length).setValues([cabeceras]);
        hoja.setFrozenRows(1);
        creadaAhora = true;
        resultado.hojasCreadas.push(nombreHoja);
        console.log('OK hoja_creada=' + nombreHoja + ' columnas=' + cabeceras.length);
      } else {
        resultado.hojasExistentes.push(nombreHoja);
        console.log('OK hoja_ya_existente=' + nombreHoja);
      }

      if (nombreHoja === '90_CONFIGURACION') {
        if (creadaAhora) {
          sembrarCatalogoInicial_(hoja, modulosInstalados);
          resultado.catalogoSembrado = true;
        }
        resultado.rangosNombradosAsegurados = asegurarRangosNombradosCatalogo_(ss, hoja);
      }
    });

    // Limpia la hoja "Hoja 1"/"Sheet1" que SpreadsheetApp.create() deja por
    // defecto en todo Spreadsheet nuevo -- solo si sigue vacia y solo en una
    // instalacion real (no en una re-ejecucion idempotente sobre un Sheet ya
    // instalado), para no borrar nunca una hoja que el cliente haya vuelto a
    // usar con ese mismo nombre.
    if (resultado.hojasCreadas.length > 0) {
      var hojaPorDefecto = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
      if (hojaPorDefecto && ss.getSheets().length > 1 &&
          hojaPorDefecto.getLastRow() === 0 && hojaPorDefecto.getLastColumn() === 0) {
        ss.deleteSheet(hojaPorDefecto);
      }
    }
  } finally {
    bloqueo.releaseLock();
  }

  console.log(
    'ENGREMIAT_PACKAGE_END package=' + packageName +
    ' status=OK hojas_creadas=' + resultado.hojasCreadas.length +
    ' hojas_existentes=' + resultado.hojasExistentes.length +
    ' hojas_omitidas_por_modulo=' + resultado.hojasOmitidasPorModulo.length +
    ' catalogo_sembrado=' + resultado.catalogoSembrado
  );

  return resultado;
}

/**
 * Escribe CATALOGO_SEMILLA_MVP en una hoja 90_CONFIGURACION recién creada.
 * Solo se llama cuando la hoja no existía -- no reconcilia contra un
 * catálogo ya poblado (ese es el trabajo de crearCatalogoNuevoL3_ en los
 * Instaladores auxiliares, para altas incrementales sobre datos reales).
 * Los rangos con nombre (CFG_<CATEGORIA>) se calculan aparte, en
 * asegurarRangosNombradosCatalogo_, para que también se reparen en un
 * 90_CONFIGURACION que ya tenía filas pero no rangos.
 */
/**
 * true si la categoría corresponde a un módulo instalado. Mismo criterio
 * que hojaInstalable_: sin lista instala todo.
 */
function categoriaInstalable_(categoria, modulosInstalados) {
  if (!modulosInstalados) return true;
  var modulo = MODULO_POR_CATEGORIA_CATALOGO[categoria];
  if (!modulo) return true;
  return modulosInstalados.indexOf(modulo) !== -1;
}

function sembrarCatalogoInicial_(hojaConfig, modulosInstalados) {
  var ahora = new Date();
  var usuario = Session.getEffectiveUser().getEmail() || 'USUARIO_NO_IDENTIFICADO';

  var entradas = CATALOGO_SEMILLA_MVP.filter(function (entrada) {
    return categoriaInstalable_(entrada.categoria, modulosInstalados);
  });

  var filas = entradas.map(function (entrada, indice) {
    return [
      'CFG-' + String(indice + 1).padStart(4, '0'),
      entrada.categoria,
      entrada.clave,
      entrada.valor,
      entrada.orden === null ? '' : entrada.orden,
      entrada.descripcion === null ? '' : entrada.descripcion,
      'SÍ',
      ahora,
      usuario,
      ahora,
      usuario
    ];
  });

  if (filas.length === 0) return;

  hojaConfig.getRange(2, 1, filas.length, filas[0].length).setValues(filas);

  console.log('OK catalogo_sembrado filas=' + filas.length);
}

/**
 * Crea/actualiza el rango con nombre CFG_<CATEGORIA> (columna VALOR) para
 * cada categoría presente en 90_CONFIGURACION, leyendo la hoja tal cual
 * está -- no solo la semilla en memoria. Así repara también un
 * 90_CONFIGURACION que ya tenía datos (de una ejecución previa de este
 * instalador antes de que existiera este paso) sin tocar filas.
 * Mismo criterio de rango (min/max por categoría) que crearCatalogoNuevoL3_
 * en los Instaladores auxiliares.
 */
function asegurarRangosNombradosCatalogo_(ss, hojaConfig) {
  var ultimaFila = hojaConfig.getLastRow();
  if (ultimaFila < 2) return 0;

  var categorias = hojaConfig.getRange(2, 2, ultimaFila - 1, 1).getDisplayValues();
  var rangoPorCategoria = {};

  categorias.forEach(function (fila, indice) {
    var categoria = String(fila[0] || '').trim();
    if (!categoria) return;

    var filaHoja = indice + 2;

    if (!rangoPorCategoria[categoria]) {
      rangoPorCategoria[categoria] = { min: filaHoja, max: filaHoja };
    } else {
      rangoPorCategoria[categoria].max = filaHoja;
    }
  });

  Object.keys(rangoPorCategoria).forEach(function (categoria) {
    var nombreRango = 'CFG_' + categoria;
    var rango = rangoPorCategoria[categoria];

    ss.setNamedRange(
      nombreRango,
      hojaConfig.getRange(rango.min, 4, rango.max - rango.min + 1, 1)
    );
  });

  console.log('OK rangos_nombrados_asegurados=' + Object.keys(rangoPorCategoria).length);

  return Object.keys(rangoPorCategoria).length;
}

/**
 * Entrada de menú. Pide confirmación explícita porque crea hojas reales en
 * el Sheet activo -- mismo criterio que el resto del proyecto para acciones
 * con efecto persistente.
 */
/**
 * modulosInstalados: array de módulos instalados en el cliente que llama,
 * pasado explícitamente por el envoltorio generado en el Codigo.js de cada
 * cliente (ver renderWrapperStubs/renderizarEnvoltorios_) -- mismo patrón
 * especial que onOpen().
 */
function abrirInstalarEstructuraInicial(modulosInstalados) {
  var ui = SpreadsheetApp.getUi();

  var resp = ui.alert(
    'Instalar estructura inicial',
    'Esto crea las hojas de datos que falten (de los módulos instalados en este cliente) + 90_CONFIGURACION + ' +
    '91_HISTORIAL en este Sheet, y asegura los rangos con nombre del catálogo (CFG_*). Las hojas que ya existen ' +
    'no se tocan. ¿Continuar?',
    ui.ButtonSet.YES_NO
  );

  if (resp !== ui.Button.YES) return;

  try {
    var resultado = instalarEstructuraInicial(modulosInstalados);

    var mensaje = resultado.hojasCreadas.length > 0
      ? 'Hojas creadas: ' + resultado.hojasCreadas.join(', ') +
        (resultado.catalogoSembrado ? '\n\nCatálogo inicial sembrado en 90_CONFIGURACION.' : '')
      : 'No había hojas que crear: la estructura ya estaba completa.';

    if (resultado.hojasOmitidasPorModulo.length > 0) {
      mensaje += '\n\nOmitidas (módulo no instalado): ' + resultado.hojasOmitidasPorModulo.join(', ');
    }

    mensaje += '\n\nRangos con nombre asegurados: ' + resultado.rangosNombradosAsegurados;

    ui.alert('Estructura inicial instalada', mensaje, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('No se pudo instalar la estructura', e.message, ui.ButtonSet.OK);
  }
}
