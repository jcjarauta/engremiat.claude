// Regenera el HTML estatico inicial (<div id="grupos">...</div>) de
// consola-engremiat.html a partir del propio `var GRUPOS` del fichero,
// usando las funciones de render REALES (renderGrupos_/renderTarjeta_),
// no una reescritura a mano -- evita el riesgo de desajustar pills,
// iconos de actor, opciones de decision, etc. entre el dato y el HTML
// servido en la primera carga (pintar_() no re-renderiza si ya hay
// tarjetas en el DOM, ver consola-engremiat.html).
//
// Se ejecuta SIEMPRE despues de editar `var GRUPOS` a mano (añadir/quitar
// incidencias tras chequear_consistencia.mjs) y ANTES de publicar --
// ver metodologia en tools/consola/SINCRONIZACION.md.
//
// Uso: node regenerar_estatico.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CONSOLA = path.join(DIR, 'consola-engremiat.html');

// ---- Reconstruye el estado (revisado/notas/adjuntos) que YA esta en el
// HTML estatico actual, tarjeta por tarjeta -- mismo criterio que
// leerEstadoDelDom_() dentro de la propia Consola. Si esto no se hace,
// regenerar pisaria con "todo pendiente" cualquier decision real que el
// operador ya hubiera aprobado y publicado, perdiendo trabajo (bug real
// encontrado el 2026-08-23 al escribir este script: por suerte, en ese
// momento ninguna tarjeta llevaba una decision real aun). ----
function extraerEstadoPrevio_(html) {
  const estado = {};
  const reTarjeta = /<article class="tarjeta([^"]*)" data-inc="(INC-\d+)">([\s\S]*?)<\/article>/g;
  let m;
  while ((m = reTarjeta.exec(html))) {
    const revisadaPorClase = / revisada/.test(m[1]);
    const id = m[2];
    const bloque = m[3];
    const notasMatch = bloque.match(/<div class="notas[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const prellenado = /data-prellenado="true"/.test(bloque.match(/<div class="notas[^>]*>/)?.[0] || '');
    const texto = notasMatch
      ? notasMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()
      : '';
    const adjMatch = bloque.match(/class="chips-adjuntos-tarjeta" data-adjuntos="([^"]*)"/);
    let adjuntos = [];
    if (adjMatch) { try { adjuntos = JSON.parse(adjMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')); } catch { adjuntos = []; } }
    estado[id] = { revisado: revisadaPorClase && !prellenado, notas: prellenado ? '' : texto, adjuntos };
  }
  return estado;
}

function main() {
  const html = fs.readFileSync(CONSOLA, 'utf8');
  const estadoPrevio = extraerEstadoPrevio_(html);

  // ---- Extrae el bloque puro (sin DOM) que va de `var GRUPOS = [` al
  // cierre de `function renderGrupos_(estado) { ... }` -- todo lo que
  // hace falta para producir el mismo HTML que generaria el navegador,
  // sin tener que simular document/window. ----
  const inicio = html.indexOf('var GRUPOS = [');
  if (inicio === -1) throw new Error('No se encontro "var GRUPOS = [" en el fichero.');
  const marcaFin = '\n  // ---- Estado en memoria';
  const fin = html.indexOf(marcaFin, inicio);
  if (fin === -1) throw new Error('No se encontro el final del bloque puro (comentario "Estado en memoria").');
  const bloquePuro = html.slice(inicio, fin);

  const mod = { exports: {} };
  const fn = new Function('module', 'exports', bloquePuro + '\nmodule.exports = { GRUPOS: GRUPOS, renderGrupos_: renderGrupos_ };');
  fn(mod, mod.exports);
  const { GRUPOS, renderGrupos_ } = mod.exports;

  // Items nuevos (recien anadidos a GRUPOS a mano, sin estado previo aun)
  // arrancan en su estado por defecto; los que ya existian conservan lo
  // que tuvieran publicado.
  const estado = {};
  let nuevos = 0;
  GRUPOS.forEach(g => g.items.forEach(it => {
    if (estadoPrevio[it.id]) { estado[it.id] = estadoPrevio[it.id]; }
    else { estado[it.id] = { revisado: false, notas: '', adjuntos: [] }; nuevos++; }
  }));
  const nuevoInterior = renderGrupos_(estado);

  const startMarker = '<div id="grupos">';
  const endMarker = '</div>\n\n\n  <div id="barraGuardar"';
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) throw new Error('No se encontraron los marcadores del bloque estatico #grupos.');

  const nuevoHtml = html.slice(0, startIdx) + startMarker + nuevoInterior + html.slice(endIdx);
  fs.writeFileSync(CONSOLA, nuevoHtml);

  console.log('Regenerado. Grupos:');
  GRUPOS.forEach(g => console.log(`  ${g.clave}: ${g.items.length} items`));
}

main();
