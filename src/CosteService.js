/**
 * Eje económico, Fase 2 -- motor de coste real por categoría,
 * comparable contra PRESUPUESTO.IMPORTE_PREVISTO (Fase 1). 3 fuentes,
 * cada una con su propio criterio ya decidido en conversación:
 *
 *  - Materiales: ESTIMADO, no REAL -- no hay vínculo Pedido->Proyecto
 *    en el modelo (PEDIDO_PROVEEDOR compra un MATERIAL en general, no
 *    "para el proyecto X"). Se usa PRODUCTO_MATERIAL.CANTIDAD_PREVISTA
 *    x precio de referencia del proveedor preferente.
 *  - Recursos: coste diario (amortización o periódico) x DÍAS de uso
 *    real vía TAREA_RECURSO -- "días", no "horas": TAREA_RECURSO solo
 *    guarda FECHA_INICIO/FECHA_FIN, no un dato de horas reales de uso.
 *  - Actividad/Otros: suma directa de COSTE (entidad genérica).
 *
 * "Ámbito" = el propio nivel consultado + sus descendientes directos
 * en la jerarquía de producción (Campaña -> sus Proyectos -> sus
 * Productos). Costes vinculados a un Recurso (COSTE.ENTIDAD_TIPO=
 * 'Recurso') quedan FUERA del ámbito de una Campaña/Proyecto/Producto
 * a propósito: un recurso no pertenece a un proyecto concreto, sumarlo
 * ahí sería una atribución arbitraria que este motor no hace.
 */

function resolverAmbitoCoste_(entidadTipo, entidadId) {
  var campanaId = null, proyectosIds = [], productosIds = [];

  if (entidadTipo === 'Producto') {
    productosIds = [entidadId];
    var relacion = listarRegistros('PROYECTO_PRODUCTO', { ACTIVO: 'SÍ', PRODUCTO_ID: entidadId })[0];
    if (relacion) {
      proyectosIds = [relacion.PROYECTO_ID];
      var proyecto = obtenerRegistroPorId('PROYECTO', relacion.PROYECTO_ID);
      campanaId = proyecto ? proyecto.CAMPANA_ID : null;
    }
  } else if (entidadTipo === 'Proyecto') {
    proyectosIds = [entidadId];
    var proy = obtenerRegistroPorId('PROYECTO', entidadId);
    campanaId = proy ? proy.CAMPANA_ID : null;
    productosIds = listarRegistros('PROYECTO_PRODUCTO', { ACTIVO: 'SÍ', PROYECTO_ID: entidadId }).map(function (r) { return r.PRODUCTO_ID; });
  } else if (entidadTipo === 'Campaña') {
    campanaId = entidadId;
    proyectosIds = listarRegistros('PROYECTO', { ACTIVO: 'SÍ', CAMPANA_ID: entidadId }).map(function (p) { return p.ID; });
    var relacionesProyectoProducto = listarRegistros('PROYECTO_PRODUCTO', { ACTIVO: 'SÍ' })
      .filter(function (r) { return proyectosIds.indexOf(r.PROYECTO_ID) !== -1; });
    productosIds = relacionesProyectoProducto.map(function (r) { return r.PRODUCTO_ID; });
  } else {
    throw new Error('ERROR_COSTE: nivel no soportado: ' + entidadTipo);
  }

  return { campanaId: campanaId, proyectosIds: proyectosIds, productosIds: productosIds };
}

function calcularCosteMaterialesEstimado_(productosIds) {
  var lineas = listarRegistrosSeguro_('PRODUCTO_MATERIAL', { ACTIVO: 'SÍ' })
    .filter(function (pm) { return productosIds.indexOf(pm.PRODUCTO_ID) !== -1; });

  if (lineas.length === 0) return { total: 0, sinPrecioReferencia: [] };

  var materialesPorId = {};
  listarRegistrosSeguro_('MATERIAL', {}).forEach(function (m) { materialesPorId[m.ID] = m; });

  var preciosPorMaterial = {};
  listarRegistrosSeguro_('PROVEEDOR_MATERIAL', { ACTIVO: 'SÍ' }).forEach(function (pm) {
    if (!Object.prototype.hasOwnProperty.call(preciosPorMaterial, pm.MATERIAL_ID) || pm.ES_PREFERENTE === 'SÍ') {
      preciosPorMaterial[pm.MATERIAL_ID] = Number(pm.PRECIO_UNITARIO) || 0;
    }
  });

  var total = 0;
  var sinPrecioReferencia = [];

  lineas.forEach(function (linea) {
    var precio = preciosPorMaterial[linea.MATERIAL_ID];
    var cantidad = Number(linea.CANTIDAD_PREVISTA) || 0;
    if (precio === undefined) {
      var material = materialesPorId[linea.MATERIAL_ID];
      sinPrecioReferencia.push({ materialId: linea.MATERIAL_ID, materialNombre: material ? material.NOMBRE : linea.MATERIAL_ID });
      return;
    }
    total += cantidad * precio;
  });

  return { total: Math.round(total * 100) / 100, sinPrecioReferencia: sinPrecioReferencia };
}

function costeDiarioRecurso_(recurso) {
  if (recurso.MODO_COSTE === 'Amortización') {
    var adquisicion = Number(recurso.COSTE_ADQUISICION) || 0;
    var vidaUtil = Number(recurso.VIDA_UTIL_ANOS) || 0;
    if (adquisicion > 0 && vidaUtil > 0) return adquisicion / (vidaUtil * 365);
  } else if (recurso.MODO_COSTE === 'Periódico') {
    var periodico = Number(recurso.COSTE_PERIODICO) || 0;
    if (periodico > 0) return periodico / (recurso.PERIODICIDAD_COSTE === 'Mensual' ? 30 : 365);
  }
  return 0;
}

function diasEntreFechas_(inicio, fin) {
  var i = new Date(inicio); i.setHours(0, 0, 0, 0);
  var f = new Date(fin); f.setHours(0, 0, 0, 0);
  var dias = Math.round((f - i) / (24 * 60 * 60 * 1000)) + 1;
  return dias > 0 ? dias : 0;
}

function resolverTareasIdsDeAmbito_(productosIds) {
  if (productosIds.length === 0) return [];

  var procesosIds = listarRegistros('PROCESO', { ACTIVO: 'SÍ' })
    .filter(function (p) { return productosIds.indexOf(p.PRODUCTO_ID) !== -1; })
    .map(function (p) { return p.ID; });

  return listarRegistros('TAREA', { ACTIVO: 'SÍ' })
    .filter(function (t) { return procesosIds.indexOf(t.PROCESO_ID) !== -1; })
    .map(function (t) { return t.ID; });
}

function calcularCosteRecursosAtribuido_(productosIds) {
  if (productosIds.length === 0) return { total: 0, detallePorRecurso: [] };

  var tareasIds = resolverTareasIdsDeAmbito_(productosIds);

  var diasPorRecurso = {};
  listarRegistrosSeguro_('TAREA_RECURSO', { ACTIVO: 'SÍ' })
    .filter(function (tr) { return tareasIds.indexOf(tr.TAREA_ID) !== -1; })
    .forEach(function (tr) {
      if (!tr.FECHA_INICIO || !tr.FECHA_FIN) return;
      var dias = diasEntreFechas_(tr.FECHA_INICIO, tr.FECHA_FIN);
      diasPorRecurso[tr.RECURSO_ID] = (diasPorRecurso[tr.RECURSO_ID] || 0) + dias;
    });

  var total = 0;
  var detallePorRecurso = Object.keys(diasPorRecurso).map(function (recursoId) {
    var recurso = obtenerRegistroPorId('RECURSO', recursoId);
    var dias = diasPorRecurso[recursoId];
    var costeDiario = recurso ? costeDiarioRecurso_(recurso) : 0;
    var coste = Math.round(costeDiario * dias * 100) / 100;
    total += coste;
    return {
      recursoId: recursoId,
      recursoNombre: recurso ? recurso.NOMBRE : recursoId,
      diasDeUso: dias,
      costeDiario: Math.round(costeDiario * 100) / 100,
      coste: coste,
      sinDatosDeCoste: !recurso || recurso.MODO_COSTE === 'Sin coste' || !recurso.MODO_COSTE
    };
  }).sort(function (a, b) { return b.coste - a.coste; });

  return { total: Math.round(total * 100) / 100, detallePorRecurso: detallePorRecurso };
}

/*
 * Lookup "¿esta fila (ENTIDAD_TIPO/ENTIDAD_ID) pertenece al ámbito?"
 * compartido por COSTE/PRESUPUESTO/FUENTE_FINANCIACION -- las 3
 * entidades polimórficas del eje económico usan el mismo criterio de
 * pertenencia (Campaña + sus Proyectos + sus Productos).
 */
function construirPerteneceAlAmbito_(ambito) {
  var nodos = [];
  if (ambito.campanaId) nodos.push({ tipo: 'Campaña', id: ambito.campanaId });
  ambito.proyectosIds.forEach(function (id) { nodos.push({ tipo: 'Proyecto', id: id }); });
  ambito.productosIds.forEach(function (id) { nodos.push({ tipo: 'Producto', id: id }); });

  var perteneceAlAmbito_ = {};
  nodos.forEach(function (n) { perteneceAlAmbito_[n.tipo + '|' + n.id] = true; });
  return perteneceAlAmbito_;
}

function calcularCosteActividadPorCategoria_(ambito) {
  var perteneceAlAmbito_ = construirPerteneceAlAmbito_(ambito);

  var porCategoria = {};
  listarRegistros('COSTE', { ACTIVO: 'SÍ' })
    .filter(function (c) { return perteneceAlAmbito_[c.ENTIDAD_TIPO + '|' + c.ENTIDAD_ID]; })
    .forEach(function (c) {
      var categoria = c.CATEGORIA || 'Otros';
      porCategoria[categoria] = (porCategoria[categoria] || 0) + (Number(c.IMPORTE) || 0);
    });

  return porCategoria;
}

function calcularPresupuestoPorCategoria_(ambito) {
  var perteneceAlAmbito_ = construirPerteneceAlAmbito_(ambito);

  var porCategoria = {};
  listarRegistros('PRESUPUESTO', { ACTIVO: 'SÍ' })
    .filter(function (p) { return perteneceAlAmbito_[p.ENTIDAD_TIPO + '|' + p.ENTIDAD_ID]; })
    .forEach(function (p) {
      var categoria = p.CATEGORIA || 'Otros';
      porCategoria[categoria] = (porCategoria[categoria] || 0) + (Number(p.IMPORTE_PREVISTO) || 0);
    });

  return porCategoria;
}

/*
 * Fase 3 (ver conversación): desglose por fuente de financiación del
 * ámbito -- cuánto aporta cada una y en qué estado (Solicitada...
 * Cobrada/Rechazada).
 */
function calcularFuentesFinanciacionAmbito_(ambito) {
  var perteneceAlAmbito_ = construirPerteneceAlAmbito_(ambito);

  var fuentes = listarRegistros('FUENTE_FINANCIACION', { ACTIVO: 'SÍ' })
    .filter(function (f) { return perteneceAlAmbito_[f.ENTIDAD_TIPO + '|' + f.ENTIDAD_ID]; })
    .map(function (f) {
      return {
        id: f.ID, nombre: f.NOMBRE, tipo: f.TIPO,
        importe: Math.round((Number(f.IMPORTE) || 0) * 100) / 100,
        estado: f.ESTADO, entidadTipo: f.ENTIDAD_TIPO, entidadId: f.ENTIDAD_ID
      };
    });

  var totalPorEstado = {};
  fuentes.forEach(function (f) { totalPorEstado[f.estado] = Math.round(((totalPorEstado[f.estado] || 0) + f.importe) * 100) / 100; });

  return {
    fuentes: fuentes,
    totalFinanciacion: Math.round(fuentes.reduce(function (acc, f) { return acc + f.importe; }, 0) * 100) / 100,
    totalPorEstado: totalPorEstado
  };
}

/*
 * Fase 4 (ver conversación): indicadores de impacto social -- personas
 * voluntarias y personas atendidas que participaron en el ámbito, y
 * "días" (no "horas": mismo criterio honesto que el coste de recursos,
 * TAREA_RESPONSABLE solo guarda fechas de asignación, no horas reales)
 * de dedicación. Reutiliza los ROL ya existentes en PERSONA_EQUIPO
 * ('Voluntariado'/'Persona atendida') -- ningún dato nuevo que capturar.
 */
function calcularImpactoSocialAmbito_(productosIds) {
  var tareasIds = resolverTareasIdsDeAmbito_(productosIds);
  if (tareasIds.length === 0) return { personasVoluntariado: 0, diasVoluntariado: 0, personasAtendidas: 0, diasPersonasAtendidas: 0 };

  var personasPorId = {};
  listarRegistrosSeguro_('PERSONA_EQUIPO', { ACTIVO: 'SÍ' }).forEach(function (p) { personasPorId[p.ID] = p; });

  var voluntarios = {}, atendidas = {};
  var diasVoluntariado = 0, diasAtendidas = 0;

  listarRegistrosSeguro_('TAREA_RESPONSABLE', { ACTIVO: 'SÍ' })
    .filter(function (tr) { return tareasIds.indexOf(tr.TAREA_ID) !== -1; })
    .forEach(function (tr) {
      var persona = personasPorId[tr.PERSONA_EQUIPO_ID];
      if (!persona) return;
      var dias = (tr.FECHA_INICIO_ASIGNACION && tr.FECHA_FIN_ASIGNACION) ? diasEntreFechas_(tr.FECHA_INICIO_ASIGNACION, tr.FECHA_FIN_ASIGNACION) : 0;
      if (persona.ROL === 'Voluntariado') {
        voluntarios[persona.ID] = true;
        diasVoluntariado += dias;
      } else if (persona.ROL === 'Persona atendida') {
        atendidas[persona.ID] = true;
        diasAtendidas += dias;
      }
    });

  return {
    personasVoluntariado: Object.keys(voluntarios).length,
    diasVoluntariado: diasVoluntariado,
    personasAtendidas: Object.keys(atendidas).length,
    diasPersonasAtendidas: diasAtendidas
  };
}

var CATEGORIAS_COSTE_ORDEN_ = ['Materiales', 'Recursos', 'Actividad', 'Otros'];

/*
 * Punto de entrada: coste real vs presupuesto previsto, por categoría,
 * para un nivel (Campaña/Proyecto/Producto) concreto.
 */
function obtenerCosteTotalPorCategoria(entidadTipo, entidadId) {
  return serializarParaCliente_(calcularCosteTotalPorCategoria_(entidadTipo, entidadId));
}

function calcularCosteTotalPorCategoria_(entidadTipo, entidadId) {
  var ambito = resolverAmbitoCoste_(entidadTipo, entidadId);

  var materiales = calcularCosteMaterialesEstimado_(ambito.productosIds);
  var recursos = calcularCosteRecursosAtribuido_(ambito.productosIds);
  var actividadPorCategoria = calcularCosteActividadPorCategoria_(ambito);
  var presupuestoPorCategoria = calcularPresupuestoPorCategoria_(ambito);

  var realPorCategoria = {
    Materiales: materiales.total + (actividadPorCategoria.Materiales || 0),
    Recursos: recursos.total + (actividadPorCategoria.Recursos || 0),
    Actividad: actividadPorCategoria.Actividad || 0,
    Otros: actividadPorCategoria.Otros || 0
  };

  var categorias = CATEGORIAS_COSTE_ORDEN_.map(function (categoria) {
    var previsto = Math.round((presupuestoPorCategoria[categoria] || 0) * 100) / 100;
    var real = Math.round((realPorCategoria[categoria] || 0) * 100) / 100;
    return {
      categoria: categoria,
      previsto: previsto,
      real: real,
      desviacion: Math.round((real - previsto) * 100) / 100
    };
  });

  var totalPrevisto = categorias.reduce(function (acc, c) { return acc + c.previsto; }, 0);
  var totalReal = categorias.reduce(function (acc, c) { return acc + c.real; }, 0);

  return {
    entidadTipo: entidadTipo,
    entidadId: entidadId,
    categorias: categorias,
    totalPrevisto: Math.round(totalPrevisto * 100) / 100,
    totalReal: Math.round(totalReal * 100) / 100,
    desviacionTotal: Math.round((totalReal - totalPrevisto) * 100) / 100,
    materialesSinPrecioReferencia: materiales.sinPrecioReferencia,
    recursosDetalle: recursos.detallePorRecurso
  };
}

/*
 * Fase 3+4 (ver conversación): informe de justificación económica --
 * presupuesto vs coste real por categoría + fuentes de financiación +
 * impacto social + comparativa entre campañas, para un nivel (Campaña/
 * Proyecto/Producto) concreto. Export PDF con plantilla propia
 * (generarHtmlMemoriaEconomica_, ReportService.js) en vez del
 * aplanador genérico campo/valor que usan los demás informes.
 */
function nombreRegistroEntidad_(entidadTipo, entidadId) {
  var entidadKey = ENTIDAD_DOCUMENTO_A_MVP[entidadTipo];
  if (!entidadKey) return entidadId;
  var registro = obtenerRegistroPorId(entidadKey, entidadId);
  return registro ? (registro.NOMBRE || registro.TITULO || entidadId) : entidadId;
}

/*
 * Comparativa entre TODAS las campañas activas (ver conversación --
 * "comparativa multi-campaña"): siempre a nivel Campaña, independiente
 * del nivel elegido en el selector del informe -- responde "cómo va
 * esta campaña frente a las demás", no depende de qué Producto/Proyecto
 * se esté consultando en el resto del informe.
 */
function obtenerComparativaCampanas() {
  // INC-0059: mismo patron que INC-0052 (ReportService.js) -- excluye
  // campañas Piloto/Auditoria de la comparativa de coste.
  var filas = filtrarPorNivelDato_('CAMPANA', listarRegistros('CAMPANA', { ACTIVO: 'SÍ' }), false).map(function (c) {
    var coste = calcularCosteTotalPorCategoria_('Campaña', c.ID);
    var ambito = resolverAmbitoCoste_('Campaña', c.ID);
    var financiacion = calcularFuentesFinanciacionAmbito_(ambito);
    var impacto = calcularImpactoSocialAmbito_(ambito.productosIds);
    return {
      campanaId: c.ID,
      campanaNombre: c.NOMBRE,
      totalPrevisto: coste.totalPrevisto,
      totalReal: coste.totalReal,
      desviacionTotal: coste.desviacionTotal,
      coberturaFinanciacion: coste.totalReal > 0 ? Math.round((financiacion.totalFinanciacion / coste.totalReal) * 1000) / 10 : null,
      personasVoluntariado: impacto.personasVoluntariado,
      personasAtendidas: impacto.personasAtendidas
    };
  }).sort(function (a, b) { return b.totalReal - a.totalReal; });

  return serializarParaCliente_({ campanas: filas });
}

function generarInformeJustificacionEconomica(entidadTipo, entidadId) {
  if (!entidadTipo || !entidadId) {
    throw new Error('ERROR_INFORME: elige un nivel y un registro antes de generar el informe.');
  }

  var coste = calcularCosteTotalPorCategoria_(entidadTipo, entidadId);
  var ambito = resolverAmbitoCoste_(entidadTipo, entidadId);
  var financiacion = calcularFuentesFinanciacionAmbito_(ambito);
  var impactoSocial = calcularImpactoSocialAmbito_(ambito.productosIds);

  return serializarParaCliente_({
    tipo: 'JUSTIFICACION_ECONOMICA',
    entidadTipo: entidadTipo,
    entidadId: entidadId,
    entidadNombre: nombreRegistroEntidad_(entidadTipo, entidadId),
    categorias: coste.categorias,
    totalPrevisto: coste.totalPrevisto,
    totalReal: coste.totalReal,
    desviacionTotal: coste.desviacionTotal,
    materialesSinPrecioReferencia: coste.materialesSinPrecioReferencia,
    recursosDetalle: coste.recursosDetalle,
    fuentesFinanciacion: financiacion.fuentes,
    totalFinanciacion: financiacion.totalFinanciacion,
    financiacionPorEstado: financiacion.totalPorEstado,
    coberturaFinanciacion: coste.totalReal > 0 ? Math.round((financiacion.totalFinanciacion / coste.totalReal) * 1000) / 10 : null,
    impactoSocial: impactoSocial,
    comparativaCampanas: obtenerComparativaCampanas().campanas
  });
}

function obtenerOpcionesRegistroPorNivel(entidadTipo) {
  var entidadKey = ENTIDAD_DOCUMENTO_A_MVP[entidadTipo];
  if (!entidadKey) throw new Error('ERROR_INFORME: nivel no soportado: ' + entidadTipo);
  return listarRegistros(entidadKey, { ACTIVO: 'SÍ' }).map(function (r) {
    return { id: r.ID, etiqueta: r.ID + ' - ' + (r.NOMBRE || r.TITULO || '') };
  });
}
