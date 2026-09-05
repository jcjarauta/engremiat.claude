#!/usr/bin/env node
/*
 * Anota la comparacion real entre una valoracion de DeepSeek (evaluar_tarea_deepseek.mjs) y
 * lo que de verdad paso al ejecutar esa tarea (evidencia real ya existente en fichas_prompt.json
 * o en la experiencia real de construccion) -- §8.100.
 *
 * Nunca se genera con otro LLM: es un juicio real (de Claude o de un humano) comparando la
 * propuesta contra hechos ya ocurridos, mismo espiritu que "evidencia real obligatoria" de
 * crear_ficha_prompt.mjs -- sin coincidencias/divergencias reales, no hay veredicto valido.
 *
 * Uso (JSON via stdin):
 *   node registrar_comparacion_deepseek.mjs < comparacion.json
 *
 * Forma real esperada del JSON de entrada:
 * {
 *   "id": "extractor_por_tipo_deepseek",
 *   "veredicto": "parcial",
 *   "coincidencias": ["..."],
 *   "divergencias": ["..."],
 *   "notas": "..."
 * }
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const RUTA = join(DIR_VISOR, 'evaluaciones_deepseek.json');
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
    console.error('No existe evaluaciones_deepseek.json todavia -- ejecuta primero evaluar_tarea_deepseek.mjs.');
    process.exit(1);
  }
  const datos = JSON.parse(readFileSync(RUTA, 'utf-8'));
  if (!datos.evaluaciones[id]) {
    console.error('No existe una evaluacion real con id "' + id + '" -- ejecuta primero evaluar_tarea_deepseek.mjs para ese id.');
    process.exit(1);
  }
  datos.evaluaciones[id].comparacion = { veredicto, coincidencias, divergencias, notas: notas || null, comparadoEn: new Date().toISOString() };
  writeFileSync(RUTA, JSON.stringify(datos, null, 2), 'utf-8');
  console.log('Comparacion real anotada para "' + id + '": ' + veredicto + '.');
}

main();
