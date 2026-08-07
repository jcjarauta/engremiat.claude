/**
 * Instalador incremental para la Fase 0 de CLIENTE (ver
 * ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS.md). instalarEstructuraInicial()
 * crea la hoja 38_CLIENTE si falta, pero NO siembra catálogo nuevo en un
 * 90_CONFIGURACION que ya existía (sembrarCatalogoInicial_ solo corre si la
 * hoja es nueva) -- este instalador añade las filas de catálogo que
 * introduce CLIENTE a un Sheet ya en producción, sin tocar filas
 * existentes. Idempotente. Debe ejecutarse una única vez, manualmente,
 * por cada Sheet Nivel 1 que quiera usar la entidad CLIENTE.
 *
 * NIVEL_INCIDENCIA y ENTIDAD_DOCUMENTO ya existen como categorías (con
 * bloque contiguo propio) -- se amplían con ampliarCatalogoL2_
 * (InstaladorCatalogosL2.js), que inserta dentro del bloque y repara su
 * named range, para no romper la contigüidad exigida por
 * asegurarRangosNombradosCatalogo_. TIPO_CLIENTE y ESTADO_CLIENTE son
 * categorías nuevas sin bloque previo -- se escriben directamente al
 * final de la hoja como bloque propio, y sus named ranges los crea
 * asegurarRangosNombradosCatalogo_ (EstructuraInicialService.js) al
 * reconciliar toda la hoja al final.
 */
function instalarCatalogoClienteL4() {
  var packageName = 'INSTALAR_CATALOGO_CLIENTE_L4';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var categoriasNuevas = [
    ['TIPO_CLIENTE', [
      ['ENTIDAD_SOCIAL', 'Entidad social'],
      ['AYUNTAMIENTO', 'Ayuntamiento'],
      ['EMPRESA', 'Empresa'],
      ['PARTICULAR', 'Particular'],
      ['CLIENTE_SOFTWARE', 'Cliente de software']
    ]],
    ['ESTADO_CLIENTE', [
      ['PROSPECTO', 'Prospecto'],
      ['ACTIVO', 'Activo'],
      ['EN_PAUSA', 'En pausa'],
      ['BAJA', 'Baja']
    ]]
  ];

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaConfig = ss.getSheetByName('90_CONFIGURACION');

    if (!hojaConfig) {
      throw new Error('INSTALAR_CATALOGO_CLIENTE_L4_ERROR: no existe la hoja 90_CONFIGURACION. Ejecuta primero Instalar estructura inicial.');
    }

    ampliarCatalogoL2_(ss, hojaConfig, 'NIVEL_INCIDENCIA', null, [['CLIENTE', 'Cliente']]);
    ampliarCatalogoL2_(ss, hojaConfig, 'ENTIDAD_DOCUMENTO', null, [['CLIENTE', 'Cliente']]);

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

function abrirInstalarCatalogoClienteL4() {
  var ui = SpreadsheetApp.getUi();

  var resp = ui.alert(
    'Instalar catálogo de Cliente',
    'Esto añade a 90_CONFIGURACION los valores de catálogo que introduce la entidad CLIENTE ' +
    '(TIPO_CLIENTE, ESTADO_CLIENTE, y el valor "Cliente" en NIVEL_INCIDENCIA/ENTIDAD_DOCUMENTO) y repara ' +
    'sus rangos con nombre (CFG_*). Idempotente -- no duplica valores ya presentes. ¿Continuar?',
    ui.ButtonSet.YES_NO
  );

  if (resp !== ui.Button.YES) return;

  try {
    var resultado = instalarCatalogoClienteL4();

    var mensaje = resultado.filasAnadidas.length > 0
      ? 'Filas añadidas: ' + resultado.filasAnadidas.join(', ')
      : 'No había filas que añadir: el catálogo ya estaba completo.';

    mensaje += '\n\nRangos con nombre asegurados: ' + resultado.rangosNombradosAsegurados;

    ui.alert('Catálogo de Cliente instalado', mensaje, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('Error', err.message, ui.ButtonSet.OK);
  }
}
