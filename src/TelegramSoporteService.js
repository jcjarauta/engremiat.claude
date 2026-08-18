/**
 * Bot de soporte "Nexo" -- Fase 1a Mantenimiento (ver
 * ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS.md, sección "El canal de
 * comunicación"). Relé, no ejecutor: el cliente escribe, se identifica
 * por CLIENTE.TELEGRAM_CHAT_ID, se registra una INCIDENCIA de nivel
 * 'Cliente' y se avisa al operador por correo -- nadie ejecuta nada en
 * el Sheet del cliente automáticamente.
 *
 * Solo vive en el maestro (moduloInstalado_('INTERNO')), igual que
 * AprovisionamientoService.js -- no tiene sentido en ningún cliente,
 * que no recibe webhooks de este bot.
 *
 * Token del bot en Propiedades del script (TELEGRAM_BOT_TOKEN), nunca
 * en código -- ver conversación.
 */

var PROPIEDAD_TOKEN_TELEGRAM_ = 'TELEGRAM_BOT_TOKEN';

/*
 * Punto de entrada de Apps Script como aplicación web (Deploy > Nueva
 * implementación > Aplicación web) -- Telegram llama aquí en cada
 * mensaje una vez configurado el webhook (configurarWebhookTelegramSoporte).
 * Siempre responde 200 vacío: Telegram reintenta si no recibe 200.
 */
function doPost(e) {
  try {
    if (moduloInstalado_('INTERNO') && e && e.postData && e.postData.contents) {
      var actualizacion = JSON.parse(e.postData.contents);
      if (actualizacionYaProcesada_(actualizacion)) {
        return ContentService.createTextOutput('');
      }
      procesarMensajeTelegramSoporte_(actualizacion);
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
 * comprobación cada reintento crea una INCIDENCIA y un correo duplicados.
 * Cache de 10 min es de sobra frente al backoff de reintentos de Telegram.
 */
function actualizacionYaProcesada_(actualizacion) {
  var updateId = actualizacion && actualizacion.update_id;
  if (updateId === undefined || updateId === null) return false;
  var cache = CacheService.getScriptCache();
  var clave = 'telegram_update_' + updateId;
  if (cache.get(clave)) return true;
  cache.put(clave, '1', 600);
  return false;
}

function procesarMensajeTelegramSoporte_(actualizacion) {
  var mensaje = actualizacion && actualizacion.message;
  if (!mensaje || !mensaje.text) return;

  var chatId = String(mensaje.chat.id);
  var texto = mensaje.text.trim();
  var remitente = (mensaje.from && mensaje.from.username ? '@' + mensaje.from.username : (mensaje.from && mensaje.from.first_name)) || 'desconocido';

  var cliente = listarRegistrosSeguro_('CLIENTE', { ACTIVO: 'SÍ' }).filter(function (c) {
    return String(c.TELEGRAM_CHAT_ID || '').trim() === chatId;
  })[0];

  if (!cliente) {
    enviarMensajeTelegramSoporte_(chatId, 'Este chat todavía no está vinculado a ninguna cuenta. Escríbenos a ' + Session.getEffectiveUser().getEmail() + ' para activarlo.');
    return;
  }

  guardarFormulario('INCIDENCIA', null, {
    NIVEL_INCIDENCIA: 'Cliente',
    CLIENTE_ID: cliente.ID,
    TITULO: 'Soporte vía bot -- ' + cliente.NOMBRE,
    TIPO: 'Documentación',
    PRIORIDAD: 'Media',
    ESTADO: 'Abierta',
    OBSERVACIONES: 'De ' + remitente + ' (' + new Date().toLocaleString() + '): ' + texto
  });

  enviarMensajeTelegramSoporte_(chatId, 'Recibido, gracias. Lo hemos registrado y te responderemos en breve.');

  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: 'Nexo: nuevo mensaje de soporte -- ' + cliente.NOMBRE,
    body: 'Cliente: ' + cliente.NOMBRE + ' (' + cliente.ID + ')\nDe: ' + remitente + '\n\n' + texto
  });
}

function enviarMensajeTelegramSoporte_(chatId, texto) {
  var token = PropertiesService.getScriptProperties().getProperty(PROPIEDAD_TOKEN_TELEGRAM_);
  if (!token) {
    console.error('enviarMensajeTelegramSoporte_: falta TELEGRAM_BOT_TOKEN en Propiedades del script');
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
 * Configuración del webhook -- una sola vez, a mano, desde el editor de
 * Apps Script (ejecutar esta función directamente, o añadir un item de
 * menú si se usa a menudo). urlWebApp es la URL de la implementación
 * como aplicación web, termina en /exec.
 */
function configurarWebhookTelegramSoporte() {
  var ui = SpreadsheetApp.getUi();
  var respuesta = ui.prompt(
    'Configurar webhook de Telegram',
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
