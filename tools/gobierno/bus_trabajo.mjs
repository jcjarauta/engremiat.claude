#!/usr/bin/env node
/*
 * Bus de eventos vía Sheet (ver PROPUESTA_ECOSISTEMA_AGENTICO_HIBRIDO.md
 * -- diseñado el 2026-08-23, sin construir hasta hoy). Formaliza el
 * patrón que "13_INCIDENCIAS ya hace de facto": cada worker reclama su
 * fila (actor + timestamp, evita dobles procesados), trabaja, y cierra
 * dejando el resultado + duración -- sin tocar el esquema real de
 * 13_INCIDENCIAS, vive en su propia pestaña.
 *
 * Nace directamente del patrón ya probado en el lote 1 (2026-08-25):
 * reparto determinista por ficheros, un commit por incidencia,
 * verificación antes de cerrar. Este script es ese mismo patrón, ya no
 * a mano (CLAIMS_LOTE1.md) sino con estado real en el Sheet.
 *
 * Uso:
 *   node bus_trabajo.mjs listar [--estado <estado>]
 *   node bus_trabajo.mjs reclamar <incidenciaId> <worker> <ficheros-separados-por-;>
 *   node bus_trabajo.mjs en_progreso <idTarea>
 *   node bus_trabajo.mjs cerrar <idTarea> <rama> <commit> <duracionSegundos> <resultado>
 *   node bus_trabajo.mjs verificar <idTarea> <verificadoPor> <ok|rechazada> <nota>
 *
 * Estados: pendiente -> reclamada -> en_progreso -> lista_para_revision -> verificada_ok | rechazada
 *
 * Autenticacion: misma cuenta de servicio de Sheets que cerrar_ciclo.mjs
 * (ENGREMIAT_SHEETS_CREDENTIALS_PATH, o la ruta por defecto ya usada).
 */
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const SPREADSHEET_ID = '142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ';
const PESTANA = '92_BUS_TRABAJO';
const CREDENCIALES_PATH = process.env.ENGREMIAT_SHEETS_CREDENTIALS_PATH || 'G:\\Mi unidad\\DEVS\\engremiat-6259cee67897.json';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

const ENCABEZADOS = ['ID_TAREA', 'INCIDENCIA_ID', 'WORKER_ASIGNADO', 'FICHEROS', 'ESTADO', 'RECLAMADO_POR', 'FECHA_RECLAMACION', 'RAMA_GIT', 'COMMIT', 'DURACION_SEGUNDOS', 'VERIFICADO_POR', 'FECHA_VERIFICACION', 'RESULTADO'];
const COL = Object.fromEntries(ENCABEZADOS.map((h, i) => [h, i]));

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function obtenerAccessToken() {
  const cred = JSON.parse(readFileSync(CREDENCIALES_PATH, 'utf8'));
  const ahora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({ iss: cred.client_email, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', exp: ahora + 3600, iat: ahora }));
  const firmante = createSign('RSA-SHA256');
  firmante.update(`${header}.${claim}`);
  firmante.end();
  const jwt = `${header}.${claim}.${base64url(firmante.sign(cred.private_key))}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('AUTH_FAILED: ' + JSON.stringify(data));
  return data.access_token;
}

async function llamarSheets(token, metodo, ruta, body) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}${ruta}`, {
    method: metodo, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (data.error) throw new Error(`SHEETS_API_ERROR: ${JSON.stringify(data.error)}`);
  return data;
}

async function asegurarPestana(token) {
  const meta = await llamarSheets(token, 'GET', '');
  const existente = meta.sheets.find((s) => s.properties.title === PESTANA);
  if (existente) return existente.properties.sheetId;

  const creada = await llamarSheets(token, 'POST', ':batchUpdate', {
    requests: [{ addSheet: { properties: { title: PESTANA, gridProperties: { rowCount: 500, columnCount: ENCABEZADOS.length } } } }],
  });
  const sheetId = creada.replies[0].addSheet.properties.sheetId;
  await llamarSheets(token, 'PUT', `/values/${encodeURIComponent(PESTANA)}!A1?valueInputOption=USER_ENTERED`, { values: [ENCABEZADOS] });
  await llamarSheets(token, 'POST', ':batchUpdate', {
    requests: [{ repeatCell: { range: { sheetId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.85, green: 0.9, blue: 0.98 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } }],
  });
  return sheetId;
}

async function leerFilas(token) {
  const datos = await llamarSheets(token, 'GET', `/values/${encodeURIComponent(PESTANA)}!A2:M`);
  return datos.values || [];
}

async function escribirFila(token, filaIndice1Based, fila) {
  await llamarSheets(token, 'PUT', `/values/${encodeURIComponent(PESTANA)}!A${filaIndice1Based}?valueInputOption=USER_ENTERED`, { values: [fila] });
}

async function anadirFila(token, fila) {
  await llamarSheets(token, 'POST', `/values/${encodeURIComponent(PESTANA)}:append?valueInputOption=USER_ENTERED`, { values: [fila] });
}

function nuevoIdTarea(filas) {
  const nums = filas.map((f) => parseInt(String(f[COL.ID_TAREA] || '').replace('TASK-', ''), 10)).filter((n) => !isNaN(n));
  const siguiente = (nums.length ? Math.max(...nums) : 0) + 1;
  return 'TASK-' + String(siguiente).padStart(4, '0');
}

async function cmdListar(token, filtroEstado) {
  const filas = await leerFilas(token);
  const filtradas = filtroEstado ? filas.filter((f) => f[COL.ESTADO] === filtroEstado) : filas;
  if (filtradas.length === 0) { console.log('Sin tareas' + (filtroEstado ? ` en estado '${filtroEstado}'` : '') + '.'); return; }
  filtradas.forEach((f) => {
    console.log(`${f[COL.ID_TAREA]} | ${f[COL.INCIDENCIA_ID]} | ${f[COL.WORKER_ASIGNADO]} | ${f[COL.ESTADO]} | ${f[COL.FICHEROS] || ''}`);
  });
}

async function cmdReclamar(token, incidenciaId, worker, ficheros) {
  await asegurarPestana(token);
  const filas = await leerFilas(token);
  const yaReclamada = filas.find((f) => f[COL.INCIDENCIA_ID] === incidenciaId && !['verificada_ok', 'rechazada'].includes(f[COL.ESTADO]));
  if (yaReclamada) throw new Error(`YA_RECLAMADA: ${incidenciaId} ya tiene una tarea activa (${yaReclamada[COL.ID_TAREA]}, estado ${yaReclamada[COL.ESTADO]}) -- evita doble procesado.`);

  const idTarea = nuevoIdTarea(filas);
  const fila = [idTarea, incidenciaId, worker, ficheros, 'reclamada', worker, new Date().toISOString(), '', '', '', '', '', ''];
  await anadirFila(token, fila);
  console.log(`Reclamada: ${idTarea} (${incidenciaId} -> ${worker})`);
}

async function buscarFila(token, idTarea) {
  const filas = await leerFilas(token);
  const idx = filas.findIndex((f) => f[COL.ID_TAREA] === idTarea);
  if (idx === -1) throw new Error(`TAREA_NO_ENCONTRADA: ${idTarea}`);
  return { fila: filas[idx], filaIndice1Based: idx + 2 };
}

async function cmdEnProgreso(token, idTarea) {
  const { fila, filaIndice1Based } = await buscarFila(token, idTarea);
  fila[COL.ESTADO] = 'en_progreso';
  await escribirFila(token, filaIndice1Based, fila);
  console.log(`${idTarea} -> en_progreso`);
}

async function cmdCerrar(token, idTarea, rama, commit, duracionSegundos, resultado) {
  const { fila, filaIndice1Based } = await buscarFila(token, idTarea);
  fila[COL.ESTADO] = 'lista_para_revision';
  fila[COL.RAMA_GIT] = rama;
  fila[COL.COMMIT] = commit;
  fila[COL.DURACION_SEGUNDOS] = duracionSegundos;
  fila[COL.RESULTADO] = resultado;
  await escribirFila(token, filaIndice1Based, fila);
  console.log(`${idTarea} -> lista_para_revision (rama ${rama}, commit ${commit})`);
}

async function cmdVerificar(token, idTarea, verificadoPor, veredicto, nota) {
  if (!['ok', 'rechazada'].includes(veredicto)) throw new Error("VEREDICTO_INVALIDO: usa 'ok' o 'rechazada'");
  const { fila, filaIndice1Based } = await buscarFila(token, idTarea);
  fila[COL.ESTADO] = veredicto === 'ok' ? 'verificada_ok' : 'rechazada';
  fila[COL.VERIFICADO_POR] = verificadoPor;
  fila[COL.FECHA_VERIFICACION] = new Date().toISOString();
  fila[COL.RESULTADO] = (fila[COL.RESULTADO] || '') + ' | Verificación: ' + nota;
  await escribirFila(token, filaIndice1Based, fila);
  console.log(`${idTarea} -> ${fila[COL.ESTADO]}`);
}

async function cmdPanel(token) {
  const filas = await leerFilas(token);
  if (filas.length === 0) { console.log('Sin datos todavía.'); return; }

  const porWorker = {};
  filas.forEach((f) => {
    const w = f[COL.WORKER_ASIGNADO] || '(sin asignar)';
    if (!porWorker[w]) porWorker[w] = { total: 0, verificadas: 0, rechazadas: 0, duracionTotal: 0 };
    porWorker[w].total += 1;
    if (f[COL.ESTADO] === 'verificada_ok') porWorker[w].verificadas += 1;
    if (f[COL.ESTADO] === 'rechazada') porWorker[w].rechazadas += 1;
    const dur = Number(f[COL.DURACION_SEGUNDOS]);
    if (!isNaN(dur)) porWorker[w].duracionTotal += dur;
  });

  console.log('Panel de coste/tiempo por worker (datos reales del bus de trabajo)\n');
  Object.entries(porWorker).forEach(([worker, stats]) => {
    const tasaAcierto = stats.total > 0 ? Math.round((stats.verificadas / stats.total) * 100) : 0;
    console.log(`${worker}: ${stats.total} tarea(s), ${stats.verificadas} verificada(s), ${stats.rechazadas} rechazada(s) -- tasa acierto ${tasaAcierto}%, ${stats.duracionTotal.toFixed(1)}s acumulados`);
  });
}

async function main() {
  const [, , comando, ...args] = process.argv;
  const token = await obtenerAccessToken();
  await asegurarPestana(token);

  if (comando === 'listar') {
    const idxEstado = args.indexOf('--estado');
    await cmdListar(token, idxEstado !== -1 ? args[idxEstado + 1] : null);
  } else if (comando === 'reclamar') {
    await cmdReclamar(token, args[0], args[1], args[2]);
  } else if (comando === 'en_progreso') {
    await cmdEnProgreso(token, args[0]);
  } else if (comando === 'cerrar') {
    await cmdCerrar(token, args[0], args[1], args[2], args[3], args[4]);
  } else if (comando === 'verificar') {
    await cmdVerificar(token, args[0], args[1], args[2], args[3]);
  } else if (comando === 'panel') {
    await cmdPanel(token);
  } else {
    console.error('Uso: node bus_trabajo.mjs <listar|reclamar|en_progreso|cerrar|verificar|panel> ...');
    process.exit(1);
  }
}

main().catch((err) => { console.error('ERROR', err.message); process.exitCode = 2; });
