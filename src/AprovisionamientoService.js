/**
 * AprovisionamientoService.gs -- Fase 3 del roadmap: "aprobar -> crear
 * proyecto de Apps Script vinculado" para montar un cliente nuevo sin
 * pasar por clasp/montar-cliente.mjs a mano.
 *
 * Sigue SIN activarse solo: configurarTriggerAprobacionMontaje() no se
 * llama desde ningun instalador. Debe ejecutarla a mano, una vez, la
 * persona autorizada -- ver abrirConfigurarAprovisionamiento().
 *
 * Por que un trigger instalable y no un onEdit(e) mas: los triggers
 * simples corren en AuthMode.LIMITED, que prohibe UrlFetchApp aunque
 * el usuario ya haya autorizado el scope. La llamada a la Apps Script
 * API (script.projects.create) exige AuthMode.FULL, que solo dan los
 * triggers instalables. Ademas evita colisionar con el onEdit(e)
 * simple ya existente en EdicionDirecta.js (Apps Script solo permite
 * una funcion global onEdit por proyecto).
 *
 * El scope de escritura https://www.googleapis.com/auth/script.projects
 * se anade al final, solo cuando el resto (hoja, proteccion, generacion
 * de envoltorios) este probado -- dispara una pantalla de consentimiento
 * OAuth nueva y se acordo aplicarlo en ultimo lugar.
 */

var SOLICITUDES_MONTAJE_HOJA_ = 'SOLICITUDES_MONTAJE';
var SOLICITUDES_MONTAJE_CABECERAS_ = [
  'ID_TEMPORAL', 'NOMBRE', 'MODULOS', 'ESTADO', 'ID_REAL', 'URL',
  'FECHA_CREACION', 'CREADO_POR', 'FECHA_APROBACION', 'APROBADO_POR', 'ERROR'
];
var SOLICITUDES_MONTAJE_PROP_EMAILS_ = 'EMAILS_AUTORIZADOS_MONTAJE';

/**
 * Idempotente: crea la hoja SOLICITUDES_MONTAJE si no existe y asegura
 * que la columna ESTADO este protegida (solo editable por los correos
 * en EMAILS_AUTORIZADOS_MONTAJE). No toca filas si la hoja ya existia.
 */
function instalarHojaSolicitudesMontaje_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(SOLICITUDES_MONTAJE_HOJA_);
  var creadaAhora = false;

  if (!hoja) {
    hoja = ss.insertSheet(SOLICITUDES_MONTAJE_HOJA_);
    hoja.getRange(1, 1, 1, SOLICITUDES_MONTAJE_CABECERAS_.length).setValues([SOLICITUDES_MONTAJE_CABECERAS_]);
    hoja.setFrozenRows(1);
    creadaAhora = true;
  }

  var colEstado = SOLICITUDES_MONTAJE_CABECERAS_.indexOf('ESTADO') + 1;
  var protecciones = hoja.getProtections(SpreadsheetApp.ProtectionType.RANGE)
    .filter(function (p) { return p.getDescription() === 'SOLICITUDES_MONTAJE_ESTADO'; });

  if (protecciones.length === 0) {
    var rango = hoja.getRange(2, colEstado, Math.max(hoja.getMaxRows() - 1, 1), 1);
    var proteccion = rango.protect().setDescription('SOLICITUDES_MONTAJE_ESTADO');
    proteccion.removeEditors(proteccion.getEditors());
    if (proteccion.canDomainEdit()) proteccion.setDomainEdit(false);
    aplicarEditoresAutorizadosMontaje_(proteccion);
  }

  return { creadaAhora: creadaAhora, hoja: hoja };
}

/**
 * Reaplica la lista de EMAILS_AUTORIZADOS_MONTAJE como editores de la
 * proteccion de ESTADO. Se llama al instalar la hoja y cada vez que se
 * actualiza la Script Property, para que la proteccion no quede
 * desincronizada de la lista blanca real.
 */
function aplicarEditoresAutorizadosMontaje_(proteccion) {
  var actuales = proteccion.getEditors().map(function (u) { return u.getEmail(); });
  actuales.forEach(function (correo) { proteccion.removeEditor(correo); });
  obtenerEmailsAutorizadosMontaje_().forEach(function (correo) { proteccion.addEditor(correo); });
}

function obtenerEmailsAutorizadosMontaje_() {
  var valor = PropertiesService.getScriptProperties().getProperty(SOLICITUDES_MONTAJE_PROP_EMAILS_);
  return (valor || '').split(',').map(function (correo) { return correo.trim(); }).filter(Boolean);
}

/*
 * Formulario dinámico de solicitud de montaje (ver conversación --
 * "evitar el paso humano de escribir a mano... nos dé las opciones
 * posibles de montaje modular"): sustituye escribir NOMBRE/MODULOS a
 * mano en SOLICITUDES_MONTAJE (propenso a typos y a olvidar
 * dependencias) por un diálogo con checklist. La lista de módulos se
 * lee en vivo de PACKAGE_MAP_EMBEBIDO.moduleDependencies -- nunca
 * hardcodeada aquí, así que un módulo nuevo aparece solo, sin tocar
 * este fichero ni el HTML. Se excluyen a propósito dos módulos que no
 * tiene sentido ofertar como opción marcable: APROVISIONAMIENTO (es la
 * función que ofrece este mismo formulario, no algo para dar a un
 * sheet cliente sin una decisión explícita aparte) y CORE (ver
 * conversación -- "el core siempre tiene que estar preseleccionado,
 * no tiene sentido dejarlo en el listado de opciones modulares": todo
 * sheet lo lleva siempre, crearSolicitudMontaje lo añade sin
 * preguntar).
 */
function obtenerModulosDisponiblesParaSolicitud() {
  return Object.keys(PACKAGE_MAP_EMBEBIDO.moduleDependencies)
    .filter(function (m) { return m !== 'APROVISIONAMIENTO' && m !== 'CORE'; })
    .sort()
    .map(function (m) {
      return { nombre: m, dependencias: PACKAGE_MAP_EMBEBIDO.moduleDependencies[m] };
    });
}

/*
 * "Solicitudes en curso" (Mapa del sheet): en vez de construir una
 * vista de solo lectura que duplica SOLICITUDES_MONTAJE, salta
 * directamente a la hoja real -- es la fuente de la verdad (ESTADO,
 * URL, ERROR ya están ahí), una vista aparte solo añadiría otro sitio
 * que desincronizar.
 */
function abrirHojaSolicitudesMontaje() {
  var resultado = instalarHojaSolicitudesMontaje_();
  resultado.hoja.activate();
}

function abrirSolicitudMontaje() {
  var template = HtmlService.createTemplateFromFile('SolicitudMontaje');
  var html = template.evaluate().setWidth(420).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html, 'Nueva solicitud de montaje');
}

/*
 * ID_TEMPORAL corto y legible (mismo criterio que el resto del
 * sistema, ej. STG_* del importador) -- SOL-001, SOL-002... a partir
 * del máximo ya usado, no del número de filas (evita colisión si
 * alguna fila se borró).
 */
function siguienteIdTemporalSolicitud_(hoja) {
  var ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return 'SOL-001';
  var colId = SOLICITUDES_MONTAJE_CABECERAS_.indexOf('ID_TEMPORAL') + 1;
  var valores = hoja.getRange(2, colId, ultimaFila - 1, 1).getValues();
  var maximo = 0;
  valores.forEach(function (fila) {
    var m = /^SOL-(\d+)$/.exec(String(fila[0] || '').trim());
    if (m) maximo = Math.max(maximo, Number(m[1]));
  });
  return 'SOL-' + String(maximo + 1).padStart(3, '0');
}

/*
 * Crea la fila de solicitud con ESTADO vacío -- la aprobación sigue
 * siendo un paso humano deliberado (ver alAprobarMontaje_), esto solo
 * automatiza la escritura propensa a error. Resuelve el cierre
 * transitivo real de módulos (resolverCierreModulos_, el mismo código
 * que usa subirContenidoScript_) para que la fila ya refleje los
 * módulos que se instalarán de verdad, no solo lo que el operador
 * marcó -- si marca VENTAS sin CLIENTE, la fila queda con ambos.
 */
function crearSolicitudMontaje(nombre, modulosSeleccionados) {
  nombre = String(nombre || '').trim();
  if (!nombre) throw new Error('CREAR_SOLICITUD_MONTAJE_ERROR: falta el nombre.');
  // Sin ningún módulo marcado es válido -- CORE (siempre incluido, ver
  // más abajo) ya es un sheet completo por sí mismo.
  if (!Array.isArray(modulosSeleccionados)) modulosSeleccionados = [];

  var resultadoHoja = instalarHojaSolicitudesMontaje_();
  var hoja = resultadoHoja.hoja;

  // CORE siempre va, aunque el llamador no lo pida explícitamente (ver
  // conversación -- "no tiene sentido dejarlo en el listado de
  // opciones modulares"). En la práctica ya lo arrastraba
  // resolverCierreModulos_ como dependencia transitiva de casi
  // cualquier otro módulo, pero se añade explícito para no depender
  // de que siga siendo así si algún módulo futuro no dependiera de él.
  var cierre = resolverCierreModulos_(modulosSeleccionados.concat(['CORE']), PACKAGE_MAP_EMBEBIDO.moduleDependencies);
  var modulosResueltos = Object.keys(cierre).sort();

  var idTemporal = siguienteIdTemporalSolicitud_(hoja);
  var fila = SOLICITUDES_MONTAJE_CABECERAS_.map(function (cabecera) {
    if (cabecera === 'ID_TEMPORAL') return idTemporal;
    if (cabecera === 'NOMBRE') return nombre;
    if (cabecera === 'MODULOS') return modulosResueltos.join(', ');
    if (cabecera === 'FECHA_CREACION') return new Date();
    if (cabecera === 'CREADO_POR') return Session.getEffectiveUser().getEmail();
    return '';
  });
  hoja.appendRow(fila);

  return { idTemporal: idTemporal, modulosResueltos: modulosResueltos };
}

/**
 * Punto de entrada de menu para dejar Aprovisionamiento operativo:
 * crea/asegura la hoja SOLICITUDES_MONTAJE y pide (si falta) la lista
 * de correos autorizados.
 *
 * NO activa el trigger de aprobación en este mismo paso (ver
 * conversación -- módulo APROVISIONAMIENTO promovido a la librería
 * para que clientes internos como Gestor de Proyectos puedan usarlo,
 * no solo el Master en crudo): ScriptApp.newTrigger(...).create() es
 * ambiguo cuando se invoca a través de una llamada de librería -- no
 * hay garantía documentada de que el trigger quede asociado al
 * proyecto del CLIENTE que llamó en vez de al de la propia librería.
 * Para no arriesgar un trigger persistente mal registrado (silencioso
 * de detectar: simplemente nunca se dispararía), esa única llamada se
 * deja fuera de la librería -- ver el mensaje que devuelve este alert
 * y configurarTriggerAprobacionMontaje() más abajo para el camino
 * directo (Master, sin indirección de librería, donde no hay
 * ambigüedad posible).
 */
function abrirConfigurarAprovisionamiento() {
  var ui = SpreadsheetApp.getUi();

  var resp = ui.alert(
    'Configurar Aprovisionamiento',
    'Esto crea (si falta) la hoja SOLICITUDES_MONTAJE protegida y activa el trigger que reacciona ' +
    'al aprobar una fila. Requiere una lista de correos autorizados. ¿Continuar?',
    ui.ButtonSet.YES_NO
  );
  if (resp !== ui.Button.YES) return;

  try {
    var resultadoHoja = instalarHojaSolicitudesMontaje_();

    if (obtenerEmailsAutorizadosMontaje_().length === 0) {
      var respEmails = ui.prompt(
        'Correos autorizados para aprobar montajes',
        'Introduce uno o varios correos separados por coma:',
        ui.ButtonSet.OK_CANCEL
      );
      if (respEmails.getSelectedButton() !== ui.Button.OK) {
        ui.alert('Configuracion incompleta', 'No se activo el trigger: falta la lista de correos autorizados.', ui.ButtonSet.OK);
        return;
      }
      PropertiesService.getScriptProperties().setProperty(SOLICITUDES_MONTAJE_PROP_EMAILS_, respEmails.getResponseText().trim());
      var proteccionActual = resultadoHoja.hoja.getProtections(SpreadsheetApp.ProtectionType.RANGE)
        .filter(function (p) { return p.getDescription() === 'SOLICITUDES_MONTAJE_ESTADO'; })[0];
      if (proteccionActual) aplicarEditoresAutorizadosMontaje_(proteccionActual);
    }

    var yaExiste = ScriptApp.getProjectTriggers().some(function (trigger) {
      return trigger.getHandlerFunction() === 'alAprobarMontaje_';
    });

    ui.alert(
      'Aprovisionamiento configurado',
      'Hoja: ' + (resultadoHoja.creadaAhora ? 'creada ahora' : 'ya existia') +
      '\nTrigger: ' + (yaExiste
        ? 'ya estaba activo'
        : 'AÚN NO ACTIVADO -- ejecuta configurarTriggerAprobacionMontaje() una vez, a mano, desde el editor de Apps Script de este proyecto (▶ Ejecutar)') +
      '\nCorreos autorizados: ' + obtenerEmailsAutorizadosMontaje_().join(', '),
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('No se pudo configurar', e.message, ui.ButtonSet.OK);
  }
}

/**
 * subirContenidoScript_ necesita saber que version de la libreria CORE
 * poner en el appsscript.json de cada cliente nuevo. Como esa version
 * cambia en cada 'clasp version' (ver tools/constructor/libreria.json,
 * que es Node y no esta disponible en tiempo de ejecucion), se guarda
 * aqui como Script Property y hay que actualizarla a mano tras publicar.
 */
function abrirActualizarVersionLibreria() {
  var ui = SpreadsheetApp.getUi();
  var actual = PropertiesService.getScriptProperties().getProperty('LIBRERIA_VERSION_ACTUAL');
  var resp = ui.prompt(
    'Version actual de la libreria CORE',
    'Version publicada mas reciente (ver tools/constructor/libreria.json), actual: ' + (actual || '(sin definir)') + ':',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var version = resp.getResponseText().trim();
  if (!version) { ui.alert('Version vacia, no se guarda.'); return; }
  PropertiesService.getScriptProperties().setProperty('LIBRERIA_VERSION_ACTUAL', version);
  ui.alert('Version guardada', 'LIBRERIA_VERSION_ACTUAL = ' + version, ui.ButtonSet.OK);
}

/**
 * Ejecutar UNA VEZ, a mano, por la persona autorizada. Registra un
 * trigger instalable de tipo onEdit sobre este Spreadsheet, propiedad
 * de quien la ejecuta -- la identidad bajo la que correra
 * alAprobarMontaje_ en adelante.
 */
function configurarTriggerAprobacionMontaje() {
  var ss = SpreadsheetApp.getActive();

  var yaExiste = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === 'alAprobarMontaje_';
  });

  if (yaExiste) {
    throw new Error('CONFIGURAR_TRIGGER_APROBACION_MONTAJE_ERROR: el trigger ya esta configurado.');
  }

  ScriptApp.newTrigger('alAprobarMontaje_').forSpreadsheet(ss).onEdit().create();
}

/**
 * Manejador del trigger instalable. Solo reacciona a un cambio de
 * ESTADO a "Aprobado" en la hoja SOLICITUDES_MONTAJE, y solo si quien
 * edito esta en la lista blanca -- doble comprobacion ademas de la
 * proteccion nativa de la hoja sobre esa columna.
 */
function alAprobarMontaje_(e) {
  var hoja = null;
  var fila = 0;
  var colError = 0;
  var colIdReal = 0;
  var colUrl = 0;
  var colFechaAprobacion = 0;
  var colAprobadoPor = 0;

  try {
    if (!e || !e.range) return;

    hoja = e.range.getSheet();
    if (hoja.getName() !== SOLICITUDES_MONTAJE_HOJA_) return;

    var cabeceras = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
    var colEstado = cabeceras.indexOf('ESTADO') + 1;
    if (colEstado === 0 || e.range.getColumn() !== colEstado) return;
    if (e.value !== 'Aprobado') return;

    fila = e.range.getRow();
    colError = cabeceras.indexOf('ERROR') + 1;
    colIdReal = cabeceras.indexOf('ID_REAL') + 1;
    colUrl = cabeceras.indexOf('URL') + 1;
    colFechaAprobacion = cabeceras.indexOf('FECHA_APROBACION') + 1;
    colAprobadoPor = cabeceras.indexOf('APROBADO_POR') + 1;

    var emailEditor = Session.getEffectiveUser().getEmail();
    var autorizados = obtenerEmailsAutorizadosMontaje_();

    if (autorizados.indexOf(emailEditor) === -1) {
      throw new Error('AL_APROBAR_MONTAJE_ERROR: ' + emailEditor + ' no esta autorizado para aprobar montajes.');
    }

    var datosFila = hoja.getRange(fila, 1, 1, cabeceras.length).getValues()[0];
    var colNombre = cabeceras.indexOf('NOMBRE');
    var colModulos = cabeceras.indexOf('MODULOS');
    var nombre = String(datosFila[colNombre] || '').trim();
    var modulos = String(datosFila[colModulos] || '').split(',').map(function (m) { return m.trim(); }).filter(Boolean);

    if (!nombre) throw new Error('AL_APROBAR_MONTAJE_ERROR: falta NOMBRE en la fila ' + fila + '.');
    if (modulos.length === 0) throw new Error('AL_APROBAR_MONTAJE_ERROR: falta MODULOS en la fila ' + fila + '.');

    var resultado = crearProyectoScript_(nombre, modulos);

    if (colIdReal) hoja.getRange(fila, colIdReal).setValue(resultado.scriptId);
    if (colUrl) hoja.getRange(fila, colUrl).setValue(resultado.spreadsheetUrl);
    if (colFechaAprobacion) hoja.getRange(fila, colFechaAprobacion).setValue(new Date());
    if (colAprobadoPor) hoja.getRange(fila, colAprobadoPor).setValue(emailEditor);
    if (colError) hoja.getRange(fila, colError).setValue('');
  } catch (err) {
    console.error('alAprobarMontaje_: ' + err.message);
    if (hoja && fila && colError) hoja.getRange(fila, colError).setValue(err.message);
  }
}

/**
 * Crea el Spreadsheet nuevo, el proyecto de Apps Script vinculado
 * (script.projects.create con parentId), sube el Codigo.js/appsscript.json
 * generados para los modulos pedidos, e instala las hojas de datos de esos
 * mismos modulos -- todo en una sola ejecucion, sin pasos manuales para
 * quien aprueba el montaje. instalarEstructuraInicial vive en la misma
 * libreria CORE (EstructuraInicialService.js), asi que se llama
 * directamente sobre el ss recien creado, sin Execution API ni scopes
 * adicionales.
 */
function crearProyectoScript_(nombre, modulos) {
  var ss = SpreadsheetApp.create(nombre);
  var token = ScriptApp.getOAuthToken();

  var respCrear = UrlFetchApp.fetch('https://script.googleapis.com/v1/projects', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ title: nombre, parentId: ss.getId() }),
    muteHttpExceptions: true
  });

  if (respCrear.getResponseCode() !== 200) {
    throw new Error('CREAR_PROYECTO_SCRIPT_ERROR: ' + respCrear.getResponseCode() + ' ' + respCrear.getContentText());
  }

  var proyecto = JSON.parse(respCrear.getContentText());
  subirContenidoScript_(proyecto.scriptId, modulos);
  instalarEstructuraInicial(modulos, ss);

  return { spreadsheetId: ss.getId(), spreadsheetUrl: ss.getUrl(), scriptId: proyecto.scriptId };
}

/**
 * Lee el codigo fuente del propio proyecto maestro (script.projects.getContent
 * sobre ScriptApp.getScriptId()), genera los envoltorios para los modulos
 * pedidos con GeneradorEnvoltoriosEmbebido.js, y sube Codigo.js + appsscript.json
 * al proyecto nuevo con script.projects.updateContent.
 */
function subirContenidoScript_(scriptId, modulos) {
  var token = ScriptApp.getOAuthToken();

  var respPropio = UrlFetchApp.fetch(
    'https://script.googleapis.com/v1/projects/' + ScriptApp.getScriptId() + '/content',
    { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true }
  );
  if (respPropio.getResponseCode() !== 200) {
    throw new Error('SUBIR_CONTENIDO_SCRIPT_ERROR: no se pudo leer el proyecto propio -- ' + respPropio.getContentText());
  }

  var contenidoPropio = JSON.parse(respPropio.getContentText());
  var fuentePorNombre = {};
  contenidoPropio.files.forEach(function (file) { fuentePorNombre[file.name] = file.source; });

  var aFiles = PACKAGE_MAP_EMBEBIDO.entriesPackageA.map(function (entrada) {
    var nombreArchivo = entrada.path.replace(/^src\//, '').replace(/\.(js|html)$/, '');
    return { path: entrada.path, module: entrada.module, content: fuentePorNombre[nombreArchivo] || '' };
  });

  var generado = generarEnvoltoriosParaModulos_(aFiles, modulos, 'Core');

  var versionLibreria = PropertiesService.getScriptProperties().getProperty('LIBRERIA_VERSION_ACTUAL');
  if (!versionLibreria) throw new Error('SUBIR_CONTENIDO_SCRIPT_ERROR: falta la Script Property LIBRERIA_VERSION_ACTUAL.');

  var manifiesto = {
    timeZone: 'Europe/Madrid',
    dependencies: { libraries: [{ userSymbol: 'Core', libraryId: LIBRERIA_ID_, version: versionLibreria }] },
    exceptionLogging: 'STACKDRIVER',
    runtimeVersion: 'V8'
  };

  var respSubir = UrlFetchApp.fetch(
    'https://script.googleapis.com/v1/projects/' + scriptId + '/content',
    {
      method: 'put',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token },
      payload: JSON.stringify({
        files: [
          { name: 'appsscript', type: 'JSON', source: JSON.stringify(manifiesto) },
          { name: 'Codigo', type: 'SERVER_JS', source: generado.codigo }
        ]
      }),
      muteHttpExceptions: true
    }
  );

  if (respSubir.getResponseCode() !== 200) {
    throw new Error('SUBIR_CONTENIDO_SCRIPT_ERROR: ' + respSubir.getResponseCode() + ' ' + respSubir.getContentText());
  }

  return generado.plan;
}

var LIBRERIA_ID_ = '1fRR3hjtUIxWcZrjU1APFtG361QuDZ8GmBNQjAoKY_ZjhaYprAkvOEA7M';
