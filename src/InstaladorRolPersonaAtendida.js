/**
 * Amplia CFG_ROL_PERSONA con "Persona atendida" (ver conversacion:
 * arbol de personas, jerarquia humana). Categoria ya existente (igual
 * que TIPO_PROYECTO en su momento) -- usa ampliarCatalogoL2_, nunca
 * crearCatalogoNuevoL3_ (ese bug real ya lo sufrimos una vez con
 * TIPO_PROYECTO, ver CorregirCatalogoTipoProyecto.js). Se inserta antes
 * de "OTRA" para mantenerlo al final, como el resto de catalogos.
 */
function instalarRolPersonaAtendida() {
  var packageName = 'INSTALAR_ROL_PERSONA_ATENDIDA';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActive();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error('INSTALAR_ROL_PERSONA_ATENDIDA_ERROR: no existe 90_CONFIGURACION');
    }

    ampliarCatalogoL2_(ss, hojaConfig, 'ROL_PERSONA', 'OTRA', [
      ['PERSONA_ATENDIDA', 'Persona atendida']
    ]);

    console.log('OK rol_anadido=Persona atendida');
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/**
 * Ejemplo minimo del arbol de personas con el rol "Persona atendida",
 * confirmado explicitamente: SOLO estructura/rol, sin nombres reales
 * -- etiquetas pseudonimas (rol + numero), nunca un nombre real de
 * participante. Ejecutar despues de instalarRolPersonaAtendida().
 */
function instalarEjemploPersonaAtendida() {
  var packageName = 'INSTALAR_EJEMPLO_PERSONA_ATENDIDA';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  var idCoordinadora = 'PER-0006';

  var resultado = guardarFormulario('PERSONA_EQUIPO', null, {
    TIPO: 'Persona', NOMBRE: 'Participante Manipulados 1', ROL: 'Persona atendida',
    COORDINADOR_ID: idCoordinadora, CAPACIDAD_SEMANAL_DIAS: 3, DISPONIBILIDAD: 'Parcial', ESTADO: 'Disponible'
  }, correlationId);
  console.log('OK creado entidad=PERSONA_EQUIPO id=' + resultado.id);

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}
