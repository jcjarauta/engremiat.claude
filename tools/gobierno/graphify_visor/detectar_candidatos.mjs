#!/usr/bin/env node
/*
 * Detector real de candidatos (§8.93, TAR-0007, Proceso 1a/1b del Proyecto "Grafos del
 * sistema"). Automatiza la SEÑAL, nunca el juicio final -- el Proceso 1c (¿amerita un
 * grafo propio? ¿de qué tipo?) sigue siendo Puerta Humana, este script solo la alimenta
 * con datos reales.
 *
 * 1a: lee el historial real de cada ficha (fichas_grafos.json, escrito por cada
 *     extractor via ficha_grafo.mjs) y calcula el delta real de sus contadores entre la
 *     primera y la última captura -- sin inventar tendencia, solo lo que el propio
 *     historial ya registró.
 * 1b: para cada candidato senalado, reutiliza el rolReal/agenciaReal YA calculado por
 *     extraer_anatomia_entidad.mjs (si esa entidad tiene anatomia real) -- nunca
 *     recalculado desde cero, mismo dato real, una sola fuente de verdad.
 *
 * Solo lectura -- no escribe nada, no decide nada. Uso: node detectar_candidatos.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const UMBRAL_CAMBIO_RELATIVO = 0.10; // 10% -- por debajo se considera ruido, no tendencia real

function cargarRolReal() {
  const ruta = join(DIR_VISOR, 'anatomia_entidades.json');
  if (!existsSync(ruta)) return new Map();
  const datos = JSON.parse(readFileSync(ruta, 'utf-8'));
  const mapa = new Map();
  for (const [slug, e] of Object.entries(datos.entidades || {})) {
    const rel = (e.fuentes || []).find((f) => f.rolReal);
    if (rel) mapa.set(slug, rel.rolReal);
  }
  return mapa;
}

function deltaRelativo(primero, ultimo) {
  if (!primero || primero === 0) return ultimo > 0 ? Infinity : 0;
  return (ultimo - primero) / primero;
}

function main() {
  const rutaManifest = join(DIR_VISOR, 'fichas_grafos.json');
  if (!existsSync(rutaManifest)) {
    console.log('Sin fichas_grafos.json todavia -- ejecuta antes regenerar_grafos.mjs.');
    return;
  }
  const manifest = JSON.parse(readFileSync(rutaManifest, 'utf-8'));
  const rolReal = cargarRolReal();

  const candidatos = [];
  const sinTendenciaAun = [];

  for (const ficha of Object.values(manifest.fichas)) {
    const historial = ficha.historial || [];
    if (historial.length < 2) { sinTendenciaAun.push(ficha.id); continue; }

    const primero = historial[0];
    const ultimo = historial[historial.length - 1];
    const cambios = [];
    for (const clave of Object.keys(ultimo)) {
      if (clave === 'en') continue;
      const delta = deltaRelativo(primero[clave] || 0, ultimo[clave] || 0);
      if (Math.abs(delta) >= UMBRAL_CAMBIO_RELATIVO) {
        cambios.push({ clave, de: primero[clave], a: ultimo[clave], deltaPorcentaje: Math.round(delta * 100) });
      }
    }
    if (cambios.length) {
      candidatos.push({
        id: ficha.id, nombre: ficha.nombre, tipo: ficha.tipo,
        capturas: historial.length, cambios,
        rolReal: rolReal.get(ficha.id) || null,
        descripcion: ficha.descripcion,
      });
    }
  }

  console.log('=== Candidatos reales por crecimiento/decrecimiento (Proceso 1a) ===');
  if (!candidatos.length) {
    console.log('Ninguno todavia -- ' + sinTendenciaAun.length + ' grafos con menos de 2 capturas reales (hace falta regenerar varias veces para ver tendencia).');
  } else {
    for (const c of candidatos) {
      console.log(`\n- ${c.nombre} [${c.tipo}] (${c.capturas} capturas reales)`);
      for (const ch of c.cambios) console.log(`    ${ch.clave}: ${ch.de} -> ${ch.a} (${ch.deltaPorcentaje > 0 ? '+' : ''}${ch.deltaPorcentaje}%)`);
      if (c.rolReal) console.log(`    rol real (§8.46): ${c.rolReal}`);
      console.log(`    ${c.descripcion}`);
    }
    console.log('\nProceso 1c (Puerta Humana): revisar estos candidatos y decidir si algo aquí amerita un grafo propio nuevo o una revisión de tipo.');
  }
  if (sinTendenciaAun.length) console.log(`\n(${sinTendenciaAun.length} grafos con una sola captura todavía: ${sinTendenciaAun.join(', ')} -- sin tendencia real que mostrar aún.)`);
}

main();
