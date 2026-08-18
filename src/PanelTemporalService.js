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
    .setTitle('Agenda operativa')
    .setWidth(440);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * modo: 'HOY' | 'ESTA_SEMANA' | 'SEMANA_SIGUIENTE' | 'RANGO'.
 * fechaInicioISO/fechaFinISO: solo se usan (y son obligatorios) en modo
 * 'RANGO' -- 'yyyy-MM-dd', tal cual los da un <input type="date">.
 * filtroCampanaId/filtroProyectoId: opcionales, mutuamente excluyentes
 * (si hay proyecto, gana sobre campaña) -- ver "buscador por campaña o
 * proyecto".
 */
function obtenerPanelTemporal(modo, fechaInicioISO, fechaFinISO, filtroCampanaId, filtroProyectoId) {
  var rango = calcularRangoPanelTemporal_(modo, fechaInicioISO, fechaFinISO);
  var incluirAtrasadasSiempre = (modo === 'HOY');
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  var entidades = ['TAREA', 'PROCESO'];
  if (moduloInstalado_('SEGUIMIENTO')) entidades = entidades.concat(['INCIDENCIA', 'DECISION']);

  var resolutorContexto = (filtroCampanaId || filtroProyectoId) ? construirResolutorContextoPanelTemporal_() : null;

  var bloques = entidades.map(function (entidad) {
    return construirBloquePanelTemporal_(
      entidad, rango, incluirAtrasadasSiempre, hoy,
      resolutorContexto ? resolutorContexto[entidad] : null, filtroCampanaId, filtroProyectoId
    );
  });

  var totalSinFecha = bloques.reduce(function (acc, b) {
    return acc + b.sinFecha.reduce(function (a, g) { return a + g.items.length; }, 0);
  }, 0);

  var resultado = {
    modo: modo,
    rangoInicio: rango.inicio,
    rangoFin: rango.fin,
    bloques: bloques,
    bloqueos: obtenerBloqueosPanelTemporal_(),
    alertas: {
      sobreasignaciones: listarSobreasignaciones(),
      recursosSinCompetenciaDisponible: listarRecursosSinCompetenciaDisponible(),
      totalSinFechaPlanificada: totalSinFecha
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

/* Campañas/proyectos activos, para el selector del buscador (ver conversación -- "buscador por campaña o proyecto"). */
function obtenerOpcionesFiltroPanelTemporal() {
  return {
    campanas: listarRegistrosSeguro_('CAMPANA', { ACTIVO: 'SÍ' }).map(function (c) { return { id: c.ID, etiqueta: c.NOMBRE }; }),
    proyectos: listarRegistrosSeguro_('PROYECTO', { ACTIVO: 'SÍ' }).map(function (p) { return { id: p.ID, etiqueta: p.NOMBRE }; })
  };
}

/*
 * Resolución de contexto (campaña/proyecto) por entidad -- ver
 * "buscador por campaña o proyecto". Deliberadamente NO reutiliza
 * obtenerOpcionesFiltroGantt()/construirMapaContextoPorProducto_
 * (DesviacionService.js): son módulo GANTT, y Agenda Operativa es
 * módulo CORE (siempre instalado) -- llamarlas crearía una dependencia
 * cruzada que rompería en cualquier cliente sin GANTT instalado (mismo
 * tipo de gap ya corregido una vez, ver "limpiar gaps cruzados de
 * módulo"). Versión propia, autocontenida en CORE.
 *
 * TAREA/PROCESO llegan vía PRODUCTO (PRODUCTO_ID -> PROYECTO_PRODUCTO
 * activa -> PROYECTO_ID -> CAMPANA_ID; TAREA necesita un salto extra
 * TAREA.PROCESO_ID -> PROCESO.PRODUCTO_ID). INCIDENCIA/DECISION ya
 * guardan PROYECTO_ID directo en el propio registro -- más simple, sin
 * pasar por PRODUCTO.
 */
function construirResolutorContextoPanelTemporal_() {
  var proyectoPorProducto = {};
  listarRegistros('PROYECTO_PRODUCTO', { ACTIVO: 'SÍ' }).forEach(function (rel) {
    if (!proyectoPorProducto[rel.PRODUCTO_ID]) proyectoPorProducto[rel.PRODUCTO_ID] = rel.PROYECTO_ID;
  });

  var productoPorProceso = {};
  listarRegistros('PROCESO', {}).forEach(function (p) { productoPorProceso[p.ID] = p.PRODUCTO_ID; });

  var proyectosPorId = {};
  listarRegistros('PROYECTO', {}).forEach(function (p) { proyectosPorId[p.ID] = p; });

  function contextoVacio_() {
    return { proyectoId: '', campanaId: '' };
  }

  function contextoDesdeProyectoId_(proyectoId) {
    var proyecto = proyectosPorId[proyectoId];
    if (!proyecto) return contextoVacio_();
    return { proyectoId: proyecto.ID, campanaId: proyecto.CAMPANA_ID || '' };
  }

  return {
    TAREA: function (registro) {
      return contextoDesdeProyectoId_(proyectoPorProducto[productoPorProceso[registro.PROCESO_ID]]);
    },
    PROCESO: function (registro) {
      return contextoDesdeProyectoId_(proyectoPorProducto[registro.PRODUCTO_ID]);
    },
    INCIDENCIA: function (registro) {
      return contextoDesdeProyectoId_(registro.PROYECTO_ID);
    },
    DECISION: function (registro) {
      return contextoDesdeProyectoId_(registro.PROYECTO_ID);
    }
  };
}

/*
 * Bloqueos (ver conversación -- "hace falta esta competencia para
 * este proceso", "hace falta este espacio para esta tarea", ampliado
 * después a "decisión pendiente bloquea un proyecto", "material
 * insuficiente para una tarea", "pedido a proveedor retrasado",
 * "proveedor inactivo en un material crítico" y "incidencia crítica
 * sin acción correctora" -- asesoría estratégica 2026-08-17/18, ver
 * VISION_MISION.md y ROADMAP_BACKLOG_MEJORAS.md Fase O4): a diferencia
 * del resto del panel (organizado por fecha), esto no depende del
 * rango consultado -- un bloqueo lo es hoy, mañana y la semana que
 * viene por igual, así que tampoco se filtra por campaña/proyecto
 * (mismo criterio que ya tenían competencia/recurso).
 *
 * Forma común de cada entrada: {tipo, entidad, entidadId,
 * entidadNombre, detalle} -- 'entidad' es el nombre MVP real (TAREA,
 * DECISION, MATERIAL...) para que el clic en el panel abra la ficha
 * correcta con seleccionarYAbrirEdicion(entidad, id) en vez de asumir
 * siempre TAREA.
 */
function obtenerBloqueosPanelTemporal_() {
  var bloqueos = [];

  if (moduloInstalado_('OPERATIVA')) {
    listarAsignacionesSinEncajeCompetencia().forEach(function (a) {
      bloqueos.push({
        tipo: 'competencia',
        entidad: 'TAREA',
        entidadId: a.TAREA_ID,
        entidadNombre: a.TAREA_NOMBRE,
        detalle: (a.PERSONA_NOMBRE || '(sin persona)') + ' no tiene la competencia "' + a.COMPETENCIA_NOMBRE + '"' +
          (a.NIVEL_EXIGIDO ? ' (nivel mínimo ' + a.NIVEL_EXIGIDO + ')' : '')
      });
    });

    listarAsignacionesSinEncajeRecurso().forEach(function (n) {
      var requisito = [n.CLASE_RECURSO_REQUERIDA, n.CATEGORIA_RECURSO_REQUERIDA].filter(function (v) { return v; }).join(' / ') || 'recurso';
      bloqueos.push({
        tipo: 'recurso',
        entidad: 'TAREA',
        entidadId: n.TAREA_ID,
        entidadNombre: n.TAREA_NOMBRE,
        detalle: 'Faltan ' + requisito + ' (' + n.CANTIDAD_ASIGNADA + '/' + n.CANTIDAD_MINIMA + ' asignado(s))'
      });
    });
  }

  if (moduloInstalado_('SEGUIMIENTO')) {
    listarDecisionesPendientes().filter(function (d) { return d.VENCIDA && d.PROYECTO_ID; }).forEach(function (d) {
      bloqueos.push({
        tipo: 'decision',
        entidad: 'DECISION',
        entidadId: d.ID,
        entidadNombre: d.TITULO,
        detalle: 'Decisión pendiente vencida (' + (d.FECHA_LIMITE || 'sin fecha') + ') bloqueando el proyecto ' + d.PROYECTO_ID
      });
    });

    listarIncidenciasAbiertas().filter(function (i) {
      return !String(i.ACCION_CORRECTORA || '').trim() &&
        (i.PRIORIDAD === 'Crítico' || i.TIPO === 'Seguridad');
    }).forEach(function (i) {
      bloqueos.push({
        tipo: 'incidencia',
        entidad: 'INCIDENCIA',
        entidadId: i.ID,
        entidadNombre: i.TITULO,
        detalle: 'Incidencia ' + (i.PRIORIDAD === 'Crítico' ? 'crítica' : 'de seguridad') + ' abierta sin acción correctora'
      });
    });
  }

  var materialesPorId_ = {};

  if (moduloInstalado_('COMPRAS')) {
    listarRegistrosSeguro_('MATERIAL', { ACTIVO: 'SÍ' }).forEach(function (m) { materialesPorId_[m.ID] = m; });

    listarRegistrosSeguro_('TAREA_MATERIAL', { ACTIVO: 'SÍ' }).filter(function (tm) {
      return tm.ESTADO === 'Planificada' || tm.ESTADO === 'Activa';
    }).forEach(function (tm) {
      var material = materialesPorId_[tm.MATERIAL_ID];
      if (!material) return;
      var pendiente = Number(tm.CANTIDAD_PREVISTA || 0) - Number(tm.CANTIDAD_CONSUMIDA || 0);
      var disponible = Number(material.STOCK_ACTUAL || 0) - Number(material.CANTIDAD_RESERVADA || 0);
      if (pendiente > 0 && pendiente > disponible) {
        bloqueos.push({
          tipo: 'material',
          entidad: 'TAREA',
          entidadId: tm.TAREA_ID,
          entidadNombre: tm.TAREA_ID,
          detalle: 'Faltan ' + (pendiente - disponible) + ' ' + (tm.UNIDAD || '') + ' de ' + (material.NOMBRE || tm.MATERIAL_ID) +
            ' (necesita ' + pendiente + ', disponible ' + disponible + ')'
        });
      }
    });

    var proveedoresPorId_ = {};
    listarRegistrosSeguro_('PROVEEDOR', {}).forEach(function (p) { proveedoresPorId_[p.ID] = p; });

    var hoy_ = new Date();
    hoy_.setHours(0, 0, 0, 0);

    listarRegistrosSeguro_('PEDIDO_PROVEEDOR', { ACTIVO: 'SÍ' }).filter(function (pp) {
      return pp.ESTADO !== 'Recibido completo' && pp.ESTADO !== 'Cancelado' && pp.FECHA_PEDIDO;
    }).forEach(function (pp) {
      var proveedor = proveedoresPorId_[pp.PROVEEDOR_ID];
      var plazoDias = Number((proveedor && proveedor.PLAZO_ENTREGA_DIAS) || 0);
      if (!plazoDias) return;
      var fechaEsperada = new Date(pp.FECHA_PEDIDO);
      fechaEsperada.setDate(fechaEsperada.getDate() + plazoDias);
      if (fechaEsperada < hoy_) {
        bloqueos.push({
          tipo: 'pedido_retrasado',
          entidad: 'PEDIDO_PROVEEDOR',
          entidadId: pp.ID,
          entidadNombre: (proveedor && proveedor.NOMBRE) || pp.PROVEEDOR_ID,
          detalle: 'Pedido a proveedor sin recibir, esperado hace ' +
            Math.round((hoy_ - fechaEsperada) / 86400000) + ' día(s)'
        });
      }
    });

    var proveedorMaterialActivo_ = {};
    listarRegistrosSeguro_('PROVEEDOR_MATERIAL', { ACTIVO: 'SÍ', ESTADO: 'Activo' }).forEach(function (pm) {
      var proveedor = proveedoresPorId_[pm.PROVEEDOR_ID];
      if (proveedor && proveedor.ESTADO === 'Activo') {
        proveedorMaterialActivo_[pm.MATERIAL_ID] = true;
      }
    });

    listarRegistrosSeguro_('PROVEEDOR_MATERIAL', { ACTIVO: 'SÍ' }).filter(function (pm) {
      var proveedor = proveedoresPorId_[pm.PROVEEDOR_ID];
      return proveedor && proveedor.ESTADO !== 'Activo' && !proveedorMaterialActivo_[pm.MATERIAL_ID];
    }).forEach(function (pm) {
      var material = materialesPorId_[pm.MATERIAL_ID];
      if (!material) return;
      bloqueos.push({
        tipo: 'proveedor_inactivo',
        entidad: 'MATERIAL',
        entidadId: material.ID,
        entidadNombre: material.NOMBRE,
        detalle: 'Sin proveedor activo (' + (proveedoresPorId_[pm.PROVEEDOR_ID].NOMBRE || pm.PROVEEDOR_ID) + ' inactivo, sin alternativa)'
      });
    });
  }

  return bloqueos;
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

function construirBloquePanelTemporal_(entidad, rango, incluirAtrasadasSiempre, hoy, resolverContexto, filtroCampanaId, filtroProyectoId) {
  var config = CONFIG_PANEL_TEMPORAL_[entidad];
  var registros = listarRegistrosSeguro_(entidad, { ACTIVO: 'SÍ' });

  if (resolverContexto && (filtroCampanaId || filtroProyectoId)) {
    registros = registros.filter(function (r) {
      var contexto = resolverContexto(r);
      return filtroProyectoId ? contexto.proyectoId === filtroProyectoId : contexto.campanaId === filtroCampanaId;
    });
  }

  var pendientes = config.enriquecerResponsable(
    anadirDiasAtrasoPanelTemporal_(
      ordenarPanelTemporalPorFecha_(filtrarPendientesEnRango_(registros, config, rango, incluirAtrasadasSiempre), config, false),
      config, hoy
    )
  );
  var hechos = config.enriquecerResponsable(
    ordenarPanelTemporalPorFecha_(filtrarHechosEnRango_(registros, config, rango), config, true)
  );
  var sinFecha = config.enriquecerResponsable(filtrarSinFechaAbiertos_(registros, config));

  return {
    entidad: entidad,
    etiqueta: config.etiqueta,
    campoNombre: config.campoNombre,
    pendientes: agruparPorResponsablePanelTemporal_(pendientes),
    hechos: agruparPorResponsablePanelTemporal_(hechos),
    sinFecha: agruparPorResponsablePanelTemporal_(sinFecha),
    diagnostico: diagnosticarPanelTemporal_(registros, config)
  };
}

/*
 * Ver conversación -- "salen datos pero son poco valiosos": con 0/16
 * tareas y 0/8 procesos con fecha planificada, el panel por rango
 * quedaba vacío de verdad -- no por un bug, sino porque no hay con qué
 * situarlos en el tiempo. En vez de dejarlos invisibles para siempre
 * (el mismo hueco que ya detecta listarProcesosSinFechas() en
 * DashboardService.js, pero sin agrupar por responsable ni permitir
 * editar desde ahí), se listan aparte como acción pendiente real:
 * "esto sigue abierto y nadie le ha puesto fecha". No depende del
 * rango consultado -- un registro sin fecha lo está en cualquier modo.
 */
function filtrarSinFechaAbiertos_(registros, config) {
  return registros.filter(function (r) {
    if (config.estadosCerrados.indexOf(r.ESTADO) !== -1) return false;
    var finPlan = parsearFechaPanelTemporal_(r[config.finPlan]);
    var inicioPlan = config.inicioPlan ? parsearFechaPanelTemporal_(r[config.inicioPlan]) : null;
    return !finPlan && !inicioPlan;
  });
}

/*
 * Ver conversación -- "siguen sin aparecer datos": sin esto, un "Nada
 * que reportar" es indistinguible entre "no hay ninguna tarea activa"
 * y "hay tareas activas pero sin fecha utilizable/estado inesperado" --
 * el operador (y quien depura) no puede saber cuál es sin mirar la
 * hoja directamente. No cambia ningún filtro, solo cuenta antes de
 * aplicarlos para poder mostrarlo cuando el bloque queda vacío.
 */
function diagnosticarPanelTemporal_(registros, config) {
  var totalActivos = registros.length;
  var conFechaUsable = registros.filter(function (r) {
    var finPlan = parsearFechaPanelTemporal_(r[config.finPlan]);
    var inicioPlan = config.inicioPlan ? parsearFechaPanelTemporal_(r[config.inicioPlan]) : null;
    return !!(finPlan || inicioPlan);
  }).length;
  var abiertos = registros.filter(function (r) {
    return config.estadosCerrados.indexOf(r.ESTADO) === -1;
  }).length;
  return { totalActivos: totalActivos, abiertos: abiertos, conFechaUsable: conFechaUsable };
}

/* DIAS_ATRASO > 0 si finPlan ya pasó y el registro sigue sin cerrar -- ver "badge de urgencia en atrasadas". */
function anadirDiasAtrasoPanelTemporal_(lista, config, hoy) {
  return lista.map(function (item) {
    var finPlan = parsearFechaPanelTemporal_(item[config.finPlan]);
    var inicioPlan = config.inicioPlan ? parsearFechaPanelTemporal_(item[config.inicioPlan]) : null;
    var ventanaFin = finPlan || inicioPlan;
    var diasAtraso = (ventanaFin && ventanaFin < hoy) ? Math.floor((hoy - ventanaFin) / 86400000) : null;
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
 *
 * "Atrasada" se evalúa sobre ventanaFin, no sobre finPlan directamente
 * (ver conversación -- "Hoy no arroja resultados" con datos reales):
 * un PROCESO/TAREA "En proceso" con FECHA_INICIO_PLAN en el pasado pero
 * FECHA_FIN_PLAN todavía sin rellenar tenía finPlan vacío -> nunca
 * contaba como atrasada aunque llevara días abierta. ventanaFin ya cae
 * de vuelta a inicioPlan cuando finPlan falta, así que reutilizarla
 * cubre ese caso sin duplicar el fallback.
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
    var estaAtrasada = incluirAtrasadasSiempre && ventanaFin < rango.inicio;

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

function exportarPanelTemporalCSV(modo, fechaInicioISO, fechaFinISO, filtroCampanaId, filtroProyectoId) {
  var datos = obtenerPanelTemporal(modo, fechaInicioISO, fechaFinISO, filtroCampanaId, filtroProyectoId);
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
    bloquesCsv.push({
      titulo: bloque.etiqueta + ' -- sin fecha planificada',
      encabezados: ['Responsable', 'Nombre', 'Estado'],
      filas: aplanarGrupoPanelTemporalCsv_(bloque.sinFecha, config, null)
    });
  });

  if (datos.bloqueos.length > 0) {
    bloquesCsv.push({
      titulo: 'Bloqueos',
      encabezados: ['Tipo', 'Tarea', 'Detalle'],
      filas: datos.bloqueos.map(function (b) { return [b.tipo, b.tareaNombre, b.detalle]; })
    });
  }

  var nombre = 'AGENDA_OPERATIVA_' + (ETIQUETAS_MODO_PANEL_TEMPORAL_[modo] || modo).replace(/\s+/g, '_') + '_' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('INFORME', nombre, 'EXPORTAR_PANEL_TEMPORAL', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombre, contenidoCsv: String.fromCharCode(0xFEFF) + bloquesACsv_(bloquesCsv) };
}

function aplanarGrupoPanelTemporalCsv_(grupos, config, campoFecha) {
  var filas = [];
  grupos.forEach(function (grupo) {
    grupo.items.forEach(function (item) {
      var fila = [grupo.responsable, item[config.campoNombre] || item.ID, item.ESTADO];
      if (campoFecha) fila.push(formatearFechaCsv_(item[campoFecha]));
      filas.push(fila);
    });
  });
  return filas;
}

function abrirDialogoExportarPanelTemporalCSV(modo, fechaInicioISO, fechaFinISO, filtroCampanaId, filtroProyectoId) {
  var resultado = exportarPanelTemporalCSV(modo, fechaInicioISO, fechaFinISO, filtroCampanaId, filtroProyectoId);
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}

/* === Exportación PDF (mismo patrón que abrirDialogoExportarPDF -- imprimir/guardar desde el navegador) === */

function abrirDialogoExportarPanelTemporalPDF(modo, fechaInicioISO, fechaFinISO, filtroCampanaId, filtroProyectoId) {
  var datos = obtenerPanelTemporal(modo, fechaInicioISO, fechaFinISO, filtroCampanaId, filtroProyectoId);
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
      '<h3>Pendiente</h3>' + tablaGrupoPanelTemporalHtml_(bloque, bloque.pendientes, 'plan') +
      '<h3>Hecho</h3>' + tablaGrupoPanelTemporalHtml_(bloque, bloque.hechos, 'real') +
      '<h3>Sin fecha planificada</h3>' + tablaGrupoPanelTemporalHtml_(bloque, bloque.sinFecha, 'sinfecha');
  }).join('');

  var alertas = '';
  if (datos.alertas.sobreasignaciones.length > 0 || datos.alertas.recursosSinCompetenciaDisponible.length > 0 || datos.alertas.totalSinFechaPlanificada > 0) {
    alertas = '<h2>Alertas</h2><p>' +
      datos.alertas.sobreasignaciones.length + ' persona(s) sobreasignada(s) · ' +
      datos.alertas.recursosSinCompetenciaDisponible.length + ' recurso(s) sin técnico disponible · ' +
      datos.alertas.totalSinFechaPlanificada + ' registro(s) abierto(s) sin fecha planificada.</p>';
  }

  var bloqueosHtml = '';
  if (datos.bloqueos.length > 0) {
    bloqueosHtml = '<h2>Bloqueos</h2><table><tr><th>Tarea</th><th>Bloqueo</th></tr>' +
      datos.bloqueos.map(function (b) {
        return '<tr><td>' + enlaceEdicion_('TAREA', b.tareaId, b.tareaNombre) + '</td><td>' + escaparHtmlServer_(b.detalle) + '</td></tr>';
      }).join('') + '</table>';
  }

  return construirDocumentoInformeImprimible_('Agenda operativa: ' + etiquetaModo, subtitulo, alertas + bloqueosHtml + cuerpo);
}

/*
 * Sin columna Fecha en la tabla "sin fecha" (ver conversación --
 * "analiza los resultados, qué mejoramos": el CSV ya omitía esa
 * columna porque no aporta nada repetir "(sin fecha)" en cada fila de
 * una tabla que ya se titula así -- el PDF la mostraba siempre,
 * inconsistente con el CSV. Ahora ambos coinciden.
 */
function tablaGrupoPanelTemporalHtml_(bloque, grupos, modoFecha) {
  if (!grupos || grupos.length === 0) return '<p>(sin elementos)</p>';
  var config = CONFIG_PANEL_TEMPORAL_[bloque.entidad];
  var campoFecha = (modoFecha === 'real') ? config.finReal : (modoFecha === 'plan') ? config.finPlan : null;
  var filas = '';
  grupos.forEach(function (grupo) {
    grupo.items.forEach(function (item) {
      filas += '<tr><td>' + escaparHtmlServer_(grupo.responsable) + '</td>' +
        '<td>' + enlaceEdicion_(bloque.entidad, item.ID, item[bloque.campoNombre] || item.ID) + '</td>' +
        '<td>' + escaparHtmlServer_(item.ESTADO) + '</td>' +
        (campoFecha ? '<td>' + formatearFechaCsv_(item[campoFecha]) + '</td>' : '') +
        '</tr>';
    });
  });
  var encabezadoFecha = campoFecha ? '<th>Fecha</th>' : '';
  return '<table><tr><th>Responsable</th><th>Nombre</th><th>Estado</th>' + encabezadoFecha + '</tr>' + filas + '</table>';
}
