#!/usr/bin/env node
/*
 * Consolidacion real del censo de entidades (censo_entidades.json) --
 * segunda pasada pedida explicitamente: "investiga y termina de
 * consolidarlo" sobre confirmar/promover/revisar. El grupo descartar se
 * valora aparte, al final, con el criterio explicito del operador: "si
 * encontramos huecos en el grafo global sera nuestra primera fuente de
 * posibilidad, si al final no tiene sentido, lo dejamos como historico"
 * -- investigado a mano (no solo reglas automaticas): 5 huecos reales
 * concretos encontrados (3 tablas Baserow tocadas por codigo real, 2
 * modulos activos para un cliente real sin ficha propia), 2 candidatas
 * reales a ficha nueva, 5 pestanas/tabla que YA tienen grafo real propio
 * y el censo no las detecta por como se construyo, y el resto
 * clasificado por patron real (instancia de negocio especifica / huella
 * hoy insuficiente) -- se queda como historico, tal como se pidio.
 *
 * Anade dos fuentes reales mas que el primer censo no tenia:
 *  - modulos_ids_js: el registro real MODULO_POR_ENTIDAD_MVP de
 *    src/Ids.js (11 modulos de negocio reales + CORE) -- mas fuerte que
 *    coincidencia de texto: es el propio catalogo de codigo.
 *  - telar_b2_real: ficheros reales de deliberacion ya ocurrida en
 *    tools/gobierno/telar/b2/respuestas_originales/ -- si un Acervo
 *    tiene transcripciones reales ahi, esta activo de verdad en Telar,
 *    no solo declarado en la boveda.
 *
 * Ademas aplica un pequeno numero de correspondencias verificadas a
 * mano leyendo el fichero real (no adivinadas): p.ej. "Verificador de
 * Campos" (boveda) <-> tools/verificador_determinista.mjs (codigo) --
 * incluidas explicitamente con su fuente, nunca como suposicion.
 *
 * Salida: anade a cada entidad de confirmar/promover/revisar un campo
 * `accionRecomendada` + `accionRazon`, y escribe
 * censo_entidades.json (in place) + CONSOLIDACION_CENSO.md.
 *
 * Uso: node consolidar_censo.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = import.meta.dirname;
const RUTA_CENSO = join(DIR, 'censo_entidades.json');
const RUTA_IDS = 'C:\\Users\\pc\\Desktop\\engremiat.claude\\src\\Ids.js';
const RUTA_TELAR_B2 = 'C:\\Users\\pc\\Desktop\\engremiat.claude\\tools\\gobierno\\telar\\b2\\respuestas_originales';

function slug(texto) {
  return String(texto).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// ---------- Fuente real #10: catalogo de modulos de src/Ids.js ----------
const textoIds = readFileSync(RUTA_IDS, 'utf-8');
const bloqueModulos = textoIds.match(/MODULO_POR_ENTIDAD_MVP\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/)[1];
const modulosRealesCodigo = new Set([...bloqueModulos.matchAll(/:\s*'([A-Z_]+)'/g)].map(m => slug(m[1])));
modulosRealesCodigo.add('core');

// ---------- Fuente real #11: transcripciones reales de Telar B2 ----------
const ficherosB2 = readdirSync(RUTA_TELAR_B2);
const acervosConUsoRealB2 = new Set(
  ficherosB2.map(f => f.match(/^b2-([a-z-]+?)-\d+\.txt$/)?.[1]).filter(Boolean).map(slug)
);

// ---------- Correspondencias verificadas a mano leyendo el fichero real ----------
const CORRESPONDENCIAS_VERIFICADAS_A_MANO = {
  [slug('Verificador de Campos')]: 'tools/verificador_determinista.mjs -- verificado leyendo el fichero real: "Verificador determinista: comprueba afirmaciones de campo de Baserow contra el esquema real". Mismo oficio, nombre distinto en boveda vs. codigo.',
};

const TIPOS_NARRATIVOS = new Set(['hilo', 'arco', 'sesion', 'mapa', 'estilo', 'sin_tipo']);

function decidirAccionRevisar(e) {
  const tipos = e.tiposCandidato;
  const s = e.slug;

  if (tipos.some(t => TIPOS_NARRATIVOS.has(t))) {
    return { accion: 'correcto_narrativo', razon: 'Contenido narrativo/bitácora por diseño (hilo/arco/sesión/mapa/estilo) -- baja corroboración fuera de la bóveda es lo esperado, no un hueco. Sin acción.' };
  }

  if (CORRESPONDENCIAS_VERIFICADAS_A_MANO[s]) {
    return { accion: 'confirmar_verificado_a_mano', razon: 'Correspondencia real confirmada leyendo el fichero: ' + CORRESPONDENCIAS_VERIFICADAS_A_MANO[s] };
  }

  if (tipos.includes('modulo')) {
    if (modulosRealesCodigo.has(s)) {
      return { accion: 'confirmar_codigo_real', razon: 'Nombre coincide de forma exacta con un módulo real registrado en MODULO_POR_ENTIDAD_MVP (src/Ids.js) -- evidencia más fuerte que coincidencia de texto: es el propio catálogo de código.' };
    }
    if (e.fuentes.includes('codigo_appsscript') || e.fuentes.includes('codigo_node')) {
      return { accion: 'confirmar_patron_tecnico', razon: 'Nombre real en el código (Apps Script o Node) pero NO está en el catálogo MODULO_POR_ENTIDAD_MVP -- probablemente un patrón técnico/servicio interno (Repository, IntegrityService...), no un módulo de negocio MVP. Revisar si el `tipo: modulo` en la ficha de la bóveda es el correcto, o si debería reclasificarse.' };
    }
    return { accion: 'revisar_manual_real', razon: 'Ficha real de tipo módulo sin correspondencia en MODULO_POR_ENTIDAD_MVP ni en el código escaneado -- puede ser un módulo planeado pero no implementado todavía. Revisar a mano si sigue vigente.' };
  }

  if (tipos.includes('personaje')) {
    if (e.fuentes.includes('codigo_node') || e.fuentes.includes('codigo_appsscript')) {
      return { accion: 'confirmar_codigo_real', razon: 'Personaje con script real correspondiente ya encontrado en el código.' };
    }
    if (acervosConUsoRealB2.has(s)) {
      return { accion: 'confirmar_uso_real_telar', razon: 'Sin script propio, pero con transcripciones reales de deliberación ya ocurridas en tools/gobierno/telar/b2/respuestas_originales/ -- Personaje activo de verdad en Telar, no solo declarado.' };
    }
    return { accion: 'revisar_manual_real', razon: 'Personaje real en la bóveda sin script propio ni transcripción real de Telar B2 encontrada -- candidato genuino a revisar si sigue activo o quedó solo declarado.' };
  }

  if (tipos.includes('oficio')) {
    if (e.fuentes.includes('codigo_node') || e.fuentes.includes('codigo_appsscript')) {
      return { accion: 'confirmar_codigo_real', razon: 'Oficio con script real correspondiente -- huella estrecha (no aparece en Sheet/Baserow/n8n) es normal para un script interno pequeño, no indica problema.' };
    }
    return { accion: 'revisar_manual_real', razon: 'Oficio real en la bóveda sin script correspondiente encontrado en el código escaneado.' };
  }

  if (tipos.includes('espacio') || tipos.includes('regla')) {
    if (e.fuentes.some(f => !['vault_ficha', 'vault_wikilink'].includes(f))) {
      return { accion: 'confirmar_codigo_real', razon: 'Corroborado por al menos una fuente real fuera de la bóveda.' };
    }
    return { accion: 'revisar_nombre_narrativo', razon: 'Nombre narrativo del universo (p.ej. "El Sheet", "La fragua protegida") -- el cruce por texto no puede alcanzar su referente real (el Sheet real, el VPS real, la ley real ya citada en fixtures). No es evidencia de que falte: es un límite del método. Acción recomendada: añadir `vinculoReal` explícito a la ficha para que el próximo censo lo confirme con evidencia, no con nombre.' };
  }

  return { accion: 'revisar_manual_real', razon: 'Ficha real con corroboración baja y sin regla específica aplicable -- revisar a mano.' };
}

function decidirAccionPromover(e) {
  const nombre = e.nombre;
  const soloUnaPalabra = !nombre.includes('_') && !nombre.includes(' ');
  const esNombreGenerico = ['TAREA', 'DOCUMENTO', 'Verificación', 'RECURSO'].includes(nombre);

  if (esNombreGenerico) {
    return { accion: 'descartar_termino_generico', razon: 'Palabra genérica que aparece en muchas pestañas/tablas reales sin ser ella misma una entidad -- ya existen las entidades específicas reales (06_TAREAS, 24_TAREA_RECURSO, 14_DOCUMENTOS...). Crear una ficha "TAREA" sería redundante, no una entidad nueva. No promover.' };
  }
  if (['Acervo', 'Acervos'].includes(nombre)) {
    return { accion: 'revisar_inconsistencia_nombres', razon: 'No falta una entidad -- falta consistencia: 7 fichas reales "Acervo X" existen (Filosófico/Lógico/Narrativo/Sociocracia/Técnico/Logístico/Usuario) pero ningún wikilink usa el nombre exacto de ninguna, solo la forma genérica "Acervo"/"Acervos". Acción recomendada: revisar esos wikilinks a mano y apuntarlos a la ficha específica real que corresponda, o crear una ficha-paraguas "Acervo" si de verdad hace falta un concepto agregador.' };
  }
  if (e.tiposCandidato.some(t => t.startsWith('pestana_sheet') || t === 'tabla_baserow' || t === 'recurso_codigo')) {
    return { accion: 'promover_recurso_real', razon: 'Pestaña/tabla real, corroborada por ' + e.corroboracionCruzada + ' fuentes independientes -- candidata sólida a ficha de Recurso (o, como mínimo, a que una ficha ya existente declare `vinculoReal` hacia ella).' };
  }
  return { accion: 'revisar_manual_real', razon: 'Corroborada por múltiples fuentes reales pero sin patrón claro aplicable -- revisar a mano antes de decidir.' };
}

// ---------- Grupo descartar (119->117 tras el fix de wikilinks): investigado ----------
// Instrucción explícita: "si encontramos huecos en el grafo global sera
// nuestra primera fuente de posibilidad, si al final no tiene sentido, lo
// dejamos como historico". Tres hallazgos reales concretos encontrados
// investigando (no generados por regla automática) + el resto clasificado
// por patrón real (instancia de negocio / huella hoy insuficiente).

// Fuente real: grafo_node.json -- que scripts tocan de verdad cada recurso.
const grafoNode = JSON.parse(readFileSync(join(DIR, 'grafo_node.json'), 'utf-8'));
function scriptsQueTocan(nombreRecurso) {
  const nodo = grafoNode.nodos.find(n => n.tipo === 'recurso_real' && n.nombre === nombreRecurso);
  if (!nodo) return [];
  return grafoNode.aristas.filter(a => a.target === nodo.id).map(a => a.source);
}

const HUECOS_REALES_ENCONTRADOS = {
  VIGILIA_TAREA: () => `Tabla real de Baserow tocada de verdad por ${scriptsQueTocan('VIGILIA_TAREA').length} scripts reales (${scriptsQueTocan('VIGILIA_TAREA').join(', ')}) -- se quedó bajo el umbral de "promover" (3) solo por no aparecer también en Sheet/n8n/bóveda, no porque falte evidencia real. Candidata real a ficha de Recurso.`,
  DOCUMENTO_ENGREMIAT: () => `Tabla real de Baserow tocada de verdad por ${scriptsQueTocan('DOCUMENTO_ENGREMIAT').length} scripts reales (${scriptsQueTocan('DOCUMENTO_ENGREMIAT').join(', ')}). Mismo caso que VIGILIA_TAREA: hueco real por debajo del umbral, no ausencia de evidencia.`,
  METRICA_FABRICACION: () => `Tabla real de Baserow tocada de verdad por ${scriptsQueTocan('METRICA_FABRICACION').length} scripts reales (${scriptsQueTocan('METRICA_FABRICACION').join(', ')}). Mismo caso: hueco real por debajo del umbral.`,
  AGORA: () => 'Módulo real y ACTIVO para un cliente real (Piloto Plaza, ver grafo_paquete_cliente.json) y tabla real de Baserow -- pero sin ninguna ficha propia en la bóveda. A diferencia de CRONISTA/EJECUTOR_LOCAL (que sí tienen Personaje), AGORA no tiene gobernanza narrativa todavía pese a estar corriendo de verdad. Hueco real concreto.',
  EJECUTOR_LOCAL: () => 'Módulo real y ACTIVO para un cliente real (Piloto Plaza) -- prototipo ya probado con éxito (ver memoria de sesión "Ejecutor Local (prototipo)"), pero sin ficha propia en la bóveda. Mismo hueco que AGORA.',
};

const CANDIDATAS_NUEVA_FICHA = {
  'Vision Mision': 'Referenciado como documento real externo ("[[Vision Mision|VISION_MISION.md]]", asesoría estratégica, 2026-08-17) en Estilo.md -- existe de verdad, pero no como ficha/fichero dentro de la bóveda todavía. Candidata a integrarse (traer el documento real a la bóveda o dejar una ficha-puente que apunte a él).',
  'Física': 'Citado en Estilo.md como principio fundacional real ("es el mismo principio que ya rige la Física y las Leyes de este universo"), a la altura de las Reglas -- sin ficha propia. Aviso honesto: su fuente "codigo_appsscript" es RUIDO -- coincide por texto con funciones sobre jerarquía FÍSICA de materiales (ej. `continuarJerarquiaFisicaLaTroballa`), un sentido de la palabra totalmente distinto, no evidencia real de integración.',
};

const YA_CUBIERTO_POR_GRAFO_PROPIO = new Set(['91_HISTORIAL', '01_CAMPANAS', '03_PRODUCTOS', '05_PROCESOS', 'PAQUETE_CLIENTE'].map(slug));

function decidirAccionDescartar(e) {
  if (HUECOS_REALES_ENCONTRADOS[e.nombre]) {
    return { accion: 'promover_hueco_real_encontrado', razon: HUECOS_REALES_ENCONTRADOS[e.nombre]() };
  }
  if (CANDIDATAS_NUEVA_FICHA[e.nombre]) {
    return { accion: 'revisar_candidata_nueva_ficha', razon: CANDIDATAS_NUEVA_FICHA[e.nombre] };
  }
  if (YA_CUBIERTO_POR_GRAFO_PROPIO.has(e.slug)) {
    return { accion: 'ya_cubierto_grafo_propio', razon: 'Ya tiene un grafo real propio construido hoy (91_HISTORIAL / jerarquía Campaña→Tarea / PAQUETE_CLIENTE, ver sheet-real.html) -- el censo no lo detecta porque esos grafos no incluyen el nombre de la propia pestaña/tabla como nodo, solo sus instancias. No es un hueco: es un límite de cómo se construyó el censo, no del sistema real.' };
  }
  if (e.tiposCandidato.some(t => t.startsWith('entidad_negocio_'))) {
    return { accion: 'historico_instancia_negocio', razon: 'Instancia real y específica (una tarea/proceso/proyecto/producto/campaña concreta), no un tipo de entidad -- correctamente fuera del alcance de la capa de gobernanza (Espacio/Personaje/Recurso describe el sistema, no cada dato operativo). Sin acción.' };
  }
  if (['cliente_real'].some(t => e.tiposCandidato.includes(t))) {
    return { accion: 'historico_dato_operativo', razon: 'Cliente real (dato de negocio), no una entidad del universo de gobernanza -- misma distinción ya establecida en recurso.schema.json (clase operativo_gobierno vs. fisico_negocio). Sin acción.' };
  }
  if (e.tiposCandidato.includes('workflow_n8n')) {
    return { accion: 'historico_detalle_implementacion', razon: 'Nombre literal de un workflow n8n concreto, no un concepto nuevo -- ya cubierto por la ficha de su Personaje/Espacio real (Telar, Cronista). No necesita ficha propia.' };
  }
  if (e.tiposCandidato.some(t => t.startsWith('pestana_sheet'))) {
    return { accion: 'historico_pestana_sin_huella', razon: `Pestaña real del Sheet (${e.corroboracionCruzada} fuente(s): ${e.fuentes.join(', ') || 'ninguna'}) con huella hoy insuficiente fuera del propio Sheet -- no amerita ficha nueva todavía. Revisar de nuevo si gana uso real (código, Baserow, bóveda).` };
  }
  if (e.tiposCandidato.includes('tabla_baserow')) {
    return { accion: 'historico_tabla_sin_huella', razon: `Tabla real de Baserow (${e.corroboracionCruzada} fuente(s): ${e.fuentes.join(', ') || 'ninguna'}) sin huella real todavía fuera de su propia definición -- misma nota que PERSONAJE en §8.20: se deja como histórico hasta que tenga uso real, no se fuerza una equivalencia.` };
  }
  return { accion: 'historico_sin_accion', razon: 'Evidencia real insuficiente hoy y sin patrón aplicable -- se deja como histórico, no se descarta el nombre del censo.' };
}

function main() {
  const censo = JSON.parse(readFileSync(RUTA_CENSO, 'utf-8'));

  for (const e of censo.entidades) {
    if (e.decision === 'confirmar') {
      e.accionRecomendada = 'confirmar_ya_solido';
      e.accionRazon = 'Ya bien corroborado en el primer censo (≥4 fuentes reales) -- consolidado sin cambios. Candidato a enriquecer con `vinculoReal` explícito usando las fuentes ya encontradas.';
    } else if (e.decision === 'revisar') {
      const r = decidirAccionRevisar(e);
      e.accionRecomendada = r.accion;
      e.accionRazon = r.razon;
    } else if (e.decision === 'promover') {
      const r = decidirAccionPromover(e);
      e.accionRecomendada = r.accion;
      e.accionRazon = r.razon;
    } else if (e.decision === 'descartar') {
      const r = decidirAccionDescartar(e);
      e.accionRecomendada = r.accion;
      e.accionRazon = r.razon;
    }
  }

  const resumenAccion = {};
  for (const e of censo.entidades) {
    if (!e.accionRecomendada) continue;
    resumenAccion[e.accionRecomendada] = (resumenAccion[e.accionRecomendada] || 0) + 1;
  }
  censo.consolidacion = {
    generadoEn: new Date().toISOString(),
    fuentesAdicionales: ['modulos_ids_js (MODULO_POR_ENTIDAD_MVP real)', 'telar_b2_real (transcripciones reales de deliberación)', 'correspondencias verificadas a mano'],
    resumenAccion,
  };

  writeFileSync(RUTA_CENSO, JSON.stringify(censo, null, 2), 'utf-8');

  const RUTA_MD = join(DIR, '..', '..', '..', 'HALLAZGOS_ENTIDADES_REALES.md');
  const l = [];
  l.push('');
  l.push('---');
  l.push('');
  l.push('## Consolidación real (confirmar + promover + revisar + descartar)');
  l.push('');
  l.push('Segunda pasada pedida explícitamente sobre las 103 entidades de los tres primeros grupos ("investiga y termina de consolidarlo"), más una investigación real del grupo descartar con el criterio explícito dado: "si encontramos huecos en el grafo global será nuestra primera fuente de posibilidad, si al final no tiene sentido, lo dejamos como histórico".');
  l.push('');
  l.push('Dos fuentes reales más que el primer censo no tenía: el catálogo real `MODULO_POR_ENTIDAD_MVP` de `src/Ids.js` (más fuerte que coincidencia de texto -- es el propio código), y las transcripciones reales ya ocurridas en `tools/gobierno/telar/b2/respuestas_originales/`. Más un puñado de correspondencias verificadas a mano leyendo el fichero real, nunca adivinadas.');
  l.push('');
  l.push('### Bug real encontrado y corregido investigando');
  l.push('');
  l.push('`cargar_grafo_wikilinks.mjs` derivaba el destino de una relación desde el NOMBRE DEL FICHERO, no desde el cuerpo real -- para relaciones con varios destinos (p.ej. `Concilio depende_de 7 Acervos-o-mecanismos.md`) esto producía una entidad falsa ("7 Acervos-o-mecanismos") en vez de las 7 aristas reales hacia los 7 Acervos reales que sí están, como wikilinks, en el cuerpo del fichero. Corregido: ahora lee los wikilinks reales del cuerpo. Efecto real: 222→220 candidatas, 2 entidades fantasma menos, 8 aristas reales más.');
  l.push('');
  l.push('### Los 5 huecos reales concretos encontrados en el grupo descartar (investigado a mano, no por regla)');
  l.push('');
  l.push('- **VIGILIA_TAREA, DOCUMENTO_ENGREMIAT, METRICA_FABRICACION** -- 3 tablas reales de Baserow tocadas de verdad por scripts reales (`ciclo_autonomo.mjs`, `prompter_lote_autociclo.mjs`, `sembrar_mecanismos.mjs`, `coordinador.mjs`...), que se quedaron por debajo del umbral de "promover" (3 fuentes) solo por no aparecer también en Sheet/n8n/bóveda -- no por falta de evidencia real. Verificado leyendo `grafo_node.json`.');
  l.push('- **AGORA, EJECUTOR_LOCAL** -- módulos reales y ACTIVOS para el cliente real Piloto Plaza (ver `grafo_paquete_cliente.json`), sin ninguna ficha propia en la bóveda -- a diferencia de CRONISTA, que sí tiene su Personaje. Hueco real de gobernanza: están corriendo de verdad pero sin ficha que los gobierne.');
  l.push('');
  l.push('### 2 candidatas reales a ficha nueva (referenciadas de verdad, sin ficha)');
  l.push('');
  l.push('- **"Vision Mision"** -- citado en `Estilo.md` como documento real externo (`VISION_MISION.md`, asesoría estratégica, 2026-08-17), nunca integrado en la bóveda.');
  l.push('- **"Física"** -- citado en `Estilo.md` como principio fundacional real, a la altura de las Reglas ("el mismo principio que ya rige la Física y las Leyes de este universo"), sin ficha propia. Aviso: su fuente "codigo_appsscript" es ruido -- coincide por texto con funciones de jerarquía FÍSICA de materiales, sentido totalmente distinto.');
  l.push('');
  l.push('### 5 que YA tienen grafo real propio -- el censo no las veía por cómo se construyó, no por un hueco real');
  l.push('');
  l.push('`91_HISTORIAL`, `01_CAMPANAS`, `03_PRODUCTOS`, `05_PROCESOS`, `PAQUETE_CLIENTE` -- los 4 grafos reales de negocio construidos en §8.22 no incluyen el nombre de la propia pestaña/tabla como nodo (solo sus instancias), así que el censo por nombre no podía verlos. Corrección honesta, no un hallazgo nuevo.');
  l.push('');
  l.push('### El resto del grupo descartar (~108 entidades): histórico, tal como se pidió');
  l.push('');
  l.push('Clasificado por patrón real, no dejado sin mirar: instancias específicas de negocio (una tarea/proceso/proyecto concreto -- correctamente fuera de la capa de gobernanza), pestañas/tablas reales con huella hoy insuficiente, y detalles de implementación ya cubiertos por su Personaje/Espacio real (p.ej. el nombre literal de un workflow n8n). Ver `censo_entidades.json` para el detalle entidad por entidad.');
  l.push('');
  l.push('| acción recomendada | cuántas | qué significa |');
  l.push('|---|---|---|');
  const explicaciones = {
    confirmar_ya_solido: 'Ya bien corroborado (≥4 fuentes) en el primer censo -- sin cambios, candidato a enriquecer con `vinculoReal`.',
    confirmar_codigo_real: 'Correspondencia real de código encontrada -- confirmado.',
    confirmar_patron_tecnico: 'Real en el código, pero NO es un módulo de negocio MVP -- es un patrón técnico interno (Repository, IntegrityService...). Revisar si el `tipo` en la ficha es el correcto.',
    confirmar_uso_real_telar: 'Sin script propio, pero con deliberación real ya ocurrida en Telar B2 -- personaje activo de verdad.',
    confirmar_verificado_a_mano: 'Correspondencia confirmada leyendo el fichero real a mano (nombre distinto en bóveda vs. código).',
    correcto_narrativo: 'Contenido narrativo/bitácora por diseño -- baja corroboración es lo esperado, no un hueco.',
    revisar_nombre_narrativo: 'Nombre narrativo del universo -- el cruce por texto no alcanza su referente real. No es evidencia de que falte, es un límite del método. Acción: añadir `vinculoReal` explícito.',
    revisar_manual_real: 'Sin patrón claro aplicable -- necesita revisión humana real antes de decidir.',
    promover_recurso_real: 'Pestaña/tabla real bien corroborada -- candidata sólida a ficha de Recurso o a `vinculoReal` en una ficha existente.',
    revisar_inconsistencia_nombres: 'No falta una entidad -- falta consistencia de nombres entre wikilinks y fichas reales ya existentes.',
    descartar_termino_generico: 'Palabra genérica (TAREA, DOCUMENTO...) que aparece en muchas tablas sin ser ella misma una entidad -- ya existen las entidades específicas reales. No promover.',
    promover_hueco_real_encontrado: 'Hueco real concreto encontrado investigando el grupo descartar -- evidencia real de código o uso, por debajo del umbral solo por estrechez de fuentes.',
    revisar_candidata_nueva_ficha: 'Referenciado de verdad en una ficha real, sin ficha propia -- candidata legítima a nueva ficha.',
    ya_cubierto_grafo_propio: 'Ya tiene un grafo real propio (91_HISTORIAL / jerarquía / PAQUETE_CLIENTE) -- el censo no lo veía por cómo se construyó, no es un hueco real.',
    historico_instancia_negocio: 'Instancia real específica de negocio (una tarea/proceso/proyecto concreto) -- fuera del alcance de la capa de gobernanza. Histórico.',
    historico_dato_operativo: 'Dato operativo real (un cliente) -- no una entidad del universo de gobernanza. Histórico.',
    historico_detalle_implementacion: 'Detalle de implementación (nombre literal de un workflow) ya cubierto por su Personaje/Espacio real. Histórico.',
    historico_pestana_sin_huella: 'Pestaña real del Sheet con huella hoy insuficiente fuera de sí misma. Histórico, revisar si gana uso real.',
    historico_tabla_sin_huella: 'Tabla real de Baserow sin huella real todavía. Histórico, misma nota que PERSONAJE en §8.20.',
    historico_sin_accion: 'Evidencia real insuficiente y sin patrón aplicable. Histórico.',
  };
  for (const [k, v] of Object.entries(resumenAccion).sort((a, b) => b[1] - a[1])) {
    l.push(`| ${k} | ${v} | ${explicaciones[k] || ''} |`);
  }
  l.push('');
  l.push('Detalle completo, entidad por entidad, con su razón real: ver `censo_entidades.json` (campos `accionRecomendada` + `accionRazon`) o la vista filtrable en `entidades.html`.');
  l.push('');
  writeFileSync(RUTA_MD, readFileSync(RUTA_MD, 'utf-8') + l.join('\n'), 'utf-8');

  console.log('=== Consolidación real: confirmar + promover + revisar + descartar ===');
  for (const [k, v] of Object.entries(resumenAccion).sort((a, b) => b[1] - a[1])) console.log(`  ${v}\t${k}`);
  console.log('Escrito en: ' + RUTA_CENSO);
}

main();
