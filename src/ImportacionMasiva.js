/**
 * Fase L5.3 -- Importacion masiva de campana completa (V1 minima).
 * Lee las 5 hojas STG_* (InstaladorImportacionMasiva.js), valida todo
 * en un dry-run (campos obligatorios, valores de catalogo, que cada
 * referencia jerarquica exista -- ya sea otro ID_TEMPORAL del mismo
 * lote o un ID real ya existente, para poder ampliar una campana ya
 * creada), y solo tras confirmacion humana explicita crea los
 * registros reales de arriba a abajo (CAMPANA->PROYECTO->PRODUCTO+
 * PROYECTO_PRODUCTO->PROCESO->TAREA), bajo un unico CORRELATION_ID.
 *
 * ORDEN_SECUENCIA y PROCESO_PREDECESOR_ID/TAREA_PREDECESORA_ID se
 * asignan automaticamente segun el orden de las filas dentro del mismo
 * padre (mismo criterio que obtenerSugerenciaSecuencia de L4, aplicado
 * aqui de una vez para todo el lote en vez de fila a fila).
 * PORCENTAJE_AVANCE se fija a 0 (nada empezado todavia).
 *
 * Tras importar, cada fila de staging queda marcada con
 * ESTADO_IMPORTACION="Importado" y su ID_REAL, para trazabilidad y
 * para no reimportarla si se vuelve a ejecutar sobre la misma hoja.
 */

function leerFilasPendientesImportacion_(nombreHoja) {
  var hoja = SpreadsheetApp.getActive().getSheetByName(nombreHoja);

  if (!hoja) {
    throw new Error(
      'No existe la hoja ' + nombreHoja + '. Ejecuta primero instalarStagingImportacionMasiva.'
    );
  }

  var ultimaFila = hoja.getLastRow();
  var ultimaColumna = hoja.getLastColumn();

  if (ultimaFila < 2) return [];

  var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getValues()[0].map(function (c) {
    return String(c || '').trim();
  });

  var valores = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
  var filas = [];

  valores.forEach(function (fila, indice) {
    var objeto = {};

    cabeceras.forEach(function (cab, i) {
      objeto[cab] = fila[i];
    });

    objeto._fila = indice + 2;

    if (String(objeto.ID_TEMPORAL || '').trim() === '') return;
    if (String(objeto.ESTADO_IMPORTACION || '').trim() !== '') return;

    filas.push(objeto);
  });

  return filas;
}

function marcarFilaImportacionMasiva_(nombreHoja, numeroFila, idReal, idRealSecundario) {
  var hoja = SpreadsheetApp.getActive().getSheetByName(nombreHoja);
  var ultimaColumna = hoja.getLastColumn();

  var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getValues()[0].map(function (c) {
    return String(c || '').trim();
  });

  var colEstado = cabeceras.indexOf('ESTADO_IMPORTACION') + 1;
  var colIdReal = cabeceras.indexOf('ID_REAL') + 1;

  hoja.getRange(numeroFila, colEstado).setValue('Importado');
  hoja.getRange(numeroFila, colIdReal).setValue(idReal);

  if (idRealSecundario) {
    var colIdRealSecundario = cabeceras.indexOf('PROYECTO_PRODUCTO_ID_REAL') + 1;
    if (colIdRealSecundario > 0) {
      hoja.getRange(numeroFila, colIdRealSecundario).setValue(idRealSecundario);
    }
  }
}

function procesarImportacionMasiva_(confirmar) {
  var errores = [];

  var filasCampana = leerFilasPendientesImportacion_('STG_CAMPANA');
  var filasProyecto = leerFilasPendientesImportacion_('STG_PROYECTO');
  var filasProducto = leerFilasPendientesImportacion_('STG_PRODUCTO');
  var filasProceso = leerFilasPendientesImportacion_('STG_PROCESO');
  var filasTarea = leerFilasPendientesImportacion_('STG_TAREA');

  function validarObligatorios_(filas, hoja, campos) {
    filas.forEach(function (f) {
      campos.forEach(function (c) {
        if (f[c] === '' || f[c] === null || f[c] === undefined) {
          errores.push(hoja + ' fila ' + f._fila + ': falta el campo obligatorio ' + c);
        }
      });
    });
  }

  validarObligatorios_(filasCampana, 'STG_CAMPANA', ['NOMBRE', 'FECHA_INICIO_PLAN', 'FECHA_FIN_PLAN', 'ESTADO']);
  validarObligatorios_(filasProyecto, 'STG_PROYECTO', ['CAMPANA_TEMPORAL', 'NOMBRE', 'TIPO_PROYECTO', 'PRIORIDAD', 'ESTADO']);
  validarObligatorios_(filasProducto, 'STG_PRODUCTO', ['PROYECTO_TEMPORAL', 'CODIGO', 'NOMBRE', 'ORIGEN', 'UNIDAD', 'ESTADO']);
  validarObligatorios_(filasProceso, 'STG_PROCESO', ['PRODUCTO_TEMPORAL', 'NOMBRE', 'DURACION_PREVISTA_DIAS', 'ESTADO']);
  validarObligatorios_(filasTarea, 'STG_TAREA', ['PROCESO_TEMPORAL', 'NOMBRE', 'DURACION_PREVISTA_DIAS', 'ESTADO']);

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

  validarCatalogo_(filasCampana, 'STG_CAMPANA', 'ESTADO', 'CFG_ESTADO_CAMPANA');
  validarCatalogo_(filasProyecto, 'STG_PROYECTO', 'TIPO_PROYECTO', 'CFG_TIPO_PROYECTO');
  validarCatalogo_(filasProyecto, 'STG_PROYECTO', 'PRIORIDAD', 'CFG_PRIORIDAD');
  validarCatalogo_(filasProyecto, 'STG_PROYECTO', 'ESTADO', 'CFG_ESTADO_PROYECTO');
  validarCatalogo_(filasProducto, 'STG_PRODUCTO', 'ORIGEN', 'CFG_ORIGEN_PRODUCTO');
  validarCatalogo_(filasProducto, 'STG_PRODUCTO', 'UNIDAD', 'CFG_UNIDAD');
  validarCatalogo_(filasProducto, 'STG_PRODUCTO', 'PRIORIDAD', 'CFG_PRIORIDAD');
  validarCatalogo_(filasProducto, 'STG_PRODUCTO', 'ESTADO', 'CFG_ESTADO_PRODUCTO');
  validarCatalogo_(filasProceso, 'STG_PROCESO', 'ESTADO', 'CFG_ESTADO_PROCESO');
  validarCatalogo_(filasTarea, 'STG_TAREA', 'ESTADO', 'CFG_ESTADO_TAREA');

  function validarTemporalesUnicos_(filas, hoja) {
    var vistos = {};

    filas.forEach(function (f) {
      var id = String(f.ID_TEMPORAL || '').trim();
      if (vistos[id]) {
        errores.push(hoja + ' fila ' + f._fila + ': ID_TEMPORAL "' + id + '" duplicado en la misma hoja');
      }
      vistos[id] = true;
    });
  }

  validarTemporalesUnicos_(filasCampana, 'STG_CAMPANA');
  validarTemporalesUnicos_(filasProyecto, 'STG_PROYECTO');
  validarTemporalesUnicos_(filasProducto, 'STG_PRODUCTO');
  validarTemporalesUnicos_(filasProceso, 'STG_PROCESO');
  validarTemporalesUnicos_(filasTarea, 'STG_TAREA');

  function validarReferenciaPadre_(filas, hoja, campoPadre, filasPadre, entidadRealPadre) {
    filas.forEach(function (f) {
      var valorPadre = String(f[campoPadre] || '').trim();

      if (!valorPadre) return;

      var esTemporalDelLote = filasPadre.some(function (p) {
        return String(p.ID_TEMPORAL || '').trim() === valorPadre;
      });

      if (esTemporalDelLote) return;

      if (obtenerRegistroPorId(entidadRealPadre, valorPadre)) return;

      errores.push(
        hoja + ' fila ' + f._fila + ': ' + campoPadre + ' "' + valorPadre + '" no corresponde a ningún ID_TEMPORAL del lote ni a un ' + entidadRealPadre + ' real existente'
      );
    });
  }

  validarReferenciaPadre_(filasProyecto, 'STG_PROYECTO', 'CAMPANA_TEMPORAL', filasCampana, 'CAMPANA');
  validarReferenciaPadre_(filasProducto, 'STG_PRODUCTO', 'PROYECTO_TEMPORAL', filasProyecto, 'PROYECTO');
  validarReferenciaPadre_(filasProceso, 'STG_PROCESO', 'PRODUCTO_TEMPORAL', filasProducto, 'PRODUCTO');
  validarReferenciaPadre_(filasTarea, 'STG_TAREA', 'PROCESO_TEMPORAL', filasProceso, 'PROCESO');

  /*
   * Espejo del dry-run de la regla de coherencia ESTADO/fecha-real que
   * Repository_InsertarRegistro.js aplica a PROYECTO/PROCESO/TAREA (ver
   * conversación -- hallazgo real: sin esto, la fila reventaba a mitad
   * del commit -- después de que otras filas anteriores del mismo lote
   * YA se hubieran creado -- en vez de avisar en el resumen antes de
   * escribir nada). Estados "iniciales" varían por entidad (Borrador/
   * Planificado en Proyecto; Pendiente/Preparado en Proceso; Pendiente/
   * Preparada en Tarea), el resto de la regla es idéntica.
   */
  function validarCoherenciaFechaReal_(filas, hoja, estadosIniciales, estadoEnProceso, estadoCompletado, exigeDuracionReal) {
    filas.forEach(function (f) {
      var estado = f.ESTADO;
      var tieneInicio = f.FECHA_INICIO_REAL !== undefined && f.FECHA_INICIO_REAL !== null && String(f.FECHA_INICIO_REAL).trim() !== '';
      var tieneFin = f.FECHA_FIN_REAL !== undefined && f.FECHA_FIN_REAL !== null && String(f.FECHA_FIN_REAL).trim() !== '';
      var tieneDuracion = f.DURACION_REAL_DIAS !== undefined && f.DURACION_REAL_DIAS !== null && String(f.DURACION_REAL_DIAS).trim() !== '';

      if (estadosIniciales.indexOf(estado) !== -1 && tieneInicio) {
        errores.push(hoja + ' fila ' + f._fila + ': FECHA_INICIO_REAL no es compatible con ESTADO ' + estado);
        return;
      }
      if (estado === estadoEnProceso && !tieneInicio) {
        errores.push(hoja + ' fila ' + f._fila + ': ESTADO ' + estadoEnProceso + ' requiere FECHA_INICIO_REAL');
        return;
      }
      if (estado === estadoCompletado) {
        if (!tieneInicio || !tieneFin) {
          errores.push(hoja + ' fila ' + f._fila + ': ESTADO ' + estadoCompletado + ' requiere FECHA_INICIO_REAL y FECHA_FIN_REAL');
          return;
        }
        if (new Date(f.FECHA_FIN_REAL).getTime() < new Date(f.FECHA_INICIO_REAL).getTime()) {
          errores.push(hoja + ' fila ' + f._fila + ': FECHA_FIN_REAL no puede ser anterior a FECHA_INICIO_REAL');
          return;
        }
        if (exigeDuracionReal && !tieneDuracion) {
          errores.push(hoja + ' fila ' + f._fila + ': ESTADO ' + estadoCompletado + ' requiere DURACION_REAL_DIAS');
        }
      }
    });
  }

  validarCoherenciaFechaReal_(filasProyecto, 'STG_PROYECTO', ['Borrador', 'Planificado'], 'En proceso', 'Completado', false);
  validarCoherenciaFechaReal_(filasProceso, 'STG_PROCESO', ['Pendiente', 'Preparado'], 'En proceso', 'Completado', true);
  validarCoherenciaFechaReal_(filasTarea, 'STG_TAREA', ['Pendiente', 'Preparada'], 'En proceso', 'Terminada', true);

  var resumen = {
    campanas: filasCampana.length,
    proyectos: filasProyecto.length,
    productos: filasProducto.length,
    procesos: filasProceso.length,
    tareas: filasTarea.length
  };

  if (errores.length > 0 || !confirmar) {
    return { ok: errores.length === 0, errores: errores, resumen: resumen };
  }

  var correlationId = Utilities.getUuid();

  var mapaCampana = {};
  var mapaProyecto = {};
  var mapaProducto = {};
  var mapaProyectoProducto = {};
  var mapaProceso = {};

  filasCampana.forEach(function (f) {
    var resultado = insertarRegistroTransaccional('CAMPANA', {
      NOMBRE: f.NOMBRE,
      FECHA_INICIO_PLAN: f.FECHA_INICIO_PLAN,
      FECHA_FIN_PLAN: f.FECHA_FIN_PLAN,
      ESTADO: f.ESTADO
    }, {origen: 'ADMIN', correlationId: correlationId});

    mapaCampana[String(f.ID_TEMPORAL).trim()] = resultado.id;
    marcarFilaImportacionMasiva_('STG_CAMPANA', f._fila, resultado.id);
  });

  filasProyecto.forEach(function (f) {
    var campanaId = mapaCampana[String(f.CAMPANA_TEMPORAL).trim()] || String(f.CAMPANA_TEMPORAL).trim();

    var resultado = insertarRegistroTransaccional('PROYECTO', {
      CAMPANA_ID: campanaId,
      NOMBRE: f.NOMBRE,
      TIPO_PROYECTO: f.TIPO_PROYECTO,
      PRIORIDAD: f.PRIORIDAD,
      ESTADO: f.ESTADO,
      FECHA_INICIO_REAL: f.FECHA_INICIO_REAL || '',
      FECHA_FIN_REAL: f.FECHA_FIN_REAL || ''
    }, {origen: 'ADMIN', correlationId: correlationId});

    mapaProyecto[String(f.ID_TEMPORAL).trim()] = resultado.id;
    marcarFilaImportacionMasiva_('STG_PROYECTO', f._fila, resultado.id);
  });

  filasProducto.forEach(function (f) {
    var proyectoId = mapaProyecto[String(f.PROYECTO_TEMPORAL).trim()] || String(f.PROYECTO_TEMPORAL).trim();
    var cantidadPrevista = Number(f.CANTIDAD_PREVISTA) || 1;

    var resultadoProducto = insertarRegistroTransaccional('PRODUCTO', {
      CODIGO: f.CODIGO,
      NOMBRE: f.NOMBRE,
      ORIGEN: f.ORIGEN,
      UNIDAD: f.UNIDAD,
      CANTIDAD_PREVISTA: cantidadPrevista,
      PRIORIDAD: f.PRIORIDAD,
      ESTADO: f.ESTADO
    }, {origen: 'ADMIN', correlationId: correlationId});

    var resultadoProyectoProducto = insertarRegistroTransaccional('PROYECTO_PRODUCTO', {
      PROYECTO_ID: proyectoId,
      PRODUCTO_ID: resultadoProducto.id,
      CANTIDAD_ASIGNADA: cantidadPrevista,
      PRIORIDAD: f.PRIORIDAD,
      ESTADO: 'Activa'
    }, {origen: 'ADMIN', correlationId: correlationId});

    mapaProducto[String(f.ID_TEMPORAL).trim()] = resultadoProducto.id;
    mapaProyectoProducto[String(f.ID_TEMPORAL).trim()] = resultadoProyectoProducto.id;
    marcarFilaImportacionMasiva_('STG_PRODUCTO', f._fila, resultadoProducto.id, resultadoProyectoProducto.id);
  });

  var gruposProceso = {};

  filasProceso.forEach(function (f) {
    var clave = String(f.PRODUCTO_TEMPORAL).trim();
    if (!gruposProceso[clave]) gruposProceso[clave] = [];
    gruposProceso[clave].push(f);
  });

  Object.keys(gruposProceso).forEach(function (clave) {
    var productoId = mapaProducto[clave] || clave;
    var proyectoProductoId = mapaProyectoProducto[clave] || '';
    var predecesorId = '';

    gruposProceso[clave].forEach(function (f, indice) {
      var resultado = insertarRegistroTransaccional('PROCESO', {
        PRODUCTO_ID: productoId,
        PROYECTO_PRODUCTO_ID: proyectoProductoId,
        NOMBRE: f.NOMBRE,
        ORDEN_SECUENCIA: indice + 1,
        PROCESO_PREDECESOR_ID: predecesorId,
        DURACION_PREVISTA_DIAS: f.DURACION_PREVISTA_DIAS,
        PORCENTAJE_AVANCE: 0,
        ESTADO: f.ESTADO,
        FECHA_INICIO_REAL: f.FECHA_INICIO_REAL || '',
        FECHA_FIN_REAL: f.FECHA_FIN_REAL || '',
        DURACION_REAL_DIAS: f.DURACION_REAL_DIAS || ''
      }, {origen: 'ADMIN', correlationId: correlationId});

      mapaProceso[String(f.ID_TEMPORAL).trim()] = resultado.id;
      predecesorId = resultado.id;
      marcarFilaImportacionMasiva_('STG_PROCESO', f._fila, resultado.id);
    });
  });

  var gruposTarea = {};

  filasTarea.forEach(function (f) {
    var clave = String(f.PROCESO_TEMPORAL).trim();
    if (!gruposTarea[clave]) gruposTarea[clave] = [];
    gruposTarea[clave].push(f);
  });

  Object.keys(gruposTarea).forEach(function (clave) {
    var procesoId = mapaProceso[clave] || clave;
    var predecesoraId = '';

    gruposTarea[clave].forEach(function (f, indice) {
      var resultado = insertarRegistroTransaccional('TAREA', {
        PROCESO_ID: procesoId,
        NOMBRE: f.NOMBRE,
        ORDEN_SECUENCIA: indice + 1,
        TAREA_PREDECESORA_ID: predecesoraId,
        DURACION_PREVISTA_DIAS: f.DURACION_PREVISTA_DIAS,
        PORCENTAJE_AVANCE: 0,
        ESTADO: f.ESTADO,
        FECHA_INICIO_REAL: f.FECHA_INICIO_REAL || '',
        FECHA_FIN_REAL: f.FECHA_FIN_REAL || '',
        DURACION_REAL_DIAS: f.DURACION_REAL_DIAS || ''
      }, {origen: 'ADMIN', correlationId: correlationId});

      predecesoraId = resultado.id;
      marcarFilaImportacionMasiva_('STG_TAREA', f._fila, resultado.id);
    });
  });

  return { ok: true, errores: [], resumen: resumen };
}

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
    }, { origen: 'ADMIN', correlationId: correlationId });

    mapaRecurso[String(f.ID_TEMPORAL).trim()] = resultado.id;
    marcarFilaImportacionMasiva_('STG_RECURSO', f._fila, resultado.id);
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
    }, { origen: 'ADMIN', correlationId: correlationId });

    mapaPersona[String(f.ID_TEMPORAL).trim()] = resultado.id;
    marcarFilaImportacionMasiva_('STG_PERSONA', f._fila, resultado.id);
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
    }, { origen: 'ADMIN', correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_EQUIPO_MIEMBRO', f._fila, resultado.id);
  });

  return { ok: true, errores: [], resumen: resumen };
}

/*
 * Fase N10 (ver conversación): a diferencia de validarReferenciaPadre_/
 * validarReferenciaOpcional_ (que solo miran el lote pendiente actual),
 * las asignaciones normalmente se importan en una pasada SEPARADA y
 * posterior a la creación de la tarea/persona/recurso -- para entonces
 * esa fila STG_* ya está marcada "Importado" con ID_REAL relleno, así
 * que ya no aparece en leerFilasPendientesImportacion_. Se busca el
 * ID_TEMPORAL en TODAS las filas de la hoja de origen (importadas o no)
 * y se devuelve su ID_REAL si ya lo tiene; si el ID_TEMPORAL no
 * aparece en absoluto, se asume que el valor ya es un ID real directo.
 */
function resolverReferenciaStaging_(nombreHojaOrigen, valorReferencia) {
  var valor = String(valorReferencia || '').trim();
  if (!valor) return '';

  var hoja = SpreadsheetApp.getActive().getSheetByName(nombreHojaOrigen);
  if (!hoja) return valor;

  var ultimaFila = hoja.getLastRow();
  var ultimaColumna = hoja.getLastColumn();
  if (ultimaFila < 2) return valor;

  var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getValues()[0].map(function (c) {
    return String(c || '').trim();
  });
  var colTemporal = cabeceras.indexOf('ID_TEMPORAL');
  var colIdReal = cabeceras.indexOf('ID_REAL');
  if (colTemporal === -1 || colIdReal === -1) return valor;

  var valores = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
  for (var i = 0; i < valores.length; i++) {
    if (String(valores[i][colTemporal] || '').trim() === valor) {
      var idReal = String(valores[i][colIdReal] || '').trim();
      return idReal || valor;
    }
  }

  return valor;
}

function validarReferenciaStaging_(filas, hoja, campo, hojaOrigenTemporal, entidadReal, errores) {
  filas.forEach(function (f) {
    var valorOriginal = String(f[campo] || '').trim();
    if (!valorOriginal) return;
    var resuelto = resolverReferenciaStaging_(hojaOrigenTemporal, valorOriginal);
    if (!obtenerRegistroPorId(entidadReal, resuelto)) {
      errores.push(
        hoja + ' fila ' + f._fila + ': ' + campo + ' "' + valorOriginal + '" no corresponde a ningún ' +
          entidadReal + ' real existente ni a un ID_TEMPORAL ya importado de ' + hojaOrigenTemporal
      );
    }
  });
}

/*
 * Asignaciones de Tarea (Responsable/Recurso): pensado para ejecutarse
 * DESPUÉS de importar la campaña y/o recursos/personas -- TAREA_TEMPORAL/
 * PERSONA_TEMPORAL/RECURSO_TEMPORAL pueden seguir usando las mismas
 * claves cortas del lote original (ver resolverReferenciaStaging_) en
 * vez de obligar a conocer los IDs reales generados.
 */
function procesarImportacionAsignaciones_(confirmar) {
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
    if (!isFinite(pct) || pct < 0 || pct > 100) {
      errores.push('STG_TAREA_RESPONSABLE fila ' + f._fila + ': PORCENTAJE_DEDICACION debe ser un número entre 0 y 100');
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
    }, { origen: 'ADMIN', correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_TAREA_RESPONSABLE', f._fila, resultado.id);
  });

  filasRecurso.forEach(function (f) {
    var resultado = insertarRegistroTransaccional('TAREA_RECURSO', {
      TAREA_ID: resolverReferenciaStaging_('STG_TAREA', f.TAREA_TEMPORAL),
      RECURSO_ID: resolverReferenciaStaging_('STG_RECURSO', f.RECURSO_TEMPORAL),
      TIPO_USO: f.TIPO_USO,
      ESTADO: f.ESTADO
    }, { origen: 'ADMIN', correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_TAREA_RECURSO', f._fila, resultado.id);
  });

  return { ok: true, errores: [], resumen: resumen };
}

function abrirImportacionAsignaciones() {
  var ui = SpreadsheetApp.getUi();
  var previsualizacion;

  try {
    previsualizacion = procesarImportacionAsignaciones_(false);
  } catch (e) {
    ui.alert('Error al validar', e.message, ui.ButtonSet.OK);
    return;
  }

  if (previsualizacion.errores.length > 0) {
    var listaErrores = previsualizacion.errores.slice(0, 20).join('\n');
    var extra = previsualizacion.errores.length > 20
      ? '\n... y ' + (previsualizacion.errores.length - 20) + ' más.'
      : '';
    ui.alert('No se puede importar: hay errores', listaErrores + extra, ui.ButtonSet.OK);
    return;
  }

  var r = previsualizacion.resumen;
  var total = r.responsables + r.recursos;

  if (total === 0) {
    ui.alert(
      'Nada que importar',
      'No hay filas pendientes en STG_TAREA_RESPONSABLE/STG_TAREA_RECURSO (o ya están todas importadas).',
      ui.ButtonSet.OK
    );
    return;
  }

  var mensaje =
    'Se creará:\n' +
    '- ' + r.responsables + ' asignación(es) de responsable\n' +
    '- ' + r.recursos + ' asignación(es) de recurso\n\n' +
    '¿Confirmar la importación?';

  var confirmacion = ui.alert('Confirmar importación de asignaciones', mensaje, ui.ButtonSet.YES_NO);
  if (confirmacion !== ui.Button.YES) return;

  try {
    var resultado = procesarImportacionAsignaciones_(true);
    var r2 = resultado.resumen;
    ui.alert(
      'Importación completada',
      'Se crearon ' + r2.responsables + ' asignación(es) de responsable y ' + r2.recursos + ' asignación(es) de recurso.',
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('Error al importar', e.message, ui.ButtonSet.OK);
  }
}

function abrirImportacionMasivaRecursosPersonas() {
  var ui = SpreadsheetApp.getUi();
  var previsualizacion;

  try {
    previsualizacion = procesarImportacionRecursosPersonas_(false);
  } catch (e) {
    ui.alert('Error al validar', e.message, ui.ButtonSet.OK);
    return;
  }

  if (previsualizacion.errores.length > 0) {
    var listaErrores = previsualizacion.errores.slice(0, 20).join('\n');
    var extra = previsualizacion.errores.length > 20
      ? '\n... y ' + (previsualizacion.errores.length - 20) + ' más.'
      : '';

    ui.alert('No se puede importar: hay errores', listaErrores + extra, ui.ButtonSet.OK);
    return;
  }

  var r = previsualizacion.resumen;
  var total = r.recursos + r.personas + r.equipoMiembros;

  if (total === 0) {
    ui.alert(
      'Nada que importar',
      'No hay filas pendientes en STG_RECURSO/STG_PERSONA/STG_EQUIPO_MIEMBRO (o ya están todas importadas).',
      ui.ButtonSet.OK
    );
    return;
  }

  var mensaje =
    'Se creará:\n' +
    '- ' + r.recursos + ' recurso(s)\n' +
    '- ' + r.personas + ' persona(s)/equipo(s)\n' +
    '- ' + r.equipoMiembros + ' relación(es) equipo-miembro\n\n' +
    'UBICACION_ID y COORDINADOR_ID (si se indicaron) se completan en una segunda pasada, una vez creados todos los registros.\n\n' +
    '¿Confirmar la importación?';

  var confirmacion = ui.alert('Confirmar importación de Recursos/Personas', mensaje, ui.ButtonSet.YES_NO);

  if (confirmacion !== ui.Button.YES) return;

  try {
    var resultado = procesarImportacionRecursosPersonas_(true);
    var r2 = resultado.resumen;

    ui.alert(
      'Importación completada',
      'Se crearon ' + r2.recursos + ' recurso(s), ' + r2.personas + ' persona(s)/equipo(s) y ' + r2.equipoMiembros + ' relación(es) equipo-miembro.',
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('Error al importar', e.message, ui.ButtonSet.OK);
  }
}

function abrirImportacionMasiva() {
  var ui = SpreadsheetApp.getUi();
  var previsualizacion;

  try {
    previsualizacion = procesarImportacionMasiva_(false);
  } catch (e) {
    ui.alert('Error al validar', e.message, ui.ButtonSet.OK);
    return;
  }

  if (previsualizacion.errores.length > 0) {
    var listaErrores = previsualizacion.errores.slice(0, 20).join('\n');
    var extra = previsualizacion.errores.length > 20
      ? '\n... y ' + (previsualizacion.errores.length - 20) + ' más.'
      : '';

    ui.alert(
      'No se puede importar: hay errores',
      listaErrores + extra,
      ui.ButtonSet.OK
    );
    return;
  }

  var r = previsualizacion.resumen;
  var total = r.campanas + r.proyectos + r.productos + r.procesos + r.tareas;

  if (total === 0) {
    ui.alert(
      'Nada que importar',
      'No hay filas pendientes en las hojas STG_* (o ya están todas importadas).',
      ui.ButtonSet.OK
    );
    return;
  }

  var mensaje =
    'Se creará:\n' +
    '- ' + r.campanas + ' campaña(s)\n' +
    '- ' + r.proyectos + ' proyecto(s)\n' +
    '- ' + r.productos + ' producto(s) (+ su relación proyecto-producto)\n' +
    '- ' + r.procesos + ' proceso(s)\n' +
    '- ' + r.tareas + ' tarea(s)\n\n' +
    'El orden de secuencia y el predecesor de procesos/tareas se asignan automáticamente según el orden de las filas.\n\n' +
    '¿Confirmar la importación?';

  var confirmacion = ui.alert('Confirmar importación masiva', mensaje, ui.ButtonSet.YES_NO);

  if (confirmacion !== ui.Button.YES) return;

  try {
    var resultado = procesarImportacionMasiva_(true);
    var r2 = resultado.resumen;

    ui.alert(
      'Importación completada',
      'Se crearon ' + r2.campanas + ' campaña(s), ' + r2.proyectos + ' proyecto(s), ' +
        r2.productos + ' producto(s), ' + r2.procesos + ' proceso(s) y ' + r2.tareas + ' tarea(s).',
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('Error al importar', e.message, ui.ButtonSet.OK);
  }
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
    }, { origen: 'ADMIN', correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_DECISION', f._fila, resultado.id);
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
    }, datosNivel), { origen: 'ADMIN', correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_INCIDENCIA', f._fila, resultado.id);
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
    }, { origen: 'ADMIN', correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_DOCUMENTO', f._fila, resultado.id);
  });

  return { ok: true, errores: [], resumen: resumen };
}

function abrirImportacionSeguimiento() {
  var ui = SpreadsheetApp.getUi();
  var previsualizacion;

  try {
    previsualizacion = procesarImportacionSeguimiento_(false);
  } catch (e) {
    ui.alert('Error al validar', e.message, ui.ButtonSet.OK);
    return;
  }

  if (previsualizacion.errores.length > 0) {
    var listaErrores = previsualizacion.errores.slice(0, 20).join('\n');
    var extra = previsualizacion.errores.length > 20
      ? '\n... y ' + (previsualizacion.errores.length - 20) + ' más.'
      : '';
    ui.alert('No se puede importar: hay errores', listaErrores + extra, ui.ButtonSet.OK);
    return;
  }

  var r = previsualizacion.resumen;
  var total = r.decisiones + r.incidencias + r.documentos;

  if (total === 0) {
    ui.alert(
      'Nada que importar',
      'No hay filas pendientes en STG_DECISION/STG_INCIDENCIA/STG_DOCUMENTO (o ya están todas importadas).',
      ui.ButtonSet.OK
    );
    return;
  }

  var mensaje =
    'Se creará:\n' +
    '- ' + r.decisiones + ' decisión(es)\n' +
    '- ' + r.incidencias + ' incidencia(s)\n' +
    '- ' + r.documentos + ' documento(s)\n\n' +
    '¿Confirmar la importación?';

  var confirmacion = ui.alert('Confirmar importación de Decisiones/Incidencias/Documentos', mensaje, ui.ButtonSet.YES_NO);
  if (confirmacion !== ui.Button.YES) return;

  try {
    var resultado = procesarImportacionSeguimiento_(true);
    var r2 = resultado.resumen;
    ui.alert(
      'Importación completada',
      'Se crearon ' + r2.decisiones + ' decisión(es), ' + r2.incidencias + ' incidencia(s) y ' + r2.documentos + ' documento(s).',
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('Error al importar', e.message, ui.ButtonSet.OK);
  }
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
    }, { origen: 'ADMIN', correlationId: correlationId });

    marcarFilaImportacionMasiva_('STG_HORARIO', f._fila, resultado.id);
  });

  return { ok: true, errores: [], resumen: resumen };
}

function abrirImportacionHorario() {
  var ui = SpreadsheetApp.getUi();
  var previsualizacion;

  try {
    previsualizacion = procesarImportacionHorario_(false);
  } catch (e) {
    ui.alert('Error al validar', e.message, ui.ButtonSet.OK);
    return;
  }

  if (previsualizacion.errores.length > 0) {
    var listaErrores = previsualizacion.errores.slice(0, 20).join('\n');
    var extra = previsualizacion.errores.length > 20
      ? '\n... y ' + (previsualizacion.errores.length - 20) + ' más.'
      : '';
    ui.alert('No se puede importar: hay errores', listaErrores + extra, ui.ButtonSet.OK);
    return;
  }

  var r = previsualizacion.resumen;

  if (r.horarios === 0) {
    ui.alert('Nada que importar', 'No hay filas pendientes en STG_HORARIO (o ya están todas importadas).', ui.ButtonSet.OK);
    return;
  }

  var confirmacion = ui.alert(
    'Confirmar importación de Horarios',
    'Se creará(n) ' + r.horarios + ' franja(s) de horario.\n\n¿Confirmar la importación?',
    ui.ButtonSet.YES_NO
  );
  if (confirmacion !== ui.Button.YES) return;

  try {
    var resultado = procesarImportacionHorario_(true);
    ui.alert('Importación completada', 'Se crearon ' + resultado.resumen.horarios + ' franja(s) de horario.', ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Error al importar', e.message, ui.ButtonSet.OK);
  }
}

/*
 * Fase N13 (ver conversación -- "que al validar el botón cambie de
 * color... separar Validar de Importar"): las funciones abrirImportacionXxx
 * hacen la validación Y la confirmación DENTRO de diálogos nativos
 * (ui.alert), así que el HTML del diálogo nunca ve el resultado del
 * dry-run y no puede pintar nada en el propio botón. Estas 10 funciones
 * exponen procesarImportacionXxx_(false/true) directamente al cliente,
 * sin ningún diálogo nativo -- el HTML decide cómo mostrar el resultado.
 * Las abrirImportacionXxx originales se dejan tal cual (las sigue usando
 * el menú de Sheets para quien prefiere el flujo clásico).
 */
function validarImportacionMasiva() { return procesarImportacionMasiva_(false); }
function confirmarImportacionMasiva() { return procesarImportacionMasiva_(true); }
function validarImportacionRecursosPersonas() { return procesarImportacionRecursosPersonas_(false); }
function confirmarImportacionRecursosPersonas() { return procesarImportacionRecursosPersonas_(true); }
function validarImportacionAsignaciones() { return procesarImportacionAsignaciones_(false); }
function confirmarImportacionAsignaciones() { return procesarImportacionAsignaciones_(true); }
function validarImportacionSeguimiento() { return procesarImportacionSeguimiento_(false); }
function confirmarImportacionSeguimiento() { return procesarImportacionSeguimiento_(true); }
function validarImportacionHorario() { return procesarImportacionHorario_(false); }
function confirmarImportacionHorario() { return procesarImportacionHorario_(true); }

/*
 * Panel de estado por hoja STG_* (ver conversación -- "así sabes de un
 * vistazo qué te falta sin acordarte de memoria"): para cada hoja
 * definida, cuántas filas están pendientes de importar y cuántas ya se
 * importaron. Distingue por ID_TEMPORAL vacío para no contar filas
 * totalmente en blanco que a veces quedan tras editar a mano.
 */
function obtenerEstadoHojasStaging() {
  var ss = SpreadsheetApp.getActive();

  return DEFINICIONES_STAGING_IMPORTACION_MASIVA_.map(function (definicion) {
    var hoja = ss.getSheetByName(definicion.hoja);
    if (!hoja) return { hoja: definicion.hoja, existe: false, pendientes: 0, importadas: 0 };

    var ultimaFila = hoja.getLastRow();
    if (ultimaFila < 2) return { hoja: definicion.hoja, existe: true, pendientes: 0, importadas: 0 };

    var ultimaColumna = hoja.getLastColumn();
    var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getValues()[0].map(function (c) {
      return String(c || '').trim();
    });
    var colIdTemporal = cabeceras.indexOf('ID_TEMPORAL');
    var colEstadoImportacion = cabeceras.indexOf('ESTADO_IMPORTACION');
    if (colIdTemporal === -1 || colEstadoImportacion === -1) {
      return { hoja: definicion.hoja, existe: true, pendientes: 0, importadas: 0 };
    }

    var valores = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
    var pendientes = 0;
    var importadas = 0;

    valores.forEach(function (fila) {
      if (String(fila[colIdTemporal] || '').trim() === '') return;
      if (String(fila[colEstadoImportacion] || '').trim() === 'Importado') importadas++;
      else pendientes++;
    });

    return { hoja: definicion.hoja, existe: true, pendientes: pendientes, importadas: importadas };
  });
}

/*
 * Punto de entrada desde el Mapa del sheet (ver conversación --
 * "importación masiva ... cheap now: surface the existing staging-
 * sheet importer as una tarjeta con un pequeño diálogo explicando el
 * flujo STG_*"). No sustituye los items de menú ya existentes
 * (Catálogos y administración), solo da un punto de entrada visual con
 * las 3 acciones del flujo en orden: preparar hojas, importar
 * campaña→tarea, importar recursos/personas.
 */
function abrirImportacionMasivaInicio() {
  var html = HtmlService.createTemplateFromFile('ImportacionMasivaInicio')
    .evaluate()
    .setWidth(420)
    .setHeight(480);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Importación masiva');
}
