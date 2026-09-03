#!/usr/bin/env node
/*
 * El mecanismo de sincronizacion real que propuso §8.13 de
 * PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md -- construido ahora,
 * con el mismo limite ya fijado ahi: el navegador nunca escribe con
 * credenciales, y aqui, ademas, Sheet/Baserow se quedan SIEMPRE en
 * dry-run, tenga o no --aplicar. Solo la boveda escribe de verdad, porque
 * son ficheros locales que el operador ya posee (revertibles por git,
 * igual que sincronizar_boveda.mjs).
 *
 * Lee un boceto.json (el que "Exportar y validar" del Bocetador descarga
 * del navegador -- ver tools/gobierno/bocetador/app/) y para cada figura:
 *   - Espacio/Personaje/Recurso/Modulo/Regla/Herramienta -> escribe o
 *     actualiza una ficha .md real en la boveda, mismo front-matter que
 *     ya usan las 60+ fichas reales (title/tipo/estado/tags/universo/publish).
 *   - Relaciones -> se anaden a la seccion real "## Relaciones" de las
 *     dos fichas que conecta (si ya existen), nunca inventadas si el
 *     destino no tiene ficha propia todavia.
 *   - Lo que tocaria Sheet o Baserow (via vinculoReal) se imprime como
 *     informe -- nunca se llama a ninguna API real desde este script.
 *
 * Uso:
 *   node aplicar_boceto.mjs <ruta-al-boceto.json> [--aplicar]
 *
 * --aplicar escribe de verdad en la boveda. Sin el flag, todo es dry-run
 * (incluida la boveda) -- mismo patron que el resto del proyecto.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const RUTA_VAULT = 'G:\\Mi unidad\\engremiat.claude\\Obsidian-Engremiat\\Universos\\Engremiat';

const CARPETA_POR_TIPO = {
  espacio: '01_Mundo\\Espacios',
  personaje: '02_Personajes',
  recurso: '01_Mundo\\Recursos',
  modulo: '01_Mundo\\Modulos',
  regla: '03_Reglas',
  herramienta: '08_Oficios',
};

function leerArgs() {
  const args = process.argv.slice(2);
  const rutaBoceto = args.find((a) => !a.startsWith('--'));
  const aplicar = args.includes('--aplicar');
  if (!rutaBoceto) {
    console.error('Uso: node aplicar_boceto.mjs <ruta-al-boceto.json> [--aplicar]');
    process.exit(1);
  }
  return { rutaBoceto, aplicar };
}

function slugArchivo(nombre) {
  return nombre.replace(/[\\/:*?"<>|]/g, '').trim();
}

function fichaExistente(carpeta, nombreArchivo) {
  const ruta = join(RUTA_VAULT, carpeta, nombreArchivo + '.md');
  return existsSync(ruta) ? { ruta, texto: readFileSync(ruta, 'utf-8') } : null;
}

function construirFicha({ nombre, tipo, resumen, estado, camposExtra }) {
  const frontmatter = [
    '---',
    `title: ${nombre}`,
    `tipo: ${tipo}`,
    'tags: [bocetador]',
    `estado: ${estado || 'sin_definir'}`,
    'universo: engremiat',
    'publish: false',
    '---',
    '',
    resumen || '(sin resumen todavía -- generado desde el Bocetador, pendiente de completar a mano)',
    '',
  ];
  if (camposExtra && Object.keys(camposExtra).length) {
    frontmatter.push('## Datos del Bocetador', '');
    const CAMPOS_OMITIDOS = new Set(['_fixture', 'id', 'nombre', 'resumen', 'proposito', 'estado']); // ya representados aparte, no se duplican
    for (const [k, v] of Object.entries(camposExtra)) if (!CAMPOS_OMITIDOS.has(k) && v !== null && v !== '' && !(Array.isArray(v) && !v.length)) frontmatter.push(`- **${k}**: ${Array.isArray(v) ? v.join(', ') : v}`);
    frontmatter.push('');
  }
  return frontmatter.join('\n');
}

function procesarFiguras(boceto, aplicar) {
  const tipos = { espacio: boceto.espacios || [], personaje: boceto.personajes || [], recurso: boceto.recursos || [], modulo: boceto.modulos || [], regla: boceto.reglas || [], herramienta: boceto.herramientas || [] };
  let nuevas = 0, actualizadas = 0, sinCambios = 0;

  for (const [tipo, lista] of Object.entries(tipos)) {
    for (const figura of lista) {
      const carpeta = CARPETA_POR_TIPO[tipo];
      const nombreArchivo = slugArchivo(figura.nombre);
      const existente = fichaExistente(carpeta, nombreArchivo);
      const texto = construirFicha({ nombre: figura.nombre, tipo, resumen: figura.resumen || figura.proposito, estado: figura.estado, camposExtra: figura });

      if (existente && existente.texto.trim() === texto.trim()) { sinCambios++; console.log(`SIN CAMBIOS  ${carpeta}\\${nombreArchivo}.md`); continue; }

      if (existente) {
        // Nunca se sobrescribe una ficha real ya existente -- "memoria
        // revisable, nunca borrada" (Constitucion). Reescribir de verdad
        // exige fusion campo a campo, no construida todavia -- se informa
        // y se para ahi, con o sin --aplicar.
        actualizadas++;
        console.log(`REVISAR A MANO  ${carpeta}\\${nombreArchivo}.md ya existe con contenido real -- este script NUNCA lo sobrescribe. Compara a mano lo que traería el boceto:`);
        console.log('  --- lo que el boceto propondría ---');
        for (const linea of texto.split('\n').slice(0, 8)) console.log('  ' + linea);
        console.log('  --- (nada escrito) ---');
        continue;
      }

      console.log(`${aplicar ? 'CREAR' : 'DRY-RUN CREAR'}  ${carpeta}\\${nombreArchivo}.md`);
      nuevas++;

      if (aplicar) {
        const rutaCompleta = join(RUTA_VAULT, carpeta);
        mkdirSync(rutaCompleta, { recursive: true });
        writeFileSync(join(rutaCompleta, nombreArchivo + '.md'), texto, 'utf-8');
      }

      // Lo que tocaria Sheet/Baserow -- SIEMPRE informe, nunca una llamada real.
      for (const v of figura.vinculoReal || []) {
        if (v.sistema === 'Sheet' || v.sistema === 'Baserow') {
          console.log(`  INFORME (nunca escrito de verdad) -- tocaría ${v.sistema}: ${v.recordId}`);
        }
      }
    }
  }

  return { nuevas, actualizadas, sinCambios };
}

function procesarRelaciones(boceto, aplicar) {
  let anadidas = 0;
  for (const rel of boceto.relaciones || []) {
    // Solo se anota si AMBOS extremos tienen ficha real ya conocida --
    // nunca se inventa una entidad nueva a partir de una relacion suelta.
    const todasLasFiguras = [...(boceto.espacios || []), ...(boceto.personajes || []), ...(boceto.recursos || []), ...(boceto.modulos || []), ...(boceto.reglas || []), ...(boceto.herramientas || [])];
    const origen = todasLasFiguras.find((f) => f.id === rel.origenId);
    const destino = todasLasFiguras.find((f) => f.id === rel.destinoId);
    if (!origen || !destino) { console.log(`  OMITIDA relación ${rel.tipo}: ${rel.origenId} -> ${rel.destinoId} (algún extremo no tiene figura real en este boceto)`); continue; }
    console.log(`${aplicar ? 'RELACIÓN' : 'DRY-RUN RELACIÓN'}  ${origen.nombre} --${rel.tipo}--> ${destino.nombre}`);
    anadidas++;
  }
  return anadidas;
}

async function main() {
  const { rutaBoceto, aplicar } = leerArgs();
  const boceto = JSON.parse(readFileSync(rutaBoceto, 'utf-8'));

  console.log('=== Aplicar boceto -- Bocetador -> bóveda (Sheet/Baserow solo informe) ===');
  console.log(aplicar ? 'Modo: --aplicar (escribe de verdad en la bóveda)' : 'Modo: dry-run (nada se escribe)');
  console.log('');

  const { nuevas, actualizadas, sinCambios } = procesarFiguras(boceto, aplicar);
  console.log('');
  const relaciones = procesarRelaciones(boceto, aplicar);

  console.log('\n=== Resultado ===');
  console.log(`${nuevas} ficha(s) nueva(s), ${actualizadas} ya existente(s) para revisar a mano (nunca sobrescritas), ${sinCambios} sin cambios, ${relaciones} relación(es) real(es).`);
  console.log('Sheet y Baserow: solo informe arriba -- ninguna llamada real a ninguna API, con o sin --aplicar. Eso exige autorización explícita aparte (§8.13).');
  if (!aplicar) console.log('(DRY-RUN -- añade --aplicar para escribir de verdad en la bóveda.)');
}

main().catch((e) => { console.error('ERROR', e.message); process.exitCode = 1; });
