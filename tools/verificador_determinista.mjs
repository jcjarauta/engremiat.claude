// Verificador determinista: comprueba afirmaciones de campo de Baserow
// contra el esquema real, NO contra el juicio de otro modelo.
import { readFileSync } from 'node:fs';

const esquemaReal = JSON.parse(readFileSync(process.argv[3] || 'C:/Users/pc/AppData/Local/Temp/claude/G--Mi-unidad-DEVS/8d5c5706-0aac-4c2a-9810-71ffffbdee92/scratchpad/esquema_real_baserow.json', 'utf-8'));
const camposReales = new Set(esquemaReal.map(c => c.campo.toUpperCase()));
const tablasReales = new Set(esquemaReal.map(c => c.tabla.toUpperCase()));

// palabras snake_case (mayus o minus) que suenan a nombre de campo/tabla,
// >=2 partes unidas por guion bajo
const PATRON_CAMPO = /\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+){1,5}\b/g;

// lista de "ruido" -- palabras que no son campos/tablas (siglas conocidas, etc.)
const RUIDO = new Set(['UE', 'IA', 'JSON', 'API', 'URL', 'ID', 'UI', 'UX', 'WCAG', 'HTML', 'CSS', 'SQL', 'HTTP', 'HTTPS', 'CRUD', 'REST']);

function verificar(texto) {
  const candidatos = [...new Set((texto.match(PATRON_CAMPO) || []))].filter(c => !RUIDO.has(c.toUpperCase()));
  const camposVerificados = [];
  const tablasVerificadas = [];
  const noVerificados = [];
  for (const c of candidatos) {
    const C = c.toUpperCase();
    if (camposReales.has(C)) camposVerificados.push(c);
    else if (tablasReales.has(C)) tablasVerificadas.push(c);
    else noVerificados.push(c);
  }
  return { candidatos: candidatos.length, camposVerificados, tablasVerificadas, noVerificados };
}

const textoArg = readFileSync(process.argv[2], 'utf-8');
const resultado = verificar(textoArg);

console.log('=== Verificador determinista ===');
console.log('Candidatos detectados:', resultado.candidatos);
console.log('\nCAMPOS verificados (existen de verdad en Baserow):');
console.log(resultado.camposVerificados.length ? resultado.camposVerificados.map(c=>'  OK '+c).join('\n') : '  (ninguno)');
console.log('\nTABLAS verificadas (existen de verdad en Baserow):');
console.log(resultado.tablasVerificadas.length ? resultado.tablasVerificadas.map(c=>'  OK '+c).join('\n') : '  (ninguno)');
console.log('\nNO VERIFICADOS (mencionados pero NO existen ni como campo ni como tabla):');
console.log(resultado.noVerificados.length ? resultado.noVerificados.map(c=>'  ??  '+c).join('\n') : '  (ninguno)');
