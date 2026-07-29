/**
 * EXPORTACIÓN CONSOLIDADA EN DOS PASADAS
 *
 * PASADA 1/2:
 * - Exporta todos los archivos .gs excepto:
 *   - Tests_Repository.gs
 *   - Tests_Repository2.gs
 *
 * PASADA 2/2:
 * - Exporta exclusivamente:
 *   - Tests_Repository.gs
 *   - Tests_Repository2.gs
 *
 * Cada pasada genera:
 * - una carpeta de exportación;
 * - un .txt por cada archivo .gs;
 * - 00_INDICE_ARCHIVOS.txt;
 * - un ZIP completo.
 *
 * Requiere:
 * - Apps Script API activada;
 * - scope script.projects.readonly;
 * - scope script.external_request;
 * - permisos de Google Drive.
 */

const CONFIG_EXPORTACION_CODIGO_ = Object.freeze({
  scriptId:
    '1kCjXYmMPOIPdK3zYC9w1cGz53ag74BCW2fT5lnTjWzWWcI1NHGmhVDzx',

  nombreOrigen:
    'TALLER_PRODUCCION_DEV',

  baseline:
    'BL-CODE-AUDIT-CLOSE-01',

  nombresTest: [
  'Tests_Repository',
  'Tests_Repository2',
  'Tests_IntegrityService_cobertura_directa_10_reglas'
]
});


/**
 * EXPORTACIÓN 1/2
 *
 * Exporta todos los archivos .gs del proyecto excepto
 * Tests_Repository.gs y Tests_Repository2.gs.
 */
function exportarCodigoSinTests() {
  const config = {
    scriptId:
      CONFIG_EXPORTACION_CODIGO_.scriptId,

    nombreOrigen:
      CONFIG_EXPORTACION_CODIGO_.nombreOrigen,

    baseline:
      CONFIG_EXPORTACION_CODIGO_.baseline,

    nombresTestExcluidos:
      CONFIG_EXPORTACION_CODIGO_.nombresTest.slice(),

    prefijoCarpeta:
      'EXPORTACION_GS_SIN_TESTS'
  };

  const packageName =
    'EXPORTAR_GS_SIN_TESTS';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName +
      ' scriptId=' +
      config.scriptId
  );

  try {
    const archivosProyecto =
      obtenerContenidoProyectoExportacion_(
        config.scriptId
      );

    const archivosGs =
      archivosProyecto.filter(function (archivo) {
        return archivo.type === 'SERVER_JS';
      });

    const archivosSeleccionados =
      archivosGs.filter(function (archivo) {
        return (
          config.nombresTestExcluidos.indexOf(
            archivo.name
          ) === -1
        );
      });

    const testsDetectados =
      archivosGs.filter(function (archivo) {
        return (
          config.nombresTestExcluidos.indexOf(
            archivo.name
          ) !== -1
        );
      });

    if (archivosSeleccionados.length === 0) {
      throw new Error(
        'NO_SE_ENCONTRARON_ARCHIVOS_GS_FUNCIONALES'
      );
    }

    console.log(
      'OK archivos_gs_totales=' +
        archivosGs.length
    );

    console.log(
      'OK archivos_funcionales_seleccionados=' +
        archivosSeleccionados.length
    );

    console.log(
      'OK archivos_test_excluidos=' +
        testsDetectados
          .map(function (archivo) {
            return archivo.name + '.gs';
          })
          .join(',')
    );

    const resultado =
      crearExportacionGs_(
        archivosSeleccionados,
        config,
        'SIN_TESTS'
      );

    console.log(
      'OK carpeta_exportacion=' +
        resultado.carpetaNombre
    );

    console.log(
      'OK carpeta_url=' +
        resultado.carpetaUrl
    );

    console.log(
      'OK indice_archivos=' +
        resultado.indiceNombre
    );

    console.log(
      'OK zip=' +
        resultado.zipNombre
    );

    console.log(
      'OK archivos_exportados=' +
        resultado.totalArchivos
    );

    console.log(
      'NEXT ejecutar=exportarCodigoSoloTests'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=OK'
    );

    return resultado;

  } catch (error) {
    console.error(
      'ERR message=' +
        normalizarTextoLog_(error.message)
    );

    console.error(
      'ERR stack=' +
        normalizarTextoLog_(
          error.stack || ''
        )
    );

    console.log(
      'NEXT revisar_error_y_no_continuar=true'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=ERR'
    );

    throw error;
  }
}


/**
 * EXPORTACIÓN 2/2
 *
 * Exporta exclusivamente:
 * - Tests_Repository.gs
 * - Tests_Repository2.gs
 */
function exportarCodigoSoloTests() {
  const config = {
    scriptId:
      CONFIG_EXPORTACION_CODIGO_.scriptId,

    nombreOrigen:
      CONFIG_EXPORTACION_CODIGO_.nombreOrigen,

    baseline:
      CONFIG_EXPORTACION_CODIGO_.baseline,

    nombresTestIncluidos:
      CONFIG_EXPORTACION_CODIGO_.nombresTest.slice(),

    prefijoCarpeta:
      'EXPORTACION_GS_SOLO_TESTS'
  };

  const packageName =
    'EXPORTAR_GS_SOLO_TESTS';

  console.log(
    'ENGREMIAT_PACKAGE_BEGIN package=' +
      packageName +
      ' scriptId=' +
      config.scriptId
  );

  try {
    const archivosProyecto =
      obtenerContenidoProyectoExportacion_(
        config.scriptId
      );

    const archivosGs =
      archivosProyecto.filter(function (archivo) {
        return archivo.type === 'SERVER_JS';
      });

    const archivosSeleccionados =
      archivosGs.filter(function (archivo) {
        return (
          config.nombresTestIncluidos.indexOf(
            archivo.name
          ) !== -1
        );
      });

    const nombresEncontrados =
      archivosSeleccionados
        .map(function (archivo) {
          return archivo.name;
        })
        .sort();

    const nombresEsperados =
      config.nombresTestIncluidos
        .slice()
        .sort();

    if (
      JSON.stringify(nombresEncontrados) !==
      JSON.stringify(nombresEsperados)
    ) {
      throw new Error(
        'TESTS_INCOMPLETOS esperados=' +
          nombresEsperados.join(',') +
          ' encontrados=' +
          nombresEncontrados.join(',')
      );
    }

    console.log(
      'OK archivos_gs_totales=' +
        archivosGs.length
    );

    console.log(
      'OK archivos_test_seleccionados=' +
        archivosSeleccionados.length
    );

    console.log(
      'OK tests_detectados=' +
        nombresEncontrados
          .map(function (nombre) {
            return nombre + '.gs';
          })
          .join(',')
    );

    const resultado =
      crearExportacionGs_(
        archivosSeleccionados,
        config,
        'SOLO_TESTS'
      );

    console.log(
      'OK carpeta_exportacion=' +
        resultado.carpetaNombre
    );

    console.log(
      'OK carpeta_url=' +
        resultado.carpetaUrl
    );

    console.log(
      'OK indice_archivos=' +
        resultado.indiceNombre
    );

    console.log(
      'OK zip=' +
        resultado.zipNombre
    );

    console.log(
      'OK archivos_exportados=' +
        resultado.totalArchivos
    );

    console.log(
      'NEXT consolidar_exportaciones_y_reconciliar_matriz=true'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=OK'
    );

    return resultado;

  } catch (error) {
    console.error(
      'ERR message=' +
        normalizarTextoLog_(error.message)
    );

    console.error(
      'ERR stack=' +
        normalizarTextoLog_(
          error.stack || ''
        )
    );

    console.log(
      'NEXT revisar_error_y_no_continuar=true'
    );

    console.log(
      'ENGREMIAT_PACKAGE_END package=' +
        packageName +
        ' result=ERR'
    );

    throw error;
  }
}


/**
 * Obtiene el contenido completo del proyecto mediante Apps Script API.
 */
function obtenerContenidoProyectoExportacion_(scriptId) {
  const url =
    'https://script.googleapis.com/v1/projects/' +
    encodeURIComponent(scriptId) +
    '/content';

  const respuesta =
    UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization:
          'Bearer ' +
          ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true
    });

  const codigoHttp =
    respuesta.getResponseCode();

  const cuerpo =
    respuesta.getContentText();

  if (codigoHttp !== 200) {
    throw new Error(
      'ERROR_APPS_SCRIPT_API HTTP_' +
        codigoHttp +
        ' respuesta=' +
        cuerpo
    );
  }

  const datos =
    JSON.parse(cuerpo);

  if (
    !datos.files ||
    !Array.isArray(datos.files)
  ) {
    throw new Error(
      'RESPUESTA_APPS_SCRIPT_API_SIN_FILES'
    );
  }

  return datos.files;
}


/**
 * Crea carpeta, archivos TXT, índice y ZIP.
 */
function crearExportacionGs_(
  archivos,
  config,
  tipoExportacion
) {
  if (
    !archivos ||
    !Array.isArray(archivos) ||
    archivos.length === 0
  ) {
    throw new Error(
      'EXPORTACION_SIN_ARCHIVOS'
    );
  }

  const zonaHoraria =
    Session.getScriptTimeZone() ||
    'Europe/Madrid';

  const ahora =
    new Date();

  const timestamp =
    Utilities.formatDate(
      ahora,
      zonaHoraria,
      'yyyyMMdd_HHmmss'
    );

  const fechaLegible =
    Utilities.formatDate(
      ahora,
      zonaHoraria,
      'yyyy-MM-dd HH:mm:ss'
    );

  const nombreCarpeta =
    config.prefijoCarpeta +
    '_' +
    timestamp;

  const carpeta =
    DriveApp.createFolder(
      nombreCarpeta
    );

  const blobsZip = [];
  const lineasIndice = [];

  lineasIndice.push(
    'EXPORTACION_BASELINE=' +
      config.baseline
  );

  lineasIndice.push(
    'FECHA_EXPORTACION=' +
      fechaLegible
  );

  lineasIndice.push(
    'ORIGEN=' +
      config.nombreOrigen
  );

  lineasIndice.push(
    'SCRIPT_ID=' +
      config.scriptId
  );

  lineasIndice.push(
    'TIPO_EXPORTACION=' +
      tipoExportacion
  );

  lineasIndice.push(
    'TOTAL_ARCHIVOS=' +
      archivos.length
  );

  lineasIndice.push('');

  archivos
    .slice()
    .sort(function (a, b) {
      return a.name.localeCompare(
        b.name
      );
    })
    .forEach(function (archivo, indice) {
      const nombreTxt =
        archivo.name +
        '.gs.txt';

      const contenido =
        archivo.source !== undefined
          ? archivo.source
          : '';

      const blob =
        Utilities.newBlob(
          contenido,
          'text/plain',
          nombreTxt
        );

      carpeta.createFile(blob);
      blobsZip.push(blob);

      lineasIndice.push(
        String(indice + 1)
          .padStart(2, '0') +
          ' | ' +
          archivo.name +
          '.gs' +
          ' | ' +
          nombreTxt
      );

      console.log(
        'OK archivo_exportado=' +
          nombreTxt
      );
    });

  const contenidoIndice =
    lineasIndice.join('\n');

  const blobIndice =
    Utilities.newBlob(
      contenidoIndice,
      'text/plain',
      '00_INDICE_ARCHIVOS.txt'
    );

  carpeta.createFile(blobIndice);
  blobsZip.unshift(blobIndice);

  const nombreZip =
    config.prefijoCarpeta +
    '_' +
    timestamp +
    '.zip';

  const blobZip =
    Utilities.zip(
      blobsZip,
      nombreZip
    );

  carpeta.createFile(blobZip);

  return {
    carpetaId:
      carpeta.getId(),

    carpetaNombre:
      nombreCarpeta,

    carpetaUrl:
      carpeta.getUrl(),

    indiceNombre:
      '00_INDICE_ARCHIVOS.txt',

    zipNombre:
      nombreZip,

    totalArchivos:
      archivos.length
  };
}


/**
 * Evita saltos de línea que rompan el formato del log.
 */
function normalizarTextoLog_(valor) {
  return String(valor || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}