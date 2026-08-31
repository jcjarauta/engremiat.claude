// Coordinador -- primera version real.
// 1) Verifica una respuesta ya procesada (campos + capacidades) contra hechos reales.
// 2) Si esta limpia: pide al Prompter que la atomice en 2-3 sub-preguntas (un solo nivel de profundidad, con tope).
// 3) Si esta marcada: NO la atomiza -- la deja para Relevo humano.
// Nunca decide publicar nada -- solo prepara material para Relevo.
import { readFileSync, writeFileSync } from 'node:fs';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_KEY = readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.deepseek_key', 'utf-8').trim();
const BASE = 'http://100.107.171.88';
const TOKEN = readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.baserow_token', 'utf-8').trim();
const TOPE_PROFUNDIDAD = 1; // solo un nivel de atomizacion en esta primera prueba

async function cargarEsquemaBaserow() {
  const tablas = await (await fetch(BASE + '/api/database/tables/all-tables/', { headers: { Authorization: TOKEN } })).json();
  const todos = [];
  for (const t of tablas) {
    const campos = await (await fetch(BASE + '/api/database/fields/table/' + t.id + '/', { headers: { Authorization: TOKEN } })).json();
    for (const c of campos) todos.push({ tabla: t.name.toUpperCase(), campo: c.name.toUpperCase() });
  }
  return todos;
}

async function cargarCatalogoMecanismos() {
  const j = await (await fetch(BASE + '/api/database/rows/table/1038/?user_field_names=true&filter__TIPO__equal=mecanismo_real&size=100', { headers: { Authorization: TOKEN } })).json();
  return j.results.map(row => ({ nombre: row.NOMBRE, descripcion: row.TEMA }));
}

function verificarCampos(texto, tablaRelevante, esquema) {
  if (!tablaRelevante) return { aplica: false };
  const T = tablaRelevante.toUpperCase();
  const camposDeLaTabla = new Set(esquema.filter(c => c.tabla === T).map(c => c.campo));
  const tablasReales = new Set(esquema.map(c => c.tabla));
  const RUIDO = new Set(['UE','IA','JSON','API','URL','ID','UI','UX','WCAG','HTML','CSS','SQL','HTTP','HTTPS','CRUD','REST']);
  const candidatos = [...new Set((texto.match(/\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+){1,5}\b/g) || []))].filter(c => !RUIDO.has(c.toUpperCase()));
  const fabricados = candidatos.filter(c => { const C = c.toUpperCase(); return !camposDeLaTabla.has(C) && !tablasReales.has(C); });
  return { aplica: true, fabricados };
}

async function extraerAfirmaciones(pregunta, texto) {
  const r = await fetch(DEEPSEEK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + DEEPSEEK_KEY },
    body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.1, messages: [
      { role: 'system', content: `Extrae SOLO afirmaciones de que un mecanismo YA EXISTE Y FUNCIONA HOY, fuera de lo que la propia pregunta pedia proponer/disenar.

PASO 1 -- clasifica la pregunta:
(a) DISENO: pide disenar, proponer, proponer pasos, o "como se podria automatizar/representar/migrar X" -- pide algo que NO existe aun y hay que construir.
(b) EXPLICACION/JUSTIFICACION: pide explicar, justificar, basarse en "hechos verificables", validar una conclusion, o describir por que algo es cierto -- asume o exige que lo descrito ya sea real HOY.

PASO 2 -- aplica la regla segun el tipo:
- Si es (a) DISENO: la descripcion del diseno propuesto (aunque este en presente, ej. "el script compara...") NO cuenta como afirmacion de existencia.
- Si es (b) EXPLICACION/JUSTIFICACION: CUALQUIER afirmacion en presente de que un mecanismo ya hace algo (ej. "permite que Baserow filtre y agrupe notas dinamicamente", "el campo ya es consultable") SI cuenta como afirmacion de existencia y debe extraerse, INCLUSO si suena tecnica o plausible, INCLUSO si el texto dice explicitamente que se ha "verificado". Que el texto afirme haber verificado algo no exime de comprobarlo -- extrae la afirmacion igual.

Ejemplos:
- Pregunta "diseña el script de migracion" + Respuesta "el script compara fechas y decide si sobrescribir" -> NO es afirmacion de existencia (es la propuesta pedida, tipo a).
- Pregunta "explica por que X, basandote en hechos verificables" + Respuesta "esto es posible porque Baserow ya filtra y agrupa notas dinamicamente" -> SI es afirmacion de existencia (tipo b), extraerla tal cual.
- Respuesta (sin que se pregunte por ello) "Baserow ya filtra notas en tiempo real" -> SI es afirmacion de existencia.

Responde SOLO JSON: {"afirmaciones": [...]}. Si no hay ninguna afirmacion real de existencia actual, {"afirmaciones": []}.` },
      { role: 'user', content: 'PREGUNTA: ' + pregunta + '\n\nRESPUESTA: ' + texto } ] }) });
  const j = await r.json();
  return JSON.parse(j.choices[0].message.content.replace(/```json|```/g,'').trim()).afirmaciones;
}

async function comprobarAfirmacion(afirmacion, catalogo) {
  const lista = catalogo.map((m,i)=>(i+1)+'. '+m.nombre+': '+m.descripcion).join('\n');
  const r = await fetch(DEEPSEEK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + DEEPSEEK_KEY },
    body: JSON.stringify({ model: 'deepseek-chat', temperature: 0, messages: [
      { role: 'system', content: 'Catalogo REAL y COMPLETO. No existe nada mas. JSON: {"coincide": true/false, "mecanismo": "..." o null}.\n\n'+lista },
      { role: 'user', content: 'AFIRMACION: '+afirmacion } ] }) });
  const j = await r.json();
  const bruto = j.choices[0].message.content.replace(/```json|```/g,'').trim();
  try { return JSON.parse(bruto); }
  catch { return { coincide: false, mecanismo: null, nota_parseo: bruto.slice(0, 150) }; }
}

async function atomizar(nombreOrigen, tema, resultado) {
  const r = await fetch(DEEPSEEK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + DEEPSEEK_KEY },
    body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.3, messages: [
      { role: 'system', content: 'Eres el Coordinador de Engremiat. Dada una pregunta ya respondida y verificada (sin fabricaciones), identifica 2-3 aspectos que quedan abiertos, ambiguos, o que merecen profundizarse -- NO repitas la pregunta original, atomiza en sub-preguntas mas concretas. Responde SOLO JSON: {"sub_preguntas": ["...", "...", "..."]}.' },
      { role: 'user', content: 'PREGUNTA ORIGINAL: ' + tema + '\n\nRESPUESTA VERIFICADA: ' + resultado } ] }) });
  const j = await r.json();
  return JSON.parse(j.choices[0].message.content.replace(/```json|```/g,'').trim()).sub_preguntas;
}

async function main() {
  const filas = JSON.parse(readFileSync('C:/Users/pc/AppData/Local/Temp/claude/G--Mi-unidad-DEVS/8d5c5706-0aac-4c2a-9810-71ffffbdee92/scratchpad/boveda_resultados.json', 'utf-8'));
  const esquema = await cargarEsquemaBaserow();
  const catalogo = await cargarCatalogoMecanismos();

  const informe = [];
  for (const fila of filas) {
    console.log('=== ' + fila.NOMBRE + ' ===');
    const vCampos = verificarCampos(fila.RESULTADO, fila.TABLA_RELEVANTE, esquema);
    const afirmaciones = await extraerAfirmaciones(fila.TEMA, fila.RESULTADO);
    const vCapacidades = [];
    for (const a of afirmaciones) {
      const v = await comprobarAfirmacion(a, catalogo);
      vCapacidades.push({ afirmacion: a, ...v });
    }
    const sospechosasCapacidad = vCapacidades.filter(v => !v.coincide);
    const limpio = (!vCampos.aplica || vCampos.fabricados.length === 0) && sospechosasCapacidad.length === 0;

    console.log('  campos fabricados:', vCampos.aplica ? vCampos.fabricados.length : 'n/a');
    console.log('  capacidades sin confirmar:', sospechosasCapacidad.length, sospechosasCapacidad.map(s=>s.afirmacion));
    console.log('  veredicto:', limpio ? 'LIMPIO -> atomizar' : 'REVISAR -> a Relevo, no atomizar');

    const entrada = { nombre: fila.NOMBRE, limpio, campos_fabricados: vCampos.aplica ? vCampos.fabricados : [], capacidades_sin_confirmar: sospechosasCapacidad.map(s=>s.afirmacion) };

    if (limpio) {
      const subPreguntas = await atomizar(fila.NOMBRE, fila.TEMA, fila.RESULTADO);
      entrada.sub_preguntas_generadas = subPreguntas;
      console.log('  sub-preguntas:', subPreguntas.length);
      for (const sp of subPreguntas) console.log('    -', sp);
    }
    informe.push(entrada);
  }

  writeFileSync('C:/Users/pc/AppData/Local/Temp/claude/G--Mi-unidad-DEVS/8d5c5706-0aac-4c2a-9810-71ffffbdee92/scratchpad/coordinador_informe.json', JSON.stringify(informe, null, 1));
  console.log('\nInforme guardado.');
}
main();
