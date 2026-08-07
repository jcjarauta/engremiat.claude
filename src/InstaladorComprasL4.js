/**
 * Instalador incremental para COMPRAS (ver conversación -- "COMPRAS como
 * módulo real", cierre de la deuda arquitectónica de que CLIENTE/VENTAS/
 * OPORTUNIDAD tenían instalador L4 propio y COMPRAS no). Mismo motivo que
 * InstaladorClienteL4.js/InstaladorVentasL4.js: instalarEstructuraInicial()
 * crea las hojas de COMPRAS (08_MATERIALES, 09_PRODUCTO_MATERIAL,
 * 10_TAREA_MATERIAL, 15_PROVEEDORES, 19_MOVIMIENTO_MATERIAL,
 * 21_PROVEEDOR_MATERIAL, 25_PEDIDO_PROVEEDOR, 26_PEDIDO_PROVEEDOR_LINEA,
 * 27_RECEPCION, 28_RECEPCION_LINEA) que falten, pero no siembra catálogo
 * nuevo en un 90_CONFIGURACION ya existente. Todas las categorías aquí son
 * nuevas (sin bloque previo), así que se escriben directamente al final de
 * la hoja -- igual que InstaladorVentasL4.js, no hace falta ampliarCatalogoL2_
 * para ninguna. Idempotente. Debe ejecutarse una única vez, manualmente, por
 * cada Sheet Nivel 1 que quiera usar COMPRAS.
 */
function instalarCatalogoComprasL4() {
  var packageName = 'INSTALAR_CATALOGO_COMPRAS_L4';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var categoriasNuevas = [
    ['CATEGORIA_MATERIAL', [
      ['MADERA', 'Madera'],
      ['FERRETERIA', 'Ferretería'],
      ['PINTURA', 'Pintura y acabado'],
      ['ADHESIVO', 'Adhesivo'],
      ['CONSUMIBLE', 'Consumible'],
      ['EMBALAJE', 'Embalaje'],
      ['OTRO', 'Otro']
    ]],
    ['ESTADO_MATERIAL', [
      ['DISPONIBLE', 'Disponible'],
      ['STOCK_BAJO', 'Stock bajo'],
      ['AGOTADO', 'Agotado'],
      ['RESERVADO', 'Reservado'],
      ['NO_UTILIZABLE', 'No utilizable'],
      ['DESCATALOGADO', 'Descatalogado']
    ]],
    ['ESTADO_PROVEEDOR', [
      ['ACTIVO', 'Activo'],
      ['INACTIVO', 'Inactivo'],
      ['BLOQUEADO', 'Bloqueado']
    ]],
    ['TIPO_MOVIMIENTO', [
      ['ENTRADA', 'Entrada'],
      ['RESERVA', 'Reserva'],
      ['LIBERACION_RESERVA', 'Liberación de reserva'],
      ['SALIDA', 'Salida'],
      ['CONSUMO', 'Consumo'],
      ['MERMA', 'Merma'],
      ['DEVOLUCION', 'Devolución'],
      ['TRASLADO', 'Traslado'],
      ['AJUSTE_POSITIVO', 'Ajuste positivo'],
      ['AJUSTE_NEGATIVO', 'Ajuste negativo']
    ]],
    ['ESTADO_PEDIDO_PROVEEDOR', [
      ['BORRADOR', 'Borrador'],
      ['ENVIADO', 'Enviado'],
      ['CONFIRMADO', 'Confirmado'],
      ['RECIBIDO_PARCIAL', 'Recibido parcial'],
      ['RECIBIDO_COMPLETO', 'Recibido completo'],
      ['CANCELADO', 'Cancelado']
    ]],
    ['ESTADO_RECEPCION', [
      ['BORRADOR', 'Borrador'],
      ['CONFIRMADA', 'Confirmada'],
      ['CANCELADA', 'Cancelada']
    ]]
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error('INSTALAR_CATALOGO_COMPRAS_L4_ERROR: no existe la hoja 90_CONFIGURACION. Ejecuta primero Instalar estructura inicial.');
    }

    var ultimaFila = hojaConfig.getLastRow();
    var datosConfig = ultimaFila > 1
      ? hojaConfig.getRange(2, 1, ultimaFila - 1, 3).getDisplayValues()
      : [];

    var clavesExistentes_ = {};
    var maxNumero = 0;

    datosConfig.forEach(function (fila) {
      var id = String(fila[0] || '').trim();
      var coincidencia = /^CFG-(\d+)$/.exec(id);
      if (coincidencia) maxNumero = Math.max(maxNumero, parseInt(coincidencia[1], 10));
      clavesExistentes_[String(fila[1] || '').trim() + '::' + String(fila[2] || '').trim()] = true;
    });

    var ahora = new Date();
    var usuario = Session.getEffectiveUser().getEmail() || 'USUARIO_NO_IDENTIFICADO';
    var anadidas = [];

    categoriasNuevas.forEach(function (par) {
      var categoria = par[0];
      var valores = par[1];

      if (clavesExistentes_[categoria + '::' + valores[0][0]]) {
        console.log('OK ' + categoria + '_ya_completo=true');
        return;
      }

      var filas = valores.map(function (valor) {
        maxNumero += 1;
        anadidas.push('CFG-' + String(maxNumero).padStart(4, '0') + ':' + categoria + '/' + valor[0]);
        return ['CFG-' + String(maxNumero).padStart(4, '0'), categoria, valor[0], valor[1], '', '', 'SÍ', ahora, usuario, ahora, usuario];
      });

      hojaConfig.getRange(hojaConfig.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
      console.log('OK ' + categoria + '_filas_anadidas=' + filas.length);
    });

    var rangosAsegurados = asegurarRangosNombradosCatalogo_(ss, hojaConfig);

    console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK filas_anadidas=' + anadidas.length + ' rangos_nombrados_asegurados=' + rangosAsegurados);

    return { filasAnadidas: anadidas, rangosNombradosAsegurados: rangosAsegurados };
  } finally {
    bloqueo.releaseLock();
  }
}

function abrirInstalarCatalogoComprasL4() {
  var ui = SpreadsheetApp.getUi();

  var resp = ui.alert(
    'Instalar catálogo de Compras',
    'Esto añade a 90_CONFIGURACION los valores de catálogo que introduce COMPRAS ' +
    '(CATEGORIA_MATERIAL, ESTADO_MATERIAL, ESTADO_PROVEEDOR, TIPO_MOVIMIENTO, ESTADO_PEDIDO_PROVEEDOR, ESTADO_RECEPCION) ' +
    'y repara sus rangos con nombre (CFG_*). Idempotente -- no duplica valores ya presentes. ¿Continuar?',
    ui.ButtonSet.YES_NO
  );

  if (resp !== ui.Button.YES) return;

  try {
    var resultado = instalarCatalogoComprasL4();

    var mensaje = resultado.filasAnadidas.length > 0
      ? 'Filas añadidas: ' + resultado.filasAnadidas.join(', ')
      : 'No había filas que añadir: el catálogo ya estaba completo.';

    mensaje += '\n\nRangos con nombre asegurados: ' + resultado.rangosNombradosAsegurados;

    ui.alert('Catálogo de Compras instalado', mensaje, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('Error', err.message, ui.ButtonSet.OK);
  }
}
