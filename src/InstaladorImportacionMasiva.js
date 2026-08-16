/**
 * Fase L5.3 -- Importacion masiva de campana completa, alcance V1
 * minimo confirmado: solo los campos realmente obligatorios de cada
 * nivel (CAMPOS_OBLIGATORIOS_MVP + los pocos campos que el formulario
 * exige ademas, como CANTIDAD_PREVISTA en PRODUCTO) mas el enlace
 * jerarquico via IDs temporales. Nada de los campos opcionales de
 * criterios/OKR anadidos en L1-L3 -- esos se rellenan despues editando
 * el registro ya creado si hace falta.
 *
 * 5 hojas de staging, una por nivel (CAMPANA->PROYECTO->PRODUCTO->
 * PROCESO->TAREA). Cada fila tiene ID_TEMPORAL (referencia local dentro
 * del lote) y, salvo CAMPANA, una columna que apunta al ID_TEMPORAL de
 * su padre (o directamente a un ID real ya existente, para poder
 * ampliar una campana ya creada). ESTADO_IMPORTACION/ID_REAL son
 * columnas de control que rellena el propio proceso de importacion
 * (ver ImportacionMasiva.js) -- no las rellena el usuario.
 *
 * Idempotente. Debe ejecutarse una unica vez, manualmente.
 */

/*
 * Definicion compartida con PlantillaImportacionMasivaService.js (genera
 * las plantillas descargables) -- una sola fuente de verdad para las
 * cabeceras de cada hoja STG_*, para que ambos ficheros no puedan
 * divergir.
 */
/*
 * modulo (ver conversación -- "dejar el CORE limpio para acoplar módulos
 * a demanda del cliente"): CORE es la única cadena siempre presente
 * (Campaña->Proyecto->Producto->Proceso->Tarea); el resto (Recursos/
 * Personas, Asignaciones, Seguimiento, Horario, Ejecución) vive detrás
 * del módulo IMPORTACION_AVANZADA, mismo criterio que GANTT/COMPRAS/
 * CLIENTE -- ver hojaInstalable_ (EstructuraInicialService.js) para el
 * mecanismo gemelo aplicado a hojas de entidad. instalarStagingImportacionMasiva
 * filtra por este campo.
 */
var DEFINICIONES_STAGING_IMPORTACION_MASIVA_ = [
    {
      hoja: 'STG_CAMPANA',
      modulo: 'CORE',
      cabeceras: ['ID_TEMPORAL', 'NOMBRE', 'FECHA_INICIO_PLAN', 'FECHA_FIN_PLAN', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    /*
     * FECHA_INICIO_REAL/FECHA_FIN_REAL (PROYECTO/PROCESO/TAREA) y
     * DURACION_REAL_DIAS (PROCESO/TAREA) son opcionales, pero condicionales
     * de verdad (ver conversación -- hallazgo real probando con datos de
     * IA): Repository_InsertarRegistro.js exige FECHA_INICIO_REAL cuando
     * ESTADO='En proceso', y FECHA_INICIO_REAL+FECHA_FIN_REAL (+DURACION_REAL_DIAS
     * en Proceso/Tarea) cuando ESTADO='Completado'/'Terminada' -- sin estas
     * columnas, cualquier fila con esos estados quedaba bloqueada en el
     * commit (no en el dry-run) sin forma de completarla. Ver validación
     * espejo en ImportacionMasiva.js (validarCoherenciaFechaReal_).
     */
    {
      hoja: 'STG_PROYECTO',
      modulo: 'CORE',
      cabeceras: ['ID_TEMPORAL', 'CAMPANA_TEMPORAL', 'NOMBRE', 'TIPO_PROYECTO', 'PRIORIDAD', 'ESTADO', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    {
      hoja: 'STG_PRODUCTO',
      modulo: 'CORE',
      cabeceras: ['ID_TEMPORAL', 'PROYECTO_TEMPORAL', 'CODIGO', 'NOMBRE', 'ORIGEN', 'UNIDAD', 'CANTIDAD_PREVISTA', 'PRIORIDAD', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL', 'PROYECTO_PRODUCTO_ID_REAL']
    },
    /*
     * RESPONSABLE_ID/FASE_PRODUCCION/FECHA_INICIO_PLAN/FECHA_FIN_PLAN
     * (ver conversación -- "la plantilla no ofrece RESPONSABLE_ID,
     * FASE_PRODUCCION ni FECHA_INICIO_PLAN/FECHA_FIN_PLAN, de ahí el
     * '(sin responsable)' y '(sin FASE_PRODUCCION)' en todos los
     * informes"): los tres existen en el esquema real de PROCESO desde
     * hace tiempo (FormularioEsquemas.js), pero la importación masiva
     * nunca los ofrecía -- cualquier lote importado quedaba sin poder
     * agruparse por fase ni atribuirse a un responsable en los
     * informes de desviación. TAREA no tiene RESPONSABLE_ID propio (va
     * vía TAREA_RESPONSABLE N:M, fuera de alcance de este lote) ni
     * FASE_PRODUCCION (solo existe en PROCESO), pero sí
     * FECHA_INICIO_PLAN/FECHA_FIN_PLAN.
     */
    {
      hoja: 'STG_PROCESO',
      modulo: 'CORE',
      cabeceras: ['ID_TEMPORAL', 'PRODUCTO_TEMPORAL', 'NOMBRE', 'DURACION_PREVISTA_DIAS', 'RESPONSABLE_ID', 'FASE_PRODUCCION', 'ESTADO', 'FECHA_INICIO_PLAN', 'FECHA_FIN_PLAN', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'DURACION_REAL_DIAS', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    {
      hoja: 'STG_TAREA',
      modulo: 'CORE',
      cabeceras: ['ID_TEMPORAL', 'PROCESO_TEMPORAL', 'NOMBRE', 'DURACION_PREVISTA_DIAS', 'ESTADO', 'FECHA_INICIO_PLAN', 'FECHA_FIN_PLAN', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'DURACION_REAL_DIAS', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
];

/*
 * Combina las definiciones CORE (arriba) con las del módulo
 * IMPORTACION_AVANZADA (InstaladorImportacionMasivaAvanzada.js) en
 * tiempo de ejecución -- nunca a nivel de fichero, porque el orden de
 * carga entre los .js de un proyecto de Apps Script no está garantizado.
 * Único punto que instalarStagingImportacionMasiva/
 * vaciarHojasStagingImportacionMasiva/buscarDefinicionStaging_/
 * obtenerEstadoHojasStaging deben usar en vez de referenciar
 * directamente ninguno de los dos arrays.
 */
function obtenerDefinicionesStagingCompletas_() {
  return DEFINICIONES_STAGING_IMPORTACION_MASIVA_.concat(DEFINICIONES_STAGING_IMPORTACION_MASIVA_AVANZADA_);
}

/*
 * true si la hoja de staging corresponde a un módulo instalado -- mismo
 * criterio y misma firma que hojaInstalable_ (EstructuraInicialService.js):
 * sin lista (null/undefined, cliente antiguo sin regenerar Codigo.js, o
 * el propio Sheet maestro) instala todo, por compatibilidad.
 */
function hojaStagingInstalable_(definicion, modulosInstalados) {
  if (!modulosInstalados) return true;
  if (!definicion.modulo) return true;
  return modulosInstalados.indexOf(definicion.modulo) !== -1;
}

function instalarStagingImportacionMasiva(modulosInstalados) {
  var packageName = 'INSTALAR_STAGING_IMPORTACION_MASIVA';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var bloqueo = LockService.getScriptLock();
  var hojasOmitidasPorModulo = [];

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    obtenerDefinicionesStagingCompletas_().forEach(function (definicion) {
      if (!hojaStagingInstalable_(definicion, modulosInstalados)) {
        hojasOmitidasPorModulo.push(definicion.hoja);
        return;
      }

      var hoja = ss.getSheetByName(definicion.hoja);

      if (!hoja) {
        hoja = ss.insertSheet(definicion.hoja);
        hoja.getRange(1, 1, 1, definicion.cabeceras.length).setValues([definicion.cabeceras]);
        hoja.setFrozenRows(1);

        console.log('OK hoja_creada=' + definicion.hoja + ' columnas=' + definicion.cabeceras.length);
      } else {
        var ultimaColumna = hoja.getLastColumn();

        var cabecerasActuales = ultimaColumna > 0
          ? hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0].map(function (v) {
              return String(v || '').trim();
            })
          : [];

        var faltantes = definicion.cabeceras.filter(function (c) {
          return cabecerasActuales.indexOf(c) === -1;
        });

        if (faltantes.length > 0) {
          /*
           * Auto-migración (ver conversación -- hallazgo real: cada vez
           * que el esquema de una hoja STG_* gana una columna nueva, las
           * hojas ya creadas en un cliente se quedaban desincronizadas y
           * bloqueaban "Preparar hojas" con un error manual). Añadir al
           * final es seguro: no reordena ni toca columnas existentes, y
           * escribirFilasCSVEnHojaStaging/leerFilasPendientesImportacion_
           * ya resuelven columnas por nombre de cabecera, no por posición,
           * así que el orden físico no tiene que coincidir con
           * DEFINICIONES_STAGING_IMPORTACION_MASIVA_.
           */
          hoja.getRange(1, ultimaColumna + 1, 1, faltantes.length).setValues([faltantes]);
          console.log('OK hoja_migrada=' + definicion.hoja + ' columnas_anadidas=' + faltantes.join(', '));
        } else {
          console.log('OK hoja_ya_existente_y_valida=' + definicion.hoja);
        }
      }

      if (definicion.columnasTexto && definicion.columnasTexto.length > 0) {
        var cabecerasHojaActual = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getDisplayValues()[0].map(function (v) {
          return String(v || '').trim();
        });
        var filasFormato = Math.max(hoja.getMaxRows() - 1, 1000);

        definicion.columnasTexto.forEach(function (nombreColumna) {
          var indiceColumna = cabecerasHojaActual.indexOf(nombreColumna);
          if (indiceColumna === -1) return;
          hoja.getRange(2, indiceColumna + 1, filasFormato, 1).setNumberFormat('@');
        });
      }
    });
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK hojas_omitidas_por_modulo=' + hojasOmitidasPorModulo.length);

  return { ok: true, hojasOmitidasPorModulo: hojasOmitidasPorModulo };
}

/*
 * Vaciar de un clic (ver conversación -- "necesitamos poder borrar todos
 * los datos del stg de un clic"): borra filas de datos de cada hoja
 * STG_* existente, para volver a empezar una prueba limpia sin arrastrar
 * restos de lotes anteriores (el hallazgo real de esta sesión: filas
 * STG_PROYECTO duplicadas y filas STG_PRODUCTO huérfanas de un lote
 * abandonado, mezcladas con el lote nuevo). NO toca los datos ya
 * importados a las hojas reales (CAMPANA, PROYECTO...) -- solo limpia el
 * área de trabajo STG_*.
 *
 * soloPendientes (por defecto true, ver conversación -- hallazgo real:
 * un vaciado total borraba también las filas YA importadas, que son la
 * única copia que existe del mapeo ID_TEMPORAL->ID_REAL usado por
 * resolverReferenciaStaging_/obtenerMapaResolucionStaging_
 * (ImportacionMasiva.js) para resolver referencias en lotes futuros
 * -- p.ej. importar "campana" hoy y "asignaciones" la semana que viene
 * reusando los mismos ID_TEMPORAL cortos. Vaciar esas filas rompía esa
 * posibilidad sin avisar). Con soloPendientes=true solo se borran las
 * filas cuyo ESTADO_IMPORTACION está vacío (nunca importadas); las que
 * ya tienen ESTADO_IMPORTACION="Importado" se conservan siempre. El
 * vaciado total (soloPendientes=false) sigue disponible para quien de
 * verdad quiera perder ese historial, pero ya no es el comportamiento
 * por defecto del botón.
 */
function vaciarHojasStagingImportacionMasiva(soloPendientes) {
  if (soloPendientes === undefined || soloPendientes === null) soloPendientes = true;

  var ss = SpreadsheetApp.getActive();
  var filasBorradas = 0;
  var filasConservadas = 0;
  var hojasVaciadas = 0;

  var bloqueo = LockService.getScriptLock();
  try {
    bloqueo.waitLock(10000);

    obtenerDefinicionesStagingCompletas_().forEach(function (definicion) {
      var hoja = ss.getSheetByName(definicion.hoja);
      if (!hoja) return;

      var ultimaFila = hoja.getLastRow();
      var ultimaColumna = hoja.getLastColumn();
      if (ultimaFila < 2 || ultimaColumna < 1) return;

      if (!soloPendientes) {
        filasBorradas += ultimaFila - 1;
        hojasVaciadas++;
        hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).clearContent();
        return;
      }

      var indiceEstadoImportacion = definicion.cabeceras.indexOf('ESTADO_IMPORTACION');
      if (indiceEstadoImportacion === -1) return;

      var valores = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).getValues();
      var filasAConservar = [];
      var huboBorrado = false;

      valores.forEach(function (fila) {
        var importada = String(fila[indiceEstadoImportacion] || '').trim() !== '';
        if (importada) {
          filasAConservar.push(fila);
          filasConservadas++;
        } else {
          filasBorradas++;
          huboBorrado = true;
        }
      });

      if (!huboBorrado) return;

      hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna).clearContent();
      if (filasAConservar.length > 0) {
        hoja.getRange(2, 1, filasAConservar.length, ultimaColumna).setValues(filasAConservar);
      }
      hojasVaciadas++;
    });
  } finally {
    bloqueo.releaseLock();
  }

  return { filasBorradas: filasBorradas, filasConservadas: filasConservadas, hojasVaciadas: hojasVaciadas, soloPendientes: soloPendientes };
}
