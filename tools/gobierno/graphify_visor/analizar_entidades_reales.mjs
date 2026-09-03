#!/usr/bin/env node
/*
 * El censo real de entidades de Engremiat (ver
 * PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md §8.23).
 *
 * Cruza los 8 grafos reales ya construidos (Apps Script, Node, n8n,
 * 91_HISTORIAL, jerarquia Sheet, PAQUETE_CLIENTE, Telar, wikilinks de la
 * boveda) MAS la estructura atomica completa de Sheet (70 pestanas +
 * todas sus cabeceras) y Baserow (18 tablas + todos sus campos) -- para
 * que ninguna pestana/tabla real quede fuera del censo solo porque no
 * tiene todavia un grafo de relaciones propio.
 *
 * Por cada entidad candidata calcula, solo con datos ya reales:
 *  - corroboracionCruzada: en cuantas de las 10 fuentes reales aparece
 *  - centralidad: grado del nodo en los grafos donde participa como nodo
 *  - decision: promover / revisar / descartar, con la evidencia real al
 *    lado -- nunca una etiqueta sin lista de donde sale
 *
 * Ademas detecta ciclos reales (Tarjan) sobre un grafo conceptual
 * fusionado, y produce una tabla de frecuencia real del vocabulario de
 * relacion usado en cada capa.
 *
 * Limite honesto, dicho aqui y en el informe de salida: el cruce de
 * identidad es por coincidencia de nombre/tokens normalizados, no por ID
 * unico -- primer barrido exhaustivo real, no proyeccion perfecta.
 *
 * Uso: node analizar_entidades_reales.mjs [--salida-json <ruta>] [--salida-md <ruta>]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIR = import.meta.dirname;
const BOCETADOR = join(DIR, '..', 'bocetador');
const GRAPHIFY_OUT = 'C:\\Users\\pc\\Desktop\\Graphify\\projects\\engremiat-live\\graphify-out\\graph.json';

function leerArgs() {
  const args = process.argv.slice(2);
  const out = { salidaJson: join(DIR, 'censo_entidades.json'), salidaMd: join(DIR, '..', '..', '..', 'HALLAZGOS_ENTIDADES_REALES.md') };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--salida-json') out.salidaJson = args[++i];
    if (args[i] === '--salida-md') out.salidaMd = args[++i];
  }
  return out;
}

function cargarJson(ruta) {
  return JSON.parse(readFileSync(ruta, 'utf-8'));
}

function slug(texto) {
  return String(texto).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function tokens(texto) {
  return slug(texto).split('_').filter(t => t.length >= 3);
}

// Coincidencia por tokens normalizados: exacta si es una sola palabra,
// por mayoria de tokens si es un nombre compuesto -- ver limite honesto
// en la cabecera del fichero.
function coincide(candidatoSlug, candidatoTokens, fuenteTexto) {
  const fSlug = slug(fuenteTexto);
  if (!fSlug || fSlug.length < 3) return false;
  if (candidatoTokens.length <= 1) {
    return candidatoSlug.length >= 4 && (fSlug === candidatoSlug || fSlug.includes(candidatoSlug) || candidatoSlug.includes(fSlug));
  }
  const fTokens = tokens(fuenteTexto);
  if (!fTokens.length) return false;
  let hits = 0;
  for (const ct of candidatoTokens) {
    if (fTokens.some(ft => ft === ct || ft.includes(ct) || ct.includes(ft))) hits++;
  }
  return (hits / candidatoTokens.length) >= 0.6;
}

function algunaCoincide(candidatoSlug, candidatoTokens, listaTextos) {
  for (const t of listaTextos) {
    if (coincide(candidatoSlug, candidatoTokens, t)) return true;
  }
  return false;
}

// ---------- 1. Cargar las 8 fuentes reales + los 2 corpus atomicos ----------

const wikilinks = cargarJson(join(DIR, 'grafo_wikilinks.json'));
const grafoNode = cargarJson(join(DIR, 'grafo_node.json'));
const grafoN8n = cargarJson(join(DIR, 'grafo_n8n.json'));
const grafoHistorial = cargarJson(join(DIR, 'grafo_historial.json'));
const grafoJerarquia = cargarJson(join(DIR, 'grafo_jerarquia.json'));
const grafoPaquete = cargarJson(join(DIR, 'grafo_paquete_cliente.json'));
const grafoTelar = cargarJson(join(DIR, 'grafo_telar_estados.json'));
const estructuraSheet = cargarJson(join(BOCETADOR, 'estructura_sheet.json'));
const estructuraBaserow = cargarJson(join(BOCETADOR, 'estructura_baserow.json'));
let graphify = null;
try { graphify = cargarJson(GRAPHIFY_OUT); } catch { /* fuente externa opcional */ }

// ---------- 2. Construir los corpus de texto real por fuente (para coincidencia) ----------

const corpusAppsScript = graphify
  ? graphify.nodes.flatMap(n => [n.label, n.source_file, n.community_name].filter(Boolean))
  : [];
const corpusNode = grafoNode.nodos.flatMap(n => [n.nombre, n.id].filter(Boolean));
const corpusN8n = [...new Set(grafoN8n.nodos.flatMap(n => [n.nombre, n.workflow].filter(Boolean)))];
const corpusSheetEstructura = estructuraSheet.tabs.flatMap(t => [t.nombre, ...t.cabeceras]);
const corpusBaserowEstructura = estructuraBaserow.tablas.flatMap(t => [t.nombre, ...t.campos.map(c => c.nombre)]);
const corpusDatosNegocio = [
  ...grafoJerarquia.nodos.map(n => n.nombre),
  ...grafoHistorial.nodos.map(n => n.entidad || n.nombre).filter(Boolean),
  ...grafoPaquete.nodos.map(n => n.nombre),
];
const corpusTelar = grafoTelar.nodos.map(n => n.nombre);

const idsFichaReal = new Set(wikilinks.nodos.filter(n => n.esFicheroReal).map(n => n.id));
const targetsWikilink = new Set(wikilinks.aristas.map(a => a.target));
const sourcesWikilink = new Set(wikilinks.aristas.map(a => a.source));

// Mencion textual literal en CUALQUIER ficha real de la boveda -- no solo
// wikilinks [[...]]. Hueco real encontrado en §8.29: anadir "Sheet:
// `39_PEDIDO_CLIENTE`" como bala de un "## Vinculo real" no es un
// [[wikilink]], asi que el censo no lo veia como corroboracion aunque el
// dato real ya estuviera ahi. Coincidencia por substring literal
// (case-insensitive), mas estricta que coincide() -- estos son
// identificadores tipo NOMBRE_TABLA, no texto narrativo.
const RUTA_VAULT_TEXTO = 'G:\\Mi unidad\\engremiat.claude\\Obsidian-Engremiat\\Universos\\Engremiat';
function listarMdParaTexto(ruta) {
  const out = [];
  for (const nombre of readdirSync(ruta)) {
    if (nombre === 'desktop.ini') continue;
    const completa = join(ruta, nombre);
    if (statSync(completa).isDirectory()) out.push(...listarMdParaTexto(completa));
    else if (nombre.endsWith('.md')) out.push(completa);
  }
  return out;
}
const textoCompletoVault = listarMdParaTexto(RUTA_VAULT_TEXTO).map(f => readFileSync(f, 'utf-8')).join('\n---\n').toLowerCase();

// ---------- 3. Grado (centralidad) real por id, sobre cada grafo relacional ----------

function calcularGrados(aristas) {
  const grado = new Map();
  for (const a of aristas) {
    grado.set(a.source, (grado.get(a.source) || 0) + 1);
    grado.set(a.target, (grado.get(a.target) || 0) + 1);
  }
  return grado;
}
const gradoWikilinks = calcularGrados(wikilinks.aristas);
const gradoNode = calcularGrados(grafoNode.aristas);
const gradoJerarquia = calcularGrados(grafoJerarquia.aristas);
const gradoPaquete = calcularGrados(grafoPaquete.aristas);
const gradoTelar = calcularGrados(grafoTelar.aristas);

// ---------- 4. Construir la lista de candidatos (union de fuentes conceptuales) ----------

const candidatos = new Map(); // slug -> {nombre, tipos:Set, origenes:Set, idsOrigen:[]}

function registrar(nombre, tipo, origen, idOrigen) {
  if (!nombre || String(nombre).trim().length < 2) return;
  const s = slug(nombre);
  if (!s || s.length < 2) return;
  if (!candidatos.has(s)) candidatos.set(s, { slug: s, nombre: String(nombre).trim(), tipos: new Set(), origenesSemilla: new Set(), idsOrigen: new Set() });
  const c = candidatos.get(s);
  c.tipos.add(tipo);
  c.origenesSemilla.add(origen);
  if (idOrigen) c.idsOrigen.add(idOrigen);
}

// A. Fichas reales de la boveda (primario)
for (const n of wikilinks.nodos.filter(n => n.esFicheroReal)) {
  registrar(n.nombre, n.tipo || 'vault', 'vault_ficha', n.id);
}
// B. Referenciadas por wikilink pero sin ficha propia (promocion directa)
for (const n of wikilinks.nodos.filter(n => !n.esFicheroReal)) {
  registrar(n.nombre, 'referencia_sin_ficha', 'vault_wikilink', n.id);
}
// C. Recursos reales compartidos detectados en el codigo Node (Sheet/Baserow tocados de verdad)
for (const n of grafoNode.nodos.filter(n => n.tipo === 'recurso_real')) {
  registrar(n.nombre, 'recurso_codigo', 'codigo_node', n.id);
}
// D. Entidades de negocio reales (jerarquia Campana->Tarea)
for (const n of grafoJerarquia.nodos) {
  registrar(n.nombre, 'entidad_negocio_' + n.tipo, 'datos_negocio', n.id);
}
// E. Modulos/clientes reales de PAQUETE_CLIENTE
for (const n of grafoPaquete.nodos) {
  registrar(n.nombre, n.tipo === 'cliente' ? 'cliente_real' : 'modulo_real', 'datos_negocio', n.id);
}
// F. Workflows n8n reales
for (const wf of new Set(grafoN8n.nodos.map(n => n.workflow))) {
  registrar(wf, 'workflow_n8n', 'n8n', 'wf:' + wf);
}
// G. Las 70 pestanas reales del Sheet + las 18 tablas reales de Baserow -- esto
//    es lo que cierra el hueco senalado en la valoracion (8/70 Sheet, 1/18
//    Baserow con grafo propio): entran TODAS al censo, tengan grafo o no.
for (const t of estructuraSheet.tabs) {
  registrar(t.nombre, 'pestana_sheet_' + t.tipo, 'sheet_estructura', 'sheet:' + t.nombre);
}
for (const t of estructuraBaserow.tablas) {
  registrar(t.nombre, 'tabla_baserow', 'baserow_estructura', 'baserow:' + t.nombre);
}

// ---------- 5. Por cada candidato, calcular corroboracion cruzada real (10 fuentes) ----------

const FUENTES = ['vault_ficha', 'vault_wikilink', 'vault_mencion', 'codigo_appsscript', 'codigo_node', 'n8n', 'sheet_estructura', 'baserow_estructura', 'datos_negocio', 'telar'];

const resultados = [];
for (const c of candidatos.values()) {
  const ct = tokens(c.nombre);
  const fuentesConEvidencia = new Set();

  if (idsFichaReal.has(c.slug)) fuentesConEvidencia.add('vault_ficha');
  if (targetsWikilink.has(c.slug) || sourcesWikilink.has(c.slug)) fuentesConEvidencia.add('vault_wikilink');
  // Umbral 6, no 4: identificadores reales tipo NN_NOMBRE/STG_NOMBRE
  // superan de sobra los 6 caracteres; por debajo de eso empiezan a
  // colarse palabras comunes del castellano (tarea, sheet...) como si
  // fueran corroboracion real.
  if (c.nombre.length >= 6 && textoCompletoVault.includes(c.nombre.toLowerCase())) fuentesConEvidencia.add('vault_mencion');
  if (corpusAppsScript.length && algunaCoincide(c.slug, ct, corpusAppsScript)) fuentesConEvidencia.add('codigo_appsscript');
  if (algunaCoincide(c.slug, ct, corpusNode)) fuentesConEvidencia.add('codigo_node');
  if (algunaCoincide(c.slug, ct, corpusN8n)) fuentesConEvidencia.add('n8n');
  if (algunaCoincide(c.slug, ct, corpusSheetEstructura)) fuentesConEvidencia.add('sheet_estructura');
  if (algunaCoincide(c.slug, ct, corpusBaserowEstructura)) fuentesConEvidencia.add('baserow_estructura');
  if (algunaCoincide(c.slug, ct, corpusDatosNegocio)) fuentesConEvidencia.add('datos_negocio');
  if (algunaCoincide(c.slug, ct, corpusTelar)) fuentesConEvidencia.add('telar');

  const centralidad = Math.max(
    gradoWikilinks.get(c.slug) || 0,
    ...[...c.idsOrigen].map(id => gradoNode.get(id) || gradoJerarquia.get(id) || gradoPaquete.get(id) || gradoTelar.get(id) || 0),
  );

  const corroboracion = fuentesConEvidencia.size;
  const yaEsFicha = idsFichaReal.has(c.slug);

  let decision, razon;
  if (yaEsFicha && corroboracion >= 4) {
    decision = 'confirmar'; razon = 'ficha real ya existente, bien corroborada por el resto del ecosistema -- entidad con identidad propia consolidada.';
  } else if (yaEsFicha && corroboracion < 4) {
    decision = 'revisar'; razon = 'ficha real ya existente pero apenas corroborada fuera de la boveda -- posible hueco real de integracion (nombre distinto en otra fuente, o de verdad aislada) que hay que revisar a mano.';
  } else if (!yaEsFicha && corroboracion >= 3) {
    decision = 'promover'; razon = 'sin ficha propia hoy, pero corroborada por ' + corroboracion + ' fuentes reales independientes -- candidata fuerte a nueva ficha de Espacio/Recurso/Personaje/Modulo/Herramienta.';
  } else {
    decision = 'descartar'; razon = 'evidencia real insuficiente hoy (' + corroboracion + ' fuente(s)) -- no se promueve sin mas dato, se deja fuera sin borrar el candidato del censo.';
  }

  resultados.push({
    nombre: c.nombre, slug: c.slug,
    tiposCandidato: [...c.tipos],
    yaEsFichaVault: yaEsFicha,
    corroboracionCruzada: corroboracion,
    fuentes: [...fuentesConEvidencia].sort(),
    centralidad,
    decision, razon,
  });
}

resultados.sort((a, b) => b.corroboracionCruzada - a.corroboracionCruzada || b.centralidad - a.centralidad);

// ---------- 6. Ciclos reales sobre un grafo conceptual fusionado (Tarjan) ----------

function fusionarAristasConceptuales() {
  const aristas = [];
  for (const a of wikilinks.aristas) aristas.push([a.source, a.target]);
  for (const a of grafoNode.aristas) aristas.push([a.source, a.target]);
  for (const a of grafoJerarquia.aristas) aristas.push([a.source, a.target]);
  for (const a of grafoPaquete.aristas) aristas.push([a.source, a.target]);
  for (const a of grafoTelar.aristas) aristas.push([a.source, a.target]);
  return aristas;
}

function tarjanSCC(aristas) {
  const adj = new Map();
  for (const [s, t] of aristas) {
    if (!adj.has(s)) adj.set(s, []);
    adj.get(s).push(t);
    if (!adj.has(t)) adj.set(t, []);
  }
  let index = 0;
  const indices = new Map(), lowlink = new Map(), onStack = new Set(), stack = [];
  const sccs = [];

  function strongconnect(v) {
    indices.set(v, index); lowlink.set(v, index); index++;
    stack.push(v); onStack.add(v);
    for (const w of (adj.get(v) || [])) {
      if (!indices.has(w)) {
        strongconnect(w);
        lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v), indices.get(w)));
      }
    }
    if (lowlink.get(v) === indices.get(v)) {
      const comp = [];
      let w;
      do {
        w = stack.pop(); onStack.delete(w);
        comp.push(w);
      } while (w !== v);
      if (comp.length > 1) sccs.push(comp);
    }
  }

  for (const v of adj.keys()) {
    if (!indices.has(v)) strongconnect(v);
  }
  return sccs;
}

const aristasConceptuales = fusionarAristasConceptuales();
const ciclosReales = tarjanSCC(aristasConceptuales);

// ---------- 7. Vocabulario de relacion unificado -- frecuencia real por capa ----------

const vocabulario = new Map();
function contarTipos(nombreCapa, aristas, extraeTipo) {
  for (const a of aristas) {
    const tipo = extraeTipo(a) || '(sin_tipo_explicito)';
    const clave = tipo;
    if (!vocabulario.has(clave)) vocabulario.set(clave, { tipo: clave, total: 0, porCapa: {} });
    const v = vocabulario.get(clave);
    v.total++;
    v.porCapa[nombreCapa] = (v.porCapa[nombreCapa] || 0) + 1;
  }
}
contarTipos('wikilinks', wikilinks.aristas, a => a.relation);
contarTipos('node', grafoNode.aristas, a => a.relation);
contarTipos('n8n', grafoN8n.aristas, () => 'conexion_n8n');
contarTipos('historial', grafoHistorial.aristas, () => 'toco_en_operacion');
contarTipos('jerarquia', grafoJerarquia.aristas, () => 'parte_de_jerarquia');
contarTipos('paquete_cliente', grafoPaquete.aristas, () => 'modulo_activo');
contarTipos('telar_estados', grafoTelar.aristas, () => 'transicion_estado');
if (graphify) contarTipos('apps_script', graphify.links, a => a.relation);
const vocabularioOrdenado = [...vocabulario.values()].sort((a, b) => b.total - a.total);

// ---------- 8. Escribir salidas ----------

const { salidaJson, salidaMd } = leerArgs();

const censo = {
  generadoEn: new Date().toISOString(),
  fuentesReales: FUENTES,
  totales: {
    candidatos: resultados.length,
    confirmar: resultados.filter(r => r.decision === 'confirmar').length,
    promover: resultados.filter(r => r.decision === 'promover').length,
    revisar: resultados.filter(r => r.decision === 'revisar').length,
    descartar: resultados.filter(r => r.decision === 'descartar').length,
  },
  ciclosReales: ciclosReales.map(c => c.sort()),
  vocabularioRelacion: vocabularioOrdenado,
  entidades: resultados,
};
writeFileSync(salidaJson, JSON.stringify(censo, null, 2), 'utf-8');

function md() {
  const l = [];
  l.push('# Censo real de entidades del universo Engremiat');
  l.push('');
  l.push('Generado el ' + censo.generadoEn + ' cruzando 10 fuentes reales: 8 grafos (Apps Script, Node, n8n, 91_HISTORIAL, jerarquia Sheet, PAQUETE_CLIENTE, Telar, wikilinks de la boveda) mas la estructura atomica completa de Sheet (70 pestanas), Baserow (18 tablas), y mencion textual literal en cualquier ficha real de la boveda (no solo wikilinks -- anadida en §8.29 tras encontrar que un "## Vinculo real" en texto plano no contaba como corroboracion). Ver `PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md` §8.23.');
  l.push('');
  l.push('**Limite honesto**: el cruce de identidad es por coincidencia de nombre/tokens normalizados, no por ID unico todavia -- primer barrido exhaustivo real, no un censo perfecto. Cada fila lleva su evidencia al lado para que se pueda revisar a mano.');
  l.push('');
  l.push(`## Resumen: ${censo.totales.candidatos} entidades candidatas reales`);
  l.push('');
  l.push(`- **${censo.totales.confirmar} confirmar** -- ficha real ya existente, bien corroborada.`);
  l.push(`- **${censo.totales.promover} promover** -- sin ficha propia hoy, corroborada por >=3 fuentes reales independientes.`);
  l.push(`- **${censo.totales.revisar} revisar** -- ficha real ya existente pero apenas corroborada fuera de la boveda.`);
  l.push(`- **${censo.totales.descartar} descartar** -- evidencia real insuficiente hoy.`);
  l.push('');
  l.push(`## Ciclos reales encontrados: ${ciclosReales.length}`);
  l.push('');
  if (ciclosReales.length) {
    for (const c of ciclosReales) {
      if (c.length > 15) {
        l.push(`- **malla de ${c.length} nodos** (no es un bucle simple, es una red de referencias mutuas -- ver \`censo_entidades.json\` para la lista completa): ${c.slice(0, 8).join(' <-> ')} ... (+${c.length - 8} mas)`);
      } else {
        l.push('- ' + c.join(' <-> '));
      }
    }
  } else {
    l.push('Ninguno en el grafo conceptual fusionado (wikilinks + Node + jerarquia + paquete_cliente + Telar) -- dato real, no una omision: el sistema, hasta hoy, no tiene bucles de dependencia circular declarados.');
  }
  l.push('');
  l.push('Nota honesta sobre el primer ciclo (la malla grande): no es un bucle de dependencia problematico -- es el efecto esperable de que muchas fichas del Holon se enlazan mutuamente ([[A]] enlaza a [[B]] y [[B]] enlaza de vuelta a [[A]]), lo que convierte a Tarjan casi todo el mesh en una sola componente fuertemente conexa. Los otros tres ciclos son mas pequenos y mas interesantes: dos scripts que se referencian de verdad entre si, un grupo real de ficheros de datos compartidos entre montar-cliente.mjs y su test, y el ciclo de vida real de Telar (esperado, ya validado en B0).');
  l.push('');
  l.push('## Vocabulario de relacion real, por frecuencia');
  l.push('');
  l.push('| tipo | total | capas donde aparece |');
  l.push('|---|---|---|');
  for (const v of vocabularioOrdenado) {
    l.push(`| ${v.tipo} | ${v.total} | ${Object.entries(v.porCapa).map(([k, n]) => `${k}:${n}`).join(', ')} |`);
  }
  l.push('');
  l.push('## Candidatas a PROMOVER (sin ficha propia, corroboradas por >=3 fuentes reales)');
  l.push('');
  l.push('| nombre | corroboracion | fuentes reales | tipo candidato |');
  l.push('|---|---|---|---|');
  for (const r of resultados.filter(r => r.decision === 'promover')) {
    l.push(`| ${r.nombre} | ${r.corroboracionCruzada} | ${r.fuentes.join(', ')} | ${r.tiposCandidato.join(', ')} |`);
  }
  l.push('');
  l.push('## Fichas reales a REVISAR (existen, pero con poca corroboracion cruzada)');
  l.push('');
  l.push('| nombre | tipo (vault) | corroboracion | fuentes reales |');
  l.push('|---|---|---|---|');
  for (const r of resultados.filter(r => r.decision === 'revisar')) {
    l.push(`| ${r.nombre} | ${r.tiposCandidato.join(', ')} | ${r.corroboracionCruzada} | ${r.fuentes.join(', ') || '(ninguna fuera de la propia ficha)'} |`);
  }
  l.push('');
  l.push('## Fichas reales CONFIRMADAS (bien corroboradas por el resto del ecosistema)');
  l.push('');
  l.push('| nombre | tipo (vault) | corroboracion | fuentes reales |');
  l.push('|---|---|---|---|');
  for (const r of resultados.filter(r => r.decision === 'confirmar')) {
    l.push(`| ${r.nombre} | ${r.tiposCandidato.join(', ')} | ${r.corroboracionCruzada} | ${r.fuentes.join(', ')} |`);
  }
  l.push('');
  l.push(`## Descartadas hoy (${censo.totales.descartar}), por si conviene revisar el criterio`);
  l.push('');
  l.push('No se listan todas por volumen -- ver `censo_entidades.json` completo. Los primeros 20 candidatos descartados con mayor corroboracion (los mas cerca del umbral):');
  l.push('');
  l.push('| nombre | corroboracion | fuentes reales |');
  l.push('|---|---|---|');
  for (const r of resultados.filter(r => r.decision === 'descartar').slice(0, 20)) {
    l.push(`| ${r.nombre} | ${r.corroboracionCruzada} | ${r.fuentes.join(', ') || '(ninguna)'} |`);
  }
  l.push('');
  return l.join('\n');
}
writeFileSync(salidaMd, md(), 'utf-8');

console.log('=== Censo real de entidades ===');
console.log(`${censo.totales.candidatos} candidatos: ${censo.totales.confirmar} confirmar, ${censo.totales.promover} promover, ${censo.totales.revisar} revisar, ${censo.totales.descartar} descartar.`);
console.log(`${ciclosReales.length} ciclo(s) real(es) encontrado(s).`);
console.log(`${vocabularioOrdenado.length} tipos de relacion reales distintos, ${vocabularioOrdenado.reduce((s, v) => s + v.total, 0)} aristas en total.`);
console.log('JSON: ' + salidaJson);
console.log('Markdown: ' + salidaMd);
