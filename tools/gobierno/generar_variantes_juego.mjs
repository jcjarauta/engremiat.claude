#!/usr/bin/env node
/*
 * Convierte cada personaje real de personajes.json en 2-3 lineas cortas de
 * dialogo de videojuego -- usando DeepSeek (herramienta ya real del
 * ecosistema, no Claude), con la misma disciplina de siempre: acotado y
 * verificable (reformular, nunca anadir hechos que no esten en la fuente
 * real), coste registrado en GASTO_API como cualquier otra llamada real.
 *
 * Mismo patron de auth/coste que coordinador.mjs -- no se reinventa nada.
 *
 * Uso: node generar_variantes_juego.mjs <personajes.json> [--out salida.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_KEY = readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.deepseek_key', 'utf-8').trim();
const BASE_BASEROW = process.env.BASEROW_URL || 'http://100.107.171.88';
const TOKEN_BASEROW = process.env.BASEROW_TOKEN;
const TABLA_GASTO_API = 285;
const PRECIO = { entrada: 0.44, salida: 1.32 }; // USD por millon de tokens, deepseek-chat

function args() {
  const a = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--out') out.out = a[++i];
    else if (!out.entrada) out.entrada = a[i];
  }
  return out;
}

async function pedirVariante(personaje) {
  const prompt = `Texto real sobre "${personaje.id}", del universo Engremiat:\n\n"""\n${personaje.dialogo}\n"""\n\nReformula este texto en 2-3 frases cortas de dialogo de videojuego, en primera persona, tono directo -- SOLO usando hechos que ya estan en el texto de arriba. No inventes nada nuevo, no anadas numeros ni afirmaciones que no esten ahi. Responde solo con las frases, sin comillas ni explicacion.`;

  const r = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + DEEPSEEK_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4
    })
  });
  const j = await r.json();
  if (!j.choices) throw new Error('DEEPSEEK_ERROR: ' + JSON.stringify(j));
  const usage = j.usage || {};
  const coste = ((usage.prompt_tokens || 0) / 1e6) * PRECIO.entrada + ((usage.completion_tokens || 0) / 1e6) * PRECIO.salida;
  return { variante: j.choices[0].message.content.trim(), tokensEntrada: usage.prompt_tokens || 0, tokensSalida: usage.completion_tokens || 0, coste };
}

async function registrarGastoReal(gastoLote) {
  if (!TOKEN_BASEROW || !gastoLote.length) {
    console.log('AVISO: sin BASEROW_TOKEN o sin gasto -- no se registra en GASTO_API (variantes generadas igualmente).');
    return;
  }
  const fecha = new Date().toISOString().slice(0, 10);
  for (const g of gastoLote) {
    const body = {
      NOMBRE: 'generar_variantes_juego_' + g.id,
      MODELO: 'deepseek-chat', SERVICIO: 'deepseek',
      TOKENS_ENTRADA: g.tokensEntrada, TOKENS_SALIDA: g.tokensSalida,
      COSTE_ESTIMADO_USD: Number(g.coste.toFixed(6)),
      ACCION: 'generar_variante_dialogo', CONTEXTO: g.id, FECHA: fecha
    };
    await fetch(BASE_BASEROW + '/api/database/rows/table/' + TABLA_GASTO_API + '/?user_field_names=true', {
      method: 'POST', headers: { Authorization: TOKEN_BASEROW, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
  }
  console.log('Gasto real registrado en GASTO_API: ' + gastoLote.length + ' llamadas.');
}

async function main() {
  const { entrada, out } = args();
  if (!entrada) { console.log('Uso: node generar_variantes_juego.mjs <personajes.json> [--out salida.json]'); process.exit(1); }
  const datos = JSON.parse(readFileSync(entrada, 'utf8'));

  const resultado = [];
  const gastoLote = [];
  let costeTotal = 0;

  for (const p of datos.personajes) {
    process.stdout.write('Generando variante de ' + p.id + '... ');
    try {
      const r = await pedirVariante(p);
      resultado.push({ id: p.id, dialogoReal: p.dialogo, varianteJuego: r.variante });
      gastoLote.push({ id: p.id, tokensEntrada: r.tokensEntrada, tokensSalida: r.tokensSalida, coste: r.coste });
      costeTotal += r.coste;
      console.log('OK ($' + r.coste.toFixed(6) + ')');
    } catch (e) {
      console.log('FALLO: ' + e.message);
    }
  }

  console.log('\nCoste total real de esta corrida: $' + costeTotal.toFixed(6));
  await registrarGastoReal(gastoLote);

  if (out) {
    writeFileSync(out, JSON.stringify({ generado: new Date().toISOString(), costeTotal, personajes: resultado }, null, 1));
    console.log('Escrito ' + out);
  } else {
    console.log(JSON.stringify(resultado, null, 1));
  }
}

main();
