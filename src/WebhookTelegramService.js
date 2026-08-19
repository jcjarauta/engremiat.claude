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

function doPost(e, tokenTelegram) {
  try {
    if (e && e.postData && e.postData.contents) {
      var actualizacion = JSON.parse(e.postData.contents);
      if (!actualizacionYaProcesada_(actualizacion)) {
        if (moduloInstalado_('INTERNO')) {
          procesarMensajeTelegramSoporte_(actualizacion, tokenTelegram);
        } else if (moduloInstalado_('COMUNICACION')) {
          procesarMensajeBotOperativo_(actualizacion, tokenTelegram);
        }
      }
    }
  } catch (err) {
    console.error('doPost Telegram: ' + err.message);
  }
  return ContentService.createTextOutput('');
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
function sondearActualizacionesTelegram_(tokenTelegram, offsetActual) {
  if (!tokenTelegram) {
    console.error('sondearActualizacionesTelegram_: falta el token');
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
    console.error('sondearActualizacionesTelegram_: respuesta no JSON de Telegram: ' + resp.getContentText());
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
      console.error('sondearActualizacionesTelegram_: ' + err.message);
    }
    offsetNuevo = actualizacion.update_id + 1;
  });

  return { offsetNuevo: offsetNuevo, procesadas: datos.result.length };
}

function eliminarWebhookTelegram_(tokenTelegram) {
  var token = tokenTelegram || PropertiesService.getScriptProperties().getProperty(PROPIEDAD_TOKEN_TELEGRAM_);
  if (!token) return;
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/deleteWebhook', { muteHttpExceptions: true });
}
