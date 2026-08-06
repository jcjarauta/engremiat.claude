/**
 * Pruebas manuales de Ids.js, extraídas del propio archivo de producción
 * para cerrar su deuda de "mixed:true" (ver PROPUESTA_MODULARIZACION_LIBRERIA.md
 * y tools/packager/package-map.json). Movidas verbatim, sin ejecutar ni
 * modificar su lógica -- ninguna estaba referenciada desde otro archivo.
 */

function probarConfiguracionEntidadesIds() {
  const claves = Object.keys(ENTIDADES_MVP);
  const prefijos = new Set();
  const hojas = new Set();
  const errores = [];

  claves.forEach(clave => {
    const entidad = ENTIDADES_MVP[clave];

    if (!entidad.hoja || !entidad.prefijo) {
      errores.push(clave + ': configuración incompleta');
      return;
    }

    if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(entidad.hoja)) {
      errores.push(clave + ': no existe la hoja ' + entidad.hoja);
    }

    if (!/^[A-Z]{3}$/.test(entidad.prefijo)) {
      errores.push(clave + ': prefijo no válido ' + entidad.prefijo);
    }

    if (prefijos.has(entidad.prefijo)) {
      errores.push(clave + ': prefijo duplicado ' + entidad.prefijo);
    }

    if (hojas.has(entidad.hoja)) {
      errores.push(clave + ': hoja duplicada ' + entidad.hoja);
    }

    prefijos.add(entidad.prefijo);
    hojas.add(entidad.hoja);

    const siguienteId = obtenerSiguienteId(
      entidad.hoja,
      entidad.prefijo
    );

    console.log(
      clave + ' → ' + entidad.hoja + ' → ' + siguienteId
    );
  });

  if (errores.length > 0) {
    errores.forEach(error => console.error(error));

    throw new Error(
      'Configuración de entidades no válida. Errores: ' +
      errores.length
    );
  }

  console.log('OK: configuración de entidades e IDs válida');
  console.log('Entidades verificadas: ' + claves.length);
  console.log('Prefijos únicos: ' + prefijos.size);
  console.log('Hojas únicas: ' + hojas.size);

  return true;
}
/**
 * Prueba de solo lectura del generador de identificadores.
 */
function probarGeneradorIds() {
  const pruebas = [
    ['01_CAMPANAS', 'CAM'],
    ['02_PROYECTOS', 'PRO'],
    ['03_PRODUCTOS', 'PRD'],
    ['05_PROCESOS', 'PCS'],
    ['06_TAREAS', 'TAR'],
    ['08_MATERIALES', 'MAT'],
    ['11_PERSONAS_EQUIPOS', 'PER'],
    ['12_DECISIONES', 'DEC'],
    ['13_INCIDENCIAS', 'INC'],
    ['14_DOCUMENTOS', 'DOC']
  ];

  pruebas.forEach(([hoja, prefijo]) => {
    const siguienteId = obtenerSiguienteId(hoja, prefijo);

    console.log(
      hoja + ' → ' + siguienteId
    );
  });

  console.log('OK: generador de IDs verificado');
  console.log('Entidades verificadas: ' + pruebas.length);

  return true;
}
/**
 * Prueba de solo lectura del acceso centralizado.
 */
function probarObtenerSiguienteIdEntidad() {
  const pruebas = [
    ['CAMPANA', 'CAM-0001'],
    ['PROYECTO', 'PRO-0001'],
    ['PRODUCTO', 'PRD-0001'],
    ['PROYECTO_PRODUCTO', 'PPR-0001'],
    ['PROCESO', 'PCS-0001'],
    ['TAREA', 'TAR-0001'],
    ['TAREA_RESPONSABLE', 'TRE-0001'],
    ['MATERIAL', 'MAT-0001'],
    ['PRODUCTO_MATERIAL', 'PMA-0001'],
    ['TAREA_MATERIAL', 'TMA-0001'],
    ['PERSONA_EQUIPO', 'PER-0001'],
    ['DECISION', 'DEC-0001'],
    ['INCIDENCIA', 'INC-0001'],
    ['DOCUMENTO', 'DOC-0001']
  ];

  const errores = [];

  pruebas.forEach(([clave, esperado]) => {
    const resultado = obtenerSiguienteIdEntidad(clave);

    console.log(clave + ' → ' + resultado);

    if (resultado !== esperado) {
      errores.push(
        clave +
        ': esperado ' + esperado +
        ', obtenido ' + resultado
      );
    }
  });

  if (errores.length > 0) {
    errores.forEach(error => console.error(error));

    throw new Error(
      'Prueba de IDs por entidad no válida. Errores: ' +
      errores.length
    );
  }

  console.log('OK: acceso centralizado a IDs verificado');
  console.log('Entidades verificadas: ' + pruebas.length);
  console.log('Errores detectados: 0');

  return true;
}
function probarErroresObtenerSiguienteIdEntidad() {
  const pruebasInvalidas = [
    '',
    'NO_EXISTE',
    'campaña',
    null,
    undefined
  ];

  let erroresControlados = 0;
  const erroresNoControlados = [];

  pruebasInvalidas.forEach(valor => {
    try {
      obtenerSiguienteIdEntidad(valor);

      erroresNoControlados.push(
        'No se produjo error para el valor: ' + String(valor)
      );
    } catch (error) {
      erroresControlados++;

      console.log(
        'Error controlado para [' +
        String(valor) +
        ']: ' +
        error.message
      );
    }
  });

  if (erroresNoControlados.length > 0) {
    erroresNoControlados.forEach(error => console.error(error));

    throw new Error(
      'Pruebas negativas no superadas. Errores: ' +
      erroresNoControlados.length
    );
  }

  console.log('OK: errores de entidad controlados');
  console.log(
    'Entradas inválidas verificadas: ' + pruebasInvalidas.length
  );
  console.log('Errores controlados: ' + erroresControlados);

  return true;
}
/**
 * Prueba de solo lectura del generador seguro.
 */
function probarBloqueoGeneradorIdsAislado() {
  let errorControlado = false;

  try {
    obtenerSiguienteIdEntidadSeguro('CAMPANA');
  } catch (error) {
    console.log('Error controlado: ' + error.message);

    errorControlado = error.message.includes(
      'OPERACION_NO_PERMITIDA'
    );
  }

  if (!errorControlado) {
    throw new Error(
      'El generador aislado de IDs no está correctamente bloqueado'
    );
  }

  console.log('OK: generación aislada de IDs bloqueada');
  console.log('Escritura transaccional requerida: SÍ');

  return true;
}
function pruebaPaso127_EntidadProyectoProducto() {
  const claves = Object.keys(ENTIDADES_MVP);

  console.log(
    'Entidades registradas: ' +
    JSON.stringify(claves)
  );

  const coincidencias = claves.filter(function(clave) {
    const configuracion = ENTIDADES_MVP[clave];

    return configuracion &&
      configuracion.hoja === '04_PROYECTO_PRODUCTO';
  });

  console.log(
    'Coincidencias encontradas: ' +
    coincidencias.length
  );

  if (coincidencias.length !== 1) {
    throw new Error(
      'PASO_127_ERROR: se esperaba una única entidad para 04_PROYECTO_PRODUCTO'
    );
  }

  const claveEntidad = coincidencias[0];
  const configuracion = ENTIDADES_MVP[claveEntidad];

  console.log('Clave de entidad: ' + claveEntidad);
  console.log('Hoja: ' + configuracion.hoja);
  console.log('Prefijo: ' + configuracion.prefijo);

  if (!configuracion.prefijo) {
    throw new Error(
      'PASO_127_ERROR: la entidad no tiene prefijo'
    );
  }

  console.log(
    'OK: entidad PROYECTO_PRODUCTO localizada'
  );
}
