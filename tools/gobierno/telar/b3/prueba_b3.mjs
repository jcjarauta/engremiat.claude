#!/usr/bin/env node
/*
 * Prueba real de B3 contra el servidor real (no una simulacion de la prueba).
 * Exige que servidor_b3.mjs este corriendo ya (node servidor_b3.mjs).
 *
 * Cubre las reglas que de verdad importan del diseno (PROPUESTA_TELAR_...md):
 *   - Aprobar nunca ejecuta (decision_aprobar no toca el fichero).
 *   - La autorizacion queda invalida si la Mision cambia despues de inspeccionarla (§8).
 *   - Idempotencia real: reenviar el mismo clientEventId no repite el efecto.
 *   - Concurrencia optimista real: version desactualizada se rechaza.
 *   - Verificar relee de disco, no asume que la escritura funciono.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:' + (process.env.PUERTO || 4320);
const RUTA_DESTINO = join(__dirname, 'destino_prueba', 'docker-compose-simulado.yml');

let idEvento = 0;
function nuevoId() { return 'test-evt-' + (++idEvento) + '-' + Date.now(); }

async function evento(accion, expectedMissionVersion, extra, clientEventIdForzado) {
  const payload = { missionId: 'FIX-MISION-001', expectedMissionVersion, clientEventId: clientEventIdForzado || nuevoId(), correlationId: 'corr-test', accion, ...extra };
  const r = await fetch(BASE + '/evento', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  return { status: r.status, cuerpo: await r.json(), payloadEnviado: payload };
}

// Solo avanza el contador de version local si la llamada tuvo exito real --
// una llamada rechazada NUNCA cambia el estado del servidor, y el cliente no
// debe fingir que si. (Este fue justo el bug real del primer intento de esta
// misma prueba: seguia leyendo .missionVersion aunque la respuesta anterior
// hubiera sido un 422, arrastrando `undefined`/NaN al resto del guion.)
function siguienteVersion(vActual, r) {
  return r.status === 200 ? r.cuerpo.missionVersion : vActual;
}

let fallos = 0;
function assert(cond, etiqueta, detalle) {
  if (cond) { console.log('OK   ' + etiqueta); }
  else { fallos++; console.log('FAIL ' + etiqueta + (detalle ? ' -- ' + JSON.stringify(detalle) : '')); }
}

async function leerDestino() { return readFileSync(RUTA_DESTINO, 'utf-8'); }

async function main() {
  console.log('=== Prueba real B3 ===\n');

  var mision = await (await fetch(BASE + '/mision')).json();
  assert(mision.missionVersion === 1 && mision.missionStatus === 'tejiendo', 'estado inicial limpio (v1, tejiendo)', mision);
  var v = mision.missionVersion;

  var r1 = await evento('tejer', v, { hiloId: 'c0-hecho-0' });
  assert(r1.status === 200 && r1.cuerpo.resultadoAccion.hilosIncorporados === 1, 'tejer incorpora un hilo', r1);
  v = siguienteVersion(v, r1);

  var destinoAntesDeAprobar = await leerDestino();
  var r2 = await evento('decision_aprobar', v);
  assert(r2.status === 200 && r2.cuerpo.resultadoAccion.puerta.estado === 'PROPUESTA', 'decision_aprobar mueve la Puerta a PROPUESTA', r2);
  v = siguienteVersion(v, r2);
  assert(destinoAntesDeAprobar === (await leerDestino()), 'aprobar NO ejecuta -- el fichero de destino no cambio');

  var r3 = await evento('ejecucion_autorizar', v);
  assert(r3.status === 200 && r3.cuerpo.resultadoAccion.puerta.estado === 'APROBADA_NO_EJECUTADA', 'ejecucion_autorizar mueve la Puerta a APROBADA_NO_EJECUTADA', r3);
  var versionAutorizada = r3.status === 200 ? r3.cuerpo.resultadoAccion.puerta.versionInspeccionada : null;
  v = siguienteVersion(v, r3);

  var r4 = await evento('tejer', v, { hiloId: 'otro-hilo-tardio' });
  assert(r4.status === 200, 'la Mision cambia despues de la autorizacion (tejer tardio)', r4);
  v = siguienteVersion(v, r4);

  var r5 = await evento('ejecucion_iniciar', v, { versionInspeccionada: versionAutorizada });
  assert(r5.status === 422 && /AUTORIZACION_INVALIDA/.test(r5.cuerpo.error || ''), 'ejecucion_iniciar RECHAZA una autorizacion obsoleta', r5);
  v = siguienteVersion(v, r5);
  assert((await leerDestino()) === destinoAntesDeAprobar, 'el rechazo NO escribio nada en el destino de prueba');

  var r6 = await evento('ejecucion_autorizar', v);
  assert(r6.status === 200, 're-autorizar tras el cambio funciona', r6);
  var nuevaVersionAutorizada = r6.status === 200 ? r6.cuerpo.resultadoAccion.puerta.versionInspeccionada : null;
  v = siguienteVersion(v, r6);

  var idIniciar = nuevoId();
  var r7 = await evento('ejecucion_iniciar', v, { versionInspeccionada: nuevaVersionAutorizada }, idIniciar);
  assert(r7.status === 200 && r7.cuerpo.resultadoAccion.escrito === true, 'ejecucion_iniciar ESCRIBE de verdad en el destino de prueba', r7);
  v = siguienteVersion(v, r7);
  var destinoTrasEjecutar = await leerDestino();
  assert(destinoTrasEjecutar.includes('npm ci --omit=dev'), 'el fichero de destino contiene npm ci de verdad (releido de disco)');

  // Idempotencia real: reenviar el MISMO clientEventId Y la MISMA
  // expectedMissionVersion ya usada la primera vez (ahora obsoleta) -- debe
  // devolver el resultado cacheado, no un 409 de version desactualizada.
  var contenidoAntesReenvio = await leerDestino();
  var r8 = await evento('ejecucion_iniciar', v - 1, { versionInspeccionada: nuevaVersionAutorizada }, idIniciar);
  assert(r8.status === 200 && r8.cuerpo.repetido === true, 'reenviar el mismo clientEventId devuelve el resultado cacheado (idempotencia real)', r8);
  assert(contenidoAntesReenvio === (await leerDestino()), 'el reenvio NO volvio a escribir el fichero');

  var r9 = await evento('ejecucion_verificar', 1);
  assert(r9.status === 409 && r9.cuerpo.error === 'VERSION_DESACTUALIZADA' && r9.cuerpo.versionActual === v, 'version desactualizada se rechaza con la version real reportada (' + v + ')', r9);

  var r10 = await evento('ejecucion_verificar', v);
  assert(r10.status === 200 && r10.cuerpo.resultadoAccion.puerta.estado === 'EJECUTADA_VERIFICADA', 'ejecucion_verificar confirma EJECUTADA_VERIFICADA releyendo el fichero', r10);
  v = siguienteVersion(v, r10);

  // 7 eventos aceptados de verdad: tejer, decision_aprobar, ejecucion_autorizar,
  // tejer(tardio), ejecucion_autorizar(re-auth), ejecucion_iniciar, ejecucion_verificar.
  // El intento rechazado (autorizacion obsoleta) y el reenvio idempotente NO
  // generan una entrada nueva -- eso es correcto, no un fallo.
  var auditoria = await (await fetch(BASE + '/auditoria')).json();
  assert(auditoria.length === 7 && auditoria.every(a => a.actor && a.timestamp), 'la auditoria tiene ' + auditoria.length + ' entradas reales con actor y timestamp del servidor');

  console.log('\n=== Resultado ===');
  if (fallos === 0) console.log('GATE B3: APROBADO -- ' + auditoria.length + ' eventos reales procesados, 0 fallos.');
  else { console.log('GATE B3: NO APROBADO -- ' + fallos + ' fallo(s) real(es) arriba.'); process.exitCode = 1; }
}

main().catch((e) => { console.error('ERROR', e); process.exitCode = 1; });
