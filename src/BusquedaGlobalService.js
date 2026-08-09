/**
 * Buscador global (ver conversación -- "Mapa del sheet ... un único
 * punto de partida ... buscador global"): busca un término en todas
 * las entidades que ya tienen Ficha de registro (ver
 * abrirFichaPorEntidad_ en FormularioMotorUI.js), reutilizando
 * obtenerOpcionesEntidadParaSelector -- mismo texto que ya usa cada
 * selector "Editar X"/"Ficha de X (buscar)" individual, aquí fusionado
 * en una sola búsqueda.
 *
 * Cada entidad se envuelve en try/catch: si su hoja no existe en este
 * cliente (módulo no instalado, p.ej. MATERIAL/PROVEEDOR sin COMPRAS),
 * esa entidad simplemente no aporta resultados en vez de romper la
 * búsqueda entera -- mismo criterio defensivo ya aplicado en
 * FichaProductoService.js/FichaTareaService.js para lecturas de
 * módulo opcional.
 */
var ENTIDADES_BUSCABLES_ = [
  { clave: 'CAMPANA', etiqueta: 'Campaña' },
  { clave: 'PROYECTO', etiqueta: 'Proyecto' },
  { clave: 'PRODUCTO', etiqueta: 'Producto' },
  { clave: 'PROCESO', etiqueta: 'Proceso' },
  { clave: 'TAREA', etiqueta: 'Tarea' },
  { clave: 'PERSONA_EQUIPO', etiqueta: 'Persona/equipo' },
  { clave: 'RECURSO', etiqueta: 'Recurso' },
  { clave: 'INCIDENCIA', etiqueta: 'Incidencia' },
  { clave: 'MATERIAL', etiqueta: 'Material' },
  { clave: 'PROVEEDOR', etiqueta: 'Proveedor' },
  { clave: 'CONVOCATORIA', etiqueta: 'Convocatoria' }
];

function buscarGlobal(termino) {
  var t = String(termino || '').trim().toLowerCase();
  if (!t) return [];

  var resultados = [];

  ENTIDADES_BUSCABLES_.forEach(function (e) {
    var opciones;
    try {
      opciones = obtenerOpcionesEntidadParaSelector(e.clave, false);
    } catch (err) {
      return;
    }
    opciones.forEach(function (o) {
      if (String(o.etiqueta || '').toLowerCase().indexOf(t) !== -1) {
        resultados.push({ entidad: e.clave, entidadEtiqueta: e.etiqueta, id: o.id, etiqueta: o.etiqueta });
      }
    });
  });

  /* Coincidencias más cortas (más precisas) primero, tope de 40 para no saturar el diálogo. */
  resultados.sort(function (a, b) { return a.etiqueta.length - b.etiqueta.length; });
  return resultados.slice(0, 40);
}

/* accionFn del resultado de búsqueda: abre la ficha de registro correspondiente. */
function abrirFichaDesdeResultadoBusqueda(entidad, id) {
  abrirFichaPorEntidad_(entidad, id);
}
