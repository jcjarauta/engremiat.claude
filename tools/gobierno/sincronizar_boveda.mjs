#!/usr/bin/env node
/*
 * El "ultimo metro" del puente Sheet -> Boveda (ver PROPUESTA_BASTIDOR_
 * GESTOR_PROYECTOS_ENGREMIAT.md §6.4-6.5). generarNotaObsidian() (real,
 * ya construido en src/ReportService.js, expuesto via el webhook real
 * de WebhookTelegramService.js, accion 'generar_nota_obsidian') YA sabe
 * convertir un DOCUMENTO/DECISION real en una nota Markdown con
 * front-matter + wikilinks resueltos por 18_VINCULO -- pero solo
 * DEVUELVE el texto, nunca lo escribe. Este script hace exactamente eso,
 * nada mas: no reimplementa la logica de generar la nota (eso ya existe
 * y ya esta probado), solo cierra el ultimo tramo.
 *
 * Fuente de "que cambio": 91_HISTORIAL real (ya filtra ES_PRUEBA, ya
 * tiene TIMESTAMP/ENTIDAD/REGISTRO_ID) -- nunca comparar el Sheet
 * entero, el changelog real ya existe.
 *
 * Dry-run por defecto. --aplicar escribe de verdad los ficheros .md.
 *
 * Uso:
 *   node sincronizar_boveda.mjs [--aplicar] [--sheet <spreadsheetId>]
 *
 * Variables de entorno:
 *   ENGREMIAT_SHEETS_CREDENTIALS_PATH -- cuenta de servicio de Sheets
 *   ENGREMIAT_WEBHOOK_URL -- URL real del webhook desplegado
 *     (por defecto, el deploymentId ya conocido en
 *     reference_ejecutar_appsscript_sin_clasp_run)
 */
import { createSign } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDENCIALES_SHEETS_PATH = process.env.ENGREMIAT_SHEETS_CREDENTIALS_PATH || 'G:\\Mi unidad\\DEVS\\engremiat-6259cee67897.json';
const SHEET_POR_DEFECTO = '142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ'; // Gestor de Proyectos - LaTroballa Software
const SCOPE_SHEETS = 'https://www.googleapis.com/auth/spreadsheets';
const WEBHOOK_URL = process.env.ENGREMIAT_WEBHOOK_URL
  || 'https://script.google.com/macros/s/AKfycbz1N-ZJRjjjZ1BRZJaXxPLaBHrVtPD1tRDl1wi8tHA3dW5AYMITX5z4AFEsPEluPjQ2/exec';

// Solo estos dos tipos hoy -- son los unicos que generarNotaObsidian() sabe
// generar de verdad (real, probado contra DOC-0001/DEC-0001). Ampliar esta
// lista exige antes ampliar el switch real en src/ReportService.js.
const TIPOS_SOPORTADOS = ['DOCUMENTO', 'DECISION'];

const RUTA_ARCHIVO_VIVO = 'G:\\Mi unidad\\engremiat.claude\\Obsidian-Engremiat\\Universos\\Engremiat\\00_Nucleo\\Archivo_Vivo';
const RUTA_ESTADO = join(__dirname, '.ultima_sincronizacion_boveda.json');

function leerArgs() {
  const args = process.argv.slice(2);
  const out = { aplicar: false, sheet: SHEET_POR_DEFECTO };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--aplicar') out.aplicar = true;
    else if (args[i] === '--sheet') out.sheet = args[++i];
  }
  return out;
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function obtenerAccessTokenSheets() {
  const cred = JSON.parse(readFileSync(CREDENCIALES_SHEETS_PATH, 'utf-8'));
  const ahora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({ iss: cred.client_email, scope: SCOPE_SHEETS, aud: 'https://oauth2.googleapis.com/token', exp: ahora + 3600, iat: ahora }));
  const firmante = createSign('RSA-SHA256');
  firmante.update(header + '.' + claim);
  firmante.end();
  const jwt = header + '.' + claim + '.' + base64url(firmante.sign(cred.private_key));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('AUTH_FAILED_SHEETS: ' + JSON.stringify(data));
  return data.access_token;
}

async function leerHistorialReal(token, spreadsheetId) {
  const r = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/' + encodeURIComponent("'91_HISTORIAL'!A1:O"), {
    headers: { Authorization: 'Bearer ' + token }
  });
  const j = await r.json();
  const filas = j.values || [];
  const cabeceras = filas[0] || [];
  return filas.slice(1).map((fila) => {
    const obj = {};
    cabeceras.forEach((c, i) => { obj[c] = fila[i]; });
    return obj;
  });
}

function leerEstado() {
  if (!existsSync(RUTA_ESTADO)) return { ultimoTimestamp: null };
  return JSON.parse(readFileSync(RUTA_ESTADO, 'utf-8'));
}

function guardarEstado(estado) {
  writeFileSync(RUTA_ESTADO, JSON.stringify(estado, null, 2), 'utf-8');
}

async function pedirNotaReal(entidadTipo, entidadId) {
  const r = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'generar_nota_obsidian', entidadTipo, entidadId }),
    redirect: 'follow'
  });
  const texto = await r.text();
  if (!texto) throw new Error('WEBHOOK_VACIO: el despliegue real no reconoce todavia la accion generar_nota_obsidian (falta clasp deploy -i sobre el deploymentId real -- ver README de este script).');
  let j;
  try { j = JSON.parse(texto); } catch (e) { throw new Error('WEBHOOK_RESPUESTA_NO_JSON: ' + texto.slice(0, 200)); }
  if (!j.ok) throw new Error('GENERAR_NOTA_OBSIDIAN_ERROR: ' + j.error);
  return j.nota;
}

function rutaNota(entidadTipo, entidadId) {
  return join(RUTA_ARCHIVO_VIVO, entidadTipo, entidadId + '.md');
}

async function main() {
  const args = leerArgs();
  const estado = leerEstado();

  console.log('=== Sincronización Bóveda (último metro del puente Sheet→Bóveda) ===');
  console.log(args.aplicar ? 'Modo: --aplicar (escribe de verdad)' : 'Modo: dry-run (nada se escribe)');
  console.log('Desde: ' + (estado.ultimoTimestamp || '(primera ejecución, todo el historial real)'));

  const token = await obtenerAccessTokenSheets();
  const historial = await leerHistorialReal(token, args.sheet);

  const candidatas = historial.filter((f) =>
    TIPOS_SOPORTADOS.includes(f.ENTIDAD) &&
    f.ES_PRUEBA !== 'SÍ' &&
    f.RESULTADO === 'OK' &&
    (!estado.ultimoTimestamp || new Date(f.TIMESTAMP) > new Date(estado.ultimoTimestamp))
  );

  // Un mismo registro puede tener varias filas de historial (varias
  // ediciones) -- solo la mas reciente por REGISTRO_ID importa para
  // sincronizar, nunca reescribir n veces el mismo fichero en esta pasada.
  const masRecientePorRegistro = new Map();
  for (const f of candidatas) {
    const clave = f.ENTIDAD + ':' + f.REGISTRO_ID;
    const previa = masRecientePorRegistro.get(clave);
    if (!previa || new Date(f.TIMESTAMP) > new Date(previa.TIMESTAMP)) masRecientePorRegistro.set(clave, f);
  }

  console.log(candidatas.length + ' fila(s) real(es) en 91_HISTORIAL, ' + masRecientePorRegistro.size + ' registro(s) único(s) a sincronizar.\n');

  let maxTimestamp = estado.ultimoTimestamp;
  let escritos = 0, fallos = 0;

  for (const f of masRecientePorRegistro.values()) {
    const ruta = rutaNota(f.ENTIDAD, f.REGISTRO_ID);
    try {
      const nota = await pedirNotaReal(f.ENTIDAD, f.REGISTRO_ID);
      console.log((args.aplicar ? 'ESCRIBIR ' : 'DRY-RUN  ') + ruta);
      if (args.aplicar) {
        mkdirSync(dirname(ruta), { recursive: true });
        writeFileSync(ruta, nota, 'utf-8');
      }
      escritos++;
    } catch (e) {
      console.log('FALLO    ' + f.ENTIDAD + ' ' + f.REGISTRO_ID + ' -- ' + e.message);
      fallos++;
    }
    if (!maxTimestamp || new Date(f.TIMESTAMP) > new Date(maxTimestamp)) maxTimestamp = f.TIMESTAMP;
  }

  console.log('\n=== Resultado ===');
  console.log(escritos + ' nota(s) ' + (args.aplicar ? 'escritas' : 'que se escribirían') + ', ' + fallos + ' fallo(s).');

  if (args.aplicar && maxTimestamp) {
    guardarEstado({ ultimoTimestamp: maxTimestamp });
    console.log('Checkpoint actualizado a ' + maxTimestamp + '.');
  } else if (!args.aplicar) {
    console.log('(DRY-RUN -- el checkpoint no se mueve. Añade --aplicar para escribir de verdad y avanzar el checkpoint.)');
  }
}

main().catch((e) => { console.error('ERROR', e.message); process.exitCode = 1; });
