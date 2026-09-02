#!/usr/bin/env node
/*
 * Fase B2 de Telar -- deliberacion real en solo lectura.
 * Ver PROPUESTA_TELAR_INTERFAZ_OPERATIVA.md §16: "adaptar las respuestas reales
 * de los Acervos al contrato de §3.4; validar y mostrar hilos; conservar la
 * respuesta original; medir latencia/coste/fallos de JSON; comparar experiencia
 * con 2, 3 y mas participantes; ninguna escritura productiva."
 *
 * Real de verdad: llama a DeepSeek de verdad (mismo roster de Acervos que
 * spike_concilio_coop/servidor.mjs), pide el contrato estructurado de §3.4
 * (hechos/propuestas/riesgos/faltantes/disensos) en vez del texto libre que
 * usaba el Spike, y valida cada respuesta contra contribucion.schema.json
 * con ajv real -- no una simulacion.
 *
 * "Ninguna escritura productiva" = nunca escribe en 92_BUS_TRABAJO (Sheets,
 * el continente de clientes reales). SI registra el coste real en GASTO_API
 * (Baserow, nucleo soberano) -- es el mismo criterio que ya sigue todo el
 * proyecto para cualquier llamada real a DeepSeek, no una escritura nueva.
 *
 * Uso: node deliberar_b2.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR_TELAR = join(__dirname, '..');
const DIR_SCHEMAS = join(DIR_TELAR, 'schemas');
const DIR_FIXTURES = join(DIR_TELAR, 'fixtures');
const DIR_RESPUESTAS = join(__dirname, 'respuestas_originales');
if (!existsSync(DIR_RESPUESTAS)) mkdirSync(DIR_RESPUESTAS, { recursive: true });

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY || readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.deepseek_key', 'utf-8').trim();
const BASE_BASEROW = process.env.BASEROW_URL || 'http://100.107.171.88';
const TOKEN_BASEROW = process.env.BASEROW_TOKEN || readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.baserow_token', 'utf-8').trim();
const TABLA_GASTO_API = 285;
const PRECIO = { entrada: 0.44, salida: 1.32 }; // USD por 1M tokens, deepseek-chat

// Mismo roster real que spike_concilio_coop/servidor.mjs -- ninguna voz nueva.
const ROSTER = {
  'Acervo Tecnico': 'Tu unica pregunta es: esto es implementable, mantenible, con coste real de construir? Responde siempre desde ahi.',
  'Acervo Logico': 'Exiges cadena de causa-efecto, sin saltarse pasos. Preguntas "y eso por que se sigue de lo anterior?".',
  'Acervo Logistico': 'Piensas en flujo real de trabajo: quien, cuando, con que recursos. Conviertes una buena idea en algo ejecutable de verdad.',
  'Acervo Narrativo': 'Velas por la coherencia de la historia, el tono, la continuidad.',
  'Acervo Filosofico': 'Preguntas por que y a quien sirve algo -- soberania, dignidad, "Nothing About Us Without Us". Devuelves cualquier propuesta a la Mision antes de dejarla avanzar.',
  'Acervo Usuario': 'Hablas desde la perspectiva de quien usa esto sin saber nada de por dentro -- no defiendes ningun mecanismo, defiendes a quien va a tocar el resultado.',
  'Acervo Sociocracia': 'Defiendes la legitimidad del proceso de decision: consentimiento, no mayoria -- "nadie tiene objecion razonada".'
};

function leerJson(ruta) { return JSON.parse(readFileSync(ruta, 'utf-8')); }
function slug(nombre) { return nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

const ajv = new Ajv2020({ allErrors: true, strict: false });
for (const n of readdirSync(DIR_SCHEMAS)) ajv.addSchema(leerJson(join(DIR_SCHEMAS, n)));
const validarContribucion = ajv.getSchema('https://engremiat.local/telar/contribucion.schema.json');

async function pedirContribucionEstructurada(nombreAcervo, systemPromptRol, mision, intentoPrevioInvalido) {
  const instruccionJson = 'Responde EXCLUSIVAMENTE en JSON valido (sin texto fuera del JSON) con esta forma exacta: ' +
    '{"vozBreve": "tu voz real, primera persona, breve", ' +
    '"hechos": [{"texto": "...", "estado": "VERIFICADO|PENDIENTE_DE_COMPROBAR|INFERENCIA"}], ' +
    '"propuestas": ["accion concreta"], "riesgos": ["..."], "faltantes": ["dato que necesitarias y no tienes"], ' +
    '"disensos": ["objecion que mantienes aunque no sea mayoritaria"], "referencias": ["identificador citado, si aplica"]}. ' +
    'Si no tienes nada que aportar en un campo, usa un array vacio -- nunca inventes contenido para rellenarlo.';

  const mensajeUsuario = 'Mision real: "' + mision.titulo + '". Objetivo: ' + mision.objetivo + '. ' +
    'Contexto: ' + mision.por_que_ahora + '. Tension: ' + mision.tension + '. ' +
    'Ya se sabe: ' + mision.conocido.join('; ') + '. Falta saber: ' + mision.faltantes.join('; ') + '.' +
    (intentoPrevioInvalido ? '\n\nTu respuesta anterior no era JSON valido segun este error: "' + intentoPrevioInvalido + '". Corrigelo y responde solo el JSON.' : '');

  const t0 = Date.now();
  const r = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + DEEPSEEK_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-chat',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Eres ' + nombreAcervo + ', un Acervo real del Concilio de Engremiat. ' + systemPromptRol + ' ' + instruccionJson },
        { role: 'user', content: mensajeUsuario }
      ],
      temperature: 0.4
    })
  });
  const latenciaMs = Date.now() - t0;
  const j = await r.json();
  if (!j.choices) throw new Error('DEEPSEEK_ERROR: ' + JSON.stringify(j));
  const usage = j.usage || {};
  const coste = ((usage.prompt_tokens || 0) / 1e6) * PRECIO.entrada + ((usage.completion_tokens || 0) / 1e6) * PRECIO.salida;
  return { textoBruto: j.choices[0].message.content, coste, latenciaMs };
}

async function registrarGastoReal(nombreAcervo, coste) {
  try {
    await fetch(BASE_BASEROW + '/api/database/rows/table/' + TABLA_GASTO_API + '/?user_field_names=true', {
      method: 'POST', headers: { Authorization: TOKEN_BASEROW, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        NOMBRE: 'telar_b2_' + slug(nombreAcervo), MODELO: 'deepseek-chat', SERVICIO: 'deepseek',
        COSTE_ESTIMADO_USD: Number(coste.toFixed(6)), ACCION: 'deliberacion_b2_contrato_estructurado', CONTEXTO: nombreAcervo,
        FECHA: new Date().toISOString().slice(0, 10)
      })
    });
  } catch (e) { console.log('AVISO: no se pudo registrar gasto real -- ' + e.message); }
}

async function deliberarConRoster(mision, nombresAcervos, etiquetaRonda) {
  console.log('\n=== Ronda: ' + etiquetaRonda + ' (' + nombresAcervos.length + ' Acervos) ===');
  const resultados = [];
  for (const nombre of nombresAcervos) {
    let intentos = 0;
    let ultimoError = null;
    let contribucionFinal = null;

    while (intentos < 2 && !contribucionFinal) {
      intentos++;
      const { textoBruto, coste, latenciaMs } = await pedirContribucionEstructurada(nombre, ROSTER[nombre], mision, ultimoError);

      const idRespuesta = 'b2-' + slug(nombre) + '-' + Date.now();
      writeFileSync(join(DIR_RESPUESTAS, idRespuesta + '.txt'), textoBruto, 'utf-8');

      let modelo;
      try { modelo = JSON.parse(textoBruto); } catch (e) { ultimoError = 'JSON.parse fallo: ' + e.message; continue; }

      const contribucion = {
        participanteId: 'acervo-' + slug(nombre),
        rol: nombre,
        vozBreve: modelo.vozBreve || '',
        hechos: modelo.hechos || [],
        propuestas: modelo.propuestas || [],
        riesgos: modelo.riesgos || [],
        faltantes: modelo.faltantes || [],
        disensos: modelo.disensos || [],
        referencias: modelo.referencias || [],
        respuestaOriginalRef: idRespuesta,
        estadoContrato: 'ok'
      };

      const ok = validarContribucion(contribucion);
      if (!ok) {
        ultimoError = validarContribucion.errors.map(e => e.instancePath + ' ' + e.message).join('; ');
        continue;
      }

      contribucionFinal = contribucion;
      resultados.push({ contribucion, coste, latenciaMs, intentos });
      await registrarGastoReal(nombre, coste);
      console.log('OK   ' + nombre + '  (intento ' + intentos + '/2, ' + latenciaMs + 'ms, $' + coste.toFixed(6) + ')');
    }

    if (!contribucionFinal) {
      const err = {
        participanteId: 'acervo-' + slug(nombre), rol: nombre, vozBreve: '', hechos: [], propuestas: [],
        riesgos: [], faltantes: [], disensos: [], referencias: [], respuestaOriginalRef: 'sin-guardar',
        estadoContrato: 'ERR', errorDetalle: ultimoError
      };
      resultados.push({ contribucion: err, coste: 0, latenciaMs: 0, intentos });
      console.log('ERR  ' + nombre + '  (' + intentos + ' intentos agotados: ' + ultimoError + ')');
    }
  }

  const validas = resultados.filter(r => r.contribucion.estadoContrato === 'ok').length;
  const costeTotal = resultados.reduce((s, r) => s + r.coste, 0);
  const latenciaTotal = resultados.reduce((s, r) => s + r.latenciaMs, 0);
  return { etiqueta: etiquetaRonda, participantes: nombresAcervos.length, validas, costeTotal, latenciaTotal, resultados };
}

async function main() {
  const mision = leerJson(join(DIR_FIXTURES, '01_sin_seleccionar.json'));
  console.log('=== B2: deliberacion real en solo lectura ===');
  console.log('Mision: "' + mision.titulo + '" (misma historia fixture que B0/B1, ahora con Acervos reales)');

  const ronda2 = await deliberarConRoster(mision, ['Acervo Tecnico', 'Acervo Logistico'], '2 participantes');
  const ronda3 = await deliberarConRoster(mision, ['Acervo Tecnico', 'Acervo Logistico', 'Acervo Filosofico'], '3 participantes');

  const informe = {
    generado: new Date().toISOString(),
    mision: mision.id,
    rondas: [ronda2, ronda3].map(r => ({
      etiqueta: r.etiqueta, participantes: r.participantes,
      tasaValidezContrato: r.validas + '/' + r.participantes,
      costeTotalUsd: Number(r.costeTotal.toFixed(6)),
      latenciaTotalMs: r.latenciaTotal,
      latenciaMediaMs: Math.round(r.latenciaTotal / r.participantes)
    }))
  };

  writeFileSync(join(__dirname, 'informe_ultima_ejecucion.json'), JSON.stringify(informe, null, 2), 'utf-8');

  console.log('\n=== Comparacion 2 vs 3 participantes ===');
  console.table(informe.rondas);
  console.log('\nInforme guardado en informe_ultima_ejecucion.json. Respuestas originales conservadas en respuestas_originales/.');
}

main().catch(e => { console.error('ERROR', e.message); process.exitCode = 1; });
