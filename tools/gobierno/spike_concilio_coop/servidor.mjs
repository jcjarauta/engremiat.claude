import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createSign } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Spike real v3: lobby de seleccion de personaje. El operador elige de
// verdad cual de los Acervos deliberantes de Concilio encarna (hasta
// MAX_HUMANOS a la vez) -- no hay 2 asientos fijos. Los que nadie elige
// los lleva DeepSeek, con la misma voz que ya tiene en el vault.
//
// El roster ya NO vive hardcodeado aqui -- se construye en real desde
// personajes.json (generado por generar_dialogos.mjs directamente de
// 02_Personajes/ del vault, "un solo motor, dos pieles"). Un Acervo entra
// al roster si su propio dialogo real no dice "no delibera" -- asi
// Acervo Prompter (trabaja antes, formula la pregunta) y Narrador (todavia
// por_construir, y su propia ficha dice explicitamente que no delibera en
// Concilio -- "acompana... narra", no vota) quedan fuera sin necesidad de
// una lista de exclusion mantenida a mano que se puede desincronizar del
// vault real. Sala COMPARTIDA de verdad para todos los conectados, elijan
// ya su asiento o sigan en el lobby.

const PUERTO = Number(process.env.PUERTO || 2567);
const MAX_HUMANOS = 2;

function cargarRosterReal() {
  const personajes = JSON.parse(readFileSync(join(__dirname, 'personajes.json'), 'utf-8')).personajes;
  const roster = {};
  for (const p of personajes) {
    if (!p.id.startsWith('Acervo ')) continue; // solo los Acervos son asiento real de Concilio
    if (/no delibera/i.test(p.dialogo)) continue; // la propia ficha dice que no vota aqui (Prompter)
    roster[p.id] = p.dialogo + '\n\nResponde siempre desde ahi, en 2-3 frases, en primera persona.';
  }
  return roster;
}

const ROSTER = cargarRosterReal();
const NOMBRES_ROSTER = Object.keys(ROSTER);

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY || readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.deepseek_key', 'utf-8').trim();
const BASE_BASEROW = process.env.BASEROW_URL || 'http://100.107.171.88';
const TOKEN_BASEROW = process.env.BASEROW_TOKEN;
const TABLA_GASTO_API = 285;
const PRECIO = { entrada: 0.44, salida: 1.32 };

async function pedirRespuestaAcervo(nombreAcervo, systemPrompt, transcripcion) {
  const r = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + DEEPSEEK_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Eres ' + nombreAcervo + ', un Acervo real del Concilio de Engremiat. ' + systemPrompt },
        { role: 'user', content: 'Transcripcion de la deliberacion hasta ahora (varios humanos y Acervos participan):\n\n' + transcripcion + '\n\nResponde tu, ' + nombreAcervo + ', ahora.' }
      ],
      temperature: 0.5
    })
  });
  const j = await r.json();
  if (!j.choices) throw new Error('DEEPSEEK_ERROR: ' + JSON.stringify(j));
  const usage = j.usage || {};
  const coste = ((usage.prompt_tokens || 0) / 1e6) * PRECIO.entrada + ((usage.completion_tokens || 0) / 1e6) * PRECIO.salida;
  return { texto: j.choices[0].message.content.trim(), coste };
}

// --- Cierre de ciclo: deja huella real en 92_BUS_TRABAJO (mismo esquema
// de columnas que tools/gobierno/bus_trabajo.mjs -- este spike no inventa
// un formato propio, escribe en el mismo bus que usan los workers reales) ---
const SHEETS_SPREADSHEET_ID = '142vRqXfDj4C7KyY7TVf5Oh18gwtDcvAkYxFQ0lb6CGQ'; // Gestor de Proyectos - LaTroballa Software
const SHEETS_PESTANA_BUS = '92_BUS_TRABAJO';
const SHEETS_CREDENCIALES_PATH = process.env.ENGREMIAT_SHEETS_CREDENTIALS_PATH;
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

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

async function anadirFilaBus(fila) {
  const token = await obtenerAccessTokenSheets();
  const r = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets/' + SHEETS_SPREADSHEET_ID + '/values/' + encodeURIComponent(SHEETS_PESTANA_BUS) +
    ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS',
    { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ values: [fila] }) }
  );
  if (r.status >= 400) throw new Error('ERROR escribiendo en 92_BUS_TRABAJO: ' + r.status + ' ' + await r.text());
}

async function cerrarCicloReal() {
  const idTarea = 'SPK-' + Date.now();
  const humanos = humanosSentados().map(c => c.asiento);
  const duracionSegundos = Math.round((Date.now() - sala.cicloInicio) / 1000);
  const primeraPropuesta = sala.mensajes.find(m => !m.esIA);
  const resumen = 'Ciclo Spike Concilio cooperativo -- ' + sala.mensajes.length + ' intervencion(es), ' +
    humanos.length + ' asiento(s) humano(s): ' + humanos.join(', ') + '. ' +
    (primeraPropuesta ? 'Propuesta de partida: "' + primeraPropuesta.texto + '". ' : '') +
    'Coste real del ciclo: $' + sala.costeCicloUsd.toFixed(6) + '.';

  const fila = [
    idTarea, '', 'spike_concilio_coop', '', 'ciclo_cerrado_spike',
    humanos.join(', '), new Date(sala.cicloInicio).toISOString(), '', '',
    duracionSegundos, '', '', resumen
  ];
  await anadirFilaBus(fila);
  return { idTarea, resumen };
}

async function registrarGastoReal(nombreAcervo, coste) {
  if (!TOKEN_BASEROW) return;
  try {
    await fetch(BASE_BASEROW + '/api/database/rows/table/' + TABLA_GASTO_API + '/?user_field_names=true', {
      method: 'POST', headers: { Authorization: TOKEN_BASEROW, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        NOMBRE: 'spike_concilio_coop_' + nombreAcervo, MODELO: 'deepseek-chat', SERVICIO: 'deepseek',
        COSTE_ESTIMADO_USD: Number(coste.toFixed(6)), ACCION: 'deliberacion_coop_v2', CONTEXTO: nombreAcervo,
        FECHA: new Date().toISOString().slice(0, 10)
      })
    });
  } catch (e) { console.log('AVISO: no se pudo registrar gasto real -- ' + e.message); }
}

// --- Sala compartida real, un unico estado para todos los conectados ---
const sala = {
  mensajes: [],
  deliberando: false,
  cerrandoCiclo: false,
  costeTotalUsd: 0,
  costeCicloUsd: 0,
  cicloInicio: Date.now(),
  conexiones: new Map() // ws -> { asiento: nombreAcervo|null }
};

function humanosSentados() {
  return [...sala.conexiones.values()].filter(c => c.asiento);
}

function estadoLobby() {
  const ocupados = new Set(humanosSentados().map(c => c.asiento));
  return NOMBRES_ROSTER.map(nombre => ({ nombre, libre: !ocupados.has(nombre) }));
}

function difundir(mensajeObjeto) {
  for (const ws of sala.conexiones.keys()) {
    if (ws.readyState === 1) ws.send(JSON.stringify(mensajeObjeto));
  }
}

function difundirLobby() {
  difundir({ tipo: 'lobby', roster: estadoLobby(), maxHumanos: MAX_HUMANOS, humanosSentados: humanosSentados().length });
}

function agregarMensaje(autor, texto, esIA) {
  const m = { autor, texto, esIA };
  sala.mensajes.push(m);
  difundir({ tipo: 'mensaje', ...m });
}

async function deliberar() {
  sala.deliberando = true;
  difundir({ tipo: 'estado', deliberando: true });

  const asientosHumanos = new Set(humanosSentados().map(c => c.asiento));
  for (const nombre of NOMBRES_ROSTER) {
    if (asientosHumanos.has(nombre)) continue; // este Acervo lo lleva un humano, no la IA
    const systemPrompt = ROSTER[nombre];
    const transcripcion = sala.mensajes.map(m => m.autor + ': ' + m.texto).join('\n');
    try {
      const r = await pedirRespuestaAcervo(nombre, systemPrompt, transcripcion);
      agregarMensaje(nombre, r.texto, true);
      sala.costeTotalUsd += r.coste;
      sala.costeCicloUsd += r.coste;
      difundir({ tipo: 'coste', costeTotalUsd: sala.costeTotalUsd });
      await registrarGastoReal(nombre, r.coste);
    } catch (e) {
      agregarMensaje(nombre, '(fallo real: ' + e.message + ')', true);
    }
  }

  sala.deliberando = false;
  difundir({ tipo: 'estado', deliberando: false });
}

const httpServer = createServer((req, res) => {
  if (req.url === '/salud') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, spike: 'concilio_coop_v3', humanos: humanosSentados().length, maxHumanos: MAX_HUMANOS }));
    return;
  }
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(readFileSync(join(__dirname, 'publico', 'index.html')));
    return;
  }
  res.writeHead(404); res.end();
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  sala.conexiones.set(ws, { asiento: null });
  ws.send(JSON.stringify({
    tipo: 'lobby', roster: estadoLobby(), maxHumanos: MAX_HUMANOS,
    humanosSentados: humanosSentados().length, mensajes: sala.mensajes
  }));

  ws.on('message', async (data) => {
    let payload;
    try { payload = JSON.parse(data.toString()); } catch { return; }
    const conn = sala.conexiones.get(ws);
    if (!conn) return;

    if (payload.tipo === 'elegir_personaje') {
      if (conn.asiento) return; // ya sentado, ignora una segunda eleccion
      const nombre = String(payload.nombre || '');
      if (!NOMBRES_ROSTER.includes(nombre)) {
        ws.send(JSON.stringify({ tipo: 'sistema', texto: 'Ese personaje no existe en el roster de Concilio.' }));
        return;
      }
      if (humanosSentados().length >= MAX_HUMANOS) {
        ws.send(JSON.stringify({ tipo: 'sistema', texto: 'Sala llena -- ' + MAX_HUMANOS + ' asientos humanos ya ocupados.' }));
        return;
      }
      if (!estadoLobby().find(r => r.nombre === nombre).libre) {
        ws.send(JSON.stringify({ tipo: 'sistema', texto: nombre + ' ya esta ocupado por otro humano.' }));
        return;
      }
      conn.asiento = nombre;
      ws.send(JSON.stringify({ tipo: 'bienvenida', acervo: nombre, mensajes: sala.mensajes, humanosConectados: humanosSentados().length }));
      difundir({ tipo: 'sistema', texto: 'Se une ' + nombre + ' (' + humanosSentados().length + '/' + MAX_HUMANOS + ' asientos humanos).' });
      difundirLobby();
      return;
    }

    if (payload.tipo === 'cerrar_ciclo') {
      if (sala.deliberando || sala.cerrandoCiclo || sala.mensajes.length === 0) return;
      sala.cerrandoCiclo = true;
      try {
        const { idTarea, resumen } = await cerrarCicloReal();
        difundir({ tipo: 'ciclo_cerrado', idTarea, resumen });
        sala.mensajes = [];
        sala.costeCicloUsd = 0;
        sala.cicloInicio = Date.now();
        difundir({ tipo: 'sistema', texto: 'Nuevo ciclo abierto.' });
      } catch (e) {
        ws.send(JSON.stringify({ tipo: 'sistema', texto: 'No se pudo cerrar el ciclo: ' + e.message }));
      } finally {
        sala.cerrandoCiclo = false;
      }
      return;
    }

    if (!conn.asiento) return; // sin personaje elegido, no puede proponer
    if (sala.deliberando) return;
    if (payload.tipo !== 'proponer') return;
    const texto = String(payload.texto || '').slice(0, 500);
    if (!texto) return;
    agregarMensaje(conn.asiento + ' (humano)', texto, false);
    await deliberar();
  });

  ws.on('close', () => {
    const conn = sala.conexiones.get(ws);
    sala.conexiones.delete(ws);
    if (conn && conn.asiento) {
      difundir({ tipo: 'sistema', texto: conn.asiento + ' se desconecto.' });
      difundirLobby();
    }
  });
});

httpServer.listen(PUERTO, () => {
  console.log('Spike Concilio cooperativo v3 (lobby de ' + NOMBRES_ROSTER.length + ' Acervos, ' + MAX_HUMANOS + ' asientos humanos) escuchando en :' + PUERTO);
});
