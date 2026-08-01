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
  'Incidencia': 'INCIDENCIA'
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
  })
});

function obtenerOpcionesDependientes(mapaEntidad, valorPadre) {
  var mapa = MAPAS_DEPENDENCIA_MVP[mapaEntidad];
  if (!mapa) throw new Error('No existe el mapa de dependencia ' + mapaEntidad);
  return mapa.resolver(valorPadre);
}

var CLAVES_DUPLICADO_MVP = Object.freeze({
  PROYECTO_PRODUCTO: ['PROYECTO_ID', 'PRODUCTO_ID'],
  TAREA_RESPONSABLE: ['TAREA_ID', 'PERSONA_EQUIPO_ID'],
  PRODUCTO_MATERIAL: ['PRODUCTO_ID', 'MATERIAL_ID'],
  TAREA_MATERIAL: ['TAREA_ID', 'MATERIAL_ID'],
  DOCUMENTO: ['ENTIDAD_TIPO', 'ENTIDAD_ID', 'TIPO_DOCUMENTO', 'VERSION'],
  ASIGNACION: ['ENTIDAD_TIPO', 'ENTIDAD_ID', 'PERSONA_EQUIPO_ID', 'ROL_ASIGNADO'],
  RELACION: ['ENTIDAD_TIPO', 'ENTIDAD_ORIGEN_ID', 'ENTIDAD_DESTINO_ID', 'TIPO_RELACION'],
  VINCULO: ['ENTIDAD_ORIGEN_TIPO', 'ENTIDAD_ORIGEN_ID', 'ENTIDAD_DESTINO_TIPO', 'ENTIDAD_DESTINO_ID', 'TIPO_VINCULO']
});


var ESQUEMAS_FORMULARIO_MVP = Object.freeze({

CAMPANA: [
  { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
  { campo: 'DESCRIPCION', etiqueta: 'Descripción', tipo: 'texto' },
  { campo: 'FECHA_INICIO_PLAN', etiqueta: 'Fecha inicio plan', tipo: 'fecha', requerido: true },
  { campo: 'FECHA_FIN_PLAN', etiqueta: 'Fecha fin plan', tipo: 'fecha', requerido: true },
  { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_CAMPANA', requerido: true },
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
    requerido: true
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
    tipo: 'fecha'
  },
  {
    campo: 'FECHA_FIN_REAL',
    etiqueta: 'Fecha fin real',
    tipo: 'fecha'
  },
  {
    campo: 'ESTADO',
    etiqueta: 'Estado',
    tipo: 'catalogo',
    catalogo: 'CFG_ESTADO_PROYECTO',
    requerido: true
  },
  {
    campo: 'MOTIVO_REPLANIFICACION',
    etiqueta: 'Motivo de replanificación',
    tipo: 'texto'
  },
  {
    campo: 'ACTIVO',
    etiqueta: 'Activo',
    tipo: 'catalogo',
    opciones: ['SÍ', 'NO'],
    requerido: true
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
    campo: 'CRITERIOS_ACEPTACION',
    etiqueta: 'Criterios de aceptación',
    tipo: 'textarea'
  },
  {
    campo: 'DEFINITION_OF_DONE',
    etiqueta: 'Definition of Done',
    tipo: 'textarea'
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
      campo: 'CODIGO',
      etiqueta: 'Código',
      tipo: 'texto',
      requerido: true,
      sugerenciaCodigo: { camposContexto: ['ORIGEN', 'NOMBRE', 'PRIORIDAD'] }
    },
    { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { campo: 'DESCRIPCION', etiqueta: 'Descripción', tipo: 'texto' },
    { campo: 'VERSION', etiqueta: 'Versión', tipo: 'texto' },
    { campo: 'ORIGEN', etiqueta: 'Origen', tipo: 'catalogo', catalogo: 'CFG_ORIGEN_PRODUCTO', requerido: true },
    { campo: 'UNIDAD', etiqueta: 'Unidad', tipo: 'catalogo', catalogo: 'CFG_UNIDAD', requerido: true },
    { campo: 'CANTIDAD_PREVISTA', etiqueta: 'Cantidad prevista', tipo: 'numero', requerido: true },
    { campo: 'FECHA_REQUERIDA', etiqueta: 'Fecha requerida', tipo: 'fecha' },
    { campo: 'PRIORIDAD', etiqueta: 'Prioridad', tipo: 'catalogo', catalogo: 'CFG_PRIORIDAD', requerido: true },
    { campo: 'RESPONSABLE_ID', etiqueta: 'Responsable', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_PRODUCTO', requerido: true },
    { campo: 'OBJETIVO', etiqueta: 'Objetivo', tipo: 'texto' },
    { campo: 'RESULTADO_ESPERADO', etiqueta: 'Resultado esperado', tipo: 'texto' },
    { campo: 'CRITERIOS_ACEPTACION', etiqueta: 'Criterios de aceptación', tipo: 'textarea' },
    { campo: 'DEFINITION_OF_DONE', etiqueta: 'Definition of Done', tipo: 'textarea' },
    { campo: 'VALIDADOR_ID', etiqueta: 'Validador', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO', excluirEstados: ['Inactivo'] },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  PROCESO: [
    { campo: 'PRODUCTO_ID', etiqueta: 'Producto', tipo: 'fk', entidadFk: 'PRODUCTO', requerido: true },
    { campo: 'PROYECTO_PRODUCTO_ID', etiqueta: 'Relación proyecto-producto (opcional)', tipo: 'fk', entidadFk: 'PROYECTO_PRODUCTO' },
    { campo: 'MODO_USO', etiqueta: 'Modo de uso', tipo: 'catalogo', catalogo: 'CFG_MODO_USO' },
    { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { campo: 'DESCRIPCION', etiqueta: 'Descripción', tipo: 'texto' },
    {
      campo: 'ORDEN_SECUENCIA',
      etiqueta: 'Orden de secuencia',
      tipo: 'numero',
      requerido: true,
      sugerenciaSecuencia: {
        camposContexto: ['PROYECTO_PRODUCTO_ID', 'PRODUCTO_ID'],
        campoPredecesor: 'PROCESO_PREDECESOR_ID'
      }
    },
    { campo: 'PROCESO_PREDECESOR_ID', etiqueta: 'Proceso predecesor', tipo: 'fk', entidadFk: 'PROCESO' },
    { campo: 'DURACION_PREVISTA_DIAS', etiqueta: 'Duración prevista (días)', tipo: 'numero', requerido: true },
    { campo: 'DURACION_REAL_DIAS', etiqueta: 'Duración real (días)', tipo: 'numero', visibleSi: { campo: 'ESTADO', valores: ['Completado', 'Cancelado'] } },
    { campo: 'RESPONSABLE_ID', etiqueta: 'Responsable', tipo: 'fk', entidadFk: 'PERSONA_EQUIPO' },
    { campo: 'FECHA_INICIO_PLAN', etiqueta: 'Fecha inicio plan', tipo: 'fecha' },
    { campo: 'FECHA_FIN_PLAN', etiqueta: 'Fecha fin plan', tipo: 'fecha' },
    { campo: 'FECHA_INICIO_REAL', etiqueta: 'Fecha inicio real', tipo: 'fecha', visibleSi: { campo: 'ESTADO', valores: ['En proceso', 'Completado', 'Cancelado'] } },
    { campo: 'FECHA_FIN_REAL', etiqueta: 'Fecha fin real', tipo: 'fecha', visibleSi: { campo: 'ESTADO', valores: ['Completado', 'Cancelado'] } },
    { campo: 'PORCENTAJE_AVANCE', etiqueta: 'Porcentaje de avance', tipo: 'numero', requerido: true },
    { campo: 'METODO_CALCULO_AVANCE', etiqueta: 'Método de cálculo del avance', tipo: 'catalogo', catalogo: 'CFG_METODO_CALCULO_AVANCE' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_PROCESO', requerido: true },
    { campo: 'OBJETIVO', etiqueta: 'Objetivo', tipo: 'texto' },
    { campo: 'RESULTADO_ESPERADO', etiqueta: 'Resultado esperado', tipo: 'texto' },
    { campo: 'CRITERIOS_ACEPTACION', etiqueta: 'Criterios de aceptación', tipo: 'textarea' },
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
      sugerenciaSecuencia: {
        camposContexto: ['PROCESO_ID'],
        campoPredecesor: 'TAREA_PREDECESORA_ID'
      }
    },
    { campo: 'TAREA_PREDECESORA_ID', etiqueta: 'Tarea predecesora', tipo: 'fk', entidadFk: 'TAREA' },
    { campo: 'DURACION_PREVISTA_DIAS', etiqueta: 'Duración prevista (días)', tipo: 'numero', requerido: true },
    { campo: 'DURACION_REAL_DIAS', etiqueta: 'Duración real (días)', tipo: 'numero', visibleSi: { campo: 'ESTADO', valores: ['Terminada', 'Cancelada'] } },
    { campo: 'FECHA_INICIO_PLAN', etiqueta: 'Fecha inicio plan', tipo: 'fecha' },
    { campo: 'FECHA_FIN_PLAN', etiqueta: 'Fecha fin plan', tipo: 'fecha' },
    { campo: 'FECHA_INICIO_REAL', etiqueta: 'Fecha inicio real', tipo: 'fecha', visibleSi: { campo: 'ESTADO', valores: ['En proceso', 'Terminada', 'Cancelada'] } },
    { campo: 'FECHA_FIN_REAL', etiqueta: 'Fecha fin real', tipo: 'fecha', visibleSi: { campo: 'ESTADO', valores: ['Terminada', 'Cancelada'] } },
    { campo: 'PORCENTAJE_AVANCE', etiqueta: 'Porcentaje de avance', tipo: 'numero', requerido: true },
    { campo: 'METODO_CALCULO_AVANCE', etiqueta: 'Método de cálculo del avance', tipo: 'catalogo', catalogo: 'CFG_METODO_CALCULO_AVANCE' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_TAREA', requerido: true },
    { campo: 'MOTIVO_BLOQUEO', etiqueta: 'Motivo de bloqueo', tipo: 'texto', visibleSi: { campo: 'ESTADO', valores: ['Bloqueada'] } },
    { campo: 'MOTIVO_POSPOSICION', etiqueta: 'Motivo de posposición', tipo: 'texto', visibleSi: { campo: 'ESTADO', valores: ['Pospuesta'] } },
    { campo: 'MOTIVO_CANCELACION', etiqueta: 'Motivo de cancelación', tipo: 'texto', visibleSi: { campo: 'ESTADO', valores: ['Cancelada'] } },
    { campo: 'OBJETIVO', etiqueta: 'Objetivo', tipo: 'texto' },
    { campo: 'RESULTADO_ESPERADO', etiqueta: 'Resultado esperado', tipo: 'texto' },
    { campo: 'CRITERIOS_ACEPTACION', etiqueta: 'Criterios de aceptación', tipo: 'textarea' },
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
    { campo: 'PORCENTAJE_DEDICACION', etiqueta: 'Porcentaje de dedicación', tipo: 'numero', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_ASIGNACION', requerido: true },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  PERSONA_EQUIPO: [
    { campo: 'TIPO', etiqueta: 'Tipo', tipo: 'catalogo', catalogo: 'CFG_TIPO_RECURSO', requerido: true },
    { campo: 'NOMBRE', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { campo: 'ROL', etiqueta: 'Rol', tipo: 'texto', requerido: true },
    { campo: 'CAPACIDAD_SEMANAL_DIAS', etiqueta: 'Capacidad semanal (días)', tipo: 'numero', requerido: true },
    { campo: 'DISPONIBILIDAD', etiqueta: 'Disponibilidad', tipo: 'catalogo', catalogo: 'CFG_DISPONIBILIDAD', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RECURSO', requerido: true },
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
    { campo: 'STOCK_ACTUAL', etiqueta: 'Stock actual', tipo: 'numero', requerido: true },
    { campo: 'STOCK_MINIMO', etiqueta: 'Stock mínimo', tipo: 'numero', requerido: true },
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
    { campo: 'PLAZO_REPOSICION_DIAS', etiqueta: 'Plazo de reposición (días)', tipo: 'numero' },
    { campo: 'UBICACION', etiqueta: 'Ubicación', tipo: 'texto' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_MATERIAL', requerido: true },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  PRODUCTO_MATERIAL: [
    { campo: 'PRODUCTO_ID', etiqueta: 'Producto', tipo: 'fk', entidadFk: 'PRODUCTO', requerido: true },
    { campo: 'MATERIAL_ID', etiqueta: 'Material', tipo: 'fk', entidadFk: 'MATERIAL', requerido: true },
    { campo: 'CANTIDAD_PREVISTA', etiqueta: 'Cantidad prevista', tipo: 'numero', requerido: true },
    { campo: 'UNIDAD', etiqueta: 'Unidad', tipo: 'catalogo', catalogo: 'CFG_UNIDAD', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],

  TAREA_MATERIAL: [
    { campo: 'TAREA_ID', etiqueta: 'Tarea', tipo: 'fk', entidadFk: 'TAREA', requerido: true },
    { campo: 'MATERIAL_ID', etiqueta: 'Material', tipo: 'fk', entidadFk: 'MATERIAL', requerido: true },
    { campo: 'CANTIDAD_PREVISTA', etiqueta: 'Cantidad prevista', tipo: 'numero', requerido: true },
    { campo: 'CANTIDAD_CONSUMIDA', etiqueta: 'Cantidad consumida', tipo: 'numero' },
    { campo: 'CANTIDAD_DESPERDICIADA', etiqueta: 'Cantidad desperdiciada', tipo: 'numero' },
    { campo: 'UNIDAD', etiqueta: 'Unidad', tipo: 'catalogo', catalogo: 'CFG_UNIDAD', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true },
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
    { campo: 'PLAZO_ENTREGA_DIAS', etiqueta: 'Plazo de entrega (días)', tipo: 'numero' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_PROVEEDOR', requerido: true },
    { campo: 'OBSERVACIONES', etiqueta: 'Observaciones', tipo: 'texto' }
  ],
  PROYECTO_PRODUCTO: [
    { campo: 'PROYECTO_ID', etiqueta: 'Proyecto', tipo: 'fk', entidadFk: 'PROYECTO', requerido: true },
    { campo: 'PRODUCTO_ID', etiqueta: 'Producto', tipo: 'fk', entidadFk: 'PRODUCTO', requerido: true },
    { campo: 'CANTIDAD_ASIGNADA', etiqueta: 'Cantidad asignada', tipo: 'numero' },
    { campo: 'PRIORIDAD', etiqueta: 'Prioridad', tipo: 'catalogo', catalogo: 'CFG_PRIORIDAD' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true },
    { campo: 'MODO_USO', etiqueta: 'Modo de uso', tipo: 'catalogo', catalogo: 'CFG_MODO_USO' }
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
  { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_DECISION', requerido: true },
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
    requerido: true
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
    requerido: true
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
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_DOCUMENTO', requerido: true },
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
    { campo: 'PORCENTAJE_DEDICACION', etiqueta: 'Porcentaje de dedicación', tipo: 'numero', requerido: true },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_ASIGNACION', requerido: true },
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
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true },
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
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true },
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
    { campo: 'CANTIDAD', etiqueta: 'Cantidad', tipo: 'numero', requerido: true },
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
    { campo: 'DURACION_REAL_DIAS', etiqueta: 'Duración real (días)', tipo: 'numero' },
    { campo: 'ESTADO', etiqueta: 'Estado', tipo: 'catalogo', catalogo: 'CFG_ESTADO_RELACION', requerido: true },
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

      copia.opciones = registros.map(
        function (registro) {
          return {
            id: registro.ID,
            etiqueta:
              registro.ID +
              ' - ' +
              (
                registro.NOMBRE ||
                registro.TITULO ||
                ''
              )
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
  if (clave === 'TAREA') return validarReglasNegocioTarea_(datos);
  if (clave === 'TAREA_RESPONSABLE') return validarReglasNegocioTareaResponsable_(datos, idExcluir);
  if (clave === 'MATERIAL') return validarReglasNegocioMaterial_(datos);
  if (clave === 'TAREA_MATERIAL') return validarReglasNegocioTareaMaterial_(datos);
  if (clave === 'DECISION') return validarReglasNegocioDecision_(datos, idExcluir);
  if (clave === 'INCIDENCIA') return validarReglasNegocioIncidencia_(datos);
  if (clave === 'DOCUMENTO') return validarReglasNegocioDocumento_(datos, idExcluir);
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

  var correlationIdFinal = correlationId || Utilities.getUuid();

  try {
    validarDuplicidadFormulario_(
      clave,
      datos,
      idRegistro
    );

    validarReglasNegocioFormulario_(
      clave,
      datos,
      idRegistro
    );

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

      return {
        id: idRegistro,
        correlationId: correlationIdFinal
      };
    }

    var resultadoInsercion = insertarRegistroTransaccional(
      clave,
      datos,
      {
        origen: 'UI',
        correlationId: correlationIdFinal
      }
    );

    return {
      id: resultadoInsercion.id,
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


function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Taller de Producción')
    .addSubMenu(
      ui.createMenu('Nuevo registro')
        .addItem('Campaña', 'abrirFormularioCrearCampana')
        .addItem('Proyecto', 'abrirFormularioCrearProyecto')
        .addItem('Producto', 'abrirFormularioCrearProducto')
        .addItem('Proceso', 'abrirFormularioCrearProceso')
        .addItem('Tarea', 'abrirFormularioCrearTarea')
        .addItem('Material', 'abrirFormularioCrearMaterial')
        .addItem('Persona/Equipo', 'abrirFormularioCrearPersonaEquipo')
        .addItem('Proveedor', 'abrirFormularioCrearProveedor')
        .addItem('Decisión', 'abrirFormularioCrearDecision')
        .addItem('Incidencia', 'abrirFormularioCrearIncidencia')
        .addItem('Documento', 'abrirFormularioCrearDocumento')
    )
    .addSubMenu(
      ui.createMenu('Editar registro')
        .addItem('Campaña', 'abrirEditarCampana')
        .addItem('Proyecto', 'abrirEditarProyecto')
        .addItem('Producto', 'abrirEditarProducto')
        .addItem('Proceso', 'abrirEditarProceso')
        .addItem('Tarea', 'abrirEditarTarea')
        .addItem('Material', 'abrirEditarMaterial')
        .addItem('Persona/Equipo', 'abrirEditarPersonaEquipo')
        .addItem('Proveedor', 'abrirEditarProveedor')
        .addItem('Decisión', 'abrirEditarDecision')
        .addItem('Incidencia', 'abrirEditarIncidencia')
        .addItem('Documento', 'abrirEditarDocumento')
        .addItem('Proyecto-Producto', 'abrirEditarProyectoProducto')
        .addItem('Tarea-Responsable', 'abrirEditarTareaResponsable')
        .addItem('Producto-Material', 'abrirEditarProductoMaterial')
        .addItem('Tarea-Material', 'abrirEditarTareaMaterial')
        .addItem('Asignación', 'abrirEditarAsignacion')
        .addItem('Relación (grafo de dependencias)', 'abrirEditarRelacion')
        .addItem('Vínculo (genérico)', 'abrirEditarVinculo')
        .addItem('Movimiento de material', 'abrirEditarMovimientoMaterial')
        .addItem('Ejecución de tarea', 'abrirEditarEjecucionTarea')
    )
    .addSubMenu(
      ui.createMenu('Relaciones')
        .addItem('Proyecto - Producto', 'abrirFormularioCrearProyectoProducto')
        .addItem('Tarea - Responsable', 'abrirFormularioCrearTareaResponsable')
        .addItem('Producto - Material', 'abrirFormularioCrearProductoMaterial')
        .addItem('Tarea - Material', 'abrirFormularioCrearTareaMaterial')
        .addItem('Asignación (Campaña/Proyecto/Producto/Proceso/Decisión/Incidencia)', 'abrirFormularioCrearAsignacion')
        .addItem('Relación / dependencia (grafo)', 'abrirFormularioCrearRelacion')
        .addItem('Vínculo genérico (cualquier entidad a cualquier entidad)', 'abrirFormularioCrearVinculo')
        .addItem('Movimiento de material', 'abrirFormularioCrearMovimientoMaterial')
        .addItem('Ejecución de tarea', 'abrirFormularioCrearEjecucionTarea')
    )
    .addItem('Panel operativo', 'abrirPanelOperativo')
    .addItem('Informes', 'abrirInformes')
    .addItem('Verificar integridad', 'abrirIntegridad')
    .addSubMenu(
      ui.createMenu('Administración')
        .addItem('Catálogos', 'abrirCatalogosAdmin')
        .addItem('Personas y equipos', 'abrirPersonasEquiposAdmin')
        .addItem('Proveedores', 'abrirProveedoresAdmin')
        .addItem('Protección de hojas', 'abrirProteccionHojas')
        .addItem('Integridad', 'abrirIntegridad')
        .addItem('Historial', 'abrirHistorialAdmin')
        .addItem('Mantenimiento (revertir cambio)', 'abrirRevertirUltimoCambio')
        .addItem('Recalcular avance de proceso', 'abrirRecalcularAvanceProceso')
    )
    .addToUi();
}

function abrirFormularioCrear_(entidad, tituloVentana) {
  var template = HtmlService.createTemplateFromFile('FormularioGenerico');
  template.entidad = entidad;
  template.idRegistro = '';
  template.titulo = tituloVentana;
  var html = template.evaluate().setWidth(420).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html, tituloVentana);
}

function abrirFormularioEditarPorId(entidad, idRegistro) {
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
  var html = template.evaluate().setWidth(420).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html, tituloVentana);
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
function abrirEditarRegistroPorEntidad_(entidad, etiqueta) {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt('Editar ' + etiqueta, 'ID del registro a editar:', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var id = resp.getResponseText().trim();
  if (!id) return;
  var registro = obtenerRegistroPorId(entidad, id);
  if (!registro) {
    ui.alert('No encontrado', 'No existe ningun registro de ' + etiqueta.toLowerCase() + ' con el ID "' + id + '".', ui.ButtonSet.OK);
    return;
  }
  abrirFormularioEditarPorId(entidad, id);
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
function abrirEditarMovimientoMaterial() { abrirEditarRegistroPorEntidad_('MOVIMIENTO_MATERIAL', 'Movimiento de material'); }
function abrirEditarEjecucionTarea() { abrirEditarRegistroPorEntidad_('EJECUCION_TAREA', 'Ejecución de tarea'); }

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
function abrirFormularioCrearMovimientoMaterial() { abrirFormularioCrear_('MOVIMIENTO_MATERIAL', 'Nuevo movimiento de material'); }
function abrirFormularioCrearEjecucionTarea() { abrirFormularioCrear_('EJECUCION_TAREA', 'Nueva ejecución de tarea'); }

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
function abrirCatalogosAdmin() { abrirHojaAdmin_('90_CONFIGURACION'); }
function abrirPersonasEquiposAdmin() { abrirHojaAdmin_('11_PERSONAS_EQUIPOS'); }
function abrirProveedoresAdmin() { abrirHojaAdmin_('15_PROVEEDORES'); }
function abrirHistorialAdmin() { abrirHojaAdmin_('91_HISTORIAL'); }

function abrirFormularioCrearMaterial() { abrirFormularioCrear_('MATERIAL', 'Nuevo material'); }
function abrirFormularioCrearPersonaEquipo() { abrirFormularioCrear_('PERSONA_EQUIPO', 'Nueva persona/equipo'); }


