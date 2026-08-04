/**
 * Prueba reactiva de CosteService.js (ver conversación -- "antes de que
 * más gente empiece a confiar en esos números para justificar
 * subvenciones de verdad"). A diferencia de pruebaLecturaBatchCoincideConListarRegistros
 * (que compara contra un camino ya probado), aquí no hay un camino
 * alternativo de referencia -- se construye un escenario real aislado
 * con cifras elegidas a mano, se calcula el resultado esperado por
 * aritmética simple, y se compara contra calcularCosteTotalPorCategoria_.
 *
 * Cubre las 3 fuentes de coste real y su comparación con presupuesto:
 *  - Materiales: PRODUCTO_MATERIAL.CANTIDAD_PREVISTA (3) x precio del
 *    proveedor preferente (10€) = 30€.
 *  - Recursos: RECURSO en modo Amortización con COSTE_ADQUISICION=3650€
 *    y VIDA_UTIL_ANOS=10 -> coste diario = 3650/(10*365) = 1€/día
 *    exacto (elegido así a propósito, evita errores de redondeo en la
 *    aserción); TAREA_RECURSO de 5 días de uso -> 5€.
 *  - Actividad: un COSTE de 20€.
 *  - Presupuesto: 25€ previstos en Materiales -> desviación +5€.
 *
 * Todo el escenario se crea bajo nombres reconocibles
 * ("PRUEBA_COSTE_SERVICE...") y se desactiva en el finally, pase o
 * falle la prueba -- no debe quedar dato de prueba residual mezclado
 * con datos reales (ver conversación sobre contaminación de datos).
 */
function pruebaCosteServiceCalculaCorrectamente() {
  console.log('ENGREMIAT_PACKAGE_BEGIN package=PRUEBA_COSTE_SERVICE');

  var creados = {};
  var opciones = { origen: 'TEST' };
  // Sufijo unico (ver conversacion -- CODIGO debe ser unico incluso
  // entre registros ya desactivados de ejecuciones anteriores).
  var sufijo = String(Date.now()).slice(-6);

  try {
    var campana = insertarRegistroTransaccional('CAMPANA', {
      NOMBRE: 'PRUEBA_COSTE_SERVICE Campaña',
      FECHA_INICIO_PLAN: new Date('2030-01-01'),
      FECHA_FIN_PLAN: new Date('2030-01-31'),
      ESTADO: 'Borrador'
    }, opciones);
    creados.CAMPANA = campana.id;

    var proyecto = insertarRegistroTransaccional('PROYECTO', {
      CAMPANA_ID: campana.id,
      NOMBRE: 'PRUEBA_COSTE_SERVICE Proyecto',
      TIPO_PROYECTO: 'Prototipo / I+D',
      PRIORIDAD: 'Media',
      ESTADO: 'Borrador'
    }, opciones);
    creados.PROYECTO = proyecto.id;

    var producto = insertarRegistroTransaccional('PRODUCTO', {
      CODIGO: 'PRUEBA-COSTE-' + sufijo,
      NOMBRE: 'PRUEBA_COSTE_SERVICE Producto',
      ORIGEN: 'Producción propia',
      UNIDAD: 'Unidad',
      ESTADO: 'Borrador'
    }, opciones);
    creados.PRODUCTO = producto.id;

    var proyectoProducto = insertarRegistroTransaccional('PROYECTO_PRODUCTO', {
      PROYECTO_ID: proyecto.id,
      PRODUCTO_ID: producto.id,
      CANTIDAD_ASIGNADA: 1,
      PRIORIDAD: 'Media',
      ESTADO: 'Activa'
    }, opciones);
    creados.PROYECTO_PRODUCTO = proyectoProducto.id;

    var proceso = insertarRegistroTransaccional('PROCESO', {
      PRODUCTO_ID: producto.id,
      NOMBRE: 'PRUEBA_COSTE_SERVICE Proceso',
      ORDEN_SECUENCIA: 1,
      DURACION_PREVISTA_DIAS: 1,
      PORCENTAJE_AVANCE: 0,
      ESTADO: 'Pendiente'
    }, opciones);
    creados.PROCESO = proceso.id;

    var tarea = insertarRegistroTransaccional('TAREA', {
      PROCESO_ID: proceso.id,
      NOMBRE: 'PRUEBA_COSTE_SERVICE Tarea',
      ORDEN_SECUENCIA: 1,
      DURACION_PREVISTA_DIAS: 1,
      PORCENTAJE_AVANCE: 0,
      ESTADO: 'Pendiente'
    }, opciones);
    creados.TAREA = tarea.id;

    var material = insertarRegistroTransaccional('MATERIAL', {
      CODIGO: 'PRUEBA-COSTE-MAT-' + sufijo,
      NOMBRE: 'PRUEBA_COSTE_SERVICE Material',
      CATEGORIA: 'Otro',
      UNIDAD: 'Unidad',
      ESTADO: 'Disponible'
    }, opciones);
    creados.MATERIAL = material.id;

    var proveedor = insertarRegistroTransaccional('PROVEEDOR', {
      CODIGO: 'PRUEBA-COSTE-PRV-' + sufijo,
      NOMBRE: 'PRUEBA_COSTE_SERVICE Proveedor',
      ESTADO: 'Activo'
    }, opciones);
    creados.PROVEEDOR = proveedor.id;

    var proveedorMaterial = insertarRegistroTransaccional('PROVEEDOR_MATERIAL', {
      PROVEEDOR_ID: proveedor.id,
      MATERIAL_ID: material.id,
      PRECIO_UNITARIO: 10,
      PLAZO_ENTREGA_DIAS: 5,
      ES_PREFERENTE: 'SÍ',
      ESTADO: 'Activa'
    }, opciones);
    creados.PROVEEDOR_MATERIAL = proveedorMaterial.id;

    var productoMaterial = insertarRegistroTransaccional('PRODUCTO_MATERIAL', {
      PRODUCTO_ID: producto.id,
      MATERIAL_ID: material.id,
      CANTIDAD_PREVISTA: 3,
      UNIDAD: 'Unidad',
      ESTADO: 'Activa'
    }, opciones);
    creados.PRODUCTO_MATERIAL = productoMaterial.id;

    var recurso = insertarRegistroTransaccional('RECURSO', {
      CODIGO: 'PRUEBA-COSTE-REC-' + sufijo,
      NOMBRE: 'PRUEBA_COSTE_SERVICE Recurso',
      CLASE_RECURSO: 'Maquinaria',
      ESTADO: 'Disponible',
      MODO_COSTE: 'Amortización',
      COSTE_ADQUISICION: 3650,
      VIDA_UTIL_ANOS: 10
    }, opciones);
    creados.RECURSO = recurso.id;

    var tareaRecurso = insertarRegistroTransaccional('TAREA_RECURSO', {
      TAREA_ID: tarea.id,
      RECURSO_ID: recurso.id,
      TIPO_USO: 'Utiliza',
      FECHA_INICIO: new Date('2030-01-01'),
      FECHA_FIN: new Date('2030-01-05'),
      ESTADO: 'Activa'
    }, opciones);
    creados.TAREA_RECURSO = tareaRecurso.id;

    var coste = insertarRegistroTransaccional('COSTE', {
      ENTIDAD_TIPO: 'Producto',
      ENTIDAD_ID: producto.id,
      CATEGORIA: 'Actividad',
      CONCEPTO: 'PRUEBA_COSTE_SERVICE Transporte',
      IMPORTE: 20,
      ESTADO: 'Previsto'
    }, opciones);
    creados.COSTE = coste.id;

    var presupuesto = insertarRegistroTransaccional('PRESUPUESTO', {
      ENTIDAD_TIPO: 'Producto',
      ENTIDAD_ID: producto.id,
      CATEGORIA: 'Materiales',
      IMPORTE_PREVISTO: 25
    }, opciones);
    creados.PRESUPUESTO = presupuesto.id;

    var resultado = calcularCosteTotalPorCategoria_('Producto', producto.id);

    var porCategoria = {};
    resultado.categorias.forEach(function (c) { porCategoria[c.categoria] = c; });

    var errores = [];
    function verificar(descripcion, obtenido, esperado) {
      if (obtenido !== esperado) {
        errores.push(descripcion + ': esperado=' + esperado + ' obtenido=' + obtenido);
      }
    }

    verificar('Materiales.real', porCategoria.Materiales.real, 30);
    verificar('Materiales.previsto', porCategoria.Materiales.previsto, 25);
    verificar('Materiales.desviacion', porCategoria.Materiales.desviacion, 5);
    verificar('Recursos.real', porCategoria.Recursos.real, 5);
    verificar('Actividad.real', porCategoria.Actividad.real, 20);
    verificar('Otros.real', porCategoria.Otros.real, 0);
    verificar('totalReal', resultado.totalReal, 55);
    verificar('totalPrevisto', resultado.totalPrevisto, 25);
    verificar('desviacionTotal', resultado.desviacionTotal, 30);
    verificar('materialesSinPrecioReferencia.length', resultado.materialesSinPrecioReferencia.length, 0);
    verificar('recursosDetalle.length', resultado.recursosDetalle.length, 1);
    if (resultado.recursosDetalle.length === 1) {
      verificar('recursosDetalle[0].diasDeUso', resultado.recursosDetalle[0].diasDeUso, 5);
      verificar('recursosDetalle[0].coste', resultado.recursosDetalle[0].coste, 5);
    }

    if (errores.length > 0) {
      console.error('ERR diferencias=' + JSON.stringify(errores));
      console.log('ENGREMIAT_PACKAGE_END package=PRUEBA_COSTE_SERVICE result=ERR');
      throw new Error('PRUEBA_COSTE_SERVICE_ERROR: ' + errores.length + ' diferencias, primera=' + errores[0]);
    }

    console.log('OK coste_materiales=30 coste_recursos=5 coste_actividad=20 previsto=25 desviacion_total=30');
    console.log('ENGREMIAT_PACKAGE_END package=PRUEBA_COSTE_SERVICE result=OK');
    return { ok: true, resultado: resultado };
  } finally {
    // Limpieza en orden inverso de dependencias -- se ejecuta pase o
    // falle la prueba, para no dejar datos de prueba mezclados con reales.
    ['TAREA_RECURSO', 'PRESUPUESTO', 'COSTE', 'PROVEEDOR_MATERIAL', 'PRODUCTO_MATERIAL',
     'TAREA', 'PROCESO', 'PROYECTO_PRODUCTO', 'RECURSO', 'MATERIAL', 'PROVEEDOR',
     'PRODUCTO', 'PROYECTO', 'CAMPANA'].forEach(function (entidad) {
      if (!creados[entidad]) return;
      try {
        desactivarRegistro(entidad, creados[entidad]);
      } catch (e) {
        console.error('LIMPIEZA_ERROR ' + entidad + ' ' + creados[entidad] + ': ' + e.message);
      }
    });
  }
}
