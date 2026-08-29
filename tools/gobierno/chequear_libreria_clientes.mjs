#!/usr/bin/env node
/*
 * Chequeo de desfase de libreria por cliente -- detecta el patron real
 * encontrado el 2026-08-25: CLIENTE.LIBRERIA_VERSION (Sheet) puede
 * mentir sin que nadie lo note (Gestor de Proyectos mostraba 152 cuando
 * el appsscript.json real del proyecto ya estaba en 173, y la libreria
 * publicada de verdad iba por 175 -- dos desfases distintos, en dos
 * sitios distintos).
 *
 * Por eso este chequeo NUNCA confia en el campo del Sheet como fuente
 * de verdad -- compara dos cosas reales entre si:
 *   1. El appsscript.json REAL del proyecto de cada cliente (via clasp/
 *      Apps Script API, projects.content).
 *   2. La version REAL mas alta publicada de LIBRERIA_ID_ (mismo
 *      endpoint, projects.versions.list).
 * El campo LIBRERIA_VERSION del Sheet se compara tambien, pero solo
 * para reportar si esta desactualizado como DATO -- no se usa nunca
 * para decidir si hay desfase real.
 *
 * Autenticacion doble, cada credencial para lo suyo:
 *   - El token OAuth de usuario que ya gestiona `clasp` (~/.clasprc.json,
 *     refrescado aqui mismo si ha caducado) -- scope script.projects,
 *     para leer appsscript.json de cada cliente y la version real de la
 *     libreria.
 *   - La cuenta de servicio de Sheets (ENGREMIAT_SHEETS_CREDENTIALS_PATH,
 *     misma que cerrar_ciclo.mjs/bus_trabajo.mjs) -- para leer 38_CLIENTE
 *     directamente, sin depender de un volcado pasado a mano. Esto es lo
 *     que hace que el chequeo pueda correr desatendido (Task Scheduler),
 *     no solo a demanda con un volcado fresco.
 *
 * Uso:
 *   node chequear_libreria_clientes.mjs
 * Opcional: --volcado <ruta.json> para usar un volcado ya guardado en
 * vez de leer el Sheet en vivo (util para pruebas sin gastar llamadas).
 * Solo lectura sobre Apps Script -- no escribe nada en ningun proyecto
 * de script. Sí escribe en el Sheet: una fila en 92_BUS_TRABAJO por
 * cada ejecucion, con el resumen del chequeo (para que una ejecucion
 * desatendida deje rastro).
 */

import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LIBRERIA_ID_ = '1fRR3hjtUIxWcZrjU1APFtG361QuDZ8GmBNQjAoKY_ZjhaYprAkvOEA7M';
const CLASPRC_PATH = path.join(os.homedir(), '.clasprc.json');
const UMBRAL_AVISO_VERSIONES = 5;

const SPREADSHEET_ID = '142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ';
const SHEETS_CREDENCIALES_PATH = process.env.ENGREMIAT_SHEETS_CREDENTIALS_PATH || 'G:\\Mi unidad\\DEVS\\engremiat-6259cee67897.json';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

const idxVolcado = process.argv.indexOf('--volcado');
const VOLCADO_PATH = idxVolcado !== -1 ? process.argv[idxVolcado + 1] : null;

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function obtenerTokenServicio_() {
  const cred = JSON.parse(readFileSync(SHEETS_CREDENCIALES_PATH, 'utf8'));
  const ahora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({ iss: cred.client_email, scope: SHEETS_SCOPE, aud: 'https://oauth2.googleapis.com/token', exp: ahora + 3600, iat: ahora }));
  const firmante = createSign('RSA-SHA256');
  firmante.update(`${header}.${claim}`);
  firmante.end();
  const jwt = `${header}.${claim}.${base64url(firmante.sign(cred.private_key))}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('AUTH_SERVICIO_FALLIDO: ' + JSON.stringify(data));
  return data.access_token;
}

async function leerVolcadoClienteEnVivo_() {
  const token = await obtenerTokenServicio_();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/38_CLIENTE!A1:Z1000`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.error) throw new Error('LECTURA_38_CLIENTE_FALLIDA: ' + JSON.stringify(data.error));
  return data;
}

async function registrarEjecucionEnBus_(resumenTexto) {
  try {
    const token = await obtenerTokenServicio_();
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/92_BUS_TRABAJO:append?valueInputOption=USER_ENTERED`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [['CHEQUEO-AUTO', '', 'chequear_libreria_clientes.mjs', '', 'verificada_ok', 'cron', new Date().toISOString(), '', '', '', 'sistema', new Date().toISOString(), resumenTexto]] }),
    });
  } catch (e) {
    console.error('AVISO: no se pudo registrar la ejecucion en 92_BUS_TRABAJO -- ' + e.message);
  }
}

async function obtenerAccessToken_() {
  const clasprc = JSON.parse(readFileSync(CLASPRC_PATH, 'utf8'));
  const t = clasprc.tokens.default;

  if (t.expiry_date > Date.now() + 60_000) return t.access_token;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: t.refresh_token,
      client_id: t.client_id,
      client_secret: t.client_secret,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('REFRESCO_TOKEN_FALLIDO: ' + JSON.stringify(data));
  return data.access_token;
}

async function obtenerVersionLibreriaMasReciente_(token) {
  const res = await fetch(`https://script.googleapis.com/v1/projects/${LIBRERIA_ID_}/versions?pageSize=200`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.versions || data.versions.length === 0) {
    throw new Error('OBTENER_VERSION_LIBRERIA_ERROR: ' + JSON.stringify(data));
  }
  return Math.max(...data.versions.map((v) => v.versionNumber));
}

async function obtenerVersionBindeadaCliente_(token, scriptId) {
  const res = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (res.status !== 200 || !data.files) {
    return { error: `HTTP_${res.status}: ${JSON.stringify(data).slice(0, 200)}` };
  }
  const manifiesto = data.files.find((f) => f.name === 'appsscript');
  if (!manifiesto) return { error: 'SIN_APPSSCRIPT_JSON' };
  try {
    const json = JSON.parse(manifiesto.source);
    const lib = (json.dependencies?.libraries || []).find((l) => l.libraryId === LIBRERIA_ID_);
    return lib ? { version: Number(lib.version) } : { error: 'NO_USA_LIBRERIA_CORE' };
  } catch (e) {
    return { error: 'APPSSCRIPT_JSON_INVALIDO' };
  }
}

// Indices 0-based del volcado de 38_CLIENTE (cabecera en fila 1).
const COL = { ID: 0, NOMBRE: 2, SCRIPT_ID: 12, ACTIVO: 18, LIBRERIA_VERSION: 20 };

async function main() {
  const volcado = VOLCADO_PATH ? JSON.parse(readFileSync(VOLCADO_PATH, 'utf8')) : await leerVolcadoClienteEnVivo_();
  const filas = (volcado.values || volcado).slice(1); // salta cabecera

  const clientes = filas
    .filter((f) => f[COL.SCRIPT_ID] && String(f[COL.ACTIVO] || '').toUpperCase().startsWith('S'))
    .map((f) => ({
      id: f[COL.ID],
      nombre: f[COL.NOMBRE],
      scriptId: f[COL.SCRIPT_ID],
      libreriaVersionSheet: f[COL.LIBRERIA_VERSION] || null,
    }));

  if (clientes.length === 0) {
    console.log('Ningun cliente activo con SCRIPT_ID en el volcado.');
    return;
  }

  const token = await obtenerAccessToken_();
  const versionReal = await obtenerVersionLibreriaMasReciente_(token);
  console.log(`Version real mas reciente de la libreria: ${versionReal}\n`);

  let hallazgos = 0;
  for (const c of clientes) {
    const bindeada = await obtenerVersionBindeadaCliente_(token, c.scriptId);

    if (bindeada.error) {
      console.log(`AVISO ${c.id} (${c.nombre}): no se pudo leer su appsscript.json -- ${bindeada.error}`);
      continue;
    }

    const gapReal = versionReal - bindeada.version;
    const sheetDice = c.libreriaVersionSheet;
    const sheetDesactualizado = sheetDice != null && Number(sheetDice) !== bindeada.version;

    if (gapReal > 0 || sheetDesactualizado) {
      hallazgos++;
      console.log(`${c.id} (${c.nombre}):`);
      if (gapReal > 0) {
        const marca = gapReal >= UMBRAL_AVISO_VERSIONES ? 'DESFASE REAL' : 'desfase menor';
        console.log(`  ${marca}: bindeado a v${bindeada.version}, la real es v${versionReal} (${gapReal} version(es) por detras)`);
      } else {
        console.log(`  bindeado a v${bindeada.version} -- al dia con la real`);
      }
      if (sheetDesactualizado) {
        console.log(`  DATO DESACTUALIZADO en el Sheet: dice v${sheetDice}, el real es v${bindeada.version}`);
      }
    }
  }

  const resumen = `${hallazgos} de ${clientes.length} cliente(s) con algo que revisar (version real libreria: v${versionReal})`;
  console.log(`\n${resumen}.`);
  await registrarEjecucionEnBus_(resumen);
  process.exitCode = hallazgos > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error('ERROR', err.message);
  process.exitCode = 2;
});
