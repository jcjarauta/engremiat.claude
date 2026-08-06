/**
 * FormularioMotorUI.js -- capa UI_SERVIDOR de formularios (menu real + motor
 * generico de apertura/edicion/creacion de dialogos). Extraido de
 * Formularios.js para cerrar su deuda de mezcla de capas (ver
 * PROPUESTA_MODULARIZACION_LIBRERIA.md). No contiene reglas de negocio ni
 * guardado: eso vive en FormularioValidacionService.js.
 */
/*
 * Hallazgo #23 (auditoría piloto): el menú había crecido por orden de
 * aparición de cada fase (L1-L5), agrupado por tipo de entidad en dos
 * submenús separados ("Nuevo registro"/"Relaciones") que no reflejaban
 * como se usa el sistema de verdad. Reorganizado por contexto de uso;
 * "Nuevo X"/"Editar X" de la misma entidad quedan juntos en el mismo
 * grupo. Cambio puramente de organización del menú -- no toca lógica
 * de servidor ni datos.
 */
/*
 * Menu organizado en 3 polos (ver conversacion -- "gantt responde
 * preguntas, arboles/fichas son el espacio de edicion, el resto es
 * administracion de datos"), no por entidad suelta como antes:
 *   📊 Analizar   -- vistas de consulta, sin edicion profunda.
 *   🌳 Navegar y editar -- arboles de jerarquia + fichas de registro,
 *      con sus "Editar X" asociados (el atajo directo a cada nivel).
 *   ➕ Crear y gestionar datos -- alta de registros/relaciones nuevas
 *      y administracion (catalogos, importacion, mantenimiento).
 * Ningun nombre de funcion cambia, solo se reagrupan los accesos.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Taller de Producción')
    .addSubMenu(
      ui.createMenu('📊 Analizar')
        .addItem('Panel operativo', 'abrirPanelOperativo')
        .addItem('Informes', 'abrirInformes')
        .addItem('Gantt: plan vs. real', 'abrirGanttPlanReal')
        .addItem('Kanban operativo (Tarea/Proceso/Incidencia)', 'abrirKanban')
        .addItem('Listado filtrable (Incidencias/Decisiones/Documentos)', 'abrirListadoFiltrable')
        .addItem('Verificar integridad', 'abrirIntegridad')
        .addItem('Historial', 'abrirHistorialAdmin')
    )
    .addSubMenu(
      ui.createMenu('🌳 Navegar y editar')
        .addSubMenu(
          ui.createMenu('Campaña → Proyecto → Producto → Proceso → Tarea')
            .addItem('Gestión de campaña (vista global)', 'abrirPanelCampana')
            .addItem('Ficha de producto (buscar)', 'abrirFichaProductoBuscar')
            .addItem('Editar campaña', 'abrirEditarCampana')
            .addItem('Editar proyecto', 'abrirEditarProyecto')
            .addItem('Editar producto', 'abrirEditarProducto')
            .addItem('Editar Proyecto-Producto', 'abrirEditarProyectoProducto')
            .addItem('Editar proceso', 'abrirEditarProceso')
            .addItem('Editar tarea', 'abrirEditarTarea')
        )
        .addSubMenu(
          ui.createMenu('Personas y equipos')
            .addItem('Ver personas y equipo (jerarquía)', 'abrirPanelPersonas')
            .addItem('Ficha de persona/equipo (buscar)', 'abrirFichaPersonaEquipoBuscar')
            .addItem('Editar persona/equipo', 'abrirEditarPersonaEquipo')
            .addItem('Editar Equipo-Miembro', 'abrirEditarEquipoMiembro')
            .addItem('Editar Tarea-Responsable', 'abrirEditarTareaResponsable')
        )
        .addSubMenu(
          ui.createMenu('Espacios y recursos')
            .addItem('Ver espacios y recursos (jerarquía)', 'abrirPanelRecursos')
            .addItem('Ficha de espacio/recurso (buscar)', 'abrirFichaRecursoBuscar')
            .addItem('Editar recurso', 'abrirEditarRecurso')
            .addItem('Editar Tarea-Recurso', 'abrirEditarTareaRecurso')
            .addItem('Editar horario', 'abrirEditarHorario')
        )
        .addSubMenu(
          ui.createMenu('Materiales y proveedores')
            .addItem('Ficha de material (buscar)', 'abrirFichaMaterialBuscar')
            .addItem('Editar material', 'abrirEditarMaterial')
            .addItem('Editar Producto-Material', 'abrirEditarProductoMaterial')
            .addItem('Editar Tarea-Material', 'abrirEditarTareaMaterial')
            .addItem('Ficha de proveedor (buscar)', 'abrirFichaProveedorBuscar')
            .addItem('Editar proveedor', 'abrirEditarProveedor')
            .addItem('Editar Proveedor-Material', 'abrirEditarProveedorMaterial')
            .addItem('Editar pedido a proveedor', 'abrirEditarPedidoProveedor')
            .addItem('Editar Pedido-Línea', 'abrirEditarPedidoProveedorLinea')
            .addItem('Editar recepción de pedido', 'abrirEditarRecepcion')
            .addItem('Editar Recepción-Línea', 'abrirEditarRecepcionLinea')
            .addItem('Editar Movimiento de material', 'abrirEditarMovimientoMaterial')
        )
        .addSubMenu(
          ui.createMenu('Seguimiento y decisiones')
            .addItem('Ficha de incidencia (buscar)', 'abrirFichaIncidenciaBuscar')
            .addItem('Editar incidencia', 'abrirEditarIncidencia')
            .addItem('Editar decisión', 'abrirEditarDecision')
            .addItem('Editar documento', 'abrirEditarDocumento')
            .addItem('Editar Relación', 'abrirEditarRelacion')
            .addItem('Editar Vínculo', 'abrirEditarVinculo')
            .addItem('Editar Ejecución de tarea', 'abrirEditarEjecucionTarea')
            .addItem('Editar Asignación', 'abrirEditarAsignacion')
        )
    )
    .addSubMenu(
      ui.createMenu('➕ Crear y gestionar datos')
        .addSubMenu(
          ui.createMenu('Nuevo registro')
            .addItem('Nueva campaña', 'abrirFormularioCrearCampana')
            .addItem('Nuevo proyecto', 'abrirFormularioCrearProyecto')
            .addItem('Nuevo producto', 'abrirFormularioCrearProducto')
            .addItem('Nuevo proceso', 'abrirFormularioCrearProceso')
            .addItem('Nueva tarea', 'abrirFormularioCrearTarea')
            .addItem('Nueva persona/equipo', 'abrirFormularioCrearPersonaEquipo')
            .addItem('Nuevo recurso (herramienta/maquinaria/equipo/espacio)', 'abrirFormularioCrearRecurso')
            .addItem('Nuevo horario (franja semanal)', 'abrirFormularioCrearHorario')
            .addItem('Nuevo material', 'abrirFormularioCrearMaterial')
            .addItem('Nuevo proveedor', 'abrirFormularioCrearProveedor')
            .addItem('Nuevo pedido a proveedor', 'abrirFormularioCrearPedidoProveedor')
            .addItem('Nueva recepción de pedido', 'abrirFormularioCrearRecepcion')
            .addItem('Nueva incidencia', 'abrirFormularioCrearIncidencia')
            .addItem('Nueva decisión', 'abrirFormularioCrearDecision')
            .addItem('Nuevo documento', 'abrirFormularioCrearDocumento')
        )
        .addSubMenu(
          ui.createMenu('Nueva relación / vínculo')
            .addItem('Proyecto - Producto (nueva relación)', 'abrirFormularioCrearProyectoProducto')
            .addItem('Equipo - Miembro (nueva relación)', 'abrirFormularioCrearEquipoMiembro')
            .addItem('Tarea - Responsable (asignar)', 'abrirFormularioCrearTareaResponsable')
            .addItem('Tarea - Recurso (asignar)', 'abrirFormularioCrearTareaRecurso')
            .addItem('Producto - Material (nueva relación)', 'abrirFormularioCrearProductoMaterial')
            .addItem('Tarea - Material (nueva relación)', 'abrirFormularioCrearTareaMaterial')
            .addItem('Proveedor - Material (nueva relación)', 'abrirFormularioCrearProveedorMaterial')
            .addItem('Pedido - Línea (nueva)', 'abrirFormularioCrearPedidoProveedorLinea')
            .addItem('Recepción - Línea (nueva)', 'abrirFormularioCrearRecepcionLinea')
            .addItem('Relación / dependencia (grafo, nueva)', 'abrirFormularioCrearRelacion')
            .addItem('Vínculo genérico (nuevo)', 'abrirFormularioCrearVinculo')
            .addItem('Ejecución de tarea (nueva)', 'abrirFormularioCrearEjecucionTarea')
            .addItem('Asignación (Campaña/Proyecto/Producto/Proceso/Decisión/Incidencia)', 'abrirFormularioCrearAsignacion')
        )
        .addSubMenu(
          ui.createMenu('Movimientos y confirmaciones')
            .addItem('Confirmar recepción de pedido', 'abrirConfirmarRecepcion')
            .addItem('Movimiento de material (nuevo)', 'abrirFormularioCrearMovimientoMaterial')
            .addItem('Recalcular avance de proceso', 'abrirRecalcularAvanceProceso')
        )
        .addSubMenu(
          ui.createMenu('Presupuesto y financiación')
            .addItem('Nueva línea de presupuesto', 'abrirFormularioCrearPresupuesto')
            .addItem('Editar línea de presupuesto', 'abrirEditarPresupuesto')
            .addItem('Nueva fuente de financiación', 'abrirFormularioCrearFuenteFinanciacion')
            .addItem('Editar fuente de financiación', 'abrirEditarFuenteFinanciacion')
            .addItem('Nuevo coste (materiales/recursos/actividad)', 'abrirFormularioCrearCoste')
            .addItem('Editar coste', 'abrirEditarCoste')
        )
        .addSubMenu(
          ui.createMenu('Competencias')
            .addItem('Nueva competencia', 'abrirFormularioCrearCompetencia')
            .addItem('Editar competencia', 'abrirEditarCompetencia')
            .addItem('Persona - Competencia (asignar)', 'abrirFormularioCrearPersonaCompetencia')
            .addItem('Editar Persona-Competencia', 'abrirEditarPersonaCompetencia')
            .addItem('Recurso - Competencia requerida (asignar)', 'abrirFormularioCrearRecursoCompetencia')
            .addItem('Editar Recurso-Competencia', 'abrirEditarRecursoCompetencia')
        )
        .addSubMenu(
          ui.createMenu('Convocatorias')
            .addItem('Ficha de convocatoria (buscar)', 'abrirFichaConvocatoriaBuscar')
            .addItem('Nueva convocatoria', 'abrirFormularioCrearConvocatoria')
            .addItem('Editar convocatoria', 'abrirEditarConvocatoria')
        )
        .addSubMenu(
          ui.createMenu('Impacto')
            .addItem('Nueva etiqueta de impacto', 'abrirFormularioCrearEtiquetaImpacto')
            .addItem('Editar etiqueta de impacto', 'abrirEditarEtiquetaImpacto')
        )
        .addSubMenu(
          ui.createMenu('Catálogos y administración')
            .addItem('Catálogos', 'abrirCatalogosAdmin')
            .addItem('Personas y equipos (hoja)', 'abrirPersonasEquiposAdmin')
            .addItem('Proveedores (hoja)', 'abrirProveedoresAdmin')
            .addItem('Protección de hojas', 'abrirProteccionHojas')
            .addItem('Importación masiva de campaña (STG_*)', 'abrirImportacionMasiva')
            .addItem('Importación masiva de Recursos/Personas (STG_*)', 'abrirImportacionMasivaRecursosPersonas')
            .addItem('Mantenimiento (revertir cambio)', 'abrirRevertirUltimoCambio')
        )
    )
    .addToUi();
}
/*
 * prefill (opcional): valores iniciales para campos del formulario en
 * modo creacion -- hoy solo lo usa el encadenado Campaña->Proyecto
 * (abrirFormularioCrearProyectoConCampana), para no obligar a buscar de
 * nuevo la campaña que se acaba de crear en el buscador de CAMPANA_ID.
 */
function abrirFormularioCrear_(entidad, tituloVentana, prefill, retorno) {
  var template = HtmlService.createTemplateFromFile('FormularioGenerico');
  template.entidad = entidad;
  template.idRegistro = '';
  template.titulo = tituloVentana;
  template.prefill = JSON.stringify(prefill || {});
  template.retorno = JSON.stringify(retorno || null);
  var html = template.evaluate().setWidth(420).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html, tituloVentana);
}
/*
 * retorno (opcional, {entidad, id}): a que formulario volver al cerrar
 * este (cancelar, guardar o desactivar) -- resuelve el hallazgo "me
 * quedo bloqueado" al editar un dependiente desde la lista de bloqueo
 * de Desactivar (ver abrirDependienteConRetorno_). Sin retorno, cerrar
 * se comporta igual que siempre.
 */
function abrirFormularioEditarPorId(entidad, idRegistro, retorno) {
  var clave = String(entidad || '').trim().toUpperCase();
  if (!ESQUEMAS_FORMULARIO_MVP[clave]) {
    throw new Error('No hay formulario disponible para la entidad ' + entidad);
  }
  var tituloVentana = 'Editar ' + (ETIQUETA_ENTIDAD_MVP[clave] || clave.toLowerCase());
  var template = HtmlService.createTemplateFromFile('FormularioGenerico');
  template.entidad = clave;
  template.idRegistro = idRegistro;
  template.titulo = tituloVentana;
  template.prefill = JSON.stringify({});
  template.retorno = JSON.stringify(retorno || null);
  var html = template.evaluate().setWidth(420).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html, tituloVentana);
}
/*
 * Llamada desde el listado de dependientes bloqueantes de "Desactivar"
 * (FormularioGenerico.html): abre el dependiente con retorno al
 * formulario que se estaba intentando desactivar, para no dejar al
 * usuario sin forma de volver tras editarlo.
 */
function abrirDependienteConRetorno(entidadHijo, idHijo, entidadOrigen, idOrigen) {
  abrirFormularioEditarPorId(entidadHijo, idHijo, { entidad: entidadOrigen, id: idOrigen });
}
/*
 * Despacha una entidad a su ficha de registro correspondiente (ver
 * conversacion -- generalizacion del mecanismo de retorno para que
 * tambien pueda volver a una ficha, no solo a otro formulario). Unico
 * punto que conoce la lista de fichas existentes; añadir aqui cuando
 * se cree una ficha nueva (Espacio/Recurso, etc.).
 */
function abrirFichaPorEntidad_(entidad, id) {
  var clave = String(entidad || '').trim().toUpperCase();
  if (clave === 'PERSONA_EQUIPO') { abrirFichaPersonaEquipo(id); return; }
  if (clave === 'PRODUCTO') { abrirFichaProducto(id); return; }
  if (clave === 'RECURSO') { abrirFichaRecurso(id); return; }
  if (clave === 'PROVEEDOR') { abrirFichaProveedor(id); return; }
  if (clave === 'MATERIAL') { abrirFichaMaterial(id); return; }
  if (clave === 'INCIDENCIA') { abrirFichaIncidencia(id); return; }
  if (clave === 'CONVOCATORIA') { abrirFichaConvocatoria(id); return; }
  throw new Error('No hay ficha disponible para la entidad ' + entidad);
}
/*
 * Punto unico de despacho de "retorno" (ver conversacion -- "no tener
 * que salir de la ficha por sus partes"): antes RETORNO solo volvia a
 * otro formulario de edicion (abrirFormularioEditarPorId); ahora tambien
 * puede volver a una ficha de registro con retorno.tipo='ficha'. Sin
 * tipo (el caso ya existente de "dependiente bloqueante"), se comporta
 * exactamente igual que antes.
 */
function abrirRetorno(retorno) {
  if (!retorno || !retorno.entidad || !retorno.id) return;
  if (retorno.tipo === 'ficha') {
    abrirFichaPorEntidad_(retorno.entidad, retorno.id);
    return;
  }
  abrirFormularioEditarPorId(retorno.entidad, retorno.id);
}
/*
 * accionFn usado por los botones "Editar" dentro de una ficha de
 * registro (FichaProducto.html/FichaPersonaEquipo.html): igual que
 * seleccionarYAbrirEdicion, pero con retorno a la propia ficha para no
 * dejar al usuario "fuera" tras cerrar el formulario de edicion.
 */
function abrirEdicionConRetornoAFicha(entidad, idRegistro, fichaEntidad, fichaId) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);
  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }
  abrirFormularioEditarPorId(entidad, idRegistro, { tipo: 'ficha', entidad: fichaEntidad, id: fichaId });
  return true;
}
/*
 * Flujo encadenado Campaña->Proyecto: al guardar una campaña nueva,
 * FormularioGenerico.html ofrece crear ya el primer proyecto; si se
 * acepta, llama aqui con el ID recien creado para abrir "Nuevo
 * proyecto" con CAMPANA_ID precargado (mismo buscador de FK de
 * siempre, solo que ya viene relleno).
 */
function abrirFormularioCrearProyectoConCampana(campanaId) {
  abrirFormularioCrear_('PROYECTO', 'Nuevo proyecto', { CAMPANA_ID: campanaId });
}
/*
 * Mismo flujo encadenado, un nivel mas abajo: Proyecto->Producto. El
 * campo real de PRODUCTO no es PROYECTO_ID (no existe) sino el campo
 * virtual PROYECTO_VINCULAR_ID (hallazgo #13 de la auditoria piloto),
 * que guardarFormulario resuelve creando el PROYECTO_PRODUCTO en el
 * mismo guardado.
 */
function abrirFormularioCrearProductoConProyecto(proyectoId) {
  abrirFormularioCrear_('PRODUCTO', 'Nuevo producto', { PROYECTO_VINCULAR_ID: proyectoId });
}
/*
 * Resto de la cadena hacia abajo: Producto->Proceso->Tarea. Aqui
 * PRODUCTO_ID/PROCESO_ID si son campos reales de PROCESO/TAREA (no
 * virtuales como PROYECTO_VINCULAR_ID), asi que el prefill es directo.
 */
function abrirFormularioCrearProcesoConProducto(productoId) {
  abrirFormularioCrear_('PROCESO', 'Nuevo proceso', { PRODUCTO_ID: productoId });
}
function abrirFormularioCrearTareaConProceso(procesoId) {
  abrirFormularioCrear_('TAREA', 'Nueva tarea', { PROCESO_ID: procesoId });
}
/*
 * Cadena "hermano": crear otro registro del mismo tipo para el mismo
 * padre (otro proyecto en la misma campaña, otro producto en el mismo
 * proyecto...), sin tener que volver al menu y rebuscar el padre en el
 * desplegable. Generico para toda la jerarquia -- un unico punto de
 * entrada en vez de una funcion "ConMismoPadre" por entidad.
 */
function abrirFormularioCrearHermano(entidad, campoPadre, valorPadre) {
  var clave = String(entidad || '').trim().toUpperCase();
  var etiquetas = { CAMPANA: 'campaña', PROYECTO: 'proyecto', PRODUCTO: 'producto', PROCESO: 'proceso', TAREA: 'tarea' };
  var prefill = {};
  prefill[campoPadre] = valorPadre;
  abrirFormularioCrear_(clave, 'Nuevo ' + (etiquetas[clave] || clave.toLowerCase()), prefill);
}
function abrirFormularioCrearCampana() { abrirFormularioCrear_('CAMPANA', 'Nueva campaña'); }
function abrirFormularioCrearProyecto() { abrirFormularioCrear_('PROYECTO', 'Nuevo proyecto'); }
function abrirFormularioCrearProducto() { abrirFormularioCrear_('PRODUCTO', 'Nuevo producto'); }
function abrirFormularioCrearProceso() { abrirFormularioCrear_('PROCESO', 'Nuevo proceso'); }
function abrirFormularioCrearTarea() { abrirFormularioCrear_('TAREA', 'Nueva tarea'); }
function abrirFormularioCrearProveedor() { abrirFormularioCrear_('PROVEEDOR', 'Nuevo proveedor'); }
function abrirFormularioCrearDecision() { abrirFormularioCrear_('DECISION', 'Nueva decisión'); }
function abrirFormularioCrearIncidencia() { abrirFormularioCrear_('INCIDENCIA', 'Nueva incidencia'); }
function abrirFormularioCrearDocumento() { abrirFormularioCrear_('DOCUMENTO', 'Nuevo documento'); }
function abrirFormularioCrearPresupuesto() { abrirFormularioCrear_('PRESUPUESTO', 'Nueva línea de presupuesto'); }
function abrirFormularioCrearFuenteFinanciacion() { abrirFormularioCrear_('FUENTE_FINANCIACION', 'Nueva fuente de financiación'); }
function abrirFormularioCrearCoste() { abrirFormularioCrear_('COSTE', 'Nuevo coste'); }
function abrirFormularioCrearCompetencia() { abrirFormularioCrear_('COMPETENCIA', 'Nueva competencia'); }
function abrirFormularioCrearPersonaCompetencia() { abrirFormularioCrear_('PERSONA_COMPETENCIA', 'Persona - Competencia (nueva)'); }
function abrirFormularioCrearRecursoCompetencia() { abrirFormularioCrear_('RECURSO_COMPETENCIA', 'Recurso - Competencia requerida (nueva)'); }
function abrirFormularioCrearConvocatoria() { abrirFormularioCrear_('CONVOCATORIA', 'Nueva convocatoria'); }
function abrirFormularioCrearEtiquetaImpacto() { abrirFormularioCrear_('ETIQUETA_IMPACTO', 'Nueva etiqueta de impacto'); }
/**
 * Punto de entrada generico "Editar registro" (Fase 1, BL-MVP-02).
 * Reconstruido tras deteccion de regresion via AUD-01.
 */
/*
 * Hueco detectado en L3.5 y registrado explicitamente para no abordarlo
 * en esa fase ("Editar registro" seguia pidiendo el ID exacto con un
 * ui.prompt() nativo, sin buscador, a diferencia de los desplegables de
 * dentro de cada formulario). El usuario lo ha vuelto a señalar en la
 * verificacion de L5.1 -- se corrige ahora para las 21 entidades que
 * comparten esta funcion, reutilizando el mismo patron de <datalist>
 * que FormularioGenerico.html.
 */
function abrirEditarRegistroPorEntidad_(entidad, etiqueta) {
  abrirSelectorConAccion_(entidad, 'Editar ' + etiqueta, 'seleccionarYAbrirEdicion', 'obtenerOpcionesEntidadParaSelector');
}
/*
 * Generaliza el selector con buscador (nacido en "Editar registro",
 * L3.5/L5.1) para cualquier flujo "elige un registro y luego haz X":
 * abrirConfirmarRecepcion lo reutiliza para no volver a pedir el ID a
 * memoria con un ui.prompt() (mismo hueco senalado por el usuario al
 * verificar L5.2).
 */
function abrirSelectorConAccion_(entidad, tituloVentana, accionFn, opcionesFn) {
  var template = HtmlService.createTemplateFromFile('SelectorRegistro');
  template.entidad = entidad;
  template.titulo = tituloVentana;
  template.accionFn = accionFn;
  template.opcionesFn = opcionesFn;
  var html = template.evaluate().setWidth(380).setHeight(220);
  SpreadsheetApp.getUi().showModalDialog(html, tituloVentana);
}
/*
 * Texto adicional buscable por entidad, mas alla de ID/NOMBRE (ver
 * conversacion: "buscador mas profundo" -- en Persona/Equipo, buscar
 * solo por nombre no encontraba a alguien por su rol o tipo).
 */
function etiquetaExtraSelector_(clave, registro) {
  if (clave === 'PERSONA_EQUIPO') {
    var partes = [registro.TIPO, registro.ROL].filter(function (v) { return v; });
    return partes.length ? ' (' + partes.join(' · ') + ')' : '';
  }
  return '';
}
function obtenerOpcionesEntidadParaSelector(entidad, incluirPruebas) {
  var clave = String(entidad || '').trim().toUpperCase();

  if (!ENTIDADES_MVP[clave]) {
    throw new Error('Entidad no configurada: ' + entidad);
  }

  var registros = listarRegistros(clave, { ACTIVO: 'SÍ' });
  registros = filtrarPorNivelDato_(clave, registros, incluirPruebas);

  return registros.map(function (registro) {
    var etiqueta = registro.ID + ' - ' + (registro.NOMBRE || registro.TITULO || '') + etiquetaExtraSelector_(clave, registro);
    return {
      id: registro.ID,
      etiqueta: aplicarSufijoNivelDato_(clave, registro, etiqueta)
    };
  });
}
function seleccionarYAbrirEdicion(entidad, idRegistro) {
  var registro = obtenerRegistroPorId(entidad, idRegistro);

  if (!registro) {
    throw new Error('No existe ningún registro con el ID "' + idRegistro + '".');
  }

  abrirFormularioEditarPorId(entidad, idRegistro);

  return true;
}
function abrirEditarCampana() { abrirEditarRegistroPorEntidad_('CAMPANA', 'Campaña'); }
function abrirEditarProyecto() { abrirEditarRegistroPorEntidad_('PROYECTO', 'Proyecto'); }
function abrirEditarProducto() { abrirEditarRegistroPorEntidad_('PRODUCTO', 'Producto'); }
function abrirEditarProceso() { abrirEditarRegistroPorEntidad_('PROCESO', 'Proceso'); }
function abrirEditarTarea() { abrirEditarRegistroPorEntidad_('TAREA', 'Tarea'); }
function abrirEditarMaterial() { abrirEditarRegistroPorEntidad_('MATERIAL', 'Material'); }
function abrirEditarPersonaEquipo() { abrirEditarRegistroPorEntidad_('PERSONA_EQUIPO', 'Persona/Equipo'); }
function abrirEditarProveedor() { abrirEditarRegistroPorEntidad_('PROVEEDOR', 'Proveedor'); }
function abrirEditarDecision() { abrirEditarRegistroPorEntidad_('DECISION', 'Decisión'); }
function abrirEditarIncidencia() { abrirEditarRegistroPorEntidad_('INCIDENCIA', 'Incidencia'); }
function abrirEditarDocumento() { abrirEditarRegistroPorEntidad_('DOCUMENTO', 'Documento'); }
function abrirEditarPresupuesto() { abrirEditarRegistroPorEntidad_('PRESUPUESTO', 'línea de presupuesto'); }
function abrirEditarFuenteFinanciacion() { abrirEditarRegistroPorEntidad_('FUENTE_FINANCIACION', 'fuente de financiación'); }
function abrirEditarCoste() { abrirEditarRegistroPorEntidad_('COSTE', 'coste'); }
function abrirEditarCompetencia() { abrirEditarRegistroPorEntidad_('COMPETENCIA', 'competencia'); }
function abrirEditarPersonaCompetencia() { abrirEditarRegistroPorEntidad_('PERSONA_COMPETENCIA', 'persona - competencia'); }
function abrirEditarRecursoCompetencia() { abrirEditarRegistroPorEntidad_('RECURSO_COMPETENCIA', 'recurso - competencia'); }
function abrirEditarConvocatoria() { abrirEditarRegistroPorEntidad_('CONVOCATORIA', 'convocatoria'); }
function abrirEditarEtiquetaImpacto() { abrirEditarRegistroPorEntidad_('ETIQUETA_IMPACTO', 'etiqueta de impacto'); }
function abrirEditarProyectoProducto() { abrirEditarRegistroPorEntidad_('PROYECTO_PRODUCTO', 'Proyecto-Producto'); }
function abrirEditarTareaResponsable() { abrirEditarRegistroPorEntidad_('TAREA_RESPONSABLE', 'Tarea-Responsable'); }
function abrirEditarProductoMaterial() { abrirEditarRegistroPorEntidad_('PRODUCTO_MATERIAL', 'Producto-Material'); }
function abrirEditarTareaMaterial() { abrirEditarRegistroPorEntidad_('TAREA_MATERIAL', 'Tarea-Material'); }
function abrirEditarAsignacion() { abrirEditarRegistroPorEntidad_('ASIGNACION', 'Asignación'); }
function abrirEditarRelacion() { abrirEditarRegistroPorEntidad_('RELACION', 'Relación'); }
function abrirEditarVinculo() { abrirEditarRegistroPorEntidad_('VINCULO', 'Vínculo'); }
function abrirEditarHorario() { abrirEditarRegistroPorEntidad_('HORARIO', 'Horario'); }
function abrirEditarMovimientoMaterial() { abrirEditarRegistroPorEntidad_('MOVIMIENTO_MATERIAL', 'Movimiento de material'); }
function abrirEditarEjecucionTarea() { abrirEditarRegistroPorEntidad_('EJECUCION_TAREA', 'Ejecución de tarea'); }
function abrirEditarProveedorMaterial() { abrirEditarRegistroPorEntidad_('PROVEEDOR_MATERIAL', 'Proveedor-Material'); }
function abrirEditarEquipoMiembro() { abrirEditarRegistroPorEntidad_('EQUIPO_MIEMBRO', 'Equipo-Miembro'); }
function abrirEditarRecurso() { abrirEditarRegistroPorEntidad_('RECURSO', 'Recurso'); }
function abrirEditarTareaRecurso() { abrirEditarRegistroPorEntidad_('TAREA_RECURSO', 'Tarea-Recurso'); }
function abrirEditarPedidoProveedor() { abrirEditarRegistroPorEntidad_('PEDIDO_PROVEEDOR', 'Pedido a proveedor'); }
function abrirEditarPedidoProveedorLinea() { abrirEditarRegistroPorEntidad_('PEDIDO_PROVEEDOR_LINEA', 'Pedido-Línea'); }
function abrirEditarRecepcion() { abrirEditarRegistroPorEntidad_('RECEPCION', 'Recepción de pedido'); }
function abrirEditarRecepcionLinea() { abrirEditarRegistroPorEntidad_('RECEPCION_LINEA', 'Recepción-Línea'); }
/**
 * Menu "Relaciones" (Fase 1/2, BL-MVP-02): entradas de creacion para entidades de relacion.
 */
function abrirFormularioCrearProyectoProducto() { abrirFormularioCrear_('PROYECTO_PRODUCTO', 'Nueva relación proyecto-producto'); }
function abrirFormularioCrearTareaResponsable() { abrirFormularioCrear_('TAREA_RESPONSABLE', 'Nueva asignación tarea-responsable'); }
function abrirFormularioCrearProductoMaterial() { abrirFormularioCrear_('PRODUCTO_MATERIAL', 'Nueva relación producto-material'); }
function abrirFormularioCrearTareaMaterial() { abrirFormularioCrear_('TAREA_MATERIAL', 'Nueva relación tarea-material'); }
function abrirFormularioCrearAsignacion() { abrirFormularioCrear_('ASIGNACION', 'Nueva asignación'); }
function abrirFormularioCrearRelacion() { abrirFormularioCrear_('RELACION', 'Nueva relación / dependencia'); }
function abrirFormularioCrearVinculo() { abrirFormularioCrear_('VINCULO', 'Nuevo vínculo genérico'); }
function abrirFormularioCrearHorario() { abrirFormularioCrear_('HORARIO', 'Nuevo horario (franja semanal)'); }
function abrirFormularioCrearMovimientoMaterial() { abrirFormularioCrear_('MOVIMIENTO_MATERIAL', 'Nuevo movimiento de material'); }
function abrirFormularioCrearEjecucionTarea() { abrirFormularioCrear_('EJECUCION_TAREA', 'Nueva ejecución de tarea'); }
function abrirFormularioCrearProveedorMaterial() { abrirFormularioCrear_('PROVEEDOR_MATERIAL', 'Nueva relación proveedor-material'); }
function abrirFormularioCrearEquipoMiembro() { abrirFormularioCrear_('EQUIPO_MIEMBRO', 'Nueva relación equipo-miembro'); }
function abrirFormularioCrearRecurso() { abrirFormularioCrear_('RECURSO', 'Nuevo recurso'); }
function abrirFormularioCrearTareaRecurso() { abrirFormularioCrear_('TAREA_RECURSO', 'Nueva relación tarea-recurso'); }
function abrirFormularioCrearPedidoProveedor() { abrirFormularioCrear_('PEDIDO_PROVEEDOR', 'Nuevo pedido a proveedor'); }
function abrirFormularioCrearPedidoProveedorLinea() { abrirFormularioCrear_('PEDIDO_PROVEEDOR_LINEA', 'Nueva línea de pedido'); }
function abrirFormularioCrearRecepcion() { abrirFormularioCrear_('RECEPCION', 'Nueva recepción de pedido'); }
function abrirFormularioCrearRecepcionLinea() { abrirFormularioCrear_('RECEPCION_LINEA', 'Nueva línea de recepción'); }
/**
 * Menu "Administración" (Fase 1, BL-MVP-02): accesos rapidos a hojas de soporte.
 */
function abrirHojaAdmin_(nombreHoja) {
  var ss = SpreadsheetApp.getActive();
  var hoja = ss.getSheetByName(nombreHoja);
  if (!hoja) {
    SpreadsheetApp.getUi().alert('No existe la hoja ' + nombreHoja + '.');
    return;
  }
  ss.setActiveSheet(hoja);
}
// abrirCatalogosAdmin ahora vive en GestionCatalogos.js (hallazgo #21:
// interfaz real en vez de abrir la hoja cruda 90_CONFIGURACION).
function abrirPersonasEquiposAdmin() { abrirHojaAdmin_('11_PERSONAS_EQUIPOS'); }
function abrirProveedoresAdmin() { abrirHojaAdmin_('15_PROVEEDORES'); }
function abrirHistorialAdmin() { abrirHojaAdmin_('91_HISTORIAL'); }
function abrirFormularioCrearMaterial() { abrirFormularioCrear_('MATERIAL', 'Nuevo material'); }
function abrirFormularioCrearPersonaEquipo() { abrirFormularioCrear_('PERSONA_EQUIPO', 'Nueva persona/equipo'); }