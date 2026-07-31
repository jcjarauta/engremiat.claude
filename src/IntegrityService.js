/**
 * IntegrityService.gs -- Fase 11: Integridad y mantenimiento.
 * Detecta inconsistencias en datos YA EXISTENTES en las hojas de las 14
 * entidades del MVP -- no previene nuevas inconsistencias, eso ya lo hace
 * el motor de insercion/actualizacion (Repository_InsertarRegistro.gs,
 * Repository.gs). Dos comprobaciones, ambas de solo lectura:
 *
 *   1. IDs duplicados: mas de una fila con el mismo valor en la columna ID
 *      de una misma hoja. El motor los evita en escritura (obtenerSiguienteId
 *      es secuencial), pero una edicion manual directa sobre la hoja podria
 *      introducirlos.
 *   2. Referencias huerfanas (FK): un valor en un campo de clave foranea que
 *      no corresponde a ningun ID existente en la hoja de destino -- p.ej.
 *      un PROYECTO con CAMPANA_ID que ya no existe en 01_CAMPANAS.
 *
 * Alcance explicito (mismo criterio que la Fase 4 con DEPENDENCIAS_ACTIVAS_MVP):
 * MAPA_FK_MVP cubre relaciones FK directas de un solo campo.
 * Quedan fuera:
 *   - DOCUMENTO.ENTIDAD_ID: referencia polimorfica
 *     (ENTIDAD_TIPO + ENTIDAD_ID), ya excluida de la validacion del motor
 *     de insercion (ver nota Fase 2).
 *   - RESPONSABLE_ID de CAMPANA/PROYECTO/PRODUCTO/PROCESO/INCIDENCIA:
 *     referencia opcional de un solo valor hacia PERSONA_EQUIPO, todavia
 *     fuera del alcance de este mapa.
 *   - DECISION.RESPONSABLE_ID se incluye expresamente para detectar
 *     inconsistencias historicas o introducidas por edicion directa.
 */

var MAPA_FK_MVP = {
  PROYECTO: [
    {campo: 'CAMPANA_ID', entidad: 'CAMPANA'}
  ],

  PROYECTO_PRODUCTO: [
    {campo: 'PROYECTO_ID', entidad: 'PROYECTO'},
    {campo: 'PRODUCTO_ID', entidad: 'PRODUCTO'}
  ],

  PROCESO: [
    {campo: 'PRODUCTO_ID', entidad: 'PRODUCTO'}
  ],

  TAREA: [
    {campo: 'PROCESO_ID', entidad: 'PROCESO'}
  ],

  TAREA_RESPONSABLE: [
    {campo: 'TAREA_ID', entidad: 'TAREA'},
    {campo: 'PERSONA_EQUIPO_ID', entidad: 'PERSONA_EQUIPO'}
  ],

  PRODUCTO_MATERIAL: [
    {campo: 'PRODUCTO_ID', entidad: 'PRODUCTO'},
    {campo: 'MATERIAL_ID', entidad: 'MATERIAL'}
  ],

  TAREA_MATERIAL: [
    {campo: 'TAREA_ID', entidad: 'TAREA'},
    {campo: 'MATERIAL_ID', entidad: 'MATERIAL'}
  ],

  MATERIAL: [
    {campo: 'PROVEEDOR_ID', entidad: 'PROVEEDOR'}
  ],

  DECISION: [
    {campo: 'PROYECTO_ID', entidad: 'PROYECTO'},
    {campo: 'RESPONSABLE_ID', entidad: 'PERSONA_EQUIPO'}
  ]
};

function obtenerIdsDeEntidad_(entidad) {
  var valores = cacheLecturaValoresMostrados_(entidad, function () {
    instrumentacionRegistrarLecturaHoja_();
    var hoja = obtenerHojaEntidad_(entidad);
    return hoja.getDataRange().getDisplayValues();
  });

  var idxId = valores[0].indexOf('ID');

  return valores.slice(1)
    .map(function (fila) {
      return fila[idxId];
    })
    .filter(function (id) {
      return id !== '';
    });
}

function detectarIdsDuplicados(entidad) {
  var ids = obtenerIdsDeEntidad_(entidad);
  var conteo = {};

  ids.forEach(function (id) {
    conteo[id] = (conteo[id] || 0) + 1;
  });

  return Object.keys(conteo)
    .filter(function (id) {
      return conteo[id] > 1;
    })
    .map(function (id) {
      return {
        id: id,
        ocurrencias: conteo[id]
      };
    });
}

function detectarReferenciasHuerfanas(entidad) {
  var reglas = MAPA_FK_MVP[entidad];

  if (!reglas || reglas.length === 0) {
    return [];
  }

  var valores = cacheLecturaValoresMostrados_(entidad, function () {
    instrumentacionRegistrarLecturaHoja_();
    var hoja = obtenerHojaEntidad_(entidad);
    return hoja.getDataRange().getDisplayValues();
  });

  if (!valores || valores.length < 2) {
    return [];
  }

  var encabezados = valores[0];
  var idxId = encabezados.indexOf('ID');
  var idxActivo = encabezados.indexOf('ACTIVO');

  var idsPorEntidadDestino = {};

  reglas.forEach(function (regla) {
    if (!idsPorEntidadDestino[regla.entidad]) {
      idsPorEntidadDestino[regla.entidad] =
        obtenerIdsDeEntidad_(regla.entidad);
    }
  });

  var huerfanas = [];

  valores.slice(1).forEach(function (fila) {
    /*
     * Los registros desactivados se conservan como histórico
     * y no bloquean la integridad de los datos operativos.
     */
    if (
      idxActivo !== -1 &&
      String(fila[idxActivo] || '').trim() !== 'SÍ'
    ) {
      return;
    }

    reglas.forEach(function (regla) {
      var idxCampo =
        encabezados.indexOf(regla.campo);

      if (idxCampo === -1) {
        return;
      }

      var valorFk =
        String(fila[idxCampo] || '').trim();

      if (!valorFk) {
        return;
      }

      var idsDestino =
        idsPorEntidadDestino[regla.entidad] || [];

      if (idsDestino.indexOf(valorFk) === -1) {
        huerfanas.push({
          registroId:
            idxId !== -1
              ? String(fila[idxId] || '').trim()
              : '',
          campo: regla.campo,
          entidadDestino: regla.entidad,
          valorReferenciado: valorFk
        });
      }
    });
  });

  return huerfanas;
}

function detectarProblemasProveedor_(agregar) {
  var proveedoresActivos =
    listarRegistros(
      'PROVEEDOR',
      {ACTIVO: 'SÍ'}
    );

  var proveedoresPorCodigo = {};

  proveedoresActivos.forEach(function (proveedor) {
    var codigo =
      String(proveedor.CODIGO || '')
        .trim()
        .toUpperCase();

    if (!codigo) {
      return;
    }

    if (!proveedoresPorCodigo[codigo]) {
      proveedoresPorCodigo[codigo] = [];
    }

    proveedoresPorCodigo[codigo]
      .push(proveedor.ID);
  });

  Object.keys(proveedoresPorCodigo)
    .forEach(function (codigo) {
      var ids =
        proveedoresPorCodigo[codigo];

      if (ids.length <= 1) {
        return;
      }

      ids.forEach(function (proveedorId) {
        agregar(
          'FUNC-PRV-001',
          'PROVEEDOR',
          proveedorId,
          'Proveedor activo con CODIGO duplicado: ' +
            codigo +
            '. Registros afectados: ' +
            ids.join(', ') +
            '.',
          'ERROR',
          'Asignar un CODIGO unico a cada proveedor.'
        );
      });
    });

  var proveedoresPorNifCif = {};

  proveedoresActivos.forEach(function (proveedor) {
    var nifCif =
      String(proveedor.NIF_CIF || '')
        .trim()
        .toUpperCase();

    if (!nifCif) {
      return;
    }

    if (!proveedoresPorNifCif[nifCif]) {
      proveedoresPorNifCif[nifCif] = [];
    }

    proveedoresPorNifCif[nifCif]
      .push(proveedor.ID);
  });

  Object.keys(proveedoresPorNifCif)
    .forEach(function (nifCif) {
      var ids =
        proveedoresPorNifCif[nifCif];

      if (ids.length <= 1) {
        return;
      }

      ids.forEach(function (proveedorId) {
        agregar(
          'FUNC-PRV-002',
          'PROVEEDOR',
          proveedorId,
          'Proveedor activo con NIF_CIF duplicado: ' +
            nifCif +
            '. Registros afectados: ' +
            ids.join(', ') +
            '.',
          'ERROR',
          'Asignar un NIF_CIF unico a cada proveedor o dejarlo vacio si no se dispone del dato.'
        );
      });
    });

  proveedoresActivos.forEach(function (proveedor) {
    var email =
      String(proveedor.EMAIL || '').trim();

    if (!email) {
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      agregar(
        'FUNC-PRV-003',
        'PROVEEDOR',
        proveedor.ID,
        'Proveedor activo con EMAIL no valido: ' +
          email +
          '.',
        'ERROR',
        'Corregir el EMAIL o dejarlo vacio si no se dispone del dato.'
      );
    }
  });

  proveedoresActivos.forEach(function (proveedor) {
    var plazoRaw =
      proveedor.PLAZO_ENTREGA_DIAS;

    if (
      plazoRaw === '' ||
      plazoRaw === null ||
      plazoRaw === undefined
    ) {
      return;
    }

    var plazo =
      Number(plazoRaw);

    if (
      !Number.isFinite(plazo) ||
      plazo < 0 ||
      !Number.isInteger(plazo)
    ) {
      agregar(
        'FUNC-PRV-004',
        'PROVEEDOR',
        proveedor.ID,
        'Proveedor activo con PLAZO_ENTREGA_DIAS no valido: ' +
          String(plazoRaw) +
          '.',
        'ERROR',
        'Corregir PLAZO_ENTREGA_DIAS para que sea un numero entero igual o mayor que 0, o dejarlo vacio.'
      );
    }
  });

  var estadosProveedorValidos =
    obtenerCatalogo('CFG_ESTADO_PROVEEDOR')
      .map(function (estado) {
        return String(estado || '')
          .trim()
          .toUpperCase();
      })
      .filter(function (estado) {
        return estado !== '';
      });

  proveedoresActivos.forEach(function (proveedor) {
    var estadoRaw =
      String(proveedor.ESTADO || '').trim();

    var estadoNormalizado =
      estadoRaw.toUpperCase();

    if (
      !estadoNormalizado ||
      estadosProveedorValidos.indexOf(
        estadoNormalizado
      ) === -1
    ) {
      agregar(
        'FUNC-PRV-005',
        'PROVEEDOR',
        proveedor.ID,
        'Proveedor activo con ESTADO no valido: ' +
          (estadoRaw ? estadoRaw : '[VACIO]') +
          '.',
        'ERROR',
        'Asignar un ESTADO incluido en CFG_ESTADO_PROVEEDOR.'
      );
    }
  });
}

function detectarProblemasMaterial_(agregar) {
  /*
   * FUNC-MAT-002
   * Material activo vinculado a un proveedor existente,
   * pero lógicamente inactivo o con estado distinto de Activo.
   *
   * Los PROVEEDOR_ID inexistentes no se incluyen aquí:
   * ya están cubiertos por referenciasHuerfanas.
   */
  var proveedoresPorId = {};

  listarRegistros(
    'PROVEEDOR',
    {}
  ).forEach(function (proveedor) {
    var proveedorId =
      String(
        proveedor.ID || ''
      ).trim();

    if (!proveedorId) {
      return;
    }

    proveedoresPorId[proveedorId] =
      proveedor;
  });

  listarRegistros(
    'MATERIAL',
    {ACTIVO: 'SÍ'}
  ).forEach(function (material) {
    var proveedorId =
      String(
        material.PROVEEDOR_ID || ''
      ).trim();

    /*
     * PROVEEDOR_ID es opcional.
     */
    if (!proveedorId) {
      return;
    }

    var proveedor =
      proveedoresPorId[proveedorId];

    /*
     * La referencia inexistente se deja al detector
     * genérico de referencias huérfanas.
     */
    if (!proveedor) {
      return;
    }

    var proveedorActivo =
      String(
        proveedor.ACTIVO || ''
      )
        .trim()
        .toUpperCase() === 'SÍ';

    var estadoProveedor =
      String(
        proveedor.ESTADO || ''
      )
        .trim()
        .toUpperCase();

    if (
      !proveedorActivo ||
      estadoProveedor !== 'ACTIVO'
    ) {
      agregar(
        'FUNC-MAT-002',
        'MATERIAL',
        material.ID,
        'Material activo vinculado a un proveedor no operativo: ' +
          proveedorId +
          '. ACTIVO=' +
          String(proveedor.ACTIVO || '[VACIO]') +
          ', ESTADO=' +
          String(proveedor.ESTADO || '[VACIO]') +
          '.',
        'ERROR',
        'Asignar un proveedor operativo al material o retirar temporalmente la vinculacion.'
      );
    }
  });
  /*
   * Relaciones proyecto-producto.
   */
  /*
   * FUNC-MAT-003
   * Valores negativos en campos cuantitativos de materiales activos.
   */
  listarRegistros(
    'MATERIAL',
    {ACTIVO: 'SÍ'}
  ).forEach(function (material) {
    [
      'STOCK_ACTUAL',
      'STOCK_MINIMO',
      'CANTIDAD_RESERVADA'
    ].forEach(function (campo) {
      var valorRaw =
        material[campo];

      /*
       * Los valores vacíos no se evalúan en esta regla.
       */
      if (
        valorRaw === '' ||
        valorRaw === null ||
        valorRaw === undefined
      ) {
        return;
      }

      var valor =
        Number(valorRaw);

      if (
        Number.isFinite(valor) &&
        valor < 0
      ) {
        agregar(
          'FUNC-MAT-003',
          'MATERIAL',
          material.ID,
          'Material activo con ' +
            campo +
            ' negativo: ' +
            String(valorRaw) +
            '.',
          'ERROR',
          'Corregir ' +
            campo +
            ' para que sea igual o mayor que 0.'
        );
      }
    });
  });

  /*
   * FUNC-MAT-004
   * Valores no numéricos en campos cuantitativos
   * de materiales activos.
   */
  listarRegistros(
    'MATERIAL',
    {ACTIVO: 'SÍ'}
  ).forEach(function (material) {
    [
      'STOCK_ACTUAL',
      'STOCK_MINIMO',
      'CANTIDAD_RESERVADA'
    ].forEach(function (campo) {
      var valorRaw =
        material[campo];

      /*
       * Los valores vacíos no se evalúan.
       */
      if (
        valorRaw === '' ||
        valorRaw === null ||
        valorRaw === undefined
      ) {
        return;
      }

      var valor =
        Number(valorRaw);

      if (!Number.isFinite(valor)) {
        agregar(
          'FUNC-MAT-004',
          'MATERIAL',
          material.ID,
          'Material activo con ' +
            campo +
            ' no numerico: ' +
            String(valorRaw) +
            '.',
          'ERROR',
          'Corregir ' +
            campo +
            ' para que contenga un valor numerico o dejarlo vacio si corresponde.'
        );
      }
    });
  });


    /*
   * FUNC-MAT-005
   * ESTADO vacío o no incluido en CFG_ESTADO_MATERIAL
   * para materiales lógicamente activos.
   */
  var estadosMaterialValidos =
    obtenerCatalogo('CFG_ESTADO_MATERIAL')
      .map(function (estado) {
        return String(estado || '')
          .trim()
          .toUpperCase();
      })
      .filter(function (estado) {
        return estado !== '';
      });

  listarRegistros(
    'MATERIAL',
    {ACTIVO: 'SÍ'}
  ).forEach(function (material) {
    var estadoRaw =
      String(
        material.ESTADO || ''
      ).trim();

    var estadoNormalizado =
      estadoRaw.toUpperCase();

    if (
      !estadoNormalizado ||
      estadosMaterialValidos.indexOf(
        estadoNormalizado
      ) === -1
    ) {
      agregar(
        'FUNC-MAT-005',
        'MATERIAL',
        material.ID,
        'Material activo con ESTADO no valido: ' +
          (
            estadoRaw
              ? estadoRaw
              : '[VACIO]'
          ) +
          '.',
        'ERROR',
        'Asignar un ESTADO incluido en CFG_ESTADO_MATERIAL.'
      );
    }
  });
  /*
   * Relaciones proyecto-producto.
   */

    /*
   * FUNC-MAT-006
   * UNIDAD vacía o no incluida en CFG_UNIDAD
   * para materiales lógicamente activos.
   */
  var unidadesMaterialValidas =
    obtenerCatalogo('CFG_UNIDAD')
      .map(function (unidad) {
        return String(unidad || '')
          .trim()
          .toUpperCase();
      })
      .filter(function (unidad) {
        return unidad !== '';
      });

  listarRegistros(
    'MATERIAL',
    {ACTIVO: 'SÍ'}
  ).forEach(function (material) {
    var unidadRaw =
      String(
        material.UNIDAD || ''
      ).trim();

    var unidadNormalizada =
      unidadRaw.toUpperCase();

    if (
      !unidadNormalizada ||
      unidadesMaterialValidas.indexOf(
        unidadNormalizada
      ) === -1
    ) {
      agregar(
        'FUNC-MAT-006',
        'MATERIAL',
        material.ID,
        'Material activo con UNIDAD no valida: ' +
          (
            unidadRaw
              ? unidadRaw
              : '[VACIO]'
          ) +
          '.',
        'ERROR',
        'Asignar una UNIDAD incluida en CFG_UNIDAD.'
      );
    }
  });

    /*
   * FUNC-MAT-007
   * CODIGO duplicado entre materiales activos.
   */
  var materialesActivos =
    listarRegistros(
      'MATERIAL',
      {ACTIVO: 'SÍ'}
    );

  var materialesPorCodigo = {};

  materialesActivos
    .forEach(function (material) {
      var codigo =
        String(
          material.CODIGO || ''
        )
          .trim()
          .toUpperCase();

      /*
       * Un código vacío se auditará en una regla
       * específica de obligatoriedad, no como duplicidad.
       */
      if (!codigo) {
        return;
      }

      if (!materialesPorCodigo[codigo]) {
        materialesPorCodigo[codigo] = [];
      }

      materialesPorCodigo[codigo]
        .push(material.ID);
    });

  Object.keys(materialesPorCodigo)
    .forEach(function (codigo) {
      var ids =
        materialesPorCodigo[codigo];

      if (ids.length <= 1) {
        return;
      }

      ids.forEach(function (materialId) {
        agregar(
          'FUNC-MAT-007',
          'MATERIAL',
          materialId,
          'Material activo con CODIGO duplicado: ' +
            codigo +
            '. Registros afectados: ' +
            ids.join(', ') +
            '.',
          'ERROR',
          'Asignar un CODIGO unico a cada material activo.'
        );
      });
    });



  /*
   * FUNC-MAT-008
   * CODIGO vacío en material activo.
   */
  materialesActivos
    .forEach(function (material) {
      var codigo =
        String(
          material.CODIGO || ''
        ).trim();

      if (!codigo) {
        agregar(
          'FUNC-MAT-008',
          'MATERIAL',
          material.ID,
          'Material activo sin CODIGO informado.',
          'ERROR',
          'Asignar un CODIGO unico al material.'
        );
      }
    });

  /*
   * FUNC-MAT-009
   * NOMBRE vacío en material activo.
   */
  materialesActivos
    .forEach(function (material) {
      var nombre =
        String(
          material.NOMBRE || ''
        ).trim();

      if (!nombre) {
        agregar(
          'FUNC-MAT-009',
          'MATERIAL',
          material.ID,
          'Material activo sin NOMBRE informado.',
          'ERROR',
          'Asignar un NOMBRE al material.'
        );
      }
    });

  /*
   * FUNC-MAT-010
   * CATEGORIA vacía o no incluida en
   * CFG_CATEGORIA_MATERIAL para materiales activos.
   */
  var categoriasMaterialValidas =
    obtenerCatalogo(
      'CFG_CATEGORIA_MATERIAL'
    )
      .map(function (categoria) {
        return String(
          categoria || ''
        )
          .trim()
          .toUpperCase();
      })
      .filter(function (categoria) {
        return categoria !== '';
      });

  materialesActivos
    .forEach(function (material) {
      var categoriaRaw =
        String(
          material.CATEGORIA || ''
        ).trim();

      var categoriaNormalizada =
        categoriaRaw.toUpperCase();

      if (
        !categoriaNormalizada ||
        categoriasMaterialValidas.indexOf(
          categoriaNormalizada
        ) === -1
      ) {
        agregar(
          'FUNC-MAT-010',
          'MATERIAL',
          material.ID,
          'Material activo con CATEGORIA no valida: ' +
            (
              categoriaRaw
                ? categoriaRaw
                : '[VACIO]'
            ) +
            '.',
          'ERROR',
          'Asignar una CATEGORIA incluida en CFG_CATEGORIA_MATERIAL.'
        );
      }
    });
}

function detectarProblemasDecision_(agregar) {
  listarRegistros('DECISION', {ACTIVO: 'SÍ'})
    .forEach(function (d) {
      var esEstadoCierre =
        typeof ESTADOS_DECISION_CIERRE_ !==
          'undefined' &&
        ESTADOS_DECISION_CIERRE_
          .indexOf(d.ESTADO) !== -1;

      var tieneResolucion =
        d.RESOLUCION !== null &&
        d.RESOLUCION !== undefined &&
        String(d.RESOLUCION).trim() !== '';

      var tieneFechaResolucion =
        d.FECHA_RESOLUCION !== null &&
        d.FECHA_RESOLUCION !== undefined &&
        String(d.FECHA_RESOLUCION).trim() !== '';

      var tieneFechaLimite =
        d.FECHA_LIMITE !== null &&
        d.FECHA_LIMITE !== undefined &&
        String(d.FECHA_LIMITE).trim() !== '';

      if (
        tieneFechaResolucion &&
        d.FECHA_CREACION
      ) {
        var fechaResolucion =
          d.FECHA_RESOLUCION instanceof Date
            ? d.FECHA_RESOLUCION
            : new Date(d.FECHA_RESOLUCION);

        var fechaCreacion =
          d.FECHA_CREACION instanceof Date
            ? d.FECHA_CREACION
            : new Date(d.FECHA_CREACION);

        if (
          !isNaN(fechaResolucion.getTime()) &&
          !isNaN(fechaCreacion.getTime()) &&
          fechaResolucion.getTime() <
            fechaCreacion.getTime()
        ) {
          agregar(
            'FUNC-DEC-003',
            'DECISION',
            d.ID,
            'FECHA_RESOLUCION es anterior a FECHA_CREACION.',
            'ERROR',
            'Corregir la fecha de resolucion o la fecha de creacion.'
          );
        }
      }

      if (
        tieneFechaLimite &&
        d.FECHA_CREACION
      ) {
        var fechaLimite =
          d.FECHA_LIMITE instanceof Date
            ? d.FECHA_LIMITE
            : new Date(d.FECHA_LIMITE);

        var fechaCreacionLimite =
          d.FECHA_CREACION instanceof Date
            ? d.FECHA_CREACION
            : new Date(d.FECHA_CREACION);

        if (
          !isNaN(fechaLimite.getTime()) &&
          !isNaN(fechaCreacionLimite.getTime()) &&
          fechaLimite.getTime() <
            fechaCreacionLimite.getTime()
        ) {
          agregar(
            'FUNC-DEC-004',
            'DECISION',
            d.ID,
            'FECHA_LIMITE es anterior a FECHA_CREACION.',
            'ERROR',
            'Corregir la fecha limite o la fecha de creacion.'
          );
        }
      }

      if (esEstadoCierre) {
        if (
          !tieneResolucion ||
          !tieneFechaResolucion
        ) {
          agregar(
            'FUNC-DEC-001',
            'DECISION',
            d.ID,
            'Decision en estado de cierre (' +
              d.ESTADO +
              ') sin resolucion y/o fecha de resolucion.',
            'ERROR',
            'Completar resolucion y fecha de resolucion.'
          );
        }

        return;
      }

      if (
        tieneResolucion ||
        tieneFechaResolucion
      ) {
        agregar(
          'FUNC-DEC-002',
          'DECISION',
          d.ID,
          'Decision en estado abierto (' +
            d.ESTADO +
            ') con resolucion y/o fecha de resolucion informada.',
          'ERROR',
          'Eliminar los datos de cierre o actualizar la decision a un estado de cierre.'
        );
      }
    });
}

function detectarProblemasIncidencia_(agregar) {
  listarRegistros('INCIDENCIA', {ACTIVO: 'SÍ'})
    .forEach(function (inc) {
      var esEstadoCierre =
        typeof ESTADOS_INCIDENCIA_CIERRE_ !==
          'undefined' &&
        ESTADOS_INCIDENCIA_CIERRE_
          .indexOf(inc.ESTADO) !== -1;

      /*
       * FUNC-INC-001
       * Incidencia en estado de cierre sin fecha de resolución.
       */
      if (
        esEstadoCierre &&
        !inc.FECHA_RESOLUCION
      ) {
        agregar(
          'FUNC-INC-001',
          'INCIDENCIA',
          inc.ID,
          'Incidencia en estado de cierre (' +
            inc.ESTADO +
            ') sin fecha de resolucion.',
          'ERROR',
          'Completar la fecha de resolucion.'
        );
      }

      /*
       * FUNC-INC-002
       * Incidencia crítica o de seguridad cerrada
       * sin acción correctora.
       */
      var esCriticaOSeguridad =
        inc.PRIORIDAD === 'Alta' ||
        inc.TIPO === 'Seguridad';

      if (
        esEstadoCierre &&
        esCriticaOSeguridad &&
        !String(
          inc.ACCION_CORRECTORA || ''
        ).trim()
      ) {
        agregar(
          'FUNC-INC-002',
          'INCIDENCIA',
          inc.ID,
          'Incidencia critica o de seguridad cerrada sin accion correctora.',
          'ERROR',
          'Registrar la accion correctora.'
        );
      }

      /*
       * FUNC-INC-003
       * Fecha de resolución anterior a la fecha de detección.
       */
      if (
        inc.FECHA_DETECCION &&
        inc.FECHA_RESOLUCION
      ) {
        var fechaDeteccion =
          inc.FECHA_DETECCION instanceof Date
            ? new Date(
                inc.FECHA_DETECCION.getTime()
              )
            : new Date(
                inc.FECHA_DETECCION
              );

        var fechaResolucionInc =
          inc.FECHA_RESOLUCION instanceof Date
            ? new Date(
                inc.FECHA_RESOLUCION.getTime()
              )
            : new Date(
                inc.FECHA_RESOLUCION
              );

        var fechaDeteccionValida =
          !isNaN(fechaDeteccion.getTime());

        var fechaResolucionIncValida =
          !isNaN(fechaResolucionInc.getTime());

        if (
          fechaDeteccionValida &&
          fechaResolucionIncValida
        ) {
          fechaDeteccion.setHours(
            0,
            0,
            0,
            0
          );

          fechaResolucionInc.setHours(
            0,
            0,
            0,
            0
          );

          if (
            fechaResolucionInc.getTime() <
            fechaDeteccion.getTime()
          ) {
            agregar(
              'FUNC-INC-003',
              'INCIDENCIA',
              inc.ID,
              'Incidencia con fecha de resolucion anterior a la fecha de deteccion.',
              'ERROR',
              'Corregir FECHA_RESOLUCION para que sea igual o posterior a FECHA_DETECCION.'
            );
          }
        }
      }
    });
}

function detectarProblemasStock_(agregar) {
  listarRegistros('MATERIAL', {ACTIVO: 'SÍ'})
    .forEach(function (mat) {
      var stock = Number(mat.STOCK_ACTUAL) || 0;
      var reservado =
        Number(mat.CANTIDAD_RESERVADA) || 0;
      var minimo = Number(mat.STOCK_MINIMO) || 0;

      if (reservado > stock) {
        agregar(
          'FUNC-STOCK-001',
          'MATERIAL',
          mat.ID,
          'La cantidad reservada (' +
            reservado +
            ') supera el stock actual (' +
            stock +
            ').',
          'ERROR',
          'Revisar y ajustar la reserva o reponer stock.'
        );
      }

      if (
        stock >= 0 &&
        stock <= minimo
      ) {
        agregar(
          'FUNC-STOCK-002',
          'MATERIAL',
          mat.ID,
          'Stock actual (' +
            stock +
            ') igual o por debajo del minimo (' +
            minimo +
            ').',
          'ADVERTENCIA',
          'Planificar reposicion.'
        );
      }
    });
}

function detectarProblemasTareaMaterial_(agregar) {
  listarRegistros(
    'TAREA_MATERIAL',
    {ACTIVO: 'SÍ'}
  ).forEach(function (tm) {
    var consumidaRaw =
      tm.CANTIDAD_CONSUMIDA;

    var desperdiciadaRaw =
      tm.CANTIDAD_DESPERDICIADA;

    var previstaRaw =
      tm.CANTIDAD_PREVISTA;

    var consumida =
      Number(consumidaRaw);

    var desperdiciada =
      Number(desperdiciadaRaw);

    var prevista =
      Number(previstaRaw);

    /*
     * FUNC-TMA-001
     * Cantidad consumida negativa.
     */
    if (
      Number.isFinite(consumida) &&
      consumida < 0
    ) {
      agregar(
        'FUNC-TMA-001',
        'TAREA_MATERIAL',
        tm.ID,
        'TAREA_MATERIAL con CANTIDAD_CONSUMIDA negativa: ' +
          consumida +
          '.',
        'ERROR',
        'Corregir CANTIDAD_CONSUMIDA para que sea igual o mayor que 0.'
      );
    }

    /*
     * FUNC-TMA-002
     * Cantidad desperdiciada negativa.
     */
    if (
      Number.isFinite(desperdiciada) &&
      desperdiciada < 0
    ) {
      agregar(
        'FUNC-TMA-002',
        'TAREA_MATERIAL',
        tm.ID,
        'TAREA_MATERIAL con CANTIDAD_DESPERDICIADA negativa: ' +
          desperdiciada +
          '.',
        'ERROR',
        'Corregir CANTIDAD_DESPERDICIADA para que sea igual o mayor que 0.'
      );
    }

    /*
     * FUNC-MAT-001
     * Consumo más desperdicio superior a lo previsto
     * sin motivo de desviación.
     */
    if (
      Number.isFinite(consumida) &&
      Number.isFinite(desperdiciada) &&
      Number.isFinite(prevista) &&
      consumida >= 0 &&
      desperdiciada >= 0 &&
      consumida + desperdiciada > prevista &&
      !String(
        tm.MOTIVO_DESVIACION || ''
      ).trim()
    ) {
      agregar(
        'FUNC-MAT-001',
        'TAREA_MATERIAL',
        tm.ID,
        'Consumo mas desperdicio (' +
          (consumida + desperdiciada) +
          ') supera lo previsto (' +
          prevista +
          ') sin motivo de desviacion registrado.',
        'ERROR',
        'Registrar motivo de desviacion o corregir cantidades.'
      );
    }
  });
}

function detectarProblemasTarea_(agregar) {
  var tareasActivas = listarRegistros('TAREA', {ACTIVO: 'SÍ'});
  var tareasActivasPorId = {};

  tareasActivas.forEach(function (tarea) {
    var tareaId = String(tarea.ID || '').trim().toUpperCase();
    if (tareaId) {
      tareasActivasPorId[tareaId] = tarea;
    }
  });

  tareasActivas
    .forEach(function (t) {
      if (
        t.ESTADO === 'Terminada' &&
        Number(t.PORCENTAJE_AVANCE) !== 100
      ) {
        agregar(
          'FUNC-TAREA-001',
          'TAREA',
          t.ID,
          'Tarea Terminada con porcentaje de avance distinto de 100 (' +
            t.PORCENTAJE_AVANCE +
            ').',
          'ERROR',
          'Corregir el porcentaje de avance o el estado.'
        );
      }
      var fechaInicioRealTarea =
        t.FECHA_INICIO_REAL instanceof Date
          ? new Date(t.FECHA_INICIO_REAL.getTime())
          : new Date(t.FECHA_INICIO_REAL);

      var fechaFinRealTarea =
        t.FECHA_FIN_REAL instanceof Date
          ? new Date(t.FECHA_FIN_REAL.getTime())
          : new Date(t.FECHA_FIN_REAL);

      if (
        !isNaN(fechaInicioRealTarea.getTime()) &&
        !isNaN(fechaFinRealTarea.getTime()) &&
        fechaFinRealTarea.getTime() < fechaInicioRealTarea.getTime()
      ) {
        agregar(
          'FUNC-TAREA-002',
          'TAREA',
          t.ID,
          'Tarea con FECHA_FIN_REAL anterior a FECHA_INICIO_REAL.',
          'ERROR',
          'Corregir FECHA_INICIO_REAL o FECHA_FIN_REAL.'
        );
      }
      var fechaInicioPlanTarea =
        t.FECHA_INICIO_PLAN instanceof Date
          ? new Date(t.FECHA_INICIO_PLAN.getTime())
          : new Date(t.FECHA_INICIO_PLAN);

      var fechaFinPlanTarea =
        t.FECHA_FIN_PLAN instanceof Date
          ? new Date(t.FECHA_FIN_PLAN.getTime())
          : new Date(t.FECHA_FIN_PLAN);

      if (
        !isNaN(fechaInicioPlanTarea.getTime()) &&
        !isNaN(fechaFinPlanTarea.getTime()) &&
        fechaFinPlanTarea.getTime() < fechaInicioPlanTarea.getTime()
      ) {
        agregar(
          'FUNC-TAREA-003',
          'TAREA',
          t.ID,
          'Tarea con FECHA_FIN_PLAN anterior a FECHA_INICIO_PLAN.',
          'ERROR',
          'Corregir FECHA_INICIO_PLAN o FECHA_FIN_PLAN.'
        );
      }
      var tieneFechaInicioRealTarea =
        t.FECHA_INICIO_REAL !== undefined &&
        t.FECHA_INICIO_REAL !== null &&
        String(t.FECHA_INICIO_REAL).trim() !== '';

      if (
        (t.ESTADO === 'Pendiente' || t.ESTADO === 'Preparada') &&
        tieneFechaInicioRealTarea
      ) {
        agregar(
          'FUNC-TAREA-004',
          'TAREA',
          t.ID,
          'Tarea en estado ' + t.ESTADO + ' con FECHA_INICIO_REAL informada.',
          'ERROR',
          'Eliminar FECHA_INICIO_REAL o corregir el estado de la tarea.'
        );
      }
      var tieneFechaInicioRealEnProceso =
        t.FECHA_INICIO_REAL !== undefined &&
        t.FECHA_INICIO_REAL !== null &&
        String(t.FECHA_INICIO_REAL).trim() !== '';

      if (
        t.ESTADO === 'En proceso' &&
        !tieneFechaInicioRealEnProceso
      ) {
        agregar(
          'FUNC-TAREA-005',
          'TAREA',
          t.ID,
          'Tarea En proceso sin FECHA_INICIO_REAL.',
          'ERROR',
          'Informar FECHA_INICIO_REAL o corregir el estado de la tarea.'
        );
      }
      var tieneFechaInicioRealTerminada =
        t.FECHA_INICIO_REAL !== undefined &&
        t.FECHA_INICIO_REAL !== null &&
        String(t.FECHA_INICIO_REAL).trim() !== '';

      if (
        t.ESTADO === 'Terminada' &&
        !tieneFechaInicioRealTerminada
      ) {
        agregar(
          'FUNC-TAREA-006',
          'TAREA',
          t.ID,
          'Tarea Terminada sin FECHA_INICIO_REAL.',
          'ERROR',
          'Informar FECHA_INICIO_REAL o corregir el estado de la tarea.'
        );
      }
      var tieneFechaFinRealTerminada =
        t.FECHA_FIN_REAL !== undefined &&
        t.FECHA_FIN_REAL !== null &&
        String(t.FECHA_FIN_REAL).trim() !== '';

      if (
        t.ESTADO === 'Terminada' &&
        !tieneFechaFinRealTerminada
      ) {
        agregar(
          'FUNC-TAREA-007',
          'TAREA',
          t.ID,
          'Tarea Terminada sin FECHA_FIN_REAL.',
          'ERROR',
          'Informar FECHA_FIN_REAL o corregir el estado de la tarea.'
        );
      }
      var tieneDuracionRealTerminada =
        t.DURACION_REAL_DIAS !== undefined &&
        t.DURACION_REAL_DIAS !== null &&
        String(t.DURACION_REAL_DIAS).trim() !== '';

      if (
        t.ESTADO === 'Terminada' &&
        !tieneDuracionRealTerminada
      ) {
        agregar(
          'FUNC-TAREA-008',
          'TAREA',
          t.ID,
          'Tarea Terminada sin DURACION_REAL_DIAS.',
          'ERROR',
          'Informar DURACION_REAL_DIAS o corregir el estado de la tarea.'
        );
      }
      var valorDuracionRealTarea = Number(t.DURACION_REAL_DIAS);

      if (
        t.ESTADO === 'Terminada' &&
        tieneDuracionRealTerminada &&
        (isNaN(valorDuracionRealTarea) || valorDuracionRealTarea <= 0)
      ) {
        agregar(
          'FUNC-TAREA-009',
          'TAREA',
          t.ID,
          'Tarea Terminada con DURACION_REAL_DIAS no numérica o menor o igual que 0.',
          'ERROR',
          'Informar una DURACION_REAL_DIAS numérica mayor que 0.'
        );
      }
      var tareaPredecesoraId =
        String(t.TAREA_PREDECESORA_ID || '')
          .trim()
          .toUpperCase();

      if (
        tareaPredecesoraId &&
        !tareasActivasPorId[tareaPredecesoraId]
      ) {
        agregar(
          'FUNC-TAREA-010',
          'TAREA',
          t.ID,
          'TAREA con TAREA_PREDECESORA_ID inexistente: ' + tareaPredecesoraId + '.',
          'ERROR',
          'Corregir TAREA_PREDECESORA_ID o eliminar la referencia huérfana.'
        );
      }

      var tareaPredecesora =
        tareaPredecesoraId
          ? tareasActivasPorId[tareaPredecesoraId]
          : null;

      var procesoTareaActual =
        String(t.PROCESO_ID || '')
          .trim()
          .toUpperCase();

      var procesoTareaPredecesora =
        tareaPredecesora
          ? String(tareaPredecesora.PROCESO_ID || '')
              .trim()
              .toUpperCase()
          : '';

      if (
        tareaPredecesora &&
        procesoTareaActual &&
        procesoTareaPredecesora &&
        procesoTareaActual !== procesoTareaPredecesora
      ) {
        agregar(
          'FUNC-TAREA-011',
          'TAREA',
          t.ID,
          'TAREA con TAREA_PREDECESORA_ID perteneciente a otro PROCESO_ID: ' +
            tareaPredecesoraId +
            ' (' + procesoTareaPredecesora + ' != ' + procesoTareaActual + ').',
          'ERROR',
          'Asignar una tarea predecesora del mismo PROCESO_ID o corregir la relación.'
        );
      }

      var ordenTareaActual =
        Number(t.ORDEN_SECUENCIA);

      var ordenTareaPredecesora =
        tareaPredecesora
          ? Number(tareaPredecesora.ORDEN_SECUENCIA)
          : NaN;

      if (
        tareaPredecesora &&
        procesoTareaActual &&
        procesoTareaActual === procesoTareaPredecesora &&
        !isNaN(ordenTareaActual) &&
        !isNaN(ordenTareaPredecesora) &&
        ordenTareaPredecesora >= ordenTareaActual
      ) {
        agregar(
          'FUNC-TAREA-012',
          'TAREA',
          t.ID,
          'TAREA con ORDEN_SECUENCIA de la TAREA_PREDECESORA_ID igual o posterior: ' +
            tareaPredecesoraId +
            ' (' + ordenTareaPredecesora + ' >= ' + ordenTareaActual + ').',
          'ERROR',
          'Corregir ORDEN_SECUENCIA o asignar una tarea predecesora anterior.'
        );
      }
    });
}

/**
 * Agrupa una lista plana de asignaciones {personaId, etiqueta, pct,
 * fechaInicio, fechaFin} por persona y calcula, para cada una, la
 * dedicacion maxima que llega a estar simultaneamente activa (barrido
 * temporal / sweep-line). Las asignaciones sin fechas validas se tratan
 * como siempre activas. En empates de instante los inicios se procesan
 * antes que los fines, para que el criterio de solapamiento sea el mismo
 * que usa detectarSolapamientoTemporalTareaResponsable_ (FUNC-REC-002).
 *
 * Devuelve un array de {personaId, maxima, etiquetasEnMaximo}.
 */
function calcularDedicacionMaximaSimultaneaPorPersona_(asignaciones) {
  var porPersona_ = {};

  asignaciones.forEach(function (a) {
    var personaId = String(a.personaId || '').trim();

    if (!personaId) {
      return;
    }

    var fechaInicio =
      a.fechaInicio instanceof Date
        ? new Date(a.fechaInicio.getTime())
        : new Date(a.fechaInicio);

    var fechaFin =
      a.fechaFin instanceof Date
        ? new Date(a.fechaFin.getTime())
        : new Date(a.fechaFin);

    var tieneFechas =
      !isNaN(fechaInicio.getTime()) &&
      !isNaN(fechaFin.getTime());

    if (!porPersona_[personaId]) {
      porPersona_[personaId] = [];
    }

    porPersona_[personaId].push({
      etiqueta: a.etiqueta,
      pct: Number(a.pct) || 0,
      inicio: tieneFechas ? fechaInicio.getTime() : null,
      fin: tieneFechas ? fechaFin.getTime() : null
    });
  });

  return Object.keys(porPersona_).map(function (personaId) {
    var lista = porPersona_[personaId];

    var sinFechas = lista.filter(function (a) { return a.inicio === null; });
    var conFechas = lista.filter(function (a) { return a.inicio !== null; });

    var sumaSinFechas = sinFechas.reduce(function (total, a) {
      return total + a.pct;
    }, 0);

    var maxima = sumaSinFechas;

    var etiquetasEnMaximo = sinFechas.map(function (a) {
      return a.etiqueta;
    });

    if (conFechas.length > 0) {
      var eventos = [];

      conFechas.forEach(function (a) {
        eventos.push({t: a.inicio, tipo: 'inicio', pct: a.pct, etiqueta: a.etiqueta});
        eventos.push({t: a.fin, tipo: 'fin', pct: a.pct, etiqueta: a.etiqueta});
      });

      eventos.sort(function (x, y) {
        if (x.t !== y.t) {
          return x.t - y.t;
        }
        return (x.tipo === 'fin' ? 1 : 0) - (y.tipo === 'fin' ? 1 : 0);
      });

      var acumulado = sumaSinFechas;
      var activasDatadas_ = {};

      eventos.forEach(function (evento) {
        if (evento.tipo === 'inicio') {
          acumulado += evento.pct;
          activasDatadas_[evento.etiqueta] = true;
        } else {
          acumulado -= evento.pct;
          delete activasDatadas_[evento.etiqueta];
        }

        if (acumulado > maxima) {
          maxima = acumulado;
          etiquetasEnMaximo = Object.keys(activasDatadas_).concat(
            sinFechas.map(function (a) { return a.etiqueta; })
          );
        }
      });
    }

    return {
      personaId: personaId,
      maxima: maxima,
      etiquetasEnMaximo: etiquetasEnMaximo
    };
  });
}

function detectarProblemasTareaResponsable_(agregar) {
  var asignaciones = listarRegistros(
    'TAREA_RESPONSABLE',
    {ACTIVO: 'SÍ'}
  ).filter(function (a) {
    return ['Planificada', 'Activa'].indexOf(a.ESTADO) !== -1;
  }).map(function (a) {
    return {
      personaId: a.PERSONA_EQUIPO_ID,
      etiqueta: a.TAREA_ID,
      pct: a.PORCENTAJE_DEDICACION,
      fechaInicio: a.FECHA_INICIO_ASIGNACION,
      fechaFin: a.FECHA_FIN_ASIGNACION
    };
  });

  calcularDedicacionMaximaSimultaneaPorPersona_(asignaciones)
    .forEach(function (resultado) {
      if (resultado.maxima > 100) {
        agregar(
          'FUNC-REC-001',
          'PERSONA_EQUIPO',
          resultado.personaId,
          'Dedicacion simultanea maxima (' +
            resultado.maxima +
            '%) supera el 100% en las tareas: ' +
            resultado.etiquetasEnMaximo.join(', ') +
            '.',
          'ADVERTENCIA',
          'Redistribuir la carga o revisar las fechas/porcentajes de las asignaciones solapadas.'
        );
      }
    });
}

function detectarProblemasAsignacion_(agregar) {
  var asignaciones = listarRegistros(
    'ASIGNACION',
    {ACTIVO: 'SÍ'}
  ).filter(function (a) {
    return ['Planificada', 'Activa'].indexOf(a.ESTADO) !== -1;
  }).map(function (a) {
    return {
      personaId: a.PERSONA_EQUIPO_ID,
      etiqueta: a.ENTIDAD_TIPO + ':' + a.ENTIDAD_ID,
      pct: a.PORCENTAJE_DEDICACION,
      fechaInicio: a.FECHA_INICIO_ASIGNACION,
      fechaFin: a.FECHA_FIN_ASIGNACION
    };
  });

  calcularDedicacionMaximaSimultaneaPorPersona_(asignaciones)
    .forEach(function (resultado) {
      if (resultado.maxima > 100) {
        agregar(
          'FUNC-ASG-001',
          'PERSONA_EQUIPO',
          resultado.personaId,
          'Dedicacion simultanea maxima en ASIGNACION (' +
            resultado.maxima +
            '%) supera el 100% en: ' +
            resultado.etiquetasEnMaximo.join(', ') +
            '.',
          'ADVERTENCIA',
          'Redistribuir la carga o revisar las fechas/porcentajes de las asignaciones solapadas.'
        );
      }
    });
}

function detectarSolapamientoTemporalTareaResponsable_(agregar) {
  var asignacionesPorPersona_ = {};

  listarRegistros(
    'TAREA_RESPONSABLE',
    {ACTIVO: 'SÍ'}
  ).forEach(function (a) {
    if (
      ['Planificada', 'Activa']
        .indexOf(a.ESTADO) === -1
    ) {
      return;
    }

    var fechaInicio =
      a.FECHA_INICIO_ASIGNACION instanceof Date
        ? new Date(a.FECHA_INICIO_ASIGNACION.getTime())
        : new Date(a.FECHA_INICIO_ASIGNACION);

    var fechaFin =
      a.FECHA_FIN_ASIGNACION instanceof Date
        ? new Date(a.FECHA_FIN_ASIGNACION.getTime())
        : new Date(a.FECHA_FIN_ASIGNACION);

    if (
      isNaN(fechaInicio.getTime()) ||
      isNaN(fechaFin.getTime())
    ) {
      return;
    }

    if (!asignacionesPorPersona_[a.PERSONA_EQUIPO_ID]) {
      asignacionesPorPersona_[a.PERSONA_EQUIPO_ID] = [];
    }

    asignacionesPorPersona_[a.PERSONA_EQUIPO_ID].push({
      tareaId: a.TAREA_ID,
      inicio: fechaInicio.getTime(),
      fin: fechaFin.getTime()
    });
  });

  Object.keys(asignacionesPorPersona_)
    .forEach(function (personaId) {
      var asignaciones =
        asignacionesPorPersona_[personaId];

      for (var i = 0; i < asignaciones.length; i++) {
        for (var j = i + 1; j < asignaciones.length; j++) {
          var solapan =
            asignaciones[i].inicio <= asignaciones[j].fin &&
            asignaciones[j].inicio <= asignaciones[i].fin;

          if (solapan) {
            agregar(
              'FUNC-REC-002',
              'PERSONA_EQUIPO',
              personaId,
              'Asignaciones activas solapadas en el tiempo: TAREA ' +
                asignaciones[i].tareaId +
                ' y TAREA ' +
                asignaciones[j].tareaId +
                '.',
              'ADVERTENCIA',
              'Revisar si el solapamiento es intencionado o redistribuir las fechas de asignación.'
            );
          }
        }
      }
    });
}

function detectarProblemasRelacion_(agregar) {
  listarRegistros(
    'RELACION',
    {ACTIVO: 'SÍ'}
  ).forEach(function (r) {
    var origen = String(r.ENTIDAD_ORIGEN_ID || '').trim();
    var destino = String(r.ENTIDAD_DESTINO_ID || '').trim();

    if (origen && destino && origen === destino) {
      agregar(
        'FUNC-GRF-001',
        'RELACION',
        r.ID,
        'La relacion referencia el mismo registro como origen y destino (' +
          origen +
          ').',
        'ERROR',
        'Corregir el registro destino o eliminar la relacion.'
      );
    }
  });
}

function detectarPersonaInactivaConAsignacionActiva_(agregar) {
  var personasPorId_ = {};

  listarRegistros(
    'PERSONA_EQUIPO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (p) {
    personasPorId_[p.ID] = p;
  });

  listarRegistros(
    'TAREA_RESPONSABLE',
    {ACTIVO: 'SÍ'}
  ).forEach(function (a) {
    if (
      ['Planificada', 'Activa']
        .indexOf(a.ESTADO) === -1
    ) {
      return;
    }

    var persona =
      personasPorId_[a.PERSONA_EQUIPO_ID];

    if (persona && persona.ESTADO === 'Inactivo') {
      agregar(
        'FUNC-REC-003',
        'TAREA_RESPONSABLE',
        a.ID,
        'Asignacion ' + a.ESTADO +
          ' de TAREA ' + a.TAREA_ID +
          ' a PERSONA_EQUIPO ' + a.PERSONA_EQUIPO_ID +
          ' con ESTADO Inactivo.',
        'ERROR',
        'Reasignar la tarea o cerrar la asignacion de la persona inactiva.'
      );
    }
  });
}

function detectarCapacidadSemanalInsuficiente_(agregar) {
  var tareasPorId_ = {};

  listarRegistros(
    'TAREA',
    {ACTIVO: 'SÍ'}
  ).forEach(function (t) {
    tareasPorId_[t.ID] = t;
  });

  var personasPorId_ = {};

  listarRegistros(
    'PERSONA_EQUIPO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (p) {
    personasPorId_[p.ID] = p;
  });

  var MS_POR_SEMANA_ = 7 * 24 * 60 * 60 * 1000;

  listarRegistros(
    'TAREA_RESPONSABLE',
    {ACTIVO: 'SÍ'}
  ).forEach(function (a) {
    if (
      ['Planificada', 'Activa']
        .indexOf(a.ESTADO) === -1
    ) {
      return;
    }

    var tarea = tareasPorId_[a.TAREA_ID];
    var persona = personasPorId_[a.PERSONA_EQUIPO_ID];

    if (!tarea || !persona) {
      return;
    }

    var capacidadSemanal =
      Number(persona.CAPACIDAD_SEMANAL_DIAS);

    var duracionPrevista =
      Number(tarea.DURACION_PREVISTA_DIAS);

    var pct =
      Number(a.PORCENTAJE_DEDICACION);

    if (
      !(capacidadSemanal > 0) ||
      !(duracionPrevista > 0) ||
      !(pct > 0)
    ) {
      return;
    }

    var fechaInicio =
      a.FECHA_INICIO_ASIGNACION instanceof Date
        ? new Date(a.FECHA_INICIO_ASIGNACION.getTime())
        : new Date(a.FECHA_INICIO_ASIGNACION);

    var fechaFin =
      a.FECHA_FIN_ASIGNACION instanceof Date
        ? new Date(a.FECHA_FIN_ASIGNACION.getTime())
        : new Date(a.FECHA_FIN_ASIGNACION);

    if (
      isNaN(fechaInicio.getTime()) ||
      isNaN(fechaFin.getTime()) ||
      fechaFin.getTime() <= fechaInicio.getTime()
    ) {
      return;
    }

    var semanas =
      (fechaFin.getTime() - fechaInicio.getTime()) / MS_POR_SEMANA_;

    var diasRequeridosSemana =
      (duracionPrevista * (pct / 100)) / semanas;

    if (diasRequeridosSemana > capacidadSemanal) {
      agregar(
        'FUNC-REC-004',
        'TAREA_RESPONSABLE',
        a.ID,
        'Densidad de trabajo requerida (' +
          diasRequeridosSemana.toFixed(2) +
          ' dias/semana) supera la capacidad semanal de la persona (' +
          capacidadSemanal +
          ' dias/semana).',
        'ADVERTENCIA',
        'Ampliar el plazo de la asignacion, reducir la dedicacion o reforzar el equipo.'
      );
    }
  });
}

function detectarSobrecargaPorPeriodo_(agregar) {
  var asignacionesPorPersona_ = {};

  listarRegistros(
    'TAREA_RESPONSABLE',
    {ACTIVO: 'SÍ'}
  ).forEach(function (a) {
    if (
      ['Planificada', 'Activa']
        .indexOf(a.ESTADO) === -1
    ) {
      return;
    }

    var pct =
      Number(a.PORCENTAJE_DEDICACION) || 0;

    var fechaInicio =
      a.FECHA_INICIO_ASIGNACION instanceof Date
        ? new Date(a.FECHA_INICIO_ASIGNACION.getTime())
        : new Date(a.FECHA_INICIO_ASIGNACION);

    var fechaFin =
      a.FECHA_FIN_ASIGNACION instanceof Date
        ? new Date(a.FECHA_FIN_ASIGNACION.getTime())
        : new Date(a.FECHA_FIN_ASIGNACION);

    if (
      isNaN(fechaInicio.getTime()) ||
      isNaN(fechaFin.getTime()) ||
      !(pct > 0)
    ) {
      return;
    }

    if (!asignacionesPorPersona_[a.PERSONA_EQUIPO_ID]) {
      asignacionesPorPersona_[a.PERSONA_EQUIPO_ID] = [];
    }

    asignacionesPorPersona_[a.PERSONA_EQUIPO_ID].push({
      tareaId: a.TAREA_ID,
      inicio: fechaInicio.getTime(),
      fin: fechaFin.getTime(),
      pct: pct
    });
  });

  Object.keys(asignacionesPorPersona_)
    .forEach(function (personaId) {
      var asignaciones =
        asignacionesPorPersona_[personaId];

      var firmasReportadas_ = {};

      asignaciones.forEach(function (base) {
        var solapadas =
          asignaciones.filter(function (otra) {
            return (
              base.inicio <= otra.fin &&
              otra.inicio <= base.fin
            );
          });

        var totalPct =
          solapadas.reduce(function (acc, s) {
            return acc + s.pct;
          }, 0);

        if (totalPct > 100) {
          var firma =
            solapadas
              .map(function (s) {
                return s.tareaId;
              })
              .sort()
              .join('|');

          if (!firmasReportadas_[firma]) {
            firmasReportadas_[firma] = true;

            agregar(
              'FUNC-REC-005',
              'PERSONA_EQUIPO',
              personaId,
              'Carga solapada en el periodo (' +
                totalPct +
                '%) supera el 100% entre las tareas: ' +
                solapadas
                  .map(function (s) {
                    return s.tareaId;
                  })
                  .join(', ') +
                '.',
              'ADVERTENCIA',
              'Redistribuir la carga entre el periodo solapado o ajustar las fechas de asignacion.'
            );
          }
        }
      });
    });
}

function detectarProblemasProyectoProducto_(agregar) {
  listarRegistros(
    'PROYECTO_PRODUCTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (vp) {
    var cantidad =
      Number(vp.CANTIDAD_ASIGNADA);

    if (
      !vp.CANTIDAD_ASIGNADA ||
      !(cantidad > 0)
    ) {
      agregar(
        'FUNC-REL-001',
        'PROYECTO_PRODUCTO',
        vp.ID,
        'Relacion proyecto-producto sin cantidad asignada valida.',
        'INFORMACION',
        'Completar la cantidad asignada si corresponde.'
      );
    }
  });
}

var ESTADOS_CIERRE_CAMPANA_ = ['Completada', 'Cancelada'];
var ESTADOS_CIERRE_PROYECTO_ = ['Completado', 'Cancelado'];
var ESTADOS_CIERRE_PRODUCTO_ = ['Completado', 'Cancelado'];
var ESTADOS_CIERRE_PROCESO_JERARQUIA_ = ['Completado', 'Cancelado'];

function parseFechaJerarquia_(valor) {
  return valor instanceof Date
    ? new Date(valor.getTime())
    : new Date(valor);
}

function detectarProyectoFueraDeVentanaCampana_(agregar) {
  var campanasPorId_ = {};

  listarRegistros(
    'CAMPANA',
    {ACTIVO: 'SÍ'}
  ).forEach(function (campana) {
    campanasPorId_[campana.ID] = campana;
  });

  listarRegistros(
    'PROYECTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (proyecto) {
    var campana =
      campanasPorId_[proyecto.CAMPANA_ID];

    if (!campana) {
      return;
    }

    var inicioProyecto =
      parseFechaJerarquia_(proyecto.FECHA_INICIO_PLAN);

    var inicioCampana =
      parseFechaJerarquia_(campana.FECHA_INICIO_PLAN);

    if (
      !isNaN(inicioProyecto.getTime()) &&
      !isNaN(inicioCampana.getTime()) &&
      inicioProyecto.getTime() < inicioCampana.getTime()
    ) {
      agregar(
        'FUNC-JER-001',
        'PROYECTO',
        proyecto.ID,
        'Proyecto con FECHA_INICIO_PLAN anterior a la FECHA_INICIO_PLAN de su campana ' +
          campana.ID +
          '.',
        'ERROR',
        'Ajustar la fecha de inicio del proyecto o de la campana.'
      );
    }

    var finProyecto =
      parseFechaJerarquia_(proyecto.FECHA_FIN_PLAN);

    var finCampana =
      parseFechaJerarquia_(campana.FECHA_FIN_PLAN);

    if (
      !isNaN(finProyecto.getTime()) &&
      !isNaN(finCampana.getTime()) &&
      finProyecto.getTime() > finCampana.getTime()
    ) {
      agregar(
        'FUNC-JER-002',
        'PROYECTO',
        proyecto.ID,
        'Proyecto con FECHA_FIN_PLAN posterior a la FECHA_FIN_PLAN de su campana ' +
          campana.ID +
          '.',
        'ERROR',
        'Ajustar la fecha de fin del proyecto o de la campana.'
      );
    }
  });
}

function detectarCampanaCerradaConProyectoActivo_(agregar) {
  var proyectosPorCampana_ = {};

  listarRegistros(
    'PROYECTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (proyecto) {
    var campanaId =
      String(proyecto.CAMPANA_ID || '').trim();

    if (!campanaId) {
      return;
    }

    if (!proyectosPorCampana_[campanaId]) {
      proyectosPorCampana_[campanaId] = [];
    }

    proyectosPorCampana_[campanaId].push(proyecto);
  });

  listarRegistros(
    'CAMPANA',
    {ACTIVO: 'SÍ'}
  ).forEach(function (campana) {
    if (
      ESTADOS_CIERRE_CAMPANA_.indexOf(campana.ESTADO) === -1
    ) {
      return;
    }

    var proyectosNoCerrados =
      (proyectosPorCampana_[campana.ID] || [])
        .filter(function (proyecto) {
          return (
            ESTADOS_CIERRE_PROYECTO_.indexOf(proyecto.ESTADO) === -1
          );
        });

    if (proyectosNoCerrados.length > 0) {
      agregar(
        'FUNC-JER-003',
        'CAMPANA',
        campana.ID,
        'Campana ' + campana.ESTADO +
          ' con PROYECTO activo no cerrado: ' +
          proyectosNoCerrados
            .map(function (proyecto) {
              return proyecto.ID;
            })
            .join(', ') +
          '.',
        'ERROR',
        'Cerrar los proyectos activos o revisar el estado de la campana.'
      );
    }
  });
}

function detectarProblemasProyectoProductoJerarquia_(agregar) {
  var proyectosPorId_ = {};

  listarRegistros(
    'PROYECTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (proyecto) {
    proyectosPorId_[proyecto.ID] = proyecto;
  });

  var productosPorId_ = {};

  listarRegistros(
    'PRODUCTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (producto) {
    productosPorId_[producto.ID] = producto;
  });

  listarRegistros(
    'PROYECTO_PRODUCTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (relacion) {
    var proyecto =
      proyectosPorId_[relacion.PROYECTO_ID];

    var producto =
      productosPorId_[relacion.PRODUCTO_ID];

    if (
      proyecto &&
      producto &&
      ESTADOS_CIERRE_PROYECTO_.indexOf(proyecto.ESTADO) !== -1 &&
      ESTADOS_CIERRE_PRODUCTO_.indexOf(producto.ESTADO) === -1
    ) {
      agregar(
        'FUNC-JER-004',
        'PROYECTO_PRODUCTO',
        relacion.ID,
        'Proyecto ' + proyecto.ID + ' ' + proyecto.ESTADO +
          ' con PRODUCTO ' + producto.ID +
          ' no cerrado (' + producto.ESTADO + ').',
        'ERROR',
        'Cerrar el producto vinculado o revisar el estado del proyecto.'
      );
    }

    if (proyecto) {
      var fechaRequerida =
        parseFechaJerarquia_(relacion.FECHA_REQUERIDA);

      var inicioProyecto =
        parseFechaJerarquia_(proyecto.FECHA_INICIO_PLAN);

      if (
        !isNaN(fechaRequerida.getTime()) &&
        !isNaN(inicioProyecto.getTime()) &&
        fechaRequerida.getTime() < inicioProyecto.getTime()
      ) {
        agregar(
          'FUNC-JER-007',
          'PROYECTO_PRODUCTO',
          relacion.ID,
          'FECHA_REQUERIDA anterior a la FECHA_INICIO_PLAN del proyecto ' +
            proyecto.ID +
            '.',
          'ERROR',
          'Ajustar la fecha requerida de la relacion o la fecha de inicio del proyecto.'
        );
      }
    }
  });
}

function detectarProblemasProductoProcesoJerarquia_(agregar) {
  var productosPorId_ = {};

  listarRegistros(
    'PRODUCTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (producto) {
    productosPorId_[producto.ID] = producto;
  });

  var procesosPorProducto_ = {};

  listarRegistros(
    'PROCESO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (proceso) {
    var productoId =
      String(proceso.PRODUCTO_ID || '').trim();

    if (!productoId) {
      return;
    }

    if (!procesosPorProducto_[productoId]) {
      procesosPorProducto_[productoId] = [];
    }

    procesosPorProducto_[productoId].push(proceso);

    var producto = productosPorId_[productoId];

    if (!producto) {
      return;
    }

    var finProceso =
      parseFechaJerarquia_(proceso.FECHA_FIN_PLAN);

    var requeridaProducto =
      parseFechaJerarquia_(producto.FECHA_REQUERIDA);

    if (
      !isNaN(finProceso.getTime()) &&
      !isNaN(requeridaProducto.getTime()) &&
      finProceso.getTime() > requeridaProducto.getTime()
    ) {
      agregar(
        'FUNC-JER-006',
        'PROCESO',
        proceso.ID,
        'Proceso con FECHA_FIN_PLAN posterior a la FECHA_REQUERIDA del producto ' +
          producto.ID +
          '.',
        'ERROR',
        'Ajustar la planificacion del proceso o la fecha requerida del producto.'
      );
    }
  });

  Object.keys(productosPorId_).forEach(function (productoId) {
    var producto = productosPorId_[productoId];

    if (
      ESTADOS_CIERRE_PRODUCTO_.indexOf(producto.ESTADO) === -1
    ) {
      return;
    }

    var procesosNoCerrados =
      (procesosPorProducto_[productoId] || [])
        .filter(function (proceso) {
          return (
            ESTADOS_CIERRE_PROCESO_JERARQUIA_.indexOf(proceso.ESTADO) === -1
          );
        });

    if (procesosNoCerrados.length > 0) {
      agregar(
        'FUNC-JER-005',
        'PRODUCTO',
        producto.ID,
        'Producto ' + producto.ESTADO +
          ' con PROCESO activo no cerrado: ' +
          procesosNoCerrados
            .map(function (proceso) {
              return proceso.ID;
            })
            .join(', ') +
          '.',
        'ERROR',
        'Cerrar los procesos activos o revisar el estado del producto.'
      );
    }
  });
}

function detectarProblemasDocumento_(agregar) {
  var registrosPorEntidad_ = {};

  /*
   * Reutiliza ENTIDAD_DOCUMENTO_A_MVP (Formularios.js) como unica fuente
   * de verdad: sus claves son el texto exacto del catalogo real
   * (DOCUMENTO.ENTIDAD_TIPO guarda "Tarea", "Decisión", etc., no las
   * claves internas en mayusculas), y sus valores son el nombre de
   * entidad interno que espera listarRegistros.
   */
  function obtenerMapaEntidad_(entidadTipo) {
    var entidadInterna = ENTIDAD_DOCUMENTO_A_MVP[entidadTipo];

    if (!entidadInterna) {
      return null;
    }

    if (!registrosPorEntidad_[entidadTipo]) {
      var mapa = {};

      listarRegistros(entidadInterna)
        .forEach(function (registro) {
          mapa[registro.ID] = registro;
        });

      registrosPorEntidad_[entidadTipo] = mapa;
    }

    return registrosPorEntidad_[entidadTipo];
  }

  var documentosPorClaveVigente_ = {};
  var documentosPorClaveDuplicado_ = {};

  listarRegistros(
    'DOCUMENTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (documento) {
    var entidadTipo =
      String(documento.ENTIDAD_TIPO || '').trim();

    var entidadId =
      String(documento.ENTIDAD_ID || '').trim();

    if (entidadTipo && entidadId) {
      var mapaEntidad =
        obtenerMapaEntidad_(entidadTipo);

      if (mapaEntidad) {
        var padre = mapaEntidad[entidadId];

        if (!padre) {
          agregar(
            'FUNC-DOC-001',
            'DOCUMENTO',
            documento.ID,
            'Documento con ENTIDAD_ID huerfano: ' +
              entidadTipo + ' ' + entidadId +
              ' no existe.',
            'ERROR',
            'Corregir la referencia o eliminar el documento.'
          );
        } else if (
          String(padre.ACTIVO || '').trim() !== 'SÍ'
        ) {
          agregar(
            'FUNC-DOC-002',
            'DOCUMENTO',
            documento.ID,
            'Documento referencia un registro inactivo: ' +
              entidadTipo + ' ' + entidadId + '.',
            'ADVERTENCIA',
            'Revisar si el documento sigue siendo necesario tras desactivar el registro padre.'
          );
        }
      }
    }

    if (documento.ESTADO === 'Vigente') {
      var claveVigente =
        entidadTipo + '|' + entidadId + '|' +
        String(documento.TIPO_DOCUMENTO || '').trim();

      if (!documentosPorClaveVigente_[claveVigente]) {
        documentosPorClaveVigente_[claveVigente] = [];
      }

      documentosPorClaveVigente_[claveVigente].push(documento);
    }

    var claveDuplicado =
      entidadTipo + '|' + entidadId + '|' +
      String(documento.TIPO_DOCUMENTO || '').trim() + '|' +
      String(documento.VERSION || '').trim();

    if (!documentosPorClaveDuplicado_[claveDuplicado]) {
      documentosPorClaveDuplicado_[claveDuplicado] = [];
    }

    documentosPorClaveDuplicado_[claveDuplicado].push(documento);

    var version =
      String(documento.VERSION || '').trim();

    if (
      version &&
      !/^[vV]?\d+(\.\d+){0,3}$/.test(version)
    ) {
      agregar(
        'FUNC-DOC-005',
        'DOCUMENTO',
        documento.ID,
        'Documento con VERSION en formato invalido: ' +
          version + '.',
        'ADVERTENCIA',
        'Usar un formato como 1, 1.0 o v1.2.3.'
      );
    }

    var url =
      String(documento.URL || '').trim();

    if (
      url &&
      !/^https?:\/\/.+/i.test(url)
    ) {
      agregar(
        'FUNC-DOC-006',
        'DOCUMENTO',
        documento.ID,
        'Documento con URL en formato invalido (debe empezar por http:// o https://): ' +
          url + '.',
        'ADVERTENCIA',
        'Corregir la URL del documento.'
      );
    }
  });

  Object.keys(documentosPorClaveVigente_)
    .forEach(function (clave) {
      var documentos =
        documentosPorClaveVigente_[clave];

      if (documentos.length > 1) {
        documentos.forEach(function (documento) {
          agregar(
            'FUNC-DOC-003',
            'DOCUMENTO',
            documento.ID,
            'Mas de un documento Vigente para la misma combinacion ENTIDAD_TIPO/ENTIDAD_ID/TIPO_DOCUMENTO: ' +
              documentos
                .map(function (d) {
                  return d.ID;
                })
                .join(', ') +
              '.',
            'ERROR',
            'Marcar como Obsoleto todos menos uno de los documentos vigentes.'
          );
        });
      }
    });

  Object.keys(documentosPorClaveDuplicado_)
    .forEach(function (clave) {
      var documentos =
        documentosPorClaveDuplicado_[clave];

      if (documentos.length > 1) {
        documentos.forEach(function (documento) {
          agregar(
            'FUNC-DOC-004',
            'DOCUMENTO',
            documento.ID,
            'Documento duplicado (misma ENTIDAD_TIPO/ENTIDAD_ID/TIPO_DOCUMENTO/VERSION): ' +
              documentos
                .map(function (d) {
                  return d.ID;
                })
                .join(', ') +
              '.',
            'ERROR',
            'Eliminar o corregir los documentos duplicados.'
          );
        });
      }
    });
}

function detectarProblemasFuncionales_() {
  var hallazgos = [];

  function agregar(
    codigo,
    entidad,
    registroId,
    descripcion,
    gravedad,
    accionSugerida
  ) {
    hallazgos.push({
      codigo: codigo,
      entidad: entidad,
      registroId: registroId,
      descripcion: descripcion,
      gravedad: gravedad,
      accionSugerida: accionSugerida
    });
  }

  /*
   * STOCK
   * Integridad funcional histórica.
   */
  detectarProblemasStock_(agregar);

  /*
   * TAREA_MATERIAL
   * Integridad funcional histórica.
   */
  detectarProblemasTareaMaterial_(agregar);

  /*
 * PRODUCTO_MATERIAL / TAREA_MATERIAL
 * Relaciones activas con padres lógicamente inactivos.
 */
detectarRelacionesMaterialConPadresInactivos_(
  agregar
);

/*
 * PRODUCTO_MATERIAL / TAREA_MATERIAL
 * Duplicidades funcionales históricas activas.
 */
detectarDuplicidadesRelacionesMaterial_(
  agregar
);

  /*
   * TAREA
   * Integridad funcional histórica.
   */
  detectarProblemasTarea_(agregar);

  /*
   * TAREA_RESPONSABLE
   * Integridad funcional histórica.
   */
  detectarProblemasTareaResponsable_(agregar);

  /*
   * FUNC-ASG-001
   * Dedicacion simultanea de una persona/equipo superior al 100% en la
   * relacion generica ASIGNACION (CAMPANA/PROYECTO/PRODUCTO/PROCESO/
   * DECISION/INCIDENCIA). No se combina con la dedicacion de
   * TAREA_RESPONSABLE (FUNC-REC-001) en esta fase — limite de alcance
   * documentado en Fase L1.1 del roadmap de backlog.
   */
  detectarProblemasAsignacion_(agregar);

  /*
   * FUNC-GRF-001
   * Grafo de relaciones/dependencias entre entidades del mismo tipo:
   * una relacion no puede referenciar el mismo registro como origen y
   * destino. Alcance minimo de esta fase (L1.2) — deteccion de ciclos
   * mas alla del par directo queda fuera por ahora.
   */
  detectarProblemasRelacion_(agregar);

  /*
   * FUNC-REC-002
   * Solapamiento temporal de asignaciones activas de una misma persona.
   */
  detectarSolapamientoTemporalTareaResponsable_(agregar);

  /*
   * FUNC-REC-003
   * Persona con ESTADO Inactivo que mantiene una asignacion activa.
   */
  detectarPersonaInactivaConAsignacionActiva_(agregar);

  /*
   * FUNC-REC-004
   * Densidad de trabajo de la asignacion por encima de la capacidad semanal.
   */
  detectarCapacidadSemanalInsuficiente_(agregar);

  /*
   * FUNC-REC-005
   * Suma de dedicacion en periodos solapados de una misma persona por encima del 100%.
   */
  detectarSobrecargaPorPeriodo_(agregar);

  /*
   * DECISION
   * Integridad funcional histórica.
   */
  detectarProblemasDecision_(agregar);

  /*
   * INCIDENCIA
   * Integridad funcional histórica.
   */
  detectarProblemasIncidencia_(agregar);

  /*
   * PROVEEDOR
   * Integridad funcional histórica.
   */
  detectarProblemasProveedor_(agregar);

  /*
   * MATERIAL
   * Integridad funcional histórica.
   */
  detectarProblemasMaterial_(agregar);

  /*
   * PROYECTO_PRODUCTO
   * Integridad funcional histórica.
   */
  detectarProblemasProyectoProducto_(agregar);

  /*
   * FUNC-JER-001 / FUNC-JER-002
   * Proyecto planificado fuera de la ventana temporal de su campana.
   */
  detectarProyectoFueraDeVentanaCampana_(agregar);

  /*
   * FUNC-JER-003
   * Campana cerrada (Completada/Cancelada) con un proyecto activo no cerrado.
   */
  detectarCampanaCerradaConProyectoActivo_(agregar);

  /*
   * FUNC-JER-004 / FUNC-JER-007
   * Coherencia de estado y fecha requerida entre PROYECTO y PRODUCTO
   * (via PROYECTO_PRODUCTO).
   */
  detectarProblemasProyectoProductoJerarquia_(agregar);

  /*
   * FUNC-JER-005 / FUNC-JER-006
   * Coherencia de estado y fecha entre PRODUCTO y sus PROCESO.
   */
  detectarProblemasProductoProcesoJerarquia_(agregar);

  /*
   * FUNC-DOC-001 a FUNC-DOC-006
   * Referencia polimorfica de DOCUMENTO, vigencia unica y duplicados,
   * formato de VERSION y URL.
   */
  detectarProblemasDocumento_(agregar);


  /*
   * FUNC-PROCESO-001
   * Un proceso Completado no puede mantener tareas activas no Terminadas.
   */
  var tareasActivasPorProceso_ = {};

  listarRegistros(
    'TAREA',
    {ACTIVO: 'SÍ'}
  ).forEach(function (tarea) {
    var procesoId =
      String(tarea.PROCESO_ID || '').trim();

    if (!procesoId) {
      return;
    }

    if (!tareasActivasPorProceso_[procesoId]) {
      tareasActivasPorProceso_[procesoId] = [];
    }

    tareasActivasPorProceso_[procesoId].push(tarea);
  });

  listarRegistros(
    'PROCESO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (proceso) {
    if (proceso.ESTADO !== 'Completado') {
      return;
    }

    var procesoId =
      String(proceso.ID || '').trim();

    var tareasNoTerminadas =
      (tareasActivasPorProceso_[procesoId] || [])
        .filter(function (tarea) {
          return tarea.ESTADO !== 'Terminada';
        });

    if (tareasNoTerminadas.length > 0) {
      var idsTareas =
        tareasNoTerminadas.map(function (tarea) {
          return String(tarea.ID || '').trim();
        });

      agregar(
        'FUNC-PROCESO-001',
        'PROCESO',
        proceso.ID,
        'Proceso Completado con TAREA activa no Terminada: ' +
          idsTareas.join(', ') +
          '.',
        'ERROR',
        'Terminar las tareas activas pendientes o corregir el estado del proceso.'
      );
    }
  });

  /*
   * FUNC-PROCESO-002
   * Un proceso Pendiente o Preparado no puede mantener tareas activas iniciadas.
   */
  listarRegistros(
    'PROCESO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (proceso) {
    if (
      proceso.ESTADO !== 'Pendiente' &&
      proceso.ESTADO !== 'Preparado'
    ) {
      return;
    }

    var procesoId =
      String(proceso.ID || '').trim();

    var tareasIniciadas =
      (tareasActivasPorProceso_[procesoId] || [])
        .filter(function (tarea) {
          return (
            tarea.ESTADO === 'En proceso' ||
            tarea.ESTADO === 'Terminada'
          );
        });

    if (tareasIniciadas.length > 0) {
      var idsTareasIniciadas =
        tareasIniciadas.map(function (tarea) {
          return String(tarea.ID || '').trim();
        });

      agregar(
        'FUNC-PROCESO-002',
        'PROCESO',
        proceso.ID,
        'Proceso ' + proceso.ESTADO +
          ' con TAREA activa En proceso o Terminada: ' +
          idsTareasIniciadas.join(', ') +
          '.',
        'ERROR',
        'Iniciar el proceso o corregir el estado de las tareas activas.'
      );
    }
  });

  /*
   * Fase L1.4 del backlog consolidado — precondiciones deterministas por
   * estado. No añaden campos nuevos: solo comprueban que los campos ya
   * existentes (incluidos los de Fase L1.3) estén rellenos cuando el
   * estado declarado dice que el registro está listo/resuelto/activo.
   * Todas en ADVERTENCIA (nudge de calidad de datos, no bloqueo).
   */

  /*
   * FUNC-PROCESO-003 (F-033)
   * Un PROCESO "Preparado" sin responsable ni criterios de aceptación
   * no garantiza que esté realmente preparado.
   */
  listarRegistros(
    'PROCESO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (proceso) {
    if (proceso.ESTADO !== 'Preparado') {
      return;
    }

    var faltantes = [];

    if (!String(proceso.RESPONSABLE_ID || '').trim()) {
      faltantes.push('RESPONSABLE_ID');
    }

    if (!String(proceso.CRITERIOS_ACEPTACION || '').trim()) {
      faltantes.push('CRITERIOS_ACEPTACION');
    }

    if (faltantes.length > 0) {
      agregar(
        'FUNC-PROCESO-003',
        'PROCESO',
        proceso.ID,
        'Proceso Preparado sin: ' + faltantes.join(', ') + '.',
        'ADVERTENCIA',
        'Completar el responsable y los criterios de aceptación antes de dar el proceso por preparado.'
      );
    }
  });

  /*
   * FUNC-TAREA-013 (F-044)
   * Una TAREA "Preparada" sin responsable asignado (via TAREA_RESPONSABLE)
   * ni criterios de aceptación no garantiza que esté realmente preparada.
   */
  var tareasConResponsableActivo_ = {};

  listarRegistros(
    'TAREA_RESPONSABLE',
    {ACTIVO: 'SÍ'}
  ).forEach(function (asignacion) {
    if (
      ['Planificada', 'Activa']
        .indexOf(asignacion.ESTADO) === -1
    ) {
      return;
    }

    tareasConResponsableActivo_[
      String(asignacion.TAREA_ID || '').trim()
    ] = true;
  });

  listarRegistros(
    'TAREA',
    {ACTIVO: 'SÍ'}
  ).forEach(function (tarea) {
    if (tarea.ESTADO !== 'Preparada') {
      return;
    }

    var faltantes = [];

    if (!tareasConResponsableActivo_[String(tarea.ID || '').trim()]) {
      faltantes.push('responsable asignado (TAREA_RESPONSABLE)');
    }

    if (!String(tarea.CRITERIOS_ACEPTACION || '').trim()) {
      faltantes.push('CRITERIOS_ACEPTACION');
    }

    if (faltantes.length > 0) {
      agregar(
        'FUNC-TAREA-013',
        'TAREA',
        tarea.ID,
        'Tarea Preparada sin: ' + faltantes.join(', ') + '.',
        'ADVERTENCIA',
        'Asignar un responsable activo y completar los criterios de aceptación antes de dar la tarea por preparada.'
      );
    }
  });

  /*
   * FUNC-INC-004 (F-065)
   * Una INCIDENCIA Resuelta o Cerrada sin accion correctora ni fecha de
   * resolucion no diferencia una correccion aplicada de una verificada.
   */
  listarRegistros(
    'INCIDENCIA',
    {ACTIVO: 'SÍ'}
  ).forEach(function (incidencia) {
    if (
      ['Resuelta', 'Cerrada']
        .indexOf(incidencia.ESTADO) === -1
    ) {
      return;
    }

    var faltantes = [];

    if (!String(incidencia.ACCION_CORRECTORA || '').trim()) {
      faltantes.push('ACCION_CORRECTORA');
    }

    var fechaResolucion =
      incidencia.FECHA_RESOLUCION instanceof Date
        ? incidencia.FECHA_RESOLUCION
        : new Date(incidencia.FECHA_RESOLUCION);

    if (isNaN(fechaResolucion.getTime())) {
      faltantes.push('FECHA_RESOLUCION');
    }

    if (faltantes.length > 0) {
      agregar(
        'FUNC-INC-004',
        'INCIDENCIA',
        incidencia.ID,
        'Incidencia ' + incidencia.ESTADO + ' sin: ' + faltantes.join(', ') + '.',
        'ADVERTENCIA',
        'Completar la acción correctora y la fecha de resolución antes de marcar la incidencia como resuelta o cerrada.'
      );
    }
  });

  /*
   * FUNC-PRV-006 (F-095)
   * Un PROVEEDOR Activo sin NIF/CIF ni contacto no representa todavia
   * una relacion comercial confirmada.
   */
  listarRegistros(
    'PROVEEDOR',
    {ACTIVO: 'SÍ'}
  ).forEach(function (proveedor) {
    if (proveedor.ESTADO !== 'Activo') {
      return;
    }

    var faltantes = [];

    if (!String(proveedor.NIF_CIF || '').trim()) {
      faltantes.push('NIF_CIF');
    }

    if (!String(proveedor.PERSONA_CONTACTO || '').trim()) {
      faltantes.push('PERSONA_CONTACTO');
    }

    if (faltantes.length > 0) {
      agregar(
        'FUNC-PRV-006',
        'PROVEEDOR',
        proveedor.ID,
        'Proveedor Activo sin: ' + faltantes.join(', ') + '.',
        'ADVERTENCIA',
        'Completar el NIF/CIF y la persona de contacto antes de marcar el proveedor como activo, o revisar el estado si aún no es una relación comercial confirmada.'
      );
    }
  });

  /*
   * Fase L2 del backlog consolidado — ganancias baratas.
   *
   * FUNC-PRD-001 (F-014)
   * CODIGO de PRODUCTO sin normalizar (minusculas, espacios o acentos)
   * pierde utilidad para busqueda, integracion y automatizacion. Aviso
   * de calidad de datos, no bloqueo — no se reescribe el valor.
   */
  var patronCodigoNormalizado_ = /^[A-Z0-9-]+$/;

  listarRegistros(
    'PRODUCTO',
    {ACTIVO: 'SÍ'}
  ).forEach(function (producto) {
    var codigo = String(producto.CODIGO || '').trim();

    if (codigo && !patronCodigoNormalizado_.test(codigo)) {
      agregar(
        'FUNC-PRD-001',
        'PRODUCTO',
        producto.ID,
        'CODIGO no normalizado (' + codigo + '): debe contener solo mayusculas, numeros y guiones.',
        'ADVERTENCIA',
        'Normalizar el codigo a mayusculas, sin espacios ni acentos, usando solo A-Z, 0-9 y guiones.'
      );
    }
  });

  return {
    errores: hallazgos.filter(function (h) {
      return h.gravedad === 'ERROR';
    }),

    advertencias: hallazgos.filter(function (h) {
      return h.gravedad === 'ADVERTENCIA';
    }),

    informacion: hallazgos.filter(function (h) {
      return h.gravedad === 'INFORMACION';
    })
  };
}

function obtenerReporteIntegridad() {
  instrumentacionReiniciarContadores();
  cacheLecturaIniciarContexto_();

  var inicioTotal = Date.now();

  var reporte = {
    idsDuplicados: {},
    referenciasHuerfanas: {}
  };

  var medicionEstructural;
  var medicionFuncional;

  try {
    medicionEstructural =
      instrumentacionMedirFuncion_(
        'estructural_duplicados_huerfanas',
        function () {
          Object.keys(ENTIDADES_MVP)
            .forEach(function (entidad) {
              var duplicados =
                detectarIdsDuplicados(entidad);

              if (duplicados.length > 0) {
                reporte.idsDuplicados[entidad] =
                  duplicados;
              }

              var huerfanas =
                detectarReferenciasHuerfanas(entidad);

              if (huerfanas.length > 0) {
                reporte.referenciasHuerfanas[entidad] =
                  huerfanas;
              }
            });
        }
      );

    medicionFuncional =
      instrumentacionMedirFuncion_(
        'funcional',
        function () {
          reporte.funcional =
            detectarProblemasFuncionales_();
        }
      );
  } finally {
    cacheLecturaFinalizarContexto_();
  }

  reporte.instrumentacion = {
    duracionTotalMs: Date.now() - inicioTotal,
    estructural: medicionEstructural.medicion,
    funcional: medicionFuncional.medicion
  };

  console.log(
    'INSTR etiqueta=obtenerReporteIntegridad_total' +
    ' duracion_ms=' + reporte.instrumentacion.duracionTotalMs +
    ' lecturas_hoja=' +
      (
        medicionEstructural.medicion.lecturasHoja +
        medicionFuncional.medicion.lecturasHoja
      ) +
    ' flushes=' +
      (
        medicionEstructural.medicion.flushes +
        medicionFuncional.medicion.flushes
      )
  );

  return reporte;
}

function hayProblemasIntegridad(reporte) {
  var r =
    reporte || obtenerReporteIntegridad();

  var hayFuncional =
    r.funcional &&
    r.funcional.errores &&
    r.funcional.errores.length > 0;

  return (
    Object.keys(r.idsDuplicados).length > 0 ||
    Object.keys(r.referenciasHuerfanas).length > 0 ||
    hayFuncional
  );
}

function abrirIntegridad() {
  var template =
    HtmlService.createTemplateFromFile(
      'IntegridadReporte'
    );

  var html =
    template.evaluate()
      .setTitle('Integridad y mantenimiento');

  SpreadsheetApp.getUi()
    .showSidebar(html);
}

function probarReporteIntegridad() {
  console.log(
    JSON.stringify(
      obtenerReporteIntegridad(),
      null,
      2
    )
  );
}

function detectarRelacionesMaterialConPadresInactivos_(agregar) {
  var productosPorId = {};
  var tareasPorId = {};
  var materialesPorId = {};

  listarRegistros(
    'PRODUCTO',
    {}
  ).forEach(function(producto) {
    var id = String(
      producto.ID || ''
    ).trim();

    if (id) {
      productosPorId[id] = producto;
    }
  });

  listarRegistros(
    'TAREA',
    {}
  ).forEach(function(tarea) {
    var id = String(
      tarea.ID || ''
    ).trim();

    if (id) {
      tareasPorId[id] = tarea;
    }
  });

  listarRegistros(
    'MATERIAL',
    {}
  ).forEach(function(material) {
    var id = String(
      material.ID || ''
    ).trim();

    if (id) {
      materialesPorId[id] = material;
    }
  });

  listarRegistros(
    'PRODUCTO_MATERIAL',
    {ACTIVO: 'SÍ'}
  ).forEach(function(relacion) {
    var productoId = String(
      relacion.PRODUCTO_ID || ''
    ).trim();

    var materialId = String(
      relacion.MATERIAL_ID || ''
    ).trim();

    var producto =
      productosPorId[productoId];

    var material =
      materialesPorId[materialId];

    /*
     * Las referencias inexistentes quedan cubiertas
     * por referenciasHuerfanas.
     */
    if (
      producto &&
      String(
        producto.ACTIVO || ''
      )
        .trim()
        .toUpperCase() === 'NO'
    ) {
      agregar(
        'FUNC-PMA-001',
        'PRODUCTO_MATERIAL',
        relacion.ID,
        'PRODUCTO_MATERIAL activo con PRODUCTO_ID inactivo: ' +
          productoId +
          '.',
        'ERROR',
        'Reactivar el producto, cambiar PRODUCTO_ID o desactivar la relación.'
      );
    }

    if (
      material &&
      String(
        material.ACTIVO || ''
      )
        .trim()
        .toUpperCase() === 'NO'
    ) {
      agregar(
        'FUNC-PMA-002',
        'PRODUCTO_MATERIAL',
        relacion.ID,
        'PRODUCTO_MATERIAL activo con MATERIAL_ID inactivo: ' +
          materialId +
          '.',
        'ERROR',
        'Reactivar el material, cambiar MATERIAL_ID o desactivar la relación.'
      );
    }
  });

  listarRegistros(
    'TAREA_MATERIAL',
    {ACTIVO: 'SÍ'}
  ).forEach(function(relacion) {
    var tareaId = String(
      relacion.TAREA_ID || ''
    ).trim();

    var materialId = String(
      relacion.MATERIAL_ID || ''
    ).trim();

    var tarea =
      tareasPorId[tareaId];

    var material =
      materialesPorId[materialId];

    /*
     * Las referencias inexistentes quedan cubiertas
     * por referenciasHuerfanas.
     */
    if (
      tarea &&
      String(
        tarea.ACTIVO || ''
      )
        .trim()
        .toUpperCase() === 'NO'
    ) {
      agregar(
        'FUNC-TMA-003',
        'TAREA_MATERIAL',
        relacion.ID,
        'TAREA_MATERIAL activo con TAREA_ID inactiva: ' +
          tareaId +
          '.',
        'ERROR',
        'Reactivar la tarea, cambiar TAREA_ID o desactivar la relación.'
      );
    }

    if (
      material &&
      String(
        material.ACTIVO || ''
      )
        .trim()
        .toUpperCase() === 'NO'
    ) {
      agregar(
        'FUNC-TMA-004',
        'TAREA_MATERIAL',
        relacion.ID,
        'TAREA_MATERIAL activo con MATERIAL_ID inactivo: ' +
          materialId +
          '.',
        'ERROR',
        'Reactivar el material, cambiar MATERIAL_ID o desactivar la relación.'
      );
    }
  });
}

function detectarDuplicidadesRelacionesMaterial_(agregar) {
  detectarDuplicidadesRelacionMaterial_(
    'PRODUCTO_MATERIAL',
    [
      'PRODUCTO_ID',
      'MATERIAL_ID'
    ],
    'FUNC-PMA-003',
    agregar
  );

  detectarDuplicidadesRelacionMaterial_(
    'TAREA_MATERIAL',
    [
      'TAREA_ID',
      'MATERIAL_ID'
    ],
    'FUNC-TMA-005',
    agregar
  );
}


function detectarDuplicidadesRelacionMaterial_(
  entidad,
  camposClave,
  codigo,
  agregar
) {
  var relaciones =
    listarRegistros(
      entidad,
      {ACTIVO: 'SÍ'}
    );

  var primeraRelacionPorClave = {};

  relaciones.forEach(
    function(relacion) {
      var valoresClave =
        camposClave.map(
          function(campo) {
            return String(
              relacion[campo] || ''
            ).trim();
          }
        );

      /*
       * Las claves incompletas se auditan mediante
       * las reglas de obligatoriedad o referencias.
       */
      var claveCompleta =
        valoresClave.every(
          function(valor) {
            return valor !== '';
          }
        );

      if (!claveCompleta) {
        return;
      }

      /*
       * Separador improbable para evitar colisiones
       * entre combinaciones distintas.
       */
      var claveFuncional =
        valoresClave.join('\u001F');

      var primeraRelacion =
        primeraRelacionPorClave[
          claveFuncional
        ];

      if (!primeraRelacion) {
        primeraRelacionPorClave[
          claveFuncional
        ] = relacion;

        return;
      }

      agregar(
        codigo,
        entidad,
        relacion.ID,
        entidad +
          ' activa duplicada para ' +
          camposClave.join(' + ') +
          ': ' +
          valoresClave.join(' / ') +
          '. Primera relación: ' +
          primeraRelacion.ID +
          '. Relación duplicada: ' +
          relacion.ID +
          '.',
        'ERROR',
        'Desactivar o eliminar una de las relaciones duplicadas y conservar una única relación activa.'
      );
    }
  );
}