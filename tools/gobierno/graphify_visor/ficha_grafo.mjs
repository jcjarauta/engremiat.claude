// Ficha dinamica real de un grafo (§8.93, TAR-0008, PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md).
// Une dos cosas que antes iban a quedar separadas: documentar (Proceso 5) y detectar
// candidatos por historial (Proceso 1a, TAR-0007) -- una sola estructura real sirve a
// las dos, sin duplicar capturas fechadas por fichero.
//
// Cada extractor real (mapear_grafo_X.mjs) llama actualizarFichaGrafo() justo despues de
// escribir su grafo_X.json -- nunca a mano, nunca en grafos.html/taller.html. Escribe en
// dos sitios reales:
//   1. La propia ficha, embebida en el grafo_X.json bajo la clave "ficha" -- self-describing,
//      un extractor puede leer su propio historial sin depender de otro fichero.
//   2. Una entrada en el manifest unico fichas_grafos.json (todas las fichas juntas), para
//      que grafos.html/taller.html hagan un solo fetch en vez de N.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const RUTA_MANIFEST = join(DIR_VISOR, 'fichas_grafos.json');
const MAX_HISTORIAL = 20; // suficiente para ver tendencia real sin crecer sin limite

/**
 * @param {object} datos
 * @param {string} datos.rutaGrafo - ruta absoluta al grafo_X.json ya escrito por el extractor
 * @param {string} datos.id - slug real, mismo nombre que el fichero .html sin extension (ej. "vista_sistema")
 * @param {string} datos.nombre - nombre real para mostrar (ej. "Vista inicial del sistema")
 * @param {string} datos.tipo - Espacio | Personaje | Recurso | Modulo | Herramienta | Transversal (taxonomia real de S8.87)
 * @param {string|null} datos.espacioReal - nombre real de la ficha de Espacio si existe (01_Mundo/Espacios/*.md), null si es hueco
 * @param {string} datos.descripcion - una frase real de que representa este grafo y de donde sale el dato
 * @param {string} datos.extractor - nombre real del script (ej. "mapear_grafo_visor.mjs")
 * @param {string} datos.pagina - nombre real de la pagina .html que lo muestra
 * @param {object} datos.contadores - conteos reales del grafo (ej. {nodos: 17, aristas: 64})
 */
export function actualizarFichaGrafo({ rutaGrafo, id, nombre, tipo, espacioReal, descripcion, extractor, pagina, contadores }) {
  const ahora = new Date().toISOString();

  // El historial previo se lee del MANIFEST, nunca del propio grafo_X.json -- el extractor
  // que llama a esta funcion ya sobrescribio ese fichero entero (nodos/aristas nuevos) justo
  // antes, así que su "ficha" anterior ya no existe ahi. El manifest es el unico sitio real
  // que esta funcion controla en exclusiva, por eso es la fuente de verdad del historial.
  const manifest = existsSync(RUTA_MANIFEST) ? JSON.parse(readFileSync(RUTA_MANIFEST, 'utf-8')) : { fichas: {} };
  const historialPrevio = (manifest.fichas[id] && manifest.fichas[id].historial) || [];
  const historial = [...historialPrevio, { en: ahora, ...contadores }].slice(-MAX_HISTORIAL);
  const ficha = { id, nombre, tipo, espacioReal: espacioReal || null, descripcion, extractor, pagina, contadores, actualizadoEn: ahora, historial };

  const grafo = JSON.parse(readFileSync(rutaGrafo, 'utf-8'));
  grafo.ficha = ficha;
  writeFileSync(rutaGrafo, JSON.stringify(grafo, null, 2), 'utf-8');

  manifest.fichas[id] = ficha;
  writeFileSync(RUTA_MANIFEST, JSON.stringify(manifest, null, 2), 'utf-8');

  return ficha;
}
