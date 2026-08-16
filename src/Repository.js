const CAMPOS_OBLIGATORIOS_MVP = Object.freeze({
  CAMPANA: Object.freeze([
    'NOMBRE',
    'FECHA_INICIO_PLAN',
    'FECHA_FIN_PLAN',
    'ESTADO'
  ]),

  PROYECTO: Object.freeze([
    'CAMPANA_ID',
    'NOMBRE',
    'TIPO_PROYECTO',
    'PRIORIDAD',
    'ESTADO'
  ]),

  PRODUCTO: Object.freeze([
    'CODIGO',
    'NOMBRE',
    'ORIGEN',
    'UNIDAD',
    'ESTADO'
  ]),

  PROYECTO_PRODUCTO: Object.freeze([
    'PROYECTO_ID',
    'PRODUCTO_ID',
    'CANTIDAD_ASIGNADA',
    'PRIORIDAD',
    'ESTADO'
  ]),

  PROCESO: Object.freeze([
    'PRODUCTO_ID',
    'NOMBRE',
    'ORDEN_SECUENCIA',
    'DURACION_PREVISTA_DIAS',
    'ESTADO',
    'PORCENTAJE_AVANCE'
  ]),

  TAREA: Object.freeze([
    'PROCESO_ID',
    'NOMBRE',
    'ORDEN_SECUENCIA',
    'DURACION_PREVISTA_DIAS',
    'ESTADO',
    'PORCENTAJE_AVANCE'
  ]),

  TAREA_RESPONSABLE: Object.freeze([
    'TAREA_ID',
    'PERSONA_EQUIPO_ID',
    'ROL_ASIGNADO',
    'PORCENTAJE_DEDICACION',
    'ESTADO'
  ]),

  MATERIAL: Object.freeze([
    'CODIGO',
    'NOMBRE',
    'CATEGORIA',
    'UNIDAD',
    'ESTADO'
  ]),

  PRODUCTO_MATERIAL: Object.freeze([
    'PRODUCTO_ID',
    'MATERIAL_ID',
    'CANTIDAD_PREVISTA',
    'UNIDAD',
    'ESTADO'
  ]),

  TAREA_MATERIAL: Object.freeze([
    'TAREA_ID',
    'MATERIAL_ID',
    'CANTIDAD_PREVISTA',
    'UNIDAD',
    'ESTADO'
  ]),

  PERSONA_EQUIPO: Object.freeze([
    'TIPO',
    'NOMBRE',
    'ROL',
    'ESTADO'
  ]),

  DECISION: Object.freeze([
    'PROYECTO_ID',
    'TITULO',
    'TIPO',
    'ESTADO',
    'IMPACTO'
  ]),

  INCIDENCIA: Object.freeze([
    'TITULO',
    'TIPO',
    'PRIORIDAD',
    'ESTADO'
  ]),

  DOCUMENTO: Object.freeze([
    'ENTIDAD_TIPO',
    'ENTIDAD_ID',
    'TIPO_DOCUMENTO',
    'TITULO',
    'ESTADO'
  ]),

  PROVEEDOR: Object.freeze(['CODIGO', 'NOMBRE', 'ESTADO']),

  ASIGNACION: Object.freeze([
    'ENTIDAD_TIPO',
    'ENTIDAD_ID',
    'PERSONA_EQUIPO_ID',
    'ROL_ASIGNADO',
    'PORCENTAJE_DEDICACION',
    'ESTADO'
  ]),

  RELACION: Object.freeze([
    'ENTIDAD_TIPO',
    'ENTIDAD_ORIGEN_ID',
    'ENTIDAD_DESTINO_ID',
    'TIPO_RELACION',
    'ESTADO'
  ]),

  VINCULO: Object.freeze([
    'ENTIDAD_ORIGEN_TIPO',
    'ENTIDAD_ORIGEN_ID',
    'ENTIDAD_DESTINO_TIPO',
    'ENTIDAD_DESTINO_ID',
    'TIPO_VINCULO',
    'ESTADO'
  ]),

  MOVIMIENTO_MATERIAL: Object.freeze([
    'MATERIAL_ID',
    'TIPO_MOVIMIENTO',
    'CANTIDAD',
    'UNIDAD',
    'FECHA_MOVIMIENTO'
  ]),

  EJECUCION_TAREA: Object.freeze([
    'TAREA_ID',
    'ESTADO'
  ]),

  PROVEEDOR_MATERIAL: Object.freeze([
    'PROVEEDOR_ID',
    'MATERIAL_ID',
    'PRECIO_UNITARIO',
    'PLAZO_ENTREGA_DIAS',
    'ES_PREFERENTE',
    'ESTADO'
  ]),

  EQUIPO_MIEMBRO: Object.freeze([
    'EQUIPO_ID',
    'MIEMBRO_ID',
    'ESTADO'
  ]),

  RECURSO: Object.freeze([
    'CODIGO',
    'NOMBRE',
    'CLASE_RECURSO',
    'ESTADO'
  ]),

  TAREA_RECURSO: Object.freeze([
    'TAREA_ID',
    'RECURSO_ID',
    'TIPO_USO',
    'ESTADO'
  ]),

  PEDIDO_PROVEEDOR: Object.freeze([
    'PROVEEDOR_ID',
    'FECHA_PEDIDO',
    'ESTADO'
  ]),

  PEDIDO_PROVEEDOR_LINEA: Object.freeze([
    'PEDIDO_PROVEEDOR_ID',
    'MATERIAL_ID',
    'CANTIDAD_PEDIDA',
    'PRECIO_UNITARIO',
    'UNIDAD',
    'ESTADO'
  ]),

  RECEPCION: Object.freeze([
    'PEDIDO_PROVEEDOR_ID',
    'FECHA_RECEPCION',
    'ESTADO'
  ]),

  RECEPCION_LINEA: Object.freeze([
    'RECEPCION_ID',
    'MATERIAL_ID',
    'CANTIDAD_RECIBIDA',
    'UNIDAD',
    'ESTADO'
  ]),

  PRESUPUESTO: Object.freeze([
    'ENTIDAD_TIPO',
    'ENTIDAD_ID',
    'CATEGORIA',
    'IMPORTE_PREVISTO'
  ]),

  FUENTE_FINANCIACION: Object.freeze([
    'ENTIDAD_TIPO',
    'ENTIDAD_ID',
    'NOMBRE',
    'TIPO',
    'IMPORTE',
    'ESTADO'
  ]),

  COSTE: Object.freeze([
    'ENTIDAD_TIPO',
    'ENTIDAD_ID',
    'CATEGORIA',
    'CONCEPTO',
    'IMPORTE',
    'ESTADO'
  ]),

  COMPETENCIA: Object.freeze([
    'NOMBRE',
    'ESTADO'
  ]),

  PERSONA_COMPETENCIA: Object.freeze([
    'PERSONA_EQUIPO_ID',
    'COMPETENCIA_ID',
    'ESTADO'
  ]),

  RECURSO_COMPETENCIA: Object.freeze([
    'RECURSO_ID',
    'COMPETENCIA_ID',
    'ESTADO'
  ]),

  TAREA_COMPETENCIA: Object.freeze([
    'TAREA_ID',
    'COMPETENCIA_ID',
    'ESTADO'
  ]),

  TAREA_RECURSO_NECESIDAD: Object.freeze([
    'TAREA_ID',
    'ESTADO'
  ]),

  ESCENARIO: Object.freeze([
    'NOMBRE',
    'PERFIL',
    'ESTADO'
  ]),

  CONVOCATORIA: Object.freeze([
    'NOMBRE',
    'ENTIDAD_CONVOCANTE',
    'TIPO',
    'FECHA_LIMITE',
    'ESTADO'
  ]),

  ETIQUETA_IMPACTO: Object.freeze([
    'ENTIDAD_TIPO',
    'ENTIDAD_ID',
    'CATEGORIA_IMPACTO',
    'DESCRIPCION'
  ])
});

/**
 * Inserta un registro completo dentro de un bloqueo de script.
 *
 * Genera el ID y escribe la fila en una única operación protegida.
 *
 * @param {string} claveEntidad
 * @param {Object} datos
 * @param {Object} opciones
 * @return {Object}
 */
/**
 * Inserta un registro completo dentro de un bloqueo de script.
 *
 * Genera el ID y escribe la fila en una única operación protegida.
 *
 * @param {string} claveEntidad
 * @param {Object} datos
 * @param {Object} opciones
 * @return {Object}
 */
/**
 * Inserta un registro completo dentro de un bloqueo de script.
 *
 * Genera el ID y escribe la fila en una única operación protegida.
 *
 * @param {string} claveEntidad
 * @param {Object} datos
 * @param {Object} opciones
 * @return {Object}
 */


/**
 * Valida que un valor pertenezca a un rango con nombre.
 *
 * La comparación ignora espacios exteriores y mayúsculas/minúsculas.
 *
 * @param {*} valor Valor recibido.
 * @param {string} nombreRango Nombre exacto del rango configurado.
 * @param {string} nombreCampo Campo que se está validando.
 */
function validarValorCatalogoRepository_(valor, nombreRango, nombreCampo) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const rango = libro.getRangeByName(nombreRango);

  if (!rango) {
    throw new Error(
      'Rango de configuración inexistente: ' + nombreRango
    );
  }

  const valorNormalizado = String(valor == null ? '' : valor)
    .trim()
    .toUpperCase();

  const valoresPermitidos = rango
    .getDisplayValues()
    .flat()
    .map(function(valorCatalogo) {
      return String(valorCatalogo).trim().toUpperCase();
    })
    .filter(function(valorCatalogo) {
      return valorCatalogo !== '';
    });

  if (valoresPermitidos.indexOf(valorNormalizado) === -1) {
    throw new Error(
      nombreCampo +
      ' no pertenece al catálogo ' +
      nombreRango +
      ': ' +
      valor
    );
  }
}


function eliminarRegistroPruebaPorId_(hoja, id) {
  if (!hoja || !id || hoja.getLastRow() < 2) {
    return;
  }

  const cabeceras = hoja
    .getRange(
      1,
      1,
      1,
      hoja.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceId = cabeceras.indexOf('ID');

  if (indiceId === -1) {
    return;
  }

  const ids = hoja
    .getRange(
      2,
      indiceId + 1,
      hoja.getLastRow() - 1,
      1
    )
    .getDisplayValues()
    .flat();

  for (
    let indice = ids.length - 1;
    indice >= 0;
    indice--
  ) {
    if (
      String(ids[indice]).trim() === id
    ) {
      hoja.deleteRow(indice + 2);
      return;
    }
  }
}


/*
 * ============================================================
 * REPOSITORY_CONSULTAR (FASE 2, anadido de forma autonoma)
 * Funciones de lectura del repositorio. No realizan ninguna
 * escritura sobre las hojas. Se apoyan en ENTIDADES_MVP (Ids.gs)
 * para resolver la hoja de cada entidad de forma generica.
 * Nota: se ubican en Repository.gs en lugar de un archivo propio
 * Repository_Consultar.gs por inestabilidad del dialogo de
 * creacion de archivos en el editor durante esta sesion.
 * ============================================================
 */

function obtenerHojaEntidad_(entidad) {
  var config = ENTIDADES_MVP[entidad];
  if (!config) {
    throw new Error('ERROR_CONSULTA: entidad no reconocida: ' + entidad);
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(config.hoja);
  if (!hoja) {
    throw new Error('ERROR_CONSULTA: hoja no encontrada para la entidad ' + entidad + ': ' + config.hoja);
  }
  return hoja;
}

function leerFilasEntidadComoObjetos_(entidad) {
  return cacheLecturaFilasObjetos_(entidad, function () {
    instrumentacionRegistrarLecturaHoja_();
    var hoja = obtenerHojaEntidad_(entidad);
    var lastRow = hoja.getLastRow();
    var lastCol = hoja.getLastColumn();
    if (lastRow < 2) {
      return [];
    }
    var valores = hoja.getRange(1, 1, lastRow, lastCol).getValues();
    var cabeceras = valores[0];
    var filas = [];
    for (var i = 1; i < valores.length; i++) {
      var fila = valores[i];
      var objeto = {};
      for (var c = 0; c < cabeceras.length; c++) {
        objeto[cabeceras[c]] = fila[c];
      }
      filas.push(objeto);
    }
    return filas;
  });
}

/**
 * Devuelve el registro cuya columna ID coincide con el id dado,
 * o null si no existe. Lanza error si la entidad no es reconocida.
 */
function obtenerRegistroPorId(entidad, id) {
  if (!id) {
    throw new Error('ERROR_CONSULTA: se requiere un id para obtenerRegistroPorId.');
  }
  var filas = leerFilasEntidadComoObjetos_(entidad);
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i].ID).trim() === String(id).trim()) {
      return filas[i];
    }
  }
  return null;
}

/**
 * Devuelve todos los registros de una entidad, opcionalmente
 * filtrados por igualdad exacta en uno o varios campos.
 * filtros: objeto {CAMPO: valor, ...} o null/undefined para listar todo.
 */
function listarRegistros(entidad, filtros) {
  var filas = leerFilasEntidadComoObjetos_(entidad);
  if (!filtros) {
    return filas;
  }
  var claves = Object.keys(filtros);
  return filas.filter(function (fila) {
    return claves.every(function (clave) {
      return String(fila[clave]) === String(filtros[clave]);
    });
  });
}

/*
 * listarRegistrosSeguro_ (ver conversación -- "revisa las hojas que se
 * siembran... simplifica" / módulos OPERATIVA/SEGUIMIENTO/EJECUCION,
 * v78): mismo criterio ya usado en obtenerAlertasMaterialesSeguro_
 * (DashboardService.js, COMPRAS) e IntegrityService.js -- una llamada
 * de solo lectura a una entidad de un módulo opcional no debe reventar
 * toda una Ficha/Panel/Informe si ese módulo no está instalado (hoja
 * inexistente = ERROR_CONSULTA de obtenerHojaEntidad_). Generalizado
 * aquí en vez de repetir try/catch en cada llamador porque, tras
 * separar OPERATIVA/SEGUIMIENTO/EJECUCION del CORE, la superficie de
 * llamadas a entidades opcionales pasó a ser mucho mayor que solo
 * COMPRAS (Fichas, Panel de campaña, Informes, Desviación/Gantt).
 */
function listarRegistrosSeguro_(entidad, filtros) {
  try {
    return listarRegistros(entidad, filtros);
  } catch (e) {
    console.warn('LECTURA_OMITIDA ' + entidad + ': ' + e.message);
    return [];
  }
}

/**
 * Busqueda de texto libre (subcadena, sin distinguir mayusculas)
 * dentro de un unico campo. criterio: {campo: 'NOMBRE', texto: 'foo'}.
 */
function buscarRegistros(entidad, criterio) {
  if (!criterio || !criterio.campo || criterio.texto === undefined || criterio.texto === null) {
    throw new Error('ERROR_CONSULTA: buscarRegistros requiere criterio = {campo, texto}.');
  }
  var filas = leerFilasEntidadComoObjetos_(entidad);
  var textoBuscado = String(criterio.texto).toLowerCase();
  return filas.filter(function (fila) {
    var valorCampo = fila[criterio.campo];
    if (valorCampo === undefined || valorCampo === null) {
      return false;
    }
    return String(valorCampo).toLowerCase().indexOf(textoBuscado) !== -1;
  });
}

/**
 * Atajo sobre listarRegistros para consultas por relacion (FK):
 * listarPorRelacion('TAREA', 'PROCESO_ID', procesoId).
 */
function listarPorRelacion(entidad, campoRelacion, idRelacion) {
  if (!campoRelacion || !idRelacion) {
    throw new Error('ERROR_CONSULTA: listarPorRelacion requiere campoRelacion e idRelacion.');
  }
  var filtros = {};
  filtros[campoRelacion] = idRelacion;
  return listarRegistros(entidad, filtros);
}

/*
 * Consultas jerarquicas de conveniencia para el MVP, construidas
 * sobre las funciones genericas anteriores.
 */

function listarCampanasActivas() {
  return listarRegistros('CAMPANA', {ESTADO: 'Activa'});
}

function listarProyectosDeCampana(campanaId) {
  return listarPorRelacion('PROYECTO', 'CAMPANA_ID', campanaId);
}

function listarProductosDeProyecto(proyectoId) {
  var relaciones = listarPorRelacion('PROYECTO_PRODUCTO', 'PROYECTO_ID', proyectoId);
  var productos = [];
  for (var i = 0; i < relaciones.length; i++) {
    var producto = obtenerRegistroPorId('PRODUCTO', relaciones[i].PRODUCTO_ID);
    if (producto) {
      productos.push(producto);
    }
  }
  return productos;
}

function listarProcesosDeProducto(productoId) {
  return listarPorRelacion('PROCESO', 'PRODUCTO_ID', productoId);
}

function listarTareasDeProceso(procesoId) {
  return listarPorRelacion('TAREA', 'PROCESO_ID', procesoId);
}

function listarTareasPorEstado(estado) {
  return listarRegistros('TAREA', {ESTADO: estado});
}


/*
 * ============================================================
 * REPOSITORY_ACTUALIZAR (FASE 3, anadido de forma autonoma)
 * actualizarRegistroTransaccional revalida los cambios llamando
 * a insertarRegistroTransaccional en modo dryRun sobre el
 * registro fusionado (actual + cambios), reutilizando integramente
 * los bloques de validacion if (clave === 'X') { ... } ya existentes
 * sin duplicar logica. Ubicada en Repository.gs por la misma razon
 * que REPOSITORY_CONSULTAR (ver nota en ese bloque).
 *
 * Nota: el modelo de datos actual no tiene columnas FECHA_MODIFICACION
 * ni MODIFICADO_POR en las hojas de entidad; la trazabilidad de
 * cambios se delega a la hoja 91_HISTORIAL prevista para la Fase 10
 * (Auditoria), todavia no implementada.
 * ============================================================
 */

function sonValoresEquivalentesActualizacion_(anterior, nuevo, zonaHoraria) {
  var anteriorEsFecha =
    Object.prototype.toString.call(anterior) === '[object Date]' &&
    !isNaN(anterior.getTime());

  var nuevoEsFecha =
    Object.prototype.toString.call(nuevo) === '[object Date]' &&
    !isNaN(nuevo.getTime());

  if (anteriorEsFecha && nuevoEsFecha) {
    return Utilities.formatDate(anterior, zonaHoraria, 'yyyy-MM-dd') ===
      Utilities.formatDate(nuevo, zonaHoraria, 'yyyy-MM-dd');
  }

  var anteriorVacio =
    anterior === null ||
    anterior === undefined ||
    anterior === '';

  var nuevoVacio =
    nuevo === null ||
    nuevo === undefined ||
    nuevo === '';

  if (anteriorVacio && nuevoVacio) {
    return true;
  }

  return String(anterior) === String(nuevo);
}

function actualizarRegistroTransaccional(entidad, id, cambios, opciones) {
  opciones = opciones || {};

  var dryRun = !!opciones.dryRun;
  var origen = opciones.origen || 'SCRIPT';
  var correlationId =
    opciones.correlationId || generarCorrelationId_();
  var esPrueba = !!opciones.esPrueba;
  var pruebaId = opciones.pruebaId || '';

  if (!id) {
    throw new Error(
      'ERROR_ACTUALIZACION: se requiere un id.'
    );
  }

  if (
    !cambios ||
    typeof cambios !== 'object' ||
    Array.isArray(cambios) ||
    Object.keys(cambios).length === 0
  ) {
    throw new Error(
      'ERROR_ACTUALIZACION: se requiere al menos un cambio en el objeto cambios.'
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      cambios,
      'ID'
    )
  ) {
    throw new Error(
      'ERROR_ACTUALIZACION: no esta permitido modificar el campo ID.'
    );
  }

  /*
   * Normalización de textos de DECISION.
   * Se aplica antes de validar, fusionar, comparar,
   * ejecutar dryRun y escribir en hoja.
   */
  if (
    String(entidad || '')
      .trim()
      .toUpperCase() === 'DECISION'
  ) {
    cambios = Object.assign({}, cambios);

    [
      'TITULO',
      'CONTEXTO',
      'RESOLUCION',
      'OBSERVACIONES'
    ].forEach(function (campo) {
      if (
        Object.prototype.hasOwnProperty.call(
          cambios,
          campo
        ) &&
        typeof cambios[campo] === 'string'
      ) {
        cambios[campo] =
          cambios[campo].trim();
      }
    });
  }

  var registroActual =
    obtenerRegistroPorId(entidad, id);

  if (!registroActual) {
    throw new Error(
      'ERROR_ACTUALIZACION: no existe un registro de ' +
      entidad +
      ' con id ' +
      id +
      '.'
    );
  }

  var hoja = obtenerHojaEntidad_(entidad);
  var ultimaColumna = hoja.getLastColumn();

  var cabeceras = hoja
    .getRange(
      1,
      1,
      1,
      ultimaColumna
    )
    .getValues()[0]
    .map(function (valor) {
      return String(valor).trim();
    });

  /*
   * Se obtienen después de normalizar cambios,
   * para que todas las operaciones posteriores
   * usen los valores ya recortados.
   */
  var clavesCambio = Object.keys(cambios);

  clavesCambio.forEach(function (campo) {
    if (cabeceras.indexOf(campo) === -1) {
      throw new Error(
        'ERROR_ACTUALIZACION: campo no reconocido para ' +
        entidad +
        ': ' +
        campo
      );
    }
  });

  var camposSistemaActualizar = [
    'ID',
    'FECHA_CREACION',
    'CREADO_POR',
    'FECHA_MODIFICACION',
    'MODIFICADO_POR'
  ];

  var camposSistemaRecibidos =
    clavesCambio.filter(function (campo) {
      return (
        camposSistemaActualizar.indexOf(
          campo
        ) !== -1
      );
    });

  if (camposSistemaRecibidos.length > 0) {
    throw new Error(
      'ERROR_ACTUALIZACION: campos gestionados por el sistema no permitidos: ' +
      camposSistemaRecibidos.join(', ')
    );
  }

  var registroFusionado = {};

  cabeceras.forEach(function (campo) {
    if (
      camposSistemaActualizar.indexOf(
        campo
      ) !== -1
    ) {
      return;
    }

    var tieneCambio =
      Object.prototype.hasOwnProperty.call(
        cambios,
        campo
      );

    var valor = tieneCambio
      ? cambios[campo]
      : registroActual[campo];

    if (tieneCambio || valor !== '') {
      registroFusionado[campo] = valor;
    }
  });

  /*
   * Revalidación completa reutilizando
   * el motor de inserción.
   *
   * La validación se ejecuta en dryRun
   * y excluye el registro actual.
   */
  insertarRegistroTransaccional(
    entidad,
    registroFusionado,
    {
      dryRun: true,
      idExcluir: id,
      origen: origen,
      correlationId: correlationId,
      esPrueba: esPrueba,
      pruebaId: pruebaId
    }
  );

  var zonaHoraria =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSpreadsheetTimeZone();

  var diferencias = clavesCambio
    .filter(function (campo) {
      return !sonValoresEquivalentesActualizacion_(
        registroActual[campo],
        cambios[campo],
        zonaHoraria
      );
    })
    .map(function (campo) {
      return {
        campo: campo,
        anterior: registroActual[campo],
        nuevo: cambios[campo]
      };
    });

  if (
    dryRun ||
    diferencias.length === 0
  ) {
    return {
      id: id,
      diferencias: diferencias
    };
  }

  var ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    throw new Error(
      'ERROR_ACTUALIZACION: la hoja no contiene registros.'
    );
  }

  var idsColumna = hoja
    .getRange(
      2,
      1,
      ultimaFila - 1,
      1
    )
    .getDisplayValues()
    .map(function (fila) {
      return String(fila[0]).trim();
    });

  var indiceFila =
    idsColumna.indexOf(
      String(id).trim()
    );

  if (indiceFila === -1) {
    throw new Error(
      'ERROR_ACTUALIZACION: no se encontro la fila del registro al escribir los cambios.'
    );
  }

  var numeroFila = indiceFila + 2;

  diferencias.forEach(function (diferencia) {
    var numeroColumna =
      cabeceras.indexOf(
        diferencia.campo
      ) + 1;

    if (numeroColumna <= 0) {
      throw new Error(
        'ERROR_ACTUALIZACION: no se encontro la columna ' +
        diferencia.campo +
        '.'
      );
    }

    hoja
      .getRange(
        numeroFila,
        numeroColumna
      )
      .setValue(
        diferencia.nuevo
      );
  });

  var usuarioModificacion =
    Session
      .getEffectiveUser()
      .getEmail() ||
    'USUARIO_NO_IDENTIFICADO';

  var indiceFechaModificacion =
    cabeceras.indexOf(
      'FECHA_MODIFICACION'
    );

  var indiceModificadoPor =
    cabeceras.indexOf(
      'MODIFICADO_POR'
    );

  if (indiceFechaModificacion !== -1) {
    hoja
      .getRange(
        numeroFila,
        indiceFechaModificacion + 1
      )
      .setValue(new Date());
  }

  if (indiceModificadoPor !== -1) {
    hoja
      .getRange(
        numeroFila,
        indiceModificadoPor + 1
      )
      .setValue(usuarioModificacion);
  }

  SpreadsheetApp.flush();

  var accionHistorial = 'ACTUALIZAR';

  if (
    diferencias.length === 1 &&
    diferencias[0].campo === 'ACTIVO'
  ) {
    accionHistorial =
      String(diferencias[0].nuevo)
        .trim()
        .toUpperCase() === 'NO'
        ? 'DESACTIVAR'
        : 'REACTIVAR';
  }

  registrarHistorial(
    entidad,
    id,
    accionHistorial,
    diferencias,
    {
      origen: origen,
      correlationId: correlationId,
      esPrueba: esPrueba,
      pruebaId: pruebaId,
      resultado: 'OK'
    }
  );

  return {
    id: id,
    diferencias: diferencias,
    fechaModificacionActualizada:
      indiceFechaModificacion !== -1,
    modificadoPorActualizado:
      indiceModificadoPor !== -1,
    origen: origen,
    correlationId: correlationId
  };
}

/* ============================================================
 * REPOSITORY_ESTADO — Fase 4: baja logica y reactivacion.
 * Reutiliza actualizarRegistroTransaccional (Fase 3) para escribir
 * el campo ACTIVO, y listarPorRelacion (Fase 2) para detectar
 * dependientes activos antes de desactivar. No se duplica logica
 * de escritura ni de consulta ya existente.
 *
 * Alcance: solo se cubren relaciones FK directas (no polimorficas).
 * DOCUMENTO referencia otras entidades via ENTIDAD_TIPO/ENTIDAD_ID
 * de forma polimorfica y no se valida aqui, igual que en el motor
 * de insercion (ver nota de DOCUMENTO en Fase 2). RESPONSABLE_ID
 * en CAMPANA/PROYECTO/PRODUCTO/PROCESO/DECISION/INCIDENCIA es una
 * referencia opcional de un solo valor, no un listado de
 * dependientes, por lo que tampoco bloquea la baja.
 * ============================================================ */

const DEPENDENCIAS_ACTIVAS_MVP = Object.freeze({
  CAMPANA: [
    {entidad: 'PROYECTO', campo: 'CAMPANA_ID'}
  ],
  PROYECTO: [
    {entidad: 'PROYECTO_PRODUCTO', campo: 'PROYECTO_ID'},
    {entidad: 'DECISION', campo: 'PROYECTO_ID'}
  ],
  PRODUCTO: [
    {entidad: 'PROYECTO_PRODUCTO', campo: 'PRODUCTO_ID'},
    {entidad: 'PROCESO', campo: 'PRODUCTO_ID'},
    {entidad: 'PRODUCTO_MATERIAL', campo: 'PRODUCTO_ID'}
  ],
  PROYECTO_PRODUCTO: [],
  PROCESO: [
    {entidad: 'TAREA', campo: 'PROCESO_ID'}
  ],
  TAREA: [
    {entidad: 'TAREA_RESPONSABLE', campo: 'TAREA_ID'},
    {entidad: 'TAREA_MATERIAL', campo: 'TAREA_ID'}
  ],
  TAREA_RESPONSABLE: [],
  MATERIAL: [
    {entidad: 'PRODUCTO_MATERIAL', campo: 'MATERIAL_ID'},
    {entidad: 'TAREA_MATERIAL', campo: 'MATERIAL_ID'}
  ],
  PERSONA_EQUIPO: [
    {entidad: 'TAREA_RESPONSABLE', campo: 'PERSONA_EQUIPO_ID'}
  ],
  PRODUCTO_MATERIAL: [],
  TAREA_MATERIAL: [],
  DECISION: [],
  INCIDENCIA: [],
  DOCUMENTO: []
});

function obtenerDependenciasActivas_(entidad, id) {
  var clave = String(entidad || '').trim().toUpperCase();
  var reglas = DEPENDENCIAS_ACTIVAS_MVP[clave] || [];

  var encontradas = [];
  reglas.forEach(function (regla) {
    var hijos = listarPorRelacion(regla.entidad, regla.campo, id);
    var activos = hijos.filter(function (fila) {
      return fila.ACTIVO === 'SÍ';
    });
    if (activos.length > 0) {
      encontradas.push({
        entidad: regla.entidad,
        campo: regla.campo,
        cantidad: activos.length
      });
    }
  });
  return encontradas;
}

/*
 * Version "con detalle" de obtenerDependenciasActivas_, para la UI: en
 * vez de solo el conteo, tambien los IDs+etiqueta de los registros que
 * bloquean la baja, para poder listarlos y ofrecer editarlos desde el
 * mismo formulario. Separada de obtenerDependenciasActivas_ (usada por
 * desactivarRegistro, la logica de seguridad real) para no arriesgar
 * esa ruta ya probada -- esta es de solo lectura, para mostrar.
 */
function obtenerDependenciasActivasDetalle(entidad, id) {
  var clave = String(entidad || '').trim().toUpperCase();
  var reglas = DEPENDENCIAS_ACTIVAS_MVP[clave] || [];

  var detalle = [];
  reglas.forEach(function (regla) {
    var activos = listarPorRelacion(regla.entidad, regla.campo, id).filter(function (fila) {
      return fila.ACTIVO === 'SÍ';
    });
    if (activos.length === 0) return;
    detalle.push({
      entidad: regla.entidad,
      cantidad: activos.length,
      registros: activos.map(function (fila) {
        return { id: fila.ID, etiqueta: fila.ID + ' - ' + (fila.NOMBRE || fila.TITULO || '') };
      })
    });
  });
  return detalle;
}

function desactivarRegistro(entidad, id) {
  var registroActual = obtenerRegistroPorId(entidad, id);
  if (!registroActual) {
    throw new Error('ERROR_BAJA: no existe un registro de ' + entidad + ' con id ' + id + '.');
  }
  if (registroActual.ACTIVO === 'NO') {
    throw new Error('ERROR_BAJA: el registro ' + id + ' ya esta inactivo.');
  }

  var dependencias = obtenerDependenciasActivas_(entidad, id);
  if (dependencias.length > 0) {
    var detalle = dependencias
      .map(function (dep) { return dep.entidad + ' (' + dep.cantidad + ')'; })
      .join(', ');
    throw new Error('ERROR_BAJA: no se puede desactivar ' + id + ', tiene dependientes activos: ' + detalle);
  }

  return actualizarRegistroTransaccional(entidad, id, {ACTIVO: 'NO'});
}

function reactivarRegistro(entidad, id) {
  var registroActual = obtenerRegistroPorId(entidad, id);
  if (!registroActual) {
    throw new Error('ERROR_REACTIVACION: no existe un registro de ' + entidad + ' con id ' + id + '.');
  }
  if (registroActual.ACTIVO === 'SÍ') {
    throw new Error('ERROR_REACTIVACION: el registro ' + id + ' ya esta activo.');
  }

  return actualizarRegistroTransaccional(entidad, id, {ACTIVO: 'SÍ'});
}


