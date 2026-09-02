#!/usr/bin/env node
/*
 * Fase B3 de Telar -- registro controlado y Puerta Humana real.
 * Ver PROPUESTA_TELAR_INTERFAZ_OPERATIVA.md §16: "registrar resultado en destino
 * de prueba; separar aprobar de ejecutar; idempotencia y recuperacion; Huella
 * basada en comprobacion posterior."
 *
 * Real de verdad: estado de la Mision con missionVersion (concurrencia
 * optimista real), idempotencia real por clientEventId, y una Puerta Humana
 * que escribe y LUEGO relee de verdad un fichero -- nunca asume que la
 * escritura funciono. El destino es SIEMPRE b3/destino_prueba/, jamas el
 * docker-compose.yml real del VPS.
 *
 * Uso: node servidor_b3.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR_TELAR = join(__dirname, '..');
const RUTA_FIXTURE = join(DIR_TELAR, 'fixtures', '03_tejiendo.json');
const RUTA_DESTINO_PRUEBA = join(__dirname, 'destino_prueba', 'docker-compose-simulado.yml');
const RUTA_AUDITORIA = join(__dirname, 'auditoria.json');
const PUERTO = Number(process.env.PUERTO || 4320);

const ajv = new Ajv2020({ allErrors: true, strict: false });
for (const n of readdirSync(join(DIR_TELAR, 'schemas'))) ajv.addSchema(JSON.parse(readFileSync(join(DIR_TELAR, 'schemas', n), 'utf-8')));
const validarEvento = ajv.getSchema('https://engremiat.local/telar/evento.schema.json');

function cargarMisionInicial() {
  const fx = JSON.parse(readFileSync(RUTA_FIXTURE, 'utf-8'));
  return { ...fx, missionVersion: 1, missionStatus: 'tejiendo', resultado: null, puerta: null, decision_humana: 'pendiente', consecuencia_verificada: null };
}

const sala = { mision: cargarMisionInicial(), eventosProcesados: new Map(), auditoria: [] };

function registrarAuditoria(entrada) {
  const real = { ...entrada, actor: 'visitante-01', timestamp: new Date().toISOString() }; // identidad y hora: SIEMPRE del servidor, nunca del cliente
  sala.auditoria.push(real);
  writeFileSync(RUTA_AUDITORIA, JSON.stringify(sala.auditoria, null, 2), 'utf-8');
  return real;
}

function ejecutarAccion(payload) {
  const m = sala.mision;
  switch (payload.accion) {
    case 'tejer': {
      if (!m.resultado) m.resultado = { hilosIncorporados: [], hilosDescartados: [] };
      m.resultado.hilosIncorporados.push(payload.hiloId);
      return { hilosIncorporados: m.resultado.hilosIncorporados.length };
    }
    case 'decision_aprobar': {
      if (!['tejiendo', 'esperando_relevo'].includes(m.missionStatus)) throw new Error('ESTADO_INVALIDO_PARA_APROBAR: ' + m.missionStatus);
      m.decision_humana = 'aprobar';
      m.missionStatus = 'aprobada_sin_ejecutar';
      m.puerta = { estado: 'PROPUESTA', efecto: 'Cambia npm install por npm ci en el destino de prueba', destino: 'b3/destino_prueba/docker-compose-simulado.yml', reversible: true, nivelRiesgo: 'bajo_reversible' };
      return { puerta: m.puerta };
    }
    case 'ejecucion_autorizar': {
      // Re-autorizar (refrescar la version inspeccionada) esta siempre permitido
      // desde PROPUESTA o desde una autorizacion ya dada -- es como el paper lo
      // describe (§17.3: autorizacion invalida "vuelve a ejecucion_autorizar",
      // no exige pasar antes por un PROPUESTA nuevo).
      if (!m.puerta || !['PROPUESTA', 'APROBADA_NO_EJECUTADA'].includes(m.puerta.estado)) throw new Error('PUERTA_NO_AUTORIZABLE: estado actual ' + (m.puerta && m.puerta.estado));
      m.puerta.estado = 'APROBADA_NO_EJECUTADA';
      // OJO: procesarEvento incrementa missionVersion DESPUES de esta funcion,
      // para CUALQUIER evento aceptado -- incluido este mismo. Si guardaramos
      // m.missionVersion tal cual (el valor de ANTES de ese incremento), la
      // comprobacion de mas abajo nunca podria coincidir ni siquiera sin
      // ningun cambio real de por medio (bug real encontrado en la primera
      // prueba de B3). La version que de verdad se autoriza es la que la
      // Mision TENDRA justo despues de este evento: missionVersion + 1.
      m.puerta.versionInspeccionada = m.missionVersion + 1;
      m.missionStatus = 'puerta_pendiente';
      return { puerta: m.puerta };
    }
    case 'ejecucion_iniciar': {
      if (!m.puerta || m.puerta.estado !== 'APROBADA_NO_EJECUTADA') throw new Error('PUERTA_NO_AUTORIZADA: estado actual ' + (m.puerta && m.puerta.estado));
      if (payload.versionInspeccionada !== m.puerta.versionInspeccionada) throw new Error('AUTORIZACION_INVALIDA: version inspeccionada no coincide con la autorizada -- vuelve a autorizar');
      if (m.missionVersion !== m.puerta.versionInspeccionada) throw new Error('AUTORIZACION_INVALIDA: la Mision cambio despues de inspeccionarla (v' + m.puerta.versionInspeccionada + ' -> v' + m.missionVersion + ') -- vuelve a autorizar');
      // ESCRITURA REAL, solo en el destino de prueba, nunca en produccion
      const antes = readFileSync(RUTA_DESTINO_PRUEBA, 'utf-8');
      const despues = antes.replace('npm install --omit=dev', 'npm ci --omit=dev');
      writeFileSync(RUTA_DESTINO_PRUEBA, despues, 'utf-8');
      m.puerta.estado = 'EJECUCION_EN_CURSO';
      m.missionStatus = 'puerta_en_curso';
      return { escrito: antes !== despues };
    }
    case 'ejecucion_verificar': {
      if (!m.puerta || m.puerta.estado !== 'EJECUCION_EN_CURSO') throw new Error('NADA_QUE_VERIFICAR: estado actual ' + (m.puerta && m.puerta.estado));
      // LECTURA REAL de vuelta -- nunca se asume que la escritura funciono
      const contenido = readFileSync(RUTA_DESTINO_PRUEBA, 'utf-8');
      const ok = contenido.includes('npm ci --omit=dev');
      m.puerta.estado = ok ? 'EJECUTADA_VERIFICADA' : 'WARN';
      m.missionStatus = 'huella';
      m.consecuencia_verificada = ok
        ? 'destino_prueba/docker-compose-simulado.yml confirmado con npm ci --omit=dev (releido de disco, no asumido)'
        : 'La escritura no se pudo verificar releyendo el fichero -- revisar manualmente';
      return { puerta: m.puerta, consecuencia_verificada: m.consecuencia_verificada };
    }
    case 'ejecucion_cancelar': {
      if (m.puerta) m.puerta.estado = 'PROPUESTA';
      m.missionStatus = 'aprobada_sin_ejecutar';
      return { puerta: m.puerta };
    }
    default:
      throw new Error('ACCION_NO_SOPORTADA_EN_B3: ' + payload.accion);
  }
}

function procesarEvento(payload) {
  if (!validarEvento(payload)) return { status: 400, cuerpo: { error: 'EVENTO_INVALIDO', detalle: validarEvento.errors } };

  // Idempotencia: SIEMPRE antes que la comprobacion de version -- un reenvio de
  // red del mismo evento nunca debe verse como "version desactualizada".
  if (sala.eventosProcesados.has(payload.clientEventId)) {
    return { status: 200, cuerpo: { ...sala.eventosProcesados.get(payload.clientEventId), repetido: true } };
  }

  if (payload.expectedMissionVersion !== sala.mision.missionVersion) {
    return { status: 409, cuerpo: { error: 'VERSION_DESACTUALIZADA', versionActual: sala.mision.missionVersion, versionEsperada: payload.expectedMissionVersion } };
  }

  let resultadoAccion;
  try {
    resultadoAccion = ejecutarAccion(payload);
  } catch (e) {
    return { status: 422, cuerpo: { error: e.message } };
  }

  sala.mision.missionVersion++;
  const cuerpo = { ok: true, missionStatus: sala.mision.missionStatus, missionVersion: sala.mision.missionVersion, resultadoAccion };
  sala.eventosProcesados.set(payload.clientEventId, cuerpo);
  registrarAuditoria({ accion: payload.accion, clientEventId: payload.clientEventId, correlationId: payload.correlationId, resultadoAccion });
  return { status: 200, cuerpo };
}

const httpServer = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/mision') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sala.mision));
    return;
  }
  if (req.method === 'GET' && req.url === '/auditoria') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sala.auditoria));
    return;
  }
  if (req.method === 'POST' && req.url === '/evento') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(body); } catch { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"JSON_INVALIDO"}'); return; }
      const r = procesarEvento(payload);
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(r.cuerpo));
    });
    return;
  }
  res.writeHead(404); res.end();
});

httpServer.listen(PUERTO, () => console.log('Telar B3 (registro controlado + Puerta Humana real) escuchando en :' + PUERTO));
