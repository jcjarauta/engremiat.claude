/**
 * Bot operativo del cliente -- primer incremento, solo lectura (ver
 * ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS.md, "Dos bots distintos, no
 * uno" / "Modelo de permisos del bot operativo"). Vive *dentro* de cada
 * Sheet de cliente (módulo COMUNICACION), a diferencia de Nexo (solo
 * maestro): el equipo del cliente escribe, se identifica por
 * PERSONA_EQUIPO.TELEGRAM_CHAT_ID, y recibe una respuesta de consulta --
 * nadie escribe en el Sheet todavía en este incremento.
 *
 * REGISTRO_COMANDOS_BOT_ es declarativo a propósito (comando, módulo del
 * que depende, permiso mínimo, handler) -- mismo idioma que
 * REGISTRO_INFORMES_ y el filtrado de menú por moduloInstalado_(), para
 * no inventar una segunda forma de "esto depende del módulo X". Añadir
 * un comando nuevo es añadir una entrada aquí, no tocar el despachador.
 *
 * doPost/dedupe/envío de mensajes viven en WebhookTelegramService.js
 * (compartido con Nexo, solo puede haber un doPost por proyecto).
 */

var NIVEL_PERMISO_BOT_RANGO_ = { Consulta: 0, Colaborador: 1, Administrador: 2 };

var REGISTRO_COMANDOS_BOT_ = [
  { comando: '/ayuda', descripcion: 'Lista de comandos disponibles', modulo: null, permisoMinimo: 'Consulta', handler: comandoBotAyuda_ },
  { comando: '/mis_tareas', descripcion: 'Tus tareas activas', modulo: null, permisoMinimo: 'Consulta', handler: comandoBotMisTareas_ },
  { comando: '/hoy', descripcion: 'Tus tareas con fecha fin hoy o vencidas, e incidencias abiertas a tu cargo', modulo: 'SEGUIMIENTO', permisoMinimo: 'Consulta', handler: comandoBotHoy_ }
];

function procesarMensajeBotOperativo_(actualizacion) {
  var mensaje = actualizacion && actualizacion.message;
  if (!mensaje || !mensaje.text) return;

  var chatId = String(mensaje.chat.id);
  var texto = mensaje.text.trim();

  var persona = listarRegistrosSeguro_('PERSONA_EQUIPO', { ACTIVO: 'SÍ' }).filter(function (p) {
    return String(p.TELEGRAM_CHAT_ID || '').trim() === chatId;
  })[0];

  if (!persona) {
    enviarMensajeTelegram_(chatId, 'Este chat todavía no está vinculado a ninguna persona del equipo. Pide que te den de alta el Chat ID de Telegram en tu ficha.');
    return;
  }

  var comando = texto.split(/\s+/)[0].toLowerCase();
  var entrada = REGISTRO_COMANDOS_BOT_.filter(function (c) { return c.comando === comando; })[0];

  if (!entrada) {
    enviarMensajeTelegram_(chatId, 'No reconozco ese comando. Escribe /ayuda para ver los disponibles.');
    return;
  }

  if (entrada.modulo && !moduloInstalado_(entrada.modulo)) {
    enviarMensajeTelegram_(chatId, 'Ese comando no está disponible en esta instancia.');
    return;
  }

  var rangoPersona = NIVEL_PERMISO_BOT_RANGO_[persona.NIVEL_PERMISO_BOT] || -1;
  var rangoRequerido = NIVEL_PERMISO_BOT_RANGO_[entrada.permisoMinimo] || 0;
  if (rangoPersona < rangoRequerido) {
    enviarMensajeTelegram_(chatId, 'No tienes permiso para usar ese comando.');
    return;
  }

  enviarMensajeTelegram_(chatId, entrada.handler(persona));
}

/*
 * Comandos disponibles para esta persona: filtrados por módulo instalado
 * y por su propio nivel de permiso -- lo mismo que ve el despachador,
 * expuesto como ayuda en vez de descubrirlo a base de intentos.
 */
function comandoBotAyuda_(persona) {
  var rangoPersona = NIVEL_PERMISO_BOT_RANGO_[persona.NIVEL_PERMISO_BOT] || -1;
  var disponibles = REGISTRO_COMANDOS_BOT_.filter(function (c) {
    if (c.modulo && !moduloInstalado_(c.modulo)) return false;
    return rangoPersona >= (NIVEL_PERMISO_BOT_RANGO_[c.permisoMinimo] || 0);
  });
  return 'Comandos disponibles:\n' + disponibles.map(function (c) { return c.comando + ' -- ' + c.descripcion; }).join('\n');
}

function comandoBotMisTareas_(persona) {
  var idsTarea = listarRegistrosSeguro_('TAREA_RESPONSABLE', { ACTIVO: 'SÍ', ESTADO: 'Activa' })
    .filter(function (a) { return a.PERSONA_EQUIPO_ID === persona.ID; })
    .map(function (a) { return a.TAREA_ID; });

  var tareas = listarRegistrosSeguro_('TAREA', { ACTIVO: 'SÍ' }).filter(function (t) {
    return idsTarea.indexOf(t.ID) !== -1 && t.ESTADO !== 'Completada' && t.ESTADO !== 'Cancelada';
  });

  if (tareas.length === 0) return 'No tienes tareas activas asignadas.';
  return 'Tus tareas activas:\n' + tareas.map(function (t) {
    return '- ' + t.NOMBRE + ' (' + t.ESTADO + (t.FECHA_FIN_PLAN ? ', hasta ' + t.FECHA_FIN_PLAN : '') + ')';
  }).join('\n');
}

function comandoBotHoy_(persona) {
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  var idsTarea = listarRegistrosSeguro_('TAREA_RESPONSABLE', { ACTIVO: 'SÍ', ESTADO: 'Activa' })
    .filter(function (a) { return a.PERSONA_EQUIPO_ID === persona.ID; })
    .map(function (a) { return a.TAREA_ID; });

  var tareasHoy = listarRegistrosSeguro_('TAREA', { ACTIVO: 'SÍ' }).filter(function (t) {
    if (idsTarea.indexOf(t.ID) === -1 || t.ESTADO === 'Completada' || t.ESTADO === 'Cancelada') return false;
    if (!t.FECHA_FIN_PLAN) return false;
    var fechaFin = new Date(t.FECHA_FIN_PLAN);
    fechaFin.setHours(0, 0, 0, 0);
    return fechaFin <= hoy;
  });

  var incidenciasAbiertas = listarRegistrosSeguro_('INCIDENCIA', { ACTIVO: 'SÍ' }).filter(function (i) {
    return i.RESPONSABLE_ID === persona.ID && i.ESTADO === 'Abierta';
  });

  var lineas = [];
  if (tareasHoy.length > 0) {
    lineas.push('Tareas para hoy o vencidas:');
    tareasHoy.forEach(function (t) { lineas.push('- ' + t.NOMBRE + ' (hasta ' + t.FECHA_FIN_PLAN + ')'); });
  }
  if (incidenciasAbiertas.length > 0) {
    lineas.push('Incidencias abiertas a tu cargo:');
    incidenciasAbiertas.forEach(function (i) { lineas.push('- ' + i.TITULO); });
  }
  if (lineas.length === 0) return 'Nada pendiente para hoy.';
  return lineas.join('\n');
}

/*
 * Configuración del webhook -- una sola vez por cliente, desde su propio
 * proyecto de Apps Script (Deploy > Nueva implementación > Aplicación
 * web), con su propio TELEGRAM_BOT_TOKEN en Propiedades del script.
 */
function configurarWebhookBotOperativo() {
  configurarWebhookTelegram_('Configurar webhook de Telegram (bot operativo)');
}
