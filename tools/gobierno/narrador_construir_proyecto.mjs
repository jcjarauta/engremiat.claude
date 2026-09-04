#!/usr/bin/env node
/*
 * Narrador -- modo construccion (paso 2 del encaje como juego cooperativo,
 * ver PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md §8.54-55).
 *
 * Reutiliza dos mecanismos reales ya probados, no inventa uno nuevo:
 * - la elicitacion conversacional corta de Telar (pocas preguntas reales,
 *   DeepSeek sintetiza un boceto coherente, nunca inventa fuera de lo dado);
 * - el patron proponer/confirmar de Cronista (el modelo propone, SOLO un
 *   humano confirma, y solo entonces se escribiria algo real).
 *
 * Este script es SOLO la mitad "proponer" -- no escribe nada en el Sheet.
 * La mitad "confirmar" necesita una accion nueva en el webhook real
 * (WebhookTelegramService.js) que todavia no existe y no se despliega sin
 * confirmacion explicita del operador (ver nota al final de este fichero).
 *
 * Uso: node narrador_construir_proyecto.mjs "<que quiere construir>" "<por que lo necesita>" "<que lo dificulta hoy>"
 */
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY || readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.deepseek_key', 'utf-8').trim();
const PRECIO = { entrada: 0.44, salida: 1.32 }; // USD/1M tokens, mismo precio real ya usado en spike_concilio_coop

const SHEETS_SPREADSHEET_ID = '142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ'; // Gestor de Proyectos - LaTroballa Software
const SHEETS_CREDENCIALES_PATH = process.env.ENGREMIAT_SHEETS_CREDENTIALS_PATH || 'G:\\Mi unidad\\DEVS\\engremiat-6259cee67897.json';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function obtenerAccessTokenSheets() {
  const cred = JSON.parse(readFileSync(SHEETS_CREDENCIALES_PATH, 'utf-8'));
  const ahora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({ iss: cred.client_email, scope: SHEETS_SCOPE, aud: 'https://oauth2.googleapis.com/token', exp: ahora + 3600, iat: ahora }));
  const firmante = createSign('RSA-SHA256');
  firmante.update(header + '.' + claim);
  firmante.end();
  const jwt = header + '.' + claim + '.' + base64url(firmante.sign(cred.private_key));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('AUTH_FAILED_SHEETS: ' + JSON.stringify(j));
  return j.access_token;
}

// -- catalogo real de TIPO_PROYECTO/PRIORIDAD, leido en vivo de 90_CONFIGURACION --
// nunca duplicado a mano: si alguien anade una categoria real nueva ahi, este
// script la ve sin que haya que tocar su codigo.
async function leerCatalogoReal() {
  const token = await obtenerAccessTokenSheets();
  const r = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets/' + SHEETS_SPREADSHEET_ID + '/values/90_CONFIGURACION!A1:C100',
    { headers: { Authorization: 'Bearer ' + token } }
  );
  const j = await r.json();
  const filas = (j.values || []).slice(1); // sin cabecera
  const porCategoria = {};
  for (const [, categoria, clave] of filas) {
    if (!categoria || !clave) continue;
    (porCategoria[categoria] = porCategoria[categoria] || []).push(clave);
  }
  return { tipoProyecto: porCategoria.TIPO_PROYECTO || [], prioridad: porCategoria.PRIORIDAD || [] };
}

async function proponerProyecto(queConstruye, necesidad, obstaculo, catalogo) {
  const systemPrompt = `Eres el Narrador de Engremiat, acompañando a un cliente real a construir un Proyecto real -- no una ficción. ` +
    `Convierte sus tres respuestas en una propuesta de Proyecto real, estructurada, en JSON. ` +
    `No inventes nada que no se derive de las respuestas dadas -- si algo no está claro, dilo en OBSERVACIONES, no lo rellenes con relleno genérico. ` +
    `TIPO_PROYECTO debe ser EXACTAMENTE uno de estos valores reales: ${catalogo.tipoProyecto.join(', ')}. ` +
    `PRIORIDAD debe ser EXACTAMENTE uno de estos valores reales: ${catalogo.prioridad.join(', ')}. ` +
    `Responde solo el JSON, sin explicación adicional, con las claves: NOMBRE, DESCRIPCION, OBJETIVO, RESULTADO_ESPERADO, CRITERIOS_ACEPTACION, TIPO_PROYECTO, PRIORIDAD, OBSERVACIONES.`;

  const userPrompt = `Qué quiere construir: ${queConstruye}\nPor qué lo necesita: ${necesidad}\nQué lo dificulta hoy: ${obstaculo}`;

  const r = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + DEEPSEEK_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    })
  });
  const j = await r.json();
  if (!j.choices) throw new Error('DEEPSEEK_ERROR: ' + JSON.stringify(j));
  const usage = j.usage || {};
  const coste = ((usage.prompt_tokens || 0) / 1e6) * PRECIO.entrada + ((usage.completion_tokens || 0) / 1e6) * PRECIO.salida;
  return { propuesta: JSON.parse(j.choices[0].message.content), coste };
}

async function main() {
  const [queConstruye, necesidad, obstaculo] = process.argv.slice(2);
  if (!queConstruye || !necesidad || !obstaculo) {
    console.error('Uso: node narrador_construir_proyecto.mjs "<que quiere construir>" "<por que lo necesita>" "<que lo dificulta hoy>"');
    process.exitCode = 1;
    return;
  }

  console.log('Leyendo catálogo real de TIPO_PROYECTO/PRIORIDAD desde 90_CONFIGURACION...');
  const catalogo = await leerCatalogoReal();
  console.log('  TIPO_PROYECTO real:', catalogo.tipoProyecto.join(', '));
  console.log('  PRIORIDAD real:', catalogo.prioridad.join(', '));

  console.log('\nPidiendo al Narrador (DeepSeek) que proponga el Proyecto...');
  const { propuesta, coste } = await proponerProyecto(queConstruye, necesidad, obstaculo, catalogo);

  console.log('\n=== PROPUESTA -- NO ESCRITA, pendiente de confirmación humana ===');
  console.log(JSON.stringify(propuesta, null, 1));
  console.log('\nCoste real de esta propuesta: $' + coste.toFixed(6));
  console.log('\nPara escribirla de verdad hace falta una acción nueva en el webhook real');
  console.log('(WebhookTelegramService.js) -- todavía no existe, no se despliega sin confirmación.');
}

main().catch((e) => { console.error('ERROR', e.message); process.exitCode = 1; });
