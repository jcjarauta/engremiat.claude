/**
 * FormularioValidacionService.js -- capa DOMINIO de formularios: reglas de
 * negocio por entidad, esquema y el guardado generico (guardarFormulario).
 * Extraido de Formularios.js para cerrar su deuda de mezcla de capas (ver
 * PROPUESTA_MODULARIZACION_LIBRERIA.md). No abre dialogos ni construye el
 * menu: eso vive en FormularioMotorUI.js.
 */
/*
 * Vinculos relacionados de CUALQUIER entidad (ver conversacion --
 * "relación incidencia-decisión-tarea, cómo lo mejoramos"): en vez de
 * inventar un campo nuevo para cada par de entidades (Decision no
 * tiene INCIDENCIA_ID, ni falta que hace), se reutiliza VINCULO
 * (generico, ya usado igual en Ficha de Recurso para sus incidencias)
 * en cualquier direccion. Generico a proposito -- funciona para
 * cualquiera de las 10 entidades de CFG_ENTIDAD_DOCUMENTO, no solo
 * Incidencia/Decision, sin codigo especifico por par.
 */
function obtenerVinculosDeEntidad(entidad, id) {
  var etiqueta = MVP_A_ENTIDAD_DOCUMENTO_[entidad];
  if (!etiqueta || !id) return [];

  return listarRegistros('VINCULO', { ACTIVO: 'SÍ' })
    .filter(function (v) {
      return (v.ENTIDAD_ORIGEN_TIPO === etiqueta && v.ENTIDAD_ORIGEN_ID === id) ||
             (v.ENTIDAD_DESTINO_TIPO === etiqueta && v.ENTIDAD_DESTINO_ID === id);
    })
    .map(function (v) {
      var esOrigen = v.ENTIDAD_ORIGEN_TIPO === etiqueta && v.ENTIDAD_ORIGEN_ID === id;
      var otraEtiqueta = esOrigen ? v.ENTIDAD_DESTINO_TIPO : v.ENTIDAD_ORIGEN_TIPO;
      var otroId = esOrigen ? v.ENTIDAD_DESTINO_ID : v.ENTIDAD_ORIGEN_ID;
      var otraEntidad = ENTIDAD_DOCUMENTO_A_MVP[otraEtiqueta];
      var registro = otraEntidad ? obtenerRegistroPorId(otraEntidad, otroId) : null;
      return {
        vinculoId: v.ID,
        tipoVinculo: v.TIPO_VINCULO || '',
        entidad: otraEntidad,
        entidadEtiqueta: otraEtiqueta,
        id: otroId,
        nombre: registro ? (registro.TITULO || registro.NOMBRE || otroId) : otroId,
        estado: registro ? (registro.ESTADO || '') : ''
      };
    });
}
function obtenerOpcionesDependientes(mapaEntidad, valorPadre) {
  var mapa = MAPAS_DEPENDENCIA_MVP[mapaEntidad];
  if (!mapa) throw new Error('No existe el mapa de dependencia ' + mapaEntidad);
  return mapa.resolver(valorPadre);
}
/*
 * Hallazgo #16 (auditoría piloto): PRODUCTO_ID y PROYECTO_PRODUCTO_ID
 * eran campos independientes en PROCESO, sin ninguna relación entre
 * ambos -- se podía elegir una combinación inconsistente. Al elegir la
 * Relación proyecto-producto, se deriva su Producto automáticamente
 * (solo si el campo Producto aún está vacío, nunca pisa una elección
 * manual ya hecha).
 */
function obtenerProductoDesdeProyectoProducto(proyectoProductoId) {
  var relacion = obtenerRegistroPorId('PROYECTO_PRODUCTO', proyectoProductoId);

  if (!relacion) return null;

  var producto = obtenerRegistroPorId('PRODUCTO', relacion.PRODUCTO_ID);

  return {
    id: relacion.PRODUCTO_ID,
    etiqueta: relacion.PRODUCTO_ID + ' - ' + (producto ? producto.NOMBRE : '')
  };
}
function obtenerEsquemaFormulario(entidad, idRegistro) {
  var clave = String(entidad || '').trim().toUpperCase();
  var esquema = ESQUEMAS_FORMULARIO_MVP[clave];

  if (!Array.isArray(esquema)) {
    throw new Error(
      'No hay esquema de formulario para la entidad ' +
      entidad
    );
  }

  var zonaHoraria =
    SpreadsheetApp
      .getActive()
      .getSpreadsheetTimeZone();

  var campos = esquema.map(function (campo) {
    var copia = Object.assign({}, campo);

    /*
     * Catálogos:
     * - admite opciones declaradas directamente;
     * - si no existen, carga el catálogo configurado.
     */
    if (copia.tipo === 'catalogo') {
      if (Array.isArray(copia.opciones)) {
        copia.opciones = copia.opciones.slice();
      } else {
        /*
         * Igual que el fk mas abajo (ver conversacion -- ERROR_CATALOGO:
         * no existe el rango con nombre CFG_IMPACTO): un campo catalogo
         * puede apuntar a una categoria que, por un mapeo de modulo
         * equivocado, no se sembro en este cliente. El caso concreto ya
         * esta corregido en MODULO_POR_CATEGORIA_CATALOGO, pero sin este
         * try/catch cualquier descuadre similar futuro rompia el
         * formulario ENTERO en vez de solo dejar ese campo sin opciones.
         */
        var catalogo;
        try {
          catalogo = obtenerCatalogo(copia.catalogo);
        } catch (errorCatalogo) {
          catalogo = [];
        }

        copia.opciones =
          Array.isArray(catalogo)
            ? catalogo
            : [];
      }
    }

    /*
     * Claves foráneas:
     * - solo registros activos;
     * - permite excluir estados concretos.
     */
    if (copia.tipo === 'fk') {
      /*
       * Un campo fk puede apuntar a una entidad de un módulo que este
       * cliente no tiene instalado (p.ej. PROYECTO.CLIENTE_ID -> CLIENTE,
       * módulo CLIENTE) -- su hoja simplemente no existe en este Sheet.
       * Antes eso reventaba obtenerEsquemaFormulario entero con
       * ERROR_CONSULTA (hallazgo en vivo: "Nuevo proyecto" no se podía ni
       * abrir en un cliente solo-CORE). Sin esa hoja no hay registros que
       * ofrecer, así que el campo simplemente se queda sin opciones en vez
       * de romper todo el formulario.
       */
      var registros;
      try {
        registros = listarRegistros(
          copia.entidadFk,
          { ACTIVO: 'SÍ' }
        );
      } catch (errorFk) {
        registros = [];
      }

      registros =
        Array.isArray(registros)
          ? registros
          : [];

      if (
        Array.isArray(copia.excluirEstados) &&
        copia.excluirEstados.length > 0
      ) {
        registros = registros.filter(
          function (registro) {
            var estadoRegistro =
              String(
                registro.ESTADO || ''
              ).trim();

            return (
              copia.excluirEstados.indexOf(
                estadoRegistro
              ) === -1
            );
          }
        );
      }

      /*
       * Filtro por valor de un campo arbitrario (no solo ESTADO). Ej.
       * RECURSO.UBICACION_ID solo debe ofrecer recursos con
       * CLASE_RECURSO=Espacio, no cualquier recurso -- evita confundir
       * una ubicacion con una herramienta o maquina.
       */
      if (
        copia.filtroValores &&
        Array.isArray(copia.filtroValores.valores) &&
        copia.filtroValores.valores.length > 0
      ) {
        registros = registros.filter(
          function (registro) {
            var valorCampo =
              String(
                registro[copia.filtroValores.campo] || ''
              ).trim();

            return (
              copia.filtroValores.valores.indexOf(
                valorCampo
              ) !== -1
            );
          }
        );
      }

      /*
       * Bug real detectado en la auditoria piloto: PROYECTO_PRODUCTO no
       * tiene NOMBRE/TITULO propio, asi que el buscador (ej. PROCESO.
       * PROYECTO_PRODUCTO_ID) mostraba etiquetas vacias ("PPR-0001 - ").
       * Se construye una etiqueta compuesta a partir del proyecto y el
       * producto de cada relacion. Prefetch unico (no por fila) para no
       * repetir listarRegistros dentro del map.
       */
      var nombresProyectoPorId_ = null;
      var nombresProductoPorId_ = null;

      if (copia.entidadFk === 'PROYECTO_PRODUCTO') {
        nombresProyectoPorId_ = {};
        listarRegistros('PROYECTO', { ACTIVO: 'SÍ' }).forEach(function (p) {
          nombresProyectoPorId_[p.ID] = p.NOMBRE;
        });

        nombresProductoPorId_ = {};
        listarRegistros('PRODUCTO', { ACTIVO: 'SÍ' }).forEach(function (p) {
          nombresProductoPorId_[p.ID] = p.NOMBRE;
        });
      }

      copia.opciones = registros.map(
        function (registro) {
          var etiqueta;

          if (copia.entidadFk === 'PROYECTO_PRODUCTO') {
            etiqueta =
              registro.ID + ' - ' +
              (nombresProyectoPorId_[registro.PROYECTO_ID] || registro.PROYECTO_ID) +
              ' / ' +
              (nombresProductoPorId_[registro.PRODUCTO_ID] || registro.PRODUCTO_ID);
          } else {
            etiqueta =
              registro.ID +
              ' - ' +
              (
                registro.NOMBRE ||
                registro.TITULO ||
                ''
              );
          }

          /*
           * F-046: el selector de PERSONA_EQUIPO no distinguía persona de
           * equipo. Se añade el TIPO a la etiqueta (mismo texto "ID -
           * nombre" que usa extraerIdDeEtiqueta_, solo se le añade un
           * sufijo informativo que no afecta a la extracción del ID).
           */
          if (copia.entidadFk === 'PERSONA_EQUIPO' && registro.TIPO) {
            etiqueta += ' (' + registro.TIPO + ')';
          }

          return {
            id: registro.ID,
            etiqueta: etiqueta
          };
        }
      );
    }

    if (copia.tipo === 'fk_dependiente') {
      copia.opciones = [];
    }

    return copia;
  });

  if (idRegistro) {
    var registro =
      obtenerRegistroPorId(
        clave,
        idRegistro
      );

    if (!registro) {
      throw new Error(
        'No se encontró el registro ' +
        idRegistro +
        ' de la entidad ' +
        clave
      );
    }

    campos.forEach(function (campo) {
      var valor =
        registro[campo.campo];

      if (
        valor === undefined ||
        valor === null
      ) {
        return;
      }

      if (
        Object.prototype.toString.call(
          valor
        ) === '[object Date]'
      ) {
        campo.valorActual =
          Utilities.formatDate(
            valor,
            zonaHoraria,
            'yyyy-MM-dd'
          );
      } else {
        campo.valorActual = valor;
      }
    });
  }

  return campos;
}
function validarDuplicidadFormulario_(clave, datos, idExcluir) {
  /*
   * Imagen/Vídeo (ver conversación -- "necesitamos poder incluir los
   * tres tipos, que no sean excluyentes"): DOCUMENTO es una galería de
   * adjuntos, no una relación 1:1 -- la clave de duplicado
   * (entidad+tipo+version) tiene sentido para un documento controlado
   * (Manual/Protocolo, una versión vigente a la vez) pero bloqueaba por
   * error una segunda foto o vídeo del mismo tipo en el mismo registro,
   * ya que VERSION normalmente se deja en blanco en fotos/vídeos.
   */
  if (clave === 'DOCUMENTO' && (datos.TIPO_DOCUMENTO === 'Imagen' || datos.TIPO_DOCUMENTO === 'Vídeo')) return;
  var camposClave = CLAVES_DUPLICADO_MVP[clave];
  if (!camposClave) return;
  var registros = listarRegistros(clave, { ACTIVO: 'SÍ' });
  if (clave === 'EQUIPO_MIEMBRO') {
    registros = registros.filter(function (registro) {
      return String(registro.ESTADO || '').trim() === 'Activa';
    });
  }
  var duplicado = registros.some(function (r) {
    if (idExcluir && r.ID === idExcluir) return false;
    return camposClave.every(function (c) { return String(r[c]) === String(datos[c]); });
  });
  if (duplicado) {
    throw new Error('Ya existe un registro con la misma combinación de ' + camposClave.join(', ') + '.');
  }
}
function traducirErrorFuncional_(mensaje, clave) {
  var texto = String(mensaje || '');
  if (texto.indexOf('ERROR_VALIDACION') !== -1 || texto.indexOf('obligator') !== -1) {
    return 'Faltan campos obligatorios para guardar el registro.';
  }
  return 'No se pudo guardar el registro: ' + texto.replace(/^ERROR_[A-Z_]+:\s*/, '');
}
function validarReglasNegocioFormulario_(clave, datos, idExcluir) {
  if (clave === 'PERSONA_EQUIPO') return validarReglasNegocioPersonaEquipo_(datos);
  if (clave === 'EQUIPO_MIEMBRO') return validarReglasNegocioEquipoMiembro_(datos, idExcluir);
  if (clave === 'TAREA') return validarReglasNegocioTarea_(datos);
  if (clave === 'TAREA_RESPONSABLE') return validarReglasNegocioTareaResponsable_(datos, idExcluir);
  if (clave === 'MATERIAL') return validarReglasNegocioMaterial_(datos);
  if (clave === 'TAREA_MATERIAL') return validarReglasNegocioTareaMaterial_(datos);
  if (clave === 'DECISION') return validarReglasNegocioDecision_(datos, idExcluir);
  if (clave === 'INCIDENCIA') return validarReglasNegocioIncidencia_(datos);
  if (clave === 'DOCUMENTO') return validarReglasNegocioDocumento_(datos, idExcluir);
  if (clave === 'HORARIO') return validarReglasNegocioHorario_(datos);
}
/*
 * Sin tipo de campo "hora" en el motor de formularios -- HORA_INICIO/
 * HORA_FIN se guardan como texto "HH:MM" y se validan aqui: formato
 * correcto y fin posterior a inicio (comparacion de string funciona
 * porque el formato va siempre con cero a la izquierda).
 */
function validarReglasNegocioHorario_(datos) {
  var formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;
  var horaInicio = String(datos.HORA_INICIO || '').trim();
  var horaFin = String(datos.HORA_FIN || '').trim();

  if (!formatoHora.test(horaInicio)) {
    throw new Error('ERROR_HORARIO_FORMATO: la hora de inicio debe tener el formato HH:MM (ej. 09:00).');
  }
  if (!formatoHora.test(horaFin)) {
    throw new Error('ERROR_HORARIO_FORMATO: la hora de fin debe tener el formato HH:MM (ej. 17:30).');
  }
  if (horaFin <= horaInicio) {
    throw new Error('ERROR_HORARIO_RANGO: la hora de fin debe ser posterior a la hora de inicio.');
  }

  if (datos.FECHA_INICIO_VIGENCIA && datos.FECHA_FIN_VIGENCIA) {
    var inicioVigencia = new Date(datos.FECHA_INICIO_VIGENCIA);
    var finVigencia = new Date(datos.FECHA_FIN_VIGENCIA);
    if (finVigencia.getTime() < inicioVigencia.getTime()) {
      throw new Error('ERROR_HORARIO_VIGENCIA: la fecha de fin de vigencia no puede ser anterior a la de inicio.');
    }
  }
}
function validarReglasNegocioEquipoMiembro_(datos, idExcluir) {
  return validarEquipoMiembro_(datos, idExcluir);
}
function validarReglasNegocioPersonaEquipo_(datos) {
  var tipo = String(datos.TIPO || '').trim();
  var coordinadorId = String(datos.COORDINADOR_ID || '').trim();

  if (tipo === 'Persona' && coordinadorId) {
    throw new Error(
      'ERROR_COORDINADOR_PERSONA: Una Persona no puede tener coordinador.'
    );
  }

  if (tipo !== 'Equipo' || !coordinadorId) return;

  var coordinador = obtenerRegistroPorId('PERSONA_EQUIPO', coordinadorId);
  if (!coordinador) {
    throw new Error(
      'ERROR_COORDINADOR_INEXISTENTE: El coordinador seleccionado no existe.'
    );
  }
  if (String(coordinador.ACTIVO || '').trim() !== 'SÍ') {
    throw new Error(
      'ERROR_COORDINADOR_INACTIVO: El coordinador seleccionado no está activo.'
    );
  }
  if (String(coordinador.ESTADO || '').trim() === 'Inactivo') {
    throw new Error(
      'ERROR_COORDINADOR_INACTIVO: El coordinador seleccionado tiene estado Inactivo.'
    );
  }
  if (String(coordinador.TIPO || '').trim() !== 'Persona') {
    throw new Error(
      'ERROR_COORDINADOR_TIPO: El coordinador seleccionado debe ser una Persona.'
    );
  }
}
function validarReglasNegocioDecision_(datos, idExcluir) {
  var estadosCierre =
    ESTADOS_DECISION_CIERRE_;

  var esEstadoCerrado =
    estadosCierre.indexOf(
      String(datos.ESTADO || '').trim()
    ) !== -1;

  var decisionExistente = null;
  var fechaCreacion = null;

  if (idExcluir) {
    decisionExistente =
      obtenerRegistroPorId('DECISION', idExcluir);

    if (!decisionExistente) {
      throw new Error(
        'No existe la decisión indicada: ' +
        idExcluir
      );
    }

    fechaCreacion = new Date(
      decisionExistente.FECHA_CREACION
    );
  } else {
    fechaCreacion = new Date();
  }

  if (isNaN(fechaCreacion.getTime())) {
    throw new Error(
      'No se pudo determinar la fecha de creación de la decisión.'
    );
  }

  fechaCreacion.setHours(0, 0, 0, 0);

  datos.RESOLUCION =
    String(datos.RESOLUCION || '').trim();

  /*
   * Estados cerrados:
   * requieren resolución y fecha de resolución.
   */
  if (esEstadoCerrado) {
    if (!datos.RESOLUCION) {
      throw new Error(
        'Debe indicar la resolución al cerrar la decisión.'
      );
    }

    if (!datos.FECHA_RESOLUCION) {
      throw new Error(
        'Debe indicar la fecha de resolución al cerrar la decisión.'
      );
    }

    var fechaResolucion =
      new Date(datos.FECHA_RESOLUCION);

    if (isNaN(fechaResolucion.getTime())) {
      throw new Error(
        'La fecha de resolución no es válida.'
      );
    }

    fechaResolucion.setHours(0, 0, 0, 0);

    if (
      fechaResolucion.getTime() <
      fechaCreacion.getTime()
    ) {
      throw new Error(
        'La fecha de resolución no puede ser anterior a la fecha de creación.'
      );
    }
  } else {
    /*
     * Estados abiertos:
     * la UI oculta los campos de cierre, por lo que se limpian
     * automáticamente antes de guardar.
     */
    datos.RESOLUCION = '';
    datos.FECHA_RESOLUCION = '';
  }

  if (datos.RESPONSABLE_ID) {
    var responsable = obtenerRegistroPorId(
      'PERSONA_EQUIPO',
      datos.RESPONSABLE_ID
    );

    if (
      !responsable ||
      responsable.ACTIVO !== 'SÍ' ||
      responsable.ESTADO === 'Inactivo'
    ) {
      throw new Error(
        'El responsable indicado no existe o no está activo.'
      );
    }
  }

  if (datos.PROYECTO_ID) {
    var proyecto = obtenerRegistroPorId(
      'PROYECTO',
      datos.PROYECTO_ID
    );

    if (
      !proyecto ||
      proyecto.ACTIVO !== 'SÍ'
    ) {
      throw new Error(
        'El proyecto indicado no existe o no está activo.'
      );
    }
  }

  if (datos.FECHA_LIMITE) {
    var fechaLimite =
      new Date(datos.FECHA_LIMITE);

    if (isNaN(fechaLimite.getTime())) {
      throw new Error(
        'La fecha límite no es válida.'
      );
    }

    fechaLimite.setHours(0, 0, 0, 0);

    if (
      fechaLimite.getTime() <
      fechaCreacion.getTime()
    ) {
      throw new Error(
        'La fecha límite no puede ser anterior a la fecha de creación.'
      );
    }
  }
}
function validarReglasNegocioIncidencia_(datos) {
  var nivel =
    String(datos.NIVEL_INCIDENCIA || '').trim();

  var estado =
    String(datos.ESTADO || '').trim();

  var prioridad =
    String(datos.PRIORIDAD || '').trim();

  var tipo =
    String(datos.TIPO || '').trim();

  var nivelesValidos = [
    'General',
    'Campaña',
    'Proyecto',
    'Producto',
    'Proceso',
    'Tarea'
  ];

  var jerarquia = [
    'CAMPANA_ID',
    'PROYECTO_ID',
    'PRODUCTO_ID',
    'PROCESO_ID',
    'TAREA_ID'
  ];

  var camposObligatoriosPorNivel = {
    'General': [],
    'Campaña': [
      'CAMPANA_ID'
    ],
    'Proyecto': [
      'CAMPANA_ID',
      'PROYECTO_ID'
    ],
    'Producto': [
      'CAMPANA_ID',
      'PROYECTO_ID',
      'PRODUCTO_ID'
    ],
    'Proceso': [
      'CAMPANA_ID',
      'PROYECTO_ID',
      'PRODUCTO_ID',
      'PROCESO_ID'
    ],
    'Tarea': [
      'CAMPANA_ID',
      'PROYECTO_ID',
      'PRODUCTO_ID',
      'PROCESO_ID',
      'TAREA_ID'
    ]
  };

  var camposPermitidosPorNivel = {
    'General': [],
    'Campaña': [
      'CAMPANA_ID'
    ],
    'Proyecto': [
      'CAMPANA_ID',
      'PROYECTO_ID'
    ],
    'Producto': [
      'CAMPANA_ID',
      'PROYECTO_ID',
      'PRODUCTO_ID'
    ],
    'Proceso': [
      'CAMPANA_ID',
      'PROYECTO_ID',
      'PRODUCTO_ID',
      'PROCESO_ID'
    ],
    'Tarea': [
      'CAMPANA_ID',
      'PROYECTO_ID',
      'PRODUCTO_ID',
      'PROCESO_ID',
      'TAREA_ID'
    ]
  };

  /*
   * NIVEL_INCIDENCIA obligatorio y válido.
   */
  if (!nivel) {
    throw new Error(
      'Debe indicar NIVEL_INCIDENCIA.'
    );
  }

  if (nivelesValidos.indexOf(nivel) === -1) {
    throw new Error(
      'NIVEL_INCIDENCIA no válido: ' +
      nivel
    );
  }

  /*
   * Exigir las FK correspondientes al nivel.
   */
  var camposObligatorios =
    camposObligatoriosPorNivel[nivel];

  camposObligatorios.forEach(function (campo) {
    if (!String(datos[campo] || '').trim()) {
      throw new Error(
        campo +
        ' es obligatorio para una incidencia de nivel ' +
        nivel +
        '.'
      );
    }
  });

  /*
   * Impedir relaciones inferiores al nivel declarado.
   */
  var camposPermitidos =
    camposPermitidosPorNivel[nivel];

  jerarquia.forEach(function (campo) {
    var informado =
      String(datos[campo] || '').trim() !== '';

    if (
      informado &&
      camposPermitidos.indexOf(campo) === -1
    ) {
      throw new Error(
        campo +
        ' no debe informarse para una incidencia de nivel ' +
        nivel +
        '.'
      );
    }
  });

  /*
   * Comprobar continuidad jerárquica.
   */
  if (
    datos.PROYECTO_ID &&
    !datos.CAMPANA_ID
  ) {
    throw new Error(
      'PROYECTO_ID requiere CAMPANA_ID.'
    );
  }

  if (
    datos.PRODUCTO_ID &&
    !datos.PROYECTO_ID
  ) {
    throw new Error(
      'PRODUCTO_ID requiere PROYECTO_ID.'
    );
  }

  if (
    datos.PROCESO_ID &&
    !datos.PRODUCTO_ID
  ) {
    throw new Error(
      'PROCESO_ID requiere PRODUCTO_ID.'
    );
  }

  if (
    datos.TAREA_ID &&
    !datos.PROCESO_ID
  ) {
    throw new Error(
      'TAREA_ID requiere PROCESO_ID.'
    );
  }

  /*
   * Validar proyecto respecto a campaña.
   */
  if (
    datos.PROYECTO_ID &&
    datos.CAMPANA_ID
  ) {
    var proyecto =
      obtenerRegistroPorId(
        'PROYECTO',
        datos.PROYECTO_ID
      );

    if (
      !proyecto ||
      proyecto.ACTIVO !== 'SÍ'
    ) {
      throw new Error(
        'El proyecto indicado no existe o no está activo.'
      );
    }

    if (
      String(proyecto.CAMPANA_ID) !==
      String(datos.CAMPANA_ID)
    ) {
      throw new Error(
        'El proyecto indicado no pertenece a la campaña seleccionada.'
      );
    }
  }

  /*
   * Validar producto respecto a proyecto.
   */
  if (
    datos.PRODUCTO_ID &&
    datos.PROYECTO_ID
  ) {
    var vinculos =
      listarRegistros(
        'PROYECTO_PRODUCTO',
        {
          ACTIVO: 'SÍ',
          PROYECTO_ID: datos.PROYECTO_ID,
          PRODUCTO_ID: datos.PRODUCTO_ID
        }
      );

    if (!vinculos.length) {
      throw new Error(
        'El producto indicado no está vinculado al proyecto seleccionado.'
      );
    }
  }

  /*
   * Validar proceso respecto a producto.
   */
  if (
    datos.PROCESO_ID &&
    datos.PRODUCTO_ID
  ) {
    var proceso =
      obtenerRegistroPorId(
        'PROCESO',
        datos.PROCESO_ID
      );

    if (
      !proceso ||
      proceso.ACTIVO !== 'SÍ'
    ) {
      throw new Error(
        'El proceso indicado no existe o no está activo.'
      );
    }

    if (
      String(proceso.PRODUCTO_ID) !==
      String(datos.PRODUCTO_ID)
    ) {
      throw new Error(
        'El proceso indicado no pertenece al producto seleccionado.'
      );
    }
  }

  /*
   * Validar tarea respecto a proceso.
   */
  if (
    datos.TAREA_ID &&
    datos.PROCESO_ID
  ) {
    var tarea =
      obtenerRegistroPorId(
        'TAREA',
        datos.TAREA_ID
      );

    if (
      !tarea ||
      tarea.ACTIVO !== 'SÍ'
    ) {
      throw new Error(
        'La tarea indicada no existe o no está activa.'
      );
    }

    if (
      String(tarea.PROCESO_ID) !==
      String(datos.PROCESO_ID)
    ) {
      throw new Error(
        'La tarea indicada no pertenece al proceso seleccionado.'
      );
    }
  }

  /*
   * Responsable obligatorio cuando la incidencia deja
   * el estado Abierta.
   */
  var estadosConResponsableObligatorio = [
    'En análisis',
    'En resolución',
    'Bloqueada',
    'Resuelta',
    'Cerrada',
    'Cancelada'
  ];

  var requiereResponsable =
    estadosConResponsableObligatorio
      .indexOf(estado) !== -1;

  if (
    requiereResponsable &&
    !String(datos.RESPONSABLE_ID || '').trim()
  ) {
    throw new Error(
      'RESPONSABLE_ID es obligatorio cuando la incidencia deja el estado Abierta.'
    );
  }

  /*
   * Validar responsable cuando esté informado.
   */
  if (String(datos.RESPONSABLE_ID || '').trim()) {
    var responsable =
      obtenerRegistroPorId(
        'PERSONA_EQUIPO',
        datos.RESPONSABLE_ID
      );

    if (
      !responsable ||
      responsable.ACTIVO !== 'SÍ' ||
      responsable.ESTADO === 'Inactivo'
    ) {
      throw new Error(
        'El responsable indicado no existe o no está activo.'
      );
    }
  }

  /*
   * Determinar si la incidencia está en estado de cierre.
   */
  var esEstadoCierre =
    ESTADOS_INCIDENCIA_CIERRE_
      .indexOf(estado) !== -1;

  /*
   * Toda incidencia cerrada requiere fecha de resolución.
   */
  if (
    esEstadoCierre &&
    !datos.FECHA_RESOLUCION
  ) {
    throw new Error(
      'Debe indicar la fecha de resolución al cerrar la incidencia.'
    );
  }

  /*
   * Validar coherencia temporal entre detección y resolución.
   */
  if (
    datos.FECHA_DETECCION &&
    datos.FECHA_RESOLUCION
  ) {
    var fechaDeteccion =
      datos.FECHA_DETECCION instanceof Date
        ? new Date(datos.FECHA_DETECCION.getTime())
        : new Date(datos.FECHA_DETECCION);

    var fechaResolucion =
      datos.FECHA_RESOLUCION instanceof Date
        ? new Date(datos.FECHA_RESOLUCION.getTime())
        : new Date(datos.FECHA_RESOLUCION);

    if (isNaN(fechaDeteccion.getTime())) {
      throw new Error(
        'La fecha de detección no es válida.'
      );
    }

    if (isNaN(fechaResolucion.getTime())) {
      throw new Error(
        'La fecha de resolución no es válida.'
      );
    }

    /*
     * Comparar solo el día, ignorando horas y minutos.
     */
    fechaDeteccion.setHours(0, 0, 0, 0);
    fechaResolucion.setHours(0, 0, 0, 0);

    if (
      fechaResolucion.getTime() <
      fechaDeteccion.getTime()
    ) {
      throw new Error(
        'La fecha de resolución no puede ser anterior a la fecha de detección.'
      );
    }
  }

  /*
   * Incidencias críticas o de seguridad.
   */
  var esCriticaOSeguridad =
    prioridad === 'Alta' ||
    tipo === 'Seguridad';

  if (
    esCriticaOSeguridad &&
    esEstadoCierre &&
    !String(datos.ACCION_CORRECTORA || '').trim()
  ) {
    throw new Error(
      'Debe indicar la acción correctora: la incidencia es de prioridad alta o de seguridad.'
    );
  }
}
function validarReglasNegocioDocumento_(datos, idExcluir) {
  if (datos.URL && !/^https?:\/\/.+/i.test(datos.URL)) {
    throw new Error('La URL del documento debe empezar por http:// o https://.');
  }
  if (datos.VERSION && !/^[vV]?\d+(\.\d+){0,3}$/.test(datos.VERSION)) {
    throw new Error('La versión debe tener un formato como 1, 1.0 o v1.2.3.');
  }
  if (datos.ESTADO === ESTADO_DOCUMENTO_VIGENTE_ && datos.TIPO_DOCUMENTO !== 'Imagen' && datos.TIPO_DOCUMENTO !== 'Vídeo') {
    var vigentes = listarRegistros('DOCUMENTO', {
      ACTIVO: 'SÍ',
      ENTIDAD_TIPO: datos.ENTIDAD_TIPO,
      ENTIDAD_ID: datos.ENTIDAD_ID,
      TIPO_DOCUMENTO: datos.TIPO_DOCUMENTO,
      ESTADO: ESTADO_DOCUMENTO_VIGENTE_
    });
    var otroVigente = vigentes.some(function (d) { return !idExcluir || d.ID !== idExcluir; });
    if (otroVigente) {
      throw new Error('Ya existe un documento vigente de este tipo para este registro. Marque el anterior como obsoleto antes de aprobar uno nuevo.');
    }
  }
}
function validarReglasNegocioTarea_(datos) {
  if (datos.ESTADO === 'Bloqueada' && !datos.MOTIVO_BLOQUEO) {
    throw new Error('Debe indicar el motivo de bloqueo.');
  }
  if (datos.ESTADO === 'Pospuesta' && !datos.MOTIVO_POSPOSICION) {
    throw new Error('Debe indicar el motivo de posposición.');
  }
  if (datos.ESTADO === 'Cancelada' && !datos.MOTIVO_CANCELACION) {
    throw new Error('Debe indicar el motivo de cancelación.');
  }
  if ((datos.ESTADO === 'Terminada' || datos.ESTADO === 'Cancelada') && !datos.FECHA_FIN_REAL) {
    throw new Error('Debe indicar la fecha fin real al cerrar la tarea.');
  }
}
function validarReglasNegocioTareaResponsable_(datos, idExcluir) {
  if (datos.FECHA_INICIO_ASIGNACION && datos.FECHA_FIN_ASIGNACION) {
    var fechaInicioAsignacion = new Date(datos.FECHA_INICIO_ASIGNACION);
    var fechaFinAsignacion = new Date(datos.FECHA_FIN_ASIGNACION);

    if (
      isNaN(fechaInicioAsignacion.getTime()) ||
      isNaN(fechaFinAsignacion.getTime())
    ) {
      throw new Error('Las fechas de asignación deben ser válidas.');
    }

    if (
      fechaFinAsignacion.getTime() <
      fechaInicioAsignacion.getTime()
    ) {
      throw new Error(
        'La fecha fin de asignación no puede ser anterior a la fecha inicio.'
      );
    }
  }

  var pct = Number(datos.PORCENTAJE_DEDICACION) || 0;

  if (pct <= 0 || pct > 100) {
    throw new Error(
      'El porcentaje de dedicación debe estar entre 1 y 100.'
    );
  }

  var asignaciones = listarRegistros(
    'TAREA_RESPONSABLE',
    {
      ACTIVO: 'SÍ',
      ESTADO: 'Activa'
    }
  );

  var total = pct;

  asignaciones.forEach(function (a) {
    if (idExcluir && a.ID === idExcluir) {
      return;
    }

    if (
      a.PERSONA_EQUIPO_ID ===
      datos.PERSONA_EQUIPO_ID
    ) {
      total +=
        Number(a.PORCENTAJE_DEDICACION) || 0;
    }
  });

  if (total > 100) {
    throw new Error(
      'La dedicación total de esta persona superaría el 100% (' +
      total +
      '%).'
    );
  }
}
function validarReglasNegocioMaterial_(datos) {
  var stock = Number(datos.STOCK_ACTUAL);
  var minimo = Number(datos.STOCK_MINIMO);
  if (stock < 0 || minimo < 0) {
    throw new Error('El stock y el stock mínimo no pueden ser negativos.');
  }
}
function validarReglasNegocioTareaMaterial_(datos) {
  var prevista = Number(datos.CANTIDAD_PREVISTA) || 0;
  var consumida = Number(datos.CANTIDAD_CONSUMIDA) || 0;
  var desperdiciada = Number(datos.CANTIDAD_DESPERDICIADA) || 0;

  if (
    prevista < 0 ||
    consumida < 0 ||
    desperdiciada < 0
  ) {
    throw new Error(
      'Las cantidades prevista, consumida y desperdiciada no pueden ser negativas.'
    );
  }

  if (
    consumida + desperdiciada > prevista &&
    !String(datos.MOTIVO_DESVIACION || '').trim()
  ) {
    throw new Error(
      'Debe indicar el motivo de desviación cuando el consumo supera lo previsto.'
    );
  }
}
function normalizarValorFormulario_(campo, valor) {
  if (valor === undefined || valor === null || valor === '') {
    return valor === null || valor === undefined ? '' : valor;
  }

  if (campo.tipo === 'numero') {
    var numero = Number(String(valor).trim());

    if (!Number.isFinite(numero)) {
      throw new Error(
        campo.etiqueta + ' debe ser un número válido.'
      );
    }

    return numero;
  }

  if (campo.tipo !== 'fecha') {
    return valor;
  }

  if (
    Object.prototype.toString.call(valor) === '[object Date]' &&
    !isNaN(valor.getTime())
  ) {
    return valor;
  }

  var partes = String(valor)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!partes) {
    throw new Error(
      campo.etiqueta + ' debe tener el formato AAAA-MM-DD.'
    );
  }

  var anio = Number(partes[1]);
  var mes = Number(partes[2]);
  var dia = Number(partes[3]);
  var fecha = new Date(anio, mes - 1, dia);

  if (
    isNaN(fecha.getTime()) ||
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    throw new Error(
      campo.etiqueta + ' debe ser una fecha válida.'
    );
  }

  return fecha;
}
/*
 * `correlationId` (opcional, Fase L4 F-015): permite encadenar varias
 * llamadas a guardarFormulario bajo el mismo CORRELATION_ID de historial
 * -- usado por el flujo "guardar y vincular" de PRODUCTO+PROYECTO_PRODUCTO
 * (ver mostrarPasoVincularProyecto_ en FormularioGenerico.html). Si no se
 * pasa, insertarRegistroTransaccional/actualizarRegistroTransaccional
 * generan uno nuevo como siempre.
 */
/*
 * Bug real detectado al probar VINCULO Recurso->Documento: el buscador
 * de FK (L3.5) solo extrae el ID del texto escrito (extraerIdDeEtiqueta_
 * en el cliente), sin comprobar que sea uno de verdad -- si el usuario
 * escribe algo y guarda sin elegir ninguna opcion del desplegable, ese
 * texto se guarda tal cual como si fuera un ID valido (ocurrio con
 * VIN-0003, ENTIDAD_DESTINO_ID="D"). Afecta a cualquier campo fk/
 * fk_dependiente de cualquier entidad, no solo a VINCULO.
 *
 * Reutiliza el mismo resolver que ya usa el cliente para poblar las
 * opciones (listarRegistros para fk directo, mapa.resolver(...) para
 * fk_dependiente), asi la validacion nunca se desincroniza de lo que
 * el usuario realmente puede elegir.
 */
function validarClavesForaneasFormulario_(clave, datos, idExcluir) {
  var esquema = ESQUEMAS_FORMULARIO_MVP[clave];

  /*
   * Al editar, guardarFormulario reenvia TODOS los campos (no solo los
   * cambiados). Si un valor de FK no cambio respecto al ya guardado, no
   * se revalida -- evita bloquear la edicion de un registro antiguo
   * solo porque una referencia suya se desactivo despues (ACTIVO=NO),
   * algo ajeno a la edicion que se esta haciendo ahora.
   */
  var registroActual = idExcluir ? obtenerRegistroPorId(clave, idExcluir) : null;

  esquema.forEach(function (campo) {
    var valor = String(datos[campo.campo] || '').trim();

    if (!valor) return;

    if (
      registroActual &&
      String(registroActual[campo.campo] || '').trim() === valor
    ) {
      return;
    }

    var idsValidos;

    if (campo.tipo === 'fk') {
      idsValidos = listarRegistros(campo.entidadFk, { ACTIVO: 'SÍ' }).map(
        function (registro) { return String(registro.ID); }
      );
    } else if (campo.tipo === 'fk_dependiente') {
      var valorPadre = String(datos[campo.dependeDe] || '').trim();
      var mapa = MAPAS_DEPENDENCIA_MVP[campo.mapaEntidad];

      if (!mapa || !valorPadre) return;

      idsValidos = mapa.resolver(valorPadre).map(
        function (opcion) { return String(opcion.id); }
      );
    } else {
      return;
    }

    if (idsValidos.indexOf(valor) === -1) {
      throw new Error(
        'ERROR_VALIDACION: el valor "' + valor + '" de "' + campo.etiqueta +
          '" no corresponde a ningún registro válido.'
      );
    }
  });
}
function guardarFormulario(entidad, idRegistro, datosCrudos, correlationId) {
  var clave = String(entidad || '').trim().toUpperCase();
  var esquema = ESQUEMAS_FORMULARIO_MVP[clave];

  if (!Array.isArray(esquema)) {
    throw new Error(
      'No hay esquema de formulario para la entidad ' + entidad
    );
  }

  datosCrudos = datosCrudos || {};

  var datos = {};

  esquema.forEach(function (campo) {
    datos[campo.campo] = normalizarValorFormulario_(
      campo,
      datosCrudos[campo.campo]
    );
  });

  /*
   * Hallazgo #18 (auditoría piloto): campos como PORCENTAJE_AVANCE no
   * tienen sentido pedirlos al crear (un registro nuevo siempre empieza
   * en 0) -- se ocultan en el formulario (ocultarAlCrear, ver
   * FormularioGenerico.html) y aquí se completan con su valor por
   * defecto si llegan vacíos al crear.
   */
  if (!idRegistro) {
    esquema.forEach(function (campo) {
      if (
        campo.ocultarAlCrear &&
        campo.valorPorDefectoAlCrear !== undefined &&
        (datos[campo.campo] === '' || datos[campo.campo] === undefined)
      ) {
        datos[campo.campo] = campo.valorPorDefectoAlCrear;
      }
    });
  }

  var correlationIdFinal = correlationId || Utilities.getUuid();

  try {
    if (clave === 'PERSONA_EQUIPO') {
      validarReglasNegocioFormulario_(
        clave,
        datos,
        idRegistro
      );
    }

    validarClavesForaneasFormulario_(
      clave,
      datos,
      idRegistro
    );

    validarDuplicidadFormulario_(
      clave,
      datos,
      idRegistro
    );

    if (clave !== 'PERSONA_EQUIPO') {
      validarReglasNegocioFormulario_(
        clave,
        datos,
        idRegistro
      );
    }

    /*
     * PROYECTO_VINCULAR_ID (auditoría piloto, hallazgo #13): campo
     * virtual del formulario de PRODUCTO, no es una columna real de la
     * hoja -- se valida como FK arriba (validarClavesForaneasFormulario_)
     * pero se extrae antes de insertar/actualizar. Si tiene valor, crea
     * además el PROYECTO_PRODUCTO en el mismo guardado, sustituyendo el
     * paso posterior "¿Vincular ahora?" de F-015 por un campo normal.
     */
    var proyectoVincularId = null;

    if (clave === 'PRODUCTO') {
      proyectoVincularId = datos.PROYECTO_VINCULAR_ID || null;
      delete datos.PROYECTO_VINCULAR_ID;
    }

    var idFinal = idRegistro;

    if (idRegistro) {
      actualizarRegistroTransaccional(
        clave,
        idRegistro,
        datos,
        {
          origen: 'UI',
          correlationId: correlationIdFinal
        }
      );
    } else {
      var resultadoInsercion = insertarRegistroTransaccional(
        clave,
        datos,
        {
          origen: 'UI',
          correlationId: correlationIdFinal
        }
      );

      idFinal = resultadoInsercion.id;

      /*
       * N7.2 -- alta manual de un movimiento de material (menú "Nuevo
       * movimiento de material"): ajusta stock/reserva tras el insert,
       * nunca dentro (StockMaterialService.js explica por qué).
       */
      if (clave === 'MOVIMIENTO_MATERIAL') {
        aplicarMovimientoAStock_(datos.MATERIAL_ID, datos.TIPO_MOVIMIENTO, datos.CANTIDAD);
      }
    }

    if (clave === 'PRODUCTO' && proyectoVincularId) {
      insertarRegistroTransaccional(
        'PROYECTO_PRODUCTO',
        {
          PROYECTO_ID: proyectoVincularId,
          PRODUCTO_ID: idFinal,
          CANTIDAD_ASIGNADA: Number(datos.CANTIDAD_PREVISTA) || 1,
          PRIORIDAD: datos.PRIORIDAD,
          ESTADO: 'Activa'
        },
        {
          origen: 'UI',
          correlationId: correlationIdFinal
        }
      );
    }

    return {
      id: idFinal,
      correlationId: correlationIdFinal
    };
  } catch (errorRepositorio) {
    throw new Error(
      traducirErrorFuncional_(
        errorRepositorio.message,
        clave
      )
    );
  }
}