/**
 * FormularioEsquemas.js -- capa CONFIGURACION de formularios: catalogos y
 * esquemas compartidos por FormularioMotorUI.js y FormularioValidacionService.js
 * (ESQUEMAS_FORMULARIO_MVP, mapas de dependencias y de traduccion de
 * entidad/documento). Extraido de Formularios.js para cerrar su deuda de
 * mezcla de capas (ver PROPUESTA_MODULARIZACION_LIBRERIA.md).
 */
/*
 * Formularios.gs -- formularios y ventanas modales (motor generico dirigido por esquema).
 *
 * ESQUEMAS_FORMULARIO_MVP declara los campos por entidad, su tipo de control
 * (texto/numero/fecha/catalogo/fk/fk_dependiente) y visibilidad condicional (visibleSi).
 * FormularioGenerico.html renderiza segun ese esquema; el servidor valida y guarda
 * reutilizando el repositorio comun (insertarRegistroTransaccional / actualizarRegistroTransaccional).
 */

/*
 * Claves = texto exacto del catalogo CFG_ENTIDAD_DOCUMENTO (columna VALOR de
 * 90_CONFIGURACION, lo que realmente se guarda en DOCUMENTO.ENTIDAD_TIPO,
 * no la clave interna en mayusculas). Valores = nombre de entidad interno
 * que espera listarRegistros/ENTIDADES_MVP.
 */
/*
 * Nombre legible en español por entidad (ver conversacion -- "que
 * normalicemos el estilo"): antes solo 3 entidades tenian etiqueta
 * propia y el resto caia a clave.toLowerCase() en crudo ("Editar
 * proveedor_material" en vez de "Editar proveedor - material"). Unico
 * punto de mantenimiento para el titulo de "Editar X" en todo el
 * sistema (abrirFormularioEditarPorId).
 */
var ETIQUETA_ENTIDAD_MVP = Object.freeze({
  CAMPANA: 'campaña',
  PROYECTO: 'proyecto',
  PRODUCTO: 'producto',
  PROYECTO_PRODUCTO: 'proyecto - producto',
  PROCESO: 'proceso',
  TAREA: 'tarea',
  TAREA_RESPONSABLE: 'tarea - responsable',
  MATERIAL: 'material',
  PRODUCTO_MATERIAL: 'producto - material',
  TAREA_MATERIAL: 'tarea - material',
  PERSONA_EQUIPO: 'persona/equipo',
  DECISION: 'decisión',
  INCIDENCIA: 'incidencia',
  DOCUMENTO: 'documento',
  PROVEEDOR: 'proveedor',
  ASIGNACION: 'asignación',
  RELACION: 'relación',
  VINCULO: 'vínculo',
  MOVIMIENTO_MATERIAL: 'movimiento de material',
  EJECUCION_TAREA: 'ejecución de tarea',
  PROVEEDOR_MATERIAL: 'proveedor - material',
  EQUIPO_MIEMBRO: 'equipo - miembro',
  RECURSO: 'recurso',
  TAREA_RECURSO: 'tarea - recurso',
  PEDIDO_PROVEEDOR: 'pedido a proveedor',
  PEDIDO_PROVEEDOR_LINEA: 'línea de pedido a proveedor',
  RECEPCION: 'recepción',
  RECEPCION_LINEA: 'línea de recepción',
  HORARIO: 'horario',
  PRESUPUESTO: 'presupuesto',
  FUENTE_FINANCIACION: 'fuente de financiación',
  COSTE: 'coste',
  COMPETENCIA: 'competencia',
  PERSONA_COMPETENCIA: 'persona - competencia',
  RECURSO_COMPETENCIA: 'recurso - competencia',
  CONVOCATORIA: 'convocatoria',
  ETIQUETA_IMPACTO: 'etiqueta de impacto',
  CLIENTE: 'cliente',
  PEDIDO_CLIENTE: 'pedido de cliente',
  PEDIDO_CLIENTE_LINEA: 'línea de pedido de cliente',
  ENTREGA: 'entrega',
  ENTREGA_LINEA: 'línea de entrega',
  CONTRATO_SERVICIO: 'contrato de servicio',
  OPORTUNIDAD: 'oportunidad',
  TAREA_COMPETENCIA: 'tarea - competencia',
  TAREA_RECURSO_NECESIDAD: 'tarea - necesidad de recurso',
  ESCENARIO: 'escenario de simulación'
});
var ENTIDAD_DOCUMENTO_A_MVP = Object.freeze({
  'Campaña': 'CAMPANA',
  'Proyecto': 'PROYECTO',
  'Producto': 'PRODUCTO',
  'Proceso': 'PROCESO',
  'Tarea': 'TAREA',
  'Decisión': 'DECISION',
  'Incidencia': 'INCIDENCIA',
  'Documento': 'DOCUMENTO',
  'Recurso': 'RECURSO',
  'Persona/Equipo': 'PERSONA_EQUIPO',
  'Convocatoria': 'CONVOCATORIA',
  'Cliente': 'CLIENTE'
});
/*
 * Igual que ENTIDAD_DOCUMENTO_A_MVP pero para HORARIO (ver conversacion:
 * franjas semanales). Catalogo propio y mas acotado (CFG_ENTIDAD_HORARIO)
 * en vez de reutilizar CFG_ENTIDAD_DOCUMENTO -- ese arrastraria opciones
 * sin sentido para un horario (Decisión, Incidencia...).
 */
var ENTIDAD_HORARIO_A_MVP = Object.freeze({
  'Recurso': 'RECURSO',
  'Persona/Equipo': 'PERSONA_EQUIPO'
});
var MVP_A_ENTIDAD_DOCUMENTO_ = Object.freeze(Object.keys(ENTIDAD_DOCUMENTO_A_MVP).reduce(function (acc, etiqueta) {
  acc[ENTIDAD_DOCUMENTO_A_MVP[etiqueta]] = etiqueta;
  return acc;
}, {}));
var MAPAS_DEPENDENCIA_MVP = Object.freeze({
  DOCUMENTO_ENTIDAD_ID: Object.freeze({
    campoPadre: 'ENTIDAD_TIPO',
    resolver: function (valorPadre) {
      var entidad = ENTIDAD_DOCUMENTO_A_MVP[valorPadre];
      if (!entidad) return [];
      return listarRegistros(entidad, { ACTIVO: 'SÍ' }).map(function (r) {
        return { id: r.ID, etiqueta: r.ID + ' - ' + (r.NOMBRE || r.TITULO || '') };
      });
    }
  }),

  HORARIO_ENTIDAD_ID: Object.freeze({
    campoPadre: 'ENTIDAD_TIPO',
    resolver: function (valorPadre) {
      var entidad = ENTIDAD_HORARIO_A_MVP[valorPadre];
      if (!entidad) return [];
      return listarRegistros(entidad, { ACTIVO: 'SÍ' }).map(function (r) {
        return { id: r.ID, etiqueta: r.ID + ' - ' + (r.NOMBRE || '') };
      });
    }
  }),

  INCIDENCIA_PROYECTO_ID: Object.freeze({
    campoPadre: 'CAMPANA_ID',
    resolver: function (valorPadre) {
      return listarRegistros('PROYECTO', { ACTIVO: 'SÍ', CAMPANA_ID: valorPadre }).map(function (r) {
        return { id: r.ID, etiqueta: r.ID + ' - ' + (r.NOMBRE || '') };
      });
    }
  }),

  INCIDENCIA_PRODUCTO_ID: Object.freeze({
    campoPadre: 'PROYECTO_ID',
    resolver: function (valorPadre) {
      var idsProducto = listarRegistros('PROYECTO_PRODUCTO', { ACTIVO: 'SÍ', PROYECTO_ID: valorPadre }).map(function (vp) { return vp.PRODUCTO_ID; });
      return listarRegistros('PRODUCTO', { ACTIVO: 'SÍ' })
        .filter(function (p) { return idsProducto.indexOf(p.ID) !== -1; })
        .map(function (p) { return { id: p.ID, etiqueta: p.ID + ' - ' + (p.NOMBRE || '') }; });
    }
  }),

  INCIDENCIA_PROCESO_ID: Object.freeze({
    campoPadre: 'PRODUCTO_ID',
    resolver: function (valorPadre) {
      return listarRegistros('PROCESO', { ACTIVO: 'SÍ', PRODUCTO_ID: valorPadre }).map(function (r) {
        return { id: r.ID, etiqueta: r.ID + ' - ' + (r.NOMBRE || '') };
      });
    }
  }),

  INCIDENCIA_TAREA_ID: Object.freeze({
    campoPadre: 'PROCESO_ID',
    resolver: function (valorPadre) {
      return listarRegistros('TAREA', { ACTIVO: 'SÍ', PROCESO_ID: valorPadre }).map(function (r) {
        return { id: r.ID, etiqueta: r.ID + ' - ' + (r.NOMBRE || '') };
      });
    }
  }),

  /*
   * Hallazgo #20 (auditoría piloto): "Proceso predecesor"/"Tarea
   * predecesora" mostraban todos los procesos/tareas del sistema, no
   * solo los del mismo Producto/Proceso ya elegido. Se acota por
   * Producto (no por Relación proyecto-producto, que es opcional) --
   * simplificación consciente frente al alcance más fino de
   * obtenerSugerenciaSecuencia (L4), que sí distingue por Relación
   * proyecto-producto cuando existe.
   */
  PROCESO_PREDECESOR_POR_PRODUCTO: Object.freeze({
    campoPadre: 'PRODUCTO_ID',
    resolver: function (valorPadre) {
      return listarRegistros('PROCESO', { ACTIVO: 'SÍ', PRODUCTO_ID: valorPadre }).map(function (r) {
        return { id: r.ID, etiqueta: r.ID + ' - ' + (r.NOMBRE || '') };
      });
    }
  }),

  TAREA_PREDECESORA_POR_PROCESO: Object.freeze({
    campoPadre: 'PROCESO_ID',
    resolver: function (valorPadre) {
      return listarRegistros('TAREA', { ACTIVO: 'SÍ', PROCESO_ID: valorPadre }).map(function (r) {
        return { id: r.ID, etiqueta: r.ID + ' - ' + (r.NOMBRE || '') };
      });
    }
  })
});
var CLAVES_DUPLICADO_MVP = Object.freeze({
  PROYECTO_PRODUCTO: ['PROYECTO_ID', 'PRODUCTO_ID'],
  TAREA_RESPONSABLE: ['TAREA_ID', 'PERSONA_EQUIPO_ID'],
  PRODUCTO_MATERIAL: ['PRODUCTO_ID', 'MATERIAL_ID'],
  TAREA_MATERIAL: ['TAREA_ID', 'MATERIAL_ID'],
  DOCUMENTO: ['ENTIDAD_TIPO', 'ENTIDAD_ID', 'TIPO_DOCUMENTO', 'VERSION'],
  ASIGNACION: ['ENTIDAD_TIPO', 'ENTIDAD_ID', 'PERSONA_EQUIPO_ID', 'ROL_ASIGNADO'],
  RELACION: ['ENTIDAD_TIPO', 'ENTIDAD_ORIGEN_ID', 'ENTIDAD_DESTINO_ID', 'TIPO_RELACION'],
  VINCULO: ['ENTIDAD_ORIGEN_TIPO', 'ENTIDAD_ORIGEN_ID', 'ENTIDAD_DESTINO_TIPO', 'ENTIDAD_DESTINO_ID', 'TIPO_VINCULO'],
  PROVEEDOR_MATERIAL: ['PROVEEDOR_ID', 'MATERIAL_ID'],
  EQUIPO_MIEMBRO: ['EQUIPO_ID', 'MIEMBRO_ID'],
  TAREA_RECURSO: ['TAREA_ID', 'RECURSO_ID'],
  PEDIDO_PROVEEDOR_LINEA: ['PEDIDO_PROVEEDOR_ID', 'MATERIAL_ID'],
  RECEPCION_LINEA: ['RECEPCION_ID', 'MATERIAL_ID']
});
var ESQUEMAS_FORMULARIO_MVP = Object.freeze({

CAMPANA: [
  { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
  { campo: 'DESCRIPCION', etiqueta: 'Descripción', tipo: 'texto' },
  { campo: 'FECHA_INICIO_PLAN', etiqueta: 'Fecha inicio plan', tipo: 'fecha', requerido: true },
  { campo: 'FECHA_FIN_PLAN', etiqueta: 'Fecha fin plan', tipo: 'fecha', requerido: true },
  { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_CAMPANA', requerido: true, valorPorDefecto: 'Borrador' },
  {
    campo: 'NIVEL_DATO', etiqueta: 'Nivel de dato', tipo: 'catalogo', catalogo: 'CFG_NIVEL_DATO', valorPorDefecto: 'Operativo',
    ayuda: 'Operativo = campaña real del taller. Piloto = campaña de demostración con estructura realista, no oculta datos pero se distingue. Auditoría = artefacto de verificación del propio sistema, oculto por defecto en selectores y paneles.'
  },
  { campo: 'OBJETIVO', etiqueta: 'Objetivo', tipo: 'texto' },
  { campo: 'RESULTADO_ESPERADO', etiqueta: 'Resultado esperado', tipo: 'texto' },
  { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
],

PROYECTO: [
  {
    campo: 'CAMPANA_ID',
    etiqueta: 'Campaña',
    tipo: 'fk',
    entidadFk: 'CAMPANA',
    requerido: true
  },
  {
    campo: 'NOMBRE',
    etiqueta: 'Nombre',
    tipo: 'texto',
    requerido: true
  },
  {
    campo: 'DESCRIPCION',
    etiqueta: 'Descripción',
    tipo: 'texto'
  },
  {
    campo: 'TIPO_PROYECTO',
    etiqueta: 'Tipo de proyecto',
    tipo: 'catalogo',
    catalogo: 'CFG_TIPO_PROYECTO',
    requerido: true
  },
  {
    campo: 'PRIORIDAD',
    etiqueta: 'Prioridad',
    tipo: 'catalogo',
    catalogo: 'CFG_PRIORIDAD',
    requerido: true,
    valorPorDefecto: 'Media'
  },
  {
    campo: 'RESPONSABLE_ID',
    etiqueta: 'Responsable',
    tipo: 'fk',
    entidadFk: 'PERSONA_EQUIPO',
    excluirEstados: ['Inactivo']
  },
  {
    campo: 'CLIENTE_ID',
    etiqueta: 'Cliente',
    tipo: 'fk',
    entidadFk: 'CLIENTE',
    ayuda: 'Déjalo vacío si es un proyecto interno (sin cliente externo).'
  },
  {
    campo: 'FECHA_INICIO_PLAN',
    etiqueta: 'Fecha inicio plan',
    tipo: 'fecha',
    requerido: true
  },
  {
    campo: 'FECHA_FIN_PLAN',
    etiqueta: 'Fecha fin plan',
    tipo: 'fecha',
    requerido: true
  },
  {
    campo: 'FECHA_INICIO_REAL',
    etiqueta: 'Fecha inicio real',
    tipo: 'fecha',
    visibleSi: { campo: 'ESTADO', valores: ['En proceso', 'Completado', 'Cancelado'] }
  },
  {
    campo: 'FECHA_FIN_REAL',
    etiqueta: 'Fecha fin real',
    tipo: 'fecha',
    visibleSi: { campo: 'ESTADO', valores: ['Completado', 'Cancelado'] }
  },
  {
    campo: 'ESTADO',
    etiqueta: 'Estado',
    tipo: 'catalogo',
    catalogo: 'CFG_ESTADO_PROYECTO',
    requerido: true,
    valorPorDefecto: 'Borrador'
  },
  {
    campo: 'MOTIVO_REPLANIFICACION',
    etiqueta: 'Motivo de replanificación',
    tipo: 'texto',
    visibleSi: { campo: 'ESTADO', valores: ['Pospuesto'] }
  },
  {
    campo: 'OBJETIVO',
    etiqueta: 'Objetivo',
    tipo: 'texto'
  },
  {
    campo: 'RESULTADO_ESPERADO',
    etiqueta: 'Resultado esperado',
    tipo: 'texto'
  },
  {
    campo: 'VALIDADOR_ID',
    etiqueta: 'Validador',
    tipo: 'fk',
    entidadFk: 'PERSONA_EQUIPO',
    excluirEstados: ['Inactivo']
  },
  {
    campo: 'OBSERVACIONES',
    etiqueta: 'Observaciones',
    tipo: 'texto'
  }
],

  PRODUCTO: [
    {
      campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true
    },
    { campo: 'DESCRIPCION', etiqueta: 'Descripción', tipo: 'texto' },
    {
      campo: 'VERSION', etiqueta: 'Versión', tipo: 'texto',
      sugerenciaVersion: { camposContexto: ['NOMBRE'] }
    },
    { campo: 'ORIGEN', etiqueta: 'Origen', tipo: 'catalogo', catalogo: 'CFG_ORIGEN_PRODUCTO', requerido: true },
    { campo: 'UNIDAD', etiqueta: 'Unidad', tipo: 'catalogo', catalogo: 'CFG_UNIDAD', requerido: true },
    { campo: 'CANTIDAD_PREVISTA', etiqueta: 'Cantidad prevista', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'FECHA_REQUERIDA', etiqueta: 'Fecha requerida', tipo: 'fecha' },
    { campo: 'PRIORIDAD', etiqueta: 'Prioridad', tipo: 'catalogo', catalogo: 'CFG_PRIORIDAD', requerido: true, valorPorDefecto: 'Media' },
    {
      campo: 'CODIGO',
      etiqueta: 'Código',
      tipo: 'texto',
      requerido: true,
      sugerenciaCodigo: { camposContexto: ['ORIGEN', 'NOMBRE', 'PRIORIDAD'] }
    },
    {
      campo: 'PROYECTO_VINCULAR_ID',
      etiqueta: 'Proyecto (opcional, para vincular ahora)',
      tipo: 'fk',
      entidadFk: 'PROYECTO',
      ayuda: 'Solo si ya sabes a qué proyecto pertenece este producto. Déjalo vacío para crear un producto de catálogo reutilizable en cualquier proyecto.'
    },
    { campo: 'RESPONSABLE_ID', etiqueta: 'Responsable', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_PRODUCTO', requerido: true, valorPorDefecto: 'Borrador' },
    { campo: 'OBJETIVO', etiqueta: 'Objetivo', tipo: 'texto' },
    { campo: 'CRITERIOS_ACEPTACION', etiqueta: 'Criterios de aceptación', tipo: 'textarea' },
    { campo: 'VALIDADOR_ID', etiqueta: 'Validador', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', excluirEstados: ['Inactivo'] },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  PROCESO: [
    {
      campo: 'PRODUCTO_ID',
      etiqueta: 'Producto',
      tipo: 'fk',
      entidadFk: 'PRODUCTO',
      requerido: true,
      derivarDeRelacion: 'PROYECTO_PRODUCTO_ID'
    },
    { campo: 'PROYECTO_PRODUCTO_ID', etiqueta: 'Relación proyecto-producto (opcional)', tipo: 'fk', entidadFk: 'PROYECTO_PRODUCTO' },
    { campo: 'MODO_USO', etiqueta: 'Modo de uso', tipo: 'catalogo', catalogo: 'CFG_MODO_USO', ayuda: 'Solo si este producto se reutiliza de otro proyecto. Déjalo vacío si es nuevo y no se reutiliza de nada.' },
    { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { campo: 'DESCRIPCION', etiqueta: 'Descripción', tipo: 'texto' },
    {
      campo: 'ORDEN_SECUENCIA',
      etiqueta: 'Orden de secuencia',
      tipo: 'numero',
      requerido: true,
      min: 1,
      sugerenciaSecuencia: {
        camposContexto: ['PROYECTO_PRODUCTO_ID', 'PRODUCTO_ID'],
        campoPredecesor: 'PROCESO_PREDECESOR_ID'
      }
    },
    {
      campo: 'PROCESO_PREDECESOR_ID',
      etiqueta: 'Proceso predecesor',
      tipo: 'fk_dependiente',
      dependeDe: 'PRODUCTO_ID',
      mapaEntidad: 'PROCESO_PREDECESOR_POR_PRODUCTO'
    },
    { campo: 'DURACION_PREVISTA_DIAS', etiqueta: 'Duración prevista (días)', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'DURACION_REAL_DIAS', etiqueta: 'Duración real (días)', tipo: 'numero', min: 0, visibleSi: { campo: 'ESTADO', valores: ['Completado', 'Cancelado'] } },
    { campo: 'RESPONSABLE_ID', etiqueta: 'Responsable', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO' },
    { campo: 'FECHA_INICIO_PLAN', etiqueta: 'Fecha inicio plan', tipo: 'fecha' },
    { campo: 'FECHA_FIN_PLAN', etiqueta: 'Fecha fin plan', tipo: 'fecha' },
    { campo: 'FECHA_INICIO_REAL', etiqueta: 'Fecha inicio real', tipo: 'fecha', visibleSi: { campo: 'ESTADO', valores: ['En proceso', 'Completado', 'Cancelado'] } },
    { campo: 'FECHA_FIN_REAL', etiqueta: 'Fecha fin real', tipo: 'fecha', visibleSi: { campo: 'ESTADO', valores: ['Completado', 'Cancelado'] } },
    {
      campo: 'PORCENTAJE_AVANCE',
      etiqueta: 'Porcentaje de avance',
      tipo: 'numero',
      ocultarAlCrear: true,
      valorPorDefectoAlCrear: 0,
      min: 0,
      max: 100
    },
    { campo: 'METODO_CALCULO_AVANCE', etiqueta: 'Método de cálculo del avance', tipo: 'catalogo', catalogo: 'CFG_METODO_CALCULO_AVANCE' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_PROCESO', requerido: true, valorPorDefecto: 'Pendiente' },
    { campo: 'FASE_PRODUCCION', etiqueta: 'Fase de producción', tipo: 'catalogo', catalogo: 'CFG_FASE_PRODUCCION' },
    { campo: 'DEFINITION_OF_DONE', etiqueta: 'Definition of Done', tipo: 'textarea' },
    { campo: 'VALIDADOR_ID', etiqueta: 'Validador', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', excluirEstados: ['Inactivo'] },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],
  TAREA: [
    { campo: 'PROCESO_ID', etiqueta: 'Proceso', tipo: 'fk', entidadFk: 'PROCESO', requerido: true },
    { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { campo: 'DESCRIPCION', etiqueta: 'Descripción', tipo: 'texto' },
    {
      campo: 'ORDEN_SECUENCIA',
      etiqueta: 'Orden de secuencia',
      tipo: 'numero',
      requerido: true,
      min: 1,
      sugerenciaSecuencia: {
        camposContexto: ['PROCESO_ID'],
        campoPredecesor: 'TAREA_PREDECESORA_ID'
      }
    },
    {
      campo: 'TAREA_PREDECESORA_ID',
      etiqueta: 'Tarea predecesora',
      tipo: 'fk_dependiente',
      dependeDe: 'PROCESO_ID',
      mapaEntidad: 'TAREA_PREDECESORA_POR_PROCESO'
    },
    { campo: 'DURACION_PREVISTA_DIAS', etiqueta: 'Duración prevista (días)', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'DURACION_REAL_DIAS', etiqueta: 'Duración real (días)', tipo: 'numero', min: 0, visibleSi: { campo: 'ESTADO', valores: ['Terminada', 'Cancelada'] } },
    { campo: 'FECHA_INICIO_PLAN', etiqueta: 'Fecha inicio plan', tipo: 'fecha' },
    { campo: 'FECHA_FIN_PLAN', etiqueta: 'Fecha fin plan', tipo: 'fecha' },
    { campo: 'FECHA_INICIO_REAL', etiqueta: 'Fecha inicio real', tipo: 'fecha', visibleSi: { campo: 'ESTADO', valores: ['En proceso', 'Terminada', 'Cancelada'] } },
    { campo: 'FECHA_FIN_REAL', etiqueta: 'Fecha fin real', tipo: 'fecha', visibleSi: { campo: 'ESTADO', valores: ['Terminada', 'Cancelada'] } },
    {
      campo: 'PORCENTAJE_AVANCE',
      etiqueta: 'Porcentaje de avance',
      tipo: 'numero',
      ocultarAlCrear: true,
      valorPorDefectoAlCrear: 0,
      min: 0,
      max: 100
    },
    { campo: 'METODO_CALCULO_AVANCE', etiqueta: 'Método de cálculo del avance', tipo: 'catalogo', catalogo: 'CFG_METODO_CALCULO_AVANCE' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_TAREA', requerido: true, valorPorDefecto: 'Pendiente' },
    { campo: 'MOTIVO_BLOQUEO', etiqueta: 'Motivo de bloqueo', tipo: 'texto', visibleSi: { campo: 'ESTADO', valores: ['Bloqueada'] } },
    { campo: 'MOTIVO_POSPOSICION', etiqueta: 'Motivo de posposición', tipo: 'texto', visibleSi: { campo: 'ESTADO', valores: ['Pospuesta'] } },
    { campo: 'MOTIVO_CANCELACION', etiqueta: 'Motivo de cancelación', tipo: 'texto', visibleSi: { campo: 'ESTADO', valores: ['Cancelada'] } },
    { campo: 'DEFINITION_OF_DONE', etiqueta: 'Definition of Done', tipo: 'textarea' },
    { campo: 'VALIDADOR_ID', etiqueta: 'Validador', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', excluirEstados: ['Inactivo'] },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  TAREA_RESPONSABLE: [
    { campo: 'TAREA_ID', etiqueta: 'Tarea', tipo: 'fk', entidadFk: 'TAREA', requerido: true },
    { campo: 'PERSONA_EQUIPO_ID', etiqueta: 'Persona / equipo', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', requerido: true },
    { campo: 'ROL_ASIGNADO', etiqueta: 'Rol asignado', tipo: 'catalogo', catalogo: 'CFG_ROL_ASIGNACION', requerido: true },
    { campo: 'FECHA_INICIO_ASIGNACION', etiqueta: 'Fecha inicio asignación', tipo: 'fecha' },
    { campo: 'FECHA_FIN_ASIGNACION', etiqueta: 'Fecha fin asignación', tipo: 'fecha' },
    { campo: 'PORCENTAJE_DEDICACION', etiqueta: 'Porcentaje de dedicación', tipo: 'numero', requerido: true, min: 0, max: 100 },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_ASIGNACION', requerido: true, valorPorDefecto: 'Planificada' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  PERSONA_EQUIPO: [
    { campo: 'TIPO', etiqueta: 'Tipo', tipo: 'catalogo', catalogo: 'CFG_TIPO_RECURSO', requerido: true },
    { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { campo: 'ROL', etiqueta: 'Rol', tipo: 'catalogo', catalogo: 'CFG_ROL_PERSONA', requerido: true },
    { campo: 'EMAIL', etiqueta: 'Email', tipo: 'texto' },
    { campo: 'TELEFONO', etiqueta: 'Teléfono', tipo: 'texto' },
    { campo: 'COORDINADOR_ID', etiqueta: 'Coordinador', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', excluirEstados: ['Inactivo'], filtroValores: { campo: 'TIPO', valores: ['Persona'] }, visibleSi: { campo: 'TIPO', valores: ['Equipo'] }, limpiarAlOcultar: true },
    { campo: 'CAPACIDAD_SEMANAL_DIAS', etiqueta: 'Capacidad semanal (días)', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'DISPONIBILIDAD', etiqueta: 'Disponibilidad', tipo: 'catalogo', catalogo: 'CFG_DISPONIBILIDAD', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RECURSO', requerido: true, valorPorDefecto: 'Disponible' },
    { campo: 'TELEGRAM_CHAT_ID', etiqueta: 'Chat ID de Telegram', tipo: 'texto', ayuda: 'Identifica a esta persona cuando escribe al bot operativo del cliente. Vacío si todavía no lo usa.' },
    { campo: 'NIVEL_PERMISO_BOT', etiqueta: 'Nivel de permiso del bot', tipo: 'catalogo', catalogo: 'CFG_NIVEL_PERMISO_BOT', ayuda: 'Administrador: todo, incluida configuración y aprobaciones. Colaborador: consulta y acciones normales. Consulta: solo lectura.' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  EQUIPO_MIEMBRO: [
    { campo: 'EQUIPO_ID', etiqueta: 'Equipo', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', requerido: true, excluirEstados: ['Inactivo'], filtroValores: { campo: 'TIPO', valores: ['Equipo'] } },
    { campo: 'MIEMBRO_ID', etiqueta: 'Miembro (persona)', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', requerido: true, excluirEstados: ['Inactivo'], filtroValores: { campo: 'TIPO', valores: ['Persona'] } },
    { campo: 'ROL_EN_EQUIPO', etiqueta: 'Rol en el equipo', tipo: 'texto' },
    { campo: 'FECHA_ALTA', etiqueta: 'Fecha de alta', tipo: 'fecha' },
    { campo: 'FECHA_BAJA', etiqueta: 'Fecha de baja', tipo: 'fecha' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Fase L5.1 (abstraccion RECURSO, alcance minimo confirmado tras
   * evaluar PROPUESTA_RECURSO_MATERIAL.md): cubre herramienta/maquinaria/
   * equipo auxiliar/espacio, tipos que hoy no tienen cabida ni en
   * MATERIAL (consumibles) ni en PERSONA_EQUIPO. UBICACION_ID reutiliza
   * la propia tabla RECURSO (un RECURSO con CLASE_RECURSO=Espacio) en vez
   * de crear un catalogo/tabla de ubicaciones aparte.
   *
   * CLASE_RECURSO/ESTADO usan catalogos nuevos (CFG_CLASE_RECURSO,
   * CFG_ESTADO_RECURSO_FISICO) para no colisionar con CFG_TIPO_RECURSO/
   * CFG_ESTADO_RECURSO, que ya existen con otro significado (Persona/
   * Equipo de PERSONA_EQUIPO). "Equipo" como clase de RECURSO se llama
   * EQUIPO_AUXILIAR para no confundirse con un equipo de personas.
   */
  RECURSO: [
    {
      campo: 'CODIGO',
      etiqueta: 'Código',
      tipo: 'texto',
      requerido: true,
      sugerenciaCodigo: { camposContexto: ['CLASE_RECURSO', 'NOMBRE'] }
    },
    { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { campo: 'DESCRIPCION', etiqueta: 'Descripción', tipo: 'texto' },
    { campo: 'CLASE_RECURSO', etiqueta: 'Clase de recurso', tipo: 'catalogo', catalogo: 'CFG_CLASE_RECURSO', requerido: true },
    { campo: 'CATEGORIA_RECURSO', etiqueta: 'Categoría', tipo: 'catalogo', catalogo: 'CFG_CATEGORIA_RECURSO' },
    { campo: 'UBICACION_ID', etiqueta: 'Ubicación (espacio)', tipo: 'fk', entidadFk: 'RECURSO', filtroValores: { campo: 'CLASE_RECURSO', valores: ['Espacio'] } },
    { campo: 'RESPONSABLE_ID', etiqueta: 'Responsable', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', excluirEstados: ['Inactivo'] },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RECURSO_FISICO', requerido: true, valorPorDefecto: 'Disponible' },
    /*
     * Eje económico, Fase 2 (ver conversación -- "espacios y maquinaria:
     * ambos, según el recurso"). MODO_COSTE decide cuáles de los otros
     * 4 campos aplican; ninguno es obligatorio (un recurso "Sin coste"
     * no necesita rellenarlos, y sigue funcionando igual que hasta
     * ahora para el resto del sistema -- esto es aditivo puro).
     */
    { campo: 'MODO_COSTE', etiqueta: 'Modo de coste', tipo: 'catalogo', catalogo: 'CFG_MODO_COSTE_RECURSO', valorPorDefecto: 'Sin coste' },
    { campo: 'COSTE_ADQUISICION', etiqueta: 'Coste de adquisición (€)', tipo: 'numero', min: 0, visibleSi: { campo: 'MODO_COSTE', valores: ['Amortización'] } },
    { campo: 'VIDA_UTIL_ANOS', etiqueta: 'Vida útil (años)', tipo: 'numero', min: 1, visibleSi: { campo: 'MODO_COSTE', valores: ['Amortización'] } },
    { campo: 'COSTE_PERIODICO', etiqueta: 'Coste periódico (€)', tipo: 'numero', min: 0, visibleSi: { campo: 'MODO_COSTE', valores: ['Periódico'] } },
    { campo: 'PERIODICIDAD_COSTE', etiqueta: 'Periodicidad', tipo: 'catalogo', catalogo: 'CFG_PERIODICIDAD_COSTE', visibleSi: { campo: 'MODO_COSTE', valores: ['Periódico'] } },
    /*
     * Track B, ampliación (ver conversación -- "el caso furgoneta de
     * 500kg vs 300kg exacto"): atributo numérico opcional, libre de
     * unidad (CAPACIDAD_UNIDAD es texto libre, no catálogo -- "kg",
     * "personas", "m²"... varía demasiado por tipo de recurso para
     * cerrarlo en una lista). Ninguno de los dos es obligatorio, no
     * afecta a recursos que no lo necesiten.
     */
    { campo: 'CAPACIDAD', etiqueta: 'Capacidad', tipo: 'numero', min: 0, ayuda: 'Opcional. Ej. 500 (con unidad "kg" en el campo siguiente).' },
    { campo: 'CAPACIDAD_UNIDAD', etiqueta: 'Unidad de capacidad', tipo: 'texto', ayuda: 'Ej. "kg", "personas", "m²", "litros".' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  TAREA_RECURSO: [
    { campo: 'TAREA_ID', etiqueta: 'Tarea', tipo: 'fk', entidadFk: 'TAREA', requerido: true },
    { campo: 'RECURSO_ID', etiqueta: 'Recurso', tipo: 'fk', entidadFk: 'RECURSO', requerido: true },
    { campo: 'TIPO_USO', etiqueta: 'Tipo de uso', tipo: 'catalogo', catalogo: 'CFG_TIPO_USO_RECURSO', requerido: true },
    { campo: 'FECHA_INICIO', etiqueta: 'Fecha inicio', tipo: 'fecha' },
    { campo: 'FECHA_FIN', etiqueta: 'Fecha fin', tipo: 'fecha' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Fase L5.2 -- alcance minimo confirmado: solo Pedido + Recepcion,
   * sin SOLICITUD_COMPRA (peticion interna previa) ni DEVOLUCION_PROVEEDOR
   * todavia. La recepcion actualiza inventario reutilizando MOVIMIENTO_MATERIAL
   * (L3.3), no escribe MATERIAL.STOCK_ACTUAL directamente -- ver
   * confirmarRecepcion_ en PedidoRecepcion.js (accion de menu, disparada
   * por un humano, no automatica al guardar una linea de recepcion).
   */
  PEDIDO_PROVEEDOR: [
    { campo: 'PROVEEDOR_ID', etiqueta: 'Proveedor', tipo: 'fk', entidadFk: 'PROVEEDOR', requerido: true, excluirEstados: ['Inactivo', 'Bloqueado'] },
    { campo: 'FECHA_PEDIDO', etiqueta: 'Fecha del pedido', tipo: 'fecha', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_PEDIDO_PROVEEDOR', requerido: true, valorPorDefecto: 'Borrador' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  PEDIDO_PROVEEDOR_LINEA: [
    { campo: 'PEDIDO_PROVEEDOR_ID', etiqueta: 'Pedido', tipo: 'fk', entidadFk: 'PEDIDO_PROVEEDOR', requerido: true, excluirEstados: ['Recibido completo', 'Cancelado'] },
    { campo: 'MATERIAL_ID', etiqueta: 'Material', tipo: 'fk', entidadFk: 'MATERIAL', requerido: true },
    { campo: 'CANTIDAD_PEDIDA', etiqueta: 'Cantidad pedida', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'PRECIO_UNITARIO', etiqueta: 'Precio unitario', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'UNIDAD', etiqueta: 'Unidad', tipo: 'catalogo', catalogo: 'CFG_UNIDAD', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  RECEPCION: [
    { campo: 'PEDIDO_PROVEEDOR_ID', etiqueta: 'Pedido', tipo: 'fk', entidadFk: 'PEDIDO_PROVEEDOR', requerido: true, excluirEstados: ['Recibido completo', 'Cancelado'] },
    { campo: 'FECHA_RECEPCION', etiqueta: 'Fecha de recepción', tipo: 'fecha', requerido: true },
    { campo: 'RESPONSABLE_ID', etiqueta: 'Responsable', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', excluirEstados: ['Inactivo'] },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RECEPCION', requerido: true, valorPorDefecto: 'Borrador' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  RECEPCION_LINEA: [
    { campo: 'RECEPCION_ID', etiqueta: 'Recepción', tipo: 'fk', entidadFk: 'RECEPCION', requerido: true },
    { campo: 'MATERIAL_ID', etiqueta: 'Material', tipo: 'fk', entidadFk: 'MATERIAL', requerido: true },
    { campo: 'CANTIDAD_RECIBIDA', etiqueta: 'Cantidad recibida', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'UNIDAD', etiqueta: 'Unidad', tipo: 'catalogo', catalogo: 'CFG_UNIDAD', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  MATERIAL: [
    {
      campo: 'CODIGO',
      etiqueta: 'Código',
      tipo: 'texto',
      requerido: true,
      sugerenciaCodigo: { camposContexto: ['CATEGORIA', 'NOMBRE'] }
    },
    { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { campo: 'CATEGORIA', etiqueta: 'Categoría', tipo: 'catalogo', catalogo: 'CFG_CATEGORIA_MATERIAL', requerido: true },
    { campo: 'UNIDAD', etiqueta: 'Unidad', tipo: 'catalogo', catalogo: 'CFG_UNIDAD', requerido: true },
    { campo: 'STOCK_ACTUAL', etiqueta: 'Stock actual', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'STOCK_MINIMO', etiqueta: 'Stock mínimo', tipo: 'numero', requerido: true, min: 0 },
    {
  campo: 'PROVEEDOR_ID',
  etiqueta: 'Proveedor',
  tipo: 'fk',
  entidadFk: 'PROVEEDOR',
  excluirEstados: [
    'Inactivo',
    'Bloqueado'
  ]
},
    { campo: 'PLAZO_REPOSICION_DIAS', etiqueta: 'Plazo de reposición (días)', tipo: 'numero', min: 0 },
    {
      campo: 'UBICACION',
      etiqueta: 'Ubicación',
      tipo: 'fk',
      entidadFk: 'RECURSO',
      filtroValores: { campo: 'CLASE_RECURSO', valores: ['Espacio'] }
    },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_MATERIAL', requerido: true, valorPorDefecto: 'Disponible' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  PRODUCTO_MATERIAL: [
    { campo: 'PRODUCTO_ID', etiqueta: 'Producto', tipo: 'fk', entidadFk: 'PRODUCTO', requerido: true },
    { campo: 'MATERIAL_ID', etiqueta: 'Material', tipo: 'fk', entidadFk: 'MATERIAL', requerido: true },
    { campo: 'CANTIDAD_PREVISTA', etiqueta: 'Cantidad prevista', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'UNIDAD', etiqueta: 'Unidad', tipo: 'catalogo', catalogo: 'CFG_UNIDAD', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  TAREA_MATERIAL: [
    { campo: 'TAREA_ID', etiqueta: 'Tarea', tipo: 'fk', entidadFk: 'TAREA', requerido: true },
    { campo: 'MATERIAL_ID', etiqueta: 'Material', tipo: 'fk', entidadFk: 'MATERIAL', requerido: true },
    { campo: 'CANTIDAD_PREVISTA', etiqueta: 'Cantidad prevista', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'CANTIDAD_CONSUMIDA', etiqueta: 'Cantidad consumida', tipo: 'numero', min: 0 },
    { campo: 'CANTIDAD_DESPERDICIADA', etiqueta: 'Cantidad desperdiciada', tipo: 'numero', min: 0 },
    { campo: 'UNIDAD', etiqueta: 'Unidad', tipo: 'catalogo', catalogo: 'CFG_UNIDAD', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'MOTIVO_DESVIACION', etiqueta: 'Motivo de desviación', tipo: 'texto' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  PROVEEDOR: [
    {
      campo: 'CODIGO',
      etiqueta: 'Código',
      tipo: 'texto',
      requerido: true,
      sugerenciaCodigo: { camposContexto: ['NOMBRE'] }
    },
    { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { campo: 'NIF_CIF', etiqueta: 'NIF / CIF', tipo: 'texto' },
    { campo: 'PERSONA_CONTACTO', etiqueta: 'Persona de contacto', tipo: 'texto' },
    { campo: 'EMAIL', etiqueta: 'Email', tipo: 'texto' },
    { campo: 'TELEFONO', etiqueta: 'Teléfono', tipo: 'texto' },
    { campo: 'DIRECCION', etiqueta: 'Dirección', tipo: 'texto' },
    { campo: 'PLAZO_ENTREGA_DIAS', etiqueta: 'Plazo de entrega (días)', tipo: 'numero', min: 0 },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_PROVEEDOR', requerido: true, valorPorDefecto: 'Activo' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  CLIENTE: [
    {
      campo: 'CODIGO',
      etiqueta: 'Código',
      tipo: 'texto',
      requerido: true,
      sugerenciaCodigo: { camposContexto: ['NOMBRE'] }
    },
    { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { campo: 'TIPO_CLIENTE', etiqueta: 'Tipo de cliente', tipo: 'catalogo', catalogo: 'CFG_TIPO_CLIENTE', requerido: true },
    { campo: 'NIF_CIF', etiqueta: 'NIF / CIF', tipo: 'texto' },
    { campo: 'PERSONA_CONTACTO', etiqueta: 'Persona de contacto', tipo: 'texto' },
    { campo: 'EMAIL', etiqueta: 'Email', tipo: 'texto' },
    { campo: 'TELEFONO', etiqueta: 'Teléfono', tipo: 'texto' },
    { campo: 'DIRECCION', etiqueta: 'Dirección', tipo: 'texto' },
    { campo: 'RESPONSABLE_CUENTA_ID', etiqueta: 'Responsable de cuenta', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', excluirEstados: ['Inactivo'] },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_CLIENTE', requerido: true, valorPorDefecto: 'Prospecto' },
    { campo: 'SHEET_URL', etiqueta: 'URL del Sheet (si es cliente de software)', tipo: 'texto' },
    { campo: 'SCRIPT_ID', etiqueta: 'Script ID (si es cliente de software)', tipo: 'texto' },
    { campo: 'MODULOS_CONTRATADOS', etiqueta: 'Módulos contratados', tipo: 'texto' },
    { campo: 'TELEGRAM_CHAT_ID', etiqueta: 'Chat ID de Telegram', tipo: 'texto', ayuda: 'Identifica al cliente cuando escribe al bot -- privado o de grupo, da igual. Vacío si todavía no usa el bot.' },
    { campo: 'CONFIG_BOT', etiqueta: 'Configuración del bot (JSON)', tipo: 'texto', ayuda: 'Overrides opcionales sobre el registro estándar de comandos (mensaje de bienvenida, comandos propios de este cliente). Vacío = comportamiento por defecto.' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  PEDIDO_CLIENTE: [
    { campo: 'CLIENTE_ID', etiqueta: 'Cliente', tipo: 'fk', entidadFk: 'CLIENTE', requerido: true, excluirEstados: ['Baja'] },
    { campo: 'PROYECTO_ID', etiqueta: 'Proyecto', tipo: 'fk', entidadFk: 'PROYECTO', ayuda: 'Solo si es un encargo ligado a un proyecto. Déjalo vacío en venta directa (feria/tienda).' },
    { campo: 'CANAL', etiqueta: 'Canal', tipo: 'catalogo', catalogo: 'CFG_CANAL_PEDIDO_CLIENTE', requerido: true },
    { campo: 'FECHA_PEDIDO', etiqueta: 'Fecha del pedido', tipo: 'fecha', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_PEDIDO_CLIENTE', requerido: true, valorPorDefecto: 'Borrador' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  PEDIDO_CLIENTE_LINEA: [
    { campo: 'PEDIDO_CLIENTE_ID', etiqueta: 'Pedido', tipo: 'fk', entidadFk: 'PEDIDO_CLIENTE', requerido: true, excluirEstados: ['Entregado completo', 'Cancelado'] },
    { campo: 'PRODUCTO_ID', etiqueta: 'Producto', tipo: 'fk', entidadFk: 'PRODUCTO', requerido: true },
    { campo: 'CANTIDAD', etiqueta: 'Cantidad', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'PRECIO_UNITARIO', etiqueta: 'Precio unitario', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  ENTREGA: [
    { campo: 'PEDIDO_CLIENTE_ID', etiqueta: 'Pedido', tipo: 'fk', entidadFk: 'PEDIDO_CLIENTE', requerido: true, excluirEstados: ['Entregado completo', 'Cancelado'] },
    { campo: 'FECHA_ENTREGA', etiqueta: 'Fecha de entrega', tipo: 'fecha', requerido: true },
    { campo: 'RESPONSABLE_ID', etiqueta: 'Responsable', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', excluirEstados: ['Inactivo'] },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_ENTREGA', requerido: true, valorPorDefecto: 'Borrador' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  ENTREGA_LINEA: [
    { campo: 'ENTREGA_ID', etiqueta: 'Entrega', tipo: 'fk', entidadFk: 'ENTREGA', requerido: true },
    { campo: 'PRODUCTO_ID', etiqueta: 'Producto', tipo: 'fk', entidadFk: 'PRODUCTO', requerido: true },
    { campo: 'CANTIDAD_ENTREGADA', etiqueta: 'Cantidad entregada', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  CONTRATO_SERVICIO: [
    { campo: 'CLIENTE_ID', etiqueta: 'Cliente', tipo: 'fk', entidadFk: 'CLIENTE', requerido: true, excluirEstados: ['Baja'] },
    { campo: 'PROYECTO_ID', etiqueta: 'Proyecto de mantenimiento', tipo: 'fk', entidadFk: 'PROYECTO', ayuda: 'El proyecto de tipo Mantenimiento asociado a este cliente.' },
    { campo: 'MODULOS_CONTRATADOS', etiqueta: 'Módulos contratados', tipo: 'texto' },
    { campo: 'PERIODICIDAD', etiqueta: 'Periodicidad', tipo: 'catalogo', catalogo: 'CFG_PERIODICIDAD_CONTRATO', requerido: true },
    { campo: 'IMPORTE_PERIODICO', etiqueta: 'Importe periódico', tipo: 'numero', min: 0 },
    { campo: 'MODALIDAD_PAGO', etiqueta: 'Modalidad de pago', tipo: 'catalogo', catalogo: 'CFG_MODALIDAD_PAGO', requerido: true },
    { campo: 'FECHA_INICIO', etiqueta: 'Fecha de inicio', tipo: 'fecha', requerido: true },
    { campo: 'FECHA_RENOVACION', etiqueta: 'Fecha de renovación', tipo: 'fecha' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_CONTRATO_SERVICIO', requerido: true, valorPorDefecto: 'Borrador' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  OPORTUNIDAD: [
    { campo: 'CLIENTE_ID', etiqueta: 'Cliente', tipo: 'fk', entidadFk: 'CLIENTE', ayuda: 'Déjalo vacío si todavía no hay un contacto verificado -- una oportunidad puede nacer solo con datos de origen.' },
    { campo: 'ORIGEN', etiqueta: 'Origen', tipo: 'catalogo', catalogo: 'CFG_ORIGEN_OPORTUNIDAD', requerido: true },
    { campo: 'ORIGEN_PLATAFORMA', etiqueta: 'Plataforma de origen', tipo: 'texto' },
    { campo: 'ORIGEN_URL', etiqueta: 'URL de origen', tipo: 'texto' },
    { campo: 'AMBITO', etiqueta: 'Ámbito', tipo: 'catalogo', catalogo: 'CFG_AMBITO_OPORTUNIDAD', requerido: true },
    { campo: 'DESCRIPCION_PROYECTO_ORIGEN', etiqueta: 'Descripción del proyecto de origen', tipo: 'texto' },
    { campo: 'IMPORTE_OBJETIVO_CAMPANA', etiqueta: 'Importe objetivo de campaña', tipo: 'numero', min: 0, ayuda: 'Opcional -- no todas las plataformas de origen dan este dato.' },
    { campo: 'TIPO_OPORTUNIDAD', etiqueta: 'Tipo de oportunidad', tipo: 'catalogo', catalogo: 'CFG_TIPO_OPORTUNIDAD', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_OPORTUNIDAD', requerido: true, valorPorDefecto: 'Identificada' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  PROVEEDOR_MATERIAL: [
    { campo: 'PROVEEDOR_ID', etiqueta: 'Proveedor', tipo: 'fk', entidadFk: 'PROVEEDOR', requerido: true, excluirEstados: ['Inactivo', 'Bloqueado'] },
    { campo: 'MATERIAL_ID', etiqueta: 'Material', tipo: 'fk', entidadFk: 'MATERIAL', requerido: true },
    { campo: 'PRECIO_UNITARIO', etiqueta: 'Precio unitario', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'PLAZO_ENTREGA_DIAS', etiqueta: 'Plazo de entrega (días)', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'ES_PREFERENTE', etiqueta: 'Preferente', tipo: 'catalogo', opciones: ['SÍ', 'NO'], requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  PROYECTO_PRODUCTO: [
    { campo: 'PROYECTO_ID', etiqueta: 'Proyecto', tipo: 'fk', entidadFk: 'PROYECTO', requerido: true },
    { campo: 'PRODUCTO_ID', etiqueta: 'Producto', tipo: 'fk', entidadFk: 'PRODUCTO', requerido: true },
    { campo: 'CANTIDAD_ASIGNADA', etiqueta: 'Cantidad asignada', tipo: 'numero', min: 0 },
    { campo: 'PRIORIDAD', etiqueta: 'Prioridad', tipo: 'catalogo', catalogo: 'CFG_PRIORIDAD' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'MODO_USO', etiqueta: 'Modo de uso', tipo: 'catalogo', catalogo: 'CFG_MODO_USO', ayuda: 'Solo si este producto se reutiliza de otro proyecto. Déjalo vacío si es nuevo y no se reutiliza de nada.' }
  ],

DECISION: [
  { campo: 'PROYECTO_ID', etiqueta: 'Proyecto', tipo: 'fk', entidadFk: 'PROYECTO', requerido: true },
  { campo: 'TITULO', etiqueta: 'Título', tipo: 'texto', requerido: true },
  { campo: 'CONTEXTO', etiqueta: 'Contexto', tipo: 'textarea' },
  { campo: 'TIPO', etiqueta: 'Tipo', tipo: 'catalogo', catalogo: 'CFG_TIPO_DECISION', requerido: true },

  {
    campo: 'RESPONSABLE_ID',
    etiqueta: 'Responsable',
    tipo: 'fk',
    entidadFk: 'PERSONA_EQUIPO',
    excluirEstados: ['Inactivo']
  },

  { campo: 'FECHA_LIMITE', etiqueta: 'Fecha límite', tipo: 'fecha' },
  { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_DECISION', requerido: true, valorPorDefecto: 'Pendiente de información' },
  { campo: 'IMPACTO', etiqueta: 'Impacto', tipo: 'catalogo', catalogo: 'CFG_IMPACTO' },
  { campo: 'RESOLUCION', etiqueta: 'Resolución', tipo: 'textarea' },
  { campo: 'FECHA_RESOLUCION', etiqueta: 'Fecha de resolución', tipo: 'fecha' },
  { campo: 'OBJETIVO', etiqueta: 'Objetivo', tipo: 'textarea' },
  { campo: 'RESULTADO_ESPERADO', etiqueta: 'Resultado esperado', tipo: 'textarea' },
  { campo: 'CRITERIOS_ACEPTACION', etiqueta: 'Criterios de aceptación', tipo: 'textarea' },
  { campo: 'DEFINITION_OF_DONE', etiqueta: 'Definition of Done', tipo: 'textarea' },
  {
    campo: 'VALIDADOR_ID',
    etiqueta: 'Validador',
    tipo: 'fk',
    entidadFk: 'PERSONA_EQUIPO',
    excluirEstados: ['Inactivo']
  },
  { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'textarea' }
],

INCIDENCIA: [
  {
    campo: 'NIVEL_INCIDENCIA',
    etiqueta: 'Nivel de incidencia',
    tipo: 'catalogo',
    catalogo: 'CFG_NIVEL_INCIDENCIA',
    requerido: true
  },
  {
    campo: 'CAMPANA_ID',
    etiqueta: 'Campaña',
    tipo: 'fk',
    entidadFk: 'CAMPANA'
  },
  {
    campo: 'PROYECTO_ID',
    etiqueta: 'Proyecto',
    tipo: 'fk_dependiente',
    dependeDe: 'CAMPANA_ID',
    mapaEntidad: 'INCIDENCIA_PROYECTO_ID'
  },
  {
    campo: 'PRODUCTO_ID',
    etiqueta: 'Producto',
    tipo: 'fk_dependiente',
    dependeDe: 'PROYECTO_ID',
    mapaEntidad: 'INCIDENCIA_PRODUCTO_ID'
  },
  {
    campo: 'PROCESO_ID',
    etiqueta: 'Proceso',
    tipo: 'fk_dependiente',
    dependeDe: 'PRODUCTO_ID',
    mapaEntidad: 'INCIDENCIA_PROCESO_ID'
  },
  {
    campo: 'CLIENTE_ID',
    etiqueta: 'Cliente',
    tipo: 'fk',
    entidadFk: 'CLIENTE',
    ayuda: 'Solo si Nivel de incidencia es "Cliente" -- incidencia de mantenimiento/soporte sin proyecto activo.',
    visibleSi: { campo: 'NIVEL_INCIDENCIA', valores: ['Cliente'] }
  },
  {
    campo: 'TAREA_ID',
    etiqueta: 'Tarea',
    tipo: 'fk_dependiente',
    dependeDe: 'PROCESO_ID',
    mapaEntidad: 'INCIDENCIA_TAREA_ID'
  },
  {
    campo: 'TITULO',
    etiqueta: 'Título',
    tipo: 'texto',
    requerido: true
  },
  {
    campo: 'DESCRIPCION',
    etiqueta: 'Descripción',
    tipo: 'texto'
  },
  {
    campo: 'TIPO',
    etiqueta: 'Tipo',
    tipo: 'catalogo',
    catalogo: 'CFG_TIPO_INCIDENCIA',
    requerido: true
  },
  {
    campo: 'PRIORIDAD',
    etiqueta: 'Prioridad',
    tipo: 'catalogo',
    catalogo: 'CFG_PRIORIDAD',
    requerido: true,
    valorPorDefecto: 'Media'
  },
  {
    campo: 'RESPONSABLE_ID',
    etiqueta: 'Responsable',
    tipo: 'fk',
    entidadFk: 'PERSONA_EQUIPO'
  },
  {
    campo: 'FECHA_DETECCION',
    etiqueta: 'Fecha de detección',
    tipo: 'fecha',
    requerido: true
  },
  {
    campo: 'FECHA_LIMITE',
    etiqueta: 'Fecha límite',
    tipo: 'fecha'
  },
  {
    campo: 'ESTADO',
    etiqueta: 'Estado',
    tipo: 'catalogo',
    catalogo: 'CFG_ESTADO_INCIDENCIA',
    requerido: true,
    valorPorDefecto: 'Abierta'
  },
  {
    campo: 'IMPACTO',
    etiqueta: 'Impacto',
    tipo: 'catalogo',
    catalogo: 'CFG_IMPACTO'
  },
  {
    campo: 'ACCION_CORRECTORA',
    etiqueta: 'Acción correctora',
    tipo: 'texto',
    visibleSi: {
      campo: 'ESTADO',
      valores: ['Resuelta', 'Cerrada', 'Cancelada']
    }
  },
  {
    campo: 'FECHA_RESOLUCION',
    etiqueta: 'Fecha de resolución',
    tipo: 'fecha',
    visibleSi: {
      campo: 'ESTADO',
      valores: ['Resuelta', 'Cerrada', 'Cancelada']
    }
  },
  {
    campo: 'OBSERVACIONES',
    etiqueta: 'Observaciones',
    tipo: 'texto'
  }
],

  DOCUMENTO: [
    { campo: 'ENTIDAD_TIPO', etiqueta: 'Tipo de entidad', tipo: 'catalogo', catalogo: 'CFG_ENTIDAD_DOCUMENTO', requerido: true },
    { campo: 'ENTIDAD_ID', etiqueta: 'Registro', tipo: 'fk_dependiente', dependeDe: 'ENTIDAD_TIPO', mapaEntidad: 'DOCUMENTO_ENTIDAD_ID', requerido: true },
    { campo: 'TIPO_DOCUMENTO', etiqueta: 'Tipo de documento', tipo: 'catalogo', catalogo: 'CFG_TIPO_DOCUMENTO', requerido: true },
    { campo: 'TITULO', etiqueta: 'Título', tipo: 'texto', requerido: true },
    { campo: 'DESCRIPCION', etiqueta: 'Descripción', tipo: 'texto' },
    { campo: 'VERSION', etiqueta: 'Versión', tipo: 'texto' },
    { campo: 'URL', etiqueta: 'URL', tipo: 'texto', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_DOCUMENTO', requerido: true, valorPorDefecto: 'Borrador' },
    { campo: 'FECHA_DOCUMENTO', etiqueta: 'Fecha del documento', tipo: 'fecha' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Asignación N:M genérica de persona/equipo a cualquier entidad de la
   * jerarquía (CAMPANA/PROYECTO/PRODUCTO/PROCESO/DECISION/INCIDENCIA).
   * Reutiliza los mismos catálogos y el mismo resolver de FK dependiente
   * que ya usan DOCUMENTO y TAREA_RESPONSABLE, para no duplicar diseño.
   * TAREA sigue gestionándose por TAREA_RESPONSABLE (ya existente, con sus
   * propias reglas FUNC-REC-*) — ASIGNACION no la sustituye en esta fase,
   * cubre los seis niveles que hoy no tienen ningún mecanismo de asignación.
   */
  ASIGNACION: [
    { campo: 'ENTIDAD_TIPO', etiqueta: 'Tipo de entidad', tipo: 'catalogo', catalogo: 'CFG_ENTIDAD_DOCUMENTO', requerido: true },
    { campo: 'ENTIDAD_ID', etiqueta: 'Registro', tipo: 'fk_dependiente', dependeDe: 'ENTIDAD_TIPO', mapaEntidad: 'DOCUMENTO_ENTIDAD_ID', requerido: true },
    { campo: 'PERSONA_EQUIPO_ID', etiqueta: 'Persona / equipo', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', requerido: true },
    { campo: 'ROL_ASIGNADO', etiqueta: 'Rol asignado', tipo: 'catalogo', catalogo: 'CFG_ROL_ASIGNACION', requerido: true },
    { campo: 'FECHA_INICIO_ASIGNACION', etiqueta: 'Fecha inicio asignación', tipo: 'fecha' },
    { campo: 'FECHA_FIN_ASIGNACION', etiqueta: 'Fecha fin asignación', tipo: 'fecha' },
    { campo: 'PORCENTAJE_DEDICACION', etiqueta: 'Porcentaje de dedicación', tipo: 'numero', requerido: true, min: 0, max: 100 },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_ASIGNACION', requerido: true, valorPorDefecto: 'Planificada' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Grafo de relaciones/dependencias entre dos registros del mismo tipo
   * de entidad (CAMPANA-CAMPANA, PROYECTO-PROYECTO, PRODUCTO-PRODUCTO,
   * PROCESO-PROCESO, TAREA-TAREA...). Ambos extremos reutilizan el mismo
   * resolver de FK dependiente que DOCUMENTO/ASIGNACION. TAREA sigue
   * teniendo TAREA_PREDECESORA_ID para el caso simple de un único
   * predecesor; RELACION es un mecanismo adicional para redes de
   * dependencias más ricas (varios tipos de relación, varias entidades),
   * no lo sustituye.
   */
  RELACION: [
    { campo: 'ENTIDAD_TIPO', etiqueta: 'Tipo de entidad', tipo: 'catalogo', catalogo: 'CFG_ENTIDAD_DOCUMENTO', requerido: true },
    { campo: 'ENTIDAD_ORIGEN_ID', etiqueta: 'Registro origen', tipo: 'fk_dependiente', dependeDe: 'ENTIDAD_TIPO', mapaEntidad: 'DOCUMENTO_ENTIDAD_ID', requerido: true },
    { campo: 'ENTIDAD_DESTINO_ID', etiqueta: 'Registro destino', tipo: 'fk_dependiente', dependeDe: 'ENTIDAD_TIPO', mapaEntidad: 'DOCUMENTO_ENTIDAD_ID', requerido: true },
    { campo: 'TIPO_RELACION', etiqueta: 'Tipo de relación', tipo: 'catalogo', catalogo: 'CFG_TIPO_RELACION', requerido: true },
    { campo: 'DESFASE_DIAS', etiqueta: 'Desfase (días)', tipo: 'numero' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Vínculo polimórfico genérico entre dos registros de CUALQUIER tipo
   * de entidad (a diferencia de RELACION, que exige el mismo tipo en
   * ambos extremos). Sustituye el patrón repetido de tablas ad-hoc
   * (DOCUMENTO_CONTEXTO, DECISION_CONTEXTO, INCIDENCIA_BLOQUEO) por una
   * única relación reutilizable. DOCUMENTO conserva su propio
   * ENTIDAD_TIPO/ENTIDAD_ID como vínculo principal; VINCULO cubre los
   * vínculos adicionales (varios documentos/decisiones por registro,
   * bloqueos entre entidades de tipo distinto, etc.).
   */
  VINCULO: [
    { campo: 'ENTIDAD_ORIGEN_TIPO', etiqueta: 'Tipo de entidad origen', tipo: 'catalogo', catalogo: 'CFG_ENTIDAD_DOCUMENTO', requerido: true },
    { campo: 'ENTIDAD_ORIGEN_ID', etiqueta: 'Registro origen', tipo: 'fk_dependiente', dependeDe: 'ENTIDAD_ORIGEN_TIPO', mapaEntidad: 'DOCUMENTO_ENTIDAD_ID', requerido: true },
    { campo: 'ENTIDAD_DESTINO_TIPO', etiqueta: 'Tipo de entidad destino', tipo: 'catalogo', catalogo: 'CFG_ENTIDAD_DOCUMENTO', requerido: true },
    { campo: 'ENTIDAD_DESTINO_ID', etiqueta: 'Registro destino', tipo: 'fk_dependiente', dependeDe: 'ENTIDAD_DESTINO_TIPO', mapaEntidad: 'DOCUMENTO_ENTIDAD_ID', requerido: true },
    { campo: 'TIPO_VINCULO', etiqueta: 'Tipo de vínculo', tipo: 'catalogo', catalogo: 'CFG_TIPO_VINCULO', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Franja horaria semanal recurrente (ver conversacion: horario de
   * apertura del taller/espacio, horario de un profesional, franja de
   * un voluntario). Patron polimorfico ENTIDAD_TIPO/ENTIDAD_ID igual
   * que DOCUMENTO/VINCULO, pero con catalogo propio y mas acotado
   * (CFG_ENTIDAD_HORARIO: solo Recurso y Persona/Equipo). Varias filas
   * por entidad (una por dia, o varias el mismo dia para mañana/tarde).
   * HORA_INICIO/HORA_FIN como texto "HH:MM" -- sin tipo de campo "hora"
   * en el motor de formularios; validado en validarReglasNegocioHorario_.
   */
  HORARIO: [
    { campo: 'ENTIDAD_TIPO', etiqueta: 'Tipo de entidad', tipo: 'catalogo', catalogo: 'CFG_ENTIDAD_HORARIO', requerido: true },
    { campo: 'ENTIDAD_ID', etiqueta: 'Registro', tipo: 'fk_dependiente', dependeDe: 'ENTIDAD_TIPO', mapaEntidad: 'HORARIO_ENTIDAD_ID', requerido: true },
    { campo: 'DIA_SEMANA', etiqueta: 'Día de la semana', tipo: 'catalogo', catalogo: 'CFG_DIA_SEMANA', requerido: true },
    { campo: 'HORA_INICIO', etiqueta: 'Hora inicio (HH:MM)', tipo: 'texto', requerido: true },
    { campo: 'HORA_FIN', etiqueta: 'Hora fin (HH:MM)', tipo: 'texto', requerido: true },
    {
      campo: 'FECHA_INICIO_VIGENCIA', etiqueta: 'Vigente desde (opcional)', tipo: 'fecha',
      ayuda: 'Déjalo vacío si el horario es permanente. Rellénalo solo para un horario que aplica en una franja de fechas concreta (ej. temporada alta).'
    },
    { campo: 'FECHA_FIN_VIGENCIA', etiqueta: 'Vigente hasta (opcional)', tipo: 'fecha' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Eje económico, Fase 1 (ver conversación -- "presupuesto y fuentes
   * de financiación, para justificar los proyectos ante subvenciones/
   * departamentos/clientes"). Dato base sin cálculo todavía: el coste
   * real por categoría se construye en la Fase 2. Patrón polimórfico
   * ENTIDAD_TIPO/ENTIDAD_ID igual que DOCUMENTO/VINCULO/HORARIO, pero
   * con catálogo propio y acotado a los 3 niveles decididos (Campaña/
   * Proyecto/Producto) en vez del genérico CFG_ENTIDAD_DOCUMENTO (10
   * valores, arrastraría "Tarea"/"Recurso" sin sentido aquí). El
   * resolver de ENTIDAD_ID sí reutiliza el mapa genérico
   * DOCUMENTO_ENTIDAD_ID -- ya resuelve cualquier etiqueta válida de
   * ENTIDAD_DOCUMENTO_A_MVP, y estos 3 niveles son un subconjunto.
   */
  PRESUPUESTO: [
    { campo: 'ENTIDAD_TIPO', etiqueta: 'Nivel', tipo: 'catalogo', catalogo: 'CFG_ENTIDAD_PRESUPUESTO', requerido: true },
    { campo: 'ENTIDAD_ID', etiqueta: 'Registro', tipo: 'fk_dependiente', dependeDe: 'ENTIDAD_TIPO', mapaEntidad: 'DOCUMENTO_ENTIDAD_ID', requerido: true },
    { campo: 'CATEGORIA', etiqueta: 'Categoría', tipo: 'catalogo', catalogo: 'CFG_CATEGORIA_PRESUPUESTO', requerido: true },
    { campo: 'IMPORTE_PREVISTO', etiqueta: 'Importe previsto (€)', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  FUENTE_FINANCIACION: [
    { campo: 'ENTIDAD_TIPO', etiqueta: 'Nivel', tipo: 'catalogo', catalogo: 'CFG_ENTIDAD_PRESUPUESTO', requerido: true },
    { campo: 'ENTIDAD_ID', etiqueta: 'Registro', tipo: 'fk_dependiente', dependeDe: 'ENTIDAD_TIPO', mapaEntidad: 'DOCUMENTO_ENTIDAD_ID', requerido: true },
    { campo: 'NOMBRE', etiqueta: 'Nombre de la fuente', tipo: 'texto', requerido: true, ayuda: 'Ej. "Subvención Ajuntament 2026", "Departament de Benestar Social".' },
    { campo: 'TIPO', etiqueta: 'Tipo', tipo: 'catalogo', catalogo: 'CFG_TIPO_FUENTE_FINANCIACION', requerido: true },
    { campo: 'IMPORTE', etiqueta: 'Importe (€)', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_FUENTE_FINANCIACION', requerido: true, valorPorDefecto: 'Solicitada' },
    { campo: 'FECHA_SOLICITUD', etiqueta: 'Fecha de solicitud', tipo: 'fecha' },
    { campo: 'FECHA_RESOLUCION', etiqueta: 'Fecha de resolución', tipo: 'fecha' },
    {
      campo: 'CONVOCATORIA_ID', etiqueta: 'Convocatoria de origen (opcional)', tipo: 'fk', entidadFk: 'CONVOCATORIA',
      ayuda: 'Si esta financiación viene de una convocatoria registrada, vincúlala aquí para llevar el histórico de a qué os habéis presentado.'
    },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Eje económico, Capa 1 de convocatorias (ver conversación -- "un
   * buscador de convocatorias por scrap web... generar propuestas de
   * participación"). Esta pieza es solo el registro/seguimiento
   * determinista de la OPORTUNIDAD en sí (antes de decidir presentarse),
   * distinta de FUENTE_FINANCIACION (la aplicación concreta ya en
   * marcha). TIPO_PROYECTO_ELEGIBLE reutiliza el catálogo CFG_TIPO_PROYECTO
   * ya existente -- el filtro de encaje determinista es una simple
   * igualdad de catálogo compartido, sin inventar taxonomía nueva.
   */
  CONVOCATORIA: [
    { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true, ayuda: 'Ej. "Subvenciones a entidades sociales 2026".' },
    { campo: 'ENTIDAD_CONVOCANTE', etiqueta: 'Entidad convocante', tipo: 'texto', requerido: true },
    { campo: 'TIPO', etiqueta: 'Tipo', tipo: 'catalogo', catalogo: 'CFG_TIPO_CONVOCATORIA', requerido: true },
    { campo: 'IMPORTE_DISPONIBLE', etiqueta: 'Importe disponible (€)', tipo: 'numero', min: 0 },
    { campo: 'IMPORTE_MINIMO_SOLICITUD', etiqueta: 'Importe mínimo de solicitud (€)', tipo: 'numero', min: 0 },
    { campo: 'IMPORTE_MAXIMO_SOLICITUD', etiqueta: 'Importe máximo de solicitud (€)', tipo: 'numero', min: 0 },
    {
      campo: 'TIPO_PROYECTO_ELEGIBLE', etiqueta: 'Tipo de proyecto elegible (opcional)', tipo: 'catalogo', catalogo: 'CFG_TIPO_PROYECTO',
      ayuda: 'Déjalo vacío si la convocatoria admite cualquier tipo de proyecto.'
    },
    { campo: 'FECHA_LIMITE', etiqueta: 'Fecha límite de solicitud', tipo: 'fecha', requerido: true },
    { campo: 'REQUISITOS', etiqueta: 'Requisitos', tipo: 'textarea' },
    { campo: 'URL_BASES', etiqueta: 'Enlace a las bases', tipo: 'texto' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_CONVOCATORIA', requerido: true, valorPorDefecto: 'Abierta' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Fase N6.1 (ver conversación -- eje "Por qué"): etiquetas de impacto
   * social/ecológico/económico, mismo catálogo de nivel que el eje
   * económico (CFG_ENTIDAD_PRESUPUESTO -- Campaña/Proyecto/Producto).
   */
  ETIQUETA_IMPACTO: [
    { campo: 'ENTIDAD_TIPO', etiqueta: 'Nivel', tipo: 'catalogo', catalogo: 'CFG_ENTIDAD_PRESUPUESTO', requerido: true },
    { campo: 'ENTIDAD_ID', etiqueta: 'Registro', tipo: 'fk_dependiente', dependeDe: 'ENTIDAD_TIPO', mapaEntidad: 'DOCUMENTO_ENTIDAD_ID', requerido: true },
    { campo: 'CATEGORIA_IMPACTO', etiqueta: 'Categoría de impacto', tipo: 'catalogo', catalogo: 'CFG_CATEGORIA_IMPACTO', requerido: true },
    { campo: 'DESCRIPCION', etiqueta: 'Descripción', tipo: 'textarea', requerido: true, ayuda: 'Ej. "Reduce residuos reutilizando madera de palets", "Genera 3 puestos de voluntariado estable".' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Costes de actividad sueltos (ver conversación -- "entidad Coste
   * genérica y flexible"): transporte, seguros, marketing, licencias,
   * honorarios de participantes externos... todo lo que no encaja en
   * materiales (PEDIDO_PROVEEDOR_LINEA) ni en recursos (RECURSO). Mismo
   * patrón polimórfico, catálogo propio CFG_ENTIDAD_COSTE (Campaña/
   * Proyecto/Producto/Recurso -- incluye Recurso porque un coste suelto
   * puede ser específico de una máquina, ej. una reparación puntual).
   */
  COSTE: [
    { campo: 'ENTIDAD_TIPO', etiqueta: 'Nivel', tipo: 'catalogo', catalogo: 'CFG_ENTIDAD_COSTE', requerido: true },
    { campo: 'ENTIDAD_ID', etiqueta: 'Registro', tipo: 'fk_dependiente', dependeDe: 'ENTIDAD_TIPO', mapaEntidad: 'DOCUMENTO_ENTIDAD_ID', requerido: true },
    { campo: 'CATEGORIA', etiqueta: 'Categoría', tipo: 'catalogo', catalogo: 'CFG_CATEGORIA_PRESUPUESTO', requerido: true, ayuda: 'La misma categoría que usa el Presupuesto -- así este coste se compara contra la partida prevista correcta.' },
    { campo: 'CONCEPTO', etiqueta: 'Concepto', tipo: 'texto', requerido: true, ayuda: 'Ej. "Transporte", "Seguro de responsabilidad civil", "Honorarios: Juan Pérez".' },
    { campo: 'IMPORTE', etiqueta: 'Importe (€)', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'FECHA', etiqueta: 'Fecha', tipo: 'fecha' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_COSTE', requerido: true, valorPorDefecto: 'Previsto' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Base de competencias (ver conversación -- "rellenar los huecos del
   * sistema para dejarlo preparado para L6"). COMPETENCIA es una
   * entidad ligera propia, no un catálogo de texto -- referenciable por
   * ID desde Persona y Recurso en relación N:M real (PERSONA_COMPETENCIA/
   * RECURSO_COMPETENCIA), mismo patrón que EQUIPO_MIEMBRO/TAREA_RECURSO.
   */
  COMPETENCIA: [
    { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true, ayuda: 'Ej. "Soldadura", "Manejo de troqueladora", "Catalán hablado".' },
    { campo: 'DESCRIPCION', etiqueta: 'Descripción', tipo: 'texto' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_COMPETENCIA', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  PERSONA_COMPETENCIA: [
    { campo: 'PERSONA_EQUIPO_ID', etiqueta: 'Persona / equipo', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', requerido: true, excluirEstados: ['Inactivo'] },
    { campo: 'COMPETENCIA_ID', etiqueta: 'Competencia', tipo: 'fk', entidadFk: 'COMPETENCIA', requerido: true },
    { campo: 'NIVEL', etiqueta: 'Nivel', tipo: 'catalogo', catalogo: 'CFG_NIVEL_COMPETENCIA' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  RECURSO_COMPETENCIA: [
    { campo: 'RECURSO_ID', etiqueta: 'Recurso', tipo: 'fk', entidadFk: 'RECURSO', requerido: true, ayuda: 'La competencia requerida para usar este recurso.' },
    { campo: 'COMPETENCIA_ID', etiqueta: 'Competencia requerida', tipo: 'fk', entidadFk: 'COMPETENCIA', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Track A -- encaje de competencias (ver conversación -- "que la
   * relación entre tarea y competencia forme parte del éxito de la
   * campaña"): simétrico a RECURSO_COMPETENCIA, pero declarando qué
   * exige una TAREA en vez de un RECURSO, y con NIVEL_MINIMO (no basta
   * con "tener la competencia", puede exigirse un nivel concreto --
   * comparado luego contra PERSONA_COMPETENCIA.NIVEL de quien se asigne
   * como responsable, ver aviso de encaje en TAREA_RESPONSABLE).
   */
  TAREA_COMPETENCIA: [
    { campo: 'TAREA_ID', etiqueta: 'Tarea', tipo: 'fk', entidadFk: 'TAREA', requerido: true },
    { campo: 'COMPETENCIA_ID', etiqueta: 'Competencia requerida', tipo: 'fk', entidadFk: 'COMPETENCIA', requerido: true },
    { campo: 'NIVEL_MINIMO', etiqueta: 'Nivel mínimo exigido', tipo: 'catalogo', catalogo: 'CFG_NIVEL_COMPETENCIA', ayuda: 'Déjalo vacío si basta con tener la competencia, sin importar el nivel.' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Track B -- encaje de capacidad material (ver conversación --
   * "diferenciar entre los desequilibrios de recursos humanos y los
   * desequilibrios materiales"): simétrico a TAREA_COMPETENCIA pero
   * sobre tipo/cantidad de recurso en vez de habilidad. CLASE/CATEGORIA
   * requeridas son ambas opcionales -- puede exigirse solo cantidad
   * (da igual la clase concreta) o solo clase (cualquier cantidad, con
   * tal de que exista al menos un recurso de esa clase asignado).
   */
  TAREA_RECURSO_NECESIDAD: [
    { campo: 'TAREA_ID', etiqueta: 'Tarea', tipo: 'fk', entidadFk: 'TAREA', requerido: true },
    { campo: 'CLASE_RECURSO_REQUERIDA', etiqueta: 'Clase de recurso exigida', tipo: 'catalogo', catalogo: 'CFG_CLASE_RECURSO', ayuda: 'Déjalo vacío si vale cualquier clase.' },
    { campo: 'CATEGORIA_RECURSO_REQUERIDA', etiqueta: 'Categoría exigida', tipo: 'catalogo', catalogo: 'CFG_CATEGORIA_RECURSO', ayuda: 'Déjalo vacío si vale cualquier categoría dentro de la clase.' },
    { campo: 'CANTIDAD_MINIMA', etiqueta: 'Cantidad mínima de recursos', tipo: 'numero', min: 1, valorPorDefecto: 1 },
    /*
     * Capacidad mínima exigida (numérica), comparada contra
     * RECURSO.CAPACIDAD del recurso realmente asignado -- solo cuenta un
     * recurso como válido si además coincide CAPACIDAD_UNIDAD (mismo
     * texto, sin distinguir mayúsculas): no tiene sentido comparar "500"
     * contra un recurso con capacidad en otra unidad sin conversión.
     */
    { campo: 'CAPACIDAD_MINIMA', etiqueta: 'Capacidad mínima exigida', tipo: 'numero', min: 0, ayuda: 'Opcional. Ej. 500 -- exige que el recurso asignado tenga CAPACIDAD >= 500 en la misma unidad.' },
    { campo: 'CAPACIDAD_UNIDAD', etiqueta: 'Unidad de la capacidad exigida', tipo: 'texto', ayuda: 'Debe coincidir con la unidad del recurso (ej. "kg") para poder comparar.' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Motor de escenarios (ver conversación -- "base para personalizar las
   * experiencias del cliente y previo paso a la gamificación"): GUION es
   * la historia en prosa libre que se inyecta como contexto compartido
   * en el PROMPT_IA.txt de cada grupo de Importación masiva. Los tres
   * EJE_* controlan cuánta fricción de cada tipo debe simular la IA --
   * "Ninguna" en los tres equivale al comportamiento actual (datos
   * siempre ideales). Solo debería haber un ESCENARIO con ESTADO="Activo"
   * a la vez -- si hay varios, se usa el modificado más recientemente
   * (ver obtenerEscenarioActivo_ en PlantillaImportacionMasivaService.js).
   */
  ESCENARIO: [
    { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true, ayuda: 'Ej. "Sant Jordi con imprenta tarde".' },
    { campo: 'PERFIL', etiqueta: 'Perfil', tipo: 'catalogo', catalogo: 'CFG_PERFIL_ESCENARIO', requerido: true, valorPorDefecto: 'Ideal', ayuda: 'Ideal = sin fricción. Los demás perfiles son solo una etiqueta orientativa -- lo que de verdad controla la simulación son los tres ejes de abajo.' },
    { campo: 'GUION', etiqueta: 'Guion del escenario', tipo: 'texto', ayuda: 'La historia en 3-4 frases (ej. "la imprenta llega 3 días tarde la primera semana, el responsable de logística está de baja del 10 al 12"). Se pega igual en el PROMPT_IA.txt de todos los grupos, para que la IA cuente la misma historia en cada lote aunque los generes en conversaciones separadas.' },
    { campo: 'EJE_COMPETENCIA', etiqueta: 'Fricción de encaje humano (competencias)', tipo: 'catalogo', catalogo: 'CFG_INTENSIDAD_ESCENARIO', valorPorDefecto: 'Ninguna' },
    { campo: 'EJE_RECURSO', etiqueta: 'Fricción de capacidad material (recursos)', tipo: 'catalogo', catalogo: 'CFG_INTENSIDAD_ESCENARIO', valorPorDefecto: 'Ninguna' },
    { campo: 'EJE_AUSENCIA', etiqueta: 'Fricción de disponibilidad (ausencias/horario)', tipo: 'catalogo', catalogo: 'CFG_INTENSIDAD_ESCENARIO', valorPorDefecto: 'Ninguna' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_ESCENARIO', requerido: true, valorPorDefecto: 'Borrador', ayuda: 'Solo un escenario "Activo" gobierna las próximas plantillas -- pon los demás en Borrador/Archivado.' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Libro de movimientos de MATERIAL (Fase L3.3). Registro aditivo de
   * eventos de stock (entrada/reserva/salida/consumo/merma/devolucion/
   * traslado/ajuste). NO sustituye ni recalcula MATERIAL.STOCK_ACTUAL
   * todavia -- esa migracion es explicitamente de la Fase L5 (RECURSO);
   * aqui solo se construye el mecanismo para poder empezar a registrar
   * movimientos de forma trazable.
   */
  MOVIMIENTO_MATERIAL: [
    { campo: 'MATERIAL_ID', etiqueta: 'Material', tipo: 'fk', entidadFk: 'MATERIAL', requerido: true },
    { campo: 'TAREA_ID', etiqueta: 'Tarea relacionada', tipo: 'fk', entidadFk: 'TAREA' },
    { campo: 'TIPO_MOVIMIENTO', etiqueta: 'Tipo de movimiento', tipo: 'catalogo', catalogo: 'CFG_TIPO_MOVIMIENTO', requerido: true },
    { campo: 'CANTIDAD', etiqueta: 'Cantidad', tipo: 'numero', requerido: true, min: 0 },
    { campo: 'UNIDAD', etiqueta: 'Unidad', tipo: 'catalogo', catalogo: 'CFG_UNIDAD', requerido: true },
    { campo: 'FECHA_MOVIMIENTO', etiqueta: 'Fecha del movimiento', tipo: 'fecha', requerido: true },
    { campo: 'RESPONSABLE_ID', etiqueta: 'Responsable', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', excluirEstados: ['Inactivo'] },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  /*
   * Definicion vs. ejecucion (Fase L3.4). TAREA sigue siendo la
   * definicion reutilizable (nombre, proceso, duracion prevista,
   * criterios de aceptacion...); EJECUCION_TAREA registra cada
   * ocurrencia real (quien la ejecuto, cuando, con que resultado) sin
   * sobrescribir el historico cuando una tarea reutilizable se repite.
   */
  EJECUCION_TAREA: [
    { campo: 'TAREA_ID', etiqueta: 'Tarea', tipo: 'fk', entidadFk: 'TAREA', requerido: true },
    { campo: 'RESPONSABLE_ID', etiqueta: 'Responsable de la ejecución', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', excluirEstados: ['Inactivo'] },
    { campo: 'FECHA_INICIO', etiqueta: 'Fecha de inicio', tipo: 'fecha' },
    { campo: 'FECHA_FIN', etiqueta: 'Fecha de fin', tipo: 'fecha' },
    { campo: 'DURACION_REAL_DIAS', etiqueta: 'Duración real (días)', tipo: 'numero', min: 0 },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
    { campo: 'RESULTADO', etiqueta: 'Resultado', tipo: 'catalogo', catalogo: 'CFG_RESULTADO_EJECUCION' },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ]
});
var ESTADOS_DECISION_CIERRE_ = ['Aprobada', 'Rechazada', 'Sustituida'];
var ESTADOS_INCIDENCIA_CIERRE_ = ['Resuelta', 'Cerrada', 'Cancelada'];
var NIVELES_JERARQUIA_INCIDENCIA_ = ['CAMPANA_ID', 'PROYECTO_ID', 'PRODUCTO_ID', 'PROCESO_ID', 'TAREA_ID'];
var ESTADO_DOCUMENTO_VIGENTE_ = 'Vigente';