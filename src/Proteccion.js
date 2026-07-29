/**
 * Proteccion.gs -- Fase 1 (BL-MVP-02): proteccion de hojas de datos.
 * Reconstruido tras deteccion de regresion via AUD-01 (falta punto de entrada de edicion controlada).
 */

function hojasProtegiblesMVP_() {
  var hojas = Object.keys(ENTIDADES_MVP).map(function (clave) { return ENTIDADES_MVP[clave].hoja; });
  hojas.push('90_CONFIGURACION', '91_HISTORIAL');
  return hojas;
}

function protegerHojasDatosMVP() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var resultado = { protegidas: [], yaProtegidas: [], errores: [] };
  hojasProtegiblesMVP_().forEach(function (nombreHoja) {
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

function abrirProteccionHojas() {
  var resultado = protegerHojasDatosMVP();
  var mensaje = 'Protegidas ahora: ' + resultado.protegidas.length +
    '\nYa protegidas: ' + resultado.yaProtegidas.length +
    (resultado.errores.length ? '\nErrores: ' + resultado.errores.join('; ') : '');
  SpreadsheetApp.getUi().alert('Proteccion de hojas', mensaje, SpreadsheetApp.getUi().ButtonSet.OK);
}