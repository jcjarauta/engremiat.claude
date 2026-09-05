#!/usr/bin/env node
/*
 * Proceso 1c real, mitad "proponer" (§8.95, PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_
 * ENGREMIAT.md) -- escribe un candidato real con FICHA BORRADOR en
 * candidatos_a_promover.json, para que aparezca en la lista "A promover" de
 * grafos.html. La otra mitad, "promover" (aceptar de verdad, asignar tipo final),
 * sigue siendo un boton real en la propia pagina -- Puerta Humana en dos pasos,
 * nunca automatico.
 *
 * Nace porque grafos.html tenia antes una lista de "a promover" pre-rellenada a
 * mano (5 grafos historicos) -- el operador senalo que eso no reflejaba ningun
 * ciclo real: nadie habia propuesto de verdad esos candidatos todavia. Este script
 * es el mecanismo real para proponer, en vez de pre-poblar la lista a mano.
 *
 * Uso:
 *   node proponer_candidato.mjs --id sheet_real --nombre "El Sheet (con pestañas)" \
 *     --pagina sheet-real.html --tipo Espacio --prioridad Alta \
 *     --descripcion "Borrador: reune 4 datasets reales en pestañas."
 *
 * --prioridad real: Alta | Media | Baja (mismo vocabulario que PRIORIDAD en 90_CONFIGURACION)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const RUTA = join(DIR_VISOR, 'candidatos_a_promover.json');
const PRIORIDADES_REALES = ['Alta', 'Media', 'Baja'];

function leerArgs() {
  const args = process.argv.slice(2);
  const obj = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) obj[args[i].slice(2)] = args[i + 1];
  }
  return obj;
}

function main() {
  const { id, nombre, pagina, tipo, prioridad, descripcion } = leerArgs();
  if (!id || !nombre || !pagina || !tipo || !prioridad) {
    console.error('Uso: node proponer_candidato.mjs --id X --nombre "..." --pagina Y.html --tipo Espacio --prioridad Alta [--descripcion "..."]');
    process.exit(1);
  }
  if (!PRIORIDADES_REALES.includes(prioridad)) {
    console.error('Prioridad desconocida: ' + prioridad + ' (validas: ' + PRIORIDADES_REALES.join(', ') + ')');
    process.exit(1);
  }

  const datos = existsSync(RUTA) ? JSON.parse(readFileSync(RUTA, 'utf-8')) : { candidatos: [] };
  const yaExiste = datos.candidatos.some((c) => c.id === id);
  if (yaExiste) {
    console.error('Ya existe un candidato real con id "' + id + '" -- borralo primero si quieres reemplazarlo.');
    process.exit(1);
  }

  datos.candidatos.push({
    id, nombre, pagina, tipo, prioridad,
    descripcion: descripcion || '(sin descripción de borrador todavía)',
    propuestoEn: new Date().toISOString(),
  });
  writeFileSync(RUTA, JSON.stringify(datos, null, 2), 'utf-8');
  console.log('Candidato real propuesto: ' + nombre + ' [' + prioridad + '] -- ' + datos.candidatos.length + ' en la lista ahora.');
}

main();
