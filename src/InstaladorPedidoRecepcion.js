/**
 * Fase L5.2 -- Pedidos y recepciones de proveedor, alcance minimo
 * confirmado: solo PEDIDO_PROVEEDOR (+lineas) y RECEPCION (+lineas), sin
 * SOLICITUD_COMPRA (peticion interna previa al pedido) ni
 * DEVOLUCION_PROVEEDOR todavia -- se añaden si una necesidad real lo
 * demanda. Depende de L5.1 (RECURSO) solo en el sentido de que ambas
 * fases tocan el mismo dominio de inventario; no reutiliza RECURSO
 * directamente, sigue trabajando sobre MATERIAL como el resto del
 * inventario hasta que exista una migracion real (R3, no construida).
 *
 * La recepcion actualiza inventario generando MOVIMIENTO_MATERIAL
 * (L3.3, tipo Entrada) en vez de escribir MATERIAL.STOCK_ACTUAL
 * directamente -- ver confirmarRecepcion_ en PedidoRecepcion.js.
 *
 * Catalogos nuevos: CFG_ESTADO_PEDIDO_PROVEEDOR, CFG_ESTADO_RECEPCION.
 * Crea las hojas 25_PEDIDO_PROVEEDOR, 26_PEDIDO_PROVEEDOR_LINEA,
 * 27_RECEPCION, 28_RECEPCION_LINEA. Idempotente. Debe ejecutarse una
 * unica vez, manualmente.
 */
function instalarEntidadPedidoRecepcion() {
  var packageName = 'INSTALAR_ENTIDAD_PEDIDO_RECEPCION';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var estadosPedidoProveedor = [
    ['BORRADOR', 'Borrador'],
    ['ENVIADO', 'Enviado'],
    ['CONFIRMADO', 'Confirmado'],
    ['RECIBIDO_PARCIAL', 'Recibido parcial'],
    ['RECIBIDO_COMPLETO', 'Recibido completo'],
    ['CANCELADO', 'Cancelado']
  ];

  var estadosRecepcion = [
    ['BORRADOR', 'Borrador'],
    ['CONFIRMADA', 'Confirmada'],
    ['CANCELADA', 'Cancelada']
  ];

  var definiciones = [
    {
      clave: 'PEDIDO_PROVEEDOR',
      cabeceras: [
        'ID', 'PROVEEDOR_ID', 'FECHA_PEDIDO', 'ESTADO',
        'FECHA_CREACION', 'CREADO_POR', 'FECHA_MODIFICACION', 'MODIFICADO_POR',
        'ACTIVO', 'OBSERVACIONES'
      ]
    },
    {
      clave: 'PEDIDO_PROVEEDOR_LINEA',
      cabeceras: [
        'ID', 'PEDIDO_PROVEEDOR_ID', 'MATERIAL_ID', 'CANTIDAD_PEDIDA', 'PRECIO_UNITARIO', 'UNIDAD', 'ESTADO',
        'FECHA_CREACION', 'CREADO_POR', 'FECHA_MODIFICACION', 'MODIFICADO_POR',
        'ACTIVO', 'OBSERVACIONES'
      ]
    },
    {
      clave: 'RECEPCION',
      cabeceras: [
        'ID', 'PEDIDO_PROVEEDOR_ID', 'FECHA_RECEPCION', 'RESPONSABLE_ID', 'ESTADO',
        'FECHA_CREACION', 'CREADO_POR', 'FECHA_MODIFICACION', 'MODIFICADO_POR',
        'ACTIVO', 'OBSERVACIONES'
      ]
    },
    {
      clave: 'RECEPCION_LINEA',
      cabeceras: [
        'ID', 'RECEPCION_ID', 'MATERIAL_ID', 'CANTIDAD_RECIBIDA', 'UNIDAD', 'ESTADO',
        'FECHA_CREACION', 'CREADO_POR', 'FECHA_MODIFICACION', 'MODIFICADO_POR',
        'ACTIVO', 'OBSERVACIONES'
      ]
    }
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error(
        'INSTALAR_ENTIDAD_PEDIDO_RECEPCION_ERROR: no existe la hoja 90_CONFIGURACION'
      );
    }

    crearCatalogoNuevoL3_(ss, hojaConfig, 'ESTADO_PEDIDO_PROVEEDOR', estadosPedidoProveedor);
    crearCatalogoNuevoL3_(ss, hojaConfig, 'ESTADO_RECEPCION', estadosRecepcion);

    definiciones.forEach(function (definicion) {
      var nombreHoja = ENTIDADES_MVP[definicion.clave].hoja;
      var hoja = ss.getSheetByName(nombreHoja);

      if (!hoja) {
        hoja = ss.insertSheet(nombreHoja);
        hoja.getRange(1, 1, 1, definicion.cabeceras.length).setValues([definicion.cabeceras]);
        hoja.setFrozenRows(1);

        console.log('OK hoja_creada=' + nombreHoja + ' columnas=' + definicion.cabeceras.length);
      } else {
        var ultimaColumna = hoja.getLastColumn();

        var cabecerasActuales = ultimaColumna > 0
          ? hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function (v) {
              return String(v || '').trim();
            })
          : [];

        var faltantes = definicion.cabeceras.filter(function (c) {
          return cabecerasActuales.indexOf(c) === -1;
        });

        if (faltantes.length > 0) {
          throw new Error(
            'INSTALAR_ENTIDAD_PEDIDO_RECEPCION_ERROR: la hoja ' +
              nombreHoja +
              ' ya existe pero le faltan columnas: ' +
              faltantes.join(', ')
          );
        }

        console.log('OK hoja_ya_existente_y_valida=' + nombreHoja);
      }
    });
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
