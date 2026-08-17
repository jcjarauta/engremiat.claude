/**
 * Pruebas reactivas de moduloInstalado_ (FormularioMotorUI.js) y
 * hojaInstalable_/categoriaInstalable_ (EstructuraInicialService.js) --
 * el mecanismo que condiciona menú, hojas y catálogo semilla a
 * MODULOS_INSTALADOS_CLIENTE (Fase 3 -- Aprovisionamiento, ver
 * AprovisionamientoService.js y ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS.md).
 * Sin este test, un refactor de onOpen()/instalarEstructuraInicial() puede
 * romper el filtrado sin que nadie lo note hasta que un cliente vea un
 * módulo que no tiene instalado.
 *
 * La mayoría de las funciones probadas son puras (no leen SpreadsheetApp),
 * salvo moduloInstalado_, que lee la variable de módulo
 * modulosInstaladosClienteActual_ -- en Apps Script no hay privacidad real
 * de fichero, así que la mayoría de estas pruebas la fijan directamente,
 * sin pasar por onOpen(). La excepción es
 * pruebaOnOpenNoRompeConObjetoEventoReal, que sí llama a la onOpen() real
 * -- fija en código el bug detectado en vivo el 08/08/2026: Google Sheets
 * pasa un objeto de evento (no un array) como primer argumento cuando
 * onOpen() se dispara como trigger real, y eso rompía moduloInstalado_
 * (.indexOf no existe en un objeto de evento) en el Sheet maestro, que
 * invoca onOpen() directamente como trigger sin envoltorio de cliente.
 */

function pruebaModuloInstaladoSinListaAsumeTodoInstalado() {
  modulosInstaladosClienteActual_ = null;

  var modulosDeMuestra = ['CORE', 'GANTT', 'COMPRAS', 'CLIENTE', 'VENTAS', 'OPORTUNIDAD', 'ECONOMICO', 'CONVOCATORIAS', 'IMPACTO', 'INTERNO'];
  var errores = modulosDeMuestra.filter(function (modulo) {
    return moduloInstalado_(modulo) !== true;
  });

  if (errores.length > 0) {
    throw new Error('PRUEBA_MODULO_INSTALADO_SIN_LISTA_ERROR: deberían ser true: ' + errores.join(', '));
  }

  console.log('OK: sin MODULOS_INSTALADOS_CLIENTE, moduloInstalado_ asume todo instalado (' + modulosDeMuestra.length + ' módulos verificados)');
  return true;
}

function pruebaModuloInstaladoConListaFiltraCorrectamente() {
  modulosInstaladosClienteActual_ = ['CORE', 'GANTT'];

  var casos = [
    ['CORE', true],
    ['GANTT', true],
    ['CLIENTE', false],
    ['VENTAS', false],
    ['OPORTUNIDAD', false],
    ['COMPRAS', false],
    ['INTERNO', false]
  ];

  var errores = casos.filter(function (caso) {
    return moduloInstalado_(caso[0]) !== caso[1];
  });

  modulosInstaladosClienteActual_ = null;

  if (errores.length > 0) {
    throw new Error('PRUEBA_MODULO_INSTALADO_CON_LISTA_ERROR: fallaron ' + errores.map(function (e) { return e[0]; }).join(', '));
  }

  console.log('OK: con MODULOS_INSTALADOS_CLIENTE=[CORE,GANTT], moduloInstalado_ filtra correctamente (' + casos.length + ' casos verificados)');
  return true;
}

/**
 * Fija en código el bug detectado en vivo el 08/08/2026: onOpen() recibía
 * el objeto de evento real de Google Sheets (no un array) al dispararse
 * como trigger, y lo trataba como MODULOS_INSTALADOS_CLIENTE sin comprobar
 * -- moduloInstalado_ rompía en .indexOf porque un objeto de evento no
 * tiene ese método. Llama a la onOpen() real (no una copia): si alguien
 * quita el Array.isArray de onOpen(), esta prueba vuelve a fallar con el
 * mismo TypeError que rompió el menú del Sheet maestro en producción.
 * onOpen() también llama a SpreadsheetApp.getUi(), que sí falla fuera de
 * un Spreadsheet real -- eso es esperado y no es lo que esta prueba fija;
 * solo falla si el error es el TypeError de .indexOf.
 */
function pruebaOnOpenNoRompeConObjetoEventoReal() {
  var eventoSimulado = { authMode: 'FULL', source: {}, triggerUid: 'PRUEBA', user: {} };
  var errorDeIndexOf = null;

  try {
    onOpen(eventoSimulado);
  } catch (e) {
    if (/indexOf is not a function/.test(e.message)) errorDeIndexOf = e.message;
  }

  try {
    onOpen(undefined);
  } catch (e) {
    if (/indexOf is not a function/.test(e.message)) errorDeIndexOf = errorDeIndexOf || e.message;
  }

  modulosInstaladosClienteActual_ = null;

  if (errorDeIndexOf) {
    throw new Error('PRUEBA_ONOPEN_EVENTO_REAL_ERROR: ' + errorDeIndexOf);
  }

  console.log('OK: onOpen() no rompe moduloInstalado_ con un objeto de evento real ni con undefined');
  return true;
}

function pruebaModuloInstaladoInternoSoloEnMaestro() {
  // 'INTERNO' (Aprovisionamiento, AprovisionamientoService.js) no es un
  // módulo real: ningún cliente lo pide nunca en MODULOS_INSTALADOS_CLIENTE.
  // Solo debe ser true por el valor por defecto sin lista (Sheet maestro).
  modulosInstaladosClienteActual_ = null;
  var enMaestro = moduloInstalado_('INTERNO');

  modulosInstaladosClienteActual_ = ['CORE', 'GANTT', 'CLIENTE', 'VENTAS', 'OPORTUNIDAD'];
  var enClienteCompleto = moduloInstalado_('INTERNO');
  modulosInstaladosClienteActual_ = null;

  if (enMaestro !== true || enClienteCompleto !== false) {
    throw new Error('PRUEBA_MODULO_INSTALADO_INTERNO_ERROR: maestro=' + enMaestro + ' cliente_completo=' + enClienteCompleto);
  }

  console.log('OK: INTERNO solo se activa por el valor por defecto del maestro, ningún cliente real lo activa');
  return true;
}

function pruebaHojaInstalableSinListaInstalaTodo() {
  var muestra = ['01_CAMPANAS', '08_MATERIALES', '38_CLIENTE', '44_OPORTUNIDAD', '90_CONFIGURACION', '91_HISTORIAL'];
  var errores = muestra.filter(function (hoja) {
    return hojaInstalable_(hoja, null) !== true;
  });

  if (errores.length > 0) {
    throw new Error('PRUEBA_HOJA_INSTALABLE_SIN_LISTA_ERROR: deberían ser true: ' + errores.join(', '));
  }

  console.log('OK: sin lista, hojaInstalable_ instala todo (' + muestra.length + ' hojas verificadas)');
  return true;
}

function pruebaHojaInstalableFiltraPorModuloReal() {
  var casos = [
    ['01_CAMPANAS', ['CORE'], true],
    ['08_MATERIALES', ['CORE'], false],
    ['08_MATERIALES', ['CORE', 'COMPRAS'], true],
    ['38_CLIENTE', ['CORE'], false],
    ['38_CLIENTE', ['CORE', 'CLIENTE'], true],
    ['44_OPORTUNIDAD', ['CORE', 'CLIENTE', 'VENTAS'], false],
    ['44_OPORTUNIDAD', ['CORE', 'OPORTUNIDAD'], true],
    ['90_CONFIGURACION', ['CORE'], true],
    ['91_HISTORIAL', [], true]
  ];

  var errores = casos.filter(function (caso) {
    return hojaInstalable_(caso[0], caso[1]) !== caso[2];
  });

  if (errores.length > 0) {
    throw new Error('PRUEBA_HOJA_INSTALABLE_ERROR: fallaron ' + errores.map(function (e) { return e[0]; }).join(', '));
  }

  console.log('OK: hojaInstalable_ filtra por módulo real (' + casos.length + ' casos verificados)');
  return true;
}

function pruebaHojaInstalableCubreTodasLasHojasDeEntructuraInicial() {
  // Congela que cada hoja de ORDEN_HOJAS_ESTRUCTURA_INICIAL resuelve a un
  // módulo conocido (CORE por defecto, o el declarado en MODULO_POR_HOJA_MVP)
  // -- si alguien añade una entidad nueva sin registrarla, esta prueba no
  // falla (CORE es un valor por defecto válido), pero documenta el total
  // esperado para que un cambio de conteo se note en el diff de la prueba.
  var total = ORDEN_HOJAS_ESTRUCTURA_INICIAL.length;

  if (total !== 50) {
    throw new Error('PRUEBA_HOJA_INSTALABLE_COBERTURA_ERROR: se esperaban 50 hojas en ORDEN_HOJAS_ESTRUCTURA_INICIAL, hay ' + total);
  }

  console.log('OK: ORDEN_HOJAS_ESTRUCTURA_INICIAL tiene las 50 hojas esperadas');
  return true;
}

function pruebaCategoriaInstalableSinListaInstalaTodo() {
  var muestra = ['PRIORIDAD', 'ESTADO_CLIENTE', 'CATEGORIA_MATERIAL', 'ORIGEN_OPORTUNIDAD'];
  var errores = muestra.filter(function (categoria) {
    return categoriaInstalable_(categoria, null) !== true;
  });

  if (errores.length > 0) {
    throw new Error('PRUEBA_CATEGORIA_INSTALABLE_SIN_LISTA_ERROR: deberían ser true: ' + errores.join(', '));
  }

  console.log('OK: sin lista, categoriaInstalable_ instala todo (' + muestra.length + ' categorías verificadas)');
  return true;
}

function pruebaCategoriaInstalableFiltraPorModuloReal() {
  var casos = [
    ['PRIORIDAD', ['CORE'], true],
    ['CATEGORIA_MATERIAL', ['CORE'], false],
    ['CATEGORIA_MATERIAL', ['CORE', 'COMPRAS'], true],
    ['ESTADO_CLIENTE', ['CORE'], false],
    ['ESTADO_CLIENTE', ['CORE', 'CLIENTE'], true],
    ['ORIGEN_OPORTUNIDAD', ['CORE', 'CLIENTE', 'VENTAS'], false],
    ['ORIGEN_OPORTUNIDAD', ['CORE', 'OPORTUNIDAD'], true]
  ];

  var errores = casos.filter(function (caso) {
    return categoriaInstalable_(caso[0], caso[1]) !== caso[2];
  });

  if (errores.length > 0) {
    throw new Error('PRUEBA_CATEGORIA_INSTALABLE_ERROR: fallaron ' + errores.map(function (e) { return e[0]; }).join(', '));
  }

  console.log('OK: categoriaInstalable_ filtra por módulo real (' + casos.length + ' casos verificados)');
  return true;
}

/**
 * Congela, para el conjunto real de módulos de un cliente CORE-only (como
 * La Troballa), la lista exacta de hojas omitidas -- si alguien cambia
 * MODULO_POR_HOJA_MVP sin querer, esta prueba lo detecta.
 */
function pruebaHojaInstalableConjuntoCoreOnlyCoincideConElReal() {
  var modulosCore = ['CORE'];
  var omitidas = ORDEN_HOJAS_ESTRUCTURA_INICIAL.filter(function (hoja) {
    return !hojaInstalable_(hoja, modulosCore);
  });

  var esperadas = [
    '08_MATERIALES', '09_PRODUCTO_MATERIAL', '10_TAREA_MATERIAL', '15_PROVEEDORES',
    '19_MOVIMIENTO_MATERIAL', '21_PROVEEDOR_MATERIAL', '25_PEDIDO_PROVEEDOR',
    '26_PEDIDO_PROVEEDOR_LINEA', '27_RECEPCION', '28_RECEPCION_LINEA',
    '30_PRESUPUESTO', '31_FUENTE_FINANCIACION', '32_COSTE',
    '36_CONVOCATORIA', '37_ETIQUETA_IMPACTO',
    '38_CLIENTE', '39_PEDIDO_CLIENTE', '40_PEDIDO_CLIENTE_LINEA', '41_ENTREGA',
    '42_ENTREGA_LINEA', '43_CONTRATO_SERVICIO', '44_OPORTUNIDAD'
  ];

  var faltantes = esperadas.filter(function (hoja) { return omitidas.indexOf(hoja) === -1; });
  var inesperadas = omitidas.filter(function (hoja) { return esperadas.indexOf(hoja) === -1; });

  if (faltantes.length > 0 || inesperadas.length > 0) {
    throw new Error(
      'PRUEBA_HOJA_INSTALABLE_CORE_ONLY_ERROR: faltantes=' + JSON.stringify(faltantes) +
      ' inesperadas=' + JSON.stringify(inesperadas)
    );
  }

  console.log('OK: cliente CORE-only omite exactamente las ' + esperadas.length + ' hojas de otros módulos');
  return true;
}

function ejecutarSuiteModulosInstalados() {
  pruebaModuloInstaladoSinListaAsumeTodoInstalado();
  pruebaModuloInstaladoConListaFiltraCorrectamente();
  pruebaOnOpenNoRompeConObjetoEventoReal();
  pruebaModuloInstaladoInternoSoloEnMaestro();
  pruebaHojaInstalableSinListaInstalaTodo();
  pruebaHojaInstalableFiltraPorModuloReal();
  pruebaHojaInstalableCubreTodasLasHojasDeEntructuraInicial();
  pruebaCategoriaInstalableSinListaInstalaTodo();
  pruebaCategoriaInstalableFiltraPorModuloReal();
  pruebaHojaInstalableConjuntoCoreOnlyCoincideConElReal();
  Logger.log('SUITE MODULOS_INSTALADOS (moduloInstalado_/hojaInstalable_/categoriaInstalable_) COMPLETADA CON EXITO');
}
