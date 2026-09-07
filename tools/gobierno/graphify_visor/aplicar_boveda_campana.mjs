#!/usr/bin/env node
/*
 * §8.140: aplica de verdad la nota Markdown real gemela de una página construida con
 * Arquitecto -- toda página real construida con Arquitecto genera siempre esta nota
 * (confirmado explícito, nunca opt-in). Sigue el mismo criterio de Puerta Humana ya
 * establecido para el HTML (aplicar_pagina_arquitecto.mjs): Arquitecto nunca escribe el
 * fichero real directamente desde el navegador, solo lo genera y lo encola -- este
 * script CLI, ejecutado a mano por el operador, es quien de verdad toca el disco.
 *
 * Orden real importante: ejecuta este script ANTES de aplicar_pagina_arquitecto.mjs --
 * ese script borra la entrada real de la cola al terminar, y este de aquí SOLO LEE
 * (nunca borra), para no competir por quién limpia la cola.
 *
 * "La bóveda es una ampliación de los datos reales -- el Sheet sigue mandando": esta nota
 * nunca es la fuente de verdad, es una vista Markdown real de la misma configuración de
 * cajas/piezas que ya vive en el Sheet -- por eso lleva siempre su "## Vínculo real" de
 * vuelta.
 *
 * Uso:
 *   node aplicar_boveda_campana.mjs <archivo.html>
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const URL_MEMORIA = 'http://100.107.171.88:9330';

// §8.140: ruta real base de las bóvedas por Campaña -- carpeta real ya creada dentro de
// engremiat.claude en Drive (id 1h2XLDBgd3K57mnmxFGAor2LgTcFo_mwu), sincronizada por
// Drive for Desktop. Nunca inventada -- confirmada real por el operador.
const RUTA_BASE_BOVEDAS = 'G:\\Mi unidad\\engremiat.claude\\bovedas.claude';

function fallar(mensaje) {
  console.error('ERROR: ' + mensaje);
  process.exit(1);
}

function slugCampana(nombre) {
  // Mismo criterio real que slug() de arquitecto.html -- pero conserva may/min y
  // espacios reales del nombre de Campaña, ya que aqui es un nombre real de carpeta
  // visible para el operador en Obsidian, no un archivo.html tecnico.
  return String(nombre || '').trim().replace(/[\\/:*?"<>|]/g, '_');
}

// Crea la carpeta real de la Campaña si no existe -- estructura minima real confirmada:
// .obsidian/ (para que Obsidian la reconozca como boveda real al abrirla) + 00_Indice.md
// real con la lista de notas reales de esta Campaña.
function asegurarBovedaCampana(carpetaCampana) {
  const rutaCampana = join(RUTA_BASE_BOVEDAS, carpetaCampana);
  const rutaObsidian = join(rutaCampana, '.obsidian');
  const rutaIndice = join(rutaCampana, '00_Indice.md');
  let creada = false;
  if (!existsSync(rutaCampana)) {
    mkdirSync(rutaCampana, { recursive: true });
    creada = true;
  }
  if (!existsSync(rutaObsidian)) mkdirSync(rutaObsidian, { recursive: true });
  if (!existsSync(rutaIndice)) {
    writeFileSync(rutaIndice, '# Índice real -- ' + carpetaCampana + '\n\nPáginas y catálogos reales de esta Campaña:\n\n', 'utf-8');
  }
  if (creada) console.log(`(bóveda real nueva creada en ${rutaCampana})`);
  return { rutaCampana, rutaIndice };
}

// §8.151: "en obsidian nos interesa que cada carpeta sea un catalogo, para ordenar
// obsidian con la jerarquia de carpetas/nodos" -- pedido explicito, cambia el criterio
// real de §8.150 (ahi la carpeta era la PAGINA). Ahora la carpeta real es el TIPO/
// catalogo real (ej. "CATALOGOS", una Caja reutilizable) -- cada tipo real tiene su
// propia carpeta con su propio indice real (que instancias reales lo usan), y la pagina
// pasa a ser una nota-indice real suelta en la carpeta de su Campaña (nunca una carpeta
// propia), que enlaza a sus cajas reales alli donde vivan (una por cada carpeta-tipo).
function asegurarCarpetaTipo(rutaCampana, carpetaTipo) {
  const rutaTipo = join(rutaCampana, carpetaTipo);
  const rutaIndiceTipo = join(rutaTipo, '00_Indice.md');
  if (!existsSync(rutaTipo)) mkdirSync(rutaTipo, { recursive: true });
  if (!existsSync(rutaIndiceTipo)) {
    writeFileSync(rutaIndiceTipo, '# Catálogo real -- ' + carpetaTipo + '\n\nInstancias reales que usan este tipo:\n\n', 'utf-8');
  }
  return rutaIndiceTipo;
}

// Añade el enlace real (wikilink) a 00_Indice.md si todavia no esta -- nunca duplicado,
// nunca reescribe el resto del indice real ya escrito a mano por el operador.
function anadirAlIndiceSiFalta(rutaIndice, nombreNotaSinExtension) {
  const contenido = readFileSync(rutaIndice, 'utf-8');
  const enlace = '[[' + nombreNotaSinExtension + ']]';
  if (contenido.includes(enlace)) return;
  writeFileSync(rutaIndice, contenido.replace(/\n?$/, '') + '\n- ' + enlace + '\n', 'utf-8');
}

async function main() {
  const archivo = process.argv[2];
  if (!archivo) fallar('falta el nombre real del fichero, ej.: node aplicar_boveda_campana.mjs recursos.html');

  if (!existsSync(RUTA_BASE_BOVEDAS)) {
    fallar(`no se encuentra ${RUTA_BASE_BOVEDAS} -- confirma que Drive for Desktop tiene sincronizada de verdad bovedas.claude antes de continuar`);
  }

  console.log(`=== 1/2 Leyendo la página pendiente real "${archivo}" de la cola ===`);
  const r = await fetch(`${URL_MEMORIA}/api/pagina_pendiente?archivo=${encodeURIComponent(archivo)}`);
  if (!r.ok) fallar((await r.json()).error || `no se encontró "${archivo}" en la cola real (¿ya se aplicó con aplicar_pagina_arquitecto.mjs? ese script borra la entrada al terminar -- ejecuta siempre este script ANTES)`);
  const entrada = await r.json();

  if (!entrada.markdown) {
    console.log('\nEsta página real no lleva nota gemela de Obsidian en la cola (no se generó al construirla/reconstruirla) -- nada que aplicar. Continúa con aplicar_pagina_arquitecto.mjs.');
    return;
  }

  const carpetaCampana = slugCampana(entrada.markdown.campanaNombre);
  const { rutaCampana, rutaIndice } = asegurarBovedaCampana(carpetaCampana);

  // §8.151: forma real "carpeta por catalogo/tipo" (construir_html_desde_arbol.mjs) --
  // entrada.markdown.indicePagina es la nota-indice real de la PROPIA pagina (suelta en
  // la carpeta de la Campaña, nunca su propia carpeta); entrada.markdown.notas es un
  // array real de notas de Caja, cada una con SU PROPIA subcarpeta real (el tipo/catalogo
  // real al que pertenece esa caja -- puede repetirse entre paginas reales distintas, es
  // la carpeta compartida de ese catalogo). La forma real de siempre (una unica nota por
  // pagina, archivoMd/contenido sueltos, sin catalogo) sigue igual para el flujo real ya
  // existente de Arquitecto -- nunca se toca sin pedirlo explicito.
  if (Array.isArray(entrada.markdown.notas)) {
    const { indicePagina, notas } = entrada.markdown;
    if (!indicePagina || !notas.length) fallar('markdown real mal formado -- falta indicePagina o notas viene vacío');

    console.log(`\n=== 2/2 Aplicando ${1 + notas.length} nota(s) real(es) en bovedas.claude/${carpetaCampana}/ ===`);
    const rutaIndicePagina = join(rutaCampana, indicePagina.archivoMd);
    writeFileSync(rutaIndicePagina, indicePagina.contenido, 'utf-8');
    console.log(`  Creada/actualizada de verdad: ${rutaIndicePagina}`);
    anadirAlIndiceSiFalta(rutaIndice, indicePagina.archivoMd.replace(/\.md$/, ''));

    for (const nota of notas) {
      if (!nota.subcarpeta) fallar('nota real de caja sin subcarpeta (tipo/catálogo) -- "' + nota.archivoMd + '"');
      const carpetaTipo = slugCampana(nota.subcarpeta);
      const rutaIndiceTipo = asegurarCarpetaTipo(rutaCampana, carpetaTipo);
      const rutaNota = join(rutaCampana, carpetaTipo, nota.archivoMd);
      const yaExistia = existsSync(rutaNota);
      writeFileSync(rutaNota, nota.contenido, 'utf-8');
      anadirAlIndiceSiFalta(rutaIndiceTipo, nota.archivoMd.replace(/\.md$/, ''));
      console.log(`  ${yaExistia ? 'Actualizada' : 'Creada'} de verdad: ${rutaNota}`);
    }
    console.log('\nAhora ejecuta node aplicar_pagina_arquitecto.mjs ' + archivo + ' para aplicar el HTML real y limpiar la cola.');
    return;
  }

  const { archivoMd, contenido } = entrada.markdown;
  console.log(`\n=== 2/2 Aplicando la nota real en bovedas.claude/${carpetaCampana}/${archivoMd} ===`);
  const rutaNota = join(rutaCampana, archivoMd);
  const yaExistia = existsSync(rutaNota);
  writeFileSync(rutaNota, contenido, 'utf-8');
  anadirAlIndiceSiFalta(rutaIndice, archivoMd.replace(/\.md$/, ''));

  console.log(`\n${yaExistia ? 'Actualizada' : 'Creada'} de verdad: ${rutaNota}`);
  console.log('Ahora ejecuta node aplicar_pagina_arquitecto.mjs ' + archivo + ' para aplicar el HTML real y limpiar la cola.');
}

main().catch((e) => fallar(e.message));
