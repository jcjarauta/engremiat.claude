// Extrae la "anatomia real" de cada entidad del universo Engremiat: para cada ficha con
// vinculoReal a n8n, Apps Script o Node, calcula un cuerpo real -- cabeza (punto de entrada
// real), columna (el camino dirigido real mas largo desde esa entrada) y extremidades (el
// resto de aristas y nodos reales colgando de la columna). Ninguna forma se inventa: sale
// de las aristas dirigidas ya reales de grafo_n8n.json / graph.json+concat-map.json / grafo_node.json.
// Propuesta y diseno: PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md §8.41.
import fs from 'fs';
import path from 'path';

const DIR = 'C:/Users/pc/Desktop/engremiat.claude/tools/gobierno/graphify_visor';
const VAULT = 'G:/Mi unidad/engremiat.claude/Obsidian-Engremiat/Universos/Engremiat';

const n8n = JSON.parse(fs.readFileSync(path.join(DIR, 'grafo_n8n.json'), 'utf8'));
const graphAS = JSON.parse(fs.readFileSync('C:/Users/pc/Desktop/engremiat.claude/tools/graphify/graph.json', 'utf8'));
const concatMap = JSON.parse(fs.readFileSync('C:/Users/pc/Desktop/engremiat.claude/tools/graphify/concat-map.json', 'utf8'));
const nodeGraph = JSON.parse(fs.readFileSync(path.join(DIR, 'grafo_node.json'), 'utf8'));

function ficheroDeLineaConcat(lineaConcat) {
  const m = concatMap.mappings.find(m => lineaConcat >= m.concat_content_start_line && lineaConcat <= m.concat_content_end_line);
  return m ? m.file : null;
}

// -- caminar la boveda real, leer cada "## Vinculo real" y clasificar sus citas --
function walk(dir, out) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.name.startsWith('.')) continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (f.name.endsWith('.md')) out.push(p);
  }
}
function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

const ficheros = [];
walk(VAULT, ficheros);

const citasPorEntidad = []; // { slug, nombre, n8n: [nombreWorkflow], appsScript: [ficheroSrc], node: [ficheroTools] }
ficheros.forEach(f => {
  const texto = fs.readFileSync(f, 'utf8');
  const idx = texto.indexOf('## Vínculo real');
  if (idx < 0) return;
  const zona = texto.slice(idx);
  const nombre = path.basename(f, '.md');
  const cita = { slug: slugify(nombre), nombre, n8n: [], appsScript: [], node: [] };
  zona.split('\n').forEach(linea => {
    if (!linea.trim().startsWith('-')) return;
    let m;
    if ((m = linea.match(/n8n:\s*`([^`]+)`/))) cita.n8n.push(m[1]);
    if ((m = linea.match(/repo:\s*`src\/([^`]+\.(js|html))`/))) cita.appsScript.push(m[1]);
    if ((m = linea.match(/repo:\s*`tools\/([^`]+\.(mjs|js))`/))) cita.node.push('tools/' + m[1]);
  });
  if (cita.n8n.length || cita.appsScript.length || cita.node.length) citasPorEntidad.push(cita);
});

// -- espina real: DFS del camino dirigido mas largo desde cada entrada real (sin incoming) --
function calcularEspina(nodosIds, aristas) {
  const idsSet = new Set(nodosIds);
  const salientes = new Map(); // id -> [ids destino]
  const entrantes = new Map(); // id -> contador
  nodosIds.forEach(id => { salientes.set(id, []); entrantes.set(id, 0); });
  aristas.forEach(a => {
    if (idsSet.has(a.source) && idsSet.has(a.target) && a.source !== a.target) {
      salientes.get(a.source).push(a.target);
      entrantes.set(a.target, (entrantes.get(a.target) || 0) + 1);
    }
  });
  let entradas = nodosIds.filter(id => (entrantes.get(id) || 0) === 0);
  if (!entradas.length) entradas = [nodosIds[0]]; // ciclo puro sin entrada real: cae al primero, honesto pero raro

  let visitas = 0;
  const TOPE_VISITAS = 20000;
  function caminoMasLargoDesde(id, enCurso) {
    visitas++;
    if (visitas > TOPE_VISITAS) return [id];
    let mejor = [id];
    for (const hijo of salientes.get(id) || []) {
      if (enCurso.has(hijo)) continue; // corta ciclos reales sin perder el resto del cuerpo
      enCurso.add(hijo);
      const candidato = [id, ...caminoMasLargoDesde(hijo, enCurso)];
      enCurso.delete(hijo);
      if (candidato.length > mejor.length) mejor = candidato;
    }
    return mejor;
  }

  let mejorGlobal = [];
  let entradaGanadora = entradas[0];
  for (const e of entradas) {
    const camino = caminoMasLargoDesde(e, new Set([e]));
    if (camino.length > mejorGlobal.length) { mejorGlobal = camino; entradaGanadora = e; }
  }
  return { entrada: entradaGanadora, espina: mejorGlobal, entradasReales: entradas };
}

// -- fuente n8n: workflow real citado por nombre --
function fuenteN8n(nombreWorkflow) {
  const nodos = n8n.nodos.filter(n => n.workflow === nombreWorkflow);
  if (!nodos.length) return null;
  const ids = nodos.map(n => n.id);
  const idsSet = new Set(ids);
  const aristas = n8n.aristas.filter(a => a.workflow === nombreWorkflow && idsSet.has(a.source) && idsSet.has(a.target));
  const { entrada, espina } = calcularEspina(ids, aristas);
  const espinaSet = new Set(espina);
  return {
    tipo: 'n8n',
    etiqueta: nombreWorkflow,
    nodos: nodos.map(n => ({ id: n.id, nombre: n.nombre, tipoReal: n.tipoNodo })),
    aristas: aristas.map(a => ({ source: a.source, target: a.target, enEspina: espinaSet.has(a.source) && espinaSet.has(a.target) })),
    entrada, espina,
  };
}

// -- fuente Apps Script: union de ficheros src/ citados, resuelta via concat-map.json --
function fuenteAppsScript(ficherosSrc) {
  const objetivo = new Set(ficherosSrc);
  const nodos = graphAS.nodes.filter(n => {
    const linea = parseInt(String(n.source_location).replace('L', ''), 10);
    return objetivo.has(ficheroDeLineaConcat(linea));
  });
  if (!nodos.length) return null;
  const ids = nodos.map(n => n.id);
  const idsSet = new Set(ids);
  // aristas internas (para la espina) + aristas de frontera (llamadas desde/hacia fuera, para las extremidades)
  const internas = graphAS.links.filter(l => idsSet.has(l.source) && idsSet.has(l.target));
  const frontera = graphAS.links.filter(l => (idsSet.has(l.source)) !== (idsSet.has(l.target)));
  const { entrada, espina } = calcularEspina(ids, internas);
  const espinaSet = new Set(espina);
  const idANombre = new Map(graphAS.nodes.map(n => [n.id, n.label]));
  const nodosFrontera = new Set();
  frontera.forEach(l => { nodosFrontera.add(idsSet.has(l.source) ? l.target : l.source); });
  return {
    tipo: 'apps_script',
    etiqueta: 'Apps Script — ' + ficherosSrc.join(' + '),
    nodos: [
      ...nodos.map(n => ({ id: n.id, nombre: n.label, tipoReal: 'funcion' })),
      ...[...nodosFrontera].map(id => ({ id, nombre: idANombre.get(id) || id, tipoReal: 'externo' })),
    ],
    aristas: [
      ...internas.map(l => ({ source: l.source, target: l.target, enEspina: espinaSet.has(l.source) && espinaSet.has(l.target) })),
      ...frontera.map(l => ({ source: l.source, target: l.target, enEspina: false })),
    ],
    entrada, espina,
  };
}

// -- fuente Node: script(s) tools/ citados -- espina = cadena real de import, extremidades = lee/escribe/toca_recurso --
function fuenteNode(ficherosTools) {
  const idsBase = ficherosTools.filter(f => nodeGraph.nodos.some(n => n.id === f));
  if (!idsBase.length) return null;
  const imports = nodeGraph.aristas.filter(a => a.relation === 'import');
  // union transitiva de scripts reales alcanzables por import desde los citados, para que la espina cubra la cadena real completa
  const alcanzables = new Set(idsBase);
  let cambio = true;
  while (cambio) {
    cambio = false;
    imports.forEach(a => {
      if (alcanzables.has(a.source) && !alcanzables.has(a.target) && nodeGraph.nodos.some(n => n.id === a.target)) { alcanzables.add(a.target); cambio = true; }
    });
  }
  const ids = [...alcanzables];
  const idsSet = new Set(ids);
  const importsInternos = imports.filter(a => idsSet.has(a.source) && idsSet.has(a.target));
  const { entrada, espina } = calcularEspina(ids, importsInternos);
  const espinaSet = new Set(espina);
  const otras = nodeGraph.aristas.filter(a => a.relation !== 'import' && idsSet.has(a.source));
  const nodosRecurso = new Set(otras.map(a => a.target));
  return {
    tipo: 'node',
    etiqueta: 'Node — ' + ficherosTools.join(' + '),
    nodos: [
      ...ids.map(id => ({ id, nombre: (nodeGraph.nodos.find(n => n.id === id) || {}).nombre || id, tipoReal: 'script' })),
      ...[...nodosRecurso].map(id => ({ id, nombre: id.replace(/^recurso:/, ''), tipoReal: 'recurso' })),
    ],
    aristas: [
      ...importsInternos.map(a => ({ source: a.source, target: a.target, enEspina: espinaSet.has(a.source) && espinaSet.has(a.target) })),
      ...otras.map(a => ({ source: a.source, target: a.target, enEspina: false, relacion: a.relation })),
    ],
    entrada, espina,
  };
}

const entidades = {};
citasPorEntidad.forEach(c => {
  const fuentes = [];
  c.n8n.forEach(wf => { const f = fuenteN8n(wf); if (f) fuentes.push(f); });
  if (c.appsScript.length) { const f = fuenteAppsScript(c.appsScript); if (f) fuentes.push(f); }
  if (c.node.length) { const f = fuenteNode(c.node); if (f) fuentes.push(f); }
  if (fuentes.length) entidades[c.slug] = { nombre: c.nombre, fuentes };
});

const out = { generadoEn: new Date().toISOString(), totalEntidadesConAnatomia: Object.keys(entidades).length, entidades };
fs.writeFileSync(path.join(DIR, 'anatomia_entidades.json'), JSON.stringify(out, null, 1));
console.log('Entidades con anatomia real:', Object.keys(entidades).length);
Object.entries(entidades).forEach(([slug, e]) => {
  console.log(`- ${e.nombre}: ${e.fuentes.map(f => `${f.tipo}(${f.nodos.length}n/espina ${f.espina.length})`).join(', ')}`);
});
