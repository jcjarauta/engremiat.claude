/**
 * Panel de Clientes: lista plana (CLIENTE no tiene jerarquía como
 * Campaña/Recurso) con incidencias abiertas por cliente y antigüedad de
 * la más antigua, acceso directo a "Nueva incidencia" (prefill
 * CLIENTE_ID + NIVEL_INCIDENCIA=Cliente) y al Sheet real si
 * CLIENTE.SHEET_URL está informado.
 */

var ESTADOS_INCIDENCIA_CERRADOS_ = ['Resuelta', 'Cerrada', 'Cancelada'];

/*
 * Ficha técnica (Sheet+Script ID+versión de librería) por cliente (ver
 * conversación -- "esto no lo tendríamos que tener automatizado?" tras
 * encontrar gestor-proyectos 109 versiones por detrás sin visibilidad):
 * solo se muestra en herramientas internas (INTERNO/APROVISIONAMIENTO),
 * nunca en el panel de un cliente de pago -- mismo criterio que
 * "Actualizar librería de un cliente" en AprovisionamientoService.js.
 * obtenerVersionLibreriaMasReciente_ exige el scope script.projects, así
 * que solo se llama cuando de verdad hace falta.
 */
function obtenerListaClientes() {
  var clientes = listarRegistros('CLIENTE', { ACTIVO: 'SÍ' });

  var incidenciasPorCliente_ = {};
  listarRegistrosSeguro_('INCIDENCIA', { ACTIVO: 'SÍ', NIVEL_INCIDENCIA: 'Cliente' }).forEach(function (inc) {
    if (!inc.CLIENTE_ID) return;
    if (!incidenciasPorCliente_[inc.CLIENTE_ID]) incidenciasPorCliente_[inc.CLIENTE_ID] = [];
    incidenciasPorCliente_[inc.CLIENTE_ID].push(inc);
  });

  var ahora = new Date();

  var mostrarInfoTecnica = moduloInstalado_('INTERNO') || moduloInstalado_('APROVISIONAMIENTO');
  var versionMasReciente = null;
  if (mostrarInfoTecnica) {
    try { versionMasReciente = String(obtenerVersionLibreriaMasReciente_()); } catch (e) { versionMasReciente = null; }
  }

  var lista = clientes.map(function (cliente) {
    var incidencias = incidenciasPorCliente_[cliente.ID] || [];
    var abiertas = incidencias.filter(function (inc) {
      return ESTADOS_INCIDENCIA_CERRADOS_.indexOf(inc.ESTADO) === -1;
    });

    var masAntigua = abiertas.reduce(function (min, inc) {
      var fecha = inc.FECHA_DETECCION ? new Date(inc.FECHA_DETECCION) : null;
      if (!fecha || isNaN(fecha.getTime())) return min;
      return (!min || fecha < min) ? fecha : min;
    }, null);

    var antiguedadDias = masAntigua ? Math.floor((ahora - masAntigua) / (1000 * 60 * 60 * 24)) : null;

    return {
      id: cliente.ID,
      codigo: cliente.CODIGO,
      nombre: cliente.NOMBRE,
      tipo: cliente.TIPO_CLIENTE,
      estado: cliente.ESTADO,
      sheetUrl: cliente.SHEET_URL || '',
      scriptId: cliente.SCRIPT_ID || '',
      libreriaVersion: cliente.LIBRERIA_VERSION || '',
      libreriaDesactualizada: !!(mostrarInfoTecnica && versionMasReciente && cliente.SCRIPT_ID && String(cliente.LIBRERIA_VERSION || '') !== versionMasReciente),
      incidenciasAbiertas: abiertas.length,
      antiguedadDias: antiguedadDias
    };
  });

  lista.sort(function (a, b) {
    if (a.libreriaDesactualizada !== b.libreriaDesactualizada) return a.libreriaDesactualizada ? -1 : 1;
    return b.incidenciasAbiertas - a.incidenciasAbiertas;
  });

  return { clientes: lista, total: lista.length, mostrarInfoTecnica: mostrarInfoTecnica, versionMasReciente: versionMasReciente };
}

/*
 * Variante de actualizarLibreriaClienteRemoto_ para el botón del panel:
 * el scriptId ya se conoce (viene de CLIENTE.SCRIPT_ID), así que no hace
 * falta el ui.prompt de abrirActualizarLibreriaCliente.
 */
/*
 * Antes duplicaba letra por letra actualizarLibreriaClienteDesdeDialogo
 * (AprovisionamientoService.js) -- colapsado 2026-08-23 (INC-0018), tras
 * casi provocar un desfase real (INC-0017) al tocar solo una de las dos
 * copias. Se mantienen ambos nombres (los llama cada uno un HTML
 * distinto via google.script.run) pero la implementacion real vive en
 * un solo sitio.
 */
function actualizarLibreriaClienteDesdePanel(scriptId) {
  return actualizarLibreriaClienteDesdeDialogo(scriptId);
}

function abrirPanelClientes() {
  var html = HtmlService.createTemplateFromFile('PanelClientes')
    .evaluate()
    .setTitle('Clientes')
    .setWidth(440);
  SpreadsheetApp.getUi().showSidebar(html);
}

/*
 * Exportar CSV (mismo exportador compartido que Proveedor/Gantt,
 * construirCsvConBom_/abrirDialogoDescargaCSV_ en DesviacionService.js).
 */
function exportarClientesCSV() {
  var datos = obtenerListaClientes();
  var encabezados = ['ID', 'Código', 'Nombre', 'Tipo', 'Estado', 'Incidencias abiertas', 'Antigüedad (días)'];

  var filas = datos.clientes.map(function (c) {
    return [c.id, c.codigo, c.nombre, c.tipo, c.estado, c.incidenciasAbiertas, c.antiguedadDias === null ? '' : c.antiguedadDias];
  });

  var nombreArchivo = 'CLIENTES_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd_HHmmss') + '.csv';
  registrarHistorial('INFORME', 'PANEL_CLIENTES', 'EXPORTAR_PANEL_CLIENTES', [], { origen: 'UI', formato: 'CSV' });
  return { nombreArchivo: nombreArchivo, contenidoCsv: construirCsvConBom_(encabezados, filas) };
}

function abrirDialogoExportarClientesCSV() {
  var resultado = exportarClientesCSV();
  abrirDialogoDescargaCSV_(resultado.nombreArchivo, resultado.contenidoCsv);
}
