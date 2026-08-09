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
      ESTADO: f.ESTADO
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
        ESTADO: f.ESTADO
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
        ESTADO: f.ESTADO
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
