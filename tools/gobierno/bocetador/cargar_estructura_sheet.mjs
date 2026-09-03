#!/usr/bin/env node
/*
 * Solo lectura, SIN credenciales en el navegador -- este script corre en
 * la maquina del operador, mismo patron JWT ya usado en
 * sincronizar_boveda.mjs. Lee la ESTRUCTURA real del Sheet (nombres de
 * pestana + fila de cabeceras), nunca las filas de datos -- el Bocetador
 * solo necesita el esqueleto para poder mostrar "esto existe en el Sheet
 * y no tiene todavia un espejo real en la boveda/Bocetador", no el
 * contenido. Respuesta real a: "guardar las cabeceras para tener vision
 * general y encontrar huecos en el Sheet" (usuario, 2026-09-02).
 *
 * Uso: node cargar_estructura_sheet.mjs [--salida <ruta.json>]
 */
import { createSign } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CREDENCIALES_SHEETS_PATH = process.env.ENGREMIAT_SHEETS_CREDENTIALS_PATH || 'G:\\Mi unidad\\DEVS\\engremiat-6259cee67897.json';
const SHEET_POR_DEFECTO = '142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ';
const SCOPE_SHEETS = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const SALIDA_POR_DEFECTO = join(import.meta.dirname, 'estructura_sheet.json');

// Pestanas de utilidad tecnica (staging, historial, log de gobierno...) --
// se listan igual, pero marcadas 'utilidad', no 'negocio', para no
// confundirlas con huecos reales de dominio en el analisis.
function esUtilidad(nombre) {
  return nombre.startsWith('STG_') || /^9\d_/.test(nombre) || nombre === 'SOLICITUDES_MONTAJE';
}

function leerArgs() {
  const args = process.argv.slice(2);
  let salida = SALIDA_POR_DEFECTO;
  for (let i = 0; i < args.length; i++) if (args[i] === '--salida') salida = args[++i];
  return { salida };
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

async function main() {
  const { salida } = leerArgs();
  const token = await obtenerAccessTokenSheets();

  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_POR_DEFECTO}?fields=sheets.properties.title`, {
    headers: { Authorization: 'Bearer ' + token },
  });
  const meta = await metaRes.json();
  const pestanas = meta.sheets.map((s) => s.properties.title);

  console.log('=== Estructura real del Sheet (solo cabeceras, nunca filas) ===');
  console.log(`${pestanas.length} pestañas reales encontradas. Leyendo cabeceras...`);

  // Un solo batchGet para las 70 pestañas -- una llamada, no 70.
  const ranges = pestanas.map((p) => `'${p}'!A1:AB1`).map((r) => 'ranges=' + encodeURIComponent(r)).join('&');
  const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_POR_DEFECTO}/values:batchGet?${ranges}`, {
    headers: { Authorization: 'Bearer ' + token },
  });
  const batch = await batchRes.json();

  const tabs = pestanas.map((nombre, i) => ({
    nombre,
    tipo: esUtilidad(nombre) ? 'utilidad' : 'negocio',
    cabeceras: (batch.valueRanges[i]?.values?.[0]) || [],
  }));

  const paquete = { generadoEn: new Date().toISOString(), sheetId: SHEET_POR_DEFECTO, tabs };
  writeFileSync(salida, JSON.stringify(paquete, null, 2), 'utf-8');

  const vacias = tabs.filter((t) => t.tipo === 'negocio' && t.cabeceras.length === 0);
  console.log(`${tabs.filter(t => t.tipo === 'negocio').length} pestañas de negocio, ${tabs.filter(t => t.tipo === 'utilidad').length} de utilidad.`);
  if (vacias.length) console.log(`Aviso: ${vacias.length} pestaña(s) de negocio sin ni siquiera cabeceras: ${vacias.map(t => t.nombre).join(', ')}`);
  console.log('Escrito en: ' + salida);
}

main().catch((e) => { console.error('ERROR', e.message); process.exitCode = 1; });
