import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  EXIT_CODES,
  aggregateHash,
  buildPackages,
  CANONICAL_SORT,
  canonicalPath,
  compareCanonicalPaths,
  createManifest,
  detectSuiteCalls,
  detectTestMarkers,
  maskNonCode,
  normalizeRelativePath,
  parseArgs,
  preservePrimaryError,
  readPackageMap,
  resolveModuleClosure,
  runCheck,
  safeCleanupTemp,
  validateContamination,
  validateAndReadFiles,
  validateCanonicalPathSet,
  validateOutputPath,
  validatePackageMap,
  validateUniverse,
} from './build-packages.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..', '..');
const MAP_PATH = path.join(HERE, 'package-map.json');
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
  assert(JSON.stringify(actual) === JSON.stringify(expected), message);
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

function sha256Text(text) {
  return crypto.createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ownTemp(prefix = 'engremiat-packager-test-') {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

function removeOwnTemp(tempPath) {
  const base = path.basename(tempPath);
  assert(base.startsWith('engremiat-packager-test-'), 'REFUSE_CLEANUP_FOREIGN_PATH');
  if (existsSync(tempPath)) rmSync(tempPath, { recursive: true, force: true });
}

const expectedTests = [
  'src/Tests_AvanceYSecuencia.js',
  'src/Tests_CosteService.js',
  'src/Tests_Ids.js',
  'src/Tests_ImportacionRecursosPersonas.js',
  'src/Tests_IntegridadGapReglasFuncional.js',
  'src/Tests_LecturaBatch.js',
  'src/Tests_ModulosInstalados.js',
  'src/Tests_Repository.js',
  'src/Tests_Repository2.js',
];

const expectedMixed = [];

test('01 universo de 175 entradas', () => {
  const map = readPackageMap(MAP_PATH);
  assertEqual(map.entries.length, 175);
  assertEqual(map.universeExpected, 175);
});

test('02 rutas únicas', () => {
  const map = readPackageMap(MAP_PATH);
  assertEqual(new Set(map.entries.map((entry) => entry.path)).size, 175);
});

test('03 categorías válidas y recuentos', () => {
  const map = readPackageMap(MAP_PATH);
  assertDeepEqual(validatePackageMap(map), []);
});

test('04 rechazo de ruta absoluta', () => {
  expectError(() => normalizeRelativePath(path.resolve(PROJECT_ROOT, 'src')), 'RUTA_ABSOLUTA');
});

test('05 rechazo de ruta padre', () => {
  expectError(() => normalizeRelativePath('../src/file.js'), 'RUTA_PADRE');
});

test('06 rechazo de archivo desconocido', () => {
  const root = ownTemp();
  try {
    writeFileSync(path.join(root, 'unknown.txt'), 'x', 'utf8');
    const result = validateUniverse(root, { entries: [], selfReferentialBaselines: [] });
    assert(result.errors.some((item) => item.includes('ARCHIVO_DESCONOCIDO')));
  } finally {
    removeOwnTemp(root);
  }
});

test('07 rechazo de archivo ausente', () => {
  const root = ownTemp();
  try {
    const map = { entries: [{ path: 'missing.txt', expectedSha256: sha256Text('x') }], selfReferentialBaselines: [] };
    const result = validateUniverse(root, map);
    assert(result.errors.some((item) => item.includes('ARCHIVO_AUSENTE')));
  } finally {
    removeOwnTemp(root);
  }
});

test('08 rechazo de hash modificado', () => {
  const root = ownTemp();
  try {
    writeFileSync(path.join(root, 'file.txt'), 'changed', 'utf8');
    const map = { entries: [{ path: 'file.txt', expectedSha256: sha256Text('expected') }], selfReferentialBaselines: [] };
    const result = validateUniverse(root, map);
    assert(result.errors.some((item) => item.includes('HASH_DIVERGENTE')));
  } finally {
    removeOwnTemp(root);
  }
});

test('09 exclusión de siete tests en A', () => {
  const map = readPackageMap(MAP_PATH);
  const aPaths = new Set(map.entries.filter((entry) => entry.package === 'A').map((entry) => entry.path));
  assert(expectedTests.every((item) => !aPaths.has(item)));
});

test('10 inclusión individual de nueve tests en B', () => {
  const map = readPackageMap(MAP_PATH);
  const bPaths = map.entries.filter((entry) => entry.package === 'B').map((entry) => entry.path).sort();
  assertDeepEqual(bPaths, [...expectedTests].sort());
});

test('11 repositorios de tests separados', () => {
  const map = readPackageMap(MAP_PATH);
  const first = map.entries.find((entry) => entry.path === 'src/Tests_Repository.js');
  const second = map.entries.find((entry) => entry.path === 'src/Tests_Repository2.js');
  assert(first && second && first !== second && first.expectedSha256 !== second.expectedSha256);
});

test('12 inclusión de 31 HTML en A', () => {
  const map = readPackageMap(MAP_PATH);
  assertEqual(map.entries.filter((entry) => entry.package === 'A' && entry.path.endsWith('.html')).length, 31);
});

test('13 inclusión de appsscript.json en A', () => {
  const map = readPackageMap(MAP_PATH);
  assert(map.entries.some((entry) => entry.path === 'src/appsscript.json' && entry.package === 'A'));
});

test('14 ningún archivo mixto (deuda cerrada)', () => {
  const map = readPackageMap(MAP_PATH);
  const mixed = map.entries.filter((entry) => entry.mixed).map((entry) => entry.path).sort();
  assertDeepEqual(mixed, [...expectedMixed].sort());
  const result = validateContamination(validateAndReadFiles(PROJECT_ROOT, map).validatedFiles);
  assert(expectedMixed.every((item) => result.warnings.some((warning) => warning.startsWith(`MIXED_ARCHITECTURE ${item} `))));
});

test('15 error por prueba en producción no mixta', () => {
  const root = ownTemp();
  try {
    mkdirSync(path.join(root, 'src'));
    writeFileSync(path.join(root, 'src', 'prod.js'), 'function pruebaNoDeclarada() {}\n', 'utf8');
    const map = { entries: [{ path: 'src/prod.js', package: 'A', mixed: false }] };
    const result = validateContamination(validateAndReadFiles(root, map).validatedFiles);
    assert(result.errors.some((item) => item.includes('EMBEDDED_TEST_CODE_IN_PRODUCTION')));
    assert(detectTestMarkers('function pruebaNoDeclarada() {}').length > 0);
  } finally {
    removeOwnTemp(root);
  }
});

test('16 rechazo de destino no vacío o preexistente', () => {
  const parent = ownTemp();
  try {
    const output = path.join(parent, 'out');
    mkdirSync(output);
    writeFileSync(path.join(output, 'occupied.txt'), 'x', 'utf8');
    expectError(() => validateOutputPath(PROJECT_ROOT, output), 'DESTINO_PREEXISTENTE');
  } finally {
    removeOwnTemp(parent);
  }
});

test('17 rechazo de raíz del proyecto', () => {
  expectError(() => validateOutputPath(PROJECT_ROOT, PROJECT_ROOT), 'DESTINO_PROHIBIDO');
});

test('18 rechazo de src y tooling', () => {
  expectError(() => validateOutputPath(PROJECT_ROOT, path.join(PROJECT_ROOT, 'src')), 'DESTINO_PROHIBIDO');
  expectError(() => validateOutputPath(PROJECT_ROOT, HERE), 'DESTINO_PROHIBIDO');
});

test('19 ausencia de escritura en check', () => {
  const before = readdirSync(HERE).sort();
  const map = readPackageMap(MAP_PATH);
  runCheck({ projectRoot: PROJECT_ROOT, map, packages: ['A'] });
  const after = readdirSync(HERE).sort();
  assertDeepEqual(after, before);
});

test('20 limpieza del temporal tras fallo', () => {
  const parent = ownTemp();
  try {
    const output = path.join(parent, 'result');
    const badMap = { entries: [{ path: 'missing.js', package: 'A', category: 'production', type: 'js', mixed: false, reason: 'fixture' }] };
    expectError(() => buildPackages({ projectRoot: parent, map: badMap, packages: ['A'], outputPath: output, runId: 'TEST', builtAt: '2000-01-01T00:00:00.000Z' }), 'NO_SE_PUEDE_LEER');
    assert(!existsSync(output));
    assert(!readdirSync(parent).some((name) => name.startsWith('.engremiat-packager-')));
  } finally {
    removeOwnTemp(parent);
  }
});

test('21 no sobrescritura', () => {
  const parent = ownTemp();
  try {
    const output = path.join(parent, 'existing');
    mkdirSync(output);
    expectError(() => validateOutputPath(PROJECT_ROOT, output), 'DESTINO_PREEXISTENTE');
  } finally {
    removeOwnTemp(parent);
  }
});

test('22 hash agregado estable ante orden distinto', () => {
  const entries = [
    { path: 'b', sha256: 'b'.repeat(64), size: 2 },
    { path: 'a', sha256: 'a'.repeat(64), size: 1 },
  ];
  assertEqual(aggregateHash(entries), aggregateHash([...entries].reverse()));
});

test('23 hash agregado independiente de fecha y raíz', () => {
  const entries = [{ path: 'a', sha256: 'a'.repeat(64), size: 1 }];
  const hash = aggregateHash(entries);
  assertEqual(hash, aggregateHash(entries.map((entry) => ({ ...entry, builtAt: 'other', sourceRoot: '/other' }))));
});

test('24 manifiesto determinista con metadatos fijados', () => {
  const map = readPackageMap(MAP_PATH);
  const entries = map.entries.filter((entry) => entry.package === 'A').map((entry) => ({ ...entry, size: 1, sha256: entry.expectedSha256 }));
  const args = { projectRoot: PROJECT_ROOT, map, packageName: 'A', entries, builtAt: '2000-01-01T00:00:00.000Z' };
  assertDeepEqual(createManifest(args), createManifest(args));
});

test('25 códigos de salida y argumentos', () => {
  assertDeepEqual(EXIT_CODES, { OK: 0, CONTRACT: 1, ARGUMENTS: 2, READ: 3, UNSAFE_DESTINATION: 4, INCOMPLETE_BUILD: 5 });
  assert(parseArgs([]).helpOnly);
  expectError(() => parseArgs(['--check', '--all', '--unknown']), 'ARGUMENTO_DESCONOCIDO');
  expectError(() => parseArgs(['--build', '--all']), 'BUILD_REQUIERE_OUTPUT');
});

function contaminationForSource(sourceText, { mixed = false, packageName = 'A', reason = 'fixture' } = {}) {
  const root = ownTemp();
  try {
    mkdirSync(path.join(root, 'src'));
    writeFileSync(path.join(root, 'src', 'sample.js'), sourceText, 'utf8');
    const map = { entries: [{ path: 'src/sample.js', package: packageName, mixed, reason }] };
    return validateContamination(validateAndReadFiles(root, map).validatedFiles);
  } finally {
    removeOwnTemp(root);
  }
}

function contaminationForFiles(records) {
  const root = ownTemp();
  try {
    for (const record of records) {
      const destination = path.join(root, ...record.path.split('/'));
      mkdirSync(path.dirname(destination), { recursive: true });
      writeFileSync(destination, record.source, 'utf8');
    }
    const map = {
      entries: records.map(({ path: recordPath, packageName = 'A', mixed = true, reason = 'fixture' }) => ({
        path: recordPath,
        package: packageName,
        mixed,
        reason,
      })),
    };
    return validateContamination(validateAndReadFiles(root, map).validatedFiles);
  } finally {
    removeOwnTemp(root);
  }
}

test('26 declaración function prueba en producción produce ERR', () => {
  const result = contaminationForSource('function pruebaCaso() {}\n');
  assert(result.errors.some((item) => item.includes('EMBEDDED_TEST_CODE_IN_PRODUCTION')));
});

test('27 declaración function test en producción produce ERR', () => {
  const result = contaminationForSource('function testCaso() {}\n');
  assert(result.errors.some((item) => item.includes('EMBEDDED_TEST_CODE_IN_PRODUCTION')));
});

test('28 ejecutor de suite declarado en producción produce ERR', () => {
  const result = contaminationForSource('function ejecutarSuiteCaso() {}\n');
  assert(result.errors.some((item) => item.includes('name=ejecutarSuiteCaso')));
});

test('29 llamada ejecutarSuite externa desde producción produce ERR', () => {
  const result = contaminationForSource('ejecutarSuiteExterna();\n');
  assert(result.errors.some((item) => item.includes('SUITE_CALL_IN_PRODUCTION src/sample.js line=1 type=llamada name=ejecutarSuiteExterna')));
});

test('30 nombre de prueba en string simple se ignora', () => {
  const source = "const texto = 'function pruebaFalsa() {}; ejecutarSuiteOculta();';\n";
  assertDeepEqual(detectTestMarkers(source), []);
  assertDeepEqual(detectSuiteCalls(source), []);
});

test('31 nombre de prueba en string doble se ignora', () => {
  const source = 'const texto = "function pruebaFalsa() {}; ejecutarSuiteOculta();";\n';
  assertDeepEqual(detectTestMarkers(source), []);
  assertDeepEqual(detectSuiteCalls(source), []);
});

test('32 nombre de prueba en template literal se ignora', () => {
  const source = 'const texto = `function pruebaFalsa() {}; ejecutarSuiteOculta();`;\n';
  assertDeepEqual(detectTestMarkers(source), []);
  assertDeepEqual(detectSuiteCalls(source), []);
});

test('33 nombre de prueba en comentario de línea se ignora', () => {
  const source = '// function pruebaFalsa() {}; ejecutarSuiteOculta();\nconst valor = 1;\n';
  assertDeepEqual(detectTestMarkers(source), []);
  assertDeepEqual(detectSuiteCalls(source), []);
});

test('34 nombre de prueba en comentario de bloque se ignora', () => {
  const source = '/* function pruebaFalsa() {}; ejecutarSuiteOculta(); */\nconst valor = 1;\n';
  assertDeepEqual(detectTestMarkers(source), []);
  assertDeepEqual(detectSuiteCalls(source), []);
});

test('35 archivo B permite declaraciones de prueba', () => {
  const result = contaminationForSource('function pruebaPermitida() {}\n', { packageName: 'B' });
  assertDeepEqual(result, { errors: [], warnings: [], evidence: [] });
});

test('36 proyecto real no publica ningún MIXED_ARCHITECTURE', () => {
  const map = readPackageMap(MAP_PATH);
  const result = validateContamination(validateAndReadFiles(PROJECT_ROOT, map).validatedFiles);
  assertDeepEqual(result.warnings.filter((item) => item.startsWith('MIXED_ARCHITECTURE ')), []);
});

test('37 Ids.js real queda sin prueba embebida tras extracción a Tests_Ids.js', () => {
  const map = readPackageMap(MAP_PATH);
  const result = validateContamination(validateAndReadFiles(PROJECT_ROOT, map).validatedFiles);
  assert(!result.warnings.some((item) => item.startsWith('EMBEDDED_TEST_CODE path=src/Ids.js ')));
});

test('38 Repository.js real queda sin prueba embebida tras extracción a Tests_Repository2.js', () => {
  const map = readPackageMap(MAP_PATH);
  const result = validateContamination(validateAndReadFiles(PROJECT_ROOT, map).validatedFiles);
  assert(!result.warnings.some((item) => item.startsWith('EMBEDDED_TEST_CODE path=src/Repository.js ')));
});

test('39 mixto sin pruebas no declara EMBEDDED_TEST_CODE', () => {
  const result = contaminationForSource('function guardarDato() {}\n', { mixed: true });
  assert(result.warnings.some((item) => item.startsWith('MIXED_ARCHITECTURE src/sample.js ')));
  assert(!result.warnings.some((item) => item.startsWith('EMBEDDED_TEST_CODE')));
});

test('40 evidencia informa línea correcta', () => {
  const markers = detectTestMarkers('const valor = 1;\n\nfunction probarLineaTres() {}\n');
  assertEqual(markers[0].line, 3);
});

test('41 Código.js real es llamada y no declaración', () => {
  const source = readFileSync(path.join(PROJECT_ROOT, 'src', 'Código.js'), 'utf8');
  assertDeepEqual(detectTestMarkers(source), []);
});

test('42 IntegrityService.js real queda sin prueba embebida tras extracción', () => {
  const source = readFileSync(path.join(PROJECT_ROOT, 'src', 'IntegrityService.js'), 'utf8');
  const markers = detectTestMarkers(source);
  assert(!markers.some((item) => item.name === 'probarReporteIntegridad'));
});

test('43 análisis léxico ambiguo no produce falso OK', () => {
  const result = contaminationForSource("const texto = 'sin cierre\n");
  assert(result.warnings.some((item) => item.startsWith('AMBIGUOUS_TEST_ANALYSIS')));
});

test('44 probarReporteIntegridad en producción produce ERR', () => {
  const result = contaminationForSource('function probarReporteIntegridad() {}\n');
  assert(result.errors.some((item) => item.includes('EMBEDDED_TEST_CODE_IN_PRODUCTION')));
});

test('45 probarReporteIntegridad en B está permitida', () => {
  const result = contaminationForSource('function probarReporteIntegridad() {}\n', { packageName: 'B' });
  assertDeepEqual(result, { errors: [], warnings: [], evidence: [] });
});

test('46 Código.js en A llamando a suite produce ERR', () => {
  const source = readFileSync(path.join(PROJECT_ROOT, 'src', 'Código.js'), 'utf8');
  const result = contaminationForSource(source);
  assert(result.errors.some((item) => item.includes('SUITE_CALL_IN_PRODUCTION')));
});

test('47 Código.js en C produce WARN y no ERR', () => {
  const map = readPackageMap(MAP_PATH);
  const result = validateContamination(validateAndReadFiles(PROJECT_ROOT, map).validatedFiles);
  assert(result.warnings.some((item) => item.startsWith('APPROVED_SUITE_RUNNER src/Código.js ')));
  assert(!result.errors.some((item) => item.includes('src/Código.js')));
});

test('48 llamada externa normal en producción está permitida', () => {
  const result = contaminationForSource('procesarDatosExternos();\n');
  assertDeepEqual(result.errors, []);
});

test('49 matriz clasifica Código.js como auxiliary C', () => {
  const map = readPackageMap(MAP_PATH);
  const entry = map.entries.find((item) => item.path === 'src/Código.js');
  assert(entry && entry.category === 'auxiliary' && entry.package === 'C' && entry.mixed === false);
});

test('50 hashes nuevos de archivos de integridad', () => {
  const integrity = readFileSync(path.join(PROJECT_ROOT, 'src', 'IntegrityService.js'));
  const testsIntegrity = readFileSync(path.join(PROJECT_ROOT, 'src', 'Tests_IntegridadGapReglasFuncional.js'));
  assertEqual(crypto.createHash('sha256').update(integrity).digest('hex'), '4b577520a22c6c76398a45cbf8718dd4afb84bd3e8c5a42def33e74557194fd1');
  assertEqual(crypto.createHash('sha256').update(testsIntegrity).digest('hex'), 'cb3f158d590be214e875d00a8585e4a8db278be577a321cb261a3f345c2576de');
});

test('51 recuento actualizado de categorías y paquetes', () => {
  const map = readPackageMap(MAP_PATH);
  const count = (field, value) => map.entries.filter((entry) => entry[field] === value).length;
  assertDeepEqual([count('category', 'production'), count('category', 'test'), count('category', 'auxiliary'), count('category', 'excluded'), count('category', 'mixed')], [101, 9, 37, 28, 0]);
  assertDeepEqual([count('package', 'A'), count('package', 'B'), count('package', 'C'), count('package', 'NONE')], [101, 9, 37, 28]);
});

test('52 única declaración global de probarReporteIntegridad', () => {
  const production = readFileSync(path.join(PROJECT_ROOT, 'src', 'IntegrityService.js'), 'utf8');
  const testsSource = readFileSync(path.join(PROJECT_ROOT, 'src', 'Tests_IntegridadGapReglasFuncional.js'), 'utf8');
  const declarations = [...detectTestMarkers(production), ...detectTestMarkers(testsSource)].filter((item) => item.name === 'probarReporteIntegridad');
  assertEqual(declarations.length, 1);
});

test('53 ausencia de probarReporteIntegridad en IntegrityService.js', () => {
  const source = readFileSync(path.join(PROJECT_ROOT, 'src', 'IntegrityService.js'), 'utf8');
  assert(!source.includes('function probarReporteIntegridad'));
});

test('54 varias pruebas en mixto producen un WARN público', () => {
  const result = contaminationForSource('function probarUno() {}\nfunction probarDos() {}\n', { mixed: true });
  assertEqual(result.warnings.filter((item) => item.startsWith('EMBEDDED_TEST_CODE ')).length, 1);
  assert(result.warnings.some((item) => item.includes('matches=2')));
});

test('55 evidencia detallada conserva todas las coincidencias', () => {
  const result = contaminationForSource('function probarUno() {}\nfunction probarDos() {}\n', { mixed: true });
  assertDeepEqual(result.evidence.map((item) => item.name), ['probarUno', 'probarDos']);
});

test('56 líneas públicas se ordenan y deduplican', () => {
  const result = contaminationForSource('function probarUno() {} function probarDos() {}\nfunction probarTres() {}\n', { mixed: true });
  assert(result.warnings.some((item) => item.includes('matches=3 lines=1,2')));
});

test('57 dos mixtos con pruebas producen dos WARN públicos', () => {
  const result = contaminationForFiles([
    { path: 'src/z.js', source: 'function probarZ() {}\n' },
    { path: 'src/a.js', source: 'function probarA() {}\n' },
  ]);
  assertEqual(result.warnings.filter((item) => item.startsWith('EMBEDDED_TEST_CODE ')).length, 2);
});

test('58 recuento esperado en 0 no produce falso RECUENTO_ (regresión: undefined !== 0)', () => {
  const map = readPackageMap(MAP_PATH);
  assertDeepEqual(validatePackageMap(map), []);
  assert(!map.entries.some((entry) => entry.mixed), 'no debería quedar ningún entry.mixed=true');
});

test('59 regex con comilla simple no abre string', () => {
  assertDeepEqual(maskNonCode("const patron = /'/;\n").ambiguities, []);
});

test('60 regex con comilla doble no abre string', () => {
  assertDeepEqual(maskNonCode('const patron = /"/;\n').ambiguities, []);
});

test('61 regex con barra escapada se reconoce', () => {
  assertDeepEqual(maskNonCode('const patron = /a\\/b/;\n').ambiguities, []);
});

test('62 regex con clase de comillas se reconoce', () => {
  assertDeepEqual(maskNonCode('const patron = /["\u0027]/;\n').ambiguities, []);
});

test('63 regex con barra dentro de clase se reconoce', () => {
  assertDeepEqual(maskNonCode('const patron = /[/]/;\n').ambiguities, []);
});

test('64 regex con flags se reconoce', () => {
  assertDeepEqual(maskNonCode('const patron = /abc/giu;\n').ambiguities, []);
});

test('65 división numérica no es regex', () => {
  assertDeepEqual(maskNonCode('const valor = 10 / 2;\n').ambiguities, []);
});

test('66 división entre identificadores no es regex', () => {
  assertDeepEqual(maskNonCode('const valor = total / cantidad;\n').ambiguities, []);
});

test('67 comentario después de división se reconoce', () => {
  assertDeepEqual(maskNonCode('const valor = total / cantidad; // comentario\n').ambiguities, []);
});

test('68 contexto ambiguo de slash produce WARN léxico', () => {
  assert(maskNonCode('if (ok) {} /posible/;\n').ambiguities.some((item) => item.reason === 'AMBIGUOUS_SLASH_CONTEXT'));
});

test('69 literal realmente sin cerrar conserva ambigüedad', () => {
  assert(maskNonCode("const texto = 'sin cierre\n").ambiguities.some((item) => item.reason === 'UNTERMINATED_SINGLE_STRING'));
});

test('70 DesviacionService real no presenta ambigüedad', () => {
  const source = readFileSync(path.join(PROJECT_ROOT, 'src', 'DesviacionService.js'), 'utf8');
  assertDeepEqual(maskNonCode(source).ambiguities, []);
});

test('71 ReportService real no presenta ambigüedad', () => {
  const source = readFileSync(path.join(PROJECT_ROOT, 'src', 'ReportService.js'), 'utf8');
  assertDeepEqual(maskNonCode(source).ambiguities, []);
});

test('72 salida consolidada es determinista con orden distinto', () => {
  const records = [
    { path: 'src/z.js', source: 'function probarZ() {}\n' },
    { path: 'src/a.js', source: 'function probarA() {}\n' },
  ];
  assertDeepEqual(contaminationForFiles(records), contaminationForFiles([...records].reverse()));
});

test('73 proyecto real ya no publica EMBEDDED_TEST_CODE tras cerrar la deuda de Ids.js/Repository.js', () => {
  const map = readPackageMap(MAP_PATH);
  const result = validateContamination(validateAndReadFiles(PROJECT_ROOT, map).validatedFiles);
  assertEqual(result.warnings.filter((item) => item.startsWith('EMBEDDED_TEST_CODE ')).length, 0);
});

function validatedFixture(source, overrides = {}) {
  const root = ownTemp();
  const relative = overrides.path ?? 'src/fixture.js';
  const destination = path.join(root, ...relative.split('/'));
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, source, 'utf8');
  const entry = { path: relative, package: 'A', category: 'production', type: 'js', mixed: false, reason: 'fixture', expectedSha256: sha256Text(source), ...overrides };
  return { root, destination, map: { entries: [entry], selfReferentialBaselines: [] } };
}

test('74 archivo ausente conserva NO_SE_PUEDE_LEER', () => {
  const root = ownTemp();
  try {
    expectError(() => validateAndReadFiles(root, { entries: [{ path: 'missing.js' }] }), 'NO_SE_PUEDE_LEER missing.js');
  } finally { removeOwnTemp(root); }
});

test('75 archivo se lee una sola vez por validaciÃ³n', () => {
  const fixture = validatedFixture('function produccion() {}\n');
  try {
    const [file] = validateAndReadFiles(fixture.root, fixture.map).validatedFiles;
    assertEqual(file.sha256, sha256Text(file.content));
    assertEqual(file.size, file.buffer.length);
    rmSync(fixture.destination);
    assertEqual(file.content, 'function produccion() {}\n');
  } finally { removeOwnTemp(fixture.root); }
});

test('76 detector consume evidencia en memoria sin releer ruta', () => {
  const fixture = validatedFixture('function probarCaso() {}\n', { mixed: true });
  try {
    const files = validateAndReadFiles(fixture.root, fixture.map).validatedFiles;
    rmSync(fixture.destination);
    assert(validateContamination(files).warnings.some((item) => item.startsWith('EMBEDDED_TEST_CODE ')));
  } finally { removeOwnTemp(fixture.root); }
});

test('77 mutaciÃ³n posterior no altera evidencia ya validada', () => {
  const fixture = validatedFixture('function probarOriginal() {}\n', { mixed: true });
  try {
    const files = validateAndReadFiles(fixture.root, fixture.map).validatedFiles;
    writeFileSync(fixture.destination, 'function produccion() {}\n', 'utf8');
    assert(validateContamination(files).evidence.some((item) => item.name === 'probarOriginal'));
  } finally { removeOwnTemp(fixture.root); }
});

test('78 fallo previo al temporal no deja temporal', () => {
  const root = ownTemp();
  try {
    expectError(() => buildPackages({ projectRoot: root, map: { entries: [{ path: 'missing.js', package: 'A' }] }, packages: ['A'], outputPath: path.join(root, 'out'), runId: 'FIX05' }), 'NO_SE_PUEDE_LEER');
    assert(!readdirSync(root).some((name) => name.startsWith('.engremiat-packager-')));
  } finally { removeOwnTemp(root); }
});

test('79 error posterior limpia solo temporal propio', () => {
  const root = ownTemp();
  try {
    const owned = mkdtempSync(path.join(root, '.engremiat-packager-'));
    const primary = new Error('FALLO_POSTERIOR');
    preservePrimaryError(primary, () => safeCleanupTemp(owned, root));
    assert(!existsSync(owned));
    assert(existsSync(root));
  } finally { removeOwnTemp(root); }
});

test('80 fallo de cleanup queda como detalle secundario', () => {
  const root = ownTemp();
  try {
    const primary = expectError(() => validateAndReadFiles(root, { entries: [{ path: 'missing.js' }] }), 'NO_SE_PUEDE_LEER');
    const preserved = preservePrimaryError(primary, () => { throw new Error('CLEANUP_SECUNDARIO'); });
    assertEqual(preserved.message, primary.message);
    assertEqual(preserved.details.cleanupError, 'CLEANUP_SECUNDARIO');
  } finally { removeOwnTemp(root); }
});

test('81 hash divergente precede anÃ¡lisis de contaminaciÃ³n', () => {
  const fixture = validatedFixture('function probarCaso() {}\n', { expectedSha256: '0'.repeat(64) });
  try {
    const result = validateAndReadFiles(fixture.root, fixture.map);
    assert(result.errors[0].startsWith('HASH_DIVERGENTE '));
  } finally { removeOwnTemp(fixture.root); }
});

test('82 contenido con hash correcto habilita detector', () => {
  const fixture = validatedFixture('function probarCaso() {}\n');
  try {
    const files = validateAndReadFiles(fixture.root, fixture.map).validatedFiles;
    assert(validateContamination(files).errors.some((item) => item.startsWith('EMBEDDED_TEST_CODE_IN_PRODUCTION ')));
  } finally { removeOwnTemp(fixture.root); }
});

test('83 symlink se rechaza antes de la lectura', () => {
  const source = readFileSync(path.join(HERE, 'build-packages.mjs'), 'utf8');
  const validation = source.slice(source.indexOf('export function validateAndReadFiles'), source.indexOf('export function maskNonCode'));
  assert(validation.indexOf('assertRegularNoSymlink') < validation.indexOf('validateUniverse'));
});

test('84 contaminaciÃ³n solo se analiza tras hash correcto', () => {
  const fixture = validatedFixture('function probarCaso() {}\n', { expectedSha256: '0'.repeat(64) });
  try {
    const validated = validateAndReadFiles(fixture.root, fixture.map);
    assert(validated.errors.some((item) => item.startsWith('HASH_DIVERGENTE ')));
    assert(!validated.errors.some((item) => item.includes('CONTAMINACION')));
  } finally { removeOwnTemp(fixture.root); }
});

test('85 caso 20 conserva nombre y expectativa NO_SE_PUEDE_LEER', () => {
  const source = readFileSync(path.join(HERE, 'build-packages.test.mjs'), 'utf8');
  assert(source.includes("test('20 limpieza del temporal tras fallo'"));
  assert(source.includes("}), 'NO_SE_PUEDE_LEER');"));
});

test('86 embeddedTestEvidence queda vacía tras cerrar la deuda de Ids.js/Repository.js', () => {
  const result = validateAndReadFiles(PROJECT_ROOT, readPackageMap(MAP_PATH));
  assertEqual(validateContamination(result.validatedFiles).evidence.length, 0);
});

test('87 consolidación pública ya no publica EMBEDDED_TEST_CODE', () => {
  const result = validateAndReadFiles(PROJECT_ROOT, readPackageMap(MAP_PATH));
  assertEqual(validateContamination(result.validatedFiles).warnings.filter((item) => item.startsWith('EMBEDDED_TEST_CODE ')).length, 0);
});

test('88 salida determinista ante error', () => {
  const root = ownTemp();
  try {
    const map = { entries: [{ path: 'z.js' }, { path: 'a.js' }] };
    const first = expectError(() => validateAndReadFiles(root, map), 'NO_SE_PUEDE_LEER').message;
    const second = expectError(() => validateAndReadFiles(root, { entries: [...map.entries].reverse() }), 'NO_SE_PUEDE_LEER').message;
    assertEqual(first, second);
  } finally { removeOwnTemp(root); }
});

test('89 check sigue sin crear temporal de construcciÃ³n', () => {
  const before = readdirSync(PROJECT_ROOT).filter((name) => name.startsWith('.engremiat-packager-')).sort();
  runCheck({ projectRoot: PROJECT_ROOT, map: readPackageMap(MAP_PATH), packages: ['A'] });
  const after = readdirSync(PROJECT_ROOT).filter((name) => name.startsWith('.engremiat-packager-')).sort();
  assertDeepEqual(after, before);
});

const canonicalEntries = [
  { path: 'src/appsscript.json', package: 'A', type: 'json', category: 'production', size: 1, sha256: 'a'.repeat(64) },
  { path: 'src/AvanceYSecuencia.js', package: 'A', type: 'js', category: 'production', size: 2, sha256: 'b'.repeat(64) },
  { path: 'src/Repository_InsertarRegistro.js', package: 'A', type: 'js', category: 'production', size: 3, sha256: 'c'.repeat(64) },
  { path: 'src/Repository.js', package: 'A', type: 'js', category: 'production', size: 4, sha256: 'd'.repeat(64) },
];

test('90 appsscript se ordena despuÃ©s de Avance por bytes UTF-8', () => {
  assert(compareCanonicalPaths('src/AvanceYSecuencia.js', 'src/appsscript.json') < 0);
});

test('91 Repository punto precede Repository guion bajo', () => {
  assert(compareCanonicalPaths('src/Repository.js', 'src/Repository_InsertarRegistro.js') < 0);
});

test('92 mayÃºsculas y minÃºsculas no se pliegan', () => {
  assert(compareCanonicalPaths('A.js', 'a.js') < 0);
});

test('93 ruta Codigo usa escapes Unicode y bytes UTF-8 NFC', () => {
  const expected = "src/C\u00F3digo.js";
  const actual = canonicalPath("src/Co\u0301digo.js");
  assertEqual(actual, expected);
  assertEqual(actual, actual.normalize("NFC"));
  assert(compareCanonicalPaths(expected, "src/D.js") < 0);
  assertDeepEqual([...expected].map((character) => `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`), [
    'U+0073', 'U+0072', 'U+0063', 'U+002F', 'U+0043', 'U+00F3', 'U+0064', 'U+0069', 'U+0067', 'U+006F', 'U+002E', 'U+006A', 'U+0073',
  ]);
  const unicodeFixtures = [expected, "src/Co\u0301digo.js", "src/Caf\u00E9.js", "src/Cafe\u0301.js"];
  for (const fixture of unicodeFixtures) {
    for (const forbidden of ["\u00C3", "\u00C2", "\uFFFD"]) assert(!fixture.includes(forbidden));
  }
});

test('94 compuesto y descompuesto producen misma ruta NFC', () => {
  const composed = "src/Caf\u00E9.js";
  const decomposed = "src/Cafe\u0301.js";
  assert(composed !== decomposed);
  assertDeepEqual([...composed.slice(4, 8)].map((character) => character.codePointAt(0)), [0x43, 0x61, 0x66, 0x00E9]);
  assertDeepEqual([...decomposed.slice(4, 9)].map((character) => character.codePointAt(0)), [0x43, 0x61, 0x66, 0x65, 0x0301]);
  assertEqual(canonicalPath(composed), canonicalPath(decomposed));
  assertEqual(canonicalPath(composed), "src/Caf\u00E9.js");
});

test('95 colisiÃ³n NFC produce CANONICAL_PATH_COLLISION', () => {
  const composed = "src/Caf\u00E9.js";
  const decomposed = "src/Cafe\u0301.js";
  assert(composed !== decomposed);
  assertEqual(canonicalPath(composed), canonicalPath(decomposed));
  const result = validateCanonicalPathSet([composed, decomposed]);
  assert(result.errors.some((item) => item.startsWith('CANONICAL_PATH_COLLISION ')));
  assertEqual(result.warnings.length, 0);
});

test('96 duplicado exacto produce DUPLICATE_CANONICAL_PATH', () => {
  const result = validateCanonicalPathSet(['src/a.js', 'src/a.js']);
  assert(result.errors.some((item) => item.startsWith('DUPLICATE_CANONICAL_PATH ')));
});

test('97 colisiÃ³n insensible a mayÃºsculas produce WARN', () => {
  const result = validateCanonicalPathSet(['src/A.js', 'src/a.js']);
  assert(result.warnings.some((item) => item.startsWith('CASE_INSENSITIVE_PATH_COLLISION ')));
});

test('98 orden no depende de locale espaÃ±ol', () => {
  const paths = canonicalEntries.map((entry) => entry.path);
  assertDeepEqual([...paths].sort(compareCanonicalPaths), [...paths].sort(compareCanonicalPaths));
});

test('99 orden no depende de locale inglÃ©s', () => {
  assert(compareCanonicalPaths('src/n.js', 'src/Ã±.js') < 0);
});

test('100 orden independiente del orden de entrada', () => {
  const first = canonicalEntries.map((entry) => entry.path).sort(compareCanonicalPaths);
  const second = [...canonicalEntries].reverse().map((entry) => entry.path).sort(compareCanonicalPaths);
  assertDeepEqual(first, second);
});

test('101 orden independiente de readdir', () => {
  const names = ['z.js', 'A.js', 'a.js', "C\u00F3digo.js"];
  assertDeepEqual([...names].sort(compareCanonicalPaths), [...names].reverse().sort(compareCanonicalPaths));
});

function canonicalManifestFor(packageName) {
  const entries = canonicalEntries.map((entry) => ({ ...entry, package: packageName }));
  return createManifest({ projectRoot: PROJECT_ROOT, map: { entries: [] }, packageName, entries, allValidatedFiles: entries, builtAt: '2000-01-01T00:00:00.000Z' });
}

function assertManifestCanonical(packageName) {
  const paths = canonicalManifestFor(packageName).entries.map((entry) => entry.path);
  assertDeepEqual(paths, [...paths].sort(compareCanonicalPaths));
}

test('102 manifiesto A ordenado canÃ³nicamente', () => assertManifestCanonical('A'));
test('103 manifiesto B ordenado canÃ³nicamente', () => assertManifestCanonical('B'));
test('104 manifiesto C ordenado canÃ³nicamente', () => assertManifestCanonical('C'));

test('105 informe de validaciÃ³n usa evidencia ordenada', () => {
  const records = [
    { ...canonicalEntries[0], content: 'function probarZ() {}\n', mixed: true, reason: 'fixture' },
    { ...canonicalEntries[1], content: 'function probarA() {}\n', mixed: true, reason: 'fixture' },
  ];
  const paths = validateContamination(records).evidence.map((item) => item.path);
  assertDeepEqual(paths, [...paths].sort(compareCanonicalPaths));
});

test('106 evidencia incrustada ordenada por ruta lÃ­nea y nombre', () => {
  const result = contaminationForFiles([
    { path: 'src/z.js', source: 'function probarZ() {}\n' },
    { path: 'src/A.js', source: 'function probarA() {}\n' },
  ]);
  assert(compareCanonicalPaths(result.evidence[0].path, result.evidence[1].path) < 0);
});

test('107 hash agregado estable ante orden distinto', () => {
  assertEqual(aggregateHash(canonicalEntries), aggregateHash([...canonicalEntries].reverse()));
});

test('108 hash agregado cambia si cambia ruta', () => {
  const changed = canonicalEntries.map((entry, index) => index === 0 ? { ...entry, path: 'src/otro.json' } : entry);
  assert(aggregateHash(canonicalEntries) !== aggregateHash(changed));
});

test('109 hash agregado cambia si cambia contenido', () => {
  const changed = canonicalEntries.map((entry, index) => index === 0 ? { ...entry, sha256: 'f'.repeat(64) } : entry);
  assert(aggregateHash(canonicalEntries) !== aggregateHash(changed));
});

test('110 metadatos temporales no alteran hash', () => {
  assertEqual(aggregateHash(canonicalEntries), aggregateHash(canonicalEntries.map((entry) => ({ ...entry, builtAt: 'otro', temp: 'otra-ruta' }))));
});

test('111 manifiesto declara UTF8_NFC_BYTEWISE_V1', () => {
  assertDeepEqual(canonicalManifestFor('A').canonicalSort, CANONICAL_SORT);
});

test('112 ausencia de localeCompare en rutas canÃ³nicas', () => {
  const source = readFileSync(path.join(HERE, 'build-packages.mjs'), 'utf8');
  assert(!source.includes(`locale${'Compare'}`));
});

test('113 comparaciÃ³n canÃ³nica usa Buffer.compare sin locale', () => {
  const source = readFileSync(path.join(HERE, 'build-packages.mjs'), 'utf8');
  assert(source.includes("Buffer.compare(Buffer.from(canonicalPath(left), 'utf8'), Buffer.from(canonicalPath(right), 'utf8'))"));
});

test('114 recuento de módulos en package A', () => {
  const map = readPackageMap(MAP_PATH);
  const count = (moduleName) => map.entries.filter((entry) => entry.package === 'A' && entry.module === moduleName).length;
  assertDeepEqual(
    {
      CORE: count('CORE'),
      GANTT: count('GANTT'),
      ECONOMICO: count('ECONOMICO'),
      IMPACTO: count('IMPACTO'),
      COMPRAS: count('COMPRAS'),
      CONVOCATORIAS: count('CONVOCATORIAS'),
      CLIENTE: count('CLIENTE'),
      VENTAS: count('VENTAS'),
      OPORTUNIDAD: count('OPORTUNIDAD'),
    },
    { CORE: 79, GANTT: 3, ECONOMICO: 1, IMPACTO: 1, COMPRAS: 7, CONVOCATORIAS: 2, CLIENTE: 3, VENTAS: 3, OPORTUNIDAD: 2 },
  );
});

test('115 entradas fuera de package A no declaran módulo', () => {
  const map = readPackageMap(MAP_PATH);
  assert(map.entries.filter((entry) => entry.package !== 'A').every((entry) => entry.module === null));
});

test('116 moduleDependencies declara exactamente los nueve módulos válidos', () => {
  const map = readPackageMap(MAP_PATH);
  assertDeepEqual(
    Object.keys(map.moduleDependencies).sort(),
    ['CLIENTE', 'COMPRAS', 'CONVOCATORIAS', 'CORE', 'ECONOMICO', 'GANTT', 'IMPACTO', 'OPORTUNIDAD', 'VENTAS'],
  );
});

test('117 resolveModuleClosure resuelve cierre transitivo', () => {
  const map = readPackageMap(MAP_PATH);
  const closure = resolveModuleClosure(['IMPACTO'], map.moduleDependencies);
  assertDeepEqual([...closure].sort(), ['CORE', 'ECONOMICO', 'IMPACTO']);
});

test('118 resolveModuleClosure sin dependencias devuelve solo el módulo pedido', () => {
  const map = readPackageMap(MAP_PATH);
  const closure = resolveModuleClosure(['CORE'], map.moduleDependencies);
  assertDeepEqual([...closure], ['CORE']);
});

test('119 --modules exige selección exclusiva frente a --package y --all', () => {
  expectError(() => parseArgs(['--check', '--modules', 'CORE', '--package', 'A']), 'SELECCION_REQUIERE_PACKAGE_O_ALL_O_MODULES');
  expectError(() => parseArgs(['--check', '--modules', 'CORE', '--all']), 'SELECCION_REQUIERE_PACKAGE_O_ALL_O_MODULES');
  const parsed = parseArgs(['--check', '--modules', 'GANTT,CORE']);
  assertDeepEqual(parsed.modules, ['GANTT', 'CORE']);
});

test('120 runCheck rechaza módulo desconocido', () => {
  const map = readPackageMap(MAP_PATH);
  const result = runCheck({ projectRoot: PROJECT_ROOT, map, packages: ['A'], modules: ['NOPE'] });
  assert(result.errors.some((item) => item.includes('MODULO_DESCONOCIDO')));
});

test('121 runCheck acepta un módulo hoja válido', () => {
  const map = readPackageMap(MAP_PATH);
  const result = runCheck({ projectRoot: PROJECT_ROOT, map, packages: ['A'], modules: ['GANTT'] });
  assertDeepEqual(result.errors, []);
});

test('122 buildPackages filtra archivos por cierre de módulos', () => {
  const map = readPackageMap(MAP_PATH);
  const parent = ownTemp();
  try {
    const output = path.join(parent, 'out');
    const built = buildPackages({ projectRoot: PROJECT_ROOT, map, packages: ['A'], outputPath: output, runId: 'TEST', builtAt: new Date().toISOString(), modules: ['ECONOMICO'] });
    const manifest = JSON.parse(readFileSync(path.join(built.output, 'manifest.json'), 'utf8'));
    assertDeepEqual(manifest.modules.requested, ['ECONOMICO']);
    assertDeepEqual(manifest.modules.resolved, ['CORE', 'ECONOMICO']);
    const expectedFiles = map.entries.filter((entry) => entry.package === 'A' && (entry.module === 'CORE' || entry.module === 'ECONOMICO')).length;
    assertEqual(manifest.entries.length, expectedFiles);
    assert(manifest.entries.some((entry) => entry.path === 'src/CosteService.js'));
    assert(!manifest.entries.some((entry) => entry.path === 'src/FichaMaterialService.js'));
  } finally {
    removeOwnTemp(parent);
  }
});

async function main() {
  console.log(`ENGREMIAT_PACKAGE_BEGIN tests=${tests.length}`);
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
  console.log(`ENGREMIAT_PACKAGE_END result=${failures === 0 ? 'OK' : 'ERR'} failures=${failures}`);
  process.exitCode = failures === 0 ? EXIT_CODES.OK : EXIT_CODES.CONTRACT;
}

await main();
