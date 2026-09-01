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
const TOPE_PROFUNDIDAD = 2; // niveles de atomizacion permitidos antes de forzar Relevo humano

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

// Señales de que el candidato es una PROPUESTA de campo nuevo (parte de un
// diseño pedido por la pregunta), no una afirmación de que ya existe --
// deteccion determinista por proximidad de texto, sin LLM.
const SENAL_PROPUESTA = /(se añade|añadir|nuevo campo|nuevos campos|propongo|propone|generar|crear un campo|crear campo|nombres? únicos?)/i;
const VENTANA_CONTEXTO = 60;

function verificarCampos(texto, tablaRelevante, esquema, yaPropuestos = []) {
  if (!tablaRelevante) return { aplica: false };
  const T = tablaRelevante.toUpperCase();
  const camposDeLaTabla = new Set(esquema.filter(c => c.tabla === T).map(c => c.campo));
  const camposEnCualquierTabla = new Set(esquema.map(c => c.campo));
  const tablasReales = new Set(esquema.map(c => c.tabla));
  const permitidosHeredados = new Set(yaPropuestos.map(c => c.toUpperCase()));
  const RUIDO = new Set(['UE','IA','JSON','API','URL','ID','UI','UX','WCAG','HTML','CSS','SQL','HTTP','HTTPS','CRUD','REST']);

  function esValorDeCampoReal(indice) {
    const antes = texto.slice(Math.max(0, indice - 40), indice);
    const m = antes.match(/([A-Za-z][A-Za-z0-9_]*)\s*=\s*$/);
    if (!m) return false;
    return camposEnCualquierTabla.has(m[1].toUpperCase());
  }
  function esPropuestaDeDiseno(indice) {
    return SENAL_PROPUESTA.test(texto.slice(Math.max(0, indice - VENTANA_CONTEXTO), indice));
  }

  const vistos = new Set();
  const candidatos = [];
  const propuestos = [];
  for (const m of texto.matchAll(/\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+){1,5}\b/g)) {
    const c = m[0]; const C = c.toUpperCase();
    if (RUIDO.has(C) || vistos.has(C)) continue;
    if (esValorDeCampoReal(m.index)) continue;
    if (esPropuestaDeDiseno(m.index)) { propuestos.push(c); vistos.add(C); continue; }
    vistos.add(C);
    candidatos.push(c);
  }
  const fabricados = candidatos.filter(c => {
    const C = c.toUpperCase();
    return !camposDeLaTabla.has(C) && !tablasReales.has(C) && !permitidosHeredados.has(C);
  });
  return { aplica: true, fabricados, propuestos };
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
  const rutaEntrada = process.argv[2] || 'C:/Users/pc/AppData/Local/Temp/claude/G--Mi-unidad-DEVS/8d5c5706-0aac-4c2a-9810-71ffffbdee92/scratchpad/boveda_resultados.json';
  const rutaSalida = process.argv[3] || 'C:/Users/pc/AppData/Local/Temp/claude/G--Mi-unidad-DEVS/8d5c5706-0aac-4c2a-9810-71ffffbdee92/scratchpad/coordinador_informe.json';
  const filas = JSON.parse(readFileSync(rutaEntrada, 'utf-8'));
  const esquema = await cargarEsquemaBaserow();
  const catalogo = await cargarCatalogoMecanismos();

  const informe = [];
  for (const fila of filas) {
    const profundidad = fila.PROFUNDIDAD || 1; // profundidad de ESTA fila (1 = primer nivel, ya atomizado desde una pregunta raiz)
    const yaPropuestos = fila.CAMPOS_YA_PROPUESTOS || []; // heredados del nivel padre, para no re-marcarlos por no repetir la señal de propuesta localmente
    console.log('=== ' + fila.NOMBRE + ' (profundidad ' + profundidad + (yaPropuestos.length ? ', ' + yaPropuestos.length + ' campos heredados' : '') + ') ===');
    const vCampos = verificarCampos(fila.RESULTADO, fila.TABLA_RELEVANTE, esquema, yaPropuestos);
    const afirmaciones = await extraerAfirmaciones(fila.TEMA, fila.RESULTADO);
    const vCapacidades = [];
    for (const a of afirmaciones) {
      const v = await comprobarAfirmacion(a, catalogo);
      vCapacidades.push({ afirmacion: a, ...v });
    }
    const sospechosasCapacidad = vCapacidades.filter(v => !v.coincide);
    const limpio = (!vCampos.aplica || vCampos.fabricados.length === 0) && sospechosasCapacidad.length === 0;
    const bajoTope = profundidad < TOPE_PROFUNDIDAD;

    console.log('  campos fabricados:', vCampos.aplica ? vCampos.fabricados.length : 'n/a');
    console.log('  capacidades sin confirmar:', sospechosasCapacidad.length, sospechosasCapacidad.map(s=>s.afirmacion));

    const propuestosAqui = vCampos.aplica ? vCampos.propuestos : [];
    const propuestosAcumulados = [...new Set([...yaPropuestos, ...propuestosAqui])];
    const entrada = { nombre: fila.NOMBRE, profundidad, limpio, campos_fabricados: vCampos.aplica ? vCampos.fabricados : [], capacidades_sin_confirmar: sospechosasCapacidad.map(s=>s.afirmacion), campos_propuestos_aqui: propuestosAqui };

    if (limpio && bajoTope) {
      console.log('  veredicto: LIMPIO, bajo tope -> atomizar a profundidad ' + (profundidad + 1));
      const subPreguntas = await atomizar(fila.NOMBRE, fila.TEMA, fila.RESULTADO);
      entrada.veredicto = 'atomizado';
      entrada.sub_preguntas_generadas = subPreguntas.map(sp => ({ texto: sp, profundidad: profundidad + 1, camposYaPropuestos: propuestosAcumulados }));
      console.log('  sub-preguntas:', subPreguntas.length);
      for (const sp of subPreguntas) console.log('    -', sp);
    } else if (limpio && !bajoTope) {
      console.log('  veredicto: LIMPIO pero tope de profundidad (' + TOPE_PROFUNDIDAD + ') alcanzado -> a Relevo humano, NO se atomiza mas');
      entrada.veredicto = 'limpio_tope_alcanzado';
    } else {
      console.log('  veredicto: REVISAR -> a Relevo, no atomizar');
      entrada.veredicto = 'revisar';
    }
    informe.push(entrada);
  }

  writeFileSync(rutaSalida, JSON.stringify(informe, null, 1));
  console.log('\nInforme guardado en ' + rutaSalida);
}
main();
