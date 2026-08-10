/**
 * Fase N9 (ver conversación -- "necesitamos que el cliente tenga la
 * opción de tener una plantilla sheet, que le pueda decir a una IA que
 * lo rellene y que esto lo pueda importar al sheet"): genera un .zip
 * descargable con un CSV vacío (solo cabeceras) por cada hoja STG_* de
 * un grupo, más un LEEME.txt con el esquema completo -- campos
 * obligatorios, valores de catálogo permitidos por columna (leídos en
 * vivo, nunca desactualizados respecto al catálogo real) y la
 * convención ID_TEMPORAL/*_TEMPORAL -- pensado para pegarse entero en
 * una IA junto con la petición real ("rellena esto para mi campaña de
 * Sant Jordi") y que la IA devuelva CSVs ya rellenos.
 *
 * La subida de vuelta (escribirFilasCSVEnHojaStaging) es la otra mitad:
 * en vez de pegado celda a celda (fragil con comas/acentos en Sheets),
 * el cliente sube el/los CSV ya rellenos desde el diálogo y el servidor
 * los añade a la hoja STG_* correspondiente, comprobando que las
 * cabeceras coinciden antes de escribir nada.
 */

var GRUPOS_PLANTILLA_IMPORTACION_MASIVA_ = {
  CAMPANA: ['STG_CAMPANA', 'STG_PROYECTO', 'STG_PRODUCTO', 'STG_PROCESO', 'STG_TAREA'],
  RECURSOS_PERSONAS: ['STG_RECURSO', 'STG_PERSONA', 'STG_EQUIPO_MIEMBRO']
};

/*
 * Mismos pares campo->catálogo y campos obligatorios que valida
 * procesarImportacionMasiva_/procesarImportacionRecursosPersonas_
 * (ImportacionMasiva.js) -- una sola fuente de verdad para no divergir
 * de lo que el commit realmente exige.
 */
var CAMPOS_OBLIGATORIOS_POR_HOJA_STAGING_ = {
  STG_CAMPANA: ['NOMBRE', 'FECHA_INICIO_PLAN', 'FECHA_FIN_PLAN', 'ESTADO'],
  STG_PROYECTO: ['CAMPANA_TEMPORAL', 'NOMBRE', 'TIPO_PROYECTO', 'PRIORIDAD', 'ESTADO'],
  STG_PRODUCTO: ['PROYECTO_TEMPORAL', 'CODIGO', 'NOMBRE', 'ORIGEN', 'UNIDAD', 'ESTADO'],
  STG_PROCESO: ['PRODUCTO_TEMPORAL', 'NOMBRE', 'DURACION_PREVISTA_DIAS', 'ESTADO'],
  STG_TAREA: ['PROCESO_TEMPORAL', 'NOMBRE', 'DURACION_PREVISTA_DIAS', 'ESTADO'],
  STG_RECURSO: ['CODIGO', 'NOMBRE', 'CLASE_RECURSO', 'ESTADO'],
  STG_PERSONA: ['TIPO', 'NOMBRE', 'ROL', 'CAPACIDAD_SEMANAL_DIAS', 'DISPONIBILIDAD', 'ESTADO'],
  STG_EQUIPO_MIEMBRO: ['EQUIPO_TEMPORAL', 'MIEMBRO_TEMPORAL', 'ESTADO']
};

var CATALOGOS_POR_COLUMNA_STAGING_ = {
  STG_CAMPANA: { ESTADO: 'CFG_ESTADO_CAMPANA' },
  STG_PROYECTO: { TIPO_PROYECTO: 'CFG_TIPO_PROYECTO', PRIORIDAD: 'CFG_PRIORIDAD', ESTADO: 'CFG_ESTADO_PROYECTO' },
  STG_PRODUCTO: { ORIGEN: 'CFG_ORIGEN_PRODUCTO', UNIDAD: 'CFG_UNIDAD', PRIORIDAD: 'CFG_PRIORIDAD', ESTADO: 'CFG_ESTADO_PRODUCTO' },
  STG_PROCESO: { ESTADO: 'CFG_ESTADO_PROCESO' },
  STG_TAREA: { ESTADO: 'CFG_ESTADO_TAREA' },
  STG_RECURSO: { CLASE_RECURSO: 'CFG_CLASE_RECURSO', CATEGORIA_RECURSO: 'CFG_CATEGORIA_RECURSO', ESTADO: 'CFG_ESTADO_RECURSO_FISICO' },
  STG_PERSONA: { TIPO: 'CFG_TIPO_RECURSO', ROL: 'CFG_ROL_PERSONA', DISPONIBILIDAD: 'CFG_DISPONIBILIDAD', ESTADO: 'CFG_ESTADO_RECURSO' },
  STG_EQUIPO_MIEMBRO: {}
};

var TEMPORALES_EXPLICADOS_POR_HOJA_ = {
  STG_PROYECTO: 'CAMPANA_TEMPORAL apunta al ID_TEMPORAL de una fila de STG_CAMPANA (o a un ID real de campaña ya existente).',
  STG_PRODUCTO: 'PROYECTO_TEMPORAL apunta al ID_TEMPORAL de una fila de STG_PROYECTO (o a un ID real de proyecto ya existente).',
  STG_PROCESO: 'PRODUCTO_TEMPORAL apunta al ID_TEMPORAL de una fila de STG_PRODUCTO (o a un ID real de producto ya existente).',
  STG_TAREA: 'PROCESO_TEMPORAL apunta al ID_TEMPORAL de una fila de STG_PROCESO (o a un ID real de proceso ya existente).',
  STG_RECURSO: 'UBICACION_TEMPORAL (opcional) apunta al ID_TEMPORAL de otra fila de STG_RECURSO que sea su ubicación contenedora.',
  STG_PERSONA: 'COORDINADOR_TEMPORAL (opcional, solo si TIPO=Equipo) apunta al ID_TEMPORAL de otra fila de STG_PERSONA con TIPO=Persona.',
  STG_EQUIPO_MIEMBRO: 'EQUIPO_TEMPORAL y MIEMBRO_TEMPORAL apuntan cada uno al ID_TEMPORAL de una fila de STG_PERSONA.'
};

function buscarDefinicionStaging_(nombreHoja) {
  var definicion = DEFINICIONES_STAGING_IMPORTACION_MASIVA_.filter(function (d) {
    return d.hoja === nombreHoja;
  })[0];
  if (!definicion) throw new Error('PLANTILLA_ERROR: hoja de staging desconocida: ' + nombreHoja);
  return definicion;
}

function construirLineaCSV_(valores) {
  return valores
    .map(function (v) {
      var texto = String(v === undefined || v === null ? '' : v);
      if (/[",\n]/.test(texto)) return '"' + texto.replace(/"/g, '""') + '"';
      return texto;
    })
    .join(',');
}

function construirInstruccionesPlantilla_(grupo) {
  var hojas = GRUPOS_PLANTILLA_IMPORTACION_MASIVA_[grupo];
  var lineas = [];

  lineas.push('Plantilla de importación masiva -- LaTroballa');
  lineas.push('');
  lineas.push('Cómo usar esto con una IA: pega este archivo entero en el chat junto con tu');
  lineas.push('petición real (ej. "rellena esto para una campaña de Sant Jordi con 2');
  lineas.push('proyectos..."). Pide a la IA que te devuelva el contenido completo de cada CSV');
  lineas.push('ya relleno, uno por hoja. Luego sube esos CSV desde el diálogo de Importación');
  lineas.push('masiva del Sheet (paso "Subir CSV ya rellenado").');
  lineas.push('');
  lineas.push('Reglas comunes a todas las hojas:');
  lineas.push('- ID_TEMPORAL: una clave que tú inventas, única dentro de la misma hoja (ej. "C1", "P1"). Sirve para enlazar filas del mismo lote entre sí.');
  lineas.push('- ESTADO_IMPORTACION e ID_REAL: NO los rellenes. Quedan vacíos -- los escribe el propio proceso de importación al confirmar.');
  lineas.push('- Si una columna termina en _TEMPORAL, puede apuntar a un ID_TEMPORAL de otra fila del mismo lote, o a un ID real ya existente en el Sheet si estás ampliando algo ya creado.');
  lineas.push('- No borres ni renombres la fila de cabeceras del CSV.');
  lineas.push('');

  hojas.forEach(function (nombreHoja) {
    var definicion = buscarDefinicionStaging_(nombreHoja);
    var obligatorios = CAMPOS_OBLIGATORIOS_POR_HOJA_STAGING_[nombreHoja] || [];
    var catalogos = CATALOGOS_POR_COLUMNA_STAGING_[nombreHoja] || {};

    lineas.push('== ' + nombreHoja + '.csv ==');

    definicion.cabeceras.forEach(function (columna) {
      if (columna === 'ESTADO_IMPORTACION' || columna === 'ID_REAL' || columna === 'PROYECTO_PRODUCTO_ID_REAL') return;

      var detalle = columna;
      if (obligatorios.indexOf(columna) !== -1) detalle += ' (obligatorio)';
      if (catalogos[columna]) {
        var valoresPermitidos;
        try {
          valoresPermitidos = obtenerCatalogo(catalogos[columna]);
        } catch (e) {
          valoresPermitidos = [];
        }
        if (valoresPermitidos.length > 0) {
          detalle += ' -- valores permitidos: ' + valoresPermitidos.join(' | ');
        }
      }
      lineas.push('  - ' + detalle);
    });

    if (TEMPORALES_EXPLICADOS_POR_HOJA_[nombreHoja]) {
      lineas.push('  ' + TEMPORALES_EXPLICADOS_POR_HOJA_[nombreHoja]);
    }

    lineas.push('');
  });

  return lineas.join('\n');
}

function generarPlantillasImportacionMasiva(grupo) {
  var hojas = GRUPOS_PLANTILLA_IMPORTACION_MASIVA_[grupo];
  if (!hojas) throw new Error('PLANTILLA_ERROR: grupo desconocido: ' + grupo);

  var blobs = hojas.map(function (nombreHoja) {
    var definicion = buscarDefinicionStaging_(nombreHoja);
    var csv = construirLineaCSV_(definicion.cabeceras) + '\n';
    return Utilities.newBlob(csv, 'text/csv', nombreHoja + '.csv');
  });

  blobs.push(Utilities.newBlob(construirInstruccionesPlantilla_(grupo), 'text/plain', 'LEEME.txt'));

  var nombreZip = 'plantilla_importacion_' + (grupo === 'CAMPANA' ? 'campana' : 'recursos_personas') + '.zip';
  var zip = Utilities.zip(blobs, nombreZip);

  return {
    nombreArchivo: nombreZip,
    mimeType: 'application/zip',
    base64: Utilities.base64Encode(zip.getBytes())
  };
}

/*
 * Parser CSV simple pero correcto con comillas (soporta comas y saltos
 * de línea dentro de un campo entrecomillado, y comillas escapadas "").
 * Suficiente para lo que puede generar una IA o Excel/Sheets al
 * exportar CSV -- no pretende ser RFC 4180 completo (no hace falta
 * aquí: BOM/codificaciones exóticas no son un caso real en este flujo).
 */
function analizarCSV_(texto) {
  var filas = [];
  var fila = [];
  var campo = '';
  var dentroDeComillas = false;
  var textoLimpio = String(texto || '').replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (var i = 0; i < textoLimpio.length; i++) {
    var c = textoLimpio.charAt(i);

    if (dentroDeComillas) {
      if (c === '"') {
        if (textoLimpio.charAt(i + 1) === '"') { campo += '"'; i++; } else { dentroDeComillas = false; }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') { dentroDeComillas = true; continue; }
    if (c === ',') { fila.push(campo); campo = ''; continue; }
    if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; continue; }
    campo += c;
  }

  if (campo !== '' || fila.length > 0) { fila.push(campo); filas.push(fila); }

  return filas.filter(function (f) { return !(f.length === 1 && f[0] === ''); });
}

/*
 * Añade al final de una hoja STG_* ya instalada las filas de un CSV
 * subido por el cliente. Las columnas se emparejan por nombre de
 * cabecera (no por posición) para tolerar que la IA reordene columnas;
 * si falta o sobra alguna cabecera obligatoria de la hoja real, falla
 * con un mensaje claro en vez de escribir datos a medias.
 */
function escribirFilasCSVEnHojaStaging(nombreHoja, textoCSV) {
  var definicion = buscarDefinicionStaging_(nombreHoja);
  var hoja = SpreadsheetApp.getActive().getSheetByName(nombreHoja);

  if (!hoja) {
    throw new Error('No existe la hoja ' + nombreHoja + '. Ejecuta primero "Preparar hojas".');
  }

  var filasCSV = analizarCSV_(textoCSV);
  if (filasCSV.length === 0) return { filasEscritas: 0 };

  var cabecerasCSV = filasCSV[0].map(function (c) { return String(c || '').trim(); });
  var cabecerasEsperadas = definicion.cabeceras.filter(function (c) {
    return c !== 'ESTADO_IMPORTACION' && c !== 'ID_REAL' && c !== 'PROYECTO_PRODUCTO_ID_REAL';
  });

  var faltantes = cabecerasEsperadas.filter(function (c) { return cabecerasCSV.indexOf(c) === -1; });
  if (faltantes.length > 0) {
    throw new Error(
      'El CSV para ' + nombreHoja + ' no tiene las columnas: ' + faltantes.join(', ') +
        '. Cabeceras encontradas: ' + cabecerasCSV.join(', ')
    );
  }

  var indicePorColumna = {};
  cabecerasCSV.forEach(function (c, i) { indicePorColumna[c] = i; });

  var filasDatos = filasCSV.slice(1).filter(function (fila) {
    return fila.some(function (v) { return String(v || '').trim() !== ''; });
  });

  if (filasDatos.length === 0) return { filasEscritas: 0 };

  var filasParaEscribir = filasDatos.map(function (fila) {
    return definicion.cabeceras.map(function (columna) {
      if (columna === 'ESTADO_IMPORTACION' || columna === 'ID_REAL' || columna === 'PROYECTO_PRODUCTO_ID_REAL') return '';
      var indice = indicePorColumna[columna];
      return indice === undefined ? '' : (fila[indice] === undefined ? '' : fila[indice]);
    });
  });

  var ultimaFila = hoja.getLastRow();
  hoja.getRange(ultimaFila + 1, 1, filasParaEscribir.length, definicion.cabeceras.length).setValues(filasParaEscribir);

  return { filasEscritas: filasParaEscribir.length };
}
