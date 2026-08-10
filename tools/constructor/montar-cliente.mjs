#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  EXIT_CODES,
  readPackageMap,
  validateAndReadFiles,
  validatePackageMap,
} from '../packager/build-packages.mjs';
import { renderWrapperStubs, resolveWrapperPlan } from '../packager/generate-shell-wrappers.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1'));
const CLIENTES_PATH = path.join(HERE, 'clientes.json');
const LIBRERIA_PATH = path.join(HERE, 'libreria.json');

class ConstructorError extends Error {
  constructor(message, exitCode) {
    super(message);
    this.exitCode = exitCode;
  }
}

/*
 * Nivel 1 (autoservicio de módulos estándar, ver conversación --
 * "automatizar preventas con la mínima fricción"): todos los clientes
 * de este nivel comparten la MISMA librería ya publicada (libreria.json)
 * -- montar un cliente nunca reconstruye ni redespliega la librería,
 * solo genera el archivo de envoltorios (qué funciones de esa librería
 * quedan accesibles desde su menú) y el appsscript.json que la
 * referencia. Si algún día un cliente necesita lógica propia (Nivel 2,
 * no cubierto aquí), eso exige su propia librería -- fuera de alcance
 * de este comando.
 */

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new ConstructorError(`ERROR_LECTURA_JSON ${path.basename(filePath)}: ${error.message}`, EXIT_CODES.READ);
  }
}

function readClientes() {
  if (!existsSync(CLIENTES_PATH)) return { schemaVersion: 1, clientes: [] };
  return readJson(CLIENTES_PATH);
}

function writeClientes(registro) {
  writeFileSync(CLIENTES_PATH, `${JSON.stringify(registro, null, 2)}\n`, 'utf8');
}

function validarNombreCliente(nombre) {
  if (typeof nombre !== 'string' || nombre.trim() === '') {
    throw new ConstructorError('NOMBRE_VACIO', EXIT_CODES.ARGUMENTS);
  }
  if (!/^[a-zA-Z0-9_-]+$/u.test(nombre)) {
    throw new ConstructorError('NOMBRE_INVALIDO solo se admiten letras, números, guion y guion bajo', EXIT_CODES.ARGUMENTS);
  }
  return nombre;
}

function validarDirectorioSalida(projectRoot, outputValue) {
  if (typeof outputValue !== 'string' || outputValue.trim() === '') {
    throw new ConstructorError('SALIDA_VACIA', EXIT_CODES.UNSAFE_DESTINATION);
  }
  const resolved = path.resolve(projectRoot, outputValue);
  const forbidden = [path.resolve(projectRoot, 'src'), path.resolve(projectRoot, 'tools')];
  if (forbidden.some((zone) => resolved === zone || resolved.startsWith(`${zone}${path.sep}`))) {
    throw new ConstructorError('DESTINO_PROHIBIDO', EXIT_CODES.UNSAFE_DESTINATION);
  }
  if (existsSync(resolved)) {
    throw new ConstructorError('DESTINO_PREEXISTENTE_NO_SE_SOBRESCRIBE', EXIT_CODES.UNSAFE_DESTINATION);
  }
  const parent = path.dirname(resolved);
  if (!existsSync(parent) || !statSync(parent).isDirectory()) {
    throw new ConstructorError('PADRE_DESTINO_INEXISTENTE', EXIT_CODES.UNSAFE_DESTINATION);
  }
  return resolved;
}

export function construirManifiestoCascaron(libreria) {
  return {
    timeZone: libreria.timeZone || 'Europe/Madrid',
    dependencies: {
      libraries: [
        {
          userSymbol: libreria.userSymbol,
          libraryId: libreria.libraryId,
          version: String(libreria.version),
        },
      ],
      // Requerido por LecturaBatchService.js (Sheets.Spreadsheets.Values.batchGet,
      // usado por Kanban/Gantt/Vista del dia): los servicios avanzados no se heredan
      // de la libreria, cada proyecto cliente debe declararlos por su cuenta o la
      // llamada falla con "servicio Google Sheets API no activado".
      enabledAdvancedServices: [
        {
          userSymbol: 'Sheets',
          serviceId: 'sheets',
          version: 'v4',
        },
      ],
    },
    exceptionLogging: 'STACKDRIVER',
    runtimeVersion: 'V8',
  };
}

export function montarCliente({ projectRoot, nombre, modulos, outputDir, libreria, clientesRegistro }) {
  validarNombreCliente(nombre);

  if (clientesRegistro.clientes.some((c) => c.nombre === nombre)) {
    throw new ConstructorError(`NOMBRE_YA_REGISTRADO ${nombre}`, EXIT_CODES.CONTRACT);
  }

  const map = readPackageMap();
  const mapErrors = validatePackageMap(map);
  if (mapErrors.length > 0) throw new ConstructorError(mapErrors[0], EXIT_CODES.CONTRACT);

  const validated = validateAndReadFiles(projectRoot, map);
  if (validated.errors.length > 0) throw new ConstructorError(validated.errors[0], EXIT_CODES.CONTRACT);

  const aFiles = validated.validatedFiles.filter((entry) => entry.package === 'A');
  const plan = resolveWrapperPlan({ map, aFiles, modules: modulos });

  const resolved = validarDirectorioSalida(projectRoot, outputDir);
  mkdirSync(resolved, { recursive: true });
  writeFileSync(path.join(resolved, 'Codigo.js'), renderWrapperStubs(plan, libreria.userSymbol), { encoding: 'utf8', flag: 'wx' });
  writeFileSync(
    path.join(resolved, 'appsscript.json'),
    `${JSON.stringify(construirManifiestoCascaron(libreria), null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' },
  );

  const entrada = {
    nombre,
    modulosSolicitados: plan.requestedModules,
    modulosResueltos: plan.resolvedModules,
    envoltoriosGenerados: plan.wrappers.length,
    huecos: plan.gaps.map((gap) => ({ funcion: gap.functionName, estado: gap.status })),
    libreriaId: libreria.libraryId,
    libreriaVersion: String(libreria.version),
    fechaCreacion: new Date().toISOString(),
    estado: 'empaquetado_pendiente_desplegar',
    directorioSalida: path.relative(projectRoot, resolved).split(path.sep).join('/'),
  };

  clientesRegistro.clientes.push(entrada);

  return { plan, outputPath: resolved, entrada };
}

function printHelp(write = console.log) {
  write([
    'Uso:',
    '  node tools/constructor/montar-cliente.mjs --nombre <id> --modulos M1,M2 --output <ruta>',
    '',
    'Empaqueta el cascarón (Codigo.js con envoltorios + appsscript.json) de un cliente',
    'de Nivel 1 (autoservicio de módulos estándar sobre la librería compartida ya',
    'publicada, ver tools/constructor/libreria.json) y lo registra en clientes.json.',
    'No crea recursos de Drive ni ejecuta clasp -- eso queda como paso manual explícito',
    'que se imprime al final.',
    '',
    'Opciones:',
    '  --nombre <id>       Identificador del cliente (letras/números/guion), único en clientes.json.',
    '  --modulos M1,M2     Módulos solicitados; se resuelve su cierre transitivo.',
    '  --output <ruta>     Directorio nuevo donde escribir Codigo.js y appsscript.json.',
    '  --project-root <r>  Raíz del proyecto (por defecto, la raíz del repositorio).',
  ].join('\n'));
}

function parseArgs(argv) {
  if (argv.length === 0) return { helpOnly: true };
  const result = { nombre: null, modulos: null, output: null, projectRoot: null, helpOnly: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--nombre' || arg === '--modulos' || arg === '--output' || arg === '--project-root') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new ConstructorError(`OPCION_INCOMPLETA ${arg}`, EXIT_CODES.ARGUMENTS);
      index += 1;
      if (arg === '--nombre') result.nombre = value;
      if (arg === '--modulos') result.modulos = value.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
      if (arg === '--output') result.output = value;
      if (arg === '--project-root') result.projectRoot = value;
    } else if (arg === '--help' || arg === '-h') {
      if (argv.length !== 1) throw new ConstructorError('HELP_NO_COMBINABLE', EXIT_CODES.ARGUMENTS);
      return { helpOnly: true };
    } else {
      throw new ConstructorError(`ARGUMENTO_DESCONOCIDO ${arg}`, EXIT_CODES.ARGUMENTS);
    }
  }
  if (!result.nombre) throw new ConstructorError('FALTA_NOMBRE', EXIT_CODES.ARGUMENTS);
  if (!result.modulos || result.modulos.length === 0) throw new ConstructorError('FALTA_MODULOS', EXIT_CODES.ARGUMENTS);
  if (!result.output) throw new ConstructorError('FALTA_OUTPUT', EXIT_CODES.ARGUMENTS);
  return result;
}

function logLine(kind, message) {
  console.log(`${kind} ${String(message).replace(/[\r\n]+/gu, ' ')}`);
}

export function main(argv = process.argv.slice(2)) {
  logLine('ENGREMIAT_CONSTRUCTOR_BEGIN', '');
  try {
    const options = parseArgs(argv);
    if (options.helpOnly) {
      printHelp();
      logLine('ENGREMIAT_CONSTRUCTOR_END', 'result=OK mode=help');
      return EXIT_CODES.OK;
    }
    const projectRoot = options.projectRoot ? path.resolve(options.projectRoot) : path.resolve(HERE, '..', '..');
    const libreria = readJson(LIBRERIA_PATH);
    const clientesRegistro = readClientes();

    const { plan, outputPath, entrada } = montarCliente({
      projectRoot,
      nombre: options.nombre,
      modulos: options.modulos,
      outputDir: options.output,
      libreria,
      clientesRegistro,
    });

    writeClientes(clientesRegistro);

    logLine('OK', `cliente=${options.nombre} modulos_resueltos=${plan.resolvedModules.join(',')}`);
    logLine('OK', `envoltorios_generados=${plan.wrappers.length}`);
    for (const gap of plan.gaps) {
      logLine('WARN', `HUECO ${gap.functionName} status=${gap.status}`);
    }
    logLine('OK', `escrito ${outputPath}`);
    logLine('OK', `registrado en ${CLIENTES_PATH}`);
    logLine('NEXT', `cd "${outputPath}" && clasp create --type sheets --title "<nombre visible>" --rootDir .`);
    logLine('NEXT', 'clasp push --force');
    logLine('NEXT', 'abrir el Sheet, aceptar autorización OAuth si se pide, verificar el menú');
    logLine('ENGREMIAT_CONSTRUCTOR_END', 'result=OK');
    return EXIT_CODES.OK;
  } catch (error) {
    const exitCode = error instanceof ConstructorError ? error.exitCode : EXIT_CODES.READ;
    logLine('ERR', error instanceof Error ? error.message : 'ERROR_DESCONOCIDO');
    logLine('ENGREMIAT_CONSTRUCTOR_END', `result=ERR code=${exitCode}`);
    return exitCode;
  }
}

const invokedAsMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedAsMain) process.exitCode = main();
