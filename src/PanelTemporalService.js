/**
 * Panel temporal -- foto operativa por fecha (Hoy / Esta semana / Semana
 * que viene / rango libre), ver conversación "mientras se ejecutan las
 * pruebas reactivas... qué se tiene que hacer hoy, qué se ha hecho esta
 * semana, qué toca la semana que viene". Acotado a CORE (TAREA/PROCESO)
 * + SEGUIMIENTO (INCIDENCIA/DECISION) en esta primera versión, pensado
 * para ampliarse a otros módulos acoplables (COMPRAS y sus entregas
 * pendientes, por ejemplo) sin rediseñar: CONFIG_PANEL_TEMPORAL_ es el
 * único sitio que hace falta tocar para añadir una entidad nueva.
 */

var CONFIG_PANEL_TEMPORAL_ = {
  TAREA: {
    etiqueta: 'Tareas', modulo: null, campoNombre: 'NOMBRE',
    inicioPlan: 'FECHA_INICIO_PLAN', finPlan: 'FECHA_FIN_PLAN', finReal: 'FECHA_FIN_REAL',
    estadosCerrados: ['Terminada', 'Cancelada'],
    enriquecerResponsable: resolverNombresResponsablesTarea_
  },
  PROCESO: {
    etiqueta: 'Procesos', modulo: null, campoNombre: 'NOMBRE',
    inicioPlan: 'FECHA_INICIO_PLAN', finPlan: 'FECHA_FIN_PLAN', finReal: 'FECHA_FIN_REAL',
    estadosCerrados: ['Completado', 'Cancelado'],
    enriquecerResponsable: enriquecerConNombreResponsableProceso_
  },
  /*
   * enriquecerConNombreResponsableProceso_ (DesviacionService.js) lee
   * registro.RESPONSABLE_ID de forma genérica pese al nombre -- se
   * reutiliza tal cual para INCIDENCIA/DECISION en vez de duplicar la
   * misma función con otro nombre.
   */
  INCIDENCIA: {
    etiqueta: 'Incidencias', modulo: 'SEGUIMIENTO', campoNombre: 'TITULO',
    inicioPlan: 'FECHA_DETECCION', finPlan: 'FECHA_LIMITE', finReal: 'FECHA_RESOLUCION',
    estadosCerrados: ESTADOS_INCIDENCIA_CIERRE_,
    enriquecerResponsable: enriquecerConNombreResponsableProceso_
  },
  DECISION: {
    etiqueta: 'Decisiones', modulo: 'SEGUIMIENTO', campoNombre: 'TITULO',
    inicioPlan: null, finPlan: 'FECHA_LIMITE', finReal: 'FECHA_RESOLUCION',
    estadosCerrados: ESTADOS_DECISION_CIERRE_,
    enriquecerResponsable: enriquecerConNombreResponsableProceso_
  }
};

var ETIQUETAS_MODO_PANEL_TEMPORAL_ = {
  HOY: 'Hoy',
  ESTA_SEMANA: 'Esta semana',
  SEMANA_SIGUIENTE: 'Semana que viene',
  RANGO: 'Rango personalizado'
};

function abrirPanelTemporal() {
  var html = HtmlService.createTemplateFromFile('PanelTemporal')
    .evaluate()
    .setTitle('¿Qué toca?')
    .setWidth(440);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * modo: 'HOY' | 'ESTA_SEMANA' | 'SEMANA_SIGUIENTE' | 'RANGO'.
 * fechaInicioISO/fechaFinISO: solo se usan (y son obligatorios) en modo
 * 'RANGO' -- 'yyyy-MM-dd', tal cual los da un <input type="date">.
 */
function obtenerPanelTemporal(modo, fechaInicioISO, fechaFinISO) {
  var rango = calcularRangoPanelTemporal_(modo, fechaInicioISO, fechaFinISO);
  var incluirAtrasadasSiempre = (modo === 'HOY');
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  var entidades = ['TAREA', 'PROCESO'];
  if (moduloInstalado_('SEGUIMIENTO')) entidades = entidades.concat(['INCIDENCIA', 'DECISION']);

  var bloques = entidades.map(function (entidad) {
    return construirBloquePanelTemporal_(entidad, rango, incluirAtrasadasSiempre, hoy);
  });

  var resultado = {
    modo: modo,
    rangoInicio: rango.inicio,
    rangoFin: rango.fin,
    bloques: bloques,
    alertas: {
      sobreasignaciones: listarSobreasignaciones(),
      recursosSinCompetenciaDisponible: listarRecursosSinCompetenciaDisponible()
    }
  };

  // Ver conversación -- "recordar el último modo usado": mismo patrón que
  // guardarUltimaCampanaPanel (PanelCampanaService.js), por usuario.
  guardarUltimoModoPanelTemporal_(modo, fechaInicioISO, fechaFinISO);

  return serializarParaCliente_(resultado);
}

/*
 * Recuentos ligeros de pendientes para los 3 accesos directos (ver
 * conversación -- "contador en los botones, Hoy (3)"): lee cada hoja
 * una sola vez y reutiliza el array en memoria para los 3 modos, en vez
 * de 3 pasadas de obtenerPanelTemporal completas (que releerían y
 * volverían a resolver responsables 3 veces).
 */
function obtenerResumenPanelTemporal() {
  var entidades = ['TAREA', 'PROCESO'];
  if (moduloInstalado_('SEGUIMIENTO')) entidades = entidades.concat(['INCIDENCIA', 'DECISION']);

  var registrosPorEntidad = {};
  entidades.forEach(function (entidad) {
    registrosPorEntidad[entidad] = listarRegistrosSeguro_(entidad, { ACTIVO: 'SÍ' });
  });

  var resumen = {};
  ['HOY', 'ESTA_SEMANA', 'SEMANA_SIGUIENTE'].forEach(function (modo) {
    var rango = calcularRangoPanelTemporal_(modo, null, null);
    var incluirAtrasadasSiempre = (modo === 'HOY');
    var total = 0;
    entidades.forEach(function (entidad) {
      var config = CONFIG_PANEL_TEMPORAL_[entidad];
      total += filtrarPendientesEnRango_(registrosPorEntidad[entidad], config, rango, incluirAtrasadasSiempre).length;
    });
    resumen[modo] = total;
  });
  return resumen;
}

var PROPIEDAD_ULTIMO_MODO_PANEL_TEMPORAL_ = 'PANEL_TEMPORAL_ULTIMO_MODO';

function guardarUltimoModoPanelTemporal_(modo, fechaInicioISO, fechaFinISO) {
  PropertiesService.getUserProperties().setProperty(
    PROPIEDAD_ULTIMO_MODO_PANEL_TEMPORAL_,
    JSON.stringify({ modo: modo, fechaInicioISO: fechaInicioISO || '', fechaFinISO: fechaFinISO || '' })
  );
}

function obtenerUltimoModoPanelTemporal() {
  var guardado = PropertiesService.getUserProperties().getProperty(PROPIEDAD_ULTIMO_MODO_PANEL_TEMPORAL_);
  if (!guardado) return { modo: 'HOY', fechaInicioISO: '', fechaFinISO: '' };
  try {
    return JSON.parse(guardado);
  } catch (e) {
    return { modo: 'HOY', fechaInicioISO: '', fechaFinISO: '' };
  }
}

function construirBloquePanelTemporal_(entidad, rango, incluirAtrasadasSiempre, hoy) {
  var config = CONFIG_PANEL_TEMPORAL_[entidad];
  var registros = listarRegistrosSeguro_(entidad, { ACTIVO: 'SÍ' });

  var pendientes = config.enriquecerResponsable(
    anadirDiasAtrasoPanelTemporal_(
      ordenarPanelTemporalPorFecha_(filtrarPendientesEnRango_(registros, config, rango, incluirAtrasadasSiempre), config, false),
      config, hoy
    )
  );
  var hechos = config.enriquecerResponsable(
    ordenarPanelTemporalPorFecha_(filtrarHechosEnRango_(registros, config, rango), config, true)
  );

  return {
    entidad: entidad,
    etiqueta: config.etiqueta,
    campoNombre: config.campoNombre,
    pendientes: agruparPorResponsablePanelTemporal_(pendientes),
    hechos: agruparPorResponsablePanelTemporal_(hechos)
  };
}

/* DIAS_ATRASO > 0 si finPlan ya pasó y el registro sigue sin cerrar -- ver "badge de urgencia en atrasadas". */
function anadirDiasAtrasoPanelTemporal_(lista, config, hoy) {
  return lista.map(function (item) {
    var finPlan = parsearFechaPanelTemporal_(item[config.finPlan]);
    var diasAtraso = (finPlan && finPlan < hoy) ? Math.floor((hoy - finPlan) / 86400000) : null;
    return Object.assign({}, item, { DIAS_ATRASO: diasAtraso });
  });
}

function calcularRangoPanelTemporal_(modo, fechaInicioISO, fechaFinISO) {
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (modo === 'HOY') {
    return { inicio: hoy, fin: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999) };
  }
  if (modo === 'ESTA_SEMANA') {
    return rangoSemanaPanelTemporal_(hoy, 0);
  }
  if (modo === 'SEMANA_SIGUIENTE') {
    return rangoSemanaPanelTemporal_(hoy, 7);
  }
  if (modo === 'RANGO') {
    if (!fechaInicioISO || !fechaFinISO) throw new Error('PANEL_TEMPORAL_RANGO_INCOMPLETO: faltan fecha de inicio o fin.');
    var inicio = new Date(fechaInicioISO);
    var fin = new Date(fechaFinISO);
    inicio.setHours(0, 0, 0, 0);
    fin.setHours(23, 59, 59, 999);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) throw new Error('PANEL_TEMPORAL_RANGO_INVALIDO: fecha no reconocida.');
    if (inicio > fin) throw new Error('PANEL_TEMPORAL_RANGO_INVALIDO: la fecha de inicio es posterior a la de fin.');
    return { inicio: inicio, fin: fin };
  }
  throw new Error('PANEL_TEMPORAL_MODO_DESCONOCIDO: ' + modo);
}

/* Lunes-Domingo de la semana que contiene (hoy + offsetDias). */
function rangoSemanaPanelTemporal_(hoy, offsetDias) {
  var referencia = new Date(hoy.getTime() + offsetDias * 86400000);
  var diaSemana = referencia.getDay(); // 0=domingo..6=sabado
  var diasDesdeLunes = (diaSemana === 0) ? 6 : diaSemana - 1;
  var lunes = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate() - diasDesdeLunes);
  var domingo = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 6, 23, 59, 59, 999);
  return { inicio: lunes, fin: domingo };
}

/*
 * Un registro "pendiente" toca el rango si su ventana plan
 * [inicioPlan..finPlan] se solapa con [rango.inicio..rango.fin], o
 * (solo si incluirAtrasadasSiempre, es decir modo HOY) si ya venció
 * antes del rango y sigue sin cerrar -- mismo criterio que
 * listarTareasRetrasadas() en DashboardService.js, generalizado a las
 * 4 entidades. DECISION no tiene inicioPlan -- su ventana es un único
 * día (FECHA_LIMITE). Un registro sin ninguna fecha usable no se puede
 * situar en el tiempo y se omite (mismo criterio que el resto de
 * paneles/informes ante datos incompletos).
 */
function filtrarPendientesEnRango_(registros, config, rango, incluirAtrasadasSiempre) {
  return registros.filter(function (r) {
    if (config.estadosCerrados.indexOf(r.ESTADO) !== -1) return false;

    var finPlan = parsearFechaPanelTemporal_(r[config.finPlan]);
    var inicioPlan = config.inicioPlan ? parsearFechaPanelTemporal_(r[config.inicioPlan]) : null;
    var ventanaInicio = inicioPlan || finPlan;
    var ventanaFin = finPlan || inicioPlan;
    if (!ventanaInicio || !ventanaFin) return false;

    var seSolapaConRango = ventanaInicio <= rango.fin && ventanaFin >= rango.inicio;
    var estaAtrasada = incluirAtrasadasSiempre && finPlan && finPlan < rango.inicio;

    return seSolapaConRango || estaAtrasada;
  });
}

function filtrarHechosEnRango_(registros, config, rango) {
  return registros.filter(function (r) {
    if (config.estadosCerrados.indexOf(r.ESTADO) === -1) return false;
    var fechaCierre = parsearFechaPanelTemporal_(r[config.finReal]);
    if (!fechaCierre) return false;
    return fechaCierre >= rango.inicio && fechaCierre <= rango.fin;
  });
}

function parsearFechaPanelTemporal_(valor) {
  if (!valor) return null;
  var fecha = (valor instanceof Date) ? valor : new Date(valor);
  return isNaN(fecha.getTime()) ? null : fecha;
}

function ordenarPanelTemporalPorFecha_(lista, config, porFechaReal) {
  var campo = porFechaReal ? config.finReal : config.finPlan;
  return lista.slice().sort(function (a, b) {
    var fa = parsearFechaPanelTemporal_(a[campo]);
    var fb = parsearFechaPanelTemporal_(b[campo]);
    if (!fa && !fb) return 0;
    if (!fa) return 1;
    if (!fb) return -1;
    return fa - fb;
  });
}

function agruparPorResponsablePanelTemporal_(lista) {
  var grupos = {};
  lista.forEach(function (item) {
    var clave = item.RESPONSABLE_NOMBRE || '(sin responsable)';
    if (!grupos[clave]) grupos[clave] = [];
    grupos[clave].push(item);
  });
  return Object.keys(grupos).sort().map(function (responsable) {
    return { responsable: responsable, items: grupos[responsable] };
  });
}

/* === Exportación CSV (mismo patrón que exportarGanttCSV) === */

function exportarPanelTemporalCSV(modo, fechaInicioISO, fechaFinISO) {
  var datos = obtenerPanelTemporal(modo, fechaInicioISO, fechaFinISO);
  var bloquesCsv = [];

  datos.bloques.forEach(function (bloque) {
    var config = CONFIG_PANEL_TEMPORAL_[bloque.entidad];
    bloquesCsv.push({
      titulo: bloque.etiqueta + ' -- pendiente',
      encabezados: ['Responsable', 'Nombre', 'Estado', 'Fecha límite/plan'],
      filas: aplanarGrupoPanelTemporalCsv_(bloque.pendientes, config, config.finPlan)
    });
    bloquesCsv.push({
      titulo: bloque.etiqueta + ' -- hecho',
      encabezados: ['Responsable', 'Nombre', 'Estado', 'Fecha de cierre'],
      filas: aplanarGrupoPanelTemporalCsv_(bloque.hechos, config, config.finReal)
    });
  });

  var nombre = 'PANEL_TEMPORAL_' + (ETIQUETAS_MODO_PANEL_TEMPORAL_[modo] || modo).replace(/\s+/g, '_') + '_' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('INFORME', nombre, 'EXPORTAR_PANEL_TEMPORAL', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombre, contenidoCsv: String.fromCharCode(0xFEFF) + bloquesACsv_(bloquesCsv) };
}

function aplanarGrupoPanelTemporalCsv_(grupos, config, campoFecha) {
  var filas = [];
  grupos.forEach(function (grupo) {
    grupo.items.forEach(function (item) {
      filas.push([grupo.responsable, item[config.campoNombre] || item.ID, item.ESTADO, formatearFechaCsv_(item[campoFecha])]);
    });
  });
  return filas;
}

function abrirDialogoExportarPanelTemporalCSV(modo, fechaInicioISO, fechaFinISO) {
  var resultado = exportarPanelTemporalCSV(modo, fechaInicioISO, fechaFinISO);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}

/* === Exportación PDF (mismo patrón que abrirDialogoExportarPDF -- imprimir/guardar desde el navegador) === */

function abrirDialogoExportarPanelTemporalPDF(modo, fechaInicioISO, fechaFinISO) {
  var datos = obtenerPanelTemporal(modo, fechaInicioISO, fechaFinISO);
  var html = generarHtmlPanelTemporalImprimible_(datos);
  registrarHistorial('INFORME', 'PANEL_TEMPORAL_' + modo, 'EXPORTAR_PANEL_TEMPORAL', [], { origen: 'UI', formato: 'PDF_IMPRESION' });
  var output = HtmlService.createHtmlOutput(html).setWidth(820).setHeight(600);
  SpreadsheetApp.getUi().showModelessDialog(output, 'Panel temporal -- usa Imprimir para guardar como PDF');
}

function generarHtmlPanelTemporalImprimible_(datos) {
  var etiquetaModo = ETIQUETAS_MODO_PANEL_TEMPORAL_[datos.modo] || datos.modo;
  var subtitulo = etiquetaModo + ' -- ' + formatearFechaCsv_(datos.rangoInicio) + ' a ' + formatearFechaCsv_(datos.rangoFin);

  var cuerpo = datos.bloques.map(function (bloque) {
    return '<h2>' + escaparHtmlServer_(bloque.etiqueta) + '</h2>' +
      '<h3>Pendiente</h3>' + tablaGrupoPanelTemporalHtml_(bloque, bloque.pendientes, false) +
      '<h3>Hecho</h3>' + tablaGrupoPanelTemporalHtml_(bloque, bloque.hechos, true);
  }).join('');

  var alertas = '';
  if (datos.alertas.sobreasignaciones.length > 0 || datos.alertas.recursosSinCompetenciaDisponible.length > 0) {
    alertas = '<h2>Alertas</h2><p>' +
      datos.alertas.sobreasignaciones.length + ' persona(s) sobreasignada(s) · ' +
      datos.alertas.recursosSinCompetenciaDisponible.length + ' recurso(s) sin técnico disponible.</p>';
  }

  return construirDocumentoInformeImprimible_('Panel temporal: ' + etiquetaModo, subtitulo, alertas + cuerpo);
}

function tablaGrupoPanelTemporalHtml_(bloque, grupos, esFechaReal) {
  if (!grupos || grupos.length === 0) return '<p>(sin elementos)</p>';
  var config = CONFIG_PANEL_TEMPORAL_[bloque.entidad];
  var campoFecha = esFechaReal ? config.finReal : config.finPlan;
  var filas = '';
  grupos.forEach(function (grupo) {
    grupo.items.forEach(function (item) {
      filas += '<tr><td>' + escaparHtmlServer_(grupo.responsable) + '</td>' +
        '<td>' + enlaceEdicion_(bloque.entidad, item.ID, item[bloque.campoNombre] || item.ID) + '</td>' +
        '<td>' + escaparHtmlServer_(item.ESTADO) + '</td>' +
        '<td>' + formatearFechaCsv_(item[campoFecha]) + '</td></tr>';
    });
  });
  return '<table><tr><th>Responsable</th><th>Nombre</th><th>Estado</th><th>Fecha</th></tr>' + filas + '</table>';
}
