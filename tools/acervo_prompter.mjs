// Acervo Prompter -- convierte una necesidad vaga (o una incidencia real)
// en una pregunta de Vigilia bien estructurada, aplicando meta-prompting
// (estructura del razonamiento, no contenido especifico).
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

const SYSTEM_PROMPT = `Eres el Acervo Prompter de Engremiat. Tu trabajo es convertir una necesidad vaga o una incidencia real en UNA pregunta de investigacion de Vigilia bien estructurada -- aplicando meta-prompting: das la ESTRUCTURA del razonamiento que hace falta, no el contenido de la respuesta (eso lo genera Concilio despues, tu no respondes la pregunta, la formulas).

Roster real de Acervos disponibles (elige exactamente 2, los mas adecuados a esta necesidad concreta):
${ROSTER_ACERVOS}

Responde SOLO con JSON valido, sin texto fuera del JSON, con esta forma exacta:
{
  "contexto": "parrafo de contexto real y verificable -- NUNCA inventes datos, si no tienes contexto suficiente dilo explicitamente en vez de rellenar con suposiciones",
  "pregunta": "pregunta concreta, accionable, que pida explicitamente el PORQUE ademas del QUE",
  "personas_sugeridas": [ { "nombre": "Acervo X", "enfoque": "su enfoque real, copiado del roster" }, { "nombre": "Acervo Y", "enfoque": "..." } ],
  "tabla_relevante": "NOMBRE_TABLA_BASEROW -- IMPORTANTE: solo si la pregunta hace afirmaciones sobre campos/tablas que existen literalmente en Baserow (el verificador determinista SOLO conoce el esquema de Baserow, nunca el del Sheet de Google -- 13_INCIDENCIAS, 95_DIARIO_NAVEGACION etc. son del Sheet, NUNCA van aqui aunque se mencionen en el contexto). Si la pregunta es sobre codigo, diseno, o el Sheet, deja este campo como cadena vacia.",
  "justificacion_eleccion_personas": "por que estas 2 voces, no otras, para esta necesidad concreta"
}`;

async function generarPregunta(necesidadVaga, contextoReal) {
  const t0 = Date.now();
  const r = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + DEEPSEEK_KEY },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'NECESIDAD VAGA: ' + necesidadVaga + '\n\nCONTEXTO REAL DISPONIBLE (usalo, no inventes mas alla de esto): ' + contextoReal }
      ]
    })
  });
  const j = await r.json();
  const ms = Date.now() - t0;
  if (!j.choices) throw new Error('DeepSeek error: ' + JSON.stringify(j).slice(0, 300));
  let salida;
  try { salida = JSON.parse(j.choices[0].message.content.replace(/```json|```/g, '').trim()); }
  catch (e) { throw new Error('No se pudo parsear JSON de salida: ' + j.choices[0].message.content.slice(0, 300)); }
  return { salida, usage: j.usage || {}, ms };
}

async function main() {
  // Caso de prueba real: el propio hueco pendiente de INC-0067 (verificador determinista)
  const necesidad = 'Extender el verificador determinista de Vigilia para que detecte tambien campos reales de una sola palabra (ej. NOMBRE, ESTADO), no solo compuestos con guion bajo.';
  const contexto = 'Registrado como INC-0067 en 13_INCIDENCIAS del Sheet real de Engremiat. El verificador (tools/verificador_determinista.mjs, cableado en el nodo "Verificar contra esquema real" del generador n8n) compara candidatos con patron /\\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+){1,5}\\b/g contra el esquema real de Baserow (137 campos, 17 tablas). Probado con exito contra fabricaciones con guion bajo (10/10 detectadas), pero un campo de una sola palabra como NOMBRE o ESTADO no matchea el patron actual y se escapa sin marcar.';

  console.log('=== Acervo Prompter: generando pregunta real ===');
  const { salida, usage, ms } = await generarPregunta(necesidad, contexto);
  console.log(JSON.stringify(salida, null, 1));
  console.log('\nTiempo:', ms + 'ms | tokens:', (usage.prompt_tokens||0) + '/' + (usage.completion_tokens||0));

  writeFileSync('C:/Users/pc/AppData/Local/Temp/claude/G--Mi-unidad-DEVS/8d5c5706-0aac-4c2a-9810-71ffffbdee92/scratchpad/prompter_resultado.json', JSON.stringify({ necesidad, contexto, salida, usage, ms }, null, 1));
}
main();
