#!/usr/bin/env node
/*
 * Ficha de prompt real (§8.97, PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md) -- el
 * mecanismo que hace segura la delegacion a un worker (local o externo) que ya
 * llevabamos toda la sesion citando ("delegable con Puerta Humana") sin construir nunca.
 *
 * Ciclo real, nunca saltado: Claude selecciona una tarea real del backlog (CORE), la
 * prueba de verdad, registra la evidencia genuina (que funciono, que fallo) -- y SOLO
 * entonces esta funcion escribe la ficha. Nunca se declara "Probado" sin una prueba real
 * detras -- si no hay evidencia, el estado real es "Borrador".
 *
 * Uso (JSON via stdin, evita escapar comillas en la shell):
 *   node crear_ficha_prompt.mjs < ficha.json
 *
 * Forma real esperada del JSON de entrada:
 * {
 *   "id": "extractor_por_tipo",
 *   "titulo": "Escribir un extractor mapear_grafo_por_tipo.mjs",
 *   "tarea": "TAR-0002/0003/0004",
 *   "workerDestino": "local-codigo (devstral-dev)",
 *   "estado": "Probado",
 *   "prompt": "...",
 *   "funciono": ["..."],
 *   "fallo": ["..."],
 *   "probadoEn": "2026-09-04",
 *   "probadoPor": "Claude (sesion real)"
 * }
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const RUTA = join(DIR_VISOR, 'fichas_prompt.json');
const ESTADOS_REALES = ['Borrador', 'Probado', 'Listo para delegar'];

function main() {
  const entrada = JSON.parse(readFileSync(0, 'utf-8'));
  const { id, titulo, tarea, workerDestino, estado, prompt } = entrada;
  if (!id || !titulo || !prompt || !estado) {
    console.error('Faltan campos reales obligatorios: id, titulo, prompt, estado.');
    process.exit(1);
  }
  if (!ESTADOS_REALES.includes(estado)) {
    console.error('Estado desconocido: ' + estado + ' (validos: ' + ESTADOS_REALES.join(', ') + ')');
    process.exit(1);
  }
  if (estado !== 'Borrador' && !(entrada.funciono || []).length && !(entrada.fallo || []).length) {
    console.error('Un estado distinto de Borrador necesita evidencia real (funciono/fallo) -- no se declara probado sin prueba.');
    process.exit(1);
  }

  const datos = existsSync(RUTA) ? JSON.parse(readFileSync(RUTA, 'utf-8')) : { fichas: {} };
  datos.fichas[id] = {
    id, titulo, tarea: tarea || null, workerDestino: workerDestino || null, estado,
    prompt, funciono: entrada.funciono || [], fallo: entrada.fallo || [],
    probadoEn: entrada.probadoEn || null, probadoPor: entrada.probadoPor || null,
    actualizadoEn: new Date().toISOString(),
  };
  writeFileSync(RUTA, JSON.stringify(datos, null, 2), 'utf-8');
  console.log('Ficha de prompt real escrita: ' + titulo + ' [' + estado + ']');
}

main();
