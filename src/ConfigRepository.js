/**
 * ConfigRepository.gs -- Fase 9: Configuracion y catalogos.
 * Consolida el acceso de solo lectura a 90_CONFIGURACION en dos vias
 * complementarias, sin duplicar logica entre ellas:
 *
 *   - obtenerCatalogo(nombreRango): acceso "fisico" via un named range
 *     CFG_* (p.ej. 'CFG_ESTADO_TAREA'). Ya se usaba desde Fase 6 en
 *     FormularioGenerico.html; se traslada aqui sin cambiar su
 *     comportamiento, como corresponde ahora que la creacion de
 *     archivos nuevos es fiable (ver nota de Fase 8).
 *
 *   - listarOpcionesActivas(categoria): acceso "logico" por el valor de
 *     la columna CATEGORIA de 90_CONFIGURACION (p.ej. 'ESTADO_TAREA'),
 *     devolviendo pares {clave, valor} en vez de solo el texto visible.
 *     Util cuando ademas de la etiqueta a mostrar (VALOR) se necesita
 *     la clave interna (CLAVE) -- por ejemplo, para comparar o
 *     almacenar por clave en vez de por texto libre.
 */

function obtenerCatalogo(nombreRango) {
  var rango = SpreadsheetApp.getActive().getRangeByName(nombreRango);
  if (!rango) {
    throw new Error('ERROR_CATALOGO: no existe el rango con nombre ' + nombreRango);
  }
  return rango.getDisplayValues()
    .flat()
    .map(function (valor) { return String(valor).trim(); })
    .filter(function (valor) { return valor !== ''; });
}

function listarOpcionesActivas(categoria) {
  var hoja = SpreadsheetApp.getActive().getSheetByName('90_CONFIGURACION');
  if (!hoja) {
    throw new Error('ERROR_CATALOGO: no existe la hoja 90_CONFIGURACION.');
  }

  var valores = hoja.getDataRange().getDisplayValues();
  var encabezados = valores[0];
  var idxCategoria = encabezados.indexOf('CATEGORIA');
  var idxClave = encabezados.indexOf('CLAVE');
  var idxValor = encabezados.indexOf('VALOR');

  if (idxCategoria === -1 || idxClave === -1 || idxValor === -1) {
    throw new Error('ERROR_CATALOGO: 90_CONFIGURACION no tiene las columnas CATEGORIA/CLAVE/VALOR esperadas.');
  }

  return valores.slice(1)
    .filter(function (fila) { return fila[idxCategoria] === categoria; })
    .map(function (fila) { return { clave: fila[idxClave], valor: fila[idxValor] }; });
}

function listarCategoriasDisponibles() {
  var hoja = SpreadsheetApp.getActive().getSheetByName('90_CONFIGURACION');
  if (!hoja) {
    throw new Error('ERROR_CATALOGO: no existe la hoja 90_CONFIGURACION.');
  }

  var valores = hoja.getDataRange().getDisplayValues();
  var encabezados = valores[0];
  var idxCategoria = encabezados.indexOf('CATEGORIA');
  if (idxCategoria === -1) {
    throw new Error('ERROR_CATALOGO: 90_CONFIGURACION no tiene la columna CATEGORIA esperada.');
  }

  var vistas = {};
  var categorias = [];
  valores.slice(1).forEach(function (fila) {
    var categoria = fila[idxCategoria];
    if (categoria && !vistas[categoria]) {
      vistas[categoria] = true;
      categorias.push(categoria);
    }
  });
  return categorias;
}
