#!/usr/bin/env node
/*
 * Valoracion tecnica automatica por DeepSeek (complementa tecnico.html, §8.100).
 * Mismo proveedor real que ya usa tools/coordinador.mjs y spike_concilio_coop/servidor.mjs
 * (DEEPSEEK_URL/DEEPSEEK_KEY/registro en GASTO_API, tabla 285) -- reutilizado, no reinventado.
 *
 * Ciclo real: por cada tarea real del backlog de "Grafos del sistema" (taller.html/CORE), se
 * envia a DeepSeek el enunciado real + contexto real del proyecto (reglas de oro, patrones ya
 * probados) para que proponga un enfoque -- ANTES de que un humano/worker la ejecute de verdad.
 * Esto NO sustituye la evidencia real de crear_ficha_prompt.mjs (funciono/fallo de una prueba
 * genuina) -- la complementa como un primer filtro, mas barato que probar en vivo.
 *
 * Guarda de gasto real: antes de llamar, suma el gasto real de GASTO_API del mes en curso y
 * aborta si ya alcanzo el tope documentado de $5/mes (ver resumen_universo.html).
 *
 * Uso (JSON via stdin, evita escapar comillas en la shell):
 *   node evaluar_tarea_deepseek.mjs < tarea.json
 *
 * Forma real esperada del JSON de entrada:
 * {
 *   "id": "extractor_por_tipo_deepseek",
 *   "tareaId": "TAR-0002/0003/0004",
 *   "titulo": "Escribir un extractor mapear_grafo_X.mjs para un tipo real del vault",
 *   "descripcion": "...",
 *   "contexto": ["regla de oro: solo lectura...", "ya existe cargar_desde_vault.mjs que..."]
 * }
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const RUTA_SALIDA = join(DIR_VISOR, 'evaluaciones_deepseek.json');

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY || readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.deepseek_key', 'utf-8').trim();
const BASE_BASEROW = process.env.BASEROW_URL || 'http://100.107.171.88';
const TOKEN_BASEROW = process.env.BASEROW_TOKEN || readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.baserow_token', 'utf-8').trim();
const TABLA_GASTO_API = 285;
// Mismas cifras reales que ya usa tools/coordinador.mjs para deepseek-chat.
const PRECIO = { entrada: 0.44, salida: 1.32 };
const TOPE_MENSUAL_USD = 5;

async function gastoRealDelMes() {
  const mesActual = new Date().toISOString().slice(0, 7); // "2026-09"
  let total = 0;
  let url = BASE_BASEROW + '/api/database/rows/table/' + TABLA_GASTO_API + '/?user_field_names=true&size=200';
  while (url) {
    const j = await (await fetch(url, { headers: { Authorization: TOKEN_BASEROW } })).json();
    for (const fila of j.results || []) {
      if ((fila.FECHA || '').startsWith(mesActual)) total += Number(fila.COSTE_ESTIMADO_USD || 0);
    }
    url = j.next;
  }
  return total;
}

async function registrarGasto(accion, contexto, tokensEntrada, tokensSalida) {
  const coste = Number(((tokensEntrada / 1e6) * PRECIO.entrada + (tokensSalida / 1e6) * PRECIO.salida).toFixed(6));
  const fecha = new Date().toISOString().slice(0, 10);
  const r = await fetch(BASE_BASEROW + '/api/database/rows/table/' + TABLA_GASTO_API + '/?user_field_names=true', {
    method: 'POST', headers: { Authorization: TOKEN_BASEROW, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      NOMBRE: 'tecnico_evaluar_' + contexto, MODELO: 'deepseek-chat', SERVICIO: 'deepseek',
      TOKENS_ENTRADA: tokensEntrada, TOKENS_SALIDA: tokensSalida, COSTE_ESTIMADO_USD: coste,
      ACCION: accion, CONTEXTO: contexto, FECHA: fecha
    })
  });
  if (r.status >= 400) console.error('AVISO: no se pudo registrar el gasto real en GASTO_API (' + r.status + ')');
  return coste;
}

async function pedirValoracion(titulo, descripcion, contexto) {
  const systemPrompt = 'Eres el asesor tecnico de desarrollo de Engremiat. Se te da una tarea real del backlog y contexto real del proyecto (reglas ya vigentes, patrones ya probados). Responde SOLO JSON con esta forma exacta: {"valoracion": "...", "propuesta": "...", "riesgos": ["...", "..."], "pasos": ["...", "..."]}. "valoracion" es tu juicio sobre la dificultad/enfoque general (2-4 frases). "propuesta" es el enfoque de desarrollo concreto que recomiendas. "riesgos" son errores concretos a evitar, dado el contexto real. "pasos" es una lista ordenada de pasos reales. Nunca inventes nombres de fichero o funciones que no te hayan dado en el contexto -- si necesitas nombrar algo nuevo, dilo como propuesta explicita.';
  const userContent = 'TAREA: ' + titulo + '\n\nDESCRIPCION: ' + descripcion +
    (contexto && contexto.length ? '\n\nCONTEXTO REAL DEL PROYECTO:\n- ' + contexto.join('\n- ') : '');
  const r = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + DEEPSEEK_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-chat', temperature: 0.3,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }]
    })
  });
  const j = await r.json();
  if (!j.choices) throw new Error('DEEPSEEK_ERROR: ' + JSON.stringify(j));
  const bruto = j.choices[0].message.content.replace(/```json|```/g, '').trim();
  const usage = j.usage || {};
  return { parseado: JSON.parse(bruto), tokensEntrada: usage.prompt_tokens || 0, tokensSalida: usage.completion_tokens || 0 };
}

async function main() {
  const entrada = JSON.parse(readFileSync(0, 'utf-8'));
  const { id, tareaId, titulo, descripcion } = entrada;
  const contexto = entrada.contexto || [];
  if (!id || !titulo || !descripcion) {
    console.error('Faltan campos reales obligatorios: id, titulo, descripcion.');
    process.exit(1);
  }

  const gastoMes = await gastoRealDelMes();
  if (gastoMes >= TOPE_MENSUAL_USD) {
    console.error('Tope real de $' + TOPE_MENSUAL_USD + '/mes ya alcanzado ($' + gastoMes.toFixed(4) + ' gastados este mes) -- abortando sin llamar a DeepSeek.');
    process.exit(1);
  }

  console.log('Gasto real del mes hasta ahora: $' + gastoMes.toFixed(4) + ' (tope $' + TOPE_MENSUAL_USD + ').');
  const { parseado, tokensEntrada, tokensSalida } = await pedirValoracion(titulo, descripcion, contexto);
  const coste = await registrarGasto('evaluar_tarea', id, tokensEntrada, tokensSalida);

  const datos = existsSync(RUTA_SALIDA) ? JSON.parse(readFileSync(RUTA_SALIDA, 'utf-8')) : { evaluaciones: {} };
  datos.evaluaciones[id] = {
    id, tareaId: tareaId || null, titulo, descripcion, contextoEnviado: contexto,
    valoracion: parseado.valoracion, propuesta: parseado.propuesta,
    riesgos: parseado.riesgos || [], pasos: parseado.pasos || [],
    modelo: 'deepseek-chat', tokensEntrada, tokensSalida, costeUsd: coste,
    comparacion: datos.evaluaciones?.[id]?.comparacion || null,
    generadoEn: new Date().toISOString()
  };
  writeFileSync(RUTA_SALIDA, JSON.stringify(datos, null, 2), 'utf-8');
  console.log('Valoracion real de DeepSeek escrita para "' + titulo + '" ($' + coste.toFixed(6) + ', ' + tokensEntrada + '+' + tokensSalida + ' tokens).');
}

main().catch(e => { console.error(e); process.exit(1); });
