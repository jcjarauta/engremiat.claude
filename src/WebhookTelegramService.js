/**
 * Punto de entrada único de Apps Script como aplicación web (doPost) --
 * solo puede existir un doPost por proyecto, así que este archivo es el
 * despachador neutro compartido entre los dos bots de Telegram del
 * ecosistema (ver ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS.md, "Dos bots
 * distintos, no uno"):
 *
 * - moduloInstalado_('INTERNO'): bot de soporte "Nexo" (solo maestro,
 *   La Troballa <-> cada cliente) -- lógica en TelegramSoporteService.js.
 * - moduloInstalado_('COMUNICACION'): bot operativo del cliente (dentro
 *   de cada Sheet de cliente, equipo <-> su propia instancia) -- lógica
 *   en BotOperativoService.js.
 *
 * Vive en CORE (siempre presente) porque ninguno de los dos módulos que
 * despacha es garantizado -- el propio moduloInstalado_() decide en
 * tiempo de ejecución cuál aplica, exactamente igual que el resto de
 * bloques condicionales de onOpen(). Token del bot en Propiedades del
 * script (TELEGRAM_BOT_TOKEN), nunca en código -- cada proyecto (maestro
 * o cliente) tiene su propio almacén de propiedades.
 *
 * OJO -- esto NO se cumple gratis para clientes que usan la librería
 * compartida (todos salvo el maestro, que corre el código directamente):
 * PropertiesService.getScriptProperties() dentro de código de una
 * LIBRERÍA lee las propiedades de LA LIBRERÍA, no las del proyecto
 * cliente que la invoca (limitación documentada de Apps Script). Por eso
 * doPost/enviarMensajeTelegram_/configurarWebhookTelegram_ aceptan el
 * token como parámetro opcional -- el maestro sigue llamándolas sin él
 * (su propio PropertiesService.getScriptProperties() ya es el correcto),
 * pero el envoltorio generado para cada cliente (ver
 * GeneradorEnvoltoriosEmbebido.js/generate-shell-wrappers.mjs,
 * FUNCIONES_QUE_RECIBEN_TOKEN_TELEGRAM_) lo lee localmente en su propio
 * proyecto y lo pasa explícitamente.
 */

var PROPIEDAD_TOKEN_TELEGRAM_ = 'TELEGRAM_BOT_TOKEN';

/*
 * modulosInstalados (ver conversación -- el bot operativo respondía con
 * el texto de Nexo): moduloInstalado_() lee modulosInstaladosClienteActual_,
 * una variable de ámbito de LIBRERÍA que solo fija onOpen() -- en una
 * ejecución aislada como esta (disparada directamente como aplicación
 * web, sin que onOpen() haya corrido antes en la MISMA ejecución) esa
 * variable nunca se fija, y moduloInstalado_() cae en su valor por
 * defecto "todo instalado", incluido INTERNO -- por eso el bot operativo
 * despachaba a procesarMensajeTelegramSoporte_ (Nexo) en vez de a
 * procesarMensajeBotOperativo_. Mismo patrón que onOpen(): resolver y
 * fijar modulosInstaladosClienteActual_ al principio de la ejecución.
 */
function doPost(e, tokenTelegram, modulosInstalados) {
  var resueltos = resolverModulosInstalados_(modulosInstalados);
  modulosInstaladosClienteActual_ = Array.isArray(resueltos) ? resueltos : null;
  var respuesta = '';
  try {
    if (e && e.postData && e.postData.contents) {
      var cuerpo = JSON.parse(e.postData.contents);

      /*
       * Solicitud de autoactualización de un cliente (ver conversación --
       * "necesitamos que cada cliente pueda autogestionar la actualización
       * de su Sheet, sin pedirle el scope OAuth script.projects"): distinto
       * de una actualización de Telegram (que trae update_id/message), así
       * que se distingue por forma antes de entrar en la rama de Telegram.
       * Solo el maestro recibe esto de verdad (moduloInstalado_('INTERNO')
       * es su valor por defecto); en un cliente normal este doPost nunca
       * ve una petición con esta forma porque nadie se la manda salvo el
       * propio envoltorio generado, ver
       * solicitarActualizacionLibreria en GeneradorEnvoltoriosEmbebido.js/
       * generate-shell-wrappers.mjs.
       */
      if (cuerpo && cuerpo.accion === 'solicitar_actualizacion_libreria') {
        respuesta = JSON.stringify(procesarSolicitudActualizacionLibreria_(cuerpo.scriptId));
      } else if (cuerpo && cuerpo.accion === 'notificar_operador') {
        respuesta = JSON.stringify(procesarNotificacionOperador_(cuerpo.asunto, cuerpo.cuerpo, cuerpo.cuerpoHtml));
      } else if (cuerpo && cuerpo.accion === 'instalar_modulo_cliente') {
        respuesta = JSON.stringify(procesarInstalacionModuloCliente_(cuerpo.scriptId, cuerpo.modulo));
      } else if (!actualizacionYaProcesada_(cuerpo)) {
        if (moduloInstalado_('INTERNO')) {
          procesarMensajeTelegramSoporte_(cuerpo, tokenTelegram);
        } else if (moduloInstalado_('COMUNICACION')) {
          procesarMensajeBotOperativo_(cuerpo, tokenTelegram);
        }
      }
    }
  } catch (err) {
    console.error('doPost Telegram: ' + err.message);
    respuesta = JSON.stringify({ ok: false, error: err.message });
  }
  return respuesta
    ? ContentService.createTextOutput(respuesta).setMimeType(ContentService.MimeType.JSON)
    : ContentService.createTextOutput('');
}

/*
 * Telegram reintenta la entrega del mismo update_id si no recibe el 200
 * lo bastante rápido, aunque el proceso original sí haya terminado bien
 * -- confirmado en pruebas reales: reintentos del MISMO mensaje más de
 * 7 horas después del original (10:14 -> 17:11), muy por encima de las
 * 6h que es el máximo que admite CacheService. No hay TTL de caché que
 * cubra esto -- Telegram puede seguir reintentando durante horas, así
 * que la deduplicación tiene que ser permanente (PropertiesService, sin
 * caducidad), no un TTL por generoso que sea. Se guardan solo los
 * últimos MAX_UPDATES_RECORDADOS_ para no crecer sin límite. Bajo lock
 * corto porque dos entregas casi simultáneas podrían pisarse el
 * lectura-modificación-escritura si no se serializa.
 */
var PROPIEDAD_UPDATES_PROCESADOS_ = 'TELEGRAM_UPDATES_PROCESADOS';
var MAX_UPDATES_RECORDADOS_ = 500;

function actualizacionYaProcesada_(actualizacion) {
  var updateId = actualizacion && actualizacion.update_id;
  if (updateId === undefined || updateId === null) return false;

  var bloqueo = LockService.getScriptLock();
  var tieneBloqueo = bloqueo.tryLock(5000);

  try {
    var props = PropertiesService.getScriptProperties();
    var lista;
    try {
      lista = JSON.parse(props.getProperty(PROPIEDAD_UPDATES_PROCESADOS_) || '[]');
    } catch (err) {
      lista = [];
    }

    if (lista.indexOf(updateId) !== -1) return true;

    lista.push(updateId);
    if (lista.length > MAX_UPDATES_RECORDADOS_) {
      lista = lista.slice(lista.length - MAX_UPDATES_RECORDADOS_);
    }
    props.setProperty(PROPIEDAD_UPDATES_PROCESADOS_, JSON.stringify(lista));
    return false;
  } finally {
    if (tieneBloqueo) bloqueo.releaseLock();
  }
}

/*
 * Envío genérico de mensaje, compartido por Nexo y el bot operativo --
 * mismo token (Propiedades del script de cada proyecto), mismo formato
 * de llamada, sin duplicar el UrlFetchApp en cada bot.
 */
function enviarMensajeTelegram_(chatId, texto, tokenTelegram) {
  var token = tokenTelegram || PropertiesService.getScriptProperties().getProperty(PROPIEDAD_TOKEN_TELEGRAM_);
  if (!token) {
    console.error('enviarMensajeTelegram_: falta TELEGRAM_BOT_TOKEN en Propiedades del script');
    return;
  }
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: texto }),
    muteHttpExceptions: true
  });
}

/*
 * Configuración del webhook -- compartida por ambos bots, cada uno con
 * su propia implementación como aplicación web y su propio token en
 * Propiedades del script del proyecto en el que se ejecuta.
 */
function configurarWebhookTelegram_(tituloDialogo, tokenTelegram) {
  var ui = SpreadsheetApp.getUi();
  var respuesta = ui.prompt(
    tituloDialogo,
    'Pega la URL de la implementación como aplicación web (termina en /exec):',
    ui.ButtonSet.OK_CANCEL
  );
  if (respuesta.getSelectedButton() !== ui.Button.OK) return;

  var urlWebApp = respuesta.getResponseText().trim();
  if (!urlWebApp) return;

  var token = tokenTelegram || PropertiesService.getScriptProperties().getProperty(PROPIEDAD_TOKEN_TELEGRAM_);
  if (!token) {
    ui.alert('Falta configurar TELEGRAM_BOT_TOKEN en Propiedades del script antes de esto.');
    return;
  }

  var resultado = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + token + '/setWebhook?url=' + encodeURIComponent(urlWebApp),
    { muteHttpExceptions: true }
  );
  ui.alert('Resultado', resultado.getContentText(), ui.ButtonSet.OK);
}

/*
 * Sondeo (polling) en vez de webhook -- ver conversación: toda Web App de
 * Apps Script responde con una redirección 302 (a script.googleusercontent.com)
 * antes de servir el contenido real; confirmado empíricamente que afecta
 * igual a un despliegue creado desde la UI (Nexo, maestro) que a uno
 * creado por clasp (bot operativo, cliente) -- no es un problema de cómo
 * se desplegó, es inherente al modelo de Web App. Telegram no siempre
 * sigue esa redirección, así que la entrega por webhook puede fallar o
 * demorarse horas (reintentos). El sondeo evita el problema del todo:
 * Apps Script llama activamente a Telegram (getUpdates), sin exponer
 * ningún endpoint al que Telegram tenga que llegar.
 *
 * Función pura a propósito -- token y offset ENTRAN como parámetros y el
 * offset nuevo SALE en el resultado, sin tocar PropertiesService aquí:
 * igual que con el token (ver cabecera del fichero), PropertiesService
 * dentro de código de librería no ve las propiedades del proyecto
 * cliente, así que leer/escribir el offset tiene que hacerlo el
 * envoltorio de cada proyecto (activarSondeoBotOperativo/
 * sondearTelegramBotOperativo en el Codigo.js de cada cliente,
 * activarSondeoTelegramSoporte/sondearTelegramSoporte en el maestro).
 */
function sondearActualizacionesTelegram(tokenTelegram, offsetActual, modulosInstalados) {
  var resueltos = resolverModulosInstalados_(modulosInstalados);
  modulosInstaladosClienteActual_ = Array.isArray(resueltos) ? resueltos : null;
  if (!tokenTelegram) {
    console.error('sondearActualizacionesTelegram: falta el token');
    return { offsetNuevo: offsetActual, procesadas: 0 };
  }

  var resp = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + tokenTelegram + '/getUpdates?offset=' + (offsetActual || 0) + '&timeout=0',
    { muteHttpExceptions: true }
  );

  var datos;
  try {
    datos = JSON.parse(resp.getContentText());
  } catch (err) {
    console.error('sondearActualizacionesTelegram: respuesta no JSON de Telegram: ' + resp.getContentText());
    return { offsetNuevo: offsetActual, procesadas: 0 };
  }

  if (!datos.ok || !datos.result || datos.result.length === 0) {
    return { offsetNuevo: offsetActual, procesadas: 0 };
  }

  var offsetNuevo = offsetActual;

  datos.result.forEach(function (actualizacion) {
    try {
      if (moduloInstalado_('INTERNO')) {
        procesarMensajeTelegramSoporte_(actualizacion, tokenTelegram);
      } else if (moduloInstalado_('COMUNICACION')) {
        procesarMensajeBotOperativo_(actualizacion, tokenTelegram);
      }
    } catch (err) {
      console.error('sondearActualizacionesTelegram: ' + err.message);
    }
    offsetNuevo = actualizacion.update_id + 1;
  });

  return { offsetNuevo: offsetNuevo, procesadas: datos.result.length };
}

function eliminarWebhookTelegram(tokenTelegram) {
  var token = tokenTelegram || PropertiesService.getScriptProperties().getProperty(PROPIEDAD_TOKEN_TELEGRAM_);
  if (!token) return;
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/deleteWebhook', { muteHttpExceptions: true });
}

/*
 * Autoservicio de actualización sin pedirle a cada cliente el scope OAuth
 * script.projects (ver conversación -- ese scope da acceso de lectura/
 * escritura a CUALQUIER proyecto de Apps Script de la cuenta del cliente,
 * más potencia de la que un Sheet de producción normal necesita, y
 * dispara una pantalla de reautorización nueva). El cliente nunca pide
 * ese scope: su botón solo hace un UrlFetchApp.fetch normal (scope
 * script.external_request, ya habitual en este proyecto para Telegram)
 * contra este mismo doPost -- el maestro, que YA tiene script.projects
 * autorizado para Aprovisionamiento, hace la actualización real por él.
 * Reutiliza actualizarLibreriaClienteRemoto_/actualizarLibreriaVersionEn
 * FichaCliente_ (AprovisionamientoService.js) -- mismo camino que
 * "Gestión remota de clientes", solo que disparado por el propio cliente
 * en vez de por un operador.
 */
function procesarSolicitudActualizacionLibreria_(scriptId) {
  if (!scriptId) return { ok: false, error: 'Falta scriptId en la solicitud.' };
  try {
    var resultado = actualizarLibreriaClienteRemoto_(scriptId);
    actualizarLibreriaVersionEnFichaCliente_(scriptId, resultado.versionNueva);
    return { ok: true, versionAnterior: resultado.versionAnterior, versionNueva: resultado.versionNueva };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/*
 * Cuerpo real generado íntegro en el Codigo.js de cada cliente (ver
 * FUNCIONES_ACTIVACION_SONDEO_TELEGRAM_/pushWrapperBody_ en
 * GeneradorEnvoltoriosEmbebido.js y su gemelo Node.js): necesita leer
 * ScriptApp.getScriptId() del proyecto CLIENTE, no de esta librería (ver
 * cabecera del fichero -- ScriptApp, igual que PropertiesService, dentro
 * de código de librería no ve el contexto del proyecto que la invoca).
 * Este cuerpo vacío existe solo para que el generador la descubra como
 * perteneciente a CORE (siempre disponible, cualquier cliente, no solo
 * los que tienen APROVISIONAMIENTO) -- nunca se llama.
 */
function solicitarActualizacionLibreria() {}

/*
 * Aviso al operador humano por correo cuando Claude cierra un ciclo de
 * trabajo (ver conversación -- "necesito que me envíes por correo la
 * notificación con la función nativa de sheets"): mismo patrón que la
 * autoactualización de librería de arriba -- se invoca directamente
 * contra el /exec del maestro, nunca desde un cliente, así que no
 * necesita wrapper generado ni pasar por moduloInstalado_.
 */
var CORREO_OPERADOR_ = 'sacandofilo@gmail.com';

/*
 * Instalación remota de un módulo en un cliente existente (ver
 * conversación -- "implementa en el gestor de proyectos [OPORTUNIDAD/
 * IMPACTO/EJECUCION/ESCENARIOS], tenemos que dejarlo preparado para
 * poder crear configuraciones de montaje para futuros clientes"): mismo
 * patrón que el resto de acciones de este router -- reutiliza
 * agregarModuloClienteDesdeDialogo (AprovisionamientoService.js), que ya
 * hace exactamente esto para el diálogo de Gestión remota de clientes,
 * solo que aquí se dispara vía /exec en vez de desde la UI del Sheet.
 */
function procesarInstalacionModuloCliente_(scriptId, modulo) {
  if (!scriptId) return { ok: false, error: 'Falta scriptId en la solicitud.' };
  if (!modulo) return { ok: false, error: 'Falta modulo en la solicitud.' };
  try {
    var resultado = agregarModuloClienteDesdeDialogo(scriptId, modulo);
    return { ok: true, resultado: resultado };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function procesarNotificacionOperador_(asunto, cuerpoMensaje, cuerpoHtml) {
  if (!asunto) return { ok: false, error: 'Falta asunto en la solicitud.' };
  try {
    var opciones = cuerpoHtml ? { htmlBody: cuerpoHtml } : undefined;
    MailApp.sendEmail(CORREO_OPERADOR_, asunto, cuerpoMensaje || '', opciones);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
