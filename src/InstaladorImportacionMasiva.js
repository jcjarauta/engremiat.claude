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
var DEFINICIONES_STAGING_IMPORTACION_MASIVA_ = [
    {
      hoja: 'STG_CAMPANA',
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
      cabeceras: ['ID_TEMPORAL', 'CAMPANA_TEMPORAL', 'NOMBRE', 'TIPO_PROYECTO', 'PRIORIDAD', 'ESTADO', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    {
      hoja: 'STG_PRODUCTO',
      cabeceras: ['ID_TEMPORAL', 'PROYECTO_TEMPORAL', 'CODIGO', 'NOMBRE', 'ORIGEN', 'UNIDAD', 'CANTIDAD_PREVISTA', 'PRIORIDAD', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL', 'PROYECTO_PRODUCTO_ID_REAL']
    },
    {
      hoja: 'STG_PROCESO',
      cabeceras: ['ID_TEMPORAL', 'PRODUCTO_TEMPORAL', 'NOMBRE', 'DURACION_PREVISTA_DIAS', 'ESTADO', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'DURACION_REAL_DIAS', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    {
      hoja: 'STG_TAREA',
      cabeceras: ['ID_TEMPORAL', 'PROCESO_TEMPORAL', 'NOMBRE', 'DURACION_PREVISTA_DIAS', 'ESTADO', 'FECHA_INICIO_REAL', 'FECHA_FIN_REAL', 'DURACION_REAL_DIAS', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    /*
     * Fase N8 (ver conversación): extiende el patrón STG_* a Recursos y
     * Personas -- a diferencia de la jerarquía de campaña (profundidad
     * fija de 5 niveles), RECURSO es un árbol de profundidad variable
     * (UBICACION_ID autorreferenciado). En vez de exigir que cada fila
     * padre aparezca antes que sus hijas en la hoja, se importa en dos
     * pasadas (ver ImportacionMasiva.js): 1) todas las filas sin
     * UBICACION_ID, 2) actualiza UBICACION_ID ya con todos los IDs
     * reales resueltos -- sin restricción de orden de filas.
     */
    {
      hoja: 'STG_RECURSO',
      cabeceras: ['ID_TEMPORAL', 'UBICACION_TEMPORAL', 'CODIGO', 'NOMBRE', 'CLASE_RECURSO', 'CATEGORIA_RECURSO', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    /*
     * PERSONA/EQUIPO: mismo criterio de dos pasadas para COORDINADOR_ID
     * (solo válido en filas TIPO=Equipo, apuntando a una fila
     * TIPO=Persona -- la propia regla de negocio ya existente en
     * Repository_InsertarRegistro.js se aplica igual en la segunda
     * pasada, vía actualizarRegistroTransaccional, sin duplicarla aquí).
     * EQUIPO_MIEMBRO (desglose N:M, L4) en hoja aparte, procesada
     * después de que todas las personas/equipos ya tengan ID real.
     */
    {
      hoja: 'STG_PERSONA',
      cabeceras: ['ID_TEMPORAL', 'COORDINADOR_TEMPORAL', 'TIPO', 'NOMBRE', 'ROL', 'CAPACIDAD_SEMANAL_DIAS', 'DISPONIBILIDAD', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    {
      hoja: 'STG_EQUIPO_MIEMBRO',
      cabeceras: ['ID_TEMPORAL', 'EQUIPO_TEMPORAL', 'MIEMBRO_TEMPORAL', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    /*
     * Fase N10 (ver conversación -- "el cuello de botella mas inmediato":
     * tras importar una campaña completa, asignar responsables/recursos
     * tarea a tarea a mano es justo el trabajo manual que este sistema
     * existe para evitar). TAREA_TEMPORAL/PERSONA_TEMPORAL/RECURSO_TEMPORAL
     * admiten tanto un ID real ya existente como el propio ID_TEMPORAL
     * usado al crear la tarea/persona/recurso -- resolverReferenciaStaging_
     * (ImportacionMasiva.js) lo busca en la hoja STG_* de origen aunque
     * esa fila ya este importada (ID_REAL relleno), para poder seguir
     * usando las mismas claves cortas del lote original sin tener que
     * conocer los IDs reales generados.
     */
    {
      hoja: 'STG_TAREA_RESPONSABLE',
      cabeceras: ['ID_TEMPORAL', 'TAREA_TEMPORAL', 'PERSONA_TEMPORAL', 'ROL_ASIGNADO', 'PORCENTAJE_DEDICACION', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    },
    {
      hoja: 'STG_TAREA_RECURSO',
      cabeceras: ['ID_TEMPORAL', 'TAREA_TEMPORAL', 'RECURSO_TEMPORAL', 'TIPO_USO', 'ESTADO', 'ESTADO_IMPORTACION', 'ID_REAL']
    }
];

function instalarStagingImportacionMasiva() {
  var packageName = 'INSTALAR_STAGING_IMPORTACION_MASIVA';

  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    DEFINICIONES_STAGING_IMPORTACION_MASIVA_.forEach(function (definicion) {
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
    });
  } finally {
    bloqueo.releaseLock();
  }

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');

  return true;
}
