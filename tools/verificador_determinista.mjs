// Verificador determinista: comprueba afirmaciones de campo de Baserow
// contra el esquema real, NO contra el juicio de otro modelo.
// Uso: node verificador_determinista.mjs <texto.txt> <TABLA_RELEVANTE> [esquema.json]
import { readFileSync } from 'node:fs';

const esquemaReal = JSON.parse(readFileSync(process.argv[4] || 'C:/Users/pc/AppData/Local/Temp/claude/G--Mi-unidad-DEVS/8d5c5706-0aac-4c2a-9810-71ffffbdee92/scratchpad/esquema_real_baserow.json', 'utf-8'));

const tablaRelevante = (process.argv[3] || '').toUpperCase();
const camposDeLaTabla = new Set(
  esquemaReal.filter(c => c.tabla.toUpperCase() === tablaRelevante).map(c => c.campo.toUpperCase())
);
const camposEnOtrasTablas = new Map(); // CAMPO -> [tablas donde existe, distintas de la relevante]
for (const c of esquemaReal) {
  if (c.tabla.toUpperCase() === tablaRelevante) continue;
  const key = c.campo.toUpperCase();
  if (!camposEnOtrasTablas.has(key)) camposEnOtrasTablas.set(key, []);
  camposEnOtrasTablas.get(key).push(c.tabla);
}
const tablasReales = new Set(esquemaReal.map(c => c.tabla.toUpperCase()));

const PATRON_CAMPO = /\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+){1,5}\b/g;
const RUIDO = new Set(['UE', 'IA', 'JSON', 'API', 'URL', 'ID', 'UI', 'UX', 'WCAG', 'HTML', 'CSS', 'SQL', 'HTTP', 'HTTPS', 'CRUD', 'REST']);
// Señales de que el candidato es una PROPUESTA de campo nuevo (parte de un diseño
// pedido por la pregunta), no una afirmación de que ya existe -- mismo problema
// que se corrigio en el extractor de capacidades del Coordinador, aplicado aqui
// de forma determinista (regex de proximidad, sin LLM).
const SENAL_PROPUESTA = /(se añade|añadir|nuevo campo|nuevos campos|propongo|propone|generar|crear un campo|crear campo|nombres? únicos?)/i;
const VENTANA_CONTEXTO = 60; // caracteres antes del candidato en los que se busca la señal

function esValorDeCampoReal(texto, indice, candidato) {
  // Detecta patron "CAMPOREAL=candidato" o "CAMPOREAL = candidato" -- el candidato
  // es un VALOR de un campo real, no una afirmacion de que "candidato" es un campo.
  const antes = texto.slice(Math.max(0, indice - 40), indice);
  const m = antes.match(/([A-Za-z][A-Za-z0-9_]*)\s*=\s*$/);
  if (!m) return false;
  return camposDeLaTabla.has(m[1].toUpperCase()) || camposEnOtrasTablas.has(m[1].toUpperCase());
}

function esPropuestaDeDiseno(texto, indice) {
  const antes = texto.slice(Math.max(0, indice - VENTANA_CONTEXTO), indice);
  return SENAL_PROPUESTA.test(antes);
}

function verificar(texto) {
  const vistos = new Set();
  const candidatos = [];
  const propuestos = [];
  for (const m of texto.matchAll(PATRON_CAMPO)) {
    const c = m[0];
    const C = c.toUpperCase();
    if (RUIDO.has(C)) continue;
    if (esValorDeCampoReal(texto, m.index, c)) continue; // es un valor, no una afirmacion de campo
    if (esPropuestaDeDiseno(texto, m.index)) { if (!vistos.has(C)) { propuestos.push(c); vistos.add(C); } continue; }
    if (vistos.has(C)) continue;
    vistos.add(C);
    candidatos.push(c);
  }
  const verificadoEnTabla = [];
  const existeEnOtraTabla = [];
  const tablaMencionada = [];
  const noExiste = [];
  for (const c of candidatos) {
    const C = c.toUpperCase();
    if (camposDeLaTabla.has(C)) verificadoEnTabla.push(c);
    else if (camposEnOtrasTablas.has(C)) existeEnOtraTabla.push({ campo: c, tablas: camposEnOtrasTablas.get(C) });
    else if (tablasReales.has(C)) tablaMencionada.push(c);
    else noExiste.push(c);
  }
  return { candidatos: candidatos.length, verificadoEnTabla, existeEnOtraTabla, tablaMencionada, noExiste, propuestos };
}

const textoArg = readFileSync(process.argv[2], 'utf-8');
const r = verificar(textoArg);

console.log('=== Verificador determinista (acotado a tabla: ' + (tablaRelevante || '(ninguna)') + ') ===');
console.log('Candidatos detectados:', r.candidatos);

console.log('\nVERIFICADOS en la tabla relevante:');
console.log(r.verificadoEnTabla.length ? r.verificadoEnTabla.map(c=>'  OK  '+c).join('\n') : '  (ninguno)');

console.log('\nEXISTEN pero en OTRA tabla (sospechoso, revisar a mano):');
console.log(r.existeEnOtraTabla.length ? r.existeEnOtraTabla.map(x=>'  !!  '+x.campo+'  (existe en: '+x.tablas.join(', ')+')').join('\n') : '  (ninguno)');

console.log('\nTablas reales mencionadas (no son campos, no cuentan como fallo):');
console.log(r.tablaMencionada.length ? r.tablaMencionada.map(c=>'  --  '+c).join('\n') : '  (ninguna)');

console.log('\nNO EXISTEN en ningún sitio del esquema real (fabricado):');
console.log(r.noExiste.length ? r.noExiste.map(c=>'  ??  '+c).join('\n') : '  (ninguno)');

console.log('\nPROPUESTOS como campo nuevo (señal de diseño detectada, no cuentan como fabricación):');
console.log(r.propuestos.length ? r.propuestos.map(c=>'  ->  '+c).join('\n') : '  (ninguno)');
