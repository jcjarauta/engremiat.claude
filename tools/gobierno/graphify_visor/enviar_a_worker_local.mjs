#!/usr/bin/env node
/*
 * Envia una tarea real al worker local (Ollama, devstral-dev) -- complementa tecnico.html
 * (§8.102), mismo espiritu que evaluar_tarea_deepseek.mjs pero contra el modelo local en
 * vez de la API de pago, mismo formato de entrada para poder comparar ambas respuestas
 * sobre la misma tarea real.
 *
 * Bloqueo real encontrado y decidido con el operador: Ollama en esta maquina solo escucha
 * en 127.0.0.1 y rechaza (403) peticiones de navegador con origen distinto por su politica
 * CORS -- un boton en vivo desde tecnico.html (servido en el VPS) no puede llamarlo
 * directamente. Se opto por NO tocar la configuracion de red de Ollama: este script corre
 * en local (aqui SI hay acceso real a localhost:11434) y el resultado se sirve despues como
 * fichero estatico de solo lectura, igual que evaluaciones_deepseek.json.
 *
 * Uso (JSON via stdin, evita escapar comillas en la shell):
 *   node enviar_a_worker_local.mjs < tarea.json
 *
 * Forma real esperada del JSON de entrada (misma forma que evaluar_tarea_deepseek.mjs):
 * {
 *   "id": "extractor_recurso_worker_local",
 *   "tareaId": "TAR-0002",
 *   "titulo": "Extractor real de tipo Recurso",
 *   "descripcion": "...",
 *   "contexto": ["..."]
 * }
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const RUTA_SALIDA = join(DIR_VISOR, 'respuestas_worker_local.json');
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
const MODELO = process.env.MODELO_WORKER_LOCAL || 'devstral-dev';

async function pedirRespuesta(titulo, descripcion, contexto) {
  const systemPrompt = 'Eres el worker local de desarrollo de Engremiat. Se te da una tarea real del backlog y contexto real del proyecto (reglas ya vigentes, patrones ya probados). Responde SOLO JSON con esta forma exacta: {"valoracion": "...", "propuesta": "...", "riesgos": ["...", "..."], "pasos": ["...", "..."]}. Nunca inventes nombres de fichero o funciones que no te hayan dado en el contexto -- si necesitas nombrar algo nuevo, dilo como propuesta explicita.';
  const userContent = 'TAREA: ' + titulo + '\n\nDESCRIPCION: ' + descripcion +
    (contexto && contexto.length ? '\n\nCONTEXTO REAL DEL PROYECTO:\n- ' + contexto.join('\n- ') : '');
  const inicio = Date.now();
  const r = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODELO, stream: false,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }]
    })
  });
  const j = await r.json();
  if (j.error) throw new Error('OLLAMA_ERROR: ' + JSON.stringify(j));
  const duracionSegundos = (Date.now() - inicio) / 1000;
  const bruto = j.message.content.replace(/```json|```/g, '').trim();
  let parseado;
  try { parseado = JSON.parse(bruto); }
  catch { parseado = { valoracion: null, propuesta: bruto, riesgos: [], pasos: [] }; } // el modelo local no siempre respeta "SOLO JSON" -- se guarda igual como propuesta en bruto, nunca se descarta
  return {
    parseado,
    tokensEntrada: j.prompt_eval_count || 0,
    tokensSalida: j.eval_count || 0,
    duracionSegundos
  };
}

async function main() {
  const entrada = JSON.parse(readFileSync(0, 'utf-8'));
  const { id, tareaId, titulo, descripcion } = entrada;
  const contexto = entrada.contexto || [];
  if (!id || !titulo || !descripcion) {
    console.error('Faltan campos reales obligatorios: id, titulo, descripcion.');
    process.exit(1);
  }

  console.log('Enviando a ' + MODELO + ' (local, $0 real, sin tope de gasto)...');
  const { parseado, tokensEntrada, tokensSalida, duracionSegundos } = await pedirRespuesta(titulo, descripcion, contexto);

  const datos = existsSync(RUTA_SALIDA) ? JSON.parse(readFileSync(RUTA_SALIDA, 'utf-8')) : { respuestas: {} };
  datos.respuestas[id] = {
    id, tareaId: tareaId || null, titulo, descripcion, contextoEnviado: contexto,
    valoracion: parseado.valoracion, propuesta: parseado.propuesta,
    riesgos: parseado.riesgos || [], pasos: parseado.pasos || [],
    modelo: MODELO, tokensEntrada, tokensSalida, duracionSegundos,
    comparacion: datos.respuestas?.[id]?.comparacion || null,
    generadoEn: new Date().toISOString()
  };
  writeFileSync(RUTA_SALIDA, JSON.stringify(datos, null, 2), 'utf-8');
  console.log('Respuesta real del worker local escrita para "' + titulo + '" (' + tokensEntrada + '+' + tokensSalida + ' tokens, ' + duracionSegundos.toFixed(1) + 's, $0).');
}

main().catch(e => { console.error(e); process.exit(1); });
