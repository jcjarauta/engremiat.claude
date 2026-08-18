/**
 * Bot de soporte "Nexo" -- Fase 1a Mantenimiento (ver
 * ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS.md, sección "El canal de
 * comunicación"). Relé, no ejecutor: el cliente escribe, se identifica
 * por CLIENTE.TELEGRAM_CHAT_ID, se registra una INCIDENCIA de nivel
 * 'Cliente' y se avisa al operador por correo -- nadie ejecuta nada en
 * el Sheet del cliente automáticamente.
 *
 * Solo se invoca en el maestro (moduloInstalado_('INTERNO')), igual que
 * AprovisionamientoService.js -- despachado desde el doPost compartido
 * de WebhookTelegramService.js (doPost/actualizacionYaProcesada_/
 * enviarMensajeTelegram_ viven ahí, no aquí, porque solo puede haber un
 * doPost por proyecto y lo comparte con el bot operativo del cliente).
 *
 * Token del bot en Propiedades del script (TELEGRAM_BOT_TOKEN), nunca
 * en código -- ver conversación.
 */

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
    enviarMensajeTelegram_(chatId, 'Este chat todavía no está vinculado a ninguna cuenta. Escríbenos a ' + Session.getEffectiveUser().getEmail() + ' para activarlo.');
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

  enviarMensajeTelegram_(chatId, 'Recibido, gracias. Lo hemos registrado y te responderemos en breve.');

  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: 'Nexo: nuevo mensaje de soporte -- ' + cliente.NOMBRE,
    body: 'Cliente: ' + cliente.NOMBRE + ' (' + cliente.ID + ')\nDe: ' + remitente + '\n\n' + texto
  });
}

/*
 * Configuración del webhook -- una sola vez, a mano, desde el editor de
 * Apps Script (ejecutar esta función directamente, o desde el menú).
 * urlWebApp es la URL de la implementación como aplicación web, termina
 * en /exec.
 */
function configurarWebhookTelegramSoporte() {
  configurarWebhookTelegram_('Configurar webhook de Telegram (Nexo)');
}
