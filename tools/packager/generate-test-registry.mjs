#!/usr/bin/env node

/**
 * Genera src/RegistroPruebasReactivas.js a partir de las funciones
 * probar-o-prueba declaradas en src/Tests_(nombre).js -- ver "asesor
 * técnico, runner mínimo para las pruebas reactivas": 346 pruebas manuales
 * (una por una desde el editor de Apps Script, sin forma de ejecutarlas
 * todas ni de ver qué falló sin abrir cada función). El registro generado
 * alimenta EjecutorPruebasReactivas.js (ejecutarTodasLasPruebasReactivas),
 * que sí vive a mano porque es lógica de ejecución, no un volcado de datos.
 *
 * Transcribir 346 nombres a mano es exactamente el tipo de error que este
 * generador evita: se deriva del código fuente real, igual que
 * generate-package-map-embebido.mjs deriva de package-map.json.
 *
 * Regenerar cada vez que se añada, elimine o renombre una función de
 * prueba en cualquier fichero Tests_:
 *   node tools/packager/generate-test-registry.mjs
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { maskCommentsOnly } from './generate-shell-wrappers.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1'));
const PROJECT_ROOT = path.resolve(HERE, '..', '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const OUTPUT_PATH = path.join(SRC_DIR, 'RegistroPruebasReactivas.js');

const FUNCTION_DECLARATION_RE = /^function\s+((?:probar|prueba)[A-Za-z0-9_]*)\s*\(/;

function extractTestFunctionNames(sourceText) {
  const masked = maskCommentsOnly(sourceText);
  const lines = masked.split('\n');
  const names = [];
  for (const line of lines) {
    const match = FUNCTION_DECLARATION_RE.exec(line.trimStart());
    if (match) names.push(match[1]);
  }
  return names;
}

function compareCanonicalPaths(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function main() {
  const archivos = readdirSync(SRC_DIR)
    .filter((name) => /^Tests_.*\.js$/u.test(name))
    .sort(compareCanonicalPaths);

  const entradas = [];
  for (const archivo of archivos) {
    const sourceText = readFileSync(path.join(SRC_DIR, archivo), 'utf8');
    const nombres = extractTestFunctionNames(sourceText);
    for (const funcion of nombres) entradas.push({ archivo, funcion });
  }

  entradas.sort((left, right) => compareCanonicalPaths(left.archivo, right.archivo) || compareCanonicalPaths(left.funcion, right.funcion));

  const vistos = new Map();
  for (const entrada of entradas) {
    if (vistos.has(entrada.funcion)) {
      throw new Error(`NOMBRE_DUPLICADO: ${entrada.funcion} en ${entrada.archivo} y ${vistos.get(entrada.funcion)}`);
    }
    vistos.set(entrada.funcion, entrada.archivo);
  }

  const lineasEntradas = entradas
    .map((entrada) => `  { archivo: ${JSON.stringify(entrada.archivo)}, funcion: ${JSON.stringify(entrada.funcion)} }`)
    .join(',\n');

  const contenido = `/**
 * Generado automáticamente por tools/packager/generate-test-registry.mjs
 * a partir de las funciones probar-o-prueba declaradas en los ficheros
 * Tests_ de src/. No editar a mano -- regenerar tras cualquier cambio:
 *   node tools/packager/generate-test-registry.mjs
 *
 * Consumido por EjecutorPruebasReactivas.js (ejecutarTodasLasPruebasReactivas).
 */
var REGISTRO_PRUEBAS_REACTIVAS_ = [
${lineasEntradas}
];
`;

  writeFileSync(OUTPUT_PATH, contenido);
  console.log(`OK escrito ${OUTPUT_PATH} entradas=${entradas.length} archivos=${archivos.length}`);
}

main();
