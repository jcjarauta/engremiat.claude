// Extrae las decisiones REALES tomadas en la Consola publicada (Artifact)
// desde la ultima sincronizacion, para trasladarlas al Sheet.
//
// Como se detecta una "decision real" (no solo la sugerencia prellenada):
// una tarjeta cuenta si, en el HTML publicado, su <div class="notas">
// NO tiene data-prellenado="true" y su texto no esta vacio, o si tiene
// adjuntos -- exactamente el mismo criterio que usa leerEstadoDelDom_()
// dentro de la propia Consola.
//
// Esto es deliberadamente de SOLO LECTURA: no escribe en el Sheet. Saca
// un listado para que un humano/Claude revise y traslade cada decision a
// 13_INCIDENCIAS con criterio -- escribir ESTADO automaticamente a partir
// de texto libre es demasiado arriesgado para dejarlo sin supervision.
// Ver metodologia en tools/consola/SINCRONIZACION.md.
//
// Uso: node extraer_decisiones.mjs <ruta-html-publicado.html>
// (el HTML se obtiene con WebFetch sobre la URL del Artifact, o
// guardando "Ver codigo fuente" -- debe ser el documento COMPLETO tal
// como lo sirve claude.ai, no solo el fragmento de #grupos.)

import fs from 'node:fs';

const RUTA = process.argv[2];
if (!RUTA) {
  console.error('Uso: node extraer_decisiones.mjs <ruta-html-publicado.html>');
  process.exit(2);
}

function extraerTarjetas_(html) {
  const tarjetas = [];
  const re = /<article class="tarjeta[^"]*" data-inc="(INC-\d+)">([\s\S]*?)<\/article>/g;
  let m;
  while ((m = re.exec(html))) {
    tarjetas.push({ id: m[1], bloque: m[2] });
  }
  return tarjetas;
}

function extraerNotas_(bloque) {
  const m = bloque.match(/<div class="notas([^"]*)"[^>]*?(data-prellenado="true")?[^>]*>([\s\S]*?)<\/div>/);
  if (!m) return null; // tarjetas "paraClaude" no llevan caja de notas
  const prellenado = !!m[2] || /data-prellenado="true"/.test(bloque.match(/<div class="notas[^>]*>/)?.[0] || '');
  const texto = m[3]
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .trim();
  return { texto, prellenado };
}

function extraerAdjuntos_(bloque) {
  const m = bloque.match(/class="chips-adjuntos-tarjeta" data-adjuntos="([^"]*)"/);
  if (!m) return [];
  const raw = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  try { return JSON.parse(raw); } catch { return []; }
}

function main() {
  const html = fs.readFileSync(RUTA, 'utf8');
  const tarjetas = extraerTarjetas_(html);
  const decisiones = [];

  tarjetas.forEach(({ id, bloque }) => {
    const notas = extraerNotas_(bloque);
    const adjuntos = extraerAdjuntos_(bloque);
    const tieneDecision = notas && notas.texto && !notas.prellenado;
    if (tieneDecision || adjuntos.length) {
      decisiones.push({
        id,
        decision: tieneDecision ? notas.texto : null,
        adjuntos: adjuntos.map(a => a.nombre)
      });
    }
  });

  if (!decisiones.length) {
    console.log('Sin decisiones nuevas que trasladar al Sheet.');
    return;
  }
  console.log(`${decisiones.length} tarjeta(s) con decision/adjunto nuevo -- revisar y trasladar a OBSERVACIONES (y ESTADO si corresponde):`);
  console.log('');
  decisiones.forEach(d => {
    console.log(`${d.id}`);
    if (d.decision) console.log(`  Decision: ${d.decision}`);
    if (d.adjuntos.length) console.log(`  Adjuntos (quedan en el Artifact, no en Drive): ${d.adjuntos.join(', ')}`);
    console.log('');
  });
}

main();
