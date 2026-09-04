#!/usr/bin/env node
/*
 * El grafo real del Holon (§8.33): quien hace que con quien, donde --
 * las aristas reales de 07_Holon_Relaciones/ (opera_en/depende_de/
 * gobierna_a/activa_a/verifica_a/corrige_a/alimenta_a/parte_de), ya
 * parseadas por cargar_grafo_wikilinks.mjs pero mezcladas ahi con los
 * wikilinks narrativos sueltos. Este script las separa y anade el campo
 * real "equipo" de cada Personaje (frontmatter, §8.33) como agrupacion
 * visual real, nunca inventada.
 *
 * Uso: node cargar_grafo_holon.mjs [--salida <ruta.json>]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { actualizarFichaGrafo } from './ficha_grafo.mjs';

const DIR = import.meta.dirname;
const RUTA_VAULT = 'G:\\Mi unidad\\engremiat.claude\\Obsidian-Engremiat\\Universos\\Engremiat';

function leerArgs() {
  const args = process.argv.slice(2);
  let salida = join(DIR, 'grafo_holon.json');
  for (let i = 0; i < args.length; i++) if (args[i] === '--salida') salida = args[++i];
  return { salida };
}

function slug(t) { return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }

function listarMd(ruta) {
  const out = [];
  for (const nombre of readdirSync(ruta)) {
    if (nombre === 'desktop.ini') continue;
    const completa = join(ruta, nombre);
    if (statSync(completa).isDirectory()) out.push(...listarMd(completa));
    else if (nombre.endsWith('.md')) out.push(completa);
  }
  return out;
}

function main() {
  const { salida } = leerArgs();
  const wikilinks = JSON.parse(readFileSync(join(DIR, 'grafo_wikilinks.json'), 'utf-8'));

  // Aristas reales de relacion -- todo lo que no es un [[wikilink]] narrativo suelto.
  const aristas = wikilinks.aristas.filter(a => a.relation !== 'wikilink');
  const idsUsados = new Set(aristas.flatMap(a => [a.source, a.target]));

  // Equipo real + tipo real por nodo, leido del frontmatter de la boveda.
  const equipoPorSlug = new Map();
  const tipoPorSlug = new Map();
  for (const ruta of listarMd(RUTA_VAULT)) {
    const texto = readFileSync(ruta, 'utf-8');
    const tm = texto.match(/^title:\s*(.+)$/m);
    const em = texto.match(/^equipo:\s*(.+)$/m);
    const tpm = texto.match(/^tipo:\s*(.+)$/m);
    if (!tm) continue;
    const s = slug(tm[1].trim());
    if (em) equipoPorSlug.set(s, em[1].trim());
    if (tpm) tipoPorSlug.set(s, tpm[1].trim());
  }

  const nodos = wikilinks.nodos
    .filter(n => idsUsados.has(n.id))
    .map(n => ({
      id: n.id,
      nombre: n.nombre,
      tipo: tipoPorSlug.get(n.id) || n.tipo,
      equipo: equipoPorSlug.get(n.id) || null,
      esFicheroReal: n.esFicheroReal,
    }));

  const paquete = { generadoEn: new Date().toISOString(), nodos, aristas };
  writeFileSync(salida, JSON.stringify(paquete, null, 2), 'utf-8');

  actualizarFichaGrafo({
    rutaGrafo: salida,
    id: 'holon',
    nombre: 'Holon -- quién hace qué, con quién',
    tipo: 'Personaje',
    espacioReal: null,
    descripcion: 'Grafo completo de relaciones reales entre Personajes (opera_en/depende_de/gobierna_a/verifica_a...), coloreado por equipo real.',
    extractor: 'cargar_grafo_holon.mjs',
    pagina: 'holon.html',
    contadores: { nodos: nodos.length, aristas: aristas.length },
  });

  const porTipoRelacion = {};
  for (const a of aristas) porTipoRelacion[a.relation] = (porTipoRelacion[a.relation] || 0) + 1;
  console.log('=== Grafo real del Holon ===');
  console.log(`${nodos.length} nodos, ${aristas.length} aristas reales.`);
  console.log('Por tipo de relación:', JSON.stringify(porTipoRelacion));
  const conEquipo = nodos.filter(n => n.equipo).length;
  console.log(`${conEquipo} de ${nodos.length} nodos con "equipo" real declarado.`);
  console.log('Escrito en: ' + salida);
}

main();
