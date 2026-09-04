#!/usr/bin/env node
/*
 * PLANTILLA real -- base para cualquier extractor nuevo mapear_grafo_X.mjs (§8.93, TAR-0001,
 * PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md). No se ejecuta como esta -- es un punto
 * de partida a copiar, companion real de plantilla_grafo_espacio.html (esa es la vista,
 * esta es la extraccion).
 *
 * REGLA DE ORO, la misma de todo extractor real de este proyecto (mapear_grafo_node.mjs,
 * mapear_grafo_visor.mjs...): SOLO LECTURA sobre la fuente real, NUNCA inventar un nodo o
 * una arista que no exista de verdad en el origen. Si algo no se puede determinar con
 * certeza, se omite o se marca como hueco -- nunca se rellena con un valor plausible.
 *
 * COMO USAR ESTA PLANTILLA (5 pasos reales)
 * 1. Copiar con el nombre real (ej. mapear_grafo_recurso.mjs).
 * 2. Rellenar FUENTE_REAL con la ruta/API real de donde salen los datos.
 * 3. Escribir extraerNodosYAristas() -- la unica parte que cambia de verdad entre
 *    extractores. Nunca tocar el resto (escritura del JSON + ficha).
 * 4. Rellenar los datos de FICHA (id/nombre/tipo/descripcion) al final de main().
 * 5. Anadir la fila real al volumen en docker-compose.yml (grafo_X.json), enlazar desde
 *    grafos.html bajo su tipo real, y una entrada en registro_ecosistema.json.
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { actualizarFichaGrafo } from './ficha_grafo.mjs';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
// PERSONALIZAR: ruta real de la fuente (vault, Sheet, Baserow, otro grafo real...)
const FUENTE_REAL = 'RUTA_O_URL_REAL_AQUI';
// PERSONALIZAR: nombre real del fichero de salida
const SALIDA = join(DIR_VISOR, 'grafo_NOMBRE.json');

/**
 * PERSONALIZAR: la unica funcion que cambia de verdad entre extractores.
 * Debe devolver { nodos: [{id, nombre, tipo}], aristas: [{source, target, relation}] }
 * extraidos de verdad de FUENTE_REAL -- ver la regla de oro arriba.
 */
function extraerNodosYAristas() {
  const nodos = [];
  const aristas = [];
  // TODO: leer FUENTE_REAL (readFileSync/readdirSync/fetch...) y llenar nodos/aristas
  // con datos reales encontrados, nunca inventados.
  return { nodos, aristas };
}

function main() {
  const { nodos, aristas } = extraerNodosYAristas();

  const paquete = { generadoEn: new Date().toISOString(), nodos, aristas };
  writeFileSync(SALIDA, JSON.stringify(paquete, null, 2), 'utf-8');

  // Ficha dinamica real (§8.93, TAR-0008) -- documenta este grafo y alimenta la deteccion
  // de candidatos por historial (TAR-0007). Llamar SIEMPRE al final de main(), despues de
  // escribir el grafo, con los contadores reales ya calculados.
  actualizarFichaGrafo({
    rutaGrafo: SALIDA,
    id: 'NOMBRE', // PERSONALIZAR: mismo slug que el nombre de fichero .html sin extension
    nombre: 'NOMBRE REAL PARA MOSTRAR', // PERSONALIZAR
    tipo: 'Espacio', // PERSONALIZAR: Espacio | Personaje | Recurso | Modulo | Herramienta | Transversal (taxonomia real S8.87)
    espacioReal: null, // PERSONALIZAR: nombre real de la ficha de Espacio si existe, null si es hueco
    descripcion: 'DESCRIPCION REAL: que representa este grafo y de donde sale el dato.', // PERSONALIZAR
    extractor: 'NOMBRE_DEL_FICHERO.mjs', // PERSONALIZAR
    pagina: 'NOMBRE.html', // PERSONALIZAR
    contadores: { nodos: nodos.length, aristas: aristas.length },
  });

  console.log(`=== Grafo real: NOMBRE ===`); // PERSONALIZAR
  console.log(`${nodos.length} nodos reales, ${aristas.length} aristas reales.`);
  console.log('Escrito en: ' + SALIDA);
}

main();
