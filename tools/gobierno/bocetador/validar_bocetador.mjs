#!/usr/bin/env node
/*
 * Gate del prototipo del Bocetador (ver PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_
 * ENGREMIAT.md §8.5, paso 1): "espacio.schema.json/relacion.schema.json
 * con fixtures, como ya se hizo en B0". Mismo criterio que
 * tools/gobierno/telar/validar_b0.mjs -- determinista, sin llamar a
 * ninguna IA, sin tocar Sheets/Baserow/el VPS.
 *
 * Comprueba:
 *   1. Los fixtures de Espacio validan contra espacio.schema.json.
 *   2. Los fixtures de Relacion validan contra relacion.schema.json.
 *   3. Toda Relacion valida referencia un origenId/destinoId que existe
 *      de verdad entre los Espacios (u otros nodos ya conocidos del
 *      canvas real) -- una relacion no puede apuntar a un id inventado.
 *   4. El fixture roto a proposito (tipo inventado) es RECHAZADO.
 *
 * Uso: npm install && node validar_bocetador.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR_SCHEMAS = join(__dirname, 'schemas');
const DIR_FIXTURES = join(__dirname, 'fixtures');

// Nodos reales que ya existen en Arquitectura_Nucleo.canvas pero no son
// Espacios (Constitucion, Puerta Humana, Oficios...) -- una Relacion real
// puede apuntar a estos sin que exista un fixture de Espacio para ellos.
const NODOS_CANVAS_NO_ESPACIO = ['constitucion', 'puerta_humana', 'relevo'];

function leerJson(ruta) {
  return JSON.parse(readFileSync(ruta, 'utf-8'));
}

function main() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  for (const nombre of readdirSync(DIR_SCHEMAS)) {
    ajv.addSchema(leerJson(join(DIR_SCHEMAS, nombre)));
  }
  const validarEspacio = ajv.getSchema('https://engremiat.local/telar/espacio.schema.json');
  const validarRelacion = ajv.getSchema('https://engremiat.local/telar/relacion.schema.json');

  const ficheros = readdirSync(DIR_FIXTURES);
  const ficherosEspacio = ficheros.filter((f) => f.startsWith('espacio_'));
  const ficherosRelacion = ficheros.filter((f) => f.startsWith('relacion_'));
  const ficherosRotos = ficheros.filter((f) => f.startsWith('roto_'));

  let fallos = 0;
  const idsEspacio = new Set(NODOS_CANVAS_NO_ESPACIO);

  console.log('=== Validacion del prototipo del Bocetador (espacio/relacion) ===\n');
  console.log('-- Espacios --');
  for (const fichero of ficherosEspacio) {
    const fixture = leerJson(join(DIR_FIXTURES, fichero));
    if (validarEspacio(fixture)) {
      console.log(`OK   ${fichero}  (${fixture.nombre}, capa=${fixture.capa}, variabilidad=${fixture.variabilidad})`);
      idsEspacio.add(fixture.id);
    } else {
      fallos++;
      console.log(`FAIL ${fichero}`);
      for (const e of validarEspacio.errors) console.log('       - ' + e.instancePath + ' ' + e.message);
    }
  }

  console.log('\n-- Relaciones --');
  for (const fichero of ficherosRelacion) {
    const fixture = leerJson(join(DIR_FIXTURES, fichero));
    const ok = validarRelacion(fixture);
    let errorRef = null;
    if (ok) {
      if (!idsEspacio.has(fixture.origenId)) errorRef = `origenId '${fixture.origenId}' no corresponde a ningun Espacio/nodo conocido`;
      else if (!idsEspacio.has(fixture.destinoId)) errorRef = `destinoId '${fixture.destinoId}' no corresponde a ningun Espacio/nodo conocido`;
    }
    if (ok && !errorRef) {
      console.log(`OK   ${fichero}  (${fixture.origenId} --${fixture.tipo}--> ${fixture.destinoId})`);
    } else {
      fallos++;
      console.log(`FAIL ${fichero}`);
      if (!ok) for (const e of validarRelacion.errors) console.log('       - ' + e.instancePath + ' ' + e.message);
      if (errorRef) console.log('       - ' + errorRef);
    }
  }

  console.log('\n-- Fixture roto a proposito (debe ser RECHAZADO) --');
  for (const fichero of ficherosRotos) {
    const fixture = leerJson(join(DIR_FIXTURES, fichero));
    const ok = validarRelacion(fixture);
    if (!ok) {
      console.log(`OK   ${fichero} rechazado correctamente:`);
      for (const e of validarRelacion.errors) console.log('       - ' + e.instancePath + ' ' + e.message);
    } else {
      fallos++;
      console.log(`FAIL ${fichero} -- debia ser invalido y el validador lo acepto`);
    }
  }

  console.log('\n=== Resultado ===');
  console.log(`${ficherosEspacio.length} Espacio(s), ${ficherosRelacion.length} Relacion(es), ${ficherosRotos.length} fixture(s) roto(s) a proposito.`);
  if (fallos === 0) {
    console.log('GATE: APROBADO -- contrato revisado, fixtures reproducibles, cero llamadas a API, cero escrituras.');
    process.exitCode = 0;
  } else {
    console.log(`GATE: NO APROBADO -- ${fallos} fallo(s) real(es) arriba.`);
    process.exitCode = 1;
  }
}

main();
