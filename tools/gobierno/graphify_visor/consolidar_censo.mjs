#!/usr/bin/env node
/*
 * Consolidacion real del censo de entidades (censo_entidades.json) --
 * segunda pasada pedida explicitamente: "investiga y termina de
 * consolidarlo" sobre confirmar/promover/revisar. El grupo descartar
 * (119) se deja intacto -- se valorara aparte, al final.
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
    }
    // decision === 'descartar': sin tocar, se valora aparte (al final).
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
    pendiente: '119 descartadas: se valoran aparte al final -- si el hueco tiene sentido real se retoma como fuente de posibilidad, si no, quedan como histórico (instrucción explícita del operador).',
  };

  writeFileSync(RUTA_CENSO, JSON.stringify(censo, null, 2), 'utf-8');

  const RUTA_MD = join(DIR, '..', '..', '..', 'HALLAZGOS_ENTIDADES_REALES.md');
  const l = [];
  l.push('');
  l.push('---');
  l.push('');
  l.push('## Consolidación real (confirmar + promover + revisar)');
  l.push('');
  l.push('Segunda pasada pedida explícitamente sobre las 103 entidades de los tres primeros grupos ("investiga y termina de consolidarlo"). El grupo descartar (119) se deja intacto -- se valora aparte, al final, con el criterio ya dado: si revela un hueco real del grafo global es la primera fuente de posibilidad; si no, queda como histórico.');
  l.push('');
  l.push('Dos fuentes reales más que el primer censo no tenía: el catálogo real `MODULO_POR_ENTIDAD_MVP` de `src/Ids.js` (más fuerte que coincidencia de texto -- es el propio código), y las transcripciones reales ya ocurridas en `tools/gobierno/telar/b2/respuestas_originales/`. Más un puñado de correspondencias verificadas a mano leyendo el fichero real, nunca adivinadas.');
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
  };
  for (const [k, v] of Object.entries(resumenAccion).sort((a, b) => b[1] - a[1])) {
    l.push(`| ${k} | ${v} | ${explicaciones[k] || ''} |`);
  }
  l.push('');
  l.push('Detalle completo, entidad por entidad, con su razón real: ver `censo_entidades.json` (campos `accionRecomendada` + `accionRazon`) o la vista filtrable en `entidades.html`.');
  l.push('');
  writeFileSync(RUTA_MD, readFileSync(RUTA_MD, 'utf-8') + l.join('\n'), 'utf-8');

  console.log('=== Consolidación real: confirmar + promover + revisar ===');
  for (const [k, v] of Object.entries(resumenAccion).sort((a, b) => b[1] - a[1])) console.log(`  ${v}\t${k}`);
  console.log('Descartadas (119) sin tocar -- se valoran aparte.');
  console.log('Escrito en: ' + RUTA_CENSO);
}

main();
