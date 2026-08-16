/**
 * Lectura por lotes usando el servicio avanzado de Sheets (ver
 * conversacion -- exploracion de rendimiento del Gantt/Vista del dia):
 * cada SpreadsheetApp.getRange().getValues() paga un coste fijo de
 * ~0.7-1s en Apps Script, sin importar el tamaño de la hoja (confirmado
 * con las mediciones OK ..._ms de DesviacionService.js/
 * DisponibilidadService.js). Con 8-9 hojas por vista, eso es la mayor
 * parte de los 6-8s observados. Sheets.Spreadsheets.Values.batchGet
 * trae varias hojas en una sola llamada HTTP, evitando ese coste fijo
 * repetido.
 *
 * Uso deliberadamente acotado: solo lo usan los puntos ya medidos como
 * lentos (Gantt, Vista del dia). El resto del sistema sigue usando
 * listarRegistros/leerFilasEntidadComoObjetos_ (Repository.js) sin
 * tocar -- no se sustituye el camino de lectura global por el riesgo
 * que supondria para el resto de pantallas.
 *
 * Requiere el servicio avanzado "Sheets" habilitado en appsscript.json
 * y el scope OAuth completo (spreadsheets, no spreadsheets.currentonly)
 * -- dispara una reautorizacion la primera vez que se ejecute tras el
 * despliegue.
 */

/*
 * Fecha serial de Sheets/Excel: dias desde 1899-12-30 (incluye el
 * "bug" del año bisiesto 1900, igual que Excel); la parte fraccionaria
 * codifica la hora del dia (0.5 = mediodia). Se construye la parte de
 * fecha con new Date(y,m,d) en vez de aritmetica en milisegundos para
 * que caiga en el mismo huso horario que usa el resto del codigo (Apps
 * Script fija el huso horario de V8 al declarado en appsscript.json,
 * Europe/Madrid) -- el mismo comportamiento que SpreadsheetApp
 * getValues() para una celda de fecha -- y luego se suma la hora del
 * dia en milisegundos.
 *
 * Bug real detectado por Tests_LecturaBatch.js antes de usarse en
 * produccion: la primera version solo usaba Math.floor(serial) y
 * descartaba la parte fraccionaria, dejando FECHA_CREACION/
 * FECHA_MODIFICACION (que sí llevan hora) siempre en medianoche.
 */
function serialSheetsADate_(serial) {
  var dias = Math.floor(serial);
  var fraccionDia = serial - dias;
  var epoca = new Date(1899, 11, 30);
  var fecha = new Date(epoca.getFullYear(), epoca.getMonth(), epoca.getDate() + dias);
  var msDelDia = Math.round(fraccionDia * 24 * 60 * 60 * 1000);
  return new Date(fecha.getTime() + msDelDia);
}

/*
 * Prefijos de columna que la hoja guarda como celda de fecha/hora real
 * (getValues() devuelve Date, no texto/numero). Ampliado a HORA_ tras
 * el fallo real de Tests_LecturaBatch.js: HORA_INICIO/HORA_FIN de
 * HORARIO tambien son celdas de hora (Date con fecha base 1899-12-30),
 * no solo las que empiezan por FECHA.
 */
var LOTE_PREFIJOS_COLUMNA_FECHA_ = ['FECHA', 'HORA'];

function loteEsColumnaFecha_(nombreColumna) {
  var nombre = String(nombreColumna || '');
  return LOTE_PREFIJOS_COLUMNA_FECHA_.some(function (prefijo) { return nombre.indexOf(prefijo) === 0; });
}

function loteConvertirValor_(valor, esColumnaFecha) {
  if (valor === undefined || valor === null || valor === '') return '';
  if (esColumnaFecha && typeof valor === 'number') return serialSheetsADate_(valor);
  return valor;
}

/*
 * entidades: array de nombres de ENTIDADES_MVP (ej. ['PROCESO','TAREA']).
 * Devuelve { ENTIDAD: [ {CAMPO: valor, ...}, ... ] }, mismo formato de
 * objeto por fila que leerFilasEntidadComoObjetos_ (Repository.js) para
 * cada entidad -- para que el codigo que consume el resultado no tenga
 * que distinguir si vino por lote o por listarRegistros normal.
 */
/*
 * Módulos opcionales (ver conversación -- "los informes/vistas también
 * deberían ser dinámicos... un sheet core no necesita algún dato que
 * esté en los módulos superiores"): Sheets.Spreadsheets.Values.batchGet
 * falla ENTERO si un solo rango de la petición referencia una hoja
 * inexistente -- a diferencia de listarRegistros/listarRegistrosSeguro_
 * (Repository.js, por entidad), no es resiliente por rango. Sin este
 * filtro, pedir en el mismo lote una entidad CORE (TAREA) y una
 * opcional ausente (TAREA_RESPONSABLE sin OPERATIVA) tumbaba también la
 * CORE -- Kanban/Gantt/Vista del día quedaban colgados enteros en
 * clientes CORE-only. Las hojas ausentes se excluyen del batch y
 * resuelven a [] directamente, igual que listarRegistrosSeguro_.
 */
function leerVariasEntidadesBatch_(entidades) {
  var ss = SpreadsheetApp.getActive();
  var resultado = {};
  var entidadesDisponibles = [];
  var rangos = [];

  entidades.forEach(function (entidad) {
    var config = ENTIDADES_MVP[entidad];
    if (!config) throw new Error('ERROR_LOTE: entidad no reconocida: ' + entidad);
    if (!ss.getSheetByName(config.hoja)) {
      console.warn('LECTURA_LOTE_OMITIDA ' + entidad + ': hoja ' + config.hoja + ' no encontrada.');
      resultado[entidad] = [];
      return;
    }
    entidadesDisponibles.push(entidad);
    rangos.push(config.hoja);
  });

  if (rangos.length === 0) return resultado;

  var respuesta = Sheets.Spreadsheets.Values.batchGet(ss.getId(), {
    ranges: rangos,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'SERIAL_NUMBER'
  });

  entidadesDisponibles.forEach(function (entidad, indice) {
    var filasCrudas = (respuesta.valueRanges[indice] && respuesta.valueRanges[indice].values) || [];
    if (filasCrudas.length < 2) {
      resultado[entidad] = [];
      return;
    }
    var cabeceras = filasCrudas[0];
    var esFecha = cabeceras.map(loteEsColumnaFecha_);

    resultado[entidad] = filasCrudas.slice(1).map(function (fila) {
      var objeto = {};
      cabeceras.forEach(function (cabecera, c) {
        objeto[cabecera] = loteConvertirValor_(fila[c], esFecha[c]);
      });
      return objeto;
    });
  });

  return resultado;
}

/*
 * Mismo criterio de filtrado por igualdad exacta que listarRegistros
 * (Repository.js), reutilizable sobre filas ya traidas en lote.
 */
function loteFiltrarPorIgualdad_(filas, filtros) {
  if (!filtros) return filas;
  var claves = Object.keys(filtros);
  return filas.filter(function (fila) {
    return claves.every(function (clave) { return String(fila[clave]) === String(filtros[clave]); });
  });
}
