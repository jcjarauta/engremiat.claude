/**
 * Cierra el hueco real encontrado usando la Vista del día/rango (ver
 * conversacion): solo La Troballa, Cerámica, Tienda y el Voluntariado
 * tenían HORARIO cargado -- ningún responsable de producción, la
 * coordinadora, el diseño, ni los espacios de Manipulados/Carpintería/
 * Almacén/Oficina. Por eso la Vista del día marcaba "Fuera de horario"
 * a casi todo el mundo: no era mala planificación, era falta de datos.
 *
 * Incluye un caso de conflicto real deliberado: Responsable de Tienda
 * tiene horario Lunes-Jueves, pero ya está asignada (Mercats de Tardor,
 * "Preparar mercadillo local") sábado-lunes -- sábado y domingo caen
 * fuera de su horario declarado, un "Fuera de horario" genuino, no por
 * falta de datos.
 *
 * Idempotente: comprueba antes de crear cada fila (ENTIDAD_TIPO +
 * ENTIDAD_ID + DIA_SEMANA), no un guard unico al principio.
 */
function instalarHorarioEquipoProduccion() {
  var packageName = 'INSTALAR_HORARIO_EQUIPO_PRODUCCION';
  console.log('ENGREMIAT_PACKAGE_BEGIN package=' + packageName);

  var correlationId = Utilities.getUuid();
  var existentes = listarRegistros('HORARIO', { ACTIVO: 'SÍ' });

  function crearHorarioSiFalta_(entidadTipo, entidadId, diaSemana, horaInicio, horaFin) {
    var yaExiste = existentes.some(function (h) {
      return h.ENTIDAD_TIPO === entidadTipo && h.ENTIDAD_ID === entidadId && h.DIA_SEMANA === diaSemana;
    });
    if (yaExiste) {
      console.log('OK ya_existe=true entidad=' + entidadId + ' dia=' + diaSemana);
      return;
    }
    var resultado = guardarFormulario('HORARIO', null, {
      ENTIDAD_TIPO: entidadTipo, ENTIDAD_ID: entidadId, DIA_SEMANA: diaSemana,
      HORA_INICIO: horaInicio, HORA_FIN: horaFin, ESTADO: 'Activa'
    }, correlationId);
    console.log('OK creado entidad=HORARIO id=' + resultado.id + ' para=' + entidadId + ' dia=' + diaSemana);
  }

  function crearHorarioSemanaCompleta_(entidadTipo, entidadId, dias, horaInicio, horaFin) {
    dias.forEach(function (dia) { crearHorarioSiFalta_(entidadTipo, entidadId, dia, horaInicio, horaFin); });
  }

  var LUN_VIE = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  // --- Personas: equipo de producción a jornada completa. ---
  crearHorarioSemanaCompleta_('Persona/Equipo', 'PER-0004', LUN_VIE, '09:00', '17:00'); // Responsable de Manipulados
  crearHorarioSemanaCompleta_('Persona/Equipo', 'PER-0005', LUN_VIE, '09:00', '17:00'); // Responsable de Carpintería
  crearHorarioSemanaCompleta_('Persona/Equipo', 'PER-0006', LUN_VIE, '09:00', '17:00'); // Coordinadora de Taller

  // --- Personas con disponibilidad parcial (según su propia DISPONIBILIDAD ya declarada). ---
  crearHorarioSemanaCompleta_('Persona/Equipo', 'PER-0007', ['Lunes', 'Martes', 'Miércoles', 'Jueves'], '10:00', '14:00'); // Diseñador/a de Producto
  crearHorarioSemanaCompleta_('Persona/Equipo', 'PER-0016', ['Martes', 'Jueves', 'Viernes', 'Sábado'], '09:00', '13:00'); // Responsable de Cerámica
  /*
   * Responsable de Tienda: Lunes-Jueves a propósito (NO incluye
   * sábado/domingo) -- ya está asignada sáb-lun a "Preparar mercadillo
   * local" (Mercats de Tardor), así que sábado y domingo quedan fuera
   * de horario de verdad, no por falta de datos.
   */
  crearHorarioSemanaCompleta_('Persona/Equipo', 'PER-0017', ['Lunes', 'Martes', 'Miércoles', 'Jueves'], '09:00', '13:00'); // Responsable de Tienda
  crearHorarioSemanaCompleta_('Persona/Equipo', 'PER-0015', ['Lunes', 'Miércoles', 'Viernes'], '10:00', '13:00'); // Participante Manipulados 1 (persona atendida)
  crearHorarioSemanaCompleta_('Persona/Equipo', 'PER-0018', ['Martes', 'Jueves'], '10:00', '14:00'); // Equipo de Cerámica (mismo horario que el espacio)

  // --- Espacios que faltaban. ---
  crearHorarioSemanaCompleta_('Recurso', 'REC-0004', LUN_VIE, '09:00', '17:00'); // Taller de Manipulados
  crearHorarioSemanaCompleta_('Recurso', 'REC-0005', LUN_VIE, '09:00', '17:00'); // Taller de Carpintería
  crearHorarioSemanaCompleta_('Recurso', 'REC-0006', LUN_VIE, '09:00', '17:00'); // Almacén de Materiales
  crearHorarioSemanaCompleta_('Recurso', 'REC-0012', LUN_VIE, '09:00', '17:00'); // Oficina

  console.log('ENGREMIAT_PACKAGE_END package=' + packageName + ' status=OK');
  return true;
}
