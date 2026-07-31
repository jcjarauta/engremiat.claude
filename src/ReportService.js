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
    incidenciasAbiertas: incidenciasAbiertas
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
    incidenciasAbiertas: incidenciasAbiertas
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
    incidenciasAbiertas: listarIncidenciasAbiertas()
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
    materialesStockBajo: listarMaterialesStockBajo(),
    materialesAgotados: listarMaterialesAgotados(),
    decisionesPendientes: listarDecisionesPendientes(),
    incidenciasAbiertas: listarIncidenciasAbiertas()
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
  if (tipo === 'CAMPANA') {
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

function generarInforme(tipo, id) {
  cacheLecturaIniciarContexto_();

  try {
    var informe;

    if (tipo === 'CAMPANA') informe = generarInformeCampania(id);
    else if (tipo === 'PROYECTO') informe = generarInformeProyecto(id);
    else if (tipo === 'MEMORIA') informe = generarMemoriaProduccion();
    else if (tipo === 'EXCEPCIONES') informe = generarInformeExcepciones();
    else if (tipo === 'CAMBIOS') informe = generarInformeCambios(id && id.fechaDesde, id && id.fechaHasta);
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
  var nombre = nombreArchivoInforme_(tipo, 'csv');
  registrarHistorial('INFORME', nombre, 'EXPORTAR_INFORME', [], Object.assign({ origen: (opcionesPrueba && opcionesPrueba.origen) || 'UI', formato: 'CSV' }, opcionesPrueba || {}));
  return { nombreArchivo: nombre, contenidoCsv: csv };
}

function abrirDialogoExportarCSV(tipo, idOFiltro) {
  var resultado = exportarInformeCSV(tipo, idOFiltro, {});
  var b64 = Utilities.base64Encode(resultado.contenidoCsv, Utilities.Charset.UTF_8);
  var html = '<html><body style="font-family:Arial,sans-serif;padding:16px;">' +
    '<p>Generando descarga de <strong>' + escaparHtmlServer_(resultado.nombreArchivo) + '</strong>...</p>' +
    '<a id="dl" download="' + escaparHtmlServer_(resultado.nombreArchivo) + '" href="data:text/csv;charset=utf-8;base64,' + b64 + '">Si la descarga no comienza, haz clic aqui</a>' +
    '<script>document.getElementById("dl").click();setTimeout(function(){ google.script.host.close(); }, 800);</script>' +
    '</body></html>';
  var output = HtmlService.createHtmlOutput(html).setWidth(360).setHeight(120);
  SpreadsheetApp.getUi().showModalDialog(output, 'Descargando CSV');
}

function generarHtmlParaImprimir_(informe) {
  var filas = aplanarInformeParaExportar_(informe);
  var html = '<html><head><meta charset="utf-8"><title>Informe ' + escaparHtmlServer_(informe.tipo) + '</title>' +
    '<style>body{font-family:Arial,sans-serif;padding:20px;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ccc;padding:6px;text-align:left;font-size:12px;} h1{font-size:18px;} @media print { button { display:none; } }</style>' +
    '</head><body>' +
    '<button onclick="window.print()">Imprimir / Guardar como PDF</button>' +
    '<h1>Informe: ' + escaparHtmlServer_(informe.tipo) + '</h1>' +
    '<p>Generado: ' + new Date().toString() + '</p>' +
    '<table><tr><th>Campo</th><th>Valor</th></tr>';
  filas.forEach(function (f) {
    html += '<tr><td>' + escaparHtmlServer_(f[0]) + '</td><td>' + escaparHtmlServer_(f[1]) + '</td></tr>';
  });
  html += '</table></body></html>';
  return html;
}

function exportarInformePDF(tipo, idOFiltro, opcionesPrueba) {
  var informe = generarInforme(tipo, idOFiltro);
  var html = generarHtmlParaImprimir_(informe);
  var nombre = nombreArchivoInforme_(tipo, 'html');
  registrarHistorial('INFORME', nombre, 'EXPORTAR_INFORME', [], Object.assign({ origen: (opcionesPrueba && opcionesPrueba.origen) || 'UI', formato: 'PDF_IMPRESION' }, opcionesPrueba || {}));
  return { nombreArchivo: nombre, contenidoHtml: html };
}

function abrirDialogoExportarPDF(tipo, idOFiltro) {
  var resultado = exportarInformePDF(tipo, idOFiltro, {});
  var output = HtmlService.createHtmlOutput(resultado.contenidoHtml).setWidth(820).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(output, 'Informe -- usa Imprimir para guardar como PDF');
}

function abrirInformes() {
  var html = HtmlService.createTemplateFromFile('InformeGenerico')
    .evaluate()
    .setTitle('Informes')
    .setWidth(420);
  SpreadsheetApp.getUi().showSidebar(html);
}
