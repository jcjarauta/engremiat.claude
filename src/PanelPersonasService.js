/**
 * Arbol de Personas/Equipo: mismo patron que el arbol de Recursos,
 * aplicado a PERSONA_EQUIPO.COORDINADOR_ID (tambien autorreferencial,
 * un unico coordinador por persona/equipo). Descenso recursivo
 * generico, sin cadena de creacion (el formulario de Persona/Equipo ya
 * elige su coordinador).
 */

function obtenerArbolPersonas() {
  var personas = listarRegistros('PERSONA_EQUIPO', { ACTIVO: 'SÍ' });

  var porCoordinador = {};
  personas.forEach(function (persona) {
    var padre = persona.COORDINADOR_ID || '';
    if (!porCoordinador[padre]) porCoordinador[padre] = [];
    porCoordinador[padre].push(persona);
  });

  function construirNodo_(persona, cadenaAncestros) {
    if (cadenaAncestros.indexOf(persona.ID) !== -1) {
      return {
        id: persona.ID, nombre: persona.NOMBRE + ' (ciclo detectado, no se muestran hijos)',
        tipo: persona.TIPO, rol: persona.ROL, estado: persona.ESTADO, hijos: []
      };
    }
    var siguienteCadena = cadenaAncestros.concat([persona.ID]);
    var hijos = (porCoordinador[persona.ID] || []).map(function (hijo) {
      return construirNodo_(hijo, siguienteCadena);
    });
    return {
      id: persona.ID,
      nombre: persona.NOMBRE,
      tipo: persona.TIPO,
      rol: persona.ROL,
      estado: persona.ESTADO,
      hijos: hijos
    };
  }

  var raiz = (porCoordinador[''] || []).map(function (persona) {
    return construirNodo_(persona, []);
  });

  return { raiz: raiz, total: personas.length };
}

function abrirPanelPersonas() {
  var html = HtmlService.createTemplateFromFile('PanelPersonas')
    .evaluate()
    .setTitle('Personas y equipo')
    .setWidth(440);
  SpreadsheetApp.getUi().showSidebar(html);
}
