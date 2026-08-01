/**
 * Fase L4 (ampliación tras F-015): sugerencia de CODIGO para PRODUCTO,
 * MATERIAL y PROVEEDOR a partir de siglas de campos ya elegidos, para
 * evitar tener que inventar y teclear el código a mano y normalizarlo
 * entre usuarios. Combinación confirmada:
 *
 *   PRODUCTO:  {3 letras de ORIGEN}-{4 letras de NOMBRE}-{inicial de PRIORIDAD}-{correlativo}
 *   MATERIAL:  {3 letras de CATEGORIA}-{4 letras de NOMBRE}-{correlativo}
 *   PROVEEDOR: {4 letras de NOMBRE}-{correlativo}
 *
 * Igual que la sugerencia de ORDEN_SECUENCIA de L4: se calcula bajo
 * demanda (obtenerSugerenciaCodigo, llamada desde FormularioGenerico.html)
 * y nunca se escribe sola -- el campo CODIGO sigue siendo de texto libre
 * y editable, solo se precarga si el usuario aun no ha escrito nada.
 *
 * El correlativo es global por entidad (no por combinación de siglas):
 * se toma el mayor sufijo numérico final ya usado en cualquier CODIGO
 * existente de esa entidad y se suma 1, igual que obtenerSiguienteId con
 * el ID pero sin exigir un prefijo fijo de 3 letras.
 */

var PALABRAS_GENERICAS_CODIGO_ = {
  PRODUCTO: ['PRODUCTO'],
  MATERIAL: ['MATERIAL'],
  PROVEEDOR: ['PROVEEDOR'],
  RECURSO: ['RECURSO']
};

var PATRON_DIACRITICOS_ = new RegExp('[̀-ͯ]', 'g');

function quitarAcentos_(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(PATRON_DIACRITICOS_, '');
}

function soloLetrasMayusculas_(texto) {
  return quitarAcentos_(texto)
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

function siglasDeTexto_(texto, longitud) {
  return soloLetrasMayusculas_(texto).substring(0, longitud);
}

/**
 * Siglas de un valor de catálogo (ORIGEN, CATEGORIA, PRIORIDAD): toma la
 * última palabra en vez de las primeras letras del texto completo, para
 * no colisionar entre valores que comparten la primera palabra (ej.
 * "Pedido interno" / "Pedido externo" darían ambos "PED" si se usaran
 * las 3 primeras letras del texto entero; con la última palabra dan
 * "INT" / "EXT"). En catálogos de una sola palabra el resultado es el
 * mismo que con siglasDeTexto_.
 */
function siglasDeCatalogo_(texto, longitud) {
  var palabras = String(texto || '')
    .split(/[\s_\-]+/)
    .filter(function (p) { return p !== ''; });

  var ultima = palabras.length ? palabras[palabras.length - 1] : '';

  return siglasDeTexto_(ultima, longitud);
}

/**
 * Primera palabra "significativa" del nombre: ignora palabras genéricas
 * (ej. "PRODUCTO" dentro de "PRODUCTO_PRUEBA") y toma sus primeras
 * `longitud` letras. Si todas las palabras son genéricas o no hay
 * ninguna, usa la primera palabra tal cual.
 */
function siglasDeNombre_(nombre, palabrasGenericas, longitud) {
  var palabras = String(nombre || '')
    .split(/[\s_\-]+/)
    .filter(function (p) { return p !== ''; });

  if (palabras.length === 0) return '';

  var significativa = palabras.filter(function (p) {
    return palabrasGenericas.indexOf(soloLetrasMayusculas_(p)) === -1;
  })[0];

  return siglasDeTexto_(significativa || palabras[0], longitud);
}

/**
 * Mayor correlativo numérico ya usado al final de cualquier CODIGO
 * existente de la entidad (formato "...-NNN"), +1. Global por entidad,
 * no por combinación de siglas concreta.
 */
function obtenerCorrelativoSiguienteCodigo_(claveEntidad) {
  var entidad = ENTIDADES_MVP[claveEntidad];

  if (!entidad) {
    throw new Error('Entidad no configurada: ' + claveEntidad);
  }

  var hoja = SpreadsheetApp.getActive().getSheetByName(entidad.hoja);

  if (!hoja) {
    throw new Error('No existe la hoja: ' + entidad.hoja);
  }

  var ultimaFila = hoja.getLastRow();
  var ultimaColumna = hoja.getLastColumn();

  if (ultimaFila < 2) return 1;

  var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getValues()[0];
  var indiceCodigo = cabeceras.indexOf('CODIGO');

  if (indiceCodigo === -1) {
    throw new Error('La hoja ' + entidad.hoja + ' no tiene columna CODIGO.');
  }

  var valores = hoja
    .getRange(2, indiceCodigo + 1, ultimaFila - 1, 1)
    .getDisplayValues()
    .flat()
    .map(function (valor) { return String(valor).trim(); })
    .filter(function (valor) { return valor !== ''; });

  var maximo = 0;

  valores.forEach(function (codigo) {
    var coincidencia = codigo.match(/-(\d+)$/);
    if (coincidencia) {
      var numero = Number(coincidencia[1]);
      if (numero > maximo) maximo = numero;
    }
  });

  return maximo + 1;
}

function formatearCorrelativoCodigo_(numero) {
  return String(numero).padStart(3, '0');
}

/**
 * Calcula el CODIGO sugerido para una entidad, o null si aún no hay
 * datos suficientes en `contexto` (valores actuales de los campos
 * relevantes tal como los tiene el formulario en ese momento).
 */
function obtenerSugerenciaCodigo(entidadClave, contexto) {
  var clave = String(entidadClave || '').trim().toUpperCase();
  contexto = contexto || {};

  var segmentos;

  if (clave === 'PRODUCTO') {
    var origen = String(contexto.ORIGEN || '').trim();
    var nombre = String(contexto.NOMBRE || '').trim();
    var prioridad = String(contexto.PRIORIDAD || '').trim();

    if (!origen || !nombre || !prioridad) return null;

    segmentos = [
      siglasDeCatalogo_(origen, 3),
      siglasDeNombre_(nombre, PALABRAS_GENERICAS_CODIGO_.PRODUCTO, 4),
      siglasDeCatalogo_(prioridad, 1)
    ];
  } else if (clave === 'MATERIAL') {
    var categoria = String(contexto.CATEGORIA || '').trim();
    var nombreMaterial = String(contexto.NOMBRE || '').trim();

    if (!categoria || !nombreMaterial) return null;

    segmentos = [
      siglasDeCatalogo_(categoria, 3),
      siglasDeNombre_(nombreMaterial, PALABRAS_GENERICAS_CODIGO_.MATERIAL, 4)
    ];
  } else if (clave === 'PROVEEDOR') {
    var nombreProveedor = String(contexto.NOMBRE || '').trim();

    if (!nombreProveedor) return null;

    segmentos = [
      siglasDeNombre_(nombreProveedor, PALABRAS_GENERICAS_CODIGO_.PROVEEDOR, 4)
    ];
  } else if (clave === 'RECURSO') {
    var claseRecurso = String(contexto.CLASE_RECURSO || '').trim();
    var nombreRecurso = String(contexto.NOMBRE || '').trim();

    if (!claseRecurso || !nombreRecurso) return null;

    segmentos = [
      siglasDeCatalogo_(claseRecurso, 3),
      siglasDeNombre_(nombreRecurso, PALABRAS_GENERICAS_CODIGO_.RECURSO, 4)
    ];
  } else {
    throw new Error('No hay sugerencia de código configurada para ' + entidadClave);
  }

  if (segmentos.some(function (s) { return !s; })) return null;

  var correlativo = obtenerCorrelativoSiguienteCodigo_(clave);
  segmentos.push(formatearCorrelativoCodigo_(correlativo));

  return { codigoSugerido: segmentos.join('-') };
}
