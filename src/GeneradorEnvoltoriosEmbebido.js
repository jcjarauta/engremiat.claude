/**
 * GeneradorEnvoltoriosEmbebido.js -- Fase 3 (Aprovisionamiento): puerto a
 * Apps Script de la parte pura (sin fs/path de Node) de
 * tools/packager/generate-shell-wrappers.mjs, para poder generar el
 * Codigo.js de un cliente nuevo en tiempo de ejecución, dentro del propio
 * Spreadsheet, sin pasar por clasp.
 *
 * A diferencia del original, aquí no se leen ficheros de disco: el llamador
 * (subirContenidoScript_ en AprovisionamientoService.js) obtiene el código
 * fuente del proyecto maestro vía script.projects.getContent y lo pasa como
 * lista de {path, module, content}. El mapa módulo->fichero viene de
 * PACKAGE_MAP_EMBEBIDO (ver PackageMapEmbebido.js, generado desde
 * tools/packager/package-map.json por generate-package-map-embebido.mjs).
 *
 * Las funciones de extracción (maskCommentsOnly, extractMenuEntries,
 * extractGoogleScriptRunTargets, etc.) son copia funcional del original --
 * mismo comportamiento carácter a carácter, solo se ha quitado el
 * import/export de módulos ES (aquí todo es global, como es habitual en
 * Apps Script).
 */

var SIMPLE_TRIGGER_NAMES_EMBEBIDO_ = { onOpen: true, onEdit: true, doPost: true };

// Ver FUNCIONES_QUE_RECIBEN_MODULOS_INSTALADOS en generate-shell-wrappers.mjs:
// mismo criterio, misma lista.
var FUNCIONES_QUE_RECIBEN_MODULOS_INSTALADOS_ = { onOpen: true, abrirInstalarEstructuraInicial: true, moduloGanttInstalado: true, abrirMapaSheet: true, abrirInformes: true, abrirProteccionHojas: true, abrirImportacionMasivaInicio: true, instalarStagingImportacionMasiva: true, generarTodasLasPlantillasImportacionMasiva: true };

/*
 * activarSondeoBotOperativo necesita ScriptApp.newTrigger/PropertiesService
 * del proyecto CLIENTE (ver WebhookTelegramService.js -- ni PropertiesService
 * ni los disparadores creados desde código de librería afectan al proyecto
 * que la invoca). Cuerpo completo generado a mano, no un simple reenvío --
 * junto con sondearTelegramBotOperativo (el handler del disparador, nunca
 * referenciado desde un menú/google.script.run, así que se genera siempre
 * que se genera activarSondeoBotOperativo). Ver
 * FUNCIONES_ACTIVACION_SONDEO_TELEGRAM en generate-shell-wrappers.mjs.
 */
var FUNCIONES_ACTIVACION_SONDEO_TELEGRAM_ = { activarSondeoBotOperativo: true };

function compararRutasCanonicas_(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function resolverCierreModulos_(modulosPedidos, moduleDependencies) {
  var cierre = {};
  function visitar(nombreModulo) {
    if (cierre[nombreModulo]) return;
    cierre[nombreModulo] = true;
    (moduleDependencies[nombreModulo] || []).forEach(visitar);
  }
  modulosPedidos.forEach(visitar);
  return cierre;
}

/**
 * Idéntico a maskCommentsOnly en generate-shell-wrappers.mjs: blanquea
 * comentarios de línea/bloque dejando las strings intactas (a diferencia
 * de maskNonCode en build-packages.mjs).
 */
function enmascararComentarios_(sourceText) {
  var output = sourceText.split('');
  var state = 'code';
  var escaped = false;
  for (var index = 0; index < sourceText.length; index += 1) {
    var current = sourceText[index];
    var next = sourceText[index + 1];
    if (state === 'code') {
      if (current === '/' && next === '/') { output[index] = output[index + 1] = ' '; state = 'line-comment'; index += 1; }
      else if (current === '/' && next === '*') { output[index] = output[index + 1] = ' '; state = 'block-comment'; index += 1; }
      else if (current === "'") state = 'single-string';
      else if (current === '"') state = 'double-string';
      else if (current === '`') state = 'template-literal';
      continue;
    }
    if (state === 'line-comment') {
      if (current === '\n') state = 'code';
      else output[index] = ' ';
      continue;
    }
    if (state === 'block-comment') {
      if (current === '*' && next === '/') { output[index] = output[index + 1] = ' '; state = 'code'; index += 1; }
      else if (current !== '\n' && current !== '\r') output[index] = ' ';
      continue;
    }
    if (escaped) { escaped = false; continue; }
    if (current === '\\') { escaped = true; continue; }
    if ((state === 'single-string' && current === "'") ||
        (state === 'double-string' && current === '"') ||
        (state === 'template-literal' && current === '`')) state = 'code';
  }
  return output.join('');
}

function extraerScriptsInline_(htmlSource) {
  var regex = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/giu;
  var blocks = [];
  var match;
  while ((match = regex.exec(htmlSource))) {
    blocks.push({ content: match[1], offset: match.index + match[0].indexOf(match[1]) });
  }
  return blocks;
}

function lineaEn_(sourceText, index) {
  return sourceText.slice(0, index).split('\n').length;
}

function lineaDeMatch_(sourceText, match) {
  return lineaEn_(sourceText, match.index) + (match[0].indexOf('\n') === 0 ? 1 : 0);
}

function extraerEntradasMenu_(jsSource) {
  var masked = enmascararComentarios_(jsSource);
  var regex = /\.addItem\s*\(\s*(['"])((?:(?!\1).)*)\1\s*,\s*(['"])([a-zA-Z_][a-zA-Z0-9_]*)\3\s*\)/gu;
  var entries = [];
  var match;
  while ((match = regex.exec(masked))) {
    entries.push({ label: match[2], functionName: match[4], line: lineaEn_(jsSource, match.index) });
  }
  return entries;
}

var NOMBRES_HANDLER_EMBEBIDO_ = { withSuccessHandler: true, withFailureHandler: true };
var IDENTIFICADOR_INICIO_RE_ = /^[a-zA-Z_][a-zA-Z0-9_]*/u;

function saltarLiteralCadena_(source, quoteIndex) {
  var quote = source[quoteIndex];
  var index = quoteIndex + 1;
  while (index < source.length) {
    if (source[index] === '\\') { index += 1; }
    else if (source[index] === quote) return index;
    index += 1;
  }
  return index;
}

function encontrarParentesisCierre_(source, openIndex) {
  var depth = 0;
  for (var index = openIndex; index < source.length; index += 1) {
    var char = source[index];
    if (char === "'" || char === '"' || char === '`') { index = saltarLiteralCadena_(source, index); continue; }
    if (char === '(') depth += 1;
    else if (char === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function saltarEspacios_(source, index) {
  var cursor = index;
  while (cursor < source.length && /\s/u.test(source[cursor])) cursor += 1;
  return cursor;
}

function extraerObjetivosGoogleScriptRun_(jsSource) {
  var masked = enmascararComentarios_(jsSource);
  var anchor = 'google.script.run';
  var entries = [];
  var searchFrom = 0;

  while (true) {
    var anchorIndex = masked.indexOf(anchor, searchFrom);
    if (anchorIndex === -1) break;
    searchFrom = anchorIndex + anchor.length;

    var cursor = anchorIndex + anchor.length;
    var targetName = null;

    while (true) {
      cursor = saltarEspacios_(masked, cursor);
      if (masked[cursor] !== '.') break;
      cursor = saltarEspacios_(masked, cursor + 1);

      var nameMatch = IDENTIFICADOR_INICIO_RE_.exec(masked.slice(cursor));
      if (!nameMatch) break;
      var name = nameMatch[0];
      cursor = saltarEspacios_(masked, cursor + name.length);

      if (masked[cursor] !== '(') break;
      var closeParen = encontrarParentesisCierre_(masked, cursor);
      if (closeParen === -1) break;

      if (NOMBRES_HANDLER_EMBEBIDO_[name]) {
        cursor = closeParen + 1;
        continue;
      }

      targetName = name;
      break;
    }

    if (targetName) entries.push({ functionName: targetName, line: lineaEn_(jsSource, anchorIndex) });
  }

  return entries;
}

function extraerTriggersSimples_(jsSource) {
  var masked = enmascararComentarios_(jsSource);
  var regex = /(?:^|\n)[ \t]*function\s+(onOpen|onEdit|doPost)\s*\(/gu;
  var entries = [];
  var match;
  while ((match = regex.exec(masked))) {
    entries.push({ functionName: match[1], line: lineaDeMatch_(jsSource, match) });
  }
  return entries;
}

function encontrarLineasDeclaracionFuncion_(jsSource, functionName) {
  var masked = enmascararComentarios_(jsSource);
  var escaped = functionName.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  var regex = new RegExp('(?:^|\\n)[ \\t]*function\\s+' + escaped + '\\s*\\(', 'gu');
  var lines = [];
  var match;
  while ((match = regex.exec(masked))) {
    lines.push(lineaDeMatch_(jsSource, match));
  }
  return lines;
}

function recolectarPuntosEntradaFichero_(file) {
  var points = [];
  if (file.path.slice(-3) === '.js') {
    extraerEntradasMenu_(file.content).forEach(function (entry) {
      points.push({ kind: 'menu', functionName: entry.functionName, line: entry.line, label: entry.label, sourcePath: file.path });
    });
    extraerTriggersSimples_(file.content).forEach(function (entry) {
      points.push({ kind: 'trigger', functionName: entry.functionName, line: entry.line, sourcePath: file.path });
    });
  } else if (file.path.slice(-5) === '.html') {
    extraerScriptsInline_(file.content).forEach(function (block) {
      var blockStartLine = lineaEn_(file.content, block.offset);
      extraerObjetivosGoogleScriptRun_(block.content).forEach(function (entry) {
        points.push({ kind: 'run', functionName: entry.functionName, line: blockStartLine - 1 + entry.line, sourcePath: file.path });
      });
    });
  }
  return points;
}

function localizarDeclaraciones_(functionName, aFiles) {
  var found = [];
  aFiles.forEach(function (file) {
    if (file.path.slice(-3) !== '.js' && file.path.slice(-5) !== '.html') return;
    var searchSources = file.path.slice(-5) === '.html'
      ? extraerScriptsInline_(file.content).map(function (block) { return block.content; })
      : [file.content];
    searchSources.forEach(function (source) {
      encontrarLineasDeclaracionFuncion_(source, functionName).forEach(function (line) {
        found.push({ path: file.path, module: file.module, line: line });
      });
    });
  });
  return found;
}

/**
 * aFiles: [{path, module, content}] -- SOLO ficheros de package A (los que
 * viven en la librería CORE), tal como los expone PACKAGE_MAP_EMBEBIDO.
 * modulos: array de nombres de módulo pedidos (p.ej. ['CORE','GANTT']).
 */
function resolverPlanEnvoltorios_(aFiles, modulos) {
  var moduleDependencies = PACKAGE_MAP_EMBEBIDO.moduleDependencies;

  var desconocidos = modulos.filter(function (m) { return !(m in moduleDependencies); });
  if (desconocidos.length > 0) {
    throw new Error('RESOLVER_PLAN_ENVOLTORIOS_ERROR: modulo(s) desconocido(s): ' + desconocidos.join(','));
  }

  var cierreModulos = resolverCierreModulos_(modulos, moduleDependencies);
  var ficherosCierre = aFiles
    .filter(function (file) { return cierreModulos[file.module]; })
    .sort(function (a, b) { return compararRutasCanonicas_(a.path, b.path); });

  var porNombre = {};
  ficherosCierre.forEach(function (file) {
    recolectarPuntosEntradaFichero_(file).forEach(function (point) {
      if (!porNombre[point.functionName]) porNombre[point.functionName] = { functionName: point.functionName, kinds: {}, references: [] };
      var bucket = porNombre[point.functionName];
      bucket.kinds[point.kind] = true;
      bucket.references.push({ sourcePath: point.sourcePath, line: point.line, label: point.label || null });
    });
  });

  var nombres = Object.keys(porNombre).sort(compararRutasCanonicas_);
  var entries = nombres.map(function (name) {
    var bucket = porNombre[name];
    var declaraciones = localizarDeclaraciones_(name, aFiles);
    var status;
    var owner = null;
    if (declaraciones.length === 0) {
      status = 'UNRESOLVED';
    } else if (declaraciones.length > 1) {
      status = 'DUPLICATE_DECLARATION';
      owner = declaraciones;
    } else {
      owner = declaraciones[0];
      status = cierreModulos[owner.module] ? 'INCLUDED' : 'EXCLUDED_MODULE_GAP';
    }
    return {
      functionName: name,
      kinds: Object.keys(bucket.kinds).sort(compararRutasCanonicas_),
      isTrigger: !!SIMPLE_TRIGGER_NAMES_EMBEBIDO_[name],
      references: bucket.references.sort(function (a, b) {
        return compararRutasCanonicas_(a.sourcePath, b.sourcePath) || (a.line - b.line);
      }),
      status: status,
      owner: owner
    };
  });

  return {
    requestedModules: modulos.slice().sort(compararRutasCanonicas_),
    resolvedModules: Object.keys(cierreModulos).sort(compararRutasCanonicas_),
    closureFiles: ficherosCierre.map(function (f) { return f.path; }),
    entries: entries,
    wrappers: entries.filter(function (e) { return e.status === 'INCLUDED'; }).map(function (e) { return e.functionName; }).sort(compararRutasCanonicas_),
    gaps: entries.filter(function (e) { return e.status !== 'INCLUDED'; })
  };
}

function pushWrapperBody_(lines, name, userSymbol) {
  if (name === 'doPost') {
    lines.push('function doPost(e) {');
    lines.push('  var tokenTelegram = PropertiesService.getScriptProperties().getProperty(\'TELEGRAM_BOT_TOKEN\');');
    lines.push('  return ' + userSymbol + '.doPost(e, tokenTelegram);');
    lines.push('}');
    lines.push('');
    return;
  }
  if (FUNCIONES_ACTIVACION_SONDEO_TELEGRAM_[name]) {
    lines.push('function activarSondeoBotOperativo() {');
    lines.push('  var ui = SpreadsheetApp.getUi();');
    lines.push('  var token = PropertiesService.getScriptProperties().getProperty(\'TELEGRAM_BOT_TOKEN\');');
    lines.push('  if (!token) {');
    lines.push('    ui.alert(\'Falta configurar TELEGRAM_BOT_TOKEN en Propiedades del script antes de esto.\');');
    lines.push('    return;');
    lines.push('  }');
    lines.push('  ' + userSymbol + '.eliminarWebhookTelegram(token);');
    lines.push('  var yaInstalado = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === \'sondearTelegramBotOperativo\'; });');
    lines.push('  if (!yaInstalado) ScriptApp.newTrigger(\'sondearTelegramBotOperativo\').timeBased().everyMinutes(1).create();');
    lines.push('  ui.alert(\'Sondeo activado\', \'Webhook eliminado. Sondeo cada 1 minuto \' + (yaInstalado ? \'(el disparador ya existía).\' : \'(disparador creado).\'), ui.ButtonSet.OK);');
    lines.push('}');
    lines.push('');
    lines.push('function sondearTelegramBotOperativo() {');
    lines.push('  var props = PropertiesService.getScriptProperties();');
    lines.push('  var token = props.getProperty(\'TELEGRAM_BOT_TOKEN\');');
    lines.push('  var offsetActual = parseInt(props.getProperty(\'TELEGRAM_OFFSET_ACTUALIZACIONES\') || \'0\', 10);');
    lines.push('  var resultado = ' + userSymbol + '.sondearActualizacionesTelegram(token, offsetActual);');
    lines.push('  if (resultado && resultado.offsetNuevo !== undefined) props.setProperty(\'TELEGRAM_OFFSET_ACTUALIZACIONES\', String(resultado.offsetNuevo));');
    lines.push('}');
    lines.push('');
    return;
  }
  lines.push('function ' + name + '() {');
  if (FUNCIONES_QUE_RECIBEN_MODULOS_INSTALADOS_[name]) lines.push('  return ' + userSymbol + '.' + name + '(MODULOS_INSTALADOS_CLIENTE);');
  else lines.push('  return ' + userSymbol + '.' + name + '.apply(null, arguments);');
  lines.push('}');
  lines.push('');
}

function renderizarEnvoltorios_(plan, userSymbol) {
  var lines = [
    '/**',
    ' * Generado por GeneradorEnvoltoriosEmbebido.js (Fase 3 -- Aprovisionamiento) -- NO editar a mano.',
    ' * Módulos solicitados: ' + plan.requestedModules.join(', '),
    ' * Módulos resueltos (cierre transitivo): ' + plan.resolvedModules.join(', '),
    ' * Cada función reenvía la llamada a la librería sin conocer su lógica interna.',
    ' * MODULOS_INSTALADOS_CLIENTE la lee moduloInstalado_() en la librería CORE',
    ' * (FormularioMotorUI.js) para condicionar los bloques de onOpen() a los',
    ' * módulos realmente instalados en este cliente.',
    ' */',
    '',
    'var MODULOS_INSTALADOS_CLIENTE = ' + JSON.stringify(plan.resolvedModules) + ';',
    ''
  ];

  // Triggers simples (onOpen/onEdit) primero y aparte del resto -- ver
  // conversación: al abrir un sheet recién montado, son lo primero que
  // hay que localizar (onOpen construye el menú), y enterrados por orden
  // alfabético entre 300+ envoltorios cuesta encontrarlos.
  var triggers = plan.wrappers.filter(function (name) { return SIMPLE_TRIGGER_NAMES_EMBEBIDO_[name]; });
  var resto = plan.wrappers.filter(function (name) { return !SIMPLE_TRIGGER_NAMES_EMBEBIDO_[name]; });
  if (triggers.length > 0) {
    lines.push('// --- Triggers simples (onOpen/onEdit) ---', '');
    triggers.forEach(function (name) { pushWrapperBody_(lines, name, userSymbol); });
    lines.push('// --- Resto de envoltorios (orden alfabético) ---', '');
  }
  resto.forEach(function (name) { pushWrapperBody_(lines, name, userSymbol); });

  return (lines.join('\n')).replace(/\n+$/u, '\n');
}

/**
 * Punto de entrada usado por subirContenidoScript_. aFiles debe venir ya
 * filtrado a package A (ver PACKAGE_MAP_EMBEBIDO.entriesPackageA) con el
 * contenido real obtenido de script.projects.getContent.
 */
function generarEnvoltoriosParaModulos_(aFiles, modulos, userSymbol) {
  var plan = resolverPlanEnvoltorios_(aFiles, modulos);
  return {
    codigo: renderizarEnvoltorios_(plan, userSymbol),
    plan: plan
  };
}
