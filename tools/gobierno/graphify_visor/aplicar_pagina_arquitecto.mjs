#!/usr/bin/env node
/*
 * §8.118: automatiza los 3 de los 5 pasos reales que antes quedaban a mano tras
 * "Construir página real" en arquitecto.html -- guardar el fichero, añadir su
 * línea de volumen en docker-compose.yml, desplegar y verificar. Los otros dos
 * (enlazar la página nueva desde donde cuelga, rellenar los TODO reales) SÍ
 * necesitan criterio real del operador y se quedan siempre a mano, impresos al
 * final -- automatizarlos a ciegas editando páginas ajenas o inventando
 * contenido real sería justo el tipo de invención que este proyecto evita.
 *
 * El HTML real generado por arquitecto.html no vive en este ordenador (se
 * genera en el navegador) -- lo deja en una cola real en servidor_memoria.mjs
 * (POST /api/pagina_pendiente, §8.118) y este script lo recoge de ahí por red,
 * nunca a ciegas ni copiado a mano.
 *
 * Uso:
 *   node aplicar_pagina_arquitecto.mjs <archivo.html>
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const URL_MEMORIA = 'http://100.107.171.88:9330';

function fallar(mensaje) {
  console.error('ERROR: ' + mensaje);
  process.exit(1);
}

// Inserta la línea de volumen real dentro del bloque del servicio graphify-visor de
// docker-compose.yml, si no está ya -- mismo escaneo por indentación que ya usa
// desplegar_visor.mjs (extraerFicherosDelServicio), nunca una segunda lista a mano.
function anadirVolumenSiFalta(archivo) {
  const ruta = join(DIR_VISOR, 'docker-compose.yml');
  const lineas = readFileSync(ruta, 'utf-8').split('\n');
  const inicio = lineas.findIndex((l) => l.trim() === 'graphify-visor:');
  if (inicio === -1) fallar("Servicio 'graphify-visor' no encontrado en docker-compose.yml");

  let finVolumenes = -1;
  for (let i = inicio + 1; i < lineas.length; i++) {
    const l = lineas[i];
    if (/^\s{2}\S/.test(l) && !/^\s{4}/.test(l)) break; // siguiente servicio al mismo nivel
    if (new RegExp('\\./' + archivo.replace(/\./g, '\\.') + ':/app/').test(l)) {
      console.log('(ya declarado en docker-compose.yml, no se toca)');
      return;
    }
    if (/^\s*-\s*\.\//.test(l)) finVolumenes = i;
  }
  if (finVolumenes === -1) fallar("No se encontró ningún volumen real existente de 'graphify-visor' donde insertar el nuevo");

  const indentacion = lineas[finVolumenes].match(/^\s*/)[0];
  lineas.splice(finVolumenes + 1, 0, `${indentacion}- ./${archivo}:/app/${archivo}:ro`);
  writeFileSync(ruta, lineas.join('\n'), 'utf-8');
  console.log('Añadida la línea de volumen real en docker-compose.yml.');
}

async function main() {
  const archivo = process.argv[2];
  if (!archivo) fallar('falta el nombre real del fichero, ej.: node aplicar_pagina_arquitecto.mjs mapa.html');

  console.log(`=== 1/4 Leyendo la página pendiente real "${archivo}" de la cola ===`);
  const r = await fetch(`${URL_MEMORIA}/api/pagina_pendiente?archivo=${encodeURIComponent(archivo)}`);
  if (!r.ok) fallar((await r.json()).error || `no se encontró "${archivo}" en la cola real (¿ya se aplicó, o falta pulsar "Construir página real" en arquitecto.html?)`);
  const entrada = await r.json();

  const rutaLocal = join(DIR_VISOR, archivo);
  // §8.119: reconstruccion=true significa que esta pagina ya existe de verdad y ESTO es
  // intencional (viene de "Editar contenido real de una pagina existente" en
  // arquitecto.html, nunca de la creacion de una pagina nueva) -- solo entonces se permite
  // sobrescribir. Sin el flag, sigue el criterio real de siempre: nunca a ciegas.
  if (existsSync(rutaLocal) && !entrada.reconstruccion) {
    fallar(`ya existe de verdad ${rutaLocal} -- si quieres reaplicar, bórralo tú primero (nunca se sobrescribe a ciegas)`);
  }
  if (existsSync(rutaLocal) && entrada.reconstruccion) {
    console.log(`(reconstruyendo pagina real existente -- ya tenia contenido en ${rutaLocal})`);
  }

  console.log(`\n=== 2/4 Guardando el HTML real en ${rutaLocal} ===`);
  writeFileSync(rutaLocal, entrada.html, 'utf-8');

  console.log('\n=== 3/4 Actualizando docker-compose.yml ===');
  anadirVolumenSiFalta(archivo);

  console.log('\n=== 4/4 Desplegando y verificando en real (desplegar_visor.mjs) ===');
  execFileSync('node', ['desplegar_visor.mjs'], { cwd: DIR_VISOR, stdio: 'inherit' });

  await fetch(`${URL_MEMORIA}/api/pagina_pendiente?archivo=${encodeURIComponent(archivo)}`, { method: 'DELETE' }).catch(() => {});

  if (entrada.reconstruccion) {
    console.log('\nReconstruida y desplegada de verdad.');
  } else {
    console.log('\nAplicado. Pasos reales que SÍ necesitan tu criterio, todavía pendientes:');
    console.log(`  1. Enlaza la página nueva desde ${entrada.colgarDe} (elegiste que cuelgue de "${entrada.nombreColgarDe}"): <a href="${archivo}">${entrada.nombre}</a>`);
    console.log('  2. Rellena los TODO reales del HTML con el contenido de verdad de cada caja.');
  }
}

main().catch((e) => fallar(e.message));
