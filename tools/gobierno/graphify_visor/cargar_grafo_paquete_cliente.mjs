#!/usr/bin/env node
/*
 * Grafo real Cliente -> Modulos activos, desde PAQUETE_CLIENTE (Baserow
 * tabla 277). Solo lectura de filas reales, ninguna escritura.
 * Ver PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md §8.22.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASEROW_URL || 'http://100.107.171.88';
const TOKEN = process.env.BASEROW_TOKEN;
const TABLA_PAQUETE_CLIENTE = 277;

async function main() {
  if (!TOKEN) { console.error('ERROR: falta BASEROW_TOKEN.'); process.exitCode = 1; return; }
  const r = await (await fetch(`${BASE}/api/database/rows/table/${TABLA_PAQUETE_CLIENTE}/?user_field_names=true&size=200`, { headers: { Authorization: TOKEN } })).json();

  const nodos = [];
  const aristas = [];
  const modulosVistos = new Set();
  for (const fila of r.results || []) {
    const idCliente = 'cliente:' + fila.ID;
    nodos.push({ id: idCliente, tipo: 'cliente', nombre: fila.CLIENTE || fila.ID });
    for (const [campo, valor] of Object.entries(fila)) {
      if (!campo.startsWith('MODULO_') || valor !== 'SI') continue;
      const nombreModulo = campo.replace('MODULO_', '');
      const idModulo = 'modulo:' + nombreModulo;
      if (!modulosVistos.has(idModulo)) { nodos.push({ id: idModulo, tipo: 'modulo', nombre: nombreModulo }); modulosVistos.add(idModulo); }
      aristas.push({ source: idCliente, target: idModulo });
    }
  }

  const paquete = { generadoEn: new Date().toISOString(), nodos, aristas };
  writeFileSync(join(import.meta.dirname, 'grafo_paquete_cliente.json'), JSON.stringify(paquete, null, 2));
  console.log(`grafo_paquete_cliente.json -- ${nodos.filter(n=>n.tipo==='cliente').length} cliente(s) real(es), ${modulosVistos.size} módulo(s) activo(s) real(es), ${aristas.length} arista(s).`);
}

main().catch((e) => { console.error('ERROR', e.message); process.exitCode = 1; });
