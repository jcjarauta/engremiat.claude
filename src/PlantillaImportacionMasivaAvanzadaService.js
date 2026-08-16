/**
 * Datos de plantilla/LEEME/PROMPT_IA del módulo IMPORTACION_AVANZADA
 * (ver conversación -- "dejar el CORE limpio para acoplar módulos a
 * demanda del cliente"): los 5 grupos que NO son la jerarquía básica de
 * campaña -- Recursos/Personas, Asignaciones, Seguimiento (Decisión/
 * Incidencia/Documento), Horario, Ejecución. El motor genérico
 * (construirInstruccionesPlantilla_/construirPromptIA_/
 * generarPlantillasImportacionMasiva/escribirFilasCSVEnHojaStaging/etc.)
 * se queda en PlantillaImportacionMasivaService.js/CORE y lee estas
 * tablas a través de sus funciones obtenerXxx_() (fallback CORE || AVANZADA),
 * nunca referenciándolas aquí directamente -- el orden de carga entre
 * los .js de un proyecto de Apps Script no está garantizado.
 */

var GRUPOS_PLANTILLA_IMPORTACION_MASIVA_AVANZADA_ = {
  RECURSOS_PERSONAS: ['STG_RECURSO', 'STG_PERSONA', 'STG_EQUIPO_MIEMBRO'],
  ASIGNACIONES: ['STG_TAREA_RESPONSABLE', 'STG_TAREA_RECURSO'],
  SEGUIMIENTO: ['STG_DECISION', 'STG_INCIDENCIA', 'STG_DOCUMENTO'],
  HORARIO: ['STG_HORARIO'],
  EJECUCION: ['STG_EJECUCION_TAREA']
};

/*
 * Alineado con MODULO_POR_ENTIDAD_MVP (Ids.js, ver conversación
 * "revisa las hojas que se siembran en la instalación inicial del
 * core, simplifica"): un mismo interruptor de módulo controla ahora
 * tanto si la hoja de entidad real existe como si su grupo de
 * importación masiva está disponible -- antes los 5 grupos colgaban
 * de un único IMPORTACION_AVANZADA que ya no existe como tal.
 */
var MODULO_POR_GRUPO_IMPORTACION_MASIVA_AVANZADA_ = {
  RECURSOS_PERSONAS: 'OPERATIVA',
  ASIGNACIONES: 'OPERATIVA',
  SEGUIMIENTO: 'SEGUIMIENTO',
  HORARIO: 'OPERATIVA',
  EJECUCION: 'EJECUCION'
};

var CAMPOS_OBLIGATORIOS_POR_HOJA_STAGING_AVANZADA_ = {
  STG_RECURSO: ['CODIGO', 'NOMBRE', 'CLASE_RECURSO', 'ESTADO'],
  STG_PERSONA: ['TIPO', 'NOMBRE', 'ROL', 'CAPACIDAD_SEMANAL_DIAS', 'DISPONIBILIDAD', 'ESTADO'],
  STG_EQUIPO_MIEMBRO: ['EQUIPO_TEMPORAL', 'MIEMBRO_TEMPORAL', 'ESTADO'],
  STG_TAREA_RESPONSABLE: ['TAREA_TEMPORAL', 'PERSONA_TEMPORAL', 'ROL_ASIGNADO', 'PORCENTAJE_DEDICACION', 'ESTADO'],
  STG_TAREA_RECURSO: ['TAREA_TEMPORAL', 'RECURSO_TEMPORAL', 'TIPO_USO', 'ESTADO'],
  STG_DECISION: ['PROYECTO_TEMPORAL', 'TITULO', 'TIPO', 'ESTADO'],
  STG_INCIDENCIA: ['NIVEL_INCIDENCIA', 'TITULO', 'TIPO', 'PRIORIDAD', 'FECHA_DETECCION', 'ESTADO'],
  STG_DOCUMENTO: ['ENTIDAD_TIPO', 'TIPO_DOCUMENTO', 'TITULO', 'URL', 'ESTADO'],
  STG_HORARIO: ['ENTIDAD_TIPO', 'DIA_SEMANA', 'HORA_INICIO', 'HORA_FIN', 'ESTADO'],
  STG_EJECUCION_TAREA: ['TAREA_TEMPORAL', 'ESTADO']
};

var CATALOGOS_POR_COLUMNA_STAGING_AVANZADA_ = {
  STG_RECURSO: { CLASE_RECURSO: 'CFG_CLASE_RECURSO', CATEGORIA_RECURSO: 'CFG_CATEGORIA_RECURSO', ESTADO: 'CFG_ESTADO_RECURSO_FISICO' },
  STG_PERSONA: { TIPO: 'CFG_TIPO_RECURSO', ROL: 'CFG_ROL_PERSONA', DISPONIBILIDAD: 'CFG_DISPONIBILIDAD', ESTADO: 'CFG_ESTADO_RECURSO' },
  STG_EQUIPO_MIEMBRO: {},
  STG_TAREA_RESPONSABLE: { ROL_ASIGNADO: 'CFG_ROL_ASIGNACION', ESTADO: 'CFG_ESTADO_ASIGNACION' },
  STG_TAREA_RECURSO: { TIPO_USO: 'CFG_TIPO_USO_RECURSO', ESTADO: 'CFG_ESTADO_RELACION' },
  STG_DECISION: { TIPO: 'CFG_TIPO_DECISION', ESTADO: 'CFG_ESTADO_DECISION' },
  STG_INCIDENCIA: { NIVEL_INCIDENCIA: 'CFG_NIVEL_INCIDENCIA', TIPO: 'CFG_TIPO_INCIDENCIA', PRIORIDAD: 'CFG_PRIORIDAD', ESTADO: 'CFG_ESTADO_INCIDENCIA' },
  STG_DOCUMENTO: { ENTIDAD_TIPO: 'CFG_ENTIDAD_DOCUMENTO', TIPO_DOCUMENTO: 'CFG_TIPO_DOCUMENTO', ESTADO: 'CFG_ESTADO_DOCUMENTO' },
  STG_HORARIO: { ENTIDAD_TIPO: 'CFG_ENTIDAD_HORARIO', DIA_SEMANA: 'CFG_DIA_SEMANA', ESTADO: 'CFG_ESTADO_RELACION' },
  STG_EJECUCION_TAREA: { ESTADO: 'CFG_ESTADO_RELACION', RESULTADO: 'CFG_RESULTADO_EJECUCION' }
};

var TEMPORALES_EXPLICADOS_POR_HOJA_AVANZADA_ = {
  STG_RECURSO: 'UBICACION_TEMPORAL (opcional) apunta al ID_TEMPORAL de otra fila de STG_RECURSO que sea su ubicación contenedora.',
  STG_PERSONA: 'COORDINADOR_TEMPORAL (opcional, solo si TIPO=Equipo) apunta al ID_TEMPORAL de otra fila de STG_PERSONA con TIPO=Persona.',
  STG_EQUIPO_MIEMBRO: 'EQUIPO_TEMPORAL y MIEMBRO_TEMPORAL apuntan cada uno al ID_TEMPORAL de una fila de STG_PERSONA.',
  STG_TAREA_RESPONSABLE: 'TAREA_TEMPORAL y PERSONA_TEMPORAL admiten un ID real ya existente, o el ID_TEMPORAL que se usó al crear esa tarea/persona en un lote anterior (aunque ya esté importado) -- no hace falta conocer el ID real generado.',
  STG_TAREA_RECURSO: 'TAREA_TEMPORAL y RECURSO_TEMPORAL admiten un ID real ya existente, o el ID_TEMPORAL que se usó al crear esa tarea/recurso en un lote anterior (aunque ya esté importado).',
  STG_DECISION: 'PROYECTO_TEMPORAL y RESPONSABLE_TEMPORAL (opcional) admiten un ID real o el ID_TEMPORAL de un lote anterior, igual que en Asignaciones.',
  STG_INCIDENCIA: 'Rellena SOLO UNA de CAMPANA_TEMPORAL/PROYECTO_TEMPORAL/PRODUCTO_TEMPORAL/PROCESO_TEMPORAL/TAREA_TEMPORAL, la que corresponda a NIVEL_INCIDENCIA (deja las demás vacías) -- todas admiten ID real o ID_TEMPORAL de un lote anterior. RESPONSABLE_TEMPORAL (opcional) igual. Nivel "Cliente" no está soportado por esta plantilla.',
  STG_DOCUMENTO: 'Rellena SOLO UNA de CAMPANA_TEMPORAL/PROYECTO_TEMPORAL/PRODUCTO_TEMPORAL/PROCESO_TEMPORAL/TAREA_TEMPORAL, la que corresponda a ENTIDAD_TIPO (deja las demás vacías) -- admite ID real o ID_TEMPORAL de un lote anterior. Otros valores de ENTIDAD_TIPO (Decisión, Incidencia, Recurso, Persona/Equipo, Convocatoria, Cliente) no están soportados por esta plantilla.',
  STG_HORARIO: 'Rellena PERSONA_TEMPORAL si ENTIDAD_TIPO="Persona/Equipo", o RECURSO_TEMPORAL si ENTIDAD_TIPO="Recurso" (nunca ambas) -- admite ID real o ID_TEMPORAL de un lote anterior.',
  STG_EJECUCION_TAREA: 'TAREA_TEMPORAL y RESPONSABLE_TEMPORAL (opcional) admiten un ID real ya existente, o el ID_TEMPORAL que se usó al crear esa tarea/persona en un lote anterior (aunque ya esté importada), igual que en Asignaciones.'
};

var NOTA_COHERENCIA_FECHA_REAL_POR_HOJA_AVANZADA_ = {
  STG_DECISION: 'FECHA_LIMITE (si se indica) no puede ser anterior a hoy. RESOLUCION/FECHA_RESOLUCION son opcionales, pero: ESTADO "Aprobada"/"Rechazada"/"Sustituida" EXIGE ambas (con FECHA_RESOLUCION >= hoy); cualquier otro ESTADO NO admite ninguna de las dos. IMPORTANTE: "hoy" se evalúa en el momento de pulsar "Importar", no cuando generaste el CSV -- si dejas pasar días entre generar el CSV y subirlo, revisa que estas fechas sigan siendo válidas.'
};

var CONSTRAINTS_ADICIONALES_POR_COLUMNA_AVANZADA_ = {
  STG_PERSONA: {
    CAPACIDAD_SEMANAL_DIAS: 'número entero mayor que 0 y menor o igual que 7 (días laborables por semana).'
  },
  STG_TAREA_RESPONSABLE: {
    PORCENTAJE_DEDICACION: 'número entre 1 y 100 (0 no es un valor válido).'
  },
  STG_HORARIO: {
    HORA_INICIO: 'formato HH:MM en 24h (ej. "09:00"). Debe ser anterior a HORA_FIN.',
    HORA_FIN: 'formato HH:MM en 24h (ej. "17:00"). Debe ser posterior a HORA_INICIO.'
  },
  STG_EJECUCION_TAREA: {
    DURACION_REAL_DIAS: 'número mayor o igual que 0, si se indica.'
  }
};

var BLOQUES_ENTREVISTA_POR_GRUPO_AVANZADA_ = {
  RECURSOS_PERSONAS: [
    '1. **Espacios y recursos** -- qué recursos físicos hacen falta (código, nombre, clase, categoría), y si alguno contiene a otro (ubicación).',
    '2. **Personas y equipos** -- qué personas o equipos, con qué rol, capacidad semanal (días) y disponibilidad, y quién coordina a quién.',
    '3. **Composición de equipos** -- qué personas pertenecen a qué equipo.'
  ],
  ASIGNACIONES: [
    '1. **Responsables** -- para cada tarea (usa el mismo ID_TEMPORAL o ID real que ya tiene la tarea), qué persona(s) o equipo(s) son responsables, con qué rol asignado y qué porcentaje de dedicación (1-100, no puede ser 0).',
    '2. **Recursos** -- para cada tarea, qué recurso(s) físicos hacen falta y con qué tipo de uso.'
  ],
  SEGUIMIENTO: [
    '1. **Decisiones** -- qué decisiones pendientes hay a nivel de proyecto (título, contexto, tipo, quién es responsable, fecha límite si la hay). Si alguna ya está cerrada, con qué resolución y cuándo.',
    '2. **Incidencias** -- qué incidencias hay, a qué nivel cuelgan (campaña/proyecto/producto/proceso/tarea -- usa el ID_TEMPORAL o real de ese registro), tipo, prioridad, responsable, fecha de detección.',
    '3. **Documentos** -- qué documentos/enlaces hay que adjuntar, a qué nivel, con qué tipo de documento y URL.'
  ],
  HORARIO: [
    '1. **Horarios** -- qué personas/equipos o recursos tienen un horario declarado, qué días de la semana, en qué franja horaria (HH:MM-HH:MM), y si es permanente o solo vigente en un rango de fechas.'
  ],
  EJECUCION: [
    '1. **Ejecuciones** -- para cada tarea que ya se ha trabajado de verdad (usa el mismo ID_TEMPORAL o ID real que ya tiene la tarea), quién la ejecutó, fecha real de inicio/fin, duración real en días, estado de la ejecución, resultado (Exitosa/Con incidencias/Fallida) y observaciones -- no hace falta que todas las tareas tengan ya una ejecución, solo las que realmente se han trabajado.'
  ]
};
