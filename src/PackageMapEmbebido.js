/**
 * Generado por tools/packager/generate-package-map-embebido.mjs -- NO editar a mano.
 * Copia recortada de tools/packager/package-map.json (solo moduleDependencies y
 * las entradas de package A con su módulo) para que GeneradorEnvoltoriosEmbebido.js
 * pueda resolver módulos sin depender de Node en tiempo de ejecución.
 * Ver AprovisionamientoService.js (Fase 3 -- Aprovisionamiento).
 */
var PACKAGE_MAP_EMBEBIDO = {
  "moduleDependencies": {
    "CORE": [],
    "GANTT": [
      "CORE"
    ],
    "ECONOMICO": [
      "CORE"
    ],
    "IMPACTO": [
      "CORE",
      "ECONOMICO"
    ],
    "COMPRAS": [
      "CORE"
    ],
    "CONVOCATORIAS": [
      "CORE",
      "ECONOMICO"
    ],
    "CLIENTE": [
      "CORE"
    ],
    "VENTAS": [
      "CORE",
      "CLIENTE"
    ],
    "OPORTUNIDAD": [
      "CORE",
      "CLIENTE"
    ],
    "ESCENARIOS": [
      "CORE"
    ],
    "OPERATIVA": [
      "CORE"
    ],
    "SEGUIMIENTO": [
      "CORE"
    ],
    "EJECUCION": [
      "CORE"
    ],
    "APROVISIONAMIENTO": [
      "CORE"
    ],
    "COMUNICACION": [
      "CORE"
    ]
  },
  "entriesPackageA": [
    {
      "path": "src/AprobarSolicitudMontaje.html",
      "module": "APROVISIONAMIENTO"
    },
    {
      "path": "src/AprovisionamientoService.js",
      "module": "APROVISIONAMIENTO"
    },
    {
      "path": "src/AvanceYSecuencia.js",
      "module": "CORE"
    },
    {
      "path": "src/Biblioteca.html",
      "module": "CORE"
    },
    {
      "path": "src/BibliotecaService.js",
      "module": "CORE"
    },
    {
      "path": "src/BotOperativoService.js",
      "module": "COMUNICACION"
    },
    {
      "path": "src/BusquedaGlobalService.js",
      "module": "CORE"
    },
    {
      "path": "src/CacheLecturaService.js",
      "module": "CORE"
    },
    {
      "path": "src/CampaniaService.js",
      "module": "CORE"
    },
    {
      "path": "src/ConfigRepository.js",
      "module": "CORE"
    },
    {
      "path": "src/CosteService.js",
      "module": "ECONOMICO"
    },
    {
      "path": "src/DashboardService.js",
      "module": "CORE"
    },
    {
      "path": "src/DesviacionService.js",
      "module": "GANTT"
    },
    {
      "path": "src/DisponibilidadService.js",
      "module": "GANTT"
    },
    {
      "path": "src/EdicionDirecta.js",
      "module": "CORE"
    },
    {
      "path": "src/Estilos.html",
      "module": "CORE"
    },
    {
      "path": "src/EstructuraInicialDatos.js",
      "module": "CORE"
    },
    {
      "path": "src/EstructuraInicialService.js",
      "module": "CORE"
    },
    {
      "path": "src/EvidenciaSocialService.js",
      "module": "IMPACTO"
    },
    {
      "path": "src/FichaCampana.html",
      "module": "CORE"
    },
    {
      "path": "src/FichaCampanaService.js",
      "module": "CORE"
    },
    {
      "path": "src/FichaConvocatoria.html",
      "module": "CONVOCATORIAS"
    },
    {
      "path": "src/FichaConvocatoriaService.js",
      "module": "CONVOCATORIAS"
    },
    {
      "path": "src/FichaIncidencia.html",
      "module": "CORE"
    },
    {
      "path": "src/FichaIncidenciaService.js",
      "module": "CORE"
    },
    {
      "path": "src/FichaMaterial.html",
      "module": "COMPRAS"
    },
    {
      "path": "src/FichaMaterialService.js",
      "module": "COMPRAS"
    },
    {
      "path": "src/FichaPersonaEquipo.html",
      "module": "CORE"
    },
    {
      "path": "src/FichaPersonaEquipoService.js",
      "module": "CORE"
    },
    {
      "path": "src/FichaProceso.html",
      "module": "CORE"
    },
    {
      "path": "src/FichaProcesoService.js",
      "module": "CORE"
    },
    {
      "path": "src/FichaProducto.html",
      "module": "CORE"
    },
    {
      "path": "src/FichaProductoService.js",
      "module": "CORE"
    },
    {
      "path": "src/FichaProveedor.html",
      "module": "COMPRAS"
    },
    {
      "path": "src/FichaProveedorService.js",
      "module": "COMPRAS"
    },
    {
      "path": "src/FichaProyecto.html",
      "module": "CORE"
    },
    {
      "path": "src/FichaProyectoService.js",
      "module": "CORE"
    },
    {
      "path": "src/FichaRecurso.html",
      "module": "CORE"
    },
    {
      "path": "src/FichaRecursoService.js",
      "module": "CORE"
    },
    {
      "path": "src/FichaTarea.html",
      "module": "CORE"
    },
    {
      "path": "src/FichaTareaService.js",
      "module": "CORE"
    },
    {
      "path": "src/FormularioEsquemas.js",
      "module": "CORE"
    },
    {
      "path": "src/FormularioGenerico.html",
      "module": "CORE"
    },
    {
      "path": "src/FormularioMotorUI.js",
      "module": "CORE"
    },
    {
      "path": "src/FormularioValidacionService.js",
      "module": "CORE"
    },
    {
      "path": "src/GanttPlanReal.html",
      "module": "GANTT"
    },
    {
      "path": "src/GeneracionCodigo.js",
      "module": "CORE"
    },
    {
      "path": "src/GeneradorEnvoltoriosEmbebido.js",
      "module": "CORE"
    },
    {
      "path": "src/GestionCatalogo.html",
      "module": "CORE"
    },
    {
      "path": "src/GestionCatalogos.js",
      "module": "CORE"
    },
    {
      "path": "src/GestionRemotaClientes.html",
      "module": "APROVISIONAMIENTO"
    },
    {
      "path": "src/HistorialService.js",
      "module": "CORE"
    },
    {
      "path": "src/Ids.js",
      "module": "CORE"
    },
    {
      "path": "src/ImportacionMasiva.js",
      "module": "CORE"
    },
    {
      "path": "src/ImportacionMasivaAvanzada.js",
      "module": "OPERATIVA"
    },
    {
      "path": "src/ImportacionMasivaInicio.html",
      "module": "CORE"
    },
    {
      "path": "src/IncidenciaMantenimientoService.js",
      "module": "CLIENTE"
    },
    {
      "path": "src/Includes.js",
      "module": "CORE"
    },
    {
      "path": "src/IndicadorCargaGlobal.html",
      "module": "CORE"
    },
    {
      "path": "src/InformeGenerico.html",
      "module": "CORE"
    },
    {
      "path": "src/InformesVisuales.js",
      "module": "CORE"
    },
    {
      "path": "src/InstaladorClienteL4.js",
      "module": "CLIENTE"
    },
    {
      "path": "src/InstaladorComprasL4.js",
      "module": "COMPRAS"
    },
    {
      "path": "src/InstaladorImportacionMasiva.js",
      "module": "CORE"
    },
    {
      "path": "src/InstaladorImportacionMasivaAvanzada.js",
      "module": "OPERATIVA"
    },
    {
      "path": "src/InstaladorOportunidadL4.js",
      "module": "OPORTUNIDAD"
    },
    {
      "path": "src/InstaladorVentasL4.js",
      "module": "VENTAS"
    },
    {
      "path": "src/InstrumentacionService.js",
      "module": "CORE"
    },
    {
      "path": "src/IntegridadReporte.html",
      "module": "CORE"
    },
    {
      "path": "src/IntegrityService.js",
      "module": "CORE"
    },
    {
      "path": "src/KanbanOperativo.html",
      "module": "CORE"
    },
    {
      "path": "src/KanbanService.js",
      "module": "CORE"
    },
    {
      "path": "src/LecturaBatchService.js",
      "module": "CORE"
    },
    {
      "path": "src/ListadoFiltrable.html",
      "module": "CORE"
    },
    {
      "path": "src/ListadoFiltrableService.js",
      "module": "CORE"
    },
    {
      "path": "src/MapaSheet.html",
      "module": "CORE"
    },
    {
      "path": "src/MapaSheetService.js",
      "module": "CORE"
    },
    {
      "path": "src/MiTrabajo.html",
      "module": "CORE"
    },
    {
      "path": "src/MiTrabajoService.js",
      "module": "CORE"
    },
    {
      "path": "src/ModalConfirmar.html",
      "module": "CORE"
    },
    {
      "path": "src/NivelDatoService.js",
      "module": "CORE"
    },
    {
      "path": "src/OportunidadService.js",
      "module": "OPORTUNIDAD"
    },
    {
      "path": "src/PackageMapEmbebido.js",
      "module": "CORE"
    },
    {
      "path": "src/PanelCampana.html",
      "module": "CORE"
    },
    {
      "path": "src/PanelCampanaService.js",
      "module": "CORE"
    },
    {
      "path": "src/PanelClientes.html",
      "module": "CLIENTE"
    },
    {
      "path": "src/PanelClientesService.js",
      "module": "CLIENTE"
    },
    {
      "path": "src/PanelOperativo.html",
      "module": "CORE"
    },
    {
      "path": "src/PanelPersonas.html",
      "module": "CORE"
    },
    {
      "path": "src/PanelPersonasService.js",
      "module": "CORE"
    },
    {
      "path": "src/PanelRecursos.html",
      "module": "CORE"
    },
    {
      "path": "src/PanelRecursosService.js",
      "module": "CORE"
    },
    {
      "path": "src/PanelTemporal.html",
      "module": "CORE"
    },
    {
      "path": "src/PanelTemporalService.js",
      "module": "CORE"
    },
    {
      "path": "src/PanelVentas.html",
      "module": "VENTAS"
    },
    {
      "path": "src/PanelVentasService.js",
      "module": "VENTAS"
    },
    {
      "path": "src/PedidoRecepcionService.js",
      "module": "COMPRAS"
    },
    {
      "path": "src/PlantillaImportacionMasivaAvanzadaService.js",
      "module": "OPERATIVA"
    },
    {
      "path": "src/PlantillaImportacionMasivaService.js",
      "module": "CORE"
    },
    {
      "path": "src/ProcesoService.js",
      "module": "CORE"
    },
    {
      "path": "src/ProductoService.js",
      "module": "CORE"
    },
    {
      "path": "src/Proteccion.js",
      "module": "CORE"
    },
    {
      "path": "src/ProyectoService.js",
      "module": "CORE"
    },
    {
      "path": "src/ReportService.js",
      "module": "CORE"
    },
    {
      "path": "src/Repository.js",
      "module": "CORE"
    },
    {
      "path": "src/Repository_InsertarRegistro.js",
      "module": "CORE"
    },
    {
      "path": "src/Reversion.js",
      "module": "CORE"
    },
    {
      "path": "src/SelectorRegistro.html",
      "module": "CORE"
    },
    {
      "path": "src/SerializacionService.js",
      "module": "CORE"
    },
    {
      "path": "src/SolicitudMontaje.html",
      "module": "APROVISIONAMIENTO"
    },
    {
      "path": "src/StockMaterialService.js",
      "module": "COMPRAS"
    },
    {
      "path": "src/TareaService.js",
      "module": "CORE"
    },
    {
      "path": "src/TelegramSoporteService.js",
      "module": "APROVISIONAMIENTO"
    },
    {
      "path": "src/WebhookTelegramService.js",
      "module": "CORE"
    },
    {
      "path": "src/appsscript.json",
      "module": "CORE"
    }
  ]
};
