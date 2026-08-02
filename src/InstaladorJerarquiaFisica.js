/**
 * Jerarquia fisica real de La Troballa (ver conversacion): La Troballa
 * como espacio raiz -- este sistema gestiona este taller, no el resto
 * de programas de Arrels Fundacio (Centre Obert/La Llar/Pis Zero), asi
 * que esos NO se modelan como nodos padre reales, solo se deja
 * constancia en la descripcion. Los espacios ya sembrados (ESP-01/02/
 * 03) se re-parentan bajo la nueva raiz -- via actualizarRegistroTransaccional
 * (actualizacion parcial), NO guardarFormulario, que reconstruye todos
 * los campos del esquema y vaciaria el resto si solo se pasa
 * UBICACION_ID.
 */
function instalarJerarquiaFisicaLaTroballa() {
  var packageName = 'INSTALAR_JERARQUIA_FISICA_LA_TROBALLA';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();

  var idRaiz = guardarFormulario('RECURSO', null, {
    CODIGO: 'ESP-RAIZ', NOMBRE: 'La Troballa',
    DESCRIPCION: 'Taller ocupacional de Arrels Fundació.',
    CLASE_RECURSO: 'Espacio', CATEGORIA_RECURSO: 'Espacio polivalente', ESTADO: 'Disponible'
  }, correlationId).id;
  console.log('OK creado entidad=RECURSO id=' + idRaiz + ' nombre=La Troballa');

  sembrarRestoJerarquiaFisicaLaTroballa_(idRaiz, correlationId);

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

/**
 * Continuacion para cuando instalarJerarquiaFisicaLaTroballa() fallo a
 * mitad (p.ej. el bug real de CODIGO-vs-ID en reparentar_, ya corregido):
 * "La Troballa" ya existe como REC-0008, asi que NO se vuelve a crear,
 * solo se completa el resto de pasos.
 */
function continuarJerarquiaFisicaLaTroballa() {
  var packageName = 'CONTINUAR_JERARQUIA_FISICA_LA_TROBALLA';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  var idRaiz = 'REC-0008'; // La Troballa, ya creado en el intento anterior.

  sembrarRestoJerarquiaFisicaLaTroballa_(idRaiz, correlationId);

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}

function sembrarRestoJerarquiaFisicaLaTroballa_(idRaiz, correlationId) {
  function crear_(entidad, datos) {
    var resultado = guardarFormulario(entidad, null, datos, correlationId);
    console.log('OK creado entidad=' + entidad + ' id=' + resultado.id + ' nombre=' + datos.NOMBRE);
    return resultado.id;
  }

  function reparentar_(recursoId, ubicacionId) {
    actualizarRegistroTransaccional('RECURSO', recursoId, { UBICACION_ID: ubicacionId }, { origen: 'UI', correlationId: correlationId });
    console.log('OK reparentado id=' + recursoId + ' ubicacion=' + ubicacionId);
  }

  // Re-parentar los espacios ya existentes bajo la nueva raiz.
  // OJO: UBICACION_ID/RECURSO usa el ID real (REC-000x), no el CODIGO (ESP-0x).
  reparentar_('REC-0004', idRaiz); // Taller de Manipulados (CODIGO ESP-01)
  reparentar_('REC-0005', idRaiz); // Taller de Carpintería (CODIGO ESP-02)
  reparentar_('REC-0006', idRaiz); // Almacén de Materiales (CODIGO ESP-03)

  // Espacios nuevos.
  crear_('RECURSO', {
    CODIGO: 'ESP-04', NOMBRE: 'Taller de Cerámica', CLASE_RECURSO: 'Espacio',
    CATEGORIA_RECURSO: 'Espacio productivo', UBICACION_ID: idRaiz, ESTADO: 'Disponible'
  });
  crear_('RECURSO', {
    CODIGO: 'ESP-05', NOMBRE: 'Cocina', CLASE_RECURSO: 'Espacio',
    CATEGORIA_RECURSO: 'Espacio polivalente', UBICACION_ID: idRaiz, ESTADO: 'Disponible'
  });
  crear_('RECURSO', {
    CODIGO: 'ESP-06', NOMBRE: 'Tienda', CLASE_RECURSO: 'Espacio',
    CATEGORIA_RECURSO: 'Espacio polivalente', UBICACION_ID: idRaiz, ESTADO: 'Disponible'
  });
  var idOficina = crear_('RECURSO', {
    CODIGO: 'ESP-07', NOMBRE: 'Oficina', CLASE_RECURSO: 'Espacio',
    CATEGORIA_RECURSO: 'Espacio polivalente', UBICACION_ID: idRaiz, ESTADO: 'Disponible'
  });

  // Nivel atomico: un par de ejemplos, no exhaustivo en todas las ramas.
  crear_('RECURSO', {
    CODIGO: 'ALM-EST-CARP-01', NOMBRE: 'Estantería de herramientas', CLASE_RECURSO: 'Espacio',
    CATEGORIA_RECURSO: 'Espacio de almacenamiento', UBICACION_ID: 'REC-0005', ESTADO: 'Disponible'
  });
  crear_('RECURSO', {
    CODIGO: 'ALM-CAJ-MAN-01', NOMBRE: 'Cajón de consumibles', CLASE_RECURSO: 'Espacio',
    CATEGORIA_RECURSO: 'Espacio de almacenamiento', UBICACION_ID: 'REC-0004', ESTADO: 'Disponible'
  });
  crear_('RECURSO', {
    CODIGO: 'ALM-ARCH-OFI-01', NOMBRE: 'Archivador de documentación', CLASE_RECURSO: 'Espacio',
    CATEGORIA_RECURSO: 'Espacio de almacenamiento', UBICACION_ID: idOficina, ESTADO: 'Disponible'
  });
}
