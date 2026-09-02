#!/usr/bin/env node
/*
 * Fase B1 de Telar -- interfaz estatica interactiva sobre los fixtures de B0.
 * Sin DeepSeek, sin Baserow/Sheet/Grafana, sin escrituras -- todo lo que se ve
 * viene de tools/gobierno/telar/fixtures/*.json, leidos aqui y servidos tal cual.
 * Ver PROPUESTA_TELAR_INTERFAZ_OPERATIVA.md §16 (gate de B1: un jugador nuevo
 * completa el ciclo y explica que decidio, que estaba verificado y que cambio).
 */
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR_FIXTURES = join(__dirname, '..', 'fixtures');
const PUERTO = Number(process.env.PUERTO || 4310);

const httpServer = createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(readFileSync(join(__dirname, 'publico', 'index.html')));
    return;
  }

  if (req.url.startsWith('/fixtures/')) {
    const nombre = basename(req.url);
    const ruta = join(DIR_FIXTURES, nombre);
    if (!nombre.endsWith('.json') || !existsSync(ruta)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(readFileSync(ruta));
    return;
  }

  res.writeHead(404); res.end();
});

httpServer.listen(PUERTO, () => {
  console.log('Telar B1 (vertical slice estatica) escuchando en :' + PUERTO);
});
