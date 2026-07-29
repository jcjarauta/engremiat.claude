/**
 * EdicionDirecta.gs -- Fase 1 (BL-MVP-02): onEdit(e) como detector secundario.
 * Nunca es la via de escritura del sistema; solo registra y avisa.
 * Reconstruido tras deteccion de regresion via AUD-01.
 */

function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var hoja = e.range.getSheet();
    var nombreHoja = hoja.getName();
    if (hojasProtegiblesMVP_().indexOf(nombreHoja) === -1) return;
    if (e.range.getRow() === 1) return;

    var entidad = Object.keys(ENTIDADES_MVP).filter(function (clave) {
      return ENTIDADES_MVP[clave].hoja === nombreHoja;
    })[0] || null;

    var idCelda = hoja.getRange(e.range.getRow(), 1).getValue();
    var registroId = idCelda ? String(idCelda) : ('FILA_' + e.range.getRow());

    registrarHistorial(entidad || nombreHoja, registroId, 'EDICION_DIRECTA_DETECTADA', [{
      campo: 'CELDA_' + e.range.getA1Notation(),
      anterior: (e.oldValue !== undefined) ? e.oldValue : null,
      nuevo: (e.value !== undefined) ? e.value : null
    }], { origen: 'SCRIPT', resultado: 'ADVERTENCIA' });

    SpreadsheetApp.getActive().toast(
      'Edicion directa detectada en ' + nombreHoja + '. Use los formularios del menu para mantener la trazabilidad.',
      'Aviso', 6
    );
  } catch (err) {
    console.error('onEdit: ' + err.message);
  }
}