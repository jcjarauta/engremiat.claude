/**
 * Regla de encaje de OPORTUNIDAD (Fase 4, nivel básico -- ver
 * ROADMAP_GESTOR_PROYECTOS_CLIENTE_VENTAS.md). Determinista, sin IA,
 * mismo patrón que obtenerProyectosQueEncajan_ en
 * FichaConvocatoriaService.js: esa mira financiación externa que La
 * Troballa puede solicitar; esta mira entidades financiadas
 * externamente que podrían ser clientes.
 *
 * v1: una sola señal -- coincidencia de AMBITO contra el catálogo
 * SECTOR_OBJETIVO (mantenido aparte de AMBITO_OPORTUNIDAD porque no
 * todos los ámbitos posibles son necesariamente un sector prioritario;
 * hoy coinciden en contenido pero son conceptos distintos). Ampliable
 * con más señales sin rediseñar la tabla -- PUNTUACION_ENCAJE ya existe
 * como columna numérica.
 */

function calcularPuntuacionEncajeOportunidad_(oportunidad) {
  var sectoresObjetivo_ = {};
  listarOpcionesActivas('SECTOR_OBJETIVO').forEach(function (opcion) {
    sectoresObjetivo_[opcion.valor] = true;
  });

  return sectoresObjetivo_[oportunidad.AMBITO] ? 1 : 0;
}

function recalcularPuntuacionEncajeOportunidades() {
  var oportunidades = listarRegistros('OPORTUNIDAD', { ACTIVO: 'SÍ' });
  var actualizadas = 0;

  oportunidades.forEach(function (oportunidad) {
    var puntuacion = calcularPuntuacionEncajeOportunidad_(oportunidad);
    if (String(oportunidad.PUNTUACION_ENCAJE) === String(puntuacion)) return;

    actualizarRegistroTransaccional('OPORTUNIDAD', oportunidad.ID, { PUNTUACION_ENCAJE: puntuacion }, { origen: 'SCRIPT' });
    actualizadas += 1;
  });

  return { total: oportunidades.length, actualizadas: actualizadas };
}

function abrirRecalcularPuntuacionEncajeOportunidades() {
  var ui = SpreadsheetApp.getUi();

  var resp = ui.alert(
    'Recalcular encaje de oportunidades',
    'Esto recalcula PUNTUACION_ENCAJE de todas las oportunidades activas (regla determinista: coincidencia de Ámbito con el catálogo Sector objetivo). ¿Continuar?',
    ui.ButtonSet.YES_NO
  );

  if (resp !== ui.Button.YES) return;

  try {
    var resultado = recalcularPuntuacionEncajeOportunidades();
    ui.alert('Encaje recalculado', 'Oportunidades revisadas: ' + resultado.total + '\nActualizadas: ' + resultado.actualizadas, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('Error', err.message, ui.ButtonSet.OK);
  }
}
