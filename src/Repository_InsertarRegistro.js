function validarEquipoMiembro_(datos, idExcluir, contextoOpcional) {
  datos = datos || {};
  var equipoId = String(datos.EQUIPO_ID || '').trim();
  var miembroId = String(datos.MIEMBRO_ID || '').trim();
  var contexto = contextoOpcional || {};
  var personasEquipos = Array.isArray(contexto.personasEquipos)
    ? contexto.personasEquipos
    : listarRegistros('PERSONA_EQUIPO', {});
  var relaciones = Array.isArray(contexto.relaciones)
    ? contexto.relaciones
    : listarRegistros('EQUIPO_MIEMBRO', {});
  var porId = {};

  personasEquipos.forEach(function (registro) {
    porId[String(registro.ID || '').trim()] = registro;
  });

  if (!equipoId) {
    throw new Error('ERROR_EQUIPO_INVALIDO: El equipo seleccionado debe existir, estar activo, no estar Inactivo y tener TIPO=Equipo.');
  }
  if (!miembroId) {
    throw new Error('ERROR_MIEMBRO_INVALIDO: El miembro seleccionado debe existir, estar activo, no estar Inactivo y tener TIPO=Persona.');
  }

  var equipo = porId[equipoId];
  var miembro = porId[miembroId];

  if (!equipo || String(equipo.ACTIVO || '').trim() !== 'SÍ' || String(equipo.ESTADO || '').trim() === 'Inactivo') {
    throw new Error('ERROR_EQUIPO_INVALIDO: El equipo seleccionado debe existir, estar activo, no estar Inactivo y tener TIPO=Equipo.');
  }
  if (!miembro || String(miembro.ACTIVO || '').trim() !== 'SÍ' || String(miembro.ESTADO || '').trim() === 'Inactivo') {
    throw new Error('ERROR_MIEMBRO_INVALIDO: El miembro seleccionado debe existir, estar activo, no estar Inactivo y tener TIPO=Persona.');
  }
  if (equipoId === miembroId) {
    throw new Error('ERROR_AUTORRELACION_EQUIPO_MIEMBRO: Un registro no puede ser simultáneamente equipo y miembro de la misma relación.');
  }
  if (String(equipo.TIPO || '').trim() !== 'Equipo') {
    throw new Error('ERROR_EQUIPO_INVALIDO: El equipo seleccionado debe existir, estar activo, no estar Inactivo y tener TIPO=Equipo.');
  }
  if (String(miembro.TIPO || '').trim() !== 'Persona') {
    throw new Error('ERROR_MIEMBRO_INVALIDO: El miembro seleccionado debe existir, estar activo, no estar Inactivo y tener TIPO=Persona.');
  }

  var duplicada = relaciones.some(function (relacion) {
    if (idExcluir && String(relacion.ID || '').trim() === String(idExcluir).trim()) return false;
    return String(relacion.EQUIPO_ID || '').trim() === equipoId &&
      String(relacion.MIEMBRO_ID || '').trim() === miembroId &&
      String(relacion.ACTIVO || '').trim() === 'SÍ' &&
      String(relacion.ESTADO || '').trim() === 'Activa';
  });

  if (duplicada) {
    throw new Error('ERROR_DUPLICIDAD_EQUIPO_MIEMBRO: Ya existe una relación activa entre este equipo y esta persona.');
  }

  return {equipo: equipo, miembro: miembro};
}

function insertarRegistroTransaccional(claveEntidad, datos, opciones) {
  const clave = String(claveEntidad || '')
    .trim()
    .toUpperCase();

  const entidad = ENTIDADES_MVP[clave];

  if (!entidad) {
    throw new Error(
      'Entidad no configurada: ' + claveEntidad
    );
  }

  if (
    !datos ||
    typeof datos !== 'object' ||
    Array.isArray(datos)
  ) {
    throw new Error(
      'Los datos del registro no son válidos'
    );
  }

  const configuracion = Object.assign(
    {
      dryRun: false,
      idExcluir: null,
      origen: 'SCRIPT',
      correlationId: null,
      esPrueba: false,
      pruebaId: ''
    },
    opciones || {}
  );

  if (typeof configuracion.dryRun !== 'boolean') {
    throw new Error(
      'La opción dryRun debe ser booleana'
    );
  }

  const bloqueo = LockService.getScriptLock();

  try {
    bloqueo.waitLock(10000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName(entidad.hoja);

    if (!hoja) {
      throw new Error(
        'No existe la hoja: ' + entidad.hoja
      );
    }

    const ultimaColumna = hoja.getLastColumn();

    const cabeceras = hoja
      .getRange(
        1,
        1,
        1,
        ultimaColumna
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

    if (!cabeceras.includes('ID')) {
      throw new Error(
        'La hoja ' +
        entidad.hoja +
        ' no contiene la columna ID'
      );
    }

    const camposDesconocidos = Object.keys(datos)
      .filter(function(campo) {
        return !cabeceras.includes(campo);
      });

    if (camposDesconocidos.length > 0) {
      throw new Error(
        'Campos no reconocidos: ' +
        camposDesconocidos.join(', ')
      );
    }

    const camposSistema = [
      'ID',
      'FECHA_CREACION',
      'CREADO_POR',
      'FECHA_MODIFICACION',
      'MODIFICADO_POR'
    ];

    const camposSistemaRecibidos = Object.keys(datos)
      .filter(function(campo) {
        return camposSistema.includes(campo);
      });

    if (camposSistemaRecibidos.length > 0) {
      throw new Error(
        'Campos gestionados por el sistema no permitidos: ' +
        camposSistemaRecibidos.join(', ')
      );
    }

    const camposObligatorios =
      CAMPOS_OBLIGATORIOS_MVP[clave] || [];

    const camposObligatoriosVacios =
      camposObligatorios.filter(function(campo) {
        if (
          !Object.prototype.hasOwnProperty.call(
            datos,
            campo
          )
        ) {
          return true;
        }

        const valor = datos[campo];

        return valor === null ||
          valor === undefined ||
          (
            typeof valor === 'string' &&
            valor.trim() === ''
          );
      });

    if (camposObligatoriosVacios.length > 0) {
      throw new Error(
        'Campos obligatorios ausentes o vacíos: ' +
        camposObligatoriosVacios.join(', ')
      );
    }

    if (clave === 'EQUIPO_MIEMBRO') {
      validarEquipoMiembro_(datos, configuracion.idExcluir);
    }

    /*
     * Validaciones específicas de campaña.
     */
    if (clave === 'CAMPANA') {
      const fechaInicio =
        datos.FECHA_INICIO_PLAN;

      const fechaFin =
        datos.FECHA_FIN_PLAN;

      if (
        !(fechaInicio instanceof Date) ||
        isNaN(fechaInicio.getTime())
      ) {
        throw new Error(
          'FECHA_INICIO_PLAN debe ser una fecha válida'
        );
      }

      if (
        !(fechaFin instanceof Date) ||
        isNaN(fechaFin.getTime())
      ) {
        throw new Error(
          'FECHA_FIN_PLAN debe ser una fecha válida'
        );
      }

      if (
        fechaFin.getTime() <
        fechaInicio.getTime()
      ) {
        throw new Error(
          'FECHA_FIN_PLAN no puede ser anterior a FECHA_INICIO_PLAN'
        );
      }

      const rangoEstadosCampana =
        ss.getRangeByName(
          'CFG_ESTADO_CAMPANA'
        );

      if (!rangoEstadosCampana) {
        throw new Error(
          'No existe el rango CFG_ESTADO_CAMPANA'
        );
      }

      const estadosValidos =
        rangoEstadosCampana
          .getDisplayValues()
          .flat()
          .map(function(valor) {
            return String(valor).trim();
          })
          .filter(function(valor) {
            return valor !== '';
          });

      if (
        !estadosValidos.includes(
          String(datos.ESTADO).trim()
        )
      ) {
        throw new Error(
          'ESTADO de campaña no válido: ' +
          datos.ESTADO
        );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          datos,
          'PORCENTAJE_AVANCE'
        )
      ) {
        const porcentaje =
          datos.PORCENTAJE_AVANCE;

        if (
          typeof porcentaje !== 'number' ||
          !Number.isFinite(porcentaje) ||
          porcentaje < 0 ||
          porcentaje > 100
        ) {
          throw new Error(
            'PORCENTAJE_AVANCE debe ser un número entre 0 y 100'
          );
        }
      }

      if (
        Object.prototype.hasOwnProperty.call(
          datos,
          'RESPONSABLE_ID'
        ) &&
        String(
          datos.RESPONSABLE_ID || ''
        ).trim() !== ''
      ) {
        const responsableId =
          String(
            datos.RESPONSABLE_ID
          ).trim();

        const hojaResponsables =
          ss.getSheetByName(
            '11_PERSONAS_EQUIPOS'
          );

        if (!hojaResponsables) {
          throw new Error(
            'No existe la hoja 11_PERSONAS_EQUIPOS'
          );
        }

        const ultimaFilaResponsables =
          hojaResponsables.getLastRow();

        const responsablesExistentes =
          ultimaFilaResponsables < 2
            ? []
            : hojaResponsables
              .getRange(
                2,
                1,
                ultimaFilaResponsables - 1,
                1
              )
              .getDisplayValues()
              .flat()
              .map(function(valor) {
                return String(valor).trim();
              })
              .filter(function(valor) {
                return valor !== '';
              });

        if (
          !responsablesExistentes.includes(
            responsableId
          )
        ) {
          throw new Error(
            'RESPONSABLE_ID de campaña no existe: ' +
            responsableId
          );
        }
      }
    }

    /*
     * Validaciones específicas de producto.
     */
    if (clave === 'PRODUCTO') {
      const codigoProducto =
        String(
          datos.CODIGO || ''
        )
          .trim()
          .toUpperCase();

      const indiceCodigo =
        cabeceras.indexOf('CODIGO');

      if (indiceCodigo === -1) {
        throw new Error(
          'La hoja ' +
          entidad.hoja +
          ' no contiene la columna CODIGO'
        );
      }

      const ultimaFilaProductos =
        hoja.getLastRow();

      const indiceIdProducto =
        cabeceras.indexOf('ID');

      const codigosExistentes =
        ultimaFilaProductos < 2
          ? []
          : hoja
            .getRange(
              2,
              1,
              ultimaFilaProductos - 1,
              cabeceras.length
            )
            .getDisplayValues()
            .filter(function(fila) {
              return String(fila[indiceIdProducto]) !== String(configuracion.idExcluir || '');
            })
            .map(function(fila) {
              return String(fila[indiceCodigo])
                .trim()
                .toUpperCase();
            })
            .filter(function(valor) {
              return valor !== '';
            });

      if (
        codigosExistentes.includes(
          codigoProducto
        )
      ) {
        throw new Error(
          'CODIGO de producto duplicado: ' +
          codigoProducto
        );
      }

      validarValorCatalogoRepository_(
        datos.ORIGEN,
        'CFG_ORIGEN_PRODUCTO',
        'ORIGEN'
      );

      validarValorCatalogoRepository_(
        datos.UNIDAD,
        'CFG_UNIDAD',
        'UNIDAD'
      );

      validarValorCatalogoRepository_(
        datos.ESTADO,
        'CFG_ESTADO_PRODUCTO',
        'ESTADO'
      );
    }

    /*
     * Validaciones específicas de proyecto.
     */
    if (clave === 'PROYECTO') {
      const campanaId =
        String(
          datos.CAMPANA_ID || ''
        )
          .trim()
          .toUpperCase();

      const hojaCampanas =
        ss.getSheetByName(
          '01_CAMPANAS'
        );

      if (!hojaCampanas) {
        throw new Error(
          'No existe la hoja 01_CAMPANAS'
        );
      }

      const cabecerasCampanas =
        hojaCampanas
          .getRange(
            1,
            1,
            1,
            hojaCampanas.getLastColumn()
          )
          .getDisplayValues()[0]
          .map(function(valor) {
            return String(valor).trim();
          });

      const indiceIdCampana =
        cabecerasCampanas.indexOf('ID');

      if (indiceIdCampana === -1) {
        throw new Error(
          'La hoja 01_CAMPANAS no contiene la columna ID'
        );
      }

      const ultimaFilaCampanas =
        hojaCampanas.getLastRow();

      const campanasExistentes =
        ultimaFilaCampanas < 2
          ? []
          : hojaCampanas
            .getRange(
              2,
              indiceIdCampana + 1,
              ultimaFilaCampanas - 1,
              1
            )
            .getDisplayValues()
            .flat()
            .map(function(valor) {
              return String(valor)
                .trim()
                .toUpperCase();
            })
            .filter(function(valor) {
              return valor !== '';
            });

      if (
        !campanasExistentes.includes(
          campanaId
        )
      ) {
        throw new Error(
          'CAMPANA_ID de proyecto no existe: ' +
          campanaId
        );
      }

      validarValorCatalogoRepository_(
        datos.TIPO_PROYECTO,
        'CFG_TIPO_PROYECTO',
        'TIPO_PROYECTO'
      );

      validarValorCatalogoRepository_(
        datos.PRIORIDAD,
        'CFG_PRIORIDAD',
        'PRIORIDAD'
      );

      validarValorCatalogoRepository_(
        datos.ESTADO,
        'CFG_ESTADO_PROYECTO',
        'ESTADO'
      );
      /*
       * Coherencia de fechas reales y estado (FASE 1.2, anadido de forma
       * autonoma siguiendo el mismo patron que TAREA -- FASE 1.1). PROYECTO no
       * tiene DURACION_REAL_DIAS, por lo que la regla se reduce a fechas:
       * Borrador/Planificado no admiten FECHA_INICIO_REAL; En proceso exige
       * FECHA_INICIO_REAL; Completado exige FECHA_INICIO_REAL y FECHA_FIN_REAL
       * coherentes entre si.
       */
      var estadoProyectoCoherencia = datos.ESTADO;
      var tieneFechaInicioRealProyecto = datos.FECHA_INICIO_REAL !== undefined && datos.FECHA_INICIO_REAL !== null && String(datos.FECHA_INICIO_REAL).trim() !== '';
      var tieneFechaFinRealProyecto = datos.FECHA_FIN_REAL !== undefined && datos.FECHA_FIN_REAL !== null && String(datos.FECHA_FIN_REAL).trim() !== '';

      if ((estadoProyectoCoherencia === 'Borrador' || estadoProyectoCoherencia === 'Planificado') && tieneFechaInicioRealProyecto) {
        throw new Error('ERROR_INSERCION_PROYECTO: FECHA_INICIO_REAL no es compatible con ESTADO ' + estadoProyectoCoherencia + '.');
      }

      if (estadoProyectoCoherencia === 'En proceso' && !tieneFechaInicioRealProyecto) {
        throw new Error('ERROR_INSERCION_PROYECTO: ESTADO En proceso requiere FECHA_INICIO_REAL.');
      }

      if (estadoProyectoCoherencia === 'Completado') {
        if (!tieneFechaInicioRealProyecto || !tieneFechaFinRealProyecto) {
          throw new Error('ERROR_INSERCION_PROYECTO: ESTADO Completado requiere FECHA_INICIO_REAL y FECHA_FIN_REAL.');
        }
        var fechaInicioRealProyecto = new Date(datos.FECHA_INICIO_REAL);
        var fechaFinRealProyecto = new Date(datos.FECHA_FIN_REAL);
        if (fechaFinRealProyecto.getTime() < fechaInicioRealProyecto.getTime()) {
          throw new Error('ERROR_INSERCION_PROYECTO: FECHA_FIN_REAL no puede ser anterior a FECHA_INICIO_REAL.');
        }
      }
    }

    

    /*
     * Validaciones específicas de relación
     * proyecto-producto.
     */


if (clave === 'PROYECTO_PRODUCTO') {
  const proyectoId =
    String(
      datos.PROYECTO_ID || ''
    )
      .trim()
      .toUpperCase();

  const hojaProyectos =
    ss.getSheetByName(
      '02_PROYECTOS'
    );

  if (!hojaProyectos) {
    throw new Error(
      'No existe la hoja 02_PROYECTOS'
    );
  }

  const cabecerasProyectos =
    hojaProyectos
      .getRange(
        1,
        1,
        1,
        hojaProyectos.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

  const indiceIdProyecto =
    cabecerasProyectos.indexOf('ID');

  if (indiceIdProyecto === -1) {
    throw new Error(
      'La hoja 02_PROYECTOS no contiene la columna ID'
    );
  }

  const ultimaFilaProyectos =
    hojaProyectos.getLastRow();

  const proyectosExistentes =
    ultimaFilaProyectos < 2
      ? []
      : hojaProyectos
        .getRange(
          2,
          indiceIdProyecto + 1,
          ultimaFilaProyectos - 1,
          1
        )
        .getDisplayValues()
        .flat()
        .map(function(valor) {
          return String(valor)
            .trim()
            .toUpperCase();
        })
        .filter(function(valor) {
          return valor !== '';
        });

  if (
    !proyectosExistentes.includes(
      proyectoId
    )
  ) {
    throw new Error(
      'PROYECTO_ID de relación no existe: ' +
      proyectoId
    );
  }

  const productoId =
    String(
      datos.PRODUCTO_ID || ''
    )
      .trim()
      .toUpperCase();

  const hojaProductos =
    ss.getSheetByName(
      '03_PRODUCTOS'
    );

  if (!hojaProductos) {
    throw new Error(
      'No existe la hoja 03_PRODUCTOS'
    );
  }

  const cabecerasProductos =
    hojaProductos
      .getRange(
        1,
        1,
        1,
        hojaProductos.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

  const indiceIdProducto =
    cabecerasProductos.indexOf('ID');

  if (indiceIdProducto === -1) {
    throw new Error(
      'La hoja 03_PRODUCTOS no contiene la columna ID'
    );
  }

  const ultimaFilaProductosRelacion =
    hojaProductos.getLastRow();

  const productosExistentes =
    ultimaFilaProductosRelacion < 2
      ? []
      : hojaProductos
        .getRange(
          2,
          indiceIdProducto + 1,
          ultimaFilaProductosRelacion - 1,
          1
        )
        .getDisplayValues()
        .flat()
        .map(function(valor) {
          return String(valor)
            .trim()
            .toUpperCase();
        })
        .filter(function(valor) {
          return valor !== '';
        });

  if (
    !productosExistentes.includes(
      productoId
    )
  ) {
    throw new Error(
      'PRODUCTO_ID de relación no existe: ' +
      productoId
    );
  }

  validarValorCatalogoRepository_(
    datos.PRIORIDAD,
    'CFG_PRIORIDAD',
    'PRIORIDAD'
  );

  const cantidadAsignada =
    datos.CANTIDAD_ASIGNADA;

  if (
    typeof cantidadAsignada !== 'number' ||
    !Number.isFinite(cantidadAsignada) ||
    cantidadAsignada <= 0
  ) {
    throw new Error(
      'CANTIDAD_ASIGNADA debe ser un número mayor que 0'
    );
  }

  const indiceProyectoRelacion =
    cabeceras.indexOf('PROYECTO_ID');

  const indiceProductoRelacion =
    cabeceras.indexOf('PRODUCTO_ID');

  if (
    indiceProyectoRelacion === -1 ||
    indiceProductoRelacion === -1
  ) {
    throw new Error(
      'La hoja 04_PROYECTO_PRODUCTO no contiene PROYECTO_ID o PRODUCTO_ID'
    );
  }

  const ultimaFilaRelaciones =
    hoja.getLastRow();

  const relacionesExistentes =
    ultimaFilaRelaciones < 2
      ? []
      : hoja
        .getRange(
          2,
          1,
          ultimaFilaRelaciones - 1,
          cabeceras.length
        )
        .getDisplayValues();

  const indiceIdRelacion =
    cabeceras.indexOf('ID');

  const relacionDuplicada =
    relacionesExistentes
      .filter(function(fila) {
        return String(fila[indiceIdRelacion]) !== String(configuracion.idExcluir || '');
      })
      .some(function(fila) {
      const proyectoExistente =
        String(
          fila[indiceProyectoRelacion]
        )
          .trim()
          .toUpperCase();

      const productoExistente =
        String(
          fila[indiceProductoRelacion]
        )
          .trim()
          .toUpperCase();

      return (
        proyectoExistente === proyectoId &&
        productoExistente === productoId
      );
    });

  if (relacionDuplicada) {
    throw new Error(
      'Relación PROYECTO_ID/PRODUCTO_ID duplicada: ' +
      proyectoId +
      ' / ' +
      productoId
    );
  }
}
    /*
     * Validaciones específicas de proceso.
     */
    if (clave === 'PROCESO') {
      const productoId =
        String(
          datos.PRODUCTO_ID || ''
        )
          .trim()
          .toUpperCase();

      if (productoId === '') {
        throw new Error(
          'PRODUCTO_ID es obligatorio para PROCESO'
        );
      }

      const hojaProductosProceso =
        ss.getSheetByName(
          '03_PRODUCTOS'
        );

      if (!hojaProductosProceso) {
        throw new Error(
          'No existe la hoja 03_PRODUCTOS'
        );
      }

      const ultimaColumnaProductosProceso =
        hojaProductosProceso.getLastColumn();

      if (ultimaColumnaProductosProceso < 1) {
        throw new Error(
          'La hoja 03_PRODUCTOS no contiene columnas'
        );
      }

      const cabecerasProductosProceso =
        hojaProductosProceso
          .getRange(
            1,
            1,
            1,
            ultimaColumnaProductosProceso
          )
          .getDisplayValues()[0]
          .map(function(valor) {
            return String(valor).trim();
          });

      const indiceIdProductoProceso =
        cabecerasProductosProceso.indexOf('ID');

      if (indiceIdProductoProceso === -1) {
        throw new Error(
          'La hoja 03_PRODUCTOS no contiene la columna ID'
        );
      }

      const ultimaFilaProductosProceso =
        hojaProductosProceso.getLastRow();

      const productosProcesoExistentes =
        ultimaFilaProductosProceso < 2
          ? []
          : hojaProductosProceso
            .getRange(
              2,
              indiceIdProductoProceso + 1,
              ultimaFilaProductosProceso - 1,
              1
            )
            .getDisplayValues()
            .flat()
            .map(function(valor) {
              return String(valor)
                .trim()
                .toUpperCase();
            })
            .filter(function(valor) {
              return valor !== '';
            });

      if (
        !productosProcesoExistentes.includes(
          productoId
        )
      ) {
        throw new Error(
          'PRODUCTO_ID de proceso no existe: ' +
          productoId
        );
      }

      const ordenSecuencia =
        datos.ORDEN_SECUENCIA;

      if (
        typeof ordenSecuencia !== 'number' ||
        !Number.isFinite(ordenSecuencia) ||
        !Number.isInteger(ordenSecuencia) ||
        ordenSecuencia <= 0
      ) {
        throw new Error(
          'ORDEN_SECUENCIA debe ser un número entero mayor que 0'
        );
      }

      const indiceProductoProcesoExistente =
        cabeceras.indexOf('PRODUCTO_ID');

      const indiceOrdenProcesoExistente =
        cabeceras.indexOf('ORDEN_SECUENCIA');

      if (
        indiceProductoProcesoExistente === -1 ||
        indiceOrdenProcesoExistente === -1
      ) {
        throw new Error(
          'La hoja 05_PROCESOS no contiene las columnas PRODUCTO_ID y ORDEN_SECUENCIA'
        );
      }

      const ultimaFilaProcesosOrden =
        hoja.getLastRow();

      if (ultimaFilaProcesosOrden >= 2) {
        const filasProcesosOrden =
          hoja
            .getRange(
              2,
              1,
              ultimaFilaProcesosOrden - 1,
              hoja.getLastColumn()
            )
            .getValues();

        const indiceIdProcesoOrden =
          cabeceras.indexOf('ID');

        const ordenDuplicado =
          filasProcesosOrden
            .filter(function(fila) {
              return String(fila[indiceIdProcesoOrden]) !== String(configuracion.idExcluir || '');
            })
            .some(
            function(fila) {
              const productoExistente =
                String(
                  fila[
                    indiceProductoProcesoExistente
                  ] || ''
                )
                  .trim()
                  .toUpperCase();

              const ordenExistente =
                Number(
                  fila[
                    indiceOrdenProcesoExistente
                  ]
                );

              return (
                productoExistente === productoId &&
                ordenExistente === ordenSecuencia
              );
            }
          );

        if (ordenDuplicado) {
          throw new Error(
            'ORDEN_SECUENCIA duplicado para PRODUCTO_ID: ' +
            productoId +
            ' / ' +
            ordenSecuencia
          );
        }
      }

      const duracionPrevista =
        datos.DURACION_PREVISTA_DIAS;

      if (
        typeof duracionPrevista !== 'number' ||
        !Number.isFinite(duracionPrevista) ||
        duracionPrevista <= 0
      ) {
        throw new Error(
          'DURACION_PREVISTA_DIAS debe ser un número mayor que 0'
        );
      }

      validarValorCatalogoRepository_(
        datos.ESTADO,
        'CFG_ESTADO_PROCESO',
        'ESTADO'
      );

      const porcentajeAvance =
        datos.PORCENTAJE_AVANCE;

      if (
        typeof porcentajeAvance !== 'number' ||
        !Number.isFinite(porcentajeAvance) ||
        porcentajeAvance < 0 ||
        porcentajeAvance > 100
      ) {
        throw new Error(
          'PORCENTAJE_AVANCE debe ser un número entre 0 y 100'
        );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          datos,
          'PROCESO_PREDECESOR_ID'
        ) &&
        String(
          datos.PROCESO_PREDECESOR_ID || ''
        ).trim() !== ''
      ) {
        const procesoPredecesorId =
          String(
            datos.PROCESO_PREDECESOR_ID
          )
            .trim()
            .toUpperCase();

        const indiceIdProceso =
          cabeceras.indexOf('ID');

        if (indiceIdProceso === -1) {
          throw new Error(
            'La hoja 05_PROCESOS no contiene la columna ID'
          );
        }

        const indiceProductoProceso =
          cabeceras.indexOf('PRODUCTO_ID');

        if (indiceProductoProceso === -1) {
          throw new Error(
            'La hoja 05_PROCESOS no contiene la columna PRODUCTO_ID'
          );
        }

        const ultimaFilaProcesos =
          hoja.getLastRow();

        const filasProcesosExistentes =
          ultimaFilaProcesos < 2
            ? []
            : hoja
              .getRange(
                2,
                1,
                ultimaFilaProcesos - 1,
                hoja.getLastColumn()
              )
              .getDisplayValues();

        const procesoPredecesor =
          filasProcesosExistentes.find(
            function(fila) {
              return (
                String(
                  fila[indiceIdProceso] || ''
                )
                  .trim()
                  .toUpperCase() ===
                procesoPredecesorId
              );
            }
          );

        if (!procesoPredecesor) {
          throw new Error(
            'PROCESO_PREDECESOR_ID no existe: ' +
            procesoPredecesorId
          );
        }

        const productoPredecesorId =
          String(
            procesoPredecesor[
              indiceProductoProceso
            ] || ''
          )
            .trim()
            .toUpperCase();

        if (
          productoPredecesorId !== productoId
        ) {
          throw new Error(
            'PROCESO_PREDECESOR_ID pertenece a otro producto: ' +
            procesoPredecesorId
          );
        }

        datos.PROCESO_PREDECESOR_ID =
          procesoPredecesorId;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          datos,
          'RESPONSABLE_ID'
        ) &&
        String(
          datos.RESPONSABLE_ID || ''
        ).trim() !== ''
      ) {
        const responsableId =
          String(
            datos.RESPONSABLE_ID
          )
            .trim()
            .toUpperCase();

        const hojaResponsables =
          ss.getSheetByName(
            '11_PERSONAS_EQUIPOS'
          );

        if (!hojaResponsables) {
          throw new Error(
            'No existe la hoja 11_PERSONAS_EQUIPOS'
          );
        }

        const ultimaColumnaResponsables =
          hojaResponsables.getLastColumn();

        if (ultimaColumnaResponsables < 1) {
          throw new Error(
            'La hoja 11_PERSONAS_EQUIPOS no contiene columnas'
          );
        }

        const cabecerasResponsables =
          hojaResponsables
            .getRange(
              1,
              1,
              1,
              ultimaColumnaResponsables
            )
            .getDisplayValues()[0]
            .map(function(valor) {
              return String(valor).trim();
            });

        const indiceIdResponsable =
          cabecerasResponsables.indexOf('ID');

        if (indiceIdResponsable === -1) {
          throw new Error(
            'La hoja 11_PERSONAS_EQUIPOS no contiene la columna ID'
          );
        }

        const ultimaFilaResponsables =
          hojaResponsables.getLastRow();

        const responsablesExistentes =
          ultimaFilaResponsables < 2
            ? []
            : hojaResponsables
              .getRange(
                2,
                indiceIdResponsable + 1,
                ultimaFilaResponsables - 1,
                1
              )
              .getDisplayValues()
              .flat()
              .map(function(valor) {
                return String(valor)
                  .trim()
                  .toUpperCase();
              })
              .filter(function(valor) {
                return valor !== '';
              });

        if (
          !responsablesExistentes.includes(
            responsableId
          )
        ) {
          throw new Error(
            'RESPONSABLE_ID de proceso no existe: ' +
            responsableId
          );
        }

        datos.RESPONSABLE_ID =
          responsableId;
      }

      const tieneFechaInicioPlan =
        Object.prototype.hasOwnProperty.call(
          datos,
          'FECHA_INICIO_PLAN'
        ) &&
        datos.FECHA_INICIO_PLAN !== '';

      const tieneFechaFinPlan =
        Object.prototype.hasOwnProperty.call(
          datos,
          'FECHA_FIN_PLAN'
        ) &&
        datos.FECHA_FIN_PLAN !== '';

      if (tieneFechaInicioPlan) {
        if (
          !(
            datos.FECHA_INICIO_PLAN
            instanceof Date
          ) ||
          isNaN(
            datos.FECHA_INICIO_PLAN.getTime()
          )
        ) {
          throw new Error(
            'FECHA_INICIO_PLAN debe ser una fecha válida'
          );
        }
      }

      if (tieneFechaFinPlan) {
        if (
          !(
            datos.FECHA_FIN_PLAN
            instanceof Date
          ) ||
          isNaN(
            datos.FECHA_FIN_PLAN.getTime()
          )
        ) {
          throw new Error(
            'FECHA_FIN_PLAN debe ser una fecha válida'
          );
        }
      }

      if (
        tieneFechaInicioPlan &&
        tieneFechaFinPlan &&
        datos.FECHA_FIN_PLAN.getTime() <
          datos.FECHA_INICIO_PLAN.getTime()
      ) {
        throw new Error(
          'FECHA_FIN_PLAN no puede ser anterior a FECHA_INICIO_PLAN'
        );
      }

      datos.PRODUCTO_ID =
        productoId;
      /*
       * Coherencia de fechas reales y estado (FASE 1.2, anadido de forma
       * autonoma siguiendo el mismo patron que TAREA -- FASE 1.1). Reglas
       * cruzadas que el motor generico no cubre:
       * Pendiente/Preparado no admiten FECHA_INICIO_REAL; En proceso exige
       * FECHA_INICIO_REAL; Completado exige FECHA_INICIO_REAL, FECHA_FIN_REAL
       * (coherentes entre si) y DURACION_REAL_DIAS > 0.
       */
      var estadoProcesoCoherencia = datos.ESTADO;
      var tieneFechaInicioRealProceso = datos.FECHA_INICIO_REAL !== undefined && datos.FECHA_INICIO_REAL !== null && String(datos.FECHA_INICIO_REAL).trim() !== '';
      var tieneFechaFinRealProceso = datos.FECHA_FIN_REAL !== undefined && datos.FECHA_FIN_REAL !== null && String(datos.FECHA_FIN_REAL).trim() !== '';
      var tieneDuracionRealProceso = datos.DURACION_REAL_DIAS !== undefined && datos.DURACION_REAL_DIAS !== null && String(datos.DURACION_REAL_DIAS).trim() !== '';

      if ((estadoProcesoCoherencia === 'Pendiente' || estadoProcesoCoherencia === 'Preparado') && tieneFechaInicioRealProceso) {
        throw new Error('ERROR_INSERCION_PROCESO: FECHA_INICIO_REAL no es compatible con ESTADO ' + estadoProcesoCoherencia + '.');
      }

      if (estadoProcesoCoherencia === 'En proceso' && !tieneFechaInicioRealProceso) {
        throw new Error('ERROR_INSERCION_PROCESO: ESTADO En proceso requiere FECHA_INICIO_REAL.');
      }

      if (estadoProcesoCoherencia === 'Completado') {
        if (!tieneFechaInicioRealProceso || !tieneFechaFinRealProceso) {
          throw new Error('ERROR_INSERCION_PROCESO: ESTADO Completado requiere FECHA_INICIO_REAL y FECHA_FIN_REAL.');
        }
        var fechaInicioRealProceso = new Date(datos.FECHA_INICIO_REAL);
        var fechaFinRealProceso = new Date(datos.FECHA_FIN_REAL);
        if (fechaFinRealProceso.getTime() < fechaInicioRealProceso.getTime()) {
          throw new Error('ERROR_INSERCION_PROCESO: FECHA_FIN_REAL no puede ser anterior a FECHA_INICIO_REAL.');
        }
        if (!tieneDuracionRealProceso) {
          throw new Error('ERROR_INSERCION_PROCESO: ESTADO Completado requiere DURACION_REAL_DIAS.');
        }
        var duracionRealProceso = Number(datos.DURACION_REAL_DIAS);
        if (!isFinite(duracionRealProceso) || duracionRealProceso <= 0) {
          throw new Error('ERROR_INSERCION_PROCESO: DURACION_REAL_DIAS debe ser un numero mayor que 0.');
        }
      }
    }

    /*
     * Validaciones específicas de tarea.
     */
if (clave === 'TAREA') {
  const procesoId =
    String(
      datos.PROCESO_ID || ''
    )
      .trim()
      .toUpperCase();

  if (procesoId === '') {
    throw new Error(
      'PROCESO_ID es obligatorio para TAREA'
    );
  }

  const hojaProcesosTarea =
    ss.getSheetByName(
      '05_PROCESOS'
    );

  if (!hojaProcesosTarea) {
    throw new Error(
      'No existe la hoja 05_PROCESOS'
    );
  }

  const ultimaColumnaProcesosTarea =
    hojaProcesosTarea.getLastColumn();

  if (ultimaColumnaProcesosTarea < 1) {
    throw new Error(
      'La hoja 05_PROCESOS no contiene columnas'
    );
  }

  const cabecerasProcesosTarea =
    hojaProcesosTarea
      .getRange(
        1,
        1,
        1,
        ultimaColumnaProcesosTarea
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor).trim();
      });

  const indiceIdProcesoTarea =
    cabecerasProcesosTarea.indexOf('ID');

  if (indiceIdProcesoTarea === -1) {
    throw new Error(
      'La hoja 05_PROCESOS no contiene la columna ID'
    );
  }

  const ultimaFilaProcesosTarea =
    hojaProcesosTarea.getLastRow();

  const procesosTareaExistentes =
    ultimaFilaProcesosTarea < 2
      ? []
      : hojaProcesosTarea
        .getRange(
          2,
          indiceIdProcesoTarea + 1,
          ultimaFilaProcesosTarea - 1,
          1
        )
        .getDisplayValues()
        .flat()
        .map(function(valor) {
          return String(valor)
            .trim()
            .toUpperCase();
        })
        .filter(function(valor) {
          return valor !== '';
        });

  if (
    !procesosTareaExistentes.includes(
      procesoId
    )
  ) {
    throw new Error(
      'PROCESO_ID de tarea no existe: ' +
      procesoId
    );
  }

  const ordenSecuencia =
    datos.ORDEN_SECUENCIA;

  if (
    typeof ordenSecuencia !== 'number' ||
    !Number.isFinite(ordenSecuencia) ||
    !Number.isInteger(ordenSecuencia) ||
    ordenSecuencia <= 0
  ) {
    throw new Error(
      'ORDEN_SECUENCIA debe ser un número entero mayor que 0'
    );
  }

  const indiceProcesoTarea =
    cabeceras.indexOf('PROCESO_ID');

  const indiceOrdenTarea =
    cabeceras.indexOf('ORDEN_SECUENCIA');

  if (
    indiceProcesoTarea === -1 ||
    indiceOrdenTarea === -1
  ) {
    throw new Error(
      'La hoja 06_TAREAS no contiene las columnas PROCESO_ID y ORDEN_SECUENCIA'
    );
  }

  const ultimaFilaTareas =
    hoja.getLastRow();

  if (ultimaFilaTareas >= 2) {
    const filasTareasExistentes =
      hoja
        .getRange(
          2,
          1,
          ultimaFilaTareas - 1,
          hoja.getLastColumn()
        )
        .getValues();

    const indiceIdTareaOrden =
      cabeceras.indexOf('ID');

    const ordenDuplicado =
      filasTareasExistentes
        .filter(function(fila) {
          return String(fila[indiceIdTareaOrden]) !== String(configuracion.idExcluir || '');
        })
        .some(
        function(fila) {
          const procesoExistente =
            String(
              fila[indiceProcesoTarea] || ''
            )
              .trim()
              .toUpperCase();

          const ordenExistente =
            Number(
              fila[indiceOrdenTarea]
            );

          return (
            procesoExistente === procesoId &&
            ordenExistente === ordenSecuencia
          );
        }
      );

    if (ordenDuplicado) {
      throw new Error(
        'ORDEN_SECUENCIA duplicado para PROCESO_ID: ' +
        procesoId +
        ' / ' +
        ordenSecuencia
      );
    }
  }

if (
  Object.prototype.hasOwnProperty.call(
    datos,
    'TAREA_PREDECESORA_ID'
  ) &&
  String(
    datos.TAREA_PREDECESORA_ID || ''
  ).trim() !== ''
) {
  const tareaPredecesoraId =
    String(
      datos.TAREA_PREDECESORA_ID
    )
      .trim()
      .toUpperCase();

  const indiceIdTarea =
    cabeceras.indexOf('ID');

  const indiceProcesoTareaExistente =
    cabeceras.indexOf('PROCESO_ID');

  const indiceOrdenTareaPredecesora =
    cabeceras.indexOf('ORDEN_SECUENCIA');

  if (indiceIdTarea === -1) {
    throw new Error(
      'La hoja 06_TAREAS no contiene la columna ID'
    );
  }

  if (
    indiceProcesoTareaExistente === -1
  ) {
    throw new Error(
      'La hoja 06_TAREAS no contiene la columna PROCESO_ID'
    );
  }

  if (
    indiceOrdenTareaPredecesora === -1
  ) {
    throw new Error(
      'La hoja 06_TAREAS no contiene la columna ORDEN_SECUENCIA'
    );
  }

  const ultimaFilaTareasPredecesoras =
    hoja.getLastRow();

  const filasTareasPredecesoras =
    ultimaFilaTareasPredecesoras < 2
      ? []
      : hoja
        .getRange(
          2,
          1,
          ultimaFilaTareasPredecesoras - 1,
          hoja.getLastColumn()
        )
        .getDisplayValues();

  const tareaPredecesora =
    filasTareasPredecesoras.find(
      function(fila) {
        return (
          String(
            fila[indiceIdTarea] || ''
          )
            .trim()
            .toUpperCase() ===
          tareaPredecesoraId
        );
      }
    );

  if (!tareaPredecesora) {
    throw new Error(
      'TAREA_PREDECESORA_ID no existe: ' +
      tareaPredecesoraId
    );
  }

  const procesoTareaPredecesora =
    String(
      tareaPredecesora[
        indiceProcesoTareaExistente
      ] || ''
    )
      .trim()
      .toUpperCase();

  if (
    procesoTareaPredecesora !== procesoId
  ) {
    throw new Error(
      'TAREA_PREDECESORA_ID pertenece a otro proceso: ' +
      tareaPredecesoraId
    );
  }

  const ordenTareaPredecesora =
    Number(
      tareaPredecesora[
        indiceOrdenTareaPredecesora
      ]
    );

  if (
    !Number.isFinite(
      ordenTareaPredecesora
    ) ||
    !Number.isInteger(
      ordenTareaPredecesora
    ) ||
    ordenTareaPredecesora <= 0
  ) {
    throw new Error(
      'ORDEN_SECUENCIA inválido en la tarea predecesora: ' +
      tareaPredecesoraId
    );
  }

  if (
    ordenTareaPredecesora >=
    ordenSecuencia
  ) {
    throw new Error(
      'ORDEN_SECUENCIA de la tarea predecesora debe ser menor que el de la nueva tarea: ' +
      tareaPredecesoraId +
      ' / ' +
      ordenTareaPredecesora +
      ' >= ' +
      ordenSecuencia
    );
  }

  datos.TAREA_PREDECESORA_ID =
    tareaPredecesoraId;
}

  const duracionPrevista =
    datos.DURACION_PREVISTA_DIAS;

  if (
    typeof duracionPrevista !== 'number' ||
    !Number.isFinite(duracionPrevista) ||
    duracionPrevista <= 0
  ) {
    throw new Error(
      'DURACION_PREVISTA_DIAS debe ser un número mayor que 0'
    );
  }

  validarValorCatalogoRepository_(
    datos.ESTADO,
    'CFG_ESTADO_TAREA',
    'ESTADO'
  );

  const porcentajeAvance =
    datos.PORCENTAJE_AVANCE;

  if (
    typeof porcentajeAvance !== 'number' ||
    !Number.isFinite(porcentajeAvance) ||
    porcentajeAvance < 0 ||
    porcentajeAvance > 100
  ) {
    throw new Error(
      'PORCENTAJE_AVANCE debe ser un número entre 0 y 100'
    );
  }

  datos.PROCESO_ID =
    procesoId;

  /*
   * Coherencia de fechas reales y estado (FASE 1.1, anadido de forma
   * autonoma). Reglas cruzadas que el motor generico no cubre:
   * Pendiente/Preparada no admiten FECHA_INICIO_REAL; En proceso exige
   * FECHA_INICIO_REAL; Terminada exige FECHA_INICIO_REAL, FECHA_FIN_REAL
   * (coherentes entre si) y DURACION_REAL_DIAS > 0.
   */
  var estadoTareaCoherencia = datos.ESTADO;
  var tieneFechaInicioReal = datos.FECHA_INICIO_REAL !== undefined && datos.FECHA_INICIO_REAL !== null && String(datos.FECHA_INICIO_REAL).trim() !== '';
  var tieneFechaFinReal = datos.FECHA_FIN_REAL !== undefined && datos.FECHA_FIN_REAL !== null && String(datos.FECHA_FIN_REAL).trim() !== '';
  var tieneDuracionReal = datos.DURACION_REAL_DIAS !== undefined && datos.DURACION_REAL_DIAS !== null && String(datos.DURACION_REAL_DIAS).trim() !== '';

  if ((estadoTareaCoherencia === 'Pendiente' || estadoTareaCoherencia === 'Preparada') && tieneFechaInicioReal) {
    throw new Error('ERROR_INSERCION_TAREA: FECHA_INICIO_REAL no es compatible con ESTADO ' + estadoTareaCoherencia + '.');
  }

  if (estadoTareaCoherencia === 'En proceso' && !tieneFechaInicioReal) {
    throw new Error('ERROR_INSERCION_TAREA: ESTADO En proceso requiere FECHA_INICIO_REAL.');
  }

  if (estadoTareaCoherencia === 'Terminada') {
    if (!tieneFechaInicioReal || !tieneFechaFinReal) {
      throw new Error('ERROR_INSERCION_TAREA: ESTADO Terminada requiere FECHA_INICIO_REAL y FECHA_FIN_REAL.');
    }
    var fechaInicioRealTarea = new Date(datos.FECHA_INICIO_REAL);
    var fechaFinRealTarea = new Date(datos.FECHA_FIN_REAL);
    if (fechaFinRealTarea.getTime() < fechaInicioRealTarea.getTime()) {
      throw new Error('ERROR_INSERCION_TAREA: FECHA_FIN_REAL no puede ser anterior a FECHA_INICIO_REAL.');
    }
    if (!tieneDuracionReal) {
      throw new Error('ERROR_INSERCION_TAREA: ESTADO Terminada requiere DURACION_REAL_DIAS.');
    }
    var duracionRealTarea = Number(datos.DURACION_REAL_DIAS);
    if (!isFinite(duracionRealTarea) || duracionRealTarea <= 0) {
      throw new Error('ERROR_INSERCION_TAREA: DURACION_REAL_DIAS debe ser un numero mayor que 0.');
    }
  }

}

/*
 * Validaciones especificas de tarea_responsable.
 * Anadido de forma autonoma siguiendo el mismo patron que
 * PROYECTO_PRODUCTO (FK existente) y PROCESO/TAREA (catalogo +
 * rango numerico).
 */
if (clave === 'TAREA_RESPONSABLE') {
  const tareaId = String(datos.TAREA_ID || '').trim().toUpperCase();
  const hojaTareasRel = ss.getSheetByName('06_TAREAS');

  if (!hojaTareasRel) {
    throw new Error('No existe la hoja 06_TAREAS');
  }

  const cabecerasTareasRel = hojaTareasRel
    .getRange(1, 1, 1, hojaTareasRel.getLastColumn())
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceIdTareaRel = cabecerasTareasRel.indexOf('ID');

  if (indiceIdTareaRel === -1) {
    throw new Error('La hoja 06_TAREAS no contiene la columna ID');
  }

  const ultimaFilaTareasRel = hojaTareasRel.getLastRow();

  const tareasExistentesRel = ultimaFilaTareasRel < 2
    ? []
    : hojaTareasRel
      .getRange(
        2,
        indiceIdTareaRel + 1,
        ultimaFilaTareasRel - 1,
        1
      )
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return String(valor).trim().toUpperCase();
      })
      .filter(function(valor) {
        return valor !== '';
      });

  if (!tareasExistentesRel.includes(tareaId)) {
    throw new Error(
      'TAREA_ID de relación no existe: ' + tareaId
    );
  }

  const personaEquipoId = String(
    datos.PERSONA_EQUIPO_ID || ''
  )
    .trim()
    .toUpperCase();

  const hojaPersonasRel = ss.getSheetByName(
    '11_PERSONAS_EQUIPOS'
  );

  if (!hojaPersonasRel) {
    throw new Error(
      'No existe la hoja 11_PERSONAS_EQUIPOS'
    );
  }

  const cabecerasPersonasRel = hojaPersonasRel
    .getRange(
      1,
      1,
      1,
      hojaPersonasRel.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(function(valor) {
      return String(valor).trim();
    });

  const indiceIdPersonaRel =
    cabecerasPersonasRel.indexOf('ID');

  if (indiceIdPersonaRel === -1) {
    throw new Error(
      'La hoja 11_PERSONAS_EQUIPOS no contiene la columna ID'
    );
  }

  const ultimaFilaPersonasRel =
    hojaPersonasRel.getLastRow();

  const personasExistentesRel =
    ultimaFilaPersonasRel < 2
      ? []
      : hojaPersonasRel
        .getRange(
          2,
          indiceIdPersonaRel + 1,
          ultimaFilaPersonasRel - 1,
          1
        )
        .getDisplayValues()
        .flat()
        .map(function(valor) {
          return String(valor).trim().toUpperCase();
        })
        .filter(function(valor) {
          return valor !== '';
        });

  if (!personasExistentesRel.includes(personaEquipoId)) {
    throw new Error(
      'PERSONA_EQUIPO_ID de relación no existe: ' +
      personaEquipoId
    );
  }

  validarValorCatalogoRepository_(
    datos.ROL_ASIGNADO,
    'CFG_ROL_ASIGNACION',
    'ROL_ASIGNADO'
  );

  validarValorCatalogoRepository_(
    datos.ESTADO,
    'CFG_ESTADO_ASIGNACION',
    'ESTADO'
  );

  const porcentajeDedicacion =
    datos.PORCENTAJE_DEDICACION;

  if (
    typeof porcentajeDedicacion !== 'number' ||
    !Number.isFinite(porcentajeDedicacion) ||
    porcentajeDedicacion <= 0 ||
    porcentajeDedicacion > 100
  ) {
    throw new Error(
      'PORCENTAJE_DEDICACION debe ser un número entre 1 y 100'
    );
  }

  const tieneFechaInicioAsignacion =
    datos.FECHA_INICIO_ASIGNACION !== undefined &&
    datos.FECHA_INICIO_ASIGNACION !== null &&
    String(datos.FECHA_INICIO_ASIGNACION).trim() !== '';

  const tieneFechaFinAsignacion =
    datos.FECHA_FIN_ASIGNACION !== undefined &&
    datos.FECHA_FIN_ASIGNACION !== null &&
    String(datos.FECHA_FIN_ASIGNACION).trim() !== '';

  if (
    tieneFechaInicioAsignacion &&
    tieneFechaFinAsignacion
  ) {
    const fechaInicioAsignacion =
      new Date(datos.FECHA_INICIO_ASIGNACION);

    const fechaFinAsignacion =
      new Date(datos.FECHA_FIN_ASIGNACION);

    if (
      isNaN(fechaInicioAsignacion.getTime()) ||
      isNaN(fechaFinAsignacion.getTime())
    ) {
      throw new Error(
        'FECHA_INICIO_ASIGNACION y FECHA_FIN_ASIGNACION deben ser fechas válidas'
      );
    }

    if (
      fechaFinAsignacion.getTime() <
      fechaInicioAsignacion.getTime()
    ) {
      throw new Error(
        'FECHA_FIN_ASIGNACION no puede ser anterior a FECHA_INICIO_ASIGNACION'
      );
    }
  }
}

/*
 * Validaciones especificas de material.
 * Anadido de forma autonoma, mismo patron que PRODUCTO
 * (unicidad de CODIGO + catalogo).
 */
if (clave === 'MATERIAL') {
  const codigoMaterial =
    String(datos.CODIGO || '')
      .trim()
      .toUpperCase();

  const proveedorId =
    String(datos.PROVEEDOR_ID || '')
      .trim();

  const hojaMateriales =
    ss.getSheetByName('08_MATERIALES');

  if (!hojaMateriales) {
    throw new Error(
      'No existe la hoja 08_MATERIALES'
    );
  }

  const indiceCodigoMaterial =
    cabeceras.indexOf('CODIGO');

  const indiceIdMaterial =
    cabeceras.indexOf('ID');

  if (indiceCodigoMaterial === -1) {
    throw new Error(
      'La hoja ' +
      entidad.hoja +
      ' no contiene la columna CODIGO'
    );
  }

  if (indiceIdMaterial === -1) {
    throw new Error(
      'La hoja ' +
      entidad.hoja +
      ' no contiene la columna ID'
    );
  }

  const ultimaFilaMateriales =
    hojaMateriales.getLastRow();

  const codigosMaterialesExistentes =
    ultimaFilaMateriales < 2
      ? []
      : hojaMateriales
        .getRange(
          2,
          1,
          ultimaFilaMateriales - 1,
          cabeceras.length
        )
        .getDisplayValues()
        .filter(function (fila) {
          return (
            String(
              fila[indiceIdMaterial] || ''
            ).trim() !==
            String(
              configuracion.idExcluir || ''
            ).trim()
          );
        })
        .map(function (fila) {
          return String(
            fila[indiceCodigoMaterial] || ''
          )
            .trim()
            .toUpperCase();
        })
        .filter(function (valor) {
          return valor !== '';
        });

  if (
    codigoMaterial &&
    codigosMaterialesExistentes
      .includes(codigoMaterial)
  ) {
    throw new Error(
      'CODIGO de material duplicado: ' +
      codigoMaterial
    );
  }

  /*
   * Validar proveedor cuando esté informado.
   */
  if (proveedorId) {
    const proveedor =
      obtenerRegistroPorId(
        'PROVEEDOR',
        proveedorId
      );

    if (
      !proveedor ||
      proveedor.ACTIVO !== 'SÍ' ||
      proveedor.ESTADO !== 'Activo'
    ) {
      throw new Error(
        'El proveedor indicado no existe o no está operativo.'
      );
    }
  }

  validarValorCatalogoRepository_(
    datos.CATEGORIA,
    'CFG_CATEGORIA_MATERIAL',
    'CATEGORIA'
  );

  validarValorCatalogoRepository_(
    datos.UNIDAD,
    'CFG_UNIDAD',
    'UNIDAD'
  );

  validarValorCatalogoRepository_(
    datos.ESTADO,
    'CFG_ESTADO_MATERIAL',
    'ESTADO'
  );
}

/*
 * Validaciones específicas de proveedor.
 * Unicidad de CODIGO y validación de catálogo.
 */
if (clave === 'PROVEEDOR') {
  const codigoProveedor =
    String(datos.CODIGO || '')
      .trim()
      .toUpperCase();

  const nifCifProveedor =
    String(datos.NIF_CIF || '')
      .trim()
      .toUpperCase();

  const emailProveedor =
    String(datos.EMAIL || '')
      .trim();

  const plazoEntregaRaw =
    datos.PLAZO_ENTREGA_DIAS;

  const hojaProveedores =
    ss.getSheetByName('15_PROVEEDORES');

  if (!hojaProveedores) {
    throw new Error(
      'No existe la hoja 15_PROVEEDORES'
    );
  }

  const indiceIdProveedor =
    cabeceras.indexOf('ID');

  const indiceCodigoProveedor =
    cabeceras.indexOf('CODIGO');

  const indiceNifCifProveedor =
    cabeceras.indexOf('NIF_CIF');

  if (indiceIdProveedor === -1) {
    throw new Error(
      'La hoja ' +
      entidad.hoja +
      ' no contiene la columna ID'
    );
  }

  if (indiceCodigoProveedor === -1) {
    throw new Error(
      'La hoja ' +
      entidad.hoja +
      ' no contiene la columna CODIGO'
    );
  }

  if (indiceNifCifProveedor === -1) {
    throw new Error(
      'La hoja ' +
      entidad.hoja +
      ' no contiene la columna NIF_CIF'
    );
  }

  const ultimaFilaProveedores =
    hojaProveedores.getLastRow();

  const filasProveedores =
    ultimaFilaProveedores < 2
      ? []
      : hojaProveedores
        .getRange(
          2,
          1,
          ultimaFilaProveedores - 1,
          cabeceras.length
        )
        .getDisplayValues()
        .filter(function (fila) {
          return (
            String(
              fila[indiceIdProveedor] || ''
            ).trim() !==
            String(
              configuracion.idExcluir || ''
            ).trim()
          );
        });

  /*
   * Unicidad de CODIGO.
   */
  const codigosExistentes =
    filasProveedores
      .map(function (fila) {
        return String(
          fila[indiceCodigoProveedor] || ''
        )
          .trim()
          .toUpperCase();
      })
      .filter(function (valor) {
        return valor !== '';
      });

  if (
    codigoProveedor &&
    codigosExistentes.indexOf(
      codigoProveedor
    ) !== -1
  ) {
    throw new Error(
      'CODIGO de proveedor duplicado: ' +
      codigoProveedor
    );
  }

  /*
   * Unicidad de NIF_CIF cuando esté informado.
   */
  const nifsCifExistentes =
    filasProveedores
      .map(function (fila) {
        return String(
          fila[indiceNifCifProveedor] || ''
        )
          .trim()
          .toUpperCase();
      })
      .filter(function (valor) {
        return valor !== '';
      });

  if (
    nifCifProveedor &&
    nifsCifExistentes.indexOf(
      nifCifProveedor
    ) !== -1
  ) {
    throw new Error(
      'NIF_CIF de proveedor duplicado: ' +
      nifCifProveedor
    );
  }

  /*
   * Validar formato de EMAIL cuando esté informado.
   */
  if (
    emailProveedor &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(emailProveedor)
  ) {
    throw new Error(
      'EMAIL de proveedor no válido: ' +
      emailProveedor
    );
  }

  /*
   * Validar plazo de entrega cuando esté informado.
   */
  if (
    plazoEntregaRaw !== '' &&
    plazoEntregaRaw !== null &&
    plazoEntregaRaw !== undefined
  ) {
    const plazoEntrega =
      Number(plazoEntregaRaw);

    if (
      !Number.isFinite(plazoEntrega) ||
      plazoEntrega < 0 ||
      !Number.isInteger(plazoEntrega)
    ) {
      throw new Error(
        'PLAZO_ENTREGA_DIAS debe ser un número entero igual o mayor que 0.'
      );
    }
  }

  /*
   * Validar ESTADO contra el catálogo.
   */
  validarValorCatalogoRepository_(
    datos.ESTADO,
    'CFG_ESTADO_PROVEEDOR',
    'ESTADO'
  );
}

/*
 * Validaciones especificas de persona_equipo.
 * Anadido de forma autonoma. Sin FK ni unicidad de codigo:
 * solo catalogo para TIPO y ESTADO (ROL es texto libre).
 */
if (clave === 'PERSONA_EQUIPO') {
  validarValorCatalogoRepository_(
    datos.TIPO,
    'CFG_TIPO_RECURSO',
    'TIPO'
  );

  validarValorCatalogoRepository_(
    datos.DISPONIBILIDAD,
    'CFG_DISPONIBILIDAD',
    'DISPONIBILIDAD'
  );

  validarValorCatalogoRepository_(
    datos.ESTADO,
    'CFG_ESTADO_RECURSO',
    'ESTADO'
  );

  var capacidadSemanal =
    Number(datos.CAPACIDAD_SEMANAL_DIAS);

  if (
    !isFinite(capacidadSemanal) ||
    capacidadSemanal <= 0 ||
    capacidadSemanal > 7
  ) {
    throw new Error(
      'ERROR_INSERCION_PERSONA_EQUIPO: ' +
      'CAPACIDAD_SEMANAL_DIAS debe ser un número mayor que 0 y menor o igual que 7: ' +
      datos.CAPACIDAD_SEMANAL_DIAS
    );
  }

  var disponibilidadPersonaEquipo = String(
    datos.DISPONIBILIDAD || ''
  ).trim();

  var estadoPersonaEquipo = String(
    datos.ESTADO || ''
  ).trim();

  if (
    disponibilidadPersonaEquipo === 'No disponible' &&
    estadoPersonaEquipo === 'Disponible'
  ) {
    throw new Error(
      'ERROR_INSERCION_PERSONA_EQUIPO: ' +
      'DISPONIBILIDAD No disponible no es compatible con ESTADO Disponible'
    );
  }

  var tipoPersonaEquipo = String(datos.TIPO || '').trim();
  var coordinadorPersonaEquipoId = String(
    datos.COORDINADOR_ID || ''
  ).trim();

  if (tipoPersonaEquipo === 'Persona' && coordinadorPersonaEquipoId) {
    throw new Error(
      'ERROR_INSERCION_PERSONA_EQUIPO: Una Persona no puede tener COORDINADOR_ID.'
    );
  }

  if (tipoPersonaEquipo === 'Equipo' && coordinadorPersonaEquipoId) {
    var coordinadorPersonaEquipo = obtenerRegistroPorId(
      'PERSONA_EQUIPO',
      coordinadorPersonaEquipoId
    );

    if (!coordinadorPersonaEquipo) {
      throw new Error(
        'ERROR_INSERCION_PERSONA_EQUIPO: El COORDINADOR_ID no existe: ' +
        coordinadorPersonaEquipoId
      );
    }
    if (String(coordinadorPersonaEquipo.ACTIVO || '').trim() !== 'SÍ') {
      throw new Error(
        'ERROR_INSERCION_PERSONA_EQUIPO: El coordinador debe estar ACTIVO=SÍ: ' +
        coordinadorPersonaEquipoId
      );
    }
    if (String(coordinadorPersonaEquipo.ESTADO || '').trim() === 'Inactivo') {
      throw new Error(
        'ERROR_INSERCION_PERSONA_EQUIPO: El coordinador no puede tener ESTADO=Inactivo: ' +
        coordinadorPersonaEquipoId
      );
    }
    if (String(coordinadorPersonaEquipo.TIPO || '').trim() !== 'Persona') {
      throw new Error(
        'ERROR_INSERCION_PERSONA_EQUIPO: El coordinador debe tener TIPO=Persona: ' +
        coordinadorPersonaEquipoId
      );
    }
  }
}


/*
 * Validaciones especificas de producto_material.
 * Anadido de forma autonoma. FK a 03_PRODUCTOS y 08_MATERIALES,
 * catalogo para UNIDAD y ESTADO, y rango numerico para CANTIDAD_PREVISTA.
 */
if (clave === 'PRODUCTO_MATERIAL') {
  var hojaProductoFK =
    ss.getSheetByName('03_PRODUCTOS');

  if (!hojaProductoFK) {
    throw new Error(
      'ERROR_INSERCION_PRODUCTO_MATERIAL: ' +
      'No existe la hoja 03_PRODUCTOS'
    );
  }

  var ultimaFilaProductoFK =
    hojaProductoFK.getLastRow();

  var ultimaColumnaProductoFK =
    hojaProductoFK.getLastColumn();

  var cabecerasProductoFK =
    hojaProductoFK
      .getRange(
        1,
        1,
        1,
        ultimaColumnaProductoFK
      )
      .getDisplayValues()[0];

  var indiceIdProductoFK =
    cabecerasProductoFK.indexOf('ID');

  var indiceActivoProductoFK =
    cabecerasProductoFK.indexOf('ACTIVO');

  if (
    indiceIdProductoFK === -1 ||
    indiceActivoProductoFK === -1
  ) {
    throw new Error(
      'ERROR_INSERCION_PRODUCTO_MATERIAL: ' +
      '03_PRODUCTOS no contiene ID o ACTIVO'
    );
  }

  var filasProductoFK =
    ultimaFilaProductoFK > 1
      ? hojaProductoFK
          .getRange(
            2,
            1,
            ultimaFilaProductoFK - 1,
            ultimaColumnaProductoFK
          )
          .getDisplayValues()
      : [];

  var productoIdBuscado = String(
    datos.PRODUCTO_ID || ''
  ).trim();

  var productoEncontrado = null;

  for (
    var iProductoFK = 0;
    iProductoFK < filasProductoFK.length;
    iProductoFK++
  ) {
    if (
      String(
        filasProductoFK[iProductoFK][
          indiceIdProductoFK
        ] || ''
      ).trim() === productoIdBuscado
    ) {
      productoEncontrado =
        filasProductoFK[iProductoFK];

      break;
    }
  }

  if (!productoEncontrado) {
    throw new Error(
      'ERROR_INSERCION_PRODUCTO_MATERIAL: ' +
      'PRODUCTO_ID no existe: ' +
      datos.PRODUCTO_ID
    );
  }

  var productoActivo = String(
    productoEncontrado[
      indiceActivoProductoFK
    ] || ''
  )
    .trim()
    .toUpperCase();

  if (productoActivo === 'NO') {
    throw new Error(
      'ERROR_INSERCION_PRODUCTO_MATERIAL: ' +
      'PRODUCTO_ID está inactivo: ' +
      datos.PRODUCTO_ID
    );
  }

  var hojaMaterialFK =
    ss.getSheetByName('08_MATERIALES');

  if (!hojaMaterialFK) {
    throw new Error(
      'ERROR_INSERCION_PRODUCTO_MATERIAL: ' +
      'No existe la hoja 08_MATERIALES'
    );
  }

  var ultimaFilaMaterial =
    hojaMaterialFK.getLastRow();

  var ultimaColumnaMaterial =
    hojaMaterialFK.getLastColumn();

  var cabecerasMaterial =
    hojaMaterialFK
      .getRange(
        1,
        1,
        1,
        ultimaColumnaMaterial
      )
      .getDisplayValues()[0];

  var indiceIdMaterial =
    cabecerasMaterial.indexOf('ID');

  var indiceUnidadMaterial =
    cabecerasMaterial.indexOf('UNIDAD');

  var indiceActivoMaterial =
    cabecerasMaterial.indexOf('ACTIVO');

  if (
    indiceIdMaterial === -1 ||
    indiceUnidadMaterial === -1 ||
    indiceActivoMaterial === -1
  ) {
    throw new Error(
      'ERROR_INSERCION_PRODUCTO_MATERIAL: ' +
      '08_MATERIALES no contiene ID, UNIDAD o ACTIVO'
    );
  }

  var filasMaterial =
    ultimaFilaMaterial > 1
      ? hojaMaterialFK
          .getRange(
            2,
            1,
            ultimaFilaMaterial - 1,
            ultimaColumnaMaterial
          )
          .getDisplayValues()
      : [];

  var materialEncontrado = null;

  var materialIdBuscado = String(
    datos.MATERIAL_ID || ''
  ).trim();

  for (
    var iMaterialFK = 0;
    iMaterialFK < filasMaterial.length;
    iMaterialFK++
  ) {
    if (
      String(
        filasMaterial[iMaterialFK][
          indiceIdMaterial
        ] || ''
      ).trim() === materialIdBuscado
    ) {
      materialEncontrado =
        filasMaterial[iMaterialFK];

      break;
    }
  }

  if (!materialEncontrado) {
    throw new Error(
      'ERROR_INSERCION_PRODUCTO_MATERIAL: ' +
      'MATERIAL_ID no existe: ' +
      datos.MATERIAL_ID
    );
  }

  var materialActivo = String(
    materialEncontrado[
      indiceActivoMaterial
    ] || ''
  )
    .trim()
    .toUpperCase();

  if (materialActivo === 'NO') {
    throw new Error(
      'ERROR_INSERCION_PRODUCTO_MATERIAL: ' +
      'MATERIAL_ID está inactivo: ' +
      datos.MATERIAL_ID
    );
  }

  var unidadMaterial = String(
    materialEncontrado[
      indiceUnidadMaterial
    ] || ''
  ).trim();

  var unidadRelacion = String(
    datos.UNIDAD || ''
  ).trim();

  validarValorCatalogoRepository_(
    datos.UNIDAD,
    'CFG_UNIDAD',
    'UNIDAD'
  );

  validarValorCatalogoRepository_(
    datos.ESTADO,
    'CFG_ESTADO_RELACION',
    'ESTADO'
  );

  if (
    unidadRelacion !== unidadMaterial
  ) {
    throw new Error(
      'ERROR_INSERCION_PRODUCTO_MATERIAL: ' +
      'UNIDAD debe coincidir con la unidad del material ' +
      datos.MATERIAL_ID +
      '. Esperada: ' +
      unidadMaterial +
      '. Recibida: ' +
      unidadRelacion
    );
  }

  var cantidadPrevista =
    Number(datos.CANTIDAD_PREVISTA);

  if (
    !isFinite(cantidadPrevista) ||
    cantidadPrevista <= 0
  ) {
    throw new Error(
      'ERROR_INSERCION_PRODUCTO_MATERIAL: ' +
      'CANTIDAD_PREVISTA debe ser un número mayor que 0: ' +
      datos.CANTIDAD_PREVISTA
    );
  }

  var hojaProductoMaterial =
    ss.getSheetByName(
      '09_PRODUCTO_MATERIAL'
    );

  if (!hojaProductoMaterial) {
    throw new Error(
      'ERROR_INSERCION_PRODUCTO_MATERIAL: ' +
      'No existe la hoja 09_PRODUCTO_MATERIAL'
    );
  }

  var ultimaFilaProductoMaterial =
    hojaProductoMaterial.getLastRow();

  var ultimaColumnaProductoMaterial =
    hojaProductoMaterial.getLastColumn();

  var cabecerasProductoMaterial =
    hojaProductoMaterial
      .getRange(
        1,
        1,
        1,
        ultimaColumnaProductoMaterial
      )
      .getDisplayValues()[0];

  var indiceIdRelacion =
    cabecerasProductoMaterial.indexOf(
      'ID'
    );

  var indiceProductoRelacion =
    cabecerasProductoMaterial.indexOf(
      'PRODUCTO_ID'
    );

  var indiceMaterialRelacion =
    cabecerasProductoMaterial.indexOf(
      'MATERIAL_ID'
    );

  var indiceActivoRelacion =
    cabecerasProductoMaterial.indexOf(
      'ACTIVO'
    );

  if (
    indiceIdRelacion === -1 ||
    indiceProductoRelacion === -1 ||
    indiceMaterialRelacion === -1
  ) {
    throw new Error(
      'ERROR_INSERCION_PRODUCTO_MATERIAL: ' +
      '09_PRODUCTO_MATERIAL no contiene ID, PRODUCTO_ID o MATERIAL_ID'
    );
  }

  var filasProductoMaterial =
    ultimaFilaProductoMaterial > 1
      ? hojaProductoMaterial
          .getRange(
            2,
            1,
            ultimaFilaProductoMaterial - 1,
            ultimaColumnaProductoMaterial
          )
          .getDisplayValues()
      : [];

  var idRelacionExcluida = String(
    configuracion &&
    configuracion.idExcluir
      ? configuracion.idExcluir
      : ''
  ).trim();

  var relacionDuplicada =
    filasProductoMaterial.some(
      function(fila) {
        var idRelacionExistente = String(
          fila[indiceIdRelacion] || ''
        ).trim();

        if (
          idRelacionExcluida &&
          idRelacionExistente ===
            idRelacionExcluida
        ) {
          return false;
        }

        var productoExistente = String(
          fila[indiceProductoRelacion] || ''
        ).trim();

        var materialExistente = String(
          fila[indiceMaterialRelacion] || ''
        ).trim();

        var valorActivo =
          indiceActivoRelacion === -1
            ? 'SÍ'
            : String(
                fila[
                  indiceActivoRelacion
                ] || ''
              )
                .trim()
                .toUpperCase();

        var relacionActiva =
          indiceActivoRelacion === -1 ||
          valorActivo !== 'NO';

        return (
          relacionActiva &&
          productoExistente ===
            productoIdBuscado &&
          materialExistente ===
            materialIdBuscado
        );
      }
    );

  if (relacionDuplicada) {
    throw new Error(
      'ERROR_INSERCION_PRODUCTO_MATERIAL: ' +
      'relación activa PRODUCTO_ID/MATERIAL_ID duplicada: ' +
      productoIdBuscado +
      ' / ' +
      materialIdBuscado
    );
  }
}

/*
 * Validaciones especificas de tarea_material.
 * Anadido de forma autonoma. FK a 06_TAREAS y 08_MATERIALES,
 * catalogo para UNIDAD y ESTADO, y rango numerico para CANTIDAD_PREVISTA.
 */
if (clave === 'TAREA_MATERIAL') {
  var hojaTareaFK =
    ss.getSheetByName('06_TAREAS');

  if (!hojaTareaFK) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      'No existe la hoja 06_TAREAS'
    );
  }

  var ultimaFilaTareaFK =
    hojaTareaFK.getLastRow();

  var ultimaColumnaTareaFK =
    hojaTareaFK.getLastColumn();

  var cabecerasTareaFK =
    hojaTareaFK
      .getRange(
        1,
        1,
        1,
        ultimaColumnaTareaFK
      )
      .getDisplayValues()[0];

  var indiceIdTareaFK =
    cabecerasTareaFK.indexOf('ID');

  var indiceActivoTareaFK =
    cabecerasTareaFK.indexOf('ACTIVO');

  if (
    indiceIdTareaFK === -1 ||
    indiceActivoTareaFK === -1
  ) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      '06_TAREAS no contiene ID o ACTIVO'
    );
  }

  var filasTareaFK =
    ultimaFilaTareaFK > 1
      ? hojaTareaFK
          .getRange(
            2,
            1,
            ultimaFilaTareaFK - 1,
            ultimaColumnaTareaFK
          )
          .getDisplayValues()
      : [];

  var tareaIdBuscadaTM = String(
    datos.TAREA_ID || ''
  ).trim();

  var tareaEncontradaTM = null;

  for (
    var iTareaTM = 0;
    iTareaTM < filasTareaFK.length;
    iTareaTM++
  ) {
    if (
      String(
        filasTareaFK[iTareaTM][
          indiceIdTareaFK
        ] || ''
      ).trim() === tareaIdBuscadaTM
    ) {
      tareaEncontradaTM =
        filasTareaFK[iTareaTM];

      break;
    }
  }

  if (!tareaEncontradaTM) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      'TAREA_ID no existe: ' +
      datos.TAREA_ID
    );
  }

  var tareaActivaTM = String(
    tareaEncontradaTM[
      indiceActivoTareaFK
    ] || ''
  )
    .trim()
    .toUpperCase();

  if (tareaActivaTM === 'NO') {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      'TAREA_ID está inactiva: ' +
      datos.TAREA_ID
    );
  }

  var hojaMaterialFK2 =
    ss.getSheetByName('08_MATERIALES');

  if (!hojaMaterialFK2) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      'No existe la hoja 08_MATERIALES'
    );
  }

  var ultimaFilaMaterialTM =
    hojaMaterialFK2.getLastRow();

  var ultimaColumnaMaterialTM =
    hojaMaterialFK2.getLastColumn();

  var cabecerasMaterialTM =
    hojaMaterialFK2
      .getRange(
        1,
        1,
        1,
        ultimaColumnaMaterialTM
      )
      .getDisplayValues()[0];

  var indiceIdMaterialTM =
    cabecerasMaterialTM.indexOf('ID');

  var indiceUnidadMaterialTM =
    cabecerasMaterialTM.indexOf('UNIDAD');

  var indiceActivoMaterialTM =
    cabecerasMaterialTM.indexOf('ACTIVO');

  if (
    indiceIdMaterialTM === -1 ||
    indiceUnidadMaterialTM === -1 ||
    indiceActivoMaterialTM === -1
  ) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      '08_MATERIALES no contiene ID, UNIDAD o ACTIVO'
    );
  }

  var filasMaterialTM =
    ultimaFilaMaterialTM > 1
      ? hojaMaterialFK2
          .getRange(
            2,
            1,
            ultimaFilaMaterialTM - 1,
            ultimaColumnaMaterialTM
          )
          .getDisplayValues()
      : [];

  var materialEncontradoTM = null;

  var materialIdBuscadoTM = String(
    datos.MATERIAL_ID || ''
  ).trim();

  for (
    var iMaterialTM = 0;
    iMaterialTM < filasMaterialTM.length;
    iMaterialTM++
  ) {
    if (
      String(
        filasMaterialTM[iMaterialTM][
          indiceIdMaterialTM
        ] || ''
      ).trim() === materialIdBuscadoTM
    ) {
      materialEncontradoTM =
        filasMaterialTM[iMaterialTM];

      break;
    }
  }

  if (!materialEncontradoTM) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      'MATERIAL_ID no existe: ' +
      datos.MATERIAL_ID
    );
  }

  var materialActivoTM = String(
    materialEncontradoTM[
      indiceActivoMaterialTM
    ] || ''
  )
    .trim()
    .toUpperCase();

  if (materialActivoTM === 'NO') {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      'MATERIAL_ID está inactivo: ' +
      datos.MATERIAL_ID
    );
  }

  var unidadMaterialTM = String(
    materialEncontradoTM[
      indiceUnidadMaterialTM
    ] || ''
  ).trim();

  var unidadRelacionTM = String(
    datos.UNIDAD || ''
  ).trim();

  validarValorCatalogoRepository_(
    datos.UNIDAD,
    'CFG_UNIDAD',
    'UNIDAD'
  );

  validarValorCatalogoRepository_(
    datos.ESTADO,
    'CFG_ESTADO_RELACION',
    'ESTADO'
  );

  if (
    unidadRelacionTM !==
    unidadMaterialTM
  ) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      'UNIDAD debe coincidir con la unidad del material ' +
      datos.MATERIAL_ID +
      '. Esperada: ' +
      unidadMaterialTM +
      '. Recibida: ' +
      unidadRelacionTM
    );
  }

  var cantidadPrevistaTM =
    Number(datos.CANTIDAD_PREVISTA);

  if (
    !isFinite(cantidadPrevistaTM) ||
    cantidadPrevistaTM <= 0
  ) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      'CANTIDAD_PREVISTA debe ser un número mayor que 0: ' +
      datos.CANTIDAD_PREVISTA
    );
  }

  var cantidadConsumidaTM =
    datos.CANTIDAD_CONSUMIDA === '' ||
    datos.CANTIDAD_CONSUMIDA == null
      ? 0
      : Number(
          datos.CANTIDAD_CONSUMIDA
        );

  var cantidadDesperdiciadaTM =
    datos.CANTIDAD_DESPERDICIADA === '' ||
    datos.CANTIDAD_DESPERDICIADA == null
      ? 0
      : Number(
          datos.CANTIDAD_DESPERDICIADA
        );

  if (
    !isFinite(cantidadConsumidaTM) ||
    cantidadConsumidaTM < 0
  ) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      'CANTIDAD_CONSUMIDA no puede ser negativa: ' +
      datos.CANTIDAD_CONSUMIDA
    );
  }

  if (
    !isFinite(cantidadDesperdiciadaTM) ||
    cantidadDesperdiciadaTM < 0
  ) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      'CANTIDAD_DESPERDICIADA no puede ser negativa: ' +
      datos.CANTIDAD_DESPERDICIADA
    );
  }

  if (
    cantidadConsumidaTM +
      cantidadDesperdiciadaTM >
      cantidadPrevistaTM &&
    !String(
      datos.MOTIVO_DESVIACION || ''
    ).trim()
  ) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      'Debe indicar el motivo de desviación cuando el consumo y el desperdicio superan la cantidad prevista.'
    );
  }

  var hojaTareaMaterial =
    ss.getSheetByName(
      '10_TAREA_MATERIAL'
    );

  if (!hojaTareaMaterial) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      'No existe la hoja 10_TAREA_MATERIAL'
    );
  }

  var ultimaFilaTareaMaterial =
    hojaTareaMaterial.getLastRow();

  var ultimaColumnaTareaMaterial =
    hojaTareaMaterial.getLastColumn();

  var cabecerasTareaMaterial =
    hojaTareaMaterial
      .getRange(
        1,
        1,
        1,
        ultimaColumnaTareaMaterial
      )
      .getDisplayValues()[0];

  var indiceIdTareaMaterial =
    cabecerasTareaMaterial.indexOf(
      'ID'
    );

  var indiceTareaRelacionTM =
    cabecerasTareaMaterial.indexOf(
      'TAREA_ID'
    );

  var indiceMaterialRelacionTM =
    cabecerasTareaMaterial.indexOf(
      'MATERIAL_ID'
    );

  var indiceActivoRelacionTM =
    cabecerasTareaMaterial.indexOf(
      'ACTIVO'
    );

  if (
    indiceIdTareaMaterial === -1 ||
    indiceTareaRelacionTM === -1 ||
    indiceMaterialRelacionTM === -1
  ) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      '10_TAREA_MATERIAL no contiene ID, TAREA_ID o MATERIAL_ID'
    );
  }

  var filasTareaMaterial =
    ultimaFilaTareaMaterial > 1
      ? hojaTareaMaterial
          .getRange(
            2,
            1,
            ultimaFilaTareaMaterial - 1,
            ultimaColumnaTareaMaterial
          )
          .getDisplayValues()
      : [];

  var idTareaMaterialExcluido =
    String(
      configuracion &&
      configuracion.idExcluir
        ? configuracion.idExcluir
        : ''
    ).trim();

  var relacionTareaMaterialDuplicada =
    filasTareaMaterial.some(
      function(fila) {
        var idRelacionExistente = String(
          fila[
            indiceIdTareaMaterial
          ] || ''
        ).trim();

        if (
          idTareaMaterialExcluido &&
          idRelacionExistente ===
            idTareaMaterialExcluido
        ) {
          return false;
        }

        var tareaExistente = String(
          fila[
            indiceTareaRelacionTM
          ] || ''
        ).trim();

        var materialExistente = String(
          fila[
            indiceMaterialRelacionTM
          ] || ''
        ).trim();

        var valorActivo =
          indiceActivoRelacionTM === -1
            ? 'SÍ'
            : String(
                fila[
                  indiceActivoRelacionTM
                ] || ''
              )
                .trim()
                .toUpperCase();

        var relacionActiva =
          indiceActivoRelacionTM === -1 ||
          valorActivo !== 'NO';

        return (
          relacionActiva &&
          tareaExistente ===
            tareaIdBuscadaTM &&
          materialExistente ===
            materialIdBuscadoTM
        );
      }
    );

  if (
    relacionTareaMaterialDuplicada
  ) {
    throw new Error(
      'ERROR_INSERCION_TAREA_MATERIAL: ' +
      'relación activa TAREA_ID/MATERIAL_ID duplicada: ' +
      tareaIdBuscadaTM +
      ' / ' +
      materialIdBuscadoTM
    );
  }
}

/*
 * Validaciones específicas de decisión.
 * FK a 02_PROYECTOS, responsable opcional,
 * catálogos y coherencia temporal y de cierre.
 */
if (clave === 'DECISION') {
  var proyectoDecisionId =
    String(datos.PROYECTO_ID || '').trim();

  if (!proyectoDecisionId) {
    throw new Error(
      'ERROR_INSERCION_DECISION: ' +
      'PROYECTO_ID es obligatorio.'
    );
  }

  var proyectoDecision =
    obtenerRegistroPorId(
      'PROYECTO',
      proyectoDecisionId
    );

  if (
    !proyectoDecision ||
    proyectoDecision.ACTIVO !== 'SÍ'
  ) {
    throw new Error(
      'ERROR_INSERCION_DECISION: ' +
      'PROYECTO_ID no existe o no está activo: ' +
      proyectoDecisionId
    );
  }

  validarValorCatalogoRepository_(
    datos.TIPO,
    'CFG_TIPO_DECISION',
    'TIPO'
  );

  validarValorCatalogoRepository_(
    datos.ESTADO,
    'CFG_ESTADO_DECISION',
    'ESTADO'
  );

  if (
    datos.IMPACTO !== '' &&
    datos.IMPACTO != null
  ) {
    validarValorCatalogoRepository_(
      datos.IMPACTO,
      'CFG_IMPACTO',
      'IMPACTO'
    );
  }

  if (datos.RESPONSABLE_ID) {
    var responsableDecision =
      obtenerRegistroPorId(
        'PERSONA_EQUIPO',
        datos.RESPONSABLE_ID
      );

    if (
      !responsableDecision ||
      responsableDecision.ACTIVO !== 'SÍ' ||
      responsableDecision.ESTADO === 'Inactivo'
    ) {
      throw new Error(
        'ERROR_INSERCION_DECISION: ' +
        'RESPONSABLE_ID no existe o no está activo: ' +
        datos.RESPONSABLE_ID
      );
    }
  }

  var fechaCreacionDecision;

  if (configuracion.idExcluir) {
    var decisionExistenteRepository =
      obtenerRegistroPorId(
        'DECISION',
        configuracion.idExcluir
      );

    if (!decisionExistenteRepository) {
      throw new Error(
        'ERROR_INSERCION_DECISION: ' +
        'No existe la decisión indicada: ' +
        configuracion.idExcluir
      );
    }

    fechaCreacionDecision = new Date(
      decisionExistenteRepository.FECHA_CREACION
    );

  } else {
    fechaCreacionDecision = new Date();
  }

  if (isNaN(fechaCreacionDecision.getTime())) {
    throw new Error(
      'ERROR_INSERCION_DECISION: ' +
      'No se pudo determinar la fecha de creación de la decisión.'
    );
  }

  fechaCreacionDecision.setHours(0, 0, 0, 0);

  if (datos.FECHA_LIMITE) {
    var fechaLimiteDecision =
      new Date(datos.FECHA_LIMITE);

    if (isNaN(fechaLimiteDecision.getTime())) {
      throw new Error(
        'ERROR_INSERCION_DECISION: ' +
        'La fecha límite no es válida.'
      );
    }

    fechaLimiteDecision.setHours(0, 0, 0, 0);

    if (
      fechaLimiteDecision.getTime() <
      fechaCreacionDecision.getTime()
    ) {
      throw new Error(
        'ERROR_INSERCION_DECISION: ' +
        'La fecha límite no puede ser anterior a la fecha de creación.'
      );
    }
  }

  var estadosDecisionCierreRepository = [
    'Aprobada',
    'Rechazada',
    'Sustituida'
  ];

  var esDecisionCerrada =
    estadosDecisionCierreRepository.indexOf(
      String(datos.ESTADO || '').trim()
    ) !== -1;

  datos.RESOLUCION =
    String(datos.RESOLUCION || '').trim();

  if (esDecisionCerrada) {
    if (!datos.RESOLUCION) {
      throw new Error(
        'ERROR_INSERCION_DECISION: ' +
        'Debe indicar la resolución al cerrar la decisión.'
      );
    }

    if (!datos.FECHA_RESOLUCION) {
      throw new Error(
        'ERROR_INSERCION_DECISION: ' +
        'Debe indicar la fecha de resolución al cerrar la decisión.'
      );
    }

    var fechaResolucionDecision =
      new Date(datos.FECHA_RESOLUCION);

    if (
      isNaN(
        fechaResolucionDecision.getTime()
      )
    ) {
      throw new Error(
        'ERROR_INSERCION_DECISION: ' +
        'La fecha de resolución no es válida.'
      );
    }

    fechaResolucionDecision.setHours(
      0,
      0,
      0,
      0
    );

    if (
      fechaResolucionDecision.getTime() <
      fechaCreacionDecision.getTime()
    ) {
      throw new Error(
        'ERROR_INSERCION_DECISION: ' +
        'La fecha de resolución no puede ser anterior a la fecha de creación.'
      );
    }
  }

  if (
    !esDecisionCerrada &&
    (
      datos.RESOLUCION ||
      datos.FECHA_RESOLUCION
    )
  ) {
    throw new Error(
      'ERROR_INSERCION_DECISION: ' +
      'Una decisión abierta no puede contener resolución ni fecha de resolución.'
    );
  }
}

/*
 * Validaciones especificas de incidencia.
 * Anadido de forma autonoma. Sin FK obligatoria (CAMPANA_ID, PROYECTO_ID,
 * PRODUCTO_ID, PROCESO_ID, TAREA_ID son opcionales/polimorficos):
 * solo catalogo para TIPO, PRIORIDAD y ESTADO.
 */
if (clave === 'INCIDENCIA') {
  validarValorCatalogoRepository_(datos.TIPO, 'CFG_TIPO_INCIDENCIA', 'TIPO');
  validarValorCatalogoRepository_(datos.PRIORIDAD, 'CFG_PRIORIDAD', 'PRIORIDAD');
  validarValorCatalogoRepository_(datos.ESTADO, 'CFG_ESTADO_INCIDENCIA', 'ESTADO');
}

/*
 * Validaciones especificas de documento.
 * Anadido de forma autonoma. ENTIDAD_ID es polimorfico (referencia a
 * distintas hojas segun ENTIDAD_TIPO) por lo que no se valida como FK
 * directa: solo catalogo para ENTIDAD_TIPO, TIPO_DOCUMENTO y ESTADO.
 */
if (clave === 'DOCUMENTO') {
  validarValorCatalogoRepository_(datos.ENTIDAD_TIPO, 'CFG_ENTIDAD_DOCUMENTO', 'ENTIDAD_TIPO');
  validarValorCatalogoRepository_(datos.TIPO_DOCUMENTO, 'CFG_TIPO_DOCUMENTO', 'TIPO_DOCUMENTO');
  validarValorCatalogoRepository_(datos.ESTADO, 'CFG_ESTADO_DOCUMENTO', 'ESTADO');
}

    const id = obtenerSiguienteId(
      entidad.hoja,
      entidad.prefijo
    );

    const ahora = new Date();

    const usuario =
      Session.getEffectiveUser().getEmail() ||
      'USUARIO_NO_IDENTIFICADO';

    const datosSistema = {
      ID: id,
      FECHA_CREACION: ahora,
      CREADO_POR: usuario,
      FECHA_MODIFICACION: ahora,
      MODIFICADO_POR: usuario,
      ACTIVO: 'SÍ'
    };

    const registro = Object.assign(
      {},
      datos,
      datosSistema
    );

    const fila = cabeceras.map(
      function(cabecera) {
        return Object.prototype
          .hasOwnProperty.call(
            registro,
            cabecera
          )
          ? registro[cabecera]
          : '';
      }
    );

    if (configuracion.dryRun) {
      return {
        ok: true,
        dryRun: true,
        entidad: clave,
        hoja: entidad.hoja,
        id: id,
        filaDestino:
          hoja.getLastRow() + 1,
        columnas:
          cabeceras.length,
        valores: fila
      };
    }

    hoja.appendRow(fila);
    SpreadsheetApp.flush();
    var diferenciasCreacion_ = Object.keys(datos).map(function (campo) {
      return {campo: campo, anterior: null, nuevo: datos[campo]};
    });
    registrarHistorial(
      clave,
      id,
      'CREAR',
      diferenciasCreacion_,
      {
        origen: configuracion.origen || 'SCRIPT',
        correlationId: configuracion.correlationId,
        esPrueba: configuracion.esPrueba,
        pruebaId: configuracion.pruebaId,
        resultado: 'OK'
      }
    );


    return {
      ok: true,
      dryRun: false,
      entidad: clave,
      hoja: entidad.hoja,
      id: id,
      fila: hoja.getLastRow()
    };

  } catch (error) {
    throw new Error(
      'ERROR_INSERCION_' +
      clave +
      ': ' +
      error.message
    );

  } finally {
    if (bloqueo.hasLock()) {
      bloqueo.releaseLock();
    }
  }
}
