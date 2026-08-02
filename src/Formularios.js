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
  'Persona/Equipo': 'PERSONA_EQUIPO'
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

function obtenerOpcionesDependientes(mapaEntidad, valorPadre) {
  var mapa = MAPAS_DEPENDENCIA_MVP[mapaEntidad];
  if (!mapa) throw new Error('No existe el mapa de dependencia ' + mapaEntidad);
  return mapa.resolver(valorPadre);
}

/*
 * Hallazgo #16 (auditoría piloto): PRODUCTO_ID y PROYECTO_PRODUCTO_ID
 * eran campos independientes en PROCESO, sin ninguna relación entre
 * ambos -- se podía elegir una combinación inconsistente. Al elegir la
 * Relación proyecto-producto, se deriva su Producto automáticamente
 * (solo si el campo Producto aún está vacío, nunca pisa una elección
 * manual ya hecha).
 */
function obtenerProductoDesdeProyectoProducto(proyectoProductoId) {
  var relacion = obtenerRegistroPorId('PROYECTO_PRODUCTO', proyectoProductoId);

  if (!relacion) return null;

  var producto = obtenerRegistroPorId('PRODUCTO', relacion.PRODUCTO_ID);

  return {
    id: relacion.PRODUCTO_ID,
    etiqueta: relacion.PRODUCTO_ID + ' - ' + (producto ? producto.NOMBRE : '')
  };
}

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
    { campo: 'VERSION', etiqueta: 'Versión', tipo: 'texto' },
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
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true, valorPorDefecto: 'Activa' },
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

function obtenerEsquemaFormulario(entidad, idRegistro) {
  var clave = String(entidad || '').trim().toUpperCase();
  var esquema = ESQUEMAS_FORMULARIO_MVP[clave];

  if (!Array.isArray(esquema)) {
    throw new Error(
      'No hay esquema de formulario para la entidad ' +
      entidad
    );
  }

  var zonaHoraria =
    SpreadsheetApp
      .getActive()
      .getSpreadsheetTimeZone();

  var campos = esquema.map(function (campo) {
    var copia = Object.assign({}, campo);

    /*
     * Catálogos:
     * - admite opciones declaradas directamente;
     * - si no existen, carga el catálogo configurado.
     */
    if (copia.tipo === 'catalogo') {
      if (Array.isArray(copia.opciones)) {
        copia.opciones = copia.opciones.slice();
      } else {
        var catalogo =
          obtenerCatalogo(copia.catalogo);

        copia.opciones =
          Array.isArray(catalogo)
            ? catalogo
            : [];
      }
    }

    /*
     * Claves foráneas:
     * - solo registros activos;
     * - permite excluir estados concretos.
     */
    if (copia.tipo === 'fk') {
      var registros = listarRegistros(
        copia.entidadFk,
        { ACTIVO: 'SÍ' }
      );

      registros =
        Array.isArray(registros)
          ? registros
          : [];

      if (
        Array.isArray(copia.excluirEstados) &&
        copia.excluirEstados.length > 0
      ) {
        registros = registros.filter(
          function (registro) {
            var estadoRegistro =
              String(
                registro.ESTADO || ''
              ).trim();

            return (
              copia.excluirEstados.indexOf(
                estadoRegistro
              ) === -1
            );
          }
        );
      }

      /*
       * Filtro por valor de un campo arbitrario (no solo ESTADO). Ej.
       * RECURSO.UBICACION_ID solo debe ofrecer recursos con
       * CLASE_RECURSO=Espacio, no cualquier recurso -- evita confundir
       * una ubicacion con una herramienta o maquina.
       */
      if (
        copia.filtroValores &&
        Array.isArray(copia.filtroValores.valores) &&
        copia.filtroValores.valores.length > 0
      ) {
        registros = registros.filter(
          function (registro) {
            var valorCampo =
              String(
                registro[copia.filtroValores.campo] || ''
              ).trim();

            return (
              copia.filtroValores.valores.indexOf(
                valorCampo
              ) !== -1
            );
          }
        );
      }

      /*
       * Bug real detectado en la auditoria piloto: PROYECTO_PRODUCTO no
       * tiene NOMBRE/TITULO propio, asi que el buscador (ej. PROCESO.
       * PROYECTO_PRODUCTO_ID) mostraba etiquetas vacias ("PPR-0001 - ").
       * Se construye una etiqueta compuesta a partir del proyecto y el
       * producto de cada relacion. Prefetch unico (no por fila) para no
       * repetir listarRegistros dentro del map.
       */
      var nombresProyectoPorId_ = null;
      var nombresProductoPorId_ = null;

      if (copia.entidadFk === 'PROYECTO_PRODUCTO') {
        nombresProyectoPorId_ = {};
        listarRegistros('PROYECTO', { ACTIVO: 'SÍ' }).forEach(function (p) {
          nombresProyectoPorId_[p.ID] = p.NOMBRE;
        });

        nombresProductoPorId_ = {};
        listarRegistros('PRODUCTO', { ACTIVO: 'SÍ' }).forEach(function (p) {
          nombresProductoPorId_[p.ID] = p.NOMBRE;
        });
      }

      copia.opciones = registros.map(
        function (registro) {
          var etiqueta;

          if (copia.entidadFk === 'PROYECTO_PRODUCTO') {
            etiqueta =
              registro.ID + ' - ' +
              (nombresProyectoPorId_[registro.PROYECTO_ID] || registro.PROYECTO_ID) +
              ' / ' +
              (nombresProductoPorId_[registro.PRODUCTO_ID] || registro.PRODUCTO_ID);
          } else {
            etiqueta =
              registro.ID +
              ' - ' +
              (
                registro.NOMBRE ||
                registro.TITULO ||
                ''
              );
          }

          /*
           * F-046: el selector de PERSONA_EQUIPO no distinguía persona de
           * equipo. Se añade el TIPO a la etiqueta (mismo texto "ID -
           * nombre" que usa extraerIdDeEtiqueta_, solo se le añade un
           * sufijo informativo que no afecta a la extracción del ID).
           */
          if (copia.entidadFk === 'PERSONA_EQUIPO' && registro.TIPO) {
            etiqueta += ' (' + registro.TIPO + ')';
          }

          return {
            id: registro.ID,
            etiqueta: etiqueta
          };
        }
      );
    }

    if (copia.tipo === 'fk_dependiente') {
      copia.opciones = [];
    }

    return copia;
  });

  if (idRegistro) {
    var registro =
      obtenerRegistroPorId(
        clave,
        idRegistro
      );

    if (!registro) {
      throw new Error(
        'No se encontró el registro ' +
        idRegistro +
        ' de la entidad ' +
        clave
      );
    }

    campos.forEach(function (campo) {
      var valor =
        registro[campo.campo];

      if (
        valor === undefined ||
        valor === null
      ) {
        return;
      }

      if (
        Object.prototype.toString.call(
          valor
        ) === '[object Date]'
      ) {
        campo.valorActual =
          Utilities.formatDate(
            valor,
            zonaHoraria,
            'yyyy-MM-dd'
          );
      } else {
        campo.valorActual = valor;
      }
    });
  }

  return campos;
}

function validarDuplicidadFormulario_(clave, datos, idExcluir) {
  var camposClave = CLAVES_DUPLICADO_MVP[clave];
  if (!camposClave) return;
  var registros = listarRegistros(clave, { ACTIVO: 'SÍ' });
  if (clave === 'EQUIPO_MIEMBRO') {
    registros = registros.filter(function (registro) {
      return String(registro.ESTADO || '').trim() === 'Activa';
    });
  }
  var duplicado = registros.some(function (r) {
    if (idExcluir && r.ID === idExcluir) return false;
    return camposClave.every(function (c) { return String(r[c]) === String(datos[c]); });
  });
  if (duplicado) {
    throw new Error('Ya existe un registro con la misma combinación de ' + camposClave.join(', ') + '.');
  }
}

function traducirErrorFuncional_(mensaje, clave) {
  var texto = String(mensaje || '');
  if (texto.indexOf('ERROR_VALIDACION') !== -1 || texto.indexOf('obligator') !== -1) {
    return 'Faltan campos obligatorios para guardar el registro.';
  }
  return 'No se pudo guardar el registro: ' + texto.replace(/^ERROR_[A-Z_]+:\s*/, '');
}
function validarReglasNegocioFormulario_(clave, datos, idExcluir) {
  if (clave === 'PERSONA_EQUIPO') return validarReglasNegocioPersonaEquipo_(datos);
  if (clave === 'EQUIPO_MIEMBRO') return validarReglasNegocioEquipoMiembro_(datos, idExcluir);
  if (clave === 'TAREA') return validarReglasNegocioTarea_(datos);
  if (clave === 'TAREA_RESPONSABLE') return validarReglasNegocioTareaResponsable_(datos, idExcluir);
  if (clave === 'MATERIAL') return validarReglasNegocioMaterial_(datos);
  if (clave === 'TAREA_MATERIAL') return validarReglasNegocioTareaMaterial_(datos);
  if (clave === 'DECISION') return validarReglasNegocioDecision_(datos, idExcluir);
  if (clave === 'INCIDENCIA') return validarReglasNegocioIncidencia_(datos);
  if (clave === 'DOCUMENTO') return validarReglasNegocioDocumento_(datos, idExcluir);
  if (clave === 'HORARIO') return validarReglasNegocioHorario_(datos);
}

/*
 * Sin tipo de campo "hora" en el motor de formularios -- HORA_INICIO/
 * HORA_FIN se guardan como texto "HH:MM" y se validan aqui: formato
 * correcto y fin posterior a inicio (comparacion de string funciona
 * porque el formato va siempre con cero a la izquierda).
 */
function validarReglasNegocioHorario_(datos) {
  var formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;
  var horaInicio = String(datos.HORA_INICIO || '').trim();
  var horaFin = String(datos.HORA_FIN || '').trim();

  if (!formatoHora.test(horaInicio)) {
    throw new Error('ERROR_HORARIO_FORMATO: la hora de inicio debe tener el formato HH:MM (ej. 09:00).');
  }
  if (!formatoHora.test(horaFin)) {
    throw new Error('ERROR_HORARIO_FORMATO: la hora de fin debe tener el formato HH:MM (ej. 17:30).');
  }
  if (horaFin <= horaInicio) {
    throw new Error('ERROR_HORARIO_RANGO: la hora de fin debe ser posterior a la hora de inicio.');
  }
}

function validarReglasNegocioEquipoMiembro_(datos, idExcluir) {
  return validarEquipoMiembro_(datos, idExcluir);
}

function validarReglasNegocioPersonaEquipo_(datos) {
  var tipo = String(datos.TIPO || '').trim();
  var coordinadorId = String(datos.COORDINADOR_ID || '').trim();

  if (tipo === 'Persona' && coordinadorId) {
    throw new Error(
      'ERROR_COORDINADOR_PERSONA: Una Persona no puede tener coordinador.'
    );
  }

  if (tipo !== 'Equipo' || !coordinadorId) return;

  var coordinador = obtenerRegistroPorId('PERSONA_EQUIPO', coordinadorId);
  if (!coordinador) {
    throw new Error(
      'ERROR_COORDINADOR_INEXISTENTE: El coordinador seleccionado no existe.'
    );
  }
  if (String(coordinador.ACTIVO || '').trim() !== 'SÍ') {
    throw new Error(
      'ERROR_COORDINADOR_INACTIVO: El coordinador seleccionado no está activo.'
    );
  }
  if (String(coordinador.ESTADO || '').trim() === 'Inactivo') {
    throw new Error(
      'ERROR_COORDINADOR_INACTIVO: El coordinador seleccionado tiene estado Inactivo.'
    );
  }
  if (String(coordinador.TIPO || '').trim() !== 'Persona') {
    throw new Error(
      'ERROR_COORDINADOR_TIPO: El coordinador seleccionado debe ser una Persona.'
    );
  }
}

var ESTADOS_DECISION_CIERRE_ = ['Aprobada', 'Rechazada', 'Sustituida'];

function validarReglasNegocioDecision_(datos, idExcluir) {
  var estadosCierre =
    ESTADOS_DECISION_CIERRE_;

  var esEstadoCerrado =
    estadosCierre.indexOf(
      String(datos.ESTADO || '').trim()
    ) !== -1;

  var decisionExistente = null;
  var fechaCreacion = null;

  if (idExcluir) {
    decisionExistente =
      obtenerRegistroPorId('DECISION', idExcluir);

    if (!decisionExistente) {
      throw new Error(
        'No existe la decisión indicada: ' +
        idExcluir
      );
    }

    fechaCreacion = new Date(
      decisionExistente.FECHA_CREACION
    );
  } else {
    fechaCreacion = new Date();
  }

  if (isNaN(fechaCreacion.getTime())) {
    throw new Error(
      'No se pudo determinar la fecha de creación de la decisión.'
    );
  }

  fechaCreacion.setHours(0, 0, 0, 0);

  datos.RESOLUCION =
    String(datos.RESOLUCION || '').trim();

  /*
   * Estados cerrados:
   * requieren resolución y fecha de resolución.
   */
  if (esEstadoCerrado) {
    if (!datos.RESOLUCION) {
      throw new Error(
        'Debe indicar la resolución al cerrar la decisión.'
      );
    }

    if (!datos.FECHA_RESOLUCION) {
      throw new Error(
        'Debe indicar la fecha de resolución al cerrar la decisión.'
      );
    }

    var fechaResolucion =
      new Date(datos.FECHA_RESOLUCION);

    if (isNaN(fechaResolucion.getTime())) {
      throw new Error(
        'La fecha de resolución no es válida.'
      );
    }

    fechaResolucion.setHours(0, 0, 0, 0);

    if (
      fechaResolucion.getTime() <
      fechaCreacion.getTime()
    ) {
      throw new Error(
        'La fecha de resolución no puede ser anterior a la fecha de creación.'
      );
    }
  } else {
    /*
     * Estados abiertos:
     * la UI oculta los campos de cierre, por lo que se limpian
     * automáticamente antes de guardar.
     */
    datos.RESOLUCION = '';
    datos.FECHA_RESOLUCION = '';
  }

  if (datos.RESPONSABLE_ID) {
    var responsable = obtenerRegistroPorId(
      'PERSONA_EQUIPO',
      datos.RESPONSABLE_ID
    );

    if (
      !responsable ||
      responsable.ACTIVO !== 'SÍ' ||
      responsable.ESTADO === 'Inactivo'
    ) {
      throw new Error(
        'El responsable indicado no existe o no está activo.'
      );
    }
  }

  if (datos.PROYECTO_ID) {
    var proyecto = obtenerRegistroPorId(
      'PROYECTO',
      datos.PROYECTO_ID
    );

    if (
      !proyecto ||
      proyecto.ACTIVO !== 'SÍ'
    ) {
      throw new Error(
        'El proyecto indicado no existe o no está activo.'
      );
    }
  }

  if (datos.FECHA_LIMITE) {
    var fechaLimite =
      new Date(datos.FECHA_LIMITE);

    if (isNaN(fechaLimite.getTime())) {
      throw new Error(
        'La fecha límite no es válida.'
      );
    }

    fechaLimite.setHours(0, 0, 0, 0);

    if (
      fechaLimite.getTime() <
      fechaCreacion.getTime()
    ) {
      throw new Error(
        'La fecha límite no puede ser anterior a la fecha de creación.'
      );
    }
  }
}

var ESTADOS_INCIDENCIA_CIERRE_ = ['Resuelta', 'Cerrada', 'Cancelada'];
var NIVELES_JERARQUIA_INCIDENCIA_ = ['CAMPANA_ID', 'PROYECTO_ID', 'PRODUCTO_ID', 'PROCESO_ID', 'TAREA_ID'];

function validarReglasNegocioIncidencia_(datos) {
  var nivel =
    String(datos.NIVEL_INCIDENCIA || '').trim();

  var estado =
    String(datos.ESTADO || '').trim();

  var prioridad =
    String(datos.PRIORIDAD || '').trim();

  var tipo =
    String(datos.TIPO || '').trim();

  var nivelesValidos = [
    'General',
    'Campaña',
    'Proyecto',
    'Producto',
    'Proceso',
    'Tarea'
  ];

  var jerarquia = [
    'CAMPANA_ID',
    'PROYECTO_ID',
    'PRODUCTO_ID',
    'PROCESO_ID',
    'TAREA_ID'
  ];

  var camposObligatoriosPorNivel = {
    'General': [],
    'Campaña': [
      'CAMPANA_ID'
    ],
    'Proyecto': [
      'CAMPANA_ID',
      'PROYECTO_ID'
    ],
    'Producto': [
      'CAMPANA_ID',
      'PROYECTO_ID',
      'PRODUCTO_ID'
    ],
    'Proceso': [
      'CAMPANA_ID',
      'PROYECTO_ID',
      'PRODUCTO_ID',
      'PROCESO_ID'
    ],
    'Tarea': [
      'CAMPANA_ID',
      'PROYECTO_ID',
      'PRODUCTO_ID',
      'PROCESO_ID',
      'TAREA_ID'
    ]
  };

  var camposPermitidosPorNivel = {
    'General': [],
    'Campaña': [
      'CAMPANA_ID'
    ],
    'Proyecto': [
      'CAMPANA_ID',
      'PROYECTO_ID'
    ],
    'Producto': [
      'CAMPANA_ID',
      'PROYECTO_ID',
      'PRODUCTO_ID'
    ],
    'Proceso': [
      'CAMPANA_ID',
      'PROYECTO_ID',
      'PRODUCTO_ID',
      'PROCESO_ID'
    ],
    'Tarea': [
      'CAMPANA_ID',
      'PROYECTO_ID',
      'PRODUCTO_ID',
      'PROCESO_ID',
      'TAREA_ID'
    ]
  };

  /*
   * NIVEL_INCIDENCIA obligatorio y válido.
   */
  if (!nivel) {
    throw new Error(
      'Debe indicar NIVEL_INCIDENCIA.'
    );
  }

  if (nivelesValidos.indexOf(nivel) === -1) {
    throw new Error(
      'NIVEL_INCIDENCIA no válido: ' +
      nivel
    );
  }

  /*
   * Exigir las FK correspondientes al nivel.
   */
  var camposObligatorios =
    camposObligatoriosPorNivel[nivel];

  camposObligatorios.forEach(function (campo) {
    if (!String(datos[campo] || '').trim()) {
      throw new Error(
        campo +
        ' es obligatorio para una incidencia de nivel ' +
        nivel +
        '.'
      );
    }
  });

  /*
   * Impedir relaciones inferiores al nivel declarado.
   */
  var camposPermitidos =
    camposPermitidosPorNivel[nivel];

  jerarquia.forEach(function (campo) {
    var informado =
      String(datos[campo] || '').trim() !== '';

    if (
      informado &&
      camposPermitidos.indexOf(campo) === -1
    ) {
      throw new Error(
        campo +
        ' no debe informarse para una incidencia de nivel ' +
        nivel +
        '.'
      );
    }
  });

  /*
   * Comprobar continuidad jerárquica.
   */
  if (
    datos.PROYECTO_ID &&
    !datos.CAMPANA_ID
  ) {
    throw new Error(
      'PROYECTO_ID requiere CAMPANA_ID.'
    );
  }

  if (
    datos.PRODUCTO_ID &&
    !datos.PROYECTO_ID
  ) {
    throw new Error(
      'PRODUCTO_ID requiere PROYECTO_ID.'
    );
  }

  if (
    datos.PROCESO_ID &&
    !datos.PRODUCTO_ID
  ) {
    throw new Error(
      'PROCESO_ID requiere PRODUCTO_ID.'
    );
  }

  if (
    datos.TAREA_ID &&
    !datos.PROCESO_ID
  ) {
    throw new Error(
      'TAREA_ID requiere PROCESO_ID.'
    );
  }

  /*
   * Validar proyecto respecto a campaña.
   */
  if (
    datos.PROYECTO_ID &&
    datos.CAMPANA_ID
  ) {
    var proyecto =
      obtenerRegistroPorId(
        'PROYECTO',
        datos.PROYECTO_ID
      );

    if (
      !proyecto ||
      proyecto.ACTIVO !== 'SÍ'
    ) {
      throw new Error(
        'El proyecto indicado no existe o no está activo.'
      );
    }

    if (
      String(proyecto.CAMPANA_ID) !==
      String(datos.CAMPANA_ID)
    ) {
      throw new Error(
        'El proyecto indicado no pertenece a la campaña seleccionada.'
      );
    }
  }

  /*
   * Validar producto respecto a proyecto.
   */
  if (
    datos.PRODUCTO_ID &&
    datos.PROYECTO_ID
  ) {
    var vinculos =
      listarRegistros(
        'PROYECTO_PRODUCTO',
        {
          ACTIVO: 'SÍ',
          PROYECTO_ID: datos.PROYECTO_ID,
          PRODUCTO_ID: datos.PRODUCTO_ID
        }
      );

    if (!vinculos.length) {
      throw new Error(
        'El producto indicado no está vinculado al proyecto seleccionado.'
      );
    }
  }

  /*
   * Validar proceso respecto a producto.
   */
  if (
    datos.PROCESO_ID &&
    datos.PRODUCTO_ID
  ) {
    var proceso =
      obtenerRegistroPorId(
        'PROCESO',
        datos.PROCESO_ID
      );

    if (
      !proceso ||
      proceso.ACTIVO !== 'SÍ'
    ) {
      throw new Error(
        'El proceso indicado no existe o no está activo.'
      );
    }

    if (
      String(proceso.PRODUCTO_ID) !==
      String(datos.PRODUCTO_ID)
    ) {
      throw new Error(
        'El proceso indicado no pertenece al producto seleccionado.'
      );
    }
  }

  /*
   * Validar tarea respecto a proceso.
   */
  if (
    datos.TAREA_ID &&
    datos.PROCESO_ID
  ) {
    var tarea =
      obtenerRegistroPorId(
        'TAREA',
        datos.TAREA_ID
      );

    if (
      !tarea ||
      tarea.ACTIVO !== 'SÍ'
    ) {
      throw new Error(
        'La tarea indicada no existe o no está activa.'
      );
    }

    if (
      String(tarea.PROCESO_ID) !==
      String(datos.PROCESO_ID)
    ) {
      throw new Error(
        'La tarea indicada no pertenece al proceso seleccionado.'
      );
    }
  }

  /*
   * Responsable obligatorio cuando la incidencia deja
   * el estado Abierta.
   */
  var estadosConResponsableObligatorio = [
    'En análisis',
    'En resolución',
    'Bloqueada',
    'Resuelta',
    'Cerrada',
    'Cancelada'
  ];

  var requiereResponsable =
    estadosConResponsableObligatorio
      .indexOf(estado) !== -1;

  if (
    requiereResponsable &&
    !String(datos.RESPONSABLE_ID || '').trim()
  ) {
    throw new Error(
      'RESPONSABLE_ID es obligatorio cuando la incidencia deja el estado Abierta.'
    );
  }

  /*
   * Validar responsable cuando esté informado.
   */
  if (String(datos.RESPONSABLE_ID || '').trim()) {
    var responsable =
      obtenerRegistroPorId(
        'PERSONA_EQUIPO',
        datos.RESPONSABLE_ID
      );

    if (
      !responsable ||
      responsable.ACTIVO !== 'SÍ' ||
      responsable.ESTADO === 'Inactivo'
    ) {
      throw new Error(
        'El responsable indicado no existe o no está activo.'
      );
    }
  }

  /*
   * Determinar si la incidencia está en estado de cierre.
   */
  var esEstadoCierre =
    ESTADOS_INCIDENCIA_CIERRE_
      .indexOf(estado) !== -1;

  /*
   * Toda incidencia cerrada requiere fecha de resolución.
   */
  if (
    esEstadoCierre &&
    !datos.FECHA_RESOLUCION
  ) {
    throw new Error(
      'Debe indicar la fecha de resolución al cerrar la incidencia.'
    );
  }

  /*
   * Validar coherencia temporal entre detección y resolución.
   */
  if (
    datos.FECHA_DETECCION &&
    datos.FECHA_RESOLUCION
  ) {
    var fechaDeteccion =
      datos.FECHA_DETECCION instanceof Date
        ? new Date(datos.FECHA_DETECCION.getTime())
        : new Date(datos.FECHA_DETECCION);

    var fechaResolucion =
      datos.FECHA_RESOLUCION instanceof Date
        ? new Date(datos.FECHA_RESOLUCION.getTime())
        : new Date(datos.FECHA_RESOLUCION);

    if (isNaN(fechaDeteccion.getTime())) {
      throw new Error(
        'La fecha de detección no es válida.'
      );
    }

    if (isNaN(fechaResolucion.getTime())) {
      throw new Error(
        'La fecha de resolución no es válida.'
      );
    }

    /*
     * Comparar solo el día, ignorando horas y minutos.
     */
    fechaDeteccion.setHours(0, 0, 0, 0);
    fechaResolucion.setHours(0, 0, 0, 0);

    if (
      fechaResolucion.getTime() <
      fechaDeteccion.getTime()
    ) {
      throw new Error(
        'La fecha de resolución no puede ser anterior a la fecha de detección.'
      );
    }
  }

  /*
   * Incidencias críticas o de seguridad.
   */
  var esCriticaOSeguridad =
    prioridad === 'Alta' ||
    tipo === 'Seguridad';

  if (
    esCriticaOSeguridad &&
    esEstadoCierre &&
    !String(datos.ACCION_CORRECTORA || '').trim()
  ) {
    throw new Error(
      'Debe indicar la acción correctora: la incidencia es de prioridad alta o de seguridad.'
    );
  }
}

var ESTADO_DOCUMENTO_VIGENTE_ = 'Vigente';

function validarReglasNegocioDocumento_(datos, idExcluir) {
  if (datos.URL && !/^https?:\/\/.+/i.test(datos.URL)) {
    throw new Error('La URL del documento debe empezar por http:// o https://.');
  }
  if (datos.VERSION && !/^[vV]?\d+(\.\d+){0,3}$/.test(datos.VERSION)) {
    throw new Error('La versión debe tener un formato como 1, 1.0 o v1.2.3.');
  }
  if (datos.ESTADO === ESTADO_DOCUMENTO_VIGENTE_) {
    var vigentes = listarRegistros('DOCUMENTO', {
      ACTIVO: 'SÍ',
      ENTIDAD_TIPO: datos.ENTIDAD_TIPO,
      ENTIDAD_ID: datos.ENTIDAD_ID,
      TIPO_DOCUMENTO: datos.TIPO_DOCUMENTO,
      ESTADO: ESTADO_DOCUMENTO_VIGENTE_
    });
    var otroVigente = vigentes.some(function (d) { return !idExcluir || d.ID !== idExcluir; });
    if (otroVigente) {
      throw new Error('Ya existe un documento vigente de este tipo para este registro. Marque el anterior como obsoleto antes de aprobar uno nuevo.');
    }
  }
}

function validarReglasNegocioTarea_(datos) {
  if (datos.ESTADO === 'Bloqueada' && !datos.MOTIVO_BLOQUEO) {
    throw new Error('Debe indicar el motivo de bloqueo.');
  }
  if (datos.ESTADO === 'Pospuesta' && !datos.MOTIVO_POSPOSICION) {
    throw new Error('Debe indicar el motivo de posposición.');
  }
  if (datos.ESTADO === 'Cancelada' && !datos.MOTIVO_CANCELACION) {
    throw new Error('Debe indicar el motivo de cancelación.');
  }
  if ((datos.ESTADO === 'Terminada' || datos.ESTADO === 'Cancelada') && !datos.FECHA_FIN_REAL) {
    throw new Error('Debe indicar la fecha fin real al cerrar la tarea.');
  }
}

function validarReglasNegocioTareaResponsable_(datos, idExcluir) {
  if (datos.FECHA_INICIO_ASIGNACION && datos.FECHA_FIN_ASIGNACION) {
    var fechaInicioAsignacion = new Date(datos.FECHA_INICIO_ASIGNACION);
    var fechaFinAsignacion = new Date(datos.FECHA_FIN_ASIGNACION);

    if (
      isNaN(fechaInicioAsignacion.getTime()) ||
      isNaN(fechaFinAsignacion.getTime())
    ) {
      throw new Error('Las fechas de asignación deben ser válidas.');
    }

    if (
      fechaFinAsignacion.getTime() <
      fechaInicioAsignacion.getTime()
    ) {
      throw new Error(
        'La fecha fin de asignación no puede ser anterior a la fecha inicio.'
      );
    }
  }

  var pct = Number(datos.PORCENTAJE_DEDICACION) || 0;

  if (pct <= 0 || pct > 100) {
    throw new Error(
      'El porcentaje de dedicación debe estar entre 1 y 100.'
    );
  }

  var asignaciones = listarRegistros(
    'TAREA_RESPONSABLE',
    {
      ACTIVO: 'SÍ',
      ESTADO: 'Activa'
    }
  );

  var total = pct;

  asignaciones.forEach(function (a) {
    if (idExcluir && a.ID === idExcluir) {
      return;
    }

    if (
      a.PERSONA_EQUIPO_ID ===
      datos.PERSONA_EQUIPO_ID
    ) {
      total +=
        Number(a.PORCENTAJE_DEDICACION) || 0;
    }
  });

  if (total > 100) {
    throw new Error(
      'La dedicación total de esta persona superaría el 100% (' +
      total +
      '%).'
    );
  }
}

function validarReglasNegocioMaterial_(datos) {
  var stock = Number(datos.STOCK_ACTUAL);
  var minimo = Number(datos.STOCK_MINIMO);
  if (stock < 0 || minimo < 0) {
    throw new Error('El stock y el stock mínimo no pueden ser negativos.');
  }
}

function validarReglasNegocioTareaMaterial_(datos) {
  var prevista = Number(datos.CANTIDAD_PREVISTA) || 0;
  var consumida = Number(datos.CANTIDAD_CONSUMIDA) || 0;
  var desperdiciada = Number(datos.CANTIDAD_DESPERDICIADA) || 0;

  if (
    prevista < 0 ||
    consumida < 0 ||
    desperdiciada < 0
  ) {
    throw new Error(
      'Las cantidades prevista, consumida y desperdiciada no pueden ser negativas.'
    );
  }

  if (
    consumida + desperdiciada > prevista &&
    !String(datos.MOTIVO_DESVIACION || '').trim()
  ) {
    throw new Error(
      'Debe indicar el motivo de desviación cuando el consumo supera lo previsto.'
    );
  }
}



function normalizarValorFormulario_(campo, valor) {
  if (valor === undefined || valor === null || valor === '') {
    return valor === null || valor === undefined ? '' : valor;
  }

  if (campo.tipo === 'numero') {
    var numero = Number(String(valor).trim());

    if (!Number.isFinite(numero)) {
      throw new Error(
        campo.etiqueta + ' debe ser un número válido.'
      );
    }

    return numero;
  }

  if (campo.tipo !== 'fecha') {
    return valor;
  }

  if (
    Object.prototype.toString.call(valor) === '[object Date]' &&
    !isNaN(valor.getTime())
  ) {
    return valor;
  }

  var partes = String(valor)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!partes) {
    throw new Error(
      campo.etiqueta + ' debe tener el formato AAAA-MM-DD.'
    );
  }

  var anio = Number(partes[1]);
  var mes = Number(partes[2]);
  var dia = Number(partes[3]);
  var fecha = new Date(anio, mes - 1, dia);

  if (
    isNaN(fecha.getTime()) ||
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    throw new Error(
      campo.etiqueta + ' debe ser una fecha válida.'
    );
  }

  return fecha;
}

/*
 * `correlationId` (opcional, Fase L4 F-015): permite encadenar varias
 * llamadas a guardarFormulario bajo el mismo CORRELATION_ID de historial
 * -- usado por el flujo "guardar y vincular" de PRODUCTO+PROYECTO_PRODUCTO
 * (ver mostrarPasoVincularProyecto_ en FormularioGenerico.html). Si no se
 * pasa, insertarRegistroTransaccional/actualizarRegistroTransaccional
 * generan uno nuevo como siempre.
 */
/*
 * Bug real detectado al probar VINCULO Recurso->Documento: el buscador
 * de FK (L3.5) solo extrae el ID del texto escrito (extraerIdDeEtiqueta_
 * en el cliente), sin comprobar que sea uno de verdad -- si el usuario
 * escribe algo y guarda sin elegir ninguna opcion del desplegable, ese
 * texto se guarda tal cual como si fuera un ID valido (ocurrio con
 * VIN-0003, ENTIDAD_DESTINO_ID="D"). Afecta a cualquier campo fk/
 * fk_dependiente de cualquier entidad, no solo a VINCULO.
 *
 * Reutiliza el mismo resolver que ya usa el cliente para poblar las
 * opciones (listarRegistros para fk directo, mapa.resolver(...) para
 * fk_dependiente), asi la validacion nunca se desincroniza de lo que
 * el usuario realmente puede elegir.
 */
function validarClavesForaneasFormulario_(clave, datos, idExcluir) {
  var esquema = ESQUEMAS_FORMULARIO_MVP[clave];

  /*
   * Al editar, guardarFormulario reenvia TODOS los campos (no solo los
   * cambiados). Si un valor de FK no cambio respecto al ya guardado, no
   * se revalida -- evita bloquear la edicion de un registro antiguo
   * solo porque una referencia suya se desactivo despues (ACTIVO=NO),
   * algo ajeno a la edicion que se esta haciendo ahora.
   */
  var registroActual = idExcluir ? obtenerRegistroPorId(clave, idExcluir) : null;

  esquema.forEach(function (campo) {
    var valor = String(datos[campo.campo] || '').trim();

    if (!valor) return;

    if (
      registroActual &&
      String(registroActual[campo.campo] || '').trim() === valor
    ) {
      return;
    }

    var idsValidos;

    if (campo.tipo === 'fk') {
      idsValidos = listarRegistros(campo.entidadFk, { ACTIVO: 'SÍ' }).map(
        function (registro) { return String(registro.ID); }
      );
    } else if (campo.tipo === 'fk_dependiente') {
      var valorPadre = String(datos[campo.dependeDe] || '').trim();
      var mapa = MAPAS_DEPENDENCIA_MVP[campo.mapaEntidad];

      if (!mapa || !valorPadre) return;

      idsValidos = mapa.resolver(valorPadre).map(
        function (opcion) { return String(opcion.id); }
      );
    } else {
      return;
    }

    if (idsValidos.indexOf(valor) === -1) {
      throw new Error(
        'ERROR_VALIDACION: el valor "' + valor + '" de "' + campo.etiqueta +
          '" no corresponde a ningún registro válido.'
      );
    }
  });
}

function guardarFormulario(entidad, idRegistro, datosCrudos, correlationId) {
  var clave = String(entidad || '').trim().toUpperCase();
  var esquema = ESQUEMAS_FORMULARIO_MVP[clave];

  if (!Array.isArray(esquema)) {
    throw new Error(
      'No hay esquema de formulario para la entidad ' + entidad
    );
  }

  datosCrudos = datosCrudos || {};

  var datos = {};

  esquema.forEach(function (campo) {
    datos[campo.campo] = normalizarValorFormulario_(
      campo,
      datosCrudos[campo.campo]
    );
  });

  /*
   * Hallazgo #18 (auditoría piloto): campos como PORCENTAJE_AVANCE no
   * tienen sentido pedirlos al crear (un registro nuevo siempre empieza
   * en 0) -- se ocultan en el formulario (ocultarAlCrear, ver
   * FormularioGenerico.html) y aquí se completan con su valor por
   * defecto si llegan vacíos al crear.
   */
  if (!idRegistro) {
    esquema.forEach(function (campo) {
      if (
        campo.ocultarAlCrear &&
        campo.valorPorDefectoAlCrear !== undefined &&
        (datos[campo.campo] === '' || datos[campo.campo] === undefined)
      ) {
        datos[campo.campo] = campo.valorPorDefectoAlCrear;
      }
    });
  }

  var correlationIdFinal = correlationId || Utilities.getUuid();

  try {
    if (clave === 'PERSONA_EQUIPO') {
      validarReglasNegocioFormulario_(
        clave,
        datos,
        idRegistro
      );
    }

    validarClavesForaneasFormulario_(
      clave,
      datos,
      idRegistro
    );

    validarDuplicidadFormulario_(
      clave,
      datos,
      idRegistro
    );

    if (clave !== 'PERSONA_EQUIPO') {
      validarReglasNegocioFormulario_(
        clave,
        datos,
        idRegistro
      );
    }

    /*
     * PROYECTO_VINCULAR_ID (auditoría piloto, hallazgo #13): campo
     * virtual del formulario de PRODUCTO, no es una columna real de la
     * hoja -- se valida como FK arriba (validarClavesForaneasFormulario_)
     * pero se extrae antes de insertar/actualizar. Si tiene valor, crea
     * además el PROYECTO_PRODUCTO en el mismo guardado, sustituyendo el
     * paso posterior "¿Vincular ahora?" de F-015 por un campo normal.
     */
    var proyectoVincularId = null;

    if (clave === 'PRODUCTO') {
      proyectoVincularId = datos.PROYECTO_VINCULAR_ID || null;
      delete datos.PROYECTO_VINCULAR_ID;
    }

    var idFinal = idRegistro;

    if (idRegistro) {
      actualizarRegistroTransaccional(
        clave,
        idRegistro,
        datos,
        {
          origen: 'UI',
          correlationId: correlationIdFinal
        }
      );
    } else {
      var resultadoInsercion = insertarRegistroTransaccional(
        clave,
        datos,
        {
          origen: 'UI',
          correlationId: correlationIdFinal
        }
      );

      idFinal = resultadoInsercion.id;
    }

    if (clave === 'PRODUCTO' && proyectoVincularId) {
      insertarRegistroTransaccional(
        'PROYECTO_PRODUCTO',
        {
          PROYECTO_ID: proyectoVincularId,
          PRODUCTO_ID: idFinal,
          CANTIDAD_ASIGNADA: Number(datos.CANTIDAD_PREVISTA) || 1,
          PRIORIDAD: datos.PRIORIDAD,
          ESTADO: 'Activa'
        },
        {
          origen: 'UI',
          correlationId: correlationIdFinal
        }
      );
    }

    return {
      id: idFinal,
      correlationId: correlationIdFinal
    };
  } catch (errorRepositorio) {
    throw new Error(
      traducirErrorFuncional_(
        errorRepositorio.message,
        clave
      )
    );
  }
}


/*
 * Hallazgo #23 (auditoría piloto): el menú había crecido por orden de
 * aparición de cada fase (L1-L5), agrupado por tipo de entidad en dos
 * submenús separados ("Nuevo registro"/"Relaciones") que no reflejaban
 * como se usa el sistema de verdad. Reorganizado por contexto de uso;
 * "Nuevo X"/"Editar X" de la misma entidad quedan juntos en el mismo
 * grupo. Cambio puramente de organización del menú -- no toca lógica
 * de servidor ni datos.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Taller de Producción')
    .addSubMenu(
      ui.createMenu('🏗️ Jerarquía de producción')
        .addItem('Gestión de campaña (vista global)', 'abrirPanelCampana')
        .addItem('Nueva campaña', 'abrirFormularioCrearCampana')
        .addItem('Editar campaña', 'abrirEditarCampana')
        .addItem('Nuevo proyecto', 'abrirFormularioCrearProyecto')
        .addItem('Editar proyecto', 'abrirEditarProyecto')
        .addItem('Nuevo producto', 'abrirFormularioCrearProducto')
        .addItem('Editar producto', 'abrirEditarProducto')
        .addItem('Proyecto - Producto (nueva relación)', 'abrirFormularioCrearProyectoProducto')
        .addItem('Editar Proyecto-Producto', 'abrirEditarProyectoProducto')
        .addItem('Nuevo proceso', 'abrirFormularioCrearProceso')
        .addItem('Editar proceso', 'abrirEditarProceso')
        .addItem('Nueva tarea', 'abrirFormularioCrearTarea')
        .addItem('Editar tarea', 'abrirEditarTarea')
    )
    .addSubMenu(
      ui.createMenu('👥 Personas y recursos')
        .addItem('Ver personas y equipo (jerarquía)', 'abrirPanelPersonas')
        .addItem('Ficha de persona/equipo (buscar)', 'abrirFichaPersonaEquipoBuscar')
        .addItem('Nueva persona/equipo', 'abrirFormularioCrearPersonaEquipo')
        .addItem('Editar persona/equipo', 'abrirEditarPersonaEquipo')
        .addItem('Equipo - Miembro (nueva relación)', 'abrirFormularioCrearEquipoMiembro')
        .addItem('Editar Equipo-Miembro', 'abrirEditarEquipoMiembro')
        .addItem('Tarea - Responsable (asignar)', 'abrirFormularioCrearTareaResponsable')
        .addItem('Editar Tarea-Responsable', 'abrirEditarTareaResponsable')
        .addSeparator()
        .addItem('Ver espacios y recursos (jerarquía)', 'abrirPanelRecursos')
        .addItem('Nuevo recurso (herramienta/maquinaria/equipo/espacio)', 'abrirFormularioCrearRecurso')
        .addItem('Editar recurso', 'abrirEditarRecurso')
        .addItem('Tarea - Recurso (asignar)', 'abrirFormularioCrearTareaRecurso')
        .addItem('Editar Tarea-Recurso', 'abrirEditarTareaRecurso')
        .addSeparator()
        .addItem('Nuevo horario (franja semanal)', 'abrirFormularioCrearHorario')
        .addItem('Editar horario', 'abrirEditarHorario')
        .addSeparator()
        .addItem('Asignación (Campaña/Proyecto/Producto/Proceso/Decisión/Incidencia)', 'abrirFormularioCrearAsignacion')
        .addItem('Editar Asignación', 'abrirEditarAsignacion')
    )
    .addSubMenu(
      ui.createMenu('📦 Materiales y compras')
        .addItem('Nuevo material', 'abrirFormularioCrearMaterial')
        .addItem('Editar material', 'abrirEditarMaterial')
        .addItem('Producto - Material (nueva relación)', 'abrirFormularioCrearProductoMaterial')
        .addItem('Editar Producto-Material', 'abrirEditarProductoMaterial')
        .addItem('Tarea - Material (nueva relación)', 'abrirFormularioCrearTareaMaterial')
        .addItem('Editar Tarea-Material', 'abrirEditarTareaMaterial')
        .addItem('Nuevo proveedor', 'abrirFormularioCrearProveedor')
        .addItem('Editar proveedor', 'abrirEditarProveedor')
        .addItem('Proveedor - Material (nueva relación)', 'abrirFormularioCrearProveedorMaterial')
        .addItem('Editar Proveedor-Material', 'abrirEditarProveedorMaterial')
        .addItem('Nuevo pedido a proveedor', 'abrirFormularioCrearPedidoProveedor')
        .addItem('Editar pedido a proveedor', 'abrirEditarPedidoProveedor')
        .addItem('Pedido - Línea (nueva)', 'abrirFormularioCrearPedidoProveedorLinea')
        .addItem('Editar Pedido-Línea', 'abrirEditarPedidoProveedorLinea')
        .addItem('Nueva recepción de pedido', 'abrirFormularioCrearRecepcion')
        .addItem('Editar recepción de pedido', 'abrirEditarRecepcion')
        .addItem('Recepción - Línea (nueva)', 'abrirFormularioCrearRecepcionLinea')
        .addItem('Editar Recepción-Línea', 'abrirEditarRecepcionLinea')
        .addItem('Confirmar recepción de pedido', 'abrirConfirmarRecepcion')
        .addItem('Movimiento de material (nuevo)', 'abrirFormularioCrearMovimientoMaterial')
        .addItem('Editar Movimiento de material', 'abrirEditarMovimientoMaterial')
    )
    .addSubMenu(
      ui.createMenu('📋 Seguimiento y decisiones')
        .addItem('Nueva incidencia', 'abrirFormularioCrearIncidencia')
        .addItem('Editar incidencia', 'abrirEditarIncidencia')
        .addItem('Nueva decisión', 'abrirFormularioCrearDecision')
        .addItem('Editar decisión', 'abrirEditarDecision')
        .addItem('Nuevo documento', 'abrirFormularioCrearDocumento')
        .addItem('Editar documento', 'abrirEditarDocumento')
        .addItem('Relación / dependencia (grafo, nueva)', 'abrirFormularioCrearRelacion')
        .addItem('Editar Relación', 'abrirEditarRelacion')
        .addItem('Vínculo genérico (nuevo)', 'abrirFormularioCrearVinculo')
        .addItem('Editar Vínculo', 'abrirEditarVinculo')
        .addItem('Ejecución de tarea (nueva)', 'abrirFormularioCrearEjecucionTarea')
        .addItem('Editar Ejecución de tarea', 'abrirEditarEjecucionTarea')
        .addItem('Recalcular avance de proceso', 'abrirRecalcularAvanceProceso')
    )
    .addSubMenu(
      ui.createMenu('📊 Consulta y análisis')
        .addItem('Panel operativo', 'abrirPanelOperativo')
        .addItem('Informes', 'abrirInformes')
        .addItem('Gantt: plan vs. real', 'abrirGanttPlanReal')
        .addItem('Verificar integridad', 'abrirIntegridad')
        .addItem('Historial', 'abrirHistorialAdmin')
    )
    .addSubMenu(
      ui.createMenu('⚙️ Administración')
        .addItem('Catálogos', 'abrirCatalogosAdmin')
        .addItem('Personas y equipos (hoja)', 'abrirPersonasEquiposAdmin')
        .addItem('Proveedores (hoja)', 'abrirProveedoresAdmin')
        .addItem('Protección de hojas', 'abrirProteccionHojas')
        .addItem('Importación masiva de campaña (STG_*)', 'abrirImportacionMasiva')
        .addItem('Mantenimiento (revertir cambio)', 'abrirRevertirUltimoCambio')
    )
    .addToUi();
}

/*
 * prefill (opcional): valores iniciales para campos del formulario en
 * modo creacion -- hoy solo lo usa el encadenado Campaña->Proyecto
 * (abrirFormularioCrearProyectoConCampana), para no obligar a buscar de
 * nuevo la campaña que se acaba de crear en el buscador de CAMPANA_ID.
 */
function abrirFormularioCrear_(entidad, tituloVentana, prefill) {
  var template = HtmlService.createTemplateFromFile('FormularioGenerico');
  template.entidad = entidad;
  template.idRegistro = '';
  template.titulo = tituloVentana;
  template.prefill = JSON.stringify(prefill || {});
  template.retorno = JSON.stringify(null);
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
  var etiquetasEntidad = { DECISION: 'decisión', INCIDENCIA: 'incidencia', DOCUMENTO: 'documento' };
  var tituloVentana = 'Editar ' + (etiquetasEntidad[clave] || clave.toLowerCase());
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

function obtenerOpcionesEntidadParaSelector(entidad) {
  var clave = String(entidad || '').trim().toUpperCase();

  if (!ENTIDADES_MVP[clave]) {
    throw new Error('Entidad no configurada: ' + entidad);
  }

  return listarRegistros(clave, { ACTIVO: 'SÍ' }).map(function (registro) {
    return {
      id: registro.ID,
      etiqueta: registro.ID + ' - ' + (registro.NOMBRE || registro.TITULO || '')
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
