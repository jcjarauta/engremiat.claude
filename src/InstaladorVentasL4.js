/**
 * Instalador incremental para la Fase 2 de Ventas (ver
 * ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS.md). Mismo motivo que
 * InstaladorClienteL4.js: instalarEstructuraInicial() crea las hojas
 * 39-43 que falten, pero no siembra catálogo nuevo en un
 * 90_CONFIGURACION ya existente. Todas las categorías aquí son nuevas
 * (sin bloque previo), así que se escriben directamente al final de la
 * hoja -- a diferencia de InstaladorClienteL4.js no hace falta
 * ampliarCatalogoL2_ para ninguna. Idempotente. Debe ejecutarse una
 * única vez, manualmente, por cada Sheet Nivel 1 que quiera usar Ventas.
 */
function instalarCatalogoVentasL4() {
  var packageName = 'INSTALAR_CATALOGO_VENTAS_L4';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var categoriasNuevas = [
    ['CANAL_PEDIDO_CLIENTE', [
      ['ENCARGO', 'Encargo'],
      ['FERIA', 'Feria'],
      ['TIENDA', 'Tienda']
    ]],
    ['ESTADO_PEDIDO_CLIENTE', [
      ['BORRADOR', 'Borrador'],
      ['CONFIRMADO', 'Confirmado'],
      ['ENTREGADO_PARCIAL', 'Entregado parcial'],
      ['ENTREGADO_COMPLETO', 'Entregado completo'],
      ['CANCELADO', 'Cancelado']
    ]],
    ['ESTADO_ENTREGA', [
      ['BORRADOR', 'Borrador'],
      ['CONFIRMADA', 'Confirmada'],
      ['CANCELADA', 'Cancelada']
    ]],
    ['PERIODICIDAD_CONTRATO', [
      ['MENSUAL', 'Mensual'],
      ['ANUAL', 'Anual'],
      ['UNICO', 'Único']
    ]],
    ['MODALIDAD_PAGO', [
      ['MONETARIO', 'Monetario'],
      ['INTERCAMBIO', 'Intercambio'],
      ['MIXTO', 'Mixto'],
      ['CESION_SOCIAL', 'Cesión social']
    ]],
    ['ESTADO_CONTRATO_SERVICIO', [
      ['BORRADOR', 'Borrador'],
      ['ACTIVO', 'Activo'],
      ['PAUSADO', 'Pausado'],
      ['FINALIZADO', 'Finalizado'],
      ['CANCELADO', 'Cancelado']
    ]]
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error('INSTALAR_CATALOGO_VENTAS_L4_ERROR: no existe la hoja 90_CONFIGURACION. Ejecuta primero Instalar estructura inicial.');
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

function abrirInstalarCatalogoVentasL4() {
  var ui = SpreadsheetApp.getUi();

  var resp = ui.alert(
    'Instalar catálogo de Ventas',
    'Esto añade a 90_CONFIGURACION los valores de catálogo que introducen PEDIDO_CLIENTE/ENTREGA/CONTRATO_SERVICIO ' +
    '(CANAL_PEDIDO_CLIENTE, ESTADO_PEDIDO_CLIENTE, ESTADO_ENTREGA, PERIODICIDAD_CONTRATO, MODALIDAD_PAGO, ESTADO_CONTRATO_SERVICIO) ' +
    'y repara sus rangos con nombre (CFG_*). Idempotente -- no duplica valores ya presentes. ¿Continuar?',
    ui.ButtonSet.YES_NO
  );

  if (resp !== ui.Button.YES) return;

  try {
    var resultado = instalarCatalogoVentasL4();

    var mensaje = resultado.filasAnadidas.length > 0
      ? 'Filas añadidas: ' + resultado.filasAnadidas.join(', ')
      : 'No había filas que añadir: el catálogo ya estaba completo.';

    mensaje += '\n\nRangos con nombre asegurados: ' + resultado.rangosNombradosAsegurados;

    ui.alert('Catálogo de Ventas instalado', mensaje, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('Error', err.message, ui.ButtonSet.OK);
  }
}
