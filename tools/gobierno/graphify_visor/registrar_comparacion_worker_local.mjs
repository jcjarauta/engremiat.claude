#!/usr/bin/env node
/*
 * Anota la comparacion real entre una respuesta del worker local (enviar_a_worker_local.mjs)
 * y lo que de verdad paso al ejecutar esa tarea -- mismo espiritu y misma exigencia de
 * evidencia real que registrar_comparacion_deepseek.mjs (§8.100/102), version worker local.
 *
 * Uso (JSON via stdin):
 *   node registrar_comparacion_worker_local.mjs < comparacion.json
 *
 * Forma real esperada del JSON de entrada:
 * {
 *   "id": "extractor_recurso_worker_local",
 *   "veredicto": "diverge",
 *   "coincidencias": ["..."],
 *   "divergencias": ["..."],
 *   "notas": "..."
 * }
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const RUTA = join(DIR_VISOR, 'respuestas_worker_local.json');
const VEREDICTOS_REALES = ['coincide', 'parcial', 'diverge'];

function main() {
  const entrada = JSON.parse(readFileSync(0, 'utf-8'));
  const { id, veredicto, notas } = entrada;
  const coincidencias = entrada.coincidencias || [];
  const divergencias = entrada.divergencias || [];
  if (!id || !veredicto) {
    console.error('Faltan campos reales obligatorios: id, veredicto.');
    process.exit(1);
  }
  if (!VEREDICTOS_REALES.includes(veredicto)) {
    console.error('Veredicto desconocido: ' + veredicto + ' (validos: ' + VEREDICTOS_REALES.join(', ') + ')');
    process.exit(1);
  }
  if (!coincidencias.length && !divergencias.length) {
    console.error('Un veredicto necesita al menos una coincidencia o divergencia real documentada -- no se compara sin evidencia concreta.');
    process.exit(1);
  }
  if (!existsSync(RUTA)) {
    console.error('No existe respuestas_worker_local.json todavia -- ejecuta primero enviar_a_worker_local.mjs.');
    process.exit(1);
  }
  const datos = JSON.parse(readFileSync(RUTA, 'utf-8'));
  if (!datos.respuestas[id]) {
    console.error('No existe una respuesta real con id "' + id + '" -- ejecuta primero enviar_a_worker_local.mjs para ese id.');
    process.exit(1);
  }
  datos.respuestas[id].comparacion = { veredicto, coincidencias, divergencias, notas: notas || null, comparadoEn: new Date().toISOString() };
  writeFileSync(RUTA, JSON.stringify(datos, null, 2), 'utf-8');
  console.log('Comparacion real anotada para "' + id + '": ' + veredicto + '.');
}

main();
