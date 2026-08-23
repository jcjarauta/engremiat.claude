// Chequeo de consistencia Consola <-> Sheet, en las DOS direcciones.
//
// Sustituye a chequear_consistencia_consola.mjs (INC-0045), que vivia sin
// versionar en scratchpad y apuntaba a un generador (generar_mesa_revision.mjs)
// que ya no es la fuente real -- la fuente real es este mismo repo,
// tools/consola/consola-engremiat.html (ver feedback_consola_engremiat_sin_versionar).
//
// PASO OBLIGATORIO antes de cada publicacion de la Consola, y primer paso
// de cualquier sesion de trabajo con ella (ver metodologia en
// tools/consola/SINCRONIZACION.md). Detecta:
//   1. Tarjetas en Consola cuyo ESTADO en el Sheet ya esta cerrado
//      (deberian salir de GRUPOS).
//   2. Filas abiertas en el Sheet que NO estan en Consola (deberian
//      entrar en GRUPOS) -- el bug real que motivo esto el 2026-08-23:
//      GRUPOS llevaba 4 incidencias de retraso (INC-0052 a INC-0055) sin
//      que nadie se enterase hasta que el operador lo noto a mano.
//
// Uso: node chequear_consistencia.mjs <ruta-volcado-crudo.json>
// El volcado es la salida cruda de mcp__gsheets__sheets_get_values sobre
// 13_INCIDENCIAS!A2:Z<ultima fila> (o al menos A:D + K:Q), guardada tal
// cual la devuelve la herramienta: {range, rowCount, columnCount, values}.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CONSOLA = path.join(DIR, 'consola-engremiat.html');
const VOLCADO_CRUDO = process.argv[2];
if (!VOLCADO_CRUDO) {
  console.error('Uso: node chequear_consistencia.mjs <ruta-volcado-crudo.json>');
  console.error('(volcado = 13_INCIDENCIAS!A2:Z<ultima fila>, formato crudo de sheets_get_values)');
  process.exit(2);
}

// Indices 0-based dentro de cada fila del volcado (columna A = 0).
const COL = { ID: 0, TITULO: 9, DESCRIPCION: 10, TIPO: 11, PRIORIDAD: 12, ESTADO: 16 };
const ESTADOS_CERRADOS = new Set(['Resuelta', 'Cerrada', 'Descartada', 'Rechazada']);

function extraerGrupos_() {
  const fuente = fs.readFileSync(CONSOLA, 'utf8');
  const inicio = fuente.indexOf('var GRUPOS = [');
  const fin = fuente.indexOf('\n];', inicio) + 3;
  const GRUPOS = eval(fuente.slice(inicio, fin).replace('var GRUPOS = ', ''));
  return GRUPOS;
}

function main() {
  const GRUPOS = extraerGrupos_();
  const idsEnConsola = new Map(); // id -> clave de grupo
  GRUPOS.forEach(g => g.items.forEach(it => idsEnConsola.set(it.id, g.clave)));

  const volcado = JSON.parse(fs.readFileSync(VOLCADO_CRUDO, 'utf8'));
  const filas = volcado.values || volcado;
  const filasPorId = new Map(filas.map(r => [r[COL.ID], r]));

  console.log(`IDs en Consola: ${idsEnConsola.size} · Filas en Sheet: ${filasPorId.size}`);
  console.log('');

  // 1) Cerradas en Sheet pero aun en Consola -- deben salir de GRUPOS.
  const cerradasEnConsola = [];
  idsEnConsola.forEach((clave, id) => {
    const fila = filasPorId.get(id);
    if (!fila) return; // lo cubre el chequeo de "sin fila" mas abajo
    const estado = fila[COL.ESTADO];
    if (ESTADOS_CERRADOS.has(estado)) cerradasEnConsola.push({ id, clave, estado });
  });
  if (cerradasEnConsola.length) {
    console.log('⚠ CERRADAS en el Sheet pero siguen en Consola (quitar de GRUPOS):');
    cerradasEnConsola.forEach(r => console.log(`  - ${r.id} [${r.clave}] (${r.estado})`));
  } else {
    console.log('✓ Ninguna tarjeta de la Consola esta cerrada en el Sheet.');
  }
  console.log('');

  // 2) En Consola sin fila real en el Sheet (id incorrecto o fila borrada).
  const sinFilaEnSheet = [...idsEnConsola.keys()].filter(id => !filasPorId.has(id));
  if (sinFilaEnSheet.length) {
    console.log('⚠ En Consola pero SIN FILA en el Sheet:');
    sinFilaEnSheet.forEach(id => console.log(`  - ${id}`));
  } else {
    console.log('✓ Todos los IDs de la Consola existen en el Sheet.');
  }
  console.log('');

  // 3) Abiertas en el Sheet pero AUSENTES de Consola -- el bug real de
  //    INC-0055: nadie regenero GRUPOS al archivar incidencias nuevas.
  const faltanEnConsola = filas.filter(r => {
    const id = r[COL.ID];
    const estado = r[COL.ESTADO];
    return id && !ESTADOS_CERRADOS.has(estado) && !idsEnConsola.has(id);
  });
  if (faltanEnConsola.length) {
    console.log('⚠ ABIERTAS en el Sheet pero AUSENTES de Consola (añadir a GRUPOS):');
    faltanEnConsola.forEach(r => {
      console.log(`  - ${r[COL.ID]} [${r[COL.TIPO] || '?'}/${r[COL.PRIORIDAD] || '?'}] ${r[COL.TITULO] || '(sin titulo)'}`);
    });
  } else {
    console.log('✓ Ninguna incidencia abierta del Sheet falta en Consola.');
  }

  const huboDesajuste = cerradasEnConsola.length || sinFilaEnSheet.length || faltanEnConsola.length;
  console.log('');
  console.log(huboDesajuste ? '=> DESAJUSTE -- regenerar GRUPOS antes de trabajar/publicar.' : '=> Consola y Sheet estan sincronizados.');
  process.exit(huboDesajuste ? 1 : 0);
}

main();
