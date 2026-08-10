/**
 * Biblioteca y ayuda (ver conversación -- "me falta ... un espacio de
 * biblioteca con la documentación de cada parte del proyecto"). Pura
 * pantalla de contenido estático: explica los conceptos del taller
 * (Campaña→Tarea, Panel/Ficha/Formulario, Incidencias/Decisiones) para
 * quien se incorpora o se atasca, sin depender de ninguna hoja ni
 * lectura de datos.
 */
function abrirBiblioteca() {
  var html = HtmlService.createTemplateFromFile('Biblioteca')
    .evaluate()
    .setWidth(420)
    .setHeight(560);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Biblioteca y ayuda');
}
