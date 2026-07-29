const ENTIDADES_MVP = Object.freeze({
  CAMPANA: Object.freeze({
    hoja: '01_CAMPANAS',
    prefijo: 'CAM'
  }),
  PROYECTO: Object.freeze({
    hoja: '02_PROYECTOS',
    prefijo: 'PRO'
  }),
  PRODUCTO: Object.freeze({
    hoja: '03_PRODUCTOS',
    prefijo: 'PRD'
  }),
  PROYECTO_PRODUCTO: Object.freeze({
    hoja: '04_PROYECTO_PRODUCTO',
    prefijo: 'PPR'
  }),
  PROCESO: Object.freeze({
    hoja: '05_PROCESOS',
    prefijo: 'PCS'
  }),
  TAREA: Object.freeze({
    hoja: '06_TAREAS',
    prefijo: 'TAR'
  }),
  TAREA_RESPONSABLE: Object.freeze({
    hoja: '07_TAREA_RESPONSABLE',
    prefijo: 'TRE'
  }),
  MATERIAL: Object.freeze({
    hoja: '08_MATERIALES',
    prefijo: 'MAT'
  }),
  PRODUCTO_MATERIAL: Object.freeze({
    hoja: '09_PRODUCTO_MATERIAL',
    prefijo: 'PMA'
  }),
  TAREA_MATERIAL: Object.freeze({
    hoja: '10_TAREA_MATERIAL',
    prefijo: 'TMA'
  }),
  PERSONA_EQUIPO: Object.freeze({
    hoja: '11_PERSONAS_EQUIPOS',
    prefijo: 'PER'
  }),
  DECISION: Object.freeze({
    hoja: '12_DECISIONES',
    prefijo: 'DEC'
  }),
  INCIDENCIA: Object.freeze({
    hoja: '13_INCIDENCIAS',
    prefijo: 'INC'
  }),
  DOCUMENTO: Object.freeze({
    hoja: '14_DOCUMENTOS',
    prefijo: 'DOC'
  }),
  PROVEEDOR: Object.freeze({
    hoja: '15_PROVEEDORES',
    prefijo: 'PRV'
  })
});

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
 * Devuelve el siguiente identificador disponible de una entidad.
 *
 * No escribe datos en la hoja.
 *
 * @param {string} nombreHoja
 * @param {string} prefijo
 * @return {string}
 */
function obtenerSiguienteId(nombreHoja, prefijo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName(nombreHoja);

  if (!hoja) {
    throw new Error('No existe la hoja: ' + nombreHoja);
  }

  if (!/^[A-Z]{3}$/.test(prefijo)) {
    throw new Error(
      'Prefijo no válido: ' + prefijo +
      '. Debe contener exactamente tres letras mayúsculas'
    );
  }

  const ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    return prefijo + '-0001';
  }

  const ids = hoja
    .getRange(2, 1, ultimaFila - 1, 1)
    .getDisplayValues()
    .flat()
    .map(valor => String(valor).trim())
    .filter(valor => valor !== '');

  const expresion = new RegExp(
    '^' + prefijo + '-(\\d{4})$'
  );

  let numeroMaximo = 0;

  ids.forEach(id => {
    const coincidencia = id.match(expresion);

    if (coincidencia) {
      const numero = Number(coincidencia[1]);

      if (numero > numeroMaximo) {
        numeroMaximo = numero;
      }
    }
  });

  const siguienteNumero = numeroMaximo + 1;

  if (siguienteNumero > 9999) {
    throw new Error(
      'Se ha alcanzado el límite de IDs para el prefijo ' + prefijo
    );
  }

  return prefijo + '-' + String(siguienteNumero).padStart(4, '0');
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
 * Devuelve el siguiente ID usando la clave central de la entidad.
 *
 * @param {string} claveEntidad
 * @return {string}
 */
function obtenerSiguienteIdEntidad(claveEntidad) {
  const clave = String(claveEntidad || '')
    .trim()
    .toUpperCase();

  const entidad = ENTIDADES_MVP[clave];

  if (!entidad) {
    throw new Error(
      'Entidad no configurada: ' + claveEntidad
    );
  }

  return obtenerSiguienteId(
    entidad.hoja,
    entidad.prefijo
  );
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
 * Obtiene el siguiente ID de una entidad dentro de un bloqueo de script.
 *
 * Evita que dos ejecuciones simultáneas calculen el mismo ID.
 *
 * @param {string} claveEntidad
 * @return {string}
 */
/**
 * No debe utilizarse para generar un ID antes de escribir posteriormente.
 *
 * La generación y la escritura deben realizarse dentro de una única
 * operación bloqueada para evitar IDs duplicados.
 */
function obtenerSiguienteIdEntidadSeguro() {
  throw new Error(
    'OPERACION_NO_PERMITIDA: el ID debe generarse dentro de la operación de escritura bloqueada'
  );
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