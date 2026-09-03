#!/usr/bin/env node
/*
 * Solo lectura -- equivalente real a cargar_estructura_sheet.mjs, para
 * Baserow. Corrige un hallazgo propio equivocado: se penso que listar
 * tablas exigia sesion de usuario -- no, el token de base de datos ya
 * usado en el resto del proyecto SI puede listarlas via
 * /api/database/tables/all-tables/ (ya usado en real por
 * puente_historia_leyes.mjs, no encontrado a tiempo la primera vez).
 *
 * Lee solo nombres de tabla + nombres de campo (nunca filas de datos).
 *
 * Uso: node cargar_estructura_baserow.mjs [--salida <ruta.json>]
 * Variables de entorno: BASEROW_URL, BASEROW_TOKEN (mismas que el resto
 * del proyecto -- nunca hardcodeadas aqui).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASEROW_URL || 'http://100.107.171.88';
const TOKEN = process.env.BASEROW_TOKEN;
const SALIDA_POR_DEFECTO = join(import.meta.dirname, 'estructura_baserow.json');

function leerArgs() {
  const args = process.argv.slice(2);
  let salida = SALIDA_POR_DEFECTO;
  for (let i = 0; i < args.length; i++) if (args[i] === '--salida') salida = args[++i];
  return { salida };
}

async function main() {
  if (!TOKEN) { console.error('ERROR: falta BASEROW_TOKEN en el entorno.'); process.exitCode = 1; return; }
  const { salida } = leerArgs();

  const tablas = await (await fetch(BASE + '/api/database/tables/all-tables/', { headers: { Authorization: TOKEN } })).json();
  console.log(`${tablas.length} tablas reales encontradas. Leyendo campos...`);

  const resultado = [];
  for (const t of tablas) {
    const campos = await (await fetch(BASE + '/api/database/fields/table/' + t.id + '/', { headers: { Authorization: TOKEN } })).json();
    resultado.push({
      id: t.id,
      nombre: t.name,
      databaseId: t.database_id,
      campos: (campos.error ? [] : campos).map((c) => ({ nombre: c.name, tipo: c.type })),
    });
  }

  const paquete = { generadoEn: new Date().toISOString(), baseUrl: BASE, tablas: resultado };
  writeFileSync(salida, JSON.stringify(paquete, null, 2), 'utf-8');

  console.log('=== Estructura real de Baserow ===');
  console.log(`${resultado.length} tablas reales, database_id(s): ${[...new Set(resultado.map(t => t.databaseId))].join(', ')}.`);
  console.log('Escrito en: ' + salida);
}

main().catch((e) => { console.error('ERROR', e.message); process.exitCode = 1; });
