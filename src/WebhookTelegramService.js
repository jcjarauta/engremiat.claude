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
 * o cliente) tiene su propio almacén de propiedades, sin colisión pese a
 * reutilizar el mismo nombre de propiedad.
 */

var PROPIEDAD_TOKEN_TELEGRAM_ = 'TELEGRAM_BOT_TOKEN';

function doPost(e) {
  try {
    if (e && e.postData && e.postData.contents) {
      var actualizacion = JSON.parse(e.postData.contents);
      if (!actualizacionYaProcesada_(actualizacion)) {
        if (moduloInstalado_('INTERNO')) {
          procesarMensajeTelegramSoporte_(actualizacion);
        } else if (moduloInstalado_('COMUNICACION')) {
          procesarMensajeBotOperativo_(actualizacion);
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
 * lo bastante rápido (arranque en frío de Apps Script, lectura de
 * Sheets), aunque el proceso original sí haya terminado bien. Sin esta
 * comprobación cada reintento crea efectos duplicados (INCIDENCIA,
 * correo, respuesta repetida). El backoff de reintentos de Telegram
 * puede superar los 10 min (confirmado en pruebas reales: reintentos
 * hasta 16 min después del mensaje original), así que se usa el máximo
 * de CacheService (6 h) en vez de un TTL corto que deja pasar los
 * reintentos más tardíos.
 */
function actualizacionYaProcesada_(actualizacion) {
  var updateId = actualizacion && actualizacion.update_id;
  if (updateId === undefined || updateId === null) return false;
  var cache = CacheService.getScriptCache();
  var clave = 'telegram_update_' + updateId;
  if (cache.get(clave)) return true;
  cache.put(clave, '1', 21600);
  return false;
}

/*
 * Envío genérico de mensaje, compartido por Nexo y el bot operativo --
 * mismo token (Propiedades del script de cada proyecto), mismo formato
 * de llamada, sin duplicar el UrlFetchApp en cada bot.
 */
function enviarMensajeTelegram_(chatId, texto) {
  var token = PropertiesService.getScriptProperties().getProperty(PROPIEDAD_TOKEN_TELEGRAM_);
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
function configurarWebhookTelegram_(tituloDialogo) {
  var ui = SpreadsheetApp.getUi();
  var respuesta = ui.prompt(
    tituloDialogo,
    'Pega la URL de la implementación como aplicación web (termina en /exec):',
    ui.ButtonSet.OK_CANCEL
  );
  if (respuesta.getSelectedButton() !== ui.Button.OK) return;

  var urlWebApp = respuesta.getResponseText().trim();
  if (!urlWebApp) return;

  var token = PropertiesService.getScriptProperties().getProperty(PROPIEDAD_TOKEN_TELEGRAM_);
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
