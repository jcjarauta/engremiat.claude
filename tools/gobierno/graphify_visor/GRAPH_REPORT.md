# Graph Report - engremiat-live  (2026-08-22)

## Corpus Check
- 1 files · ~250,590 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1587 nodes · 4668 edges · 81 communities (73 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- engremiat-live.concat.js
- abrirFormularioCrear_
- obtenerHojaEntidad_
- insertarRegistroTransaccional
- listarRegistros
- doPost
- guardarFormulario
- abrirEditarRegistroPorEntidad_
- obtenerRegistroPorId
- moduloInstalado_
- crearCatalogoNuevoL3_
- escaparHtmlServer_
- construirCadenaTareaPrueba_
- assertHallazgoIntegridad_
- obtenerReporteIntegridad
- registrarHistorial
- exportarInformeCSV
- eliminarRegistroPruebaPorId_
- construirProcesoDePrueba_
- cacheLecturaFinalizarContexto_
- construirInstruccionesPlantilla_
- leerVariasEntidadesBatch_
- limpiarResiduosPruebaPorTexto_
- serializarParaCliente_
- escribirCamposRegistroIntegridad_
- generarInformeCampania
- ejecutarSuiteModulosInstalados
- ejecutarImportacionRecursosPersonas_
- abrirFichaPorEntidad_
- listarRegistrosSeguro_
- calcularCosteTotalPorCategoria_
- ejecutarPruebaIntegridadMutacion_
- pruebaPaso263_IntegridadYBajaReactivacion
- instalarPaqueteDatosInformes
- obtenerPanelTemporal
- auditarFaseB10_MatrizFinalRelacionesMateriales
- obtenerPanelOperativo
- aplicarTodasLasValidacionesMVP
- obtenerSiguienteIdEntidad
- abrirSelectorConAccion_
- validarReglasNegocioFormulario_
- obtenerIdsDeEntidad_
- generarInformeCalidadPlanificacion
- ejecutarSuitePaso171a202
- ejecutarLotePruebasReactivas_
- pruebaPaso241_DecisionesPendientesMarcaVencida
- obtenerDisponibilidadEntidades
- abrirFormularioEditarPorId
- asegurarRangosNombradosCatalogo_
- obtenerOpcionesEntidadParaSelector
- ejecutarSuiteM1Per001DryRun
- obtenerCatalogo
- ejecutarImportacionMasiva_
- obtenerAlertasMaterialesSeguro_
- buscarRegistros
- obtenerVistaFasesPorProducto
- obtenerFichaIncidencia
- instalarCicloProveedorAmpliado
- pruebaPaso169_OrdenPredecesoraInvalido
- obtenerDatosListado
- exportarCodigoSinTests
- abrirGanttPlanReal
- abrirHojaAdmin_
- codigosIntegridadM1Per003_
- probarIntegridadProcesoFinPosteriorProductoRequerido
- obtenerResumenGlobal
- instrumentacionActivarFlush_
- obtenerArbolPersonas
- pruebaPaso310_NuevoRegistroMaterialYPersonaEquipoDisponibles
- abrirPanelCampanaEnCampana
- assertCasoIntegridadM1Per001_
- pruebaPaso304_IntegridadFuncionalDetectaReservaMayorQueStock
- instalarHorarioEquipoProduccion
- abrirGestionCatalogo_
- auditarFaseC05B_PredecessoraOtroProceso
- corregirCatalogoTipoProyecto
- diagnosticarFaseC01_EstadoOriginalTarea
- ejecutarSuitePaso311
- inspeccionarFixtureC05B_ProcesosDisponibles
- obtenerSiguienteIdEntidadSeguro
- obtenerSugerenciaSecuencia

## God Nodes (most connected - your core abstractions)
1. `listarRegistros()` - 225 edges
2. `insertarRegistroTransaccional()` - 168 edges
3. `obtenerRegistroPorId()` - 110 edges
4. `abrirFormularioCrear_()` - 88 edges
5. `guardarFormulario()` - 78 edges
6. `eliminarRegistroPruebaPorId_()` - 70 edges
7. `actualizarRegistroTransaccional()` - 64 edges
8. `obtenerReporteIntegridad()` - 58 edges
9. `listarRegistrosSeguro_()` - 55 edges
10. `assertHallazgoIntegridad_()` - 50 edges

## Surprising Connections (you probably didn't know these)
- `construirCsvConBom_()` --indirect_call--> `celdaCsv_()`  [INFERRED]
  engremiat-live.concat.js → engremiat-live.concat.js  _Bridges community 16 → community 15_
- `obtenerGruposComprobacionHuerfanos_()` --indirect_call--> `ejecutarImportacionMasiva_()`  [INFERRED]
  engremiat-live.concat.js → engremiat-live.concat.js  _Bridges community 52 → community 19_
- `ejecutarSuiteIntegridadGap21ReglasFuncionales()` --indirect_call--> `probarIntegridadProductoMaterialDuplicado()`  [INFERRED]
  engremiat-live.concat.js → engremiat-live.concat.js  _Bridges community 13 → community 24_
- `ejecutarSuiteIntegridadCoberturaDirectaPendiente()` --indirect_call--> `probarIntegridadDedicacionPersonaSuperior100()`  [INFERRED]
  engremiat-live.concat.js → engremiat-live.concat.js  _Bridges community 31 → community 13_
- `auditarFaseB10_MatrizFinalRelacionesMateriales()` --indirect_call--> `auditarFaseB02_ActualizacionProductoMaterial()`  [INFERRED]
  engremiat-live.concat.js → engremiat-live.concat.js  _Bridges community 8 → community 35_

## Import Cycles
- None detected.

## Communities (81 total, 8 thin omitted)

### Community 0 - "engremiat-live.concat.js"
Cohesion: 0.03
Nodes (22): RFC-4180, abrirFormularioCrearAsignacionParaEntidad(), abrirFormularioCrearHorarioParaPersonaEquipo(), abrirFormularioCrearProductoMaterialParaMaterial(), abrirGanttOcupacionParaRecurso(), abrirGanttOcupacionRecurso(), activarSondeoTelegramSoporte(), bloquesEjecutivoCsv_() (+14 more)

### Community 1 - "abrirFormularioCrear_"
Cohesion: 0.02
Nodes (82): abrirFormularioCrear_(), abrirFormularioCrearAsignacion(), abrirFormularioCrearCampana(), abrirFormularioCrearCliente(), abrirFormularioCrearCompetencia(), abrirFormularioCrearContratoServicio(), abrirFormularioCrearConvocatoria(), abrirFormularioCrearCoste() (+74 more)

### Community 2 - "obtenerHojaEntidad_"
Cohesion: 0.05
Nodes (70): actualizarCampana(), actualizarProceso(), actualizarProducto(), actualizarProyecto(), actualizarTarea(), crearCampana(), crearProceso(), crearProducto() (+62 more)

### Community 3 - "insertarRegistroTransaccional"
Cohesion: 0.03
Nodes (61): auditarCantidadPrevistaCeroTareaMaterialRepositorio(), auditarCapacidadSemanalPersonaEquipoRepositorio(), auditarDisponibilidadEstadoPersonaEquipoRepositorio(), auditarFechasTareaResponsableRepositorio(), auditarUnidadProductoMaterialRepositorio(), auditarUnidadTareaMaterialRepositorio(), insertarRegistroTransaccional(), probarCampanaCompletaDryRun() (+53 more)

### Community 4 - "listarRegistros"
Cohesion: 0.08
Nodes (56): calcularDedicacionMaximaSimultaneaPorPersona_(), detectarCampanaCerradaConProyectoActivo_(), detectarCapacidadSemanalInsuficiente_(), detectarDuplicidadesRelacionesMaterial_(), detectarDuplicidadesRelacionMaterial_(), detectarPersonaInactivaConAsignacionActiva_(), detectarProblemasAsignacion_(), detectarProblemasAvanceProceso_() (+48 more)

### Community 5 - "doPost"
Cohesion: 0.05
Nodes (52): abrirActualizarMiLibreria(), abrirConfigurarAprovisionamiento(), abrirHojaSolicitudesMontaje(), actualizacionYaProcesada_(), actualizarLibreriaClienteDesdeDialogo(), actualizarLibreriaClienteDesdePanel(), actualizarLibreriaClienteRemoto_(), actualizarLibreriaPropia_() (+44 more)

### Community 6 - "guardarFormulario"
Cohesion: 0.06
Nodes (53): buscarPersonaEquipoPorNombre_(), buscarProductoPorCodigo_(), buscarTareaPorNombreYProducto_(), capacidadDisponible_(), completarDatosPruebaPilotoDecisiones(), crear_(), completarDatosPruebaPilotoIncidenciasDecisiones(), crear_() (+45 more)

### Community 7 - "abrirEditarRegistroPorEntidad_"
Cohesion: 0.04
Nodes (48): abrirEditarAsignacion(), abrirEditarCampana(), abrirEditarCliente(), abrirEditarCompetencia(), abrirEditarContratoServicio(), abrirEditarConvocatoria(), abrirEditarCoste(), abrirEditarDecision() (+40 more)

### Community 8 - "obtenerRegistroPorId"
Cohesion: 0.10
Nodes (43): abrirRevertirUltimoCambio(), actualizarEstadoPedidoTrasRecepcion_(), actualizarRegistroTransaccional(), aplicarMovimientoAStock_(), auditarActualizacionFechasTareaResponsableRepositorio(), auditarCamposObligatoriosDecisionRepositorio(), auditarCantidadCeroProductoMaterial(), auditarCatalogosDecisionRepositorio() (+35 more)

### Community 9 - "moduloInstalado_"
Cohesion: 0.06
Nodes (41): agregarAnalizarComercial_(), agregarAnalizarCore_(), agregarAnalizarGantt_(), agregarMovimientosCompras_(), agregarMovimientosCore_(), agregarNuevaRelacionComercial_(), agregarNuevaRelacionCompras_(), agregarNuevaRelacionCore_() (+33 more)

### Community 10 - "crearCatalogoNuevoL3_"
Cohesion: 0.07
Nodes (39): abrirInstalarEntidadEtiquetaImpacto(), agregarColumnasSiFaltan_(), agregarValorCatalogoSiNuevo(), ampliarCatalogoL2_(), buscarValorCatalogoExistente_(), crearCatalogoNuevoL3_(), formatearCorrelativoCodigo_(), generarClaveCatalogo_() (+31 more)

### Community 11 - "escaparHtmlServer_"
Cohesion: 0.17
Nodes (36): abrirDialogoExportarPanelTemporalPDF(), avisoOcultasHtml_(), bloqueSeguimientoHtml_(), colorPorPalabraClaveEstado_(), construirDocumentoInformeImprimible_(), donutProgresoSvg_(), enlaceEdicion_(), escaparHtmlServer_() (+28 more)

### Community 12 - "construirCadenaTareaPrueba_"
Cohesion: 0.11
Nodes (37): construirCadenaTareaPrueba_(), ejecutarSuitePaso185a187(), ejecutarSuitePaso222a227(), ejecutarSuitePaso238a243(), ejecutarSuitePaso267(), ejecutarSuitePaso291a299(), ejecutarSuitePaso296a299(), eliminarFilasPorColumnaValor_() (+29 more)

### Community 13 - "assertHallazgoIntegridad_"
Cohesion: 0.23
Nodes (33): assertHallazgoIntegridad_(), assertSinHallazgoIntegridad_(), concatenarHallazgosFuncionales_(), construirDocumentoPruebaIntegridad_(), eliminarFilaPorIdIntegridad_(), insertarFilaCrudaIntegridad_(), obtenerHojaEntidadPruebaIntegridad_(), probarIntegridadCapacidadSemanalInsuficiente() (+25 more)

### Community 14 - "obtenerReporteIntegridad"
Cohesion: 0.06
Nodes (32): auditarFaseC01_FechaFinRealAnteriorInicioReal(), auditarFaseC02_FechaFinPlanAnteriorInicioPlan(), auditarFaseC03_EnProcesoSinFechaInicioReal(), auditarFaseC03_PendienteConFechaInicioReal(), auditarFaseC03_PreparadaConFechaInicioReal(), auditarFaseC03_TerminadaSinDuracionReal(), auditarFaseC03_TerminadaSinFechaFinReal(), auditarFaseC03_TerminadaSinFechaInicioReal() (+24 more)

### Community 15 - "registrarHistorial"
Cohesion: 0.12
Nodes (30): abrirDialogoDescargaCSV_(), abrirDialogoExportarClientesCSV(), abrirDialogoExportarFasesPorProductoCSV(), abrirDialogoExportarFichaCampanaCSV(), abrirDialogoExportarFichaConvocatoriaCSV(), abrirDialogoExportarFichaIncidenciaCSV(), abrirDialogoExportarFichaMaterialCSV(), abrirDialogoExportarFichaProcesoCSV() (+22 more)

### Community 16 - "exportarInformeCSV"
Cohesion: 0.09
Nodes (30): abrirDialogoExportarCSV(), abrirDialogoExportarPanelTemporalCSV(), abrirDialogoExportarPDF(), aplanarGrupoPanelTemporalCsv_(), aplanarInformeParaExportar_(), aplanarValorParaExportar_(), bloquesACsv_(), buscarEntradaRegistroInforme_() (+22 more)

### Community 17 - "eliminarRegistroPruebaPorId_"
Cohesion: 0.07
Nodes (30): ejecutarSuitePaso182a184(), eliminarRegistroPruebaPorId_(), listarCampanasActivas(), pruebaPaso131_PrioridadRelacionInvalida(), pruebaPaso132_CantidadRelacionInvalida(), pruebaPaso133_RelacionValidaDryRun(), pruebaPaso134_InsertarRelacionReal(), pruebaPaso135_EliminarDatosRelacionPrueba() (+22 more)

### Community 18 - "construirProcesoDePrueba_"
Cohesion: 0.15
Nodes (29): construirProcesoDePrueba_(), ejecutarFaseC07_RegresionFinalProcesoTarea(), ejecutarSuitePaso197a202(), ejecutarSuitePaso203a214(), ejecutarSuitePaso215a221(), eliminarFilaPorIdPaso168_(), limpiarProcesoDePrueba_(), pruebaPaso161_ProcesoTareaInexistente() (+21 more)

### Community 19 - "cacheLecturaFinalizarContexto_"
Cohesion: 0.11
Nodes (27): agruparErroresRepetidos_(), cacheLecturaFinalizarContexto_(), comprobarHuerfanosImportacionMasiva(), confirmarImportacionAsignaciones(), confirmarImportacionEjecucion(), confirmarImportacionHorario(), confirmarImportacionMasiva(), confirmarImportacionRecursosPersonas() (+19 more)

### Community 20 - "construirInstruccionesPlantilla_"
Cohesion: 0.10
Nodes (27): analizarCSV_(), buscarDefinicionStaging_(), construirInstruccionesEscenario_(), cuantos(), intensidad(), construirInstruccionesPlantilla_(), construirLineaCSV_(), construirPromptIA_() (+19 more)

### Community 21 - "leerVariasEntidadesBatch_"
Cohesion: 0.14
Nodes (24): cacheLecturaIniciarContexto_(), calcularDiasFueraDeHorario_(), calcularProgresoTareasPorProceso_(), construirMapaContextoPorProductoDesdeFilas_(), diaCubiertoPorHorarios_(), leerVariasEntidadesBatch_(), loteConvertirValor_(), loteEsColumnaFecha_() (+16 more)

### Community 22 - "limpiarResiduosPruebaPorTexto_"
Cohesion: 0.14
Nodes (25): crearPersonaPrueba_(), ejecutarSuitePaso272a290(), ejecutarSuitePaso277a280(), ejecutarSuitePaso281a284(), ejecutarSuitePaso285a290(), ejecutarSuitePaso291a295(), limpiarResiduosP260(), limpiarResiduosP263() (+17 more)

### Community 23 - "serializarParaCliente_"
Cohesion: 0.11
Nodes (24): abrirDialogoExportarFichaProductoCSV(), abrirDialogoExportarFichaProyectoCSV(), abrirDialogoExportarFichaTareaCSV(), calcularDesviacionRegistro_(), calcularRiesgoRegistro_(), diferenciaDiasDuracion_(), diferenciaDiasFechas_(), estadoStockMaterial_() (+16 more)

### Community 24 - "escribirCamposRegistroIntegridad_"
Cohesion: 0.21
Nodes (24): ejecutarSuiteIntegridadGap21ReglasFuncionales(), ejecutarSuiteIntegridadGap21ReglasFuncionalesLote1(), ejecutarSuiteIntegridadGap21ReglasFuncionalesLote2(), ejecutarSuiteIntegridadGap21ReglasFuncionalesLote3(), escribirCamposRegistroIntegridad_(), probarIntegridadDecisionAbiertaConResolucionInformada(), probarIntegridadDecisionFechaLimiteAnteriorCreacion(), probarIntegridadDecisionFechaResolucionAnteriorCreacion() (+16 more)

### Community 25 - "generarInformeCampania"
Cohesion: 0.16
Nodes (22): abrirDialogoExportarArbolCampanaCSV(), auditarJerarquiaProductoProcesoTarea(), calcularAvanceProducto_(), contarPorEstadoLista_(), exportarArbolCampanaCSV(), generarInformeCampania(), generarInformeCierreCampana(), generarInformeProyecto() (+14 more)

### Community 26 - "ejecutarSuiteModulosInstalados"
Cohesion: 0.11
Nodes (23): abrirImportacionMasivaInicio(), abrirInformes(), abrirInstalarEstructuraInicial(), abrirMapaSheet(), abrirProteccionHojas(), categoriaInstalable_(), ejecutarSuiteModulosInstalados(), hojaInstalable_() (+15 more)

### Community 27 - "ejecutarImportacionRecursosPersonas_"
Cohesion: 0.16
Nodes (20): ejecutarImportacionAsignaciones_(), validarCatalogo_(), ejecutarImportacionEjecucion_(), validarCatalogo_(), ejecutarImportacionHorario_(), validarCatalogo_(), ejecutarImportacionRecursosPersonas_(), validarCatalogo_() (+12 more)

### Community 28 - "abrirFichaPorEntidad_"
Cohesion: 0.09
Nodes (22): abrirFichaCampana(), abrirFichaConvocatoria(), abrirFichaDesdeResultadoBusqueda(), abrirFichaMaterial(), abrirFichaPersonaEquipo(), abrirFichaPorEntidad_(), abrirFichaProceso(), abrirFichaProducto() (+14 more)

### Community 29 - "listarRegistrosSeguro_"
Cohesion: 0.13
Nodes (22): comandoBotHoy_(), comandoBotMisTareas_(), enriquecerConNombreResponsableProceso_(), enviarMensajeTelegram_(), expandirTareasPorResponsable_(), formatoFechaISO_(), listarCapacidadRecursos(), listarRecursosNoDisponibles() (+14 more)

### Community 30 - "calcularCosteTotalPorCategoria_"
Cohesion: 0.17
Nodes (19): calcularCosteActividadPorCategoria_(), calcularCosteMaterialesEstimado_(), calcularCosteRecursosAtribuido_(), calcularCosteTotalPorCategoria_(), calcularFuentesFinanciacionAmbito_(), calcularImpactoSocialAmbito_(), calcularPresupuestoPorCategoria_(), calcularReutilizacionAmbito_() (+11 more)

### Community 31 - "ejecutarPruebaIntegridadMutacion_"
Cohesion: 0.18
Nodes (20): copiarRegistroIntegridad_(), ejecutarPruebaIntegridadMutacion_(), ejecutarSuiteIntegridadCoberturaDirectaPendiente(), parseFechaIntegridad_(), probarIntegridadCampanaCerradaConProyectoActivo(), probarIntegridadIncidenciaResolucionAnteriorDeteccion(), probarIntegridadMaterialCodigoVacio(), probarIntegridadMaterialNombreVacio() (+12 more)

### Community 32 - "pruebaPaso263_IntegridadYBajaReactivacion"
Cohesion: 0.16
Nodes (19): abrirRecalcularPuntuacionEncajeOportunidades(), calcularPuntuacionEncajeOportunidad_(), construirCadenaCompletaPrueba_(), debugContenidoEstadoTarea(), ejecutarSuitePaso248a251(), ejecutarSuitePaso260a264(), limpiarCadenaCompletaPrueba_(), listarCategoriasDisponibles() (+11 more)

### Community 33 - "instalarPaqueteDatosInformes"
Cohesion: 0.13
Nodes (10): instalarAsignacionRelacionAmpliado(), instalarDecisionesAmpliado(), instalarDocumentosVinculosRecurso(), instalarEquipoMiembroAmpliado(), instalarLimpiezaProcesosPrueba(), instalarPaqueteDatosInformes(), instalarProductoMaterialAmpliado(), instalarProveedorMaterialAmpliado() (+2 more)

### Community 34 - "obtenerPanelTemporal"
Cohesion: 0.16
Nodes (18): agruparPorResponsablePanelTemporal_(), anadirDiasAtrasoPanelTemporal_(), calcularRangoPanelTemporal_(), construirBloquePanelTemporal_(), construirResolutorContextoPanelTemporal_(), contextoDesdeProyectoId_(), contextoVacio_(), diagnosticarPanelTemporal_() (+10 more)

### Community 35 - "auditarFaseB10_MatrizFinalRelacionesMateriales"
Cohesion: 0.12
Nodes (17): auditarFaseB01_DuplicidadProductoMaterial(), auditarFaseB03_DuplicidadTareaMaterial(), auditarFaseB05_MatrizPreventivaCantidadesTareaMaterial(), auditarFaseB06_CantidadesNegativasHistoricas(), auditarFaseB07_RelacionesConRegistrosInactivos(), auditarFaseB08_IntegridadHistoricaRegistrosInactivos(), auditarFaseB09_DuplicidadesHistoricasMateriales(), auditarFaseB10_CierreIntegridadRelacionesMateriales() (+9 more)

### Community 36 - "obtenerPanelOperativo"
Cohesion: 0.22
Nodes (17): avanceEfectivo_(), generarInformeEjecutivo(), generarInformeExcepciones(), listarAsignacionesSinEncajeCompetencia(), listarAsignacionesSinEncajeRecurso(), listarDecisionesPendientes(), listarIncidenciasAbiertas(), listarProcesosSinFechas() (+9 more)

### Community 37 - "aplicarTodasLasValidacionesMVP"
Cohesion: 0.12
Nodes (16): aplicarTodasLasValidacionesMVP(), aplicarValidacionesCampanas(), aplicarValidacionesDecisiones(), aplicarValidacionesDocumentos(), aplicarValidacionesIncidencias(), aplicarValidacionesMateriales(), aplicarValidacionesPersonasEquipos(), aplicarValidacionesProcesos() (+8 more)

### Community 38 - "obtenerSiguienteIdEntidad"
Cohesion: 0.13
Nodes (16): ejecutarSuitePaso171a175(), ejecutarSuitePaso179a181(), obtenerSiguienteId(), obtenerSiguienteIdEntidad(), probarConfiguracionEntidadesIds(), probarErroresObtenerSiguienteIdEntidad(), probarGeneradorIds(), probarObtenerSiguienteIdEntidad() (+8 more)

### Community 39 - "abrirSelectorConAccion_"
Cohesion: 0.13
Nodes (15): abrirCatalogosAdmin(), abrirConfirmarRecepcion(), abrirFichaCampanaBuscar(), abrirFichaConvocatoriaBuscar(), abrirFichaIncidenciaBuscar(), abrirFichaMaterialBuscar(), abrirFichaPersonaEquipoBuscar(), abrirFichaProcesoBuscar() (+7 more)

### Community 40 - "validarReglasNegocioFormulario_"
Cohesion: 0.13
Nodes (15): ejecutarSuiteM1Per003DryRun(), generarIdInexistenteM1Per003_(), registrarSkipM1Per003_(), validarEquipoMiembro_(), validarReglasNegocioDecision_(), validarReglasNegocioDocumento_(), validarReglasNegocioEquipoMiembro_(), validarReglasNegocioFormulario_() (+7 more)

### Community 41 - "obtenerIdsDeEntidad_"
Cohesion: 0.19
Nodes (14): auditarIntegridadDecisionAbiertaConDatosCierre(), auditarIntegridadDecisionCerradaSinResolucion(), auditarIntegridadDecisionFechaLimiteAnteriorCreacion(), auditarIntegridadDecisionFechaResolucionAnteriorCreacion(), auditarIntegridadDecisionProyectoHuerfano(), auditarIntegridadDecisionResponsableHuerfano(), cacheLecturaEjecutar_(), cacheLecturaFilasObjetos_() (+6 more)

### Community 42 - "generarInformeCalidadPlanificacion"
Cohesion: 0.29
Nodes (13): calcularDesviacionAgregada_(), calcularDesviacionPorRecurso_(), construirBloqueDesviacion_(), construirDetalleDesviacion_(), construirMapaCampanaPorProducto_(), enriquecerConCampana_(), enriquecerConDesviacion_(), generarInformeCalidadPlanificacion() (+5 more)

### Community 43 - "ejecutarSuitePaso171a202"
Cohesion: 0.14
Nodes (14): ejecutarSuitePaso171a202(), ejecutarSuitePaso171a214(), ejecutarSuitePaso176a178(), ejecutarSuitePaso191a193(), ejecutarSuitePaso194a196(), pruebaPaso176_Material_CasosInvalidos(), pruebaPaso177_Material_ValidoYReal(), pruebaPaso178_ReinicioIdMaterial() (+6 more)

### Community 44 - "ejecutarLotePruebasReactivas_"
Cohesion: 0.21
Nodes (13): abrirEjecutorPruebasReactivas(), abrirEjecutorPruebasReactivasSegundoPlano(), detenerEjecucionEnSegundoPlanoPruebasReactivas_(), ejecutarLotePruebasReactivas_(), ejecutarTriggerLotePruebasReactivas_(), escribirFilaResultadoPruebaReactiva_(), haySegundoPlanoActivoPruebasReactivas_(), iniciarEjecucionEnSegundoPlanoPruebasReactivas_() (+5 more)

### Community 45 - "pruebaPaso241_DecisionesPendientesMarcaVencida"
Cohesion: 0.22
Nodes (13): construirProyectoDePrueba_(), detectarIdsDuplicados(), ejecutarSuitePaso188a190(), ejecutarSuitePaso256a259(), limpiarProyectoDePrueba_(), pruebaPaso188_DecisionFKInvalida(), pruebaPaso189_DecisionImpactoInvalido(), pruebaPaso190_DecisionValida() (+5 more)

### Community 46 - "obtenerDisponibilidadEntidades"
Cohesion: 0.22
Nodes (10): clasificarTareaPorFecha_(), construirMapaContextoPorProducto_(), etiquetaEntidadGenerica_(), hhmmDesdeMinutos_(), intersectarIntervalos_(), minutosDesdeHHMM_(), normalizarHoraHHMM_(), obtenerDisponibilidadEntidades() (+2 more)

### Community 47 - "abrirFormularioEditarPorId"
Cohesion: 0.22
Nodes (9): abrirDependienteConRetorno(), abrirEdicionConRetornoAFicha(), abrirFichaIncidencia(), abrirFormularioEditarPorId(), abrirRegistroListado(), abrirRetorno(), resolverEtiquetaRetorno_(), seleccionarYAbrirEdicion() (+1 more)

### Community 48 - "asegurarRangosNombradosCatalogo_"
Cohesion: 0.22
Nodes (9): abrirInstalarCatalogoClienteL4(), abrirInstalarCatalogoComprasL4(), abrirInstalarCatalogoOportunidadL4(), abrirInstalarCatalogoVentasL4(), asegurarRangosNombradosCatalogo_(), instalarCatalogoClienteL4(), instalarCatalogoComprasL4(), instalarCatalogoOportunidadL4() (+1 more)

### Community 49 - "obtenerOpcionesEntidadParaSelector"
Cohesion: 0.28
Nodes (9): aplicarSufijoNivelDato_(), buscarGlobal(), etiquetaExtraSelector_(), filtrarPorNivelDato_(), obtenerOpcionesCampanasActivas(), obtenerOpcionesEntidadParaSelector(), resolverEtiquetaPrincipal_(), resolverNivelDatoPorCampana_() (+1 more)

### Community 50 - "ejecutarSuiteM1Per001DryRun"
Cohesion: 0.31
Nodes (9): assertRechazoM1Per001_(), buscarDesactivadoM1Per001_(), buscarEquipoValidoM1Per001_(), buscarEstadoInactivoM1Per001_(), buscarFixtureM1Per001_(), buscarPersonaValidaM1Per001_(), datosPersonaEquipoM1Per001_(), ejecutarSuiteM1Per001DryRun() (+1 more)

### Community 51 - "obtenerCatalogo"
Cohesion: 0.25
Nodes (8): auditarCatalogoEstadosDecision(), obtenerCatalogo(), obtenerValoresCatalogoParaGestion(), probarIntegridadCatalogosAmpliadosL2(), probarIntegridadCatalogosPedidoRecepcionAmpliados(), probarIntegridadCatalogosRecursoAmpliados(), probarIntegridadCatalogosRolPersonaYAsignacionAmpliados(), probarIntegridadCatalogoTipoVinculoIncidenciaAmpliado()

### Community 52 - "ejecutarImportacionMasiva_"
Cohesion: 0.25
Nodes (3): ejecutarImportacionMasiva_(), validarCatalogo_(), validarReferenciaPadre_()

### Community 53 - "obtenerAlertasMaterialesSeguro_"
Cohesion: 0.32
Nodes (8): listarConsumoDesperdicioMaterial(), listarMaterialesAgotados(), listarMaterialesCriticos(), listarMaterialesStockBajo(), listarNecesidadesReposicion(), listarReservasSuperanStock(), obtenerAlertasMaterialesSeguro_(), pruebaPaso287_AlertasStockMaterial()

### Community 54 - "buscarRegistros"
Cohesion: 0.33
Nodes (6): buscarCampanas(), buscarProcesos(), buscarProductos(), buscarProyectos(), buscarRegistros(), buscarTareas()

### Community 55 - "obtenerVistaFasesPorProducto"
Cohesion: 0.33
Nodes (5): calcularCuelloDeBotella_(), calcularUtilizacionHorarioPorResponsable_(), duracionDias_(), obtenerDatosFasesPorProducto(), obtenerVistaFasesPorProducto()

### Community 56 - "obtenerFichaIncidencia"
Cohesion: 0.40
Nodes (6): cambiarEstadoIncidenciaDesdeFicha(), cambiarEstadoIncidenciaRapido_(), cambiarEstadoKanban(), gestionarCreacionTareaMantenimientoDesdeIncidencia_(), obtenerFichaIncidencia(), obtenerVinculosDeEntidad()

### Community 57 - "instalarCicloProveedorAmpliado"
Cohesion: 0.40
Nodes (6): instalarCicloProveedorAmpliado(), crearLinea_(), crearMovimiento_(), crearRecepcionLinea_(), fechaComoTexto_(), pedidoYaExiste()

### Community 58 - "pruebaPaso169_OrdenPredecesoraInvalido"
Cohesion: 0.40
Nodes (4): pruebaPaso169_OrdenPredecesoraInvalido(), pruebaPaso170_PredecessoraValidaDryRun(), construirFila_(), eliminarFilasPorId_()

### Community 59 - "obtenerDatosListado"
Cohesion: 0.40
Nodes (5): contextoIncidenciaListado_(), obtenerDatosListado(), obtenerListadoDecisionesPendientes_(), obtenerListadoDocumentosVigentes_(), obtenerListadoIncidenciasAbiertas_()

### Community 60 - "exportarCodigoSinTests"
Cohesion: 0.60
Nodes (5): crearExportacionGs_(), exportarCodigoSinTests(), exportarCodigoSoloTests(), normalizarTextoLog_(), obtenerContenidoProyectoExportacion_()

### Community 61 - "abrirGanttPlanReal"
Cohesion: 0.50
Nodes (4): abrirGanttFiltradoProducto(), abrirGanttParaCampana(), abrirGanttParaProyecto(), abrirGanttPlanReal()

### Community 62 - "abrirHojaAdmin_"
Cohesion: 0.50
Nodes (4): abrirHistorialAdmin(), abrirHojaAdmin_(), abrirPersonasEquiposAdmin(), abrirProveedoresAdmin()

### Community 63 - "codigosIntegridadM1Per003_"
Cohesion: 0.67
Nodes (4): assertAutorrelacionM1Per003_(), assertCodigosM1Per003_(), codigosIntegridadM1Per003_(), ejecutarSuiteM1Per003IntegridadMemoria()

### Community 64 - "probarIntegridadProcesoFinPosteriorProductoRequerido"
Cohesion: 0.83
Nodes (4): buscarFilaPorIdIntegridad_(), obtenerMapaCabecerasIntegridad_(), probarIntegridadProcesoFinPosteriorProductoRequerido(), restaurarRegistroIntegridad_()

### Community 65 - "obtenerResumenGlobal"
Cohesion: 0.50
Nodes (4): contarPorEstado_(), contarPorEstadoSeguro_(), obtenerResumenGlobal(), pruebaPaso238_ResumenGlobalTieneLasSieteEntidades()

### Community 66 - "instrumentacionActivarFlush_"
Cohesion: 0.67
Nodes (4): instrumentacionActivarFlush_(), instrumentacionMedirFuncion_(), instrumentacionObtenerContadores(), instrumentacionReiniciarContadores()

### Community 67 - "obtenerArbolPersonas"
Cohesion: 0.67
Nodes (4): obtenerArbolPersonas(), construirNodo_(), obtenerArbolRecursos(), construirNodo_()

### Community 68 - "pruebaPaso310_NuevoRegistroMaterialYPersonaEquipoDisponibles"
Cohesion: 0.67
Nodes (3): abrirFormularioCrearMaterial(), abrirFormularioCrearPersonaEquipo(), pruebaPaso310_NuevoRegistroMaterialYPersonaEquipoDisponibles()

### Community 69 - "abrirPanelCampanaEnCampana"
Cohesion: 0.67
Nodes (3): abrirPanelCampana(), abrirPanelCampanaEnCampana(), guardarUltimaCampanaPanel()

### Community 70 - "assertCasoIntegridadM1Per001_"
Cohesion: 0.67
Nodes (3): assertCasoIntegridadM1Per001_(), ejecutarSuiteM1Per001IntegridadMemoria(), evaluarIntegridadM1Per001EnMemoria_()

### Community 71 - "pruebaPaso304_IntegridadFuncionalDetectaReservaMayorQueStock"
Cohesion: 0.67
Nodes (3): hayProblemasIntegridad(), pruebaPaso259_HayProblemasIntegridad(), pruebaPaso304_IntegridadFuncionalDetectaReservaMayorQueStock()

### Community 72 - "instalarHorarioEquipoProduccion"
Cohesion: 1.00
Nodes (3): instalarHorarioEquipoProduccion(), crearHorarioSemanaCompleta_(), crearHorarioSiFalta_()

## Knowledge Gaps
- **7 isolated node(s):** `CONFIG_EXPORTACION_CODIGO_`, `MODULO_POR_ENTIDAD_MVP`, `ENTIDADES_MVP`, `MODULO_POR_HOJA_MVP`, `CAMPOS_OBLIGATORIOS_MVP` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ejecutarImportacionMasiva_()` connect `ejecutarImportacionMasiva_` to `engremiat-live.concat.js`, `insertarRegistroTransaccional`, `ejecutarImportacionRecursosPersonas_`, `cacheLecturaFinalizarContexto_`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `listarRegistros()` connect `listarRegistros` to `engremiat-live.concat.js`, `insertarRegistroTransaccional`, `guardarFormulario`, `obtenerRegistroPorId`, `construirCadenaTareaPrueba_`, `assertHallazgoIntegridad_`, `registrarHistorial`, `exportarInformeCSV`, `eliminarRegistroPruebaPorId_`, `construirProcesoDePrueba_`, `construirInstruccionesPlantilla_`, `leerVariasEntidadesBatch_`, `limpiarResiduosPruebaPorTexto_`, `serializarParaCliente_`, `escribirCamposRegistroIntegridad_`, `generarInformeCampania`, `listarRegistrosSeguro_`, `calcularCosteTotalPorCategoria_`, `ejecutarPruebaIntegridadMutacion_`, `pruebaPaso263_IntegridadYBajaReactivacion`, `instalarPaqueteDatosInformes`, `obtenerPanelTemporal`, `auditarFaseB10_MatrizFinalRelacionesMateriales`, `obtenerPanelOperativo`, `validarReglasNegocioFormulario_`, `obtenerIdsDeEntidad_`, `generarInformeCalidadPlanificacion`, `obtenerDisponibilidadEntidades`, `obtenerOpcionesEntidadParaSelector`, `ejecutarSuiteM1Per001DryRun`, `obtenerAlertasMaterialesSeguro_`, `obtenerFichaIncidencia`, `instalarCicloProveedorAmpliado`, `obtenerDatosListado`, `probarIntegridadProcesoFinPosteriorProductoRequerido`, `obtenerResumenGlobal`, `obtenerArbolPersonas`, `instalarHorarioEquipoProduccion`, `diagnosticarFaseC01_EstadoOriginalTarea`, `obtenerSugerenciaSecuencia`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `insertarRegistroTransaccional()` connect `insertarRegistroTransaccional` to `engremiat-live.concat.js`, `obtenerHojaEntidad_`, `doPost`, `guardarFormulario`, `obtenerRegistroPorId`, `construirCadenaTareaPrueba_`, `registrarHistorial`, `exportarInformeCSV`, `eliminarRegistroPruebaPorId_`, `construirProcesoDePrueba_`, `limpiarResiduosPruebaPorTexto_`, `ejecutarImportacionRecursosPersonas_`, `calcularCosteTotalPorCategoria_`, `pruebaPaso263_IntegridadYBajaReactivacion`, `auditarFaseB10_MatrizFinalRelacionesMateriales`, `obtenerSiguienteIdEntidad`, `validarReglasNegocioFormulario_`, `ejecutarSuitePaso171a202`, `pruebaPaso241_DecisionesPendientesMarcaVencida`, `ejecutarSuiteM1Per001DryRun`, `ejecutarImportacionMasiva_`, `obtenerAlertasMaterialesSeguro_`, `pruebaPaso169_OrdenPredecesoraInvalido`, `pruebaPaso304_IntegridadFuncionalDetectaReservaMayorQueStock`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `CONFIG_EXPORTACION_CODIGO_`, `MODULO_POR_ENTIDAD_MVP`, `ENTIDADES_MVP` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `engremiat-live.concat.js` be split into smaller, more focused modules?**
  _Cohesion score 0.025530694205393 - nodes in this community are weakly interconnected._
- **Should `abrirFormularioCrear_` be split into smaller, more focused modules?**
  _Cohesion score 0.024390243902439025 - nodes in this community are weakly interconnected._
- **Should `obtenerHojaEntidad_` be split into smaller, more focused modules?**
  _Cohesion score 0.05271629778672032 - nodes in this community are weakly interconnected._