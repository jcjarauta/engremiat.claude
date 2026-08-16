/**
 * Definiciones de las hojas STG_* de los módulos OPERATIVA/SEGUIMIENTO/
 * EJECUCION (ver conversación -- "dejar el CORE limpio para acoplar
 * módulos a demanda del cliente" / "simplifica y construimos un core
 * optimizado"): Recursos/Personas/Asignaciones/Horario (OPERATIVA),
 * Seguimiento (Decisión/Incidencia/Documento, módulo SEGUIMIENTO) y
 * Ejecución (módulo EJECUCION) -- las 5 hojas de la jerarquía básica de
 * campaña (STG_CAMPANA/PROYECTO/PRODUCTO/PROCESO/TAREA) se quedan en
 * InstaladorImportacionMasiva.js/CORE.
 *
 * obtenerDefinicionesStagingCompletas_() (InstaladorImportacionMasiva.js)
 * combina este array con el de CORE en tiempo de ejecución -- nunca a
 * nivel de fichero, porque el orden de carga entre los .js de un
 * proyecto de Apps Script no está garantizado.
 */
var DEFINICIONES_STAGING_IMPORTACION_MASIVA_AVANZADA_ = [
    /*
     * Fase N8 (ver conversación): extiende el patrón STG_* a Recursos y
     * Personas -- a diferencia de la jerarquía de campaña (profundidad
     * fija de 5 niveles), RECURSO es un árbol de profundidad variable
     * (UBICACION_ID autorreferenciado). En vez de exigir que cada fila
     * padre aparezca antes que sus hijas en la hoja, se importa en dos
     * pasadas (ver ImportacionMasiva.js): 1) todas las filas sin
     * UBICACION_ID, 2) actualiza UBICACION_ID ya con todos los IDs
     * reales resueltos -- sin restricción de orden de filas.
     */
    {
      hoja: 'STG_RECURSO',
      modulo: 'OPERATIVA',
      cabeceras: ['ID_TEMPORAL', 'UBICACION_TEMPORAL', 'CODIGO', 'NOMBRE', 'CLASE_RECURSO', 'CATEGORIA_RECURSO', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    /*
     * PERSONA/EQUIPO: mismo criterio de dos pasadas para COORDINADOR_ID
     * (solo válido en filas TIPO=Equipo, apuntando a una fila
     * TIPO=Persona -- la propia regla de negocio ya existente en
     * Repository_InsertarRegistro.js se aplica igual en la segunda
     * pasada, vía actualizarRegistroTransaccional, sin duplicarla aquí).
     * EQUIPO_MIEMBRO (desglose N:M, L4) en hoja aparte, procesada
     * después de que todas las personas/equipos ya tengan ID real.
     */
    {
      hoja: 'STG_PERSONA',
      modulo: 'OPERATIVA',
      cabeceras: ['ID_TEMPORAL', 'COORDINADOR_TEMPORAL', 'TIPO', 'NOMBRE', 'ROL', 'CAPACIDAD_SEMANAL_DIAS', 'DISPONIBILIDAD', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    {
      hoja: 'STG_EQUIPO_MIEMBRO',
      modulo: 'OPERATIVA',
      cabeceras: ['ID_TEMPORAL', 'EQUIPO_TEMPORAL', 'MIEMBRO_TEMPORAL', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    /*
     * Fase N10 (ver conversación -- "el cuello de botella mas inmediato":
     * tras importar una campaña completa, asignar responsables/recursos
     * tarea a tarea a mano es justo el trabajo manual que este sistema
     * existe para evitar). TAREA_TEMPORAL/PERSONA_TEMPORAL/RECURSO_TEMPORAL
     * admiten tanto un ID real ya existente como el propio ID_TEMPORAL
     * usado al crear la tarea/persona/recurso -- resolverReferenciaStaging_
     * (ImportacionMasiva.js) lo busca en la hoja STG_* de origen aunque
     * esa fila ya este importada (ID_REAL relleno), para poder seguir
     * usando las mismas claves cortas del lote original sin tener que
     * conocer los IDs reales generados.
     */
    {
      hoja: 'STG_TAREA_RESPONSABLE',
      modulo: 'OPERATIVA',
      cabeceras: ['ID_TEMPORAL', 'TAREA_TEMPORAL', 'PERSONA_TEMPORAL', 'ROL_ASIGNADO', 'PORCENTAJE_DEDICACION', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    {
      hoja: 'STG_TAREA_RECURSO',
      modulo: 'OPERATIVA',
      cabeceras: ['ID_TEMPORAL', 'TAREA_TEMPORAL', 'RECURSO_TEMPORAL', 'TIPO_USO', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    /*
     * Fase N11 (ver conversación -- "necesitamos poder volcar al sheet
     * todos los datos necesarios para que los informes... estén
     * completos"). DECISION exige PROYECTO_TEMPORAL (nivel fijo, igual
     * que Proyecto/Producto/Proceso/Tarea). RESOLUCION/FECHA_RESOLUCION
     * opcionales pero condicionales -- mismo patrón que FECHA_INICIO_REAL
     * en v54: Repository_InsertarRegistro.js exige ambas si ESTADO es de
     * cierre (Aprobada/Rechazada/Sustituida), ver
     * validarCoherenciaDecision_ (ImportacionMasiva.js).
     */
    {
      hoja: 'STG_DECISION',
      modulo: 'SEGUIMIENTO',
      cabeceras: ['ID_TEMPORAL', 'PROYECTO_TEMPORAL', 'TITULO', 'CONTEXTO', 'TIPO', 'RESPONSABLE_TEMPORAL', 'FECHA_LIMITE', 'ESTADO', 'RESOLUCION', 'FECHA_RESOLUCION', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    /*
     * INCIDENCIA no tiene un nivel jerárquico fijo (a diferencia de
     * Decisión): puede colgar de Campaña, Proyecto, Producto, Proceso o
     * Tarea -- NIVEL_INCIDENCIA indica cuál, y solo esa columna
     * *_TEMPORAL debe rellenarse (ver resolverEntidadPoliformica_ en
     * ImportacionMasiva.js). CLIENTE_TEMPORAL queda fuera de esta V1
     * (módulo CLIENTE, no CORE).
     */
    {
      hoja: 'STG_INCIDENCIA',
      modulo: 'SEGUIMIENTO',
      cabeceras: ['ID_TEMPORAL', 'NIVEL_INCIDENCIA', 'CAMPANA_TEMPORAL', 'PROYECTO_TEMPORAL', 'PRODUCTO_TEMPORAL', 'PROCESO_TEMPORAL', 'TAREA_TEMPORAL', 'TITULO', 'DESCRIPCION', 'TIPO', 'PRIORIDAD', 'RESPONSABLE_TEMPORAL', 'FECHA_DETECCION', 'FECHA_LIMITE', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    /*
     * DOCUMENTO es igual de polimórfico que INCIDENCIA (ENTIDAD_TIPO en
     * vez de NIVEL_INCIDENCIA) pero acotado a los 5 niveles de la
     * jerarquía de campaña -- Decisión/Incidencia/Documento/Recurso/
     * Persona/Convocatoria/Cliente como destino de un documento son
     * casos raros, fuera de esta V1.
     */
    {
      hoja: 'STG_DOCUMENTO',
      modulo: 'SEGUIMIENTO',
      cabeceras: ['ID_TEMPORAL', 'ENTIDAD_TIPO', 'CAMPANA_TEMPORAL', 'PROYECTO_TEMPORAL', 'PRODUCTO_TEMPORAL', 'PROCESO_TEMPORAL', 'TAREA_TEMPORAL', 'TIPO_DOCUMENTO', 'TITULO', 'DESCRIPCION', 'VERSION', 'URL', 'ESTADO', 'FECHA_DOCUMENTO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    /*
     * HORARIO: ENTIDAD_TIPO decide si se usa PERSONA_TEMPORAL o
     * RECURSO_TEMPORAL (mutuamente excluyentes, no genérico como
     * Documento/Incidencia -- solo dos niveles posibles, más simple
     * dejarlo explícito). HORA_INICIO/HORA_FIN como texto "HH:MM":
     * Repository_InsertarRegistro.js NO valida su formato en el commit
     * (esa regla vive en FormularioValidacionService.js, solo en el
     * camino del formulario manual) -- el dry-run del importador la
     * replica igualmente para no dejar pasar horarios rotos en silencio.
     */
    {
      hoja: 'STG_HORARIO',
      modulo: 'OPERATIVA',
      cabeceras: ['ID_TEMPORAL', 'ENTIDAD_TIPO', 'PERSONA_TEMPORAL', 'RECURSO_TEMPORAL', 'DIA_SEMANA', 'HORA_INICIO', 'HORA_FIN', 'FECHA_INICIO_VIGENCIA', 'FECHA_FIN_VIGENCIA', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL'],
      /*
       * Sin esto, Sheets autoconvierte "09:00" escrito en una celda con
       * formato Automático a un valor de hora (Date) en cuanto se
       * escribe -- tanto al pegar/escribir a mano como al volcar el CSV
       * vía escribirFilasCSVEnHojaStaging -- y el dry-run del importador
       * ve un objeto Date en vez del texto "09:00", fallando la
       * validación de formato HH:MM en el 100% de las filas (hallazgo
       * real en vivo). Forzar estas dos columnas a texto plano evita la
       * autoconversión en origen.
       */
      columnasTexto: ['HORA_INICIO', 'HORA_FIN']
    },
    /*
     * EJECUCION_TAREA: registro real de trabajo hecho sobre una tarea
     * (quién, cuándo, con qué resultado) -- distinto de TAREA (que solo
     * tiene la fecha/estado planificados). Sin esta hoja, un cliente que
     * quisiera reconstruir en bloque el histórico de una campaña ya
     * cerrada solo podía cargarlo fila a fila desde la Ficha de tarea.
     * RESULTADO usa el catálogo ya sembrado RESULTADO_EJECUCION (Exitosa/
     * Con incidencias/Fallida) -- no hace falta crear catálogo nuevo.
     */
    {
      hoja: 'STG_EJECUCION_TAREA',
      modulo: 'EJECUCION',
      cabeceras: ['ID_TEMPORAL', 'TAREA_TEMPORAL', 'RESPONSABLE_TEMPORAL', 'FECHA_INICIO', 'FECHA_FIN', 'DURACION_REAL_DIAS', 'ESTADO', 'RESULTADO', 'OBSERVACIONES', 'ESTADO_IMPORTACION', 'ID_REAL']
    }
];
