/**
 * Fase N12 (ver conversación -- "los informes son genéricos... revisa
 * cada informe y propón una mejora"). Antes de esto, exportarInformePDF
 * volcaba TODO informe (salvo Justificación económica) con
 * generarHtmlParaImprimir_: aplana el JSON entero y lo pinta como tabla
 * campo/valor -- literalmente un dump de depuración con forma de tabla.
 * generarHtmlMemoriaEconomica_ (CosteService.js) ya demostraba que el
 * sistema podía hacerlo bien: tarjetas de resumen + tablas por sección +
 * tipografía cuidada. Este fichero generaliza esa base (estilo
 * compartido + gráficos SVG sin librerías externas, coherentes con el
 * resto del sistema) para que cada tipo de informe tenga su propia
 * plantilla en vez de compartir el volcado genérico.
 */

var ESTILO_INFORME_COMPARTIDO_ =
  'body{font-family:Arial,sans-serif;padding:30px;color:#202124;}' +
  'h1{font-size:20px;border-bottom:2px solid #1a73e8;padding-bottom:8px;margin-bottom:4px;}' +
  '.subtitulo{color:#5f6368;font-size:12px;margin-bottom:4px;}' +
  '.generado{color:#9aa0a6;font-size:10px;margin-bottom:16px;}' +
  'h2{font-size:14px;margin-top:24px;margin-bottom:8px;color:#1a73e8;}' +
  'table{border-collapse:collapse;width:100%;margin-top:8px;}' +
  'td,th{border:1px solid #dadce0;padding:6px 8px;font-size:12px;text-align:left;}' +
  'th{background:#f1f3f4;}' +
  '.resumen{display:flex;gap:16px;margin:16px 0;flex-wrap:wrap;}' +
  '.dato{background:#f5f5f5;border-radius:6px;padding:10px 16px;min-width:110px;}' +
  '.dato.alerta{background:#fdecea;}' +
  '.dato .valor{font-size:22px;font-weight:bold;display:block;}' +
  '.dato.alerta .valor{color:#b00020;}' +
  '.dato .etiqueta{font-size:11px;color:#5f6368;}' +
  '.vacio{color:#5f6368;font-size:12px;font-style:italic;}' +
  '.grafico-barra .fila{display:flex;align-items:center;gap:8px;margin:3px 0;}' +
  '.grafico-barra .etiqueta{width:150px;flex-shrink:0;color:#5f6368;text-align:right;font-size:11px;}' +
  '.grafico-barra .pista{flex:1;background:#f1f3f4;border-radius:3px;height:14px;}' +
  '.grafico-barra .relleno{background:#1a73e8;height:100%;border-radius:3px;}' +
  '.grafico-barra .num{width:30px;flex-shrink:0;font-weight:bold;font-size:11px;}' +
  '.fila-donuts{display:flex;gap:24px;flex-wrap:wrap;margin:12px 0;align-items:center;}' +
  '.donut-item{text-align:center;}' +
  '.donut-item .etiqueta{font-size:11px;color:#5f6368;margin-top:4px;}' +
  '@media print{button{display:none;}}';

/*
 * Envoltorio común: cabecera (título + subtítulo + fecha de generación),
 * estilo compartido, botón de imprimir. Cada generarHtmlXxx_ solo
 * construye su <body> propio.
 */
function construirDocumentoInformeImprimible_(titulo, subtitulo, cuerpoHtml) {
  return '<html><head><meta charset="utf-8"><title>' + escaparHtmlServer_(titulo) + '</title>' +
    '<style>' + ESTILO_INFORME_COMPARTIDO_ + '</style></head><body>' +
    '<button onclick="window.print()">Imprimir / Guardar como PDF</button>' +
    '<h1>' + escaparHtmlServer_(titulo) + '</h1>' +
    (subtitulo ? '<div class="subtitulo">' + escaparHtmlServer_(subtitulo) + '</div>' : '') +
    '<div class="generado">Generado: ' + new Date().toString() + '</div>' +
    cuerpoHtml +
    '</body></html>';
}

/* Fila de tarjetas de resumen. items: [{valor, etiqueta, alerta}]. */
function tarjetasResumenHtml_(items) {
  return '<div class="resumen">' + items.map(function (i) {
    return '<div class="dato' + (i.alerta ? ' alerta' : '') + '"><span class="valor">' +
      escaparHtmlServer_(i.valor) + '</span><span class="etiqueta">' + escaparHtmlServer_(i.etiqueta) + '</span></div>';
  }).join('') + '</div>';
}

/*
 * Barras horizontales simples (HTML/CSS, no SVG -- más robusto en el
 * render de impresión de Chrome que un <svg> con porcentajes). items:
 * [{etiqueta, valor}]. opciones.alertaSi(item) -> bool colorea en rojo.
 */
function graficoBarrasHtml_(items, opciones) {
  opciones = opciones || {};
  if (!items || items.length === 0) return '<div class="vacio">Sin datos.</div>';
  var max = opciones.max || Math.max.apply(null, items.map(function (i) { return i.valor; }).concat([1]));
  return '<div class="grafico-barra">' + items.map(function (i) {
    var pct = max > 0 ? Math.round((i.valor / max) * 100) : 0;
    var color = opciones.alertaSi && opciones.alertaSi(i) ? '#b00020' : '#1a73e8';
    return '<div class="fila"><span class="etiqueta">' + escaparHtmlServer_(i.etiqueta) + '</span>' +
      '<span class="pista"><span class="relleno" style="width:' + pct + '%;background:' + color + ';"></span></span>' +
      '<span class="num">' + escaparHtmlServer_(i.valor) + '</span></div>';
  }).join('') + '</div>';
}

/* Donut de progreso en SVG puro (sin librerías externas). */
function donutProgresoSvg_(porcentaje, etiqueta, tamano) {
  tamano = tamano || 84;
  var radio = tamano / 2 - 9;
  var circunferencia = 2 * Math.PI * radio;
  var pct = Math.max(0, Math.min(100, Math.round(porcentaje) || 0));
  var offset = circunferencia * (1 - pct / 100);
  var centro = tamano / 2;
  var color = pct >= 100 ? '#1e8e3e' : '#1a73e8';

  return '<div class="donut-item"><svg width="' + tamano + '" height="' + tamano + '" viewBox="0 0 ' + tamano + ' ' + tamano + '">' +
    '<circle cx="' + centro + '" cy="' + centro + '" r="' + radio + '" fill="none" stroke="#f1f3f4" stroke-width="9"/>' +
    '<circle cx="' + centro + '" cy="' + centro + '" r="' + radio + '" fill="none" stroke="' + color + '" stroke-width="9" ' +
    'stroke-dasharray="' + circunferencia + '" stroke-dashoffset="' + offset + '" stroke-linecap="round" ' +
    'transform="rotate(-90 ' + centro + ' ' + centro + ')"/>' +
    '<text x="' + centro + '" y="' + (centro + 5) + '" text-anchor="middle" font-size="15" font-weight="bold" fill="#202124">' + pct + '%</text>' +
    '</svg><div class="etiqueta">' + escaparHtmlServer_(etiqueta) + '</div></div>';
}

/*
 * Nivel de detalle (ver conversación -- "resumen ejecutivo" vs
 * "detalle completo"): en modo resumen, las listas largas se recortan a
 * los N primeros elementos con un aviso de cuántos quedan fuera --
 * mismos datos ordenados igual que en modo completo (ya vienen
 * ordenados por gravedad/fecha desde cada listarXxx_), no un muestreo
 * aleatorio.
 */
function limitarSiResumen_(lista, nivel, limite) {
  lista = lista || [];
  if (nivel !== 'resumen' || lista.length <= limite) return { filas: lista, ocultas: 0 };
  return { filas: lista.slice(0, limite), ocultas: lista.length - limite };
}

function avisoOcultasHtml_(ocultas) {
  return ocultas > 0 ? '<div class="vacio">... y ' + ocultas + ' más (genera el informe completo para verlas todas).</div>' : '';
}

function tablaSimpleHtml_(encabezados, filas) {
  if (!filas || filas.length === 0) return '<div class="vacio">Ninguna.</div>';
  return '<table><tr>' + encabezados.map(function (e) { return '<th>' + escaparHtmlServer_(e) + '</th>'; }).join('') + '</tr>' +
    filas.map(function (fila) {
      return '<tr>' + fila.map(function (v) { return '<td>' + escaparHtmlServer_(v) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</table>';
}
