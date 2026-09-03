#!/usr/bin/env node
/*
 * Anade el campo real "equipo" (§8.33 -- personaje.schema.json) al
 * frontmatter de los 20 Personajes reales, agrupados por la topologia
 * YA existente en 07_Holon_Relaciones/ (opera_en/parte_de/alimenta_a/
 * verifica_a), no inventada de antemano. Solo toca la linea de
 * frontmatter -- inserta "equipo: X" justo despues de "tipo: personaje",
 * nunca reescribe el cuerpo real. Idempotente: si la ficha ya tiene
 * "equipo:", se salta.
 *
 * Uso: node anadir_equipo_personajes.mjs [--aplicar]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RUTA_VAULT = 'G:\\Mi unidad\\engremiat.claude\\Obsidian-Engremiat\\Universos\\Engremiat';

const EQUIPO_POR_FICHA = {
  '02_Personajes\\Concilio.md': 'concilio',
  '02_Personajes\\Vigilia.md': 'concilio',
  '02_Personajes\\Acervos\\Acervo Tecnico.md': 'concilio',
  '02_Personajes\\Acervos\\Acervo Logico.md': 'concilio',
  '02_Personajes\\Acervos\\Acervo Logistico.md': 'concilio',
  '02_Personajes\\Acervos\\Acervo Narrativo.md': 'concilio',
  '02_Personajes\\Acervos\\Acervo Filosofico.md': 'concilio',
  '02_Personajes\\Acervos\\Acervo Usuario.md': 'concilio',
  '02_Personajes\\Acervos\\Acervo Sociocracia.md': 'concilio',
  '02_Personajes\\Acervos\\Acervo Prompter.md': 'concilio',
  '02_Personajes\\Acervos\\Acervo.md': 'concilio',
  '02_Personajes\\Coordinador.md': 'guardia',
  '02_Personajes\\Ejecutor.md': 'guardia',
  '02_Personajes\\Relevo.md': 'guardia',
  '02_Personajes\\Verificadores\\Verificador de Campos.md': 'guardia',
  '02_Personajes\\Verificadores\\Verificador de Capacidades.md': 'guardia',
  '02_Personajes\\Cronista.md': 'frontera',
  '02_Personajes\\Pregonero.md': 'frontera',
  '02_Personajes\\Narrador.md': 'frontera',
  '02_Personajes\\Mensajero.md': 'frontera',
};

function main() {
  const aplicar = process.argv.includes('--aplicar');
  let escritas = 0, saltadas = 0;

  for (const [rel, equipo] of Object.entries(EQUIPO_POR_FICHA)) {
    const ruta = join(RUTA_VAULT, rel);
    const texto = readFileSync(ruta, 'utf-8');
    if (/^equipo:/m.test(texto)) { saltadas++; console.log(`YA TIENE  ${rel}`); continue; }
    if (!/^tipo: personaje$/m.test(texto)) { console.log(`AVISO -- no encontre "tipo: personaje" exacto en ${rel}, se salta por seguridad.`); continue; }

    const nuevoTexto = texto.replace(/^tipo: personaje$/m, `tipo: personaje\nequipo: ${equipo}`);
    console.log(`${aplicar ? 'AÑADIR' : 'DRY-RUN AÑADIR'}  ${rel}  ->  equipo: ${equipo}`);
    escritas++;
    if (aplicar) writeFileSync(ruta, nuevoTexto, 'utf-8');
  }

  console.log(`\n=== Resultado ===`);
  console.log(`${escritas} ficha(s) ${aplicar ? 'escritas de verdad' : 'listas para escribir'}, ${saltadas} ya tenían "equipo:".`);
  if (!aplicar) console.log('(DRY-RUN -- añade --aplicar para escribir de verdad en la bóveda.)');
}

main();
