#!/usr/bin/env node
/*
 * Extractor real compartido para los tipos reales que aun no tenian grafo propio --
 * Recurso, Modulo, Regla (huecos senalados en grafos.html, TAR-0002/0003/0004,
 * PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md §8.93).
 *
 * NO vuelve a parsear el vault -- cargar_desde_vault.mjs (tools/gobierno/bocetador/) ya
 * lo hace y ya escribe universo_real.json con las relacionesDeclaradas reales de cada
 * ficha (## Relaciones, wikilinks reales). Escribir un extractor nuevo que reparseara el
 * vault desde cero seria repetir exactamente el error ya encontrado y cerrado en §8.59
 * ("el Bocetador y el Graphify Visor eran dos lectores del mismo vault que no se
 * cruzaban") -- este script lee esa misma fuente real, nunca la duplica.
 *
 * Un solo script sirve a los 3 tipos (--tipo recurso|modulo|regla) porque la logica real
 * es identica para los tres: nodo primario = las fichas de ese tipo; arista real = cada
 * relacionDeclarada (wikilink real) resuelta contra el indice de TODAS las entidades
 * reales del universo (no solo las del mismo tipo -- una Regla real puede referenciar un
 * Personaje, por ejemplo). Si una relacionDeclarada no resuelve contra ninguna ficha real,
 * se marca como nodo "externo" (mismo patron honesto que cargar_grafo_wikilinks.mjs: "6
 * nombres referenciados sin ficha propia") -- nunca se descarta en silencio ni se inventa.
 *
 * Uso: node mapear_grafo_por_tipo.mjs --tipo recurso|modulo|regla
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { actualizarFichaGrafo } from './ficha_grafo.mjs';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const RUTA_UNIVERSO_REAL = join(DIR_VISOR, '..', 'bocetador', 'universo_real.json');

const CONFIG_POR_TIPO = {
  recurso: { id: 'grafo_recurso', nombre: 'Recursos reales', pagina: 'vista_recursos.html', descripcion: 'Fichas reales de 01_Mundo/Recursos/ (GASTO_API, DOCUMENTO_ENGREMIAT, Zona de aterrizaje STG...) y sus relaciones declaradas reales.' },
  modulo: { id: 'grafo_modulo', nombre: 'Módulos reales', pagina: 'vista_modulos.html', descripcion: 'Fichas reales de 01_Mundo/Modulos/ (CORE + Módulos_acoplables) y sus relaciones declaradas reales.' },
  regla: { id: 'grafo_regla', nombre: 'Reglas reales', pagina: 'vista_reglas.html', descripcion: 'Fichas reales de 03_Reglas/ (6 fichas: El Sheet manda, Física, Honestidad del fallo...) y sus relaciones declaradas reales.' },
};

function leerArgs() {
  const args = process.argv.slice(2);
  const iTipo = args.indexOf('--tipo');
  const tipo = iTipo >= 0 ? args[iTipo + 1] : null;
  if (!tipo || !CONFIG_POR_TIPO[tipo]) {
    throw new Error('Uso: node mapear_grafo_por_tipo.mjs --tipo recurso|modulo|regla');
  }
  return { tipo };
}

function main() {
  const { tipo } = leerArgs();
  const config = CONFIG_POR_TIPO[tipo];
  const universo = JSON.parse(readFileSync(RUTA_UNIVERSO_REAL, 'utf-8'));

  // Indice real de TODAS las entidades del universo (todas las categorias, no solo `tipo`)
  // -- una relacionDeclarada real puede apuntar a cualquier tipo real, nunca solo al mismo.
  const TODAS_LAS_CATEGORIAS = ['espacios', 'recursos', 'modulos', 'personajes', 'oficios', 'reglas'];
  const indice = new Map();
  for (const categoria of TODAS_LAS_CATEGORIAS) {
    for (const n of universo[categoria] || []) indice.set(n.id, n);
  }
  // Mismo slug() exacto que cargar_desde_vault.mjs -- los ids deben coincidir letra a
  // letra o una relacionDeclarada real nunca resolveria contra el indice.
  const slug = (texto) => texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const primarios = universo[tipo + 's'] || []; // universo_real.json usa claves reales en plural: recursos/modulos/reglas

  const nodos = [];
  const aristas = [];
  const vistos = new Set();
  const nodosExternos = new Set();

  function anadirNodo(n) {
    if (vistos.has(n.id)) return;
    vistos.add(n.id);
    nodos.push(n);
  }

  for (const primario of primarios) {
    anadirNodo({ id: primario.id, nombre: primario.nombre, tipo: primario.tipo, esPrimario: true });
    for (const nombreReal of primario.relacionesDeclaradas || []) {
      const idDestino = slug(nombreReal);
      const destino = indice.get(idDestino);
      if (destino) {
        anadirNodo({ id: destino.id, nombre: destino.nombre, tipo: destino.tipo, esPrimario: destino.tipo === tipo });
      } else {
        // Nombre real referenciado sin ficha propia -- honesto, no se descarta (mismo
        // patron real ya usado en cargar_grafo_wikilinks.mjs §8.23).
        anadirNodo({ id: idDestino, nombre: nombreReal, tipo: 'externo', esPrimario: false });
        nodosExternos.add(idDestino);
      }
      aristas.push({ source: primario.id, target: idDestino, relation: 'relaciona_con' });
    }
  }

  const salida = join(DIR_VISOR, config.id + '.json');
  const paquete = { generadoEn: new Date().toISOString(), nodos, aristas };
  writeFileSync(salida, JSON.stringify(paquete, null, 2), 'utf-8');

  actualizarFichaGrafo({
    rutaGrafo: salida,
    id: config.id,
    nombre: config.nombre,
    tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
    espacioReal: null,
    descripcion: config.descripcion,
    extractor: 'mapear_grafo_por_tipo.mjs --tipo ' + tipo,
    pagina: config.pagina,
    contadores: { nodos: nodos.length, aristas: aristas.length, primarios: primarios.length, externos: nodosExternos.size },
  });

  console.log(`=== Grafo real: ${config.nombre} ===`);
  console.log(`${primarios.length} fichas reales de tipo ${tipo}, ${nodos.length} nodos totales (incluye referenciados), ${aristas.length} aristas reales, ${nodosExternos.size} nombres referenciados sin ficha propia.`);
  console.log('Escrito en: ' + salida);
}

main();
