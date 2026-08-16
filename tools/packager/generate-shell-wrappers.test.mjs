import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { readPackageMap, validateAndReadFiles } from './build-packages.mjs';
import {
  extractGoogleScriptRunTargets,
  extractInlineScripts,
  extractMenuEntries,
  extractSimpleTriggers,
  findFunctionDeclarationLines,
  maskCommentsOnly,
  parseArgs,
  renderWrapperStubs,
  resolveWrapperPlan,
} from './generate-shell-wrappers.mjs';

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

test('01 maskCommentsOnly blanquea comentarios y conserva strings', () => {
  const source = "const a = 'hola // no es comentario'; // esto sí\n/* bloque */ const b = 1;\n";
  const masked = maskCommentsOnly(source);
  assert(masked.includes("'hola // no es comentario'"));
  assert(!masked.includes('esto sí'));
  assert(!masked.includes('bloque'));
  assertEqual(masked.length, source.length);
});

test('02 maskCommentsOnly no desalinea índices con emoji (par subrogado)', () => {
  const source = '/**\n * 📊 Analizar\n */\nfunction abrirAlgo() {}\n';
  const masked = maskCommentsOnly(source);
  assertEqual(masked.length, source.length);
  const idx = source.indexOf('function abrirAlgo');
  assertEqual(masked.slice(idx, idx + 8), 'function');
});

test('03 extractMenuEntries lee label y función de addItem', () => {
  const source = "ui.createMenu('X').addItem('Ver panel', 'abrirPanel').addItem('Ver otro', 'abrirOtro');\n";
  const entries = extractMenuEntries(source);
  assertDeepEqual(entries.map((e) => [e.label, e.functionName]), [['Ver panel', 'abrirPanel'], ['Ver otro', 'abrirOtro']]);
});

test('04 extractMenuEntries ignora addItem dentro de comentario', () => {
  const source = "// .addItem('Falso', 'noExiste')\nui.createMenu('X').addItem('Real', 'abrirReal');\n";
  const entries = extractMenuEntries(source);
  assertDeepEqual(entries.map((e) => e.functionName), ['abrirReal']);
});

test('05 extractGoogleScriptRunTargets caso simple', () => {
  const source = "google.script.run.withFailureHandler(mostrarError).abrirFicha(id);\n";
  const entries = extractGoogleScriptRunTargets(source);
  assertDeepEqual(entries.map((e) => e.functionName), ['abrirFicha']);
});

test('06 extractGoogleScriptRunTargets con handler de función anónima no captura el handler', () => {
  const source = 'google.script.run.withFailureHandler(function () {}).guardarUltimaCampanaPanel(campanaId);\n';
  const entries = extractGoogleScriptRunTargets(source);
  assertDeepEqual(entries.map((e) => e.functionName), ['guardarUltimaCampanaPanel']);
});

test('07 extractGoogleScriptRunTargets con handler que contiene una llamada interna', () => {
  const source = 'google.script.run.withFailureHandler(function (err) { mostrarError(err); }).obtenerDatos();\n';
  const entries = extractGoogleScriptRunTargets(source);
  assertDeepEqual(entries.map((e) => e.functionName), ['obtenerDatos']);
});

test('08 extractGoogleScriptRunTargets con doble handler encadenado', () => {
  const source = 'google.script.run.withSuccessHandler(render).withFailureHandler(mostrarError).obtenerFicha(id);\n';
  const entries = extractGoogleScriptRunTargets(source);
  assertDeepEqual(entries.map((e) => e.functionName), ['obtenerFicha']);
});

test('09 extractSimpleTriggers detecta onOpen y onEdit declarados', () => {
  const source = 'function onOpen() {}\nfunction onEdit(e) {}\nfunction otraCosa() {}\n';
  const entries = extractSimpleTriggers(source);
  assertDeepEqual(entries.map((e) => e.functionName), ['onOpen', 'onEdit']);
});

test('10 extractSimpleTriggers ignora menciones en string', () => {
  const source = "const texto = 'function onOpen() {}';\n";
  assertDeepEqual(extractSimpleTriggers(source), []);
});

test('11 findFunctionDeclarationLines encuentra declaración de una línea', () => {
  const source = '/**\n * doc\n */\nfunction miFuncion() { return 1; }\n';
  const lines = findFunctionDeclarationLines(source, 'miFuncion');
  assertEqual(lines.length, 1);
  assertEqual(lines[0], 4);
});

test('12 findFunctionDeclarationLines no confunde con función de nombre parecido', () => {
  const source = 'function miFuncionExtra() {}\n';
  assertDeepEqual(findFunctionDeclarationLines(source, 'miFuncion'), []);
});

test('13 extractInlineScripts ignora <script src=...> externo', () => {
  const html = '<script src="externo.js"></script><script>google.script.run.abrirX();</script>';
  const blocks = extractInlineScripts(html);
  assertEqual(blocks.length, 1);
  assert(blocks[0].content.includes('abrirX'));
});

function fixtureFile(pathValue, module, content) {
  return { path: pathValue, package: 'A', module, content };
}

test('14 resolveWrapperPlan clasifica INCLUDED cuando el dueño está en el cierre', () => {
  const map = { moduleDependencies: { CORE: [], GANTT: ['CORE'] } };
  const aFiles = [
    fixtureFile('src/Menu.js', 'CORE', "function onOpen() { ui.addItem('X', 'abrirGantt'); }\n"),
    fixtureFile('src/Gantt.js', 'GANTT', 'function abrirGantt() {}\n'),
  ];
  const plan = resolveWrapperPlan({ map, aFiles, modules: ['GANTT'] });
  assertDeepEqual(plan.resolvedModules, ['CORE', 'GANTT']);
  const entry = plan.entries.find((item) => item.functionName === 'abrirGantt');
  assertEqual(entry.status, 'INCLUDED');
  assert(plan.wrappers.includes('abrirGantt'));
  assert(plan.wrappers.includes('onOpen'));
});

test('15 resolveWrapperPlan clasifica EXCLUDED_MODULE_GAP fuera del cierre', () => {
  const map = { moduleDependencies: { CORE: [], GANTT: ['CORE'], COMPRAS: ['CORE'] } };
  const aFiles = [
    fixtureFile('src/Menu.js', 'CORE', "function onOpen() { ui.addItem('X', 'abrirCompras'); }\n"),
    fixtureFile('src/Compras.js', 'COMPRAS', 'function abrirCompras() {}\n'),
  ];
  const plan = resolveWrapperPlan({ map, aFiles, modules: ['GANTT'] });
  const entry = plan.entries.find((item) => item.functionName === 'abrirCompras');
  assertEqual(entry.status, 'EXCLUDED_MODULE_GAP');
  assertEqual(entry.owner.module, 'COMPRAS');
  assert(!plan.wrappers.includes('abrirCompras'));
  assertEqual(plan.gaps.length, 1);
});

test('16 resolveWrapperPlan marca UNRESOLVED cuando no hay declaración', () => {
  const map = { moduleDependencies: { CORE: [] } };
  const aFiles = [fixtureFile('src/Menu.js', 'CORE', "function onOpen() { ui.addItem('X', 'noExiste'); }\n")];
  const plan = resolveWrapperPlan({ map, aFiles, modules: ['CORE'] });
  const entry = plan.entries.find((item) => item.functionName === 'noExiste');
  assertEqual(entry.status, 'UNRESOLVED');
});

test('17 resolveWrapperPlan marca DUPLICATE_DECLARATION con dos dueños', () => {
  const map = { moduleDependencies: { CORE: [] } };
  const aFiles = [
    fixtureFile('src/Menu.js', 'CORE', "function onOpen() { ui.addItem('X', 'ambiguo'); }\nfunction ambiguo() {}\n"),
    fixtureFile('src/Otro.js', 'CORE', 'function ambiguo() {}\n'),
  ];
  const plan = resolveWrapperPlan({ map, aFiles, modules: ['CORE'] });
  const entry = plan.entries.find((item) => item.functionName === 'ambiguo');
  assertEqual(entry.status, 'DUPLICATE_DECLARATION');
  assertEqual(entry.owner.length, 2);
});

test('18 resolveWrapperPlan rechaza módulo desconocido', () => {
  const map = { moduleDependencies: { CORE: [] } };
  expectError(() => resolveWrapperPlan({ map, aFiles: [], modules: ['NOPE'] }), 'MODULO_DESCONOCIDO');
});

test('19 resolveWrapperPlan lee google.script.run desde HTML', () => {
  const map = { moduleDependencies: { CORE: [] } };
  const aFiles = [
    fixtureFile('src/Dialogo.html', 'CORE', '<script>google.script.run.withFailureHandler(f).obtenerDatos();</script>'),
    fixtureFile('src/Servicio.js', 'CORE', 'function obtenerDatos() {}\n'),
  ];
  const plan = resolveWrapperPlan({ map, aFiles, modules: ['CORE'] });
  const entry = plan.entries.find((item) => item.functionName === 'obtenerDatos');
  assertEqual(entry.status, 'INCLUDED');
  assertDeepEqual(entry.kinds, ['run']);
});

test('20 renderWrapperStubs genera envoltorios genéricos con apply/arguments', () => {
  const plan = { requestedModules: ['CORE'], resolvedModules: ['CORE'], wrappers: ['abrirX', 'onOpen'] };
  const stub = renderWrapperStubs(plan, 'Core');
  assert(stub.includes('function abrirX() {'));
  assert(stub.includes('return Core.abrirX.apply(null, arguments);'));
  // onOpen es uno de los FUNCIONES_QUE_RECIBEN_MODULOS_INSTALADOS (ver
  // conversación -- moduloInstalado_() en la librería no puede leer
  // MODULOS_INSTALADOS_CLIENTE del cliente directamente): su envoltorio
  // recibe la constante como argumento explícito, no apply/arguments.
  assert(stub.includes('function onOpen() {'));
  assert(stub.includes('return Core.onOpen(MODULOS_INSTALADOS_CLIENTE);'));
});

test('21 parseArgs exige --modules', () => {
  expectError(() => parseArgs(['--output', 'x.js']), 'FALTA_MODULES');
});

test('22 parseArgs separa módulos por coma', () => {
  const parsed = parseArgs(['--modules', 'GANTT,CORE', '--user-symbol', 'Lib']);
  assertDeepEqual(parsed.modules, ['GANTT', 'CORE']);
  assertEqual(parsed.userSymbol, 'Lib');
});

test('23 proyecto real: selección de todos los módulos no deja huecos', () => {
  const map = readPackageMap();
  const validated = validateAndReadFiles(PROJECT_ROOT, map);
  const aFiles = validated.validatedFiles.filter((entry) => entry.package === 'A');
  const plan = resolveWrapperPlan({
    map, aFiles,
    modules: ['CORE', 'GANTT', 'ECONOMICO', 'IMPACTO', 'COMPRAS', 'CONVOCATORIAS', 'CLIENTE', 'VENTAS', 'OPORTUNIDAD', 'ESCENARIOS', 'OPERATIVA', 'SEGUIMIENTO', 'EJECUCION', 'APROVISIONAMIENTO']
  });
  assertDeepEqual(plan.gaps, []);
  assert(plan.wrappers.includes('onOpen'));
  assert(plan.wrappers.includes('onEdit'));
  assert(plan.wrappers.length > 150);
});

test('24 proyecto real: selección parcial GANTT revela huecos reales de COMPRAS/CONVOCATORIAS', () => {
  const map = readPackageMap();
  const validated = validateAndReadFiles(PROJECT_ROOT, map);
  const aFiles = validated.validatedFiles.filter((entry) => entry.package === 'A');
  const plan = resolveWrapperPlan({ map, aFiles, modules: ['GANTT'] });
  assert(plan.gaps.some((gap) => gap.functionName === 'abrirFichaMaterialBuscar' && gap.owner.module === 'COMPRAS'));
  assert(plan.gaps.every((gap) => gap.status !== 'UNRESOLVED' && gap.status !== 'DUPLICATE_DECLARATION'));
});

test('25 proyecto real: abrirGanttPlanReal se resuelve dentro de GANTT', () => {
  const map = readPackageMap();
  const validated = validateAndReadFiles(PROJECT_ROOT, map);
  const aFiles = validated.validatedFiles.filter((entry) => entry.package === 'A');
  const plan = resolveWrapperPlan({ map, aFiles, modules: ['GANTT'] });
  const entry = plan.entries.find((item) => item.functionName === 'abrirGanttPlanReal');
  assertEqual(entry.status, 'INCLUDED');
  assertEqual(entry.owner.module, 'GANTT');
});

async function main() {
  console.log(`ENGREMIAT_WRAPPERS_TEST_BEGIN tests=${tests.length}`);
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
  console.log(`ENGREMIAT_WRAPPERS_TEST_END result=${failures === 0 ? 'OK' : 'ERR'} failures=${failures}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

await main();
