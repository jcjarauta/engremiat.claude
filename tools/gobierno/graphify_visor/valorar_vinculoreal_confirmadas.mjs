#!/usr/bin/env node
/*
 * Valora las entidades CONFIRMADAS del censo real (§8.23): cuales ya
 * tienen una seccion "## Vinculo real" escrita en su ficha de la boveda,
 * y para las que no, si hay evidencia real lo bastante precisa como para
 * proponer un vinculoReal concreto (un script, una tabla, un workflow) o
 * si la evidencia es difusa y hace falta revisar a mano antes de fijar
 * nada -- mismo criterio de "nunca inventar sin dato real" de todo el
 * ejercicio de hoy.
 *
 * Uso: node valorar_vinculoreal_confirmadas.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIR = import.meta.dirname;
const RUTA_VAULT = 'G:\\Mi unidad\\engremiat.claude\\Obsidian-Engremiat\\Universos\\Engremiat';
const GRAPHIFY_OUT = 'C:\\Users\\pc\\Desktop\\Graphify\\projects\\engremiat-live\\graphify-out\\graph.json';

function slug(t) { return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }
function tokens(t) { return slug(t).split('_').filter(x => x.length >= 3); }
function coincide(cs, ct, f) {
  const fs_ = slug(f);
  if (!fs_ || fs_.length < 3) return false;
  if (ct.length <= 1) return cs.length >= 4 && (fs_ === cs || fs_.includes(cs) || cs.includes(fs_));
  const ft = tokens(f);
  if (!ft.length) return false;
  let h = 0;
  for (const c of ct) if (ft.some(x => x === c || x.includes(c) || c.includes(x))) h++;
  return (h / ct.length) >= 0.6;
}

function listarMd(ruta) {
  const out = [];
  for (const nombre of readdirSync(ruta)) {
    if (nombre === 'desktop.ini') continue;
    const completa = join(ruta, nombre);
    if (statSync(completa).isDirectory()) out.push(...listarMd(completa));
    else if (nombre.endsWith('.md')) out.push(completa);
  }
  return out;
}

const censo = JSON.parse(readFileSync(join(DIR, 'censo_entidades.json'), 'utf-8'));
const grafoNode = JSON.parse(readFileSync(join(DIR, 'grafo_node.json'), 'utf-8'));
const grafoN8n = JSON.parse(readFileSync(join(DIR, 'grafo_n8n.json'), 'utf-8'));
const grafoTelar = JSON.parse(readFileSync(join(DIR, 'grafo_telar_estados.json'), 'utf-8'));
const estructuraSheet = JSON.parse(readFileSync(join(DIR, '..', 'bocetador', 'estructura_sheet.json'), 'utf-8'));
const estructuraBaserow = JSON.parse(readFileSync(join(DIR, '..', 'bocetador', 'estructura_baserow.json'), 'utf-8'));
let graphify = null;
try { graphify = JSON.parse(readFileSync(GRAPHIFY_OUT, 'utf-8')); } catch { /* opcional */ }

const corpusNode = grafoNode.nodos.map(n => ({ s: n.id, label: n.nombre }));
const corpusN8n = grafoN8n.nodos.map(n => ({ s: n.workflow, label: n.workflow }));
const corpusTelar = grafoTelar.nodos.map(n => ({ s: 'telar:' + n.id, label: n.nombre }));
const corpusSheet = estructuraSheet.tabs.map(t => ({ s: 'sheet:' + t.nombre, label: t.nombre }));
const corpusBaserow = estructuraBaserow.tablas.map(t => ({ s: 'baserow:' + t.nombre, label: t.nombre }));
const corpusAppsScript = graphify ? graphify.nodes.map(n => ({ s: 'appsscript:' + (n.source_file || n.label), label: n.label })) : [];

// Modulos reales de src/Ids.js -- correspondencia mas fuerte que texto.
const RUTA_IDS = 'C:\\Users\\pc\\Desktop\\engremiat.claude\\src\\Ids.js';
const bloqueModulos = readFileSync(RUTA_IDS, 'utf-8').match(/MODULO_POR_ENTIDAD_MVP\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/)[1];
const modulosRealesCodigo = new Set([...bloqueModulos.matchAll(/:\s*'([A-Z_]+)'/g)].map(m => slug(m[1])));

// Transcripciones reales de deliberacion en Telar B2 -- misma fuente real
// que ya uso consolidar_censo.mjs para confirmar_uso_real_telar.
const RUTA_TELAR_B2 = 'C:\\Users\\pc\\Desktop\\engremiat.claude\\tools\\gobierno\\telar\\b2\\respuestas_originales';
const ACERVOS_CON_B2_REAL = new Set(
  readdirSync(RUTA_TELAR_B2).map(f => f.match(/^b2-([a-z-]+?)-\d+\.txt$/)?.[1]).filter(Boolean).map(slug)
);

// Correspondencias ya verificadas a mano en la pasada anterior (§8.23).
const CORRESPONDENCIAS_VERIFICADAS_A_MANO = {
  [slug('Verificador de Campos')]: 'tools/verificador_determinista.mjs',
};

// Que fichas reales YA tienen "## Vinculo real" escrito.
const ficherosVault = listarMd(RUTA_VAULT);
const ficherosConVinculoReal = new Set();
const rutaFichaPorNombre = new Map();
for (const ruta of ficherosVault) {
  const texto = readFileSync(ruta, 'utf-8');
  const m = texto.match(/^title:\s*(.+)$/m);
  const nombre = m ? m[1].trim() : ruta.split(/[\\/]/).pop().replace('.md', '');
  rutaFichaPorNombre.set(slug(nombre), ruta.replace(RUTA_VAULT + '\\', ''));
  if (texto.includes('## Vínculo real') || texto.includes('## Vinculo real')) ficherosConVinculoReal.add(slug(nombre));
}

function evidenciaPara(e) {
  const cs = e.slug, ct = tokens(e.nombre);
  const hits = {};
  if (modulosRealesCodigo.has(cs)) hits.modulo_ids_js = ['src/Ids.js#MODULO_POR_ENTIDAD_MVP.' + e.nombre.toUpperCase()];
  if (CORRESPONDENCIAS_VERIFICADAS_A_MANO[cs]) hits.verificado_a_mano = [CORRESPONDENCIAS_VERIFICADAS_A_MANO[cs]];
  if (ACERVOS_CON_B2_REAL.has(cs)) hits.telar_b2_real = ['tools/gobierno/telar/b2/respuestas_originales/'];
  const nodeHits = [...new Set(corpusNode.filter(x => coincide(cs, ct, x.label)).map(x => x.s))];
  if (nodeHits.length) hits.node = nodeHits;
  const n8nHits = [...new Set(corpusN8n.filter(x => coincide(cs, ct, x.label)).map(x => x.s))];
  if (n8nHits.length) hits.n8n = n8nHits;
  const telarHits = [...new Set(corpusTelar.filter(x => coincide(cs, ct, x.label)).map(x => x.s))];
  if (telarHits.length) hits.telar = telarHits;
  if (e.fuentes.includes('sheet_estructura')) {
    const h = [...new Set(corpusSheet.filter(x => coincide(cs, ct, x.label)).map(x => x.s))];
    if (h.length) hits.sheet = h;
  }
  if (e.fuentes.includes('baserow_estructura')) {
    const h = [...new Set(corpusBaserow.filter(x => coincide(cs, ct, x.label)).map(x => x.s))];
    if (h.length) hits.baserow = h;
  }
  if (e.fuentes.includes('codigo_appsscript') && corpusAppsScript.length) {
    const h = [...new Set(corpusAppsScript.filter(x => coincide(cs, ct, x.label)).map(x => x.s))].slice(0, 3);
    if (h.length) hits.appsscript = h;
  }
  return hits;
}

const confirmadas = censo.entidades.filter(e => e.accionRecomendada && e.accionRecomendada.startsWith('confirmar'));
const resultado = [];
for (const e of confirmadas) {
  const rutaFicha = rutaFichaPorNombre.get(e.slug) || null;
  const yaTiene = ficherosConVinculoReal.has(e.slug);
  const hits = yaTiene ? {} : evidenciaPara(e);
  const totalFuentesPrecisas = Object.values(hits).flat().length;
  let estado;
  if (yaTiene) estado = 'ya_tiene';
  else if (totalFuentesPrecisas >= 1 && Object.keys(hits).some(k => ['modulo_ids_js', 'node', 'n8n', 'baserow', 'sheet', 'telar', 'telar_b2_real', 'verificado_a_mano'].includes(k))) estado = 'evidencia_precisa';
  else estado = 'evidencia_difusa_revisar_a_mano';
  resultado.push({ nombre: e.nombre, rutaFicha, estado, hits });
}

console.log('=== Valoración vinculoReal de las ' + confirmadas.length + ' entidades confirmadas ===\n');
const porEstado = { ya_tiene: [], evidencia_precisa: [], evidencia_difusa_revisar_a_mano: [] };
for (const r of resultado) porEstado[r.estado].push(r);

console.log(`YA TIENEN (${porEstado.ya_tiene.length}): ` + porEstado.ya_tiene.map(r => r.nombre).join(', '));
console.log('');
console.log(`EVIDENCIA PRECISA, listas para añadir (${porEstado.evidencia_precisa.length}):`);
for (const r of porEstado.evidencia_precisa) {
  console.log(`  ${r.nombre}  [${r.rutaFicha}]`);
  for (const [k, v] of Object.entries(r.hits)) console.log(`      ${k}: ${v.join(', ')}`);
}
console.log('');
console.log(`EVIDENCIA DIFUSA, revisar a mano antes de fijar nada (${porEstado.evidencia_difusa_revisar_a_mano.length}):`);
for (const r of porEstado.evidencia_difusa_revisar_a_mano) console.log(`  ${r.nombre}  [${r.rutaFicha}]` + (Object.keys(r.hits).length ? '  hits debiles: ' + JSON.stringify(r.hits) : '  (sin ninguna coincidencia precisa en este barrido)'));

import('node:fs').then(fs => fs.writeFileSync(join(DIR, 'valoracion_vinculoreal.json'), JSON.stringify(resultado, null, 2), 'utf-8'));
