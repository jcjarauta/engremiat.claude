/**
 * Prueba reactiva de leerVariasEntidadesBatch_ (LecturaBatchService.js):
 * compara, fila a fila y campo a campo, el resultado de la lectura por
 * lotes (Sheets Advanced Service) contra listarRegistros (el camino ya
 * probado, via SpreadsheetApp.getValues()) sobre las mismas entidades
 * reales -- incluye PROCESO a proposito porque tiene varias columnas
 * FECHA_* (FECHA_INICIO_PLAN, FECHA_FIN_PLAN, FECHA_INICIO_REAL,
 * FECHA_FIN_REAL), el caso mas delicado (conversion de fecha serial ->
 * Date). Sin esta prueba no hay forma de confiar en la conversion de
 * fechas del lote sin comparar contra el camino ya verificado.
 */
function pruebaLecturaBatchCoincideConListarRegistros() {
  console.log('ENGREMIAT_PACKAGE_BEGIN package=PRUEBA_LECTURA_BATCH');

  var entidades = [
    'PROCESO', 'TAREA', 'PERSONA_EQUIPO', 'HORARIO',
    'PROYECTO_PRODUCTO', 'PROYECTO', 'CAMPANA', 'TAREA_RECURSO',
    'PRODUCTO', 'TAREA_RESPONSABLE', 'RECURSO'
  ];
  var porLote = leerVariasEntidadesBatch_(entidades);

  var diferencias = [];

  entidades.forEach(function (entidad) {
    var esperado = listarRegistros(entidad, null);
    var obtenido = porLote[entidad];

    if (esperado.length !== obtenido.length) {
      diferencias.push(entidad + ': numero de filas distinto (esperado=' + esperado.length + ' obtenido=' + obtenido.length + ')');
      return;
    }

    var esperadoPorId = {};
    esperado.forEach(function (fila) { esperadoPorId[fila.ID] = fila; });

    obtenido.forEach(function (filaLote) {
      var filaEsperada = esperadoPorId[filaLote.ID];
      if (!filaEsperada) {
        diferencias.push(entidad + ' ' + filaLote.ID + ': no existe en listarRegistros');
        return;
      }
      Object.keys(filaEsperada).forEach(function (campo) {
        var valorEsperado = filaEsperada[campo];
        var valorLote = filaLote[campo];
        var esFecha = valorEsperado instanceof Date;
        var iguales = esFecha
          ? (valorLote instanceof Date && valorEsperado.getTime() === valorLote.getTime())
          : String(valorEsperado) === String(valorLote);
        if (!iguales) {
          diferencias.push(
            entidad + ' ' + filaLote.ID + '.' + campo + ': esperado=' + valorEsperado + ' (' + (esFecha ? valorEsperado.toISOString() : typeof valorEsperado) + ')' +
            ' obtenido=' + valorLote + ' (' + (valorLote instanceof Date ? valorLote.toISOString() : typeof valorLote) + ')'
          );
        }
      });
    });
  });

  if (diferencias.length > 0) {
    console.error('ERR diferencias=' + JSON.stringify(diferencias.slice(0, 20)));
    console.log('ENGREMIAT_PACKAGE_END package=PRUEBA_LECTURA_BATCH result=ERR');
    throw new Error('PRUEBA_LECTURA_BATCH_ERROR: ' + diferencias.length + ' diferencias, primera=' + diferencias[0]);
  }

  console.log('OK entidades_comparadas=' + JSON.stringify(entidades) + ' sin_diferencias=true');
  console.log('ENGREMIAT_PACKAGE_END package=PRUEBA_LECTURA_BATCH result=OK');
  return { entidades: entidades, ok: true };
}
