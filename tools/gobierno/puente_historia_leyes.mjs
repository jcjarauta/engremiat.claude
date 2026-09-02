#!/usr/bin/env node
/*
 * Puente Historia<->Leyes -- el primer Mensajero real con este nombre
 * (ver Universos/Engremiat/02_Personajes/Mensajero.md).
 *
 * Un unico proposito: lee una TAREA real de Baserow (el nucleo soberano,
 * donde vive Historia) y, SOLO si hace falta, escribe una REFERENCIA --
 * nunca el contenido completo -- como fila nueva en 18_VINCULO del lado
 * Sheets (el continente de clientes operativos reales). Nunca al reves,
 * nunca automatico, nunca sin rastro.
 *
 * Respeta la regla de los dos continentes de datos (MAPA_DOMINIOS_DATOS.md):
 * mueve un ID que apunta al otro continente, no duplica el dato.
 *
 * Modo por defecto: DRY RUN -- imprime lo que haria, no escribe nada.
 * --aplicar: escribe de verdad (fila en 18_VINCULO + rastro en 92_BUS_TRABAJO).
 *
 * Uso:
 *   node puente_historia_leyes.mjs --tarea <ID_FILA_BASEROW> \
 *     --vincula-a "<Tipo>:<ID>" [--tipo-vinculo "<texto>"] \
 *     [--sheet <spreadsheetId>] [--aplicar]
 *
 * Ejemplo (dry run):
 *   node puente_historia_leyes.mjs --tarea 42 --vincula-a "Incidencia:INC-0067"
 *
 * Variables de entorno esperadas (nunca hardcodear secretos en el repo):
 *   BASEROW_URL                       -- ej. http://100.107.171.88 (mismo BASE que coordinador.mjs)
 *   BASEROW_TOKEN                     -- token real de Baserow
 *   ENGREMIAT_SHEETS_CREDENTIALS_PATH -- ruta a la cuenta de servicio de Sheets
 *                                        (por defecto, la misma que usa cerrar_ciclo.mjs)
 */
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const BASE_BASEROW = process.env.BASEROW_URL || 'http://100.107.171.88';
const TOKEN_BASEROW = process.env.BASEROW_TOKEN;
const CREDENCIALES_SHEETS_PATH = process.env.ENGREMIAT_SHEETS_CREDENTIALS_PATH || 'G:\\Mi unidad\\DEVS\\engremiat-6259cee67897.json';
const SHEET_POR_DEFECTO = '142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ'; // Gestor de Proyectos - LaTroballa Software
const SCOPE_SHEETS = 'https://www.googleapis.com/auth/spreadsheets';

function leerArgs() {
  const args = process.argv.slice(2);
  const out = { aplicar: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tarea') out.tarea = args[++i];
    else if (args[i] === '--vincula-a') out.vinculaA = args[++i];
    else if (args[i] === '--tipo-vinculo') out.tipoVinculo = args[++i];
    else if (args[i] === '--sheet') out.sheet = args[++i];
    else if (args[i] === '--aplicar') out.aplicar = true;
  }
  return out;
}

// --- Baserow: descubrir la tabla TAREA por nombre, nunca un ID a fuego ---
async function encontrarTablaBaserow(nombre) {
  if (!TOKEN_BASEROW) throw new Error('ERROR: falta BASEROW_TOKEN en el entorno.');
  const tablas = await (await fetch(BASE_BASEROW + '/api/database/tables/all-tables/', {
    headers: { Authorization: TOKEN_BASEROW }
  })).json();
  const tabla = tablas.find(t => t.name.toUpperCase() === nombre.toUpperCase());
  if (!tabla) throw new Error('ERROR: no existe una tabla real llamada "' + nombre + '" en Baserow.');
  return tabla.id;
}

async function leerFilaBaserow(tablaId, filaId) {
  const r = await fetch(BASE_BASEROW + '/api/database/rows/table/' + tablaId + '/' + filaId + '/?user_field_names=true', {
    headers: { Authorization: TOKEN_BASEROW }
  });
  if (r.status === 404) throw new Error('ERROR: la fila ' + filaId + ' no existe en la tabla TAREA de Baserow -- nada que vincular.');
  if (r.status >= 400) throw new Error('ERROR: Baserow respondio ' + r.status + ' leyendo la TAREA.');
  return r.json();
}

// --- Sheets: mismo patron de autenticacion que cerrar_ciclo.mjs, sin dependencias ---
function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function obtenerAccessTokenSheets() {
  const cred = JSON.parse(readFileSync(CREDENCIALES_SHEETS_PATH, 'utf8'));
  const ahora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({
    iss: cred.client_email, scope: SCOPE_SHEETS, aud: 'https://oauth2.googleapis.com/token',
    exp: ahora + 3600, iat: ahora,
  }));
  const firmante = createSign('RSA-SHA256');
  firmante.update(header + '.' + claim);
  firmante.end();
  const firma = base64url(firmante.sign(cred.private_key));
  const jwt = header + '.' + claim + '.' + firma;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('AUTH_FAILED_SHEETS: ' + JSON.stringify(data));
  return data.access_token;
}

async function leerRango(token, spreadsheetId, rango) {
  const r = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/' + encodeURIComponent(rango), {
    headers: { Authorization: 'Bearer ' + token }
  });
  const j = await r.json();
  return j.values || [];
}

async function anadirFilas(token, spreadsheetId, rango, filas) {
  const r = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/' + encodeURIComponent(rango) +
    ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS',
    {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: filas })
    }
  );
  if (r.status >= 400) throw new Error('ERROR escribiendo en ' + rango + ': ' + r.status + ' ' + await r.text());
  return r.json();
}

function siguienteIdVinculo(filasExistentes) {
  let max = 0;
  for (const fila of filasExistentes.slice(1)) {
    const m = String(fila[0] || '').match(/^VIN-(\d{4})$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return 'VIN-' + String(max + 1).padStart(4, '0');
}

function ahoraFormatoSheet() {
  const d = new Date();
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear() + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

async function main() {
  const args = leerArgs();
  if (!args.tarea || !args.vinculaA) {
    console.log('Uso: node puente_historia_leyes.mjs --tarea <ID_FILA_BASEROW> --vincula-a "<Tipo>:<ID>" [--tipo-vinculo "texto"] [--sheet <spreadsheetId>] [--aplicar]');
    process.exit(1);
  }
  const [destinoTipo, destinoId] = args.vinculaA.split(':');
  if (!destinoTipo || !destinoId) throw new Error('ERROR: --vincula-a debe tener forma "Tipo:ID", ej. "Incidencia:INC-0067".');
  const spreadsheetId = args.sheet || SHEET_POR_DEFECTO;
  const tipoVinculo = args.tipoVinculo || 'Origen_Historia';

  console.log('=== Mensajero: puente Historia -> Leyes ===');
  console.log('Leyendo TAREA real de Baserow (fila ' + args.tarea + ')...');
  const tablaTareaId = await encontrarTablaBaserow('TAREA');
  const tarea = await leerFilaBaserow(tablaTareaId, args.tarea);
  const nombreTarea = tarea.NOMBRE || tarea.Nombre || tarea.TITULO || '(sin nombre)';
  console.log('  Encontrada: "' + nombreTarea + '" (id real Baserow: ' + tarea.id + ')');

  const filasVinculo = await (async () => {
    const token = await obtenerAccessTokenSheets();
    return { token, existentes: await leerRango(token, spreadsheetId, "'18_VINCULO'!A1:Z") };
  })();
  const nuevoId = siguienteIdVinculo(filasVinculo.existentes);
  const ahora = ahoraFormatoSheet();

  const filaVinculo = [
    nuevoId,
    'Tarea_Baserow',
    'BSR-' + tarea.id,
    destinoTipo,
    destinoId,
    tipoVinculo,
    'Activa',
    ahora,
    'Mensajero (puente_historia_leyes.mjs)',
    ahora,
    'Mensajero (puente_historia_leyes.mjs)',
    'SI',
    'Referencia cruzada, no copia de datos. TAREA de origen (Baserow): "' + nombreTarea + '".',
    'Mensajero'
  ];

  const filaBusTrabajo = [
    'MSJ-' + Date.now(),
    '',
    'Mensajero',
    'puente_historia_leyes: TAREA Baserow #' + tarea.id + ' ("' + nombreTarea + '") -> ' + nuevoId + ' (' + destinoTipo + ':' + destinoId + ')'
  ];

  console.log('\nFila que se escribiria en 18_VINCULO:');
  console.log('  ' + filaVinculo.join(' | '));
  console.log('\nRastro que se escribiria en 92_BUS_TRABAJO:');
  console.log('  ' + filaBusTrabajo.join(' | '));

  if (!args.aplicar) {
    console.log('\n(DRY RUN -- nada escrito. Anade --aplicar para escribir de verdad, tras revision humana.)');
    return;
  }

  console.log('\nEscribiendo de verdad (--aplicar)...');
  await anadirFilas(filasVinculo.token, spreadsheetId, "'18_VINCULO'!A1", [filaVinculo]);
  await anadirFilas(filasVinculo.token, spreadsheetId, "'92_BUS_TRABAJO'!A1", [filaBusTrabajo]);
  console.log('Hecho. ' + nuevoId + ' creado, rastro dejado en 92_BUS_TRABAJO.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
