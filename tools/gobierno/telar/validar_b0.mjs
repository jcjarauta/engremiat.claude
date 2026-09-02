#!/usr/bin/env node
/*
 * Gate de la Fase B0 de Telar (ver PROPUESTA_TELAR_INTERFAZ_OPERATIVA.md §16-17):
 * "contrato revisado + 5 casos reproducibles". Este script ES esa verificacion --
 * determinista, sin llamar a DeepSeek, sin tocar Sheets/Baserow/el VPS.
 *
 * Comprueba tres cosas:
 *   1. Los 5 fixtures de Mision validan contra mision.schema.json (JSON Schema real,
 *      via ajv -- no una simulacion de validacion).
 *   2. El missionStatus de cada fixture es un estado real del grafo de estados.json.
 *   3. Los dos fixtures auxiliares (evento, huella-evento) validan contra sus esquemas.
 *
 * Uso: npm install && node validar_b0.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR_SCHEMAS = join(__dirname, 'schemas');
const DIR_FIXTURES = join(__dirname, 'fixtures');

function leerJson(ruta) {
  return JSON.parse(readFileSync(ruta, 'utf-8'));
}

function main() {
  const estados = leerJson(join(__dirname, 'estados.json'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });

  for (const nombre of readdirSync(DIR_SCHEMAS)) {
    ajv.addSchema(leerJson(join(DIR_SCHEMAS, nombre)));
  }

  const validarMision = ajv.getSchema('https://engremiat.local/telar/mision.schema.json');
  const validarEvento = ajv.getSchema('https://engremiat.local/telar/evento.schema.json');
  const validarHuella = ajv.getSchema('https://engremiat.local/telar/huella.schema.json');

  let fallos = 0;
  let misionesValidadas = 0;

  console.log('=== Validacion B0 -- Telar ===\n');

  const ficherosMision = ['01_sin_seleccionar.json', '02_deliberando.json', '03_tejiendo.json', '04_esperando_relevo.json', '05_huella.json'];
  for (const fichero of ficherosMision) {
    const fixture = leerJson(join(DIR_FIXTURES, fichero));
    const ok = validarMision(fixture);
    misionesValidadas++;

    let errorEstado = null;
    if (!estados.estados.includes(fixture.missionStatus)) {
      errorEstado = `missionStatus '${fixture.missionStatus}' no existe en estados.json`;
    }
    if (!estados.estadosVisualesMVP.includes(fixture.missionStatus)) {
      errorEstado = errorEstado || `missionStatus '${fixture.missionStatus}' no es uno de los 5 estados visuales del MVP`;
    }

    if (ok && !errorEstado) {
      console.log(`OK   ${fichero}  (missionStatus: ${fixture.missionStatus})`);
    } else {
      fallos++;
      console.log(`FAIL ${fichero}`);
      if (!ok) for (const e of validarMision.errors) console.log('       - ' + e.instancePath + ' ' + e.message);
      if (errorEstado) console.log('       - ' + errorEstado);
    }
  }

  console.log('');
  const evento = leerJson(join(DIR_FIXTURES, 'aux_evento_decision_aprobar.json'));
  if (validarEvento(evento)) {
    console.log('OK   aux_evento_decision_aprobar.json (evento.schema.json)');
  } else {
    fallos++;
    console.log('FAIL aux_evento_decision_aprobar.json');
    for (const e of validarEvento.errors) console.log('       - ' + e.instancePath + ' ' + e.message);
  }

  const huellaEvt = leerJson(join(DIR_FIXTURES, 'aux_huella_evento.json'));
  if (validarHuella(huellaEvt)) {
    console.log('OK   aux_huella_evento.json (huella.schema.json)');
  } else {
    fallos++;
    console.log('FAIL aux_huella_evento.json');
    for (const e of validarHuella.errors) console.log('       - ' + e.instancePath + ' ' + e.message);
  }

  console.log('\n--- Grafo de transiciones (' + estados.estados.length + ' estados) ---');
  for (const [origen, destinos] of Object.entries(estados.transiciones)) {
    if (!estados.estados.includes(origen)) { fallos++; console.log(`FAIL estado de origen desconocido: ${origen}`); continue; }
    for (const destino of destinos) {
      if (!estados.estados.includes(destino)) { fallos++; console.log(`FAIL transicion a estado desconocido: ${origen} -> ${destino}`); }
    }
  }
  if (fallos === 0) console.log('OK   grafo de transiciones consistente');

  console.log('\n=== Resultado ===');
  console.log(`Misiones validadas: ${misionesValidadas}/5`);
  if (fallos === 0) {
    console.log('GATE B0: APROBADO -- contrato revisado, 5 fixtures reproducibles, cero llamadas a API, cero escrituras.');
    process.exitCode = 0;
  } else {
    console.log(`GATE B0: NO APROBADO -- ${fallos} fallo(s) real(es) arriba.`);
    process.exitCode = 1;
  }
}

main();
