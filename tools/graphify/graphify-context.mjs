#!/usr/bin/env node
// Port a Node.js del modo "context" de Graphify (graphify-context.core.ps1 +
// graphify-context.ps1 del proyecto local en Desktop\Graphify). Determinista,
// sin IA: dado un simbolo, extrae su codigo fuente real (TARGET) y el de sus
// funciones llamadas directas (CALLEE) desde tools/graphify/graph.json +
// concat-map.json contra src/, acotado por presupuesto de tokens.
//
// Existe porque el entorno de Ejecutor no tiene PowerShell -- ver memoria
// project_ejecutor_diagnostico_entorno. Cubre solo el modo 'context'; los
// modos explain/affected/path del script original dependen del binario
// compilado graphify.exe, que tampoco existe en ese sandbox.
//
// Uso: node graphify-context.mjs --symbol nombreFuncion [--root <repo>]
//        [--target-limit 200] [--related-limit 80] [--prefix-lines 3] [--budget 5000]

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fail(code, extra = '') {
  process.stderr.write(`${code}${extra ? ' ' + extra : ''}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    root: path.resolve(__dirname, '..', '..'),
    targetLimit: 200,
    relatedLimit: 80,
    prefixLines: 3,
    budget: 5000,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--symbol': args.symbol = next(); break;
      case '--root': args.root = next(); break;
      case '--target-limit': args.targetLimit = parseInt(next(), 10); break;
      case '--related-limit': args.relatedLimit = parseInt(next(), 10); break;
      case '--prefix-lines': args.prefixLines = parseInt(next(), 10); break;
      case '--budget': args.budget = parseInt(next(), 10); break;
      default:
        if (!args.symbol && !a.startsWith('--')) args.symbol = a;
    }
  }
  return args;
}

function normalize(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function resolveSource(node, mappings) {
  const m = /^L(\d+)(?::\d+)?$/.exec(String(node.source_location ?? ''));
  if (!m) return null;
  const concatLine = parseInt(m[1], 10);
  const entry = mappings.find(
    (e) => concatLine >= e.concat_content_start_line && concatLine <= e.concat_content_end_line
  );
  if (!entry) return null;
  return { file: entry.file, line: concatLine - entry.offset, concat_line: concatLine };
}

// Busca el final de un bloque `{...}` empezando en startLine, respetando
// comentarios de linea/bloque y literales de cadena (simple/doble/template)
// con escape -- mismo algoritmo que $FindEnd en graphify-context.core.ps1.
function findBlockEnd(text, startLine) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  if (startLine < 1 || startLine > starts.length) {
    fail('START_LINE_OUT_OF_RANGE', `line=${startLine}`);
  }
  const lineAt = (pos) => {
    let lo = 0, hi = starts.length - 1, ans = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (starts[mid] <= pos) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans + 1;
  };

  let pos = starts[startLine - 1];
  let depth = 0, seen = false, state = 'code', esc = false;

  for (let i = pos; i < text.length; i++) {
    const c = text[i];
    const n = i + 1 < text.length ? text[i + 1] : '\0';

    if (state === 'line') { if (c === '\n') state = 'code'; continue; }
    if (state === 'block') { if (c === '*' && n === '/') { state = 'code'; i++; } continue; }
    if (state === 'single') {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === "'") state = 'code';
      continue;
    }
    if (state === 'double') {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') state = 'code';
      continue;
    }
    if (state === 'template') {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '`') state = 'code';
      continue;
    }

    if (c === '/' && n === '/') { state = 'line'; i++; continue; }
    if (c === '/' && n === '*') { state = 'block'; i++; continue; }
    if (c === "'") { state = 'single'; continue; }
    if (c === '"') { state = 'double'; continue; }
    if (c === '`') { state = 'template'; continue; }
    if (c === '{') { depth++; seen = true; continue; }
    if (c === '}' && seen) {
      depth--;
      if (depth === 0) return lineAt(i);
    }
  }
  return null;
}

function formatBlock(b) {
  const out = [];
  out.push(
    `REAL_SOURCE role="${b.role}" label="${b.label}" file="${b.file}" mode=${b.mode} emitted_start=${b.emitted_start} emitted_end=${b.emitted_end} emitted_lines=${b.emitted_lines}`
  );
  for (const line of b.lines) {
    out.push(`SOURCE_CODE role="${b.role}" mode=${b.mode} "${line.replace(/"/g, '\\"')}"`);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.symbol) fail('SYMBOL_REQUIRED');
  if (args.budget < 1) fail('INVALID_BUDGET');

  const graphPath = path.join(args.root, 'tools', 'graphify', 'graph.json');
  const mapPath = path.join(args.root, 'tools', 'graphify', 'concat-map.json');
  const sourceDir = path.join(args.root, 'src');

  for (const p of [graphPath, mapPath]) {
    if (!existsSync(p)) fail('REQUIRED_FILE_NOT_FOUND', `path=${p}`);
  }
  if (!existsSync(sourceDir)) fail('SOURCE_DIR_NOT_FOUND', `path=${sourceDir}`);

  const G = JSON.parse(readFileSync(graphPath, 'utf8'));
  const M = JSON.parse(readFileSync(mapPath, 'utf8'));
  const nodes = G.nodes ?? [];
  const byId = new Map();
  for (const n of nodes) byId.set(String(n.id), n);

  const expectedLabel = `${args.symbol}()`;
  const expectedNorm = expectedLabel.toLowerCase();
  const targetNodes = nodes.filter(
    (n) => String(n.label) === expectedLabel || String(n.norm_label ?? '') === expectedNorm
  );
  if (targetNodes.length !== 1) {
    fail('TARGET_NODE_MATCH_COUNT', `symbol=${args.symbol} count=${targetNodes.length}`);
  }
  const target = targetNodes[0];

  const targetSource = resolveSource(target, M.mappings);
  if (!targetSource) fail('TARGET_SOURCE_RESOLUTION_FAILED');

  const items = [{ role: 'TARGET', node: target, source: targetSource }];
  for (const l of G.links ?? []) {
    if (String(l.relation) !== 'calls') continue;
    if (String(l.target) === String(target.id) && byId.has(String(l.source))) {
      const n = byId.get(String(l.source));
      const r = resolveSource(n, M.mappings);
      if (r) items.push({ role: 'CALLER', node: n, source: r });
    }
    if (String(l.source) === String(target.id) && byId.has(String(l.target))) {
      const n = byId.get(String(l.target));
      const r = resolveSource(n, M.mappings);
      if (r) items.push({ role: 'CALLEE', node: n, source: r });
    }
  }

  const fileCache = new Map();
  function loadSource(relFile) {
    if (fileCache.has(relFile)) return fileCache.get(relFile);
    const p = path.join(sourceDir, relFile);
    if (!existsSync(p)) fail('SOURCE_FILE_NOT_FOUND', `path=${p}`);
    const text = normalize(readFileSync(p, 'utf8'));
    const lines = text.split('\n');
    if (lines.length && lines[lines.length - 1] === '') lines.pop();
    const entry = { text, lines };
    fileCache.set(relFile, entry);
    return entry;
  }

  const seen = new Set();
  const rendered = [];

  for (const x of items) {
    const key = `${x.source.file}:${x.source.line}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const { text, lines } = loadSource(x.source.file);
    const bodyStart = x.source.line;
    const bodyEnd = findBlockEnd(text, bodyStart);
    if (bodyEnd === null) fail('FUNCTION_END_NOT_FOUND', `label=${x.node.label}`);
    const bodyLines = bodyEnd - bodyStart + 1;
    const limit = x.role === 'TARGET' ? args.targetLimit : args.relatedLimit;

    let mode, emitStart, emitEnd, omitted;
    if (bodyLines <= limit) {
      mode = 'COMPLETE';
      emitStart = bodyStart;
      emitEnd = bodyEnd;
      omitted = 0;
    } else {
      mode = 'BOUNDED';
      emitStart = Math.max(1, bodyStart - args.prefixLines);
      emitEnd = Math.min(lines.length, emitStart + limit - 1);
      omitted = Math.max(0, bodyEnd - emitEnd);
    }

    const blockLines = [];
    for (let i = emitStart; i <= emitEnd; i++) blockLines.push(`${i}: ${lines[i - 1]}`);

    rendered.push({
      role: x.role,
      label: String(x.node.label),
      file: x.source.file,
      mode,
      emitted_start: emitStart,
      emitted_end: emitEnd,
      emitted_lines: blockLines.length,
      omitted_lines: omitted,
      lines: blockLines,
    });
  }

  const emit = rendered.filter((r) => r.role === 'TARGET' || r.role === 'CALLEE');
  const callersCount = rendered.filter((r) => r.role === 'CALLER').length;
  const chars = emit.reduce((sum, b) => sum + b.lines.join('\n').length, 0);
  const tokens = Math.ceil(chars / 4);

  if (tokens > args.budget) {
    fail('CONTEXT_BUDGET_EXCEEDED', `budget=${args.budget} approximate_tokens=${tokens}`);
  }

  const out = [];
  out.push('MODE=context');
  out.push('SOURCE_CONTEXT_BEGIN');
  for (const b of emit) out.push(...formatBlock(b));
  out.push('SOURCE_CONTEXT_END');
  out.push(`CALLERS_METADATA count=${callersCount}`);
  out.push(`CONTEXT_ESTIMATE blocks=${emit.length} chars=${chars} approximate_tokens=${tokens}`);
  out.push(`BUDGET_STATUS status=OK budget=${args.budget} approximate_tokens=${tokens}`);
  process.stdout.write(out.join('\n') + '\n');
}

main();
