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

Roster real (elige exactamente 2, varia la pareja entre preguntas del mismo lote -- evita repetir siempre Tecnico+Logico):
${ROSTER_ACERVOS}

Responde SOLO JSON: {"contexto": "...", "pregunta": "... (pide el porque explicitamente)", "personas_sugeridas": [{"nombre":"...","enfoque":"..."},{"nombre":"...","enfoque":"..."}], "tabla_relevante": "NOMBRE_TABLA_BASEROW real o vacio -- NUNCA una tabla del Sheet de Google aunque se mencione en el contexto", "justificacion_eleccion_personas": "..."}`;

const contextoComun = `Contexto real de Engremiat, esta misma sesion: se construyo el Coordinador (tools/coordinador.mjs) -- verifica una respuesta contra hechos reales (campos de Baserow via esquema real, capacidades via catalogo real de mecanismos en DOCUMENTO_ENGREMIAT con TIPO=mecanismo_real), y si esta limpia la atomiza en sub-preguntas. Se probo con datos reales dos niveles de profundidad (tope TOPE_PROFUNDIDAD=2). Se añadio un ciclo de correccion: si sale marcada, se le pide a DeepSeek corregir solo lo detectado y se re-verifica una vez. Se instrumento el gasto real en la tabla GASTO_API (id 285) y una metrica de tasa de fabricacion en METRICA_FABRICACION (id 1039). Todo esto ha sido disparado MANUALMENTE por Claude toda la noche: sembrar filas en VIGILIA_TAREA (tabla 287), disparar el webhook temp-kick-vision-global del workflow n8n "Cronista - Segmentar documento en tareas" (puerto 5680), limpiar locks colgados a mano cuando fallaba, leer resultados de vuelta. El workflow real vive ahora versionado en tools/n8n-workflows/ (con tokens redactados). Se encontraron y corrigieron 8 nodos con el token de Baserow viejo (ya filtrado en el incidente de GitGuardian de anoche) hardcodeado -- el sandbox de Code node de esta version de n8n NO soporta this.getCredentials() ni this.helpers.httpRequestWithAuthentication(), asi que el hardcode de token sigue siendo la unica via funcional hoy.`;

const necesidades = [
  'Como se podria automatizar el disparo secuencial del autociclo del Coordinador (sembrar -> disparar -> esperar resultado -> limpiar locks colgados -> leer -> repetir) sin que un humano tenga que ejecutar cada paso a mano, dado que hoy Claude lo hizo todo manualmente.',
  'Dado que el sandbox de Code node de esta version de n8n no soporta ninguna forma de acceso a credenciales nativas, que alternativa concreta (nodos HTTP Request nativos con la credencial httpHeaderAuth ya existente, u otra) permitiria eliminar el hardcode del token de Baserow sin romper la logica actual de los 7 nodos afectados.',
  'El roster de Acervos tiende a repetir siempre el mismo par (Tecnico+Logico) cuando se generan varias preguntas de un lote -- que criterio concreto deberia aplicar el Acervo Prompter para variar la pareja de forma que aporte perspectivas realmente distintas segun el tipo de pregunta (diseno vs explicacion/justificacion).',
  'Con el tope de profundidad del Coordinador ya probado hasta nivel 2, que criterio objetivo (no solo intuicion) deberia decidir cuando esta justificado subir el tope a nivel 3, dado que la tasa de fabricacion en nivel 2 fue similar a la de nivel 1.',
  'Cuando el disparo del pipeline real falla por un lock colgado o un error de red transitorio (como paso varias veces esta noche), que mecanismo de reintento automatico seria seguro de añadir sin arriesgar procesar la misma fila dos veces ni perder el freno de Relevo humano.'
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
    console.log('=== generando: ' + n.slice(0, 70) + '... ===');
    const { salida, usage, ms } = await generarPregunta(n);
    console.log('  ' + ms + 'ms | tabla_relevante: ' + (salida.tabla_relevante || '(vacio)') + ' | personas: ' + salida.personas_sugeridas.map(p=>p.nombre).join('+'));
    resultados.push({ necesidad: n, ...salida });
  }
  writeFileSync('C:/Users/pc/AppData/Local/Temp/claude/G--Mi-unidad-DEVS/8d5c5706-0aac-4c2a-9810-71ffffbdee92/scratchpad/prompter_lote_autociclo_resultado.json', JSON.stringify(resultados, null, 1));
  console.log('\nGuardado', resultados.length, 'preguntas generadas.');
}
main();
