#!/usr/bin/env node
/*
 * §8.149: primer paso real del "sistema acoplable" -- construye el HTML de una página
 * real directamente desde su árbol real del Sheet (Proceso→Caja, Tarea→Función), en vez
 * de que el operador teclee el contenido de cada caja a mano en Arquitecto. Deliberado
 * y explícito, confirmado antes de escribir código: "en un primer momento no quiero
 * escribir los datos de las tareas [...] la idea es que estas páginas, cajas,
 * funciones... las pueda reutilizar en otros proyectos, la idea de un sistema
 * acoplable" -- este script NUNCA deriva contenido real del NOMBRE de la Tarea (nunca
 * "escribe el dato"), solo RESUELVE qué Caja/Función reutilizable es cada Proceso/Tarea
 * real, por su NOMBRE, contra el catálogo real de /api/cajas_reutilizables y
 * /api/funciones_reutilizables (servidor_memoria.mjs, mismo fichero real que las
 * plantillas de página completa de §8.136 -- un catálogo nuevo, un escalón más abajo).
 *
 * Un Proceso/Tarea real sin match en el catálogo NO es un error -- se avisa honesto y
 * se usa el valor por defecto real (layout/tipoPieza más simple), nunca se inventa uno.
 *
 * Este script NUNCA escribe en real por sí solo -- guarda el HTML generado en un
 * fichero local para revisión (mismo criterio de Puerta Humana de siempre). Con
 * --encolar, además lo deja en la cola real de /api/pagina_pendiente para que
 * aplicar_pagina_arquitecto.mjs lo aplique como cualquier otra página real.
 *
 * Uso:
 *   node construir_html_desde_arbol.mjs <ID real de la página, ej. PRD-0013>
 *   node construir_html_desde_arbol.mjs PRD-0013 --encolar
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const URL_MEMORIA = 'http://100.107.171.88:9330';

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(readFileSync(join(DIR_VISOR, 'generador_paginas.js'), 'utf-8'), ctx);

function fallar(mensaje) {
  console.error('ERROR: ' + mensaje);
  process.exit(1);
}

function normalizar(nombre) {
  return String(nombre || '').trim().toLowerCase();
}

// Busca en el catalogo real (objeto {id: {etiqueta, ...}}) una entrada cuya etiqueta real
// coincida (normalizada) con el nombre real del Proceso/Tarea -- nunca coincidencia
// parcial/adivinada, solo exacta (una vez normalizada), para no resolver mal por error.
function buscarEnCatalogo(catalogo, nombreReal) {
  const buscado = normalizar(nombreReal);
  for (const id of Object.keys(catalogo || {})) {
    if (normalizar(catalogo[id].etiqueta) === buscado) return catalogo[id];
  }
  return null;
}

async function main() {
  const paginaId = process.argv[2];
  const encolar = process.argv.includes('--encolar');
  if (!paginaId) fallar('falta el id real de la página, ej.: node construir_html_desde_arbol.mjs PRD-0013');

  console.log('=== 1/4 Leyendo el árbol real y los catálogos reales de Caja/Función reutilizables ===');
  const [j, resCajas, resFunciones] = await Promise.all([
    fetch(URL_MEMORIA + '/api/jerarquia_campanas').then((r) => r.json()),
    fetch(URL_MEMORIA + '/api/cajas_reutilizables').then((r) => r.json()),
    fetch(URL_MEMORIA + '/api/funciones_reutilizables').then((r) => r.json()),
  ]);
  const catalogoCajas = resCajas.cajas || {};
  const catalogoFunciones = resFunciones.funciones || {};
  console.log(`  ${Object.keys(catalogoCajas).length} caja(s) real(es) en el catálogo, ${Object.keys(catalogoFunciones).length} función(es) real(es) en el catálogo.`);

  const tipo = ctx.tipoPorPrefijoId(paginaId);
  if (!tipo) fallar('no se reconoce el tipo real de "' + paginaId + '" (prefijo de id desconocido)');
  const hallazgo = ctx.buscarNodoEnArbol(j, paginaId);
  if (!hallazgo) fallar('no se encontró "' + paginaId + '" en el árbol real');
  const m = /\(([\w.-]+\.html)\)/.exec(hallazgo.nodo.nombre || '');
  if (!m) fallar('"' + paginaId + '" (' + hallazgo.nodo.nombre + ') no sigue la convención real "(archivo.html)" -- no es una página real');
  const archivo = m[1];
  const nombrePagina = hallazgo.nodo.nombre.replace(/\s*\([\w.-]+\.html\)\s*$/, '');

  const tipoCaja = ctx.tipoCajaPara(tipo);
  const tipoFuncion = ctx.tipoFuncionPara(tipo);
  const hijosCaja = hallazgo.nodo.hijos || [];
  console.log(`\n=== 2/4 Resolviendo ${hijosCaja.length} caja(s) real(es) [${paginaId} -- ${nombrePagina}, tipo ${tipo}] ===`);

  let cajasSinCatalogar = 0, funcionesSinCatalogar = 0;
  const cajas = hijosCaja.map((hijoCaja) => {
    const entradaCaja = buscarEnCatalogo(catalogoCajas, hijoCaja.nombre);
    if (!entradaCaja) cajasSinCatalogar++;
    console.log(`  - [${hijoCaja.id}] "${hijoCaja.nombre}" -> ${entradaCaja ? 'catalogada' : 'SIN catalogar (layout por defecto)'}`);

    let piezas;
    if (!tipoFuncion) {
      // Sin nivel real de Funcion por debajo (ej. pagina-Proceso, cuya Caja=Tarea ya es
      // la hoja del Sheet) -- una unica pieza generica, honesta, sin datos.
      piezas = [{ tipo: 'lista', contenido: [] }];
    } else {
      const hijosFuncion = hijoCaja.hijos || [];
      // Agrupa Funciones reales consecutivas del mismo tipoPieza real en UNA pieza --
      // el orden real del Sheet decide el orden de las piezas, nunca se reordena.
      const grupos = [];
      for (const hijoFuncion of hijosFuncion) {
        const entradaFuncion = buscarEnCatalogo(catalogoFunciones, hijoFuncion.nombre);
        if (!entradaFuncion) funcionesSinCatalogar++;
        const tipoPieza = (entradaFuncion && entradaFuncion.tipoPieza) || 'lista';
        const etiquetaReal = (entradaFuncion && entradaFuncion.etiqueta) || hijoFuncion.nombre;
        console.log(`      · [${hijoFuncion.id}] "${hijoFuncion.nombre}" -> ${entradaFuncion ? 'función real: ' + tipoPieza : 'SIN catalogar (lista por defecto)'}`);
        const ultimo = grupos[grupos.length - 1];
        // TODO real honesto: nunca el dato de verdad de la funcion (label/URL/valor),
        // solo una referencia legible a que funcion real ocupa ese hueco.
        const linea = 'TODO real (' + etiquetaReal + ')';
        if (ultimo && ultimo.tipo === tipoPieza) ultimo.contenido.push(linea);
        else grupos.push({ tipo: tipoPieza, contenido: [linea] });
      }
      piezas = grupos.length ? grupos : [{ tipo: 'lista', contenido: [] }];
    }

    return {
      nombre: hijoCaja.nombre,
      cabecera: (entradaCaja && entradaCaja.cabecera) || '',
      pie: (entradaCaja && entradaCaja.pie) || '',
      layoutInterno: (entradaCaja && entradaCaja.layoutInterno) || 'una-columna',
      columnaInicio: 1, ancho: 1,
      piezas,
    };
  });

  if (!cajas.length) fallar('"' + paginaId + '" no tiene ninguna caja real (' + (tipoCaja || 'sin tipo de caja real') + ') todavía -- nada que construir');

  console.log(`\n=== 3/4 Generando el HTML real (${cajasSinCatalogar} caja(s) y ${funcionesSinCatalogar} función(es) sin catalogar -- layout por defecto, honesto) ===`);
  const colgarDeMatch = /colgada de (\S+)/.exec((await (await fetch(URL_MEMORIA + '/api/ficha?tipo=' + encodeURIComponent(tipo.toUpperCase()) + '&id=' + encodeURIComponent(paginaId))).json()).campos.DESCRIPCION || '');
  const colgarDe = colgarDeMatch ? colgarDeMatch[1] : 'home.html';
  const html = ctx.generarHtmlReal(nombrePagina, cajas, colgarDe, 'una-columna');

  const rutaLocal = join(DIR_VISOR, archivo.replace(/\.html$/, '.desde_arbol.html'));
  writeFileSync(rutaLocal, html, 'utf-8');
  console.log('  Guardado real para revisión: ' + rutaLocal);

  if (encolar) {
    console.log('\n=== 4/4 Encolando real (--encolar) ===');
    const r = await fetch(URL_MEMORIA + '/api/pagina_pendiente', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productoId: paginaId, nombre: nombrePagina, archivo, colgarDe, nombreColgarDe: colgarDe, html, reconstruccion: true, markdown: null }),
    });
    if (!r.ok) fallar('no se pudo encolar de verdad: ' + (await r.json()).error);
    console.log('  Encolada real: ' + archivo + ' -- ejecuta node aplicar_pagina_arquitecto.mjs ' + archivo + ' para aplicarla.');
  } else {
    console.log('\n=== 4/4 (omitido -- pasa --encolar para aplicarla de verdad, revisa antes el fichero local) ===');
  }
}

main().catch((e) => fallar(e.message));
