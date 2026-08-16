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
  '.barra-apilada{display:flex;height:22px;border-radius:4px;overflow:hidden;margin:8px 0;}' +
  '.barra-apilada .segmento{height:100%;}' +
  '.leyenda-apilada{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:4px;font-size:11px;color:#5f6368;}' +
  '.leyenda-apilada .punto{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:4px;vertical-align:middle;}' +
  '.tendencia-etiqueta{font-size:10px;fill:#5f6368;}' +
  '.tendencia-valor{font-size:11px;font-weight:bold;fill:#202124;}' +
  '.enlace-edicion{color:#1a73e8;text-decoration:none;}' +
  '.enlace-edicion:hover{text-decoration:underline;}' +
  '@media print{button{display:none;}.enlace-edicion{color:inherit;text-decoration:none;}}';

/*
 * Enlace de edición desde una tabla de informe (ver conversación --
 * "ver 'Grabado láser +2 días' no lleva todavía a editar esa fila"):
 * mismo mecanismo que ya usan los "dependientes bloqueantes"
 * (FormularioGenerico.html) -- abrirFormularioEditarPorId ya es
 * público y corre bien invocado directamente vía google.script.run
 * desde cualquier HtmlOutput mostrado con showModal/ModelessDialog,
 * incluido este (construido como string, no como plantilla, pero el
 * sandbox de Apps Script inyecta google.script.run igual). Sin id no
 * hay enlace -- texto plano (agregados que no vienen de un registro
 * real, o el registro no tenía ID por lo que sea).
 */
var SCRIPT_EDICION_INFORME_ =
  '<script>function editarDesdeInforme_(entidad,id){' +
  'google.script.run.withFailureHandler(function(e){alert("No se pudo abrir: "+(e&&e.message?e.message:e));})' +
  '.abrirFormularioEditarPorId(entidad,id,null);}</script>';

// Escapado específico para un literal JS de comilla simple embebido en
// un atributo HTML -- escaparHtmlServer_ protege el HTML, no el JS
// dentro del onclick, y los ID nunca deberían llevar comilla simple,
// pero son generados por el propio sistema (XXX-0001), no texto libre
// de usuario -- esto es defensa adicional, no la única barrera.
function escaparJsComillaSimple_(s) {
  return String(s === undefined || s === null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function enlaceEdicion_(entidad, id, texto) {
  var textoSeguro = escaparHtmlServer_(texto);
  if (!id) return textoSeguro;
  return '<a class="enlace-edicion" href="#" onclick="editarDesdeInforme_(\'' + escaparJsComillaSimple_(entidad) + '\',\'' + escaparJsComillaSimple_(id) + '\');return false;">' + textoSeguro + '</a>';
}

/*
 * Clasificación de estado por palabras clave (ver conversación --
 * "gráficos... esto tendría que ser replicable"): mismo criterio que
 * claseBadgeEstado_ en PanelCampana.html, portado aquí server-side para
 * que las barras apiladas de los informes usen el mismo lenguaje de
 * color en todo el sistema. Los estados varían por entidad
 * (Completado/Terminada/Confirmada, Bloqueado/Cancelada/Rechazada...)
 * así que no hay un mapa 1:1, pero las palabras clave se repiten.
 */
function colorPorPalabraClaveEstado_(estado) {
  var texto = String(estado || '').toLowerCase();
  if (texto.indexOf('bloque') !== -1 || texto.indexOf('cancel') !== -1 || texto.indexOf('rechaz') !== -1) return '#b00020';
  if (texto.indexOf('complet') !== -1 || texto.indexOf('termin') !== -1 || texto.indexOf('confirm') !== -1 || texto.indexOf('aprob') !== -1) return '#1e8e3e';
  if (texto.indexOf('proceso') !== -1 || texto.indexOf('activ') !== -1) return '#1a73e8';
  return '#9aa0a6';
}

/*
 * Barra apilada con leyenda: una sola barra horizontal dividida en
 * segmentos proporcionales, color por colorPorPalabraClaveEstado_ salvo
 * que opciones.color(item) diga otra cosa. items: [{etiqueta, valor}].
 * Pensada para "X por estado" -- cuenta la misma historia que
 * graficoBarrasHtml_ pero de un vistazo, sin recorrer una lista de
 * barras separadas.
 */
function graficoBarrasApiladasHtml_(items, opciones) {
  opciones = opciones || {};
  items = (items || []).filter(function (i) { return i.valor > 0; });
  if (items.length === 0) return '<div class="vacio">Sin datos.</div>';
  var total = items.reduce(function (acc, i) { return acc + i.valor; }, 0);
  var color = opciones.color || function (i) { return colorPorPalabraClaveEstado_(i.etiqueta); };

  var segmentos = items.map(function (i) {
    var pct = total > 0 ? (i.valor / total) * 100 : 0;
    return '<span class="segmento" style="width:' + pct + '%;background:' + color(i) + ';" title="' + escaparHtmlServer_(i.etiqueta) + ': ' + i.valor + '"></span>';
  }).join('');

  var leyenda = items.map(function (i) {
    return '<span><span class="punto" style="background:' + color(i) + ';"></span>' + escaparHtmlServer_(i.etiqueta) + ' (' + i.valor + ')</span>';
  }).join('');

  return '<div class="barra-apilada">' + segmentos + '</div><div class="leyenda-apilada">' + leyenda + '</div>';
}

/*
 * Línea de tendencia en SVG puro: puntos en el orden dado (el llamador
 * decide el orden -- normalmente cronológico) conectados por una
 * polilínea, con eje cero de referencia si hay valores negativos.
 * puntos: [{etiqueta, valor}]. Pensada para comparar una métrica entre
 * campañas/periodos, no para series muy largas (por encima de ~8-10
 * puntos las etiquetas se solapan -- no hace falta más para el uso
 * previsto: comparar campañas de una temporada).
 */
function lineaTendenciaSvg_(puntos, opciones) {
  opciones = opciones || {};
  if (!puntos || puntos.length === 0) return '<div class="vacio">Sin datos.</div>';

  var ancho = 560, alto = 140, margenIzq = 30, margenDer = 20, margenSup = 20, margenInf = 30;
  var zonaAncho = ancho - margenIzq - margenDer, zonaAlto = alto - margenSup - margenInf;
  var valores = puntos.map(function (p) { return p.valor; });
  var max = Math.max.apply(null, valores.concat([0]));
  var min = Math.min.apply(null, valores.concat([0]));
  var rango = max - min || 1;

  function x_(i) { return puntos.length > 1 ? margenIzq + (i / (puntos.length - 1)) * zonaAncho : margenIzq + zonaAncho / 2; }
  function y_(v) { return margenSup + zonaAlto - ((v - min) / rango) * zonaAlto; }

  var yCero = y_(0);
  var lineaCero = min < 0 && max > 0
    ? '<line x1="' + margenIzq + '" y1="' + yCero + '" x2="' + (ancho - margenDer) + '" y2="' + yCero + '" stroke="#dadce0" stroke-dasharray="3,3"/>'
    : '';

  var puntosPolilinea = puntos.map(function (p, i) { return x_(i) + ',' + y_(p.valor); }).join(' ');
  var color = opciones.color || '#1a73e8';

  var marcas = puntos.map(function (p, i) {
    return '<circle cx="' + x_(i) + '" cy="' + y_(p.valor) + '" r="3.5" fill="' + color + '"/>' +
      '<text x="' + x_(i) + '" y="' + (y_(p.valor) - 8) + '" text-anchor="middle" class="tendencia-valor">' + p.valor + '</text>' +
      '<text x="' + x_(i) + '" y="' + (alto - 8) + '" text-anchor="middle" class="tendencia-etiqueta">' + escaparHtmlServer_(p.etiqueta) + '</text>';
  }).join('');

  return '<svg width="' + ancho + '" height="' + alto + '" viewBox="0 0 ' + ancho + ' ' + alto + '">' +
    lineaCero +
    '<polyline points="' + puntosPolilinea + '" fill="none" stroke="' + color + '" stroke-width="2"/>' +
    marcas +
    '</svg>';
}

/*
 * Envoltorio común: cabecera (título + subtítulo + fecha de generación),
 * estilo compartido, botón de imprimir. Cada generarHtmlXxx_ solo
 * construye su <body> propio.
 */
function construirDocumentoInformeImprimible_(titulo, subtitulo, cuerpoHtml) {
  return '<html><head><meta charset="utf-8"><title>' + escaparHtmlServer_(titulo) + '</title>' +
    '<style>' + ESTILO_INFORME_COMPARTIDO_ + '</style></head><body>' +
    SCRIPT_EDICION_INFORME_ +
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

/*
 * Detalle operativo (ver conversación -- "los informes serán la forma
 * en la que el sistema se comunica con el operador... me siguen
 * faltando los detalles operativos"): tabla de casos individuales de
 * desviacionPlanificacion.procesosDetalle/tareasDetalle
 * (DesviacionService.js) -- nombre concreto, previsto/real, desviación
 * coloreada (rojo si hay retraso, verde si se adelantó) y responsable.
 * El agregado (graficoBarrasApiladasHtml_/tablaSimpleHtml_ de
 * "por fase"/"por responsable") sigue estando para el pulso rápido;
 * esto es para poder actuar sobre un caso concreto.
 */
// tablaSimpleHtml_ escapa cada celda como texto plano -- no vale para
// filas con el enlace de edición (HTML de verdad) en la celda de
// nombre, así que estas tres tablas construyen la fila a mano en vez
// de pasar por tablaSimpleHtml_ (que sigue siendo el camino correcto
// para tablas sin enlaces).
function tablaDesviacionDetalleHtml_(detalle, incluirFase) {
  if (!detalle || detalle.length === 0) return '<div class="vacio">Sin casos con desviación medible.</div>';
  var entidad = incluirFase ? 'PROCESO' : 'TAREA';
  var encabezados = ['Nombre'].concat(incluirFase ? ['Fase'] : []).concat(['Previsto (d)', 'Real (d)', 'Desviación', 'Responsable']);
  var filas = detalle.map(function (d) {
    var colorDesv = d.desviacion > 0 ? 'color:#b00020;font-weight:bold;' : (d.desviacion < 0 ? 'color:#1e8e3e;' : '');
    var textoPct = d.pctDesviacion === null || d.pctDesviacion === undefined ? '' : ' (' + (d.pctDesviacion > 0 ? '+' : '') + d.pctDesviacion + '%)';
    return '<tr><td>' + enlaceEdicion_(entidad, d.id, d.nombre) + '</td>' +
      (incluirFase ? '<td>' + escaparHtmlServer_(d.fase || '—') + '</td>' : '') +
      '<td>' + (d.previsto === null ? '—' : d.previsto) + '</td>' +
      '<td>' + (d.real === null ? '—' : d.real) + '</td>' +
      '<td style="' + colorDesv + '">' + (d.desviacion > 0 ? '+' : '') + d.desviacion + escaparHtmlServer_(textoPct) + '</td>' +
      '<td>' + escaparHtmlServer_(d.responsable) + '</td></tr>';
  }).join('');
  return '<table><tr>' + encabezados.map(function (e) { return '<th>' + escaparHtmlServer_(e) + '</th>'; }).join('') + '</tr>' + filas + '</table>';
}

/*
 * Tabla de proyectos con nombre real (ver misma conversación).
 * proyectos: registros PROYECTO tal cual. incluirCampana (Memoria de
 * producción cruza varias campañas, el resto de informes ya están
 * acotados a una) añade la columna CAMPANA_NOMBRE.
 */
function tablaProyectosHtml_(proyectos, incluirCampana) {
  if (!proyectos || proyectos.length === 0) return '<div class="vacio">Ninguno.</div>';
  var encabezados = ['Nombre'].concat(incluirCampana ? ['Campaña'] : []).concat(['Tipo', 'Prioridad', 'Estado', 'Inicio real', 'Fin real']);
  var filas = proyectos.map(function (p) {
    return '<tr><td>' + enlaceEdicion_('PROYECTO', p.ID, p.NOMBRE) + '</td>' +
      (incluirCampana ? '<td>' + escaparHtmlServer_(p.CAMPANA_NOMBRE || '—') + '</td>' : '') +
      '<td>' + escaparHtmlServer_(p.TIPO_PROYECTO) + '</td><td>' + escaparHtmlServer_(p.PRIORIDAD) + '</td><td>' + escaparHtmlServer_(p.ESTADO) + '</td>' +
      '<td>' + escaparHtmlServer_(p.FECHA_INICIO_REAL || '—') + '</td><td>' + escaparHtmlServer_(p.FECHA_FIN_REAL || '—') + '</td></tr>';
  }).join('');
  return '<table><tr>' + encabezados.map(function (e) { return '<th>' + escaparHtmlServer_(e) + '</th>'; }).join('') + '</tr>' + filas + '</table>';
}

/* Tabla de productos con nombre real, incluye el % avance ya calculado (calcularAvanceProducto_). */
function tablaProductosHtml_(productos) {
  if (!productos || productos.length === 0) return '<div class="vacio">Ninguno.</div>';
  var filas = productos.map(function (p) {
    return '<tr><td>' + enlaceEdicion_('PRODUCTO', p.ID, p.NOMBRE) + '</td>' +
      '<td>' + escaparHtmlServer_(p.CODIGO) + '</td><td>' + p.PORCENTAJE_AVANCE_CALCULADO + '%</td>' +
      '<td>' + (p.CANTIDAD_PREVISTA || 0) + '</td><td>' + (p.CANTIDAD_PRODUCIDA || 0) + '</td><td>' + escaparHtmlServer_(p.ESTADO) + '</td></tr>';
  }).join('');
  return '<table><tr><th>Nombre</th><th>Código</th><th>% avance</th><th>Cantidad prevista</th><th>Cantidad producida</th><th>Estado</th></tr>' + filas + '</table>';
}

/*
 * Envoltorio compartido para el bloque "Casos individuales" (procesos +
 * tareas) que aparece en cualquier informe con desviacionPlanificacion
 * -- Campaña, Proyecto, Desviación, Calidad de planificación. nivel
 * 'resumen' recorta a los 10 peores casos de cada lista (ya vienen
 * ordenados peor-primero desde construirDetalleDesviacion_).
 */
function renderizarDetalleDesviacion_(d, nivel) {
  var procesos = limitarSiResumen_(d.procesosDetalle, nivel, 10);
  var tareas = limitarSiResumen_(d.tareasDetalle, nivel, 10);
  return '<h2>Casos individuales — procesos</h2>' +
    tablaDesviacionDetalleHtml_(procesos.filas, true) + avisoOcultasHtml_(procesos.ocultas) +
    '<h2>Casos individuales — tareas</h2>' +
    tablaDesviacionDetalleHtml_(tareas.filas, false) + avisoOcultasHtml_(tareas.ocultas);
}
