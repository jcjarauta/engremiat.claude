#!/usr/bin/env node

/**
 * Genera src/PackageMapEmbebido.js a partir de tools/packager/package-map.json,
 * para que Apps Script (Fase 3 -- Aprovisionamiento, ver AprovisionamientoService.js)
 * pueda resolver el cierre de módulos y qué ficheros de package A pertenecen a
 * cada módulo, sin depender de Node en tiempo de ejecución.
 *
 * Solo se vuelca lo que el generador de envoltorios embebido necesita
 * (moduleDependencies + path/package/module de cada entrada). Se omiten
 * deliberadamente expectedSha256/reason/required/mixed/category: no aportan
 * nada a la generación de envoltorios y expectedSha256 en concreto sería
 * autorreferencial (el hash de este mismo fichero generado cambiaría cada
 * vez que se regenerase, invalidando el valor que acaba de escribir).
 *
 * Regenerar cada vez que package-map.json cambie:
 *   node tools/packager/generate-package-map-embebido.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1'));
const PROJECT_ROOT = path.resolve(HERE, '..', '..');
const MAP_PATH = path.join(PROJECT_ROOT, 'tools', 'packager', 'package-map.json');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'src', 'PackageMapEmbebido.js');

function main() {
  const map = JSON.parse(readFileSync(MAP_PATH, 'utf8'));

  const entries = map.entries
    .filter((entry) => entry.package === 'A')
    .map((entry) => ({ path: entry.path, module: entry.module }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  const embebido = {
    moduleDependencies: map.moduleDependencies,
    entriesPackageA: entries,
  };

  const contenido = [
    '/**',
    ' * Generado por tools/packager/generate-package-map-embebido.mjs -- NO editar a mano.',
    ' * Copia recortada de tools/packager/package-map.json (solo moduleDependencies y',
    ' * las entradas de package A con su módulo) para que GeneradorEnvoltoriosEmbebido.js',
    ' * pueda resolver módulos sin depender de Node en tiempo de ejecución.',
    ' * Ver AprovisionamientoService.js (Fase 3 -- Aprovisionamiento).',
    ' */',
    `var PACKAGE_MAP_EMBEBIDO = ${JSON.stringify(embebido, null, 2)};`,
    '',
  ].join('\n');

  writeFileSync(OUTPUT_PATH, contenido, 'utf8');
  console.log('OK escrito ' + OUTPUT_PATH + ' entradas_package_a=' + entries.length);
}

main();
