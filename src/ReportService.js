/**
 * ReportService.gs -- Fase 8: Informes MVP.
 * Agrega informes de campana, de proyecto y una memoria de produccion
 * global sobre las consultas jerarquicas ya cerradas (Fase 2) y las
 * alertas del panel operativo (Fase 7). No se materializa ningun
 * informe en una hoja: se calcula en vivo, igual que el panel.
 */

function obtenerProductosDeCampania_(campanaId) {
  var proyectos = listarProyectosDeCampana(campanaId);
  var productos = [];
  proyectos.forEach(function (proyecto) {
    listarProductosDeProyecto(proyecto.ID).forEach(function (producto) {
      productos.push(producto);
    });
  });
  return productos;
}

function obtenerProcesosDeProductos_(productos) {
  var procesos = [];
  productos.forEach(function (producto) {
    listarProcesosDeProducto(producto.ID).forEach(function (proceso) {
      procesos.push(proceso);
    });
  });
  return procesos;
}

function obtenerTareasDeProcesos_(procesos) {
  var tareas = [];
  procesos.forEach(function (proceso) {
    listarTareasDeProceso(proceso.ID).forEach(function (tarea) {
      tareas.push(tarea);
    });
  });
  return tareas;
}

function contarPorEstadoLista_(lista) {
  var conteo = {};
  lista.forEach(function (registro) {
    var estado = registro.ESTADO || '(sin estado)';
    conteo[estado] = (conteo[estado] || 0) + 1;
  });
  return conteo;
}

function calcularAvanceProducto_(producto) {
  var previstas = Number(producto.CANTIDAD_PREVISTA) || 0;
  var producidas = Number(producto.CANTIDAD_PRODUCIDA) || 0;
  producto.PORCENTAJE_AVANCE_CALCULADO = previstas > 0
    ? Math.round((producidas / previstas) * 100)
    : 0;
  return producto;
}

function generarInformeCampania(campanaId) {
  var campana = obtenerCampana(campanaId);
  if (!campana) {
    throw new Error('ERROR_INFORME: no existe una campana con id ' + campanaId + '.');
  }

  var proyectos = listarProyectosDeCampana(campanaId);
  var productos = obtenerProductosDeCampania_(campanaId).map(calcularAvanceProducto_);
  var procesos = obtenerProcesosDeProductos_(productos);
  var tareas = obtenerTareasDeProcesos_(procesos);
  var idsTareas = tareas.map(function (t) { return t.ID; });
  var idsProyectos = proyectos.map(function (p) { return p.ID; });

  var decisionesPendientes = listarDecisionesPendientes().filter(function (decision) {
    return idsProyectos.indexOf(decision.PROYECTO_ID) !== -1;
  });
  var incidenciasAbiertas = listarIncidenciasAbiertas().filter(function (incidencia) {
    return incidencia.CAMPANA_ID === campanaId || idsProyectos.indexOf(incidencia.PROYECTO_ID) !== -1;
  });
  var tareasRetrasadas = listarTareasRetrasadas().filter(function (tarea) {
    return idsTareas.indexOf(tarea.ID) !== -1;
  });

  var procesosConDesviacion = enriquecerConDesviacion_(procesos);
  var tareasConDesviacion = enriquecerConDesviacion_(tareas);

  return {
    tipo: 'CAMPANA',
    campana: campana,
    proyectos: proyectos,
    totales: {
      proyectos: proyectos.length,
      productos: productos.length,
      procesos: procesos.length,
      tareas: tareas.length
    },
    proyectosPorEstado: contarPorEstadoLista_(proyectos),
    tareasPorEstado: contarPorEstadoLista_(tareas),
    tareasRetrasadas: tareasRetrasadas,
    decisionesPendientes: decisionesPendientes,
    incidenciasAbiertas: incidenciasAbiertas,
    desviacionPlanificacion: construirBloqueDesviacion_(procesosConDesviacion, tareasConDesviacion)
  };
}

function generarInformeProyecto(proyectoId) {
  var proyecto = obtenerProyecto(proyectoId);
  if (!proyecto) {
    throw new Error('ERROR_INFORME: no existe un proyecto con id ' + proyectoId + '.');
  }

  var productos = listarProductosDeProyecto(proyectoId).map(calcularAvanceProducto_);
  var procesos = obtenerProcesosDeProductos_(productos);
  var tareas = obtenerTareasDeProcesos_(procesos);
  var idsTareas = tareas.map(function (t) { return t.ID; });

  var decisionesPendientes = listarDecisionesPendientes().filter(function (decision) {
    return decision.PROYECTO_ID === proyectoId;
  });
  var incidenciasAbiertas = listarIncidenciasAbiertas().filter(function (incidencia) {
    return incidencia.PROYECTO_ID === proyectoId;
  });
  var tareasRetrasadas = listarTareasRetrasadas().filter(function (tarea) {
    return idsTareas.indexOf(tarea.ID) !== -1;
  });

  var procesosConDesviacion = enriquecerConDesviacion_(procesos);
  var tareasConDesviacion = enriquecerConDesviacion_(tareas);

  return {
    tipo: 'PROYECTO',
    proyecto: proyecto,
    productos: productos,
    totales: {
      productos: productos.length,
      procesos: procesos.length,
      tareas: tareas.length
    },
    tareasPorEstado: contarPorEstadoLista_(tareas),
    tareasRetrasadas: tareasRetrasadas,
    decisionesPendientes: decisionesPendientes,
    incidenciasAbiertas: incidenciasAbiertas,
    desviacionPlanificacion: construirBloqueDesviacion_(procesosConDesviacion, tareasConDesviacion)
  };
}

function generarMemoriaProduccion() {
  var campanas = listarRegistros('CAMPANA', { ACTIVO: 'SÍ' });
  var resumenCampanas = campanas.map(function (campana) {
    var proyectos = listarProyectosDeCampana(campana.ID);
    return {
      campana: campana,
      totalProyectos: proyectos.length,
      proyectosPorEstado: contarPorEstadoLista_(proyectos)
    };
  });

  return {
    tipo: 'MEMORIA',
    resumenGlobal: obtenerResumenGlobal(),
    campanas: resumenCampanas,
    tareasRetrasadas: listarTareasRetrasadas(),
    decisionesPendientes: listarDecisionesPendientes(),
    incidenciasAbiertas: listarIncidenciasAbiertas(),
    desviacionPlanificacion: generarInformeDesviacion()
  };
}


function generarInformeExcepciones() {
  return {
    tipo: 'EXCEPCIONES',
    tareasRetrasadas: listarTareasRetrasadas(),
    tareasBloqueadas: listarTareasBloqueadas(),
    tareasPospuestas: listarTareasPospuestas(),
    tareasSinResponsable: listarTareasSinResponsable(),
    productosSinProyecto: listarProductosSinProyecto(),
    procesosSinFechas: listarProcesosSinFechas(),
    relacionesIncompletas: listarRelacionesIncompletas(),
    materiales: obtenerAlertasMaterialesSeguro_(),
    decisionesPendientes: listarDecisionesPendientes(),
    incidenciasAbiertas: listarIncidenciasAbiertas(),
    asignacionesSinEncajeCompetencia: listarAsignacionesSinEncajeCompetencia()
  };
}

function generarInformeCambios(fechaDesde, fechaHasta) {
  var hoja = SpreadsheetApp.getActive().getSheetByName('91_HISTORIAL');
  if (!hoja) throw new Error('ERROR_INFORME: no existe la hoja 91_HISTORIAL.');
  var valores = hoja.getDataRange().getDisplayValues();
  var encabezados = valores[0];
  var idxTs = encabezados.indexOf('TIMESTAMP');
  var idxPrueba = encabezados.indexOf('ES_PRUEBA');
  var desde = fechaDesde ? new Date(fechaDesde) : null;
  var hasta = fechaHasta ? new Date(fechaHasta) : null;
  if (hasta) hasta.setHours(23, 59, 59, 999);
  var filas = valores.slice(1)
    .filter(function (fila) { return fila[idxPrueba] !== 'SÍ'; })
    .filter(function (fila) {
      var ts = new Date(fila[idxTs]);
      if (desde && ts < desde) return false;
      if (hasta && ts > hasta) return false;
      return true;
    })
    .map(function (fila) {
      var registro = {};
      encabezados.forEach(function (enc, idx) { registro[enc] = fila[idx]; });
      return registro;
    });
  return { tipo: 'CAMBIOS', fechaDesde: fechaDesde || null, fechaHasta: fechaHasta || null, cambios: filas };
}

function obtenerOpcionesInforme(tipo) {
  if (tipo === 'CAMPANA' || tipo === 'CIERRE_CAMPANA') {
    return listarRegistros('CAMPANA', { ACTIVO: 'SÍ' }).map(function (campana) {
      return { id: campana.ID, etiqueta: campana.ID + ' - ' + campana.NOMBRE };
    });
  }
  if (tipo === 'PROYECTO') {
    return listarRegistros('PROYECTO', { ACTIVO: 'SÍ' }).map(function (proyecto) {
      return { id: proyecto.ID, etiqueta: proyecto.ID + ' - ' + proyecto.NOMBRE };
    });
  }
  throw new Error('ERROR_INFORME: tipo de informe no soportado para opciones: ' + tipo);
}

/*
 * Ejecutivo (N12 -- "podemos generar algún informe que nos interese
 * para el core?"): instantánea de una página con los KPI de TODAS las
 * campañas activas a la vez, sin elegir ninguna -- pensado para
 * repartir sin abrir el Sheet. Reutiliza obtenerResumenGlobal/
 * listarTareasRetrasadas/listarIncidenciasAbiertas/
 * listarDecisionesPendientes/listarSobreasignaciones (DashboardService.js,
 * ya CORE-safe) en vez de duplicar ninguna consulta.
 */
function generarInformeEjecutivo() {
  var campanas = listarRegistros('CAMPANA', { ACTIVO: 'SÍ' });
  var campanasActivas = campanas.filter(function (c) { return c.ESTADO === 'Activa'; });
  var procesosActivos = listarRegistros('PROCESO', { ACTIVO: 'SÍ' });
  var avanceMedioProcesos = procesosActivos.length > 0
    ? Math.round(procesosActivos.reduce(function (acc, p) { return acc + (Number(p.PORCENTAJE_AVANCE) || 0); }, 0) / procesosActivos.length)
    : null;

  return {
    tipo: 'EJECUTIVO',
    totalCampanas: campanas.length,
    totalCampanasActivas: campanasActivas.length,
    avanceMedioProcesos: avanceMedioProcesos,
    resumenGlobal: obtenerResumenGlobal(),
    tareasRetrasadas: listarTareasRetrasadas(),
    incidenciasAbiertas: listarIncidenciasAbiertas(),
    decisionesPendientes: listarDecisionesPendientes(),
    sobreasignaciones: listarSobreasignaciones()
  };
}

/*
 * Cierre de campaña / post-mortem (N12): mismo cálculo que
 * generarInformeCampania pero con el ángulo "ya terminó, ¿qué tal fue?"
 * -- % completado en vez de pendientes, decisiones/incidencias en TODOS
 * los estados (no solo abiertas) para ver el recorrido completo.
 */
function generarInformeCierreCampana(campanaId) {
  var base = generarInformeCampania(campanaId);
  var idsProyectos = base.proyectos.map(function (p) { return p.ID; });

  var todasDecisiones = listarRegistros('DECISION', { ACTIVO: 'SÍ' }).filter(function (d) {
    return idsProyectos.indexOf(d.PROYECTO_ID) !== -1;
  });
  var todasIncidencias = listarRegistros('INCIDENCIA', { ACTIVO: 'SÍ' }).filter(function (i) {
    return i.CAMPANA_ID === campanaId || idsProyectos.indexOf(i.PROYECTO_ID) !== -1;
  });

  var proyectosCompletados = base.proyectos.filter(function (p) { return p.ESTADO === 'Completado'; }).length;

  return Object.assign({}, base, {
    tipo: 'CIERRE_CAMPANA',
    porcentajeProyectosCompletados: base.proyectos.length > 0 ? Math.round((proyectosCompletados / base.proyectos.length) * 100) : 0,
    porcentajeTareasCompletadas: base.totales.tareas > 0
      ? Math.round(((base.tareasPorEstado.Terminada || 0) / base.totales.tareas) * 100)
      : 0,
    decisionesPorEstado: contarPorEstadoLista_(todasDecisiones),
    incidenciasPorEstado: contarPorEstadoLista_(todasIncidencias),
    todasDecisiones: todasDecisiones,
    todasIncidencias: todasIncidencias
  });
}

function generarInforme(tipo, id) {
  cacheLecturaIniciarContexto_();

  try {
    var informe;

    if (tipo === 'CAMPANA') informe = generarInformeCampania(id);
    else if (tipo === 'PROYECTO') informe = generarInformeProyecto(id);
    else if (tipo === 'MEMORIA') informe = generarMemoriaProduccion();
    else if (tipo === 'EXCEPCIONES') informe = generarInformeExcepciones();
    else if (tipo === 'CAMBIOS') informe = generarInformeCambios(id && id.fechaDesde, id && id.fechaHasta);
    else if (tipo === 'DESVIACION') informe = generarInformeDesviacion();
    else if (tipo === 'CALIDAD_PLANIFICACION') informe = generarInformeCalidadPlanificacion();
    else if (tipo === 'JUSTIFICACION_ECONOMICA') informe = generarInformeJustificacionEconomica(id && id.entidadTipo, id && id.entidadId);
    else if (tipo === 'EVIDENCIA_SOCIAL') informe = generarInformeEvidenciaSocial(id && id.entidadTipo, id && id.entidadId);
    else if (tipo === 'EJECUTIVO') informe = generarInformeEjecutivo();
    else if (tipo === 'CIERRE_CAMPANA') informe = generarInformeCierreCampana(id);
    else throw new Error('ERROR_INFORME: tipo de informe no soportado: ' + tipo);

    return serializarParaCliente_(informe);
  } finally {
    cacheLecturaFinalizarContexto_();
  }
}


function nombreArchivoInforme_(tipo, extension) {
  var fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss');
  return 'INFORME_' + tipo + '_' + fecha + '.' + extension;
}

function aplanarValorParaExportar_(prefijo, valor, filas) {
  if (valor === null || valor === undefined) {
    filas.push([prefijo, '']);
    return;
  }

  if (Array.isArray(valor)) {
    if (valor.length === 0) {
      filas.push([prefijo, '']);
      return;
    }

    valor.forEach(function (item, indice) {
      aplanarValorParaExportar_(prefijo + '[' + indice + ']', item, filas);
    });

    return;
  }

  if (typeof valor === 'object') {
    var claves = Object.keys(valor);

    if (claves.length === 0) {
      filas.push([prefijo, '']);
      return;
    }

    claves.forEach(function (clave) {
      aplanarValorParaExportar_(
        prefijo ? prefijo + '.' + clave : clave,
        valor[clave],
        filas
      );
    });

    return;
  }

  filas.push([prefijo, valor]);
}

function aplanarInformeParaExportar_(informe) {
  var filas = [];

  Object.keys(informe).forEach(function (clave) {
    aplanarValorParaExportar_(clave, informe[clave], filas);
  });

  return filas;
}

function escaparHtmlServer_(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function exportarInformeCSV(tipo, idOFiltro, opcionesPrueba) {
  var informe = generarInforme(tipo, idOFiltro);
  var filas = aplanarInformeParaExportar_(informe);
  var csv = 'campo,valor\n' + filas.map(function (f) {
    return f.map(function (v) { return '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');
  // BOM UTF-8 (ver construirCsvConBom_ en DesviacionService.js): sin
  // el, Excel interpreta los acentos con la codificacion regional.
  var csvConBom = String.fromCharCode(0xFEFF) + csv;
  var nombre = nombreArchivoInforme_(tipo, 'csv');
  registrarHistorial('INFORME', nombre, 'EXPORTAR_INFORME', [], Object.assign({ origen: (opcionesPrueba && opcionesPrueba.origen) || 'UI', formato: 'CSV' }, opcionesPrueba || {}));
  return { nombreArchivo: nombre, contenidoCsv: csvConBom };
}

/*
 * abrirDialogoDescargaCSV_ (DesviacionService.js) es el mismo dialogo
 * de descarga que usan el Gantt y el arbol de campaña -- se comparte
 * aqui tambien, aunque la construccion del contenido siga siendo
 * propia (clave/valor plano, no tabular).
 */
function abrirDialogoExportarCSV(tipo, idOFiltro) {
  var resultado = exportarInformeCSV(tipo, idOFiltro, {});
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}

/*
 * Fallback genérico (ver conversación -- "los informes son genéricos"):
 * ya NO es el camino normal de ningún tipo conocido, queda solo como
 * red de seguridad si algún tipo nuevo se añade a generarInforme() sin
 * su propia plantilla en generarHtmlInformeVisual_.
 */
function generarHtmlParaImprimir_(informe) {
  var filas = aplanarInformeParaExportar_(informe);
  return construirDocumentoInformeImprimible_('Informe: ' + informe.tipo, '', tablaSimpleHtml_(['Campo', 'Valor'], filas));
}

function generarHtmlCampana_(informe, nivel) {
  var c = informe.campana;
  var retrasadas = limitarSiResumen_(informe.tareasRetrasadas, nivel, 8);
  var incidencias = limitarSiResumen_(informe.incidenciasAbiertas, nivel, 8);
  var decisiones = limitarSiResumen_(informe.decisionesPendientes, nivel, 8);
  var d = informe.desviacionPlanificacion;

  var cuerpo =
    tarjetasResumenHtml_([
      { valor: informe.totales.proyectos, etiqueta: 'Proyectos' },
      { valor: informe.totales.productos, etiqueta: 'Productos' },
      { valor: informe.totales.procesos, etiqueta: 'Procesos' },
      { valor: informe.totales.tareas, etiqueta: 'Tareas' },
      { valor: informe.tareasRetrasadas.length, etiqueta: 'Tareas retrasadas', alerta: informe.tareasRetrasadas.length > 0 },
      { valor: informe.incidenciasAbiertas.length, etiqueta: 'Incidencias abiertas', alerta: informe.incidenciasAbiertas.length > 0 },
      { valor: informe.decisionesPendientes.length, etiqueta: 'Decisiones pendientes' }
    ]) +
    '<h2>Proyectos por estado</h2>' +
    graficoBarrasHtml_(Object.keys(informe.proyectosPorEstado).map(function (k) { return { etiqueta: k, valor: informe.proyectosPorEstado[k] }; })) +
    '<h2>Tareas por estado</h2>' +
    graficoBarrasHtml_(Object.keys(informe.tareasPorEstado).map(function (k) { return { etiqueta: k, valor: informe.tareasPorEstado[k] }; })) +
    '<h2>Desviación de planificación (días de media por fase)</h2>' +
    graficoBarrasHtml_(d.procesosPorFase.map(function (g) { return { etiqueta: g.grupo, valor: g.diasDesviacionMedia }; }), { alertaSi: function (i) { return i.valor > 0; } }) +
    '<h2>Tareas retrasadas</h2>' +
    tablaSimpleHtml_(['Tarea', 'Vencía'], retrasadas.filas.map(function (t) { return [t.NOMBRE, t.FECHA_FIN_PLAN]; })) + avisoOcultasHtml_(retrasadas.ocultas) +
    '<h2>Incidencias abiertas</h2>' +
    tablaSimpleHtml_(['Título', 'Estado', 'Prioridad'], incidencias.filas.map(function (i) { return [i.TITULO, i.ESTADO, i.PRIORIDAD]; })) + avisoOcultasHtml_(incidencias.ocultas) +
    '<h2>Decisiones pendientes</h2>' +
    tablaSimpleHtml_(['Título', 'Estado', 'Fecha límite'], decisiones.filas.map(function (d2) { return [d2.TITULO, d2.ESTADO, d2.FECHA_LIMITE]; })) + avisoOcultasHtml_(decisiones.ocultas);

  return construirDocumentoInformeImprimible_('Informe de campaña — ' + c.NOMBRE, c.ESTADO + ' · ' + c.FECHA_INICIO_PLAN + ' a ' + c.FECHA_FIN_PLAN, cuerpo);
}

function generarHtmlProyecto_(informe, nivel) {
  var p = informe.proyecto;
  var retrasadas = limitarSiResumen_(informe.tareasRetrasadas, nivel, 8);
  var incidencias = limitarSiResumen_(informe.incidenciasAbiertas, nivel, 8);
  var decisiones = limitarSiResumen_(informe.decisionesPendientes, nivel, 8);
  var d = informe.desviacionPlanificacion;

  var cuerpo =
    tarjetasResumenHtml_([
      { valor: informe.totales.productos, etiqueta: 'Productos' },
      { valor: informe.totales.procesos, etiqueta: 'Procesos' },
      { valor: informe.totales.tareas, etiqueta: 'Tareas' },
      { valor: informe.tareasRetrasadas.length, etiqueta: 'Tareas retrasadas', alerta: informe.tareasRetrasadas.length > 0 },
      { valor: informe.incidenciasAbiertas.length, etiqueta: 'Incidencias abiertas', alerta: informe.incidenciasAbiertas.length > 0 },
      { valor: informe.decisionesPendientes.length, etiqueta: 'Decisiones pendientes' }
    ]) +
    '<h2>Productos (% avance)</h2>' +
    graficoBarrasHtml_(informe.productos.map(function (pr) { return { etiqueta: pr.NOMBRE, valor: pr.PORCENTAJE_AVANCE_CALCULADO }; }), { max: 100 }) +
    '<h2>Tareas por estado</h2>' +
    graficoBarrasHtml_(Object.keys(informe.tareasPorEstado).map(function (k) { return { etiqueta: k, valor: informe.tareasPorEstado[k] }; })) +
    '<h2>Desviación de planificación (días de media por fase)</h2>' +
    graficoBarrasHtml_(d.procesosPorFase.map(function (g) { return { etiqueta: g.grupo, valor: g.diasDesviacionMedia }; }), { alertaSi: function (i) { return i.valor > 0; } }) +
    '<h2>Tareas retrasadas</h2>' +
    tablaSimpleHtml_(['Tarea', 'Vencía'], retrasadas.filas.map(function (t) { return [t.NOMBRE, t.FECHA_FIN_PLAN]; })) + avisoOcultasHtml_(retrasadas.ocultas) +
    '<h2>Incidencias abiertas</h2>' +
    tablaSimpleHtml_(['Título', 'Estado', 'Prioridad'], incidencias.filas.map(function (i) { return [i.TITULO, i.ESTADO, i.PRIORIDAD]; })) + avisoOcultasHtml_(incidencias.ocultas) +
    '<h2>Decisiones pendientes</h2>' +
    tablaSimpleHtml_(['Título', 'Estado', 'Fecha límite'], decisiones.filas.map(function (d2) { return [d2.TITULO, d2.ESTADO, d2.FECHA_LIMITE]; })) + avisoOcultasHtml_(decisiones.ocultas);

  return construirDocumentoInformeImprimible_('Informe de proyecto — ' + p.NOMBRE, p.ESTADO, cuerpo);
}

function generarHtmlMemoria_(informe, nivel) {
  var retrasadas = limitarSiResumen_(informe.tareasRetrasadas, nivel, 8);
  var incidencias = limitarSiResumen_(informe.incidenciasAbiertas, nivel, 8);
  var decisiones = limitarSiResumen_(informe.decisionesPendientes, nivel, 8);
  var d = informe.desviacionPlanificacion;

  var cuerpo =
    tarjetasResumenHtml_([
      { valor: informe.campanas.length, etiqueta: 'Campañas' },
      { valor: informe.resumenGlobal.PROYECTO ? Object.keys(informe.resumenGlobal.PROYECTO).reduce(function (a, k) { return a + informe.resumenGlobal.PROYECTO[k]; }, 0) : 0, etiqueta: 'Proyectos' },
      { valor: informe.tareasRetrasadas.length, etiqueta: 'Tareas retrasadas', alerta: informe.tareasRetrasadas.length > 0 },
      { valor: informe.incidenciasAbiertas.length, etiqueta: 'Incidencias abiertas', alerta: informe.incidenciasAbiertas.length > 0 },
      { valor: informe.decisionesPendientes.length, etiqueta: 'Decisiones pendientes' }
    ]) +
    '<h2>Tareas por estado (global)</h2>' +
    graficoBarrasHtml_(Object.keys(informe.resumenGlobal.TAREA || {}).map(function (k) { return { etiqueta: k, valor: informe.resumenGlobal.TAREA[k] }; })) +
    '<h2>Campañas</h2>' +
    tablaSimpleHtml_(['Campaña', 'Estado', 'Proyectos'], informe.campanas.map(function (c) { return [c.campana.NOMBRE, c.campana.ESTADO, c.totalProyectos]; })) +
    '<h2>Desviación de planificación (días de media por campaña)</h2>' +
    graficoBarrasHtml_(d.procesosPorCampana.map(function (g) { return { etiqueta: g.grupo, valor: g.diasDesviacionMedia }; }), { alertaSi: function (i) { return i.valor > 0; } }) +
    '<h2>Tareas retrasadas</h2>' +
    tablaSimpleHtml_(['Tarea', 'Vencía'], retrasadas.filas.map(function (t) { return [t.NOMBRE, t.FECHA_FIN_PLAN]; })) + avisoOcultasHtml_(retrasadas.ocultas) +
    '<h2>Incidencias abiertas</h2>' +
    tablaSimpleHtml_(['Título', 'Estado', 'Prioridad'], incidencias.filas.map(function (i) { return [i.TITULO, i.ESTADO, i.PRIORIDAD]; })) + avisoOcultasHtml_(incidencias.ocultas) +
    '<h2>Decisiones pendientes</h2>' +
    tablaSimpleHtml_(['Título', 'Estado', 'Fecha límite'], decisiones.filas.map(function (d2) { return [d2.TITULO, d2.ESTADO, d2.FECHA_LIMITE]; })) + avisoOcultasHtml_(decisiones.ocultas);

  return construirDocumentoInformeImprimible_('Memoria de producción', '', cuerpo);
}

function generarHtmlExcepciones_(informe, nivel) {
  var categorias = [
    ['Tareas retrasadas', informe.tareasRetrasadas, ['Tarea', 'Vencía'], function (t) { return [t.NOMBRE, t.FECHA_FIN_PLAN]; }],
    ['Tareas bloqueadas', informe.tareasBloqueadas, ['Tarea'], function (t) { return [t.NOMBRE]; }],
    ['Tareas pospuestas', informe.tareasPospuestas, ['Tarea'], function (t) { return [t.NOMBRE]; }],
    ['Tareas sin responsable', informe.tareasSinResponsable, ['Tarea'], function (t) { return [t.NOMBRE]; }],
    ['Productos sin proyecto', informe.productosSinProyecto, ['Producto'], function (p) { return [p.NOMBRE]; }],
    ['Procesos sin fechas', informe.procesosSinFechas, ['Proceso'], function (p) { return [p.NOMBRE]; }],
    ['Relaciones incompletas', informe.relacionesIncompletas, ['Registro'], function (r) { return [r.NOMBRE || r.ID]; }],
    ['Materiales con stock bajo', (informe.materiales || {}).stockBajo, ['Material', 'Stock'], function (m) { return [m.NOMBRE, m.STOCK_ACTUAL]; }],
    ['Materiales agotados', (informe.materiales || {}).agotados, ['Material'], function (m) { return [m.NOMBRE]; }],
    ['Decisiones pendientes', informe.decisionesPendientes, ['Título', 'Estado'], function (d) { return [d.TITULO, d.ESTADO]; }],
    ['Incidencias abiertas', informe.incidenciasAbiertas, ['Título', 'Estado'], function (i) { return [i.TITULO, i.ESTADO]; }],
    ['Asignaciones sin encaje de competencia', informe.asignacionesSinEncajeCompetencia, ['Tarea', 'Responsable', 'Competencia'], function (a) { return [a.TAREA_NOMBRE, a.PERSONA_NOMBRE, a.COMPETENCIA_NOMBRE + (a.NIVEL_EXIGIDO ? ' (' + a.NIVEL_EXIGIDO + ')' : '')]; }]
  ];

  var cuerpo =
    '<h2>Resumen por categoría</h2>' +
    graficoBarrasHtml_(categorias.map(function (c) { return { etiqueta: c[0], valor: (c[1] || []).length }; }), { alertaSi: function (i) { return i.valor > 0; } }) +
    categorias.map(function (c) {
      var titulo = c[0], lista = limitarSiResumen_(c[1], nivel, 8), encabezados = c[2], plantilla = c[3];
      if (lista.filas.length === 0) return '';
      return '<h2>' + escaparHtmlServer_(titulo) + '</h2>' +
        tablaSimpleHtml_(encabezados, lista.filas.map(plantilla)) + avisoOcultasHtml_(lista.ocultas);
    }).join('');

  return construirDocumentoInformeImprimible_('Excepciones (calidad de datos)', '', cuerpo);
}

function generarHtmlDesviacion_(informe, nivel) {
  var cuerpo =
    tarjetasResumenHtml_([
      { valor: informe.procesosMedidos, etiqueta: 'Procesos medidos' },
      { valor: informe.tareasMedidas, etiqueta: 'Tareas medidas' }
    ]) +
    '<h2>Por fase (días de desviación media)</h2>' +
    graficoBarrasHtml_(informe.procesosPorFase.map(function (g) { return { etiqueta: g.grupo, valor: g.diasDesviacionMedia }; }), { alertaSi: function (i) { return i.valor > 0; } }) +
    '<h2>Procesos por responsable (días de desviación media)</h2>' +
    graficoBarrasHtml_(informe.procesosPorResponsable.map(function (g) { return { etiqueta: g.grupo, valor: g.diasDesviacionMedia }; }), { alertaSi: function (i) { return i.valor > 0; } }) +
    '<h2>Tareas por responsable (días de desviación media)</h2>' +
    graficoBarrasHtml_(informe.tareasPorResponsable.map(function (g) { return { etiqueta: g.grupo, valor: g.diasDesviacionMedia }; }), { alertaSi: function (i) { return i.valor > 0; } }) +
    (informe.procesosPorCampana ? '<h2>Por campaña (días de desviación media)</h2>' +
      graficoBarrasHtml_(informe.procesosPorCampana.map(function (g) { return { etiqueta: g.grupo, valor: g.diasDesviacionMedia }; }), { alertaSi: function (i) { return i.valor > 0; } }) : '');

  return construirDocumentoInformeImprimible_('Desviación de planificación', 'Real vs. plan', cuerpo);
}

function generarHtmlCalidad_(informe, nivel) {
  var cuerpo =
    '<div class="fila-donuts">' +
      donutProgresoSvg_(informe.porcentajeProcesosATiempo, 'Procesos a tiempo') +
      donutProgresoSvg_(informe.porcentajeTareasATiempo, 'Tareas a tiempo') +
    '</div>' +
    tarjetasResumenHtml_([
      { valor: informe.procesosMedidos, etiqueta: 'Procesos medidos' },
      { valor: informe.tareasMedidas, etiqueta: 'Tareas medidas' }
    ]) +
    '<h2>Utilización de horario por responsable</h2>' +
    graficoBarrasHtml_(informe.utilizacionHorarioPorResponsable.map(function (u) { return { etiqueta: u.responsable, valor: u.porcentajeUtilizacion || 0 }; }), { max: 100, alertaSi: function (i) { return i.valor < 70; } }) +
    '<h2>Por fase (días de desviación media)</h2>' +
    graficoBarrasHtml_(informe.procesosPorFase.map(function (g) { return { etiqueta: g.grupo, valor: g.diasDesviacionMedia }; }), { alertaSi: function (i) { return i.valor > 0; } }) +
    '<h2>Por recurso (días de desviación media)</h2>' +
    graficoBarrasHtml_(informe.procesosPorRecurso.map(function (g) { return { etiqueta: g.grupo, valor: g.diasDesviacionMedia }; }), { alertaSi: function (i) { return i.valor > 0; } }) +
    '<h2>Por campaña (días de desviación media)</h2>' +
    graficoBarrasHtml_(informe.procesosPorCampana.map(function (g) { return { etiqueta: g.grupo, valor: g.diasDesviacionMedia }; }), { alertaSi: function (i) { return i.valor > 0; } });

  return construirDocumentoInformeImprimible_('Calidad de planificación', '', cuerpo);
}

function generarHtmlEvidenciaSocial_(informe, nivel) {
  var im = informe.impactoSocial || { personasVoluntariado: 0, diasVoluntariado: 0, personasAtendidas: 0, diasPersonasAtendidas: 0 };
  var reutilizacion = informe.reutilizacion || { relacionesReutilizadas: [], procesosReutilizados: [], totalReutilizaciones: 0 };
  var etiquetas = limitarSiResumen_(informe.etiquetasImpacto, nivel, 10);

  var cuerpo =
    tarjetasResumenHtml_([
      { valor: im.personasVoluntariado, etiqueta: 'Personas voluntarias' },
      { valor: im.diasVoluntariado, etiqueta: 'Días de voluntariado' },
      { valor: im.personasAtendidas, etiqueta: 'Personas atendidas' },
      { valor: im.diasPersonasAtendidas, etiqueta: 'Días de atención' },
      { valor: reutilizacion.totalReutilizaciones, etiqueta: 'Reutilizaciones' }
    ]) +
    '<h2>Etiquetas de impacto por categoría</h2>' +
    graficoBarrasHtml_(Object.keys(informe.etiquetasPorCategoria || {}).map(function (k) { return { etiqueta: k, valor: informe.etiquetasPorCategoria[k] }; })) +
    '<h2>Etiquetas de impacto (detalle)</h2>' +
    tablaSimpleHtml_(['Categoría', 'Registro', 'Descripción'], etiquetas.filas.map(function (e) { return [e.categoria, e.entidadTipo + ': ' + e.entidadNombre, e.descripcion]; })) + avisoOcultasHtml_(etiquetas.ocultas) +
    '<h2>Reutilización (vía "Modo de uso")</h2>' +
    tablaSimpleHtml_(['Producto/Proceso', 'Proyecto', 'Modo de uso'],
      reutilizacion.relacionesReutilizadas.map(function (r) { return [r.productoNombre, r.proyectoNombre, r.modoUso]; })
        .concat(reutilizacion.procesosReutilizados.map(function (p) { return [p.nombre, p.productoNombre, p.modoUso]; })));

  return construirDocumentoInformeImprimible_('Evidencia de impacto', informe.entidadTipo + ': ' + informe.entidadNombre, cuerpo);
}

function generarHtmlCambios_(informe, nivel) {
  var cambios = limitarSiResumen_(informe.cambios, nivel, 30);
  var subtitulo = (informe.fechaDesde || informe.fechaHasta)
    ? 'Desde ' + (informe.fechaDesde || '(sin límite)') + ' hasta ' + (informe.fechaHasta || '(sin límite)')
    : 'Todo el histórico disponible';

  var cuerpo =
    tarjetasResumenHtml_([{ valor: informe.cambios.length, etiqueta: 'Cambios' }]) +
    tablaSimpleHtml_(['Fecha', 'Usuario', 'Acción', 'Entidad', 'Registro'],
      cambios.filas.map(function (c) { return [c.TIMESTAMP, c.USUARIO, c.ACCION, c.ENTIDAD, c.REGISTRO_ID]; })) +
    avisoOcultasHtml_(cambios.ocultas);

  return construirDocumentoInformeImprimible_('Cambios (auditoría)', subtitulo, cuerpo);
}

function generarHtmlEjecutivo_(informe) {
  var cuerpo =
    '<div class="fila-donuts">' +
      (informe.avanceMedioProcesos !== null ? donutProgresoSvg_(informe.avanceMedioProcesos, 'Avance medio de procesos') : '') +
    '</div>' +
    tarjetasResumenHtml_([
      { valor: informe.totalCampanasActivas, etiqueta: 'Campañas activas' },
      { valor: informe.totalCampanas, etiqueta: 'Campañas totales' },
      { valor: informe.tareasRetrasadas.length, etiqueta: 'Tareas retrasadas', alerta: informe.tareasRetrasadas.length > 0 },
      { valor: informe.incidenciasAbiertas.length, etiqueta: 'Incidencias abiertas', alerta: informe.incidenciasAbiertas.length > 0 },
      { valor: informe.decisionesPendientes.length, etiqueta: 'Decisiones pendientes' },
      { valor: informe.sobreasignaciones.length, etiqueta: 'Sobreasignaciones', alerta: informe.sobreasignaciones.length > 0 }
    ]) +
    '<h2>Tareas por estado (global)</h2>' +
    graficoBarrasHtml_(Object.keys(informe.resumenGlobal.TAREA || {}).map(function (k) { return { etiqueta: k, valor: informe.resumenGlobal.TAREA[k] }; })) +
    '<h2>Tareas retrasadas (top 8)</h2>' +
    tablaSimpleHtml_(['Tarea', 'Vencía'], informe.tareasRetrasadas.slice(0, 8).map(function (t) { return [t.NOMBRE, t.FECHA_FIN_PLAN]; })) +
    '<h2>Incidencias abiertas (top 8)</h2>' +
    tablaSimpleHtml_(['Título', 'Prioridad'], informe.incidenciasAbiertas.slice(0, 8).map(function (i) { return [i.TITULO, i.PRIORIDAD]; })) +
    '<h2>Decisiones pendientes (top 8)</h2>' +
    tablaSimpleHtml_(['Título', 'Fecha límite'], informe.decisionesPendientes.slice(0, 8).map(function (d) { return [d.TITULO, d.FECHA_LIMITE]; }));

  return construirDocumentoInformeImprimible_('Informe ejecutivo', Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Europe/Madrid', 'yyyy-MM-dd'), cuerpo);
}

function generarHtmlCierreCampana_(informe, nivel) {
  var c = informe.campana;
  var decisiones = limitarSiResumen_(informe.todasDecisiones, nivel, 10);
  var incidencias = limitarSiResumen_(informe.todasIncidencias, nivel, 10);

  var cuerpo =
    '<div class="fila-donuts">' +
      donutProgresoSvg_(informe.porcentajeProyectosCompletados, 'Proyectos completados') +
      donutProgresoSvg_(informe.porcentajeTareasCompletadas, 'Tareas completadas') +
    '</div>' +
    tarjetasResumenHtml_([
      { valor: informe.totales.proyectos, etiqueta: 'Proyectos' },
      { valor: informe.totales.productos, etiqueta: 'Productos' },
      { valor: informe.totales.tareas, etiqueta: 'Tareas' },
      { valor: informe.todasDecisiones.length, etiqueta: 'Decisiones tomadas' },
      { valor: informe.todasIncidencias.length, etiqueta: 'Incidencias registradas' }
    ]) +
    '<h2>Decisiones por estado</h2>' +
    graficoBarrasHtml_(Object.keys(informe.decisionesPorEstado).map(function (k) { return { etiqueta: k, valor: informe.decisionesPorEstado[k] }; })) +
    '<h2>Incidencias por estado</h2>' +
    graficoBarrasHtml_(Object.keys(informe.incidenciasPorEstado).map(function (k) { return { etiqueta: k, valor: informe.incidenciasPorEstado[k] }; })) +
    '<h2>Desviación de planificación (días de media por fase)</h2>' +
    graficoBarrasHtml_(informe.desviacionPlanificacion.procesosPorFase.map(function (g) { return { etiqueta: g.grupo, valor: g.diasDesviacionMedia }; }), { alertaSi: function (i) { return i.valor > 0; } }) +
    '<h2>Decisiones</h2>' +
    tablaSimpleHtml_(['Título', 'Estado'], decisiones.filas.map(function (d) { return [d.TITULO, d.ESTADO]; })) + avisoOcultasHtml_(decisiones.ocultas) +
    '<h2>Incidencias</h2>' +
    tablaSimpleHtml_(['Título', 'Estado'], incidencias.filas.map(function (i) { return [i.TITULO, i.ESTADO]; })) + avisoOcultasHtml_(incidencias.ocultas);

  return construirDocumentoInformeImprimible_('Cierre de campaña — ' + c.NOMBRE, c.ESTADO, cuerpo);
}

/*
 * Punto único de generación de HTML imprimible por tipo (ver
 * conversación -- "revisa cada informe y propón una mejora"): cada tipo
 * tiene su propia plantilla visual en vez de compartir el volcado plano
 * genérico. nivel: 'resumen' (listas largas recortadas a los primeros
 * elementos) o 'completo' (todo, por defecto).
 */
function generarHtmlInformeVisual_(informe, nivel) {
  nivel = nivel === 'resumen' ? 'resumen' : 'completo';
  if (informe.tipo === 'JUSTIFICACION_ECONOMICA') return generarHtmlMemoriaEconomica_(informe);
  if (informe.tipo === 'CAMPANA') return generarHtmlCampana_(informe, nivel);
  if (informe.tipo === 'PROYECTO') return generarHtmlProyecto_(informe, nivel);
  if (informe.tipo === 'MEMORIA') return generarHtmlMemoria_(informe, nivel);
  if (informe.tipo === 'EXCEPCIONES') return generarHtmlExcepciones_(informe, nivel);
  if (informe.tipo === 'DESVIACION') return generarHtmlDesviacion_(informe, nivel);
  if (informe.tipo === 'CALIDAD_PLANIFICACION') return generarHtmlCalidad_(informe, nivel);
  if (informe.tipo === 'EVIDENCIA_SOCIAL') return generarHtmlEvidenciaSocial_(informe, nivel);
  if (informe.tipo === 'CAMBIOS') return generarHtmlCambios_(informe, nivel);
  if (informe.tipo === 'EJECUTIVO') return generarHtmlEjecutivo_(informe);
  if (informe.tipo === 'CIERRE_CAMPANA') return generarHtmlCierreCampana_(informe, nivel);
  return generarHtmlParaImprimir_(informe);
}

/*
 * Fase 4 (ver conversación -- "plantilla PDF propia, no la tabla plana
 * campo/valor que usan los demás informes"): memoria económica con
 * formato de resumen + tablas por sección, pensada para entregar fuera
 * del sistema (subvenciones/departamentos/clientes).
 */
function generarHtmlMemoriaEconomica_(informe) {
  var filasCategorias = informe.categorias.map(function (c) {
    return '<tr><td>' + escaparHtmlServer_(c.categoria) + '</td><td>' + c.previsto + '</td><td>' + c.real + '</td><td>' + c.desviacion + '</td></tr>';
  }).join('');

  var filasFuentes = (informe.fuentesFinanciacion || []).map(function (f) {
    return '<tr><td>' + escaparHtmlServer_(f.nombre) + '</td><td>' + escaparHtmlServer_(f.tipo) + '</td><td>' + f.importe + '</td><td>' + escaparHtmlServer_(f.estado) + '</td></tr>';
  }).join('') || '<tr><td colspan="4">Sin fuentes de financiación registradas.</td></tr>';

  var filasComparativa = (informe.comparativaCampanas || []).map(function (c) {
    return '<tr><td>' + escaparHtmlServer_(c.campanaNombre) + '</td><td>' + c.totalPrevisto + '</td><td>' + c.totalReal + '</td>' +
      '<td>' + (c.coberturaFinanciacion === null ? '—' : c.coberturaFinanciacion + '%') + '</td>' +
      '<td>' + c.personasVoluntariado + '</td><td>' + c.personasAtendidas + '</td></tr>';
  }).join('');

  var impacto = informe.impactoSocial || { personasVoluntariado: 0, personasAtendidas: 0 };

  var cuerpo =
    tarjetasResumenHtml_([
      { valor: informe.totalPrevisto + ' €', etiqueta: 'Presupuesto previsto' },
      { valor: informe.totalReal + ' €', etiqueta: 'Coste real' },
      { valor: informe.coberturaFinanciacion === null ? '—' : informe.coberturaFinanciacion + '%', etiqueta: 'Financiación cubierta' },
      { valor: impacto.personasVoluntariado, etiqueta: 'Personas voluntarias' },
      { valor: impacto.personasAtendidas, etiqueta: 'Personas atendidas' }
    ]) +
    '<h2>Coste por categoría</h2>' +
    '<table><tr><th>Categoría</th><th>Previsto (€)</th><th>Real (€)</th><th>Desviación (€)</th></tr>' + filasCategorias + '</table>' +
    '<h2>Fuentes de financiación (total: ' + informe.totalFinanciacion + ' €)</h2>' +
    '<table><tr><th>Nombre</th><th>Tipo</th><th>Importe (€)</th><th>Estado</th></tr>' + filasFuentes + '</table>' +
    '<h2>Comparativa entre campañas</h2>' +
    '<table><tr><th>Campaña</th><th>Previsto (€)</th><th>Real (€)</th><th>Financiación</th><th>Voluntariado</th><th>Personas atendidas</th></tr>' + filasComparativa + '</table>';

  return construirDocumentoInformeImprimible_('Memoria económica', informe.entidadTipo + ': ' + informe.entidadNombre, cuerpo);
}

function exportarInformePDF(tipo, idOFiltro, nivel, opcionesPrueba) {
  var informe = generarInforme(tipo, idOFiltro);
  var html = generarHtmlInformeVisual_(informe, nivel);
  var nombre = nombreArchivoInforme_(tipo, 'html');
  registrarHistorial('INFORME', nombre, 'EXPORTAR_INFORME', [], Object.assign({ origen: (opcionesPrueba && opcionesPrueba.origen) || 'UI', formato: 'PDF_IMPRESION' }, opcionesPrueba || {}));
  return { nombreArchivo: nombre, contenidoHtml: html };
}

function abrirDialogoExportarPDF(tipo, idOFiltro, nivel) {
  var resultado = exportarInformePDF(tipo, idOFiltro, nivel, {});
  var output = HtmlService.createHtmlOutput(resultado.contenidoHtml).setWidth(820).setHeight(600);
  SpreadsheetApp.getUi().showModelessDialog(output, 'Informe -- usa Imprimir para guardar como PDF');
}

function abrirInformes(modulosInstalados) {
  var template = HtmlService.createTemplateFromFile('InformeGenerico');
  template.modulosInstalados = JSON.stringify(Array.isArray(modulosInstalados) ? modulosInstalados : null);
  var html = template.evaluate().setTitle('Informes').setWidth(420);
  SpreadsheetApp.getUi().showSidebar(html);
}
