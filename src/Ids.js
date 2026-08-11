/**
 * Módulo dueño de cada entidad MVP -- usado por EstructuraInicialService.js
 * (Fase de optimización de hojas hijo, ver conversación "repensar lo mismo
 * con las hojas que se importan a los sheets hijo") para instalar solo las
 * hojas de los módulos realmente instalados en cada cliente. Las entidades
 * sin entrada aquí se consideran CORE (base, siempre instalada).
 */
const MODULO_POR_ENTIDAD_MVP = Object.freeze({
  MATERIAL: 'COMPRAS',
  PRODUCTO_MATERIAL: 'COMPRAS',
  TAREA_MATERIAL: 'COMPRAS',
  PROVEEDOR: 'COMPRAS',
  MOVIMIENTO_MATERIAL: 'COMPRAS',
  PROVEEDOR_MATERIAL: 'COMPRAS',
  PEDIDO_PROVEEDOR: 'COMPRAS',
  PEDIDO_PROVEEDOR_LINEA: 'COMPRAS',
  RECEPCION: 'COMPRAS',
  RECEPCION_LINEA: 'COMPRAS',
  PRESUPUESTO: 'ECONOMICO',
  FUENTE_FINANCIACION: 'ECONOMICO',
  COSTE: 'ECONOMICO',
  CONVOCATORIA: 'CONVOCATORIAS',
  ETIQUETA_IMPACTO: 'IMPACTO',
  CLIENTE: 'CLIENTE',
  PEDIDO_CLIENTE: 'VENTAS',
  PEDIDO_CLIENTE_LINEA: 'VENTAS',
  ENTREGA: 'VENTAS',
  ENTREGA_LINEA: 'VENTAS',
  CONTRATO_SERVICIO: 'VENTAS',
  OPORTUNIDAD: 'OPORTUNIDAD'
});

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
  }),
  ASIGNACION: Object.freeze({
    hoja: '16_ASIGNACION',
    prefijo: 'ASG'
  }),
  RELACION: Object.freeze({
    hoja: '17_RELACION',
    prefijo: 'REL'
  }),
  VINCULO: Object.freeze({
    hoja: '18_VINCULO',
    prefijo: 'VIN'
  }),
  MOVIMIENTO_MATERIAL: Object.freeze({
    hoja: '19_MOVIMIENTO_MATERIAL',
    prefijo: 'MOV'
  }),
  EJECUCION_TAREA: Object.freeze({
    hoja: '20_EJECUCION_TAREA',
    prefijo: 'EJT'
  }),
  PROVEEDOR_MATERIAL: Object.freeze({
    hoja: '21_PROVEEDOR_MATERIAL',
    prefijo: 'PRM'
  }),
  EQUIPO_MIEMBRO: Object.freeze({
    hoja: '22_EQUIPO_MIEMBRO',
    prefijo: 'EQM'
  }),
  RECURSO: Object.freeze({
    hoja: '23_RECURSO',
    prefijo: 'REC'
  }),
  TAREA_RECURSO: Object.freeze({
    hoja: '24_TAREA_RECURSO',
    prefijo: 'TRC'
  }),
  PEDIDO_PROVEEDOR: Object.freeze({
    hoja: '25_PEDIDO_PROVEEDOR',
    prefijo: 'PED'
  }),
  PEDIDO_PROVEEDOR_LINEA: Object.freeze({
    hoja: '26_PEDIDO_PROVEEDOR_LINEA',
    prefijo: 'PPL'
  }),
  RECEPCION: Object.freeze({
    hoja: '27_RECEPCION',
    prefijo: 'RCP'
  }),
  RECEPCION_LINEA: Object.freeze({
    hoja: '28_RECEPCION_LINEA',
    prefijo: 'RCL'
  }),
  HORARIO: Object.freeze({
    hoja: '29_HORARIO',
    prefijo: 'HOR'
  }),
  PRESUPUESTO: Object.freeze({
    hoja: '30_PRESUPUESTO',
    prefijo: 'PRE'
  }),
  FUENTE_FINANCIACION: Object.freeze({
    hoja: '31_FUENTE_FINANCIACION',
    prefijo: 'FIN'
  }),
  COSTE: Object.freeze({
    hoja: '32_COSTE',
    prefijo: 'COS'
  }),
  COMPETENCIA: Object.freeze({
    hoja: '33_COMPETENCIA',
    prefijo: 'CMP'
  }),
  PERSONA_COMPETENCIA: Object.freeze({
    hoja: '34_PERSONA_COMPETENCIA',
    prefijo: 'PCO'
  }),
  RECURSO_COMPETENCIA: Object.freeze({
    hoja: '35_RECURSO_COMPETENCIA',
    prefijo: 'RCO'
  }),
  CONVOCATORIA: Object.freeze({
    hoja: '36_CONVOCATORIA',
    prefijo: 'CNV'
  }),
  ETIQUETA_IMPACTO: Object.freeze({
    hoja: '37_ETIQUETA_IMPACTO',
    prefijo: 'IMP'
  }),
  CLIENTE: Object.freeze({
    hoja: '38_CLIENTE',
    prefijo: 'CLI'
  }),
  PEDIDO_CLIENTE: Object.freeze({
    hoja: '39_PEDIDO_CLIENTE',
    prefijo: 'PDC'
  }),
  PEDIDO_CLIENTE_LINEA: Object.freeze({
    hoja: '40_PEDIDO_CLIENTE_LINEA',
    prefijo: 'PDL'
  }),
  ENTREGA: Object.freeze({
    hoja: '41_ENTREGA',
    prefijo: 'ENT'
  }),
  ENTREGA_LINEA: Object.freeze({
    hoja: '42_ENTREGA_LINEA',
    prefijo: 'ENL'
  }),
  CONTRATO_SERVICIO: Object.freeze({
    hoja: '43_CONTRATO_SERVICIO',
    prefijo: 'CTS'
  }),
  OPORTUNIDAD: Object.freeze({
    hoja: '44_OPORTUNIDAD',
    prefijo: 'OPO'
  }),
  /*
   * Track A -- encaje de competencias (ver conversación -- "que la
   * relación entre tarea y competencia forme parte del éxito de la
   * campaña"): declara qué competencia (y nivel mínimo) exige una tarea,
   * simétrico a RECURSO_COMPETENCIA (que declara qué exige un recurso).
   * Nada la exigía hasta ahora -- una tarea con requisitos de habilidad
   * podía asignarse a cualquiera sin ningún aviso.
   */
  TAREA_COMPETENCIA: Object.freeze({
    hoja: '45_TAREA_COMPETENCIA',
    prefijo: 'TCO'
  }),
  /*
   * Track B -- encaje de capacidad material (ver conversación -- "quiero
   * diferenciar entre los desequilibrios de recursos humanos y los
   * desequilibrios materiales"): declara qué clase/categoría de recurso
   * exige una tarea y cuántos hacen falta como mínimo, simétrica a
   * TAREA_COMPETENCIA pero sobre encaje de tipo/cantidad de recurso en
   * vez de habilidad de persona -- comparado contra los TAREA_RECURSO
   * realmente asignados a esa tarea.
   */
  TAREA_RECURSO_NECESIDAD: Object.freeze({
    hoja: '46_TAREA_RECURSO_NECESIDAD',
    prefijo: 'TRN'
  }),
  /*
   * Motor de escenarios (ver conversación -- "esta parte dará la base
   * para personalizar las experiencias del cliente y previo paso a la
   * gamificación y análisis de escenarios posibles"): un escenario
   * describe una historia narrativa (GUION) más la intensidad de
   * fricción esperada por eje (competencia/recurso/ausencia) -- se
   * inyecta en PROMPT_IA.txt de Importación masiva para que la IA deje
   * de generar datos siempre ideales y simule complicaciones reales de
   * forma coherente entre grupos. Numerada 92 (después de 90_CONFIGURACION/
   * 91_HISTORIAL) porque es infraestructura de simulación, no una
   * entidad de negocio más en la cadena Campaña->Tarea.
   */
  ESCENARIO: Object.freeze({
    hoja: '92_ESCENARIOS',
    prefijo: 'ESC'
  })
});

/**
 * Precalculado a partir de ENTIDADES_MVP + MODULO_POR_ENTIDAD_MVP: nombre
 * de hoja -> módulo dueño. Las hojas de entidades sin entrada explícita en
 * MODULO_POR_ENTIDAD_MVP son CORE. Usado por EstructuraInicialService.js
 * para instalar solo las hojas de los módulos realmente instalados.
 */
const MODULO_POR_HOJA_MVP = Object.freeze(
  Object.keys(ENTIDADES_MVP).reduce(function (acumulado, claveEntidad) {
    acumulado[ENTIDADES_MVP[claveEntidad].hoja] = MODULO_POR_ENTIDAD_MVP[claveEntidad] || 'CORE';
    return acumulado;
  }, {})
);

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


