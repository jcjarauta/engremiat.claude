#!/usr/bin/env node
/*
 * §8.125: servidor local minimo -- unico proposito real: dejar que mapa.html (que no
 * puede ejecutar nada por si sola, ninguna pagina web puede) dispare de verdad
 * aplicar_pagina_arquitecto.mjs con un clic real del operador. Atado EXCLUSIVAMENTE a
 * 127.0.0.1 -- nunca 0.0.0.0, nunca alcanzable desde fuera de esta maquina. El operador
 * lo arranca a mano cuando quiere usar el boton "Ejecutar ahora" de Mapa y lo para
 * cuando termina -- no es un servicio permanente del VPS, vive en el ordenador del
 * operador, igual que la propia sesion de Claude Code.
 *
 * Riesgo real considerado antes de construir: un origen CORS abierto (*) permitiria que
 * CUALQUIER pagina que el operador visite mientras esto corre dispare un despliegue real
 * sin que el lo pida ("localhost" no es una frontera de seguridad frente a una pagina
 * maliciosa -- clase real de ataque: CSRF/DNS-rebinding contra servicios locales).
 * Mitigado: solo POST, solo si el header Origin real es EXACTAMENTE el origen real de
 * mapa.html (nunca "*"), y el nombre de fichero se valida con una regex estricta antes
 * de pasarlo al proceso real -- nunca se interpola libre en un shell.
 *
 * Uso:
 *   node servidor_aplicar_local.mjs
 */
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const PUERTO = 9331;
const ORIGEN_REAL_PERMITIDO = 'http://100.107.171.88:9320';
const NOMBRE_ARCHIVO_VALIDO = /^[\w.-]+\.html$/;

const servidor = createServer((req, res) => {
  const origen = req.headers.origin;
  if (origen === ORIGEN_REAL_PERMITIDO) {
    res.setHeader('Access-Control-Allow-Origin', ORIGEN_REAL_PERMITIDO);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const { pathname, searchParams } = new URL(req.url, 'http://127.0.0.1');
  if (req.method !== 'POST' || pathname !== '/aplicar') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'ruta real no encontrada' }));
    return;
  }

  // Nunca ejecuta nada real si la peticion no viene de mapa.html -- mitiga CSRF/DNS
  // rebinding contra este servidor local aunque alguien conozca el puerto.
  if (origen !== ORIGEN_REAL_PERMITIDO) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'origen real no autorizado: ' + origen }));
    return;
  }

  const archivo = searchParams.get('archivo');
  if (!archivo || !NOMBRE_ARCHIVO_VALIDO.test(archivo)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'nombre de fichero real invalido: ' + archivo }));
    return;
  }

  console.log('Aplicando de verdad (clic real del operador): ' + archivo);
  execFile('node', ['aplicar_pagina_arquitecto.mjs', archivo], { cwd: DIR_VISOR, timeout: 120000 }, (error, stdout, stderr) => {
    const salida = stdout + (stderr ? '\n' + stderr : '');
    console.log(salida);
    res.writeHead(error ? 502 : 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: !error, error: error ? 'aplicar_pagina_arquitecto.mjs fallo de verdad' : undefined, salida }));
  });
});

servidor.listen(PUERTO, '127.0.0.1', () => {
  console.log('Servidor real de aplicacion local escuchando SOLO en 127.0.0.1:' + PUERTO + ' -- Ctrl+C para pararlo.');
});
