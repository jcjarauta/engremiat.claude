/**
 * Patron estandar de Apps Script para componer plantillas HTML a partir
 * de fragmentos reutilizables (Estilos.html, ModalConfirmar.html...),
 * usado como <?!= include('NombreDeArchivo') ?> dentro de cualquier
 * plantilla HtmlService.
 */
function include(nombreArchivo) {
  return HtmlService.createHtmlOutputFromFile(nombreArchivo).getContent();
}
