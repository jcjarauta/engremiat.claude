#!/usr/bin/env node

import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const EXIT_CODES = Object.freeze({
  OK: 0,
  CONTRACT: 1,
  ARGUMENTS: 2,
  READ: 3,
  UNSAFE_DESTINATION: 4,
  INCOMPLETE_BUILD: 5,
});

export const PACKAGE_STATUS = Object.freeze({
  A: 'PRODUCTION_CLEAN',
  B: 'TESTS_DEPEND_ON_VERSIONED_PACKAGE_A',
  C: 'AUXILIARY_EXECUTION_REQUIRES_HUMAN_AUTHORIZATION',
});

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_MAP = path.join(HERE, 'package-map.json');
const TOOLING_PREFIX = 'tools/packager/';
const VALID_CATEGORIES = new Set(['production', 'test', 'auxiliary', 'excluded', 'mixed']);
const VALID_PACKAGES = new Set(['A', 'B', 'C', 'NONE']);
const VALID_MODULES = new Set(['CORE', 'GANTT', 'ECONOMICO', 'IMPACTO', 'COMPRAS', 'CONVOCATORIAS', 'CLIENTE', 'VENTAS', 'OPORTUNIDAD', 'ESCENARIOS', 'OPERATIVA', 'SEGUIMIENTO', 'EJECUCION', 'APROVISIONAMIENTO', 'COMUNICACION']);
const EXPECTED_MODULE_COUNTS = { CORE: 82, GANTT: 3, ECONOMICO: 1, IMPACTO: 1, COMPRAS: 7, CONVOCATORIAS: 2, CLIENTE: 4, VENTAS: 3, OPORTUNIDAD: 2, OPERATIVA: 3, SEGUIMIENTO: 0, EJECUCION: 0, ESCENARIOS: 0, APROVISIONAMIENTO: 5, COMUNICACION: 1 };
const TEST_FILES = Object.freeze([
  'src/EjecutorPruebasReactivas.js',
  'src/RegistroPruebasReactivas.js',
  'src/Tests_AvanceYSecuencia.js',
  'src/Tests_CosteService.js',
  'src/Tests_Ids.js',
  'src/Tests_ImportacionRecursosPersonas.js',
  'src/Tests_IntegridadGapReglasFuncional.js',
  'src/Tests_LecturaBatch.js',
  'src/Tests_ModulosInstalados.js',
  'src/Tests_Repository.js',
  'src/Tests_Repository2.js',
]);
const MIXED_FILES = Object.freeze([]);
const TEST_NAME_PATTERN = /^(?:(?:prueba|probar|test|ejecutarSuite)[\w$]*|assert(?:Equals|True|False|Hallazgo|SinHallazgo)[\w$]*)$/iu;
const TEST_DECLARATION_PATTERNS = Object.freeze([
  { type: 'declaración', regex: /\bfunction\s+([\w$]+)\s*\(/gu },
  { type: 'asignación de función', regex: /\b(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s+)?function\b/gu },
  { type: 'asignación de función', regex: /\b(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[\w$]+)\s*=>/gu },
]);

class PackagerError extends Error {
  constructor(message, exitCode, details = {}) {
    super(message);
    this.name = 'PackagerError';
    this.exitCode = exitCode;
    this.details = details;
  }
}

export function printHelp(write = console.log) {
  write([
    'Uso:',
    '  node tools/packager/build-packages.mjs --check (--package A|B|C | --all | --modules M1,M2) [--project-root <ruta>]',
    '  node tools/packager/build-packages.mjs --build --output <ruta> (--package A|B|C | --all | --modules M1,M2) [--project-root <ruta>]',
    '',
    'Módulos válidos (subconjunto de package A, cierre transitivo por moduleDependencies):',
    `  ${[...VALID_MODULES].sort().join(', ')}`,
    '',
    'Sin argumentos muestra esta ayuda y no escribe.',
  ].join('\n'));
}

export function resolveModuleClosure(requestedModules, moduleDependencies) {
  const closure = new Set();
  const visit = (moduleName) => {
    if (closure.has(moduleName)) return;
    closure.add(moduleName);
    for (const dep of moduleDependencies?.[moduleName] ?? []) visit(dep);
  };
  for (const moduleName of requestedModules) visit(moduleName);
  return closure;
}

export function parseArgs(argv) {
  if (argv.length === 0) return { helpOnly: true };
  const result = { mode: null, output: null, package: null, all: false, modules: null, projectRoot: null, helpOnly: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check' || arg === '--build') {
      if (result.mode) throw new PackagerError('MODO_DUPLICADO', EXIT_CODES.ARGUMENTS);
      result.mode = arg.slice(2);
    } else if (arg === '--output' || arg === '--package' || arg === '--project-root' || arg === '--modules') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new PackagerError(`OPCION_INCOMPLETA ${arg}`, EXIT_CODES.ARGUMENTS);
      index += 1;
      if (arg === '--output') result.output = value;
      if (arg === '--package') result.package = value;
      if (arg === '--project-root') result.projectRoot = value;
      if (arg === '--modules') result.modules = value.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
    } else if (arg === '--all') {
      result.all = true;
    } else if (arg === '--help' || arg === '-h') {
      if (argv.length !== 1) throw new PackagerError('HELP_NO_COMBINABLE', EXIT_CODES.ARGUMENTS);
      return { helpOnly: true };
    } else {
      throw new PackagerError(`ARGUMENTO_DESCONOCIDO ${arg}`, EXIT_CODES.ARGUMENTS);
    }
  }
  if (!result.mode) throw new PackagerError('FALTA_MODO_CHECK_BUILD', EXIT_CODES.ARGUMENTS);
  const selectionCount = [Boolean(result.package), result.all, Boolean(result.modules)].filter(Boolean).length;
  if (selectionCount !== 1) throw new PackagerError('SELECCION_REQUIERE_PACKAGE_O_ALL_O_MODULES', EXIT_CODES.ARGUMENTS);
  if (result.package && !['A', 'B', 'C'].includes(result.package)) throw new PackagerError('PAQUETE_INVALIDO', EXIT_CODES.ARGUMENTS);
  if (result.modules && result.modules.length === 0) throw new PackagerError('MODULES_VACIO', EXIT_CODES.ARGUMENTS);
  if (result.mode === 'check' && result.output) throw new PackagerError('CHECK_NO_ADMITE_OUTPUT', EXIT_CODES.ARGUMENTS);
  if (result.mode === 'build' && !result.output) throw new PackagerError('BUILD_REQUIERE_OUTPUT', EXIT_CODES.ARGUMENTS);
  return result;
}

export function normalizeRelativePath(value) {
  if (typeof value !== 'string' || value.length === 0) throw new PackagerError('RUTA_VACIA', EXIT_CODES.CONTRACT);
  if (path.isAbsolute(value) || /^[A-Za-z]:[\\/]/u.test(value)) throw new PackagerError(`RUTA_ABSOLUTA ${value}`, EXIT_CODES.CONTRACT);
  const normalized = value.replaceAll('\\', '/');
  if (normalized.split('/').includes('..')) throw new PackagerError(`RUTA_PADRE ${value}`, EXIT_CODES.CONTRACT);
  if (normalized.startsWith('/') || normalized.includes('//') || normalized === '.') throw new PackagerError(`RUTA_NO_NORMALIZADA ${value}`, EXIT_CODES.CONTRACT);
  return normalized;
}

export const CANONICAL_SORT = Object.freeze({
  id: 'UTF8_NFC_BYTEWISE_V1',
  unicodeNormalization: 'NFC',
  encoding: 'UTF-8',
  comparison: 'unsigned bytewise',
  localeDependent: false,
});

export function canonicalPath(value) {
  return normalizeRelativePath(value).normalize('NFC');
}

export function compareCanonicalPaths(left, right) {
  return Buffer.compare(Buffer.from(canonicalPath(left), 'utf8'), Buffer.from(canonicalPath(right), 'utf8'));
}

export function validateCanonicalPathSet(paths) {
  const errors = [];
  const warnings = [];
  const exact = new Set();
  const normalized = new Map();
  const caseless = new Map();
  for (const original of paths) {
    if (exact.has(original)) {
      errors.push(`DUPLICATE_CANONICAL_PATH ${original}`);
      continue;
    }
    exact.add(original);
    const canonical = canonicalPath(original);
    if (normalized.has(canonical) && normalized.get(canonical) !== original) {
      errors.push(`CANONICAL_PATH_COLLISION ${normalized.get(canonical)} ${original}`);
    } else {
      normalized.set(canonical, original);
    }
    const caseKey = canonical.toLowerCase();
    if (caseless.has(caseKey) && caseless.get(caseKey) !== canonical) {
      warnings.push(`CASE_INSENSITIVE_PATH_COLLISION ${caseless.get(caseKey)} ${canonical}`);
    } else {
      caseless.set(caseKey, canonical);
    }
  }
  return { errors, warnings };
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new PackagerError(`ERROR_LECTURA_JSON ${path.basename(filePath)}`, EXIT_CODES.READ, { cause: error.message });
  }
}

export function readPackageMap(mapPath = DEFAULT_MAP) {
  return readJson(mapPath);
}

export function validatePackageMap(map) {
  const errors = [];
  if (!map || map.schemaVersion !== 1 || typeof map.universeExpected !== 'number' || !Array.isArray(map.entries)) {
    errors.push('CABECERA_MATRIZ_INVALIDA');
    return errors;
  }
  if (map.entries.length !== map.universeExpected) {
    errors.push(`UNIVERSO_ESPERADO_DESAJUSTADO esperado=${map.universeExpected} actual=${map.entries.length}`);
  }
  if (!Array.isArray(map.toolingExclusions) || !map.toolingExclusions.includes(TOOLING_PREFIX)) errors.push('FALTA_EXCLUSION_TOOLING');
  try {
    errors.push(...validateCanonicalPathSet(map.entries.map((entry) => entry.path)).errors);
  } catch (error) {
    errors.push(error.message);
  }
  const seen = new Set();
  const categoryCounts = new Map();
  const moduleCounts = new Map();
  for (const entry of map.entries) {
    const fields = ['path', 'type', 'category', 'package', 'expectedSha256', 'required', 'reason', 'mixed', 'module'];
    if (fields.some((field) => !(field in entry))) {
      errors.push(`CAMPOS_INCOMPLETOS ${entry.path ?? '(sin ruta)'}`);
      continue;
    }
    try {
      const normalized = canonicalPath(entry.path);
      if (normalized !== entry.path) errors.push(`RUTA_NO_CANONICA ${entry.path}`);
    } catch (error) {
      errors.push(error.message);
    }
    if (seen.has(entry.path)) errors.push(`RUTA_DUPLICADA ${entry.path}`);
    seen.add(entry.path);
    if (!VALID_CATEGORIES.has(entry.category)) errors.push(`CATEGORIA_INVALIDA ${entry.path}`);
    if (!VALID_PACKAGES.has(entry.package)) errors.push(`PAQUETE_INVALIDO ${entry.path}`);
    if (!/^[a-f0-9]{64}$/u.test(entry.expectedSha256)) errors.push(`HASH_INVALIDO ${entry.path}`);
    if (entry.required !== true || typeof entry.reason !== 'string' || typeof entry.mixed !== 'boolean') errors.push(`CONTRATO_INVALIDO ${entry.path}`);
    const expectedPackage = { production: 'A', test: 'B', auxiliary: 'C', excluded: 'NONE', mixed: 'A' }[entry.category];
    if (entry.package !== expectedPackage) errors.push(`ASIGNACION_INVALIDA ${entry.path}`);
    if (entry.mixed !== (entry.category === 'mixed')) errors.push(`BANDERA_MIXTA_INVALIDA ${entry.path}`);
    if (entry.package === 'A') {
      if (!VALID_MODULES.has(entry.module)) errors.push(`MODULO_INVALIDO ${entry.path}`);
      else moduleCounts.set(entry.module, (moduleCounts.get(entry.module) ?? 0) + 1);
    } else if (entry.module !== null) {
      errors.push(`MODULO_DEBE_SER_NULO ${entry.path}`);
    }
    categoryCounts.set(entry.category, (categoryCounts.get(entry.category) ?? 0) + 1);
  }
  const expectedCounts = { production: 114, test: 11, auxiliary: 36, excluded: 30, mixed: 0 };
  for (const [category, count] of Object.entries(expectedCounts)) {
    if ((categoryCounts.get(category) ?? 0) !== count) errors.push(`RECUENTO_${category.toUpperCase()} esperado=${count} actual=${categoryCounts.get(category) ?? 0}`);
  }
  for (const [moduleName, count] of Object.entries(EXPECTED_MODULE_COUNTS)) {
    if ((moduleCounts.get(moduleName) ?? 0) !== count) errors.push(`RECUENTO_MODULO_${moduleName} esperado=${count} actual=${moduleCounts.get(moduleName) ?? 0}`);
  }
  if (!map.moduleDependencies || typeof map.moduleDependencies !== 'object') {
    errors.push('FALTA_MODULE_DEPENDENCIES');
  } else {
    const declaredModules = Object.keys(map.moduleDependencies).sort(compareCanonicalPaths);
    const expectedModules = [...VALID_MODULES].sort(compareCanonicalPaths);
    if (JSON.stringify(declaredModules) !== JSON.stringify(expectedModules)) errors.push('MODULE_DEPENDENCIES_CLAVES_NO_COINCIDEN');
    for (const [moduleName, deps] of Object.entries(map.moduleDependencies)) {
      if (!Array.isArray(deps) || deps.some((dep) => !VALID_MODULES.has(dep))) errors.push(`MODULE_DEPENDENCIES_INVALIDO ${moduleName}`);
      else if (deps.includes(moduleName)) errors.push(`MODULE_DEPENDENCIES_AUTOREFERENCIA ${moduleName}`);
    }
  }
  const tests = map.entries.filter((entry) => entry.category === 'test').map((entry) => canonicalPath(entry.path)).sort(compareCanonicalPaths);
  if (JSON.stringify(tests) !== JSON.stringify([...TEST_FILES].map(canonicalPath).sort(compareCanonicalPaths))) errors.push('SIETE_TESTS_NO_COINCIDEN');
  const mixed = map.entries.filter((entry) => entry.mixed).map((entry) => canonicalPath(entry.path)).sort(compareCanonicalPaths);
  if (JSON.stringify(mixed) !== JSON.stringify([...MIXED_FILES].map(canonicalPath).sort(compareCanonicalPaths))) errors.push('CINCO_MIXTOS_NO_COINCIDEN');
  const htmlA = map.entries.filter((entry) => entry.package === 'A' && entry.path.endsWith('.html'));
  if (htmlA.length !== 35) errors.push(`HTML_A_ESPERADOS_35 actual=${htmlA.length}`);
  if (!map.entries.some((entry) => entry.path === 'src/appsscript.json' && entry.package === 'A')) errors.push('APPSSCRIPT_JSON_FALTA_EN_A');
  return errors;
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function sha256File(filePath) {
  try {
    return sha256Buffer(readFileSync(filePath));
  } catch (error) {
    throw new PackagerError(`ERROR_LECTURA_HASH ${path.basename(filePath)}`, EXIT_CODES.READ, { cause: error.message });
  }
}

function assertRegularNoSymlink(filePath, label) {
  let info;
  try {
    info = lstatSync(filePath);
  } catch (error) {
    throw new PackagerError(`NO_SE_PUEDE_LEER ${label}`, EXIT_CODES.READ, { cause: error.message });
  }
  if (info.isSymbolicLink()) throw new PackagerError(`SYMLINK_RECHAZADO ${label}`, EXIT_CODES.CONTRACT);
  if (!info.isFile()) throw new PackagerError(`NO_ES_ARCHIVO ${label}`, EXIT_CODES.CONTRACT);
  return info;
}

export function scanProjectFiles(projectRoot) {
  const found = [];
  const walk = (absoluteDir, relativeDir = '') => {
    const entries = readdirSync(absoluteDir, { withFileTypes: true }).sort((a, b) => compareCanonicalPaths(a.name, b.name));
    for (const dirent of entries) {
      const relative = normalizeRelativePath(relativeDir ? `${relativeDir}/${dirent.name}` : dirent.name);
      if (relative === '.git' || relative.startsWith('.git/') || relative === '.claude' || relative.startsWith('.claude/') || relative === 'tools/packager' || relative.startsWith(TOOLING_PREFIX) || relative === 'tools/constructor' || relative.startsWith('tools/constructor/')) continue;
      const absolute = path.join(absoluteDir, dirent.name);
      const info = lstatSync(absolute);
      if (info.isSymbolicLink()) throw new PackagerError(`SYMLINK_RECHAZADO ${relative}`, EXIT_CODES.CONTRACT);
      if (info.isDirectory()) walk(absolute, relative);
      else if (info.isFile()) found.push(relative);
      else throw new PackagerError(`TIPO_FS_RECHAZADO ${relative}`, EXIT_CODES.CONTRACT);
    }
  };
  walk(projectRoot);
  return found.sort(compareCanonicalPaths);
}

export function validateUniverse(projectRoot, map) {
  const errors = [];
  const warnings = [];
  let actual;
  try {
    actual = scanProjectFiles(projectRoot);
  } catch (error) {
    if (error instanceof PackagerError) throw error;
    throw new PackagerError('ERROR_ESCANEO_PROYECTO', EXIT_CODES.READ, { cause: error.message });
  }
  const expected = new Set(map.entries.map((entry) => entry.path));
  for (const file of actual) if (!expected.has(file)) errors.push(`ARCHIVO_DESCONOCIDO ${file}`);
  const validatedFiles = [];
  for (const entry of [...map.entries].sort((a, b) => compareCanonicalPaths(a.path, b.path))) {
    const source = path.join(projectRoot, ...entry.path.split('/'));
    if (!existsSync(source)) {
      errors.push(`ARCHIVO_AUSENTE ${entry.path}`);
      continue;
    }
    assertRegularNoSymlink(source, entry.path);
    let buffer;
    try {
      buffer = readFileSync(source);
    } catch (error) {
      throw new PackagerError(`NO_SE_PUEDE_LEER ${entry.path}`, EXIT_CODES.READ, { cause: error.message });
    }
    const actualHash = sha256Buffer(buffer);
    validatedFiles.push({ ...entry, absolutePath: source, size: buffer.length, sha256: actualHash, buffer, content: entry.path.endsWith('.js') ? buffer.toString('utf8') : null });
    if (map.selfReferentialBaselines?.includes(entry.path)) {
      warnings.push(`BASELINE_AUTORREFERENCIAL_NO_COMPARABLE ${entry.path} expected=${entry.expectedSha256}`);
      continue;
    }
    if (actualHash !== entry.expectedSha256) errors.push(`HASH_DIVERGENTE ${entry.path}`);
  }
  return { errors, warnings, actual, validatedFiles };
}

export function validateAndReadFiles(projectRoot, map) {
  for (const entry of [...map.entries].sort((a, b) => compareCanonicalPaths(a.path, b.path))) {
    const source = path.join(projectRoot, ...entry.path.split('/'));
    assertRegularNoSymlink(source, entry.path);
  }
  const result = validateUniverse(projectRoot, map);
  return { validatedFiles: result.validatedFiles, errors: result.errors, warnings: result.warnings };
}

export function maskNonCode(sourceText) {
  const output = [...sourceText];
  let state = 'code';
  let escaped = false;
  let inRegexClass = false;
  let stateStartLine = 1;
  const ambiguities = [];
  const lineAt = (index) => sourceText.slice(0, index).split('\n').length;
  const slashContext = (index) => {
    const prefix = sourceText.slice(0, index).replace(/\s+$/u, '');
    if (prefix.length === 0) return 'regex';
    if (/\b(?:return|case)$/u.test(prefix) || prefix.endsWith('=>')) return 'regex';
    const previous = prefix.at(-1);
    if ('([{,=:!?;'.includes(previous)) return 'regex';
    if (')]'.includes(previous) || /[\w$'"`]/u.test(previous) || /(?:\+\+|--)$/u.test(prefix)) return 'division';
    return 'ambiguous';
  };
  for (let index = 0; index < sourceText.length; index += 1) {
    const current = sourceText[index];
    const next = sourceText[index + 1];
    if (state === 'code') {
      if (current === '/' && next === '/') {
        output[index] = output[index + 1] = ' ';
        state = 'line-comment';
        stateStartLine = lineAt(index);
        index += 1;
      } else if (current === '/' && next === '*') {
        output[index] = output[index + 1] = ' ';
        state = 'block-comment';
        stateStartLine = lineAt(index);
        index += 1;
      } else if (current === "'") {
        output[index] = ' ';
        state = 'single-string';
        stateStartLine = lineAt(index);
        escaped = false;
      } else if (current === '"') {
        output[index] = ' ';
        state = 'double-string';
        stateStartLine = lineAt(index);
        escaped = false;
      } else if (current === '`') {
        output[index] = ' ';
        state = 'template-literal';
        stateStartLine = lineAt(index);
        escaped = false;
      } else if (current === '/') {
        const context = slashContext(index);
        if (context === 'regex') {
          output[index] = ' ';
          state = 'regex-literal';
          stateStartLine = lineAt(index);
          escaped = false;
          inRegexClass = false;
        } else if (context === 'ambiguous') {
          ambiguities.push({ line: lineAt(index), type: 'ambiguo', reason: 'AMBIGUOUS_SLASH_CONTEXT' });
        }
      }
      continue;
    }
    if (current !== '\n' && current !== '\r') output[index] = ' ';
    if (state === 'line-comment') {
      if (current === '\n') state = 'code';
      continue;
    }
    if (state === 'block-comment') {
      if (current === '*' && next === '/') {
        output[index + 1] = ' ';
        state = 'code';
        index += 1;
      }
      continue;
    }
    if (state === 'regex-literal') {
      if (current === '\n' || current === '\r') {
        ambiguities.push({ line: stateStartLine, type: 'ambiguo', reason: 'UNTERMINATED_REGEX_LITERAL' });
        state = 'code';
        inRegexClass = false;
        continue;
      }
      if (escaped) {
        escaped = false;
        continue;
      }
      if (current === '\\') {
        escaped = true;
        continue;
      }
      if (current === '[') {
        inRegexClass = true;
        continue;
      }
      if (current === ']' && inRegexClass) {
        inRegexClass = false;
        continue;
      }
      if (current === '/' && !inRegexClass) {
        let flagIndex = index + 1;
        while (flagIndex < sourceText.length && /[a-z]/iu.test(sourceText[flagIndex])) {
          output[flagIndex] = ' ';
          flagIndex += 1;
        }
        index = flagIndex - 1;
        state = 'code';
      }
      continue;
    }
    if (escaped) {
      escaped = false;
      continue;
    }
    if (current === '\\') {
      escaped = true;
      continue;
    }
    if ((state === 'single-string' && current === "'") ||
        (state === 'double-string' && current === '"') ||
        (state === 'template-literal' && current === '`')) state = 'code';
  }
  if (state !== 'code' && state !== 'line-comment') {
    ambiguities.push({ line: stateStartLine, type: 'ambiguo', reason: `UNTERMINATED_${state.toUpperCase().replaceAll('-', '_')}` });
  }
  return { masked: output.join(''), ambiguities };
}

export function detectTestMarkers(sourceText) {
  const { masked, ambiguities } = maskNonCode(sourceText);
  const markers = [];
  for (const pattern of TEST_DECLARATION_PATTERNS) {
    pattern.regex.lastIndex = 0;
    for (const match of masked.matchAll(pattern.regex)) {
      const name = match[1];
      if (!TEST_NAME_PATTERN.test(name)) continue;
      markers.push({
        name,
        line: sourceText.slice(0, match.index).split('\n').length,
        type: pattern.type,
        reason: 'TEST_DECLARATION',
      });
    }
  }
  for (const ambiguity of ambiguities) markers.push({ name: '(ambiguo)', ...ambiguity });
  return markers.sort((left, right) => left.line - right.line || compareCanonicalPaths(left.name, right.name));
}

export function detectSuiteCalls(sourceText) {
  const { masked } = maskNonCode(sourceText);
  const calls = [];
  const pattern = /\b(ejecutarSuite[\w$]*)\s*\(/gu;
  for (const match of masked.matchAll(pattern)) {
    const prefix = masked.slice(0, match.index);
    if (/\bfunction\s+$/u.test(prefix) || prefix.endsWith('.')) continue;
    calls.push({
      name: match[1],
      line: sourceText.slice(0, match.index).split('\n').length,
      type: 'llamada',
      reason: 'DIRECT_SUITE_EXECUTOR_CALL',
    });
  }
  return calls;
}

export function validateContamination(validatedFiles) {
  const errors = [];
  const warnings = [];
  const evidence = [];
  const scannedEntries = validatedFiles
    .filter((entry) => entry.package === 'A' || entry.package === 'C')
    .sort((left, right) => compareCanonicalPaths(left.path, right.path));
  for (const entry of scannedEntries) {
    if (entry.package === 'A' && path.posix.basename(entry.path).startsWith('Tests_')) errors.push(`TEST_EXPLICITO_EN_A ${entry.path}`);
    if (!entry.path.endsWith('.js')) continue;
    const sourceText = entry.content ?? entry.buffer?.toString('utf8') ?? '';
    const markers = detectTestMarkers(sourceText);
    const suiteCalls = detectSuiteCalls(sourceText);
    if (entry.package === 'A' && entry.mixed) warnings.push(`MIXED_ARCHITECTURE ${entry.path} reason=${entry.reason}`);
    const testMarkers = markers.filter((marker) => marker.type !== 'ambiguo');
    for (const marker of markers.filter((item) => item.type === 'ambiguo')) {
      const evidence = `${entry.path} line=${marker.line} type=${marker.type.replaceAll(' ', '_')} name=${marker.name} reason=${marker.reason}`;
      warnings.push(`AMBIGUOUS_TEST_ANALYSIS ${evidence}`);
    }
    for (const marker of testMarkers) {
      const detail = { path: entry.path, line: marker.line, kind: marker.type, name: marker.name, reason: marker.reason };
      evidence.push(detail);
      const rendered = `${entry.path} line=${marker.line} type=${marker.type.replaceAll(' ', '_')} name=${marker.name} reason=${marker.reason}`;
      if (entry.package === 'C') warnings.push(`EMBEDDED_TEST_CODE_AUXILIARY ${rendered}`);
      else if (!entry.mixed) errors.push(`EMBEDDED_TEST_CODE_IN_PRODUCTION ${rendered}`);
    }
    if (entry.mixed && testMarkers.length > 0) {
      const lines = [...new Set(testMarkers.map((marker) => marker.line))].sort((left, right) => left - right);
      const kinds = [...new Set(testMarkers.map((marker) => marker.type))].sort(compareCanonicalPaths);
      warnings.push(`EMBEDDED_TEST_CODE path=${entry.path} matches=${testMarkers.length} lines=${lines.join(',')} kinds=${kinds.join(',')}`);
    }
    for (const call of suiteCalls) {
      const evidence = `${entry.path} line=${call.line} type=${call.type} name=${call.name} reason=${call.reason}`;
      if (entry.package === 'C') warnings.push(`APPROVED_SUITE_RUNNER ${evidence}`);
      else if (entry.mixed) warnings.push(`EMBEDDED_SUITE_CALL ${evidence}`);
      else errors.push(`SUITE_CALL_IN_PRODUCTION ${evidence}`);
    }
  }
  evidence.sort((left, right) => compareCanonicalPaths(left.path, right.path) || left.line - right.line || compareCanonicalPaths(left.name, right.name));
  return { errors, warnings, evidence };
}

export function aggregateHash(entries) {
  const canonical = [...entries]
    .map((entry) => ({ ...entry, path: canonicalPath(entry.path) }))
    .sort((a, b) => compareCanonicalPaths(a.path, b.path))
    .map((entry) => `${entry.path}\n${entry.sha256}\n${entry.size}\n`)
    .join('');
  return sha256Buffer(Buffer.from(canonical, 'utf8'));
}

function getGitInfo(projectRoot) {
  try {
    const head = readFileSync(path.join(projectRoot, '.git', 'HEAD'), 'utf8').trim();
    if (head.startsWith('ref: ')) {
      const ref = head.slice(5);
      const refFile = path.join(projectRoot, '.git', ...ref.split('/'));
      const commit = existsSync(refFile) ? readFileSync(refFile, 'utf8').trim() : 'UNRESOLVED';
      return { branch: ref.replace('refs/heads/', ''), commit };
    }
    return { branch: 'DETACHED', commit: head };
  } catch {
    return { branch: 'UNKNOWN', commit: 'UNKNOWN' };
  }
}

function packageEntries(validatedFiles, packageName, moduleClosure = null) {
  return validatedFiles
    .filter((entry) => entry.package === packageName)
    .filter((entry) => !moduleClosure || moduleClosure.has(entry.module))
    .map((entry) => ({ ...entry, path: canonicalPath(entry.path) }))
    .sort((a, b) => compareCanonicalPaths(a.path, b.path));
}

export function createManifest({ projectRoot, map, packageName, entries, allValidatedFiles = entries, builtAt = new Date().toISOString(), modules = null }) {
  const git = getGitInfo(projectRoot);
  const aEntries = packageName === 'A' ? entries : packageEntries(allValidatedFiles, 'A');
  const aAggregate = aggregateHash(aEntries);
  const moduleClosure = modules ? resolveModuleClosure(modules, map.moduleDependencies) : null;
  return {
    schemaVersion: 1,
    generator: { name: 'engremiat-local-packager', version: '1-static' },
    package: packageName,
    status: PACKAGE_STATUS[packageName],
    modules: moduleClosure ? { requested: [...modules].sort(compareCanonicalPaths), resolved: [...moduleClosure].sort(compareCanonicalPaths) } : null,
    commitLocal: git.commit,
    branch: git.branch,
    builtAtUtc: builtAt,
    sourceRoot: realpathSync(projectRoot),
    canonicalSort: CANONICAL_SORT,
    aggregateAlgorithm: 'UTF8_NFC_BYTEWISE_V1; path+LF+sha256+LF+size+LF; SHA-256',
    aggregateSha256: aggregateHash(entries),
    dependencies: packageName === 'B' ? [{ package: 'A', aggregateSha256: aAggregate }] : [],
    fixturesRequired: packageName === 'B' ? ['Declarar subconjunto autorizado de C antes de ejecutar'] : [],
    autonomyLimitation: packageName === 'B' ? 'B depende de la versión y hash agregado declarados de A' : null,
    mixedDebt: map.entries.filter((entry) => entry.mixed).map((entry) => ({
      path: canonicalPath(entry.path),
      provisionalPackage: entry.package,
      debt: 'MIXED_PRODUCTION_TEST_OR_LAYER_DEBT',
      reason: entry.reason,
      risk: 'A no es producción limpia',
      future: 'Extracción posterior con gate y cobertura',
    })).sort((left, right) => compareCanonicalPaths(left.path, right.path)),
    excludedFiles: map.entries.filter((entry) => entry.package === 'NONE').map((entry) => canonicalPath(entry.path)).sort(compareCanonicalPaths),
    warning: packageName === 'C' ? PACKAGE_STATUS.C : null,
    entries: [...entries].sort((left, right) => compareCanonicalPaths(left.path, right.path)).map(({ path: entryPath, type, category, size, sha256 }) => ({ path: canonicalPath(entryPath), type, category, size, sha256 })),
  };
}

function stableJson(value) {
  const sortValue = (item) => {
    if (Array.isArray(item)) return item.map(sortValue);
    if (item && typeof item === 'object') {
      return Object.fromEntries(Object.keys(item).sort(compareCanonicalPaths).map((key) => [key, sortValue(item[key])]));
    }
    return item;
  };
  return `${JSON.stringify(sortValue(value), null, 2)}\n`;
}

export function validateOutputPath(projectRoot, outputValue) {
  if (typeof outputValue !== 'string' || outputValue.trim() === '') throw new PackagerError('SALIDA_VACIA', EXIT_CODES.UNSAFE_DESTINATION);
  const root = realpathSync(projectRoot);
  const resolved = path.resolve(projectRoot, outputValue);
  const driveRoot = path.parse(resolved).root;
  const forbidden = [root, path.join(root, 'src'), path.join(root, 'tools', 'packager')].map((item) => path.resolve(item));
  if (resolved === driveRoot || forbidden.includes(resolved)) throw new PackagerError('DESTINO_PROHIBIDO', EXIT_CODES.UNSAFE_DESTINATION);
  if (resolved.startsWith(`${path.join(root, 'src')}${path.sep}`) || resolved.startsWith(`${path.join(root, 'tools', 'packager')}${path.sep}`)) {
    throw new PackagerError('DESTINO_DENTRO_DE_RUTA_PROHIBIDA', EXIT_CODES.UNSAFE_DESTINATION);
  }
  if (existsSync(resolved)) throw new PackagerError('DESTINO_PREEXISTENTE_NO_SE_SOBRESCRIBE', EXIT_CODES.UNSAFE_DESTINATION);
  const parent = path.dirname(resolved);
  if (!existsSync(parent) || !statSync(parent).isDirectory()) throw new PackagerError('PADRE_DESTINO_INEXISTENTE', EXIT_CODES.UNSAFE_DESTINATION);
  return resolved;
}

export function safeCleanupTemp(tempDir, parentDir) {
  if (!tempDir) return;
  const resolvedTemp = path.resolve(tempDir);
  const resolvedParent = path.resolve(parentDir);
  if (path.dirname(resolvedTemp) !== resolvedParent || !path.basename(resolvedTemp).startsWith('.engremiat-packager-')) {
    throw new PackagerError('TEMPORAL_NO_SEGURO_NO_ELIMINADO', EXIT_CODES.INCOMPLETE_BUILD);
  }
  if (existsSync(resolvedTemp)) rmSync(resolvedTemp, { recursive: true, force: true });
}

export function preservePrimaryError(primaryError, cleanupOperation) {
  let cleanupError = null;
  try {
    cleanupOperation();
  } catch (error) {
    cleanupError = error;
  }
  const primary = primaryError instanceof PackagerError
    ? primaryError
    : new PackagerError('CONSTRUCCION_INCOMPLETA', EXIT_CODES.INCOMPLETE_BUILD, { cause: primaryError.message });
  if (cleanupError) primary.details.cleanupError = cleanupError.message;
  return primary;
}

function copyAndVerifyPackage(packageDir, entries) {
  const filesRoot = path.join(packageDir, 'files');
  mkdirSync(filesRoot, { recursive: true });
  for (const entry of entries) {
    const destination = path.join(filesRoot, ...entry.path.split('/'));
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, entry.buffer, { flag: 'wx' });
    if (sha256File(destination) !== entry.sha256) throw new PackagerError(`COPIA_DIVERGENTE ${entry.path}`, EXIT_CODES.INCOMPLETE_BUILD);
  }
}

export function runCheck({ projectRoot, map, packages, modules = null }) {
  const errors = [...validatePackageMap(map)];
  const warnings = [];
  const collisions = validateCanonicalPathSet(map.entries?.map((entry) => entry.path) ?? []);
  warnings.push(...collisions.warnings);
  if (collisions.warnings.length > 0) errors.push('CANONICAL_PATH_REVIEW_REQUIRED');
  if (modules) {
    const unknown = modules.filter((moduleName) => !VALID_MODULES.has(moduleName));
    if (unknown.length > 0) errors.push(`MODULO_DESCONOCIDO ${unknown.join(',')}`);
  }
  let evidence = [];
  if (errors.length === 0) {
    const universe = validateUniverse(projectRoot, map);
    errors.push(...universe.errors);
    warnings.push(...universe.warnings);
    if (universe.errors.length === 0) {
      const contamination = validateContamination(universe.validatedFiles);
      errors.push(...contamination.errors);
      warnings.push(...contamination.warnings);
      evidence = contamination.evidence;
    }
  }
  const moduleClosure = modules && errors.length === 0 ? resolveModuleClosure(modules, map.moduleDependencies) : null;
  for (const packageName of [...packages].sort(compareCanonicalPaths)) {
    if (moduleClosure && packageName === 'A') {
      const count = map.entries.filter((entry) => entry.package === packageName && moduleClosure.has(entry.module)).length;
      if (count === 0) errors.push(`MODULO_VACIO ${[...modules].sort(compareCanonicalPaths).join(',')}`);
    } else {
      const count = map.entries.filter((entry) => entry.package === packageName).length;
      if (count === 0) errors.push(`PAQUETE_VACIO ${packageName}`);
    }
  }
  return {
    ok: errors.length === 0,
    errors: errors.sort(compareCanonicalPaths),
    warnings: warnings.sort(compareCanonicalPaths),
    evidence,
  };
}

export function buildPackages({ projectRoot, map, packages, outputPath, runId, builtAt, modules = null }) {
  const output = validateOutputPath(projectRoot, outputPath);
  const parent = path.dirname(output);
  let tempDir = null;
  try {
    const mapErrors = 'schemaVersion' in map ? validatePackageMap(map) : [];
    if (mapErrors.length > 0) throw new PackagerError(mapErrors[0], EXIT_CODES.CONTRACT, { errors: mapErrors });
    if (modules) {
      const unknown = modules.filter((moduleName) => !VALID_MODULES.has(moduleName));
      if (unknown.length > 0) throw new PackagerError(`MODULO_DESCONOCIDO ${unknown.join(',')}`, EXIT_CODES.CONTRACT);
    }
    const collisionWarnings = validateCanonicalPathSet(map.entries.map((entry) => entry.path)).warnings;
    if (collisionWarnings.length > 0) throw new PackagerError(`CANONICAL_PATH_REVIEW_REQUIRED ${collisionWarnings[0]}`, EXIT_CODES.CONTRACT, { warnings: collisionWarnings });
    const validated = validateAndReadFiles(projectRoot, map);
    if (validated.errors.length > 0) throw new PackagerError(validated.errors[0], EXIT_CODES.CONTRACT, { errors: validated.errors });
    const contamination = validateContamination(validated.validatedFiles);
    if (contamination.errors.length > 0) throw new PackagerError(`CONTAMINACION ${contamination.errors[0]}`, EXIT_CODES.CONTRACT, { errors: contamination.errors });
    const moduleClosure = modules ? resolveModuleClosure(modules, map.moduleDependencies) : null;
    for (const packageName of [...packages].sort(compareCanonicalPaths)) {
      if (moduleClosure && packageName === 'A') {
        if (!validated.validatedFiles.some((entry) => entry.package === packageName && moduleClosure.has(entry.module))) {
          throw new PackagerError(`MODULO_VACIO ${[...modules].sort(compareCanonicalPaths).join(',')}`, EXIT_CODES.CONTRACT);
        }
      } else if (!validated.validatedFiles.some((entry) => entry.package === packageName)) {
        throw new PackagerError(`PAQUETE_VACIO ${packageName}`, EXIT_CODES.CONTRACT);
      }
    }
    const contaminationEvidence = contamination.evidence;
    tempDir = mkdtempSync(path.join(parent, '.engremiat-packager-'));
    const logLines = [
      `runId=${runId}`,
      `packages=${packages.join(',')}`,
      `modules=${modules ? modules.join(',') : 'ninguno'}`,
      `temporaryPath=${tempDir}`,
      `outputPath=${output}`,
    ];
    for (const packageName of [...packages].sort(compareCanonicalPaths)) {
      const entries = packageEntries(validated.validatedFiles, packageName, packageName === 'A' ? moduleClosure : null);
      const packageDir = packages.length === 1 ? tempDir : path.join(tempDir, packageName);
      if (packages.length > 1) mkdirSync(packageDir, { recursive: true });
      copyAndVerifyPackage(packageDir, entries);
      const manifest = createManifest({ projectRoot, map, packageName, entries, allValidatedFiles: validated.validatedFiles, builtAt, modules: packageName === 'A' ? modules : null });
      const report = { schemaVersion: 1, package: packageName, ok: true, warnings: packageName === 'C' ? [PACKAGE_STATUS.C] : [], embeddedTestEvidence: contaminationEvidence, aggregateSha256: manifest.aggregateSha256 };
      writeFileSync(path.join(packageDir, 'manifest.json'), stableJson(manifest), { encoding: 'utf8', flag: 'wx' });
      writeFileSync(path.join(packageDir, 'validation-report.json'), stableJson(report), { encoding: 'utf8', flag: 'wx' });
      logLines.push(`package=${packageName} files=${entries.length} aggregate=${manifest.aggregateSha256}`);
    }
    writeFileSync(path.join(tempDir, 'packager.log'), `${logLines.join(os.EOL)}${os.EOL}`, { encoding: 'utf8', flag: 'wx' });
    renameSync(tempDir, output);
    tempDir = null;
    return { output, packages: [...packages].sort(compareCanonicalPaths) };
  } catch (error) {
    throw preservePrimaryError(error, () => safeCleanupTemp(tempDir, parent));
  }
}

function logLine(kind, message) {
  console.log(`${kind} ${String(message).replace(/[\r\n]+/gu, ' ')}`);
}

export function main(argv = process.argv.slice(2)) {
  const runId = `LOCAL-${crypto.randomBytes(8).toString('hex')}`;
  logLine('ENGREMIAT_PACKAGE_BEGIN', `run=${runId}`);
  try {
    const options = parseArgs(argv);
    if (options.helpOnly) {
      printHelp();
      logLine('NEXT', 'solicitar_gate_antes_de_ejecutar');
      logLine('ENGREMIAT_PACKAGE_END', 'result=OK mode=help');
      return EXIT_CODES.OK;
    }
    const projectRoot = realpathSync(options.projectRoot ? path.resolve(options.projectRoot) : path.resolve(HERE, '..', '..'));
    const map = readPackageMap();
    const packages = options.all ? ['A', 'B', 'C'] : options.modules ? ['A'] : [options.package];
    const checked = runCheck({ projectRoot, map, packages, modules: options.modules });
    for (const warning of checked.warnings) logLine('WARN', warning);
    for (const error of checked.errors) logLine('ERR', error);
    if (!checked.ok) throw new PackagerError('VALIDACION_FALLIDA', EXIT_CODES.CONTRACT);
    logLine('OK', `validacion_estatica packages=${packages.join(',')} modules=${options.modules ? options.modules.join(',') : 'ninguno'}`);
    if (options.mode === 'check') {
      logLine('NEXT', 'solicitar_gate_para_build');
      logLine('ENGREMIAT_PACKAGE_END', 'result=OK mode=check');
      return EXIT_CODES.OK;
    }
    const built = buildPackages({ projectRoot, map, packages, outputPath: options.output, runId, builtAt: new Date().toISOString(), modules: options.modules });
    logLine('OK', `construccion_local packages=${built.packages.join(',')}`);
    logLine('NEXT', 'revisar_manifest_y_solicitar_gate_exportacion');
    logLine('ENGREMIAT_PACKAGE_END', 'result=OK mode=build');
    return EXIT_CODES.OK;
  } catch (error) {
    const exitCode = error instanceof PackagerError ? error.exitCode : EXIT_CODES.READ;
    logLine('ERR', error instanceof Error ? error.message : 'ERROR_DESCONOCIDO');
    logLine('NEXT', 'corregir_y_repetir_solo_con_gate');
    logLine('ENGREMIAT_PACKAGE_END', `result=ERR code=${exitCode}`);
    return exitCode;
  }
}

const invokedAsMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedAsMain) process.exitCode = main();
