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
  //
  // La "descripcion" real tiene que responder, en una o dos frases, las preguntas
  // fundamentales que ya responden las 8 fichas reales existentes (§8.111) -- ninguna se
  // salta ninguna, aunque nadie lo tuviera escrito como checklist hasta ahora:
  //   1. ¿Que representa cada NODO real? (ej. grafo_recurso: "Fichas reales de
  //      01_Mundo/Recursos/ (GASTO_API, DOCUMENTO_ENGREMIAT...)")
  //   2. ¿Que representa cada ARISTA real, con su nombre real? (ej. holon: "relaciones
  //      reales entre Personajes (opera_en/depende_de/gobierna_a/verifica_a...)")
  //   3. ¿De que FUENTE real sale el dato? (ej. nodejs: "Scripts reales de tools/"; anatomia:
  //      "calculadas sobre 7 fuentes reales distintas")
  //   4. Si hay huecos reales o nodos "externo" sin resolver, decirlo aqui explicitamente --
  //      nunca en silencio (mismo criterio que mapear_grafo_por_tipo.mjs).
  //   5. ¿Que limite honesto tiene este grafo, que NO cubre? (ej. n8n: "unica capa que
  //      muestra automatizacion real con Puerta Humana propia" -- delimita que si cubre y
  //      que no cubren las demas capas).
  actualizarFichaGrafo({
    rutaGrafo: SALIDA,
    id: 'NOMBRE', // PERSONALIZAR: mismo slug que el nombre de fichero .html sin extension
    nombre: 'NOMBRE REAL PARA MOSTRAR', // PERSONALIZAR
    tipo: 'Espacio', // PERSONALIZAR: Espacio | Personaje | Recurso | Modulo | Herramienta | Transversal (taxonomia real S8.87)
    espacioReal: null, // PERSONALIZAR: nombre real de la ficha de Espacio si existe, null si es hueco
    descripcion: 'DESCRIPCION REAL: que es cada nodo, que es cada arista (con su nombre real), de que fuente real sale, y su limite honesto si aplica.', // PERSONALIZAR -- ver las 5 preguntas arriba
    extractor: 'NOMBRE_DEL_FICHERO.mjs', // PERSONALIZAR
    pagina: 'NOMBRE.html', // PERSONALIZAR
    contadores: { nodos: nodos.length, aristas: aristas.length },
  });

  console.log(`=== Grafo real: NOMBRE ===`); // PERSONALIZAR
  console.log(`${nodos.length} nodos reales, ${aristas.length} aristas reales.`);
  console.log('Escrito en: ' + SALIDA);
}

main();
