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

function abrirAprobarSolicitudMontaje() {
  var template = HtmlService.createTemplateFromFile('AprobarSolicitudMontaje');
  var html = template.evaluate().setWidth(420).setHeight(420);
  SpreadsheetApp.getUi().showModalDialog(html, 'Aprobar solicitud de montaje');
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
    'al aprobar una fila. Requiere una lista de correos autorizados.\n\n' +
    'IMPORTANTE, una sola vez por proyecto: aprobar una solicitud llama a la Apps Script API ' +
    '(script.googleapis.com) para crear el proyecto nuevo, y eso exige que ESTE proyecto (no los ' +
    'sheets que se creen) tenga enlazado un proyecto de Google Cloud ESTANDAR con esa API habilitada ' +
    '-- el proyecto de Cloud automatico que Apps Script asigna por defecto suele dar error de permisos. ' +
    'Configuralo en Configuracion del proyecto (engranaje, editor de Apps Script) -> Proyecto de Google ' +
    'Cloud Platform -> Cambiar proyecto, y habilita ahi la Apps Script API. ¿Continuar?',
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

/*
 * Autoactualizacion de version de libreria (ver conversacion -- "como
 * evitamos esta friccion?" al tener que ir a mano a Extensiones > Apps
 * Script > Bibliotecas > Core > cambiar version en cada sheet interno
 * cada vez que se publica una version nueva). Deliberadamente NO se
 * ofrece a clientes de pago: exige el scope script.projects en su
 * propio manifiesto, que da acceso de lectura/escritura a cualquier
 * proyecto de Apps Script al que la cuenta tenga acceso -- mas potencia
 * de la que un sheet de produccion normal necesita. Se gatea igual que
 * el resto de Aprovisionamiento (moduloInstalado_('INTERNO') ||
 * moduloInstalado_('APROVISIONAMIENTO')), asi que solo aparece en
 * herramientas internas como Gestor de Proyectos.
 */
function abrirActualizarMiLibreria() {
  var ui = SpreadsheetApp.getUi();
  try {
    var resultado = actualizarLibreriaPropia_();
    if (resultado.sinCambios) {
      ui.alert('Ya está actualizado', 'Este proyecto ya usa la última versión publicada (' + resultado.versionActual + ').', ui.ButtonSet.OK);
    } else {
      ui.alert('Librería actualizada', 'Versión anterior: ' + resultado.versionAnterior + '\nVersión nueva: ' + resultado.versionNueva + '\n\nRecarga el sheet para que el código nuevo tenga efecto.', ui.ButtonSet.OK);
    }
  } catch (e) {
    ui.alert('No se pudo actualizar', e.message, ui.ButtonSet.OK);
  }
}

/*
 * Actualización remota de un cliente existente (ver conversación --
 * "esto no lo tendríamos que tener automatizado?" tras encontrar
 * gestor-proyectos 109 versiones por detrás sin que nadie se enterara).
 * A diferencia de actualizarLibreriaPropia_ (autoservicio, exige que el
 * propio cliente tenga APROVISIONAMIENTO, nunca cierto para clientes de
 * pago), esta se ejecuta desde AQUÍ (maestro/interno) contra el
 * scriptId de cualquier cliente, sin exigirle ningún módulo.
 *
 * No se limita a cambiar el número de versión del manifiesto: relee
 * MODULOS_INSTALADOS_CLIENTE del propio Codigo.js del cliente (misma
 * literal que emite generarEnvoltoriosParaModulos_) y llama de nuevo a
 * subirContenidoScript_ con esos módulos -- así también recoge
 * envoltorios nuevos generables desde la última vez, no solo la versión.
 */
function actualizarLibreriaClienteRemoto_(scriptId) {
  var token = ScriptApp.getOAuthToken();

  var respLeer = UrlFetchApp.fetch(
    'https://script.googleapis.com/v1/projects/' + scriptId + '/content',
    { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true }
  );
  if (respLeer.getResponseCode() !== 200) {
    throw new Error('ACTUALIZAR_LIBRERIA_CLIENTE_ERROR: no se pudo leer el proyecto del cliente -- ' + respLeer.getContentText());
  }

  var contenido = JSON.parse(respLeer.getContentText());
  var archivoCodigo = contenido.files.filter(function (f) { return f.name === 'Codigo'; })[0];
  if (!archivoCodigo) throw new Error('ACTUALIZAR_LIBRERIA_CLIENTE_ERROR: no se encontró Codigo.js en el proyecto del cliente.');

  var coincidencia = archivoCodigo.source.match(/var\s+MODULOS_INSTALADOS_CLIENTE\s*=\s*(\[[^\]]*\])/);
  if (!coincidencia) throw new Error('ACTUALIZAR_LIBRERIA_CLIENTE_ERROR: no se encontró MODULOS_INSTALADOS_CLIENTE en el Codigo.js del cliente -- ¿es realmente un cliente generado por este empaquetador?');
  var modulos = JSON.parse(coincidencia[1]);

  var versionAnterior = null;
  var archivoManifiesto = contenido.files.filter(function (f) { return f.name === 'appsscript'; })[0];
  if (archivoManifiesto) {
    try {
      var manifiestoAnterior = JSON.parse(archivoManifiesto.source);
      var libreriaAnterior = ((manifiestoAnterior.dependencies && manifiestoAnterior.dependencies.libraries) || []).filter(function (l) { return l.libraryId === LIBRERIA_ID_; })[0];
      versionAnterior = libreriaAnterior ? String(libreriaAnterior.version) : null;
    } catch (e) {
      versionAnterior = null;
    }
  }

  subirContenidoScript_(scriptId, modulos);
  var versionNueva = String(obtenerVersionLibreriaMasReciente_());

  return { versionAnterior: versionAnterior, versionNueva: versionNueva, modulos: modulos };
}

/*
 * Si existe un CLIENTE con SCRIPT_ID igual al actualizado, deja
 * constancia de la nueva versión en su ficha -- visibilidad sin tener
 * que abrir clientes.json ni el proyecto de cada uno. Silencioso si no
 * hay coincidencia (cliente interno sin ficha CLIENTE, p.ej. la-troballa).
 */
function actualizarLibreriaVersionEnFichaCliente_(scriptId, versionNueva) {
  var cliente = listarRegistrosSeguro_('CLIENTE', { ACTIVO: 'SÍ' }).filter(function (c) {
    return String(c.SCRIPT_ID || '').trim() === scriptId;
  })[0];
  if (!cliente) return;
  /*
   * ORIGEN tiene una lista cerrada de valores válidos
   * (ORIGENES_HISTORIAL_VALIDOS en HistorialService.js) -- un texto
   * libre aquí rompía el registro de historial con ERROR_HISTORIAL.
   * 'ADMIN' es el que mejor encaja: acción administrativa remota
   * disparada por una persona autorizada, no una escritura de formulario
   * normal (UI) ni una prueba (TEST).
   */
  actualizarRegistroTransaccional('CLIENTE', cliente.ID, { LIBRERIA_VERSION: versionNueva }, { origen: 'ADMIN' });
}

/*
 * Añadir un módulo nuevo a un cliente ya montado (ver conversación --
 * "no lo tendríamos que crear en Gestor de Proyectos?" en vez de montar
 * un cliente de prueba desde cero para verificar el bot operativo).
 * Mismo patrón de lectura que actualizarLibreriaClienteRemoto_, pero en
 * vez de reenviar los módulos tal cual, añade uno nuevo a la lista antes
 * de llamar a subirContenidoScript_ -- que también instala/actualiza sin
 * volver a tocar datos existentes (idempotente, ya probado en
 * subirContenidoScript_/instalarEstructuraInicial).
 */
function agregarModuloClienteRemoto_(scriptId, moduloNuevo) {
  var token = ScriptApp.getOAuthToken();

  var respLeer = UrlFetchApp.fetch(
    'https://script.googleapis.com/v1/projects/' + scriptId + '/content',
    { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true }
  );
  if (respLeer.getResponseCode() !== 200) {
    throw new Error('AGREGAR_MODULO_CLIENTE_ERROR: no se pudo leer el proyecto del cliente -- ' + respLeer.getContentText());
  }

  var contenido = JSON.parse(respLeer.getContentText());
  var archivoCodigo = contenido.files.filter(function (f) { return f.name === 'Codigo'; })[0];
  if (!archivoCodigo) throw new Error('AGREGAR_MODULO_CLIENTE_ERROR: no se encontró Codigo.js en el proyecto del cliente.');

  var coincidencia = archivoCodigo.source.match(/var\s+MODULOS_INSTALADOS_CLIENTE\s*=\s*(\[[^\]]*\])/);
  if (!coincidencia) throw new Error('AGREGAR_MODULO_CLIENTE_ERROR: no se encontró MODULOS_INSTALADOS_CLIENTE en el Codigo.js del cliente.');
  var modulos = JSON.parse(coincidencia[1]);

  if (modulos.indexOf(moduloNuevo) === -1) modulos.push(moduloNuevo);

  subirContenidoScript_(scriptId, modulos);
  var versionNueva = String(obtenerVersionLibreriaMasReciente_());

  return { modulos: modulos, versionNueva: versionNueva };
}

/*
 * Diálogo con desplegables en vez de ui.prompt() de texto libre (ver
 * conversación -- "esto debería ser un desplegable dinámico" / "el
 * script id... el sistema debería poder leer los sheets de clientes").
 * Ambas listas se leen en vivo, nada hardcodeado a mano:
 * - Clientes: CLIENTE.SCRIPT_ID ya guardado en el Sheet (Fase 0) -- no
 *   hay que copiar/pegar IDs ni arriesgarse a pegar el del Sheet en vez
 *   del del Script.
 * - Módulos: claves de PACKAGE_MAP_EMBEBIDO.moduleDependencies, que se
 *   regenera en cada publicación de la librería -- se actualiza sola a
 *   medida que se construyen módulos nuevos, sin tocar este código.
 */
function obtenerModulosDisponibles_() {
  return Object.keys(PACKAGE_MAP_EMBEBIDO.moduleDependencies || {})
    .filter(function (m) { return m !== 'APROVISIONAMIENTO' && m !== 'CORE'; })
    .sort();
}

function obtenerClientesConScriptId_() {
  return listarRegistrosSeguro_('CLIENTE', { ACTIVO: 'SÍ' })
    .filter(function (c) { return String(c.SCRIPT_ID || '').trim(); })
    .map(function (c) {
      return {
        id: c.ID,
        nombre: c.NOMBRE,
        codigo: c.CODIGO,
        scriptId: String(c.SCRIPT_ID).trim(),
        libreriaVersion: c.LIBRERIA_VERSION || '(desconocida)'
      };
    });
}

function obtenerDatosGestionRemotaClientes() {
  return serializarParaCliente_({
    clientes: obtenerClientesConScriptId_(),
    modulos: obtenerModulosDisponibles_()
  });
}

function agregarModuloClienteDesdeDialogo(scriptId, modulo) {
  var resultado = agregarModuloClienteRemoto_(scriptId, modulo);
  actualizarLibreriaVersionEnFichaCliente_(scriptId, resultado.versionNueva);
  return resultado;
}

function actualizarLibreriaClienteDesdeDialogo(scriptId) {
  var resultado = actualizarLibreriaClienteRemoto_(scriptId);
  actualizarLibreriaVersionEnFichaCliente_(scriptId, resultado.versionNueva);
  return resultado;
}

function abrirGestionRemotaClientes() {
  var html = HtmlService.createTemplateFromFile('GestionRemotaClientes')
    .evaluate()
    .setWidth(460)
    .setHeight(420);
  SpreadsheetApp.getUi().showModalDialog(html, 'Gestión remota de clientes');
}

/*
 * Este handler vive en package A (módulo APROVISIONAMIENTO) a propósito,
 * aunque la lógica real que invoca (ejecutarLotePruebasReactivas_,
 * EjecutorPruebasReactivas.js) es package B -- nunca se distribuye a
 * ningún cliente, ni siquiera a uno interno como Gestor de Proyectos,
 * porque depende de RegistroPruebasReactivas.js y de los 346 Tests_*.js,
 * que solo existen en el proyecto maestro. Si el handler viviera también
 * en package B, el generador de envoltorios (resolveWrapperPlan) marcaría
 * su entrada de menú como UNRESOLVED en cuanto un cliente instalase todos
 * los módulos -- ver "runner mínimo para las pruebas reactivas". Por eso
 * se gatea solo por moduloInstalado_('INTERNO') (nunca por
 * APROVISIONAMIENTO): 'INTERNO' no es un módulo real que ningún cliente
 * pueda tener instalado, así que el ítem de menú nunca llega a mostrarse
 * fuera del maestro -- y el guard de abajo es la segunda red de
 * seguridad si esa condición cambiase algún día.
 *
 * Por lotes con reanudación (ver primera ejecución real: 11/346 antes de
 * "Se ha superado el tiempo máximo de ejecución"): si queda una tanda a
 * medias, pregunta si continuar donde se quedó o empezar de cero, en vez
 * de asumir uno de los dos.
 */
function abrirEjecutorPruebasReactivas() {
  var ui = SpreadsheetApp.getUi();
  if (typeof ejecutarLotePruebasReactivas_ !== 'function') {
    ui.alert('No disponible', 'Las pruebas reactivas (Tests_*.js) solo existen en el proyecto maestro -- no se distribuyen a ningún cliente.', ui.ButtonSet.OK);
    return;
  }

  var estado = obtenerEstadoPruebasReactivas_();
  var reanudar = false;

  if (estado.completadas > 0 && estado.pendientes > 0) {
    var eleccion = ui.alert(
      'Ejecutar pruebas reactivas',
      'Hay una tanda anterior sin terminar: ' + estado.completadas + '/' + estado.total + ' completadas, ' + estado.pendientes + ' pendientes.\n\n' +
      'Sí = continuar donde se quedó.\nNo = empezar de cero (borra los resultados anteriores).',
      ui.ButtonSet.YES_NO_CANCEL
    );
    if (eleccion === ui.Button.CANCEL) return;
    reanudar = (eleccion === ui.Button.YES);
  } else {
    var confirmacion = ui.alert(
      'Ejecutar pruebas reactivas',
      'Se van a ejecutar hasta ' + estado.total + ' pruebas reactivas (Tests_*.js), en tandas de unos minutos cada una (límite de ejecución de Apps Script -- algunas pruebas individuales tardan 60-100s montando un escenario real). Algunas mutan datos reales del Sheet (con su propia restauración). ¿Continuar?',
      ui.ButtonSet.YES_NO
    );
    if (confirmacion !== ui.Button.YES) return;
  }

  var resumen = ejecutarLotePruebasReactivas_(reanudar);

  var mensaje = 'Esta tanda: ' + resumen.procesadasEnEstaTanda + ' ejecutadas (' + resumen.ok + ' OK, ' + resumen.fallo + ' fallo).\n';
  mensaje += (resumen.pendientesRestantes > 0)
    ? 'Quedan ' + resumen.pendientesRestantes + '/' + resumen.total + ' pendientes -- vuelve a abrir este menú para continuar.'
    : 'Completado: ' + resumen.total + '/' + resumen.total + '.';
  mensaje += '\nDetalle fila a fila en la hoja "RESULTADOS_PRUEBAS_REACTIVAS".';

  if (resumen.fallo > 0) {
    var nombresFallo = resumen.resultados
      .filter(function (fila) { return fila.resultado === 'FALLO'; })
      .map(function (fila) { return fila.funcion; });
    var listados = nombresFallo.slice(0, 20).join('\n- ');
    mensaje += '\n\nFallos en esta tanda:\n- ' + listados;
    if (nombresFallo.length > 20) mensaje += '\n... y ' + (nombresFallo.length - 20) + ' más.';
  }
  ui.alert('Pruebas reactivas: resultado', mensaje, ui.ButtonSet.OK);
}

/*
 * Ver conversación -- "esto está siendo muy pesado", "mejorar la
 * fricción humana": alternativa a abrirEjecutorPruebasReactivas() que
 * no exige reabrir el menú cada pocos minutos. Instala un trigger por
 * tiempo (EjecutorPruebasReactivas.js) que se ejecuta solo hasta
 * terminar y avisa por correo (MailApp, sin depender de n8n -- el
 * webhook n8n existente es de otro proyecto y en localhost, inalcanzable
 * desde Apps Script de todos modos). Mismo guard/gate que la versión
 * interactiva.
 */
function abrirEjecutorPruebasReactivasSegundoPlano() {
  var ui = SpreadsheetApp.getUi();
  if (typeof iniciarEjecucionEnSegundoPlanoPruebasReactivas_ !== 'function') {
    ui.alert('No disponible', 'Las pruebas reactivas (Tests_*.js) solo existen en el proyecto maestro -- no se distribuyen a ningún cliente.', ui.ButtonSet.OK);
    return;
  }

  var estado = obtenerEstadoPruebasReactivas_();

  if (haySegundoPlanoActivoPruebasReactivas_()) {
    var detener = ui.alert(
      'Ejecución en segundo plano ya activa',
      'Quedan ' + estado.pendientes + '/' + estado.total + ' pendientes. ¿Detener la ejecución automática?',
      ui.ButtonSet.YES_NO
    );
    if (detener === ui.Button.YES) {
      detenerEjecucionEnSegundoPlanoPruebasReactivas_();
      ui.alert('Detenida', 'Los resultados ya escritos se conservan en "RESULTADOS_PRUEBAS_REACTIVAS". Puedes reanudar cuando quieras desde este mismo menú.', ui.ButtonSet.OK);
    }
    return;
  }

  if (estado.pendientes === 0) {
    ui.alert('Ya completo', 'Las ' + estado.total + ' pruebas reactivas ya están completas. Para repetir todas, usa "Ejecutar pruebas reactivas" y elige empezar de cero.', ui.ButtonSet.OK);
    return;
  }

  var destinatario = Session.getEffectiveUser().getEmail() || '(tu correo de Google)';
  var confirmacion = ui.alert(
    'Ejecutar en segundo plano',
    'Quedan ' + estado.pendientes + '/' + estado.total + ' pendientes. Se ejecutarán solas en tandas automáticas cada ' + MINUTOS_ENTRE_TANDAS_PRUEBAS_REACTIVAS_ + ' minutos, sin que tengas que volver a abrir este menú. Aviso por correo a ' + destinatario + ' cuando termine. ¿Continuar?',
    ui.ButtonSet.YES_NO
  );
  if (confirmacion !== ui.Button.YES) return;

  iniciarEjecucionEnSegundoPlanoPruebasReactivas_();
  ui.alert('En marcha', 'Ejecutándose en segundo plano. Puedes cerrar este Sheet -- recibirás un correo cuando termine.', ui.ButtonSet.OK);
}

/*
 * Lee el propio appsscript.json (script.projects.getContent sobre
 * ScriptApp.getScriptId(), no un scriptId ajeno), le cambia solo la
 * version de la dependencia LIBRERIA_ID_ a la ultima publicada
 * (obtenerVersionLibreriaMasReciente_, mismo helper que usa
 * subirContenidoScript_ al montar clientes nuevos), y reescribe el
 * proyecto entero via script.projects.updateContent -- la API exige
 * mandar todos los ficheros juntos, no solo el que cambia.
 */
function actualizarLibreriaPropia_() {
  var token = ScriptApp.getOAuthToken();
  var scriptId = ScriptApp.getScriptId();

  var respLeer = UrlFetchApp.fetch(
    'https://script.googleapis.com/v1/projects/' + scriptId + '/content',
    { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true }
  );
  if (respLeer.getResponseCode() !== 200) {
    throw new Error('ACTUALIZAR_LIBRERIA_PROPIA_ERROR: no se pudo leer el proyecto propio -- ' + respLeer.getContentText());
  }

  var contenido = JSON.parse(respLeer.getContentText());
  var archivoManifiesto = contenido.files.filter(function (f) { return f.name === 'appsscript'; })[0];
  if (!archivoManifiesto) throw new Error('ACTUALIZAR_LIBRERIA_PROPIA_ERROR: no se encontro appsscript.json en el proyecto propio.');

  var manifiesto = JSON.parse(archivoManifiesto.source);
  var libreria = ((manifiesto.dependencies && manifiesto.dependencies.libraries) || []).filter(function (l) { return l.libraryId === LIBRERIA_ID_; })[0];
  if (!libreria) throw new Error('ACTUALIZAR_LIBRERIA_PROPIA_ERROR: este proyecto no depende de la libreria CORE.');

  var versionAnterior = String(libreria.version);
  var versionNueva = String(obtenerVersionLibreriaMasReciente_());
  if (versionAnterior === versionNueva) {
    return { sinCambios: true, versionActual: versionAnterior };
  }

  libreria.version = versionNueva;
  archivoManifiesto.source = JSON.stringify(manifiesto);

  var respSubir = UrlFetchApp.fetch(
    'https://script.googleapis.com/v1/projects/' + scriptId + '/content',
    {
      method: 'put',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token },
      payload: JSON.stringify({ files: contenido.files }),
      muteHttpExceptions: true
    }
  );
  if (respSubir.getResponseCode() !== 200) {
    throw new Error('ACTUALIZAR_LIBRERIA_PROPIA_ERROR: ' + respSubir.getResponseCode() + ' ' + respSubir.getContentText());
  }

  return { sinCambios: false, versionAnterior: versionAnterior, versionNueva: versionNueva };
}

/**
 * subirContenidoScript_ necesita saber que version de la libreria CORE
 * poner en el appsscript.json de cada cliente nuevo. En vez de guardarla
 * a mano en una Script Property (ver conversacion -- "¿no es algo que
 * tengamos que automatizar para evitar este error?", olvidarse de
 * actualizarla tras cada 'clasp version' rompia el montaje con un error
 * evitable), se pregunta a la propia libreria cual es su version
 * publicada mas alta justo antes de montar -- mismo token/scope
 * (script.projects) que ya usa crearProyectoScript_/subirContenidoScript_,
 * sin credenciales ni pasos manuales adicionales.
 */
function obtenerVersionLibreriaMasReciente_() {
  var token = ScriptApp.getOAuthToken();
  var resp = UrlFetchApp.fetch(
    'https://script.googleapis.com/v1/projects/' + LIBRERIA_ID_ + '/versions?pageSize=200',
    { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true }
  );
  if (resp.getResponseCode() !== 200) {
    throw new Error('OBTENER_VERSION_LIBRERIA_ERROR: ' + resp.getResponseCode() + ' ' + resp.getContentText());
  }
  var versiones = (JSON.parse(resp.getContentText()).versions || []).map(function (v) { return v.versionNumber; });
  if (versiones.length === 0) throw new Error('OBTENER_VERSION_LIBRERIA_ERROR: la libreria CORE no tiene ninguna version publicada.');
  return Math.max.apply(null, versiones);
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
 *
 * Via silenciosa y sin garantias: un trigger instalable corre con la
 * autorizacion que tenia quien lo configuro en su momento, y si el
 * manifiesto pide un scope nuevo despues (ver oauthScopes en
 * appsscript.json) el trigger falla ANTES de entrar aqui -- ni
 * siquiera llega al try/catch, no se escribe nada en ERROR. Por eso
 * existe tambien aprobarSolicitudMontaje() mas abajo: la via principal
 * pensada para usarse desde un dialogo, sincrona, que siempre informa
 * de exito o error porque corre con la autorizacion de quien la pulsa
 * en ese momento, no con una autorizacion congelada de un trigger.
 */
function alAprobarMontaje_(e) {
  var hoja = null;
  var fila = 0;
  var colError = 0;

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

    ejecutarAprobacionMontaje_(hoja, fila, cabeceras, Session.getEffectiveUser().getEmail());
  } catch (err) {
    console.error('alAprobarMontaje_: ' + err.message);
    if (hoja && fila && colError) hoja.getRange(fila, colError).setValue(err.message);
  }
}

/*
 * Trabajo real de aprobar una fila: crea el proyecto y escribe
 * ID_REAL/URL/FECHA_APROBACION/APROBADO_POR/ERROR. Compartido entre el
 * trigger onEdit (alAprobarMontaje_) y la aprobacion manual sincrona
 * (aprobarSolicitudMontaje) para no duplicar la logica de columnas.
 * Lanza en vez de tragarse el error -- cada llamador decide que hacer
 * con el (el trigger lo escribe en ERROR y sigue, el dialogo lo
 * propaga al withFailureHandler del cliente).
 */
function ejecutarAprobacionMontaje_(hoja, fila, cabeceras, emailAprobador) {
  var colIdReal = cabeceras.indexOf('ID_REAL') + 1;
  var colUrl = cabeceras.indexOf('URL') + 1;
  var colFechaAprobacion = cabeceras.indexOf('FECHA_APROBACION') + 1;
  var colAprobadoPor = cabeceras.indexOf('APROBADO_POR') + 1;
  var colError = cabeceras.indexOf('ERROR') + 1;

  var autorizados = obtenerEmailsAutorizadosMontaje_();
  if (autorizados.indexOf(emailAprobador) === -1) {
    throw new Error('AL_APROBAR_MONTAJE_ERROR: ' + emailAprobador + ' no esta autorizado para aprobar montajes.');
  }

  var datosFila = hoja.getRange(fila, 1, 1, cabeceras.length).getValues()[0];
  var colNombre = cabeceras.indexOf('NOMBRE');
  var colModulos = cabeceras.indexOf('MODULOS');
  var nombre = String(datosFila[colNombre] || '').trim();
  var modulos = String(datosFila[colModulos] || '').split(',').map(function (m) { return m.trim(); }).filter(Boolean);

  if (!nombre) throw new Error('AL_APROBAR_MONTAJE_ERROR: falta NOMBRE en la fila ' + fila + '.');
  if (modulos.length === 0) throw new Error('AL_APROBAR_MONTAJE_ERROR: falta MODULOS en la fila ' + fila + '.');

  var resultado = crearProyectoScript_(nombre, modulos);
  crearRegistroClienteDesdeMontaje_(nombre, modulos, resultado);

  if (colIdReal) hoja.getRange(fila, colIdReal).setValue(resultado.scriptId);
  if (colUrl) hoja.getRange(fila, colUrl).setValue(resultado.spreadsheetUrl);
  if (colFechaAprobacion) hoja.getRange(fila, colFechaAprobacion).setValue(new Date());
  if (colAprobadoPor) hoja.getRange(fila, colAprobadoPor).setValue(emailAprobador);
  if (colError) hoja.getRange(fila, colError).setValue('');

  return resultado;
}

/*
 * Aprobar una solicitud de montaje creaba el proyecto/Sheet real pero
 * nunca dejaba constancia en 38_CLIENTE (ver conversación -- INC-0019):
 * el cliente nuevo era invisible en Panel de Clientes/Gestión remota
 * hasta que alguien lo daba de alta a mano copiando SCRIPT_ID/SHEET_URL,
 * justo el paso manual que este flujo pretende evitar. TIPO_CLIENTE
 * 'Cliente de software' ya existe en el catálogo específicamente para
 * clientes auto-provisionados por este mismo flujo (ver
 * EstructuraInicialDatos.js).
 *
 * Comprueba primero si ya existe un CLIENTE con este SCRIPT_ID (defensa
 * ante reejecución de la misma aprobación) -- no debería ocurrir porque
 * obtenerSolicitudesPendientesMontaje ya filtra filas con ID_REAL
 * relleno, pero es una comprobación barata y evita duplicar el cliente
 * si algo llama a esta función dos veces.
 */
function crearRegistroClienteDesdeMontaje_(nombre, modulos, resultadoMontaje) {
  var yaExiste = listarRegistrosSeguro_('CLIENTE', { ACTIVO: 'SÍ', SCRIPT_ID: resultadoMontaje.scriptId })[0];
  if (yaExiste) return yaExiste;

  return insertarRegistroTransaccional('CLIENTE', {
    NOMBRE: nombre,
    TIPO_CLIENTE: 'Cliente de software',
    ESTADO: 'Activo',
    SHEET_URL: resultadoMontaje.spreadsheetUrl,
    SCRIPT_ID: resultadoMontaje.scriptId,
    MODULOS_CONTRATADOS: modulos.join(', ')
  }, { origen: 'SCRIPT' });
}

/*
 * Lista de solicitudes aun sin montar (ID_REAL vacio) para el
 * desplegable del dialogo de aprobacion manual.
 */
function obtenerSolicitudesPendientesMontaje() {
  var resultadoHoja = instalarHojaSolicitudesMontaje_();
  var hoja = resultadoHoja.hoja;
  var ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return [];

  var cabeceras = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  var colIdTemporal = cabeceras.indexOf('ID_TEMPORAL');
  var colNombre = cabeceras.indexOf('NOMBRE');
  var colModulos = cabeceras.indexOf('MODULOS');
  var colIdReal = cabeceras.indexOf('ID_REAL');

  var filas = hoja.getRange(2, 1, ultimaFila - 1, cabeceras.length).getValues();
  return filas
    .filter(function (fila) { return !String(fila[colIdReal] || '').trim(); })
    .map(function (fila) {
      return {
        idTemporal: String(fila[colIdTemporal] || ''),
        nombre: String(fila[colNombre] || ''),
        modulos: String(fila[colModulos] || '')
      };
    });
}

/*
 * Via principal de aprobacion (ver conversacion -- "no podemos
 * depender de escribir a mano el Aprobado"): se llama desde un
 * dialogo, corre de forma sincrona con la autorizacion de quien lo
 * pulsa en ese momento (no la de un trigger con autorizacion
 * congelada), y siempre devuelve exito o lanza un error que el
 * cliente puede mostrar -- nunca falla en silencio.
 */
function aprobarSolicitudMontaje(idTemporal) {
  idTemporal = String(idTemporal || '').trim();
  if (!idTemporal) throw new Error('APROBAR_SOLICITUD_MONTAJE_ERROR: falta idTemporal.');

  var resultadoHoja = instalarHojaSolicitudesMontaje_();
  var hoja = resultadoHoja.hoja;
  var ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) throw new Error('APROBAR_SOLICITUD_MONTAJE_ERROR: no hay solicitudes en ' + SOLICITUDES_MONTAJE_HOJA_ + '.');

  var cabeceras = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  var colIdTemporal = cabeceras.indexOf('ID_TEMPORAL');
  var colIdReal = cabeceras.indexOf('ID_REAL');
  var colEstado = cabeceras.indexOf('ESTADO') + 1;

  var filas = hoja.getRange(2, 1, ultimaFila - 1, cabeceras.length).getValues();
  var indiceFila = -1;
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i][colIdTemporal] || '').trim() === idTemporal) { indiceFila = i; break; }
  }
  if (indiceFila === -1) throw new Error('APROBAR_SOLICITUD_MONTAJE_ERROR: no se encontro ' + idTemporal + '.');
  if (String(filas[indiceFila][colIdReal] || '').trim()) {
    throw new Error('APROBAR_SOLICITUD_MONTAJE_ERROR: ' + idTemporal + ' ya tiene ID_REAL, no se vuelve a montar.');
  }

  var fila = indiceFila + 2;
  var emailAprobador = Session.getEffectiveUser().getEmail();
  var resultado = ejecutarAprobacionMontaje_(hoja, fila, cabeceras, emailAprobador);
  if (colEstado) hoja.getRange(fila, colEstado).setValue('Aprobado');

  return { spreadsheetUrl: resultado.spreadsheetUrl, scriptId: resultado.scriptId };
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
 * Lee el codigo fuente de la LIBRERIA CORE (script.projects.getContent
 * sobre LIBRERIA_ID_, no sobre ScriptApp.getScriptId()), genera los
 * envoltorios para los modulos pedidos con GeneradorEnvoltoriosEmbebido.js,
 * y sube Codigo.js + appsscript.json al proyecto nuevo con
 * script.projects.updateContent.
 *
 * Antes leia ScriptApp.getScriptId() (el proyecto que hace la llamada),
 * asumiendo que ese proyecto tenia el codigo fuente completo en crudo --
 * cierto solo para el Master (que recibe 'clasp push --force' del mismo
 * src/ que la libreria). Desde que APROVISIONAMIENTO se promovio a modulo
 * real de la libreria para poder usarse tambien desde clientes delgados
 * como Gestor de Proyectos (que solo tiene Codigo.js, sin fuente), esa
 * asuncion rompia en silencio: fuentePorNombre no encontraba coincidencias,
 * cada fichero quedaba con content: '', y el Codigo.gs generado salia
 * practicamente vacio (solo la cabecera y MODULOS_INSTALADOS_CLIENTE,
 * ninguna funcion) -- descubierto en vivo montando LaTroballa CORE desde
 * Gestor de Proyectos. La libreria SI tiene siempre el fuente completo
 * (es su unico proposito), asi que es la fuente correcta sin importar
 * desde que cliente se apruebe la solicitud.
 */
function subirContenidoScript_(scriptId, modulos) {
  var token = ScriptApp.getOAuthToken();

  var respLibreria = UrlFetchApp.fetch(
    'https://script.googleapis.com/v1/projects/' + LIBRERIA_ID_ + '/content',
    { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true }
  );
  if (respLibreria.getResponseCode() !== 200) {
    throw new Error('SUBIR_CONTENIDO_SCRIPT_ERROR: no se pudo leer el codigo fuente de la libreria -- ' + respLibreria.getContentText());
  }

  var contenidoLibreria = JSON.parse(respLibreria.getContentText());
  var fuentePorNombre = {};
  contenidoLibreria.files.forEach(function (file) { fuentePorNombre[file.name] = file.source; });

  var aFiles = PACKAGE_MAP_EMBEBIDO.entriesPackageA.map(function (entrada) {
    var nombreArchivo = entrada.path.replace(/^src\//, '').replace(/\.(js|html|json)$/, '');
    return { path: entrada.path, module: entrada.module, content: fuentePorNombre[nombreArchivo] || '' };
  });

  // Blindaje contra el bug ya visto: si el lookup por nombre falla (p.ej.
  // el proyecto leido no es realmente la libreria), mejor un error claro
  // aqui que un Codigo.js casi vacio sin ninguna funcion.
  var sinContenido = aFiles.filter(function (f) { return !f.content; }).map(function (f) { return f.path; });
  if (sinContenido.length > 0) {
    throw new Error('SUBIR_CONTENIDO_SCRIPT_ERROR: ' + sinContenido.length + ' fichero(s) sin contenido al leer la libreria -- ' + sinContenido.slice(0, 5).join(', '));
  }

  var generado = generarEnvoltoriosParaModulos_(aFiles, modulos, 'Core');
  var versionLibreria = obtenerVersionLibreriaMasReciente_();

  // enabledAdvancedServices: Sheets v4 (ver conversación -- "Calidad de
  // planificación" fallaba en vivo con "no se ha activado el servicio
  // avanzado de Google Sheets"). LecturaBatchService.js lo usa para
  // Gantt/Vista del día/Calidad de planificación
  // (Sheets.Spreadsheets.Values.batchGet) -- informes disponibles para
  // cualquier cliente CORE, no solo con GANTT instalado, así que se
  // declara siempre, igual que ya lo tiene Gestor de Proyectos.
  /*
   * webapp (ver conversación -- verificación en vivo del bot operativo,
   * despliegue devolviendo 404): sin este bloque el manifiesto no
   * declara ningún entryPoint de aplicación web, así que
   * Implementar > Nueva implementación crea un despliegue sin /exec
   * funcional -- 404 aunque la implementación "se complete". Todo
   * cliente montado por este generador puede necesitar exponer doPost
   * (WebhookTelegramService.js, bot operativo/COMUNICACION), así que se
   * declara siempre, no solo para clientes con ese módulo -- no tiene
   * coste si nunca se despliega como app web. access debe ser
   * 'ANYONE_ANONYMOUS', no 'ANYONE': con 'ANYONE' la API de Apps Script
   * sigue exigiendo que el llamador tenga sesión Google, y un webhook
   * (Telegram) sin login recibe 401.
   */
  var manifiesto = {
    timeZone: 'Europe/Madrid',
    dependencies: {
      libraries: [{ userSymbol: 'Core', libraryId: LIBRERIA_ID_, version: versionLibreria }],
      enabledAdvancedServices: [{ userSymbol: 'Sheets', serviceId: 'sheets', version: 'v4' }]
    },
    exceptionLogging: 'STACKDRIVER',
    runtimeVersion: 'V8',
    webapp: {
      access: 'ANYONE_ANONYMOUS',
      executeAs: 'USER_DEPLOYING'
    }
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
