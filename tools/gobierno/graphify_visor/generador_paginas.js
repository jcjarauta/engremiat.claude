// §8.127: logica compartida real de generacion de HTML para paginas de Indice -- antes
// duplicada en arquitecto.html/mapa.html/arbol_campanas.html (misma clase de bug que ya
// encontramos en §8.126: una copia queda desincronizada de las otras porque nadie la
// actualiza a la vez). Cargado como <script src="generador_paginas.js"> real, igual que
// ya se hace con tokens.css -- un solo fichero, un cambio, un despliegue, los tres
// consumidores lo recogen. Solo generacion PURA de HTML a partir de datos ya reales --
// nunca logica de negocio del Sheet, nunca fetch, nunca DOM.

const PROYECTO_INDICE_ID = 'PRO-0002';

function escapeHtmlLocal(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Busca el nodo real de Indice dentro del arbol completo real de campanas -- unica
// fuente real, reutilizada por todo lo que necesite las paginas/cajas reales de Indice.
function obtenerIndiceReal(j) {
  for (const campana of (j.arbol || j)) {
    const indice = (campana.hijos || []).find(p => p.id === PROYECTO_INDICE_ID);
    if (indice) return indice;
  }
  return null;
}

// §8.131: Tipos reales de PIEZA -- contenido minimo dentro de una caja (antes "tipo de
// caja", ahora una caja puede llevar varias piezas, ver normalizarCaja). Cada uno
// reutiliza un patron de HTML basico ya usado de verdad en otra pagina de este mismo
// visor -- nunca un tipo inventado sin precedente real: Lista (ul/li), Texto (p sueltos),
// Tabla (thead/tbody con th/td, panel_operativo.html), Tarjetas (grid a.item, home.html),
// Formulario (label+input, Arquitecto/grafos.html), Botones (a.item/button ya usados en
// toda la app), Checklist (mismo estilo de pasos de Puerta Humana de Telar, de solo
// lectura -- un checkbox interactivo real exigiria persistencia propia, fuera de alcance
// aqui), Imagen (img estandar), Badges (.badge de arbol_campanas.html/panel_operativo.html),
// Metrica (numero grande + etiqueta, panel_operativo.html/mesa_montaje.html), Codigo
// (bloque <code>, ya usado en los "Pasos reales" de Arquitecto), y Grafo (unica pieza sin
// lineas de texto -- ver CATALOGO_GRAFOS/generarEmbedGrafo).
const TIPOS_CAJA = {
  lista: { etiqueta: 'Lista', ayuda: 'Una función real por línea → <li>.' },
  texto: { etiqueta: 'Texto', ayuda: 'Un párrafo real por línea → <p>.' },
  tabla: { etiqueta: 'Tabla', ayuda: 'Primera línea = cabeceras reales, separadas por "|". Resto = filas reales, mismos separadores.' },
  tarjetas: { etiqueta: 'Tarjetas', ayuda: 'Una tarjeta real por línea: "Título - descripción real".' },
  formulario: { etiqueta: 'Formulario', ayuda: 'Un campo real por línea → etiqueta + input de partida.' },
  botones: { etiqueta: 'Botones/enlaces', ayuda: 'Un botón real por línea: "Etiqueta -> URL o página real".' },
  checklist: { etiqueta: 'Checklist (solo lectura)', ayuda: 'Un ítem real por línea: "[x] hecho" o "[ ] pendiente".' },
  imagen: { etiqueta: 'Imagen', ayuda: 'Una imagen real por línea: "URL real | descripción real (alt)".' },
  badges: { etiqueta: 'Badges/etiquetas', ayuda: 'Una etiqueta corta real por línea.' },
  metrica: { etiqueta: 'Métrica/KPI', ayuda: 'Una métrica real por línea: "Etiqueta | Valor real".' },
  codigo: { etiqueta: 'Bloque de código', ayuda: 'Texto real tal cual -- una línea de código por línea.' },
  grafo: { etiqueta: 'Insertar grafo', ayuda: 'Elige un grafo real del catálogo de abajo -- sin líneas, se embebe en vivo.' },
};

// §8.131: catalogo real de los grafos ya existentes en este visor (los 12 ficheros reales
// grafo_*.json de tools/gobierno/graphify_visor/) -- para la pieza "Insertar grafo". Cada
// etiqueta/descripcion viene tal cual de la pagina real que ya sirve ese grafo (nunca
// inventada aqui). Si se anade un grafo nuevo de verdad, hay que sumarlo tambien aqui --
// misma deuda real ya conocida y documentada en §8.126 sobre mapa.html.
const CATALOGO_GRAFOS = {
  historial: { archivo: 'grafo_historial.json', etiqueta: 'Historial de operaciones', desc: 'Cada operación real (91_HISTORIAL, por CORRELATION_ID) conectada a las entidades reales que tocó de golpe.' },
  holon: { archivo: 'grafo_holon.json', etiqueta: 'El Holon real', desc: 'Quién hace qué con quién, dónde -- 40 aristas reales de 07_Holon_Relaciones/.' },
  jerarquia: { archivo: 'grafo_jerarquia.json', etiqueta: 'Jerarquía Campaña→Tarea', desc: 'Campaña→Proyecto→Producto→Proceso→Tarea real, vía las claves reales del Sheet.' },
  modulo: { archivo: 'grafo_modulo.json', etiqueta: 'Módulos reales', desc: 'Fichas reales de 01_Mundo/Modulos/ del vault y sus relaciones declaradas reales.' },
  n8n: { archivo: 'grafo_n8n.json', etiqueta: 'Workflows n8n', desc: 'Workflows n8n reales ya exportados, con Puerta Humana propia (Cronista).' },
  node: { archivo: 'grafo_node.json', etiqueta: 'Capa Node (tools/)', desc: 'Scripts reales de Node en tools/, generado por mapear_grafo_node.mjs (solo lectura).' },
  paquete_cliente: { archivo: 'grafo_paquete_cliente.json', etiqueta: 'Paquete cliente', desc: 'Qué módulos reales tiene activos cada cliente real (Baserow, PAQUETE_CLIENTE).' },
  recurso: { archivo: 'grafo_recurso.json', etiqueta: 'Recursos reales', desc: 'Fichas reales de 01_Mundo/Recursos/ del vault y sus relaciones declaradas reales.' },
  regla: { archivo: 'grafo_regla.json', etiqueta: 'Reglas reales', desc: 'Fichas reales de 03_Reglas/ del vault y sus relaciones declaradas reales.' },
  telar_estados: { archivo: 'grafo_telar_estados.json', etiqueta: 'Ciclo de vida de Telar', desc: 'El ciclo de vida real de una Misión de Telar (estados.json) -- 14 estados.' },
  visor: { archivo: 'grafo_visor.json', etiqueta: 'Vista completa del sistema', desc: 'Cada página .html, el servidor, sus endpoints y las pestañas/tablas reales que toca.' },
  wikilinks: { archivo: 'grafo_wikilinks.json', etiqueta: 'Grafo maestro (wikilinks + Holon)', desc: 'Las 94 fichas de entidad reales de la bóveda -- ninguna filtrada, 331 aristas reales.' },
};

// §8.127: catalogo real de layouts -- mismo criterio que TIPOS_CAJA, nunca CSS libre a
// mano. Se usa dos veces: layout real de la PAGINA (rejilla de cajas) y, desde §8.131,
// layout interno real de cada CAJA (rejilla de piezas) -- misma mecanica, un nivel mas
// adentro. "columnas" = numero real de columnas (limite real de colocacion); "plantilla"
// = grid-template-columns real en fr (nunca px fijos).
const LAYOUTS_PAGINA = {
  'una-columna': { etiqueta: '1 columna', columnas: 1, plantilla: '1fr' },
  'dos-columnas': { etiqueta: '2 columnas iguales', columnas: 2, plantilla: '1fr 1fr' },
  'tres-columnas': { etiqueta: '3 columnas iguales', columnas: 3, plantilla: '1fr 1fr 1fr' },
  'lateral-central-lateral': { etiqueta: 'Lateral + Central + Lateral', columnas: 3, plantilla: '1fr 2fr 1fr' },
};
const LAYOUT_POR_DEFECTO = 'una-columna';

// §8.135: catalogo real de plantillas BASE de partida para "Crear pagina nueva" -- pedido
// explicito: "la idea es crear un catalogo de plantillas html para distintos propositos...
// empezar desde cero o reutilizar alguna plantilla prediseñada". Cada plantilla es solo
// estructura real generica (layout de pagina + cajas/piezas ya colocadas), NUNCA contenido
// inventado -- las piezas nacen vacias, el TODO honesto ya lo pone generarContenidoPieza()
// solo, igual que una caja creada a mano. Cada una tiene precedente real ya usado en
// alguna pagina de este mismo visor (mismo criterio que TIPOS_CAJA/CATALOGO_GRAFOS). Fijo
// y curado a mano -- nunca cambia solo -- a diferencia de las plantillas de PROYECTO
// (§8.136), que nacen del propio diseno real que el operador hace en Arquitecto y decide
// guardar como reutilizable, viven en servidor_memoria.mjs (plantillas_proyecto.json),
// nunca aqui.
const CATALOGO_PLANTILLAS_BASE = {
  hub_enlaces: {
    etiqueta: 'Hub de enlaces', descripcion: 'Bienvenida + botones grandes a otras páginas reales. Precedente: home.html.',
    layoutId: 'una-columna', tipoPagina: 'Espacio',
    cajas: [{ nombre: 'Enlaces', cabecera: 'TODO: bienvenida real -- qué es esta página y a dónde lleva.', layoutInterno: 'una-columna', piezas: [{ tipo: 'botones', contenido: [] }] }],
  },
  galeria_tarjetas: {
    etiqueta: 'Galería de tarjetas', descripcion: 'Una columna por categoría, cada una con sus tarjetas reales. Precedente: biblioteca.html/vista_recursos.html.',
    layoutId: 'tres-columnas', tipoPagina: 'Espacio',
    cajas: [
      { nombre: 'Categoría 1', columnaInicio: 1, ancho: 1, layoutInterno: 'una-columna', piezas: [{ tipo: 'tarjetas', contenido: [] }] },
      { nombre: 'Categoría 2', columnaInicio: 2, ancho: 1, layoutInterno: 'una-columna', piezas: [{ tipo: 'tarjetas', contenido: [] }] },
      { nombre: 'Categoría 3', columnaInicio: 3, ancho: 1, layoutInterno: 'una-columna', piezas: [{ tipo: 'tarjetas', contenido: [] }] },
    ],
  },
  panel_kpis: {
    etiqueta: 'Panel con KPIs + tabla', descripcion: 'Métricas reales a un lado, tabla de detalle al otro. Precedente: panel_operativo.html.',
    layoutId: 'dos-columnas', tipoPagina: 'Espacio',
    cajas: [
      { nombre: 'Resumen', columnaInicio: 1, ancho: 1, layoutInterno: 'una-columna', piezas: [{ tipo: 'metrica', contenido: [] }, { tipo: 'metrica', contenido: [] }] },
      { nombre: 'Detalle', columnaInicio: 2, ancho: 1, layoutInterno: 'una-columna', piezas: [{ tipo: 'tabla', contenido: [] }] },
    ],
  },
  cockpit_backlog: {
    etiqueta: 'Cockpit de backlog', descripcion: 'Estado a la izquierda, backlog real en el centro, resumen a la derecha. Precedente: taller.html.',
    layoutId: 'lateral-central-lateral', tipoPagina: 'Espacio',
    cajas: [
      { nombre: 'Estado', columnaInicio: 1, ancho: 1, layoutInterno: 'una-columna', piezas: [{ tipo: 'badges', contenido: [] }] },
      { nombre: 'Backlog', columnaInicio: 2, ancho: 1, layoutInterno: 'una-columna', piezas: [{ tipo: 'tabla', contenido: [] }] },
      { nombre: 'Resumen', columnaInicio: 3, ancho: 1, layoutInterno: 'una-columna', piezas: [{ tipo: 'metrica', contenido: [] }] },
    ],
  },
  formulario_captura: {
    etiqueta: 'Formulario de captura', descripcion: 'Un formulario real con su propósito y qué pasa con el dato. Precedente: patrón Formulario ya en Arquitecto/grafos.html.',
    layoutId: 'una-columna', tipoPagina: 'Herramienta',
    cajas: [{ nombre: 'Formulario', cabecera: 'TODO: propósito real de este formulario.', pie: 'TODO: qué pasa de verdad con el dato capturado.', layoutInterno: 'una-columna', piezas: [{ tipo: 'formulario', contenido: [] }] }],
  },
  ficha_referencia: {
    etiqueta: 'Ficha de referencia/documentación', descripcion: 'Contexto, comandos y pasos reales en una sola caja apilada. Precedente: "Pasos reales" de Arquitecto.',
    layoutId: 'una-columna', tipoPagina: 'Herramienta',
    cajas: [{ nombre: 'Referencia', layoutInterno: 'una-columna', piezas: [{ tipo: 'texto', contenido: [] }, { tipo: 'codigo', contenido: [] }, { tipo: 'checklist', contenido: [] }] }],
  },
  grafo_anotado: {
    etiqueta: 'Vista de grafo anotada', descripcion: 'Un grafo real embebido junto a notas de qué representa. Precedente: sheet-real.html/vista_sistema.html.',
    layoutId: 'dos-columnas', tipoPagina: 'Transversal',
    cajas: [
      { nombre: 'Grafo', columnaInicio: 1, ancho: 1, layoutInterno: 'una-columna', piezas: [{ tipo: 'grafo', grafoId: '' }] },
      { nombre: 'Notas', columnaInicio: 2, ancho: 1, layoutInterno: 'una-columna', piezas: [{ tipo: 'texto', contenido: [] }] },
    ],
  },
  indice_jerarquia: {
    etiqueta: 'Índice con jerarquía', descripcion: 'Una lista real con su estado a modo de badges. Precedente: arbol_campanas.html/mapa.html.',
    layoutId: 'una-columna', tipoPagina: 'Espacio',
    cajas: [{ nombre: 'Jerarquía', layoutInterno: 'una-columna', piezas: [{ tipo: 'lista', contenido: [] }, { tipo: 'badges', contenido: [] }] }],
  },
  landing_proyecto: {
    etiqueta: 'Landing de proyecto/campaña', descripcion: 'Progreso, detalle y enlaces relacionados en tres columnas reales. Combina patrones ya usados en el visor.',
    layoutId: 'lateral-central-lateral', tipoPagina: 'Espacio',
    cajas: [
      { nombre: 'Progreso', columnaInicio: 1, ancho: 1, layoutInterno: 'una-columna', piezas: [{ tipo: 'metrica', contenido: [] }] },
      { nombre: 'Detalle', columnaInicio: 2, ancho: 1, layoutInterno: 'una-columna', piezas: [{ tipo: 'texto', contenido: [] }, { tipo: 'checklist', contenido: [] }] },
      { nombre: 'Relacionado', columnaInicio: 3, ancho: 1, layoutInterno: 'una-columna', piezas: [{ tipo: 'botones', contenido: [] }] },
    ],
  },
};

// §8.131: normaliza una caja real a su forma canonica -- acepta tanto la forma nueva
// (piezas reales, cabecera/pie/layoutInterno) como la forma plana antigua de antes de
// §8.131 (tipo/tareas o tipo/contenido, un unico bloque por caja) para no perder ningun
// fragmento real ya guardado en produccion (mismo criterio de compatibilidad hacia atras
// que layoutId/columnaInicio/ancho en §8.127).
function normalizarCaja(c) {
  if (Array.isArray(c.piezas)) {
    return {
      nombre: c.nombre || '',
      columnaInicio: c.columnaInicio || null,
      ancho: c.ancho || null,
      cabecera: c.cabecera || '',
      pie: c.pie || '',
      layoutInterno: c.layoutInterno || LAYOUT_POR_DEFECTO,
      piezas: c.piezas.length ? c.piezas : [{ tipo: 'lista', contenido: [] }],
    };
  }
  const contenido = c.tareas || c.contenido || [];
  return {
    nombre: c.nombre || '',
    columnaInicio: c.columnaInicio || null,
    ancho: c.ancho || null,
    cabecera: '',
    pie: '',
    layoutInterno: LAYOUT_POR_DEFECTO,
    piezas: [{ tipo: c.tipo || 'lista', contenido, columnaInicio: null, ancho: null }],
  };
}

// Genera el contenido real de una pieza segun su tipo -- cada rama reutiliza un patron de
// HTML basico ya usado de verdad en otra pagina del visor (ver comentario de TIPOS_CAJA),
// nunca un unico <ul>/<p> generico para todo. 'grafo' no pasa por aqui -- ver
// generarEmbedGrafo, no tiene lineas de texto.
function generarContenidoPieza(p) {
  const lineas = p.contenido || [];
  if (p.tipo === 'tabla') {
    const filas = lineas.length ? lineas : ['TODO real | TODO real'];
    const partes = filas.map(f => f.split('|').map(x => x.trim()));
    const cabeceras = partes[0];
    const cuerpo = partes.slice(1);
    return '  <table style="width:100%; border-collapse:collapse; font-size:12.5px;">\n' +
      '    <tr style="text-align:left; color:var(--color-base-texto-suave); font-size:11px;">\n' +
      cabeceras.map(h => '      <th style="padding:4px 8px 4px 0;">' + escapeHtmlLocal(h) + '</th>').join('\n') + '\n' +
      '    </tr>\n' +
      (cuerpo.length
        ? cuerpo.map(fila => '    <tr style="border-top:1px solid var(--color-base-borde-suave);">\n' +
            fila.map(v => '      <td style="padding:5px 8px 5px 0;">' + escapeHtmlLocal(v) + '</td>').join('\n') + '\n    </tr>').join('\n')
        : '    <tr><td class="hint">TODO: filas reales.</td></tr>') +
      '\n  </table>\n';
  }
  if (p.tipo === 'tarjetas') {
    const tarjetas = lineas.length ? lineas : ['TODO real - descripción real'];
    return '  <div class="menu">\n' +
      tarjetas.map(t => {
        const [titulo, ...resto] = t.split(' - ');
        const desc = resto.join(' - ').trim();
        return '    <a class="item" href="#">\n      <h3>' + escapeHtmlLocal(titulo.trim()) + '</h3>\n' +
          '      <p>' + escapeHtmlLocal(desc || 'TODO: descripción real.') + '</p>\n    </a>';
      }).join('\n') +
      '\n  </div>\n';
  }
  if (p.tipo === 'formulario') {
    const campos = lineas.length ? lineas : ['TODO real'];
    return campos.map(campo =>
      '  <div class="fila">\n    <div>\n      <label>' + escapeHtmlLocal(campo) + '</label>\n' +
      '      <input type="text" placeholder="TODO">\n    </div>\n  </div>'
    ).join('\n') + '\n';
  }
  if (p.tipo === 'texto') {
    return (lineas.length ? lineas : ['TODO: contenido real de esta pieza.'])
      .map(t => '  <p>' + escapeHtmlLocal(t) + '</p>').join('\n') + '\n';
  }
  if (p.tipo === 'botones') {
    const items = lineas.length ? lineas : ['TODO real -> #'];
    return '  <div class="botonera-real">\n' + items.map(l => {
      const [etiqueta, destino] = l.split('->').map(x => (x || '').trim());
      return '    <a class="boton-real" href="' + escapeHtmlLocal(destino || '#') + '">' + escapeHtmlLocal(etiqueta || 'TODO') + '</a>';
    }).join('\n') + '\n  </div>\n';
  }
  if (p.tipo === 'checklist') {
    const items = lineas.length ? lineas : ['[ ] TODO real'];
    return '  <ul class="checklist-real">\n' + items.map(l => {
      const hecho = /^\[x\]/i.test(l.trim());
      const texto = l.replace(/^\[[ xX]\]\s*/, '');
      return '    <li class="' + (hecho ? 'hecho' : 'pendiente') + '">' + (hecho ? '☑' : '☐') + ' ' + escapeHtmlLocal(texto) + '</li>';
    }).join('\n') + '\n  </ul>\n';
  }
  if (p.tipo === 'imagen') {
    const items = lineas.length ? lineas : ['TODO real | descripción real'];
    return items.map(l => {
      const [url, alt] = l.split('|').map(x => (x || '').trim());
      return '  <img src="' + escapeHtmlLocal(url) + '" alt="' + escapeHtmlLocal(alt || '') + '" style="max-width:100%; border-radius:8px; display:block;">';
    }).join('\n') + '\n';
  }
  if (p.tipo === 'badges') {
    const items = lineas.length ? lineas : ['TODO real'];
    return '  <div class="badges-real">\n' + items.map(l => '    <span class="badge">' + escapeHtmlLocal(l) + '</span>').join('\n') + '\n  </div>\n';
  }
  if (p.tipo === 'metrica') {
    const items = lineas.length ? lineas : ['TODO real | 0'];
    return '  <div class="metricas-real">\n' + items.map(l => {
      const [etiqueta, valor] = l.split('|').map(x => (x || '').trim());
      return '    <div class="metrica-real"><b>' + escapeHtmlLocal(valor || '0') + '</b><span>' + escapeHtmlLocal(etiqueta || 'TODO') + '</span></div>';
    }).join('\n') + '\n  </div>\n';
  }
  if (p.tipo === 'codigo') {
    const items = lineas.length ? lineas : ['TODO real'];
    return '  <pre class="codigo-real"><code>' + items.map(escapeHtmlLocal).join('\n') + '</code></pre>\n';
  }
  // 'lista' -- comportamiento real ya existente desde el origen de Arquitecto.
  return lineas.length
    ? '  <ul>\n' + lineas.map(t => '    <li>TODO: ' + escapeHtmlLocal(t) + '</li>').join('\n') + '\n  </ul>\n'
    : '  <p class="hint">TODO: contenido real de esta pieza.</p>\n';
}

// §8.131: embebe un grafo real ya existente (vis-network, mismo patron de fisica ya
// probado en plantilla_grafo_espacio.html/16 paginas del visor) -- version mini, sin
// panel lateral ni ficha (esas viven en la pagina dedicada de ese grafo). idUnico evita
// colisiones de id si la misma pagina embebe varios grafos reales.
function generarEmbedGrafo(grafoId, idUnico) {
  const g = CATALOGO_GRAFOS[grafoId];
  if (!g) return '  <p class="hint">TODO: elige un grafo real del catálogo.</p>\n';
  return (
    '  <div id="' + idUnico + '" class="mini-grafo-real"></div>\n' +
    '  <script>\n' +
    '  (function() {\n' +
    '    fetch(' + JSON.stringify(g.archivo) + ').then(function(r) { return r.json(); }).then(function(datos) {\n' +
    '      var nodes = new vis.DataSet(datos.nodos.map(function(n) { return { id: n.id, label: n.nombre, title: n.id, shape: "dot", size: 8, color: "#4c9aff", font: { color: "rgba(0,0,0,0)", size: 10 } }; }));\n' +
    '      var edges = new vis.DataSet(datos.aristas.map(function(a, i) { return { id: i, from: a.source, to: a.target, color: { color: "#3a3b47" } }; }));\n' +
    '      var red = new vis.Network(document.getElementById(' + JSON.stringify(idUnico) + '), { nodes: nodes, edges: edges }, {\n' +
    '        physics: { solver: "forceAtlas2Based", forceAtlas2Based: { gravitationalConstant: -60, springLength: 90, centralGravity: 0.01, damping: 0.4, avoidOverlap: 0.6 }, stabilization: { iterations: 150 } },\n' +
    '        interaction: { hover: true, dragView: true, zoomView: true },\n' +
    '      });\n' +
    '      red.once("stabilizationIterationsDone", function() { red.setOptions({ physics: false }); red.setSize("100%", "100%"); red.redraw(); red.fit({ animation: false }); });\n' +
    '    });\n' +
    '  })();\n' +
    '  </script>\n'
  );
}

// §8.131: genera el HTML real de una caja completa -- cabecera real opcional, rejilla
// interna real de piezas (mismo mecanismo de columnaInicio/ancho que la rejilla de
// pagina, un nivel mas adentro, via layoutInterno de la propia caja), y pie real
// opcional. contadorGrafo es un objeto mutable {n} compartido por toda la pagina para que
// cada embed de grafo real tenga un id de DOM unico, aunque se repita el mismo grafo.
function generarHtmlCaja(cajaCruda, contadorGrafo) {
  const c = normalizarCaja(cajaCruda);
  const layoutInt = LAYOUTS_PAGINA[c.layoutInterno] || LAYOUTS_PAGINA[LAYOUT_POR_DEFECTO];

  const piezasHtml = c.piezas.map(p => {
    const inicio = Math.min(Math.max(Number(p.columnaInicio) || 1, 1), layoutInt.columnas);
    const anchoMax = layoutInt.columnas - inicio + 1;
    const ancho = Math.min(Math.max(Number(p.ancho) || layoutInt.columnas, 1), anchoMax);
    const estilo = layoutInt.columnas > 1 ? ' style="grid-column: ' + inicio + ' / span ' + ancho + ';"' : '';
    let contenidoHtml;
    if (p.tipo === 'grafo') {
      contadorGrafo.n++;
      contenidoHtml = generarEmbedGrafo(p.grafoId, 'mini-grafo-' + contadorGrafo.n);
    } else {
      contenidoHtml = generarContenidoPieza(p);
    }
    return '  <div class="pieza-real"' + estilo + '>\n' + contenidoHtml + '  </div>';
  }).join('\n');

  return (
    (c.cabecera ? '  <p class="cabecera-caja">' + escapeHtmlLocal(c.cabecera) + '</p>\n' : '') +
    '  <div class="rejilla-interna" style="display:grid; grid-template-columns: ' + layoutInt.plantilla + '; gap:14px;">\n' + piezasHtml + '\n  </div>\n' +
    (c.pie ? '  <p class="pie-caja">' + escapeHtmlLocal(c.pie) + '</p>\n' : '')
  );
}

// Genera el HTML de partida real completo -- tres regiones reales: cabecera fija
// (volver/h1/descripcion, igual en todas las paginas, nunca dentro de la rejilla),
// rejilla real de cajas (posicion segun LAYOUTS_PAGINA + la columna/ancho real de cada
// caja, por defecto ancho completo si no se especifica -- mismo aspecto apilado de
// siempre), y pie fijo real (reservado, vacio con TODO honesto hasta que se decida su
// contenido real -- nunca inventado). CSS extra (menu/item, botonera, etc.) solo se
// incluye si de verdad hay una pieza real de ese tipo en alguna caja -- nunca CSS muerto.
// El script real de vis-network solo se carga si de verdad hay una pieza real de tipo
// 'grafo' -- mismo criterio.
function generarHtmlReal(nombrePagina, cajas, colgarDe, layoutId) {
  const layout = LAYOUTS_PAGINA[layoutId] || LAYOUTS_PAGINA[LAYOUT_POR_DEFECTO];
  const contadorGrafo = { n: 0 };
  const cajasNormalizadas = cajas.map(normalizarCaja);

  const secciones = cajasNormalizadas.map((c, i) => {
    const inicio = Math.min(Math.max(Number(c.columnaInicio) || 1, 1), layout.columnas);
    const anchoMax = layout.columnas - inicio + 1;
    const ancho = Math.min(Math.max(Number(c.ancho) || layout.columnas, 1), anchoMax);
    const estiloGrid = layout.columnas > 1 ? ' style="grid-column: ' + inicio + ' / span ' + ancho + ';"' : '';
    return '<section' + estiloGrid + '>\n  <h2>' + escapeHtmlLocal(c.nombre) + '</h2>\n' + generarHtmlCaja(cajas[i], contadorGrafo) + '</section>';
  }).join('\n\n');

  // El enlace real de "volver" apunta a la pagina real de la que cuelga (colgarDe), no
  // siempre a home.html -- coherente con lo que se va a enlazar de verdad.
  const textoVolver = colgarDe === 'home.html' ? '← Home' : '← Volver';

  const tiposUsados = new Set();
  cajasNormalizadas.forEach(c => c.piezas.forEach(p => tiposUsados.add(p.tipo)));

  let cssExtra = '';
  if (tiposUsados.has('tarjetas')) {
    cssExtra +=
      '  .menu { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }\n' +
      '  a.item { display: block; background: var(--color-base-panel); border: 1px solid var(--color-base-borde); border-radius: 10px; padding: 14px 16px; text-decoration: none; color: var(--color-base-texto); }\n' +
      '  a.item:hover { border-color: #6ea8ff; }\n' +
      '  a.item h3 { margin: 0 0 4px; font-size: 13px; }\n' +
      '  a.item p { margin: 0; color: var(--color-base-texto-suave); font-size: 11.5px; line-height: 1.5; }\n';
  }
  if (tiposUsados.has('formulario')) {
    cssExtra +=
      '  input, select { background: var(--color-base-fondo); border: 1px solid var(--color-base-borde); color: var(--color-base-texto); border-radius: 6px; padding: 7px 9px; font-size: 12.5px; box-sizing: border-box; font-family: inherit; }\n' +
      '  .fila { display: flex; gap: 8px; margin-bottom: 8px; }\n' +
      '  .fila > div { flex: 1; }\n' +
      '  label { display: block; font-size: 11px; color: var(--color-base-texto-tenue); margin-bottom: 3px; }\n';
  }
  if (tiposUsados.has('botones')) {
    cssExtra +=
      '  .botonera-real { display: flex; flex-wrap: wrap; gap: 8px; }\n' +
      '  a.boton-real { display: inline-block; background: var(--color-base-panel); border: 1px solid var(--color-base-borde); border-radius: 6px; padding: 6px 12px; color: var(--color-base-texto); text-decoration: none; font-size: 12.5px; }\n' +
      '  a.boton-real:hover { border-color: #6ea8ff; }\n';
  }
  if (tiposUsados.has('checklist')) {
    cssExtra +=
      '  ul.checklist-real { list-style: none; padding: 0; margin: 0; font-size: 12.5px; }\n' +
      '  ul.checklist-real li { padding: 3px 0; }\n' +
      '  ul.checklist-real li.hecho { color: var(--color-base-texto-suave); text-decoration: line-through; }\n';
  }
  if (tiposUsados.has('badges')) {
    cssExtra +=
      '  .badges-real { display: flex; flex-wrap: wrap; gap: 6px; }\n' +
      '  .badges-real .badge { display: inline-block; padding: 3px 9px; border-radius: 12px; font-size: 10.5px; background: var(--color-base-panel); border: 1px solid var(--color-base-borde); }\n';
  }
  if (tiposUsados.has('metrica')) {
    cssExtra +=
      '  .metricas-real { display: flex; flex-wrap: wrap; gap: 18px; }\n' +
      '  .metrica-real { display: flex; flex-direction: column; }\n' +
      '  .metrica-real b { font-size: 22px; }\n' +
      '  .metrica-real span { font-size: 11px; color: var(--color-base-texto-suave); }\n';
  }
  if (tiposUsados.has('codigo')) {
    cssExtra +=
      '  pre.codigo-real { background: var(--color-base-panel); border: 1px solid var(--color-base-borde); border-radius: 8px; padding: 10px 12px; overflow-x: auto; font-size: 11.5px; }\n';
  }
  if (tiposUsados.has('grafo')) {
    cssExtra += '  .mini-grafo-real { height: 220px; border: 1px solid var(--color-base-borde); border-radius: 8px; }\n';
  }

  const scriptVis = tiposUsados.has('grafo')
    ? '<script src="https://unpkg.com/vis-network@9.1.6/standalone/umd/vis-network.min.js"></script>\n'
    : '';

  return '<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>Engremiat -- ' + escapeHtmlLocal(nombrePagina.toLowerCase()) + '</title>\n' +
    scriptVis +
    '<link rel="stylesheet" href="tokens.css">\n<style>\n' +
    '  html, body { margin: 0; background: var(--color-base-fondo); color: var(--color-base-texto); font-family: system-ui, sans-serif; }\n' +
    '  body { padding: 24px 28px 60px; max-width: 820px; }\n' +
    '  a.volver { color: #6fb3f2; text-decoration: none; font-size: 12px; }\n' +
    '  h1 { font-size: 18px; margin: 6px 0 4px; }\n' +
    '  p.hint { color: var(--color-base-texto-suave); font-size: 12px; line-height: 1.6; margin: 0 0 4px; }\n' +
    '  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-base-texto-suave); margin: 26px 0 8px; }\n' +
    '  .rejilla-paginas { display: grid; grid-template-columns: ' + layout.plantilla + '; gap: 20px; margin-top: 20px; }\n' +
    '  .rejilla-paginas section { margin: 0; }\n' +
    '  p.cabecera-caja { color: var(--color-base-texto-suave); font-size: 12px; margin: -4px 0 10px; }\n' +
    '  p.pie-caja { color: var(--color-base-texto-tenue); font-size: 11px; margin-top: 10px; border-top: 1px solid var(--color-base-borde-suave); padding-top: 8px; }\n' +
    '  footer.pie-real { margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--color-base-borde-suave); }\n' +
    cssExtra +
    '</style>\n</head>\n<body>\n' +
    '<a class="volver" href="' + escapeHtmlLocal(colgarDe) + '">' + textoVolver + '</a>\n' +
    '<h1>' + escapeHtmlLocal(nombrePagina) + '</h1>\n' +
    '<p class="hint">TODO: descripción real de qué hace esta página y de dónde sale su dato.</p>\n' +
    '<div class="rejilla-paginas">\n' + secciones + '\n</div>\n' +
    '<footer class="pie-real">\n  <p class="hint">TODO: contenido real del pie de esta página.</p>\n</footer>\n' +
    '</body>\n</html>\n';
}
