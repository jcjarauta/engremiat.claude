/**
 * Mapa del sheet (ver conversación -- "transformar la barra lateral en
 * la navegación integral del sheet"): pantalla de inicio de la barra
 * lateral, un índice de todos los Paneles ya existentes (Campaña,
 * Personas, Recursos, Clientes, Ventas, Panel operativo) para no tener
 * que volver siempre al menú de Sheets para cambiar de espacio.
 *
 * No sustituye ningún Panel -- cada entrada solo llama al abridor
 * showSidebar() que ya existe, esto es puro índice/navegación. Mismo
 * caso especial que onOpen()/abrirInstalarEstructuraInicial() (ver
 * FUNCIONES_QUE_RECIBEN_MODULOS_INSTALADOS en generate-shell-wrappers.mjs
 * y GeneradorEnvoltoriosEmbebido.js): necesita saber qué módulos tiene
 * el cliente para no listar Paneles de módulos no instalados
 * (Clientes/Ventas), y esa información no persiste entre ejecuciones
 * salvo que se reciba como argumento explícito en cada llamada.
 */
function abrirMapaSheet(modulosInstalados) {
  var template = HtmlService.createTemplateFromFile('MapaSheet');
  template.modulosInstalados = JSON.stringify(Array.isArray(modulosInstalados) ? modulosInstalados : null);
  var html = template.evaluate().setTitle('Mapa del sheet').setWidth(420);
  SpreadsheetApp.getUi().showSidebar(html);
}
