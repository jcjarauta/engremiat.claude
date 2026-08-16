/**
 * Importación masiva -- módulo IMPORTACION_AVANZADA (ver conversación --
 * "vamos a simplificar el CORE a Campaña... y dejaremos las otras
 * importaciones: recursos, incidencias... como un módulo superior
 * acoplable"): Recursos/Personas, Asignaciones, Seguimiento (Decisión/
 * Incidencia/Documento), Horario y Ejecución -- los 5 grupos de
 * Importación masiva que NO forman parte de la jerarquía básica de
 * campaña (esa se queda en ImportacionMasiva.js/CORE).
 *
 * Depende de CORE (ImportacionMasiva.js): reutiliza
 * reiniciarCacheImportacionMasiva_/agruparErroresRepetidos_/
 * leerFilasPendientesImportacion_/marcarFilaImportacionMasiva_/
 * resolverReferenciaStaging_/validarReferenciaStaging_ tal cual --
 * Apps Script combina todos los .js del proyecto en un único ámbito
 * global, así que no hace falta ningún import/require para llamarlas
 * desde aquí. La separación de fichero es solo para que
 * tools/packager pueda (cuando se reactive) declarar este módulo sin
 * mezclar su código con el de CORE.
 */

/*
 * Fase N8 (ver conversación): mismo patrón STG_* / dry-run /
 * confirmación humana / CORRELATION_ID que la importación de campaña (L5.3), pero en
 * un flujo separado -- Recursos/Personas son dominios independientes
 * de la jerarquía de campaña, no tiene sentido forzar un único
 * resumen combinado. RECURSO es un árbol de profundidad variable
 * (UBICACION_ID autorreferenciado) y PERSONA_EQUIPO tiene su propia
 * autorreferencia (COORDINADOR_ID) -- ambas se resuelven en dos
 * pasadas (alta sin la referencia circular, luego actualización) para
 * no exigir que cada fila padre aparezca antes que sus hijas en la
 * hoja, a diferencia de la jerarquía de campaña que sí depende del
 * orden de filas para ORDEN_SECUENCIA/predecesor.
 */
function procesarImportacionRecursosPersonas_(confirmar) {
  reiniciarCacheImportacionMasiva_();
  try {
    var resultado = ejecutarImportacionRecursosPersonas_(confirmar);
    resultado.errores = agruparErroresRepetidos_(resultado.errores);
    return resultado;
  } finally {
    cacheLecturaFinalizarContexto_();
  }
}

function ejecutarImportacionRecursosPersonas_(confirmar) {
  var errores = [];

  var filasRecurso = leerFilasPendientesImportacion_('STG_RECURSO');
  var filasPersona = leerFilasPendientesImportacion_('STG_PERSONA');
  var filasEquipoMiembro = leerFilasPendientesImportacion_('STG_EQUIPO_MIEMBRO');

  function validarObligatorios_(filas, hoja, campos) {
    filas.forEach(function (f) {
      campos.forEach(function (c) {
        if (f[c] === '' || f[c] === null || f[c] === undefined) {
          errores.push(hoja + ' fila ' + f._fila + ': falta el campo obligatorio ' + c);
        }
      });
    });
  }

  validarObligatorios_(filasRecurso, 'STG_RECURSO', ['CODIGO', 'NOMBRE', 'CLASE_RECURSO', 'ESTADO']);
  validarObligatorios_(filasPersona, 'STG_PERSONA', ['TIPO', 'NOMBRE', 'ROL', 'CAPACIDAD_SEMANAL_DIAS', 'DISPONIBILIDAD', 'ESTADO']);
  validarObligatorios_(filasEquipoMiembro, 'STG_EQUIPO_MIEMBRO', ['EQUIPO_TEMPORAL', 'MIEMBRO_TEMPORAL', 'ESTADO']);

  function validarCatalogo_(filas, hoja, campo, nombreCatalogo) {
    var valores = obtenerCatalogo(nombreCatalogo);

    filas.forEach(function (f) {
      var v = String(f[campo] || '').trim();
      if (v && valores.indexOf(v) === -1) {
        errores.push(
          hoja + ' fila ' + f._fila + ': ' + campo + ' "' + v + '" no es un valor válido (esperado uno de: ' + valores.join(', ') + ')'
        );
      }
    });
  }

  validarCatalogo_(filasRecurso, 'STG_RECURSO', 'CLASE_RECURSO', 'CFG_CLASE_RECURSO');
  validarCatalogo_(filasRecurso, 'STG_RECURSO', 'CATEGORIA_RECURSO', 'CFG_CATEGORIA_RECURSO');
  validarCatalogo_(filasRecurso, 'STG_RECURSO', 'ESTADO', 'CFG_ESTADO_RECURSO_FISICO');
  validarCatalogo_(filasPersona, 'STG_PERSONA', 'TIPO', 'CFG_TIPO_RECURSO');
  validarCatalogo_(filasPersona, 'STG_PERSONA', 'ROL', 'CFG_ROL_PERSONA');
  validarCatalogo_(filasPersona, 'STG_PERSONA', 'DISPONIBILIDAD', 'CFG_DISPONIBILIDAD');
  validarCatalogo_(filasPersona, 'STG_PERSONA', 'ESTADO', 'CFG_ESTADO_RECURSO');

  filasPersona.forEach(function (f) {
    var capacidad = Number(f.CAPACIDAD_SEMANAL_DIAS);
    if (!isFinite(capacidad) || capacidad <= 0 || capacidad > 7) {
      errores.push('STG_PERSONA fila ' + f._fila + ': CAPACIDAD_SEMANAL_DIAS debe ser un número mayor que 0 y menor o igual que 7');
    }
  });

  function validarTemporalesUnicos_(filas, hoja) {
    var vistos = {};
    filas.forEach(function (f) {
      var id = String(f.ID_TEMPORAL || '').trim();
      if (vistos[id]) errores.push(hoja + ' fila ' + f._fila + ': ID_TEMPORAL "' + id + '" duplicado en la misma hoja');
      vistos[id] = true;
    });
  }

  validarTemporalesUnicos_(filasRecurso, 'STG_RECURSO');
  validarTemporalesUnicos_(filasPersona, 'STG_PERSONA');

  /*
   * Referencia autorreferenciada (UBICACION_TEMPORAL/COORDINADOR_TEMPORAL/
   * EQUIPO_TEMPORAL/MIEMBRO_TEMPORAL): a diferencia de
   * validarReferenciaPadre_ (jerarquía de campaña), aquí no importa el
   * orden de filas dentro del propio lote -- solo que el temporal
   * exista en algún sitio del lote, o que sea ya un ID real.
   */
  function validarReferenciaOpcional_(filas, hoja, campo, filasDelMismoLote, entidadReal) {
    filas.forEach(function (f) {
      var valor = String(f[campo] || '').trim();
      if (!valor) return;
      var esTemporalDelLote = filasDelMismoLote.some(function (p) { return String(p.ID_TEMPORAL || '').trim() === valor; });
      if (esTemporalDelLote) return;
      if (obtenerRegistroPorId(entidadReal, valor)) return;
      errores.push(hoja + ' fila ' + f._fila + ': ' + campo + ' "' + valor + '" no corresponde a ningún ID_TEMPORAL del lote ni a un ' + entidadReal + ' real existente');
    });
  }

  validarReferenciaOpcional_(filasRecurso, 'STG_RECURSO', 'UBICACION_TEMPORAL', filasRecurso, 'RECURSO');
  validarReferenciaOpcional_(filasPersona, 'STG_PERSONA', 'COORDINADOR_TEMPORAL', filasPersona, 'PERSONA_EQUIPO');
  validarReferenciaOpcional_(filasEquipoMiembro, 'STG_EQUIPO_MIEMBRO', 'EQUIPO_TEMPORAL', filasPersona, 'PERSONA_EQUIPO');
  validarReferenciaOpcional_(filasEquipoMiembro, 'STG_EQUIPO_MIEMBRO', 'MIEMBRO_TEMPORAL', filasPersona, 'PERSONA_EQUIPO');

  var resumen = {
    recursos: filasRecurso.length,
    personas: filasPersona.length,
    equipoMiembros: filasEquipoMiembro.length
  };

  if (errores.length > 0 || !confirmar) {
    return { ok: errores.length === 0, errores: errores, resumen: resumen };
  }

  var correlationId = Utilities.getUuid();
  var mapaRecurso = {};
  var mapaPersona = {};

  filasRecurso.forEach(function (f) {
    var resultado = insertarRegistroTransaccional('RECURSO', {
      CODIGO: f.CODIGO,
      NOMBRE: f.NOMBRE,
      CLASE_RECURSO: f.CLASE_RECURSO,
      CATEGORIA_RECURSO: f.CATEGORIA_RECURSO,
      ESTADO: f.ESTADO
    }, { origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId });

    mapaRecurso[String(f.ID_TEMPORAL).trim()] = resultado.id;
    marcarFilaImportacionMasiva_('STG_RECURSO', f._fila, resultado.id, undefined, correlationId);
  });

  filasRecurso.forEach(function (f) {
    var ubicacionTemporal = String(f.UBICACION_TEMPORAL || '').trim();
    if (!ubicacionTemporal) return;
    var ubicacionId = mapaRecurso[ubicacionTemporal] || ubicacionTemporal;
    var recursoId = mapaRecurso[String(f.ID_TEMPORAL).trim()];
    actualizarRegistroTransaccional('RECURSO', recursoId, { UBICACION_ID: ubicacionId }, { origen: 'ADMIN', correlationId: correlationId });
  });

  filasPersona.forEach(function (f) {
    var resultado = insertarRegistroTransaccional('PERSONA_EQUIPO', {
      TIPO: f.TIPO,
      NOMBRE: f.NOMBRE,
      ROL: f.ROL,
      CAPACIDAD_SEMANAL_DIAS: f.CAPACIDAD_SEMANAL_DIAS,
      DISPONIBILIDAD: f.DISPONIBILIDAD,
      ESTADO: f.ESTADO
    }, { origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId });

    mapaPersona[String(f.ID_TEMPORAL).trim()] = resultado.id;
    marcarFilaImportacionMasiva_('STG_PERSONA', f._fila, resultado.id, undefined, correlationId);
  });

  filasPersona.forEach(function (f) {
    var coordinadorTemporal = String(f.COORDINADOR_TEMPORAL || '').trim();
    if (!coordinadorTemporal) return;
    var coordinadorId = mapaPersona[coordinadorTemporal] || coordinadorTemporal;
    var personaId = mapaPersona[String(f.ID_TEMPORAL).trim()];
    actualizarRegistroTransaccional('PERSONA_EQUIPO', personaId, { COORDINADOR_ID: coordinadorId }, { origen: 'ADMIN', correlationId: correlationId });
  });

  filasEquipoMiembro.forEach(function (f) {
    var equipoTemporal = String(f.EQUIPO_TEMPORAL).trim();
    var miembroTemporal = String(f.MIEMBRO_TEMPORAL).trim();
    var equipoId = mapaPersona[equipoTemporal] || equipoTemporal;
    var miembroId = mapaPersona[miembroTemporal] || miembroTemporal;

    var resultado = insertarRegistroTransaccional('EQUIPO_MIEMBRO', {
      EQUIPO_ID: equipoId,
      MIEMBRO_ID: miembroId,
      ESTADO: f.ESTADO
    }, { origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_EQUIPO_MIEMBRO', f._fila, resultado.id, undefined, correlationId);
  });

  return { ok: true, errores: [], resumen: resumen };
}

/*
 * Asignaciones de Tarea (Responsable/Recurso): pensado para ejecutarse
 * DESPUÉS de importar la campaña y/o recursos/personas -- TAREA_TEMPORAL/
 * PERSONA_TEMPORAL/RECURSO_TEMPORAL pueden seguir usando las mismas
 * claves cortas del lote original (ver resolverReferenciaStaging_) en
 * vez de obligar a conocer los IDs reales generados.
 */
function procesarImportacionAsignaciones_(confirmar) {
  reiniciarCacheImportacionMasiva_();
  try {
    var resultado = ejecutarImportacionAsignaciones_(confirmar);
    resultado.errores = agruparErroresRepetidos_(resultado.errores);
    return resultado;
  } finally {
    cacheLecturaFinalizarContexto_();
  }
}

function ejecutarImportacionAsignaciones_(confirmar) {
  var errores = [];

  var filasResponsable = leerFilasPendientesImportacion_('STG_TAREA_RESPONSABLE');
  var filasRecurso = leerFilasPendientesImportacion_('STG_TAREA_RECURSO');

  function validarObligatorios_(filas, hoja, campos) {
    filas.forEach(function (f) {
      campos.forEach(function (c) {
        if (f[c] === '' || f[c] === null || f[c] === undefined) {
          errores.push(hoja + ' fila ' + f._fila + ': falta el campo obligatorio ' + c);
        }
      });
    });
  }

  validarObligatorios_(filasResponsable, 'STG_TAREA_RESPONSABLE', ['TAREA_TEMPORAL', 'PERSONA_TEMPORAL', 'ROL_ASIGNADO', 'PORCENTAJE_DEDICACION', 'ESTADO']);
  validarObligatorios_(filasRecurso, 'STG_TAREA_RECURSO', ['TAREA_TEMPORAL', 'RECURSO_TEMPORAL', 'TIPO_USO', 'ESTADO']);

  function validarCatalogo_(filas, hoja, campo, nombreCatalogo) {
    var valores = obtenerCatalogo(nombreCatalogo);
    filas.forEach(function (f) {
      var v = String(f[campo] || '').trim();
      if (v && valores.indexOf(v) === -1) {
        errores.push(
          hoja + ' fila ' + f._fila + ': ' + campo + ' "' + v + '" no es un valor válido (esperado uno de: ' + valores.join(', ') + ')'
        );
      }
    });
  }

  validarCatalogo_(filasResponsable, 'STG_TAREA_RESPONSABLE', 'ROL_ASIGNADO', 'CFG_ROL_ASIGNACION');
  validarCatalogo_(filasResponsable, 'STG_TAREA_RESPONSABLE', 'ESTADO', 'CFG_ESTADO_ASIGNACION');
  validarCatalogo_(filasRecurso, 'STG_TAREA_RECURSO', 'TIPO_USO', 'CFG_TIPO_USO_RECURSO');
  validarCatalogo_(filasRecurso, 'STG_TAREA_RECURSO', 'ESTADO', 'CFG_ESTADO_RELACION');

  filasResponsable.forEach(function (f) {
    var pct = Number(f.PORCENTAJE_DEDICACION);
    if (!isFinite(pct) || pct <= 0 || pct > 100) {
      errores.push('STG_TAREA_RESPONSABLE fila ' + f._fila + ': PORCENTAJE_DEDICACION debe ser un número entre 1 y 100');
    }
  });

  validarReferenciaStaging_(filasResponsable, 'STG_TAREA_RESPONSABLE', 'TAREA_TEMPORAL', 'STG_TAREA', 'TAREA', errores);
  validarReferenciaStaging_(filasResponsable, 'STG_TAREA_RESPONSABLE', 'PERSONA_TEMPORAL', 'STG_PERSONA', 'PERSONA_EQUIPO', errores);
  validarReferenciaStaging_(filasRecurso, 'STG_TAREA_RECURSO', 'TAREA_TEMPORAL', 'STG_TAREA', 'TAREA', errores);
  validarReferenciaStaging_(filasRecurso, 'STG_TAREA_RECURSO', 'RECURSO_TEMPORAL', 'STG_RECURSO', 'RECURSO', errores);

  var resumen = { responsables: filasResponsable.length, recursos: filasRecurso.length };

  if (errores.length > 0 || !confirmar) {
    return { ok: errores.length === 0, errores: errores, resumen: resumen };
  }

  var correlationId = Utilities.getUuid();

  filasResponsable.forEach(function (f) {
    var resultado = insertarRegistroTransaccional('TAREA_RESPONSABLE', {
      TAREA_ID: resolverReferenciaStaging_('STG_TAREA', f.TAREA_TEMPORAL),
      PERSONA_EQUIPO_ID: resolverReferenciaStaging_('STG_PERSONA', f.PERSONA_TEMPORAL),
      ROL_ASIGNADO: f.ROL_ASIGNADO,
      PORCENTAJE_DEDICACION: Number(f.PORCENTAJE_DEDICACION),
      ESTADO: f.ESTADO
    }, { origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_TAREA_RESPONSABLE', f._fila, resultado.id, undefined, correlationId);
  });

  filasRecurso.forEach(function (f) {
    var resultado = insertarRegistroTransaccional('TAREA_RECURSO', {
      TAREA_ID: resolverReferenciaStaging_('STG_TAREA', f.TAREA_TEMPORAL),
      RECURSO_ID: resolverReferenciaStaging_('STG_RECURSO', f.RECURSO_TEMPORAL),
      TIPO_USO: f.TIPO_USO,
      ESTADO: f.ESTADO
    }, { origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_TAREA_RECURSO', f._fila, resultado.id, undefined, correlationId);
  });

  return { ok: true, errores: [], resumen: resumen };
}

/*
 * Fase N11 (ver conversación -- "volcar al sheet todos los datos
 * necesarios para que los informes estén completos"): Decisión,
 * Incidencia, Documento y Horario, los últimos huecos CORE que
 * Informes/Excepciones/Calidad de planificación ya leen sin tener
 * forma de cargarlos masivamente.
 */

/*
 * INCIDENCIA/DOCUMENTO son polimórficos -- cuelgan de uno de los 5
 * niveles de la jerarquía de campaña, indicado por una columna de nivel
 * (NIVEL_INCIDENCIA/ENTIDAD_TIPO) en vez de una FK fija como el resto.
 * Encuentra cuál de las 5 columnas *_TEMPORAL trae valor, la resuelve
 * igual que cualquier otra referencia (temporal del lote o ID real) y
 * valida que exista. Devuelve null si ninguna columna tiene valor (nivel
 * no vinculado a nada, válido para Incidencia) o si hay más de una
 * rellenada (ambiguo, error).
 */
var NIVELES_ENTIDAD_POLIMORFICA_ = [
  { columna: 'CAMPANA_TEMPORAL', hoja: 'STG_CAMPANA', entidad: 'CAMPANA', campoId: 'CAMPANA_ID' },
  { columna: 'PROYECTO_TEMPORAL', hoja: 'STG_PROYECTO', entidad: 'PROYECTO', campoId: 'PROYECTO_ID' },
  { columna: 'PRODUCTO_TEMPORAL', hoja: 'STG_PRODUCTO', entidad: 'PRODUCTO', campoId: 'PRODUCTO_ID' },
  { columna: 'PROCESO_TEMPORAL', hoja: 'STG_PROCESO', entidad: 'PROCESO', campoId: 'PROCESO_ID' },
  { columna: 'TAREA_TEMPORAL', hoja: 'STG_TAREA', entidad: 'TAREA', campoId: 'TAREA_ID' }
];

function resolverEntidadPoliformica_(f, hoja, errores) {
  var rellenas = NIVELES_ENTIDAD_POLIMORFICA_.filter(function (n) {
    return String(f[n.columna] || '').trim() !== '';
  });

  if (rellenas.length === 0) return null;

  if (rellenas.length > 1) {
    errores.push(
      hoja + ' fila ' + f._fila + ': solo una columna de nivel puede tener valor (' +
        rellenas.map(function (n) { return n.columna; }).join(', ') + ' están todas rellenas)'
    );
    return null;
  }

  var nivel = rellenas[0];
  var valorOriginal = String(f[nivel.columna]).trim();
  var resuelto = resolverReferenciaStaging_(nivel.hoja, valorOriginal);

  if (!obtenerRegistroPorId(nivel.entidad, resuelto)) {
    errores.push(
      hoja + ' fila ' + f._fila + ': ' + nivel.columna + ' "' + valorOriginal + '" no corresponde a ningún ' +
        nivel.entidad + ' real existente ni a un ID_TEMPORAL ya importado de ' + nivel.hoja
    );
    return null;
  }

  var datos = {};
  datos[nivel.campoId] = resuelto;
  return datos;
}


/*
 * Decisión, Incidencia y Documento en un único lote (ver conversación):
 * las tres son hojas "de seguimiento" que cuelgan de la jerarquía ya
 * creada, sin ningún orden de dependencia entre ellas (a diferencia de
 * Campaña→Tarea), así que se validan y confirman juntas.
 */
function procesarImportacionSeguimiento_(confirmar) {
  reiniciarCacheImportacionMasiva_();
  try {
    var resultado = ejecutarImportacionSeguimiento_(confirmar);
    resultado.errores = agruparErroresRepetidos_(resultado.errores);
    return resultado;
  } finally {
    cacheLecturaFinalizarContexto_();
  }
}

function ejecutarImportacionSeguimiento_(confirmar) {
  var errores = [];

  var filasDecision = leerFilasPendientesImportacion_('STG_DECISION');
  var filasIncidencia = leerFilasPendientesImportacion_('STG_INCIDENCIA');
  var filasDocumento = leerFilasPendientesImportacion_('STG_DOCUMENTO');

  function validarObligatorios_(filas, hoja, campos) {
    filas.forEach(function (f) {
      campos.forEach(function (c) {
        if (f[c] === '' || f[c] === null || f[c] === undefined) {
          errores.push(hoja + ' fila ' + f._fila + ': falta el campo obligatorio ' + c);
        }
      });
    });
  }

  validarObligatorios_(filasDecision, 'STG_DECISION', ['PROYECTO_TEMPORAL', 'TITULO', 'TIPO', 'ESTADO']);
  validarObligatorios_(filasIncidencia, 'STG_INCIDENCIA', ['NIVEL_INCIDENCIA', 'TITULO', 'TIPO', 'PRIORIDAD', 'FECHA_DETECCION', 'ESTADO']);
  validarObligatorios_(filasDocumento, 'STG_DOCUMENTO', ['ENTIDAD_TIPO', 'TIPO_DOCUMENTO', 'TITULO', 'URL', 'ESTADO']);

  function validarCatalogo_(filas, hoja, campo, nombreCatalogo) {
    var valores = obtenerCatalogo(nombreCatalogo);
    filas.forEach(function (f) {
      var v = String(f[campo] || '').trim();
      if (v && valores.indexOf(v) === -1) {
        errores.push(
          hoja + ' fila ' + f._fila + ': ' + campo + ' "' + v + '" no es un valor válido (esperado uno de: ' + valores.join(', ') + ')'
        );
      }
    });
  }

  validarCatalogo_(filasDecision, 'STG_DECISION', 'TIPO', 'CFG_TIPO_DECISION');
  validarCatalogo_(filasDecision, 'STG_DECISION', 'ESTADO', 'CFG_ESTADO_DECISION');
  validarCatalogo_(filasIncidencia, 'STG_INCIDENCIA', 'NIVEL_INCIDENCIA', 'CFG_NIVEL_INCIDENCIA');
  validarCatalogo_(filasIncidencia, 'STG_INCIDENCIA', 'TIPO', 'CFG_TIPO_INCIDENCIA');
  validarCatalogo_(filasIncidencia, 'STG_INCIDENCIA', 'PRIORIDAD', 'CFG_PRIORIDAD');
  validarCatalogo_(filasIncidencia, 'STG_INCIDENCIA', 'ESTADO', 'CFG_ESTADO_INCIDENCIA');
  validarCatalogo_(filasDocumento, 'STG_DOCUMENTO', 'ENTIDAD_TIPO', 'CFG_ENTIDAD_DOCUMENTO');
  validarCatalogo_(filasDocumento, 'STG_DOCUMENTO', 'TIPO_DOCUMENTO', 'CFG_TIPO_DOCUMENTO');
  validarCatalogo_(filasDocumento, 'STG_DOCUMENTO', 'ESTADO', 'CFG_ESTADO_DOCUMENTO');

  /*
   * Coherencia Decisión (espejo de Repository_InsertarRegistro.js,
   * mismo criterio que validarCoherenciaFechaReal_ en v54): FECHA_LIMITE
   * no puede ser anterior a hoy (fecha de creación real); ESTADO de
   * cierre exige RESOLUCION+FECHA_RESOLUCION (>= hoy); ESTADO abierto no
   * admite ninguna de las dos.
   */
  function validarCoherenciaDecision_(filas) {
    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    var estadosCierre = ['Aprobada', 'Rechazada', 'Sustituida'];

    filas.forEach(function (f) {
      if (f.FECHA_LIMITE) {
        var fechaLimite = new Date(f.FECHA_LIMITE);
        fechaLimite.setHours(0, 0, 0, 0);
        if (fechaLimite.getTime() < hoy.getTime()) {
          errores.push('STG_DECISION fila ' + f._fila + ': FECHA_LIMITE no puede ser anterior a hoy (fecha de importación)');
        }
      }

      var cerrada = estadosCierre.indexOf(String(f.ESTADO || '').trim()) !== -1;
      var tieneResolucion = String(f.RESOLUCION || '').trim() !== '';
      var tieneFechaResolucion = String(f.FECHA_RESOLUCION || '').trim() !== '';

      if (cerrada) {
        if (!tieneResolucion || !tieneFechaResolucion) {
          errores.push('STG_DECISION fila ' + f._fila + ': ESTADO ' + f.ESTADO + ' requiere RESOLUCION y FECHA_RESOLUCION');
          return;
        }
        var fechaResolucion = new Date(f.FECHA_RESOLUCION);
        fechaResolucion.setHours(0, 0, 0, 0);
        if (fechaResolucion.getTime() < hoy.getTime()) {
          errores.push('STG_DECISION fila ' + f._fila + ': FECHA_RESOLUCION no puede ser anterior a hoy (fecha de importación)');
        }
      } else if (tieneResolucion || tieneFechaResolucion) {
        errores.push('STG_DECISION fila ' + f._fila + ': una decisión abierta (ESTADO ' + f.ESTADO + ') no puede tener RESOLUCION ni FECHA_RESOLUCION');
      }
    });
  }

  validarCoherenciaDecision_(filasDecision);

  validarReferenciaStaging_(filasDecision, 'STG_DECISION', 'PROYECTO_TEMPORAL', 'STG_PROYECTO', 'PROYECTO', errores);
  validarReferenciaStaging_(filasDecision, 'STG_DECISION', 'RESPONSABLE_TEMPORAL', 'STG_PERSONA', 'PERSONA_EQUIPO', errores);
  validarReferenciaStaging_(filasIncidencia, 'STG_INCIDENCIA', 'RESPONSABLE_TEMPORAL', 'STG_PERSONA', 'PERSONA_EQUIPO', errores);

  var nivelesPorFilaIncidencia = filasIncidencia.map(function (f) {
    return resolverEntidadPoliformica_(f, 'STG_INCIDENCIA', errores);
  });
  var nivelesPorFilaDocumento = filasDocumento.map(function (f) {
    var nivel = resolverEntidadPoliformica_(f, 'STG_DOCUMENTO', errores);
    if (!nivel) {
      errores.push(
        'STG_DOCUMENTO fila ' + f._fila + ': falta rellenar la columna *_TEMPORAL correspondiente a ENTIDAD_TIPO "' +
          f.ENTIDAD_TIPO + '" (esta plantilla solo admite Campaña/Proyecto/Producto/Proceso/Tarea como destino)'
      );
    }
    return nivel;
  });

  var resumen = { decisiones: filasDecision.length, incidencias: filasIncidencia.length, documentos: filasDocumento.length };

  if (errores.length > 0 || !confirmar) {
    return { ok: errores.length === 0, errores: errores, resumen: resumen };
  }

  var correlationId = Utilities.getUuid();

  filasDecision.forEach(function (f) {
    var resultado = insertarRegistroTransaccional('DECISION', {
      PROYECTO_ID: resolverReferenciaStaging_('STG_PROYECTO', f.PROYECTO_TEMPORAL),
      TITULO: f.TITULO,
      CONTEXTO: f.CONTEXTO || '',
      TIPO: f.TIPO,
      RESPONSABLE_ID: f.RESPONSABLE_TEMPORAL ? resolverReferenciaStaging_('STG_PERSONA', f.RESPONSABLE_TEMPORAL) : '',
      FECHA_LIMITE: f.FECHA_LIMITE || '',
      ESTADO: f.ESTADO,
      RESOLUCION: f.RESOLUCION || '',
      FECHA_RESOLUCION: f.FECHA_RESOLUCION || ''
    }, { origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_DECISION', f._fila, resultado.id, undefined, correlationId);
  });

  filasIncidencia.forEach(function (f, indice) {
    var datosNivel = nivelesPorFilaIncidencia[indice] || {};
    var resultado = insertarRegistroTransaccional('INCIDENCIA', Object.assign({
      NIVEL_INCIDENCIA: f.NIVEL_INCIDENCIA,
      TITULO: f.TITULO,
      DESCRIPCION: f.DESCRIPCION || '',
      TIPO: f.TIPO,
      PRIORIDAD: f.PRIORIDAD,
      RESPONSABLE_ID: f.RESPONSABLE_TEMPORAL ? resolverReferenciaStaging_('STG_PERSONA', f.RESPONSABLE_TEMPORAL) : '',
      FECHA_DETECCION: f.FECHA_DETECCION,
      FECHA_LIMITE: f.FECHA_LIMITE || '',
      ESTADO: f.ESTADO
    }, datosNivel), { origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_INCIDENCIA', f._fila, resultado.id, undefined, correlationId);
  });

  filasDocumento.forEach(function (f, indice) {
    var datosNivel = nivelesPorFilaDocumento[indice] || {};
    var entidadIdResuelto = datosNivel[Object.keys(datosNivel)[0]] || '';

    var resultado = insertarRegistroTransaccional('DOCUMENTO', {
      ENTIDAD_TIPO: f.ENTIDAD_TIPO,
      ENTIDAD_ID: entidadIdResuelto,
      TIPO_DOCUMENTO: f.TIPO_DOCUMENTO,
      TITULO: f.TITULO,
      DESCRIPCION: f.DESCRIPCION || '',
      VERSION: f.VERSION || '',
      URL: f.URL,
      ESTADO: f.ESTADO,
      FECHA_DOCUMENTO: f.FECHA_DOCUMENTO || ''
    }, { origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_DOCUMENTO', f._fila, resultado.id, undefined, correlationId);
  });

  return { ok: true, errores: [], resumen: resumen };
}

/*
 * HORARIO: ENTIDAD_TIPO decide si se resuelve PERSONA_TEMPORAL o
 * RECURSO_TEMPORAL -- las columnas *_TEMPORAL no usadas para ese
 * ENTIDAD_TIPO deben quedar vacías (no se validan como referencia).
 * HORA_INICIO/HORA_FIN: Repository_InsertarRegistro.js no valida su
 * formato en el commit (esa regla solo vive en el camino del formulario
 * manual, FormularioValidacionService.js) -- se replica aquí en el
 * dry-run para no dejar pasar un horario roto en silencio.
 */
/*
 * Sheets autoconvierte un valor tecleado o pegado con pinta de hora
 * ("09:00") a un valor de hora real (Date, con fecha base 1899-12-30) en
 * cuanto la celda tiene formato Automático -- pasaba en el 100% de las
 * filas al subir el CSV, y puede seguir pasando en filas ya existentes
 * de antes de que instalarStagingImportacionMasiva empezara a forzar
 * esas columnas a texto plano. Se normaliza aquí también (no solo en
 * origen) para no dejar sin importar filas ya corrompidas en la hoja.
 */
function normalizarHora_(valor) {
  if (valor instanceof Date) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'HH:mm');
  }
  return String(valor || '').trim();
}

function procesarImportacionHorario_(confirmar) {
  reiniciarCacheImportacionMasiva_();
  try {
    var resultado = ejecutarImportacionHorario_(confirmar);
    resultado.errores = agruparErroresRepetidos_(resultado.errores);
    return resultado;
  } finally {
    cacheLecturaFinalizarContexto_();
  }
}

function ejecutarImportacionHorario_(confirmar) {
  var errores = [];
  var filasHorario = leerFilasPendientesImportacion_('STG_HORARIO');

  filasHorario.forEach(function (f) {
    f.HORA_INICIO = normalizarHora_(f.HORA_INICIO);
    f.HORA_FIN = normalizarHora_(f.HORA_FIN);
  });

  filasHorario.forEach(function (f) {
    ['ENTIDAD_TIPO', 'DIA_SEMANA', 'HORA_INICIO', 'HORA_FIN', 'ESTADO'].forEach(function (c) {
      if (f[c] === '' || f[c] === null || f[c] === undefined) {
        errores.push('STG_HORARIO fila ' + f._fila + ': falta el campo obligatorio ' + c);
      }
    });
  });

  function validarCatalogo_(filas, campo, nombreCatalogo) {
    var valores = obtenerCatalogo(nombreCatalogo);
    filas.forEach(function (f) {
      var v = String(f[campo] || '').trim();
      if (v && valores.indexOf(v) === -1) {
        errores.push('STG_HORARIO fila ' + f._fila + ': ' + campo + ' "' + v + '" no es un valor válido (esperado uno de: ' + valores.join(', ') + ')');
      }
    });
  }

  validarCatalogo_(filasHorario, 'ENTIDAD_TIPO', 'CFG_ENTIDAD_HORARIO');
  validarCatalogo_(filasHorario, 'DIA_SEMANA', 'CFG_DIA_SEMANA');
  validarCatalogo_(filasHorario, 'ESTADO', 'CFG_ESTADO_RELACION');

  var formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;
  filasHorario.forEach(function (f) {
    var horaInicio = String(f.HORA_INICIO || '').trim();
    var horaFin = String(f.HORA_FIN || '').trim();
    if (horaInicio && !formatoHora.test(horaInicio)) {
      errores.push('STG_HORARIO fila ' + f._fila + ': HORA_INICIO debe tener formato HH:MM (ej. 09:00)');
    }
    if (horaFin && !formatoHora.test(horaFin)) {
      errores.push('STG_HORARIO fila ' + f._fila + ': HORA_FIN debe tener formato HH:MM (ej. 17:30)');
    }
    if (horaInicio && horaFin && formatoHora.test(horaInicio) && formatoHora.test(horaFin) && horaFin <= horaInicio) {
      errores.push('STG_HORARIO fila ' + f._fila + ': HORA_FIN debe ser posterior a HORA_INICIO');
    }
  });

  filasHorario.forEach(function (f) {
    var tipo = String(f.ENTIDAD_TIPO || '').trim();
    var tienePersona = String(f.PERSONA_TEMPORAL || '').trim() !== '';
    var tieneRecurso = String(f.RECURSO_TEMPORAL || '').trim() !== '';

    if (tipo === 'Persona/Equipo' && !tienePersona) {
      errores.push('STG_HORARIO fila ' + f._fila + ': ENTIDAD_TIPO "Persona/Equipo" requiere PERSONA_TEMPORAL');
    }
    if (tipo === 'Recurso' && !tieneRecurso) {
      errores.push('STG_HORARIO fila ' + f._fila + ': ENTIDAD_TIPO "Recurso" requiere RECURSO_TEMPORAL');
    }
  });

  validarReferenciaStaging_(filasHorario.filter(function (f) { return f.ENTIDAD_TIPO === 'Persona/Equipo'; }), 'STG_HORARIO', 'PERSONA_TEMPORAL', 'STG_PERSONA', 'PERSONA_EQUIPO', errores);
  validarReferenciaStaging_(filasHorario.filter(function (f) { return f.ENTIDAD_TIPO === 'Recurso'; }), 'STG_HORARIO', 'RECURSO_TEMPORAL', 'STG_RECURSO', 'RECURSO', errores);

  var resumen = { horarios: filasHorario.length };

  if (errores.length > 0 || !confirmar) {
    return { ok: errores.length === 0, errores: errores, resumen: resumen };
  }

  var correlationId = Utilities.getUuid();

  filasHorario.forEach(function (f) {
    var entidadId = f.ENTIDAD_TIPO === 'Persona/Equipo'
      ? resolverReferenciaStaging_('STG_PERSONA', f.PERSONA_TEMPORAL)
      : resolverReferenciaStaging_('STG_RECURSO', f.RECURSO_TEMPORAL);

    var resultado = insertarRegistroTransaccional('HORARIO', {
      ENTIDAD_TIPO: f.ENTIDAD_TIPO,
      ENTIDAD_ID: entidadId,
      DIA_SEMANA: f.DIA_SEMANA,
      HORA_INICIO: f.HORA_INICIO,
      HORA_FIN: f.HORA_FIN,
      FECHA_INICIO_VIGENCIA: f.FECHA_INICIO_VIGENCIA || '',
      FECHA_FIN_VIGENCIA: f.FECHA_FIN_VIGENCIA || '',
      ESTADO: f.ESTADO
    }, { origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_HORARIO', f._fila, resultado.id, undefined, correlationId);
  });

  return { ok: true, errores: [], resumen: resumen };
}


/*
 * EJECUCION_TAREA: registro real de trabajo hecho sobre una tarea (quién,
 * cuándo, con qué resultado) -- sin esto, un cliente que quiere
 * reconstruir en bloque el histórico de una campaña ya cerrada solo
 * podía cargarlo fila a fila desde la Ficha de tarea. RESPONSABLE_TEMPORAL
 * es opcional (una ejecución puede registrarse sin responsable nombrado).
 */
function procesarImportacionEjecucion_(confirmar) {
  reiniciarCacheImportacionMasiva_();
  try {
    var resultado = ejecutarImportacionEjecucion_(confirmar);
    resultado.errores = agruparErroresRepetidos_(resultado.errores);
    return resultado;
  } finally {
    cacheLecturaFinalizarContexto_();
  }
}

function ejecutarImportacionEjecucion_(confirmar) {
  var errores = [];
  var filasEjecucion = leerFilasPendientesImportacion_('STG_EJECUCION_TAREA');

  filasEjecucion.forEach(function (f) {
    ['TAREA_TEMPORAL', 'ESTADO'].forEach(function (c) {
      if (f[c] === '' || f[c] === null || f[c] === undefined) {
        errores.push('STG_EJECUCION_TAREA fila ' + f._fila + ': falta el campo obligatorio ' + c);
      }
    });
  });

  function validarCatalogo_(campo, nombreCatalogo) {
    var valores = obtenerCatalogo(nombreCatalogo);
    filasEjecucion.forEach(function (f) {
      var v = String(f[campo] || '').trim();
      if (v && valores.indexOf(v) === -1) {
        errores.push('STG_EJECUCION_TAREA fila ' + f._fila + ': ' + campo + ' "' + v + '" no es un valor válido (esperado uno de: ' + valores.join(', ') + ')');
      }
    });
  }

  validarCatalogo_('ESTADO', 'CFG_ESTADO_RELACION');
  validarCatalogo_('RESULTADO', 'CFG_RESULTADO_EJECUCION');

  filasEjecucion.forEach(function (f) {
    if (f.DURACION_REAL_DIAS !== '' && f.DURACION_REAL_DIAS !== null && f.DURACION_REAL_DIAS !== undefined) {
      var duracion = Number(f.DURACION_REAL_DIAS);
      if (!isFinite(duracion) || duracion < 0) {
        errores.push('STG_EJECUCION_TAREA fila ' + f._fila + ': DURACION_REAL_DIAS debe ser un número >= 0');
      }
    }
  });

  validarReferenciaStaging_(filasEjecucion, 'STG_EJECUCION_TAREA', 'TAREA_TEMPORAL', 'STG_TAREA', 'TAREA', errores);
  validarReferenciaStaging_(filasEjecucion.filter(function (f) { return String(f.RESPONSABLE_TEMPORAL || '').trim() !== ''; }), 'STG_EJECUCION_TAREA', 'RESPONSABLE_TEMPORAL', 'STG_PERSONA', 'PERSONA_EQUIPO', errores);

  var resumen = { ejecuciones: filasEjecucion.length };

  if (errores.length > 0 || !confirmar) {
    return { ok: errores.length === 0, errores: errores, resumen: resumen };
  }

  var correlationId = Utilities.getUuid();

  filasEjecucion.forEach(function (f) {
    var responsableId = String(f.RESPONSABLE_TEMPORAL || '').trim() !== ''
      ? resolverReferenciaStaging_('STG_PERSONA', f.RESPONSABLE_TEMPORAL)
      : '';

    var resultado = insertarRegistroTransaccional('EJECUCION_TAREA', {
      TAREA_ID: resolverReferenciaStaging_('STG_TAREA', f.TAREA_TEMPORAL),
      RESPONSABLE_ID: responsableId,
      FECHA_INICIO: f.FECHA_INICIO || '',
      FECHA_FIN: f.FECHA_FIN || '',
      DURACION_REAL_DIAS: f.DURACION_REAL_DIAS === '' || f.DURACION_REAL_DIAS === null || f.DURACION_REAL_DIAS === undefined ? '' : Number(f.DURACION_REAL_DIAS),
      ESTADO: f.ESTADO,
      RESULTADO: f.RESULTADO || '',
      OBSERVACIONES: f.OBSERVACIONES || ''
    }, { origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_EJECUCION_TAREA', f._fila, resultado.id, undefined, correlationId);
  });

  return { ok: true, errores: [], resumen: resumen };
}

/*
 * Wrappers finos públicos de los 5 grupos avanzados -- ver el comentario
 * completo (Fase N13) junto a validarImportacionMasiva/
 * confirmarImportacionMasiva en ImportacionMasiva.js/CORE: exponen
 * procesarImportacionXxx_(false/true) directamente al cliente, sin
 * diálogo nativo, para que el HTML decida cómo mostrar el resultado.
 */
function validarImportacionRecursosPersonas() { return procesarImportacionRecursosPersonas_(false); }
function confirmarImportacionRecursosPersonas() { return procesarImportacionRecursosPersonas_(true); }
function validarImportacionAsignaciones() { return procesarImportacionAsignaciones_(false); }
function confirmarImportacionAsignaciones() { return procesarImportacionAsignaciones_(true); }
function validarImportacionSeguimiento() { return procesarImportacionSeguimiento_(false); }
function confirmarImportacionSeguimiento() { return procesarImportacionSeguimiento_(true); }
function validarImportacionHorario() { return procesarImportacionHorario_(false); }
function confirmarImportacionHorario() { return procesarImportacionHorario_(true); }
function validarImportacionEjecucion() { return procesarImportacionEjecucion_(false); }
function confirmarImportacionEjecucion() { return procesarImportacionEjecucion_(true); }

/*
 * Contribución de este módulo a GRUPOS_COMPROBACION_HUERFANOS_ (CORE,
 * ImportacionMasiva.js) -- obtenerGruposComprobacionHuerfanos_() la
 * combina con la entrada 'campana' de CORE en tiempo de ejecución (no en
 * carga de fichero: el orden de carga entre ficheros .js de un proyecto
 * de Apps Script no está garantizado, así que la combinación no puede
 * depender de qué fichero se evalúa primero).
 */
var GRUPOS_COMPROBACION_HUERFANOS_AVANZADA_ = [
  { id: 'recursos', ejecutar: ejecutarImportacionRecursosPersonas_ },
  { id: 'asignaciones', ejecutar: ejecutarImportacionAsignaciones_ },
  { id: 'seguimiento', ejecutar: ejecutarImportacionSeguimiento_ },
  { id: 'horario', ejecutar: ejecutarImportacionHorario_ },
  { id: 'ejecucion', ejecutar: ejecutarImportacionEjecucion_ }
];

