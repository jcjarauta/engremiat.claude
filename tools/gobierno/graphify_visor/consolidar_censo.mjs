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

// Fuentes que coinciden por texto pero se verificaron a mano como RUIDO
// (homonimia), para no confirmar por una evidencia que ya se sabe falsa.
const FUENTES_RUIDO_CONOCIDO = {
  [slug('Física')]: 'Ya creada como ficha real (03_Reglas/Física.md), grounded en tres citas reales ya existentes (Estilo.md, Coordinador.md, GASTO_API.md) -- no en su fuente "codigo_appsscript", que es RUIDO verificado a mano: coincide por texto con funciones sobre jerarquía FÍSICA de materiales (`continuarJerarquiaFisicaLaTroballa`), un sentido de la palabra totalmente distinto.',
};

const TIPOS_NARRATIVOS = new Set(['hilo', 'arco', 'sesion', 'mapa', 'estilo', 'sin_tipo']);

function decidirAccionRevisar(e) {
  const tipos = e.tiposCandidato;
  const s = e.slug;

  if (tipos.some(t => TIPOS_NARRATIVOS.has(t))) {
    return { accion: 'correcto_narrativo', razon: 'Contenido narrativo/bitácora por diseño (hilo/arco/sesión/mapa/estilo) -- baja corroboración fuera de la bóveda es lo esperado, no un hueco. Sin acción.' };
  }

  if (FUENTES_RUIDO_CONOCIDO[s]) {
    return { accion: 'confirmar_verificado_a_mano', razon: FUENTES_RUIDO_CONOCIDO[s] };
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

// Los 5 huecos reales encontrados en la primera investigación (§8.23) ya
// se resolvieron de verdad: VIGILIA_TAREA/METRICA_FABRICACION/
// EJECUTOR_LOCAL resultaron NO ser entidades nuevas -- investigando se
// encontró que Vigilia.md/Coordinador.md/Ejecutor.md ya las narraban de
// verdad, solo les faltaba el vínculo explícito (añadido: sección
// "## Vínculo real" en cada ficha existente, sin tocar el resto).
// AGORA y DOCUMENTO_ENGREMIAT sí eran huecos genuinos -- se les creó su
// ficha real (01_Mundo/Recursos/AGORA.md y DOCUMENTO_ENGREMIAT.md).
const HUECOS_YA_RESUELTOS = {
  VIGILIA_TAREA: 'Investigado y resuelto: no era un hueco de entidad, era un hueco de vínculo -- Vigilia.md ya narraba esta tabla de verdad ("la cola nocturna de Concilio", "el modelo de Ramas"). Añadida sección "## Vínculo real" a la ficha existente, sin tocar el resto.',
  METRICA_FABRICACION: 'Investigado y resuelto: Coordinador.md ya narraba esta métrica de verdad ("verifica lo que vuelve antes de darlo por bueno"). Añadida sección "## Vínculo real" a la ficha existente.',
  EJECUTOR_LOCAL: 'Investigado y resuelto: Ejecutor.md ya decía explícitamente "Existe también en versión Ejecutor Local, contra el worker local en vez de la API". Añadida sección "## Vínculo real" a la ficha existente -- no se creó una ficha nueva porque hubiera sido redundante.',
};

// "Física", "AGORA" y "DOCUMENTO_ENGREMIAT" ya no son candidatas: se
// investigaron y se les creo su ficha real (03_Reglas/Física.md,
// 01_Mundo/Recursos/AGORA.md, 01_Mundo/Recursos/DOCUMENTO_ENGREMIAT.md).
// "Vision Mision" se investigo aparte y NO es una entidad nueva: es una
// fila real ya catalogada dentro de DOCUMENTO_ENGREMIAT (id 4,
// ARCHIVO_HISTORICO/Documentos/VISION_MISION.md), ya marcada a mano
// "estado: revisar" y "contradice a MAPA_DOMINIOS_DATOS" -- exactamente
// el tipo de instancia catalogada que corresponde dejar historica.
const CANDIDATAS_NUEVA_FICHA = {
  'Vision Mision': 'Investigado a mano: no es una entidad nueva -- es una fila real ya catalogada dentro de DOCUMENTO_ENGREMIAT (id 4, ver ARCHIVO_HISTORICO/Documentos/VISION_MISION.md), ya marcada por el propio sistema "estado: revisar" y "contradice a MAPA_DOMINIOS_DATOS" (trata el Sheet como memoria central, superado por el pivote a Baserow/Pi). Correctamente histórico, no promovido -- ya cubierto por la ficha real de DOCUMENTO_ENGREMIAT.',
};

const YA_CUBIERTO_POR_GRAFO_PROPIO = new Set(['91_HISTORIAL', '01_CAMPANAS', '03_PRODUCTOS', '05_PROCESOS', 'PAQUETE_CLIENTE'].map(slug));

function decidirAccionDescartar(e) {
  if (HUECOS_YA_RESUELTOS[e.nombre]) {
    return { accion: 'hueco_real_ya_resuelto', razon: HUECOS_YA_RESUELTOS[e.nombre] };
  }
  if (CANDIDATAS_NUEVA_FICHA[e.nombre]) {
    return { accion: 'historico_instancia_ya_catalogada', razon: CANDIDATAS_NUEVA_FICHA[e.nombre] };
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
  l.push('### Los 5 huecos reales concretos, investigados y resueltos en esta misma sesión');
  l.push('');
  l.push('- **VIGILIA_TAREA, METRICA_FABRICACION, EJECUTOR_LOCAL** -- investigando a fondo (no solo con reglas) se encontró que NO eran entidades nuevas: `Vigilia.md`, `Coordinador.md` y `Ejecutor.md` ya narraban estos tres recursos reales en prosa, solo les faltaba el vínculo explícito. Resuelto añadiendo una sección `## Vínculo real` a cada ficha existente, sin tocar el resto de su contenido -- crear una ficha nueva habría sido redundante.');
  l.push('- **DOCUMENTO_ENGREMIAT, AGORA** -- estos dos sí eran huecos genuinos: módulos/tablas reales y activos sin ninguna ficha que los narrara. Resuelto creando su ficha real: `01_Mundo/Recursos/DOCUMENTO_ENGREMIAT.md` (grounded en el catálogo real de 56 filas, 46 documentos + 10 mecanismos) y `01_Mundo/Recursos/AGORA.md` (honesto sobre ser nascente: activo para un cliente real, sin código ni narrativa propia todavía más allá de eso).');
  l.push('');
  l.push('### 2 candidatas a ficha nueva, investigadas -- 1 resuelta con ficha real, 1 resultó no serlo');
  l.push('');
  l.push('- **"Física"** -- sí era un hueco real: citado ya tres veces en fichas reales (`Estilo.md`, `Coordinador.md`, `GASTO_API.md`) como concepto fundacional, nunca con ficha propia. Creada `03_Reglas/Física.md`, reuniendo sin inventar nada las tres citas ya existentes.');
  l.push('- **"Vision Mision"** -- investigado más a fondo: NO es una entidad nueva. Es una fila real ya catalogada dentro de `DOCUMENTO_ENGREMIAT` (id 4, `ARCHIVO_HISTORICO/Documentos/VISION_MISION.md`), que el propio sistema ya marca "estado: revisar" y "contradice a MAPA_DOMINIOS_DATOS". Correctamente histórico -- ya cubierto por la ficha real de DOCUMENTO_ENGREMIAT recién creada.');
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
    hueco_real_ya_resuelto: 'Hueco real encontrado y ya resuelto en esta misma sesión: se enriqueció con `## Vínculo real` una ficha existente (Vigilia/Coordinador/Ejecutor), sin crear una ficha redundante.',
    historico_instancia_ya_catalogada: 'Investigado a mano: no era una entidad nueva -- ya es una fila catalogada dentro de un Recurso real (p.ej. DOCUMENTO_ENGREMIAT). Histórico, correctamente no promovido.',
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
