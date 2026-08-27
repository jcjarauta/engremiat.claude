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
 * Autenticacion: reutiliza el token OAuth de usuario que ya gestiona
 * `clasp` (~/.clasprc.json, refrescado aqui mismo si ha caducado) --
 * mismo scope script.projects que se necesita para leer/listar
 * proyectos de Apps Script. No requiere ninguna credencial nueva.
 *
 * Uso:
 *   node chequear_libreria_clientes.mjs <ruta-volcado-crudo-38_CLIENTE.json>
 * El volcado es la salida cruda de sheets_get_values sobre
 * 38_CLIENTE!A1:Z<ultima fila> (con cabecera en la fila 1), guardada tal
 * cual. Solo lectura -- no escribe nada, ni en el Sheet ni en ningun
 * proyecto de script.
 */

import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LIBRERIA_ID_ = '1fRR3hjtUIxWcZrjU1APFtG361QuDZ8GmBNQjAoKY_ZjhaYprAkvOEA7M';
const CLASPRC_PATH = path.join(os.homedir(), '.clasprc.json');
const UMBRAL_AVISO_VERSIONES = 5;

const VOLCADO_PATH = process.argv[2];
if (!VOLCADO_PATH) {
  console.error('Uso: node chequear_libreria_clientes.mjs <ruta-volcado-crudo-38_CLIENTE.json>');
  console.error('(volcado = 38_CLIENTE!A1:Z<ultima fila>, formato crudo de sheets_get_values, con cabecera)');
  process.exit(2);
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
  const volcado = JSON.parse(readFileSync(VOLCADO_PATH, 'utf8'));
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

  console.log(`\n${hallazgos} de ${clientes.length} cliente(s) con algo que revisar.`);
  process.exitCode = hallazgos > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error('ERROR', err.message);
  process.exitCode = 2;
});
