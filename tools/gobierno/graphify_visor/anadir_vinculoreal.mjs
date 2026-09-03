#!/usr/bin/env node
/*
 * Anade la seccion "## Vinculo real" a las fichas reales de la boveda que
 * el censo (§8.23) valoro con evidencia PRECISA y que todavia no la
 * tienen -- mismo patron ya usado a mano en Vigilia.md/Coordinador.md/
 * Ejecutor.md, ahora aplicado de forma sistematica y segura a las 33
 * restantes: SOLO anade al final del fichero, nunca toca ni una linea
 * del contenido real ya existente, y es idempotente (si la ficha ya
 * tiene la seccion, se salta).
 *
 * Lee valoracion_vinculoreal.json (generado por
 * valorar_vinculoreal_confirmadas.mjs) y por cada entidad con
 * estado="evidencia_precisa" construye el bloque a partir de sus `hits`
 * reales -- nunca inventa un recordId que el barrido no encontro.
 *
 * Uso: node anadir_vinculoreal.mjs [--aplicar]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = import.meta.dirname;
const RUTA_VAULT = 'G:\\Mi unidad\\engremiat.claude\\Obsidian-Engremiat\\Universos\\Engremiat';

const SISTEMA_POR_CLAVE = {
  modulo_ids_js: 'codigo',
  node: 'repo',
  n8n: 'n8n',
  baserow: 'Baserow',
  sheet: 'Sheet',
  telar: 'Telar',
  telar_b2_real: 'Telar (B2)',
  verificado_a_mano: 'repo',
};

function limpiarRecordId(clave, valor) {
  return valor.replace(/^(sheet|baserow|telar|recurso|dato):/, '');
}

function construirBloque(hits) {
  const lineas = ['', '## Vínculo real', ''];
  for (const [clave, valores] of Object.entries(hits)) {
    // 'appsscript' solo cuenta para decidir si hay evidencia -- un fichero
    // entero de 12000+ funciones no es un recordId util, se omite al
    // escribir. Un nodo "recurso:X" en grafo_node.json es el mismo dato
    // que ya aparece como Sheet/Baserow por otro lado -- se omite para no
    // duplicar la misma evidencia con una etiqueta "repo" enganosa.
    if (clave === 'appsscript') continue;
    const sistema = SISTEMA_POR_CLAVE[clave] || clave;
    for (const v of valores) {
      if (clave === 'node' && v.startsWith('recurso:')) continue;
      const sufijo = clave === 'telar_b2_real' ? ' -- transcripción real de deliberación'
        : clave === 'verificado_a_mano' ? ' -- verificado a mano leyendo el fichero'
        : '';
      lineas.push(`- ${sistema}: \`${limpiarRecordId(clave, v)}\`${sufijo}`);
    }
  }
  lineas.push('');
  return lineas.join('\n');
}

function main() {
  const aplicar = process.argv.includes('--aplicar');
  const valoracion = JSON.parse(readFileSync(join(DIR, 'valoracion_vinculoreal.json'), 'utf-8'));

  let escritas = 0, saltadas = 0;
  for (const r of valoracion) {
    if (r.estado !== 'evidencia_precisa') continue;
    if (!r.rutaFicha) { console.log(`SIN RUTA  ${r.nombre} -- no se encontró su fichero real, se salta.`); continue; }
    const rutaCompleta = join(RUTA_VAULT, r.rutaFicha);
    const texto = readFileSync(rutaCompleta, 'utf-8');
    if (texto.includes('## Vínculo real') || texto.includes('## Vinculo real')) { saltadas++; console.log(`YA TIENE  ${r.rutaFicha}`); continue; }

    const bloque = construirBloque(r.hits);
    if (!bloque.includes('- ')) { console.log(`SIN EVIDENCIA UTIL TRAS FILTRAR  ${r.rutaFicha} -- se salta (solo tenía appsscript/recurso duplicado).`); continue; }
    console.log(`${aplicar ? 'AÑADIR' : 'DRY-RUN AÑADIR'}  ${r.rutaFicha}`);
    for (const linea of bloque.split('\n')) if (linea.trim()) console.log('    ' + linea);
    escritas++;

    if (aplicar) {
      writeFileSync(rutaCompleta, texto.replace(/\n+$/, '\n') + bloque, 'utf-8');
    }
  }

  console.log(`\n=== Resultado ===`);
  console.log(`${escritas} ficha(s) ${aplicar ? 'escritas de verdad' : 'listas para escribir'}, ${saltadas} ya tenían la sección.`);
  if (!aplicar) console.log('(DRY-RUN -- añade --aplicar para escribir de verdad en la bóveda.)');
}

main();
