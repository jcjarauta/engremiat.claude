import { readFileSync, writeFileSync } from 'node:fs';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_KEY = readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.deepseek_key', 'utf-8').trim();

const ROSTER_ACERVOS = `
- Acervo Tecnico: implementable, mantenible, coste real de construir.
- Acervo Logico: cadena de causa-efecto, sin saltarse pasos.
- Acervo Logistico: flujo real de trabajo, quien/cuando/con que recursos.
- Acervo Narrativo: coherencia de la historia, tono, continuidad.
- Acervo Filosofico: por que y a quien sirve, soberania, dignidad, Nothing About Us Without Us.
- Acervo Usuario: perspectiva de quien usa esto sin saber nada de por dentro.
- Acervo Sociocracia: consentimiento no mayoria, legitimidad del proceso de decision.
`.trim();

const SYSTEM_PROMPT = `Eres el Acervo Prompter de Engremiat. Convierte una necesidad vaga en UNA pregunta de Vigilia bien estructurada (meta-prompting: das la estructura del razonamiento, no la respuesta).

Roster real (elige exactamente 2):
${ROSTER_ACERVOS}

Responde SOLO JSON: {"contexto": "...", "pregunta": "... (pide el porque explicitamente)", "personas_sugeridas": [{"nombre":"...","enfoque":"..."},{"nombre":"...","enfoque":"..."}], "tabla_relevante": "NOMBRE_TABLA_BASEROW real o vacio -- NUNCA una tabla del Sheet de Google aunque se mencione en el contexto", "justificacion_eleccion_personas": "..."}`;

const contextoComun = `Contexto real de Engremiat: se construyo DOCUMENTO_ENGREMIAT (Baserow, 56 filas: 46 documentos + 10 mecanismos reales, campo TIPO distingue ambos) y un vault de Obsidian generado desde ahi, dentro de Google Drive, como vista de solo lectura. Resultados previos reales sobre su organizacion:
- OBS1 (solida): propuso jerarquia [PROYECTO]/[TIPO_DOCUMENTO]/[ESTADO]/[TEMA]/[NOMBRE].md, estaciones de la Rueda del Gremio como metadato en frontmatter (no carpetas).
- OBS3 (solida pero contradice OBS1): propuso las 7 estaciones como carpetas de primer nivel (_oportunidad/, _relevo/...), con reglas de mapeo ESTADO->carpeta inventadas sin avisar.
- PEND1 (resuelve la contradiccion a favor de frontmatter) -- PERO contenia una afirmacion fabricada ("el Sheet 13_INCIDENCIAS opera con relaciones transversales y consultas en tiempo real") detectada por el nuevo verificador de capacidades -- la conclusion (frontmatter) no se ha revalidado limpia de esa fabricacion.
- PEND2 (solida): 30 documentos como umbral para dividir una carpeta plana en subcarpetas.
- OBS4 (solida): convencion [CLIENTE]_[PROYECTO] para documentar un cliente nuevo.
- OBS5: fallo tecnico, sin resultado (era sobre el mismo tema que PEND2, ya cubierto).
Ahora existen DOS verificadores reales para filtrar fabricacion antes de confiar en cualquier respuesta nueva: verificador de campos/tablas de Baserow, y verificador de capacidades/mecanismos (contra un catalogo real).`;

const necesidades = [
  'Revalidar si "frontmatter, no carpetas por estacion" (la conclusion de PEND1) se sostiene solo con argumentos reales, quitando la afirmacion fabricada sobre el Sheet -- sin dar la conclusion anterior por buena solo porque ya se dijo.',
  'Decidir si Engremiat necesita UNA sola boveda de Obsidian para todo, o VARIAS bovedas separadas (una por PROYECTO/cliente) -- con la convencion de nombres ya definida en OBS4, cuando conviene cada opcion.',
  'Como debe representarse en el vault la nueva categoria TIPO=mecanismo_real (los 10 mecanismos reales construidos esta noche) -- una carpeta propia, o integrada con los documentos.',
  'Disenar el script real de migracion: pasar de la estructura plana actual (Documentos/nombre.md) a la estructura final decidida -- que pasos concretos, en que orden, sin perder los wikilinks ya generados.',
  'Con 56 filas ya en DOCUMENTO_ENGREMIAT y creciendo con cada sesion, como se automatiza que el vault se regenere solo (hoy es manual) sin arriesgar sobrescribir ediciones humanas si algun dia se permiten.'
];

async function generarPregunta(necesidad) {
  const t0 = Date.now();
  const r = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + DEEPSEEK_KEY },
    body: JSON.stringify({
      model: 'deepseek-chat', temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'NECESIDAD VAGA: ' + necesidad + '\n\nCONTEXTO REAL DISPONIBLE:\n' + contextoComun }
      ]
    })
  });
  const j = await r.json();
  const ms = Date.now() - t0;
  if (!j.choices) throw new Error('DeepSeek error: ' + JSON.stringify(j).slice(0, 300));
  const salida = JSON.parse(j.choices[0].message.content.replace(/```json|```/g, '').trim());
  return { salida, usage: j.usage || {}, ms };
}

async function main() {
  const resultados = [];
  for (const n of necesidades) {
    console.log('=== generando: ' + n.slice(0, 60) + '... ===');
    const { salida, usage, ms } = await generarPregunta(n);
    console.log('  ' + ms + 'ms | tabla_relevante: ' + (salida.tabla_relevante || '(vacio)'));
    resultados.push({ necesidad: n, ...salida });
  }
  writeFileSync('C:/Users/pc/AppData/Local/Temp/claude/G--Mi-unidad-DEVS/8d5c5706-0aac-4c2a-9810-71ffffbdee92/scratchpad/prompter_lote_bovedas_resultado.json', JSON.stringify(resultados, null, 1));
  console.log('\nGuardado', resultados.length, 'preguntas generadas.');
}
main();
