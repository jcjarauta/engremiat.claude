#!/usr/bin/env node
/*
 * Grafo real del sistema Panel Operativo/Árbol de campañas, con raíz real en
 * home.html (§8.83, PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md). Distinto de
 * grafo_node.json (mapear_grafo_node.mjs) -- ese cubre TODO tools/ a nivel de import
 * entre .mjs; este cubre la capa de interfaz (.html) + el servidor que las sirve +
 * las tablas reales que toca, para dar una "vista inicial del sistema" concreta.
 *
 * Extracción real, sin inventar nada:
 *   - cada .html de graphify_visor -> nodo 'pagina'
 *   - <a href="X.html"> real entre paginas -> arista 'enlaza'
 *   - fetch(URL_MEMORIA + '/api/xxx') real -> arista 'llama_api' hacia un nodo
 *     'endpoint' (uno por ruta real encontrada en el propio texto de la pagina)
 *   - servidor_memoria.mjs -> nodo 'servidor', con arista 'sirve' hacia cada
 *     endpoint real que declara (if (req.url === '/api/xxx'))
 *   - nombres reales de pestañas del Sheet / tablas de Baserow mencionados en
 *     servidor_memoria.mjs (mismo vocabulario real que mapear_grafo_node.mjs, leído
 *     de estructura_sheet.json/estructura_baserow.json ya generados) -> nodo
 *     'recurso_real', arista 'toca'
 *
 * Solo lectura -- no toca ningún fichero real.
 * Uso: node mapear_grafo_visor.mjs [--salida <ruta.json>]
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { actualizarFichaGrafo } from './ficha_grafo.mjs';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const DIR_BOCETADOR = join(DIR_VISOR, '..', 'bocetador');
const SALIDA_POR_DEFECTO = join(DIR_VISOR, 'grafo_visor.json');

function leerArgs() {
  const args = process.argv.slice(2);
  let salida = SALIDA_POR_DEFECTO;
  for (let i = 0; i < args.length; i++) if (args[i] === '--salida') salida = args[++i];
  return { salida };
}

// Mismo vocabulario real ya usado por mapear_grafo_node.mjs -- nunca inventado,
// solo lo que estructura_sheet.json/estructura_baserow.json ya extrajeron de verdad.
function cargarNombresRecursoReal() {
  let nombres = [];
  try {
    const est = JSON.parse(readFileSync(join(DIR_BOCETADOR, 'estructura_sheet.json'), 'utf-8'));
    nombres.push(...est.tabs.filter((t) => t.tipo === 'negocio').map((t) => t.nombre));
  } catch { /* opcional */ }
  try {
    const est = JSON.parse(readFileSync(join(DIR_BOCETADOR, 'estructura_baserow.json'), 'utf-8'));
    nombres.push(...est.tablas.map((t) => t.nombre));
  } catch { /* opcional */ }
  return nombres.filter((n) => n.length >= 4);
}

function main() {
  const { salida } = leerArgs();
  const nombresRecursoReal = cargarNombresRecursoReal();

  const htmls = readdirSync(DIR_VISOR).filter((f) => f.endsWith('.html'));
  const nodos = [];
  const aristas = [];
  const nodosRecursoVistos = new Map();
  const nodosEndpointVistos = new Map();

  const idRecurso = (nombre) => {
    if (!nodosRecursoVistos.has(nombre)) nodosRecursoVistos.set(nombre, { id: 'recurso:' + nombre, nombre, tipo: 'recurso_real' });
    return nodosRecursoVistos.get(nombre).id;
  };
  const idEndpoint = (ruta) => {
    if (!nodosEndpointVistos.has(ruta)) nodosEndpointVistos.set(ruta, { id: 'endpoint:' + ruta, nombre: ruta, tipo: 'endpoint' });
    return nodosEndpointVistos.get(ruta).id;
  };

  const idsHtmlReales = new Set(htmls);

  for (const nombre of htmls) {
    const texto = readFileSync(join(DIR_VISOR, nombre), 'utf-8');
    nodos.push({ id: nombre, nombre, tipo: 'pagina' });

    // Enlaces reales entre paginas -- href="X.html" (relativo, no absoluto)
    const hrefs = [...texto.matchAll(/href=["']([a-zA-Z0-9_\-]+\.html)["']/g)].map((m) => m[1]);
    for (const destino of hrefs) {
      if (idsHtmlReales.has(destino) && destino !== nombre) aristas.push({ source: nombre, target: destino, relation: 'enlaza' });
    }

    // Llamadas reales a la API -- fetch(URL_MEMORIA + '/api/xxx' o `/api/xxx
    const rutasApi = new Set([...texto.matchAll(/\/api\/[a-zA-Z0-9_]+/g)].map((m) => m[0]));
    for (const ruta of rutasApi) aristas.push({ source: nombre, target: idEndpoint(ruta), relation: 'llama_api' });
  }

  // servidor_memoria.mjs -- nodo central, endpoints reales que declara, recursos reales que toca
  const rutaServidor = 'servidor_memoria.mjs';
  const textoServidor = readFileSync(join(DIR_VISOR, rutaServidor), 'utf-8');
  nodos.push({ id: rutaServidor, nombre: rutaServidor, tipo: 'servidor' });

  const endpointsDeclarados = new Set([...textoServidor.matchAll(/req\.url(?:\.startsWith)?\(?\s*===?\s*['"](\/api\/[a-zA-Z0-9_]+)/g)].map((m) => m[1]));
  for (const ruta of endpointsDeclarados) aristas.push({ source: rutaServidor, target: idEndpoint(ruta), relation: 'sirve' });

  for (const nombreRecurso of nombresRecursoReal) {
    if (textoServidor.includes(nombreRecurso)) aristas.push({ source: rutaServidor, target: idRecurso(nombreRecurso), relation: 'toca' });
  }

  for (const n of nodosEndpointVistos.values()) nodos.push(n);
  for (const n of nodosRecursoVistos.values()) nodos.push(n);

  const paquete = { generadoEn: new Date().toISOString(), nodos, aristas };
  writeFileSync(salida, JSON.stringify(paquete, null, 2), 'utf-8');

  // §8.93 (TAR-0008): ficha dinamica real -- documenta este grafo Y alimenta la deteccion
  // de candidatos por historial (TAR-0007), unificadas en una sola estructura.
  actualizarFichaGrafo({
    rutaGrafo: salida,
    id: 'vista_sistema',
    nombre: 'Vista inicial del sistema',
    tipo: 'Espacio',
    espacioReal: null, // hueco real -- "Panel Operativo"/graphify_visor no tiene ficha propia en 01_Mundo/Espacios/ todavia
    descripcion: 'Páginas, servidor, endpoints reales y recursos (Sheet/Baserow) del propio Panel Operativo/graphify_visor, con raíz en home.html.',
    extractor: 'mapear_grafo_visor.mjs',
    pagina: 'vista_sistema.html',
    contadores: { nodos: nodos.length, aristas: aristas.length, paginas: htmls.length, endpoints: nodosEndpointVistos.size, recursos: nodosRecursoVistos.size },
  });

  console.log('=== Grafo real del sistema Panel Operativo (raíz: home.html) ===');
  console.log(`${htmls.length} páginas reales, 1 servidor, ${nodosEndpointVistos.size} endpoints reales, ${nodosRecursoVistos.size} recursos reales tocados, ${aristas.length} aristas reales.`);
  console.log('Escrito en: ' + salida);
}

main();
