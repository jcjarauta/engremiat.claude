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

function procesarMensajeTelegramSoporte_(actualizacion, tokenTelegram) {
  var mensaje = actualizacion && actualizacion.message;
  if (!mensaje || !mensaje.text) return;

  var chatId = String(mensaje.chat.id);
  var texto = mensaje.text.trim();
  var remitente = (mensaje.from && mensaje.from.username ? '@' + mensaje.from.username : (mensaje.from && mensaje.from.first_name)) || 'desconocido';

  var cliente = listarRegistrosSeguro_('CLIENTE', { ACTIVO: 'SÍ' }).filter(function (c) {
    return String(c.TELEGRAM_CHAT_ID || '').trim() === chatId;
  })[0];

  if (!cliente) {
    enviarMensajeTelegram_(chatId, 'Este chat todavía no está vinculado a ninguna cuenta. Escríbenos a ' + Session.getEffectiveUser().getEmail() + ' para activarlo.', tokenTelegram);
    return;
  }

  /*
   * Cinturón de seguridad adicional a actualizacionYaProcesada_ (ver
   * conversación -- "necesitamos mejorar la comunicación, está en
   * bucle"): si por lo que sea un reintento se cuela pese a la
   * deduplicación por update_id, este segundo filtro por contenido
   * evita duplicar lo único que de verdad importa no duplicar -- la
   * INCIDENCIA y el correo. Silencioso a propósito: no se reenvía ni
   * la respuesta de Telegram ni el correo, porque ya se mandaron la
   * vez que sí se creó.
   */
  if (yaExisteIncidenciaRecienteParaMensaje_(cliente.ID, texto)) return;

  guardarFormulario('INCIDENCIA', null, {
    NIVEL_INCIDENCIA: 'Cliente',
    CLIENTE_ID: cliente.ID,
    TITULO: 'Soporte vía bot -- ' + cliente.NOMBRE,
    TIPO: 'Documentación',
    PRIORIDAD: 'Media',
    ESTADO: 'Abierta',
    OBSERVACIONES: 'De ' + remitente + ' (' + new Date().toLocaleString() + '): ' + texto
  });

  enviarMensajeTelegram_(chatId, 'Recibido, gracias. Lo hemos registrado y te responderemos en breve.', tokenTelegram);

  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: 'Nexo: nuevo mensaje de soporte -- ' + cliente.NOMBRE,
    body: 'Cliente: ' + cliente.NOMBRE + ' (' + cliente.ID + ')\nDe: ' + remitente + '\n\n' + texto
  });
}

/*
 * Ventana de una hora: suficiente para el patrón de reintentos en
 * ráfaga ya observado (cada ~2 min durante la primera hora); los
 * reintentos más tardíos (horas después) ya los cubre
 * actualizacionYaProcesada_, que no caduca.
 */
var VENTANA_DEDUP_INCIDENCIA_MS_ = 60 * 60 * 1000;

function yaExisteIncidenciaRecienteParaMensaje_(clienteId, texto) {
  var haceUnaHora = new Date(Date.now() - VENTANA_DEDUP_INCIDENCIA_MS_);
  return listarRegistrosSeguro_('INCIDENCIA', { ACTIVO: 'SÍ', NIVEL_INCIDENCIA: 'Cliente', CLIENTE_ID: clienteId }).some(function (inc) {
    var fechaCreacion = inc.FECHA_CREACION ? new Date(inc.FECHA_CREACION) : null;
    if (!fechaCreacion || isNaN(fechaCreacion.getTime()) || fechaCreacion < haceUnaHora) return false;
    return String(inc.OBSERVACIONES || '').indexOf(texto) !== -1;
  });
}

/*
 * Configuración del webhook -- una sola vez, a mano, desde el editor de
 * Apps Script (ejecutar esta función directamente, o desde el menú).
 * urlWebApp es la URL de la implementación como aplicación web, termina
 * en /exec.
 */
function configurarWebhookTelegramSoporte(tokenTelegram) {
  configurarWebhookTelegram_('Configurar webhook de Telegram (Nexo)', tokenTelegram);
}
