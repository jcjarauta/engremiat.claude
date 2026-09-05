#!/usr/bin/env node
/*
 * Orquestador real (§8.93, TAR-0005) -- ejecuta todos los extractores reales conocidos
 * de graphify_visor en un solo comando, en vez de recordar y lanzar cada
 * mapear_grafo_X.mjs a mano. Cada uno escribe su propio grafo_X.json + su ficha
 * (ficha_grafo.mjs) -- este script no calcula nada, solo los invoca en orden.
 *
 * Deliberadamente NO incluye el pipeline de censo (analizar_entidades_reales.mjs /
 * consolidar_censo.mjs) -- ese tiene efectos reales de escritura en el vault (crea
 * fichas nuevas, S8.44) y pasadas manuales sucesivas, no es un extractor puro de solo
 * lectura seguro de re-ejecutar sin supervision. Tampoco incluye graphify (tools/graphify/,
 * pipeline externo de Apps Script) ni el generador de resumen_universo.html (curado a
 * mano). Ver grafos.html -- seccion "Histórico" explica por que cada uno se queda fuera.
 *
 * Uso: node regenerar_grafos.mjs [--desplegar]
 *   --desplegar tambien llama a desplegar_visor.mjs al final (copia+recrea+verifica
 *   en el VPS real). Sin el flag, solo regenera los ficheros locales -- util para
 *   revisar el resultado antes de subirlo.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const RUTA_FICHAS_LOCAL = join(DIR_VISOR, 'fichas_grafos.json');
const URL_FICHAS_VIVAS = 'http://100.107.171.88:9320/fichas_grafos.json';

// §8.94: /api/promover_grafo escribe en vivo en el VPS -- si esta regeneracion local
// corre despues (por ejemplo la tarea programada de manana 08:15) sin haber traido esa
// promocion de vuelta, la sobrescribiria al desplegar (el extractor solo toca su propia
// clave, pero el fichero local nunca tuvo la clave promovida en primer lugar). Se trae la
// version viva ANTES de que corra ningun extractor y se fusiona -- las claves promovidas
// a mano nunca se pisan, las de los extractores se refrescan igual que siempre.
async function fusionarFichasVivasAntesDeRegenerar() {
  try {
    const r = await fetch(URL_FICHAS_VIVAS, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return;
    const vivo = await r.json();
    const local = existsSync(RUTA_FICHAS_LOCAL) ? JSON.parse(readFileSync(RUTA_FICHAS_LOCAL, 'utf-8')) : { fichas: {} };
    const fusionado = { fichas: { ...vivo.fichas, ...local.fichas } }; // local gana solo si ya tenia la misma clave (se refrescara igual)
    writeFileSync(RUTA_FICHAS_LOCAL, JSON.stringify(fusionado, null, 2), 'utf-8');
    console.log('Fichas vivas del VPS fusionadas antes de regenerar (protege promociones manuales recientes).');
  } catch {
    console.log('(no se pudo traer fichas_grafos.json vivo del VPS -- se sigue solo con el local)');
  }
}

// Cada entrada real: [script, args reales]. Orden sin importancia -- son independientes.
const EXTRACTORES_REALES = [
  ['mapear_grafo_node.mjs', []],
  ['mapear_grafo_n8n.mjs', []],
  ['mapear_grafo_visor.mjs', []],
  ['cargar_grafo_holon.mjs', []],
  ['extraer_anatomia_entidad.mjs', []],
  ['mapear_grafo_por_tipo.mjs', ['--tipo', 'recurso']],
  ['mapear_grafo_por_tipo.mjs', ['--tipo', 'modulo']],
  ['mapear_grafo_por_tipo.mjs', ['--tipo', 'regla']],
];

async function main() {
  const desplegar = process.argv.includes('--desplegar');
  let ok = 0, fallos = 0;

  await fusionarFichasVivasAntesDeRegenerar();

  for (const [script, args] of EXTRACTORES_REALES) {
    try {
      console.log(`\n=== ${script} ${args.join(' ')} ===`);
      execFileSync('node', [script, ...args], { cwd: DIR_VISOR, stdio: 'inherit' });
      ok++;
    } catch (e) {
      console.error(`FALLO real en ${script}: ${e.message}`);
      fallos++;
    }
  }

  console.log(`\n=== Resumen: ${ok} extractores reales OK, ${fallos} con fallo ===`);

  if (desplegar) {
    console.log('\n=== Desplegando al VPS real (desplegar_visor.mjs) ===');
    execFileSync('node', ['desplegar_visor.mjs'], { cwd: DIR_VISOR, stdio: 'inherit' });
  }

  if (fallos > 0) process.exitCode = 1;
}

main();
