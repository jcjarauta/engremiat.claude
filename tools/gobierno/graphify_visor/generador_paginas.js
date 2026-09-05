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

// Tipos reales de caja -- no un unico <section> generico para todo. Cada uno reutiliza
// un patron de HTML basico ya usado de verdad en otra pagina de este mismo visor: Lista
// (ul/li), Texto (p sueltos), Tabla (thead/tbody con th/td, mismo patron real de
// panel_operativo.html), Tarjetas (grid a.item, mismo patron real de home.html), y
// Formulario (label+input por fila, mismo patron real de Arquitecto/grafos.html).
const TIPOS_CAJA = {
  lista: { etiqueta: 'Lista', ayuda: 'Una función real por línea → <li>.' },
  texto: { etiqueta: 'Texto', ayuda: 'Un párrafo real por línea → <p>.' },
  tabla: { etiqueta: 'Tabla', ayuda: 'Primera línea = cabeceras reales, separadas por "|". Resto = filas reales, mismos separadores.' },
  tarjetas: { etiqueta: 'Tarjetas', ayuda: 'Una tarjeta real por línea: "Título - descripción real".' },
  formulario: { etiqueta: 'Formulario', ayuda: 'Un campo real por línea → etiqueta + input de partida.' },
};

// §8.127: catalogo real de layouts de pagina -- mismo criterio que TIPOS_CAJA, nunca CSS
// libre a mano. "columnas" = numero real de columnas del layout (limite real para saber
// en que columna/ancho puede colocarse una caja); "plantilla" = grid-template-columns
// real en fr (nunca px fijos, se adapta al ancho real de la pagina).
const LAYOUTS_PAGINA = {
  'una-columna': { etiqueta: '1 columna', columnas: 1, plantilla: '1fr' },
  'dos-columnas': { etiqueta: '2 columnas iguales', columnas: 2, plantilla: '1fr 1fr' },
  'tres-columnas': { etiqueta: '3 columnas iguales', columnas: 3, plantilla: '1fr 1fr 1fr' },
  'lateral-central-lateral': { etiqueta: 'Lateral + Central + Lateral', columnas: 3, plantilla: '1fr 2fr 1fr' },
};
const LAYOUT_POR_DEFECTO = 'una-columna';

// Genera el contenido real de una caja segun su tipo -- cada rama reutiliza un patron de
// HTML basico ya usado de verdad en otra pagina del visor (ver comentario de TIPOS_CAJA),
// nunca un unico <ul>/<p> generico para todo.
function generarContenidoCaja(c) {
  if (c.tipo === 'tabla') {
    const filas = c.tareas.length ? c.tareas : ['TODO real | TODO real'];
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
  if (c.tipo === 'tarjetas') {
    const tarjetas = c.tareas.length ? c.tareas : ['TODO real - descripción real'];
    return '  <div class="menu">\n' +
      tarjetas.map(t => {
        const [titulo, ...resto] = t.split(' - ');
        const desc = resto.join(' - ').trim();
        return '    <a class="item" href="#">\n      <h3>' + escapeHtmlLocal(titulo.trim()) + '</h3>\n' +
          '      <p>' + escapeHtmlLocal(desc || 'TODO: descripción real.') + '</p>\n    </a>';
      }).join('\n') +
      '\n  </div>\n';
  }
  if (c.tipo === 'formulario') {
    const campos = c.tareas.length ? c.tareas : ['TODO real'];
    return campos.map(campo =>
      '  <div class="fila">\n    <div>\n      <label>' + escapeHtmlLocal(campo) + '</label>\n' +
      '      <input type="text" placeholder="TODO">\n    </div>\n  </div>'
    ).join('\n') + '\n';
  }
  if (c.tipo === 'texto') {
    return (c.tareas.length ? c.tareas : ['TODO: contenido real de esta caja.'])
      .map(p => '  <p>' + escapeHtmlLocal(p) + '</p>').join('\n') + '\n';
  }
  // 'lista' -- comportamiento real ya existente desde el origen de Arquitecto.
  return c.tareas.length
    ? '  <ul>\n' + c.tareas.map(t => '    <li>TODO: ' + escapeHtmlLocal(t) + '</li>').join('\n') + '\n  </ul>\n'
    : '  <p class="hint">TODO: contenido real de esta caja.</p>\n';
}

// Genera el HTML de partida real completo -- tres regiones reales: cabecera fija
// (volver/h1/descripcion, igual en todas las paginas, nunca dentro de la rejilla),
// rejilla real de cajas (posicion segun LAYOUTS_PAGINA + la columna/ancho real de cada
// caja, por defecto ancho completo si no se especifica -- mismo aspecto apilado de
// siempre), y pie fijo real (reservado, vacio con TODO honesto hasta que se decida su
// contenido real -- nunca inventado). CSS extra (menu/item, fila/input/label) solo se
// incluye si de verdad hay una caja real de ese tipo -- nunca CSS muerto.
function generarHtmlReal(nombrePagina, cajas, colgarDe, layoutId) {
  const layout = LAYOUTS_PAGINA[layoutId] || LAYOUTS_PAGINA[LAYOUT_POR_DEFECTO];

  const secciones = cajas.map(c => {
    const inicio = Math.min(Math.max(Number(c.columnaInicio) || 1, 1), layout.columnas);
    const anchoMax = layout.columnas - inicio + 1;
    const ancho = Math.min(Math.max(Number(c.ancho) || layout.columnas, 1), anchoMax);
    const estiloGrid = layout.columnas > 1 ? ' style="grid-column: ' + inicio + ' / span ' + ancho + ';"' : '';
    return '<section' + estiloGrid + '>\n  <h2>' + escapeHtmlLocal(c.nombre) + '</h2>\n' + generarContenidoCaja(c) + '</section>';
  }).join('\n\n');

  // El enlace real de "volver" apunta a la pagina real de la que cuelga (colgarDe), no
  // siempre a home.html -- coherente con lo que se va a enlazar de verdad.
  const textoVolver = colgarDe === 'home.html' ? '← Home' : '← Volver';

  const tiposUsados = new Set(cajas.map(c => c.tipo));
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

  return '<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>Engremiat -- ' + escapeHtmlLocal(nombrePagina.toLowerCase()) + '</title>\n' +
    '<link rel="stylesheet" href="tokens.css">\n<style>\n' +
    '  html, body { margin: 0; background: var(--color-base-fondo); color: var(--color-base-texto); font-family: system-ui, sans-serif; }\n' +
    '  body { padding: 24px 28px 60px; max-width: 820px; }\n' +
    '  a.volver { color: #6fb3f2; text-decoration: none; font-size: 12px; }\n' +
    '  h1 { font-size: 18px; margin: 6px 0 4px; }\n' +
    '  p.hint { color: var(--color-base-texto-suave); font-size: 12px; line-height: 1.6; margin: 0 0 4px; }\n' +
    '  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-base-texto-suave); margin: 26px 0 8px; }\n' +
    '  .rejilla-paginas { display: grid; grid-template-columns: ' + layout.plantilla + '; gap: 20px; margin-top: 20px; }\n' +
    '  .rejilla-paginas section { margin: 0; }\n' +
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
