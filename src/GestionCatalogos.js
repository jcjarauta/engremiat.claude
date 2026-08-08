/**
 * Hallazgo #21 (auditoría piloto end-to-end, 2026-08-01): no existía
 * forma de gestionar catálogos desde la UI -- el menú "Catálogos" solo
 * abría la hoja cruda 90_CONFIGURACION sin ninguna protección, y "Otro"
 * en cualquier desplegable era una etiqueta muerta, no una alta rápida.
 *
 * agregarValorCatalogoSiNuevo(nombreCatalogo, textoNuevo) normaliza el
 * texto, comprueba si ya existe algo muy parecido (case/acentos
 * insensible) para no crear casi-duplicados, y si es genuinamente
 * nuevo lo añade reutilizando ampliarCatalogoL2_ (insertando antes de
 * "Otro"/"Otra" si existe, para mantenerlo al final). Se invoca desde
 * FormularioGenerico.html (activarAltaRapidaCatalogo_) cuando el
 * usuario elige "Otro" en cualquier campo de catalogo y escribe un
 * valor nuevo.
 */

function normalizarTextoCatalogoNuevo_(texto) {
  var limpio = String(texto || '').trim().replace(/\s+/g, ' ');

  if (limpio.length < 2 || limpio.length > 60) {
    throw new Error('El valor debe tener entre 2 y 60 caracteres.');
  }

  if (!/^[\p{L}0-9 \-]+$/u.test(limpio)) {
    throw new Error('Solo se permiten letras, números, espacios y guiones.');
  }

  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

function generarClaveCatalogo_(texto) {
  return quitarAcentos_(texto)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizarComparacionCatalogo_(texto) {
  return quitarAcentos_(texto).toUpperCase().replace(/\s+/g, ' ').trim();
}

function buscarValorCatalogoExistente_(nombreCatalogo, textoNormalizado) {
  var valores = obtenerCatalogo(nombreCatalogo);
  var comparable = normalizarComparacionCatalogo_(textoNormalizado);

  return valores.filter(function (v) {
    return normalizarComparacionCatalogo_(v) === comparable;
  })[0] || null;
}

function agregarValorCatalogoSiNuevo(nombreCatalogo, textoNuevo) {
  var categoria = String(nombreCatalogo || '').replace(/^CFG_/, '');
  var textoNormalizado = normalizarTextoCatalogoNuevo_(textoNuevo);

  var existente = buscarValorCatalogoExistente_(nombreCatalogo, textoNormalizado);

  if (existente) {
    return { valor: existente, creado: false };
  }

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActive();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error('No existe la hoja 90_CONFIGURACION.');
    }

    var datosConfig = hojaConfig.getDataRange().getValues();
    var clave = generarClaveCatalogo_(textoNormalizado);

    var claveYaUsada = datosConfig.some(function (fila) {
      return String(fila[1]).trim() === categoria && String(fila[2]).trim() === clave;
    });

    if (claveYaUsada) {
      clave = clave + '_' + new Date().getTime();
    }

    var filasCategoria = datosConfig.filter(function (fila) {
      return String(fila[1]).trim() === categoria;
    });

    var claveInsertarAntesDe = null;

    if (filasCategoria.length > 0) {
      var ultimaClave = String(filasCategoria[filasCategoria.length - 1][2]).trim();

      if (ultimaClave === 'OTRO' || ultimaClave === 'OTRA') {
        claveInsertarAntesDe = ultimaClave;
      }
    }

    ampliarCatalogoL2_(ss, hojaConfig, categoria, claveInsertarAntesDe, [
      [clave, textoNormalizado]
    ]);
  } finally {
    bloqueo.releaseLock();
  }

  return { valor: textoNormalizado, creado: true };
}

/**
 * Menú "Catálogos" (Administración): antes abría directamente la hoja
 * cruda 90_CONFIGURACION sin ninguna proteccion. Ahora ofrece un
 * selector con buscador (reutiliza abrirSelectorConAccion_) sobre las
 * categorias de catalogo existentes, y al elegir una, abre un dialogo
 * de solo consulta con sus valores y un campo para anadir uno nuevo
 * con la misma validacion que "Otro".
 */
function obtenerCategoriasCatalogo() {
  var hoja = SpreadsheetApp.getActive().getSheetByName('90_CONFIGURACION');
  var datos = hoja.getDataRange().getValues();
  var categorias = {};

  for (var i = 1; i < datos.length; i++) {
    var categoria = String(datos[i][1] || '').trim();
    if (categoria) categorias[categoria] = true;
  }

  return Object.keys(categorias).sort().map(function (categoria) {
    return { id: categoria, etiqueta: categoria };
  });
}

function obtenerOpcionesCategoriaParaSelector(entidad) {
  return obtenerCategoriasCatalogo();
}

function seleccionarYAbrirCatalogo(entidad, categoria) {
  abrirGestionCatalogo_(categoria);
  return true;
}

function abrirGestionCatalogo_(categoria) {
  var template = HtmlService.createTemplateFromFile('GestionCatalogo');
  template.categoria = categoria;
  var html = template.evaluate().setWidth(380).setHeight(420);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Catálogo: ' + categoria);
}

function obtenerValoresCatalogoParaGestion(categoria) {
  return obtenerCatalogo('CFG_' + categoria);
}

function abrirCatalogosAdmin() {
  abrirSelectorConAccion_(
    'CATALOGO',
    'Catálogos',
    'seleccionarYAbrirCatalogo',
    'obtenerOpcionesCategoriaParaSelector',
    true
  );
}
