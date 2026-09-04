#!/usr/bin/env node
/*
 * Cruza la estructura real del Sheet Y de Baserow (estructura_sheet.json,
 * estructura_baserow.json -- ambos solo lectura) contra los vinculoReal ya
 * declarados en los fixtures del Bocetador -- para responder de verdad
 * "que pestana/tabla de negocio no tiene todavia ningun espejo
 * (Espacio/Personaje/Recurso/Modulo/Herramienta) ni en la boveda ni en el
 * Bocetador".
 *
 * Corregido 2026-09-03: se penso que Baserow estaba bloqueado para esto
 * (listar tablas exigia sesion) -- error propio, el token de base de
 * datos ya usado en el proyecto SI puede listarlas
 * (/api/database/tables/all-tables/, ya en uso real en
 * puente_historia_leyes.mjs). Hallazgo real al añadirlo: Baserow ya tiene
 * una tabla PERSONAJE (283) y una PLANTILLA_MISION (284) que no se habian
 * cruzado al construir personaje.schema.json/mision.schema.json -- anotado
 * como pendiente real en el documento, no corregido en este mismo commit.
 *
 * No escribe nada -- es un informe, mismo espiritu que
 * chequear_consistencia.mjs y salud_ecosistema.mjs.
 *
 * Uso: node cargar_estructura_sheet.mjs && node cargar_estructura_baserow.mjs && node encontrar_huecos.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function leerJson(ruta) {
  return JSON.parse(readFileSync(ruta, 'utf-8'));
}

function recogerVinculosReales() {
  const vinculos = [];

  for (const nombre of readdirSync(join(__dirname, 'fixtures'))) {
    if (!nombre.endsWith('.json')) continue;
    const f = leerJson(join(__dirname, 'fixtures', nombre));
    for (const v of f.vinculoReal || []) vinculos.push({ ...v, fuente: nombre });
  }

  // §8.59: cargar_desde_vault.mjs ya extrae "## Vínculo real" de la bóveda completa
  // (misma lógica real que extraer_anatomia_entidad.mjs) -- las fixtures de arriba
  // siguen siendo un puñado de ejemplos ilustrativos, esta es la cobertura real.
  const universoPath = join(__dirname, 'universo_real.json');
  try {
    const u = leerJson(universoPath);
    for (const grupo of ['espacios', 'recursos', 'modulos', 'personajes', 'oficios', 'reglas']) {
      for (const n of u[grupo] || []) {
        for (const v of n.vinculoReal || []) vinculos.push({ ...v, fuente: n.nombre + ' (bóveda)' });
      }
    }
  } catch { /* universo_real.json es opcional para este informe */ }

  return vinculos;
}

function informarSheet(vinculos) {
  const estructura = leerJson(join(__dirname, 'estructura_sheet.json'));
  const tabsNegocio = estructura.tabs.filter((t) => t.tipo === 'negocio');
  const tabsConVinculo = new Set(
    vinculos.filter((v) => v.sistema === 'Sheet').map((v) => v.recordId.split(' ')[0].replace('(vacío)', '').trim())
  );
  const huecos = tabsNegocio.filter((t) => !tabsConVinculo.has(t.nombre));
  const cubiertas = tabsNegocio.filter((t) => tabsConVinculo.has(t.nombre));

  console.log('=== SHEET -- huecos reales entre pestañas y espejos ===');
  console.log(`Generado desde: ${estructura.generadoEn}\n`);
  console.log(`${cubiertas.length}/${tabsNegocio.length} pestañas de negocio con espejo real declarado:`);
  for (const t of cubiertas) console.log(`  OK    ${t.nombre}`);
  console.log(`\n${huecos.length}/${tabsNegocio.length} pestañas de negocio SIN espejo real todavía:`);
  for (const t of huecos) console.log(`  HUECO ${t.nombre}  (${t.cabeceras.length} columna(s): ${t.cabeceras.slice(0, 4).join(', ')}${t.cabeceras.length > 4 ? '...' : ''})`);
}

function informarBaserow(vinculos) {
  let estructura;
  try { estructura = leerJson(join(__dirname, 'estructura_baserow.json')); }
  catch { console.log('\n=== BASEROW -- sin estructura_baserow.json todavía, ejecuta cargar_estructura_baserow.mjs primero ==='); return; }

  const tablasConVinculo = new Set(
    vinculos.filter((v) => v.sistema === 'Baserow').map((v) => v.recordId.replace(/^tabla\s*/i, '').trim())
  );
  const huecos = estructura.tablas.filter((t) => !tablasConVinculo.has(t.nombre) && !tablasConVinculo.has(String(t.id)));
  const cubiertas = estructura.tablas.filter((t) => tablasConVinculo.has(t.nombre) || tablasConVinculo.has(String(t.id)));

  console.log('\n=== BASEROW -- huecos reales entre tablas y espejos ===');
  console.log(`Generado desde: ${estructura.generadoEn} (database_id ${[...new Set(estructura.tablas.map(t => t.databaseId))].join(', ')})\n`);
  console.log(`${cubiertas.length}/${estructura.tablas.length} tablas con espejo real declarado:`);
  for (const t of cubiertas) console.log(`  OK    ${t.nombre}`);
  console.log(`\n${huecos.length}/${estructura.tablas.length} tablas SIN espejo real todavía:`);
  for (const t of huecos) console.log(`  HUECO ${t.nombre} (id ${t.id})  (${t.campos.length} campo(s): ${t.campos.slice(0, 4).map(c => c.nombre).join(', ')}${t.campos.length > 4 ? '...' : ''})`);
}

function main() {
  const vinculos = recogerVinculosReales();
  informarSheet(vinculos);
  informarBaserow(vinculos);
  console.log('\n(Este informe no juzga si el hueco importa -- muchas pestañas/tablas son relación/plumbing interno, no entidades de dominio. Es un mapa, no un veredicto.)');
}

main();
