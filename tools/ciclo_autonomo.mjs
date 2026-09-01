// Ciclo autonomo -- dispara el pipeline real de Vigilia para una rama entera de
// VIGILIA_TAREA sin intervencion manual: siembra ya hecha externamente, este script
// dispara el webhook, espera, y si no hay avance comprueba la antiguedad REAL del
// lock en Baserow (no el estado de ejecucion de n8n, que no es fiable -- un nodo
// terminal roto como el correo puede marcar "error" aunque el trabajo real ya se
// haya guardado bien) -- limpia solo los locks realmente estancados, y reintenta
// hasta que todo este procesado o se agote el limite de tiempo. Al terminar,
// exporta los resultados y llama al Coordinador para verificar/atomizar, igual
// que se hizo a mano toda la noche.
//
// Uso: node ciclo_autonomo.mjs <RAMA> [minutos_limite]
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const TOKEN = readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.baserow_token', 'utf-8').trim();
const BASE = 'http://100.107.171.88';
const N8N_BASE = 'http://localhost:5680';
const ESPERA_ENTRE_INTENTOS_MS = 15000;
const MAX_INTENTOS_SEGUIDOS_SIN_AVANCE = 5;

const RAMA = process.argv[2];
if (!RAMA) { console.error('Uso: node ciclo_autonomo.mjs <RAMA> [minutos_limite]'); process.exit(1); }
const MAX_MINUTOS = Number(process.argv[3] || 15);
const LIMITE_TIEMPO = Date.now() + MAX_MINUTOS * 60 * 1000;

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function filasDeLaRama() {
  const r = await fetch(BASE + '/api/database/rows/table/287/?user_field_names=true&filter__RAMA__equal=' + encodeURIComponent(RAMA) + '&size=100', { headers: { Authorization: TOKEN } });
  const j = await r.json();
  return j.results;
}

async function limpiarLock(id) {
  await fetch(BASE + '/api/database/rows/table/287/' + id + '/?user_field_names=true', {
    method: 'PATCH', headers: { Authorization: TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ PROCESANDO_DESDE: '' })
  });
}

const SEGUNDOS_LOCK_STANCADO = 90; // el lock real se auto-recupera a los 10 min; aqui reintentamos antes si lleva "quieto" un rato

function locksStancados(filas) {
  const ahora = Date.now();
  return filas.filter(f => {
    if (f.ESTADO.value !== 'pendiente' || !f.PROCESANDO_DESDE) return false;
    const desde = Date.parse(f.PROCESANDO_DESDE);
    return (ahora - desde) > SEGUNDOS_LOCK_STANCADO * 1000;
  });
}

async function main() {
  console.log('Ciclo autonomo -- rama "' + RAMA + '", limite ' + MAX_MINUTOS + ' min.');
  let filas = await filasDeLaRama();
  const total = filas.length;
  if (!total) { console.log('No hay filas en esta rama -- nada que hacer.'); return; }
  let procesados = filas.filter(f => f.ESTADO.value === 'procesado').length;
  console.log('Estado inicial: ' + procesados + '/' + total + ' procesados.');

  let intentosSeguidosSinAvance = 0;
  while (procesados < total) {
    if (Date.now() > LIMITE_TIEMPO) { console.log('LIMITE DE TIEMPO ALCANZADO -- deteniendo, quedan ' + (total - procesados) + ' sin procesar.'); break; }

    await fetch(N8N_BASE + '/webhook/temp-kick-vision-global').catch(() => {});
    await sleep(ESPERA_ENTRE_INTENTOS_MS);

    filas = await filasDeLaRama();
    const nuevoProcesados = filas.filter(f => f.ESTADO.value === 'procesado').length;

    if (nuevoProcesados > procesados) {
      procesados = nuevoProcesados;
      console.log(procesados + '/' + total + ' procesados.');
      intentosSeguidosSinAvance = 0;
      continue;
    }

    intentosSeguidosSinAvance++;
    console.log('Sin avance (intento ' + intentosSeguidosSinAvance + '/' + MAX_INTENTOS_SEGUIDOS_SIN_AVANCE + ') -- comprobando locks reales en Baserow...');
    const stancados = locksStancados(filas);
    if (stancados.length) {
      console.log('  ' + stancados.length + ' lock(s) con mas de ' + SEGUNDOS_LOCK_STANCADO + 's sin resolver -- limpiando y reintentando.');
      for (const f of stancados) await limpiarLock(f.id);
    } else {
      console.log('  ningun lock realmente estancado todavia -- puede que Concilio+DeepSeek este tardando, se espera y reintenta.');
    }
    if (intentosSeguidosSinAvance >= MAX_INTENTOS_SEGUIDOS_SIN_AVANCE) {
      console.log(MAX_INTENTOS_SEGUIDOS_SIN_AVANCE + ' intentos seguidos sin avance -- deteniendo, esto ya no es un retraso transitorio.');
      break;
    }
  }

  console.log('Ciclo de disparo terminado: ' + procesados + '/' + total + ' procesados.');

  if (procesados === 0) { console.log('Nada procesado -- no se llama al Coordinador.'); return; }

  // PROFUNDIDAD_INICIAL permite pedir solo verificacion+correccion sin atomizar (ponerla ya
  // en el tope, ej. 2) -- util para lotes de triaje/clasificacion donde no tiene sentido que
  // el Coordinador genere sub-preguntas de diseño a partir de cada respuesta.
  const PROFUNDIDAD_INICIAL = Number(process.env.CICLO_AUTONOMO_PROFUNDIDAD_INICIAL || 1);
  const salida = filas
    .filter(f => f.ESTADO.value === 'procesado')
    .map(f => ({ NOMBRE: f.NOMBRE, TEMA: f.TEMA, RESULTADO: f.RESULTADO, TABLA_RELEVANTE: f.TABLA_RELEVANTE, PROFUNDIDAD: PROFUNDIDAD_INICIAL }));
  const dirSalida = process.env.CICLO_AUTONOMO_DIR_SALIDA || 'C:/Users/pc/AppData/Local/Temp/claude/G--Mi-unidad-DEVS/8d5c5706-0aac-4c2a-9810-71ffffbdee92/scratchpad';
  const rutaEntrada = dirSalida + '/ciclo_autonomo_' + RAMA.replace(/[^A-Za-z0-9_-]/g, '_') + '.json';
  writeFileSync(rutaEntrada, JSON.stringify(salida, null, 1));
  console.log('Exportadas ' + salida.length + ' filas procesadas a ' + rutaEntrada + '. Llamando al Coordinador...');

  execFileSync('node', ['coordinador.mjs', rutaEntrada, rutaEntrada.replace(/\.json$/, '_informe.json'), 'Lote-' + RAMA], { stdio: 'inherit', cwd: import.meta.dirname });
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
