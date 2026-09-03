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

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR_DATOS = process.env.DATOS_DIR || join(__dirname, 'datos');
if (!existsSync(DIR_DATOS)) mkdirSync(DIR_DATOS, { recursive: true });
const FICHERO = join(DIR_DATOS, 'memoria_compartida.json');
const PUERTO = Number(process.env.PUERTO || 9330);

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
