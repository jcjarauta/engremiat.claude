#!/usr/bin/env node

import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  EXIT_CODES,
  compareCanonicalPaths,
  readPackageMap,
  resolveModuleClosure,
  validateAndReadFiles,
  validatePackageMap,
} from './build-packages.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1'));

class WrapperError extends Error {
  constructor(message, exitCode) {
    super(message);
    this.exitCode = exitCode;
  }
}

const SIMPLE_TRIGGER_NAMES = new Set(['onOpen', 'onEdit']);

// Funciones cuyo envoltorio debe pasar MODULOS_INSTALADOS_CLIENTE como
// argumento explícito, en vez del reenvío genérico .apply(null, arguments):
// una librería de Apps Script corre en su propio ámbito global, aislado del
// proyecto que la invoca, así que no puede leer esa constante directamente
// (definida en el Codigo.js del cliente). Ver moduloInstalado_ en
// FormularioMotorUI.js.
const FUNCIONES_QUE_RECIBEN_MODULOS_INSTALADOS = new Set(['onOpen', 'abrirInstalarEstructuraInicial', 'moduloGanttInstalado', 'abrirMapaSheet']);

/**
 * A diferencia de maskNonCode (build-packages.mjs), que también blanquea el
 * contenido de strings para evitar falsos positivos en nombres de prueba,
 * aquí necesitamos leer los literales reales de addItem/google.script.run:
 * solo se blanquean comentarios, las strings quedan intactas.
 */
export function maskCommentsOnly(sourceText) {
  // split('') indexa por unidad UTF-16 (igual que sourceText[i] y sourceText.length),
  // a diferencia de [...sourceText] que itera por code point y colapsaría cada par
  // subrogado (p.ej. un emoji) en un solo elemento, desalineando los índices.
  const output = sourceText.split('');
  let state = 'code';
  let escaped = false;
  for (let index = 0; index < sourceText.length; index += 1) {
    const current = sourceText[index];
    const next = sourceText[index + 1];
    if (state === 'code') {
      if (current === '/' && next === '/') { output[index] = output[index + 1] = ' '; state = 'line-comment'; index += 1; }
      else if (current === '/' && next === '*') { output[index] = output[index + 1] = ' '; state = 'block-comment'; index += 1; }
      else if (current === "'") state = 'single-string';
      else if (current === '"') state = 'double-string';
      else if (current === '`') state = 'template-literal';
      continue;
    }
    if (state === 'line-comment') {
      if (current === '\n') state = 'code';
      else output[index] = ' ';
      continue;
    }
    if (state === 'block-comment') {
      if (current === '*' && next === '/') { output[index] = output[index + 1] = ' '; state = 'code'; index += 1; }
      else if (current !== '\n' && current !== '\r') output[index] = ' ';
      continue;
    }
    if (escaped) { escaped = false; continue; }
    if (current === '\\') { escaped = true; continue; }
    if ((state === 'single-string' && current === "'") ||
        (state === 'double-string' && current === '"') ||
        (state === 'template-literal' && current === '`')) state = 'code';
  }
  return output.join('');
}

export function extractInlineScripts(htmlSource) {
  const blocks = [];
  const regex = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/giu;
  let match;
  while ((match = regex.exec(htmlSource))) {
    blocks.push({ content: match[1], offset: match.index + match[0].indexOf(match[1]) });
  }
  return blocks;
}

function lineAt(sourceText, index) {
  return sourceText.slice(0, index).split('\n').length;
}

// El patrón (?:^|\n) consume el salto de línea previo como parte del match,
// así que match.index apunta a ese \n (la línea anterior), no a la línea del
// propio hallazgo. Se ajusta +1 cuando el match arranca con ese \n.
function matchLine(sourceText, match) {
  return lineAt(sourceText, match.index) + (match[0].startsWith('\n') ? 1 : 0);
}

export function extractMenuEntries(jsSource) {
  const masked = maskCommentsOnly(jsSource);
  const regex = /\.addItem\s*\(\s*(['"])((?:(?!\1).)*)\1\s*,\s*(['"])([a-zA-Z_][a-zA-Z0-9_]*)\3\s*\)/gu;
  const entries = [];
  let match;
  while ((match = regex.exec(masked))) {
    entries.push({ label: match[2], functionName: match[4], line: lineAt(jsSource, match.index) });
  }
  return entries;
}

const HANDLER_NAMES = new Set(['withSuccessHandler', 'withFailureHandler']);
const IDENTIFIER_START_RE = /^[a-zA-Z_][a-zA-Z0-9_]*/u;

// Salta un literal de cadena/plantilla completo (comillas ya masked-safe: los
// comentarios se blanquearon antes, pero las strings quedan intactas y deben
// recorrerse respetando el escape \ para no confundir un ) o ' interno con
// el cierre real.
function skipStringLiteral(source, quoteIndex) {
  const quote = source[quoteIndex];
  let index = quoteIndex + 1;
  while (index < source.length) {
    if (source[index] === '\\') { index += 1; }
    else if (source[index] === quote) return index;
    index += 1;
  }
  return index;
}

// Devuelve el índice del ')' que cierra el '(' en openIndex, contando
// profundidad de paréntesis y saltando literales de cadena -- a diferencia
// del regex anterior (HANDLER_ARG), no hay límite de niveles de anidamiento,
// así que un handler con cualquier cantidad de funciones/objetos anidados
// dentro (p.ej. el withSuccessHandler grande de cargarEsquema en
// FormularioGenerico.html) se salta correctamente entero.
function findMatchingParen(source, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "'" || char === '"' || char === '`') { index = skipStringLiteral(source, index); continue; }
    if (char === '(') depth += 1;
    else if (char === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function skipWhitespace(source, index) {
  let cursor = index;
  while (cursor < source.length && /\s/u.test(source[cursor])) cursor += 1;
  return cursor;
}

// Recorre la cadena `google.script.run.withXHandler(...).withYHandler(...).funcion(...)`
// carácter a carácter (en vez de con un regex de anidamiento acotado) para
// que un cuerpo de handler arbitrariamente anidado no rompa la detección de
// la función real invocada al final de la cadena.
export function extractGoogleScriptRunTargets(jsSource) {
  const masked = maskCommentsOnly(jsSource);
  const anchor = 'google.script.run';
  const entries = [];
  let searchFrom = 0;

  while (true) {
    const anchorIndex = masked.indexOf(anchor, searchFrom);
    if (anchorIndex === -1) break;
    searchFrom = anchorIndex + anchor.length;

    let cursor = anchorIndex + anchor.length;
    let targetName = null;

    while (true) {
      cursor = skipWhitespace(masked, cursor);
      if (masked[cursor] !== '.') break;
      cursor = skipWhitespace(masked, cursor + 1);

      const nameMatch = IDENTIFIER_START_RE.exec(masked.slice(cursor));
      if (!nameMatch) break;
      const name = nameMatch[0];
      cursor = skipWhitespace(masked, cursor + name.length);

      if (masked[cursor] !== '(') break;
      const closeParen = findMatchingParen(masked, cursor);
      if (closeParen === -1) break;

      if (HANDLER_NAMES.has(name)) {
        cursor = closeParen + 1;
        continue;
      }

      targetName = name;
      break;
    }

    if (targetName) entries.push({ functionName: targetName, line: lineAt(jsSource, anchorIndex) });
  }

  return entries;
}

export function extractSimpleTriggers(jsSource) {
  const masked = maskCommentsOnly(jsSource);
  const regex = /(?:^|\n)[ \t]*function\s+(onOpen|onEdit)\s*\(/gu;
  const entries = [];
  let match;
  while ((match = regex.exec(masked))) {
    entries.push({ functionName: match[1], line: matchLine(jsSource, match) });
  }
  return entries;
}

export function findFunctionDeclarationLines(jsSource, functionName) {
  const masked = maskCommentsOnly(jsSource);
  const escaped = functionName.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const regex = new RegExp(`(?:^|\\n)[ \\t]*function\\s+${escaped}\\s*\\(`, 'gu');
  const lines = [];
  let match;
  while ((match = regex.exec(masked))) {
    lines.push(matchLine(jsSource, match));
  }
  return lines;
}

// validateAndReadFiles (build-packages.mjs) solo decodifica `content` para .js;
// para .html queda null por diseño del empaquetador original. Aquí sí necesitamos
// el texto para leer los <script>, así que se decodifica el buffer bajo demanda.
function textOf(file) {
  return file.content ?? file.buffer.toString('utf8');
}

function collectFileEntryPoints(file) {
  const points = [];
  if (file.path.endsWith('.js')) {
    const source = textOf(file);
    for (const entry of extractMenuEntries(source)) points.push({ kind: 'menu', ...entry, sourcePath: file.path });
    for (const entry of extractSimpleTriggers(source)) points.push({ kind: 'trigger', ...entry, sourcePath: file.path });
  } else if (file.path.endsWith('.html')) {
    const html = textOf(file);
    for (const block of extractInlineScripts(html)) {
      const blockStartLine = lineAt(html, block.offset);
      for (const entry of extractGoogleScriptRunTargets(block.content)) {
        points.push({ kind: 'run', ...entry, line: blockStartLine - 1 + entry.line, sourcePath: file.path });
      }
    }
  }
  return points;
}

function locateDeclarations(functionName, aFiles) {
  const found = [];
  for (const file of aFiles) {
    if (!file.path.endsWith('.js') && !file.path.endsWith('.html')) continue;
    const searchSources = file.path.endsWith('.html')
      ? extractInlineScripts(textOf(file)).map((block) => block.content)
      : [textOf(file)];
    for (const source of searchSources) {
      for (const line of findFunctionDeclarationLines(source, functionName)) {
        found.push({ path: file.path, module: file.module, line });
      }
    }
  }
  return found;
}

export function resolveWrapperPlan({ map, aFiles, modules }) {
  const unknown = modules.filter((moduleName) => !(moduleName in map.moduleDependencies));
  if (unknown.length > 0) throw new WrapperError(`MODULO_DESCONOCIDO ${unknown.join(',')}`, EXIT_CODES.CONTRACT);
  const moduleClosure = resolveModuleClosure(modules, map.moduleDependencies);
  const closureFiles = aFiles.filter((file) => moduleClosure.has(file.module)).sort((a, b) => compareCanonicalPaths(a.path, b.path));

  const byName = new Map();
  for (const file of closureFiles) {
    for (const point of collectFileEntryPoints(file)) {
      if (!byName.has(point.functionName)) byName.set(point.functionName, { functionName: point.functionName, kinds: new Set(), references: [] });
      const bucket = byName.get(point.functionName);
      bucket.kinds.add(point.kind);
      bucket.references.push({ sourcePath: point.sourcePath, line: point.line, label: point.label ?? null });
    }
  }

  const entries = [];
  for (const name of [...byName.keys()].sort(compareCanonicalPaths)) {
    const bucket = byName.get(name);
    const declarations = locateDeclarations(name, aFiles);
    let status;
    let owner = null;
    if (declarations.length === 0) {
      status = 'UNRESOLVED';
    } else if (declarations.length > 1) {
      status = 'DUPLICATE_DECLARATION';
      owner = declarations;
    } else {
      owner = declarations[0];
      status = moduleClosure.has(owner.module) ? 'INCLUDED' : 'EXCLUDED_MODULE_GAP';
    }
    entries.push({
      functionName: name,
      kinds: [...bucket.kinds].sort(compareCanonicalPaths),
      isTrigger: SIMPLE_TRIGGER_NAMES.has(name),
      references: bucket.references.sort((a, b) => compareCanonicalPaths(a.sourcePath, b.sourcePath) || a.line - b.line),
      status,
      owner,
    });
  }

  return {
    requestedModules: [...modules].sort(compareCanonicalPaths),
    resolvedModules: [...moduleClosure].sort(compareCanonicalPaths),
    closureFiles: closureFiles.map((file) => file.path),
    entries,
    wrappers: entries.filter((entry) => entry.status === 'INCLUDED').map((entry) => entry.functionName).sort(compareCanonicalPaths),
    gaps: entries.filter((entry) => entry.status !== 'INCLUDED'),
  };
}

export function renderWrapperStubs(plan, userSymbol) {
  const lines = [
    '/**',
    ' * Generado por tools/packager/generate-shell-wrappers.mjs -- NO editar a mano.',
    ` * Módulos solicitados: ${plan.requestedModules.join(', ')}`,
    ` * Módulos resueltos (cierre transitivo): ${plan.resolvedModules.join(', ')}`,
    ' * Cada función reenvía la llamada a la librería sin conocer su lógica interna.',
    ' * MODULOS_INSTALADOS_CLIENTE la lee moduloInstalado_() en la librería CORE',
    ' * (FormularioMotorUI.js) para condicionar los bloques de onOpen() a los',
    ' * módulos realmente instalados en este cliente.',
    ' */',
    '',
    `var MODULOS_INSTALADOS_CLIENTE = ${JSON.stringify(plan.resolvedModules)};`,
    '',
  ];
  for (const name of plan.wrappers) {
    lines.push(`function ${name}() {`);
    if (FUNCIONES_QUE_RECIBEN_MODULOS_INSTALADOS.has(name)) lines.push(`  return ${userSymbol}.${name}(MODULOS_INSTALADOS_CLIENTE);`);
    else lines.push(`  return ${userSymbol}.${name}.apply(null, arguments);`);
    lines.push('}');
    lines.push('');
  }
  return `${lines.join('\n')}`.replace(/\n+$/u, '\n');
}

function validateWrapperOutputPath(projectRoot, outputValue) {
  if (typeof outputValue !== 'string' || outputValue.trim() === '') throw new WrapperError('SALIDA_VACIA', EXIT_CODES.UNSAFE_DESTINATION);
  const resolved = path.resolve(projectRoot, outputValue);
  const forbidden = [path.resolve(projectRoot, 'src'), path.resolve(projectRoot, 'tools', 'packager')];
  if (forbidden.some((zone) => resolved === zone || resolved.startsWith(`${zone}${path.sep}`))) {
    throw new WrapperError('DESTINO_PROHIBIDO', EXIT_CODES.UNSAFE_DESTINATION);
  }
  if (existsSync(resolved)) throw new WrapperError('DESTINO_PREEXISTENTE_NO_SE_SOBRESCRIBE', EXIT_CODES.UNSAFE_DESTINATION);
  const parent = path.dirname(resolved);
  if (!existsSync(parent) || !statSync(parent).isDirectory()) throw new WrapperError('PADRE_DESTINO_INEXISTENTE', EXIT_CODES.UNSAFE_DESTINATION);
  return resolved;
}

export function parseArgs(argv) {
  if (argv.length === 0) return { helpOnly: true };
  const result = { modules: null, output: null, userSymbol: 'Core', projectRoot: null, helpOnly: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--modules' || arg === '--output' || arg === '--user-symbol' || arg === '--project-root') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new WrapperError(`OPCION_INCOMPLETA ${arg}`, EXIT_CODES.ARGUMENTS);
      index += 1;
      if (arg === '--modules') result.modules = value.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
      if (arg === '--output') result.output = value;
      if (arg === '--user-symbol') result.userSymbol = value;
      if (arg === '--project-root') result.projectRoot = value;
    } else if (arg === '--help' || arg === '-h') {
      if (argv.length !== 1) throw new WrapperError('HELP_NO_COMBINABLE', EXIT_CODES.ARGUMENTS);
      return { helpOnly: true };
    } else {
      throw new WrapperError(`ARGUMENTO_DESCONOCIDO ${arg}`, EXIT_CODES.ARGUMENTS);
    }
  }
  if (!result.modules || result.modules.length === 0) throw new WrapperError('FALTA_MODULES', EXIT_CODES.ARGUMENTS);
  return result;
}

function printHelp(write = console.log) {
  write([
    'Uso:',
    '  node tools/packager/generate-shell-wrappers.mjs --modules M1,M2 [--output <archivo.js>] [--user-symbol NombreLibreria] [--project-root <ruta>]',
    '',
    'Calcula, para el cierre transitivo de los módulos pedidos, qué funciones invocadas desde',
    'menú (addItem), google.script.run o triggers simples (onOpen/onEdit) quedan dentro del',
    'cierre (envoltorio generable) y cuáles no (deuda a resolver antes de publicar ese cascarón).',
    '',
    'Sin --output solo informa por consola. Con --output escribe el archivo de envoltorios',
    '(no sobrescribe destinos existentes).',
  ].join('\n'));
}

function logLine(kind, message) {
  console.log(`${kind} ${String(message).replace(/[\r\n]+/gu, ' ')}`);
}

export function main(argv = process.argv.slice(2)) {
  logLine('ENGREMIAT_WRAPPERS_BEGIN', '');
  try {
    const options = parseArgs(argv);
    if (options.helpOnly) {
      printHelp();
      logLine('ENGREMIAT_WRAPPERS_END', 'result=OK mode=help');
      return EXIT_CODES.OK;
    }
    const projectRoot = options.projectRoot ? path.resolve(options.projectRoot) : path.resolve(HERE, '..', '..');
    const map = readPackageMap();
    const mapErrors = validatePackageMap(map);
    if (mapErrors.length > 0) throw new WrapperError(mapErrors[0], EXIT_CODES.CONTRACT);
    const validated = validateAndReadFiles(projectRoot, map);
    if (validated.errors.length > 0) throw new WrapperError(validated.errors[0], EXIT_CODES.CONTRACT);
    const aFiles = validated.validatedFiles.filter((entry) => entry.package === 'A');

    const plan = resolveWrapperPlan({ map, aFiles, modules: options.modules });
    logLine('OK', `modulos_pedidos=${plan.requestedModules.join(',')} resueltos=${plan.resolvedModules.join(',')}`);
    logLine('OK', `envoltorios_generables=${plan.wrappers.length}`);
    for (const gap of plan.gaps) {
      if (gap.status === 'UNRESOLVED') logLine('WARN', `SIN_DECLARACION ${gap.functionName} referenciada desde ${gap.references.map((ref) => ref.sourcePath).join(',')}`);
      else if (gap.status === 'DUPLICATE_DECLARATION') logLine('WARN', `DECLARACION_DUPLICADA ${gap.functionName} en ${gap.owner.map((item) => item.path).join(',')}`);
      else logLine('WARN', `FUERA_DE_MODULOS ${gap.functionName} definida en ${gap.owner.path} (módulo ${gap.owner.module}), fuera de ${plan.resolvedModules.join(',')}`);
    }
    if (options.output) {
      const resolved = validateWrapperOutputPath(projectRoot, options.output);
      writeFileSync(resolved, renderWrapperStubs(plan, options.userSymbol), { encoding: 'utf8', flag: 'wx' });
      logLine('OK', `escrito ${resolved}`);
    }
    logLine('ENGREMIAT_WRAPPERS_END', 'result=OK');
    return EXIT_CODES.OK;
  } catch (error) {
    const exitCode = error instanceof WrapperError ? error.exitCode : EXIT_CODES.READ;
    logLine('ERR', error instanceof Error ? error.message : 'ERROR_DESCONOCIDO');
    logLine('ENGREMIAT_WRAPPERS_END', `result=ERR code=${exitCode}`);
    return exitCode;
  }
}

const invokedAsMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedAsMain) process.exitCode = main();
