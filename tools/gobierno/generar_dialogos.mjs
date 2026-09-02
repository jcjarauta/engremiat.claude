#!/usr/bin/env node
/*
 * Genera personajes.json desde las fichas reales de 02_Personajes/ del vault --
 * la misma fuente de comportamiento que consumira el juego 2D Y, mas adelante,
 * el bot de Telegram. Un solo motor, dos pieles -- nunca dos versiones de
 * Concilio diciendo cosas distintas.
 *
 * Mismo principio que ya usa la Consola (regenerar preserva estado, generado
 * desde la fuente real, nunca escrito a mano dos veces).
 *
 * Uso: node generar_dialogos.mjs [--out ruta/personajes.json]
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RUTA_VAULT = 'G:\\Mi unidad\\engremiat.claude\\Obsidian-Engremiat\\Universos\\Engremiat\\02_Personajes';

function args() {
  const a = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < a.length; i++) if (a[i] === '--out') out.out = a[++i];
  return out;
}

function listarNotasMd(dir) {
  let out = [];
  for (const nombre of readdirSync(dir)) {
    if (nombre === 'desktop.ini') continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) out = out.concat(listarNotasMd(ruta));
    else if (nombre.endsWith('.md')) out.push(ruta);
  }
  return out;
}

function parsearNota(ruta) {
  const texto = readFileSync(ruta, 'utf8');
  const m = texto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const frontmatter = {};
  for (const linea of m[1].split('\n')) {
    const mm = linea.match(/^(\w+):\s*(.*)$/);
    if (mm) frontmatter[mm[1]] = mm[2].trim();
  }
  let cuerpo = m[2].trim();
  // quitar la seccion "## Relaciones" y todo lo que venga despues -- eso es
  // estructura del vault, no voz del personaje
  cuerpo = cuerpo.split(/\n##\s+Relaciones/)[0].trim();
  // quitar wikilinks [[..]] dejando solo el texto visible, para que el
  // dialogo se lea limpio fuera de Obsidian
  cuerpo = cuerpo.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1');

  return {
    id: frontmatter.title,
    estado: frontmatter.estado || 'sin_definir',
    dialogo: cuerpo
  };
}

function main() {
  const { out } = args();
  const notas = listarNotasMd(RUTA_VAULT);
  const personajes = notas.map(parsearNota).filter(p => p && p.dialogo);
  const salida = { generado: new Date().toISOString(), fuente: RUTA_VAULT, total: personajes.length, personajes };

  if (out) {
    writeFileSync(out, JSON.stringify(salida, null, 1));
    console.log('Escrito ' + out + ' -- ' + personajes.length + ' personajes reales.');
  } else {
    console.log(JSON.stringify(salida, null, 1));
  }
}

main();
