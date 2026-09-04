#!/usr/bin/env node
/*
 * Segunda vista real del grafo de Engremiat (ver PROPUESTA_BASTIDOR_
 * GESTOR_PROYECTOS_ENGREMIAT.md §8.16-17): Graphify solo cubre el Apps
 * Script (src/) -- esta es la capa que faltaba, los 39 scripts reales
 * de Node en tools/. Distinto motor a proposito: Apps Script no tiene
 * import/export real (por eso Graphify necesita un concat + AST), los
 * .mjs de aqui SI son modulos ES reales -- un regex sobre "import ...
 * from" es suficiente y honesto, no hace falta el mismo aparato.
 *
 * Para cada fichero real:
 *   - imports reales (relativos = arista interna; paquete = dependencia externa)
 *   - toques reales a Sheet/Baserow/Vault, detectados por patron de texto
 *     conocido (URL real de Sheets API, nombre real BASEROW_*, ruta real
 *     del vault) -- nunca inventado, solo lo que el propio fichero dice.
 *   - que_hace real, tomado de tools/registro_ecosistema.json cuando existe
 *     (no se reinventa una descripcion, se reutiliza la que ya hay).
 *   - relaciones REALES por fichero de datos (2026-09-03, corregido tras
 *     encontrar que la mayoria de estos scripts no se hablan por import,
 *     se hablan escribiendo/leyendo un .json que otro genera -- ej.
 *     cargar_estructura_sheet.mjs escribe estructura_sheet.json, que
 *     encontrar_huecos.mjs lee. Cada nombre de .json referenciado en el
 *     codigo real se convierte en su propio nodo "dato", con arista
 *     escribe/lee segun este en la misma linea que writeFileSync/
 *     readFileSync -- nunca inventado, solo lo que el propio texto dice.
 *
 *   - relaciones REALES por recurso compartido (2026-09-03, corregido tras
 *     ver el grafo demasiado desligado): dos scripts que tocan la MISMA
 *     pestana real del Sheet (nombre real, leido de estructura_sheet.json
 *     ya generado por cargar_estructura_sheet.mjs) o la misma tabla real
 *     de Baserow quedan conectados a un nodo de recurso compartido -- no
 *     se hablan por codigo, pero operan sobre el mismo dato real.
 *
 * Solo lectura -- no toca ningun fichero real.
 * Uso: node mapear_grafo_node.mjs [--salida <ruta.json>]
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { actualizarFichaGrafo } from './ficha_grafo.mjs';

const RAIZ_REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DIR_TOOLS = join(RAIZ_REPO, 'tools');
const SALIDA_POR_DEFECTO = join(dirname(fileURLToPath(import.meta.url)), 'grafo_node.json');

function leerArgs() {
  const args = process.argv.slice(2);
  let salida = SALIDA_POR_DEFECTO;
  for (let i = 0; i < args.length; i++) if (args[i] === '--salida') salida = args[++i];
  return { salida };
}

function listarMjs(ruta) {
  const out = [];
  for (const nombre of readdirSync(ruta)) {
    if (nombre === 'node_modules' || nombre.startsWith('.')) continue;
    const completa = join(ruta, nombre);
    if (statSync(completa).isDirectory()) out.push(...listarMjs(completa));
    else if (extname(nombre) === '.mjs') out.push(completa);
  }
  return out;
}

function idDe(rutaRelativa) {
  return rutaRelativa.replace(/\\/g, '/');
}

function main() {
  const { salida } = leerArgs();
  const registro = JSON.parse(readFileSync(join(RAIZ_REPO, 'tools', 'registro_ecosistema.json'), 'utf-8'));
  const queHacePorFichero = {};
  for (const grupo of Object.values(registro).filter(Array.isArray)) {
    for (const e of grupo) if (e.fichero) queHacePorFichero[e.fichero.replace(/\/$/, '')] = e.que_hace || e.que_compara || e.que_muestra || '';
  }

  // Vocabulario real de recursos compartidos -- nombres reales de pestanas
  // del Sheet y tablas de Baserow, leidos de lo que ya generaron
  // cargar_estructura_sheet.mjs / cargar_estructura_baserow.mjs (bocetador/).
  // Si no existen todavia, se sigue sin este cruce -- nunca inventado.
  const DIR_BOCETADOR = join(RAIZ_REPO, 'tools', 'gobierno', 'bocetador');
  let nombresRecursoReal = [];
  try {
    const est = JSON.parse(readFileSync(join(DIR_BOCETADOR, 'estructura_sheet.json'), 'utf-8'));
    nombresRecursoReal.push(...est.tabs.filter((t) => t.tipo === 'negocio').map((t) => t.nombre));
  } catch { /* estructura_sheet.json opcional */ }
  try {
    const est = JSON.parse(readFileSync(join(DIR_BOCETADOR, 'estructura_baserow.json'), 'utf-8'));
    nombresRecursoReal.push(...est.tablas.map((t) => t.nombre));
  } catch { /* estructura_baserow.json opcional */ }
  nombresRecursoReal = nombresRecursoReal.filter((n) => n.length >= 4); // evita falsos positivos con nombres muy cortos

  const ficheros = listarMjs(DIR_TOOLS);
  const nodos = [];
  const aristas = [];
  const idsReales = new Set(ficheros.map((f) => idDe(relative(RAIZ_REPO, f))));
  const nodosDatoVistos = new Map(); // nombre.json -> {id, tipo:'dato', escritoPor:[], leidoPor:[]}
  const nodosRecursoVistos = new Map(); // nombre -> {id, tipo:'recurso_real'}

  function nodoRecurso(nombre) {
    if (!nodosRecursoVistos.has(nombre)) {
      nodosRecursoVistos.set(nombre, { id: 'recurso:' + nombre, nombre, tipo: 'recurso_real' });
    }
    return nodosRecursoVistos.get(nombre).id;
  }

  function nodoDato(nombreJson) {
    if (!nodosDatoVistos.has(nombreJson)) {
      nodosDatoVistos.set(nombreJson, { id: 'dato:' + nombreJson, nombre: nombreJson, tipo: 'dato' });
    }
    return nodosDatoVistos.get(nombreJson).id;
  }

  for (const rutaAbs of ficheros) {
    const rutaRel = idDe(relative(RAIZ_REPO, rutaAbs));
    const texto = readFileSync(rutaAbs, 'utf-8');

    const tocaSheet = /sheets\.googleapis\.com|SpreadsheetApp/.test(texto);
    const tocaBaserow = /BASEROW|baserow/.test(texto);
    const tocaVault = /Obsidian-Engremiat|engremiat\.claude\\Obsidian/.test(texto);
    const tocaVps = /100\.107\.171\.88|ssh.*hetzner/.test(texto);

    const queHace = queHacePorFichero[rutaRel] || queHacePorFichero['tools/' + rutaRel.split('/').slice(1).join('/')] || '';

    nodos.push({
      id: rutaRel,
      nombre: rutaRel.split('/').pop(),
      carpeta: dirname(rutaRel),
      tipo: 'script',
      tocaSheet, tocaBaserow, tocaVault, tocaVps,
      queHace,
    });

    const imports = [...texto.matchAll(/^import\s+.*?\s+from\s+['"]([^'"]+)['"];?/gm)].map((m) => m[1]);
    for (const origen of imports) {
      if (!origen.startsWith('.')) continue; // paquete externo (node:fs, ajv...) -- no es arista interna real
      const resuelto = idDe(relative(RAIZ_REPO, join(dirname(rutaAbs), origen)));
      if (idsReales.has(resuelto)) aristas.push({ source: rutaRel, target: resuelto, relation: 'import' });
    }

    // Relaciones reales por fichero de datos. Paso 1, preciso: la misma
    // linea tiene el nombre del .json Y writeFileSync/readFileSync -- caso
    // mas fiable. Paso 2, respaldo real necesario (encontrado 2026-09-03
    // al ver el grafo con huerfanos que no debian serlo: validar_b0.mjs
    // y el propio mapear_grafo_n8n.mjs guardan el nombre en un array
    // aparte, ej. const FICHEROS = ['01_x.json',...], y leen con una
    // variable en otra linea -- si el nombre aparece en CUALQUIER parte
    // del fichero y el fichero usa write/readFileSync al menos una vez,
    // se cuenta igual, marcado 'debil' para diferenciarlo del caso preciso.
    const nombresJsonEnFichero = new Set([...texto.matchAll(/['"`]([A-Za-z0-9_\-.]+\.json)['"`]/g)].map((m) => m[1]));
    const nombresYaLigados = new Set();
    for (const linea of texto.split('\n')) {
      const nombresJson = [...linea.matchAll(/['"`]([A-Za-z0-9_\-.]+\.json)['"`]/g)].map((m) => m[1]);
      for (const nombreJson of nombresJson) {
        const idDato = nodoDato(nombreJson);
        if (/writeFileSync/.test(linea)) { aristas.push({ source: rutaRel, target: idDato, relation: 'escribe' }); nombresYaLigados.add(nombreJson); }
        else if (/readFileSync/.test(linea)) { aristas.push({ source: idDato, target: rutaRel, relation: 'lee' }); nombresYaLigados.add(nombreJson); }
      }
    }
    const tieneWrite = /writeFileSync/.test(texto);
    const tieneRead = /readFileSync/.test(texto);
    for (const nombreJson of nombresJsonEnFichero) {
      if (nombresYaLigados.has(nombreJson) || !(tieneWrite || tieneRead)) continue;
      const idDato = nodoDato(nombreJson);
      if (tieneWrite) aristas.push({ source: rutaRel, target: idDato, relation: 'escribe_debil' });
      else if (tieneRead) aristas.push({ source: idDato, target: rutaRel, relation: 'lee_debil' });
    }

    // Relaciones reales por recurso compartido -- nombre real de pestana
    // del Sheet o tabla de Baserow mencionado en el propio texto.
    for (const nombreRecurso of nombresRecursoReal) {
      if (texto.includes(nombreRecurso)) aristas.push({ source: rutaRel, target: nodoRecurso(nombreRecurso), relation: 'toca_recurso' });
    }
  }

  for (const n of nodosDatoVistos.values()) nodos.push(n);
  for (const n of nodosRecursoVistos.values()) nodos.push(n);

  const paquete = { generadoEn: new Date().toISOString(), nodos, aristas };
  writeFileSync(salida, JSON.stringify(paquete, null, 2), 'utf-8');

  actualizarFichaGrafo({
    rutaGrafo: salida,
    id: 'nodejs',
    nombre: 'Capa Node (tools/)',
    tipo: 'Herramienta',
    espacioReal: null,
    descripcion: 'Scripts reales de tools/ -- imports, ficheros de datos y recursos reales compartidos (Sheet+Baserow) entre ellos.',
    extractor: 'mapear_grafo_node.mjs',
    pagina: 'nodejs.html',
    contadores: { nodos: nodos.length, aristas: aristas.length, scripts: nodos.filter((n) => n.tipo === 'script').length },
  });

  console.log('=== Grafo real de la capa Node (tools/) ===');
  console.log(`${nodos.filter(n => n.tipo === 'script').length} scripts reales, ${nodosDatoVistos.size} ficheros de datos, ${nodosRecursoVistos.size} recursos reales compartidos (Sheet+Baserow), ${aristas.length} aristas reales.`);
  console.log(`Tocan Sheet: ${nodos.filter(n => n.tocaSheet).length} · Baserow: ${nodos.filter(n => n.tocaBaserow).length} · Vault: ${nodos.filter(n => n.tocaVault).length} · VPS: ${nodos.filter(n => n.tocaVps).length}`);
  console.log('Escrito en: ' + salida);
}

main();
