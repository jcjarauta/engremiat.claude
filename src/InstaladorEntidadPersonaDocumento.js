/**
 * Cierra el hueco detectado al diseñar la ficha de registro de
 * Persona/Equipo (ver conversacion): DOCUMENTO/RELACION/VINCULO usan
 * el catalogo compartido CFG_ENTIDAD_DOCUMENTO, que hasta ahora no
 * incluia "Persona/Equipo" -- así que no se podia adjuntar un
 * documento o un vinculo generico directamente a una persona o equipo.
 * Mismo patron que instalarEntidadVinculo() uso para añadir "Documento".
 * Idempotente. Debe ejecutarse una unica vez, manualmente.
 */
function instalarEntidadPersonaEquipoEnCatalogoDocumento() {
  var packageName = 'INSTALAR_ENTIDAD_PERSONA_EQUIPO_EN_CATALOGO_DOCUMENTO';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error('INSTALAR_ENTIDAD_PERSONA_EQUIPO_EN_CATALOGO_DOCUMENTO_ERROR: no existe 90_CONFIGURACION');
    }

    ampliarCatalogoL2_(ss, hojaConfig, 'ENTIDAD_DOCUMENTO', null, [
      ['PERSONA_EQUIPO', 'Persona/Equipo']
    ]);
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}
