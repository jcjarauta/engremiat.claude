// Chequeo de salud del ecosistema Engremiat -- generaliza el principio de
// tools/consola/chequear_consistencia.mjs (comparar dos fuentes que deberian
// coincidir y avisar del desajuste) a los 3 puntos de desincronizacion
// REALES encontrados el 2026-08-23, no hipoteticos:
//
//   1. Rama activa vs main -- cuantos commits de diferencia (la Consola se
//      quedo 19 commits atras de main sin que nadie lo notara).
//   2. Antiguedad de PROMPT_EJECUTOR.md -- dias desde su ultima revision
//      humana/Claude declarada en la cabecera del propio fichero.
//   3. Consistencia Consola<->Sheet -- delega en chequear_consistencia.mjs
//      (necesita un volcado fresco del Sheet como argumento; si no se pasa,
//      se omite ese chequeo y se avisa).
//
// Lo que este script NO puede comprobar (necesita herramientas de Claude,
// no de Node): si el trigger de Ejecutor (RemoteTrigger) esta activo y
// disparandose con normalidad -- eso es el 4o punto real de fallo de hoy
// (trigger "enabled: false" sin que nadie lo notara). Ver SALUD_ECOSISTEMA.md
// para el paso manual que lo cubre.
//
// Uso: node tools/salud_ecosistema.mjs [rama-activa] [volcado-sheet.json]
// Ambos argumentos son opcionales -- sin ellos, se omiten esos chequeos.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAMA_ACTIVA = process.argv[2];
const VOLCADO_SHEET = process.argv[3];

const UMBRAL_COMMITS_AVISO = 5;
const REGISTRO = JSON.parse(fs.readFileSync(path.join(DIR, 'registro_ecosistema.json'), 'utf8'));

function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: DIR, encoding: 'utf8' }).trim();
}

let huboAviso = false;
function aviso(msg) { console.log('⚠ ' + msg); huboAviso = true; }
function ok(msg) { console.log('✓ ' + msg); }

console.log('=== Salud del ecosistema Engremiat -- ' + new Date().toISOString().slice(0, 10) + ' ===\n');

// 1) Rama activa vs main
console.log('-- 1. Rama activa vs main --');
if (!RAMA_ACTIVA) {
  aviso('No se indicó rama activa -- pásala como primer argumento (ver #ramaActiva en la Consola). Chequeo omitido.');
} else {
  try {
    git('fetch origin -q');
    const detras = parseInt(git(`rev-list --count origin/${RAMA_ACTIVA}..origin/main`), 10);
    if (detras === 0) {
      ok(`'${RAMA_ACTIVA}' está al día con main.`);
    } else if (detras <= UMBRAL_COMMITS_AVISO) {
      ok(`'${RAMA_ACTIVA}' va ${detras} commit(s) por detrás de main -- dentro de lo normal.`);
    } else {
      aviso(`'${RAMA_ACTIVA}' va ${detras} commits por detrás de main -- revisar si hace falta traer main o si la próxima jornada ya lo resuelve sola.`);
    }
  } catch (e) {
    aviso(`No se pudo comparar '${RAMA_ACTIVA}' contra main (¿existe esa rama en origin?): ${e.message.split('\n')[0]}`);
  }
}
console.log('');

// 2) Antigüedad de cada prompt operativo registrado
console.log('-- 2. Antigüedad de prompts operativos (registro_ecosistema.json) --');
if (!REGISTRO.prompts_operativos?.length) {
  aviso('No hay prompts_operativos en el registro -- ¿ecosistema sin ningún prompt registrado?');
}
for (const p of REGISTRO.prompts_operativos || []) {
  try {
    const contenido = fs.readFileSync(path.join(DIR, '..', p.fichero), 'utf8');
    const re = new RegExp(p.cabecera_revision_regex);
    const m = contenido.match(re);
    if (!m) {
      aviso(`${p.fichero} (${p.agente}): no tiene la cabecera de "Última revisión" esperada -- añadirla.`);
      continue;
    }
    const dias = Math.floor((Date.now() - new Date(m[1] + 'T00:00:00Z').getTime()) / 86400000);
    const umbral = p.umbral_dias_aviso ?? 7;
    if (dias <= umbral) {
      ok(`${p.fichero} (${p.agente}): revisado hace ${dias} día(s) (${m[1]}).`);
    } else {
      aviso(`${p.fichero} (${p.agente}): revisado hace ${dias} días (${m[1]}) -- por encima del umbral de ${umbral}, conviene repasarlo.`);
    }
  } catch (e) {
    aviso(`No se pudo leer ${p.fichero}: ` + e.message.split('\n')[0]);
  }
}
console.log('');

// 3) Consistencia Consola<->Sheet (delega en el script existente)
console.log('-- 3. Consistencia Consola<->Sheet --');
if (!VOLCADO_SHEET) {
  aviso('No se indicó volcado del Sheet -- pásalo como segundo argumento. Chequeo omitido (ver tools/consola/chequear_consistencia.mjs para el formato).');
} else {
  try {
    execSync(`node consola/chequear_consistencia.mjs "${VOLCADO_SHEET}"`, { cwd: DIR, stdio: 'inherit' });
    ok('Consola y Sheet sincronizados.');
  } catch {
    aviso('Desajuste Consola<->Sheet -- ver detalle arriba (salida de chequear_consistencia.mjs).');
  }
}
console.log('');

console.log('-- 4. Estado de los triggers programados (registro_ecosistema.json) --');
console.log('  No comprobable desde Node -- requiere una sesión de Claude con la herramienta RemoteTrigger.');
console.log('  Paso manual: RemoteTrigger action:"list" -> revisar "enabled" y "last_fired_at" de cada uno de estos:');
for (const t of REGISTRO.triggers_programados || []) {
  console.log(`    - ${t.id} ("${t.nombre}", agente: ${t.agente})`);
}
console.log('');

console.log(huboAviso ? '=> Hay avisos que revisar antes de dar el ecosistema por sincronizado.' : '=> Todo lo comprobable automáticamente está en orden.');
process.exit(huboAviso ? 1 : 0);
