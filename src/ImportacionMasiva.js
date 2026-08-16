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

/*
 * Rendimiento (ver conversación -- hallazgo real en prueba de punta a
 * punta: un lote con ~90 filas huérfanas tardó más de 90 segundos en
 * validar): dos causas, dos cachés de alcance "una sola ejecución".
 *
 * 1) validarReferenciaPadre_/resolverEntidadPoliformica_ llaman a
 *    obtenerRegistroPorId/listarRegistros (Repository.js) por cada fila
 *    -- ya existe un caché para esto (CacheLecturaService.js) pero solo
 *    se activa entre cacheLecturaIniciarContexto_()/Finalizar(), y el
 *    importador nunca lo abría, así que cada fila releía la hoja de
 *    entidad real entera desde cero.
 * 2) resolverReferenciaStaging_ releía la hoja STG_* de origen entera
 *    en cada llamada -- no había ningún caché para esto. Se cachea aquí
 *    mismo, por nombre de hoja, reiniciado al principio de cada
 *    ejecución (nunca se lee y se escribe la misma hoja STG_* de origen
 *    dentro de una misma ejecución -- cada grupo solo marca sus propias
 *    hojas de destino -- así que cachear toda la ejecución es seguro).
 */
var CACHE_RESOLUCION_STAGING_ = {};

function reiniciarCacheImportacionMasiva_() {
  cacheLecturaIniciarContexto_();
  CACHE_RESOLUCION_STAGING_ = {};
}

/*
 * Agrupa errores repetidos con la misma forma (mismo mensaje salvo el
 * número de fila y el valor concreto) en una sola línea cuando hay más
 * de `umbral` -- hallazgo real: 90 filas huérfanas por la misma causa
 * (falta la hoja padre) generaban 90 líneas de error idénticas salvo el
 * número de fila, un muro de texto inútil para diagnosticar la causa
 * real. Por debajo del umbral se devuelven tal cual, sin agrupar --
 * unos pocos errores distintos son más claros uno a uno.
 */
function agruparErroresRepetidos_(errores, umbral) {
  umbral = umbral || 5;
  if (errores.length <= umbral) return errores;

  var grupos = {};
  var orden = [];

  errores.forEach(function (mensaje) {
    var clave = mensaje.replace(/fila \d+/, 'fila #').replace(/"[^"]*"/, '"…"');
    if (!grupos[clave]) { grupos[clave] = []; orden.push(clave); }
    grupos[clave].push(mensaje);
  });

  var resultado = [];
  orden.forEach(function (clave) {
    var lista = grupos[clave];
    if (lista.length <= umbral) {
      resultado = resultado.concat(lista);
    } else {
      resultado.push(
        lista.length + ' filas con el mismo problema (revisa si falta importar la hoja padre correspondiente): ' + lista[0]
      );
    }
  });

  return resultado;
}

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

function marcarFilaImportacionMasiva_(nombreHoja, numeroFila, idReal, idRealSecundario, correlationId) {
  var hoja = SpreadsheetApp.getActive().getSheetByName(nombreHoja);
  var ultimaColumna = hoja.getLastColumn();

  var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getValues()[0].map(function (c) {
    return String(c || '').trim();
  });

  var colEstado = cabeceras.indexOf('ESTADO_IMPORTACION') + 1;
  var colIdReal = cabeceras.indexOf('ID_REAL') + 1;
  var colIdTemporal = cabeceras.indexOf('ID_TEMPORAL') + 1;

  hoja.getRange(numeroFila, colEstado).setValue('Importado');
  hoja.getRange(numeroFila, colIdReal).setValue(idReal);

  if (idRealSecundario) {
    var colIdRealSecundario = cabeceras.indexOf('PROYECTO_PRODUCTO_ID_REAL') + 1;
    if (colIdRealSecundario > 0) {
      hoja.getRange(numeroFila, colIdRealSecundario).setValue(idRealSecundario);
    }
  }

  /*
   * Registra el par ID_TEMPORAL->ID_REAL en 93_MAPEO_IDS_TEMPORALES (ver
   * conversación -- fricción real: un "vaciado total" de las hojas STG_*
   * destruía la única copia de este mapeo, que hasta ahora vivía solo en
   * las propias columnas ID_TEMPORAL/ID_REAL de la fila STG_* de origen).
   * Best-effort: si la hoja de mapeo aún no existe (cliente sin
   * regenerar su instalación desde este cambio), no bloquea la
   * importación -- obtenerMapaResolucionStaging_ sigue funcionando con
   * el fallback de releer la hoja STG_* de origen, igual que antes.
   */
  if (colIdTemporal > 0) {
    var idTemporal = hoja.getRange(numeroFila, colIdTemporal).getValue();
    var hojaMapeo = SpreadsheetApp.getActive().getSheetByName('93_MAPEO_IDS_TEMPORALES');
    if (hojaMapeo) {
      hojaMapeo.appendRow([String(idTemporal || '').trim(), nombreHoja, idReal, correlationId || '', new Date()]);
    }
  }
}

function procesarImportacionMasiva_(confirmar) {
  reiniciarCacheImportacionMasiva_();
  try {
    var resultado = ejecutarImportacionMasiva_(confirmar);
    resultado.errores = agruparErroresRepetidos_(resultado.errores);
    return resultado;
  } finally {
    cacheLecturaFinalizarContexto_();
  }
}

function ejecutarImportacionMasiva_(confirmar) {
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

  /*
   * Estas dos comprobaciones ya existían en el commit real
   * (Repository_InsertarRegistro.js) pero no en este dry-run, así que
   * "Validar" podía dar verde y "Importar" fallar a mitad de lote sin
   * rollback (ver conversación -- prueba de punta a punta). Se replican
   * aquí para que el dry-run sea un espejo fiel del commit.
   */
  function validarDuracionPositiva_(filas, hoja) {
    filas.forEach(function (f) {
      if (f.DURACION_PREVISTA_DIAS === '' || f.DURACION_PREVISTA_DIAS === null || f.DURACION_PREVISTA_DIAS === undefined) return;
      var duracion = Number(f.DURACION_PREVISTA_DIAS);
      if (!isFinite(duracion) || duracion <= 0) {
        errores.push(hoja + ' fila ' + f._fila + ': DURACION_PREVISTA_DIAS debe ser un número mayor que 0');
      }
    });
  }

  validarDuracionPositiva_(filasProceso, 'STG_PROCESO');
  validarDuracionPositiva_(filasTarea, 'STG_TAREA');

  function validarCodigoProductoUnico_(filas) {
    var codigosExistentes = {};
    var hojaProductos = SpreadsheetApp.getActive().getSheetByName('03_PRODUCTOS');

    if (hojaProductos) {
      var ultimaFilaProductos = hojaProductos.getLastRow();
      if (ultimaFilaProductos >= 2) {
        var cabecerasProductos = hojaProductos.getRange(1, 1, 1, hojaProductos.getLastColumn()).getValues()[0];
        var indiceCodigo = cabecerasProductos.indexOf('CODIGO');
        if (indiceCodigo !== -1) {
          hojaProductos.getRange(2, indiceCodigo + 1, ultimaFilaProductos - 1, 1).getDisplayValues().forEach(function (fila) {
            var codigo = String(fila[0] || '').trim().toUpperCase();
            if (codigo) codigosExistentes[codigo] = true;
          });
        }
      }
    }

    var codigosEnLote = {};
    filas.forEach(function (f) {
      var codigo = String(f.CODIGO || '').trim().toUpperCase();
      if (!codigo) return;

      if (codigosExistentes[codigo]) {
        errores.push('STG_PRODUCTO fila ' + f._fila + ': CODIGO "' + f.CODIGO + '" ya existe en un producto real existente');
      } else if (codigosEnLote[codigo]) {
        errores.push('STG_PRODUCTO fila ' + f._fila + ': CODIGO "' + f.CODIGO + '" duplicado en el mismo lote');
      }
      codigosEnLote[codigo] = true;
    });
  }

  validarCodigoProductoUnico_(filasProducto);

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
    }, {origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId});

    mapaCampana[String(f.ID_TEMPORAL).trim()] = resultado.id;
    marcarFilaImportacionMasiva_('STG_CAMPANA', f._fila, resultado.id, undefined, correlationId);
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
    }, {origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId});

    mapaProyecto[String(f.ID_TEMPORAL).trim()] = resultado.id;
    marcarFilaImportacionMasiva_('STG_PROYECTO', f._fila, resultado.id, undefined, correlationId);
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
    }, {origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId});

    var resultadoProyectoProducto = insertarRegistroTransaccional('PROYECTO_PRODUCTO', {
      PROYECTO_ID: proyectoId,
      PRODUCTO_ID: resultadoProducto.id,
      CANTIDAD_ASIGNADA: cantidadPrevista,
      PRIORIDAD: f.PRIORIDAD,
      ESTADO: 'Activa'
    }, {origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId});

    mapaProducto[String(f.ID_TEMPORAL).trim()] = resultadoProducto.id;
    mapaProyectoProducto[String(f.ID_TEMPORAL).trim()] = resultadoProyectoProducto.id;
    marcarFilaImportacionMasiva_('STG_PRODUCTO', f._fila, resultadoProducto.id, resultadoProyectoProducto.id, correlationId);
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
      }, {origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId});

      mapaProceso[String(f.ID_TEMPORAL).trim()] = resultado.id;
      predecesorId = resultado.id;
      marcarFilaImportacionMasiva_('STG_PROCESO', f._fila, resultado.id, undefined, correlationId);
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
      }, {origen: 'ADMIN', origenImportacionMasiva: true, correlationId: correlationId});

      predecesoraId = resultado.id;
      marcarFilaImportacionMasiva_('STG_TAREA', f._fila, resultado.id, undefined, correlationId);
    });
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

  var mapa = obtenerMapaResolucionStaging_(nombreHojaOrigen);
  return Object.prototype.hasOwnProperty.call(mapa, valor) ? mapa[valor] : valor;
}

/*
 * Construye ID_TEMPORAL->ID_REAL de una hoja STG_* una sola vez por
 * ejecución (ver CACHE_RESOLUCION_STAGING_ más arriba). Mismo criterio
 * de "no encontrado" que la versión anterior: si la fila no está en el
 * mapa, resolverReferenciaStaging_ devuelve el valor tal cual (puede
 * ser ya un ID real).
 *
 * Fuente primaria: 93_MAPEO_IDS_TEMPORALES (ver conversación -- fricción
 * real: un "vaciado total" de las hojas STG_* destruía el mapeo para
 * cualquier lote futuro, porque hasta ahora la única copia vivía en las
 * columnas ID_TEMPORAL/ID_REAL de la propia fila STG_* de origen). Esa
 * hoja sobrevive a cualquier vaciado de STG_* porque no está en
 * DEFINICIONES_STAGING_IMPORTACION_MASIVA_.
 *
 * Fallback: relectura de la hoja STG_* de origen (comportamiento
 * anterior a este cambio), para (a) clientes con lotes importados antes
 * de que existiera 93_MAPEO_IDS_TEMPORALES, y (b) por si esa hoja
 * todavía no se ha creado en este cliente (instalación antigua sin
 * regenerar). El mapeo nunca se sobrescribe: si un ID_TEMPORAL ya
 * resolvió desde 93_MAPEO_IDS_TEMPORALES, la relectura no lo toca.
 */
function obtenerMapaResolucionStaging_(nombreHojaOrigen) {
  if (Object.prototype.hasOwnProperty.call(CACHE_RESOLUCION_STAGING_, nombreHojaOrigen)) {
    return CACHE_RESOLUCION_STAGING_[nombreHojaOrigen];
  }

  var mapa = {};
  var ss = SpreadsheetApp.getActive();

  var hojaMapeo = ss.getSheetByName('93_MAPEO_IDS_TEMPORALES');
  if (hojaMapeo) {
    var ultimaFilaMapeo = hojaMapeo.getLastRow();
    if (ultimaFilaMapeo >= 2) {
      var cabecerasMapeo = hojaMapeo.getRange(1, 1, 1, hojaMapeo.getLastColumn()).getValues()[0].map(function (c) {
        return String(c || '').trim();
      });
      var colHojaOrigen = cabecerasMapeo.indexOf('HOJA_ORIGEN');
      var colTemporalMapeo = cabecerasMapeo.indexOf('ID_TEMPORAL');
      var colIdRealMapeo = cabecerasMapeo.indexOf('ID_REAL');

      if (colHojaOrigen !== -1 && colTemporalMapeo !== -1 && colIdRealMapeo !== -1) {
        hojaMapeo.getRange(2, 1, ultimaFilaMapeo - 1, hojaMapeo.getLastColumn()).getValues().forEach(function (fila) {
          if (String(fila[colHojaOrigen] || '').trim() !== nombreHojaOrigen) return;
          var temporal = String(fila[colTemporalMapeo] || '').trim();
          if (!temporal) return;
          var idReal = String(fila[colIdRealMapeo] || '').trim();
          if (idReal) mapa[temporal] = idReal;
        });
      }
    }
  }

  var hoja = ss.getSheetByName(nombreHojaOrigen);

  if (hoja) {
    var ultimaFila = hoja.getLastRow();
    var ultimaColumna = hoja.getLastColumn();

    if (ultimaFila >= 2) {
      var cabeceras = hoja.getRange(1, 1, 1, ultimaColumna).getValues()[0].map(function (c) {
        return String(c || '').trim();
      });
      var colTemporal = cabeceras.indexOf('ID_TEMPORAL');
      var colIdReal = cabeceras.indexOf('ID_REAL');

      if (colTemporal !== -1 && colIdReal !== -1) {
        var valores = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
        valores.forEach(function (fila) {
          var temporal = String(fila[colTemporal] || '').trim();
          if (!temporal || Object.prototype.hasOwnProperty.call(mapa, temporal)) return;
          var idReal = String(fila[colIdReal] || '').trim();
          mapa[temporal] = idReal || temporal;
        });
      }
    }
  }

  CACHE_RESOLUCION_STAGING_[nombreHojaOrigen] = mapa;
  return mapa;
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
 * Fase N13 (ver conversación -- "que al validar el botón cambie de
 * color... separar Validar de Importar"): las antiguas funciones
 * abrirImportacionXxx hacían la validación Y la confirmación DENTRO de
 * diálogos nativos (ui.alert), así que el HTML del diálogo unificado
 * nunca veía el resultado del dry-run y no podía pintar nada en el
 * propio botón. Estas funciones exponen procesarImportacionXxx_
 * (false/true) directamente al cliente, sin ningún diálogo nativo -- el
 * HTML decide cómo mostrar el resultado. Los 8 wrappers equivalentes de
 * los grupos avanzados (Recursos/Asignaciones/Seguimiento/Horario/
 * Ejecución) viven en ImportacionMasivaAvanzada.js -- ver conversación
 * "dejar el CORE limpio para acoplar módulos a demanda del cliente".
 * Las abrirImportacionXxx originales (ui.alert) se eliminaron en v70 --
 * ver conversación "revisa la carga de hojas del core" / reconciliación
 * menú clásico↔diálogo unificado: el menú de Sheets también abre
 * abrirImportacionMasivaInicio() ahora, así que ya no tenían caller.
 */
function validarImportacionMasiva() { return procesarImportacionMasiva_(false); }
function confirmarImportacionMasiva() { return procesarImportacionMasiva_(true); }

/*
 * Comprobación previa de huérfanos (ver conversación -- "chequeo previo,
 * no como error de importación después de esperar 90 segundos"): con el
 * dry-run ya rápido (v67), comprobar huérfanos es solo ejecutar el
 * dry-run de los 6 grupos y devolver los errores tal cual -- sin
 * duplicar ninguna lógica de validación. Se llama a las funciones
 * ejecutarImportacionXxx_ directamente (no a los procesarImportacionXxx_
 * públicos) para compartir un único contexto de caché entre los 6 y
 * para recibir los errores SIN agrupar -- necesitamos el número de fila
 * exacto de cada uno para poder borrar filas huérfanas una a una
 * (agruparErroresRepetidos_ colapsa esa información en una sola línea,
 * perfecta para mostrar pero inútil para actuar sobre ella).
 *
 * obtenerGruposComprobacionHuerfanos_() combina la entrada 'campana'
 * (CORE, este fichero) con GRUPOS_COMPROBACION_HUERFANOS_AVANZADA_
 * (módulo IMPORTACION_AVANZADA, ImportacionMasivaAvanzada.js) en tiempo
 * de ejecución -- nunca a nivel de fichero, porque el orden de carga
 * entre los .js de un proyecto de Apps Script no está garantizado.
 */
function obtenerGruposComprobacionHuerfanos_() {
  return [{ id: 'campana', ejecutar: ejecutarImportacionMasiva_ }].concat(GRUPOS_COMPROBACION_HUERFANOS_AVANZADA_);
}

/*
 * Ejecuta el dry-run de un grupo tolerando que sus hojas STG_* no
 * existan (ver conversación -- "dejar el CORE limpio para acoplar
 * módulos a demanda del cliente"): un cliente CORE-only nunca tiene las
 * hojas de Recursos/Asignaciones/etc., así que leerFilasPendientesImportacion_
 * lanzaría "No existe la hoja..." para esos 5 grupos -- se trata como
 * "0 errores" para ese grupo en vez de tumbar la comprobación entera.
 */
function ejecutarGrupoHuerfanosSeguro_(g) {
  try {
    return g.ejecutar(false);
  } catch (e) {
    if (String(e.message || e).indexOf('No existe la hoja') !== -1) {
      return { errores: [] };
    }
    throw e;
  }
}

function comprobarHuerfanosImportacionMasiva() {
  reiniciarCacheImportacionMasiva_();
  try {
    var todosLosErrores = [];
    obtenerGruposComprobacionHuerfanos_().forEach(function (g) {
      var resultado = ejecutarGrupoHuerfanosSeguro_(g);
      todosLosErrores = todosLosErrores.concat(resultado.errores);
    });

    var porHoja = {};
    var ordenHojas = [];

    todosLosErrores.forEach(function (mensaje) {
      if (mensaje.indexOf('no corresponde a ningún') === -1) return;
      var m = /^([A-Z0-9_]+) fila (\d+):/.exec(mensaje);
      if (!m) return;
      var hoja = m[1];
      var fila = Number(m[2]);
      if (!porHoja[hoja]) { porHoja[hoja] = { hoja: hoja, filas: [], ejemplo: mensaje }; ordenHojas.push(hoja); }
      if (porHoja[hoja].filas.indexOf(fila) === -1) porHoja[hoja].filas.push(fila);
    });

    return ordenHojas.map(function (hoja) {
      var g = porHoja[hoja];
      return { hoja: g.hoja, filas: g.filas.length, ejemplo: g.ejemplo };
    });
  } finally {
    cacheLecturaFinalizarContexto_();
  }
}

/*
 * Limpieza selectiva (ver conversación -- "limpieza selectiva, no solo
 * Vaciar todo"): vuelve a calcular los huérfanos justo antes de borrar
 * (nunca se fía de un resultado de comprobarHuerfanosImportacionMasiva_
 * calculado hace un rato, que podría estar desactualizado si el
 * usuario editó algo entretanto) y borra solo esas filas concretas de
 * sus hojas STG_* -- de abajo arriba dentro de cada hoja, para que
 * borrar una fila no desplace el número de las que faltan por borrar.
 * No toca ninguna fila válida ni ya importada.
 */
function eliminarFilasHuerfanasImportacionMasiva() {
  reiniciarCacheImportacionMasiva_();
  var filasPorHoja;
  try {
    var todosLosErrores = [];
    obtenerGruposComprobacionHuerfanos_().forEach(function (g) {
      var resultado = ejecutarGrupoHuerfanosSeguro_(g);
      todosLosErrores = todosLosErrores.concat(resultado.errores);
    });

    filasPorHoja = {};
    todosLosErrores.forEach(function (mensaje) {
      if (mensaje.indexOf('no corresponde a ningún') === -1) return;
      var m = /^([A-Z0-9_]+) fila (\d+):/.exec(mensaje);
      if (!m) return;
      var hoja = m[1];
      var fila = Number(m[2]);
      if (!filasPorHoja[hoja]) filasPorHoja[hoja] = [];
      if (filasPorHoja[hoja].indexOf(fila) === -1) filasPorHoja[hoja].push(fila);
    });
  } finally {
    cacheLecturaFinalizarContexto_();
  }

  var ss = SpreadsheetApp.getActive();
  var filasBorradas = 0;

  var bloqueo = LockService.getScriptLock();
  try {
    bloqueo.waitLock(10000);

    Object.keys(filasPorHoja).forEach(function (nombreHoja) {
      var hoja = ss.getSheetByName(nombreHoja);
      if (!hoja) return;

      var filas = filasPorHoja[nombreHoja].slice().sort(function (a, b) { return b - a; });
      filas.forEach(function (numeroFila) {
        hoja.deleteRow(numeroFila);
        filasBorradas++;
      });
    });
  } finally {
    bloqueo.releaseLock();
  }

  return { filasBorradas: filasBorradas, hojas: Object.keys(filasPorHoja) };
}

/*
 * Panel de estado por hoja STG_* (ver conversación -- "así sabes de un
 * vistazo qué te falta sin acordarte de memoria"): para cada hoja
 * definida, cuántas filas están pendientes de importar y cuántas ya se
 * importaron. Distingue por ID_TEMPORAL vacío para no contar filas
 * totalmente en blanco que a veces quedan tras editar a mano.
 */
function obtenerEstadoHojasStaging() {
  var ss = SpreadsheetApp.getActive();

  return obtenerDefinicionesStagingCompletas_().map(function (definicion) {
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
function abrirImportacionMasivaInicio(modulosInstalados) {
  modulosInstalados = resolverModulosInstalados_(modulosInstalados);
  var template = HtmlService.createTemplateFromFile('ImportacionMasivaInicio');
  template.modulosInstalados = JSON.stringify(Array.isArray(modulosInstalados) ? modulosInstalados : null);
  var html = template.evaluate()
    .setWidth(420)
    .setHeight(480);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Importación masiva');
}
