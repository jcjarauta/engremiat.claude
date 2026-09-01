// Exportador Prometheus del gasto real de recurso (GASTO_API, tabla Baserow 285).
// No duplica datos -- lee en vivo de Baserow (el continente que ya es dueno de este dato,
// ver MAPA_DOMINIOS_DATOS.md) y los expone en formato texto Prometheus por HTTP.
// Pensado para correr junto al resto del stack Docker del VPS (n8n, Baserow), atado solo
// a la IP de Tailscale -- mismo criterio de minimo privilegio que el resto de servicios
// reales del VPS (ver INFRAESTRUCTURA.md).
//
// Uso: node exportador_prometheus_gasto.mjs
// Variables de entorno esperadas (no hardcodear el token en el repo):
//   BASEROW_URL   -- ej. http://100.107.171.88 (mismo BASE que usa coordinador.mjs)
//   BASEROW_TOKEN -- token real de Baserow (Authorization: Token ...)
//   PUERTO        -- por defecto 9310
//   BIND          -- por defecto 100.107.171.88 (IP de Tailscale del VPS, nunca 0.0.0.0)

import http from 'node:http';

const BASE = process.env.BASEROW_URL || 'http://100.107.171.88';
const TOKEN = process.env.BASEROW_TOKEN;
const PUERTO = Number(process.env.PUERTO || 9310);
const BIND = process.env.BIND || '100.107.171.88';
const TABLA_GASTO_API = 285;

if (!TOKEN) {
  console.error('ERROR: falta BASEROW_TOKEN en el entorno -- nunca se hardcodea el token en el repo.');
  process.exit(1);
}

async function leerGastoReal() {
  // Baserow pagina de 200 en 200 por defecto -- se recorre todo, es una tabla de gasto,
  // no de millones de filas, coste real de leerla entera es bajo.
  let url = BASE + '/api/database/rows/table/' + TABLA_GASTO_API + '/?user_field_names=true&size=200';
  const filas = [];
  while (url) {
    const r = await fetch(url, { headers: { Authorization: TOKEN } });
    if (r.status >= 400) throw new Error('Baserow respondio ' + r.status + ' leyendo GASTO_API');
    const j = await r.json();
    filas.push(...j.results);
    url = j.next;
  }
  return filas;
}

function agregar(filas) {
  const ahora = Date.now();
  const ms24h = 24 * 60 * 60 * 1000;
  const ms7d = 7 * ms24h;

  let coste24h = 0, coste7d = 0, costeTotal = 0;
  let llamadas24h = 0;
  const porModelo = {};

  for (const f of filas) {
    const coste = Number(f.COSTE_ESTIMADO_USD || 0);
    const fecha = f.FECHA ? new Date(f.FECHA).getTime() : null;
    costeTotal += coste;
    if (fecha && ahora - fecha <= ms24h) { coste24h += coste; llamadas24h++; }
    if (fecha && ahora - fecha <= ms7d) coste7d += coste;

    const modelo = (f.MODELO || 'desconocido').toString();
    porModelo[modelo] = (porModelo[modelo] || 0) + coste;
  }

  return { coste24h, coste7d, costeTotal, llamadas24h, porModelo, filasLeidas: filas.length };
}

function formatoPrometheus(m) {
  const lineas = [];
  lineas.push('# HELP engremiat_gasto_api_coste_usd_24h Gasto real en USD de GASTO_API en las ultimas 24h.');
  lineas.push('# TYPE engremiat_gasto_api_coste_usd_24h gauge');
  lineas.push('engremiat_gasto_api_coste_usd_24h ' + m.coste24h.toFixed(6));

  lineas.push('# HELP engremiat_gasto_api_coste_usd_7d Gasto real en USD de GASTO_API en los ultimos 7 dias.');
  lineas.push('# TYPE engremiat_gasto_api_coste_usd_7d gauge');
  lineas.push('engremiat_gasto_api_coste_usd_7d ' + m.coste7d.toFixed(6));

  lineas.push('# HELP engremiat_gasto_api_coste_usd_total Gasto real acumulado en USD de toda la tabla GASTO_API.');
  lineas.push('# TYPE engremiat_gasto_api_coste_usd_total gauge');
  lineas.push('engremiat_gasto_api_coste_usd_total ' + m.costeTotal.toFixed(6));

  lineas.push('# HELP engremiat_gasto_api_llamadas_24h Numero de llamadas reales registradas en las ultimas 24h.');
  lineas.push('# TYPE engremiat_gasto_api_llamadas_24h gauge');
  lineas.push('engremiat_gasto_api_llamadas_24h ' + m.llamadas24h);

  lineas.push('# HELP engremiat_gasto_api_coste_por_modelo_usd Gasto real acumulado en USD, desglosado por modelo.');
  lineas.push('# TYPE engremiat_gasto_api_coste_por_modelo_usd gauge');
  for (const [modelo, coste] of Object.entries(m.porModelo)) {
    lineas.push('engremiat_gasto_api_coste_por_modelo_usd{modelo="' + modelo.replace(/"/g, '') + '"} ' + coste.toFixed(6));
  }

  lineas.push('# HELP engremiat_gasto_api_exportador_ok 1 si la ultima lectura de Baserow fue correcta, 0 si fallo.');
  lineas.push('# TYPE engremiat_gasto_api_exportador_ok gauge');
  lineas.push('engremiat_gasto_api_exportador_ok 1');

  return lineas.join('\n') + '\n';
}

const servidor = http.createServer(async (req, res) => {
  if (req.url !== '/metrics') { res.writeHead(404); res.end('solo /metrics\n'); return; }
  try {
    const filas = await leerGastoReal();
    const m = agregar(filas);
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    res.end(formatoPrometheus(m));
  } catch (e) {
    console.error('ERROR exportando gasto real:', e.message);
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    res.end('# HELP engremiat_gasto_api_exportador_ok 1 si la ultima lectura de Baserow fue correcta, 0 si fallo.\n# TYPE engremiat_gasto_api_exportador_ok gauge\nengremiat_gasto_api_exportador_ok 0\n');
  }
});

servidor.listen(PUERTO, BIND, () => {
  console.log('Exportador de gasto real escuchando en http://' + BIND + ':' + PUERTO + '/metrics (solo Tailscale)');
});
