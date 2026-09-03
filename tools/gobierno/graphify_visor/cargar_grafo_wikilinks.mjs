#!/usr/bin/env node
/*
 * El octavo grafo que faltaba (ver PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md
 * §8.23): extrae TODOS los [[wikilinks]] reales escritos a mano en TODA la
 * boveda de Obsidian -- las 9 carpetas, sin excluir las narrativas esta vez
 * (04_Cronologia, 05_Sesiones, 06_Hilos_Abiertos, 00_Nucleo,
 * ARCHIVO_HISTORICO) porque el objetivo de este grafo no es alimentar el
 * Bocetador con estructura (eso ya lo hace cargar_desde_vault.mjs) sino
 * dar al censo de entidades (analizar_entidades_reales.mjs) el indicio mas
 * directo que existe hoy de "que se relaciona con que" -- el vinculo ya
 * declarado a mano por el operador en el texto real de cada ficha, en
 * cualquier seccion, no solo en "## Relaciones".
 *
 * Cada fichero .md real es un nodo. Cada [[wikilink]] real dentro de su
 * texto es una arista hacia el nombre enlazado -- exista o no todavia como
 * fichero (un enlace roto/aspiracional es tambien un dato real: alguien
 * escribio esa intencion).
 *
 * Uso: node cargar_grafo_wikilinks.mjs [--salida <ruta.json>]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RUTA_VAULT = 'G:\\Mi unidad\\engremiat.claude\\Obsidian-Engremiat\\Universos\\Engremiat';
const SALIDA_POR_DEFECTO = join(import.meta.dirname, 'grafo_wikilinks.json');

function leerArgs() {
  const args = process.argv.slice(2);
  let salida = SALIDA_POR_DEFECTO;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--salida') salida = args[++i];
  }
  return { salida };
}

function slug(texto) {
  return texto.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

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

function parsearFrontmatter(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { fm: {}, cuerpo: texto };
  const fm = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const mm = linea.match(/^(\w+):\s*(.*)$/);
    if (mm) fm[mm[1]] = mm[2].trim().replace(/^"|"$/g, '');
  }
  return { fm, cuerpo: texto.slice(m[0].length) };
}

function carpetaRelativa(rutaCompleta) {
  return rutaCompleta.replace(RUTA_VAULT + '\\', '').split('\\').slice(0, -1).join('/');
}

function main() {
  const { salida } = leerArgs();

  const ficheros = listarMd(RUTA_VAULT);
  const nodosPorId = new Map();
  const aristas = [];

  // Primera pasada: registrar cada fichero real como nodo -- EXCEPTO las
  // fichas de 07_Holon_Relaciones (tipo: relacion), que no son entidades:
  // son la relacion misma, ya representada como arista mas abajo. Contarlas
  // como nodos infla artificialmente la "centralidad" real de las dos
  // entidades que unen y las mete al censo como si fueran una entidad mas.
  for (const ruta of ficheros) {
    const texto = readFileSync(ruta, 'utf-8');
    const { fm } = parsearFrontmatter(texto);
    if (fm.tipo === 'relacion') continue;
    const nombreFichero = ruta.split(/[\\/]/).pop().replace('.md', '');
    const nombre = fm.title || nombreFichero;
    const id = slug(nombre);
    nodosPorId.set(id, {
      id, nombre, tipo: fm.tipo || 'sin_tipo',
      carpeta: carpetaRelativa(ruta),
      esFicheroReal: true,
    });
  }

  // Segunda pasada: aristas reales.
  //  - Fichas normales: TODOS los [[wikilinks]] del cuerpo entero (no solo
  //    "## Relaciones") -- relation: 'wikilink'.
  //  - Fichas de 07_Holon_Relaciones: UNA arista directa origen->destino
  //    con el tipo_relacion real (activa_a/depende_de/gobierna_a/...),
  //    reusando el mismo parseo que cargar_desde_vault.mjs ya usa --
  //    conecta las dos entidades reales sin pasar por la ficha-relacion
  //    como si fuera un tercer nodo.
  for (const ruta of ficheros) {
    const texto = readFileSync(ruta, 'utf-8');
    const { fm, cuerpo } = parsearFrontmatter(texto);
    const nombreFichero = ruta.split(/[\\/]/).pop().replace('.md', '');

    if (fm.tipo === 'relacion') {
      const origen = (fm.origen || '').replace(/^\[\[|\]\]$/g, '');
      const tipoRelacion = fm.tipo_relacion || 'relacionado_con';
      if (!origen) continue;

      // Bug real encontrado: cuando una relacion tiene varios destinos
      // (p.ej. "Concilio depende_de 7 Acervos-o-mecanismos.md"), el nombre
      // del fichero solo trae un resumen ("7 Acervos-o-mecanismos"), no los
      // 7 destinos reales -- que SI estan, como wikilinks reales, en el
      // encabezado del cuerpo ("# [[Concilio]] depende_de [[Acervo
      // Tecnico]], [[Acervo Logico]], ..."). Se leen de ahi: el primer
      // wikilink del cuerpo es el origen (ya lo tenemos por frontmatter,
      // solo se usa para saltarlo), el resto son los destinos reales, uno
      // por arista.
      const wikilinksCuerpo = [...cuerpo.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]+)?(?:#[^\]]+)?\]\]/g)].map(m => m[1].trim());
      const idOrigen = slug(origen);
      const destinosReales = wikilinksCuerpo.filter(w => slug(w) !== idOrigen);

      if (!destinosReales.length) continue; // ficha de relacion sin wikilinks reales en el cuerpo -- no hay arista que sacar
      if (!nodosPorId.has(idOrigen)) nodosPorId.set(idOrigen, { id: idOrigen, nombre: origen, tipo: 'referencia_sin_ficha', carpeta: null, esFicheroReal: false });
      for (const destino of new Set(destinosReales)) {
        const idDestino = slug(destino);
        if (!nodosPorId.has(idDestino)) nodosPorId.set(idDestino, { id: idDestino, nombre: destino, tipo: 'referencia_sin_ficha', carpeta: null, esFicheroReal: false });
        aristas.push({ source: idOrigen, target: idDestino, relation: tipoRelacion });
      }
      continue;
    }

    const nombreOrigen = fm.title || nombreFichero;
    const idOrigen = slug(nombreOrigen);

    const enlaces = [...cuerpo.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]+)?(?:#[^\]]+)?\]\]/g)]
      .map(m => m[1].trim())
      .filter(Boolean);

    for (const nombreDestino of new Set(enlaces)) {
      const idDestino = slug(nombreDestino);
      if (idDestino === idOrigen) continue; // autoenlace, no aporta
      if (!nodosPorId.has(idDestino)) {
        // Enlace real hacia algo que hoy no es (todavia) una ficha propia
        // -- dato real igualmente: una intencion ya escrita a mano.
        nodosPorId.set(idDestino, {
          id: idDestino, nombre: nombreDestino, tipo: 'referencia_sin_ficha',
          carpeta: null, esFicheroReal: false,
        });
      }
      aristas.push({ source: idOrigen, target: idDestino, relation: 'wikilink' });
    }
  }

  const nodos = [...nodosPorId.values()];
  const paquete = {
    generadoEn: new Date().toISOString(),
    fuente: RUTA_VAULT,
    nodos, aristas,
  };
  writeFileSync(salida, JSON.stringify(paquete, null, 2), 'utf-8');

  const reales = nodos.filter(n => n.esFicheroReal).length;
  const soloReferenciadas = nodos.length - reales;
  console.log('=== Grafo de wikilinks reales de la boveda ===');
  console.log(`${ficheros.length} ficheros .md reales recorridos (las 9 carpetas, sin excluir narrativa).`);
  console.log(`${nodos.length} nodos (${reales} fichas reales + ${soloReferenciadas} referenciadas por [[wikilink]] pero sin ficha propia todavia).`);
  console.log(`${aristas.length} aristas [[wikilink]] reales.`);
  console.log('Escrito en: ' + salida);
}

main();
