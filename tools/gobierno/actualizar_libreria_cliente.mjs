#!/usr/bin/env node
/*
 * Sistema de regeneración de envoltorios CON FUENTE VIVA (2026-08-25) --
 * diseño corregido tras encontrar que el checkout local de git puede
 * divergir de la librería realmente publicada (PanelClientesService.js
 * tenía una función distinta en git vs. en vivo, el mismo día que se
 * diseñó esto). Por eso este script NUNCA lee código de disco:
 *
 *   - El MAPA de paquetes (tools/packager/package-map.json) sí se lee en
 *     local -- es metadato estable (que fichero pertenece a que modulo),
 *     no codigo de negocio, riesgo bajo de que diverja.
 *   - El CONTENIDO de cada fichero se lee en vivo de LIBRERIA_ID_ via la
 *     Apps Script API (projects.content) -- la misma llamada que hace
 *     subirContenidoScript_ (AprovisionamientoService.js) al ejecutarse
 *     de verdad dentro de Apps Script.
 *
 * Reusa SIN TOCAR la logica ya probada de
 * tools/packager/generate-shell-wrappers.mjs (resolveWrapperPlan,
 * renderWrapperStubs -- 25 tests propios).
 *
 * MODO DIAGNOSTICO POR DEFECTO: genera el Codigo.js nuevo y lo compara
 * contra el actual del cliente, SIN escribir nada. Solo con --aplicar
 * explicito hace el push real + bump de appsscript.json + actualiza el
 * Sheet -- y solo despues de mostrar el diff, nunca a ciegas.
 *
 * Uso:
 *   node actualizar_libreria_cliente.mjs <scriptId>            (diagnostico)
 *   node actualizar_libreria_cliente.mjs <scriptId> --aplicar  (aplica de verdad)
 */
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readPackageMap, validatePackageMap } from '../packager/build-packages.mjs';
import { resolveWrapperPlan, renderWrapperStubs } from '../packager/generate-shell-wrappers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIBRERIA_ID_ = '1fRR3hjtUIxWcZrjU1APFtG361QuDZ8GmBNQjAoKY_ZjhaYprAkvOEA7M';
const CLASPRC_PATH = path.join(os.homedir(), '.clasprc.json');
const SPREADSHEET_ID = '142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ';
const SHEETS_CREDENCIALES_PATH = process.env.ENGREMIAT_SHEETS_CREDENTIALS_PATH || 'G:\\Mi unidad\\DEVS\\engremiat-6259cee67897.json';

const [, , SCRIPT_ID, ...flags] = process.argv;
const APLICAR = flags.includes('--aplicar');
if (!SCRIPT_ID) {
  console.error('Uso: node actualizar_libreria_cliente.mjs <scriptId> [--aplicar]');
  process.exit(2);
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function obtenerTokenClasp_() {
  const clasprc = JSON.parse(readFileSync(CLASPRC_PATH, 'utf8'));
  const t = clasprc.tokens.default;
  if (t.expiry_date > Date.now() + 60_000) return t.access_token;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: t.refresh_token, client_id: t.client_id, client_secret: t.client_secret }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('REFRESCO_TOKEN_FALLIDO: ' + JSON.stringify(data));
  return data.access_token;
}

async function obtenerTokenServicio_() {
  const cred = JSON.parse(readFileSync(SHEETS_CREDENCIALES_PATH, 'utf8'));
  const ahora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({ iss: cred.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', exp: ahora + 3600, iat: ahora }));
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

async function leerContenidoProyecto_(token, scriptId) {
  const res = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (res.status !== 200 || !data.files) throw new Error(`LECTURA_PROYECTO_FALLIDA scriptId=${scriptId}: HTTP_${res.status} ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}

async function obtenerVersionLibreriaMasReciente_(token) {
  const res = await fetch(`https://script.googleapis.com/v1/projects/${LIBRERIA_ID_}/versions?pageSize=200`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!data.versions || data.versions.length === 0) throw new Error('OBTENER_VERSION_LIBRERIA_ERROR: ' + JSON.stringify(data));
  return Math.max(...data.versions.map((v) => v.versionNumber));
}

async function main() {
  const tokenClasp = await obtenerTokenClasp_();

  console.log('Leyendo Codigo.js actual del cliente...');
  const contenidoCliente = await leerContenidoProyecto_(tokenClasp, SCRIPT_ID);
  const archivoCodigoActual = contenidoCliente.files.find((f) => f.name === 'Codigo');
  if (!archivoCodigoActual) throw new Error('NO_HAY_CODIGO_JS: el proyecto del cliente no tiene Codigo.js -- ¿es un cliente generado por este empaquetador?');

  const coincidencia = archivoCodigoActual.source.match(/var\s+MODULOS_INSTALADOS_CLIENTE\s*=\s*(\[[^\]]*\])/);
  if (!coincidencia) throw new Error('NO_SE_ENCONTRO_MODULOS_INSTALADOS_CLIENTE en el Codigo.js del cliente.');
  const modulos = JSON.parse(coincidencia[1]);
  console.log('Modulos instalados:', modulos.join(', '));

  console.log('Leyendo contenido REAL y en vivo de la libreria (no git local)...');
  const contenidoLibreria = await leerContenidoProyecto_(tokenClasp, LIBRERIA_ID_);
  const fuentePorNombre = {};
  contenidoLibreria.files.forEach((f) => { fuentePorNombre[f.name] = f.source; });

  const map = readPackageMap();
  const mapErrors = validatePackageMap(map);
  if (mapErrors.length > 0) throw new Error('MAPA_DE_PAQUETES_INVALIDO: ' + mapErrors[0]);

  const aFiles = map.entries.filter((e) => e.package === 'A').map((entry) => {
    const nombreArchivo = entry.path.replace(/^src\//, '').replace(/\.(js|html|json)$/, '');
    return { ...entry, content: fuentePorNombre[nombreArchivo] || '' };
  });
  const sinContenido = aFiles.filter((f) => !f.content).map((f) => f.path);
  if (sinContenido.length > 0) throw new Error(`FICHEROS_SIN_CONTENIDO_EN_LIBRERIA_VIVA: ${sinContenido.slice(0, 5).join(', ')}`);

  const plan = resolveWrapperPlan({ map, aFiles, modules: modulos });
  const codigoNuevo = renderWrapperStubs(plan, 'Core');
  const versionReal = await obtenerVersionLibreriaMasReciente_(tokenClasp);

  const codigoActual = archivoCodigoActual.source;
  const identico = codigoActual.replace(/\r\n/g, '\n').trim() === codigoNuevo.replace(/\r\n/g, '\n').trim();

  console.log(`\nEnvoltorios generados: ${plan.wrappers.length}`);
  plan.gaps.forEach((gap) => console.log(`  HUECO ${gap.functionName} status=${gap.status}`));
  console.log(`\nCodigo.js actual vs. generado: ${identico ? 'IDENTICO (nada que aplicar)' : 'DIFERENTE'}`);

  if (!identico) {
    const lineasActual = codigoActual.split('\n').length;
    const lineasNuevo = codigoNuevo.split('\n').length;
    console.log(`  Lineas actuales: ${lineasActual}, lineas nuevas: ${lineasNuevo} (diferencia: ${lineasNuevo - lineasActual})`);
    if (flags.includes('--volcar-diff')) {
      const { writeFileSync } = await import('node:fs');
      writeFileSync(path.join(HERE, 'diff-actual.js'), codigoActual);
      writeFileSync(path.join(HERE, 'diff-nuevo.js'), codigoNuevo);
      console.log(`  Volcado a ${path.join(HERE, 'diff-actual.js')} y diff-nuevo.js para revisar con diff.`);
    }
  }

  if (!APLICAR) {
    console.log('\nModo diagnostico -- nada aplicado. Repite con --aplicar tras revisar lo de arriba.');
    return;
  }

  if (identico) {
    console.log('\nNada que aplicar -- el cliente ya esta al dia.');
    return;
  }

  console.log('\n--aplicar: subiendo Codigo.js nuevo + appsscript.json (version ' + versionReal + ')...');
  const manifiesto = {
    timeZone: 'Europe/Madrid',
    dependencies: {
      libraries: [{ userSymbol: 'Core', libraryId: LIBRERIA_ID_, version: versionReal }],
      enabledAdvancedServices: [{ userSymbol: 'Sheets', serviceId: 'sheets', version: 'v4' }],
    },
    exceptionLogging: 'STACKDRIVER',
    runtimeVersion: 'V8',
    webapp: { access: 'ANYONE_ANONYMOUS', executeAs: 'USER_DEPLOYING' },
  };
  const respSubir = await fetch(`https://script.googleapis.com/v1/projects/${SCRIPT_ID}/content`, {
    method: 'PUT', headers: { Authorization: `Bearer ${tokenClasp}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: [{ name: 'appsscript', type: 'JSON', source: JSON.stringify(manifiesto) }, { name: 'Codigo', type: 'SERVER_JS', source: codigoNuevo }] }),
  });
  if (respSubir.status !== 200) throw new Error('SUBIDA_FALLIDA: ' + JSON.stringify(await respSubir.json()).slice(0, 300));
  console.log('Subido correctamente.');

  const tokenServicio = await obtenerTokenServicio_();
  const volcado = await (await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/38_CLIENTE!A1:U1000`, { headers: { Authorization: `Bearer ${tokenServicio}` } })).json();
  const filas = volcado.values || [];
  const filaIdx = filas.findIndex((f) => f[12] === SCRIPT_ID);
  if (filaIdx !== -1) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/38_CLIENTE!U${filaIdx + 1}?valueInputOption=USER_ENTERED`, {
      method: 'PUT', headers: { Authorization: `Bearer ${tokenServicio}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [[String(versionReal)]] }),
    });
    console.log(`Sheet actualizado: LIBRERIA_VERSION -> ${versionReal}`);
  } else {
    console.log('AVISO: no se encontro el cliente en 38_CLIENTE por SCRIPT_ID -- Sheet no actualizado.');
  }
}

main().catch((err) => { console.error('ERROR', err.message); process.exitCode = 2; });
