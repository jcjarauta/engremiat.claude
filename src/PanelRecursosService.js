/**
 * Arbol de Espacios/Recursos: mismo patron de navegacion que el Panel
 * de campaña, aplicado a RECURSO, que es autorreferencial de verdad
 * (RECURSO.UBICACION_ID -> otro RECURSO de clase Espacio) en vez de
 * una cadena fija de niveles como Campaña->Proyecto->Producto. Por eso
 * el arbol se construye con descenso recursivo genérico, no con una
 * funcion "listarXDeY" por nivel.
 *
 * Sin cadena de creacion (a diferencia del panel de campaña): RECURSO
 * ya elige su propia ubicacion en su formulario normal (buscador de FK
 * filtrado a Espacio), no hace falta un "+ Nuevo recurso aqui".
 */

function obtenerArbolRecursos() {
  var recursos = listarRegistros('RECURSO', { ACTIVO: 'SÍ' });

  var nombresPersona = {};
  listarRegistros('PERSONA_EQUIPO', {}).forEach(function (persona) {
    nombresPersona[persona.ID] = persona.NOMBRE;
  });

  var porUbicacion = {};
  recursos.forEach(function (recurso) {
    var padre = recurso.UBICACION_ID || '';
    if (!porUbicacion[padre]) porUbicacion[padre] = [];
    porUbicacion[padre].push(recurso);
  });

  // Proteccion contra ciclos (A ubicado en B, B ubicado en A): con
  // datos reales no deberia pasar (el formulario filtra a Espacio,
  // pero nada impide crear un ciclo entre dos espacios), asi que se
  // corta la recursion si un ID ya aparecio en su propia cadena.
  function construirNodo_(recurso, cadenaAncestros) {
    if (cadenaAncestros.indexOf(recurso.ID) !== -1) {
      return {
        id: recurso.ID, codigo: recurso.CODIGO, nombre: recurso.NOMBRE + ' (ciclo detectado, no se muestran hijos)',
        clase: recurso.CLASE_RECURSO, categoria: recurso.CATEGORIA_RECURSO || '',
        estado: recurso.ESTADO, responsable: nombresPersona[recurso.RESPONSABLE_ID] || '',
        hijos: []
      };
    }
    var siguienteCadena = cadenaAncestros.concat([recurso.ID]);
    var hijos = (porUbicacion[recurso.ID] || []).map(function (hijo) {
      return construirNodo_(hijo, siguienteCadena);
    });
    return {
      id: recurso.ID,
      codigo: recurso.CODIGO,
      nombre: recurso.NOMBRE,
      clase: recurso.CLASE_RECURSO,
      categoria: recurso.CATEGORIA_RECURSO || '',
      estado: recurso.ESTADO,
      responsable: nombresPersona[recurso.RESPONSABLE_ID] || '',
      hijos: hijos
    };
  }

  var raiz = (porUbicacion[''] || []).map(function (recurso) {
    return construirNodo_(recurso, []);
  });

  return { raiz: raiz, total: recursos.length };
}

function abrirPanelRecursos() {
  var html = HtmlService.createTemplateFromFile('PanelRecursos')
    .evaluate()
    .setTitle('Espacios y recursos')
    .setWidth(440);
  SpreadsheetApp.getUi().showSidebar(html);
}
