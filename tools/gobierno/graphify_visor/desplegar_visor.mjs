#!/usr/bin/env node
/*
 * Automatiza el ciclo de despliegue del visor (§8.83: se hizo 5 veces a mano
 * en la misma sesión -- generar grafo, copiar ficheros, recrear contenedor,
 * verificar -- y cada vez cabía el mismo error real ya documentado en
 * PROPUESTA_BASTIDOR_GESTOR_PROYECTOS_ENGREMIAT.md §8.5x: un fichero nuevo
 * sin su línea de montaje en docker-compose.yml da 404 en silencio).
 *
 * En vez de mantener aquí una segunda lista de ficheros (que es justo lo que
 * causó ese bug), este script LEE docker-compose.yml y despliega exactamente
 * los ficheros que ya están declarados como volumen del servicio -- la única
 * fuente real de verdad. Si un fichero nuevo no aparece aquí, es porque
 * falta añadirlo a docker-compose.yml primero (y el propio script te avisa).
 *
 * Pasos reales, en orden:
 *   1. (opcional, --grafo) regenera grafo_visor.json antes de desplegar
 *   2. scp de cada fichero de host declarado como volumen del servicio
 *   3. ssh: docker compose up -d <servicio>  (recreate real -- "restart" NO
 *      recoge volúmenes nuevos, lección ya aprendida varias veces esta sesión)
 *   4. curl de verificación real contra el VPS para cada página .html servida
 *
 * Uso:
 *   node desplegar_visor.mjs                    -- despliega graphify-visor
 *   node desplegar_visor.mjs --grafo             -- + regenera grafo_visor.json antes
 *   node desplegar_visor.mjs --servicio otronombre
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const DIR_VISOR = dirname(fileURLToPath(import.meta.url));
const HOST_VPS = 'root@100.107.171.88';
const CLAVE_SSH = join(homedir(), '.ssh', 'id_ed25519_hetzner_engremiat');
const RUTA_REMOTA = '/root/graphify_visor';

function leerArgs() {
  const args = process.argv.slice(2);
  return {
    regenerarGrafo: args.includes('--grafo'),
    servicio: args.includes('--servicio') ? args[args.indexOf('--servicio') + 1] : 'graphify-visor',
  };
}

// Única fuente real de verdad -- lee docker-compose.yml, no duplica la lista.
function extraerFicherosDelServicio(servicio) {
  const texto = readFileSync(join(DIR_VISOR, 'docker-compose.yml'), 'utf-8');
  const lineas = texto.split('\n');
  const inicioServicio = lineas.findIndex((l) => l.trim() === `${servicio}:`);
  if (inicioServicio === -1) throw new Error(`Servicio '${servicio}' no encontrado en docker-compose.yml`);

  const ficheros = new Set(['docker-compose.yml']);
  for (let i = inicioServicio + 1; i < lineas.length; i++) {
    const l = lineas[i];
    if (/^\s{2}\S/.test(l) && !/^\s{4}/.test(l)) break; // siguiente servicio al mismo nivel
    const m = l.match(/^\s*-\s*\.\/(\S+):\/app\//);
    if (m) ficheros.add(m[1]);
  }
  return [...ficheros];
}

function ejecutar(cmd, args, opciones = {}) {
  console.log('$ ' + cmd + ' ' + args.join(' '));
  execFileSync(cmd, args, { stdio: 'inherit', ...opciones });
}

function main() {
  const { regenerarGrafo, servicio } = leerArgs();

  if (!existsSync(CLAVE_SSH)) throw new Error('No se encuentra la clave SSH real: ' + CLAVE_SSH);

  if (regenerarGrafo) {
    console.log('=== 1/4 Regenerando grafo_visor.json ===');
    ejecutar('node', ['mapear_grafo_visor.mjs'], { cwd: DIR_VISOR });
  } else {
    console.log('=== 1/4 (omitido -- pasa --grafo para regenerar grafo_visor.json antes) ===');
  }

  const declarados = extraerFicherosDelServicio(servicio);
  // Algunos volumenes son server-only a proposito -- secretos (.sheets_credenciales.json,
  // nunca en git) o directorios de datos persistidos (datos_memoria) que solo existen ya
  // creados en el VPS. No son un error: se omiten del scp, nunca se sobrescriben a ciegas.
  const ficheros = declarados.filter((f) => existsSync(join(DIR_VISOR, f)) && statSync(join(DIR_VISOR, f)).isFile());
  const omitidos = declarados.filter((f) => !ficheros.includes(f));
  if (omitidos.length) console.log(`(omitidos, server-only: ${omitidos.join(', ')})`);
  console.log(`\n=== 2/4 Copiando al VPS los ${ficheros.length} ficheros reales declarados para '${servicio}' ===`);
  ejecutar('scp', ['-i', CLAVE_SSH, '-o', 'StrictHostKeyChecking=accept-new', ...ficheros, `${HOST_VPS}:${RUTA_REMOTA}/`], { cwd: DIR_VISOR });

  // up -d recoge volumenes NUEVOS (necesita recreate), pero no basta para un proceso Node
  // ya corriendo (graphify-visor sirve estatico con npx serve, relee el fichero en cada
  // request -- pero memoria-montaje carga servidor_memoria.mjs UNA VEZ en memoria al
  // arrancar; un cambio de codigo sin reiniciar el proceso no tiene efecto real, bug real
  // encontrado en §8.90). restart despues de up -d es idempotente y cubre ambos casos.
  console.log(`\n=== 3/4 Recreando y reiniciando '${servicio}' (up -d + restart, no basta uno solo) ===`);
  ejecutar('ssh', ['-i', CLAVE_SSH, HOST_VPS, `cd ${RUTA_REMOTA} && docker compose up -d ${servicio} && docker compose restart ${servicio}`]);

  console.log('\n=== 4/4 Verificando en real ===');
  const paginas = ficheros.filter((f) => f.endsWith('.html'));
  let huboFallo = false;
  for (const pagina of paginas) {
    const url = `http://100.107.171.88:9320/${pagina}`;
    try {
      const codigo = execFileSync('curl', ['-sL', '-o', 'NUL', '-w', '%{http_code}', url]).toString();
      const ok = codigo === '200';
      if (!ok) huboFallo = true;
      console.log(`  ${ok ? 'OK ' : 'FALLO'} ${codigo}  ${url}`);
    } catch (e) {
      huboFallo = true;
      console.log(`  FALLO (curl no disponible o error de red)  ${url}`);
    }
  }
  if (huboFallo) process.exitCode = 1;
  console.log(huboFallo ? '\nDespliegue con fallos -- revisar arriba.' : '\nDespliegue verificado en real.');
}

main();
