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

const TABLA_GASTO_API = 285;
const gastoLote = []; // acumula el gasto real de esta corrida (cualquier proveedor), para instrumentar lo que antes no se registraba

// Precios reales por millon de tokens (entrada/salida), por MODELO -- mismas cifras que usan
// los nodos reales de n8n ("Calcular coste Concilio" para deepseek-chat, "Extraer veredicto" +
// "Registrar gasto revision" para gpt-5.6-luna). SERVICIO distingue el proveedor para poder
// comparar; MODELO es el dato real que ya se usa en produccion para filtrar/agrupar en Baserow.
const PRECIOS_POR_MODELO = {
  'deepseek-chat': { servicio: 'deepseek', entrada: 0.44, salida: 1.32 },
  'gpt-5.6-luna': { servicio: null, entrada: 0.15, salida: 0.60 } // SERVICIO va null en las filas reales existentes -- el single_select de Baserow no tiene opcion "gpt" todavia
  // 'claude-...': añadir aqui el dia que el Coordinador (u otro mecanismo) llame a la API de Claude
};

function registrarUso(accion, contexto, j, modelo = 'deepseek-chat') {
  const usage = j.usage || {};
  const tokensEntrada = usage.prompt_tokens || 0;
  const tokensSalida = usage.completion_tokens || 0;
  const precio = PRECIOS_POR_MODELO[modelo] || PRECIOS_POR_MODELO['deepseek-chat'];
  const coste = Number(((tokensEntrada / 1e6) * precio.entrada + (tokensSalida / 1e6) * precio.salida).toFixed(6));
  gastoLote.push({ accion, contexto, modelo, servicio: precio.servicio, tokensEntrada, tokensSalida, coste });
}

async function guardarGastoEnBaserow() {
  if (!gastoLote.length) { console.log('Sin gasto de API que registrar (solo coincidencias deterministas).'); return; }
  const fecha = new Date().toISOString().slice(0, 10);
  const totalesPorModelo = {};
  let total = 0;
  for (const g of gastoLote) {
    total += g.coste;
    totalesPorModelo[g.modelo] = (totalesPorModelo[g.modelo] || 0) + g.coste;
    const body = {
      NOMBRE: 'coordinador_' + g.accion,
      MODELO: g.modelo,
      TOKENS_ENTRADA: g.tokensEntrada,
      TOKENS_SALIDA: g.tokensSalida,
      COSTE_ESTIMADO_USD: g.coste,
      ACCION: g.accion,
      CONTEXTO: g.contexto,
      FECHA: fecha
    };
    if (g.servicio) body.SERVICIO = g.servicio; // omitir si no hay opcion real en el single_select (ver PRECIOS_POR_MODELO)
    const r = await fetch(BASE + '/api/database/rows/table/' + TABLA_GASTO_API + '/?user_field_names=true', {
      method: 'POST', headers: { Authorization: TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if (r.status >= 400) console.log('AVISO: no se pudo registrar gasto de "' + g.accion + '" (' + r.status + ')');
  }
  console.log('Gasto real de esta corrida registrado en GASTO_API: ' + gastoLote.length + ' llamadas, $' + total.toFixed(6) + ' total, por modelo: ' + JSON.stringify(totalesPorModelo));
}

const TABLA_METRICA_FABRICACION = 1039;

async function guardarMetricaEnBaserow(nombreLote, resumen) {
  const body = {
    NOMBRE: nombreLote,
    FECHA: resumen.fecha.slice(0, 10),
    TOTAL_RESPUESTAS: String(resumen.total_respuestas),
    LIMPIAS_SIN_CORRECCION: String(resumen.limpias_sin_correccion),
    CORREGIDAS_CON_EXITO: String(resumen.corregidas_con_exito),
    CORRECCION_FALLIDA_A_RELEVO: String(resumen.correccion_fallida_a_relevo),
    REVISAR_SIN_INTENTO_CORRECCION: String(resumen.revisar_sin_intento_correccion),
    TOTAL_CAMPOS_FABRICADOS: String(resumen.total_campos_fabricados),
    TOTAL_CAPACIDADES_SIN_CONFIRMAR: String(resumen.total_capacidades_sin_confirmar),
    TASA_FABRICACION: String(resumen.tasa_fabricacion)
  };
  const r = await fetch(BASE + '/api/database/rows/table/' + TABLA_METRICA_FABRICACION + '/?user_field_names=true', {
    method: 'POST', headers: { Authorization: TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (r.status >= 400) { console.log('AVISO: no se pudo guardar la metrica en Baserow (' + r.status + ')'); return; }
  console.log('Metrica guardada en METRICA_FABRICACION (tabla ' + TABLA_METRICA_FABRICACION + ').');
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

async function extraerAfirmaciones(pregunta, texto, contexto) {
  const r = await fetch(DEEPSEEK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + DEEPSEEK_KEY },
    body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.1, messages: [
      { role: 'system', content: `Extrae SOLO afirmaciones de que un mecanismo YA EXISTE Y FUNCIONA HOY, fuera de lo que la propia pregunta pedia proponer/disenar.

PASO 1 -- clasifica la pregunta:
(a) DISENO: pide disenar, proponer, proponer pasos, o "como se podria automatizar/representar/migrar X" -- pide algo que NO existe aun y hay que construir.
(b) EXPLICACION/JUSTIFICACION: pide explicar, justificar, basarse en "hechos verificables", validar una conclusion, o describir por que algo es cierto -- asume o exige que lo descrito ya sea real HOY.

PASO 2 -- aplica la regla segun el tipo:
- Si es (a) DISENO: la descripcion del diseno propuesto (aunque este en presente, ej. "el script compara...") NO cuenta como afirmacion de existencia.
- Si es (b) EXPLICACION/JUSTIFICACION: CUALQUIER afirmacion en presente de que un mecanismo ya hace algo (ej. "permite que Baserow filtre y agrupe notas dinamicamente", "el campo ya es consultable") SI cuenta como afirmacion de existencia y debe extraerse, INCLUSO si suena tecnica o plausible, INCLUSO si el texto dice explicitamente que se ha "verificado". Que el texto afirme haber verificado algo no exime de comprobarlo -- extrae la afirmacion igual.

PASO 3 -- exclusiones, aplican SIEMPRE independientemente del paso 1/2:
- NUNCA extraigas una NEGACION (ej. "no existe campo que respalde X", "Baserow no puede hacer Y") -- decir que algo NO existe no es una afirmacion de existencia, es lo contrario.
- NUNCA extraigas razonamiento logico/comparativo general sin un mecanismo o capacidad concreta y nombrable (ej. "las carpetas requieren mantenimiento manual que no escala" es una opinion de diseno, no una afirmacion de que existe un mecanismo).
- Si la afirmacion cita explicitamente un mecanismo por su nombre real (ej. "el Verificador determinista de campos", "mecanismo 2"), extraela igualmente -- se comprobara contra el catalogo real, no la des por buena ni la descartes aqui.

Ejemplos:
- Pregunta "diseña el script de migracion" + Respuesta "el script compara fechas y decide si sobrescribir" -> NO es afirmacion de existencia (es la propuesta pedida, tipo a).
- Pregunta "explica por que X, basandote en hechos verificables" + Respuesta "esto es posible porque Baserow ya filtra y agrupa notas dinamicamente" -> SI es afirmacion de existencia (tipo b), extraerla tal cual.
- Respuesta (sin que se pregunte por ello) "Baserow ya filtra notas en tiempo real" -> SI es afirmacion de existencia.
- Respuesta "no existe campo ni tabla que respalde esa afirmacion en el esquema real" -> NO extraer (es una negacion).
- Respuesta "las carpetas requieren mantenimiento manual que no escala" -> NO extraer (opinion de diseno sin mecanismo nombrable).

Responde SOLO JSON: {"afirmaciones": [...]}. Si no hay ninguna afirmacion real de existencia actual, {"afirmaciones": []}.` },
      { role: 'user', content: 'PREGUNTA: ' + pregunta + '\n\nRESPUESTA: ' + texto } ] }) });
  const j = await r.json();
  registrarUso('extraer_afirmaciones', contexto, j);
  const afirmaciones = JSON.parse(j.choices[0].message.content.replace(/```json|```/g,'').trim()).afirmaciones;
  // filtro determinista de respaldo: el LLM no siempre respeta la exclusion de negaciones
  // pedida en el prompt -- nunca confiar solo en la instruccion, comprobar el patron.
  const PATRON_NEGACION = /\bno\s+(existe|hay|puede|permite|hace|funciona|est[aá])\b/i;
  return afirmaciones.filter(a => !PATRON_NEGACION.test(a));
}

function solapamientoPalabras(a, b) {
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').match(/[a-z0-9]+/g) || [];
  const wa = new Set(norm(a)), wb = norm(b);
  if (!wb.length) return 0;
  const comunes = wb.filter(w => wa.has(w)).length;
  return comunes / wb.length;
}

async function comprobarAfirmacion(afirmacion, catalogo, contexto) {
  // chequeo determinista primero: si la afirmacion cita el nombre real de un mecanismo del
  // catalogo (aunque sea parcialmente, ej. formateo distinto), se confirma sin depender del
  // juicio semantico de DeepSeek.
  const citaDirecta = catalogo.find(m => solapamientoPalabras(afirmacion, m.nombre) >= 0.7);
  if (citaDirecta) return { coincide: true, mecanismo: citaDirecta.nombre, nota: 'confirmado por cita directa del nombre real' };

  const lista = catalogo.map((m,i)=>(i+1)+'. '+m.nombre+': '+m.descripcion).join('\n');
  const r = await fetch(DEEPSEEK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + DEEPSEEK_KEY },
    body: JSON.stringify({ model: 'deepseek-chat', temperature: 0, messages: [
      { role: 'system', content: 'Catalogo REAL y COMPLETO. No existe nada mas. JSON: {"coincide": true/false, "mecanismo": "..." o null}.\n\n'+lista },
      { role: 'user', content: 'AFIRMACION: '+afirmacion } ] }) });
  const j = await r.json();
  registrarUso('comprobar_afirmacion', contexto, j);
  const bruto = j.choices[0].message.content.replace(/```json|```/g,'').trim();
  try { return JSON.parse(bruto); }
  catch { return { coincide: false, mecanismo: null, nota_parseo: bruto.slice(0, 150) }; }
}

async function corregir(tema, resultadoOriginal, camposFabricados, capacidadesSinConfirmar, catalogo, contexto) {
  const lista = catalogo.map((m,i)=>(i+1)+'. '+m.nombre+': '+m.descripcion).join('\n');
  const problemas = [];
  if (camposFabricados.length) problemas.push('Nombres de campo mencionados que NO existen en el esquema real de Baserow: ' + camposFabricados.join(', ') + '. Si son una propuesta de diseño, dejalo explicito con lenguaje de propuesta ("se podria añadir un campo..."); si no aportan nada al argumento, quitalos.');
  if (capacidadesSinConfirmar.length) problemas.push('Afirmaciones de que algo YA EXISTE o YA FUNCIONA que NO se pudieron confirmar contra el catalogo real de mecanismos: ' + capacidadesSinConfirmar.map(a=>'"'+a+'"').join('; ') + '. Reescribelas como propuesta explicita ("se podria...", "una posible extension seria..."), nunca como hecho ya confirmado.');
  const r = await fetch(DEEPSEEK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + DEEPSEEK_KEY },
    body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.2, messages: [
      { role: 'system', content: 'Eres el corrector de Concilio en Engremiat. Se te da una respuesta ya escrita y una lista de problemas concretos detectados por un verificador determinista contra hechos reales (no contra el juicio libre de otro modelo). Reescribe la respuesta corrigiendo SOLO esos problemas -- sin inventar nada nuevo, sin cambiar el resto del contenido mas de lo necesario, manteniendo el mismo tono y longitud aproximada.\n\nCATALOGO REAL Y COMPLETO de mecanismos que existen hoy -- no existe nada mas que esto:\n' + lista },
      { role: 'user', content: 'PREGUNTA ORIGINAL: ' + tema + '\n\nRESPUESTA A CORREGIR:\n' + resultadoOriginal + '\n\nPROBLEMAS A CORREGIR:\n' + problemas.join('\n') } ] }) });
  const j = await r.json();
  registrarUso('corregir', contexto, j);
  return j.choices[0].message.content.trim();
}

async function atomizar(nombreOrigen, tema, resultado) {
  const r = await fetch(DEEPSEEK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + DEEPSEEK_KEY },
    body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.3, messages: [
      { role: 'system', content: 'Eres el Coordinador de Engremiat. Dada una pregunta ya respondida y verificada (sin fabricaciones), identifica 2-3 aspectos que quedan abiertos, ambiguos, o que merecen profundizarse -- NO repitas la pregunta original, atomiza en sub-preguntas mas concretas. Responde SOLO JSON: {"sub_preguntas": ["...", "...", "..."]}.' },
      { role: 'user', content: 'PREGUNTA ORIGINAL: ' + tema + '\n\nRESPUESTA VERIFICADA: ' + resultado } ] }) });
  const j = await r.json();
  registrarUso('atomizar', nombreOrigen, j);
  return JSON.parse(j.choices[0].message.content.replace(/```json|```/g,'').trim()).sub_preguntas;
}

async function main() {
  const rutaEntrada = process.argv[2] || 'C:/Users/pc/AppData/Local/Temp/claude/G--Mi-unidad-DEVS/8d5c5706-0aac-4c2a-9810-71ffffbdee92/scratchpad/boveda_resultados.json';
  const rutaSalida = process.argv[3] || 'C:/Users/pc/AppData/Local/Temp/claude/G--Mi-unidad-DEVS/8d5c5706-0aac-4c2a-9810-71ffffbdee92/scratchpad/coordinador_informe.json';
  const filas = JSON.parse(readFileSync(rutaEntrada, 'utf-8'));
  const esquema = await cargarEsquemaBaserow();
  const catalogo = await cargarCatalogoMecanismos();

  async function verificar(tema, resultado, tablaRelevante, yaPropuestos, contexto) {
    const vCampos = verificarCampos(resultado, tablaRelevante, esquema, yaPropuestos);
    const afirmaciones = await extraerAfirmaciones(tema, resultado, contexto);
    const vCapacidades = [];
    for (const a of afirmaciones) {
      const v = await comprobarAfirmacion(a, catalogo, contexto);
      vCapacidades.push({ afirmacion: a, ...v });
    }
    const sospechosasCapacidad = vCapacidades.filter(v => !v.coincide);
    const limpio = (!vCampos.aplica || vCampos.fabricados.length === 0) && sospechosasCapacidad.length === 0;
    return { vCampos, sospechosasCapacidad, limpio };
  }

  const informe = [];
  for (const fila of filas) {
    const profundidad = fila.PROFUNDIDAD || 1; // profundidad de ESTA fila (1 = primer nivel, ya atomizado desde una pregunta raiz)
    const yaPropuestos = fila.CAMPOS_YA_PROPUESTOS || []; // heredados del nivel padre, para no re-marcarlos por no repetir la señal de propuesta localmente
    console.log('=== ' + fila.NOMBRE + ' (profundidad ' + profundidad + (yaPropuestos.length ? ', ' + yaPropuestos.length + ' campos heredados' : '') + ') ===');

    let resultado = fila.RESULTADO;
    let { vCampos, sospechosasCapacidad, limpio } = await verificar(fila.TEMA, resultado, fila.TABLA_RELEVANTE, yaPropuestos, fila.NOMBRE);
    console.log('  campos fabricados:', vCampos.aplica ? vCampos.fabricados.length : 'n/a');
    console.log('  capacidades sin confirmar:', sospechosasCapacidad.length, sospechosasCapacidad.map(s=>s.afirmacion));

    let correccionIntentada = false;
    if (!limpio && (vCampos.fabricados.length || sospechosasCapacidad.length)) {
      console.log('  -> intentando UNA correccion antes de mandar a Relevo...');
      correccionIntentada = true;
      const corregido = await corregir(fila.TEMA, resultado, vCampos.fabricados, sospechosasCapacidad.map(s=>s.afirmacion), catalogo, fila.NOMBRE);
      const reverificacion = await verificar(fila.TEMA, corregido, fila.TABLA_RELEVANTE, yaPropuestos, fila.NOMBRE + '_recorreccion');
      console.log('  tras corregir -> campos fabricados:', reverificacion.vCampos.aplica ? reverificacion.vCampos.fabricados.length : 'n/a', '| capacidades sin confirmar:', reverificacion.sospechosasCapacidad.length);
      if (reverificacion.limpio) {
        console.log('  -> la correccion funciono, se trata como LIMPIO');
        resultado = corregido;
        ({ vCampos, sospechosasCapacidad, limpio } = reverificacion);
      } else {
        console.log('  -> la correccion NO fue suficiente, se manda a Relevo con el intento documentado');
      }
    }
    const bajoTope = profundidad < TOPE_PROFUNDIDAD;

    const propuestosAqui = vCampos.aplica ? vCampos.propuestos : [];
    const propuestosAcumulados = [...new Set([...yaPropuestos, ...propuestosAqui])];
    const entrada = { nombre: fila.NOMBRE, profundidad, limpio, correccion_intentada: correccionIntentada, resultado_final: resultado, campos_fabricados: vCampos.aplica ? vCampos.fabricados : [], capacidades_sin_confirmar: sospechosasCapacidad.map(s=>s.afirmacion), campos_propuestos_aqui: propuestosAqui };

    if (limpio && bajoTope) {
      console.log('  veredicto: LIMPIO, bajo tope -> atomizar a profundidad ' + (profundidad + 1));
      const subPreguntas = await atomizar(fila.NOMBRE, fila.TEMA, resultado);
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

  const resumen = {
    fecha: new Date().toISOString(),
    total_respuestas: informe.length,
    limpias_sin_correccion: informe.filter(e => e.limpio && !e.correccion_intentada).length,
    corregidas_con_exito: informe.filter(e => e.limpio && e.correccion_intentada).length,
    correccion_fallida_a_relevo: informe.filter(e => !e.limpio && e.correccion_intentada).length,
    revisar_sin_intento_correccion: informe.filter(e => !e.limpio && !e.correccion_intentada).length,
    total_campos_fabricados: informe.reduce((s, e) => s + (e.campos_fabricados ? e.campos_fabricados.length : 0), 0),
    total_capacidades_sin_confirmar: informe.reduce((s, e) => s + (e.capacidades_sin_confirmar ? e.capacidades_sin_confirmar.length : 0), 0)
  };
  resumen.tasa_fabricacion = resumen.total_respuestas ? +((resumen.revisar_sin_intento_correccion + resumen.correccion_fallida_a_relevo) / resumen.total_respuestas).toFixed(2) : 0;

  writeFileSync(rutaSalida, JSON.stringify(informe, null, 1));
  writeFileSync(rutaSalida.replace(/\.json$/, '_resumen.json'), JSON.stringify(resumen, null, 1));
  console.log('\nInforme guardado en ' + rutaSalida);
  console.log('Resumen:', JSON.stringify(resumen, null, 1));

  const nombreLote = process.argv[4] || ('Lote-' + rutaEntrada.split(/[\\/]/).pop().replace(/\.json$/, '') + '-' + resumen.fecha.slice(0, 10));
  await guardarMetricaEnBaserow(nombreLote, resumen);
  await guardarGastoEnBaserow();
}
main();
