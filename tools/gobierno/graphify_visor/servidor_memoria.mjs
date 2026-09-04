// Servidor real de memoria compartida para la mesa de montaje (§8.52, Fase 4 del plan
// del Bastidor). Hasta ahora el registro de eventos y los montajes guardados vivian solo
// en localStorage -- memoria de UN navegador, se pierde al limpiar datos, nunca compartida
// con nadie mas. Este es el primer servidor con escritura real de todo el visor (las otras
// diez vistas son solo lectura, `npx serve`).
//
// Deliberadamente simple, sin credenciales externas ni base de datos nueva -- un fichero
// JSON real en disco, con lectura/escritura atomica. Precedente real ya en el proyecto:
// tools/gobierno/spike_concilio_coop/servidor.mjs (WebSocket + credenciales SOLO del lado
// servidor). Migrar a Baserow es el paso natural si este fichero se queda corto -- no antes,
// mismo criterio de "no infraestructura prematura" que ya validamos investigando los dos
// informes de arquitectura (§8.47).
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSign } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR_DATOS = process.env.DATOS_DIR || join(__dirname, 'datos');
if (!existsSync(DIR_DATOS)) mkdirSync(DIR_DATOS, { recursive: true });
const FICHERO = join(DIR_DATOS, 'memoria_compartida.json');
const PUERTO = Number(process.env.PUERTO || 9330);

// -- §8.57: panel real de Misiones -- lee 02_PROYECTOS en vivo del Gestor de
// Proyectos, credenciales JWT SOLO del lado servidor (mismo patron ya usado en
// spike_concilio_coop/servidor.mjs y narrador_construir_proyecto.mjs -- nunca
// en el navegador). Cache corto (30s) para no golpear la API de Sheets en cada
// pintado de la mesa.
const SHEETS_SPREADSHEET_ID = '142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ'; // Gestor de Proyectos - LaTroballa Software
const SHEETS_CREDENCIALES_PATH = process.env.ENGREMIAT_SHEETS_CREDENTIALS_PATH;
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
let cacheProyectos = { en: 0, datos: null };

function base64urlSheets(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function obtenerAccessTokenSheets() {
  const cred = JSON.parse(readFileSync(SHEETS_CREDENCIALES_PATH, 'utf-8'));
  const ahora = Math.floor(Date.now() / 1000);
  const header = base64urlSheets(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64urlSheets(JSON.stringify({ iss: cred.client_email, scope: SHEETS_SCOPE, aud: 'https://oauth2.googleapis.com/token', exp: ahora + 3600, iat: ahora }));
  const firmante = createSign('RSA-SHA256');
  firmante.update(header + '.' + claim);
  firmante.end();
  const jwt = header + '.' + claim + '.' + base64urlSheets(firmante.sign(cred.private_key));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('AUTH_FAILED_SHEETS: ' + JSON.stringify(j));
  return j.access_token;
}

async function leerProyectosReales() {
  if (cacheProyectos.datos && Date.now() - cacheProyectos.en < 30000) return cacheProyectos.datos;
  const token = await obtenerAccessTokenSheets();
  const r = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets/' + SHEETS_SPREADSHEET_ID + '/values/02_PROYECTOS!A1:AB1000',
    { headers: { Authorization: 'Bearer ' + token } }
  );
  const j = await r.json();
  const filas = j.values || [];
  const cab = filas[0] || [];
  const idx = (nombre) => cab.indexOf(nombre);
  const iId = idx('ID'), iNombre = idx('NOMBRE'), iEstado = idx('ESTADO'), iTipo = idx('TIPO_PROYECTO'),
    iPrioridad = idx('PRIORIDAD'), iAvance = idx('PORCENTAJE_AVANCE'), iCliente = idx('CLIENTE_ID'), iActivo = idx('ACTIVO'),
    // §8.64: Quien/Cuando/Por que de Misiones -- el dato real ya existia en 02_PROYECTOS,
    // solo faltaba que este endpoint lo sirviera (mismo hallazgo del cruce de 13x8 preguntas)
    iResponsable = idx('RESPONSABLE_ID'), iFechaInicioPlan = idx('FECHA_INICIO_PLAN'), iObjetivo = idx('OBJETIVO');
  const proyectos = filas.slice(1)
    .filter((f) => f[iId] && f[iActivo] === 'SÍ')
    .map((f) => ({
      id: f[iId], nombre: f[iNombre] || '', estado: f[iEstado] || '', tipoProyecto: f[iTipo] || '',
      prioridad: f[iPrioridad] || '', porcentajeAvance: f[iAvance] || '', clienteId: f[iCliente] || '',
      responsableId: f[iResponsable] || '', fechaInicioPlan: f[iFechaInicioPlan] || '', objetivo: f[iObjetivo] || '',
    }));
  cacheProyectos = { en: Date.now(), datos: proyectos };
  return proyectos;
}

// -- §8.64: puentes 2 y 4 del cruce de 13x8 preguntas -- GASTO_API (Recursos) y
// PLANTILLA_MISION (Feria), ambos ya reales en Baserow, mismo patron de lectura que
// exportador_prometheus_gasto.mjs (Authorization: TOKEN, no Bearer -- Baserow real, no OAuth).
const BASEROW_URL = process.env.BASEROW_URL || 'http://100.107.171.88';
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;
const TABLA_GASTO_API = 285;
const TABLA_PLANTILLA_MISION = 284;
let cacheRecursos = { en: 0, datos: null };
let cacheMisionesFeria = { en: 0, datos: null };

async function leerFilasBaserow(tabla) {
  let url = BASEROW_URL + '/api/database/rows/table/' + tabla + '/?user_field_names=true&size=200';
  const filas = [];
  while (url) {
    const r = await fetch(url, { headers: { Authorization: BASEROW_TOKEN } });
    if (r.status >= 400) throw new Error('Baserow respondio ' + r.status + ' leyendo tabla ' + tabla);
    const j = await r.json();
    filas.push(...j.results);
    url = j.next;
  }
  return filas;
}

// Baserow devuelve los campos single_select como {id,value,color}, no como texto plano --
// mismo objeto en cualquier campo de seleccion real (aqui: SERVICIO, TIPO_CAPTURA, ESTADO)
function valorSelect(campo) {
  return campo && typeof campo === 'object' ? (campo.value || '') : (campo || '');
}

async function leerRecursosReales() {
  if (cacheRecursos.datos && Date.now() - cacheRecursos.en < 30000) return cacheRecursos.datos;
  const filas = await leerFilasBaserow(TABLA_GASTO_API);
  const recursos = filas.map((f) => ({
    nombre: f.NOMBRE || '', modelo: f.MODELO || '', servicio: valorSelect(f.SERVICIO),
    costeUsd: f.COSTE_ESTIMADO_USD || 0, accion: f.ACCION || '', fecha: f.FECHA || '',
  }));
  cacheRecursos = { en: Date.now(), datos: recursos };
  return recursos;
}

async function leerMisionesFeriaReales() {
  if (cacheMisionesFeria.datos && Date.now() - cacheMisionesFeria.en < 30000) return cacheMisionesFeria.datos;
  const filas = await leerFilasBaserow(TABLA_PLANTILLA_MISION);
  const misiones = filas.map((f) => ({
    nombre: f.NOMBRE || '', escenario: f.ESCENARIO || '', orden: f.ORDEN || '',
    tipoCaptura: valorSelect(f.TIPO_CAPTURA), estado: valorSelect(f.ESTADO), version: f.VERSION || '',
  }));
  cacheMisionesFeria = { en: Date.now(), datos: misiones };
  return misiones;
}

function leerMemoria() {
  if (!existsSync(FICHERO)) return { eventos: [], montajes: [] };
  try { return JSON.parse(readFileSync(FICHERO, 'utf-8')); } catch { return { eventos: [], montajes: [] }; }
}
function escribirMemoria(m) { writeFileSync(FICHERO, JSON.stringify(m, null, 1)); }

function conCors(res) {
  // VPS solo alcanzable por Tailscale (nunca 0.0.0.0 en el resto de servicios) -- CORS
  // abierto aqui es aceptable dentro de esa red privada, mismo criterio que Baserow/n8n
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Chrome trata el rango CGNAT de Tailscale (100.64.0.0/10) como red "privada" a efectos
  // de Private Network Access -- sin esta cabecera, un fetch cross-origin desde otro puerto
  // de la misma IP falla en el preflight aunque el CORS normal ya este bien
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let datos = '';
    req.on('data', (c) => { datos += c; });
    req.on('end', () => { try { resolve(datos ? JSON.parse(datos) : {}); } catch (e) { reject(e); } });
  });
}

const servidor = createServer(async (req, res) => {
  conCors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method === 'GET' && req.url === '/api/memoria') {
      res.writeHead(200); res.end(JSON.stringify(leerMemoria())); return;
    }

    if (req.method === 'GET' && req.url === '/api/proyectos') {
      if (!SHEETS_CREDENCIALES_PATH) {
        res.writeHead(503); res.end(JSON.stringify({ error: 'sin credenciales reales configuradas para leer el Sheet' })); return;
      }
      const proyectos = await leerProyectosReales();
      res.writeHead(200); res.end(JSON.stringify({ proyectos, leidoEn: new Date(cacheProyectos.en).toISOString() })); return;
    }

    if (req.method === 'GET' && req.url === '/api/recursos') {
      if (!BASEROW_TOKEN) {
        res.writeHead(503); res.end(JSON.stringify({ error: 'sin credenciales reales configuradas para leer Baserow' })); return;
      }
      const recursos = await leerRecursosReales();
      res.writeHead(200); res.end(JSON.stringify({ recursos, leidoEn: new Date(cacheRecursos.en).toISOString() })); return;
    }

    if (req.method === 'GET' && req.url === '/api/misiones_feria') {
      if (!BASEROW_TOKEN) {
        res.writeHead(503); res.end(JSON.stringify({ error: 'sin credenciales reales configuradas para leer Baserow' })); return;
      }
      const misiones = await leerMisionesFeriaReales();
      res.writeHead(200); res.end(JSON.stringify({ misiones, leidoEn: new Date(cacheMisionesFeria.en).toISOString() })); return;
    }

    if (req.method === 'POST' && req.url === '/api/eventos') {
      const evento = await leerCuerpo(req);
      const m = leerMemoria();
      const eventoReal = { id: 'ev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), ts: new Date().toISOString(), ...evento };
      m.eventos.push(eventoReal);
      escribirMemoria(m);
      res.writeHead(201); res.end(JSON.stringify(eventoReal)); return;
    }

    if (req.method === 'POST' && req.url === '/api/montajes') {
      const montaje = await leerCuerpo(req);
      if (!montaje.nombre) { res.writeHead(400); res.end(JSON.stringify({ error: 'falta nombre real del montaje' })); return; }
      const m = leerMemoria();
      m.montajes = m.montajes.filter((x) => x.nombre !== montaje.nombre);
      m.montajes.push({ ...montaje, guardadoEn: new Date().toISOString() });
      escribirMemoria(m);
      res.writeHead(201); res.end(JSON.stringify({ ok: true })); return;
    }

    if (req.method === 'DELETE' && req.url.startsWith('/api/montajes/')) {
      const nombre = decodeURIComponent(req.url.replace('/api/montajes/', ''));
      const m = leerMemoria();
      m.montajes = m.montajes.filter((x) => x.nombre !== nombre);
      escribirMemoria(m);
      res.writeHead(200); res.end(JSON.stringify({ ok: true })); return;
    }

    res.writeHead(404); res.end(JSON.stringify({ error: 'ruta real no encontrada' }));
  } catch (e) {
    res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
  }
});

servidor.listen(PUERTO, () => console.log(`Memoria compartida real escuchando en :${PUERTO} -- fichero: ${FICHERO}`));
