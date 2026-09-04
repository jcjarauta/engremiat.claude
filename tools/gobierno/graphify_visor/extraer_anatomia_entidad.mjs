// Extrae la "anatomia real" de cada entidad del universo Engremiat: para cada ficha con
// vinculoReal a n8n, Apps Script o Node, calcula un cuerpo real -- cabeza (punto de entrada
// real), columna (el camino dirigido real mas largo desde esa entrada) y extremidades (el
// resto de aristas y nodos reales colgando de la columna). Ninguna forma se inventa: sale
// de las aristas dirigidas ya reales de grafo_n8n.json / graph.json+concat-map.json / grafo_node.json.
// Propuesta y diseno: PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md §8.41.
import fs from 'fs';
import path from 'path';
import { actualizarFichaGrafo } from './ficha_grafo.mjs';

const DIR = 'C:/Users/pc/Desktop/engremiat.claude/tools/gobierno/graphify_visor';
const VAULT = 'G:/Mi unidad/engremiat.claude/Obsidian-Engremiat/Universos/Engremiat';

const n8n = JSON.parse(fs.readFileSync(path.join(DIR, 'grafo_n8n.json'), 'utf8'));
const graphAS = JSON.parse(fs.readFileSync('C:/Users/pc/Desktop/engremiat.claude/tools/graphify/graph.json', 'utf8'));
const concatMap = JSON.parse(fs.readFileSync('C:/Users/pc/Desktop/engremiat.claude/tools/graphify/concat-map.json', 'utf8'));
const nodeGraph = JSON.parse(fs.readFileSync(path.join(DIR, 'grafo_node.json'), 'utf8'));
const historial = JSON.parse(fs.readFileSync(path.join(DIR, 'grafo_historial.json'), 'utf8'));
const paqueteCliente = JSON.parse(fs.readFileSync(path.join(DIR, 'grafo_paquete_cliente.json'), 'utf8'));
const wikilinks = JSON.parse(fs.readFileSync(path.join(DIR, 'grafo_wikilinks.json'), 'utf8'));
const estructuraSheet = JSON.parse(fs.readFileSync('C:/Users/pc/Desktop/engremiat.claude/tools/gobierno/bocetador/estructura_sheet.json', 'utf8'));
const estructuraBaserow = JSON.parse(fs.readFileSync('C:/Users/pc/Desktop/engremiat.claude/tools/gobierno/bocetador/estructura_baserow.json', 'utf8'));
const RELACIONES_HOLON = new Set(['opera_en', 'depende_de', 'gobierna_a', 'alimenta_a', 'verifica_a', 'corrige_a', 'activa_a', 'parte_de']);

// -- ENTIDADES_MVP real (src/Ids.js): clave de entidad -> hoja real. Convierte una columna
// real "CLIENTE_ID" en una arista real hacia la hoja real 38_CLIENTE -- por convencion de
// nombres ya usada en todo el proyecto, no adivinada aqui --
const idsJs = fs.readFileSync('C:/Users/pc/Desktop/engremiat.claude/src/Ids.js', 'utf8');
const HOJA_POR_CLAVE_ENTIDAD = new Map(
  [...idsJs.match(/const ENTIDADES_MVP = Object\.freeze\(\{[\s\S]*?\n\}\);/)[0].matchAll(/\n  (\w+): Object\.freeze\(\{\s*hoja:\s*'([^']+)'/g)]
    .map(m => [m[1], m[2]])
);

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
  const cita = { slug: slugify(nombre), nombre, n8n: [], appsScript: [], node: [], sheet: [], sheetTabs: [], baserowTablas: [] };
  zona.split('\n').forEach(linea => {
    if (!linea.trim().startsWith('-')) return;
    let m;
    if ((m = linea.match(/n8n:\s*`([^`]+)`/))) cita.n8n.push(m[1]);
    if ((m = linea.match(/repo:\s*`src\/([^`]+\.(js|html))`/))) cita.appsScript.push(m[1]);
    if ((m = linea.match(/repo:\s*`tools\/([^`]+\.(mjs|js))`/))) cita.node.push('tools/' + m[1]);
    // mecanismos reales de Sheet/Baserow que ya tienen su propio grafo dirigido en sheet-real.html --
    // no cualquier pestaña citada, solo las que de verdad tienen un flujo real que recorrer
    if (/91_HISTORIAL/.test(linea)) cita.sheet.push('historial');
    if (/PAQUETE_CLIENTE/.test(linea)) cita.sheet.push('paquete_cliente');
    // pestañas de Sheet y tablas de Baserow citadas directamente -- su propio esquema real
    // (columnas + relaciones *_ID / link_row) es su cuerpo, aunque no tengan un flujo de ejecucion
    if ((m = linea.match(/Sheet:\s*`(\d\d_[A-Z_]+)`/))) cita.sheetTabs.push(m[1]);
    if ((m = linea.match(/Baserow:\s*`([A-Z_]+)`/))) cita.baserowTablas.push(m[1]);
  });
  if (cita.n8n.length || cita.appsScript.length || cita.node.length || cita.sheet.length || cita.sheetTabs.length || cita.baserowTablas.length) citasPorEntidad.push(cita);
});

// -- espina real: DFS del camino dirigido mas largo desde cada entrada real (sin incoming) --
// `raizForzada` (§8.45): cuando la propia entidad ES uno de los nodos reales del grafo (caso
// relacional/Holon), la cabeza tiene que ser ELLA, no la mejor entrada global del componente --
// si no, dos personajes reales distintos que comparten componente (Puerta Humana/Cronista via
// n8n no aplica aqui, pero Concilio/los 8 Acervos/El Sheet si, via el respaldo relacional)
// terminan con el mismo cuerpo, cabeza y columna, letra por letra. Bug real encontrado en vivo
// comparando Concilio/Acervo Tecnico/El Sheet/Mensajero -- las cuatro devolvian exactamente la
// misma columna porque el algoritmo elegia el mejor camino GLOBAL del componente compartido,
// no el camino desde la posicion propia de cada una.
function calcularEspina(nodosIds, aristas, raizForzada) {
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

  if (raizForzada && idsSet.has(raizForzada)) {
    const espina = caminoMasLargoDesde(raizForzada, new Set([raizForzada]));
    return { entrada: raizForzada, espina, entradasReales: [raizForzada] };
  }

  let entradas = nodosIds.filter(id => (entrantes.get(id) || 0) === 0);
  if (!entradas.length) entradas = [nodosIds[0]]; // ciclo puro sin entrada real: cae al primero, honesto pero raro

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
      ...importsInternos.map(a => ({ source: a.source, target: a.target, enEspina: espinaSet.has(a.source) && espinaSet.has(a.target), relacion: 'import' })),
      ...otras.map(a => ({ source: a.source, target: a.target, enEspina: false, relacion: a.relation })),
    ],
    entrada, espina,
  };
}

// -- fuente Sheet/Baserow: mecanismos reales que YA tienen grafo dirigido propio en sheet-real.html
// (91_HISTORIAL por correlationId, PAQUETE_CLIENTE) -- no se inventa un flujo para una tabla suelta --
const MECANISMOS_SHEET = {
  historial: { grafo: historial, etiqueta: '91_HISTORIAL — por correlationId' },
  paquete_cliente: { grafo: paqueteCliente, etiqueta: 'PAQUETE_CLIENTE — módulos activos por cliente' },
};
function fuenteSheetMecanismo(clave) {
  const m = MECANISMOS_SHEET[clave];
  if (!m) return null;
  const ids = m.grafo.nodos.map(n => n.id);
  const { entrada, espina } = calcularEspina(ids, m.grafo.aristas);
  const espinaSet = new Set(espina);
  return {
    tipo: 'sheet',
    etiqueta: m.etiqueta,
    nodos: m.grafo.nodos.map(n => ({ id: n.id, nombre: n.nombre, tipoReal: n.tipo })),
    aristas: m.grafo.aristas.map(a => ({ source: a.source, target: a.target, enEspina: espinaSet.has(a.source) && espinaSet.has(a.target) })),
    entrada, espina,
  };
}

// -- fuente Sheet (esquema real): una tabla no tiene flujo de ejecucion, pero si tiene una
// forma real -- sus columnas, y sus relaciones reales con otras tablas via columnas *_ID que
// coinciden con una clave real de ENTIDADES_MVP (src/Ids.js), no adivinadas. Cabeza = la
// pestaña real citada con menos aristas de FK entrantes reales (la mas "de origen" del grupo).
function fuenteSheetSchema(nombresTabs) {
  const tabsPorNombre = new Map(estructuraSheet.tabs.map(t => [t.nombre, t]));
  const tabsReales = nombresTabs.map(n => tabsPorNombre.get(n)).filter(Boolean);
  if (!tabsReales.length) return null;
  const idsTabs = new Set(tabsReales.map(t => t.nombre));
  const aristasFk = []; // tabla -> tabla real, via *_ID que coincide con una clave real
  const nodosColumna = [];
  const aristasColumna = [];
  tabsReales.forEach(t => {
    t.cabeceras.forEach(c => {
      if (c === 'ID') return;
      const idCol = t.nombre + '::' + c;
      const esFk = /_ID$/.test(c);
      let objetivoFk = null;
      if (esFk) {
        const clave = c.replace(/_ID$/, '');
        const hoja = HOJA_POR_CLAVE_ENTIDAD.get(clave);
        if (hoja && hoja !== t.nombre) objetivoFk = hoja;
      }
      if (objetivoFk) {
        aristasFk.push({ source: t.nombre, target: objetivoFk, columna: c });
      } else {
        nodosColumna.push({ id: idCol, nombre: c, tipoReal: 'columna' });
        aristasColumna.push({ source: t.nombre, target: idCol });
      }
    });
  });
  // las tablas objetivo de un FK entran como nodos de frontera aunque no esten citadas directamente
  const tablasFrontera = new Set(aristasFk.map(a => a.target).filter(t => !idsTabs.has(t)));
  const idsEspina = [...idsTabs, ...tablasFrontera];
  const { entrada, espina } = calcularEspina(idsEspina, aristasFk);
  const espinaSet = new Set(espina);
  return {
    tipo: 'sheet_schema',
    etiqueta: 'Sheet — ' + tabsReales.map(t => t.nombre).join(' + '),
    nodos: [
      ...idsEspina.map(id => ({ id, nombre: id, tipoReal: idsTabs.has(id) ? 'pestaña' : 'pestaña (referenciada)' })),
      ...nodosColumna,
    ],
    aristas: [
      ...aristasFk.map(a => ({ source: a.source, target: a.target, enEspina: espinaSet.has(a.source) && espinaSet.has(a.target), relacion: a.columna })),
      ...aristasColumna.map(a => ({ source: a.source, target: a.target, enEspina: false })),
    ],
    entrada, espina,
  };
}

// -- fuente Baserow (esquema real): igual criterio, pero la relacion real ya viene dada por
// la API de Baserow (campos tipo link_row), sin necesidad de inferirla por nombre --
function fuenteBaserowSchema(nombresTablas) {
  const tablasPorNombre = new Map(estructuraBaserow.tablas.map(t => [t.nombre, t]));
  const tablasReales = nombresTablas.map(n => tablasPorNombre.get(n)).filter(Boolean);
  if (!tablasReales.length) return null;
  const idsTablas = new Set(tablasReales.map(t => t.nombre));
  const aristasLink = [];
  const nodosCampo = [];
  const aristasCampo = [];
  tablasReales.forEach(t => {
    t.campos.forEach(c => {
      if (c.tipo === 'link_row') {
        // el nombre del campo link_row en Baserow suele ser el nombre real de la tabla objetivo
        const objetivo = estructuraBaserow.tablas.find(x => x.nombre === c.nombre)?.nombre;
        if (objetivo && objetivo !== t.nombre) aristasLink.push({ source: t.nombre, target: objetivo, columna: c.nombre });
        else { nodosCampo.push({ id: t.nombre + '::' + c.nombre, nombre: c.nombre + ' (link)', tipoReal: 'campo' }); aristasCampo.push({ source: t.nombre, target: t.nombre + '::' + c.nombre }); }
      } else {
        const idCol = t.nombre + '::' + c.nombre;
        nodosCampo.push({ id: idCol, nombre: c.nombre, tipoReal: 'campo' });
        aristasCampo.push({ source: t.nombre, target: idCol });
      }
    });
  });
  const tablasFrontera = new Set(aristasLink.map(a => a.target).filter(t => !idsTablas.has(t)));
  const idsEspina = [...idsTablas, ...tablasFrontera];
  const { entrada, espina } = calcularEspina(idsEspina, aristasLink);
  const espinaSet = new Set(espina);
  return {
    tipo: 'baserow_schema',
    etiqueta: 'Baserow — ' + tablasReales.map(t => t.nombre).join(' + '),
    nodos: [
      ...idsEspina.map(id => ({ id, nombre: id, tipoReal: idsTablas.has(id) ? 'tabla' : 'tabla (referenciada)' })),
      ...nodosCampo,
    ],
    aristas: [
      ...aristasLink.map(a => ({ source: a.source, target: a.target, enEspina: espinaSet.has(a.source) && espinaSet.has(a.target), relacion: 'link_row: ' + a.columna })),
      ...aristasCampo.map(a => ({ source: a.source, target: a.target, enEspina: false })),
    ],
    entrada, espina,
  };
}

// -- fuente de respaldo: la propia bóveda -- para entidades sin código/n8n/mecanismo Sheet propio,
// su cuerpo real es su vecindario en el Holon (§8.33): aristas semanticas dirigidas (opera_en/depende_de/...)
// como columna, wikilinks reales como extremidades. Mismo dato ya real de grafo_wikilinks.json, sin inventar nada nuevo --
function fuenteRelacional(slug) {
  if (!wikilinks.nodos.some(n => n.id === slug)) return null;
  const holonAristas = wikilinks.aristas.filter(a => RELACIONES_HOLON.has(a.relation));
  const idsSet = new Set();
  idsSet.add(slug);
  let cambio = true;
  while (cambio) {
    cambio = false;
    holonAristas.forEach(a => {
      if (idsSet.has(a.source) && !idsSet.has(a.target)) { idsSet.add(a.target); cambio = true; }
      if (idsSet.has(a.target) && !idsSet.has(a.source)) { idsSet.add(a.source); cambio = true; }
    });
  }
  if (idsSet.size < 2) return null; // sin ninguna relación real del Holon, no hay cuerpo que dibujar
  const ids = [...idsSet];
  const internas = holonAristas.filter(a => idsSet.has(a.source) && idsSet.has(a.target));
  const { entrada, espina } = calcularEspina(ids, internas, slug); // raiz forzada: yo soy mi propia cabeza
  const espinaSet = new Set(espina);
  const wikilinkFrontera = wikilinks.aristas.filter(a => a.relation === 'wikilink' && (idsSet.has(a.source) || idsSet.has(a.target)));
  const idANombre = new Map(wikilinks.nodos.map(n => [n.id, n.nombre]));
  const nodosWiki = new Set();
  wikilinkFrontera.forEach(a => { nodosWiki.add(a.source); nodosWiki.add(a.target); });
  const idsFinal = new Set([...ids, ...nodosWiki]);
  return {
    tipo: 'relacional',
    etiqueta: 'Bóveda — relaciones reales del Holon',
    nodos: [...idsFinal].map(id => ({ id, nombre: idANombre.get(id) || id, tipoReal: (wikilinks.nodos.find(n => n.id === id) || {}).tipo || 'referencia' })),
    aristas: [
      ...internas.map(a => ({ source: a.source, target: a.target, enEspina: espinaSet.has(a.source) && espinaSet.has(a.target), relacion: a.relation })),
      ...wikilinkFrontera.map(a => ({ source: a.source, target: a.target, enEspina: false, relacion: 'wikilink' })),
    ],
    entrada, espina,
  };
}

// -- agencia real (§8.45): cuantas aristas reales salen de la propia cabeza -- si es 0, esa
// fuente en concreto no "hace" nada desde su propio punto de entrada, solo es alcanzada por otros.
// Calculado una vez, igual para las siete fuentes, no reinventado por tipo.
function conAgenciaReal(fuente) {
  fuente.agenciaReal = fuente.aristas.filter(a => a.source === fuente.entrada).length;
  return fuente;
}

// -- rol real (§8.46): no solo si actua, sino COMO actua -- el verbo real dominante de sus
// propias aristas salientes, traducido a un pequeno vocabulario de roles universales que se
// puede comparar ENTRE fuentes distintas (un opera_en del Holon y un import de Node no son la
// misma palabra, pero ocupan el mismo lugar real: algo que actua sobre otra cosa concreta).
// Nunca inventado por entidad -- mismo criterio para las siete fuentes.
const ROL_POR_VERBO = {
  opera_en: 'Operador', gobierna_a: 'Guardián', verifica_a: 'Guardián', corrige_a: 'Guardián',
  alimenta_a: 'Proveedor', activa_a: 'Activador', parte_de: 'Miembro',
  llama: 'Ejecutor', import: 'Compositor',
  lee: 'Utilidad', escribe: 'Utilidad', lee_debil: 'Utilidad', escribe_debil: 'Utilidad', toca_recurso: 'Utilidad',
  depende_fk: 'Esquema dependiente', depende_link: 'Esquema dependiente',
};
// n8n y los mecanismos Sheet (91_HISTORIAL/PAQUETE_CLIENTE) no llevan un verbo real por arista --
// su rol real sale del tipo real de su propia cabeza, ya guardado en fuente.nodos[].tipoReal
const ROL_POR_TIPO_CABEZA = {
  webhook: 'Disparador', scheduleTrigger: 'Disparador',
  switch: 'Decisor', if: 'Decisor',
  operacion: 'Evento', cliente: 'Origen', modulo: 'Destino',
};
function calcularRolReal(fuente) {
  // el wikilink es tejido narrativo, no una accion funcional -- no compite por "verbo dominante"
  // del rol, aunque si cuenta para agenciaReal (que mide "actua", no "que tipo de accion")
  let salientes = fuente.aristas.filter(a => a.source === fuente.entrada);
  if (fuente.tipo === 'relacional') salientes = salientes.filter(a => a.relacion !== 'wikilink');
  if (!salientes.length) return { rol: 'Pasivo', verboDominante: null, conteoVerbo: 0 };

  if (fuente.tipo === 'n8n' || fuente.tipo === 'sheet') {
    const cabeza = fuente.nodos.find(n => n.id === fuente.entrada);
    const tipoCabeza = cabeza ? cabeza.tipoReal : null;
    return { rol: ROL_POR_TIPO_CABEZA[tipoCabeza] || 'Ejecutor', verboDominante: tipoCabeza, conteoVerbo: salientes.length };
  }

  const verbo = fuente.tipo === 'apps_script' ? () => 'llama'
    : fuente.tipo === 'sheet_schema' ? () => 'depende_fk'
    : fuente.tipo === 'baserow_schema' ? () => 'depende_link'
    : (a) => a.relacion; // relacional (Holon) y node ya llevan su verbo real por arista

  const conteo = {};
  salientes.forEach(a => { const v = verbo(a); conteo[v] = (conteo[v] || 0) + 1; });
  const [verboDominante, conteoVerbo] = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];
  const rol = verboDominante === 'depende_de'
    ? (conteoVerbo >= 3 ? 'Orquestador' : 'Dependiente')
    : (ROL_POR_VERBO[verboDominante] || 'Actor');
  return { rol, verboDominante, conteoVerbo };
}
function conRolReal(fuente) {
  Object.assign(fuente, calcularRolReal(fuente));
  return fuente;
}

const entidades = {};
citasPorEntidad.forEach(c => {
  const fuentes = [];
  c.n8n.forEach(wf => { const f = fuenteN8n(wf); if (f) fuentes.push(f); });
  if (c.appsScript.length) { const f = fuenteAppsScript(c.appsScript); if (f) fuentes.push(f); }
  if (c.node.length) { const f = fuenteNode(c.node); if (f) fuentes.push(f); }
  c.sheet.forEach(clave => { const f = fuenteSheetMecanismo(clave); if (f) fuentes.push(f); });
  if (c.sheetTabs.length) { const f = fuenteSheetSchema(c.sheetTabs); if (f) fuentes.push(f); }
  if (c.baserowTablas.length) { const f = fuenteBaserowSchema(c.baserowTablas); if (f) fuentes.push(f); }
  if (fuentes.length) entidades[c.slug] = { nombre: c.nombre, fuentes: fuentes.map(f => conRolReal(conAgenciaReal(f))) };
});

// -- respaldo relacional: cualquier ficha real de la bóveda que todavía no tenga cuerpo propio --
wikilinks.nodos.forEach(n => {
  if (entidades[n.id]) return; // ya tiene un cuerpo mas fuerte (codigo/n8n/mecanismo Sheet), no se duplica
  const f = fuenteRelacional(n.id);
  if (f) entidades[n.id] = { nombre: n.nombre, fuentes: [conRolReal(conAgenciaReal(f))] };
});

// -- territorio propio (§8.45): de la columna real de cada entidad relacional, que fraccion de
// nodos NO aparece en la columna de ninguna otra entidad relacional -- mide cuanto de su cuerpo
// es identidad exclusiva suya frente a sustrato compartido del mismo componente del Holon.
// Solo tiene sentido para 'relacional', que es donde varias entidades comparten el mismo grafo base.
const relacionales = Object.entries(entidades).filter(([, e]) => e.fuentes.some(f => f.tipo === 'relacional'));
relacionales.forEach(([slug, e]) => {
  const f = e.fuentes.find(x => x.tipo === 'relacional');
  const nodosDeOtros = new Set();
  relacionales.forEach(([slugOtro, eOtro]) => {
    if (slugOtro === slug) return;
    eOtro.fuentes.find(x => x.tipo === 'relacional').espina.forEach(id => nodosDeOtros.add(id));
  });
  const propios = f.espina.filter(id => id !== slug && !nodosDeOtros.has(id));
  const base = f.espina.length - 1; // excluye la propia cabeza del calculo
  f.territorioPropio = base > 0 ? Math.round((propios.length / base) * 100) : 100;
});

const out = { generadoEn: new Date().toISOString(), totalEntidadesConAnatomia: Object.keys(entidades).length, entidades };
const rutaAnatomia = path.join(DIR, 'anatomia_entidades.json');
fs.writeFileSync(rutaAnatomia, JSON.stringify(out, null, 1));

actualizarFichaGrafo({
  rutaGrafo: rutaAnatomia,
  id: 'anatomia',
  nombre: 'Anatomía de entidades',
  tipo: 'Transversal',
  espacioReal: null,
  descripcion: 'Cabeza/columna/extremidades reales de las entidades, calculadas sobre 7 fuentes reales distintas (n8n, Apps Script, Node, Sheet, Baserow, vault).',
  extractor: 'extraer_anatomia_entidad.mjs',
  pagina: 'anatomia.html',
  contadores: { entidades: Object.keys(entidades).length },
});

console.log('Entidades con anatomia real:', Object.keys(entidades).length);
Object.entries(entidades).forEach(([slug, e]) => {
  console.log(`- ${e.nombre}: ${e.fuentes.map(f => `${f.tipo}(${f.nodos.length}n/espina ${f.espina.length})`).join(', ')}`);
});
