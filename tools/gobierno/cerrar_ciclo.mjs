#!/usr/bin/env node
/*
 * Script directo de cierre de ciclo (sin worker, sin LLM -- ver
 * CICLO_AUDITORIA_ENGREMIAT.md, categoria "Script directo, sin worker
 * ni brief": transformacion deterministica, sin ambiguedad, no
 * necesita juicio).
 *
 * Nace de reemplazar el trabajo manual de crear pestana + escribir
 * filas + formatear cabecera via herramientas MCP (89.8s medidos el
 * 2026-08-25) por esto: mismo resultado, 2.5s medidos, cualquier ciclo
 * futuro solo cambia el JSON de datos.
 *
 * Uso:
 *   node cerrar_ciclo.mjs <spreadsheetId> <nombrePestana> <datos.json>
 *
 * <datos.json> = { "headers": [...], "rows": [[...], [...]] }
 *
 * Si la pestana ya existe, AÑADE las filas nuevas a las que ya haya
 * (no la vacia ni la recrea) -- mismo principio que "regenerar
 * preserva estado" ya aplicado a la Consola.
 *
 * Autenticacion: JWT firmado con la cuenta de servicio de Sheets
 * (ENGREMIAT_SHEETS_CREDENTIALS_PATH, o por defecto la ruta ya usada
 * por el resto del ecosistema), sin dependencias externas -- solo
 * crypto nativo de Node + fetch.
 */
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const CREDENCIALES_PATH = process.env.ENGREMIAT_SHEETS_CREDENTIALS_PATH || 'G:\\Mi unidad\\DEVS\\engremiat-6259cee67897.json';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function obtenerAccessToken() {
  const cred = JSON.parse(readFileSync(CREDENCIALES_PATH, 'utf8'));
  const ahora = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({
    iss: cred.client_email,
    scope: SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    exp: ahora + 3600,
    iat: ahora,
  }));

  const firmante = createSign('RSA-SHA256');
  firmante.update(`${header}.${claim}`);
  firmante.end();
  const firma = base64url(firmante.sign(cred.private_key));

  const jwt = `${header}.${claim}.${firma}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('AUTH_FAILED: ' + JSON.stringify(data));
  return data.access_token;
}

async function llamarSheets(token, spreadsheetId, metodo, ruta, body) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${ruta}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (data.error) throw new Error(`SHEETS_API_ERROR: ${JSON.stringify(data.error)}`);
  return data;
}

async function obtenerOCrearPestana(token, spreadsheetId, nombrePestana) {
  const meta = await llamarSheets(token, spreadsheetId, 'GET', '');
  const existente = meta.sheets.find((s) => s.properties.title === nombrePestana);
  if (existente) return { sheetId: existente.properties.sheetId, nueva: false };

  const creada = await llamarSheets(token, spreadsheetId, 'POST', ':batchUpdate', {
    requests: [{ addSheet: { properties: { title: nombrePestana, gridProperties: { rowCount: 200, columnCount: 26 } } } }],
  });
  return { sheetId: creada.replies[0].addSheet.properties.sheetId, nueva: true };
}

async function obtenerFilaLibre_(token, spreadsheetId, nombrePestana) {
  const datos = await llamarSheets(token, spreadsheetId, 'GET', `/values/${encodeURIComponent(nombrePestana)}!A:A`);
  return (datos.values || []).length + 1; // 1-based, siguiente fila libre
}

async function cerrarCiclo(spreadsheetId, nombrePestana, datosPath) {
  const inicio = Date.now();
  const { headers, rows } = JSON.parse(readFileSync(datosPath, 'utf8'));
  const token = await obtenerAccessToken();

  const { sheetId, nueva } = await obtenerOCrearPestana(token, spreadsheetId, nombrePestana);

  if (nueva) {
    await llamarSheets(
      token, spreadsheetId, 'PUT',
      `/values/${encodeURIComponent(nombrePestana)}!A1?valueInputOption=USER_ENTERED`,
      { values: [headers, ...rows] },
    );
    await llamarSheets(token, spreadsheetId, 'POST', ':batchUpdate', {
      requests: [{
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.85, green: 0.9, blue: 0.98 } } },
          fields: 'userEnteredFormat(textFormat,backgroundColor)',
        },
      }],
    });
  } else {
    const filaLibre = await obtenerFilaLibre_(token, spreadsheetId, nombrePestana);
    await llamarSheets(
      token, spreadsheetId, 'PUT',
      `/values/${encodeURIComponent(nombrePestana)}!A${filaLibre}?valueInputOption=USER_ENTERED`,
      { values: rows },
    );
  }

  const duracion = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`Cierre de ciclo completo: ${rows.length} fila(s) en '${nombrePestana}' (${nueva ? 'pestana nueva' : 'anadidas a la existente'}), ${duracion}s.`);
}

const [, , spreadsheetId, nombrePestana, datosPath] = process.argv;
if (!spreadsheetId || !nombrePestana || !datosPath) {
  console.error('Uso: node cerrar_ciclo.mjs <spreadsheetId> <nombrePestana> <datos.json>');
  process.exit(1);
}
await cerrarCiclo(spreadsheetId, nombrePestana, datosPath);
