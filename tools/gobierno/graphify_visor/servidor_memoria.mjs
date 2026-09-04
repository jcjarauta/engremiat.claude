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

// -- §8.68: Misiones -> Como. El usuario corrigio el enfoque: no basta con enlazar al
// Sheet real (Gantt/Ficha) -- el jugador de Bastidor no tiene por que tener acceso al
// Sheet, hay que replicar la dinamica real sirviendo los datos. Cadena relacional real:
// 02_PROYECTOS -> 04_PROYECTO_PRODUCTO (PRODUCTO_ID) -> 05_PROCESOS (PRODUCTO_ID) ->
// 06_TAREAS (PROCESO_ID). Confirmado con datos reales antes de construir (13 procesos,
// 19+ tareas reales, no vacio como 12_DECISIONES).
let cacheProyectoProducto = { en: 0, datos: null };
let cacheProcesos = { en: 0, datos: null };
let cacheTareas = { en: 0, datos: null };

async function leerTablaSheetCacheada(nombreHoja, rangoColumnas, cache) {
  if (cache.datos && Date.now() - cache.en < 30000) return cache.datos;
  const token = await obtenerAccessTokenSheets();
  const r = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets/' + SHEETS_SPREADSHEET_ID + '/values/' + nombreHoja + '!' + rangoColumnas,
    { headers: { Authorization: 'Bearer ' + token } }
  );
  const j = await r.json();
  const filas = j.values || [];
  const cab = filas[0] || [];
  const datos = { cab, filas: filas.slice(1) };
  cache.en = Date.now(); cache.datos = datos;
  return datos;
}

async function leerProcesosTareasReales(proyectoId) {
  const [pp, procesos, tareas] = await Promise.all([
    leerTablaSheetCacheada('04_PROYECTO_PRODUCTO', 'A1:C1000', cacheProyectoProducto),
    leerTablaSheetCacheada('05_PROCESOS', 'A1:S1000', cacheProcesos),
    leerTablaSheetCacheada('06_TAREAS', 'A1:N1000', cacheTareas),
  ]);
  const iPPProyecto = pp.cab.indexOf('PROYECTO_ID'), iPPProducto = pp.cab.indexOf('PRODUCTO_ID');
  const productoIds = new Set(pp.filas.filter((f) => f[iPPProyecto] === proyectoId).map((f) => f[iPPProducto]));

  const iPcId = procesos.cab.indexOf('ID'), iPcProducto = procesos.cab.indexOf('PRODUCTO_ID'), iPcNombre = procesos.cab.indexOf('NOMBRE'),
    iPcOrden = procesos.cab.indexOf('ORDEN_SECUENCIA'), iPcEstado = procesos.cab.indexOf('ESTADO'), iPcAvance = procesos.cab.indexOf('PORCENTAJE_AVANCE'),
    iPcInicioPlan = procesos.cab.indexOf('FECHA_INICIO_PLAN'), iPcFinPlan = procesos.cab.indexOf('FECHA_FIN_PLAN');
  const procesosDelProyecto = procesos.filas.filter((f) => productoIds.has(f[iPcProducto]));

  const iTrProceso = tareas.cab.indexOf('PROCESO_ID'), iTrNombre = tareas.cab.indexOf('NOMBRE'), iTrOrden = tareas.cab.indexOf('ORDEN_SECUENCIA'),
    iTrEstado = tareas.cab.indexOf('ESTADO'), iTrAvance = tareas.cab.indexOf('PORCENTAJE_AVANCE'),
    iTrInicioPlan = tareas.cab.indexOf('FECHA_INICIO_PLAN'), iTrFinPlan = tareas.cab.indexOf('FECHA_FIN_PLAN');

  return procesosDelProyecto
    .map((f) => ({
      id: f[iPcId], nombre: f[iPcNombre] || '', ordenSecuencia: f[iPcOrden] || '', estado: f[iPcEstado] || '',
      porcentajeAvance: f[iPcAvance] || '', fechaInicioPlan: f[iPcInicioPlan] || '', fechaFinPlan: f[iPcFinPlan] || '',
      tareas: tareas.filas
        .filter((t) => t[iTrProceso] === f[iPcId])
        .map((t) => ({
          nombre: t[iTrNombre] || '', ordenSecuencia: t[iTrOrden] || '', estado: t[iTrEstado] || '',
          porcentajeAvance: t[iTrAvance] || '', fechaInicioPlan: t[iTrInicioPlan] || '', fechaFinPlan: t[iTrFinPlan] || '',
        })),
    }))
    .sort((a, b) => (a.ordenSecuencia || '').localeCompare(b.ordenSecuencia || ''));
}

// -- §8.74/75: Panel Operativo -- pivote real del operador (no Bastidor): "empezar a producir"
// usando el backlog real que YA existe sobre el propio Engremiat, en vez de trabajo hipotetico
// de cliente. NIVEL_INCIDENCIA='Producto' es el campo real que separa incidencias sobre la
// propia libreria (candidatas de autoregeneracion) de trabajo de proyecto/cliente piloto
// (Amigurumi, Huerto...) -- comprobado con datos reales antes de construir: 22 abiertas de 49
// totales de nivel Producto. 18_VINCULO (TIPO_VINCULO='Corrige', Incidencia->Tarea) es el cruce
// real ya usado por el propio Sheet (ver AprovisionamientoService.js/Biblioteca.html) para
// enlazar una incidencia con la tarea que la corrige.
//
// §8.75: espejo real del Sheet, no una copia decorativa -- el operador pidio explicitamente que
// el Sheet siga siendo el almacen de datos, la interfaz solo refleja. Inspirado en el
// PanelOperativo.html real ya construido en el Sheet (secciones por tipo de senal, boton real
// para abrir el registro exacto) -- aqui el "abrir" es un enlace real a la fila exacta
// (#gid=X&range=A{fila}), no un google.script.run (no disponible fuera del Sheet).
let cacheIncidencias = { en: 0, datos: null };
let cacheVinculos = { en: 0, datos: null };
const ESTADOS_INCIDENCIA_ABIERTA = new Set(['Abierta', 'En análisis', 'En resolución']);
const GID_13_INCIDENCIAS = 1182532531;
const ORDEN_PRIORIDAD = { 'Crítica': 0, 'Alta': 1, 'Media': 2, 'Baja': 3 };

async function leerIncidenciasProductoAbiertas() {
  const [inc, vinc, tareas] = await Promise.all([
    leerTablaSheetCacheada('13_INCIDENCIAS', 'A1:S300', cacheIncidencias),
    leerTablaSheetCacheada('18_VINCULO', 'A1:H500', cacheVinculos),
    leerTablaSheetCacheada('06_TAREAS', 'A1:N1000', cacheTareas),
  ]);
  const iId = inc.cab.indexOf('ID'), iNivel = inc.cab.indexOf('NIVEL_INCIDENCIA'), iTitulo = inc.cab.indexOf('TITULO'),
    iPrioridad = inc.cab.indexOf('PRIORIDAD'), iEstado = inc.cab.indexOf('ESTADO'), iFechaLimite = inc.cab.indexOf('FECHA_LIMITE');
  // filaReal = indice en filas (0-based, sin cabecera) + 2 -- fila 1 es la cabecera real del Sheet
  const abiertas = inc.filas
    .map((f, i) => ({ f, filaReal: i + 2 }))
    .filter(({ f }) => f[iId] && f[iNivel] === 'Producto' && ESTADOS_INCIDENCIA_ABIERTA.has(f[iEstado]));

  const iVOrigenTipo = vinc.cab.indexOf('ENTIDAD_ORIGEN_TIPO'), iVOrigenId = vinc.cab.indexOf('ENTIDAD_ORIGEN_ID'),
    iVDestinoTipo = vinc.cab.indexOf('ENTIDAD_DESTINO_TIPO'), iVDestinoId = vinc.cab.indexOf('ENTIDAD_DESTINO_ID'),
    iVTipo = vinc.cab.indexOf('TIPO_VINCULO');
  const corrige = vinc.filas.filter((f) => f[iVTipo] === 'Corrige' && f[iVOrigenTipo] === 'Incidencia' && f[iVDestinoTipo] === 'Tarea');

  const iTrId = tareas.cab.indexOf('ID'), iTrNombre = tareas.cab.indexOf('NOMBRE'), iTrEstado = tareas.cab.indexOf('ESTADO');
  const tareaPorId = new Map(tareas.filas.map((t) => [t[iTrId], { nombre: t[iTrNombre] || '', estado: t[iTrEstado] || '' }]));

  return abiertas
    .map(({ f, filaReal }) => ({
      id: f[iId], titulo: f[iTitulo] || '', prioridad: f[iPrioridad] || '', estado: f[iEstado] || '', fechaLimite: f[iFechaLimite] || '',
      urlSheet: 'https://docs.google.com/spreadsheets/d/' + SHEETS_SPREADSHEET_ID + '/edit#gid=' + GID_13_INCIDENCIAS + '&range=A' + filaReal,
      tareasVinculadas: corrige.filter((v) => v[iVOrigenId] === f[iId]).map((v) => ({ id: v[iVDestinoId], ...(tareaPorId.get(v[iVDestinoId]) || { nombre: '(no encontrada)', estado: '' }) })),
    }))
    .sort((a, b) => (ORDEN_PRIORIDAD[a.prioridad] ?? 9) - (ORDEN_PRIORIDAD[b.prioridad] ?? 9));
}

// -- §8.67: puente barato Recursos -> Quien. 12_DECISIONES esta real pero vacia hoy
// (0 filas, comprobado antes de construir nada) -- 92_BUS_TRABAJO si tiene actividad
// real rica (quien reclamo, cuando, resultado). Mismo patron JWT ya probado.
let cacheBusTrabajo = { en: 0, datos: null };
async function leerBusTrabajoReal() {
  if (cacheBusTrabajo.datos && Date.now() - cacheBusTrabajo.en < 30000) return cacheBusTrabajo.datos;
  const token = await obtenerAccessTokenSheets();
  const r = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets/' + SHEETS_SPREADSHEET_ID + '/values/92_BUS_TRABAJO!A1:M500',
    { headers: { Authorization: 'Bearer ' + token } }
  );
  const j = await r.json();
  const filas = j.values || [];
  const cab = filas[0] || [];
  const idx = (nombre) => cab.indexOf(nombre);
  const iId = idx('ID_TAREA'), iReclamadoPor = idx('RECLAMADO_POR'), iEstado = idx('ESTADO'),
    iFecha = idx('FECHA_RECLAMACION'), iResultado = idx('RESULTADO');
  const tareas = filas.slice(1)
    .filter((f) => f[iId])
    .map((f) => ({
      id: f[iId], reclamadoPor: f[iReclamadoPor] || '', estado: f[iEstado] || '',
      fecha: f[iFecha] || '', resultado: (f[iResultado] || '').slice(0, 140),
    }));
  cacheBusTrabajo = { en: Date.now(), datos: tareas };
  return tareas;
}

// -- §8.76: Panel Operativo -- el operador pidio simplificar la lista verbosa de 23 tareas
// individuales a un resumen real por trabajador. DURACION_SEGUNDOS es una columna real de
// 92_BUS_TRABAJO que leerBusTrabajoReal() no leia todavia -- comprobado con datos reales antes
// de construir (2.3s-900s segun el trabajador). Se investigo cruzar esto con GASTO_API por
// trabajador -- descartado: GASTO_API.NOMBRE es texto libre ("DeepSeek 2026-08-30T19:48Z"), sin
// ID de tarea real que lo ligue a una fila de 92_BUS_TRABAJO -- cruzarlo seria inventar una
// relacion que no existe. El consumo de API se muestra aparte, como total agregado real.
let cacheResumenTrabajo = { en: 0, datos: null };
async function leerResumenTrabajoReal() {
  if (cacheResumenTrabajo.datos && Date.now() - cacheResumenTrabajo.en < 30000) return cacheResumenTrabajo.datos;
  const token = await obtenerAccessTokenSheets();
  const r = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets/' + SHEETS_SPREADSHEET_ID + '/values/92_BUS_TRABAJO!A1:M500',
    { headers: { Authorization: 'Bearer ' + token } }
  );
  const j = await r.json();
  const filas = j.values || [];
  const cab = filas[0] || [];
  const iReclamadoPor = cab.indexOf('RECLAMADO_POR'), iDuracion = cab.indexOf('DURACION_SEGUNDOS'), iId = cab.indexOf('ID_TAREA');
  const porTrabajador = new Map();
  filas.slice(1).filter((f) => f[iId]).forEach((f) => {
    const trabajador = f[iReclamadoPor] || '(sin asignar)';
    const dur = parseFloat(f[iDuracion]);
    if (!porTrabajador.has(trabajador)) porTrabajador.set(trabajador, { trabajador, tareas: 0, duracionTotalSeg: 0 });
    const e = porTrabajador.get(trabajador);
    e.tareas += 1;
    if (!isNaN(dur)) e.duracionTotalSeg += dur;
  });
  const resumen = [...porTrabajador.values()]
    .map((e) => ({ ...e, duracionMediaSeg: e.tareas ? Math.round((e.duracionTotalSeg / e.tareas) * 10) / 10 : 0 }))
    .sort((a, b) => b.tareas - a.tareas);
  cacheResumenTrabajo = { en: Date.now(), datos: resumen };
  return resumen;
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

// -- §8.65: puente real para Centro compartido -- Concilio ya tiene su propio endpoint
// real /salud (spike_concilio_coop/servidor.mjs), pero sin CORS -- no lo tocamos (no es
// nuestro, sigue siendo "no producción crítica" pero ajeno a este visor). Se sirve como
// proxy real desde aqui, server-to-server, sin credenciales, sin tocar el otro servidor.
const CONCILIO_URL = process.env.CONCILIO_URL || 'http://100.107.171.88:2568';
let cacheConcilio = { en: 0, datos: null };

async function leerEstadoConcilio() {
  if (cacheConcilio.datos && Date.now() - cacheConcilio.en < 10000) return cacheConcilio.datos;
  const r = await fetch(CONCILIO_URL + '/salud', { signal: AbortSignal.timeout(3000) });
  if (!r.ok) throw new Error('Concilio respondio ' + r.status);
  const datos = await r.json();
  cacheConcilio = { en: Date.now(), datos };
  return datos;
}

// -- §8.69: el "Que" completo de Centro compartido -- proxy real server-to-server al
// /transcripcion nuevo de spike_concilio_coop, mismo patron que leerEstadoConcilio.
async function leerTranscripcionConcilio() {
  const r = await fetch(CONCILIO_URL + '/transcripcion', { signal: AbortSignal.timeout(3000) });
  if (!r.ok) throw new Error('Concilio respondio ' + r.status);
  return r.json();
}

// -- §8.69: Telar, el otro ocupante real de Centro compartido (mutuamente excluyente con
// Concilio -- "uno a la vez", patron real de game mastering ya investigado en §8.55).
// Su sesion real vive en Baserow tabla 290, escrita por el workflow n8n
// tools/n8n-workflows/telar-interactivo.json -- comprobado con datos reales antes de
// construir (1 sesion real: "El taller de la Rosa", ESTADO=generando).
const TABLA_TELAR_SESION = 290;
let cacheTelar = { en: 0, datos: null };
async function leerTelarReal() {
  if (cacheTelar.datos && Date.now() - cacheTelar.en < 15000) return cacheTelar.datos;
  const filas = await leerFilasBaserow(TABLA_TELAR_SESION);
  const sesiones = filas.map((f) => ({
    nombre: f.NOMBRE || '', capituloActual: f.CAPITULO_ACTUAL || '', estado: valorSelect(f.ESTADO),
    historial: (f.HISTORIAL || '').slice(0, 600), chatId: f.CHAT_ID || '',
  }));
  cacheTelar = { en: Date.now(), datos: sesiones };
  return sesiones;
}

// -- §8.69: el "Como" de Narrador -- envuelve narrador_construir_proyecto.mjs (real,
// probado por CLI) en un endpoint HTTP para que Bastidor pueda dispararlo en vivo. Sigue
// siendo SOLO la mitad "proponer" -- nunca escribe en el Sheet, mismo limite documentado
// en ese script (la mitad "confirmar" necesita una accion nueva en el webhook real que
// todavia no existe). Reutiliza leerProyectosReales() para el catalogo de 90_CONFIGURACION
// via la misma cuenta de servicio, y llama a DeepSeek con el mismo prompt real ya probado.
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const PRECIO_DEEPSEEK = { entrada: 0.44, salida: 1.32 }; // USD/1M tokens, mismo precio real de spike_concilio_coop

async function leerCatalogoProyectoReal() {
  const token = await obtenerAccessTokenSheets();
  const r = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets/' + SHEETS_SPREADSHEET_ID + '/values/90_CONFIGURACION!A1:D100',
    { headers: { Authorization: 'Bearer ' + token } }
  );
  const j = await r.json();
  const filas = (j.values || []).slice(1);
  const porCategoria = {};
  for (const [, categoria, , valor] of filas) {
    if (!categoria || !valor) continue;
    (porCategoria[categoria] = porCategoria[categoria] || []).push(valor);
  }
  return { tipoProyecto: porCategoria.TIPO_PROYECTO || [], prioridad: porCategoria.PRIORIDAD || [] };
}

async function narradorProponerProyecto(queConstruye, necesidad, obstaculo) {
  const catalogo = await leerCatalogoProyectoReal();
  const systemPrompt = `Eres el Narrador de Engremiat, acompañando a un cliente real a construir un Proyecto real -- no una ficción. ` +
    `Convierte sus tres respuestas en una propuesta de Proyecto real, estructurada, en JSON. ` +
    `No inventes nada que no se derive de las respuestas dadas -- si algo no está claro, dilo en OBSERVACIONES, no lo rellenes con relleno genérico. ` +
    `TIPO_PROYECTO debe ser EXACTAMENTE uno de estos valores reales: ${catalogo.tipoProyecto.join(', ')}. ` +
    `PRIORIDAD debe ser EXACTAMENTE uno de estos valores reales: ${catalogo.prioridad.join(', ')}. ` +
    `Responde solo el JSON, sin explicación adicional, con las claves: NOMBRE, DESCRIPCION, OBJETIVO, RESULTADO_ESPERADO, CRITERIOS_ACEPTACION, TIPO_PROYECTO, PRIORIDAD, OBSERVACIONES.`;
  const userPrompt = `Qué quiere construir: ${queConstruye}\nPor qué lo necesita: ${necesidad}\nQué lo dificulta hoy: ${obstaculo}`;
  const r = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + DEEPSEEK_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });
  const j = await r.json();
  if (!j.choices) throw new Error('DEEPSEEK_ERROR: ' + JSON.stringify(j));
  const usage = j.usage || {};
  const coste = ((usage.prompt_tokens || 0) / 1e6) * PRECIO_DEEPSEEK.entrada + ((usage.completion_tokens || 0) / 1e6) * PRECIO_DEEPSEEK.salida;
  const propuesta = JSON.parse(j.choices[0].message.content);
  propuesta.ESTADO = 'Borrador';
  return { propuesta, coste };
}

// -- §8.71: puente real Constructor del universo -> Aprovisionamiento. El webhook real
// (src/WebhookTelegramService.js) ya despacha 'crear_solicitud_montaje' -> crearSolicitudMontaje()
// (AprovisionamientoService.js), probado de extremo a extremo (SOLICITUDES_MONTAJE real, fila
// SOL-003 verificada con curl antes de escribir este puente). La URL vive SOLO server-side (nunca
// en el HTML servido al navegador) -- ver HALLAZGOS_PENDIENTES.md #1: el webhook no comprueba
// ningun token por accion, asi que esta URL es en si misma el secreto real.
const WEBHOOK_APPS_SCRIPT_URL = process.env.WEBHOOK_APPS_SCRIPT_URL;
// Modulos reales de negocio (package-map.json moduleDependencies, menos CORE -- ese va siempre
// incluido por crearSolicitudMontaje() y no se ofrece como opcion, mismo criterio que SolicitudMontaje.html real.
const MODULOS_MONTAJE_DISPONIBLES = [
  'GANTT', 'ECONOMICO', 'IMPACTO', 'COMPRAS', 'CONVOCATORIAS', 'CLIENTE', 'VENTAS',
  'OPORTUNIDAD', 'ESCENARIOS', 'OPERATIVA', 'SEGUIMIENTO', 'EJECUCION', 'APROVISIONAMIENTO', 'COMUNICACION',
];

async function solicitarMontajeReal(nombre, modulosSeleccionados) {
  const r = await fetch(WEBHOOK_APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'crear_solicitud_montaje', nombre, modulosSeleccionados }),
    redirect: 'follow',
  });
  const j = await r.json();
  if (!j.ok) throw new Error('WEBHOOK_ERROR: ' + JSON.stringify(j));
  return j.resultado;
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

    if (req.method === 'GET' && req.url === '/api/bus_trabajo') {
      if (!SHEETS_CREDENCIALES_PATH) {
        res.writeHead(503); res.end(JSON.stringify({ error: 'sin credenciales reales configuradas para leer el Sheet' })); return;
      }
      const tareas = await leerBusTrabajoReal();
      res.writeHead(200); res.end(JSON.stringify({ tareas, leidoEn: new Date(cacheBusTrabajo.en).toISOString() })); return;
    }

    if (req.method === 'GET' && req.url === '/api/resumen_trabajo') {
      if (!SHEETS_CREDENCIALES_PATH) {
        res.writeHead(503); res.end(JSON.stringify({ error: 'sin credenciales reales configuradas para leer el Sheet' })); return;
      }
      const resumen = await leerResumenTrabajoReal();
      res.writeHead(200); res.end(JSON.stringify({ resumen, leidoEn: new Date(cacheResumenTrabajo.en).toISOString() })); return;
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

    if (req.method === 'GET' && req.url.startsWith('/api/procesos_tareas')) {
      if (!SHEETS_CREDENCIALES_PATH) {
        res.writeHead(503); res.end(JSON.stringify({ error: 'sin credenciales reales configuradas para leer el Sheet' })); return;
      }
      const proyectoId = new URL(req.url, 'http://x').searchParams.get('proyectoId');
      if (!proyectoId) {
        res.writeHead(400); res.end(JSON.stringify({ error: 'falta proyectoId' })); return;
      }
      const procesos = await leerProcesosTareasReales(proyectoId);
      res.writeHead(200); res.end(JSON.stringify({ procesos, leidoEn: new Date(cacheProcesos.en).toISOString() })); return;
    }

    if (req.method === 'GET' && req.url === '/api/incidencias_producto_abiertas') {
      if (!SHEETS_CREDENCIALES_PATH) {
        res.writeHead(503); res.end(JSON.stringify({ error: 'sin credenciales reales configuradas para leer el Sheet' })); return;
      }
      const incidencias = await leerIncidenciasProductoAbiertas();
      res.writeHead(200); res.end(JSON.stringify({ incidencias, leidoEn: new Date(cacheIncidencias.en).toISOString() })); return;
    }

    if (req.method === 'GET' && req.url === '/api/concilio_estado') {
      try {
        const estado = await leerEstadoConcilio();
        res.writeHead(200); res.end(JSON.stringify({ ...estado, leidoEn: new Date(cacheConcilio.en).toISOString() })); return;
      } catch (e) {
        res.writeHead(503); res.end(JSON.stringify({ error: 'Concilio no responde ahora mismo: ' + e.message })); return;
      }
    }

    if (req.method === 'GET' && req.url === '/api/concilio_transcripcion') {
      try {
        const t = await leerTranscripcionConcilio();
        res.writeHead(200); res.end(JSON.stringify(t)); return;
      } catch (e) {
        res.writeHead(503); res.end(JSON.stringify({ error: 'Concilio no responde ahora mismo: ' + e.message })); return;
      }
    }

    if (req.method === 'GET' && req.url === '/api/telar_estado') {
      if (!BASEROW_TOKEN) {
        res.writeHead(503); res.end(JSON.stringify({ error: 'sin credenciales reales configuradas para leer Baserow' })); return;
      }
      const sesiones = await leerTelarReal();
      res.writeHead(200); res.end(JSON.stringify({ sesiones, leidoEn: new Date(cacheTelar.en).toISOString() })); return;
    }

    if (req.method === 'POST' && req.url === '/api/narrador_proponer') {
      if (!DEEPSEEK_KEY || !SHEETS_CREDENCIALES_PATH) {
        res.writeHead(503); res.end(JSON.stringify({ error: 'sin credenciales reales configuradas (DeepSeek/Sheets)' })); return;
      }
      const { queConstruye, necesidad, obstaculo } = await leerCuerpo(req);
      if (!queConstruye || !necesidad || !obstaculo) {
        res.writeHead(400); res.end(JSON.stringify({ error: 'faltan queConstruye/necesidad/obstaculo' })); return;
      }
      try {
        const { propuesta, coste } = await narradorProponerProyecto(queConstruye, necesidad, obstaculo);
        res.writeHead(200); res.end(JSON.stringify({ propuesta, coste })); return;
      } catch (e) {
        res.writeHead(502); res.end(JSON.stringify({ error: 'el Narrador no pudo proponer ahora mismo: ' + e.message })); return;
      }
    }

    if (req.method === 'GET' && req.url === '/api/modulos_montaje_disponibles') {
      res.writeHead(200); res.end(JSON.stringify({ modulos: MODULOS_MONTAJE_DISPONIBLES })); return;
    }

    if (req.method === 'POST' && req.url === '/api/aprovisionar_montaje') {
      if (!WEBHOOK_APPS_SCRIPT_URL) {
        res.writeHead(503); res.end(JSON.stringify({ error: 'sin URL de webhook real configurada' })); return;
      }
      const { nombre, modulosSeleccionados } = await leerCuerpo(req);
      if (!nombre) {
        res.writeHead(400); res.end(JSON.stringify({ error: 'falta nombre' })); return;
      }
      try {
        const resultado = await solicitarMontajeReal(nombre, Array.isArray(modulosSeleccionados) ? modulosSeleccionados : []);
        res.writeHead(200); res.end(JSON.stringify(resultado)); return;
      } catch (e) {
        res.writeHead(502); res.end(JSON.stringify({ error: 'no se pudo crear la solicitud real ahora mismo: ' + e.message })); return;
      }
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
