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
  var hoja = obtenerHojaEntidad_(entidad);
  var valores = hoja.getDataRange().getDisplayValues();
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

  var hoja = obtenerHojaEntidad_(entidad);
  var valores = hoja.getDataRange().getDisplayValues();

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
  listarRegistros('TAREA', {ACTIVO: 'SÍ'})
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
    });
}

function detectarProblemasTareaResponsable_(agregar) {
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

    asignacionesPorPersona_[
      a.PERSONA_EQUIPO_ID
    ] =
      (
        asignacionesPorPersona_[
          a.PERSONA_EQUIPO_ID
        ] || 0
      ) + pct;
  });

  Object.keys(asignacionesPorPersona_)
    .forEach(function (personaId) {
      var total =
        asignacionesPorPersona_[personaId];

      if (total > 100) {
        agregar(
          'FUNC-REC-001',
          'PERSONA_EQUIPO',
          personaId,
          'Dedicacion total asignada (' +
            total +
            '%) supera el 100%.',
          'ADVERTENCIA',
          'Redistribuir la carga o revisar las asignaciones.'
        );
      }
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
  var reporte = {
    idsDuplicados: {},
    referenciasHuerfanas: {}
  };

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

  reporte.funcional =
    detectarProblemasFuncionales_();

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