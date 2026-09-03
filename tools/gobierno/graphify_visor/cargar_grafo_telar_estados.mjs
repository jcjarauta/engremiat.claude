#!/usr/bin/env node
/*
 * Convierte el estados.json real de Telar B0 (ya construido y validado
 * con validar_b0.mjs) al mismo formato nodos/aristas del resto de vistas.
 * Distinto en tipo -- es un grafo de PROCESO (ciclo de vida de una
 * Mision), no de entidades. Solo lectura de un fichero real ya versionado.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = import.meta.dirname;
const estados = JSON.parse(readFileSync(join(DIR, '..', 'telar', 'estados.json'), 'utf-8'));

const nodos = estados.estados.map((e) => ({ id: e, tipo: 'estado', nombre: e, esMVP: estados.estadosVisualesMVP.includes(e) }));
const aristas = [];
for (const [origen, destinos] of Object.entries(estados.transiciones)) {
  for (const destino of destinos) aristas.push({ source: origen, target: destino });
}

const paquete = { generadoEn: new Date().toISOString(), nodos, aristas, notas: estados.notas };
writeFileSync(join(DIR, 'grafo_telar_estados.json'), JSON.stringify(paquete, null, 2));
console.log(`grafo_telar_estados.json -- ${nodos.length} estados reales, ${aristas.length} transiciones reales.`);
