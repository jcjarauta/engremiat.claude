#!/usr/bin/env node
/*
 * Tercera vista real (2026-09-03) -- evaluada como asesor tecnico antes de
 * construir, no por reflejo: si aporta valor. Respuesta real: si, porque
 * n8n ya es una capa de automatizacion real e invisible en las otras dos
 * vistas (Apps Script, Node) -- workflows reales con Puerta Humana propia
 * ("Cronista - Segmentar documento en tareas (con puerta humana)").
 *
 * No hace falta credencial nueva -- tools/n8n-workflows/exportar.mjs ya
 * dejo 2 workflows reales exportados con el token redactado
 * (cronista-segmentar-generador.json: 78 nodos; telar-interactivo.json:
 * 59 nodos). Este script los convierte al mismo formato nodos/aristas
 * que ya usan las otras dos vistas -- solo lectura de ficheros ya
 * versionados, ninguna llamada a n8n en real.
 *
 * Uso: node mapear_grafo_n8n.mjs [--salida <ruta.json>]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { actualizarFichaGrafo } from './ficha_grafo.mjs';

const DIR_WORKFLOWS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'tools', 'n8n-workflows');
const SALIDA_POR_DEFECTO = join(dirname(fileURLToPath(import.meta.url)), 'grafo_n8n.json');
const WORKFLOWS = ['cronista-segmentar-generador.json', 'telar-interactivo.json'];

function leerArgs() {
  const args = process.argv.slice(2);
  let salida = SALIDA_POR_DEFECTO;
  for (let i = 0; i < args.length; i++) if (args[i] === '--salida') salida = args[++i];
  return { salida };
}

function main() {
  const { salida } = leerArgs();
  const nodos = [];
  const aristas = [];

  for (const fichero of WORKFLOWS) {
    const wf = JSON.parse(readFileSync(join(DIR_WORKFLOWS, fichero), 'utf-8'));
    const prefijo = wf.name + '::';

    for (const n of wf.nodes) {
      nodos.push({
        id: prefijo + n.name,
        nombre: n.name,
        workflow: wf.name,
        tipoNodo: n.type.replace('n8n-nodes-base.', ''),
      });
    }

    for (const [origen, salidas] of Object.entries(wf.connections || {})) {
      for (const rama of salidas.main || []) {
        for (const conexion of rama || []) {
          aristas.push({ source: prefijo + origen, target: prefijo + conexion.node, workflow: wf.name });
        }
      }
    }
  }

  const paquete = { generadoEn: new Date().toISOString(), workflows: WORKFLOWS.length, nodos, aristas };
  writeFileSync(salida, JSON.stringify(paquete, null, 2), 'utf-8');

  actualizarFichaGrafo({
    rutaGrafo: salida,
    id: 'n8n',
    nombre: 'Automatización (n8n)',
    tipo: 'Espacio',
    espacioReal: 'n8n',
    descripcion: 'Workflows reales ya exportados (Cronista, Telar Interactivo) -- única capa que muestra automatización real con Puerta Humana propia.',
    extractor: 'mapear_grafo_n8n.mjs',
    pagina: 'n8n.html',
    contadores: { nodos: nodos.length, aristas: aristas.length, workflows: WORKFLOWS.length },
  });

  console.log('=== Grafo real de workflows n8n (2 ya exportados) ===');
  console.log(`${nodos.length} nodos reales, ${aristas.length} conexiones reales, de ${WORKFLOWS.length} workflows.`);
  const porTipo = {};
  for (const n of nodos) porTipo[n.tipoNodo] = (porTipo[n.tipoNodo] || 0) + 1;
  console.log('Tipos de nodo reales:', porTipo);
  console.log('Escrito en: ' + salida);
}

main();
