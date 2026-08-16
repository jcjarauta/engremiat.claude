/**
 * Proteccion.gs -- Fase 1 (BL-MVP-02): proteccion de hojas de datos.
 * Reconstruido tras deteccion de regresion via AUD-01 (falta punto de entrada de edicion controlada).
 */

/*
 * modulosInstalados (ver conversación -- "revisa la carga de hojas del
 * core"): sin filtrar, esta lista recorría las 47 entidades sin
 * importar qué módulos tiene el cliente -- no llegaba a cargar datos de
 * otro módulo (getSheetByName sobre una hoja que no existe no hace
 * nada), pero sí llenaba el resultado de "no existe la hoja" para cada
 * hoja de un módulo no instalado, ruido inútil en clientes CORE-only.
 * Mismo criterio que hojaInstalable_ (EstructuraInicialService.js):
 * sin modulosInstalados (Sheet maestro, código en crudo) se protege
 * todo.
 */
function hojasProtegiblesMVP_(modulosInstalados) {
  var hojas = Object.keys(ENTIDADES_MVP)
    .map(function (clave) { return ENTIDADES_MVP[clave].hoja; })
    .filter(function (nombreHoja) { return hojaInstalable_(nombreHoja, modulosInstalados); });
  hojas.push('90_CONFIGURACION', '91_HISTORIAL');
  return hojas;
}

function protegerHojasDatosMVP(modulosInstalados) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var resultado = { protegidas: [], yaProtegidas: [], errores: [] };
  hojasProtegiblesMVP_(modulosInstalados).forEach(function (nombreHoja) {
    try {
      var hoja = ss.getSheetByName(nombreHoja);
      if (!hoja) { resultado.errores.push(nombreHoja + ': no existe la hoja'); return; }
      var protecciones = hoja.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      if (protecciones.length > 0) { resultado.yaProtegidas.push(nombreHoja); return; }
      var proteccion = hoja.protect().setDescription('Datos MVP -- edite mediante los formularios del menu Taller de Produccion');
      proteccion.setWarningOnly(true);
      resultado.protegidas.push(nombreHoja);
    } catch (e) {
      resultado.errores.push(nombreHoja + ': ' + e.message);
    }
  });
  return resultado;
}

function abrirProteccionHojas(modulosInstalados) {
  modulosInstalados = resolverModulosInstalados_(modulosInstalados);
  var resultado = protegerHojasDatosMVP(modulosInstalados);
  var mensaje = 'Protegidas ahora: ' + resultado.protegidas.length +
    '\nYa protegidas: ' + resultado.yaProtegidas.length +
    (resultado.errores.length ? '\nErrores: ' + resultado.errores.join('; ') : '');
  SpreadsheetApp.getUi().alert('Proteccion de hojas', mensaje, SpreadsheetApp.getUi().ButtonSet.OK);
}