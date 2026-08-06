import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { construirManifiestoCascaron, montarCliente } from './montar-cliente.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..', '..');
const tests = [];

function test(name, body) {
  tests.push({ name, body });
}

function assert(condition, message = 'ASSERTION_FAILED') {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message = 'VALUES_DIFFER') {
  assert(Object.is(actual, expected), `${message} expected=${expected} actual=${actual}`);
}

function assertDeepEqual(actual, expected, message = 'STRUCTURES_DIFFER') {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message} actual=${JSON.stringify(actual)}`);
}

function expectError(fn, expectedFragment) {
  let caught = null;
  try {
    fn();
  } catch (error) {
    caught = error;
  }
  assert(caught, `EXPECTED_ERROR ${expectedFragment}`);
  assert(String(caught.message).includes(expectedFragment), `UNEXPECTED_ERROR ${caught.message}`);
  return caught;
}

function ownTemp(prefix = 'engremiat-constructor-test-') {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

function removeOwnTemp(tempPath) {
  const base = path.basename(tempPath);
  assert(base.startsWith('engremiat-constructor-test-'), 'REFUSE_CLEANUP_FOREIGN_PATH');
  if (existsSync(tempPath)) rmSync(tempPath, { recursive: true, force: true });
}

const libreriaFixture = {
  libraryId: 'SCRIPT_ID_FICTICIO',
  version: '3',
  userSymbol: 'CoreTest',
  timeZone: 'Europe/Madrid',
};

test('01 construirManifiestoCascaron declara la librería correcta', () => {
  const manifiesto = construirManifiestoCascaron(libreriaFixture);
  assertEqual(manifiesto.dependencies.libraries.length, 1);
  assertEqual(manifiesto.dependencies.libraries[0].userSymbol, 'CoreTest');
  assertEqual(manifiesto.dependencies.libraries[0].libraryId, 'SCRIPT_ID_FICTICIO');
  assertEqual(manifiesto.dependencies.libraries[0].version, '3');
  assertEqual(manifiesto.timeZone, 'Europe/Madrid');
});

test('02 construirManifiestoCascaron usa Europe/Madrid por defecto', () => {
  const manifiesto = construirManifiestoCascaron({ ...libreriaFixture, timeZone: undefined });
  assertEqual(manifiesto.timeZone, 'Europe/Madrid');
});

test('03 montarCliente rechaza nombre vacío', () => {
  const root = ownTemp();
  try {
    expectError(() => montarCliente({
      projectRoot: PROJECT_ROOT,
      nombre: '',
      modulos: ['CORE'],
      outputDir: path.join(root, 'out'),
      libreria: libreriaFixture,
      clientesRegistro: { clientes: [] },
    }), 'NOMBRE_VACIO');
  } finally {
    removeOwnTemp(root);
  }
});

test('04 montarCliente rechaza nombre con caracteres no permitidos', () => {
  const root = ownTemp();
  try {
    expectError(() => montarCliente({
      projectRoot: PROJECT_ROOT,
      nombre: 'cliente con espacios',
      modulos: ['CORE'],
      outputDir: path.join(root, 'out'),
      libreria: libreriaFixture,
      clientesRegistro: { clientes: [] },
    }), 'NOMBRE_INVALIDO');
  } finally {
    removeOwnTemp(root);
  }
});

test('05 montarCliente rechaza nombre ya registrado', () => {
  const root = ownTemp();
  try {
    expectError(() => montarCliente({
      projectRoot: PROJECT_ROOT,
      nombre: 'acme',
      modulos: ['CORE'],
      outputDir: path.join(root, 'out'),
      libreria: libreriaFixture,
      clientesRegistro: { clientes: [{ nombre: 'acme' }] },
    }), 'NOMBRE_YA_REGISTRADO');
  } finally {
    removeOwnTemp(root);
  }
});

test('06 montarCliente rechaza módulo desconocido', () => {
  const root = ownTemp();
  try {
    expectError(() => montarCliente({
      projectRoot: PROJECT_ROOT,
      nombre: 'acme',
      modulos: ['NOPE'],
      outputDir: path.join(root, 'out'),
      libreria: libreriaFixture,
      clientesRegistro: { clientes: [] },
    }), 'MODULO_DESCONOCIDO');
  } finally {
    removeOwnTemp(root);
  }
});

test('07 montarCliente rechaza directorio de salida ya existente', () => {
  const root = ownTemp();
  try {
    const output = path.join(root, 'out');
    mkdirSync(output);
    expectError(() => montarCliente({
      projectRoot: PROJECT_ROOT,
      nombre: 'acme',
      modulos: ['CORE'],
      outputDir: output,
      libreria: libreriaFixture,
      clientesRegistro: { clientes: [] },
    }), 'DESTINO_PREEXISTENTE');
  } finally {
    removeOwnTemp(root);
  }
});

test('08 montarCliente rechaza salida dentro de src o tools', () => {
  expectError(() => montarCliente({
    projectRoot: PROJECT_ROOT,
    nombre: 'acme',
    modulos: ['CORE'],
    outputDir: path.join(PROJECT_ROOT, 'src', 'cliente-acme'),
    libreria: libreriaFixture,
    clientesRegistro: { clientes: [] },
  }), 'DESTINO_PROHIBIDO');

  expectError(() => montarCliente({
    projectRoot: PROJECT_ROOT,
    nombre: 'acme',
    modulos: ['CORE'],
    outputDir: path.join(PROJECT_ROOT, 'tools', 'cliente-acme'),
    libreria: libreriaFixture,
    clientesRegistro: { clientes: [] },
  }), 'DESTINO_PROHIBIDO');
});

test('09 montarCliente real: CORE,GANTT escribe archivos válidos y registra la entrada', () => {
  const root = ownTemp();
  try {
    const output = path.join(root, 'cliente-acme');
    const clientesRegistro = { clientes: [] };

    const { plan, outputPath, entrada } = montarCliente({
      projectRoot: PROJECT_ROOT,
      nombre: 'acme',
      modulos: ['CORE', 'GANTT'],
      outputDir: output,
      libreria: libreriaFixture,
      clientesRegistro,
    });

    assertEqual(outputPath, output);
    assertDeepEqual(plan.resolvedModules, ['CORE', 'GANTT']);
    assert(existsSync(path.join(output, 'Codigo.js')));
    assert(existsSync(path.join(output, 'appsscript.json')));

    const codigo = readFileSync(path.join(output, 'Codigo.js'), 'utf8');
    assert(codigo.includes('CoreTest.onOpen.apply'));

    const manifiesto = JSON.parse(readFileSync(path.join(output, 'appsscript.json'), 'utf8'));
    assertEqual(manifiesto.dependencies.libraries[0].libraryId, 'SCRIPT_ID_FICTICIO');

    assertEqual(clientesRegistro.clientes.length, 1);
    assertEqual(clientesRegistro.clientes[0].nombre, 'acme');
    assertEqual(entrada.nombre, 'acme');
    assertEqual(entrada.estado, 'empaquetado_pendiente_desplegar');
    assert(entrada.envoltoriosGenerados > 0);
  } finally {
    removeOwnTemp(root);
  }
});

test('10 montarCliente real: módulo aislado reporta huecos esperados', () => {
  const root = ownTemp();
  try {
    const output = path.join(root, 'cliente-solo-gantt');
    const { entrada } = montarCliente({
      projectRoot: PROJECT_ROOT,
      nombre: 'solo-gantt',
      modulos: ['GANTT'],
      outputDir: output,
      libreria: libreriaFixture,
      clientesRegistro: { clientes: [] },
    });
    assert(entrada.huecos.length > 0);
    assert(entrada.huecos.every((hueco) => hueco.estado === 'EXCLUDED_MODULE_GAP'));
  } finally {
    removeOwnTemp(root);
  }
});

test('11 montarCliente real: los 6 módulos completos no dejan huecos', () => {
  const root = ownTemp();
  try {
    const output = path.join(root, 'cliente-completo');
    const { entrada } = montarCliente({
      projectRoot: PROJECT_ROOT,
      nombre: 'completo',
      modulos: ['CORE', 'GANTT', 'ECONOMICO', 'IMPACTO', 'COMPRAS', 'CONVOCATORIAS'],
      outputDir: output,
      libreria: libreriaFixture,
      clientesRegistro: { clientes: [] },
    });
    assertDeepEqual(entrada.huecos, []);
  } finally {
    removeOwnTemp(root);
  }
});

test('12 el registro real clientes.json es válido y empieza vacío', () => {
  const registro = JSON.parse(readFileSync(path.join(HERE, 'clientes.json'), 'utf8'));
  assertEqual(registro.schemaVersion, 1);
  assertDeepEqual(registro.clientes, []);
});

test('13 la librería real libreria.json declara el Script ID publicado', () => {
  const libreria = JSON.parse(readFileSync(path.join(HERE, 'libreria.json'), 'utf8'));
  assertEqual(libreria.libraryId, '1fRR3hjtUIxWcZrjU1APFtG361QuDZ8GmBNQjAoKY_ZjhaYprAkvOEA7M');
  assertEqual(libreria.userSymbol, 'Core');
});

async function main() {
  console.log(`ENGREMIAT_CONSTRUCTOR_TEST_BEGIN tests=${tests.length}`);
  let failures = 0;
  for (const item of tests) {
    try {
      await item.body();
      console.log(`OK ${item.name}`);
    } catch (error) {
      failures += 1;
      console.log(`ERR ${item.name} message=${String(error.message).replace(/[\r\n]+/gu, ' ')}`);
    }
  }
  console.log(failures === 0 ? 'NEXT solicitar_gate_de_build' : 'NEXT corregir_sin_construir');
  console.log(`ENGREMIAT_CONSTRUCTOR_TEST_END result=${failures === 0 ? 'OK' : 'ERR'} failures=${failures}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

await main();
