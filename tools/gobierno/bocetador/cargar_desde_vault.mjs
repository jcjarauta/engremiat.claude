#!/usr/bin/env node
/*
 * Recorre la boveda real de Obsidian y construye el paquete de datos que
 * el Bocetador carga como "Universo real" -- en vez del puñado de
 * Espacios/Relaciones a mano que traia el prototipo inicial (ver
 * PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md §8.6).
 *
 * No inventa vocabulario nuevo: el `tipo:` de cada ficha y el
 * `tipo_relacion:` de cada relacion en 07_Holon_Relaciones/ YA SON el
 * vocabulario real, mas rico que el que se invento para el primer
 * prototipo a partir de solo 3 aristas del canvas -- este script lo
 * reemplaza por la fuente de verdad real.
 *
 * Carpetas incluidas (estructurales, cajas y flechas reales):
 *   01_Mundo/Espacios/    -> tipo: espacio
 *   01_Mundo/Recursos/    -> tipo: recurso
 *   01_Mundo/Modulos/**    -> tipo: modulo (incluye CORE/, Modulos_acoplables/)
 *   02_Personajes/**       -> tipo: personaje (incluye Acervos/, Verificadores/)
 *   08_Oficios/            -> tipo: oficio
 *   03_Reglas/             -> tipo: regla
 *   07_Holon_Relaciones/   -> tipo: relacion (tipo_relacion + origen + destino)
 *
 * Carpetas excluidas a proposito (narrativa/registro, no estructura):
 *   04_Cronologia/, 05_Sesiones/, 06_Hilos_Abiertos/, 00_Nucleo/ (ya
 *   tiene su propio canvas), ARCHIVO_HISTORICO/.
 *
 * Uso: node cargar_desde_vault.mjs [--salida <ruta.json>]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RUTA_VAULT = 'G:\\Mi unidad\\engremiat.claude\\Obsidian-Engremiat\\Universos\\Engremiat';
const SALIDA_POR_DEFECTO = join(import.meta.dirname, 'universo_real.json');

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

function extraerRelaciones(cuerpo) {
  const seccion = cuerpo.match(/## Relaciones\s*\n([\s\S]*?)(\n##|\n?$)/);
  if (!seccion) return [];
  return [...seccion[1].matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1]);
}

function extraerResumen(cuerpo) {
  const antesDeRelaciones = cuerpo.split(/## Relaciones/)[0];
  const parrafo = antesDeRelaciones.split(/\n\s*\n/).map(p => p.trim()).find(p => p && !p.startsWith('#') && !p.startsWith('-'));
  if (!parrafo) return '';
  return parrafo.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1').slice(0, 400);
}

function cargarNodos(carpeta, tipo) {
  const nodos = [];
  for (const ruta of listarMd(carpeta)) {
    const texto = readFileSync(ruta, 'utf-8');
    const { fm, cuerpo } = parsearFrontmatter(texto);
    const nombre = fm.title || ruta.split(/[\\/]/).pop().replace('.md', '');
    nodos.push({
      id: slug(nombre),
      nombre,
      tipo,
      estado: fm.estado || 'desconocido',
      resumen: extraerResumen(cuerpo),
      relacionesDeclaradas: extraerRelaciones(cuerpo),
    });
  }
  return nodos;
}

function cargarRelaciones(carpeta) {
  const relaciones = [];
  for (const ruta of listarMd(carpeta)) {
    const texto = readFileSync(ruta, 'utf-8');
    const { fm } = parsearFrontmatter(texto);
    const nombreFichero = ruta.split(/[\\/]/).pop().replace('.md', '');
    const origen = (fm.origen || '').replace(/^\[\[|\]\]$/g, '');
    const tipoRelacion = fm.tipo_relacion || '';
    let destino = nombreFichero;
    if (origen) destino = destino.replace(new RegExp('^' + origen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*'), '');
    if (tipoRelacion) destino = destino.replace(new RegExp('^' + tipoRelacion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*'), '');
    relaciones.push({
      id: slug(nombreFichero),
      origenId: slug(origen),
      origenNombre: origen,
      destinoId: slug(destino),
      destinoNombre: destino.trim(),
      tipo: tipoRelacion,
      estado: fm.estado || 'desconocido',
    });
  }
  return relaciones;
}

function main() {
  const { salida } = leerArgs();

  const espacios = cargarNodos(join(RUTA_VAULT, '01_Mundo', 'Espacios'), 'espacio');
  const recursos = cargarNodos(join(RUTA_VAULT, '01_Mundo', 'Recursos'), 'recurso');
  const modulos = cargarNodos(join(RUTA_VAULT, '01_Mundo', 'Modulos'), 'modulo');
  const personajes = cargarNodos(join(RUTA_VAULT, '02_Personajes'), 'personaje');
  const oficios = cargarNodos(join(RUTA_VAULT, '08_Oficios'), 'oficio');
  const reglas = cargarNodos(join(RUTA_VAULT, '03_Reglas'), 'regla');
  const relaciones = cargarRelaciones(join(RUTA_VAULT, '07_Holon_Relaciones'));

  const tiposRelacionReales = [...new Set(relaciones.map(r => r.tipo).filter(Boolean))].sort();

  const paquete = { generadoEn: new Date().toISOString(), espacios, recursos, modulos, personajes, oficios, reglas, relaciones, tiposRelacionReales };
  writeFileSync(salida, JSON.stringify(paquete, null, 2), 'utf-8');

  console.log('=== Universo real cargado desde la bóveda ===');
  console.log(`${espacios.length} Espacios, ${recursos.length} Recursos, ${modulos.length} Módulos, ${personajes.length} Personajes, ${oficios.length} Oficios, ${reglas.length} Reglas, ${relaciones.length} Relaciones.`);
  console.log('Tipos de relación reales encontrados: ' + tiposRelacionReales.join(', '));
  console.log('Escrito en: ' + salida);
}

main();
