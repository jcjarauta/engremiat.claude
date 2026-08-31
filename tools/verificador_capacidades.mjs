// Verificador de capacidades: extrae afirmaciones de capacidad/arquitectura
// de un texto (con LLM, ya que no hay patron regex posible para esto) y
// comprueba cada una contra el catalogo REAL de mecanismos (Baserow),
// no contra el juicio libre de otra IA.
import { readFileSync } from 'node:fs';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_KEY = readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.deepseek_key', 'utf-8').trim();
const BASE = 'http://100.107.171.88';
const TOKEN = readFileSync('G:/Mi unidad/DEVS/engremiat-litellm/.baserow_token', 'utf-8').trim();

async function cargarCatalogoReal() {
  const r = await fetch(BASE + '/api/database/rows/table/1038/?user_field_names=true&filter__TIPO__equal=mecanismo_real&size=100', { headers: { Authorization: TOKEN } });
  const j = await r.json();
  return j.results.map(row => ({ nombre: row.NOMBRE, descripcion: row.TEMA }));
}

async function extraerAfirmaciones(texto) {
  const r = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + DEEPSEEK_KEY },
    body: JSON.stringify({
      model: 'deepseek-chat', temperature: 0.1,
      messages: [
        { role: 'system', content: 'Extrae TODAS las afirmaciones de capacidad, mecanismo o infraestructura que este texto da por existentes o funcionando (no opiniones, no propuestas futuras -- solo lo que se afirma que YA EXISTE o YA HACE algo). Responde SOLO con JSON: {"afirmaciones": ["afirmacion 1 en una frase corta", "afirmacion 2", ...]}. Si no hay ninguna, {"afirmaciones": []}.' },
        { role: 'user', content: texto }
      ]
    })
  });
  const j = await r.json();
  if (!j.choices) throw new Error('DeepSeek error extrayendo: ' + JSON.stringify(j).slice(0,300));
  const contenido = j.choices[0].message.content.replace(/```json|```/g, '').trim();
  return JSON.parse(contenido).afirmaciones;
}

async function comprobarAfirmacion(afirmacion, catalogo) {
  const listaCatalogo = catalogo.map((m, i) => (i+1) + '. ' + m.nombre + ': ' + m.descripcion).join('\n');
  const r = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + DEEPSEEK_KEY },
    body: JSON.stringify({
      model: 'deepseek-chat', temperature: 0,
      messages: [
        { role: 'system', content: 'Este es el catalogo REAL y COMPLETO de mecanismos que existen en Engremiat. No existe nada mas que esto. Dada una afirmacion, responde SOLO con JSON: {"coincide": true/false, "mecanismo": "nombre exacto del catalogo si coincide, o null"}. "coincide":true SOLO si la afirmacion describe razonablemente uno de estos mecanismos reales -- si no está literalmente en la lista, es false, no inventes una coincidencia parcial generosa.\n\nCATALOGO REAL:\n' + listaCatalogo },
        { role: 'user', content: 'AFIRMACION: ' + afirmacion }
      ]
    })
  });
  const j = await r.json();
  if (!j.choices) throw new Error('DeepSeek error comprobando: ' + JSON.stringify(j).slice(0,300));
  const contenido = j.choices[0].message.content.replace(/```json|```/g, '').trim();
  return JSON.parse(contenido);
}

async function verificarTexto(texto) {
  const catalogo = await cargarCatalogoReal();
  const afirmaciones = await extraerAfirmaciones(texto);
  const resultados = [];
  for (const a of afirmaciones) {
    const veredicto = await comprobarAfirmacion(a, catalogo);
    resultados.push({ afirmacion: a, ...veredicto });
  }
  return resultados;
}

async function main() {
  const textoPend1 = `La contradicción se resuelve a favor del frontmatter como metadato dinámico, no por preferencia estética, sino por coherencia con la infraestructura real ya construida esta noche. El laboratorio en Baserow/n8n y el Sheet 13_INCIDENCIAS operan con relaciones transversales y consultas en tiempo real, donde las 7 estaciones funcionan como atributos consultables que se superponen entre incidencias, no como contenedores físicos. Las carpetas de primer nivel impondrían una jerarquía rígida que fragmentaría el flujo de datos, obligando a duplicar información y rompiendo la trazabilidad que el Ejecutor necesita para resolver pendientes. El frontmatter permite que cada nota herede y actualice sus estaciones sin reestructurar el vault.`;

  console.log('=== Verificador de capacidades -- probando contra PEND1 (fabricacion ya conocida a mano) ===\n');
  const resultados = await verificarTexto(textoPend1);
  for (const r of resultados) {
    console.log((r.coincide ? 'OK  ' : '??  ') + r.afirmacion + (r.mecanismo ? ' -> ' + r.mecanismo : ' -> SIN CONFIRMAR EN EL CATALOGO REAL'));
  }
}
main();
